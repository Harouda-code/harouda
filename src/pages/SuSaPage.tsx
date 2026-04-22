import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import {
  buildSuSa,
  defaultPeriodYtd,
  filterByPeriod,
  type PeriodFilter,
} from "../api/reports";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { exportTableToExcel, exportTableToPdf, type TableRow } from "../utils/exporters";
import "./ReportView.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function SuSaPage() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear, yearStart, yearEnd } = useYear();
  const [period, setPeriod] = useState<PeriodFilter>(() => {
    const now = new Date().getFullYear();
    return selectedYear === now
      ? defaultPeriodYtd()
      : { start: yearStart, end: yearEnd };
  });

  useEffect(() => {
    const now = new Date().getFullYear();
    if (selectedYear === now) setPeriod(defaultPeriodYtd());
    else setPeriod({ start: yearStart, end: yearEnd });
  }, [selectedYear, yearStart, yearEnd]);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const filtered = useMemo(
    () => filterByPeriod(entriesQ.data ?? [], period, selectedMandantId),
    [entriesQ.data, period, selectedMandantId]
  );
  const report = useMemo(
    () => buildSuSa(filtered, accountsQ.data ?? []),
    [filtered, accountsQ.data]
  );

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;
  const isBalanced =
    Math.abs(report.sollTotal - report.habenTotal) < 0.01;

  async function handleExport(format: "pdf" | "xlsx") {
    const rows: TableRow[] = report.rows.map((r) => [
      r.konto_nr,
      r.bezeichnung,
      r.kategorie,
      r.soll,
      r.haben,
      r.saldo,
    ]);
    const spec = {
      title: "Summen- und Saldenliste",
      subtitle: `${settings.kanzleiName} · ${period.start} – ${period.end}`,
      columns: [
        { header: "Konto", width: 12 },
        { header: "Bezeichnung", width: 36 },
        { header: "Kategorie", width: 14 },
        { header: "Soll", width: 16, alignRight: true },
        { header: "Haben", width: 16, alignRight: true },
        { header: "Saldo", width: 16, alignRight: true },
      ],
      rows,
      footer: [
        "Kontrollsumme",
        "",
        "",
        report.sollTotal,
        report.habenTotal,
        report.sollTotal - report.habenTotal,
      ] as TableRow,
    };
    const base = `susa_${period.start}_${period.end}`;
    try {
      if (format === "pdf") await exportTableToPdf(spec, `${base}.pdf`);
      else await exportTableToExcel(spec, `${base}.xlsx`);
      toast.success(`${format.toUpperCase()} exportiert.`);
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>Summen- und Saldenliste</h1>
          <p>Alle bewegten Konten mit Soll, Haben und Saldo.</p>
        </div>
        <div className="period susa__toolbar">
          <label>
            <span>Von</span>
            <input
              type="date"
              value={period.start}
              onChange={(e) =>
                setPeriod((p) => ({ ...p, start: e.target.value }))
              }
            />
          </label>
          <label>
            <span>Bis</span>
            <input
              type="date"
              value={period.end}
              onChange={(e) =>
                setPeriod((p) => ({ ...p, end: e.target.value }))
              }
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Drucken
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleExport("pdf")}
          >
            <FileText size={16} />
            PDF
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleExport("xlsx")}
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          SuSa {period.start} — {period.end}
        </span>
      </div>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Daten …</p>
        </div>
      ) : report.rows.length === 0 ? (
        <div className="card report__empty-card">
          <p>Keine bewegten Konten im gewählten Zeitraum.</p>
        </div>
      ) : (
        <div className="card">
          <table className="report__table">
            <thead>
              <tr>
                <th>Konto</th>
                <th>Bezeichnung</th>
                <th>Kategorie</th>
                <th className="is-num">Soll</th>
                <th className="is-num">Haben</th>
                <th className="is-num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.konto_nr}>
                  <td className="mono">{r.konto_nr}</td>
                  <td>{r.bezeichnung}</td>
                  <td style={{ textTransform: "capitalize" }}>{r.kategorie}</td>
                  <td className="is-num mono">{euro.format(r.soll)}</td>
                  <td className="is-num mono">{euro.format(r.haben)}</td>
                  <td
                    className="is-num mono"
                    style={{
                      color: r.saldo >= 0 ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {euro.format(r.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="is-result">
                <td colSpan={3}>
                  <strong>Kontrollsumme</strong>
                </td>
                <td className="is-num mono">{euro.format(report.sollTotal)}</td>
                <td className="is-num mono">{euro.format(report.habenTotal)}</td>
                <td className="is-num mono">
                  {isBalanced ? (
                    <span style={{ color: "var(--success)" }}>Soll = Haben ✓</span>
                  ) : (
                    <span style={{ color: "var(--danger)" }}>Abweichung</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
