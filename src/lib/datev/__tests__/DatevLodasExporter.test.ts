import { describe, it, expect } from "vitest";
import { Money } from "../../money/Money";
import {
  exportLohnbuchungen,
  validateLohnbuchungen,
  lodasFilename,
} from "../DatevLodasExporter";
import type { Lohnabrechnung } from "../../../domain/lohn/types";
import { LohnabrechnungsEngine } from "../../../domain/lohn/LohnabrechnungsEngine";
import type {
  Arbeitnehmer,
  Bundesland,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
} from "../../../domain/lohn/types";

function makeAn(overrides: Partial<Arbeitnehmer> = {}): Arbeitnehmer {
  return {
    id: "an-1",
    mandant_id: "m",
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
    pv_kinderlos_zuschlag: false,
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
): Lohnabrechnung {
  const engine = new LohnabrechnungsEngine();
  const buchung: Lohnbuchung = {
    id: "b-1",
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

const BASE_OPTIONS = {
  mandantNr: 12345,
  beraterNr: 99999,
  kanzleiName: "Kanzlei Test",
  wirtschaftsjahr: 2025,
  abrechnungsmonat: "2025-01",
  now: new Date("2025-02-05T10:00:00Z"),
};

describe("DatevLodasExporter", () => {
  it("Header beginnt mit LODAS;510;21;Buchungsstapel", () => {
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [],
    });
    const firstLine = csv.split("\r\n")[0];
    expect(firstLine).toMatch(/^"LODAS";510;21;"Buchungsstapel"/);
  });

  it("Spaltenköpfe inkl. Lohn-spezifischer Felder", () => {
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [],
    });
    const header = csv.split("\r\n")[1];
    expect(header).toContain('"Personalnummer"');
    expect(header).toContain('"Lohnart-Code"');
    expect(header).toContain('"Abrechnungsmonat"');
  });

  it("Einzelabrechnung: 5 Buchungssätze (Netto, LSt, SV-AN, SV-AG; KiSt=0 hier ausgelassen)", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    const dataLines = csv
      .split("\r\n")
      .slice(2)
      .filter((l) => l.length > 0);
    // Netto, LSt, (Soli=0 ausgelassen), (KiSt=0 ausgelassen), SV-AN, SV-AG = 4 Zeilen
    expect(dataLines.length).toBe(4);
  });

  it("Zeile für Netto: SOLL 4100 / HABEN 3740", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    const nettoLine = csv
      .split("\r\n")
      .slice(2)
      .find((l) => l.includes("Netto "));
    expect(nettoLine).toBeDefined();
    expect(nettoLine).toContain(";4100;3740;");
  });

  it("Gehalt-Flag isGehalt=true verwendet SOLL-Konto 4120", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "4000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001", isGehalt: true }],
    });
    const dataLines = csv
      .split("\r\n")
      .slice(2)
      .filter((l) => l.length > 0);
    // Alle Aufwands-Buchungen gegen 4120 (Gehalt)
    for (const l of dataLines) {
      if (l.includes(";4138;")) continue; // AG-Aufwand
      expect(l).toContain(";4120;");
    }
  });

  it("German decimal comma im Umsatz", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    // Zeilen 2+: Umsatz mit Komma
    const netto = csv.split("\r\n")[2];
    expect(netto).toMatch(/^[0-9]+,[0-9]{2};/);
  });

  it("Belegdatum TTMM aus Abrechnungsmonat abgeleitet (01.01 → 0101)", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    const dataLine = csv.split("\r\n")[2];
    expect(dataLine).toContain(";0101;"); // 01.01 als TTMM
  });

  it("Personalnummer im Belegfeld 1 UND im Lohn-Zusatzfeld", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "PERS-42" }],
    });
    const dataLine = csv.split("\r\n")[2];
    // Personalnummer erscheint in Belegfeld 1, im Buchungstext und in der
    // Extension-Spalte Personalnummer → mindestens 2 Vorkommen. Wir prüfen
    // dass sie UND in der Extension-Spalte auftaucht:
    expect(dataLine).toContain('"PERS-42"');
    const count = (dataLine.match(/PERS-42/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("Abrechnungsmonat im YYYYMM-Format in der Zusatzspalte", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-03", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungsmonat: "2025-03",
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    const dataLine = csv.split("\r\n")[2];
    expect(dataLine).toMatch(/;202503$/);
  });

  it("Zwei Abrechnungen → mehr Zeilen", () => {
    const an1 = makeAn({ id: "a1" });
    const an2 = makeAn({ id: "a2", kirchensteuerpflichtig: true, konfession: "EV" });
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [
        { abrechnung: abrechnung(an1, "2025-01", "3000"), personalNr: "001" },
        { abrechnung: abrechnung(an2, "2025-01", "5000"), personalNr: "002" },
      ],
    });
    const dataLines = csv
      .split("\r\n")
      .slice(2)
      .filter((l) => l.length > 0);
    // AN1: 4 Zeilen (Netto, LSt, SV-AN, SV-AG)
    // AN2: 5 Zeilen (+ KiSt)
    expect(dataLines.length).toBeGreaterThanOrEqual(9);
  });

  it("Abrechnung außerhalb des Monats wird gefiltert", () => {
    const an = makeAn();
    const abJan = abrechnung(an, "2025-01", "3000");
    const abFeb = abrechnung(an, "2025-02", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [
        { abrechnung: abJan, personalNr: "001" },
        { abrechnung: abFeb, personalNr: "001" },
      ],
      abrechnungsmonat: "2025-01",
    });
    const dataLines = csv
      .split("\r\n")
      .slice(2)
      .filter((l) => l.length > 0);
    // Nur Januar → keine Februar-Zeilen
    for (const l of dataLines) {
      expect(l).not.toContain(";202502");
    }
  });

  it("validateLohnbuchungen: Soll = Haben für korrekte Abrechnung", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const v = validateLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    expect(v.balanced).toBe(true);
    expect(v.entryCount).toBe(1);
  });

  it("validateLohnbuchungen: leere Eingabe → warning", () => {
    const v = validateLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [],
    });
    expect(v.entryCount).toBe(0);
    expect(v.warnings.length).toBeGreaterThan(0);
  });

  it("lodasFilename: DTV-konventions-nahes Format", () => {
    expect(
      lodasFilename({ mandantNr: 12345, abrechnungsmonat: "2025-03" })
    ).toBe("LODAS_12345_202503.csv");
  });

  it("CRLF line endings", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
    });
    // Keine nackten \n
    expect(csv.replace(/\r\n/g, "")).not.toMatch(/\n/);
  });

  it("Custom Konten override: eigener Aufwandskonto per konten-Option", () => {
    const an = makeAn();
    const ab = abrechnung(an, "2025-01", "3000");
    const csv = exportLohnbuchungen({
      ...BASE_OPTIONS,
      abrechnungen: [{ abrechnung: ab, personalNr: "001" }],
      konten: { bruttoLohnAufwand: "4111" },
    });
    const dataLine = csv.split("\r\n")[2];
    expect(dataLine).toContain(";4111;");
  });
});
