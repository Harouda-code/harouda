import { describe, it, expect } from "vitest";
import { calculateVorsorgepauschale } from "../vorsorgepauschaleCalculator";
import { Money } from "../../../lib/money/Money";
import type { Arbeitnehmer, Bundesland, Steuerklasse } from "../types";

function makeAn(overrides: Partial<Arbeitnehmer> = {}): Arbeitnehmer {
  return {
    id: "an",
    mandant_id: "m",
    personalNr: "001",
    name: "T",
    vorname: "T",
    geburtsdatum: "1990-01-01",
    sv_nummer: "12345678901A",
    steuer_id: "12345678901",
    steuerklasse: 1 as Steuerklasse,
    kinderfreibetraege: 0,
    kirchensteuerpflichtig: false,
    konfession: "NONE",
    bundesland: "NW" as Bundesland,
    kv_pflicht: true,
    kv_beitragsart: "GESETZLICH",
    kv_zusatzbeitrag: "2.5",
    rv_pflicht: true,
    av_pflicht: true,
    pv_pflicht: true,
    pv_kinderlos_zuschlag: false,
    pv_anzahl_kinder: 0,
    beschaeftigungsart: "VOLLZEIT",
    betriebsnummer: "12345678",
    eintrittsdatum: "2020-01-01",
    ...overrides,
  };
}

describe("vorsorgepauschaleCalculator (§ 39b Abs. 4 EStG)", () => {
  describe("Teil a — Rentenversicherung", () => {
    it("GKV-AN Brutto 36000 → Teil a = 3348 € (9,3 % auf 36000)", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("36000"));
      expect(r.teilA.toFixed2()).toBe("3348.00");
    });

    it("BBG RV/AV 96.600 → Teil a gedeckelt", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("150000"));
      // 96600 × 9,3 % = 8983,80
      expect(r.teilA.toFixed2()).toBe("8983.80");
    });

    it("Nicht RV-pflichtig → Teil a = 0", () => {
      const r = calculateVorsorgepauschale(
        makeAn({ rv_pflicht: false }),
        new Money("40000")
      );
      expect(r.teilA.toFixed2()).toBe("0.00");
    });
  });

  describe("Teil b — GKV + PV", () => {
    it("Gesetzliche KV Brutto 36000 → Teil b konkret berechnet", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("36000"));
      // KV-AN = (14,6 + 1,0 Mindest-Zusatz) / 2 = 7,8 % → 36000 × 7,8 % = 2808
      // PV = 3,6 / 2 = 1,8 % → 36000 × 1,8 % = 648
      // Teil b = 2808 + 648 = 3456
      expect(r.teilB.toFixed2()).toBe("3456.00");
    });

    it("BBG KV/PV 66.150 → Teil b gedeckelt", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("150000"));
      // 66150 × 7,8 % = 5159,70
      // 66150 × 1,8 % = 1190,70
      // Teil b = 6350,40
      expect(r.teilB.toFixed2()).toBe("6350.40");
    });

    it("PV Kinderlos-Zuschlag +0,6 % erhöht Teil b", () => {
      const rOhne = calculateVorsorgepauschale(
        makeAn({ pv_kinderlos_zuschlag: false }),
        new Money("36000")
      );
      const rMit = calculateVorsorgepauschale(
        makeAn({ pv_kinderlos_zuschlag: true }),
        new Money("36000")
      );
      // Differenz: 36000 × 0,6 % = 216
      expect(rMit.teilB.minus(rOhne.teilB).toFixed2()).toBe("216.00");
    });

    it("PKV → Teil b = 0 (stattdessen Teil c)", () => {
      const r = calculateVorsorgepauschale(
        makeAn({ kv_beitragsart: "PRIVAT" }),
        new Money("60000")
      );
      expect(r.teilB.toFixed2()).toBe("0.00");
    });
  });

  describe("Teil c — Mindestpauschale bei PKV", () => {
    it("PKV StKl I → 1.900 € Mindestpauschale", () => {
      const r = calculateVorsorgepauschale(
        makeAn({ kv_beitragsart: "PRIVAT" }),
        new Money("60000")
      );
      expect(r.teilC.toFixed2()).toBe("1900.00");
    });

    it("PKV StKl III → 3.000 € Mindestpauschale (Zusammenveranlagung)", () => {
      const r = calculateVorsorgepauschale(
        makeAn({ kv_beitragsart: "PRIVAT", steuerklasse: 3 }),
        new Money("60000")
      );
      expect(r.teilC.toFixed2()).toBe("3000.00");
    });

    it("GKV → Teil c = 0", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("40000"));
      expect(r.teilC.toFixed2()).toBe("0.00");
    });
  });

  describe("Gesamt + Erklärung", () => {
    it("GKV Brutto 36000: gesamt = Teil a + b = 6804", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("36000"));
      expect(r.gesamt.toFixed2()).toBe("6804.00");
      expect(r.erklaerung.a).toContain("RV-AN-Anteil");
      expect(r.erklaerung.b).toContain("KV-AN-Anteil");
      expect(r.erklaerung.c).toMatch(/(Entfällt|Mindestpauschale)/);
    });

    it("PKV Brutto 60000 StKl I: gesamt = Teil a + c = 5580 + 1900 = 7480", () => {
      const r = calculateVorsorgepauschale(
        makeAn({ kv_beitragsart: "PRIVAT" }),
        new Money("60000")
      );
      expect(r.teilA.toFixed2()).toBe("5580.00");
      expect(r.teilC.toFixed2()).toBe("1900.00");
      expect(r.gesamt.toFixed2()).toBe("7480.00");
    });

    it("Money-Präzision: exakte Kommawerte", () => {
      const r = calculateVorsorgepauschale(makeAn(), new Money("50000"));
      // Teil a: 50000 × 9,3 % = 4650
      // Teil b: 50000 × 7,8 % + 50000 × 1,8 % = 3900 + 900 = 4800
      // Gesamt: 9450
      expect(r.teilA.toFixed2()).toBe("4650.00");
      expect(r.teilB.toFixed2()).toBe("4800.00");
      expect(r.gesamt.toFixed2()).toBe("9450.00");
    });
  });
});
