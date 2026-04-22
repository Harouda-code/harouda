/**
 * SV-Completeness-Helpers (Sprint 18 / Schritt 3).
 *
 * Prueft, ob ein Employee- bzw. Client-Record alle Pflicht-Stammdaten
 * fuer die SV-Meldungen (DEUeV) gesetzt hat. Wird von:
 *   - Employee-Listen-Page (Badge "SV-Status")
 *   - SvDataIncompleteBanner (Warn oberhalb des Forms)
 *   - SvMeldungenPage-Preflight-Dialog
 *   - SvMeldungBuilder (Merge-Logik + Fehler-Ueberschriften)
 * konsumiert.
 *
 * Rechtsbasis:
 *   § 28a Abs. 3 SGB IV — Meldepflicht-Felder.
 *   BA-Taetigkeitsschluesselverzeichnis 2010.
 *   DEUeV-Gemeinsame-Grundsaetze — Arbeitgeber-Anschrift.
 *
 * Konvention: "complete" meint ausschliesslich die Pflichtfelder aus
 * Migration 0032 / 0033. `mehrfachbeschaeftigung` hat DB-Default `false`
 * und gilt daher nicht als fehlend, auch wenn `null` zurueckkommt
 * (der DB-Default greift spaetestens beim Lesen; wir behandeln
 * `null | undefined | false` als valid).
 */
import type { Client, Employee } from "../../types/db";

/** Pflichtfelder fuer DEUeV-Meldungen (pro Employee). */
export const EMPLOYEE_SV_REQUIRED_FIELDS: Array<keyof Employee> = [
  "sv_nummer",
  "staatsangehoerigkeit",
  "taetigkeitsschluessel",
  "einzugsstelle_bbnr",
  "anschrift_strasse",
  "anschrift_hausnummer",
  "anschrift_plz",
  "anschrift_ort",
];

/** Pflichtfelder fuer Arbeitgeber-Anschrift (pro Client). */
export const CLIENT_ANSCHRIFT_REQUIRED_FIELDS: Array<keyof Client> = [
  "anschrift_strasse",
  "anschrift_hausnummer",
  "anschrift_plz",
  "anschrift_ort",
];

export type CompletenessCheck<T> = {
  complete: boolean;
  missing: Array<keyof T>;
};

function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function isEmployeeSvDataComplete(
  e: Employee
): CompletenessCheck<Employee> {
  const missing: Array<keyof Employee> = [];
  for (const f of EMPLOYEE_SV_REQUIRED_FIELDS) {
    if (!isFieldFilled(e[f])) missing.push(f);
  }
  return { complete: missing.length === 0, missing };
}

export function isClientAnschriftComplete(
  c: Client
): CompletenessCheck<Client> {
  const missing: Array<keyof Client> = [];
  for (const f of CLIENT_ANSCHRIFT_REQUIRED_FIELDS) {
    if (!isFieldFilled(c[f])) missing.push(f);
  }
  return { complete: missing.length === 0, missing };
}

/** Menschenlesbare Labels pro Pflichtfeld (fuer UI-Listen). */
export const EMPLOYEE_SV_FIELD_LABELS: Record<string, string> = {
  sv_nummer: "SV-Nummer",
  staatsangehoerigkeit: "Staatsangehörigkeit",
  taetigkeitsschluessel: "Tätigkeitsschlüssel (9-stellig)",
  einzugsstelle_bbnr: "Einzugsstelle BBNR (8-stellig)",
  anschrift_strasse: "Straße",
  anschrift_hausnummer: "Hausnummer",
  anschrift_plz: "PLZ",
  anschrift_ort: "Ort",
};

export const CLIENT_ANSCHRIFT_FIELD_LABELS: Record<string, string> = {
  anschrift_strasse: "Straße (Arbeitgeber)",
  anschrift_hausnummer: "Hausnummer (Arbeitgeber)",
  anschrift_plz: "PLZ (Arbeitgeber)",
  anschrift_ort: "Ort (Arbeitgeber)",
};

export function formatMissingFields<T>(
  missing: Array<keyof T>,
  labels: Record<string, string>
): string {
  return missing.map((f) => labels[f as string] ?? String(f)).join(", ");
}
