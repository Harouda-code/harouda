/**
 * E-Bilanz-Validator (§ 5b EStG).
 *
 * Prüft Stammdaten + Bilanz-/GuV-Konsistenz vor XBRL-Generierung.
 * Fehler blockieren die Erzeugung; Warnungen sind Hinweise.
 */

import { Money } from "../../lib/money/Money";
import type { BalanceSheetReport } from "../accounting/BalanceSheetBuilder";
import type { GuvReport } from "../accounting/GuvBuilder";
import type { Groessenklasse, Rechtsform, Status } from "./hgbTaxonomie68";

export type ValidationSeverity = "ERROR" | "WARNING";

export type ValidationEntry = {
  code: string;
  field: string;
  message: string;
  severity: ValidationSeverity;
};

export type EbilanzUnternehmen = {
  name: string;
  steuernummer: string;
  strasse: string;
  plz: string;
  ort: string;
  rechtsform: Rechtsform;
  groessenklasse: Groessenklasse;
};

export type EbilanzInput = {
  unternehmen: EbilanzUnternehmen;
  wirtschaftsjahr: { von: string; bis: string };
  bilanz: BalanceSheetReport;
  guv: GuvReport;
  status: Status;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationEntry[];
  warnings: ValidationEntry[];
};

const EPSILON = new Money("0.01");

/** Haupt-Validierungs-Funktion. */
export function validateEbilanz(input: EbilanzInput): ValidationResult {
  const errors: ValidationEntry[] = [];
  const warnings: ValidationEntry[] = [];

  // A. Pflichtfelder Stammdaten
  if (!input.unternehmen.steuernummer.trim()) {
    errors.push({
      code: "E001",
      field: "steuernummer",
      message: "Steuernummer ist Pflichtfeld (§ 5b EStG).",
      severity: "ERROR",
    });
  }
  if (!input.unternehmen.name.trim()) {
    errors.push({
      code: "E002",
      field: "name",
      message: "Firmenname ist Pflichtfeld.",
      severity: "ERROR",
    });
  }

  // B. Wirtschaftsjahr
  if (input.wirtschaftsjahr.von >= input.wirtschaftsjahr.bis) {
    errors.push({
      code: "E003",
      field: "wirtschaftsjahr",
      message: "Wirtschaftsjahr-Anfang muss vor Ende liegen.",
      severity: "ERROR",
    });
  }
  const vonYear = input.wirtschaftsjahr.von.slice(0, 4);
  const bisYear = input.wirtschaftsjahr.bis.slice(0, 4);
  if (Number(bisYear) - Number(vonYear) > 1) {
    warnings.push({
      code: "W004",
      field: "wirtschaftsjahr",
      message:
        "Wirtschaftsjahr umfasst mehr als 13 Monate — bitte Periodenwahl prüfen.",
      severity: "WARNING",
    });
  }

  // C. Bilanz-Gleichgewicht: Aktiva = Passiva
  const aktivaSum = new Money(input.bilanz.aktivaSum);
  const passivaSum = new Money(input.bilanz.passivaSum);
  const bilanzDiff = aktivaSum.minus(passivaSum).abs();
  if (bilanzDiff.greaterThan(EPSILON)) {
    errors.push({
      code: "E010",
      field: "bilanz",
      message: `Aktiva (${aktivaSum.toFixed2()} €) ≠ Passiva (${passivaSum.toFixed2()} €); Differenz ${bilanzDiff.toFixed2()} €.`,
      severity: "ERROR",
    });
  }

  // D. Bilanz ↔ GuV Cross-Check (Jahresergebnis)
  const bilanzResult = new Money(input.bilanz.provisionalResult);
  const guvResult = new Money(input.guv.jahresergebnis);
  const crossDiff = bilanzResult.minus(guvResult).abs();
  if (crossDiff.greaterThan(EPSILON)) {
    errors.push({
      code: "E020",
      field: "jahresergebnis",
      message: `Bilanz-Jahresergebnis (${bilanzResult.toFixed2()} €) weicht von GuV-Jahresergebnis (${guvResult.toFixed2()} €) ab.`,
      severity: "ERROR",
    });
  }

  // E. Währung
  // (Bilanz hat keine explizite Währungs-Property; wir nehmen EUR an —
  // andere Währung wäre eine Custom-Erweiterung außerhalb von § 5b EStG)

  // F. Größenklasse plausibel für Rechtsform
  if (
    input.unternehmen.rechtsform === "Einzelunternehmen" &&
    input.unternehmen.groessenklasse === "gross"
  ) {
    warnings.push({
      code: "W030",
      field: "groessenklasse",
      message:
        "Einzelunternehmen wird selten als 'gross' nach § 267 HGB klassifiziert — bitte prüfen.",
      severity: "WARNING",
    });
  }

  // G. Negative Anlagevermögen-Summe wäre ungewöhnlich
  if (aktivaSum.isNegative()) {
    errors.push({
      code: "E040",
      field: "aktiva",
      message: "Aktiva-Summe darf nicht negativ sein.",
      severity: "ERROR",
    });
  }

  // H. Zahlungsverkehr-Konten (Bank) negativ → Hinweis
  if (input.bilanz.unmappedAccounts.length > 0) {
    warnings.push({
      code: "W050",
      field: "unmappedAccounts",
      message: `${input.bilanz.unmappedAccounts.length} Konto/Konten nicht in Bilanz-Mapping — bitte Kontenrahmen prüfen.`,
      severity: "WARNING",
    });
  }

  // I. Status
  if (input.status === "Zurueckgezogen") {
    warnings.push({
      code: "W060",
      field: "status",
      message:
        "Status 'Zurueckgezogen' — die Meldung ersetzt einen früheren Datensatz; sie wird vom BZSt nicht weitergeleitet.",
      severity: "WARNING",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
