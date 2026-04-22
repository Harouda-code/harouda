-- ============================================================================
-- harouda-app · Dual-Archiv für E-Rechnungen (ZUGFeRD / Factur-X / XRechnung)
--
-- Ziel: Für jede eingehende E-Rechnung sowohl die Original-PDF/XML-Datei als
-- auch die extrahierten, strukturierten Daten ablegen. Beide Schichten erhalten
-- einen SHA-256-Prüfsummen­abgleich, damit Manipulation erkennbar wird.
--
-- Tabellen:
--   invoice_archive        — Container pro Rechnung (Metadaten, Retention,
--                            Prüfsumme der Originaldatei)
--   invoice_xml_archive    — extrahierte CII/UBL-XML + geparste Kernfelder
--
-- GoBD-orientiert, NICHT zertifiziert: die Retention wird defensiv auf
-- 10 Jahre (§ 147 AO) gesetzt und darf im UI verlängert, aber nicht
-- unterhalb der gesetzlichen Frist gekürzt werden.
--
-- Bewusste Nicht-Scope-Entscheidungen:
--   • KEINE app-seitige Verschlüsselung der Dateien (Supabase liefert
--     at-rest-Encryption; client-seitiges Double-Encrypt ohne externes KMS
--     ist ohne Nutzen).
--   • KEINE Signaturprüfung (würde pdf-lib + PKI erfordern).
--   • KEINE Auto-Rotation oder Auto-Delete — Löschung nur manuell durch
--     Admin, frühestens ab retention_until.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1) Archiv-Container -----------------------------------------------------

create table if not exists public.invoice_archive (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_at timestamptz not null default now(),
  uploader_user_id uuid null references auth.users(id) on delete set null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  /** Hex-kodierter SHA-256 Hash der Original-Bytes (PDF oder XML-Datei). */
  content_sha256 text not null,
  /** Inhalt als base64 für kleine Dateien. Für grosse Dateien besser
   *  storage_path auf Supabase Storage zeigen lassen (dann bleibt content_b64 null). */
  content_b64 text null,
  storage_path text null,
  /** Quelle: 'zugferd-import' (geparst), 'upload' (nur PDF/XML ohne Parse), 'legacy' (Nachpflege). */
  source text not null check (source in ('zugferd-import','upload','legacy')),
  /** Ablauf der gesetzlichen Aufbewahrung. Default = uploaded_at + 10 Jahre. */
  retention_until date not null,
  /** Optionale Verlinkung ins Journal, sobald die Rechnung verbucht wurde. */
  journal_entry_id uuid null references public.journal_entries(id) on delete set null,
  notes text null
);

create index if not exists invoice_archive_company_idx
  on public.invoice_archive(company_id, uploaded_at desc);
create index if not exists invoice_archive_retention_idx
  on public.invoice_archive(company_id, retention_until);
create index if not exists invoice_archive_journal_idx
  on public.invoice_archive(journal_entry_id)
  where journal_entry_id is not null;

-- Retention-Default aus uploaded_at abgeleitet, falls nicht gesetzt.
create or replace function public.invoice_archive_set_retention()
returns trigger as $$
begin
  if NEW.retention_until is null then
    NEW.retention_until := (NEW.uploaded_at::date + interval '10 years')::date;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_invoice_archive_retention on public.invoice_archive;
create trigger trg_invoice_archive_retention
  before insert on public.invoice_archive
  for each row execute function public.invoice_archive_set_retention();

-- 2) Extrahierte XML-Daten -----------------------------------------------

create table if not exists public.invoice_xml_archive (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.invoice_archive(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  /** 'cii' (ZUGFeRD/Factur-X), 'ubl' (UBL 2.1), 'xrechnung' (KoSIT 3.x) */
  format text not null check (format in ('cii','ubl','xrechnung','unknown')),
  profile text null, -- z. B. BASIC, EN16931, EXTENDED
  invoice_number text null,
  issue_date date null,
  due_date date null,
  supplier_name text null,
  supplier_vat_id text null,
  buyer_name text null,
  currency text null,
  net_total numeric null,
  tax_total numeric null,
  grand_total numeric null,
  /** Originaler XML-String. */
  xml_content text not null,
  /** Hex-SHA-256 über xml_content (zur Integritätsprüfung). */
  xml_sha256 text not null,
  /** Geparste Positionen und Kopfdaten als JSON-Schnappschuss. */
  parsed_json jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists invoice_xml_archive_archive_idx
  on public.invoice_xml_archive(archive_id);
create index if not exists invoice_xml_archive_supplier_idx
  on public.invoice_xml_archive(company_id, supplier_name);
create index if not exists invoice_xml_archive_issue_idx
  on public.invoice_xml_archive(company_id, issue_date desc);

-- 3) RLS-Policies --------------------------------------------------------

alter table public.invoice_archive enable row level security;
alter table public.invoice_xml_archive enable row level security;

drop policy if exists invoice_archive_select on public.invoice_archive;
create policy invoice_archive_select
  on public.invoice_archive
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = invoice_archive.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists invoice_archive_insert on public.invoice_archive;
create policy invoice_archive_insert
  on public.invoice_archive
  for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = invoice_archive.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- UPDATE/DELETE: nur Admin/Owner und nur für Einträge OHNE Retention-Schutz
-- (d. h. retention_until in der Vergangenheit ist Voraussetzung für DELETE).
drop policy if exists invoice_archive_update on public.invoice_archive;
create policy invoice_archive_update
  on public.invoice_archive
  for update
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = invoice_archive.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  ));

drop policy if exists invoice_archive_delete on public.invoice_archive;
create policy invoice_archive_delete
  on public.invoice_archive
  for delete
  using (
    retention_until < current_date
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = invoice_archive.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

-- XML-Archiv spiegelt die Policies von invoice_archive.
drop policy if exists invoice_xml_archive_select on public.invoice_xml_archive;
create policy invoice_xml_archive_select
  on public.invoice_xml_archive
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = invoice_xml_archive.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists invoice_xml_archive_insert on public.invoice_xml_archive;
create policy invoice_xml_archive_insert
  on public.invoice_xml_archive
  for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = invoice_xml_archive.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- UPDATE/DELETE blockieren (WORM für extrahierte Rechnungsdaten):
drop policy if exists invoice_xml_archive_no_update on public.invoice_xml_archive;
create policy invoice_xml_archive_no_update
  on public.invoice_xml_archive
  for update
  using (false);

drop policy if exists invoice_xml_archive_delete on public.invoice_xml_archive;
create policy invoice_xml_archive_delete
  on public.invoice_xml_archive
  for delete
  using (
    exists (
      select 1 from public.invoice_archive a
      where a.id = invoice_xml_archive.archive_id
        and a.retention_until < current_date
    )
  );

comment on table public.invoice_archive is
  'Original-Dateien eingehender E-Rechnungen. Retention 10 Jahre (§ 147 AO). Löschen erst nach Ablauf von retention_until.';
comment on table public.invoice_xml_archive is
  'Geparste CII/UBL-Daten. WORM (kein UPDATE), Löschung an Retention des Archiv-Containers gebunden.';

-- ============================================================================
