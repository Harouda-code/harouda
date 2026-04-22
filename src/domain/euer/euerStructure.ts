/**
 * Anlage EÜR 2025 — BMF-Vordruck.
 *
 * § 4 Abs. 3 EStG — Einnahmen-Überschuss-Rechnung für Steuerpflichtige, die
 * nicht buchführungspflichtig sind (Freiberufler, Kleingewerbe).
 *
 * Positionstypen:
 *   EINNAHME_*          — Betriebseinnahmen (Soll-Saldo aus Ertragskonten)
 *   AUFWAND_*           — Betriebsausgaben
 *   BEWIRTUNG           — Split 70 % (Kz 175) / 30 % (Kz 228, nicht abzugsfähig)
 *   GESCHENKE_*         — 170 für ≤ 50 €, 228 für > 50 € (separate Konten)
 *   USTVA_ZAHLLAST      — an FA gezahlte UStVA
 *   VORSTEUER_AUFWAND   — gezahlte Vorsteuer (Kz 185)
 *   UST_EINNAHME        — vereinnahmte USt (Kz 140)
 *   IAB_*               — § 7g EStG
 *   SUBTOTAL            — Σ components
 *   FINAL_RESULT        — Steuerlicher Gewinn
 *   INFO                — reine Info-Zeile
 *
 * Die amtliche Kz-Nummerierung und Zeilen-Nummerierung folgen dem
 * BMF-Vordruck 2025.
 */

export type EuerPositionType =
  | "EINNAHME_KLEINUNT"
  | "EINNAHME_NETTO"
  | "EINNAHME_STEUERFREI"
  | "UST_EINNAHME"
  | "UST_ERSTATTUNG"
  | "VERAEUSSERUNG_AV"
  | "PRIVATE_KFZ_NUTZUNG"
  | "ENTNAHME_SONSTIG"
  | "AUFLOESUNG_RUECKLAGE"
  | "AUFWAND_WARE"
  | "AUFWAND_FREMDLEISTUNG"
  | "AUFWAND_PERSONAL"
  | "AUFWAND_MIETE"
  | "AUFWAND_RAUMKOSTEN"
  | "AUFWAND_ARBEITSZIMMER"
  | "AFA_BEWEGLICH"
  | "AFA_UNBEWEGLICH"
  | "AFA_IMMATERIELL"
  | "SONDER_AFA_7G"
  | "AUFWAND_TELEKOM"
  | "AUFWAND_REISE"
  | "AUFWAND_FORTBILDUNG"
  | "AUFWAND_BERATUNG"
  | "AUFWAND_LEASING"
  | "AUFWAND_VERSICHERUNG"
  | "AUFWAND_WERBUNG"
  | "AUFWAND_KFZ_GESAMT"
  | "ENTFERNUNGSPAUSCHALE"
  | "KFZ_PRIVATANTEIL"
  | "GESCHENKE_ABZUGSFAEHIG"
  | "BEWIRTUNG"
  | "ZINSEN_AUFWAND"
  | "AUFWAND_SONSTIG"
  | "USTVA_ZAHLLAST"
  | "VORSTEUER_AUFWAND"
  | "HINZURECHNUNG_7G"
  | "AUFLOESUNG_IAB"
  | "NICHT_ABZUGSFAEHIG"
  | "IAB_ANTRAG"
  | "RUECKLAGE_6B"
  | "SUBTOTAL"
  | "FINAL_RESULT"
  | "INFO";

export type EuerSection = "A" | "B" | "C" | "D" | "E" | "F";

export type EuerPosition = {
  /** Kennzahl (BMF-Numerierung). */
  kz: string;
  /** Zeilennummer im BMF-Vordruck. */
  zeile: number;
  name: string;
  type: EuerPositionType;
  section: EuerSection;
  /** Komponenten für SUBTOTAL-Zeilen (z. B. Kz 109, 199). */
  components?: string[];
  /** Formel-Dokumentation. */
  computation?: string;
  /** Abzugsfähig-Prozent (Bewirtung 70 %). */
  abzugsfaehig_prozent?: number;
  /** Höchstbetrag pro Empfänger (Geschenke 50 €). */
  hoechstbetrag?: number;
  /** Gesetzliche Fundstelle. */
  hgb_ref?: string;
  /** Markiert die Final-Zeile (Steuerlicher Gewinn). */
  is_final_result?: boolean;
};

export const EUER_STRUCTURE_2025: EuerPosition[] = [
  // =============================================================
  // B. Betriebseinnahmen (Z. 11–22)
  // =============================================================
  {
    kz: "111",
    zeile: 11,
    name: "Betriebseinnahmen als Kleinunternehmer (§ 19 UStG)",
    type: "EINNAHME_KLEINUNT",
    section: "B",
    hgb_ref: "§ 19 UStG",
  },
  {
    kz: "112",
    zeile: 12,
    name: "Umsatzsteuerpflichtige Betriebseinnahmen (netto)",
    type: "EINNAHME_NETTO",
    section: "B",
  },
  {
    kz: "103",
    zeile: 13,
    name: "Umsatzsteuerfreie, nicht umsatzsteuerbare Betriebseinnahmen",
    type: "EINNAHME_STEUERFREI",
    section: "B",
  },
  {
    kz: "140",
    zeile: 14,
    name: "Vereinnahmte Umsatzsteuer einschl. USt auf unentgeltliche Wertabgaben",
    type: "UST_EINNAHME",
    section: "B",
  },
  {
    kz: "141",
    zeile: 15,
    name: "Vom FA erstattete und ggf. verrechnete Umsatzsteuer",
    type: "UST_ERSTATTUNG",
    section: "B",
  },
  {
    kz: "102",
    zeile: 16,
    name: "Veräußerung / Entnahme von Anlagevermögen",
    type: "VERAEUSSERUNG_AV",
    section: "B",
  },
  {
    kz: "104",
    zeile: 17,
    name: "Private Kfz-Nutzung (1 %-Methode oder Fahrtenbuch)",
    type: "PRIVATE_KFZ_NUTZUNG",
    section: "B",
  },
  {
    kz: "105",
    zeile: 18,
    name: "Sonstige Sach-, Nutzungs- und Leistungsentnahmen",
    type: "ENTNAHME_SONSTIG",
    section: "B",
  },
  {
    kz: "108",
    zeile: 19,
    name: "Auflösung von Rücklagen / Ausgleichsposten",
    type: "AUFLOESUNG_RUECKLAGE",
    section: "B",
  },
  {
    kz: "109",
    zeile: 20,
    name: "Summe Betriebseinnahmen",
    type: "SUBTOTAL",
    section: "B",
    components: ["111", "112", "103", "140", "141", "102", "104", "105", "108"],
    computation: "Σ Kz 111-108",
  },

  // =============================================================
  // C. Betriebsausgaben (Z. 23–54)
  // =============================================================
  {
    kz: "100",
    zeile: 23,
    name: "Waren, Rohstoffe, Hilfsstoffe (einschl. Nebenkosten)",
    type: "AUFWAND_WARE",
    section: "C",
  },
  {
    kz: "110",
    zeile: 24,
    name: "Bezogene Fremdleistungen",
    type: "AUFWAND_FREMDLEISTUNG",
    section: "C",
  },
  {
    kz: "120",
    zeile: 25,
    name: "Löhne und Gehälter (inkl. Nebenkosten)",
    type: "AUFWAND_PERSONAL",
    section: "C",
  },
  {
    kz: "130",
    zeile: 26,
    name: "Miete / Pacht für Geschäftsräume",
    type: "AUFWAND_MIETE",
    section: "C",
  },
  {
    kz: "131",
    zeile: 27,
    name: "Sonstige Aufwendungen für betrieblich genutzte Räume (ohne AfA)",
    type: "AUFWAND_RAUMKOSTEN",
    section: "C",
  },
  {
    kz: "132",
    zeile: 28,
    name: "Aufwendungen für ein häusliches Arbeitszimmer",
    type: "AUFWAND_ARBEITSZIMMER",
    section: "C",
  },
  {
    kz: "171",
    zeile: 29,
    name: "Abschreibungen auf bewegliche Wirtschaftsgüter",
    type: "AFA_BEWEGLICH",
    section: "C",
    hgb_ref: "§ 7 EStG",
  },
  {
    kz: "172",
    zeile: 30,
    name: "Abschreibungen auf unbewegliche Wirtschaftsgüter",
    type: "AFA_UNBEWEGLICH",
    section: "C",
    hgb_ref: "§ 7 EStG",
  },
  {
    kz: "173",
    zeile: 31,
    name: "Abschreibungen auf immaterielle Wirtschaftsgüter",
    type: "AFA_IMMATERIELL",
    section: "C",
  },
  {
    kz: "174",
    zeile: 32,
    name: "Sonderabschreibungen nach § 7g Abs. 5, 6 EStG",
    type: "SONDER_AFA_7G",
    section: "C",
    hgb_ref: "§ 7g Abs. 5, 6 EStG",
  },
  {
    kz: "160",
    zeile: 33,
    name: "Aufwendungen für Telekommunikation",
    type: "AUFWAND_TELEKOM",
    section: "C",
  },
  {
    kz: "161",
    zeile: 34,
    name: "Übernachtungs- und Reisenebenkosten",
    type: "AUFWAND_REISE",
    section: "C",
  },
  {
    kz: "162",
    zeile: 35,
    name: "Fortbildungskosten",
    type: "AUFWAND_FORTBILDUNG",
    section: "C",
  },
  {
    kz: "163",
    zeile: 36,
    name: "Rechts- und Steuerberatung, Buchführung",
    type: "AUFWAND_BERATUNG",
    section: "C",
  },
  {
    kz: "164",
    zeile: 37,
    name: "Miete / Leasing für bewegliche Wirtschaftsgüter",
    type: "AUFWAND_LEASING",
    section: "C",
  },
  {
    kz: "165",
    zeile: 38,
    name: "Beiträge, Gebühren, Abgaben, Versicherungen",
    type: "AUFWAND_VERSICHERUNG",
    section: "C",
  },
  {
    kz: "166",
    zeile: 39,
    name: "Werbe- und Repräsentationskosten",
    type: "AUFWAND_WERBUNG",
    section: "C",
  },
  {
    kz: "180",
    zeile: 40,
    name: "Gesamte Kfz-Kosten (ohne AfA und Zinsen)",
    type: "AUFWAND_KFZ_GESAMT",
    section: "C",
  },
  {
    kz: "181",
    zeile: 41,
    name: "Abziehbare Aufwendungen für Fahrten Wohnung–Betrieb",
    type: "ENTFERNUNGSPAUSCHALE",
    section: "C",
    hgb_ref: "§ 4 Abs. 5 Nr. 6 EStG",
  },
  {
    kz: "183",
    zeile: 42,
    name: "Private Kfz-Nutzung (Minderung der Kfz-Kosten)",
    type: "KFZ_PRIVATANTEIL",
    section: "C",
  },
  {
    kz: "170",
    zeile: 46,
    name: "Geschenke (bis 50 €) — abziehbar",
    type: "GESCHENKE_ABZUGSFAEHIG",
    section: "C",
    hoechstbetrag: 50,
    hgb_ref: "§ 4 Abs. 5 Nr. 1 EStG",
  },
  {
    kz: "175",
    zeile: 47,
    name: "Bewirtungsaufwendungen (70 % abziehbar)",
    type: "BEWIRTUNG",
    section: "C",
    abzugsfaehig_prozent: 70,
    hgb_ref: "§ 4 Abs. 5 Nr. 2 EStG",
  },
  {
    kz: "234",
    zeile: 50,
    name: "Schuldzinsen (betrieblich)",
    type: "ZINSEN_AUFWAND",
    section: "C",
  },
  {
    kz: "183_SO",
    zeile: 51,
    name: "Übrige unbeschränkt abziehbare Betriebsausgaben",
    type: "AUFWAND_SONSTIG",
    section: "C",
  },
  {
    kz: "184",
    zeile: 52,
    name: "An das FA gezahlte und ggf. verrechnete Umsatzsteuer",
    type: "USTVA_ZAHLLAST",
    section: "C",
  },
  {
    kz: "185",
    zeile: 53,
    name: "Vorsteuerbeträge laut Rechnungen",
    type: "VORSTEUER_AUFWAND",
    section: "C",
  },
  {
    kz: "199",
    zeile: 54,
    name: "Summe Betriebsausgaben",
    type: "SUBTOTAL",
    section: "C",
    components: [
      "100",
      "110",
      "120",
      "130",
      "131",
      "132",
      "171",
      "172",
      "173",
      "174",
      "160",
      "161",
      "162",
      "163",
      "164",
      "165",
      "166",
      "180",
      "181",
      "183",
      "170",
      "175",
      "234",
      "183_SO",
      "184",
      "185",
    ],
    computation: "Σ aller Ausgaben-Kz",
  },

  // =============================================================
  // D. Ermittlung des Gewinns (Z. 55–70)
  // =============================================================
  {
    kz: "200",
    zeile: 55,
    name: "Vorläufiger Gewinn / Verlust (Einnahmen ./. Ausgaben)",
    type: "SUBTOTAL",
    section: "D",
    computation: "Kz 109 − Kz 199",
  },
  {
    kz: "206",
    zeile: 56,
    name: "Hinzurechnung § 7g Abs. 1 EStG (IAB-Gegenbuchung)",
    type: "HINZURECHNUNG_7G",
    section: "D",
    hgb_ref: "§ 7g Abs. 1 EStG",
  },
  {
    kz: "210",
    zeile: 57,
    name: "Auflösungsbetrag Investitionsabzugsbetrag § 7g Abs. 3, 4 EStG",
    type: "AUFLOESUNG_IAB",
    section: "D",
    hgb_ref: "§ 7g Abs. 3, 4 EStG",
  },
  {
    kz: "228",
    zeile: 58,
    name: "Nicht abziehbare Betriebsausgaben (§ 4 Abs. 5, 5b EStG)",
    type: "NICHT_ABZUGSFAEHIG",
    section: "D",
    hgb_ref: "§ 4 Abs. 5, 5b EStG",
  },
  {
    kz: "219",
    zeile: 70,
    name: "Steuerlicher Gewinn / Verlust",
    type: "FINAL_RESULT",
    section: "D",
    computation: "Kz 200 + Kz 206 + Kz 210 + Kz 228",
    is_final_result: true,
  },

  // =============================================================
  // E. Investitionsabzugsbetrag (§ 7g EStG)
  // =============================================================
  {
    kz: "270",
    zeile: 75,
    name: "Investitionsabzugsbetrag § 7g Abs. 1 EStG (beantragt)",
    type: "IAB_ANTRAG",
    section: "E",
    hgb_ref: "§ 7g Abs. 1 EStG (bis 50 % geplanter Anschaffungskosten)",
  },

  // =============================================================
  // F. Rücklagen / stille Reserven
  // =============================================================
  {
    kz: "290",
    zeile: 80,
    name: "Rücklage nach § 6b / § 6c EStG",
    type: "RUECKLAGE_6B",
    section: "F",
    hgb_ref: "§ 6b, § 6c EStG",
  },
];

export const EUER_BY_KZ = new Map<string, EuerPosition>(
  EUER_STRUCTURE_2025.map((p) => [p.kz, p])
);

export function positionsInSection(sec: EuerSection): EuerPosition[] {
  return EUER_STRUCTURE_2025.filter((p) => p.section === sec);
}
