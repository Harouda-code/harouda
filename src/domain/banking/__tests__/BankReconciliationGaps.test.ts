// Sprint 16 / Schritt 6 · BankReconciliationGaps-Tests (Sprint 16
// erweitert + ersetzt die Minimal-Tests aus E1).

import { describe, it, expect, beforeEach } from "vitest";
import {
  BANK_RECON_PENDING_ERROR_THRESHOLD_PCT,
  detectBankReconciliationGaps,
  getBankReconStatusSummary,
} from "../BankReconciliationGaps";
import { upsertMatch } from "../../../api/bankReconciliationMatches";

const CLIENT = "client-gaps-test";

async function seedMatches(counts: {
  matched?: number;
  auto_matched?: number;
  ignored?: number;
  pending_review?: number;
}): Promise<void> {
  const statuses = [
    ["matched", counts.matched ?? 0],
    ["auto_matched", counts.auto_matched ?? 0],
    ["ignored", counts.ignored ?? 0],
    ["pending_review", counts.pending_review ?? 0],
  ] as const;
  let counter = 0;
  for (const [status, n] of statuses) {
    for (let i = 0; i < n; i++) {
      counter += 1;
      await upsertMatch({
        client_id: CLIENT,
        bank_transaction_id: `tx-${counter}`,
        bank_transaction_fingerprint: `fp-${counter}`,
        journal_entry_id: status === "ignored" ? null : `je-${counter}`,
        match_status: status,
      });
    }
  }
}

beforeEach(() => {
  localStorage.clear();
});

describe("BankReconciliationGaps · getBankReconStatusSummary", () => {
  it("#1 Null-clientId → total=0, keine Exception", async () => {
    const r = await getBankReconStatusSummary(null);
    expect(r.total).toBe(0);
    expect(r.pending).toBe(0);
    expect(r.exceeds_error_threshold).toBe(false);
  });

  it("#2 Leere Match-Tabelle → total=0", async () => {
    const r = await getBankReconStatusSummary(CLIENT);
    expect(r.total).toBe(0);
    expect(r.matched).toBe(0);
    expect(r.pending).toBe(0);
  });

  it("#3 Alle matched + auto_matched → pending=0, unter Threshold", async () => {
    await seedMatches({ matched: 5, auto_matched: 3 });
    const r = await getBankReconStatusSummary(CLIENT);
    expect(r.total).toBe(8);
    expect(r.matched).toBe(8);
    expect(r.pending).toBe(0);
    expect(r.pending_pct).toBe(0);
    expect(r.exceeds_error_threshold).toBe(false);
  });

  it("#4 3/100 pending = 3% → unter 5%-Threshold (warning-Zone)", async () => {
    await seedMatches({ matched: 97, pending_review: 3 });
    const r = await getBankReconStatusSummary(CLIENT);
    expect(r.total).toBe(100);
    expect(r.pending).toBe(3);
    expect(r.pending_pct).toBeCloseTo(0.03, 2);
    expect(r.exceeds_error_threshold).toBe(false);
  });

  it("#5 20/100 pending = 20% → über 5%-Threshold (error-Zone)", async () => {
    await seedMatches({ matched: 80, pending_review: 20 });
    const r = await getBankReconStatusSummary(CLIENT);
    expect(r.total).toBe(100);
    expect(r.pending).toBe(20);
    expect(r.pending_pct).toBeCloseTo(0.2, 2);
    expect(r.exceeds_error_threshold).toBe(true);
  });

  it("#6 Ignorierte Records zaehlen in total, aber nicht als pending", async () => {
    await seedMatches({ matched: 5, ignored: 3 });
    const r = await getBankReconStatusSummary(CLIENT);
    expect(r.total).toBe(8);
    expect(r.ignored).toBe(3);
    expect(r.pending).toBe(0);
  });

  it("#7 THRESHOLD-Konstante ist 5% (konservativer GoBD-Default)", () => {
    expect(BANK_RECON_PENDING_ERROR_THRESHOLD_PCT).toBe(0.05);
  });
});

describe("BankReconciliationGaps · detectBankReconciliationGaps (Legacy)", () => {
  it("#8 liefert leeres Array (bewusst — pro-Konto-Gaps kommen in Folge-Sprint)", async () => {
    const r = await detectBankReconciliationGaps(CLIENT, "company-1", 2025);
    expect(r).toEqual([]);
  });
});
