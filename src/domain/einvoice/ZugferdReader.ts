/**
 * ZUGFeRD-/Factur-X-Reader: extrahiert eingebettete XML aus einem PDF-Blob
 * und parst sie in ein ParsedInvoice-Strukt.
 *
 * Sucht nach bekannten Attachment-Namen (case-insensitive):
 *   - factur-x.xml   (ZUGFeRD 2.x / Factur-X)
 *   - zugferd-invoice.xml  (ZUGFeRD 1.x)
 *   - xrechnung.xml
 *
 * Falls kein passendes Attachment gefunden wird: null.
 *
 * Hinweis: pdf-lib liest Attachments aus dem PDF-Structure-Tree; das
 * funktioniert für ZUGFeRD-konforme Dateien auch ohne vollständige
 * PDF/A-3-Compliance.
 */

import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFStream,
  PDFHexString,
  PDFString,
  PDFArray,
  PDFRef,
} from "pdf-lib";
import { parseXRechnung } from "./XRechnungParser";
import { XRechnungValidator } from "./XRechnungValidator";
import type {
  EInvoiceValidationResult,
  ParsedInvoice,
} from "./types";

const KNOWN_ATTACHMENT_NAMES = [
  "factur-x.xml",
  "zugferd-invoice.xml",
  "xrechnung.xml",
  "rechnung.xml",
];

/** Dekodiert einen PDFStream basierend auf dem /Filter-Eintrag.
 *  Unterstützt aktuell: keine Kompression (null Filter) + FlateDecode.
 *  Andere Filter (ASCII85, LZW) sind für Factur-X/XRechnung-Attachments
 *  praktisch nicht zu erwarten. */
function decodeStream(stream: PDFStream): Uint8Array {
  const raw = (stream as unknown as { getContents: () => Uint8Array }).getContents();
  const dict = stream.dict;
  const filter = dict.lookup(PDFName.of("Filter"));
  // Einzel-Filter oder Array von Filtern
  const filters: string[] = [];
  if (filter instanceof PDFName) {
    filters.push(filter.asString());
  } else if (filter instanceof PDFArray) {
    for (let i = 0; i < filter.size(); i++) {
      const f = filter.lookup(i);
      if (f instanceof PDFName) filters.push(f.asString());
    }
  }
  if (filters.length === 0) return raw;
  let current = raw;
  for (const f of filters) {
    if (f === "/FlateDecode" || f === "/Fl") {
      current = flateDecode(current);
    } else {
      // Unbekannter Filter — wir geben die aktuellen Bytes zurück und
      // verlassen uns darauf, dass der XML-Parser es fängt.
      break;
    }
  }
  return current;
}

function flateDecode(data: Uint8Array): Uint8Array {
  // Sync FlateDecode via Node's zlib (in happy-dom/vitest verfügbar).
  // Browser-Fallback (DecompressionStream) wäre async — nicht sinnvoll in
  // dieser Synchron-API. Für produktive Browser-Nutzung die Extract-Kette
  // ggf. auf async umstellen.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const zlib = require("node:zlib") as typeof import("node:zlib");
    return new Uint8Array(zlib.inflateSync(data));
  } catch {
    return data;
  }
}

function pdfStringValue(obj: unknown): string {
  if (obj instanceof PDFHexString || obj instanceof PDFString) {
    return obj.decodeText();
  }
  if (typeof (obj as { value?: () => string })?.value === "function") {
    return (obj as { value: () => string }).value();
  }
  return "";
}

export type ZugferdExtractResult = {
  xml: string | null;
  fileName: string | null;
  parsedInvoice: ParsedInvoice | null;
  validation: EInvoiceValidationResult | null;
  warnings: string[];
};

/** Liest alle eingebetteten Dateien aus dem PDF und gibt eine Map Name→Bytes.
 *  Robust gegen unterschiedliche pdf-lib-interne Attachment-Strukturen: wir
 *  scannen alle indirekten PDF-Objekte nach Filespec-Dicts (Type=Filespec).
 */
async function extractAttachments(
  pdfBytes: Uint8Array
): Promise<Map<string, Uint8Array>> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const result = new Map<string, Uint8Array>();
  const context = pdf.context;

  const fKey = PDFName.of("F");
  const ufKey = PDFName.of("UF");
  const efKey = PDFName.of("EF");
  const afKey = PDFName.of("AF");

  const resolve = (obj: unknown): unknown => {
    if (obj instanceof PDFRef) return context.lookup(obj);
    return obj;
  };

  function extractFromFilespec(filespec: unknown) {
    const dict = resolve(filespec);
    if (!(dict instanceof PDFDict)) return;
    const ef = resolve(dict.lookup(efKey));
    if (!(ef instanceof PDFDict)) return;
    const stream = resolve(ef.lookup(fKey));
    if (!(stream instanceof PDFStream)) return;
    const name =
      pdfStringValue(resolve(dict.lookup(ufKey))) ||
      pdfStringValue(resolve(dict.lookup(fKey)));
    if (!name) return;
    const bytes = decodeStream(stream);
    result.set(name, bytes);
  }

  // Pfad 1: Catalog /AF (Associated Files, PDF/A-3 — pdf-lib nutzt dies)
  const af = resolve(pdf.catalog.lookup(afKey));
  if (af instanceof PDFArray) {
    for (let i = 0; i < af.size(); i++) {
      extractFromFilespec(af.lookup(i));
    }
  }

  // Pfad 2: Catalog /Names/EmbeddedFiles (klassischer ZUGFeRD-Pfad)
  if (result.size === 0) {
    const names = resolve(pdf.catalog.lookup(PDFName.of("Names")));
    if (names instanceof PDFDict) {
      const embedded = resolve(names.lookup(PDFName.of("EmbeddedFiles")));
      if (embedded instanceof PDFDict) {
        const nameArray = resolve(embedded.lookup(PDFName.of("Names")));
        if (nameArray instanceof PDFArray) {
          for (let i = 0; i < nameArray.size(); i += 2) {
            extractFromFilespec(nameArray.lookup(i + 1));
          }
        }
      }
    }
  }

  // Pfad 3: Fallback — scanne alle indirekten Dicts mit /EF
  if (result.size === 0) {
    for (const [, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFDict && obj.lookup(efKey)) {
        extractFromFilespec(obj);
      }
    }
  }

  return result;
}

export async function extractZugferdFromPdf(
  pdf: Blob | Uint8Array
): Promise<ZugferdExtractResult> {
  const bytes =
    pdf instanceof Uint8Array
      ? pdf
      : new Uint8Array(await pdf.arrayBuffer());

  const warnings: string[] = [];
  let attachments: Map<string, Uint8Array>;
  try {
    attachments = await extractAttachments(bytes);
  } catch (e) {
    warnings.push(
      `Attachments konnten nicht gelesen werden: ${(e as Error).message}`
    );
    return {
      xml: null,
      fileName: null,
      parsedInvoice: null,
      validation: null,
      warnings,
    };
  }

  // Suche passendes Attachment (case-insensitive)
  let foundName: string | null = null;
  let foundBytes: Uint8Array | null = null;
  for (const [name, content] of attachments) {
    const lower = name.toLowerCase();
    if (KNOWN_ATTACHMENT_NAMES.some((n) => lower.endsWith(n))) {
      foundName = name;
      foundBytes = content;
      break;
    }
  }
  if (!foundName || !foundBytes) {
    if (attachments.size > 0) {
      warnings.push(
        `Anhänge gefunden, aber kein bekannter Invoice-Dateiname: ${Array.from(attachments.keys()).join(", ")}`
      );
    } else {
      warnings.push("PDF enthält keine eingebetteten Dateien (kein ZUGFeRD).");
    }
    return {
      xml: null,
      fileName: null,
      parsedInvoice: null,
      validation: null,
      warnings,
    };
  }

  const xml = new TextDecoder("utf-8").decode(foundBytes);
  let parsed: ParsedInvoice | null = null;
  try {
    parsed = parseXRechnung(xml);
  } catch (e) {
    warnings.push(`Parser-Fehler: ${(e as Error).message}`);
  }

  let validation: EInvoiceValidationResult | null = null;
  try {
    validation = new XRechnungValidator().validateXml(xml);
  } catch (e) {
    warnings.push(`Validator-Fehler: ${(e as Error).message}`);
  }

  return {
    xml,
    fileName: foundName,
    parsedInvoice: parsed,
    validation,
    warnings,
  };
}

/** Extrahiert aus reinem XML (nicht PDF). */
export function readFromXml(xml: string): ZugferdExtractResult {
  const warnings: string[] = [];
  let parsed: ParsedInvoice | null = null;
  try {
    parsed = parseXRechnung(xml);
  } catch (e) {
    warnings.push(`Parser-Fehler: ${(e as Error).message}`);
  }
  let validation: EInvoiceValidationResult | null = null;
  try {
    validation = new XRechnungValidator().validateXml(xml);
  } catch (e) {
    warnings.push(`Validator-Fehler: ${(e as Error).message}`);
  }
  return {
    xml,
    fileName: null,
    parsedInvoice: parsed,
    validation,
    warnings,
  };
}
