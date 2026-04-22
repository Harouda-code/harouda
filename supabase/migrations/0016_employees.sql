-- ============================================================================
-- harouda-app · Mitarbeiter-Stammdaten für die Lohn-Vorbereitung
--
-- Wichtige ehrliche Einordnung:
--
--   • Diese Tabelle hält die Stammdaten, die für eine Lohnabrechnungs-
--     VORBEREITUNG nötig sind. Sie ist KEIN ITSG-zertifiziertes Lohnsystem.
--   • Steuer-ID (11-stellig) und Sozialversicherungsnummer sind personen-
--     bezogene Daten mit besonderer Sensibilität — in der App gelten RLS
--     und Supabase-at-rest-Verschlüsselung, darüber hinaus NICHTS.
--   • Änderungen an Mitarbeiterdaten sind über den bestehenden audit_log
--     protokolliert (via application layer).
-- ============================================================================

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  personalnummer text not null,
  /** Vollständiger Name zur Anzeige. Namensbestandteile werden nicht einzeln
   *  normalisiert, um familienrechtliche Besonderheiten nicht zu verletzen. */
  vorname text not null,
  nachname text not null,
  /** Steuer-Identifikationsnummer (Bundeszentralamt), 11 Ziffern. */
  steuer_id text null check (steuer_id is null or steuer_id ~ '^\d{11}$'),
  /** Sozialversicherungsnummer, Format NN TTMMJJ A NNN (12 Zeichen). */
  sv_nummer text null,
  /** 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI'. */
  steuerklasse text not null default 'I'
    check (steuerklasse in ('I','II','III','IV','V','VI')),
  /** Kinderfreibeträge (halbe: 0, 0.5, 1, 1.5, ...). */
  kinderfreibetraege numeric not null default 0
    check (kinderfreibetraege >= 0 and kinderfreibetraege <= 10),
  /** Kirchensteuerpflicht + Konfession. NULL = nicht kirchensteuerpflichtig. */
  konfession text null,
  /** 8 % in BY/BW, 9 % sonst. */
  bundesland text null,
  /** Beschäftigungsdaten */
  einstellungsdatum date null,
  austrittsdatum date null,
  /** 'vollzeit' | 'teilzeit' | 'minijob' | 'midijob' | 'ausbildung' */
  beschaeftigungsart text not null default 'vollzeit'
    check (beschaeftigungsart in ('vollzeit','teilzeit','minijob','midijob','ausbildung')),
  wochenstunden numeric null,
  /** Bruttogehalt in Euro (monatlich) bei Festgehalt. */
  bruttogehalt_monat numeric null,
  /** Stundenlohn in Euro (brutto). */
  stundenlohn numeric null,
  /** Krankenkasse (Anzeige). Zusatzbeitrag wird separat als %-Zahl gepflegt. */
  krankenkasse text null,
  /** Zusatzbeitrag zur GKV in Prozent (2025 Durchschnitt ~1.7 %). */
  zusatzbeitrag_pct numeric null,
  /** true = privatversichert (entfällt GKV-Pflicht, aber Arbeitgeberzuschuss). */
  privat_versichert boolean not null default false,
  /** Ob der Mitarbeiter 23+ ist UND kinderlos → Pflegeversicherungs-Zuschlag. */
  pv_kinderlos boolean not null default false,
  /** Anzahl berücksichtigter Kinder <25 für PV-Ermäßigung. */
  pv_kinder_anzahl integer not null default 0,
  iban text null,
  bic text null,
  /** Kontoinhaber, falls abweichend vom Mitarbeiter. */
  kontoinhaber text null,
  notes text null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employees_personalnummer_unique unique (company_id, personalnummer)
);

create index if not exists employees_company_idx
  on public.employees(company_id, is_active);
create index if not exists employees_name_idx
  on public.employees(company_id, nachname, vorname);

alter table public.employees enable row level security;

drop policy if exists employees_select on public.employees;
create policy employees_select
  on public.employees
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = employees.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists employees_write on public.employees;
create policy employees_write
  on public.employees
  for all
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = employees.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  ))
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = employees.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  ));

comment on table public.employees is
  'Mitarbeiter-Stammdaten für die Lohn-VORBEREITUNG. Kein ITSG-zertifiziertes Lohnprogramm.';
