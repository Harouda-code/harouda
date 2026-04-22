/** @jsxImportSource react */
// Phase 3 / Schritt 9 · AnlageGPage-Integration.
// Verifiziert: GL-derived Feld ist readOnly + zeigt Builder-Wert,
// Klick öffnet DrillDownModal, manuelle Felder bleiben editierbar.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnlageGPage from "../AnlageGPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import { store } from "../../api/store";
import { tagsForKonto } from "../../domain/est/tagsForKonto";
import type { Account, Client, JournalEntry } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-kuehn";

function makeAccount(konto_nr: string, kategorie: Account["kategorie"]): Account {
  return {
    id: `acc-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie,
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
    tags: tagsForKonto(konto_nr),
  };
}

function makeEntry(
  id: string,
  datum: string,
  soll: string,
  haben: string,
  betrag: number
): JournalEntry {
  return {
    id,
    datum,
    beleg_nr: `B-${id}`,
    beschreibung: `Test ${id}`,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz: null,
    status: "gebucht",
    client_id: MANDANT_ID,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
  };
}

function seedKanzlei() {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "10100",
      name: "Kühn Musterfirma GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
    },
  ];
  const accounts: Account[] = [
    makeAccount("8400", "ertrag"),
    makeAccount("1200", "aktiva"),
    makeAccount("4110", "aufwand"),
  ];
  const entries: JournalEntry[] = [
    makeEntry("e1", "2025-02-15", "1200", "8400", 1000),
    makeEntry("e2", "2025-06-15", "1200", "8400", 2500),
    makeEntry("e3", "2025-03-01", "4110", "1200", 3000),
  ];
  store.setClients(clients);
  store.setAccounts(accounts);
  store.setEntries(entries);
  localStorage.setItem("harouda:selectedYear", "2025");
}

type RenderResult = {
  container: HTMLDivElement;
  unmount: () => void;
  client: QueryClient;
};

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
        <MemoryRouter initialEntries={[`/steuer/anlage-g?mandantId=${MANDANT_ID}`]}>
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <AnlageGPage />
              </MandantProvider>
            </YearProvider>
          </SettingsProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  });
  return {
    container,
    client,
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
  seedKanzlei();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("AnlageGPage · Phase-3-Integration", () => {
  it("#1 GL-Feld 'umsaetze' zeigt Builder-Wert als readOnly + Badge", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Der GL-Row für "umsaetze" muss existieren.
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) =>
      el.textContent?.includes("Umsätze (netto, 19 % + 7 %)")
    ) as HTMLElement | undefined;
    expect(glRow).toBeDefined();
    // Input ist readOnly.
    const input = glRow!.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    );
    expect(input).not.toBeNull();
    expect(input!.readOnly).toBe(true);
    // Wert = 3500 (1000 + 2500) — aber als number-input.
    expect(Number(input!.value)).toBe(3500);
    // Badge "Aus Buchhaltung" ist präsent.
    const btn = glRow!.querySelector<HTMLButtonElement>(
      '[data-testid="gl-drill-btn"]'
    );
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("Aus Buchhaltung");
    r.unmount();
  });

  it("#2 Klick auf 'umsaetze'-Badge öffnet DrillDownModal mit korrekter Konto-Liste", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) =>
      el.textContent?.includes("Umsätze (netto, 19 % + 7 %)")
    ) as HTMLElement;
    const btn = glRow.querySelector<HTMLButtonElement>(
      '[data-testid="gl-drill-btn"]'
    )!;
    act(() => btn.click());
    await act(async () => {
      await flush();
    });
    // Modal-Tabelle sollte offen sein, mit 2 Zeilen (e1 + e2 auf 8400).
    const rows = document.querySelectorAll('[data-testid^="drill-row-"]');
    expect(rows).toHaveLength(2);
    const sum = document.querySelector('[data-testid="drill-sum-value"]');
    expect(sum?.textContent).toMatch(/3\.500,00/);
    r.unmount();
  });

  it("#3 Manuelles Feld 'bezugsnebenkosten' ist editierbar und persistiert", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // BmfInputRow-Variante: type="number", nicht readOnly.
    const manualLabel = Array.from(
      document.querySelectorAll(".bmf-form__label span")
    ).find((el) => el.textContent?.startsWith("Bezugsnebenkosten"));
    expect(manualLabel).toBeDefined();
    const manualRow = manualLabel!.closest<HTMLDivElement>(".bmf-form__row")!;
    // NICHT data-source="gl-derived"
    expect(manualRow.getAttribute("data-source")).toBeNull();
    const input = manualRow.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    )!;
    expect(input.readOnly).toBe(false);
    // Wert eintragen.
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, "250");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    // localStorage-Persistenz via writeEstForm (V3-Key).
    const v3Key = `harouda:est:${MANDANT_ID}:2025:anlage-g`;
    const raw = localStorage.getItem(v3Key);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!);
    expect(stored.bezugsnebenkosten).toBe(250);
    r.unmount();
  });

  it("#4 Entwurf-Eintrag: Banner sichtbar, Count korrekt, Summen unveraendert", async () => {
    // Zusätzlicher Entwurf-Eintrag auf 8400 (AnlageG-relevant).
    const existing = store.getEntries();
    const draftEntry = {
      id: "e-draft",
      datum: "2025-07-01",
      beleg_nr: "DRAFT-1",
      beschreibung: "Entwurfs-Rechnung",
      soll_konto: "1200",
      haben_konto: "8400",
      betrag: 4000,
      ust_satz: null,
      status: "entwurf" as const,
      client_id: MANDANT_ID,
      skonto_pct: null,
      skonto_tage: null,
      gegenseite: null,
      faelligkeit: null,
      version: 1,
      batch_id: null,
    };
    store.setEntries([...existing, draftEntry]);

    const r = renderPage();
    await act(async () => {
      await flush();
    });
    // Banner sichtbar.
    const banner = document.querySelector(
      '[data-testid="entwurf-warning-banner"]'
    );
    expect(banner).not.toBeNull();
    const defaultText = document.querySelector(
      '[data-testid="entwurf-default-text"]'
    );
    expect(defaultText?.textContent).toContain("1"); // 1 draft entry
    // GL-Feld umsaetze bleibt bei 3500 (NICHT 7500) — Entwurf NICHT inkludiert.
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) => el.textContent?.includes("Umsätze")) as HTMLElement;
    const input = glRow.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    )!;
    expect(Number(input.value)).toBe(3500);
    r.unmount();
  });

  it("#5 Simulation-Toggle: Summen inkludieren Entwurf, PDF-Button disabled", async () => {
    const existing = store.getEntries();
    store.setEntries([
      ...existing,
      {
        id: "e-draft-sim",
        datum: "2025-07-01",
        beleg_nr: "DRAFT-2",
        beschreibung: "Sim-Entwurf",
        soll_konto: "1200",
        haben_konto: "8400",
        betrag: 4000,
        ust_satz: null,
        status: "entwurf" as const,
        client_id: MANDANT_ID,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: null,
        faelligkeit: null,
        version: 1,
        batch_id: null,
      },
    ]);

    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const toggle = document.querySelector<HTMLInputElement>(
      '[data-testid="entwurf-toggle"]'
    )!;
    act(() => toggle.click());
    await act(async () => {
      await flush();
    });
    // Nach Toggle: Simulation-Text sichtbar.
    expect(
      document.querySelector('[data-testid="entwurf-simulation-text"]')
    ).not.toBeNull();
    // umsaetze jetzt 7500 (3500 gebucht + 4000 Entwurf).
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) => el.textContent?.includes("Umsätze")) as HTMLElement;
    const input = glRow.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    )!;
    expect(Number(input.value)).toBe(7500);
    // PDF-Button disabled.
    const pdfBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="taxform-pdf-btn"]'
    );
    expect(pdfBtn).not.toBeNull();
    expect(pdfBtn!.disabled).toBe(true);
    expect(pdfBtn!.getAttribute("title")).toMatch(/Simulation/);
    r.unmount();
  });
});
