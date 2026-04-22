/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 4 · StepValidation-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { StepValidation } from "../StepValidation";
import * as validationModule from "../../../domain/accounting/ClosingValidation";
import { updateStep } from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import type { ClosingValidationReport } from "../../../domain/accounting/ClosingValidation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-val-test";
const JAHR = 2025;

function baseState(): WizardState {
  return {
    sessionId: "sess-1",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "validation",
    completedSteps: [],
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
      <MemoryRouter>
        <StepValidation
          state={state}
          mandantId={MANDANT}
          jahr={JAHR}
          onAdvance={onAdvance}
          onRefresh={() => {}}
        />
      </MemoryRouter>
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

beforeEach(() => {
  localStorage.clear();
  updateStep(MANDANT, JAHR, { currentStep: "validation" });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("StepValidation", () => {
  it("#1 Happy-Path: keine Findings → Weiter aktiv nach Pruefung", async () => {
    vi.spyOn(validationModule, "validateYearEnd").mockResolvedValue({
      mandant_id: MANDANT,
      jahr: JAHR,
      stichtag: "2025-12-31",
      findings: [],
      darf_jahresabschluss_erstellen: true,
    } satisfies ClosingValidationReport);

    const r = renderStep(baseState());
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-validation"]')!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    const advance = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-advance-validation"]'
    );
    expect(advance).not.toBeNull();
    expect(advance!.disabled).toBe(false);
    r.unmount();
  });

  it("#2 Error-Finding: Weiter-Button disabled", async () => {
    vi.spyOn(validationModule, "validateYearEnd").mockResolvedValue({
      mandant_id: MANDANT,
      jahr: JAHR,
      stichtag: "2025-12-31",
      findings: [
        {
          severity: "error",
          code: "CLOSING_RECHTSFORM_MISSING",
          message_de: "Rechtsform fehlt.",
        },
      ],
      darf_jahresabschluss_erstellen: false,
    });

    const r = renderStep(baseState());
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-validation"]')!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    const advance = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-advance-validation"]'
    );
    expect(advance!.disabled).toBe(true);
    r.unmount();
  });

  it("#3 Warning-Only: Weiter erst nach Bestaetigungs-Checkbox", async () => {
    vi.spyOn(validationModule, "validateYearEnd").mockResolvedValue({
      mandant_id: MANDANT,
      jahr: JAHR,
      stichtag: "2025-12-31",
      findings: [
        {
          severity: "warning",
          code: "CLOSING_DRAFTS_OPEN",
          message_de: "2 Entwürfe offen.",
        },
      ],
      darf_jahresabschluss_erstellen: true,
    });

    const r = renderStep(baseState());
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-validation"]')!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    const advance = () =>
      document.querySelector<HTMLButtonElement>(
        '[data-testid="btn-advance-validation"]'
      )!;
    expect(advance().disabled).toBe(true);
    // Checkbox aktivieren.
    const confirm = document.querySelector<HTMLInputElement>(
      '[data-testid="warnings-confirm"]'
    )!;
    act(() => confirm.click());
    expect(advance().disabled).toBe(false);
    r.unmount();
  });

  it("#4 Bank-Recon-Link erscheint bei CLOSING_BANK_RECON_NOT_AUTOMATED", async () => {
    vi.spyOn(validationModule, "validateYearEnd").mockResolvedValue({
      mandant_id: MANDANT,
      jahr: JAHR,
      stichtag: "2025-12-31",
      findings: [
        {
          severity: "warning",
          code: "CLOSING_BANK_RECON_NOT_AUTOMATED",
          message_de: "Bank-Reconciliation manuell prüfen.",
        },
      ],
      darf_jahresabschluss_erstellen: true,
    });

    const r = renderStep(baseState());
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-validation"]')!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    const link = document.querySelector('[data-testid="bank-recon-link"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("/bank-reconciliation");
    r.unmount();
  });
});
