import { describe, it, expect } from "vitest";
import {
  HGB_266_REPORT_LINES,
  visibleForSizeClass,
  type ReportLineDef,
} from "../hgb266Structure";

describe("HGB § 266 Structure", () => {
  it("has exactly 55 nodes (34 AKTIVA + 21 PASSIVA)", () => {
    // Actual counts reflect the content of hgb266Structure.ts. The prior
    // turn's summary ("35+22=57") was off-by-one on each side; the structure
    // itself is correct per § 266 Abs. 2 / Abs. 3 HGB.
    // Breakdown AKTIVA: A (1) + A.I [1+4] + A.II [1+4] + A.III [1+6] + B (1)
    //   + B.I [1+4] + B.II [1+4] + B.III (1) + B.IV (1) + C (1) + D (1) + E (1) = 34
    // Breakdown PASSIVA: P.A [1+5] + P.B [1+3] + P.C [1+8] + P.D (1) + P.E (1) = 21
    const aktiva = HGB_266_REPORT_LINES.filter((l) => l.balance_type === "AKTIVA");
    const passiva = HGB_266_REPORT_LINES.filter((l) => l.balance_type === "PASSIVA");
    expect(aktiva.length).toBe(34);
    expect(passiva.length).toBe(21);
    expect(HGB_266_REPORT_LINES.length).toBe(55);
  });

  it("every line has a non-empty hgb_paragraph citation", () => {
    const missing = HGB_266_REPORT_LINES.filter((l) => !l.hgb_paragraph);
    expect(missing).toEqual([]);
  });

  it("P.A.V (Jahresüberschuss vorläufig) is marked virtual", () => {
    const pav = HGB_266_REPORT_LINES.find((l) => l.reference_code === "P.A.V");
    expect(pav).toBeDefined();
    expect(pav!.is_virtual).toBe(true);
  });

  it("every non-root line has a parent that exists", () => {
    const codes = new Set(HGB_266_REPORT_LINES.map((l) => l.reference_code));
    const orphans: ReportLineDef[] = [];
    for (const l of HGB_266_REPORT_LINES) {
      if (l.parent && !codes.has(l.parent)) orphans.push(l);
    }
    expect(orphans).toEqual([]);
  });

  it("no circular references (parent chain terminates)", () => {
    const byCode = new Map(
      HGB_266_REPORT_LINES.map((l) => [l.reference_code, l])
    );
    for (const l of HGB_266_REPORT_LINES) {
      const visited = new Set<string>();
      let cur: ReportLineDef | undefined = l;
      while (cur?.parent) {
        if (visited.has(cur.parent)) {
          throw new Error(
            `Circular parent chain detected starting at ${l.reference_code}`
          );
        }
        visited.add(cur.parent);
        cur = byCode.get(cur.parent);
      }
      // reached null parent → ok
    }
    expect(true).toBe(true);
  });

  it("visibleForSizeClass: KLEIN hides GROSS-only, MITTEL shows KLEIN+MITTEL, GROSS shows all", () => {
    const grossOnly = HGB_266_REPORT_LINES.find(
      (l) => l.reference_code === "A.I.1"
    )!;
    expect(grossOnly.size_class).toBe("GROSS");
    expect(visibleForSizeClass(grossOnly, "KLEIN")).toBe(false);
    expect(visibleForSizeClass(grossOnly, "MITTEL")).toBe(false);
    expect(visibleForSizeClass(grossOnly, "GROSS")).toBe(true);

    const allClass = HGB_266_REPORT_LINES.find(
      (l) => l.reference_code === "B.IV"
    )!;
    expect(allClass.size_class).toBe("ALL");
    expect(visibleForSizeClass(allClass, "KLEIN")).toBe(true);
    expect(visibleForSizeClass(allClass, "MITTEL")).toBe(true);
    expect(visibleForSizeClass(allClass, "GROSS")).toBe(true);

    // D = Aktive latente Steuern is MITTEL → visible in MITTEL and GROSS, not KLEIN
    const mittel = HGB_266_REPORT_LINES.find(
      (l) => l.reference_code === "D"
    )!;
    expect(mittel.size_class).toBe("MITTEL");
    expect(visibleForSizeClass(mittel, "KLEIN")).toBe(false);
    expect(visibleForSizeClass(mittel, "MITTEL")).toBe(true);
    expect(visibleForSizeClass(mittel, "GROSS")).toBe(true);
  });

  it("all AKTIVA nodes have normal_side=SOLL, PASSIVA=HABEN", () => {
    for (const l of HGB_266_REPORT_LINES) {
      if (l.balance_type === "AKTIVA") expect(l.normal_side).toBe("SOLL");
      if (l.balance_type === "PASSIVA") expect(l.normal_side).toBe("HABEN");
    }
  });

  it("reference codes are unique", () => {
    const codes = HGB_266_REPORT_LINES.map((l) => l.reference_code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});
