/**
 * Beleg-Validierungs-Service — § 14 UStG Konformitätsprüfung + Balance-Check.
 *
 * Prüft Pflichtangaben einer Rechnung sowie die Konsistenz der erzeugten
 * Buchungspositionen (Soll = Haben).
 *
 * Rechtsgrundlage § 14 Abs. 4 UStG — Pflichtangaben auf Rechnung:
 *   1. Name und Anschrift des Leistenden
 *   2. Name und Anschrift des Leistungsempfängers (bei B2B)
 *   3. Steuernummer oder USt-IdNr des Leistenden
 *   4. Ausstellungsdatum
 *   5. Fortlaufende Rechnungsnummer
 *   6. Leistungsart + Menge
 *   7. Zeitpunkt der Leistung
 *   8. Entgelt (netto) + Steuerbetrag + Bruttosumme, USt-Satz
 *
 * Zusätzlich § 14a UStG bei IG-Lieferung (USt-IdNr Käufer Pflicht).
 * § 13b UStG bei Reverse Charge (Hinweis auf Umkehrung Steuerschuldnerschaft).
 *
 * Kassenbelege: erleichterte Anforderungen bis 250 € Brutto (§ 33 UStDV).
 */

import { Money } from "../../lib/money/Money";
import { sumMoney } from "../../lib/money/sum";
import { validateUstId } from "../../lib/validation/ustIdValidator";
import type { BelegEntry } from "./types";

export type BelegValidationSeverity = "ERROR" | "WARNING";

export type BelegValidationEntry = {
  code: string;
  field: string;
  message: string;
  severity: BelegValidationSeverity;
};

export type BelegValidationResult = {
  isValid: boolean;
  requiredFieldsComplete: boolean;
  sollEqualsHaben: boolean;
  bruttoMatchesNettoPlusUst: boolean;
  soll: Money;
  haben: Money;
  differenz: Money;
  errors: BelegValidationEntry[];
  warnings: BelegValidationEntry[];
};

const KLEINBETRAG_GRENZE = new Money("250.00");
const EPSILON = new Money("0.01");

function isEmpty(v: string | undefined | null): boolean {
  return v === undefined || v === null || v.trim() === "";
}

/** Kleinbetragsrechnung-Regel: bis 250 € brutto erleichterte Anforderungen. */
function isKleinbetrag(beleg: BelegEntry): boolean {
  if (!beleg.brutto) return false;
  return beleg.brutto.lessThan(KLEINBETRAG_GRENZE.plus(EPSILON));
}

export class BelegValidierungsService {
  validate(beleg: BelegEntry): BelegValidationResult {
    const errors: BelegValidationEntry[] = [];
    const warnings: BelegValidationEntry[] = [];

    // § 14 Abs. 4 Pflichtangaben
    this.validateRequiredFields(beleg, errors);

    // § 14a UStG IG-Lieferung → USt-IdNr Pflicht
    if (beleg.istIgLieferung) {
      if (isEmpty(beleg.partner.ustId)) {
        errors.push({
          code: "E010",
          field: "partner.ustId",
          message:
            "USt-IdNr des Leistungsempfängers ist bei IG-Lieferung Pflicht (§ 14a UStG).",
          severity: "ERROR",
        });
      } else {
        const v = validateUstId(beleg.partner.ustId!);
        if (!v.isValid) {
          errors.push({
            code: "E011",
            field: "partner.ustId",
            message: `USt-IdNr ungültig: ${v.errors.join("; ")}`,
            severity: "ERROR",
          });
        }
      }
    }

    // § 13b Reverse Charge: Hinweis-Flag gesetzt, aber keine eigene USt
    if (beleg.istReverseCharge) {
      if (beleg.steuerbetrag && beleg.steuerbetrag.isPositive()) {
        errors.push({
          code: "E020",
          field: "steuerbetrag",
          message:
            "Reverse Charge (§ 13b UStG): Rechnung darf keine Umsatzsteuer ausweisen — Steuerschuldnerschaft geht auf Leistungsempfänger über.",
          severity: "ERROR",
        });
      }
    }

    // Brutto = Netto + USt
    const bruttoMatches = this.validateBruttoNettoUst(beleg, errors);

    // Positionen-Balance (Soll = Haben)
    const { soll, haben, differenz, balanced } = this.balancePositionen(
      beleg,
      errors
    );

    // Warnings
    this.collectWarnings(beleg, warnings);

    return {
      isValid: errors.length === 0,
      requiredFieldsComplete: !errors.some((e) => e.code.startsWith("E00")),
      sollEqualsHaben: balanced,
      bruttoMatchesNettoPlusUst: bruttoMatches,
      soll,
      haben,
      differenz,
      errors,
      warnings,
    };
  }

  // ---------------- Required fields ----------------
  private validateRequiredFields(
    beleg: BelegEntry,
    errors: BelegValidationEntry[]
  ): void {
    if (isEmpty(beleg.belegnummer)) {
      errors.push({
        code: "E001",
        field: "belegnummer",
        message: "Belegnummer ist Pflicht (§ 14 Abs. 4 Nr. 4 UStG).",
        severity: "ERROR",
      });
    }
    if (isEmpty(beleg.belegdatum)) {
      errors.push({
        code: "E002",
        field: "belegdatum",
        message: "Belegdatum ist Pflicht (§ 14 Abs. 4 Nr. 3 UStG).",
        severity: "ERROR",
      });
    }
    if (isEmpty(beleg.beschreibung)) {
      errors.push({
        code: "E003",
        field: "beschreibung",
        message:
          "Leistungsbeschreibung ist Pflicht (§ 14 Abs. 4 Nr. 5 UStG).",
        severity: "ERROR",
      });
    }

    // Kleinbetragsrechnungen (< 250 €) brauchen keinen Partner-Namen bei Kassenbeleg
    if (!(beleg.belegart === "KASSENBELEG" && isKleinbetrag(beleg))) {
      if (isEmpty(beleg.partner.name)) {
        errors.push({
          code: "E004",
          field: "partner.name",
          message:
            "Name/Anschrift des Leistungserbringers bzw. -empfängers ist Pflicht (§ 14 Abs. 4 Nr. 1/2 UStG).",
          severity: "ERROR",
        });
      }
    }

    if (beleg.positionen.length === 0) {
      errors.push({
        code: "E005",
        field: "positionen",
        message: "Mindestens eine Buchungsposition erforderlich.",
        severity: "ERROR",
      });
    }
  }

  // ---------------- Brutto = Netto + USt ----------------
  private validateBruttoNettoUst(
    beleg: BelegEntry,
    errors: BelegValidationEntry[]
  ): boolean {
    if (!beleg.netto || !beleg.steuerbetrag || !beleg.brutto) {
      // Wenn Werte nicht alle gesetzt sind, kein Check (und auch kein Fehler
      // wenn nur Positionen gepflegt werden)
      return true;
    }
    const calculated = beleg.netto.plus(beleg.steuerbetrag);
    const diff = calculated.minus(beleg.brutto).abs();
    if (diff.greaterThan(EPSILON)) {
      errors.push({
        code: "E030",
        field: "brutto",
        message: `Brutto (${beleg.brutto.toFixed2()}) ≠ Netto (${beleg.netto.toFixed2()}) + USt (${beleg.steuerbetrag.toFixed2()}) — Differenz ${diff.toFixed2()}.`,
        severity: "ERROR",
      });
      return false;
    }
    return true;
  }

  // ---------------- Positionen-Balance ----------------
  private balancePositionen(
    beleg: BelegEntry,
    errors: BelegValidationEntry[]
  ): { soll: Money; haben: Money; differenz: Money; balanced: boolean } {
    const soll = sumMoney(
      beleg.positionen.filter((p) => p.side === "SOLL").map((p) => p.betrag)
    );
    const haben = sumMoney(
      beleg.positionen.filter((p) => p.side === "HABEN").map((p) => p.betrag)
    );
    const differenz = soll.minus(haben);
    const balanced = differenz.abs().lessThan(EPSILON);
    if (beleg.positionen.length > 0 && !balanced) {
      errors.push({
        code: "E040",
        field: "positionen",
        message: `Soll (${soll.toFixed2()}) ≠ Haben (${haben.toFixed2()}) — Differenz ${differenz.toFixed2()} €.`,
        severity: "ERROR",
      });
    }
    // Zero-sum (alle 0) → Fehler
    if (beleg.positionen.length > 0 && soll.isZero() && haben.isZero()) {
      errors.push({
        code: "E041",
        field: "positionen",
        message: "Buchung mit Null-Summen ist nicht erlaubt.",
        severity: "ERROR",
      });
    }
    return { soll, haben, differenz, balanced };
  }

  // ---------------- Warnings ----------------
  private collectWarnings(
    beleg: BelegEntry,
    warnings: BelegValidationEntry[]
  ): void {
    // Leistungsdatum nach Belegdatum — plausibilitätswidrig
    if (
      beleg.leistungsdatum &&
      beleg.belegdatum &&
      beleg.leistungsdatum > beleg.belegdatum
    ) {
      warnings.push({
        code: "W101",
        field: "leistungsdatum",
        message:
          "Leistungsdatum liegt NACH dem Belegdatum — bitte prüfen (sollte gleich oder vorher sein).",
        severity: "WARNING",
      });
    }

    // Skonto > 5 % → unüblich hoch
    if (beleg.zahlung?.skonto_prozent && beleg.zahlung.skonto_prozent > 5) {
      warnings.push({
        code: "W102",
        field: "zahlung.skonto_prozent",
        message: `Skonto ${beleg.zahlung.skonto_prozent} % ist branchenunüblich hoch (Standard 2-3 %).`,
        severity: "WARNING",
      });
    }

    // Sehr hoher Brutto-Betrag — Plausibilitätshinweis
    if (beleg.brutto && beleg.brutto.greaterThan(new Money("100000"))) {
      warnings.push({
        code: "W103",
        field: "brutto",
        message: `Hoher Bruttobetrag ${beleg.brutto.toEuroFormat()} — Freigabe durch Berater empfohlen.`,
        severity: "WARNING",
      });
    }

    // § 14a-Hinweis-Flag nur gesetzt wenn auch USt-IdNr vorhanden? (Doc-Hinweis)
    if (beleg.istIgLieferung && beleg.steuerbetrag && beleg.steuerbetrag.isPositive()) {
      warnings.push({
        code: "W104",
        field: "steuerbetrag",
        message:
          "IG-Lieferungen sind i. d. R. steuerfrei (§ 4 Nr. 1b UStG). USt-Betrag > 0 ungewöhnlich.",
        severity: "WARNING",
      });
    }

    // Sprint 7: Kontenwahl-Plausibilität bei RC / IG (WARNING, nicht ERROR —
    // Severity-Entscheidung 17 im SPRINT-7-PLAN-DETAIL.md; USt-ID-Pflicht
    // ist bereits als E010 ERROR abgebildet).
    this.collectRcIgKontoWarnings(beleg, warnings);
  }

  // ---------------- RC/IG Kontenwahl-Warnings (Sprint 7) ----------------
  private collectRcIgKontoWarnings(
    beleg: BelegEntry,
    warnings: BelegValidationEntry[]
  ): void {
    const kontoRange = (konto: string): number => {
      const n = Number(konto);
      return Number.isFinite(n) ? n : 0;
    };

    if (beleg.istReverseCharge) {
      const auffwandsPositionen = beleg.positionen.filter(
        (p) => p.side === "SOLL"
      );
      // W105: RC ohne Konto im 3100-3159-Bereich → falsches Aufwandskonto
      if (
        auffwandsPositionen.length > 0 &&
        !auffwandsPositionen.some((p) => {
          const n = kontoRange(p.konto);
          return n >= 3100 && n <= 3159;
        })
      ) {
        warnings.push({
          code: "W105",
          field: "positionen",
          message:
            "Reverse Charge (§ 13b UStG) erwartet ein Aufwandskonto im " +
            "SKR03-Bereich 3100-3159 (z. B. 3100/3120/3130) — " +
            "gewähltes Konto könnte die UStVA-Kennzahl-Zuordnung verfehlen.",
          severity: "WARNING",
        });
      }

      // W106: RC + Konto 3120-3129 (Bauleistung) aber Beschreibung
      // enthält nicht „Bau"
      const hatBaukonto = auffwandsPositionen.some((p) => {
        const n = kontoRange(p.konto);
        return n >= 3120 && n <= 3129;
      });
      if (
        hatBaukonto &&
        beleg.beschreibung &&
        !/bau/i.test(beleg.beschreibung)
      ) {
        warnings.push({
          code: "W106",
          field: "beschreibung",
          message:
            "Bauleistungs-Konto 3120-3129 gewählt, aber Beschreibung " +
            "enthält keinen Hinweis auf Bauleistung. Prüfen Sie " +
            "§ 13b Abs. 2 Nr. 2 UStG-Subsumtion.",
          severity: "WARNING",
        });
      }

      // W107: RC + Konto 3130-3139 (Gebäudereinigung) aber Beschreibung
      // enthält nicht „Reinigung" oder „Gebäude"
      const hatReinigungskonto = auffwandsPositionen.some((p) => {
        const n = kontoRange(p.konto);
        return n >= 3130 && n <= 3139;
      });
      if (
        hatReinigungskonto &&
        beleg.beschreibung &&
        !/(reinigung|gebäude)/i.test(beleg.beschreibung)
      ) {
        warnings.push({
          code: "W107",
          field: "beschreibung",
          message:
            "Gebäudereinigungs-Konto 3130-3139 gewählt, aber Beschreibung " +
            "enthält keinen Hinweis auf Reinigung / Gebäude. Prüfen Sie " +
            "§ 13b Abs. 2 Nr. 3 UStG-Subsumtion.",
          severity: "WARNING",
        });
      }
    }

    if (beleg.istIgLieferung) {
      // W108: IG-Lieferung aber kein Erlöskonto im 8120-8199-Bereich
      // (typisch 8125 = IG-Lieferung § 4 Nr. 1b)
      const erloeskontoPositionen = beleg.positionen.filter(
        (p) => p.side === "HABEN"
      );
      if (
        erloeskontoPositionen.length > 0 &&
        !erloeskontoPositionen.some((p) => {
          const n = kontoRange(p.konto);
          return n >= 8120 && n <= 8199;
        })
      ) {
        warnings.push({
          code: "W108",
          field: "positionen",
          message:
            "IG-Lieferung (§ 4 Nr. 1b UStG) erwartet ein Erlöskonto im " +
            "steuerfreien Bereich 8120-8199 (z. B. 8125 für IG-Lieferung). " +
            "Gewähltes Erlöskonto könnte zu unerwünschter Besteuerung führen.",
          severity: "WARNING",
        });
      }
    }
  }
}
