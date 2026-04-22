import type {
  WizardState,
  WizardStep,
} from "../../domain/jahresabschluss/WizardTypes";

export type StepProps = {
  state: WizardState;
  mandantId: string;
  jahr: number;
  onAdvance: (next: WizardStep) => void;
  onRefresh: () => void;
};
