// Extraktion deutscher Rechnungs-Felder aus OCR-Rohtext.
//
// Arbeitsweise: rein regelbasiert (Regex + Kontextwörter). KEIN LLM, kein
// statistisches Modell. Jedes Feld bekommt einen Confidence-Score (0..1)
// plus eine kurze Begründung, warum der Score so ist — damit Nutzer:innen
// sehen, woher der Wert stammt und wann Skepsis angebracht ist.
//
// Genauigkeits-Grenzen (ehrlich):
//   • OCR-Qualität schwankt stark je nach Vorlage (Scan-Qualität, Schriftart).
//   • Zweispaltige Rechnungen mit Kopfzeilen werden oft in falscher Reihenfolge
//     erkannt — dann rutscht "Rechnungsdatum" weit weg von seinem Wert.
//   • Lieferanten-Erkennung ist am unzuverlässigsten: nehmen meist die erste
//     nicht-triviale Textzeile. Bessere Methode: Abgleich mit bekannten
//     Lieferanten (siehe utils/supplierMatch.ts, falls vorhanden).

export type FieldConfidence = "high" | "medium" | "low";

export type ExtractedField<T> = {
  value: T | null;
  confidence: FieldConfidence;
  /** Für das UI: Warum hat der Parser dieses Ergebnis geliefert? */
  reason: string;
};

export type ExtractedInvoice = {
  rechnungsnummer: ExtractedField<string>;
  rechnungsdatum: ExtractedField<string>; // ISO YYYY-MM-DD
  faelligkeit: ExtractedField<string>; // ISO YYYY-MM-DD
  ustIdNr: ExtractedField<string>;
  netto: ExtractedField<number>;
  brutto: ExtractedField<number>;
  ustSatz: ExtractedField<number>; // 19, 7 oder 0
  lieferant: ExtractedField<string>;
  /** Volltext zur Nachschau (getrimmt auf erste ~4000 Zeichen). */
  rawText: string;
};

// ---------------------------------------------------------------------------
// Low-level Helfer
// ---------------------------------------------------------------------------

function empty<T>(reason = "nicht gefunden"): ExtractedField<T> {
  return { value: null, confidence: "low", reason };
}

function parseGermanNumber(s: string): number | null {
  const cleaned = s.replace(/\s|EUR|€/gi, "");
  // "1.234,56" oder "1234,56" oder "1234.56"
  if (/^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d+(\.\d{2})?$/.test(cleaned)) {
    return Number(cleaned);
  }
  if (/^\d+,\d{2}$/.test(cleaned)) {
    return Number(cleaned.replace(",", "."));
  }
  return null;
}

function parseGermanDate(s: string): string | null {
  // DD.MM.YYYY oder DD.MM.YY
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1990 ||
    year > 2100
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Sucht in `text` den ersten Treffer für einen der Label-Ausdrücke und gibt
 *  den Textbereich dahinter zurück (bis zum nächsten Zeilenumbruch). */
function findLabeledValue(
  text: string,
  labels: RegExp[],
  maxDistance = 60
): string | null {
  for (const label of labels) {
    const m = label.exec(text);
    if (!m) continue;
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + maxDistance);
    const line = after.split(/[\r\n]/)[0] ?? "";
    return line.trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Einzelne Felder
// ---------------------------------------------------------------------------

function extractRechnungsnummer(text: string): ExtractedField<string> {
  const labeled = findLabeledValue(
    text,
    [
      /Rechnungs(?:-?\s?)?Nr\.?\s*:?\s*/i,
      /Rechnungsnummer\s*:?\s*/i,
      /Rechnung\s+Nr\.?\s*:?\s*/i,
      /Invoice\s+No\.?\s*:?\s*/i,
      /Re\.?-?Nr\.?\s*:?\s*/i,
    ],
    40
  );
  if (labeled) {
    // Erstes alphanumerische "Wort" im gefundenen Rest
    const m = labeled.match(/[A-Z0-9][A-Z0-9/_-]{2,39}/i);
    if (m) {
      return {
        value: m[0].trim(),
        confidence: "high",
        reason: 'Label "Rechnungs-Nr." vor Wert erkannt.',
      };
    }
  }
  // Fallback: "RE-YYYY-NNNN" oder "R-XXXX" Muster irgendwo im Text
  const fallback = text.match(
    /\b(?:RE|RG|INV|R)[-_/ ]?\d{2,4}[-_/]?\d{2,6}\b/i
  );
  if (fallback) {
    return {
      value: fallback[0].replace(/\s+/g, ""),
      confidence: "medium",
      reason: "Typisches Nummernmuster gefunden, aber ohne Label.",
    };
  }
  return empty("kein Label und kein typisches Muster gefunden");
}

function extractDate(
  text: string,
  labels: RegExp[],
  fieldLabel: string
): ExtractedField<string> {
  const labeled = findLabeledValue(text, labels, 40);
  if (labeled) {
    const m = labeled.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/);
    if (m) {
      const iso = parseGermanDate(m[0]);
      if (iso) {
        return {
          value: iso,
          confidence: "high",
          reason: `Label "${fieldLabel}" vor DD.MM.YYYY erkannt.`,
        };
      }
    }
  }
  // Fallback: jedes DD.MM.YYYY im Text, das plausibel als Rechnungsdatum gelten kann
  const all = Array.from(text.matchAll(/\b(\d{1,2}\.\d{1,2}\.\d{2,4})\b/g));
  if (all.length > 0) {
    const iso = parseGermanDate(all[0][1]);
    if (iso) {
      return {
        value: iso,
        confidence: "low",
        reason: "Erstes Datum im Text — Bedeutung unsicher.",
      };
    }
  }
  return empty();
}

function extractUstIdNr(text: string): ExtractedField<string> {
  const m = text.match(/\bDE\d{9}\b/);
  if (m) {
    return {
      value: m[0],
      confidence: "high",
      reason: "Exaktes Muster DE + 9 Ziffern.",
    };
  }
  // Lockeres Muster mit optionalen Leerzeichen/Bindestrichen
  const loose = text.match(/USt[-\s]?IdNr\.?\s*:?\s*(DE[\s-]?(?:\d[\s-]?){9})/i);
  if (loose) {
    const cleaned = loose[1].replace(/[\s-]/g, "");
    if (/^DE\d{9}$/.test(cleaned)) {
      return {
        value: cleaned,
        confidence: "medium",
        reason: "USt-IdNr.-Label gefunden, Ziffern mit Trennzeichen.",
      };
    }
  }
  return empty("USt-IdNr. (DE + 9 Ziffern) nicht gefunden");
}

function extractAmount(
  text: string,
  labels: RegExp[],
  fieldLabel: string
): ExtractedField<number> {
  const labeled = findLabeledValue(text, labels, 50);
  if (labeled) {
    const amt = labeled.match(/([\d.]+,\d{2}|\d+,\d{2}|\d+\.\d{2})/);
    if (amt) {
      const n = parseGermanNumber(amt[0]);
      if (n !== null) {
        return {
          value: n,
          confidence: "high",
          reason: `Label "${fieldLabel}" direkt vor Betrag.`,
        };
      }
    }
  }
  // Fallback: größter Betrag im Text (oft = Brutto)
  const matches = Array.from(
    text.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g)
  );
  if (matches.length > 0) {
    const values = matches
      .map((m) => parseGermanNumber(m[1]))
      .filter((v): v is number => v !== null);
    if (values.length > 0) {
      const max = Math.max(...values);
      return {
        value: max,
        confidence: "low",
        reason: "Größter Euro-Betrag im Text (Label nicht erkannt).",
      };
    }
  }
  return empty();
}

function extractUstSatz(text: string, netto: number | null, brutto: number | null): ExtractedField<number> {
  // Explizit: "MwSt 19%" / "USt 7%"
  const explicit = text.match(/\b(MwSt|USt|Umsatzsteuer)\b[^0-9]{0,20}(\d{1,2})\s*%/i);
  if (explicit) {
    const pct = Number(explicit[2]);
    if ([0, 7, 19].includes(pct)) {
      return {
        value: pct,
        confidence: "high",
        reason: `Explizit genannt: ${explicit[0].trim()}.`,
      };
    }
  }
  // Abgeleitet aus Netto/Brutto
  if (netto && brutto && netto > 0 && brutto > netto) {
    const factor = brutto / netto;
    if (Math.abs(factor - 1.19) < 0.01) {
      return { value: 19, confidence: "medium", reason: "Aus Netto/Brutto berechnet (~1,19)." };
    }
    if (Math.abs(factor - 1.07) < 0.01) {
      return { value: 7, confidence: "medium", reason: "Aus Netto/Brutto berechnet (~1,07)." };
    }
  }
  return empty("weder explizit noch aus Beträgen ableitbar");
}

function extractFaelligkeit(
  text: string,
  issueDate: string | null
): ExtractedField<string> {
  // Explizit: "fällig am DD.MM.YYYY" / "Zahlbar bis DD.MM.YYYY"
  const labeled = findLabeledValue(
    text,
    [
      /Fällig\s*am\s*/i,
      /Zahlbar\s*bis\s*/i,
      /Zahlungsziel\s*:?\s*/i,
      /F(?:ä|ae)lligkeitsdatum\s*:?\s*/i,
    ],
    40
  );
  if (labeled) {
    const m = labeled.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/);
    if (m) {
      const iso = parseGermanDate(m[0]);
      if (iso) {
        return {
          value: iso,
          confidence: "high",
          reason: "Fälligkeits-Label mit DD.MM.YYYY erkannt.",
        };
      }
    }
    // Oder "14 Tage" / "innerhalb von 14 Tagen"
    const days = labeled.match(/(\d+)\s*Tage?/);
    if (days && issueDate) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + Number(days[1]));
      return {
        value: d.toISOString().slice(0, 10),
        confidence: "medium",
        reason: `Zahlungsziel "${days[0]}" ab Rechnungsdatum ${issueDate}.`,
      };
    }
  }
  // Fallback: Rechnungsdatum + 14 Tage
  if (issueDate) {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 14);
    return {
      value: d.toISOString().slice(0, 10),
      confidence: "low",
      reason: "Fällig ist nicht angegeben — Standardwert 14 Tage ab Rechnungsdatum.",
    };
  }
  return empty();
}

function extractLieferant(text: string): ExtractedField<string> {
  // Heuristik: erste nicht-leere Zeile, die nicht offensichtlich ein Label ist
  const lines = text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    if (line.length < 3) continue;
    if (/Rechnung|Invoice|Datum|Steuer|USt|Seite|Page|^[-_=]+/.test(line))
      continue;
    if (/^\d/.test(line)) continue;
    return {
      value: line.slice(0, 80),
      confidence: "low",
      reason: "Erste nicht-triviale Zeile des Dokuments — oft ungenau.",
    };
  }
  return empty("keine passende Zeile im Kopf");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function extractInvoiceFields(ocrText: string): ExtractedInvoice {
  const text = ocrText.slice(0, 12_000); // große Dokumente deckeln
  const rechnungsnummer = extractRechnungsnummer(text);
  const rechnungsdatum = extractDate(
    text,
    [/Rechnungsdatum\s*:?\s*/i, /Datum\s*:?\s*/i, /Date\s*:?\s*/i, /vom\s*/i],
    "Rechnungsdatum"
  );
  const ustIdNr = extractUstIdNr(text);
  const netto = extractAmount(
    text,
    [/Netto(?:betrag)?\s*:?\s*/i, /Zwischensumme\s*:?\s*/i, /Summe\s+netto\s*:?\s*/i],
    "Netto"
  );
  const brutto = extractAmount(
    text,
    [
      /Brutto(?:betrag)?\s*:?\s*/i,
      /Gesamtbetrag\s*:?\s*/i,
      /Rechnungsbetrag\s*:?\s*/i,
      /Gesamtsumme\s*:?\s*/i,
      /Zu\s+zahlen\s*:?\s*/i,
    ],
    "Brutto / Gesamtbetrag"
  );
  const ustSatz = extractUstSatz(text, netto.value, brutto.value);
  const faelligkeit = extractFaelligkeit(text, rechnungsdatum.value);
  const lieferant = extractLieferant(text);

  return {
    rechnungsnummer,
    rechnungsdatum,
    faelligkeit,
    ustIdNr,
    netto,
    brutto,
    ustSatz,
    lieferant,
    rawText: text,
  };
}
