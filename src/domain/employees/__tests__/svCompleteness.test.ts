// Sprint 18 / Schritt 3 · svCompleteness-Tests.

import { describe, it, expect } from "vitest";
import {
  CLIENT_ANSCHRIFT_FIELD_LABELS,
  EMPLOYEE_SV_FIELD_LABELS,
  EMPLOYEE_SV_REQUIRED_FIELDS,
  formatMissingFields,
  isClientAnschriftComplete,
  isEmployeeSvDataComplete,
} from "../svCompleteness";
import type { Client, Employee } from "../../../types/db";

function makeEmp(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "e-1",
    company_id: null,
    client_id: "c-1",
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
    // Sprint 18 SV-Felder:
    staatsangehoerigkeit: "DE",
    geburtsname: null,
    geburtsort: null,
    taetigkeitsschluessel: "123456789",
    mehrfachbeschaeftigung: false,
    einzugsstelle_bbnr: "01234567",
    anschrift_strasse: "Musterweg",
    anschrift_hausnummer: "1",
    anschrift_plz: "10115",
    anschrift_ort: "Berlin",
    anschrift_land: "DE",
    ...overrides,
  };
}

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "c-1",
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

describe("isEmployeeSvDataComplete", () => {
  it("#1 Vollstaendiger Employee: complete=true, missing=[]", () => {
    const r = isEmployeeSvDataComplete(makeEmp());
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it("#2 NULL-Taetigkeitsschluessel: missing enthaelt das Feld", () => {
    const r = isEmployeeSvDataComplete(
      makeEmp({ taetigkeitsschluessel: null })
    );
    expect(r.complete).toBe(false);
    expect(r.missing).toContain("taetigkeitsschluessel");
  });

  it("#3 Leer-String wird als fehlend gewertet (trim)", () => {
    const r = isEmployeeSvDataComplete(makeEmp({ anschrift_plz: "   " }));
    expect(r.complete).toBe(false);
    expect(r.missing).toContain("anschrift_plz");
  });

  it("#4 Alle 8 Pflichtfelder fehlend → alle in missing-Liste", () => {
    const r = isEmployeeSvDataComplete(
      makeEmp({
        sv_nummer: null,
        staatsangehoerigkeit: null,
        taetigkeitsschluessel: null,
        einzugsstelle_bbnr: null,
        anschrift_strasse: null,
        anschrift_hausnummer: null,
        anschrift_plz: null,
        anschrift_ort: null,
      })
    );
    expect(r.complete).toBe(false);
    expect(r.missing).toHaveLength(EMPLOYEE_SV_REQUIRED_FIELDS.length);
  });

  it("#5 mehrfachbeschaeftigung=false gilt NICHT als fehlend (DB-Default)", () => {
    // `mehrfachbeschaeftigung` ist NICHT in der Pflichtliste → sein
    // Zustand ist irrelevant fuer complete.
    const r = isEmployeeSvDataComplete(
      makeEmp({ mehrfachbeschaeftigung: false })
    );
    expect(r.complete).toBe(true);
  });
});

describe("isClientAnschriftComplete", () => {
  it("#6 Vollstaendige Anschrift: complete=true", () => {
    const r = isClientAnschriftComplete(makeClient());
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it("#7 Ohne Strasse + ohne Ort: missing-Liste zaehlt beide", () => {
    const r = isClientAnschriftComplete(
      makeClient({ anschrift_strasse: null, anschrift_ort: null })
    );
    expect(r.complete).toBe(false);
    expect(r.missing).toContain("anschrift_strasse");
    expect(r.missing).toContain("anschrift_ort");
    expect(r.missing).toHaveLength(2);
  });
});

describe("formatMissingFields", () => {
  it("#8 Liefert komma-separierte Labels fuer die missing-Liste", () => {
    const missing: Array<keyof Employee> = [
      "taetigkeitsschluessel",
      "einzugsstelle_bbnr",
    ];
    const s = formatMissingFields(missing, EMPLOYEE_SV_FIELD_LABELS);
    expect(s).toContain("Tätigkeitsschlüssel");
    expect(s).toContain("Einzugsstelle BBNR");
    expect(s).toContain(",");
  });

  it("#9 Client-Labels: Strasse (Arbeitgeber)", () => {
    const missing: Array<keyof Client> = ["anschrift_strasse"];
    const s = formatMissingFields(missing, CLIENT_ANSCHRIFT_FIELD_LABELS);
    expect(s).toBe("Straße (Arbeitgeber)");
  });
});
