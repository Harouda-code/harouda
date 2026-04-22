/**
 * Wizard-State-Store (localStorage-basiert, analog estStorage V3).
 *
 * Key-Schema: `harouda:wizard:<mandantId>:<jahr>`.
 * Eine Wizard-Session pro (Mandant, Jahr) — laufende Konfiguration
 * überlebt Page-Reloads; bei Abbruch kann der Nutzer später weiter-
 * machen.
 */

import type { WizardState, WizardStep } from "./WizardTypes";

const KEY_PREFIX = "harouda:wizard";

function assertMandant(mandantId: string | null): asserts mandantId is string {
  if (!mandantId) {
    throw new Error(
      "Wizard-State benötigt einen aktiven Mandanten. Bitte erst einen Mandanten auswählen."
    );
  }
}

function keyFor(mandantId: string, jahr: number): string {
  return `${KEY_PREFIX}:${mandantId}:${jahr}`;
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `wiz-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadWizard(
  mandantId: string | null,
  jahr: number
): WizardState | null {
  assertMandant(mandantId);
  try {
    const raw = localStorage.getItem(keyFor(mandantId, jahr));
    if (raw === null) return null;
    return JSON.parse(raw) as WizardState;
  } catch {
    return null;
  }
}

export function saveWizard(state: WizardState): void {
  assertMandant(state.mandantId);
  try {
    localStorage.setItem(
      keyFor(state.mandantId, state.jahr),
      JSON.stringify(state)
    );
  } catch {
    /* best-effort */
  }
}

export function clearWizard(
  mandantId: string | null,
  jahr: number
): void {
  assertMandant(mandantId);
  try {
    localStorage.removeItem(keyFor(mandantId, jahr));
  } catch {
    /* ignore */
  }
}

/** Partial-Update: bewahrt alle nicht-überschriebenen Felder. */
export function updateStep(
  mandantId: string | null,
  jahr: number,
  patch: Partial<Omit<WizardState, "sessionId" | "mandantId" | "jahr" | "created_at">>
): WizardState {
  assertMandant(mandantId);
  const current = loadWizard(mandantId, jahr);
  const now = new Date().toISOString();
  const next: WizardState = current
    ? {
        ...current,
        ...patch,
        data: { ...current.data, ...(patch.data ?? {}) },
        completedSteps: patch.completedSteps ?? current.completedSteps,
        updated_at: now,
      }
    : {
        sessionId: newSessionId(),
        mandantId,
        jahr,
        currentStep: patch.currentStep ?? "validation",
        completedSteps: patch.completedSteps ?? [],
        data: patch.data ?? {},
        created_at: now,
        updated_at: now,
      };
  saveWizard(next);
  return next;
}

export function markStepCompleted(
  mandantId: string | null,
  jahr: number,
  step: WizardStep
): WizardState {
  const current = loadWizard(mandantId, jahr);
  const set = new Set(current?.completedSteps ?? []);
  set.add(step);
  return updateStep(mandantId, jahr, {
    completedSteps: [...set],
  });
}
