/** @jsxImportSource react */
// Phase 3 / Schritt 9 · AnlageSPage-Integration.
// Analog zum AnlageG-Integrations-Test, S-spezifische Felder.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnlageSPage from "../AnlageSPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import { store } from "../../api/store";
import { tagsForKonto } from "../../domain/est/tagsForKonto";
import type { Account, Client, JournalEntry } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-selbst";

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
      mandant_nr: "20100",
      name: "Dr. Selbst (Freiberuflerin)",
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
    makeAccount("4670", "aufwand"),
  ];
  const entries: JournalEntry[] = [
    makeEntry("e1", "2025-02-15", "1200", "8400", 2000),
    makeEntry("e2", "2025-06-15", "1200", "8400", 3500),
    makeEntry("e3", "2025-03-01", "4670", "1200", 600),
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
        <MemoryRouter initialEntries={[`/steuer/anlage-s?mandantId=${MANDANT_ID}`]}>
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <AnlageSPage />
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

describe("AnlageSPage · Phase-3-Integration", () => {
  it("#1 GL-Feld 'honorare' zeigt Builder-Wert als readOnly + Badge", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) =>
      el.textContent?.includes("Honorare / Vergütungen")
    ) as HTMLElement | undefined;
    expect(glRow).toBeDefined();
    const input = glRow!.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    );
    expect(input).not.toBeNull();
    expect(input!.readOnly).toBe(true);
    // 2000 + 3500 = 5500
    expect(Number(input!.value)).toBe(5500);
    expect(
      glRow!.querySelector<HTMLButtonElement>('[data-testid="gl-drill-btn"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#2 Klick auf 'honorare'-Badge öffnet DrillDownModal mit 2 Buchungen", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) =>
      el.textContent?.includes("Honorare / Vergütungen")
    ) as HTMLElement;
    const btn = glRow.querySelector<HTMLButtonElement>(
      '[data-testid="gl-drill-btn"]'
    )!;
    act(() => btn.click());
    await act(async () => {
      await flush();
    });
    const rows = document.querySelectorAll('[data-testid^="drill-row-"]');
    expect(rows).toHaveLength(2);
    const sum = document.querySelector('[data-testid="drill-sum-value"]');
    expect(sum?.textContent).toMatch(/5\.500,00/);
    r.unmount();
  });

  it("#3 Manuelles Feld 'umsatzsteuerpflichtig' bleibt editierbar", async () => {
    const r = renderPage();
    await act(async () => {
      await flush();
    });
    const manualLabel = Array.from(
      document.querySelectorAll(".bmf-form__label span")
    ).find((el) =>
      el.textContent?.startsWith("Umsatzsteuerpflichtige Einnahmen")
    );
    expect(manualLabel).toBeDefined();
    const manualRow = manualLabel!.closest<HTMLDivElement>(".bmf-form__row")!;
    expect(manualRow.getAttribute("data-source")).toBeNull();
    const input = manualRow.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    )!;
    expect(input.readOnly).toBe(false);
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, "777");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    const v3Key = `harouda:est:${MANDANT_ID}:2025:anlage-s`;
    const stored = JSON.parse(localStorage.getItem(v3Key) ?? "{}");
    expect(stored.umsatzsteuerpflichtig).toBe(777);
    r.unmount();
  });

  it("#4 Entwurf-Eintrag: Banner sichtbar, Summen (honorare) unveraendert", async () => {
    const existing = store.getEntries();
    store.setEntries([
      ...existing,
      {
        id: "e-s-draft",
        datum: "2025-08-01",
        beleg_nr: "S-DRAFT-1",
        beschreibung: "Honorar-Entwurf",
        soll_konto: "1200",
        haben_konto: "8400",
        betrag: 1500,
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
    expect(
      document.querySelector('[data-testid="entwurf-warning-banner"]')
    ).not.toBeNull();
    // honorare bleibt 5500 (2000 + 3500 gebucht, NICHT + 1500 Entwurf).
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) => el.textContent?.includes("Honorare")) as HTMLElement;
    const input = glRow.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    )!;
    expect(Number(input.value)).toBe(5500);
    r.unmount();
  });

  it("#5 Simulation-Toggle: honorare inkludiert Entwurf, PDF disabled", async () => {
    const existing = store.getEntries();
    store.setEntries([
      ...existing,
      {
        id: "e-s-draft-sim",
        datum: "2025-08-01",
        beleg_nr: "S-DRAFT-2",
        beschreibung: "Honorar-Sim",
        soll_konto: "1200",
        haben_konto: "8400",
        betrag: 1500,
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
    const glRow = Array.from(
      document.querySelectorAll('[data-source="gl-derived"]')
    ).find((el) => el.textContent?.includes("Honorare")) as HTMLElement;
    const input = glRow.querySelector<HTMLInputElement>(
      "input.bmf-form__amount-input"
    )!;
    expect(Number(input.value)).toBe(7000); // 5500 + 1500
    const pdfBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="taxform-pdf-btn"]'
    );
    expect(pdfBtn?.disabled).toBe(true);
    r.unmount();
  });
});
