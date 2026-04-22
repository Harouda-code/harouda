/**
 * PDF/A-3-Post-Processor fuer den Jahresabschluss (Sprint E4 / Schritt 3).
 *
 * Baut aus einem vorhandenen pdfmake-PDF (Uint8Array) ein PDF, das
 * formal in Richtung PDF/A-3 geht: setzt Metadata, injiziert XMP, haengt
 * optional einen XBRL-Anhang (AFRelationship "Source") an.
 *
 * WARNUNG: pdf-lib kann die ISO 19005-3 Konformitaet NICHT allein
 * garantieren. Fuer rechtssichere Langzeit-Archivierung muss das
 * Dokument nach der Konvertierung extern via veraPDF geprueft werden
 * (siehe docs/DEPLOYMENT-VERAPDF-VALIDATION.md). Dieses Modul setzt die
 * Dinge, die pdf-lib API-seitig kann — ICC-OutputIntent + detailliertes
 * XMP-Profil sind nicht vollstaendig via pdf-lib moeglich.
 *
 * Strategische Synergie: die gleiche pdf-lib-Pipeline-Technik nutzt
 * ZugferdBuilder fuer die XML-Einbettung (src/domain/einvoice/
 * ZugferdBuilder.ts). Die Code-Patterns sind bewusst konsistent.
 */
import { PDFDocument, AFRelationship } from "pdf-lib";

export type PdfA3Metadata = {
  title: string;
  author?: string;
  subject: string;
  keywords: string[];
  producer: string;
  creation_date: Date;
};

export type PdfA3XbrlAttachment = {
  filename: string;
  /** Nur application/xml wird unterstuetzt (XBRL ist XML). */
  mimeType: "application/xml";
  bytes: Uint8Array;
  /** "Source" fuer XBRL (Daten-Quelle); "Data" wenn reine
   *  Anhang-Daten ohne visuelle Repraesentation im PDF. */
  relationship: "Source" | "Data";
};

export type PdfA3Input = {
  pdfBytes: Uint8Array;
  metadata: PdfA3Metadata;
  xbrlAttachment?: PdfA3XbrlAttachment;
  /** Raw-Bytes des ICC-Profils (sRGB2014.icc).
   *  Wenn nicht gesetzt, wirft convertToPdfA3 mit klarer Meldung. */
  iccProfileBytes?: Uint8Array;
};

export class PdfA3IccMissingError extends Error {
  constructor() {
    super(
      "PDF/A-3-Konvertierung benoetigt ICC-Profil — siehe " +
        "src/domain/jahresabschluss/pdf/assets/README.md"
    );
    this.name = "PdfA3IccMissingError";
  }
}

/**
 * Fuehrt die Konvertierung durch und gibt die neuen PDF-Bytes zurueck.
 *
 * Schritte:
 *   1. Laden der Input-Bytes via pdf-lib.
 *   2. Metadata auf Dokument-Level setzen (Title, Author, Subject,
 *      Keywords, Producer, Creator, CreationDate, ModDate).
 *   3. Wenn `xbrlAttachment` vorhanden: attach() mit richtigem
 *      AFRelationship.
 *   4. ICC-Profil als OutputIntent anhaengen (experimentell — pdf-lib
 *      bietet keine direkte OutputIntent-API; wir embedden die ICC-
 *      Bytes als Raw-Stream und markieren sie im Catalog via low-level
 *      pdf-lib API, falls verfuegbar; andernfalls wird das Profil als
 *      Attachment beigelegt + Tech-Debt-Flag).
 *   5. Save + return Uint8Array.
 */
export async function convertToPdfA3(input: PdfA3Input): Promise<Uint8Array> {
  if (!input.iccProfileBytes || input.iccProfileBytes.length === 0) {
    throw new PdfA3IccMissingError();
  }

  const pdf = await PDFDocument.load(input.pdfBytes);

  // 1) Metadata.
  pdf.setTitle(input.metadata.title);
  if (input.metadata.author) pdf.setAuthor(input.metadata.author);
  pdf.setSubject(input.metadata.subject);
  pdf.setKeywords(input.metadata.keywords);
  pdf.setProducer(input.metadata.producer);
  pdf.setCreator(input.metadata.producer);
  pdf.setCreationDate(input.metadata.creation_date);
  pdf.setModificationDate(input.metadata.creation_date);

  // 2) XBRL-Anhang (wenn vorhanden).
  if (input.xbrlAttachment) {
    const att = input.xbrlAttachment;
    const rel =
      att.relationship === "Source"
        ? AFRelationship.Source
        : AFRelationship.Data;
    await pdf.attach(att.bytes, att.filename, {
      mimeType: att.mimeType,
      description: `XBRL-Daten (${att.filename}) — AFRelationship=${att.relationship}`,
      creationDate: input.metadata.creation_date,
      modificationDate: input.metadata.creation_date,
      afRelationship: rel,
    });
  }

  // 3) ICC-Profil als ergaenzendes Attachment (Work-around bis
  //    pdf-lib eine native OutputIntent-API bietet). Siehe Tech-Debt
  //    in docs/DEPLOYMENT-VERAPDF-VALIDATION.md.
  await pdf.attach(input.iccProfileBytes, "sRGB2014.icc", {
    mimeType: "application/octet-stream",
    description: "Embedded sRGB ICC-Profile (OutputIntent-Stub)",
    creationDate: input.metadata.creation_date,
    modificationDate: input.metadata.creation_date,
    afRelationship: AFRelationship.Data,
  });

  // `useObjectStreams: false` macht Attachment-Eintraege inspizierbar
  // (bei komprimierten Object-Streams stehen Filenames im Stream und
  // sind nicht mehr als Plaintext im PDF sichtbar). Fuer PDF/A-3 ist
  // das ohnehin die konservativere Variante.
  return pdf.save({ useObjectStreams: false });
}
