-- ============================================================================
-- harouda-app · Initial Supabase schema
--
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Tables use Row Level Security so each authenticated user sees only their own
-- data. The app currently reads/writes via localStorage; wire the API modules
-- to these tables to move state into Supabase.
-- ============================================================================

-- --- Extensions -------------------------------------------------------------
create extension if not exists pgcrypto;

-- --- Accounts (Kontenplan) --------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  konto_nr text not null,
  bezeichnung text not null,
  kategorie text not null check (kategorie in ('aktiva','passiva','aufwand','ertrag')),
  ust_satz numeric null,
  skr text not null default 'SKR03' check (skr in ('SKR03','SKR04')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (owner_id, konto_nr)
);
create index if not exists accounts_owner_idx on public.accounts(owner_id);

-- --- Clients (Mandanten) ----------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mandant_nr text not null,
  name text not null,
  steuernummer text null,
  created_at timestamptz not null default now(),
  unique (owner_id, mandant_nr)
);
create index if not exists clients_owner_idx on public.clients(owner_id);

-- --- Journal entries --------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  datum date not null,
  beleg_nr text not null,
  beschreibung text not null,
  soll_konto text not null,
  haben_konto text not null,
  betrag numeric(14,2) not null check (betrag > 0),
  ust_satz numeric null,
  status text not null default 'gebucht' check (status in ('gebucht','entwurf')),
  client_id uuid null references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint journal_entries_accts_differ check (soll_konto <> haben_konto)
);
create index if not exists journal_entries_owner_date_idx
  on public.journal_entries(owner_id, datum desc);
create index if not exists journal_entries_owner_client_idx
  on public.journal_entries(owner_id, client_id);

-- --- Documents --------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text null,
  mime_type text not null,
  size_bytes bigint not null,
  beleg_nr text null,
  ocr_text text null,
  journal_entry_id uuid null references public.journal_entries(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
create index if not exists documents_owner_uploaded_idx
  on public.documents(owner_id, uploaded_at desc);

-- --- Settings (Kanzlei-Stammdaten) ------------------------------------------
create table if not exists public.settings (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  kanzlei_name text not null default '',
  kanzlei_strasse text not null default '',
  kanzlei_plz text not null default '',
  kanzlei_ort text not null default '',
  kanzlei_telefon text not null default '',
  kanzlei_email text not null default '',
  default_steuernummer text not null default '',
  elster_berater_nr text not null default '',
  updated_at timestamptz not null default now()
);

-- --- Row Level Security -----------------------------------------------------
alter table public.accounts enable row level security;
alter table public.clients enable row level security;
alter table public.journal_entries enable row level security;
alter table public.documents enable row level security;
alter table public.settings enable row level security;

-- Per-owner policies. `owner_id` must equal the caller's auth.uid().
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'accounts','clients','journal_entries','documents','settings'
  ]) loop
    execute format('drop policy if exists "%s_select" on public.%s;', t, t);
    execute format('drop policy if exists "%s_insert" on public.%s;', t, t);
    execute format('drop policy if exists "%s_update" on public.%s;', t, t);
    execute format('drop policy if exists "%s_delete" on public.%s;', t, t);

    execute format(
      'create policy "%s_select" on public.%s for select using (owner_id = auth.uid());',
      t, t
    );
    execute format(
      'create policy "%s_insert" on public.%s for insert with check (owner_id = auth.uid());',
      t, t
    );
    execute format(
      'create policy "%s_update" on public.%s for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t, t
    );
    execute format(
      'create policy "%s_delete" on public.%s for delete using (owner_id = auth.uid());',
      t, t
    );
  end loop;
end $$;

-- --- Storage bucket for uploaded documents ----------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Per-owner policies on the storage bucket. Paths are expected to be
-- prefixed with the user id: `{auth.uid()}/<anything>`.
drop policy if exists "documents_own_select" on storage.objects;
drop policy if exists "documents_own_insert" on storage.objects;
drop policy if exists "documents_own_update" on storage.objects;
drop policy if exists "documents_own_delete" on storage.objects;

create policy "documents_own_select" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "documents_own_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "documents_own_update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "documents_own_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
