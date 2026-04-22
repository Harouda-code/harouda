import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  buildZm,
  type ZmEmpfaengerStammdaten,
  type ZmMeldezeitraum,
  type ZmReport,
} from "../domain/ustva/ZmBuilder";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import { buildZmXml } from "../domain/ustva/ZmXmlBuilder";
import { buildZmElsterXml } from "../domain/elster/ZmElsterXmlBuilder";
import "./ReportView.css";

function fmt(s: string): string {
  return new Money(s).toEuroFormat();
}

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

export default function ZmPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [meldezeitraum, setMeldezeitraum] =
    useState<ZmMeldezeitraum>("QUARTAL");
  const [monat, setMonat] = useState<number>(new Date().getMonth() + 1);
  const [quartal, setQuartal] = useState<1 | 2 | 3 | 4>(3);
  const [jahr, setJahr] = useState<number>(selectedYear);
  const [empfaengerInput, setEmpfaengerInput] =
    useState<ZmEmpfaengerStammdaten[]>([
      { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
    ]);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const report: ZmReport | null = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildZm({
      accounts: accountsQ.data,
      entries: entriesQ.data,
      meldezeitraum,
      monat: meldezeitraum === "MONAT" ? monat : undefined,
      quartal: meldezeitraum === "QUARTAL" ? quartal : undefined,
      jahr,
      empfaengerStammdaten: empfaengerInput,
    });
  }, [
    entriesQ.data,
    accountsQ.data,
    meldezeitraum,
    monat,
    quartal,
    jahr,
    empfaengerInput,
  ]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleCsv() {
    if (!report) return;
    const rows = [
      ["USt-IdNr", "Land", "Gültig", "IG-Lief (€)", "IG-sonst.L (€)", "Dreieck (€)", "Gesamt (€)"],
      ...report.meldungen.map((m) => [
        m.ustid,
        m.land,
        m.ustidValidation.isValid ? "Ja" : "Nein",
        m.igLieferungen,
        m.igSonstigeLeistungen,
        m.dreiecksgeschaefte,
        m.gesamtbetrag,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `zm_${jahr}_${meldezeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("ZM-CSV exportiert.");
  }

  function handleJson() {
    if (!report) return;
    downloadText(
      JSON.stringify(
        {
          meta: { kanzlei: settings.kanzleiName },
          zeitraum: report.zeitraum,
          meldungen: report.meldungen,
          summen: report.summen,
          ustvaKorrespondenz: report.ustvaKorrespondenz,
          abgabefrist: report.abgabefrist,
          unzuordenbareBuchungen: report.unzuordenbareBuchungen,
          warnings: report.warnings,
        },
        null,
        2
      ),
      `zm_${jahr}_${meldezeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.json`,
      "application/json"
    );
    toast.success("ZM-JSON exportiert.");
  }

  function handleXml() {
    if (!report) return;
    const xml = buildZmXml(report);
    downloadText(
      xml,
      `zm_${jahr}_${meldezeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.xml`,
      "application/xml;charset=utf-8"
    );
    toast.success("ZM-XML-Preview exportiert (nicht für BZSt-Übermittlung).");
  }

  function handleElsterXml() {
    if (!report) return;
    const eigeneUstId = prompt(
      "Eigene USt-IdNr (z. B. DE123456789) — wird ins ELSTER-XML eingetragen:"
    );
    if (!eigeneUstId) return;
    const result = buildZmElsterXml(report, { eigene_ust_id: eigeneUstId });
    downloadText(
      result.xml,
      `zm-elster_${jahr}_${meldezeitraum === "MONAT" ? String(monat).padStart(2, "0") : "Q" + quartal}.xml`,
      "application/xml;charset=utf-8"
    );
    const warn = result.warnings.length
      ? ` — Warnungen: ${result.warnings.length}`
      : "";
    toast.success(
      `ELSTER-XML-Preview exportiert (Schema-Stand ${result.schema_version}${warn}).`
    );
  }

  function addEmpfaenger() {
    setEmpfaengerInput([
      ...empfaengerInput,
      { kontoNr: "", ustid: "", land: "" },
    ]);
  }
  function removeEmpfaenger(i: number) {
    setEmpfaengerInput(empfaengerInput.filter((_, idx) => idx !== i));
  }
  function updateEmpfaenger(
    i: number,
    field: keyof ZmEmpfaengerStammdaten,
    value: string
  ) {
    setEmpfaengerInput(
      empfaengerInput.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Steuer
        </Link>
        <div className="report__head-title">
          <h1>Zusammenfassende Meldung (§ 18a UStG)</h1>
          <p>
            Meldung grenzüberschreitender EU-Leistungen · Kz 41, 21, 42 · Cross-
            Check gegen UStVA · Format-Validierung der USt-IdNr.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Meldezeitraum</span>
            <select
              value={meldezeitraum}
              onChange={(e) =>
                setMeldezeitraum(e.target.value as ZmMeldezeitraum)
              }
            >
              <option value="MONAT">Monatlich</option>
              <option value="QUARTAL">Quartalsweise</option>
            </select>
          </label>
          {meldezeitraum === "MONAT" ? (
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
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
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
          <button className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button
            className="btn btn-outline"
            onClick={handleXml}
            title="ELMA5-ähnliches XML-Preview — nicht für BZSt-Echt-Übermittlung"
          >
            <Download size={16} /> XML
          </button>
          <button
            className="btn btn-outline"
            onClick={handleElsterXml}
            data-testid="btn-zm-elster-xml"
            title="ELSTER-Schema-XML-Preview — bereit für ELSTER-Upload (nicht für direkte ERiC-Übermittlung)"
          >
            <Download size={16} /> ELSTER-XML
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
          <strong>Nachgebildete Darstellung.</strong> ZM-Kz 41 = SKR03 8125;
          ZM-Kz 21 = SKR03 8336; ZM-Kz 42 = SKR03 8338. Pro Debitor-Konto ist
          oben eine USt-IdNr zu hinterlegen; unzuordenbare Buchungen werden
          aufgelistet. Die eigentliche Übermittlung an das BZSt erfolgt separat
          (ELMA5-Schnittstelle).
        </div>
      </aside>

      {/* Fälligkeit */}
      {report && (
        <section
          className="card"
          style={{
            marginBottom: 12,
            padding: 12,
            borderLeft: "4px solid #1f7a4d",
            background: "#eaf5ef",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Clock size={20} />
          <div>
            <strong>ZM-Abgabefrist: {report.abgabefrist}</strong>
            <span style={{ marginLeft: 10, color: "var(--ink-soft)" }}>
              (§ 18a Abs. 1 UStG: 25. Tag des Folgemonats / Quartals)
            </span>
          </div>
        </section>
      )}

      {/* USt-IdNr Management */}
      <section className="card no-print" style={{ padding: 14, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
            Empfänger-Stammdaten (pro Debitor-Konto)
          </h3>
          <button className="btn btn-outline btn-sm" onClick={addEmpfaenger}>
            <Plus size={14} /> Hinzufügen
          </button>
        </div>
        <table style={{ width: "100%", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
              <th style={{ textAlign: "left", padding: "4px 0", width: 140 }}>Konto-Nr.</th>
              <th style={{ textAlign: "left", padding: "4px 0" }}>USt-IdNr</th>
              <th style={{ textAlign: "left", padding: "4px 0", width: 70 }}>Land</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {empfaengerInput.map((e, i) => (
              <tr key={i}>
                <td style={{ padding: "4px 0" }}>
                  <input
                    type="text"
                    value={e.kontoNr}
                    onChange={(ev) =>
                      updateEmpfaenger(i, "kontoNr", ev.target.value)
                    }
                    placeholder="10001"
                  />
                </td>
                <td style={{ padding: "4px 0" }}>
                  <input
                    type="text"
                    value={e.ustid}
                    onChange={(ev) =>
                      updateEmpfaenger(i, "ustid", ev.target.value)
                    }
                    placeholder="FR12345678901"
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ padding: "4px 0" }}>
                  <input
                    type="text"
                    value={e.land}
                    onChange={(ev) =>
                      updateEmpfaenger(i, "land", ev.target.value)
                    }
                    placeholder="FR"
                    maxLength={2}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => removeEmpfaenger(i)}
                    aria-label="Entfernen"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isLoading || !report ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade ZM …
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
            <Kpi label="IG-Lieferungen (Kz 41)" value={fmt(report.summen.igLieferungenTotal)} />
            <Kpi
              label="IG-sonst. Leistungen (Kz 21)"
              value={fmt(report.summen.igSonstigeLeistungenTotal)}
            />
            <Kpi
              label="Dreiecksgeschäfte (Kz 42)"
              value={fmt(report.summen.dreiecksgeschaefteTotal)}
            />
          </div>

          {/* Cross-check */}
          <section
            className="card"
            style={{
              padding: 14,
              marginBottom: 12,
              borderLeft: `4px solid ${
                report.ustvaKorrespondenz.matches41 &&
                report.ustvaKorrespondenz.matches21 &&
                report.ustvaKorrespondenz.matches42
                  ? "#1f7a4d"
                  : "#8a2c2c"
              }`,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              UStVA-Korrespondenz (Kennzahl-Summen müssen matchen)
            </h3>
            <table style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left", padding: "3px 12px 3px 0" }}>Kz</th>
                  <th style={{ textAlign: "right", padding: "3px 12px 3px 0" }}>ZM</th>
                  <th style={{ textAlign: "right", padding: "3px 12px 3px 0" }}>UStVA</th>
                  <th style={{ textAlign: "center" }}>Match</th>
                </tr>
              </thead>
              <tbody>
                <CrossRow
                  kz="41"
                  zm={report.ustvaKorrespondenz.zmKz41}
                  ustva={report.ustvaKorrespondenz.ustvaKz41}
                  matches={report.ustvaKorrespondenz.matches41}
                />
                <CrossRow
                  kz="21"
                  zm={report.ustvaKorrespondenz.zmKz21}
                  ustva={report.ustvaKorrespondenz.ustvaKz21}
                  matches={report.ustvaKorrespondenz.matches21}
                />
                <CrossRow
                  kz="42"
                  zm={report.ustvaKorrespondenz.zmKz42}
                  ustva={report.ustvaKorrespondenz.ustvaKz42}
                  matches={report.ustvaKorrespondenz.matches42}
                />
              </tbody>
            </table>
          </section>

          {/* Meldungen */}
          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              Meldungen pro Empfänger ({report.meldungen.length})
            </h3>
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left", padding: "4px 0", width: 170 }}>USt-IdNr</th>
                  <th style={{ textAlign: "left", padding: "4px 0", width: 60 }}>Land</th>
                  <th style={{ textAlign: "center", padding: "4px 0", width: 60 }}>Gültig</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", width: 130 }}>IG-Lief (Kz 41)</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", width: 130 }}>
                    IG-sonst.L (Kz 21)
                  </th>
                  <th style={{ textAlign: "right", padding: "4px 8px", width: 130 }}>Dreieck (Kz 42)</th>
                  <th style={{ textAlign: "right", padding: "4px 8px", width: 130 }}>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {report.meldungen.map((m) => {
                  const invalid = !m.ustidValidation.isValid;
                  return (
                    <tr
                      key={m.ustid}
                      style={{
                        borderBottom: "1px solid #eef1f6",
                        background: invalid ? "#fcefea" : undefined,
                      }}
                    >
                      <td
                        style={{
                          padding: "4px 0",
                          fontFamily: "var(--font-mono)",
                          color: invalid ? "#8a2c2c" : undefined,
                        }}
                        title={invalid ? m.ustidValidation.errors.join("; ") : undefined}
                      >
                        {m.ustid}
                      </td>
                      <td style={{ padding: "4px 0" }}>{m.land}</td>
                      <td style={{ padding: "4px 0", textAlign: "center" }}>
                        {m.ustidValidation.isValid ? (
                          <CheckCircle2 size={14} color="#1f7a4d" />
                        ) : (
                          <XCircle size={14} color="#8a2c2c" />
                        )}
                      </td>
                      <td
                        style={{ padding: "4px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                      >
                        {fmt(m.igLieferungen)}
                      </td>
                      <td
                        style={{ padding: "4px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                      >
                        {fmt(m.igSonstigeLeistungen)}
                      </td>
                      <td
                        style={{ padding: "4px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                      >
                        {fmt(m.dreiecksgeschaefte)}
                      </td>
                      <td
                        style={{
                          padding: "4px 8px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                        }}
                      >
                        {fmt(m.gesamtbetrag)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {report.warnings.length > 0 && (
            <section
              className="card"
              style={{
                padding: 12,
                marginBottom: 12,
                background: "#fff3e0",
                border: "1px solid rgba(210,120,70,0.4)",
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", color: "#8a2c2c" }}>
                Hinweise
              </h3>
              <ul style={{ margin: "4px 0 0 20px", fontSize: "0.85rem" }}>
                {report.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          {report.unzuordenbareBuchungen.length > 0 && (
            <section
              className="card"
              style={{
                padding: 12,
                background: "#fff3e0",
                border: "1px solid rgba(210,120,70,0.4)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", color: "#8a2c2c", fontSize: "0.95rem" }}>
                Unzuordenbare Buchungen ({report.unzuordenbareBuchungen.length})
              </h3>
              <table style={{ fontSize: "0.85rem", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Datum</th>
                    <th style={{ textAlign: "left" }}>Soll</th>
                    <th style={{ textAlign: "left" }}>Haben</th>
                    <th style={{ textAlign: "right" }}>Betrag</th>
                    <th style={{ textAlign: "left" }}>Grund</th>
                  </tr>
                </thead>
                <tbody>
                  {report.unzuordenbareBuchungen.map((u) => (
                    <tr key={u.buchungId}>
                      <td>{u.datum}</td>
                      <td>{u.sollKonto}</td>
                      <td>{u.habenKonto}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        {fmt(u.betrag)}
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                        {u.reason}
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1.1rem",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CrossRow({
  kz,
  zm,
  ustva,
  matches,
}: {
  kz: string;
  zm: string;
  ustva: string;
  matches: boolean;
}) {
  return (
    <tr>
      <td style={{ padding: "3px 12px 3px 0", fontFamily: "var(--font-mono)" }}>
        Kz {kz}
      </td>
      <td style={{ padding: "3px 12px 3px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>
        {fmt(zm)}
      </td>
      <td style={{ padding: "3px 12px 3px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>
        {fmt(ustva)}
      </td>
      <td style={{ textAlign: "center" }}>
        {matches ? (
          <CheckCircle2 size={14} color="#1f7a4d" />
        ) : (
          <XCircle size={14} color="#8a2c2c" />
        )}
      </td>
    </tr>
  );
}
