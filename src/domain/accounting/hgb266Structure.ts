/**
 * HGB § 266 Abs. 2 (AKTIVA) und Abs. 3 (PASSIVA) Bilanz-Gliederung.
 *
 * Die Struktur ist statisch (keine mandantenspezifische Anpassung im ersten
 * Wurf). Reference-Codes folgen der amtlichen Buchstaben-Nummer-Notation
 * (A, A.I, A.I.1 ...). Die Tiefe beträgt max. 3.
 *
 * HGB § 267 Grössenklassen steuern welche Zeilen angezeigt werden:
 *   KLEIN  → nur Buchstaben + römische Ziffern (Abs. 1 Satz 3)
 *   MITTEL → bis zur 2. Ebene (inkl. arabische Ziffern)
 *   GROSS  → volle Tiefe
 */

export type BalanceType = "AKTIVA" | "PASSIVA" | "ERTRAG" | "AUFWAND";
export type NormalSide = "SOLL" | "HABEN";
export type SizeClass = "KLEIN" | "MITTEL" | "GROSS" | "ALL";

export type ReportLineDef = {
  /** z. B. "A.I.1" */
  reference_code: string;
  /** deutscher Name wortgleich HGB */
  name_de: string;
  /** Kurz-Label für die Bilanzansicht */
  short_label?: string;
  balance_type: BalanceType;
  normal_side: NormalSide;
  /** elternknoten-Referenzcode, null für root (A, B, ..., E) */
  parent?: string;
  /** Reihenfolge innerhalb des Elternknoten */
  sort_order: number;
  /** HGB-Fundstelle */
  hgb_paragraph: string;
  /** Grössenklasse ab der diese Zeile sichtbar ist */
  size_class: SizeClass;
  /** true = virtuelle Zeile (Jahresüberschuss vorläufig) */
  is_virtual?: boolean;
};

// ---------- AKTIVA § 266 Abs. 2 ----------------------------------------

const AKTIVA: ReportLineDef[] = [
  // A. Anlagevermögen
  {
    reference_code: "A",
    name_de: "Anlagevermögen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 A",
    size_class: "ALL",
  },
  {
    reference_code: "A.I",
    name_de: "Immaterielle Vermögensgegenstände",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 A.I",
    size_class: "ALL",
  },
  {
    reference_code: "A.I.1",
    name_de: "Selbst geschaffene gewerbliche Schutzrechte und ähnliche Rechte und Werte",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.I",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 A.I.1",
    size_class: "GROSS",
  },
  {
    reference_code: "A.I.2",
    name_de: "Entgeltlich erworbene Konzessionen, gewerbliche Schutzrechte und ähnliche Rechte und Werte sowie Lizenzen an solchen Rechten und Werten",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.I",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 A.I.2",
    size_class: "GROSS",
  },
  {
    reference_code: "A.I.3",
    name_de: "Geschäfts- oder Firmenwert",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.I",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 A.I.3",
    size_class: "GROSS",
  },
  {
    reference_code: "A.I.4",
    name_de: "Geleistete Anzahlungen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.I",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 A.I.4",
    size_class: "GROSS",
  },
  {
    reference_code: "A.II",
    name_de: "Sachanlagen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 A.II",
    size_class: "ALL",
  },
  {
    reference_code: "A.II.1",
    name_de: "Grundstücke, grundstücksgleiche Rechte und Bauten einschließlich der Bauten auf fremden Grundstücken",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.II",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 A.II.1",
    size_class: "GROSS",
  },
  {
    reference_code: "A.II.2",
    name_de: "Technische Anlagen und Maschinen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.II",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 A.II.2",
    size_class: "GROSS",
  },
  {
    reference_code: "A.II.3",
    name_de: "Andere Anlagen, Betriebs- und Geschäftsausstattung",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.II",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 A.II.3",
    size_class: "GROSS",
  },
  {
    reference_code: "A.II.4",
    name_de: "Geleistete Anzahlungen und Anlagen im Bau",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.II",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 A.II.4",
    size_class: "GROSS",
  },
  {
    reference_code: "A.III",
    name_de: "Finanzanlagen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 A.III",
    size_class: "ALL",
  },
  {
    reference_code: "A.III.1",
    name_de: "Anteile an verbundenen Unternehmen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.III",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 A.III.1",
    size_class: "GROSS",
  },
  {
    reference_code: "A.III.2",
    name_de: "Ausleihungen an verbundene Unternehmen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.III",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 A.III.2",
    size_class: "GROSS",
  },
  {
    reference_code: "A.III.3",
    name_de: "Beteiligungen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.III",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 A.III.3",
    size_class: "GROSS",
  },
  {
    reference_code: "A.III.4",
    name_de: "Ausleihungen an Unternehmen mit Beteiligungsverhältnis",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.III",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 A.III.4",
    size_class: "GROSS",
  },
  {
    reference_code: "A.III.5",
    name_de: "Wertpapiere des Anlagevermögens",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.III",
    sort_order: 5,
    hgb_paragraph: "§ 266 Abs. 2 A.III.5",
    size_class: "GROSS",
  },
  {
    reference_code: "A.III.6",
    name_de: "Sonstige Ausleihungen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "A.III",
    sort_order: 6,
    hgb_paragraph: "§ 266 Abs. 2 A.III.6",
    size_class: "GROSS",
  },

  // B. Umlaufvermögen
  {
    reference_code: "B",
    name_de: "Umlaufvermögen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 B",
    size_class: "ALL",
  },
  {
    reference_code: "B.I",
    name_de: "Vorräte",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 B.I",
    size_class: "ALL",
  },
  {
    reference_code: "B.I.1",
    name_de: "Roh-, Hilfs- und Betriebsstoffe",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.I",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 B.I.1",
    size_class: "GROSS",
  },
  {
    reference_code: "B.I.2",
    name_de: "Unfertige Erzeugnisse, unfertige Leistungen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.I",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 B.I.2",
    size_class: "GROSS",
  },
  {
    reference_code: "B.I.3",
    name_de: "Fertige Erzeugnisse und Waren",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.I",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 B.I.3",
    size_class: "GROSS",
  },
  {
    reference_code: "B.I.4",
    name_de: "Geleistete Anzahlungen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.I",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 B.I.4",
    size_class: "GROSS",
  },
  {
    reference_code: "B.II",
    name_de: "Forderungen und sonstige Vermögensgegenstände",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 B.II",
    size_class: "ALL",
  },
  {
    reference_code: "B.II.1",
    name_de: "Forderungen aus Lieferungen und Leistungen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.II",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 2 B.II.1",
    size_class: "GROSS",
  },
  {
    reference_code: "B.II.2",
    name_de: "Forderungen gegen verbundene Unternehmen",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.II",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 2 B.II.2",
    size_class: "GROSS",
  },
  {
    reference_code: "B.II.3",
    name_de: "Forderungen gegen Unternehmen mit Beteiligungsverhältnis",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.II",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 B.II.3",
    size_class: "GROSS",
  },
  {
    reference_code: "B.II.4",
    name_de: "Sonstige Vermögensgegenstände",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B.II",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 B.II.4",
    size_class: "GROSS",
  },
  {
    reference_code: "B.III",
    name_de: "Wertpapiere",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 B.III",
    size_class: "ALL",
  },
  {
    reference_code: "B.IV",
    name_de: "Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten und Schecks",
    short_label: "Kasse, Bank",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    parent: "B",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 B.IV",
    size_class: "ALL",
  },

  // C. Rechnungsabgrenzungsposten
  {
    reference_code: "C",
    name_de: "Rechnungsabgrenzungsposten",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 2 C",
    size_class: "ALL",
  },
  // D. Aktive latente Steuern
  {
    reference_code: "D",
    name_de: "Aktive latente Steuern",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 2 D",
    size_class: "MITTEL",
  },
  // E. Aktiver Unterschiedsbetrag aus der Vermögensverrechnung
  {
    reference_code: "E",
    name_de: "Aktiver Unterschiedsbetrag aus der Vermögensverrechnung",
    balance_type: "AKTIVA",
    normal_side: "SOLL",
    sort_order: 5,
    hgb_paragraph: "§ 266 Abs. 2 E",
    size_class: "GROSS",
  },
];

// ---------- PASSIVA § 266 Abs. 3 ---------------------------------------

const PASSIVA: ReportLineDef[] = [
  // A. Eigenkapital
  {
    reference_code: "P.A",
    name_de: "Eigenkapital",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 3 A",
    size_class: "ALL",
  },
  {
    reference_code: "P.A.I",
    name_de: "Gezeichnetes Kapital",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.A",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 3 A.I",
    size_class: "ALL",
  },
  {
    reference_code: "P.A.II",
    name_de: "Kapitalrücklage",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.A",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 3 A.II",
    size_class: "ALL",
  },
  {
    reference_code: "P.A.III",
    name_de: "Gewinnrücklagen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.A",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 3 A.III",
    size_class: "ALL",
  },
  {
    reference_code: "P.A.IV",
    name_de: "Gewinnvortrag / Verlustvortrag",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.A",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 3 A.IV",
    size_class: "ALL",
  },
  {
    reference_code: "P.A.V",
    name_de: "Jahresüberschuss / Jahresfehlbetrag (vorläufig)",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.A",
    sort_order: 5,
    hgb_paragraph: "§ 266 Abs. 3 A.V · § 268 Abs. 1 HGB",
    size_class: "ALL",
    is_virtual: true,
  },

  // B. Rückstellungen
  {
    reference_code: "P.B",
    name_de: "Rückstellungen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 3 B",
    size_class: "ALL",
  },
  {
    reference_code: "P.B.1",
    name_de: "Rückstellungen für Pensionen und ähnliche Verpflichtungen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.B",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 3 B.1",
    size_class: "GROSS",
  },
  {
    reference_code: "P.B.2",
    name_de: "Steuerrückstellungen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.B",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 3 B.2",
    size_class: "GROSS",
  },
  {
    reference_code: "P.B.3",
    name_de: "Sonstige Rückstellungen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.B",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 3 B.3",
    size_class: "GROSS",
  },

  // C. Verbindlichkeiten
  {
    reference_code: "P.C",
    name_de: "Verbindlichkeiten",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 3 C",
    size_class: "ALL",
  },
  {
    reference_code: "P.C.1",
    name_de: "Anleihen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 1,
    hgb_paragraph: "§ 266 Abs. 3 C.1",
    size_class: "GROSS",
  },
  {
    reference_code: "P.C.2",
    name_de: "Verbindlichkeiten gegenüber Kreditinstituten",
    short_label: "Bank-Verb.",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 2,
    hgb_paragraph: "§ 266 Abs. 3 C.2",
    size_class: "ALL",
  },
  {
    reference_code: "P.C.3",
    name_de: "Erhaltene Anzahlungen auf Bestellungen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 3,
    hgb_paragraph: "§ 266 Abs. 3 C.3",
    size_class: "GROSS",
  },
  {
    reference_code: "P.C.4",
    name_de: "Verbindlichkeiten aus Lieferungen und Leistungen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 3 C.4",
    size_class: "ALL",
  },
  {
    reference_code: "P.C.5",
    name_de: "Verbindlichkeiten aus der Annahme gezogener Wechsel und der Ausstellung eigener Wechsel",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 5,
    hgb_paragraph: "§ 266 Abs. 3 C.5",
    size_class: "GROSS",
  },
  {
    reference_code: "P.C.6",
    name_de: "Verbindlichkeiten gegenüber verbundenen Unternehmen",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 6,
    hgb_paragraph: "§ 266 Abs. 3 C.6",
    size_class: "GROSS",
  },
  {
    reference_code: "P.C.7",
    name_de: "Verbindlichkeiten gegenüber Unternehmen mit Beteiligungsverhältnis",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 7,
    hgb_paragraph: "§ 266 Abs. 3 C.7",
    size_class: "GROSS",
  },
  {
    reference_code: "P.C.8",
    name_de: "Sonstige Verbindlichkeiten",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    parent: "P.C",
    sort_order: 8,
    hgb_paragraph: "§ 266 Abs. 3 C.8",
    size_class: "ALL",
  },

  // D. Rechnungsabgrenzungsposten
  {
    reference_code: "P.D",
    name_de: "Rechnungsabgrenzungsposten",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    sort_order: 4,
    hgb_paragraph: "§ 266 Abs. 3 D",
    size_class: "ALL",
  },
  // E. Passive latente Steuern
  {
    reference_code: "P.E",
    name_de: "Passive latente Steuern",
    balance_type: "PASSIVA",
    normal_side: "HABEN",
    sort_order: 5,
    hgb_paragraph: "§ 266 Abs. 3 E",
    size_class: "MITTEL",
  },
];

export const HGB_266_REPORT_LINES: ReportLineDef[] = [...AKTIVA, ...PASSIVA];

/** Sichtbarkeit einer Zeile gemäß Größenklasse (§ 267 HGB). */
export function visibleForSizeClass(
  line: ReportLineDef,
  sizeClass: SizeClass
): boolean {
  if (sizeClass === "ALL") return true;
  if (line.size_class === "ALL") return true;
  const rank: Record<Exclude<SizeClass, "ALL">, number> = {
    KLEIN: 1,
    MITTEL: 2,
    GROSS: 3,
  };
  const lineRank = rank[line.size_class as Exclude<SizeClass, "ALL">] ?? 3;
  const reqRank = rank[sizeClass as Exclude<SizeClass, "ALL">] ?? 3;
  // Eine KLEIN-Bilanz zeigt nur KLEIN-Zeilen; MITTEL zeigt KLEIN+MITTEL; GROSS zeigt alles
  return lineRank <= reqRank;
}
