// Sprint Fristen / P3.2 + P3.4 · Migration-0061-Struktur-Check.
//
// Globale AGS-/Gemeinde-Stammdaten-Registry (`public.deadline_municipalities`).
// Diese Tests pruefen das SQL als Text und verifizieren die Struktur-
// Garantien, OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine Feiertagslogik, keine Berechnung, keine UI. Die Tests sind
// reine Strukturchecks auf das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0061_deadline_municipalities.sql"
);

describe("Migration 0061 · deadline_municipalities Struktur-Contract", () => {
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

  it("legt genau eine Tabelle public.deadline_municipalities an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_municipalities/
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

  it("ags ist Pflicht-Feld und fachlicher Schluessel (CHECK auf 8-stellige Ziffer)", () => {
    // Spaltendefinition
    expect(sql).toMatch(/\bags text not null\b/);
    // CHECK-Constraint: 8-stellige Ziffer
    expect(sql).toMatch(/check\s*\(\s*ags\s*~\s*'\^\[0-9\]\{8\}\$'\s*\)/);
  });

  it("gemeindename und bundesland sind Pflicht (mit Format-Check fuer bundesland)", () => {
    expect(sql).toMatch(/gemeindename text not null/);
    expect(sql).toMatch(/bundesland text not null/);
    // ISO 3166-2:DE-Format-CHECK
    expect(sql).toMatch(
      /check\s*\(\s*bundesland\s*~\s*'\^de-\[a-z\]\{2\}\$'\s*\)/
    );
  });

  it("gueltig_ab/gueltig_bis sind DATE-Felder (Kalenderdatum, kein UTC-Timestamp)", () => {
    expect(sql).toMatch(/gueltig_ab date not null/);
    expect(sql).toMatch(/gueltig_bis date null/);
    // Konsistenz-Constraint: gueltig_bis >= gueltig_ab
    expect(sql).toMatch(/gueltig_bis is null or gueltig_bis >= gueltig_ab/);
  });

  it("vorgaenger_ags und nachfolger_ags sind nullable Text-Felder mit 8-stelligem Format-Check", () => {
    expect(sql).toMatch(/vorgaenger_ags text null/);
    expect(sql).toMatch(/nachfolger_ags text null/);
    expect(sql).toMatch(
      /check\s*\(\s*vorgaenger_ags is null or vorgaenger_ags\s*~\s*'\^\[0-9\]\{8\}\$'\s*\)/
    );
    expect(sql).toMatch(
      /check\s*\(\s*nachfolger_ags is null or nachfolger_ags\s*~\s*'\^\[0-9\]\{8\}\$'\s*\)/
    );
  });

  it("source_id ist NOT NULL FK auf public.deadline_source_versions(id)", () => {
    expect(sql).toMatch(
      /source_id uuid\s+not null[\s\S]*?references public\.deadline_source_versions\(id\)/
    );
  });

  it("source_version ist Pflicht-Feld (Char-Length-Check)", () => {
    expect(sql).toMatch(/source_version text not null/);
  });

  it("created_at, updated_at haben Default now()", () => {
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_municipalities enable row level security/
    );
  });

  it("hat SELECT-Policy fuer authenticated, KEINE INSERT/UPDATE/DELETE-Policy", () => {
    expect(sql).toMatch(
      /create policy[\s\S]*?on public\.deadline_municipalities[\s\S]*?for select[\s\S]*?to authenticated/
    );
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern)", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_municipalities to authenticated/
    );
  });

  it("erteilt GRANT an service_role fuer spaetere Backend-/Importpfade", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_municipalities to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention bleibt unveraendert)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_municipalities[^;]*to anon/
    );
  });

  it("modelliert KEINE PLZ als Schluessel oder Spalte", () => {
    // Keine plz-Spalte / kein plz-Index / kein plz-Constraint.
    expect(sql).not.toMatch(/\bplz\b/);
    expect(sql).not.toMatch(/postleitzahl/);
    expect(sql).not.toMatch(/postal_code/);
  });

  it("aktiviert keinen UI-/Service-/Berechnungspfad (keine Trigger, Funktionen, Material-Views)", () => {
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

  it("aendert keine bestehenden Tabellen (kein ALTER TABLE ... ADD COLUMN auf Bestand)", () => {
    // Erlaubt: ALTER TABLE public.deadline_municipalities ENABLE ROW LEVEL SECURITY
    // (das ist eine Eigentumsoperation auf der gerade erstellten Tabelle).
    // Verboten: ALTER TABLE auf andere existierende Tabellen.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.deadline_municipalities/);
    }
  });

  it("ist idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(1);
  });

  it("Policy-Statement nutzt DROP POLICY IF EXISTS + CREATE POLICY (idempotent)", () => {
    expect(sql).toMatch(
      /drop policy if exists deadline_municipalities_select[\s\S]*?on public\.deadline_municipalities/
    );
    expect(sql).toMatch(
      /create policy deadline_municipalities_select[\s\S]*?on public\.deadline_municipalities/
    );
  });

  it("referenziert KEINE Feiertags-/Berechnungs-/Finanzamt-Strukturen", () => {
    expect(sql).not.toMatch(/holiday/);
    expect(sql).not.toMatch(/feiertag/);
    expect(sql).not.toMatch(/finanzamt/);
    expect(sql).not.toMatch(/finanzkasse/);
    expect(sql).not.toMatch(/client_deadline/);
    expect(sql).not.toMatch(/deadline_status_history/);
  });
});
