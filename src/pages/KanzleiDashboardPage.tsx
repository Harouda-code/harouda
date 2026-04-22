import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileCheck2,
  FilePlus,
  Loader2,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useYear } from "../contexts/YearContext";
import { useSettings } from "../contexts/SettingsContext";
import { DeadlineService } from "../domain/compliance/DeadlineService";
import { buildBalanceSheet } from "../domain/accounting/BalanceSheetBuilder";
import { buildGuv } from "../domain/accounting/GuvBuilder";
import { Money } from "../lib/money/Money";
import "./ReportView.css";

const STATUS_COLORS = {
  RED: "#8a2c2c",
  YELLOW: "#c76b3f",
  GREEN: "#1f7a4d",
} as const;

const STATUS_LABELS = {
  RED: "überfällig",
  YELLOW: "bald fällig",
  GREEN: "planbar",
} as const;

export default function KanzleiDashboardPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const deadlines = useMemo(() => {
    return new DeadlineService().getUpcomingDeadlines();
  }, []);

  const bilanz = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildBalanceSheet(accountsQ.data, entriesQ.data, {
      stichtag: `${selectedYear}-12-31`,
    });
  }, [entriesQ.data, accountsQ.data, selectedYear]);

  const guv = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildGuv(accountsQ.data, entriesQ.data, {
      periodStart: `${selectedYear}-01-01`,
      stichtag: `${selectedYear}-12-31`,
    });
  }, [entriesQ.data, accountsQ.data, selectedYear]);

  const activeAccounts = useMemo(() => {
    if (!accountsQ.data) return 0;
    return accountsQ.data.filter((a) => a.is_active).length;
  }, [accountsQ.data]);

  const bookingCount = entriesQ.data?.filter((e) => e.status === "gebucht").length ?? 0;

  const alerts = useMemo(() => {
    const out: Array<{ severity: "warn" | "error"; message: string; to?: string }> = [];
    if (bilanz && bilanz.unmappedAccounts.length > 0) {
      out.push({
        severity: "warn",
        message: `${bilanz.unmappedAccounts.length} Konto/Konten ohne Bilanz-Mapping`,
        to: "/berichte/bilanz",
      });
    }
    if (bilanz) {
      const diff = new Money(bilanz.balancierungsDifferenz);
      if (diff.abs().greaterThan(new Money("0.01"))) {
        out.push({
          severity: "error",
          message: `Bilanz nicht ausgeglichen (Differenz ${diff.toEuroFormat()})`,
          to: "/berichte/bilanz",
        });
      }
    }
    const overdue = deadlines.filter((d) => d.status === "RED");
    if (overdue.length > 0) {
      out.push({
        severity: "error",
        message: `${overdue.length} überfällige Abgabefrist(en)`,
      });
    }
    return out;
  }, [bilanz, deadlines]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  return (
    <div className="report">
      <header
        className="no-print"
        style={{
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: "1px solid #eef1f6",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.3rem" }}>
          Dashboard · {settings.kanzleiName}
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
          Zentrale Übersicht über anstehende Fristen, KPIs und Warnungen.
        </p>
      </header>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade Dashboard …
        </div>
      ) : (
        <>
          {/* Pflichten & Fristen */}
          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Clock size={18} /> Anstehende Abgabefristen
            </h2>
            {deadlines.length === 0 ? (
              <div style={{ color: "var(--ink-soft)" }}>Keine Fristen.</div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {deadlines.map((d, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 10px",
                      borderLeft: `4px solid ${STATUS_COLORS[d.status]}`,
                      background:
                        d.status === "RED"
                          ? "#fcefea"
                          : d.status === "YELLOW"
                            ? "#fff3e0"
                            : "#eaf5ef",
                      marginBottom: 6,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong>{d.label}</strong>{" "}
                      <span style={{ color: "var(--ink-soft)" }}>· {d.zeitraum}</span>
                      {d.hinweis && (
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          {d.hinweis}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        minWidth: 110,
                        fontSize: "0.88rem",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: STATUS_COLORS[d.status] }}>
                        {d.daysRemaining >= 0
                          ? `in ${d.daysRemaining} Tag${d.daysRemaining === 1 ? "" : "en"}`
                          : `${Math.abs(d.daysRemaining)} Tag(e) überfällig`}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--ink-soft)",
                          textTransform: "uppercase",
                        }}
                      >
                        {STATUS_LABELS[d.status]} ·{" "}
                        {d.frist.toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <Link
                      to={d.route}
                      className="btn btn-outline btn-sm"
                      style={{ minWidth: 90, textAlign: "center" }}
                    >
                      Öffnen <ArrowRight size={12} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* KPI cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Kpi
              label={`Umsatz ${selectedYear}`}
              value={
                guv
                  ? new Money(guv.umsatzerloese).toEuroFormat()
                  : "—"
              }
              icon={<TrendingUp size={16} />}
              color="#1f7a4d"
            />
            <Kpi
              label={`Jahresergebnis ${selectedYear}`}
              value={
                guv
                  ? new Money(guv.jahresergebnis).toEuroFormat()
                  : "—"
              }
              color={
                guv && new Money(guv.jahresergebnis).isNegative()
                  ? "#8a2c2c"
                  : "#1f7a4d"
              }
              icon={<Scale size={16} />}
            />
            <Kpi
              label="Buchungen"
              value={String(bookingCount)}
              icon={<FileCheck2 size={16} />}
            />
            <Kpi
              label="Aktive Konten"
              value={String(activeAccounts)}
              icon={<Users size={16} />}
            />
          </div>

          {/* Warnungen */}
          {alerts.length > 0 && (
            <section
              className="card"
              style={{
                padding: 14,
                marginBottom: 12,
                borderLeft: "4px solid #8a2c2c",
                background: "#fcefea",
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#8a2c2c",
                }}
              >
                <AlertTriangle size={16} /> Warnungen ({alerts.length})
              </h2>
              <ul style={{ margin: "0 0 0 18px", fontSize: "0.88rem" }}>
                {alerts.map((a, i) => (
                  <li key={i}>
                    {a.message}
                    {a.to && (
                      <>
                        {" "}
                        <Link to={a.to} style={{ color: "#8a2c2c" }}>
                          (prüfen)
                        </Link>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quick actions */}
          <section className="card" style={{ padding: 14 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>
              Schnellzugriffe
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link to="/journal" className="btn btn-primary">
                <FilePlus size={14} /> Neue Buchung
              </Link>
              <Link to="/steuer/ustva" className="btn btn-outline">
                UStVA
              </Link>
              <Link to="/lohn" className="btn btn-outline">
                Lohn-Kalkulator
              </Link>
              <Link to="/berichte/bilanz" className="btn btn-outline">
                Bilanz
              </Link>
              <Link to="/berichte/guv" className="btn btn-outline">
                GuV
              </Link>
              <Link to="/admin/audit" className="btn btn-outline">
                Audit-Trail
              </Link>
              <Link to="/admin/z3-export" className="btn btn-outline">
                Z3-Export
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 12,
        borderLeft: color ? `4px solid ${color}` : undefined,
      }}
    >
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--ink-soft)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1.15rem",
          fontWeight: 700,
          color,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}
