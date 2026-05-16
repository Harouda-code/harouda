-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0075: belege Mobile-Erweiterungen — Herkunft und Integritaets-Hash
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   Erweitert die bestehende Tabelle public.belege (eingefuehrt in Migration
--   0022) um zwei Spalten zur Unterstuetzung der Mobile-App-Erfassung:
--     - uploaded_via_app: kennzeichnet die Herkunft eines Belegs
--     - hash_sha256:      kryptographischer Inhalts-Hash zur Integritaets-
--                         pruefung (GoBD-konforme Unveraenderbarkeit ab
--                         Eingang am Server)
--
-- Hintergrund:
--   Strategische Entscheidung E4-a (Separation of Concerns beim Beleg-Scan):
--   Das Endgeraet liefert ausschliesslich Bild- oder PDF-Datei + Metadaten;
--   die OCR-Verarbeitung und die buchhalterische Auswertung erfolgen
--   ausschliesslich am Server (Kanzlei-Seite). Der hash_sha256 wird auf
--   dem Geraet ueber den Roh-Inhalt der Datei gebildet und beim Upload
--   uebertragen — der Server verifiziert ihn unmittelbar gegen den
--   tatsaechlich empfangenen Inhalt und schreibt ihn unveraendert in die
--   Tabelle. Spaetere Abweichungen werden so erkennbar.
--
-- Rechtsgrundlage:
--   - GoBD (BMF 14.07.2025), Rz. 58 ff. (Unveraenderbarkeit), Rz. 119
--     (Identifizierbarkeit der Belege), Rz. 125 (mobile/bildliche
--     Erfassung), Rz. 131 (Verfahrensdokumentation)
--   - § 146 AO (Ordnungsvorschriften, zeitgerechte Erfassung)
--   - § 147 AO (Aufbewahrungspflichten)
--   - BStBK Muster-Verfahrensdokumentation zum ersetzenden Scannen v2.0
--   - BSI IT-Grundschutz APP.4.3 (Mobile Anwendungen)
--
-- Design-Entscheidungen:
--   - uploaded_via_app BOOLEAN NOT NULL DEFAULT false: bestehende Belege
--     bleiben implizit als Kanzlei-Upload markiert (historisch korrekt).
--     Postgres >= 11 fuehrt fuer BOOLEAN NOT NULL DEFAULT keinen Tabellen-
--     Rewrite durch (Metadaten-Operation).
--   - hash_sha256 TEXT NULL: Kanzlei-Uploads sind nicht zwingend gehasht,
--     daher NULL erlaubt. Mobile-App-Uploads MUESSEN einen Hash haben
--     (chk_belege_app_upload_requires_hash erzwingt dies).
--   - SHA-256-Format: 64 Zeichen, lowercase hex (Standard-Hex-Darstellung).
--     Regex-Validierung im CHECK-Constraint.
--   - Partial-Index nur auf uploaded_via_app = true: klein und auf den
--     erwartet kleineren Teil der Tabelle gefiltert; spart Speicher und
--     beschleunigt App-Upload-Abfragen.
--   - Diese Migration AeNDERT WEDER RLS NOCH BERECHTIGUNGEN von
--     public.belege — beide bleiben unveraendert.
--   - Audit: Aenderungen an public.belege werden ueber das bestehende
--     audit_log CDC-Pattern erfasst (sofern Trigger existiert, was eine
--     Voraussetzung des Hauptprojekts ist und nicht in dieser Migration
--     hergestellt wird).
--   - Bekannte Tech-Debt unberuehrt: public.belege.mandant_id (historische
--     Inkonsistenz, Migration 0026 dokumentiert sie) wird hier WEDER
--     entfernt NOCH veraendert. Diese Migration faegt ausschliesslich
--     hinzu.
--
-- Folge-Migrations:
--   0076: RLS-Policies (Mobile-Upload-Pfad auf belege)
--   0077: Storage Bucket + Policies (Mobile-Upload-Dateien)
--
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.belege
  ADD COLUMN uploaded_via_app BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.belege
  ADD COLUMN hash_sha256 TEXT;

-- SHA-256-Format: genau 64 lowercase hex Zeichen, wenn gesetzt
ALTER TABLE public.belege
  ADD CONSTRAINT chk_belege_hash_sha256_format
  CHECK (
    hash_sha256 IS NULL
    OR hash_sha256 ~ '^[0-9a-f]{64}$'
  );

-- Mobile-App-Uploads MUESSEN einen Hash haben (GoBD-Integritaet)
ALTER TABLE public.belege
  ADD CONSTRAINT chk_belege_app_upload_requires_hash
  CHECK (
    uploaded_via_app = false
    OR hash_sha256 IS NOT NULL
  );

-- Partial-Index fuer Filter "nur Mobile-App-Uploads"
CREATE INDEX idx_belege_uploaded_via_app
  ON public.belege (uploaded_via_app)
  WHERE uploaded_via_app = true;

COMMENT ON COLUMN public.belege.uploaded_via_app IS
  'TRUE wenn der Beleg ueber die Mobile-App hochgeladen wurde. FALSE = klassischer Kanzlei-Upload. Default FALSE.';

COMMENT ON COLUMN public.belege.hash_sha256 IS
  'SHA-256-Hash (64 hex chars, lowercase) des hochgeladenen Beleg-Inhalts. Pflicht fuer Mobile-App-Uploads (GoBD-Integritaet). NULL fuer klassische Kanzlei-Uploads. Bildung auf dem Endgeraet, Verifikation am Server.';

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   BEGIN;
--   DROP INDEX IF EXISTS public.idx_belege_uploaded_via_app;
--   ALTER TABLE public.belege
--     DROP CONSTRAINT IF EXISTS chk_belege_app_upload_requires_hash;
--   ALTER TABLE public.belege
--     DROP CONSTRAINT IF EXISTS chk_belege_hash_sha256_format;
--   ALTER TABLE public.belege DROP COLUMN IF EXISTS hash_sha256;
--   ALTER TABLE public.belege DROP COLUMN IF EXISTS uploaded_via_app;
--   COMMIT;
-- ════════════════════════════════════════════════════════════════════════════
