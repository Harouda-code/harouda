import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import { FORM_META } from "../data/formMeta";
import { log as auditLog } from "../api/audit";
import FormMetaBadge from "../components/FormMetaBadge";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import {
  buildEstStorageKey,
  readEstForm,
  writeEstForm,
  migrateEstFormsV2ToV3,
} from "../domain/est/estStorage";
import {
  BmfForm,
  BmfSection,
  BmfInputRow,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

type JaNein = "ja" | "nein" | "";
type Religion = "" | "EV" | "RK" | "VD" | "JD" | "IL" | "AL" | "FA" | "FB";
type ReligionChange = 0 | 1 | 2 | 3;

const RELIGION_LABEL: Record<Religion, string> = {
  "": "— keine Auswahl —",
  EV: "Evangelisch (EV)",
  RK: "Römisch-Katholisch (RK)",
  VD: "Nicht kirchensteuerpflichtig (VD)",
  JD: "Jüdisch (JD)",
  IL: "Islamisch (IL)",
  AL: "Alt-Katholisch (AL)",
  FA: "Freireligiös (FA)",
  FB: "Andere Gemeinschaft (FB)",
};

// ---------- State ------------------------------------------------------

type HauptvordruckESt1A = {
  // Section 1
  ist_einkommensteuer: boolean;
  ist_sparzulage: boolean;
  ist_kist_kapital: boolean;
  ist_verlustvortrag: boolean;
  ist_mobilitaetspraemie: boolean;

  // Section 2
  steuernummer: string;
  finanzamt: string;
  bisheriges_finanzamt: string;
  telefon: string;

  // Section 3 — Person A
  a_idnr: string;
  a_geburt: string;
  a_sterbe: string;
  a_name: string;
  a_vorname: string;
  a_titel: string;
  a_beruf: string;
  a_strasse: string;
  a_hausnr: string;
  a_hausnr_zusatz: string;
  a_adresse_ergaenzung: string;
  a_plz_inland: string;
  a_plz_ausland: string;
  a_wohnort: string;
  a_staat: string;
  a_religion: Religion;
  a_religion_change: ReligionChange;

  z18_verheiratet_seit: string;
  z18_verwitwet_seit: string;
  z18_geschieden_seit: string;
  z18_getrennt_seit: string;

  // Section 4
  veranlagungsart: 0 | 1 | 2;
  guetergemeinschaft: boolean;

  // Section 5 — Person B
  b_idnr: string;
  b_geburt: string;
  b_sterbe: string;
  b_name: string;
  b_vorname: string;
  b_titel: string;
  b_beruf: string;
  b_religion: Religion;
  b_religion_change: ReligionChange;
  b_abweichende_adresse: boolean;
  b_strasse: string;
  b_hausnr: string;
  b_hausnr_zusatz: string;
  b_adresse_ergaenzung: string;
  b_plz_inland: string;
  b_plz_ausland: string;
  b_wohnort: string;
  b_staat: string;

  // Section 6
  iban_inland: string;
  iban_ausland: string;
  bic_ausland: string;
  kontoinhaber: "a" | "b" | "anderer" | "";
  kontoinhaber_name: string;

  // Section 7
  z34_sparzulage_a: JaNein;
  z34_sparzulage_b: JaNein;

  // Section 8
  z35_einkommensersatz_a: number;
  z35_einkommensersatz_b: number;
  z36_eu_ersatz_a: number;
  z36_eu_ersatz_b: number;

  // Section 9
  z37_ergaenzende: 0 | 1 | 2 | 3 | 4;

  // Section 10
  z39_mitwirkung: JaNein;
  z40_mitwirkender: string;
};

const DEFAULT: HauptvordruckESt1A = {
  ist_einkommensteuer: true,
  ist_sparzulage: false,
  ist_kist_kapital: false,
  ist_verlustvortrag: false,
  ist_mobilitaetspraemie: false,
  steuernummer: "",
  finanzamt: "",
  bisheriges_finanzamt: "",
  telefon: "",
  a_idnr: "",
  a_geburt: "",
  a_sterbe: "",
  a_name: "",
  a_vorname: "",
  a_titel: "",
  a_beruf: "",
  a_strasse: "",
  a_hausnr: "",
  a_hausnr_zusatz: "",
  a_adresse_ergaenzung: "",
  a_plz_inland: "",
  a_plz_ausland: "",
  a_wohnort: "",
  a_staat: "",
  a_religion: "",
  a_religion_change: 0,
  z18_verheiratet_seit: "",
  z18_verwitwet_seit: "",
  z18_geschieden_seit: "",
  z18_getrennt_seit: "",
  veranlagungsart: 0,
  guetergemeinschaft: false,
  b_idnr: "",
  b_geburt: "",
  b_sterbe: "",
  b_name: "",
  b_vorname: "",
  b_titel: "",
  b_beruf: "",
  b_religion: "",
  b_religion_change: 0,
  b_abweichende_adresse: false,
  b_strasse: "",
  b_hausnr: "",
  b_hausnr_zusatz: "",
  b_adresse_ergaenzung: "",
  b_plz_inland: "",
  b_plz_ausland: "",
  b_wohnort: "",
  b_staat: "",
  iban_inland: "",
  iban_ausland: "",
  bic_ausland: "",
  kontoinhaber: "",
  kontoinhaber_name: "",
  z34_sparzulage_a: "",
  z34_sparzulage_b: "",
  z35_einkommensersatz_a: 0,
  z35_einkommensersatz_b: 0,
  z36_eu_ersatz_a: 0,
  z36_eu_ersatz_b: 0,
  z37_ergaenzende: 0,
  z39_mitwirkung: "",
  z40_mitwirkender: "",
};

const FORM_ID = "est-1a";

function loadForm(
  mandantId: string | null,
  jahr: number
): HauptvordruckESt1A {
  const parsed = readEstForm<Partial<HauptvordruckESt1A>>(
    FORM_ID,
    mandantId,
    jahr
  );
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Formular-Übersicht Links ----------------------------------

type AnlageLink = {
  to: string;
  label: string;
  /** form-id ohne `harouda:`-Prefix; wird via buildEstStorageKey + aktivem
   *  Mandant zur Laufzeit zum vollen Storage-Key aufgelöst. */
  formId: string;
};

const ANLAGE_LINKS: AnlageLink[] = [
  { to: "/steuer/anlage-n", label: "Anlage N · Arbeitslohn", formId: "anlage-n" },
  { to: "/steuer/anlage-n-aus", label: "Anlage N-AUS · ausl. Arbeitslohn", formId: "anlage-n-aus" },
  { to: "/steuer/anlage-n-dhf", label: "Anlage N-DHF · Doppelte Haushaltsführung", formId: "anlage-n-dhf" },
  { to: "/steuer/anlage-s", label: "Anlage S · selbst. Arbeit", formId: "anlage-s" },
  { to: "/steuer/anlage-g", label: "Anlage G · Gewerbe", formId: "anlage-g" },
  { to: "/steuer/anlage-v", label: "Anlage V · Vermietung", formId: "anlage-v" },
  { to: "/steuer/anlage-v-sonstige", label: "Anlage V-Sonstige", formId: "anlage-v-sonstige" },
  { to: "/steuer/anlage-v-fewo", label: "Anlage V-FeWo · Ferienwohnung", formId: "anlage-v-fewo" },
  { to: "/steuer/anlage-so", label: "Anlage SO · sonstige Einkünfte", formId: "anlage-so" },
  { to: "/steuer/anlage-r", label: "Anlage R · Renten Inland", formId: "anlage-r" },
  { to: "/steuer/anlage-rav-bav", label: "Anlage R-AV/bAV · Riester/Rürup/bAV", formId: "anlage-rav-bav" },
  { to: "/steuer/anlage-kap", label: "Anlage KAP · Kapitalvermögen", formId: "anlage-kap" },
  { to: "/steuer/anlage-aus", label: "Anlage AUS · ausl. Einkünfte", formId: "anlage-aus" },
  { to: "/steuer/anlage-vorsorge", label: "Anlage Vorsorgeaufwand", formId: "anlage-vorsorge" },
  { to: "/steuer/anlage-av", label: "Anlage AV · Riester", formId: "anlage-av" },
  { to: "/steuer/anlage-sonder", label: "Anlage Sonderausgaben", formId: "anlage-sonder" },
  { to: "/steuer/anlage-agb", label: "Anlage Außergewöhnliche Belastungen", formId: "anlage-agb" },
  { to: "/steuer/anlage-kind", label: "Anlage Kind", formId: "anlage-kind" },
  { to: "/steuer/anlage-u", label: "Anlage U · Realsplitting", formId: "anlage-u" },
  { to: "/steuer/anlage-unterhalt", label: "Anlage Unterhalt", formId: "anlage-unterhalt" },
  { to: "/steuer/anlage-haa", label: "Anlage Haushaltsnahe Aufwendungen", formId: "anlage-haa" },
  { to: "/steuer/anlage-em", label: "Anlage Energetische Maßnahmen", formId: "anlage-em" },
  { to: "/steuer/anlage-mobility", label: "Anlage Mobilitätsprämie", formId: "anlage-mobility" },
];

// ---------- Main page --------------------------------------------------

export default function HauptvorduckESt1APage() {
  return (
    <MandantRequiredGuard>
      <HauptvorduckESt1APageInner />
    </MandantRequiredGuard>
  );
}

function HauptvorduckESt1APageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<HauptvordruckESt1A>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof HauptvordruckESt1A>(
    key: K,
    value: HauptvordruckESt1A[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Check which Anlagen have data — jetzt pro aktivem Mandant.
  const ausgefuellt = useMemo(() => {
    const set = new Set<string>();
    if (!selectedMandantId) return set;
    for (const link of ANLAGE_LINKS) {
      try {
        const v = localStorage.getItem(
          buildEstStorageKey(link.formId, selectedMandantId, selectedYear)
        );
        if (v && v !== "null" && v !== "{}") set.add(link.formId);
      } catch {
        /* ignore */
      }
    }
    return set;
  }, [selectedMandantId, selectedYear]);

  const isZus = form.veranlagungsart === 1;

  function validate(): string[] {
    const warns: string[] = [];
    if (form.a_idnr && !/^\d{11}$/.test(form.a_idnr)) {
      warns.push("Z. 8 (Person A): IdNr sollte 11-stellig sein.");
    }
    if (isZus && form.b_idnr && !/^\d{11}$/.test(form.b_idnr)) {
      warns.push("Z. 20 (Person B): IdNr sollte 11-stellig sein.");
    }
    if (
      form.iban_inland &&
      !/^DE\d{2}[\dA-Z]{18}$/.test(form.iban_inland.replace(/\s/g, ""))
    ) {
      warns.push(
        "Z. 30: Inl. IBAN sollte mit DE starten und 22 Zeichen lang sein."
      );
    }
    if (form.iban_ausland && form.iban_inland) {
      warns.push("Z. 30/31: Bitte nur eine IBAN eintragen (Inland ODER Ausland).");
    }
    if (
      form.iban_ausland &&
      form.bic_ausland &&
      !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(form.bic_ausland)
    ) {
      warns.push("Z. 32: BIC 8 oder 11 Zeichen (4 Bank + 2 Land + 2 Ort + opt. 3 Filiale).");
    }
    if (isZus && !form.b_name) {
      warns.push("Zusammenveranlagung: Name Person B fehlt.");
    }
    if (form.z18_verheiratet_seit && form.z18_geschieden_seit) {
      if (form.z18_verheiratet_seit > form.z18_geschieden_seit) {
        warns.push("Z. 18: Heiratsdatum liegt nach Scheidungsdatum.");
      }
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 9000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["est-1a"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "est-1a",
      summary: `Hauptvordruck ESt 1 A gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "est-1a",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        form,
      },
    });
    toast.success("Hauptvordruck ESt 1 A gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Hauptvordruck ESt 1 A</h1>
          <p>
            Einkommensteuererklärung · Deckblatt und Koordination aller
            Anlagen · VZ {selectedYear}.
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
          Hauptvordruck ESt 1 A · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="est-1a" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Master-Formular:</strong> Dieses Deckblatt koordiniert alle
          Anlagen. Die tatsächliche Steuerberechnung erfolgt im Finanzamt bzw.
          durch ELSTER aus den Anlagen-Daten — diese Seite erfasst nur
          Stammdaten, Veranlagungsart und Kontoverbindung.
        </div>
      </aside>

      <BmfForm
        title="Einkommensteuererklärung 2025 (ESt 1 A)"
        subtitle={`VZ ${selectedYear}${form.a_name ? " · " + form.a_name : ""}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection
          title="1. Art der Erklärung (Z. 1–3)"
          description="Welche Festsetzungen werden beantragt? Mehrfachauswahl möglich."
        >
          <CheckboxRow
            zeile="1"
            label="Einkommensteuererklärung"
            value={form.ist_einkommensteuer}
            onChange={(v) => set("ist_einkommensteuer", v)}
          />
          <CheckboxRow
            zeile="2"
            label="Festsetzung der Arbeitnehmer-Sparzulage"
            value={form.ist_sparzulage}
            onChange={(v) => set("ist_sparzulage", v)}
          />
          <CheckboxRow
            zeile="2"
            label="Erklärung zur Festsetzung der Kirchensteuer auf Kapitalerträge"
            value={form.ist_kist_kapital}
            onChange={(v) => set("ist_kist_kapital", v)}
          />
          <CheckboxRow
            zeile="2"
            label="Erklärung zur Feststellung des verbleibenden Verlustvortrags"
            value={form.ist_verlustvortrag}
            onChange={(v) => set("ist_verlustvortrag", v)}
          />
          <CheckboxRow
            zeile="3"
            label="Festsetzung der Mobilitätsprämie (→ Anlage Mobilitätsprämie)"
            value={form.ist_mobilitaetspraemie}
            onChange={(v) => set("ist_mobilitaetspraemie", v)}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection title="2. Allgemeine Angaben (Z. 4–7)">
          <TextRow
            zeile="4"
            label="Steuernummer"
            value={form.steuernummer}
            onChange={(v) => set("steuernummer", v)}
            placeholder="z. B. 12/345/67890"
          />
          <TextRow
            zeile="5"
            label="An das Finanzamt"
            value={form.finanzamt}
            onChange={(v) => set("finanzamt", v)}
            placeholder="z. B. FA Berlin-Mitte"
          />
          <TextRow
            zeile="6"
            label="Bei Wohnsitzwechsel: bisheriges Finanzamt"
            value={form.bisheriges_finanzamt}
            onChange={(v) => set("bisheriges_finanzamt", v)}
          />
          <TextRow
            zeile="7"
            label="Telefonische Rückfragen (tagsüber)"
            value={form.telefon}
            onChange={(v) => set("telefon", v)}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection title="3. Steuerpflichtige Person / Ehemann / Person A (Z. 8–18)">
          <TextRow
            zeile="8"
            label="Identifikationsnummer"
            value={form.a_idnr}
            onChange={(v) => set("a_idnr", v)}
            placeholder="11-stellig"
          />
          <DateRow
            zeile="8"
            label="Geburtsdatum"
            value={form.a_geburt}
            onChange={(v) => set("a_geburt", v)}
          />
          <DateRow
            zeile="8"
            label="Sterbedatum (falls 2025 verstorben)"
            value={form.a_sterbe}
            onChange={(v) => set("a_sterbe", v)}
          />
          <TextRow
            zeile="9"
            label="Name"
            value={form.a_name}
            onChange={(v) => set("a_name", v)}
          />
          <TextRow
            zeile="10"
            label="Vorname"
            value={form.a_vorname}
            onChange={(v) => set("a_vorname", v)}
          />
          <TextRow
            zeile="11"
            label="Titel, akademischer Grad"
            value={form.a_titel}
            onChange={(v) => set("a_titel", v)}
          />
          <TextRow
            zeile="12"
            label="Ausgeübter Beruf"
            value={form.a_beruf}
            onChange={(v) => set("a_beruf", v)}
          />
          <TextRow
            zeile="13"
            label="Straße"
            value={form.a_strasse}
            onChange={(v) => set("a_strasse", v)}
          />
          <TextRow
            zeile="14"
            label="Hausnummer · Zusatz · Adressergänzung"
            value={[form.a_hausnr, form.a_hausnr_zusatz, form.a_adresse_ergaenzung]
              .filter(Boolean)
              .join(" · ")}
            onChange={(v) => {
              const parts = v.split(" · ");
              set("a_hausnr", parts[0] ?? "");
              set("a_hausnr_zusatz", parts[1] ?? "");
              set("a_adresse_ergaenzung", parts[2] ?? "");
            }}
          />
          <TextRow
            zeile="15"
            label="PLZ (Inland · Ausland)"
            value={`${form.a_plz_inland}${form.a_plz_ausland ? " · " + form.a_plz_ausland : ""}`}
            onChange={(v) => {
              const parts = v.split(" · ");
              set("a_plz_inland", parts[0] ?? "");
              set("a_plz_ausland", parts[1] ?? "");
            }}
          />
          <TextRow
            zeile="16"
            label="Wohnort"
            value={form.a_wohnort}
            onChange={(v) => set("a_wohnort", v)}
          />
          <TextRow
            zeile="17"
            label="Staat (wenn Ausland)"
            value={form.a_staat}
            onChange={(v) => set("a_staat", v)}
          />

          <ReligionRow
            zeile="17"
            label={`Religion am 31.12.${selectedYear}`}
            value={form.a_religion}
            onChange={(v) => set("a_religion", v)}
          />
          <ReligionChangeRow
            zeile="17"
            label={`Änderung der Religion ${selectedYear}`}
            value={form.a_religion_change}
            onChange={(v) => set("a_religion_change", v)}
          />

          <DateRow
            zeile="18"
            label="Verheiratet / Lebenspartnerschaft seit dem"
            value={form.z18_verheiratet_seit}
            onChange={(v) => set("z18_verheiratet_seit", v)}
          />
          <DateRow
            zeile="18"
            label="Verwitwet seit dem"
            value={form.z18_verwitwet_seit}
            onChange={(v) => set("z18_verwitwet_seit", v)}
          />
          <DateRow
            zeile="18"
            label="Geschieden / LP aufgehoben seit dem"
            value={form.z18_geschieden_seit}
            onChange={(v) => set("z18_geschieden_seit", v)}
          />
          <DateRow
            zeile="18"
            label="Dauernd getrennt lebend (Tag der Trennung)"
            value={form.z18_getrennt_seit}
            onChange={(v) => set("z18_getrennt_seit", v)}
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection
          title="4. Veranlagungsart (Z. 19)"
          description="Nur bei Ehegatten/Lebenspartnern."
        >
          <WideRow kz="" zeile="19" label="Veranlagungsart" wide={280}>
            <select
              value={form.veranlagungsart}
              onChange={(e) =>
                set(
                  "veranlagungsart",
                  Number(e.target.value) as 0 | 1 | 2
                )
              }
              style={selectStyle}
            >
              <option value={0}>— (Einzelveranlagung Ledige)</option>
              <option value={1}>1 · Zusammenveranlagung</option>
              <option value={2}>2 · Einzelveranlagung Ehegatten/LP</option>
            </select>
          </WideRow>
          <CheckboxRow
            zeile="19"
            label="Wir haben Gütergemeinschaft vereinbart"
            value={form.guetergemeinschaft}
            onChange={(v) => set("guetergemeinschaft", v)}
          />
        </BmfSection>

        {/* ============ Section 5 (conditional) ============ */}
        {isZus && (
          <BmfSection
            title="5. Ehefrau / Lebenspartner:in / Person B (Z. 20–29)"
            description="Nur bei Zusammenveranlagung."
          >
            <TextRow
              zeile="20"
              label="Identifikationsnummer"
              value={form.b_idnr}
              onChange={(v) => set("b_idnr", v)}
              placeholder="11-stellig"
            />
            <DateRow
              zeile="20"
              label="Geburtsdatum"
              value={form.b_geburt}
              onChange={(v) => set("b_geburt", v)}
            />
            <DateRow
              zeile="20"
              label="Sterbedatum"
              value={form.b_sterbe}
              onChange={(v) => set("b_sterbe", v)}
            />
            <TextRow
              zeile="21"
              label="Name"
              value={form.b_name}
              onChange={(v) => set("b_name", v)}
            />
            <TextRow
              zeile="22"
              label="Vorname"
              value={form.b_vorname}
              onChange={(v) => set("b_vorname", v)}
            />
            <TextRow
              zeile="23"
              label="Titel, akademischer Grad"
              value={form.b_titel}
              onChange={(v) => set("b_titel", v)}
            />
            <TextRow
              zeile="24"
              label="Ausgeübter Beruf"
              value={form.b_beruf}
              onChange={(v) => set("b_beruf", v)}
            />

            <ReligionRow
              zeile="24"
              label="Religion Person B"
              value={form.b_religion}
              onChange={(v) => set("b_religion", v)}
            />
            <ReligionChangeRow
              zeile="24"
              label="Änderung Religion Person B"
              value={form.b_religion_change}
              onChange={(v) => set("b_religion_change", v)}
            />

            <CheckboxRow
              zeile="25"
              label="Abweichende Anschrift der Person B eintragen"
              value={form.b_abweichende_adresse}
              onChange={(v) => set("b_abweichende_adresse", v)}
            />
            {form.b_abweichende_adresse && (
              <>
                <TextRow
                  zeile="25"
                  label="Straße"
                  value={form.b_strasse}
                  onChange={(v) => set("b_strasse", v)}
                />
                <TextRow
                  zeile="26"
                  label="Hausnummer · Zusatz · Adressergänzung"
                  value={[form.b_hausnr, form.b_hausnr_zusatz, form.b_adresse_ergaenzung]
                    .filter(Boolean)
                    .join(" · ")}
                  onChange={(v) => {
                    const parts = v.split(" · ");
                    set("b_hausnr", parts[0] ?? "");
                    set("b_hausnr_zusatz", parts[1] ?? "");
                    set("b_adresse_ergaenzung", parts[2] ?? "");
                  }}
                />
                <TextRow
                  zeile="27"
                  label="PLZ (Inland · Ausland)"
                  value={`${form.b_plz_inland}${form.b_plz_ausland ? " · " + form.b_plz_ausland : ""}`}
                  onChange={(v) => {
                    const parts = v.split(" · ");
                    set("b_plz_inland", parts[0] ?? "");
                    set("b_plz_ausland", parts[1] ?? "");
                  }}
                />
                <TextRow
                  zeile="28"
                  label="Wohnort"
                  value={form.b_wohnort}
                  onChange={(v) => set("b_wohnort", v)}
                />
                <TextRow
                  zeile="29"
                  label="Staat"
                  value={form.b_staat}
                  onChange={(v) => set("b_staat", v)}
                />
              </>
            )}
          </BmfSection>
        )}

        {/* ============ Section 6 ============ */}
        <BmfSection
          title="6. Bankverbindung (Z. 30–33)"
          description="Rückerstattung von Steuern fließt auf das hier angegebene Konto."
        >
          <TextRow
            zeile="30"
            label="IBAN (inländisches Geldinstitut)"
            value={form.iban_inland}
            onChange={(v) => set("iban_inland", v)}
            placeholder="DE00 0000 0000 0000 0000 00"
          />
          <TextRow
            zeile="31"
            label="IBAN (ausländisches Geldinstitut)"
            value={form.iban_ausland}
            onChange={(v) => set("iban_ausland", v)}
          />
          <TextRow
            zeile="32"
            label="BIC (nur bei ausländischer IBAN)"
            value={form.bic_ausland}
            onChange={(v) => set("bic_ausland", v)}
          />
          <WideRow kz="" zeile="33" label="Kontoinhaber:in" wide={220}>
            <select
              value={form.kontoinhaber}
              onChange={(e) =>
                set("kontoinhaber", e.target.value as typeof form.kontoinhaber)
              }
              style={selectStyle}
            >
              <option value="">—</option>
              <option value="a">Person A (Steuerpflichtige:r)</option>
              <option value="b">Person B (Ehegatte/LP)</option>
              <option value="anderer">Andere Person (Abtretung)</option>
            </select>
          </WideRow>
          {form.kontoinhaber === "anderer" && (
            <TextRow
              zeile="33"
              label="Name des Abtretungs-Empfängers"
              value={form.kontoinhaber_name}
              onChange={(v) => set("kontoinhaber_name", v)}
            />
          )}
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection title="7. Arbeitnehmer-Sparzulage (Z. 34)">
          <JaNeinRow
            kz="17"
            zeile="34"
            label={isZus ? "Person A — Festsetzung Sparzulage beantragt" : "Festsetzung Sparzulage beantragt"}
            value={form.z34_sparzulage_a}
            onChange={(v) => set("z34_sparzulage_a", v)}
          />
          {isZus && (
            <JaNeinRow
              kz="18"
              zeile="34"
              label="Person B — Festsetzung Sparzulage beantragt"
              value={form.z34_sparzulage_b}
              onChange={(v) => set("z34_sparzulage_b", v)}
            />
          )}
        </BmfSection>

        {/* ============ Section 8 ============ */}
        <BmfSection
          title="8. Einkommensersatzleistungen mit Progressionsvorbehalt (Z. 35–36)"
          description="ALG I, Elterngeld, Insolvenz-/Kranken-/Mutterschaftsgeld, Verdienstausfall (InfSG). Erhöhen den Steuersatz auf die übrigen Einkünfte."
        >
          <BmfInputRow
            kz="120"
            label={isZus ? "Person A — Inländ. Einkommensersatzleistungen" : "Inländ. Einkommensersatzleistungen"}
            hint="Z. 35"
            value={form.z35_einkommensersatz_a}
            onChange={(v) => set("z35_einkommensersatz_a", v)}
          />
          {isZus && (
            <BmfInputRow
              kz="121"
              label="Person B — Inländ. Einkommensersatzleistungen"
              hint="Z. 35"
              value={form.z35_einkommensersatz_b}
              onChange={(v) => set("z35_einkommensersatz_b", v)}
            />
          )}
          <BmfInputRow
            kz="136"
            label={isZus ? "Person A — EU/EWR/CH Einkommensersatzleistungen" : "EU/EWR/CH Einkommensersatzleistungen"}
            hint="Z. 36"
            value={form.z36_eu_ersatz_a}
            onChange={(v) => set("z36_eu_ersatz_a", v)}
          />
          {isZus && (
            <BmfInputRow
              kz="137"
              label="Person B — EU/EWR/CH Einkommensersatzleistungen"
              hint="Z. 36"
              value={form.z36_eu_ersatz_b}
              onChange={(v) => set("z36_eu_ersatz_b", v)}
            />
          )}
        </BmfSection>

        {/* ============ Section 9 ============ */}
        <BmfSection title="9. Ergänzende Angaben (Z. 37)">
          <WideRow
            kz="500"
            zeile="37"
            label="In dieser Steuererklärung"
            wide={420}
          >
            <select
              value={form.z37_ergaenzende}
              onChange={(e) =>
                set(
                  "z37_ergaenzende",
                  Number(e.target.value) as 0 | 1 | 2 | 3 | 4
                )
              }
              style={selectStyle}
            >
              <option value={0}>—</option>
              <option value={1}>1 · Steuererhebliche Sachverhalte nicht erklärt</option>
              <option value={2}>2 · Bewusst abweichende Rechtsauffassung</option>
              <option value={3}>3 · Personelle vertiefte Prüfung gewünscht</option>
              <option value={4}>4 · Mehrere der vorgenannten Gründe</option>
            </select>
          </WideRow>
        </BmfSection>

        {/* ============ Section 10 ============ */}
        <BmfSection title="10. Unterschrift und Mitwirkung (Z. 38–40)">
          <JaNeinRow
            zeile="39"
            label="Steuererklärung mit Mitwirkung eines Steuerberaters / zur Hilfe in Steuersachen Befugten angefertigt"
            value={form.z39_mitwirkung}
            onChange={(v) => set("z39_mitwirkung", v)}
          />
          <TextRow
            zeile="40"
            label="Name / Kanzlei des Mitwirkenden"
            value={form.z40_mitwirkender}
            onChange={(v) => set("z40_mitwirkender", v)}
          />
        </BmfSection>

        <BmfSignatures
          left={`Unterschrift ${form.a_name || "Person A"}`}
          right={isZus ? `Unterschrift ${form.b_name || "Person B"}` : "—"}
        />

        <BmfFootnotes>
          <p>
            <strong>Formular-Übersicht:</strong> Dieses Deckblatt verweist auf
            spezialisierte Anlagen (s. u.). Die Markierung zeigt, welche
            Anlagen in dieser Installation bereits Daten enthalten.
          </p>
          <p>
            <strong>NICHT implementiert / NICHT berechnet:</strong> tatsächliche
            Steuerberechnung (zu versteuerndes Einkommen, Tarif, Soli, KiSt),
            Gesamtübersicht aller Einkünfte, Cross-Form-Konsistenzprüfung,
            elektronische Signatur. ELSTER übernimmt dies aus den
            Anlagen-Daten nach Übermittlung.
          </p>
          <p>
            <strong>Wichtige Hinweise:</strong> Daten für mit ★ markierte Zeilen
            liegen i. d. R. bereits beim Finanzamt vor (vorausgefüllte
            Steuererklärung). Belege nur einreichen, wenn explizit in den
            Vordrucken / Anleitungen gefordert — und dann nur Kopien.
          </p>
          <p>
            <strong>Religion:</strong> Codes EV/RK/VD + ggf. JD/IL/AL/FA/FB.
            Kirchensteuer wird nur bei EV/RK/JD und einigen weiteren
            erhoben. Änderung im Jahr: 1 = Austritt, 2 = Wechsel, 3 = Eintritt.
          </p>
          <p>
            <strong>Veranlagungsart:</strong> Zusammenveranlagung (Splittingtarif)
            günstiger bei unterschiedlichen Einkommen · Einzelveranlagung
            günstiger bei ähnlichen hohen Einkommen + außergew. Belastungen.
            Günstigerprüfung durch Finanzamt.
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Übermittlung
            erfolgt elektronisch über ELSTER.
          </p>
        </BmfFootnotes>
      </BmfForm>

      {/* Formular-Übersicht: Links zu allen Anlagen */}
      <section className="card taxcalc__section no-print" style={{ marginTop: 16 }}>
        <h2>Formular-Übersicht · Anlagen</h2>
        <p className="text-muted" style={{ margin: "4px 0 12px", fontSize: "0.88rem" }}>
          Verfügbare Anlagen in dieser Installation. ✓ = bereits Daten vorhanden
          (localStorage).
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 8,
          }}
        >
          {ANLAGE_LINKS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="btn btn-ghost"
              style={{
                justifyContent: "space-between",
                textAlign: "left",
                padding: "6px 10px",
                fontSize: "0.85rem",
              }}
            >
              <span>{a.label}</span>
              <span
                style={{
                  color: ausgefuellt.has(a.formId) ? "#1f7a4d" : "#8a8f99",
                  fontWeight: 700,
                }}
              >
                {ausgefuellt.has(a.formId) ? "✓" : "·"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------- Row helpers ------------------------------------------------

const textInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #dee2ea",
  font: "inherit",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
  textAlign: "right",
};

const selectStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #dee2ea",
  font: "inherit",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
};

function WideRow({
  kz,
  zeile,
  label,
  children,
  wide = 280,
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

function DateRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={180}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={textInputStyle}
      />
    </WideRow>
  );
}

function JaNeinRow({
  kz,
  zeile,
  label,
  value,
  onChange,
}: {
  kz?: string;
  zeile: string;
  label: string;
  value: JaNein;
  onChange: (v: JaNein) => void;
}) {
  return (
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={140}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as JaNein)}
        style={selectStyle}
      >
        <option value="">—</option>
        <option value="ja">1 · Ja</option>
        <option value="nein">2 · Nein</option>
      </select>
    </WideRow>
  );
}

function CheckboxRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={60}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </WideRow>
  );
}

function ReligionRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: Religion;
  onChange: (v: Religion) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={280}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Religion)}
        style={selectStyle}
      >
        {(Object.keys(RELIGION_LABEL) as Religion[]).map((k) => (
          <option key={k} value={k}>
            {RELIGION_LABEL[k]}
          </option>
        ))}
      </select>
    </WideRow>
  );
}

function ReligionChangeRow({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: ReligionChange;
  onChange: (v: ReligionChange) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={220}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as ReligionChange)}
        style={selectStyle}
      >
        <option value={0}>— keine Änderung —</option>
        <option value={1}>1 · Austritt</option>
        <option value={2}>2 · Wechsel</option>
        <option value={3}>3 · Eintritt</option>
      </select>
    </WideRow>
  );
}
