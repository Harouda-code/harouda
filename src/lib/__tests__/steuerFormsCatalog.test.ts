import { describe, it, expect } from "vitest";
import {
  FORM_CATEGORIES,
  FORM_PATH_TO_CATEGORY,
  FORM_SECONDARY_CATEGORIES,
  categoryForPath,
  secondaryCategoriesForPath,
} from "../steuerFormsCatalog";

describe("steuerFormsCatalog", () => {
  describe("FORM_CATEGORIES", () => {
    it("has all 8 categories with unique ids and strictly increasing order", () => {
      const ids = Object.keys(FORM_CATEGORIES);
      expect(ids.length).toBe(8);
      const orders = Object.values(FORM_CATEGORIES).map((c) => c.order);
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
    });

    it("every category has required fields", () => {
      for (const c of Object.values(FORM_CATEGORIES)) {
        expect(c.id).toBeTruthy();
        expect(c.label.length).toBeGreaterThan(0);
        expect(c.description.length).toBeGreaterThan(0);
        expect(c.order).toBeGreaterThan(0);
        expect(c.icon).toBeDefined();
      }
    });
  });

  describe("categoryForPath", () => {
    it("maps /steuer/anlage-n to einkuenfte", () => {
      expect(categoryForPath("/steuer/anlage-n")).toBe("einkuenfte");
    });

    it("maps /steuer/est-1a to hauptvordrucke", () => {
      expect(categoryForPath("/steuer/est-1a")).toBe("hauptvordrucke");
    });

    it("maps /steuer/anlage-aus to auslandsbezug", () => {
      expect(categoryForPath("/steuer/anlage-aus")).toBe("auslandsbezug");
    });

    it("maps /steuer/anlage-em to immobilien", () => {
      expect(categoryForPath("/steuer/anlage-em")).toBe("immobilien");
    });

    it("maps /steuer/ustva to sonstige", () => {
      expect(categoryForPath("/steuer/ustva")).toBe("sonstige");
    });

    it("falls back to sonstige for unknown path", () => {
      expect(categoryForPath("/steuer/anlage-unknown")).toBe("sonstige");
      expect(categoryForPath("/steuer/random")).toBe("sonstige");
    });

    it("handles path with or without leading /steuer/", () => {
      expect(categoryForPath("anlage-n")).toBe("einkuenfte");
      expect(categoryForPath("/anlage-n")).toBe("einkuenfte");
      expect(categoryForPath("/steuer/anlage-n")).toBe("einkuenfte");
    });
  });

  describe("secondaryCategoriesForPath", () => {
    it("returns cross-listings for anlage-n-aus", () => {
      const secondary = secondaryCategoriesForPath("/steuer/anlage-n-aus");
      expect(secondary).toContain("einkuenfte");
    });

    it("returns empty for forms without secondary categories", () => {
      expect(secondaryCategoriesForPath("/steuer/est-1a")).toEqual([]);
    });

    it("returns cross-listings for anlage-u (primary=abzuege, secondary=familie)", () => {
      const primary = categoryForPath("/steuer/anlage-u");
      const secondary = secondaryCategoriesForPath("/steuer/anlage-u");
      expect(primary).toBe("abzuege");
      expect(secondary).toContain("familie");
    });
  });

  describe("FORM_PATH_TO_CATEGORY coverage", () => {
    it("every mapped path resolves to a valid FORM_CATEGORIES key", () => {
      const validIds = new Set(Object.keys(FORM_CATEGORIES));
      for (const [path, cat] of Object.entries(FORM_PATH_TO_CATEGORY)) {
        expect(validIds.has(cat)).toBe(true);
        expect(path.length).toBeGreaterThan(0);
      }
    });

    it("every secondary category is a valid FORM_CATEGORIES key", () => {
      const validIds = new Set(Object.keys(FORM_CATEGORIES));
      for (const cats of Object.values(FORM_SECONDARY_CATEGORIES)) {
        for (const c of cats) {
          expect(validIds.has(c)).toBe(true);
        }
      }
    });
  });
});
