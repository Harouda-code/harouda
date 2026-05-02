-- ============================================================================
-- harouda-app · ROLLBACK von 0046_documents_storage_schema.sql
--
-- Migration:    0047_revert_documents_storage_schema.sql
-- Zweck:        Notfall-Rollback. Nur ausführen, wenn 0046 Probleme verursacht.
--
-- ACHTUNG:
--   • Der Storage-Bucket "documents" wird NICHT gelöscht (könnte bereits
--     produktive Daten enthalten). Bei Bedarf manuell via Dashboard.
--   • beleg_id-Spalte und Index werden entfernt.
--   • Kommentare auf file_path werden NICHT zurückgesetzt (harmlos).
-- ============================================================================

-- 1. Index entfernen
drop index if exists public.documents_beleg_idx;

-- 2. beleg_id-Spalte entfernen
alter table public.documents
  drop column if exists beleg_id;

-- 3. Bucket bewusst NICHT entfernen (siehe ACHTUNG oben).
-- Falls erforderlich: manuell via Supabase Dashboard prüfen, ob Daten
-- existieren, dann ggf. via SQL:
--   delete from storage.objects where bucket_id = 'documents';
--   delete from storage.buckets where id = 'documents';

-- ============================================================================
-- ENDE 0047_revert_documents_storage_schema.sql
-- ============================================================================
