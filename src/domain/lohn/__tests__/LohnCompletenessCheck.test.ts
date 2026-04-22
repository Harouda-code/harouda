// Jahresabschluss-E1 / Schritt 5 · LohnCompletenessCheck-Tests.

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { detectLohnLuecken } from "../LohnCompletenessCheck";
import { store } from "../../../api/store";
import type { Employee } from "../../../types/db";
import type { LohnabrechnungArchivRow } from "../types";

const CLIENT = "client-lohn-check";
const COMPANY = "company-demo";

function makeEmployee(
  id: string,
  einstellung: string | null,
  austritt: string | null = null
): Employee {
  return {
    id,
    company_id: COMPANY,
    client_id: CLIENT,
    personalnummer: id,
    vorname: "Test",
    nachname: id,
    steuer_id: null,
    sv_nummer: null,
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: null,
    einstellungsdatum: einstellung,
    austrittsdatum: austritt,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
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

function makeArchivRow(
  employeeId: string,
  monat: string
): LohnabrechnungArchivRow {
  return {
    id: `row-${employeeId}-${monat}`,
    company_id: COMPANY,
    client_id: CLIENT,
    employee_id: employeeId,
    abrechnungsmonat: monat,
    gesamt_brutto: 3000,
    gesamt_netto: 2000,
    gesamt_abzuege: 1000,
    gesamt_ag_kosten: 600,
    batch_id: null,
    locked: false,
    created_at: "2025-01-31T00:00:00Z",
  };
}

beforeEach(() => {
  localStorage.clear();
  // Fix current date to 2026-04-21 so the 2025-Check full year.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-21"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("detectLohnLuecken", () => {
  it("#1 2 Employees, 12 komplette Monate: keine Lücke", async () => {
    const emp1 = makeEmployee("E1", "2024-01-01");
    const emp2 = makeEmployee("E2", "2024-01-01");
    store.setEmployees([emp1, emp2]);
    const rows: LohnabrechnungArchivRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const monat = `2025-${String(m).padStart(2, "0")}`;
      rows.push(makeArchivRow("E1", monat));
      rows.push(makeArchivRow("E2", monat));
    }
    store.setLohnArchiv(rows);
    const luecken = await detectLohnLuecken(CLIENT, COMPANY, 2025);
    expect(luecken).toEqual([]);
  });

  it("#2 1 Employee fehlt in Monat 6: Lücke mit employee_id", async () => {
    const emp1 = makeEmployee("E1", "2024-01-01");
    const emp2 = makeEmployee("E2", "2024-01-01");
    store.setEmployees([emp1, emp2]);
    const rows: LohnabrechnungArchivRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const monat = `2025-${String(m).padStart(2, "0")}`;
      rows.push(makeArchivRow("E1", monat));
      if (m !== 6) rows.push(makeArchivRow("E2", monat));
    }
    store.setLohnArchiv(rows);
    const luecken = await detectLohnLuecken(CLIENT, COMPANY, 2025);
    expect(luecken).toHaveLength(1);
    expect(luecken[0].monat).toBe(6);
    expect(luecken[0].employees_mit_vertrag).toBe(2);
    expect(luecken[0].employees_mit_abrechnung).toBe(1);
    expect(luecken[0].fehlende_abrechnungen_fuer_employee_ids).toEqual(["E2"]);
  });

  it("#3 Employee eingetreten im April: Monate 1-3 NICHT als Lücke", async () => {
    const emp1 = makeEmployee("E1", "2025-04-15");
    store.setEmployees([emp1]);
    // Nur April-Dezember Abrechnungen.
    const rows: LohnabrechnungArchivRow[] = [];
    for (let m = 4; m <= 12; m++) {
      rows.push(makeArchivRow("E1", `2025-${String(m).padStart(2, "0")}`));
    }
    store.setLohnArchiv(rows);
    const luecken = await detectLohnLuecken(CLIENT, COMPANY, 2025);
    expect(luecken).toEqual([]);
  });

  it("#4 Employee ausgetreten im September: Monate 10-12 NICHT als Lücke", async () => {
    const emp1 = makeEmployee("E1", "2024-01-01", "2025-09-30");
    store.setEmployees([emp1]);
    const rows: LohnabrechnungArchivRow[] = [];
    for (let m = 1; m <= 9; m++) {
      rows.push(makeArchivRow("E1", `2025-${String(m).padStart(2, "0")}`));
    }
    store.setLohnArchiv(rows);
    const luecken = await detectLohnLuecken(CLIENT, COMPANY, 2025);
    expect(luecken).toEqual([]);
  });

  it("#5 Leeres Employee-Universum: keine Lücke", async () => {
    store.setEmployees([]);
    store.setLohnArchiv([]);
    const luecken = await detectLohnLuecken(CLIENT, COMPANY, 2025);
    expect(luecken).toEqual([]);
  });

  it("#6 Keine einzige Abrechnung: 12 Lücken", async () => {
    store.setEmployees([makeEmployee("E1", "2024-01-01")]);
    store.setLohnArchiv([]);
    const luecken = await detectLohnLuecken(CLIENT, COMPANY, 2025);
    expect(luecken).toHaveLength(12);
    expect(luecken.every((l) => l.fehlende_abrechnungen_fuer_employee_ids.includes("E1"))).toBe(true);
  });
});
