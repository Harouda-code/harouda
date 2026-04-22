// OCR-Wrapper um Tesseract.js.
//
// Zwei API-Ebenen:
//   • runOcrForFile(file) — einfacher Text-String (Legacy-Aufrufer)
//   • runOcrForFileDetailed(file) — pro Seite: Bild + Wort-Bounding-Boxes +
//     Konfidenzen (für den visuellen Overlay im Dokument-Scanner)
//
// Die detailierte Variante gibt die reale Tesseract-Ausgabe weiter — KEINE
// per-Feld-Verknüpfung. Wir färben Wörter nach Konfidenz, ehrlich dargestellt.

const SUPPORTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export function isOcrSupported(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return SUPPORTED.has(mime);
}

export type OcrBBox = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type OcrWord = {
  text: string;
  /** Pixel-Koordinaten im Quellbild (nicht viewport-relativ). */
  bbox: OcrBBox;
  /** 0..100 (Tesseract-Skala) */
  confidence: number;
};

export type OcrPage = {
  /** Base64-Data-URL für <img src>. */
  imageDataUrl: string;
  /** Breite/Höhe des Quellbildes in Pixel. */
  width: number;
  height: number;
  /** Wörter mit Bounding-Box + Konfidenz. */
  words: OcrWord[];
  /** Roh-Text dieser Seite. */
  text: string;
};

export type OcrResult = {
  /** Alle Seiten konkateniert (kompatibel zur alten API). */
  text: string;
  pages: OcrPage[];
};

async function rasterizePdfToCanvases(
  file: File
): Promise<{ canvas: HTMLCanvasElement; blob: Blob }[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const out: { canvas: HTMLCanvasElement; blob: Blob }[] = [];
  const maxPages = Math.min(pdf.numPages, 5);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed."))),
        "image/png"
      )
    );
    out.push({ canvas, blob });
  }
  return out;
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

async function imageToDataUrl(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
  // Dimensionen ermitteln
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    i.src = dataUrl;
  });
  return { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
}

type TesseractWord = {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

function extractWords(data: unknown): OcrWord[] {
  // Tesseract.js Result-Shape variiert leicht zwischen Versionen.
  // Wir ziehen data.words[] raus, wenn vorhanden.
  const rec = data as { words?: TesseractWord[] } | null;
  const words = rec?.words ?? [];
  const out: OcrWord[] = [];
  for (const w of words) {
    if (!w.bbox) continue;
    if (!w.text || !w.text.trim()) continue;
    out.push({
      text: w.text,
      bbox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1,
      },
      confidence: Math.max(0, Math.min(100, Number(w.confidence) || 0)),
    });
  }
  return out;
}

/**
 * Detaillierte OCR mit Seitenbildern + Wort-Bounding-Boxes.
 * Für die visuelle Overlay-Darstellung im Dokument-Scanner.
 */
export async function runOcrForFileDetailed(file: File): Promise<OcrResult> {
  const { default: Tesseract } = await import("tesseract.js");

  if (file.type === "application/pdf") {
    const rasters = await rasterizePdfToCanvases(file);
    const pages: OcrPage[] = [];
    const texts: string[] = [];
    for (const [i, r] of rasters.entries()) {
      const result = await Tesseract.recognize(r.blob, "deu+eng");
      const data = result.data;
      const words = extractWords(data);
      const text = (data as { text?: string }).text ?? "";
      pages.push({
        imageDataUrl: canvasToDataUrl(r.canvas),
        width: r.canvas.width,
        height: r.canvas.height,
        words,
        text,
      });
      texts.push(`--- Seite ${i + 1} ---\n${text}`);
    }
    return { text: texts.join("\n\n"), pages };
  }

  // Bild
  const img = await imageToDataUrl(file);
  const result = await Tesseract.recognize(file, "deu+eng");
  const data = result.data;
  const words = extractWords(data);
  const text = (data as { text?: string }).text ?? "";
  return {
    text,
    pages: [
      {
        imageDataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
        words,
        text,
      },
    ],
  };
}

/** Legacy-Wrapper: nur der konkatenierte Text. */
export async function runOcrForFile(file: File): Promise<string> {
  const r = await runOcrForFileDetailed(file);
  return r.text;
}
