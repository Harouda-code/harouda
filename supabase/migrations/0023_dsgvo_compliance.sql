-- ============================================================================
-- harouda-app · DSGVO-Compliance (Sprint-2 / Chunk 1)
--
-- Schafft drei Register-Tabellen, die DSGVO-Pflichten technisch abbilden:
--   • public.cookie_consents    — Nachweise nach TTDSG § 25 + DSGVO Art. 7
--   • public.privacy_requests   — Betroffenenanfragen (Art. 15, 17, 20, 21)
--   • public.privacy_incidents  — Datenpannen-Register (Art. 33/34)
--
-- BEWUSST AUSGEKLAMMERT (follow-up sessions):
--   • anonymize_personal_fields() — braucht vorher Design-Entscheidung zum
--     Hash-Chain-Konflikt (GoBD Rz. 153 verbietet rückwirkende Mutationen).
--     Art. 17 DSGVO (Recht auf Löschung) ist bis dahin NICHT implementiert.
--   • retention_applications    — erst sinnvoll, wenn tatsächliche
--     Löschjobs laufen. Solange nur RetentionPage (read-only) existiert,
--     wäre die Tabelle leer.
--
-- SUPABASE-AUTH:
--   `user_id` ist als NULL-fähig deklariert, weil Cookie-Consents auch vor
--   dem Login erfasst werden (anonyme Besucher:innen). Die FK-Verknüpfung zu
--   `auth.users` ist vorgesehen, die Wiring-Arbeit (eingeloggte Zuordnung)
--   erfolgt im Follow-up.
-- ============================================================================

-- ---------------------------- cookie_consents -------------------------------
--
-- Ein Eintrag pro Einwilligungs-Aktion. Widerruf = neuer Eintrag mit
-- withdrawn_at gesetzt; vorherige Einträge bleiben als Nachweis.
-- Retention: 3 Jahre (TTDSG-Nachweispflicht, vgl. src/data/retention.ts).

create table if not exists public.cookie_consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid null references auth.users(id) on delete set null,
  session_id      text null,                      -- für anonyme Besucher:innen
  categories      jsonb not null,                 -- { essential:true, analytics:bool, ... }
  ip_hash         text null,                      -- SHA-256, NICHT die rohe IP
  user_agent      text null,
  policy_version  text not null,
  consented_at    timestamptz not null default now(),
  withdrawn_at    timestamptz null
);

create index if not exists cookie_consents_user_idx
  on public.cookie_consents (user_id);
create index if not exists cookie_consents_session_idx
  on public.cookie_consents (session_id);
create index if not exists cookie_consents_date_idx
  on public.cookie_consents (consented_at desc);

-- ---------------------------- privacy_requests ------------------------------
--
-- Betroffenenrechte nach Art. 15 (Auskunft), 17 (Löschung),
-- 20 (Übertragbarkeit), 21 (Widerspruch) DSGVO. Frist per Art. 12 Abs. 3:
-- 30 Tage ab Eingang. Server-seitig als deadline gespeichert.

create table if not exists public.privacy_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid null references auth.users(id) on delete set null,
  request_type    varchar(20) not null
    check (request_type in ('ACCESS','ERASURE','PORTABILITY','RECTIFICATION','OBJECTION')),
  status          varchar(20) not null default 'PENDING'
    check (status in ('PENDING','IN_PROGRESS','COMPLETED','REJECTED')),
  reason          text null,
  requested_at    timestamptz not null default now(),
  deadline        timestamptz not null,           -- i.d.R. requested_at + 30d
  resolved_at     timestamptz null,
  resolved_by     uuid null references auth.users(id) on delete set null,
  result_blob_url text null,
  notes           text null
);

create index if not exists privacy_requests_user_idx
  on public.privacy_requests (user_id);
create index if not exists privacy_requests_status_idx
  on public.privacy_requests (status);
create index if not exists privacy_requests_deadline_idx
  on public.privacy_requests (deadline);

-- ---------------------------- privacy_incidents -----------------------------
--
-- Interner Datenpannen-Katalog nach Art. 33/34 DSGVO. Meldefrist an die
-- Aufsichtsbehörde: 72 Stunden ab Kenntnisnahme. Das Register ersetzt NICHT
-- den tatsächlichen Meldeweg — es dokumentiert Fristen und Status.

create table if not exists public.privacy_incidents (
  id                    uuid primary key default gen_random_uuid(),
  discovered_at         timestamptz not null,
  discovered_by         uuid null references auth.users(id) on delete set null,
  description           text not null,
  affected_data_types   text[] not null default '{}'::text[],
  affected_count        integer null,
  severity              varchar(20) not null
    check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  authority_notified    boolean not null default false,
  authority_notified_at timestamptz null,
  subjects_notified     boolean not null default false,
  subjects_notified_at  timestamptz null,
  containment_actions   text null,
  root_cause            text null,
  status                varchar(20) not null default 'OPEN'
    check (status in ('OPEN','CONTAINED','NOTIFIED','CLOSED')),
  closed_at             timestamptz null
);

create index if not exists privacy_incidents_severity_idx
  on public.privacy_incidents (severity);
create index if not exists privacy_incidents_status_idx
  on public.privacy_incidents (status);
create index if not exists privacy_incidents_discovered_idx
  on public.privacy_incidents (discovered_at desc);

-- ---------------------------- RLS -------------------------------------------

alter table public.cookie_consents   enable row level security;
alter table public.privacy_requests  enable row level security;
alter table public.privacy_incidents enable row level security;

-- cookie_consents: anonyme Inserts erlaubt (Besucher:innen vor Login);
-- Lesen nur für Eigentümer:in oder Admin (hier MVP: alle authentifizierten).
drop policy if exists cookie_consents_insert on public.cookie_consents;
create policy cookie_consents_insert on public.cookie_consents
  for insert with check (true);

drop policy if exists cookie_consents_select on public.cookie_consents;
create policy cookie_consents_select on public.cookie_consents
  for select using (user_id is null or user_id = auth.uid());

-- privacy_requests: nur selbst sehen/einreichen, Löschen gesperrt.
drop policy if exists privacy_requests_self_select on public.privacy_requests;
create policy privacy_requests_self_select on public.privacy_requests
  for select using (user_id = auth.uid());

drop policy if exists privacy_requests_self_insert on public.privacy_requests;
create policy privacy_requests_self_insert on public.privacy_requests
  for insert with check (user_id = auth.uid());

-- privacy_incidents: nur authentifizierte dürfen einsehen (Admin-UI folgt).
drop policy if exists privacy_incidents_authenticated_select on public.privacy_incidents;
create policy privacy_incidents_authenticated_select on public.privacy_incidents
  for select using (auth.uid() is not null);

drop policy if exists privacy_incidents_authenticated_insert on public.privacy_incidents;
create policy privacy_incidents_authenticated_insert on public.privacy_incidents
  for insert with check (auth.uid() is not null);
