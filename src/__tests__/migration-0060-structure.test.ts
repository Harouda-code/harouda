// Sprint Fristen / P1 · Migration-0060-Struktur-Check.
//
// Globale Source-Versions-Registry (`public.deadline_source_versions`).
// Diese Tests pruefen das SQL als Text und verifizieren die Struktur-
// Garantien, OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine produktive Importlogik, kein Berechnungspfad, keine UI.
// Die Tests sind reine Strukturchecks auf das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0060_deadline_source_versions.sql"
);

describe("Migration 0060 · deadline_source_versions Struktur-Contract", () => {
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
    expect(sql.length).toBeGreaterThan(400);
  });

  it("legt genau eine Tabelle public.deadline_source_versions an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_source_versions/
    );
    const tableMatches = sql.match(/create table if not exists/g) ?? [];
    expect(tableMatches.length).toBe(1);
  });

  it("Tabelle ist global: KEIN client_id-Feld (auch nicht nullable)", () => {
    expect(sql).not.toMatch(/client_id/);
  });

  it("Tabelle ist global: KEIN company_id-Feld", () => {
    expect(sql).not.toMatch(/company_id/);
  });

  it("CHECK-Constraint auf source_kind enthaelt exakt die 8 erlaubten Werte", () => {
    const allowedKinds = [
      "gemfa",
      "destatis_gv_isys",
      "landesgesetz",
      "landesstatistik",
      "stadtsatzung",
      "verordnung",
      "manuell",
      "validation_reference",
    ];
    for (const kind of allowedKinds) {
      expect(sql, `erlaubter source_kind '${kind}' fehlt im SQL`).toMatch(
        new RegExp(`'${kind}'`)
      );
    }
    // Sicherstellen, dass der CHECK genau einmal als IN-Liste auftaucht
    // und die acht Werte umschliesst.
    expect(sql).toMatch(/check\s*\(\s*[\s\S]*source_kind\s+in\s*\(/);
  });

  it("CHECK-Constraint lehnt unbekannte source_kind-Werte ab (Negativ-Stichprobe)", () => {
    // Beispiele fuer unbekannte Werte, die NIEMALS im SQL stehen duerfen.
    // Der CHECK ist eine geschlossene IN-Liste; jede Erweiterung muss
    // bewusst durch eine Migration erfolgen.
    const forbiddenKinds = [
      "bundesland_random",
      "wikipedia",
      "manual_import", // 'manuell' != 'manual_import'
      "validation_only", // 'validation_reference' != 'validation_only'
      "gemeinde",
      "kalender",
      "feiertag",
      "source",
    ];
    for (const kind of forbiddenKinds) {
      expect(
        sql,
        `unbekannter source_kind '${kind}' darf nicht im SQL stehen`
      ).not.toMatch(new RegExp(`'${kind}'`));
    }
  });

  it("imported_by referenziert auth.users(id) — nicht employees, nicht user_profiles", () => {
    expect(sql).toMatch(
      /imported_by uuid[\s\S]*?references auth\.users\(id\)/
    );
    expect(sql).not.toMatch(
      /imported_by[\s\S]*?references public\.employees/
    );
    expect(sql).not.toMatch(
      /imported_by[\s\S]*?references public\.user_profiles/
    );
  });

  it("validation_against ist Self-FK auf dieselbe Tabelle (deadline_source_versions)", () => {
    expect(sql).toMatch(
      /validation_against uuid[\s\S]*?references public\.deadline_source_versions\(id\)/
    );
  });

  it("imported_at, created_at, updated_at haben Default now()", () => {
    expect(sql).toMatch(/imported_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_source_versions enable row level security/
    );
  });

  it("hat SELECT-Policy fuer authenticated, KEINE INSERT/UPDATE/DELETE-Policy", () => {
    // SELECT-Policy fuer globale Lesefreigabe.
    expect(sql).toMatch(
      /create policy[\s\S]*?on public\.deadline_source_versions[\s\S]*?for select[\s\S]*?to authenticated/
    );
    // Schreiben bleibt service_role-only — keine Policy fuer insert/update/delete.
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern, read-only globale Stammdaten)", () => {
    // Ohne diesen GRANT scheitert eine SELECT-Abfrage authentifizierter
    // Sessions an der GRANT-Schicht, BEVOR die SELECT-RLS-Policy ueberhaupt
    // greift ("Lehre 44: GRANT und RLS sind orthogonale Schichten").
    expect(sql).toMatch(
      /grant select on public\.deadline_source_versions to authenticated/
    );
  });

  it("erteilt GRANT an service_role fuer spaetere Backend-/Importpfade", () => {
    // service_role braucht eigene Rechte; das `grant all on all tables`
    // aus 0054:156 wirkt nur auf damals existierende Tabellen und wird
    // von dieser neuen Tabelle nicht geerbt.
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_source_versions to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention bleibt unveraendert)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_source_versions[^;]*to anon/
    );
  });

  it("enthaelt keine destruktiven Statements (DROP TABLE/COLUMN, RENAME)", () => {
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  it("ist idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(1);
  });

  it("aktiviert keinen Import-/UI-/Berechnungspfad (keine Triggers, Funktionen, Material-Views)", () => {
    expect(sql).not.toMatch(/create function/);
    expect(sql).not.toMatch(/create or replace function/);
    expect(sql).not.toMatch(/create trigger/);
    expect(sql).not.toMatch(/create materialized view/);
  });
});
