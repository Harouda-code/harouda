import { describe, it, expect } from "vitest";
import { EbilanzXbrlBuilder } from "../EbilanzXbrlBuilder";
import type { EbilanzInput } from "../EbilanzValidator";
import { buildBalanceSheet } from "../../accounting/BalanceSheetBuilder";
import { buildGuv } from "../../accounting/GuvBuilder";
import type { Account, JournalEntry } from "../../../types/db";
import {
  BILANZ_XBRL_MAP,
  GUV_XBRL_MAP,
  mappingStats,
  bilanzElement,
  guvElement,
} from "../hgbTaxonomie68";

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

function buildInput(accounts: Account[], entries: JournalEntry[]): EbilanzInput {
  const bilanz = buildBalanceSheet(accounts, entries, {
    stichtag: "2025-12-31",
  });
  const guv = buildGuv(accounts, entries, {
    periodStart: "2025-01-01",
    stichtag: "2025-12-31",
  });
  return {
    unternehmen: {
      name: "Musterfirma GmbH",
      steuernummer: "123/456/78901",
      strasse: "Teststr. 1",
      plz: "12345",
      ort: "Berlin",
      rechtsform: "GmbH",
      groessenklasse: "klein",
    },
    wirtschaftsjahr: { von: "2025-01-01", bis: "2025-12-31" },
    bilanz,
    guv,
    status: "Entwurf",
  };
}

describe("hgbTaxonomie68", () => {
  it("mappingStats: bilanz + guv counts plausibel (>= 20 + >= 20)", () => {
    const s = mappingStats();
    expect(s.bilanzCount).toBeGreaterThanOrEqual(20);
    expect(s.guvCount).toBeGreaterThanOrEqual(20);
    expect(s.total).toBe(s.bilanzCount + s.guvCount);
  });

  it("bilanzElement('A') → de-gaap-ci:bs.ass.fixAss", () => {
    expect(bilanzElement("A")).toBe("de-gaap-ci:bs.ass.fixAss");
  });

  it("bilanzElement('P.A.V') → Jahresüberschuss-Element", () => {
    expect(bilanzElement("P.A.V")).toContain("netIncome");
  });

  it("guvElement('1') → Umsatzerlöse", () => {
    expect(guvElement("1")).toBe("de-gaap-ci:is.netIncome.regular.saleRev");
  });

  it("guvElement('17') → Jahresergebnis Final", () => {
    expect(guvElement("17")).toBe("de-gaap-ci:is.netIncome.final");
  });

  it("Unbekannter Code → undefined", () => {
    expect(bilanzElement("ZZ")).toBeUndefined();
    expect(guvElement("999")).toBeUndefined();
  });

  it("Alle Bilanz-Elemente im de-gaap-ci:bs.* Namespace", () => {
    for (const el of Object.values(BILANZ_XBRL_MAP)) {
      expect(el).toMatch(/^de-gaap-ci:bs\./);
    }
  });

  it("Alle GuV-Elemente im de-gaap-ci:is.* Namespace", () => {
    for (const el of Object.values(GUV_XBRL_MAP)) {
      expect(el).toMatch(/^de-gaap-ci:is\./);
    }
  });
});

describe("EbilanzXbrlBuilder — generation", () => {
  const builder = new EbilanzXbrlBuilder();

  it("empty input erzeugt well-formed XBRL-Envelope", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(r.xml).toContain("<xbrli:xbrl");
    expect(r.xml).toContain("</xbrli:xbrl>");
  });

  it("deklariert alle benötigten Namespaces", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.xml).toContain("xmlns:de-gaap-ci=");
    expect(r.xml).toContain("xmlns:de-gcd=");
    expect(r.xml).toContain("xmlns:iso4217=");
  });

  it("Instant-Context für Bilanz + Duration-Context für GuV", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.xml).toMatch(/<xbrli:context id="CurrentPeriodInstant">/);
    expect(r.xml).toMatch(/<xbrli:instant>2025-12-31<\/xbrli:instant>/);
    expect(r.xml).toMatch(/<xbrli:context id="CurrentPeriodDuration">/);
    expect(r.xml).toMatch(/<xbrli:startDate>2025-01-01<\/xbrli:startDate>/);
    expect(r.xml).toMatch(/<xbrli:endDate>2025-12-31<\/xbrli:endDate>/);
  });

  it("Unit-Definition EUR (iso4217:EUR)", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.xml).toMatch(/<xbrli:unit id="EUR">/);
    expect(r.xml).toMatch(/<xbrli:measure>iso4217:EUR<\/xbrli:measure>/);
  });

  it("Dokumenteninformationen enthalten Status + Rechtsform + Größe", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.xml).toContain(">Entwurf<");
    expect(r.xml).toContain(">GmbH<");
    expect(r.xml).toContain(">klein<");
  });

  it("Stammdaten: Name + Steuernummer + Adresse", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.xml).toContain("Musterfirma GmbH");
    expect(r.xml).toContain("123/456/78901");
    expect(r.xml).toContain("Teststr. 1");
    expect(r.xml).toContain("12345");
    expect(r.xml).toContain("Berlin");
  });

  it("Bilanz-Facts mit decimals=2 und unitRef=EUR", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
    ];
    const entries = [makeEntry("2025-01-01", "1200", "0900", 10000)];
    const input = buildInput(accounts, entries);
    const r = builder.build(input);
    // B.IV (Kasse/Bank) mit 10000
    expect(r.xml).toMatch(
      /<de-gaap-ci:bs\.ass\.currAss\.cash contextRef="CurrentPeriodInstant" unitRef="EUR" decimals="2">10000\.00<\/de-gaap-ci:bs\.ass\.currAss\.cash>/
    );
  });

  it("GuV-Facts mit Duration-Context", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-06-01", "1200", "8400", 5000, "UMS")];
    const input = buildInput(accounts, entries);
    const r = builder.build(input);
    expect(r.xml).toMatch(
      /<de-gaap-ci:is\.netIncome\.regular\.saleRev contextRef="CurrentPeriodDuration" unitRef="EUR" decimals="2">5000\.00<\/de-gaap-ci:is\.netIncome\.regular\.saleRev>/
    );
  });

  it("Dezimal-Punkt (nicht Komma) im XBRL-Wert", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-06-01", "1200", "8400", 1234.56)];
    const input = buildInput(accounts, entries);
    const r = builder.build(input);
    expect(r.xml).toContain("1234.56");
    expect(r.xml).not.toMatch(/>1234,56</);
  });

  it("Zero-Werte werden weggelassen", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    // Es sollte KEIN bs.ass.fixAss mit >0.00< geben
    expect(r.xml).not.toMatch(/>0\.00</);
  });

  it("XML-Escape für Sonderzeichen im Namen", () => {
    const accounts: Account[] = [];
    const entries: JournalEntry[] = [];
    const input = buildInput(accounts, entries);
    input.unternehmen.name = "A&B <GmbH>";
    const r = builder.build(input);
    expect(r.xml).toContain("A&amp;B &lt;GmbH&gt;");
  });

  it("Validation-Result Teil des Builds", () => {
    const input = buildInput([], []);
    const r = builder.build(input);
    expect(r.validation).toBeDefined();
    expect(r.validation.isValid).toBe(true); // empty is valid (no balance issue)
  });

  it("Validation: fehlende Steuernummer → Error E001", () => {
    const input = buildInput([], []);
    input.unternehmen.steuernummer = "";
    const r = builder.build(input);
    expect(r.validation.isValid).toBe(false);
    expect(r.validation.errors.some((e) => e.code === "E001")).toBe(true);
  });

  it("Validation: Bilanz↔GuV mismatch → Error E020", () => {
    // Konstruiere künstlichen Mismatch: Umsatz in GuV + nicht in Bilanz-ERFOLG-Rules.
    // Einfacher: manipuliere Bilanz-Result direkt
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-06-01", "1200", "8400", 1000)];
    const input = buildInput(accounts, entries);
    // Überschreibe GuV-Jahresergebnis für Test
    input.guv.jahresergebnis = "9999.00";
    const r = builder.build(input);
    expect(r.validation.errors.some((e) => e.code === "E020")).toBe(true);
  });
});
