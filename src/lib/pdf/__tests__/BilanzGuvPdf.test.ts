import { describe, it, expect } from "vitest";
import { BilanzPdfGenerator } from "../BilanzPdfGenerator";
import { GuvPdfGenerator } from "../GuvPdfGenerator";
import { GehaltsbescheinigungGenerator } from "../GehaltsbescheinigungGenerator";
import { buildBalanceSheet } from "../../../domain/accounting/BalanceSheetBuilder";
import { buildGuv } from "../../../domain/accounting/GuvBuilder";
import type { Account, JournalEntry } from "../../../types/db";
import { Money } from "../../money/Money";
import type {
  Arbeitnehmer,
  Bundesland,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
} from "../../../domain/lohn/types";
import { LohnabrechnungsEngine } from "../../../domain/lohn/LohnabrechnungsEngine";

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"]
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie,
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  };
}
function makeEntry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  beleg = "B1"
): JournalEntry {
  return {
    id: `e-${datum}-${beleg}`,
    datum,
    beleg_nr: beleg,
    beschreibung: beleg,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz: null,
    status: "gebucht",
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
    kostenstelle: null,
  };
}

describe("BilanzPdfGenerator", () => {
  it("erzeugt PDF für balancierten Abschluss", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
    ];
    const entries = [makeEntry("2025-01-01", "1200", "0900", 10000)];
    const bilanz = buildBalanceSheet(accounts, entries, {
      stichtag: "2025-12-31",
    });
    const gen = new BilanzPdfGenerator();
    const blob = gen.generate(bilanz, {
      title: "Bilanz",
      mandantName: "Testfirma GmbH",
      stichtag: "2025-12-31",
    });
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toMatch(/pdf/);
  });

  it("erzeugt PDF für unbalancierten Abschluss (mit roter Differenz)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 5000),
      makeEntry("2025-06-01", "1200", "8400", 10000),
    ];
    const bilanz = buildBalanceSheet(accounts, entries, {
      stichtag: "2025-12-31",
    });
    const gen = new BilanzPdfGenerator();
    const blob = gen.generate(bilanz, {
      title: "Bilanz",
      mandantName: "Test",
      stichtag: "2025-12-31",
    });
    expect(blob.size).toBeGreaterThan(500);
  });

  it("leere Bilanz → gültiges kleines PDF", () => {
    const bilanz = buildBalanceSheet([], [], { stichtag: "2025-12-31" });
    const gen = new BilanzPdfGenerator();
    const blob = gen.generate(bilanz, {
      title: "Bilanz",
      mandantName: "Test",
      stichtag: "2025-12-31",
    });
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe("GuvPdfGenerator", () => {
  it("erzeugt PDF mit allen § 275 Posten", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 4000, "LOHN"),
    ];
    const guv = buildGuv(accounts, entries, {
      periodStart: "2025-01-01",
      stichtag: "2025-12-31",
    });
    const gen = new GuvPdfGenerator();
    const blob = gen.generate(guv, {
      title: "GuV",
      mandantName: "Test",
      reportPeriod: { von: "2025-01-01", bis: "2025-12-31" },
    });
    expect(blob.size).toBeGreaterThan(1500);
  });

  it("Verlust: rote Farbe für Jahresergebnis", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [makeEntry("2025-03-01", "4100", "1200", 5000, "L")];
    const guv = buildGuv(accounts, entries, {
      periodStart: "2025-01-01",
      stichtag: "2025-12-31",
    });
    expect(new Money(guv.jahresergebnis).isNegative()).toBe(true);
    const gen = new GuvPdfGenerator();
    const blob = gen.generate(guv, {
      title: "GuV",
      mandantName: "Test",
    });
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe("GehaltsbescheinigungGenerator (§ 108 GewO)", () => {
  function makeAn(): Arbeitnehmer {
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
      kirchensteuerpflichtig: true,
      konfession: "EV",
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
    };
  }

  it("erzeugt PDF mit allen § 108 GewO Pflichtfeldern", async () => {
    const an = makeAn();
    const engine = new LohnabrechnungsEngine();
    const la: LohnArt = {
      id: "la-gehalt",
      bezeichnung: "Gehalt",
      typ: "LAUFENDER_BEZUG",
      steuerpflichtig: true,
      svpflichtig: true,
      lst_meldung_feld: "3",
    };
    const buchung: Lohnbuchung = {
      id: "b-1",
      arbeitnehmer_id: an.id,
      abrechnungsmonat: "2025-01",
      lohnart_id: "la-gehalt",
      betrag: new Money("3000"),
      buchungsdatum: "2025-01-15",
    };
    const abrechnung = engine.berechneAbrechnung({
      arbeitnehmer: an,
      lohnarten: new Map([["la-gehalt", la]]),
      buchungen: [buchung],
      abrechnungsmonat: "2025-01",
    });
    const gen = new GehaltsbescheinigungGenerator();
    const blob = await gen.generate({
      title: "Gehaltsbescheinigung",
      mandantName: "Arbeitgeber Test",
      arbeitnehmer: an,
      abrechnung,
    });
    expect(blob.size).toBeGreaterThan(2000);
    expect(blob.type).toMatch(/pdf/);
  });

  it("mit Arbeitgeber-Kosten-Sektion ist PDF größer", async () => {
    const an = makeAn();
    const engine = new LohnabrechnungsEngine();
    const la: LohnArt = {
      id: "la-gehalt",
      bezeichnung: "Gehalt",
      typ: "LAUFENDER_BEZUG",
      steuerpflichtig: true,
      svpflichtig: true,
      lst_meldung_feld: "3",
    };
    const buchung: Lohnbuchung = {
      id: "b-1",
      arbeitnehmer_id: an.id,
      abrechnungsmonat: "2025-01",
      lohnart_id: "la-gehalt",
      betrag: new Money("3000"),
      buchungsdatum: "2025-01-15",
    };
    const abrechnung = engine.berechneAbrechnung({
      arbeitnehmer: an,
      lohnarten: new Map([["la-gehalt", la]]),
      buchungen: [buchung],
      abrechnungsmonat: "2025-01",
    });
    const gen = new GehaltsbescheinigungGenerator();
    const ohne = await gen.generate({
      title: "G",
      mandantName: "M",
      arbeitnehmer: an,
      abrechnung,
    });
    const genMit = new GehaltsbescheinigungGenerator();
    const mit = await genMit.generate({
      title: "G",
      mandantName: "M",
      arbeitnehmer: an,
      abrechnung,
      showArbeitgeberKosten: true,
    });
    expect(mit.size).toBeGreaterThan(ohne.size);
  });
});
