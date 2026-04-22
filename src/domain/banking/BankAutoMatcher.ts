/**
 * Bank-Auto-Matcher (Sprint 16 / Schritt 4).
 *
 * Konservativer, transparenter Matcher: pro Bank-Transaktion werden
 * KANDIDATEN fuer ein Journal-Entry-Matching zurueckgegeben — mit
 * Confidence-Score (0 bis 1) und einem reasoning-Array, damit der
 * User nachvollziehen kann, warum ein Match vorgeschlagen wird.
 *
 * WICHTIG — kein stilles Auto-Booking: dieser Matcher persistiert NICHTS.
 * Die Persistenz passiert erst nach User-Zustimmung ueber `upsertMatch()`
 * mit match_status="auto_matched".
 *
 * Regeln (gerundet, konservativer Default):
 *  - Betrag exakt + Datum exakt          → confidence 1.00
 *  - Betrag exakt + Datum +-1 Tag        → 0.90
 *  - Betrag exakt + Datum +-3 Tage       → 0.75
 *  - Betrag +-1 Cent + Datum exakt       → 0.60
 *  - VWZ enthaelt Buchungstext/Belegnr   → Boost +0.10 (Cap 1.00)
 *  - Alles andere                        → kein Kandidat.
 *
 * Jede Regel wird als String ins reasoning-Array protokolliert.
 */

export type BankAutoMatchBankInput = {
  id: string;
  datum: string;
  betrag: number;
  vwz: string;
  iban_gegenkonto?: string;
};

export type BankAutoMatchJournalInput = {
  id: string;
  datum: string;
  betrag: number;
  buchungstext?: string;
  belegnr?: string;
};

export type BankAutoMatchCandidateHit = {
  journal_entry_id: string;
  confidence: number;
  reasoning: string[];
};

export type BankAutoMatchCandidate = {
  bank_transaction_id: string;
  bank_transaction_fingerprint: string;
  bank_datum: string;
  bank_betrag: number;
  bank_vwz: string;
  matches: BankAutoMatchCandidateHit[];
};

export type AutoMatcherTolerance = {
  /** max. zulaessiger Datums-Abstand in Tagen (default 3). */
  date_days?: number;
  /** max. zulaessiger Betrags-Abstand in Cent (default 0 = exakt). */
  amount_cents?: number;
};

export type AutoMatcherParams = {
  bankTransactions: BankAutoMatchBankInput[];
  journalEntries: BankAutoMatchJournalInput[];
  tolerance?: AutoMatcherTolerance;
  /**
   * Optionaler Pre-Computed-Fingerprint pro Bank-Tx (falls aussen
   * berechnet). Wird sonst leer zurueckgegeben — der Caller setzt
   * den Fingerprint beim `upsertMatch`-Aufruf.
   */
  fingerprints?: Record<string, string>;
};

/** ISO-Datum → Millisekunden seit Epoche. */
function toMs(iso: string): number {
  // YYYY-MM-DD sicher parsen (nicht Date-Constructor-Locale-abhaengig).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return 0;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function daysBetween(a: string, b: string): number {
  return Math.abs((toMs(a) - toMs(b)) / 86_400_000);
}

function centsDiff(a: number, b: number): number {
  return Math.abs(Math.round(a * 100) - Math.round(b * 100));
}

function normalize(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function textMatchBoost(
  vwz: string,
  journal: BankAutoMatchJournalInput
): { boost: number; reason?: string } {
  const needle = normalize(vwz);
  const txtn = normalize(journal.buchungstext ?? "");
  const belegn = normalize(journal.belegnr ?? "");
  if (txtn && needle.includes(txtn)) {
    return { boost: 0.1, reason: "VWZ enthält Buchungstext" };
  }
  if (belegn && needle.includes(belegn)) {
    return { boost: 0.1, reason: "VWZ enthält Belegnr" };
  }
  return { boost: 0 };
}

function scoreMatch(
  bank: BankAutoMatchBankInput,
  journal: BankAutoMatchJournalInput,
  tolerance: Required<AutoMatcherTolerance>
): BankAutoMatchCandidateHit | null {
  const cents = centsDiff(bank.betrag, journal.betrag);
  const days = daysBetween(bank.datum, journal.datum);

  // Harte Filter.
  if (cents > tolerance.amount_cents + 1) return null; // max. 1 Cent Extra-Tol
  if (days > tolerance.date_days) return null;

  const reasoning: string[] = [];
  let confidence = 0;

  if (cents === 0) {
    reasoning.push("Betrag exakt");
    if (days === 0) {
      confidence = 1.0;
      reasoning.push("Datum exakt");
    } else if (days <= 1) {
      confidence = 0.9;
      reasoning.push("Datum ±1 Tag");
    } else if (days <= 3) {
      confidence = 0.75;
      reasoning.push("Datum ±3 Tage");
    }
  } else if (cents === 1 && days === 0) {
    confidence = 0.6;
    reasoning.push("Betrag ±1 Cent");
    reasoning.push("Datum exakt");
  }

  if (confidence === 0) return null;

  const boost = textMatchBoost(bank.vwz, journal);
  if (boost.boost > 0 && boost.reason) {
    confidence = Math.min(1, confidence + boost.boost);
    reasoning.push(boost.reason);
  }

  return {
    journal_entry_id: journal.id,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
  };
}

export function findMatchCandidates(
  params: AutoMatcherParams
): BankAutoMatchCandidate[] {
  const tolerance: Required<AutoMatcherTolerance> = {
    date_days: params.tolerance?.date_days ?? 3,
    amount_cents: params.tolerance?.amount_cents ?? 0,
  };

  const results: BankAutoMatchCandidate[] = [];

  for (const bank of params.bankTransactions) {
    const hits: BankAutoMatchCandidateHit[] = [];
    for (const journal of params.journalEntries) {
      const score = scoreMatch(bank, journal, tolerance);
      if (score) hits.push(score);
    }
    // Absteigend nach confidence.
    hits.sort((a, b) => b.confidence - a.confidence);
    results.push({
      bank_transaction_id: bank.id,
      bank_transaction_fingerprint:
        params.fingerprints?.[bank.id] ?? "",
      bank_datum: bank.datum,
      bank_betrag: bank.betrag,
      bank_vwz: bank.vwz,
      matches: hits,
    });
  }

  return results;
}
