/**
 * Sprint 20.C.3 · Unified Integrity-Dashboard UI.
 *
 * Route: /admin/integrity
 * Role-Gate: owner | admin | tax_auditor (via useRequireAdminRole).
 *
 * MVP-Scope:
 *   • 4 Chains (journal, audit, bpv, uv). invoice_xml_archive in 21+.
 *   • Aktive Company + aktiver Mandant werden oben angezeigt.
 *   • Button „Integritätsprüfung starten" fährt runIntegrityCheck an.
 *   • Ergebnis-Tabelle mit Badge, Count, BrokenAt, Reason, Duration.
 *   • JSON-Export für Betriebsprüfer-Vorlage.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRequireAdminRole } from "../../lib/auth/requireAdminRole";
import { useMandant } from "../../contexts/MandantContext";
import { useCompany } from "../../contexts/CompanyContext";
import {
  runIntegrityCheck,
  type ChainName,
  type ChainStatus,
  type IntegrityReport,
} from "../../domain/gobd/integrityDashboard";
import { downloadText } from "../../utils/exporters";
import { Forbidden } from "../../components/admin/Forbidden";
import "../ReportView.css";

const CHAIN_LABELS: Record<ChainName, string> = {
  journal: "Journal-Buchungen",
  audit: "Audit-Log",
  bpv: "Stammdaten-Versionen (BPV)",
  uv: "USt-IdNr-Verifikationen (UV)",
};

const CHAIN_SCOPE: Record<ChainName, string> = {
  journal: "Kanzlei (company_id)",
  audit: "Kanzlei (company_id)",
  bpv: "Mandant (client_id)",
  uv: "Mandant (client_id)",
};

export default function IntegrityDashboardPage() {
  const { allowed } = useRequireAdminRole();
  const { selectedMandantId } = useMandant();
  const { activeCompanyId, memberships } = useCompany();
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [running, setRunning] = useState(false);

  if (!allowed) {
    return <Forbidden />;
  }

  const companyName =
    memberships.find((m) => m.companyId === activeCompanyId)?.companyName ??
    activeCompanyId ??
    "—";

  async function handleRun() {
    if (!selectedMandantId) {
      toast.error("Bitte zuerst einen Mandanten auswählen.");
      return;
    }
    setRunning(true);
    setReport(null);
    try {
      const r = await runIntegrityCheck(selectedMandantId);
      setReport(r);
      if (r.overallValid) {
        toast.success("Alle 4 Ketten intakt.");
      } else {
        const broken = r.chains.filter((c) => !c.valid).length;
        toast.error(`${broken} von 4 Ketten gebrochen — Details siehe Tabelle.`);
      }
    } catch (err) {
      toast.error(
        `Integritätsprüfung fehlgeschlagen: ${(err as Error).message}`
      );
    } finally {
      setRunning(false);
    }
  }

  function handleExport() {
    if (!report) return;
    const ts = new Date()
      .toISOString()
      .replace(/[:T]/g, "")
      .replace(/\..+Z$/, "Z")
      .slice(0, 15);
    const fname = `integrity-report-${report.clientId}-${ts}.json`;
    downloadText(JSON.stringify(report, null, 2), fname, "application/json");
    toast.success("Bericht heruntergeladen.");
  }

  return (
    <div className="report" data-testid="integrity-dashboard">
      <header className="report__head">
        <Link to="/arbeitsplatz" className="report__back">
          <ArrowLeft size={16} /> Zurück zum Arbeitsplatz
        </Link>
        <div className="report__head-title">
          <h1>
            <ShieldCheck
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Integritätsprüfung (GoBD § 146 AO)
          </h1>
          <p>
            Tamper-Evidence-Check der vier tragenden Ketten für Kanzlei
            <strong> {companyName}</strong>
            {selectedMandantId ? (
              <>
                {" "}· Mandant <strong>{selectedMandantId}</strong>
              </>
            ) : (
              <>
                {" "}·{" "}
                <span style={{ color: "var(--warn, #d70)" }}>
                  kein Mandant ausgewählt
                </span>
              </>
            )}
            .
          </p>
        </div>
        <div className="period" style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running || !selectedMandantId}
            data-testid="btn-run-integrity"
          >
            {running ? "Prüfe …" : "Integritätsprüfung starten"}
          </button>
          {report && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleExport}
              data-testid="btn-export-json"
            >
              <Download size={14} /> JSON-Export
            </button>
          )}
        </div>
      </header>

      {!report && !running && (
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>
            Dieses Dashboard verifiziert die Hash-Ketten der vier
            tamper-evidenten Entitäten. Läuft die Prüfung durch ohne Bruch,
            können Sie das Ergebnis als JSON exportieren (Betriebsprüfer-
            Nachweis, § 146 AO + GoBD Rz. 58ff).
          </span>
        </aside>
      )}

      {report && <OverallBanner report={report} />}

      {report && (
        <section className="card" style={{ padding: 0 }}>
          <table data-testid="integrity-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Kette</th>
                <th>Scope</th>
                <th>Status</th>
                <th className="is-num">Zeilen</th>
                <th>Erste Bruchstelle</th>
                <th>Grund</th>
                <th className="is-num">Dauer (ms)</th>
              </tr>
            </thead>
            <tbody>
              {report.chains.map((c) => (
                <ChainRow key={c.chain} status={c} />
              ))}
            </tbody>
          </table>
        </section>
      )}

      {report && (
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--muted, #666)",
            marginTop: 8,
          }}
          data-testid="checked-at"
        >
          Geprüft um{" "}
          {new Date(report.checkedAt)
            .toLocaleString("de-DE")
            .replace(",", "")}
          {" · "}Company-ID {report.companyId ?? "—"} · Mandant-ID{" "}
          {report.clientId}
        </p>
      )}
    </div>
  );
}

function OverallBanner({ report }: { report: IntegrityReport }) {
  const brokenCount = report.chains.filter((c) => !c.valid).length;
  if (report.overallValid) {
    return (
      <aside
        className="taxcalc__hint"
        data-testid="banner-all-ok"
        style={{
          borderLeft: "4px solid #56a876",
          background: "#e7f5ec",
          color: "#1e6e3a",
        }}
      >
        <CheckCircle2 size={14} />
        <span>
          <strong>Alle 4 Ketten intakt.</strong> Tamper-Evidence erfüllt.
        </span>
      </aside>
    );
  }
  return (
    <aside
      className="taxcalc__hint"
      data-testid="banner-broken"
      role="alert"
      style={{
        borderLeft: "4px solid #a32020",
        background: "#fdecec",
        color: "#a32020",
      }}
    >
      <XCircle size={14} />
      <span>
        <strong>{brokenCount} von 4 Ketten gebrochen.</strong> Die
        tamper-evidence ist verletzt. Details siehe Tabelle.
      </span>
    </aside>
  );
}

function ChainRow({ status }: { status: ChainStatus }) {
  const label = CHAIN_LABELS[status.chain];
  const scope = CHAIN_SCOPE[status.chain];
  return (
    <tr
      data-testid={`row-chain-${status.chain}`}
      className={status.valid ? "" : "is-inactive"}
    >
      <td>
        <strong>{label}</strong>
      </td>
      <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{scope}</td>
      <td>
        {status.valid ? (
          <span
            className="empl__badge is-active"
            data-testid={`badge-valid-${status.chain}`}
          >
            ✅ intakt
          </span>
        ) : (
          <span
            className="empl__badge"
            style={{
              background: "#fdecec",
              color: "#a32020",
              border: "1px solid #e67373",
            }}
            data-testid={`badge-broken-${status.chain}`}
          >
            ❌ gebrochen
          </span>
        )}
      </td>
      <td className="is-num mono">{status.count}</td>
      <td className="mono" data-testid={`brokenAt-${status.chain}`}>
        {status.brokenAt
          ? `#${status.brokenAt.index + 1} · ${status.brokenAt.id}`
          : "—"}
      </td>
      <td
        style={{ fontSize: "0.85rem" }}
        data-testid={`reason-${status.chain}`}
      >
        {status.reason ?? "—"}
      </td>
      <td className="is-num mono">{status.durationMs.toFixed(1)}</td>
    </tr>
  );
}
