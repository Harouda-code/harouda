// Multi-Tenancy Phase 2 / Schritt 3 · Migration-0027-Struktur-Check.
//
// Verifiziert (ohne DB-Verbindung) die Struktur der Migration, die
// `journal_entries.batch_id` einführt. Schutz gegen Regression /
// ungewollte Änderungen an der Migration-Datei.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0027_journal_batch.sql"
);

describe("Migration 0027 · Struktur-Contract", () => {
  // Kommentar-Zeilen (`-- …`) rausfiltern, damit das Doku-Template im
  // Kopfkommentar die Assertions nicht verfälscht.
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(50);
  });

  it("hat ADD COLUMN batch_id uuid (nullable)", () => {
    expect(sql).toMatch(
      /alter table public\.journal_entries[\s\S]*?add column if not exists batch_id uuid null/
    );
    // NOT NULL darf nicht vorkommen (Legacy-Einzel-Buchungen bleiben NULL).
    expect(sql).not.toMatch(/batch_id uuid not null/);
  });

  it("hat einen partiellen Index auf batch_id (WHERE NOT NULL)", () => {
    expect(sql).toMatch(
      /create index if not exists journal_entries_batch_idx\s+on public\.journal_entries\(batch_id\)\s+where batch_id is not null/
    );
  });

  it("hat einen Spalten-Kommentar mit Referenz auf createEntriesBatch", () => {
    expect(sql).toMatch(
      /comment on column public\.journal_entries\.batch_id is/
    );
    expect(sql).toMatch(/createentriesbatch/);
  });

  it("enthält keine destruktiven Statements (DROP/RENAME)", () => {
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/drop index/);
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/rename column/);
  });

  it("enthält kein RLS-Policy-Statement (batch_id ist kein Sicherheits-Vektor)", () => {
    expect(sql).not.toMatch(/create policy/);
    expect(sql).not.toMatch(/alter policy/);
  });
});
