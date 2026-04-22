import type { Document } from "../types/db";
import { store, uid } from "./store";

export async function fetchDocuments(
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
        console.warn("documents: legacy-row without client_id, returned unfiltered.");
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

export async function uploadDocument(
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

export async function updateDocumentOcr(
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

export async function deleteDocument(
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

export function getDocumentUrl(doc: Document): string | null {
  return store.getBlob(doc.id);
}

export async function downloadDocumentAsFile(doc: Document): Promise<File> {
  const url = store.getBlob(doc.id);
  if (!url) throw new Error("Datei nicht gefunden.");
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], doc.file_name, { type: doc.mime_type });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
