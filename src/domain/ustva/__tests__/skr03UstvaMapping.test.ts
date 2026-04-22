import { describe, it, expect } from "vitest";
import {
  SKR03_USTVA_MAPPING,
  findUstvaRule,
} from "../skr03UstvaMapping";
import { USTVA_BY_KZ } from "../ustvaStructure";

describe("skr03UstvaMapping", () => {
  describe("findUstvaRule", () => {
    it("maps 8400 → Kz 81 (Umsatz 19 %)", () => {
      const r = findUstvaRule("8400");
      expect(r).toBeDefined();
      expect(r!.kz).toBe("81");
      expect(r!.source).toBe("UMSATZ");
    });

    it("maps 8300 → Kz 86 (Umsatz 7 %)", () => {
      expect(findUstvaRule("8300")!.kz).toBe("86");
    });

    it("maps 1576 → Kz 66 (Vorsteuer 19 %)", () => {
      const r = findUstvaRule("1576");
      expect(r!.kz).toBe("66");
      expect(r!.source).toBe("VORSTEUER");
    });

    it("maps 1571 → Kz 66 (Vorsteuer 7 %)", () => {
      expect(findUstvaRule("1571")!.kz).toBe("66");
    });

    it("maps 1588 → Kz 62 (EUSt)", () => {
      expect(findUstvaRule("1588")!.kz).toBe("62");
    });

    it("maps 1574 → Kz 61 (Vorsteuer IG Erwerb)", () => {
      expect(findUstvaRule("1574")!.kz).toBe("61");
    });

    it("maps 1577 → Kz 67 (Vorsteuer § 13b)", () => {
      expect(findUstvaRule("1577")!.kz).toBe("67");
    });

    it("maps 3425 → Kz 89 (IG Erwerb 19 %)", () => {
      const r = findUstvaRule("3425");
      expect(r!.kz).toBe("89");
      expect(r!.source).toBe("AUFWAND");
    });

    it("maps 3420 → Kz 93 (IG Erwerb 7 %)", () => {
      expect(findUstvaRule("3420")!.kz).toBe("93");
    });

    it("maps 3120 → Kz 73 (§13b Bauleistung)", () => {
      expect(findUstvaRule("3120")!.kz).toBe("73");
    });

    it("maps 8125 → Kz 41 (IG Lieferung)", () => {
      expect(findUstvaRule("8125")!.kz).toBe("41");
    });

    it("returns undefined for 9999 (unmapped)", () => {
      expect(findUstvaRule("9999")).toBeUndefined();
    });

    it("returns undefined for non-numeric", () => {
      expect(findUstvaRule("abc")).toBeUndefined();
    });
  });

  describe("Range integrity", () => {
    it("no overlapping ranges", () => {
      const sorted = [...SKR03_USTVA_MAPPING].sort((a, b) => a.from - b.from);
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

    it("every kz references a valid USTVA_STRUCTURE_2025 entry", () => {
      for (const r of SKR03_USTVA_MAPPING) {
        expect(
          USTVA_BY_KZ.has(r.kz),
          `rule ${r.tag} kz=${r.kz} missing in structure`
        ).toBe(true);
      }
    });

    it("all tags non-empty, from<=to", () => {
      for (const r of SKR03_USTVA_MAPPING) {
        expect(r.tag.length).toBeGreaterThan(0);
        expect(r.to).toBeGreaterThanOrEqual(r.from);
      }
    });
  });
});
