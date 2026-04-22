import { describe, it, expect } from "vitest";
import {
  EUER_STRUCTURE_2025,
  EUER_BY_KZ,
  positionsInSection,
} from "../euerStructure";

describe("EUER_STRUCTURE_2025 (Anlage EÜR 2025)", () => {
  it("has Kleinunternehmer Kz 111", () => {
    const p = EUER_BY_KZ.get("111");
    expect(p).toBeDefined();
    expect(p!.type).toBe("EINNAHME_KLEINUNT");
    expect(p!.section).toBe("B");
  });

  it("has Netto-Einnahmen Kz 112", () => {
    expect(EUER_BY_KZ.get("112")!.type).toBe("EINNAHME_NETTO");
  });

  it("has Summe Einnahmen Kz 109 as SUBTOTAL", () => {
    const p = EUER_BY_KZ.get("109")!;
    expect(p.type).toBe("SUBTOTAL");
    expect(p.components!.length).toBeGreaterThan(0);
    for (const c of p.components!) {
      expect(EUER_BY_KZ.has(c), `component ${c} missing`).toBe(true);
    }
  });

  it("has Summe Ausgaben Kz 199 as SUBTOTAL", () => {
    const p = EUER_BY_KZ.get("199")!;
    expect(p.type).toBe("SUBTOTAL");
    expect(p.components!.length).toBeGreaterThan(0);
  });

  it("has Steuerlicher Gewinn Kz 219 as FINAL_RESULT", () => {
    const p = EUER_BY_KZ.get("219")!;
    expect(p.type).toBe("FINAL_RESULT");
    expect(p.is_final_result).toBe(true);
  });

  it("Bewirtung Kz 175 has abzugsfaehig_prozent = 70", () => {
    expect(EUER_BY_KZ.get("175")!.abzugsfaehig_prozent).toBe(70);
  });

  it("Geschenke Kz 170 has hoechstbetrag = 50", () => {
    expect(EUER_BY_KZ.get("170")!.hoechstbetrag).toBe(50);
  });

  it("Kz 270 IAB Antrag is in section E", () => {
    expect(EUER_BY_KZ.get("270")!.section).toBe("E");
  });

  it("all kz codes unique", () => {
    const codes = EUER_STRUCTURE_2025.map((p) => p.kz);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all SUBTOTAL have computation annotation", () => {
    for (const p of EUER_STRUCTURE_2025) {
      if (p.type === "SUBTOTAL" || p.type === "FINAL_RESULT") {
        expect(p.computation, `${p.kz} missing computation`).toBeTruthy();
      }
    }
  });

  it("positionsInSection returns correct partition", () => {
    expect(positionsInSection("B").length).toBeGreaterThan(0);
    expect(positionsInSection("C").length).toBeGreaterThan(0);
    expect(positionsInSection("D").length).toBeGreaterThan(0);
    // All Kz in section B are actually B
    for (const p of positionsInSection("B")) expect(p.section).toBe("B");
  });
});
