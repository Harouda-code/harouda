/** @jsxImportSource react */
// Nacht-Modus (2026-04-21) · Schritt 2 — AnlageVorsorgePage-Integration.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnlageVorsorgePage from "../AnlageVorsorgePage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import { store } from "../../api/store";
import * as archivImport from "../../domain/est/archivEstImport";
import type { Client, Employee } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-vorsorge";
const EMPLOYEE_ID = "emp-vorsorge-01";

function seedMandantAndEmployee() {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "40100",
      name: "Test GF GmbH",
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
      vorname: "GF",
      nachname: "Testperson",
      steuer_id: null,
      sv_nummer: null,
      steuerklasse: "I",
      kinderfreibetraege: 0,
      konfession: null,
      bundesland: null,
      einstellungsdatum: null,
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
    },
  ];
  store.setClients(clients);
  store.setEmployees(employees);
  localStorage.setItem("harouda:selectedYear", "2025");
}

type RenderResult = { container: HTMLDivElement; unmount: () => void };

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
        <MemoryRouter initialEntries={[`/steuer/anlage-vorsorge?mandantId=${MANDANT_ID}`]}>
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <AnlageVorsorgePage />
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

describe("AnlageVorsorgePage · Archiv-Import-Integration", () => {
  it("#1 Import-Button öffnet Modal mit variant=anlage-vorsorge", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const openBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="vorsorge-import-open-btn"]'
    );
    expect(openBtn).not.toBeNull();
    expect(openBtn?.textContent).toMatch(/SV-Beiträge/);
    act(() => openBtn!.click());
    await act(async () => {
      await flush();
    });
    // Modal-Header nennt "SV-Beiträge" (nicht "Lohndaten").
    const headers = Array.from(document.querySelectorAll("h2, h3"));
    const svHeader = headers.find((h) =>
      h.textContent?.includes("SV-Beiträge")
    );
    expect(svHeader).toBeDefined();
    expect(
      document.querySelector('[data-testid="archiv-employee-select"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#2 Import fuellt die 5 SV-Felder korrekt + Banner + V3-Persistenz", async () => {
    const vorschlag = {
      kv_an_basis: 4920,
      kv_an_zusatz: 510,
      pv_an: 1020,
      rv_an: 5580,
      av_an: 780,
      abrechnungen_gefunden: 12,
      jahr: 2025,
      employeeId: EMPLOYEE_ID,
    };
    vi.spyOn(archivImport, "importAnlageVorsorgeAusArchiv").mockResolvedValue({
      kind: "ok",
      vorschlag,
    });

    const r = renderPage();
    await act(async () => {
      await flush();
    });
    act(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="vorsorge-import-open-btn"]'
        )!
        .click()
    );
    await act(async () => {
      await flush();
    });
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

    const banner = document.querySelector(
      '[data-testid="vorsorge-import-banner"]'
    );
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toMatch(/12 Abrechnungen/);

    // Speichern → V3-Key bekommt die importierten Werte.
    act(() => {
      const saveBtn = Array.from(
        document.querySelectorAll<HTMLButtonElement>("button")
      ).find((b) => b.textContent?.trim() === "Entwurf speichern");
      saveBtn!.click();
    });
    await act(async () => {
      await flush();
    });
    const v3Key = `harouda:est:${MANDANT_ID}:2025:anlage-vorsorge`;
    const stored = JSON.parse(localStorage.getItem(v3Key) ?? "{}");
    // kv_an_basis (4920) + kv_an_zusatz (510) = 5430 → z11_kv_an
    expect(stored.z11_kv_an).toBe(5430);
    expect(stored.z13_pv_an).toBe(1020);
    expect(stored.z4_an_anteil).toBe(5580);
    expect(stored.z43_av_an).toBe(780);
    r.unmount();
  });
});
