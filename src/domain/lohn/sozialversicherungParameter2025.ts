/**
 * Sozialversicherung-Parameter 2025.
 *
 * Alle Beitragssätze in Prozent (nicht Dezimal) für Lesbarkeit. Die
 * Berechnung erfolgt jeweils × (prozent) / 100 mit Money-Präzision.
 * BBG (Beitragsbemessungsgrenzen) in Euro-Jahresbeträgen; pro Monat
 * geteilt durch 12 und Halbjahr durch 2 (wie im Einsatz).
 *
 * Werte 2025 (LStÄndG / GKV-Versorgungsstärkungsgesetz):
 *   BBG KV/PV: 66.150 € (2024: 62.100). Prompt verwendet 66.150 — OK.
 *   BBG RV/AV West: 96.600 € (2024: 90.600). Ost seit 2025 einheitlich mit West.
 *   KV allgemein: 14,6 % (unverändert)
 *   KV-Zusatzbeitrag Durchschnitt 2025: 2,5 %
 *   PV: 3,6 % (seit 2023 3,4 + Eltern-Staffel; wir verwenden 3,6 Standard)
 *   RV: 18,6 %, AV: 2,6 % (unverändert)
 *   Minijob-Grenze 2024 = 538 €. Ab 2025: 556 €. Prompt: 538 — wir übernehmen.
 */

import { Money } from "../../lib/money/Money";

export const SV_PARAMETER_2025 = {
  // Beitragsbemessungsgrenzen (Jahr)
  bbg_kv_pv: new Money("66150"),
  bbg_rv_av: new Money("96600"),
  bbg_rv_av_ost: new Money("96600"),

  // Beitragssätze in Prozent
  kv_allgemein_prozent: new Money("14.6"),
  kv_zusatz_durchschnitt_prozent: new Money("2.5"),
  pv_allgemein_prozent: new Money("3.6"),
  pv_kinderlos_zuschlag_prozent: new Money("0.6"),
  pv_abschlag_ab_kind2_prozent: new Money("0.25"),
  pv_abschlag_max_prozent: new Money("1.0"),
  rv_prozent: new Money("18.6"),
  av_prozent: new Money("2.6"),

  // Umlagen (nur Arbeitgeber) — Durchschnittssätze
  u1_prozent: new Money("1.1"),
  u2_prozent: new Money("0.24"),
  u3_insolvenzgeld_prozent: new Money("0.06"),

  // Geringfügigkeit
  minijob_grenze_monat: new Money("538"),
  minijob_pauschal_kv_ag_prozent: new Money("13"),
  minijob_pauschal_rv_ag_prozent: new Money("15"),
  minijob_pauschalsteuer_prozent: new Money("2"),

  // Midijob-Übergangsbereich
  midijob_untergrenze_monat: new Money("538.01"),
  midijob_obergrenze_monat: new Money("2000"),
} as const;

/** Monatliche BBG KV/PV = Jahres-BBG / 12. */
export function bbgKvPvMonat(): Money {
  return SV_PARAMETER_2025.bbg_kv_pv.div(12);
}
/** Monatliche BBG RV/AV = Jahres-BBG / 12. */
export function bbgRvAvMonat(): Money {
  return SV_PARAMETER_2025.bbg_rv_av.div(12);
}

/** Money.min-Hilfsmethode: gibt den kleineren der beiden Werte zurück. */
export function moneyMin(a: Money, b: Money): Money {
  return a.lessThan(b) ? a : b;
}
/** Money.max. */
export function moneyMax(a: Money, b: Money): Money {
  return a.greaterThan(b) ? a : b;
}
