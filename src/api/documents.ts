// ============================================================================
// Documents-API · Wrapper mit Feature-Flag
// (Charge 8, PR 2)
//
// Diese Datei ist NUR ein Routing-Layer. Sie waehlt zwischen Legacy
// (localStorage via store.ts) und Cloud (Supabase Storage + DB) anhand
// des Feature-Flags VITE_USE_SUPABASE_STORAGE aus.
//
// Default: Legacy (Flag aus). Die Cloud-Aktivierung erfolgt erst in
// PR N+1 (`feat/documents-storage-go-live`) nach erfolgreicher Migration.
//
// Externe API-Signaturen sind UNVERAENDERT — Konsumenten muessen NICHTS
// anpassen, ausser sie wollen Cloud-spezifische Funktionen nutzen
// (z.B. `getDocumentSignedUrl`).
//
// Rechtliche Grundlagen:
//   GoBD Rz. 100 ff. — Unveränderbarkeit, Datensicherheit
//   HGB § 257       — Aufbewahrungspflicht
//   DSGVO Art. 32   — Sicherheit der Verarbeitung
// ============================================================================

import type { Document } from "../types/db";
import { store, uid } from "./store";
import {
  fetchDocumentsCloud,
  uploadDocumentCloud,
  updateDocumentOcrCloud,
  deleteDocumentCloud,
  downloadDocumentAsFileCloud,
  getDocumentSignedUrl,
} from "./documentsCloud";

// ---------------------------------------------------------------------------
// Feature-Flag
//
// Striktes String-Vergleich: Nur exakt "true" aktiviert die Cloud.
// Default ist somit OFF — auch bei undefined/empty/"false"/"1"/etc.
// ---------------------------------------------------------------------------

const USE_SUPABASE_STORAGE =
  import.meta.env.VITE_USE_SUPABASE_STORAGE === "true";

// ---------------------------------------------------------------------------
// Re-Exports der Cloud-spezifischen Funktionen
//
// `getDocumentSignedUrl` hat KEINE synchrone Legacy-Entsprechung — daher
// nicht ueber den Wrapper, sondern direkt re-exportiert. Konsumenten
// duerfen die Funktion nutzen, sobald der Flag aktiviert ist.
// ---------------------------------------------------------------------------

export {
  getDocumentSignedUrl,
  readPendingDocumentsLocalStorageMigration,
  migrateOneDocumentToCloud,
  markDocumentsLocalStorageMigrationComplete,
} from "./documentsCloud";
export type { LocalStorageMigrationItem } from "./documentsCloud";

// ---------------------------------------------------------------------------
// Wrapper: Public API (Signaturen identisch zur Legacy-Version)
// ---------------------------------------------------------------------------

export async function fetchDocuments(
  clientId: string | null
): Promise<Document[]> {
  return USE_SUPABASE_STORAGE
    ? fetchDocumentsCloud(clientId)
    : fetchDocumentsLegacy(clientId);
}

export async function uploadDocument(
  file: File,
  clientId: string | null
): Promise<Document> {
  return USE_SUPABASE_STORAGE
    ? uploadDocumentCloud(file, clientId)
    : uploadDocumentLegacy(file, clientId);
}

export async function updateDocumentOcr(
  id: string,
  ocrText: string,
  clientId: string | null
): Promise<void> {
  return USE_SUPABASE_STORAGE
    ? updateDocumentOcrCloud(id, ocrText, clientId)
    : updateDocumentOcrLegacy(id, ocrText, clientId);
}

export async function deleteDocument(
  id: string,
  clientId: string | null
): Promise<void> {
  return USE_SUPABASE_STORAGE
    ? deleteDocumentCloud(id, clientId)
    : deleteDocumentLegacy(id, clientId);
}

/**
 * Synchroner Zugriff auf eine lokale Blob-URL.
 *
 * Im Cloud-Modus liefert die Funktion `null` und schreibt eine Warnung
 * in die Konsole. Konsumenten muessen in den Folge-PRs auf
 * `getDocumentSignedUrl()` (async) umgestellt werden.
 *
 * @deprecated Seit PR 4 (`refactor/documents-preview-async`) bevorzugt
 * `getAnyDocumentUrl(doc)` verwenden. Diese Funktion bleibt aus
 * Backward-Compatibility-Gruenden erhalten und wird in einem spaeteren
 * Cleanup-PR entfernt, sobald alle Konsumenten migriert sind.
 *
 * Diese Asymmetrie ist BEWUSST — die synchrone Signatur wird in JSX
 * direkt verwendet, ein Async-Refactor gehoert nicht in PR 2.
 */
export function getDocumentUrl(doc: Document): string | null {
  if (USE_SUPABASE_STORAGE) {
    if (typeof console !== "undefined") {
      console.warn(
        "documents: getDocumentUrl() ist im Cloud-Modus nicht unterstützt. " +
          "Bitte getDocumentSignedUrl() (async) nutzen."
      );
    }
    return null;
  }
  return getDocumentUrlLegacy(doc);
}

/**
 * Async-faehiger Wrapper, der ein Document zu einer anzeigbaren URL aufloest —
 * unabhaengig vom Storage-Backend.
 *
 * Verhalten:
 *   - Legacy-Modus (Flag OFF):
 *       Ruft `getDocumentUrlLegacy()` auf. Liefert `null`, wenn kein Blob
 *       in localStorage existiert (z. B. Cache geloescht).
 *   - Cloud-Modus  (Flag ON):
 *       Liefert `null`, wenn `doc.file_path` fehlt (Dokument hat keinen
 *       Storage-Pfad — erwarteter Sonderfall).
 *       Andernfalls wird `getDocumentSignedUrl()` aufgerufen. Bei Storage-
 *       oder Netzwerk-Fehler wirft die Funktion — der Aufrufer ist fuer
 *       die Fehler-Behandlung zustaendig.
 *
 * Diese Asymmetrie ist BEWUSST: `null` signalisiert das _erwartete_ Fehlen
 * eines Dokuments (`notAvailable`), waehrend Exceptions _unerwartete_
 * I/O-Fehler signalisieren (`error`). Die UI kann beide Faelle dadurch
 * unterscheiden und passende Hinweise anzeigen.
 *
 * Default-TTL fuer Signed URLs: 1 Stunde (siehe `getDocumentSignedUrl`).
 */
export async function getAnyDocumentUrl(
  doc: Document
): Promise<string | null> {
  if (USE_SUPABASE_STORAGE) {
    if (!doc.file_path) return null;
    return getDocumentSignedUrl(doc);
  }
  return getDocumentUrlLegacy(doc);
}

export async function downloadDocumentAsFile(doc: Document): Promise<File> {
  return USE_SUPABASE_STORAGE
    ? downloadDocumentAsFileCloud(doc)
    : downloadDocumentAsFileLegacy(doc);
}

/**
 * Reine Formatier-Funktion ohne Backend-Beruehrung — kein Wrapper noetig.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ---------------------------------------------------------------------------
// Legacy-Implementierung (localStorage via store.ts)
//
// Funktional identisch zum vorherigen Stand. Nur Umbenennung mit
// `*Legacy`-Suffix — keine Logik-Aenderung.
// ---------------------------------------------------------------------------

async function fetchDocumentsLegacy(
  clientId: string | null
): Promise<Document[]> {
  const all = store.getDocuments();
  if (clientId === null) {
    return all
      .slice()
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  }
  let legacyWarned = false;
  const filtered: Document[] = [];
  for (const d of all) {
    if ((d as Document).client_id === undefined) {
      if (!legacyWarned) {
        console.warn(
          "documents: legacy-row without client_id, returned unfiltered."
        );
        legacyWarned = true;
      }
      filtered.push(d);
      continue;
    }
    if (d.client_id === clientId) filtered.push(d);
  }
  return filtered
    .slice()
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

async function uploadDocumentLegacy(
  file: File,
  clientId: string | null
): Promise<Document> {
  const max = 10 * 1024 * 1024;
  if (file.size > max) {
    throw new Error(
      `Datei überschreitet 10 MB (${formatFileSize(file.size)}).`
    );
  }
  const dataUrl = await fileToDataUrl(file);
  const id = uid();
  store.setBlob(id, dataUrl);
  const doc: Document = {
    id,
    client_id: clientId,
    file_name: file.name,
    file_path: `local://${id}`,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    beleg_nr: null,
    ocr_text: null,
    journal_entry_id: null,
    uploaded_at: new Date().toISOString(),
  };
  store.setDocuments([doc, ...store.getDocuments()]);
  return doc;
}

async function updateDocumentOcrLegacy(
  id: string,
  ocrText: string,
  clientId: string | null
): Promise<void> {
  const all = store.getDocuments();
  const idx = all.findIndex((d) => d.id === id);
  if (idx < 0) return;
  if (
    clientId !== null &&
    all[idx].client_id !== undefined &&
    all[idx].client_id !== clientId
  ) {
    throw new Error("Dokument gehört nicht zum aktiven Mandanten.");
  }
  all[idx] = { ...all[idx], ocr_text: ocrText };
  store.setDocuments(all);
}

async function deleteDocumentLegacy(
  id: string,
  clientId: string | null
): Promise<void> {
  const existing = store.getDocuments().find((d) => d.id === id);
  if (
    existing &&
    clientId !== null &&
    existing.client_id !== undefined &&
    existing.client_id !== clientId
  ) {
    throw new Error("Dokument gehört nicht zum aktiven Mandanten.");
  }
  store.setDocuments(store.getDocuments().filter((d) => d.id !== id));
  store.deleteBlob(id);
}

function getDocumentUrlLegacy(doc: Document): string | null {
  return store.getBlob(doc.id);
}

async function downloadDocumentAsFileLegacy(doc: Document): Promise<File> {
  const url = store.getBlob(doc.id);
  if (!url) throw new Error("Datei nicht gefunden.");
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], doc.file_name, { type: doc.mime_type });
}
