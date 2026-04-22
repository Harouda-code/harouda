/**
 * Service-Layer für `business_partners` (Sprint 19.A).
 *
 * Dual-Mode:
 *   - DEMO: localStorage via `store.getBusinessPartners` /
 *     `store.getBusinessPartnersVersions`.
 *   - Supabase: Tabellen aus Migration 0035 (Hybrid-Versioning via DB-Trigger).
 *
 * Phase 19.A-Scope: reine CRUD-Signaturen + Auto-Nummern-Vergabe via RPC
 * bzw. DEMO-Fallback. Validierung und Duplicate-Check folgen in Phase 19.B.
 */

import type {
  BusinessPartner,
  BusinessPartnerType,
  BusinessPartnerVersion,
  UstIdVerification,
} from "../types/db";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";
import {
  checkDuplicates,
  type DuplicateCheckResult,
} from "../domain/partners/duplicateCheck";
import { validateTypeAndNummern } from "../domain/partners/nummernkreisPolicy";
import { routedVerifyUstIdnr } from "./ustIdRouter";
import {
  buildBpvPayload,
  verifyBpvChain,
  type ChainBreakReason,
  type ChainVerificationResult,
} from "../domain/gobd/hashChainVerifier";
import {
  computeChainHash,
  formatUtcTimestamp,
} from "../lib/crypto/sha256Canonical";

const DEBITOR_MIN = 10000;
const DEBITOR_MAX = 69999;
const KREDITOR_MIN = 70000;
const KREDITOR_MAX = 99999;

export type ListBusinessPartnersOpts = {
  clientId: string;
  type?: BusinessPartnerType;
  activeOnly?: boolean;
};

export type CreateBusinessPartnerInput = Omit<
  BusinessPartner,
  | "id"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by"
  | "debitor_nummer"
  | "kreditor_nummer"
> & {
  debitor_nummer?: number | null;
  kreditor_nummer?: number | null;
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listBusinessPartners(
  opts: ListBusinessPartnersOpts
): Promise<BusinessPartner[]> {
  if (!shouldUseSupabase()) {
    return store
      .getBusinessPartners()
      .filter((p) => p.client_id === opts.clientId)
      .filter((p) => {
        if (!opts.type) return true;
        if (opts.type === "both") return p.partner_type === "both";
        return p.partner_type === opts.type || p.partner_type === "both";
      })
      .filter((p) => (opts.activeOnly ? p.is_active : true))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  const companyId = requireCompanyId();
  let query = supabase
    .from("business_partners")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", opts.clientId);
  if (opts.activeOnly) query = query.eq("is_active", true);
  if (opts.type) {
    if (opts.type === "both") {
      query = query.eq("partner_type", "both");
    } else {
      query = query.in("partner_type", [opts.type, "both"]);
    }
  }
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessPartner[];
}

export async function getBusinessPartner(
  id: string
): Promise<BusinessPartner | null> {
  if (!shouldUseSupabase()) {
    return store.getBusinessPartners().find((p) => p.id === id) ?? null;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("business_partners")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BusinessPartner | null) ?? null;
}

export async function getBusinessPartnerVersions(
  partnerId: string
): Promise<BusinessPartnerVersion[]> {
  if (!shouldUseSupabase()) {
    return store
      .getBusinessPartnersVersions()
      .filter((v) => v.partner_id === partnerId)
      .slice()
      .sort((a, b) => b.version_number - a.version_number);
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("business_partners_versions")
    .select("*")
    .eq("partner_id", partnerId)
    .eq("company_id", companyId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessPartnerVersion[];
}

export async function getBusinessPartnerVersion(
  versionId: string
): Promise<BusinessPartnerVersion | null> {
  if (!shouldUseSupabase()) {
    return (
      store
        .getBusinessPartnersVersions()
        .find((v) => v.version_id === versionId) ?? null
    );
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("business_partners_versions")
    .select("*")
    .eq("version_id", versionId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BusinessPartnerVersion | null) ?? null;
}

// ---------------------------------------------------------------------------
// Auto-Nummern
// ---------------------------------------------------------------------------

export async function nextDebitorNummer(clientId: string): Promise<number> {
  if (!shouldUseSupabase()) {
    const existing = store
      .getBusinessPartners()
      .filter((p) => p.client_id === clientId && p.debitor_nummer != null)
      .map((p) => p.debitor_nummer as number);
    const max = existing.length === 0 ? DEBITOR_MIN - 1 : Math.max(...existing);
    const next = max + 1;
    if (next > DEBITOR_MAX) {
      throw new Error(
        `Debitor-Nummernkreis erschöpft (max ${DEBITOR_MAX}) für client ${clientId}`
      );
    }
    return next;
  }
  const { data, error } = await supabase.rpc("next_debitor_nummer", {
    p_client_id: clientId,
  });
  if (error) throw new Error(error.message);
  return Number(data);
}

export async function nextKreditorNummer(clientId: string): Promise<number> {
  if (!shouldUseSupabase()) {
    const existing = store
      .getBusinessPartners()
      .filter((p) => p.client_id === clientId && p.kreditor_nummer != null)
      .map((p) => p.kreditor_nummer as number);
    const max =
      existing.length === 0 ? KREDITOR_MIN - 1 : Math.max(...existing);
    const next = max + 1;
    if (next > KREDITOR_MAX) {
      throw new Error(
        `Kreditor-Nummernkreis erschöpft (max ${KREDITOR_MAX}) für client ${clientId}`
      );
    }
    return next;
  }
  const { data, error } = await supabase.rpc("next_kreditor_nummer", {
    p_client_id: clientId,
  });
  if (error) throw new Error(error.message);
  return Number(data);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Fehlerklasse fuer Hard-Block-Duplikate. Das UI kann `result` inspizieren
 * um die konkreten Konflikte (und deren `existingPartnerId`) anzuzeigen.
 */
export class DuplicatePartnerError extends Error {
  readonly result: DuplicateCheckResult;
  constructor(result: DuplicateCheckResult) {
    super(
      result.hardBlocks.map((b) => b.message).join(" ") ||
        "Duplicate-Check fehlgeschlagen."
    );
    this.name = "DuplicatePartnerError";
    this.result = result;
  }
}

export async function createBusinessPartner(
  input: CreateBusinessPartnerInput
): Promise<BusinessPartner> {
  const needsDebitor =
    input.partner_type === "debitor" || input.partner_type === "both";
  const needsKreditor =
    input.partner_type === "kreditor" || input.partner_type === "both";

  const debitorNr =
    input.debitor_nummer ??
    (needsDebitor ? await nextDebitorNummer(input.client_id) : null);
  const kreditorNr =
    input.kreditor_nummer ??
    (needsKreditor ? await nextKreditorNummer(input.client_id) : null);

  // Range/Typ-Konsistenz (spiegelt die DB-CHECK-Constraints).
  const nk = validateTypeAndNummern(
    input.partner_type,
    debitorNr,
    kreditorNr
  );
  if (!nk.valid) throw new Error(nk.error);

  // Duplicate-Check (Hard-Blocks blockieren, Soft-Warnings werden der UI
  // via checkDuplicatesForInput(…) separat ueberlassen).
  const existing = await listBusinessPartners({ clientId: input.client_id });
  const dup = checkDuplicates(
    {
      ...input,
      debitor_nummer: debitorNr,
      kreditor_nummer: kreditorNr,
    },
    existing
  );
  if (dup.hardBlocks.length > 0) {
    throw new DuplicatePartnerError(dup);
  }

  if (!shouldUseSupabase()) {
    const now = new Date().toISOString();
    const next: BusinessPartner = {
      id: uid(),
      company_id: input.company_id,
      client_id: input.client_id,
      partner_type: input.partner_type,
      debitor_nummer: debitorNr,
      kreditor_nummer: kreditorNr,
      name: input.name,
      legal_name: input.legal_name,
      rechtsform: input.rechtsform,
      ust_idnr: input.ust_idnr,
      steuernummer: input.steuernummer,
      finanzamt: input.finanzamt,
      hrb: input.hrb,
      registergericht: input.registergericht,
      anschrift_strasse: input.anschrift_strasse,
      anschrift_hausnummer: input.anschrift_hausnummer,
      anschrift_plz: input.anschrift_plz,
      anschrift_ort: input.anschrift_ort,
      anschrift_land_iso: input.anschrift_land_iso,
      email: input.email,
      telefon: input.telefon,
      iban: input.iban,
      bic: input.bic,
      is_public_authority: input.is_public_authority,
      leitweg_id: input.leitweg_id,
      preferred_invoice_format: input.preferred_invoice_format,
      peppol_id: input.peppol_id,
      verrechnungs_partner_id: input.verrechnungs_partner_id,
      zahlungsziel_tage: input.zahlungsziel_tage,
      skonto_prozent: input.skonto_prozent,
      skonto_tage: input.skonto_tage,
      standard_erloeskonto: input.standard_erloeskonto,
      standard_aufwandskonto: input.standard_aufwandskonto,
      is_active: input.is_active,
      notes: input.notes,
      created_at: now,
      created_by: null,
      updated_at: now,
      updated_by: null,
    };
    store.setBusinessPartners([...store.getBusinessPartners(), next]);
    return next;
  }

  const companyId = requireCompanyId();
  const payload = {
    company_id: companyId,
    client_id: input.client_id,
    partner_type: input.partner_type,
    debitor_nummer: debitorNr,
    kreditor_nummer: kreditorNr,
    name: input.name,
    legal_name: input.legal_name,
    rechtsform: input.rechtsform,
    ust_idnr: input.ust_idnr,
    steuernummer: input.steuernummer,
    finanzamt: input.finanzamt,
    hrb: input.hrb,
    registergericht: input.registergericht,
    anschrift_strasse: input.anschrift_strasse,
    anschrift_hausnummer: input.anschrift_hausnummer,
    anschrift_plz: input.anschrift_plz,
    anschrift_ort: input.anschrift_ort,
    anschrift_land_iso: input.anschrift_land_iso,
    email: input.email,
    telefon: input.telefon,
    iban: input.iban,
    bic: input.bic,
    is_public_authority: input.is_public_authority,
    leitweg_id: input.leitweg_id,
    preferred_invoice_format: input.preferred_invoice_format,
    peppol_id: input.peppol_id,
    verrechnungs_partner_id: input.verrechnungs_partner_id,
    zahlungsziel_tage: input.zahlungsziel_tage,
    skonto_prozent: input.skonto_prozent,
    skonto_tage: input.skonto_tage,
    standard_erloeskonto: input.standard_erloeskonto,
    standard_aufwandskonto: input.standard_aufwandskonto,
    is_active: input.is_active,
    notes: input.notes,
  };
  const { data, error } = await supabase
    .from("business_partners")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as BusinessPartner;
}

export async function updateBusinessPartner(
  id: string,
  patch: Partial<BusinessPartner>
): Promise<BusinessPartner> {
  if (!shouldUseSupabase()) {
    const all = store.getBusinessPartners();
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error("Business-Partner nicht gefunden.");
    const prev = all[idx];
    const now = new Date().toISOString();

    // DEMO-Mode-Äquivalent des Supabase-Snapshot-Triggers: vor dem
    // Überschreiben der Row ziehen wir die alte Version ins Archiv.
    //
    // Sprint 20.B.5: Hash-Kette pro partner_id. prev_hash = version_hash
    // der jüngsten bisherigen Version (oder null = Genesis). version_hash
    // wird clientseitig via computeChainHash berechnet und muss
    // byte-identisch mit dem DB-Trigger (Migration 0039) sein.
    const existingVersions = store
      .getBusinessPartnersVersions()
      .filter((v) => v.partner_id === id);
    const nextVersionNumber =
      existingVersions.reduce((m, v) => Math.max(m, v.version_number), 0) + 1;
    const prevVersionHash =
      existingVersions.length === 0
        ? null
        : existingVersions.reduce((best, v) =>
            v.version_number > best.version_number ? v : best
          ).version_hash ?? null;
    const oldYear = new Date(prev.updated_at).getFullYear();
    // Die Payload-Bausteine, die in den Hash eingehen müssen, werden
    // zuerst definiert — der Rest der Row folgt daraus oder ist
    // hash-irrelevant (entstehungsjahr, retention_*, valid_to, etc.).
    const snapshotPayloadInput = {
      aufbewahrungs_kategorie:
        "ORGANISATIONSUNTERLAGE_10J" as const,
      partner_id: id,
      snapshot: prev,
      valid_from: prev.updated_at,
      version_number: nextVersionNumber,
    };
    const payload = buildBpvPayload(snapshotPayloadInput);
    const versionHash = await computeChainHash(prevVersionHash, payload);
    const snapshot: BusinessPartnerVersion = {
      version_id: uid(),
      partner_id: id,
      company_id: prev.company_id,
      client_id: prev.client_id,
      version_number: nextVersionNumber,
      snapshot: prev,
      aufbewahrungs_kategorie: "ORGANISATIONSUNTERLAGE_10J",
      entstehungsjahr: oldYear,
      retention_until: `${oldYear + 10}-12-31`,
      retention_hold: false,
      retention_hold_reason: null,
      valid_from: prev.updated_at,
      valid_to: now,
      created_at: now,
      created_by: null,
      prev_hash: prevVersionHash,
      version_hash: versionHash,
      // server_recorded_at im DEMO = now() des Client-Systems. Supabase
      // setzt das per DEFAULT now() in der DB. Dokumentiert, dass DEMO
      // keinen vertrauenswürdigen Server-Timestamp liefert.
      server_recorded_at: now,
    };
    store.setBusinessPartnersVersions([
      ...store.getBusinessPartnersVersions(),
      snapshot,
    ]);

    const next: BusinessPartner = { ...prev, ...patch, updated_at: now };
    const copy = all.slice();
    copy[idx] = next;
    store.setBusinessPartners(copy);
    return next;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("business_partners")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as BusinessPartner;
}

export async function deactivateBusinessPartner(id: string): Promise<void> {
  await updateBusinessPartner(id, { is_active: false });
}

// ---------------------------------------------------------------------------
// Soft-Duplicate-Check fuer UI (debounced-Warning)
// ---------------------------------------------------------------------------

/**
 * Liefert vollstaendiges Hard+Soft-Ergebnis. Die UI nutzt das fuer
 * Live-Warnings im Formular; der tatsaechliche INSERT blockt nur auf
 * Hard-Blocks (createBusinessPartner → DuplicatePartnerError).
 */
export async function checkDuplicatesForInput(
  input: CreateBusinessPartnerInput & { excludePartnerId?: string }
): Promise<DuplicateCheckResult> {
  const existing = await listBusinessPartners({ clientId: input.client_id });
  return checkDuplicates(input, existing);
}

// ---------------------------------------------------------------------------
// VIES-Verifikation
// ---------------------------------------------------------------------------

export type VerifyUstIdnrOptions = {
  /**
   * Eigene USt-IdNr des anfragenden Unternehmens (qualifizierte
   * Bestaetigungsanfrage). Optional; wird im Log persistiert.
   */
  requesterUstIdnr?: string | null;
};

/**
 * Stößt eine USt-IdNr-Verifikation für einen Stammdaten-Partner an.
 *
 * Sprint 20.A.2: Die eigentliche Routing-Logik (BZSt vs. VIES +
 * Fallback-Kette) liegt im `ustIdRouter`-Modul. Diese Funktion ist
 * ein dünner Wrapper, der den Partner auflöst und die Company-ID
 * aus dem aktiven Context zieht.
 */
export async function verifyUstIdnrForPartner(
  partnerId: string,
  opts: VerifyUstIdnrOptions = {}
): Promise<UstIdVerification> {
  const partner = await getBusinessPartner(partnerId);
  if (!partner) {
    throw new Error(`Business-Partner ${partnerId} nicht gefunden.`);
  }
  if (!partner.ust_idnr) {
    throw new Error(
      `Partner „${partner.name}" hat keine USt-IdNr — nichts zu prüfen.`
    );
  }
  const companyId = shouldUseSupabase()
    ? requireCompanyId()
    : partner.company_id;
  return routedVerifyUstIdnr(partner, {
    requesterUstIdnr: opts.requesterUstIdnr ?? null,
    clientId: partner.client_id,
    companyId,
  });
}

// ---------------------------------------------------------------------------
// Sprint 20.B.4 · Chain-Verifikation für business_partners_versions
// ---------------------------------------------------------------------------

/**
 * Aggregiert mehrere Row-Level-Ergebnisse (aus der RPC `verify_bpv_chain`)
 * zu einem `ChainVerificationResult`. RPC liefert **nur die Bruchstellen**
 * (erste pro Partner-Kette) — leere Ergebnismenge = Kette vollständig ok.
 * `count` entspricht der Gesamtzahl geprüfter Rows; da die RPC nicht die
 * Row-Anzahl mitliefert, wird bei fehlerfreier Ausführung mit einem
 * separaten COUNT-Query ermittelt.
 */
type BpvRpcRow = {
  partner_id: string;
  version_number: number;
  is_valid: boolean;
  reason: ChainBreakReason | null;
};

function aggregateBpvRpcRows(
  rows: BpvRpcRow[] | null,
  totalCount: number
): ChainVerificationResult {
  if (!rows || rows.length === 0) {
    return {
      valid: true,
      count: totalCount,
      brokenAt: null,
      reason: null,
    };
  }
  const firstBreak = rows.find((r) => r.is_valid === false) ?? rows[0];
  return {
    valid: false,
    count: totalCount,
    brokenAt: {
      // index=-1 signalisiert: Row identifiziert durch partner_id+version_number,
      // nicht über globalen Array-Index (RPC-Ergebnis kennt den nicht).
      index: -1,
      id: `${firstBreak.partner_id}#${firstBreak.version_number}`,
    },
    reason: firstBreak.reason,
  };
}

/**
 * Verifiziert die Hash-Kette aller `business_partners_versions`-Rows für
 * einen Mandanten.
 *
 * DEMO-Mode: liest aus localStorage, sortiert (partner_id ASC,
 *   version_number ASC), delegiert an `verifyBpvChain` (reine
 *   Client-Side-Berechnung).
 * Supabase-Mode: ruft RPC `verify_bpv_chain(p_client_id)` auf — Verifikation
 *   läuft DB-seitig mit voller µs-Präzision und RLS-durchgesetzter
 *   Mandantenisolation (Migration 0039).
 */
export async function verifyBpvChainForClient(
  clientId: string
): Promise<ChainVerificationResult> {
  if (!shouldUseSupabase()) {
    const versions = store
      .getBusinessPartnersVersions()
      .filter((v) => v.client_id === clientId)
      .slice()
      .sort((a, b) => {
        const pCmp = a.partner_id.localeCompare(b.partner_id);
        if (pCmp !== 0) return pCmp;
        return a.version_number - b.version_number;
      });
    return verifyBpvChain(versions);
  }

  const companyId = requireCompanyId();
  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "verify_bpv_chain",
    { p_client_id: clientId }
  );
  if (rpcErr) throw new Error(rpcErr.message);

  const { count, error: cntErr } = await supabase
    .from("business_partners_versions")
    .select("version_id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("client_id", clientId);
  if (cntErr) throw new Error(cntErr.message);

  return aggregateBpvRpcRows(rpcData as BpvRpcRow[] | null, count ?? 0);
}
