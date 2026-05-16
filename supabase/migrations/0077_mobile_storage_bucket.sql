-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0077: Storage Bucket "mobile-uploads" fuer Mobile-App-Belege
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   Erstellt einen dedizierten privaten Storage-Bucket "mobile-uploads"
--   ausschliesslich fuer Beleg-Dateien (Bilder, PDFs), die ueber die
--   Mobile-App hochgeladen werden, und definiert die zugehoerigen RLS-
--   Policies auf storage.objects. Die Pfad-Konvention bindet jede Datei
--   transitiv an Kanzlei (companies) und Mandant (clients).
--
-- Hintergrund:
--   Strategische Entscheidung E4-a (Separation of Concerns beim Beleg-Scan):
--   Das Endgeraet liefert Roh-Dateien; OCR/Buchung erfolgt serverseitig.
--   Die Datei selbst landet in storage.objects unter mobile-uploads. Der
--   Metadaten-Eintrag in public.belege (mit hash_sha256, uploaded_via_app)
--   verweist auf den Storage-Pfad.
--
-- Pfad-Konvention:
--   {company_id}/{client_id}/{beleg_id}/{dateiname}
--
--   - company_id (UUID der Kanzlei): erstes Segment — primaere Mandanten-
--     trennung in Anlehnung an bestehende Bucket-Konventionen.
--   - client_id (UUID des Mandanten): zweites Segment — Bindung an den
--     konkreten Mandanten innerhalb der Kanzlei.
--   - beleg_id (UUID des Beleg-Datensatzes in public.belege): drittes
--     Segment — 1:1-Bindung an die Beleg-Zeile.
--   - dateiname: viertes Segment — Originaldateiname oder generierter
--     Name (Anwendungsebene).
--
--   Diese Konvention erlaubt RLS-Policies, die direkt aus dem Pfad die
--   Zugehoerigkeit ableiten (split_part(name, '/', N)::uuid).
--
-- Rechtsgrundlage:
--   - § 30 AO (Steuergeheimnis): physische Trennung der Mandanten-Belege
--   - § 146 AO (Ordnungsvorschriften)
--   - § 147 AO (Aufbewahrungspflichten)
--   - DSGVO Art. 5 Abs. 1 lit. f, Art. 25, Art. 32
--   - GoBD (BMF 14.07.2025), Rz. 58 ff., Rz. 119, Rz. 125, Rz. 131
--   - BSI IT-Grundschutz APP.3.1 (Allgemeine Webanwendungen),
--     APP.4.3 (Mobile Anwendungen)
--
-- Design-Entscheidungen:
--   - Bucket "mobile-uploads": dediziert, public = false, klein-MIME-
--     beschraenkt (image/jpeg, image/png, image/heic, image/heif,
--     application/pdf). Groessen-Limit 25 MB (Mobile-typisch).
--   - Pfad-Validierung via split_part + ::uuid-Cast: ein ungueltiger
--     Pfad scheitert beim Cast und fuehrt zu Policy-Ausschluss.
--   - INSERT-Policy: User muss aktiver Mobile-App-User des durch das
--     zweite Pfad-Segment identifizierten clients sein.
--   - SELECT-Policy: User sieht eigene Uploads (zweites Segment matcht
--     einen aktiven Mobile-App-User-Eintrag); Kanzlei-MA sieht alle
--     Uploads ihrer Kanzlei (erstes Segment matcht is_company_member).
--   - UPDATE-Policy: NICHT erstellt — Inhalt von Beleg-Dateien ist
--     unveraenderlich (GoBD Rz. 58 ff.).
--   - DELETE-Policy: NICHT erstellt — Loeschung verweigert; nur
--     Service-Role kann administrativ aufraeumen.
--   - Idempotenz: ON CONFLICT (id) DO NOTHING fuer den Bucket-Insert,
--     drop policy if exists vor jeder Policy.
--   - is_client_app_user UND is_company_member existieren bereits
--     (Migrations 0076 bzw. 0057) — werden hier genutzt, nicht neu
--     definiert.
--
-- Folge-Migrations:
--   0078: Custom Access Token Hook
--
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ============================================================================
-- 1) Bucket "mobile-uploads"
-- ============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'mobile-uploads',
  'mobile-uploads',
  false,
  26214400,  -- 25 MiB
  array[
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- ============================================================================
-- 2) Policies auf storage.objects fuer Bucket "mobile-uploads"
-- ============================================================================
-- Pfad-Konvention: {company_id}/{client_id}/{beleg_id}/{dateiname}
--   split_part(name, '/', 1) = company_id
--   split_part(name, '/', 2) = client_id

-- SELECT: Mobile-App-User sieht eigene Uploads; Kanzlei-MA sieht alle
--         Uploads ihrer Kanzlei.
drop policy if exists mobile_uploads_select on storage.objects;
create policy mobile_uploads_select on storage.objects
  for select using (
    bucket_id = 'mobile-uploads'
    and (
      public.is_company_member(
        (split_part(name, '/', 1))::uuid
      )
      or public.is_client_app_user(
        (split_part(name, '/', 2))::uuid
      )
    )
  );

-- INSERT: Nur aktiver Mobile-App-User des durch das zweite Pfad-Segment
--         identifizierten clients darf hochladen.
drop policy if exists mobile_uploads_insert on storage.objects;
create policy mobile_uploads_insert on storage.objects
  for insert with check (
    bucket_id = 'mobile-uploads'
    and public.is_client_app_user(
      (split_part(name, '/', 2))::uuid
    )
  );

-- Kein UPDATE und kein DELETE — Beleg-Dateien sind unveraenderlich.
drop policy if exists mobile_uploads_update on storage.objects;
drop policy if exists mobile_uploads_delete on storage.objects;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   begin;
--   drop policy if exists mobile_uploads_insert on storage.objects;
--   drop policy if exists mobile_uploads_select on storage.objects;
--   -- Bucket NICHT automatisch loeschen, da bereits Daten enthalten sein
--   -- koennten. Manuelles Cleanup-Kommando:
--   --   delete from storage.objects where bucket_id = 'mobile-uploads';
--   --   delete from storage.buckets where id = 'mobile-uploads';
--   commit;
-- ════════════════════════════════════════════════════════════════════════════
