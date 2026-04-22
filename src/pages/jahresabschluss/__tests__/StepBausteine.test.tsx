/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 7 · StepBausteine-Tests.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StepBausteine } from "../StepBausteine";
import {
  loadWizard,
  updateStep,
} from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import { HGB267_SCHWELLENWERTE_2025 } from "../../../domain/accounting/HgbSizeClassifier";
import type {
  Hgb267Klasse,
  Hgb267Klassifikation,
} from "../../../domain/accounting/HgbSizeClassifier";
import type { Rechtsform } from "../../../domain/ebilanz/hgbTaxonomie68";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-bs-test";
const JAHR = 2025;

function makeKlassifikation(klasse: Hgb267Klasse): Hgb267Klassifikation {
  return {
    klasse,
    erfuellte_kriterien: 3,
    gilt_als_erfuellt: true,
    schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
    begruendung: ["test"],
  };
}

function stateWith(
  rechtsform?: Rechtsform,
  klasse?: Hgb267Klasse
): WizardState {
  return {
    sessionId: "sess-bs",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "bausteine",
    completedSteps: ["validation", "rechtsform", "groessenklasse"],
    data: {
      ...(rechtsform ? { rechtsform: { rechtsform } } : {}),
      ...(klasse ? { groessenklasse: makeKlassifikation(klasse) } : {}),
    },
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
      <StepBausteine
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

beforeEach(() => {
  localStorage.clear();
  updateStep(MANDANT, JAHR, { currentStep: "bausteine" });
});

describe("StepBausteine", () => {
  it("#1 GmbH mittel: Bilanz+GuV+Anlagenspiegel+Anhang+Lagebericht aktiv", () => {
    const r = renderStep(stateWith("GmbH", "mittel"));
    const bilanz = document.querySelector('[data-testid="baustein-bilanz"]');
    const guv = document.querySelector('[data-testid="baustein-guv"]');
    const spiegel = document.querySelector(
      '[data-testid="baustein-anlagenspiegel"]'
    );
    const anhang = document.querySelector('[data-testid="baustein-anhang"]');
    const lage = document.querySelector('[data-testid="baustein-lagebericht"]');
    expect(bilanz!.getAttribute("data-aktiv")).toBe("true");
    expect(guv!.getAttribute("data-aktiv")).toBe("true");
    expect(spiegel!.getAttribute("data-aktiv")).toBe("true");
    expect(anhang!.getAttribute("data-aktiv")).toBe("true");
    expect(lage!.getAttribute("data-aktiv")).toBe("true");
    r.unmount();
  });

  it("#2 Einzelunternehmen: nur EÜR + Anlagenspiegel aktiv, Bilanz/GuV/Anhang aus", () => {
    const r = renderStep(stateWith("Einzelunternehmen", "klein"));
    expect(
      document
        .querySelector('[data-testid="baustein-euer"]')!
        .getAttribute("data-aktiv")
    ).toBe("true");
    expect(
      document
        .querySelector('[data-testid="baustein-bilanz"]')!
        .getAttribute("data-aktiv")
    ).toBe("false");
    expect(
      document
        .querySelector('[data-testid="baustein-guv"]')!
        .getAttribute("data-aktiv")
    ).toBe("false");
    expect(
      document
        .querySelector('[data-testid="baustein-anhang"]')!
        .getAttribute("data-aktiv")
    ).toBe("false");
    r.unmount();
  });

  it("#3 Missing-Input-Fallback: ohne rechtsform/groessenklasse", () => {
    const r = renderStep(stateWith());
    expect(
      document.querySelector('[data-testid="bausteine-missing-input"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="bausteine-list"]')
    ).toBeNull();
    r.unmount();
  });

  it("#4 Advance: speichert bausteine + markiert completed + onAdvance('erlaeuterungen')", () => {
    const onAdvance = vi.fn();
    const r = renderStep(stateWith("GmbH", "klein"), onAdvance);
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-advance-bausteine"]'
    )!;
    act(() => btn.click());
    expect(onAdvance).toHaveBeenCalledWith("erlaeuterungen");
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.bausteine).toBeDefined();
    expect(ws.data.bausteine?.bilanz).toBe(true);
    expect(ws.completedSteps).toContain("bausteine");
    r.unmount();
  });
});
