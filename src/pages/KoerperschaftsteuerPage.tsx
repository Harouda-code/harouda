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

// Körperschaftsteuer 2024/2025:
//   KSt-Satz: 15 %
//   Solidaritätszuschlag auf KSt: 5,5 %
//
// Für eine zusätzliche Gesamtbelastungs-Schau kann die GewSt-Last auf
// Basis des Hebesatzes der Gemeinde ergänzt werden.

const FORM_ID = "kst";

type State = {
  manuellerGewinn: string; // overrides EÜR gewinn
  hinzurechnungen: number; // KSt-Modifikationen (§ 8 KStG, nicht abziehbare Aufwendungen)
  kuerzungen: number;
  hebesatz: number; // für die Gesamtbelastungs-Schau
};

const DEFAULT: State = {
  manuellerGewinn: "",
  hinzurechnungen: 0,
  kuerzungen: 0,
  hebesatz: 400,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function KoerperschaftsteuerPage() {
  return (
    <MandantRequiredGuard>
      <KoerperschaftsteuerPageInner />
    </MandantRequiredGuard>
  );
}

function KoerperschaftsteuerPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const steuer = getSteuerParameter(selectedYear);
  const KST_SATZ = steuer.kst_satz_pct;
  const SOLI_SATZ = steuer.soli_satz_pct;
  const GEWST_MESSZAHL = steuer.gewst_messzahl_pct;
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

  const handelsbilanzGewinn = euer.gewinn;
  const steuerlicherGewinn = form.manuellerGewinn.trim()
    ? Number(form.manuellerGewinn.replace(",", "."))
    : handelsbilanzGewinn;
  const einkommen =
    steuerlicherGewinn + form.hinzurechnungen - form.kuerzungen;

  const koerperschaftsteuer = round2((Math.max(0, einkommen) * KST_SATZ) / 100);
  const soli = round2((koerperschaftsteuer * SOLI_SATZ) / 100);
  const kstPlusSoli = round2(koerperschaftsteuer + soli);

  // Gewerbesteuer-Schau (für die Gesamtbelastungs-Hinweisbox, mit Freibetrag 0
  // für juristische Personen)
  const massgebend = Math.max(0, Math.floor(einkommen / 100) * 100);
  const gewMessbetrag = round2((massgebend * GEWST_MESSZAHL) / 100);
  const gewerbesteuer = round2((gewMessbetrag * form.hebesatz) / 100);
  const gesamt = round2(kstPlusSoli + gewerbesteuer);

  function save() {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META.kst;
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "kst",
      summary: `KSt gespeichert (FormVersion ${meta.version}, VZ ${meta.veranlagungsjahr}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "kst",
        formVersion: meta.version,
        veranlagungsjahr: meta.veranlagungsjahr,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        form,
        period,
        einkommen,
        koerperschaftsteuer,
        soli,
        kstPlusSoli,
        gewerbesteuer,
        gesamt,
      },
    });
    toast.success("KSt-Berechnung gespeichert.");
  }

  async function handlePdf() {
    const rows: TableRow[] = [
      ["Jahresüberschuss (Handelsbilanz)", handelsbilanzGewinn],
      ["Steuerlicher Gewinn", steuerlicherGewinn],
      ["+ Hinzurechnungen § 8 KStG", form.hinzurechnungen],
      ["− Kürzungen", -form.kuerzungen],
      ["= Einkommen (§ 7 KStG)", einkommen],
      [`× ${KST_SATZ} % Körperschaftsteuer`, koerperschaftsteuer],
      [`+ ${SOLI_SATZ} % Solidaritätszuschlag auf KSt`, soli],
      ["= KSt + Soli", kstPlusSoli],
      [`+ Gewerbesteuer (Hebesatz ${form.hebesatz} %)`, gewerbesteuer],
    ];
    try {
      await exportTableToPdf(
        {
          title: "Körperschaftsteuer",
          subtitle: `${settings.kanzleiName} · ${period.start} – ${period.end}`,
          columns: [
            { header: "Position", width: 50 },
            { header: "Betrag", width: 20, alignRight: true },
          ],
          rows,
          footer: ["Gesamtbelastung (KSt + Soli + GewSt)", gesamt] as TableRow,
        },
        `kst_${period.start}_${period.end}.pdf`
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
          <h1>Körperschaftsteuer</h1>
          <p>
            Vereinfachte Berechnung für Kapitalgesellschaften (GmbH, UG, AG):
            15 % KSt + 5,5 % Solidaritätszuschlag. Für die finale Erklärung ist
            eine steuerrechtliche Prüfung notwendig.
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
          KSt · {period.start} – {period.end}
        </span>
      </div>

      <FormMetaBadge formId="kst" />

      <section className="card taxcalc__section">
        <h2>Eingabe</h2>
        <div className="form-grid">
          <label className="form-field form-field--wide">
            <span>
              Steuerlicher Gewinn (€){" "}
              <small style={{ color: "var(--muted)" }}>
                leer = aus EÜR übernehmen ({euro.format(handelsbilanzGewinn)})
              </small>
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={form.manuellerGewinn}
              onChange={(e) =>
                setForm((f) => ({ ...f, manuellerGewinn: e.target.value }))
              }
              placeholder={handelsbilanzGewinn.toFixed(2).replace(".", ",")}
            />
          </label>

          <label className="form-field">
            <span>Hinzurechnungen § 8 KStG (€)</span>
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
            <span>Kürzungen (€)</span>
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
            <span>Hebesatz Gewerbesteuer (%)</span>
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
        </div>

        <aside className="taxcalc__hint">
          <Info size={14} />
          <span>
            Hinzurechnungen umfassen typisch nicht abziehbare Aufwendungen
            (z. B. 30 % der Bewirtungskosten, bestimmte Spenden oberhalb des
            Höchstbetrags, Steuern vom Einkommen). Kürzungen z. B. steuerfreie
            Erträge (§ 8b KStG).
          </span>
        </aside>
      </section>

      <section className="card taxcalc__section">
        <h2>Berechnung</h2>
        <table className="report__table">
          <tbody>
            <Row label="Steuerlicher Gewinn" value={steuerlicherGewinn} />
            <Row label="+ Hinzurechnungen § 8 KStG" value={form.hinzurechnungen} />
            <Row label="− Kürzungen" value={-form.kuerzungen} />
            <Row label="= Einkommen" value={einkommen} bold />
            <Row
              label={`× Körperschaftsteuersatz ${KST_SATZ} %`}
              value={koerperschaftsteuer}
              bold
            />
            <Row
              label={`+ Solidaritätszuschlag ${SOLI_SATZ} % auf KSt`}
              value={soli}
            />
            <Row label="= KSt + Soli" value={kstPlusSoli} bold />
            <Row
              label={`+ Gewerbesteuer (Hebesatz ${form.hebesatz} %, geschätzt)`}
              value={gewerbesteuer}
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
          Gesamtbelastung KSt + Soli + GewSt
        </span>
        <strong>{euro.format(gesamt)}</strong>
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
      <td>{bold ? <strong>{label}</strong> : label}</td>
      <td className="is-num mono">{euro.format(value)}</td>
    </tr>
  );
}
