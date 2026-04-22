import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Wallet,
  Globe,
  Shield,
  Receipt,
  Users,
  Home,
} from "lucide-react";

export type FormCategoryId =
  | "hauptvordrucke"
  | "einkuenfte"
  | "auslandsbezug"
  | "vorsorge"
  | "abzuege"
  | "familie"
  | "immobilien"
  | "sonstige";

export type FormCategory = {
  id: FormCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  order: number;
};

export const FORM_CATEGORIES: Record<FormCategoryId, FormCategory> = {
  hauptvordrucke: {
    id: "hauptvordrucke",
    label: "Hauptvordrucke",
    description: "Mantelbögen der Einkommensteuererklärung",
    icon: FileText,
    order: 1,
  },
  einkuenfte: {
    id: "einkuenfte",
    label: "Einkünfte",
    description: "Alle Einkunftsarten (§§ 13–22 EStG)",
    icon: Wallet,
    order: 2,
  },
  auslandsbezug: {
    id: "auslandsbezug",
    label: "Auslandsbezug",
    description: "Grenzüberschreitende Sachverhalte (DBA, ATE, AStG)",
    icon: Globe,
    order: 3,
  },
  vorsorge: {
    id: "vorsorge",
    label: "Vorsorge & Altersvorsorge",
    description: "Riester, Rürup, Versicherungen (§ 10 Abs. 1 Nr. 2/3/3a)",
    icon: Shield,
    order: 4,
  },
  abzuege: {
    id: "abzuege",
    label: "Sonderausgaben & Belastungen",
    description: "Abzugsfähige Aufwendungen (§§ 10, 10b, 33, 33a, 33b, 35a)",
    icon: Receipt,
    order: 5,
  },
  familie: {
    id: "familie",
    label: "Familie & Kinder",
    description: "Kinder, Unterhalt, Mobilitätsprämie",
    icon: Users,
    order: 6,
  },
  immobilien: {
    id: "immobilien",
    label: "Immobilien & Energie",
    description: "Vermietung, energetische Maßnahmen (§ 21, § 35c)",
    icon: Home,
    order: 7,
  },
  sonstige: {
    id: "sonstige",
    label: "Sonstige",
    description: "UStVA, EÜR, weitere Steuerformulare",
    icon: FileText,
    order: 8,
  },
};

/** Map jedes Form-Routen-Targets auf die primäre Kategorie. Schlüssel ist
 *  der URL-Pfad ohne führendes /steuer (z. B. "anlage-n", "est-1a",
 *  "ustva"). Damit bleibt das Mapping unabhängig von FormId-Strings. */
export const FORM_PATH_TO_CATEGORY: Record<string, FormCategoryId> = {
  // Hauptvordrucke
  "est-1a": "hauptvordrucke",
  "est-1c": "hauptvordrucke",

  // Einkünfte
  "anlage-n": "einkuenfte",
  "anlage-s": "einkuenfte",
  "anlage-g": "einkuenfte",
  "anlage-v": "einkuenfte",
  "anlage-so": "einkuenfte",
  "anlage-r": "einkuenfte",
  "anlage-rav-bav": "einkuenfte",
  "anlage-kap": "einkuenfte",

  // Auslandsbezug
  "anlage-aus": "auslandsbezug",
  "anlage-n-aus": "auslandsbezug",

  // Vorsorge
  "anlage-vorsorge": "vorsorge",
  "anlage-av": "vorsorge",

  // Sonderausgaben & Belastungen
  "anlage-sonder": "abzuege",
  "anlage-agb": "abzuege",
  "anlage-haa": "abzuege",
  "anlage-unterhalt": "abzuege",
  "anlage-u": "abzuege",
  "anlage-n-dhf": "abzuege",

  // Familie
  "anlage-kind": "familie",
  "anlage-mobility": "familie",

  // Immobilien & Energie
  "anlage-v-sonstige": "immobilien",
  "anlage-v-fewo": "immobilien",
  "anlage-em": "immobilien",

  // Sonstige (UStVA, EÜR, GewSt, KSt, sonstige Steuerformular-Einstiege)
  ustva: "sonstige",
  euer: "sonstige",
  gewerbesteuer: "sonstige",
  kst: "sonstige",
  "anlage-aus-kind": "familie",
  "anlage-vorsorge-alt": "vorsorge",
};

/** Cross-Listing: Forms die zusätzlich unter weiteren Kategorien auftauchen
 *  sollen (z. B. Anlage N-AUS primär Auslandsbezug, aber auch in Einkünfte
 *  erwähnenswert). */
export const FORM_SECONDARY_CATEGORIES: Record<string, FormCategoryId[]> = {
  "anlage-n-aus": ["einkuenfte"],
  "anlage-n-dhf": ["einkuenfte"],
  "anlage-u": ["familie"],
  "anlage-unterhalt": ["familie"],
  "anlage-v-sonstige": ["einkuenfte"],
  "anlage-v-fewo": ["einkuenfte"],
  "anlage-mobility": ["abzuege"],
};

export function categoryForPath(path: string): FormCategoryId {
  // strip leading slashes and "/steuer/"
  const clean = path.replace(/^\/+steuer\/+/, "").replace(/^\/+/, "");
  return FORM_PATH_TO_CATEGORY[clean] ?? "sonstige";
}

export function secondaryCategoriesForPath(path: string): FormCategoryId[] {
  const clean = path.replace(/^\/+steuer\/+/, "").replace(/^\/+/, "");
  return FORM_SECONDARY_CATEGORIES[clean] ?? [];
}
