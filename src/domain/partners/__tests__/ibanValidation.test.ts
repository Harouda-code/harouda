// Sprint 19.B · IBAN-Validator-Tests.

import { describe, it, expect } from "vitest";
import { validateIban } from "../ibanValidation";

// Testvektoren aus ISO 13616-Beispielen und öffentlichen Testaccounts.
// DE89370400440532013000 ist ein ECB-Test-IBAN.
describe("validateIban · gueltige IBANs", () => {
  it("#1 DE ECB-Test-IBAN", () => {
    const r = validateIban("DE89370400440532013000");
    expect(r.valid).toBe(true);
    expect(r.country).toBe("DE");
  });

  it("#2 DE mit Leerzeichen + lowercase", () => {
    const r = validateIban("de89 3704 0044 0532 0130 00");
    expect(r.valid).toBe(true);
    expect(r.country).toBe("DE");
  });

  it("#3 GB Nat West Test", () => {
    expect(validateIban("GB29NWBK60161331926819").valid).toBe(true);
  });

  it("#4 FR Test", () => {
    expect(validateIban("FR1420041010050500013M02606").valid).toBe(true);
  });

  it("#5 IT Test", () => {
    expect(validateIban("IT60X0542811101000000123456").valid).toBe(true);
  });

  it("#6 NL Test", () => {
    expect(validateIban("NL91ABNA0417164300").valid).toBe(true);
  });
});

describe("validateIban · Fehlerfaelle", () => {
  it("#7 Leerer String → Fehler", () => {
    expect(validateIban("").valid).toBe(false);
  });

  it("#8 Ungueltiges Sonderzeichen → Fehler", () => {
    const r = validateIban("DE89-3704");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/ungültige Zeichen/);
  });

  it("#9 Unbekanntes Country-Prefix → Fehler", () => {
    const r = validateIban("ZZ12345678901234");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Länderpräfix/);
  });

  it("#10 DE mit falscher Länge → Fehler", () => {
    const r = validateIban("DE89370400440532013");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Länge/);
  });

  it("#11 Mod-97-Failure (letzte Ziffer manipuliert)", () => {
    // Ausgangs-IBAN ist valid; letzte Ziffer von 0 auf 1 aendern → ungueltig.
    const r = validateIban("DE89370400440532013001");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Prüfziffer/);
  });
});
