// Nacht-Modus (2026-04-21) · Schritt 4 — Cross-Module-Consistency-Smoke.
//
// Ziel: die Pipeline Lohn → FIBU (Journal-Batch + Archiv) → Anlage G
// (Journal-Aggregation) ist relational konsistent. Keine hartkodierten
// Euro-Zahlen — alle Summen werden zur Laufzeit verglichen.
//
// API-Level-Only, kein React-Mount.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { autoSeedDemoIfNeeded } from "../api/demoSeed";
import { store } from "../api/store";
import { postPayrollAsJournal } from "../utils/payrollPosting";
import {
  AbrechnungArchivRepo,
  LohnArtRepo,
} from "../lib/db/lohnRepos";
import { employeeToArbeitnehmer } from "../lib/db/lohnAdapter";
import {
  buildArchivAbrechnungFromRow,
} from "../utils/payrollPosting";
import { buildAnlageG } from "../domain/est/AnlageGBuilder";
import { importAnlageNAusArchiv } from "../domain/est/archivEstImport";
import { tagsForKonto } from "../domain/est/tagsForKonto";
import type { Employee, Account, JournalEntry } from "../types/db";
import type { SvResult } from "../utils/sozialversicherung";
import type { PayrollPostingRow } from "../utils/payrollPosting";
import type { Settings } from "../contexts/SettingsContext";

const KUEHN_ID = "client-kuehn-cross-module";
const COMPANY_ID = "company-demo-cross-module";

beforeEach(() => {
  localStorage.clear();
});

function svDummy(): SvResult {
  return {
    arbeitnehmer: { kv: 410, pv: 85, rv: 465, av: 65, gesamt: 1025 },
    arbeitgeber: {
      kv: 410,
      pv: 85,
      rv: 465,
      av: 65,
      u1: 0,
      u2: 0,
      insolvenzgeld: 0,
      gesamt: 1025,
    },
    method: "regulaer",
    bemessung_kvpv: 5000,
    bemessung_rvav: 5000,
  };
}

function gfEmployee(): Employee {
  return {
    id: "emp-gf-cross",
    company_id: COMPANY_ID,
    client_id: KUEHN_ID,
    personalnummer: "P-GF-001",
    vorname: "Max",
    nachname: "GF-Cross",
    steuer_id: null,
    sv_nummer: null,
    steuerklasse: "III",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: null,
    einstellungsdatum: "2024-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 5000,
    stundenlohn: null,
    krankenkasse: null,
    zusatzbeitrag_pct: null,
    privat_versichert: false,
    pv_kinderlos: false,
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

function gfRow(): PayrollPostingRow {
  return {
    employee: gfEmployee(),
    brutto: 5000,
    lohnsteuer: 800,
    soli: 44,
    kirchensteuer: 72,
    netto: 3059, // brutto - sv_an - lohnsteuer etc., Wert nur für Round-Trip-Test
    sv: svDummy(),
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

/** Sicherstellen, dass die relevanten Konten im Account-Universum
 *  existieren UND Tags haben — sonst kann buildAnlageG nichts mappen. */
function seedAccounts() {
  const accs: Account[] = [
    {
      id: "acc-4110",
      konto_nr: "4110",
      bezeichnung: "Gehälter",
      kategorie: "aufwand",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: tagsForKonto("4110"),
    },
    {
      id: "acc-4130",
      konto_nr: "4130",
      bezeichnung: "Gesetzl. SV-Aufwand",
      kategorie: "aufwand",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: tagsForKonto("4130"),
    },
    {
      id: "acc-1741",
      konto_nr: "1741",
      bezeichnung: "Verbindl. aus LSt/KiSt",
      kategorie: "passiva",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: [],
    },
    {
      id: "acc-1742",
      konto_nr: "1742",
      bezeichnung: "Verbindl. aus SV",
      kategorie: "passiva",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: [],
    },
    {
      id: "acc-1755",
      konto_nr: "1755",
      bezeichnung: "Verbindl. aus Lohn",
      kategorie: "passiva",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: [],
    },
  ];
  store.setAccounts(accs);
}

describe("Cross-Module Smoke · Lohn → Journal-Batch + Archiv → Anlage G", () => {
  it("relational: Lohn-Lauf speist identische Personal-Summe in AnlageG UND passenden Archiv-Row + AnlageN-Import", async () => {
    // --- Seed ---
    store.setEmployees([gfEmployee()]);
    seedAccounts();
    localStorage.setItem("harouda:activeCompanyId", COMPANY_ID);

    // --- 1. Lohn-Lauf für März 2025 ---
    const res = await postPayrollAsJournal([gfRow()], validSettings(), {
      datum: "2025-03-31",
      periodLabel: "März 2025",
      clientId: KUEHN_ID,
    });
    expect(res.entriesCreated).toBeGreaterThan(0);
    expect(res.batchId).not.toBeNull();
    expect(res.errors).toEqual([]);
    expect(res.processedRows).toHaveLength(1);

    // Archiv-Write pro processedRow (analog PayrollRunPage).
    const archivRepo = new AbrechnungArchivRepo();
    for (const r of res.processedRows) {
      await archivRepo.save(COMPANY_ID, KUEHN_ID, {
        arbeitnehmer: employeeToArbeitnehmer(r.employee),
        abrechnungsmonat: "2025-03",
        abrechnung: buildArchivAbrechnungFromRow(r, "2025-03"),
        batchId: res.batchId,
      });
    }

    // --- 2a) Journal-Seite: Entries mit batch_id === res.batchId ---
    // postPayrollAsJournal schreibt Lohn-Entries als status="entwurf"
    // (bewusst, per Phase-2 Schritt-4). Für den Builder-Test fes-
    // schreiben wir sie simulativ auf "gebucht", analog zum Admin-
    // Freigabe-Schritt in Produktion.
    store.setEntries(
      store.getEntries().map((e) =>
        e.batch_id === res.batchId ? { ...e, status: "gebucht" as const } : e
      )
    );
    const allEntries = store.getEntries();
    const batchEntries = allEntries.filter(
      (e) => e.batch_id === res.batchId
    );
    expect(batchEntries).toHaveLength(res.entriesCreated);
    for (const e of batchEntries) {
      expect(e.client_id).toBe(KUEHN_ID);
    }

    // --- 2b) Summe auf Personal-Aufwand-Konten (4110 + 4130) ---
    const LOHN_AUFWAND_KONTEN = new Set(["4110", "4130"]);
    let lohnSollSumme = 0;
    for (const e of batchEntries) {
      if (LOHN_AUFWAND_KONTEN.has(e.soll_konto)) {
        lohnSollSumme += Number(e.betrag);
      }
    }
    expect(lohnSollSumme).toBeGreaterThan(0);

    // --- 2c) buildAnlageG mit demselben Entry-Set + Konten ---
    // Filter: nur Entries dieses Mandanten (Phase-3-Pattern aus
    // AnlageGPage).
    const kuehnEntries: JournalEntry[] = allEntries.filter(
      (e) => e.client_id === KUEHN_ID
    );
    const report = buildAnlageG({
      accounts: store.getAccounts(),
      entries: kuehnEntries,
      wirtschaftsjahr: { von: "2025-01-01", bis: "2025-12-31" },
    });
    // RELATIONALER CHECK: summen.personal muss exakt mit lohnSollSumme
    // übereinstimmen — beide Pipelines lesen dieselben Entries.
    expect(report.summen.personal).toBeDefined();
    expect(report.summen.personal).toBe(lohnSollSumme);

    // --- 2d) Archiv-Row: genau 1 Row für diesen Employee + Batch ---
    const archiv = store.getLohnArchiv();
    const forEmployee = archiv.filter(
      (r) => r.employee_id === gfEmployee().id && r.client_id === KUEHN_ID
    );
    expect(forEmployee).toHaveLength(1);
    expect(forEmployee[0].batch_id).toBe(res.batchId);

    // --- 2e) importAnlageNAusArchiv liefert Brutto konsistent ---
    const vorschlagRes = await importAnlageNAusArchiv({
      employeeId: gfEmployee().id,
      jahr: 2025,
      clientId: KUEHN_ID,
      companyId: COMPANY_ID,
    });
    expect(vorschlagRes.kind).toBe("ok");
    if (vorschlagRes.kind !== "ok") return;
    // RELATIONALER CHECK: vorschlag.bruttoLohn == archiv-row.gesamt_brutto
    expect(vorschlagRes.vorschlag.bruttoLohn).toBe(
      forEmployee[0].gesamt_brutto
    );
    // UND: abrechnungen_gefunden == Anzahl der Archiv-Rows für diesen
    // (employee, jahr).
    expect(vorschlagRes.vorschlag.abrechnungen_gefunden).toBe(
      forEmployee.length
    );
  });

  it("nicht-verwandte Mandanten-Daten beeinflussen die Anlage G nicht", async () => {
    store.setEmployees([gfEmployee()]);
    seedAccounts();
    localStorage.setItem("harouda:activeCompanyId", COMPANY_ID);

    // Lohn-Lauf für Kühn …
    const res = await postPayrollAsJournal([gfRow()], validSettings(), {
      datum: "2025-03-31",
      periodLabel: "März 2025",
      clientId: KUEHN_ID,
    });
    // Festschreiben (Test-Simulation der Admin-Freigabe).
    store.setEntries(
      store.getEntries().map((e) =>
        e.batch_id === res.batchId ? { ...e, status: "gebucht" as const } : e
      )
    );

    // … und ein "fremder" Entry auf 4110 für einen anderen Mandanten.
    const foreignEntry: JournalEntry = {
      id: "e-foreign",
      datum: "2025-04-15",
      beleg_nr: "FREMD-1",
      beschreibung: "Fremder Personal-Aufwand",
      soll_konto: "4110",
      haben_konto: "1200",
      betrag: 9999,
      ust_satz: null,
      status: "gebucht",
      client_id: "client-fremd",
      skonto_pct: null,
      skonto_tage: null,
      gegenseite: null,
      faelligkeit: null,
      version: 1,
      batch_id: null,
    };
    store.setEntries([...store.getEntries(), foreignEntry]);

    // buildAnlageG nur für Kühn-Entries (Pattern aus AnlageGPage).
    const kuehnEntries = store
      .getEntries()
      .filter((e) => e.client_id === KUEHN_ID);
    const report = buildAnlageG({
      accounts: store.getAccounts(),
      entries: kuehnEntries,
      wirtschaftsjahr: { von: "2025-01-01", bis: "2025-12-31" },
    });
    // Der 9999 €-Fremd-Entry darf NICHT in summen.personal landen.
    const expectedPersonalSumme = store
      .getEntries()
      .filter(
        (e) =>
          e.client_id === KUEHN_ID &&
          e.batch_id === res.batchId &&
          (e.soll_konto === "4110" || e.soll_konto === "4130")
      )
      .reduce((sum, e) => sum + Number(e.betrag), 0);
    expect(report.summen.personal).toBe(expectedPersonalSumme);
    // Und 9999 darf explizit nicht enthalten sein.
    expect(report.summen.personal).not.toBe(expectedPersonalSumme + 9999);
  });
});
