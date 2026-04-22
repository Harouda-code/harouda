import type { SteuerParameter } from "./types";

// Veranlagungsjahr 2025.
// Wesentliche Änderungen gegenüber 2024:
//   - Grundfreibetrag: 11.604 → 12.096 (Inflationsausgleichsgesetz)
//   - Kleinunternehmer-Grenzen: 22k/50k → 25k/100k (Wachstumschancengesetz,
//     gültig ab 1.1.2025, § 19 UStG in der Fassung ab 2025)
//   - PV-Basissatz: 3,4 % → 3,6 % (GKV-FKG)
//   - BBG KV/PV: 5.175 → 5.512,50 €/Monat (Sozialversicherungs-Rechengrößen-
//     Verordnung 2025)
//   - BBG RV/AV: bundeseinheitlich 8.050 €/Monat
//   - Entfernungspauschale: 0,38 €/km ab dem 21. km (§ 9 Abs. 1 Nr. 4 EStG,
//     befristet bis 2026)

export const STEUERPARAMETER_2025: SteuerParameter = {
  jahr: 2025,
  lastReviewed: "2026-04-18",
  reviewStatus: "bestaetigt",

  grundfreibetrag_euro: 12096,
  arbeitnehmerpauschbetrag_euro: 1230,
  werbungskostenpauschale_kap_euro: 1000,
  entfernungspauschale_bis20: 0.3,
  entfernungspauschale_ab21: 0.38,
  kinderfreibetrag_pro_elternteil_euro: 4800, // 3.336 + 1.464 BEA

  ust_regelsatz_pct: 19,
  ust_ermaessigt_pct: 7,
  kleinunternehmer_vorjahr_euro: 25000,
  kleinunternehmer_laufend_euro: 100000,

  gewst_messzahl_pct: 3.5,
  gewst_freibetrag_natperson_euro: 24500,

  kst_satz_pct: 15,
  soli_satz_pct: 5.5,
  soli_freigrenze_single_euro: 19950,

  kindergeld_pro_kind_monat_euro: 255, // Erhöhung zum 1.1.2025
  kinderbetreuungskosten_quote: 0.8, // ab 2025: 80 % (Wachstumschancengesetz)
  kinderbetreuungskosten_max_pro_kind_euro: 4800,
  kinderbetreuungskosten_altersgrenze: 14,

  ruerup_hoechstbetrag_euro: 29344,
  sonstige_vorsorge_max_an_euro: 1900,
  sonstige_vorsorge_max_selbst_euro: 2800,

  sparerpauschbetrag_single_euro: 1000,
  sparerpauschbetrag_verheiratet_euro: 2000,
  abgeltungsteuer_pct: 25,

  rente_werbungskostenpauschale_euro: 102,

  sv: {
    kv_allgemein: { gesamt: 14.6, arbeitnehmer: 7.3, arbeitgeber: 7.3 },
    pv_basis: { gesamt: 3.6, arbeitnehmer: 1.8, arbeitgeber: 1.8 },
    pv_zuschlag_kinderlos_pct: 0.6,
    pv_abschlag_pro_kind_pct: 0.25,
    rv: { gesamt: 18.6, arbeitnehmer: 9.3, arbeitgeber: 9.3 },
    av: { gesamt: 2.6, arbeitnehmer: 1.3, arbeitgeber: 1.3 },
    bbg_kv_pv_monat: 5512.5, // 66.150 €/Jahr
    bbg_rv_av_west_monat: 8050, // 96.600 €/Jahr
    bbg_rv_av_ost_monat: 8050, // ab 2025 bundeseinheitlich
    krankenkassen: [
      { name: "Techniker Krankenkasse (TK)", zusatzbeitrag_pct: 2.45 },
      { name: "Barmer", zusatzbeitrag_pct: 3.29 },
      { name: "DAK-Gesundheit", zusatzbeitrag_pct: 2.8 },
      { name: "AOK Bayern", zusatzbeitrag_pct: 2.5 },
      { name: "AOK Nordost", zusatzbeitrag_pct: 2.7 },
      { name: "AOK Plus (Sachsen/Thüringen)", zusatzbeitrag_pct: 2.5 },
      { name: "AOK Baden-Württemberg", zusatzbeitrag_pct: 2.4 },
      { name: "AOK Rheinland/Hamburg", zusatzbeitrag_pct: 2.6 },
      { name: "AOK Nordwest", zusatzbeitrag_pct: 2.6 },
      { name: "KKH (Kaufmännische Krankenkasse)", zusatzbeitrag_pct: 2.98 },
      { name: "BKK VBU", zusatzbeitrag_pct: 2.7 },
      { name: "hkk Krankenkasse", zusatzbeitrag_pct: 1.58 },
      { name: "IKK classic", zusatzbeitrag_pct: 2.8 },
      { name: "Mobil Krankenkasse", zusatzbeitrag_pct: 2.2 },
      { name: "BKK Pfalz", zusatzbeitrag_pct: 2.2 },
      { name: "mhplus Betriebskrankenkasse", zusatzbeitrag_pct: 2.4 },
      { name: "HEK Hanseatische Krankenkasse", zusatzbeitrag_pct: 2.6 },
    ],
  },
};
