/**
 * Thin Wrapper um pdfmake's client-side createPdf/download. Existiert
 * nur, damit Tests den Aufruf mocken koennen, ohne pdfmake selbst zu
 * bootstrappen (im happy-dom-Test-Environment fehlen Canvas-APIs).
 *
 * E4 erweitert um optionalen archivMode:
 *  - archivMode=false → pdfmake-direktes Download wie E3b.
 *  - archivMode=true  → pdfmake erzeugt Buffer, PdfA3Converter
 *    konvertiert zu PDF/A-3-kandidat, Browser laedt unter
 *    "<name>-pdfa.pdf" herunter.
 */
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import type {
  PdfA3Metadata,
  PdfA3XbrlAttachment,
} from "./PdfA3Converter";

export type DownloadPdfOptions = {
  archivMode?: boolean;
  pdfA3Metadata?: PdfA3Metadata;
  xbrlAttachment?: PdfA3XbrlAttachment;
  /** ICC-Profil-Bytes (von Vite-`?url`-Import bei Bedarf). */
  iccProfileBytes?: Uint8Array;
};

export type DownloadPdfFn = (
  docDef: TDocumentDefinitions,
  fileName: string,
  options?: DownloadPdfOptions
) => Promise<void>;

let bootstrapped = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfMakeRef: any = null;

async function ensurePdfMake(): Promise<void> {
  if (bootstrapped) return;
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const vfsModule = await import("pdfmake/build/vfs_fonts");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pm: any = (pdfMakeModule as any).default ?? pdfMakeModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfsAny: any = (vfsModule as any).default ?? vfsModule;
  pm.vfs = vfsAny?.pdfMake?.vfs ?? vfsAny?.vfs ?? vfsAny;
  pdfMakeRef = pm;
  bootstrapped = true;
}

function createPdfGetBuffer(
  docDef: TDocumentDefinitions
): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve) => {
    pdfMakeRef.createPdf(docDef).getBuffer((buffer: Uint8Array) => {
      resolve(buffer);
    });
  });
}

function triggerBrowserDownload(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Default-Implementierung fuer Produktion (browser). */
export const downloadJahresabschlussPdf: DownloadPdfFn = async (
  docDef,
  fileName,
  options
) => {
  await ensurePdfMake();
  if (!options?.archivMode) {
    pdfMakeRef.createPdf(docDef).download(fileName);
    return;
  }
  // PDF/A-3-Pfad: Buffer holen, via pdf-lib konvertieren, dann Download.
  if (!options.pdfA3Metadata) {
    throw new Error(
      "archivMode=true verlangt options.pdfA3Metadata (Title/Subject/Keywords...)"
    );
  }
  const rawBytes = await createPdfGetBuffer(docDef);
  // Lazy-Import damit pdf-lib nicht im Einstiegsbundle liegt.
  const { convertToPdfA3 } = await import("./PdfA3Converter");
  const archivBytes = await convertToPdfA3({
    pdfBytes: rawBytes,
    metadata: options.pdfA3Metadata,
    xbrlAttachment: options.xbrlAttachment,
    iccProfileBytes: options.iccProfileBytes,
  });
  const pdfaName = fileName.replace(/\.pdf$/i, "-pdfa.pdf");
  triggerBrowserDownload(archivBytes, pdfaName);
};
