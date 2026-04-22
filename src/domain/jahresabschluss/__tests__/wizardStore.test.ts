// Jahresabschluss-E2 / Schritt 1 · wizardStore-Tests.

import { describe, it, expect, beforeEach } from "vitest";
import {
  loadWizard,
  saveWizard,
  clearWizard,
  updateStep,
  markStepCompleted,
} from "../wizardStore";
import type { WizardState } from "../WizardTypes";

function makeState(mandantId: string, jahr: number): WizardState {
  return {
    sessionId: "sess-1",
    mandantId,
    jahr,
    currentStep: "validation",
    completedSteps: [],
    data: {},
    created_at: "2026-04-22T08:00:00Z",
    updated_at: "2026-04-22T08:00:00Z",
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("wizardStore", () => {
  it("#1 leerer Fallback: loadWizard liefert null", () => {
    expect(loadWizard("c-A", 2025)).toBeNull();
  });

  it("#2 CRUD: save → load → clear → load", () => {
    const s = makeState("c-A", 2025);
    saveWizard(s);
    expect(loadWizard("c-A", 2025)?.sessionId).toBe("sess-1");
    clearWizard("c-A", 2025);
    expect(loadWizard("c-A", 2025)).toBeNull();
  });

  it("#3 Mandant-Isolation", () => {
    saveWizard(makeState("c-A", 2025));
    saveWizard({ ...makeState("c-B", 2025), sessionId: "sess-B" });
    expect(loadWizard("c-A", 2025)?.sessionId).toBe("sess-1");
    expect(loadWizard("c-B", 2025)?.sessionId).toBe("sess-B");
  });

  it("#4 Jahr-Isolation: derselbe Mandant hat getrennte Sessions pro Jahr", () => {
    saveWizard(makeState("c-A", 2024));
    saveWizard({ ...makeState("c-A", 2025), sessionId: "sess-2025" });
    expect(loadWizard("c-A", 2024)?.sessionId).toBe("sess-1");
    expect(loadWizard("c-A", 2025)?.sessionId).toBe("sess-2025");
  });

  it("#5 updateStep: Partial-Update bewahrt andere Felder", () => {
    updateStep("c-A", 2025, {
      currentStep: "rechtsform",
      data: { rechtsform: { rechtsform: "GmbH", hrb_nummer: "HRB 1" } },
    });
    updateStep("c-A", 2025, {
      data: {
        groessenklasse: {
          klasse: "klein",
          erfuellte_kriterien: 3,
          gilt_als_erfuellt: true,
          schwellenwerte_verwendet: {} as never,
          begruendung: ["test"],
        },
      },
    });
    const loaded = loadWizard("c-A", 2025);
    // rechtsform-Daten bewahrt.
    expect(loaded?.data.rechtsform?.rechtsform).toBe("GmbH");
    expect(loaded?.data.rechtsform?.hrb_nummer).toBe("HRB 1");
    // groessenklasse-Daten neu da.
    expect(loaded?.data.groessenklasse?.klasse).toBe("klein");
    expect(loaded?.currentStep).toBe("rechtsform");
  });

  it("#6 markStepCompleted: fügt Schritt hinzu ohne Duplikate", () => {
    markStepCompleted("c-A", 2025, "validation");
    markStepCompleted("c-A", 2025, "rechtsform");
    markStepCompleted("c-A", 2025, "validation"); // duplicate
    const loaded = loadWizard("c-A", 2025);
    expect(loaded?.completedSteps).toEqual(["validation", "rechtsform"]);
  });

  it("#7 updateStep aktualisiert updated_at", async () => {
    const first = updateStep("c-A", 2025, { currentStep: "validation" });
    await new Promise((r) => setTimeout(r, 5));
    const second = updateStep("c-A", 2025, { currentStep: "rechtsform" });
    expect(second.updated_at).not.toBe(first.updated_at);
    expect(second.created_at).toBe(first.created_at); // created_at bleibt
  });

  it("#8 null-MandantId wirft konsistent", () => {
    expect(() => loadWizard(null, 2025)).toThrow(/Mandant/);
    expect(() => saveWizard({ ...makeState("c-A", 2025), mandantId: "" } as WizardState)).toThrow(/Mandant/);
    expect(() => clearWizard(null, 2025)).toThrow(/Mandant/);
    expect(() => updateStep(null, 2025, {})).toThrow(/Mandant/);
  });
});
