// Normalisierung und Validierung von Kontonummern (SKR03/SKR04).
//
// Leitlinien:
//   • Immer 4 Stellen (SKR03) bzw. 4–6 Stellen (SKR04-Konzerne). Eingaben wie
//     "123" werden auf "0123" gepolstert; Leerzeichen und Punkte werden
//     entfernt.
//   • Validiert wird das FORMAT und eine grobe Bereichsprüfung gegen die
//     Kategorie (aktiva/passiva/aufwand/ertrag) — keine vollständige
//     SKR-Feldprüfung. Eine vollständige Validierung würde den gesamten
//     SKR-Kontenrahmen als Referenz mitbringen müssen, was wir bewusst
//     nicht tun.
//   • Vorschläge aus der Beschreibung: simple Keyword-Heuristik gegen die
//     `bezeichnung` der bereits angelegten Konten. KEINE KI, keine
//     statistische Zuordnung, keine externe Datenbank.

import type { Account, SKR } from "../types/db";

/** Entfernt Trenner, polstert links mit Nullen auf mindestens 4 Stellen. */
export function padKontoNr(raw: string, minLength = 4): string {
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.length >= minLength) return digits;
  return digits.padStart(minLength, "0");
}

export function isValidKontoNr(raw: string): boolean {
  const d = raw.replace(/[^0-9]/g, "");
  return d.length >= 4 && d.length <= 8;
}

export type SkrRangeCheck = {
  ok: boolean;
  reason?: string;
  /** Empfohlene Kategorie gemäß groben Bereichs-Regeln. */
  kategorie_hint?: "aktiva" | "passiva" | "aufwand" | "ertrag";
};

/** Grobe Bereichsprüfung. Die Werte sind bewusst defensiv gesetzt — es wird
 *  keine Aussage über feldspezifische SKR-Konten getroffen, nur der
 *  Rahmen-Bereich ("Klasse"). Falsche Zuordnungen werden als Warnung
 *  gemeldet, nicht als harter Fehler. */
export function validateSkrRange(raw: string, skr: SKR): SkrRangeCheck {
  if (!isValidKontoNr(raw)) {
    return {
      ok: false,
      reason: "Kontonummer muss 4–8 Ziffern lang sein.",
    };
  }
  const padded = padKontoNr(raw);
  const klasse = Number(padded[0]);
  if (!Number.isFinite(klasse)) {
    return { ok: false, reason: "Erste Stelle muss numerisch sein." };
  }

  // Grobe Bereichsregeln, gültig für SKR03 (und für SKR04 nur näherungsweise):
  //   Klasse 0  — Anlagevermögen (Aktiva)
  //   Klasse 1  — Umlaufvermögen (Aktiva), auch 1600 = Verb. aLL
  //   Klasse 2  — neutrale Aufwendungen/Erträge
  //   Klasse 3  — Wareneinkauf / Vorräte
  //   Klasse 4  — Betriebliche Aufwendungen
  //   Klasse 5–6 — Aufwendungen (teilweise SKR04 anders)
  //   Klasse 7  — Finanz
  //   Klasse 8  — Erlöse
  //   Klasse 9  — Vortrags-/statistische Konten
  const hint: Record<number, "aktiva" | "passiva" | "aufwand" | "ertrag"> = {
    0: "aktiva",
    1: "aktiva",
    2: "aufwand",
    3: "aufwand",
    4: "aufwand",
    5: "aufwand",
    6: "aufwand",
    7: "aufwand",
    8: "ertrag",
    9: "passiva",
  };

  // Bekannte Spezialfälle — nur SKR03. Ausnahmen werden als "passiva" markiert.
  if (skr === "SKR03") {
    const n = Number(padded);
    if (n >= 1600 && n <= 1699) {
      return { ok: true, kategorie_hint: "passiva" };
    }
    if (n >= 1700 && n <= 1799) {
      return { ok: true, kategorie_hint: "passiva" };
    }
    if (n >= 1800 && n <= 1899) {
      return { ok: true, kategorie_hint: "passiva" };
    }
    if (n >= 800 && n <= 899) {
      // Eigenkapital
      return { ok: true, kategorie_hint: "passiva" };
    }
  }

  return { ok: true, kategorie_hint: hint[klasse] };
}

/** Vergleicht den zur tatsächlich gewählten Kategorie passenden Hint mit
 *  der vom Nutzer gewählten. Gibt einen menschlichen Warnungs-Text zurück,
 *  wenn sie abweichen; sonst null. */
export function warnOnKategorieMismatch(
  konto_nr: string,
  kategorie: "aktiva" | "passiva" | "aufwand" | "ertrag",
  skr: SKR
): string | null {
  const check = validateSkrRange(konto_nr, skr);
  if (!check.ok || !check.kategorie_hint) return null;
  if (check.kategorie_hint === kategorie) return null;
  return (
    `Kontonummer ${padKontoNr(konto_nr)} passt laut SKR-Klasse eher zu ` +
    `"${check.kategorie_hint}" statt zur gewählten Kategorie "${kategorie}". ` +
    `Wenn Sie Ihren Kontenrahmen individuell angepasst haben, können Sie ` +
    `dies ignorieren.`
  );
}

/** Zerlegt eine Beschreibung in Wörter (>= 3 Buchstaben), entfernt Dubletten. */
function tokenize(s: string): string[] {
  const out = new Set<string>();
  for (const raw of s.toLowerCase().split(/[^a-zäöüß0-9]+/)) {
    if (raw.length >= 3) out.add(raw);
  }
  return Array.from(out);
}

/** Schlägt bis zu 5 Konten vor, deren bezeichnung die meisten Tokens der
 *  Beschreibung enthält. Einfache Heuristik, keine ML. */
export function suggestAccountsByDescription(
  description: string,
  accounts: Account[],
  limit = 5
): Account[] {
  const tokens = tokenize(description);
  if (tokens.length === 0) return [];
  type Scored = { acc: Account; score: number };
  const scored: Scored[] = [];
  for (const acc of accounts) {
    if (!acc.is_active) continue;
    const bez = acc.bezeichnung.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (bez.includes(t)) score += t.length; // längere Treffer zählen mehr
    }
    if (score > 0) scored.push({ acc, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.acc);
}

/** Bekannte Stichwörter → Beispiel-SKR03-Konten. Fallback, wenn der aktive
 *  Kontenplan ein Stichwort nicht abdeckt. */
const SKR03_KEYWORD_HINTS: { pattern: RegExp; konto_nr: string; label: string }[] = [
  { pattern: /\bmiete|raum|pacht\b/i, konto_nr: "4210", label: "Miete (4210)" },
  { pattern: /\btelefon|handy|mobilfunk\b/i, konto_nr: "4920", label: "Telefon (4920)" },
  { pattern: /\binternet|dsl|glasfaser\b/i, konto_nr: "4925", label: "Internet (4925)" },
  { pattern: /\bstrom|gas|heizung|energie\b/i, konto_nr: "4240", label: "Gas, Strom, Wasser (4240)" },
  { pattern: /\bbüro|buero|bueromaterial\b/i, konto_nr: "4930", label: "Bürobedarf (4930)" },
  { pattern: /\bporto|briefmarke|post\b/i, konto_nr: "4910", label: "Porto (4910)" },
  { pattern: /\breise|hotel|bahn|bahnfahrt\b/i, konto_nr: "4670", label: "Reisekosten (4670)" },
  { pattern: /\bbenzin|diesel|tanken\b/i, konto_nr: "4530", label: "Laufende Kfz-Betriebskosten (4530)" },
  { pattern: /\bhonorar|beratung\b/i, konto_nr: "4960", label: "Beratungskosten (4960)" },
  { pattern: /\brechtsanwalt|rechtsberatung\b/i, konto_nr: "4957", label: "Rechts- und Beratungskosten (4957)" },
  { pattern: /\bbuchhaltung|steuerberat|steuer\b/i, konto_nr: "4957", label: "Rechts- und Beratungskosten (4957)" },
  { pattern: /\bwerbung|marketing|anzeige\b/i, konto_nr: "4610", label: "Werbekosten (4610)" },
  { pattern: /\bbewirtung|essen|restaurant\b/i, konto_nr: "4650", label: "Bewirtungskosten (4650)" },
];

export type KeywordHint = {
  pattern: string;
  konto_nr: string;
  label: string;
};

/** Liefert Keyword-basierte Hinweise, auch wenn der aktive Kontenplan die
 *  Konten noch nicht kennt (z. B. bei frischem Projekt). Bei SKR04 liefert
 *  die Funktion aktuell keine Vorschläge, weil wir den SKR04-Katalog nicht
 *  bereitstellen. */
export function keywordHintsFor(
  description: string,
  skr: SKR
): KeywordHint[] {
  if (skr !== "SKR03") return [];
  const matches: KeywordHint[] = [];
  for (const h of SKR03_KEYWORD_HINTS) {
    if (h.pattern.test(description)) {
      matches.push({
        pattern: h.pattern.source,
        konto_nr: h.konto_nr,
        label: h.label,
      });
    }
  }
  // Duplikate vermeiden
  const seen = new Set<string>();
  return matches.filter((m) => {
    if (seen.has(m.konto_nr)) return false;
    seen.add(m.konto_nr);
    return true;
  });
}
