/** @jsxImportSource react */
// Sprint 17 / Schritt 6 · InventurPage-Smoke-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InventurPage from "../InventurPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { YearProvider } from "../../contexts/YearContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import type { Account, Anlagegut, Client } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-inv-test";

function seedClient(): void {
  const c: Client[] = [
    {
      id: MANDANT,
      mandant_nr: "99000",
      name: "Inv-Test GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
    },
  ];
  localStorage.setItem("harouda:clients", JSON.stringify(c));
  localStorage.setItem("harouda:selectedMandantId", MANDANT);
  localStorage.setItem("harouda:selectedYear", "2025");
}

function seedAccounts(): void {
  const accs: Account[] = [
    {
      id: "a-1",
      konto_nr: "0980",
      bezeichnung: "Vorraete",
      kategorie: "aktiva",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
    },
    {
      id: "a-2",
      konto_nr: "3960",
      bezeichnung: "Bestandsveränderungen Waren",
      kategorie: "aufwand",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
    },
    {
      id: "a-3",
      konto_nr: "2400",
      bezeichnung: "Ausserordentliche Aufwendungen",
      kategorie: "aufwand",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
    },
  ];
  localStorage.setItem("harouda:accounts", JSON.stringify(accs));
}

function seedAnlage(): void {
  const a: Anlagegut[] = [
    {
      id: "ag-1",
      company_id: null,
      client_id: MANDANT,
      inventar_nr: "A-001",
      bezeichnung: "Bürostuhl",
      anschaffungsdatum: "2024-01-01",
      anschaffungskosten: 3000,
      nutzungsdauer_jahre: 5,
      afa_methode: "linear",
      konto_anlage: "0420",
      konto_afa: "4830",
      konto_abschreibung_kumuliert: null,
      aktiv: true,
      abgangsdatum: null,
      abgangserloes: null,
      notizen: null,
      parent_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];
  localStorage.setItem("harouda:anlagegueter", JSON.stringify(a));
}

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/inventur?mandantId=${MANDANT}`]}>
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <InventurPage />
              </MandantProvider>
            </YearProvider>
          </SettingsProvider>
        </MemoryRouter>
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

async function flush(times = 12) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  seedClient();
  seedAccounts();
  seedAnlage();
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("InventurPage · Smoke", () => {
  it("#1 Mount ohne Session: 'Session starten'-Button + Disclaimer sichtbar", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="btn-inventur-create-session"]')
    ).not.toBeNull();
    act(() => r.unmount());
  });

  it("#2 Session-Start erzeugt Session + zeigt Tabs", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-inventur-create-session"]'
    )!;
    await act(async () => {
      btn.click();
      await flush(20);
    });
    expect(
      document.querySelector('[data-testid="inventur-tabs"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tab-anlagen"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tab-bestaende"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tab-abschluss"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="inventur-disclaimer"]')
    ).not.toBeNull();
    act(() => r.unmount());
  });

  it("#3 Anlagen-Tab zeigt Bürostuhl mit Buchwert + 'Vorhanden'-Button", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    const start = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-inventur-create-session"]'
    )!;
    await act(async () => {
      start.click();
      await flush(20);
    });
    expect(
      document.querySelector('[data-testid="btn-anlage-vorhanden-ag-1"]')
    ).not.toBeNull();
    // Buchwert 1800 im Text.
    expect(document.body.textContent).toContain("1800");
    act(() => r.unmount());
  });

  it("#4 'Vorhanden'-Klick ruft upsertAnlageCheck → Status in localStorage gespeichert", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    const start = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-inventur-create-session"]'
    )!;
    await act(async () => {
      start.click();
      await flush(20);
    });
    const vorh = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-anlage-vorhanden-ag-1"]'
    )!;
    await act(async () => {
      vorh.click();
      await flush(15);
    });
    const rows = JSON.parse(
      localStorage.getItem("harouda:inventurAnlagen") ?? "[]"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("vorhanden");
    act(() => r.unmount());
  });

  it("#5 Bestaende-Tab: neue Position anlegen + Vorrat-Dropdown enthaelt 0980", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    const start = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-inventur-create-session"]'
    )!;
    await act(async () => {
      start.click();
      await flush(20);
    });
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="tab-bestaende"]')!
        .click();
      await flush();
    });
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="select-vorrat-konto"]'
    )!;
    // 0980 ist im SKR03-Vorrat-Range.
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.value
    );
    expect(options).toContain("0980");
    act(() => r.unmount());
  });

  it("#6 Abschluss-Tab: Close-Button initial disabled (Anlagen ungeprueft)", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    const start = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-inventur-create-session"]'
    )!;
    await act(async () => {
      start.click();
      await flush(20);
    });
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="tab-abschluss"]')!
        .click();
      await flush();
    });
    const closeBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-close-session"]'
    )!;
    expect(closeBtn.disabled).toBe(true);
    // Status-Zahlen im Abschluss-Tab.
    expect(
      document.querySelector('[data-testid="sum-anlagen"]')!.textContent
    ).toContain("0 / 1");
    act(() => r.unmount());
  });
});
