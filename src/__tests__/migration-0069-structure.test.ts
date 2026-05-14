// Sprint Fristen / P2 v1.1 + P4 v1.1 · Migration-0069-Struktur-Check.
//
// Materialisierungs-Bridge zwischen public.deadline_status_history (0068)
// und public.client_deadline (0067):
//   * Additive Spalte public.client_deadline.status (nullable, CHECK auf
//     v1-Wertemenge).
//   * AFTER-INSERT-Trigger auf public.deadline_status_history
//     materialisiert client_deadline.status aus NEW.status_to.
//   * BEFORE-UPDATE-OF-status-Guard auf public.client_deadline blockiert
//     direkte Statusaenderungen (pg_trigger_depth() = 1).
//
// Diese Tests pruefen das SQL als Text und verifizieren die Struktur-
// Garantien, OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine RLS-/GRANT-/Policy-Aenderung, kein Backfill-DML, kein
// Service, keine UI, keine Berechnung. Kein neues Table, keine neue
// Spalte ausser public.client_deadline.status.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0069_client_deadline_status_materialization.sql"
);

describe("Migration 0069 · client_deadline.status Materialisierungs-Bridge Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  // Schritt 1: -- Kommentarzeilen entfernen.
  // Schritt 2: COMMENT ON-Statements entfernen, damit Metadaten-
  // Beschreibungen keine False Positives erzeugen (z. B. der Wert
  // "planned" in einer Spalten-Beschreibung waere ein false positive fuer
  // den Schema-Check).
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/comment on (table|column|index|schema)[^;]*;/g, "");

  // Funktionsbody-Extraktion: jede Trigger-Funktion liegt zwischen ihrem
  // ersten "as $$" und dem naechsten "$$". Non-greedy Capture isoliert
  // den Body.
  const matMatch = sql.match(
    /create or replace function public\.deadline_status_history_materialize[\s\S]*?as\s+\$\$([\s\S]*?)\$\$/
  );
  const matBody = matMatch ? matMatch[1] : "";

  const guardMatch = sql.match(
    /create or replace function public\.client_deadline_protect_status[\s\S]*?as\s+\$\$([\s\S]*?)\$\$/
  );
  const guardBody = guardMatch ? guardMatch[1] : "";

  // ============================================================
  // A. Datei und Scope
  // ============================================================

  it("A1 existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(1000);
  });

  it("A2 erstellt keine neue Tabelle", () => {
    expect(sql).not.toMatch(/create table/);
  });

  it("A3 beruehrt per ALTER TABLE nur public.client_deadline", () => {
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    expect(alterMatches.length).toBeGreaterThanOrEqual(1);
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE: ${match}`
      ).toMatch(/alter table public\.client_deadline/);
    }
  });

  it("A4 kein ALTER TABLE auf public.deadline_status_history", () => {
    expect(sql).not.toMatch(/alter table public\.deadline_status_history/);
  });

  it("A5 keine Referenz auf 0060-0068 als Migrationsnummern", () => {
    expect(sql).not.toMatch(/\b0060\b/);
    expect(sql).not.toMatch(/\b0061\b/);
    expect(sql).not.toMatch(/\b0062\b/);
    expect(sql).not.toMatch(/\b0063\b/);
    expect(sql).not.toMatch(/\b0064\b/);
    expect(sql).not.toMatch(/\b0065\b/);
    expect(sql).not.toMatch(/\b0066\b/);
    expect(sql).not.toMatch(/\b0067\b/);
    expect(sql).not.toMatch(/\b0068\b/);
  });

  it("A6 keine UI-/Service-/Berechnungs-/ELSTER-Bezuege", () => {
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
  // B. Status-Spalte
  // ============================================================

  it("B7 ALTER TABLE ADD COLUMN IF NOT EXISTS status text null vorhanden", () => {
    expect(sql).toMatch(
      /alter table public\.client_deadline\s+add column if not exists status text\s+null/
    );
  });

  it("B8-B10 status ist nullable, kein NOT NULL, kein DEFAULT", () => {
    // Negativ-Anker: nirgends 'add column if not exists status text not null'
    // oder 'status text not null default …'.
    expect(sql).not.toMatch(/add column if not exists status text\s+not null/);
    expect(sql).not.toMatch(/add column[\s\S]*?status text[\s\S]*?default/);
    // Auch keine spaetere alter column ... set default oder set not null
    // auf status in dieser Migration.
    expect(sql).not.toMatch(/alter column status set default/);
    expect(sql).not.toMatch(/alter column status set not null/);
  });

  it("B11 named CHECK-Constraint client_deadline_status_enum vorhanden", () => {
    expect(sql).toMatch(/client_deadline_status_enum/);
  });

  it("B12 ADD CONSTRAINT IF NOT EXISTS ist VERBOTEN (PostgreSQL-Anti-Pattern)", () => {
    expect(sql).not.toMatch(/add constraint if not exists/);
  });

  it("B13 DROP CONSTRAINT IF EXISTS client_deadline_status_enum vorhanden", () => {
    expect(sql).toMatch(
      /alter table public\.client_deadline\s+drop constraint if exists client_deadline_status_enum/
    );
  });

  it("B14 ADD CONSTRAINT client_deadline_status_enum CHECK vorhanden", () => {
    expect(sql).toMatch(
      /alter table public\.client_deadline\s+add constraint client_deadline_status_enum\s+check/
    );
  });

  it("B15 CHECK erlaubt status IS NULL", () => {
    expect(sql).toMatch(
      /add constraint client_deadline_status_enum[\s\S]*?check\s*\(\s*status is null\s+or\s+status in\s*\(/
    );
  });

  it("B16 CHECK enthaelt exakt die 4 v1-Werte", () => {
    const allowed = ["planned", "in_progress", "not_applicable", "cancelled"];
    for (const v of allowed) {
      expect(sql, `Statuswert '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
  });

  it("B17 verbotene Werte kommen NICHT als Quoted-Wert vor", () => {
    const forbidden = [
      "completed",
      "done",
      "erledigt",
      "submitted",
      "uebermittelt",
      "approved",
      "geprueft",
      "freigegeben",
      "overdue",
      "green",
      "yellow",
      "red",
      "manual_review_required",
      "open",
      "new",
      "closed",
      "pending",
      "review",
      "unknown",
    ];
    for (const v of forbidden) {
      expect(
        sql,
        `verbotener Statuswert '${v}' darf nicht im SQL stehen`
      ).not.toMatch(new RegExp(`'${v}'`));
    }
  });

  it("B18 manual_review_required kommt auch unquoted nicht vor", () => {
    expect(sql).not.toMatch(/manual_review_required/);
  });

  // ============================================================
  // C. Materialisierungs-Funktion
  // ============================================================

  it("C19 genau eine Funktion public.deadline_status_history_materialize", () => {
    expect(sql).toMatch(
      /create or replace function public\.deadline_status_history_materialize\s*\(/
    );
    const count = (
      sql.match(
        /create or replace function public\.deadline_status_history_materialize/g
      ) ?? []
    ).length;
    expect(count).toBe(1);
    expect(matBody.length).toBeGreaterThan(0);
  });

  it("C20-C23 Materialisierung: returns trigger, plpgsql, SECURITY DEFINER, pinned search_path", () => {
    expect(sql).toMatch(
      /create or replace function public\.deadline_status_history_materialize[\s\S]*?returns trigger[\s\S]*?language plpgsql[\s\S]*?security definer[\s\S]*?set search_path\s*=\s*pg_catalog,\s*public/
    );
  });

  it("C24 Funktionsbody enthaelt genau ein UPDATE public.client_deadline", () => {
    const updates = (matBody.match(/update\s+public\.client_deadline/g) ?? [])
      .length;
    expect(updates).toBe(1);
  });

  it("C25 Funktionsbody hat KEIN UPDATE auf andere Tabellen", () => {
    expect(matBody).not.toMatch(/update\s+public\.(?!client_deadline)/);
    expect(matBody).not.toMatch(/update\s+auth\./);
  });

  it("C26 Funktionsbody hat KEIN INSERT und KEIN DELETE", () => {
    expect(matBody).not.toMatch(/\binsert\s+into\b/);
    expect(matBody).not.toMatch(/\bdelete\s+from\b/);
  });

  it("C27 Funktionsbody setzt status = NEW.status_to", () => {
    expect(matBody).toMatch(/set\s+status\s*=\s*new\.status_to/);
  });

  it("C28 Funktionsbody setzt updated_at = now()", () => {
    expect(matBody).toMatch(/updated_at\s*=\s*now\(\)/);
  });

  it("C29 Funktionsbody nutzt WHERE id = NEW.client_deadline_id", () => {
    expect(matBody).toMatch(/where\s+id\s*=\s*new\.client_deadline_id/);
  });

  it("C30 Funktionsbody beruehrt keine anderen client_deadline-Spalten", () => {
    expect(matBody).not.toMatch(/due_date/);
    expect(matBody).not.toMatch(/period_start/);
    expect(matBody).not.toMatch(/period_end/);
    expect(matBody).not.toMatch(/deadline_type/);
    expect(matBody).not.toMatch(/deadline_class/);
    expect(matBody).not.toMatch(/source_id/);
    expect(matBody).not.toMatch(/source_version/);
    expect(matBody).not.toMatch(/company_id/);
    // client_id (Spaltenname) — client_deadline_id enthaelt nicht das Wort
    // "client_id" als Substring (da "client_" von "deadline_id" gefolgt
    // wird, nicht von "id"). Der Test ist daher false-positive-frei.
    expect(matBody).not.toMatch(/client_id/);
  });

  it("C31 Funktionsbody enthaelt keine quoted Statuswerte", () => {
    expect(matBody).not.toMatch(/'planned'/);
    expect(matBody).not.toMatch(/'in_progress'/);
    expect(matBody).not.toMatch(/'not_applicable'/);
    expect(matBody).not.toMatch(/'cancelled'/);
  });

  it("C32 Funktionsbody hat kein pg_notify/calculate/compute/notify", () => {
    expect(matBody).not.toMatch(/pg_notify/);
    expect(matBody).not.toMatch(/\bcalculate\b/);
    expect(matBody).not.toMatch(/\bcompute\b/);
    expect(matBody).not.toMatch(/\bnotify\s*\(/);
  });

  // ============================================================
  // D. Materialisierungs-Trigger
  // ============================================================

  it("D33-D36 Materialisierungs-Trigger: name + AFTER INSERT + FOR EACH ROW + EXECUTE FUNCTION", () => {
    expect(sql).toMatch(
      /create trigger deadline_status_history_materialize_aiur\s+after insert on public\.deadline_status_history\s+for each row\s+execute function public\.deadline_status_history_materialize\(\)/
    );
  });

  it("D37 kein UPDATE/DELETE/TRUNCATE-Trigger auf deadline_status_history", () => {
    expect(sql).not.toMatch(
      /create trigger[^;]*after\s+update\s+on public\.deadline_status_history/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*after\s+delete\s+on public\.deadline_status_history/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*before\s+update\s+on public\.deadline_status_history/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*before\s+delete\s+on public\.deadline_status_history/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*\btruncate\b[^;]*public\.deadline_status_history/
    );
  });

  it("D38 kein BEFORE-Trigger fuer Materialisierung", () => {
    expect(sql).not.toMatch(
      /create trigger deadline_status_history_materialize[^;]*before/
    );
  });

  // ============================================================
  // E. Guard-Funktion
  // ============================================================

  it("E39 genau eine Funktion public.client_deadline_protect_status", () => {
    expect(sql).toMatch(
      /create or replace function public\.client_deadline_protect_status\s*\(/
    );
    const count = (
      sql.match(
        /create or replace function public\.client_deadline_protect_status/g
      ) ?? []
    ).length;
    expect(count).toBe(1);
    expect(guardBody.length).toBeGreaterThan(0);
  });

  it("E40-E43 Guard: returns trigger, plpgsql, SECURITY DEFINER, pinned search_path", () => {
    expect(sql).toMatch(
      /create or replace function public\.client_deadline_protect_status[\s\S]*?returns trigger[\s\S]*?language plpgsql[\s\S]*?security definer[\s\S]*?set search_path\s*=\s*pg_catalog,\s*public/
    );
  });

  it("E44 Guard-Body nutzt NEW.status IS DISTINCT FROM OLD.status", () => {
    expect(guardBody).toMatch(
      /new\.status\s+is distinct from\s+old\.status/
    );
  });

  it("E45 Guard-Body nutzt pg_trigger_depth() = 1", () => {
    expect(guardBody).toMatch(/pg_trigger_depth\(\)\s*=\s*1/);
  });

  it("E46 Guard-Body enthaelt RAISE EXCEPTION", () => {
    expect(guardBody).toMatch(/raise exception/);
  });

  it("E47 Guard-Body enthaelt RETURN NEW", () => {
    expect(guardBody).toMatch(/return new\b/);
  });

  it("E48 Guard-Body hat kein UPDATE/INSERT/DELETE", () => {
    expect(guardBody).not.toMatch(/\bupdate\s+\w/);
    expect(guardBody).not.toMatch(/\binsert\s+into\b/);
    expect(guardBody).not.toMatch(/\bdelete\s+from\b/);
  });

  it("E49 Guard-Body hat kein SELECT", () => {
    expect(guardBody).not.toMatch(/\bselect\b/);
  });

  it("E50 Guard-Body hat keine quoted Statuswerte", () => {
    expect(guardBody).not.toMatch(/'planned'/);
    expect(guardBody).not.toMatch(/'in_progress'/);
    expect(guardBody).not.toMatch(/'not_applicable'/);
    expect(guardBody).not.toMatch(/'cancelled'/);
  });

  it("E51 Guard-Body hat kein current_setting / set_config", () => {
    expect(guardBody).not.toMatch(/current_setting/);
    expect(guardBody).not.toMatch(/set_config/);
  });

  it("E52 Guard-Body hat kein pg_notify", () => {
    expect(guardBody).not.toMatch(/pg_notify/);
    expect(guardBody).not.toMatch(/\bnotify\s*\(/);
  });

  // ============================================================
  // F. Guard-Trigger
  // ============================================================

  it("F53-F56 Guard-Trigger: name + BEFORE UPDATE OF status + FOR EACH ROW + EXECUTE FUNCTION", () => {
    expect(sql).toMatch(
      /create trigger client_deadline_protect_status_bu\s+before update of status on public\.client_deadline\s+for each row\s+execute function public\.client_deadline_protect_status\(\)/
    );
  });

  it("F57 kein BEFORE UPDATE ohne OF status auf client_deadline", () => {
    // Erlaubt: BEFORE UPDATE OF status. Verboten: BEFORE UPDATE ohne OF.
    expect(sql).not.toMatch(
      /create trigger[^;]*before update on public\.client_deadline/
    );
    // Auch keine BEFORE UPDATE OF auf einer anderen Spalte als status.
    const beforeUpdateOf =
      sql.match(/before update of (\w+) on public\.client_deadline/g) ?? [];
    for (const m of beforeUpdateOf) {
      expect(m).toMatch(/before update of status on public\.client_deadline/);
    }
  });

  it("F58 kein INSERT/DELETE/TRUNCATE-Trigger auf client_deadline", () => {
    expect(sql).not.toMatch(
      /create trigger[^;]*after\s+insert\s+on public\.client_deadline/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*before\s+insert\s+on public\.client_deadline/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*after\s+delete\s+on public\.client_deadline/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*before\s+delete\s+on public\.client_deadline/
    );
    expect(sql).not.toMatch(
      /create trigger[^;]*\btruncate\b[^;]*public\.client_deadline/
    );
  });

  // ============================================================
  // G. Anzahl und Idempotenz
  // ============================================================

  it("G59 genau zwei CREATE OR REPLACE FUNCTION-Statements", () => {
    const count = (sql.match(/create or replace function/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("G60 genau zwei CREATE TRIGGER-Statements", () => {
    const count = (sql.match(/\bcreate trigger\b/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("G61 genau zwei DROP TRIGGER IF EXISTS-Statements", () => {
    const count = (sql.match(/\bdrop trigger if exists\b/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("G62 beide Trigger nutzen Drop-before-create-Pattern", () => {
    expect(sql).toMatch(
      /drop trigger if exists deadline_status_history_materialize_aiur\s+on public\.deadline_status_history/
    );
    expect(sql).toMatch(
      /drop trigger if exists client_deadline_protect_status_bu\s+on public\.client_deadline/
    );
  });

  it("G63 keine weiteren Funktionen (keine plain CREATE FUNCTION)", () => {
    // Erlaubt: create or replace function. Verboten: create function ohne
    // or replace (unbeabsichtigte Fremd-Funktionen).
    expect(sql).not.toMatch(/create function /);
  });

  it("G64 keine weiteren Trigger-Definitionen ueber den beiden hinaus", () => {
    // Globale Anzahl wurde in G60 auf 2 geprueft; hier zusaetzlich, dass
    // beide bekannte Namen tragen.
    const triggerHeaders = sql.match(/create trigger (\w+)/g) ?? [];
    expect(triggerHeaders.length).toBe(2);
    expect(triggerHeaders.some((s) => s.includes("deadline_status_history_materialize_aiur"))).toBe(true);
    expect(triggerHeaders.some((s) => s.includes("client_deadline_protect_status_bu"))).toBe(true);
  });

  // ============================================================
  // H. Verbote
  // ============================================================

  it("H65 keine RLS-/Policy-Aenderungen", () => {
    expect(sql).not.toMatch(/\bcreate policy\b/);
    expect(sql).not.toMatch(/\bdrop policy\b/);
    expect(sql).not.toMatch(/enable row level security/);
    expect(sql).not.toMatch(/disable row level security/);
  });

  it("H66 keine GRANT/REVOKE-Aenderungen", () => {
    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\brevoke\b/);
  });

  it("H67 kein audit_log_ref", () => {
    expect(sql).not.toMatch(/audit_log_ref/);
  });

  it("H68 keine references public.audit_log", () => {
    expect(sql).not.toMatch(/references public\.audit_log/);
  });

  it("H69 kein actor_type / actor_kind / system_actor", () => {
    expect(sql).not.toMatch(/actor_type/);
    expect(sql).not.toMatch(/actor_kind/);
    expect(sql).not.toMatch(/system_actor/);
  });

  it("H70 keine kuenstliche User-ID / kein system_user / keine 00000000-Konstante", () => {
    expect(sql).not.toMatch(/00000000-0000-0000-0000-000000000000/);
    expect(sql).not.toMatch(/system_user/);
  });

  it("H71 keine Hash-Chain-Spalten", () => {
    expect(sql).not.toMatch(/prev_hash/);
    expect(sql).not.toMatch(/chain_hash/);
    expect(sql).not.toMatch(/entry_hash/);
    expect(sql).not.toMatch(/\bhash\b/);
  });

  it("H72 keine destruktiven Statements (DROP TABLE/COLUMN, RENAME)", () => {
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  it("H73 kein Backfill-DML ausserhalb des Materialisierungs-Funktionsbodys", () => {
    // Es darf nur EIN einziges UPDATE public.client_deadline geben — im
    // Materialisierungs-Funktionsbody. Global zaehlen wir die Vorkommen.
    const updates = (sql.match(/update\s+public\.client_deadline/g) ?? [])
      .length;
    expect(updates).toBe(1);
    // Keine INSERT INTO und kein DELETE FROM irgendwo in der Migration.
    expect(sql).not.toMatch(/\binsert\s+into\b/);
    expect(sql).not.toMatch(/\bdelete\s+from\b/);
  });

  it("H74 kein Supabase-Apply-/DB-Ausfuehrungsanker", () => {
    expect(sql).not.toMatch(/supabase\s+db\s+push/);
    expect(sql).not.toMatch(/supabase\s+migration\s+apply/);
  });
});
