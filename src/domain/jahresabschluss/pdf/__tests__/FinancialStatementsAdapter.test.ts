// Jahresabschluss-E4 / Schritt 1 · FinancialStatementsAdapter-Tests.

import { describe, it, expect } from "vitest";
import {
  bilanzToPdfmakeContent,
  guvToPdfmakeContent,
  anlagenspiegelToPdfmakeContent,
} from "../FinancialStatementsAdapter";
import { buildBalanceSheet } from "../../../accounting/BalanceSheetBuilder";
import { buildGuv } from "../../../accounting/GuvBuilder";
import { SKR03_SEED } from "../../../../api/skr03";
import type { Account, JournalEntry } from "../../../../types/db";
import type {
  AnlagenspiegelData,
  AnlagenspiegelGruppe,
} from "../../../anlagen/AnlagenService";
import type { GuvReport } from "../../../accounting/GuvBuilder";

let entryCounter = 0;
function entry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number
): JournalEntry {
  entryCounter += 1;
  return {
    id: `e-${entryCounter}`,
    datum,
    beleg_nr: `B${entryCounter}`,
    beschreibung: "",
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
  return SKR03_SEED.map((a, i) => ({
    ...a,
    id: `a-${i}`,
  })) as Account[];
}

function seedEntries(): JournalEntry[] {
  entryCounter = 0;
  return [
    // Eröffnungsbilanz Kasse 1000 → Kapital 0800 10.000.
    entry("2025-01-01", "1000", "2300", 10_000),
    // Umsatzerloese: Kasse Soll 2.000 Haben 8400.
    entry("2025-06-01", "1000", "8400", 2_000),
    // Aufwand: 4210 Miete Soll 500 Haben Kasse.
    entry("2025-06-15", "4210", "1000", 500),
  ];
}

function anlagenFixture(): AnlagenspiegelData {
  const gebaeude: AnlagenspiegelGruppe = {
    konto_anlage: "0200",
    anzahl: 1,
    ak_start: 100_000,
    zugaenge: 0,
    abgaenge: 0,
    ak_ende: 100_000,
    abschreibungen_kumuliert: 20_000,
    buchwert_start: 82_000,
    buchwert_ende: 80_000,
  };
  const edv: AnlagenspiegelGruppe = {
    konto_anlage: "0440",
    anzahl: 2,
    ak_start: 5_000,
    zugaenge: 1_200,
    abgaenge: 0,
    ak_ende: 6_200,
    abschreibungen_kumuliert: 3_500,
    buchwert_start: 1_833,
    buchwert_ende: 2_700,
  };
  const totals: AnlagenspiegelGruppe = {
    konto_anlage: "Σ",
    anzahl: 3,
    ak_start: 105_000,
    zugaenge: 1_200,
    abgaenge: 0,
    ak_ende: 106_200,
    abschreibungen_kumuliert: 23_500,
    buchwert_start: 83_833,
    buchwert_ende: 82_700,
  };
  return { bis_jahr: 2025, gruppen: [gebaeude, edv], totals };
}

describe("FinancialStatementsAdapter · Bilanz", () => {
  it("#1 bilanzToPdfmakeContent: liefert Aktiva + Passiva-Tabelle + Summen", () => {
    const report = buildBalanceSheet(accounts(), seedEntries(), {
      stichtag: "2025-12-31",
    });
    const out = bilanzToPdfmakeContent(report);
    const json = JSON.stringify(out);
    expect(out.length).toBeGreaterThanOrEqual(4);
    expect(json).toContain("Stichtag: 2025-12-31");
    expect(json).toContain("Aktiva");
    expect(json).toContain("Passiva");
    expect(json).toContain("Summe Aktiva");
    expect(json).toContain("Summe Passiva");
  });

  it("#2 bilanzToPdfmakeContent: Euro-Formatierung (de-DE) in Tabellen-Cells", () => {
    const report = buildBalanceSheet(accounts(), seedEntries(), {
      stichtag: "2025-12-31",
    });
    const out = bilanzToPdfmakeContent(report);
    const json = JSON.stringify(out);
    // "11.500,00 €" oder vergleichbar — deutsches Trennzeichen-Format.
    expect(json).toMatch(/\d+,\d{2}\s*€/);
  });

  it("#3 bilanzToPdfmakeContent: Einrueckung pro Depth via margin", () => {
    const report = buildBalanceSheet(accounts(), seedEntries(), {
      stichtag: "2025-12-31",
    });
    const out = bilanzToPdfmakeContent(report);
    // In mindestens einer Tabellen-Row taucht ein margin > 0 auf.
    const json = JSON.stringify(out);
    expect(json).toMatch(/"margin":\[\d+,0,0,0\]/);
  });
});

describe("FinancialStatementsAdapter · GuV", () => {
  it("#4 guvToPdfmakeContent: Staffelform-Tabelle + Jahresergebnis-Summe", () => {
    const report = buildGuv(accounts(), seedEntries(), {
      periodStart: "2025-01-01",
      stichtag: "2025-12-31",
    });
    const out = guvToPdfmakeContent(report);
    const json = JSON.stringify(out);
    expect(json).toContain("Geschäftsjahr: 2025-01-01");
    expect(json).toContain("Jahresergebnis");
    // Subtotal-Unterstreichung.
    expect(json).toContain("decoration");
  });

  it("#5 guvToPdfmakeContent: UKV liefert Warn-Text + Fallback-Liste", () => {
    const reportUkv: GuvReport = {
      ...buildGuv(accounts(), seedEntries(), {
        periodStart: "2025-01-01",
        stichtag: "2025-12-31",
      }),
      verfahren: "UKV",
    };
    const out = guvToPdfmakeContent(reportUkv);
    const json = JSON.stringify(out);
    expect(json).toContain("Umsatzkostenverfahren");
    expect(json).toContain("nicht implementiert");
  });
});

describe("FinancialStatementsAdapter · Anlagenspiegel", () => {
  it("#6 anlagenspiegelToPdfmakeContent: 8-Spalten-Tabelle mit Summenzeile", () => {
    const out = anlagenspiegelToPdfmakeContent(anlagenFixture());
    const json = JSON.stringify(out);
    expect(json).toContain("Anlagenspiegel zum 31.12.2025");
    expect(json).toContain("AK 01.01.");
    expect(json).toContain("AfA kum.");
    expect(json).toContain("Buchwert 31.12.");
    expect(json).toContain("0200");
    expect(json).toContain("0440");
    expect(json).toContain("Summe");
  });

  it("#7 anlagenspiegelToPdfmakeContent: leere Gruppen -> nur Header + Summe", () => {
    const empty: AnlagenspiegelData = {
      bis_jahr: 2025,
      gruppen: [],
      totals: {
        konto_anlage: "Σ",
        anzahl: 0,
        ak_start: 0,
        zugaenge: 0,
        abgaenge: 0,
        ak_ende: 0,
        abschreibungen_kumuliert: 0,
        buchwert_start: 0,
        buchwert_ende: 0,
      },
    };
    const out = anlagenspiegelToPdfmakeContent(empty);
    expect(out.length).toBe(2); // Caption + Table.
  });
});

describe("FinancialStatementsAdapter · Edge-Cases", () => {
  it("#8 Alle 3 Builder: kein Crash bei komplett leeren Entries", () => {
    const emptyEntries: JournalEntry[] = [];
    const b = buildBalanceSheet(accounts(), emptyEntries, {
      stichtag: "2025-12-31",
    });
    const g = buildGuv(accounts(), emptyEntries, {
      periodStart: "2025-01-01",
      stichtag: "2025-12-31",
    });
    expect(() => bilanzToPdfmakeContent(b)).not.toThrow();
    expect(() => guvToPdfmakeContent(g)).not.toThrow();
  });

  it("#9 Bilanzwarnung bei Differenz > 0", () => {
    const r = buildBalanceSheet(accounts(), seedEntries(), {
      stichtag: "2025-12-31",
    });
    // Simuliere Differenz-Footnote ohne tatsächlich manipulierten Report.
    const modified = { ...r, balancierungsDifferenz: "12.34" };
    const out = bilanzToPdfmakeContent(modified);
    const json = JSON.stringify(out);
    expect(json).toContain("Balancierungsdifferenz");
  });
});
