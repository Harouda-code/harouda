// Sprint Fristen / P3.2 + P3.4 · Migration-0062-Struktur-Check.
//
// Globale Feiertagsregel-Registry (`public.deadline_holiday_rules`).
// Diese Tests pruefen das SQL als Text und verifizieren die Struktur-
// Garantien, OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine Feiertagsanwendung, keine Berechnung, keine UI. Die Tests
// sind reine Strukturchecks auf das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0062_deadline_holiday_rules.sql"
);

describe("Migration 0062 · deadline_holiday_rules Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  // Schritt 1: -- Kommentarzeilen entfernen.
  // Schritt 2: COMMENT ON-Statements entfernen, damit Assertions nicht auf
  // Metadaten-Beschreibungstexte matchen (z. B. "kein client_id" in einer
  // table-Beschreibung waere ein false positive fuer den Schema-Check).
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/comment on (table|column|index|schema)[^;]*;/g, "");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(800);
  });

  it("legt genau eine Tabelle public.deadline_holiday_rules an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_holiday_rules/
    );
    const tableMatches = sql.match(/create table if not exists/g) ?? [];
    expect(tableMatches.length).toBe(1);
  });

  it("Tabelle ist global: KEIN client_id-Feld", () => {
    expect(sql).not.toMatch(/client_id/);
  });

  it("Tabelle ist global: KEIN company_id-Feld", () => {
    expect(sql).not.toMatch(/company_id/);
  });

  it("alle Pflichtfelder sind vorhanden mit korrekten Typen", () => {
    expect(sql).toMatch(/holiday_key text not null/);
    expect(sql).toMatch(/holiday_name text not null/);
    expect(sql).toMatch(/scope_type text not null/);
    expect(sql).toMatch(/date_rule text not null/);
    expect(sql).toMatch(/catalog_status text not null/);
    expect(sql).toMatch(/source_rule text not null/);
    expect(sql).toMatch(/source_id uuid\s+not null/);
    expect(sql).toMatch(/source_version text not null/);
    expect(sql).toMatch(/bundesland text null/);
    expect(sql).toMatch(/gueltig_ab date not null/);
    expect(sql).toMatch(/gueltig_bis date null/);
    expect(sql).toMatch(/created_at timestamptz/);
    expect(sql).toMatch(/updated_at timestamptz/);
    // holiday_key Format: lower snake case
    expect(sql).toMatch(
      /check\s*\([\s\S]*?holiday_key\s*~\s*'\^\[a-z\]\[a-z0-9_\]\*\$'/
    );
  });

  it("scope_type CHECK enthaelt exakt die 5 erlaubten Werte", () => {
    const allowed = [
      "bundesweit",
      "landesweit",
      "gemeinde",
      "stadt",
      "sonderfall",
    ];
    for (const v of allowed) {
      expect(sql, `scope_type '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
    // Geschlossene IN-Liste fuer scope_type vorhanden.
    expect(sql).toMatch(/scope_type\s+in\s*\(/);
    // Negativ-Stichprobe: typische unsaubere Werte sind nicht akzeptiert.
    expect(sql).not.toMatch(/'kreis'/);
    expect(sql).not.toMatch(/'kommune'/);
    expect(sql).not.toMatch(/'all'/);
  });

  it("date_rule CHECK enthaelt exakt die 3 fuer Feiertagsregeln erlaubten Werte", () => {
    const allowed = [
      "relative_to_easter",
      "explicit_calendar_date",
      "rule_versioned_special_case",
    ];
    for (const v of allowed) {
      expect(sql, `date_rule '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
    expect(sql).toMatch(/date_rule\s+in\s*\(/);
    // Negativ-Stichprobe: andere Regeltypen sind nicht akzeptiert.
    expect(sql).not.toMatch(/'lunar_calendar'/);
    expect(sql).not.toMatch(/'computed_offset'/);
  });

  it("catalog_status CHECK enthaelt exakt active, reserved_blocked, deprecated", () => {
    expect(sql).toMatch(/'active'/);
    expect(sql).toMatch(/'reserved_blocked'/);
    expect(sql).toMatch(/'deprecated'/);
    expect(sql).toMatch(/catalog_status\s+in\s*\(/);
  });

  it("manual_review_required erscheint NICHT als catalog_status-Wert", () => {
    // Strikte Trennung: Katalogstatus != Workflow-/Review-Marker.
    // Im SQL-Wirkbereich (Kommentare + COMMENT ON sind bereits gefiltert)
    // darf 'manual_review_required' als quoted Wert nicht vorkommen.
    expect(sql).not.toMatch(/'manual_review_required'/);
  });

  it("source_id ist NOT NULL FK auf public.deadline_source_versions(id)", () => {
    expect(sql).toMatch(
      /source_id uuid\s+not null[\s\S]*?references public\.deadline_source_versions\(id\)/
    );
  });

  it("source_version ist Pflichtfeld (Char-Length-Check vorhanden)", () => {
    expect(sql).toMatch(/source_version text not null/);
    expect(sql).toMatch(
      /char_length\(source_version\) between 1 and \d+/
    );
  });

  it("gueltig_ab/gueltig_bis sind DATE-Felder mit Range-Constraint", () => {
    expect(sql).toMatch(/gueltig_ab date not null/);
    expect(sql).toMatch(/gueltig_bis date null/);
    expect(sql).toMatch(/gueltig_bis is null or gueltig_bis >= gueltig_ab/);
    // Negative Schutzwand: gueltig_ab/_bis sind NICHT timestamps.
    expect(sql).not.toMatch(/gueltig_ab timestamptz/);
    expect(sql).not.toMatch(/gueltig_bis timestamptz/);
  });

  it("bundesland ist nullable, aber bei Wert Format-Check DE-XX", () => {
    expect(sql).toMatch(/bundesland text null/);
    expect(sql).toMatch(
      /check\s*\(\s*bundesland is null or bundesland\s*~\s*'\^de-\[a-z\]\{2\}\$'\s*\)/
    );
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_holiday_rules enable row level security/
    );
  });

  it("hat SELECT-Policy fuer authenticated", () => {
    expect(sql).toMatch(
      /create policy[\s\S]*?on public\.deadline_holiday_rules[\s\S]*?for select[\s\S]*?to authenticated/
    );
  });

  it("hat KEINE INSERT/UPDATE/DELETE-Policy fuer authenticated", () => {
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern)", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_holiday_rules to authenticated/
    );
  });

  it("erteilt GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_holiday_rules to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_holiday_rules[^;]*to anon/
    );
  });

  it("aktiviert keinen UI-/Service-/Berechnungspfad (keine Trigger, Functions, Material-Views)", () => {
    expect(sql).not.toMatch(/create function/);
    expect(sql).not.toMatch(/create or replace function/);
    expect(sql).not.toMatch(/create trigger/);
    expect(sql).not.toMatch(/create materialized view/);
  });

  it("enthaelt keine destruktiven Statements (DROP TABLE/COLUMN, RENAME)", () => {
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  it("aendert keine bestehenden Tabellen (kein ALTER TABLE auf Bestand)", () => {
    // Erlaubt: ALTER TABLE public.deadline_holiday_rules ENABLE ROW LEVEL SECURITY
    // auf die gerade erstellte Tabelle.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.deadline_holiday_rules/);
    }
  });

  it("beruehrt KEINE Bestandstabellen aus dem Fristen-Datenmodell (municipalities, client_deadline, status_history)", () => {
    // Keine Referenz, kein Update, kein FK-Aufbau in diese Tabellen.
    expect(sql).not.toMatch(/deadline_municipalities/);
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/deadline_status_history/);
  });

  it("aktiviert keine UI-/Service-/Berechnungslogik", () => {
    // Keine Hinweise auf Bezugsmodule.
    expect(sql).not.toMatch(/notify\s*\(/);
    expect(sql).not.toMatch(/pg_notify/);
    // Kein Aufbau eines Berechnungs-Helpers.
    expect(sql).not.toMatch(/calculate/);
    expect(sql).not.toMatch(/compute/);
  });

  it("hat keinen Bezug zu DeadlinesPage/KanzleiDashboard/ArbeitsplatzPage", () => {
    // Reine SQL-Migration darf keine Bezuege auf App-Pages enthalten.
    expect(sql).not.toMatch(/deadlinespage/);
    expect(sql).not.toMatch(/kanzleidashboard/);
    expect(sql).not.toMatch(/arbeitsplatzpage/);
  });

  it("ist idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS + DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(sql).toMatch(
      /drop policy if exists deadline_holiday_rules_select[\s\S]*?on public\.deadline_holiday_rules/
    );
    expect(sql).toMatch(
      /create policy deadline_holiday_rules_select[\s\S]*?on public\.deadline_holiday_rules/
    );
  });
});
