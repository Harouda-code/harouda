// Sprint 15 / Schritt 4 · DsuvXmlBuilder-Tests.

import { describe, it, expect } from "vitest";
import {
  buildDsuvXml,
  DSUV_SCHEMA_VERSION,
  type DsuvAbsender,
} from "../DsuvXmlBuilder";
import { BG_VOLL_SV_PFLICHTIG, type DEUeVMeldung } from "../dsuvTypes";

const ABSENDER: DsuvAbsender = {
  betriebsnummer: "87654321",
  name: "Muster GmbH",
  ansprechpartner: "Maria Musterfrau",
  email: "maria@muster.de",
};

function makeMeldung(
  overrides: Partial<DEUeVMeldung> = {}
): DEUeVMeldung {
  return {
    abgabegrund: "50",
    meldezeitraum_von: "2025-01-01",
    meldezeitraum_bis: "2025-12-31",
    arbeitnehmer: {
      sv_nummer: "12345678A012",
      nachname: "Mustermann",
      vorname: "Max",
      geburtsdatum: "1990-01-01",
      staatsangehoerigkeit: "DE",
      anschrift: {
        strasse: "Musterweg",
        hausnummer: "1",
        plz: "10115",
        ort: "Berlin",
      },
    },
    arbeitgeber: {
      betriebsnummer: "87654321",
      name: "Muster GmbH",
      anschrift: {
        strasse: "Firmenstr.",
        hausnummer: "99",
        plz: "10117",
        ort: "Berlin",
      },
    },
    beschaeftigung: {
      personengruppe: "101",
      beitragsgruppe: BG_VOLL_SV_PFLICHTIG,
      taetigkeitsschluessel: "123456789",
      mehrfachbeschaeftigung: false,
    },
    entgelt: {
      brutto_rv: 36_000,
      brutto_kv: 36_000,
      gleitzone_flag: false,
    },
    einzugsstelle_bbnr: "01234567",
    ...overrides,
  };
}

describe("DsuvXmlBuilder", () => {
  it("#1 Einzelne Meldung: XML ist well-formed + enthaelt Kern-Elemente", () => {
    const r = buildDsuvXml([makeMeldung()], ABSENDER);
    expect(r.meldungen_count).toBe(1);
    expect(r.schema_version).toBe(DSUV_SCHEMA_VERSION);
    expect(r.xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(r.xml).toContain('<dsuv schemaVersion="2025-04">');
    expect(r.xml).toContain("<dsko>");
    expect(r.xml).toContain("<deuev>");
    expect(r.xml).toContain("<abgabegrund>50</abgabegrund>");
    expect(r.xml).toContain("<svNummer>12345678A012</svNummer>");
    expect(r.xml).toContain("<einzugsstelle>01234567</einzugsstelle>");
    expect(r.xml).toContain("<beitragsgruppe>1111</beitragsgruppe>");
    expect(r.xml).toContain("<bruttoRv>36000.00</bruttoRv>");
  });

  it("#2 Mehrere Meldungen: alle werden gerendert", () => {
    const m1 = makeMeldung({ abgabegrund: "10" });
    const m2 = makeMeldung({ abgabegrund: "30" });
    const r = buildDsuvXml([m1, m2], ABSENDER);
    expect(r.meldungen_count).toBe(2);
    expect((r.xml.match(/<deuev>/g) ?? []).length).toBe(2);
    expect(r.xml).toContain("<abgabegrund>10</abgabegrund>");
    expect(r.xml).toContain("<abgabegrund>30</abgabegrund>");
  });

  it("#3 Sonderzeichen im Namen werden XML-escaped", () => {
    const m = makeMeldung({
      arbeitnehmer: {
        ...makeMeldung().arbeitnehmer,
        nachname: "Müller & Söhne",
        vorname: "<Hans>",
      },
    });
    const r = buildDsuvXml([m], ABSENDER);
    expect(r.xml).toContain("<nachname>Müller &amp; Söhne</nachname>");
    expect(r.xml).toContain("<vorname>&lt;Hans&gt;</vorname>");
  });

  it("#4 Ungueltige Absender-BBNR (!== 8 Zeichen) → warning", () => {
    const r = buildDsuvXml(
      [makeMeldung()],
      { ...ABSENDER, betriebsnummer: "123" }
    );
    expect(r.warnings.join("|")).toMatch(/Absender-Betriebsnummer/);
  });

  it("#5 Leere Liste: warning + leeres aber gueltiges XML-Dokument", () => {
    const r = buildDsuvXml([], ABSENDER);
    expect(r.meldungen_count).toBe(0);
    expect(r.warnings.join("|")).toMatch(/Keine Meldungen/);
    expect(r.xml).toContain("<dsuv");
    expect(r.xml).toContain("</dsuv>");
  });

  it("#6 svNummer != 12 Zeichen und BBNR != 8 Zeichen → warnings", () => {
    const m = makeMeldung({
      arbeitnehmer: {
        ...makeMeldung().arbeitnehmer,
        sv_nummer: "ABC",
      },
      einzugsstelle_bbnr: "42",
    });
    const r = buildDsuvXml([m], ABSENDER);
    expect(r.warnings.join("|")).toMatch(/sv_nummer/);
    expect(r.warnings.join("|")).toMatch(/einzugsstelle_bbnr/);
  });

  it("#7 Schema-Version im Root + Product-Identifier im dsko", () => {
    const r = buildDsuvXml([makeMeldung()], ABSENDER);
    expect(r.xml).toContain('schemaVersion="2025-04"');
    expect(r.xml).toContain("<produktIdentifier>Harouda-2025.04</produktIdentifier>");
  });
});
