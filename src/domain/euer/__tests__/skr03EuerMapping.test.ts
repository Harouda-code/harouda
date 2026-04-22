import { describe, it, expect } from "vitest";
import { SKR03_EUER_MAPPING, findEuerRule } from "../skr03EuerMapping";
import { EUER_BY_KZ } from "../euerStructure";

describe("skr03EuerMapping", () => {
  describe("findEuerRule", () => {
    it("maps 8400 → Kz 112 (Einnahme 19 %)", () => {
      const r = findEuerRule("8400");
      expect(r).toBeDefined();
      expect(r!.kz).toBe("112");
      expect(r!.source).toBe("EINNAHME");
    });

    it("maps 8300 → Kz 112 (Einnahme 7 %)", () => {
      expect(findEuerRule("8300")!.kz).toBe("112");
    });

    it("maps 3400 → Kz 100 (Wareneingang)", () => {
      expect(findEuerRule("3400")!.kz).toBe("100");
    });

    it("maps 4100 → Kz 120 (Löhne)", () => {
      expect(findEuerRule("4100")!.kz).toBe("120");
    });

    it("maps 4210 → Kz 130 (Miete)", () => {
      expect(findEuerRule("4210")!.kz).toBe("130");
    });

    it("maps 4650 → Kz 175 (Bewirtung) with 70/30 split", () => {
      const r = findEuerRule("4650");
      expect(r!.kz).toBe("175");
      expect(r!.splitPercent).toBe(70);
      expect(r!.overflowKz).toBe("228");
    });

    it("maps 4630 → Kz 170 (Geschenke ≤50€)", () => {
      expect(findEuerRule("4630")!.kz).toBe("170");
    });

    it("maps 4636 → Kz 228 (Geschenke >50€, nicht abzugsfähig)", () => {
      expect(findEuerRule("4636")!.kz).toBe("228");
    });

    it("maps 4800 → Kz 171 (AfA beweglich)", () => {
      expect(findEuerRule("4800")!.kz).toBe("171");
    });

    it("maps 4820 → Kz 172 (AfA unbeweglich)", () => {
      expect(findEuerRule("4820")!.kz).toBe("172");
    });

    it("maps 4830 → Kz 173 (AfA immateriell)", () => {
      expect(findEuerRule("4830")!.kz).toBe("173");
    });

    it("maps 4850 → Kz 174 (Sonder-AfA § 7g)", () => {
      expect(findEuerRule("4850")!.kz).toBe("174");
    });

    it("maps 1576 → Kz 185 (Vorsteuer)", () => {
      expect(findEuerRule("1576")!.kz).toBe("185");
    });

    it("maps 1789 → Kz 184 (USt-Zahllast)", () => {
      expect(findEuerRule("1789")!.kz).toBe("184");
    });

    it("returns undefined for 9999", () => {
      expect(findEuerRule("9999")).toBeUndefined();
    });

    it("returns undefined for non-numeric", () => {
      expect(findEuerRule("abc")).toBeUndefined();
    });
  });

  describe("Range integrity", () => {
    it("no overlapping ranges", () => {
      const sorted = [...SKR03_EUER_MAPPING].sort((a, b) => a.from - b.from);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (cur.from <= prev.to) {
          throw new Error(
            `Overlap: ${prev.from}-${prev.to} (${prev.tag}) vs ${cur.from}-${cur.to} (${cur.tag})`
          );
        }
      }
      expect(true).toBe(true);
    });

    it("every kz references a valid EUER_STRUCTURE_2025 entry", () => {
      for (const r of SKR03_EUER_MAPPING) {
        expect(EUER_BY_KZ.has(r.kz), `${r.tag} kz=${r.kz} missing`).toBe(true);
      }
    });

    it("overflowKz (where defined) also exists", () => {
      for (const r of SKR03_EUER_MAPPING) {
        if (r.overflowKz) {
          expect(EUER_BY_KZ.has(r.overflowKz)).toBe(true);
        }
      }
    });
  });
});
