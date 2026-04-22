/**
 * DATEV LODAS Buchungsstapel-Format (Lohn + Gehalt).
 *
 * WICHTIG — Nachgebildetes Format:
 *   LODAS ist DATEVs Lohn-Schnittstelle. Die hier implementierte Variante
 *   folgt einer vereinfachten Form des DATEV-"Import online"-Buchungsstapels
 *   (EXTF-Basis) mit Lohn-spezifischen Spalten (Personalnummer, Lohnart,
 *   Abrechnungsmonat). Für produktiven LODAS-Import in die DATEV-Lohnsoftware
 *   ist ein zertifiziertes LODAS-Format-Dokument zu verwenden; diese
 *   Implementation eignet sich primär für den Buchungsstapel-Import der
 *   Gehaltsaufwendungen in die Finanzbuchhaltung (Unternehmen online).
 *
 * Format-Grundlage: EXTF 510 / Kategorie 21 (Buchungsstapel).
 *   - ISO-8859-1 (via toLatin1Bytes)
 *   - Semikolon-Separator
 *   - CRLF Zeilenenden
 *   - Komma-Dezimal
 *   - Datum TTMM im Datensatz, YYYYMMDD im Header
 */

export const LODAS_FORMAT = {
  VERSION: 510 as const,
  CATEGORY_BUCHUNGSSTAPEL: 21 as const,
  CATEGORY_NAME: "Buchungsstapel" as const,
  FORMAT_CATEGORY_VERSION: 7 as const,
  SEPARATOR: ";" as const,
  LINE_ENDING: "\r\n" as const,
  WKZ_DEFAULT: "EUR" as const,
  SACHKONTENLAENGE_SKR03: 4 as const,
  BELEGART_LOHN: "LA" as const,
};

/** Zusätzliche Lohn-Spaltenköpfe (Extension über die 14 EXTF-Standardfelder hinaus). */
export const LODAS_COLUMN_HEADERS = [
  "Umsatz (ohne Soll/Haben-Kz)",
  "Soll/Haben-Kennzeichen",
  "WKZ Umsatz",
  "Kurs",
  "Basis-Umsatz",
  "WKZ Basis-Umsatz",
  "Konto",
  "Gegenkonto (ohne BU-Schlüssel)",
  "BU-Schlüssel",
  "Belegdatum",
  "Belegfeld 1",
  "Belegfeld 2",
  "Skonto",
  "Buchungstext",
  // Lohn-spezifisch
  "Personalnummer",
  "Lohnart-Code",
  "Abrechnungsmonat",
] as const;

/** SKR03-Konten für Lohn-Buchungen (Standard, vom Anwender überschreibbar). */
export const SKR03_LOHN_KONTEN = {
  /** Brutto-Löhne (SOLL-Konto Aufwand). */
  bruttoLohnAufwand: "4100",
  /** Gehälter (SOLL-Konto Aufwand). */
  bruttoGehaltAufwand: "4120",
  /** Arbeitgeber-Anteil zur SV (SOLL-Konto Aufwand). */
  sozialaufwandAg: "4138",
  /** Lohnsteuer-Verbindlichkeit (HABEN). */
  verbindlichkeitLst: "1741",
  /** Solidaritätszuschlag-Verbindlichkeit (HABEN). */
  verbindlichkeitSoli: "1756",
  /** Kirchensteuer-Verbindlichkeit (HABEN). */
  verbindlichkeitKist: "1755",
  /** SV-Verbindlichkeiten (HABEN). */
  verbindlichkeitSv: "1742",
  /** Verrechnungskonto Netto-Lohn (HABEN). */
  verrechnungNettoLohn: "3740",
  /** Bank (HABEN, bei Auszahlung). */
  bank: "1200",
};

export type DatevLodasKonten = typeof SKR03_LOHN_KONTEN;
