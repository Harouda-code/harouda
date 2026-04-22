/** @jsxImportSource react */
// Sprint 15 / Schritt 6 · SvMeldungenPage-Smoke-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SvMeldungenPage from "../SvMeldungenPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { YearProvider } from "../../contexts/YearContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import type { Client, Employee } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT_ID = "c-sv-test";

function seedClient(anschriftComplete = true): void {
  const clients: Client[] = [
    {
      id: MANDANT_ID,
      mandant_nr: "91000",
      name: "SV-Test GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
      ...(anschriftComplete
        ? {
            anschrift_strasse: "Firmenstr.",
            anschrift_hausnummer: "1",
            anschrift_plz: "10115",
            anschrift_ort: "Berlin",
            anschrift_land: "DE",
          }
        : {}),
    },
  ];
  localStorage.setItem("harouda:clients", JSON.stringify(clients));
  localStorage.setItem("harouda:selectedMandantId", MANDANT_ID);
  localStorage.setItem("harouda:selectedYear", "2025");
}

function seedEmployees(emps: Employee[]): void {
  localStorage.setItem("harouda:employees", JSON.stringify(emps));
}

function makeEmp(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "emp-1",
    company_id: null,
    client_id: MANDANT_ID,
    personalnummer: "001",
    vorname: "Anna",
    nachname: "Muster",
    steuer_id: "12345678901",
    sv_nummer: "12345678A012",
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: "BE",
    einstellungsdatum: "2024-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 2.45,
    privat_versichert: false,
    pv_kinderlos: false,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    staatsangehoerigkeit: "DE",
    taetigkeitsschluessel: "123456789",
    einzugsstelle_bbnr: "01234567",
    anschrift_strasse: "Musterweg",
    anschrift_hausnummer: "1",
    anschrift_plz: "10115",
    anschrift_ort: "Berlin",
    anschrift_land: "DE",
    mehrfachbeschaeftigung: false,
    ...overrides,
  };
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
        <MemoryRouter
          initialEntries={[`/lohn/sv-meldungen?mandantId=${MANDANT_ID}`]}
        >
          <SettingsProvider>
            <YearProvider>
              <MandantProvider>
                <SvMeldungenPage />
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

async function flush(times = 6) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function setInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  seedClient();
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("SvMeldungenPage · Smoke", () => {
  it("#1 Mount mit aktivem Mandanten + Warn-Banner + Absender-Block sichtbar", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="sv-warn-banner"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="sv-absender-block"]')
    ).not.toBeNull();
    // Warn-Banner-Inhalt.
    const warnBanner = document.querySelector(
      '[data-testid="sv-warn-banner"]'
    )!;
    expect(warnBanner.textContent).toContain("SV-Meldeportal");
    expect(warnBanner.textContent).toContain("ITSG");
    r.unmount();
  });

  it("#2 Absender-Stammdaten werden in localStorage persistiert", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    const btriebsnrInput = document.querySelector<HTMLInputElement>(
      '[data-testid="input-absender-betriebsnummer"]'
    )!;
    act(() => setInput(btriebsnrInput, "12345678"));
    const nameInput = document.querySelector<HTMLInputElement>(
      '[data-testid="input-absender-name"]'
    )!;
    act(() => setInput(nameInput, "SV-Test GmbH"));
    await act(async () => {
      await flush();
    });
    const stored = localStorage.getItem(`harouda:sv-absender:${MANDANT_ID}`);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.betriebsnummer).toBe("12345678");
    expect(parsed.name).toBe("SV-Test GmbH");
    r.unmount();
  });

  it("#3 Ohne Employees: 'Keine aktiven Arbeitnehmer'-Hinweis, DSuV-Export-Button disabled", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="sv-no-employees"]')
    ).not.toBeNull();
    const exportBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-dsuv-export"]'
    )!;
    expect(exportBtn.disabled).toBe(true);
    r.unmount();
  });

  it("#5 Sprint 18: Employee mit vollstaendigen SV-Feldern → Jahresmeldungs-Button enabled + Pre-Flight-Banner ausgeblendet", async () => {
    seedEmployees([makeEmp()]);
    const r = mount();
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-jahresmeldung-emp-1"]'
    );
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(false);
    // SV-Stammdaten-OK-Badge.
    expect(
      document.querySelector('[data-testid="sv-row-ok-emp-1"]')
    ).not.toBeNull();
    // Kein Pre-Flight-Banner wenn alle Employees + Client-Anschrift komplett.
    expect(
      document.querySelector('[data-testid="sv-preflight-warning"]')
    ).toBeNull();
    r.unmount();
  });

  it("#6 Sprint 18: Employee mit NULL-Taetigkeitsschluessel → Button disabled + Pre-Flight-Banner sichtbar", async () => {
    seedEmployees([makeEmp({ taetigkeitsschluessel: null })]);
    const r = mount();
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-jahresmeldung-emp-1"]'
    );
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(true);
    // Pre-Flight-Banner zaehlt 1 unvollstaendigen Employee.
    const pre = document.querySelector(
      '[data-testid="sv-preflight-warning"]'
    );
    expect(pre).not.toBeNull();
    expect(pre!.getAttribute("data-incomplete-count")).toBe("1");
    r.unmount();
  });

  it("#7 Sprint 18: Client ohne Anschrift → Pre-Flight-Banner zeigt Client-Link", async () => {
    localStorage.clear();
    document.body.innerHTML = "";
    seedClient(false); // Anschrift fehlt
    seedEmployees([makeEmp()]);
    const r = mount();
    await act(async () => {
      await flush();
    });
    const pre = document.querySelector(
      '[data-testid="sv-preflight-warning"]'
    );
    expect(pre).not.toBeNull();
    expect(pre!.textContent).toContain("Mandant-Anschrift");
    r.unmount();
  });

  it("#4 Beitragsnachweis-CSV-Button triggert Download (a[download]-Element erscheint + entfernt)", async () => {
    const r = mount();
    await act(async () => {
      await flush();
    });
    // Absender vollstaendig befuellen damit absenderValid=true.
    for (const [testId, value] of [
      ["input-absender-betriebsnummer", "12345678"],
      ["input-absender-name", "Firma X"],
    ] as const) {
      const inp = document.querySelector<HTMLInputElement>(
        `[data-testid="${testId}"]`
      )!;
      act(() => setInput(inp, value));
    }
    // Strasse/PLZ/Ort — ohne data-testid, ueber name+Label-Text.
    const labels = Array.from(document.querySelectorAll("label"));
    for (const [labelText, value] of [
      ["Straße", "Teststr."],
      ["PLZ", "10115"],
      ["Ort", "Berlin"],
    ] as const) {
      const lbl = labels.find((l) => l.textContent?.includes(labelText));
      const inp = lbl?.querySelector<HTMLInputElement>("input");
      if (inp) act(() => setInput(inp, value));
    }
    await act(async () => {
      await flush();
    });
    // URL.createObjectURL im happy-dom stubben.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (URL as any).createObjectURL = vi.fn(() => "blob:test");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (URL as any).revokeObjectURL = vi.fn();
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-beitragsnachweis-csv"]'
    )!;
    act(() => btn.click());
    // downloadText loest Klick-Simulation aus und entfernt das a-Element;
    // Smoke-check: createObjectURL wurde aufgerufen.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((URL as any).createObjectURL).toHaveBeenCalledTimes(1);
    r.unmount();
  });
});
