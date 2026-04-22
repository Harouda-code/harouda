/**
 * IBAN-Format-Validator nach ISO 13616 (Mod-97-Check).
 *
 * Sprint 19.B. Pure function, keine externe Lib.
 */

export type IbanValidationResult = {
  valid: boolean;
  country: string | null;
  error?: string;
};

// ISO 13616 Laengen-Tabelle (Stand 2025 — ca. 74 Laender im IBAN-System).
// Wir listen nur die relevanten EU/EWR/CH/UK; fuer den Rest wird die
// Laenge-Tabelle via fetch nicht geladen — bei unbekannten Country-Codes
// lehnen wir schoen ab.
const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22,
  BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18,
  DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22,
  GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28, IE: 22,
  IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32,
  LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19,
  MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29,
  PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SC: 31, SE: 24, SI: 19,
  SK: 24, SM: 27, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26, UA: 29,
  VA: 22, VG: 24, XK: 20,
};

/**
 * Prueft IBAN auf Country-Laenge und Mod-97-Korrektheit.
 * Leading/Trailing Whitespace + interne Spaces werden toleriert.
 */
export function validateIban(iban: string): IbanValidationResult {
  if (!iban) {
    return { valid: false, country: null, error: "IBAN ist leer." };
  }
  const cleaned = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return {
      valid: false,
      country: null,
      error: "IBAN enthält ungültige Zeichen (nur A-Z und 0-9 erlaubt).",
    };
  }
  if (cleaned.length < 5) {
    return { valid: false, country: null, error: "IBAN zu kurz." };
  }
  const country = cleaned.slice(0, 2);
  const expectedLen = IBAN_LENGTHS[country];
  if (!expectedLen) {
    return {
      valid: false,
      country,
      error: `Unbekanntes Länderpräfix „${country}".`,
    };
  }
  if (cleaned.length !== expectedLen) {
    return {
      valid: false,
      country,
      error: `Länge ${cleaned.length} ungültig für ${country} (erwartet ${expectedLen}).`,
    };
  }
  if (!mod97(cleaned)) {
    return {
      valid: false,
      country,
      error: "Prüfziffer (Mod-97) stimmt nicht.",
    };
  }
  return { valid: true, country };
}

/**
 * ISO 13616 Mod-97: erste 4 Zeichen ans Ende, Buchstaben→Zahlen
 * (A=10..Z=35), dann `BigInt`-Modulo 97 muss == 1 ergeben.
 */
function mod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      numeric += ch;
    } else if (code >= 65 && code <= 90) {
      numeric += String(code - 55);
    } else {
      return false;
    }
  }
  // Chunked-Modulo, damit keine BigInt-Dependency nötig ist.
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = String(remainder) + numeric.slice(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder === 1;
}
