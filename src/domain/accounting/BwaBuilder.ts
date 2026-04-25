/**
 * DATEV-Form-01 BWA (Monatlich + YTD).
 *
 * Die BWA berechnet:
 *   - Monatswert: nur Buchungen im gewählten Monat
 *   - Jahreswert: YTD von 01.01. bis Monatsende
 *   - Vergleichsperiode (optional): Vormonat oder Vorjahr, jeweils Monatswert
 *
 * Die Aggregation nutzt Money-Präzision. Die Zuordnung Konto → BWA-Zeile
 * folgt BWA_STRUCTURE: SKR03-Ranges haben Vorrang, GuV-Refs sind Fallback.
 * SUBTOTALs werden deterministisch aus Komponenten errechnet — NEGATIVE
 * Komponenten gehen mit Minus-Vorzeichen ein.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import { BWA_STRUCTURE, type BwaLineDef } from "./bwaStructure";
import { buildGuv } from "./GuvBuilder";

export type VergleichsPeriode = "VORMONAT" | "VORJAHR" | "NONE";

export type BwaOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  monat: number; // 1–12
  jahr: number;
  vergleichsperiode?: VergleichsPeriode;
};

export type BwaLineView = {
  code: string;
  name: string;
  direction: BwaLineDef["direction"];
  monatsWert: string;
  jahresWert: string;
  /** Vergleichswert (gleicher Zeitraum der Vergleichsperiode), leer bei NONE. */
  vergleichWert: string;
  /** % vom Umsatz (jahresWert). */
  percentVomUmsatz: string;
  isSubtotal: boolean;
  isFinalResult: boolean;
  formula?: string;
};

export type BwaReport = {
  monat: number;
  jahr: number;
  bezeichnung: string;

  betriebsleistung: string;
  rohertrag: string;
  betriebsergebnis: string;
  ergebnisVorSteuern: string;
  vorlaeufigesErgebnis: string;

  positionen: BwaLineView[];

  kennzahlen: {
    rohertragsQuote: string; // Rohertrag / Betriebsleistung
    personalkostenQuote: string; // Personalkosten / Umsatz
    umsatzrendite: string; // Vorl. Ergebnis / Umsatz
    materialKostenQuote: string;
  };

  _internal: {
    betriebsleistung: Money;
    rohertrag: Money;
    betriebsergebnis: Money;
    ergebnisVorSteuern: Money;
    vorlaeufigesErgebnis: Money;
    umsatz: Money;
    personalkosten: Money;
  };

  metadata: {
    generatedAt: string;
    vergleichsperiode: VergleichsPeriode;
    kanzleiReport: "BWA Form 01 (Standardgliederung)";
  };
};

const MONAT_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function lastDayOfMonth(jahr: number, monat: number): string {
  // monat 1-12; JS Date month is 0-indexed, day 0 → last day of previous.
  const d = new Date(jahr, monat, 0);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function firstDayOfMonth(jahr: number, monat: number): string {
  return `${jahr}-${String(monat).padStart(2, "0")}-01`;
}

/** Aggregiert Journal-Einträge pro Konto innerhalb [periodStart, periodEnd].
 *  normalSide bestimmt Vorzeichen (Aufwand: soll-haben; Ertrag: haben-soll). */
function aggregateByRanges(
  accounts: Account[],
  entries: JournalEntry[],
  ranges: Array<[number, number]>,
  periodStart: string,
  periodEnd: string,
  sign: "AUFWAND" | "ERTRAG"
): Money {
  const inPeriod = entries.filter(
    (e) => e.status === "gebucht" && e.datum >= periodStart && e.datum <= periodEnd
  );

  let sum = Money.zero();
  for (const acc of accounts) {
    if (!acc.is_active) continue;
    // MONEY_SAFE: account number as integer.
    const n = Number(acc.konto_nr);
    if (!Number.isFinite(n)) continue;
    const inRange = ranges.some(([f, t]) => n >= f && n <= t);
    if (!inRange) continue;
    let soll = Money.zero();
    let haben = Money.zero();
    for (const e of inPeriod) {
      const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
      if (e.soll_konto === acc.konto_nr) soll = soll.plus(betrag);
      if (e.haben_konto === acc.konto_nr) haben = haben.plus(betrag);
    }
    sum = sum.plus(sign === "AUFWAND" ? soll.minus(haben) : haben.minus(soll));
  }
  return sum;
}

/** Ermittelt Geldwert für eine BWA-Zeile für eine Periode. */
function amountForLine(
  def: BwaLineDef,
  accounts: Account[],
  entries: JournalEntry[],
  periodStart: string,
  periodEnd: string
): Money {
  if (def.direction === "SUBTOTAL") {
    // Subtotals werden später errechnet, hier 0
    return Money.zero();
  }
  const sign: "AUFWAND" | "ERTRAG" =
    def.direction === "NEGATIVE" ? "AUFWAND" : "ERTRAG";

  // Pfad 1: explizite SKR03-Ranges
  if (def.skr03_ranges && def.skr03_ranges.length > 0) {
    return aggregateByRanges(
      accounts,
      entries,
      def.skr03_ranges,
      periodStart,
      periodEnd,
      sign
    );
  }
  // Pfad 2: Fallback über GuV-Posten
  if (def.guv_refs && def.guv_refs.length > 0) {
    const guv = buildGuv(accounts, entries, {
      periodStart,
      stichtag: periodEnd,
      sizeClass: "ALL",
      verfahren: "GKV",
    });
    let total = Money.zero();
    for (const ref of def.guv_refs) {
      const p = guv.positionen.find((x) => x.reference_code === ref);
      if (p) total = total.plus(p.amountRaw);
    }
    return total;
  }
  return Money.zero();
}

function safePercent(num: Money, denom: Money): string {
  if (denom.isZero()) return "—";
  return num.div(denom).times(100).toFixed2();
}

export function buildBwa(options: BwaOptions): BwaReport {
  const { accounts, entries, monat, jahr } = options;
  if (monat < 1 || monat > 12) {
    throw new Error(`BwaBuilder: ungültiger Monat ${monat} (1–12 erwartet)`);
  }
  const vergleich = options.vergleichsperiode ?? "NONE";

  const monatStart = firstDayOfMonth(jahr, monat);
  const monatEnd = lastDayOfMonth(jahr, monat);
  const jahrStart = `${jahr}-01-01`;
  const jahrEnd = monatEnd; // YTD bis Monatsende

  // Vergleichsperiode
  let vergleichStart: string | null = null;
  let vergleichEnd: string | null = null;
  if (vergleich === "VORMONAT") {
    if (monat === 1) {
      vergleichStart = firstDayOfMonth(jahr - 1, 12);
      vergleichEnd = lastDayOfMonth(jahr - 1, 12);
    } else {
      vergleichStart = firstDayOfMonth(jahr, monat - 1);
      vergleichEnd = lastDayOfMonth(jahr, monat - 1);
    }
  } else if (vergleich === "VORJAHR") {
    vergleichStart = firstDayOfMonth(jahr - 1, monat);
    vergleichEnd = lastDayOfMonth(jahr - 1, monat);
  }

  // 1) Rohwerte je Zeile (POSITIVE/NEGATIVE nur — SUBTOTAL = 0)
  const monatRaw = new Map<string, Money>();
  const jahrRaw = new Map<string, Money>();
  const vglRaw = new Map<string, Money>();

  for (const def of BWA_STRUCTURE) {
    monatRaw.set(
      def.code,
      amountForLine(def, accounts, entries, monatStart, monatEnd)
    );
    jahrRaw.set(
      def.code,
      amountForLine(def, accounts, entries, jahrStart, jahrEnd)
    );
    if (vergleichStart && vergleichEnd) {
      vglRaw.set(
        def.code,
        amountForLine(def, accounts, entries, vergleichStart, vergleichEnd)
      );
    } else {
      vglRaw.set(def.code, Money.zero());
    }
  }

  // 2) Subtotals berechnen. Components mit führendem "-" werden subtrahiert,
  //    alle anderen addiert. Das ist explizit und context-unabhängig.
  function computeSubtotal(def: BwaLineDef, bucket: Map<string, Money>): Money {
    let sum = Money.zero();
    for (const raw of def.components ?? []) {
      const subtract = raw.startsWith("-");
      const code = subtract ? raw.slice(1) : raw;
      const val = bucket.get(code) ?? Money.zero();
      sum = subtract ? sum.minus(val) : sum.plus(val);
    }
    return sum;
  }

  // Iterate in definition order so subtotals compute on top of already-
  // resolved subtotals (BL before RE before BRE before GK before BE ...).
  for (const def of BWA_STRUCTURE) {
    if (def.direction !== "SUBTOTAL") continue;
    monatRaw.set(def.code, computeSubtotal(def, monatRaw));
    jahrRaw.set(def.code, computeSubtotal(def, jahrRaw));
    if (vergleichStart && vergleichEnd) {
      vglRaw.set(def.code, computeSubtotal(def, vglRaw));
    }
  }

  // 3) Kennzahlen (aus YTD-Werten)
  const umsatz = jahrRaw.get("1") ?? Money.zero();
  const betriebsleistung = jahrRaw.get("BL") ?? Money.zero();
  const rohertrag = jahrRaw.get("RE") ?? Money.zero();
  const betriebsergebnis = jahrRaw.get("BE") ?? Money.zero();
  const ergebnisVorSteuern = jahrRaw.get("EVS") ?? Money.zero();
  const vorlaeufigesErgebnis = jahrRaw.get("VE") ?? Money.zero();
  const personalkosten = jahrRaw.get("10") ?? Money.zero();
  const material = (jahrRaw.get("4") ?? Money.zero()).plus(
    jahrRaw.get("5") ?? Money.zero()
  );

  const kennzahlen = {
    rohertragsQuote: safePercent(rohertrag, betriebsleistung),
    personalkostenQuote: safePercent(personalkosten, umsatz),
    umsatzrendite: safePercent(vorlaeufigesErgebnis, umsatz),
    materialKostenQuote: safePercent(material, umsatz),
  };

  // 4) Positionen für UI
  const positionen: BwaLineView[] = BWA_STRUCTURE.map((def) => {
    const jahrVal = jahrRaw.get(def.code) ?? Money.zero();
    return {
      code: def.code,
      name: def.name,
      direction: def.direction,
      monatsWert: (monatRaw.get(def.code) ?? Money.zero()).toFixed2(),
      jahresWert: jahrVal.toFixed2(),
      vergleichWert: (vglRaw.get(def.code) ?? Money.zero()).toFixed2(),
      percentVomUmsatz: safePercent(jahrVal, umsatz),
      isSubtotal: def.direction === "SUBTOTAL",
      isFinalResult: def.is_final_result === true,
      formula: def.computation,
    };
  });

  return {
    monat,
    jahr,
    bezeichnung: `${MONAT_NAMES[monat - 1]} ${jahr}`,
    betriebsleistung: betriebsleistung.toFixed2(),
    rohertrag: rohertrag.toFixed2(),
    betriebsergebnis: betriebsergebnis.toFixed2(),
    ergebnisVorSteuern: ergebnisVorSteuern.toFixed2(),
    vorlaeufigesErgebnis: vorlaeufigesErgebnis.toFixed2(),
    positionen,
    kennzahlen,
    _internal: {
      betriebsleistung,
      rohertrag,
      betriebsergebnis,
      ergebnisVorSteuern,
      vorlaeufigesErgebnis,
      umsatz,
      personalkosten,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      vergleichsperiode: vergleich,
      kanzleiReport: "BWA Form 01 (Standardgliederung)",
    },
  };
}
