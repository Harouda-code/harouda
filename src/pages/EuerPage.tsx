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
import { buildEuer, type EuerReport } from "../domain/euer/EuerBuilder";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

function fmt(s: string): string {
  return new Money(s).toEuroFormat();
}

export default function EuerPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [von, setVon] = useState(`${selectedYear}-01-01`);
  const [bis, setBis] = useState(`${selectedYear}-12-31`);
  const [kleinunt, setKleinunt] = useState(false);
  const [iabBeantragt, setIabBeantragt] = useState("");
  const [iabHinzu, setIabHinzu] = useState("");
  const [iabAufl, setIabAufl] = useState("");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const report: EuerReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const parse = (v: string) => {
      if (!v.trim()) return undefined;
      try {
        return new Money(v.replace(",", "."));
      } catch {
        return undefined;
      }
    };
    return buildEuer({
      accounts: accountsQ.data,
      entries: entriesQ.data,
      wirtschaftsjahr: { von, bis },
      istKleinunternehmer: kleinunt,
      iabBeantragt: parse(iabBeantragt),
      iabHinzurechnung: parse(iabHinzu),
      iabAufloesung: parse(iabAufl),
    });
  }, [accountsQ.data, entriesQ.data, von, bis, kleinunt, iabBeantragt, iabHinzu, iabAufl]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      ["Zeile", "Kz", "Bezeichnung", "Abschnitt", "Betrag (€)", "HGB"],
      ...report.positionen.map((p) => [
        String(p.zeile),
        p.kz,
        p.name,
        p.section,
        p.wert,
        p.hgb ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(csv, `euer_${von}_${bis}.csv`, "text/csv;charset=utf-8");
    toast.success("EÜR-CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    const payload = {
      meta: { ...report.metadata, kanzlei: settings.kanzleiName },
      wirtschaftsjahr: report.wirtschaftsjahr,
      istKleinunternehmer: report.istKleinunternehmer,
      summen: report.summen,
      bewirtung: report.bewirtung,
      geschenke: report.geschenke,
      investitionsabzug: report.investitionsabzug,
      positionen: report.positionen.map((p) => ({
        kz: p.kz,
        zeile: p.zeile,
        name: p.name,
        section: p.section,
        type: p.type,
        wert: p.wert,
        hgb: p.hgb,
      })),
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `euer_${von}_${bis}.json`,
      "application/json"
    );
    toast.success("EÜR-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/buchhaltung/buchfuehrung" className="report__back">
          <ArrowLeft size={16} /> Zur\u00fcck zur Buchf\u00fchrung
        </Link>
        <div className="report__head-title">
          <h1>Anlage EÜR 2025 (§ 4 Abs. 3 EStG)</h1>
          <p>
            Einnahmen-Überschuss-Rechnung nach BMF-Vordruck 2025 · SKR03 →
            Kennzahlen-Mapping · Bewirtung 70/30-Split automatisch.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Wirtschaftsjahr von</span>
            <input type="date" value={von} onChange={(e) => setVon(e.target.value)} />
          </label>
          <label>
            <span>bis</span>
            <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={kleinunt}
              onChange={(e) => setKleinunt(e.target.checked)}
            />
            Kleinunternehmer (§ 19 UStG)
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
          <strong>Nachgebildete Darstellung.</strong> Bewirtung (§ 4 Abs. 5 Nr. 2
          EStG): Journal-Buchung auf 4650-4655 wird automatisch in 70 % Kz 175
          (abziehbar) und 30 % Kz 228 (nicht abziehbar) gesplittet. Geschenke:
          Konten 4630-4635 (≤ 50 €) fließen in Kz 170, Konten 4636-4639 (&gt; 50
          €) direkt in Kz 228. § 7g EStG kann oben als Betrag eingegeben werden.
        </div>
      </aside>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade EÜR …
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <KpiCard label="Betriebseinnahmen" value={fmt(report.summen.betriebseinnahmen)} />
            <KpiCard label="Betriebsausgaben" value={fmt(report.summen.betriebsausgaben)} />
            <KpiCard
              label="Vorläufiger Gewinn"
              value={fmt(report.summen.vorlaeufigerGewinn)}
              color={
                new Money(report.summen.vorlaeufigerGewinn).isNegative()
                  ? "#8a2c2c"
                  : new Money(report.summen.vorlaeufigerGewinn).isPositive()
                    ? "#1f7a4d"
                    : undefined
              }
            />
            <KpiCard
              label="Steuerlicher Gewinn"
              value={fmt(report.summen.steuerlicherGewinn)}
              color={
                new Money(report.summen.steuerlicherGewinn).isNegative()
                  ? "#8a2c2c"
                  : "#1f7a4d"
              }
              emphasis
            />
          </div>

          <section className="card no-print" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              Investitionsabzugsbetrag (§ 7g EStG)
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ fontSize: "0.85rem" }}>
                <span>Beantragt (Kz 270)</span>
                <input
                  type="text"
                  value={iabBeantragt}
                  onChange={(e) => setIabBeantragt(e.target.value)}
                  placeholder="0,00"
                  style={{ marginLeft: 8, width: 120 }}
                />
              </label>
              <label style={{ fontSize: "0.85rem" }}>
                <span>Hinzurechnung (Kz 206)</span>
                <input
                  type="text"
                  value={iabHinzu}
                  onChange={(e) => setIabHinzu(e.target.value)}
                  placeholder="0,00"
                  style={{ marginLeft: 8, width: 120 }}
                />
              </label>
              <label style={{ fontSize: "0.85rem" }}>
                <span>Auflösung (Kz 210)</span>
                <input
                  type="text"
                  value={iabAufl}
                  onChange={(e) => setIabAufl(e.target.value)}
                  placeholder="0,00"
                  style={{ marginLeft: 8, width: 120 }}
                />
              </label>
            </div>
          </section>

          {(["B", "C", "D", "E", "F"] as const).map((sec) => {
            const rows = report.positionen.filter((p) => p.section === sec);
            if (rows.length === 0) return null;
            const title =
              sec === "B"
                ? "B. Betriebseinnahmen"
                : sec === "C"
                  ? "C. Betriebsausgaben"
                  : sec === "D"
                    ? "D. Ermittlung des Gewinns"
                    : sec === "E"
                      ? "E. Investitionsabzug (§ 7g EStG)"
                      : "F. Rücklagen / stille Reserven";
            return (
              <section key={sec} className="card" style={{ padding: 16, marginBottom: 12 }}>
                <h2 style={{ margin: "0 0 10px", fontSize: "1rem" }}>{title}</h2>
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
                      <th style={{ textAlign: "left", padding: "4px 0", width: 50 }}>Z.</th>
                      <th style={{ textAlign: "left", padding: "4px 0", width: 70 }}>Kz</th>
                      <th style={{ textAlign: "left", padding: "4px 0" }}>Bezeichnung</th>
                      <th style={{ textAlign: "right", padding: "4px 8px", width: 140 }}>
                        Betrag
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const isSub = p.isSubtotal;
                      const isFinal = p.isFinalResult;
                      const bg = isFinal ? "#eef6f0" : isSub ? "#f3f5f8" : undefined;
                      const weight = isSub || isFinal ? 700 : 400;
                      const borderTop = isSub || isFinal ? "1px solid #c3c8d1" : undefined;
                      const borderBottom = isFinal ? "3px double #15233d" : "1px solid #eef1f6";
                      const valColor = isFinal
                        ? new Money(p.wert).isNegative()
                          ? "#8a2c2c"
                          : "#1f7a4d"
                        : undefined;
                      return (
                        <tr key={p.kz} style={{ background: bg, borderTop, borderBottom }}>
                          <td style={{ padding: "4px 0", color: "var(--ink-soft)" }}>
                            {p.zeile}
                          </td>
                          <td
                            style={{
                              padding: "4px 0",
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.78rem",
                              color: "var(--ink-soft)",
                            }}
                          >
                            {p.kz}
                          </td>
                          <td style={{ padding: "4px 0", fontWeight: weight }}>
                            {p.name}
                            {p.hgb && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: "0.72rem",
                                  color: "var(--ink-soft)",
                                  fontStyle: "italic",
                                }}
                              >
                                {p.hgb}
                              </span>
                            )}
                            {p.computation && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: "0.72rem",
                                  color: "var(--ink-soft)",
                                }}
                              >
                                ({p.computation})
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
                            {fmt(p.wert)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })}

          {new Money(report.bewirtung.gesamt).isPositive() && (
            <section
              className="card"
              style={{ padding: 14, marginBottom: 12, borderLeft: "4px solid #c76b3f" }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
                Bewirtung (§ 4 Abs. 5 Nr. 2 EStG · 70/30-Split)
              </h3>
              <table style={{ fontSize: "0.85rem" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "2px 16px 2px 0" }}>Bewirtung gesamt (gebucht)</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {fmt(report.bewirtung.gesamt)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 16px 2px 0" }}>davon abziehbar (70 %, Kz 175)</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#1f7a4d" }}>
                      {fmt(report.bewirtung.abzugsfaehig)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 16px 2px 0" }}>
                      davon nicht abziehbar (30 %, Kz 228)
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#8a2c2c" }}>
                      {fmt(report.bewirtung.nichtAbzugsfaehig)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}
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
      style={{ padding: 12, borderLeft: color ? `4px solid ${color}` : undefined }}
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
