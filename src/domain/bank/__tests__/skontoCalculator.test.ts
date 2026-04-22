/**
 * Unit-Tests für src/domain/bank/skontoCalculator.ts — Skonto-Automatik
 * für den Bank-Zahlungsabgleich. Sprint 5, Phase B2.
 *
 * Prüft:
 *   - Happy Path: Skonto 3 % bei 19 % USt (Forderung, 3 Zeilen)
 *   - Happy Path: Skonto 2 % bei 7 % USt (Forderung, 3 Zeilen)
 *   - Happy Path: Verbindlichkeit 2 % bei 19 % USt (Erhaltener Skonto)
 *   - USt-Satz 0 → 2 Zeilen statt 3 (keine USt-Korrektur)
 *   - Differenz = 0 (Vollzahlung) → nicht anwendbar
 *   - Differenz > Skonto-Schwelle → nicht anwendbar
 *   - Skonto-Frist überschritten → nicht anwendbar
 *   - skontoPct null/0 → nicht anwendbar
 *   - skontoTage null → nicht anwendbar
 *   - Rundungs-Schwelle < 0,01 € → nicht anwendbar
 *   - Sumcheck: Zahlung + Skonto-Netto + USt-Korrektur = OP-Brutto
 */

import { describe, it, expect } from "vitest";
import { calculateSkontoPlan } from "../skontoCalculator";

describe("calculateSkontoPlan — Forderung (Debitor)", () => {
  it("Skonto 3 % bei 19 % USt → 3-Zeilen-Splittung korrekt", () => {
    // Rechnung Brutto 1190 (Netto 1000, USt 190), Skonto 3 %
    // Skonto-Schwelle = 35,70 → Bank zahlt 1154,30
    const plan = calculateSkontoPlan({
      bankBetrag: 1154.3,
      bankDatum: "2025-03-10",
      offenBetrag: 1190.0,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(true);
    if (!plan.applicable) return;
    expect(plan.skontoBrutto).toBe(35.7);
    expect(plan.skontoNetto).toBe(30.0);
    expect(plan.skontoUst).toBe(5.7);
    expect(plan.lines).toHaveLength(3);

    // Zeile 1: Zahlung
    expect(plan.lines[0]).toMatchObject({
      soll_konto: "1200",
      haben_konto: "1400",
      betrag: 1154.3,
      rolle: "zahlung",
    });
    // Zeile 2: Skonto Netto → Gewährte Skonti 19 % (8730)
    expect(plan.lines[1]).toMatchObject({
      soll_konto: "8730",
      haben_konto: "1400",
      betrag: 30.0,
      rolle: "skonto",
    });
    // Zeile 3: USt-Korrektur → 1776
    expect(plan.lines[2]).toMatchObject({
      soll_konto: "1776",
      haben_konto: "1400",
      betrag: 5.7,
      rolle: "ust_korrektur",
    });

    // Sumcheck: Bank + Netto + USt = OP-Brutto
    const sumOnHabenside =
      plan.lines[0].betrag + plan.lines[1].betrag + plan.lines[2].betrag;
    expect(sumOnHabenside).toBeCloseTo(1190.0, 2);
  });

  it("Skonto 2 % bei 7 % USt → nutzt 8731 (Skonti 7 %) und 1771 (USt 7 %)", () => {
    // Brutto 107 (Netto 100, USt 7), Skonto 2 % = 2,14
    const plan = calculateSkontoPlan({
      bankBetrag: 104.86,
      bankDatum: "2025-03-05",
      offenBetrag: 107.0,
      rechnungDatum: "2025-03-01",
      skontoPct: 2,
      skontoTage: 10,
      ustSatz: 7,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(true);
    if (!plan.applicable) return;
    expect(plan.skontoBrutto).toBe(2.14);
    expect(plan.skontoNetto).toBe(2.0);
    expect(plan.skontoUst).toBe(0.14);
    expect(plan.lines[1].soll_konto).toBe("8731");
    expect(plan.lines[2].soll_konto).toBe("1771");
  });
});

describe("calculateSkontoPlan — Verbindlichkeit (Kreditor)", () => {
  it("Erhaltener Skonto 2 % bei 19 % USt → 1600 an 3736/1576, Bank-Ausgang gebucht", () => {
    // Eingangsrechnung Brutto 595 (Netto 500, USt 95), Skonto 2 % = 11,90
    const plan = calculateSkontoPlan({
      bankBetrag: 583.1,
      bankDatum: "2025-04-10",
      offenBetrag: 595.0,
      rechnungDatum: "2025-04-01",
      skontoPct: 2,
      skontoTage: 14,
      ustSatz: 19,
      kind: "verbindlichkeit",
    });
    expect(plan.applicable).toBe(true);
    if (!plan.applicable) return;
    expect(plan.skontoBrutto).toBe(11.9);
    expect(plan.skontoNetto).toBe(10.0);
    expect(plan.skontoUst).toBe(1.9);
    expect(plan.lines).toHaveLength(3);

    // Zeile 1: Zahlungsausgang 1600 an 1200
    expect(plan.lines[0]).toMatchObject({
      soll_konto: "1600",
      haben_konto: "1200",
      betrag: 583.1,
      rolle: "zahlung",
    });
    // Zeile 2: Erhaltener Skonto 1600 an 3736 (19 %)
    expect(plan.lines[1]).toMatchObject({
      soll_konto: "1600",
      haben_konto: "3736",
      betrag: 10.0,
      rolle: "skonto",
    });
    // Zeile 3: Vorsteuer-Korrektur 1600 an 1576 (19 %)
    expect(plan.lines[2]).toMatchObject({
      soll_konto: "1600",
      haben_konto: "1576",
      betrag: 1.9,
      rolle: "ust_korrektur",
    });
  });
});

describe("calculateSkontoPlan — 2-Zeilen-Sonderfall bei USt 0", () => {
  it("USt-Satz 0 → keine dritte Zeile (keine USt-Korrektur)", () => {
    // Rechnung ohne USt (z. B. § 4 UStG-frei, ig. Lieferung)
    // Brutto = Netto = 1000, Skonto 2 % = 20,00
    const plan = calculateSkontoPlan({
      bankBetrag: 980.0,
      bankDatum: "2025-05-03",
      offenBetrag: 1000.0,
      rechnungDatum: "2025-05-01",
      skontoPct: 2,
      skontoTage: 14,
      ustSatz: 0,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(true);
    if (!plan.applicable) return;
    expect(plan.skontoBrutto).toBe(20.0);
    expect(plan.skontoNetto).toBe(20.0);
    expect(plan.skontoUst).toBe(0);
    expect(plan.lines).toHaveLength(2);
    expect(plan.lines[0].rolle).toBe("zahlung");
    expect(plan.lines[1].rolle).toBe("skonto");
  });
});

describe("calculateSkontoPlan — Rejection-Pfade (applicable:false)", () => {
  it("Vollzahlung (Differenz = 0) → nicht anwendbar", () => {
    const plan = calculateSkontoPlan({
      bankBetrag: 1190,
      bankDatum: "2025-03-05",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(false);
    if (plan.applicable) return;
    expect(plan.reason).toMatch(/keine Unterzahlung/i);
  });

  it("Differenz > Skonto-Schwelle → nicht anwendbar", () => {
    // OP 1190, Skonto 3 % = 35,70 → Bankzahlung 1100 (Differenz 90) übersteigt Schwelle
    const plan = calculateSkontoPlan({
      bankBetrag: 1100,
      bankDatum: "2025-03-05",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(false);
    if (plan.applicable) return;
    expect(plan.reason).toMatch(/Skonto-Schwelle/i);
  });

  it("Bankdatum nach Skonto-Frist → nicht anwendbar", () => {
    // Rechnung 2025-03-01 + 14 Tage → Frist bis 2025-03-15. Bank 2025-03-20.
    const plan = calculateSkontoPlan({
      bankBetrag: 1154.3,
      bankDatum: "2025-03-20",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(false);
    if (plan.applicable) return;
    expect(plan.reason).toMatch(/Skonto-Frist/i);
  });

  it("skontoPct null → nicht anwendbar", () => {
    const plan = calculateSkontoPlan({
      bankBetrag: 1154.3,
      bankDatum: "2025-03-05",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: null,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(false);
    if (plan.applicable) return;
    expect(plan.reason).toMatch(/kein Skonto-Satz/i);
  });

  it("skontoTage null → nicht anwendbar", () => {
    const plan = calculateSkontoPlan({
      bankBetrag: 1154.3,
      bankDatum: "2025-03-05",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: null,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(false);
    if (plan.applicable) return;
    expect(plan.reason).toMatch(/keine Skonto-Frist/i);
  });

  it("Mikro-Differenz (< 0,01 €) → nicht anwendbar (Rundungsschutz)", () => {
    // Praxis: Bank 1189.998, OP 1190.00 → diff = 0.002 → round2 = 0 → "Keine Unterzahlung"
    // Deckt den Rundungs-Zweig ab (skontoBrutto = 0).
    const plan = calculateSkontoPlan({
      bankBetrag: 1189.998,
      bankDatum: "2025-03-05",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(false);
  });
});

describe("calculateSkontoPlan — Frist-Grenze taggenau", () => {
  it("Bankdatum = genau letzter Skonto-Tag → noch anwendbar", () => {
    // Rechnung 2025-03-01 + 14 = 2025-03-15. Bank genau am 15.
    const plan = calculateSkontoPlan({
      bankBetrag: 1154.3,
      bankDatum: "2025-03-15",
      offenBetrag: 1190,
      rechnungDatum: "2025-03-01",
      skontoPct: 3,
      skontoTage: 14,
      ustSatz: 19,
      kind: "forderung",
    });
    expect(plan.applicable).toBe(true);
    if (!plan.applicable) return;
    expect(plan.skontoFristBis).toBe("2025-03-15");
  });
});
