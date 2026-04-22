/**
 * ZM (Zusammenfassende Meldung) ELSTER-XML-Builder (Sprint 14 / Schritt 3).
 *
 * Rechtsbasis: § 18a UStG — monatliche oder quartalsweise ZM fuer
 * EU-B2B-Umsaetze.
 *
 * Abgrenzung zu `src/domain/ustva/ZmXmlBuilder.ts`: jener produziert ein
 * ELMA5-aehnliches Format (`<ZusammenfassendeMeldung>`) und steht fuer
 * die BZSt-BOP-Eingabe-Unterstuetzung. Dieser Builder hier liefert das
 * ELSTER-kompatible `<Anmeldungssteuern art="ZM" version="2025">`-
 * Envelope, parallel zur UStVA-Struktur — passend zum Sprint-14-Ziel,
 * eine einheitliche ELSTER-Family zu haben.
 *
 * WICHTIG — NICHT produktiv: Dies ist kein gueltiger ELSTER-ERiC-
 * Datensatz. Die echte Uebermittlung erfordert ERiC (C++ DLL) bzw.
 * das BOP-Online-Portal.
 *
 * XSD-RECHTSFLAGGE: Schema-Version wird im Output als Attribut
 * version="..." und in result.schema_version gefuehrt. Update-Prozess
 * siehe docs/ELSTER-SCHEMA-UPDATE-GUIDE.md.
 */

import type { ZmReport } from "../ustva/ZmBuilder";
import { validateUstId } from "../../lib/validation/ustIdValidator";
import { xmlEscape, germanDecimal, zeitraumCode } from "./xmlHelpers";

export const ZM_ELSTER_SCHEMA_VERSION = "2025-04";

export type ZmLeistungsart = "W" | "D" | "S";

export type ZmElsterXmlMeta = {
  /** USt-IdNr des meldenden Unternehmens, z. B. "DE123456789". */
  eigene_ust_id: string;
};

export type ZmElsterXmlResult = {
  xml: string;
  schema_version: string;
  generated_at: string;
  warnings: string[];
  /** Summe aller Einzel-Betraege im Dokument (sanity check). */
  summe_gesamt: string;
  eintraege_count: number;
};

export function buildZmElsterXml(
  report: ZmReport,
  meta: ZmElsterXmlMeta
): ZmElsterXmlResult {
  const warnings: string[] = [];

  // Eigene USt-IdNr pruefen.
  const own = validateUstId(meta.eigene_ust_id);
  if (!own.isValid) {
    warnings.push(
      `Eigene USt-IdNr "${meta.eigene_ust_id}" ist formal ungueltig: ` +
        own.errors.join(", ")
    );
  }

  // Zeitraum-Code wie bei UStVA/LStA: "01"-"12" fuer Monate, "41"-"44"
  // fuer Quartale.
  const jahr = String(report.zeitraum.jahr);
  const zrCode = zeitraumCode(
    report.zeitraum.art,
    report.zeitraum.monat,
    report.zeitraum.quartal
  );

  // Meldungs-Zeilen: pro Empfaenger ein Eintrag pro Leistungsart W/S/D
  // ausgeben, sofern Betrag > 0.
  const lines: string[] = [];
  let summeGesamt = 0;
  let eintraegeCount = 0;

  for (const m of report.meldungen) {
    // Empfaenger-USt-IdNr pruefen.
    const v = validateUstId(m.ustid);
    if (!v.isValid) {
      warnings.push(
        `Empfaenger-USt-IdNr "${m.ustid}" ist formal ungueltig: ` +
          v.errors.join(", ")
      );
    }

    // Drei Leistungsarten, jeweils eigenen <Meldung>-Block pro Nicht-0.
    const entries: Array<[ZmLeistungsart, string, string]> = [
      ["W", m.igLieferungen, "IG-Lieferung"],
      ["S", m.igSonstigeLeistungen, "IG-sonstige-Leistung"],
      ["D", m.dreiecksgeschaefte, "Dreiecksgeschaeft"],
    ];

    for (const [art, betragStr] of entries) {
      const n = Number(betragStr);
      if (!Number.isFinite(n) || n === 0) continue;
      summeGesamt += n;
      eintraegeCount += 1;
      lines.push(
        [
          `        <Meldung art="${art}">`,
          `          <UStId>${xmlEscape(m.ustid)}</UStId>`,
          `          <Land>${xmlEscape(m.land)}</Land>`,
          `          <Betrag>${germanDecimal(betragStr)}</Betrag>`,
          `        </Meldung>`,
        ].join("\n")
      );
    }
  }

  if (eintraegeCount === 0) {
    warnings.push("Keine Umsaetze im Zeitraum — Nullmeldung.");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Anmeldungssteuern art="ZM" version="2025">
  <DatenTeil>
    <Nutzdaten>
      <Anmeldungszeitraum jahr="${jahr}" zeitraum="${zrCode}"/>
      <Steuerfall ustId="${xmlEscape(meta.eigene_ust_id)}">
        <ZusammenfassendeMeldung>
${lines.join("\n")}
          <Summen>
            <Kz41>${germanDecimal(report.summen.igLieferungenTotal)}</Kz41>
            <Kz21>${germanDecimal(report.summen.igSonstigeLeistungenTotal)}</Kz21>
            <Kz42>${germanDecimal(report.summen.dreiecksgeschaefteTotal)}</Kz42>
          </Summen>
        </ZusammenfassendeMeldung>
      </Steuerfall>
    </Nutzdaten>
  </DatenTeil>
  <!-- HINWEIS: Preview-XML, kein ERiC-Datensatz. Schema-Stand: ${ZM_ELSTER_SCHEMA_VERSION}. -->
</Anmeldungssteuern>
`;

  return {
    xml,
    schema_version: ZM_ELSTER_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    warnings,
    summe_gesamt: summeGesamt.toFixed(2),
    eintraege_count: eintraegeCount,
  };
}
