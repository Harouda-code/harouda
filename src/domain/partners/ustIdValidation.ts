/**
 * EU-VAT-ID-Format-Validator (Sprint 19.B).
 *
 * Prueft das Muster laut EU-Kommission "Structure of VAT identification
 * numbers" (Stand 2025). Das ist KEIN Korrektheitscheck (Luhn/Check-
 * digit), sondern nur strukturell — die semantische Verifikation erledigt
 * VIES via `verify-ust-idnr`-Edge-Function.
 *
 * Besonderheit Nordirland: seit Brexit nutzt die FA-Registrierung in
 * Nordirland "XI" statt "GB"; manche Datenquellen (und legacy-Kunden-
 * stammdaten) tragen "NI" als informellen Alias. Wir akzeptieren beide
 * Prefixe mit demselben Muster; VIES selbst kennt nur "XI".
 */

export type UstIdFormatResult = {
  valid: boolean;
  country: string | null;
  error?: string;
};

type CountryRule = {
  /** Laenderkennung (auch die ggf. "EL" fuer GR, "XI"/"NI" fuer Nordirland). */
  prefix: string;
  /** Ohne den 2-Buchstaben-Prefix. */
  rest: RegExp;
};

// ---------------------------------------------------------------------------
// Regel-Tabelle: 27 EU-Mitglieder + EL(=GR) + XI + NI (Sprint 19.B-Spec).
// Referenzen:
//   https://ec.europa.eu/taxation_customs/vies/help.html
//   HMRC VAT Notice 725 (UK/XI)
// ---------------------------------------------------------------------------

const RULES: CountryRule[] = [
  { prefix: "AT", rest: /^U[0-9]{8}$/ },
  { prefix: "BE", rest: /^[01][0-9]{9}$/ },
  { prefix: "BG", rest: /^[0-9]{9,10}$/ },
  { prefix: "CY", rest: /^[0-9]{8}[A-Z]$/ },
  { prefix: "CZ", rest: /^[0-9]{8,10}$/ },
  { prefix: "DE", rest: /^[0-9]{9}$/ },
  { prefix: "DK", rest: /^[0-9]{8}$/ },
  { prefix: "EE", rest: /^[0-9]{9}$/ },
  { prefix: "EL", rest: /^[0-9]{9}$/ }, // Griechenland (VIES nutzt EL, nicht GR)
  // Spanien: 9 Zeichen, mit mindestens einem Buchstaben am Anfang oder Ende.
  { prefix: "ES", rest: /^([A-Z][0-9]{7}[A-Z0-9]|[0-9]{8}[A-Z])$/ },
  { prefix: "FI", rest: /^[0-9]{8}$/ },
  { prefix: "FR", rest: /^[A-Z0-9]{2}[0-9]{9}$/ },
  { prefix: "HR", rest: /^[0-9]{11}$/ },
  { prefix: "HU", rest: /^[0-9]{8}$/ },
  // Irland: 7 Digits + 1-2 Buchstaben ODER Digit + Letter + 5 Digits + Letter
  { prefix: "IE", rest: /^([0-9]{7}[A-Z]{1,2}|[0-9][A-Z*+][0-9]{5}[A-Z])$/ },
  { prefix: "IT", rest: /^[0-9]{11}$/ },
  { prefix: "LT", rest: /^([0-9]{9}|[0-9]{12})$/ },
  { prefix: "LU", rest: /^[0-9]{8}$/ },
  { prefix: "LV", rest: /^[0-9]{11}$/ },
  { prefix: "MT", rest: /^[0-9]{8}$/ },
  { prefix: "NL", rest: /^[0-9]{9}B[0-9]{2}$/ },
  { prefix: "PL", rest: /^[0-9]{10}$/ },
  { prefix: "PT", rest: /^[0-9]{9}$/ },
  { prefix: "RO", rest: /^[0-9]{2,10}$/ },
  { prefix: "SE", rest: /^[0-9]{12}$/ },
  { prefix: "SI", rest: /^[0-9]{8}$/ },
  { prefix: "SK", rest: /^[0-9]{10}$/ },
  // Nordirland post-Brexit: XI (EU-VIES-Prefix) + NI (historischer Alias).
  // Muster analog GB: 9 Digits ODER "GD"/"HA" + 3 Digits (Behoerden/Gesundheit).
  { prefix: "XI", rest: /^([0-9]{9}([0-9]{3})?|GD[0-9]{3}|HA[0-9]{3})$/ },
  { prefix: "NI", rest: /^([0-9]{9}([0-9]{3})?|GD[0-9]{3}|HA[0-9]{3})$/ },
];

const RULES_BY_PREFIX = new Map<string, CountryRule>(
  RULES.map((r) => [r.prefix, r])
);

/**
 * Normalisiert (Whitespace weg, Upper-Case) und prueft Muster.
 * Bei `valid=false` enthaelt `error` die deutsche Fehlermeldung.
 */
export function validateUstIdnrFormat(ustIdnr: string): UstIdFormatResult {
  if (!ustIdnr) {
    return { valid: false, country: null, error: "USt-IdNr ist leer." };
  }
  const raw = ustIdnr.replace(/\s+/g, "").toUpperCase();
  if (raw.length < 4) {
    return {
      valid: false,
      country: null,
      error: "USt-IdNr zu kurz (mindestens Länderpräfix + 2 Zeichen).",
    };
  }
  const prefix = raw.slice(0, 2);
  const rest = raw.slice(2);
  const rule = RULES_BY_PREFIX.get(prefix);
  if (!rule) {
    return {
      valid: false,
      country: null,
      error: `Unbekanntes Länderpräfix "${prefix}".`,
    };
  }
  if (!rule.rest.test(rest)) {
    return {
      valid: false,
      country: prefix,
      error: `Format passt nicht zum Muster für ${prefix}.`,
    };
  }
  return { valid: true, country: prefix };
}

/** Alle bekannten Prefixes (fuer UI-Auswahl). */
export const KNOWN_COUNTRY_PREFIXES: readonly string[] = RULES.map(
  (r) => r.prefix
);
