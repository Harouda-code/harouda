// Sprint 16 / Schritt 3 · bankReconciliationMatches-Service-Tests.
//
// Tests laufen im DEMO-Modus (default im vitest-Environment). Sie
// verifizieren das localStorage-Branching; der Supabase-Pfad ist per
// Konstruktion identisch im Shape und wird in E2E-Deployment getestet.

import { describe, it, expect, beforeEach } from "vitest";
import {
  countMatchesByStatus,
  deleteMatch,
  getMatchByFingerprint,
  listMatches,
  upsertMatch,
} from "../bankReconciliationMatches";

const CLIENT_A = "client-A";
const CLIENT_B = "client-B";

beforeEach(() => {
  localStorage.clear();
});

describe("bankReconciliationMatches · DEMO-Mode", () => {
  it("#1 listMatches liefert [] fuer unbekannten Mandanten", async () => {
    const r = await listMatches("none");
    expect(r).toEqual([]);
  });

  it("#2 upsertMatch (create) + listMatches: ein Record sichtbar", async () => {
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-1",
      bank_transaction_fingerprint: "hash-1",
      journal_entry_id: "je-1",
      match_status: "matched",
    });
    const list = await listMatches(CLIENT_A);
    expect(list).toHaveLength(1);
    expect(list[0].bank_transaction_fingerprint).toBe("hash-1");
    expect(list[0].match_status).toBe("matched");
    expect(list[0].journal_entry_id).toBe("je-1");
  });

  it("#3 upsertMatch (update on conflict): ID bleibt gleich, Status-Update", async () => {
    const created = await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-2",
      bank_transaction_fingerprint: "hash-2",
      journal_entry_id: null,
      match_status: "pending_review",
    });
    const updated = await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-2",
      bank_transaction_fingerprint: "hash-2",
      journal_entry_id: "je-99",
      match_status: "matched",
      match_confidence: 0.95,
    });
    expect(updated.id).toBe(created.id);
    expect(updated.match_status).toBe("matched");
    expect(updated.match_confidence).toBe(0.95);
    const list = await listMatches(CLIENT_A);
    expect(list).toHaveLength(1);
  });

  it("#4 Mandantenisolation: Client-A-Records nicht in Client-B-Liste", async () => {
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-a",
      bank_transaction_fingerprint: "hash-a",
      journal_entry_id: null,
      match_status: "ignored",
    });
    await upsertMatch({
      client_id: CLIENT_B,
      bank_transaction_id: "tx-b",
      bank_transaction_fingerprint: "hash-b",
      journal_entry_id: null,
      match_status: "matched",
    });
    const listA = await listMatches(CLIENT_A);
    const listB = await listMatches(CLIENT_B);
    expect(listA).toHaveLength(1);
    expect(listA[0].client_id).toBe(CLIENT_A);
    expect(listB).toHaveLength(1);
    expect(listB[0].client_id).toBe(CLIENT_B);
  });

  it("#5 getMatchByFingerprint: findet oder gibt null", async () => {
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-fp",
      bank_transaction_fingerprint: "fp-abc",
      journal_entry_id: "je-fp",
      match_status: "matched",
    });
    const hit = await getMatchByFingerprint(CLIENT_A, "fp-abc");
    expect(hit).not.toBeNull();
    expect(hit!.journal_entry_id).toBe("je-fp");
    const miss = await getMatchByFingerprint(CLIENT_A, "fp-xyz");
    expect(miss).toBeNull();
  });

  it("#6 deleteMatch entfernt Record", async () => {
    const r = await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-del",
      bank_transaction_fingerprint: "hash-del",
      journal_entry_id: null,
      match_status: "ignored",
    });
    await deleteMatch(r.id);
    const list = await listMatches(CLIENT_A);
    expect(list).toHaveLength(0);
  });

  it("#7 countMatchesByStatus: aggregiert korrekt", async () => {
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-1",
      bank_transaction_fingerprint: "h-1",
      journal_entry_id: "je-1",
      match_status: "matched",
    });
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-2",
      bank_transaction_fingerprint: "h-2",
      journal_entry_id: "je-2",
      match_status: "auto_matched",
    });
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-3",
      bank_transaction_fingerprint: "h-3",
      journal_entry_id: null,
      match_status: "ignored",
    });
    await upsertMatch({
      client_id: CLIENT_A,
      bank_transaction_id: "tx-4",
      bank_transaction_fingerprint: "h-4",
      journal_entry_id: null,
      match_status: "pending_review",
    });
    const c = await countMatchesByStatus(CLIENT_A);
    expect(c.matched).toBe(1);
    expect(c.auto_matched).toBe(1);
    expect(c.ignored).toBe(1);
    expect(c.pending_review).toBe(1);
  });
});
