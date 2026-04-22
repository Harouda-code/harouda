-- ============================================================================
-- harouda-app · Anlagenbuchhaltung (Fixed Assets)
--
-- Sprint 6 Teil 1: Anlagenverzeichnis + lineare AfA nach § 7 Abs. 1 EStG.
-- Degressive AfA, GWG (§ 6 Abs. 2 EStG), Sammelposten (§ 6 Abs. 2a EStG)
-- und Abgangs-Workflow kommen in Teil 2 (Sprint 7).
--
-- Datenmodell:
--   • anlagegueter: Stammdaten pro Wirtschaftsgut.
--   • afa_buchungen: Jahres-Historie (ein Eintrag pro Anlagegut pro Jahr),
--     optional mit Referenz zur erzeugten Journal-Buchung.
--
-- Scope-Entscheidungen (siehe docs/SPRINT-6-DECISIONS.md):
--   • Direkte Netto-Methode als SKR03-Standard: AfA bucht
--     4830 (Aufwand) / 0xxx (Anlagekonto). Das Anlagekonto sinkt
--     direkt auf Restbuchwert.
--   • Indirekte Brutto-Methode (kumuliertes Konto wie 0480) ist optional
--     pro Anlagegut konfigurierbar (`konto_abschreibung_kumuliert`), für
--     Betriebe die die HGB-§-284-Brutto-Darstellung explizit führen wollen.
--   • Stammdaten sind NICHT Teil der Journal-Hash-Kette. Die erzeugten
--     AfA-Buchungen laufen durch journal_entries und sind dort in der
--     Hash-Kette; sie bleiben korrigierbar bis zur Festschreibung
--     (GoBD Rz. 64, FestschreibungsService).
-- ============================================================================

create table if not exists public.anlagegueter (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,

  /** Inventar-Nr, frei wählbar (z. B. 'INV-2025-001'). Eindeutig pro Firma. */
  inventar_nr text not null,
  bezeichnung text not null,

  anschaffungsdatum date not null,
  anschaffungskosten numeric(15,2) not null check (anschaffungskosten > 0),
  nutzungsdauer_jahre integer not null
    check (nutzungsdauer_jahre >= 1 and nutzungsdauer_jahre <= 50),

  /** AfA-Methode. In Teil 1 ist nur 'linear' implementiert; andere Werte
   *  sind als Enum-Placeholder erlaubt, werfen aber im Calculator (noch). */
  afa_methode text not null default 'linear'
    check (afa_methode in ('linear','degressiv','gwg_sofort','sammelposten')),

  /** SKR03-Bestandskonto (z. B. '0440' für BGA). */
  konto_anlage text not null,
  /** SKR03-Aufwandskonto für AfA (z. B. '4830'). */
  konto_afa text not null,
  /** Optionales kumulatives Wertberichtigungs-Konto. Wenn gesetzt, bucht
   *  die AfA gegen dieses Konto statt direkt gegen konto_anlage
   *  (indirekte Brutto-Methode). null → direkte Netto-Methode. */
  konto_abschreibung_kumuliert text null,

  aktiv boolean not null default true,

  /** Abgangsdatum (Verkauf/Verschrottung). null solange aktiv. Workflow
   *  in Teil 1 nur als Schema-Feld; aktive Abgangsbuchung kommt in Teil 2. */
  abgangsdatum date null,
  abgangserloes numeric(15,2) null,

  notizen text null,

  /** Optionale Referenz auf Mutter-Anlage bei Teil-Abgängen (Teil 2). */
  parent_id uuid null references public.anlagegueter(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint anlagegueter_inventar_nr_unique unique (company_id, inventar_nr)
);

create index if not exists anlagegueter_company_idx
  on public.anlagegueter(company_id, aktiv);

create index if not exists anlagegueter_konto_idx
  on public.anlagegueter(company_id, konto_anlage);

alter table public.anlagegueter enable row level security;

drop policy if exists anlagegueter_select on public.anlagegueter;
create policy anlagegueter_select
  on public.anlagegueter
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = anlagegueter.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists anlagegueter_write on public.anlagegueter;
create policy anlagegueter_write
  on public.anlagegueter
  for all
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = anlagegueter.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ))
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = anlagegueter.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- ----------------------------------------------------------------------------
-- afa_buchungen: Jahres-Historie pro Anlagegut.
-- Ein Eintrag pro (anlage_id, jahr). Bei Korrektur: Update in place, da
-- nicht Teil der Journal-Hash-Kette (eigene Stammdaten-Tabelle).
-- ----------------------------------------------------------------------------

create table if not exists public.afa_buchungen (
  id uuid primary key default gen_random_uuid(),
  anlage_id uuid not null references public.anlagegueter(id) on delete cascade,

  jahr integer not null check (jahr >= 1990 and jahr <= 2200),
  afa_betrag numeric(15,2) not null check (afa_betrag >= 0),
  restbuchwert numeric(15,2) not null check (restbuchwert >= 0),

  /** Referenz auf den erzeugten Journal-Eintrag. Nullable: erlaubt erst
   *  Plan-Eintrag, später Verbuchung. */
  journal_entry_id uuid null references public.journal_entries(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint afa_buchungen_anlage_jahr_unique unique (anlage_id, jahr)
);

create index if not exists afa_buchungen_anlage_idx
  on public.afa_buchungen(anlage_id, jahr desc);

alter table public.afa_buchungen enable row level security;

drop policy if exists afa_buchungen_select on public.afa_buchungen;
create policy afa_buchungen_select
  on public.afa_buchungen
  for select
  using (exists (
    select 1
    from public.anlagegueter a
    join public.company_members cm on cm.company_id = a.company_id
    where a.id = afa_buchungen.anlage_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists afa_buchungen_write on public.afa_buchungen;
create policy afa_buchungen_write
  on public.afa_buchungen
  for all
  using (exists (
    select 1
    from public.anlagegueter a
    join public.company_members cm on cm.company_id = a.company_id
    where a.id = afa_buchungen.anlage_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ))
  with check (exists (
    select 1
    from public.anlagegueter a
    join public.company_members cm on cm.company_id = a.company_id
    where a.id = afa_buchungen.anlage_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

comment on table public.anlagegueter is
  'Anlagenverzeichnis (fixed assets register). Stammdaten-Tabelle, nicht Teil der Journal-Hash-Kette. Sprint 6 Teil 1.';
comment on table public.afa_buchungen is
  'Jahres-AfA-Historie pro Anlagegut. Referenziert optional den erzeugten Journal-Eintrag. Aktuelle AfA-Methoden: linear (Teil 1). degressiv/gwg_sofort/sammelposten → Teil 2.';
