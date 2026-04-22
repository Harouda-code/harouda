/** @jsxImportSource react */
// Sprint 17.5 / Schritt 7 · StepBescheinigung-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StepBescheinigung } from "../StepBescheinigung";
import {
  loadWizard,
  updateStep,
} from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import type { Client } from "../../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-besch-test";
const JAHR = 2025;

function seedClient(): void {
  const c: Client[] = [
    {
      id: MANDANT,
      mandant_nr: "91000",
      name: "Testfirma GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
      anschrift_ort: "Berlin",
    },
  ];
  localStorage.setItem("harouda:clients", JSON.stringify(c));
}

function baseState(): WizardState {
  return {
    sessionId: "sess-b",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "bescheinigung",
    completedSteps: [
      "validation",
      "rechtsform",
      "groessenklasse",
      "bausteine",
      "erlaeuterungen",
      "review",
    ],
    data: {},
    created_at: "2026-04-27T00:00:00Z",
    updated_at: "2026-04-27T00:00:00Z",
  };
}

function renderStep(state: WizardState, onAdvance = vi.fn()) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <StepBescheinigung
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

async function flush(times = 10) {
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

function setSelect(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    "value"
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  seedClient();
  updateStep(MANDANT, JAHR, { currentStep: "bescheinigung" });
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("StepBescheinigung", () => {
  it("#1 Mount: Haftungs-Banner + Readonly-Preview + Default-Typ 'ohne_beurteilungen'", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="bescheinigung-haftungs-banner"]')
    ).not.toBeNull();
    const preview = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="bescheinigung-preview"]'
    )!;
    expect(preview).not.toBeNull();
    expect(preview.disabled).toBe(true);
    expect(preview.readOnly).toBe(true);
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="select-bescheinigung-typ"]'
    )!;
    expect(sel.value).toBe("ohne_beurteilungen");
    r.unmount();
  });

  it("#2 Auto-Fill aus Client: MandantenName + Ort werden gesetzt", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    const mandant = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-mandant"]'
    )!;
    const ort = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-ort"]'
    )!;
    expect(mandant.value).toBe("Testfirma GmbH");
    expect(ort.value).toBe("Berlin");
    r.unmount();
  });

  it("#3 Preview zeigt {{Ort}} wenn Ort-Feld geleert wird + Warnung erscheint", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    // Kanzlei + Steuerberater (sonst Preview wirft andere Missing-Warnungen).
    const k = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-kanzlei"]'
    )!;
    act(() => setInput(k, "Kanzlei X"));
    const s = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-steuerberater"]'
    )!;
    act(() => setInput(s, "Dr. X"));
    // Ort leeren.
    const ort = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-ort"]'
    )!;
    act(() => setInput(ort, ""));
    await act(async () => {
      await flush();
    });
    const preview = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="bescheinigung-preview"]'
    )!;
    expect(preview.value).toContain("{{Ort}}");
    expect(
      document.querySelector('[data-testid="bescheinigung-missing-warning"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#4 Alle Felder gesetzt → Preview vollständig + Save-Button enabled", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    const k = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-kanzlei"]'
    )!;
    act(() => setInput(k, "Kanzlei X"));
    const s = document.querySelector<HTMLInputElement>(
      '[data-testid="input-bescheinigung-steuerberater"]'
    )!;
    act(() => setInput(s, "Dr. X"));
    await act(async () => {
      await flush();
    });
    const save = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bescheinigung-save"]'
    )!;
    expect(save.disabled).toBe(false);
    expect(
      document.querySelector('[data-testid="bescheinigung-missing-warning"]')
    ).toBeNull();
    r.unmount();
  });

  it("#5 Typ-Wechsel auf 'mit_plausibilitaet': Preview enthält § 317 HGB", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="select-bescheinigung-typ"]'
    )!;
    await act(async () => {
      setSelect(sel, "mit_plausibilitaet");
      await flush();
    });
    const preview = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="bescheinigung-preview"]'
    )!;
    expect(preview.value).toContain("§ 317 HGB");
    r.unmount();
  });

  it("#6 Footer-Toggle persistiert in WizardState", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    const toggle = document.querySelector<HTMLInputElement>(
      '[data-testid="bescheinigung-footer-toggle"]'
    )!;
    expect(toggle.checked).toBe(true);
    await act(async () => {
      toggle.click();
      await flush();
    });
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.bescheinigung?.footer_sichtbar).toBe(false);
    r.unmount();
  });

  it("#7 Save blockt bei leerem Kanzlei-Name", async () => {
    const onAdv = vi.fn();
    const r = renderStep(baseState(), onAdv);
    await act(async () => {
      await flush();
    });
    // Nur Kanzlei leer lassen (Steuerberater auch leer).
    const save = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bescheinigung-save"]'
    )!;
    expect(save.disabled).toBe(true);
    await act(async () => {
      save.click();
      await flush();
    });
    expect(onAdv).not.toHaveBeenCalled();
    r.unmount();
  });
});
