import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  FileSearch,
  Info,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { fetchAllMembershipHealth, type CompanyHealth } from "../api/advisorMetrics";
import { useCompany } from "../contexts/CompanyContext";
import { usePermissions } from "../hooks/usePermissions";
import "./ReportView.css";
import "./TaxCalc.css";
import "./AdvisorDashboardPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE");
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdvisorDashboardPage() {
  const perms = usePermissions();
  const { memberships, setActiveCompanyId } = useCompany();
  const navigate = useNavigate();

  const healthQ = useQuery({
    queryKey: ["advisor-health", memberships.map((m) => m.companyId).join(",")],
    queryFn: () => fetchAllMembershipHealth(memberships),
    enabled: memberships.length > 0,
  });

  const totals = useMemo(() => {
    const rows = healthQ.data ?? [];
    return {
      companies: rows.length,
      recTotal: rows.reduce((s, r) => s + r.openReceivablesSum, 0),
      overdueCount: rows.reduce((s, r) => s + r.overdueReceivablesCount, 0),
      overdueSum: rows.reduce((s, r) => s + r.overdueReceivablesSum, 0),
      payTotal: rows.reduce((s, r) => s + r.openPayablesSum, 0),
      draftTotal: rows.reduce((s, r) => s + r.draftCount, 0),
    };
  }, [healthQ.data]);

  function switchToCompany(companyId: string) {
    setActiveCompanyId(companyId);
    navigate("/dashboard");
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Berater-Dashboard</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff — Sie sind keiner Firma zugeordnet.</span>
        </aside>
      </div>
    );
  }

  if (memberships.length <= 1) {
    return (
      <div className="report">
        <header className="report__head">
          <Link to="/dashboard" className="report__back">
            <ArrowLeft size={16} />
            Zurück zum Dashboard
          </Link>
          <div className="report__head-title">
            <h1>
              <Briefcase
                size={22}
                style={{ verticalAlign: "-3px", marginRight: 8 }}
              />
              Berater-Dashboard
            </h1>
            <p>
              Cross-Mandats-Übersicht für Berater:innen, die in mehreren
              Kanzleien / Firmen Mitglied sind.
            </p>
          </div>
        </header>
        <aside className="taxcalc__hint">
          <Info size={14} />
          <span>
            Sie sind aktuell nur Mitglied in{" "}
            <strong>{memberships.length === 0 ? "keiner" : "einer"}</strong>{" "}
            Firma. Das Berater-Dashboard zeigt seinen Mehrwert, sobald ≥ 2
            Mitgliedschaften existieren.
          </span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report advisor">
      <header className="report__head">
        <Link to="/dashboard" className="report__back">
          <ArrowLeft size={16} />
          Zurück zum Dashboard der aktiven Firma
        </Link>
        <div className="report__head-title">
          <h1>
            <Briefcase
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Berater-Dashboard
          </h1>
          <p>
            Health-Übersicht über {memberships.length} Firmen. Queries laufen
            pro Firma; das Row-Level-Security-Gate greift für jede einzeln.
          </p>
        </div>
      </header>

      <section className="advisor__kpis">
        <KpiCard
          icon={<Building2 size={16} />}
          label="Firmen in Verwaltung"
          value={String(totals.companies)}
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Offene Forderungen"
          value={euro.format(totals.recTotal)}
        />
        <KpiCard
          icon={<Clock size={16} />}
          label="Überfällig"
          value={`${totals.overdueCount} · ${euro.format(totals.overdueSum)}`}
          severity={totals.overdueCount > 0 ? "warn" : "ok"}
        />
        <KpiCard
          icon={<TrendingDown size={16} />}
          label="Offene Verbindlichkeiten"
          value={euro.format(totals.payTotal)}
        />
        <KpiCard
          icon={<FileSearch size={16} />}
          label="Entwurf-Buchungen"
          value={String(totals.draftTotal)}
          severity={totals.draftTotal > 0 ? "warn" : "ok"}
        />
      </section>

      {healthQ.isLoading && (
        <div className="card advisor__empty">
          <Loader2 size={18} className="login__spinner" />
          <span>Lade Kennzahlen für alle Firmen …</span>
        </div>
      )}

      {healthQ.data && (
        <section className="card advisor__list">
          <table>
            <thead>
              <tr>
                <th>Firma</th>
                <th>Rolle</th>
                <th className="is-num">Buchungen</th>
                <th className="is-num">Entwürfe</th>
                <th className="is-num">Offene Forderungen</th>
                <th className="is-num">davon überfällig</th>
                <th className="is-num">Verbindlichkeiten</th>
                <th>Letzte Buchung</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {healthQ.data.map((h) => (
                <HealthRow
                  key={h.companyId}
                  health={h}
                  onSwitch={() => switchToCompany(h.companyId)}
                />
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  severity,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  severity?: "ok" | "warn" | "bad";
}) {
  const color =
    severity === "warn"
      ? "var(--gold-700)"
      : severity === "bad"
        ? "var(--danger)"
        : "var(--navy)";
  return (
    <div className="card advisor__kpi">
      <div className="advisor__kpi-head">
        {icon} {label}
      </div>
      <div className="advisor__kpi-value" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function HealthRow({
  health,
  onSwitch,
}: {
  health: CompanyHealth;
  onSwitch: () => void;
}) {
  const lastEntryDays = daysSince(health.lastEntryAt);
  const stale = lastEntryDays !== null && lastEntryDays > 30;
  const hasIssue =
    health.error ||
    health.draftCount > 0 ||
    health.overdueReceivablesCount > 0 ||
    stale;
  return (
    <tr className={hasIssue ? "is-warn" : ""}>
      <td>
        <strong>{health.companyName}</strong>
        {health.error && (
          <span className="advisor__muted">Fehler: {health.error}</span>
        )}
      </td>
      <td>{health.role}</td>
      <td className="is-num mono">{health.journalCount}</td>
      <td
        className="is-num mono"
        style={{
          color:
            health.draftCount > 0 ? "var(--gold-700)" : "var(--ink)",
          fontWeight: health.draftCount > 0 ? 700 : 400,
        }}
      >
        {health.draftCount}
      </td>
      <td className="is-num mono">
        {euroCents.format(health.openReceivablesSum)}
      </td>
      <td
        className="is-num mono"
        style={{
          color:
            health.overdueReceivablesCount > 0
              ? "var(--danger)"
              : "var(--ink)",
          fontWeight: health.overdueReceivablesCount > 0 ? 700 : 400,
        }}
      >
        {health.overdueReceivablesCount > 0
          ? `${health.overdueReceivablesCount} · ${euroCents.format(
              health.overdueReceivablesSum
            )}`
          : "—"}
      </td>
      <td className="is-num mono">
        {euroCents.format(health.openPayablesSum)}
      </td>
      <td style={{ color: stale ? "var(--danger)" : "var(--ink)" }}>
        {formatDateTime(health.lastEntryAt)}
        {lastEntryDays !== null && (
          <span className="advisor__muted">
            {lastEntryDays === 0
              ? " (heute)"
              : ` (vor ${lastEntryDays} Tagen)`}
          </span>
        )}
      </td>
      <td>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onSwitch}
        >
          Wechseln <ArrowRight size={12} />
        </button>
      </td>
    </tr>
  );
}
