import React from "react";

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function WizardProgressBar({ currentStep, totalSteps, labels }: WizardProgressBarProps) {
  return (
    <div className="wizard-progress">
      <div className="wizard-progress__steps">
        {labels.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          const circleClass = isDone
            ? "wizard-progress__circle wizard-progress__circle--done"
            : isActive
            ? "wizard-progress__circle wizard-progress__circle--active"
            : "wizard-progress__circle";
          const labelClass = isActive
            ? "wizard-progress__label wizard-progress__label--active"
            : "wizard-progress__label";
          return (
            <div key={stepNum} className="wizard-progress__step">
              <div className={circleClass}>{isDone ? "✓" : stepNum}</div>
              <span className={labelClass}>{label}</span>
            </div>
          );
        })}
      </div>
      <div className="wizard-progress__bar">
        <div
          className="wizard-progress__fill"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
