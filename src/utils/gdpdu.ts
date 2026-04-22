// GDPdU / IDEA export
//
// Generates a ZIP bundle that a Betriebsprüfer can load into IDEA or an
// equivalent audit tool. Format follows the GDPdU "Beschreibungsstandard"
// (DTD gdpdu-01-09-2002.dtd): an `index.xml` describes each data file as
// a <Table> with <VariableColumn> definitions.
//
// Written to be maximally compatible — ISO-8859-1 encoding, CRLF records,
// '"' text encapsulator, ',' column delimiter, '.' decimal point.

import { store } from "../api/store";

function csvField(v: unknown): string {
  const s = String(v ?? "");
  if (/["\r\n,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(fields: unknown[]): string {
  return fields.map(csvField).join(",") + "\r\n";
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toIsoDateYYYYMMDD(iso: string): string {
  // YYYY-MM-DD → YYYYMMDD
  if (!iso) return "";
  return iso.slice(0, 10).replace(/-/g, "");
}

type ColumnType = "AlphaNumeric" | "Numeric" | "Date";

type ColumnSpec = {
  name: string;
  description: string;
  type: ColumnType;
  /** For Numeric: scale (Nachkommastellen). Default 2. */
  scale?: number;
};

type TableSpec = {
  url: string;
  name: string;
  description: string;
  columns: ColumnSpec[];
};

const TABLES: TableSpec[] = [
  {
    url: "journal.csv",
    name: "Journalbuchungen",
    description: "Buchungsstapel mit Soll/Haben-Konten, Betrag, USt, Skonto.",
    columns: [
      { name: "ID", description: "Eindeutige ID", type: "AlphaNumeric" },
      { name: "Datum", description: "Buchungsdatum", type: "Date" },
      { name: "BelegNr", description: "Belegnummer", type: "AlphaNumeric" },
      { name: "Beschreibung", description: "Buchungstext", type: "AlphaNumeric" },
      { name: "Soll", description: "Soll-Konto", type: "AlphaNumeric" },
      { name: "Haben", description: "Haben-Konto", type: "AlphaNumeric" },
      { name: "Betrag", description: "Bruttobetrag in EUR", type: "Numeric", scale: 2 },
      { name: "USt", description: "Umsatzsteuersatz in Prozent", type: "Numeric", scale: 0 },
      { name: "Status", description: "gebucht oder entwurf", type: "AlphaNumeric" },
      { name: "MandantID", description: "Referenz auf mandanten.csv", type: "AlphaNumeric" },
      { name: "SkontoPct", description: "Skonto-Satz in Prozent", type: "Numeric", scale: 2 },
      { name: "SkontoTage", description: "Skonto-Frist in Tagen", type: "Numeric", scale: 0 },
      { name: "Erstellt", description: "Anlagezeitpunkt", type: "AlphaNumeric" },
      { name: "Geaendert", description: "Letzte Änderung", type: "AlphaNumeric" },
      { name: "Version", description: "Versionsnummer", type: "Numeric", scale: 0 },
    ],
  },
  {
    url: "konten.csv",
    name: "Kontenplan",
    description: "Verwendeter Kontenrahmen (SKR03/SKR04).",
    columns: [
      { name: "ID", description: "Eindeutige ID", type: "AlphaNumeric" },
      { name: "KontoNr", description: "Kontonummer", type: "AlphaNumeric" },
      { name: "Bezeichnung", description: "Bezeichnung", type: "AlphaNumeric" },
      { name: "Kategorie", description: "aktiva/passiva/aufwand/ertrag", type: "AlphaNumeric" },
      { name: "UstSatz", description: "USt-Satz in %", type: "Numeric", scale: 0 },
      { name: "SKR", description: "Kontenrahmen", type: "AlphaNumeric" },
      { name: "Aktiv", description: "1 = aktiv, 0 = inaktiv", type: "Numeric", scale: 0 },
    ],
  },
  {
    url: "mandanten.csv",
    name: "Mandanten",
    description: "Kundenstammdaten.",
    columns: [
      { name: "ID", description: "Eindeutige ID", type: "AlphaNumeric" },
      { name: "MandantNr", description: "Mandanten-Nummer", type: "AlphaNumeric" },
      { name: "Name", description: "Firma oder Name", type: "AlphaNumeric" },
      { name: "Steuernummer", description: "Steuernummer", type: "AlphaNumeric" },
      { name: "UstId", description: "Umsatzsteuer-Identifikationsnummer", type: "AlphaNumeric" },
      { name: "IBAN", description: "IBAN", type: "AlphaNumeric" },
    ],
  },
  {
    url: "belege.csv",
    name: "Belege",
    description: "Hochgeladene Belege und deren Verknüpfung mit Buchungen.",
    columns: [
      { name: "ID", description: "Eindeutige ID", type: "AlphaNumeric" },
      { name: "Dateiname", description: "Originaler Dateiname", type: "AlphaNumeric" },
      { name: "MIME", description: "MIME-Typ", type: "AlphaNumeric" },
      { name: "Groesse", description: "Größe in Bytes", type: "Numeric", scale: 0 },
      { name: "BelegNr", description: "Belegnummer", type: "AlphaNumeric" },
      { name: "BuchungID", description: "Referenz auf journal.csv", type: "AlphaNumeric" },
      { name: "Hochgeladen", description: "Upload-Zeitpunkt", type: "AlphaNumeric" },
    ],
  },
  {
    url: "audit.csv",
    name: "AuditLog",
    description: "Hash-verkettete Änderungsprotokolle.",
    columns: [
      { name: "ID", description: "Eindeutige ID", type: "AlphaNumeric" },
      { name: "Zeitpunkt", description: "Zeitpunkt (ISO 8601)", type: "AlphaNumeric" },
      { name: "Akteur", description: "Nutzer", type: "AlphaNumeric" },
      { name: "Aktion", description: "create/update/delete", type: "AlphaNumeric" },
      { name: "Entity", description: "Objekt-Typ", type: "AlphaNumeric" },
      { name: "EntityID", description: "Objekt-ID", type: "AlphaNumeric" },
      { name: "Beschreibung", description: "Kurzbeschreibung", type: "AlphaNumeric" },
      { name: "PrevHash", description: "SHA-256 des vorigen Eintrags", type: "AlphaNumeric" },
      { name: "Hash", description: "SHA-256 dieses Eintrags", type: "AlphaNumeric" },
    ],
  },
];

function buildIndexXml(
  supplier: { name: string; location: string }
): string {
  const tables = TABLES.map((t) => {
    const cols = t.columns
      .map((c) => {
        const typeEl =
          c.type === "Date"
            ? '<Date format="YYYYMMDD"/>'
            : c.type === "Numeric"
            ? `<Numeric><Accuracy>${c.scale ?? 2}</Accuracy></Numeric>`
            : "<AlphaNumeric/>";
        return [
          "      <VariableColumn>",
          `        <Name>${xmlEscape(c.name)}</Name>`,
          `        <Description>${xmlEscape(c.description)}</Description>`,
          `        ${typeEl}`,
          "      </VariableColumn>",
        ].join("\n");
      })
      .join("\n");

    return [
      "    <Table>",
      `      <URL>${xmlEscape(t.url)}</URL>`,
      `      <Name>${xmlEscape(t.name)}</Name>`,
      `      <Description>${xmlEscape(t.description)}</Description>`,
      "      <VariableLength>",
      "        <ColumnDelimiter>,</ColumnDelimiter>",
      "        <RecordDelimiter>\\r\\n</RecordDelimiter>",
      '        <TextEncapsulator>"</TextEncapsulator>',
      "        <DecimalSymbol>.</DecimalSymbol>",
      "        <DigitGroupingSymbol></DigitGroupingSymbol>",
      "        <ForeignKey/>",
      "      </VariableLength>",
      cols,
      "    </Table>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="ISO-8859-1"?>',
    '<!DOCTYPE DataSet SYSTEM "gdpdu-01-09-2002.dtd">',
    "<DataSet>",
    "  <Version>1.0</Version>",
    "  <DataSupplier>",
    `    <Name>${xmlEscape(supplier.name)}</Name>`,
    `    <Location>${xmlEscape(supplier.location)}</Location>`,
    "    <Comment>Export aus harouda-app</Comment>",
    "  </DataSupplier>",
    "  <Media>",
    "    <Name>Media_1</Name>",
    tables,
    "  </Media>",
    "</DataSet>",
  ].join("\n");
}

function buildJournalCsv(): string {
  const entries = store.getEntries();
  let out = "";
  for (const e of entries) {
    out += csvRow([
      e.id,
      toIsoDateYYYYMMDD(e.datum),
      e.beleg_nr,
      e.beschreibung,
      e.soll_konto,
      e.haben_konto,
      Number(e.betrag).toFixed(2),
      e.ust_satz ?? "",
      e.status,
      e.client_id ?? "",
      e.skonto_pct ?? "",
      e.skonto_tage ?? "",
      e.created_at ?? "",
      e.updated_at ?? "",
      e.version ?? 1,
    ]);
  }
  return out;
}

function buildKontenCsv(): string {
  let out = "";
  for (const a of store.getAccounts()) {
    out += csvRow([
      a.id,
      a.konto_nr,
      a.bezeichnung,
      a.kategorie,
      a.ust_satz ?? "",
      a.skr,
      a.is_active ? 1 : 0,
    ]);
  }
  return out;
}

function buildMandantenCsv(): string {
  let out = "";
  for (const c of store.getClients()) {
    out += csvRow([
      c.id,
      c.mandant_nr,
      c.name,
      c.steuernummer ?? "",
      c.ust_id ?? "",
      c.iban ?? "",
    ]);
  }
  return out;
}

function buildBelegeCsv(): string {
  let out = "";
  for (const d of store.getDocuments()) {
    out += csvRow([
      d.id,
      d.file_name,
      d.mime_type,
      d.size_bytes,
      d.beleg_nr ?? "",
      d.journal_entry_id ?? "",
      d.uploaded_at,
    ]);
  }
  return out;
}

function buildAuditCsv(): string {
  let out = "";
  for (const a of store.getAudit()) {
    out += csvRow([
      a.id,
      a.at,
      a.actor ?? "",
      a.action,
      a.entity,
      a.entity_id ?? "",
      a.summary,
      a.prev_hash,
      a.hash,
    ]);
  }
  return out;
}

export async function buildGdpduZip(
  supplier: { name: string; location: string }
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("index.xml", buildIndexXml(supplier));
  zip.file("journal.csv", buildJournalCsv());
  zip.file("konten.csv", buildKontenCsv());
  zip.file("mandanten.csv", buildMandantenCsv());
  zip.file("belege.csv", buildBelegeCsv());
  zip.file("audit.csv", buildAuditCsv());
  return zip.generateAsync({ type: "blob" });
}
