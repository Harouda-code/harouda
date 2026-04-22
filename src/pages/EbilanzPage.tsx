import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useYear } from "../contexts/YearContext";
import { buildBalanceSheet } from "../domain/accounting/BalanceSheetBuilder";
import { buildGuv } from "../domain/accounting/GuvBuilder";
import { EbilanzXbrlBuilder } from "../domain/ebilanz/EbilanzXbrlBuilder";
import type {
  Groessenklasse,
  Rechtsform,
  Status,
} from "../domain/ebilanz/hgbTaxonomie68";
import { mappingStats } from "../domain/ebilanz/hgbTaxonomie68";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

const RECHTSFORMEN: Rechtsform[] = [
  "Einzelunternehmen",
  "GbR",
  "PartG",
  "OHG",
  "KG",
  "GmbH",
  "AG",
  "UG",
  "SE",
  "SonstigerRechtsform",
];

export default function EbilanzPage() {
  const { selectedYear } = useYear();
  const [von, setVon] = useState(`${selectedYear}-01-01`);
  const [bis, setBis] = useState(`${selectedYear}-12-31`);
  const [name, setName] = useState("Musterfirma GmbH");
  const [steuernr, setSteuernr] = useState("123/456/78901");
  const [strasse, setStrasse] = useState("Teststr. 1");
  const [plz, setPlz] = useState("12345");
  const [ort, setOrt] = useState("Berlin");
  const [rechtsform, setRechtsform] = useState<Rechtsform>("GmbH");
  const [groesse, setGroesse] = useState<Groessenklasse>("klein");
  const [status, setStatus] = useState<Status>("Entwurf");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const result = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const bilanz = buildBalanceSheet(accountsQ.data, entriesQ.data, {
      stichtag: bis,
    });
    const guv = buildGuv(accountsQ.data, entriesQ.data, {
      periodStart: von,
      stichtag: bis,
    });
    const builder = new EbilanzXbrlBuilder();
    return builder.build({
      unternehmen: {
        name,
        steuernummer: steuernr,
        strasse,
        plz,
        ort,
        rechtsform,
        groessenklasse: groesse,
      },
      wirtschaftsjahr: { von, bis },
      bilanz,
      guv,
      status,
    });
  }, [
    entriesQ.data,
    accountsQ.data,
    von,
    bis,
    name,
    steuernr,
    strasse,
    plz,
    ort,
    rechtsform,
    groesse,
    status,
  ]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleDownload() {
    if (!result) return;
    if (!result.validation.isValid) {
      toast.error(
        "Validierung fehlgeschlagen — siehe Fehler-Liste. XBRL sollte nicht übermittelt werden."
      );
      return;
    }
    downloadText(result.xml, `ebilanz_${von}_${bis}.xbrl`, "application/xml");
    toast.success("E-Bilanz XBRL exportiert.");
  }

  const stats = mappingStats();

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Steuer
        </Link>
        <div className="report__head-title">
          <h1>E-Bilanz XBRL (§ 5b EStG, Taxonomie 6.8)</h1>
          <p>
            HGB-Bilanz + GuV als XBRL-Instance für die Übermittlung an das
            Finanzamt (ELSTER). Nachgebildete Darstellung — ERiC-Integration
            und XSD-Validierung gegen offizielle Taxonomie-Dateien erfordern
            separate Tooling-Integration.
          </p>
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
          <strong>Nachgebildete Darstellung.</strong> Es werden {stats.bilanzCount} Bilanz-
          + {stats.guvCount} GuV-Elemente der HGB-Taxonomie 6.8 abgebildet
          (2025-04-01). Das erzeugte XBRL ist well-formed; eine Validierung
          gegen die offiziellen BMF-XSD-Dateien erfolgt NICHT. ELSTER-
          Übertragung erfolgt separat über ERiC.
        </div>
      </aside>

      {/* Form */}
      <section className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>
          Unternehmens-Stammdaten
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          <label>
            <span>Firmenname *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span>Steuernummer *</span>
            <input value={steuernr} onChange={(e) => setSteuernr(e.target.value)} />
          </label>
          <label>
            <span>Straße</span>
            <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
          </label>
          <label>
            <span>PLZ</span>
            <input value={plz} onChange={(e) => setPlz(e.target.value)} />
          </label>
          <label>
            <span>Ort</span>
            <input value={ort} onChange={(e) => setOrt(e.target.value)} />
          </label>
          <label>
            <span>Rechtsform</span>
            <select
              value={rechtsform}
              onChange={(e) => setRechtsform(e.target.value as Rechtsform)}
            >
              {RECHTSFORMEN.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Größenklasse (§ 267 HGB)</span>
            <select
              value={groesse}
              onChange={(e) => setGroesse(e.target.value as Groessenklasse)}
            >
              <option value="kleinst">Kleinstkapitalgesellschaft</option>
              <option value="klein">Klein</option>
              <option value="mittel">Mittel</option>
              <option value="gross">Gross</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              <option value="Entwurf">Entwurf</option>
              <option value="Endgueltig">Endgültig</option>
              <option value="Zurueckgezogen">Zurückgezogen</option>
            </select>
          </label>
          <label>
            <span>WJ von</span>
            <input type="date" value={von} onChange={(e) => setVon(e.target.value)} />
          </label>
          <label>
            <span>WJ bis</span>
            <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
          </label>
        </div>
      </section>

      {isLoading || !result ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade Daten …
        </div>
      ) : (
        <>
          {/* Validation */}
          <section
            className="card"
            style={{
              padding: 14,
              marginBottom: 12,
              borderLeft: `4px solid ${result.validation.isValid ? "#1f7a4d" : "#8a2c2c"}`,
              background: result.validation.isValid ? "#eaf5ef" : "#fcefea",
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
              {result.validation.isValid ? (
                <CheckCircle2 size={18} color="#1f7a4d" />
              ) : (
                <ShieldAlert size={18} color="#8a2c2c" />
              )}
              Validierung:{" "}
              {result.validation.isValid
                ? "OK — XBRL kann generiert werden"
                : `${result.validation.errors.length} Fehler — Übermittlung blockiert`}
            </h3>
            {result.validation.errors.length > 0 && (
              <ul style={{ fontSize: "0.85rem", margin: "6px 0 0 20px", color: "#8a2c2c" }}>
                {result.validation.errors.map((e, i) => (
                  <li key={i}>
                    <strong>[{e.code}]</strong> {e.field}: {e.message}
                  </li>
                ))}
              </ul>
            )}
            {result.validation.warnings.length > 0 && (
              <ul style={{ fontSize: "0.85rem", margin: "6px 0 0 20px", color: "#c76b3f" }}>
                {result.validation.warnings.map((w, i) => (
                  <li key={i}>
                    <strong>[{w.code}]</strong> {w.field}: {w.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={!result.validation.isValid}
            >
              <Download size={14} /> XBRL herunterladen
            </button>
            {!result.validation.isValid && (
              <span style={{ fontSize: "0.85rem", color: "#8a2c2c", alignSelf: "center" }}>
                <XCircle size={12} /> Download blockiert bis Validierung grün
              </span>
            )}
          </div>

          {/* Preview */}
          <section className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              XBRL-Vorschau (erste 40 Zeilen)
            </h3>
            <pre
              style={{
                padding: 10,
                background: "#f5f5f7",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre",
                overflow: "auto",
                margin: 0,
                maxHeight: 400,
              }}
            >
              {result.xml.split("\n").slice(0, 40).join("\n")}
              {"\n…"}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
