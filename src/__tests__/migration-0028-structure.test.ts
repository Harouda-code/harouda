// Multi-Tenancy Phase 2 / Schritt 5 · Migration-0028-Struktur-Check.
//
// Verifiziert (ohne DB-Verbindung) die Struktur der Migration, die
// `lohnabrechnungen_archiv.batch_id` einführt.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0028_lohn_archiv_batch.sql"
);

describe("Migration 0028 · Struktur-Contract", () => {
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
      /alter table public\.lohnabrechnungen_archiv[\s\S]*?add column if not exists batch_id uuid null/
    );
    expect(sql).not.toMatch(/batch_id uuid not null/);
  });

  it("hat einen partiellen Index auf batch_id (WHERE NOT NULL)", () => {
    expect(sql).toMatch(
      /create index if not exists lohnabrechnungen_archiv_batch_idx\s+on public\.lohnabrechnungen_archiv\(batch_id\)\s+where batch_id is not null/
    );
  });

  it("hat einen Spalten-Kommentar mit Referenz auf Batch/Lohn-Lauf", () => {
    expect(sql).toMatch(
      /comment on column public\.lohnabrechnungen_archiv\.batch_id is/
    );
    expect(sql).toMatch(/batch/);
  });

  it("enthält keine destruktiven Statements", () => {
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
