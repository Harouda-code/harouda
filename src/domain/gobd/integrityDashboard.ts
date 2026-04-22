/**
 * Sprint 20.C.2 · Unified Integrity-Dashboard-Aggregator.
 *
 * Führt die vier Chain-Verifier parallel aus und normalisiert die
 * unterschiedlichen Return-Shapes auf einen gemeinsamen `ChainStatus`.
 *
 * Scoping:
 *   - journal: per company_id (intern via fetchEntries, nutzt den
 *              aktiven Company-Context).
 *   - audit:   per company_id (verifyAuditChain nutzt den aktiven
 *              Context intern).
 *   - bpv:     per client_id (Parameter).
 *   - uv:      per client_id (Parameter).
 *
 * Der `clientId`-Parameter von `runIntegrityCheck` wird an BPV+UV
 * durchgereicht; journal+audit ignorieren ihn und greifen auf den
 * aktiven Company-Scope zu.
 *
 * Scope: MVP (Sprint 20.C). `invoice_xml_archive` ist NICHT enthalten
 * (Sprint 21+).
 */

import { verifyJournalChain } from "../../utils/journalChain";
import { verifyAuditChain } from "../../api/audit";
import { verifyBpvChainForClient } from "../../api/businessPartners";
import { verifyUvChainForClient } from "../../api/ustidVerifications";
import { fetchEntries } from "../../api/journal";
import { getActiveCompanyId } from "../../api/db";

export type ChainName = "journal" | "audit" | "bpv" | "uv";

export type ChainStatus = {
  chain: ChainName;
  valid: boolean;
  count: number;
  brokenAt: { index: number; id: string } | null;
  reason: string | null;
  /** ISO-Timestamp der einzelnen Chain-Verifikation (UTC). */
  checkedAt: string;
  /** Laufzeit in Millisekunden (≥ 0). */
  durationMs: number;
};

export type IntegrityReport = {
  clientId: string;
  companyId: string | null;
  /** ISO-Timestamp des gesamten Reports (vor Promise.all). */
  checkedAt: string;
  chains: ChainStatus[];
  overallValid: boolean;
};

// ---------------------------------------------------------------------------
// Zeitmessung: performance.now falls verfügbar (Browser + Node >=16 + happy-dom),
// sonst Date.now-Fallback.
// ---------------------------------------------------------------------------
function now(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = now();
  const value = await fn();
  const end = now();
  return { value, ms: Math.max(0, end - start) };
}

// ---------------------------------------------------------------------------
// Pro-Chain-Wrapper
// ---------------------------------------------------------------------------

async function runJournal(): Promise<ChainStatus> {
  const checkedAt = new Date().toISOString();
  const { value, ms } = await timed(async () => {
    const entries = await fetchEntries();
    return verifyJournalChain(entries);
  });
  return {
    chain: "journal",
    valid: value.ok,
    count: value.total,
    brokenAt: value.ok
      ? null
      : {
          index: value.firstBreakIndex ?? -1,
          id: value.firstBreakEntryId ?? "unknown",
        },
    reason: value.ok ? null : value.message,
    checkedAt,
    durationMs: ms,
  };
}

async function runAudit(): Promise<ChainStatus> {
  const checkedAt = new Date().toISOString();
  const { value, ms } = await timed(() => verifyAuditChain());
  return {
    chain: "audit",
    valid: value.ok,
    count: value.total,
    brokenAt: value.ok
      ? null
      : {
          index: value.firstBreakAt ?? -1,
          // Audit-Log hat keinen expliziten id-Rückgabewert; wir bilden
          // eine stabile Pseudo-ID aus der Break-Position, damit das
          // `ChainStatus`-Shape einheitlich bleibt.
          id: `audit-entry#${(value.firstBreakAt ?? -1) + 1}`,
        },
    reason: value.ok ? null : value.message,
    checkedAt,
    durationMs: ms,
  };
}

async function runBpv(clientId: string): Promise<ChainStatus> {
  const checkedAt = new Date().toISOString();
  const { value, ms } = await timed(() => verifyBpvChainForClient(clientId));
  return {
    chain: "bpv",
    valid: value.valid,
    count: value.count,
    brokenAt: value.brokenAt,
    reason: value.reason,
    checkedAt,
    durationMs: ms,
  };
}

async function runUv(clientId: string): Promise<ChainStatus> {
  const checkedAt = new Date().toISOString();
  const { value, ms } = await timed(() => verifyUvChainForClient(clientId));
  return {
    chain: "uv",
    valid: value.valid,
    count: value.count,
    brokenAt: value.brokenAt,
    reason: value.reason,
    checkedAt,
    durationMs: ms,
  };
}

// ---------------------------------------------------------------------------
// Haupt-Entry-Point
// ---------------------------------------------------------------------------

/**
 * Führt alle vier Chain-Verifier parallel aus und aggregiert das Ergebnis.
 *
 * Bei Exceptions in einer einzelnen Chain: der Fehler bleibt nicht
 * uncaught — `Promise.all` wirft bei erstem Rejected-Promise weiter an
 * den Caller. Das ist gewollt, weil eine Chain-Exception (z. B.
 * Crypto-API nicht verfügbar) den ganzen Report entwertet.
 */
export async function runIntegrityCheck(
  clientId: string
): Promise<IntegrityReport> {
  const checkedAt = new Date().toISOString();
  const companyId = getActiveCompanyId();
  const [journal, audit, bpv, uv] = await Promise.all([
    runJournal(),
    runAudit(),
    runBpv(clientId),
    runUv(clientId),
  ]);
  const chains = [journal, audit, bpv, uv];
  const overallValid = chains.every((c) => c.valid);
  return {
    clientId,
    companyId,
    checkedAt,
    chains,
    overallValid,
  };
}
