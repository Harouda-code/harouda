-- Migration 0041: Complete Mandanten-Stammdaten expansion
-- Rationale: DATEV/Addison-standard client master data fields.
-- Covers: accounting config, tax registration, payroll setup, system state.

-- --- Buchhalterische Einstellungen ---
alter table public.clients
  add column if not exists kontenrahmen text not null default 'SKR03',
  add column if not exists sachkontenlaenge integer not null default 4,
  add column if not exists gewinnermittlungsart text,
  add column if not exists wirtschaftsjahr_typ text not null default 'kalenderjahr';

-- --- Steuerliche Erfassung ---
alter table public.clients
  add column if not exists finanzamt_name text,
  add column if not exists finanzamt_bufa_nr text,
  add column if not exists versteuerungsart text,
  add column if not exists kleinunternehmer_regelung boolean not null default false,
  add column if not exists ust_voranmeldung_zeitraum text;

-- --- Lohn-Stammdaten ---
alter table public.clients
  add column if not exists betriebsnummer text,
  add column if not exists berufsgenossenschaft_name text,
  add column if not exists berufsgenossenschaft_mitgliedsnr text,
  add column if not exists kirchensteuer_erhebungsstelle text;

-- --- System-Metadaten ---
alter table public.clients
  add column if not exists status text not null default 'in_gruendung';

-- --- CHECK constraints ---
alter table public.clients
  drop constraint if exists chk_clients_kontenrahmen;
alter table public.clients
  add constraint chk_clients_kontenrahmen check (
    kontenrahmen in ('SKR03','SKR04')
  );

alter table public.clients
  drop constraint if exists chk_clients_sachkontenlaenge;
alter table public.clients
  add constraint chk_clients_sachkontenlaenge check (
    sachkontenlaenge between 4 and 6
  );

alter table public.clients
  drop constraint if exists chk_clients_gewinnermittlungsart;
alter table public.clients
  add constraint chk_clients_gewinnermittlungsart check (
    gewinnermittlungsart is null
    or gewinnermittlungsart in ('bilanz','euer')
  );

alter table public.clients
  drop constraint if exists chk_clients_wirtschaftsjahr_typ;
alter table public.clients
  add constraint chk_clients_wirtschaftsjahr_typ check (
    wirtschaftsjahr_typ in ('kalenderjahr','abweichend')
  );

alter table public.clients
  drop constraint if exists chk_clients_bufa_nr;
alter table public.clients
  add constraint chk_clients_bufa_nr check (
    finanzamt_bufa_nr is null
    or finanzamt_bufa_nr ~ '^[0-9]{4}$'
  );

alter table public.clients
  drop constraint if exists chk_clients_versteuerungsart;
alter table public.clients
  add constraint chk_clients_versteuerungsart check (
    versteuerungsart is null
    or versteuerungsart in ('soll','ist')
  );

alter table public.clients
  drop constraint if exists chk_clients_ust_voranmeldung;
alter table public.clients
  add constraint chk_clients_ust_voranmeldung check (
    ust_voranmeldung_zeitraum is null
    or ust_voranmeldung_zeitraum in ('monatlich','vierteljaehrlich','jaehrlich','befreit')
  );

alter table public.clients
  drop constraint if exists chk_clients_betriebsnummer;
alter table public.clients
  add constraint chk_clients_betriebsnummer check (
    betriebsnummer is null
    or betriebsnummer ~ '^[0-9]{8}$'
  );

alter table public.clients
  drop constraint if exists chk_clients_status;
alter table public.clients
  add constraint chk_clients_status check (
    status in ('in_gruendung','aktiv','archiviert')
  );

-- --- Column comments (documentation) ---
comment on column public.clients.kontenrahmen is
  'Kontenrahmen: SKR03 (Prozess-orientiert) oder SKR04 (Bilanz-orientiert). Immutable nach erstem journal_entry (Trigger folgt).';
comment on column public.clients.sachkontenlaenge is
  'Laenge der Sachkonten in Stellen (4-6).';
comment on column public.clients.gewinnermittlungsart is
  'Bilanz (§ 4 Abs. 1 EStG) oder EUER (§ 4 Abs. 3 EStG). NULL bei in_gruendung.';
comment on column public.clients.wirtschaftsjahr_typ is
  'kalenderjahr = 01.01-31.12; abweichend = siehe wirtschaftsjahr_beginn/ende.';
comment on column public.clients.finanzamt_bufa_nr is
  'Bundeseinheitliche Finanzamtsnummer (4 Ziffern).';
comment on column public.clients.versteuerungsart is
  'soll (§ 16 UStG) = vereinbarte Entgelte; ist (§ 20 UStG) = vereinnahmte Entgelte.';
comment on column public.clients.kleinunternehmer_regelung is
  'Kleinunternehmerregelung § 19 UStG aktiv.';
comment on column public.clients.ust_voranmeldung_zeitraum is
  'Abgaberhythmus UStVA. Kann vom Finanzamt abweichend festgesetzt werden (§ 18 Abs. 2 UStG).';
comment on column public.clients.betriebsnummer is
  'Betriebsnummer (BBNR) der Bundesagentur fuer Arbeit (8 Ziffern).';
comment on column public.clients.status is
  'Lebenszyklus-Status. Loeschung nicht erlaubt (§ 147 AO Aufbewahrung).';
