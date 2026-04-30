import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Printer,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { exportTableToPdf, type TableRow } from "../utils/exporters";
import { FORM_META, type FormId } from "../data/formMeta";
import { STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import { log as auditLog } from "../api/audit";
import {
  buildEstStorageKey,
  migrateEstFormsV2ToV3,
} from "../domain/est/estStorage";
import { MandantRequiredGuard } from "./MandantRequiredGuard";
import FormMetaBadge from "./FormMetaBadge";
import {
  BmfForm,
  BmfSection,
  BmfInputRow,
  BmfResult,
  BmfSignatures,
  BmfFootnotes,
} from "./BmfForm";
import "../pages/ReportView.css";
import "../pages/TaxCalc.css";
import "./TaxFormBuilder.css";

export type FieldSpec = {
  key: string;
  label: string;
  hint?: string;
  /** Optional BMF Kennzahl (Zeilen-Nr.) to show in the left cell. */
  kz?: string;
  /** Phase 3 / Schritt 9: Wertquelle.
   *  - "manual" (default): User-Input, in localStorage persistiert.
   *  - "gl-derived": read-only aus dem Builder-Output; Klick öffnet
   *    Drill-down. Der Wert wird NICHT in localStorage gespeichert. */
  source?: "manual" | "gl-derived";
  /** Schlüssel im `glValues`-Map, von dem der Wert gezogen wird.
   *  Pflicht bei `source === "gl-derived"`. Muss mit dem Feld-Namen im
   *  Builder-Output (z. B. `AnlageGReport.summen`) übereinstimmen. */
  glField?: string;
};

export type SectionSpec = {
  title: string;
  description?: string;
  sign: "plus" | "minus";
  fields: FieldSpec[];
};

export type FormSpec = {
  title: string;
  subtitle: string;
  resultLabel: string;
  sections: SectionSpec[];
  formId: FormId;
};

function loadDraft(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** Phase 3 / Schritt 9: Read-only-Zeile für GL-derived Felder.
 *  Öffnet auf Klick das DrillDownModal (Callback wird vom Page-Layer
 *  gesetzt). Input ist tabbable + `readOnly`; Klick auf Input oder
 *  Badge triggert `onClick`.
 */
function GlDerivedRow({
  kz,
  label,
  hint,
  value,
  onClick,
}: {
  kz: string;
  label: string;
  hint?: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <div className="bmf-form__row" data-source="gl-derived">
      <div
        className={`bmf-form__kz-cell${kz ? "" : " bmf-form__kz-cell--empty"}`}
      >
        {kz}
      </div>
      <label className="bmf-form__label">
        <span>
          {label}
          {hint && <span className="bmf-form__label-hint">{hint}</span>}
        </span>
      </label>
      <div
        className="bmf-form__amount"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <input
          type="number"
          className="bmf-form__amount-input"
          value={value === 0 ? "" : value}
          readOnly
          onClick={onClick}
          placeholder="0,00"
          aria-label={`${label} — aus Buchhaltung, klicken für Drill-down`}
          data-testid={`gl-field-${label}`}
          style={{ cursor: "pointer", background: "var(--ivory-100, #f6f7f9)" }}
        />
        <button
          type="button"
          onClick={onClick}
          title="Aus Buchhaltung berechnet — klicken für Einzelposten"
          aria-label="Drill-down öffnen"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            border: "1px solid var(--border, #c3c8d1)",
            borderRadius: 4,
            background: "var(--ivory-100, #f6f7f9)",
            color: "var(--navy, #15233d)",
            cursor: "pointer",
            fontSize: "0.7rem",
            whiteSpace: "nowrap",
          }}
          data-testid="gl-drill-btn"
        >
          <BookOpen size={12} />
          Aus Buchhaltung
        </button>
      </div>
    </div>
  );
}

export type TaxFormBuilderProps = {
  spec: FormSpec;
  /** Werte für `source === "gl-derived"`-Felder, Schlüssel = glField. */
  glValues?: Record<string, number>;
  /** Klick auf ein gl-derived-Feld öffnet das Drill-down auf Page-Ebene. */
  onDrillDown?: (info: {
    fieldKey: string;
    label: string;
    glField: string;
  }) => void;
  /** Smart-Banner-Sprint: Slot zwischen `print-header` und FormMetaBadge
   *  für Warning-/Info-Banner. `undefined` = nichts gerendert,
   *  rückwärtskompatibel. */
  aboveForm?: ReactNode;
  /** Smart-Banner-Sprint: Export-Lock. Bei `true` ist der PDF-Export-
   *  Button disabled (GoBD-Safety in Simulation-Mode). */
  disableExport?: boolean;
};

export default function TaxFormBuilder(props: TaxFormBuilderProps) {
  return (
    <MandantRequiredGuard>
      <TaxFormBuilderInner {...props} />
    </MandantRequiredGuard>
  );
}

function TaxFormBuilderInner({
  spec,
  glValues,
  onDrillDown,
  aboveForm,
  disableExport,
}: TaxFormBuilderProps) {
  const { settings } = useSettings();
  const { selectedMandantId } = useMandant();
  // Phase 3 · Schritt 3: Jahr-Scope selbst aus useYear lesen — das hält
  // die 2 Konsumenten (AnlageGPage, AnlageSPage) minimal.
  const { selectedYear } = useYear();
  // Innerhalb des Guards ist mandantId garantiert gesetzt.
  const storageKey = buildEstStorageKey(
    spec.formId,
    selectedMandantId,
    selectedYear
  );
  const [values, setValues] = useState<Record<string, number>>(() =>
    loadDraft(storageKey)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(spec.formId, selectedMandantId, selectedYear);
    localStorage.setItem(storageKey, JSON.stringify(values));
  }, [spec.formId, selectedMandantId, selectedYear, storageKey, values]);

  function set(key: string, v: number) {
    setValues((vs) => ({ ...vs, [key]: v }));
  }

  /** Resolve den Anzeige-Wert eines Feldes abhängig von `source`. */
  function valueOf(f: FieldSpec): number {
    if (f.source === "gl-derived") {
      if (!f.glField) return 0;
      const v = glValues?.[f.glField];
      if (v === undefined && glValues !== undefined) {
         
        console.warn(
          `[TaxFormBuilder] ${spec.formId}: gl-derived Feld "${f.key}" referenziert glField "${f.glField}", der nicht im Builder-Output vorhanden ist. Anzeige 0,00.`
        );
      }
      return Number(v) || 0;
    }
    return Number(values[f.key]) || 0;
  }

  const sectionTotals = useMemo(
    () =>
      spec.sections.map((s) => s.fields.reduce((sum, f) => sum + valueOf(f), 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec.sections, values, glValues]
  );

  const result = useMemo(() => {
    let sum = 0;
    spec.sections.forEach((s, i) => {
      sum += sectionTotals[i] * (s.sign === "plus" ? 1 : -1);
    });
    return sum;
  }, [spec.sections, sectionTotals]);

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(values));
    const meta = FORM_META[spec.formId];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: spec.formId,
      summary: `${spec.title} gespeichert (FormVersion ${meta.version}, VZ ${meta.veranlagungsjahr}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: spec.formId,
        formVersion: meta.version,
        veranlagungsjahr: meta.veranlagungsjahr,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        result,
        values,
      },
    });
    toast.success("Entwurf gespeichert.");
  }

  function reset() {
    if (!confirm("Alle Eingaben zurücksetzen?")) return;
    setValues({});
    localStorage.removeItem(storageKey);
    toast.info("Formular zurückgesetzt.");
  }

  async function handlePdf() {
    const rows: TableRow[] = [];
    spec.sections.forEach((s, i) => {
      rows.push([`— ${s.title} —`, "", ""]);
      s.fields.forEach((f) => {
        rows.push(["", f.label, valueOf(f)]);
      });
      rows.push([
        `Summe ${s.title}`,
        "",
        sectionTotals[i] * (s.sign === "minus" ? -1 : 1),
      ]);
    });
    try {
      await exportTableToPdf(
        {
          title: spec.title,
          subtitle: `${settings.kanzleiName} · ${new Date().toLocaleDateString("de-DE")}`,
          columns: [
            { header: "", width: 8 },
            { header: "Position", width: 48 },
            { header: "Betrag", width: 18, alignRight: true },
          ],
          rows,
          footer: [spec.resultLabel, "", result] as TableRow,
        },
        `${spec.formId.replace(/[^a-z0-9]+/gi, "_")}.pdf`
      );
      toast.success("PDF exportiert.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  return (
    <div className="report taxform">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>{spec.title}</h1>
          <p>{spec.subtitle}</p>
        </div>
        <div className="period">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={reset}
            title="Alle Eingaben löschen"
          >
            <RotateCcw size={16} />
            Zurücksetzen
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Drucken
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePdf}
            disabled={disableExport}
            title={
              disableExport
                ? "PDF-Export deaktiviert: Simulation-Modus aktiv"
                : undefined
            }
            data-testid="taxform-pdf-btn"
          >
            <FileText size={16} />
            PDF
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            <Save size={16} />
            Entwurf speichern
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">{spec.title}</span>
      </div>

      {aboveForm}

      <FormMetaBadge formId={spec.formId} />

      <BmfForm title={spec.title} subtitle={spec.subtitle}>
        {spec.sections.map((section, i) => {
          const signed =
            sectionTotals[i] * (section.sign === "minus" ? -1 : 1);
          return (
            <BmfSection
              key={section.title}
              title={`${section.title}${section.sign === "minus" ? " (abziehbar)" : ""}`}
              description={section.description}
              total={signed}
            >
              {section.fields.map((f) => {
                if (f.source === "gl-derived") {
                  return (
                    <GlDerivedRow
                      key={f.key}
                      kz={f.kz ?? ""}
                      label={f.label}
                      hint={f.hint}
                      value={valueOf(f)}
                      onClick={() =>
                        onDrillDown?.({
                          fieldKey: f.key,
                          label: f.label,
                          glField: f.glField ?? f.key,
                        })
                      }
                    />
                  );
                }
                return (
                  <BmfInputRow
                    key={f.key}
                    kz={f.kz ?? ""}
                    label={f.label}
                    hint={f.hint}
                    value={values[f.key] ?? 0}
                    onChange={(v) => set(f.key, v)}
                  />
                );
              })}
            </BmfSection>
          );
        })}

        <BmfResult
          label={spec.resultLabel}
          value={result}
          variant={
            result > 0 ? "gewinn" : result < 0 ? "verlust" : "primary"
          }
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtiger" />

        <BmfFootnotes>
          <p>
            Entwurf wird automatisch im Browser gespeichert. Vor Einreichung
            beim Finanzamt durch eine qualifizierte Person prüfen lassen.
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet.
          </p>
        </BmfFootnotes>
      </BmfForm>
    </div>
  );
}
