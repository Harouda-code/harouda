import { describe, it, expect } from "vitest";
import { XRechnungBuilder } from "../XRechnungBuilder";
import { XRechnungValidator } from "../XRechnungValidator";
import { parseXRechnung, invoiceTypeName } from "../XRechnungParser";
import { Money } from "../../../lib/money/Money";
import type {
  InvoiceLine,
  Party,
  XRechnungOptions,
} from "../types";

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
  registration: {
    registrationName: "Amtsgericht Berlin",
    registrationNumber: "HRB 12345",
  },
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

function makeOptions(
  overrides: Partial<XRechnungOptions> = {}
): XRechnungOptions {
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
    ...overrides,
  };
}

describe("XRechnungBuilder", () => {
  const builder = new XRechnungBuilder();

  it("minimale Rechnung: valides UBL-Envelope erzeugt", () => {
    const r = builder.build(makeOptions());
    expect(r.xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(r.xml).toContain("<Invoice");
    expect(r.xml).toContain("</Invoice>");
    expect(r.xml).toContain(
      "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
    );
  });

  it("CustomizationID = XRechnung 3.0 Specification Identifier", () => {
    const r = builder.build(makeOptions());
    expect(r.xml).toContain(
      "urn:xoev-de:kosit:standard:xrechnung_3.0"
    );
  });

  it("Pflicht-BT-Felder im XML enthalten", () => {
    const r = builder.build(makeOptions());
    expect(r.xml).toContain("<cbc:ID>RE-2025-001</cbc:ID>");
    expect(r.xml).toContain("<cbc:IssueDate>2025-03-15</cbc:IssueDate>");
    expect(r.xml).toContain("<cbc:DueDate>2025-04-14</cbc:DueDate>");
    expect(r.xml).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(r.xml).toContain(
      "<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>"
    );
  });

  it("Parteien mit Address + TaxScheme + LegalEntity", () => {
    const r = builder.build(makeOptions());
    expect(r.xml).toContain("Musterfirma GmbH");
    expect(r.xml).toContain("Kundenfirma AG");
    expect(r.xml).toContain("DE123456789");
    expect(r.xml).toContain("HRB 12345");
    expect(r.xml).toMatch(/<cbc:IdentificationCode>DE<\/cbc:IdentificationCode>/);
  });

  it("Tax-Total mit TaxSubtotal je VAT-Gruppe", () => {
    const r = builder.build(
      makeOptions({
        invoice: {
          ...makeOptions().invoice,
          lines: [
            makeLine({ netAmount: new Money("100"), vatRate: new Money("19") }, "1"),
            makeLine(
              {
                netAmount: new Money("50"),
                vatRate: new Money("7"),
                description: "7%-Artikel",
              },
              "2"
            ),
          ],
        },
      })
    );
    expect(r.xml).toMatch(/<cac:TaxSubtotal>/g);
    // TaxAmount gesamt = 19 + 3.5 = 22.50
    expect(r.totalVat.toFixed2()).toBe("22.50");
    expect(r.xml).toContain(
      '<cbc:TaxAmount currencyID="EUR">22.50</cbc:TaxAmount>'
    );
  });

  it("LegalMonetaryTotal: LineExtensionAmount + TaxInclusiveAmount + PayableAmount", () => {
    const r = builder.build(makeOptions());
    expect(r.totalNet.toFixed2()).toBe("100.00");
    expect(r.totalVat.toFixed2()).toBe("19.00");
    expect(r.totalGross.toFixed2()).toBe("119.00");
    expect(r.xml).toContain(
      '<cbc:TaxInclusiveAmount currencyID="EUR">119.00</cbc:TaxInclusiveAmount>'
    );
    expect(r.xml).toContain(
      '<cbc:PayableAmount currencyID="EUR">119.00</cbc:PayableAmount>'
    );
  });

  it("PaymentMeans: SEPA (58) mit IBAN + BIC", () => {
    const r = builder.build(makeOptions());
    expect(r.xml).toContain("<cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>");
    expect(r.xml).toContain("DE02120300000000202051");
    expect(r.xml).toContain("BYLADEM1001");
  });

  it("BuyerReference (Leitweg-ID) wird aufgenommen wenn gesetzt", () => {
    const r = builder.build(
      makeOptions({
        invoice: {
          ...makeOptions().invoice,
          buyerReference: "04011000-12345-67",
        },
      })
    );
    expect(r.xml).toContain(
      "<cbc:BuyerReference>04011000-12345-67</cbc:BuyerReference>"
    );
  });

  it("Gutschrift (Typ 381) mit negativem Nettobetrag", () => {
    const r = builder.build(
      makeOptions({
        invoice: {
          ...makeOptions().invoice,
          type: "381",
          lines: [
            makeLine({
              netUnitPrice: new Money("-100"),
              netAmount: new Money("-100"),
            }),
          ],
        },
      })
    );
    expect(r.xml).toContain("<cbc:InvoiceTypeCode>381</cbc:InvoiceTypeCode>");
    expect(r.totalGross.toFixed2()).toBe("-119.00");
  });

  it("XML-Escape für Sonderzeichen im Partner-Namen", () => {
    const r = builder.build(
      makeOptions({
        seller: { ...SELLER, name: "A & B <GmbH>" },
      })
    );
    expect(r.xml).toContain("A &amp; B &lt;GmbH&gt;");
  });

  it("Dezimal-Punkt in Beträgen (EN 16931)", () => {
    const r = builder.build(makeOptions());
    expect(r.xml).toContain("100.00");
    expect(r.xml).not.toContain(">100,00<");
  });
});

describe("XRechnungValidator", () => {
  const v = new XRechnungValidator();

  it("valides Input → isValid=true", () => {
    const r = v.validateOptions(makeOptions());
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("fehlende Rechnungsnummer → BR-01", () => {
    const r = v.validateOptions(
      makeOptions({
        invoice: { ...makeOptions().invoice, invoiceNumber: "" },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-01")).toBe(true);
    expect(r.isValid).toBe(false);
  });

  it("falsches Datums-Format → BR-DE-14", () => {
    const r = v.validateOptions(
      makeOptions({
        invoice: { ...makeOptions().invoice, issueDate: "15.03.2025" },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-DE-14")).toBe(true);
  });

  it("fehlender Seller VAT ID → BR-44", () => {
    const r = v.validateOptions(
      makeOptions({
        seller: {
          ...SELLER,
          tax: { companyId: "", scheme: "VAT" },
        },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-44")).toBe(true);
  });

  it("fehlende Käufer-Country → BR-12", () => {
    const r = v.validateOptions(
      makeOptions({
        buyer: {
          ...BUYER,
          address: { ...BUYER.address, countryCode: "" },
        },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-12")).toBe(true);
  });

  it("Rechnung ohne Zeile → BR-16", () => {
    const r = v.validateOptions(
      makeOptions({
        invoice: { ...makeOptions().invoice, lines: [] },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-16")).toBe(true);
  });

  it("Zeile ohne Einheit-Code → BR-23", () => {
    const r = v.validateOptions(
      makeOptions({
        invoice: {
          ...makeOptions().invoice,
          lines: [makeLine({ unitCode: "" })],
        },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-23")).toBe(true);
  });

  it("BR-CO-04: Menge × Preis ≠ Nettobetrag → Fehler", () => {
    const r = v.validateOptions(
      makeOptions({
        invoice: {
          ...makeOptions().invoice,
          lines: [
            makeLine({
              quantity: new Money("2"),
              netUnitPrice: new Money("100"),
              netAmount: new Money("150"), // sollte 200 sein
            }),
          ],
        },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-CO-04")).toBe(true);
  });

  it("negativer Betrag auf Handelsrechnung (380) → BR-CO-04", () => {
    const r = v.validateOptions(
      makeOptions({
        invoice: {
          ...makeOptions().invoice,
          type: "380",
          lines: [
            makeLine({
              netUnitPrice: new Money("-100"),
              netAmount: new Money("-100"),
            }),
          ],
        },
      })
    );
    expect(r.errors.some((e) => e.rule === "BR-CO-04")).toBe(true);
  });

  it("validateXml: well-formed aber ohne CustomizationID → BR-X4", () => {
    const bad = `<?xml version="1.0"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>X</cbc:ID>
</Invoice>`;
    const r = v.validateXml(bad);
    expect(r.errors.some((e) => e.rule === "BR-X4")).toBe(true);
  });

  it("validateXml: fehlende XML-Deklaration → BR-X1", () => {
    const r = v.validateXml("<Invoice></Invoice>");
    expect(r.errors.some((e) => e.rule === "BR-X1")).toBe(true);
  });

  it("B2G Hinweis: Käufer mit 'Stadt' im Namen ohne Leitweg-ID → Warning BR-DE-1", () => {
    const r = v.validateOptions(
      makeOptions({
        buyer: { ...BUYER, name: "Stadt München" },
      })
    );
    expect(r.warnings.some((w) => w.rule === "BR-DE-1")).toBe(true);
  });
});

describe("XRechnungParser (UBL → ParsedInvoice)", () => {
  const builder = new XRechnungBuilder();

  it("Roundtrip: Builder → Parser liefert konsistente Kern-Felder", () => {
    const built = builder.build(makeOptions());
    const parsed = parseXRechnung(built.xml);
    expect(parsed.invoiceNumber).toBe("RE-2025-001");
    expect(parsed.issueDate).toBe("2025-03-15");
    expect(parsed.dueDate).toBe("2025-04-14");
    expect(parsed.currency).toBe("EUR");
    expect(parsed.supplier.name).toBe("Musterfirma GmbH");
    expect(parsed.customer.name).toBe("Kundenfirma AG");
    expect(parsed.supplier.tax.companyId).toBe("DE123456789");
    expect(parsed.lines.length).toBe(1);
    expect(parsed.lines[0].description).toBe("Beratungsleistung");
    expect(parsed.lines[0].netAmount.toFixed2()).toBe("100.00");
    expect(parsed.totalNet.toFixed2()).toBe("100.00");
    expect(parsed.totalVat.toFixed2()).toBe("19.00");
    expect(parsed.totalGross.toFixed2()).toBe("119.00");
  });

  it("Format-Detection: XRECHNUNG wird erkannt", () => {
    const built = builder.build(makeOptions());
    const parsed = parseXRechnung(built.xml);
    expect(parsed.format).toBe("XRECHNUNG");
    expect(parsed.profile).toMatch(/XRechnung 3\.0/);
  });

  it("Mehrzeilige Rechnung: alle Lines extrahiert", () => {
    const opts = makeOptions({
      invoice: {
        ...makeOptions().invoice,
        lines: [
          makeLine({ description: "Pos A", netAmount: new Money("100") }, "1"),
          makeLine({ description: "Pos B", netAmount: new Money("200") }, "2"),
          makeLine({ description: "Pos C", netAmount: new Money("300") }, "3"),
        ],
      },
    });
    const built = builder.build(opts);
    const parsed = parseXRechnung(built.xml);
    expect(parsed.lines.length).toBe(3);
    expect(parsed.lines.map((l) => l.description)).toEqual(["Pos A", "Pos B", "Pos C"]);
  });

  it("Ungültiges XML wirft mit klarer Nachricht", () => {
    expect(() => parseXRechnung("not xml at all")).toThrow(/Invoice.*Root/);
  });

  it("Helper invoiceTypeName mappt Codes zu deutschen Namen", () => {
    expect(invoiceTypeName("380")).toBe("Handelsrechnung");
    expect(invoiceTypeName("381")).toBe("Gutschrift");
    expect(invoiceTypeName("999")).toMatch(/Code 999/);
  });
});
