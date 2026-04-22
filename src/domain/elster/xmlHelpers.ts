/**
 * Gemeinsame Helper fuer ELSTER-XML-Builder (Sprint 14).
 *
 * Warum separat: escape(), germanDecimal() und zeitraumCode() existieren
 * mehrfach dupliziert (UstvaXmlBuilder, ebilanz/EbilanzXbrlBuilder,
 * utils/datev, utils/elster). Innerhalb der neuen src/domain/elster-
 * Familie wird NUR dieses Modul referenziert — so bleibt die XSD-
 * Schema-Update-Pflege auf einen Ort konzentriert.
 */

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wandelt "1234.56" in "1234,56" (ERiC-Dezimalformat mit Komma). */
export function germanDecimal(s: string): string {
  return s.replace(".", ",");
}

/** Konvertiert Zahl zu fester 2-Nachkommastellen-Darstellung im ERiC-Format. */
export function moneyToElster(n: number | string): string {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "0,00";
  return germanDecimal(v.toFixed(2));
}

/**
 * ELSTER-Zeitraum-Code:
 *  - Monat  → "01" .. "12"
 *  - Quartal → "41", "42", "43", "44"
 *  - Jahr   → "01" (Januar als Platzhalter fuer Jahresmeldung)
 *
 * Diese Kodierung ist kongruent zur UStVA-Konvention in
 * `src/domain/ustva/UstvaXmlBuilder.ts`.
 */
export function zeitraumCode(
  art: "MONAT" | "QUARTAL" | "JAHR",
  monat?: number,
  quartal?: 1 | 2 | 3 | 4
): string {
  if (art === "MONAT") {
    return String(monat ?? 1).padStart(2, "0");
  }
  if (art === "QUARTAL") {
    return String(40 + (quartal ?? 1));
  }
  // JAHR → 01 (Jahresmeldung, v.a. LStA-Jahresanmeldung).
  return "01";
}
