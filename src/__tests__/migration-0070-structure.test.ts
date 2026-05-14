// Sprint Fristen / P3.4 v1.1 · Migration-0070-Struktur-Check.
//
// Globale Catalog-Tabelle public.deadline_type_catalog. Diese Tests
// pruefen das SQL als Text und verifizieren die Struktur-Garantien,
// OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: global, kein client_id/company_id. Kein FK auf
// client_deadline oder deadline_status_history. Kein Service, keine UI,
// keine Berechnung, kein ELSTER/ERiC. Read-only RLS-Pattern wie 0060-0066.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0070_deadline_type_catalog.sql"
);

describe("Migration 0070 · deadline_type_catalog Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  // Schritt 1: -- Kommentarzeilen entfernen.
  // Schritt 2: COMMENT ON-Statements entfernen, damit Metadaten-
  // Beschreibungen keine False Positives erzeugen (z. B. das Wort
  // "manual_review_required" in einer Tabellen-Beschreibung).
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/comment on (table|column|index|schema)[^;]*;/g, "");

  // ============================================================
  // A. Datei und Scope
  // ============================================================

  it("A1 existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(1000);
  });

  it("A2 genau eine Tabelle public.deadline_type_catalog wird erstellt", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_type_catalog\b/
    );
    const tableMatches = sql.match(/create table if not exists/g) ?? [];
    expect(tableMatches.length).toBe(1);
  });

  it("A3 KEIN client_id", () => {
    expect(sql).not.toMatch(/client_id/);
  });

  it("A4 KEIN company_id", () => {
    expect(sql).not.toMatch(/company_id/);
  });

  it("A5 KEIN FK auf public.client_deadline", () => {
    expect(sql).not.toMatch(/references public\.client_deadline/);
  });

  it("A6 KEIN FK auf public.deadline_status_history", () => {
    expect(sql).not.toMatch(/references public\.deadline_status_history/);
  });

  it("A7 keine UI-/Service-/Berechnungs-/ELSTER-Bezuege", () => {
    expect(sql).not.toMatch(/deadlinespage/);
    expect(sql).not.toMatch(/kanzleidashboard/);
    expect(sql).not.toMatch(/arbeitsplatzpage/);
    expect(sql).not.toMatch(/deadlineservice/);
    expect(sql).not.toMatch(/abgabefristcalculator/);
    expect(sql).not.toMatch(/generatedeadlines/);
    expect(sql).not.toMatch(/elster/);
    expect(sql).not.toMatch(/eric/);
  });

  // ============================================================
  // B. Pflichtfelder
  // ============================================================

  it("B8 id ist uuid PK mit default gen_random_uuid()", () => {
    expect(sql).toMatch(
      /id uuid primary key default gen_random_uuid\(\)/
    );
  });

  it("B9 deadline_type ist text NOT NULL", () => {
    expect(sql).toMatch(/\bdeadline_type text not null\b/);
  });

  it("B10 deadline_class ist text NOT NULL", () => {
    expect(sql).toMatch(/\bdeadline_class text not null\b/);
  });

  it("B11 catalog_status ist text NOT NULL", () => {
    expect(sql).toMatch(/\bcatalog_status text not null\b/);
  });

  it("B12 description ist text NOT NULL", () => {
    expect(sql).toMatch(/\bdescription text not null\b/);
  });

  it("B13 source_id ist uuid NOT NULL FK auf deadline_source_versions(id) on delete restrict", () => {
    expect(sql).toMatch(
      /source_id uuid\s+not null[\s\S]*?references public\.deadline_source_versions\(id\)\s+on delete restrict/
    );
  });

  it("B14 source_version ist text NOT NULL", () => {
    expect(sql).toMatch(/\bsource_version text not null\b/);
  });

  it("B15 gueltig_ab ist date NOT NULL", () => {
    expect(sql).toMatch(/\bgueltig_ab date not null\b/);
  });

  it("B16 gueltig_bis ist date NULL", () => {
    expect(sql).toMatch(/\bgueltig_bis date null\b/);
  });

  it("B17 created_at ist timestamptz NOT NULL DEFAULT now()", () => {
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
  });

  it("B18 updated_at ist timestamptz NOT NULL DEFAULT now()", () => {
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  // ============================================================
  // C. Wertemengen und Matrix
  // ============================================================

  it("C19 deadline_type_catalog_type_enum enthaelt exakt die 7 v1-Werte", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_type_enum\s+check/
    );
    const allowed = [
      "ustva_abgabe",
      "ustva_zahlung",
      "lsta_abgabe",
      "lsta_zahlung",
      "zm_abgabe",
      "ebilanz_abgabe",
      "jahresabschluss_abgabe",
    ];
    for (const v of allowed) {
      expect(sql, `deadline_type '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
  });

  it("C20 erfundene/verbotene deadline_type-Werte sind nicht enthalten", () => {
    const forbidden = [
      "ustva_q",
      "est_voraus",
      "kst_voraus",
      "gewst_voraus",
      "est_erkl",
      "kst_erkl",
      "gewst_erkl",
    ];
    for (const v of forbidden) {
      expect(
        sql,
        `verbotener Wert '${v}' darf nicht im SQL stehen`
      ).not.toMatch(new RegExp(`'${v}'`));
    }
    // 'ustva' ohne Suffix als Quoted-Form auch verboten.
    expect(sql).not.toMatch(/'ustva'/);
  });

  it("C21 deadline_type_catalog_class_enum enthaelt exakt abgabe/zahlung/nicht_zugeordnet", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_class_enum\s+check/
    );
    expect(sql).toMatch(/'abgabe'/);
    expect(sql).toMatch(/'zahlung'/);
    expect(sql).toMatch(/'nicht_zugeordnet'/);
  });

  it("C22 deadline_type_catalog_status_enum enthaelt exakt active/reserved_blocked/deprecated", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_status_enum\s+check/
    );
    expect(sql).toMatch(/'active'/);
    expect(sql).toMatch(/'reserved_blocked'/);
    expect(sql).toMatch(/'deprecated'/);
  });

  it("C23 manual_review_required kommt NICHT als catalog_status-Wert vor", () => {
    expect(sql).not.toMatch(/'manual_review_required'/);
    expect(sql).not.toMatch(/manual_review_required/);
  });

  it("C24 Type-Class-Matrix mit named constraint vorhanden", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_type_class_matrix\s+check/
    );
    // Alle 7 Paare innerhalb eines schmalen Fensters.
    expect(sql).toMatch(/'ustva_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'ustva_zahlung'[\s\S]{0,80}?'zahlung'/);
    expect(sql).toMatch(/'lsta_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'lsta_zahlung'[\s\S]{0,80}?'zahlung'/);
    expect(sql).toMatch(/'zm_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'ebilanz_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(
      /'jahresabschluss_abgabe'[\s\S]{0,80}?'nicht_zugeordnet'/
    );
  });

  it("C25 ZM_ABGABE ist NICHT mit nicht_zugeordnet verbunden", () => {
    expect(sql).not.toMatch(/'zm_abgabe'[\s\S]{0,80}?'nicht_zugeordnet'/);
    expect(sql).not.toMatch(/'nicht_zugeordnet'[\s\S]{0,80}?'zm_abgabe'/);
  });

  it("C26 JAHRESABSCHLUSS_ABGABE ist mit nicht_zugeordnet verbunden", () => {
    expect(sql).toMatch(
      /'jahresabschluss_abgabe'[\s\S]{0,80}?'nicht_zugeordnet'/
    );
  });

  it("C27 nicht_zugeordnet ist ausschliesslich mit JAHRESABSCHLUSS_ABGABE gepaart", () => {
    const forbidden = [
      "ustva_abgabe",
      "ustva_zahlung",
      "lsta_abgabe",
      "lsta_zahlung",
      "zm_abgabe",
      "ebilanz_abgabe",
    ];
    for (const t of forbidden) {
      expect(
        sql,
        `'${t}' darf nicht in 80-Zeichen-Naehe zu 'nicht_zugeordnet' stehen`
      ).not.toMatch(new RegExp(`'${t}'[\\s\\S]{0,80}?'nicht_zugeordnet'`));
      expect(
        sql,
        `'nicht_zugeordnet' darf nicht in 80-Zeichen-Naehe zu '${t}' stehen`
      ).not.toMatch(new RegExp(`'nicht_zugeordnet'[\\s\\S]{0,80}?'${t}'`));
    }
  });

  it("C28 Reserved-Blocked-Regel als named CHECK strukturell vorhanden", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_reserved_blocked_rule\s+check/
    );
    // Implikationsform: deadline_type not in ('zm_abgabe','jahresabschluss_abgabe')
    // or catalog_status = 'reserved_blocked'.
    expect(sql).toMatch(
      /deadline_type\s+not in\s*\([\s\S]*?'zm_abgabe'[\s\S]*?'jahresabschluss_abgabe'[\s\S]*?\)\s+or\s+catalog_status\s*=\s*'reserved_blocked'/
    );
  });

  it("C29 ZM_ABGABE bleibt deadline_class=abgabe trotz reserved_blocked", () => {
    // Doppelt verifiziert: Matrix erzwingt zm_abgabe -> abgabe;
    // Reserved-Rule erzwingt zm_abgabe -> reserved_blocked. Beide
    // Constraints koexistieren ohne Konflikt.
    expect(sql).toMatch(/'zm_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'zm_abgabe'/);
  });

  // ============================================================
  // D. Kalender und Provenance
  // ============================================================

  it("D30 gueltig_ab/gueltig_bis sind DATE, nicht timestamp/timestamptz", () => {
    expect(sql).toMatch(/gueltig_ab date not null/);
    expect(sql).toMatch(/gueltig_bis date null/);
    expect(sql).not.toMatch(/gueltig_ab timestamp/);
    expect(sql).not.toMatch(/gueltig_bis timestamp/);
    expect(sql).not.toMatch(/gueltig_ab timestamptz/);
    expect(sql).not.toMatch(/gueltig_bis timestamptz/);
  });

  it("D31 Gueltigkeits-Range-Constraint vorhanden", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_gueltigkeit_range\s+check\s*\(\s*gueltig_bis is null\s+or\s+gueltig_bis\s*>=\s*gueltig_ab\s*\)/
    );
  });

  it("D32 source_id FK auf public.deadline_source_versions(id) on delete restrict", () => {
    expect(sql).toMatch(
      /references public\.deadline_source_versions\(id\)\s+on delete restrict/
    );
  });

  it("D33 source_version mit named char_length-Check 1-100", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_source_version_length\s+check\s*\(\s*char_length\(source_version\) between 1 and 100\s*\)/
    );
  });

  it("D34 description mit named char_length-Check 1-1000", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_description_length\s+check\s*\(\s*char_length\(description\) between 1 and 1000\s*\)/
    );
  });

  it("D35 UNIQUE-Constraint deadline_type_catalog_type_gueltig_uk auf (deadline_type, gueltig_ab)", () => {
    expect(sql).toMatch(
      /constraint deadline_type_catalog_type_gueltig_uk\s+unique\s*\(\s*deadline_type\s*,\s*gueltig_ab\s*\)/
    );
  });

  // ============================================================
  // E. RLS / Policies / Grants
  // ============================================================

  it("E36 RLS ist aktiviert", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_type_catalog enable row level security/
    );
  });

  it("E37 SELECT-Policy fuer authenticated mit USING (true)", () => {
    expect(sql).toMatch(
      /create policy deadline_type_catalog_select[\s\S]*?on public\.deadline_type_catalog[\s\S]*?for select[\s\S]*?to authenticated[\s\S]*?using\s*\(\s*true\s*\)/
    );
  });

  it("E38 KEINE INSERT/UPDATE/DELETE-Policy fuer authenticated", () => {
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("E39 GRANT SELECT an authenticated", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_type_catalog to authenticated/
    );
  });

  it("E40 GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_type_catalog to service_role/
    );
  });

  it("E41 KEIN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_type_catalog[^;]*to anon/
    );
  });

  it("E42 KEIN is_company_member (globale Tabelle, kein Mandant-Scope)", () => {
    expect(sql).not.toMatch(/is_company_member/);
  });

  it("E43 KEIN client_belongs_to_company (globale Tabelle)", () => {
    expect(sql).not.toMatch(/client_belongs_to_company/);
  });

  // ============================================================
  // F. Idempotenz / Constraint-Pattern
  // ============================================================

  it("F44 CREATE TABLE IF NOT EXISTS vorhanden", () => {
    expect(sql).toMatch(/create table if not exists/);
  });

  it("F45 alle Indizes mit CREATE INDEX IF NOT EXISTS", () => {
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(3);
  });

  it("F46 Policy mit DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(
      /drop policy if exists deadline_type_catalog_select[\s\S]*?on public\.deadline_type_catalog/
    );
    expect(sql).toMatch(
      /create policy deadline_type_catalog_select[\s\S]*?on public\.deadline_type_catalog/
    );
  });

  it("F47 ADD CONSTRAINT IF NOT EXISTS ist VERBOTEN (PostgreSQL-Anti-Pattern)", () => {
    expect(sql).not.toMatch(/add constraint if not exists/);
  });

  it("F48 named constraints sind inline in CREATE TABLE oder via DROP-IF-EXISTS+ADD definiert", () => {
    // Alle named CHECK/UNIQUE-Constraints muessen entweder inline in
    // CREATE TABLE als "constraint <name> check/unique (...)" oder als
    // "alter table ... drop constraint if exists <name>; alter table
    // ... add constraint <name> ..." erscheinen. Hier wird per inline-
    // Pattern verifiziert, dass alle erwarteten benannten Constraints
    // existieren.
    const expectedConstraints = [
      "deadline_type_catalog_type_enum",
      "deadline_type_catalog_class_enum",
      "deadline_type_catalog_status_enum",
      "deadline_type_catalog_type_class_matrix",
      "deadline_type_catalog_reserved_blocked_rule",
      "deadline_type_catalog_description_length",
      "deadline_type_catalog_source_version_length",
      "deadline_type_catalog_gueltigkeit_range",
      "deadline_type_catalog_type_gueltig_uk",
    ];
    for (const c of expectedConstraints) {
      expect(sql, `Constraint '${c}' fehlt`).toMatch(
        new RegExp(`constraint ${c}\\s+(?:check|unique)\\b`)
      );
    }
  });

  it("F49 kein DROP TABLE", () => {
    expect(sql).not.toMatch(/drop table/);
  });

  it("F50 kein DROP COLUMN", () => {
    expect(sql).not.toMatch(/drop column/);
  });

  it("F51 kein RENAME", () => {
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  // ============================================================
  // G. Verbote
  // ============================================================

  it("G52 keine Trigger", () => {
    expect(sql).not.toMatch(/\bcreate trigger\b/);
  });

  it("G53 keine Functions", () => {
    expect(sql).not.toMatch(/create function/);
    expect(sql).not.toMatch(/create or replace function/);
  });

  it("G54 keine Materialized Views", () => {
    expect(sql).not.toMatch(/create materialized view/);
  });

  it("G55 kein Backfill-DML (kein INSERT INTO, kein UPDATE, kein DELETE FROM)", () => {
    expect(sql).not.toMatch(/\binsert\s+into\b/);
    expect(sql).not.toMatch(/\bupdate\s+public\./);
    expect(sql).not.toMatch(/\bdelete\s+from\b/);
  });

  it("G56 keine Aenderung an public.client_deadline", () => {
    expect(sql).not.toMatch(/alter table public\.client_deadline/);
    expect(sql).not.toMatch(
      /create table\s+(?:if not exists\s+)?public\.client_deadline\s*\(/
    );
  });

  it("G57 keine Aenderung an public.deadline_status_history", () => {
    expect(sql).not.toMatch(/alter table public\.deadline_status_history/);
    expect(sql).not.toMatch(
      /create table\s+(?:if not exists\s+)?public\.deadline_status_history\s*\(/
    );
  });

  it("G58 keine references public.audit_log", () => {
    expect(sql).not.toMatch(/references public\.audit_log/);
  });

  it("G59 kein audit_log_ref", () => {
    expect(sql).not.toMatch(/audit_log_ref/);
  });

  it("G60 keine Hash-Chain-Spalten (prev_hash, chain_hash, entry_hash, hash)", () => {
    expect(sql).not.toMatch(/prev_hash/);
    expect(sql).not.toMatch(/chain_hash/);
    expect(sql).not.toMatch(/entry_hash/);
    expect(sql).not.toMatch(/\bhash\b/);
  });

  it("G61 kein actor_type / actor_kind / system_actor", () => {
    expect(sql).not.toMatch(/actor_type/);
    expect(sql).not.toMatch(/actor_kind/);
    expect(sql).not.toMatch(/system_actor/);
  });

  it("G62 keine kuenstliche User-ID / kein system_user / keine 00000000-Konstante", () => {
    expect(sql).not.toMatch(/00000000-0000-0000-0000-000000000000/);
    expect(sql).not.toMatch(/system_user/);
  });

  it("G63 kein Supabase-Apply-/DB-Ausfuehrungsanker", () => {
    expect(sql).not.toMatch(/supabase\s+db\s+push/);
    expect(sql).not.toMatch(/supabase\s+migration\s+apply/);
  });

  it("G64 keine Referenz auf 0060-0069 als Migrationsnummern", () => {
    expect(sql).not.toMatch(/\b0060\b/);
    expect(sql).not.toMatch(/\b0061\b/);
    expect(sql).not.toMatch(/\b0062\b/);
    expect(sql).not.toMatch(/\b0063\b/);
    expect(sql).not.toMatch(/\b0064\b/);
    expect(sql).not.toMatch(/\b0065\b/);
    expect(sql).not.toMatch(/\b0066\b/);
    expect(sql).not.toMatch(/\b0067\b/);
    expect(sql).not.toMatch(/\b0068\b/);
    expect(sql).not.toMatch(/\b0069\b/);
  });

  // ============================================================
  // Cross-Check: ALTER TABLE nur auf eigene neue Tabelle
  // ============================================================

  it("ALTER TABLE nur auf public.deadline_type_catalog (ENABLE RLS)", () => {
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE: ${match}`
      ).toMatch(/alter table public\.deadline_type_catalog/);
    }
  });
});
