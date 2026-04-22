// Cashflow-Projektion (Heuristik, KEINE ML / KEIN Prognosemodell).
//
// Das Ziel ist eine ehrliche Liquiditätsvorschau auf Basis der vorhandenen
// offenen Posten (OPOS), der historischen Zahlungsmoral (days-to-pay) sowie
// optionaler Steuerfristen. Es ist KEIN statistisches Modell, sondern eine
// regelbasierte Hochrechnung mit sichtbaren Annahmen.
//
// Eingaben:
//   - entries:  alle Journalbuchungen (für OPOS + historische Zahlungsanalyse)
//   - accounts: Kontenplan (um Forderungen/Verbindlichkeiten zu erkennen)
//   - upcomingDeadlines: optionale Fristen mit geschätzten Zahlungsbeträgen
//     (aus DeadlinesPage oder UStVA-Modul). Wenn leer, fliessen keine
//     Steuerzahlungen in die Projektion.
//
// Ausgaben:
//   - series:   pro Kalendertag Summe Eingang, Ausgang und kumulierter Saldo
//   - items:    flache Liste aller projizierten Ereignisse
//   - meta:     Anzahl historischer Samples, Median/P75 der days-to-pay etc.
//
// Konfidenz-Flag ist bewusst grob: "hoch/mittel/niedrig" je nach Datenmenge.

import type { Account, JournalEntry } from "../types/db";
import { buildOpenItems, type OpenItem } from "../api/opos";

export type Confidence = "hoch" | "mittel" | "niedrig";

export type ForecastItem = {
  /** Kalendertag der Projektion (ISO YYYY-MM-DD) */
  date: string;
  /** Betrag — positiv bei Eingang, negativ bei Ausgang */
  amount: number;
  direction: "inflow" | "outflow";
  source: "receivable" | "payable" | "deadline";
  label: string;
  /** Ursprungsdaten-Referenz (beleg_nr oder deadline-ID) */
  ref: string;
  /** Grob: "hoch" wenn basiert auf vielen historischen Datenpunkten */
  confidence: Confidence;
  /** Zusätzlicher Hinweistext */
  note?: string;
  /** Nur bei Forderungen: Anteil der historisch verspäteten Zahlungen dieses
   *  Kunden (0..1). Undefined, wenn keine ausreichende Historie vorliegt. */
  customerLateRatio?: number;
};

export type DayPoint = {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  running: number;
};

export type CashflowForecast = {
  horizonDays: number;
  /** ISO, inklusive */
  startDate: string;
  endDate: string;
  series: DayPoint[];
  items: ForecastItem[];
  meta: {
    /** Median Tage zwischen Rechnungs- und Zahlungsdatum bei fakturierten Forderungen */
    historicMedianDaysToPay: number | null;
    /** Durchschnitt (mittels Mittelwert) der days-to-pay */
    historicMeanDaysToPay: number | null;
    /** Anzahl historisch bezahlter Belege, die in die Schätzung eingegangen sind */
    historicSampleSize: number;
    confidence: Confidence;
    /** Summe aller offenen Forderungen zum Stichtag */
    openReceivables: number;
    /** Summe aller offenen Verbindlichkeiten */
    openPayables: number;
    /** Ausgangssaldo für die Projektion (Start-Saldo) */
    openingBalance: number;
  };
};

export type DeadlinePayment = {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  amount: number; // positiv, wird als Ausgang gebucht
};

type ComputeInput = {
  entries: JournalEntry[];
  accounts: Account[];
  /** Start-Saldo (z. B. Summe Bank + Kasse aktuell), optional */
  openingBalance?: number;
  /** Optionale Steuerfristen mit geschätzten Beträgen */
  deadlines?: DeadlinePayment[];
  /** Horizont in Tagen, Default 90 */
  horizonDays?: number;
  /** Bewertungsstichtag (für Tests einstellbar) */
  now?: Date;
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function confidenceFromSampleSize(n: number): Confidence {
  if (n >= 15) return "hoch";
  if (n >= 5) return "mittel";
  return "niedrig";
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = Math.max(
    0,
    Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p))
  );
  return sorted[idx];
}

/** Pro-Kunde (normalisiert auf gegenseite-Schlüssel bzw. client_id) berechnet
 *  Median, P75 und die Late-Ratio (Anteil der Zahlungen, die > 14 Tage nach
 *  Rechnungsdatum eingingen). */
export type CustomerPaymentStats = {
  median: number;
  p75: number;
  sampleSize: number;
  /** Anteil Zahlungen > 14 Tage nach Rechnungsdatum, 0..1. */
  lateRatio: number;
};

export function perCustomerDaysToPayStats(
  entries: JournalEntry[],
  accounts: Account[],
  paymentTerm = 14
): Map<string, CustomerPaymentStats> {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  function isReceivable(n: string): boolean {
    const acc = byNr.get(n);
    if (!acc) return false;
    const num = Number(acc.konto_nr);
    return Number.isFinite(num) && num >= 1400 && num <= 1499;
  }

  // Pro Beleg: Rechnungsdatum + Zahlungsdatum + Kunde
  type State = {
    firstInvoiceDate: string | null;
    lastPaymentDate: string | null;
    delta: number;
    customer: string | null;
  };
  const buckets = new Map<string, State>();

  for (const e of entries) {
    const amt = Number(e.betrag);
    if (!Number.isFinite(amt) || amt === 0) continue;
    const sollRec = isReceivable(e.soll_konto);
    const habenRec = isReceivable(e.haben_konto);
    if (!sollRec && !habenRec) continue;

    const key = `F:${e.beleg_nr || e.id}`;
    const customer = e.client_id ?? e.gegenseite ?? null;
    const b = buckets.get(key) ?? {
      firstInvoiceDate: null,
      lastPaymentDate: null,
      delta: 0,
      customer,
    };
    if (sollRec) {
      b.delta += amt;
      if (!b.firstInvoiceDate || e.datum < b.firstInvoiceDate)
        b.firstInvoiceDate = e.datum;
      if (!b.customer && customer) b.customer = customer;
    }
    if (habenRec) {
      b.delta -= amt;
      if (!b.lastPaymentDate || e.datum > b.lastPaymentDate)
        b.lastPaymentDate = e.datum;
    }
    buckets.set(key, b);
  }

  // Nach Kunde gruppieren
  const byCustomer = new Map<string, number[]>();
  for (const b of buckets.values()) {
    if (Math.abs(b.delta) >= 0.005) continue;
    if (!b.firstInvoiceDate || !b.lastPaymentDate || !b.customer) continue;
    const days = Math.round(
      (new Date(b.lastPaymentDate).getTime() -
        new Date(b.firstInvoiceDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (days < 0) continue;
    const arr = byCustomer.get(b.customer) ?? [];
    arr.push(days);
    byCustomer.set(b.customer, arr);
  }

  const out = new Map<string, CustomerPaymentStats>();
  for (const [customer, daysArr] of byCustomer.entries()) {
    const sorted = [...daysArr].sort((a, b) => a - b);
    const median = percentile(sorted, 0.5);
    const p75 = percentile(sorted, 0.75);
    const late = sorted.filter((d) => d > paymentTerm).length;
    out.set(customer, {
      median,
      p75,
      sampleSize: sorted.length,
      lateRatio: sorted.length > 0 ? late / sorted.length : 0,
    });
  }
  return out;
}

/**
 * Analysiert alle Buchungen und berechnet für jede vollständig bezahlte
 * Forderung die Differenz zwischen Rechnungs- und Ausgleichsdatum.
 * Gibt Median und Mittelwert zurück.
 */
export function analyzeHistoricDaysToPay(
  entries: JournalEntry[],
  accounts: Account[]
): {
  median: number | null;
  mean: number | null;
  sampleSize: number;
} {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  type State = {
    firstInvoiceDate: string | null;
    lastPaymentDate: string | null;
    delta: number;
  };
  const buckets = new Map<string, State>();

  function isReceivable(n: string): boolean {
    const acc = byNr.get(n);
    if (!acc) return false;
    const num = Number(acc.konto_nr);
    return Number.isFinite(num) && num >= 1400 && num <= 1499;
  }

  for (const e of entries) {
    const amt = Number(e.betrag);
    if (!Number.isFinite(amt) || amt === 0) continue;
    const sollIsReceivable = isReceivable(e.soll_konto);
    const habenIsReceivable = isReceivable(e.haben_konto);
    if (!sollIsReceivable && !habenIsReceivable) continue;

    const key = `F:${e.beleg_nr || e.id}`;
    const b = buckets.get(key) ?? {
      firstInvoiceDate: null,
      lastPaymentDate: null,
      delta: 0,
    };

    if (sollIsReceivable) {
      // Rechnungseröffnung
      b.delta += amt;
      if (!b.firstInvoiceDate || e.datum < b.firstInvoiceDate)
        b.firstInvoiceDate = e.datum;
    }
    if (habenIsReceivable) {
      // Zahlungseingang
      b.delta -= amt;
      if (!b.lastPaymentDate || e.datum > b.lastPaymentDate)
        b.lastPaymentDate = e.datum;
    }
    buckets.set(key, b);
  }

  const samples: number[] = [];
  for (const b of buckets.values()) {
    if (Math.abs(b.delta) >= 0.005) continue; // nicht voll beglichen
    if (!b.firstInvoiceDate || !b.lastPaymentDate) continue;
    const inv = new Date(b.firstInvoiceDate).getTime();
    const pay = new Date(b.lastPaymentDate).getTime();
    const days = Math.round((pay - inv) / (1000 * 60 * 60 * 24));
    if (days < 0) continue; // Plausibilität
    samples.push(days);
  }

  if (samples.length === 0) {
    return { median: null, mean: null, sampleSize: 0 };
  }

  samples.sort((a, b) => a - b);
  const mid = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? Math.round((samples[mid - 1] + samples[mid]) / 2)
      : samples[mid];
  const mean = Math.round(
    samples.reduce((s, v) => s + v, 0) / samples.length
  );
  return { median, mean, sampleSize: samples.length };
}

/**
 * Projiziert eine offene Forderung in die Zukunft.
 * Regel:
 *   - Wenn Fälligkeit in Zukunft: Zahlungsdatum = Fälligkeit + max(0, median_days_to_pay − zugehörige_zahlfrist)
 *     Vereinfacht: Fälligkeit + max(0, medianOffset).
 *   - Wenn bereits überfällig: heute + geschätzter Rest-Verzug (clipped).
 *
 * `medianOffset` ist die historische Abweichung von Fälligkeit zu Zahlung.
 * Wenn wir keine Historie haben, setzen wir 0 (optimistische Erwartung)
 * und markieren Konfidenz = "niedrig".
 */
function projectReceivable(
  item: OpenItem,
  now: Date,
  globalMedianOffset: number,
  globalConfidence: Confidence,
  customerStats: CustomerPaymentStats | null,
  assumedPaymentTerm: number
): ForecastItem {
  const due = new Date(item.faelligkeit);
  const today = new Date(isoDay(now));

  // Wenn Kundenhistorie reicht (≥ 3 Belege), diese verwenden; sonst global.
  const useCustomer =
    customerStats !== null && customerStats.sampleSize >= 3;
  const effectiveMedian = useCustomer
    ? customerStats!.median
    : globalMedianOffset + assumedPaymentTerm;
  const offset = Math.max(0, effectiveMedian - assumedPaymentTerm);
  const lateRatio = useCustomer ? customerStats!.lateRatio : null;

  let projected: Date;
  if (due >= today) {
    projected = addDays(due, offset);
  } else {
    const extra = Math.min(45, offset);
    projected = addDays(today, extra);
  }

  // Confidence: bei großer Kundenstichprobe höher gewichten
  let confidence: Confidence = globalConfidence;
  if (useCustomer) {
    confidence = confidenceFromSampleSize(customerStats!.sampleSize);
  }

  const noteParts: string[] = [];
  if (item.ueberfaellig_tage > 0) {
    noteParts.push(`bereits ${item.ueberfaellig_tage} Tage überfällig`);
  }
  if (useCustomer) {
    const latePct = Math.round(customerStats!.lateRatio * 100);
    noteParts.push(
      `Kundenhistorie: ${customerStats!.sampleSize} Rechnungen, Median ${customerStats!.median} Tage, ${latePct}% verspätet`
    );
  }

  return {
    date: isoDay(projected),
    amount: item.offen,
    direction: "inflow",
    source: "receivable",
    label: `Forderung ${item.beleg_nr} — ${item.gegenseite}`,
    ref: item.beleg_nr,
    confidence,
    note: noteParts.length > 0 ? noteParts.join(" · ") : undefined,
    ...(lateRatio !== null ? { customerLateRatio: lateRatio } : {}),
  } as ForecastItem;
}

/**
 * Verbindlichkeiten projizieren wir auf Fälligkeit (Annahme: pünktliche
 * Zahlung). Wenn überfällig, projizieren wir auf heute.
 */
function projectPayable(item: OpenItem, now: Date): ForecastItem {
  const due = new Date(item.faelligkeit);
  const today = new Date(isoDay(now));
  const projected = due >= today ? due : today;
  return {
    date: isoDay(projected),
    amount: item.offen,
    direction: "outflow",
    source: "payable",
    label: `Verbindlichkeit ${item.beleg_nr} — ${item.gegenseite}`,
    ref: item.beleg_nr,
    confidence: "hoch",
  };
}

export function computeCashflowForecast(input: ComputeInput): CashflowForecast {
  const now = input.now ?? new Date();
  const horizon = input.horizonDays ?? 90;
  const startDate = isoDay(now);
  const endDate = isoDay(addDays(now, horizon));
  const endMs = addDays(now, horizon).getTime();
  const openingBalance = input.openingBalance ?? 0;

  // 1) Historische Zahlungsmoral
  const history = analyzeHistoricDaysToPay(input.entries, input.accounts);
  const confidence = confidenceFromSampleSize(history.sampleSize);
  // medianOffset = wie viele Tage *nach* Fälligkeit wird im Schnitt bezahlt?
  // Da unser Median die Differenz Rechnung→Zahlung ist und typ. Zahlungsziel
  // 14 Tage beträgt, nehmen wir als Offset median − 14 (mind. 0).
  const assumedPaymentTerm = 14;
  const medianOffset =
    history.median !== null
      ? Math.max(0, history.median - assumedPaymentTerm)
      : 0;

  // 2) Offene Posten
  const open = buildOpenItems(input.entries, input.accounts, now);
  const receivables = open.filter((i) => i.kind === "forderung");
  const payables = open.filter((i) => i.kind === "verbindlichkeit");

  // Pro-Kunde-Statistik einmalig berechnen, dann für jede Forderung nutzen.
  const customerStats = perCustomerDaysToPayStats(
    input.entries,
    input.accounts,
    assumedPaymentTerm
  );

  const items: ForecastItem[] = [];
  for (const r of receivables) {
    const customerKey = r.client_id ?? r.gegenseite ?? null;
    const stats = customerKey ? customerStats.get(customerKey) ?? null : null;
    const proj = projectReceivable(
      r,
      now,
      medianOffset,
      confidence,
      stats,
      assumedPaymentTerm
    );
    if (new Date(proj.date).getTime() <= endMs)
      items.push(proj);
  }
  for (const p of payables) {
    const proj = projectPayable(p, now);
    if (new Date(proj.date).getTime() <= endMs)
      items.push(proj);
  }

  // 3) Steuerfristen
  for (const d of input.deadlines ?? []) {
    const t = new Date(d.date).getTime();
    if (t < now.getTime() || t > endMs) continue;
    items.push({
      date: d.date,
      amount: Math.abs(d.amount),
      direction: "outflow",
      source: "deadline",
      label: d.label,
      ref: d.id,
      confidence: "mittel",
      note: "geschätzte Steuerzahlung",
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  // 4) Tages-Reihe aufbauen
  const byDay = new Map<string, { inflow: number; outflow: number }>();
  for (const it of items) {
    const b = byDay.get(it.date) ?? { inflow: 0, outflow: 0 };
    if (it.direction === "inflow") b.inflow += it.amount;
    else b.outflow += it.amount;
    byDay.set(it.date, b);
  }

  const series: DayPoint[] = [];
  let running = openingBalance;
  for (let i = 0; i <= horizon; i++) {
    const day = isoDay(addDays(now, i));
    const b = byDay.get(day) ?? { inflow: 0, outflow: 0 };
    const net = b.inflow - b.outflow;
    running += net;
    series.push({
      date: day,
      inflow: b.inflow,
      outflow: b.outflow,
      net,
      running: Math.round(running * 100) / 100,
    });
  }

  return {
    horizonDays: horizon,
    startDate,
    endDate,
    series,
    items,
    meta: {
      historicMedianDaysToPay: history.median,
      historicMeanDaysToPay: history.mean,
      historicSampleSize: history.sampleSize,
      confidence,
      openReceivables: receivables.reduce((s, r) => s + r.offen, 0),
      openPayables: payables.reduce((s, p) => s + p.offen, 0),
      openingBalance,
    },
  };
}
