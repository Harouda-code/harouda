// Aufbewahrungsfristen nach § 147 AO.
//
// Stand 2025: Das Wachstumschancengesetz verkürzt die Aufbewahrungsfrist für
// Buchungsbelege (Rechnungen, Quittungen, Kontoauszüge) von 10 auf 8 Jahre.
// Bücher, Jahresabschlüsse, Inventare usw. bleiben bei 10 Jahren.
// Handelsbriefe: 6 Jahre. Fristbeginn ist das Ende des Kalenderjahres,
// in dem das Dokument zuletzt bearbeitet / empfangen / erstellt wurde.

export type RetentionCategory =
  | "buecher"
  | "jahresabschluss"
  | "buchungsbeleg"
  | "handelsbrief"
  | "sonstige"
  | "cookie_consent";

export type RetentionRule = {
  category: RetentionCategory;
  label: string;
  years: number;
  legalBasis: string;
  examples: string;
};

export const RETENTION_RULES: RetentionRule[] = [
  {
    category: "buecher",
    label: "Bücher und Aufzeichnungen",
    years: 10,
    legalBasis: "§ 147 Abs. 3 AO",
    examples:
      "Bücher, Inventare, Arbeitsanweisungen, Organisationsunterlagen",
  },
  {
    category: "jahresabschluss",
    label: "Jahresabschlüsse",
    years: 10,
    legalBasis: "§ 147 Abs. 3 AO",
    examples:
      "Handels- und Steuerbilanzen, Lageberichte, Eröffnungsbilanzen, GuV",
  },
  {
    category: "buchungsbeleg",
    label: "Buchungsbelege",
    years: 8,
    legalBasis:
      "§ 147 Abs. 3 AO (verkürzt durch Wachstumschancengesetz, gültig ab 1.1.2025)",
    examples:
      "Rechnungen, Quittungen, Kontoauszüge, Lieferscheine, Kassenberichte",
  },
  {
    category: "handelsbrief",
    label: "Handelsbriefe",
    years: 6,
    legalBasis: "§ 147 Abs. 3 AO",
    examples:
      "Empfangene und Doppel abgesandter Handels- und Geschäftsbriefe",
  },
  {
    category: "sonstige",
    label: "Sonstige steuerrelevante Unterlagen",
    years: 6,
    legalBasis: "§ 147 Abs. 3 AO",
    examples: "Kalkulationen, Auftragsbestätigungen, Gutschriften",
  },
  {
    category: "cookie_consent",
    label: "Cookie-Einwilligungen (Nachweise)",
    years: 3,
    legalBasis: "TTDSG § 25 i.V.m. DSGVO Art. 7 Abs. 1 (Nachweisbarkeit)",
    examples:
      "Einwilligungs- und Widerrufsprotokolle aus dem Cookie-Banner",
  },
];

const RULE_BY_CAT = new Map(RETENTION_RULES.map((r) => [r.category, r]));

export function ruleFor(category: RetentionCategory): RetentionRule {
  return RULE_BY_CAT.get(category) ?? RETENTION_RULES[RETENTION_RULES.length - 1];
}

/**
 * End-of-year anchor: for § 147 the period begins on 31.12. of the year of
 * creation, not the creation date itself.
 */
function yearEnd(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59);
}

export function retentionEndsAt(
  createdIso: string,
  category: RetentionCategory
): Date {
  const rule = ruleFor(category);
  const start = yearEnd(createdIso);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + rule.years);
  return end;
}

export type RetentionStatus = "expired" | "due-30d" | "due-90d" | "due-1y" | "ok";

export function retentionStatus(
  createdIso: string,
  category: RetentionCategory,
  now: Date = new Date()
): { ends: Date; status: RetentionStatus; daysLeft: number } {
  const ends = retentionEndsAt(createdIso, category);
  const ms = ends.getTime() - now.getTime();
  const daysLeft = Math.ceil(ms / (1000 * 60 * 60 * 24));
  let status: RetentionStatus;
  if (daysLeft < 0) status = "expired";
  else if (daysLeft <= 30) status = "due-30d";
  else if (daysLeft <= 90) status = "due-90d";
  else if (daysLeft <= 365) status = "due-1y";
  else status = "ok";
  return { ends, status, daysLeft };
}

export type CanDeleteDecision =
  | { allowed: true }
  | { allowed: false; reason: string; retainedUntil: Date };

/**
 * DSGVO-Löschanfrage (Art. 17) vs. Aufbewahrungspflicht (§ 147 AO).
 *
 * Gibt zurück, ob ein Datensatz der Kategorie `category` gelöscht werden
 * darf. Die steuerrechtliche Aufbewahrungspflicht überlagert das Recht auf
 * Löschung so lange, bis die Frist endet (BFH-Rechtsprechung, DSK-
 * Kurzpapier Nr. 11).
 *
 * Ist die Frist abgelaufen, darf gelöscht werden; ist sie noch aktiv, wird
 * `reason` + `retainedUntil` zurückgegeben, damit die UI dem User sauber
 * erklären kann, warum die Daten noch nicht gelöscht werden können.
 *
 * Wichtig: diese Funktion entscheidet NICHT über Anonymisierung — der
 * Hash-Chain-Konflikt der Journal-Einträge ist getrennt zu lösen.
 */
export function canDelete(
  category: RetentionCategory,
  createdIso: string,
  now: Date = new Date()
): CanDeleteDecision {
  const rule = ruleFor(category);
  const retainedUntil = retentionEndsAt(createdIso, category);
  if (now.getTime() > retainedUntil.getTime()) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: rule.legalBasis,
    retainedUntil,
  };
}
