// Per-Veranlagungsjahr Steuerparameter.
//
// Quellen (jeweils zum Jahr verlinken, siehe docs/steuer-parameter-changelog.md):
//   - § 32a EStG (Grundfreibetrag, Einkommensteuertarif)
//   - § 9 Abs. 1 Nr. 4 EStG (Entfernungspauschale)
//   - § 9a Nr. 1a EStG (Arbeitnehmer-Pauschbetrag)
//   - § 19 UStG (Kleinunternehmer-Grenzen)
//   - § 23 KStG (Körperschaftsteuersatz)
//   - § 11 Abs. 2 GewStG (Gewerbesteuer-Messzahl)
//   - § 11 Abs. 1 Nr. 1 GewStG (GewSt-Freibetrag natürliche Personen)
//   - § 3 SolzG (Solidaritätszuschlag)
//   - Sozialversicherungsrechengrößen-Verordnung (BBG, Beiträge)
//
// Werte sind öffentlich und bei Änderungen über Wachstumschancengesetz,
// Steueranpassungsgesetz etc. in `changelog` gespiegelt. Vor Einreichung
// aktuelle BMF-Veröffentlichungen abgleichen.

export type SvRegion = "west" | "ost";

export type SvRate = {
  /** Gesamtsatz in Prozent */
  gesamt: number;
  /** Arbeitnehmer-Anteil */
  arbeitnehmer: number;
  /** Arbeitgeber-Anteil */
  arbeitgeber: number;
};

export type Krankenkasse = {
  name: string;
  /** Zusatzbeitrag in Prozent (hälftig zwischen AN und AG) */
  zusatzbeitrag_pct: number;
};

export type SteuerParameter = {
  /** Veranlagungsjahr (für Einkommensteuer) bzw. Kalenderjahr */
  jahr: number;
  /** Wann diese Datenlage intern geprüft wurde (ISO-Datum) */
  lastReviewed: string;
  /** Menschenlesbarer Status */
  reviewStatus: "vorlaeufig" | "bestaetigt" | "final";
  /** Kurze Bemerkung (optional) */
  note?: string;

  // --- Einkommensteuer ---
  grundfreibetrag_euro: number;
  arbeitnehmerpauschbetrag_euro: number;
  werbungskostenpauschale_kap_euro: number;
  entfernungspauschale_bis20: number; // €/km
  entfernungspauschale_ab21: number; // €/km
  kinderfreibetrag_pro_elternteil_euro: number; // inkl. BEA-Freibetrag nach § 32 Abs. 6 EStG

  // --- USt ---
  ust_regelsatz_pct: number; // stabil 19
  ust_ermaessigt_pct: number; // stabil 7
  kleinunternehmer_vorjahr_euro: number;
  kleinunternehmer_laufend_euro: number;

  // --- GewSt ---
  gewst_messzahl_pct: number;
  gewst_freibetrag_natperson_euro: number;

  // --- KSt + Soli ---
  kst_satz_pct: number;
  soli_satz_pct: number;
  soli_freigrenze_single_euro: number;

  // --- Kinder (Anlage Kind) ---
  kindergeld_pro_kind_monat_euro: number;
  /** Anteil der absetzbaren Betreuungskosten (§ 10 Abs. 1 Nr. 5 EStG: 2/3). */
  kinderbetreuungskosten_quote: number;
  /** Maximal absetzbar pro Kind/Jahr (§ 10 Abs. 1 Nr. 5 EStG). */
  kinderbetreuungskosten_max_pro_kind_euro: number;
  /** Kind muss unter dieser Altersgrenze sein. */
  kinderbetreuungskosten_altersgrenze: number;

  // --- Vorsorgeaufwand (Anlage Vorsorgeaufwand) ---
  /** Höchstbetrag Basisvorsorge / Rürup (§ 10 Abs. 3 EStG). */
  ruerup_hoechstbetrag_euro: number;
  /** Höchstbetrag sonstige Vorsorge Arbeitnehmer (§ 10 Abs. 4 EStG). */
  sonstige_vorsorge_max_an_euro: number;
  /** Höchstbetrag sonstige Vorsorge Selbständige. */
  sonstige_vorsorge_max_selbst_euro: number;

  // --- Kapitalerträge (Anlage KAP) ---
  sparerpauschbetrag_single_euro: number;
  sparerpauschbetrag_verheiratet_euro: number;
  /** Abgeltungsteuer-Satz (§ 32d EStG). Seit 2009 stabil 25 %. */
  abgeltungsteuer_pct: number;

  // --- Renten (Anlage R) ---
  /** Werbungskostenpauschale für Rentner (§ 9a Nr. 3 EStG). */
  rente_werbungskostenpauschale_euro: number;

  // --- Sozialversicherung ---
  sv: {
    kv_allgemein: SvRate;
    pv_basis: SvRate;
    pv_zuschlag_kinderlos_pct: number;
    pv_abschlag_pro_kind_pct: number;
    rv: SvRate;
    av: SvRate;
    bbg_kv_pv_monat: number;
    bbg_rv_av_west_monat: number;
    bbg_rv_av_ost_monat: number;
    krankenkassen: Krankenkasse[];
  };
};
