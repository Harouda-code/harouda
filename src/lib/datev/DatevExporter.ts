/**
 * DATEV Buchungsstapel-Export (EXTF 510 / Kategorie 21).
 *
 * Verwendung:
 *   const csv = exportBuchungsstapel({ mandantNr, ... });
 *   downloadDatevCsv(csv, filename);
 *
 * Erzeugt:
 *   - Zeile 1: EXTF-Header mit Metadaten
 *   - Zeile 2: Spaltenköpfe (deutsch)
 *   - Zeile 3+: Buchungszeilen
 *
 * Encoding: Die erzeugte Zeichenkette ist UTF-16 (JavaScript-Standard). Für
 * produktiven DATEV-Import muss sie als ISO-8859-1 kodiert abgespeichert
 * werden — siehe `toLatin1Bytes()` und `downloadDatevCsv()` im UI-Adapter.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../money/Money";
import {
  DATEV_FORMAT,
  DATEV_COLUMN_HEADERS,
  DATEV_TOTAL_COLUMNS,
  datevTextField,
  datevDecimal,
  datevDateShort,
  datevDateLong,
  datevHeaderTimestamp,
  buSchluesselForUstSatz,
} from "./datevFormat";

export type DatevExportOptions = {
  mandantNr: number;
  beraterNr: number;
  kanzleiName: string;
  wirtschaftsjahr: number;
  zeitraum: { von: string; bis: string };
  entries: JournalEntry[];
  accounts: Account[];
  /** Optionale Einschränkung: nur diese Konten exportieren. */
  kontoFilter?: string[];
  /** Bezeichnung des Stapels (max. 30 Zeichen). */
  bezeichnung?: string;
  /** Fester Zeitstempel (nur für Tests — ansonsten new Date()). */
  now?: Date;
};

export type DatevExportValidation = {
  totalSoll: string;
  totalHaben: string;
  balanced: boolean;
  outOfRange: number;
  duplicateBelege: number;
  unknownKonten: number;
  entryCount: number;
  warnings: string[];
};

/** Baut den EXTF-Header (Zeile 1). */
function buildHeader(opts: DatevExportOptions): string {
  const timestamp = datevHeaderTimestamp(opts.now);
  // EXTF-Header — 29+ Felder; wir füllen die gängigen mit sinnvollen Werten,
  // optionale Felder bleiben leer. Das ist ausreichend für einen Import-
  // Testlauf in DATEV Unternehmen online.
  const fields: (string | number)[] = [
    '"EXTF"', // 1 format
    DATEV_FORMAT.VERSION, // 2 version
    DATEV_FORMAT.CATEGORY_BUCHUNGSSTAPEL, // 3 category
    `"${DATEV_FORMAT.CATEGORY_NAME}"`, // 4 name
    DATEV_FORMAT.FORMAT_CATEGORY_VERSION, // 5 format-category-version
    timestamp, // 6 creation-timestamp
    "", // 7 imported bool (leer)
    '"RE"', // 8 Herkunft — "Rechnungswesen"
    '""', // 9 exportiert-von
    '""', // 10 importiert-von
    opts.beraterNr, // 11 Berater-Nr
    opts.mandantNr, // 12 Mandanten-Nr
    datevDateLong(`${opts.wirtschaftsjahr}-01-01`), // 13 WJ-Beginn YYYYMMDD
    DATEV_FORMAT.SACHKONTENLAENGE_SKR03, // 14 Sachkontenlänge
    datevDateLong(opts.zeitraum.von), // 15 Datum Von
    datevDateLong(opts.zeitraum.bis), // 16 Datum Bis
    datevTextField(
      opts.bezeichnung ?? `Buchungsstapel ${opts.zeitraum.von}`,
      30
    ), // 17 Bezeichnung
    '""', // 18 Diktatkürzel
    1, // 19 Buchungstyp (1=Finanzbuchführung)
    0, // 20 Rechnungslegungszweck
    0, // 21 Festschreibung (0=nicht festgeschrieben)
    `"${DATEV_FORMAT.WKZ_DEFAULT}"`, // 22 WKZ
    '""', // 23 Derivatskennzeichen
    '""', // 24 Rechtseinheit
    '""', // 25 Skonto-Sperre
    '""', // 26 KZ-Umsatz
    '""', // 27 Kennzeichen
    '""', // 28 Fest-Zuordnung
    `"${opts.kanzleiName.slice(0, 30).replace(/"/g, '""')}"`, // 29 Sachbearbeiter
  ];
  return fields.join(DATEV_FORMAT.SEPARATOR);
}

/** Baut die Spaltenkopf-Zeile (Zeile 2). */
function buildColumnHeaderLine(): string {
  const quoted = DATEV_COLUMN_HEADERS.map((h) => `"${h}"`);
  return quoted.join(DATEV_FORMAT.SEPARATOR);
}

/** Konvertiert eine Journal-Buchung in eine DATEV-Zeile. */
function buildEntryLine(entry: JournalEntry, accounts: Account[]): string {
  const sollAcc = accounts.find((a) => a.konto_nr === entry.soll_konto);
  const betrag = Money.zero().plus(
    new Money(Number.isFinite(entry.betrag) ? entry.betrag : 0)
  );
  const ustSatz = sollAcc?.ust_satz ?? null;
  const bu = buSchluesselForUstSatz(ustSatz);

  // Soll/Haben-Kennzeichen: Standardmäßig "S" (Betrag auf Soll-Konto).
  // Vorzeichen sind bei DATEV immer positiv; Richtung über S/H-Flag.
  const fields: string[] = [
    datevDecimal(betrag.toFixed2()), // 1 Umsatz
    '"S"', // 2 S/H
    `"${DATEV_FORMAT.WKZ_DEFAULT}"`, // 3 WKZ
    "", // 4 Kurs
    "", // 5 Basis-Umsatz
    "", // 6 WKZ Basis-Umsatz
    entry.soll_konto, // 7 Konto (Soll)
    entry.haben_konto, // 8 Gegenkonto (Haben)
    bu, // 9 BU-Schlüssel
    datevDateShort(entry.datum), // 10 Belegdatum TTMM
    datevTextField(entry.beleg_nr, 12), // 11 Belegfeld 1
    '""', // 12 Belegfeld 2
    "", // 13 Skonto
    datevTextField(entry.beschreibung, 60), // 14 Buchungstext
  ];
  // Pad auf DATEV_TOTAL_COLUMNS (optional — aktuell = Anzahl Pflichtspalten)
  while (fields.length < DATEV_TOTAL_COLUMNS) fields.push("");
  return fields.join(DATEV_FORMAT.SEPARATOR);
}

/** Haupt-Export-Funktion. Erzeugt den kompletten CSV-Inhalt als String. */
export function exportBuchungsstapel(opts: DatevExportOptions): string {
  const lines: string[] = [];
  lines.push(buildHeader(opts));
  lines.push(buildColumnHeaderLine());

  const filtered = opts.entries.filter((e) => {
    if (e.status !== "gebucht") return false;
    if (e.datum < opts.zeitraum.von || e.datum > opts.zeitraum.bis) return false;
    if (opts.kontoFilter && opts.kontoFilter.length > 0) {
      return (
        opts.kontoFilter.includes(e.soll_konto) ||
        opts.kontoFilter.includes(e.haben_konto)
      );
    }
    return true;
  });

  for (const e of filtered) {
    lines.push(buildEntryLine(e, opts.accounts));
  }
  return lines.join(DATEV_FORMAT.LINE_ENDING) + DATEV_FORMAT.LINE_ENDING;
}

/** Validierung ohne Export — für Preview im UI. */
export function validateBuchungsstapel(
  opts: DatevExportOptions
): DatevExportValidation {
  const accountSet = new Set(opts.accounts.map((a) => a.konto_nr));
  const belegSeen = new Map<string, number>();
  const warnings: string[] = [];

  let totalSoll = Money.zero();
  let totalHaben = Money.zero();
  let outOfRange = 0;
  let unknownKonten = 0;
  let entryCount = 0;

  for (const e of opts.entries) {
    if (e.status !== "gebucht") continue;
    if (e.datum < opts.zeitraum.von || e.datum > opts.zeitraum.bis) {
      outOfRange++;
      continue;
    }
    if (!accountSet.has(e.soll_konto) || !accountSet.has(e.haben_konto)) {
      unknownKonten++;
    }
    const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
    totalSoll = totalSoll.plus(betrag);
    totalHaben = totalHaben.plus(betrag);
    belegSeen.set(e.beleg_nr, (belegSeen.get(e.beleg_nr) ?? 0) + 1);
    entryCount++;
  }

  let duplicateBelege = 0;
  for (const [, count] of belegSeen) {
    if (count > 1) duplicateBelege++;
  }

  if (duplicateBelege > 0) {
    warnings.push(
      `${duplicateBelege} Belegnummer(n) sind mehrfach belegt — DATEV empfiehlt eindeutige Nummern.`
    );
  }
  if (unknownKonten > 0) {
    warnings.push(
      `${unknownKonten} Buchung(en) referenzieren Konten, die nicht in der Kontenliste stehen.`
    );
  }
  if (outOfRange > 0) {
    warnings.push(
      `${outOfRange} Buchung(en) liegen außerhalb des gewählten Zeitraums und werden nicht exportiert.`
    );
  }

  return {
    totalSoll: totalSoll.toFixed2(),
    totalHaben: totalHaben.toFixed2(),
    balanced: totalSoll.equals(totalHaben),
    outOfRange,
    duplicateBelege,
    unknownKonten,
    entryCount,
    warnings,
  };
}

/** Standard-Dateiname gemäß DATEV-Konvention. */
export function datevFilename(opts: {
  mandantNr: number;
  zeitraum: { von: string; bis: string };
}): string {
  const strip = (s: string) => s.replace(/-/g, "");
  return `DTVF_${opts.mandantNr}_${strip(opts.zeitraum.von)}_${strip(opts.zeitraum.bis)}.csv`;
}
