import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  buildBwa,
  type BwaReport,
  type VergleichsPeriode,
} from "../domain/accounting/BwaBuilder";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

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

function fmt(s: string): string {
  if (s === "—") return s;
  return new Money(s).toEuroFormat();
}

export default function BwaPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [monat, setMonat] = useState<number>(new Date().getMonth() + 1);
  const [jahr, setJahr] = useState<number>(selectedYear);
  const [vergleich, setVergleich] = useState<VergleichsPeriode>("NONE");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const report: BwaReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildBwa({
      accounts: accountsQ.data,
      entries: entriesQ.data,
      monat,
      jahr,
      vergleichsperiode: vergleich,
    });
  }, [accountsQ.data, entriesQ.data, monat, jahr, vergleich]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      ["Pos.", "Bezeichnung", "Monat (€)", "Jahr (€)", "Vergleich (€)", "% vom Umsatz"],
      ...report.positionen.map((p) => [
        p.code,
        p.name,
        p.monatsWert,
        p.jahresWert,
        p.vergleichWert,
        p.percentVomUmsatz,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `bwa_${report.jahr}_${String(report.monat).padStart(2, "0")}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("BWA-CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    const payload = {
      meta: {
        ...report.metadata,
        monat: report.monat,
        jahr: report.jahr,
        bezeichnung: report.bezeichnung,
        kanzlei: settings.kanzleiName,
      },
      summary: {
        betriebsleistung: report.betriebsleistung,
        rohertrag: report.rohertrag,
        betriebsergebnis: report.betriebsergebnis,
        ergebnisVorSteuern: report.ergebnisVorSteuern,
        vorlaeufigesErgebnis: report.vorlaeufigesErgebnis,
      },
      kennzahlen: report.kennzahlen,
      positionen: report.positionen,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `bwa_${report.jahr}_${String(report.monat).padStart(2, "0")}.json`,
      "application/json"
    );
    toast.success("BWA-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>BWA (Betriebswirtschaftliche Auswertung · DATEV Form 01)</h1>
          <p>
            Management-Report mit Monats- und Jahreswerten (YTD), nachgebildet
            — nicht Teil des HGB-Jahresabschlusses.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Monat</span>
            <select
              value={monat}
              onChange={(e) => setMonat(Number(e.target.value))}
            >
              {MONATE.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Jahr</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={jahr}
              onChange={(e) => setJahr(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Vergleich</span>
            <select
              value={vergleich}
              onChange={(e) =>
                setVergleich(e.target.value as VergleichsPeriode)
              }
            >
              <option value="NONE">Kein Vergleich</option>
              <option value="VORMONAT">Vormonat</option>
              <option value="VORJAHR">Vorjahr (gleicher Monat)</option>
            </select>
          </label>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Drucken
          </button>
          <button className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button className="btn btn-outline" onClick={handleJson}>
            <Download size={16} /> JSON
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          BWA · {report?.bezeichnung ?? `${MONATE[monat - 1]} ${jahr}`}
        </span>
      </div>

      <aside
        className="ustva__disclaimer no-print"
        style={{
          marginBottom: 12,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "rgba(210, 120, 70, 0.08)",
          border: "1px solid rgba(210, 120, 70, 0.3)",
          borderLeft: "4px solid #c76b3f",
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          fontSize: "0.88rem",
        }}
      >
        <AlertTriangle size={16} color="#c76b3f" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Nachgebildete DATEV-BWA Form 01.</strong> Zuordnung der SKR03-
          Konten zu BWA-Positionen folgt bereichs-basierten Regeln
          (<code>bwaStructure.ts</code>). Diese BWA ist KEIN Bestandteil des
          HGB-Jahresabschlusses sondern ein Management-Bericht. Monatswert =
          {" "}aktueller Monat; Jahreswert = YTD bis Monatsende.
        </div>
      </aside>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade BWA …
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <KpiCard label="Umsatz YTD" value={report._internal.umsatz.toEuroFormat()} />
            <KpiCard
              label="Betriebsergebnis"
              value={fmt(report.betriebsergebnis)}
              color={new Money(report.betriebsergebnis).isNegative() ? "#8a2c2c" : "#1f7a4d"}
            />
            <KpiCard
              label="Vorläufiges Ergebnis"
              value={fmt(report.vorlaeufigesErgebnis)}
              color={new Money(report.vorlaeufigesErgebnis).isNegative() ? "#8a2c2c" : "#1f7a4d"}
              emphasis
            />
            <KpiCard
              label="Rohertragsquote"
              value={report.kennzahlen.rohertragsQuote === "—" ? "—" : `${report.kennzahlen.rohertragsQuote} %`}
            />
            <KpiCard
              label="Personalkostenquote"
              value={report.kennzahlen.personalkostenQuote === "—" ? "—" : `${report.kennzahlen.personalkostenQuote} %`}
            />
            <KpiCard
              label="Umsatzrendite"
              value={report.kennzahlen.umsatzrendite === "—" ? "—" : `${report.kennzahlen.umsatzrendite} %`}
            />
          </div>

          {/* BWA table */}
          <section className="card" style={{ padding: 16 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left", padding: "5px 4px", width: 60 }}>Pos.</th>
                  <th style={{ textAlign: "left", padding: "5px 4px" }}>Bezeichnung</th>
                  <th style={{ textAlign: "right", padding: "5px 8px", width: 120 }}>Monat</th>
                  <th style={{ textAlign: "right", padding: "5px 8px", width: 120 }}>Jahr (YTD)</th>
                  <th style={{ textAlign: "right", padding: "5px 8px", width: 80 }}>% Umsatz</th>
                  {vergleich !== "NONE" && (
                    <th style={{ textAlign: "right", padding: "5px 8px", width: 120 }}>
                      Vergleich
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.positionen.map((p) => {
                  const isSub = p.isSubtotal;
                  const isFinal = p.isFinalResult;
                  const bg = isFinal ? "#eef6f0" : isSub ? "#f3f5f8" : undefined;
                  const weight = isSub || isFinal ? 700 : 400;
                  const borderTop = isSub || isFinal ? "1px solid #c3c8d1" : undefined;
                  const borderBottom = isFinal
                    ? "3px double #15233d"
                    : "1px solid #eef1f6";
                  const valColor = isFinal
                    ? new Money(p.jahresWert).isNegative()
                      ? "#8a2c2c"
                      : "#1f7a4d"
                    : undefined;
                  return (
                    <tr
                      key={p.code}
                      style={{ background: bg, borderTop, borderBottom }}
                    >
                      <td
                        style={{
                          padding: "4px 4px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.78rem",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {p.code}
                      </td>
                      <td style={{ padding: "4px 4px", fontWeight: weight, color: valColor }}>
                        {p.name}
                        {p.formula && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: "0.72rem",
                              color: "var(--ink-soft)",
                              fontStyle: "italic",
                            }}
                          >
                            ({p.formula})
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "4px 8px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontWeight: weight,
                          color: valColor,
                        }}
                      >
                        {fmt(p.monatsWert)}
                      </td>
                      <td
                        style={{
                          padding: "4px 8px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontWeight: weight,
                          color: valColor,
                        }}
                      >
                        {fmt(p.jahresWert)}
                      </td>
                      <td
                        style={{
                          padding: "4px 8px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8rem",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {p.percentVomUmsatz === "—" ? "—" : `${p.percentVomUmsatz} %`}
                      </td>
                      {vergleich !== "NONE" && (
                        <td
                          style={{
                            padding: "4px 8px",
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.82rem",
                            color: "var(--ink-soft)",
                          }}
                        >
                          {fmt(p.vergleichWert)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  emphasis,
}: {
  label: string;
  value: string;
  color?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 12,
        borderLeft: color ? `4px solid ${color}` : undefined,
      }}
    >
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: emphasis ? "1.2rem" : "1rem",
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
