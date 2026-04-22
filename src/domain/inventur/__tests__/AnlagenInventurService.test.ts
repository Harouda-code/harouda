// Sprint 17 / Schritt 5 · AnlagenInventurService-Tests.

import { describe, it, expect } from "vitest";
import {
  prepareAnlagenInventur,
  proposeAbgangsBuchung,
} from "../AnlagenInventurService";
import type { Anlagegut } from "../../../types/db";

function anlage(overrides: Partial<Anlagegut> = {}): Anlagegut {
  return {
    id: "ag-1",
    company_id: null,
    client_id: null,
    inventar_nr: "A-001",
    bezeichnung: "Bürostuhl",
    anschaffungsdatum: "2024-01-01",
    anschaffungskosten: 3000,
    nutzungsdauer_jahre: 5,
    afa_methode: "linear",
    konto_anlage: "0420",
    konto_afa: "4830",
    konto_abschreibung_kumuliert: null,
    aktiv: true,
    abgangsdatum: null,
    abgangserloes: null,
    notizen: null,
    parent_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("prepareAnlagenInventur", () => {
  it("#1 Liste enthaelt alle aktiven Anlagen mit Buchwert zum Stichtag", () => {
    const list = prepareAnlagenInventur({
      anlagen: [anlage()],
      stichtag: "2025-12-31",
    });
    expect(list).toHaveLength(1);
    expect(list[0].anlage_id).toBe("ag-1");
    expect(list[0].inventar_nr).toBe("A-001");
    expect(list[0].bezeichnung).toBe("Bürostuhl");
    expect(list[0].konto_anlage).toBe("0420");
    // AfA linear 5 Jahre, 2 Jahre vergangen (2024 + 2025) = 2 * 600 = 1200 AfA.
    // Restbuchwert ~ 3000 - 1200 = 1800.
    expect(list[0].buchwert_stichtag).toBe(1800);
    expect(list[0].letzter_status).toBeNull();
  });

  it("#2 Inaktive Anlagen werden gefiltert aus", () => {
    const list = prepareAnlagenInventur({
      anlagen: [anlage(), anlage({ id: "ag-2", aktiv: false })],
      stichtag: "2025-12-31",
    });
    expect(list).toHaveLength(1);
    expect(list[0].anlage_id).toBe("ag-1");
  });

  it("#3 existingChecks fuellt letzter_status-Feld", () => {
    const list = prepareAnlagenInventur({
      anlagen: [anlage()],
      stichtag: "2025-12-31",
      existingChecks: [{ anlage_id: "ag-1", status: "verlust" }],
    });
    expect(list[0].letzter_status).toBe("verlust");
  });

  it("#4 Leere Anlagen-Liste → leere Check-Liste", () => {
    const list = prepareAnlagenInventur({
      anlagen: [],
      stichtag: "2025-12-31",
    });
    expect(list).toEqual([]);
  });
});

describe("proposeAbgangsBuchung", () => {
  it("#5 Verlust: soll=null (User waehlt), haben=konto_anlage, betrag=buchwert", () => {
    const r = proposeAbgangsBuchung({
      anlage: anlage(),
      buchwert_stichtag: 1800,
      grund: "verlust",
      stichtag: "2025-12-31",
    });
    expect(r.soll_konto_nr).toBeNull();
    expect(r.haben_konto_nr).toBe("0420");
    expect(r.betrag).toBe(1800);
    expect(r.buchungstext).toContain("Verlust");
    expect(r.buchungstext).toContain("A-001");
    expect(r.warnings.join("|")).toContain("Aufwands-Konto");
  });

  it("#6 Schaden mit Aufwand-Konto: soll=konto, haben=konto_anlage", () => {
    const r = proposeAbgangsBuchung({
      anlage: anlage(),
      buchwert_stichtag: 1200,
      grund: "schaden",
      stichtag: "2025-12-31",
      aufwand_konto_nr: "2400",
    });
    expect(r.soll_konto_nr).toBe("2400");
    expect(r.haben_konto_nr).toBe("0420");
    expect(r.betrag).toBe(1200);
    expect(r.buchungstext).toContain("Schaden");
    expect(r.warnings.join("|")).not.toContain("Aufwands-Konto");
  });

  it("#7 Buchwert = 0 → Warnung 'keine Abgangs-Buchung erforderlich'", () => {
    const r = proposeAbgangsBuchung({
      anlage: anlage(),
      buchwert_stichtag: 0,
      grund: "verlust",
      stichtag: "2025-12-31",
      aufwand_konto_nr: "2400",
    });
    expect(r.warnings.join("|")).toMatch(/Restbuchwert.*0/);
  });

  it("#8 Begruendung referenziert § 253 Abs. 3 HGB", () => {
    const r = proposeAbgangsBuchung({
      anlage: anlage(),
      buchwert_stichtag: 1000,
      grund: "verlust",
      stichtag: "2025-12-31",
      aufwand_konto_nr: "2400",
    });
    expect(r.begruendung.join("|")).toContain("§ 253 Abs. 3 HGB");
  });
});
