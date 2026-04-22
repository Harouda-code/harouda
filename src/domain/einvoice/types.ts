/**
 * Typen für E-Rechnungen (XRechnung UBL 2.1 / ZUGFeRD 2.3).
 *
 * BT-Nummern referenzieren EN 16931 Business Terms.
 */

import type { Money } from "../../lib/money/Money";

export type InvoiceTypeCode = "380" | "381" | "384" | "389" | "326";

export type VatCategoryCode = "S" | "Z" | "E" | "AE" | "K" | "G" | "O";

export type PaymentMeansCode = "58" | "30" | "48" | "1";

export type EndpointSchemeId = "EM" | "0204" | "9930" | "0088";

export type TaxSchemeId = "VAT" | "FC";

export type PartyAddress = {
  street: string;
  additionalStreet?: string;
  city: string;
  postalZone: string;
  /** ISO 3166-1 alpha-2 (DE, AT, FR, …). */
  countryCode: string;
};

export type PartyContact = {
  name?: string;
  email?: string;
  phone?: string;
};

export type Party = {
  /** BT-27/BT-44 Party name */
  name: string;
  /** BT-28/BT-45 legal registration name */
  legalName?: string;
  /** BT-49 Buyer Endpoint / BT-34 Seller Endpoint (z. B. Leitweg-ID, Peppol ID, Email). */
  endpointId?: string;
  endpointScheme?: EndpointSchemeId;
  address: PartyAddress;
  tax: {
    /** BT-31/BT-48: USt-IdNr; BT-32: nationale Steuernummer. */
    companyId: string;
    scheme: TaxSchemeId;
  };
  contact?: PartyContact;
  registration?: {
    registrationName: string; // z. B. "Amtsgericht München"
    registrationNumber: string; // z. B. "HRB 12345"
  };
};

export type InvoiceLine = {
  /** BT-126 Line ID. */
  lineId: string;
  /** BT-154 Item name. */
  description: string;
  /** BT-129 Invoiced quantity. */
  quantity: Money;
  /** BT-130 UN/ECE Rec 20 unit code (C62 = piece, HUR = hour, KGM = kg, MTR = m). */
  unitCode: string;
  /** BT-146 Net unit price. */
  netUnitPrice: Money;
  /** BT-131 Line net amount (quantity × unitPrice − allowances + charges). */
  netAmount: Money;
  /** BT-152 VAT percent (19, 7, 0). */
  vatRate: Money;
  /** BT-151 VAT category code. */
  vatCategory: VatCategoryCode;
  /** Optional Artikel-Nr. */
  articleNumber?: string;
};

export type PaymentMeans = {
  /** BT-81 Code. */
  code: PaymentMeansCode;
  iban?: string;
  bic?: string;
  accountName?: string;
  /** BT-83 remittance info. */
  paymentReference?: string;
};

export type InvoiceData = {
  /** BT-1 Invoice number (fortlaufend). */
  invoiceNumber: string;
  /** BT-2 Issue date YYYY-MM-DD. */
  issueDate: string;
  /** BT-9 Due date YYYY-MM-DD. */
  dueDate: string;
  /** BT-5 Document currency. */
  currency: "EUR";
  /** BT-3 Invoice type code. */
  type: InvoiceTypeCode;
  /** BT-10 Buyer reference (optional Leitweg-ID Behörden). */
  buyerReference?: string;
  /** BT-13 Purchase order reference. */
  orderReference?: string;
  /** BT-22 Invoice note(s). */
  notes?: string[];
  /** BG-25 Invoice lines. */
  lines: InvoiceLine[];
  /** BG-16 Payment means. */
  paymentMeans: PaymentMeans;
  /** BT-20 Payment terms (Text). */
  paymentTerms?: string;
  /** BT-72 Actual delivery date (optional). */
  deliveryDate?: string;
};

export type XRechnungProfile = "XRECHNUNG_3_0";
export type ZugferdProfile =
  | "MINIMUM"
  | "BASIC"
  | "EN16931"
  | "EXTENDED"
  | "XRECHNUNG";

export type XRechnungOptions = {
  invoice: InvoiceData;
  seller: Party;
  buyer: Party;
  profileId?: XRechnungProfile;
};

export type ValidationSeverity = "ERROR" | "WARNING";

export type EInvoiceValidationEntry = {
  /** BR-Code (BR-01, BR-CO-10, BR-DE-1 etc.) */
  rule: string;
  field?: string;
  message: string;
  severity: ValidationSeverity;
};

export type EInvoiceValidationResult = {
  isValid: boolean;
  spec: "XRECHNUNG_3_0" | "EN_16931";
  errors: EInvoiceValidationEntry[];
  warnings: EInvoiceValidationEntry[];
};

export type ParsedInvoice = {
  format: "XRECHNUNG" | "UBL" | "CII";
  profile?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  supplier: Party;
  customer: Party;
  lines: InvoiceLine[];
  totalNet: Money;
  totalVat: Money;
  totalGross: Money;
  payable: Money;
  notes: string[];
};
