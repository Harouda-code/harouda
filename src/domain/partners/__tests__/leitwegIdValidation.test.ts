// Sprint 19.B · Leitweg-ID-Validator-Tests.

import { describe, it, expect } from "vitest";
import { validateLeitwegId } from "../leitwegIdValidation";

describe("validateLeitwegId · gueltig", () => {
  it("#1 Minimal 2-1-2", () => {
    expect(validateLeitwegId("04-A-99").valid).toBe(true);
  });

  it("#2 Realitätsnahes Beispiel (Bund)", () => {
    expect(validateLeitwegId("991-01001-43").valid).toBe(true);
  });

  it("#3 Lange Feinadressierung", () => {
    expect(
      validateLeitwegId("123456789012-ABCDEFGHIJ1234567890-42").valid
    ).toBe(true);
  });

  it("#4 lower-case wird normalisiert", () => {
    expect(validateLeitwegId("04-abc-99").valid).toBe(true);
  });
});

describe("validateLeitwegId · ungueltig", () => {
  it("#5 Leerer String", () => {
    expect(validateLeitwegId("").valid).toBe(false);
  });

  it("#6 Fehlende Prüfziffer", () => {
    expect(validateLeitwegId("991-01001").valid).toBe(false);
  });

  it("#7 Nur 1 Bindestrich", () => {
    expect(validateLeitwegId("99101001-43").valid).toBe(false);
  });

  it("#8 Prüfziffer-Block zu lang", () => {
    expect(validateLeitwegId("991-01001-432").valid).toBe(false);
  });

  it("#9 Feinadressierung > 30 Zeichen", () => {
    const longFeinadr = "A".repeat(31);
    expect(validateLeitwegId(`04-${longFeinadr}-99`).valid).toBe(false);
  });
});
