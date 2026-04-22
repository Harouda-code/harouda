// Sprint 20.C.2 · integrityDashboard-Aggregator Tests (DEMO).

import { describe, it, expect, beforeEach } from "vitest";
import type { BusinessPartner } from "../../../types/db";
import { runIntegrityCheck } from "../integrityDashboard";
import {
  createBusinessPartner,
  updateBusinessPartner,
} from "../../../api/businessPartners";
import { logVerification } from "../../../api/ustidVerifications";

const CLIENT = "cl-integrity";
const COMPANY = "co-integrity";

async function seedPartnerWithVersion(name: string): Promise<void> {
  const p = await createBusinessPartner({
    company_id: COMPANY,
    client_id: CLIENT,
    partner_type: "debitor",
    name,
    legal_name: null,
    rechtsform: null,
    ust_idnr: null,
    steuernummer: null,
    finanzamt: null,
    hrb: null,
    registergericht: null,
    anschrift_strasse: null,
    anschrift_hausnummer: null,
    anschrift_plz: null,
    anschrift_ort: null,
    anschrift_land_iso: "DE",
    email: null,
    telefon: null,
    iban: null,
    bic: null,
    is_public_authority: false,
    leitweg_id: null,
    preferred_invoice_format: "pdf",
    peppol_id: null,
    verrechnungs_partner_id: null,
    zahlungsziel_tage: null,
    skonto_prozent: null,
    skonto_tage: null,
    standard_erloeskonto: null,
    standard_aufwandskonto: null,
    is_active: true,
    notes: null,
  });
  // updateBusinessPartner erzeugt den ersten Snapshot in der BPV-Chain.
  await updateBusinessPartner(p.id, { name: `${name}-v1` });
}

async function seedUvLog(ustIdnr: string): Promise<void> {
  await logVerification({
    company_id: COMPANY,
    client_id: CLIENT,
    partner_id: null,
    requested_ust_idnr: ustIdnr,
    requester_ust_idnr: null,
    raw_http_response: null,
    raw_http_response_headers: null,
    raw_http_request_url: "demo://integrity",
    vies_valid: null,
    vies_request_date: null,
    vies_request_identifier: null,
    vies_trader_name: null,
    vies_trader_address: null,
    vies_raw_parsed: null,
    verification_status: "VALID",
    verification_source: "VIES",
    error_message: null,
    retention_hold: false,
    retention_hold_reason: null,
    created_by: null,
  });
}

function tamperBpvFirstSnapshot(): void {
  const raw = localStorage.getItem("harouda-business-partners-versions") ?? "[]";
  const versions = JSON.parse(raw) as Array<{ snapshot: BusinessPartner }>;
  versions[0].snapshot = { ...versions[0].snapshot, name: "TAMPERED" };
  localStorage.setItem(
    "harouda-business-partners-versions",
    JSON.stringify(versions)
  );
}

function tamperUvFirstRow(): void {
  const raw = localStorage.getItem("harouda-ustid-verifications") ?? "[]";
  const rows = JSON.parse(raw) as Array<{ verification_status: string }>;
  rows[0].verification_status = "INVALID";
  localStorage.setItem("harouda-ustid-verifications", JSON.stringify(rows));
}

beforeEach(() => {
  localStorage.clear();
});

describe("runIntegrityCheck · Normalisierung + Aggregation", () => {
  it("#1 Leerer DEMO-Store: alle 4 chains count=0, overallValid=true", async () => {
    const r = await runIntegrityCheck(CLIENT);
    expect(r.overallValid).toBe(true);
    expect(r.chains).toHaveLength(4);
    const byName = new Map(r.chains.map((c) => [c.chain, c]));
    expect(byName.get("journal")?.count).toBe(0);
    expect(byName.get("audit")?.count).toBe(0);
    expect(byName.get("bpv")?.count).toBe(0);
    expect(byName.get("uv")?.count).toBe(0);
    for (const c of r.chains) {
      expect(c.valid).toBe(true);
      expect(c.brokenAt).toBeNull();
      expect(c.reason).toBeNull();
    }
  });

  it("#2 Alle 4 chains valid nach Seed → overallValid true", async () => {
    await seedPartnerWithVersion("Alpha");
    await seedUvLog("DE111");
    const r = await runIntegrityCheck(CLIENT);
    expect(r.overallValid).toBe(true);
    const byName = new Map(r.chains.map((c) => [c.chain, c]));
    expect(byName.get("bpv")?.count).toBe(1);
    expect(byName.get("uv")?.count).toBe(1);
  });

  it("#3 BPV getampered → bpv broken, overallValid false", async () => {
    await seedPartnerWithVersion("Alpha");
    await seedUvLog("DE111");
    tamperBpvFirstSnapshot();
    const r = await runIntegrityCheck(CLIENT);
    expect(r.overallValid).toBe(false);
    const bpv = r.chains.find((c) => c.chain === "bpv")!;
    expect(bpv.valid).toBe(false);
    expect(bpv.reason).toBe("hash_mismatch");
    // Andere Chains bleiben intakt
    expect(r.chains.find((c) => c.chain === "uv")!.valid).toBe(true);
    expect(r.chains.find((c) => c.chain === "journal")!.valid).toBe(true);
    expect(r.chains.find((c) => c.chain === "audit")!.valid).toBe(true);
  });

  it("#4 BPV + UV gleichzeitig getampered → beide broken, overallValid false", async () => {
    await seedPartnerWithVersion("Alpha");
    await seedUvLog("DE111");
    tamperBpvFirstSnapshot();
    tamperUvFirstRow();
    const r = await runIntegrityCheck(CLIENT);
    expect(r.overallValid).toBe(false);
    expect(r.chains.find((c) => c.chain === "bpv")!.valid).toBe(false);
    expect(r.chains.find((c) => c.chain === "uv")!.valid).toBe(false);
  });

  it("#5 durationMs ≥ 0 auf allen Chains + checkedAt gesetzt", async () => {
    await seedUvLog("DE111");
    const r = await runIntegrityCheck(CLIENT);
    expect(r.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    for (const c of r.chains) {
      expect(c.durationMs).toBeGreaterThanOrEqual(0);
      expect(c.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("#6 JSON-Serializable Round-Trip", async () => {
    await seedPartnerWithVersion("Alpha");
    await seedUvLog("DE111");
    const r = await runIntegrityCheck(CLIENT);
    const roundtrip = JSON.parse(JSON.stringify(r));
    expect(roundtrip).toEqual(r);
  });

  it("#7 Shape: companyId null in DEMO ohne aktive Company", async () => {
    // localStorage ohne harouda:activeCompanyId → getActiveCompanyId() → null
    const r = await runIntegrityCheck(CLIENT);
    expect(r.companyId).toBeNull();
    expect(r.clientId).toBe(CLIENT);
  });
});
