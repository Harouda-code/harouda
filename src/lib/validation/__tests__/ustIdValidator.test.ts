import { describe, it, expect } from "vitest";
import {
  validateUstId,
  validateGermanUstIdChecksum,
  supportedUstIdCountries,
  USTID_PATTERNS,
} from "../ustIdValidator";

describe("validateUstId", () => {
  it("DE Valid: 9 Ziffern", () => {
    const r = validateUstId("DE123456789");
    expect(r.isValid).toBe(true);
    expect(r.country).toBe("DE");
    expect(r.formatted).toBe("DE123456789");
  });

  it("DE ungültig: 8 Ziffern", () => {
    expect(validateUstId("DE12345678").isValid).toBe(false);
  });

  it("AT Valid: ATU + 8 Ziffern", () => {
    expect(validateUstId("ATU12345678").isValid).toBe(true);
  });

  it("FR Valid: FR + 2 alphanumeric + 9 digits", () => {
    expect(validateUstId("FR12345678901").isValid).toBe(true);
    expect(validateUstId("FRAB345678901").isValid).toBe(true);
  });

  it("EL (Griechenland, nicht GR!)", () => {
    expect(validateUstId("GR123456789").isValid).toBe(false);
    expect(validateUstId("EL123456789").isValid).toBe(true);
  });

  it("NL Valid: NL + 9 digits + B + 2 digits", () => {
    expect(validateUstId("NL123456789B01").isValid).toBe(true);
  });

  it("IE Valid (alte + neue Formen)", () => {
    expect(validateUstId("IE1234567T").isValid).toBe(true);
    expect(validateUstId("IE1A23456T").isValid).toBe(true);
  });

  it("XI (Nordirland, Post-Brexit)", () => {
    expect(validateUstId("XI123456789").isValid).toBe(true);
  });

  it("Whitespace wird entfernt, Kleinbuchstaben normalisiert", () => {
    const r = validateUstId("de 123 456 789");
    expect(r.isValid).toBe(true);
    expect(r.formatted).toBe("DE123456789");
  });

  it("Zu kurz", () => {
    expect(validateUstId("DE").isValid).toBe(false);
    expect(validateUstId("DE").errors[0]).toMatch(/zu kurz/);
  });

  it("Unbekanntes Länder-Präfix", () => {
    const r = validateUstId("US123456789");
    expect(r.isValid).toBe(false);
    expect(r.country).toBe("US");
    expect(r.errors[0]).toMatch(/kein bekannter EU/);
  });

  it("Falsches Format innerhalb gültigen Landes", () => {
    // DE mit Buchstaben
    const r = validateUstId("DE1234ABCDE");
    expect(r.isValid).toBe(false);
    expect(r.country).toBe("DE");
    expect(r.errors[0]).toMatch(/Format ungültig/);
  });

  it("supportedUstIdCountries includes major EU states", () => {
    const list = supportedUstIdCountries();
    for (const c of ["DE", "FR", "IT", "ES", "NL", "AT", "BE", "XI"]) {
      expect(list).toContain(c);
    }
    expect(list.length).toBeGreaterThanOrEqual(27);
  });

  it("USTID_PATTERNS has exactly the supported list", () => {
    expect(Object.keys(USTID_PATTERNS).length).toBe(
      supportedUstIdCountries().length
    );
  });
});

describe("validateGermanUstIdChecksum", () => {
  it("rejects non-DE formats", () => {
    expect(validateGermanUstIdChecksum("AT123456789")).toBe(false);
    expect(validateGermanUstIdChecksum("DE12345678")).toBe(false);
  });

  it("accepts a known valid DE USt-IdNr (BZSt-Beispiel)", () => {
    // Beispiel aus der BZSt-Dokumentation: DE136695976 hat korrekte Prüfziffer
    expect(validateGermanUstIdChecksum("DE136695976")).toBe(true);
  });

  it("rejects if Prüfziffer falsch", () => {
    // Letzte Ziffer falsch
    expect(validateGermanUstIdChecksum("DE136695970")).toBe(false);
  });
});
