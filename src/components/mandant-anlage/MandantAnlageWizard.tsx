import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { MandantAnlageData } from "../../domain/clients/mandantAnlageSchema";
import { WizardProgressBar } from "./WizardProgressBar";
import { WizardNavigation } from "./WizardNavigation";
import { Step1Grunddaten } from "./Step1Grunddaten";
import { Step2Anschrift } from "./Step2Anschrift";
import { Step3SteuerBank } from "./Step3SteuerBank";
import { Step4BuchhaltungLohn } from "./Step4BuchhaltungLohn";
import "./wizard.css";

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        if (currentStepRef.current === TOTAL_STEPS) {
          e.preventDefault();
          onFinal();
        }
        return;
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wizard-body">
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
