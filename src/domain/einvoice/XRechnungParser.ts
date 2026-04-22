/**
 * XRechnung/UBL-Parser: extrahiert strukturierte Invoice-Daten aus einem
 * UBL-2.1-XML.
 *
 * Implementation verwendet eine namensraum-unabhängige DOM-Traversierung
 * via `localName` (nicht `querySelector`), damit UBL-Default-Namespace
 * (`xmlns="urn:oasis:…"`) korrekt aufgelöst wird — CSS-Selektoren können
 * mit default-XML-Namespaces nicht zuverlässig umgehen.
 *
 * CII-Format (altes ZUGFeRD) wird derzeit NICHT unterstützt.
 */

import { Money } from "../../lib/money/Money";
import type {
  InvoiceLine,
  ParsedInvoice,
  Party,
  VatCategoryCode,
  InvoiceTypeCode,
} from "./types";

/** Liefert erstes direktes Child-Element mit passendem `localName`. */
function childByName(parent: Element | null, name: string): Element | null {
  if (!parent) return null;
  for (const child of Array.from(parent.children)) {
    if (child.localName === name) return child;
  }
  return null;
}

/** Liefert alle direkten Children mit passendem localName. */
function childrenByName(parent: Element | null, name: string): Element[] {
  if (!parent) return [];
  return Array.from(parent.children).filter((c) => c.localName === name);
}

/** Liefert ERSTES Descendant-Element mit passendem localName (rekursiv). */
function firstDescendantByName(
  parent: Element | null,
  name: string
): Element | null {
  if (!parent) return null;
  for (const child of Array.from(parent.children)) {
    if (child.localName === name) return child;
    const found = firstDescendantByName(child, name);
    if (found) return found;
  }
  return null;
}

/** Alle Descendants mit localName — stoppt NICHT bei erstem Match,
 *  auch wenn der Match selbst weitere gleichnamige Children enthielte
 *  (für unsere Fälle ausreichend: Invoice-Lines sind nicht verschachtelt). */
function descendantsByName(parent: Element, name: string): Element[] {
  const out: Element[] = [];
  function walk(el: Element) {
    for (const child of Array.from(el.children)) {
      if (child.localName === name) out.push(child);
      else walk(child);
    }
  }
  walk(parent);
  return out;
}

function textOfChild(parent: Element | null, name: string): string {
  const el = childByName(parent, name);
  return el?.textContent?.trim() ?? "";
}

function textOfDescendant(parent: Element | null, name: string): string {
  const el = firstDescendantByName(parent, name);
  return el?.textContent?.trim() ?? "";
}

function moneyFromText(s: string): Money {
  if (!s) return Money.zero();
  try {
    return new Money(s);
  } catch {
    return Money.zero();
  }
}

function parseAddress(partyEl: Element | null) {
  const addr = firstDescendantByName(partyEl, "PostalAddress");
  const country = firstDescendantByName(addr, "IdentificationCode");
  return {
    street: textOfChild(addr, "StreetName"),
    additionalStreet: textOfChild(addr, "AdditionalStreetName") || undefined,
    city: textOfChild(addr, "CityName"),
    postalZone: textOfChild(addr, "PostalZone"),
    countryCode: country?.textContent?.trim() ?? "",
  };
}

function parseParty(partyEl: Element | null): Party {
  const partyName = firstDescendantByName(partyEl, "PartyName");
  const legalEntity = firstDescendantByName(partyEl, "PartyLegalEntity");
  const name =
    textOfChild(partyName, "Name") ||
    textOfChild(legalEntity, "RegistrationName");
  const endpoint = firstDescendantByName(partyEl, "EndpointID");
  const taxScheme = firstDescendantByName(partyEl, "PartyTaxScheme");
  const contact = firstDescendantByName(partyEl, "Contact");

  return {
    name,
    legalName: textOfChild(legalEntity, "RegistrationName") || undefined,
    endpointId: endpoint?.textContent?.trim() || undefined,
    endpointScheme:
      (endpoint?.getAttribute("schemeID") as
        | "EM"
        | "0204"
        | "9930"
        | "0088"
        | undefined) || undefined,
    address: parseAddress(partyEl),
    tax: {
      companyId: textOfChild(taxScheme, "CompanyID"),
      scheme:
        (textOfDescendant(taxScheme, "ID") as "VAT" | "FC") || "VAT",
    },
    registration: legalEntity
      ? {
          registrationName: textOfChild(legalEntity, "RegistrationName"),
          registrationNumber: textOfChild(legalEntity, "CompanyID"),
        }
      : undefined,
    contact: contact
      ? {
          name: textOfChild(contact, "Name") || undefined,
          email: textOfChild(contact, "ElectronicMail") || undefined,
          phone: textOfChild(contact, "Telephone") || undefined,
        }
      : undefined,
  };
}

function parseLine(el: Element): InvoiceLine {
  const lineId = textOfChild(el, "ID");
  const item = childByName(el, "Item");
  const description = textOfChild(item, "Name");
  const quantityEl = childByName(el, "InvoicedQuantity");
  const quantity = moneyFromText(quantityEl?.textContent?.trim() ?? "0");
  const unitCode = quantityEl?.getAttribute("unitCode") ?? "C62";
  const netAmount = moneyFromText(textOfChild(el, "LineExtensionAmount"));
  const price = childByName(el, "Price");
  const netUnitPrice = moneyFromText(textOfChild(price, "PriceAmount"));
  const classified = firstDescendantByName(item, "ClassifiedTaxCategory");
  const vatCategory =
    (textOfChild(classified, "ID") as VatCategoryCode) || "S";
  const vatRate = moneyFromText(textOfChild(classified, "Percent"));
  const articleNumber =
    textOfDescendant(item, "SellersItemIdentification") || undefined;
  return {
    lineId: lineId || "1",
    description,
    quantity,
    unitCode,
    netUnitPrice,
    netAmount,
    vatRate,
    vatCategory,
    articleNumber,
  };
}

function detectFormat(customizationId: string): "XRECHNUNG" | "UBL" | "CII" {
  if (customizationId.toLowerCase().includes("xrechnung")) return "XRECHNUNG";
  return "UBL";
}

export function parseXRechnung(xml: string): ParsedInvoice {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // Root = documentElement wenn localName="Invoice", sonst im Baum suchen.
  const root =
    doc.documentElement && doc.documentElement.localName === "Invoice"
      ? doc.documentElement
      : doc.documentElement
        ? firstDescendantByName(doc.documentElement, "Invoice")
        : null;
  if (!root) {
    throw new Error("Kein <Invoice>-Root gefunden — ungültige UBL-Datei.");
  }

  const customizationId = textOfChild(root, "CustomizationID");
  const format = detectFormat(customizationId);

  const supplierContainer = firstDescendantByName(
    root,
    "AccountingSupplierParty"
  );
  const customerContainer = firstDescendantByName(
    root,
    "AccountingCustomerParty"
  );
  const supplierParty = firstDescendantByName(supplierContainer, "Party");
  const customerParty = firstDescendantByName(customerContainer, "Party");

  const supplier = parseParty(supplierParty);
  const customer = parseParty(customerParty);

  const lineElements = descendantsByName(root, "InvoiceLine");
  const lines = lineElements.map(parseLine);

  const legalTotal = firstDescendantByName(root, "LegalMonetaryTotal");
  const taxTotal = firstDescendantByName(root, "TaxTotal");

  const totalNet = moneyFromText(textOfChild(legalTotal, "TaxExclusiveAmount"));
  const totalVat = moneyFromText(textOfChild(taxTotal, "TaxAmount"));
  const totalGross = moneyFromText(
    textOfChild(legalTotal, "TaxInclusiveAmount")
  );
  const payable = moneyFromText(textOfChild(legalTotal, "PayableAmount"));

  const notes = childrenByName(root, "Note")
    .map((n) => n.textContent?.trim() ?? "")
    .filter((x) => x.length > 0);

  const profile = customizationId.includes("xrechnung_3.0")
    ? "XRechnung 3.0"
    : customizationId || undefined;

  return {
    format,
    profile,
    invoiceNumber: textOfChild(root, "ID"),
    issueDate: textOfChild(root, "IssueDate"),
    dueDate: textOfChild(root, "DueDate"),
    currency: textOfChild(root, "DocumentCurrencyCode") || "EUR",
    supplier,
    customer,
    lines,
    totalNet,
    totalVat,
    totalGross,
    payable,
    notes,
  };
}

export function invoiceTypeName(code: string): string {
  const names: Record<InvoiceTypeCode, string> = {
    "380": "Handelsrechnung",
    "381": "Gutschrift",
    "384": "Rechnungskorrektur",
    "389": "Selbstabgerechnete Rechnung",
    "326": "Teilrechnung",
  };
  return names[code as InvoiceTypeCode] ?? `Code ${code}`;
}
