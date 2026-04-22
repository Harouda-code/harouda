/**
 * Unit-Tests für AfaCalculator (lineare AfA § 7 Abs. 1 EStG).
 *
 * Sprint 6 Teil 1. Deckt ab:
 *   - Spec-Beispiel AK 10.000 / ND 5 / Kauf 15.03.2025 Jahr für Jahr
 *   - Rand-Monate (01.01. / 31.12. / Mitte Jahr)
 *   - ND-Grenzen (1 Jahr / 50 Jahre)
 *   - Erinnerungswert 1 €
 *   - Abgang im AfA-Jahr
 *   - Drift-Korrektur bei rundung-anfälligen Konstellationen
 *   - Input-Validierung (ungültige ND, AK)
 *   - summiereLineareAfa Sumcheck
 */

import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { berechneLineareAfa, summiereLineareAfa } from "../AfaCalculator";

// Fester Referenz-Fall aus der Sprint-6-Spec.
const SPEC_AK = new Decimal("10000.00");
const SPEC_ND = 5;
const SPEC_KAUF = new Date(Date.UTC(2025, 2, 15)); // 15.03.2025 UTC

describe("berechneLineareAfa — Spec-Beispiel AK 10.000 / ND 5 / Kauf 15.03.2025", () => {
  it("Vor Anschaffungsjahr (2024) → AfA 0, Restbuchwert = AK", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2024,
    });
    expect(r.afa_betrag.toNumber()).toBe(0);
    expect(r.restbuchwert.toNumber()).toBe(10000);
    expect(r.ist_erstes_jahr).toBe(false);
    expect(r.ist_letztes_jahr).toBe(false);
  });

  it("Anschaffungsjahr 2025 (10 Monate März-Dez) → AfA 1.666,67, RBW 8.333,33", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2025,
    });
    expect(r.afa_betrag.toNumber()).toBeCloseTo(1666.67, 2);
    expect(r.restbuchwert.toNumber()).toBeCloseTo(8333.33, 2);
    expect(r.ist_erstes_jahr).toBe(true);
    expect(r.ist_letztes_jahr).toBe(false);
    expect(r.abgeschrieben_monate).toBe(10);
  });

  it("Volles Folgejahr 2026 → AfA 2.000,00, RBW 6.333,33", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2026,
    });
    expect(r.afa_betrag.toNumber()).toBe(2000);
    expect(r.restbuchwert.toNumber()).toBeCloseTo(6333.33, 2);
    expect(r.abgeschrieben_monate).toBe(12);
  });

  it("Letztes volles Folgejahr 2029 → AfA 2.000,00, RBW 333,33", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2029,
    });
    expect(r.afa_betrag.toNumber()).toBe(2000);
    expect(r.restbuchwert.toNumber()).toBeCloseTo(333.33, 2);
  });

  it("Restjahr 2030 (2 Monate Jan-Feb) → AfA 333,33, RBW 0", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2030,
    });
    expect(r.afa_betrag.toNumber()).toBeCloseTo(333.33, 2);
    expect(r.restbuchwert.toNumber()).toBe(0);
    expect(r.ist_letztes_jahr).toBe(true);
    expect(r.abgeschrieben_monate).toBe(2);
  });

  it("Nach Restjahr (2031) → AfA 0, RBW 0", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2031,
    });
    expect(r.afa_betrag.toNumber()).toBe(0);
    expect(r.restbuchwert.toNumber()).toBe(0);
  });
});

describe("berechneLineareAfa — Rand-Monate", () => {
  it("Kauf 01.01. → 12 Monate im Erstjahr, letztes Jahr = ND-1 Jahre später", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: new Decimal(10000),
      nutzungsdauer_jahre: 5,
      anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)), // 01.01.2025
      jahr: 2025,
    });
    expect(r.abgeschrieben_monate).toBe(12);
    expect(r.afa_betrag.toNumber()).toBe(2000);
    expect(r.restbuchwert.toNumber()).toBe(8000);

    const rLast = berechneLineareAfa({
      anschaffungskosten: new Decimal(10000),
      nutzungsdauer_jahre: 5,
      anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
      jahr: 2029, // nd-1 = 4 Jahre später
    });
    expect(rLast.ist_letztes_jahr).toBe(true);
    expect(rLast.afa_betrag.toNumber()).toBe(2000);
    expect(rLast.restbuchwert.toNumber()).toBe(0);
  });

  it("Kauf 31.12. → 1 Monat AfA im Erstjahr", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: new Decimal(1200),
      nutzungsdauer_jahre: 10, // Monats-AfA = 10,00
      anschaffungsdatum: new Date(Date.UTC(2025, 11, 31)),
      jahr: 2025,
    });
    expect(r.abgeschrieben_monate).toBe(1);
    expect(r.afa_betrag.toNumber()).toBe(10);
    expect(r.restbuchwert.toNumber()).toBe(1190);
  });

  it("Kauf Mitte Jahr (01.07.) → 6 Monate AfA im Erstjahr", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: new Decimal(12000),
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: new Date(Date.UTC(2025, 6, 1)), // 01.07.2025
      jahr: 2025,
    });
    expect(r.abgeschrieben_monate).toBe(6);
    expect(r.afa_betrag.toNumber()).toBe(600);
  });
});

describe("berechneLineareAfa — ND-Grenzen", () => {
  it("ND 1 Jahr + Kauf 01.01. → alles im selben Jahr", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: new Decimal(500),
      nutzungsdauer_jahre: 1,
      anschaffungsdatum: new Date(Date.UTC(2025, 0, 1)),
      jahr: 2025,
    });
    expect(r.ist_erstes_jahr).toBe(true);
    expect(r.ist_letztes_jahr).toBe(true);
    expect(r.afa_betrag.toNumber()).toBe(500);
    expect(r.restbuchwert.toNumber()).toBe(0);
  });

  it("ND 50 Jahre → Summe aller Jahres-AfA == AK exakt (Decimal-Präzision)", () => {
    const ak = new Decimal("123456.78");
    const summe = summiereLineareAfa(
      ak,
      50,
      new Date(Date.UTC(2025, 4, 15)), // Mai
      2075, // = 2025 + 50 → Restjahr
    );
    expect(summe.toNumber()).toBeCloseTo(123456.78, 2);
  });
});

describe("berechneLineareAfa — 1 €-Erinnerungswert", () => {
  it("Letztes Jahr lässt 1 € stehen", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2030,
      erinnerungswert: true,
    });
    // Ohne Erinnerungswert wäre afa_betrag 333,33 und rbw 0.
    // Mit Erinnerungswert: afa_betrag = 332,33 und rbw = 1,00.
    expect(r.afa_betrag.toNumber()).toBeCloseTo(332.33, 2);
    expect(r.restbuchwert.toNumber()).toBe(1);
  });
});

describe("berechneLineareAfa — Abgang mitten im Jahr", () => {
  it("Abgang 15.06.2028 bei ND 5 / Kauf 15.03.2025 → AfA Jan-Jun = 1.000", () => {
    const r = berechneLineareAfa({
      anschaffungskosten: SPEC_AK,
      nutzungsdauer_jahre: SPEC_ND,
      anschaffungsdatum: SPEC_KAUF,
      jahr: 2028,
      abgangsdatum: new Date(Date.UTC(2028, 5, 15)), // Juni
    });
    // 6 Monate * 10000/5/12 = 1000,00
    expect(r.afa_betrag.toNumber()).toBe(1000);
    expect(r.abgeschrieben_monate).toBe(6);
    // RBW = AK - kumulierte AfA bis einschl. Juni 2028
    // Monate: erstjahr 10 + 2 volle Jahre (24) + 6 = 40
    // AfA-monatlich * 40 = 166.666 * 40 = 6666.666... → 6666.67
    // RBW = 10000 - 6666.67 = 3333.33
    expect(r.restbuchwert.toNumber()).toBeCloseTo(3333.33, 2);
    expect(r.ist_letztes_jahr).toBe(false); // regulär wäre 2030, nicht 2028
  });
});

describe("berechneLineareAfa — Drift-Korrektur bei rundungs-anfälligen Konstellationen", () => {
  it("ND 3 + Kauf April + AK 10.000 → Summe aller Jahres-AfA == AK exakt", () => {
    const ak = new Decimal(10000);
    const kauf = new Date(Date.UTC(2025, 3, 1)); // 01.04.2025
    // Folgejahre: 2026, 2027. Letztes Jahr: 2028 (3 Monate).
    // monatlich = 10000/3/12 = 277,77...
    // 2025 (9 Monate): 277,77 * 9 = 2500,00 exakt
    // 2026: 12 * 277,77 = 3333,33 gerundet
    // 2027: 3333,33
    // 2028 (3 Monate): als „Rest = AK - Summe" = 10000 - 9166,66 = 833,34 (NICHT 833,33!)
    const jahre = [2025, 2026, 2027, 2028];
    const betraege = jahre.map(
      (j) =>
        berechneLineareAfa({
          anschaffungskosten: ak,
          nutzungsdauer_jahre: 3,
          anschaffungsdatum: kauf,
          jahr: j,
        }).afa_betrag
    );
    expect(betraege[0].toNumber()).toBe(2500);
    expect(betraege[1].toNumber()).toBeCloseTo(3333.33, 2);
    expect(betraege[2].toNumber()).toBeCloseTo(3333.33, 2);
    expect(betraege[3].toNumber()).toBeCloseTo(833.34, 2); // Drift-Korrektur!
    const summe = betraege.reduce((a, b) => a.plus(b), new Decimal(0));
    expect(summe.toNumber()).toBe(10000);
  });
});

describe("berechneLineareAfa — Input-Validierung", () => {
  it("ND = 0 → Fehler", () => {
    expect(() =>
      berechneLineareAfa({
        anschaffungskosten: new Decimal(1000),
        nutzungsdauer_jahre: 0,
        anschaffungsdatum: SPEC_KAUF,
        jahr: 2025,
      })
    ).toThrow(/Nutzungsdauer/);
  });

  it("ND = 51 → Fehler", () => {
    expect(() =>
      berechneLineareAfa({
        anschaffungskosten: new Decimal(1000),
        nutzungsdauer_jahre: 51,
        anschaffungsdatum: SPEC_KAUF,
        jahr: 2025,
      })
    ).toThrow(/Nutzungsdauer/);
  });

  it("ND = 1.5 (Bruchzahl) → Fehler", () => {
    expect(() =>
      berechneLineareAfa({
        anschaffungskosten: new Decimal(1000),
        nutzungsdauer_jahre: 1.5,
        anschaffungsdatum: SPEC_KAUF,
        jahr: 2025,
      })
    ).toThrow(/Nutzungsdauer/);
  });

  it("AK ≤ 0 → Fehler", () => {
    expect(() =>
      berechneLineareAfa({
        anschaffungskosten: new Decimal(0),
        nutzungsdauer_jahre: 5,
        anschaffungsdatum: SPEC_KAUF,
        jahr: 2025,
      })
    ).toThrow(/Anschaffungskosten/);
  });
});

describe("summiereLineareAfa — Sumcheck", () => {
  it("Summe über Spec-Beispiel 2024..2030 == AK exakt", () => {
    const summe = summiereLineareAfa(SPEC_AK, SPEC_ND, SPEC_KAUF, 2030);
    expect(summe.toNumber()).toBe(10000);
  });

  it("Summe mit Erinnerungswert = AK - 1", () => {
    const summe = summiereLineareAfa(SPEC_AK, SPEC_ND, SPEC_KAUF, 2030, true);
    expect(summe.toNumber()).toBe(9999);
  });

  it("Sum-Check bei ND 3 / Kauf April / AK 10.000 == 10.000 exakt", () => {
    const ak = new Decimal(10000);
    const kauf = new Date(Date.UTC(2025, 3, 1));
    const summe = summiereLineareAfa(ak, 3, kauf, 2028);
    expect(summe.toNumber()).toBe(10000);
  });
});
