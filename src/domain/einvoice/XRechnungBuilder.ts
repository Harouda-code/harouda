/**
 * XRechnung 3.0 Builder — UBL-2.1 Invoice XML.
 *
 * Erzeugt eine gültig strukturierte XRechnung (EN 16931 + CIUS DE).
 * Validierung läuft separat durch XRechnungValidator.
 *
 * Scope-Hinweis: Wir erzeugen well-formed UBL-Invoice mit Kern-BT-Feldern
 * (Summen, Parteien, Positionen, USt-Gruppen, Zahlungsmittel). Erweiterte
 * Konzepte (Allowances/Charges je Line, Document References, Delivery,
 * Invoice Period) sind nicht Teil dieser MVP-Implementation — das Gerüst
 * ist aber erweiterbar.
 */

import { Money } from "../../lib/money/Money";
import { sumMoney } from "../../lib/money/sum";
import { XRECHNUNG_3_0 } from "./xrechnungStructure";
import type {
  InvoiceLine,
  Party,
  VatCategoryCode,
  XRechnungOptions,
} from "./types";

const CURRENCY = "EUR";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type XRechnungBuildResult = {
  xml: string;
  totalNet: Money;
  totalVat: Money;
  totalGross: Money;
};

export class XRechnungBuilder {
  build(options: XRechnungOptions): XRechnungBuildResult {
    const { invoice, seller, buyer } = options;

    // Summen berechnen
    const lineNet = sumMoney(invoice.lines.map((l) => l.netAmount));
    const taxSubtotals = this.groupTaxSubtotals(invoice.lines);
    const taxTotal = sumMoney(
      Array.from(taxSubtotals.values()).map((s) => s.taxAmount)
    );
    const gross = lineNet.plus(taxTotal);

    const parts: string[] = [];
    parts.push(this.buildEnvelopeOpen());
    parts.push(this.buildCustomizationProfileId());
    parts.push(this.buildInvoiceHeader(invoice));
    parts.push(this.buildParty("AccountingSupplierParty", seller));
    parts.push(this.buildParty("AccountingCustomerParty", buyer));
    parts.push(this.buildDelivery(invoice.deliveryDate));
    parts.push(this.buildPaymentMeans(invoice));
    parts.push(this.buildPaymentTerms(invoice.paymentTerms));
    parts.push(this.buildTaxTotal(taxTotal, taxSubtotals));
    parts.push(this.buildMonetaryTotal(lineNet, taxTotal, gross));
    for (const line of invoice.lines) {
      parts.push(this.buildInvoiceLine(line));
    }
    parts.push("</Invoice>");

    const xml = parts.join("\n");
    return {
      xml,
      totalNet: lineNet,
      totalVat: taxTotal,
      totalGross: gross,
    };
  }

  // ---------- Envelope ----------
  private buildEnvelopeOpen(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice
  xmlns="${XRECHNUNG_3_0.namespaces.ubl}"
  xmlns:cac="${XRECHNUNG_3_0.namespaces.cac}"
  xmlns:cbc="${XRECHNUNG_3_0.namespaces.cbc}"
  xmlns:xsi="${XRECHNUNG_3_0.namespaces.xsi}">`;
  }

  private buildCustomizationProfileId(): string {
    return `  <cbc:CustomizationID>${XRECHNUNG_3_0.specificationIdentifier}</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>`;
  }

  // ---------- Header ----------
  private buildInvoiceHeader(invoice: XRechnungOptions["invoice"]): string {
    const parts: string[] = [];
    parts.push(`  <cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID>`);
    parts.push(`  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>`);
    parts.push(`  <cbc:DueDate>${invoice.dueDate}</cbc:DueDate>`);
    parts.push(`  <cbc:InvoiceTypeCode>${invoice.type}</cbc:InvoiceTypeCode>`);
    if (invoice.notes) {
      for (const note of invoice.notes) {
        parts.push(`  <cbc:Note>${escapeXml(note)}</cbc:Note>`);
      }
    }
    parts.push(`  <cbc:DocumentCurrencyCode>${CURRENCY}</cbc:DocumentCurrencyCode>`);
    if (invoice.buyerReference) {
      parts.push(
        `  <cbc:BuyerReference>${escapeXml(invoice.buyerReference)}</cbc:BuyerReference>`
      );
    }
    if (invoice.orderReference) {
      parts.push(`  <cac:OrderReference>
    <cbc:ID>${escapeXml(invoice.orderReference)}</cbc:ID>
  </cac:OrderReference>`);
    }
    return parts.join("\n");
  }

  // ---------- Party ----------
  private buildParty(
    element: "AccountingSupplierParty" | "AccountingCustomerParty",
    party: Party
  ): string {
    const endpointXml = party.endpointId
      ? `      <cbc:EndpointID schemeID="${escapeXml(party.endpointScheme ?? "EM")}">${escapeXml(party.endpointId)}</cbc:EndpointID>`
      : "";

    const addr = party.address;
    const addressXml = `      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(addr.street)}</cbc:StreetName>
${addr.additionalStreet ? `        <cbc:AdditionalStreetName>${escapeXml(addr.additionalStreet)}</cbc:AdditionalStreetName>\n` : ""}        <cbc:CityName>${escapeXml(addr.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(addr.postalZone)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${escapeXml(addr.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>`;

    const taxXml = `      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(party.tax.companyId)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>${party.tax.scheme}</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>`;

    const legalXml = `      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(party.legalName ?? party.name)}</cbc:RegistrationName>
${party.registration ? `        <cbc:CompanyID>${escapeXml(party.registration.registrationNumber)}</cbc:CompanyID>\n` : ""}      </cac:PartyLegalEntity>`;

    const contactXml = party.contact
      ? `      <cac:Contact>
${party.contact.name ? `        <cbc:Name>${escapeXml(party.contact.name)}</cbc:Name>\n` : ""}${party.contact.phone ? `        <cbc:Telephone>${escapeXml(party.contact.phone)}</cbc:Telephone>\n` : ""}${party.contact.email ? `        <cbc:ElectronicMail>${escapeXml(party.contact.email)}</cbc:ElectronicMail>\n` : ""}      </cac:Contact>`
      : "";

    return `  <cac:${element}>
    <cac:Party>
${endpointXml}
      <cac:PartyName><cbc:Name>${escapeXml(party.name)}</cbc:Name></cac:PartyName>
${addressXml}
${taxXml}
${legalXml}${contactXml ? "\n" + contactXml : ""}
    </cac:Party>
  </cac:${element}>`;
  }

  // ---------- Delivery ----------
  private buildDelivery(date?: string): string {
    if (!date) return "";
    return `  <cac:Delivery>
    <cbc:ActualDeliveryDate>${date}</cbc:ActualDeliveryDate>
  </cac:Delivery>`;
  }

  // ---------- Payment Means ----------
  private buildPaymentMeans(invoice: XRechnungOptions["invoice"]): string {
    const p = invoice.paymentMeans;
    const accountXml = p.iban
      ? `    <cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(p.iban)}</cbc:ID>
${p.accountName ? `      <cbc:Name>${escapeXml(p.accountName)}</cbc:Name>\n` : ""}${p.bic ? `      <cac:FinancialInstitutionBranch><cbc:ID>${escapeXml(p.bic)}</cbc:ID></cac:FinancialInstitutionBranch>\n` : ""}    </cac:PayeeFinancialAccount>`
      : "";
    return `  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${p.code}</cbc:PaymentMeansCode>
${p.paymentReference ? `    <cbc:PaymentID>${escapeXml(p.paymentReference)}</cbc:PaymentID>\n` : ""}${accountXml}
  </cac:PaymentMeans>`;
  }

  private buildPaymentTerms(terms?: string): string {
    if (!terms) return "";
    return `  <cac:PaymentTerms>
    <cbc:Note>${escapeXml(terms)}</cbc:Note>
  </cac:PaymentTerms>`;
  }

  // ---------- Tax Total ----------
  private groupTaxSubtotals(
    lines: InvoiceLine[]
  ): Map<
    string,
    {
      category: VatCategoryCode;
      percent: Money;
      taxableAmount: Money;
      taxAmount: Money;
    }
  > {
    const map = new Map<
      string,
      {
        category: VatCategoryCode;
        percent: Money;
        taxableAmount: Money;
        taxAmount: Money;
      }
    >();
    for (const line of lines) {
      const key = `${line.vatCategory}:${line.vatRate.toFixed2()}`;
      const current = map.get(key);
      const added = line.netAmount;
      const tax = added.times(line.vatRate).div(100);
      if (current) {
        current.taxableAmount = current.taxableAmount.plus(added);
        current.taxAmount = current.taxAmount.plus(tax);
      } else {
        map.set(key, {
          category: line.vatCategory,
          percent: line.vatRate,
          taxableAmount: added,
          taxAmount: tax,
        });
      }
    }
    return map;
  }

  private buildTaxTotal(
    total: Money,
    subtotals: ReturnType<XRechnungBuilder["groupTaxSubtotals"]>
  ): string {
    const subtotalsXml: string[] = [];
    for (const s of subtotals.values()) {
      subtotalsXml.push(`    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${CURRENCY}">${s.taxableAmount.toFixed2()}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${CURRENCY}">${s.taxAmount.toFixed2()}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${s.category}</cbc:ID>
        <cbc:Percent>${s.percent.toFixed2()}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`);
    }
    return `  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${CURRENCY}">${total.toFixed2()}</cbc:TaxAmount>
${subtotalsXml.join("\n")}
  </cac:TaxTotal>`;
  }

  // ---------- Monetary Total ----------
  private buildMonetaryTotal(
    lineNet: Money,
    taxTotal: Money,
    gross: Money
  ): string {
    return `  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${CURRENCY}">${lineNet.toFixed2()}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${CURRENCY}">${lineNet.toFixed2()}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${CURRENCY}">${gross.toFixed2()}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${CURRENCY}">${gross.toFixed2()}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  }

  // ---------- Invoice Line ----------
  private buildInvoiceLine(line: InvoiceLine): string {
    return `  <cac:InvoiceLine>
    <cbc:ID>${escapeXml(line.lineId)}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${escapeXml(line.unitCode)}">${line.quantity.toFixed2()}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${CURRENCY}">${line.netAmount.toFixed2()}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(line.description)}</cbc:Name>
${line.articleNumber ? `      <cac:SellersItemIdentification><cbc:ID>${escapeXml(line.articleNumber)}</cbc:ID></cac:SellersItemIdentification>\n` : ""}      <cac:ClassifiedTaxCategory>
        <cbc:ID>${line.vatCategory}</cbc:ID>
        <cbc:Percent>${line.vatRate.toFixed2()}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${CURRENCY}">${line.netUnitPrice.toFixed2()}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }
}
