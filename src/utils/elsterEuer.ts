import type { EuerReport } from "../api/euer";
import { FORM_META } from "../data/formMeta";
import { STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import { HAROUDA_APP_VERSION } from "./elster";

/**
 * Erzeugt ein Anlage-EÜR-XML in Anlehnung an das öffentlich dokumentierte
 * ELSTER-Schema. Enthält einen sichtbaren Kommentarblock, der das Dokument
 * als „eigener Aufbau, keine ERiC-Abgabe" markiert und die Generator-
 * Versionen einbettet (ProduktVersion, FormVersion, SteuerparameterVersion).
 *
 * Der ELSTER-Dienst akzeptiert die eigentliche Abgabe ausschließlich über
 * ERiC (C++); dieses XML ist für den Import in das ELSTER Online Portal
 * oder in zertifizierte Fachclients gedacht.
 */
export function buildEuerXml(
  report: EuerReport,
  meta: {
    jahr: number;
    steuernummer: string;
    kanzleiName: string;
  }
): string {
  const formMeta = FORM_META.euer;
  const generatorId = `harouda-app/${HAROUDA_APP_VERSION} form-${formMeta.version} steuerparameter-${STEUERPARAMETER_VERSION}`;

  const zeilen = report.lines
    .filter((l) => l.betrag !== 0)
    .map((l) => `      <Zeile nr="${l.zeile}">${Math.round(l.betrag)}</Zeile>`)
    .join("\n");

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<!-- Erzeugt von ${xmlEscape(generatorId)} am ${new Date().toISOString()} -->`,
    `<!-- Anlage EÜR Veranlagungsjahr ${meta.jahr}, zuletzt intern geprüft ${formMeta.lastReviewed} -->`,
    "<!-- HINWEIS: Dieses XML ist ein eigener Aufbau anhand öffentlicher BMF/ELSTER-Dokumentation und KEINE zertifizierte ERiC-Abgabe. -->",
    '<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">',
    '  <TransferHeader version="11">',
    "    <Verfahren>ElsterErklaerung</Verfahren>",
    "    <DatenArt>EUER</DatenArt>",
    "    <Vorgang>send-Auth</Vorgang>",
    `    <Zeitraum>${meta.jahr}</Zeitraum>`,
    "    <HerstellerID>harouda-app</HerstellerID>",
    "  </TransferHeader>",
    "  <DatenTeil>",
    "    <Nutzdatenblock>",
    '      <NutzdatenHeader version="11">',
    `        <NutzdatenTicket>${Date.now()}</NutzdatenTicket>`,
    '        <Empfaenger id="F">9999</Empfaenger>',
    "        <Hersteller>",
    "          <ProduktName>harouda-app</ProduktName>",
    `          <ProduktVersion>${xmlEscape(HAROUDA_APP_VERSION)}</ProduktVersion>`,
    `          <FormularVersion>${xmlEscape(formMeta.version)}</FormularVersion>`,
    `          <Veranlagungsjahr>${meta.jahr}</Veranlagungsjahr>`,
    `          <SteuerparameterVersion>${xmlEscape(STEUERPARAMETER_VERSION)}</SteuerparameterVersion>`,
    `          <GeneratorFingerprint>${xmlEscape(generatorId)}</GeneratorFingerprint>`,
    "        </Hersteller>",
    "      </NutzdatenHeader>",
    "      <Nutzdaten>",
    '        <Anlagen art="EUER">',
    `          <Steuernummer>${xmlEscape(meta.steuernummer)}</Steuernummer>`,
    `          <Erstellungsdatum>${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</Erstellungsdatum>`,
    "          <Einnahmenueberschussrechnung>",
    `            <Jahr>${meta.jahr}</Jahr>`,
    "            <Einnahmen>",
    zeilen,
    "            </Einnahmen>",
    `            <Gewinn>${Math.round(report.gewinn)}</Gewinn>`,
    "          </Einnahmenueberschussrechnung>",
    "        </Anlagen>",
    "      </Nutzdaten>",
    "    </Nutzdatenblock>",
    "  </DatenTeil>",
    "</Elster>",
  ];
  return lines.join("\n");
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
