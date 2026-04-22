/**
 * HGB § 275 Abs. 2 — Gliederung der Gewinn- und Verlustrechnung
 * nach dem Gesamtkostenverfahren (GKV).
 *
 * Reference-Codes folgen der amtlichen Nummerierung (1, 2, … 17).
 * Sub-Posten (5.a, 5.b, 6.a, 6.b, 7.a, 7.b) sind nach § 265 Abs. 2
 * optional — für KLEIN-Abschluss (§ 267 Abs. 1) zusammengefasst darstellbar.
 *
 * Computed/Virtual-Zeilen (nicht im Gesetzestext direkt, aber als
 * Zwischensummen in der Praxis üblich):
 *   BETRIEBSERG  = Posten 1-4 minus 5-8 (Betriebsergebnis)
 *   FINANZERG    = Posten 9-11 minus 12-13 (Finanzergebnis)
 *   VOR_STEUERN  = BETRIEBSERG + FINANZERG (Ergebnis vor Steuern)
 *   15           = VOR_STEUERN minus 14 (Ergebnis nach Steuern)
 *   17           = 15 minus 16 (Jahresüberschuss / Jahresfehlbetrag)
 */

import type { NormalSide, SizeClass } from "./hgb266Structure";

export type GuvLineKind =
  | "POST" // normal GuV-Posten (Ertrag/Aufwand)
  | "SUBTOTAL" // Zwischensumme (computed, not in official numbering)
  | "FINAL"; // Jahresergebnis (Posten 17)

export type GuvLineDef = {
  /** z. B. "1", "5.a", "15", "BETRIEBSERG", "17" */
  reference_code: string;
  /** Deutscher Name wortgleich HGB */
  name_de: string;
  /** Kurz-Label für schmale Spalten */
  short_label?: string;
  /** Vorzeichen-Seite (Erträge: HABEN, Aufwände: SOLL). Bei SUBTOTAL/FINAL bedeutet
   *  HABEN: "Überschuss positiv", SOLL ist hier nicht zulässig. */
  normal_side: NormalSide;
  /** Art der Zeile (bestimmt ob aus Konten aggregiert oder errechnet) */
  kind: GuvLineKind;
  /** Elternknoten-Ref (für Sub-Posten). */
  parent?: string;
  /** Reihenfolge innerhalb des Elternknoten (für Root-Nodes global) */
  sort_order: number;
  /** HGB-Fundstelle */
  hgb_paragraph: string;
  /** Grössenklasse ab der die Zeile standardmäßig sichtbar ist. KLEIN bricht
   *  Sub-Posten auf die Eltern-Zeile herunter. */
  size_class: SizeClass;
  /** Für SUBTOTAL/FINAL-Zeilen: Formel-Metadaten (zur UI-Darstellung). */
  formula?: string;
};

// ---------- Haupt-Struktur nach § 275 Abs. 2 HGB ---------------------

export const HGB_275_GKV_STRUCTURE: GuvLineDef[] = [
  // 1. Umsatzerlöse
  {
    reference_code: "1",
    name_de: "Umsatzerlöse",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 1,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 1 HGB",
    size_class: "ALL",
  },
  // 2. Erhöhung/Verminderung des Bestands an fertigen/unfertigen Erzeugnissen
  {
    reference_code: "2",
    name_de:
      "Erhöhung oder Verminderung des Bestands an fertigen und unfertigen Erzeugnissen",
    short_label: "Bestandsveränderungen",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 2,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 2 HGB",
    size_class: "ALL",
  },
  // 3. andere aktivierte Eigenleistungen
  {
    reference_code: "3",
    name_de: "Andere aktivierte Eigenleistungen",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 3,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 3 HGB",
    size_class: "ALL",
  },
  // 4. sonstige betriebliche Erträge
  {
    reference_code: "4",
    name_de: "Sonstige betriebliche Erträge",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 4,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 4 HGB",
    size_class: "ALL",
  },
  // 5. Materialaufwand (Summe)
  {
    reference_code: "5",
    name_de: "Materialaufwand",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 5,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 5 HGB",
    size_class: "ALL",
  },
  {
    reference_code: "5.a",
    name_de:
      "Aufwendungen für Roh-, Hilfs- und Betriebsstoffe und für bezogene Waren",
    short_label: "Roh-, Hilfs-, Betriebsstoffe",
    normal_side: "SOLL",
    kind: "POST",
    parent: "5",
    sort_order: 1,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 5a HGB",
    size_class: "MITTEL",
  },
  {
    reference_code: "5.b",
    name_de: "Aufwendungen für bezogene Leistungen",
    short_label: "Bezogene Leistungen",
    normal_side: "SOLL",
    kind: "POST",
    parent: "5",
    sort_order: 2,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 5b HGB",
    size_class: "MITTEL",
  },
  // 6. Personalaufwand (Summe)
  {
    reference_code: "6",
    name_de: "Personalaufwand",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 6,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 6 HGB",
    size_class: "ALL",
  },
  {
    reference_code: "6.a",
    name_de: "Löhne und Gehälter",
    normal_side: "SOLL",
    kind: "POST",
    parent: "6",
    sort_order: 1,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 6a HGB",
    size_class: "MITTEL",
  },
  {
    reference_code: "6.b",
    name_de:
      "Soziale Abgaben und Aufwendungen für Altersversorgung und für Unterstützung",
    short_label: "Soziale Abgaben / Altersversorgung",
    normal_side: "SOLL",
    kind: "POST",
    parent: "6",
    sort_order: 2,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 6b HGB",
    size_class: "MITTEL",
  },
  // 7. Abschreibungen (Summe)
  {
    reference_code: "7",
    name_de: "Abschreibungen",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 7,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 7 HGB",
    size_class: "ALL",
  },
  {
    reference_code: "7.a",
    name_de:
      "Abschreibungen auf immaterielle Vermögensgegenstände des Anlagevermögens und Sachanlagen",
    short_label: "AfA Anlagevermögen",
    normal_side: "SOLL",
    kind: "POST",
    parent: "7",
    sort_order: 1,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 7a HGB",
    size_class: "MITTEL",
  },
  {
    reference_code: "7.b",
    name_de:
      "Abschreibungen auf Vermögensgegenstände des Umlaufvermögens, soweit diese die in der Kapitalgesellschaft üblichen Abschreibungen überschreiten",
    short_label: "AfA Umlaufvermögen außergewöhnlich",
    normal_side: "SOLL",
    kind: "POST",
    parent: "7",
    sort_order: 2,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 7b HGB",
    size_class: "MITTEL",
  },
  // 8. sonstige betriebliche Aufwendungen
  {
    reference_code: "8",
    name_de: "Sonstige betriebliche Aufwendungen",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 8,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 8 HGB",
    size_class: "ALL",
  },
  // Zwischensumme Betriebsergebnis
  {
    reference_code: "BETRIEBSERG",
    name_de: "Betriebsergebnis",
    normal_side: "HABEN",
    kind: "SUBTOTAL",
    sort_order: 85,
    hgb_paragraph: "Zwischensumme — nicht in § 275 normiert",
    size_class: "ALL",
    formula: "1 + 2 + 3 + 4 − 5 − 6 − 7 − 8",
  },
  // 9. Erträge aus Beteiligungen
  {
    reference_code: "9",
    name_de: "Erträge aus Beteiligungen",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 9,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 9 HGB",
    size_class: "ALL",
  },
  // 10. Erträge aus anderen Wertpapieren und Ausleihungen des Finanzanlagevermögens
  {
    reference_code: "10",
    name_de:
      "Erträge aus anderen Wertpapieren und Ausleihungen des Finanzanlagevermögens",
    short_label: "Erträge aus Wertpapieren / Ausleihungen",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 10,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 10 HGB",
    size_class: "ALL",
  },
  // 11. sonstige Zinsen und ähnliche Erträge
  {
    reference_code: "11",
    name_de: "Sonstige Zinsen und ähnliche Erträge",
    normal_side: "HABEN",
    kind: "POST",
    sort_order: 11,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 11 HGB",
    size_class: "ALL",
  },
  // 12. Abschreibungen auf Finanzanlagen und auf Wertpapiere des UV
  {
    reference_code: "12",
    name_de:
      "Abschreibungen auf Finanzanlagen und auf Wertpapiere des Umlaufvermögens",
    short_label: "AfA Finanzanlagen",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 12,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 12 HGB",
    size_class: "ALL",
  },
  // 13. Zinsen und ähnliche Aufwendungen
  {
    reference_code: "13",
    name_de: "Zinsen und ähnliche Aufwendungen",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 13,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 13 HGB",
    size_class: "ALL",
  },
  // Zwischensumme Finanzergebnis
  {
    reference_code: "FINANZERG",
    name_de: "Finanzergebnis",
    normal_side: "HABEN",
    kind: "SUBTOTAL",
    sort_order: 135,
    hgb_paragraph: "Zwischensumme — nicht in § 275 normiert",
    size_class: "ALL",
    formula: "9 + 10 + 11 − 12 − 13",
  },
  // Zwischensumme Ergebnis vor Steuern
  {
    reference_code: "VOR_STEUERN",
    name_de: "Ergebnis vor Steuern",
    normal_side: "HABEN",
    kind: "SUBTOTAL",
    sort_order: 137,
    hgb_paragraph: "Zwischensumme — nicht in § 275 normiert",
    size_class: "ALL",
    formula: "Betriebsergebnis + Finanzergebnis",
  },
  // 14. Steuern vom Einkommen und vom Ertrag
  {
    reference_code: "14",
    name_de: "Steuern vom Einkommen und vom Ertrag",
    short_label: "Ertragsteuern",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 14,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 14 HGB",
    size_class: "ALL",
  },
  // 15. Ergebnis nach Steuern (computed)
  {
    reference_code: "15",
    name_de: "Ergebnis nach Steuern",
    normal_side: "HABEN",
    kind: "SUBTOTAL",
    sort_order: 15,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 15 HGB",
    size_class: "ALL",
    formula: "(Ergebnis vor Steuern) − 14",
  },
  // 16. sonstige Steuern
  {
    reference_code: "16",
    name_de: "Sonstige Steuern",
    normal_side: "SOLL",
    kind: "POST",
    sort_order: 16,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 16 HGB",
    size_class: "ALL",
  },
  // 17. Jahresüberschuss / Jahresfehlbetrag (final)
  {
    reference_code: "17",
    name_de: "Jahresüberschuss / Jahresfehlbetrag",
    normal_side: "HABEN",
    kind: "FINAL",
    sort_order: 17,
    hgb_paragraph: "§ 275 Abs. 2 Nr. 17 HGB",
    size_class: "ALL",
    formula: "15 − 16",
  },
];

export const HGB_275_GKV_BY_REF = new Map<string, GuvLineDef>(
  HGB_275_GKV_STRUCTURE.map((l) => [l.reference_code, l])
);

/** Sichtbarkeit nach § 267 Grössenklasse. KLEIN blendet Sub-Posten aus
 *  (werden in Parent aggregiert dargestellt). */
export function guvVisibleForSizeClass(
  def: GuvLineDef,
  size: SizeClass
): boolean {
  if (size === "ALL" || size === "GROSS") return true;
  if (def.size_class === "ALL") return true;
  if (def.size_class === "KLEIN") return true;
  if (def.size_class === "MITTEL") return size !== "KLEIN";
  return false;
}
