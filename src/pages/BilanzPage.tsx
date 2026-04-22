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
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useYear } from "../contexts/YearContext";
import { useSettings } from "../contexts/SettingsContext";
import {
  buildBalanceSheet,
  flattenForRender,
  type FlatRow,
  type BalanceSheetReport,
} from "../domain/accounting/BalanceSheetBuilder";
import type { SizeClass } from "../domain/accounting/hgb266Structure";
import { downloadText } from "../utils/exporters";
import { Money } from "../lib/money/Money";
import "./ReportView.css";

function formatMoney(m: Money): string {
  return m.toEuroFormat();
}
function formatString(s: string): string {
  return new Money(s).toEuroFormat();
}

export default function BilanzPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
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

  const report: BalanceSheetReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildBalanceSheet(accountsQ.data, entriesQ.data, {
      stichtag,
      sizeClass,
    });
  }, [accountsQ.data, entriesQ.data, stichtag, sizeClass]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      ["Seite", "Ebene", "Referenz", "Bezeichnung", "Saldo (€)"],
      ...flattenRows(report).map((r) => [
        r.side,
        String(r.depth),
        r.node.referenceCode,
        r.node.name,
        r.balance.toFixed2(),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")
      )
      .join("\r\n");
    downloadText(
      csv,
      `bilanz_${report.stichtag}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("Bilanz-CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    const payload = {
      meta: {
        ...report.metadata,
        stichtag: report.stichtag,
        sizeClass: report.sizeClass,
      },
      summary: {
        aktivaSum: report.aktivaSum,
        passivaSum: report.passivaSum,
        balancierungsDifferenz: report.balancierungsDifferenz,
        provisionalResult: report.provisionalResult,
        erfolg: report.erfolgsDetail,
      },
      aktiva: flattenForRender(report.aktivaRoot).map(serializeRow),
      passiva: flattenForRender(report.passivaRoot).map(serializeRow),
      unmappedAccounts: report.unmappedAccounts,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `bilanz_${report.stichtag}.json`,
      "application/json"
    );
    toast.success("Bilanz-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>Bilanz (HGB § 266)</h1>
          <p>
            Nachgebildete Darstellung · vorläufiges Jahresergebnis wird
            automatisch auf Passiva · A.V eingestellt (§ 268 Abs. 1 HGB).
          </p>
        </div>
        <div className="period">
          <label>
            <span>Stichtag</span>
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
              <option value="ALL">Alle Zeilen</option>
              <option value="KLEIN">Klein (§ 267 Abs. 1)</option>
              <option value="MITTEL">Mittel (§ 267 Abs. 2)</option>
              <option value="GROSS">Gross (§ 267 Abs. 3)</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Drucken
          </button>
          <button type="button" className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} />
            CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={handleJson}>
            <Download size={16} />
            JSON
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          Bilanz · Stichtag {stichtag}
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
          <strong>Nachgebildete Darstellung</strong> nach HGB § 266 / § 267 /
          § 268. Die Zuordnung SKR03 → Bilanzposition folgt bereichs-basierten
          Regeln (siehe <code>skr03Mapping.ts</code>); für den Jahresabschluss
          muss jedes Konto individuell geprüft werden. Das vorläufige
          Jahresergebnis wird bottom-up aus den Erfolgskonten (Klasse 2/3/4/8)
          berechnet und auf Passiva · A.V (Jahresüberschuss vorläufig)
          eingestellt — ersetzt keine GuV-Feststellung.
        </div>
      </aside>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Bilanz …</p>
        </div>
      ) : (
        <>
          {/* Two-column balance sheet */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 16,
            }}
          >
            <BilanzSide
              title="AKTIVA"
              rows={flattenForRender(report.aktivaRoot).slice(1)}
              rootTitle="Summe Aktiva"
              rootSum={report.aktivaSum}
            />
            <BilanzSide
              title="PASSIVA"
              rows={flattenForRender(report.passivaRoot).slice(1)}
              rootTitle="Summe Passiva"
              rootSum={report.passivaSum}
            />
          </div>

          {/* Summary */}
          <section
            className="card"
            style={{
              padding: 16,
              background: "#eef1f6",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
              Zusammenfassung · Stichtag {stichtag}
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.88rem",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "2px 0" }}>Summe Aktiva</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {formatString(report.aktivaSum)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0" }}>Summe Passiva</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {formatString(report.passivaSum)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0" }}>
                    Vorläufiges Ergebnis (Ertrag − Aufwand)
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: report._internal.provisionalResult.isPositive()
                        ? "#1f7a4d"
                        : report._internal.provisionalResult.isNegative()
                          ? "#8a2c2c"
                          : "var(--ink)",
                    }}
                  >
                    {formatString(report.provisionalResult)}{" "}
                    {!report._internal.provisionalResult.isNegative()
                      ? "(Jahresüberschuss)"
                      : "(Jahresfehlbetrag)"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0" }}>
                    Bilanzierungsdifferenz (Aktiva − Passiva, nach § 268-Injektion)
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: report._internal.balancierungsDifferenz
                        .abs()
                        .lessThan(new Money("0.01"))
                        ? "#1f7a4d"
                        : "#8a2c2c",
                    }}
                  >
                    {formatString(report.balancierungsDifferenz)}
                  </td>
                </tr>
              </tbody>
            </table>
            {!report._internal.balancierungsDifferenz
              .abs()
              .lessThan(new Money("0.01")) && (
              <p style={{ marginTop: 8, color: "#8a2c2c", fontSize: "0.85rem" }}>
                ⚠ Bilanz stimmt nicht ab. Möglich: unmapped Konten (s. u.),
                nicht abgeschlossene Bestandsveränderungen, oder Buchungen auf
                Kontenbereichen außerhalb der SKR03-Mapping-Regeln.
              </p>
            )}
          </section>

          {/* Unmapped accounts */}
          {report.unmappedAccounts.length > 0 && (
            <section
              className="card"
              style={{
                padding: 16,
                background: "#fff3e0",
                border: "1px solid rgba(210, 120, 70, 0.4)",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", color: "#8a2c2c" }}>
                Nicht zugeordnete Konten ({report.unmappedAccounts.length})
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Diese Konten passen in keine SKR03-Bereichs-Regel oder die
                Ziel-Zeile ist bei der gewählten Größenklasse ausgeblendet.
                Salden sind NICHT in der Bilanz enthalten.
              </p>
              <table className="report__table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Konto-Nr.</th>
                    <th>Bezeichnung</th>
                    <th style={{ textAlign: "right" }}>Saldo (Soll−Haben)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.unmappedAccounts.map((u) => (
                    <tr key={u.kontoNr}>
                      <td>{u.kontoNr}</td>
                      <td>{u.bezeichnung}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
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

// ---------- Side component ---------------------------------------------

function BilanzSide({
  title,
  rows,
  rootTitle,
  rootSum,
}: {
  title: string;
  rows: FlatRow[];
  rootTitle: string;
  rootSum: string;
}) {
  return (
    <section className="card" style={{ padding: 16 }}>
      <h2
        style={{
          margin: "0 0 12px",
          padding: "6px 10px",
          background: title === "AKTIVA" ? "#eef1f6" : "#f5ece4",
          borderLeft: `4px solid ${title === "AKTIVA" ? "#15233d" : "#c76b3f"}`,
          fontSize: "0.95rem",
        }}
      >
        {title}
      </h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.85rem",
        }}
      >
        <tbody>
          {rows.map((r, i) => {
            const indent = `${r.depth * 14}px`;
            const isBold = r.depth <= 1 && !r.isLeafEntry;
            const isVirtual = r.node.isVirtual;
            const balance = r.balance;
            return (
              <tr
                key={`${r.node.referenceCode}-${i}`}
                style={{
                  borderBottom: r.depth === 0 ? "2px solid #c3c8d1" : "1px solid #eef1f6",
                  background: isVirtual ? "#f7f3e8" : undefined,
                }}
              >
                <td
                  style={{
                    paddingLeft: indent,
                    paddingTop: 3,
                    paddingBottom: 3,
                    fontWeight: isBold ? 700 : 400,
                    fontStyle: isVirtual ? "italic" : "normal",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      color: "var(--ink-soft)",
                      marginRight: 6,
                    }}
                  >
                    {r.node.referenceCode.replace(/^P\./, "").replace(/:leaf$|:virtual$/, "")}
                  </span>
                  {r.node.name}
                  {r.entries?.some((e) => e.reparented) && (
                    <span
                      title="Wechselkonto · umgelagert wegen negativem Saldo"
                      style={{
                        marginLeft: 6,
                        color: "#c76b3f",
                        fontSize: "0.7rem",
                      }}
                    >
                      <Repeat size={12} style={{ verticalAlign: "middle" }} />{" "}
                      umgelagert
                    </span>
                  )}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontWeight: isBold ? 700 : 400,
                    fontStyle: isVirtual ? "italic" : "normal",
                  }}
                >
                  {balance.isZero() && r.isLeafEntry ? "" : formatMoney(balance)}
                </td>
              </tr>
            );
          })}
          <tr
            style={{
              borderTop: "3px double #15233d",
              background: "#eef1f6",
            }}
          >
            <td style={{ padding: "6px 0", fontWeight: 700 }}>{rootTitle}</td>
            <td
              style={{
                textAlign: "right",
                padding: "6px 0",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}
            >
              {formatString(rootSum)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

// ---------- Helpers -----------------------------------------------------

function flattenRows(
  r: BalanceSheetReport
): { side: "AKTIVA" | "PASSIVA"; depth: number; node: FlatRow["node"]; balance: Money }[] {
  const out: ReturnType<typeof flattenRows> = [];
  for (const row of flattenForRender(r.aktivaRoot).slice(1)) {
    out.push({ side: "AKTIVA", depth: row.depth, node: row.node, balance: row.balance });
  }
  for (const row of flattenForRender(r.passivaRoot).slice(1)) {
    out.push({ side: "PASSIVA", depth: row.depth, node: row.node, balance: row.balance });
  }
  return out;
}

function serializeRow(r: FlatRow) {
  return {
    depth: r.depth,
    referenceCode: r.node.referenceCode,
    name: r.node.name,
    hgbParagraph: r.node.hgbParagraph,
    isVirtual: r.node.isVirtual,
    balance: r.balance.toFixed2(),
    entries: r.entries?.map((e) => ({
      kontoNr: e.kontoNr,
      bezeichnung: e.bezeichnung,
      soll: e.soll.toFixed2(),
      haben: e.haben.toFixed2(),
      reparented: e.reparented,
    })),
  };
}
