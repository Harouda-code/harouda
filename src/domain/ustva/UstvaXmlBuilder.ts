/**
 * UStVA XML Preview (ELSTER-Schema-ähnlich).
 *
 * WICHTIG — NICHT produktiv: Dies ist kein gültiger ELSTER-ERiC-Datensatz.
 * Die echte Übermittlung erfordert die ERiC-Bibliothek (C++ native .dll)
 * der BZSt — nicht Teil dieses Projekts. Diese XML-Darstellung dient:
 *   - Prüfung der Kennzahl-Werte in einem der ELSTER-XML-Struktur
 *     ähnlichen Format
 *   - Input für eine zukünftige ERiC-Integration (gleicher Kz-Mapping)
 *
 * Struktur vereinfacht nach BMF-Datensatz UStVA 2025:
 *   <Anmeldungssteuern art="UStVA" version="2025">
 *     <DatenTeil>
 *       <Nutzdaten>
 *         <Anmeldungszeitraum jahr="YYYY" zeitraum="..."/>
 *         <Steuerfall>
 *           <Umsatzsteuervoranmeldung>
 *             <Kz81>...</Kz81>
 *             <Kz81_USt>...</Kz81_USt>
 *             ...
 *           </Umsatzsteuervoranmeldung>
 *         </Steuerfall>
 *       </Nutzdaten>
 *     </DatenTeil>
 *   </Anmeldungssteuern>
 */

import type { UstvaReport } from "./UstvaBuilder";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** zeitraum-Code: "01"-"12" für Monate, "41"-"44" für Quartale (ELSTER-Konvention). */
function zeitraumCode(r: UstvaReport): string {
  if (r.zeitraum.art === "MONAT") {
    return String(r.zeitraum.monat ?? 1).padStart(2, "0");
  }
  const q = r.zeitraum.quartal ?? 1;
  return String(40 + q); // 41,42,43,44
}

/** Wandelt "1234.56" → "1234,56" (ERiC-Dezimal-Konvention mit Komma). */
function germanDecimal(s: string): string {
  return s.replace(".", ",");
}

export function buildUstvaXml(report: UstvaReport): string {
  const jahr = String(report.zeitraum.jahr);
  const zeitraum = zeitraumCode(report);

  // Nur "echte" Kz (keine SUBTOTAL/FINAL_RESULT/INFO) in XML — ELSTER
  // erwartet die Formular-Zeilen, Summen werden vom Server berechnet.
  // Ausnahme: Kz 65 ist die Zahllast und Teil der XML-Zeilen.
  const lines: string[] = [];
  for (const kv of report.kennzahlen) {
    const raw = kv.wertRaw;
    if (raw.isZero() && kv.kz !== "65") continue;
    if (kv.type === "SUBTOTAL") continue;
    if (kv.type === "INFO") continue;
    // Für STEUERBETRAG/STEUERBETRAG_AGGREGAT: der Kz-Code in XML ist
    // Kz81_USt o. ä. — wir nutzen den Struktur-Code (z. B. "81_STEUER")
    // und ersetzen "_STEUER" durch "_USt" und "47" bleibt.
    const tag = kv.kz.includes("_STEUER")
      ? `Kz${kv.kz.replace("_STEUER", "_USt")}`
      : `Kz${kv.kz}`;
    lines.push(
      `        <${tag}>${germanDecimal(escape(kv.wert))}</${tag}>`
    );
  }

  const dauerfristAttr = report.dauerfrist.active ? ' dauerfrist="1"' : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Anmeldungssteuern art="UStVA" version="2025">
  <DatenTeil>
    <Nutzdaten>
      <Anmeldungszeitraum jahr="${jahr}" zeitraum="${zeitraum}"${dauerfristAttr}/>
      <Steuerfall>
        <Umsatzsteuervoranmeldung>
${lines.join("\n")}
        </Umsatzsteuervoranmeldung>
      </Steuerfall>
    </Nutzdaten>
  </DatenTeil>
  <!-- HINWEIS: Preview-XML, kein ERiC-Datensatz. -->
</Anmeldungssteuern>
`;
}
