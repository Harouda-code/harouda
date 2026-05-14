// Sprint Fristen / P3.2 · Migration-0063-Struktur-Check.
//
// Globale Feiertagsanwendung-pro-AGS-Registry
// (`public.deadline_holiday_applications`). Diese Tests pruefen das SQL
// als Text und verifizieren die Struktur-Garantien, OHNE die Migration
// tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine Berechnung, keine UI. Die Tests sind reine Strukturchecks
// auf das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0063_deadline_holiday_applications.sql"
);

describe("Migration 0063 · deadline_holiday_applications Struktur-Contract", () => {
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

  it("legt genau eine Tabelle public.deadline_holiday_applications an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_holiday_applications/
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

  it("ags ist Pflicht-Feld mit CHECK auf exakt 8 Ziffern", () => {
    expect(sql).toMatch(/\bags text not null\b/);
    expect(sql).toMatch(/check\s*\(\s*ags\s*~\s*'\^\[0-9\]\{8\}\$'\s*\)/);
  });

  it("holiday_rule_id ist NOT NULL FK auf public.deadline_holiday_rules(id)", () => {
    expect(sql).toMatch(
      /holiday_rule_id uuid\s+not null[\s\S]*?references public\.deadline_holiday_rules\(id\)/
    );
  });

  it("holiday_key ist Pflicht-Feld mit lower-snake-case-CHECK", () => {
    expect(sql).toMatch(/holiday_key text not null/);
    expect(sql).toMatch(
      /check\s*\([\s\S]*?holiday_key\s*~\s*'\^\[a-z\]\[a-z0-9_\]\*\$'/
    );
  });

  it("applies ist boolean not null", () => {
    expect(sql).toMatch(/\bapplies boolean not null\b/);
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

  it("source_id ist NOT NULL FK auf public.deadline_source_versions(id)", () => {
    expect(sql).toMatch(
      /source_id uuid\s+not null[\s\S]*?references public\.deadline_source_versions\(id\)/
    );
  });

  it("source_version ist Pflichtfeld", () => {
    expect(sql).toMatch(/source_version text not null/);
    expect(sql).toMatch(/char_length\(source_version\) between 1 and \d+/);
  });

  it("confidence CHECK enthaelt exakt die 3 Werte (high, medium, low)", () => {
    expect(sql).toMatch(/'high'/);
    expect(sql).toMatch(/'medium'/);
    expect(sql).toMatch(/'low'/);
    expect(sql).toMatch(/confidence\s+in\s*\(/);
    // Negativ-Stichprobe: keine anderen Confidence-Werte.
    expect(sql).not.toMatch(/'very_high'/);
    expect(sql).not.toMatch(/'unknown'/);
  });

  it("review_status CHECK enthaelt exakt die 4 Werte", () => {
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

  it("manual_review_required erscheint nur als review_status-Wert (keine Lifecycle-/Status-History-Spur)", () => {
    // Wert existiert mindestens einmal (im review_status-CHECK).
    expect(sql).toMatch(/'manual_review_required'/);
    // Jede Verwendung von 'manual_review_required' muss in einem
    // review_status-Kontext stehen — entweder als CHECK-Wert oder als
    // Filter-Wert eines Partial-Index, der auf review_status filtert.
    // Verboten ist eine Verwendung als Lifecycle-Status oder als Wert
    // einer spaeteren Status-History-Tabelle.
    const positions: number[] = [];
    const re = /'manual_review_required'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
      positions.push(m.index);
    }
    expect(positions.length).toBeGreaterThanOrEqual(1);
    // Pro Fundstelle: in einem Fenster vor dem Vorkommen muss
    // 'review_status' stehen (CHECK-Liste oder Partial-Index-WHERE).
    for (const pos of positions) {
      const window = sql.slice(Math.max(0, pos - 300), pos);
      expect(
        window,
        `'manual_review_required' an Position ${pos} steht nicht im review_status-Kontext`
      ).toMatch(/review_status/);
    }
    // Keine Lifecycle-/Status-History-Strukturen in dieser Migration.
    expect(sql).not.toMatch(/lifecycle/);
    expect(sql).not.toMatch(/status_history/);
  });

  it("created_at und updated_at haben Default now()", () => {
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_holiday_applications enable row level security/
    );
  });

  it("hat SELECT-Policy fuer authenticated", () => {
    expect(sql).toMatch(
      /create policy[\s\S]*?on public\.deadline_holiday_applications[\s\S]*?for select[\s\S]*?to authenticated/
    );
  });

  it("hat KEINE INSERT/UPDATE/DELETE-Policy", () => {
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern)", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_holiday_applications to authenticated/
    );
  });

  it("erteilt GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_holiday_applications to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_holiday_applications[^;]*to anon/
    );
  });

  it("modelliert KEINE PLZ/Postleitzahl/postal_code", () => {
    expect(sql).not.toMatch(/\bplz\b/);
    expect(sql).not.toMatch(/postleitzahl/);
    expect(sql).not.toMatch(/postal_code/);
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
    // Erlaubt: ALTER TABLE public.deadline_holiday_applications
    // ENABLE ROW LEVEL SECURITY auf die gerade erstellte Tabelle.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.deadline_holiday_applications/);
    }
  });

  it("beruehrt KEINE client_deadline- oder deadline_status_history-Strukturen", () => {
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/deadline_status_history/);
  });

  it("aktiviert keine Berechnungslogik (kein calculate/compute/pg_notify)", () => {
    expect(sql).not.toMatch(/pg_notify/);
    expect(sql).not.toMatch(/\bcalculate\b/);
    expect(sql).not.toMatch(/\bcompute\b/);
  });

  it("hat keinen Bezug zu DeadlinesPage/KanzleiDashboard/ArbeitsplatzPage", () => {
    expect(sql).not.toMatch(/deadlinespage/);
    expect(sql).not.toMatch(/kanzleidashboard/);
    expect(sql).not.toMatch(/arbeitsplatzpage/);
  });

  it("ist idempotent: CREATE TABLE/INDEX IF NOT EXISTS + DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(sql).toMatch(
      /drop policy if exists deadline_holiday_applications_select[\s\S]*?on public\.deadline_holiday_applications/
    );
    expect(sql).toMatch(
      /create policy deadline_holiday_applications_select[\s\S]*?on public\.deadline_holiday_applications/
    );
  });
});
