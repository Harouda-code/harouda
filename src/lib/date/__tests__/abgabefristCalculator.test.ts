import { describe, it, expect } from "vitest";
import {
  calculateUstvaAbgabefrist,
  formatGermanDate,
  formatIso,
  periodEnd,
  periodStart,
  periodeLabel,
  daysUntil,
} from "../abgabefristCalculator";

describe("abgabefristCalculator", () => {
  describe("periodStart / periodEnd (MONAT)", () => {
    it("Oktober 2025 → 01.10.2025 bis 31.10.2025", () => {
      const p = { jahr: 2025, art: "MONAT" as const, monat: 10 };
      expect(periodStart(p)).toBe("2025-10-01");
      expect(periodEnd(p)).toBe("2025-10-31");
    });

    it("Februar 2024 (Schaltjahr) → 01.02.2024 bis 29.02.2024", () => {
      const p = { jahr: 2024, art: "MONAT" as const, monat: 2 };
      expect(periodEnd(p)).toBe("2024-02-29");
    });

    it("Februar 2025 (kein Schaltjahr) → 28.02.2025", () => {
      const p = { jahr: 2025, art: "MONAT" as const, monat: 2 };
      expect(periodEnd(p)).toBe("2025-02-28");
    });

    it("Dezember 2025 → 31.12.2025", () => {
      const p = { jahr: 2025, art: "MONAT" as const, monat: 12 };
      expect(periodEnd(p)).toBe("2025-12-31");
    });

    it("ungültiger Monat wirft", () => {
      expect(() =>
        periodEnd({ jahr: 2025, art: "MONAT", monat: 0 })
      ).toThrow();
      expect(() =>
        periodEnd({ jahr: 2025, art: "MONAT", monat: 13 })
      ).toThrow();
    });
  });

  describe("periodStart / periodEnd (QUARTAL)", () => {
    it("Q1 2025 → 01.01.2025 bis 31.03.2025", () => {
      const p = { jahr: 2025, art: "QUARTAL" as const, quartal: 1 as 1 };
      expect(periodStart(p)).toBe("2025-01-01");
      expect(periodEnd(p)).toBe("2025-03-31");
    });

    it("Q3 2025 → 01.07.2025 bis 30.09.2025", () => {
      const p = { jahr: 2025, art: "QUARTAL" as const, quartal: 3 as 3 };
      expect(periodStart(p)).toBe("2025-07-01");
      expect(periodEnd(p)).toBe("2025-09-30");
    });

    it("Q4 2025 → 01.10.2025 bis 31.12.2025", () => {
      const p = { jahr: 2025, art: "QUARTAL" as const, quartal: 4 as 4 };
      expect(periodStart(p)).toBe("2025-10-01");
      expect(periodEnd(p)).toBe("2025-12-31");
    });
  });

  describe("calculateUstvaAbgabefrist", () => {
    it("Oktober 2025 ohne Dauerfrist → 10.11.2025 (Montag)", () => {
      const d = calculateUstvaAbgabefrist(
        { jahr: 2025, art: "MONAT", monat: 10 },
        false
      );
      expect(formatGermanDate(d)).toBe("10.11.2025");
      expect(d.getDay()).toBe(1); // Montag
    });

    it("Oktober 2025 MIT Dauerfrist → 10.12.2025 (Mittwoch)", () => {
      const d = calculateUstvaAbgabefrist(
        { jahr: 2025, art: "MONAT", monat: 10 },
        true
      );
      expect(formatGermanDate(d)).toBe("10.12.2025");
    });

    it("Januar 2025 → 10.02.2025 (Montag)", () => {
      const d = calculateUstvaAbgabefrist(
        { jahr: 2025, art: "MONAT", monat: 1 },
        false
      );
      expect(formatGermanDate(d)).toBe("10.02.2025");
    });

    it("Abgabefrist fällt auf Samstag → Montag (November 2024: 10.11.24 = So)", () => {
      // November 2024 Voranmeldung: fällig 10.12.2024 (Dienstag) → nicht betroffen.
      // Januar 2025 → 10.02.2025 Montag.
      // Suche einen Fall mit Wochenende: März 2025 → 10.04.25 Donnerstag.
      // Mai 2025 → 10.06.25 Dienstag. September 2025 → 10.10.25 Freitag.
      // Juli 2025 → 10.08.25 Sonntag → sollte auf Montag 11.08.2025 verschieben.
      const d = calculateUstvaAbgabefrist(
        { jahr: 2025, art: "MONAT", monat: 7 },
        false
      );
      expect(formatGermanDate(d)).toBe("11.08.2025");
      expect(d.getDay()).toBe(1); // Montag
    });

    it("Abgabefrist Samstag rollt auf Montag (Mai 2024 → 10.06.24=Mo, ok; Feb 2024 → 10.03.24=So)", () => {
      // Februar 2024 → Fälligkeit 10.03.2024 → Sonntag → Montag 11.03.2024
      const d = calculateUstvaAbgabefrist(
        { jahr: 2024, art: "MONAT", monat: 2 },
        false
      );
      expect(formatGermanDate(d)).toBe("11.03.2024");
    });

    it("Q3 2025 (Juli-Sep) → 10.10.2025 (Freitag)", () => {
      const d = calculateUstvaAbgabefrist(
        { jahr: 2025, art: "QUARTAL", quartal: 3 },
        false
      );
      expect(formatGermanDate(d)).toBe("10.10.2025");
    });

    it("Q3 2025 MIT Dauerfrist → 10.11.2025 (Montag)", () => {
      const d = calculateUstvaAbgabefrist(
        { jahr: 2025, art: "QUARTAL", quartal: 3 },
        true
      );
      expect(formatGermanDate(d)).toBe("10.11.2025");
    });
  });

  describe("formatGermanDate / formatIso", () => {
    it("German format DD.MM.YYYY", () => {
      expect(formatGermanDate(new Date(2025, 10, 10))).toBe("10.11.2025");
    });
    it("ISO format YYYY-MM-DD", () => {
      expect(formatIso(new Date(2025, 10, 10))).toBe("2025-11-10");
    });
  });

  describe("periodeLabel", () => {
    it("MONAT → 'Oktober 2025'", () => {
      expect(periodeLabel({ jahr: 2025, art: "MONAT", monat: 10 })).toBe(
        "Oktober 2025"
      );
    });
    it("QUARTAL → 'Q3 2025'", () => {
      expect(
        periodeLabel({ jahr: 2025, art: "QUARTAL", quartal: 3 })
      ).toBe("Q3 2025");
    });
  });

  describe("daysUntil", () => {
    it("computes positive days for future date", () => {
      const future = new Date(2100, 0, 1);
      const now = new Date(2099, 11, 25);
      // 7 Tage zwischen Dez 25 und Jan 1
      expect(daysUntil(future, now)).toBe(7);
    });
    it("returns 0 for same day", () => {
      const d = new Date(2025, 5, 15);
      expect(daysUntil(d, d)).toBe(0);
    });
    it("returns negative for past", () => {
      const past = new Date(2025, 0, 1);
      const now = new Date(2025, 0, 5);
      expect(daysUntil(past, now)).toBe(-4);
    });
  });
});
