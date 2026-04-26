/**
 * ZUGFeRD-/Factur-X-Builder: hybride Rechnung (visuelles PDF + eingebettetes XRechnung-XML).
 *
 * Vorgehen:
 *   1. XRechnung-XML via XRechnungBuilder erzeugen
 *   2. Visuelles PDF mit jsPDF + autoTable bauen
 *   3. pdf-lib öffnet das jsPDF-Ergebnis und hängt das XML als Attachment
 *      mit Dateinamen `factur-x.xml` an (AFRelationship "Alternative")
 *
 * Scope-Hinweis (ehrliche Einordnung):
 *   - PDF/A-3-Compliance erfordert zusätzlich XMP-Metadaten und einen
 *     ColorProfile/OutputIntent, der mit pdf-lib nicht out-of-the-box
 *     kommt. Wir embedden das XML korrekt (das ist der Kernwert für
 *     Buchhaltungssoftware auf Empfängerseite). Für strikte PDF/A-3-
 *     Konformität → zusätzlich Verarico / Ghostscript / VeraPDF.
 *   - Profil derzeit: XRECHNUNG (Subset), XML entspricht XRechnung 3.0.
 */

import { PDFDocument, AFRelationship } from "pdf-lib";
import { XRechnungBuilder } from "./XRechnungBuilder";
import type { XRechnungOptions, ZugferdProfile } from "./types";
import { PdfReportBase, type PdfReportOptions } from "../../lib/pdf/PdfBase";
import { sumMoney } from "../../lib/money/sum";

export type ZugferdBuildOptions = XRechnungOptions & {
  profile?: ZugferdProfile;
  pdfOptions?: Partial<PdfReportOptions>;
};

export type ZugferdBuildResult = {
  pdf: Blob;
  xml: string;
  profile: ZugferdProfile;
  attachmentName: string;
};

/** Baut zuerst das visuelle PDF, dann embedded pdf-lib die XML. */
export async function buildZugferd(
  options: ZugferdBuildOptions
): Promise<ZugferdBuildResult> {
  const profile: ZugferdProfile = options.profile ?? "XRECHNUNG";

  // 1) XRechnung-XML
  const xrBuilder = new XRechnungBuilder();
  const { xml } = xrBuilder.build(options);

  // 2) Visuelles PDF
  const visualPdfBytes = await buildVisualPdfBytes(options);

  // 3) pdf-lib: Attachment einhängen
  const pdfDoc = await PDFDocument.load(visualPdfBytes);
  const xmlBytes = new TextEncoder().encode(xml);
  const attachmentName =
    profile === "XRECHNUNG" || profile === "EN16931"
      ? "factur-x.xml"
      : "zugferd-invoice.xml";

  await pdfDoc.attach(xmlBytes, attachmentName, {
    mimeType: "application/xml",
    description: "XRechnung / Factur-X Embedded XML",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Alternative,
  });

  // Metadaten für ZUGFeRD-Hinweise
  pdfDoc.setTitle(
    `Rechnung ${options.invoice.invoiceNumber} (${profile})`
  );
  pdfDoc.setProducer("harouda-app ZUGFeRD-Builder (nachgebildet)");
  pdfDoc.setCreator("harouda-app");
  pdfDoc.setKeywords([
    "invoice",
    "factur-x",
    "zugferd",
    profile,
    options.invoice.currency,
  ]);

  const finalBytes = await pdfDoc.save();
  const blob = new Blob([finalBytes as unknown as BlobPart], {
    type: "application/pdf",
  });

  return {
    pdf: blob,
    xml,
    profile,
    attachmentName,
  };
}

// ----------------- Visual PDF (jsPDF) -----------------

async function buildVisualPdfBytes(
  options: ZugferdBuildOptions
): Promise<Uint8Array> {
  const pdf = new PdfReportBase();
  const mandantName =
    options.pdfOptions?.mandantName ?? options.seller.name;

  pdf.addHeader({
    title: `Rechnung ${options.invoice.invoiceNumber}`,
    subtitle: `Ausstellungsdatum: ${options.invoice.issueDate}`,
    mandantName,
    ...options.pdfOptions,
  });

  // Verkäufer + Käufer Blöcke
  pdf.addSection("Verkäufer");
  pdf.addKeyValue("Name", options.seller.name);
  pdf.addKeyValue(
    "Anschrift",
    `${options.seller.address.street}, ${options.seller.address.postalZone} ${options.seller.address.city}, ${options.seller.address.countryCode}`
  );
  pdf.addKeyValue("USt-IdNr / StNr", options.seller.tax.companyId);
  if (options.seller.registration) {
    pdf.addKeyValue(
      "Registereintrag",
      `${options.seller.registration.registrationName} · ${options.seller.registration.registrationNumber}`
    );
  }

  pdf.addSection("Käufer");
  pdf.addKeyValue("Name", options.buyer.name);
  pdf.addKeyValue(
    "Anschrift",
    `${options.buyer.address.street}, ${options.buyer.address.postalZone} ${options.buyer.address.city}, ${options.buyer.address.countryCode}`
  );
  if (options.buyer.tax.companyId) {
    pdf.addKeyValue("USt-IdNr", options.buyer.tax.companyId);
  }
  if (options.invoice.buyerReference) {
    pdf.addKeyValue("Leitweg-ID", options.invoice.buyerReference);
  }

  // Rechnungs-Metadaten
  pdf.addSection("Rechnungsdaten");
  pdf.addKeyValue("Rechnungsnummer", options.invoice.invoiceNumber);
  pdf.addKeyValue("Rechnungsdatum", options.invoice.issueDate);
  pdf.addKeyValue("Fälligkeit", options.invoice.dueDate);
  if (options.invoice.orderReference) {
    pdf.addKeyValue("Bestellreferenz", options.invoice.orderReference);
  }

  // Positionen
  pdf.addSection("Positionen");
  const rows = options.invoice.lines.map((l) => [
    l.lineId,
    l.description,
    `${l.quantity.toFixed2()} ${l.unitCode}`,
    pdf.formatMoney(l.netUnitPrice),
    `${l.vatRate.toFixed2()} %`,
    pdf.formatMoney(l.netAmount),
  ]);
  pdf.addTable(
    ["Nr.", "Bezeichnung", "Menge", "Preis", "USt", "Netto"],
    rows,
    { rightAlignColumns: [3, 4, 5], columnWidths: [15, 70, 25, 28, 15, 28] }
  );

  // Summen (Money-präzise)
  const totalNet = sumMoney(options.invoice.lines.map((l) => l.netAmount));
  const totalVat = sumMoney(
    options.invoice.lines.map((l) => l.netAmount.times(l.vatRate).div(100))
  );
  const totalGross = totalNet.plus(totalVat);

  pdf.addSection("Rechnungssummen");
  pdf.addKeyValue("Summe netto", pdf.formatMoney(totalNet));
  pdf.addKeyValue("Summe USt", pdf.formatMoney(totalVat));
  pdf.addKeyValue("Gesamtbetrag", pdf.formatMoney(totalGross), {
    bold: true,
  });

  // Zahlung
  pdf.addSection("Zahlung");
  pdf.addKeyValue("Zahlungsart", options.invoice.paymentMeans.code);
  if (options.invoice.paymentMeans.iban) {
    pdf.addKeyValue("IBAN", options.invoice.paymentMeans.iban);
  }
  if (options.invoice.paymentMeans.bic) {
    pdf.addKeyValue("BIC", options.invoice.paymentMeans.bic);
  }
  if (options.invoice.paymentTerms) {
    pdf.addKeyValue("Zahlungsbedingungen", options.invoice.paymentTerms);
  }

  pdf.addFooter({
    title: "Rechnung",
    mandantName,
    disclaimer:
      "NACHGEBILDETE ZUGFeRD-DARSTELLUNG · factur-x.xml eingebettet · kein zertifiziertes PDF/A-3",
  });

  const blob = pdf.toBlob();
  const ab = await blob.arrayBuffer();
  return new Uint8Array(ab);
}
