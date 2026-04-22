/**
 * Service-Layer für `ustid_verifications` (Sprint 19.A).
 *
 * Dual-Mode:
 *   - DEMO: localStorage via `store.getUstIdVerifications`.
 *   - Supabase: Tabelle aus Migration 0037 (WORM, § 18e UStG).
 *
 * Phase-19.A-Scope: Log-Persistenz + Lookup. Der eigentliche VIES-Call
 * (Edge Function `verify-ust-idnr`) wird in Phase 19.B ergänzt.
 */

import type {
  UstIdVerification,
  UstIdVerificationSource,
} from "../types/db";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";
import {
  buildUvPayload,
  verifyUvChain,
  type ChainBreakReason,
  type ChainVerificationResult,
} from "../domain/gobd/hashChainVerifier";
import { computeChainHash } from "../lib/crypto/sha256Canonical";

/**
 * Sprint 20.A.2: verification_source ist optional in Log-Inputs.
 * Default ist 'VIES' (zurück-kompatibel mit Sprint-19-Aufrufern, die
 * das Feld nie gesetzt haben).
 */
export type LogVerificationInput = Omit<
  UstIdVerification,
  | "id"
  | "created_at"
  | "entstehungsjahr"
  | "retention_until"
  | "verification_source"
> & {
  verification_source?: UstIdVerificationSource;
};

function retentionUntilFor(isoDate: string): string {
  const y = new Date(isoDate).getFullYear();
  return `${y + 10}-12-31`;
}

export async function logVerification(
  input: LogVerificationInput
): Promise<UstIdVerification> {
  const now = new Date().toISOString();
  const entstehungsjahr = new Date(now).getFullYear();
  const retention_until = retentionUntilFor(now);

  if (!shouldUseSupabase()) {
    // Sprint 20.B.5: Hash-Kette pro client_id.
    // ID vor Payload-Build generieren, weil die ID Teil des Payloads ist.
    const id = uid();
    const verification_source = input.verification_source ?? "VIES";
    // prev_hash = verification_hash der neuesten bisherigen Row dieses clients.
    // Sort: created_at DESC, id DESC (muss zum DB-Trigger in 0039 passen).
    const existing = store
      .getUstIdVerifications()
      .filter((v) => v.client_id === input.client_id);
    const prevVerificationHash =
      existing.length === 0
        ? null
        : existing.reduce((best, v) => {
            if (v.created_at > best.created_at) return v;
            if (v.created_at < best.created_at) return best;
            return v.id > best.id ? v : best;
          }).verification_hash ?? null;
    const payload = await buildUvPayload({
      id,
      partner_id: input.partner_id,
      raw_http_response: input.raw_http_response,
      requested_ust_idnr: input.requested_ust_idnr,
      verification_source,
      verification_status: input.verification_status,
      created_at: now,
    });
    const verification_hash = await computeChainHash(
      prevVerificationHash,
      payload
    );
    const next: UstIdVerification = {
      id,
      company_id: input.company_id,
      client_id: input.client_id,
      partner_id: input.partner_id,
      requested_ust_idnr: input.requested_ust_idnr,
      requester_ust_idnr: input.requester_ust_idnr,
      raw_http_response: input.raw_http_response,
      raw_http_response_headers: input.raw_http_response_headers,
      raw_http_request_url: input.raw_http_request_url,
      vies_valid: input.vies_valid,
      vies_request_date: input.vies_request_date,
      vies_request_identifier: input.vies_request_identifier,
      vies_trader_name: input.vies_trader_name,
      vies_trader_address: input.vies_trader_address,
      vies_raw_parsed: input.vies_raw_parsed,
      verification_status: input.verification_status,
      verification_source,
      error_message: input.error_message,
      entstehungsjahr,
      retention_until,
      retention_hold: input.retention_hold,
      retention_hold_reason: input.retention_hold_reason,
      created_at: now,
      created_by: input.created_by,
      prev_hash: prevVerificationHash,
      verification_hash,
      // DEMO: server_recorded_at = now(); Supabase setzt das per DB-DEFAULT.
      server_recorded_at: now,
    };
    store.setUstIdVerifications([...store.getUstIdVerifications(), next]);
    return next;
  }

  const companyId = requireCompanyId();
  const payload = {
    company_id: companyId,
    client_id: input.client_id,
    partner_id: input.partner_id,
    requested_ust_idnr: input.requested_ust_idnr,
    requester_ust_idnr: input.requester_ust_idnr,
    raw_http_response: input.raw_http_response,
    raw_http_response_headers: input.raw_http_response_headers,
    raw_http_request_url: input.raw_http_request_url,
    vies_valid: input.vies_valid,
    vies_request_date: input.vies_request_date,
    vies_request_identifier: input.vies_request_identifier,
    vies_trader_name: input.vies_trader_name,
    vies_trader_address: input.vies_trader_address,
    vies_raw_parsed: input.vies_raw_parsed,
    verification_status: input.verification_status,
    verification_source: input.verification_source ?? "VIES",
    error_message: input.error_message,
    retention_until,
    retention_hold: input.retention_hold,
    retention_hold_reason: input.retention_hold_reason,
  };
  const { data, error } = await supabase
    .from("ustid_verifications")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as UstIdVerification;
}

export async function getVerificationsForPartner(
  partnerId: string
): Promise<UstIdVerification[]> {
  if (!shouldUseSupabase()) {
    return store
      .getUstIdVerifications()
      .filter((v) => v.partner_id === partnerId)
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("ustid_verifications")
    .select("*")
    .eq("partner_id", partnerId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as UstIdVerification[];
}

export async function getLatestVerification(
  clientId: string,
  ustIdnr: string
): Promise<UstIdVerification | null> {
  if (!shouldUseSupabase()) {
    const matches = store
      .getUstIdVerifications()
      .filter(
        (v) => v.client_id === clientId && v.requested_ust_idnr === ustIdnr
      );
    if (matches.length === 0) return null;
    return matches.reduce((latest, v) =>
      v.created_at > latest.created_at ? v : latest
    );
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("ustid_verifications")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("requested_ust_idnr", ustIdnr)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as UstIdVerification | null) ?? null;
}

// ---------------------------------------------------------------------------
// Sprint 20.B.4 · Chain-Verifikation für ustid_verifications
// ---------------------------------------------------------------------------

type UvRpcRow = {
  verification_id: string;
  is_valid: boolean;
  reason: ChainBreakReason | null;
};

function aggregateUvRpcRows(
  rows: UvRpcRow[] | null,
  totalCount: number
): ChainVerificationResult {
  if (!rows || rows.length === 0) {
    return {
      valid: true,
      count: totalCount,
      brokenAt: null,
      reason: null,
    };
  }
  const firstBreak = rows.find((r) => r.is_valid === false) ?? rows[0];
  return {
    valid: false,
    count: totalCount,
    brokenAt: {
      index: -1,
      id: firstBreak.verification_id,
    },
    reason: firstBreak.reason,
  };
}

/**
 * Verifiziert die Hash-Kette aller `ustid_verifications`-Rows für einen
 * Mandanten.
 *
 * DEMO-Mode: liest aus localStorage, sortiert (created_at ASC, id ASC),
 *   delegiert an `verifyUvChain`.
 * Supabase-Mode: RPC `verify_uv_chain(p_client_id)` — Verifikation läuft
 *   DB-seitig (Migration 0039).
 */
export async function verifyUvChainForClient(
  clientId: string
): Promise<ChainVerificationResult> {
  if (!shouldUseSupabase()) {
    const verifications = store
      .getUstIdVerifications()
      .filter((v) => v.client_id === clientId)
      .slice()
      .sort((a, b) => {
        const tCmp = a.created_at.localeCompare(b.created_at);
        if (tCmp !== 0) return tCmp;
        return a.id.localeCompare(b.id);
      });
    return verifyUvChain(verifications);
  }

  const companyId = requireCompanyId();
  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "verify_uv_chain",
    { p_client_id: clientId }
  );
  if (rpcErr) throw new Error(rpcErr.message);

  const { count, error: cntErr } = await supabase
    .from("ustid_verifications")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("client_id", clientId);
  if (cntErr) throw new Error(cntErr.message);

  return aggregateUvRpcRows(rpcData as UvRpcRow[] | null, count ?? 0);
}
