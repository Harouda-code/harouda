import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock DEMO_MODE=true, damit der Repo gegen den localStorage-Store arbeitet
// (statt eine echte Supabase-Verbindung aufzubauen).
vi.mock("../../../api/supabase", () => ({
  DEMO_MODE: true,
  supabase: {},
}));

import { AuditLogRepo } from "../auditLogRepo";
import { store } from "../../../api/store";
import type { AuditLogEntry } from "../../../types/db";

/** Erzeugt einen AuditLogEntry mit Default-Werten. */
function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: `a-${Math.random().toString(36).slice(2)}`,
    at: new Date().toISOString(),
    actor: "demo@harouda.local",
    action: "create",
    entity: "journal_entry",
    entity_id: "je-1",
    summary: "Test entry",
    before: null,
    after: null,
    prev_hash: "0".repeat(64),
    hash: "1".repeat(64),
    ...overrides,
  };
}

function seedAudit(entries: AuditLogEntry[]) {
  // store.getAudit liest; wir nutzen den localStorage-getter-Proxy
  const existing = store.getAudit();
  // Direkter Reset: alle existing + neue ersetzen durch unsere
  const prev = existing.length;
  // store hat keine reset-API — wir pushen via audit.ts log()? Nein, das würde
  // Hash-Chain verletzen. Wir manipulieren den localStorage direkt wenn nötig.
  if (typeof localStorage !== "undefined") {
    const key = "harouda:audit";
    localStorage.setItem(key, JSON.stringify([...entries, ...existing]));
  }
  return prev;
}

function clearAudit() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("harouda:audit", "[]");
  }
}

describe("AuditLogRepo", () => {
  let repo: AuditLogRepo;

  beforeEach(() => {
    clearAudit();
    repo = new AuditLogRepo();
  });

  describe("query", () => {
    it("ohne Filter: gibt alle Einträge zurück", async () => {
      seedAudit([makeEntry({ at: "2025-01-01T10:00Z" }), makeEntry({ at: "2025-02-01T10:00Z" })]);
      const r = await repo.query({});
      expect(r.total).toBe(2);
      expect(r.entries.length).toBe(2);
    });

    it("Filter nach entity", async () => {
      seedAudit([
        makeEntry({ entity: "journal_entry" }),
        makeEntry({ entity: "account" }),
        makeEntry({ entity: "journal_entry" }),
      ]);
      const r = await repo.query({ entity: "journal_entry" });
      expect(r.total).toBe(2);
    });

    it("Filter nach action", async () => {
      seedAudit([
        makeEntry({ action: "create" }),
        makeEntry({ action: "delete" }),
        makeEntry({ action: "create" }),
      ]);
      const r = await repo.query({ action: "delete" });
      expect(r.total).toBe(1);
    });

    it("Filter nach actor", async () => {
      seedAudit([
        makeEntry({ actor: "alice@x.com" }),
        makeEntry({ actor: "bob@x.com" }),
      ]);
      const r = await repo.query({ actor: "alice@x.com" });
      expect(r.total).toBe(1);
      expect(r.entries[0].actor).toBe("alice@x.com");
    });

    it("Filter nach Datum", async () => {
      seedAudit([
        makeEntry({ at: "2025-01-15T12:00:00Z" }),
        makeEntry({ at: "2025-06-15T12:00:00Z" }),
        makeEntry({ at: "2025-12-15T12:00:00Z" }),
      ]);
      const r = await repo.query({
        dateFrom: "2025-03-01T00:00:00Z",
        dateTo: "2025-09-30T23:59:59Z",
      });
      expect(r.total).toBe(1);
    });

    it("Pagination: limit + offset", async () => {
      seedAudit(
        Array.from({ length: 20 }, (_, i) =>
          makeEntry({ id: `a-${i}`, summary: `E${i}` })
        )
      );
      const page1 = await repo.query({ limit: 5, offset: 0 });
      const page2 = await repo.query({ limit: 5, offset: 5 });
      expect(page1.entries.length).toBe(5);
      expect(page2.entries.length).toBe(5);
      expect(page1.entries[0].id).not.toBe(page2.entries[0].id);
      expect(page1.total).toBe(20);
    });
  });

  describe("getEntityHistory", () => {
    it("chronologisch aufsteigend", async () => {
      seedAudit([
        makeEntry({
          entity_id: "je-42",
          at: "2025-03-01T10:00Z",
          summary: "B",
        }),
        makeEntry({
          entity_id: "je-42",
          at: "2025-01-01T10:00Z",
          summary: "A",
        }),
        makeEntry({
          entity_id: "je-42",
          at: "2025-06-01T10:00Z",
          summary: "C",
        }),
        makeEntry({ entity_id: "other-id", summary: "X" }),
      ]);
      const hist = await repo.getEntityHistory("journal_entry", "je-42");
      expect(hist.length).toBe(3);
      expect(hist.map((e) => e.summary)).toEqual(["A", "B", "C"]);
    });
  });

  describe("getStatistics", () => {
    it("aggregiert korrekt nach entity / action / actor", async () => {
      seedAudit([
        makeEntry({ entity: "journal_entry", action: "create", actor: "a" }),
        makeEntry({ entity: "journal_entry", action: "update", actor: "a" }),
        makeEntry({ entity: "account", action: "create", actor: "b" }),
        makeEntry({ entity: "journal_entry", action: "delete", actor: "b" }),
      ]);
      const s = await repo.getStatistics(365);
      expect(s.totalOperations).toBe(4);
      expect(s.byEntity[0].count).toBeGreaterThanOrEqual(s.byEntity[1]?.count ?? 0);
      const jeCount = s.byEntity.find((e) => e.entity === "journal_entry")!.count;
      expect(jeCount).toBe(3);
      const actorA = s.byActor.find((a) => a.actor === "a")!.count;
      expect(actorA).toBe(2);
    });

    it("sensitiveOperations zählt nur delete + reverse", async () => {
      seedAudit([
        makeEntry({ action: "create" }),
        makeEntry({ action: "delete" }),
        makeEntry({ action: "reverse" }),
        makeEntry({ action: "update" }),
      ]);
      const s = await repo.getStatistics(365);
      expect(s.sensitiveOperations).toBe(2);
    });

    it("leerer Zeitraum → zero counts", async () => {
      const s = await repo.getStatistics(30);
      expect(s.totalOperations).toBe(0);
      expect(s.sensitiveOperations).toBe(0);
      expect(s.byEntity).toEqual([]);
    });
  });

  describe("getSensitiveOperations", () => {
    it("listet nur delete + reverse, neueste zuerst", async () => {
      seedAudit([
        makeEntry({ action: "create", at: "2025-01-01T10:00Z" }),
        makeEntry({ action: "delete", at: "2025-06-01T10:00Z" }),
        makeEntry({ action: "reverse", at: "2025-08-01T10:00Z" }),
        makeEntry({ action: "update", at: "2025-09-01T10:00Z" }),
      ]);
      const ops = await repo.getSensitiveOperations(365);
      expect(ops.length).toBe(2);
      // neueste zuerst
      expect(ops[0].at > ops[1].at).toBe(true);
    });
  });
});
