import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildUstva } from "../UstvaBuilder";
import { buildUstvaXml } from "../UstvaXmlBuilder";

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
  betrag: number
): JournalEntry {
  return {
    id: `e-${datum}-${soll}-${haben}`,
    datum,
    beleg_nr: "B",
    beschreibung: "B",
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

describe("UstvaXmlBuilder (ELSTER-shape preview)", () => {
  const accounts = [
    makeAccount("1200", "aktiva"),
    makeAccount("8400", "ertrag"),
    makeAccount("1576", "aktiva"),
  ];
  const entries = [
    makeEntry("2025-10-10", "1200", "8400", 10000),
    makeEntry("2025-10-20", "1576", "1200", 950),
  ];

  it("generates valid XML header + Anmeldungssteuern root", () => {
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const xml = buildUstvaXml(r);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toMatch(/<Anmeldungssteuern art="UStVA" version="2025">/);
    expect(xml).toMatch(/<\/Anmeldungssteuern>/);
  });

  it("includes Anmeldungszeitraum jahr + zeitraum attributes (MONAT)", () => {
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const xml = buildUstvaXml(r);
    expect(xml).toMatch(/<Anmeldungszeitraum jahr="2025" zeitraum="10"/);
  });

  it("zeitraum code for Q3 is '43' (ELSTER convention 41-44)", () => {
    const r = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const xml = buildUstvaXml(r);
    expect(xml).toMatch(/zeitraum="43"/);
  });

  it("Dauerfrist attribute present when active", () => {
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: true,
    });
    const xml = buildUstvaXml(r);
    expect(xml).toMatch(/dauerfrist="1"/);
  });

  it("includes Kz81 and Kz81_USt with german decimal (comma) format", () => {
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const xml = buildUstvaXml(r);
    expect(xml).toMatch(/<Kz81>10000,00<\/Kz81>/);
    expect(xml).toMatch(/<Kz81_USt>1900,00<\/Kz81_USt>/);
    expect(xml).toMatch(/<Kz66>950,00<\/Kz66>/);
  });

  it("does not emit zero-value Kz (except Kz 65)", () => {
    const r = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const xml = buildUstvaXml(r);
    expect(xml).not.toMatch(/<Kz81>/);
    // Kz 65 zahllast = 0.00 should still appear
    expect(xml).toMatch(/<Kz65>0,00<\/Kz65>/);
  });

  it("omits SUBTOTAL entries (UST_SUMME, VST_SUMME)", () => {
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const xml = buildUstvaXml(r);
    expect(xml).not.toMatch(/UST_SUMME/);
    expect(xml).not.toMatch(/VST_SUMME/);
  });
});
