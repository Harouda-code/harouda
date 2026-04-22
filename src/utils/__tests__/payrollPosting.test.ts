// Multi-Tenancy Phase 2 / Schritt 4 · postPayrollAsJournal → createEntriesBatch.
//
// DEMO-Pfad-Tests (vitest-Env ist DEMO_MODE per Default). Supabase-
// Pfad wird nicht gemockt — das Transaktions-Verhalten kommt dort von
// PostgREST. Hier verifizieren wir:
//   • Aggregation: pro Row werden bis zu 4 sub-Entries gesammelt und
//     GEMEINSAM im Batch geschrieben.
//   • Row-Skip bei fehlenden Settings-Konten.
//   • Kein Batch-Call bei leeren / nur-invaliden Rows.
//   • Fehler-Propagation (Period-Locked-Szenario).

import { describe, it, expect, beforeEach, vi } from "vitest";
import { postPayrollAsJournal } from "../payrollPosting";
import * as journalApi from "../../api/journal";
import { store } from "../../api/store";
import type { Settings } from "../../contexts/SettingsContext";
import type { Employee } from "../../types/db";
import type { SvResult } from "../sozialversicherung";
import type { PayrollPostingRow } from "../payrollPosting";

const CLIENT_A = "client-A";

function dummyEmployee(
  personalnummer: string,
  overrides: Partial<Employee> = {}
): Employee {
  return {
    id: `emp-${personalnummer}`,
    personalnummer,
    vorname: "Test",
    nachname: `Person-${personalnummer}`,
    ...overrides,
  } as unknown as Employee;
}

function zeroSv(): SvResult {
  return {
    arbeitnehmer: { kv: 0, pv: 0, rv: 0, av: 0, gesamt: 0 },
    arbeitgeber: {
      kv: 0,
      pv: 0,
      rv: 0,
      av: 0,
      u1: 0,
      u2: 0,
      insolvenzgeld: 0,
      gesamt: 0,
    },
    method: "null",
    bemessung_kvpv: 0,
    bemessung_rvav: 0,
  };
}

function fullSv(): SvResult {
  // Minimal, aber nicht-null — reicht für 2 SV-sub-Entries (AN + AG).
  return {
    arbeitnehmer: { kv: 200, pv: 50, rv: 280, av: 40, gesamt: 570 },
    arbeitgeber: {
      kv: 200,
      pv: 50,
      rv: 280,
      av: 40,
      u1: 0,
      u2: 0,
      insolvenzgeld: 0,
      gesamt: 570,
    },
    method: "regulaer",
    bemessung_kvpv: 3000,
    bemessung_rvav: 3000,
  };
}

function fullRow(pnr: string, brutto = 3000): PayrollPostingRow {
  return {
    employee: dummyEmployee(pnr),
    brutto,
    lohnsteuer: 300,
    soli: 0,
    kirchensteuer: 0,
    netto: 2130,
    sv: fullSv(),
  };
}

function validSettings(overrides: Partial<Settings> = {}): Settings {
  // Minimum für postPayrollAsJournal. Die übrigen Settings-Felder werden
  // von dieser Funktion nicht gelesen — `as unknown as Settings`-Cast
  // deckt die Type-Lücke.
  return {
    lohnKontoPersonalkosten: "4110",
    lohnKontoSvAgAufwand: "4130",
    lohnKontoLstVerb: "1741",
    lohnKontoSvVerb: "1742",
    lohnKontoNettoVerb: "1755",
    ...overrides,
  } as unknown as Settings;
}

const OPTS = {
  datum: "2025-03-31",
  periodLabel: "März 2025",
  clientId: CLIENT_A,
};

beforeEach(() => {
  localStorage.clear();
});

describe("postPayrollAsJournal · createEntriesBatch-Integration (DEMO)", () => {
  it("#1 1 Mitarbeiter mit allen Abzügen: 4 Entries, batchId gesetzt, errors leer", async () => {
    const res = await postPayrollAsJournal([fullRow("P001")], validSettings(), OPTS);
    expect(res.entriesCreated).toBe(4);
    expect(res.batchId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(res.errors).toEqual([]);
    expect(res.totalBrutto).toBe(3000);
    expect(res.totalAgSv).toBe(570);

    // Alle 4 Entries landen im Store mit derselben batch_id.
    const written = store.getEntries();
    expect(written).toHaveLength(4);
    expect(written.every((e) => e.batch_id === res.batchId)).toBe(true);
    expect(written.every((e) => e.client_id === CLIENT_A)).toBe(true);
  });

  it("#2 2 Mitarbeiter: 8 Entries, EIN gemeinsamer batchId", async () => {
    const res = await postPayrollAsJournal(
      [fullRow("P001"), fullRow("P002", 4000)],
      validSettings(),
      OPTS
    );
    expect(res.entriesCreated).toBe(8);
    expect(res.batchId).not.toBeNull();
    expect(res.errors).toEqual([]);
    const written = store.getEntries();
    expect(written).toHaveLength(8);
    const uniqueBatches = new Set(written.map((e) => e.batch_id));
    expect(uniqueBatches.size).toBe(1);
    expect(uniqueBatches.has(res.batchId)).toBe(true);
  });

  it("#3 Row mit fehlendem Settings-Konto: row-skip, errors gesetzt, übrige Rows laufen durch", async () => {
    // lohnKontoLstVerb fehlt → 1. Row wird komplett verworfen (sie hat
    // lstSum > 0). Die 2. Row (ohne LSt) läuft aber auch NICHT durch,
    // weil fullRow lohnsteuer=300 hat → beide skip. Wir brauchen eine
    // Row ohne LSt für den Gegenbeweis.
    const rowA = fullRow("P001"); // hat LSt → wird verworfen
    const rowB: PayrollPostingRow = {
      employee: dummyEmployee("P002"),
      brutto: 1500,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      netto: 1200,
      sv: fullSv(),
    };
    const res = await postPayrollAsJournal(
      [rowA, rowB],
      validSettings({ lohnKontoLstVerb: "" }),
      OPTS
    );
    // P001 übersprungen (1 Error), P002 mit 3 Entries (SV-AN, Netto, SV-AG).
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/P001/);
    expect(res.errors[0]).toMatch(/lohnKontoLstVerb/);
    expect(res.entriesCreated).toBe(3);
    expect(res.batchId).not.toBeNull();
    const written = store.getEntries();
    expect(written.every((e) => e.beleg_nr.includes("P002"))).toBe(true);
  });

  it("#4 leere Rows: entriesCreated=0, kein createEntriesBatch-Call, errors leer", async () => {
    const spy = vi.spyOn(journalApi, "createEntriesBatch");
    const res = await postPayrollAsJournal([], validSettings(), OPTS);
    expect(res.entriesCreated).toBe(0);
    expect(res.batchId).toBeNull();
    expect(res.errors).toEqual([]);
    expect(res.totalBrutto).toBe(0);
    expect(res.totalAgSv).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    expect(store.getEntries()).toHaveLength(0);
    spy.mockRestore();
  });

  it("#5 Batch-Fehler (Period-Locked) propagiert, Journal bleibt unberührt", async () => {
    // Periode komplett gesperrt → createEntriesBatch wirft in der
    // Pre-Validierung (assertPeriodNotClosed). postPayrollAsJournal
    // hat kein try/catch → Fehler propagiert an den Test.
    localStorage.setItem(
      "harouda:settings",
      JSON.stringify({ periodClosedBefore: "2099-12-31" })
    );
    await expect(
      postPayrollAsJournal([fullRow("P001")], validSettings(), OPTS)
    ).rejects.toThrow(/Periode ist abgeschlossen/);
    expect(store.getEntries()).toHaveLength(0);
  });

  it("#7 processedRows enthält nur Rows, die tatsächlich Entries produziert haben", async () => {
    // 3 Rows: P001 voll (4 Entries), P002 ohne LSt (3 Entries),
    // P003 mit brutto=0 (0 Entries, wird skip).
    const rowP1 = fullRow("P001");
    const rowP2: PayrollPostingRow = {
      employee: dummyEmployee("P002"),
      brutto: 1500,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      netto: 1200,
      sv: fullSv(),
    };
    const rowP3: PayrollPostingRow = {
      employee: dummyEmployee("P003"),
      brutto: 0,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      netto: 0,
      sv: zeroSv(),
    };
    const res = await postPayrollAsJournal(
      [rowP1, rowP2, rowP3],
      validSettings(),
      OPTS
    );
    expect(res.processedRows).toHaveLength(2);
    expect(res.processedRows.map((r) => r.employee.personalnummer).sort()).toEqual([
      "P001",
      "P002",
    ]);
  });

  it("#8 processedRows ist bei row-skip konsistent kürzer als rows", async () => {
    // LSt-Konto fehlt → P001 (hat LSt) wird übersprungen, P002 (ohne LSt)
    // bleibt. processedRows soll nur P002 enthalten.
    const rowA = fullRow("P001");
    const rowB: PayrollPostingRow = {
      employee: dummyEmployee("P002"),
      brutto: 1500,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      netto: 1200,
      sv: fullSv(),
    };
    const res = await postPayrollAsJournal(
      [rowA, rowB],
      validSettings({ lohnKontoLstVerb: "" }),
      OPTS
    );
    expect(res.processedRows).toHaveLength(1);
    expect(res.processedRows[0].employee.personalnummer).toBe("P002");
    expect(res.errors).toHaveLength(1);
  });

  it("Bonus: Row mit brutto=0 wird übersprungen (Legacy-Verhalten)", async () => {
    const zeroRow: PayrollPostingRow = {
      employee: dummyEmployee("P000"),
      brutto: 0,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      netto: 0,
      sv: zeroSv(),
    };
    const res = await postPayrollAsJournal([zeroRow], validSettings(), OPTS);
    expect(res.entriesCreated).toBe(0);
    expect(res.batchId).toBeNull();
    expect(res.errors).toEqual([]);
  });
});
