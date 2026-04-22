import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import { FORM_META } from "../data/formMeta";
import { log as auditLog } from "../api/audit";
import FormMetaBadge from "../components/FormMetaBadge";
import { useMandant } from "../contexts/MandantContext";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import {
  readEstForm,
  writeEstForm,
  migrateEstFormsV2ToV3,
} from "../domain/est/estStorage";
import {
  BmfForm,
  BmfSection,
  BmfInputRow,
  BmfRow,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

type JaNein = "ja" | "nein" | "";

type Ferienwohnung = {
  anlageVNr: string;
  aktenzeichen: string;
  bezeichnung: string;
  wohnflaeche: number;
  selbst_genutzt: JaNein;
  tage_selbstnutzung: number;
  tage_vermietung: number;
  tage_leerstand: number;
  ortsueblich_tage: number;
  vermittler_nicht_nah: JaNein;
  eigenes_haus: JaNein;
  weitere_eigene: JaNein;
};

const EMPTY_FW: Ferienwohnung = {
  anlageVNr: "",
  aktenzeichen: "",
  bezeichnung: "",
  wohnflaeche: 0,
  selbst_genutzt: "",
  tage_selbstnutzung: 0,
  tage_vermietung: 0,
  tage_leerstand: 0,
  ortsueblich_tage: 0,
  vermittler_nicht_nah: "",
  eigenes_haus: "",
  weitere_eigene: "",
};

type AnlageVFeWo = {
  fw: [Ferienwohnung, Ferienwohnung, Ferienwohnung, Ferienwohnung];
};

const DEFAULT: AnlageVFeWo = {
  fw: [EMPTY_FW, EMPTY_FW, EMPTY_FW, EMPTY_FW],
};

const FORM_ID = "anlage-v-fewo";

function loadForm(mandantId: string | null, jahr: number): AnlageVFeWo {
  const parsed = readEstForm<
    Partial<AnlageVFeWo> & { fw?: Partial<Ferienwohnung>[] }
  >(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  const arr = parsed.fw ?? [];
  const fw: Ferienwohnung[] = [0, 1, 2, 3].map((i) => ({
    ...EMPTY_FW,
    ...(arr[i] ?? {}),
  }));
  return {
    fw: [fw[0], fw[1], fw[2], fw[3]] as AnlageVFeWo["fw"],
  };
}

/** Zeilen-Basis für jede der 4 Ferienwohnungen. Z. 4-13 für FW1, 14-23
 *  für FW2 usw. — Delta von 10 Zeilen zwischen den Wohnungen. */
const ZEILEN_BASIS = [4, 14, 24, 34];

export default function AnlageVFeWoPage() {
  return (
    <MandantRequiredGuard>
      <AnlageVFeWoPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageVFeWoPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageVFeWo>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function updateFw<K extends keyof Ferienwohnung>(
    idx: number,
    key: K,
    value: Ferienwohnung[K]
  ) {
    setForm((f) => {
      const fw = [...f.fw] as AnlageVFeWo["fw"];
      fw[idx] = { ...fw[idx], [key]: value };
      return { fw };
    });
  }

  const perFw = useMemo(
    () =>
      form.fw.map((fw) => {
        const tageGesamt =
          fw.tage_selbstnutzung + fw.tage_vermietung + fw.tage_leerstand;
        const anteilVermietung =
          fw.tage_selbstnutzung + fw.tage_vermietung > 0
            ? fw.tage_vermietung /
              (fw.tage_selbstnutzung + fw.tage_vermietung)
            : 0;
        const exceedsYear = tageGesamt > 366;
        return {
          tageGesamt,
          anteilVermietung,
          exceedsYear,
          hasData:
            fw.anlageVNr.trim() !== "" ||
            fw.bezeichnung.trim() !== "" ||
            fw.wohnflaeche > 0 ||
            tageGesamt > 0,
        };
      }),
    [form.fw]
  );

  function validate(): string[] {
    const warnings: string[] = [];
    form.fw.forEach((fw, i) => {
      const derived = perFw[i];
      if (!derived.hasData) return;
      if (derived.exceedsYear) {
        warnings.push(
          `Ferienwohnung ${i + 1}: Selbstnutzung + Vermietung + Leerstand = ${derived.tageGesamt} Tage überschreitet 366.`
        );
      }
      if (fw.wohnflaeche < 0) {
        warnings.push(
          `Ferienwohnung ${i + 1}: Wohnfläche darf nicht negativ sein.`
        );
      }
      if (
        fw.aktenzeichen &&
        !/^[A-Za-z0-9\s/-]*$/.test(fw.aktenzeichen)
      ) {
        warnings.push(
          `Ferienwohnung ${i + 1}: Aktenzeichen enthält Sonderzeichen (nur Buchstaben/Ziffern/-/Leerzeichen erlaubt).`
        );
      }
    });
    return warnings;
  }

  function save() {
    const warnings = validate();
    if (warnings.length > 0) {
      toast.warning(warnings.join(" · "), { duration: 7000 });
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-v-fewo"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-v-fewo",
      summary: `Anlage V-FeWo gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-v-fewo",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        perFw,
        form,
      },
    });
    toast.success("Anlage V-FeWo gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage V-FeWo</h1>
          <p>
            Ergänzung zur Anlage V · Ferienwohnungen / kurzfristige Vermietung.
            Bis zu 4 Objekte je Formular · VZ {selectedYear}.
          </p>
        </div>
        <div className="period">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Drucken
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
          Anlage V-FeWo · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-v-fewo" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Hinweis zur Abzugsfähigkeit:</strong> Werbungskosten sind
          nur insoweit abzugsfähig, wie die Vermietung den Gesamttagen
          entspricht. Leerstand wird nach BFH-Rechtsprechung proportional
          aufgeteilt; eine vorübergehende Selbstnutzung kann den
          Werbungskostenabzug einschränken (§ 21 EStG iVm BFH IX R 9/08).
          Die exakte Berechnung ist hier NICHT automatisiert.
        </div>
      </aside>

      <BmfForm
        title="Anlage V-FeWo"
        subtitle={`Ferienwohnungen / kurzfristige Vermietung · VZ ${selectedYear}`}
      >
        {form.fw.map((fw, idx) => {
          const derived = perFw[idx];
          const base = ZEILEN_BASIS[idx];
          return (
            <FerienwohnungBlock
              key={idx}
              idx={idx}
              base={base}
              fw={fw}
              tageGesamt={derived.tageGesamt}
              anteilVermietung={derived.anteilVermietung}
              exceedsYear={derived.exceedsYear}
              onChange={(key, value) => updateFw(idx, key, value)}
            />
          );
        })}

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Tage gesamt</strong> = Selbstnutzung + Vermietung +
            Leerstand. Überschreitung von 366 wird als Warnung angezeigt.
          </p>
          <p>
            <strong>Vermietungsanteil</strong> = Vermietungstage / (Vermietungstage
            + Selbstnutzungstage). Hinweis für die WK-Aufteilung — die
            amtliche Zurechnung berücksichtigt zusätzlich Leerstand und
            ortsübliche Vermietungstage (BFH IX R 9/08, § 21 EStG).
          </p>
          <p>
            <strong>Verknüpfung mit Anlage V:</strong> Die unter Z. 4 / Z. 14
            / Z. 24 / Z. 34 eingetragene laufende Nummer verweist auf das
            jeweilige Objekt in der Hauptform Anlage V. Dort werden die
            Mieteinnahmen und Werbungskosten im Detail erfasst.
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Übermittlung
            erfolgt elektronisch über ELSTER.
          </p>
        </BmfFootnotes>
      </BmfForm>
    </div>
  );
}

// --- Ferienwohnung block -----------------------------------------------

type FwBlockProps = {
  idx: number;
  base: number;
  fw: Ferienwohnung;
  tageGesamt: number;
  anteilVermietung: number;
  exceedsYear: boolean;
  onChange: <K extends keyof Ferienwohnung>(
    key: K,
    value: Ferienwohnung[K]
  ) => void;
};

function FerienwohnungBlock(props: FwBlockProps) {
  const { idx, base, fw, tageGesamt, anteilVermietung, exceedsYear, onChange } =
    props;
  const title = `${idx + 1}. Ferienwohnung / kurzfristig vermietete Wohnung`;
  const subtitle = fw.bezeichnung
    ? ` — ${fw.bezeichnung}`
    : fw.anlageVNr
      ? ` — lfd. Nr. ${fw.anlageVNr}`
      : "";

  return (
    <>
      <BmfSection
        title={`${title}${subtitle} (Z. ${base}–${base + 9})`}
        description="Allgemeine Angaben · Z. 4/14/24/34 verweist auf die laufende Nummer in der Hauptform Anlage V."
      >
        <TextRow
          zeile={String(base)}
          label="Zur Anlage V mit der laufenden Nummer"
          value={fw.anlageVNr}
          onChange={(v) => onChange("anlageVNr", v)}
          placeholder="z. B. 1"
        />
        <TextRow
          zeile={String(base + 1)}
          label="Aktenzeichen laut Grundsteuermessbescheid"
          value={fw.aktenzeichen}
          onChange={(v) => onChange("aktenzeichen", v)}
          placeholder="ohne Sonderzeichen"
        />
        <TextRow
          zeile={String(base + 2)}
          label="Nähere Bezeichnung der Ferienwohnung (optional)"
          value={fw.bezeichnung}
          onChange={(v) => onChange("bezeichnung", v)}
          placeholder="z. B. Haus am See, Wohnung 2"
        />
        <BmfInputRow
          kz=""
          label="Wohnfläche"
          hint={`Z. ${base + 3} · in m²`}
          value={fw.wohnflaeche}
          onChange={(v) => onChange("wohnflaeche", v)}
          step={0.01}
        />
      </BmfSection>

      <BmfSection
        title={`Angaben zur Nutzung · Ferienwohnung ${idx + 1}`}
        description="Die Aufteilung der Tage entscheidet über den Anteil der Werbungskosten, der abgezogen werden kann."
      >
        <JaNeinRow
          zeile={String(base + 4)}
          label={`Wurde die Wohnung im Jahr ${new Date().getFullYear()} auch selbst genutzt?`}
          value={fw.selbst_genutzt}
          onChange={(v) => onChange("selbst_genutzt", v)}
        />
        <TripleDaysRow
          zeile={String(base + 5)}
          label="Tage der Selbstnutzung · Vermietung · Leerstand"
          a={fw.tage_selbstnutzung}
          b={fw.tage_vermietung}
          c={fw.tage_leerstand}
          onChange={(which, v) => {
            if (which === "a") onChange("tage_selbstnutzung", v);
            else if (which === "b") onChange("tage_vermietung", v);
            else onChange("tage_leerstand", v);
          }}
        />
        <BmfInputRow
          kz=""
          label="Ortsübliche Vermietungstage"
          hint={`Z. ${base + 6} · Vergleichswert der Gemeinde`}
          value={fw.ortsueblich_tage}
          onChange={(v) => onChange("ortsueblich_tage", v)}
          step={1}
        />
        <JaNeinRow
          zeile={String(base + 7)}
          label="Wurde die Vermietung einem nicht nahe stehenden Vermittler übertragen?"
          value={fw.vermittler_nicht_nah}
          onChange={(v) => onChange("vermittler_nicht_nah", v)}
        />
        <JaNeinRow
          zeile={String(base + 8)}
          label="Befindet sich die Ferienwohnung in Ihrem selbst genutzten Haus?"
          value={fw.eigenes_haus}
          onChange={(v) => onChange("eigenes_haus", v)}
        />
        <JaNeinRow
          zeile={String(base + 9)}
          label="Befindet sich die Ferienwohnung in einem Ort mit weiteren eigenen Ferienwohnungen?"
          value={fw.weitere_eigene}
          onChange={(v) => onChange("weitere_eigene", v)}
        />

        {/* Auto-calc subtotals (Info) */}
        <BmfRow
          kz=""
          label={`Tage gesamt (Info)${exceedsYear ? " — überschreitet 366!" : ""}`}
          value={tageGesamt}
          subtotal
        />
        {(fw.tage_selbstnutzung > 0 || fw.tage_vermietung > 0) && (
          <div
            className="bmf-form__row bmf-form__row--subtotal"
            style={exceedsYear ? { background: "#fde8e8" } : undefined}
          >
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div className="bmf-form__label">
              <span>Vermietungsanteil (Info · Vermietung / Selbst+Vermietung)</span>
            </div>
            <div className="bmf-form__amount">
              {(anteilVermietung * 100).toFixed(1)} %
            </div>
          </div>
        )}
      </BmfSection>
    </>
  );
}

// --- Helpers -----------------------------------------------------------

const textInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #dee2ea",
  font: "inherit",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
  textAlign: "right",
};

function RowShell({
  kz,
  zeile,
  label,
  children,
}: {
  kz: string;
  zeile: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bmf-form__row">
      <div
        className={`bmf-form__kz-cell${kz ? "" : " bmf-form__kz-cell--empty"}`}
      >
        {kz}
      </div>
      <label className="bmf-form__label">
        <span>
          {label}
          <span className="bmf-form__label-hint">Z. {zeile}</span>
        </span>
      </label>
      <div className="bmf-form__amount" style={{ minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

function TextRow({
  zeile,
  label,
  value,
  onChange,
  placeholder,
}: {
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <RowShell kz="" zeile={zeile} label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={textInputStyle}
      />
    </RowShell>
  );
}

function JaNeinRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: JaNein;
  onChange: (v: JaNein) => void;
}) {
  return (
    <RowShell kz="" zeile={zeile} label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as JaNein)}
        style={{
          background: "transparent",
          border: "none",
          font: "inherit",
          width: "100%",
          textAlign: "right",
          outline: "none",
        }}
      >
        <option value="">—</option>
        <option value="ja">1 · Ja</option>
        <option value="nein">2 · Nein</option>
      </select>
    </RowShell>
  );
}

function TripleDaysRow({
  zeile,
  label,
  a,
  b,
  c,
  onChange,
}: {
  zeile: string;
  label: string;
  a: number;
  b: number;
  c: number;
  onChange: (which: "a" | "b" | "c", v: number) => void;
}) {
  const monoInput: React.CSSProperties = {
    background: "transparent",
    border: "1px solid #dee2ea",
    fontFamily: "var(--font-mono)",
    fontSize: "0.9rem",
    fontWeight: 700,
    textAlign: "right",
    padding: "1px 4px",
    outline: "none",
    width: "100%",
  };
  return (
    <RowShell kz="" zeile={zeile} label={label}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="number"
          min="0"
          max="366"
          step={1}
          value={a === 0 ? "" : a}
          onChange={(e) => onChange("a", Number(e.target.value) || 0)}
          placeholder="Selbst"
          style={monoInput}
        />
        <input
          type="number"
          min="0"
          max="366"
          step={1}
          value={b === 0 ? "" : b}
          onChange={(e) => onChange("b", Number(e.target.value) || 0)}
          placeholder="Vermiet."
          style={monoInput}
        />
        <input
          type="number"
          min="0"
          max="366"
          step={1}
          value={c === 0 ? "" : c}
          onChange={(e) => onChange("c", Number(e.target.value) || 0)}
          placeholder="Leerstand"
          style={monoInput}
        />
      </div>
    </RowShell>
  );
}
