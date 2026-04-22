/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 6 · StepGroessenklasse-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StepGroessenklasse } from "../StepGroessenklasse";
import {
  loadWizard,
  updateStep,
} from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import * as accountsApi from "../../../api/accounts";
import * as dashboardApi from "../../../api/dashboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-gk-test";
const JAHR = 2025;

function baseState(rechtsform?: "Einzelunternehmen" | "GmbH"): WizardState {
  return {
    sessionId: "sess-gk",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "groessenklasse",
    completedSteps: ["validation", "rechtsform"],
    data: rechtsform ? { rechtsform: { rechtsform } } : {},
    created_at: "2026-04-22T08:00:00Z",
    updated_at: "2026-04-22T08:00:00Z",
  };
}

function renderStep(state: WizardState, onAdvance = vi.fn()) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
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
      <QueryClientProvider client={qc}>
        <StepGroessenklasse
          state={state}
          mandantId={MANDANT}
          jahr={JAHR}
          onAdvance={onAdvance}
          onRefresh={() => {}}
        />
      </QueryClientProvider>
    );
  });
  return {
    container,
    onAdvance,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 8) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function setTextAreaValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  updateStep(MANDANT, JAHR, { currentStep: "groessenklasse" });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("StepGroessenklasse", () => {
  it("#1 Einzelunternehmen: Skip mit Default 'klein'", async () => {
    const onAdvance = vi.fn();
    const r = renderStep(baseState("Einzelunternehmen"), onAdvance);
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="groessenklasse-skip"]')
    ).not.toBeNull();
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-skip-groessenklasse"]'
    )!;
    act(() => btn.click());
    expect(onAdvance).toHaveBeenCalledWith("bausteine");
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.groessenklasse?.klasse).toBe("klein");
    expect(ws.completedSteps).toContain("groessenklasse");
    r.unmount();
  });

  it("#2 GmbH: Automatische Klassifizierung 'kleinst' bei leerem Journal", async () => {
    vi.spyOn(accountsApi, "fetchAccounts").mockResolvedValue([]);
    vi.spyOn(dashboardApi, "fetchAllEntries").mockResolvedValue([]);
    const r = renderStep(baseState("GmbH"));
    await act(async () => {
      await flush(12);
    });
    const auto = document.querySelector('[data-testid="auto-klassifikation"]');
    expect(auto).not.toBeNull();
    expect(auto!.textContent).toContain("kleinst");
    r.unmount();
  });

  it("#3 GmbH: Override ohne Begründung wird abgelehnt (alert)", async () => {
    vi.spyOn(accountsApi, "fetchAccounts").mockResolvedValue([]);
    vi.spyOn(dashboardApi, "fetchAllEntries").mockResolvedValue([]);
    const alertSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).alert = alertSpy;
    const onAdvance = vi.fn();
    const r = renderStep(baseState("GmbH"), onAdvance);
    await act(async () => {
      await flush(12);
    });
    // Override aktivieren, ohne Begründung.
    act(() =>
      document
        .querySelector<HTMLInputElement>('[data-testid="override-toggle"]')!
        .click()
    );
    await act(async () => {
      await flush();
    });
    act(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="btn-advance-groessenklasse"]'
        )!
        .click()
    );
    expect(alertSpy).toHaveBeenCalled();
    expect(onAdvance).not.toHaveBeenCalled();
    r.unmount();
  });

  it("#4 GmbH: Override 'mittel' mit Begründung speichert + advance", async () => {
    vi.spyOn(accountsApi, "fetchAccounts").mockResolvedValue([]);
    vi.spyOn(dashboardApi, "fetchAllEntries").mockResolvedValue([]);
    const onAdvance = vi.fn();
    const r = renderStep(baseState("GmbH"), onAdvance);
    await act(async () => {
      await flush(12);
    });
    act(() =>
      document
        .querySelector<HTMLInputElement>('[data-testid="override-toggle"]')!
        .click()
    );
    await act(async () => {
      await flush();
    });
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="override-select"]'
    )!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value"
      )!.set!;
      setter.call(select, "mittel");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    act(() =>
      setTextAreaValue(
        document.querySelector<HTMLTextAreaElement>(
          '[data-testid="override-reason"]'
        )!,
        "Konzernmutter mit Publizitätspflicht"
      )
    );
    act(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="btn-advance-groessenklasse"]'
        )!
        .click()
    );
    expect(onAdvance).toHaveBeenCalledWith("bausteine");
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.groessenklasse?.klasse).toBe("mittel");
    expect(ws.data.groessenklasse?.begruendung[0]).toContain(
      "Konzernmutter"
    );
    r.unmount();
  });

  it("#5 GmbH: Employees-Input ändert Arbeitnehmer-Kriterium", async () => {
    vi.spyOn(accountsApi, "fetchAccounts").mockResolvedValue([]);
    vi.spyOn(dashboardApi, "fetchAllEntries").mockResolvedValue([]);
    const r = renderStep(baseState("GmbH"));
    await act(async () => {
      await flush(12);
    });
    const input = document.querySelector<HTMLInputElement>(
      '[data-testid="input-employees-count"]'
    )!;
    act(() => setInputValue(input, "300"));
    await act(async () => {
      await flush();
    });
    const kriterium = document.querySelector('[data-testid="auto-kriterium"]');
    expect(kriterium!.textContent).toContain("300");
    r.unmount();
  });
});
