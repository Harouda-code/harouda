// ============================================================================
// Supabase Edge Function: validate-ustid
//
// Sprint 20.A.2 · BZSt evatr + Persistenz in ustid_verifications.
//
// Proxies the BZSt "evatr" USt-ID confirmation endpoint and ab Sprint 20
// logs the result in `ustid_verifications` with verification_source='BZST'.
// Direct browser calls to BZSt are blocked by CORS and the service responds
// in ISO-8859-1, so the server-side proxy is necessary.
//
// BZSt endpoint: https://evatr.bff-online.de/evatrRPC
// Request query params:
//   UstId_1        Requesting company's own USt-IdNr. (required)
//   UstId_2        USt-IdNr. to validate (required)
//   Firmenname     Optional — for qualifizierte Abfrage
//   Ort            Optional
//   PLZ            Optional
//   Strasse        Optional
//   Druck          "nein" by default
//
// Status-Mapping BZSt → UstIdVerificationStatus:
//   200         → VALID
//   201-204     → INVALID
//   215,217-219 → SERVICE_UNAVAILABLE
//   999         → ERROR
//
// Response-Shape (ab Sprint 20):
//   Erfolg: komplette ustid_verifications-Row (JSON).
//   Validation-Error: { error: string } mit status 400.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

const BZSt_URL = "https://evatr.bff-online.de/evatrRPC";

type Body = {
  ownUstId: string;
  partnerUstId: string;
  firmenname?: string;
  ort?: string;
  plz?: string;
  strasse?: string;
  /** Sprint 20.A.2: Pflicht fuer Persistenz. */
  clientId: string;
  companyId: string;
  partnerId?: string | null;
};

type VerificationStatus =
  | "VALID"
  | "INVALID"
  | "PENDING"
  | "SERVICE_UNAVAILABLE"
  | "ERROR";

function extractPairs(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const rx =
    /<value>\s*<string>([^<]+)<\/string>\s*<\/value>\s*<value>\s*<string>([^<]*)<\/string>\s*<\/value>/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function bzstErrorCodeToStatus(code: string): {
  status: VerificationStatus;
  message: string;
} {
  switch (code) {
    case "200":
      return { status: "VALID", message: "USt-IdNr. ist gültig." };
    case "201":
      return { status: "INVALID", message: "USt-IdNr. ist nicht gültig." };
    case "202":
      return {
        status: "INVALID",
        message:
          "USt-IdNr. ist in der Datenbank des EU-Mitgliedsstaats nicht registriert.",
      };
    case "203":
      return {
        status: "INVALID",
        message: "USt-IdNr. ist ungültig oder erst seit heute gültig.",
      };
    case "204":
      return {
        status: "INVALID",
        message:
          "USt-IdNr. war früher gültig, ist aber zum Abfragezeitpunkt ungültig.",
      };
    case "215":
      return {
        status: "SERVICE_UNAVAILABLE",
        message: "Anfrage enthält zu viele Fehler — bitte prüfen.",
      };
    case "217":
      return {
        status: "SERVICE_UNAVAILABLE",
        message:
          "Mitgliedsstaat derzeit nicht erreichbar. Später erneut versuchen.",
      };
    case "218":
      return {
        status: "SERVICE_UNAVAILABLE",
        message: "Qualifizierte Bestätigung zur Zeit nicht möglich.",
      };
    case "219":
      return {
        status: "SERVICE_UNAVAILABLE",
        message: "Fehler bei der Prüfung bei einem ausländischen Mitgliedsstaat.",
      };
    case "999":
      return {
        status: "ERROR",
        message: "Interner Fehler bei BZSt. Bitte später erneut versuchen.",
      };
    default:
      return {
        status: "ERROR",
        message: `Unbekannter ErrorCode ${code}.`,
      };
  }
}

function decodeLatin1(bytes: Uint8Array): string {
  return new TextDecoder("iso-8859-1").decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).btoa(s);
}

function retentionUntil(isoTs: string): string {
  const y = new Date(isoTs).getUTCFullYear();
  return `${y + 10}-12-31`;
}

function json(req: Request, obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(req);
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(req),
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "invalid json" }, 400);
  }

  const {
    ownUstId,
    partnerUstId,
    firmenname,
    ort,
    plz,
    strasse,
    clientId,
    companyId,
    partnerId,
  } = body;
  if (!ownUstId || !partnerUstId) {
    return json(
      req,
      { error: "ownUstId und partnerUstId sind erforderlich." },
      400
    );
  }
  if (!clientId || !companyId) {
    return json(
      req,
      { error: "clientId und companyId sind erforderlich (Sprint 20.A.2)." },
      400
    );
  }

  // -- 1) Supabase-Client (service_role, bypasses RLS) -----------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, { error: "Edge Function nicht konfiguriert." }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // -- 2) BZSt-Call ---------------------------------------------------------
  const params = new URLSearchParams({
    UstId_1: ownUstId.replace(/\s+/g, "").toUpperCase(),
    UstId_2: partnerUstId.replace(/\s+/g, "").toUpperCase(),
    Druck: "nein",
  });
  if (firmenname) params.set("Firmenname", firmenname);
  if (ort) params.set("Ort", ort);
  if (plz) params.set("PLZ", plz);
  if (strasse) params.set("Strasse", strasse);
  const bzstUrl = `${BZSt_URL}?${params.toString()}`;

  const createdAt = new Date().toISOString();
  let upstream: Response;
  try {
    upstream = await fetch(bzstUrl, { method: "GET" });
  } catch (err) {
    // Netzwerk-Fehler → ERROR-Row loggen
    return await logAndReturn(req, supabase, {
      status: "ERROR",
      message: `Verbindung zu BZSt fehlgeschlagen: ${(err as Error).message}`,
      errorCode: "NETWORK",
      rawResponse: null,
      rawHeaders: null,
      rawUrl: bzstUrl,
      pairs: null,
      createdAt,
      body: {
        ownUstId,
        partnerUstId,
        clientId,
        companyId,
        partnerId: partnerId ?? null,
      },
    });
  }

  const rawBytes = new Uint8Array(await upstream.arrayBuffer());
  const text = decodeLatin1(rawBytes);
  const pairs = extractPairs(text);
  const errorCode = pairs.ErrorCode ?? "999";
  const verdict = bzstErrorCodeToStatus(errorCode);
  const rawBase64 = bytesToBase64(rawBytes);
  const rawHeaders: Record<string, string> = {};
  upstream.headers.forEach((v, k) => {
    rawHeaders[k] = v;
  });

  return await logAndReturn(req, supabase, {
    status: verdict.status,
    message: verdict.message,
    errorCode,
    rawResponse: rawBase64,
    rawHeaders,
    rawUrl: bzstUrl,
    pairs,
    createdAt,
    body: {
      ownUstId,
      partnerUstId,
      clientId,
      companyId,
      partnerId: partnerId ?? null,
    },
  });
});

// ---------------------------------------------------------------------------

type LogArgs = {
  status: VerificationStatus;
  message: string;
  errorCode: string;
  rawResponse: string | null;
  rawHeaders: Record<string, string> | null;
  rawUrl: string;
  pairs: Record<string, string> | null;
  createdAt: string;
  body: {
    ownUstId: string;
    partnerUstId: string;
    clientId: string;
    companyId: string;
    partnerId: string | null;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logAndReturn(req: Request, supabase: any, args: LogArgs): Promise<Response> {
  const bzstValid = args.status === "VALID";
  const payload = {
    company_id: args.body.companyId,
    client_id: args.body.clientId,
    partner_id: args.body.partnerId,
    requested_ust_idnr: args.body.partnerUstId,
    requester_ust_idnr: args.body.ownUstId,
    raw_http_response: args.rawResponse,
    raw_http_response_headers: args.rawHeaders,
    raw_http_request_url: args.rawUrl,
    vies_valid: null,
    vies_request_date: null,
    vies_request_identifier: null,
    vies_trader_name: args.pairs?.Firmenname ?? null,
    vies_trader_address:
      [args.pairs?.Strasse, args.pairs?.PLZ, args.pairs?.Ort]
        .filter(Boolean)
        .join(" ") || null,
    vies_raw_parsed: { bzst: true, errorCode: args.errorCode, pairs: args.pairs },
    verification_status: args.status,
    verification_source: "BZST",
    error_message: bzstValid ? null : args.message,
    retention_until: retentionUntil(args.createdAt),
    retention_hold: false,
    retention_hold_reason: null,
  };
  const { data, error } = await supabase
    .from("ustid_verifications")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    return json(
      req,
      { error: `Log-Insert fehlgeschlagen: ${error.message}` },
      500
    );
  }
  return json(req, data, 200);
}
