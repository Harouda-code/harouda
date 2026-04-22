import { describe, it, expect } from "vitest";
import {
  SKR03_MAPPING_RULES,
  SKR03_ERFOLG_RULES,
  findBalanceRule,
  findErfolgRule,
} from "../skr03Mapping";
import { SKR03_GUV_MAPPING } from "../skr03GuvMapping";

describe("SKR03 Mapping", () => {
  describe("findBalanceRule", () => {
    it("returns Bank rule with wechsel_ref=P.C.2 for Konto 1200", () => {
      const r = findBalanceRule("1200");
      expect(r).toBeDefined();
      expect(r!.tag).toBe("BANK");
      expect(r!.wechselkonto).toBe(true);
      expect(r!.wechsel_ref).toBe("P.C.2");
      expect(r!.reference_code).toBe("B.IV");
    });

    it("returns Kasse rule (non-Wechselkonto) for Konto 1000", () => {
      const r = findBalanceRule("1000");
      expect(r).toBeDefined();
      expect(r!.tag).toBe("KASSE");
      expect(r!.wechselkonto).toBe(false);
    });

    it("returns Gezeichnetes Kapital rule for Konto 0900", () => {
      const r = findBalanceRule("0900");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("P.A.I");
      expect(r!.tag).toBe("GEZEICHNETES_KAPITAL");
    });

    // Audit 2026-04-20 P1-02 Regression
    it("P1-02: Konto 0800 Beteiligungen an verbundenen Unternehmen → A.III.1", () => {
      const r = findBalanceRule("0800");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("A.III.1");
      expect(r!.tag).toBe("ANTEILE_VERBUNDENE");
    });

    // Post-Bugfix 2026-04-20 Bug A + B Regressions-Tests
    it("Bug A: Konto 0860 Gewinnvortrag → P.A.IV (nicht mehr A.III.1)", () => {
      const r = findBalanceRule("0860");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("P.A.IV");
      expect(r!.tag).toBe("GEWINN_VORTRAG_0860");
    });

    it("Bug A: Konto 0858 bleibt im Aktiva-Bereich A.III.1", () => {
      const r = findBalanceRule("0858");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("A.III.1");
    });

    it("Bug A: Konto 0875 bleibt im Aktiva-Bereich A.III.1", () => {
      const r = findBalanceRule("0875");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("A.III.1");
    });

    it("Bug B: Konto 2300 Grundkapital → P.A.I Bilanz (nicht GuV ZINSAUFWAND)", () => {
      const r = findBalanceRule("2300");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("P.A.I");
      expect(r!.tag).toBe("GEZEICHNETES_KAPITAL_2300");
    });

    it("Bug B: Konto 2310 bleibt ZINSAUFWAND im GuV", () => {
      const r = findErfolgRule("2310");
      expect(r).toBeDefined();
      expect(r!.kind).toBe("AUFWAND");
      expect(r!.tag).toBe("ZINSAUFWAND");
    });

    it("Bug B: Konto 2300 ist NICHT mehr in GuV ZINSAUFWAND", () => {
      // Haben-Saldo von 2300 darf nicht versehentlich in aufwandSum
      // landen. findErfolgRule(2300) soll jetzt undefined liefern.
      const r = findErfolgRule("2300");
      expect(r).toBeUndefined();
    });

    it("Bug C: Konto 1600 Verbindlichkeiten L+L → P.C.4 (nicht mehr B.II.4)", () => {
      const r = findBalanceRule("1600");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("P.C.4");
      expect(r!.tag).toBe("VERB_LuL_1600");
    });

    it("returns Forderungen LuL rule for Konto 1400", () => {
      const r = findBalanceRule("1400");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("B.II.1");
      expect(r!.tag).toBe("FORDERUNGEN_LuL");
    });

    it("returns undefined for out-of-range Konto 9999", () => {
      expect(findBalanceRule("9999")).toBeUndefined();
    });

    it("returns undefined for non-numeric Konto string", () => {
      expect(findBalanceRule("nicht-nummer")).toBeUndefined();
    });

    it("handles leading zero Konto numbers (SKR03 convention)", () => {
      // "0100" → 100 → first immaterielle-VG range
      const r = findBalanceRule("0100");
      expect(r).toBeDefined();
      expect(r!.tag).toBe("IMMATERIELLE_VG");
    });
  });

  describe("findErfolgRule", () => {
    it("returns Umsatzerlöse rule for Konto 8400 (from GuV-derived tag)", () => {
      const r = findErfolgRule("8400");
      expect(r).toBeDefined();
      expect(r!.kind).toBe("ERTRAG");
      expect(r!.tag).toBe("UMSATZERLOESE_19");
    });

    it("returns Löhne rule for Konto 4110 (Personal, GuV-derived)", () => {
      const r = findErfolgRule("4110");
      expect(r).toBeDefined();
      expect(r!.kind).toBe("AUFWAND");
      expect(r!.tag).toBe("LOEHNE");
    });

    it("returns Wareneingang rule for Konto 3400", () => {
      const r = findErfolgRule("3400");
      expect(r).toBeDefined();
      expect(r!.kind).toBe("AUFWAND");
      expect(r!.tag).toBe("WARENEINGANG");
    });

    // Audit 2026-04-20 P0-01 Regression-Tests
    it("P0-01: Konto 3120 (Bauleistung § 13b RC) → AUFWAND 5.b REVERSE_CHARGE", () => {
      const r = findErfolgRule("3120");
      expect(r).toBeDefined();
      expect(r!.kind).toBe("AUFWAND");
      expect(r!.tag).toBe("REVERSE_CHARGE");
    });

    it("P0-01: Konto 3425 (IG-Erwerb 19 %) → AUFWAND 5.a WARENEINGANG", () => {
      const r = findErfolgRule("3425");
      expect(r).toBeDefined();
      expect(r!.kind).toBe("AUFWAND");
      expect(r!.tag).toBe("WARENEINGANG");
    });

    it("P0-01: Bilanz-Rule für 3120 ist jetzt NICHT mehr in Aktiva (nur GuV)", () => {
      // Vor dem Fix war 3120 Teil von 3000-3199 B.I.1 Rohstoffe UND
      // nicht im GuV — Doppel-Fehler. Jetzt: nur GuV.
      expect(findBalanceRule("3120")).toBeUndefined();
    });

    it("P0-01: Bilanz-Range 3000-3099 bleibt erhalten als B.I.1 Rohstoffe", () => {
      const r = findBalanceRule("3000");
      expect(r).toBeDefined();
      expect(r!.reference_code).toBe("B.I.1");
      expect(r!.tag).toBe("ROHSTOFFE");
    });

    it("returns undefined for Bilanzkonto 1200 (not Erfolg)", () => {
      expect(findErfolgRule("1200")).toBeUndefined();
    });
  });

  describe("Erfolg/GuV mapping consistency (derived from SKR03_GUV_MAPPING)", () => {
    it("every GuV-mapped account has a matching Erfolg rule", () => {
      for (const rule of SKR03_GUV_MAPPING) {
        const sampleAccount = String(rule.from);
        const erfolg = findErfolgRule(sampleAccount);
        expect(
          erfolg,
          `Account ${sampleAccount} (${rule.tag}) missing in Erfolg rules`
        ).toBeDefined();
      }
    });

    it("Körperschaftsteuer 7600 classified as AUFWAND", () => {
      expect(findErfolgRule("7600")?.kind).toBe("AUFWAND");
    });

    it("Gewerbesteuer 7610 classified as AUFWAND", () => {
      expect(findErfolgRule("7610")?.kind).toBe("AUFWAND");
    });

    it("Beteiligungserträge 2600 classified as ERTRAG", () => {
      expect(findErfolgRule("2600")?.kind).toBe("ERTRAG");
    });

    it("Zinsaufwand 2310 classified as AUFWAND (2300 geschützt als Grundkapital, Post-Bugfix Bug B)", () => {
      // 2300 selbst ist in harouda-SKR03 Grundkapital (passiva); die
      // GuV-Range ZINSAUFWAND beginnt erst bei 2310 (Range-Anpassung
      // im skr03GuvMapping.ts). Test auf 2310 verschoben, damit die
      // Zinsaufwand-Kinderkanten-Invariante erhalten bleibt.
      expect(findErfolgRule("2310")?.kind).toBe("AUFWAND");
    });

    it("Sonstige Steuern 4320 (Grundsteuer) classified as AUFWAND", () => {
      expect(findErfolgRule("4320")?.kind).toBe("AUFWAND");
    });

    it("GuV ranges are disjoint from BalanceSheet ranges (no account is both)", () => {
      for (const guvRule of SKR03_GUV_MAPPING) {
        for (const bilRule of SKR03_MAPPING_RULES) {
          const overlaps = !(
            guvRule.to < bilRule.from || guvRule.from > bilRule.to
          );
          expect(
            overlaps,
            `Overlap: GuV ${guvRule.from}-${guvRule.to} (${guvRule.tag}) vs ` +
              `Bilanz ${bilRule.from}-${bilRule.to} (${bilRule.tag})`
          ).toBe(false);
        }
      }
    });
  });

  describe("Range integrity", () => {
    it("SKR03_MAPPING_RULES: no overlapping ranges", () => {
      const rules = [...SKR03_MAPPING_RULES].sort((a, b) => a.from - b.from);
      for (let i = 1; i < rules.length; i++) {
        const prev = rules[i - 1];
        const cur = rules[i];
        expect(cur.from).toBeGreaterThan(prev.to);
      }
    });

    it("SKR03_ERFOLG_RULES: no overlapping ranges", () => {
      const rules = [...SKR03_ERFOLG_RULES].sort((a, b) => a.from - b.from);
      for (let i = 1; i < rules.length; i++) {
        const prev = rules[i - 1];
        const cur = rules[i];
        expect(cur.from).toBeGreaterThan(prev.to);
      }
    });

    it("every balance rule references a valid reference_code pattern", () => {
      for (const r of SKR03_MAPPING_RULES) {
        // Format: either "A.I.1" (Aktiva) or "P.A.V" (Passiva prefix)
        expect(r.reference_code).toMatch(/^(P\.)?[A-E](\.[IVX]+)?(\.\d+)?$/);
      }
    });

    it("every rule has a non-empty tag", () => {
      for (const r of SKR03_MAPPING_RULES) {
        expect(r.tag.length).toBeGreaterThan(0);
      }
      for (const r of SKR03_ERFOLG_RULES) {
        expect(r.tag.length).toBeGreaterThan(0);
      }
    });

    it("wechselkonto rules have a wechsel_ref set", () => {
      for (const r of SKR03_MAPPING_RULES) {
        if (r.wechselkonto) {
          expect(r.wechsel_ref).toBeDefined();
          expect(r.wechsel_ref!.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
