// Sprint Fristen / P3.2 + P3.4 · Migration-0064-Struktur-Check.
//
// Globale Finanzamt-Stammdaten-Registry (`public.deadline_tax_offices`).
// Diese Tests pruefen das SQL als Text und verifizieren die Struktur-
// Garantien, OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine Finanzkasse, keine Feiertagsregel, keine Berechnung,
// keine UI. Reine Strukturchecks auf das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0064_deadline_tax_offices.sql"
);

describe("Migration 0064 · deadline_tax_offices Struktur-Contract", () => {
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

  it("legt genau eine Tabelle public.deadline_tax_offices an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_tax_offices/
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

  it("bufa_nr ist Pflicht mit CHECK auf exakt 4 Ziffern", () => {
    expect(sql).toMatch(/\bbufa_nr text not null\b/);
    expect(sql).toMatch(/check\s*\(\s*bufa_nr\s*~\s*'\^\[0-9\]\{4\}\$'\s*\)/);
  });

  it("name/adresse/plz/ort/bundesland/ags_sitz sind Pflichtfelder", () => {
    expect(sql).toMatch(/\bname text not null\b/);
    expect(sql).toMatch(/\badresse text not null\b/);
    expect(sql).toMatch(/\bplz text not null\b/);
    expect(sql).toMatch(/\bort text not null\b/);
    expect(sql).toMatch(/\bbundesland text not null\b/);
    expect(sql).toMatch(/\bags_sitz text not null\b/);
  });

  it("plz hat CHECK auf exakt 5 Ziffern (reines Adressfeld)", () => {
    expect(sql).toMatch(/check\s*\(\s*plz\s*~\s*'\^\[0-9\]\{5\}\$'\s*\)/);
  });

  it("bundesland hat ISO-3166-2:DE-Format-CHECK", () => {
    expect(sql).toMatch(
      /check\s*\(\s*bundesland\s*~\s*'\^de-\[a-z\]\{2\}\$'\s*\)/
    );
  });

  it("ags_sitz hat CHECK auf exakt 8 Ziffern (Feiertagsanker)", () => {
    expect(sql).toMatch(
      /check\s*\(\s*ags_sitz\s*~\s*'\^\[0-9\]\{8\}\$'\s*\)/
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

  it("source_version ist Pflichtfeld", () => {
    expect(sql).toMatch(/source_version text not null/);
    expect(sql).toMatch(/char_length\(source_version\) between 1 and \d+/);
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

  it("manual_review_required erscheint nur im review_status-Kontext (keine Lifecycle-/History-/client_deadline-Spur)", () => {
    // Wert existiert mindestens einmal (im review_status-CHECK).
    expect(sql).toMatch(/'manual_review_required'/);
    // Jede Vorkommnis muss in einem review_status-Kontext stehen.
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
    // Keine Lifecycle-/History-/client_deadline-Strukturen in dieser Migration.
    expect(sql).not.toMatch(/lifecycle/);
    expect(sql).not.toMatch(/status_history/);
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/status_reason/);
  });

  it("created_at und updated_at haben Default now()", () => {
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_tax_offices enable row level security/
    );
  });

  it("hat SELECT-Policy fuer authenticated", () => {
    expect(sql).toMatch(
      /create policy[\s\S]*?on public\.deadline_tax_offices[\s\S]*?for select[\s\S]*?to authenticated/
    );
  });

  it("hat KEINE INSERT/UPDATE/DELETE-Policy", () => {
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern)", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_tax_offices to authenticated/
    );
  });

  it("erteilt GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_tax_offices to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_tax_offices[^;]*to anon/
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
    // Erlaubt: ALTER TABLE public.deadline_tax_offices ENABLE ROW LEVEL SECURITY
    // auf die gerade erstellte Tabelle.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.deadline_tax_offices/);
    }
  });

  it("beruehrt KEINE client_deadline- oder deadline_status_history-Strukturen", () => {
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/deadline_status_history/);
  });

  it("modelliert KEINE Finanzkasse-/FA-Kasse-Zuordnung in diesem Sprint", () => {
    expect(sql).not.toMatch(/finanzkasse/);
    expect(sql).not.toMatch(/fa_kasse/);
    expect(sql).not.toMatch(/fa-kasse/);
    expect(sql).not.toMatch(/tax_cashier/);
  });

  it("modelliert KEINE Feiertagsregel-/Feiertagsanwendung-Erweiterung in diesem Sprint", () => {
    // Keine Bezugnahme auf die Feiertagsregel-/Anwendungs-Tabellen.
    expect(sql).not.toMatch(/deadline_holiday_rules/);
    expect(sql).not.toMatch(/deadline_holiday_applications/);
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

  it("ist idempotent: CREATE TABLE/INDEX IF NOT EXISTS + DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(sql).toMatch(
      /drop policy if exists deadline_tax_offices_select[\s\S]*?on public\.deadline_tax_offices/
    );
    expect(sql).toMatch(
      /create policy deadline_tax_offices_select[\s\S]*?on public\.deadline_tax_offices/
    );
  });
});
