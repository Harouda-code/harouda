/**
 * Nummern-Range-Policy fuer business_partners (Sprint 19.B).
 *
 * Entspricht den Check-Constraints bp_debitor_nummer_range und
 * bp_kreditor_nummer_range aus Migration 0035. Application-Layer prueft
 * das zusaetzlich, damit Fehler fruehzeitig mit sprechender Meldung
 * sichtbar werden (statt einer Constraint-Violation von Postgres).
 */

import type { BusinessPartnerType } from "../../types/db";

export const DEBITOR_RANGE = { start: 10000, end: 69999 } as const;
export const KREDITOR_RANGE = { start: 70000, end: 99999 } as const;

export type NummernkreisValidation = {
  valid: boolean;
  error?: string;
};

export function validateNummernkreis(
  type: "debitor" | "kreditor",
  nummer: number
): NummernkreisValidation {
  if (!Number.isInteger(nummer)) {
    return {
      valid: false,
      error: `Nummer muss ganzzahlig sein (erhalten: ${nummer}).`,
    };
  }
  const range = type === "debitor" ? DEBITOR_RANGE : KREDITOR_RANGE;
  if (nummer < range.start || nummer > range.end) {
    return {
      valid: false,
      error: `${type === "debitor" ? "Debitor" : "Kreditor"}-Nummer ${nummer} liegt außerhalb des Bereichs ${range.start}–${range.end}.`,
    };
  }
  return { valid: true };
}

/**
 * Konsistenz-Check partner_type vs. Nummern-Belegung — entspricht den
 * Check-Constraints bp_debitor_nummer_if_type und bp_kreditor_nummer_if_type
 * aus Migration 0035.
 */
export function validateTypeAndNummern(
  type: BusinessPartnerType,
  debitorNummer: number | null,
  kreditorNummer: number | null
): NummernkreisValidation {
  const needsDebitor = type === "debitor" || type === "both";
  const needsKreditor = type === "kreditor" || type === "both";

  if (needsDebitor && debitorNummer == null) {
    return {
      valid: false,
      error: `Typ „${type}" erfordert eine debitor_nummer.`,
    };
  }
  if (needsKreditor && kreditorNummer == null) {
    return {
      valid: false,
      error: `Typ „${type}" erfordert eine kreditor_nummer.`,
    };
  }
  if (debitorNummer != null) {
    const v = validateNummernkreis("debitor", debitorNummer);
    if (!v.valid) return v;
  }
  if (kreditorNummer != null) {
    const v = validateNummernkreis("kreditor", kreditorNummer);
    if (!v.valid) return v;
  }
  return { valid: true };
}
