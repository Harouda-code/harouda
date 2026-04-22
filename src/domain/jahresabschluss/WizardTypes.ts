/**
 * Jahresabschluss-Wizard (E2) — Typen + Interfaces.
 *
 * Rechtsbasis: § 267 HGB (Größenklassen), § 264/284-288/289 HGB
 * (Anhang/Lagebericht-Pflichten), § 316 HGB (Prüfungspflicht).
 */

import type { ClosingValidationReport } from "../accounting/ClosingValidation";
import type { Hgb267Klassifikation } from "../accounting/HgbSizeClassifier";
import type { Rechtsform } from "../ebilanz/hgbTaxonomie68";
import type { Geschaeftsfuehrer } from "../../types/db";
import type { JSONContent } from "@tiptap/react";
import type { BescheinigungsTyp } from "./bstbk/bstbkBescheinigungen";
import type { BstbkPlaceholderValues } from "./bstbk/bstbkPlaceholders";

export type WizardStep =
  | "validation"
  | "rechtsform"
  | "groessenklasse"
  | "bausteine"
  | "erlaeuterungen"
  | "review"
  | "bescheinigung";

export const WIZARD_STEPS: WizardStep[] = [
  "validation",
  "rechtsform",
  "groessenklasse",
  "bausteine",
  "erlaeuterungen",
  "review",
  "bescheinigung",
];

export type WizardRechtsformData = {
  rechtsform: Rechtsform;
  hrb_nummer?: string;
  hrb_gericht?: string;
  gezeichnetes_kapital?: number;
  geschaeftsfuehrer?: Geschaeftsfuehrer[];
};

export type JahresabschlussBausteine = {
  deckblatt: true;
  inhaltsverzeichnis: true;
  bilanz: boolean;
  guv: boolean;
  euer: boolean;
  anlagenspiegel: boolean;
  anhang: boolean;
  lagebericht: boolean;
  bescheinigung: true;
  begruendungen: string[];
};

export type WizardErlaeuterungenData = {
  aktiv: boolean;
  text: JSONContent | null;
};

export type WizardBescheinigungData = {
  typ: BescheinigungsTyp;
  values: Partial<BstbkPlaceholderValues>;
  footer_sichtbar: boolean;
};

export type WizardState = {
  sessionId: string;
  mandantId: string;
  jahr: number;
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  data: {
    validation?: ClosingValidationReport;
    rechtsform?: WizardRechtsformData;
    groessenklasse?: Hgb267Klassifikation;
    bausteine?: JahresabschlussBausteine;
    erlaeuterungen?: WizardErlaeuterungenData;
    bescheinigung?: WizardBescheinigungData;
  };
  created_at: string;
  updated_at: string;
};
