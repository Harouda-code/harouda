import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  getSteuerParameter,
  STEUERPARAMETER_VERSION,
} from "../data/steuerParameter";
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
  BmfResult,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type JaNein = "ja" | "nein" | "";

// Anrechnungsfreibetrag nach § 33a Abs. 1 Satz 5 EStG
const ANRECHNUNGSFREIBETRAG = 624;

// ---------- Types ------------------------------------------------------

type Periode = { von: string; bis: string };

type EinkunftsZeile = {
  von: string;
  bis: string;
  brutto: number;
  werbungskosten: number;
};

type Versorgungsbezuege = {
  von: string;
  bis: string;
  euro: number;
  werbungskosten: number;
  bemessung: number;
  kalenderjahr: number;
};

type Rente = {
  von: string;
  bis: string;
  euro: number;
  steuerpflichtig: number;
  werbungskosten: number;
};

type Kapital = {
  von: string;
  bis: string;
  tariflich: number;
  abgeltung: number;
};

type KvPv = {
  kv_basis: number;
  kv_mit_krankengeld: number;
  pv: number;
};

type BeitragendePerson = {
  hat_weitere: JaNein;
  name_adresse: string;
  periode: Periode;
  betrag: number;
  kv_pv: KvPv;
};

type UnterstuetztePerson = {
  idNr: string;
  name: string;
  geburtsdatum: string;
  sterbedatum: string;
  beruf: string;
  familienstand: string;
  verwandtschaft: string;
  ehegatte_im_haushalt: string;

  inland_ja_nein: JaNein;
  inland_periode: Periode;
  kindergeld_anspruch: JaNein;
  geschieden: JaNein;
  nicht_getrennt: JaNein;
  kindesmutter_vater: JaNein;
  oeffentl_mittel_gekuerzt: JaNein;
  vermoegen_ja_nein: JaNein;
  vermoegen_periode: Periode;
  vermoegen_euro: number;
  unterhaltserklaerung: JaNein;

  hat_einkuenfte: JaNein;
  nichtselbst1: EinkunftsZeile;
  nichtselbst2: EinkunftsZeile;
  versorgung: Versorgungsbezuege;
  rente1: Rente;
  rente2: Rente;
  kapital: Kapital;
  uebrig: { von: string; bis: string; euro: number };
  sozial: { von: string; bis: string; euro: number };
  kosten: { von: string; bis: string; euro: number };
  kv_pv: KvPv;

  weitere_beitragende: BeitragendePerson;
};

type AnlageUnterhalt = {
  // Section 1 — eigene Einnahmen der unterstützten Person(en)
  oeffentl_ausbildung: number; // Z. 4
  sozialleistungen: number; // Z. 5
  uebrige_bezuege: number; // Z. 6
  est_zahlungen: number; // Z. 7
  est_erstattungen: number; // Z. 8
  weitere_steuerfrei_bezeichnung: string; // Z. 9 text
  weitere_steuerfrei_euro: number; // Z. 9 euro

  // Section 2 — Haushalt der unterstützten Person(en)
  haushalt_anschrift: string; // Z. 10
  haushalt_land: string; // Z. 11
  haushalt_personen: number; // Z. 12
  unterhalt1_zeitraum: Periode; // Z. 13
  zahlung1_zeitraum: Periode; // Z. 14
  zahlung1_euro: number; // Z. 15
  unterhalt2_zeitraum: Periode; // Z. 16
  zahlung2_zeitraum: Periode; // Z. 17
  zahlung2_euro: number; // Z. 18

  // Section 3 + 4 — unterstützte Personen
  person1: UnterstuetztePerson;
  person2_aktiv: boolean;
  person2: UnterstuetztePerson;
};

// ---------- Defaults ---------------------------------------------------

const EMPTY_PERIODE: Periode = { von: "", bis: "" };
const EMPTY_EINKUENFTE: EinkunftsZeile = {
  von: "",
  bis: "",
  brutto: 0,
  werbungskosten: 0,
};
const EMPTY_VERSORGUNG: Versorgungsbezuege = {
  von: "",
  bis: "",
  euro: 0,
  werbungskosten: 0,
  bemessung: 0,
  kalenderjahr: 0,
};
const EMPTY_RENTE: Rente = {
  von: "",
  bis: "",
  euro: 0,
  steuerpflichtig: 0,
  werbungskosten: 0,
};
const EMPTY_KAPITAL: Kapital = {
  von: "",
  bis: "",
  tariflich: 0,
  abgeltung: 0,
};
const EMPTY_KVPV: KvPv = { kv_basis: 0, kv_mit_krankengeld: 0, pv: 0 };

const EMPTY_PERSON: UnterstuetztePerson = {
  idNr: "",
  name: "",
  geburtsdatum: "",
  sterbedatum: "",
  beruf: "",
  familienstand: "",
  verwandtschaft: "",
  ehegatte_im_haushalt: "",
  inland_ja_nein: "",
  inland_periode: EMPTY_PERIODE,
  kindergeld_anspruch: "",
  geschieden: "",
  nicht_getrennt: "",
  kindesmutter_vater: "",
  oeffentl_mittel_gekuerzt: "",
  vermoegen_ja_nein: "",
  vermoegen_periode: EMPTY_PERIODE,
  vermoegen_euro: 0,
  unterhaltserklaerung: "",
  hat_einkuenfte: "",
  nichtselbst1: EMPTY_EINKUENFTE,
  nichtselbst2: EMPTY_EINKUENFTE,
  versorgung: EMPTY_VERSORGUNG,
  rente1: EMPTY_RENTE,
  rente2: EMPTY_RENTE,
  kapital: EMPTY_KAPITAL,
  uebrig: { von: "", bis: "", euro: 0 },
  sozial: { von: "", bis: "", euro: 0 },
  kosten: { von: "", bis: "", euro: 0 },
  kv_pv: EMPTY_KVPV,
  weitere_beitragende: {
    hat_weitere: "",
    name_adresse: "",
    periode: EMPTY_PERIODE,
    betrag: 0,
    kv_pv: EMPTY_KVPV,
  },
};

const DEFAULT: AnlageUnterhalt = {
  oeffentl_ausbildung: 0,
  sozialleistungen: 0,
  uebrige_bezuege: 0,
  est_zahlungen: 0,
  est_erstattungen: 0,
  weitere_steuerfrei_bezeichnung: "",
  weitere_steuerfrei_euro: 0,
  haushalt_anschrift: "",
  haushalt_land: "",
  haushalt_personen: 0,
  unterhalt1_zeitraum: EMPTY_PERIODE,
  zahlung1_zeitraum: EMPTY_PERIODE,
  zahlung1_euro: 0,
  unterhalt2_zeitraum: EMPTY_PERIODE,
  zahlung2_zeitraum: EMPTY_PERIODE,
  zahlung2_euro: 0,
  person1: EMPTY_PERSON,
  person2_aktiv: false,
  person2: EMPTY_PERSON,
};

const FORM_ID = "anlage-unterhalt";

function mergePerson(partial: Partial<UnterstuetztePerson> | undefined): UnterstuetztePerson {
  if (!partial) return EMPTY_PERSON;
  return {
    ...EMPTY_PERSON,
    ...partial,
    inland_periode: { ...EMPTY_PERIODE, ...(partial.inland_periode ?? {}) },
    vermoegen_periode: { ...EMPTY_PERIODE, ...(partial.vermoegen_periode ?? {}) },
    nichtselbst1: { ...EMPTY_EINKUENFTE, ...(partial.nichtselbst1 ?? {}) },
    nichtselbst2: { ...EMPTY_EINKUENFTE, ...(partial.nichtselbst2 ?? {}) },
    versorgung: { ...EMPTY_VERSORGUNG, ...(partial.versorgung ?? {}) },
    rente1: { ...EMPTY_RENTE, ...(partial.rente1 ?? {}) },
    rente2: { ...EMPTY_RENTE, ...(partial.rente2 ?? {}) },
    kapital: { ...EMPTY_KAPITAL, ...(partial.kapital ?? {}) },
    uebrig: { von: "", bis: "", euro: 0, ...(partial.uebrig ?? {}) },
    sozial: { von: "", bis: "", euro: 0, ...(partial.sozial ?? {}) },
    kosten: { von: "", bis: "", euro: 0, ...(partial.kosten ?? {}) },
    kv_pv: { ...EMPTY_KVPV, ...(partial.kv_pv ?? {}) },
    weitere_beitragende: {
      ...EMPTY_PERSON.weitere_beitragende,
      ...(partial.weitere_beitragende ?? {}),
      periode: {
        ...EMPTY_PERIODE,
        ...(partial.weitere_beitragende?.periode ?? {}),
      },
      kv_pv: {
        ...EMPTY_KVPV,
        ...(partial.weitere_beitragende?.kv_pv ?? {}),
      },
    },
  };
}

function loadForm(mandantId: string | null, jahr: number): AnlageUnterhalt {
  const parsed = readEstForm<Partial<AnlageUnterhalt>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    unterhalt1_zeitraum: { ...EMPTY_PERIODE, ...(parsed.unterhalt1_zeitraum ?? {}) },
    zahlung1_zeitraum: { ...EMPTY_PERIODE, ...(parsed.zahlung1_zeitraum ?? {}) },
    unterhalt2_zeitraum: { ...EMPTY_PERIODE, ...(parsed.unterhalt2_zeitraum ?? {}) },
    zahlung2_zeitraum: { ...EMPTY_PERIODE, ...(parsed.zahlung2_zeitraum ?? {}) },
    person1: mergePerson(parsed.person1),
    person2: mergePerson(parsed.person2),
  };
}

// ---------- Calc helpers -----------------------------------------------

function sumEigeneEinnahmen(form: AnlageUnterhalt): number {
  return (
    form.oeffentl_ausbildung +
    form.sozialleistungen +
    form.uebrige_bezuege +
    form.weitere_steuerfrei_euro -
    form.est_zahlungen +
    form.est_erstattungen
  );
}

/** Honest approximation of "anrechenbare Einkünfte und Bezüge" per
 *  supported person. Summarizes the euro fields; the actual § 33a-calc
 *  has many special cases (Freibeträge, Ländergruppeneinteilung, Rentenanteil)
 *  that are NOT automated here. */
function sumPersonEinkuenfte(p: UnterstuetztePerson): number {
  const nichtselbstNet =
    Math.max(0, p.nichtselbst1.brutto - p.nichtselbst1.werbungskosten) +
    Math.max(0, p.nichtselbst2.brutto - p.nichtselbst2.werbungskosten);
  const versorgungNet = Math.max(
    0,
    p.versorgung.euro - p.versorgung.werbungskosten
  );
  const renteNet =
    Math.max(0, p.rente1.steuerpflichtig - p.rente1.werbungskosten) +
    Math.max(0, p.rente2.steuerpflichtig - p.rente2.werbungskosten);
  const kapital = p.kapital.tariflich + p.kapital.abgeltung;
  const uebrig = p.uebrig.euro;
  const sozial = p.sozial.euro;
  const kosten = p.kosten.euro;
  return (
    nichtselbstNet +
    versorgungNet +
    renteNet +
    kapital +
    uebrig +
    sozial -
    kosten
  );
}

// ---------- Main page --------------------------------------------------

export default function AnlageUnterhaltPage() {
  return (
    <MandantRequiredGuard>
      <AnlageUnterhaltPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageUnterhaltPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const params = getSteuerParameter(selectedYear);

  const [form, setForm] = useState<AnlageUnterhalt>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageUnterhalt>(
    key: K,
    value: AnlageUnterhalt[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPerson(
    which: "person1" | "person2",
    updater: (p: UnterstuetztePerson) => UnterstuetztePerson
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  const zahlungenGesamt = form.zahlung1_euro + form.zahlung2_euro;

  const derivedP1 = useMemo(() => {
    const einkuenfte = sumPersonEinkuenfte(form.person1);
    const anrechenbar = Math.max(0, einkuenfte - ANRECHNUNGSFREIBETRAG);
    const hoechstbetrag = params.grundfreibetrag_euro;
    const abzug = Math.max(
      0,
      Math.min(form.zahlung1_euro, hoechstbetrag - anrechenbar)
    );
    return { einkuenfte, anrechenbar, hoechstbetrag, abzug };
  }, [form.person1, form.zahlung1_euro, params.grundfreibetrag_euro]);

  const derivedP2 = useMemo(() => {
    const einkuenfte = sumPersonEinkuenfte(form.person2);
    const anrechenbar = Math.max(0, einkuenfte - ANRECHNUNGSFREIBETRAG);
    const hoechstbetrag = params.grundfreibetrag_euro;
    const abzug = form.person2_aktiv
      ? Math.max(
          0,
          Math.min(form.zahlung2_euro, hoechstbetrag - anrechenbar)
        )
      : 0;
    return { einkuenfte, anrechenbar, hoechstbetrag, abzug };
  }, [
    form.person2,
    form.person2_aktiv,
    form.zahlung2_euro,
    params.grundfreibetrag_euro,
  ]);

  const gesamtAbzug = derivedP1.abzug + derivedP2.abzug;

  function validate(): string[] {
    const warns: string[] = [];
    const chkPeriode = (label: string, p: Periode) => {
      if (p.von && p.bis && p.von > p.bis) {
        warns.push(`${label}: Von-Datum liegt nach Bis-Datum.`);
      }
    };
    chkPeriode("Zahlung Zeitraum 1", form.zahlung1_zeitraum);
    chkPeriode("Zahlung Zeitraum 2", form.zahlung2_zeitraum);
    chkPeriode("Person 1 · Inland-Haushalt", form.person1.inland_periode);
    if (form.person2_aktiv) {
      chkPeriode("Person 2 · Inland-Haushalt", form.person2.inland_periode);
    }
    if (form.haushalt_personen < 0) warns.push("Personenzahl Haushalt negativ.");
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) {
      toast.warning(warns.join(" · "), { duration: 7000 });
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-unterhalt"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-unterhalt",
      summary: `Anlage Unterhalt gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-unterhalt",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        gesamtAbzug,
        derivedP1,
        derivedP2,
        form,
      },
    });
    toast.success("Anlage Unterhalt gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage Unterhalt</h1>
          <p>
            Unterhaltsleistungen nach § 33a Abs. 1 EStG · bis zu 2 unterstützte
            Personen je Formular · VZ {selectedYear}.
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
          Anlage Unterhalt · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-unterhalt" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Höchstbetrag {selectedYear}:</strong>{" "}
          {euro.format(params.grundfreibetrag_euro)} (§ 33a Abs. 1 EStG,
          identisch mit Grundfreibetrag) · Anrechnungsfreibetrag für eigene
          Einkünfte/Bezüge:{" "}
          {euro.format(ANRECHNUNGSFREIBETRAG)}. Abzug je unterstützter Person =
          min(Zahlung, Höchstbetrag − (eigene Einkünfte −{" "}
          {euro.format(ANRECHNUNGSFREIBETRAG)})).
        </div>
      </aside>

      <BmfForm
        title="Anlage Unterhalt"
        subtitle={`Unterhaltsleistungen § 33a Abs. 1 EStG · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection
          title="1. Eigene Einnahmen und Zahlungen der unterstützenden Person (Z. 4–9)"
          description="Für die Prüfung der wirtschaftlichen Leistungsfähigkeit."
        >
          <BmfInputRow
            kz=""
            label="Öffentliche Ausbildungshilfen (z. B. BAföG-Zuschüsse)"
            hint="Z. 4"
            value={form.oeffentl_ausbildung}
            onChange={(v) => set("oeffentl_ausbildung", v)}
          />
          <BmfInputRow
            kz=""
            label="Sozialleistungen (z. B. Wohngeld)"
            hint="Z. 5"
            value={form.sozialleistungen}
            onChange={(v) => set("sozialleistungen", v)}
          />
          <BmfInputRow
            kz=""
            label="Übrige Bezüge (z. B. aus Minijobs)"
            hint="Z. 6"
            value={form.uebrige_bezuege}
            onChange={(v) => set("uebrige_bezuege", v)}
          />
          <BmfInputRow
            kz=""
            label="Einkommensteuerzahlungen (inkl. KiSt, SolZ)"
            hint="Z. 7"
            value={form.est_zahlungen}
            onChange={(v) => set("est_zahlungen", v)}
          />
          <BmfInputRow
            kz=""
            label="Einkommensteuererstattungen (inkl. KiSt, SolZ)"
            hint="Z. 8"
            value={form.est_erstattungen}
            onChange={(v) => set("est_erstattungen", v)}
          />
          <TextRow
            zeile="9"
            label="Weitere steuerfreie Einnahmen — Bezeichnung"
            value={form.weitere_steuerfrei_bezeichnung}
            onChange={(v) => set("weitere_steuerfrei_bezeichnung", v)}
            placeholder="z. B. Arbeitnehmer-Sparzulage, Baukindergeld"
          />
          <BmfInputRow
            kz=""
            label="Weitere steuerfreie Einnahmen — Betrag"
            hint="Z. 9"
            value={form.weitere_steuerfrei_euro}
            onChange={(v) => set("weitere_steuerfrei_euro", v)}
          />
          <BmfRow
            kz=""
            label="Summe eigene Einnahmen und Zahlungen (Info)"
            value={sumEigeneEinnahmen(form)}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Haushalt der unterstützten Person(en) (Z. 10–18)"
          description="Adresse, Personenzahl im Haushalt und geleistete Zahlungen."
        >
          <TextRow
            zeile="10"
            label="Anschrift dieses Haushaltes"
            value={form.haushalt_anschrift}
            onChange={(v) => set("haushalt_anschrift", v)}
            placeholder="Straße, PLZ, Ort"
          />
          <TextRow
            zeile="11"
            label="Wohnsitzstaat (wenn Ausland)"
            value={form.haushalt_land}
            onChange={(v) => set("haushalt_land", v)}
            placeholder="z. B. Türkei"
          />
          <BmfInputRow
            kz=""
            label="Anzahl Personen im Haushalt laut Z. 10"
            hint="Z. 12"
            value={form.haushalt_personen}
            onChange={(v) => set("haushalt_personen", v)}
            step={1}
          />
          <PeriodeRow
            zeile="13"
            label="1. Unterstützungszeitraum (vom/bis)"
            value={form.unterhalt1_zeitraum}
            onChange={(v) => set("unterhalt1_zeitraum", v)}
          />
          <PeriodeRow
            zeile="14"
            label="1. Zahlungszeitraum (vom/bis)"
            value={form.zahlung1_zeitraum}
            onChange={(v) => set("zahlung1_zeitraum", v)}
          />
          <BmfInputRow
            kz=""
            label="Höhe der Unterhaltszahlung — ohne Bargeld"
            hint="Z. 15"
            value={form.zahlung1_euro}
            onChange={(v) => set("zahlung1_euro", v)}
          />
          <PeriodeRow
            zeile="16"
            label="2. Unterstützungszeitraum (vom/bis)"
            value={form.unterhalt2_zeitraum}
            onChange={(v) => set("unterhalt2_zeitraum", v)}
          />
          <PeriodeRow
            zeile="17"
            label="2. Zahlungszeitraum (vom/bis)"
            value={form.zahlung2_zeitraum}
            onChange={(v) => set("zahlung2_zeitraum", v)}
          />
          <BmfInputRow
            kz=""
            label="Höhe der Unterhaltszahlung — ohne Bargeld"
            hint="Z. 18"
            value={form.zahlung2_euro}
            onChange={(v) => set("zahlung2_euro", v)}
          />
          <BmfRow
            kz=""
            label="Summe Unterhaltszahlungen (Z. 15 + Z. 18)"
            value={zahlungenGesamt}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <UnterstuetztePersonBlock
          title="3. Angaben zur 1. unterstützten Person (Z. 19–49)"
          base={19}
          person={form.person1}
          onChange={(updater) => setPerson("person1", updater)}
        />

        <BmfRow
          kz=""
          label="Person 1 · anrechenbare eigene Einkünfte (Info)"
          value={derivedP1.anrechenbar}
          subtotal
        />
        <BmfRow
          kz=""
          label={`Person 1 · abziehbarer Unterhalt (min(Zahlung, ${euro.format(derivedP1.hoechstbetrag)} − Anrechnung))`}
          value={derivedP1.abzug}
          subtotal
        />

        {/* ============ Section 4 ============ */}
        <section className="card taxcalc__section no-print">
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.person2_aktiv}
              onChange={(e) => set("person2_aktiv", e.target.checked)}
            />
            <span>2. unterstützte Person erfassen (Z. 50–80)</span>
          </label>
        </section>

        {form.person2_aktiv && (
          <>
            <UnterstuetztePersonBlock
              title="4. Angaben zur 2. unterstützten Person (Z. 50–80)"
              base={50}
              person={form.person2}
              onChange={(updater) => setPerson("person2", updater)}
            />
            <BmfRow
              kz=""
              label="Person 2 · anrechenbare eigene Einkünfte (Info)"
              value={derivedP2.anrechenbar}
              subtotal
            />
            <BmfRow
              kz=""
              label={`Person 2 · abziehbarer Unterhalt (min(Zahlung, ${euro.format(derivedP2.hoechstbetrag)} − Anrechnung))`}
              value={derivedP2.abzug}
              subtotal
            />
          </>
        )}

        <BmfResult
          label="Abzugsfähige Unterhaltsleistungen gesamt (Info · § 33a Abs. 1 EStG)"
          value={gesamtAbzug}
          variant={gesamtAbzug > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures
          left="Datum, Ort"
          right="Unterschrift Steuerpflichtige:r"
        />

        <BmfFootnotes>
          <p>
            <strong>Vereinfachte Berechnung:</strong> Der Abzug je Person ={" "}
            <em>
              min(Unterhaltszahlung, Höchstbetrag −
              max(0, eigene Einkünfte/Bezüge − {euro.format(ANRECHNUNGSFREIBETRAG)}))
            </em>
            . Der Höchstbetrag {selectedYear} entspricht dem Grundfreibetrag
            ({euro.format(params.grundfreibetrag_euro)}).
          </p>
          <p>
            <strong>NICHT automatisch berücksichtigt:</strong>{" "}
            Ländergruppeneinteilung (BMF-Schreiben zur Kürzung bei Ausland-Haushalt),
            Erhöhung Höchstbetrag um Basis-KV/PV der unterstützten Person,
            zeitanteilige Kürzung bei unterjähriger Unterstützung, Angemessenheit
            der Zahlungen vs. eigene Leistungsfähigkeit, Aufteilung bei mehreren
            Unterhaltsgebern.
          </p>
          <p>
            <strong>Kennziffern (Kz) / Zeilen-Nr. (Z.):</strong> Die Zeilen 4–80
            entsprechen der offiziellen Anlage Unterhalt 2025. Spezifische
            Kennziffern pro Feld wurden nicht angegeben — im ELSTER-XML werden
            die Werte der entsprechenden Kz zugeordnet.
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

// ---------- Supported-person block ------------------------------------

type PersonBlockProps = {
  title: string;
  base: number;
  person: UnterstuetztePerson;
  onChange: (
    updater: (p: UnterstuetztePerson) => UnterstuetztePerson
  ) => void;
};

function UnterstuetztePersonBlock({
  title,
  base,
  person,
  onChange,
}: PersonBlockProps) {
  const setField = <K extends keyof UnterstuetztePerson>(
    key: K,
    value: UnterstuetztePerson[K]
  ) => {
    onChange((p) => ({ ...p, [key]: value }));
  };

  return (
    <>
      <BmfSection title={`${title} · Allgemein (Z. ${base}–${base + 3})`}>
        <TextRow
          zeile={String(base)}
          label="Identifikationsnummer · Name, Vorname"
          value={
            person.idNr || person.name
              ? `${person.idNr} · ${person.name}`.replace(/^ · /, "")
              : ""
          }
          onChange={(v) => {
            // Parse back: split on " · "
            const [id, ...rest] = v.split(" · ");
            setField("idNr", id ?? "");
            setField("name", rest.join(" · "));
          }}
          placeholder="11-stellige IdNr · Nachname, Vorname"
        />
        <TextRow
          zeile={String(base + 1)}
          label="Geburtsdatum · Sterbedatum (falls 2025 verstorben) · Beruf, Familienstand"
          value={[
            person.geburtsdatum,
            person.sterbedatum,
            person.beruf,
            person.familienstand,
          ]
            .filter(Boolean)
            .join(" · ")}
          onChange={(v) => {
            const parts = v.split(" · ");
            setField("geburtsdatum", parts[0] ?? "");
            setField("sterbedatum", parts[1] ?? "");
            setField("beruf", parts[2] ?? "");
            setField("familienstand", parts[3] ?? "");
          }}
          placeholder="TT.MM.JJJJ · TT.MM.JJJJ · Beruf · Familienstand"
        />
        <TextRow
          zeile={String(base + 2)}
          label="Verwandtschaftsverhältnis zur unterstützenden Person"
          value={person.verwandtschaft}
          onChange={(v) => setField("verwandtschaft", v)}
          placeholder="z. B. Mutter, Schwiegervater, geschiedener Ehegatte"
        />
        <TextRow
          zeile={String(base + 3)}
          label="Name, Vorname des im selben Haushalt lebenden Ehegatten/Lebenspartners"
          value={person.ehegatte_im_haushalt}
          onChange={(v) => setField("ehegatte_im_haushalt", v)}
        />
      </BmfSection>

      <BmfSection title={`Lebensort / Unterhaltsberechtigung (Z. ${base + 4}–${base + 11})`}>
        <JaNeinPeriodeRow
          zeile={String(base + 4)}
          label="Unterstützte Person lebte in meinem inländischen Haushalt"
          ja_nein={person.inland_ja_nein}
          onJaNein={(v) => setField("inland_ja_nein", v)}
          periode={person.inland_periode}
          onPeriode={(p) => setField("inland_periode", p)}
        />
        <JaNeinRow
          zeile={String(base + 5)}
          label="Anspruch auf Kindergeld / Freibeträge für die Person?"
          value={person.kindergeld_anspruch}
          onChange={(v) => setField("kindergeld_anspruch", v)}
        />
        <JaNeinRow
          zeile={String(base + 6)}
          label="Geschiedener Ehegatte / Lebenspartner"
          value={person.geschieden}
          onChange={(v) => setField("geschieden", v)}
        />
        <JaNeinRow
          zeile={String(base + 7)}
          label="Nicht dauernd getrennt lebender Ehegatte / Lebenspartner"
          value={person.nicht_getrennt}
          onChange={(v) => setField("nicht_getrennt", v)}
        />
        <JaNeinRow
          zeile={String(base + 8)}
          label="Als Kindesmutter / Kindesvater gesetzlich unterhaltsberechtigt"
          value={person.kindesmutter_vater}
          onChange={(v) => setField("kindesmutter_vater", v)}
        />
        <JaNeinRow
          zeile={String(base + 9)}
          label="Öffentliche Mittel wegen Unterhaltszahlung gekürzt / nicht gewährt"
          value={person.oeffentl_mittel_gekuerzt}
          onChange={(v) => setField("oeffentl_mittel_gekuerzt", v)}
        />
        <JaNeinPeriodeAmountRow
          zeile={String(base + 10)}
          label="Vermögen der unterstützten Person im Unterhaltszeitraum"
          ja_nein={person.vermoegen_ja_nein}
          onJaNein={(v) => setField("vermoegen_ja_nein", v)}
          periode={person.vermoegen_periode}
          onPeriode={(p) => setField("vermoegen_periode", p)}
          euro={person.vermoegen_euro}
          onEuro={(v) => setField("vermoegen_euro", v)}
        />
        <JaNeinRow
          zeile={String(base + 11)}
          label="Unterhaltserklärung über Bedürftigkeit liegt vor"
          value={person.unterhaltserklaerung}
          onChange={(v) => setField("unterhaltserklaerung", v)}
        />
      </BmfSection>

      <BmfSection
        title={`Einkünfte und Bezüge (Z. ${base + 12}–${base + 25})`}
        description="Diese Werte werden auf den Höchstbetrag angerechnet (§ 33a Abs. 1 EStG, Anrechnungsfreibetrag 624 €)."
      >
        <JaNeinRow
          zeile={String(base + 12)}
          label="Hat Einkünfte, Bezüge und/oder öffentliche Ausbildungshilfen erzielt?"
          value={person.hat_einkuenfte}
          onChange={(v) => setField("hat_einkuenfte", v)}
        />
        <EinkunftsZeileRow
          zeile={String(base + 13)}
          label="Einkünfte nichtselbständige Arbeit (1) — Zeitraum · Brutto · WK"
          value={person.nichtselbst1}
          onChange={(v) => setField("nichtselbst1", v)}
        />
        <EinkunftsZeileRow
          zeile={String(base + 14)}
          label="Einkünfte nichtselbständige Arbeit (2) — Zeitraum · Brutto · WK"
          value={person.nichtselbst2}
          onChange={(v) => setField("nichtselbst2", v)}
        />
        <VersorgungsRow
          zeile={String(base + 15)}
          label="Versorgungsbezüge — Zeitraum · Bezug · WK · Bemessung · Jahr"
          value={person.versorgung}
          onChange={(v) => setField("versorgung", v)}
        />
        <RenteRow
          zeile={String(base + 16)}
          label="Sonstige Einkünfte — Rente (1) · Zeitraum · Gesamt · stpfl. · WK"
          value={person.rente1}
          onChange={(v) => setField("rente1", v)}
        />
        <RenteRow
          zeile={String(base + 17)}
          label="Sonstige Einkünfte — Rente (2) · Zeitraum · Gesamt · stpfl. · WK"
          value={person.rente2}
          onChange={(v) => setField("rente2", v)}
        />
        <KapitalRow
          zeile={String(base + 18)}
          label="Kapitalvermögen — Zeitraum · tariflich · Abgeltung"
          value={person.kapital}
          onChange={(v) => setField("kapital", v)}
        />
        <PeriodAmountRow
          zeile={String(base + 19)}
          label="Übrige Einkünfte — Zeitraum · Betrag"
          value={person.uebrig}
          onChange={(v) => setField("uebrig", v)}
        />
        <PeriodAmountRow
          zeile={String(base + 20)}
          label="Sozialleistungen / öffentl. Ausbildungshilfen — Zeitraum · Betrag"
          value={person.sozial}
          onChange={(v) => setField("sozial", v)}
        />
        <PeriodAmountRow
          zeile={String(base + 21)}
          label="Kosten zu allen Bezügen — Zeitraum · Betrag"
          value={person.kosten}
          onChange={(v) => setField("kosten", v)}
        />
        <BmfInputRow
          kz=""
          label="Basis-KV-Beiträge"
          hint={`Z. ${base + 22}`}
          value={person.kv_pv.kv_basis}
          onChange={(v) =>
            setField("kv_pv", { ...person.kv_pv, kv_basis: v })
          }
        />
        <BmfInputRow
          kz=""
          label="davon KV-Beiträge mit Krankengeld-Anspruch"
          hint={`Z. ${base + 23}`}
          value={person.kv_pv.kv_mit_krankengeld}
          onChange={(v) =>
            setField("kv_pv", { ...person.kv_pv, kv_mit_krankengeld: v })
          }
        />
        <BmfInputRow
          kz=""
          label="Pflegeversicherung"
          hint={`Z. ${base + 24}`}
          value={person.kv_pv.pv}
          onChange={(v) => setField("kv_pv", { ...person.kv_pv, pv: v })}
        />
        <BmfRow
          kz=""
          label="Anrechenbare Einkünfte (Info · vereinfachte Summe)"
          value={sumPersonEinkuenfte(person)}
          subtotal
        />
      </BmfSection>

      <BmfSection
        title={`Weitere beitragende Personen (Z. ${base + 26}–${base + 30})`}
        description="Wenn mehrere Personen zur Unterhaltsleistung beigetragen haben."
      >
        <JaNeinRow
          zeile={String(base + 26)}
          label="Hat eine weitere Person zum Unterhalt beigetragen?"
          value={person.weitere_beitragende.hat_weitere}
          onChange={(v) =>
            setField("weitere_beitragende", {
              ...person.weitere_beitragende,
              hat_weitere: v,
            })
          }
        />
        {person.weitere_beitragende.hat_weitere === "ja" && (
          <>
            <TextRow
              zeile={String(base + 27)}
              label="Name und Anschrift der beitragenden Person"
              value={person.weitere_beitragende.name_adresse}
              onChange={(v) =>
                setField("weitere_beitragende", {
                  ...person.weitere_beitragende,
                  name_adresse: v,
                })
              }
            />
            <PeriodAmountRow
              zeile={String(base + 28)}
              label="Betrag — Zeitraum · Euro"
              value={{
                ...person.weitere_beitragende.periode,
                euro: person.weitere_beitragende.betrag,
              }}
              onChange={(v) =>
                setField("weitere_beitragende", {
                  ...person.weitere_beitragende,
                  periode: { von: v.von, bis: v.bis },
                  betrag: v.euro,
                })
              }
            />
            <BmfInputRow
              kz=""
              label="Basis-KV-Beiträge (weitere Person)"
              hint={`Z. ${base + 29}`}
              value={person.weitere_beitragende.kv_pv.kv_basis}
              onChange={(v) =>
                setField("weitere_beitragende", {
                  ...person.weitere_beitragende,
                  kv_pv: { ...person.weitere_beitragende.kv_pv, kv_basis: v },
                })
              }
            />
            <BmfInputRow
              kz=""
              label="Pflegeversicherung (weitere Person)"
              hint={`Z. ${base + 30}`}
              value={person.weitere_beitragende.kv_pv.pv}
              onChange={(v) =>
                setField("weitere_beitragende", {
                  ...person.weitere_beitragende,
                  kv_pv: { ...person.weitere_beitragende.kv_pv, pv: v },
                })
              }
            />
          </>
        )}
      </BmfSection>
    </>
  );
}

// ---------- Composite row helpers --------------------------------------

const textInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #dee2ea",
  font: "inherit",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
  textAlign: "right",
};

const monoInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #dee2ea",
  fontFamily: "var(--font-mono)",
  fontSize: "0.85rem",
  fontWeight: 700,
  textAlign: "right",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
};

function WideRow({
  kz,
  zeile,
  label,
  children,
  wide = 360,
}: {
  kz: string;
  zeile: string;
  label: string;
  children: ReactNode;
  wide?: number;
}) {
  return (
    <div
      className="bmf-form__row"
      style={{ gridTemplateColumns: `48px 1fr ${wide}px` }}
    >
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
      <div className="bmf-form__amount" style={{ minWidth: 0, padding: "4px 8px" }}>
        {children}
      </div>
    </div>
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
    <WideRow kz="" zeile={zeile} label={label} wide={280}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={textInputStyle}
      />
    </WideRow>
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

function PeriodeRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: Periode;
  onChange: (v: Periode) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={280}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
        <input
          type="date"
          value={value.von}
          onChange={(e) => onChange({ ...value, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={value.bis}
          onChange={(e) => onChange({ ...value, bis: e.target.value })}
          style={textInputStyle}
        />
      </div>
    </WideRow>
  );
}

function JaNeinPeriodeRow({
  zeile,
  label,
  ja_nein,
  onJaNein,
  periode,
  onPeriode,
}: {
  zeile: string;
  label: string;
  ja_nein: JaNein;
  onJaNein: (v: JaNein) => void;
  periode: Periode;
  onPeriode: (v: Periode) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={360}>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 4, width: "100%" }}>
        <select
          value={ja_nein}
          onChange={(e) => onJaNein(e.target.value as JaNein)}
          style={{ ...textInputStyle, textAlign: "left" }}
        >
          <option value="">—</option>
          <option value="ja">1 · Ja</option>
          <option value="nein">2 · Nein</option>
        </select>
        <input
          type="date"
          value={periode.von}
          onChange={(e) => onPeriode({ ...periode, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={periode.bis}
          onChange={(e) => onPeriode({ ...periode, bis: e.target.value })}
          style={textInputStyle}
        />
      </div>
    </WideRow>
  );
}

function JaNeinPeriodeAmountRow({
  zeile,
  label,
  ja_nein,
  onJaNein,
  periode,
  onPeriode,
  euro: euroVal,
  onEuro,
}: {
  zeile: string;
  label: string;
  ja_nein: JaNein;
  onJaNein: (v: JaNein) => void;
  periode: Periode;
  onPeriode: (v: Periode) => void;
  euro: number;
  onEuro: (v: number) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={460}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 1fr 100px",
          gap: 4,
          width: "100%",
        }}
      >
        <select
          value={ja_nein}
          onChange={(e) => onJaNein(e.target.value as JaNein)}
          style={{ ...textInputStyle, textAlign: "left" }}
        >
          <option value="">—</option>
          <option value="ja">1 · Ja</option>
          <option value="nein">2 · Nein</option>
        </select>
        <input
          type="date"
          value={periode.von}
          onChange={(e) => onPeriode({ ...periode, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={periode.bis}
          onChange={(e) => onPeriode({ ...periode, bis: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={euroVal === 0 ? "" : euroVal}
          onChange={(e) => onEuro(Number(e.target.value) || 0)}
          placeholder="€"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function PeriodAmountRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: { von: string; bis: string; euro: number };
  onChange: (v: { von: string; bis: string; euro: number }) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={340}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 100px",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="date"
          value={value.von}
          onChange={(e) => onChange({ ...value, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={value.bis}
          onChange={(e) => onChange({ ...value, bis: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.euro === 0 ? "" : value.euro}
          onChange={(e) => onChange({ ...value, euro: Number(e.target.value) || 0 })}
          placeholder="€"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function EinkunftsZeileRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: EinkunftsZeile;
  onChange: (v: EinkunftsZeile) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={460}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 110px 110px",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="date"
          value={value.von}
          onChange={(e) => onChange({ ...value, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={value.bis}
          onChange={(e) => onChange({ ...value, bis: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.brutto === 0 ? "" : value.brutto}
          onChange={(e) => onChange({ ...value, brutto: Number(e.target.value) || 0 })}
          placeholder="Brutto €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.werbungskosten === 0 ? "" : value.werbungskosten}
          onChange={(e) =>
            onChange({ ...value, werbungskosten: Number(e.target.value) || 0 })
          }
          placeholder="WK €"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function VersorgungsRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: Versorgungsbezuege;
  onChange: (v: Versorgungsbezuege) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={560}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 90px 90px 90px 70px",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="date"
          value={value.von}
          onChange={(e) => onChange({ ...value, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={value.bis}
          onChange={(e) => onChange({ ...value, bis: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.euro === 0 ? "" : value.euro}
          onChange={(e) => onChange({ ...value, euro: Number(e.target.value) || 0 })}
          placeholder="Bezug €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.werbungskosten === 0 ? "" : value.werbungskosten}
          onChange={(e) =>
            onChange({ ...value, werbungskosten: Number(e.target.value) || 0 })
          }
          placeholder="WK €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.bemessung === 0 ? "" : value.bemessung}
          onChange={(e) =>
            onChange({ ...value, bemessung: Number(e.target.value) || 0 })
          }
          placeholder="Bemess. €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="1900"
          max="2099"
          step={1}
          value={value.kalenderjahr === 0 ? "" : value.kalenderjahr}
          onChange={(e) =>
            onChange({ ...value, kalenderjahr: Number(e.target.value) || 0 })
          }
          placeholder="Jahr"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function RenteRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: Rente;
  onChange: (v: Rente) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={520}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 100px 100px 100px",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="date"
          value={value.von}
          onChange={(e) => onChange({ ...value, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={value.bis}
          onChange={(e) => onChange({ ...value, bis: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.euro === 0 ? "" : value.euro}
          onChange={(e) => onChange({ ...value, euro: Number(e.target.value) || 0 })}
          placeholder="Gesamt €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.steuerpflichtig === 0 ? "" : value.steuerpflichtig}
          onChange={(e) =>
            onChange({ ...value, steuerpflichtig: Number(e.target.value) || 0 })
          }
          placeholder="stpfl. €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.werbungskosten === 0 ? "" : value.werbungskosten}
          onChange={(e) =>
            onChange({ ...value, werbungskosten: Number(e.target.value) || 0 })
          }
          placeholder="WK €"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function KapitalRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: Kapital;
  onChange: (v: Kapital) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={460}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 110px 110px",
          gap: 4,
          width: "100%",
        }}
      >
        <input
          type="date"
          value={value.von}
          onChange={(e) => onChange({ ...value, von: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="date"
          value={value.bis}
          onChange={(e) => onChange({ ...value, bis: e.target.value })}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.tariflich === 0 ? "" : value.tariflich}
          onChange={(e) =>
            onChange({ ...value, tariflich: Number(e.target.value) || 0 })
          }
          placeholder="tariflich €"
          style={monoInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={value.abgeltung === 0 ? "" : value.abgeltung}
          onChange={(e) =>
            onChange({ ...value, abgeltung: Number(e.target.value) || 0 })
          }
          placeholder="Abgelt. €"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}
