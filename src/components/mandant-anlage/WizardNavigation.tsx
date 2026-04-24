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
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Abbrechen
      </button>
      <div className="flex gap-2">
        {!isFirst && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Zurück
          </button>
        )}
        {!isLast ? (
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Weiter
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Speichert…" : "Mandant anlegen"}
          </button>
        )}
      </div>
    </div>
  );
}
