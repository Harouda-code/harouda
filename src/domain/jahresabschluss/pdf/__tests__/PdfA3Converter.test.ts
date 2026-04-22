// Jahresabschluss-E4 / Schritt 3 · PdfA3Converter-Tests.

import { describe, it, expect } from "vitest";
import {
  convertToPdfA3,
  PdfA3IccMissingError,
  type PdfA3Metadata,
} from "../PdfA3Converter";
import { PDFDocument } from "pdf-lib";

async function makeMinimalPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage();
  return doc.save();
}

function metadataFixture(): PdfA3Metadata {
  return {
    title: "Jahresabschluss 2025 — Testfirma",
    author: "Kanzlei Mustermann",
    subject: "Jahresabschluss zum 31.12.2025",
    keywords: ["HGB", "Jahresabschluss", "GmbH"],
    producer: "Harouda",
    creation_date: new Date("2026-04-23T10:00:00Z"),
  };
}

// Dummy-"ICC-Profil"-Bytes — fuer den Test reicht irgendein non-empty
// Buffer. Die echte Validierung gegen das ICC-Format passiert extern
// via veraPDF (siehe DEPLOYMENT-VERAPDF-VALIDATION.md).
const FAKE_ICC = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

describe("PdfA3Converter", () => {
  it("#1 Happy-Path: Konvertierung liefert non-empty Output + PDF-Header", async () => {
    const inPdf = await makeMinimalPdf();
    const out = await convertToPdfA3({
      pdfBytes: inPdf,
      metadata: metadataFixture(),
      iccProfileBytes: FAKE_ICC,
    });
    expect(out.length).toBeGreaterThan(0);
    // PDF-Signatur "%PDF".
    expect(out[0]).toBe(0x25); // %
    expect(out[1]).toBe(0x50); // P
    expect(out[2]).toBe(0x44); // D
    expect(out[3]).toBe(0x46); // F
  });

  it("#2 Metadata-Title im Output nachlesbar", async () => {
    const inPdf = await makeMinimalPdf();
    const out = await convertToPdfA3({
      pdfBytes: inPdf,
      metadata: metadataFixture(),
      iccProfileBytes: FAKE_ICC,
    });
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getTitle()).toContain("Jahresabschluss 2025");
    expect(reloaded.getSubject()).toContain("31.12.2025");
    expect(reloaded.getAuthor()).toContain("Mustermann");
  });

  it("#3 XBRL-Attachment findet sich nach Konvertierung wieder", async () => {
    const inPdf = await makeMinimalPdf();
    const xbrlXml = `<?xml version="1.0" encoding="UTF-8"?>\n<xbrl/>`;
    const xbrlBytes = new TextEncoder().encode(xbrlXml);
    const out = await convertToPdfA3({
      pdfBytes: inPdf,
      metadata: metadataFixture(),
      iccProfileBytes: FAKE_ICC,
      xbrlAttachment: {
        filename: "ebilanz-2025.xml",
        mimeType: "application/xml",
        bytes: xbrlBytes,
        relationship: "Source",
      },
    });
    // pdf-lib hat keine public getAttachments(); wir pruefen ueber den
    // Raw-Bytes-Inhalt, dass die Filenames im EmbeddedFiles-Dict stehen.
    const outStr = new TextDecoder("latin1").decode(out);
    expect(outStr).toContain("ebilanz-2025.xml");
    expect(outStr).toContain("sRGB2014.icc");
    // pdf-lib schreibt AFRelationship als PDF-Name (/Source) ins
    // /AF-Dictionary ein. In komprimierten Streams steht das nicht
    // als Plain-Text; nur der Filename ist ueber den Namen-Tree
    // zuverlaessig pruefbar.
    expect(outStr).toMatch(/application#2[Ff]xml|application\/xml/);
  });

  it("#4 Fehlendes ICC-Profil -> PdfA3IccMissingError mit Hilfstext", async () => {
    const inPdf = await makeMinimalPdf();
    await expect(
      convertToPdfA3({
        pdfBytes: inPdf,
        metadata: metadataFixture(),
        // iccProfileBytes fehlt absichtlich.
      })
    ).rejects.toBeInstanceOf(PdfA3IccMissingError);

    await expect(
      convertToPdfA3({
        pdfBytes: inPdf,
        metadata: metadataFixture(),
        iccProfileBytes: new Uint8Array(0),
      })
    ).rejects.toThrow(/assets\/README\.md/);
  });

  it("#5 Keywords sind im Metadata-Dictionary enthalten", async () => {
    const inPdf = await makeMinimalPdf();
    const out = await convertToPdfA3({
      pdfBytes: inPdf,
      metadata: metadataFixture(),
      iccProfileBytes: FAKE_ICC,
    });
    const reloaded = await PDFDocument.load(out);
    const keywords = reloaded.getKeywords();
    expect(keywords).toBeTruthy();
    expect(keywords!).toContain("HGB");
    expect(keywords!).toContain("GmbH");
  });
});
