/**
 * Phase 3 / Schritt 6 — Helper: Konto-Nummer → Default-Tag-Set.
 *
 * Ableitung aus dem Range-basierten `SKR03_ANLAGEN_MAPPING` (Schritt 4).
 * Wird in zwei Kontexten benutzt:
 *   1. `SKR03_SEED`-Augmentierung (Build-Zeit): jedes Standard-Konto
 *      bekommt die passenden Tags vor-eingetragen.
 *   2. AccountsPage-UI: Default-Vorschlag für neu angelegte Konten
 *      (User kann manuell überschreiben).
 *
 * Tag-Format: `"<anlage-id>:<feld>"` (z. B. `"anlage-g:umsaetze"`).
 *
 * Idempotenz: bei gleicher Input-Konto-Nr wird immer dasselbe Set
 * zurückgegeben; Duplikate werden per Set dedupliziert.
 */

import { SKR03_ANLAGEN_MAPPING } from "./skr03AnlagenMapping";

export function tagsForKonto(kontoNr: string): string[] {
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return [];
  const set = new Set<string>();
  for (const rule of SKR03_ANLAGEN_MAPPING) {
    if (n >= rule.from && n <= rule.to) {
      set.add(`${rule.anlage}:${rule.feld}`);
    }
  }
  return [...set].sort();
}

/**
 * Alle möglichen Tag-Strings, die `tagsForKonto` jemals liefern kann.
 * Nützlich für UI-Multi-Select und Coverage-Checks.
 */
export function allPossibleTags(): string[] {
  const set = new Set<string>();
  for (const rule of SKR03_ANLAGEN_MAPPING) {
    set.add(`${rule.anlage}:${rule.feld}`);
  }
  return [...set].sort();
}
