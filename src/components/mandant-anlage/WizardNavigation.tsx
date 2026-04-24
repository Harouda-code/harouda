import React from "react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WizardNavigationProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="wizard-nav">
      <button type="button" onClick={onCancel} className="wizard-btn wizard-btn--cancel">
        Abbrechen
      </button>
      <div className="wizard-nav__right">
        {!isFirst && (
          <button type="button" onClick={onBack} className="wizard-btn wizard-btn--back">
            Zurück
          </button>
        )}
        {!isLast ? (
          <button type="button" onClick={onNext} className="wizard-btn wizard-btn--next">
            Weiter
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="wizard-btn wizard-btn--submit"
          >
            {isSubmitting ? "Speichert…" : "Mandant anlegen"}
          </button>
        )}
      </div>
    </div>
  );
}
