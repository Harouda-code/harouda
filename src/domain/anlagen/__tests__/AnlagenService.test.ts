/**
 * Unit-Tests für AnlagenService (Sprint 6 Teil 1).
 *
 * Abdeckt:
 *   - planAfaLauf: Aggregation aktiver Anlagen, Warnings für Nicht-linear,
 *     Überspringen von inaktiven / vor-Anschaffungs- / nach-Ende-Anlagen,
 *     Summen-Integrität.
 *   - getAnlagenspiegelData: HGB-§-284-Aggregation, Gruppierung nach Konto,
 *     Invariante `buchwert_ende = ak_ende − abschreibungen_kumuliert`,
 *     Zugänge/Abgänge-Semantik, Totals.
 *   - createAnlageWithOpening: Stammdaten + optionale Eröffnungsbuchung
 *     (DEMO-Modus, localStorage).
 *   - commitAfaLauf: Journal-Einträge + afa_buchungen-Historie.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Anlagegut } from "../../../types/db";
import { store } from "../../../api/store";
import {
  planAfaLauf,
  getAnlagenspiegelData,
  createAnlageWithOpening,
  commitAfaLauf,
} from "../AnlagenService";

// --- Fixture-Helper --------------------------------------------------------

function makeAnlage(overrides: Partial<Anlagegut> = {}): Anlagegut {
  const now = "2025-01-01T00:00:00Z";
  return {
    id: overrides.id ?? "a-1",
    company_id: null,
    inventar_nr: overrides.inventar_nr ?? "INV-001",
    bezeichnung: overrides.bezeichnung ?? "Test-Anlage",
    anschaffungsdatum: overrides.anschaffungsdatum ?? "2025-01-01",
    anschaffungskosten: overrides.anschaffungskosten ?? 10000,
    nutzungsdauer_jahre: overrides.nutzungsdauer_jahre ?? 5,
    afa_methode: overrides.afa_methode ?? "linear",
    konto_anlage: overrides.konto_anlage ?? "0440",
    konto_afa: overrides.konto_afa ?? "4830",
    konto_abschreibung_kumuliert:
      overrides.konto_abschreibung_kumuliert ?? null,
    aktiv: overrides.aktiv ?? true,
    abgangsdatum: overrides.abgangsdatum ?? null,
    abgangserloes: overrides.abgangserloes ?? null,
    notizen: overrides.notizen ?? null,
    parent_id: overrides.parent_id ?? null,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// --- planAfaLauf -----------------------------------------------------------

describe("planAfaLauf", () => {
  it("berechnet für 2 aktive Anlagen je eine Plan-Zeile mit korrektem Betrag", () => {
    const g1 = makeAnlage({
      id: "a-1",
      inventar_nr: "BGA-001",
      konto_anlage: "0440",
      anschaffungsdatum: "2025-03-15",
      anschaffungskosten: 10000,
      nutzungsdauer_jahre: 5,
    });
    const g2 = makeAnlage({
      id: "a-2",
      inventar_nr: "MASCH-001",
      konto_anlage: "0400",
      anschaffungsdatum: "2025-01-01",
      anschaffungskosten: 12000,
      nutzungsdauer_jahre: 4,
    });
    const plan = planAfaLauf(2025, [g1, g2]);
    expect(plan.lines).toHaveLength(2);
    // g1: 10000/5/12 * 10 Monate = 1666,67
    // g2: 12000/4 = 3000 (volles Jahr)
    const byInv = Object.fromEntries(
      plan.lines.map((l) => [l.anlage.inventar_nr, l])
    );
    expect(byInv["BGA-001"].afa_betrag).toBeCloseTo(1666.67, 2);
    expect(byInv["MASCH-001"].afa_betrag).toBe(3000);
    expect(plan.summe).toBeCloseTo(4666.67, 2);
  });

  it("Journal-Input der Plan-Zeile nutzt konto_afa Soll / konto_anlage Haben (direkte Netto-Methode)", () => {
    const g = makeAnlage({
      konto_anlage: "0440",
      konto_afa: "4830",
    });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines[0].journal_input.soll_konto).toBe("4830");
    expect(plan.lines[0].journal_input.haben_konto).toBe("0440");
    expect(plan.lines[0].journal_input.datum).toBe("2025-12-31");
    expect(plan.lines[0].journal_input.beleg_nr).toMatch(/^AfA-2025-INV-001/);
  });

  it("bei konto_abschreibung_kumuliert → Haben auf Wertberichtigung statt Anlage-Konto", () => {
    const g = makeAnlage({
      konto_anlage: "0440",
      konto_afa: "4830",
      konto_abschreibung_kumuliert: "0480",
    });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines[0].journal_input.haben_konto).toBe("0480");
  });

  it("überspringt inaktive Anlagen (aktiv=false) ohne Warning", () => {
    const g = makeAnlage({ aktiv: false });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(0);
    expect(plan.warnings).toHaveLength(0);
  });

  it("erzeugt Warning für nicht-lineare AfA-Methoden (Teil 2 noch nicht implementiert)", () => {
    const g = makeAnlage({ afa_methode: "degressiv" });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(0);
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0].reason).toMatch(/degressiv/);
  });

  it("überspringt Anlagen, die erst im Folgejahr angeschafft werden", () => {
    const g = makeAnlage({ anschaffungsdatum: "2026-05-01" });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(0);
  });

  it("überspringt Anlagen, deren Nutzungsdauer bereits vollständig abgelaufen ist", () => {
    const g = makeAnlage({
      anschaffungsdatum: "2020-01-01",
      nutzungsdauer_jahre: 3, // Ende 2022
    });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(0);
  });
});

// --- getAnlagenspiegelData -------------------------------------------------

describe("getAnlagenspiegelData", () => {
  it("gruppiert nach konto_anlage, je Gruppe ak_start/zugaenge/ak_ende/buchwert_ende", () => {
    // 2 Anlagen auf 0440 (vor bis_jahr angeschafft), 1 Anlage auf 0400 (im bis_jahr)
    const anlagen: Anlagegut[] = [
      makeAnlage({
        id: "a-1",
        inventar_nr: "BGA-001",
        konto_anlage: "0440",
        anschaffungsdatum: "2023-01-01",
        anschaffungskosten: 6000,
        nutzungsdauer_jahre: 6,
      }),
      makeAnlage({
        id: "a-2",
        inventar_nr: "BGA-002",
        konto_anlage: "0440",
        anschaffungsdatum: "2024-07-01",
        anschaffungskosten: 1200,
        nutzungsdauer_jahre: 3,
      }),
      makeAnlage({
        id: "a-3",
        inventar_nr: "MASCH-001",
        konto_anlage: "0400",
        anschaffungsdatum: "2025-01-01",
        anschaffungskosten: 12000,
        nutzungsdauer_jahre: 4,
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);

    expect(data.gruppen).toHaveLength(2);
    const g0400 = data.gruppen.find((g) => g.konto_anlage === "0400")!;
    const g0440 = data.gruppen.find((g) => g.konto_anlage === "0440")!;

    // 0400: Zugang im bis_jahr → ak_start 0, zugaenge 12000, ak_ende 12000
    expect(g0400.ak_start).toBe(0);
    expect(g0400.zugaenge).toBe(12000);
    expect(g0400.ak_ende).toBe(12000);
    expect(g0400.anzahl).toBe(1);

    // 0440: beide vor 2025 → ak_start 7200, zugaenge 0
    expect(g0440.ak_start).toBe(7200);
    expect(g0440.zugaenge).toBe(0);
    expect(g0440.ak_ende).toBe(7200);
    expect(g0440.anzahl).toBe(2);

    // Totals
    expect(data.totals.ak_start).toBe(7200);
    expect(data.totals.zugaenge).toBe(12000);
    expect(data.totals.ak_ende).toBe(19200);
  });

  it("Invariante: buchwert_ende == ak_ende − abschreibungen_kumuliert", () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        anschaffungsdatum: "2023-03-15",
        anschaffungskosten: 10000,
        nutzungsdauer_jahre: 5,
        konto_anlage: "0440",
      }),
      makeAnlage({
        id: "a-2",
        inventar_nr: "INV-002",
        anschaffungsdatum: "2025-01-01",
        anschaffungskosten: 6000,
        nutzungsdauer_jahre: 3,
        konto_anlage: "0400",
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    for (const g of [...data.gruppen, data.totals]) {
      const expected = Math.round(
        (g.ak_ende - g.abschreibungen_kumuliert) * 100
      ) / 100;
      expect(g.buchwert_ende).toBeCloseTo(expected, 2);
    }
  });

  it("Abgang im bis_jahr → AK als Abgang, nicht mehr in ak_ende", () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        anschaffungsdatum: "2022-01-01",
        anschaffungskosten: 8000,
        nutzungsdauer_jahre: 8,
        abgangsdatum: "2025-06-30",
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    const g = data.gruppen[0];
    expect(g.ak_start).toBe(8000);
    expect(g.abgaenge).toBe(8000);
    expect(g.ak_ende).toBe(0);
    expect(g.buchwert_ende).toBe(0);
  });

  it("leere Anlagen-Liste → Totals 0, keine Gruppen", () => {
    const data = getAnlagenspiegelData(2025, []);
    expect(data.gruppen).toHaveLength(0);
    expect(data.totals.ak_start).toBe(0);
    expect(data.totals.ak_ende).toBe(0);
    expect(data.totals.buchwert_ende).toBe(0);
  });
});

// --- createAnlageWithOpening -----------------------------------------------

describe("createAnlageWithOpening", () => {
  it("ohne gegenkonto → Stammdaten only, kein Journal-Eintrag", async () => {
    const { anlage, journal } = await createAnlageWithOpening(
      {
        inventar_nr: "INV-001",
        bezeichnung: "Büromaschine",
        anschaffungsdatum: "2025-03-15",
        anschaffungskosten: 2400,
        nutzungsdauer_jahre: 8,
        afa_methode: "linear",
        konto_anlage: "0440",
        konto_afa: "4830",
      },
      {},
      null
    );
    expect(anlage.inventar_nr).toBe("INV-001");
    expect(journal).toBeNull();
    expect(store.getAnlagegueter()).toHaveLength(1);
    expect(store.getEntries()).toHaveLength(0);
  });

  it("mit gegenkonto → Stammdaten + Eröffnungsbuchung Soll Anlage / Haben Gegenkonto", async () => {
    const { anlage, journal } = await createAnlageWithOpening(
      {
        inventar_nr: "INV-001",
        bezeichnung: "Büromaschine",
        anschaffungsdatum: "2025-03-15",
        anschaffungskosten: 2400,
        nutzungsdauer_jahre: 8,
        afa_methode: "linear",
        konto_anlage: "0440",
        konto_afa: "4830",
      },
      { gegenkonto: "1200" },
      null
    );
    expect(anlage).not.toBeNull();
    expect(journal).not.toBeNull();
    expect(journal!.soll_konto).toBe("0440");
    expect(journal!.haben_konto).toBe("1200");
    expect(journal!.betrag).toBe(2400);
    expect(store.getEntries()).toHaveLength(1);
  });
});

// --- commitAfaLauf ---------------------------------------------------------

describe("commitAfaLauf", () => {
  it("erzeugt pro Plan-Line einen Journal-Eintrag und einen afa_buchungen-Eintrag", async () => {
    // Zwei Anlagen im Store via createAnlageWithOpening anlegen
    const r1 = await createAnlageWithOpening(
      {
        inventar_nr: "INV-001",
        bezeichnung: "BGA 1",
        anschaffungsdatum: "2025-01-01",
        anschaffungskosten: 12000,
        nutzungsdauer_jahre: 4,
        afa_methode: "linear",
        konto_anlage: "0440",
        konto_afa: "4830",
      },
      {},
      null
    );
    const r2 = await createAnlageWithOpening(
      {
        inventar_nr: "INV-002",
        bezeichnung: "Maschine 1",
        anschaffungsdatum: "2025-07-01",
        anschaffungskosten: 6000,
        nutzungsdauer_jahre: 5,
        afa_methode: "linear",
        konto_anlage: "0400",
        konto_afa: "4830",
      },
      {},
      null
    );
    const plan = planAfaLauf(2025, [r1.anlage, r2.anlage]);
    expect(plan.lines).toHaveLength(2);

    const res = await commitAfaLauf(plan);
    expect(res.createdJournal).toBe(2);

    const afaBuchungen = store.getAfaBuchungen();
    expect(afaBuchungen).toHaveLength(2);
    // Jede afa_buchung hat eine journal_entry_id
    for (const ab of afaBuchungen) {
      expect(ab.journal_entry_id).not.toBeNull();
      expect(ab.jahr).toBe(2025);
    }

    // Journal-Einträge vorhanden (je Anlage)
    const entries = store.getEntries();
    const afaEntries = entries.filter((e) => e.beleg_nr.startsWith("AfA-2025"));
    expect(afaEntries).toHaveLength(2);
  });
});
