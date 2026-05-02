// ============================================================================
// Documents-Cloud-API · Supabase Storage + DB
// (Charge 8, PR 2)
//
// Diese Datei implementiert die Cloud-Variante der Documents-API. Sie wird
// niemals direkt von Konsumenten importiert — der Wrapper in `documents.ts`
// entscheidet via Feature-Flag, ob Cloud oder Legacy genutzt wird.
//
// Pfad-Konvention (KRITISCH):
//   {company_id}/{document_id}.{ext}
//
// Diese Konvention wird von den RLS-Storage-Policies in
// `0004_multitenant.sql` erwartet — `storage.foldername(name)[1]` MUSS
// gleich der `company_id` sein. Eine Abweichung bricht den Storage-Zugriff.
//
// Rechtliche Grundlagen:
//   GoBD Rz. 100 ff. — Unveränderbarkeit, Datensicherheit
//   HGB § 257       — Aufbewahrungspflicht
//   DSGVO Art. 32   — Sicherheit der Verarbeitung
// ============================================================================

import type { Document } from "../types/db";
import { supabase } from "./supabase";
import { requireCompanyId } from "./db";

const STORAGE_BUCKET = "documents";
const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const LEGACY_STORAGE_KEY = "harouda:documents";
const LEGACY_BLOB_KEY_PREFIX = "harouda:doc:";
const MIGRATION_FLAG_KEY = "harouda:documents:migrated";

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/**
 * Extrahiert die Datei-Endung (inkl. Punkt) aus einem Dateinamen.
 * Liefert leeren String, wenn keine Endung vorhanden ist.
 */
function extractExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx <= 0 || idx === fileName.length - 1) return "";
  return fileName.slice(idx);
}

/**
 * Konstruiert den Storage-Pfad nach Konvention:
 *   {company_id}/{document_id}.{ext}
 *
 * Die Storage-Policies in 0004_multitenant.sql parsen das erste Pfadsegment
 * als company_id — Abweichungen brechen den Zugriff.
 */
function buildStoragePath(
  companyId: string,
  documentId: string,
  fileName: string
): string {
  const ext = extractExtension(fileName);
  return `${companyId}/${documentId}${ext}`;
}

/**
 * DB-Zeile (mit Spalten aus 0001 + 0004 + 0026 + 0046).
 * Fuer das Mapping auf Document werden nur die Felder uebernommen, die im
 * aktuellen Type definiert sind. Eine Type-Erweiterung ist Future Work.
 */
type DocumentDbRow = {
  id: string;
  client_id: string | null;
  file_name: string;
  file_path: string | null;
  mime_type: string;
  size_bytes: number;
  beleg_nr: string | null;
  ocr_text: string | null;
  journal_entry_id: string | null;
  uploaded_at: string;
};

function rowToDocument(row: DocumentDbRow): Document {
  return {
    id: row.id,
    client_id: row.client_id,
    file_name: row.file_name,
    file_path: row.file_path,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    beleg_nr: row.beleg_nr,
    ocr_text: row.ocr_text,
    journal_entry_id: row.journal_entry_id,
    uploaded_at: row.uploaded_at,
  };
}

/**
 * Liefert die User-ID des aktuellen Sessions. Wirft, wenn nicht
 * authentifiziert. Cloud-Modus erfordert immer einen authentifizierten User.
 */
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Nicht authentifiziert. Bitte erneut anmelden.");
  }
  return userId;
}

/**
 * Generiert eine UUID. Bevorzugt `crypto.randomUUID()`. Fallback fuer
 * sehr alte Umgebungen (sollte in Produktion nie greifen).
 */
function generateDocumentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Standard-Spaltenliste fuer DB-Selects. Konstant gehalten, damit die
 * `as DocumentDbRow`-Casts garantiert konsistent sind.
 */
const DOCUMENT_SELECT_COLUMNS =
  "id, client_id, file_name, file_path, mime_type, size_bytes, beleg_nr, ocr_text, journal_entry_id, uploaded_at";

// ---------------------------------------------------------------------------
// Public API: Cloud-Variante
// ---------------------------------------------------------------------------

/**
 * Liest die Dokumente der aktuellen Firma. Optional gefiltert nach Mandant.
 * Sortierung: neueste zuerst (`uploaded_at DESC`).
 *
 * RLS sichert den Company-Scope serverseitig — der explizite
 * `eq("company_id", ...)`-Filter ist redundant, aber defensiv.
 */
export async function fetchDocumentsCloud(
  clientId: string | null
): Promise<Document[]> {
  const companyId = requireCompanyId();

  let query = supabase
    .from("documents")
    .select(DOCUMENT_SELECT_COLUMNS)
    .eq("company_id", companyId)
    .order("uploaded_at", { ascending: false });

  if (clientId !== null) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToDocument(row as DocumentDbRow));
}

/**
 * Laedt eine Datei in Storage hoch und legt einen DB-Eintrag an.
 *
 * Reihenfolge (kritisch fuer Konsistenz):
 *   1. ID erzeugen
 *   2. Storage-Upload
 *   3. DB-Insert
 *   4. Bei DB-Fehler: Storage-Objekt zuruecknehmen (best effort)
 */
export async function uploadDocumentCloud(
  file: File,
  clientId: string | null
): Promise<Document> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Datei überschreitet 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`
    );
  }

  const companyId = requireCompanyId();
  const userId = await requireUserId();

  const documentId = generateDocumentId();
  const filePath = buildStoragePath(companyId, documentId, file.name);
  const mimeType = file.type || "application/octet-stream";
  const uploadedAt = new Date().toISOString();

  // 1) Storage-Upload.
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
  }

  // 2) DB-Insert.
  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      company_id: companyId,
      client_id: clientId,
      created_by: userId,
      file_name: file.name,
      file_path: filePath,
      mime_type: mimeType,
      size_bytes: file.size,
      beleg_nr: null,
      ocr_text: null,
      journal_entry_id: null,
      uploaded_at: uploadedAt,
    })
    .select(DOCUMENT_SELECT_COLUMNS)
    .single();

  if (insertError || !data) {
    // 3) Rollback Storage-Objekt (best effort) — DB-Fehler bleibt primaere Ursache.
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])
      .catch(() => {
        // Schluck Fehler — Logging ueber audit-Layer ist Future Work.
      });
    throw new Error(
      `Datenbank-Eintrag fehlgeschlagen: ${insertError?.message ?? "unbekannt"}`
    );
  }

  return rowToDocument(data as DocumentDbRow);
}

/**
 * Generiert einen Signed URL fuer den Download.
 * Default-Gueltigkeit: 1 Stunde (3600 Sekunden).
 *
 * Async by design — `getDocumentUrl()` aus dem Legacy-Code bleibt synchron.
 * Konsumenten muessen in den Folge-PRs auf `await getDocumentSignedUrl()`
 * umgestellt werden.
 */
export async function getDocumentSignedUrl(
  doc: Document,
  expiresIn: number = DEFAULT_SIGNED_URL_TTL_SECONDS
): Promise<string> {
  if (!doc.file_path) {
    throw new Error("Dokument hat keinen Storage-Pfad.");
  }
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.file_path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Signed URL konnte nicht erzeugt werden: ${error?.message ?? "unbekannt"}`
    );
  }
  return data.signedUrl;
}

/**
 * Loescht ein Dokument: zuerst aus Storage, dann aus DB.
 * Mandanten-Filter ist optional. RLS sichert Company-Scope serverseitig.
 *
 * Idempotent: Wenn das Dokument bereits geloescht wurde, kehrt die Funktion
 * stillschweigend zurueck.
 */
export async function deleteDocumentCloud(
  id: string,
  clientId: string | null
): Promise<void> {
  const companyId = requireCompanyId();

  // 1) Pfad fuer Storage-Loeschung ermitteln.
  let pathQuery = supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .eq("company_id", companyId);

  if (clientId !== null) {
    pathQuery = pathQuery.eq("client_id", clientId);
  }

  const { data: pathData, error: pathError } = await pathQuery.maybeSingle();
  if (pathError) throw new Error(pathError.message);
  if (!pathData) {
    // Bereits geloescht oder gehoert nicht zur Firma/Mandant — idempotent return.
    return;
  }

  // 2) Storage-Loeschung.
  if (pathData.file_path) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([pathData.file_path]);
    if (storageError) {
      throw new Error(
        `Storage-Loeschung fehlgeschlagen: ${storageError.message}`
      );
    }
  }

  // 3) DB-Loeschung.
  let deleteQuery = supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (clientId !== null) {
    deleteQuery = deleteQuery.eq("client_id", clientId);
  }

  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw new Error(deleteError.message);
}

/**
 * Aktualisiert das OCR-Ergebnis eines Dokuments.
 */
export async function updateDocumentOcrCloud(
  id: string,
  ocrText: string,
  clientId: string | null
): Promise<void> {
  const companyId = requireCompanyId();

  let query = supabase
    .from("documents")
    .update({ ocr_text: ocrText })
    .eq("id", id)
    .eq("company_id", companyId);

  if (clientId !== null) {
    query = query.eq("client_id", clientId);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);
}

/**
 * Laedt ein Dokument als File-Objekt herunter — fuer Re-Upload, Drucken,
 * Re-OCR-Verarbeitung etc.
 *
 * Geht ueber Signed URL → fetch → Blob → File. Ein direkter
 * `download()`-Call auf Storage waere semantisch klarer, ist aber via
 * Signed URL netzneutraler (gleicher Pfad wie Browser-Download).
 */
export async function downloadDocumentAsFileCloud(
  doc: Document
): Promise<File> {
  const signedUrl = await getDocumentSignedUrl(doc, 60);
  const res = await fetch(signedUrl);
  if (!res.ok) {
    throw new Error(`Download fehlgeschlagen: HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return new File([blob], doc.file_name, { type: doc.mime_type });
}

// ---------------------------------------------------------------------------
// Migrations-Helfer (One-Time-Sync localStorage -> Cloud)
//
// Werden in PR 2 NICHT ausgefuehrt — nur bereitgestellt fuer PR N+1
// (`feat/documents-storage-go-live`). Trigger erfolgt dort manuell oder
// gesteuert ueber den ausgehenden Login-Flow.
// ---------------------------------------------------------------------------

export type LocalStorageMigrationItem = {
  doc: Document;
  /** Data-URL aus localStorage, z.B. `data:image/png;base64,...` */
  blob: string;
};

/**
 * Liest die ausstehenden localStorage-Dokumente, die noch nicht migriert
 * wurden. Liefert leeres Array, wenn die Migration bereits abgeschlossen
 * oder nichts zu migrieren ist.
 *
 * Diese Funktion FUEHRT KEINE Migration aus — sie liefert nur die Daten.
 * Der Aufrufer entscheidet, wann `migrateOneDocumentToCloud` aufgerufen
 * wird und wann `markDocumentsLocalStorageMigrationComplete` gesetzt wird.
 */
export function readPendingDocumentsLocalStorageMigration(): LocalStorageMigrationItem[] {
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") return [];
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const docs = JSON.parse(raw) as Document[];
    if (!Array.isArray(docs)) return [];
    const items: LocalStorageMigrationItem[] = [];
    for (const doc of docs) {
      const blob = localStorage.getItem(`${LEGACY_BLOB_KEY_PREFIX}${doc.id}`);
      if (blob) items.push({ doc, blob });
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Migriert ein einzelnes Dokument von localStorage in die Cloud.
 *
 * Schritte:
 *   1. Data-URL → Blob konvertieren
 *   2. In Storage hochladen unter neuem Pfad
 *   3. DB-Eintrag mit identischer ID erzeugen
 *
 * Bei DB-Fehler: Rollback des Storage-Objekts (best effort).
 * Fehler werden geworfen — der Aufrufer entscheidet ueber Retry/Skip.
 */
export async function migrateOneDocumentToCloud(
  doc: Document,
  blob: string
): Promise<void> {
  const companyId = requireCompanyId();
  const userId = await requireUserId();

  // 1) Data-URL → Blob.
  const response = await fetch(blob);
  const fileBlob = await response.blob();

  // 2) Storage-Upload.
  const filePath = buildStoragePath(companyId, doc.id, doc.file_name);
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileBlob, {
      contentType: doc.mime_type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Migration-Upload fehlgeschlagen für ${doc.file_name}: ${uploadError.message}`
    );
  }

  // 3) DB-Insert.
  const { error: insertError } = await supabase.from("documents").insert({
    id: doc.id,
    company_id: companyId,
    client_id: doc.client_id ?? null,
    created_by: userId,
    file_name: doc.file_name,
    file_path: filePath,
    mime_type: doc.mime_type,
    size_bytes: doc.size_bytes,
    beleg_nr: doc.beleg_nr,
    ocr_text: doc.ocr_text,
    journal_entry_id: doc.journal_entry_id,
    uploaded_at: doc.uploaded_at,
  });

  if (insertError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])
      .catch(() => {
        // ignore
      });
    throw new Error(
      `Migration-DB-Insert fehlgeschlagen für ${doc.file_name}: ${insertError.message}`
    );
  }
}

/**
 * Markiert die localStorage-Dokumenten-Migration als abgeschlossen.
 * Idempotent. Die Original-Eintraege bleiben zunaechst bestehen
 * (Sicherheitsnetz fuer 2 Wochen) — Aufraeumen erfolgt in einem Folge-PR.
 */
export function markDocumentsLocalStorageMigrationComplete(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}
