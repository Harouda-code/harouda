import { describe, it, expect } from "vitest";
import {
  employeeToArbeitnehmer,
  arbeitnehmerToEmployeeInput,
} from "../lohnAdapter";
import type { Employee } from "../../../types/db";

function makeEmp(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "e-1",
    company_id: "c-1",
    personalnummer: "001",
    vorname: "Max",
    nachname: "Mustermann",
    steuer_id: "12345678901",
    sv_nummer: "12345678901A",
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: "NW",
    einstellungsdatum: "2020-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: null,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: "AOK",
    zusatzbeitrag_pct: 2.5,
    privat_versichert: false,
    pv_kinderlos: true,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2020-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("lohnAdapter", () => {
  describe("employeeToArbeitnehmer", () => {
    it("Roman numeral I → 1, IV → 4, VI → 6", () => {
      expect(employeeToArbeitnehmer(makeEmp({ steuerklasse: "I" })).steuerklasse).toBe(1);
      expect(employeeToArbeitnehmer(makeEmp({ steuerklasse: "IV" })).steuerklasse).toBe(4);
      expect(employeeToArbeitnehmer(makeEmp({ steuerklasse: "VI" })).steuerklasse).toBe(6);
    });

    it("privat_versichert=true → kv_beitragsart=PRIVAT, kv_pflicht=false", () => {
      const a = employeeToArbeitnehmer(makeEmp({ privat_versichert: true }));
      expect(a.kv_beitragsart).toBe("PRIVAT");
      expect(a.kv_pflicht).toBe(false);
    });

    it("beschaeftigungsart=minijob → SV-pflichten alle false", () => {
      const a = employeeToArbeitnehmer(
        makeEmp({ beschaeftigungsart: "minijob" })
      );
      expect(a.beschaeftigungsart).toBe("MINIJOB");
      expect(a.kv_pflicht).toBe(false);
      expect(a.rv_pflicht).toBe(false);
      expect(a.av_pflicht).toBe(false);
      expect(a.pv_pflicht).toBe(false);
    });

    it("Konfession null → NONE, nicht kirchensteuerpflichtig", () => {
      const a = employeeToArbeitnehmer(makeEmp({ konfession: null }));
      expect(a.konfession).toBe("NONE");
      expect(a.kirchensteuerpflichtig).toBe(false);
    });

    it("Konfession 'EV' → EV + kirchensteuerpflichtig=true", () => {
      const a = employeeToArbeitnehmer(makeEmp({ konfession: "EV" }));
      expect(a.konfession).toBe("EV");
      expect(a.kirchensteuerpflichtig).toBe(true);
    });

    it("Keine bundesland-Angabe → Default NW", () => {
      const a = employeeToArbeitnehmer(makeEmp({ bundesland: null }));
      expect(a.bundesland).toBe("NW");
    });
  });

  describe("arbeitnehmerToEmployeeInput (Reverse-Mapping)", () => {
    it("StKl 1 → 'I', StKl 4 → 'IV'", () => {
      const input = arbeitnehmerToEmployeeInput({
        personalNr: "002",
        name: "Test",
        vorname: "A",
        geburtsdatum: "1990-01-01",
        sv_nummer: "",
        steuer_id: "",
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
        betriebsnummer: "00000000",
        eintrittsdatum: "2024-01-01",
      });
      expect(input.steuerklasse).toBe("I");
      expect(input.privat_versichert).toBe(false);
      expect(input.beschaeftigungsart).toBe("vollzeit");
    });

    it("Roundtrip StKl 6 + PKV + Minijob", () => {
      const original: Parameters<typeof arbeitnehmerToEmployeeInput>[0] = {
        personalNr: "003",
        name: "Test",
        vorname: "B",
        geburtsdatum: "1990-01-01",
        sv_nummer: "",
        steuer_id: "",
        steuerklasse: 6,
        kinderfreibetraege: 0,
        kirchensteuerpflichtig: false,
        konfession: "NONE",
        bundesland: "BY",
        kv_pflicht: false,
        kv_beitragsart: "PRIVAT",
        kv_zusatzbeitrag: "2.5",
        rv_pflicht: false,
        av_pflicht: false,
        pv_pflicht: false,
        pv_kinderlos_zuschlag: false,
        pv_anzahl_kinder: 0,
        beschaeftigungsart: "MINIJOB",
        betriebsnummer: "00000000",
        eintrittsdatum: "2024-01-01",
      };
      const input = arbeitnehmerToEmployeeInput(original);
      expect(input.steuerklasse).toBe("VI");
      expect(input.privat_versichert).toBe(true);
      expect(input.beschaeftigungsart).toBe("minijob");
    });
  });
});
