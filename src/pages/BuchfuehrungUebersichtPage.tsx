import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { useSettings } from "../contexts/SettingsContext";
import { exportTableToExcel, exportTableToPdf, type TableRow } from "../utils/exporters";
import "./ReportView.css";
import "./TaxCalc.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export default function BuchfuehrungUebersichtPage() {
  const { selectedMandantId } = useMandant();
  const { selectedYear } = useYear();
  const { settings } = useSettings();

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const { monate, jahr } = useMemo(() => {
    const entries = entriesQ.data ?? [];
    const accounts = accountsQ.data ?? [];
    const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));

    const monate = Array.from({ length: 12 }, (_, i) => ({
      label: MONATE[i],
      einnahmen: 0,
      ausgaben: 0,
      gewinn: 0,
      anzahl: 0,
    }));

    let sumEinnahmen = 0;
    let sumAusgaben = 0;

    for (const e of entries) {
      if (e.datum.slice(0, 4) !== String(selectedYear)) continue;
      if (selectedMandantId && e.client_id !== selectedMandantId) continue;
      const m = Number(e.datum.slice(5, 7)) - 1;
      if (m < 0 || m > 11) continue;
      const sollKat = byNr.get(e.soll_konto)?.kategorie;
      const habenKat = byNr.get(e.haben_konto)?.kategorie;
      const amt = Number(e.betrag);
      monate[m].anzahl += 1;
      if (habenKat === "ertrag") {
        monate[m].einnahmen += amt;
        sumEinnahmen += amt;
      }
      if (sollKat === "aufwand") {
        monate[m].ausgaben += amt;
        sumAusgaben += amt;
      }
    }

    for (const m of monate) m.gewinn = m.einnahmen - m.ausgaben;

    return {
      monate,
      jahr: {
        einnahmen: sumEinnahmen,
        ausgaben: sumAusgaben,
        gewinn: sumEinnahmen - sumAusgaben,
      },
    };
  }, [entriesQ.data, accountsQ.data, selectedYear, selectedMandantId]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  async function handleExport(format: "pdf" | "xlsx") {
    const rows: TableRow[] = monate.map((m) => [
      m.label,
      m.anzahl,
      m.einnahmen,
      m.ausgaben,
      m.gewinn,
    ]);
    const spec = {
      title: `Jahresübersicht ${selectedYear}`,
      subtitle: `${settings.kanzleiName} · ${new Date().toLocaleDateString(
        "de-DE"
      )}`,
      columns: [
        { header: "Monat", width: 16 },
        { header: "Anzahl", width: 10, alignRight: true },
        { header: "Einnahmen", width: 18, alignRight: true },
        { header: "Ausgaben", width: 18, alignRight: true },
        { header: "Gewinn", width: 18, alignRight: true },
      ],
      rows,
      footer: [
        "Gesamt",
        monate.reduce((s, m) => s + m.anzahl, 0),
        jahr.einnahmen,
        jahr.ausgaben,
        jahr.gewinn,
      ] as TableRow,
    };
    try {
      if (format === "pdf")
        await exportTableToPdf(spec, `jahresuebersicht_${selectedYear}.pdf`);
      else
        await exportTableToExcel(spec, `jahresuebersicht_${selectedYear}.xlsx`);
      toast.success(`${format.toUpperCase()} exportiert.`);
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/buchfuehrung" className="report__back">
          <ArrowLeft size={16} />
          Zurück zur Buchführung
        </Link>
        <div className="report__head-title">
          <h1>Jahresübersicht {selectedYear}</h1>
          <p>
            Einnahmen, Ausgaben und Gewinn pro Monat — aus dem Buchungsjournal
            aggregiert.
          </p>
        </div>
        <div className="period">
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
          Jahresübersicht {selectedYear}
        </span>
      </div>

      <section className="dash__kpis no-print">
        <article className="card dash__kpi">
          <header className="dash__kpi-head">
            <span className="dash__kpi-label">Einnahmen {selectedYear}</span>
          </header>
          <div className="dash__kpi-value">{euro.format(jahr.einnahmen)}</div>
        </article>
        <article className="card dash__kpi">
          <header className="dash__kpi-head">
            <span className="dash__kpi-label">Ausgaben {selectedYear}</span>
          </header>
          <div className="dash__kpi-value">{euro.format(jahr.ausgaben)}</div>
        </article>
        <article className="card dash__kpi">
          <header className="dash__kpi-head">
            <span className="dash__kpi-label">Gewinn {selectedYear}</span>
          </header>
          <div
            className="dash__kpi-value"
            style={{
              color: jahr.gewinn >= 0 ? "var(--success)" : "var(--danger)",
            }}
          >
            {euro.format(jahr.gewinn)}
          </div>
        </article>
      </section>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Daten …</p>
        </div>
      ) : (
        <div className="card">
          <table className="report__table">
            <thead>
              <tr>
                <th>Monat</th>
                <th className="is-num">Anzahl</th>
                <th className="is-num">Einnahmen</th>
                <th className="is-num">Ausgaben</th>
                <th className="is-num">Gewinn</th>
              </tr>
            </thead>
            <tbody>
              {monate.map((m) => (
                <tr key={m.label}>
                  <td>{m.label}</td>
                  <td className="is-num mono">{m.anzahl}</td>
                  <td className="is-num mono">{euro.format(m.einnahmen)}</td>
                  <td className="is-num mono">{euro.format(m.ausgaben)}</td>
                  <td
                    className="is-num mono"
                    style={{
                      color: m.gewinn >= 0 ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {euro.format(m.gewinn)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="is-result">
                <td>
                  <strong>Gesamt</strong>
                </td>
                <td className="is-num mono">
                  {monate.reduce((s, m) => s + m.anzahl, 0)}
                </td>
                <td className="is-num mono">{euro.format(jahr.einnahmen)}</td>
                <td className="is-num mono">{euro.format(jahr.ausgaben)}</td>
                <td className="is-num mono">{euro.format(jahr.gewinn)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
