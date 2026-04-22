/**
 * Wizard Step 1 — Pre-Closing-Validation.
 *
 * Ruft `validateYearEnd` aus E1 + rendert Findings + entscheidet, ob
 * der Nutzer weiter darf.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { validateYearEnd } from "../../domain/accounting/ClosingValidation";
import type {
  ClosingValidationFinding,
  ClosingValidationReport,
} from "../../domain/accounting/ClosingValidation";
import { getActiveCompanyId } from "../../api/db";
import {
  markStepCompleted,
  updateStep,
} from "../../domain/jahresabschluss/wizardStore";
import type { StepProps } from "./stepTypes";

const SEVERITY_ICON = {
  error: ShieldAlert,
  warning: AlertTriangle,
  info: CheckCircle2,
} as const;

const SEVERITY_COLOR = {
  error: "var(--danger, #a33)",
  warning: "var(--gold, #a37100)",
  info: "var(--muted, #556)",
} as const;

export function StepValidation({
  state,
  mandantId,
  jahr,
  onAdvance,
}: StepProps) {
  const [report, setReport] = useState<ClosingValidationReport | null>(
    state.data.validation ?? null
  );
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function runValidation() {
    setLoading(true);
    try {
      const result = await validateYearEnd({
        mandantId,
        companyId: getActiveCompanyId() ?? "",
        jahr,
        stichtag: `${jahr}-12-31`,
        employeesCount: 0,
      });
      setReport(result);
      updateStep(mandantId, jahr, {
        data: { validation: result },
      });
    } finally {
      setLoading(false);
    }
  }

  const errors = report?.findings.filter((f) => f.severity === "error") ?? [];
  const warnings = report?.findings.filter((f) => f.severity === "warning") ?? [];

  const canAdvance =
    report !== null &&
    errors.length === 0 &&
    (warnings.length === 0 || confirmed);

  function handleAdvance() {
    markStepCompleted(mandantId, jahr, "validation");
    onAdvance("rechtsform");
  }

  return (
    <section data-testid="step-validation">
      <h2>Schritt 1 — Pre-Closing-Prüfung</h2>
      <p>
        Prüft Hash-Kette, Trial-Balance, offene Entwürfe, AfA-/Lohn-
        Lücken und die Bilanz↔GuV-Konsistenz für {jahr}.
      </p>

      {!report && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={runValidation}
          disabled={loading}
          data-testid="btn-run-validation"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="login__spinner" /> Prüfe …
            </>
          ) : (
            "Prüfung starten"
          )}
        </button>
      )}

      {report && (
        <div data-testid="validation-result">
          <div
            style={{
              display: "flex",
              gap: 12,
              margin: "12px 0",
              flexWrap: "wrap",
            }}
          >
            <Stat label="Errors" value={errors.length} color="var(--danger, #a33)" />
            <Stat
              label="Warnings"
              value={warnings.length}
              color="var(--gold, #a37100)"
            />
          </div>

          <ul
            style={{ listStyle: "none", padding: 0 }}
            data-testid="findings-list"
          >
            {report.findings.map((f, i) => (
              <FindingItem key={`${f.code}-${i}`} finding={f} />
            ))}
          </ul>

          {warnings.length > 0 && errors.length === 0 && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "12px 0",
              }}
              data-testid="warnings-confirm-label"
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                data-testid="warnings-confirm"
              />
              Ich habe alle Warnungen zur Kenntnis genommen und manuell geprüft.
            </label>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={runValidation}
              disabled={loading}
              data-testid="btn-rerun-validation"
            >
              Erneut prüfen
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdvance}
              disabled={!canAdvance}
              data-testid="btn-advance-validation"
            >
              Weiter →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "6px 12px",
        border: `1px solid ${color}`,
        borderRadius: 6,
        fontSize: "0.85rem",
        color,
      }}
    >
      {label}: <strong>{value}</strong>
    </div>
  );
}

function FindingItem({ finding }: { finding: ClosingValidationFinding }) {
  const Icon = SEVERITY_ICON[finding.severity];
  const color = SEVERITY_COLOR[finding.severity];
  const isBankRecon = finding.code === "CLOSING_BANK_RECON_NOT_AUTOMATED";
  return (
    <li
      data-testid={`finding-${finding.code}`}
      data-severity={finding.severity}
      style={{
        display: "flex",
        gap: 10,
        padding: "8px 12px",
        margin: "6px 0",
        border: `1px solid ${color}`,
        borderRadius: 6,
        background: "var(--ivory-100, #f7f8fa)",
      }}
    >
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
          {finding.code}
        </div>
        <div style={{ fontSize: "0.85rem" }}>{finding.message_de}</div>
        {isBankRecon && (
          <div style={{ marginTop: 6 }}>
            <Link
              to="/bank-reconciliation"
              target="_blank"
              rel="noopener"
              data-testid="bank-recon-link"
              style={{ fontSize: "0.82rem" }}
            >
              <ExternalLink size={12} /> Zur Bank-Reconciliation-Seite
            </Link>
          </div>
        )}
      </div>
    </li>
  );
}
