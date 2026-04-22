/** @jsxImportSource react */
// Sprint 20.A.1 · Regression-Test gegen hardcoded company_id.
//
// Der Project-Owner-Review von Gate 19.C deckte auf, dass
// companyId="c-demo" in 2 Production-Dateien hart codiert war
// (PartnerListPage + ERechnungPage). Dieser Test verhindert das
// Wiederauftauchen: wir mounten beide Seiten mit einer *eigenen*
// DEMO-Company-ID via CompanyProvider und greifen direkt nach
// dem INSERT in localStorage — der gespeicherte Partner MUSS die
// Provider-Company-ID tragen, nie "c-demo".

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DebitorenPage from "../DebitorenPage";
import ERechnungPage from "../ERechnungPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { UserProvider } from "../../contexts/UserContext";
import {
  CompanyProvider,
  DEMO_COMPANY_ID,
} from "../../contexts/CompanyContext";
import type { BusinessPartner } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-regress";

function mountWithProviders(path: string, Page: React.ComponentType) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <UserProvider>
          <CompanyProvider>
            <SettingsProvider>
              <MemoryRouter initialEntries={[path]}>
                <MandantProvider>
                  <Routes>
                    <Route path="/debitoren" element={<Page />} />
                    <Route
                      path="/buchungen/e-rechnung"
                      element={<Page />}
                    />
                  </Routes>
                </MandantProvider>
              </MemoryRouter>
            </SettingsProvider>
          </CompanyProvider>
        </UserProvider>
      </QueryClientProvider>
    );
  });
  return {
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 20) {
  for (let i = 0; i < times; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Sprint 20.A.1 · Hardcoded company_id · Regression", () => {
  it("#1 DEMO_COMPANY_ID-Konstante ist DER kanonische Wert (keine Drift)", () => {
    // Harter Anker: ändert jemand den Wert, bricht dieser Test und
    // zwingt zu einer bewussten Migration.
    expect(DEMO_COMPANY_ID).toBe("demo-00000000-0000-0000-0000-000000000001");
  });

  it("#2 Re-Export aus api/db.ts ist identisch", async () => {
    const fromDb = await import("../../api/db");
    expect(fromDb.DEMO_COMPANY_ID).toBe(DEMO_COMPANY_ID);
  });

  it("#3 DebitorenPage legt Partner mit DEMO_COMPANY_ID (nicht 'c-demo') an", async () => {
    const r = mountWithProviders(
      `/debitoren?mandantId=${CLIENT}`,
      DebitorenPage
    );
    await act(async () => flush(30));

    // "Neuer Debitor" → Dialog öffnen
    const newBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-partner-new"]'
    )!;
    await act(async () => {
      newBtn.click();
      await flush();
    });
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    await act(async () => {
      typeInto(name, "Regressions-Kunde");
      await flush();
    });
    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="partner-form"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(25);
    });

    const stored = JSON.parse(
      localStorage.getItem("harouda-business-partners") ?? "[]"
    ) as BusinessPartner[];
    expect(stored.length).toBe(1);
    // Kernaussage: kein "c-demo" — die Provider-Company-ID wird durchgereicht.
    expect(stored[0].company_id).not.toBe("c-demo");
    expect(stored[0].company_id).toBe(DEMO_COMPANY_ID);
    r.unmount();
  });

  it("#4 ERechnungPage 'Als Debitor speichern' nutzt DEMO_COMPANY_ID", async () => {
    const r = mountWithProviders(
      `/buchungen/e-rechnung?mandantId=${CLIENT}`,
      ERechnungPage
    );
    await act(async () => flush(30));

    // Default-Buyer ist gefüllt → "Als Debitor speichern"-Button sichtbar
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-als-debitor-speichern"]'
    );
    expect(btn).not.toBeNull();
    await act(async () => {
      btn!.click();
      await flush();
    });

    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="partner-form"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(25);
    });

    const stored = JSON.parse(
      localStorage.getItem("harouda-business-partners") ?? "[]"
    ) as BusinessPartner[];
    expect(stored.length).toBe(1);
    expect(stored[0].company_id).not.toBe("c-demo");
    expect(stored[0].company_id).toBe(DEMO_COMPANY_ID);
    r.unmount();
  });

  it("#5 Kein 'c-demo'-Literal im gerenderten DebitorenPage-Tree", async () => {
    const r = mountWithProviders(
      `/debitoren?mandantId=${CLIENT}`,
      DebitorenPage
    );
    await act(async () => flush(30));
    // HTML-Text-Content darf den verdächtigen Literal-String nicht enthalten.
    expect(document.body.innerHTML).not.toContain("c-demo");
    r.unmount();
  });
});
