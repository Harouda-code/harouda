// Multi-Tenancy Phase 2 / Schritt 5 · End-to-End-Smoke Lohn-Lauf.
//
// Verifiziert, dass 1 Lohn-Lauf konsistent folgende Persistenz-Ziele
// anspricht (DEMO-Pfad, ohne React-Mount der Page):
//   • Journal-Batch (createEntriesBatch via postPayrollAsJournal).
//   • Archiv-Row (AbrechnungArchivRepo.save).
//   • Beide teilen dieselbe batchId.
//   • Beide tragen dieselbe client_id (= Kuehn).
// Neg-Assertion: ein zweiter Mandant (B) bleibt clean — kein Daten-Leak.

import { describe, it, expect, beforeEach } from "vitest";
import { postPayrollAsJournal, buildArchivAbrechnungFromRow } from "../../utils/payrollPosting";
import { AbrechnungArchivRepo } from "../../lib/db/lohnRepos";
import { employeeToArbeitnehmer } from "../../lib/db/lohnAdapter";
import { store } from "../../api/store";
import type { Employee } from "../../types/db";
import type { Settings } from "../../contexts/SettingsContext";
import type { PayrollPostingRow } from "../../utils/payrollPosting";
import type { SvResult } from "../../utils/sozialversicherung";

const KUEHN = "client-kuehn";
const OTHER = "client-other";
const COMPANY = "company-demo";

function kuehnEmployee(): Employee {
  return {
    id: "emp-kuehn-001",
    company_id: COMPANY,
    client_id: KUEHN,
    personalnummer: "K-001",
    vorname: "Anna",
    nachname: "Kühn-Mitarbeiterin",
    steuer_id: null,
    sv_nummer: null,
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: "BY",
    einstellungsdatum: "2024-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: null,
    zusatzbeitrag_pct: 1.7,
    privat_versichert: false,
    pv_kinderlos: true,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function svResult(): SvResult {
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

function kuehnRow(): PayrollPostingRow {
  return {
    employee: kuehnEmployee(),
    brutto: 3000,
    lohnsteuer: 300,
    soli: 0,
    kirchensteuer: 0,
    netto: 2130,
    sv: svResult(),
  };
}

function validSettings(): Settings {
  return {
    lohnKontoPersonalkosten: "4110",
    lohnKontoSvAgAufwand: "4130",
    lohnKontoLstVerb: "1741",
    lohnKontoSvVerb: "1742",
    lohnKontoNettoVerb: "1755",
  } as unknown as Settings;
}

describe("Lohn-Lauf E2E-Smoke · Journal + Archiv + Mandant-Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    // Aktive company_id setzen, damit `getActiveCompanyId()` in
    // postPayrollAsJournal deterministisch ist. Im DEMO wird sie nicht
    // durch Supabase validiert, aber der Archiv-Write trägt sie
    // trotzdem in die persistierte Row.
    localStorage.setItem("harouda:activeCompanyId", COMPANY);
  });

  it("1 Mitarbeiter · Journal 4 Entries, Archiv 1 Row, beide mit batchId + clientId=Kühn", async () => {
    // --- Seed: zweiter Mandant mit Bestandsdaten, die NICHT touched werden dürfen ---
    const otherEmp: Employee = {
      ...kuehnEmployee(),
      id: "emp-other-001",
      personalnummer: "O-001",
      client_id: OTHER,
      nachname: "Andere-Mitarbeiterin",
    };
    store.setEmployees([kuehnEmployee(), otherEmp]);

    // --- Act: Lohn-Lauf Kühn, März 2025 ---
    const res = await postPayrollAsJournal([kuehnRow()], validSettings(), {
      datum: "2025-03-31",
      periodLabel: "März 2025",
      clientId: KUEHN,
    });
    expect(res.entriesCreated).toBe(4);
    expect(res.batchId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(res.errors).toEqual([]);
    expect(res.processedRows).toHaveLength(1);

    // Archiv-Write pro processedRow (wie in PayrollRunPage.handlePostGL).
    const archivRepo = new AbrechnungArchivRepo();
    for (const r of res.processedRows) {
      await archivRepo.save(COMPANY, KUEHN, {
        arbeitnehmer: employeeToArbeitnehmer(r.employee),
        abrechnungsmonat: "2025-03",
        abrechnung: buildArchivAbrechnungFromRow(r, "2025-03"),
        batchId: res.batchId,
      });
    }

    // --- Assert: Journal-Seite ---
    const entries = store.getEntries();
    expect(entries).toHaveLength(4);
    expect(entries.every((e) => e.batch_id === res.batchId)).toBe(true);
    expect(entries.every((e) => e.client_id === KUEHN)).toBe(true);

    // --- Assert: Archiv-Seite ---
    const archiv = store.getLohnArchiv();
    expect(archiv).toHaveLength(1);
    const archivRow = archiv[0];
    expect(archivRow.client_id).toBe(KUEHN);
    expect(archivRow.employee_id).toBe("emp-kuehn-001");
    expect(archivRow.abrechnungsmonat).toBe("2025-03");
    expect(archivRow.batch_id).toBe(res.batchId);
    expect(archivRow.gesamt_brutto).toBe(3000);
    expect(archivRow.gesamt_netto).toBe(2130);

    // --- Assert: Mandant-Isolation (kein Daten-Leak zu OTHER) ---
    const otherEntries = entries.filter((e) => e.client_id === OTHER);
    expect(otherEntries).toHaveLength(0);
    const otherArchiv = archiv.filter((r) => r.client_id === OTHER);
    expect(otherArchiv).toHaveLength(0);

    // --- Assert: OTHER-Mitarbeiter wurde nicht verändert ---
    const emps = store.getEmployees();
    const other = emps.find((e) => e.id === "emp-other-001");
    expect(other).toBeDefined();
    expect(other!.client_id).toBe(OTHER);
  });
});
