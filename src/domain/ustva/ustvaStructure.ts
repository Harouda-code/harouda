/**
 * BMF-UStVA-Formular 2025 — Struktur aller Kennzahlen (§ 18 UStG, UStDV § 48).
 *
 * Jede Kennzahl (Kz) hat einen Typ, der das Verhalten steuert:
 *   UMSATZ_NETTO            — Bemessungsgrundlage aus Journal-Konten
 *   IG_ERWERB               — Innergemeinschaftlicher Erwerb (Bemessungsgrundlage)
 *   REVERSE_CHARGE          — Leistungen § 13b UStG (Bemessungsgrundlage)
 *   STEUERFREI_*            — Steuerfreie Umsätze (nur Meldung, kein Steuerbetrag)
 *   NICHT_STEUERBAR         — Umsätze im Ausland / nicht steuerbar
 *   STEUERBETRAG            — Auto-computed: umsatzKz × steuersatz
 *   STEUERBETRAG_AGGREGAT   — Auto-computed: Σ (from_kzs × 19%)
 *   STEUERBETRAG_MANUAL     — Vom Anwender einzutragen (nicht ableitbar)
 *   VORSTEUER / VORSTEUER_* — Aus Journal-Vorsteuer-Konten
 *   SUBTOTAL                — Σ components (z. B. UST_SUMME = Summe aller USt-Kz)
 *   FINAL_RESULT            — Zahllast/Erstattung = UST_SUMME − VST_SUMME
 *   INFO                    — Reine Info-Zeile (keine Rechnung)
 *
 * Die Kennzahl-Codes (Kz) folgen dem BMF-Vordruck 2025.
 */

export type UstvaPositionType =
  | "UMSATZ_NETTO"
  | "IG_ERWERB"
  | "REVERSE_CHARGE"
  | "STEUERFREI_IG_LIEF"
  | "STEUERFREI_IG_LIEF_FAHRZEUG"
  | "STEUERFREI_MIT_VSTAB"
  | "STEUERFREI_OHNE_VSTAB"
  | "NICHT_STEUERBAR"
  | "STEUERBETRAG"
  | "STEUERBETRAG_AGGREGAT"
  | "STEUERBETRAG_MANUAL"
  | "VORSTEUER"
  | "VORSTEUER_IG_ERWERB"
  | "VORSTEUER_EUST"
  | "VORSTEUER_13B"
  | "VORSTEUER_PAUSCHAL"
  | "VORSTEUER_BERICHTIGUNG"
  | "VORSTEUER_FAHRZEUG"
  | "SUBTOTAL"
  | "FINAL_RESULT"
  | "INFO";

export type UstvaPosition = {
  kz: string;
  name: string;
  type: UstvaPositionType;
  /** Steuersatz (0.19, 0.07, 0). Null = besondere Sätze, manuell einzugeben. */
  steuersatz?: number | null;
  /** Für STEUERBETRAG: die Bemessungsgrundlage-Kz (z. B. "81" → 81_STEUER). */
  from_kz?: string;
  /** Für STEUERBETRAG_AGGREGAT: mehrere Bemessungsgrundlage-Kz. */
  from_kzs?: string[];
  /** Für SUBTOTAL: Kz-Codes der zu summierenden Komponenten. */
  components?: string[];
  /** Abschnitt (A/B/C) gemäß BMF-Formular. */
  section: "A" | "B" | "C";
  /** UStG-Fundstelle. */
  hgb_paragraph?: string;
  /** Dokumentation der Computation-Formel. */
  computation?: string;
};

export const USTVA_STRUCTURE_2025: UstvaPosition[] = [
  // ============================================================
  // A. Lieferungen und sonstige Leistungen — Bemessungsgrundlage
  // ============================================================

  // -- Innergemeinschaftliche sonstige Leistungen (ZM-Korrespondenz)
  {
    kz: "21",
    name: "Innergemeinschaftliche sonstige Leistungen (§ 3a Abs. 2 UStG)",
    type: "STEUERFREI_MIT_VSTAB",
    steuersatz: 0,
    section: "A",
    hgb_paragraph: "§ 3a Abs. 2 UStG · ZM-Korrespondenz Kz 21",
  },
  // -- Dreiecksgeschäfte (ZM-Korrespondenz)
  {
    kz: "42",
    name: "Dreiecksgeschäfte (§ 25b UStG, mittlerer Unternehmer)",
    type: "STEUERFREI_MIT_VSTAB",
    steuersatz: 0,
    section: "A",
    hgb_paragraph: "§ 25b UStG · ZM-Korrespondenz Kz 42",
  },
  // -- Steuerpflichtige Umsätze
  {
    kz: "81",
    name: "Umsätze zum Steuersatz 19 %",
    type: "UMSATZ_NETTO",
    steuersatz: 0.19,
    section: "A",
    hgb_paragraph: "§ 12 Abs. 1 UStG",
  },
  {
    kz: "86",
    name: "Umsätze zum Steuersatz 7 %",
    type: "UMSATZ_NETTO",
    steuersatz: 0.07,
    section: "A",
    hgb_paragraph: "§ 12 Abs. 2 UStG",
  },
  {
    kz: "35",
    name: "Umsätze zu anderen Steuersätzen",
    type: "UMSATZ_NETTO",
    steuersatz: null,
    section: "A",
  },

  // -- Innergemeinschaftliche Erwerbe (Reverse Charge)
  {
    kz: "89",
    name: "Innergemeinschaftliche Erwerbe 19 %",
    type: "IG_ERWERB",
    steuersatz: 0.19,
    section: "A",
    hgb_paragraph: "§ 1a UStG",
  },
  {
    kz: "93",
    name: "Innergemeinschaftliche Erwerbe 7 %",
    type: "IG_ERWERB",
    steuersatz: 0.07,
    section: "A",
  },
  {
    kz: "95",
    name: "Innergemeinschaftliche Erwerbe ohne Steuer",
    type: "IG_ERWERB",
    steuersatz: 0,
    section: "A",
  },

  // -- Leistungen nach § 13b UStG (Reverse Charge Inland)
  {
    kz: "46",
    name: "Leistungen § 13b Abs. 1/2 Nr. 1-5 UStG (Empfänger)",
    type: "REVERSE_CHARGE",
    steuersatz: 0.19,
    section: "A",
    hgb_paragraph: "§ 13b UStG",
  },
  {
    kz: "52",
    name: "Leistungen § 13b Abs. 2 Nr. 4, 5b, 6-11 UStG",
    type: "REVERSE_CHARGE",
    steuersatz: 0.19,
    section: "A",
  },
  {
    kz: "73",
    name: "Leistungen § 13b Abs. 2 Nr. 2 UStG (Bauleistungen)",
    type: "REVERSE_CHARGE",
    steuersatz: 0.19,
    section: "A",
  },
  {
    kz: "78",
    name: "Leistungen § 13b Abs. 2 Nr. 3 UStG (Gebäudereinigung)",
    type: "REVERSE_CHARGE",
    steuersatz: 0.19,
    section: "A",
  },

  // -- Steuerfreie Umsätze
  {
    kz: "41",
    name: "Innergemeinsch. Lieferungen § 4 Nr. 1b UStG",
    type: "STEUERFREI_IG_LIEF",
    steuersatz: 0,
    section: "A",
    hgb_paragraph: "§ 6a UStG",
  },
  {
    kz: "44",
    name: "Innergemeinsch. Lieferungen neuer Fahrzeuge",
    type: "STEUERFREI_IG_LIEF_FAHRZEUG",
    steuersatz: 0,
    section: "A",
  },
  {
    kz: "43",
    name: "Weitere steuerfreie Umsätze mit Vorsteuerabzug",
    type: "STEUERFREI_MIT_VSTAB",
    steuersatz: 0,
    section: "A",
    hgb_paragraph: "§ 4 Nr. 1-7 UStG",
  },
  {
    kz: "48",
    name: "Steuerfreie Umsätze ohne Vorsteuerabzug",
    type: "STEUERFREI_OHNE_VSTAB",
    steuersatz: 0,
    section: "A",
    hgb_paragraph: "§ 4 Nr. 8-28 UStG",
  },
  {
    kz: "60",
    name: "Umsätze im Ausland (nicht steuerbar)",
    type: "NICHT_STEUERBAR",
    steuersatz: 0,
    section: "A",
  },

  // -- Steuerbeträge (auto-computed)
  {
    kz: "81_STEUER",
    name: "Steuer zu Kz 81 (19 %)",
    type: "STEUERBETRAG",
    from_kz: "81",
    steuersatz: 0.19,
    section: "A",
    computation: "Kz 81 × 19 %",
  },
  {
    kz: "86_STEUER",
    name: "Steuer zu Kz 86 (7 %)",
    type: "STEUERBETRAG",
    from_kz: "86",
    steuersatz: 0.07,
    section: "A",
    computation: "Kz 86 × 7 %",
  },
  {
    kz: "35_STEUER",
    name: "Steuer zu Kz 35 (besondere Steuersätze)",
    type: "STEUERBETRAG_MANUAL",
    section: "A",
  },
  {
    kz: "89_STEUER",
    name: "Steuer zu Kz 89 (IG Erwerb 19 %)",
    type: "STEUERBETRAG",
    from_kz: "89",
    steuersatz: 0.19,
    section: "A",
    computation: "Kz 89 × 19 %",
  },
  {
    kz: "93_STEUER",
    name: "Steuer zu Kz 93 (IG Erwerb 7 %)",
    type: "STEUERBETRAG",
    from_kz: "93",
    steuersatz: 0.07,
    section: "A",
    computation: "Kz 93 × 7 %",
  },
  {
    kz: "47",
    name: "Steuer zu § 13b Umsätzen (aggregiert)",
    type: "STEUERBETRAG_AGGREGAT",
    from_kzs: ["46", "52", "73", "78"],
    steuersatz: 0.19,
    section: "A",
    computation: "(Kz 46 + 52 + 73 + 78) × 19 %",
  },

  // -- Summe Umsatzsteuer
  {
    kz: "UST_SUMME",
    name: "Summe Umsatzsteuer",
    type: "SUBTOTAL",
    components: [
      "81_STEUER",
      "86_STEUER",
      "35_STEUER",
      "89_STEUER",
      "93_STEUER",
      "47",
    ],
    section: "A",
    computation: "Σ aller Steuerbeträge zu Abschnitt A",
  },

  // ============================================================
  // B. Abziehbare Vorsteuerbeträge
  // ============================================================

  {
    kz: "66",
    name: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmern",
    type: "VORSTEUER",
    section: "B",
    hgb_paragraph: "§ 15 Abs. 1 Nr. 1 UStG",
  },
  {
    kz: "61",
    name: "Vorsteuer aus innergemeinschaftlichen Erwerben",
    type: "VORSTEUER_IG_ERWERB",
    section: "B",
    hgb_paragraph: "§ 15 Abs. 1 Nr. 3 UStG",
  },
  {
    kz: "62",
    name: "Entrichtete Einfuhrumsatzsteuer",
    type: "VORSTEUER_EUST",
    section: "B",
    hgb_paragraph: "§ 15 Abs. 1 Nr. 2 UStG",
  },
  {
    kz: "67",
    name: "Vorsteuer aus Leistungen im Sinne des § 13b UStG",
    type: "VORSTEUER_13B",
    section: "B",
    hgb_paragraph: "§ 15 Abs. 1 Nr. 4 UStG",
  },
  {
    kz: "63",
    name: "Nach allgemeinen Durchschnittssätzen berechnete Vorsteuerbeträge",
    type: "VORSTEUER_PAUSCHAL",
    section: "B",
    hgb_paragraph: "§ 23 UStG",
  },
  {
    kz: "64",
    name: "Berichtigung des Vorsteuerabzugs (§ 15a UStG)",
    type: "VORSTEUER_BERICHTIGUNG",
    section: "B",
    hgb_paragraph: "§ 15a UStG",
  },
  {
    kz: "59",
    name: "Vorsteuerabzug für innergemeinsch. Lieferungen neuer Fahrzeuge",
    type: "VORSTEUER_FAHRZEUG",
    section: "B",
  },

  // -- Summe Vorsteuer
  {
    kz: "VST_SUMME",
    name: "Summe Vorsteuer",
    type: "SUBTOTAL",
    components: ["66", "61", "62", "67", "63", "64", "59"],
    section: "B",
    computation: "Σ aller Vorsteuerbeträge",
  },

  // ============================================================
  // C. Berechnung der Zahllast / Erstattung
  // ============================================================

  {
    kz: "65",
    name: "Zahllast / Erstattung",
    type: "FINAL_RESULT",
    section: "C",
    computation: "UST_SUMME − VST_SUMME",
    hgb_paragraph: "§ 18 Abs. 1 UStG",
  },

  // -- Info-Zeilen
  {
    kz: "69",
    name: "In Kz 66 enthaltene Vorsteuer aus Vorjahren (Info)",
    type: "INFO",
    section: "B",
  },
];

export const USTVA_BY_KZ = new Map<string, UstvaPosition>(
  USTVA_STRUCTURE_2025.map((p) => [p.kz, p])
);

export type SectionId = "A" | "B" | "C";

export function positionsInSection(sec: SectionId): UstvaPosition[] {
  return USTVA_STRUCTURE_2025.filter((p) => p.section === sec);
}
