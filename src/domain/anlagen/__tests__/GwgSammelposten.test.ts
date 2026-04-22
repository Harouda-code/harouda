/**
 * Sprint 6 Teil 2b — GWG-Sofortabschreibung (§ 6 Abs. 2 EStG) +
 * Sammelposten-Poolabschreibung (§ 6 Abs. 2a EStG).
 *
 * Deckt ab:
 *   - GWG: volle AK im Anschaffungsjahr, 0 in Folgejahren
 *   - Sammelposten: 5-Jahres-Pool, volle Jahresrate auch im Erstjahr
 *   - Grenzwert-Validierung (≤ 800 € Warnung, 250 < AK ≤ 1000 Pflicht)
 *   - Dispatch durch planAfaLauf + Anlagenspiegel-Aggregation
 */

import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import type { Anlagegut } from "../../../types/db";
import {
  berechneGwgAfa,
  berechneSammelpostenAfa,
  summiereLineareAfa,
} from "../AfaCalculator";
import { planAfaLauf, getAnlagenspiegelData } from "../AnlagenService";

function makeAnlage(overrides: Partial<Anlagegut> = {}): Anlagegut {
  const now = "2025-01-01T00:00:00Z";
  return {
    id: overrides.id ?? "a-1",
    company_id: null,
    inventar_nr: overrides.inventar_nr ?? "INV-001",
    bezeichnung: overrides.bezeichnung ?? "Test",
    anschaffungsdatum: overrides.anschaffungsdatum ?? "2025-04-01",
    anschaffungskosten: overrides.anschaffungskosten ?? 500,
    nutzungsdauer_jahre: overrides.nutzungsdauer_jahre ?? 1,
    afa_methode: overrides.afa_methode ?? "linear",
    konto_anlage: overrides.konto_anlage ?? "0480",
    konto_afa: overrides.konto_afa ?? "4840",
    konto_abschreibung_kumuliert:
      overrides.konto_abschreibung_kumuliert ?? null,
    aktiv: overrides.aktiv ?? true,
    abgangsdatum: overrides.abgangsdatum ?? null,
    abgangserloes: overrides.abgangserloes ?? null,
    notizen: overrides.notizen ?? null,
    parent_id: overrides.parent_id ?? null,
    created_at: now,
    updated_at: now,
  };
}

// --- berechneGwgAfa ------------------------------------------------------

describe("berechneGwgAfa — § 6 Abs. 2 EStG", () => {
  it("500 € Anschaffung Juli 2025 → 500 € AfA in 2025, 0 € in 2026", () => {
    const ak = new Decimal(500);
    const r1 = berechneGwgAfa({
      anschaffungskosten: ak,
      anschaffungsdatum: new Date(Date.UTC(2025, 6, 1)),
      jahr: 2025,
    });
    expect(r1.afa_betrag.toNumber()).toBe(500);
    expect(r1.restbuchwert.toNumber()).toBe(0);
    expect(r1.ist_erstes_jahr).toBe(true);
    expect(r1.ist_letztes_jahr).toBe(true);

    const r2 = berechneGwgAfa({
      anschaffungskosten: ak,
      anschaffungsdatum: new Date(Date.UTC(2025, 6, 1)),
      jahr: 2026,
    });
    expect(r2.afa_betrag.toNumber()).toBe(0);
    expect(r2.restbuchwert.toNumber()).toBe(0);
  });

  it("800 € an der GWG-Grenze → voll im Anschaffungsjahr", () => {
    const r = berechneGwgAfa({
      anschaffungskosten: new Decimal(800),
      anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
      jahr: 2025,
    });
    expect(r.afa_betrag.toNumber()).toBe(800);
    expect(r.restbuchwert.toNumber()).toBe(0);
  });

  it("Jahr vor Anschaffung → AfA 0, RBW = AK (keine Rückbuchung)", () => {
    const r = berechneGwgAfa({
      anschaffungskosten: new Decimal(500),
      anschaffungsdatum: new Date(Date.UTC(2025, 3, 1)),
      jahr: 2024,
    });
    expect(r.afa_betrag.toNumber()).toBe(0);
    expect(r.restbuchwert.toNumber()).toBe(500);
  });

  it("Calculator prüft die 800-€-Grenze NICHT — 850 € ergibt 850 € AfA (Validation in UI)", () => {
    const r = berechneGwgAfa({
      anschaffungskosten: new Decimal(850),
      anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
      jahr: 2025,
    });
    // Calculator: ohne harte Grenze. UI-Warnung muss der Caller liefern.
    expect(r.afa_betrag.toNumber()).toBe(850);
  });

  it("AK ≤ 0 → Fehler", () => {
    expect(() =>
      berechneGwgAfa({
        anschaffungskosten: new Decimal(0),
        anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
        jahr: 2025,
      })
    ).toThrow(/Anschaffungskosten/);
  });
});

// --- berechneSammelpostenAfa --------------------------------------------

describe("berechneSammelpostenAfa — § 6 Abs. 2a EStG", () => {
  it("500 € Anschaffung beliebigen Monat → 5 × 100 € (volle Jahresrate im Erstjahr)", () => {
    const ak = new Decimal(500);
    // Kauf 15.11.2025 (spätes Jahr) — trotzdem volle 100 € in 2025
    const kauf = new Date(Date.UTC(2025, 10, 15));
    const jahre = [2025, 2026, 2027, 2028, 2029];
    const betraege = jahre.map(
      (j) =>
        berechneSammelpostenAfa({
          anschaffungskosten: ak,
          anschaffungsdatum: kauf,
          jahr: j,
        }).afa_betrag
    );
    expect(betraege.map((b) => b.toNumber())).toEqual([100, 100, 100, 100, 100]);
    const summe = betraege.reduce((a, b) => a.plus(b), new Decimal(0));
    expect(summe.toNumber()).toBe(500);
  });

  it("1.000 € an der Obergrenze → 5 × 200 €", () => {
    const ak = new Decimal(1000);
    const kauf = new Date(Date.UTC(2025, 0, 1));
    const summe = summiereLineareAfa(ak, 1, kauf, 2030); // lineare summe ist hier nicht nutzbar; testen wir direkt
    // Besser: die Jahre einzeln abrufen.
    let s = new Decimal(0);
    for (let j = 2025; j <= 2029; j++) {
      s = s.plus(
        berechneSammelpostenAfa({
          anschaffungskosten: ak,
          anschaffungsdatum: kauf,
          jahr: j,
        }).afa_betrag
      );
    }
    expect(s.toNumber()).toBe(1000);
    // summe (lineare Hilfsfunktion) ist nicht aussagekräftig — ignorieren.
    expect(summe.toNumber()).toBeGreaterThanOrEqual(0);
  });

  it("Volle Jahresrate auch bei Kauf Dezember → 100 € in 2025, keine Monatsanteile", () => {
    const r = berechneSammelpostenAfa({
      anschaffungskosten: new Decimal(500),
      anschaffungsdatum: new Date(Date.UTC(2025, 11, 31)),
      jahr: 2025,
    });
    expect(r.afa_betrag.toNumber()).toBe(100);
    expect(r.abgeschrieben_monate).toBe(12); // flag zeigt volle Jahresrate
  });

  it("AK = 250,00 € (Grenze, inklusive) → Fehler (muss > 250)", () => {
    expect(() =>
      berechneSammelpostenAfa({
        anschaffungskosten: new Decimal(250),
        anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
        jahr: 2025,
      })
    ).toThrow(/> 250/);
  });

  it("AK = 1.001 € → Fehler (muss ≤ 1000)", () => {
    expect(() =>
      berechneSammelpostenAfa({
        anschaffungskosten: new Decimal(1001),
        anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
        jahr: 2025,
      })
    ).toThrow(/≤ 1\.000/);
  });

  it("Jahr N+5 und später → AfA 0, RBW 0", () => {
    const ak = new Decimal(500);
    const kauf = new Date(Date.UTC(2025, 0, 1));
    const r = berechneSammelpostenAfa({
      anschaffungskosten: ak,
      anschaffungsdatum: kauf,
      jahr: 2030,
    });
    expect(r.afa_betrag.toNumber()).toBe(0);
    expect(r.restbuchwert.toNumber()).toBe(0);
  });

  it("Restbuchwert nach jedem Jahr = AK − Summe bisherige Jahresraten", () => {
    const ak = new Decimal(500);
    const kauf = new Date(Date.UTC(2025, 0, 1));
    const r2025 = berechneSammelpostenAfa({
      anschaffungskosten: ak,
      anschaffungsdatum: kauf,
      jahr: 2025,
    });
    expect(r2025.restbuchwert.toNumber()).toBe(400);
    const r2027 = berechneSammelpostenAfa({
      anschaffungskosten: ak,
      anschaffungsdatum: kauf,
      jahr: 2027,
    });
    expect(r2027.restbuchwert.toNumber()).toBe(200);
    const r2029 = berechneSammelpostenAfa({
      anschaffungskosten: ak,
      anschaffungsdatum: kauf,
      jahr: 2029,
    });
    expect(r2029.restbuchwert.toNumber()).toBe(0);
    expect(r2029.ist_letztes_jahr).toBe(true);
  });
});

// --- planAfaLauf dispatch je Methode -----------------------------------

describe("planAfaLauf — Methoden-Dispatch", () => {
  it("GWG-Anlage in Anschaffungsjahr → 1 Plan-Zeile AK-voll", () => {
    const g = makeAnlage({
      afa_methode: "gwg_sofort",
      anschaffungsdatum: "2025-04-15",
      anschaffungskosten: 500,
      nutzungsdauer_jahre: 1,
    });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0].afa_betrag).toBe(500);
    expect(plan.lines[0].restbuchwert).toBe(0);
    expect(plan.warnings).toHaveLength(0);
  });

  it("GWG-Anlage in Folgejahr → 0 Plan-Zeilen (bereits abgeschrieben)", () => {
    const g = makeAnlage({
      afa_methode: "gwg_sofort",
      anschaffungsdatum: "2024-04-15",
      anschaffungskosten: 500,
      nutzungsdauer_jahre: 1,
    });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(0);
    expect(plan.warnings).toHaveLength(0);
  });

  it("Sammelposten in 5 Jahren → jedes Jahr gleich hohe Plan-Zeile", () => {
    const g = makeAnlage({
      afa_methode: "sammelposten",
      anschaffungsdatum: "2025-03-01",
      anschaffungskosten: 500,
      nutzungsdauer_jahre: 5,
    });
    const betraege = [2025, 2026, 2027, 2028, 2029].map(
      (j) => planAfaLauf(j, [g]).lines[0]?.afa_betrag ?? 0
    );
    expect(betraege).toEqual([100, 100, 100, 100, 100]);
    const plan2030 = planAfaLauf(2030, [g]);
    expect(plan2030.lines).toHaveLength(0);
  });

  it("Sammelposten mit ungültiger AK (z.B. 200 €) → Warning, keine Plan-Zeile", () => {
    const g = makeAnlage({
      afa_methode: "sammelposten",
      anschaffungskosten: 200, // unterhalb der 250-Grenze
    });
    const plan = planAfaLauf(2025, [g]);
    expect(plan.lines).toHaveLength(0);
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0].reason).toMatch(/> 250/);
  });
});

// --- Anlagenspiegel-Aggregation ----------------------------------------

describe("getAnlagenspiegelData — GWG + Sammelposten", () => {
  it("GWG zum Ende Anschaffungsjahr: RBW 0, kum AfA = AK", () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        afa_methode: "gwg_sofort",
        konto_anlage: "0480",
        anschaffungsdatum: "2025-05-01",
        anschaffungskosten: 600,
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    const g = data.gruppen[0];
    expect(g.ak_ende).toBe(600);
    expect(g.abschreibungen_kumuliert).toBe(600);
    expect(g.buchwert_ende).toBe(0);
  });

  it("Sammelposten nach 2 Jahren: kum AfA = 2 × Jahresrate, RBW = AK − 2×Rate", () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        afa_methode: "sammelposten",
        anschaffungsdatum: "2024-06-15",
        anschaffungskosten: 500,
      }),
    ];
    // Bis Ende 2025 = 2 Jahres-Raten (2024 + 2025) à 100 € = 200 € kum AfA
    const data = getAnlagenspiegelData(2025, anlagen);
    const g = data.gruppen[0];
    expect(g.abschreibungen_kumuliert).toBe(200);
    expect(g.buchwert_ende).toBe(300);
  });
});
