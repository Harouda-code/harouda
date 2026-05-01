// ============================================================================
// Supabase Edge Function: verify-ust-idnr
//
// Sprint 19.B: VIES-Verifikation (EU-Kommission checkVatService).
// Koexistiert mit supabase/functions/validate-ustid (BZSt, DE-only).
// Unterschied:
//   • validate-ustid: BZSt evatr, nur deutsche Abfrage.
//   • verify-ust-idnr: VIES SOAP, EU-27 + NI. Logt in ustid_verifications
//     (Migration 0037) zur § 18e UStG-Nachweispflicht.
//
// Request (POST JSON):
//   {
//     "ustIdnr":          "DE123456789",   // geprüfte VAT-ID (Pflicht)
//     "requesterUstIdnr": "DE987654321",   // eigene VAT-ID (optional)
//     "partnerId":        "uuid" | null,
//     "clientId":         "uuid",          // Mandant (Pflicht)
//     "companyId":        "uuid"           // Kanzlei (Pflicht)
//   }
//
// Response (200):
//   Vollstaendiges UstIdVerification-Objekt, wie in Supabase persistiert.
//
// Error handling:
//   • ungueltiges JSON / Pflichtfeld fehlt → 400
//   • Format-Check fehlschlaegt              → 200 mit status=INVALID (kein VIES-Call)
//   • VIES SOAP-Fault MS_UNAVAILABLE/TIMEOUT → 200 mit status=SERVICE_UNAVAILABLE
//   • Netzwerk / Fetch-Fehler                → 200 mit status=ERROR
//   • Erfolgreicher VIES-Call                → 200 mit status=VALID/INVALID
//
// Deploy:
//   supabase functions deploy verify-ust-idnr
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

const VIES_URL =
  "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";
const VIES_TIMEOUT_MS = 15_000;

type Body = {
  ustIdnr: string;
  requesterUstIdnr?: string | null;
  partnerId?: string | null;
  clientId: string;
  companyId: string;
};

type ParsedVies = {
  valid: boolean;
  requestDate: string | null;
  requestIdentifier: string | null;
  traderName: string | null;
  traderAddress: string | null;
};

type VerificationStatus =
  | "VALID"
  | "INVALID"
  | "PENDING"
  | "SERVICE_UNAVAILABLE"
  | "ERROR";

// --- Format-Vorcheck (einfach, Logik-identisch zu ustIdValidation.ts) -------
function quickFormatValid(ustIdnr: string): { valid: boolean; country: string | null } {
  const raw = ustIdnr.replace(/\s+/g, "").toUpperCase();
  const m = /^([A-Z]{2})(.+)$/.exec(raw);
  if (!m) return { valid: false, country: null };
  const country = m[1];
  const rest = m[2];
  if (country === "DE" && /^[0-9]{9}$/.test(rest)) return { valid: true, country };
  // Fuer alle anderen Laender reicht in der Edge Function ein einfaches
  // Muster (Buchstabe+7-12 Zeichen) — der feine Validator laeuft im
  // Frontend (ustIdValidation.ts).
  if (/^[A-Z0-9]{2,12}$/.test(rest)) return { valid: true, country };
  return { valid: false, country };
}

function soapEnvelope(countryCode: string, vatNumber: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${countryCode}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function extractTag(xml: string, tag: string): string | null {
  const rx = new RegExp(`<[^>]*:?${tag}>([\\s\\S]*?)<\\/[^>]*:?${tag}>`, "i");
  const m = rx.exec(xml);
  return m ? m[1].trim() : null;
}

function parseViesResponse(xml: string): ParsedVies {
  const valid = (extractTag(xml, "valid") ?? "false").toLowerCase() === "true";
  const requestDate = extractTag(xml, "requestDate");
  const requestIdentifier = extractTag(xml, "requestIdentifier");
  const name = extractTag(xml, "name");
  const address = extractTag(xml, "address");
  return {
    valid,
    requestDate: requestDate && requestDate !== "---" ? requestDate : null,
    requestIdentifier:
      requestIdentifier && requestIdentifier !== "---"
        ? requestIdentifier
        : null,
    traderName: name && name !== "---" ? name : null,
    traderAddress: address && address !== "---" ? address : null,
  };
}

function detectSoapFault(xml: string): {
  isFault: boolean;
  code: string | null;
} {
  if (!/soapenv:Fault|soap:Fault|<Fault>/i.test(xml))
    return { isFault: false, code: null };
  const code =
    extractTag(xml, "faultstring") ??
    extractTag(xml, "faultcode") ??
    extractTag(xml, "Reason");
  return { isFault: true, code };
}

function retentionUntil(isoTs: string): string {
  const y = new Date(isoTs).getUTCFullYear();
  return `${y + 10}-12-31`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
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

  const { ustIdnr, requesterUstIdnr, partnerId, clientId, companyId } = body;
  if (!ustIdnr || !clientId || !companyId) {
    return json(
      req,
      { error: "ustIdnr, clientId und companyId sind erforderlich." },
      400
    );
  }

  const createdAt = new Date().toISOString();
  const fmt = quickFormatValid(ustIdnr);
  const cleaned = ustIdnr.replace(/\s+/g, "").toUpperCase();

  // -- 1) Supabase-Client (service_role, bypasses RLS) -----------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, { error: "Edge Function nicht konfiguriert." }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // -- 2) Format-Fehler: sofort INVALID loggen, kein VIES-Call ---------------
  if (!fmt.valid || !fmt.country) {
    return await logAndReturn(req, supabase, {
      status: "INVALID",
      errorMessage: "Ungültiges USt-IdNr-Format.",
      rawResponse: null,
      rawHeaders: null,
      rawUrl: VIES_URL,
      parsed: null,
      createdAt,
      body: { ustIdnr: cleaned, requesterUstIdnr, partnerId, clientId, companyId },
    });
  }

  // -- 3) VIES SOAP-Call -----------------------------------------------------
  const envelope = soapEnvelope(fmt.country, cleaned.slice(2));
  let upstream: Response;
  try {
    upstream = await fetchWithTimeout(
      VIES_URL,
      {
        method: "POST",
        headers: {
          "content-type": "text/xml; charset=UTF-8",
          "SOAPAction": "",
        },
        body: envelope,
      },
      VIES_TIMEOUT_MS
    );
  } catch (err) {
    return await logAndReturn(req, supabase, {
      status: (err as Error).name === "AbortError"
        ? "SERVICE_UNAVAILABLE"
        : "ERROR",
      errorMessage: (err as Error).message,
      rawResponse: null,
      rawHeaders: null,
      rawUrl: VIES_URL,
      parsed: null,
      createdAt,
      body: { ustIdnr: cleaned, requesterUstIdnr, partnerId, clientId, companyId },
    });
  }

  const rawBytes = new Uint8Array(await upstream.arrayBuffer());
  const rawText = new TextDecoder("utf-8").decode(rawBytes);
  const rawBase64 = bytesToBase64(rawBytes);
  const rawHeaders: Record<string, string> = {};
  upstream.headers.forEach((v, k) => {
    rawHeaders[k] = v;
  });

  const fault = detectSoapFault(rawText);
  if (fault.isFault) {
    const unavail =
      fault.code !== null &&
      /MS_UNAVAILABLE|TIMEOUT|SERVICE_UNAVAILABLE/i.test(fault.code);
    return await logAndReturn(req, supabase, {
      status: unavail ? "SERVICE_UNAVAILABLE" : "ERROR",
      errorMessage: `VIES SOAP-Fault: ${fault.code ?? "unknown"}`,
      rawResponse: rawBase64,
      rawHeaders,
      rawUrl: VIES_URL,
      parsed: null,
      createdAt,
      body: { ustIdnr: cleaned, requesterUstIdnr, partnerId, clientId, companyId },
    });
  }

  const parsed = parseViesResponse(rawText);
  return await logAndReturn(req, supabase, {
    status: parsed.valid ? "VALID" : "INVALID",
    errorMessage: null,
    rawResponse: rawBase64,
    rawHeaders,
    rawUrl: VIES_URL,
    parsed,
    createdAt,
    body: { ustIdnr: cleaned, requesterUstIdnr, partnerId, clientId, companyId },
  });
});

// --- Helpers ---------------------------------------------------------------

type LogArgs = {
  status: VerificationStatus;
  errorMessage: string | null;
  rawResponse: string | null;
  rawHeaders: Record<string, string> | null;
  rawUrl: string;
  parsed: ParsedVies | null;
  createdAt: string;
  body: Pick<
    Body,
    "ustIdnr" | "requesterUstIdnr" | "partnerId" | "clientId" | "companyId"
  >;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logAndReturn(req: Request, supabase: any, args: LogArgs): Promise<Response> {
  const payload = {
    company_id: args.body.companyId,
    client_id: args.body.clientId,
    partner_id: args.body.partnerId ?? null,
    requested_ust_idnr: args.body.ustIdnr,
    requester_ust_idnr: args.body.requesterUstIdnr ?? null,
    raw_http_response: args.rawResponse,
    raw_http_response_headers: args.rawHeaders,
    raw_http_request_url: args.rawUrl,
    vies_valid: args.parsed?.valid ?? null,
    vies_request_date: args.parsed?.requestDate ?? null,
    vies_request_identifier: args.parsed?.requestIdentifier ?? null,
    vies_trader_name: args.parsed?.traderName ?? null,
    vies_trader_address: args.parsed?.traderAddress ?? null,
    vies_raw_parsed: args.parsed ?? null,
    verification_status: args.status,
    error_message: args.errorMessage,
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
    return json(req, { error: `Log-Insert fehlgeschlagen: ${error.message}` }, 500);
  }
  return json(req, data, 200);
}

function json(req: Request, obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).btoa(s);
}
