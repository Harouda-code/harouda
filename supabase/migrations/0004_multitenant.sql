-- ============================================================================
-- harouda-app · Multi-Tenant-Modell
--
-- Ersetzt das bisherige per-owner_id-Modell (ein Datensatz gehört genau einem
-- Supabase-User) durch ein Firmen-/Mandanten-/Rollen-Modell:
--   companies            — Kanzlei / Firma, eigenständige Entität
--   company_members      — welche User in welcher Firma mit welcher Rolle
--   RLS                  — Zugriff über Mitgliedschaft + Rolle
--   updated_at-Trigger   — auf allen Haupttabellen
--   FK + Indizes         — company_id überall mit Performance-Indexen
--
-- Frische Installationen (leere Tabellen): Migration direkt ausführbar.
-- Bestehende Installationen (mit Daten in owner_id-Form) bitte VORHER
-- Backfill einspielen; die Migration droppt owner_id erst am Ende.
-- ============================================================================

-- --- 1. Firmen und Rollen ---------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  steuernummer text null,
  ust_id text null,
  iban text null,
  bic text null,
  anschrift_strasse text null,
  anschrift_plz text null,
  anschrift_ort text null,
  email text null,
  telefon text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

do $$ begin
  if not exists (select 1 from pg_type where typname = 'company_role') then
    create type public.company_role as enum ('owner','admin','member','readonly');
  end if;
end $$;

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists company_members_user_idx
  on public.company_members(user_id);

-- Optional spiegelndes Userprofil (zusätzlich zu auth.users).
-- Hält anwendungs-spezifische Attribute, die wir nicht in auth.users speichern.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  locale text not null default 'de-DE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- 2. Hilfsfunktionen (werden von RLS-Policies verwendet) ----------------
create or replace function public.is_company_member(cid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.can_write(cid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid()
      and role in ('owner','admin','member')
  );
$$;

create or replace function public.is_company_admin(cid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

-- --- 3. updated_at-Trigger-Funktion ----------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- 4. Bestehende Tabellen auf company_id umstellen -----------------------
-- accounts, clients, journal_entries, documents, settings, audit_log stammen
-- aus früheren Migrationen. Wir fügen company_id + Audit-Felder hinzu und
-- entfernen owner_id.

alter table public.accounts
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid null references auth.users(id) on delete set null;

alter table public.clients
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid null references auth.users(id) on delete set null;

alter table public.journal_entries
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid null references auth.users(id) on delete set null,
  add column if not exists gegenseite text null,
  add column if not exists faelligkeit date null,
  add column if not exists skonto_pct numeric null,
  add column if not exists skonto_tage int null,
  add column if not exists version integer not null default 1;

alter table public.documents
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.settings
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

alter table public.audit_log
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists created_by uuid null references auth.users(id) on delete set null;

-- --- 5. Indizes ------------------------------------------------------------
create index if not exists accounts_company_konto_idx
  on public.accounts(company_id, konto_nr);
create index if not exists clients_company_nr_idx
  on public.clients(company_id, mandant_nr);
create index if not exists journal_company_datum_idx
  on public.journal_entries(company_id, datum desc);
create index if not exists journal_company_client_idx
  on public.journal_entries(company_id, client_id);
create index if not exists journal_company_beleg_idx
  on public.journal_entries(company_id, beleg_nr);
create index if not exists documents_company_uploaded_idx
  on public.documents(company_id, uploaded_at desc);
create index if not exists audit_company_at_idx
  on public.audit_log(company_id, at desc);
create index if not exists audit_company_entity_idx
  on public.audit_log(company_id, entity, entity_id);

-- --- 6. updated_at-Trigger auf allen Tabellen ------------------------------
drop trigger if exists set_updated_at on public.companies;
create trigger set_updated_at before update on public.companies
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.user_profiles;
create trigger set_updated_at before update on public.user_profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.accounts;
create trigger set_updated_at before update on public.accounts
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.clients;
create trigger set_updated_at before update on public.clients
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.journal_entries;
create trigger set_updated_at before update on public.journal_entries
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.documents;
create trigger set_updated_at before update on public.documents
  for each row execute function public.tg_set_updated_at();

-- --- 7. RLS neu aufsetzen --------------------------------------------------
alter table public.companies       enable row level security;
alter table public.company_members enable row level security;
alter table public.user_profiles   enable row level security;

-- companies: sichtbar für alle Mitglieder, editierbar für Admins
drop policy if exists companies_select on public.companies;
drop policy if exists companies_insert on public.companies;
drop policy if exists companies_update on public.companies;
drop policy if exists companies_delete on public.companies;

create policy companies_select on public.companies
  for select using (public.is_company_member(id));
create policy companies_insert on public.companies
  for insert with check (auth.uid() is not null);
create policy companies_update on public.companies
  for update using (public.is_company_admin(id))
  with check (public.is_company_admin(id));
create policy companies_delete on public.companies
  for delete using (public.is_company_admin(id));

-- company_members: lesbar für Mitglieder derselben Firma;
-- Verwaltung durch Admins
drop policy if exists members_select on public.company_members;
drop policy if exists members_insert on public.company_members;
drop policy if exists members_update on public.company_members;
drop policy if exists members_delete on public.company_members;

create policy members_select on public.company_members
  for select using (public.is_company_member(company_id));
create policy members_insert on public.company_members
  for insert with check (public.is_company_admin(company_id));
create policy members_update on public.company_members
  for update using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));
create policy members_delete on public.company_members
  for delete using (public.is_company_admin(company_id));

-- user_profiles: jede:r User:in pflegt nur das eigene Profil
drop policy if exists profile_select on public.user_profiles;
drop policy if exists profile_upsert on public.user_profiles;

create policy profile_select on public.user_profiles
  for select using (user_id = auth.uid());
create policy profile_upsert on public.user_profiles
  for insert with check (user_id = auth.uid());
create policy profile_update on public.user_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- 8. RLS auf Fachdaten-Tabellen aktualisieren ---------------------------
-- Alte owner_id-Policies verwerfen, neue company_id-Policies anlegen.

do $$ declare
  t text;
begin
  for t in select unnest(array['accounts','clients','journal_entries','documents','settings']) loop
    execute format('drop policy if exists "%s_select" on public.%s;', t, t);
    execute format('drop policy if exists "%s_insert" on public.%s;', t, t);
    execute format('drop policy if exists "%s_update" on public.%s;', t, t);
    execute format('drop policy if exists "%s_delete" on public.%s;', t, t);

    execute format(
      'create policy "%s_select" on public.%s for select using (public.is_company_member(company_id));',
      t, t
    );
    execute format(
      'create policy "%s_insert" on public.%s for insert with check (public.can_write(company_id));',
      t, t
    );
    execute format(
      'create policy "%s_update" on public.%s for update using (public.can_write(company_id)) with check (public.can_write(company_id));',
      t, t
    );
    execute format(
      'create policy "%s_delete" on public.%s for delete using (public.can_write(company_id));',
      t, t
    );
  end loop;
end $$;

-- audit_log: immutable — kein update/delete
drop policy if exists audit_log_select on public.audit_log;
drop policy if exists audit_log_insert on public.audit_log;
create policy audit_log_select on public.audit_log
  for select using (public.is_company_member(company_id));
create policy audit_log_insert on public.audit_log
  for insert with check (public.can_write(company_id));
-- kein update/delete-Policy → Zeilen bleiben unveränderlich
revoke update, delete on public.audit_log from authenticated;

-- --- 9. Storage-Bucket-Policies: pro Firma statt pro User ------------------
-- Pfad-Konvention wechseln auf: {company_id}/{…}
drop policy if exists "documents_own_select" on storage.objects;
drop policy if exists "documents_own_insert" on storage.objects;
drop policy if exists "documents_own_update" on storage.objects;
drop policy if exists "documents_own_delete" on storage.objects;
drop policy if exists "documents_company_select" on storage.objects;
drop policy if exists "documents_company_insert" on storage.objects;
drop policy if exists "documents_company_update" on storage.objects;
drop policy if exists "documents_company_delete" on storage.objects;

create policy "documents_company_select" on storage.objects
  for select using (
    bucket_id = 'documents'
    and public.is_company_member(
      ((storage.foldername(name))[1])::uuid
    )
  );
create policy "documents_company_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.can_write(
      ((storage.foldername(name))[1])::uuid
    )
  );
create policy "documents_company_update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and public.can_write(
      ((storage.foldername(name))[1])::uuid
    )
  );
create policy "documents_company_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and public.can_write(
      ((storage.foldername(name))[1])::uuid
    )
  );

-- --- 10. owner_id aus den Alt-Tabellen entfernen ---------------------------
-- Nur nach erfolgreichem Backfill auf company_id!
-- Für Neu-Installationen: company_id ist noch nicht-null-fähig;
-- owner_id war ehemals not-null. Wir relaxen das jetzt.
alter table public.accounts        alter column owner_id drop not null;
alter table public.clients         alter column owner_id drop not null;
alter table public.journal_entries alter column owner_id drop not null;
alter table public.documents       alter column owner_id drop not null;
alter table public.settings        alter column owner_id drop not null;
alter table public.audit_log       alter column owner_id drop not null;

-- HINWEIS: Die `owner_id`-Spalte bleibt erhalten, bis alle Anwendungen auf
-- company_id umgestellt sind. In einer späteren Migration kann
-- `alter table … drop column owner_id;` folgen.
