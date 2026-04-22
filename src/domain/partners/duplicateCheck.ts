/**
 * Duplicate-Check fuer business_partners (Sprint 19.B).
 *
 * Hard-Blocks (liefern `hardBlocks[]`):
 *   • ust_idnr exakt
 *   • (steuernummer + finanzamt) exakt
 *   • (hrb + registergericht) exakt
 * Diese entsprechen den partiellen UNIQUE-Indizes in Migration 0035 —
 * wir pruefen application-seitig, damit die Fehlermeldung sinnvoll ist,
 * bevor die DB mit einer Constraint-Violation zurueckschlaegt.
 *
 * Soft-Warnings (liefern `softWarnings[]`):
 *   • Levenshtein-Distanz ≤ 3 auf `name` + gleiche PLZ.
 * Das ist eine heuristische Tippfehler-Erkennung; kein Block.
 */

import type { BusinessPartner } from "../../types/db";

export type DuplicateHardBlock = {
  field:
    | "ust_idnr"
    | "steuernummer_finanzamt"
    | "hrb_registergericht"
    | "debitor_nummer"
    | "kreditor_nummer";
  message: string;
  existingPartnerId: string;
};

export type DuplicateSoftWarning = {
  field: "name_plz";
  message: string;
  similarPartnerId: string;
  distance: number;
};

export type DuplicateCheckResult = {
  hardBlocks: DuplicateHardBlock[];
  softWarnings: DuplicateSoftWarning[];
};

export type DuplicateCheckInput = Partial<BusinessPartner> & {
  /**
   * Wenn der Check fuer ein UPDATE laeuft, wird die ID der bearbeiteten
   * Row hier uebergeben — sonst wuerde die Row sich selbst als Duplikat
   * ansehen.
   */
  excludePartnerId?: string;
};

// ---------------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------------

function normString(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function normUstIdnr(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.replace(/\s+/g, "").toUpperCase();
  return t.length === 0 ? null : t;
}

/**
 * Minimal-Levenshtein (iterativ, O(m·n) Zeit, O(min(m,n)) Speicher via
 * zwei Zeilen). Keine externe Dependency.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  // Ensure a is the shorter — spart Speicher.
  if (a.length > b.length) {
    const t = a;
    a = b;
    b = t;
  }
  let prev = new Array<number>(a.length + 1);
  let cur = new Array<number>(a.length + 1);
  for (let i = 0; i <= a.length; i++) prev[i] = i;
  for (let j = 1; j <= b.length; j++) {
    cur[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[i] = Math.min(
        cur[i - 1] + 1, // insertion
        prev[i] + 1, // deletion
        prev[i - 1] + cost // substitution
      );
    }
    const t = prev;
    prev = cur;
    cur = t;
  }
  return prev[a.length];
}

// ---------------------------------------------------------------------------
// Haupt-Check
// ---------------------------------------------------------------------------

export function checkDuplicates(
  input: DuplicateCheckInput,
  existing: BusinessPartner[]
): DuplicateCheckResult {
  const result: DuplicateCheckResult = {
    hardBlocks: [],
    softWarnings: [],
  };

  const inClientId = normString(input.client_id);
  if (!inClientId) return result;

  const candidates = existing.filter(
    (p) =>
      p.client_id === inClientId &&
      (!input.excludePartnerId || p.id !== input.excludePartnerId)
  );

  const inUstId = normUstIdnr(input.ust_idnr ?? null);
  const inSteuerNr = normString(input.steuernummer ?? null);
  const inFinanzamt = normString(input.finanzamt ?? null);
  const inHrb = normString(input.hrb ?? null);
  const inRegGericht = normString(input.registergericht ?? null);
  const inName = normString(input.name ?? null);
  const inPlz = normString(input.anschrift_plz ?? null);

  for (const p of candidates) {
    // Hard-Block 1: USt-IdNr.
    if (inUstId && normUstIdnr(p.ust_idnr) === inUstId) {
      result.hardBlocks.push({
        field: "ust_idnr",
        existingPartnerId: p.id,
        message: `USt-IdNr ${inUstId} ist bereits bei „${p.name}" hinterlegt.`,
      });
    }
    // Hard-Block 2: Steuernummer + Finanzamt.
    if (
      inSteuerNr &&
      inFinanzamt &&
      normString(p.steuernummer) === inSteuerNr &&
      normString(p.finanzamt) === inFinanzamt
    ) {
      result.hardBlocks.push({
        field: "steuernummer_finanzamt",
        existingPartnerId: p.id,
        message: `Steuernummer ${inSteuerNr} (Finanzamt ${inFinanzamt}) ist bereits bei „${p.name}" hinterlegt.`,
      });
    }
    // Hard-Block 3: HRB + Registergericht.
    if (
      inHrb &&
      inRegGericht &&
      normString(p.hrb) === inHrb &&
      normString(p.registergericht) === inRegGericht
    ) {
      result.hardBlocks.push({
        field: "hrb_registergericht",
        existingPartnerId: p.id,
        message: `Handelsregister-Eintrag ${inRegGericht} / ${inHrb} ist bereits bei „${p.name}" hinterlegt.`,
      });
    }
    // Hard-Block 4: debitor_nummer exakt (deckt partial unique index bp_unique_debitor_nr).
    if (
      input.debitor_nummer != null &&
      p.debitor_nummer === input.debitor_nummer
    ) {
      result.hardBlocks.push({
        field: "debitor_nummer",
        existingPartnerId: p.id,
        message: `Debitor-Nummer ${input.debitor_nummer} ist bereits vergeben an „${p.name}".`,
      });
    }
    // Hard-Block 5: kreditor_nummer exakt.
    if (
      input.kreditor_nummer != null &&
      p.kreditor_nummer === input.kreditor_nummer
    ) {
      result.hardBlocks.push({
        field: "kreditor_nummer",
        existingPartnerId: p.id,
        message: `Kreditor-Nummer ${input.kreditor_nummer} ist bereits vergeben an „${p.name}".`,
      });
    }

    // Soft-Warning: Name-Levenshtein ≤ 3 + gleiche PLZ.
    if (inName && inPlz && normString(p.anschrift_plz) === inPlz) {
      const d = levenshtein(inName.toLowerCase(), p.name.toLowerCase());
      if (d > 0 && d <= 3) {
        result.softWarnings.push({
          field: "name_plz",
          similarPartnerId: p.id,
          distance: d,
          message: `Name „${inName}" ähnelt „${p.name}" (Distanz ${d}, gleiche PLZ ${inPlz}) — bitte prüfen ob Duplikat.`,
        });
      }
    }
  }

  return result;
}
