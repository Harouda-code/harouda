/**
 * Vorjahresvergleich (§ 265 Abs. 2 HGB).
 *
 * Stellt aktuelles Jahr und Vorjahr gegenüber — Bilanz und GuV Zeile für
 * Zeile. Deltas werden mit Money-Präzision berechnet; Prozentänderungen
 * sind bei Vorjahr = 0 "—" (Division durch null).
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import type { SizeClass } from "./hgb266Structure";
import {
  buildBalanceSheet,
  flattenForRender,
  type BalanceSheetReport,
} from "./BalanceSheetBuilder";
import { buildGuv, type GuvReport } from "./GuvBuilder";

export type VorjahresvergleichOptions = {
  accountsAktuell: Account[];
  entriesAktuell: JournalEntry[];
  accountsVorjahr: Account[];
  entriesVorjahr: JournalEntry[];
  stichtagAktuell: string;
  stichtagVorjahr: string;
  periodStartAktuell: string;
  periodStartVorjahr: string;
  sizeClass?: SizeClass;
};

export type Richtung = "UP" | "DOWN" | "UNCHANGED";

export type DeltaRow = {
  reference_code: string;
  name: string;
  aktuellAmount: string;
  vorjahrAmount: string;
  absoluteDelta: string;
  percentDelta: string;
  richtung: Richtung;
};

export type VorjahresvergleichReport = {
  aktuell: { bilanz: BalanceSheetReport; guv: GuvReport };
  vorjahr: { bilanz: BalanceSheetReport; guv: GuvReport };
  bilanzDeltas: DeltaRow[];
  guvDeltas: DeltaRow[];
  summary: {
    aktivaEntwicklung: string;
    passivaEntwicklung: string;
    jahresergebnisEntwicklung: string;
    umsatzEntwicklung: string;
    ergebnisImprovement: boolean;
    anzahlSteigend: number;
    anzahlFallend: number;
    anzahlUnveraendert: number;
  };
};

/** Δ% mit sicherer Division: wenn Vorjahr = 0 → "—". Andernfalls 2 Nachkommastellen. */
function percentDelta(aktuell: Money, vorjahr: Money): string {
  if (vorjahr.isZero()) return "—";
  return aktuell
    .minus(vorjahr)
    .div(vorjahr.abs())
    .times(100)
    .toFixed2();
}

function richtungOf(delta: Money): Richtung {
  if (delta.isZero()) return "UNCHANGED";
  return delta.isPositive() ? "UP" : "DOWN";
}

function buildDeltaRow(
  reference_code: string,
  name: string,
  aktuell: Money,
  vorjahr: Money
): DeltaRow {
  const delta = aktuell.minus(vorjahr);
  return {
    reference_code,
    name,
    aktuellAmount: aktuell.toFixed2(),
    vorjahrAmount: vorjahr.toFixed2(),
    absoluteDelta: delta.toFixed2(),
    percentDelta: percentDelta(aktuell, vorjahr),
    richtung: richtungOf(delta),
  };
}

export function buildVorjahresvergleich(
  opts: VorjahresvergleichOptions
): VorjahresvergleichReport {
  const sizeClass = opts.sizeClass ?? "ALL";

  const aktuellBilanz = buildBalanceSheet(
    opts.accountsAktuell,
    opts.entriesAktuell,
    { stichtag: opts.stichtagAktuell, sizeClass }
  );
  const vorjahrBilanz = buildBalanceSheet(
    opts.accountsVorjahr,
    opts.entriesVorjahr,
    { stichtag: opts.stichtagVorjahr, sizeClass }
  );

  const aktuellGuv = buildGuv(opts.accountsAktuell, opts.entriesAktuell, {
    periodStart: opts.periodStartAktuell,
    stichtag: opts.stichtagAktuell,
    sizeClass,
    verfahren: "GKV",
  });
  const vorjahrGuv = buildGuv(opts.accountsVorjahr, opts.entriesVorjahr, {
    periodStart: opts.periodStartVorjahr,
    stichtag: opts.stichtagVorjahr,
    sizeClass,
    verfahren: "GKV",
  });

  // Bilanz-Deltas: durchlaufe AKTIVA + PASSIVA flach. Jede Zeile hat einen
  // eindeutigen reference_code — wir matchen aktuelle gegen Vorjahr anhand
  // dieser Codes.
  const vorjahrBilanzMap = new Map<string, Money>();
  for (const row of flattenForRender(vorjahrBilanz.aktivaRoot).slice(1)) {
    vorjahrBilanzMap.set(row.node.referenceCode, row.balance);
  }
  for (const row of flattenForRender(vorjahrBilanz.passivaRoot).slice(1)) {
    vorjahrBilanzMap.set(row.node.referenceCode, row.balance);
  }

  const bilanzDeltas: DeltaRow[] = [];
  const bilanzRows = [
    ...flattenForRender(aktuellBilanz.aktivaRoot).slice(1),
    ...flattenForRender(aktuellBilanz.passivaRoot).slice(1),
  ];
  const seenRefs = new Set<string>();
  for (const row of bilanzRows) {
    const code = row.node.referenceCode;
    seenRefs.add(code);
    const aktuell = row.balance;
    const vorjahr = vorjahrBilanzMap.get(code) ?? Money.zero();
    bilanzDeltas.push(buildDeltaRow(code, row.node.name, aktuell, vorjahr));
  }
  // Zeilen die NUR im Vorjahr existierten (Konto entfernt o. ä.)
  for (const [code, vorjahrVal] of vorjahrBilanzMap) {
    if (seenRefs.has(code)) continue;
    bilanzDeltas.push(
      buildDeltaRow(code, `(nur Vorjahr) ${code}`, Money.zero(), vorjahrVal)
    );
  }

  // GuV-Deltas: Positionen haben referenzierbare reference_codes in beiden Jahren.
  const vorjahrGuvMap = new Map<string, Money>();
  for (const p of vorjahrGuv.positionen) {
    vorjahrGuvMap.set(p.reference_code, p.amountRaw);
  }
  const guvDeltas: DeltaRow[] = [];
  const seenGuvRefs = new Set<string>();
  for (const p of aktuellGuv.positionen) {
    seenGuvRefs.add(p.reference_code);
    const vorjahr = vorjahrGuvMap.get(p.reference_code) ?? Money.zero();
    guvDeltas.push(
      buildDeltaRow(p.reference_code, p.name, p.amountRaw, vorjahr)
    );
  }
  for (const [code, vorjahrVal] of vorjahrGuvMap) {
    if (seenGuvRefs.has(code)) continue;
    guvDeltas.push(
      buildDeltaRow(code, `(nur Vorjahr) ${code}`, Money.zero(), vorjahrVal)
    );
  }

  // Summary
  const aktivaAkt = aktuellBilanz._internal.aktivaSum;
  const aktivaVJ = vorjahrBilanz._internal.aktivaSum;
  const passivaAkt = aktuellBilanz._internal.passivaSum;
  const passivaVJ = vorjahrBilanz._internal.passivaSum;
  const jerAkt = aktuellGuv._internal.jahresergebnis;
  const jerVJ = vorjahrGuv._internal.jahresergebnis;
  const umsatzAkt = aktuellGuv._internal.umsatzerloese;
  const umsatzVJ = vorjahrGuv._internal.umsatzerloese;

  const steigend = [...bilanzDeltas, ...guvDeltas].filter(
    (d) => d.richtung === "UP"
  ).length;
  const fallend = [...bilanzDeltas, ...guvDeltas].filter(
    (d) => d.richtung === "DOWN"
  ).length;
  const unveraendert = [...bilanzDeltas, ...guvDeltas].filter(
    (d) => d.richtung === "UNCHANGED"
  ).length;

  return {
    aktuell: { bilanz: aktuellBilanz, guv: aktuellGuv },
    vorjahr: { bilanz: vorjahrBilanz, guv: vorjahrGuv },
    bilanzDeltas,
    guvDeltas,
    summary: {
      aktivaEntwicklung: aktivaAkt.minus(aktivaVJ).toFixed2(),
      passivaEntwicklung: passivaAkt.minus(passivaVJ).toFixed2(),
      jahresergebnisEntwicklung: jerAkt.minus(jerVJ).toFixed2(),
      umsatzEntwicklung: umsatzAkt.minus(umsatzVJ).toFixed2(),
      ergebnisImprovement: jerAkt.greaterThan(jerVJ),
      anzahlSteigend: steigend,
      anzahlFallend: fallend,
      anzahlUnveraendert: unveraendert,
    },
  };
}
