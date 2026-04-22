-- ============================================================================
-- harouda-app · Sprint 19.A · business_partners + business_partners_versions
--
-- Unified Debitor/Kreditor-Stammdaten mit Hybrid-Versioning:
--   • public.business_partners           — current row (updatable)
--   • public.business_partners_versions  — immutable snapshots pro UPDATE
--
-- Architektur (FEST):
--   • partner_type IN ('debitor','kreditor','both'); getrennte
--     debitor_nummer / kreditor_nummer-Felder.
--   • Hybrid-Versioning: BEFORE-UPDATE-Trigger kopiert OLD-Row als JSONB
--     in Versions-Tabelle, vergibt fortlaufende version_number pro Partner.
--   • Duplicate-Check HARD-BLOCK via partielle UNIQUE-Indizes auf
--     (client_id, ust_idnr), (client_id, steuernummer, finanzamt),
--     (client_id, hrb, registergericht).
--   • Nummern-Range Sprint 19: Debitor 10000-69999, Kreditor 70000-99999.
--   • Mandant-Isolation: RESTRICTIVE-Policy (Pattern aus Migration 0026)
--     verlangt client_belongs_to_company(client_id, company_id).
--
-- Bewusst AUSSERHALB dieses Scopes (spätere Sprints / Tech-Debt):
--   • Hash-Chain auf business_partners_versions (Sprint 20).
--   • retention_hold-Workflow UI (Sprint 20).
--   • VIES-Periodic-Re-Verification (Sprint 20+).
--   • Kein Backfill der belege.partner_*-Denormalisierung (greenfield).
-- ============================================================================

-- --- 1. Haupttabelle -------------------------------------------------------

create table if not exists public.business_partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,

  -- Type-Discriminator
  partner_type text not null
    check (partner_type in ('debitor','kreditor','both')),
  debitor_nummer integer null,
  kreditor_nummer integer null,

  -- Identität
  name text not null,
  legal_name text null,
  rechtsform text null,

  -- Steuerliche Identifikation
  ust_idnr text null,
  steuernummer text null,
  finanzamt text null,
  hrb text null,
  registergericht text null,

  -- Anschrift (strukturiert für XRechnung)
  anschrift_strasse text null,
  anschrift_hausnummer text null,
  anschrift_plz text null,
  anschrift_ort text null,
  anschrift_land_iso text null default 'DE'
    check (anschrift_land_iso is null or anschrift_land_iso ~ '^[A-Z]{2}$'),

  -- Kommunikation
  email text null,
  telefon text null,

  -- Bank
  iban text null,
  bic text null,

  -- E-Rechnung
  is_public_authority boolean not null default false,
  leitweg_id text null,
  preferred_invoice_format text not null default 'pdf'
    check (preferred_invoice_format in ('pdf','zugferd','xrechnung','peppol')),
  peppol_id text null,

  -- Verrechnung (Aufrechnung § 387 BGB)
  verrechnungs_partner_id uuid null
    references public.business_partners(id) on delete set null,

  -- Zahlungsbedingungen
  zahlungsziel_tage integer null
    check (zahlungsziel_tage is null
      or (zahlungsziel_tage between 0 and 365)),
  skonto_prozent numeric(5,2) null
    check (skonto_prozent is null
      or (skonto_prozent >= 0 and skonto_prozent < 100)),
  skonto_tage integer null
    check (skonto_tage is null or (skonto_tage between 0 and 90)),

  -- Default-Konto (SKR03/SKR04)
  standard_erloeskonto text null,
  standard_aufwandskonto text null,

  -- Status
  is_active boolean not null default true,
  notes text null,

  -- Audit
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id),

  -- Konsistenz: Nummer muss zum Typ passen
  constraint bp_debitor_nummer_if_type check (
    (partner_type in ('debitor','both') and debitor_nummer is not null)
    or (partner_type = 'kreditor')
  ),
  constraint bp_kreditor_nummer_if_type check (
    (partner_type in ('kreditor','both') and kreditor_nummer is not null)
    or (partner_type = 'debitor')
  ),
  constraint bp_debitor_nummer_range check (
    debitor_nummer is null or (debitor_nummer between 10000 and 69999)
  ),
  constraint bp_kreditor_nummer_range check (
    kreditor_nummer is null or (kreditor_nummer between 70000 and 99999)
  ),
  -- Leitweg-ID Pflicht bei B2G (BR-DE-1 / XRechnung)
  constraint bp_leitweg_if_public check (
    is_public_authority = false or leitweg_id is not null
  )
);

-- --- 2. Unique-Indizes (Duplicate-Check HARD-BLOCK) -------------------------

create unique index if not exists bp_unique_debitor_nr
  on public.business_partners(client_id, debitor_nummer)
  where debitor_nummer is not null;

create unique index if not exists bp_unique_kreditor_nr
  on public.business_partners(client_id, kreditor_nummer)
  where kreditor_nummer is not null;

create unique index if not exists bp_unique_ustidnr
  on public.business_partners(client_id, ust_idnr)
  where ust_idnr is not null;

create unique index if not exists bp_unique_steuernr
  on public.business_partners(client_id, steuernummer, finanzamt)
  where steuernummer is not null and finanzamt is not null;

create unique index if not exists bp_unique_hrb
  on public.business_partners(client_id, hrb, registergericht)
  where hrb is not null and registergericht is not null;

-- --- 3. Lookup-Indizes ------------------------------------------------------

create index if not exists bp_by_type
  on public.business_partners(client_id, partner_type)
  where is_active = true;

create index if not exists bp_by_name
  on public.business_partners(client_id, lower(name));

-- --- 4. Versions-Tabelle (WORM, Hybrid-Versioning) --------------------------

create table if not exists public.business_partners_versions (
  version_id uuid primary key default gen_random_uuid(),
  partner_id uuid not null
    references public.business_partners(id) on delete restrict,
  company_id uuid not null,
  client_id uuid not null,
  version_number integer not null,

  -- Vollstaendiger Snapshot aller Felder
  snapshot jsonb not null,

  -- Retention (Sprint 19: FEST auf Organisationsunterlage 10 J).
  aufbewahrungs_kategorie text not null default 'ORGANISATIONSUNTERLAGE_10J'
    check (aufbewahrungs_kategorie in (
      'ORGANISATIONSUNTERLAGE_10J',
      'GESCHAEFTSBRIEF_6J',
      'BUCHUNGSBELEG_8J'
    )),
  entstehungsjahr integer not null,
  retention_until date not null,
  retention_hold boolean not null default false,
  retention_hold_reason text null,

  -- Gueltigkeitsbereich der Version
  valid_from timestamptz not null,
  valid_to timestamptz null,

  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),

  constraint bpv_unique_version unique (partner_id, version_number)
);

create index if not exists bpv_by_partner
  on public.business_partners_versions(partner_id, version_number desc);

create index if not exists bpv_by_retention
  on public.business_partners_versions(retention_until)
  where retention_hold = false;

-- --- 5. Snapshot-Trigger (BEFORE UPDATE auf business_partners) --------------
-- SECURITY DEFINER: Der Trigger muss in die Versions-Tabelle schreiben
-- koennen, auch wenn der Aufrufer darauf kein INSERT-Privileg besitzt
-- (WORM-Prinzip: Normale User INSERTen nie direkt, nur via Update-Trigger).

create or replace function public.tg_bp_snapshot_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  old_snapshot jsonb;
begin
  if OLD.id is null then
    return NEW;
  end if;

  select coalesce(max(version_number), 0) + 1
    into next_version
    from public.business_partners_versions
    where partner_id = OLD.id;

  old_snapshot := to_jsonb(OLD);

  insert into public.business_partners_versions (
    partner_id, company_id, client_id, version_number, snapshot,
    aufbewahrungs_kategorie, entstehungsjahr, retention_until,
    valid_from, valid_to, created_by
  ) values (
    OLD.id, OLD.company_id, OLD.client_id, next_version, old_snapshot,
    'ORGANISATIONSUNTERLAGE_10J',
    extract(year from OLD.updated_at)::integer,
    make_date(extract(year from OLD.updated_at)::integer + 10, 12, 31),
    OLD.updated_at, now(), NEW.updated_by
  );

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_bp_snapshot on public.business_partners;
create trigger trg_bp_snapshot
  before update on public.business_partners
  for each row
  when (OLD.* is distinct from NEW.*)
  execute function public.tg_bp_snapshot_before_update();

-- --- 6. Retention-Block-Trigger auf Versions-Tabelle ------------------------

create or replace function public.tg_bpv_block_delete_retention()
returns trigger
language plpgsql
as $$
begin
  if OLD.retention_until >= current_date or OLD.retention_hold = true then
    raise exception
      '§ 147 AO: Version % nicht löschbar vor % (hold=%)',
      OLD.version_id, OLD.retention_until, OLD.retention_hold;
  end if;
  return OLD;
end;
$$;

drop trigger if exists trg_bpv_block_delete on public.business_partners_versions;
create trigger trg_bpv_block_delete
  before delete on public.business_partners_versions
  for each row
  execute function public.tg_bpv_block_delete_retention();

-- --- 7. updated_at-Trigger (wiederverwendet aus Migration 0004) -------------
-- WICHTIG: Dieser Trigger muss NACH trg_bp_snapshot laufen, damit OLD die
-- alte updated_at behält (Snapshot-Zeitpunkt) bevor tg_set_updated_at sie
-- ueberschreibt. Postgres feuert BEFORE-Trigger in alphabetischer Reihen-
-- folge — "trg_bp_set_updated_at" kommt nach "trg_bp_snapshot".

drop trigger if exists trg_bp_set_updated_at on public.business_partners;
create trigger trg_bp_set_updated_at
  before update on public.business_partners
  for each row
  execute function public.tg_set_updated_at();

-- --- 8. RLS -----------------------------------------------------------------

alter table public.business_partners enable row level security;
alter table public.business_partners_versions enable row level security;

-- Permissive: company-membership
drop policy if exists bp_company_read on public.business_partners;
create policy bp_company_read
  on public.business_partners
  for select
  using (public.is_company_member(company_id));

drop policy if exists bp_company_write on public.business_partners;
create policy bp_company_write
  on public.business_partners
  for all
  using (public.can_write(company_id))
  with check (public.can_write(company_id));

-- WORM fuer Versions-Tabelle: nur SELECT fuer Member; INSERT faellt
-- ueber den SECURITY-DEFINER-Trigger; kein UPDATE; DELETE blockiert
-- der tg_bpv_block_delete_retention-Trigger zusaetzlich.
drop policy if exists bpv_company_read on public.business_partners_versions;
create policy bpv_company_read
  on public.business_partners_versions
  for select
  using (public.is_company_member(company_id));

-- Restrictive: client_id muss zur Company gehoeren (wie Migration 0026).
drop policy if exists bp_client_belongs on public.business_partners;
create policy bp_client_belongs
  on public.business_partners
  as restrictive
  for all
  using (true)
  with check (public.client_belongs_to_company(client_id, company_id));

drop policy if exists bpv_client_belongs on public.business_partners_versions;
create policy bpv_client_belongs
  on public.business_partners_versions
  as restrictive
  for all
  using (true)
  with check (public.client_belongs_to_company(client_id, company_id));

-- --- 9. Auto-Nummern-Sequenz-Helper (RPC) -----------------------------------

create or replace function public.next_debitor_nummer(p_client_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  next_nr integer;
begin
  select coalesce(max(debitor_nummer), 9999) + 1
    into next_nr
    from public.business_partners
    where client_id = p_client_id
      and debitor_nummer is not null;
  if next_nr > 69999 then
    raise exception
      'Debitor-Nummernkreis erschöpft (max 69999) für client %',
      p_client_id;
  end if;
  return next_nr;
end;
$$;

create or replace function public.next_kreditor_nummer(p_client_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  next_nr integer;
begin
  select coalesce(max(kreditor_nummer), 69999) + 1
    into next_nr
    from public.business_partners
    where client_id = p_client_id
      and kreditor_nummer is not null;
  if next_nr > 99999 then
    raise exception
      'Kreditor-Nummernkreis erschöpft (max 99999) für client %',
      p_client_id;
  end if;
  return next_nr;
end;
$$;

-- --- 10. Kommentare --------------------------------------------------------

comment on table public.business_partners is
  'Sprint 19: Unified Debitor/Kreditor-Stammdaten. Hybrid Versioning mit business_partners_versions.';

comment on table public.business_partners_versions is
  'Sprint 19: Immutable Snapshots aller Stammdaten-Versionen. § 147 AO 10J Retention.';

comment on column public.business_partners.partner_type is
  'Discriminator: debitor (Kunde), kreditor (Lieferant), both (bilateraler Geschäftspartner). Steuert, welche Nummern-Spalte(n) NOT NULL sein muessen.';

comment on column public.business_partners.debitor_nummer is
  'Sprint 19: Hard-coded Range 10000-69999 pro client_id. Configurability folgt in Sprint 20+.';

comment on column public.business_partners.kreditor_nummer is
  'Sprint 19: Hard-coded Range 70000-99999 pro client_id.';

comment on column public.business_partners.leitweg_id is
  'XRechnung BT-10 / BR-DE-1: Pflicht bei B2G-Kunden (is_public_authority=true).';

comment on column public.business_partners.verrechnungs_partner_id is
  'Verweis auf den Verrechnungs-Gegenpart (§ 387 BGB Aufrechnung). Optional.';

comment on function public.next_debitor_nummer(uuid) is
  'Sprint 19: Liefert naechste freie debitor_nummer pro client_id. Fehler bei Erschoepfung.';

comment on function public.next_kreditor_nummer(uuid) is
  'Sprint 19: Liefert naechste freie kreditor_nummer pro client_id. Fehler bei Erschoepfung.';
