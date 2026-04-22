/**
 * Sprint 20.A.2 · BZSt ↔ VIES Router.
 *
 * Entscheidet pro USt-IdNr-Prüfung, ob die Abfrage an das BZSt
 * (qualifizierte Bestätigung § 18e UStG, DE-only-Gate) oder an VIES
 * (EU-Kommissions-Dienst) geht, und fällt bei BZSt-Ausfall auf VIES
 * zurück. Beide Fälle persistieren in `ustid_verifications` mit
 * entsprechendem `verification_source`.
 *
 * Entscheidungstabelle:
 *   requester  target   → Route
 *   -------------------------------
 *   DE         DE       → BZST
 *   DE         EU-other → BZST (qualifizierte EU-Bestätigung via BZSt)
 *   non-DE     *        → VIES
 *   (fehlt)    *        → VIES (Fallback ohne requester)
 *
 * Fallback:
 *   BZST → SERVICE_UNAVAILABLE → zusätzlich VIES-Call,
 *     beide Rows landen im Log (erste mit BZST, zweite mit VIES),
 *     Rückgabe ist die VIES-Row.
 *   BZST → ERROR → kein Fallback, ERROR-Row ist finale Antwort.
 *   VIES → throw → throw weiter an Aufrufer.
 */

import type {
  BusinessPartner,
  UstIdVerification,
  UstIdVerificationStatus,
  UstIdVerificationSource,
} from "../types/db";
import { validateUstIdnrFormat } from "../domain/partners/ustIdValidation";
import { supabase } from "./supabase";
import { shouldUseSupabase } from "./db";
import { logVerification } from "./ustidVerifications";
import { uid } from "./store";

export type RouterOptions = {
  requesterUstIdnr?: string | null;
  /** Mandant (client_id, Pflicht fuer RLS-Persistenz). */
  clientId: string;
  /** Kanzlei (company_id, Pflicht fuer RLS-Persistenz). */
  companyId: string;
};

export type RouterDecision = {
  route: UstIdVerificationSource;
  reason: string;
};

/** Zieht die 2-Buchstaben-Country aus "DE123456789" → "DE". */
function countryOf(ustIdnr: string | null | undefined): string | null {
  if (!ustIdnr) return null;
  const r = validateUstIdnrFormat(ustIdnr);
  return r.country;
}

/**
 * Deterministische Routing-Entscheidung — reiner Function, keine
 * Seiteneffekte. Export für Tests.
 */
export function decideRoute(
  targetUstIdnr: string | null | undefined,
  requesterUstIdnr: string | null | undefined
): RouterDecision {
  const targetCountry = countryOf(targetUstIdnr);
  const requesterCountry = countryOf(requesterUstIdnr);

  if (!requesterCountry) {
    return {
      route: "VIES",
      reason: "Keine Requester-USt-IdNr gepflegt → VIES-Fallback.",
    };
  }
  if (requesterCountry !== "DE") {
    return {
      route: "VIES",
      reason: `Requester ${requesterCountry} ≠ DE → VIES.`,
    };
  }
  // Requester ist DE → BZSt hat in DE rechtlichen Vorrang,
  // auch für intra-EU-Anfragen (qualifizierte Bestätigung).
  void targetCountry; // derzeit nicht entscheidungsrelevant
  return {
    route: "BZST",
    reason: "Requester=DE → BZSt (qualifizierte Bestätigung § 18e UStG).",
  };
}

// ---------------------------------------------------------------------------
// DEMO-Mock für Supabase-Aus
// ---------------------------------------------------------------------------

function demoMockVerification(
  partner: BusinessPartner,
  opts: RouterOptions,
  source: UstIdVerificationSource
): Parameters<typeof logVerification>[0] {
  const fmt = validateUstIdnrFormat(partner.ust_idnr ?? "");
  const status: UstIdVerificationStatus = fmt.valid ? "VALID" : "INVALID";
  return {
    company_id: partner.company_id,
    client_id: partner.client_id,
    partner_id: partner.id,
    requested_ust_idnr: partner.ust_idnr ?? "",
    requester_ust_idnr: opts.requesterUstIdnr ?? null,
    raw_http_response: null,
    raw_http_response_headers: null,
    raw_http_request_url:
      source === "BZST" ? "demo://mock-bzst" : "demo://mock-vies",
    vies_valid: source === "VIES" ? fmt.valid : null,
    vies_request_date:
      source === "VIES" && fmt.valid
        ? new Date().toISOString().slice(0, 10)
        : null,
    vies_request_identifier: source === "VIES" && fmt.valid ? `DEMO-${uid()}` : null,
    vies_trader_name: fmt.valid ? partner.name : null,
    vies_trader_address: fmt.valid
      ? [partner.anschrift_strasse, partner.anschrift_plz, partner.anschrift_ort]
          .filter(Boolean)
          .join(" ")
      : null,
    vies_raw_parsed: { demo: true, source, format: fmt },
    verification_status: status,
    verification_source: source,
    error_message: fmt.valid ? null : fmt.error ?? "Format invalid",
    retention_hold: false,
    retention_hold_reason: null,
    created_by: null,
  };
}

// ---------------------------------------------------------------------------
// Haupt-Entry-Point
// ---------------------------------------------------------------------------

/**
 * Stößt eine USt-IdNr-Prüfung mit BZSt/VIES-Routing an und
 * persistiert das Ergebnis in `ustid_verifications`.
 *
 * Wirft nur bei Netzwerk-/Auth-Fehlern, die KEIN Log erlauben.
 * Fachliche Ablehnungen (INVALID, SERVICE_UNAVAILABLE, ERROR) sind
 * im Return-Objekt enthalten.
 */
export async function routedVerifyUstIdnr(
  partner: BusinessPartner,
  opts: RouterOptions
): Promise<UstIdVerification> {
  if (!partner.ust_idnr) {
    throw new Error(
      `Partner "${partner.name}" hat keine USt-IdNr — nichts zu prüfen.`
    );
  }

  const decision = decideRoute(partner.ust_idnr, opts.requesterUstIdnr);

  // --- DEMO-Pfad ---
  if (!shouldUseSupabase()) {
    const primary = await logVerification(
      demoMockVerification(partner, opts, decision.route)
    );
    return primary;
  }

  // --- Supabase-Pfad ---
  if (decision.route === "BZST") {
    const { data, error } = await supabase.functions.invoke("validate-ustid", {
      body: {
        ownUstId: opts.requesterUstIdnr ?? "",
        partnerUstId: partner.ust_idnr,
        clientId: opts.clientId,
        companyId: opts.companyId,
        partnerId: partner.id,
      },
    });
    if (error) {
      throw new Error(
        `Edge Function 'validate-ustid' fehlgeschlagen: ${error.message}`
      );
    }
    const row = data as UstIdVerification;
    if (row?.verification_status === "SERVICE_UNAVAILABLE") {
      // BZSt-Ausfall → VIES-Fallback, beide Rows bleiben im Log.
      const viesRes = await supabase.functions.invoke("verify-ust-idnr", {
        body: {
          ustIdnr: partner.ust_idnr,
          requesterUstIdnr: opts.requesterUstIdnr ?? null,
          partnerId: partner.id,
          clientId: opts.clientId,
          companyId: opts.companyId,
        },
      });
      if (viesRes.error) {
        // VIES auch fehlgeschlagen → wir geben die BZSt-Row zurück
        return row;
      }
      return viesRes.data as UstIdVerification;
    }
    return row;
  }

  // VIES direkt
  const { data, error } = await supabase.functions.invoke("verify-ust-idnr", {
    body: {
      ustIdnr: partner.ust_idnr,
      requesterUstIdnr: opts.requesterUstIdnr ?? null,
      partnerId: partner.id,
      clientId: opts.clientId,
      companyId: opts.companyId,
    },
  });
  if (error) {
    throw new Error(
      `Edge Function 'verify-ust-idnr' fehlgeschlagen: ${error.message}`
    );
  }
  return data as UstIdVerification;
}
