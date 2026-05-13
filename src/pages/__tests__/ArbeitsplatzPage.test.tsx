/** @jsxImportSource react */
//
// Integrations- und Layout-Tests für die Arbeitsplatz-Route.
//
// Schritt 1: /arbeitsplatz fullscreen mounted, /dashboard → Redirect.
// Schritt 2: 3-Column-Grid-Shell mit eigenständig scrollenden Spalten.
// Schritt 3: linke Spalte mit Kanzlei-Nav (Einstellungen + Mitarbeiter).
// Schritt 4: mittlere Spalte mit Mandantentabelle, Suche, URL-Binding.
//
// DEMO_MODE ist im vitest-Env aktiv (historisches Kontextdokument, Abschnitt 12.18), daher liefert
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
import { MandantProvider } from "../../contexts/MandantContext";
import ArbeitsplatzPage from "../ArbeitsplatzPage";
import type {
  Account,
  BankReconciliationMatch,
  BankReconMatchStatus,
  Client,
  JournalEntry,
} from "../../types/db";

const CLIENTS_KEY = "harouda:clients";
const SELECTED_MANDANT_KEY = "harouda:selectedMandantId";
const ACCOUNTS_KEY = "harouda:accounts";
const ENTRIES_KEY = "harouda:entries";
const BANK_RECON_KEY = "harouda:bankReconMatches";

// --- OPOS-Fixtures (für Liquiditäts-Radar-Tests) -------------------------

const OPOS_ACCOUNTS: Account[] = [
  {
    id: "a-1400",
    konto_nr: "1400",
    bezeichnung: "Forderungen aus L+L",
    kategorie: "aktiva",
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  },
  {
    id: "a-1600",
    konto_nr: "1600",
    bezeichnung: "Verbindlichkeiten aus L+L",
    kategorie: "passiva",
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  },
  {
    id: "a-8400",
    konto_nr: "8400",
    bezeichnung: "Erlöse",
    kategorie: "ertrag",
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  },
  {
    id: "a-3400",
    konto_nr: "3400",
    bezeichnung: "Wareneingang",
    kategorie: "aufwand",
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  },
];

function seedAccounts(accounts: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function seedEntries(entries: JournalEntry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

let oposIdCounter = 0;
function makeOposEntry(opts: {
  datum: string;
  soll: string;
  haben: string;
  betrag: number;
  beleg: string;
  client_id: string;
  faelligkeit?: string | null;
}): JournalEntry {
  oposIdCounter++;
  return {
    id: `oj-${oposIdCounter}`,
    datum: opts.datum,
    beleg_nr: opts.beleg,
    beschreibung: "Test",
    soll_konto: opts.soll,
    haben_konto: opts.haben,
    betrag: opts.betrag,
    ust_satz: null,
    status: "gebucht",
    client_id: opts.client_id,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: opts.faelligkeit ?? null,
    version: 1,
  };
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// --- Bank-Reconciliation-Fixtures (für Erfassungsstatus-Tests) ----------

function seedBankReconMatches(matches: BankReconciliationMatch[]) {
  localStorage.setItem(BANK_RECON_KEY, JSON.stringify(matches));
}

let bankReconIdCounter = 0;
function makeBankReconMatch(opts: {
  client_id: string;
  match_status: BankReconMatchStatus;
}): BankReconciliationMatch {
  bankReconIdCounter++;
  const now = new Date().toISOString();
  return {
    id: `brm-${bankReconIdCounter}`,
    company_id: null,
    client_id: opts.client_id,
    bank_transaction_id: `tx-${bankReconIdCounter}`,
    bank_transaction_fingerprint: `fp-${bankReconIdCounter}`,
    journal_entry_id: null,
    match_status: opts.match_status,
    match_confidence: null,
    matched_at: now,
    matched_by_user_id: null,
    notiz: null,
    created_at: now,
    updated_at: now,
  };
}

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
            <MandantProvider>
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

  it("/arbeitsplatz rendert das Grid-Gerüst für einen eingeloggten User", async () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    // Mein-Tag-Block (Patch 3 des Left-Column-Refactors) nutzt
    // useSearchParams → erzwingt einen asynchronen Re-Render-Schub
    // nach dem initialen sync-commit. Ohne flush() wird das Root
    // u.U. noch nicht im DOM sein, wenn die Assertion läuft.
    await flush();
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

    // UX v0: linke Spalte rahmt nun „Kanzlei-Tagessteuerung" mit zwei
    // Gruppen darunter („Mein Arbeitstag" + „Kanzlei"). Wir prüfen
    // beide Gruppen-Header via stabile testIds statt fragiler
    // h2-Selektoren, damit HTML-Änderungen den Test nicht brechen.
    expect(
      left?.querySelector<HTMLElement>(
        '[data-testid="arbeitsplatz-section-meintag"]'
      )?.textContent
    ).toBe("Mein Arbeitstag");
    expect(
      left?.querySelector<HTMLElement>(
        '[data-testid="arbeitsplatz-section-kanzlei"]'
      )?.textContent
    ).toBe("Kanzlei");
    // Linke Spalte hat keinen <h2> mehr (section-headers sind <div>).
    expect(left?.querySelector("h2")).toBeNull();
    expect(center?.querySelector("h2")?.textContent).toBe("Mandantenportfolio");
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

  it("linke Spalte enthält Mein-Tag-Einträge mit korrekten Routen", async () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    await flush();

    const fristen = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-meintag-fristen"]'
    );
    const posteingang = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-meintag-posteingang"]'
    );
    // „Meine Aufgaben" ist aktuell ein nicht-klickbarer Platzhalter
    // (<span>, nicht <a>) — bis das Aufgaben-Modul existiert.
    const aufgaben = container.querySelector<HTMLSpanElement>(
      '[data-testid="arbeitsplatz-meintag-aufgaben"]'
    );

    expect(fristen).not.toBeNull();
    expect(posteingang).not.toBeNull();
    expect(aufgaben).not.toBeNull();

    // Ohne ?mandantId= gelten die Basis-Routen ohne Query.
    expect(fristen?.getAttribute("href")).toBe("/einstellungen/fristen");
    expect(posteingang?.getAttribute("href")).toBe("/belege");
    // Platzhalter hat weder href noch role=link.
    expect(aufgaben?.getAttribute("href")).toBeNull();
    expect(aufgaben?.getAttribute("aria-disabled")).toBe("true");

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
      // DEMO_CLIENTS setzen kein rechtsform-Feld; der Display-Helper
      // fällt für null/undefined auf „—" zurück.
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

  it("Klick auf eine Zeile setzt ?mandantId=<id> über useMandant (URL + localStorage, replace)", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    // Vor dem Klick: keine mandantId in der URL und keine im localStorage.
    expect(getSearch(container)).toBe("");
    expect(localStorage.getItem(SELECTED_MANDANT_KEY)).toBeNull();

    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-2"]'
    );
    expect(row).not.toBeNull();

    act(() => {
      row!.click();
    });

    // URL-Query enthält jetzt mandantId=c-2 (via MandantContext setSearchParams replace).
    const search = getSearch(container);
    expect(search).toContain("mandantId=c-2");

    // Und localStorage wurde von MandantContext mitgeschrieben.
    expect(localStorage.getItem(SELECTED_MANDANT_KEY)).toBe("c-2");

    // Identischer Klick ist ein no-op (URL bleibt unverändert).
    const searchBefore = getSearch(container);
    act(() => {
      row!.click();
    });
    expect(getSearch(container)).toBe(searchBefore);

    unmount();
  });

  // --- A11y-Hardening: native Row-Semantik + Tastatur-Auswahl -----------

  it("A11y · Mandantenzeile trägt kein role=\"button\" (native Row-Semantik bleibt erhalten)", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    const rows = container.querySelectorAll<HTMLTableRowElement>(
      '[data-testid^="arbeitsplatz-mandant-row-"]'
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of Array.from(rows)) {
      // role="button" würde die implizite <tr>-Row-Semantik überschreiben
      // und die Cell→Column-Header-Zuordnung für Screenreader verlieren.
      // Die Zeile bleibt trotzdem interaktiv: tabIndex=0, onClick, onKeyDown
      // und aria-selected werden separat schon abgedeckt.
      expect(row.getAttribute("role")).toBeNull();
      expect(row.getAttribute("tabindex")).toBe("0");
    }

    unmount();
  });

  it("A11y · Enter auf fokussierter Mandantenzeile setzt ?mandantId=<id> + localStorage", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    expect(getSearch(container)).toBe("");
    expect(localStorage.getItem(SELECTED_MANDANT_KEY)).toBeNull();

    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-2"]'
    );
    expect(row).not.toBeNull();

    act(() => {
      row!.focus();
      row!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
    });

    expect(getSearch(container)).toContain("mandantId=c-2");
    expect(localStorage.getItem(SELECTED_MANDANT_KEY)).toBe("c-2");

    unmount();
  });

  it("A11y · Space auf fokussierter Mandantenzeile setzt ?mandantId=<id> + localStorage", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    expect(getSearch(container)).toBe("");
    expect(localStorage.getItem(SELECTED_MANDANT_KEY)).toBeNull();

    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-3"]'
    );
    expect(row).not.toBeNull();

    act(() => {
      row!.focus();
      row!.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true })
      );
    });

    expect(getSearch(container)).toContain("mandantId=c-3");
    expect(localStorage.getItem(SELECTED_MANDANT_KEY)).toBe("c-3");

    unmount();
  });

  it("Ohne URL-mandantId, aber mit gültigem localStorage-Wert, ist der Mandant aktiv und der Launcher gerendert", async () => {
    // Fachlicher Nachweis der MandantContext-Integration: der Storage-
    // Fallback aus `MandantContext` (URL leer → harouda:selectedMandantId)
    // muss in der ArbeitsplatzPage genauso wirken wie in BaseShell.
    localStorage.setItem(SELECTED_MANDANT_KEY, "c-1");

    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");

    // URL trägt KEINE mandantId.
    expect(getSearch(container)).toBe("");

    // Aktive Zeile ist gerendert (über Storage-Fallback).
    const activeRow = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-1"]'
    );
    expect(activeRow).not.toBeNull();
    expect(
      activeRow?.classList.contains("arbeitsplatz__table-row--active")
    ).toBe(true);
    expect(activeRow?.getAttribute("aria-selected")).toBe("true");

    // Rechte Spalte zeigt den Launcher-Active-State (Mandant-Card).
    const rightCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-launcher-active"]')
    ).not.toBeNull();
    expect(
      rightCol?.querySelector('[data-testid="arbeitsplatz-mandant-card"]')
    ).not.toBeNull();

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

  it("Active-State: alle sechs Launcher-Links vorhanden, jeder trägt mandantId-Query", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Right-Column-Tree: die 6 Modul-Header-Haupt-Links. Einkommensteuer
    // zeigt jetzt auf den Mantelbogen `/einkommensteuer/est-1a`, nicht mehr auf
    // `/buchhaltung/euer` — siehe TREE_MODULES in ArbeitsplatzPage.tsx.
    const expected: Array<[string, string]> = [
      ["arbeitsplatz-launcher-rewe", "/buchhaltung/buchfuehrung"],
      ["arbeitsplatz-launcher-jahresabschluss-wizard", "/jahresabschluss/wizard"],
      ["arbeitsplatz-launcher-anlagen", "/buchhaltung/anlagen/verzeichnis"],
      ["arbeitsplatz-launcher-einkommensteuer", "/einkommensteuer/est-1a"],
      ["arbeitsplatz-launcher-umsatzsteuer", "/umsatzsteuer/ustva"],
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

  it("Active-State: alle sechs Baum-Module werden gerendert (Modul-Header-Texte)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-2"
    );

    const expected: Array<[string, string]> = [
      ["arbeitsplatz-tree-module-rechnungswesen", "Kanzlei-Rechnungswesen"],
      ["arbeitsplatz-tree-module-jahresabschluss-wizard", "Jahresabschluss-Wizard"],
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

  it("Schritt 6 · Plus-Klick löst keine Modal-Anzeige mehr aus (Navigation stattdessen)", () => {
    // Design-Änderung (Post d3cbe48): Mandant-Anlage ist eine eigene Route
    // /mandanten/neu → MandantAnlagePage. Der Plus-Button in Arbeitsplatz
    // navigiert jetzt dorthin, statt einen Dialog im Arbeitsplatz zu öffnen.
    // Die vollständige Navigation + Wizard-Flow wird in einem separaten
    // Test für MandantAnlagePage geprüft; hier stellen wir nur sicher,
    // dass die alte Modal-Logik NICHT mehr aktiv ist.
    const { container, unmount } = renderAt("/arbeitsplatz");

    expect(
      document.body.querySelector('[role="dialog"][aria-modal="true"]')
    ).toBeNull();

    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-add-mandant"]'
    );
    expect(btn).not.toBeNull();

    act(() => {
      btn!.click();
    });

    expect(
      document.body.querySelector('[role="dialog"][aria-modal="true"]')
    ).toBeNull();
    expect(
      document.body.querySelector('[data-testid="mandant-anlage-form"]')
    ).toBeNull();

    unmount();
  });

  it("Schritt 6 · Plus-Klick ruft createClient nicht direkt auf", async () => {
    // Post-Refactor (d3cbe48): Nach dem Plus-Klick erfolgt Navigation
    // auf /mandanten/neu, keine Modal-Öffnung. createClient wird
    // erst auf der Zielseite beim Submit aufgerufen, niemals aus
    // dem Arbeitsplatz heraus. Der alte Esc-Schließen-Test ist durch
    // die neue Route-Architektur obsolet und wurde in MandantAnlagePage.test.tsx
    // (separat) weitergepflegt.
    const clientsModule = await import("../../api/clients");
    const createSpy = vi.spyOn(clientsModule, "createClient");

    const { container, unmount } = renderAt("/arbeitsplatz");
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="arbeitsplatz-add-mandant"]'
    );
    expect(btn).not.toBeNull();

    act(() => {
      btn!.click();
    });

    expect(createSpy).not.toHaveBeenCalled();
    createSpy.mockRestore();
    unmount();
  });

  it.todo(
    "Schritt 6 · erfolgreiche Anlage setzt ?mandantId=<neueId> — " +
      "vollständiger Wizard-Flow muss in MandantAnlagePage.test.tsx " +
      "geprüft werden, da /mandanten/neu nach d3cbe48 eine eigene " +
      "Route ist und renderAt hier kein Target-Route-Element registriert."
  );

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
      "/buchhaltung/journal?mandantId=c-1"
    );

    // Zweite Stichprobe aus einem anderen Modul.
    const ustvaSub = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-tree-ust-ustva"]'
    );
    expect(ustvaSub!.getAttribute("href")).toBe(
      "/umsatzsteuer/ustva?mandantId=c-1"
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

  // --- UX v0: Linke Spalte, Center-Subline, Empty-State, Panel-Gruppen --

  it("UX v0 · linke Spalte trägt den Rahmen-Titel Kanzlei-Tagessteuerung", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    const title = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-frame-title-left"]'
    );
    expect(title).not.toBeNull();
    expect(title?.textContent).toContain("Kanzlei-Tagessteuerung");
    unmount();
  });

  it("UX v0 · mittlere Spalte zeigt Subline mit Mandanten-Aufforderung", () => {
    const { container, unmount } = renderAt("/arbeitsplatz");
    const subline = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-frame-subline-center"]'
    );
    expect(subline).not.toBeNull();
    expect(subline?.textContent).toContain("Mandant auswählen");
    expect(subline?.textContent).toContain("Mandantenkontext");
    unmount();
  });

  it("UX v0 · Empty-State zeigt professionellen Titel + Hinweis (keine fake Live-Daten)", async () => {
    const { container, unmount } = await renderAtWithClients("/arbeitsplatz");
    const empty = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-launcher-empty"]'
    );
    expect(empty).not.toBeNull();
    const emptyTitle = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-launcher-empty-title"]'
    );
    expect(emptyTitle).not.toBeNull();
    expect(emptyTitle?.textContent).toContain("Mandant wählen");
    const emptyHint = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-launcher-empty-hint"]'
    );
    expect(emptyHint).not.toBeNull();
    expect(emptyHint?.textContent).toContain("Schnellzugriff");
    expect(emptyHint?.textContent).toContain("Mandanten-Schnellinfo");
    expect(emptyHint?.textContent).toContain("geplante Erweiterungen");
    unmount();
  });

  it("UX v0 · rechte Spalte mit Mandant rendert drei Panel-Gruppen mit Titeln", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const schnellzugriff = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-panel-schnellzugriff"]'
    );
    const klienten = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-panel-klienten-schnellinfo"]'
    );
    const geplant = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-panel-geplant"]'
    );

    expect(schnellzugriff).not.toBeNull();
    expect(klienten).not.toBeNull();
    expect(geplant).not.toBeNull();

    expect(
      container.querySelector<HTMLElement>(
        '[data-testid="arbeitsplatz-panel-schnellzugriff-title"]'
      )?.textContent
    ).toBe("Schnellzugriff");
    expect(
      container.querySelector<HTMLElement>(
        '[data-testid="arbeitsplatz-panel-klienten-schnellinfo-title"]'
      )?.textContent
    ).toBe("Mandanten-Schnellinfo");
    expect(
      container.querySelector<HTMLElement>(
        '[data-testid="arbeitsplatz-panel-geplant-title"]'
      )?.textContent
    ).toBe("Geplante Erweiterungen");

    // Der bestehende Programme-Baum lebt innerhalb der Schnellzugriff-
    // Panel-Gruppe — Tree-Selector muss weiterhin auffindbar sein.
    expect(
      schnellzugriff?.querySelector('[data-testid="arbeitsplatz-tree"]')
    ).not.toBeNull();

    unmount();
  });

  it("A11y · rechte Spalte trägt eindeutiges Accessible-Name-Paar (Column ≠ Tree-Nav)", async () => {
    // Vor dem Hardening trug die rechte <section> dasselbe aria-label
    // („Programme und Akte") wie der verschachtelte <nav> im Programme-
    // Baum. Zwei nested Landmarks mit identischem Accessible Name machen
    // AT-Region-Navigation mehrdeutig und untertreiben den heutigen
    // Scope der Spalte (Mandant-Card, Schnellzugriff, Mandanten-
    // Schnellinfo, Geplante Erweiterungen). Der Patch trennt beide
    // Namen: Column → „Mandanten-Arbeitsbereich", Tree-Nav bleibt
    // „Programme und Akte".
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const rightCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );
    expect(rightCol).not.toBeNull();
    expect(rightCol?.tagName).toBe("SECTION");
    expect(rightCol?.getAttribute("aria-label")).toBe(
      "Mandanten-Arbeitsbereich"
    );

    const programmeNav = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-tree"]'
    );
    expect(programmeNav).not.toBeNull();
    expect(programmeNav?.tagName).toBe("NAV");
    expect(programmeNav?.getAttribute("aria-label")).toBe("Programme und Akte");

    // Programme-Nav liegt innerhalb der rechten Spalte (nested Landmark),
    // trägt aber explizit ein anderes Accessible Name.
    expect(rightCol?.contains(programmeNav!)).toBe(true);
    expect(rightCol?.getAttribute("aria-label")).not.toBe(
      programmeNav?.getAttribute("aria-label")
    );

    unmount();
  });

  it("UX v0 · Mandanten-Schnellinfo: alle drei Karten sind aktiv (kein aria-disabled, keine Placeholder-Label)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Liquiditäts-Radar (OPOS), Erfassungsstatus (Bank-Reconciliation)
    // und Abschluss-Tracker (Launcher) sind alle aktiv. Sie tragen kein
    // aria-disabled und kein Placeholder-Status-Label „Geplante
    // Auswertung". Abschluss-Tracker zeigt nur einen Launcher (CTA), keine
    // Live-Wizard-Statusdaten — siehe separate Pflicht-Tests weiter unten.
    for (const id of [
      "arbeitsplatz-info-card-liquiditaet",
      "arbeitsplatz-info-card-erfassung",
      "arbeitsplatz-info-card-abschluss",
    ]) {
      const card = container.querySelector<HTMLElement>(
        `[data-testid="${id}"]`
      );
      expect(card, `Karte ${id} fehlt`).not.toBeNull();
      expect(card?.getAttribute("aria-disabled")).toBeNull();
      expect(card?.textContent).not.toContain("Geplante Auswertung");
    }

    unmount();
  });

  it("UX v0 · Geplante Erweiterungen sind klar als In Vorbereitung markiert", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const cardIds = [
      "arbeitsplatz-info-card-akten-todos",
      "arbeitsplatz-info-card-steuer-deklaration",
      "arbeitsplatz-info-card-beleg-pruefstand",
    ];
    for (const id of cardIds) {
      const card = container.querySelector<HTMLElement>(
        `[data-testid="${id}"]`
      );
      expect(card, `Geplante-Erweiterung-Karte ${id} fehlt`).not.toBeNull();
      expect(card?.getAttribute("aria-disabled")).toBe("true");
      expect(card?.textContent).toContain("In Vorbereitung");
    }

    unmount();
  });

  it("UX v0 · rechte Spalte zeigt keine verbotenen Live-Claims (Anti-Pattern-Tokens)", async () => {
    // Anti-Pattern-Tokens werden base64-kodiert geführt, damit dieser
    // Test-Source selbst keine Plain-Text-Vorkommen der verbotenen
    // Wörter enthält (gleiches Muster wie scripts/__tests__/
    // check-forbidden-references.test.mjs).
    function decode(b64: string): string {
      return Buffer.from(b64, "base64").toString("utf8");
    }
    const FORBIDDEN_ENCODED = [
      "WmFobGxhc3Q=",
      "Z2VwcsO8ZnQ=",
      "dmVyYXJiZWl0ZXQ=",
      "ZnJlaWdlZ2ViZW4=",
      "YWJnZXNjaGxvc3Nlbg==",
      "RnJpc3Rlbi1BbXBlbA==",
      "Q291bnRkb3du",
      "RWNodHplaXQ=",
      "U2NvcmU=",
      "QW1wZWw=",
      "ZmVydGln",
      "YmVzdMOkdGlndA==",
      "dmVyaWZpemllcnQ=",
      "YWxsZXMgb2s=",
      "w7xiZXJtaXR0ZWx0",
    ];

    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    const rightCol = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-col-right"]'
    );
    expect(rightCol).not.toBeNull();
    const rightText = rightCol?.textContent ?? "";
    for (const enc of FORBIDDEN_ENCODED) {
      const phrase = decode(enc);
      expect(
        rightText.includes(phrase),
        `Verbotener Live-Claim darf nicht in der rechten Spalte stehen`
      ).toBe(false);
    }
    unmount();
  });

  // --- Liquiditäts-Radar (OPOS-Live-Karte) -------------------------------

  it("Liquiditäts-Radar · Empty-State: keine OPOS-Buchungen → Hinweis statt Zahlen", async () => {
    // Aktiver Mandant ist gewählt, aber keine OPOS-relevanten Buchungen
    // im Store. Karte zeigt den Empty-Hinweis, andere Karten bleiben
    // Placeholder.
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const empty = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet-empty"]'
        );
        if (!empty) throw new Error("Empty-State noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    expect(card?.getAttribute("aria-disabled")).toBeNull();
    expect(card?.textContent).toContain("Keine offenen Posten");
    // Erfassungsstatus ist seit Bank-Reconciliation-Anbindung ebenfalls
    // live (kein aria-disabled). Nur Abschluss-Tracker bleibt Placeholder.
    expect(
      container
        .querySelector('[data-testid="arbeitsplatz-info-card-erfassung"]')
        ?.getAttribute("aria-disabled")
    ).toBeNull();
    // Abschluss-Tracker ist nicht (mehr) disabled — er ist ein neutraler
    // Launcher zum Wizard, ohne Wizard-Statusdaten.
    expect(
      container
        .querySelector('[data-testid="arbeitsplatz-info-card-abschluss"]')
        ?.getAttribute("aria-disabled")
    ).toBeNull();

    unmount();
  });

  it("Liquiditäts-Radar · offene Forderung des aktiven Mandanten wird gezählt", async () => {
    seedAccounts(OPOS_ACCOUNTS);
    seedEntries([
      makeOposEntry({
        datum: daysAgoIso(10),
        soll: "1400",
        haben: "8400",
        betrag: 1190,
        beleg: "AR-101",
        client_id: "c-1",
      }),
    ]);
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const m = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet-metrics"]'
        );
        if (!m) throw new Error("Metrics-Block noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    const text = card?.textContent ?? "";
    expect(text).toContain("Offene Forderungen");
    // Anzahl 1 sowie Brutto-Summe 1.190 in deutschem Format.
    expect(text).toMatch(/Offene Forderungen[^0-9]*1\b/);
    expect(text).toMatch(/1[.,]190/);
    // „Für diesen Mandanten zuordenbar"-Footer als ehrliche Quelle.
    expect(text).toContain("Für diesen Mandanten zuordenbar");

    unmount();
  });

  it("Liquiditäts-Radar · überfällige Forderung wird separat gezählt", async () => {
    seedAccounts(OPOS_ACCOUNTS);
    // Fälligkeit liegt 30 Tage in der Vergangenheit → ueberfaellig_tage > 0.
    seedEntries([
      makeOposEntry({
        datum: daysAgoIso(60),
        soll: "1400",
        haben: "8400",
        betrag: 500,
        beleg: "AR-102",
        client_id: "c-1",
        faelligkeit: daysAgoIso(30),
      }),
    ]);
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const m = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet-metrics"]'
        );
        if (!m) throw new Error("Metrics-Block noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    const text = card?.textContent ?? "";
    expect(text).toContain("davon überfällig");
    // Zähler „1" steht direkt hinter dem Label (dt/dd-Paar im DOM); im
    // textContent folgt danach das nächste Label-Wort.
    expect(text).toMatch(/davon überfällig[^0-9]*1(?:[^0-9]|$)/);

    unmount();
  });

  it("Liquiditäts-Radar · Mandant-Scope: Posten anderer Mandanten erscheinen nicht", async () => {
    seedAccounts(OPOS_ACCOUNTS);
    seedEntries([
      makeOposEntry({
        datum: daysAgoIso(10),
        soll: "1400",
        haben: "8400",
        betrag: 100,
        beleg: "AR-A",
        client_id: "c-1",
      }),
      makeOposEntry({
        datum: daysAgoIso(10),
        soll: "1400",
        haben: "8400",
        betrag: 9999,
        beleg: "AR-B",
        client_id: "c-2",
      }),
    ]);
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const m = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet-metrics"]'
        );
        if (!m) throw new Error("Metrics-Block noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    const text = card?.textContent ?? "";
    // Nur 1 Forderung (Mandant A).
    expect(text).toMatch(/Offene Forderungen[^0-9]*1\b/);
    // Wert von Mandant B (9999) erscheint NICHT.
    expect(text).not.toContain("9.999");
    expect(text).not.toContain("9,999");

    unmount();
  });

  // --- Erfassungsstatus (Bank-Reconciliation-Live-Karte) -----------------

  it("Erfassungsstatus · Empty-State: keine Bank-Reconciliation-Matches → Hinweis", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const empty = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung-empty"]'
        );
        if (!empty) throw new Error("Empty-State noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );
    expect(card?.getAttribute("aria-disabled")).toBeNull();
    expect(card?.textContent).toContain("Noch keine Bankabstimmung");

    // Abschluss-Tracker bleibt Placeholder.
    // Abschluss-Tracker ist nicht (mehr) disabled — er ist ein neutraler
    // Launcher zum Wizard, ohne Wizard-Statusdaten.
    expect(
      container
        .querySelector('[data-testid="arbeitsplatz-info-card-abschluss"]')
        ?.getAttribute("aria-disabled")
    ).toBeNull();
    // Liquiditäts-Radar bleibt live.
    expect(
      container
        .querySelector('[data-testid="arbeitsplatz-info-card-liquiditaet"]')
        ?.getAttribute("aria-disabled")
    ).toBeNull();

    unmount();
  });

  it("Erfassungsstatus · ein pending_review-Match wird als Zur Prüfung gezählt", async () => {
    seedBankReconMatches([
      makeBankReconMatch({
        client_id: "c-1",
        match_status: "pending_review",
      }),
    ]);
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const m = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung-metrics"]'
        );
        if (!m) throw new Error("Metrics-Block noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );
    const text = card?.textContent ?? "";
    expect(text).toContain("Zur Prüfung");
    expect(text).toMatch(/Zur Prüfung[^0-9]*1(?:[^0-9]|$)/);
    // Footer als ehrliche Quelle.
    expect(text).toContain("Bankabstimmungs-Treffer für diesen Mandanten");

    unmount();
  });

  it("Erfassungsstatus · zeigt alle vier Status-Counts korrekt", async () => {
    seedBankReconMatches([
      makeBankReconMatch({ client_id: "c-1", match_status: "matched" }),
      makeBankReconMatch({ client_id: "c-1", match_status: "auto_matched" }),
      makeBankReconMatch({ client_id: "c-1", match_status: "pending_review" }),
      makeBankReconMatch({ client_id: "c-1", match_status: "ignored" }),
    ]);
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const m = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung-metrics"]'
        );
        if (!m) throw new Error("Metrics-Block noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );
    const text = card?.textContent ?? "";
    expect(text).toContain("Zur Prüfung");
    expect(text).toContain("Auto-Treffer");
    expect(text).toContain("Manuell zugeordnet");
    expect(text).toContain("Ignoriert");
    // Jeder Status hat genau einen Treffer.
    expect(text).toMatch(/Zur Prüfung[^0-9]*1(?:[^0-9]|$)/);
    expect(text).toMatch(/Auto-Treffer[^0-9]*1(?:[^0-9]|$)/);
    expect(text).toMatch(/Manuell zugeordnet[^0-9]*1(?:[^0-9]|$)/);
    expect(text).toMatch(/Ignoriert[^0-9]*1(?:[^0-9]|$)/);

    unmount();
  });

  it("Erfassungsstatus · Mandant-Scope: Treffer anderer Mandanten erscheinen nicht", async () => {
    seedBankReconMatches([
      // Mandant A: 1 pending_review.
      makeBankReconMatch({
        client_id: "c-1",
        match_status: "pending_review",
      }),
      // Mandant B: 5 auto_matched. Diese dürfen NICHT für A gezählt werden.
      makeBankReconMatch({ client_id: "c-2", match_status: "auto_matched" }),
      makeBankReconMatch({ client_id: "c-2", match_status: "auto_matched" }),
      makeBankReconMatch({ client_id: "c-2", match_status: "auto_matched" }),
      makeBankReconMatch({ client_id: "c-2", match_status: "auto_matched" }),
      makeBankReconMatch({ client_id: "c-2", match_status: "auto_matched" }),
    ]);
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const m = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung-metrics"]'
        );
        if (!m) throw new Error("Metrics-Block noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );
    const text = card?.textContent ?? "";
    // Mandant A: 1 zur Prüfung, 0 auto.
    expect(text).toMatch(/Zur Prüfung[^0-9]*1(?:[^0-9]|$)/);
    expect(text).toMatch(/Auto-Treffer[^0-9]*0(?:[^0-9]|$)/);
    // Mandant B's Wert „5" darf NICHT im Auto-Treffer-Feld erscheinen.
    expect(text).not.toMatch(/Auto-Treffer[^0-9]*5(?:[^0-9]|$)/);

    unmount();
  });

  // --- Abschluss-Tracker (Launcher zum Jahresabschluss-Wizard) -----------

  it("Abschluss-Tracker · Karte ist aktiv und bietet Launcher zum Wizard mit Mandant-Scope", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-abschluss"]'
    );
    expect(card).not.toBeNull();
    expect(card?.getAttribute("aria-disabled")).toBeNull();

    // Status-Label und Hint sind fachlich neutral.
    expect(card?.textContent).toContain("Pro Mandant und Jahr");
    expect(card?.textContent).toContain(
      "Wirtschaftsjahr wird im Wizard-Kontext übernommen"
    );

    // CTA-Link „Wizard öffnen" mit aktiver mandantId im Ziel.
    const cta = container.querySelector<HTMLAnchorElement>(
      '[data-testid="arbeitsplatz-info-card-abschluss-cta"]'
    );
    expect(cta).not.toBeNull();
    expect(cta?.textContent).toContain("Wizard öffnen");
    const href = cta?.getAttribute("href") ?? "";
    expect(href).toContain("/jahresabschluss/wizard");
    expect(href).toContain("mandantId=c-1");

    unmount();
  });

  it("Abschluss-Tracker · zeigt keine Wizard-Statusdaten (Negative-Assertions gegen Anti-Pattern-Tokens)", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-abschluss"]'
    );
    const text = card?.textContent ?? "";
    // Keine Schritt-Zählung, kein „von 7", kein „erledigt"-Counter.
    expect(text).not.toMatch(/Schritt\s*\d+/i);
    expect(text).not.toMatch(/\d+\s*von\s*7/i);
    expect(text).not.toMatch(/\d+\s*erledigt/i);
    // Keine completedSteps-/Wizard-State-Aussage.
    expect(text).not.toContain("currentStep");
    expect(text).not.toContain("completedSteps");
    // Keine Wizard-Step-Labels.
    expect(text).not.toContain("rechtsform");
    expect(text).not.toContain("groessenklasse");
    expect(text).not.toContain("bausteine");
    expect(text).not.toContain("bescheinigung");

    unmount();
  });

  it("Abschluss-Tracker · Liquiditäts-Radar und Erfassungsstatus bleiben unverändert live; geplante Erweiterungen bleiben Placeholder", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Liquiditäts-Radar live (nicht disabled).
    expect(
      container
        .querySelector('[data-testid="arbeitsplatz-info-card-liquiditaet"]')
        ?.getAttribute("aria-disabled")
    ).toBeNull();
    // Erfassungsstatus live (nicht disabled).
    expect(
      container
        .querySelector('[data-testid="arbeitsplatz-info-card-erfassung"]')
        ?.getAttribute("aria-disabled")
    ).toBeNull();
    // Geplante Erweiterungen bleiben Placeholder.
    for (const id of [
      "arbeitsplatz-info-card-akten-todos",
      "arbeitsplatz-info-card-steuer-deklaration",
      "arbeitsplatz-info-card-beleg-pruefstand",
    ]) {
      const card = container.querySelector<HTMLElement>(
        `[data-testid="${id}"]`
      );
      expect(card, `Placeholder-Karte ${id} fehlt`).not.toBeNull();
      expect(card?.getAttribute("aria-disabled")).toBe("true");
      expect(card?.textContent).toContain("In Vorbereitung");
    }

    unmount();
  });

  // --- A11y-Hardening Live-Karten: aria-busy + aria-live + Error-State ---

  it("A11y · Liquiditäts-Radar trägt aria-live=\"polite\" und aria-busy=\"false\" im geladenen Zustand", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const empty = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet-empty"]'
        );
        if (!empty) throw new Error("Empty-State noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    expect(card).not.toBeNull();
    expect(card?.getAttribute("aria-live")).toBe("polite");
    // Daten sind aufgelöst → aria-busy="false". (`aria-busy="true"` wird
    // im Loading-Pfad gesetzt; der Loading-Pfad ist separat über den
    // Error-Test und die statische `aria-busy`-Bindung im JSX abgesichert.)
    expect(card?.getAttribute("aria-busy")).toBe("false");

    unmount();
  });

  it("A11y · Erfassungsstatus trägt aria-live=\"polite\" und aria-busy=\"false\" im geladenen Zustand", async () => {
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const empty = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung-empty"]'
        );
        if (!empty) throw new Error("Empty-State noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );
    expect(card).not.toBeNull();
    expect(card?.getAttribute("aria-live")).toBe("polite");
    expect(card?.getAttribute("aria-busy")).toBe("false");

    unmount();
  });

  it("A11y · Liquiditäts-Radar Error-State: role=\"alert\" + Hint + aria-busy=\"false\"", async () => {
    // Query-Error mocken: `fetchAllEntries` wirft → entriesQ.isError=true
    // → liquiditaetIsError=true → Error-Pfad mit role="alert" rendert.
    const dashboardModule = await import("../../api/dashboard");
    vi.spyOn(dashboardModule, "fetchAllEntries").mockRejectedValue(
      new Error("Simulierter Fetch-Fehler für Liquiditäts-Radar")
    );

    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const err = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet-error"]'
        );
        if (!err) throw new Error("Error-State noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const errEl = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet-error"]'
    );
    expect(errEl).not.toBeNull();
    expect(errEl?.getAttribute("role")).toBe("alert");
    expect(errEl?.textContent).toContain("Offene Posten aktuell nicht abrufbar");

    // Container-Article ist nach Auflösung des Fehlers nicht mehr busy.
    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    expect(card?.getAttribute("aria-busy")).toBe("false");
    expect(card?.getAttribute("aria-live")).toBe("polite");

    unmount();
  });

  it("A11y · Erfassungsstatus Error-State: role=\"alert\" + Hint + aria-busy=\"false\"", async () => {
    // Query-Error mocken: `countMatchesByStatus` rejected → bankReconQ.isError
    // → erfassungIsError → Error-Pfad mit role="alert".
    const bankReconModule = await import(
      "../../api/bankReconciliationMatches"
    );
    vi.spyOn(bankReconModule, "countMatchesByStatus").mockRejectedValue(
      new Error("Simulierter Fetch-Fehler für Bankabstimmung")
    );

    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );
    await vi.waitFor(
      () => {
        const err = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung-error"]'
        );
        if (!err) throw new Error("Error-State noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const errEl = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung-error"]'
    );
    expect(errEl).not.toBeNull();
    expect(errEl?.getAttribute("role")).toBe("alert");
    expect(errEl?.textContent).toContain("Bankabstimmung aktuell nicht abrufbar");

    const card = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );
    expect(card?.getAttribute("aria-busy")).toBe("false");
    expect(card?.getAttribute("aria-live")).toBe("polite");

    unmount();
  });

  it("Loading-Race · Liquiditäts-Radar und Erfassungsstatus können gleichzeitig pending sein", async () => {
    // Beide Live-Karten parallel im pending-State halten: `fetchAllEntries`
    // (Liquidität) + `countMatchesByStatus` (Erfassung) werden auf nie
    // auflösende Promises gemockt. Der Test-QueryClient nutzt `gcTime: 0`
    // und `retry: false` (siehe `makeQueryClient`), sodass beim Unmount die
    // Observer detachen und die orphaned Promises vom GC entsorgt werden —
    // kein Cleanup-Risiko, keine act()-Warnungen.
    const dashboardModule = await import("../../api/dashboard");
    const bankReconModule = await import(
      "../../api/bankReconciliationMatches"
    );
    vi.spyOn(dashboardModule, "fetchAllEntries").mockReturnValue(
      new Promise(() => {
        /* nie auflösen */
      })
    );
    vi.spyOn(bankReconModule, "countMatchesByStatus").mockReturnValue(
      new Promise(() => {
        /* nie auflösen */
      })
    );

    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz?mandantId=c-1"
    );

    // Beide Live-Karten-Artikel im DOM, sobald LauncherActive gemountet ist.
    await vi.waitFor(
      () => {
        const liq = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
        );
        const erf = container.querySelector(
          '[data-testid="arbeitsplatz-info-card-erfassung"]'
        );
        if (!liq || !erf)
          throw new Error("Live-Karten noch nicht gerendert");
      },
      { timeout: 2000, interval: 10 }
    );

    const liq = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-liquiditaet"]'
    );
    const erf = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-info-card-erfassung"]'
    );

    // Beide Karten zeitgleich pending: aria-busy="true".
    expect(liq?.getAttribute("aria-busy")).toBe("true");
    expect(erf?.getAttribute("aria-busy")).toBe("true");
    // aria-live bleibt unter allen States gesetzt.
    expect(liq?.getAttribute("aria-live")).toBe("polite");
    expect(erf?.getAttribute("aria-live")).toBe("polite");

    // Positive Evidence der pending-Renderung: Loading-Hint in beiden Karten.
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-info-card-liquiditaet-loading"]'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-info-card-erfassung-loading"]'
      )
    ).not.toBeNull();

    // Während pending dürfen weder Empty- noch Error-Pfade rendern —
    // sonst würden im Race-Fenster falsche Aussagen entstehen.
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-info-card-liquiditaet-empty"]'
      )
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-info-card-liquiditaet-error"]'
      )
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-info-card-erfassung-empty"]'
      )
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="arbeitsplatz-info-card-erfassung-error"]'
      )
    ).toBeNull();

    unmount();
  });

  // --- Rechtsform-Spalte im Mandantenportfolio ---------------------------

  it("Rechtsform · Mandant mit rechtsform=GmbH zeigt 'GmbH' in der Tabellenzeile", async () => {
    const clients: Client[] = [
      {
        id: "c-rf-gmbh",
        mandant_nr: "20100",
        name: "Rechtsform-GmbH-Test",
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        rechtsform: "GmbH",
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-rf-gmbh"]'
    );
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain("GmbH");
    // Kein Fallback-Em-Dash bei gesetztem Wert.
    expect(row?.textContent).not.toContain("—");
    unmount();
  });

  it("Rechtsform · Mandant mit rechtsform=SonstigerRechtsform zeigt Klartext, keinen Tech-Key", async () => {
    const clients: Client[] = [
      {
        id: "c-rf-sonst",
        mandant_nr: "20200",
        name: "Sonstige-Rechtsform-Test",
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        rechtsform: "SonstigerRechtsform",
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-rf-sonst"]'
    );
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain("Sonstige Rechtsform");
    // Der Tech-Key darf NICHT user-facing erscheinen.
    expect(row?.textContent).not.toContain("SonstigerRechtsform");
    unmount();
  });

  it("Rechtsform · Mandant mit rechtsform=null fällt auf '—' zurück", async () => {
    const clients: Client[] = [
      {
        id: "c-rf-null",
        mandant_nr: "20300",
        name: "Rechtsform-Null-Test",
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        rechtsform: null,
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-rf-null"]'
    );
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain("—");
    unmount();
  });

  it("Rechtsform · Mandant ohne rechtsform-Feld (undefined) fällt auf '—' zurück", async () => {
    const clients: Client[] = [
      {
        id: "c-rf-undef",
        mandant_nr: "20400",
        name: "Rechtsform-Undefined-Test",
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        // rechtsform absichtlich nicht gesetzt → undefined
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-rf-undef"]'
    );
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain("—");
    unmount();
  });

  // --- Tooltip-Hardening: title-Attribute auf Name- und Rechtsform-Zelle --

  it("Tooltip · Name-Zelle trägt title mit dem vollständigen Mandantennamen", async () => {
    const longName =
      "Steuerberatungsgesellschaft Müller & Sohn mbH";
    const clients: Client[] = [
      {
        id: "c-tt-name",
        mandant_nr: "30100",
        name: longName,
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        rechtsform: "GmbH",
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-tt-name"]'
    );
    expect(row).not.toBeNull();
    const cells = row!.querySelectorAll<HTMLTableCellElement>("td");
    expect(cells.length).toBe(3);
    const nameCell = cells[1];
    // Sichtbarer Text ist der volle Name (vor CSS-Truncation), und der
    // native Hover-Tooltip macht ihn auch bei Ellipsis-Cut wiederherstellbar.
    expect(nameCell.textContent).toBe(longName);
    expect(nameCell.getAttribute("title")).toBe(longName);
    unmount();
  });

  it("Tooltip · Rechtsform-Zelle bei SonstigerRechtsform trägt Klartext-title, kein Tech-Key", async () => {
    const clients: Client[] = [
      {
        id: "c-tt-rf-sonst",
        mandant_nr: "30200",
        name: "Tooltip-Rechtsform-Test",
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        rechtsform: "SonstigerRechtsform",
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-tt-rf-sonst"]'
    );
    expect(row).not.toBeNull();
    const cells = row!.querySelectorAll<HTMLTableCellElement>("td");
    const rechtsformCell = cells[2];
    expect(rechtsformCell.getAttribute("title")).toBe("Sonstige Rechtsform");
    // Tech-Key darf weder im sichtbaren Text noch im title erscheinen.
    expect(rechtsformCell.getAttribute("title")).not.toBe(
      "SonstigerRechtsform"
    );
    expect(rechtsformCell.textContent).not.toContain("SonstigerRechtsform");
  unmount();
  });

  it("Tooltip · Mand.-Nr.-Zelle trägt bewusst kein title (kurze Werte, kein Truncation-Risiko)", async () => {
    const clients: Client[] = [
      {
        id: "c-tt-mnr",
        mandant_nr: "30300",
        name: "Tooltip-MandNr-Test",
        steuernummer: null,
        ust_id: null,
        iban: null,
        ust_id_status: "unchecked",
        ust_id_checked_at: null,
        last_daten_holen_at: null,
        rechtsform: null,
      },
    ];
    const { container, unmount } = await renderAtWithClients(
      "/arbeitsplatz",
      clients
    );
    const row = container.querySelector<HTMLTableRowElement>(
      '[data-testid="arbeitsplatz-mandant-row-c-tt-mnr"]'
    );
    expect(row).not.toBeNull();
    const cells = row!.querySelectorAll<HTMLTableCellElement>("td");
    const mandantNrCell = cells[0];
    expect(mandantNrCell.textContent).toBe("30300");
    expect(mandantNrCell.getAttribute("title")).toBeNull();
    unmount();
  });
});
