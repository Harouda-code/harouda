-- ============================================================================
-- harouda-app · Lohn-Persistenz: Lohnarten + Lohnbuchungen + Abrechnungs-
-- Archiv. Die Arbeitnehmer-Stammdaten leben weiterhin in der bestehenden
-- Tabelle `public.employees` (0016_employees.sql); diese Migration ergänzt
-- NUR die fehlenden Lohnbuchungs-Tabellen.
--
-- Ehrliche Einordnung:
--   • Dies ist Lohn-VORBEREITUNG (Verbuchung, Archivierung) — kein
--     zertifiziertes Lohnsystem (keine ITSG/DEÜV/ELStAM-Integration).
--   • abrechnungen_archiv speichert die berechnete Abrechnung als JSONB.
--     Nach dem Setzen von `locked=true` dürfen keine Änderungen mehr
--     erfolgen (GoBD Rz. 64 — Festschreibung).
--   • RLS-Policies orientieren sich an der employees-Tabelle: Zugriff
--     pro company_id.
-- ============================================================================

-- ---------------- Lohnarten (konfigurierbar pro Kanzlei/Mandant) ------------

create table if not exists public.lohnarten (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  code                text not null,
  bezeichnung         text not null,
  /** LAUFENDER_BEZUG | SONSTIGER_BEZUG */
  typ                 text not null check (typ in ('LAUFENDER_BEZUG','SONSTIGER_BEZUG')),
  steuerpflichtig     boolean not null default true,
  svpflichtig         boolean not null default true,
  /** § 3 EStG-Nr. o. ä. — für steuerfreie Bezüge. */
  steuerfrei_grund    text null,
  sv_frei_grund       text null,
  /** LStA-Kennzahl (z. B. "3" für laufender Arbeitslohn). */
  lst_meldung_feld    text not null,
  /** SKR03-Konto für Buchungsvorschlag. */
  buchungskonto_soll  text null,
  buchungskonto_haben text null,
  aktiv               boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint lohnarten_code_unique unique (company_id, code)
);

create index if not exists lohnarten_company_idx
  on public.lohnarten(company_id, aktiv);

alter table public.lohnarten enable row level security;
drop policy if exists lohnarten_select on public.lohnarten;
create policy lohnarten_select on public.lohnarten
  for select using (true);  -- TODO: einschränken analog employees_select
drop policy if exists lohnarten_mod on public.lohnarten;
create policy lohnarten_mod on public.lohnarten
  for all using (true);

-- ---------------- Lohnbuchungen (Monats-Einträge je AN) ----------------------

create table if not exists public.lohnbuchungen (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  employee_id         uuid not null references public.employees(id) on delete cascade,
  abrechnungsmonat    text not null check (abrechnungsmonat ~ '^\d{4}-\d{2}$'),
  lohnart_id          uuid not null references public.lohnarten(id),
  betrag              numeric(15,2) not null,
  stunden             numeric(7,2) null,
  menge               numeric(10,3) null,
  beleg               text null,
  buchungsdatum       date not null,
  created_at          timestamptz not null default now()
);

create index if not exists lohnbuchungen_emp_monat_idx
  on public.lohnbuchungen(employee_id, abrechnungsmonat);
create index if not exists lohnbuchungen_company_idx
  on public.lohnbuchungen(company_id, abrechnungsmonat);

alter table public.lohnbuchungen enable row level security;
drop policy if exists lohnbuchungen_select on public.lohnbuchungen;
create policy lohnbuchungen_select on public.lohnbuchungen for select using (true);
drop policy if exists lohnbuchungen_mod on public.lohnbuchungen;
create policy lohnbuchungen_mod on public.lohnbuchungen for all using (true);

-- ---------------- Abrechnungs-Archiv (berechnete Ergebnisse) -----------------

create table if not exists public.lohnabrechnungen_archiv (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  employee_id         uuid not null references public.employees(id) on delete cascade,
  abrechnungsmonat    text not null check (abrechnungsmonat ~ '^\d{4}-\d{2}$'),
  /** Vollständige Lohnabrechnung als JSON-Snapshot (Money-Werte als toFixed2-Strings). */
  abrechnung_json     jsonb not null,
  gesamt_brutto       numeric(15,2) not null,
  gesamt_netto        numeric(15,2) not null,
  gesamt_abzuege      numeric(15,2) not null,
  gesamt_ag_kosten    numeric(15,2) not null,
  /** GoBD Rz. 64 Festschreibung: nach Lock sind Änderungen verboten. */
  locked              boolean not null default false,
  locked_at           timestamptz null,
  created_at          timestamptz not null default now(),

  constraint lohnabrechnung_unique unique (employee_id, abrechnungsmonat)
);

create index if not exists lohnabrechnungen_archiv_company_idx
  on public.lohnabrechnungen_archiv(company_id, abrechnungsmonat);

alter table public.lohnabrechnungen_archiv enable row level security;
drop policy if exists lohnabr_archiv_select on public.lohnabrechnungen_archiv;
create policy lohnabr_archiv_select on public.lohnabrechnungen_archiv for select using (true);
drop policy if exists lohnabr_archiv_mod on public.lohnabrechnungen_archiv;
create policy lohnabr_archiv_mod on public.lohnabrechnungen_archiv
  for all using (not locked);

-- Festschreibung: nach Lock alle Änderungen an dieser Zeile unterbinden
create or replace function public.prevent_locked_abrechnungen_update()
returns trigger as $$
begin
  if old.locked and new.locked then
    raise exception 'Lohnabrechnung % ist festgeschrieben und darf nicht geändert werden (GoBD Rz. 64).', old.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists lohnabrechnungen_archiv_lock_guard on public.lohnabrechnungen_archiv;
create trigger lohnabrechnungen_archiv_lock_guard
  before update on public.lohnabrechnungen_archiv
  for each row execute function public.prevent_locked_abrechnungen_update();
