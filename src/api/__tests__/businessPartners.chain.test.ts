// Sprint 20.B.6 · BPV-Chain Integration-Tests (DEMO).
//
// Prüft das End-to-End-Verhalten: createBusinessPartner +
// updateBusinessPartner erzeugen über `tg_bpv_set_hash`-Äquivalent im
// DEMO-Store eine vollständige Hash-Chain pro partner_id.
// verifyBpvChainForClient erkennt Tamper-Attacken.

import { describe, it, expect, beforeEach } from "vitest";
import type { BusinessPartner, BusinessPartnerVersion } from "../../types/db";
import {
  createBusinessPartner,
  updateBusinessPartner,
  verifyBpvChainForClient,
} from "../businessPartners";

const COMPANY = "co-chain-bpv";
const CLIENT = "cl-chain-bpv";

function baseInput(
  over: Partial<BusinessPartner> & { name: string }
): Parameters<typeof createBusinessPartner>[0] {
  const defaults: Parameters<typeof createBusinessPartner>[0] = {
    company_id: COMPANY,
    client_id: CLIENT,
    partner_type: "debitor",
    name: over.name,
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
  };
  return { ...defaults, ...over };
}

function readVersions(): BusinessPartnerVersion[] {
  const raw = localStorage.getItem("harouda-business-partners-versions");
  return raw ? (JSON.parse(raw) as BusinessPartnerVersion[]) : [];
}

function writeVersions(v: BusinessPartnerVersion[]): void {
  localStorage.setItem("harouda-business-partners-versions", JSON.stringify(v));
}

beforeEach(() => {
  localStorage.clear();
});

describe("verifyBpvChainForClient · DEMO", () => {
  it("#1 3 Updates auf 1 Partner → 2 Snapshots → Kette valid", async () => {
    const p = await createBusinessPartner(baseInput({ name: "V0" }));
    await updateBusinessPartner(p.id, { name: "V1" });
    await updateBusinessPartner(p.id, { name: "V2" });
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(2);
  });

  it("#2 Tamper snapshot-Feld → hash_mismatch erkannt", async () => {
    const p = await createBusinessPartner(baseInput({ name: "T0" }));
    await updateBusinessPartner(p.id, { name: "T1" });
    // Versions direkt in Store mutieren
    const versions = readVersions();
    versions[0].snapshot = { ...versions[0].snapshot, name: "Hacked" };
    writeVersions(versions);
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
  });

  it("#3 2 Partner parallel → beide Ketten intakt", async () => {
    const a = await createBusinessPartner(baseInput({ name: "A0" }));
    const b = await createBusinessPartner(baseInput({ name: "B0" }));
    await updateBusinessPartner(a.id, { name: "A1" });
    await updateBusinessPartner(a.id, { name: "A2" });
    await updateBusinessPartner(b.id, { name: "B1" });
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(3);
  });

  it("#4 Genesis-Only (1 Update → 1 Snapshot) → valid mit prev_hash=null", async () => {
    const p = await createBusinessPartner(baseInput({ name: "G0" }));
    await updateBusinessPartner(p.id, { name: "G1" });
    const versions = readVersions();
    expect(versions).toHaveLength(1);
    expect(versions[0].prev_hash).toBeNull();
    expect(versions[0].version_hash).toMatch(/^[0-9a-f]{64}$/);
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(true);
  });

  it("#5 Manuell falscher prev_hash in Version 2 → prev_hash_mismatch", async () => {
    const p = await createBusinessPartner(baseInput({ name: "P0" }));
    await updateBusinessPartner(p.id, { name: "P1" });
    await updateBusinessPartner(p.id, { name: "P2" });
    const versions = readVersions();
    // Die zweite Version (version_number=2) bekommt eine falsche prev_hash.
    const v2 = versions.find((v) => v.version_number === 2)!;
    v2.prev_hash = "f".repeat(64);
    writeVersions(versions);
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("prev_hash_mismatch");
  });

  it("#6 Unicode-snapshot (Umlaute + Emoji) → Kette hält", async () => {
    const p = await createBusinessPartner(baseInput({ name: "U0" }));
    await updateBusinessPartner(p.id, { name: "Müller 🛡️" });
    await updateBusinessPartner(p.id, { name: "Söhne & Müller GmbH" });
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(true);
  });

  it("#7 server_recorded_at ist auf Snapshot-Rows vorhanden", async () => {
    const p = await createBusinessPartner(baseInput({ name: "S0" }));
    await updateBusinessPartner(p.id, { name: "S1" });
    const versions = readVersions();
    expect(versions[0].server_recorded_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T/
    );
  });

  it("#8 Mutation von server_recorded_at → Chain bleibt valid (nicht im Hash)", async () => {
    const p = await createBusinessPartner(baseInput({ name: "M0" }));
    await updateBusinessPartner(p.id, { name: "M1" });
    const versions = readVersions();
    versions[0].server_recorded_at = "2099-12-31T23:59:59.999Z";
    writeVersions(versions);
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.valid).toBe(true);
  });

  it("#9 Client-Isolation: andere client_id wird ignoriert", async () => {
    const p = await createBusinessPartner(baseInput({ name: "X0" }));
    await updateBusinessPartner(p.id, { name: "X1" });
    // Zweiter Client mit eigenem Partner
    const p2 = await createBusinessPartner(
      baseInput({ name: "Y0", client_id: "cl-other" })
    );
    await updateBusinessPartner(p2.id, { name: "Y1" });
    const r = await verifyBpvChainForClient(CLIENT);
    expect(r.count).toBe(1); // nur CLIENT-scope zählt
    expect(r.valid).toBe(true);
  });

  it("#10 Leerer Client (keine Versionen) → valid, count=0", async () => {
    const r = await verifyBpvChainForClient("cl-empty");
    expect(r).toEqual({
      valid: true,
      count: 0,
      brokenAt: null,
      reason: null,
    });
  });
});
