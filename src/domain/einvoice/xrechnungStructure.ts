/**
 * XRechnung 3.0 (01.02.2024) — UBL-2.1-basierter Structure-Katalog.
 *
 * XRechnung ist die deutsche CIUS (Core Invoice Usage Specification) auf
 * Basis von EN 16931. Für 2025+ ist die Version 3.0 maßgeblich.
 */

export const XRECHNUNG_3_0 = {
  specificationIdentifier:
    "urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0",

  namespaces: {
    ubl: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
  },
} as const;

export const INVOICE_TYPE_NAMES: Record<string, string> = {
  "380": "Handelsrechnung",
  "381": "Gutschrift",
  "384": "Rechnungskorrektur",
  "389": "Selbstabgerechnete Rechnung",
  "326": "Teilrechnung",
};

export const VAT_CATEGORY_NAMES: Record<string, string> = {
  S: "Standardsteuersatz",
  Z: "Zero-rated",
  E: "Steuerbefreit (§ 4 UStG)",
  AE: "Reverse Charge (§ 13b UStG)",
  K: "Innergemeinschaftliche Lieferung (§ 6a UStG)",
  G: "Ausfuhrlieferung außerhalb EU",
  O: "Nicht steuerbar",
};

export const PAYMENT_MEANS_NAMES: Record<string, string> = {
  "58": "SEPA-Überweisung",
  "30": "Credit transfer",
  "48": "Kreditkarte",
  "1": "Nicht spezifiziert",
};

/** BT-Feld-Referenz für Dokumentation / UI-Tooltips. */
export const BT_FIELDS = [
  { id: "BT-1", name: "Rechnungsnummer", required: true },
  { id: "BT-2", name: "Rechnungsdatum", required: true },
  { id: "BT-3", name: "Rechnungsart (Code)", required: true },
  { id: "BT-5", name: "Rechnungswährung", required: true },
  { id: "BT-9", name: "Fälligkeitsdatum", required: true },
  { id: "BT-10", name: "Buyer reference (Leitweg-ID)", required: false },
  { id: "BT-13", name: "Bestellreferenz", required: false },
  { id: "BT-22", name: "Rechnungs-Hinweis", required: false },
  { id: "BT-27", name: "Verkäufer Name", required: true },
  { id: "BT-30", name: "Verkäufer Rechtsform / Registernummer", required: false },
  { id: "BT-31", name: "Verkäufer USt-IdNr", required: false },
  { id: "BT-32", name: "Verkäufer Steuernummer", required: false },
  { id: "BT-34", name: "Verkäufer Endpoint ID", required: false },
  { id: "BT-44", name: "Käufer Name", required: true },
  { id: "BT-48", name: "Käufer USt-IdNr", required: false },
  { id: "BT-49", name: "Käufer Leitweg-ID (B2G Pflicht)", required: false },
  { id: "BT-72", name: "Leistungsdatum", required: false },
  { id: "BT-81", name: "Zahlungsart-Code", required: true },
  { id: "BT-84", name: "Empfänger-IBAN", required: false },
  { id: "BT-109", name: "Summe Nettobeträge (Lines)", required: true },
  { id: "BT-110", name: "Summe USt", required: true },
  { id: "BT-112", name: "Gesamtbetrag brutto", required: true },
  { id: "BT-115", name: "Zu zahlender Betrag", required: true },
  { id: "BT-126", name: "Line ID", required: true },
  { id: "BT-129", name: "Line Menge", required: true },
  { id: "BT-130", name: "Einheit-Code", required: true },
  { id: "BT-131", name: "Line Nettobetrag", required: true },
  { id: "BT-151", name: "Line VAT-Kategorie", required: true },
  { id: "BT-152", name: "Line VAT-Prozent", required: false },
  { id: "BT-154", name: "Line Bezeichnung", required: true },
] as const;
