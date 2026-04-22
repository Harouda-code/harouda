import type { SteuerParameter } from "./types";

// Veranlagungsjahr 2024.
// Sämtliche Werte entsprechen dem Stand öffentlicher BMF-Veröffentlichungen.
// Diese Datei wird nicht mehr rückwirkend geändert — Abweichungen gehen in
// spätere Jahrgänge.

export const STEUERPARAMETER_2024: SteuerParameter = {
  jahr: 2024,
  lastReviewed: "2026-04-18",
  reviewStatus: "final",
  note: "Veranlagungsjahr abgeschlossen; Werte sollten im produktiven Einsatz dennoch gegengeprüft werden.",

  grundfreibetrag_euro: 11604,
  arbeitnehmerpauschbetrag_euro: 1230,
  werbungskostenpauschale_kap_euro: 1000,
  entfernungspauschale_bis20: 0.3,
  entfernungspauschale_ab21: 0.38,
  kinderfreibetrag_pro_elternteil_euro: 4656, // 3.192 + 1.464 BEA

  ust_regelsatz_pct: 19,
  ust_ermaessigt_pct: 7,
  kleinunternehmer_vorjahr_euro: 22000,
  kleinunternehmer_laufend_euro: 50000,

  gewst_messzahl_pct: 3.5,
  gewst_freibetrag_natperson_euro: 24500,

  kst_satz_pct: 15,
  soli_satz_pct: 5.5,
  soli_freigrenze_single_euro: 18130,

  kindergeld_pro_kind_monat_euro: 250,
  kinderbetreuungskosten_quote: 2 / 3,
  kinderbetreuungskosten_max_pro_kind_euro: 4000, // 2/3 von 6.000 € (bis 2024)
  kinderbetreuungskosten_altersgrenze: 14,

  ruerup_hoechstbetrag_euro: 27566,
  sonstige_vorsorge_max_an_euro: 1900,
  sonstige_vorsorge_max_selbst_euro: 2800,

  sparerpauschbetrag_single_euro: 1000,
  sparerpauschbetrag_verheiratet_euro: 2000,
  abgeltungsteuer_pct: 25,

  rente_werbungskostenpauschale_euro: 102,

  sv: {
    kv_allgemein: { gesamt: 14.6, arbeitnehmer: 7.3, arbeitgeber: 7.3 },
    pv_basis: { gesamt: 3.4, arbeitnehmer: 1.7, arbeitgeber: 1.7 },
    pv_zuschlag_kinderlos_pct: 0.6,
    pv_abschlag_pro_kind_pct: 0.25,
    rv: { gesamt: 18.6, arbeitnehmer: 9.3, arbeitgeber: 9.3 },
    av: { gesamt: 2.6, arbeitnehmer: 1.3, arbeitgeber: 1.3 },
    bbg_kv_pv_monat: 5175, // 62.100 €/Jahr
    bbg_rv_av_west_monat: 7550, // 90.600 €/Jahr
    bbg_rv_av_ost_monat: 7450, // 89.400 €/Jahr
    krankenkassen: [
      { name: "Techniker Krankenkasse (TK)", zusatzbeitrag_pct: 1.2 },
      { name: "Barmer", zusatzbeitrag_pct: 2.19 },
      { name: "DAK-Gesundheit", zusatzbeitrag_pct: 1.7 },
      { name: "AOK Bayern", zusatzbeitrag_pct: 1.7 },
      { name: "AOK Plus", zusatzbeitrag_pct: 1.8 },
      { name: "KKH", zusatzbeitrag_pct: 1.98 },
      { name: "BKK VBU", zusatzbeitrag_pct: 1.69 },
      { name: "hkk Krankenkasse", zusatzbeitrag_pct: 0.98 },
      { name: "IKK classic", zusatzbeitrag_pct: 1.8 },
    ],
  },
};
