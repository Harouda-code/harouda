/**
 * Zentraler Pre-Closing-Validator für den Jahresabschluss.
 *
 * Jahresabschluss-E1 / Schritt 7. Aggregiert alle Teil-Checks in einen
 * einzigen `ClosingValidationReport` mit Severity-Klassifikation.
 *
 * Rechtsbasis:
 *   - § 146 AO — Unveränderbarkeit
 *   - GoBD Rz. 58-60 — Festschreibung vor Steuererklärung
 *   - § 264 HGB — Jahresabschluss-Pflicht
 *   - § 267 HGB — Größenklassen (via HgbSizeClassifier)
 *
 * Severity-Stufen:
 *   - `error`   → darf_jahresabschluss_erstellen = false
 *   - `warning` → Hinweis, aber nicht blockierend
 *   - `info`    → rein informativ
 */

import { fetchClients } from "../../api/clients";
import { fetchAccounts } from "../../api/accounts";
import { fetchAllEntries } from "../../api/dashboard";
import { fetchEmployees } from "../../api/employees";
import { verifyJournalChain } from "../../utils/journalChain";
import { computeTrialBalance } from "./TrialBalance";
import { detectAfaLuecken } from "../anlagen/AfaCompletenessCheck";
import { detectLohnLuecken } from "../lohn/LohnCompletenessCheck";
import {
  detectBankReconciliationGaps,
  getBankReconStatusSummary,
  BANK_RECON_PENDING_ERROR_THRESHOLD_PCT,
} from "../banking/BankReconciliationGaps";
import { buildJahresabschluss } from "./FinancialStatements";

/**
 * § 241a HGB Schwellenwerte (Stand WachstumsChancenG, 01.01.2024).
 *   - Umsatz Vorjahr ≤ 800.000 €
 *   - Gewinn Vorjahr ≤ 80.000 €
 * Beide Kriterien muessen erfuellt sein.
 */
export const PARAG_241A_UMSATZ_SCHWELLE = 800_000;
export const PARAG_241A_GEWINN_SCHWELLE = 80_000;

/**
 * Platzhalter-Helper fuer die § 241a-Schaetzung. Aktuell konservativ
 * `null` — eine echte Vorjahres-Umsatz/-Gewinn-Ermittlung waere via
 * `buildGuv(vorjahr)` moeglich, wuerde aber den Validator-Aufruf
 * unnoetig teuer machen und ist fuer die Info-Warnung nicht kritisch.
 * Folge-Sprint-Kandidat.
 */
function report_try_estimate_umsatz(
  _mandantId: string | null,
  _jahr: number
): number | null {
  return null;
}
function report_try_estimate_gewinn(
  _mandantId: string | null,
  _jahr: number
): number | null {
  return null;
}

export type ClosingValidationSeverity = "error" | "warning" | "info";

export type ClosingValidationFinding = {
  severity: ClosingValidationSeverity;
  code: string;
  message_de: string;
  detail?: unknown;
};

export type ClosingValidationReport = {
  mandant_id: string | null;
  jahr: number;
  stichtag: string;
  findings: ClosingValidationFinding[];
  darf_jahresabschluss_erstellen: boolean;
};

export type ClosingValidationOptions = {
  mandantId: string | null;
  companyId: string;
  jahr: number;
  stichtag: string;
  employeesCount: number;
};

export async function validateYearEnd(
  options: ClosingValidationOptions
): Promise<ClosingValidationReport> {
  const findings: ClosingValidationFinding[] = [];
  const periodVon = `${options.jahr}-01-01`;

  // 1. Rechtsform-Check (blockierend).
  try {
    const clients = await fetchClients();
    const client = clients.find((c) => c.id === options.mandantId);
    if (client && !client.rechtsform) {
      findings.push({
        severity: "error",
        code: "CLOSING_RECHTSFORM_MISSING",
        message_de:
          "Rechtsform des Mandanten ist nicht gesetzt. Bitte in den Stammdaten ergänzen, bevor der Jahresabschluss erstellt wird.",
        detail: { client_id: client.id, client_name: client.name },
      });
    }
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_CLIENTS_FETCH_FAILED",
      message_de: `Stammdaten konnten nicht geladen werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // 2. Hash-Chain-Check.
  try {
    const allEntries = await fetchAllEntries();
    const mandantEntries = allEntries.filter(
      (e) => options.mandantId === null || e.client_id === options.mandantId
    );
    const chainResult = await verifyJournalChain(mandantEntries);
    if (!chainResult.ok) {
      findings.push({
        severity: "error",
        code: "CLOSING_HASH_CHAIN_BROKEN",
        message_de: `Hash-Kette ist gebrochen: ${chainResult.message}`,
        detail: chainResult,
      });
    }

    // 3. Trial-Balance.
    const tb = computeTrialBalance(mandantEntries, {
      von: periodVon,
      bis: options.stichtag,
    });
    if (!tb.ist_ausgeglichen) {
      findings.push({
        severity: "error",
        code: "CLOSING_TRIAL_BALANCE_UNBALANCED",
        message_de: `Trial-Balance nicht ausgeglichen: Soll ${tb.total_soll} ≠ Haben ${tb.total_haben} (Differenz ${tb.differenz}).`,
        detail: tb,
      });
    }

    // 4. Draft-Count.
    const drafts = mandantEntries.filter(
      (e) =>
        e.status === "entwurf" &&
        e.datum >= periodVon &&
        e.datum <= options.stichtag
    );
    if (drafts.length > 0) {
      findings.push({
        severity: "warning",
        code: "CLOSING_DRAFTS_OPEN",
        message_de: `${drafts.length} ${
          drafts.length === 1 ? "Entwurfs-Buchung" : "Entwurfs-Buchungen"
        } im Zeitraum nicht festgeschrieben.`,
        detail: { count: drafts.length },
      });
    }

    // 8. Bilanz↔GuV-Cross-Check.
    try {
      const accounts = await fetchAccounts();
      const statements = buildJahresabschluss(accounts, mandantEntries, {
        periodStart: periodVon,
        stichtag: options.stichtag,
      });
      if (!statements.crossCheck.matches) {
        findings.push({
          severity: "error",
          code: "CLOSING_BILANZ_GUV_MISMATCH",
          message_de: `Bilanz ↔ GuV-Cross-Check schlägt fehl: Bilanz-Ergebnis ${statements.crossCheck.bilanzProvisionalResult} ≠ GuV-Ergebnis ${statements.crossCheck.guvJahresergebnis} (Differenz ${statements.crossCheck.difference}).`,
          detail: statements.crossCheck,
        });
      }
    } catch (err) {
      findings.push({
        severity: "warning",
        code: "CLOSING_BILANZ_GUV_CHECK_FAILED",
        message_de: `Bilanz/GuV-Cross-Check konnte nicht ausgeführt werden: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_ENTRIES_FETCH_FAILED",
      message_de: `Journal konnte nicht geladen werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // 5. AfA-Lücken.
  try {
    const afaLuecken = await detectAfaLuecken(
      options.mandantId,
      options.companyId,
      options.jahr
    );
    for (const l of afaLuecken) {
      findings.push({
        severity: "warning",
        code: "CLOSING_AFA_MISSING",
        message_de: `AfA-Lücke für Anlage ${l.inventar_nr} (${l.bezeichnung}): Differenz ${l.differenz} € zwischen erwarteter (${l.erwartete_afa_fuer_jahr}) und gebuchter AfA (${l.gebuchte_afa_fuer_jahr}).`,
        detail: l,
      });
    }
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_AFA_CHECK_FAILED",
      message_de: `AfA-Vollständigkeits-Check konnte nicht ausgeführt werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // 6. Lohn-Lücken.
  try {
    const lohnLuecken = await detectLohnLuecken(
      options.mandantId,
      options.companyId,
      options.jahr
    );
    for (const l of lohnLuecken) {
      findings.push({
        severity: "warning",
        code: "CLOSING_PAYROLL_MISSING",
        message_de: `Lohnabrechnungs-Lücke in ${l.jahr}-${String(l.monat).padStart(
          2,
          "0"
        )}: ${l.fehlende_abrechnungen_fuer_employee_ids.length} von ${l.employees_mit_vertrag} Mitarbeiter(n) ohne Abrechnung.`,
        detail: l,
      });
    }
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_PAYROLL_CHECK_FAILED",
      message_de: `Lohn-Vollständigkeits-Check konnte nicht ausgeführt werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // 7. Bank-Reconciliation-Gaps.
  try {
    const bankGaps = await detectBankReconciliationGaps(
      options.mandantId,
      options.companyId,
      options.jahr
    );
    for (const g of bankGaps) {
      findings.push({
        severity: "warning",
        code: "CLOSING_BANK_RECON_GAP",
        message_de: `Bank-Abgleichs-Lücke auf Konto ${g.bank_konto_nr}: ${g.ungematchte_journal_entries} ungematchte Journal-Einträge, ${g.ungematchte_bank_statement_zeilen} ungematchte Statement-Zeilen.`,
        detail: g,
      });
    }
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_BANK_RECON_FAILED",
      message_de: `Bank-Reconciliation-Check konnte nicht ausgeführt werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // 7b. Bank-Reconciliation-Status (seit Sprint 16 echt ausgewertet).
  // GoBD Rz. 45 — Vollstaendigkeit: jede Bank-Transaktion muss einer
  // Buchung zugeordnet sein oder ausdruecklich als "ignoriert" markiert
  // werden. Der Matcher berechnet den Anteil "pending_review" und
  // klassifiziert:
  //   - total==0  → wie bisher: Warn "nicht ausgewertet" (Fallback,
  //                 wenn der User die BankReconciliationPage noch nicht
  //                 genutzt hat).
  //   - pending>0 && pending_pct <= 5% → Warn mit pending-Count.
  //   - pending>0 && pending_pct > 5%  → Error (blockiert Abschluss).
  // Der 5%-Threshold ist konservativer Default — fuer spezifische
  // Mandanten-Situationen Ruecksprache mit Steuerberater empfohlen.
  try {
    const bankStatus = await getBankReconStatusSummary(options.mandantId);
    if (bankStatus.total === 0) {
      findings.push({
        severity: "warning",
        code: "CLOSING_BANK_RECON_NOT_AUTOMATED",
        message_de:
          "Bankkonten-Abstimmung nicht ausgewertet. Bitte in der Bank-" +
          "Reconciliation-Seite Kontoauszug importieren und Zeilen mit " +
          "Journal-Buchungen abgleichen (GoBD Rz. 45 Vollstaendigkeit).",
        detail: {
          page_hinweis: "/bank-reconciliation",
          manueller_check_erforderlich: true,
        },
      });
    } else if (bankStatus.pending > 0) {
      const pct = Math.round(bankStatus.pending_pct * 1000) / 10; // 1 NK
      if (bankStatus.exceeds_error_threshold) {
        findings.push({
          severity: "error",
          code: "CLOSING_BANK_RECON_INSUFFICIENT",
          message_de: `Bank-Abstimmung unvollstaendig: ${bankStatus.pending} von ${bankStatus.total} Bank-Transaktionen (${pct}%) sind noch ohne Zuordnung. Threshold: ${BANK_RECON_PENDING_ERROR_THRESHOLD_PCT * 100}% — Jahresabschluss blockiert.`,
          detail: {
            ...bankStatus,
            threshold_pct: BANK_RECON_PENDING_ERROR_THRESHOLD_PCT,
          },
        });
      } else {
        findings.push({
          severity: "warning",
          code: "CLOSING_BANK_RECON_PENDING",
          message_de: `${bankStatus.pending} von ${bankStatus.total} Bank-Transaktionen (${pct}%) sind noch keinem Journal-Eintrag zugeordnet.`,
          detail: bankStatus,
        });
      }
    }
    // else: bankStatus.total > 0 && pending === 0  → keine Finding.
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_BANK_RECON_STATUS_FAILED",
      message_de: `Bank-Reconciliation-Status konnte nicht ermittelt werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // 8. Inventur-Status (§ 240 HGB · Sprint 17).
  //   - Keine Session → warning (User hat noch nicht begonnen).
  //   - Session offen → error (Abschluss erst nach Inventur).
  //   - Session abgeschlossen/gebucht → ok.
  //   - Einzelunternehmen unter § 241a-Schwellenwerten → info (Befreiung
  //     moeglich, aber explizit beansprucht zu erfassen).
  try {
    const { getSessionForYear } = await import("../../api/inventur");
    const session = await getSessionForYear(
      options.mandantId ?? "",
      options.jahr
    );
    if (!session) {
      const umsatz = report_try_estimate_umsatz(options.mandantId, options.jahr);
      const gewinn = report_try_estimate_gewinn(options.mandantId, options.jahr);
      const clientsList = await fetchClients();
      const client = clientsList.find((c) => c.id === options.mandantId);
      const isEinzel = client?.rechtsform === "Einzelunternehmen";
      const unterSchwelle =
        umsatz !== null && gewinn !== null
          ? umsatz < PARAG_241A_UMSATZ_SCHWELLE &&
            gewinn < PARAG_241A_GEWINN_SCHWELLE
          : false;
      if (isEinzel && unterSchwelle) {
        findings.push({
          severity: "info",
          code: "CLOSING_INVENTUR_241A_ERLEICHTERUNG",
          message_de:
            `§ 241a HGB-Erleichterung moeglich (Umsatz < ${PARAG_241A_UMSATZ_SCHWELLE} €, ` +
            `Gewinn < ${PARAG_241A_GEWINN_SCHWELLE} €). Inventur-Pflicht kann entfallen — bitte mit Steuerberater pruefen.`,
        });
      } else {
        findings.push({
          severity: "warning",
          code: "CLOSING_INVENTUR_MISSING",
          message_de:
            `Keine Inventur-Session fuer ${options.jahr} vorhanden. ` +
            "Bitte unter /inventur eroeffnen (§ 240 HGB).",
          detail: { page_hinweis: "/inventur" },
        });
      }
    } else if (
      session.status === "offen" ||
      !session.anlagen_inventur_abgeschlossen ||
      !session.bestands_inventur_abgeschlossen
    ) {
      findings.push({
        severity: "error",
        code: "CLOSING_INVENTUR_UNVOLLSTAENDIG",
        message_de:
          `Inventur-Session fuer ${options.jahr} ist noch offen. ` +
          "Jahresabschluss blockiert — bitte unter /inventur abschliessen.",
        detail: {
          session_id: session.id,
          status: session.status,
          anlagen_done: session.anlagen_inventur_abgeschlossen,
          bestaende_done: session.bestands_inventur_abgeschlossen,
        },
      });
    }
    // else: session.status === "abgeschlossen" | "gebucht" → keine Finding.
  } catch (err) {
    findings.push({
      severity: "warning",
      code: "CLOSING_INVENTUR_STATUS_FAILED",
      message_de: `Inventur-Status konnte nicht ermittelt werden: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
  }

  // Optional: employeesCount verifizieren (für E2-Rules-Engine
  // relevant, hier nur als info-Finding dokumentiert).
  void options.employeesCount;
  void fetchEmployees;

  return {
    mandant_id: options.mandantId,
    jahr: options.jahr,
    stichtag: options.stichtag,
    findings,
    darf_jahresabschluss_erstellen: findings.every(
      (f) => f.severity !== "error"
    ),
  };
}
