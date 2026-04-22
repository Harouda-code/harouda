// Writer für ausgehende E-Rechnungen im CII-Format (XRechnung-Profil).
//
// Das Ziel ist ein Dokument, das beim Empfänger mit einem konformen
// Reader (inkl. unserem eigenen Reader in utils/zugferd.ts) die Kopfdaten,
// Parteien, Positionen und Summen korrekt wiedergibt.
//
// Enthält die Kernfelder der EN 16931 in einer minimalen, aber gültigen
// Struktur. Für eine voll-konforme XRechnung 3.x-Abgabe an Behörden wird
// zusätzlich eine XSD-Validierung gegen das offizielle Schema empfohlen.

export type XInvoiceParty = {
  name: string;
  anschrift_strasse?: string;
  anschrift_plz?: string;
  anschrift_ort?: string;
  anschrift_land?: string; // ISO 3166-1 alpha-2
  ust_id?: string;
  steuernummer?: string;
  email?: string;
  telefon?: string;
};

export type XInvoiceLine = {
  nr: string; // laufende Positionsnummer
  beschreibung: string;
  menge: number;
  einheit: string; // UN/ECE Rec. 20 Code, z. B. "H87" = Stück, "KGM" = kg
  einzelpreis_netto: number;
  ust_satz: number; // in % (19, 7, 0)
  ust_kategorie?: "S" | "Z" | "E"; // S=Standard, Z=Null, E=Steuerbefreit
};

export type XInvoice = {
  rechnungsnummer: string;
  rechnungsdatum: string; // YYYY-MM-DD
  leistungsdatum?: string; // YYYY-MM-DD (optional)
  faelligkeitsdatum: string; // YYYY-MM-DD
  waehrung: string; // ISO 4217, meist "EUR"

  verkaeufer: XInvoiceParty;
  kaeufer: XInvoiceParty;
  /** Leitweg-ID oder Kundenreferenz (Pflichtfeld in XRechnung) */
  kaeufer_referenz: string;

  positionen: XInvoiceLine[];

  /** Optional: IBAN/BIC für Zahlungsinformation */
  iban?: string;
  bic?: string;
  kontoinhaber?: string;

  /** Zahlungsbedingungen als Freitext */
  zahlungsbedingungen?: string;
};

export type XInvoiceSummary = {
  netto_gesamt: number;
  ust_gesamt: number;
  brutto_gesamt: number;
  ust_gruppen: {
    kategorie: "S" | "Z" | "E";
    satz: number;
    netto: number;
    ust: number;
  }[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function summarize(inv: XInvoice): XInvoiceSummary {
  const groups = new Map<string, { kategorie: "S" | "Z" | "E"; satz: number; netto: number; ust: number }>();
  for (const p of inv.positionen) {
    const netto = p.menge * p.einzelpreis_netto;
    const ust = netto * (p.ust_satz / 100);
    const kategorie: "S" | "Z" | "E" =
      p.ust_kategorie ?? (p.ust_satz === 0 ? "Z" : "S");
    const key = `${kategorie}-${p.ust_satz}`;
    const prev = groups.get(key);
    if (prev) {
      prev.netto = round2(prev.netto + netto);
      prev.ust = round2(prev.ust + ust);
    } else {
      groups.set(key, {
        kategorie,
        satz: p.ust_satz,
        netto: round2(netto),
        ust: round2(ust),
      });
    }
  }
  const netto_gesamt = round2(
    Array.from(groups.values()).reduce((s, g) => s + g.netto, 0)
  );
  const ust_gesamt = round2(
    Array.from(groups.values()).reduce((s, g) => s + g.ust, 0)
  );
  return {
    netto_gesamt,
    ust_gesamt,
    brutto_gesamt: round2(netto_gesamt + ust_gesamt),
    ust_gruppen: Array.from(groups.values()).sort(
      (a, b) => a.satz - b.satz
    ),
  };
}

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addressBlock(p: XInvoiceParty, indent: string): string {
  const lines: string[] = [];
  lines.push(`${indent}<ram:PostalTradeAddress>`);
  if (p.anschrift_plz)
    lines.push(`${indent}  <ram:PostcodeCode>${xml(p.anschrift_plz)}</ram:PostcodeCode>`);
  if (p.anschrift_strasse)
    lines.push(`${indent}  <ram:LineOne>${xml(p.anschrift_strasse)}</ram:LineOne>`);
  if (p.anschrift_ort)
    lines.push(`${indent}  <ram:CityName>${xml(p.anschrift_ort)}</ram:CityName>`);
  lines.push(
    `${indent}  <ram:CountryID>${xml(p.anschrift_land ?? "DE")}</ram:CountryID>`
  );
  lines.push(`${indent}</ram:PostalTradeAddress>`);
  return lines.join("\n");
}

function partyBlock(
  p: XInvoiceParty,
  role: "Seller" | "Buyer",
  indent: string
): string {
  const out: string[] = [];
  out.push(`${indent}<ram:${role}TradeParty>`);
  out.push(`${indent}  <ram:Name>${xml(p.name)}</ram:Name>`);
  out.push(addressBlock(p, `${indent}  `));
  if (p.ust_id) {
    out.push(`${indent}  <ram:SpecifiedTaxRegistration>`);
    out.push(`${indent}    <ram:ID schemeID="VA">${xml(p.ust_id)}</ram:ID>`);
    out.push(`${indent}  </ram:SpecifiedTaxRegistration>`);
  }
  if (p.steuernummer) {
    out.push(`${indent}  <ram:SpecifiedTaxRegistration>`);
    out.push(`${indent}    <ram:ID schemeID="FC">${xml(p.steuernummer)}</ram:ID>`);
    out.push(`${indent}  </ram:SpecifiedTaxRegistration>`);
  }
  out.push(`${indent}</ram:${role}TradeParty>`);
  return out.join("\n");
}

function dateBlock(iso: string): string {
  const compact = iso.replace(/-/g, "");
  return `<udt:DateTimeString format="102">${compact}</udt:DateTimeString>`;
}

export function buildXInvoiceXml(inv: XInvoice): string {
  const sum = summarize(inv);

  const lines = inv.positionen
    .map((p, i) => {
      const netto = round2(p.menge * p.einzelpreis_netto);
      const kategorie =
        p.ust_kategorie ?? (p.ust_satz === 0 ? "Z" : "S");
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${xml(p.nr || String(i + 1))}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${xml(p.beschreibung)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${p.einzelpreis_netto.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${xml(p.einheit || "H87")}">${p.menge}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${kategorie}</ram:CategoryCode>
          <ram:RateApplicablePercent>${p.ust_satz}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${netto.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  const taxBlocks = sum.ust_gruppen
    .map(
      (g) => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${g.ust.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${g.netto.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${g.kategorie}</ram:CategoryCode>
        <ram:RateApplicablePercent>${g.satz}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`
    )
    .join("");

  const paymentInfo =
    inv.iban || inv.bic
      ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:Information>${xml(inv.zahlungsbedingungen ?? "SEPA-Überweisung")}</ram:Information>
        <ram:PayeePartyCreditorFinancialAccount>
          ${inv.iban ? `<ram:IBANID>${xml(inv.iban.replace(/\s+/g, ""))}</ram:IBANID>` : ""}
          ${inv.kontoinhaber ? `<ram:AccountName>${xml(inv.kontoinhaber)}</ram:AccountName>` : ""}
        </ram:PayeePartyCreditorFinancialAccount>
        ${
          inv.bic
            ? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${xml(inv.bic)}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>`
            : ""
        }
      </ram:SpecifiedTradeSettlementPaymentMeans>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Erzeugt von harouda-app. Profil: XRechnung (CII). -->
<!-- Hinweis: Diese Datei ist am öffentlichen Schema orientiert; für behördliche Abgabe empfehlen wir XSD-Validierung. -->
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${xml(inv.rechnungsnummer)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>${dateBlock(inv.rechnungsdatum)}</ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>${lines}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${xml(inv.kaeufer_referenz)}</ram:BuyerReference>
${partyBlock(inv.verkaeufer, "Seller", "      ")}
${partyBlock(inv.kaeufer, "Buyer", "      ")}
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery>
      ${
        inv.leistungsdatum
          ? `<ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>${dateBlock(inv.leistungsdatum)}</ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>`
          : ""
      }
    </ram:ApplicableHeaderTradeDelivery>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${xml(inv.waehrung)}</ram:InvoiceCurrencyCode>
${paymentInfo}
${taxBlocks}

      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${xml(inv.zahlungsbedingungen ?? `Zahlbar ohne Abzug bis ${inv.faelligkeitsdatum}`)}</ram:Description>
        <ram:DueDateDateTime>${dateBlock(inv.faelligkeitsdatum)}</ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>

      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${sum.netto_gesamt.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${sum.netto_gesamt.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${xml(inv.waehrung)}">${sum.ust_gesamt.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${sum.brutto_gesamt.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${sum.brutto_gesamt.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
