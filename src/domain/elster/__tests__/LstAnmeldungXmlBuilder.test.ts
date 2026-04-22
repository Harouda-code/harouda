// Sprint 14 / Schritt 2 · LstAnmeldungXmlBuilder-Tests.

import { describe, it, expect } from "vitest";
import { buildLstAnmeldungXml, LSTA_ELSTER_SCHEMA_VERSION } from "../LstAnmeldungXmlBuilder";
import { buildLohnsteuerAnmeldung } from "../../lohn/LohnsteuerAnmeldungBuilder";
import { LohnabrechnungsEngine } from "../../lohn/LohnabrechnungsEngine";
import { Money } from "../../../lib/money/Money";
import type {
  Arbeitnehmer,
  Bundesland,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
} from "../../lohn/types";

function makeAn(overrides: Partial<Arbeitnehmer> = {}): Arbeitnehmer {
  return {
    id: "an-1",
    mandant_id: "m-1",
    personalNr: "001",
    name: "Mustermann",
    vorname: "Max",
    geburtsdatum: "1990-01-01",
    sv_nummer: "12345678901A",
    steuer_id: "12345678901",
    steuerklasse: 1 as Steuerklasse,
    kinderfreibetraege: 0,
    kirchensteuerpflichtig: false,
    konfession: "NONE",
    bundesland: "NW" as Bundesland,
    kv_pflicht: true,
    kv_beitragsart: "GESETZLICH",
    kv_zusatzbeitrag: "2.5",
    rv_pflicht: true,
    av_pflicht: true,
    pv_pflicht: true,
    pv_kinderlos_zuschlag: true,
    pv_anzahl_kinder: 0,
    beschaeftigungsart: "VOLLZEIT",
    betriebsnummer: "12345678",
    eintrittsdatum: "2020-01-01",
    ...overrides,
  };
}
const LA_GEHALT: LohnArt = {
  id: "la-gehalt",
  bezeichnung: "Gehalt",
  typ: "LAUFENDER_BEZUG",
  steuerpflichtig: true,
  svpflichtig: true,
  lst_meldung_feld: "3",
};
const LAS = new Map([[LA_GEHALT.id, LA_GEHALT]]);

function abrechnung(an: Arbeitnehmer, monat: string, brutto: string) {
  const engine = new LohnabrechnungsEngine();
  const buchung: Lohnbuchung = {
    id: `b-${an.id}-${monat}`,
    arbeitnehmer_id: an.id,
    abrechnungsmonat: monat,
    lohnart_id: LA_GEHALT.id,
    betrag: new Money(brutto),
    buchungsdatum: `${monat}-15`,
  };
  return engine.berechneAbrechnung({
    arbeitnehmer: an,
    lohnarten: LAS,
    buchungen: [buchung],
    abrechnungsmonat: monat,
  });
}

const META = {
  steuernummer: "143/456/78901",
};

describe("LstAnmeldungXmlBuilder · ELSTER-XML", () => {
  it("#1 Leeres Archiv: XML mit warning 'Keine Abrechnungen im Zeitraum'", () => {
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [makeAn()],
      abrechnungen: [],
      zeitraum: "MONAT",
      monat: 3,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, META);
    expect(r.warnings.join("|")).toContain("Keine Abrechnungen");
    expect(r.schema_version).toBe(LSTA_ELSTER_SCHEMA_VERSION);
    expect(r.xml).toContain('<?xml version="1.0"');
    expect(r.xml).toContain('<Anmeldungssteuern art="LStA" version="2025">');
  });

  it("#2 Monat mit einem AN (VOLLZEIT, brutto 3000): Kz10 + Kz41 + Kz42 im XML", () => {
    const an = makeAn();
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-01", "3000")],
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, META);
    expect(r.xml).toContain("<Kz10>1</Kz10>");
    expect(r.xml).toContain("<Kz41>");
    expect(r.xml).toContain("<Kz42>");
    // Zeitraum-Attribut Monat = "01".
    expect(r.xml).toContain('zeitraum="01"');
    expect(r.xml).toContain('jahr="2025"');
  });

  it("#3 Steuernummer + Betriebsnummer im Steuerfall-Element", () => {
    const an = makeAn();
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-03", "4000")],
      zeitraum: "MONAT",
      monat: 3,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, META);
    expect(r.xml).toContain('steuernummer="143/456/78901"');
    expect(r.xml).toContain('betriebsnummer="12345678"');
  });

  it("#4 Dauerfrist=true setzt dauerfrist='1'-Attribut", () => {
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [],
      abrechnungen: [],
      zeitraum: "MONAT",
      monat: 4,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, {
      ...META,
      dauerfrist: true,
    });
    expect(r.xml).toContain('dauerfrist="1"');
  });

  it("#5 Quartals-Meldung: zeitraum='41'/'42'/'43'/'44'", () => {
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [],
      abrechnungen: [],
      zeitraum: "QUARTAL",
      quartal: 2,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, META);
    expect(r.xml).toContain('zeitraum="42"');
  });

  it("#6 Kirchensteuer bei ev-Konfession: landet in Kz71 (nicht Kz72)", () => {
    const an = makeAn({
      konfession: "EV",
      kirchensteuerpflichtig: true,
    });
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-01", "5000")],
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const kstEv = report._internal.kirchensteuer_ev;
    const kstRk = report._internal.kirchensteuer_rk;
    // EV-KiSt existiert, RK-KiSt leer.
    expect(kstEv.isPositive()).toBe(true);
    expect(kstRk.isZero()).toBe(true);
    const r = buildLstAnmeldungXml(report, META);
    expect(r.xml).toContain("<Kz71>");
    // Kz72 (rk) darf NICHT ausgegeben werden (= 0, weggefiltert).
    expect(r.xml).not.toContain("<Kz72>");
  });

  it("#7 XML ist well-formed (xml-parser-tauglich: genau 1 Root, geschlossene Tags)", () => {
    const an = makeAn();
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-05", "2500")],
      zeitraum: "MONAT",
      monat: 5,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, META);
    // Smoke: genau eine <Anmeldungssteuern>-Öffnung und -Schließung.
    const openCount = (r.xml.match(/<Anmeldungssteuern /g) ?? []).length;
    const closeCount = (r.xml.match(/<\/Anmeldungssteuern>/g) ?? []).length;
    expect(openCount).toBe(1);
    expect(closeCount).toBe(1);
    // jeder Kz-Tag hat ein Closing.
    for (const kz of ["10", "41", "42", "43", "61"]) {
      const op = (r.xml.match(new RegExp(`<Kz${kz}>`, "g")) ?? []).length;
      const cl = (r.xml.match(new RegExp(`</Kz${kz}>`, "g")) ?? []).length;
      expect(op).toBe(cl);
    }
  });

  it("#8 Minijob-AN: LSt landet in Kz47 (Pauschale Minijob 2%)", () => {
    const an = makeAn({
      beschaeftigungsart: "MINIJOB",
      kv_pflicht: false,
      rv_pflicht: false,
      av_pflicht: false,
      pv_pflicht: false,
    });
    const report = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-01", "520")],
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const r = buildLstAnmeldungXml(report, META);
    expect(r.xml).toContain("<Kz47>");
    // Kz42 (VOLLZEIT-LSt) darf nicht erscheinen (= 0).
    expect(r.xml).not.toContain("<Kz42>");
  });
});
