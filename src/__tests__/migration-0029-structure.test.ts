// Phase 3 / Schritt 6 · Migration-0029-Struktur-Check.
//
// Verifiziert (ohne DB-Verbindung) die Struktur der Backfill-Migration
// für ESt-Anlagen-Tags auf `accounts.tags`.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0029_est_tags_backfill.sql"
);

describe("Migration 0029 · Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(100);
  });

  it("enthält genau 35 UPDATE-Statements (1:1 zu SKR03_ANLAGEN_MAPPING)", () => {
    // 18 AnlageG-Regeln (3 sonstige_ausgaben-Ranges) + 17 AnlageS-Regeln
    // (3 sonstige_ausgaben + 2 sonstige-Ranges) = 35. Siehe mapping-file.
    const updates = (sql.match(/update public\.accounts/g) ?? []).length;
    expect(updates).toBe(35);
  });

  it("jeder UPDATE nutzt das idempotente `NOT … = ANY(…)`-Pattern", () => {
    const idempotent = (
      sql.match(/not 'anlage-[gs]:[a-z_]+' = any\(coalesce\(tags, '\{\}'\)\)/g) ??
      []
    ).length;
    expect(idempotent).toBe(35);
  });

  it("jeder UPDATE filtert auf numerische Kontonummern (`konto_nr ~ '^[0-9]+$'`)", () => {
    const numericFilter = (
      sql.match(/konto_nr ~ '\^\[0-9\]\+\$'/g) ?? []
    ).length;
    expect(numericFilter).toBe(35);
  });

  it("enthält keine destruktiven Statements (DROP / ALTER TABLE / CREATE INDEX)", () => {
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/alter table/);
    expect(sql).not.toMatch(/create index/);
    expect(sql).not.toMatch(/create policy/);
  });

  it("referenziert AnlageG- UND AnlageS-Tags", () => {
    expect((sql.match(/'anlage-g:/g) ?? []).length).toBeGreaterThanOrEqual(16);
    expect((sql.match(/'anlage-s:/g) ?? []).length).toBeGreaterThanOrEqual(14);
  });
});
