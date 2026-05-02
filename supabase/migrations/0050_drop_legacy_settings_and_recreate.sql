-- ============================================================================
-- harouda-app · Schema-Konflikt-Aufloesung: public.settings
-- (Charge 15, Phase 1 · Schuld 14-aleph)
--
-- Ersetzt: 0044_user_settings.sql (deaktiviert, siehe Header dort).
--
-- Hintergrund:
--   0001_init.sql (Zeile 78 ff.) legt public.settings als wide-table an
--   (owner_id, kanzlei_name, kanzlei_strasse, ...). 0044 versucht eine
--   andere Struktur (single-row JSONB mit user_id, mandant_id, payload).
--   "create table if not exists" in 0044 ueberspringt die Erstellung,
--   weil die Tabelle bereits existiert; nachfolgende Constraints schlagen
--   fehl mit "ERROR 42703: column 'mandant_id' of relation
--   'public.settings' does not exist".
--
-- Loesung:
--   Diese Migration verwirft die wide-table (drop table cascade) und legt
--   die Tabelle in der erwarteten JSONB-Struktur neu an.
--   Voraussetzung: public.settings enthaelt 0 Zeilen.
--
-- Voraussetzungs-Verifikation (in Charge 15 fuer 'harouda' bestaetigt):
--   - SELECT count(*) FROM public.settings;        -> 0
--   - Foreign Keys auf public.settings             -> keine
--   - Views/Materialized Views auf public.settings -> keine
--
-- Rechtliche Grundlage:
--   - DSGVO Art. 32 (Sicherheit der Verarbeitung)
--   - DSGVO Art. 17 (Recht auf Loeschung) -- via ON DELETE CASCADE
--
-- Tabellen-Design (uebernommen aus 0044):
--   - Single-Row-per-Scope: ein JSONB-Payload pro (user_id, mandant_id).
--   - mandant_id NULL = persoenliche/globale Settings.
--   - mandant_id <UUID> = mandantenspezifische Overrides (Future).
--   - UNIQUE NULLS NOT DISTINCT verhindert mehrere "globale" Eintraege
--     pro User (PG 15+ feature).
--
-- RLS:
--   Strict Owner-Predicate. Nutzer sehen nur eigene Settings.
--
-- Rollback:
--   Bei Bedarf separates Skript in supabase/rollbacks/ ablegen.
--   Konvention: siehe supabase/rollbacks/README.md.
-- ============================================================================

-- ---------------------------- Vorbedingung pruefen --------------------------
-- Sicherheitsabfrage: blockiert die Migration, falls Daten vorhanden sind.
do $$
declare
  v_count int;
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'settings'
  ) then
    select count(*) into v_count from public.settings;
    if v_count > 0 then
      raise exception
        'Migration 0050 abgebrochen: public.settings enthaelt % Zeilen. Erwartet: 0. Manuelle Daten-Migration erforderlich.',
        v_count;
    end if;
  end if;
end $$;

-- ---------------------------- Drop legacy structure -------------------------
drop table if exists public.settings cascade;

-- ---------------------------- Tabelle (JSONB-Struktur) ----------------------
create table if not exists public.settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mandant_id  uuid null,
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint settings_user_mandant_unique
    unique nulls not distinct (user_id, mandant_id)
);

comment on table public.settings is
  'Pro-User Settings (Kanzlei-Stammdaten, Mahnwesen, Lohn-Konten, Tracking). Ersetzt localStorage[harouda:settings]. Schema-Stand: 0050 (Charge 15).';
comment on column public.settings.mandant_id is
  'NULL = globale/persoenliche Settings. UUID = mandantenspezifische Overrides.';
comment on column public.settings.payload is
  'Voller Settings-Payload als JSONB. Schema in src/contexts/SettingsContext.tsx (Type Settings).';

-- ---------------------------- Indizes ---------------------------------------
create index if not exists settings_user_idx
  on public.settings (user_id);

-- ---------------------------- Trigger: updated_at ---------------------------
create or replace function public.settings_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row
  execute function public.settings_set_updated_at();

-- ---------------------------- RLS -------------------------------------------
alter table public.settings enable row level security;

drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings
  for select using (user_id = auth.uid());

drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings
  for insert with check (user_id = auth.uid());

drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists settings_delete on public.settings;
create policy settings_delete on public.settings
  for delete using (user_id = auth.uid());
