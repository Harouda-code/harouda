/** @jsxImportSource react */
// Nacht-Modus (2026-04-21) · Schritt 1 — AnlageAVPage-Integration.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnlageAVPage from "../AnlageAVPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import { loadAvVertraege } from "../../domain/est/avVertraegeStore";
import type { Client } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-av-test";

function seedMandant() {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "30100",
      name: "Test-Person AV",
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
        <MemoryRouter initialEntries={[`/steuer/anlage-av?mandantId=${MANDANT_ID}`]}>
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <AnlageAVPage />
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

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  seedMandant();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("AnlageAVPage · Vertraege-Stammdaten-Integration", () => {
  it("#1 'Vertrag hinzufügen' persistiert Stammdaten in jahr-unabh. Key", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Empty-state sichtbar.
    expect(
      document.querySelector('[data-testid="av-stammdaten-empty"]')
    ).not.toBeNull();
    // Modal öffnen.
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="av-add-open"]')!
        .click()
    );
    await act(async () => {
      await flush();
    });
    // Felder befüllen.
    setInputValue(
      document.querySelector<HTMLInputElement>(
        '[data-testid="av-input-anbieter"]'
      )!,
      "Allianz LV"
    );
    setInputValue(
      document.querySelector<HTMLInputElement>(
        '[data-testid="av-input-nummer"]'
      )!,
      "ALV-12345"
    );
    await act(async () => {
      await flush();
    });
    // Submit.
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="av-add-submit"]')!
        .click()
    );
    await act(async () => {
      await flush();
    });
    // Liste sichtbar + Store-Persistenz.
    const list = document.querySelector('[data-testid="av-stammdaten-list"]');
    expect(list).not.toBeNull();
    const persisted = loadAvVertraege(MANDANT_ID);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].anbieter).toBe("Allianz LV");
    expect(persisted[0].vertragsnummer).toBe("ALV-12345");
    expect(persisted[0].vertragstyp).toBe("riester");
    // Key-Schema jahr-unabhängig.
    expect(
      localStorage.getItem(`harouda:av-vertraege:${MANDANT_ID}`)
    ).not.toBeNull();
    r.unmount();
  });

  it("#2 BMF-Form-State landet in V3-estStorage, getrennt vom Stammdaten-Key", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Toggle Zusammenveranlagung — führt zu zusammenveranlagung=true im
    // Form-State. Das löst den useEffect-Autosave aus.
    const zusammenCheckbox = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[type='checkbox']")
    ).find((cb) => {
      const label = cb.closest("label");
      return label?.textContent?.includes("Zusammenveranlagung");
    });
    expect(zusammenCheckbox).toBeDefined();
    act(() => zusammenCheckbox!.click());
    await act(async () => {
      await flush();
    });
    // V3-Key muss existieren und zusammenveranlagung=true zeigen.
    const v3Key = `harouda:est:${MANDANT_ID}:2025:anlage-av`;
    const raw = localStorage.getItem(v3Key);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!);
    expect(stored.zusammenveranlagung).toBe(true);
    // Stammdaten-Key existiert NICHT (kein Vertrag hinzugefügt).
    const stammdatenRaw = localStorage.getItem(
      `harouda:av-vertraege:${MANDANT_ID}`
    );
    expect(stammdatenRaw).toBeNull();
    r.unmount();
  });
});
