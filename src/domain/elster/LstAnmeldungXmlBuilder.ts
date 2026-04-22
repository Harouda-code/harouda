/**
 * LSt-Anmeldung ELSTER-XML-Builder (Sprint 14 / Schritt 2).
 *
 * Rechtsbasis: § 41a EStG (monatliche/quartalsweise Lohnsteueranmeldung).
 *
 * WICHTIG — NICHT produktiv: Dies ist kein gueltiger ELSTER-ERiC-
 * Datensatz. Die echte Uebermittlung erfordert die ERiC-Bibliothek
 * (C++ native DLL) des BZSt — nicht Teil dieses Projekts (P1-Blocker
 * in CLAUDE.md §10). Diese XML-Repraesentation dient:
 *   - strukturierter Voransicht der Kennzahlen im ELSTER-Schema-Format,
 *   - Input fuer eine spaetere ERiC-Integration (gleicher Kz-Mapping),
 *   - Nachvollziehbarkeit fuer den Sachbearbeiter beim BOP-Online-
 *     Portal.
 *
 * XSD-Schema (simplified nach ElsterLohnAnmeldung 2025):
 *   <Anmeldungssteuern art="LStA" version="2025">
 *     <DatenTeil>
 *       <Nutzdaten>
 *         <Anmeldungszeitraum jahr="YYYY" zeitraum="..."/>
 *         <Steuerfall steuernummer="..." betriebsnummer="...">
 *           <Lohnsteueranmeldung>
 *             <Kz10>...</Kz10>
 *             <Kz41>...</Kz41>
 *             ...
 *           </Lohnsteueranmeldung>
 *         </Steuerfall>
 *       </Nutzdaten>
 *     </DatenTeil>
 *   </Anmeldungssteuern>
 *
 * XSD-RECHTSFLAGGE: Das BMF/ELSTER aktualisiert das XSD jaehrlich. Die
 * Schema-Version ist im Output als Attribut version="..." und im
 * report.schema_version hinterlegt. Update-Prozess:
 * docs/ELSTER-SCHEMA-UPDATE-GUIDE.md.
 */

import type { LohnsteuerAnmeldungReport } from "../lohn/LohnsteuerAnmeldungBuilder";
import { xmlEscape, moneyToElster, zeitraumCode } from "./xmlHelpers";

export const LSTA_ELSTER_SCHEMA_VERSION = "2025-04";

export type LstAnmeldungXmlMeta = {
  /** Steuernummer im Finanzamt-Format, z. B. "143/456/78901". */
  steuernummer: string;
  /** Dauerfristverlaengerung nach § 41a Abs. 2 S. 2 EStG gesetzt? */
  dauerfrist?: boolean;
};

export type LstAnmeldungXmlResult = {
  xml: string;
  schema_version: string;
  generated_at: string;
  warnings: string[];
};

export function buildLstAnmeldungXml(
  report: LohnsteuerAnmeldungReport,
  meta: LstAnmeldungXmlMeta
): LstAnmeldungXmlResult {
  const warnings: string[] = [];

  // Heuristik: wenn keine Abrechnungen im Zeitraum (Kz10="0"), warnen.
  if (report.kennzahlen["10"] === "0.00" || report.kennzahlen["10"] === "0") {
    warnings.push(
      "Keine Abrechnungen im Zeitraum gefunden — Nullmeldung wird generiert."
    );
  }

  // Heuristik: wenn Kirchensteuer nur auf einer Konfession liegt (ev oder
  // rk ist 0, die andere nicht), kein konfessions-Split noetig.
  const kstEv = report._internal.kirchensteuer_ev;
  const kstRk = report._internal.kirchensteuer_rk;
  if (kstEv.isZero() && !kstRk.isZero()) {
    // nur rk — alles gut.
  } else if (!kstEv.isZero() && kstRk.isZero()) {
    // nur ev — alles gut.
  } else if (!kstEv.isZero() && !kstRk.isZero()) {
    // beide vorhanden — gut.
  } else {
    // beide 0 — keine KiSt; kein Hinweis noetig.
  }

  const jahr = String(report.zeitraum.jahr);
  const art =
    report.zeitraum.art === "MONAT"
      ? "MONAT"
      : report.zeitraum.art === "QUARTAL"
      ? "QUARTAL"
      : "JAHR";
  const zeitraum = zeitraumCode(
    art,
    report.zeitraum.monat,
    report.zeitraum.quartal
  );

  const dauerfristAttr = meta.dauerfrist ? ' dauerfrist="1"' : "";

  // Nur nicht-null Kennzahlen ausgeben + Kz10 immer (AN-Anzahl).
  const lines: string[] = [];
  const emit = (kz: string, value: string): void => {
    // Nicht ausgeben wenn 0,00 (ausser Kz10 = AN-Anzahl).
    const numeric = Number(value);
    if (kz !== "10" && Number.isFinite(numeric) && numeric === 0) return;
    // Kz10 ist eine Anzahl (integer), nicht Money → kein Komma.
    const emittedValue =
      kz === "10" ? xmlEscape(String(Math.trunc(numeric))) : moneyToElster(value);
    lines.push(`        <Kz${kz}>${emittedValue}</Kz${kz}>`);
  };
  for (const kz of Object.keys(report.kennzahlen) as Array<
    keyof typeof report.kennzahlen
  >) {
    emit(kz, report.kennzahlen[kz]);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Anmeldungssteuern art="LStA" version="2025">
  <DatenTeil>
    <Nutzdaten>
      <Anmeldungszeitraum jahr="${jahr}" zeitraum="${zeitraum}"${dauerfristAttr}/>
      <Steuerfall steuernummer="${xmlEscape(
        meta.steuernummer
      )}" betriebsnummer="${xmlEscape(report.betriebsnummer)}">
        <Lohnsteueranmeldung>
${lines.join("\n")}
        </Lohnsteueranmeldung>
      </Steuerfall>
    </Nutzdaten>
  </DatenTeil>
  <!-- HINWEIS: Preview-XML, kein ERiC-Datensatz. Schema-Stand: ${LSTA_ELSTER_SCHEMA_VERSION}. -->
</Anmeldungssteuern>
`;

  return {
    xml,
    schema_version: LSTA_ELSTER_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    warnings,
  };
}
