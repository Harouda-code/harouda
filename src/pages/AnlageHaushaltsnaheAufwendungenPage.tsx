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

type JaNein = "ja" | "nein" | "";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// § 35a EStG — Deckel je Kategorie (Jahresbetrag)
const DECKEL_MINIJOB = 510; // Z. 4 · Kz 202
const DECKEL_DIENSTLEISTUNG = 4000; // Z. 5 · Kz 212
const DECKEL_HANDWERKER = 1200; // Z. 9 · Kz 214
const SATZ = 0.2; // 20 %

// ---------- State ------------------------------------------------------

type HandwerkerEintrag = {
  art: string;
  rechnungsbetrag: number;
  lohnanteil: number;
};

const EMPTY_HANDWERKER: HandwerkerEintrag = {
  art: "",
  rechnungsbetrag: 0,
  lohnanteil: 0,
};

type AnlageHAA = {
  // Section 1
  z4_art: string;
  z4_aufwand: number;

  // Section 2
  z5_art: string;
  z5_aufwand: number;

  // Section 3 · 3 Einträge (Z. 6/7/8) + Summe Z. 9
  z6: HandwerkerEintrag;
  z7: HandwerkerEintrag;
  z8: HandwerkerEintrag;

  // Section 4 · Alleinstehend
  alleinstehend: boolean;
  z10_anzahl: number;
  z11_person: string;
  z12_anteil_minijob: number;
  z13_anteil_dienst: number;
  z14_anteil_handwerker: number;

  // Section 5 · Ehegatten Begründung/Auflösung
  zusammenveranlagung: boolean;
  z15_a: JaNein;
  z15_b: JaNein;
};

const DEFAULT: AnlageHAA = {
  z4_art: "",
  z4_aufwand: 0,
  z5_art: "",
  z5_aufwand: 0,
  z6: EMPTY_HANDWERKER,
  z7: EMPTY_HANDWERKER,
  z8: EMPTY_HANDWERKER,
  alleinstehend: false,
  z10_anzahl: 0,
  z11_person: "",
  z12_anteil_minijob: 100,
  z13_anteil_dienst: 100,
  z14_anteil_handwerker: 100,
  zusammenveranlagung: false,
  z15_a: "",
  z15_b: "",
};

const FORM_ID = "anlage-haa";

function loadForm(mandantId: string | null, jahr: number): AnlageHAA {
  const parsed = readEstForm<Partial<AnlageHAA>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    z6: { ...EMPTY_HANDWERKER, ...(parsed.z6 ?? {}) },
    z7: { ...EMPTY_HANDWERKER, ...(parsed.z7 ?? {}) },
    z8: { ...EMPTY_HANDWERKER, ...(parsed.z8 ?? {}) },
  };
}

// ---------- Main page --------------------------------------------------

export default function AnlageHaushaltsnaheAufwendungenPage() {
  return (
    <MandantRequiredGuard>
      <AnlageHaushaltsnaheAufwendungenPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageHaushaltsnaheAufwendungenPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageHAA>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageHAA>(key: K, value: AnlageHAA[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateHandwerker(
    which: "z6" | "z7" | "z8",
    updater: (h: HandwerkerEintrag) => HandwerkerEintrag
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  // Z. 9 Kz 214 auto-sum der Lohnanteile
  const z9Summe = useMemo(
    () => form.z6.lohnanteil + form.z7.lohnanteil + form.z8.lohnanteil,
    [form.z6.lohnanteil, form.z7.lohnanteil, form.z8.lohnanteil]
  );

  // § 35a Steuerermäßigungen (Jahresbeträge)
  const ermaessigung = useMemo(() => {
    const minijob_raw = form.z4_aufwand * SATZ;
    const dienst_raw = form.z5_aufwand * SATZ;
    const handwerker_raw = z9Summe * SATZ;

    const teilerMini = form.alleinstehend ? form.z12_anteil_minijob / 100 : 1;
    const teilerDienst = form.alleinstehend ? form.z13_anteil_dienst / 100 : 1;
    const teilerHandw = form.alleinstehend
      ? form.z14_anteil_handwerker / 100
      : 1;

    const minijob = Math.min(minijob_raw, DECKEL_MINIJOB * teilerMini);
    const dienst = Math.min(dienst_raw, DECKEL_DIENSTLEISTUNG * teilerDienst);
    const handwerker = Math.min(handwerker_raw, DECKEL_HANDWERKER * teilerHandw);

    return {
      minijob_raw: round2(minijob_raw),
      dienst_raw: round2(dienst_raw),
      handwerker_raw: round2(handwerker_raw),
      minijob: round2(minijob),
      dienst: round2(dienst),
      handwerker: round2(handwerker),
      gesamt: round2(minijob + dienst + handwerker),
    };
  }, [
    form.z4_aufwand,
    form.z5_aufwand,
    z9Summe,
    form.alleinstehend,
    form.z12_anteil_minijob,
    form.z13_anteil_dienst,
    form.z14_anteil_handwerker,
  ]);

  function validate(): string[] {
    const warns: string[] = [];
    const hwCheck = (e: HandwerkerEintrag, label: string) => {
      if (e.lohnanteil > e.rechnungsbetrag) {
        warns.push(
          `${label}: Lohnanteil (${euro.format(e.lohnanteil)}) > Rechnungsbetrag (${euro.format(e.rechnungsbetrag)}).`
        );
      }
    };
    hwCheck(form.z6, "Z. 6");
    hwCheck(form.z7, "Z. 7");
    hwCheck(form.z8, "Z. 8");
    if (
      form.alleinstehend &&
      (form.z12_anteil_minijob > 100 ||
        form.z13_anteil_dienst > 100 ||
        form.z14_anteil_handwerker > 100)
    ) {
      warns.push("Z. 12–14: Anteil > 100 % unplausibel.");
    }
    if (form.alleinstehend && form.z10_anzahl < 1) {
      warns.push(
        "Z. 10: bei Alleinstehenden mit weiteren Personen im Haushalt: Anzahl > 0 erforderlich."
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 8000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-haa"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-haa",
      summary: `Anlage Haushaltsnahe Aufwendungen gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-haa",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        z9Summe,
        ermaessigung,
        form,
      },
    });
    toast.success("Anlage Haushaltsnahe Aufwendungen gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage Haushaltsnahe Aufwendungen</h1>
          <p>
            Steuerermäßigung § 35a EStG für haushaltsnahe Beschäftigungen,
            Dienstleistungen und Handwerkerleistungen · VZ {selectedYear}.
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
          Anlage HAA · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-haa" />

      <section className="card taxcalc__section no-print">
        <h2>Optionen</h2>
        <div className="form-grid">
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.alleinstehend}
              onChange={(e) => set("alleinstehend", e.target.checked)}
            />
            <span>Alleinstehend / Einzelveranlagung (Z. 10–14 einblenden)</span>
          </label>
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.zusammenveranlagung}
              onChange={(e) => set("zusammenveranlagung", e.target.checked)}
            />
            <span>Zusammenveranlagung (Z. 15 einblenden)</span>
          </label>
        </div>
      </section>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>§ 35a EStG — 20 %-Steuerermäßigung mit Deckel:</strong>
          <br />
          Minijob (Z. 4): max. {euro.format(DECKEL_MINIJOB)} · sv-pfl./
          Dienstleistung (Z. 5): max. {euro.format(DECKEL_DIENSTLEISTUNG)} ·
          Handwerker (Z. 9): max. {euro.format(DECKEL_HANDWERKER)}.
          <br />
          Voraussetzung: <strong>Rechnung + unbare Zahlung</strong> (§ 35a
          Abs. 5 Satz 3 EStG). Nicht kombinierbar mit KfW/BAFA-Förderung oder
          § 35c-Ermäßigung für dieselben Aufwendungen.
        </div>
      </aside>

      <BmfForm
        title="Anlage Haushaltsnahe Aufwendungen"
        subtitle={`§ 35a EStG · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection
          title="1. Geringfügige Beschäftigung (Minijob) im Privathaushalt (Z. 4)"
          description="20 % der Aufwendungen (abzgl. Erstattungen), Deckel 510 €/Jahr."
        >
          <TextRow
            kz="202"
            zeile="4"
            label="Art der Tätigkeit"
            value={form.z4_art}
            onChange={(v) => set("z4_art", v)}
            placeholder="z. B. Haushaltshilfe, Gartenpflege"
          />
          <BmfInputRow
            kz=""
            label="Aufwendungen (abzgl. Erstattungen)"
            hint="Z. 4"
            value={form.z4_aufwand}
            onChange={(v) => set("z4_aufwand", v)}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Sv-pfl. Beschäftigung / Haushaltsnahe Dienstleistungen / Pflege (Z. 5)"
          description="20 % der Aufwendungen (abzgl. Erstattungen), Deckel 4.000 €/Jahr. Umfasst Pflege-/Betreuungsleistungen, Heimdienstleistungen vergleichbar Haushaltshilfe, Pflegegeld § 37 SGB XI."
        >
          <TextRow
            kz="212"
            zeile="5"
            label="Art der Tätigkeit / Aufwendungen"
            value={form.z5_art}
            onChange={(v) => set("z5_art", v)}
          />
          <BmfInputRow
            kz=""
            label="Aufwendungen (abzgl. Erstattungen)"
            hint="Z. 5"
            value={form.z5_aufwand}
            onChange={(v) => set("z5_aufwand", v)}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection
          title="3. Handwerkerleistungen (Z. 6–9)"
          description="Nur Lohn-, Maschinen- und Fahrtkosten absetzbar (keine Materialkosten). 20 %, Deckel 1.200 €/Jahr. Ausschluss: KfW/BAFA/öffentl. Förderung oder § 35c EStG."
          total={z9Summe}
        >
          <HandwerkerRow
            zeile="6"
            entry={form.z6}
            onChange={(u) => updateHandwerker("z6", u)}
          />
          <HandwerkerRow
            zeile="7"
            entry={form.z7}
            onChange={(u) => updateHandwerker("z7", u)}
          />
          <HandwerkerRow
            zeile="8"
            entry={form.z8}
            onChange={(u) => updateHandwerker("z8", u)}
          />
          <BmfRow
            kz="214"
            label="Z. 9 · Summe Lohn-/Maschinen-/Fahrtkosten (auto = Z. 6+7+8 Lohnanteil)"
            value={z9Summe}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        {form.alleinstehend && (
          <BmfSection
            title="4. Alleinstehende / Einzelveranlagung (Z. 10–14)"
            description="Nur bei gemeinsamem Haushalt mit weiteren alleinstehenden Personen ODER Einzelveranlagung bei Ehegatten/LP. Höchstbetrag wird nach Antrag aufgeteilt."
          >
            <BmfInputRow
              kz="223"
              label="Anzahl weiterer Personen im Haushalt"
              hint="Z. 10"
              value={form.z10_anzahl}
              onChange={(v) => set("z10_anzahl", v)}
              step={1}
            />
            <TextRow
              kz=""
              zeile="11"
              label="Name, Vorname, Geburtsdatum der weiteren Person(en)"
              value={form.z11_person}
              onChange={(v) => set("z11_person", v)}
              placeholder="Nachname, Vorname, TT.MM.JJJJ"
            />
            <PercentRow
              kz="224"
              zeile="12"
              label="Anteil am Höchstbetrag Z. 4 / Anlage aGB Z. 39 (%)"
              value={form.z12_anteil_minijob}
              onChange={(v) => set("z12_anteil_minijob", v)}
            />
            <PercentRow
              kz="225"
              zeile="13"
              label="Anteil am Höchstbetrag Z. 5 / Anlage aGB Z. 40 (%)"
              value={form.z13_anteil_dienst}
              onChange={(v) => set("z13_anteil_dienst", v)}
            />
            <PercentRow
              kz="226"
              zeile="14"
              label="Anteil am Höchstbetrag Z. 9 / Anlage aGB Z. 41 (%)"
              value={form.z14_anteil_handwerker}
              onChange={(v) => set("z14_anteil_handwerker", v)}
            />
          </BmfSection>
        )}

        {/* ============ Section 5 ============ */}
        {form.zusammenveranlagung && (
          <BmfSection
            title="5. Ehegatten / Lebenspartner (Z. 15)"
            description="Nur wenn 2025 ein gemeinsamer Haushalt begründet oder aufgelöst wurde UND ein Teil des Jahres im Einzelhaushalt gelebt wurde."
          >
            <JaNeinRow
              kz="219"
              zeile="15"
              label="Person A: gemeinsamer Haushalt in 2025 begründet / aufgelöst · Teiljahr Einzelhaushalt"
              value={form.z15_a}
              onChange={(v) => set("z15_a", v)}
            />
            <JaNeinRow
              kz="220"
              zeile="15"
              label="Person B: gemeinsamer Haushalt in 2025 begründet / aufgelöst · Teiljahr Einzelhaushalt"
              value={form.z15_b}
              onChange={(v) => set("z15_b", v)}
            />
          </BmfSection>
        )}

        {/* Info-Ergebnisse */}
        <BmfRow
          kz=""
          label={`Info · Minijob-Ermäßigung: ${euro.format(ermaessigung.minijob_raw)} → gedeckelt ${euro.format(ermaessigung.minijob)}`}
          value={ermaessigung.minijob}
          subtotal
        />
        <BmfRow
          kz=""
          label={`Info · Dienstleistungs-Ermäßigung: ${euro.format(ermaessigung.dienst_raw)} → gedeckelt ${euro.format(ermaessigung.dienst)}`}
          value={ermaessigung.dienst}
          subtotal
        />
        <BmfRow
          kz=""
          label={`Info · Handwerker-Ermäßigung: ${euro.format(ermaessigung.handwerker_raw)} → gedeckelt ${euro.format(ermaessigung.handwerker)}`}
          value={ermaessigung.handwerker}
          subtotal
        />

        <BmfResult
          label="Steuerermäßigung § 35a gesamt (Info)"
          value={ermaessigung.gesamt}
          variant={ermaessigung.gesamt > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift(en)" />

        <BmfFootnotes>
          <p>
            <strong>§ 35a EStG Berechnung:</strong> 20 % der begünstigten
            Aufwendungen, jeweils gedeckelt — Minijob 510 € ·
            Dienstleistung/Pflege 4.000 € · Handwerker 1.200 € (nur Lohn-,
            Maschinen-, Fahrtkosten; keine Materialien).
          </p>
          <p>
            <strong>Voraussetzungen § 35a Abs. 5 Satz 3:</strong> Rechnung
            erforderlich · Zahlung unbar auf das Konto des Leistungserbringers
            (keine Barzahlung). Pflegeleistungen auch ohne Rechnung, wenn sie
            im eigenen Haushalt erbracht werden.
          </p>
          <p>
            <strong>Ausschlüsse:</strong> Für dieselben Aufwendungen dürfen
            NICHT gleichzeitig KfW-/BAFA-Zuschüsse, zinsverbilligte Darlehen
            oder die Steuerermäßigung § 35c EStG in Anspruch genommen werden.
            Material- und Warenkosten sind bei Handwerkerleistungen NICHT
            begünstigt.
          </p>
          <p>
            <strong>Aufteilung bei Alleinstehenden:</strong> Wenn mehrere
            alleinstehende Personen einen Haushalt teilen, wird der Höchstbetrag
            i. d. R. hälftig aufgeteilt. Abweichende Aufteilung per gemeinsamen
            Antrag (Z. 12–14).
          </p>
          <p>
            <strong>Querbezüge zur Anlage Außergewöhnliche Belastungen</strong>{" "}
            (aGB) Z. 39–41: Aufwendungen können dort alternativ als Pflege-/
            Behinderungskosten angesetzt werden — Günstigerprüfung erfolgt
            durch das Finanzamt.
          </p>
          <p>
            <strong>NICHT automatisch:</strong> Günstigerprüfung § 35a vs.
            aGB-Abzug · zeitliche Zuordnung bei Haushaltsbegründung/-auflösung
            · Nachweisprüfung unbare Zahlung.
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> Minijob 202 · Dienstleistung 212 ·
            Handwerker-Summe 214 · Alleinstehend 223 (Anzahl) /
            224/225/226 (Anteile %) · Ehegatten 219/220.
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------- Handwerker row ---------------------------------------------

function HandwerkerRow({
  zeile,
  entry,
  onChange,
}: {
  zeile: string;
  entry: HandwerkerEintrag;
  onChange: (updater: (h: HandwerkerEintrag) => HandwerkerEintrag) => void;
}) {
  const setF = <K extends keyof HandwerkerEintrag>(
    k: K,
    v: HandwerkerEintrag[K]
  ) => onChange((h) => ({ ...h, [k]: v }));
  return (
    <>
      <TextRow
        kz=""
        zeile={zeile}
        label="Art der Aufwendungen"
        value={entry.art}
        onChange={(v) => setF("art", v)}
        placeholder="z. B. Heizungsreparatur, Malerarbeiten"
      />
      <BmfInputRow
        kz=""
        label="Rechnungsbetrag (ggf. anteilig)"
        hint={`Z. ${zeile}`}
        value={entry.rechnungsbetrag}
        onChange={(v) => setF("rechnungsbetrag", v)}
      />
      <BmfInputRow
        kz=""
        label="davon Lohn- / Maschinen- / Fahrtkosten inkl. USt"
        hint={`Z. ${zeile} · geht in Z. 9 ein`}
        value={entry.lohnanteil}
        onChange={(v) => setF("lohnanteil", v)}
      />
    </>
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
  kz,
  zeile,
  label,
  value,
  onChange,
  placeholder,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <WideRow kz={kz} zeile={zeile} label={label} wide={280}>
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
  kz,
  zeile,
  label,
  value,
  onChange,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: JaNein;
  onChange: (v: JaNein) => void;
}) {
  return (
    <WideRow kz={kz} zeile={zeile} label={label} wide={140}>
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

function PercentRow({
  kz,
  zeile,
  label,
  value,
  onChange,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <WideRow kz={kz} zeile={zeile} label={label} wide={140}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
        <input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={monoInputStyle}
          placeholder="0,00"
        />
        <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>%</span>
      </div>
    </WideRow>
  );
}
