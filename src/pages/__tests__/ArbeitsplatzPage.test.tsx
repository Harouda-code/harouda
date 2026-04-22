/** @jsxImportSource react */
//
// Integrations- und Layout-Tests für die Arbeitsplatz-Route.
//
// Schritt 1: /arbeitsplatz fullscreen mounted, /dashboard → Redirect.
// Schritt 2: 3-Column-Grid-Shell mit eigenständig scrollenden Spalten.
// Schritt 3: linke Spalte mit Kanzlei-Nav (Einstellungen + Mitarbeiter).
// Schritt 4: mittlere Spalte mit Mandantentabelle, Suche, URL-Binding.
//
// DEMO_MODE ist im vitest-Env aktiv (CLAUDE.md §12.18), daher liefert
// UserProvider synchron eine Demo-Session → RequireAuth gibt Kinder frei.
// `fetchClients` läuft über `store` (localStorage); wir seed'en dort.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// React 19 flusht innerhalb `act()` nur, wenn diese Flagge gesetzt ist —
// die vorhandenen Tests (CookieConsent, ErrorBoundary) klicken nur native
// Events und bleiben daher unberührt. Sobald wir State-Updates + Effekte
// im Test triggern (Suche, URL-Binding, effect-gebundene console.warn),
// ist das Flag Pflicht, sonst werden Re-Renders/Effects nicht geflusht.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RequireAuth } from "../../components/RequireAuth";
import { UserProvider } from "../../contexts/UserContext";
import ArbeitsplatzPage from "../ArbeitsplatzPage";
import type { Client } from "../../types/db";

const CLIENTS_KEY = "harouda:clients";

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
  {
    id: "c-3",
    mandant_nr: "10300",
    name: "Dr. Meier Zahnarztpraxis",
    steuernummer: null,
    ust_id: null,
    iban: null,
    ust_id_status: "unchecked",
    ust_id_checked_at: null,
    last_daten_holen_at: null,
  },
];

// Schreibt die aktuelle Location in ein data-Attribut, damit Tests
// URL-Änderungen (Such-Query + ?mandantId=…) auslesen können.
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

type RenderResult = {
  container: HTMLDivElement;
  unmount: () => void;
};

function seedClients(clients: Client[]) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function renderAt(path: string): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const queryClient = makeQueryClient();
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <MemoryRouter initialEntries={[path]}>
            <UrlProbe />
            <Routes>
              <Route
                path="/login"
                element={<div data-testid="login">Login</div>}
              />
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

async function flush(iterations = 4) {
  // Mehrere Microtask-Turns: queryFn-Promise-Auflösung + tanstack-query-
  // Subscriber-Re-Render + useEffect-Runs + ggf. weitere Folge-Renders.
  for (let i = 0; i < iterations; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderAtWithClients(
  path: string,
  clients: Client[] = DEMO_CLIENTS
): Promise<RenderResult> {
  seedClients(clients);
  const res = renderAt(path);
  if (clients.length > 0) {
    // Warte, bis mindestens eine Zeile gerendert wurde — robust gegen
    // Microtask-Scheduling-Unterschiede in happy-dom/React 19.
    await vi.waitFor(
      () => {
        const anyRow = res.container.querySelector(
          '[data-testid^="arbeitsplatz-mandant-row-"]'
        );
        if (!anyRow) throw new Error("Mandantenzeilen noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );
  } else {
    await flush();
  }
  return res;
}

function getSearch(container: HTMLDivElement): string {
  return (
    container.querySelector('[data-testid="url-probe"]')?.getAttribute(
      "data-search"
    ) ?? ""
  );
}

// React 19 trackt `value` via native Setter. Direktes `input.value = ...`
// würde von React's Value-Tracker als no-op verworfen — darum den
// Prototype-Setter aufrufen, bevor wir das Input-Event dispatchen.
function typeInto(input: HTMLInputElement, value: string) {
  const proto = Object.getPrototypeOf(input);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!setter) throw new Error("kein value-Setter auf Input-Prototype");
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("Arbeitsplatz-Route (Schritt 1-7 + Right-Column-Tree)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // --- Schritt 1 / 2 / 3 (Regression) ------------------------------------

  it("/arbeitsplatz rendert das Grid-Gerüst für einen eingeloggten User", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    const root = container.querySelector('[data-testid="arbeitsplatz-root"]');
    expect(root).not.toBeNull();
    expect(container.querySelector('[data-testid="login"]')).toBeNull();
    unmount();
  });

  it("/dashboard redirected auf /arbeitsplatz (replace)", () => {
    const { container, unmount } = renderAt("/dashboard");
    expect(
      container.querySelector('[data-testid="arbeitsplatz-root"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="login"]')).toBeNull();
    unmount();
  });

  it("rendert alle drei Spalten und zeigt Überschriften in links/mitte", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");

    const left = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-left"]'
    );
    const center = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-center"]'
    );
    const right = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );

    expect(left).not.toBeNull();
    expect(center).not.toBeNull();
    expect(right).not.toBeNull();

    expect(left?.querySelector("h2")?.textContent).toBe("Kanzleiorganisation");
    expect(center?.querySelector("h2")?.textContent).toBe("Mandantenübersicht");
    // Rechte Spalte zeigt ohne ?mandantId= den Empty-State — keine h2 dort.
    expect(right?.querySelector("h2")).toBeNull();

    unmount();
  });

  it("jede Spalte ist eigenständig scrollbar (Layout-Klasse .arbeitsplatz__col)", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");

    const cols = container.querySelectorAll('[data-testid^="arbeitsplatz-col-"]');
    expect(cols.length).toBe(3);

    for (const col of Array.from(cols)) {
      expect(col.classList.contains("arbeitsplatz__col")).toBe(true);
    }

    const grid = container.querySelector(".arbeitsplatz__grid");
    expect(grid).not.toBeNull();

    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-col-left"].arbeitsplatz__col--left'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-col-center"].arbeitsplatz__col--center'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-col-right"].arbeitsplatz__col--right'
      )
    ).not.toBeNull();

    unmount();
  });

  it("linke Spalte enthält beide Kanzlei-Nav-Links mit korrekten Href-Zielen", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");

    const einstellungen = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-nav-einstellungen"]'
    );
    const mitarbeiter = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-nav-mitarbeiter"]'
    );

    expect(einstellungen).not.toBeNull();
    expect(mitarbeiter).not.toBeNull();

    expect(einstellungen?.getAttribute("href")).toBe("/einstellungen");
    expect(mitarbeiter?.getAttribute("href")).toBe("/einstellungen/benutzer");

    expect(einstellungen?.textContent).toContain("Kanzlei-Einstellungen");
    expect(mitarbeiter?.textContent).toContain("Mitarbeiterverwaltung");

    expect(einstellungen?.getAttribute("href")).not.toContain("mandantId");
    expect(mitarbeiter?.getAttribute("href")).not.toContain("mandantId");

    unmount();
  });

  it("Kanzlei-Nav-Links liegen in der linken Spalte und NICHT in center/right", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");

    const leftCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-left"]'
    );
    const centerCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-center"]'
    );
    const rightCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );

    expect(leftCol).not.toBeNull();
    expect(
      leftCol?.querySelector('[data-testid="arbeitsplatz-nav-einstellungen"]')
    ).not.toBeNull();
    expect(
      leftCol?.querySelector('[data-testid="arbeitsplatz-nav-mitarbeiter"]')
    ).not.toBeNull();

    expect(
      centerCol?.querySelector('[data-testid="arbeitsplatz-nav-einstellungen"]')
    ).toBeNull();
    expect(
      centerCol?.querySelector('[data-testid="arbeitsplatz-nav-mitarbeiter"]')
    ).toBeNull();
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-nav-einstellungen"]')
    ).toBeNull();
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-nav-mitarbeiter"]')
    ).toBeNull();

    unmount();
  });

  it("Seiten-Root .arbeitsplatz existiert und trägt den Overflow-Hidden-Wrapper", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    const root = container.querySelector(".arbeitsplatz");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-testid")).toBe("arbeitsplatz-root");
    unmount();
  });

  // --- Schritt 4 (neu) ---------------------------------------------------

  it("Plus-Icon-Button ist vorhanden, hat aria-label + Tooltip und ist klickbar", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-add-mandant"]'
    );
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-label")).toBe("Neuen Mandanten anlegen");
    expect(btn?.getAttribute("title")).toBe("Neuen Mandanten anlegen");
    // Rendert ein Lucide-Plus-Icon (SVG), kein Text.
    expect(btn?.querySelector("svg")).not.toBeNull();
    expect(btn?.textContent?.trim()).toBe("");
    unmount();
  });

  it("rendert Tabellenzeilen für alle geseedeten Mandanten", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");
    const table = container.querySelector(
      '[data-testid="arbeitsplatz-mandant-table"]'
    );
    expect(table).not.toBeNull();

    for (const c of DEMO_CLIENTS) {
      const row = container.querySelector(
        `[data-testid="arbeitsplatz-mandant-row-${c.id}"]`
      );
      expect(row).not.toBeNull();
      expect(row?.textContent).toContain(c.mandant_nr);
      expect(row?.textContent).toContain(c.name);
      // Rechtsform ist nicht im Datenmodell → „—" als Platzhalter.
      expect(row?.textContent).toContain("—");
    }

    unmount();
  });

  it("Such-Input filtert client-seitig nach Namen und Mandanten-Nr.", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    const input = container.querySelector<HTMLInputElement>(
      '[data-testid="arbeitsplatz-search-input"]'
    );
    expect(input).not.toBeNull();
    expect(input?.getAttribute("placeholder")).toBe(
      "Suche nach Name oder Mand.-Nr."
    );

    // Filter auf Namensfragment.
    act(() => {
      typeInto(input!, "Musterfirma");
    });
    expect(
      container.querySelector('[data-testid="arbeitsplatz-mandant-row-c-1"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="arbeitsplatz-mandant-row-c-2"]')
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="arbeitsplatz-mandant-row-c-3"]')
    ).toBeNull();

    // Filter auf Mandanten-Nr.-Fragment, case-insensitive.
    act(() => {
      typeInto(input!, "10200");
    });
    expect(
      container.querySelector('[data-testid="arbeitsplatz-mandant-row-c-2"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="arbeitsplatz-mandant-row-c-1"]')
    ).toBeNull();

    // Leere Ergebnis-Menge → Empty-State (Variante „passen zur Suche").
    act(() => {
      typeInto(input!, "XYZ_gibt_es_nicht");
    });
    expect(
      container.querySelector('[data-testid="arbeitsplatz-state-empty"]')
    ).not.toBeNull();

    unmount();
  });

  it("Klick auf eine Zeile setzt ?mandantId=<id> via useSearchParams (replace)", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    // Vor dem Klick: keine mandantId in der URL.
    expect(getSearch(container)).toBe("");

    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-2"]'
    );
    expect(row).not.toBeNull();

    act(() => {
      row!.click();
    });

    // URL-Query enthält jetzt mandantId=c-2.
    const search = getSearch(container);
    expect(search).toContain("mandantId=c-2");

    // Identischer Klick ist ein no-op (URL bleibt unverändert).
    const searchBefore = getSearch(container);
    act(() => {
      row!.click();
    });
    expect(getSearch(container)).toBe(searchBefore);

    unmount();
  });

  it("Aktive Zeile bekommt .arbeitsplatz__table-row--active, wenn URL mandantId trägt", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-3"
    );

    const activeRow = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-3"]'
    );
    const otherRow = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-1"]'
    );

    expect(activeRow).not.toBeNull();
    expect(activeRow?.classList.contains("arbeitsplatz__table-row--active")).toBe(
      true
    );
    expect(activeRow?.getAttribute("aria-selected")).toBe("true");

    expect(otherRow?.classList.contains("arbeitsplatz__table-row--active")).toBe(
      false
    );
    expect(otherRow?.getAttribute("aria-selected")).toBe("false");

    unmount();
  });

  // --- Schritt 5 (neu: Programme-Launcher in der rechten Spalte) --------

  it("Empty-State: ohne ?mandantId= rendert rechte Spalte den Auswahl-Hinweis", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");
    const rightCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );
    const empty = rightCol?.querySelector(
      '[data-testid="arbeitsplatz-launcher-empty"]'
    );
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toContain(
      "Bitte einen Mandanten aus der Liste auswählen"
    );
    // Kein Active-Launcher, keine Mandant-Card, keine Launcher-Group.
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-launcher-active"]')
    ).toBeNull();
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-mandant-card"]')
    ).toBeNull();
    unmount();
  });

  it("Empty-State: unbekannte mandantId in URL rendert ebenfalls den Empty-State", async () => {
    // console.warn stummschalten — der Component warnt bei ungültiger
    // mandantId (siehe separater Test weiter unten).
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=does-not-exist"
    );
    const rightCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-launcher-empty"]')
    ).not.toBeNull();
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-launcher-active"]')
    ).toBeNull();
    unmount();
  });

  it("Active-State: Mandant-Header-Card zeigt Nr. + Name des aktiven Mandanten", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-mandant-card"]'
    );
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain("10100");
    expect(card?.textContent).toContain("Kühn Musterfirma GmbH");
    // Launcher-Active-Container ist da, Empty-State nicht.
    expect(
      container.querySelector('[data-testid="arbeitsplatz-launcher-active"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="arbeitsplatz-launcher-empty"]')
    ).toBeNull();
    unmount();
  });

  it("Active-State: alle fünf Launcher-Links vorhanden, jeder trägt mandantId-Query", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Right-Column-Tree: die 5 Modul-Header-Haupt-Links. Einkommensteuer
    // zeigt jetzt auf den Mantelbogen `/steuer/est-1a`, nicht mehr auf
    // `/steuer/euer` — siehe TREE_MODULES in ArbeitsplatzPage.tsx.
    const expected: Array<[string, string]> = [
      ["arbeitsplatz-launcher-rewe", "/buchfuehrung"],
      ["arbeitsplatz-launcher-anlagen", "/anlagen/verzeichnis"],
      ["arbeitsplatz-launcher-einkommensteuer", "/steuer/est-1a"],
      ["arbeitsplatz-launcher-umsatzsteuer", "/steuer/ustva"],
      ["arbeitsplatz-launcher-lohn", "/lohn"],
    ];

    for (const [testId, pathname] of expected) {
      const link = container.querySelector<HTMLAnchorElement>(
        `[data-testid="${testId}"]`
      );
      expect(link, `Launcher-Link ${testId} fehlt`).not.toBeNull();
      const href = link!.getAttribute("href") ?? "";
      expect(href.startsWith(pathname)).toBe(true);
      expect(href).toContain("mandantId=c-1");
    }

    unmount();
  });

  it("Active-State: alle fünf Baum-Module werden gerendert (Modul-Header-Texte)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-2"
    );

    const expected: Array<[string, string]> = [
      ["arbeitsplatz-tree-module-rechnungswesen", "Kanzlei-Rechnungswesen"],
      ["arbeitsplatz-tree-module-anlagen", "Anlagenbuchführung"],
      ["arbeitsplatz-tree-module-einkommensteuer", "Einkommensteuer"],
      ["arbeitsplatz-tree-module-umsatzsteuer", "Umsatzsteuer"],
      ["arbeitsplatz-tree-module-lohn", "Lohn und Gehalt"],
    ];

    for (const [testId, title] of expected) {
      const mod = container.querySelector(`[data-testid="${testId}"]`);
      expect(mod, `Modul ${testId} fehlt im DOM`).not.toBeNull();
      expect(mod?.textContent).toContain(title);
    }

    unmount();
  });

  // --- Schritt 6 (neu: MandantAnlage-Modal via Plus-Button) --------------

  it("Schritt 6 · Plus-Klick öffnet das MandantAnlage-Modal (role=dialog sichtbar)", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");

    // Vor dem Klick kein Dialog.
    expect(
      document.body.querySelector('[role="dialog"][aria-modal="true"]')
    ).toBeNull();

    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-add-mandant"]'
    );
    act(() => {
      btn!.click();
    });

    // Dialog ist jetzt im Body (Modal rendert inline, ohne Portal).
    const dialog = document.body.querySelector(
      '[role="dialog"][aria-modal="true"]'
    );
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain("Neuen Mandanten anlegen");
    expect(
      document.body.querySelector('[data-testid="mandant-anlage-form"]')
    ).not.toBeNull();
    unmount();
  });

  it("Schritt 6 · Esc schließt das Modal, ohne createClient aufzurufen", async () => {
    const clientsModule = await import("../../api/clients");
    const createSpy = vi.spyOn(clientsModule, "createClient");

    const { container, unmount } = renderAt("/arbeitsplatz");
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-add-mandant"]'
    );
    act(() => {
      btn!.click();
    });
    expect(
      document.body.querySelector('[role="dialog"]')
    ).not.toBeNull();

    // Esc via window-keydown (Modal hört global).
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(createSpy).not.toHaveBeenCalled();

    unmount();
  });

  it("Schritt 6 · erfolgreiche Anlage setzt ?mandantId=<neueId> und schließt das Modal", async () => {
    // Start mit leerem Store → keine Mandanten vorab.
    seedClients([]);
    const { container, unmount } = renderAt("/arbeitsplatz");
    // Ersten Micro-Task durchlaufen, damit initial-query resolved.
    await flush();

    // Modal öffnen.
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-add-mandant"]'
    );
    act(() => {
      btn!.click();
    });

    const nrField = document.body.querySelector<HTMLInputElement>(
      '[data-testid="mandant-anlage-field-mandant-nr"]'
    );
    const nameField = document.body.querySelector<HTMLInputElement>(
      '[data-testid="mandant-anlage-field-name"]'
    );
    expect(nrField).not.toBeNull();
    expect(nameField).not.toBeNull();

    act(() => {
      typeInto(nrField!, "99999");
      typeInto(nameField!, "Neuer Test-Mandant GmbH");
    });

    // Submit via Form (Submit-Button liegt im Footer via form="…"-Attribut).
    const submitBtn = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="mandant-anlage-submit"]'
    );
    expect(submitBtn).not.toBeNull();
    act(() => {
      submitBtn!.click();
    });

    // Warten, bis Mutation durchgelaufen ist und URL aktualisiert wurde.
    await vi.waitFor(
      () => {
        const search = getSearch(container);
        if (!search.includes("mandantId=")) {
          throw new Error(`URL-Query noch ohne mandantId: "${search}"`);
        }
      },
      { timeout: 2000, interval: 10 }
    );

    // Modal muss geschlossen sein.
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    // Neue Zeile trägt die ID aus dem Query.
    const search = getSearch(container);
    const match = /mandantId=([^&]+)/.exec(search);
    expect(match).not.toBeNull();
    const newId = decodeURIComponent(match![1]);

    // Der neue Mandant ist in der Liste (Tabelle refresht via Invalidation)
    // und die entsprechende Zeile ist aktiv markiert.
    await vi.waitFor(
      () => {
        const row = container.querySelector(
          `[data-testid="arbeitsplatz-mandant-row-${newId}"]`
        );
        if (!row) throw new Error("neue Zeile noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );
    const activeRow = container.querySelector(
      `[data-testid="arbeitsplatz-mandant-row-${newId}"]`
    );
    expect(
      activeRow?.classList.contains("arbeitsplatz__table-row--active")
    ).toBe(true);

    // Rechte Spalte zeigt jetzt den Launcher (neuer Mandant ist aktiv).
    expect(
      container.querySelector('[data-testid="arbeitsplatz-launcher-active"]')
    ).not.toBeNull();

    unmount();
  });

  it("Unbekannte mandantId in der URL wird still ignoriert (keine aktive Zeile, console.warn)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=does-not-exist"
    );

    // Keine Zeile ist aktiv.
    const activeRows = container.querySelectorAll(
      ".arbeitsplatz__table-row--active"
    );
    expect(activeRows.length).toBe(0);

    // Alle bekannten Zeilen rendern weiterhin.
    expect(
      container.querySelector('[data-testid="arbeitsplatz-mandant-row-c-1"]')
    ).not.toBeNull();

    // console.warn wurde aufgerufen.
    expect(warnSpy).toHaveBeenCalled();
    const warnMsg = warnSpy.mock.calls[0]?.[0] as string | undefined;
    expect(warnMsg).toContain("does-not-exist");

    unmount();
  });

  // --- Right-Column-Tree (Sub-Items, Collapse, Persistenz) --------------

  it("Tree · alle Sub-Items sind initial sichtbar (Default-Expanded-State)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Stichprobe aus jedem Modul — wenn diese da sind, ist der Default-
    // Expand-Pfad pro Modul aktiv.
    const sampleTestIds = [
      "arbeitsplatz-tree-rewe-journal",
      "arbeitsplatz-tree-anlagen-spiegel",
      "arbeitsplatz-tree-est-mantel",
      "arbeitsplatz-tree-ust-ustva",
      "arbeitsplatz-tree-lohn-mitarbeiter",
    ];
    for (const id of sampleTestIds) {
      expect(
        container.querySelector(`[data-testid="${id}"]`),
        `Sub-Item ${id} sollte initial sichtbar sein`
      ).not.toBeNull();
    }

    unmount();
  });

  it("Tree · Chevron-Klick klappt nur das eine Modul ein, andere bleiben offen", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const toggleRewe = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-tree-toggle-rechnungswesen"]'
    );
    expect(toggleRewe).not.toBeNull();
    expect(toggleRewe?.getAttribute("aria-expanded")).toBe("true");

    // Rechnungswesen-Sublist initial sichtbar.
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-tree-sublist-rechnungswesen"]'
      )
    ).not.toBeNull();

    // Klick auf Chevron → Rechnungswesen-Sublist verschwindet.
    act(() => {
      toggleRewe!.click();
    });

    expect(toggleRewe!.getAttribute("aria-expanded")).toBe("false");
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-tree-sublist-rechnungswesen"]'
      )
    ).toBeNull();
    // Und die Sub-Items selbst sind damit auch weg.
    expect(
      container.querySelector('[data-testid="arbeitsplatz-tree-rewe-journal"]')
    ).toBeNull();

    // Andere Module bleiben offen (Stichprobe: Umsatzsteuer).
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-tree-sublist-umsatzsteuer"]'
      )
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="arbeitsplatz-tree-ust-zm"]')
    ).not.toBeNull();

    unmount();
  });

  it("Tree · localStorage-Persistenz: Collapsed-Zustand überlebt Re-Mount", async () => {
    // Erste Mount-Runde: Einkommensteuer-Modul einklappen, unmounten.
    {
      const { container, unmount } = await renderAtWithClients(
        "/arbeitsplatz?mandantId=c-1"
      );
      const toggleEst = container.querySelector<HTMLButtonElement>(
        '[data-testid="arbeitsplatz-tree-toggle-einkommensteuer"]'
      );
      act(() => {
        toggleEst!.click();
      });
      expect(toggleEst!.getAttribute("aria-expanded")).toBe("false");
      unmount();
    }

    // localStorage-Payload enthält den eingeklappten Einkommensteuer-Status.
    const raw = localStorage.getItem("harouda:arbeitsplatz-tree-expanded");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!) as Record<string, boolean>;
    expect(stored.einkommensteuer).toBe(false);
    // Andere Module bleiben offen.
    expect(stored.rechnungswesen).toBe(true);
    expect(stored.lohn).toBe(true);

    // Zweite Mount-Runde: derselbe Collapsed-Zustand wird wiederhergestellt.
    // `seedClients` wäre sonst im `beforeEach` passiert — hier manuell.
    seedClients(DEMO_CLIENTS);
    {
      const { container, unmount } = renderAt("/arbeitsplatz?mandantId=c-1");
      await vi.waitFor(
        () => {
          const anyRow = container.querySelector(
            '[data-testid^="arbeitsplatz-mandant-row-"]'
          );
          if (!anyRow) throw new Error("Mandantenzeilen noch nicht gerendert");
        },
        { timeout: 2000, interval: 10 }
      );
      const toggleEst = container.querySelector<HTMLButtonElement>(
        '[data-testid="arbeitsplatz-tree-toggle-einkommensteuer"]'
      );
      expect(toggleEst!.getAttribute("aria-expanded")).toBe("false");
      // Sublist ist nach Re-Mount weiterhin weg.
      expect(
        container.querySelector(
          '[data-testid="arbeitsplatz-tree-sublist-einkommensteuer"]'
        )
      ).toBeNull();
      // Aber Rechnungswesen ist weiterhin offen.
      expect(
        container.querySelector(
          '[data-testid="arbeitsplatz-tree-sublist-rechnungswesen"]'
        )
      ).not.toBeNull();
      unmount();
    }
  });

  it("Tree · Sub-Link trägt ?mandantId=<id> im href (Stichprobe Journal)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const journalLink = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-tree-rewe-journal"]'
    );
    expect(journalLink).not.toBeNull();
    expect(journalLink!.getAttribute("href")).toBe(
      "/journal?mandantId=c-1"
    );

    // Zweite Stichprobe aus einem anderen Modul.
    const ustvaSub = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-tree-ust-ustva"]'
    );
    expect(ustvaSub!.getAttribute("href")).toBe(
      "/steuer/ustva?mandantId=c-1"
    );

    unmount();
  });

  it("Tree · FEHLT-Sub-Items (Steuerberechnung, DEÜV, Dauerfrist u. a.) sind NICHT im DOM", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Negative Assertions: keine dieser Sub-Label-Fragmente darf im Baum
    // erscheinen, weil die entsprechenden Pages laut Bestandsaufnahme
    // Schritt 1 den Status FEHLT haben.
    const forbidden = [
      "Steuerberechnung",
      "Bescheidprüfung",
      "Dauerfrist",
      "Umsatzsteuererklärung",
      "Verprobung",
      "Beitragsnachweise",
      "DEÜV",
      "Sofortmeldung",
      "Fehlzeiten",
      "eAU",
      "Buchungsbeleg",
    ];

    const tree = container.querySelector('[data-testid="arbeitsplatz-tree"]');
    expect(tree).not.toBeNull();
    const treeText = tree?.textContent ?? "";
    for (const fragment of forbidden) {
      expect(
        treeText.includes(fragment),
        `FEHLT-Label "${fragment}" darf nicht im Tree-DOM stehen`
      ).toBe(false);
    }

    unmount();
  });

  it("Tree-A11y · aria-expanded spiegelt den expanded-Zustand beim Togglen", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Stichprobe auf Umsatzsteuer (muss wie alle Module initial offen sein).
    const toggle = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-tree-toggle-umsatzsteuer"]'
    );
    expect(toggle).not.toBeNull();

    // Initial: aria-expanded === "true", sublist im DOM.
    expect(toggle!.getAttribute("aria-expanded")).toBe("true");
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-tree-sublist-umsatzsteuer"]'
      )
    ).not.toBeNull();

    // Nach Click: aria-expanded === "false", sublist weg.
    act(() => {
      toggle!.click();
    });
    expect(toggle!.getAttribute("aria-expanded")).toBe("false");
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-tree-sublist-umsatzsteuer"]'
      )
    ).toBeNull();

    // aria-controls verknüpft Chevron mit der Sublist-id.
    expect(toggle!.getAttribute("aria-controls")).toBe(
      "arbeitsplatz-tree-sublist-umsatzsteuer"
    );

    // Erneuter Click: Zustand kehrt zurück, aria-expanded wieder "true".
    act(() => {
      toggle!.click();
    });
    expect(toggle!.getAttribute("aria-expanded")).toBe("true");

    unmount();
  });

  it("Tree-A11y · Tab-Reihenfolge innerhalb eines Moduls: Haupt-Link → Chevron → Sub-Links", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const moduleNode = container.querySelector(
      '[data-testid="arbeitsplatz-tree-module-rechnungswesen"]'
    );
    expect(moduleNode).not.toBeNull();

    const focusables = Array.from(
      moduleNode!.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
    );

    function indexOf(testId: string) {
      return focusables.findIndex(
        (el) => el.getAttribute("data-testid") === testId
      );
    }

    const headerLink = indexOf("arbeitsplatz-launcher-rewe");
    const chevronBtn = indexOf("arbeitsplatz-tree-toggle-rechnungswesen");
    const firstSub = indexOf("arbeitsplatz-tree-rewe-journal");
    const lastSub = indexOf("arbeitsplatz-tree-rewe-jahresabschluss");

    expect(headerLink).toBeGreaterThanOrEqual(0);
    expect(chevronBtn).toBeGreaterThan(headerLink);
    expect(firstSub).toBeGreaterThan(chevronBtn);
    expect(lastSub).toBeGreaterThan(firstSub);

    unmount();
  });

  it("Tree · Empty-State rendert keinen Tree (kein ?mandantId=)", async () => {
    // Regression: wenn wir im Empty-State landen (kein aktiver Mandant),
    // darf `.arbeitsplatz__tree` nicht gemountet sein.
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");
    expect(
      container.querySelector('[data-testid="arbeitsplatz-tree"]')
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="arbeitsplatz-tree-module-rechnungswesen"]')
    ).toBeNull();
    unmount();
  });

  // --- Schritt 7 (neu: Tab-Order / Lese-Reihenfolge) ---------------------

  it("Schritt 7 · Tab-Order folgt der Lese-Reihenfolge (links → mitte → rechts)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Alle fokussierbaren Elemente in DOM-Reihenfolge einsammeln. Die
    // Tab-Order im Browser folgt dieser Reihenfolge, solange kein
    // positives tabIndex explizit überschrieben wird.
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type="hidden"]), [tabindex]:not([tabindex="-1"])'
      )
    );

    function indexOfTestId(testId: string): number {
      return focusables.findIndex(
        (el) => el.getAttribute("data-testid") === testId
      );
    }

    const linksNav = indexOfTestId("arbeitsplatz-nav-einstellungen");
    const plus = indexOfTestId("arbeitsplatz-add-mandant");
    const search = indexOfTestId("arbeitsplatz-search-input");
    const activeRow = indexOfTestId("arbeitsplatz-mandant-row-c-1");
    const launcherFirst = indexOfTestId("arbeitsplatz-launcher-rewe");

    // Jedes Ziel muss überhaupt in der Fokus-Liste sein.
    expect(linksNav).toBeGreaterThanOrEqual(0);
    expect(plus).toBeGreaterThanOrEqual(0);
    expect(search).toBeGreaterThanOrEqual(0);
    expect(activeRow).toBeGreaterThanOrEqual(0);
    expect(launcherFirst).toBeGreaterThanOrEqual(0);

    // Links-zuerst → danach mittlere Spalte (Plus → Suche → Zeilen) →
    // abschließend rechte Spalte (Launcher-Links).
    expect(plus).toBeGreaterThan(linksNav);
    expect(search).toBeGreaterThan(plus);
    expect(activeRow).toBeGreaterThan(search);
    expect(launcherFirst).toBeGreaterThan(activeRow);

    // Stichprobe: Tabellenzeile ist fokussierbar (tabIndex=0), Klick-Fokus
    // via el.focus() muss greifen (happy-dom unterstützt .focus()).
    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-1"]'
    );
    row!.focus();
    expect(document.activeElement).toBe(row);

    unmount();
  });
});
