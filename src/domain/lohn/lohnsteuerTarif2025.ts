/**
 * Lohnsteuer-Tarif 2025 — § 32a EStG (offizielle Werte 2025).
 *
 * Grundlage:
 *   - LStÄndG 2024 (BGBl. I 2024 Nr. 378)
 *   - Steuerfortentwicklungsgesetz (StFG)
 *   - BMF Bekanntmachung 13.12.2024
 *
 * ÄNDERUNGEN gegenüber vorheriger Iteration (die 2024-Werte enthielt):
 *   - Grundfreibetrag: 11.784 → 12.096 € (§ 32a Abs. 1 Nr. 1 EStG 2025)
 *   - Zone 2 endet bei 17.443 € (statt 17.005 €)
 *   - Zone 3 endet bei 68.480 € (statt 66.760 €)
 *   - Zone 4 Offset: 10.602,13 → 10.911,92
 *   - Zone 5 Offset: 18.936,88 → 19.246,67
 *   - Zone-Koeffizienten neu: Zone 2 y·932,30; Zone 3 z·176,64
 *   - Kontinuität an Zonen-Grenzen verifiziert (Stetigkeit der Tariffunktion).
 *   - Soli-Freigrenze: 19.950 € (2025 angehoben, zuvor 18.130)
 */

import { Money } from "../../lib/money/Money";
import type { Steuerklasse, Bundesland } from "./types";

export const LOHNSTEUER_PARAMETER_2025 = {
  // § 32a Abs. 1 EStG — offizieller 2025-Wert
  grundfreibetrag_jahr: new Money("12096"),

  // § 24a EStG
  werbungskosten_arbeitnehmer: new Money("1230"),
  // § 10c EStG
  sonderausgaben_pauschbetrag: new Money("36"),
  // § 24b EStG
  entlastungsbetrag_alleinerziehend: new Money("4260"),
  entlastungsbetrag_je_weiteres_kind: new Money("240"),

  // § 32 Abs. 6 EStG — Kinder-Freibetrag + BEA pro Elternteil
  kinderfreibetrag_je_elternteil: new Money("3306"),
  bea_freibetrag_je_elternteil: new Money("1464"),
  /** Gesamt pro Kind pro Elternteil: 3306 + 1464 = 4770 €. */
  kinderfreibetrag_gesamt_je_elternteil: new Money("4770"),

  // § 3 SolZG — Freigrenze 2025 angehoben auf 19.950 €
  soli_freigrenze_jahr_einzel: new Money("19950"),
  soli_freigrenze_jahr_splitting: new Money("39900"),
  soli_milderungszone_faktor: new Money("11.9"),
  soli_prozent: new Money("5.5"),

  // Kirchensteuer
  kirchensteuer_prozent_by: new Money("8"),
  kirchensteuer_prozent_bw: new Money("8"),
  kirchensteuer_prozent_default: new Money("9"),

  // Zonen-Grenzen (Doku)
  zone2_ende: new Money("17443"),
  zone3_ende: new Money("68480"),
  zone4_ende: new Money("277825"),
} as const;

/**
 * § 32a Abs. 1 EStG 2025 — Einkommensteuer-Grundtabelle (Grundtarif).
 * Erwartet Jahres-zvE; Rückgabe: Jahres-LSt (Grundtarif) in Euro (abgerundet).
 */
export function esTarif2025Grund(zvE: Money): Money {
  if (zvE.isNegative() || zvE.isZero()) return Money.zero();
  const e = zvE.toNumber();
  let tax = 0;

  if (e <= 12096) {
    tax = 0;
  } else if (e <= 17443) {
    const y = (e - 12096) / 10000;
    tax = (932.3 * y + 1400) * y;
  } else if (e <= 68480) {
    const z = (e - 17443) / 10000;
    tax = (176.64 * z + 2397) * z + 1015.13;
  } else if (e <= 277825) {
    tax = 0.42 * e - 10911.92;
  } else {
    tax = 0.45 * e - 19246.67;
  }

  return new Money(Math.floor(tax));
}

/** Splitting-Verfahren für StKl III: LSt(zvE/2) × 2. */
export function esTarif2025Splitting(zvE: Money): Money {
  return esTarif2025Grund(zvE.div(2)).times(2);
}

/** Jahres-LSt je Steuerklasse (vereinfacht). Dokumentierte Näherungen:
 *    V  → Grundtarif auf zvE + Grundfreibetrag
 *    VI → Grundtarif ohne Grundfreibetrag-Wirkung (Subtraktion der 0-Zone)
 */
export function jahresLstByStKl(
  zvE: Money,
  steuerklasse: Steuerklasse
): Money {
  switch (steuerklasse) {
    case 1:
    case 2:
    case 4:
      return esTarif2025Grund(zvE);
    case 3:
      return esTarif2025Splitting(zvE);
    case 5: {
      const korrigiert = zvE.plus(LOHNSTEUER_PARAMETER_2025.grundfreibetrag_jahr);
      return esTarif2025Grund(korrigiert);
    }
    case 6: {
      const plusGfb = zvE.plus(LOHNSTEUER_PARAMETER_2025.grundfreibetrag_jahr);
      const mitGfb = esTarif2025Grund(plusGfb);
      const zeroZone = esTarif2025Grund(
        LOHNSTEUER_PARAMETER_2025.grundfreibetrag_jahr
      );
      return mitGfb.minus(zeroZone);
    }
  }
}

/**
 * Solidaritätszuschlag — § 3 SolZG, Stand 2025.
 * Freigrenze 19.950 € (Einzel) / 39.900 € (Splitting). Unter Grenze: 0.
 * Milderungszone: 11,9 % der Differenz (kappt 5,5 %-Vollsatz).
 */
export function soliJahresbetrag(jahresLst: Money, istSplitting = false): Money {
  const grenze = istSplitting
    ? LOHNSTEUER_PARAMETER_2025.soli_freigrenze_jahr_splitting
    : LOHNSTEUER_PARAMETER_2025.soli_freigrenze_jahr_einzel;
  if (jahresLst.lessThan(grenze) || jahresLst.equals(grenze)) {
    return Money.zero();
  }
  const voll = jahresLst.times(LOHNSTEUER_PARAMETER_2025.soli_prozent).div(100);
  const milderung = jahresLst
    .minus(grenze)
    .times(LOHNSTEUER_PARAMETER_2025.soli_milderungszone_faktor)
    .div(100);
  return voll.lessThan(milderung) ? voll : milderung;
}

export function kirchensteuerProzent(bl: Bundesland): Money {
  if (bl === "BY") return LOHNSTEUER_PARAMETER_2025.kirchensteuer_prozent_by;
  if (bl === "BW") return LOHNSTEUER_PARAMETER_2025.kirchensteuer_prozent_bw;
  return LOHNSTEUER_PARAMETER_2025.kirchensteuer_prozent_default;
}

export function kirchensteuerJahresbetrag(
  jahresLst: Money,
  bl: Bundesland
): Money {
  return jahresLst.times(kirchensteuerProzent(bl)).div(100);
}
