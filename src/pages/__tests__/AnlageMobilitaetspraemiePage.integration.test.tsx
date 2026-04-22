/** @jsxImportSource react */
// Nacht-Modus (2026-04-21) · Schritt 3 — AnlageMobilitaetspraemiePage.
// Existierende Page (850 Zeilen), nur Smoke + Persistenz-Test.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnlageMobilitaetspraemiePage from "../AnlageMobilitaetspraemiePage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import type { Client } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-mobility";

function seedMandant() {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "50100",
      name: "Gering-Einkommen Person",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
    },
  ];
  localStorage.setItem("harouda:clients", JSON.stringify(clients));
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
        <MemoryRouter
          initialEntries={[`/steuer/anlage-mobi?mandantId=${MANDANT_ID}`]}
        >
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <AnlageMobilitaetspraemiePage />
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
  seedMandant();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("AnlageMobilitaetspraemiePage", () => {
  it("#1 rendert mit aktivem Mandant (MandantRequiredGuard laeuft nicht)", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Guard-Placeholder darf NICHT sichtbar sein.
    expect(
      document.querySelector('[data-testid="mandant-required-guard"]')
    ).toBeNull();
    // Seite hat einen Titel "Anlage Mobilit..."
    const h1 = document.querySelector("h1");
    expect(h1?.textContent ?? "").toMatch(/Mobilit[aä]t/i);
    r.unmount();
  });

  it("#2 Checkbox/Toggle-Interaktion persistiert in V3-estStorage", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Irgendeine User-Interaktion, die den Form-State ändert — z. B.
    // die erste Checkbox toggeln.
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      "input[type='checkbox']"
    );
    expect(checkboxes.length).toBeGreaterThan(0);
    // Finde eine initial un-checkd Checkbox (defensiv).
    const uncheckd = Array.from(checkboxes).find((cb) => !cb.checked);
    if (uncheckd) {
      act(() => uncheckd.click());
      await act(async () => {
        await flush();
      });
    }
    // V3-Key existiert + ist valides JSON.
    const v3Key = `harouda:est:${MANDANT_ID}:2025:anlage-mobility`;
    const raw = localStorage.getItem(v3Key);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toBeTypeOf("object");
    r.unmount();
  });
});
