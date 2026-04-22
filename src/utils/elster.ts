import type { UstvaReport } from "../api/reports";
import { FORM_META } from "../data/formMeta";
import { STEUERPARAMETER_VERSION } from "../data/steuerParameter";

/** harouda-app product version — wird in die Nutzdaten-XML geschrieben, damit
 *  spätere Prüfer erkennen, mit welcher Toolchain die Datei erzeugt wurde. */
export const HAROUDA_APP_VERSION = "1.0.0";

type ElsterMeta = {
  steuernummer: string;
  beraterNr: string;
  kanzleiName: string;
  year: number;
  month: number; // 1..12
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmt(amount: number): string {
  // ELSTER expects amounts in Euro with no decimals for most Kz of UStVA.
  return Math.round(amount).toString();
}

/**
 * Builds an ELSTER-shaped UStVA XML document.
 *
 * IMPORTANT: This is a demonstration export. A real ELSTER submission
 * requires the ERiC client library, a certificate, and an encrypted
 * transport channel that cannot be used directly from a browser.
 * Use the XML for import into ELSTER Online Portal or a certified
 * client (DATEV, Taxpool, SteuerSparErklärung, etc.).
 */
export function buildUstvaXml(report: UstvaReport, meta: ElsterMeta): string {
  const zeitraum = String(meta.month).padStart(2, "0");
  const formMeta = FORM_META.ustva;
  const generatorId = `harouda-app/${HAROUDA_APP_VERSION} form-${formMeta.version} steuerparameter-${STEUERPARAMETER_VERSION}`;
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<!-- Erzeugt von ${xmlEscape(generatorId)} am ${new Date().toISOString()} -->`,
    `<!-- Formular ${formMeta.title}, Veranlagungsjahr ${formMeta.veranlagungsjahr}, zuletzt intern geprüft ${formMeta.lastReviewed} -->`,
    "<!-- HINWEIS: Dieses XML ist ein eigener Aufbau anhand öffentlicher ELSTER-Dokumentation und KEINE zertifizierte ERiC-Abgabe. -->",
    '<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">',
    "  <TransferHeader version=\"11\">",
    "    <Verfahren>ElsterAnmeldung</Verfahren>",
    "    <DatenArt>UStVA</DatenArt>",
    "    <Vorgang>send-Auth</Vorgang>",
    `    <Zeitraum>${meta.year}-${zeitraum}</Zeitraum>`,
    `    <HerstellerID>harouda-app</HerstellerID>`,
    "  </TransferHeader>",
    "  <DatenTeil>",
    "    <Nutzdatenblock>",
    "      <NutzdatenHeader version=\"11\">",
    `        <NutzdatenTicket>${Date.now()}</NutzdatenTicket>`,
    "        <Empfaenger id=\"F\">9999</Empfaenger>",
    "        <Hersteller>",
    `          <ProduktName>harouda-app</ProduktName>`,
    `          <ProduktVersion>${xmlEscape(HAROUDA_APP_VERSION)}</ProduktVersion>`,
    `          <FormularVersion>${xmlEscape(formMeta.version)}</FormularVersion>`,
    `          <Veranlagungsjahr>${formMeta.veranlagungsjahr}</Veranlagungsjahr>`,
    `          <SteuerparameterVersion>${xmlEscape(STEUERPARAMETER_VERSION)}</SteuerparameterVersion>`,
    `          <GeneratorFingerprint>${xmlEscape(generatorId)}</GeneratorFingerprint>`,
    "        </Hersteller>",
    "      </NutzdatenHeader>",
    "      <Nutzdaten>",
    "        <Anmeldungssteuern art=\"UStVA\">",
    `          <Steuernummer>${xmlEscape(meta.steuernummer)}</Steuernummer>`,
    `          <Erstellungsdatum>${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}</Erstellungsdatum>`,
    "          <Umsatzsteuervoranmeldung>",
    `            <Jahr>${meta.year}</Jahr>`,
    `            <Zeitraum>${zeitraum}</Zeitraum>`,
    "            <!-- Kz. 81: Umsätze zu 19 % (netto) -->",
    `            <Kz81>${fmt(report.kz81)}</Kz81>`,
    "            <!-- Kz. 86: Umsätze zu 7 % (netto) -->",
    `            <Kz86>${fmt(report.kz86)}</Kz86>`,
    "            <!-- Kz. 48: Steuerfreie Umsätze -->",
    `            <Kz48>${fmt(report.kz48)}</Kz48>`,
    "            <!-- Kz. 66: Vorsteuer -->",
    `            <Kz66>${fmt(report.kz66)}</Kz66>`,
    "            <!-- Kz. 83: Zahllast / Erstattung -->",
    `            <Kz83>${fmt(report.zahllast)}</Kz83>`,
    "          </Umsatzsteuervoranmeldung>",
    "        </Anmeldungssteuern>",
    "      </Nutzdaten>",
    "    </Nutzdatenblock>",
    "  </DatenTeil>",
    "</Elster>",
  ];
  return lines.join("\n");
}

export function downloadXml(xml: string, filename: string) {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
