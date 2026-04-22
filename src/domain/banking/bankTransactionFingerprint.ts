/**
 * Bank-Transaction-Fingerprint (Sprint 16 / Schritt 3).
 *
 * Stabile, deterministische ID fuer eine Bank-Transaktion, unabhaengig
 * vom Session-State der `BankReconciliationPage`. Wird in der
 * `bank_reconciliation_matches.bank_transaction_fingerprint`-Spalte
 * als Unique-Key verwendet (anstelle einer FK, weil
 * `bank_transactions`-Tabelle nicht existiert).
 *
 * Normierung:
 *  - datum         → YYYY-MM-DD (ISO).
 *  - betrag        → toFixed(2) als string, mit Vorzeichen bei negativ.
 *  - vwz           → trim + collapse Whitespace + toLowerCase.
 *  - iban_gegenkto → trim + remove Whitespace + toUpperCase.
 *
 * Hash: SHA-256 (hex). Wiederverwendung des existierenden
 * `sha256Hex`-Helpers aus `src/lib/crypto/payrollHash.ts`.
 */

import { sha256Hex } from "../../lib/crypto/payrollHash";

export type BankTxFingerprintInput = {
  datum: string;
  betrag: number;
  vwz?: string;
  iban_gegenkonto?: string;
};

/** Normiert die Eingabefelder zu einem kanonischen String. */
export function canonicalizeBankTx(input: BankTxFingerprintInput): string {
  const datum = String(input.datum).trim();
  const betrag = Number(input.betrag).toFixed(2);
  const vwz = (input.vwz ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  const iban = (input.iban_gegenkonto ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
  return `${datum}|${betrag}|${vwz}|${iban}`;
}

/** Async SHA-256 Hex ueber den kanonisierten String. */
export async function bankTxFingerprint(
  input: BankTxFingerprintInput
): Promise<string> {
  const canonical = canonicalizeBankTx(input);
  return sha256Hex(canonical);
}
