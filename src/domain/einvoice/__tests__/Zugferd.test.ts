import { describe, it, expect } from "vitest";
import { buildZugferd } from "../ZugferdBuilder";
import { extractZugferdFromPdf, readFromXml } from "../ZugferdReader";
import { Money } from "../../../lib/money/Money";
import type { InvoiceLine, Party, XRechnungOptions } from "../types";

function makeLine(
  overrides: Partial<InvoiceLine> = {},
  lineId = "1"
): InvoiceLine {
  return {
    lineId,
    description: "Beratungsleistung",
    quantity: new Money("1"),
    unitCode: "C62",
    netUnitPrice: new Money("100"),
    netAmount: new Money("100"),
    vatRate: new Money("19"),
    vatCategory: "S",
    ...overrides,
  };
}

const SELLER: Party = {
  name: "Musterfirma GmbH",
  legalName: "Musterfirma GmbH",
  address: {
    street: "Hauptstr. 1",
    city: "Berlin",
    postalZone: "10115",
    countryCode: "DE",
  },
  tax: { companyId: "DE123456789", scheme: "VAT" },
};

const BUYER: Party = {
  name: "Kundenfirma AG",
  address: {
    street: "Nebenstr. 2",
    city: "München",
    postalZone: "80331",
    countryCode: "DE",
  },
  tax: { companyId: "DE987654321", scheme: "VAT" },
};

function baseOptions(): XRechnungOptions {
  return {
    invoice: {
      invoiceNumber: "RE-2025-001",
      issueDate: "2025-03-15",
      dueDate: "2025-04-14",
      currency: "EUR",
      type: "380",
      lines: [makeLine()],
      paymentMeans: {
        code: "58",
        iban: "DE02120300000000202051",
        bic: "BYLADEM1001",
      },
    },
    seller: SELLER,
    buyer: BUYER,
    profileId: "XRECHNUNG_3_0",
  };
}

describe("ZugferdBuilder", () => {
  it("baut PDF-Blob mit application/pdf MIME", async () => {
    const r = await buildZugferd(baseOptions());
    expect(r.pdf).toBeInstanceOf(Blob);
    expect(r.pdf.type).toBe("application/pdf");
    expect(r.pdf.size).toBeGreaterThan(1000);
  });

  it("gibt das embedded XML zurück", async () => {
    const r = await buildZugferd(baseOptions());
    expect(r.xml).toMatch(/<\?xml/);
    expect(r.xml).toContain("RE-2025-001");
    expect(r.xml).toContain("xrechnung_3.0");
  });

  it("Default Profile = XRECHNUNG, Attachment = factur-x.xml", async () => {
    const r = await buildZugferd(baseOptions());
    expect(r.profile).toBe("XRECHNUNG");
    expect(r.attachmentName).toBe("factur-x.xml");
  });

  it("Custom Profile BASIC → Attachment zugferd-invoice.xml", async () => {
    const r = await buildZugferd({ ...baseOptions(), profile: "BASIC" });
    expect(r.attachmentName).toBe("zugferd-invoice.xml");
  });
});

describe("ZugferdReader — PDF → XML", () => {
  it("Round-Trip: Builder → Reader findet eingebettete XML", async () => {
    const built = await buildZugferd(baseOptions());
    const ex = await extractZugferdFromPdf(built.pdf);
    expect(ex.fileName).toBe("factur-x.xml");
    expect(ex.xml).toBeTruthy();
    expect(ex.xml!).toContain("RE-2025-001");
  });

  it("Round-Trip: Reader kann extrahiertes XML parsen", async () => {
    const built = await buildZugferd(baseOptions());
    const ex = await extractZugferdFromPdf(built.pdf);
    expect(ex.parsedInvoice).toBeTruthy();
    expect(ex.parsedInvoice!.invoiceNumber).toBe("RE-2025-001");
    expect(ex.parsedInvoice!.supplier.name).toBe("Musterfirma GmbH");
    expect(ex.parsedInvoice!.lines.length).toBe(1);
  });

  it("Round-Trip: Validator läuft auf extrahiertem XML", async () => {
    const built = await buildZugferd(baseOptions());
    const ex = await extractZugferdFromPdf(built.pdf);
    expect(ex.validation).toBeTruthy();
    expect(ex.validation!.isValid).toBe(true);
  });

  it("PDF ohne Attachments → warning, leeres xml", async () => {
    // Minimales PDF von pdf-lib bauen
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    doc.addPage();
    const bytes = await doc.save();
    const ex = await extractZugferdFromPdf(
      new Blob([bytes as unknown as BlobPart], { type: "application/pdf" })
    );
    expect(ex.xml).toBeNull();
    expect(ex.warnings.some((w) => w.includes("keine eingebetteten"))).toBe(true);
  });

  it("readFromXml: direkt aus XML-Text parsen", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ID>TEST-001</cbc:ID>
  <cbc:IssueDate>2025-06-15</cbc:IssueDate>
</Invoice>`;
    const r = readFromXml(xml);
    expect(r.parsedInvoice).toBeTruthy();
    expect(r.parsedInvoice!.invoiceNumber).toBe("TEST-001");
    expect(r.parsedInvoice!.format).toBe("XRECHNUNG");
  });
});
