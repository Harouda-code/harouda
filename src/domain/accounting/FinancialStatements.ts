/**
 * Kombinierter Jahresabschluss-Builder: Bilanz + GuV mit GoBD-Cross-Check.
 *
 * GoBD Rz. 58 verlangt konsistente Aufzeichnungen — Bilanz (§ 266) und
 * GuV (§ 275) müssen dasselbe Jahresergebnis ausweisen. Systematische
 * Abweichungen entstehen, wenn Konten in beiden Mappings unterschiedlich
 * bewertet werden (z. B. Ertragsteuern-Konten 7600-7699 erscheinen in der
 * GuV als Nr. 14, in SKR03_ERFOLG_RULES für die Bilanz-Vorschau aber nicht).
 * Der Cross-Check flag't diese Differenzen an.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import type { SizeClass } from "./hgb266Structure";
import {
  buildBalanceSheet,
  type BalanceSheetReport,
} from "./BalanceSheetBuilder";
import { buildGuv, type GuvReport, type Verfahren } from "./GuvBuilder";

export type JahresabschlussOptions = {
  periodStart?: string;
  stichtag?: string;
  sizeClass?: SizeClass;
  verfahren?: Verfahren;
};

export type JahresabschlussReport = {
  bilanz: BalanceSheetReport;
  guv: GuvReport;
  crossCheck: {
    bilanzProvisionalResult: string;
    guvJahresergebnis: string;
    difference: string;
    matches: boolean;
    /** Differenz innerhalb Cent-Toleranz (< 0.01€). */
    withinCentTolerance: boolean;
  };
  isConsistent: boolean;
  inconsistencies: string[];
};

const CENT_TOLERANCE = new Money("0.01");

export function buildJahresabschluss(
  accounts: Account[],
  entries: JournalEntry[],
  options: JahresabschlussOptions = {}
): JahresabschlussReport {
  const year = new Date().getFullYear();
  const periodStart = options.periodStart ?? `${year}-01-01`;
  const stichtag = options.stichtag ?? `${year}-12-31`;
  const sizeClass: SizeClass = options.sizeClass ?? "ALL";
  const verfahren: Verfahren = options.verfahren ?? "GKV";

  const bilanz = buildBalanceSheet(accounts, entries, {
    stichtag,
    sizeClass,
  });
  const guv = buildGuv(accounts, entries, {
    periodStart,
    stichtag,
    sizeClass,
    verfahren,
  });

  const bilanzResult = bilanz._internal.provisionalResult;
  const guvResult = guv._internal.jahresergebnis;
  const diff = bilanzResult.minus(guvResult);
  const absDiff = diff.abs();

  const matches = bilanzResult.equals(guvResult);
  const withinCentTolerance = absDiff.lessThan(CENT_TOLERANCE);

  const inconsistencies: string[] = [];
  if (!withinCentTolerance) {
    inconsistencies.push(
      `Bilanz vorläufiges Ergebnis (${bilanzResult.toFixed2()} €) weicht ab von ` +
        `GuV Jahresergebnis (${guvResult.toFixed2()} €). ` +
        `Differenz: ${diff.toFixed2()} €. ` +
        `Mögliche Ursache: Konten die in skr03GuvMapping.ts ODER skr03Mapping.ts ` +
        `(SKR03_ERFOLG_RULES) unterschiedlich zugeordnet werden — z. B. Ertragsteuern ` +
        `(7600-7699), Zinsaufwand (2300-2399) oder Finanzerträge (2600-2699) sind ` +
        `in der GuV-Mapping erfasst, in der Bilanz-Ergebnisvorschau aber nicht.`
    );
  }

  return {
    bilanz,
    guv,
    crossCheck: {
      bilanzProvisionalResult: bilanzResult.toFixed2(),
      guvJahresergebnis: guvResult.toFixed2(),
      difference: diff.toFixed2(),
      matches,
      withinCentTolerance,
    },
    isConsistent: inconsistencies.length === 0,
    inconsistencies,
  };
}
