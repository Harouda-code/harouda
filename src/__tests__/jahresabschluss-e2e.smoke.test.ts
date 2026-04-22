// Jahresabschluss-E4 / Schritt 4 · End-to-End-Smoke-Tests.
//
// Zweck: sicherstellen, dass die gesamte Pipeline aus E1-E4
// (Domain-Builders → FinancialStatementsAdapter → DocumentMergePipeline
// → optional PdfA3Converter) in konsistentem Zustand arbeitet.
// Assertions nur auf STRUKTUR, keine Pixel-/Byte-Vergleiche.

import { describe, it, expect } from "vitest";
import { buildBalanceSheet } from "../domain/accounting/BalanceSheetBuilder";
import { buildGuv } from "../domain/accounting/GuvBuilder";
import { getAnlagenspiegelData } from "../domain/anlagen/AnlagenService";
import { computeBausteine } from "../domain/jahresabschluss/RulesEngine";
import { buildJahresabschlussDocument } from "../domain/jahresabschluss/pdf/DocumentMergePipeline";
import { convertToPdfA3 } from "../domain/jahresabschluss/pdf/PdfA3Converter";
import { SKR03_SEED } from "../api/skr03";
import { PDFDocument } from "pdf-lib";
import type { Account, JournalEntry, Anlagegut } from "../types/db";
import type { CoverPageInput } from "../domain/jahresabschluss/pdf/CoverPageBuilder";

let counter = 0;
function entry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number
): JournalEntry {
  counter += 1;
  return {
    id: `e2e-${counter}`,
    datum,
    beleg_nr: `B${counter}`,
    beschreibung: "e2e",
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
  };
}

function accounts(): Account[] {
  return SKR03_SEED.map((a, i) => ({ ...a, id: `a-${i}` })) as Account[];
}

function balancedEntries(): JournalEntry[] {
  counter = 0;
  return [
    // EB: Kasse Soll 20.000, Haben Grundkapital (2300) 20.000.
    entry("2025-01-01", "1000", "2300", 20_000),
    // Umsatz 5.000.
    entry("2025-06-01", "1000", "8400", 5_000),
    // Miet-Aufwand 1.200.
    entry("2025-06-15", "4210", "1000", 1_200),
    // Gehalt-Aufwand 2.000.
    entry("2025-07-01", "4110", "1000", 2_000),
  ];
}

function smallAnlagen(): Anlagegut[] {
  return [
    {
      id: "ag-1",
      company_id: null,
      client_id: null,
      inventar_nr: "A001",
      bezeichnung: "Bürocomputer",
      anschaffungsdatum: "2024-03-01",
      anschaffungskosten: 3_000,
      nutzungsdauer_jahre: 3,
      afa_methode: "linear",
      konto_anlage: "0440",
      konto_afa: "4830",
      konto_abschreibung_kumuliert: null,
      aktiv: true,
      abgangsdatum: null,
      abgangserloes: null,
      notizen: null,
      parent_id: null,
      created_at: "2024-03-01T00:00:00Z",
      updated_at: "2024-03-01T00:00:00Z",
    },
  ];
}

function coverFor(
  overrides: Partial<CoverPageInput> = {}
): CoverPageInput {
  return {
    firmenname: "Test GmbH",
    rechtsform: "GmbH",
    hrb_nummer: "HRB 9999",
    hrb_gericht: "Hamburg",
    steuernummer: "143/456/78901",
    geschaeftsjahr_von: "01.01.2025",
    geschaeftsjahr_bis: "31.12.2025",
    stichtag: "31.12.2025",
    groessenklasse: "klein",
    berichtsart: "Jahresabschluss",
    erstellt_am: "23.04.2026",
    ...overrides,
  };
}

describe("Jahresabschluss End-to-End (Smoke)", () => {
  it("#1 GmbH klein Happy-Path: Builder→Adapter→Pipeline liefert vollstaendiges Dokument", () => {
    const accts = accounts();
    const entries = balancedEntries();
    const bilanz = buildBalanceSheet(accts, entries, {
      stichtag: "2025-12-31",
    });
    const guv = buildGuv(accts, entries, {
      periodStart: "2025-01-01",
      stichtag: "2025-12-31",
    });
    const spiegel = getAnlagenspiegelData(2025, smallAnlagen());

    const bausteine = computeBausteine({
      rechtsform: "GmbH",
      groessenklasse: "klein",
    });
    const doc = buildJahresabschlussDocument({
      cover: coverFor(),
      bausteine,
      bilanzReport: bilanz,
      guvReport: guv,
      anlagenspiegelReport: spiegel,
    });
    const json = JSON.stringify(doc.content);

    // Deckblatt sichtbar.
    expect(json).toContain("JAHRESABSCHLUSS");
    expect(json).toContain("Test GmbH");
    // TOC-Container.
    expect(json).toContain("INHALTSVERZEICHNIS");
    // Bilanz mit echten Zahlen (nicht Platzhalter).
    expect(json).toContain("Stichtag: 2025-12-31");
    expect(json).toContain("Summe Aktiva");
    expect(json).toContain("Summe Passiva");
    // GuV-Periodenhinweis.
    expect(json).toContain("Geschäftsjahr: 2025-01-01");
    // Anlagenspiegel.
    expect(json).toContain("Anlagenspiegel zum 31.12.2025");
    expect(json).toContain("0440");
    // Anhang (klein-GmbH bekommt Anhang-Bausteine).
    expect(bausteine.anhang).toBe(true);
    expect(json).toContain("Anhang");
    // Bescheinigung.
    expect(json).toContain("Bescheinigung");
    // Footer-Funktion ab Seite 3.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const footer = doc.footer as (c: number, p: number) => any;
    expect(JSON.stringify(footer(3, 5))).toContain("HGB 2025");
  });

  it("#2 Einzelunternehmen: keine Bilanz/GuV/Anhang/Lagebericht, nur EÜR+Anlagenspiegel+Bescheinigung", () => {
    const bausteine = computeBausteine({
      rechtsform: "Einzelunternehmen",
      groessenklasse: "klein",
    });
    // Einzel hat weder Bilanz noch GuV.
    expect(bausteine.bilanz).toBe(false);
    expect(bausteine.guv).toBe(false);
    expect(bausteine.euer).toBe(true);
    expect(bausteine.anhang).toBe(false);
    expect(bausteine.lagebericht).toBe(false);
    const doc = buildJahresabschlussDocument({
      cover: coverFor({
        rechtsform: "Einzelunternehmen",
        hrb_nummer: null,
        hrb_gericht: null,
      }),
      bausteine,
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Einzelunternehmen");
    expect(json).toContain("INHALTSVERZEICHNIS");
    expect(json).not.toContain("Bilanz (§ 266 HGB)");
    expect(json).not.toContain("Gewinn- und Verlustrechnung");
    expect(json).not.toContain("Lagebericht");
    expect(json).toContain("Bescheinigung");
  });

  it("#3 GmbH mittel: Lagebericht erscheint mit § 289-Bausteinen", () => {
    const accts = accounts();
    const entries = balancedEntries();
    const bausteine = computeBausteine({
      rechtsform: "GmbH",
      groessenklasse: "mittel",
    });
    expect(bausteine.lagebericht).toBe(true);
    expect(bausteine.anhang).toBe(true);

    const doc = buildJahresabschlussDocument({
      cover: coverFor({ groessenklasse: "mittel" }),
      bausteine,
      bilanzReport: buildBalanceSheet(accts, entries, {
        stichtag: "2025-12-31",
      }),
      guvReport: buildGuv(accts, entries, {
        periodStart: "2025-01-01",
        stichtag: "2025-12-31",
      }),
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Lagebericht");
    expect(json).toContain("Wirtschaftsbericht");
    expect(json).toContain("§ 289");
    // Anhang mit mind. einem § 285-Baustein.
    expect(json).toMatch(/§ 28[4567]/);
  });

  it("#4 PDF/A-3-Integration: pdfmake-Doc → convertToPdfA3 liefert gueltiges PDF mit Metadata", async () => {
    // Wir erzeugen ein minimalstes pdfmake-Doc ohne pdfmake-Browser-
    // Aufruf (happy-dom hat kein Canvas). Stattdessen bauen wir direkt
    // ein pdf-lib-PDF, das wir convertToPdfA3 fuettern — das testet
    // die Post-Processing-Stufe isoliert, reicht fuer den E2E-Smoke.
    const raw = await PDFDocument.create();
    raw.addPage();
    const rawBytes = await raw.save();

    const xbrlXml = `<?xml version="1.0" encoding="UTF-8"?><xbrl/>`;
    const out = await convertToPdfA3({
      pdfBytes: rawBytes,
      metadata: {
        title: "Jahresabschluss 2025 — E2E",
        subject: "e2e-smoke",
        keywords: ["HGB", "GmbH", "2025"],
        producer: "Harouda",
        creation_date: new Date("2026-04-23T00:00:00Z"),
      },
      iccProfileBytes: new Uint8Array([1, 2, 3, 4]),
      xbrlAttachment: {
        filename: "ebilanz-2025.xml",
        mimeType: "application/xml",
        bytes: new TextEncoder().encode(xbrlXml),
        relationship: "Source",
      },
    });
    const outStr = new TextDecoder("latin1").decode(out);
    expect(outStr).toContain("ebilanz-2025.xml");
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getTitle()).toContain("Jahresabschluss");
    // pdf-lib ueberschreibt Producer beim Save mit eigenem String;
    // dass wir setProducer/setCreator aufgerufen haben, schlaegt sich
    // stattdessen im Creator nieder.
    expect(reloaded.getCreator()).toContain("Harouda");
  });
});
