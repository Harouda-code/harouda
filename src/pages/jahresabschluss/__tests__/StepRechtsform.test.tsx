/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 5 · StepRechtsform-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StepRechtsform } from "../StepRechtsform";
import { loadWizard, updateStep } from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import type { Client } from "../../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-rf-test";
const JAHR = 2025;

function seedClient() {
  const clients: Client[] = [
    {
      id: MANDANT,
      mandant_nr: "90200",
      name: "Rechtsform-Test GmbH",
      steuernummer: null,
      ust_id: null,
      iban: null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
    },
  ];
  localStorage.setItem("harouda:clients", JSON.stringify(clients));
}

function baseState(): WizardState {
  return {
    sessionId: "sess-rf",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "rechtsform",
    completedSteps: ["validation"],
    data: {},
    created_at: "2026-04-22T08:00:00Z",
    updated_at: "2026-04-22T08:00:00Z",
  };
}

function renderStep(state: WizardState, onAdvance = vi.fn()) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <StepRechtsform
        state={state}
        mandantId={MANDANT}
        jahr={JAHR}
        onAdvance={onAdvance}
        onRefresh={() => {}}
      />
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

async function flush(times = 6) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function setSelectValue(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    "value"
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputValue(el: HTMLInputElement, value: string) {
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
  seedClient();
  updateStep(MANDANT, JAHR, { currentStep: "rechtsform" });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("StepRechtsform", () => {
  it("#1 GmbH: HRB + Kapital + Organe-Felder erscheinen", async () => {
    const r = renderStep(baseState());
    const rf = document.querySelector<HTMLSelectElement>(
      '[data-testid="input-rechtsform"]'
    )!;
    act(() => setSelectValue(rf, "GmbH"));
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="kapital-fields"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="input-hrb-nummer"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="input-kapital"]')
    ).not.toBeNull();
    // Organ-Row automatisch angelegt.
    expect(document.querySelector('[data-testid="gf-row-0"]')).not.toBeNull();
    r.unmount();
  });

  it("#2 Einzelunternehmen: keine HRB- oder Kapital-Felder", async () => {
    const r = renderStep(baseState());
    const rf = document.querySelector<HTMLSelectElement>(
      '[data-testid="input-rechtsform"]'
    )!;
    act(() => setSelectValue(rf, "Einzelunternehmen"));
    await act(async () => {
      await flush();
    });
    expect(document.querySelector('[data-testid="kapital-fields"]')).toBeNull();
    expect(document.querySelector('[data-testid="person-fields"]')).toBeNull();
    expect(
      document.querySelector('[data-testid="input-hrb-nummer"]')
    ).toBeNull();
    r.unmount();
  });

  it("#3 Save aktualisiert Client-Record UND wizardState", async () => {
    const onAdvance = vi.fn();
    const r = renderStep(baseState(), onAdvance);
    const rf = document.querySelector<HTMLSelectElement>(
      '[data-testid="input-rechtsform"]'
    )!;
    act(() => setSelectValue(rf, "GmbH"));
    await act(async () => {
      await flush();
    });
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="input-hrb-nummer"]'
        )!,
        "HRB 12345"
      )
    );
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="input-hrb-gericht"]'
        )!,
        "München"
      )
    );
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="input-kapital"]'
        )!,
        "25000"
      )
    );
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="gf-name-0"]'
        )!,
        "Maria Mustermann"
      )
    );
    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="form-rechtsform"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(10);
    });
    // Client geschrieben.
    const clients = JSON.parse(localStorage.getItem("harouda:clients")!);
    expect(clients[0].rechtsform).toBe("GmbH");
    expect(clients[0].hrb_nummer).toBe("HRB 12345");
    expect(clients[0].gezeichnetes_kapital).toBe(25000);
    expect(clients[0].geschaeftsfuehrer[0].name).toBe("Maria Mustermann");
    // WizardState aktualisiert.
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.rechtsform?.rechtsform).toBe("GmbH");
    expect(ws.completedSteps).toContain("rechtsform");
    expect(onAdvance).toHaveBeenCalledWith("groessenklasse");
    r.unmount();
  });

  it("#4 Validation triggert: leere Pflichtfelder -> kein advance", async () => {
    const onAdvance = vi.fn();
    const r = renderStep(baseState(), onAdvance);
    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="form-rechtsform"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(8);
    });
    expect(onAdvance).not.toHaveBeenCalled();
    // Wizard-State NICHT aktualisiert.
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.rechtsform).toBeUndefined();
    expect(ws.completedSteps).not.toContain("rechtsform");
    r.unmount();
  });

  it("#5 HRB-Regex: Format 'ABC' wird abgelehnt", async () => {
    const onAdvance = vi.fn();
    const r = renderStep(baseState(), onAdvance);
    const rf = document.querySelector<HTMLSelectElement>(
      '[data-testid="input-rechtsform"]'
    )!;
    act(() => setSelectValue(rf, "GmbH"));
    await act(async () => {
      await flush();
    });
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="input-hrb-nummer"]'
        )!,
        "ABC-invalid"
      )
    );
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="input-hrb-gericht"]'
        )!,
        "München"
      )
    );
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="input-kapital"]'
        )!,
        "25000"
      )
    );
    act(() =>
      setInputValue(
        document.querySelector<HTMLInputElement>(
          '[data-testid="gf-name-0"]'
        )!,
        "Max"
      )
    );
    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="form-rechtsform"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(8);
    });
    expect(onAdvance).not.toHaveBeenCalled();
    // Client NICHT aktualisiert.
    const clients = JSON.parse(localStorage.getItem("harouda:clients")!);
    expect(clients[0].rechtsform).toBeUndefined();
    r.unmount();
  });
});
