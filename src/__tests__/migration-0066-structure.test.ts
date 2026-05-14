// Sprint Fristen / P3.2 + P3.4 · Migration-0066-Struktur-Check.
//
// Globale FA-Kasse-Zuordnungs-Registry
// (`public.deadline_tax_office_cash_office_assignments`). Diese Tests
// pruefen das SQL als Text und verifizieren die Struktur-Garantien,
// OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine neue Finanzamt-/Finanzkasse-Tabelle, keine
// Feiertagsregel, keine Berechnung, keine UI. Reine Strukturchecks auf
// das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0066_deadline_tax_office_cash_office_assignments.sql"
);

describe("Migration 0066 · deadline_tax_office_cash_office_assignments Struktur-Contract", () => {
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

  it("legt genau eine Tabelle public.deadline_tax_office_cash_office_assignments an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_tax_office_cash_office_assignments/
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

  it("tax_office_id ist NOT NULL FK auf public.deadline_tax_offices(id) on delete restrict", () => {
    expect(sql).toMatch(
      /tax_office_id uuid\s+not null[\s\S]*?references public\.deadline_tax_offices\(id\)\s+on delete restrict/
    );
  });

  it("tax_cash_office_id ist NOT NULL FK auf public.deadline_tax_cash_offices(id) on delete restrict", () => {
    expect(sql).toMatch(
      /tax_cash_office_id uuid\s+not null[\s\S]*?references public\.deadline_tax_cash_offices\(id\)\s+on delete restrict/
    );
  });

  it("gueltig_ab/gueltig_bis sind DATE-Felder, nicht timestamp/timestamptz", () => {
    expect(sql).toMatch(/gueltig_ab date not null/);
    expect(sql).toMatch(/gueltig_bis date null/);
    expect(sql).not.toMatch(/gueltig_ab timestamp/);
    expect(sql).not.toMatch(/gueltig_bis timestamp/);
    expect(sql).not.toMatch(/gueltig_ab timestamptz/);
    expect(sql).not.toMatch(/gueltig_bis timestamptz/);
  });

  it("hat Gueltigkeits-Range-Constraint (gueltig_bis is null or >= gueltig_ab)", () => {
    expect(sql).toMatch(/gueltig_bis is null or gueltig_bis >= gueltig_ab/);
  });

  it("source_id ist NOT NULL FK auf public.deadline_source_versions(id) on delete restrict", () => {
    expect(sql).toMatch(
      /source_id uuid\s+not null[\s\S]*?references public\.deadline_source_versions\(id\)\s+on delete restrict/
    );
  });

  it("source_version ist Pflicht mit Char-Length-CHECK (1 bis 100)", () => {
    expect(sql).toMatch(/source_version text not null/);
    expect(sql).toMatch(
      /check\s*\(\s*char_length\(source_version\) between 1 and 100\s*\)/
    );
  });

  it("confidence CHECK enthaelt exakt die 3 Werte (high, medium, low)", () => {
    expect(sql).toMatch(/'high'/);
    expect(sql).toMatch(/'medium'/);
    expect(sql).toMatch(/'low'/);
    expect(sql).toMatch(/confidence\s+in\s*\(/);
    expect(sql).not.toMatch(/'very_high'/);
    expect(sql).not.toMatch(/'unknown'/);
  });

  it("review_status CHECK enthaelt exakt die 4 erlaubten Werte", () => {
    const allowed = [
      "confirmed",
      "manual_review_required",
      "disputed",
      "deprecated",
    ];
    for (const v of allowed) {
      expect(sql, `review_status '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
    expect(sql).toMatch(/review_status\s+in\s*\(/);
  });

  it("manual_review_required erscheint nur im review_status-Kontext (keine Lifecycle-/History-/client_deadline-/status_reason-Spur)", () => {
    expect(sql).toMatch(/'manual_review_required'/);
    const positions: number[] = [];
    const re = /'manual_review_required'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
      positions.push(m.index);
    }
    expect(positions.length).toBeGreaterThanOrEqual(1);
    for (const pos of positions) {
      const window = sql.slice(Math.max(0, pos - 300), pos);
      expect(
        window,
        `'manual_review_required' an Position ${pos} steht nicht im review_status-Kontext`
      ).toMatch(/review_status/);
    }
    expect(sql).not.toMatch(/lifecycle/);
    expect(sql).not.toMatch(/status_history/);
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/status_reason/);
  });

  it("reviewed_by_user_id ist nullable FK auf auth.users(id), nicht employees, nicht user_profiles", () => {
    expect(sql).toMatch(
      /reviewed_by_user_id uuid\s+null[\s\S]*?references auth\.users\(id\)/
    );
    expect(sql).not.toMatch(
      /reviewed_by_user_id[\s\S]*?references public\.employees/
    );
    expect(sql).not.toMatch(
      /reviewed_by_user_id[\s\S]*?references public\.user_profiles/
    );
  });

  it("reviewed_at ist nullable timestamptz", () => {
    expect(sql).toMatch(/reviewed_at timestamptz null/);
    // Negativ: kein DATE/Default fuer reviewed_at.
    expect(sql).not.toMatch(/reviewed_at date/);
    expect(sql).not.toMatch(/reviewed_at timestamptz[^,]*default now\(\)/);
  });

  it("created_at und updated_at haben Default now()", () => {
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_tax_office_cash_office_assignments enable row level security/
    );
  });

  it("hat SELECT-Policy fuer authenticated", () => {
    expect(sql).toMatch(
      /create policy[\s\S]*?on public\.deadline_tax_office_cash_office_assignments[\s\S]*?for select[\s\S]*?to authenticated/
    );
  });

  it("hat KEINE INSERT/UPDATE/DELETE-Policy", () => {
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern)", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_tax_office_cash_office_assignments to authenticated/
    );
  });

  it("erteilt GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_tax_office_cash_office_assignments to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_tax_office_cash_office_assignments[^;]*to anon/
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
    // Erlaubt: ALTER TABLE public.deadline_tax_office_cash_office_assignments
    // ENABLE ROW LEVEL SECURITY auf die gerade erstellte Tabelle.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.deadline_tax_office_cash_office_assignments/);
    }
  });

  it("beruehrt KEINE client_deadline- oder deadline_status_history-Strukturen", () => {
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/deadline_status_history/);
  });

  it("erstellt KEINE neue Finanzamt-Tabelle und KEINE neue Finanzkasse-Tabelle", () => {
    // Keine CREATE TABLE auf die Eltern-Entitaeten — sie bleiben aus
    // 0064/0065 unveraendert. Wichtig: das Pattern matcht nur das
    // CREATE-TABLE-Statement selbst (Tabellenname unmittelbar gefolgt
    // von `(`), nicht versehentlich eine FK-references-Klausel in der
    // gerade erstellten Zuordnungstabelle.
    expect(sql).not.toMatch(
      /create table\s+(?:if not exists\s+)?public\.deadline_tax_offices\s*\(/
    );
    expect(sql).not.toMatch(
      /create table\s+(?:if not exists\s+)?public\.deadline_tax_cash_offices\s*\(/
    );
  });

  it("modelliert KEINE Feiertagsregel-/Feiertagsanwendung-Erweiterung in diesem Sprint", () => {
    // Keine Bezugnahme auf die Feiertagsregel-/Anwendungs-Tabellen.
    expect(sql).not.toMatch(/deadline_holiday_rules/);
    expect(sql).not.toMatch(/deadline_holiday_applications/);
    expect(sql).not.toMatch(/\bholiday\b/);
    expect(sql).not.toMatch(/\bfeiertag\b/);
  });

  it("aktiviert keine UI-/Service-/Berechnungslogik", () => {
    expect(sql).not.toMatch(/pg_notify/);
    expect(sql).not.toMatch(/\bcalculate\b/);
    expect(sql).not.toMatch(/\bcompute\b/);
    expect(sql).not.toMatch(/\bnotify\s*\(/);
  });

  it("hat keinen Bezug zu DeadlinesPage/KanzleiDashboardPage/ArbeitsplatzPage", () => {
    expect(sql).not.toMatch(/deadlinespage/);
    expect(sql).not.toMatch(/kanzleidashboard/);
    expect(sql).not.toMatch(/arbeitsplatzpage/);
  });

  it("verwendet KEINE direkte audit_log_ref-Spalte als Statusquelle", () => {
    // Diese Migration darf keine audit_log_ref-Spalte fuehren — die
    // Verbindung zum zentralen Audit-Log gehoert in eine spaetere
    // Status-/Workflow-Schicht.
    expect(sql).not.toMatch(/audit_log_ref/);
  });

  it("ist idempotent: CREATE TABLE/INDEX IF NOT EXISTS + DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(sql).toMatch(
      /drop policy if exists deadline_tax_office_cash_office_assignments_select[\s\S]*?on public\.deadline_tax_office_cash_office_assignments/
    );
    expect(sql).toMatch(
      /create policy deadline_tax_office_cash_office_assignments_select[\s\S]*?on public\.deadline_tax_office_cash_office_assignments/
    );
  });
});
