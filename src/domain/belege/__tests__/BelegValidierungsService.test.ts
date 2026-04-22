import { describe, it, expect } from "vitest";
import { BelegValidierungsService } from "../BelegValidierungsService";
import { Money } from "../../../lib/money/Money";
import type { BelegEntry, BelegPosition } from "../types";

function makeBeleg(overrides: Partial<BelegEntry> = {}): BelegEntry {
  const defaults: BelegEntry = {
    belegart: "EINGANGSRECHNUNG",
    belegnummer: "RE-2025-001",
    belegdatum: "2025-03-15",
    buchungsdatum: "2025-03-15",
    beschreibung: "Beratung Projekt X",
    partner: { name: "Muster GmbH" },
    positionen: [
      { konto: "4100", side: "SOLL", betrag: new Money("1000") },
      { konto: "1200", side: "HABEN", betrag: new Money("1000") },
    ],
    netto: new Money("1000"),
    steuerbetrag: new Money("190"),
    brutto: new Money("1190"),
  };
  return { ...defaults, ...overrides };
}

describe("BelegValidierungsService", () => {
  const svc = new BelegValidierungsService();

  describe("Standardfall", () => {
    it("Valider Beleg: isValid=true, keine Errors", () => {
      const r = svc.validate(makeBeleg());
      expect(r.isValid).toBe(true);
      expect(r.errors).toEqual([]);
      expect(r.sollEqualsHaben).toBe(true);
    });
  });

  describe("Pflichtfelder (§ 14 Abs. 4 UStG)", () => {
    it("fehlende Belegnummer → E001", () => {
      const r = svc.validate(makeBeleg({ belegnummer: "" }));
      expect(r.isValid).toBe(false);
      expect(r.errors.find((e) => e.code === "E001")).toBeDefined();
    });

    it("fehlendes Belegdatum → E002", () => {
      const r = svc.validate(makeBeleg({ belegdatum: "" }));
      expect(r.errors.find((e) => e.code === "E002")).toBeDefined();
    });

    it("fehlende Beschreibung → E003", () => {
      const r = svc.validate(makeBeleg({ beschreibung: "" }));
      expect(r.errors.find((e) => e.code === "E003")).toBeDefined();
    });

    it("fehlender Partner-Name → E004", () => {
      const r = svc.validate(
        makeBeleg({ partner: { name: "" } })
      );
      expect(r.errors.find((e) => e.code === "E004")).toBeDefined();
    });

    it("Kassenbeleg < 250 € erlaubt Partner-Name leer (Kleinbetrag)", () => {
      const r = svc.validate(
        makeBeleg({
          belegart: "KASSENBELEG",
          partner: { name: "" },
          netto: new Money("100"),
          steuerbetrag: new Money("19"),
          brutto: new Money("119"),
          positionen: [
            { konto: "4900", side: "SOLL", betrag: new Money("119") },
            { konto: "1000", side: "HABEN", betrag: new Money("119") },
          ],
        })
      );
      expect(r.errors.find((e) => e.code === "E004")).toBeUndefined();
    });

    it("leere Positionen → E005", () => {
      const r = svc.validate(makeBeleg({ positionen: [] }));
      expect(r.errors.find((e) => e.code === "E005")).toBeDefined();
    });
  });

  describe("IG-Lieferung (§ 14a UStG)", () => {
    it("IG-Lieferung ohne USt-IdNr → E010", () => {
      const r = svc.validate(
        makeBeleg({
          istIgLieferung: true,
          partner: { name: "Euro Customer SA" },
          steuerbetrag: new Money("0"),
          brutto: new Money("1000"),
        })
      );
      expect(r.errors.find((e) => e.code === "E010")).toBeDefined();
    });

    it("IG-Lieferung mit gültiger USt-IdNr → kein E010", () => {
      const r = svc.validate(
        makeBeleg({
          istIgLieferung: true,
          partner: { name: "Euro SA", ustId: "FR12345678901" },
          steuerbetrag: new Money("0"),
          brutto: new Money("1000"),
        })
      );
      expect(r.errors.find((e) => e.code === "E010")).toBeUndefined();
    });

    it("IG-Lieferung mit ungültiger USt-IdNr → E011", () => {
      const r = svc.validate(
        makeBeleg({
          istIgLieferung: true,
          partner: { name: "X", ustId: "BOGUS123" },
          steuerbetrag: new Money("0"),
          brutto: new Money("1000"),
        })
      );
      expect(r.errors.find((e) => e.code === "E011")).toBeDefined();
    });

    it("IG-Lieferung mit positiver USt → Warning W104", () => {
      const r = svc.validate(
        makeBeleg({
          istIgLieferung: true,
          partner: { name: "X", ustId: "FR12345678901" },
          steuerbetrag: new Money("190"),
        })
      );
      expect(r.warnings.find((w) => w.code === "W104")).toBeDefined();
    });
  });

  describe("Reverse Charge (§ 13b UStG)", () => {
    it("Reverse Charge mit ausgewiesener USt → E020", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("190"),
        })
      );
      expect(r.errors.find((e) => e.code === "E020")).toBeDefined();
    });

    it("Reverse Charge ohne USt → kein E020", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("0"),
          brutto: new Money("1000"),
        })
      );
      expect(r.errors.find((e) => e.code === "E020")).toBeUndefined();
    });
  });

  describe("Brutto = Netto + USt", () => {
    it("Rechenfehler Brutto → E030", () => {
      const r = svc.validate(
        makeBeleg({
          netto: new Money("1000"),
          steuerbetrag: new Money("190"),
          brutto: new Money("1200"), // sollte 1190 sein
        })
      );
      expect(r.errors.find((e) => e.code === "E030")).toBeDefined();
      expect(r.bruttoMatchesNettoPlusUst).toBe(false);
    });

    it("Exakte Rechnung → bruttoMatches=true", () => {
      const r = svc.validate(makeBeleg());
      expect(r.bruttoMatchesNettoPlusUst).toBe(true);
    });
  });

  describe("Soll = Haben Balance", () => {
    it("unbalancierte Positionen → E040", () => {
      const r = svc.validate(
        makeBeleg({
          positionen: [
            { konto: "4100", side: "SOLL", betrag: new Money("1000") },
            { konto: "1200", side: "HABEN", betrag: new Money("999") },
          ],
        })
      );
      expect(r.errors.find((e) => e.code === "E040")).toBeDefined();
      expect(r.sollEqualsHaben).toBe(false);
      expect(r.differenz.toFixed2()).toBe("1.00");
    });

    it("balanced → sollEqualsHaben=true", () => {
      const r = svc.validate(makeBeleg());
      expect(r.sollEqualsHaben).toBe(true);
    });

    it("Zero-Sum (alle 0) → E041", () => {
      const r = svc.validate(
        makeBeleg({
          positionen: [
            { konto: "4100", side: "SOLL", betrag: new Money("0") },
            { konto: "1200", side: "HABEN", betrag: new Money("0") },
          ],
        })
      );
      expect(r.errors.find((e) => e.code === "E041")).toBeDefined();
    });

    it("Money-Präzision: 100 × 0.01 SOLL vs 1.00 HABEN balanciert", () => {
      const positionen: BelegPosition[] = [];
      for (let i = 0; i < 100; i++) {
        positionen.push({
          konto: "4100",
          side: "SOLL",
          betrag: new Money("0.01"),
        });
      }
      positionen.push({
        konto: "1200",
        side: "HABEN",
        betrag: new Money("1.00"),
      });
      const r = svc.validate(makeBeleg({ positionen }));
      expect(r.sollEqualsHaben).toBe(true);
    });
  });

  describe("Plausibilitäts-Warnings", () => {
    it("Leistungsdatum > Belegdatum → W101", () => {
      const r = svc.validate(
        makeBeleg({
          belegdatum: "2025-03-15",
          leistungsdatum: "2025-03-20",
        })
      );
      expect(r.warnings.find((w) => w.code === "W101")).toBeDefined();
    });

    it("Skonto 8 % → W102", () => {
      const r = svc.validate(
        makeBeleg({ zahlung: { art: "UEBERWEISUNG", skonto_prozent: 8 } })
      );
      expect(r.warnings.find((w) => w.code === "W102")).toBeDefined();
    });

    it("Brutto > 100k → W103", () => {
      const r = svc.validate(
        makeBeleg({
          netto: new Money("100000"),
          steuerbetrag: new Money("19000"),
          brutto: new Money("119000"),
          positionen: [
            { konto: "4100", side: "SOLL", betrag: new Money("119000") },
            { konto: "1200", side: "HABEN", betrag: new Money("119000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W103")).toBeDefined();
    });

    it("Normale Beträge → keine Plausibilitäts-Warnings", () => {
      const r = svc.validate(makeBeleg());
      expect(r.warnings.filter((w) => w.code.startsWith("W10"))).toEqual([]);
    });
  });

  describe("Sprint 7: Reverse-Charge + IG Kontenwahl-Warnings", () => {
    // W105: Reverse Charge ohne Aufwandskonto im Range 3100-3159.
    it("W105: istReverseCharge + Konto 3400 (nicht in 3100-3159) → Warning", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("0"),
          brutto: new Money("1000"),
          netto: new Money("1000"),
          positionen: [
            { konto: "3400", side: "SOLL", betrag: new Money("1000") },
            { konto: "1600", side: "HABEN", betrag: new Money("1000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W105")).toBeDefined();
    });

    it("W105: istReverseCharge + Konto 3100 (in Range) → keine W105", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("0"),
          brutto: new Money("1000"),
          netto: new Money("1000"),
          beschreibung: "EU-Dienstleistung",
          positionen: [
            { konto: "3100", side: "SOLL", betrag: new Money("1000") },
            { konto: "1600", side: "HABEN", betrag: new Money("1000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W105")).toBeUndefined();
    });

    // W106: Bauleistungs-Konto 3120-3129, Beschreibung ohne „Bau".
    it("W106: RC + Konto 3120 + Beschreibung ohne Bau → Warning", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("0"),
          brutto: new Money("8000"),
          netto: new Money("8000"),
          beschreibung: "Sonstige Fremdleistung",
          positionen: [
            { konto: "3120", side: "SOLL", betrag: new Money("8000") },
            { konto: "1600", side: "HABEN", betrag: new Money("8000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W106")).toBeDefined();
    });

    it("W106: RC + Konto 3120 + Beschreibung Bauleistung → keine W106", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("0"),
          brutto: new Money("8000"),
          netto: new Money("8000"),
          beschreibung: "Bauleistung Rohbau (§ 13b Abs. 2 Nr. 2 UStG)",
          positionen: [
            { konto: "3120", side: "SOLL", betrag: new Money("8000") },
            { konto: "1600", side: "HABEN", betrag: new Money("8000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W106")).toBeUndefined();
    });

    // W107: Gebäudereinigungs-Konto 3130-3139, Beschreibung ohne „Reinigung"/„Gebäude".
    it("W107: RC + Konto 3130 + Beschreibung ohne Reinigung → Warning", () => {
      const r = svc.validate(
        makeBeleg({
          istReverseCharge: true,
          steuerbetrag: new Money("0"),
          brutto: new Money("1200"),
          netto: new Money("1200"),
          beschreibung: "Dienstleistung",
          positionen: [
            { konto: "3130", side: "SOLL", betrag: new Money("1200") },
            { konto: "1600", side: "HABEN", betrag: new Money("1200") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W107")).toBeDefined();
    });

    // W108: IG-Lieferung ohne Erlöskonto im Range 8120-8199.
    it("W108: istIgLieferung + Konto 8400 (Inland) statt 8125 → Warning", () => {
      const r = svc.validate(
        makeBeleg({
          belegart: "AUSGANGSRECHNUNG",
          istIgLieferung: true,
          partner: { name: "EU-Kunde SARL", ustId: "FR12345678901" },
          steuerbetrag: new Money("0"),
          brutto: new Money("15000"),
          netto: new Money("15000"),
          positionen: [
            { konto: "1400", side: "SOLL", betrag: new Money("15000") },
            { konto: "8400", side: "HABEN", betrag: new Money("15000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W108")).toBeDefined();
    });

    it("W108: istIgLieferung + Konto 8125 (Range-Hit) → keine W108", () => {
      const r = svc.validate(
        makeBeleg({
          belegart: "AUSGANGSRECHNUNG",
          istIgLieferung: true,
          partner: { name: "EU-Kunde SARL", ustId: "FR12345678901" },
          steuerbetrag: new Money("0"),
          brutto: new Money("15000"),
          netto: new Money("15000"),
          positionen: [
            { konto: "1400", side: "SOLL", betrag: new Money("15000") },
            { konto: "8125", side: "HABEN", betrag: new Money("15000") },
          ],
        })
      );
      expect(r.warnings.find((w) => w.code === "W108")).toBeUndefined();
    });
  });

  describe("Summary-Felder", () => {
    it("differenz = soll − haben", () => {
      const r = svc.validate(
        makeBeleg({
          positionen: [
            { konto: "4100", side: "SOLL", betrag: new Money("500") },
            { konto: "1200", side: "HABEN", betrag: new Money("300") },
          ],
        })
      );
      expect(r.soll.toFixed2()).toBe("500.00");
      expect(r.haben.toFixed2()).toBe("300.00");
      expect(r.differenz.toFixed2()).toBe("200.00");
    });
  });
});
