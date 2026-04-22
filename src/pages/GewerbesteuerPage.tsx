import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
  FileText,
  Info,
  Printer,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { buildEuer } from "../api/euer";
import { defaultPeriodYtd, type PeriodFilter } from "../api/reports";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { getSteuerParameter, STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import { FORM_META } from "../data/formMeta";
import { log as auditLog } from "../api/audit";
import FormMetaBadge from "../components/FormMetaBadge";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import {
  readEstForm,
  writeEstForm,
  migrateEstFormsV2ToV3,
} from "../domain/est/estStorage";
import { exportTableToPdf, type TableRow } from "../utils/exporters";
import "./ReportView.css";
import "./TaxCalc.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// Gewerbesteuer — vereinfachte Berechnung 2024/2025:
//
//   Gewinn aus Gewerbebetrieb (laut EStG)
//   + Hinzurechnungen (§ 8 GewStG, u. a. 25 % der Entgelte für Schulden)
//   − Kürzungen (§ 9 GewStG)
//   = Gewerbeertrag
//   − Freibetrag für natürliche Personen und Personengesellschaften: 24.500 €
//   = maßgebender Gewerbeertrag (abgerundet auf volle 100 €)
//   × Steuermesszahl 3,5 %
//   = Steuermessbetrag
//   × Hebesatz der Gemeinde (z. B. 400 %)
//   = Gewerbesteuer

const FORM_ID = "gewst";

type State = {
  hinzurechnungen: number;
  kuerzungen: number;
  hebesatz: number; // in Prozent, z. B. 400
  istNatPerson: boolean; // natürliche Person / Personengesellschaft = Freibetrag
  manuellerGewinn: string; // "" = aus EÜR übernehmen
};

const DEFAULT: State = {
  hinzurechnungen: 0,
  kuerzungen: 0,
  hebesatz: 400,
  istNatPerson: true,
  manuellerGewinn: "",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function GewerbesteuerPage() {
  return (
    <MandantRequiredGuard>
      <GewerbesteuerPageInner />
    </MandantRequiredGuard>
  );
}

function GewerbesteuerPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const steuer = getSteuerParameter(selectedYear);
  const MESSZAHL = steuer.gewst_messzahl_pct;
  const FREIBETRAG_NAT = steuer.gewst_freibetrag_natperson_euro;
  const [period, setPeriod] = useState<PeriodFilter>(defaultPeriodYtd);
  const [form, setForm] = useState<State>(() => {
    const stored = readEstForm<Partial<State>>(
      FORM_ID,
      selectedMandantId,
      selectedYear
    );
    return stored ? { ...DEFAULT, ...stored } : DEFAULT;
  });

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const euer = useMemo(
    () =>
      buildEuer(
        entriesQ.data ?? [],
        accountsQ.data ?? [],
        period,
        selectedMandantId
      ),
    [entriesQ.data, accountsQ.data, period, selectedMandantId]
  );

  const gewinnAusEuer = euer.gewinn;
  const gewinn = form.manuellerGewinn.trim()
    ? Number(form.manuellerGewinn.replace(",", "."))
    : gewinnAusEuer;

  const gewerbeertrag = gewinn + form.hinzurechnungen - form.kuerzungen;
  const nachFreibetrag = form.istNatPerson
    ? Math.max(0, gewerbeertrag - FREIBETRAG_NAT)
    : Math.max(0, gewerbeertrag);
  const massgebend = Math.floor(nachFreibetrag / 100) * 100; // auf volle 100 abgerundet
  const messbetrag = round2((massgebend * MESSZAHL) / 100);
  const gewerbesteuer = round2((messbetrag * form.hebesatz) / 100);

  function save() {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META.gewst;
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "gewst",
      summary: `Gewerbesteuer gespeichert (FormVersion ${meta.version}, VZ ${meta.veranlagungsjahr}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "gewst",
        formVersion: meta.version,
        veranlagungsjahr: meta.veranlagungsjahr,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        period,
        form,
        gewinn,
        gewerbeertrag,
        massgebend,
        messbetrag,
        gewerbesteuer,
      },
    });
    toast.success("Gewerbesteuer-Berechnung gespeichert.");
  }

  async function handlePdf() {
    const rows: TableRow[] = [
      ["Gewinn aus Gewerbebetrieb", gewinn],
      ["+ Hinzurechnungen (§ 8 GewStG)", form.hinzurechnungen],
      ["− Kürzungen (§ 9 GewStG)", -form.kuerzungen],
      ["= Gewerbeertrag", gewerbeertrag],
      [
        form.istNatPerson
          ? `− Freibetrag (natürliche Person): ${euro.format(FREIBETRAG_NAT)}`
          : "Kein Freibetrag",
        form.istNatPerson ? -FREIBETRAG_NAT : 0,
      ],
      ["= maßgebender Gewerbeertrag (abgerundet)", massgebend],
      [`× Steuermesszahl ${MESSZAHL} %`, messbetrag],
      [`× Hebesatz ${form.hebesatz} %`, gewerbesteuer],
    ];
    try {
      await exportTableToPdf(
        {
          title: "Gewerbesteuer-Berechnung",
          subtitle: `${settings.kanzleiName} · ${period.start} – ${period.end}`,
          columns: [
            { header: "Position", width: 50 },
            { header: "Betrag", width: 20, alignRight: true },
          ],
          rows,
          footer: ["Gewerbesteuer (Zahllast)", gewerbesteuer] as TableRow,
        },
        `gewerbesteuer_${period.start}_${period.end}.pdf`
      );
      toast.success("PDF exportiert.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  return (
    <div className="report taxcalc">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Gewerbesteuer</h1>
          <p>
            Vereinfachte Berechnung der Gewerbesteuer gemäß § 7 ff. GewStG. Für
            die finale Erklärung ist eine steuerrechtliche Prüfung notwendig.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Zeitraum von</span>
            <input
              type="date"
              value={period.start}
              onChange={(e) =>
                setPeriod((p) => ({ ...p, start: e.target.value }))
              }
            />
          </label>
          <label>
            <span>bis</span>
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
          <button type="button" className="btn btn-outline" onClick={handlePdf}>
            <FileText size={16} />
            PDF
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            <Save size={16} />
            Speichern
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          Gewerbesteuer · {period.start} – {period.end}
        </span>
      </div>

      <FormMetaBadge formId="gewst" />

      <section className="card taxcalc__section">
        <h2>Eingabe</h2>

        <div className="form-grid">
          <label className="form-field">
            <span>
              Gewinn aus Gewerbebetrieb (€){" "}
              <small style={{ color: "var(--muted)" }}>
                leer = aus EÜR übernehmen ({euro.format(gewinnAusEuer)})
              </small>
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={form.manuellerGewinn}
              onChange={(e) =>
                setForm((f) => ({ ...f, manuellerGewinn: e.target.value }))
              }
              placeholder={gewinnAusEuer.toFixed(2).replace(".", ",")}
            />
          </label>

          <label className="form-field">
            <span>Hinzurechnungen (§ 8 GewStG, €)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.hinzurechnungen}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  hinzurechnungen: Number(e.target.value),
                }))
              }
            />
          </label>

          <label className="form-field">
            <span>Kürzungen (§ 9 GewStG, €)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.kuerzungen}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kuerzungen: Number(e.target.value),
                }))
              }
            />
          </label>

          <label className="form-field">
            <span>Hebesatz Gemeinde (%)</span>
            <input
              type="number"
              step="1"
              min="200"
              max="900"
              value={form.hebesatz}
              onChange={(e) =>
                setForm((f) => ({ ...f, hebesatz: Number(e.target.value) }))
              }
            />
          </label>

          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.istNatPerson}
              onChange={(e) =>
                setForm((f) => ({ ...f, istNatPerson: e.target.checked }))
              }
            />
            <span>
              Natürliche Person / Personengesellschaft (Freibetrag 24.500 €
              anwenden)
            </span>
          </label>
        </div>

        <aside className="taxcalc__hint">
          <Info size={14} />
          <span>
            Typische Hinzurechnungen: 25 % der Entgelte für Schulden, 20 % der
            Mieten/Pachten für bewegliche Wirtschaftsgüter, 50 % für unbewegliche.
            Typische Kürzungen: 1,2 % des Grundstücks-Einheitswerts,
            Gewinnanteile aus gewerblichen Personengesellschaften.
          </span>
        </aside>
      </section>

      <section className="card taxcalc__section">
        <h2>Berechnung</h2>
        <table className="report__table">
          <tbody>
            <Row label="Gewinn aus Gewerbebetrieb" value={gewinn} />
            <Row label="+ Hinzurechnungen" value={form.hinzurechnungen} />
            <Row label="− Kürzungen" value={-form.kuerzungen} />
            <Row label="= Gewerbeertrag" value={gewerbeertrag} bold />
            {form.istNatPerson && (
              <Row
                label={`− Freibetrag natürliche Personen (${euro.format(FREIBETRAG_NAT)})`}
                value={-Math.min(gewerbeertrag, FREIBETRAG_NAT)}
              />
            )}
            <Row
              label="= maßgebender Gewerbeertrag (abgerundet auf 100 €)"
              value={massgebend}
              bold
            />
            <Row
              label={`× Steuermesszahl ${MESSZAHL} %`}
              value={messbetrag}
              bold
            />
            <Row
              label={`× Hebesatz ${form.hebesatz} %`}
              value={gewerbesteuer}
              bold
            />
          </tbody>
        </table>
      </section>

      <div className="report__result">
        <span>
          <Calculator
            size={14}
            style={{ verticalAlign: "-2px", marginRight: 6 }}
          />
          Gewerbesteuer (Jahresbetrag)
        </span>
        <strong>{euro.format(gewerbesteuer)}</strong>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <tr className={bold ? "is-result" : undefined}>
      <td>
        {bold ? <strong>{label}</strong> : label}
      </td>
      <td className="is-num mono">{euro.format(value)}</td>
    </tr>
  );
}
