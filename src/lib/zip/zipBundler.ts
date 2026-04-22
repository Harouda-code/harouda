/**
 * ZIP-Bundle-Helfer via JSZip.
 *
 * Packt eine Map<filename, Uint8Array> in ein ZIP, das im Browser als
 * Blob heruntergeladen werden kann. Standardkompression: DEFLATE Level 6.
 *
 * JSZip ist transitiv über exceljs verfügbar (harouda-app dependencies)
 * und kommt ohne zusätzliches npm install aus.
 */

import JSZip from "jszip";

export type ZipOptions = {
  /** "STORE" = keine Kompression; "DEFLATE" = Standard-Kompression. */
  compression?: "STORE" | "DEFLATE";
  /** 1-9; nur für DEFLATE. Default 6. */
  compressionLevel?: number;
};

/** Erzeugt einen ZIP-Blob aus einer Map<Name, Bytes>. */
export async function createZipFromFiles(
  files: Map<string, Uint8Array>,
  options: ZipOptions = {}
): Promise<Blob> {
  const zip = new JSZip();
  for (const [filename, content] of files) {
    zip.file(filename, content, {
      compression: options.compression ?? "DEFLATE",
      compressionOptions: { level: options.compressionLevel ?? 6 },
    });
  }
  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/zip",
  });
}

/** Triggert den Download eines Blobs als Datei im Browser. */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lädt ein ZIP und gibt die enthaltenen Dateien als Map zurück (für Round-trip-Test). */
export async function readZipToFiles(
  blob: Blob
): Promise<Map<string, Uint8Array>> {
  const zip = await JSZip.loadAsync(blob);
  const out = new Map<string, Uint8Array>();
  const promises: Promise<void>[] = [];
  zip.forEach((_path, entry) => {
    if (entry.dir) return;
    promises.push(
      entry.async("uint8array").then((bytes) => {
        out.set(entry.name, bytes);
      })
    );
  });
  await Promise.all(promises);
  return out;
}
