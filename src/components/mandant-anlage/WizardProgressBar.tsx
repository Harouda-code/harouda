import React from "react";

interface WizardProgressBarProps {
  currentStep: number; // 1-based
  totalSteps: number;
  labels: string[];
}

export function WizardProgressBar({ currentStep, totalSteps, labels }: WizardProgressBarProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {labels.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <div key={stepNum} className="flex flex-col items-center flex-1">
              <div
                className={
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium " +
                  (isDone ? "bg-green-600 text-white" : isActive ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600")
                }
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span className={"text-xs mt-1 text-center " + (isActive ? "font-semibold" : "text-gray-500")}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-full h-1 bg-gray-200 rounded">
        <div
          className="h-1 bg-blue-600 rounded transition-all"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
