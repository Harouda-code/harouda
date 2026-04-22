-- ============================================================================
-- harouda-app · Multi-Tenancy Phase 1, Schritt 1 · client_id-Spalten
--
-- Ergänzt fehlende `client_id`-Spalten (Mandanten-FK) bei Tabellen, die
-- bisher ausschliesslich `company_id` (Kanzlei-Isolation) kannten und
-- damit Daten mehrerer Mandanten innerhalb einer Kanzlei vermischt haben.
--
-- Was diese Migration TUT:
--   • Helper-Funktion `public.client_belongs_to_company(cid, cpid)`.
--   • Pro Ziel-Tabelle:
--       ADD COLUMN client_id uuid NULL REFERENCES public.clients(id)
--                                   ON DELETE RESTRICT
--       CREATE INDEX on (client_id)
--       RESTRICTIVE-RLS-Policy (<table>_client_consistency) die bei
--       INSERT/UPDATE prüft, dass `client_id` zur `company_id` gehört.
--   • Bestehende permissive Policies werden NICHT angefasst (drop+create
--     Policy-Lawine vermieden; zusätzlicher Gate via RESTRICTIVE).
--
-- Was diese Migration NICHT tut:
--   • Kein Backfill auf bestehenden Daten (client_id bleibt NULL).
--   • Kein NOT NULL — Pflicht-Wechsel kommt in einem späteren Schritt.
--   • Keine API-Read-Filter — Frontend liest weiterhin alle Rows der
--     Kanzlei, Filterung ist Job der Folge-Schritte.
--   • Keine Drops, keine Renames, keine Datentyp-Wechsel.
--
-- Konvention `client_id` (nicht `mandant_id`) — weil (a) die FK-Zieltabelle
-- `public.clients` heisst und (b) `journal_entries.client_id` seit 0001
-- bereits diesen Namen trägt. `belege` (0022) nutzt historisch
-- `mandant_id`; bleibt aus Konsistenzgründen unangetastet und wird in
-- einem späteren Cleanup optional auf `client_id` umbenannt.
--
-- Auswahl der Ziel-Tabellen: siehe Sprint-1-Bestandsaufnahme Teil 1a
-- (Rot-/Gelb-Flags). `afa_buchungen` bewusst ausgelassen — erbt Tenant-
-- Scope über `anlage_id → anlagegueter.company_id` und hat keine eigene
-- `company_id`-Spalte; eine direkte `client_id` wäre denormalisiert und
-- ohne in-Row-Konsistenzcheck nicht sauber absicherbar.
-- ============================================================================

-- --- 0. Helper -------------------------------------------------------------

create or replace function public.client_belongs_to_company(
  p_client_id uuid,
  p_company_id uuid
)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.clients
    where id = p_client_id
      and company_id = p_company_id
  );
$$;

comment on function public.client_belongs_to_company(uuid, uuid) is
  'Validiert, dass eine client_id tatsächlich zur übergebenen company_id gehört. Genutzt in RESTRICTIVE-RLS-Policies ab Migration 0026.';

-- --- 1. Ziel-Tabellen ------------------------------------------------------

-- Helper-Muster pro Tabelle:
--   alter table public.<t> add column if not exists client_id uuid null
--     references public.clients(id) on delete restrict;
--   create index if not exists <t>_client_idx on public.<t>(client_id);
--   drop policy if exists <t>_client_consistency on public.<t>;
--   create policy <t>_client_consistency on public.<t>
--     as restrictive for all
--     using (true)
--     with check (
--       client_id is null
--       or public.client_belongs_to_company(client_id, company_id)
--     );

-- 1a) ROT-Flags (harte Mandant-Trennung) -------------------------------------

-- anlagegueter (Migration 0025)
alter table public.anlagegueter
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists anlagegueter_client_idx
  on public.anlagegueter(client_id);
drop policy if exists anlagegueter_client_consistency on public.anlagegueter;
create policy anlagegueter_client_consistency
  on public.anlagegueter as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- employees (Migration 0016)
alter table public.employees
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists employees_client_idx
  on public.employees(client_id);
drop policy if exists employees_client_consistency on public.employees;
create policy employees_client_consistency
  on public.employees as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- lohnarten (Migration 0020)
alter table public.lohnarten
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists lohnarten_client_idx
  on public.lohnarten(client_id);
drop policy if exists lohnarten_client_consistency on public.lohnarten;
create policy lohnarten_client_consistency
  on public.lohnarten as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- lohnbuchungen (Migration 0020)
alter table public.lohnbuchungen
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists lohnbuchungen_client_idx
  on public.lohnbuchungen(client_id);
drop policy if exists lohnbuchungen_client_consistency on public.lohnbuchungen;
create policy lohnbuchungen_client_consistency
  on public.lohnbuchungen as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- lohnabrechnungen_archiv (Migration 0020)
alter table public.lohnabrechnungen_archiv
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists lohnabrechnungen_archiv_client_idx
  on public.lohnabrechnungen_archiv(client_id);
drop policy if exists lohnabrechnungen_archiv_client_consistency
  on public.lohnabrechnungen_archiv;
create policy lohnabrechnungen_archiv_client_consistency
  on public.lohnabrechnungen_archiv as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- lsta_festschreibungen (Migration 0021)
alter table public.lsta_festschreibungen
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists lsta_festschreibungen_client_idx
  on public.lsta_festschreibungen(client_id);
drop policy if exists lsta_festschreibungen_client_consistency
  on public.lsta_festschreibungen;
create policy lsta_festschreibungen_client_consistency
  on public.lsta_festschreibungen as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- 1b) GELB-Flags (Mandant-Bezug sinnvoll) -----------------------------------

-- documents (Migration 0001 / company_id ergänzt in 0004)
alter table public.documents
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists documents_client_idx
  on public.documents(client_id);
drop policy if exists documents_client_consistency on public.documents;
create policy documents_client_consistency
  on public.documents as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- invoice_archive (Migration 0012)
alter table public.invoice_archive
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists invoice_archive_client_idx
  on public.invoice_archive(client_id);
drop policy if exists invoice_archive_client_consistency on public.invoice_archive;
create policy invoice_archive_client_consistency
  on public.invoice_archive as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- invoice_xml_archive (Migration 0012)
alter table public.invoice_xml_archive
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists invoice_xml_archive_client_idx
  on public.invoice_xml_archive(client_id);
drop policy if exists invoice_xml_archive_client_consistency
  on public.invoice_xml_archive;
create policy invoice_xml_archive_client_consistency
  on public.invoice_xml_archive as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- elster_submissions (Migration 0013)
alter table public.elster_submissions
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists elster_submissions_client_idx
  on public.elster_submissions(client_id);
drop policy if exists elster_submissions_client_consistency
  on public.elster_submissions;
create policy elster_submissions_client_consistency
  on public.elster_submissions as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- supplier_preferences (Migration 0014)
alter table public.supplier_preferences
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists supplier_preferences_client_idx
  on public.supplier_preferences(client_id);
drop policy if exists supplier_preferences_client_consistency
  on public.supplier_preferences;
create policy supplier_preferences_client_consistency
  on public.supplier_preferences as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- advisor_notes (Migration 0015)
alter table public.advisor_notes
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists advisor_notes_client_idx
  on public.advisor_notes(client_id);
drop policy if exists advisor_notes_client_consistency on public.advisor_notes;
create policy advisor_notes_client_consistency
  on public.advisor_notes as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- receipt_requests (Migration 0018)
alter table public.receipt_requests
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists receipt_requests_client_idx
  on public.receipt_requests(client_id);
drop policy if exists receipt_requests_client_consistency on public.receipt_requests;
create policy receipt_requests_client_consistency
  on public.receipt_requests as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- dunning_records (Migration 0005)
alter table public.dunning_records
  add column if not exists client_id uuid null
  references public.clients(id) on delete restrict;
create index if not exists dunning_records_client_idx
  on public.dunning_records(client_id);
drop policy if exists dunning_records_client_consistency on public.dunning_records;
create policy dunning_records_client_consistency
  on public.dunning_records as restrictive for all
  using (true)
  with check (
    client_id is null
    or public.client_belongs_to_company(client_id, company_id)
  );

-- --- 2. Kommentare ---------------------------------------------------------

comment on column public.anlagegueter.client_id is
  'Mandanten-FK (Migration 0026). Nullable bis Backfill-Schritt. Bei INSERT/UPDATE per RESTRICTIVE-Policy gegen companies/clients-Konsistenz geprüft.';
comment on column public.employees.client_id is
  'Mandanten-FK (Migration 0026). Siehe anlagegueter.client_id-Kommentar.';
comment on column public.lohnarten.client_id is
  'Mandanten-FK (Migration 0026). Ermöglicht Lohn-Stammdaten pro Mandant (vorher Kanzlei-shared).';
comment on column public.lohnbuchungen.client_id is
  'Mandanten-FK (Migration 0026). Nullable bis Backfill.';
comment on column public.lohnabrechnungen_archiv.client_id is
  'Mandanten-FK (Migration 0026). Nullable bis Backfill.';
comment on column public.lsta_festschreibungen.client_id is
  'Mandanten-FK (Migration 0026). LStA pro Mandant.';
comment on column public.documents.client_id is
  'Mandanten-FK (Migration 0026). Zusätzlich zum transienten journal_entry_id→client_id-Pfad.';
comment on column public.invoice_archive.client_id is
  'Mandanten-FK (Migration 0026).';
comment on column public.invoice_xml_archive.client_id is
  'Mandanten-FK (Migration 0026).';
comment on column public.elster_submissions.client_id is
  'Mandanten-FK (Migration 0026). ELSTER-Abgaben pro Mandant.';
comment on column public.supplier_preferences.client_id is
  'Mandanten-FK (Migration 0026). Lieferanten-Präferenzen pro Mandant.';
comment on column public.advisor_notes.client_id is
  'Mandanten-FK (Migration 0026). Berater-Notizen pro Mandant.';
comment on column public.receipt_requests.client_id is
  'Mandanten-FK (Migration 0026). Beleg-Anforderungen pro Mandant.';
comment on column public.dunning_records.client_id is
  'Mandanten-FK (Migration 0026). Mahnwesen pro Mandant.';
