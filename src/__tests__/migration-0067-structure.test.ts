// Sprint Fristen / P2 v1.1 + P3.4 v1.1 + P4 v1.1 · Migration-0067-Struktur-Check.
//
// Mandantenspezifische Foundation-Tabelle public.client_deadline. Diese
// Tests pruefen das SQL als Text und verifizieren die Struktur-
// Garantien, OHNE die Migration tatsaechlich gegen eine DB anzuwenden.
//
// Wichtig: keine status-Spalte, keine deadline_status_history, keine
// catalog_status-Spalte, keine Berechnungslogik, keine UI. Reine
// Strukturchecks auf das geschriebene Migration-File.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0067_client_deadline.sql"
);

describe("Migration 0067 · client_deadline Foundation Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  // Schritt 1: -- Kommentarzeilen entfernen.
  // Schritt 2: COMMENT ON-Statements entfernen, damit Assertions nicht auf
  // Metadaten-Beschreibungstexte matchen (z. B. das Wort "status" in einer
  // Tabellen-Beschreibung waere ein false positive fuer den Schema-Check).
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/comment on (table|column|index|schema)[^;]*;/g, "");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(1000);
  });

  it("legt genau eine Tabelle public.client_deadline an", () => {
    expect(sql).toMatch(/create table if not exists public\.client_deadline\b/);
    const tableMatches = sql.match(/create table if not exists/g) ?? [];
    expect(tableMatches.length).toBe(1);
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

  it("source_id ist uuid NOT NULL FK auf public.deadline_source_versions(id) on delete restrict", () => {
    expect(sql).toMatch(
      /source_id uuid\s+not null[\s\S]*?references public\.deadline_source_versions\(id\)\s+on delete restrict/
    );
  });

  it("deadline_type-CHECK enthaelt exakt die 7 P3.4-v1.1-Werte", () => {
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
    expect(sql).toMatch(/deadline_type\s+in\s*\(/);
    expect(sql).toMatch(/constraint client_deadline_type_enum\s+check/);
  });

  it("deadline_type-CHECK enthaelt KEINE erfundenen Werte (Negativ-Stichprobe)", () => {
    // Diese Werte stehen NICHT in P3.4 v1.1 und duerfen daher NICHT im
    // SQL erscheinen. Der Test verwendet die Quoted-Form, damit 'ustva'
    // ohne Suffix nicht versehentlich 'ustva_abgabe' matcht.
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
        `erfundener deadline_type '${v}' darf nicht im SQL stehen`
      ).not.toMatch(new RegExp(`'${v}'`));
    }
    // 'ustva' (ohne _ABGABE/_ZAHLUNG) als komplette Quoted-Form ist
    // ebenfalls verboten.
    expect(sql).not.toMatch(/'ustva'/);
  });

  it("deadline_class-CHECK enthaelt exakt abgabe, zahlung, nicht_zugeordnet", () => {
    expect(sql).toMatch(/'abgabe'/);
    expect(sql).toMatch(/'zahlung'/);
    expect(sql).toMatch(/'nicht_zugeordnet'/);
    expect(sql).toMatch(/deadline_class\s+in\s*\(/);
    expect(sql).toMatch(/constraint client_deadline_class_enum\s+check/);
  });

  it("Type-Class-Matrix: alle 7 P3.4-v1.1-Paare sind gepaart definiert", () => {
    // Jedes Paar muss innerhalb eines schmalen Fensters (~80 chars)
    // gepaart erscheinen — entspricht jeweils einer Matrix-Klausel.
    expect(sql).toMatch(/'ustva_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'ustva_zahlung'[\s\S]{0,80}?'zahlung'/);
    expect(sql).toMatch(/'lsta_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'lsta_zahlung'[\s\S]{0,80}?'zahlung'/);
    expect(sql).toMatch(/'zm_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'ebilanz_abgabe'[\s\S]{0,80}?'abgabe'/);
    expect(sql).toMatch(/'jahresabschluss_abgabe'[\s\S]{0,80}?'nicht_zugeordnet'/);
    expect(sql).toMatch(/constraint client_deadline_type_class_matrix\s+check/);
  });

  it("ZM_ABGABE ist NICHT mit nicht_zugeordnet verknuepft", () => {
    // Negativ-Test in beide Richtungen, damit kein falsches Matrix-Paar
    // (zm_abgabe, nicht_zugeordnet) im SQL stehen kann.
    expect(sql).not.toMatch(/'zm_abgabe'[\s\S]{0,80}?'nicht_zugeordnet'/);
    expect(sql).not.toMatch(/'nicht_zugeordnet'[\s\S]{0,80}?'zm_abgabe'/);
  });

  it("JAHRESABSCHLUSS_ABGABE ist mit deadline_class=nicht_zugeordnet verbunden", () => {
    // Es muss mindestens ein Paar (jahresabschluss_abgabe, nicht_zugeordnet)
    // im Matrix-Window existieren.
    expect(sql).toMatch(/'jahresabschluss_abgabe'[\s\S]{0,80}?'nicht_zugeordnet'/);
  });

  it("nicht_zugeordnet ist ausschliesslich mit JAHRESABSCHLUSS_ABGABE gepaart", () => {
    // Keine der anderen 6 Type-Werte darf in einem schmalen Window mit
    // nicht_zugeordnet auftauchen.
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

  it("period_start, period_end und due_date sind DATE-Felder", () => {
    expect(sql).toMatch(/period_start date not null/);
    expect(sql).toMatch(/period_end date not null/);
    expect(sql).toMatch(/due_date date not null/);
  });

  it("period_start, period_end und due_date sind NICHT timestamp/timestamptz", () => {
    expect(sql).not.toMatch(/period_start timestamp/);
    expect(sql).not.toMatch(/period_end timestamp/);
    expect(sql).not.toMatch(/due_date timestamp/);
    expect(sql).not.toMatch(/period_start timestamptz/);
    expect(sql).not.toMatch(/period_end timestamptz/);
    expect(sql).not.toMatch(/due_date timestamptz/);
  });

  it("hat period_end >= period_start-Constraint", () => {
    expect(sql).toMatch(/period_end\s*>=\s*period_start/);
    expect(sql).toMatch(/constraint client_deadline_period_range\s+check/);
  });

  it("source_version ist Pflicht mit Char-Length-Check (1 bis 100)", () => {
    expect(sql).toMatch(/source_version text not null/);
    expect(sql).toMatch(
      /check\s*\(\s*char_length\(source_version\) between 1 and 100\s*\)/
    );
  });

  it("created_at und updated_at haben Default now()", () => {
    expect(sql).toMatch(/created_at timestamptz[^,]*default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz[^,]*default now\(\)/);
  });

  it("hat KEINE status-Spalte (P2 v1.1: kommt erst mit History-Sprint)", () => {
    // Nach Stripping der COMMENT-ON und -- Kommentare darf das Wort
    // 'status' im DDL-Body nicht erscheinen.
    expect(sql).not.toMatch(/\bstatus\b/);
  });

  it("hat KEINE deadline_status_history-Struktur in 0067", () => {
    expect(sql).not.toMatch(/deadline_status_history/);
  });

  it("hat KEIN catalog_status-Feld in client_deadline", () => {
    expect(sql).not.toMatch(/catalog_status/);
  });

  it("hat KEIN review_status-Feld in client_deadline", () => {
    expect(sql).not.toMatch(/review_status/);
  });

  it("hat KEIN confidence-Feld in client_deadline", () => {
    expect(sql).not.toMatch(/confidence/);
  });

  it("Wertemenge enthaelt KEIN manual_review_required (kein Lifecycle/Status/History)", () => {
    expect(sql).not.toMatch(/'manual_review_required'/);
    expect(sql).not.toMatch(/manual_review_required/);
    expect(sql).not.toMatch(/lifecycle/);
  });

  it("Wertemenge enthaelt KEIN completed/submitted/approved/overdue/erledigt", () => {
    expect(sql).not.toMatch(/'completed'/);
    expect(sql).not.toMatch(/'submitted'/);
    expect(sql).not.toMatch(/'approved'/);
    expect(sql).not.toMatch(/'overdue'/);
    expect(sql).not.toMatch(/'erledigt'/);
  });

  it("hat KEINE frist- oder zeitraum-Spalte (P2 v1.1: due_date/period_start/period_end)", () => {
    expect(sql).not.toMatch(/\bfrist\b/);
    expect(sql).not.toMatch(/\bzeitraum\b/);
  });

  it("aktiviert Row-Level-Security", () => {
    expect(sql).toMatch(
      /alter table public\.client_deadline enable row level security/
    );
  });

  it("SELECT-Policy fuer authenticated nutzt public.is_company_member(company_id)", () => {
    expect(sql).toMatch(
      /create policy client_deadline_select[\s\S]*?on public\.client_deadline[\s\S]*?for select[\s\S]*?to authenticated[\s\S]*?using\s*\(\s*public\.is_company_member\s*\(\s*company_id\s*\)\s*\)/
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
    // Die Policy muss AS RESTRICTIVE FOR ALL sein UND sowohl die USING-
    // als auch die WITH-CHECK-Klausel muessen das Konsistenz-Praedikat
    // public.client_belongs_to_company(client_id, company_id) fuehren.
    // Ein USING (true) ist unzulaessig — eine restriktive Policy ohne
    // echte USING-Pruefung filtert beim Lesen nichts und verfehlt den
    // Zweck.
    const consistencyHead =
      /create policy client_deadline_client_consistency\s+on public\.client_deadline\s+as restrictive\s+for all/;
    expect(sql).toMatch(consistencyHead);
    expect(sql).toMatch(
      /create policy client_deadline_client_consistency[\s\S]*?as restrictive[\s\S]*?for all[\s\S]*?using\s*\(\s*public\.client_belongs_to_company\s*\(\s*client_id\s*,\s*company_id\s*\)\s*\)[\s\S]*?with check\s*\(\s*public\.client_belongs_to_company\s*\(\s*client_id\s*,\s*company_id\s*\)\s*\)\s*;/
    );
  });

  it("client_deadline_client_consistency enthaelt KEIN USING (true)", () => {
    // Negativ-Anker: zwischen dem CREATE POLICY-Header der Konsistenz-
    // Policy und ihrem terminierenden ';' darf 'using (true)' nicht
    // vorkommen.
    const m = sql.match(
      /create policy client_deadline_client_consistency[\s\S]*?;/
    );
    expect(m).not.toBeNull();
    if (m) {
      expect(m[0]).not.toMatch(/using\s*\(\s*true\s*\)/);
    }
  });

  it("erteilt GRANT SELECT an authenticated (0054 Gruppe-E-Pattern)", () => {
    expect(sql).toMatch(
      /grant select on public\.client_deadline to authenticated/
    );
  });

  it("erteilt GRANT ALL (oder gleichwertig) an service_role", () => {
    expect(sql).toMatch(
      /grant (?:all|select,\s*insert,\s*update,\s*delete) on public\.client_deadline to service_role/
    );
  });

  it("erteilt KEINEN GRANT an anon (0052-Konvention)", () => {
    expect(sql).not.toMatch(
      /grant[^;]*on public\.client_deadline[^;]*to anon/
    );
  });

  it("aktiviert keinen UI-/Service-/Berechnungspfad (keine Trigger, Functions, Material-Views)", () => {
    expect(sql).not.toMatch(/create function/);
    expect(sql).not.toMatch(/create or replace function/);
    expect(sql).not.toMatch(/create trigger/);
    expect(sql).not.toMatch(/create materialized view/);
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

  it("aendert/referenziert keine Migrationen 0060-0066 als Migrationsnummern", () => {
    // Die Migrationen 0060-0066 duerfen im Body (nach Stripping aller
    // -- und COMMENT ON) nicht referenziert werden. Erlaubt bleiben
    // ihre Tabellenobjekte (z. B. public.deadline_source_versions
    // aus 0060). Diese Namens-Referenz lebt im Tabellenraum, nicht in
    // einer Migrationsnummer.
    expect(sql).not.toMatch(/\b0060\b/);
    expect(sql).not.toMatch(/\b0061\b/);
    expect(sql).not.toMatch(/\b0062\b/);
    expect(sql).not.toMatch(/\b0063\b/);
    expect(sql).not.toMatch(/\b0064\b/);
    expect(sql).not.toMatch(/\b0065\b/);
    expect(sql).not.toMatch(/\b0066\b/);
    // Auch keine direkten FKs auf 0066-Objekt.
    expect(sql).not.toMatch(/deadline_tax_office_cash_office_assignments/);
  });

  it("enthaelt keine destruktiven Statements (DROP TABLE/COLUMN, RENAME)", () => {
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/rename to/);
  });

  it("aendert keine bestehenden Tabellen (kein ALTER TABLE auf Bestand)", () => {
    // Erlaubt: ALTER TABLE public.client_deadline ENABLE ROW LEVEL
    // SECURITY auf die gerade erstellte Tabelle. Verboten: ALTER TABLE
    // auf irgendeine andere Tabelle.
    const alterMatches = sql.match(/alter table public\.\w+/g) ?? [];
    for (const match of alterMatches) {
      expect(
        match,
        `Unerwarteter ALTER TABLE auf Bestandstabelle: ${match}`
      ).toMatch(/alter table public\.client_deadline/);
    }
  });

  it("hat alle empfohlenen Lookup-Indizes (company/client/type/source)", () => {
    expect(sql).toMatch(
      /create index if not exists client_deadline_company_due_idx\s+on public\.client_deadline\(company_id,\s*due_date\)/
    );
    expect(sql).toMatch(
      /create index if not exists client_deadline_client_due_idx\s+on public\.client_deadline\(client_id,\s*due_date\)/
    );
    expect(sql).toMatch(
      /create index if not exists client_deadline_type_period_idx\s+on public\.client_deadline\(deadline_type,\s*period_start\)/
    );
    expect(sql).toMatch(
      /create index if not exists client_deadline_source_idx\s+on public\.client_deadline\(source_id\)/
    );
  });

  it("ist idempotent: CREATE TABLE/INDEX IF NOT EXISTS + DROP POLICY IF EXISTS + CREATE POLICY", () => {
    expect(sql).toMatch(/create table if not exists/);
    const idx = (sql.match(/create index /g) ?? []).length;
    const idxIfNotExists = (sql.match(/create index if not exists/g) ?? [])
      .length;
    expect(idxIfNotExists).toBe(idx);
    expect(idx).toBeGreaterThanOrEqual(4);

    // Beide Policies muessen via DROP POLICY IF EXISTS + CREATE POLICY
    // wiederholbar sein.
    expect(sql).toMatch(
      /drop policy if exists client_deadline_select[\s\S]*?on public\.client_deadline/
    );
    expect(sql).toMatch(
      /create policy client_deadline_select[\s\S]*?on public\.client_deadline/
    );
    expect(sql).toMatch(
      /drop policy if exists client_deadline_client_consistency[\s\S]*?on public\.client_deadline/
    );
    expect(sql).toMatch(
      /create policy client_deadline_client_consistency[\s\S]*?on public\.client_deadline/
    );
  });
});
