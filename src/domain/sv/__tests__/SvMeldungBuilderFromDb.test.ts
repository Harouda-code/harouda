// Sprint 18 / Schritt 5 · SvMeldungBuilder-Refactor-Tests (DB-Pfad).

import { describe, it, expect } from "vitest";
import {
  arbeitgeberFromClient,
  arbeitnehmerExtraFromEmployee,
  hasOverride,
  mergeArbeitnehmerExtra,
  MissingSvDataError,
  resolveBuildContext,
  buildJahresmeldung,
} from "../SvMeldungBuilder";
import type { Client, Employee } from "../../../types/db";
import type {
  ArbeitgeberExtraData,
  ArbeitnehmerExtraData,
} from "../dsuvTypes";

function makeEmp(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "e-db-1",
    company_id: null,
    client_id: "c-db-1",
    personalnummer: "001",
    vorname: "Max",
    nachname: "Mustermann",
    steuer_id: "12345678901",
    sv_nummer: "12345678A012",
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: "BE",
    einstellungsdatum: "2024-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 2.45,
    privat_versichert: false,
    pv_kinderlos: false,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    staatsangehoerigkeit: "DE",
    taetigkeitsschluessel: "123456789",
    einzugsstelle_bbnr: "01234567",
    anschrift_strasse: "Musterweg",
    anschrift_hausnummer: "1",
    anschrift_plz: "10115",
    anschrift_ort: "Berlin",
    anschrift_land: "DE",
    mehrfachbeschaeftigung: false,
    ...overrides,
  };
}

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "c-db-1",
    mandant_nr: "90000",
    name: "Test GmbH",
    steuernummer: null,
    ust_id: null,
    iban: null,
    ust_id_status: "unchecked",
    ust_id_checked_at: null,
    last_daten_holen_at: null,
    anschrift_strasse: "Firmenstr.",
    anschrift_hausnummer: "99",
    anschrift_plz: "10117",
    anschrift_ort: "Berlin",
    anschrift_land: "DE",
    ...overrides,
  };
}

const AG_OVERRIDE: Partial<ArbeitgeberExtraData> = {
  betriebsnummer: "87654321",
  // anschrift kommt aus Client.
};

describe("SvMeldungBuilder · DB-Adapter", () => {
  it("#1 arbeitnehmerExtraFromEmployee: alle gesetzten Felder werden uebernommen", () => {
    const r = arbeitnehmerExtraFromEmployee(makeEmp());
    expect(r.staatsangehoerigkeit).toBe("DE");
    expect(r.taetigkeitsschluessel).toBe("123456789");
    expect(r.einzugsstelle_bbnr).toBe("01234567");
    expect(r.anschrift).toBeDefined();
    expect(r.anschrift!.strasse).toBe("Musterweg");
    expect(r.mehrfachbeschaeftigung).toBe(false);
  });

  it("#2 arbeitnehmerExtraFromEmployee: NULL-Felder werden uebersprungen (undefined)", () => {
    const r = arbeitnehmerExtraFromEmployee(
      makeEmp({
        taetigkeitsschluessel: null,
        einzugsstelle_bbnr: null,
      })
    );
    expect(r.taetigkeitsschluessel).toBeUndefined();
    expect(r.einzugsstelle_bbnr).toBeUndefined();
    expect(r.staatsangehoerigkeit).toBe("DE");
  });

  it("#3 mergeArbeitnehmerExtra: Override gewinnt ueber Base", () => {
    const base: Partial<ArbeitnehmerExtraData> = {
      staatsangehoerigkeit: "DE",
      taetigkeitsschluessel: "111111111",
    };
    const override: Partial<ArbeitnehmerExtraData> = {
      taetigkeitsschluessel: "222222222",
    };
    const merged = mergeArbeitnehmerExtra(base, override);
    expect(merged.taetigkeitsschluessel).toBe("222222222"); // override
    expect(merged.staatsangehoerigkeit).toBe("DE"); // base
  });

  it("#4 hasOverride: true wenn Override-Feld abweicht", () => {
    const base: Partial<ArbeitnehmerExtraData> = {
      taetigkeitsschluessel: "111111111",
    };
    expect(
      hasOverride(base, { taetigkeitsschluessel: "222222222" })
    ).toBe(true);
    expect(hasOverride(base, { taetigkeitsschluessel: "111111111" })).toBe(
      false
    );
    expect(hasOverride(base, undefined)).toBe(false);
  });

  it("#5 resolveBuildContext: Happy-Path — Employee + Client vollstaendig + AG-Override.Betriebsnummer", () => {
    const r = resolveBuildContext(makeEmp(), makeClient(), {
      arbeitgeberOverride: AG_OVERRIDE,
    });
    expect(r.extraAn.taetigkeitsschluessel).toBe("123456789");
    expect(r.arbeitgeber.betriebsnummer).toBe("87654321");
    expect(r.arbeitgeber.anschrift.strasse).toBe("Firmenstr.");
    expect(r.overrideUsed).toBe(false);
  });

  it("#6 resolveBuildContext: Employee-NULL-Feld + extraOverride fuellt Luecke → funktioniert", () => {
    const emp = makeEmp({ taetigkeitsschluessel: null });
    const r = resolveBuildContext(emp, makeClient(), {
      extraOverride: { taetigkeitsschluessel: "888888888" },
      arbeitgeberOverride: AG_OVERRIDE,
    });
    expect(r.extraAn.taetigkeitsschluessel).toBe("888888888");
    expect(r.overrideUsed).toBe(true);
  });

  it("#7 resolveBuildContext: DB-NULL + kein Override → MissingSvDataError mit Employee-ID im Hint", () => {
    const emp = makeEmp({ taetigkeitsschluessel: null });
    expect(() =>
      resolveBuildContext(emp, makeClient(), {
        arbeitgeberOverride: AG_OVERRIDE,
      })
    ).toThrowError(MissingSvDataError);
    try {
      resolveBuildContext(emp, makeClient(), {
        arbeitgeberOverride: AG_OVERRIDE,
      });
    } catch (err) {
      if (err instanceof MissingSvDataError) {
        expect(err.employeeId).toBe(emp.id);
        expect(err.message).toContain(emp.id);
      }
    }
  });

  it("#8 resolveBuildContext: Client ohne Anschrift → MissingSvDataError fuer arbeitgeber.anschrift", () => {
    const c = makeClient({
      anschrift_strasse: null,
      anschrift_plz: null,
      anschrift_ort: null,
    });
    expect(() =>
      resolveBuildContext(makeEmp(), c, {
        arbeitgeberOverride: AG_OVERRIDE,
      })
    ).toThrowError(/arbeitgeber\.anschrift/);
  });

  it("#9 resolveBuildContext: fehlende Betriebsnummer → MissingSvDataError", () => {
    expect(() =>
      resolveBuildContext(makeEmp(), makeClient(), {
        arbeitgeberOverride: {}, // keine betriebsnummer
      })
    ).toThrowError(/betriebsnummer/);
  });

  it("#10 arbeitgeberFromClient: name + anschrift werden uebernommen", () => {
    const r = arbeitgeberFromClient(makeClient());
    expect(r.name).toBe("Test GmbH");
    expect(r.anschrift!.plz).toBe("10117");
  });

  it("#11 resolveBuildContext → buildJahresmeldung: Full-Integration-Smoke", () => {
    const ctx = resolveBuildContext(makeEmp(), makeClient(), {
      arbeitgeberOverride: AG_OVERRIDE,
    });
    const m = buildJahresmeldung({
      arbeitnehmer: ctx.arbeitnehmer,
      extraAn: ctx.extraAn,
      arbeitgeber: ctx.arbeitgeber,
      jahr: 2025,
      archivRows: [],
    });
    expect(m.abgabegrund).toBe("50");
    expect(m.beschaeftigung.taetigkeitsschluessel).toBe("123456789");
    expect(m.arbeitgeber.betriebsnummer).toBe("87654321");
    expect(m.meldezeitraum_von).toBe("2025-01-01");
  });
});
