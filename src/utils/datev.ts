import type { Account, JournalEntry } from "../types/db";
import { store } from "../api/store";
import { padKontoNr } from "./accountNormalization";

/**
 * DATEV-style exports.
 *
 * Diese Funktionen erzeugen Dateien, die AM DATEV-"Standard-Buchungsstapel"
 * orientiert sind (öffentlich dokumentiertes EXTF-Format, Revision 700/701).
 * Es handelt sich NICHT um die lizenzierten, DATEV-zertifizierten Formate —
 * Akzeptanz durch den offiziellen DATEV-Import ist nicht garantiert, aber die
 * Spaltenstruktur und das Encoding stimmen mit der öffentlichen Spezifikation
 * überein.
 *
 * Wichtige Eigenheiten, die dieses Modul gemäß der Spezifikation umsetzt:
 *   • Feldtrenner: Semikolon
 *   • Zeilenumbruch: CRLF
 *   • Encoding: Windows-1252 (nicht UTF-8) — Umlaute werden beibehalten,
 *     NICHT transliteriert (ä bleibt ä). Zeichen außerhalb CP-1252 werden
 *     in "?" ersetzt und im Validierungsergebnis gemeldet.
 *   • Dezimaltrenner: Komma
 *   • Rundung: kaufmännische Rundung (half-up), die in deutschem Rechnungswesen
 *     üblich ist — NICHT banker's rounding.
 *   • Feld-Längen: Belegfeld1 ≤ 36, Buchungstext ≤ 60 (Rest wird abgeschnitten
 *     und im Validierungsergebnis protokolliert).
 *   • Konto/Gegenkonto: linksseitig mit Nullen auf 4 Stellen gepadded.
 */

// ---------------------------------------------------------------------------
// CP-1252 / Windows-1252 encoder
// ---------------------------------------------------------------------------
// TextEncoder unterstützt in allen Browsern nur UTF-8. Für echten
// DATEV-Import brauchen wir CP-1252-Bytes. Wir mappen jeden Unicode-Codepunkt
// auf das entsprechende CP-1252-Byte; für Codepunkte, die nicht im Zeichensatz
// liegen, tragen wir ein "?" (0x3F) ein und melden das im Validator.

const CP1252_SPECIALS: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201e: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02c6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8a, // Š
  0x2039: 0x8b, // ‹
  0x0152: 0x8c, // Œ
  0x017d: 0x8e, // Ž
  0x2018: 0x91, // '
  0x2019: 0x92, // '
  0x201c: 0x93, // "
  0x201d: 0x94, // "
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02dc: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9a, // š
  0x203a: 0x9b, // ›
  0x0153: 0x9c, // œ
  0x017e: 0x9e, // ž
  0x0178: 0x9f, // Ÿ
};

export type Cp1252EncodeResult = {
  bytes: Uint8Array;
  /** Anzahl der Zeichen, die nicht im CP-1252-Zeichensatz vorhanden sind. */
  unsupported: number;
};

export function encodeCp1252(text: string): Cp1252EncodeResult {
  const out = new Uint8Array(text.length * 2); // worst-case grow buffer
  let i = 0;
  let unsupported = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0x3f;
    let byte: number;
    if (cp <= 0x7f) {
      byte = cp; // ASCII
    } else if (cp >= 0xa0 && cp <= 0xff) {
      byte = cp; // Latin-1 supplement (inkl. äöüßÄÖÜ)
    } else if (cp in CP1252_SPECIALS) {
      byte = CP1252_SPECIALS[cp];
    } else {
      byte = 0x3f; // "?"
      unsupported++;
    }
    out[i++] = byte;
  }
  return { bytes: out.slice(0, i), unsupported };
}

// ---------------------------------------------------------------------------
// Field formatters
// ---------------------------------------------------------------------------

function csvEscape(v: unknown): string {
  let s = String(v ?? "");
  // Zeilenumbrüche und Tabs entfernen — DATEV verbietet sie im Feldinhalt.
  s = s.replace(/[\r\n\t]+/g, " ").trim();
  if (/[";]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Kaufmännische Rundung (half-up, NICHT banker's rounding).
 *  0.5 geht immer aufwärts, unabhängig davon, ob der Vorgänger gerade ist. */
function kaufmannischRound(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.floor(Math.abs(n) * factor + 0.5)) / factor;
}

function deDecimal(n: number): string {
  const rounded = kaufmannischRound(n, 2);
  return rounded
    .toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    })
    .replace(".", ",");
}

function ddmm(d: string): string {
  // ISO YYYY-MM-DD -> DDMM (Tag + Monat; Jahr ist aus der Header-
  // Wirtschaftsjahrs-Angabe implizit).
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}${String(
    dt.getMonth() + 1
  ).padStart(2, "0")}`;
}

function buSchluesselFromUst(ust: number | null): string {
  // Nur die beiden Umsatzsteuer-Regelfälle, die ohne weiteres abbildbar sind.
  // Für Reverse-Charge, EU-Lieferung etc. wäre eine komplexere Logik nötig.
  if (ust === 7) return "2";
  if (ust === 19) return ""; // Standard, ohne expliziten Schlüssel
  return "";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type DatevExportError = {
  rowIndex: number; // 0-basiert, bezogen auf die zu exportierenden Einträge
  belegNr: string;
  field: string;
  severity: "error" | "warn";
  message: string;
  /** Was der Nutzer tun kann, um den Fehler zu beheben. */
  hint?: string;
};

export type DatevValidationResult = {
  ok: boolean;
  errors: DatevExportError[];
  warnings: DatevExportError[];
};

const BELEGFELD1_MAX = 36;
const BUCHUNGSTEXT_MAX = 60;

export function validateExtfEntries(
  entries: JournalEntry[],
  accounts: Account[]
): DatevValidationResult {
  const accountSet = new Set(accounts.map((a) => padKontoNr(a.konto_nr)));
  const errors: DatevExportError[] = [];
  const warnings: DatevExportError[] = [];

  entries.forEach((e, i) => {
    const belegNr = e.beleg_nr || `<Zeile ${i + 1}>`;

    if (!(Number(e.betrag) > 0)) {
      errors.push({
        rowIndex: i,
        belegNr,
        field: "Umsatz",
        severity: "error",
        message: "Betrag ist 0 oder negativ.",
        hint: "DATEV erwartet Beträge > 0 mit Soll-/Haben-Kennzeichen.",
      });
    }

    const soll = padKontoNr(e.soll_konto);
    const haben = padKontoNr(e.haben_konto);
    if (!/^\d{4,8}$/.test(soll)) {
      errors.push({
        rowIndex: i,
        belegNr,
        field: "Konto",
        severity: "error",
        message: `Soll-Konto "${e.soll_konto}" ist keine gültige Kontonummer.`,
        hint: "4–8 Ziffern, z. B. 4930.",
      });
    }
    if (!/^\d{4,8}$/.test(haben)) {
      errors.push({
        rowIndex: i,
        belegNr,
        field: "Gegenkonto",
        severity: "error",
        message: `Haben-Konto "${e.haben_konto}" ist keine gültige Kontonummer.`,
      });
    }
    if (soll && !accountSet.has(soll)) {
      warnings.push({
        rowIndex: i,
        belegNr,
        field: "Konto",
        severity: "warn",
        message: `Soll-Konto ${soll} ist nicht im Kontenplan — DATEV wird es vermutlich ablehnen.`,
        hint: "Konto im Kontenplan anlegen oder Buchung korrigieren.",
      });
    }
    if (haben && !accountSet.has(haben)) {
      warnings.push({
        rowIndex: i,
        belegNr,
        field: "Gegenkonto",
        severity: "warn",
        message: `Haben-Konto ${haben} ist nicht im Kontenplan.`,
      });
    }

    if (!e.datum || !/^\d{4}-\d{2}-\d{2}/.test(e.datum)) {
      errors.push({
        rowIndex: i,
        belegNr,
        field: "Belegdatum",
        severity: "error",
        message: "Datum fehlt oder ist kein ISO-Datum.",
      });
    }

    if (!e.beleg_nr) {
      warnings.push({
        rowIndex: i,
        belegNr,
        field: "Belegfeld1",
        severity: "warn",
        message: "Keine Beleg-Nr. — wird beim Export auf AUTO-<Zeile> gesetzt.",
      });
    } else if (e.beleg_nr.length > BELEGFELD1_MAX) {
      warnings.push({
        rowIndex: i,
        belegNr,
        field: "Belegfeld1",
        severity: "warn",
        message: `Beleg-Nr. länger als ${BELEGFELD1_MAX} Zeichen — wird abgeschnitten.`,
      });
    }

    if (e.beschreibung && e.beschreibung.length > BUCHUNGSTEXT_MAX) {
      warnings.push({
        rowIndex: i,
        belegNr,
        field: "Buchungstext",
        severity: "warn",
        message: `Beschreibung länger als ${BUCHUNGSTEXT_MAX} Zeichen — wird abgeschnitten.`,
      });
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// CSV builder
// ---------------------------------------------------------------------------

export type DatevMeta = {
  beraterNr: string; // DATEV Berater-Nr. (7 digits)
  mandantNr: string; // DATEV Mandanten-Nr.
  wirtschaftsjahrBeginn: string; // ISO YYYY-MM-DD
  datumVon: string;
  datumBis: string;
  bezeichnung: string; // Label im DATEV-Explorer
  /** Format-Version (2. Header-Spalte). Public docs: 700; user-override möglich. */
  formatVersion?: string;
  /** Format-Revision (5. Header-Spalte, "Buchungsstapel"-Revision). Default 11. */
  formatRevision?: string;
};

function truncAndEscape(s: string | null | undefined, max: number): string {
  const trimmed = (s ?? "").trim();
  const clipped = trimmed.length > max ? trimmed.slice(0, max) : trimmed;
  return csvEscape(clipped);
}

export function buildDatevCsv(
  entries: JournalEntry[],
  meta: DatevMeta
): string {
  const formatVersion = meta.formatVersion ?? "700";
  const formatRevision = meta.formatRevision ?? "11";

  const header = [
    "EXTF",
    formatVersion,
    "21",
    "Buchungsstapel",
    formatRevision,
    new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ""),
    "", // imported-by
    "RE", // Herkunft: RE = Rechnungswesen
    "", // exportiert-von
    "", // importiert-von (leer bei Export)
    meta.beraterNr,
    meta.mandantNr,
    meta.wirtschaftsjahrBeginn.replace(/-/g, ""),
    "4", // Sachkontenlänge (4-stellig)
    meta.datumVon.replace(/-/g, ""),
    meta.datumBis.replace(/-/g, ""),
    meta.bezeichnung,
    "EUR", // Diktatkürzel / Währung
  ]
    .map(csvEscape)
    .join(";");

  const columnHeader = [
    "Umsatz (ohne Soll/Haben-Kz)",
    "Soll/Haben-Kennzeichen",
    "WKZ Umsatz",
    "Kurs",
    "Basis-Umsatz",
    "WKZ Basis-Umsatz",
    "Konto",
    "Gegenkonto (ohne BU-Schlüssel)",
    "BU-Schlüssel",
    "Belegdatum",
    "Belegfeld 1",
    "Belegfeld 2",
    "Skonto",
    "Buchungstext",
    "Postensperre",
    "Diverse Adressnummer",
    "Geschäftspartnerbank",
    "Sachverhalt",
  ]
    .map(csvEscape)
    .join(";");

  const rows = entries.map((e, i) => {
    const skonto =
      e.skonto_pct && e.skonto_pct > 0 && e.skonto_tage && e.skonto_tage > 0
        ? deDecimal(
            kaufmannischRound((Number(e.betrag) * e.skonto_pct) / 100, 2)
          )
        : "";

    const belegFallback = e.beleg_nr && e.beleg_nr.trim()
      ? e.beleg_nr
      : `AUTO-${i + 1}`;

    const fields = [
      deDecimal(Number(e.betrag)),
      "S", // S = Sollbuchung; Umsatz immer positiv, SH indicates direction
      "EUR",
      "",
      "",
      "",
      padKontoNr(e.soll_konto),
      padKontoNr(e.haben_konto),
      buSchluesselFromUst(e.ust_satz),
      ddmm(e.datum),
      truncAndEscape(belegFallback, BELEGFELD1_MAX),
      "",
      skonto, // Skonto bleibt leer (nicht "0"), wenn kein Skonto gegeben ist
      truncAndEscape(e.beschreibung, BUCHUNGSTEXT_MAX),
      "", // Postensperre
      "", // Diverse Adressnummer
      "", // Geschäftspartnerbank
      "", // Sachverhalt
    ];
    return fields
      .map((v, idx) =>
        // Felder 10 und 13 sind bereits über truncAndEscape gelaufen.
        idx === 10 || idx === 13 ? v : csvEscape(v)
      )
      .join(";");
  });

  // CRLF per DATEV-Konvention
  return [header, columnHeader, ...rows].join("\r\n") + "\r\n";
}

export function buildExtfFilename(meta: Pick<DatevMeta, "datumVon" | "datumBis">): string {
  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "");
  const von = meta.datumVon.replace(/-/g, "");
  const bis = meta.datumBis.replace(/-/g, "");
  return `EXTF_Buchungsstapel_${von}-${bis}_${stamp}.csv`;
}

/**
 * Kodiert das CSV in Windows-1252 und packt es als Blob.
 * Wird vom UI aufgerufen und hängt wahlweise ein "UTF-8 ist FALSCH"-Disclaimer
 * NICHT an — DATEV erwartet explizit CP-1252.
 */
export function buildDatevBlob(
  entries: JournalEntry[],
  meta: DatevMeta
): { blob: Blob; filename: string; unsupportedChars: number } {
  const csv = buildDatevCsv(entries, meta);
  const encoded = encodeCp1252(csv);
  const blob = new Blob([new Uint8Array(encoded.bytes)], {
    type: "text/csv;charset=windows-1252",
  });
  return {
    blob,
    filename: buildExtfFilename(meta),
    unsupportedChars: encoded.unsupported,
  };
}

// ---------------------------------------------------------------------------
// ATCH (Document archive) — unverändert
// ---------------------------------------------------------------------------

export async function buildAtchZip(
  entries: JournalEntry[],
  _accounts: Account[]
): Promise<Blob> {
  const JSZipMod = await import("jszip");
  const JSZip = JSZipMod.default;
  const zip = new JSZip();

  const documents = store.getDocuments();
  const entryById = new Map(entries.map((e) => [e.id, e]));

  const docLines: string[] = [];
  docLines.push('<?xml version="1.0" encoding="UTF-8"?>');
  docLines.push('<archive version="1.0" generator="harouda-app">');

  for (const doc of documents) {
    const entry = doc.journal_entry_id
      ? entryById.get(doc.journal_entry_id)
      : null;
    if (!entry) continue;
    const guid = doc.id;
    const blobUrl = store.getBlob(doc.id);
    if (!blobUrl) continue;
    const res = await fetch(blobUrl);
    const bytes = await res.arrayBuffer();

    zip.file(`documents/${guid}_${safeName(doc.file_name)}`, bytes);

    docLines.push("  <document>");
    docLines.push(`    <guid>${guid}</guid>`);
    docLines.push(`    <filename>${xmlEscape(doc.file_name)}</filename>`);
    docLines.push(`    <mime>${xmlEscape(doc.mime_type)}</mime>`);
    docLines.push(`    <belegdatum>${entry.datum}</belegdatum>`);
    docLines.push(`    <belegnummer>${xmlEscape(entry.beleg_nr)}</belegnummer>`);
    docLines.push(`    <buchungstext>${xmlEscape(entry.beschreibung)}</buchungstext>`);
    docLines.push("  </document>");
  }

  docLines.push("</archive>");

  zip.file("document.xml", docLines.join("\n"));

  return zip.generateAsync({ type: "blob" });
}

function safeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
