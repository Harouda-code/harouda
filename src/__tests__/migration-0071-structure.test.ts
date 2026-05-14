// Sprint Fristen / P3.4 v1.1 · Migration-0071-Struktur-Check.
//
// Additive Erweiterung der geschlossenen Wertemenge von
// public.deadline_source_versions.source_kind um den Wert
// 'bundesgesetz'. Diese Tests pruefen das SQL als Text und verifizieren
// die Struktur-Garantien, OHNE die Migration tatsaechlich gegen eine
// DB anzuwenden.
//
// Wichtig: keine Tabelle, keine Daten, keine Policy, kein Trigger,
// keine Function ausser einem anonymen DO-Block zur
// Constraint-Ermittlung. Kein Touch auf 0060-0070 oder deren Tests.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0071_deadline_source_kind_bundesgesetz.sql"
);

describe("Migration 0071 · source_kind-Erweiterung um bundesgesetz Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  // Schritt 1: -- Kommentarzeilen entfernen.
  // Schritt 2: COMMENT ON-Statements entfernen, damit Metadaten-
  // Beschreibungen keine False Positives erzeugen (z. B. das Wort
  // 'rechtsverordnung' in einer Spalten-Beschreibung).
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/comment on (table|column|index|schema)[^;]*;/g, "");

  // DO-Block-Body extrahieren fuer strikte Body-Pruefung.
  const doBlockMatch = sql.match(/do\s+\$\$([\s\S]*?)\$\$/);
  const doBody = doBlockMatch ? doBlockMatch[1] : "";

  // ============================================================
  // A. Datei und Scope
  // ============================================================

  it("A1 existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(500);
  });

  it("A2 kein CREATE TABLE", () => {
    expect(sql).not.toMatch(/create table/);
  });

  it("A3 kein INSERT INTO", () => {
    expect(sql).not.toMatch(/\binsert\s+into\b/);
  });

  it("A4 kein UPDATE", () => {
    expect(sql).not.toMatch(/\bupdate\s+public\./);
  });

  it("A5 kein DELETE FROM", () => {
    expect(sql).not.toMatch(/\bdelete\s+from\b/);
  });

  it("A6 keine CREATE POLICY / DROP POLICY", () => {
    expect(sql).not.toMatch(/\bcreate policy\b/);
    expect(sql).not.toMatch(/\bdrop policy\b/);
  });

  it("A7 kein GRANT / REVOKE", () => {
    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\brevoke\b/);
  });

  it("A8 kein CREATE TRIGGER", () => {
    expect(sql).not.toMatch(/\bcreate trigger\b/);
  });

  it("A9 keine regulaere CREATE FUNCTION ausser anonymem DO-Block", () => {
    // CREATE FUNCTION mit Namen ist verboten; anonymes DO ist
    // erlaubt und tritt ohnehin als 'do $$' auf, nicht als
    // 'create function'.
    expect(sql).not.toMatch(/create function/);
    expect(sql).not.toMatch(/create or replace function/);
  });

  it("A10 keine CREATE MATERIALIZED VIEW", () => {
    expect(sql).not.toMatch(/create materialized view/);
  });

  it("A11 kein Supabase-Apply-/DB-Ausfuehrungsanker", () => {
    expect(sql).not.toMatch(/supabase\s+db\s+push/);
    expect(sql).not.toMatch(/supabase\s+migration\s+apply/);
  });

  it("A12 ADD CONSTRAINT IF NOT EXISTS ist verboten (PostgreSQL-Anti-Pattern)", () => {
    expect(sql).not.toMatch(/add constraint if not exists/);
  });

  // ============================================================
  // B. Tabellen-/Constraint-Scope
  // ============================================================

  it("B13 ALTER TABLE nur auf public.deadline_source_versions", () => {
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    expect(alterMatches.length).toBeGreaterThanOrEqual(1);
    for (const m of alterMatches) {
      expect(
        m,
        `Unerwarteter ALTER TABLE: ${m}`
      ).toMatch(/alter table public\.deadline_source_versions/);
    }
  });

  it("B14 neuer Constraint-Name 'deadline_source_versions_source_kind_enum' vorhanden", () => {
    expect(sql).toMatch(/deadline_source_versions_source_kind_enum/);
  });

  it("B15 DROP CONSTRAINT IF EXISTS auf den Ziel-Namen vorhanden", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_source_versions\s+drop constraint if exists deadline_source_versions_source_kind_enum/
    );
  });

  it("B16 ADD CONSTRAINT mit dem Ziel-Namen vorhanden", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_source_versions\s+add constraint deadline_source_versions_source_kind_enum\s+check/
    );
  });

  // ============================================================
  // C. Wertemenge
  // ============================================================

  it("C17 alle 9 erlaubten Werte sind als Quoted-Strings vorhanden", () => {
    const allowed = [
      "gemfa",
      "destatis_gv_isys",
      "landesgesetz",
      "landesstatistik",
      "stadtsatzung",
      "verordnung",
      "manuell",
      "validation_reference",
      "bundesgesetz",
    ];
    for (const v of allowed) {
      expect(sql, `Wert '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
  });

  it("C18 'bundesgesetz' ist neu vorhanden", () => {
    expect(sql).toMatch(/'bundesgesetz'/);
  });

  it("C19 alle 8 Originalwerte aus 0060 bleiben erhalten", () => {
    const original = [
      "gemfa",
      "destatis_gv_isys",
      "landesgesetz",
      "landesstatistik",
      "stadtsatzung",
      "verordnung",
      "manuell",
      "validation_reference",
    ];
    for (const v of original) {
      expect(sql, `Original-Wert '${v}' wurde entfernt`).toMatch(
        new RegExp(`'${v}'`)
      );
    }
  });

  it("C20 verbotene Drift-Werte kommen NICHT als Quoted-Strings vor", () => {
    const forbidden = [
      "wikipedia",
      "buzer",
      "smartsteuer",
      "sevdesk",
      "manual_import",
      "validation_only",
      "gesetz",
      "bundesrecht",
      "rechtsverordnung",
      "verwaltungsvorschrift",
      "amtliche_portalquelle",
    ];
    for (const v of forbidden) {
      expect(
        sql,
        `verbotener Drift-Wert '${v}' darf nicht im SQL stehen`
      ).not.toMatch(new RegExp(`'${v}'`));
    }
  });

  // ============================================================
  // D. Cross-Table-Sicherheit
  // ============================================================

  it("D21 keine Referenz auf public.deadline_type_catalog", () => {
    expect(sql).not.toMatch(/deadline_type_catalog/);
  });

  it("D22 keine Referenz auf public.client_deadline", () => {
    expect(sql).not.toMatch(/client_deadline/);
  });

  it("D23 keine Referenz auf public.deadline_status_history", () => {
    expect(sql).not.toMatch(/deadline_status_history/);
  });

  it("D24 keine UI-/Service-/Calculator-Bezuege", () => {
    expect(sql).not.toMatch(/arbeitsplatzpage/);
    expect(sql).not.toMatch(/deadlinespage/);
    expect(sql).not.toMatch(/kanzleidashboard/);
    expect(sql).not.toMatch(/deadlineservice/);
    expect(sql).not.toMatch(/abgabefristcalculator/);
    expect(sql).not.toMatch(/generatedeadlines/);
  });

  it("D25 keine ELSTER-/ERiC-Bezuege", () => {
    expect(sql).not.toMatch(/elster/);
    expect(sql).not.toMatch(/eric/);
  });

  it("D26 keine Migrationsnummern-Referenz auf 0060-0070 im DDL-Body", () => {
    // Nach Stripping der -- und COMMENT ON sind die nummerierten
    // Verweise auf vorherige Sprints aus dem Body entfernt; falls eine
    // versehentlich durchschluepfen wuerde, wird sie hier erkannt.
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
    expect(sql).not.toMatch(/\b0070\b/);
  });

  // ============================================================
  // E. Idempotenz-/DO-Block-Pattern
  // ============================================================

  it("E27 Idempotenz-Pattern: DO-Block + DROP IF EXISTS + ADD CONSTRAINT vorhanden", () => {
    expect(sql).toMatch(/do\s+\$\$/);
    expect(sql).toMatch(/\$\$\s*;/);
    expect(sql).toMatch(
      /alter table public\.deadline_source_versions\s+drop constraint if exists deadline_source_versions_source_kind_enum/
    );
    expect(sql).toMatch(
      /alter table public\.deadline_source_versions\s+add constraint deadline_source_versions_source_kind_enum/
    );
  });

  it("E28 DO-Block existiert und nutzt Schema-Introspektion (pg_constraint oder information_schema)", () => {
    expect(doBody.length).toBeGreaterThan(0);
    // Mindestens eine Schema-Introspektions-Quelle muss verwendet
    // werden, um den unnamed Original-Constraint robust zu finden.
    expect(doBody).toMatch(/pg_constraint|information_schema\.check_constraints/);
  });

  it("E29 DO-Block enthaelt KEIN Daten-DML (kein INSERT/UPDATE/DELETE)", () => {
    expect(doBody).not.toMatch(/\binsert\s+into\b/);
    expect(doBody).not.toMatch(/\bupdate\s+public\./);
    expect(doBody).not.toMatch(/\bdelete\s+from\b/);
  });

  it("E30 DO-Block enthaelt nur Constraint-Ermittlung und ALTER DROP CONSTRAINT", () => {
    // Im DO-Block darf nur ein dynamisches ALTER TABLE ... DROP
    // CONSTRAINT stehen. Andere DDL ist im DO-Block nicht zulaessig.
    expect(doBody).not.toMatch(/\badd constraint\b/);
    expect(doBody).not.toMatch(/\bcreate table\b/);
    expect(doBody).not.toMatch(/\bcreate index\b/);
    expect(doBody).not.toMatch(/\bcreate trigger\b/);
    expect(doBody).not.toMatch(/\bcreate function\b/);
    expect(doBody).not.toMatch(/\bcreate materialized view\b/);
    // ALTER TABLE DROP CONSTRAINT muss vorhanden sein (entweder als
    // statischer Text oder als execute format-String).
    expect(doBody).toMatch(
      /alter table public\.deadline_source_versions[\s\S]*?drop constraint/
    );
  });

  it("E31 DO-Block schliesst den Ziel-Namen aus, damit Re-Run no-op ist", () => {
    expect(doBody).toMatch(
      /conname\s*<>\s*'deadline_source_versions_source_kind_enum'|constraint_name\s*<>\s*'deadline_source_versions_source_kind_enum'/
    );
  });

  // ============================================================
  // F. Chain-Stabilitaet (keine destruktiven Statements ausser
  // Constraint-Drop, keine zusaetzlichen Indizes/Tabellen)
  // ============================================================

  it("F32 keine DROP TABLE / DROP COLUMN / RENAME", () => {
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  it("F33 keine zusaetzlichen CREATE INDEX-Statements", () => {
    expect(sql).not.toMatch(/create index/);
  });

  it("F34 keine ENABLE/DISABLE ROW LEVEL SECURITY", () => {
    expect(sql).not.toMatch(/enable row level security/);
    expect(sql).not.toMatch(/disable row level security/);
  });

  it("F35 ALTER TABLE-Statement-Anzahl liegt im erwarteten Bereich", () => {
    // Erwartet werden zwei statische ALTER TABLE-Statements:
    // 1) DROP CONSTRAINT IF EXISTS deadline_source_versions_source_kind_enum
    // 2) ADD CONSTRAINT deadline_source_versions_source_kind_enum ...
    // Der DO-Block enthaelt ein drittes dynamisches ALTER TABLE als
    // String im EXECUTE format(...) — dieses wird beim globalen Match
    // ebenfalls erfasst. Insgesamt also mind. 2 statische plus moeglicher
    // dynamischer Text.
    const altered = (sql.match(/alter table public\.deadline_source_versions/g) ?? [])
      .length;
    expect(altered).toBeGreaterThanOrEqual(2);
    expect(altered).toBeLessThanOrEqual(4);
  });
});
