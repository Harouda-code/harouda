/**
 * Jahresabschluss-Wizard Page (E2 / Schritt 3).
 *
 * Route: `/jahresabschluss/wizard?mandantId=<uuid>&jahr=<yyyy>`
 * Guard: MandantRequiredGuard.
 *
 * Step-Navigation ist internes useState (nicht URL), weil Schritte
 * strikt sequenziell und State-koppelnd sind.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import {
  WizardStepper,
  type StepDef,
} from "../components/ui/WizardStepper";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import {
  loadWizard,
  updateStep,
} from "../domain/jahresabschluss/wizardStore";
import type {
  WizardState,
  WizardStep,
} from "../domain/jahresabschluss/WizardTypes";
import { StepValidation } from "./jahresabschluss/StepValidation";
import { StepRechtsform } from "./jahresabschluss/StepRechtsform";
import { StepGroessenklasse } from "./jahresabschluss/StepGroessenklasse";
import { StepBausteine } from "./jahresabschluss/StepBausteine";
import { StepErlaeuterungen } from "./jahresabschluss/StepErlaeuterungen";
import { StepReview } from "./jahresabschluss/StepReview";
import { StepBescheinigung } from "./jahresabschluss/StepBescheinigung";
import "./ReportView.css";

const STEP_DEFS: StepDef<WizardStep>[] = [
  { id: "validation", label: "1. Pre-Closing-Prüfung" },
  { id: "rechtsform", label: "2. Rechtsform + Stammdaten" },
  { id: "groessenklasse", label: "3. Größenklasse" },
  { id: "bausteine", label: "4. Bausteine" },
  { id: "erlaeuterungen", label: "5. Erläuterungen" },
  { id: "review", label: "6. Zusammenfassung" },
  { id: "bescheinigung", label: "7. Bescheinigung" },
];

export default function JahresabschlussWizardPage() {
  return (
    <MandantRequiredGuard>
      <WizardInner />
    </MandantRequiredGuard>
  );
}

function WizardInner() {
  const { selectedMandantId } = useMandant();
  const { selectedYear } = useYear();
  const [state, setState] = useState<WizardState | null>(() =>
    selectedMandantId
      ? loadWizard(selectedMandantId, selectedYear)
      : null
  );

  // Initialisiere Session bei erstem Mount, falls noch keine vorhanden.
  useEffect(() => {
    if (!selectedMandantId) return;
    if (state) return;
    const next = updateStep(selectedMandantId, selectedYear, {
      currentStep: "validation",
    });
    setState(next);
  }, [selectedMandantId, selectedYear, state]);

  const goTo = useCallback(
    (step: WizardStep) => {
      if (!selectedMandantId) return;
      const next = updateStep(selectedMandantId, selectedYear, {
        currentStep: step,
      });
      setState(next);
    },
    [selectedMandantId, selectedYear]
  );

  const refresh = useCallback(() => {
    if (!selectedMandantId) return;
    setState(loadWizard(selectedMandantId, selectedYear));
  }, [selectedMandantId, selectedYear]);

  const body = useMemo(() => {
    if (!state || !selectedMandantId) {
      return <p data-testid="wizard-loading">Lade Wizard-Zustand …</p>;
    }
    const stepProps = {
      state,
      mandantId: selectedMandantId,
      jahr: selectedYear,
      onAdvance: (next: WizardStep) => goTo(next),
      onRefresh: refresh,
    };
    switch (state.currentStep) {
      case "validation":
        return <StepValidation {...stepProps} />;
      case "rechtsform":
        return <StepRechtsform {...stepProps} />;
      case "groessenklasse":
        return <StepGroessenklasse {...stepProps} />;
      case "bausteine":
        return <StepBausteine {...stepProps} />;
      case "erlaeuterungen":
        return <StepErlaeuterungen {...stepProps} />;
      case "review":
        return <StepReview {...stepProps} />;
      case "bescheinigung":
        return <StepBescheinigung {...stepProps} />;
    }
  }, [state, selectedMandantId, selectedYear, goTo, refresh]);

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} />
          Zurück
        </Link>
        <div className="report__head-title">
          <h1>Jahresabschluss-Wizard</h1>
          <p>
            Mandant: {selectedMandantId ?? "—"} · Jahr: {selectedYear}
          </p>
        </div>
      </header>

      {state && (
        <WizardStepper
          steps={STEP_DEFS}
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          onNavigate={goTo}
        />
      )}

      <main data-testid="wizard-main">{body}</main>
    </div>
  );
}
