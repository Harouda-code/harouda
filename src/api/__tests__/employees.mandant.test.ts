// Multi-Tenancy Phase 1 / Schritt 2a · employees.ts mit client_id-Filter.
//
// DEMO-Pfad-Tests (vitest-Env ist DEMO_MODE per Default). Supabase-Pfad
// ist strukturell identisch (dasselbe `.eq("client_id", clientId)`-Muster),
// wird aber hier nicht gemockt — das würde eine Supabase-Client-Mock-
// Infrastruktur einführen, die im Projekt bisher nicht vorhanden ist.

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createEmployee,
  fetchEmployees,
  type EmployeeInput,
} from "../employees";
import { store } from "../store";
import type { Employee } from "../../types/db";

function baseInput(personalnummer: string): EmployeeInput {
  return {
    personalnummer,
    vorname: "Test",
    nachname: "Mitarbeiter",
    steuer_id: null,
    sv_nummer: null,
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: null,
    einstellungsdatum: "2025-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 1.7,
    privat_versichert: false,
    pv_kinderlos: false,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
  };
}

describe("employees · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchEmployees(clientId='X') liefert nur Rows mit client_id === 'X' (DEMO)", async () => {
    // Mitarbeiter pro Mandant anlegen.
    await createEmployee(baseInput("P001"), "client-A");
    await createEmployee(baseInput("P002"), "client-B");
    await createEmployee(baseInput("P003"), "client-A");

    const onlyA = await fetchEmployees("client-A");
    expect(onlyA).toHaveLength(2);
    expect(onlyA.every((e) => e.client_id === "client-A")).toBe(true);

    const onlyB = await fetchEmployees("client-B");
    expect(onlyB).toHaveLength(1);
    expect(onlyB[0].personalnummer).toBe("P002");

    // clientId=null liefert alle (Kanzlei-Übersicht).
    const all = await fetchEmployees(null);
    expect(all).toHaveLength(3);
  });

  it("createEmployee(input, clientId='X') schreibt client_id='X' in die Row (DEMO)", async () => {
    const emp = await createEmployee(baseInput("P100"), "client-kuehn");
    expect(emp.client_id).toBe("client-kuehn");

    // Store-Verifikation: der localStorage-Row hat den client_id-Marker.
    const rows = store.getEmployees();
    expect(rows).toHaveLength(1);
    expect(rows[0].client_id).toBe("client-kuehn");
  });

  it("Legacy-Row (client_id undefined) wird unfiltriert mitgeliefert + Console-Warn (DEMO)", async () => {
    // Altbestand: schreibe Row ohne client_id direkt in den Store.
    const legacy: Employee = {
      id: "legacy-1",
      company_id: null,
      ...baseInput("LEGACY"),
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    // client_id explizit LÖSCHEN, damit undefined-Pfad triggert.
    delete (legacy as Partial<Employee>).client_id;
    store.setEmployees([legacy]);

    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const rows = await fetchEmployees("client-X");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("legacy-1");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("legacy-row without client_id")
    );
    warnSpy.mockRestore();
  });
});

