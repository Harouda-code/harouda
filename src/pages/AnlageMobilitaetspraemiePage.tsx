import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, Printer, Save } from "lucide-react";
import { toast } from "sonner";
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
import {
  BmfForm,
  BmfSection,
  BmfRow,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type Einkunftsart = 0 | 1 | 2 | 3 | 4 | 5;
const EINKUNFT_LABEL: Record<Einkunftsart, string> = {
  0: "— bitte auswählen —",
  1: "Land- und Forstwirtschaft",
  2: "Gewerbebetrieb",
  3: "Selbständige Arbeit",
  4: "Vermietung und Verpachtung",
  5: "Sonstige",
};

type Adresse = {
  plz: string;
  ort: string;
  strasse: string;
};

type Person = {
  nichtSelbst_jaNein: "ja" | "nein" | "";
  andere_jaNein: "ja" | "nein" | "";
  bezeichnung: string;
  einkunftsart: Einkunftsart;
  taetigkeit: Adresse;
  aufgesucht_tage: number;
  einfache_entfernung_km: number;
  familienheim: Adresse;
  familienheim_fahrten: number;
  familienheim_km: number;
};

const EMPTY_ADRESSE: Adresse = { plz: "", ort: "", strasse: "" };
const EMPTY_PERSON: Person = {
  nichtSelbst_jaNein: "",
  andere_jaNein: "",
  bezeichnung: "",
  einkunftsart: 0,
  taetigkeit: EMPTY_ADRESSE,
  aufgesucht_tage: 0,
  einfache_entfernung_km: 0,
  familienheim: EMPTY_ADRESSE,
  familienheim_fahrten: 0,
  familienheim_km: 0,
};

type AnlageMobility = {
  antrag_gestellt: boolean;
  zusammenveranlagung: boolean;
  person_a: Person;
  person_b: Person;
};

const DEFAULT: AnlageMobility = {
  antrag_gestellt: false,
  zusammenveranlagung: false,
  person_a: EMPTY_PERSON,
  person_b: EMPTY_PERSON,
};

const FORM_ID = "anlage-mobility";

function loadForm(mandantId: string | null, jahr: number): AnlageMobility {
  const parsed = readEstForm<Partial<AnlageMobility>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    person_a: { ...EMPTY_PERSON, ...(parsed.person_a ?? {}) },
    person_b: { ...EMPTY_PERSON, ...(parsed.person_b ?? {}) },
  };
}

/** Berechnet die ERHÖHTE Entfernungspauschale (nur Kilometer ab 21). Das
 *  ist die Bemessungsgrundlage für die Mobilitätsprämie (§ 101 Abs. 1
 *  Satz 2 EStG). Die Prämienhöhe selbst wird NICHT hier berechnet — sie
 *  hängt vom zu versteuernden Einkommen ab und wird vom Finanzamt
 *  festgesetzt (§ 105 EStG). */
function erhoehtePauschale(
  tage: number,
  km: number,
  satzAb21: number
): number {
  if (tage <= 0 || km <= 21) return 0;
  return (km - 20) * satzAb21 * tage;
}

export default function AnlageMobilitaetspraemiePage() {
  return (
    <MandantRequiredGuard>
      <AnlageMobilitaetspraemiePageInner />
    </MandantRequiredGuard>
  );
}

function AnlageMobilitaetspraemiePageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const params = getSteuerParameter(selectedYear);

  const [form, setForm] = useState<AnlageMobility>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function updatePerson<K extends keyof Person>(
    which: "person_a" | "person_b",
    key: K,
    value: Person[K]
  ) {
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));
  }

  function updateAdresse(
    which: "person_a" | "person_b",
    field: "taetigkeit" | "familienheim",
    key: keyof Adresse,
    value: string
  ) {
    setForm((f) => ({
      ...f,
      [which]: {
        ...f[which],
        [field]: { ...f[which][field], [key]: value },
      },
    }));
  }

  const erhoehteAEntfernung = useMemo(
    () =>
      erhoehtePauschale(
        form.person_a.aufgesucht_tage,
        form.person_a.einfache_entfernung_km,
        params.entfernungspauschale_ab21
      ),
    [
      form.person_a.aufgesucht_tage,
      form.person_a.einfache_entfernung_km,
      params.entfernungspauschale_ab21,
    ]
  );

  const erhoehteAFamilienheim = useMemo(
    () =>
      erhoehtePauschale(
        form.person_a.familienheim_fahrten,
        form.person_a.familienheim_km,
        params.entfernungspauschale_ab21
      ),
    [
      form.person_a.familienheim_fahrten,
      form.person_a.familienheim_km,
      params.entfernungspauschale_ab21,
    ]
  );

  const erhoehteBEntfernung = useMemo(
    () =>
      erhoehtePauschale(
        form.person_b.aufgesucht_tage,
        form.person_b.einfache_entfernung_km,
        params.entfernungspauschale_ab21
      ),
    [
      form.person_b.aufgesucht_tage,
      form.person_b.einfache_entfernung_km,
      params.entfernungspauschale_ab21,
    ]
  );

  const erhoehteBFamilienheim = useMemo(
    () =>
      erhoehtePauschale(
        form.person_b.familienheim_fahrten,
        form.person_b.familienheim_km,
        params.entfernungspauschale_ab21
      ),
    [
      form.person_b.familienheim_fahrten,
      form.person_b.familienheim_km,
      params.entfernungspauschale_ab21,
    ]
  );

  const erhoehteSumme =
    erhoehteAEntfernung +
    erhoehteAFamilienheim +
    (form.zusammenveranlagung
      ? erhoehteBEntfernung + erhoehteBFamilienheim
      : 0);

  function save() {
    if (!form.antrag_gestellt) {
      toast.error(
        "Bitte oben die Mobilitätsprämie beantragen (Kz 240)."
      );
      return;
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-mobility"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-mobility",
      summary: `Anlage Mobilitätsprämie gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-mobility",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        erhoehteSumme,
        form,
      },
    });
    toast.success("Antrag auf Mobilitätsprämie gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage Mobilitätsprämie</h1>
          <p>
            Antrag auf Festsetzung der Mobilitätsprämie nach §§ 101–109 EStG
            für Pendler:innen mit Einkommen unter dem Grundfreibetrag (
            {euro.format(params.grundfreibetrag_euro)} in {selectedYear}).
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
            Antrag speichern
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          Anlage Mobilitätsprämie · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-mobility" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Voraussetzung:</strong> Die Mobilitätsprämie kann nur
          festgesetzt werden, wenn das zu versteuernde Einkommen unter dem
          Grundfreibetrag (
          {euro.format(params.grundfreibetrag_euro)} ·{" "}
          {form.zusammenveranlagung
            ? `${euro.format(params.grundfreibetrag_euro * 2)} bei Zusammenveranlagung`
            : "Einzelveranlagung"}
          ) liegt UND die Entfernung zur Tätigkeitsstätte mehr als 20 km
          beträgt. Die tatsächliche Prämie (14 % der erhöhten Pauschale,
          anteilig am nicht genutzten Grundfreibetrag) setzt das Finanzamt
          fest (§ 105 EStG).
        </div>
      </aside>

      <BmfForm
        title="Anlage Mobilitätsprämie"
        subtitle={`Antrag · Veranlagungszeitraum ${selectedYear}`}
      >
        <BmfSection title="Antrag auf Festsetzung der Mobilitätsprämie">
          {/* Z. 4 · Kz 240 — Antrag */}
          <div className="bmf-form__row">
            <div className="bmf-form__kz-cell">240</div>
            <label className="bmf-form__label">
              <span>
                Ich beantrage / Wir beantragen die Festsetzung der
                Mobilitätsprämie
                <span className="bmf-form__label-hint">Z. 4</span>
              </span>
            </label>
            <div className="bmf-form__amount">
              <input
                type="checkbox"
                checked={form.antrag_gestellt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, antrag_gestellt: e.target.checked }))
                }
              />
            </div>
          </div>
          <div className="bmf-form__row">
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <label className="bmf-form__label">
              <span>
                Zusammenveranlagung (Person B erfassen)
                <span className="bmf-form__label-hint">
                  Ehegatte / Lebenspartner
                </span>
              </span>
            </label>
            <div className="bmf-form__amount">
              <input
                type="checkbox"
                checked={form.zusammenveranlagung}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    zusammenveranlagung: e.target.checked,
                  }))
                }
              />
            </div>
          </div>
        </BmfSection>

        <PersonBlock
          title="Angaben zur Person A (Steuerpflichtige:r / Ehemann)"
          person={form.person_a}
          which="person_a"
          jaNeinZeilen={{ nichtSelbst: "5", andere: "6" }}
          jaNeinKz={{ andere: "241" }}
          bezeichnungZeile="7"
          einkunftsartZeile="8"
          entfernungZeilen={{ taetigkeit: "9", zahlen: "10" }}
          familienheimZeilen={{ adresse: "11", zahlen: "12" }}
          erhoehteEntfernung={erhoehteAEntfernung}
          erhoehteFamilienheim={erhoehteAFamilienheim}
          updatePerson={updatePerson}
          updateAdresse={updateAdresse}
          satzAb21={params.entfernungspauschale_ab21}
        />

        {form.zusammenveranlagung && (
          <PersonBlock
            title="Angaben zur Person B (Ehefrau / Lebenspartner:in)"
            person={form.person_b}
            which="person_b"
            jaNeinZeilen={{ nichtSelbst: "13", andere: "14" }}
            jaNeinKz={{ andere: "242" }}
            bezeichnungZeile="15"
            einkunftsartZeile="16"
            entfernungZeilen={{ taetigkeit: "17", zahlen: "18" }}
            familienheimZeilen={{ adresse: "19", zahlen: "20" }}
            erhoehteEntfernung={erhoehteBEntfernung}
            erhoehteFamilienheim={erhoehteBFamilienheim}
            updatePerson={updatePerson}
            updateAdresse={updateAdresse}
            satzAb21={params.entfernungspauschale_ab21}
          />
        )}

        <div className="bmf-form__row" style={{ background: "#eef1f6" }}>
          <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
          <div
            className="bmf-form__label"
            style={{ fontWeight: 700, color: "#15233d" }}
          >
            Summe erhöhte Pauschale (Bemessungsgrundlage · Info)
          </div>
          <div
            className="bmf-form__amount"
            style={{ fontWeight: 700, color: "#15233d" }}
          >
            {euro.format(erhoehteSumme)}
          </div>
        </div>

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Keine Prämienberechnung auf dieser Seite:</strong> Die
            Mobilitätsprämie beträgt 14 % der Bemessungsgrundlage — diese
            wird aber nur insoweit angesetzt, wie das zu versteuernde
            Einkommen den Grundfreibetrag unterschreitet (§ 101 Abs. 2 EStG).
            Die endgültige Festsetzung erfolgt im Einkommensteuerbescheid
            (§ 105 EStG).
          </p>
          <p>
            <strong>Kennziffern (Kz) und Zeilen-Nr. (Z.)</strong> nach Angabe
            des Steuerpflichtigen. Bei Zusammenveranlagung gelten Partner-
            Kennziffern (z. B. Kz 242 für Person B).
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

type PersonBlockProps = {
  title: string;
  person: Person;
  which: "person_a" | "person_b";
  jaNeinZeilen: { nichtSelbst: string; andere: string };
  jaNeinKz: { andere: string };
  bezeichnungZeile: string;
  einkunftsartZeile: string;
  entfernungZeilen: { taetigkeit: string; zahlen: string };
  familienheimZeilen: { adresse: string; zahlen: string };
  erhoehteEntfernung: number;
  erhoehteFamilienheim: number;
  updatePerson: <K extends keyof Person>(
    which: "person_a" | "person_b",
    key: K,
    value: Person[K]
  ) => void;
  updateAdresse: (
    which: "person_a" | "person_b",
    field: "taetigkeit" | "familienheim",
    key: keyof Adresse,
    value: string
  ) => void;
  satzAb21: number;
};

function PersonBlock(props: PersonBlockProps) {
  const {
    title,
    person,
    which,
    jaNeinZeilen,
    jaNeinKz,
    bezeichnungZeile,
    einkunftsartZeile,
    entfernungZeilen,
    familienheimZeilen,
    erhoehteEntfernung,
    erhoehteFamilienheim,
    updatePerson,
    updateAdresse,
    satzAb21,
  } = props;

  return (
    <BmfSection title={title}>
      <JaNeinRow
        kz=""
        zeile={jaNeinZeilen.nichtSelbst}
        label="Antrag bezieht sich auf Einkünfte aus nichtselbständiger Arbeit"
        value={person.nichtSelbst_jaNein}
        onChange={(v) => updatePerson(which, "nichtSelbst_jaNein", v)}
      />
      <JaNeinRow
        kz={jaNeinKz.andere}
        zeile={jaNeinZeilen.andere}
        label="Antrag bezieht sich auf andere Einkünfte"
        value={person.andere_jaNein}
        onChange={(v) => updatePerson(which, "andere_jaNein", v)}
      />

      <TextRow
        kz=""
        zeile={bezeichnungZeile}
        label="Bezeichnung des Betriebs / der Tätigkeit / des Vermietungsobjekts"
        value={person.bezeichnung}
        onChange={(v) => updatePerson(which, "bezeichnung", v)}
      />

      <SelectRow
        kz=""
        zeile={einkunftsartZeile}
        label="Einkunftsart"
        value={person.einkunftsart}
        onChange={(v) =>
          updatePerson(which, "einkunftsart", v as Einkunftsart)
        }
        options={[0, 1, 2, 3, 4, 5].map((n) => ({
          value: n,
          label: `${n > 0 ? `${n} = ` : ""}${EINKUNFT_LABEL[n as Einkunftsart]}`,
        }))}
      />

      {/* Entfernungspauschale */}
      <AdresseRow
        kz=""
        zeile={entfernungZeilen.taetigkeit}
        label="Erste Betriebs- / Tätigkeitsstätte (PLZ, Ort, Straße)"
        adresse={person.taetigkeit}
        onChange={(key, v) => updateAdresse(which, "taetigkeit", key, v)}
      />
      <TwoNumberRow
        kz=""
        zeile={entfernungZeilen.zahlen}
        label="aufgesucht an Tagen · einfache Entfernung (km)"
        leftValue={person.aufgesucht_tage}
        leftOnChange={(v) => updatePerson(which, "aufgesucht_tage", v)}
        leftPlaceholder="Tage"
        rightValue={person.einfache_entfernung_km}
        rightOnChange={(v) =>
          updatePerson(which, "einfache_entfernung_km", v)
        }
        rightPlaceholder="km"
      />
      <BmfRow
        kz=""
        label={`Erhöhte Pauschale (ab km 21 · ${satzAb21.toFixed(2)} €/km, pro Tag · Info)`}
        value={erhoehteEntfernung}
        subtotal
      />

      {/* Familienheimfahrten */}
      <AdresseRow
        kz=""
        zeile={familienheimZeilen.adresse}
        label="Beschäftigungsort bei doppelter Haushaltsführung (PLZ, Ort, Straße)"
        adresse={person.familienheim}
        onChange={(key, v) => updateAdresse(which, "familienheim", key, v)}
      />
      <TwoNumberRow
        kz=""
        zeile={familienheimZeilen.zahlen}
        label="Anzahl Familienheimfahrten · einfache Entfernung (km)"
        leftValue={person.familienheim_fahrten}
        leftOnChange={(v) => updatePerson(which, "familienheim_fahrten", v)}
        leftPlaceholder="Fahrten"
        rightValue={person.familienheim_km}
        rightOnChange={(v) => updatePerson(which, "familienheim_km", v)}
        rightPlaceholder="km"
      />
      <BmfRow
        kz=""
        label={`Erhöhte Familienheim-Pauschale (ab km 21 · ${satzAb21.toFixed(2)} €/km · Info)`}
        value={erhoehteFamilienheim}
        subtotal
      />
    </BmfSection>
  );
}

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

function JaNeinRow({
  kz,
  zeile,
  label,
  value,
  onChange,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: "ja" | "nein" | "";
  onChange: (v: "ja" | "nein" | "") => void;
}) {
  return (
    <RowShell kz={kz} zeile={zeile} label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "ja" | "nein" | "")}
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
        <option value="ja">Ja</option>
        <option value="nein">Nein</option>
      </select>
    </RowShell>
  );
}

function TextRow({
  kz,
  zeile,
  label,
  value,
  onChange,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <RowShell kz={kz} zeile={zeile} label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          font: "inherit",
          width: "100%",
          textAlign: "right",
          outline: "none",
        }}
      />
    </RowShell>
  );
}

function SelectRow({
  kz,
  zeile,
  label,
  value,
  onChange,
  options,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <RowShell kz={kz} zeile={zeile} label={label}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: "transparent",
          border: "none",
          font: "inherit",
          width: "100%",
          textAlign: "right",
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </RowShell>
  );
}

function AdresseRow({
  kz,
  zeile,
  label,
  adresse,
  onChange,
}: {
  kz: string;
  zeile: string;
  label: string;
  adresse: Adresse;
  onChange: (key: keyof Adresse, v: string) => void;
}) {
  return (
    <RowShell kz={kz} zeile={zeile} label={label}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px 110px 1fr",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="text"
          value={adresse.plz}
          onChange={(e) => onChange("plz", e.target.value)}
          placeholder="PLZ"
          maxLength={5}
          style={{
            background: "transparent",
            border: "1px solid #dee2ea",
            font: "inherit",
            padding: "1px 4px",
            outline: "none",
          }}
        />
        <input
          type="text"
          value={adresse.ort}
          onChange={(e) => onChange("ort", e.target.value)}
          placeholder="Ort"
          style={{
            background: "transparent",
            border: "1px solid #dee2ea",
            font: "inherit",
            padding: "1px 4px",
            outline: "none",
          }}
        />
        <input
          type="text"
          value={adresse.strasse}
          onChange={(e) => onChange("strasse", e.target.value)}
          placeholder="Straße, Nr."
          style={{
            background: "transparent",
            border: "1px solid #dee2ea",
            font: "inherit",
            padding: "1px 4px",
            outline: "none",
          }}
        />
      </div>
    </RowShell>
  );
}

function TwoNumberRow({
  kz,
  zeile,
  label,
  leftValue,
  leftOnChange,
  leftPlaceholder,
  rightValue,
  rightOnChange,
  rightPlaceholder,
}: {
  kz: string;
  zeile: string;
  label: string;
  leftValue: number;
  leftOnChange: (v: number) => void;
  leftPlaceholder: string;
  rightValue: number;
  rightOnChange: (v: number) => void;
  rightPlaceholder: string;
}) {
  const monoInput = {
    background: "transparent",
    border: "1px solid #dee2ea",
    fontFamily: "var(--font-mono)",
    fontSize: "0.9rem",
    fontWeight: 700,
    textAlign: "right" as const,
    padding: "1px 4px",
    outline: "none",
    width: "100%",
  };
  return (
    <RowShell kz={kz} zeile={zeile} label={label}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="number"
          min="0"
          step={1}
          value={leftValue === 0 ? "" : leftValue}
          onChange={(e) => leftOnChange(Number(e.target.value) || 0)}
          placeholder={leftPlaceholder}
          style={monoInput}
        />
        <input
          type="number"
          min="0"
          step={1}
          value={rightValue === 0 ? "" : rightValue}
          onChange={(e) => rightOnChange(Number(e.target.value) || 0)}
          placeholder={rightPlaceholder}
          style={monoInput}
        />
      </div>
    </RowShell>
  );
}

