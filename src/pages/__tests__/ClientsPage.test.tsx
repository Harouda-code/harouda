/** @jsxImportSource react */
//
// F42-Refactor Closeout · ClientsPage "Als aktiv wählen" schreibt URL-Query.
//
// Seit dem MandantContext-URL-Rewrite (Schritt 2) löst `setSelectedMandantId`
// im Hintergrund `setSearchParams({ replace: true })` aus. Dieser Test
// verifiziert, dass der "Als aktiv wählen"-Button in ClientsPage korrekt
// durch den neuen Pfad läuft — ohne dass ClientsPage selbst angepasst
// werden musste.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClientsPage from "../ClientsPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import type { Client } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENTS_KEY = "harouda:clients";
const STORAGE_KEY = "harouda:selectedMandantId";

const DEMO_CLIENTS: Client[] = [
  {
    id: "c-1",
    mandant_nr: "10100",
    name: "Kühn Musterfirma GmbH",
    steuernummer: "03/456/12345",
    ust_id: "DE123456789",
    iban: null,
    ust_id_status: "unchecked",
    ust_id_checked_at: null,
    last_daten_holen_at: null,
  },
  {
    id: "c-2",
    mandant_nr: "10200",
    name: "Bäcker Schulz KG",
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
  return <div data-testid="url-probe" data-search={loc.search} />;
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
        <SettingsProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <MandantProvider>
              <UrlProbe />
              <ClientsPage />
            </MandantProvider>
          </MemoryRouter>
        </SettingsProvider>
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

describe("ClientsPage · 'Als aktiv wählen' schreibt URL-Query (F42-Pfad)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(DEMO_CLIENTS));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("Klick auf 'Als aktiv wählen' setzt ?mandantId=<id> in der URL UND schreibt localStorage-Fallback", async () => {
    const { vi } = await import("vitest");
    const { container, unmount } = render("/mandanten");

    // Warte, bis die Client-Karten gerendert wurden.
    await vi.waitFor(
      () => {
        const buttons = container.querySelectorAll("button");
        const match = Array.from(buttons).find(
          (b) => b.textContent?.trim() === "Als aktiv wählen"
        );
        if (!match) throw new Error("'Als aktiv wählen'-Button noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    // Initial: URL leer.
    expect(getSearch(container)).toBe("");

    // Finde die Karte für c-2 (Bäcker Schulz) und klicke 'Als aktiv wählen'.
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>(".clients__card")
    );
    const schulzCard = cards.find((c) => c.textContent?.includes("10200"));
    expect(schulzCard, "Bäcker-Schulz-Karte (10200) nicht gefunden").toBeTruthy();

    const waehlenBtn = Array.from(
      schulzCard!.querySelectorAll<HTMLButtonElement>("button")
    ).find((b) => b.textContent?.trim() === "Als aktiv wählen");
    expect(waehlenBtn, "'Als aktiv wählen'-Button in der Karte fehlt").toBeTruthy();

    act(() => {
      waehlenBtn!.click();
    });

    // URL trägt jetzt mandantId=c-2.
    expect(getSearch(container)).toContain("mandantId=c-2");
    // localStorage-Fallback gesetzt (F42-Fallback-Kanal).
    expect(localStorage.getItem(STORAGE_KEY)).toBe("c-2");

    unmount();
  });

  it("aktiver Mandant aus ?mandantId=c-1 wird als 'is-active' gerendert", async () => {
    const { vi } = await import("vitest");
    const { container, unmount } = render("/mandanten?mandantId=c-1");

    await vi.waitFor(
      () => {
        const cards = container.querySelectorAll(".clients__card");
        if (cards.length < 2) throw new Error("Karten noch nicht vollständig gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>(".clients__card")
    );
    const kuehn = cards.find((c) => c.textContent?.includes("10100"));
    const schulz = cards.find((c) => c.textContent?.includes("10200"));

    expect(kuehn?.classList.contains("is-active")).toBe(true);
    expect(schulz?.classList.contains("is-active")).toBe(false);

    unmount();
  });
});
