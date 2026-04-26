/**
 * DATEV Buchungsstapel-Import (EXTF 510 / Kategorie 21).
 *
 * Symmetrisch zu `DatevExporter.ts`. Liest eine DATEV-EXTF-CSV (als Bytes
 * in CP-1252 oder als bereits dekodierter String) und gibt eine Liste von
 * `ParsedRow`-Datensätzen zurück, die der bestehende Journal-Import-UI-
 * Pfad (`JournalCsvImportPage`) direkt verwenden kann.
 *
 * Kern-Eigenschaften:
 *   - Byte-Input (Uint8Array) wird via `fromLatin1Bytes` dekodiert. Die
 *     aktuelle Exporter-Implementation arbeitet in ISO-8859-1 (Windows-
 *     1252-Sonderzeichen wie € = 0x80 werden beim Export verlustbehaftet
 *     auf "?" gekippt). Der Importer ist symmetrisch dazu.
 *   - Beträge werden als `Decimal` geparst (GoBD Rz. 58).
 *   - BU-Schlüssel → ust_satz (Ganzzahl-Prozent) via `ustSatzForBuSchluessel`.
 *   - TTMM → ISO YYYY-MM-DD unter Verwendung des Wirtschaftsjahres aus
 *     dem Header-Block.
 *   - Soll/Haben-Kennzeichen steuert, welches Konto als soll_konto bzw.
 *     haben_konto in der App-Darstellung landet.
 *   - Kostenstelle: EXTF-Positionen 37/38 (0-indexiert 36/37). Wenn beide
 *     gesetzt sind, wird KOST1 übernommen und KOST2 als Warnung gemeldet
 *     (JournalEntry hat nur ein kostenstelle-Feld).
 *
 * Fehlertoleranz: einzelne ungültige Zeilen werden mit ParseIssue gemeldet
 * und übersprungen; der Rest wird weiter verarbeitet (vgl. Sprint 1 CSV).
 *
 * Round-Trip-Test: `exportBuchungsstapel` → `parseDatevExtf` → Felder
 * identisch (siehe Tests). Byte-Identität bei Re-Export ist garantiert,
 * sofern derselbe `now`-Timestamp, dieselben Accounts und dieselben
 * Bezeichnungen verwendet werden.
 */

import {
  DATEV_COLUMN_POSITIONS,
  datevDateLongToIso,
  datevDateShortToIso,
  fromLatin1Bytes,
  parseDatevDecimal,
  ustSatzForBuSchluessel,
} from "./datevFormat";
import type { ParsedRow, ParseIssue } from "../../domain/journal/csvImport";

/** Aus dem EXTF-Header-Block extrahierte Metadaten. */
export type ExtfHeaderMeta = {
  format: string;
  version: number;
  category: number;
  beraterNr: number;
  mandantNr: number;
  wirtschaftsjahrBeginn: string; // ISO YYYY-MM-DD
  zeitraum: { von: string; bis: string };
  bezeichnung: string;
};

export type ExtfParseResult = {
  header: ExtfHeaderMeta | null;
  rows: ParsedRow[];
  errors: ParseIssue[];
  warnings: ParseIssue[];
};

export type ExtfParseOptions = {
  /** Erwartete Mandant-Nr. Wenn gesetzt und im Header abweichend → Warnung. */
  expectedMandantNr?: number;
};

// ---------------------------------------------------------------------------

function splitDatevLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ";") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// ---------------------------------------------------------------------------

export function parseDatevExtf(
  input: string | Uint8Array,
  options: ExtfParseOptions = {}
): ExtfParseResult {
  const errors: ParseIssue[] = [];
  const warnings: ParseIssue[] = [];
  const rows: ParsedRow[] = [];

  const text =
    typeof input === "string" ? input : fromLatin1Bytes(input);

  if (text.trim().length === 0) {
    errors.push({ line: 0, message: "Datei ist leer." });
    return { header: null, rows, errors, warnings };
  }

  const clean = stripBom(text).replace(/\r\n?/g, "\n");
  const lines = clean.split("\n");

  // --- Zeile 1: EXTF-Header ------------------------------------------------
  if (lines[0] === undefined || lines[0].trim() === "") {
    errors.push({ line: 1, message: "Header-Zeile fehlt." });
    return { header: null, rows, errors, warnings };
  }

  const h = splitDatevLine(lines[0]);
  const formatField = h[0] ?? "";
  if (formatField !== "EXTF") {
    errors.push({
      line: 1,
      field: "format",
      message: `Header-Feld 1 muss "EXTF" enthalten, gelesen "${formatField}"`,
    });
    return { header: null, rows, errors, warnings };
  }

  const version = Number(h[1] ?? "");
  if (!Number.isFinite(version)) {
    errors.push({
      line: 1,
      field: "version",
      message: `Format-Version ist keine Zahl: "${h[1]}"`,
    });
    return { header: null, rows, errors, warnings };
  }
  if (version !== 510) {
    warnings.push({
      line: 1,
      field: "version",
      message: `Format-Version ist ${version} (erwartet 510 — Parser akzeptiert dennoch, Felder könnten abweichen)`,
    });
  }

  const category = Number(h[2] ?? "");
  const beraterNr = Number(h[10] ?? "");
  const mandantNr = Number(h[11] ?? "");
  const wjBeginnStr = h[12] ?? "";
  const vonStr = h[14] ?? "";
  const bisStr = h[15] ?? "";
  const bezeichnung = h[16] ?? "";

  const wjBeginnIso = datevDateLongToIso(wjBeginnStr);
  if (wjBeginnIso === null) {
    errors.push({
      line: 1,
      field: "wirtschaftsjahr_beginn",
      message: `Ungültiges Wirtschaftsjahr-Beginn-Datum "${wjBeginnStr}" (erwartet YYYYMMDD)`,
    });
    return { header: null, rows, errors, warnings };
  }
  const wj = Number(wjBeginnIso.slice(0, 4));

  const vonIso = datevDateLongToIso(vonStr) ?? wjBeginnIso;
  const bisIso = datevDateLongToIso(bisStr) ?? wjBeginnIso;

  if (
    options.expectedMandantNr !== undefined &&
    Number.isFinite(mandantNr) &&
    mandantNr !== options.expectedMandantNr
  ) {
    warnings.push({
      line: 1,
      field: "mandant_nr",
      message: `Datei-Mandant-Nr. ${mandantNr} weicht von erwarteter ${options.expectedMandantNr} ab`,
    });
  }

  const header: ExtfHeaderMeta = {
    format: formatField,
    version,
    category,
    beraterNr,
    mandantNr,
    wirtschaftsjahrBeginn: wjBeginnIso,
    zeitraum: { von: vonIso, bis: bisIso },
    bezeichnung,
  };

  // --- Zeile 2: Spaltenköpfe (nur informativ überspringen) -----------------
  if (lines.length < 2) {
    warnings.push({ line: 2, message: "Spaltenkopf-Zeile fehlt." });
  }

  // --- Ab Zeile 3: Buchungszeilen ------------------------------------------
  for (let li = 2; li < lines.length; li++) {
    const raw = lines[li];
    const lineNo = li + 1;
    if (raw.trim().length === 0) continue;

    const cells = splitDatevLine(raw);
    if (cells.length <= DATEV_COLUMN_POSITIONS.BUCHUNGSTEXT) {
      errors.push({
        line: lineNo,
        message: `Zeile hat nur ${cells.length} Spalten, erwartet mindestens ${DATEV_COLUMN_POSITIONS.BUCHUNGSTEXT + 1}`,
      });
      continue;
    }

    let rowOk = true;

    // Umsatz (Netto)
    const umsatzStr = cells[DATEV_COLUMN_POSITIONS.UMSATZ] ?? "";
    const betrag = parseDatevDecimal(umsatzStr);
    if (betrag === null) {
      errors.push({
        line: lineNo,
        field: "umsatz",
        message: `Ungültiger Umsatz "${umsatzStr}" (erwartet z. B. 1234,56)`,
      });
      rowOk = false;
    } else if (!betrag.gt(0)) {
      errors.push({
        line: lineNo,
        field: "umsatz",
        message: `Umsatz muss > 0 sein, gelesen ${betrag.toString()}`,
      });
      rowOk = false;
    }

    // S/H-Kennzeichen
    const sollHaben = (cells[DATEV_COLUMN_POSITIONS.SOLL_HABEN] ?? "").trim();
    if (sollHaben !== "S" && sollHaben !== "H") {
      errors.push({
        line: lineNo,
        field: "soll_haben",
        message: `S/H-Kennzeichen muss "S" oder "H" sein, gelesen "${sollHaben}"`,
      });
      rowOk = false;
    }

    // Konten
    const konto = (cells[DATEV_COLUMN_POSITIONS.KONTO] ?? "").trim();
    const gegenkonto = (cells[DATEV_COLUMN_POSITIONS.GEGENKONTO] ?? "").trim();
    if (konto === "") {
      errors.push({
        line: lineNo,
        field: "konto",
        message: "Konto (Feld 7) darf nicht leer sein",
      });
      rowOk = false;
    }
    if (gegenkonto === "") {
      errors.push({
        line: lineNo,
        field: "gegenkonto",
        message: "Gegenkonto (Feld 8) darf nicht leer sein",
      });
      rowOk = false;
    }
    if (konto !== "" && konto === gegenkonto) {
      errors.push({
        line: lineNo,
        message: "Konto und Gegenkonto dürfen nicht identisch sein",
      });
      rowOk = false;
    }

    // BU-Schlüssel → ust_satz
    const bu = (cells[DATEV_COLUMN_POSITIONS.BU_SCHLUESSEL] ?? "").trim();
    const ustSatz = ustSatzForBuSchluessel(bu);
    if (bu !== "" && ustSatz === null) {
      warnings.push({
        line: lineNo,
        field: "bu_schluessel",
        message: `Unbekannter BU-Schlüssel "${bu}" — ust_satz wird auf 0 gesetzt`,
      });
    }

    // Belegdatum TTMM
    const belegdatumStr = (
      cells[DATEV_COLUMN_POSITIONS.BELEGDATUM] ?? ""
    ).trim();
    const isoDatum = datevDateShortToIso(belegdatumStr, wj);
    if (isoDatum === null) {
      errors.push({
        line: lineNo,
        field: "belegdatum",
        message: `Ungültiges Belegdatum "${belegdatumStr}" (erwartet TTMM, z. B. 1501 für 15. Januar)`,
      });
      rowOk = false;
    }

    // Belegfeld 1 → beleg_nr (im bestehenden App-Modell Pflichtfeld)
    const belegNr = (cells[DATEV_COLUMN_POSITIONS.BELEGFELD_1] ?? "").trim();
    if (belegNr === "") {
      errors.push({
        line: lineNo,
        field: "belegfeld_1",
        message: "Belegfeld 1 (beleg_nr) darf nicht leer sein",
      });
      rowOk = false;
    }

    // Buchungstext
    const beschreibung = (
      cells[DATEV_COLUMN_POSITIONS.BUCHUNGSTEXT] ?? ""
    ).trim();
    if (beschreibung === "") {
      errors.push({
        line: lineNo,
        field: "buchungstext",
        message: "Buchungstext darf nicht leer sein",
      });
      rowOk = false;
    }

    // Kostenstelle 1 + 2 (optional, EXTF-Positionen 36/37)
    const kost1 = (cells[DATEV_COLUMN_POSITIONS.KOST1] ?? "").trim();
    const kost2 = (cells[DATEV_COLUMN_POSITIONS.KOST2] ?? "").trim();
    const kostenstelle = kost1 !== "" ? kost1 : kost2 !== "" ? kost2 : null;
    if (kost1 !== "" && kost2 !== "") {
      warnings.push({
        line: lineNo,
        field: "kostenstelle",
        message: `Beide Kostenstellen gesetzt (KOST1="${kost1}", KOST2="${kost2}"); JournalEntry hat nur ein kostenstelle-Feld — KOST1 wird übernommen, KOST2 verworfen`,
      });
    }

    // Soll/Haben-Flag bestimmt die Zuordnung zu soll_konto / haben_konto:
    //   S: Konto (Feld 7) ist Soll, Gegenkonto (Feld 8) ist Haben → normal
    //   H: Konto ist Haben, Gegenkonto ist Soll → umdrehen
    let sollKonto = konto;
    let habenKonto = gegenkonto;
    if (sollHaben === "H") {
      sollKonto = gegenkonto;
      habenKonto = konto;
    }

    if (rowOk && betrag !== null && isoDatum !== null) {
      rows.push({
        line: lineNo,
        datum: isoDatum,
        beleg_nr: belegNr,
        soll_konto: sollKonto,
        haben_konto: habenKonto,
        betrag,
        beschreibung,
        ust_satz: ustSatz ?? 0,
        kostenstelle,
        // DATEV-EXTF-510-Konvention: KOST2 wird nicht als Kostenträger
        // interpretiert (typische DATEV-Praxis nutzt KOST1 für Kostenstelle
        // und KOST2 für eine zweite KST-Dimension, nicht für KTR).
        // Wer KTR via DATEV importiert, nutzt die einfache CSV-Variante
        // mit dedizierter kostentraeger-Spalte (9-Spalten-Header).
        kostentraeger: null,
        // Sprint 5: DATEV EXTF 510 kennt keine Skonto-Flags analog zu CSV-
        // 11-Spalten; Skonto bleibt beim Import via DATEV unberücksichtigt.
        skonto_pct: null,
        skonto_tage: null,
      });
    }
  }

  return { header, rows, errors, warnings };
}

/** Versions-Info für das UI-Label. */
export const DATEV_EXTF_IMPORTER_INFO = {
  supportedVersion: 510 as const,
  supportedCategory: 21 as const,
  encoding: "ISO-8859-1 / Windows-1252" as const,
  separator: "Semikolon" as const,
};
