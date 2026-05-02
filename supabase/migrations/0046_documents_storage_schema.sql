-- ============================================================================
-- harouda-app · Documents → Supabase Storage Schema (Phase 1, Charge 8, PR 1)
--
-- Migration:    0046_documents_storage_schema.sql
-- Branch:       infra/documents-storage-schema
-- Vorgaenger:   0044 (settings), 0045 (revert settings)
--
-- ZIEL:
--   Vorbereitung der Datenbank für die Migration der Dokumenten-Speicherung
--   von localStorage nach Supabase Storage (gemäß HANDOFF_BATCH_8, Aufgabe 2).
--
-- KONTEXT (was bereits existiert und NICHT angetastet wird):
--   • public.documents existiert seit 0001_init.sql.
--   • company_id, created_by, updated_at wurden in 0004_multitenant.sql ergänzt.
--   • client_id wurde in 0026_multitenant_client_id.sql ergänzt.
--   • Storage-Bucket-Policies "documents_company_*" auf storage.objects
--     wurden in 0004_multitenant.sql definiert.
--   • Helfer-Funktionen public.is_company_member() und public.can_write()
--     existieren seit 0004_multitenant.sql und werden von den
--     Storage-Policies benutzt.
--
-- WAS DIESE MIGRATION TUT:
--   1. Erstellt den Storage-Bucket "documents" idempotent (Infrastructure-as-Code).
--   2. Ergänzt eine optionale Verknüpfung documents.beleg_id → belege.id.
--   3. Dokumentiert die file_path-Konvention via SQL-COMMENT.
--
-- WAS DIESE MIGRATION BEWUSST NICHT TUT:
--   • Keine Änderung an owner_id-FK (CASCADE → SET NULL bleibt für Charge 9).
--   • Keine Änderung an company_id-FK (CASCADE → SET NULL bleibt für Charge 9).
--   • Kein NOT NULL auf file_path (Migration-Schritt für Charge 9).
--   • Keine RLS-Policy-Änderungen (bestehende Policies bleiben).
--   • Kein Backfill von Daten.
--
-- GESETZLICHER KONTEXT:
--   • GoBD Rz. 100 ff.: Unveränderbarkeit, Datensicherheit (Vorbereitung).
--   • HGB § 257: Aufbewahrungspflicht 10 Jahre (zu erfüllen in Folge-PRs).
--   • DSGVO Art. 32: Sicherheit der Verarbeitung (Vorbereitung).
--
-- ROLLBACK:
--   Notfall-Migration 0047_revert_documents_storage_schema.sql vorbereitet.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Storage-Bucket "documents" idempotent erstellen
--
--    Der Bucket wird privat (public = false) erstellt. Zugriff erfolgt
--    ausschliesslich über die in 0004_multitenant.sql definierten Policies
--    "documents_company_select/_insert/_update/_delete" auf storage.objects.
--    Die Policies erwarten Pfade in der Form: {company_id}/...
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Optionale Verknüpfung documents.beleg_id → belege.id
--
--    Ein Dokument (z.B. PDF einer Eingangsrechnung) kann optional einem
--    Beleg (Header in public.belege) zugeordnet werden. Mehrere Dokumente
--    können denselben beleg_id haben (z.B. Rechnung + Lieferschein).
--
--    ON DELETE SET NULL: Wenn ein Beleg storniert/gelöscht wird, bleibt
--    das Dokument erhalten (HGB § 257). Die Verknüpfung wird aufgelöst,
--    nicht das Dokument.
-- ----------------------------------------------------------------------------

alter table public.documents
  add column if not exists beleg_id uuid null
  references public.belege(id) on delete set null;

create index if not exists documents_beleg_idx
  on public.documents(beleg_id);

comment on column public.documents.beleg_id is
  'Optionale Verknüpfung zu public.belege. Ein Beleg kann mehrere Dokumente haben (Rechnung + Lieferschein + Zahlungsbeleg). ON DELETE SET NULL gemäß HGB § 257.';

-- ----------------------------------------------------------------------------
-- 3. file_path-Konvention dokumentieren
--
--    Bestehende Datensätze tragen "local://{id}" (Legacy localStorage).
--    Neue Datensätze werden den Pfad im Bucket "documents" tragen, gemäss
--    der Konvention die mit den Storage-Policies in 0004_multitenant.sql
--    übereinstimmt.
-- ----------------------------------------------------------------------------

comment on column public.documents.file_path is
  'Storage-Pfad im Bucket "documents". Konvention: {company_id}/{document_id}.{ext}. Legacy-Daten aus localStorage tragen "local://{id}" und werden in einem Folge-PR migriert.';

-- ============================================================================
-- ENDE 0046_documents_storage_schema.sql
-- ============================================================================
