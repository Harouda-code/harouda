// Multi-Tenancy Phase 2 / Schritt 3 · createEntriesBatch-Tests.
//
// DEMO-Pfad-Tests (vitest-Env ist DEMO_MODE per Default). Supabase-
// Pfad (`.insert([...]).select()`) ist nicht gemockt — Supabase-
// Mock-Infrastruktur existiert im Projekt bewusst nicht.
//
// Der Batch ist eine additive API; createEntry bleibt für Einzel-
// Buchungen zuständig. Die Atomicity-Semantik (alles-oder-nichts)
// wird im DEMO-Pfad über Snapshot+Restore verifiziert (Test #4);
// im Supabase-Pfad liefert PostgREST die Transaction.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createEntry, createEntriesBatch, type JournalInput } from "../journal";
import { store } from "../store";
import { fetchAuditLog } from "../audit";
import { verifyJournalChain } from "../../utils/journalChain";

const COMPANY = "company-demo";
const A = "client-A";

function baseInput(beleg_nr: string, overrides: Partial<JournalInput> = {}): JournalInput {
  return {
    datum: "2025-03-01",
    beleg_nr,
    beschreibung: `Test ${beleg_nr}`,
    soll_konto: "4100",
    haben_konto: "1200",
    betrag: 100,
    ust_satz: 0,
    status: "gebucht",
    client_id: A,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("createEntriesBatch · DEMO-Pfad", () => {
  it("#1 leeres Array: Early-Return, keine DB-/Audit-Writes", async () => {
    const result = await createEntriesBatch([], {
      companyId: COMPANY,
      clientId: A,
      batchLabel: "leer",
    });
    expect(result.created).toEqual([]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(store.getEntries()).toHaveLength(0);
    // Kein Audit-Log-Eintrag für leere Batches.
    const audit = await fetchAuditLog();
    expect(audit).toHaveLength(0);
  });

  it("#2 3 Entries: Hash-Kette korrekt verkettet, selbe batchId", async () => {
    const result = await createEntriesBatch(
      [
        baseInput("RE-B01", { betrag: 100 }),
        baseInput("RE-B02", { betrag: 50 }),
        baseInput("RE-B03", { betrag: 25 }),
      ],
      { companyId: COMPANY, clientId: A, batchLabel: "lohn-2025-03" }
    );
    expect(result.created).toHaveLength(3);
    const [e1, e2, e3] = result.created;
    // Alle Einträge teilen dieselbe batchId.
    expect(e1.batch_id).toBe(result.batchId);
    expect(e2.batch_id).toBe(result.batchId);
    expect(e3.batch_id).toBe(result.batchId);
    // Hash-Kette: prev_hash[N+1] === entry_hash[N].
    expect(e2.prev_hash).toBe(e1.entry_hash);
    expect(e3.prev_hash).toBe(e2.entry_hash);
    // Chain-Head vor Batch war GENESIS (64×"0").
    expect(e1.prev_hash).toMatch(/^0{64}$/);
    // Volle Kette muss konsistent sein.
    const chain = await verifyJournalChain(store.getEntries());
    expect(chain.ok).toBe(true);
    expect(chain.total).toBe(3);
  });

  it("#3 falsche clientId: throw, kein Write, kein partielles Ergebnis", async () => {
    await expect(
      createEntriesBatch(
        [
          baseInput("RE-MIX-1", { client_id: A }),
          baseInput("RE-MIX-2", { client_id: "client-B" }), // Mismatch
        ],
        { companyId: COMPANY, clientId: A }
      )
    ).rejects.toThrow(/client_id-Mismatch/i);
    expect(store.getEntries()).toHaveLength(0);
    const audit = await fetchAuditLog();
    expect(audit).toHaveLength(0);
  });

  it("#4 DEMO-Rollback: Fehler beim Write → Store unverändert", async () => {
    // Seed: 1 vorhandener Einzel-Eintrag (createEntry).
    await createEntry(baseInput("RE-SEED"));
    const beforeSnapshot = store.getEntries().map((e) => e.id).sort();
    expect(beforeSnapshot).toHaveLength(1);

    // setEntries wirft beim ersten Aufruf (Primary-Write), beim zweiten
    // (Rollback) lassen wir den Original-Call durch.
    let callCount = 0;
    const spy = vi
      .spyOn(store, "setEntries")
      .mockImplementation((v: Parameters<typeof store.setEntries>[0]) => {
        callCount++;
        if (callCount === 1) throw new Error("Simulierter Quota-Fehler");
        // Delegiert an echten localStorage-Write.
        localStorage.setItem("harouda:entries", JSON.stringify(v));
      });

    await expect(
      createEntriesBatch([baseInput("RE-B01"), baseInput("RE-B02")], {
        companyId: COMPANY,
        clientId: A,
      })
    ).rejects.toThrow(/Quota-Fehler/);

    // Rollback muss stattgefunden haben: nur der Seed-Eintrag ist übrig.
    const after = store.getEntries().map((e) => e.id).sort();
    expect(after).toEqual(beforeSnapshot);

    spy.mockRestore();
  });

  it("#5 batchId ist pro Call einzigartig", async () => {
    const r1 = await createEntriesBatch([baseInput("RE-U1")], {
      companyId: COMPANY,
      clientId: A,
    });
    const r2 = await createEntriesBatch([baseInput("RE-U2")], {
      companyId: COMPANY,
      clientId: A,
    });
    expect(r1.batchId).not.toBe(r2.batchId);
    expect(r1.batchId.length).toBeGreaterThan(0);
    expect(r2.batchId.length).toBeGreaterThan(0);
  });

  it("#6 Audit-Log: genau ein Eintrag pro Batch mit entryCount", async () => {
    const result = await createEntriesBatch(
      [
        baseInput("RE-A1"),
        baseInput("RE-A2"),
        baseInput("RE-A3"),
        baseInput("RE-A4"),
      ],
      { companyId: COMPANY, clientId: A, batchLabel: "test-stapel" }
    );
    // Warten auf das asynchrone Audit-`void log(…)`.
    await new Promise((r) => setTimeout(r, 20));
    const audit = await fetchAuditLog();
    // Filter per batchId — robust gegen evtl. parallele void-log-Flushs
    // anderer Tests, die ihre Audit-Einträge nach beforeEach-clear in
    // diesen Test leaken könnten.
    const myBatch = audit.filter((a) => a.entity_id === result.batchId);
    expect(myBatch).toHaveLength(1);
    const entry = myBatch[0];
    expect(entry.action).toBe("create");
    expect(entry.entity).toBe("journal_entry");
    expect(entry.summary).toContain("test-stapel");
    const payload = entry.after as {
      batchId: string;
      entryCount: number;
      batchLabel: string | null;
    };
    expect(payload.batchId).toBe(result.batchId);
    expect(payload.entryCount).toBe(4);
    expect(payload.batchLabel).toBe("test-stapel");
  });
});
