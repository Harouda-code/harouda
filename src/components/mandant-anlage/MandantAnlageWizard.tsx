import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";
import { WizardProgressBar } from "./WizardProgressBar";
import { WizardNavigation } from "./WizardNavigation";
import { Step1Grunddaten } from "./Step1Grunddaten";
import { Step2Anschrift } from "./Step2Anschrift";
import { Step3SteuerBank } from "./Step3SteuerBank";
import { Step4BuchhaltungLohn } from "./Step4BuchhaltungLohn";

const STEP_LABELS = ["Grunddaten", "Anschrift", "Steuer & Bank", "Buchhaltung & Lohn"];
const TOTAL_STEPS = 4;

type StepFields = Record<number, Array<keyof MandantAnlageData>>;

const STEP_FIELDS: StepFields = {
  1: ["mandant_nr", "name", "rechtsform"],
  2: ["anschrift_strasse", "anschrift_hausnummer", "anschrift_plz", "anschrift_ort", "anschrift_land"],
  3: ["steuernummer", "ust_id", "iban", "finanzamt_name", "finanzamt_bufa_nr", "versteuerungsart", "kleinunternehmer_regelung", "ust_voranmeldung_zeitraum", "hrb_nummer", "hrb_gericht", "gezeichnetes_kapital"],
  4: ["kontenrahmen", "sachkontenlaenge", "gewinnermittlungsart", "wirtschaftsjahr_typ", "wirtschaftsjahr_beginn", "wirtschaftsjahr_ende", "betriebsnummer", "berufsgenossenschaft_name", "berufsgenossenschaft_mitgliedsnr", "kirchensteuer_erhebungsstelle"],
};

interface MandantAnlageWizardProps {
  onCancel: () => void;
  onSubmitFinal: (data: MandantAnlageData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function MandantAnlageWizard({ onCancel, onSubmitFinal, isSubmitting = false }: MandantAnlageWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { trigger, handleSubmit } = useFormContext<MandantAnlageData>();
  const currentStepRef = useRef(currentStep);

  // Keep ref in sync for keyboard handler closure.
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  async function handleNext() {
    const fields = STEP_FIELDS[currentStepRef.current];
    const valid = await trigger(fields as Array<keyof MandantAnlageData>);
    if (valid && currentStepRef.current < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStepRef.current > 1) setCurrentStep((s) => s - 1);
  }

  const onFinal = handleSubmit((data) => {
    onSubmitFinal(data);
  });

  // Keyboard shortcuts: Enter / Ctrl+Enter / Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      // Escape → cancel (works from anywhere)
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      // Ctrl/Cmd + Enter → submit (only on last step)
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        if (currentStepRef.current === TOTAL_STEPS) {
          e.preventDefault();
          onFinal();
        }
        return;
      }

      // Plain Enter inside <input> → trigger Next (not submit).
      // Skip textarea/select/button so native behaviour is preserved.
      if (e.key === "Enter" && tag === "input") {
        if (currentStepRef.current < TOTAL_STEPS) {
          e.preventDefault();
          void handleNext();
        }
        return;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // onCancel and onFinal are captured via closure; they're stable references
    // from the parent's component scope. Intentionally excluding from deps
    // to avoid re-binding the listener on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <WizardProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />

      <form onSubmit={onFinal}>
        {currentStep === 1 && <Step1Grunddaten />}
        {currentStep === 2 && <Step2Anschrift />}
        {currentStep === 3 && <Step3SteuerBank />}
        {currentStep === 4 && <Step4BuchhaltungLohn />}

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={onFinal}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
}
