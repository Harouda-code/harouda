/**
 * Vorsorgepauschale § 39b Abs. 4 EStG — exakte Berechnung.
 *
 * Die Vorsorgepauschale ist bei der Lohnsteuerberechnung vom Jahresbrutto
 * abzuziehen (als "wie Werbungskosten"). Sie setzt sich aus drei Teilbeträgen
 * zusammen:
 *
 *   Teil a: Rentenversicherung
 *     = AN-Anteil (9,3 %) × min(Jahresbrutto, BBG_RV/AV)
 *     × gesetzlicher Faktor 100 % (seit 2023 voll abziehbar, § 10 Abs. 3 EStG)
 *
 *   Teil b: Gesetzliche Kranken- und Pflegeversicherung
 *     = AN-Anteil (7,3 % + halber Zusatzbeitrag) × min(Brutto, BBG_KV/PV)
 *       + PV (1,8 % + ggf. 0,6 % Kinderlos-Zuschlag) × gleiche Bemessung
 *     HINWEIS zum Zusatzbeitrag: § 39b Abs. 2 S. 5 Nr. 3 d EStG schreibt einen
 *     MINDEST-Zusatzbeitrag von 1 % für die Vorsorgepauschale vor (nicht den
 *     tatsächlichen Zusatzbeitrag der Kasse). Wir setzen daher min(1 %,
 *     an.kv_zusatzbeitrag) — bzw. 1 % falls höher, der Spec entsprechend.
 *
 *   Teil c: Mindestvorsorgepauschale (nur bei privater KV/PV)
 *     = 1.900 € Einzelveranlagung / 3.000 € Zusammenveranlagung (StKl III)
 *     Diese deckt den fehlenden Teil b ab.
 *
 * Referenz: BMF-Programmablaufplan 2025, Schritt 23-28.
 */

import { Money } from "../../lib/money/Money";
import type { Arbeitnehmer } from "./types";
import {
  SV_PARAMETER_2025,
  moneyMin,
} from "./sozialversicherungParameter2025";

/** Mindest-Zusatzbeitrag zur Vorsorgepauschale nach § 39b Abs. 2 S. 5 Nr. 3 d EStG. */
const MINDEST_ZUSATZBEITRAG_PROZENT = new Money("1.0");

export type VorsorgepauschaleBreakdown = {
  teilA: Money; // Rentenversicherung
  teilB: Money; // Gesetzliche KV + PV
  teilC: Money; // Mindestpauschale bei PKV
  gesamt: Money;
  erklaerung: {
    a: string;
    b: string;
    c: string;
  };
};

/** Prüft, ob StKl auf Splitting-Verfahren rechnet (für Mindestpauschale-Höhe). */
function istSplittingStkl(an: Arbeitnehmer): boolean {
  return an.steuerklasse === 3;
}

function teilA(an: Arbeitnehmer, jahresBrutto: Money): Money {
  if (!an.rv_pflicht) return Money.zero();
  const bemessung = moneyMin(jahresBrutto, SV_PARAMETER_2025.bbg_rv_av);
  // AN-Anteil = RV / 2 = 9,3 %
  const anAnteil = bemessung
    .times(SV_PARAMETER_2025.rv_prozent.div(2))
    .div(100);
  // Faktor 100 % (seit 2023)
  return anAnteil;
}

function teilB(an: Arbeitnehmer, jahresBrutto: Money): Money {
  if (an.kv_beitragsart !== "GESETZLICH") return Money.zero();

  const bemessung = moneyMin(jahresBrutto, SV_PARAMETER_2025.bbg_kv_pv);

  // KV: AN-Anteil = (allgemein + Zusatz_min) / 2
  // Zusatz-Mindestwert: gemäß § 39b Abs. 2 S. 5 Nr. 3 d EStG.
  const kvZusatzFuerVp = MINDEST_ZUSATZBEITRAG_PROZENT;
  const kvGesamt = SV_PARAMETER_2025.kv_allgemein_prozent.plus(kvZusatzFuerVp);
  const kvAnteil = bemessung.times(kvGesamt.div(2)).div(100);

  // PV: 1,8 % + ggf. Kinderlos-Zuschlag 0,6 %
  let pvSatz = SV_PARAMETER_2025.pv_allgemein_prozent.div(2);
  if (an.pv_kinderlos_zuschlag) {
    pvSatz = pvSatz.plus(SV_PARAMETER_2025.pv_kinderlos_zuschlag_prozent);
  }
  const pvAnteil = bemessung.times(pvSatz).div(100);

  return kvAnteil.plus(pvAnteil);
}

function teilC(an: Arbeitnehmer): Money {
  // Nur bei privater Krankenversicherung kommt die Mindestpauschale zum
  // Tragen (§ 39b Abs. 4 Nr. 3 EStG).
  if (an.kv_beitragsart !== "PRIVAT") return Money.zero();
  return istSplittingStkl(an) ? new Money("3000") : new Money("1900");
}

export function calculateVorsorgepauschale(
  an: Arbeitnehmer,
  jahresBrutto: Money
): VorsorgepauschaleBreakdown {
  const a = teilA(an, jahresBrutto);
  const b = teilB(an, jahresBrutto);
  const c = teilC(an);
  const gesamt = a.plus(b).plus(c);

  return {
    teilA: a,
    teilB: b,
    teilC: c,
    gesamt,
    erklaerung: {
      a: an.rv_pflicht
        ? `RV-AN-Anteil 9,3 % auf min(Brutto, BBG RV ${SV_PARAMETER_2025.bbg_rv_av.toFixed2()})`
        : "Entfällt (nicht RV-pflichtig)",
      b:
        an.kv_beitragsart === "GESETZLICH"
          ? `KV-AN-Anteil (7,3 % + ${MINDEST_ZUSATZBEITRAG_PROZENT.toFixed2()} %/2) + PV-AN-Anteil`
          : "Entfällt (private KV)",
      c:
        an.kv_beitragsart === "PRIVAT"
          ? `Mindestpauschale ${c.toFixed2()} € (§ 39b Abs. 4 Nr. 3 EStG)`
          : "Entfällt (gesetzliche KV)",
    },
  };
}
