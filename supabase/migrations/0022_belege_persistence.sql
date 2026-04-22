-- ============================================================================
-- harouda-app · Belegerfassung-Persistenz (§ 14 UStG, GoBD Rz. 64)
--
-- Schafft zwei neue Tabellen:
--   • public.belege            — Rechnung / Quittung / Beleg (Header)
--   • public.beleg_positionen  — Einzelpositionen (Soll/Haben-Zeilen)
--
-- Kopplung ans Journal:
--   Die zugehörigen journal_entries-Zeilen werden in der Anwendung
--   (journalRepo.ts) erzeugt, weil die Hash-Kette im Browser via Web
--   Crypto berechnet wird. Belege tragen die IDs der erzeugten Journal-
--   Einträge in `journal_entry_ids` — so hat jeder Beleg eine rückver-
--   folgbare 1:N-Kette zum Journal.
--
-- GoBD: Nach Status='GEBUCHT' dürfen Kern-Felder nicht mehr geändert werden.
-- Stornierung erfolgt über status='STORNIERT' + storno_grund; die Journal-
-- Gegenbuchung ist Sache der Anwendung.
-- ============================================================================

-- ------------------------------ belege (Header) -----------------------------

create table if not exists public.belege (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  mandant_id            uuid null,

  belegart              varchar(30) not null
    check (belegart in (
      'EINGANGSRECHNUNG','AUSGANGSRECHNUNG','KASSENBELEG','BANKBELEG','SONSTIGES'
    )),
  belegnummer           varchar(50) not null,
  belegdatum            date not null,
  buchungsdatum         date not null,
  leistungsdatum        date null,

  beschreibung          text not null default '',

  partner_name          varchar(200) not null default '',
  partner_konto_nr      varchar(20) null,
  partner_ustid         varchar(20) null,
  partner_land          varchar(3) null,
  partner_adresse       text null,

  netto                 numeric(15,2) null,
  steuerbetrag          numeric(15,2) null,
  brutto                numeric(15,2) null,
  waehrung              varchar(3) not null default 'EUR',

  ist_ig_lieferung      boolean not null default false,
  ist_reverse_charge    boolean not null default false,

  zahlungsart           varchar(20) null
    check (zahlungsart is null or zahlungsart in (
      'UEBERWEISUNG','BAR','EC','KREDITKARTE','LASTSCHRIFT','SONSTIGE'
    )),
  zahlungsdatum         date null,
  zahlungsbetrag        numeric(15,2) null,
  skonto_prozent        numeric(5,2) null,

  belegdatei_path       text null,       -- Supabase Storage: "belege/<mandant>/<id>.pdf"

  status                varchar(20) not null default 'ENTWURF'
    check (status in ('ENTWURF','GEBUCHT','STORNIERT')),

  journal_entry_ids     uuid[] not null default '{}'::uuid[],

  erfasst_von           uuid references auth.users(id),
  erfasst_am            timestamptz not null default now(),
  updated_am            timestamptz not null default now(),
  storno_grund          text null,
  storniert_am          timestamptz null,

  constraint belege_unique_nr_per_company unique (company_id, belegnummer)
);

create index if not exists belege_company_datum_idx
  on public.belege (company_id, belegdatum desc);
create index if not exists belege_company_status_idx
  on public.belege (company_id, status);
create index if not exists belege_partner_idx
  on public.belege (company_id, partner_name);

-- ------------------------------ beleg_positionen ----------------------------

create table if not exists public.beleg_positionen (
  id            uuid primary key default gen_random_uuid(),
  beleg_id      uuid not null references public.belege(id) on delete cascade,
  position      integer not null,
  konto         varchar(10) not null,
  soll_haben    varchar(1) not null check (soll_haben in ('S','H')),
  betrag        numeric(15,2) not null,
  text          text null,
  ust_satz      numeric(5,4) null,   -- z.B. 0.1900, 0.0700, 0.0000

  constraint beleg_pos_unique unique (beleg_id, position)
);

create index if not exists beleg_pos_beleg_idx
  on public.beleg_positionen (beleg_id);

-- ------------------------------ RLS -----------------------------------------

alter table public.belege           enable row level security;
alter table public.beleg_positionen enable row level security;

drop policy if exists belege_select on public.belege;
create policy belege_select on public.belege
  for select using (true);

drop policy if exists belege_insert on public.belege;
create policy belege_insert on public.belege
  for insert with check (true);

drop policy if exists belege_update on public.belege;
create policy belege_update on public.belege
  for update using (true);

-- Physisches Löschen gebuchter Belege bleibt gesperrt — Stornierung nur
-- über status='STORNIERT'.
drop policy if exists belege_delete on public.belege;
create policy belege_delete on public.belege
  for delete using (status = 'ENTWURF');

drop policy if exists beleg_pos_select on public.beleg_positionen;
create policy beleg_pos_select on public.beleg_positionen
  for select using (true);

drop policy if exists beleg_pos_mutate on public.beleg_positionen;
create policy beleg_pos_mutate on public.beleg_positionen
  for all using (true) with check (true);

-- ------------------------------ Immutability-Trigger ------------------------

create or replace function public.prevent_gebucht_beleg_mutation()
returns trigger as $$
begin
  if old.status = 'GEBUCHT' and new.status = 'GEBUCHT' then
    if new.belegnummer    <> old.belegnummer
       or new.belegdatum  <> old.belegdatum
       or new.buchungsdatum <> old.buchungsdatum
       or coalesce(new.netto,        -1) <> coalesce(old.netto,        -1)
       or coalesce(new.steuerbetrag, -1) <> coalesce(old.steuerbetrag, -1)
       or coalesce(new.brutto,       -1) <> coalesce(old.brutto,       -1)
       or new.journal_entry_ids <> old.journal_entry_ids
    then
      raise exception
        'Gebuchter Beleg % darf nicht geändert werden (GoBD Rz. 64). Bitte Stornobuchung erstellen.',
        old.id;
    end if;
  end if;
  new.updated_am := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists belege_immutability on public.belege;
create trigger belege_immutability
  before update on public.belege
  for each row execute function public.prevent_gebucht_beleg_mutation();
