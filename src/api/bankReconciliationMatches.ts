/**
 * Service-Layer fuer bank_reconciliation_matches (Sprint 16 / Schritt 3).
 *
 * Dual-Mode:
 *  - DEMO: localStorage via `store.getBankReconMatches` / `setBankReconMatches`.
 *  - Supabase: `bank_reconciliation_matches`-Tabelle (Migration 0031) mit
 *    RLS ueber company_id + RESTRICTIVE client_id-Konsistenz.
 *
 * Alle Operationen sind pro Mandant (clientId). Der Fingerprint ist der
 * natuerliche Upsert-Key (zusammen mit client_id).
 */

import type {
  BankReconciliationMatch,
  BankReconMatchStatus,
} from "../types/db";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type CreateMatchInput = {
  client_id: string;
  bank_transaction_id: string;
  bank_transaction_fingerprint: string;
  journal_entry_id: string | null;
  match_status: BankReconMatchStatus;
  match_confidence?: number;
  notiz?: string;
  matched_by_user_id?: string;
};

/**
 * Liefert alle Match-Records eines Mandanten. Reihenfolge: neueste
 * zuerst (matched_at desc).
 */
export async function listMatches(
  clientId: string
): Promise<BankReconciliationMatch[]> {
  if (!shouldUseSupabase()) {
    return store
      .getBankReconMatches()
      .filter((m) => m.client_id === clientId)
      .slice()
      .sort((a, b) => (b.matched_at ?? "").localeCompare(a.matched_at ?? ""));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("bank_reconciliation_matches")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("matched_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BankReconciliationMatch[];
}

/**
 * Upsert nach (client_id, bank_transaction_fingerprint). Ein vorhandener
 * Record mit gleichem Fingerprint wird ueberschrieben — das erlaubt,
 * einen "pending_review"-Record spaeter zu einem "matched" oder
 * "ignored" zu machen.
 */
export async function upsertMatch(
  input: CreateMatchInput
): Promise<BankReconciliationMatch> {
  if (!shouldUseSupabase()) {
    const all = store.getBankReconMatches();
    const idx = all.findIndex(
      (m) =>
        m.client_id === input.client_id &&
        m.bank_transaction_fingerprint ===
          input.bank_transaction_fingerprint
    );
    const now = new Date().toISOString();
    const existing = idx >= 0 ? all[idx] : null;
    const next: BankReconciliationMatch = {
      id: existing?.id ?? uid(),
      company_id: existing?.company_id ?? null,
      client_id: input.client_id,
      bank_transaction_id: input.bank_transaction_id,
      bank_transaction_fingerprint: input.bank_transaction_fingerprint,
      journal_entry_id: input.journal_entry_id,
      match_status: input.match_status,
      match_confidence:
        typeof input.match_confidence === "number"
          ? input.match_confidence
          : existing?.match_confidence ?? null,
      matched_at: now,
      matched_by_user_id:
        input.matched_by_user_id ?? existing?.matched_by_user_id ?? null,
      notiz: input.notiz ?? existing?.notiz ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    const copy = all.slice();
    if (idx >= 0) copy[idx] = next;
    else copy.unshift(next);
    store.setBankReconMatches(copy);
    return next;
  }
  const companyId = requireCompanyId();
  const payload = {
    company_id: companyId,
    client_id: input.client_id,
    bank_transaction_id: input.bank_transaction_id,
    bank_transaction_fingerprint: input.bank_transaction_fingerprint,
    journal_entry_id: input.journal_entry_id,
    match_status: input.match_status,
    match_confidence: input.match_confidence ?? null,
    notiz: input.notiz ?? null,
    matched_by_user_id: input.matched_by_user_id ?? null,
    matched_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("bank_reconciliation_matches")
    .upsert(payload, {
      onConflict: "client_id,bank_transaction_fingerprint",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as BankReconciliationMatch;
}

/** Loescht einen Match-Record. */
export async function deleteMatch(id: string): Promise<void> {
  if (!shouldUseSupabase()) {
    const all = store.getBankReconMatches();
    const next = all.filter((m) => m.id !== id);
    store.setBankReconMatches(next);
    return;
  }
  const companyId = requireCompanyId();
  const { error } = await supabase
    .from("bank_reconciliation_matches")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

/** Schnelllookup ueber den Fingerprint-Index. */
export async function getMatchByFingerprint(
  clientId: string,
  fingerprint: string
): Promise<BankReconciliationMatch | null> {
  if (!shouldUseSupabase()) {
    return (
      store
        .getBankReconMatches()
        .find(
          (m) =>
            m.client_id === clientId &&
            m.bank_transaction_fingerprint === fingerprint
        ) ?? null
    );
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("bank_reconciliation_matches")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("bank_transaction_fingerprint", fingerprint)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BankReconciliationMatch | null) ?? null;
}

/**
 * Aggregations-Helper: zaehlt pro Status. Wird von
 * `BankReconciliationGaps.ts` (E1) konsumiert.
 */
export async function countMatchesByStatus(
  clientId: string
): Promise<Record<BankReconMatchStatus, number>> {
  const matches = await listMatches(clientId);
  const base: Record<BankReconMatchStatus, number> = {
    matched: 0,
    ignored: 0,
    pending_review: 0,
    auto_matched: 0,
  };
  for (const m of matches) base[m.match_status] += 1;
  return base;
}
