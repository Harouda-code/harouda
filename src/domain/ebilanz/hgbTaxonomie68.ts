/**
 * HGB-Taxonomie 6.8 (2025-04-01) — E-Bilanz-Mapping (§ 5b EStG).
 *
 * Mapped werden die HGB § 266-Zeilen und § 275-Posten, die unsere Engine
 * produziert, auf XBRL-Elemente der de-gaap-ci-Taxonomie. Die vollständige
 * Taxonomie hat tausende Elemente; wir bilden nur diejenigen ab, die unser
 * Composite-Pattern-Baum tatsächlich füllt. Fehlende Elemente werden im
 * XBRL-Output weggelassen (Taxonomie erlaubt optional-Felder).
 *
 * Taxonomie-Download: https://www.esteuer.de/download/taxonomien/
 * Version: 6.8 (gültig für Wirtschaftsjahre ab 2025).
 */

export const EBILANZ_NAMESPACES = {
  xbrli: "http://www.xbrl.org/2003/instance",
  link: "http://www.xbrl.org/2003/linkbase",
  iso4217: "http://www.xbrl.org/2003/iso4217",
  "de-gaap-ci": "http://www.xbrl.de/taxonomies/de-gaap-ci-2025-04-01",
  "de-gcd": "http://www.xbrl.de/taxonomies/de-gcd-2025-04-01",
  xlink: "http://www.w3.org/1999/xlink",
  xsi: "http://www.w3.org/2001/XMLSchema-instance",
} as const;

export type Rechtsform =
  | "Einzelunternehmen"
  | "GbR"
  | "PartG"
  | "OHG"
  | "KG"
  | "GmbH"
  | "AG"
  | "UG"
  | "SE"
  | "SonstigerRechtsform";

export type Groessenklasse = "kleinst" | "klein" | "mittel" | "gross";

export type Status = "Entwurf" | "Endgueltig" | "Zurueckgezogen";

/** Bilanz § 266 → XBRL-Element. Reihenfolge irrelevant, nur Lookup. */
export const BILANZ_XBRL_MAP: Record<string, string> = {
  // AKTIVA
  A: "de-gaap-ci:bs.ass.fixAss",
  "A.I": "de-gaap-ci:bs.ass.fixAss.intang",
  "A.I.1": "de-gaap-ci:bs.ass.fixAss.intang.selfCreated",
  "A.I.2": "de-gaap-ci:bs.ass.fixAss.intang.concessions",
  "A.I.3": "de-gaap-ci:bs.ass.fixAss.intang.goodwill",
  "A.I.4": "de-gaap-ci:bs.ass.fixAss.intang.advances",
  "A.II": "de-gaap-ci:bs.ass.fixAss.tang",
  "A.II.1": "de-gaap-ci:bs.ass.fixAss.tang.land",
  "A.II.2": "de-gaap-ci:bs.ass.fixAss.tang.techMachines",
  "A.II.3": "de-gaap-ci:bs.ass.fixAss.tang.otherEquipment",
  "A.II.4": "de-gaap-ci:bs.ass.fixAss.tang.advancesAndConstr",
  "A.III": "de-gaap-ci:bs.ass.fixAss.finAss",
  "A.III.1": "de-gaap-ci:bs.ass.fixAss.finAss.sharesInAffiliatedCompanies",
  "A.III.3": "de-gaap-ci:bs.ass.fixAss.finAss.investments",
  B: "de-gaap-ci:bs.ass.currAss",
  "B.I": "de-gaap-ci:bs.ass.currAss.inventory",
  "B.I.1": "de-gaap-ci:bs.ass.currAss.inventory.rawMat",
  "B.I.2": "de-gaap-ci:bs.ass.currAss.inventory.workInProgress",
  "B.I.3": "de-gaap-ci:bs.ass.currAss.inventory.finishedGoods",
  "B.II": "de-gaap-ci:bs.ass.currAss.receiv",
  "B.II.1": "de-gaap-ci:bs.ass.currAss.receiv.tradeReceiv",
  "B.II.4": "de-gaap-ci:bs.ass.currAss.receiv.other",
  "B.III": "de-gaap-ci:bs.ass.currAss.secu",
  "B.IV": "de-gaap-ci:bs.ass.currAss.cash",
  C: "de-gaap-ci:bs.ass.accrualsDeferred",
  D: "de-gaap-ci:bs.ass.deferredTax",
  E: "de-gaap-ci:bs.ass.diffAssetOffsetting",

  // PASSIVA
  "P.A": "de-gaap-ci:bs.eqLiab.equity",
  "P.A.I": "de-gaap-ci:bs.eqLiab.equity.subscribedCap",
  "P.A.II": "de-gaap-ci:bs.eqLiab.equity.capReserve",
  "P.A.III": "de-gaap-ci:bs.eqLiab.equity.retainedEarnings",
  "P.A.IV": "de-gaap-ci:bs.eqLiab.equity.profitCarriedForward",
  "P.A.V": "de-gaap-ci:bs.eqLiab.equity.netIncome",

  "P.B": "de-gaap-ci:bs.eqLiab.accruals",
  "P.B.2": "de-gaap-ci:bs.eqLiab.accruals.taxAccruals",
  "P.B.3": "de-gaap-ci:bs.eqLiab.accruals.other",
  "P.C": "de-gaap-ci:bs.eqLiab.liab",
  "P.C.1": "de-gaap-ci:bs.eqLiab.liab.bonds",
  "P.C.2": "de-gaap-ci:bs.eqLiab.liab.banks",
  "P.C.4": "de-gaap-ci:bs.eqLiab.liab.trade",
  "P.C.8": "de-gaap-ci:bs.eqLiab.liab.other",
  "P.D": "de-gaap-ci:bs.eqLiab.accrualsDeferred",
  "P.E": "de-gaap-ci:bs.eqLiab.deferredTax",
};

/** GuV § 275 GKV → XBRL-Element. */
export const GUV_XBRL_MAP: Record<string, string> = {
  "1": "de-gaap-ci:is.netIncome.regular.saleRev",
  "2": "de-gaap-ci:is.netIncome.regular.inventMod",
  "3": "de-gaap-ci:is.netIncome.regular.otherOwnWorkCapital",
  "4": "de-gaap-ci:is.netIncome.regular.otherOpIncome",
  "5": "de-gaap-ci:is.netIncome.regular.matCosts",
  "5.a": "de-gaap-ci:is.netIncome.regular.matCosts.rawMat",
  "5.b": "de-gaap-ci:is.netIncome.regular.matCosts.extServ",
  "6": "de-gaap-ci:is.netIncome.regular.staffCosts",
  "6.a": "de-gaap-ci:is.netIncome.regular.staffCosts.wages",
  "6.b": "de-gaap-ci:is.netIncome.regular.staffCosts.socSec",
  "7": "de-gaap-ci:is.netIncome.regular.depreciation",
  "7.a": "de-gaap-ci:is.netIncome.regular.depreciation.fixAss",
  "7.b": "de-gaap-ci:is.netIncome.regular.depreciation.currAssExtraord",
  "8": "de-gaap-ci:is.netIncome.regular.otherOpExpense",
  "9": "de-gaap-ci:is.netIncome.regular.financialResult.incomeFromInvestments",
  "10":
    "de-gaap-ci:is.netIncome.regular.financialResult.incomeOtherSecurities",
  "11": "de-gaap-ci:is.netIncome.regular.financialResult.interestIncome",
  "12": "de-gaap-ci:is.netIncome.regular.financialResult.depreciation",
  "13": "de-gaap-ci:is.netIncome.regular.financialResult.interestExpense",
  "14": "de-gaap-ci:is.netIncome.regular.taxesOnIncome",
  "15": "de-gaap-ci:is.netIncome.regular.netIncomeAfterTax",
  "16": "de-gaap-ci:is.netIncome.regular.otherTaxes",
  "17": "de-gaap-ci:is.netIncome.final",
};

export function bilanzElement(ref: string): string | undefined {
  return BILANZ_XBRL_MAP[ref];
}
export function guvElement(ref: string): string | undefined {
  return GUV_XBRL_MAP[ref];
}

/** Anzahl gemappter Elemente (für Reporting / Validierung). */
export function mappingStats(): {
  bilanzCount: number;
  guvCount: number;
  total: number;
} {
  return {
    bilanzCount: Object.keys(BILANZ_XBRL_MAP).length,
    guvCount: Object.keys(GUV_XBRL_MAP).length,
    total:
      Object.keys(BILANZ_XBRL_MAP).length + Object.keys(GUV_XBRL_MAP).length,
  };
}
