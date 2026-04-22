/** @jsxImportSource react */
// Jahresabschluss-E2 / Schritt 3 · WizardStepper-Tests.

import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WizardStepper, type StepDef } from "../ui/WizardStepper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const STEPS: StepDef<"a" | "b" | "c">[] = [
  { id: "a", label: "Step A" },
  { id: "b", label: "Step B" },
  { id: "c", label: "Step C" },
];

function render(
  props: Parameters<typeof WizardStepper<"a" | "b" | "c">>[0]
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(<WizardStepper {...props} />);
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("WizardStepper", () => {
  it("#1 rendert 3 Schritte mit aria-current auf dem aktuellen", () => {
    const r = render({
      steps: STEPS,
      currentStep: "b",
      completedSteps: ["a"],
    });
    const current = document.querySelector('[aria-current="step"]');
    expect(current?.getAttribute("data-testid")).toBe("wizard-step-b");
    r.unmount();
  });

  it("#2 Current-Step hat data-step-status='current', completed='done', pending='pending'", () => {
    const r = render({
      steps: STEPS,
      currentStep: "b",
      completedSteps: ["a"],
    });
    expect(
      document.querySelector('[data-testid="wizard-step-a"]')?.getAttribute(
        "data-step-status"
      )
    ).toBe("done");
    expect(
      document.querySelector('[data-testid="wizard-step-b"]')?.getAttribute(
        "data-step-status"
      )
    ).toBe("current");
    expect(
      document.querySelector('[data-testid="wizard-step-c"]')?.getAttribute(
        "data-step-status"
      )
    ).toBe("pending");
    r.unmount();
  });

  it("#3 Navigation-Lock: Klick auf pending-Step triggert NICHT onNavigate", () => {
    const onNav = vi.fn();
    const r = render({
      steps: STEPS,
      currentStep: "b",
      completedSteps: ["a"],
      onNavigate: onNav,
    });
    const btnC = document.querySelector<HTMLButtonElement>(
      '[data-testid="wizard-step-c"]'
    )!;
    expect(btnC.disabled).toBe(true);
    act(() => btnC.click());
    expect(onNav).not.toHaveBeenCalled();
    r.unmount();
  });

  it("#4 Klick auf completed Step triggert onNavigate", () => {
    const onNav = vi.fn();
    const r = render({
      steps: STEPS,
      currentStep: "b",
      completedSteps: ["a"],
      onNavigate: onNav,
    });
    const btnA = document.querySelector<HTMLButtonElement>(
      '[data-testid="wizard-step-a"]'
    )!;
    expect(btnA.disabled).toBe(false);
    act(() => btnA.click());
    expect(onNav).toHaveBeenCalledWith("a");
    r.unmount();
  });
});
