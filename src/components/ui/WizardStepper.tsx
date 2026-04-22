/**
 * Wizard-Stepper — generische Step-Navigations-Komponente.
 *
 * Jahresabschluss-E2 / Schritt 3. Keine externe Library — native HTML
 * + inline styles für Konsistenz mit den bestehenden ui/-Komponenten.
 *
 * A11y: `role="navigation"`, `aria-current="step"` auf aktivem Step.
 */
import { Check } from "lucide-react";

export type StepDef<K extends string = string> = {
  id: K;
  label: string;
};

export type WizardStepperProps<K extends string = string> = {
  steps: StepDef<K>[];
  currentStep: K;
  completedSteps: K[];
  /** Navigation darf nur zu bereits abgeschlossenen Schritten
   *  erfolgen (Rückwärts-Navigation für Korrekturen). */
  onNavigate?: (step: K) => void;
};

export function WizardStepper<K extends string>({
  steps,
  currentStep,
  completedSteps,
  onNavigate,
}: WizardStepperProps<K>) {
  const completedSet = new Set(completedSteps);
  return (
    <nav
      role="navigation"
      aria-label="Wizard-Schritte"
      data-testid="wizard-stepper"
      style={{
        display: "flex",
        gap: 0,
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid var(--border, #c3c8d1)",
        marginBottom: 16,
      }}
    >
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentStep;
        const isCompleted = completedSet.has(step.id);
        const canNavigate =
          !isCurrent && isCompleted && typeof onNavigate === "function";
        const circleColor = isCurrent
          ? "var(--navy, #15233d)"
          : isCompleted
            ? "var(--success, #1f7a4d)"
            : "var(--muted, #98a2b3)";
        const textColor = isCurrent
          ? "var(--navy, #15233d)"
          : isCompleted
            ? "var(--ink, #0f172a)"
            : "var(--muted, #98a2b3)";
        return (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", flex: 1 }}
          >
            <button
              type="button"
              onClick={canNavigate ? () => onNavigate!(step.id) : undefined}
              disabled={!canNavigate}
              aria-current={isCurrent ? "step" : undefined}
              data-testid={`wizard-step-${step.id}`}
              data-step-status={
                isCurrent ? "current" : isCompleted ? "done" : "pending"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                cursor: canNavigate ? "pointer" : "default",
                color: textColor,
                fontWeight: isCurrent ? 700 : 400,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${circleColor}`,
                  color: circleColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: "var(--ivory-100, #fff)",
                }}
              >
                {isCompleted ? <Check size={14} /> : idx + 1}
              </span>
              <span style={{ fontSize: "0.85rem" }}>{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: 2,
                  background: "var(--border, #c3c8d1)",
                  margin: "0 4px",
                }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
