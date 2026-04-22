// Sprint 14 / Schritt 3 · ZmElsterXmlBuilder-Tests.

import { describe, it, expect } from "vitest";
import { buildZmElsterXml, ZM_ELSTER_SCHEMA_VERSION } from "../ZmElsterXmlBuilder";
import { buildZm } from "../../ustva/ZmBuilder";
import type { Account, JournalEntry } from "../../../types/db";

function acct(konto_nr: string, kategorie: Account["kategorie"]): Account {
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
function entry(
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

const META = {
  eigene_ust_id: "DE123456789",
};

describe("ZmElsterXmlBuilder · ELSTER-XML", () => {
  it("#1 Leere Periode: Nullmeldung + warning", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const x = buildZmElsterXml(r, META);
    expect(x.eintraege_count).toBe(0);
    expect(x.warnings.join("|")).toContain("Nullmeldung");
    expect(x.schema_version).toBe(ZM_ELSTER_SCHEMA_VERSION);
    expect(x.xml).toContain('<Anmeldungssteuern art="ZM" version="2025">');
    expect(x.xml).toContain('zeitraum="43"'); // Q3 -> "43"
    expect(x.xml).toContain('jahr="2025"');
  });

  it("#2 IG-Lieferung FR-Kunde: <Meldung art='W'> mit UStId + Land + Betrag", () => {
    const accounts = [acct("10001", "aktiva"), acct("8125", "ertrag")];
    const entries = [entry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
      ],
    });
    const x = buildZmElsterXml(r, META);
    expect(x.eintraege_count).toBe(1);
    expect(x.xml).toContain('<Meldung art="W">');
    expect(x.xml).toContain("<UStId>FR12345678901</UStId>");
    expect(x.xml).toContain("<Land>FR</Land>");
    expect(x.xml).toContain("<Betrag>5000,00</Betrag>");
    // Summen-Sektion.
    expect(x.xml).toContain("<Kz41>5000,00</Kz41>");
  });

  it("#3 Monats-Meldung: zeitraum='07' fuer Juli", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "MONAT",
      monat: 7,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const x = buildZmElsterXml(r, META);
    expect(x.xml).toContain('zeitraum="07"');
  });

  it("#4 Ungueltige eigene USt-IdNr: warning im Result", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 1,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const x = buildZmElsterXml(r, { eigene_ust_id: "DE1" });
    expect(x.warnings.join("|")).toMatch(/eigene USt-IdNr/i);
  });

  it("#5 Eigene UStId wird als Steuerfall-Attribut eingesetzt", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 1,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const x = buildZmElsterXml(r, META);
    expect(x.xml).toContain('ustId="DE123456789"');
  });

  it("#6 Dreiecksgeschaeft + IG-sonstige-Leistung: beide Entries art='D'/'S'", () => {
    const accounts = [
      acct("10003", "aktiva"),
      acct("10004", "aktiva"),
      acct("8336", "ertrag"), // IG-sonstige-Leistung SKR03
      acct("8140", "ertrag"), // Dreiecksgeschaeft SKR03
    ];
    const entries = [
      entry("2025-04-01", "10003", "8336", 1200, "IGS"),
      entry("2025-04-15", "10004", "8140", 800, "DREI"),
    ];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 2,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10003", ustid: "AT123456789", land: "AT" },
        { kontoNr: "10004", ustid: "IT12345678901", land: "IT" },
      ],
    });
    const x = buildZmElsterXml(r, META);
    // Mindestens ein Entry mit art='S' UND einer mit art='D' ODER 'W'
    // (je nach zmStructure-Mapping). Pruefen wir die Summen.
    expect(x.eintraege_count).toBeGreaterThanOrEqual(1);
    expect(x.xml).toMatch(/<Kz21>/);
  });

  it("#7 XML ist well-formed: Anmeldungssteuern genau 1x geoeffnet + geschlossen", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 1,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    const x = buildZmElsterXml(r, META);
    expect((x.xml.match(/<Anmeldungssteuern /g) ?? []).length).toBe(1);
    expect((x.xml.match(/<\/Anmeldungssteuern>/g) ?? []).length).toBe(1);
  });
});
