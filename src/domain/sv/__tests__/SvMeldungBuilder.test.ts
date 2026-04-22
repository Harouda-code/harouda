// Sprint 15 / Schritt 3 · SvMeldungBuilder-Tests.

import { describe, it, expect } from "vitest";
import {
  buildAnmeldung,
  buildAbmeldung,
  buildJahresmeldung,
  MissingSvDataError,
  personengruppeFromBeschaeftigung,
  beitragsgruppeFromFlags,
} from "../SvMeldungBuilder";
import type {
  ArbeitnehmerExtraData,
  ArbeitgeberExtraData,
} from "../dsuvTypes";
import type {
  Arbeitnehmer,
  LohnabrechnungArchivRow,
} from "../../lohn/types";

function makeAn(overrides: Partial<Arbeitnehmer> = {}): Arbeitnehmer {
  return {
    id: "an-1",
    mandant_id: "m-1",
    personalNr: "001",
    name: "Mustermann",
    vorname: "Max",
    geburtsdatum: "1990-01-01",
    sv_nummer: "12345678A012",
    steuer_id: "12345678901",
    steuerklasse: 1,
    kinderfreibetraege: 0,
    kirchensteuerpflichtig: false,
    konfession: "NONE",
    bundesland: "NW",
    kv_pflicht: true,
    kv_beitragsart: "GESETZLICH",
    kv_zusatzbeitrag: "2.5",
    rv_pflicht: true,
    av_pflicht: true,
    pv_pflicht: true,
    pv_kinderlos_zuschlag: false,
    pv_anzahl_kinder: 0,
    beschaeftigungsart: "VOLLZEIT",
    betriebsnummer: "12345678",
    eintrittsdatum: "2020-01-01",
    ...overrides,
  };
}

function extraAn(
  overrides: Partial<ArbeitnehmerExtraData> = {}
): ArbeitnehmerExtraData {
  return {
    staatsangehoerigkeit: "DE",
    anschrift: {
      strasse: "Musterweg",
      hausnummer: "1",
      plz: "10115",
      ort: "Berlin",
    },
    taetigkeitsschluessel: "123456789",
    mehrfachbeschaeftigung: false,
    einzugsstelle_bbnr: "01234567",
    ...overrides,
  };
}

const ARBEITGEBER: ArbeitgeberExtraData = {
  betriebsnummer: "87654321",
  name: "Muster GmbH",
  anschrift: {
    strasse: "Firmenstr.",
    hausnummer: "99",
    plz: "10117",
    ort: "Berlin",
  },
};

function archivRow(
  monat: string,
  svBrutto: string,
  employeeId = "an-1"
): LohnabrechnungArchivRow {
  return {
    id: `row-${monat}`,
    company_id: "c-1",
    client_id: "client-1",
    employee_id: employeeId,
    abrechnungsmonat: monat,
    gesamt_brutto: Number(svBrutto),
    gesamt_netto: 0,
    gesamt_abzuege: 0,
    gesamt_ag_kosten: 0,
    batch_id: null,
    locked: false,
    created_at: `${monat}-15T00:00:00Z`,
    abrechnung_json: {
      svBrutto,
    },
  };
}

describe("SvMeldungBuilder · Mapping-Helper", () => {
  it("#1 personengruppeFromBeschaeftigung: Minijob → 109, Kurzfristig → 110, sonst 101", () => {
    expect(
      personengruppeFromBeschaeftigung(makeAn({ beschaeftigungsart: "MINIJOB" }))
    ).toBe("109");
    expect(
      personengruppeFromBeschaeftigung(
        makeAn({ beschaeftigungsart: "KURZFRISTIG" })
      )
    ).toBe("110");
    expect(
      personengruppeFromBeschaeftigung(
        makeAn({ beschaeftigungsart: "VOLLZEIT" })
      )
    ).toBe("101");
  });

  it("#2 beitragsgruppeFromFlags: Minijob → 6/5/0/0, Vollzeit → 1/1/1/1", () => {
    expect(beitragsgruppeFromFlags(makeAn())).toEqual({
      kv: "1",
      rv: "1",
      av: "1",
      pv: "1",
    });
    expect(
      beitragsgruppeFromFlags(makeAn({ beschaeftigungsart: "MINIJOB" }))
    ).toEqual({ kv: "6", rv: "5", av: "0", pv: "0" });
  });
});

describe("SvMeldungBuilder · buildAnmeldung/Abmeldung", () => {
  it("#3 Happy-Path Anmeldung: abgabegrund 10, Zeitraum = Beschaeftigungsbeginn", () => {
    const m = buildAnmeldung({
      arbeitnehmer: makeAn(),
      extraAn: extraAn(),
      arbeitgeber: ARBEITGEBER,
      beschaeftigungsbeginn: "2025-06-01",
    });
    expect(m.abgabegrund).toBe("10");
    expect(m.meldezeitraum_von).toBe("2025-06-01");
    expect(m.meldezeitraum_bis).toBe("2025-06-01");
    expect(m.arbeitnehmer.sv_nummer).toBe("12345678A012");
    expect(m.arbeitgeber.betriebsnummer).toBe("87654321");
    expect(m.beschaeftigung.personengruppe).toBe("101");
    expect(m.beschaeftigung.taetigkeitsschluessel).toBe("123456789");
    expect(m.einzugsstelle_bbnr).toBe("01234567");
  });

  it("#4 Happy-Path Abmeldung: abgabegrund 30", () => {
    const m = buildAbmeldung({
      arbeitnehmer: makeAn({ austrittsdatum: "2025-09-30" }),
      extraAn: extraAn(),
      arbeitgeber: ARBEITGEBER,
      beschaeftigungsende: "2025-09-30",
    });
    expect(m.abgabegrund).toBe("30");
    expect(m.meldezeitraum_bis).toBe("2025-09-30");
  });
});

describe("SvMeldungBuilder · Jahresmeldung", () => {
  it("#5 Vollstaendiges Jahr (12 Monate): brutto_rv/brutto_kv = Σ svBrutto", () => {
    const rows: LohnabrechnungArchivRow[] = [];
    for (let i = 1; i <= 12; i++) {
      const mm = String(i).padStart(2, "0");
      rows.push(archivRow(`2025-${mm}`, "3000"));
    }
    const m = buildJahresmeldung({
      arbeitnehmer: makeAn(),
      extraAn: extraAn(),
      arbeitgeber: ARBEITGEBER,
      jahr: 2025,
      archivRows: rows,
    });
    expect(m.abgabegrund).toBe("50");
    expect(m.meldezeitraum_von).toBe("2025-01-01");
    expect(m.meldezeitraum_bis).toBe("2025-12-31");
    expect(m.entgelt!.brutto_rv).toBe(36_000);
    expect(m.entgelt!.brutto_kv).toBe(36_000);
  });

  it("#6 Teil-Jahr (Eintritt April): Zeitraum beginnt 01.04., Summe 9 Monate", () => {
    const rows: LohnabrechnungArchivRow[] = [];
    for (let i = 4; i <= 12; i++) {
      const mm = String(i).padStart(2, "0");
      rows.push(archivRow(`2025-${mm}`, "2500"));
    }
    const m = buildJahresmeldung({
      arbeitnehmer: makeAn({ eintrittsdatum: "2025-04-01" }),
      extraAn: extraAn(),
      arbeitgeber: ARBEITGEBER,
      jahr: 2025,
      archivRows: rows,
    });
    expect(m.meldezeitraum_von).toBe("2025-04-01");
    expect(m.entgelt!.brutto_rv).toBe(22_500);
  });

  it("#7 Austritt mitten im Jahr: Zeitraum endet am Austrittsdatum", () => {
    const rows: LohnabrechnungArchivRow[] = [];
    for (let i = 1; i <= 6; i++) {
      const mm = String(i).padStart(2, "0");
      rows.push(archivRow(`2025-${mm}`, "3000"));
    }
    const m = buildJahresmeldung({
      arbeitnehmer: makeAn({ austrittsdatum: "2025-06-30" }),
      extraAn: extraAn(),
      arbeitgeber: ARBEITGEBER,
      jahr: 2025,
      archivRows: rows,
    });
    expect(m.meldezeitraum_bis).toBe("2025-06-30");
    expect(m.entgelt!.brutto_rv).toBe(18_000);
  });
});

describe("SvMeldungBuilder · Defensive Throws", () => {
  it("#8 Fehlende sv_nummer → MissingSvDataError mit Reparatur-Hint", () => {
    expect(() =>
      buildAnmeldung({
        arbeitnehmer: makeAn({ sv_nummer: "" }),
        extraAn: extraAn(),
        arbeitgeber: ARBEITGEBER,
        beschaeftigungsbeginn: "2025-01-01",
      })
    ).toThrow(MissingSvDataError);
  });

  it("#9 Fehlende BBNR → MissingSvDataError", () => {
    expect(() =>
      buildAnmeldung({
        arbeitnehmer: makeAn(),
        extraAn: extraAn({ einzugsstelle_bbnr: "" }),
        arbeitgeber: ARBEITGEBER,
        beschaeftigungsbeginn: "2025-01-01",
      })
    ).toThrow(/einzugsstelle_bbnr/);
  });

  it("#10 Fehlender Taetigkeitsschluessel → MissingSvDataError", () => {
    expect(() =>
      buildAnmeldung({
        arbeitnehmer: makeAn(),
        extraAn: extraAn({ taetigkeitsschluessel: "" }),
        arbeitgeber: ARBEITGEBER,
        beschaeftigungsbeginn: "2025-01-01",
      })
    ).toThrow(/taetigkeitsschluessel/);
  });

  it("#11 Fehlende Arbeitgeber-Betriebsnummer → MissingSvDataError", () => {
    const ag = { ...ARBEITGEBER, betriebsnummer: "" };
    expect(() =>
      buildAnmeldung({
        arbeitnehmer: makeAn(),
        extraAn: extraAn(),
        arbeitgeber: ag,
        beschaeftigungsbeginn: "2025-01-01",
      })
    ).toThrow(/betriebsnummer/);
  });
});
