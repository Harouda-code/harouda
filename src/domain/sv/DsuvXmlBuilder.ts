/**
 * DSuV-XML-Builder (Sprint 15 / Schritt 4).
 *
 * Erzeugt ein XML-Dokument im Stil der DSuV-Datensaetze (Gemeinsame
 * Grundsaetze ITSG fuer die Datenannahmestellen der GKV).
 *
 * WICHTIG — NICHT produktiv: Dies ist kein gueltiger DSuV-Datensatz im
 * Sinne der ITSG-Trustcenter-Echtuebermittlung. Die hier erzeugten XML-
 * Dateien sind fuer den MANUELLEN Upload im SV-Meldeportal
 * (https://sv-meldeportal.de) bzw. sv.net gedacht. Eine echte ITSG-
 * Uebermittlung erfordert ITSG-Zertifikat + Trustcenter-Contract (out
 * of scope).
 *
 * SCHEMA-RECHTSFLAGGE: Schema-Version wird im Output als Attribut
 * schemaVersion="..." gefuehrt. Jaehrliche Aktualisierung durch die
 * ITSG. Siehe docs/DSUV-SCHEMA-UPDATE-GUIDE.md.
 */

import type { DEUeVMeldung } from "./dsuvTypes";

export const DSUV_SCHEMA_VERSION = "2025-04";
export const PRODUCT_IDENTIFIER = "Harouda-2025.04";

export type DsuvAbsender = {
  /** Betriebsnummer der absendenden Stelle (Arbeitgeber selbst oder
   *  Kanzlei). */
  betriebsnummer: string;
  name: string;
  ansprechpartner: string;
  email: string;
};

export type DsuvXmlResult = {
  xml: string;
  schema_version: string;
  meldungen_count: number;
  warnings: string[];
  generated_at: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function eur(n: number): string {
  return n.toFixed(2);
}

function renderArbeitnehmer(an: DEUeVMeldung["arbeitnehmer"]): string {
  const geburtsname = an.geburtsname
    ? `      <geburtsname>${esc(an.geburtsname)}</geburtsname>\n`
    : "";
  const geburtsort = an.geburtsort
    ? `      <geburtsort>${esc(an.geburtsort)}</geburtsort>\n`
    : "";
  return `    <arbeitnehmer>
      <svNummer>${esc(an.sv_nummer)}</svNummer>
      <nachname>${esc(an.nachname)}</nachname>
      <vorname>${esc(an.vorname)}</vorname>
      <geburtsdatum>${esc(an.geburtsdatum)}</geburtsdatum>
      <staatsangehoerigkeit>${esc(an.staatsangehoerigkeit)}</staatsangehoerigkeit>
${geburtsname}${geburtsort}      <anschrift>
        <strasse>${esc(an.anschrift.strasse)}</strasse>
        <hausnummer>${esc(an.anschrift.hausnummer)}</hausnummer>
        <plz>${esc(an.anschrift.plz)}</plz>
        <ort>${esc(an.anschrift.ort)}</ort>
      </anschrift>
    </arbeitnehmer>`;
}

function renderArbeitgeber(ag: DEUeVMeldung["arbeitgeber"]): string {
  return `    <arbeitgeber>
      <betriebsnummer>${esc(ag.betriebsnummer)}</betriebsnummer>
      <name>${esc(ag.name)}</name>
      <anschrift>
        <strasse>${esc(ag.anschrift.strasse)}</strasse>
        <hausnummer>${esc(ag.anschrift.hausnummer)}</hausnummer>
        <plz>${esc(ag.anschrift.plz)}</plz>
        <ort>${esc(ag.anschrift.ort)}</ort>
      </anschrift>
    </arbeitgeber>`;
}

function renderBeschaeftigung(b: DEUeVMeldung["beschaeftigung"]): string {
  const bg = b.beitragsgruppe;
  return `    <beschaeftigung>
      <personengruppe>${esc(b.personengruppe)}</personengruppe>
      <beitragsgruppe>${bg.kv}${bg.rv}${bg.av}${bg.pv}</beitragsgruppe>
      <taetigkeitsschluessel>${esc(b.taetigkeitsschluessel)}</taetigkeitsschluessel>
      <mehrfachbeschaeftigung>${b.mehrfachbeschaeftigung ? "J" : "N"}</mehrfachbeschaeftigung>
    </beschaeftigung>`;
}

function renderEntgelt(e: DEUeVMeldung["entgelt"]): string {
  if (!e) return "";
  return `    <entgelt>
      <bruttoRv>${eur(e.brutto_rv)}</bruttoRv>
      <bruttoKv>${eur(e.brutto_kv)}</bruttoKv>
      <gleitzoneFlag>${e.gleitzone_flag ? "J" : "N"}</gleitzoneFlag>
    </entgelt>`;
}

function renderMeldung(m: DEUeVMeldung): string {
  return `  <deuev>
    <kennung>DEUEV</kennung>
    <abgabegrund>${esc(m.abgabegrund)}</abgabegrund>
    <meldezeitraum>
      <von>${esc(m.meldezeitraum_von)}</von>
      <bis>${esc(m.meldezeitraum_bis)}</bis>
    </meldezeitraum>
    <einzugsstelle>${esc(m.einzugsstelle_bbnr)}</einzugsstelle>
${renderArbeitnehmer(m.arbeitnehmer)}
${renderArbeitgeber(m.arbeitgeber)}
${renderBeschaeftigung(m.beschaeftigung)}${m.entgelt ? "\n" + renderEntgelt(m.entgelt) : ""}
  </deuev>`;
}

function renderDsko(absender: DsuvAbsender): string {
  return `  <dsko>
    <kennung>DSKO</kennung>
    <verfahren>DEUV</verfahren>
    <produktIdentifier>${esc(PRODUCT_IDENTIFIER)}</produktIdentifier>
    <absender>
      <betriebsnummer>${esc(absender.betriebsnummer)}</betriebsnummer>
      <name>${esc(absender.name)}</name>
      <ansprechpartner>${esc(absender.ansprechpartner)}</ansprechpartner>
      <email>${esc(absender.email)}</email>
    </absender>
  </dsko>`;
}

/**
 * Haupt-API: baut das DSuV-XML-Dokument aus einer oder mehreren
 * Meldungen.
 */
export function buildDsuvXml(
  meldungen: DEUeVMeldung[],
  absender: DsuvAbsender
): DsuvXmlResult {
  const warnings: string[] = [];
  if (!absender.betriebsnummer || absender.betriebsnummer.length !== 8) {
    warnings.push(
      `Absender-Betriebsnummer "${absender.betriebsnummer}" ist nicht 8-stellig.`
    );
  }
  if (meldungen.length === 0) {
    warnings.push("Keine Meldungen — leeres DSuV-Dokument wird erzeugt.");
  }
  for (const m of meldungen) {
    if (m.arbeitnehmer.sv_nummer.length !== 12) {
      warnings.push(
        `sv_nummer "${m.arbeitnehmer.sv_nummer}" ist nicht 12-stellig.`
      );
    }
    if (m.einzugsstelle_bbnr.length !== 8) {
      warnings.push(
        `einzugsstelle_bbnr "${m.einzugsstelle_bbnr}" ist nicht 8-stellig.`
      );
    }
  }

  const dskoBlock = renderDsko(absender);
  const meldungenBlocks = meldungen.map(renderMeldung).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dsuv schemaVersion="${DSUV_SCHEMA_VERSION}">
${dskoBlock}
${meldungenBlocks}
  <!-- HINWEIS: Preview-XML fuer SV-Meldeportal-Upload. Kein
       ITSG-Trustcenter-Datensatz. Schema-Stand: ${DSUV_SCHEMA_VERSION}. -->
</dsuv>
`;

  return {
    xml,
    schema_version: DSUV_SCHEMA_VERSION,
    meldungen_count: meldungen.length,
    warnings,
    generated_at: new Date().toISOString(),
  };
}
