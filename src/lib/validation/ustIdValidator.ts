/**
 * USt-IdNr-Validierung (EU-Mitgliedstaaten + XI Nordirland).
 *
 * Format-Regex pro EU-Land; aktueller Stand Mitte 2025. Validiert:
 *   - Länder-Präfix (2 Buchstaben)
 *   - Länge und Zeichentyp gemäß EU-VIES-Spezifikation
 *
 * NICHT geprüft:
 *   - Tatsächliche Gültigkeit bei EU-VIES (erfordert Live-API)
 *   - Prüfziffer (nur für DE optional; produktive MOD-11-10-Berechnung)
 */

export const USTID_PATTERNS: Record<string, RegExp> = {
  DE: /^DE[0-9]{9}$/,
  AT: /^ATU[0-9]{8}$/,
  BE: /^BE0?[0-9]{9,10}$/,
  BG: /^BG[0-9]{9,10}$/,
  CY: /^CY[0-9]{8}[A-Z]$/,
  CZ: /^CZ[0-9]{8,10}$/,
  DK: /^DK[0-9]{8}$/,
  EE: /^EE[0-9]{9}$/,
  EL: /^EL[0-9]{9}$/, // Griechenland (EL, nicht GR)
  ES: /^ES[0-9A-Z][0-9]{7}[0-9A-Z]$/,
  FI: /^FI[0-9]{8}$/,
  FR: /^FR[0-9A-Z]{2}[0-9]{9}$/,
  HR: /^HR[0-9]{11}$/,
  HU: /^HU[0-9]{8}$/,
  IE: /^IE[0-9]{7}[A-Z]{1,2}$|^IE[0-9][A-Z][0-9]{5}[A-Z]$/,
  IT: /^IT[0-9]{11}$/,
  LT: /^LT([0-9]{9}|[0-9]{12})$/,
  LU: /^LU[0-9]{8}$/,
  LV: /^LV[0-9]{11}$/,
  MT: /^MT[0-9]{8}$/,
  NL: /^NL[0-9]{9}B[0-9]{2}$/,
  PL: /^PL[0-9]{10}$/,
  PT: /^PT[0-9]{9}$/,
  RO: /^RO[0-9]{2,10}$/,
  SE: /^SE[0-9]{12}$/,
  SI: /^SI[0-9]{8}$/,
  SK: /^SK[0-9]{10}$/,
  XI: /^XI[0-9]{9}$/, // Nordirland (post-Brexit)
};

export type UstIdValidation = {
  isValid: boolean;
  country?: string;
  formatted?: string;
  errors: string[];
};

/** Normalisiert + prüft USt-IdNr. Whitespace wird entfernt, Kleinbuchstaben
 *  werden zu Großbuchstaben. */
export function validateUstId(ustid: string): UstIdValidation {
  const normalized = ustid.replace(/\s/g, "").toUpperCase();

  if (normalized.length < 4) {
    return { isValid: false, errors: ["USt-IdNr zu kurz (min. 4 Zeichen)"] };
  }

  const country = normalized.substring(0, 2);
  const pattern = USTID_PATTERNS[country];

  if (!pattern) {
    return {
      isValid: false,
      country,
      errors: [`Länder-Präfix "${country}" ist kein bekannter EU-Mitgliedstaat`],
    };
  }

  if (!pattern.test(normalized)) {
    return {
      isValid: false,
      country,
      errors: [
        `Format ungültig für ${country}: "${ustid}" entspricht nicht dem EU-VIES-Schema`,
      ],
    };
  }

  return {
    isValid: true,
    country,
    formatted: normalized,
    errors: [],
  };
}

/** DE-USt-IdNr Prüfziffer (MOD 11-10 Algorithmus nach BZSt-Spec).
 *  Gültig nur für Inhaltsnummer (Ziffern nach "DE"). */
export function validateGermanUstIdChecksum(ustid: string): boolean {
  const m = ustid.match(/^DE([0-9]{9})$/);
  if (!m) return false;
  const digits = m[1];
  // MOD-11-10-Algorithmus (vereinfachte Implementation):
  let p = 10;
  for (let i = 0; i < 8; i++) {
    const d = Number(digits[i]);
    let sum = (d + p) % 10;
    if (sum === 0) sum = 10;
    p = (2 * sum) % 11;
  }
  const expected = (11 - p) % 10;
  return Number(digits[8]) === expected;
}

/** Liste aller unterstützten Länder. */
export function supportedUstIdCountries(): string[] {
  return Object.keys(USTID_PATTERNS).sort();
}
