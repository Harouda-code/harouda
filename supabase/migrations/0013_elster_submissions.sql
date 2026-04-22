-- ============================================================================
-- harouda-app · Verzeichnis manueller ELSTER-Übertragungen
--
-- Die App erzeugt ELSTER-XML lokal; die eigentliche Übertragung an die
-- Finanzverwaltung passiert außerhalb (ElsterOnline-Portal oder zertifizierter
-- Desktop-Client). Diese Tabelle protokolliert, welche Perioden exportiert und
-- tatsächlich manuell eingereicht wurden.
--
-- Status-Lebenszyklus:
--   draft                  → XML erzeugt, noch nicht hochgeladen
--   exported               → XML wurde heruntergeladen (für Archivzwecke)
--   transmitted-manually   → über ElsterOnline/DATEV eingereicht, Bestätigung vorliegt
--   acknowledged           → Transfer-Ticket vom Finanzamt eingegangen
-- ============================================================================

create table if not exists public.elster_submissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  /** Formular-Typ: 'ustva' (monatlich), 'ustva-quartal', 'euer', 'gewst', 'kst' ... */
  form_type text not null,
  /** Veranlagungsjahr bzw. Bezugsjahr. */
  year integer not null,
  /** 1–12 für monatliche, 1–4 für quartalsweise, NULL für jahresbezogen. */
  period integer null,
  /** Beschreibung, z. B. "UStVA März 2026" oder "EÜR 2025". */
  label text not null,
  /** SHA-256 des exportierten XML (zur späteren Verknüpfung mit dem archivierten File). */
  file_sha256 text null,
  file_bytes bigint null,
  status text not null default 'draft'
    check (status in ('draft','exported','transmitted-manually','acknowledged','rejected')),
  /** Transfer-Ticket aus dem ElsterOnline-Portal, wenn eingetragen. */
  transfer_ticket text null,
  /** Freitext-Notizen, z. B. "Übertragen am 10.04. durch SB". */
  notes text null,
  /** Wann hat der Nutzer den Status auf 'transmitted-manually' gesetzt? */
  transmitted_at timestamptz null,
  /** Wann wurde das Transfer-Ticket erfasst? */
  acknowledged_at timestamptz null,

  constraint elster_submissions_period_unique
    unique (company_id, form_type, year, period)
);

create index if not exists elster_submissions_company_year_idx
  on public.elster_submissions(company_id, year desc, period desc);
create index if not exists elster_submissions_status_idx
  on public.elster_submissions(company_id, status);

alter table public.elster_submissions enable row level security;

drop policy if exists elster_submissions_select on public.elster_submissions;
create policy elster_submissions_select
  on public.elster_submissions
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = elster_submissions.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists elster_submissions_insert on public.elster_submissions;
create policy elster_submissions_insert
  on public.elster_submissions
  for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = elster_submissions.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- UPDATE nur für Admin/Owner. Alle Status-Wechsel landen zusätzlich im
-- audit_log über die Anwendung.
drop policy if exists elster_submissions_update on public.elster_submissions;
create policy elster_submissions_update
  on public.elster_submissions
  for update
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = elster_submissions.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  ));

-- DELETE absichtlich nicht erlaubt (Aufbewahrung § 147 AO).
drop policy if exists elster_submissions_no_delete on public.elster_submissions;
create policy elster_submissions_no_delete
  on public.elster_submissions
  for delete
  using (false);

comment on table public.elster_submissions is
  'Manuelles Register der ELSTER-Abgaben. Die eigentliche Übertragung erfolgt extern; hier wird Status, Ticket und Zeitpunkt gepflegt.';
