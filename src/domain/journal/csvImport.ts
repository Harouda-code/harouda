// CSV-Import für Journal-Buchungen.
//
// Kein externes Paket: minimaler semicolon-getrennter CSV-Parser mit
// Doppelquote-Escape. Deutsches Zahlenformat (Tausenderpunkt, Dezimalkomma)
// und deutsches Datum (DD.MM.YYYY) werden akzeptiert und in die App-
// internen Formate (Decimal.js für Beträge, ISO YYYY-MM-DD für Datum)
// umgewandelt.
//
// Beträge laufen im gesamten Parser als `Decimal` (GoBD Rz. 58,
// ARCHITECTURE.md #1). Die Konvertierung zu `number` erfolgt erst an der
// `createEntry`-Grenze in der Import-UI, wo die bestehende JournalEntry-
// Typsignatur `number` verlangt.
//
// Header-Varianten (Rückwärtskompatibilität):
//   - 7 Spalten:  datum;beleg_nr;soll_konto;haben_konto;betrag;
//                 beschreibung;ust_satz
//   - 8 Spalten:  …;ust_satz;kostenstelle
//   - 9 Spalten:  …;ust_satz;kostenstelle;kostentraeger
//   - 11 Spalten: …;ust_satz;kostenstelle;kostentraeger;skonto_pct;skonto_tage
// Alle Zusatzfelder sind pro Zeile optional (leerer Wert → `null`). Die
// 11-Spalten-Variante wurde in Sprint 5 ergänzt, um Skonto-Szenarien im
// Bank-Abgleich abbilden zu können.
//
// Konto-Existenz-Prüfung ist NICHT Teil dieser Funktion — sie ist
// formatneutral. Die aufrufende Schicht (Import-Service / UI) prüft
// gegen den Kontenrahmen der aktiven Firma.

import Decimal from "decimal.js";

export type ParsedRow = {
  /** 1-indizierte Zeilennummer in der Quell-CSV (Zeile 1 = Header, also ≥ 2). */
  line: number;
  datum: string;          // ISO YYYY-MM-DD
  beleg_nr: string;
  soll_konto: string;
  haben_konto: string;
  betrag: Decimal;        // Netto in Euro, positiv
  beschreibung: string;
  ust_satz: number;       // 0, 7, oder 19
  kostenstelle: string | null;
  kostentraeger: string | null;
  /** Sprint 5: optionaler Skonto-Prozentsatz (1-10 üblich). null bei Leer. */
  skonto_pct: number | null;
  /** Sprint 5: optionale Skonto-Frist in Tagen. null bei Leer. */
  skonto_tage: number | null;
};

export type ParseIssue = {
  line: number;
  field?: string;
  message: string;
};

export type ParseResult = {
  rows: ParsedRow[];
  errors: ParseIssue[];
  warnings: ParseIssue[];
};

/** Optionaler Kontext: zulässige Geschäftsjahre. Wenn nicht gesetzt, wird
 *  keine Fiscal-Year-Prüfung durchgeführt (Aufwärtskompatibilität zu
 *  Unit-Tests ohne Kontext). */
export type ParseOptions = {
  /** Aktuelles Geschäftsjahr (ISO-Grenzen inklusive). */
  currentFiscalYear?: { von: string; bis: string };
  /** Vorheriges Geschäftsjahr (ISO-Grenzen inklusive). */
  previousFiscalYear?: { von: string; bis: string };
};

export const EXPECTED_HEADER = [
  "datum",
  "beleg_nr",
  "soll_konto",
  "haben_konto",
  "betrag",
  "beschreibung",
  "ust_satz",
] as const;

export const EXPECTED_HEADER_WITH_KOSTENSTELLE = [
  ...EXPECTED_HEADER,
  "kostenstelle",
] as const;

export const EXPECTED_HEADER_WITH_KOSTENTRAEGER = [
  ...EXPECTED_HEADER_WITH_KOSTENSTELLE,
  "kostentraeger",
] as const;

export const EXPECTED_HEADER_WITH_SKONTO = [
  ...EXPECTED_HEADER_WITH_KOSTENTRAEGER,
  "skonto_pct",
  "skonto_tage",
] as const;

const ALLOWED_UST_SAETZE = new Set([0, 7, 19]);
const DESCRIPTION_WARN_LENGTH = 60; // DATEV-EXTF-510-Konvention, nicht GoBD-Pflicht

// --- Low-level parser -------------------------------------------------------

/** Splittet eine einzelne Zeile nach Semikolon, mit Doppelquote-Escape:
 *  `"foo;bar"` bleibt ein Feld, `""` ist ein literales Anführungszeichen. */
function splitCsvLine(line: string): string[] {
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

// --- Feld-Parser ------------------------------------------------------------

/** Deutsches Datum DD.MM.YYYY → ISO YYYY-MM-DD, oder null bei Fehler. */
export function parseGermanDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  // Roundtrip-Prüfung, fängt z.B. 31.02.2025 ab.
  const iso = `${y.toString().padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const check = new Date(iso + "T00:00:00Z");
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() + 1 !== mo ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return iso;
}

/** Deutsches Zahlenformat "1.234,56" → Decimal(1234.56). Punkt-Komma
 *  (1234.56 US-Style) wird bewusst NICHT akzeptiert, um Verwechslungen zu
 *  vermeiden. Präzision bleibt über die gesamte Parser-Kette erhalten
 *  (GoBD Rz. 58); die Konvertierung zu `number` ist Sache des Aufrufers. */
export function parseGermanNumber(raw: string): Decimal | null {
  const t = raw.trim();
  if (t.length === 0) return null;
  // Kein Komma → nur Ganzzahl mit optionalen 3er-Gruppierungspunkten zulässig
  if (!t.includes(",")) {
    if (/^-?\d{1,3}(\.\d{3})*$/.test(t) || /^-?\d+$/.test(t)) {
      try {
        const n = new Decimal(t.replace(/\./g, ""));
        return n.isFinite() ? n : null;
      } catch {
        return null;
      }
    }
    return null;
  }
  // Mit Komma → Dezimalstellen erwartet
  const [intPart, decPart, ...rest] = t.split(",");
  if (rest.length > 0) return null;
  if (!/^-?\d{1,3}(\.\d{3})*$|^-?\d+$/.test(intPart)) return null;
  if (!/^\d+$/.test(decPart)) return null;
  try {
    const n = new Decimal(intPart.replace(/\./g, "") + "." + decPart);
    return n.isFinite() ? n : null;
  } catch {
    return null;
  }
}

// --- Haupt-API --------------------------------------------------------------

export function parseJournalCsv(
  text: string,
  options: ParseOptions = {}
): ParseResult {
  const errors: ParseIssue[] = [];
  const warnings: ParseIssue[] = [];
  const rows: ParsedRow[] = [];

  if (text.trim().length === 0) {
    errors.push({ line: 0, message: "Datei ist leer." });
    return { rows, errors, warnings };
  }

  const cleaned = stripBom(text).replace(/\r\n?/g, "\n");
  const lines = cleaned.split("\n");

  // Header verifizieren — 7-, 8- oder 9-Spalten-Variante akzeptieren.
  const rawHeader = lines[0] ?? "";
  const headerCells = splitCsvLine(rawHeader).map((s) => s.trim().toLowerCase());

  let hasKostenstelle = false;
  let hasKostentraeger = false;
  let hasSkonto = false;
  if (headerCells.length === EXPECTED_HEADER.length) {
    hasKostenstelle = false;
    hasKostentraeger = false;
    hasSkonto = false;
  } else if (headerCells.length === EXPECTED_HEADER_WITH_KOSTENSTELLE.length) {
    hasKostenstelle = true;
    hasKostentraeger = false;
    hasSkonto = false;
  } else if (headerCells.length === EXPECTED_HEADER_WITH_KOSTENTRAEGER.length) {
    hasKostenstelle = true;
    hasKostentraeger = true;
    hasSkonto = false;
  } else if (headerCells.length === EXPECTED_HEADER_WITH_SKONTO.length) {
    hasKostenstelle = true;
    hasKostentraeger = true;
    hasSkonto = true;
  } else {
    errors.push({
      line: 1,
      message: `Header hat ${headerCells.length} Spalten, erwartet ${EXPECTED_HEADER.length}, ${EXPECTED_HEADER_WITH_KOSTENSTELLE.length}, ${EXPECTED_HEADER_WITH_KOSTENTRAEGER.length} oder ${EXPECTED_HEADER_WITH_SKONTO.length}: ${EXPECTED_HEADER.join(";")}[;kostenstelle[;kostentraeger[;skonto_pct;skonto_tage]]]`,
    });
    return { rows, errors, warnings };
  }

  const expectedHeader = hasSkonto
    ? EXPECTED_HEADER_WITH_SKONTO
    : hasKostentraeger
      ? EXPECTED_HEADER_WITH_KOSTENTRAEGER
      : hasKostenstelle
        ? EXPECTED_HEADER_WITH_KOSTENSTELLE
        : EXPECTED_HEADER;
  for (let i = 0; i < expectedHeader.length; i++) {
    if (headerCells[i] !== expectedHeader[i]) {
      errors.push({
        line: 1,
        field: expectedHeader[i],
        message: `Spalte ${i + 1} heißt "${headerCells[i]}", erwartet "${expectedHeader[i]}"`,
      });
    }
  }
  if (errors.length > 0) return { rows, errors, warnings };

  // Datenzeilen.
  let dataSeen = 0;
  for (let li = 1; li < lines.length; li++) {
    const raw = lines[li];
    const lineNo = li + 1; // 1-indexed, Header ist Zeile 1
    if (raw.trim().length === 0) continue; // Leerzeile toleriert
    const cells = splitCsvLine(raw);
    if (cells.length !== expectedHeader.length) {
      errors.push({
        line: lineNo,
        message: `Zeile hat ${cells.length} Spalten, erwartet ${expectedHeader.length}`,
      });
      continue;
    }
    dataSeen++;

    const datum = cells[0].trim();
    const beleg_nr = cells[1].trim();
    const soll = cells[2].trim();
    const haben = cells[3].trim();
    const betragStr = cells[4].trim();
    const beschreibung = cells[5].trim();
    const ustStr = cells[6].trim();
    const kostenstelleRaw = hasKostenstelle ? cells[7].trim() : "";
    const kostenstelle: string | null =
      hasKostenstelle && kostenstelleRaw.length > 0 ? kostenstelleRaw : null;
    const kostentraegerRaw = hasKostentraeger ? cells[8].trim() : "";
    const kostentraeger: string | null =
      hasKostentraeger && kostentraegerRaw.length > 0 ? kostentraegerRaw : null;
    const skontoPctRaw = hasSkonto ? cells[9].trim() : "";
    const skontoTageRaw = hasSkonto ? cells[10].trim() : "";

    let rowOk = true;

    // datum
    const iso = parseGermanDate(datum);
    if (!iso) {
      errors.push({
        line: lineNo,
        field: "datum",
        message: `Datum "${datum}" ist ungültig (erwartet DD.MM.YYYY)`,
      });
      rowOk = false;
    } else {
      // Fiscal-Year-Check, wenn Optionen gesetzt sind.
      const ranges = [
        options.currentFiscalYear,
        options.previousFiscalYear,
      ].filter(
        (r): r is { von: string; bis: string } =>
          r !== undefined && typeof r.von === "string" && typeof r.bis === "string"
      );
      if (ranges.length > 0) {
        const inRange = ranges.some((r) => iso >= r.von && iso <= r.bis);
        if (!inRange) {
          errors.push({
            line: lineNo,
            field: "datum",
            message: `Datum ${datum} liegt außerhalb des zulässigen Zeitraums (aktuelles + vorheriges Geschäftsjahr)`,
          });
          rowOk = false;
        }
      }
    }

    // beleg_nr — Pflichtfeld (GoBD-konform)
    if (beleg_nr.length === 0) {
      errors.push({
        line: lineNo,
        field: "beleg_nr",
        message: "beleg_nr darf nicht leer sein",
      });
      rowOk = false;
    }

    // soll_konto / haben_konto
    if (soll.length === 0) {
      errors.push({
        line: lineNo,
        field: "soll_konto",
        message: "soll_konto darf nicht leer sein",
      });
      rowOk = false;
    }
    if (haben.length === 0) {
      errors.push({
        line: lineNo,
        field: "haben_konto",
        message: "haben_konto darf nicht leer sein",
      });
      rowOk = false;
    }
    if (soll.length > 0 && haben.length > 0 && soll === haben) {
      errors.push({
        line: lineNo,
        message: "Soll- und Haben-Konto dürfen nicht identisch sein",
      });
      rowOk = false;
    }

    // betrag (Decimal)
    const betrag = parseGermanNumber(betragStr);
    if (betrag === null) {
      errors.push({
        line: lineNo,
        field: "betrag",
        message: `Betrag "${betragStr}" ist kein gültiges deutsches Zahlenformat (z.B. 1.234,56)`,
      });
      rowOk = false;
    } else if (!betrag.gt(0)) {
      errors.push({
        line: lineNo,
        field: "betrag",
        message: `Betrag muss größer als 0 sein, gelesen ${betrag.toString()}`,
      });
      rowOk = false;
    }

    // beschreibung (nur Warnung bei Länge > 60)
    if (beschreibung.length === 0) {
      errors.push({
        line: lineNo,
        field: "beschreibung",
        message: "beschreibung darf nicht leer sein",
      });
      rowOk = false;
    } else if (beschreibung.length > DESCRIPTION_WARN_LENGTH) {
      warnings.push({
        line: lineNo,
        field: "beschreibung",
        message: `Beschreibung ist ${beschreibung.length} Zeichen lang (Empfehlung DATEV EXTF 510: ≤ ${DESCRIPTION_WARN_LENGTH})`,
      });
    }

    // ust_satz
    const ust = Number(ustStr);
    if (ustStr.length === 0 || !Number.isFinite(ust)) {
      errors.push({
        line: lineNo,
        field: "ust_satz",
        message: `ust_satz "${ustStr}" ist keine gültige Zahl`,
      });
      rowOk = false;
    } else if (!ALLOWED_UST_SAETZE.has(ust)) {
      errors.push({
        line: lineNo,
        field: "ust_satz",
        message: `ust_satz muss 0, 7 oder 19 sein, gelesen ${ust}`,
      });
      rowOk = false;
    }

    // skonto_pct / skonto_tage (beide optional, beide werden zusammen
    // gesetzt oder gar nicht)
    let skontoPct: number | null = null;
    let skontoTage: number | null = null;
    if (hasSkonto) {
      if (skontoPctRaw.length > 0) {
        const parsed = parseGermanNumber(skontoPctRaw);
        if (parsed === null || !parsed.gt(0) || parsed.gt(100)) {
          errors.push({
            line: lineNo,
            field: "skonto_pct",
            message: `skonto_pct "${skontoPctRaw}" ist ungültig (erwartet > 0, ≤ 100, deutsches Zahlenformat)`,
          });
          rowOk = false;
        } else {
          skontoPct = parsed.toNumber();
        }
      }
      if (skontoTageRaw.length > 0) {
        const n = Number(skontoTageRaw);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
          errors.push({
            line: lineNo,
            field: "skonto_tage",
            message: `skonto_tage "${skontoTageRaw}" ist keine positive Ganzzahl`,
          });
          rowOk = false;
        } else {
          skontoTage = n;
        }
      }
      if ((skontoPct === null) !== (skontoTage === null)) {
        warnings.push({
          line: lineNo,
          message:
            "skonto_pct und skonto_tage sollten zusammen gesetzt sein — das fehlende Feld wird als 'kein Skonto' interpretiert.",
        });
        // Beide auf null setzen: unvollständige Skonto-Angabe bleibt wirkungslos
        skontoPct = null;
        skontoTage = null;
      }
    }

    if (rowOk && iso && betrag !== null) {
      rows.push({
        line: lineNo,
        datum: iso,
        beleg_nr,
        soll_konto: soll,
        haben_konto: haben,
        betrag,
        beschreibung,
        ust_satz: ust,
        kostenstelle,
        kostentraeger,
        skonto_pct: skontoPct,
        skonto_tage: skontoTage,
      });
    }
  }

  if (dataSeen === 0 && errors.length === 0) {
    warnings.push({
      line: 0,
      message: "Datei enthält einen Header, aber keine Datenzeilen.",
    });
  }

  return { rows, errors, warnings };
}

/** Erzeugt eine Muster-CSV mit 9-Spalten-Header (inkl. Kostenstelle UND
 *  Kostenträger) und vier Beispielzeilen: eine ohne jede Dimension, eine
 *  nur mit Kostenstelle, eine nur mit Kostenträger, eine mit beiden —
 *  demonstriert die Unabhängigkeit der beiden Felder. */
export function buildSampleCsv(): string {
  const lines = [
    EXPECTED_HEADER_WITH_KOSTENTRAEGER.join(";"),
    "02.01.2025;EB-001;0440;9000;20000,00;Eröffnungsbilanz BGA;0;;",
    "15.01.2025;AR-2025-001;1400;8400;1000,00;Ausgangsrechnung Beispielkunde;19;KST-VERTRIEB;",
    "10.02.2025;ER-2025-001;3400;1600;500,00;Wareneingang für Projekt X;19;;PROJ-2025-X",
    "31.03.2025;LG-Q1;4120;1200;3500,00;Gehaltszahlung Q1 Sammelbuchung;0;KST-VERWALTUNG;PROJ-INTERN",
  ];
  return lines.join("\r\n") + "\r\n";
}
