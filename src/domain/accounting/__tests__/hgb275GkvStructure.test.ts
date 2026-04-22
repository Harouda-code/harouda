import { describe, it, expect } from "vitest";
import {
  HGB_275_GKV_STRUCTURE,
  HGB_275_GKV_BY_REF,
  guvVisibleForSizeClass,
} from "../hgb275GkvStructure";

describe("HGB § 275 GKV Structure", () => {
  it("has all 17 numbered Posten (1-17) plus 3 SUBTOTALs + 2 subpost families", () => {
    // 17 official posten + 3 subtotals (BETRIEBSERG, FINANZERG, VOR_STEUERN) + sub-posten (5.a, 5.b, 6.a, 6.b, 7.a, 7.b)
    const refs = HGB_275_GKV_STRUCTURE.map((l) => l.reference_code);
    // verify all 17 numbered posten
    for (const n of [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
    ]) {
      expect(refs).toContain(n);
    }
    expect(refs).toContain("BETRIEBSERG");
    expect(refs).toContain("FINANZERG");
    expect(refs).toContain("VOR_STEUERN");
    expect(refs).toContain("5.a");
    expect(refs).toContain("5.b");
    expect(refs).toContain("6.a");
    expect(refs).toContain("6.b");
    expect(refs).toContain("7.a");
    expect(refs).toContain("7.b");
  });

  it("every line has a non-empty HGB citation", () => {
    const missing = HGB_275_GKV_STRUCTURE.filter((l) => !l.hgb_paragraph);
    expect(missing).toEqual([]);
  });

  it("Posten 17 is kind=FINAL (Jahresergebnis)", () => {
    const p17 = HGB_275_GKV_BY_REF.get("17");
    expect(p17).toBeDefined();
    expect(p17!.kind).toBe("FINAL");
  });

  it("Posten 15 is kind=SUBTOTAL (Ergebnis nach Steuern, computed)", () => {
    const p15 = HGB_275_GKV_BY_REF.get("15");
    expect(p15).toBeDefined();
    expect(p15!.kind).toBe("SUBTOTAL");
  });

  it("all SUBTOTAL/FINAL lines have a formula annotation", () => {
    for (const def of HGB_275_GKV_STRUCTURE) {
      if (def.kind === "SUBTOTAL" || def.kind === "FINAL") {
        expect(def.formula, `${def.reference_code} missing formula`).toBeTruthy();
      }
    }
  });

  it("every parent reference exists in the structure", () => {
    const refs = new Set(HGB_275_GKV_STRUCTURE.map((l) => l.reference_code));
    for (const l of HGB_275_GKV_STRUCTURE) {
      if (l.parent) {
        expect(refs.has(l.parent), `${l.reference_code} parent ${l.parent} missing`).toBe(
          true
        );
      }
    }
  });

  it("no circular parent references", () => {
    for (const l of HGB_275_GKV_STRUCTURE) {
      const visited = new Set<string>();
      let cur = l;
      while (cur.parent) {
        if (visited.has(cur.parent)) {
          throw new Error(`cycle at ${l.reference_code}`);
        }
        visited.add(cur.parent);
        const next = HGB_275_GKV_BY_REF.get(cur.parent);
        if (!next) break;
        cur = next;
      }
    }
    expect(true).toBe(true);
  });

  it("reference_codes are unique", () => {
    const refs = HGB_275_GKV_STRUCTURE.map((l) => l.reference_code);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("Erträge have normal_side=HABEN, Aufwände have normal_side=SOLL", () => {
    const haben = ["1", "2", "3", "4", "9", "10", "11"];
    const soll = ["5", "5.a", "5.b", "6", "6.a", "6.b", "7", "7.a", "7.b", "8", "12", "13", "14", "16"];
    for (const ref of haben) {
      expect(HGB_275_GKV_BY_REF.get(ref)!.normal_side).toBe("HABEN");
    }
    for (const ref of soll) {
      expect(HGB_275_GKV_BY_REF.get(ref)!.normal_side).toBe("SOLL");
    }
  });

  it("guvVisibleForSizeClass: KLEIN hides sub-posten (size_class=MITTEL)", () => {
    const subA = HGB_275_GKV_BY_REF.get("5.a")!;
    expect(subA.size_class).toBe("MITTEL");
    expect(guvVisibleForSizeClass(subA, "KLEIN")).toBe(false);
    expect(guvVisibleForSizeClass(subA, "MITTEL")).toBe(true);
    expect(guvVisibleForSizeClass(subA, "GROSS")).toBe(true);

    const parent5 = HGB_275_GKV_BY_REF.get("5")!;
    expect(guvVisibleForSizeClass(parent5, "KLEIN")).toBe(true);
  });
});
