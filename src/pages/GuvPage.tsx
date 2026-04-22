import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useYear } from "../contexts/YearContext";
import { useSettings } from "../contexts/SettingsContext";
import { buildGuv, type GuvReport } from "../domain/accounting/GuvBuilder";
import { buildJahresabschluss } from "../domain/accounting/FinancialStatements";
import type { SizeClass } from "../domain/accounting/hgb266Structure";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

function formatString(s: string): string {
  return new Money(s).toEuroFormat();
}

/** Betrag in DE-Darstellung: Aufwand in Klammern, Ertrag ohne Vorzeichen. */
function formatGuvAmount(s: string, normalSide: "SOLL" | "HABEN"): string {
  const m = new Money(s);
  if (m.isZero()) return formatString(s);
  const euro = m.abs().toEuroFormat();
  // SOLL-Positionen (Aufwand): in Klammern
  if (normalSide === "SOLL") return `(${euro})`;
  // HABEN (Ertrag/Subtotal): negativ in Klammern, positiv ohne
  return m.isNegative() ? `(${euro})` : euro;
}

export default function GuvPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [periodStart, setPeriodStart] = useState(`${selectedYear}-01-01`);
  const [stichtag, setStichtag] = useState(`${selectedYear}-12-31`);
  const [sizeClass, setSizeClass] = useState<SizeClass>("ALL");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const report: GuvReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildGuv(accountsQ.data, entriesQ.data, {
      periodStart,
      stichtag,
      sizeClass,
      verfahren: "GKV",
    });
  }, [accountsQ.data, entriesQ.data, periodStart, stichtag, sizeClass]);

  // Cross-check gegen Bilanz (konsolidiert über FinancialStatements)
  const crossCheck = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const r = buildJahresabschluss(accountsQ.data, entriesQ.data, {
      periodStart,
      stichtag,
      sizeClass,
      verfahren: "GKV",
    });
    return r.crossCheck;
  }, [accountsQ.data, entriesQ.data, periodStart, stichtag, sizeClass]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      ["Nr.", "Bezeichnung", "HGB-Fundstelle", "Betrag (€)"],
      ...report.positionen.map((p) => [
        p.reference_code,
        p.name,
        p.hgbParagraph,
        p.amount,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `guv_${report.periodStart}_${report.periodEnd}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("GuV-CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    const payload = {
      meta: {
        ...report.metadata,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        verfahren: report.verfahren,
        sizeClass: report.sizeClass,
      },
      summary: {
        umsatzerloese: report.umsatzerloese,
        betriebsergebnis: report.betriebsergebnis,
        finanzergebnis: report.finanzergebnis,
        ergebnisVorSteuern: report.ergebnisVorSteuern,
        ergebnisNachSteuern: report.ergebnisNachSteuern,
        jahresergebnis: report.jahresergebnis,
      },
      positionen: report.positionen.map((p) => ({
        reference_code: p.reference_code,
        name: p.name,
        hgbParagraph: p.hgbParagraph,
        amount: p.amount,
        isSubtotal: p.isSubtotal,
        isFinalResult: p.isFinalResult,
        formula: p.formula,
      })),
      unmappedAccounts: report.unmappedAccounts,
      crossCheck,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `guv_${report.periodStart}_${report.periodEnd}.json`,
      "application/json"
    );
    toast.success("GuV-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>Gewinn- und Verlustrechnung (HGB § 275 Abs. 2, GKV)</h1>
          <p>
            Nachgebildete Darstellung · Gesamtkostenverfahren · Jahresergebnis
            wird automatisch mit Bilanz vorläufigem Ergebnis abgeglichen
            (GoBD Rz. 58).
          </p>
        </div>
        <div className="period">
          <label>
            <span>von</span>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </label>
          <label>
            <span>bis</span>
            <input
              type="date"
              value={stichtag}
              onChange={(e) => setStichtag(e.target.value)}
            />
          </label>
          <label>
            <span>Grössenklasse</span>
            <select
              value={sizeClass}
              onChange={(e) => setSizeClass(e.target.value as SizeClass)}
            >
              <option value="ALL">Alle Posten</option>
              <option value="KLEIN">Klein (§ 267 Abs. 1)</option>
              <option value="MITTEL">Mittel (§ 267 Abs. 2)</option>
              <option value="GROSS">Gross (§ 267 Abs. 3)</option>
            </select>
          </label>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Drucken
          </button>
          <button type="button" className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={handleJson}>
            <Download size={16} /> JSON
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          GuV · Periode {periodStart} – {stichtag}
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
          lineHeight: 1.5,
          color: "var(--ink-soft)",
        }}
      >
        <AlertTriangle size={16} style={{ color: "#c76b3f", flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Nachgebildete Darstellung</strong> nach HGB § 275 Abs. 2 (GKV).
          Die Zuordnung SKR03 → GuV-Posten folgt bereichs-basierten Regeln
          (<code>skr03GuvMapping.ts</code>); für den Jahresabschluss ist eine
          konten-individuelle Prüfung durch Steuerberater erforderlich. Zwischen-
          summen (Betriebsergebnis, Finanzergebnis, Ergebnis vor Steuern) sind
          nicht in § 275 normiert, dienen der Lesbarkeit.
        </div>
      </aside>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade GuV …</p>
        </div>
      ) : (
        <>
          {/* Main GuV table */}
          <section className="card" style={{ padding: 16, marginBottom: 16 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.88rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left", padding: "6px 4px", width: 80 }}>
                    Nr.
                  </th>
                  <th style={{ textAlign: "left", padding: "6px 4px" }}>
                    Bezeichnung
                  </th>
                  <th style={{ textAlign: "left", padding: "6px 4px", width: 220 }}>
                    HGB-Fundstelle
                  </th>
                  <th style={{ textAlign: "right", padding: "6px 4px", width: 140 }}>
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.positionen.map((p) => {
                  const def = p.reference_code;
                  const isSub = p.isSubtotal;
                  const isFinal = p.isFinalResult;
                  const bg = isFinal
                    ? "#eef6f0"
                    : isSub
                      ? "#f3f5f8"
                      : undefined;
                  const fontWeight = isSub || isFinal ? 700 : 400;
                  const borderTop = isSub || isFinal ? "1px solid #c3c8d1" : undefined;
                  const borderBottom = isFinal
                    ? "3px double #15233d"
                    : "1px solid #eef1f6";
                  const color = isFinal
                    ? new Money(p.amount).isNegative()
                      ? "#8a2c2c"
                      : "#1f7a4d"
                    : undefined;
                  return (
                    <tr
                      key={def}
                      style={{
                        background: bg,
                        borderTop,
                        borderBottom,
                      }}
                    >
                      <td
                        style={{
                          padding: "5px 4px",
                          paddingLeft: p.depth * 14 + 4,
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.78rem",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {def}
                      </td>
                      <td
                        style={{
                          padding: "5px 4px",
                          fontWeight,
                          color,
                        }}
                      >
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
                          padding: "5px 4px",
                          fontSize: "0.78rem",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {p.hgbParagraph}
                      </td>
                      <td
                        style={{
                          padding: "5px 4px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontWeight,
                          color,
                        }}
                      >
                        {isSub || isFinal
                          ? formatString(p.amount)
                          : formatGuvAmount(
                              p.amount,
                              p.reference_code.endsWith("a") ||
                                p.reference_code.endsWith("b")
                                ? "SOLL"
                                : "HABEN"
                            )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Cross-check banner */}
          {crossCheck && (
            <section
              className="card"
              style={{
                padding: 16,
                marginBottom: 16,
                background: crossCheck.matches ? "#eaf5ef" : "#fcefea",
                border: `1px solid ${crossCheck.matches ? "#b8d9c5" : "#e1b8a8"}`,
                borderLeft: `4px solid ${crossCheck.matches ? "#1f7a4d" : "#8a2c2c"}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {crossCheck.matches ? (
                  <CheckCircle2 size={18} color="#1f7a4d" />
                ) : (
                  <AlertTriangle size={18} color="#8a2c2c" />
                )}
                Bilanz-GuV Abgleich (GoBD Rz. 58)
              </h3>
              <table style={{ fontSize: "0.88rem" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "2px 16px 2px 0" }}>
                      Bilanz vorläufiges Ergebnis
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {formatString(crossCheck.bilanzProvisionalResult)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 16px 2px 0" }}>
                      GuV Jahresergebnis (§ 275 Nr. 17)
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {formatString(crossCheck.guvJahresergebnis)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 16px 2px 0" }}>Differenz</td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: crossCheck.withinCentTolerance ? "#1f7a4d" : "#8a2c2c",
                      }}
                    >
                      {formatString(crossCheck.difference)}
                    </td>
                  </tr>
                </tbody>
              </table>
              {!crossCheck.matches && (
                <p style={{ marginTop: 8, fontSize: "0.84rem", color: "#8a2c2c" }}>
                  ⚠ Bilanz und GuV weichen voneinander ab. Häufige Ursache: Konten
                  die in <code>skr03GuvMapping.ts</code> erfasst, aber in
                  <code> SKR03_ERFOLG_RULES</code> (Bilanz-Ergebnisvorschau) nicht
                  hinterlegt sind — z. B. Ertragsteuern (7600-7699), Zinsaufwand
                  (2300-2399), Finanzerträge (2600-2699).
                </p>
              )}
            </section>
          )}

          {/* Unmapped accounts */}
          {report.unmappedAccounts.length > 0 && (
            <section
              className="card"
              style={{
                padding: 16,
                background: "#fff3e0",
                border: "1px solid rgba(210, 120, 70, 0.4)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", color: "#8a2c2c" }}>
                Nicht zugeordnete Konten ({report.unmappedAccounts.length})
              </h3>
              <table className="report__table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Konto-Nr.</th>
                    <th>Bezeichnung</th>
                    <th style={{ textAlign: "right" }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {report.unmappedAccounts.map((u) => (
                    <tr key={u.kontoNr}>
                      <td>{u.kontoNr}</td>
                      <td>{u.bezeichnung}</td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatString(u.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
