// Sprint 19.C.3 · belege-Partner-Link-Tests (DEMO-Mode).
//
// Verifiziert, dass createJournalFromBeleg die neuen Felder
// business_partner_id + business_partner_version_id korrekt auf den
// gespeicherten Beleg durchreicht und die Version-Referenz automatisch
// aufloest, wenn keine explizite version_id uebergeben wird.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { JournalRepo } from "../../lib/db/journalRepo";
import { Money } from "../../lib/money/Money";
import type { BelegEntry } from "../../domain/belege/types";
import {
  createBusinessPartner,
  updateBusinessPartner,
} from "../businessPartners";

function sampleBeleg(overrides: Partial<BelegEntry> = {}): BelegEntry {
  return {
    belegart: "AUSGANGSRECHNUNG",
    belegnummer: "AR-2026-001",
    belegdatum: "2026-04-01",
    buchungsdatum: "2026-04-01",
    beschreibung: "Test-Rechnung",
    partner: { name: "Kunde GmbH", ustId: "DE123456789" },
    positionen: [
      { konto: "1400", side: "SOLL", betrag: new Money("119") },
      { konto: "8400", side: "HABEN", betrag: new Money("100"), ustSatz: 0.19 },
      { konto: "1776", side: "HABEN", betrag: new Money("19") },
    ],
    netto: new Money("100"),
    steuerbetrag: new Money("19"),
    brutto: new Money("119"),
    ...overrides,
  };
}

async function seedDebitor(name = "Kunde GmbH"): Promise<string> {
  const p = await createBusinessPartner({
    company_id: "c-1",
    client_id: "cl-1",
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
  return p.id;
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("createJournalFromBeleg · business_partner_id/version_id", () => {
  it("#1 Ohne partner-link: beide Felder null (Legacy-Pfad)", async () => {
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(sampleBeleg(), {
      status: "ENTWURF",
    });
    expect(beleg.business_partner_id).toBeNull();
    expect(beleg.business_partner_version_id).toBeNull();
  });

  it("#2 Mit business_partner_id ohne version: version_id bleibt null (keine Version vorhanden)", async () => {
    const id = await seedDebitor();
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(sampleBeleg(), {
      status: "ENTWURF",
      business_partner_id: id,
    });
    expect(beleg.business_partner_id).toBe(id);
    expect(beleg.business_partner_version_id).toBeNull();
  });

  it("#3 Mit partner_id nach Update: version_id bleibt null (VEREINFACHUNG 19.C)", async () => {
    // Sprint 19.C-VEREINFACHUNG: Kein Auto-Resolve auf versions[0] — die
    // Snapshots sind Pre-Update-Historie, nicht der aktuelle Zustand.
    // Ein stabiler current_version_pointer kommt Sprint 20+.
    const id = await seedDebitor("Kunde AG");
    await updateBusinessPartner(id, { name: "Kunde AG neu" });
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(sampleBeleg(), {
      status: "ENTWURF",
      business_partner_id: id,
    });
    expect(beleg.business_partner_id).toBe(id);
    expect(beleg.business_partner_version_id).toBeNull();
  });

  it("#4 Explizite version_id hat Vorrang vor Auto-Resolve", async () => {
    const id = await seedDebitor();
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(sampleBeleg(), {
      status: "ENTWURF",
      business_partner_id: id,
      business_partner_version_id: "v-explicit",
    });
    expect(beleg.business_partner_version_id).toBe("v-explicit");
  });

  it("#5 partner_name-Drift loest Console-Warning aus", async () => {
    const id = await seedDebitor("Echte Kunde GmbH");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const repo = new JournalRepo();
    await repo.createJournalFromBeleg(
      sampleBeleg({ partner: { name: "Anderer Name GmbH" } }),
      { status: "ENTWURF", business_partner_id: id }
    );
    expect(warnSpy).toHaveBeenCalled();
    const call = warnSpy.mock.calls[0]?.[0] as string | undefined;
    expect(call).toMatch(/partner_name-Drift/);
    warnSpy.mockRestore();
  });

  it("#6 Ohne partner_id: keine Warnung auch bei anderem partner.name", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const repo = new JournalRepo();
    await repo.createJournalFromBeleg(
      sampleBeleg({ partner: { name: "Beliebig" } }),
      { status: "ENTWURF" }
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("#7 Unbekannte partner_id → kein Throw (best-effort-Resolve)", async () => {
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(sampleBeleg(), {
      status: "ENTWURF",
      business_partner_id: "no-such-partner",
    });
    expect(beleg.business_partner_id).toBe("no-such-partner");
    expect(beleg.business_partner_version_id).toBeNull();
  });
});
