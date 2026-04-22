// Sprint 19.B · ustIdValidation-Tests.
// Abdeckung: 29 Prefixes (27 EU + XI + NI) + Fehler-Paths.

import { describe, it, expect } from "vitest";
import {
  KNOWN_COUNTRY_PREFIXES,
  validateUstIdnrFormat,
} from "../ustIdValidation";

describe("ustIdValidation · gueltige Formate EU-27 + XI + NI", () => {
  it("#1 DE: 9 Ziffern", () => {
    expect(validateUstIdnrFormat("DE123456789").valid).toBe(true);
  });

  it("#2 AT: U + 8 Ziffern", () => {
    expect(validateUstIdnrFormat("ATU12345678").valid).toBe(true);
  });

  it("#3 FR: 2 Zeichen + 9 Ziffern", () => {
    expect(validateUstIdnrFormat("FRXX123456789").valid).toBe(true);
    expect(validateUstIdnrFormat("FR12345678901").valid).toBe(true);
  });

  it("#4 NL: 9 Ziffern + B + 2 Ziffern", () => {
    expect(validateUstIdnrFormat("NL123456789B01").valid).toBe(true);
  });

  it("#5 IT: 11 Ziffern", () => {
    expect(validateUstIdnrFormat("IT12345678901").valid).toBe(true);
  });

  it("#6 ES: Mixed A-Z / Ziffern laut Muster", () => {
    expect(validateUstIdnrFormat("ESA1234567B").valid).toBe(true);
    expect(validateUstIdnrFormat("ES12345678Z").valid).toBe(true);
  });

  it("#7 SE: 12 Ziffern", () => {
    expect(validateUstIdnrFormat("SE123456789012").valid).toBe(true);
  });

  it("#8 BE: 10 Ziffern (0 oder 1 vorne)", () => {
    expect(validateUstIdnrFormat("BE0123456789").valid).toBe(true);
    expect(validateUstIdnrFormat("BE1123456789").valid).toBe(true);
  });

  it("#9 EL: 9 Ziffern (Griechenland-Prefix)", () => {
    expect(validateUstIdnrFormat("EL123456789").valid).toBe(true);
  });

  it("#10 XI (Nordirland post-Brexit): 9 Ziffern", () => {
    expect(validateUstIdnrFormat("XI123456789").valid).toBe(true);
  });

  it("#11 NI (historischer Alias): 9 Ziffern", () => {
    expect(validateUstIdnrFormat("NI123456789").valid).toBe(true);
  });

  it("#12 Whitespace + lower-case werden normalisiert", () => {
    expect(validateUstIdnrFormat("  de 123 456 789 ").valid).toBe(true);
    expect(validateUstIdnrFormat("de123456789").country).toBe("DE");
  });
});

describe("ustIdValidation · invalide Werte", () => {
  it("#13 Leerer String → valid=false", () => {
    const r = validateUstIdnrFormat("");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/leer/);
  });

  it("#14 Unbekanntes Prefix → valid=false + Fehler", () => {
    const r = validateUstIdnrFormat("US123456789");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Länderpräfix/);
  });

  it("#15 DE mit 8 Ziffern → valid=false, aber country=DE", () => {
    const r = validateUstIdnrFormat("DE12345678");
    expect(r.valid).toBe(false);
    expect(r.country).toBe("DE");
  });

  it("#16 DE mit 10 Ziffern → valid=false", () => {
    expect(validateUstIdnrFormat("DE1234567890").valid).toBe(false);
  });

  it("#17 AT ohne U → valid=false", () => {
    expect(validateUstIdnrFormat("AT12345678").valid).toBe(false);
  });

  it("#18 zu kurz → valid=false", () => {
    expect(validateUstIdnrFormat("DE1").valid).toBe(false);
  });
});

describe("ustIdValidation · Metadaten", () => {
  it("#19 KNOWN_COUNTRY_PREFIXES enthaelt 29 Eintraege (27 EU + XI + NI)", () => {
    expect(KNOWN_COUNTRY_PREFIXES).toHaveLength(29);
  });

  it("#20 KNOWN_COUNTRY_PREFIXES enthaelt DE, EL, XI, NI", () => {
    for (const p of ["DE", "EL", "XI", "NI"]) {
      expect(KNOWN_COUNTRY_PREFIXES).toContain(p);
    }
  });
});
