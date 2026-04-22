import { describe, it, expect } from "vitest";
import {
  SKR03_GUV_MAPPING,
  findGuvRule,
} from "../skr03GuvMapping";
import { HGB_275_GKV_BY_REF } from "../hgb275GkvStructure";

describe("skr03GuvMapping", () => {
  describe("findGuvRule", () => {
    it("maps 8400 → Posten 1 (Umsatzerlöse)", () => {
      const r = findGuvRule("8400");
      expect(r).toBeDefined();
      expect(r!.guv_ref).toBe("1");
      expect(r!.tag).toBe("UMSATZERLOESE_19");
    });

    it("maps 4100 → Posten 6.a (Löhne)", () => {
      const r = findGuvRule("4100");
      expect(r).toBeDefined();
      expect(r!.guv_ref).toBe("6.a");
    });

    it("maps 4130 → Posten 6.b (Soziale Abgaben)", () => {
      expect(findGuvRule("4130")!.guv_ref).toBe("6.b");
    });

    it("maps 4190 → Posten 6.a (Aushilfslöhne)", () => {
      expect(findGuvRule("4190")!.guv_ref).toBe("6.a");
    });

    it("maps 7600 → Posten 14 (Körperschaftsteuer)", () => {
      expect(findGuvRule("7600")!.guv_ref).toBe("14");
      expect(findGuvRule("7600")!.tag).toBe("KOERPERSCHAFTSTEUER");
    });

    it("maps 7700 → Posten 16 (Sonstige Steuern)", () => {
      expect(findGuvRule("7700")!.guv_ref).toBe("16");
    });

    it("maps 4320 → Posten 16 (Grundsteuer — Sonstige Steuern)", () => {
      expect(findGuvRule("4320")!.guv_ref).toBe("16");
    });

    it("maps 4800 → Posten 7.a (Abschreibung Anlagevermögen)", () => {
      expect(findGuvRule("4800")!.guv_ref).toBe("7.a");
    });

    it("maps 4870 → Posten 7.b (AfA UV außergewöhnlich)", () => {
      expect(findGuvRule("4870")!.guv_ref).toBe("7.b");
    });

    it("maps 2310 → Posten 13 (Zinsaufwand; 2300 ist harouda-Grundkapital)", () => {
      // Post-Bugfix 2026-04-20 Bug B: 2300 ist im harouda-SKR03 als
      // Grundkapital (passiva) belegt. Die Zinsaufwand-Range beginnt
      // deshalb erst bei 2310 (siehe skr03GuvMapping.ts).
      expect(findGuvRule("2310")!.guv_ref).toBe("13");
      expect(findGuvRule("2300")).toBeUndefined();
    });

    it("maps 2650 → Posten 11 (Zinserträge) — narrower-first resolution", () => {
      expect(findGuvRule("2650")!.guv_ref).toBe("11");
    });

    it("maps 2660 → Posten 10 (Wertpapier-Erträge)", () => {
      expect(findGuvRule("2660")!.guv_ref).toBe("10");
    });

    it("returns undefined for 9999 (no mapping)", () => {
      expect(findGuvRule("9999")).toBeUndefined();
    });

    it("returns undefined for non-numeric input", () => {
      expect(findGuvRule("abc")).toBeUndefined();
    });
  });

  describe("Range integrity", () => {
    it("no overlapping ranges across all mapping entries", () => {
      const sorted = [...SKR03_GUV_MAPPING].sort((a, b) => a.from - b.from);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (cur.from <= prev.to) {
          throw new Error(
            `Overlap: ${prev.from}-${prev.to} (${prev.tag}) and ${cur.from}-${cur.to} (${cur.tag})`
          );
        }
      }
      expect(true).toBe(true);
    });

    it("every guv_ref references a valid HGB_275_GKV_STRUCTURE reference_code", () => {
      for (const rule of SKR03_GUV_MAPPING) {
        const def = HGB_275_GKV_BY_REF.get(rule.guv_ref);
        expect(def, `guv_ref ${rule.guv_ref} (${rule.tag}) missing in structure`).toBeDefined();
        // Only POST kinds should receive direct account mappings
        expect(def!.kind).toBe("POST");
      }
    });

    it("all ranges have from <= to and are positive", () => {
      for (const rule of SKR03_GUV_MAPPING) {
        expect(rule.from).toBeGreaterThan(0);
        expect(rule.to).toBeGreaterThanOrEqual(rule.from);
      }
    });

    it("all tags are non-empty strings", () => {
      for (const rule of SKR03_GUV_MAPPING) {
        expect(rule.tag.length).toBeGreaterThan(0);
      }
    });
  });
});
