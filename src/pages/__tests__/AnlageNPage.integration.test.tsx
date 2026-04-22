/** @jsxImportSource react */
// Phase 3 / Schritt 10 · AnlageNPage-Integration.
// Verifiziert: Import-Button rendert, Import füllt die vier Felder +
// Banner zeigt Zuletzt-Import, Save persistiert in V3-Key.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnlageNPage from "../AnlageNPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import { store } from "../../api/store";
import * as archivImport from "../../domain/est/archivEstImport";
import type { Client, Employee } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-kuehn";
const EMPLOYEE_ID = "emp-gf-001";

function seedMandantAndEmployee() {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "10100",
      name: "Kühn GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
    },
  ];
  const employees: Employee[] = [
    {
      id: EMPLOYEE_ID,
      company_id: "company-demo",
      client_id: MANDANT_ID,
      personalnummer: "P001",
      vorname: "Dr. Max",
      nachname: "Kühn",
      steuer_id: null,
      sv_nummer: null,
      steuerklasse: "III",
      kinderfreibetraege: 0,
      konfession: null,
      bundesland: null,
      einstellungsdatum: null,
      austrittsdatum: null,
      beschaeftigungsart: "vollzeit",
      wochenstunden: 40,
      bruttogehalt_monat: 8000,
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
    },
  ];
  store.setClients(clients);
  store.setEmployees(employees);
  localStorage.setItem("harouda:selectedYear", "2025");
}

type RenderResult = {
  container: HTMLDivElement;
  unmount: () => void;
};

function renderPage(): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/steuer/anlage-n?mandantId=${MANDANT_ID}`]}>
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <AnlageNPage />
              </MandantProvider>
            </YearProvider>
          </SettingsProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 8) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  localStorage.clear();
  seedMandantAndEmployee();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("AnlageNPage · Archiv-Import-Integration", () => {
  it("#1 Button öffnet Modal bei gesetztem selectedMandantId", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const openBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="archiv-import-open-btn"]'
    );
    expect(openBtn).not.toBeNull();
    act(() => openBtn!.click());
    await act(async () => {
      await flush();
    });
    // Modal mit Warning-Banner + Dropdown sollte sichtbar sein.
    expect(
      document.querySelector('[data-testid="archiv-import-warning"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="archiv-employee-select"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#2 Nach Import füllen Felder + Banner zeigt + Save persistiert in V3-Key", async () => {
    const vorschlag = {
      bruttoLohn: 96000,
      lohnsteuer: 15000,
      soliZuschlag: 825,
      kirchensteuer: 1350,
      sv_an_gesamt: 13500,
      netto: 65325,
      abrechnungen_gefunden: 12,
      jahr: 2025,
      employeeId: EMPLOYEE_ID,
    };
    vi.spyOn(archivImport, "importAnlageNAusArchiv").mockResolvedValue({
      kind: "ok",
      vorschlag,
    });

    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Modal öffnen.
    act(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="archiv-import-open-btn"]'
        )!
        .click()
    );
    await act(async () => {
      await flush();
    });
    // Mitarbeiter wählen.
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="archiv-employee-select"]'
    )!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value"
      )?.set;
      setter?.call(select, EMPLOYEE_ID);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    // Submit.
    act(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="archiv-import-submit"]'
        )!
        .click()
    );
    await act(async () => {
      await flush(10);
    });

    // Banner sichtbar.
    const banner = document.querySelector('[data-testid="archiv-import-banner"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toMatch(/12 Abrechnungen/);
    expect(banner?.textContent).toMatch(/2025/);
    expect(banner?.textContent).toMatch(new RegExp(EMPLOYEE_ID));

    // Die vier importierten Felder sind jetzt in den Input-values.
    const inputs = document.querySelectorAll<HTMLInputElement>(
      "input.bmf-form__amount-input"
    );
    const values = Array.from(inputs)
      .filter((i) => i.value !== "")
      .map((i) => Number(i.value));
    expect(values).toEqual(
      expect.arrayContaining([96000, 15000, 825, 1350])
    );

    // Save-Button klicken → writeEstForm → V3-Key bekommt die Werte.
    act(() => {
      const saveBtn = Array.from(
        document.querySelectorAll<HTMLButtonElement>("button")
      ).find((b) => b.textContent?.trim() === "Speichern");
      saveBtn!.click();
    });
    await act(async () => {
      await flush();
    });
    const v3Key = `harouda:est:${MANDANT_ID}:2025:anlage-n`;
    const stored = JSON.parse(localStorage.getItem(v3Key) ?? "{}");
    expect(stored.bruttoLohn).toBe(96000);
    expect(stored.lohnsteuer).toBe(15000);
    expect(stored.soliZuschlag).toBe(825);
    expect(stored.kirchensteuer).toBe(1350);
    r.unmount();
  });
});
