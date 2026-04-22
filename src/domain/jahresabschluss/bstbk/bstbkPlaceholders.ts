/**
 * Whitelist-basiertes Placeholder-Substitution-System (Sprint 17.5 / Schritt 3).
 *
 * Sicherheit — SAEULE 2 der BStBK-Umsetzung:
 *   - NUR vordefinierte Keys werden ersetzt.
 *   - Unbekannte {{XYZ}} bleiben als-is (Injection-Schutz).
 *   - Leere Werte bleiben als {{VAR}} sichtbar (kein silent-fail).
 *   - Control-Chars in Inputs werden gefiltert.
 *   - Keine Rekursion (ein einmaliger Durchlauf).
 *
 * Design-Entscheidung: Whitelist statt Blacklist — damit neue
 * Placeholder nur durch explizites Erweitern der BSTBK_PLACEHOLDERS-
 * Konstante zugelassen werden. Code-Review-Pflicht.
 */

export const BSTBK_PLACEHOLDERS = [
  "MandantenName",
  "JahresabschlussStichtag",
  "KanzleiName",
  "Ort",
  "Datum",
  "SteuerberaterName",
] as const;

export type BstbkPlaceholderKey = (typeof BSTBK_PLACEHOLDERS)[number];

export type BstbkPlaceholderValues = Record<BstbkPlaceholderKey, string>;

export type SubstitutionResult = {
  text: string;
  missing_values: BstbkPlaceholderKey[];
  unknown_placeholders_in_template: string[];
};

/** Entfernt Control-Zeichen (0x00-0x1F und 0x7F) aus Eingabe. */
function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1F\x7F]/g, "");
}

function isWhitelisted(key: string): key is BstbkPlaceholderKey {
  return (BSTBK_PLACEHOLDERS as readonly string[]).includes(key);
}

/**
 * Ersetzt in template alle `{{Key}}`-Vorkommen mit values[Key], wenn
 *  - key in der Whitelist UND
 *  - values[key] non-empty-string ist.
 * Andernfalls bleibt `{{Key}}` stehen und der Key landet in
 * `missing_values` (Whitelist-Hit mit fehlendem Wert) bzw.
 * `unknown_placeholders_in_template` (Key nicht in Whitelist).
 */
export function substitutePlaceholders(
  template: string,
  values: Partial<BstbkPlaceholderValues>
): SubstitutionResult {
  const missingSet = new Set<BstbkPlaceholderKey>();
  const unknownSet = new Set<string>();

  const regex = /\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g;
  const text = template.replace(regex, (match, rawKey: string) => {
    if (!isWhitelisted(rawKey)) {
      unknownSet.add(rawKey);
      return match; // bleibt als-is
    }
    const raw = values[rawKey];
    if (typeof raw !== "string" || raw.trim().length === 0) {
      missingSet.add(rawKey);
      return match; // bleibt als-is
    }
    return stripControlChars(raw);
  });

  return {
    text,
    missing_values: Array.from(missingSet),
    unknown_placeholders_in_template: Array.from(unknownSet),
  };
}

/**
 * Pruefung: sind alle 6 Whitelist-Keys non-empty befuellt?
 */
export function validatePlaceholderValues(
  values: Partial<BstbkPlaceholderValues>
): { valid: boolean; missing: BstbkPlaceholderKey[] } {
  const missing: BstbkPlaceholderKey[] = [];
  for (const k of BSTBK_PLACEHOLDERS) {
    const v = values[k];
    if (typeof v !== "string" || v.trim().length === 0) {
      missing.push(k);
    }
  }
  return { valid: missing.length === 0, missing };
}

/** Hilfs-Label fuer Fehlermeldungen / UI-Warnungen. */
export const BSTBK_PLACEHOLDER_LABELS: Record<BstbkPlaceholderKey, string> = {
  MandantenName: "Mandanten-Name",
  JahresabschlussStichtag: "Jahresabschluss-Stichtag",
  KanzleiName: "Kanzlei-Name",
  Ort: "Ort",
  Datum: "Datum",
  SteuerberaterName: "Steuerberater-Name",
};
