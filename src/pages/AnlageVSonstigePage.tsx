import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Info, Printer, Save } from "lucide-react";
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

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type Gemeinschaft = {
  bezeichnung: string;
  finanzamt: string;
  steuernummer: string;
};

type Person = {
  grundstueck1: Gemeinschaft;
  grundstueck2: Gemeinschaft;
  weitere_grundstuecke: number;
  fonds: Gemeinschaft;
  bauherren: Gemeinschaft;
  untervermietung: number;
  unbebaut: number;
  anderes: number;
  sachinbegriffe: number;
  rechte: number;
  prozesszinsen: number;
  par34: number;
  steuerstundung: number;
};

const EMPTY_GEMEINSCHAFT: Gemeinschaft = {
  bezeichnung: "",
  finanzamt: "",
  steuernummer: "",
};

const EMPTY_PERSON: Person = {
  grundstueck1: EMPTY_GEMEINSCHAFT,
  grundstueck2: EMPTY_GEMEINSCHAFT,
  weitere_grundstuecke: 0,
  fonds: EMPTY_GEMEINSCHAFT,
  bauherren: EMPTY_GEMEINSCHAFT,
  untervermietung: 0,
  unbebaut: 0,
  anderes: 0,
  sachinbegriffe: 0,
  rechte: 0,
  prozesszinsen: 0,
  par34: 0,
  steuerstundung: 0,
};

type AnlageVSonstige = {
  zusammenveranlagung: boolean;
  person_a: Person;
  person_b: Person;
  wirtschaftsId: string;
};

const DEFAULT: AnlageVSonstige = {
  zusammenveranlagung: false,
  person_a: EMPTY_PERSON,
  person_b: EMPTY_PERSON,
  wirtschaftsId: "",
};

const FORM_ID = "anlage-v-sonstige";

function mergeGemeinschaft(
  partial: Partial<Gemeinschaft> | undefined
): Gemeinschaft {
  return { ...EMPTY_GEMEINSCHAFT, ...(partial ?? {}) };
}

function mergePerson(partial: Partial<Person> | undefined): Person {
  const p = partial ?? {};
  return {
    ...EMPTY_PERSON,
    ...p,
    grundstueck1: mergeGemeinschaft(p.grundstueck1),
    grundstueck2: mergeGemeinschaft(p.grundstueck2),
    fonds: mergeGemeinschaft(p.fonds),
    bauherren: mergeGemeinschaft(p.bauherren),
  };
}

function loadForm(mandantId: string | null, jahr: number): AnlageVSonstige {
  const parsed = readEstForm<Partial<AnlageVSonstige>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    person_a: mergePerson(parsed.person_a),
    person_b: mergePerson(parsed.person_b),
  };
}

export default function AnlageVSonstigePage() {
  return (
    <MandantRequiredGuard>
      <AnlageVSonstigePageInner />
    </MandantRequiredGuard>
  );
}

function AnlageVSonstigePageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageVSonstige>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function setPerson<K extends keyof Person>(
    which: "person_a" | "person_b",
    key: K,
    value: Person[K]
  ) {
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));
  }

  function setGemeinschaft(
    which: "person_a" | "person_b",
    field: "grundstueck1" | "grundstueck2" | "fonds" | "bauherren",
    key: keyof Gemeinschaft,
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

  const summeA = useMemo(() => {
    const p = form.person_a;
    return (
      p.untervermietung + p.unbebaut + p.anderes + p.sachinbegriffe + p.rechte
    );
  }, [form.person_a]);

  const summeB = useMemo(() => {
    const p = form.person_b;
    return (
      p.untervermietung + p.unbebaut + p.anderes + p.sachinbegriffe + p.rechte
    );
  }, [form.person_b]);

  // Light validation — warn but don't block on save
  function validate(): string[] {
    const warnings: string[] = [];
    const stnrPattern = /^[\d\s/]*$/;
    const check = (
      person: "Person A" | "Person B",
      stnr: string,
      slot: string
    ) => {
      if (stnr && !stnrPattern.test(stnr)) {
        warnings.push(
          `${person} ${slot}: Steuernummer enthält unerwartete Zeichen.`
        );
      }
    };
    const pA = form.person_a;
    check("Person A", pA.grundstueck1.steuernummer, "Grundstücksgem. 1");
    check("Person A", pA.grundstueck2.steuernummer, "Grundstücksgem. 2");
    check("Person A", pA.fonds.steuernummer, "Immobilienfonds");
    check("Person A", pA.bauherren.steuernummer, "Bauherren-/Erwerbsgem.");
    if (form.zusammenveranlagung) {
      const pB = form.person_b;
      check("Person B", pB.grundstueck1.steuernummer, "Grundstücksgem. 1");
      check("Person B", pB.grundstueck2.steuernummer, "Grundstücksgem. 2");
      check("Person B", pB.fonds.steuernummer, "Immobilienfonds");
      check("Person B", pB.bauherren.steuernummer, "Bauherren-/Erwerbsgem.");
    }
    if (
      form.wirtschaftsId &&
      !/^DE[-\s]?\d{6,11}$/i.test(form.wirtschaftsId.replace(/\s/g, ""))
    ) {
      warnings.push(
        "Wirtschafts-ID (Z. 30) sollte mit DE beginnen und 6–11 Ziffern enthalten."
      );
    }
    return warnings;
  }

  function save() {
    const warnings = validate();
    if (warnings.length > 0) {
      toast.warning(warnings.join(" · "), { duration: 6000 });
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-v-sonstige"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-v-sonstige",
      summary: `Anlage V-Sonstige gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-v-sonstige",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        summeA,
        summeB,
        form,
      },
    });
    toast.success("Anlage V-Sonstige gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage V-Sonstige</h1>
          <p>
            Beteiligungen an Grundstücksgemeinschaften, Immobilienfonds,
            Bauherrengemeinschaften sowie verschiedene Einkünfte aus
            Vermietung/Verpachtung (§ 21 EStG) · VZ {selectedYear}.
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
          Anlage V-Sonstige · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-v-sonstige" />

      <section className="card taxcalc__section no-print">
        <h2>Profil</h2>
        <label className="form-field kontenplan__toggle--form">
          <input
            type="checkbox"
            checked={form.zusammenveranlagung}
            onChange={(e) =>
              setForm((f) => ({ ...f, zusammenveranlagung: e.target.checked }))
            }
          />
          <span>Zusammenveranlagung (Person B erfassen)</span>
        </label>
        <aside className="taxcalc__hint" style={{ marginTop: 8 }}>
          <Info size={14} />
          <span>
            Die Anteile an Einkünften aus Grundstücksgemeinschaften / Fonds /
            Bauherren werden per Feststellungsbescheid vom Finanzamt
            zugewiesen. Hier werden nur die <strong>Identifikationsangaben</strong>{" "}
            (Bezeichnung, Finanzamt, Steuernummer) zur Zuordnung erfasst.
          </span>
        </aside>
      </section>

      <BmfForm
        title="Anlage V-Sonstige"
        subtitle={`Beteiligungen & sonstige V+V-Einkünfte · VZ ${selectedYear}`}
      >
        <PersonBlock
          title="Anteile an Einkünften laut Feststellung — Person A (Stpfl. / Ehemann)"
          person={form.person_a}
          which="person_a"
          kzSlots={{
            gem1: "856",
            gem2: "858",
            weitere: "854",
            fonds: "874",
            bauherren: "876",
          }}
          zeilenSlots={{
            gem1: "4-6",
            gem2: "7-9",
            weitere: "10",
            fonds: "11-13",
            bauherren: "14-16",
          }}
          onGemeinschaft={setGemeinschaft}
          onPersonField={setPerson}
        />

        {form.zusammenveranlagung && (
          <PersonBlock
            title="Anteile an Einkünften laut Feststellung — Person B (Ehefrau / Lebenspartner:in)"
            person={form.person_b}
            which="person_b"
            kzSlots={{
              gem1: "857",
              gem2: "859",
              weitere: "855",
              fonds: "875",
              bauherren: "877",
            }}
            zeilenSlots={{
              gem1: "17-19",
              gem2: "20-22",
              weitere: "23",
              fonds: "24-26",
              bauherren: "27-29",
            }}
            onGemeinschaft={setGemeinschaft}
            onPersonField={setPerson}
          />
        )}

        <BmfSection title="Wirtschafts-Identifikationsnummer (Z. 30)">
          <RowShell
            kz=""
            zeile="30"
            label="Wirtschafts-ID (gemeinsam für beide Personen, sofern vorhanden)"
          >
            <input
              type="text"
              value={form.wirtschaftsId}
              onChange={(e) =>
                setForm((f) => ({ ...f, wirtschaftsId: e.target.value }))
              }
              placeholder="DE-XXXXXXXXX"
              maxLength={20}
              style={textInputStyle}
            />
          </RowShell>
        </BmfSection>

        <BmfSection
          title="Verschiedene Einkünfte aus V+V (Z. 31–39)"
          description={
            form.zusammenveranlagung
              ? "Beträge je Person getrennt erfassen. Summe (Z. 36) wird automatisch gebildet aus Z. 31–35."
              : "Einzelveranlagung — nur Person A erfassen. Summe (Z. 36) wird automatisch gebildet aus Z. 31–35."
          }
        >
          <MoneyZeile
            zeile="31"
            label="Einkünfte aus Untervermietung gemieteter Räume"
            kzA="866"
            kzB="867"
            valueA={form.person_a.untervermietung}
            valueB={form.person_b.untervermietung}
            onChangeA={(v) => setPerson("person_a", "untervermietung", v)}
            onChangeB={(v) => setPerson("person_b", "untervermietung", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          <MoneyZeile
            zeile="32"
            label="Vermietung und Verpachtung unbebauter Grundstücke"
            valueA={form.person_a.unbebaut}
            valueB={form.person_b.unbebaut}
            onChangeA={(v) => setPerson("person_a", "unbebaut", v)}
            onChangeB={(v) => setPerson("person_b", "unbebaut", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          <MoneyZeile
            zeile="33"
            label="Vermietung und Verpachtung von anderem unbeweglichen Vermögen"
            valueA={form.person_a.anderes}
            valueB={form.person_b.anderes}
            onChangeA={(v) => setPerson("person_a", "anderes", v)}
            onChangeB={(v) => setPerson("person_b", "anderes", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          <MoneyZeile
            zeile="34"
            label="Vermietung und Verpachtung von Sachinbegriffen"
            valueA={form.person_a.sachinbegriffe}
            valueB={form.person_b.sachinbegriffe}
            onChangeA={(v) => setPerson("person_a", "sachinbegriffe", v)}
            onChangeB={(v) => setPerson("person_b", "sachinbegriffe", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          <MoneyZeile
            zeile="35"
            label="Einkünfte aus Überlassung von Rechten"
            valueA={form.person_a.rechte}
            valueB={form.person_b.rechte}
            onChangeA={(v) => setPerson("person_a", "rechte", v)}
            onChangeB={(v) => setPerson("person_b", "rechte", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          {/* Z. 36 Summe — auto-computed */}
          <BmfRow
            kz="852"
            label={
              form.zusammenveranlagung
                ? "Summe Person A (Z. 31–35)"
                : "Summe (Z. 31–35)"
            }
            value={summeA}
            subtotal
          />
          {form.zusammenveranlagung && (
            <BmfRow
              kz="853"
              label="Summe Person B (Z. 31–35)"
              value={summeB}
              subtotal
            />
          )}
          <MoneyZeile
            zeile="37"
            label="Vereinnahmte Prozess- und Verzugszinsen"
            kzA="864"
            kzB="865"
            valueA={form.person_a.prozesszinsen}
            valueB={form.person_b.prozesszinsen}
            onChangeA={(v) => setPerson("person_a", "prozesszinsen", v)}
            onChangeB={(v) => setPerson("person_b", "prozesszinsen", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          <MoneyZeile
            zeile="38"
            label="Einkünfte mit ermäßigter Besteuerung nach § 34 Abs. 1 EStG"
            kzA="862"
            kzB="863"
            valueA={form.person_a.par34}
            valueB={form.person_b.par34}
            onChangeA={(v) => setPerson("person_a", "par34", v)}
            onChangeB={(v) => setPerson("person_b", "par34", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
          <MoneyZeile
            zeile="39"
            label="Einkünfte aus Steuerstundungsmodellen (§ 15b EStG)"
            valueA={form.person_a.steuerstundung}
            valueB={form.person_b.steuerstundung}
            onChangeA={(v) => setPerson("person_a", "steuerstundung", v)}
            onChangeB={(v) => setPerson("person_b", "steuerstundung", v)}
            zusammenveranlagung={form.zusammenveranlagung}
          />
        </BmfSection>

        <div className="bmf-form__row" style={{ background: "#eef1f6" }}>
          <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
          <div
            className="bmf-form__label"
            style={{ fontWeight: 700, color: "#15233d" }}
          >
            {form.zusammenveranlagung
              ? "Summe verschiedene Einkünfte (Person A + B · Info)"
              : "Summe verschiedene Einkünfte (Info)"}
          </div>
          <div
            className="bmf-form__amount"
            style={{ fontWeight: 700, color: "#15233d" }}
          >
            {euro.format(
              summeA + (form.zusammenveranlagung ? summeB : 0)
            )}
          </div>
        </div>

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Summe Z. 36</strong> wird aus Z. 31–35 automatisch gebildet.
            Prozesszinsen (Z. 37), tarifermäßigte Einkünfte (Z. 38) und
            Steuerstundungsmodelle (Z. 39) werden in der Übersicht mitgezählt,
            fließen aber im Steuerbescheid über getrennte Kennziffern ein.
          </p>
          <p>
            <strong>Feststellungsbescheide:</strong> Die Höhe der Einkünfte aus
            Grundstücksgemeinschaften / Immobilienfonds / Bauherrengemein-
            schaften wird vom Feststellungs-Finanzamt direkt an das
            Wohnsitz-Finanzamt übermittelt. Hier werden nur die Identifika-
            tionsangaben zur Zuordnung erfasst.
          </p>
          <p>
            <strong>Kennziffern (Kz) und Zeilen-Nr. (Z.)</strong>{" "}
            entsprechen dem offiziellen Anlage V-Sonstige 2025. Partner-
            Kennziffern (z. B. Kz 857 für Person B statt Kz 856) werden
            automatisch gesetzt.
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

// --- Person block -------------------------------------------------------

type PersonBlockProps = {
  title: string;
  person: Person;
  which: "person_a" | "person_b";
  kzSlots: {
    gem1: string;
    gem2: string;
    weitere: string;
    fonds: string;
    bauherren: string;
  };
  zeilenSlots: {
    gem1: string;
    gem2: string;
    weitere: string;
    fonds: string;
    bauherren: string;
  };
  onGemeinschaft: (
    which: "person_a" | "person_b",
    field: "grundstueck1" | "grundstueck2" | "fonds" | "bauherren",
    key: keyof Gemeinschaft,
    value: string
  ) => void;
  onPersonField: <K extends keyof Person>(
    which: "person_a" | "person_b",
    key: K,
    value: Person[K]
  ) => void;
};

function PersonBlock(props: PersonBlockProps) {
  const { title, person, which, kzSlots, zeilenSlots, onGemeinschaft, onPersonField } = props;
  return (
    <BmfSection title={title}>
      <GemeinschaftBlock
        kz={kzSlots.gem1}
        zeilen={zeilenSlots.gem1}
        label="1. Grundstücksgemeinschaft"
        g={person.grundstueck1}
        onChange={(k, v) => onGemeinschaft(which, "grundstueck1", k, v)}
      />
      <GemeinschaftBlock
        kz={kzSlots.gem2}
        zeilen={zeilenSlots.gem2}
        label="2. Grundstücksgemeinschaft"
        g={person.grundstueck2}
        onChange={(k, v) => onGemeinschaft(which, "grundstueck2", k, v)}
      />
      <BmfInputRow
        kz={kzSlots.weitere}
        label="Weitere Grundstücksgemeinschaften (laut gesonderter Aufstellung)"
        hint={`Z. ${zeilenSlots.weitere} · Summe lt. Aufstellung`}
        value={person.weitere_grundstuecke}
        onChange={(v) => onPersonField(which, "weitere_grundstuecke", v)}
      />
      <GemeinschaftBlock
        kz={kzSlots.fonds}
        zeilen={zeilenSlots.fonds}
        label="Geschlossener Immobilienfonds"
        g={person.fonds}
        onChange={(k, v) => onGemeinschaft(which, "fonds", k, v)}
      />
      <GemeinschaftBlock
        kz={kzSlots.bauherren}
        zeilen={zeilenSlots.bauherren}
        label="Bauherren- / Erwerbsgemeinschaft"
        g={person.bauherren}
        onChange={(k, v) => onGemeinschaft(which, "bauherren", k, v)}
      />
    </BmfSection>
  );
}

function GemeinschaftBlock({
  kz,
  zeilen,
  label,
  g,
  onChange,
}: {
  kz: string;
  zeilen: string;
  label: string;
  g: Gemeinschaft;
  onChange: (key: keyof Gemeinschaft, value: string) => void;
}) {
  return (
    <>
      <RowShell kz={kz} zeile={zeilen} label={`${label} — Bezeichnung`}>
        <input
          type="text"
          value={g.bezeichnung}
          onChange={(e) => onChange("bezeichnung", e.target.value)}
          placeholder="z. B. GbR Musterstraße 12"
          style={textInputStyle}
        />
      </RowShell>
      <RowShell kz="" zeile={zeilen} label={`${label} — Finanzamt`}>
        <input
          type="text"
          value={g.finanzamt}
          onChange={(e) => onChange("finanzamt", e.target.value)}
          placeholder="FA Berlin-Mitte"
          style={textInputStyle}
        />
      </RowShell>
      <RowShell kz="" zeile={zeilen} label={`${label} — Steuernummer`}>
        <input
          type="text"
          value={g.steuernummer}
          onChange={(e) => onChange("steuernummer", e.target.value)}
          placeholder="12/345/67890"
          style={textInputStyle}
        />
      </RowShell>
    </>
  );
}

// --- Money row with optional Person B column ----------------------------

function MoneyZeile({
  zeile,
  label,
  kzA,
  kzB,
  valueA,
  valueB,
  onChangeA,
  onChangeB,
  zusammenveranlagung,
}: {
  zeile: string;
  label: string;
  kzA?: string;
  kzB?: string;
  valueA: number;
  valueB: number;
  onChangeA: (v: number) => void;
  onChangeB: (v: number) => void;
  zusammenveranlagung: boolean;
}) {
  return (
    <>
      <BmfInputRow
        kz={kzA ?? ""}
        label={zusammenveranlagung ? `${label} (Person A)` : label}
        hint={`Z. ${zeile}`}
        value={valueA}
        onChange={onChangeA}
      />
      {zusammenveranlagung && (
        <BmfInputRow
          kz={kzB ?? ""}
          label={`${label} (Person B)`}
          hint={`Z. ${zeile}`}
          value={valueB}
          onChange={onChangeB}
        />
      )}
    </>
  );
}

// --- Reusable row shell + styles ---------------------------------------

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
