/** @jsxImportSource react */
//
// F42-Refactor Closeout · AppShell-Topbar-MandantSwitch-Integration.
//
// Der Topbar-Switch im AppShell ruft seit jeher `setSelectedMandantId`
// aus MandantContext auf (line 391). Nach dem URL-Rewrite schreibt
// dieser Call automatisch in die URL-Query. Dieser Test verifiziert
// den Integrations-Pfad end-to-end: Auswahl im Dropdown → ?mandantId=
// in der aktuellen Route, kein navigate, lokales localStorage-Fallback
// gesetzt.
//
// Die AppShell hat einen schweren Dependency-Graph (5 Contexts, 5
// parallele useQuery-Ketten in UniversalSearchModal, GuidedTour-Auto-
// Start). Wir zähmen das über:
//   - `harouda:tour.completed=1` vorab → GuidedTour bleibt zu
//   - eigener QueryClient mit retry:false
//   - vi.waitFor für das Erscheinen des Mandant-Selects

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppShell from "../AppShell";
import { MandantProvider } from "../../contexts/MandantContext";
import { UserProvider } from "../../contexts/UserContext";
import { YearProvider } from "../../contexts/YearContext";
import { PrivacyProvider } from "../../contexts/PrivacyContext";
import type { Client } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENTS_KEY = "harouda:clients";
const STORAGE_KEY = "harouda:selectedMandantId";
const TOUR_KEY = "harouda:tour.completed";

const DEMO_CLIENTS: Client[] = [
  {
    id: "c-kuehn",
    mandant_nr: "10100",
    name: "Kühn Musterfirma GmbH",
    steuernummer: null,
    ust_id: null,
    iban: null,
    ust_id_status: "unchecked",
    ust_id_checked_at: null,
    last_daten_holen_at: null,
  },
  {
    id: "c-schulz",
    mandant_nr: "10001",
    name: "Schulz Bauunternehmung GmbH",
    steuernummer: null,
    ust_id: null,
    iban: null,
    ust_id_status: "unchecked",
    ust_id_checked_at: null,
    last_daten_holen_at: null,
  },
];

function UrlProbe() {
  const loc = useLocation();
  return (
    <div
      data-testid="url-probe"
      data-pathname={loc.pathname}
      data-search={loc.search}
    />
  );
}

function InnerPlaceholder() {
  return <div data-testid="route-content">Inhalt</div>;
}

function render(initialPath: string): {
  container: HTMLDivElement;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <YearProvider>
            <PrivacyProvider>
              <MemoryRouter initialEntries={[initialPath]}>
                <MandantProvider>
                  <UrlProbe />
                  <Routes>
                    <Route
                      element={
                        <>
                          <AppShell />
                          {/* AppShell rendert <Outlet/> — wir hängen eine
                              Placeholder-Route an, damit die Shell ihren
                              Content-Container füllen kann. */}
                        </>
                      }
                    >
                      <Route path="/journal" element={<InnerPlaceholder />} />
                      <Route path="*" element={<Outlet />} />
                    </Route>
                  </Routes>
                </MandantProvider>
              </MemoryRouter>
            </PrivacyProvider>
          </YearProvider>
        </UserProvider>
      </QueryClientProvider>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function getSearch(container: HTMLDivElement): string {
  return (
    container
      .querySelector('[data-testid="url-probe"]')
      ?.getAttribute("data-search") ?? ""
  );
}

describe("AppShell · Topbar-MandantSwitch schreibt URL-Query (F42-Pfad)", () => {
  beforeEach(() => {
    localStorage.clear();
    // GuidedTour-Auto-Start verhindern (sonst popt im DEMO ein Overlay).
    localStorage.setItem(TOUR_KEY, "1");
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(DEMO_CLIENTS));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("Auswahl im Dropdown setzt ?mandantId= in der aktuellen Route (kein navigate)", async () => {
    const { container, unmount } = render("/journal");

    // Warte auf Mandant-Dropdown in der Topbar.
    const select = await vi.waitFor(
      () => {
        const el = container.querySelector<HTMLSelectElement>(
          'select[aria-label="Mandant wählen"]'
        );
        if (!el) throw new Error("MandantSwitch noch nicht gerendert");
        // Clients müssen geladen sein, sonst gibt's nur den leeren Default.
        if (el.options.length < 2) {
          throw new Error("Client-Optionen noch nicht befüllt");
        }
        return el;
      },
      { timeout: 3000, interval: 15 }
    );

    const pathnameBefore = container
      .querySelector('[data-testid="url-probe"]')
      ?.getAttribute("data-pathname");
    expect(pathnameBefore).toBe("/journal");
    expect(getSearch(container)).toBe("");

    // Kühn auswählen — React-19-Setter-Trick (native value-setter).
    const proto = Object.getPrototypeOf(select);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    act(() => {
      setter!.call(select, "c-kuehn");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // URL trägt mandantId=c-kuehn, Pfad bleibt /journal (kein navigate).
    expect(getSearch(container)).toContain("mandantId=c-kuehn");
    const pathnameAfter = container
      .querySelector('[data-testid="url-probe"]')
      ?.getAttribute("data-pathname");
    expect(pathnameAfter).toBe("/journal");

    // Fallback-localStorage wurde parallel geschrieben.
    expect(localStorage.getItem(STORAGE_KEY)).toBe("c-kuehn");

    unmount();
  });

  it("Auswahl 'Alle Mandanten' (Leer-Wert) räumt Query und localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "c-schulz");
    const { container, unmount } = render("/journal?mandantId=c-schulz");

    const select = await vi.waitFor(
      () => {
        const el = container.querySelector<HTMLSelectElement>(
          'select[aria-label="Mandant wählen"]'
        );
        if (!el) throw new Error("MandantSwitch noch nicht gerendert");
        if (el.options.length < 2) {
          throw new Error("Optionen noch nicht befüllt");
        }
        return el;
      },
      { timeout: 3000, interval: 15 }
    );

    expect(getSearch(container)).toContain("mandantId=c-schulz");

    const proto = Object.getPrototypeOf(select);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    act(() => {
      setter!.call(select, "");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(getSearch(container).includes("mandantId")).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    unmount();
  });
});
