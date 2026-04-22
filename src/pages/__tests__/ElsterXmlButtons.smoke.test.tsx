/** @jsxImportSource react */
// Sprint 14 / Schritt 4 · Smoke-Tests fuer die neuen ELSTER-XML-
// Buttons in LohnsteuerAnmeldungPage + ZmPage.
//
// Nur Mount-Smoke + Button-Presence + onClick-Handler-Verdrahtung.
// Der eigentliche XML-Build wird in den Builder-Tests abgedeckt.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LohnsteuerAnmeldungPage from "../LohnsteuerAnmeldungPage";
import ZmPage from "../ZmPage";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function flush(times = 8) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function wrapperClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
    },
  });
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("LohnsteuerAnmeldungPage · ELSTER-XML-Button", () => {
  it("#1 ELSTER-XML-Button mit data-testid=btn-lsta-elster-xml rendert", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    const qc = wrapperClient();
    act(() => {
      root.render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <SettingsProvider>
              <YearProvider>
                <LohnsteuerAnmeldungPage />
              </YearProvider>
            </SettingsProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    });
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector('[data-testid="btn-lsta-elster-xml"]');
    expect(btn).not.toBeNull();
    act(() => root.unmount());
  });

  it("#2 Klick ohne Steuernummer (prompt abgebrochen) erzeugt KEINEN Download", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    const qc = wrapperClient();
    // prompt gibt null zurueck (User hat Cancel gedrueckt).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).prompt = vi.fn(() => null);
    act(() => {
      root.render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <SettingsProvider>
              <YearProvider>
                <LohnsteuerAnmeldungPage />
              </YearProvider>
            </SettingsProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    });
    await act(async () => {
      await flush();
    });
    // a-Tag fuer Download beobachten (downloadText legt ein temporaeres a-Element an).
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-lsta-elster-xml"]'
    )!;
    const aBefore = document.querySelectorAll('a[download]').length;
    act(() => btn.click());
    const aAfter = document.querySelectorAll('a[download]').length;
    expect(aAfter).toBe(aBefore);
    act(() => root.unmount());
  });
});

describe("ZmPage · ELSTER-XML-Button", () => {
  it("#3 ELSTER-XML-Button mit data-testid=btn-zm-elster-xml rendert", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    const qc = wrapperClient();
    act(() => {
      root.render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <SettingsProvider>
              <YearProvider>
                <ZmPage />
              </YearProvider>
            </SettingsProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    });
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector('[data-testid="btn-zm-elster-xml"]');
    expect(btn).not.toBeNull();
    act(() => root.unmount());
  });
});
