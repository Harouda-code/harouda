/**
 * DATEV-Format Konstanten und Hilfsfunktionen (Export UND Import).
 *
 * Version: EXTF 510 / Datenkategorie 21 (Buchungsstapel)
 * Spezifikation: DATEV-Format-Schnittstellen-Dokumentation Version 7.
 *
 * Diese Implementation ist KEIN zertifiziertes DATEV-Format, sondern eine
 * nachgebildete Darstellung für den Export. Sie orientiert sich an der
 * offiziellen Feldliste und erzeugt einen Datensatz, der von DATEV-Software
 * (Kanzlei-Rechnungswesen / Unternehmen online) importiert werden kann —
 * jedoch sollte jeder Kunde vor produktivem Einsatz die Kompatibilität
 * in seiner Umgebung prüfen.
 *
 * Technische Anforderungen:
 *   - Zeichenkodierung: ISO-8859-1 (Windows-1252 kompatibel)
 *   - Feldtrennzeichen: Semikolon (;)
 *   - Dezimaltrennzeichen: Komma (,)
 *   - Textfelder in Anführungszeichen: "..."
 *   - Zeilenenden: CRLF (\r\n)
 *   - Datumsformat (Buchungszeile): TTMM (4 Zeichen, Jahr aus Header)
 *   - Datumsformat (Header): YYYYMMDD
 *
 * Import-Hinweise: `fromLatin1Bytes`, `ustSatzForBuSchluessel`,
 * `datevDateShortToIso`, `parseDatevDecimal` sind die symmetrischen
 * Gegenstücke zu den Export-Helpern und werden vom DatevExtfImporter genutzt.
 */

import Decimal from "decimal.js";

export const DATEV_FORMAT = {
  VERSION: 510 as const,
  CATEGORY_BUCHUNGSSTAPEL: 21 as const,
  CATEGORY_NAME: "Buchungsstapel" as const,
  FORMAT_CATEGORY_VERSION: 7 as const,
  SEPARATOR: ";" as const,
  LINE_ENDING: "\r\n" as const,
  WKZ_DEFAULT: "EUR" as const,
  SKR03: "SKR03" as const,
  /** Sachkontenlänge in Ziffern. SKR03: 4. */
  SACHKONTENLAENGE_SKR03: 4 as const,
};

/**
 * DATEV Buchungsstapel-Spaltenköpfe (Zeile 2 der CSV).
 * Aktuell unterstützen wir die ersten 14 Pflichtfelder plus einige
 * optionale Felder. Weitere Spalten werden leer angelegt.
 */
export const DATEV_COLUMN_HEADERS = [
  "Umsatz (ohne Soll/Haben-Kz)", // 1 — Betrag in Euro, mit Komma
  "Soll/Haben-Kennzeichen", // 2 — "S" oder "H"
  "WKZ Umsatz", // 3 — "EUR"
  "Kurs", // 4
  "Basis-Umsatz", // 5
  "WKZ Basis-Umsatz", // 6
  "Konto", // 7 — SKR03-Konto (Soll-Konto)
  "Gegenkonto (ohne BU-Schlüssel)", // 8
  "BU-Schlüssel", // 9 — Steuer-/Buchungsschlüssel
  "Belegdatum", // 10 — TTMM
  "Belegfeld 1", // 11 — Rechnungs-/Belegnummer max. 12 Zeichen
  "Belegfeld 2", // 12 — freitext
  "Skonto", // 13 — Skontobetrag
  "Buchungstext", // 14 — max. 60 Zeichen
] as const;

/** Anzahl Spalten, die wir erzeugen (inkl. leerer Felder auf Positionen > 14). */
export const DATEV_TOTAL_COLUMNS = DATEV_COLUMN_HEADERS.length;

/** 0-indizierte Positionen der Pflicht- und Kost-Felder in einer DATEV-EXTF-
 *  Buchungszeile. Für den Importer. KOST1/KOST2 folgen der offiziellen
 *  EXTF-510-Spezifikation (Position 37/38, 1-indexiert → 36/37 0-indexiert).
 *  Der hausinterne Exporter erzeugt nur Felder 0-13, daher bleiben KOST bei
 *  Round-Trip-Exporten leer. */
export const DATEV_COLUMN_POSITIONS = {
  UMSATZ: 0,
  SOLL_HABEN: 1,
  WKZ_UMSATZ: 2,
  KURS: 3,
  BASIS_UMSATZ: 4,
  WKZ_BASIS_UMSATZ: 5,
  KONTO: 6,
  GEGENKONTO: 7,
  BU_SCHLUESSEL: 8,
  BELEGDATUM: 9,
  BELEGFELD_1: 10,
  BELEGFELD_2: 11,
  SKONTO: 12,
  BUCHUNGSTEXT: 13,
  /** Positionen gemäß EXTF-510-Spezifikation, 1-indexiert: 37 / 38. */
  KOST1: 36,
  KOST2: 37,
} as const;

/** ISO-8859-1-kompatibler Byte-Stream aus einem UTF-16-String. */
export function toLatin1Bytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    // Zeichen > 0xFF werden verlustbehaftet auf '?' gekappt.
    const c = s.charCodeAt(i);
    out[i] = c > 0xff ? 0x3f : c;
  }
  return out;
}

/** Escape + Truncate für ein DATEV-Textfeld. */
export function datevTextField(
  text: string | null | undefined,
  maxLen: number
): string {
  if (text == null) return '""';
  // Steuerzeichen entfernen (Zeilenumbrüche, Tabs)
  let t = text.replace(/[\r\n\t]/g, " ");
  // Doppelte Anführungszeichen durch zwei ersetzen (CSV-Standard)
  t = t.replace(/"/g, '""');
  if (t.length > maxLen) t = t.slice(0, maxLen);
  return `"${t}"`;
}

/** DATEV-Zahlenformat: "1234,56" (immer positive Zahl; Vorzeichen über S/H). */
export function datevDecimal(n: string): string {
  // n kommt als "1234.56" von Money.toFixed2() — Komma einsetzen.
  // Absolutbetrag: etwaiges Minus abschneiden (Vorzeichen über Soll/Haben-Kz).
  const unsigned = n.startsWith("-") ? n.slice(1) : n;
  return unsigned.replace(".", ",");
}

/** Datum YYYY-MM-DD → "TTMM". */
export function datevDateShort(iso: string): string {
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`ungültiges Datum: ${iso}`);
  return `${m[2]}${m[1]}`;
}

/** Datum YYYY-MM-DD → "YYYYMMDD" (für Header-Zeile). */
export function datevDateLong(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Header-Timestamp: YYYYMMDDHHmmssSSS (UTC). */
export function datevHeaderTimestamp(now = new Date()): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
    `${pad(now.getMilliseconds(), 3)}`
  );
}

/** Standard BU-Schlüssel für Steuersätze (nicht erschöpfend).
 *  Quelle: DATEV-Dokumentation "Steuerschlüssel" (SKR03). */
export function buSchluesselForUstSatz(
  ustSatz: number | null | undefined
): string {
  if (ustSatz == null) return "";
  // Typische DATEV SKR03-Konventionen:
  //   7 %  Umsatzsteuer → "2"  (Ausgang 7 %), Vorsteuer 7 % → "8"
  //   19 % Umsatzsteuer → "3"  (Ausgang 19 %), Vorsteuer 19 % → "9"
  // Wir wählen die häufigsten Codes — Anwender können bei Bedarf anpassen.
  // Da wir allein aus dem Saldo nicht wissen, ob es ein Ein- oder Ausgangsumsatz
  // ist, verwenden wir keine BU-Schlüssel, wenn nicht über Gegenkonten-Inferenz
  // eindeutig — gebunden an das Automatikkonto reicht DATEV oft aus.
  if (ustSatz === 0.07) return "2";
  if (ustSatz === 0.19) return "3";
  if (ustSatz === 0) return "1";
  return "";
}

// ---------------------------------------------------------------------------
// IMPORT-HELPERS — symmetrisches Gegenstück zu den Export-Funktionen oben
// ---------------------------------------------------------------------------

/** ISO-8859-1 Byte-Stream → UTF-16-String. Inverse zu `toLatin1Bytes`.
 *  Jedes Byte wird als Codepoint interpretiert (0x00-0xFF → U+0000-U+00FF).
 *
 *  Hinweis: Der Exporter nutzt eine **einfache** ISO-8859-1-Kodierung, die
 *  Windows-1252-Sonderzeichen (€ = 0x80, ‚ = 0x82, …) nicht erhält —
 *  Zeichen außerhalb Latin-1 werden beim Export verlustbehaftet auf '?'
 *  gekippt. Symmetrisch dazu decodiert dieser Importer das Ergebnis 1:1
 *  als Latin-1; ein separater CP-1252-Mapper ist nur dann sinnvoll, wenn
 *  der Exporter ebenfalls CP-1252-aware wird. */
export function fromLatin1Bytes(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

/** Inverse zu `buSchluesselForUstSatz`.
 *
 *  Wichtig — asymmetrisches Rückgabeformat: diese Funktion liefert den
 *  **USt-Satz als Ganzzahl-Prozent** (0, 7, 19), passend zur Konvention
 *  von `JournalEntry.ust_satz` im Codebase (siehe `csvImport.ts`).
 *  Die Vorwärts-Funktion `buSchluesselForUstSatz` erwartet hingegen eine
 *  **Dezimalbruch-Darstellung** (0.07 = 7 %), weil sie aus `Account.ust_satz`
 *  gespeist wird. Beide Seiten stehen für denselben Steuersatz, nur in
 *  unterschiedlicher numerischer Schreibweise.
 *
 *  BU-Schlüssel-Mapping:
 *    "" / "1"   → 0  (keine Steuer)
 *    "2" / "8"  → 7  (7 % Ausgang / Vorsteuer)
 *    "3" / "9"  → 19 (19 % Ausgang / Vorsteuer)
 *    sonst       → null (unbekannter Schlüssel, Aufrufer entscheidet)
 */
export function ustSatzForBuSchluessel(bu: string): number | null {
  const t = bu.trim();
  if (t === "" || t === "1") return 0;
  if (t === "2" || t === "8") return 7;
  if (t === "3" || t === "9") return 19;
  return null;
}

/** Inverse zu `datevDateShort`. DATEV schreibt nur "TTMM"; das Jahr liegt
 *  im Header-Block (Wirtschaftsjahr). Der Aufrufer muss es mitgeben.
 *
 *  Rückgabe ISO YYYY-MM-DD oder `null` bei Formatfehler bzw. ungültigem
 *  Datum (z. B. 31.02.). */
export function datevDateShortToIso(
  ddmm: string,
  wirtschaftsjahr: number
): string | null {
  const m = ddmm.trim().match(/^(\d{2})(\d{2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const iso = `${wirtschaftsjahr.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const check = new Date(iso + "T00:00:00Z");
  if (
    check.getUTCFullYear() !== wirtschaftsjahr ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return iso;
}

/** Inverse zu `datevDateLong`. YYYYMMDD → ISO YYYY-MM-DD, oder null. */
export function datevDateLongToIso(yyyymmdd: string): string | null {
  const m = yyyymmdd.trim().match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
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

/** Inverse zu `datevDecimal`. DATEV-Zahlenformat: "1234,56" → Decimal.
 *  Keine Tausendertrennung in DATEV-Zeilen, daher striktere Regex als bei
 *  `parseGermanNumber` (csvImport.ts). Rückgabe null bei Formatfehler. */
export function parseDatevDecimal(raw: string): Decimal | null {
  const t = raw.trim();
  if (t.length === 0) return null;
  if (!/^-?\d+(,\d+)?$/.test(t)) return null;
  try {
    const d = new Decimal(t.replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}
