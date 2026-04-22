/**
 * Bank-Reconciliation-Gap-Detection (Sprint E1 / erweitert Sprint 16).
 *
 * Stellt eine Aggregat-Schnittstelle für den zentralen Closing-Validator
 * bereit. **Sprint 16 Upgrade**: liefert jetzt echte Zahlen auf Basis
 * der `bank_reconciliation_matches`-Tabelle (Migration 0031), statt wie
 * zuvor nur einen Warn-Platzhalter auszugeben.
 *
 * Kardinalitaet:
 *  - total_bank_tx = Summe aller Match-Records des Mandanten.
 *    (Eine Bank-Tx, die der User noch nie gesehen/klassifiziert hat,
 *    ist nicht in der Tabelle und kann hier auch nicht mitgezaehlt
 *    werden — das ist eine bewusste Beschraenkung, solange die
 *    `bank_transactions`-Tabelle nicht existiert.)
 *  - matched = "matched" + "auto_matched"
 *  - ignored = "ignored"
 *  - pending = "pending_review"
 *
 * Threshold: 5% pending → error ("blocks closing"); sonst warning.
 * Der 5%-Default ist konservativ. Fuer spezifische Mandanten-Situationen
 * Ruecksprache mit Steuerberater empfohlen.
 */

import { countMatchesByStatus, listMatches } from "../../api/bankReconciliationMatches";

/** Schwellwert fuer "zu viele ungeklaerte Bank-Tx". */
export const BANK_RECON_PENDING_ERROR_THRESHOLD_PCT = 0.05;

/** Historisch: fuer Sites, die noch die alte Typform erwarten. */
export type BankReconciliationGap = {
  bank_konto_nr: string;
  zeitraum: { von: string; bis: string };
  ungematchte_journal_entries: number;
  ungematchte_bank_statement_zeilen: number;
  saldo_differenz: number;
};

export type BankReconStatusSummary = {
  total: number;
  matched: number;
  ignored: number;
  pending: number;
  pending_pct: number;
  /** true wenn die Zahl der pending-Records die Schwelle ueberschreitet. */
  exceeds_error_threshold: boolean;
};

/**
 * Neue Hauptfunktion (Sprint 16). Zaehlt Match-Records nach Status
 * und liefert aggregierte Kennzahlen fuer den Closing-Validator.
 */
export async function getBankReconStatusSummary(
  clientId: string | null
): Promise<BankReconStatusSummary> {
  if (!clientId) {
    return {
      total: 0,
      matched: 0,
      ignored: 0,
      pending: 0,
      pending_pct: 0,
      exceeds_error_threshold: false,
    };
  }
  const counts = await countMatchesByStatus(clientId);
  const matched = counts.matched + counts.auto_matched;
  const ignored = counts.ignored;
  const pending = counts.pending_review;
  const total = matched + ignored + pending;
  const pending_pct = total === 0 ? 0 : pending / total;
  return {
    total,
    matched,
    ignored,
    pending,
    pending_pct,
    exceeds_error_threshold:
      pending_pct > BANK_RECON_PENDING_ERROR_THRESHOLD_PCT,
  };
}

/**
 * Historische Signatur — aktuell nur `[]` zurueck, damit bestehende
 * Aufrufer in der Closing-Validation nicht brechen. Das eigentliche
 * Finding-Building passiert ueber `getBankReconStatusSummary`.
 */
export async function detectBankReconciliationGaps(
  _mandantId: string | null,
  _companyId: string,
  _jahr: number
): Promise<BankReconciliationGap[]> {
  // Bewusst leer — die aussagekraeftige Info liefert
  // getBankReconStatusSummary. In einem Folge-Sprint koennte diese
  // Funktion pro Bank-Konto aufgebrochen werden, sobald
  // `bank_transactions` als Tabelle persistiert wird.
  return [];
}

/**
 * Convenience fuer die UI: Liste ALLER Matches, wird von
 * BankReconciliationPage fuer die Status-Badge-Map benutzt.
 */
export { listMatches };
