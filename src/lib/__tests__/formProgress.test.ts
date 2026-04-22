import { describe, it, expect, beforeEach } from "vitest";
import {
  getFormProgress,
  collectTaxFormStorage,
  exportTaxFormBackup,
  importTaxFormBackup,
  clearAllTaxForms,
} from "../formProgress";

function clearLS() {
  if (typeof localStorage !== "undefined") localStorage.clear();
}

describe("formProgress", () => {
  beforeEach(() => {
    clearLS();
  });

  describe("getFormProgress", () => {
    it("reports no data for missing key", () => {
      const p = getFormProgress("harouda:anlage-nonexistent");
      expect(p.hasData).toBe(false);
      expect(p.rawSize).toBe(0);
      expect(p.filledFields).toBe(0);
    });

    it("reports no data for empty object", () => {
      localStorage.setItem("harouda:anlage-empty", "{}");
      const p = getFormProgress("harouda:anlage-empty");
      expect(p.hasData).toBe(false);
    });

    it("counts non-empty string fields", () => {
      localStorage.setItem(
        "harouda:anlage-test",
        JSON.stringify({ name: "Max", vorname: "" })
      );
      const p = getFormProgress("harouda:anlage-test");
      expect(p.hasData).toBe(true);
      expect(p.filledFields).toBe(1);
    });

    it("counts non-zero numbers", () => {
      localStorage.setItem(
        "harouda:anlage-test",
        JSON.stringify({ a: 100, b: 0, c: -50 })
      );
      const p = getFormProgress("harouda:anlage-test");
      expect(p.filledFields).toBe(2); // 100 + -50
    });

    it("counts true booleans, not false", () => {
      localStorage.setItem(
        "harouda:anlage-test",
        JSON.stringify({ a: true, b: false })
      );
      const p = getFormProgress("harouda:anlage-test");
      expect(p.filledFields).toBe(1);
    });

    it("recurses into nested objects and arrays", () => {
      localStorage.setItem(
        "harouda:anlage-test",
        JSON.stringify({
          nested: { x: "hello", y: 0 },
          arr: ["a", "", "b"],
        })
      );
      const p = getFormProgress("harouda:anlage-test");
      expect(p.filledFields).toBe(3); // "hello", "a", "b"
    });

    it("handles malformed JSON gracefully", () => {
      localStorage.setItem("harouda:anlage-test", "{bad json");
      const p = getFormProgress("harouda:anlage-test");
      // bad JSON → hasData stays false (0 filled fields → threshold fails)
      expect(p.hasData).toBe(false);
      expect(p.rawSize).toBeGreaterThan(0);
    });
  });

  describe("collectTaxFormStorage", () => {
    it("returns only harouda:anlage-* and harouda:est-* keys", () => {
      localStorage.setItem("harouda:anlage-n", JSON.stringify({ a: 1 }));
      localStorage.setItem("harouda:est-1a", JSON.stringify({ b: 2 }));
      localStorage.setItem("harouda:settings", JSON.stringify({ c: 3 }));
      localStorage.setItem("something-else", "ignored");
      const out = collectTaxFormStorage();
      expect(Object.keys(out).sort()).toEqual([
        "harouda:anlage-n",
        "harouda:est-1a",
      ]);
    });

    it("returns empty object when nothing present", () => {
      expect(collectTaxFormStorage()).toEqual({});
    });
  });

  describe("exportTaxFormBackup / importTaxFormBackup roundtrip", () => {
    it("exports with schema wrapper and re-imports cleanly", () => {
      localStorage.setItem("harouda:anlage-n", JSON.stringify({ name: "X" }));
      const json = exportTaxFormBackup();
      const parsed = JSON.parse(json);
      expect(parsed.meta.schema).toBe("harouda.taxforms.v1");
      expect(parsed.data["harouda:anlage-n"]).toEqual({ name: "X" });

      clearLS();
      expect(collectTaxFormStorage()).toEqual({});

      const result = importTaxFormBackup(json);
      expect(result.imported).toBe(1);
      expect(result.errors).toEqual([]);
      expect(JSON.parse(localStorage.getItem("harouda:anlage-n")!)).toEqual({
        name: "X",
      });
    });

    it("skips keys not matching tax-form prefix", () => {
      const payload = {
        data: {
          "harouda:anlage-x": { a: 1 },
          "unrelated-key": { b: 2 },
        },
      };
      const result = importTaxFormBackup(JSON.stringify(payload));
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("reports error on malformed JSON", () => {
      const result = importTaxFormBackup("{bad json");
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("reports error on non-object payload", () => {
      const result = importTaxFormBackup("42");
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("accepts top-level-data shape (no wrapper)", () => {
      const payload = { "harouda:anlage-n": { a: 1 } };
      const result = importTaxFormBackup(JSON.stringify(payload));
      expect(result.imported).toBe(1);
    });
  });

  describe("clearAllTaxForms", () => {
    it("removes only tax-form keys, leaves others intact", () => {
      localStorage.setItem("harouda:anlage-n", JSON.stringify({ a: 1 }));
      localStorage.setItem("harouda:est-1a", JSON.stringify({ b: 2 }));
      localStorage.setItem("harouda:settings", JSON.stringify({ c: 3 }));
      const result = clearAllTaxForms();
      expect(result.cleared).toBe(2);
      expect(localStorage.getItem("harouda:anlage-n")).toBeNull();
      expect(localStorage.getItem("harouda:est-1a")).toBeNull();
      expect(localStorage.getItem("harouda:settings")).not.toBeNull();
    });

    it("returns 0 when nothing to clear", () => {
      expect(clearAllTaxForms().cleared).toBe(0);
    });
  });
});
