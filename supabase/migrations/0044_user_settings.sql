-- ============================================================================
-- harouda-app · User-Settings in die Datenbank verlagern
-- (Charge 7, Aufgabe 4)
--
-- Ersetzt die bisherige Speicherung in localStorage (Key 'harouda:settings').
-- Geschaeftsdaten wie Kanzlei-Stammdaten, Steuernummer, ELSTER-Berater-Nr.
-- gehoeren nicht in den Browser-Cache.
--
-- Rechtliche Grundlage:
--   • DSGVO Art. 32 (Sicherheit der Verarbeitung)
--   • DSGVO Art. 17 (Recht auf Loeschung) — via ON DELETE CASCADE
--
-- Tabellen-Design:
--   • Single-Row-per-Scope: ein JSONB-Payload pro (user_id, mandant_id).
--   • mandant_id NULL = persoenliche/globale Settings.
--   • mandant_id <UUID> = mandantenspezifische Overrides (Future).
--   • UNIQUE NULLS NOT DISTINCT: verhindert mehrere "globale" Eintraege
--     pro User (PG 15+ feature, von Supabase unterstuetzt).
--
-- RLS:
--   Strict Owner-Predicate. Nutzer sehen nur eigene Settings.
--
-- Rollback:
--   Migration 0045_revert_user_settings.sql vorbereitet (NICHT angewendet).
-- ============================================================================

-- ---------------------------- Tabelle ---------------------------------------

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
  'Pro-User Settings (Kanzlei-Stammdaten, Mahnwesen, Lohn-Konten, Tracking). Ersetzt localStorage[harouda:settings].';
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
