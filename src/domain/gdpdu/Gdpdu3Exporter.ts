/**
 * GDPdU/Z3-Datenexport für die Betriebsprüfung (§ 147 Abs. 6 AO).
 *
 * Z3 ist die "Datenträgerüberlassung": der Steuerpflichtige übergibt dem
 * Prüfer einen vollständigen, maschinenlesbaren Daten-Dump.
 *
 * Format: BMF Beschreibungsstandard 2025
 *   - INDEX.XML: Metadaten (DataSet-Definition, Struktur-Beschreibung)
 *   - KONTEN.CSV: Kontenrahmen
 *   - BUCHUNGEN.CSV: Alle Journal-Einträge im Prüfzeitraum
 *   - BELEGE.CSV: Beleg-Metadaten
 *   - STAMMDATEN.CSV: Unternehmens-Stammdaten
 *   - LOHN.CSV (optional): Lohnbuchungen
 *   - MANIFEST.XML: Integritäts-Hashes aller Dateien
 *
 * Zeichensatz: ISO-8859-15 (GDPdU-Standard)
 * Feldtrennzeichen: Semikolon
 * Dezimaltrennzeichen: Komma
 * Datumsformat: DD.MM.YYYY
 * Zeilenumbruch: CRLF
 *
 * Diese Implementation gibt die Dateien als `Map<string, Uint8Array>` zurück;
 * das UI verpackt sie optional in ein ZIP. Der Manifest-Hash (SHA-256)
 * ermöglicht Integritätsprüfung durch den Prüfer.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import { computeAbrechnungHash } from "../../lib/crypto/payrollHash";
import { toLatin1Bytes } from "../../lib/datev/datevFormat";

export type Z3ExportOptions = {
  unternehmen: {
    name: string;
    steuernummer: string;
    adresse?: string;
  };
  zeitraum: { von: string; bis: string };
  konten: Account[];
  buchungen: JournalEntry[];
  includeLohn?: boolean;
  includeStammdaten?: boolean;
  now?: Date;
};

export type Z3ManifestEntry = {
  name: string;
  sizeBytes: number;
  sha256: string;
  rowCount?: number;
};

export type Z3Manifest = {
  createdAt: string;
  encoding: "ISO-8859-15";
  separator: ";";
  decimalSymbol: ",";
  files: Z3ManifestEntry[];
  totalSize: number;
  zeitraum: { von: string; bis: string };
};

export type Z3ExportResult = {
  files: Map<string, Uint8Array>;
  manifest: Z3Manifest;
  totalSize: number;
};

const CRLF = "\r\n";

/** ISO → DD.MM.YYYY. */
function toDE(dateIso: string): string {
  const m = dateIso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateIso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** Money-Zahl mit Komma-Dezimal. */
function deAmount(n: string | number): string {
  const s = typeof n === "number" ? n.toFixed(2) : n;
  return s.replace(".", ",");
}

function csvField(v: string | number | null | undefined): string {
  if (v == null) return '""';
  const s = String(v).replace(/[\r\n\t]/g, " ").replace(/"/g, '""');
  return `"${s}"`;
}

function csvLine(fields: Array<string | number | null | undefined>): string {
  return fields.map(csvField).join(";");
}

function buildKonten(accounts: Account[]): string {
  const header = [
    "ID",
    "Konto-Nr",
    "Bezeichnung",
    "Kategorie",
    "SKR",
    "UStSatz",
    "Aktiv",
  ];
  const lines: string[] = [csvLine(header)];
  for (const a of accounts) {
    lines.push(
      csvLine([
        a.id,
        a.konto_nr,
        a.bezeichnung,
        a.kategorie,
        a.skr,
        a.ust_satz != null ? deAmount(String(a.ust_satz)) : "",
        a.is_active ? "1" : "0",
      ])
    );
  }
  return lines.join(CRLF) + CRLF;
}

function buildBuchungen(entries: JournalEntry[]): string {
  const header = [
    "ID",
    "Belegdatum",
    "Beleg-Nr",
    "Soll-Konto",
    "Haben-Konto",
    "Betrag",
    "UStSatz",
    "Beschreibung",
    "Status",
    "Gegenseite",
    "Faelligkeit",
    "Version",
    "Storno-Status",
    "Hash",
  ];
  const lines: string[] = [csvLine(header)];
  for (const e of entries) {
    lines.push(
      csvLine([
        e.id,
        toDE(e.datum),
        e.beleg_nr,
        e.soll_konto,
        e.haben_konto,
        deAmount(new Money(Number.isFinite(e.betrag) ? e.betrag : 0).toFixed2()),
        e.ust_satz != null ? deAmount(String(e.ust_satz)) : "",
        e.beschreibung,
        e.status,
        e.gegenseite ?? "",
        e.faelligkeit ? toDE(e.faelligkeit) : "",
        String(e.version),
        e.storno_status ?? "active",
        e.entry_hash ?? "",
      ])
    );
  }
  return lines.join(CRLF) + CRLF;
}

function buildBelege(entries: JournalEntry[]): string {
  // Beleg-Metadaten-Tabelle (deduplicated über beleg_nr)
  const header = ["Beleg-Nr", "Datum", "Betrag", "Beschreibung", "Status"];
  const lines: string[] = [csvLine(header)];
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.beleg_nr)) continue;
    seen.add(e.beleg_nr);
    lines.push(
      csvLine([
        e.beleg_nr,
        toDE(e.datum),
        deAmount(new Money(Number.isFinite(e.betrag) ? e.betrag : 0).toFixed2()),
        e.beschreibung,
        e.status,
      ])
    );
  }
  return lines.join(CRLF) + CRLF;
}

function buildStammdaten(opts: Z3ExportOptions): string {
  const header = ["Schluessel", "Wert"];
  const lines: string[] = [csvLine(header)];
  lines.push(csvLine(["Name", opts.unternehmen.name]));
  lines.push(csvLine(["Steuernummer", opts.unternehmen.steuernummer]));
  if (opts.unternehmen.adresse) {
    lines.push(csvLine(["Adresse", opts.unternehmen.adresse]));
  }
  lines.push(csvLine(["Zeitraum_Von", toDE(opts.zeitraum.von)]));
  lines.push(csvLine(["Zeitraum_Bis", toDE(opts.zeitraum.bis)]));
  return lines.join(CRLF) + CRLF;
}

/** Beschreibungsstandard XML (INDEX.XML). */
function buildIndexXml(
  opts: Z3ExportOptions,
  fileNames: string[]
): string {
  const ns = "urn:bundesministerium-der-finanzen:gdpdu:1.0";
  const vonDe = toDE(opts.zeitraum.von);
  const bisDe = toDE(opts.zeitraum.bis);
  // Tabellen-Einträge nur für CSV-Dateien (nicht für MANIFEST oder INDEX selbst)
  const csvFiles = fileNames.filter(
    (n) => n.toUpperCase().endsWith(".CSV")
  );
  const tablesXml = csvFiles
    .map((fn) => {
      const name = fn.replace(".CSV", "").replace(/^.*\//, "");
      return `    <Table>
      <URL>${escapeXml(fn)}</URL>
      <Name>${escapeXml(name)}</Name>
      <Description>${escapeXml(`${name} (${vonDe} - ${bisDe})`)}</Description>
      <VariableLength>
        <DecimalSymbol>,</DecimalSymbol>
        <DigitGroupingSymbol>.</DigitGroupingSymbol>
        <ColumnDelimiter>;</ColumnDelimiter>
        <RowDelimiter>\r\n</RowDelimiter>
        <TextEncapsulator>"</TextEncapsulator>
      </VariableLength>
    </Table>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="ISO-8859-15"?>
<DataSet xmlns="${ns}">
  <Version>1.0</Version>
  <DataSupplier>
    <Name>${escapeXml(opts.unternehmen.name)}</Name>
    <Location>DE</Location>
    <Comment>Export für Betriebsprüfung (Z3, § 147 Abs. 6 AO)</Comment>
  </DataSupplier>
  <Media>
    <Name>Datenübergabe ${escapeXml(`${vonDe}-${bisDe}`)}</Name>
${tablesXml}
  </Media>
</DataSet>
`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Manifest als XML mit SHA-256 je Datei. */
function buildManifestXml(manifest: Z3Manifest): string {
  const files = manifest.files
    .map(
      (f) => `  <File>
    <Name>${escapeXml(f.name)}</Name>
    <SizeBytes>${f.sizeBytes}</SizeBytes>
    <SHA256>${f.sha256}</SHA256>${f.rowCount != null ? `\n    <RowCount>${f.rowCount}</RowCount>` : ""}
  </File>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="ISO-8859-15"?>
<Manifest>
  <CreatedAt>${manifest.createdAt}</CreatedAt>
  <Encoding>${manifest.encoding}</Encoding>
  <Separator>${escapeXml(manifest.separator)}</Separator>
  <DecimalSymbol>${escapeXml(manifest.decimalSymbol)}</DecimalSymbol>
  <Zeitraum>
    <Von>${manifest.zeitraum.von}</Von>
    <Bis>${manifest.zeitraum.bis}</Bis>
  </Zeitraum>
  <TotalSizeBytes>${manifest.totalSize}</TotalSizeBytes>
  <Files>
${files}
  </Files>
</Manifest>
`;
}

function rowCountForCsv(csvString: string): number {
  const lines = csvString.split(CRLF).filter((l) => l.length > 0);
  return Math.max(0, lines.length - 1); // minus header
}

export async function exportZ3Package(
  options: Z3ExportOptions
): Promise<Z3ExportResult> {
  // 1. Filter entries im Zeitraum
  const von = options.zeitraum.von;
  const bis = options.zeitraum.bis;
  const entriesInRange = options.buchungen.filter(
    (e) => e.datum >= von && e.datum <= bis
  );

  const now = options.now ?? new Date();
  const files = new Map<string, Uint8Array>();
  const rowCounts = new Map<string, number>();

  // 2. Generate CSVs
  const kontenCsv = buildKonten(options.konten);
  files.set("KONTEN.CSV", toLatin1Bytes(kontenCsv));
  rowCounts.set("KONTEN.CSV", rowCountForCsv(kontenCsv));

  const buchungenCsv = buildBuchungen(entriesInRange);
  files.set("BUCHUNGEN.CSV", toLatin1Bytes(buchungenCsv));
  rowCounts.set("BUCHUNGEN.CSV", rowCountForCsv(buchungenCsv));

  const belegeCsv = buildBelege(entriesInRange);
  files.set("BELEGE.CSV", toLatin1Bytes(belegeCsv));
  rowCounts.set("BELEGE.CSV", rowCountForCsv(belegeCsv));

  if (options.includeStammdaten !== false) {
    const stammCsv = buildStammdaten(options);
    files.set("STAMMDATEN.CSV", toLatin1Bytes(stammCsv));
    rowCounts.set("STAMMDATEN.CSV", rowCountForCsv(stammCsv));
  }

  if (options.includeLohn) {
    // Platzhalter: echte Lohn-Integration erfordert die Archiv-Tabelle.
    // Für Scope-Kontrolle generieren wir eine leere Datei mit Header.
    const lohnCsv =
      csvLine([
        "ID",
        "PersonalNr",
        "Monat",
        "Brutto",
        "Netto",
        "LSt",
        "Soli",
        "KiSt",
        "SV_AN",
        "SV_AG",
      ]) + CRLF;
    files.set("LOHN.CSV", toLatin1Bytes(lohnCsv));
    rowCounts.set("LOHN.CSV", 0);
  }

  // 3. INDEX.XML
  const fileNames = Array.from(files.keys());
  const indexXml = buildIndexXml(options, fileNames);
  files.set("INDEX.XML", toLatin1Bytes(indexXml));

  // 4. Hashes + Manifest
  const manifestFiles: Z3ManifestEntry[] = [];
  let totalSize = 0;
  for (const [name, bytes] of files) {
    // Hash aus Byte-Array → via TextDecoder dekodieren für stabilen Input
    const asString = new TextDecoder("latin1").decode(bytes);
    const sha = await computeAbrechnungHash({ name, content: asString });
    manifestFiles.push({
      name,
      sizeBytes: bytes.length,
      sha256: sha,
      rowCount: rowCounts.get(name),
    });
    totalSize += bytes.length;
  }
  manifestFiles.sort((a, b) => a.name.localeCompare(b.name));

  const manifest: Z3Manifest = {
    createdAt: now.toISOString(),
    encoding: "ISO-8859-15",
    separator: ";",
    decimalSymbol: ",",
    files: manifestFiles,
    totalSize,
    zeitraum: options.zeitraum,
  };

  const manifestXml = buildManifestXml(manifest);
  files.set("MANIFEST.XML", toLatin1Bytes(manifestXml));

  return {
    files,
    manifest,
    totalSize: totalSize + files.get("MANIFEST.XML")!.length,
  };
}
