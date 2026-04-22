/**
 * ZM-XML Preview (ELMA5-ähnlich, Sprint 7).
 *
 * WICHTIG — NICHT produktiv: Dies ist kein gültiger BZSt-ELMA5-Datensatz.
 * Die echte Übermittlung an das BZSt erfordert entweder:
 *   - das BOP-Online-Formular (manuelle Eingabe),
 *   - oder ERiC/ELMA5-Client-Integration (außerhalb des Frontend-Scope,
 *     P1-Blocker in `CLAUDE.md` § 10).
 *
 * Dieser Builder dient:
 *   - Prüfung der drei ZM-Kennzahlen (41 IG-Lieferung, 21 IG-sonstige
 *     Leistung, 42 Dreiecksgeschäft) in einem XML-Format ähnlich
 *     ELMA5.
 *   - Input für eine spätere ELMA5-DFÜ-Integration (gleicher Daten-
 *     mapping).
 *   - Nachvollziehbarkeit für den Buchhalter bei der manuellen
 *     BOP-Eingabe (XML als strukturierter Ausdruck).
 *
 * ZM-Art-Code nach BZSt-Handbuch:
 *   - "L" = innergemeinschaftliche Lieferung (Kz 41)
 *   - "S" = innergemeinschaftliche sonstige Leistung (Kz 21)
 *   - "D" = Dreiecksgeschäft § 25b UStG (Kz 42)
 *
 * Struktur vereinfacht:
 *   <ZusammenfassendeMeldung art="ZM" version="2025">
 *     <Zeitraum jahr="YYYY" art="MONAT|QUARTAL" code="..."/>
 *     <Meldungen>
 *       <Meldung>
 *         <UStID>...</UStID>
 *         <Land>DE</Land>
 *         <Art>L|S|D</Art>
 *         <Betrag>...</Betrag>
 *       </Meldung>
 *       ...
 *     </Meldungen>
 *     <Summen>
 *       <Kz41>...</Kz41>
 *       <Kz21>...</Kz21>
 *       <Kz42>...</Kz42>
 *     </Summen>
 *   </ZusammenfassendeMeldung>
 *
 * Design-Entscheidung 15 (SPRINT-7-PLAN-DETAIL.md): Preview-Format
 * analog `UstvaXmlBuilder.ts`, nicht voll-spec-konformes ELMA5-DFÜ.
 */

import type { ZmReport } from "./ZmBuilder";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wandelt "1234.56" → "1234,56" (BZSt-Dezimal-Konvention mit Komma). */
function germanDecimal(s: string): string {
  return s.replace(".", ",");
}

function zeitraumCode(r: ZmReport): string {
  if (r.zeitraum.art === "MONAT") {
    return String(r.zeitraum.monat ?? 1).padStart(2, "0");
  }
  const q = r.zeitraum.quartal ?? 1;
  return String(40 + q); // 41..44 wie ELSTER-Konvention
}

/**
 * Erzeugt für einen `ZmReport` eine XML-Darstellung mit pro Empfänger
 * bis zu drei `<Meldung>`-Blöcken (L/S/D — abhängig davon, welche
 * Beträge > 0 sind). Kein L/S/D-Block bei Beträgen gleich 0.
 */
export function buildZmXml(report: ZmReport): string {
  const jahr = String(report.zeitraum.jahr);
  const zeitraumArt = report.zeitraum.art === "MONAT" ? "MONAT" : "QUARTAL";
  const code = zeitraumCode(report);

  const meldungen: string[] = [];
  for (const m of report.meldungen) {
    const ustid = escape(m.ustid);
    const land = escape(m.land);
    if (Number(m.igLieferungen) > 0) {
      meldungen.push(
        `      <Meldung>\n` +
          `        <UStID>${ustid}</UStID>\n` +
          `        <Land>${land}</Land>\n` +
          `        <Art>L</Art>\n` +
          `        <Betrag>${germanDecimal(escape(m.igLieferungen))}</Betrag>\n` +
          `      </Meldung>`
      );
    }
    if (Number(m.igSonstigeLeistungen) > 0) {
      meldungen.push(
        `      <Meldung>\n` +
          `        <UStID>${ustid}</UStID>\n` +
          `        <Land>${land}</Land>\n` +
          `        <Art>S</Art>\n` +
          `        <Betrag>${germanDecimal(escape(m.igSonstigeLeistungen))}</Betrag>\n` +
          `      </Meldung>`
      );
    }
    if (Number(m.dreiecksgeschaefte) > 0) {
      meldungen.push(
        `      <Meldung>\n` +
          `        <UStID>${ustid}</UStID>\n` +
          `        <Land>${land}</Land>\n` +
          `        <Art>D</Art>\n` +
          `        <Betrag>${germanDecimal(escape(m.dreiecksgeschaefte))}</Betrag>\n` +
          `      </Meldung>`
      );
    }
  }

  const meldungenBlock =
    meldungen.length > 0 ? meldungen.join("\n") : "      <!-- keine Meldungen -->";

  return `<?xml version="1.0" encoding="UTF-8"?>
<ZusammenfassendeMeldung art="ZM" version="2025">
  <Zeitraum jahr="${jahr}" art="${zeitraumArt}" code="${code}"/>
  <Meldungen>
${meldungenBlock}
  </Meldungen>
  <Summen>
    <Kz41>${germanDecimal(escape(report.summen.igLieferungenTotal))}</Kz41>
    <Kz21>${germanDecimal(escape(report.summen.igSonstigeLeistungenTotal))}</Kz21>
    <Kz42>${germanDecimal(escape(report.summen.dreiecksgeschaefteTotal))}</Kz42>
  </Summen>
  <!-- HINWEIS: Preview-XML, kein ELMA5-DFÜ-Datensatz. -->
</ZusammenfassendeMeldung>
`;
}
