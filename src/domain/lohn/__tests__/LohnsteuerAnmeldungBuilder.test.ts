import { describe, it, expect } from "vitest";
import { buildLohnsteuerAnmeldung } from "../LohnsteuerAnmeldungBuilder";
import { LohnabrechnungsEngine } from "../LohnabrechnungsEngine";
import { Money } from "../../../lib/money/Money";
import type {
  Arbeitnehmer,
  LohnArt,
  Lohnbuchung,
  Bundesland,
  Steuerklasse,
} from "../types";

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

function abrechnung(
  an: Arbeitnehmer,
  monat: string,
  brutto: string
) {
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

describe("LohnsteuerAnmeldungBuilder (§ 41a EStG)", () => {
  it("Monatsmeldung mit 1 AN: Kennzahlen korrekt", () => {
    const an = makeAn();
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-01", "3000")],
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    expect(r.kennzahlen["10"]).toBe("1");
    expect(r.kennzahlen["41"]).toBe("3000.00");
    expect(Number(r.kennzahlen["42"])).toBeGreaterThan(0);
    expect(r.kennzahlen["43"]).toBe("0.00"); // keine sonstigen Bezüge
    expect(r.abgabefrist).toBe("10.02.2025");
  });

  it("Monatsmeldung mit 3 AN: Aggregation LSt + Soli + KiSt", () => {
    const a1 = makeAn({ id: "an-1" });
    const a2 = makeAn({
      id: "an-2",
      kirchensteuerpflichtig: true,
      konfession: "EV",
    });
    const a3 = makeAn({
      id: "an-3",
      kirchensteuerpflichtig: true,
      konfession: "RK",
      bundesland: "BY",
    });
    const abrs = [
      abrechnung(a1, "2025-01", "3000"),
      abrechnung(a2, "2025-01", "4000"),
      abrechnung(a3, "2025-01", "5000"),
    ];
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [a1, a2, a3],
      abrechnungen: abrs,
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    expect(r.kennzahlen["10"]).toBe("3");
    expect(Number(r.kennzahlen["41"])).toBe(12000);
    expect(Number(r.kennzahlen["71"])).toBeGreaterThan(0); // EV kist a2
    expect(Number(r.kennzahlen["72"])).toBeGreaterThan(0); // RK kist a3
  });

  it("Quartalsmeldung Q1 umfasst Januar+Februar+März", () => {
    const an = makeAn();
    const abrs = [
      abrechnung(an, "2025-01", "3000"),
      abrechnung(an, "2025-02", "3000"),
      abrechnung(an, "2025-03", "3000"),
    ];
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: abrs,
      zeitraum: "QUARTAL",
      quartal: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    expect(Number(r.kennzahlen["41"])).toBe(9000);
    expect(r.abgabefrist).toBe("10.04.2025");
  });

  it("Abgabefrist: Juli 2025 → 10.08.2025 (Sonntag) → 11.08.2025", () => {
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [],
      abrechnungen: [],
      zeitraum: "MONAT",
      monat: 7,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    expect(r.abgabefrist).toBe("11.08.2025");
  });

  it("Leere Periode: alle Kennzahlen = 0, Zahllast = 0", () => {
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [],
      abrechnungen: [],
      zeitraum: "MONAT",
      monat: 6,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    expect(r.kennzahlen["10"]).toBe("0");
    expect(r.summeZahllast).toBe("0.00");
    expect(r.kennzahlen["41"]).toBe("0.00");
  });

  it("Minijob: Pauschalsteuer landet in Kz 47, nicht in Kz 42", () => {
    const an = makeAn({
      id: "an-mini",
      beschaeftigungsart: "MINIJOB",
      kv_pflicht: false,
      rv_pflicht: false,
      av_pflicht: false,
      pv_pflicht: false,
    });
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-01", "500")],
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    // Kz 47 = 500 × 2 % = 10
    expect(r.kennzahlen["47"]).toBe("10.00");
    expect(r.kennzahlen["42"]).toBe("0.00"); // keine reguläre LSt
  });

  it("Sonstige Bezüge (Weihnachtsgeld): landen in Kz 43", () => {
    const an = makeAn();
    const engine = new LohnabrechnungsEngine();
    const LAW: LohnArt = {
      id: "la-w",
      bezeichnung: "Weihnachtsgeld",
      typ: "SONSTIGER_BEZUG",
      steuerpflichtig: true,
      svpflichtig: true,
      lst_meldung_feld: "3",
    };
    const lasExt = new Map([
      [LA_GEHALT.id, LA_GEHALT],
      [LAW.id, LAW],
    ]);
    const abr = engine.berechneAbrechnung({
      arbeitnehmer: an,
      lohnarten: lasExt,
      buchungen: [
        {
          id: "b-g",
          arbeitnehmer_id: an.id,
          abrechnungsmonat: "2025-11",
          lohnart_id: LA_GEHALT.id,
          betrag: new Money("3000"),
          buchungsdatum: "2025-11-15",
        },
        {
          id: "b-w",
          arbeitnehmer_id: an.id,
          abrechnungsmonat: "2025-11",
          lohnart_id: LAW.id,
          betrag: new Money("2000"),
          buchungsdatum: "2025-11-15",
        },
      ],
      abrechnungsmonat: "2025-11",
    });
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abr],
      zeitraum: "MONAT",
      monat: 11,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    expect(Number(r.kennzahlen["43"])).toBeGreaterThan(0);
  });

  it("Zahllast-Summe = LSt + Soli + KiSt", () => {
    const an = makeAn({
      kirchensteuerpflichtig: true,
      konfession: "EV",
    });
    const r = buildLohnsteuerAnmeldung({
      arbeitnehmer: [an],
      abrechnungen: [abrechnung(an, "2025-01", "6000")],
      zeitraum: "MONAT",
      monat: 1,
      jahr: 2025,
      betriebsnummer: "12345678",
    });
    const sum =
      Number(r.kennzahlen["42"]) +
      Number(r.kennzahlen["43"]) +
      Number(r.kennzahlen["47"]) +
      Number(r.kennzahlen["61"]) +
      Number(r.kennzahlen["71"]) +
      Number(r.kennzahlen["72"]);
    expect(Number(r.summeZahllast)).toBeCloseTo(sum, 2);
  });
});
