/**
 * Tests für ZmXmlBuilder (ELMA5-Preview-XML). Sprint 7.
 *
 * Deckt ab:
 *  - Wurzel-Element + Zeitraum-Attribute (MONAT/QUARTAL)
 *  - Empfänger mit L/S/D-Meldungen (je eine eigene `<Meldung>`-Zeile)
 *  - Null-Empfänger → Platzhalter-Kommentar
 *  - Summen-Block Kz41/Kz21/Kz42
 *  - XML-Escape für Sonderzeichen in UStID/Land (Edge-Case)
 */

import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildZm } from "../ZmBuilder";
import { buildZmXml } from "../ZmXmlBuilder";

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
  beleg = "B"
): JournalEntry {
  return {
    id: `e-${datum}-${beleg}-${soll}-${haben}`,
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

describe("buildZmXml — Preview-XML analog UstvaXmlBuilder", () => {
  it("leerer Report → XML mit Platzhalter-Kommentar und Summen 0,00", () => {
    const report = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const xml = buildZmXml(report);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<ZusammenfassendeMeldung art="ZM" version="2025">');
    expect(xml).toContain('art="QUARTAL"');
    expect(xml).toContain('code="43"'); // Q3 → 43
    expect(xml).toContain('jahr="2025"');
    expect(xml).toContain("<!-- keine Meldungen -->");
    expect(xml).toContain("<Kz41>0,00</Kz41>");
    expect(xml).toContain("<Kz21>0,00</Kz21>");
    expect(xml).toContain("<Kz42>0,00</Kz42>");
    expect(xml).toContain("Preview-XML, kein ELMA5-DFÜ-Datensatz");
  });

  it("Einzelner EU-Kunde mit IG-Lieferung → <Meldung Art=L>", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const report = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
      ],
    });
    const xml = buildZmXml(report);
    expect(xml).toContain("<UStID>FR12345678901</UStID>");
    expect(xml).toContain("<Land>FR</Land>");
    expect(xml).toContain("<Art>L</Art>");
    expect(xml).toContain("<Betrag>5000,00</Betrag>");
    expect(xml).toContain("<Kz41>5000,00</Kz41>");
    // Keine S/D-Meldung, da Beträge = 0
    expect(xml).not.toContain("<Art>S</Art>");
    expect(xml).not.toContain("<Art>D</Art>");
  });

  it("IG-sonstige Leistung (8336) → <Meldung Art=S>, Kz21 korrekt", () => {
    const accounts = [
      makeAccount("10002", "aktiva"),
      makeAccount("8336", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10002", "8336", 2000, "IGS")];
    const report = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10002", ustid: "NL123456789B01", land: "NL" },
      ],
    });
    const xml = buildZmXml(report);
    expect(xml).toContain("<Art>S</Art>");
    expect(xml).toContain("<Betrag>2000,00</Betrag>");
    expect(xml).toContain("<Kz21>2000,00</Kz21>");
  });

  it("MONAT-Zeitraum → code ist 2-stellige Monat (z. B. 09)", () => {
    const report = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "MONAT",
      monat: 9,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const xml = buildZmXml(report);
    expect(xml).toContain('art="MONAT"');
    expect(xml).toContain('code="09"');
  });

  it("Empfänger mit mehreren Arten (L + S) → zwei separate <Meldung>-Blöcke", () => {
    const accounts = [
      makeAccount("10003", "aktiva"),
      makeAccount("8125", "ertrag"),
      makeAccount("8336", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-09-15", "10003", "8125", 3000, "IGL"),
      makeEntry("2025-09-20", "10003", "8336", 1500, "IGS"),
    ];
    const report = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10003", ustid: "FR99887766554", land: "FR" },
      ],
    });
    const xml = buildZmXml(report);
    const lMatches = (xml.match(/<Art>L<\/Art>/g) ?? []).length;
    const sMatches = (xml.match(/<Art>S<\/Art>/g) ?? []).length;
    expect(lMatches).toBe(1);
    expect(sMatches).toBe(1);
    expect(xml).toContain("<Kz41>3000,00</Kz41>");
    expect(xml).toContain("<Kz21>1500,00</Kz21>");
  });

  it("XML-Escape: Sonderzeichen in Land/UStID werden entschärft", () => {
    const accounts = [
      makeAccount("10004", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10004", "8125", 1000, "E")];
    const report = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        // Pathologischer Land-Code mit <>&" — sollte maskiert werden
        { kontoNr: "10004", ustid: 'FR<>"&\'123', land: "F&R" },
      ],
    });
    const xml = buildZmXml(report);
    expect(xml).toContain("FR&lt;&gt;&quot;&amp;&apos;123");
    expect(xml).toContain("<Land>F&amp;R</Land>");
    // Keine un-escaped Sonderzeichen in den Feld-Inhalten
    expect(xml).not.toMatch(/<UStID>.*<.*<\/UStID>/);
  });
});
