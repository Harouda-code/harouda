/** @jsxImportSource react */
//
// Schritt 7 · End-to-End-Smoke für den kompletten Arbeitsplatz-Flow
// mit echtem Musterfirma-Auto-Seed.
//
// Dieser Test wandert bewusst als eigene `.smoke.test.tsx`-Datei —
// er fasst die Auto-Seed-Pipeline + alle 7 Arbeitsplatz-Sprint-
// Deliverables in EINEM Durchlauf zusammen. Unit-Granularität liegt
// in `ArbeitsplatzPage.test.tsx`.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
import { vi } from "vitest";
import { RequireAuth } from "../../components/RequireAuth";
import { UserProvider } from "../../contexts/UserContext";
import ArbeitsplatzPage from "../ArbeitsplatzPage";

// React 19 flusht State-Updates + Effects unter `act()` nur mit dieser
// Flagge — siehe Header-Kommentar in `ArbeitsplatzPage.test.tsx`.
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

function renderAt(path: string): {
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
                path="/dashboard"
                element={<Navigate to="/arbeitsplatz" replace />}
              />
            </Routes>
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

describe("Arbeitsplatz · Musterfirma-Smoke (End-to-End)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it(
    "autoSeed → /arbeitsplatz → 4 Mandanten → Kühn-Klick → URL + Launcher-Active + /buchfuehrung-Link",
    async () => {
      // autoSeedDemoIfNeeded legt Kühn + 3 Bestands-Mandanten an
      // (siehe src/api/__tests__/demoSeed.test.ts).
      const { autoSeedDemoIfNeeded } = await import("../../api/demoSeed");
      await autoSeedDemoIfNeeded();

      const { container, unmount } = renderAt("/arbeitsplatz");

      // --- Spalte Mitte: 4 Mandanten rendern ----------------------------
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

      // Alle 4 erwarteten Mandanten-Nummern müssen vorkommen.
      const tableText = container
        .querySelector('[data-testid="arbeitsplatz-mandant-table"]')!
        .textContent!;
      expect(tableText).toContain("10100"); // Kühn Musterfirma GmbH
      expect(tableText).toContain("10001"); // Schulz Bauunternehmung GmbH
      expect(tableText).toContain("10002"); // Meyer Consulting GbR
      expect(tableText).toContain("10003"); // Roth Metallverarbeitung GmbH
      expect(tableText).toContain("Kühn Musterfirma GmbH");

      // --- Kühn-Zeile finden und klicken --------------------------------
      const rows = Array.from(
        container.querySelectorAll<HTMLTableRowElement>(
          '[data-testid^="arbeitsplatz-mandant-row-"]'
        )
      );
      const kuehnRow = rows.find((r) => r.textContent?.includes("10100"));
      expect(kuehnRow, "Kühn-Zeile (Mandant-Nr. 10100) nicht gefunden").toBeTruthy();

      act(() => {
        kuehnRow!.click();
      });

      // --- URL trägt jetzt ?mandantId=<kuehnId> -------------------------
      const search =
        container
          .querySelector('[data-testid="url-probe"]')!
          .getAttribute("data-search") ?? "";
      expect(search).toContain("mandantId=");
      const m = /mandantId=([^&]+)/.exec(search);
      expect(m).not.toBeNull();
      const kuehnId = decodeURIComponent(m![1]);
      expect(kuehnId.length).toBeGreaterThan(0);

      // --- Rechte Spalte: Launcher-Active-State mit Kühn-Daten ----------
      const card = container.querySelector<HTMLElement>(
        '[data-testid="arbeitsplatz-mandant-card"]'
      );
      expect(card).not.toBeNull();
      expect(card?.textContent).toContain("10100");
      expect(card?.textContent).toContain("Kühn Musterfirma GmbH");

      expect(
        container.querySelector('[data-testid="arbeitsplatz-launcher-active"]')
      ).not.toBeNull();
      expect(
        container.querySelector('[data-testid="arbeitsplatz-launcher-empty"]')
      ).toBeNull();

      // --- Launcher-Link „Kanzlei-Rechnungswesen" hat den erwarteten
      //     href-Aufbau mit Kühns ID --------------------------------------
      const reweLink = container.querySelector<HTMLAnchorElement>(
        '[data-testid="arbeitsplatz-launcher-rewe"]'
      );
      expect(reweLink).not.toBeNull();
      const href = reweLink!.getAttribute("href") ?? "";
      // Tatsächlicher Zielpfad ist `/buchfuehrung` (siehe Schritt-5-
      // Route-Verifikation gegen App.tsx).
      expect(href).toBe(`/buchfuehrung?mandantId=${encodeURIComponent(kuehnId)}`);

      // --- Tree-Schritt-3-Erweiterungen ---------------------------------

      // Default-Expanded: Rechnungswesen-Modul ist offen (Chevron zeigt
      // aria-expanded=true, Sublist ist im DOM).
      const reweToggle = container.querySelector<HTMLButtonElement>(
        '[data-testid="arbeitsplatz-tree-toggle-rechnungswesen"]'
      );
      expect(reweToggle).not.toBeNull();
      expect(reweToggle!.getAttribute("aria-expanded")).toBe("true");
      expect(
        container.querySelector(
          '[data-testid="arbeitsplatz-tree-sublist-rechnungswesen"]'
        )
      ).not.toBeNull();

      // Sub-Link „Buchungsjournal" hat href=/journal?mandantId=<kuehnId>.
      const journalSub = container.querySelector<HTMLAnchorElement>(
        '[data-testid="arbeitsplatz-tree-rewe-journal"]'
      );
      expect(journalSub).not.toBeNull();
      expect(journalSub!.getAttribute("href")).toBe(
        `/journal?mandantId=${encodeURIComponent(kuehnId)}`
      );

      // Sub-Link aus einem anderen Modul: „Anlage N" aus Einkommensteuer.
      const anlageN = container.querySelector<HTMLAnchorElement>(
        '[data-testid="arbeitsplatz-tree-est-n"]'
      );
      expect(anlageN).not.toBeNull();
      expect(anlageN!.getAttribute("href")).toBe(
        `/steuer/anlage-n?mandantId=${encodeURIComponent(kuehnId)}`
      );

      // Negativ-Assertion: FEHLT-Labels dürfen nicht im Tree-DOM stehen.
      const tree = container.querySelector(
        '[data-testid="arbeitsplatz-tree"]'
      );
      const treeText = tree?.textContent ?? "";
      expect(treeText.includes("Steuerberechnung")).toBe(false);
      expect(treeText.includes("DEÜV")).toBe(false);

      unmount();
    },
    15_000
  );
});
