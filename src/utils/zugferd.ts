// Parser for ZUGFeRD / Factur-X / XRechnung e-invoices.
//
// ZUGFeRD embeds a Cross Industry Invoice (CII) XML as an attached file
// inside a PDF/A-3. Typical filenames: "factur-x.xml" (ZUGFeRD 2.1+),
// "zugferd-invoice.xml" (ZUGFeRD 1.x), "xrechnung.xml". XRechnung files
// without a PDF container are also common; we support both.
//
// From 2025 on, B2B invoices in Germany must be issued in a structured
// electronic format (§ 14 UStG, Wachstumschancengesetz). Readers must
// handle at least the CII UBL envelope.

export type ZugferdParty = {
  name: string;
  vatId?: string;
  taxId?: string;
  address?: string;
};

export type ZugferdLine = {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  netAmount: number;
  taxPct?: number;
};

export type ZugferdInvoice = {
  invoiceNumber: string;
  issueDate: string; // ISO YYYY-MM-DD
  dueDate: string | null;
  seller: ZugferdParty;
  buyer: ZugferdParty;
  currency: string;
  lines: ZugferdLine[];
  netTotal: number;
  taxTotal: number;
  grandTotal: number;
  profile: string; // ZUGFeRD profile (BASIC, EN 16931, EXTENDED) if detectable
  rawXml: string;
};

/**
 * Extracts the embedded CII/UBL XML from a ZUGFeRD PDF. Falls back to
 * reading the file as text if it's already pure XML (XRechnung).
 */
export async function extractInvoiceXml(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    const txt = await file.text();
    if (txt.trimStart().startsWith("<")) return txt;
    throw new Error("Datei ist weder PDF noch XML.");
  }

  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const attachments = (await pdf.getAttachments()) as
    | Record<string, { content: Uint8Array; filename?: string }>
    | null;
  if (!attachments || Object.keys(attachments).length === 0) {
    throw new Error(
      "PDF enthält keine eingebetteten Dateien (kein ZUGFeRD/Factur-X?)."
    );
  }
  const preferredNames = [
    "factur-x.xml",
    "zugferd-invoice.xml",
    "ZUGFeRD-invoice.xml",
    "xrechnung.xml",
  ];
  let picked: Uint8Array | null = null;
  for (const name of preferredNames) {
    const hit =
      attachments[name] ??
      Object.values(attachments).find((a) => a.filename === name);
    if (hit) {
      picked = hit.content;
      break;
    }
  }
  if (!picked) {
    // Last resort: first XML-looking attachment
    for (const a of Object.values(attachments)) {
      const text = new TextDecoder().decode(a.content);
      if (text.trimStart().startsWith("<")) {
        picked = a.content;
        break;
      }
    }
  }
  if (!picked) throw new Error("Kein XML-Anhang im PDF gefunden.");
  return new TextDecoder("utf-8").decode(picked);
}

function textOf(el: Element | null): string {
  return el ? (el.textContent ?? "").trim() : "";
}

function numberOf(s: string): number {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Namespace-agnostic: match any element by localName.
function qs(root: Element | Document, localName: string): Element | null {
  const list = root.getElementsByTagName("*");
  for (let i = 0; i < list.length; i++) {
    if (list[i].localName === localName) return list[i];
  }
  return null;
}

function qsAll(root: Element | Document, localName: string): Element[] {
  const out: Element[] = [];
  const list = root.getElementsByTagName("*");
  for (let i = 0; i < list.length; i++) {
    if (list[i].localName === localName) out.push(list[i]);
  }
  return out;
}

function childByLocalName(parent: Element, localName: string): Element | null {
  for (const ch of Array.from(parent.children)) {
    if (ch.localName === localName) return ch;
  }
  return null;
}

function parseParty(el: Element | null): ZugferdParty {
  if (!el) return { name: "" };
  const name = textOf(qs(el, "Name"));
  const vatEl = qsAll(el, "ID").find((e) => {
    const parent = e.parentElement;
    return parent?.localName === "SpecifiedTaxRegistration";
  });
  const vatId = vatEl ? textOf(vatEl) : undefined;
  const addrEl = qs(el, "PostalTradeAddress") ?? qs(el, "PostalAddress");
  let address: string | undefined;
  if (addrEl) {
    address = [
      textOf(qs(addrEl, "LineOne")) || textOf(qs(addrEl, "StreetName")),
      [
        textOf(qs(addrEl, "PostcodeCode")) || textOf(qs(addrEl, "PostalZone")),
        textOf(qs(addrEl, "CityName")),
      ]
        .filter(Boolean)
        .join(" "),
      textOf(qs(addrEl, "CountryID")) || textOf(qs(addrEl, "Country")),
    ]
      .filter(Boolean)
      .join(", ");
  }
  return { name, vatId, address };
}

/**
 * Parses a CII (Cross Industry Invoice) XML. Best-effort: the CII namespace
 * is huge, we only pull the fields that matter for a journal draft.
 */
export function parseZugferdXml(xml: string): ZugferdInvoice {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("XML konnte nicht geparst werden.");
  }

  const root = doc.documentElement;
  // Profile: CII has <GuidelineSpecifiedDocumentContextParameter><ID>
  const profile = textOf(
    qs(root, "GuidelineSpecifiedDocumentContextParameter")?.querySelector(
      "*"
    ) ?? null
  );

  const exchDocument = qs(root, "ExchangedDocument") ?? root;
  const invoiceNumber = textOf(qs(exchDocument, "ID"));
  const issueRaw =
    textOf(qs(qs(exchDocument, "IssueDateTime") ?? exchDocument, "DateTimeString")) ||
    textOf(qs(exchDocument, "IssueDate"));
  const issueDate = formatCiiDate(issueRaw);

  const trade = qs(root, "SupplyChainTradeTransaction") ?? root;
  const agreement =
    qs(trade, "ApplicableHeaderTradeAgreement") ??
    qs(trade, "ApplicableSupplyChainTradeAgreement");
  const seller = parseParty(
    agreement ? qs(agreement, "SellerTradeParty") : null
  );
  const buyer = parseParty(
    agreement ? qs(agreement, "BuyerTradeParty") : null
  );

  const settlement =
    qs(trade, "ApplicableHeaderTradeSettlement") ??
    qs(trade, "ApplicableSupplyChainTradeSettlement");
  const currency =
    settlement?.getAttribute("InvoiceCurrencyCode") ||
    textOf(qs(settlement ?? root, "InvoiceCurrencyCode")) ||
    "EUR";

  const summation = settlement
    ? qs(settlement, "SpecifiedTradeSettlementHeaderMonetarySummation")
    : null;
  const netTotal = numberOf(textOf(qs(summation ?? root, "TaxBasisTotalAmount")));
  const taxTotal = numberOf(textOf(qs(summation ?? root, "TaxTotalAmount")));
  const grandTotal = numberOf(textOf(qs(summation ?? root, "GrandTotalAmount")));

  // Due date: <PaymentDueDateDateTime><DateTimeString>
  const payTerms = settlement ? qs(settlement, "SpecifiedTradePaymentTerms") : null;
  const dueRaw = payTerms
    ? textOf(
        qs(payTerms, "DueDateDateTime")?.querySelector("*") ??
          qs(payTerms, "DateTimeString")
      )
    : "";
  const dueDate = dueRaw ? formatCiiDate(dueRaw) : null;

  // Line items
  const lineEls = qsAll(trade, "IncludedSupplyChainTradeLineItem");
  const lines: ZugferdLine[] = lineEls.map((ln) => {
    const prod = qs(ln, "SpecifiedTradeProduct");
    const description = textOf(qs(prod ?? ln, "Name"));
    const delivery = qs(ln, "SpecifiedLineTradeDelivery");
    const qty = numberOf(textOf(qs(delivery ?? ln, "BilledQuantity")));
    const unit =
      qs(delivery ?? ln, "BilledQuantity")?.getAttribute("unitCode") ?? undefined;
    const settle = qs(ln, "SpecifiedLineTradeSettlement");
    const netAmount = numberOf(
      textOf(
        qs(settle ?? ln, "SpecifiedTradeSettlementLineMonetarySummation")
          ?.querySelector("*")?.parentElement?.querySelector("LineTotalAmount") ??
          qs(settle ?? ln, "LineTotalAmount")
      )
    );
    const agreementEl = qs(ln, "SpecifiedLineTradeAgreement");
    const priceEl = childByLocalName(
      agreementEl ?? ln,
      "NetPriceProductTradePrice"
    );
    const unitPrice = numberOf(
      textOf(priceEl ? qs(priceEl, "ChargeAmount") : null)
    );
    const taxEl = qs(settle ?? ln, "ApplicableTradeTax");
    const taxPct = taxEl
      ? numberOf(textOf(qs(taxEl, "RateApplicablePercent")))
      : undefined;
    return { description, quantity: qty, unit, unitPrice, netAmount, taxPct };
  });

  return {
    invoiceNumber,
    issueDate,
    dueDate,
    seller,
    buyer,
    currency,
    lines,
    netTotal,
    taxTotal,
    grandTotal,
    profile: profile || "unbekannt",
    rawXml: xml,
  };
}

function formatCiiDate(raw: string): string {
  // CII format commonly "102" (YYYYMMDD) or "610" (YYYYMM); UBL uses ISO
  const clean = raw.replace(/\D/g, "");
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

export async function readZugferd(file: File): Promise<ZugferdInvoice> {
  const xml = await extractInvoiceXml(file);
  return parseZugferdXml(xml);
}
