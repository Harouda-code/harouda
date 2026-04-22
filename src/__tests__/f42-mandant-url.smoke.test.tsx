/** @jsxImportSource react */
//
// F42-Refactor · End-to-End-Smoke-Test für den Kern-Use-Case.
//
// Was ist F42?
//   Vor Sprint 7.5 Fix-Runde: Wer auf dem Arbeitsplatz einen Mandanten
//   wählt, wechselt in die AppShell und sieht dort weiterhin den ALTEN
//   MandantContext-Wert, bis ein zweiter Reload das `localStorage` in
//   den State zieht. Bug-Ursache: State+localStorage-basierter Context
//   ohne URL-Bindung, Arbeitsplatz schrieb in die URL, AppShell las aus
//   State.
//
// Was ist der Fix (Sprint F42-Refactor Schritt 2)?
//   MandantContext ist jetzt URL-primary: `useMandant()` derived
//   `selectedMandantId` aus `?mandantId=`, Fallback localStorage.
//   Jede Ziel-Page, die `useMandant()` nutzt, sieht den korrekten
//   Wert sofort — ohne Reload.
//
// Dieser Smoke-Test zeigt den Flow end-to-end:
//   1. /arbeitsplatz mit 4 Musterfirma-Mandanten (autoSeed).
//   2. Kühn-Zeile klicken → URL=?mandantId=<kuehn>.
//   3. Launcher-Link „Kanzlei-Rechnungswesen" klicken → Navigation zu
//      `/buchfuehrung?mandantId=<kuehn>`.
//   4. Ziel-Page liest `useMandant().selectedMandantId` → sieht die
//      Kühn-ID sofort, ohne Reload. Das ist der F42-Fix-Nachweis.
//
// Ziel-Page: bewusst eine **Probe-Komponente** statt der echten
// `BuchfuehrungIndexPage`, weil diese kein `useMandant()`-Konsument ist
// (reines Card-Grid, siehe Schritt-1-Bestandsaufnahme Teil 2 C). Die
// Probe bildet den Hook-Kontrakt präzise ab — ein Test gegen eine
// echte 17-Konsumenten-Page würde nur dessen Render-Besonderheiten
// mitprüfen, nicht die F42-Fix-Logik.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RequireAuth } from "../components/RequireAuth";
import { UserProvider } from "../contexts/UserContext";
import {
  MandantProvider,
  useMandant,
} from "../contexts/MandantContext";
import ArbeitsplatzPage from "../pages/ArbeitsplatzPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function UrlProbe() {
  const location = useLocation();
  return (
    <div
      data-testid="url-probe"
      data-pathname={location.pathname}
      data-search={location.search}
    />
  );
}

// Probe-Komponente, die exakt den F42-Kontrakt prüft: `useMandant()`
// liefert innerhalb der Ziel-Route den aktuellen `selectedMandantId`.
function BuchfuehrungProbe() {
  const { selectedMandantId } = useMandant();
  return (
    <div data-testid="buchfuehrung-probe">
      <span data-testid="probe-mandant-id">
        {selectedMandantId ?? "(keine)"}
      </span>
    </div>
  );
}

function renderAppAt(path: string): {
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
          <MemoryRouter initialEntries={[path]}>
            <MandantProvider>
              <UrlProbe />
              <Routes>
                <Route
                  path="/arbeitsplatz"
                  element={
                    <RequireAuth>
                      <ArbeitsplatzPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/buchfuehrung"
                  element={
                    <RequireAuth>
                      <BuchfuehrungProbe />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/arbeitsplatz" replace />}
                />
              </Routes>
            </MandantProvider>
          </MemoryRouter>
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

describe("F42-Smoke · Arbeitsplatz → Launcher → Ziel-Page liest korrekten Mandanten", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it(
    "autoSeed → Kühn-Klick setzt URL → Launcher-Navigation → Probe liest selectedMandantId aus useMandant()",
    async () => {
      const { autoSeedDemoIfNeeded } = await import("../api/demoSeed");
      await autoSeedDemoIfNeeded();

      const { container, unmount } = renderAppAt("/arbeitsplatz");

      // 1. Arbeitsplatz ist geladen + 4 Mandantenzeilen.
      await vi.waitFor(
        () => {
          const rows = container.querySelectorAll(
            '[data-testid^="arbeitsplatz-mandant-row-"]'
          );
          if (rows.length !== 4) {
            throw new Error(
              `erwartet 4 Mandantenzeilen, gefunden ${rows.length}`
            );
          }
        },
        { timeout: 3000, interval: 15 }
      );

      // 2. Kühn-Zeile finden + klicken.
      const rows = Array.from(
        container.querySelectorAll<HTMLTableRowElement>(
          '[data-testid^="arbeitsplatz-mandant-row-"]'
        )
      );
      const kuehnRow = rows.find((r) => r.textContent?.includes("10100"));
      expect(kuehnRow).toBeTruthy();

      act(() => {
        kuehnRow!.click();
      });

      // URL trägt jetzt mandantId=<kuehnId>.
      const searchAfterClick = container
        .querySelector('[data-testid="url-probe"]')!
        .getAttribute("data-search")!;
      expect(searchAfterClick).toContain("mandantId=");
      const m = /mandantId=([^&]+)/.exec(searchAfterClick);
      const kuehnId = decodeURIComponent(m![1]);
      expect(kuehnId.length).toBeGreaterThan(0);

      // 3. Launcher-Link „Kanzlei-Rechnungswesen" finden + klicken.
      const reweLink = container.querySelector<HTMLAnchorElement>(
        '[data-testid="arbeitsplatz-launcher-rewe"]'
      );
      expect(reweLink).not.toBeNull();
      expect(reweLink!.getAttribute("href")).toBe(
        `/buchfuehrung?mandantId=${encodeURIComponent(kuehnId)}`
      );

      act(() => {
        reweLink!.click();
      });

      // 4. Navigation ausgeführt, Ziel-Page gemountet.
      await vi.waitFor(
        () => {
          const probe = container.querySelector(
            '[data-testid="buchfuehrung-probe"]'
          );
          if (!probe) {
            throw new Error("BuchfuehrungProbe noch nicht gemountet");
          }
        },
        { timeout: 2000, interval: 10 }
      );

      // Pfad = /buchfuehrung, Query = ?mandantId=<kuehnId>.
      const probeUrl = container
        .querySelector('[data-testid="url-probe"]')!
        .getAttribute("data-pathname");
      const probeSearch = container
        .querySelector('[data-testid="url-probe"]')!
        .getAttribute("data-search");
      expect(probeUrl).toBe("/buchfuehrung");
      expect(probeSearch).toContain(`mandantId=${encodeURIComponent(kuehnId)}`);

      // KRITISCHER F42-NACHWEIS: die Ziel-Page hat via useMandant() die
      // korrekte Kühn-ID erhalten, OHNE Reload. Vor dem Refactor wäre der
      // Wert hier leer oder stale (State+localStorage-Entkopplung).
      const probeId = container
        .querySelector('[data-testid="probe-mandant-id"]')!
        .textContent;
      expect(probeId).toBe(kuehnId);

      unmount();
    },
    15_000
  );
});
