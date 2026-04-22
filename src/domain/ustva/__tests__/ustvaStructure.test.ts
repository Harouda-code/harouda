import { describe, it, expect } from "vitest";
import {
  USTVA_STRUCTURE_2025,
  USTVA_BY_KZ,
  positionsInSection,
} from "../ustvaStructure";

describe("USTVA_STRUCTURE_2025", () => {
  it("has 19% Umsatz Kz 81", () => {
    const p = USTVA_BY_KZ.get("81");
    expect(p).toBeDefined();
    expect(p!.type).toBe("UMSATZ_NETTO");
    expect(p!.steuersatz).toBe(0.19);
  });

  it("has 7% Umsatz Kz 86", () => {
    expect(USTVA_BY_KZ.get("86")!.steuersatz).toBe(0.07);
  });

  it("has Vorsteuer Kz 66", () => {
    expect(USTVA_BY_KZ.get("66")!.type).toBe("VORSTEUER");
  });

  it("SUBTOTAL UST_SUMME has valid components (all existing Kz)", () => {
    const s = USTVA_BY_KZ.get("UST_SUMME")!;
    expect(s.type).toBe("SUBTOTAL");
    for (const c of s.components ?? []) {
      expect(USTVA_BY_KZ.has(c)).toBe(true);
    }
  });

  it("SUBTOTAL VST_SUMME has valid components", () => {
    const s = USTVA_BY_KZ.get("VST_SUMME")!;
    expect(s.type).toBe("SUBTOTAL");
    for (const c of s.components ?? []) {
      expect(USTVA_BY_KZ.has(c)).toBe(true);
    }
  });

  it("FINAL_RESULT Kz 65 exists with correct computation description", () => {
    const p = USTVA_BY_KZ.get("65")!;
    expect(p.type).toBe("FINAL_RESULT");
    expect(p.computation).toMatch(/UST_SUMME.*VST_SUMME/);
  });

  it("STEUERBETRAG Kz 81_STEUER references Kz 81 with 19 %", () => {
    const p = USTVA_BY_KZ.get("81_STEUER")!;
    expect(p.type).toBe("STEUERBETRAG");
    expect(p.from_kz).toBe("81");
    expect(p.steuersatz).toBe(0.19);
  });

  it("STEUERBETRAG_AGGREGAT Kz 47 aggregates §13b Kz", () => {
    const p = USTVA_BY_KZ.get("47")!;
    expect(p.type).toBe("STEUERBETRAG_AGGREGAT");
    expect(p.from_kzs).toEqual(["46", "52", "73", "78"]);
  });

  it("all reference_codes are unique", () => {
    const codes = USTVA_STRUCTURE_2025.map((p) => p.kz);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("positionsInSection A returns > 0 Kz", () => {
    expect(positionsInSection("A").length).toBeGreaterThan(0);
  });
  it("positionsInSection B includes Kz 66 (Vorsteuer)", () => {
    expect(positionsInSection("B").map((p) => p.kz)).toContain("66");
  });
  it("positionsInSection C includes Kz 65 (FINAL_RESULT)", () => {
    expect(positionsInSection("C").map((p) => p.kz)).toContain("65");
  });

  it("every SUBTOTAL and FINAL_RESULT has a computation annotation", () => {
    for (const p of USTVA_STRUCTURE_2025) {
      if (p.type === "SUBTOTAL" || p.type === "FINAL_RESULT") {
        expect(p.computation, `${p.kz} missing computation`).toBeTruthy();
      }
    }
  });

  it("every STEUERBETRAG has from_kz + steuersatz set", () => {
    for (const p of USTVA_STRUCTURE_2025) {
      if (p.type === "STEUERBETRAG") {
        expect(p.from_kz).toBeTruthy();
        expect(p.steuersatz).toBeTypeOf("number");
      }
    }
  });
});
