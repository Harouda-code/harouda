/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 3 · Wizard-Page-Mount-Smoke.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JahresabschlussWizardPage from "../JahresabschlussWizardPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import type { Client } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-wizard-smoke";

function seedClient() {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "90100",
      name: "Wizard-Test GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
      rechtsform: "GmbH",
    },
  ];
  localStorage.setItem("harouda:clients", JSON.stringify(clients));
  localStorage.setItem("harouda:selectedYear", "2025");
}

function renderPage() {
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
        <MemoryRouter
          initialEntries={[`/jahresabschluss/wizard?mandantId=${MANDANT_ID}`]}
        >
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <JahresabschlussWizardPage />
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

async function flush(times = 6) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  localStorage.clear();
  seedClient();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("JahresabschlussWizardPage · Mount-Smoke", () => {
  it("#1 rendert mit aktivem Mandant + Stepper + Step-1-Inhalt", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="wizard-stepper"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="step-validation"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#2 Stepper zeigt validation als current, andere als pending", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const val = document.querySelector(
      '[data-testid="wizard-step-validation"]'
    );
    expect(val?.getAttribute("data-step-status")).toBe("current");
    const rf = document.querySelector(
      '[data-testid="wizard-step-rechtsform"]'
    );
    expect(rf?.getAttribute("data-step-status")).toBe("pending");
    r.unmount();
  });
});
