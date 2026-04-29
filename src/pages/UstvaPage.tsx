import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code,
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
import { buildUstva, type UstvaReport } from "../domain/ustva/UstvaBuilder";
import { buildUstvaXml } from "../domain/ustva/UstvaXmlBuilder";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

function fmt(s: string): string {
  return new Money(s).toEuroFormat();
}

type Zeitraum = "MONAT" | "QUARTAL";

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

export default function UstvaPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [zeitraum, setZeitraum] = useState<Zeitraum>("MONAT");
  const [monat, setMonat] = useState<number>(new Date().getMonth() + 1);
  const [quartal, setQuartal] = useState<1 | 2 | 3 | 4>(3);
  const [jahr, setJahr] = useState<number>(selectedYear);
  const [dauerfrist, setDauerfrist] = useState<boolean>(false);
  const [sondervorauszahlung, setSondervorauszahlung] = useState<string>("");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const report: UstvaReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const svz =
      sondervorauszahlung.trim() !== ""
        ? (() => {
            try {
              return new Money(sondervorauszahlung.replace(",", "."));
            } catch {
              return undefined;
            }
          })()
        : undefined;
    return buildUstva({
      accounts: accountsQ.data,
      entries: entriesQ.data,
      voranmeldungszeitraum: zeitraum,
      monat: zeitraum === "MONAT" ? monat : undefined,
      quartal: zeitraum === "QUARTAL" ? quartal : undefined,
      jahr,
      dauerfristverlaengerung: dauerfrist,
      sondervorauszahlung: svz,
    });
  }, [
    accountsQ.data,
    entriesQ.data,
    zeitraum,
    monat,
    quartal,
    jahr,
    dauerfrist,
    sondervorauszahlung,
  ]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      ["Kz", "Bezeichnung", "Wert (€)", "HGB", "Typ"],
      ...report.kennzahlen.map((k) => [
        k.kz,
        k.name,
        k.wert,
        k.hgb ?? "",
        k.type,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `ustva_${jahr}_${zeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("UStVA-CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    const payload = {
      meta: {
        ...report.metadata,
        kanzlei: settings.kanzleiName,
        zeitraum: report.zeitraum,
      },
      summary: {
        summeUmsatzsteuer: report.summeUmsatzsteuer,
        summeVorsteuer: report.summeVorsteuer,
        zahllast: report.zahllast,
        erstattung: report.erstattung,
        isZahllast: report.isZahllast,
        isErstattung: report.isErstattung,
      },
      dauerfrist: report.dauerfrist,
      abgabefrist: report.abgabefrist,
      kennzahlen: report.kennzahlen.map((k) => ({
        kz: k.kz,
        name: k.name,
        type: k.type,
        section: k.section,
        wert: k.wert,
        computation: k.computation,
        hgb: k.hgb,
      })),
      unmappedAccounts: report.unmappedAccounts,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `ustva_${jahr}_${zeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.json`,
      "application/json"
    );
    toast.success("UStVA-JSON exportiert.");
  }

  function handleXml() {
    if (!report) return;
    const xml = buildUstvaXml(report);
    downloadText(
      xml,
      `ustva_${jahr}_${zeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.xml`,
      "application/xml"
    );
    toast.success("UStVA-XML-Preview exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Umsatzsteuer-Voranmeldung (§ 18 UStG)</h1>
          <p>
            BMF-Vordruck 2025 nachgebildet · SKR03-Automatik-Konten werden auf
            UStVA-Kennzahlen gemappt. ELSTER-Übertragung erfolgt separat über
            ERiC-Schnittstelle.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Zeitraum</span>
            <select
              value={zeitraum}
              onChange={(e) => setZeitraum(e.target.value as Zeitraum)}
            >
              <option value="MONAT">Monat</option>
              <option value="QUARTAL">Quartal</option>
            </select>
          </label>
          {zeitraum === "MONAT" ? (
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
          ) : (
            <label>
              <span>Quartal</span>
              <select
                value={quartal}
                onChange={(e) =>
                  setQuartal(Number(e.target.value) as 1 | 2 | 3 | 4)
                }
              >
                <option value={1}>Q1 (Jan-Mrz)</option>
                <option value={2}>Q2 (Apr-Jun)</option>
                <option value={3}>Q3 (Jul-Sep)</option>
                <option value={4}>Q4 (Okt-Dez)</option>
              </select>
            </label>
          )}
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
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
            }}
          >
            <input
              type="checkbox"
              checked={dauerfrist}
              onChange={(e) => setDauerfrist(e.target.checked)}
            />
            Dauerfrist
          </label>
          {dauerfrist && (
            <label>
              <span>Sondervorauszahlung (€)</span>
              <input
                type="text"
                placeholder="nur Dez/Q4"
                value={sondervorauszahlung}
                onChange={(e) => setSondervorauszahlung(e.target.value)}
                style={{ width: 120 }}
              />
            </label>
          )}
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Drucken
          </button>
          <button className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button className="btn btn-outline" onClick={handleJson}>
            <Download size={16} /> JSON
          </button>
          <button className="btn btn-outline" onClick={handleXml}>
            <Code size={16} /> XML
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          UStVA · {report?.zeitraum.bezeichnung ?? ""}
        </span>
      </div>

      {/* Fälligkeits-Banner */}
      {report && (
        <section
          className="card"
          style={{
            marginBottom: 16,
            padding: 12,
            borderLeft: `4px solid ${report.tageBisAbgabe < 0 ? "#8a2c2c" : report.tageBisAbgabe < 7 ? "#c76b3f" : "#1f7a4d"}`,
            background:
              report.tageBisAbgabe < 0
                ? "#fcefea"
                : report.tageBisAbgabe < 7
                  ? "#fff3e0"
                  : "#eaf5ef",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Clock size={20} />
          <div>
            <strong>Abgabefrist: {report.abgabefrist}</strong>
            {report.tageBisAbgabe >= 0 ? (
              <span style={{ marginLeft: 10, color: "var(--ink-soft)" }}>
                (noch {report.tageBisAbgabe} Tag{report.tageBisAbgabe === 1 ? "" : "e"})
              </span>
            ) : (
              <span style={{ marginLeft: 10, color: "#8a2c2c", fontWeight: 700 }}>
                ({Math.abs(report.tageBisAbgabe)} Tag
                {Math.abs(report.tageBisAbgabe) === 1 ? "" : "e"} überfällig)
              </span>
            )}
            {report.dauerfrist.active && (
              <span
                style={{
                  marginLeft: 10,
                  padding: "2px 8px",
                  background: "#eef1f6",
                  borderRadius: 4,
                  fontSize: "0.78rem",
                }}
              >
                mit Dauerfrist
              </span>
            )}
          </div>
        </section>
      )}

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
          <strong>Nachgebildete Darstellung.</strong> XML-Export ist
          <em> Preview-Format </em>, kein gültiger ERiC-Datensatz —
          produktive ELSTER-Übertragung erfolgt separat über die ERiC-DLL. Die
          Feiertags-Verschiebung berücksichtigt aktuell nur Wochenenden (§ 108
          Abs. 3 AO); länderspezifische Feiertage sind eine geplante
          Erweiterung.
        </div>
      </aside>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade UStVA …
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <KpiCard label="Summe Umsatzsteuer" value={fmt(report.summeUmsatzsteuer)} />
            <KpiCard label="Summe Vorsteuer" value={fmt(report.summeVorsteuer)} />
            <KpiCard
              label={report.isZahllast ? "Zahllast (ans FA)" : "Erstattung (vom FA)"}
              value={fmt(report.isErstattung ? report.erstattung : report.zahllast)}
              color={report.isZahllast ? "#8a2c2c" : report.isErstattung ? "#1f7a4d" : undefined}
              emphasis
            />
            <KpiCard
              label="Abgabefrist"
              value={report.abgabefrist}
              color={report.tageBisAbgabe < 0 ? "#8a2c2c" : undefined}
            />
          </div>

          {/* Sections A/B/C */}
          {(["A", "B", "C"] as const).map((section) => {
            const sectionKz = report.kennzahlen.filter((k) => k.section === section);
            if (sectionKz.length === 0) return null;
            return (
              <section
                key={section}
                className="card"
                style={{ padding: 16, marginBottom: 12 }}
              >
                <h2 style={{ margin: "0 0 10px", fontSize: "1rem" }}>
                  Abschnitt {section}.{" "}
                  {section === "A"
                    ? "Lieferungen und sonstige Leistungen"
                    : section === "B"
                      ? "Abziehbare Vorsteuerbeträge"
                      : "Berechnung der Zahllast / Erstattung"}
                </h2>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.85rem",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
                      <th style={{ textAlign: "left", padding: "4px 0", width: 80 }}>Kz</th>
                      <th style={{ textAlign: "left", padding: "4px 0" }}>Bezeichnung</th>
                      <th style={{ textAlign: "left", padding: "4px 0", width: 180 }}>
                        Fundstelle
                      </th>
                      <th style={{ textAlign: "right", padding: "4px 8px", width: 140 }}>
                        Wert
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionKz.map((k) => {
                      const isSub = k.type === "SUBTOTAL";
                      const isFinal = k.type === "FINAL_RESULT";
                      const bg = isFinal
                        ? "#eef6f0"
                        : isSub
                          ? "#f3f5f8"
                          : undefined;
                      const weight = isSub || isFinal ? 700 : 400;
                      const borderTop = isSub || isFinal ? "1px solid #c3c8d1" : undefined;
                      const borderBottom = isFinal
                        ? "3px double #15233d"
                        : "1px solid #eef1f6";
                      const valColor = isFinal
                        ? new Money(k.wert).isNegative()
                          ? "#1f7a4d"
                          : new Money(k.wert).isPositive()
                            ? "#8a2c2c"
                            : undefined
                        : undefined;
                      return (
                        <tr key={k.kz} style={{ background: bg, borderTop, borderBottom }}>
                          <td
                            style={{
                              padding: "4px 0",
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.78rem",
                              color: "var(--ink-soft)",
                            }}
                          >
                            {k.kz}
                          </td>
                          <td style={{ padding: "4px 0", fontWeight: weight }}>
                            {k.name}
                            {k.computation && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: "0.72rem",
                                  color: "var(--ink-soft)",
                                  fontStyle: "italic",
                                }}
                              >
                                ({k.computation})
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "4px 0",
                              fontSize: "0.78rem",
                              color: "var(--ink-soft)",
                            }}
                          >
                            {k.hgb ?? ""}
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
                            {fmt(k.wert)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })}

          {/* Unmapped accounts */}
          {report.unmappedAccounts.length > 0 && (
            <section
              className="card"
              style={{
                padding: 16,
                marginBottom: 12,
                background: "#fff3e0",
                border: "1px solid rgba(210,120,70,0.4)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", color: "#8a2c2c" }}>
                Nicht zugeordnete Konten ({report.unmappedAccounts.length})
              </h3>
              <table style={{ width: "100%", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Konto</th>
                    <th style={{ textAlign: "left" }}>Bezeichnung</th>
                    <th style={{ textAlign: "right" }}>Saldo</th>
                    <th style={{ textAlign: "left" }}>Grund</th>
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
                        {fmt(u.saldo)}
                      </td>
                      <td>{u.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Status banner for zahllast/erstattung */}
          <section
            className="card"
            style={{
              padding: 14,
              borderLeft: `4px solid ${report.isZahllast ? "#8a2c2c" : report.isErstattung ? "#1f7a4d" : "#98a0ad"}`,
              background: report.isZahllast ? "#fcefea" : report.isErstattung ? "#eaf5ef" : "#f3f5f8",
            }}
          >
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              {report.isErstattung ? (
                <CheckCircle2 size={18} color="#1f7a4d" />
              ) : report.isZahllast ? (
                <AlertTriangle size={18} color="#8a2c2c" />
              ) : (
                <CheckCircle2 size={18} color="#98a0ad" />
              )}
              {report.isZahllast && <>Zahllast: {fmt(report.zahllast)} an Finanzamt</>}
              {report.isErstattung && <>Erstattung: {fmt(report.erstattung)} vom Finanzamt</>}
              {!report.isZahllast && !report.isErstattung && <>Ausgeglichen</>}
            </h3>
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
