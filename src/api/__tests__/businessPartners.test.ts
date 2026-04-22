// Sprint 19.A · businessPartners-Service-Tests (DEMO-Mode).
//
// DEMO-Mode ist der Default im vitest-Environment (Heuristik in
// src/api/supabase.ts: VITE_DEMO_MODE unset + import.meta.env.DEV → true).
// Tests verifizieren die localStorage-Branche; Supabase-Pfad ist
// shape-identisch und wird im E2E-Deployment getestet.

import { describe, it, expect, beforeEach } from "vitest";
import type { BusinessPartner } from "../../types/db";
import {
  createBusinessPartner,
  deactivateBusinessPartner,
  getBusinessPartner,
  getBusinessPartnerVersion,
  getBusinessPartnerVersions,
  listBusinessPartners,
  nextDebitorNummer,
  nextKreditorNummer,
  updateBusinessPartner,
} from "../businessPartners";

const COMPANY = "company-1";
const CLIENT_A = "client-A";
const CLIENT_B = "client-B";

function baseInput(
  overrides: Partial<BusinessPartner> & { name: string }
): Parameters<typeof createBusinessPartner>[0] {
  const defaults: Parameters<typeof createBusinessPartner>[0] = {
    company_id: COMPANY,
    client_id: CLIENT_A,
    partner_type: "debitor",
    name: overrides.name,
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
  return { ...defaults, ...overrides };
}

beforeEach(() => {
  localStorage.clear();
});

describe("businessPartners · Auto-Nummern", () => {
  it("#1 nextDebitorNummer liefert 10000 bei leerem Client", async () => {
    expect(await nextDebitorNummer(CLIENT_A)).toBe(10000);
  });

  it("#2 nextKreditorNummer liefert 70000 bei leerem Client", async () => {
    expect(await nextKreditorNummer(CLIENT_A)).toBe(70000);
  });

  it("#3 nextDebitorNummer zaehlt hoch nach Insert", async () => {
    await createBusinessPartner(
      baseInput({ name: "Kunde Eins", partner_type: "debitor" })
    );
    expect(await nextDebitorNummer(CLIENT_A)).toBe(10001);
  });

  it("#4 nextDebitorNummer ist pro Client isoliert", async () => {
    await createBusinessPartner(
      baseInput({ name: "A1", client_id: CLIENT_A, partner_type: "debitor" })
    );
    await createBusinessPartner(
      baseInput({ name: "A2", client_id: CLIENT_A, partner_type: "debitor" })
    );
    expect(await nextDebitorNummer(CLIENT_B)).toBe(10000);
  });

  it("#5 nextKreditorNummer zaehlt unabhaengig von Debitor hoch", async () => {
    await createBusinessPartner(
      baseInput({ name: "K1", partner_type: "kreditor" })
    );
    await createBusinessPartner(
      baseInput({ name: "K2", partner_type: "kreditor" })
    );
    expect(await nextDebitorNummer(CLIENT_A)).toBe(10000);
    expect(await nextKreditorNummer(CLIENT_A)).toBe(70002);
  });
});

describe("businessPartners · createBusinessPartner", () => {
  it("#6 Typ debitor: debitor_nummer wird vergeben, kreditor_nummer bleibt null", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "Kunde", partner_type: "debitor" })
    );
    expect(p.debitor_nummer).toBe(10000);
    expect(p.kreditor_nummer).toBeNull();
  });

  it("#7 Typ kreditor: kreditor_nummer wird vergeben, debitor_nummer bleibt null", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "Lieferant", partner_type: "kreditor" })
    );
    expect(p.debitor_nummer).toBeNull();
    expect(p.kreditor_nummer).toBe(70000);
  });

  it("#8 Typ both: beide Nummern werden vergeben", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "Bilateral", partner_type: "both" })
    );
    expect(p.debitor_nummer).toBe(10000);
    expect(p.kreditor_nummer).toBe(70000);
  });

  it("#9 Explizite debitor_nummer wird respektiert", async () => {
    const p = await createBusinessPartner(
      baseInput({
        name: "Fester Debitor",
        partner_type: "debitor",
        debitor_nummer: 42000,
      }) as never
    );
    expect(p.debitor_nummer).toBe(42000);
  });

  it("#10 Folgender createBusinessPartner respektiert existierende Nummer", async () => {
    await createBusinessPartner(
      baseInput({
        name: "Fester Debitor",
        partner_type: "debitor",
        debitor_nummer: 42000,
      }) as never
    );
    const second = await createBusinessPartner(
      baseInput({ name: "Naechster", partner_type: "debitor" })
    );
    expect(second.debitor_nummer).toBe(42001);
  });

  it("#11 created_at und updated_at werden gesetzt", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "X", partner_type: "debitor" })
    );
    expect(p.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(p.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("#12 is_public_authority + leitweg_id werden persistiert", async () => {
    const p = await createBusinessPartner(
      baseInput({
        name: "Landesamt",
        partner_type: "debitor",
        is_public_authority: true,
        leitweg_id: "04011000-12345-67",
      })
    );
    expect(p.is_public_authority).toBe(true);
    expect(p.leitweg_id).toBe("04011000-12345-67");
  });
});

describe("businessPartners · listBusinessPartners", () => {
  async function seed() {
    await createBusinessPartner(
      baseInput({ name: "Alpha Debitor", partner_type: "debitor" })
    );
    await createBusinessPartner(
      baseInput({ name: "Beta Kreditor", partner_type: "kreditor" })
    );
    await createBusinessPartner(
      baseInput({ name: "Gamma Bilateral", partner_type: "both" })
    );
    await createBusinessPartner(
      baseInput({
        name: "Delta Inaktiv",
        partner_type: "debitor",
        is_active: false,
      })
    );
  }

  it("#13 list liefert alle 4 fuer CLIENT_A", async () => {
    await seed();
    const all = await listBusinessPartners({ clientId: CLIENT_A });
    expect(all).toHaveLength(4);
  });

  it("#14 Filter type=debitor liefert debitor + both", async () => {
    await seed();
    const r = await listBusinessPartners({
      clientId: CLIENT_A,
      type: "debitor",
    });
    expect(r.map((p) => p.name).sort()).toEqual([
      "Alpha Debitor",
      "Delta Inaktiv",
      "Gamma Bilateral",
    ]);
  });

  it("#15 Filter type=kreditor liefert kreditor + both", async () => {
    await seed();
    const r = await listBusinessPartners({
      clientId: CLIENT_A,
      type: "kreditor",
    });
    expect(r.map((p) => p.name).sort()).toEqual([
      "Beta Kreditor",
      "Gamma Bilateral",
    ]);
  });

  it("#16 Filter type=both liefert NUR both", async () => {
    await seed();
    const r = await listBusinessPartners({
      clientId: CLIENT_A,
      type: "both",
    });
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe("Gamma Bilateral");
  });

  it("#17 activeOnly filtert inaktive heraus", async () => {
    await seed();
    const r = await listBusinessPartners({
      clientId: CLIENT_A,
      activeOnly: true,
    });
    expect(r.map((p) => p.name).sort()).toEqual([
      "Alpha Debitor",
      "Beta Kreditor",
      "Gamma Bilateral",
    ]);
  });

  it("#18 Client-Isolation: CLIENT_B sieht CLIENT_A-Records nicht", async () => {
    await seed();
    await createBusinessPartner(
      baseInput({
        name: "B-Kunde",
        client_id: CLIENT_B,
        partner_type: "debitor",
      })
    );
    const a = await listBusinessPartners({ clientId: CLIENT_A });
    const b = await listBusinessPartners({ clientId: CLIENT_B });
    expect(a).toHaveLength(4);
    expect(b).toHaveLength(1);
    expect(b[0].name).toBe("B-Kunde");
  });

  it("#19 list sortiert nach name alphabetisch", async () => {
    await seed();
    const r = await listBusinessPartners({ clientId: CLIENT_A });
    const names = r.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "de")));
  });
});

describe("businessPartners · getBusinessPartner", () => {
  it("#20 findet Partner nach id", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "Findbar", partner_type: "debitor" })
    );
    const hit = await getBusinessPartner(p.id);
    expect(hit).not.toBeNull();
    expect(hit!.name).toBe("Findbar");
  });

  it("#21 null fuer unbekannte id", async () => {
    const miss = await getBusinessPartner("nonexistent");
    expect(miss).toBeNull();
  });
});

describe("businessPartners · update + Hybrid-Versioning (DEMO)", () => {
  it("#22 update legt Snapshot der alten Row in Versionen ab", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "Before", partner_type: "debitor" })
    );
    await updateBusinessPartner(p.id, { name: "After" });
    const versions = await getBusinessPartnerVersions(p.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].snapshot.name).toBe("Before");
    expect(versions[0].version_number).toBe(1);
  });

  it("#23 Mehrere Updates erzeugen inkrementelle Versionen", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "V0", partner_type: "debitor" })
    );
    await updateBusinessPartner(p.id, { name: "V1" });
    await updateBusinessPartner(p.id, { name: "V2" });
    await updateBusinessPartner(p.id, { name: "V3" });
    const versions = await getBusinessPartnerVersions(p.id);
    expect(versions.map((v) => v.version_number)).toEqual([3, 2, 1]);
    expect(versions.map((v) => v.snapshot.name)).toEqual(["V2", "V1", "V0"]);
  });

  it("#24 update aktualisiert updated_at", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "T0", partner_type: "debitor" })
    );
    // Kurz warten, damit ISO-Zeitstempel differieren.
    await new Promise((r) => setTimeout(r, 5));
    const next = await updateBusinessPartner(p.id, { name: "T1" });
    expect(next.updated_at > p.updated_at).toBe(true);
  });

  it("#25 update auf unbekannter id wirft", async () => {
    await expect(
      updateBusinessPartner("unknown", { name: "X" })
    ).rejects.toThrow(/nicht gefunden/);
  });

  it("#26 Version enthaelt retention_until auf Jahr(updated_at)+10-12-31", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "R0", partner_type: "debitor" })
    );
    await updateBusinessPartner(p.id, { name: "R1" });
    const versions = await getBusinessPartnerVersions(p.id);
    const baseYear = new Date(p.updated_at).getFullYear();
    expect(versions[0].retention_until).toBe(`${baseYear + 10}-12-31`);
  });

  it("#27 Version enthaelt aufbewahrungs_kategorie=ORGANISATIONSUNTERLAGE_10J", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "AK", partner_type: "debitor" })
    );
    await updateBusinessPartner(p.id, { name: "AK2" });
    const versions = await getBusinessPartnerVersions(p.id);
    expect(versions[0].aufbewahrungs_kategorie).toBe(
      "ORGANISATIONSUNTERLAGE_10J"
    );
  });
});

describe("businessPartners · getBusinessPartnerVersion", () => {
  it("#28 findet Version nach version_id", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "V", partner_type: "debitor" })
    );
    await updateBusinessPartner(p.id, { name: "V2" });
    const versions = await getBusinessPartnerVersions(p.id);
    const hit = await getBusinessPartnerVersion(versions[0].version_id);
    expect(hit).not.toBeNull();
    expect(hit!.version_number).toBe(1);
  });

  it("#29 null fuer unbekannte version_id", async () => {
    const miss = await getBusinessPartnerVersion("no-such");
    expect(miss).toBeNull();
  });
});

describe("businessPartners · deactivate", () => {
  it("#30 setzt is_active=false, Partner bleibt persistent", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "D", partner_type: "debitor" })
    );
    await deactivateBusinessPartner(p.id);
    const after = await getBusinessPartner(p.id);
    expect(after).not.toBeNull();
    expect(after!.is_active).toBe(false);
  });

  it("#31 deactivate erzeugt Version-Snapshot", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "D", partner_type: "debitor" })
    );
    await deactivateBusinessPartner(p.id);
    const versions = await getBusinessPartnerVersions(p.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].snapshot.is_active).toBe(true);
  });
});
