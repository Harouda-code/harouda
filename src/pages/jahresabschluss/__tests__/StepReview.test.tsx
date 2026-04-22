/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 8 · StepReview-Tests.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StepReview } from "../StepReview";
import {
  loadWizard,
  updateStep,
} from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import { HGB267_SCHWELLENWERTE_2025 } from "../../../domain/accounting/HgbSizeClassifier";
import { computeBausteine } from "../../../domain/jahresabschluss/RulesEngine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-rv-test";
const JAHR = 2025;

function fullState(): WizardState {
  return {
    sessionId: "sess-rv",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "review",
    completedSteps: ["validation", "rechtsform", "groessenklasse", "bausteine"],
    data: {
      validation: {
        mandant_id: MANDANT,
        jahr: JAHR,
        stichtag: "2025-12-31",
        findings: [
          {
            severity: "warning",
            code: "CLOSING_DRAFTS_OPEN",
            message_de: "Entwürfe offen.",
          },
        ],
        darf_jahresabschluss_erstellen: true,
      },
      rechtsform: {
        rechtsform: "GmbH",
        hrb_nummer: "HRB 12345",
        hrb_gericht: "München",
        gezeichnetes_kapital: 25000,
        geschaeftsfuehrer: [
          { name: "Maria Mustermann", funktion: "geschaeftsfuehrer" },
        ],
      },
      groessenklasse: {
        klasse: "klein",
        erfuellte_kriterien: 3,
        gilt_als_erfuellt: true,
        schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
        begruendung: ["Test"],
      },
      bausteine: computeBausteine({
        rechtsform: "GmbH",
        groessenklasse: "klein",
      }),
    },
    created_at: "2026-04-22T08:00:00Z",
    updated_at: "2026-04-22T08:00:00Z",
  };
}

function renderStep(state: WizardState) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <StepReview
        state={state}
        mandantId={MANDANT}
        jahr={JAHR}
        onAdvance={vi.fn()}
        onRefresh={() => {}}
      />
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

beforeEach(() => {
  localStorage.clear();
  updateStep(MANDANT, JAHR, { currentStep: "review" });
});

describe("StepReview", () => {
  it("#1 Rendert Summary aller 4 vorherigen Steps", () => {
    const r = renderStep(fullState());
    // Validation-Summary.
    const val = document.querySelector('[data-testid="review-validation"]')!;
    expect(val.textContent).toContain("0 Fehler");
    expect(val.textContent).toContain("1 Warnungen");
    expect(val.textContent).toContain("freigegeben");
    // Rechtsform-Summary.
    const rf = document.querySelector('[data-testid="review-rechtsform"]')!;
    expect(rf.textContent).toContain("GmbH");
    expect(rf.textContent).toContain("HRB 12345");
    expect(rf.textContent).toContain("25000");
    expect(rf.textContent).toContain("Maria Mustermann");
    // Größenklasse-Summary.
    const gk = document.querySelector('[data-testid="review-groessenklasse"]')!;
    expect(gk.textContent).toContain("klein");
    expect(gk.textContent).toContain("3/3");
    // Bausteine-Summary.
    const bs = document.querySelector('[data-testid="review-bausteine"]')!;
    expect(bs.textContent).toContain("Bilanz");
    expect(bs.textContent).toContain("GuV");
    expect(bs.textContent).toContain("Anlagenspiegel");
    r.unmount();
  });

  it("#2 Finalize-Button markiert review als completed", () => {
    const r = renderStep(fullState());
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-finalize"]'
    )!;
    act(() => btn.click());
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.completedSteps).toContain("review");
    r.unmount();
  });
});
