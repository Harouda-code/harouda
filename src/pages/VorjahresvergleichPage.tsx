import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Download,
  FileSpreadsheet,
  Loader2,
  Minus,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  buildVorjahresvergleich,
  type DeltaRow,
  type VorjahresvergleichReport,
} from "../domain/accounting/VorjahresvergleichBuilder";
import type { SizeClass } from "../domain/accounting/hgb266Structure";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

function fmt(s: string): string {
  if (s === "—") return s;
  return new Money(s).toEuroFormat();
}

function RichtungIcon({ r }: { r: DeltaRow["richtung"] }) {
  if (r === "UP") return <ArrowUp size={14} color="#1f7a4d" />;
  if (r === "DOWN") return <ArrowDown size={14} color="#8a2c2c" />;
  return <Minus size={14} color="#98a0ad" />;
}

type Tab = "bilanz" | "guv" | "summary";

export default function VorjahresvergleichPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [jahrAktuell, setJahrAktuell] = useState<number>(selectedYear);
  const [sizeClass, setSizeClass] = useState<SizeClass>("ALL");
  const [tab, setTab] = useState<Tab>("summary");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const report: VorjahresvergleichReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const jahrVorjahr = jahrAktuell - 1;
    // Daten filterfrei übergeben; der Builder selbst filtert per Datum.
    return buildVorjahresvergleich({
      accountsAktuell: accountsQ.data,
      entriesAktuell: entriesQ.data,
      accountsVorjahr: accountsQ.data,
      entriesVorjahr: entriesQ.data,
      stichtagAktuell: `${jahrAktuell}-12-31`,
      stichtagVorjahr: `${jahrVorjahr}-12-31`,
      periodStartAktuell: `${jahrAktuell}-01-01`,
      periodStartVorjahr: `${jahrVorjahr}-01-01`,
      sizeClass,
    });
  }, [accountsQ.data, entriesQ.data, jahrAktuell, sizeClass]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      [
        "Bereich",
        "Ref",
        "Position",
        "Vorjahr (€)",
        "Aktuell (€)",
        "Δ absolut (€)",
        "Δ %",
        "Trend",
      ],
      ...report.bilanzDeltas.map((d) => [
        "BILANZ",
        d.reference_code,
        d.name,
        d.vorjahrAmount,
        d.aktuellAmount,
        d.absoluteDelta,
        d.percentDelta,
        d.richtung,
      ]),
      ...report.guvDeltas.map((d) => [
        "GuV",
        d.reference_code,
        d.name,
        d.vorjahrAmount,
        d.aktuellAmount,
        d.absoluteDelta,
        d.percentDelta,
        d.richtung,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `vorjahresvergleich_${jahrAktuell}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    const payload = {
      meta: {
        generatedAt: new Date().toISOString(),
        jahrAktuell,
        jahrVorjahr: jahrAktuell - 1,
        sizeClass,
        kanzlei: settings.kanzleiName,
      },
      summary: report.summary,
      bilanzDeltas: report.bilanzDeltas,
      guvDeltas: report.guvDeltas,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `vorjahresvergleich_${jahrAktuell}.json`,
      "application/json"
    );
    toast.success("JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>Vorjahresvergleich (§ 265 Abs. 2 HGB)</h1>
          <p>
            Gegenüberstellung Bilanz und GuV für{" "}
            <strong>{jahrAktuell}</strong> vs. <strong>{jahrAktuell - 1}</strong>.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Aktuelles Jahr</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={jahrAktuell}
              onChange={(e) => setJahrAktuell(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Grössenklasse</span>
            <select
              value={sizeClass}
              onChange={(e) => setSizeClass(e.target.value as SizeClass)}
            >
              <option value="ALL">Alle</option>
              <option value="KLEIN">Klein</option>
              <option value="MITTEL">Mittel</option>
              <option value="GROSS">Gross</option>
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

      <aside
        className="ustva__disclaimer no-print"
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "rgba(210,120,70,0.08)",
          border: "1px solid rgba(210,120,70,0.3)",
          borderLeft: "4px solid #c76b3f",
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          fontSize: "0.88rem",
        }}
      >
        <AlertTriangle size={16} color="#c76b3f" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Nachgebildete Darstellung.</strong> Δ% ist <code>(Aktuell − Vorjahr) ÷ |Vorjahr| × 100</code>;
          bei Vorjahr = 0 wird <code>—</code> angezeigt. Werte basieren auf gebuchten
          Journal-Einträgen bis zum jeweiligen Stichtag.
        </div>
      </aside>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Vorjahresvergleich …</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <SummaryCard
              title="Aktiva-Entwicklung"
              delta={report.summary.aktivaEntwicklung}
            />
            <SummaryCard
              title="Umsatz-Entwicklung"
              delta={report.summary.umsatzEntwicklung}
            />
            <SummaryCard
              title="Jahresergebnis-Δ"
              delta={report.summary.jahresergebnisEntwicklung}
              emphasis
            />
            <CountCard
              title="Positionen"
              up={report.summary.anzahlSteigend}
              down={report.summary.anzahlFallend}
              same={report.summary.anzahlUnveraendert}
            />
          </div>

          {/* Tabs */}
          <div className="no-print" style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {(["summary", "bilanz", "guv"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={tab === t ? "btn btn-primary" : "btn btn-outline"}
                style={{ textTransform: "capitalize" }}
              >
                {t === "summary" ? "Übersicht" : t === "bilanz" ? "Bilanz" : "GuV"}
              </button>
            ))}
          </div>

          {tab === "summary" && (
            <section className="card" style={{ padding: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>
                Zusammenfassung {jahrAktuell} vs. {jahrAktuell - 1}
              </h3>
              <table style={{ width: "100%", fontSize: "0.88rem" }}>
                <tbody>
                  <SummaryRow
                    label="Summe Aktiva (Vorjahr → Aktuell)"
                    vj={report.vorjahr.bilanz.aktivaSum}
                    akt={report.aktuell.bilanz.aktivaSum}
                    d={report.summary.aktivaEntwicklung}
                  />
                  <SummaryRow
                    label="Summe Passiva"
                    vj={report.vorjahr.bilanz.passivaSum}
                    akt={report.aktuell.bilanz.passivaSum}
                    d={report.summary.passivaEntwicklung}
                  />
                  <SummaryRow
                    label="Umsatzerlöse"
                    vj={report.vorjahr.guv.umsatzerloese}
                    akt={report.aktuell.guv.umsatzerloese}
                    d={report.summary.umsatzEntwicklung}
                  />
                  <SummaryRow
                    label="Jahresergebnis (§ 275 Nr. 17)"
                    vj={report.vorjahr.guv.jahresergebnis}
                    akt={report.aktuell.guv.jahresergebnis}
                    d={report.summary.jahresergebnisEntwicklung}
                    bold
                  />
                </tbody>
              </table>
            </section>
          )}

          {tab === "bilanz" && (
            <DeltaTable title={`Bilanz ${jahrAktuell - 1} → ${jahrAktuell}`} rows={report.bilanzDeltas} />
          )}
          {tab === "guv" && (
            <DeltaTable title={`GuV ${jahrAktuell - 1} → ${jahrAktuell}`} rows={report.guvDeltas} />
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  delta,
  emphasis,
}: {
  title: string;
  delta: string;
  emphasis?: boolean;
}) {
  const m = new Money(delta);
  const color = m.isPositive() ? "#1f7a4d" : m.isNegative() ? "#8a2c2c" : "var(--ink-soft)";
  return (
    <div
      className="card"
      style={{
        padding: 12,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{title}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: emphasis ? "1.2rem" : "1rem",
          fontWeight: 700,
          color,
        }}
      >
        {m.isPositive() ? "+" : ""}
        {m.toEuroFormat()}
      </div>
    </div>
  );
}

function CountCard({
  title,
  up,
  down,
  same,
}: {
  title: string;
  up: number;
  down: number;
  same: number;
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{title}</div>
      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: "0.88rem" }}>
        <span style={{ color: "#1f7a4d" }}>
          <ArrowUp size={12} /> {up}
        </span>
        <span style={{ color: "#8a2c2c" }}>
          <ArrowDown size={12} /> {down}
        </span>
        <span style={{ color: "var(--ink-soft)" }}>
          <Minus size={12} /> {same}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  vj,
  akt,
  d,
  bold,
}: {
  label: string;
  vj: string;
  akt: string;
  d: string;
  bold?: boolean;
}) {
  const dm = new Money(d);
  const color = dm.isPositive() ? "#1f7a4d" : dm.isNegative() ? "#8a2c2c" : undefined;
  return (
    <tr style={{ borderBottom: "1px dashed #eef1f6", fontWeight: bold ? 700 : 400 }}>
      <td style={{ padding: "3px 0" }}>{label}</td>
      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "3px 8px" }}>
        {fmt(vj)}
      </td>
      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "3px 8px" }}>
        {fmt(akt)}
      </td>
      <td
        style={{
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          padding: "3px 0",
          color,
        }}
      >
        {dm.isPositive() ? "+" : ""}
        {fmt(d)}
      </td>
    </tr>
  );
}

function DeltaTable({ title, rows }: { title: string; rows: DeltaRow[] }) {
  return (
    <section className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
            <th style={{ textAlign: "left", padding: "4px 0", width: 90 }}>Ref.</th>
            <th style={{ textAlign: "left", padding: "4px 0" }}>Position</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Vorjahr</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Aktuell</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Δ abs</th>
            <th style={{ textAlign: "right", padding: "4px 8px", width: 80 }}>Δ %</th>
            <th style={{ textAlign: "center", padding: "4px 0", width: 40 }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => {
            const dm = new Money(d.absoluteDelta);
            const color = dm.isPositive() ? "#1f7a4d" : dm.isNegative() ? "#8a2c2c" : undefined;
            return (
              <tr key={`${d.reference_code}-${i}`} style={{ borderBottom: "1px solid #eef1f6" }}>
                <td
                  style={{
                    padding: "3px 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.76rem",
                    color: "var(--ink-soft)",
                  }}
                >
                  {d.reference_code}
                </td>
                <td style={{ padding: "3px 0" }}>{d.name}</td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "3px 8px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {fmt(d.vorjahrAmount)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "3px 8px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {fmt(d.aktuellAmount)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "3px 8px",
                    fontFamily: "var(--font-mono)",
                    color,
                  }}
                >
                  {fmt(d.absoluteDelta)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "3px 8px",
                    fontFamily: "var(--font-mono)",
                    color,
                  }}
                >
                  {d.percentDelta === "—" ? "—" : `${d.percentDelta} %`}
                </td>
                <td style={{ textAlign: "center", padding: "3px 0" }}>
                  <RichtungIcon r={d.richtung} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
