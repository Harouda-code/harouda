/** @jsxImportSource react */
// Sprint 17.5 / Schritt 6 · StepErlaeuterungen-Tests.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StepErlaeuterungen } from "../StepErlaeuterungen";
import {
  loadWizard,
  updateStep,
} from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-erl-test";
const JAHR = 2025;

function baseState(): WizardState {
  return {
    sessionId: "sess",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "erlaeuterungen",
    completedSteps: ["validation", "rechtsform", "groessenklasse", "bausteine"],
    data: {},
    created_at: "2026-04-27T00:00:00Z",
    updated_at: "2026-04-27T00:00:00Z",
  };
}

function renderStep(state: WizardState, onAdvance = vi.fn()) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <StepErlaeuterungen
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

async function flush(times = 10) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  localStorage.clear();
  updateStep(MANDANT, JAHR, { currentStep: "erlaeuterungen" });
});

describe("StepErlaeuterungen", () => {
  it("#1 Default-State: aktiv=false, Editor NICHT gerendert", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="erlaeuterungen-aktiv-toggle"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="erlaeuterungen-phrases"]')
    ).toBeNull();
    r.unmount();
  });

  it("#2 Aktiv-Toggle: Editor + Phrasen-Leiste erscheinen", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    const toggle = document.querySelector<HTMLInputElement>(
      '[data-testid="erlaeuterungen-aktiv-toggle"]'
    )!;
    await act(async () => {
      toggle.click();
      await flush();
    });
    expect(
      document.querySelector('[data-testid="erlaeuterungen-phrases"]')
    ).not.toBeNull();
    // 4 Phrasen-Buttons.
    expect(
      document.querySelectorAll('[data-testid^="phrase-btn-"]')
    ).toHaveLength(4);
    // WizardState in localStorage zeigt aktiv=true.
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.data.erlaeuterungen?.aktiv).toBe(true);
    r.unmount();
  });

  it("#3 Phrasen-Button-Klick fuegt Text in den Editor-State ein + wordcount aktualisiert", async () => {
    const r = renderStep(baseState());
    await act(async () => {
      await flush();
    });
    const toggle = document.querySelector<HTMLInputElement>(
      '[data-testid="erlaeuterungen-aktiv-toggle"]'
    )!;
    await act(async () => {
      toggle.click();
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="phrase-btn-ausblick"]'
    )!;
    await act(async () => {
      btn.click();
      await flush();
    });
    const ws = loadWizard(MANDANT, JAHR)!;
    const text = JSON.stringify(ws.data.erlaeuterungen?.text);
    expect(text).toContain("Fuer das kommende Geschaeftsjahr");
    // Wordcount > 0.
    const wc = document.querySelector(
      '[data-testid="erlaeuterungen-wordcount"]'
    )!;
    expect(wc.textContent).toMatch(/\d+ Wörter/);
    expect(wc.textContent).not.toBe("0 Wörter");
    r.unmount();
  });

  it("#4 Save-Button markiert Step completed + onAdvance('review')", async () => {
    const onAdv = vi.fn();
    const r = renderStep(baseState(), onAdv);
    await act(async () => {
      await flush();
    });
    const save = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-erlaeuterungen-advance"]'
    )!;
    await act(async () => {
      save.click();
      await flush();
    });
    expect(onAdv).toHaveBeenCalledWith("review");
    const ws = loadWizard(MANDANT, JAHR)!;
    expect(ws.completedSteps).toContain("erlaeuterungen");
    r.unmount();
  });

  it("#5 Vorab-befuellter State: aktiv=true mit Doc → Editor rendert mit Inhalt", async () => {
    const initialState: WizardState = {
      ...baseState(),
      data: {
        erlaeuterungen: {
          aktiv: true,
          text: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Bestehender Text." }],
              },
            ],
          },
        },
      },
    };
    const r = renderStep(initialState);
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="erlaeuterungen-phrases"]')
    ).not.toBeNull();
    expect(document.body.textContent).toContain("Bestehender Text.");
    r.unmount();
  });
});
