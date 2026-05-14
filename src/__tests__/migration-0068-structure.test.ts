// Sprint Fristen / P2 v1.1 + P4 v1.1 · Migration-0068-Struktur-Check.
//
// Mandantenspezifische append-only History-Tabelle
// public.deadline_status_history. Diese Tests pruefen das SQL als Text
// und verifizieren die Struktur-Garantien, OHNE die Migration tatsaechlich
// gegen eine DB anzuwenden.
//
// Wichtig: History-only. Keine Aenderung an public.client_deadline. Keine
// status-Spalte in client_deadline. Keine Materialisierung. Kein Service.
// Keine Berechnung. Keine UI.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0068_deadline_status_history.sql"
);

describe("Migration 0068 · deadline_status_history History-only Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  // Schritt 1: -- Kommentarzeilen entfernen.
  // Schritt 2: COMMENT ON-Statements entfernen, damit Assertions nicht auf
  // Metadaten-Beschreibungstexte matchen (z. B. das Wort "manual_review_required"
  // in einer Tabellen-Beschreibung waere ein false positive fuer den Verbots-
  // Check).
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/comment on (table|column|index|schema)[^;]*;/g, "");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(1000);
  });

  it("legt genau eine Tabelle public.deadline_status_history an", () => {
    expect(sql).toMatch(
      /create table if not exists public\.deadline_status_history\b/
    );
    const tableMatches = sql.match(/create table if not exists/g) ?? [];
    expect(tableMatches.length).toBe(1);
  });

  it("client_deadline_id ist uuid NOT NULL FK auf public.client_deadline(id) on delete restrict", () => {
    expect(sql).toMatch(
      /client_deadline_id uuid\s+not null[\s\S]*?references public\.client_deadline\(id\)\s+on delete restrict/
    );
  });

  it("company_id ist uuid NOT NULL FK auf public.companies(id) on delete restrict", () => {
    expect(sql).toMatch(
      /company_id uuid\s+not null[\s\S]*?references public\.companies\(id\)\s+on delete restrict/
    );
  });

  it("client_id ist uuid NOT NULL FK auf public.clients(id) on delete restrict", () => {
    expect(sql).toMatch(
      /client_id uuid\s+not null[\s\S]*?references public\.clients\(id\)\s+on delete restrict/
    );
  });

  it("changed_by_user_id ist uuid NOT NULL FK auf auth.users(id) on delete restrict", () => {
    expect(sql).toMatch(
      /changed_by_user_id uuid\s+not null[\s\S]*?references auth\.users\(id\)\s+on delete restrict/
    );
  });

  it("KEINE FK auf public.employees", () => {
    expect(sql).not.toMatch(/references public\.employees/);
  });

  it("KEINE FK auf public.user_profiles", () => {
    expect(sql).not.toMatch(/references public\.user_profiles/);
  });

  it("status_to-CHECK enthaelt exakt die 4 v1-Werte (planned, in_progress, not_applicable, cancelled)", () => {
    const allowed = ["planned", "in_progress", "not_applicable", "cancelled"];
    for (const v of allowed) {
      expect(sql, `status_to '${v}' fehlt`).toMatch(new RegExp(`'${v}'`));
    }
    expect(sql).toMatch(/status_to\s+in\s*\(/);
    expect(sql).toMatch(
      /constraint deadline_status_history_status_to_enum\s+check/
    );
  });

  it("status_from-CHECK erlaubt NULL oder exakt die 4 v1-Werte", () => {
    expect(sql).toMatch(
      /constraint deadline_status_history_status_from_enum\s+check/
    );
    expect(sql).toMatch(
      /status_from\s+is null\s+or\s+status_from\s+in\s*\(/
    );
  });

  it("verbotene Lifecycle-Werte kommen NICHT als Quoted-Wert vor", () => {
    // Lowercased Quoted-Form aller verbotenen Werte aus P4 v1.1
    // (completed-Pfad / submitted / approved / overdue / UI-Ampel /
    // manual_review_required) plus Drift-Varianten (open / new / closed /
    // pending / review / unknown).
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

  it("manual_review_required kommt auch als unquoted Substring nicht im DDL-Body vor", () => {
    // Quality-Marker aus P3.4 v1.1 — strikte Trennung zur Lifecycle-Achse.
    expect(sql).not.toMatch(/manual_review_required/);
  });

  it("hat KEINE alleinstehende Spalte 'status text' (nur status_from und status_to)", () => {
    // Verhindert eine versehentliche dritte Status-Spalte. status_from
    // und status_to enthalten den Wortteil 'status_' (Underscore ist
    // word-Char), \bstatus\s+text\b matcht sie deshalb nicht.
    expect(sql).not.toMatch(/\bstatus\s+text\b/);
  });

  it("status_reason ist nullable und hat 1-bis-1000-Zeichen-Check", () => {
    expect(sql).toMatch(/status_reason text null/);
    expect(sql).toMatch(
      /constraint deadline_status_history_reason_length\s+check\s*\(\s*status_reason is null\s+or\s+char_length\(status_reason\) between 1 and 1000\s*\)/
    );
  });

  it("changed_at und created_at haben Default now()", () => {
    expect(sql).toMatch(/changed_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
  });

  it("aendert public.client_deadline NICHT (kein ALTER TABLE auf client_deadline, keine neue Spalte)", () => {
    expect(sql).not.toMatch(/alter table public\.client_deadline/);
    // Keine "create table ... public.client_deadline" — diese Migration darf
    // die Foundation-Tabelle nicht (erneut) anlegen.
    expect(sql).not.toMatch(
      /create table\s+(?:if not exists\s+)?public\.client_deadline\s*\(/
    );
  });

  it("fuehrt KEINE client_deadline.status-Spalte ein", () => {
    // Negativ-Anker: weder ADD COLUMN noch eine bare 'status'-Spalten-
    // Definition fuer client_deadline.
    expect(sql).not.toMatch(/add column[\s\S]*?status\s+text/);
    expect(sql).not.toMatch(/client_deadline\.status/);
  });

  it("hat KEIN audit_log_ref-Feld", () => {
    expect(sql).not.toMatch(/audit_log_ref/);
  });

  it("hat KEINE references public.audit_log", () => {
    expect(sql).not.toMatch(/references public\.audit_log/);
  });

  it("hat KEIN actor_type/actor_kind/system_actor-Feld", () => {
    expect(sql).not.toMatch(/actor_type/);
    expect(sql).not.toMatch(/actor_kind/);
    expect(sql).not.toMatch(/system_actor/);
  });

  it("verwendet KEINE kuenstliche User-ID / kein system_user / keine 00000000-Konstante", () => {
    expect(sql).not.toMatch(/00000000-0000-0000-0000-000000000000/);
    expect(sql).not.toMatch(/system_user/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.deadline_status_history enable row level security/
    );
  });

  it("SELECT-Policy fuer authenticated nutzt public.is_company_member(company_id)", () => {
    expect(sql).toMatch(
      /create policy deadline_status_history_select[\s\S]*?on public\.deadline_status_history[\s\S]*?for select[\s\S]*?to authenticated[\s\S]*?using\s*\(\s*public\.is_company_member\s*\(\s*company_id\s*\)\s*\)/
    );
  });

  it("verwendet KEIN public.can_read (existiert im Repo nicht)", () => {
    expect(sql).not.toMatch(/can_read/);
  });

  it("hat KEINE INSERT/UPDATE/DELETE-Policy fuer authenticated", () => {
    expect(sql).not.toMatch(/create policy[^;]*for insert/);
    expect(sql).not.toMatch(/create policy[^;]*for update/);
    expect(sql).not.toMatch(/create policy[^;]*for delete/);
  });

  it("hat RESTRICTIVE Client-Consistency-Policy mit client_belongs_to_company in USING und WITH CHECK", () => {
    const consistencyHead =
      /create policy deadline_status_history_client_consistency\s+on public\.deadline_status_history\s+as restrictive\s+for all/;
    expect(sql).toMatch(consistencyHead);
    expect(sql).toMatch(
      /create policy deadline_status_history_client_consistency[\s\S]*?as restrictive[\s\S]*?for all[\s\S]*?using\s*\(\s*public\.client_belongs_to_company\s*\(\s*client_id\s*,\s*company_id\s*\)\s*\)[\s\S]*?with check\s*\(\s*public\.client_belongs_to_company\s*\(\s*client_id\s*,\s*company_id\s*\)\s*\)\s*;/
    );
  });

  it("client_consistency-Policy enthaelt KEIN USING (true)", () => {
    const m = sql.match(
      /create policy deadline_status_history_client_consistency[\s\S]*?;/
    );
    expect(m).not.toBeNull();
    if (m) {
      expect(m[0]).not.toMatch(/using\s*\(\s*true\s*\)/);
    }
  });

  it("REVOKE UPDATE, DELETE FROM authenticated ist vorhanden (Append-Only-Sicherung)", () => {
    expect(sql).toMatch(
      /revoke\s+update\s*,\s*delete\s+on\s+public\.deadline_status_history\s+from\s+authenticated/
    );
  });

  it("erteilt GRANT SELECT an authenticated", () => {
    expect(sql).toMatch(
      /grant select on public\.deadline_status_history to authenticated/
    );
  });

  it("erteilt GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.deadline_status_history to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.deadline_status_history[^;]*to anon/
    );
  });

  it("aktiviert keinen UI-/Service-/Berechnungspfad (keine Trigger, Functions, Material-Views)", () => {
    expect(sql).not.toMatch(/create function/);
    expect(sql).not.toMatch(/create or replace function/);
    expect(sql).not.toMatch(/create trigger/);
    expect(sql).not.toMatch(/create materialized view/);
  });

  it("hat KEINE Hash-Chain-Spalten (prev_hash, chain_hash, entry_hash, hash)", () => {
    expect(sql).not.toMatch(/prev_hash/);
    expect(sql).not.toMatch(/chain_hash/);
    expect(sql).not.toMatch(/entry_hash/);
    expect(sql).not.toMatch(/\bhash\b/);
  });

  it("aktiviert keine Berechnungs-/Notify-Anker", () => {
    expect(sql).not.toMatch(/pg_notify/);
    expect(sql).not.toMatch(/\bcalculate\b/);
    expect(sql).not.toMatch(/\bcompute\b/);
    expect(sql).not.toMatch(/\bnotify\s*\(/);
  });

  it("hat keinen Bezug zu DeadlinesPage/KanzleiDashboard/ArbeitsplatzPage", () => {
    expect(sql).not.toMatch(/deadlinespage/);
    expect(sql).not.toMatch(/kanzleidashboard/);
    expect(sql).not.toMatch(/arbeitsplatzpage/);
  });

  it("hat keinen Bezug zu DeadlineService/abgabefristCalculator/generateDeadlines", () => {
    expect(sql).not.toMatch(/deadlineservice/);
    expect(sql).not.toMatch(/abgabefristcalculator/);
    expect(sql).not.toMatch(/generatedeadlines/);
  });

  it("referenziert keine Migrationen 0060-0067 als zu aendernde Migrationsnummern", () => {
    // Im Body (nach Stripping aller -- und COMMENT ON) duerfen keine
    // Migrationsnummern als Worte erscheinen. Erlaubt bleiben ihre
    // Tabellenobjekte (z. B. public.client_deadline aus 0067).
    expect(sql).not.toMatch(/\b0060\b/);
    expect(sql).not.toMatch(/\b0061\b/);
    expect(sql).not.toMatch(/\b0062\b/);
    expect(sql).not.toMatch(/\b0063\b/);
    expect(sql).not.toMatch(/\b0064\b/);
    expect(sql).not.toMatch(/\b0065\b/);
    expect(sql).not.toMatch(/\b0066\b/);
    expect(sql).not.toMatch(/\b0067\b/);
  });

  it("enthaelt keine destruktiven Statements (DROP TABLE/COLUMN, RENAME)", () => {
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  it("aendert keine bestehenden Tabellen (kein ALTER TABLE auf Bestand)", () => {
    // Erlaubt: ALTER TABLE public.deadline_status_history ENABLE ROW LEVEL
    // SECURITY auf die gerade erstellte Tabelle. Verboten: ALTER TABLE auf
    // irgendeine andere Tabelle.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.deadline_status_history/);
    }
  });

  it("hat alle empfohlenen Lookup-Indizes (deadline/company/actor)", () => {
    expect(sql).toMatch(
      /create index if not exists deadline_status_history_deadline_changed_idx\s+on public\.deadline_status_history\(client_deadline_id,\s*changed_at desc\)/
    );
    expect(sql).toMatch(
      /create index if not exists deadline_status_history_company_changed_idx\s+on public\.deadline_status_history\(company_id,\s*changed_at desc\)/
    );
    expect(sql).toMatch(
      /create index if not exists deadline_status_history_actor_changed_idx\s+on public\.deadline_status_history\(changed_by_user_id,\s*changed_at desc\)/
    );
  });

  it("ist idempotent: CREATE TABLE/INDEX IF NOT EXISTS + DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(3);

    expect(sql).toMatch(
      /drop policy if exists deadline_status_history_select[\s\S]*?on public\.deadline_status_history/
    );
    expect(sql).toMatch(
      /create policy deadline_status_history_select[\s\S]*?on public\.deadline_status_history/
    );
    expect(sql).toMatch(
      /drop policy if exists deadline_status_history_client_consistency[\s\S]*?on public\.deadline_status_history/
    );
    expect(sql).toMatch(
      /create policy deadline_status_history_client_consistency[\s\S]*?on public\.deadline_status_history/
    );
  });
});
