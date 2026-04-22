// Multi-Tenancy-Foundation · Schritt 5 · Migration-0026-Struktur-Check.
//
// Verifiziert die Struktur der Migrations-Datei (keine Runtime-DB-
// Verbindung). Schützt gegen versehentliche Regression:
//   • jede der 13 Ziel-Tabellen hat ADD COLUMN + CREATE INDEX + RESTRICTIVE-POLICY
//   • kein DROP POLICY / DROP INDEX vorhanden

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0026_multitenant_client_id.sql"
);

const TARGET_TABLES = [
  // Rot-Flag (6)
  "anlagegueter",
  "employees",
  "lohnarten",
  "lohnbuchungen",
  "lohnabrechnungen_archiv",
  "lsta_festschreibungen",
  // Gelb-Flag (8) — wobei receipt_requests aus 0018 kommt, dunning_records
  // aus 0005, documents aus 0001+0004 etc. (siehe Migration-Kopfkommentar)
  "documents",
  "invoice_archive",
  "invoice_xml_archive",
  "elster_submissions",
  "supplier_preferences",
  "advisor_notes",
  "receipt_requests",
  "dunning_records",
];

describe("Migration 0026 · Struktur-Contract", () => {
  // Kommentar-Zeilen (`-- …`) rausfiltern, damit das Template-Pattern
  // im Kopfkommentar die Zähler nicht verfälscht.
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(500);
  });

  it("hat genau 14 Ziel-Tabellen mit ADD COLUMN client_id (13 + 1 für invoice_xml_archive)", () => {
    for (const table of TARGET_TABLES) {
      const addColumnPattern = new RegExp(
        `alter table public\\.${table}[\\s\\S]*?add column if not exists client_id uuid`,
        "i"
      );
      expect(sql).toMatch(addColumnPattern);
    }
    // Summe aller ADD-COLUMN-Statements
    const totalAdds = (sql.match(/add column if not exists client_id uuid/g) ?? [])
      .length;
    expect(totalAdds).toBe(TARGET_TABLES.length);
  });

  it("hat für jede Ziel-Tabelle einen Index auf client_id", () => {
    for (const table of TARGET_TABLES) {
      const indexPattern = new RegExp(
        `create index if not exists ${table}_client_idx\\s+on public\\.${table}\\(client_id\\)`,
        "i"
      );
      expect(sql).toMatch(indexPattern);
    }
  });

  it("hat für jede Ziel-Tabelle eine RESTRICTIVE-RLS-Policy", () => {
    for (const table of TARGET_TABLES) {
      const policyPattern = new RegExp(
        `create policy ${table}_client_consistency\\s+on public\\.${table}\\s+as restrictive for all`,
        "i"
      );
      expect(sql).toMatch(policyPattern);
    }
  });

  it("nutzt die Helper-Funktion public.client_belongs_to_company(...)", () => {
    expect(sql).toMatch(
      /create or replace function public\.client_belongs_to_company/
    );
    // Helper wird in allen Policies verwendet.
    const helperCalls = (
      sql.match(/public\.client_belongs_to_company\s*\(/g) ?? []
    ).length;
    // 1× function definition + 14× in policies = 15 Vorkommen.
    expect(helperCalls).toBeGreaterThanOrEqual(15);
  });

  it("enthält keine DROP COLUMN / DROP INDEX (Rollback-Schutz)", () => {
    // Einzige zulässige DROPs: `drop policy if exists <t>_client_consistency`
    // (für idempotente Neu-Migration). Andere DROPs sind verboten.
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/drop index/);
    expect(sql).not.toMatch(/drop function/);
    expect(sql).not.toMatch(/drop table/);
  });

  it("enthält genau 14 DROP POLICY IF EXISTS (idempotente Re-Runs)", () => {
    // `drop policy if exists <table>_client_consistency` steht vor jedem
    // CREATE POLICY — eine pro Ziel-Tabelle.
    const drops = (sql.match(/drop policy if exists/g) ?? []).length;
    expect(drops).toBe(TARGET_TABLES.length);
  });
});
