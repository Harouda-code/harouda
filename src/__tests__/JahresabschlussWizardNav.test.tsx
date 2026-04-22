/** @jsxImportSource react */
// Mini-Sprint · Jahresabschluss-Wizard-Navigation sichtbar machen.
//
// Zwei Sichtbarkeits-Punkte:
//   1. AppShell-Sidebar, Gruppe "Berichte" → neuer NavLink
//      "Jahresabschluss-Wizard" auf `/jahresabschluss/wizard`.
//   2. ArbeitsplatzPage-Right-Column-Tree, Kategorie
//      "Rechnungswesen" → neuer Sub-Item mit testId
//      `arbeitsplatz-tree-rewe-jahresabschluss-wizard`.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import ArbeitsplatzPage from "../pages/ArbeitsplatzPage";
import { MandantProvider } from "../contexts/MandantContext";
import { UserProvider } from "../contexts/UserContext";
import { YearProvider } from "../contexts/YearContext";
import { PrivacyProvider } from "../contexts/PrivacyContext";
import type { Client } from "../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENTS_KEY = "harouda:clients";
const STORAGE_KEY = "harouda:selectedMandantId";
const TOUR_KEY = "harouda:tour.completed";
const NAV_EXPANDED_KEY = "harouda:nav-expanded";

const DEMO_CLIENTS: Client[] = [
  {
    id: "c-1",
    mandant_nr: "10100",
    name: "Demo GmbH",
    steuernummer: null,
    ust_id: null,
    iban: null,
    ust_id_status: "unchecked",
    ust_id_checked_at: null,
    last_daten_holen_at: null,
  },
];

function mount(path: string, children: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
    },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <UserProvider>
          <YearProvider>
            <PrivacyProvider>
              <MemoryRouter initialEntries={[path]}>
                <MandantProvider>{children}</MandantProvider>
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
      act(() => root.unmount());
      container.remove();
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(TOUR_KEY, "1");
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(DEMO_CLIENTS));
  localStorage.setItem(STORAGE_KEY, "c-1");
  // Berichte-Gruppe in der Sidebar expandiert lassen, damit die
  // NavLinks direkt im DOM sichtbar sind.
  localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify({ berichte: true }));
});
afterEach(() => {
  localStorage.clear();
});

describe("AppShell-Sidebar · Jahresabschluss-Wizard-Link", () => {
  it("#1 rendert NavLink 'Jahresabschluss-Wizard' in der Berichte-Gruppe", async () => {
    const { container, unmount } = mount(
      "/journal",
      <Routes>
        <Route
          element={
            <>
              <AppShell />
            </>
          }
        >
          <Route path="*" element={<Outlet />} />
        </Route>
      </Routes>
    );
    // Warte auf Mandant-Select als Proxy fuer "Sidebar gerendert".
    await act(async () => {
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    const links = Array.from(container.querySelectorAll("a[href]"));
    const wizardLink = links.find((a) =>
      a.textContent?.includes("Jahresabschluss-Wizard")
    ) as HTMLAnchorElement | undefined;
    expect(wizardLink).toBeDefined();
    expect(wizardLink!.getAttribute("href")).toBe("/jahresabschluss/wizard");
    unmount();
  });

  it("#2 Link ist separat vom alten 'Jahresabschluss'-Eintrag vorhanden", async () => {
    const { container, unmount } = mount(
      "/journal",
      <Routes>
        <Route
          element={
            <>
              <AppShell />
            </>
          }
        >
          <Route path="*" element={<Outlet />} />
        </Route>
      </Routes>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const links = Array.from(
      container.querySelectorAll("a[href]")
    ) as HTMLAnchorElement[];
    const alt = links.find((a) => a.getAttribute("href") === "/berichte/jahresabschluss");
    const wizard = links.find((a) => a.getAttribute("href") === "/jahresabschluss/wizard");
    expect(alt).toBeDefined();
    expect(wizard).toBeDefined();
    expect(alt).not.toBe(wizard);
    unmount();
  });
});

describe("ArbeitsplatzPage-Tree · Jahresabschluss-Wizard-Sub-Item", () => {
  it("#3 testId 'arbeitsplatz-tree-rewe-jahresabschluss-wizard' zeigt auf /jahresabschluss/wizard", async () => {
    const { container, unmount } = mount(
      "/arbeitsplatz?mandantId=c-1",
      <Routes>
        <Route path="/arbeitsplatz" element={<ArbeitsplatzPage />} />
        <Route path="*" element={<Outlet />} />
      </Routes>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    const el = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-tree-rewe-jahresabschluss-wizard"]'
    );
    expect(el).not.toBeNull();
    // Pfad-Zuordnung im Text bzw. href — ArbeitsplatzPage haengt
    // automatisch ?mandantId= an.
    const href = el!.getAttribute("href") ?? "";
    expect(href.startsWith("/jahresabschluss/wizard")).toBe(true);
    expect(href).toContain("mandantId=c-1");
    expect(el!.textContent).toContain("Jahresabschluss-Wizard");
    unmount();
  });
});
