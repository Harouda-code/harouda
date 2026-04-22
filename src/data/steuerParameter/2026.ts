import type { SteuerParameter } from "./types";

// Veranlagungsjahr 2026 — VORLÄUFIG.
// Die meisten Werte sind nach dem Stand der Gesetzgebung (Inflations-
// ausgleichsgesetz, Steueranpassungsgesetz, Sozialversicherungs-
// Rechengrößen-Verordnung 2026) geschätzt oder beruhen auf noch nicht
// finalisierten Entwürfen. Die Datei MUSS mit Veröffentlichung der
// endgültigen Sätze (i. d. R. Q4 des Vorjahres) aktualisiert werden.
//
// Bis dahin fällt der Rechner bei aktivem Jahr 2026 auf konservative
// Schätzungen zurück — Ergebnisse sind entsprechend als vorläufig
// zu betrachten.

export const STEUERPARAMETER_2026: SteuerParameter = {
  jahr: 2026,
  lastReviewed: "2026-04-18",
  reviewStatus: "vorlaeufig",
  note: "Werte vorläufig — endgültige Sätze i. d. R. erst im Q4 des Vorjahres verfügbar.",

  grundfreibetrag_euro: 12348, // geplante Erhöhung laut Entwurf
  arbeitnehmerpauschbetrag_euro: 1230,
  werbungskostenpauschale_kap_euro: 1000,
  entfernungspauschale_bis20: 0.3,
  entfernungspauschale_ab21: 0.38, // befristet bis VZ 2026
  kinderfreibetrag_pro_elternteil_euro: 4800,

  ust_regelsatz_pct: 19,
  ust_ermaessigt_pct: 7,
  kleinunternehmer_vorjahr_euro: 25000,
  kleinunternehmer_laufend_euro: 100000,

  gewst_messzahl_pct: 3.5,
  gewst_freibetrag_natperson_euro: 24500,

  kst_satz_pct: 15,
  soli_satz_pct: 5.5,
  soli_freigrenze_single_euro: 20350, // geschätzt

  kindergeld_pro_kind_monat_euro: 259, // geschätzt
  kinderbetreuungskosten_quote: 0.8,
  kinderbetreuungskosten_max_pro_kind_euro: 4800,
  kinderbetreuungskosten_altersgrenze: 14,

  ruerup_hoechstbetrag_euro: 30100, // geschätzt
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
    bbg_kv_pv_monat: 5700, // geschätzt
    bbg_rv_av_west_monat: 8300, // geschätzt
    bbg_rv_av_ost_monat: 8300,
    krankenkassen: [
      { name: "Techniker Krankenkasse (TK)", zusatzbeitrag_pct: 2.45 },
      { name: "Barmer", zusatzbeitrag_pct: 3.29 },
      { name: "DAK-Gesundheit", zusatzbeitrag_pct: 2.8 },
      { name: "AOK Bayern", zusatzbeitrag_pct: 2.5 },
      { name: "AOK Plus", zusatzbeitrag_pct: 2.5 },
      { name: "KKH", zusatzbeitrag_pct: 2.98 },
      { name: "BKK VBU", zusatzbeitrag_pct: 2.7 },
      { name: "hkk Krankenkasse", zusatzbeitrag_pct: 1.58 },
      { name: "IKK classic", zusatzbeitrag_pct: 2.8 },
    ],
  },
};
