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
  BmfResult,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// Realsplitting-Höchstbetrag § 10 Abs. 1a Nr. 1 EStG
const REALSPLITTING_HOECHST = 13805;

type AnlageU = {
  // Abschnitt A — Antragsteller
  a_name: string;
  a_idnr: string;
  a_geburtsdatum: string;
  a_anschrift: string;
  a_finanzamt: string;
  a_steuernummer: string;

  // Z. 1 — erbrachte Unterhaltsleistungen
  z1_geld: number;
  z1_sach: number;
  // Z. 2 — davon für Kinder (nicht Realsplitting-fähig)
  z2_kinder_geld: number;
  z2_kinder_sach: number;
  // Z. 3 — auto-computed
  // Z. 4 — als Sonderausgaben geltend gemacht
  z4_abzug: number;
  // Z. 5-6 — KV/PV-Beiträge
  z5_kv_pv: number;
  z6_kv_mit_krankengeld: number;
  // Z. 7 — Ausgleichsleistungen (Versorgungsausgleich § 1408 BGB)
  z7_ausgleich: number;

  a_datum: string;

  // Abschnitt B — Empfänger
  b_name: string;
  b_finanzamt_stnr_idnr: string;

  // Zustimmung Unterhalt
  unterhalt_zustimmung: boolean;
  unterhalt_begrenzt: boolean;
  unterhalt_teilbetrag: number;
  // Zustimmung Ausgleichsleistungen
  ausgleich_zustimmung: boolean;
  ausgleich_begrenzt: boolean;
  ausgleich_teilbetrag: number;

  // EU/EWR/Schweiz
  eu_empfaenger: boolean;
  eu_besteuert_bestaetigt: boolean;
  eu_bescheinigung_beigefuegt: boolean;

  b_datum: string;
  b_zustimmung_bereits_vorhanden: boolean;
  b_zustimmung_bereits_datum: string;
};

const DEFAULT: AnlageU = {
  a_name: "",
  a_idnr: "",
  a_geburtsdatum: "",
  a_anschrift: "",
  a_finanzamt: "",
  a_steuernummer: "",
  z1_geld: 0,
  z1_sach: 0,
  z2_kinder_geld: 0,
  z2_kinder_sach: 0,
  z4_abzug: 0,
  z5_kv_pv: 0,
  z6_kv_mit_krankengeld: 0,
  z7_ausgleich: 0,
  a_datum: "",
  b_name: "",
  b_finanzamt_stnr_idnr: "",
  unterhalt_zustimmung: false,
  unterhalt_begrenzt: false,
  unterhalt_teilbetrag: 0,
  ausgleich_zustimmung: false,
  ausgleich_begrenzt: false,
  ausgleich_teilbetrag: 0,
  eu_empfaenger: false,
  eu_besteuert_bestaetigt: false,
  eu_bescheinigung_beigefuegt: false,
  b_datum: "",
  b_zustimmung_bereits_vorhanden: false,
  b_zustimmung_bereits_datum: "",
};

const FORM_ID = "anlage-u";

function loadForm(mandantId: string | null, jahr: number): AnlageU {
  const parsed = readEstForm<Partial<AnlageU>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

export default function AnlageUPage() {
  return (
    <MandantRequiredGuard>
      <AnlageUPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageUPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageU>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageU>(key: K, value: AnlageU[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const z3 = useMemo(() => {
    const geld = Math.max(0, form.z1_geld - form.z2_kinder_geld);
    const sach = Math.max(0, form.z1_sach - form.z2_kinder_sach);
    return { geld, sach, summe: geld + sach };
  }, [form.z1_geld, form.z1_sach, form.z2_kinder_geld, form.z2_kinder_sach]);

  const hoechstbetrag = REALSPLITTING_HOECHST + form.z5_kv_pv;
  const abzugMoeglich = Math.min(
    form.z4_abzug,
    Math.min(z3.summe, hoechstbetrag)
  );

  function validate(): string[] {
    const warns: string[] = [];
    if (form.z4_abzug > z3.summe) {
      warns.push(
        `Z. 4 (${euro.format(form.z4_abzug)}) überschreitet Z. 3 (${euro.format(z3.summe)}) — Abzug auf Z. 3 begrenzt.`
      );
    }
    if (form.z6_kv_mit_krankengeld > form.z5_kv_pv) {
      warns.push(
        "Z. 6 (KV mit Krankengeld) darf Z. 5 (Basis-KV/PV) nicht überschreiten."
      );
    }
    if (form.z4_abzug > hoechstbetrag) {
      warns.push(
        `Abzug überschreitet Realsplitting-Höchstbetrag ${euro.format(REALSPLITTING_HOECHST)}${form.z5_kv_pv > 0 ? ` + Basis-KV/PV ${euro.format(form.z5_kv_pv)}` : ""}.`
      );
    }
    if (form.unterhalt_begrenzt && form.unterhalt_teilbetrag <= 0) {
      warns.push(
        "Begrenzte Zustimmung Unterhalt: Teilbetrag > 0 erforderlich."
      );
    }
    if (form.ausgleich_begrenzt && form.ausgleich_teilbetrag <= 0) {
      warns.push(
        "Begrenzte Zustimmung Ausgleichsleistungen: Teilbetrag > 0 erforderlich."
      );
    }
    if (
      form.eu_empfaenger &&
      form.eu_besteuert_bestaetigt &&
      !form.eu_bescheinigung_beigefuegt
    ) {
      warns.push(
        "EU/EWR: Besteuerung bestätigt — Bescheinigung der ausl. Finanzbehörde beifügen."
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) {
      toast.warning(warns.join(" · "), { duration: 7000 });
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-u"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-u",
      summary: `Anlage U gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-u",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        z3,
        hoechstbetrag,
        abzugMoeglich,
        form,
      },
    });
    toast.success("Anlage U gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage U</h1>
          <p>
            Realsplitting · Antrag auf Abzug von Unterhaltsleistungen und
            Ausgleichsleistungen als Sonderausgaben (§ 10 Abs. 1a EStG) · VZ{" "}
            {selectedYear}.
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
          Anlage U · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-u" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Realsplitting-Höchstbetrag:</strong>{" "}
          {euro.format(REALSPLITTING_HOECHST)} + zusätzlich vom Antragsteller
          übernommene Basis-KV/PV-Beiträge (Z. 5). Die Zustimmung des
          Empfängers ist bindend; die Leistung ist beim Empfänger als
          sonstige Einkünfte (§ 22 Nr. 1a EStG) zu versteuern —
          Werbungskostenpauschale 102 €.
        </div>
      </aside>

      <BmfForm
        title="Anlage U"
        subtitle={`Antrag Realsplitting · VZ ${selectedYear}`}
      >
        {/* ============ ABSCHNITT A ============ */}
        <BmfSection
          title="Abschnitt A · Antragsteller — Identität"
          description="Die Person, die den Unterhalt / die Ausgleichsleistungen gezahlt hat und als Sonderausgaben abziehen möchte."
        >
          <TextRow
            label="Name, Vorname"
            value={form.a_name}
            onChange={(v) => set("a_name", v)}
            placeholder="Nachname, Vorname"
          />
          <TextRow
            label="Identifikationsnummer"
            value={form.a_idnr}
            onChange={(v) => set("a_idnr", v)}
            placeholder="11-stellig"
          />
          <DateRow
            label="Geburtsdatum"
            value={form.a_geburtsdatum}
            onChange={(v) => set("a_geburtsdatum", v)}
          />
          <TextRow
            label="Anschrift"
            value={form.a_anschrift}
            onChange={(v) => set("a_anschrift", v)}
            placeholder="Straße, PLZ, Ort"
          />
          <TextRow
            label="Finanzamt"
            value={form.a_finanzamt}
            onChange={(v) => set("a_finanzamt", v)}
            placeholder="Wohnsitz-FA des Antragstellers"
          />
          <TextRow
            label="Steuernummer"
            value={form.a_steuernummer}
            onChange={(v) => set("a_steuernummer", v)}
            placeholder="12/345/67890"
          />
        </BmfSection>

        <BmfSection
          title="Abschnitt A · Unterhaltsleistungen und Ausgleichsleistungen (Z. 1–7)"
          total={abzugMoeglich}
        >
          <BmfInputRow
            kz=""
            label="Geldleistungen"
            hint="Z. 1 · tatsächlich erbrachte Unterhaltsleistungen"
            value={form.z1_geld}
            onChange={(v) => set("z1_geld", v)}
          />
          <BmfInputRow
            kz=""
            label="Sachleistungen"
            hint="Z. 1 · bewertete Sachbezüge (Wohnung, Strom etc.)"
            value={form.z1_sach}
            onChange={(v) => set("z1_sach", v)}
          />
          <BmfInputRow
            kz=""
            label="davon Geldleistungen für Kinder"
            hint="Z. 2 · werden abgezogen (keine Realsplitting-fähig)"
            value={form.z2_kinder_geld}
            onChange={(v) => set("z2_kinder_geld", v)}
          />
          <BmfInputRow
            kz=""
            label="davon Sachleistungen für Kinder"
            hint="Z. 2"
            value={form.z2_kinder_sach}
            onChange={(v) => set("z2_kinder_sach", v)}
          />
          <BmfRow
            kz=""
            label="Summe Z. 3 = (Z. 1 − Z. 2) · Geld + Sach (auto)"
            value={z3.summe}
            subtotal
          />
          <BmfInputRow
            kz=""
            label="Davon zum Abzug als Sonderausgaben geltend gemacht"
            hint="Z. 4 · max. Z. 3"
            value={form.z4_abzug}
            onChange={(v) => set("z4_abzug", v)}
          />
          <BmfInputRow
            kz=""
            label="In den Geldleistungen enthaltene Basis-KV und gesetzl. PV"
            hint="Z. 5 · erhöht den Höchstbetrag um diesen Wert"
            value={form.z5_kv_pv}
            onChange={(v) => set("z5_kv_pv", v)}
          />
          <BmfInputRow
            kz=""
            label="davon KV-Beiträge mit Anspruch auf Krankengeld"
            hint="Z. 6 · Teilmenge von Z. 5"
            value={form.z6_kv_mit_krankengeld}
            onChange={(v) => set("z6_kv_mit_krankengeld", v)}
          />
          <BmfInputRow
            kz=""
            label="Ausgleichsleistungen zur Vermeidung des Versorgungsausgleichs"
            hint="Z. 7 · § 1408 BGB / § 10 Abs. 1a Nr. 3 EStG"
            value={form.z7_ausgleich}
            onChange={(v) => set("z7_ausgleich", v)}
          />
          <BmfRow
            kz=""
            label={`Höchstbetrag (${euro.format(REALSPLITTING_HOECHST)} + Z. 5)`}
            value={hoechstbetrag}
            subtotal
          />
          <BmfRow
            kz=""
            label="Möglicher Abzug (min(Z. 4, Z. 3, Höchstbetrag) · Info)"
            value={abzugMoeglich}
            subtotal
          />
        </BmfSection>

        <BmfSection
          title="Abschnitt A · Erklärung und Unterschrift"
          description="Der Antrag ist für das Veranlagungsjahr bindend, sobald er gestellt ist (§ 10 Abs. 1a Satz 2 EStG)."
        >
          <DateRow
            label="Datum der Antragstellung"
            value={form.a_datum}
            onChange={(v) => set("a_datum", v)}
          />
        </BmfSection>

        <BmfResult
          label="Sonderausgabenabzug Realsplitting · möglicher Betrag"
          value={abzugMoeglich}
          variant={abzugMoeglich > 0 ? "gewinn" : "primary"}
        />

        {/* ============ ABSCHNITT B ============ */}
        <BmfSection
          title="Abschnitt B · Empfänger der Leistung(en) — Identität"
          description="Die Person, die Unterhalt / Ausgleichsleistungen empfangen hat und der Versteuerung als sonstige Einkünfte zustimmt."
        >
          <TextRow
            label="Name, Vorname"
            value={form.b_name}
            onChange={(v) => set("b_name", v)}
            placeholder="Nachname, Vorname"
          />
          <TextRow
            label="Zuständiges Finanzamt · Steuernummer · IdNr"
            value={form.b_finanzamt_stnr_idnr}
            onChange={(v) => set("b_finanzamt_stnr_idnr", v)}
            placeholder="FA Berlin-Mitte · 12/345/67890 · 12345678901"
          />
        </BmfSection>

        <BmfSection
          title="Abschnitt B · Zustimmung zum Antrag"
          description="Die Zustimmung ist grundsätzlich unwiderruflich für das laufende Veranlagungsjahr."
        >
          <CheckboxRow
            label="Ich stimme dem Abzug der Unterhaltsleistungen als Sonderausgaben zu — dem Grunde nach"
            value={form.unterhalt_zustimmung}
            onChange={(v) => set("unterhalt_zustimmung", v)}
          />
          <CheckboxRow
            label="… nur begrenzt auf einen Teilbetrag"
            value={form.unterhalt_begrenzt}
            onChange={(v) => set("unterhalt_begrenzt", v)}
          />
          {form.unterhalt_begrenzt && (
            <BmfInputRow
              kz=""
              label="Teilbetrag Unterhaltsleistungen"
              value={form.unterhalt_teilbetrag}
              onChange={(v) => set("unterhalt_teilbetrag", v)}
            />
          )}

          <CheckboxRow
            label="Ich stimme dem Abzug der Ausgleichsleistungen als Sonderausgaben zu — dem Grunde nach"
            value={form.ausgleich_zustimmung}
            onChange={(v) => set("ausgleich_zustimmung", v)}
          />
          <CheckboxRow
            label="… nur begrenzt auf einen Teilbetrag"
            value={form.ausgleich_begrenzt}
            onChange={(v) => set("ausgleich_begrenzt", v)}
          />
          {form.ausgleich_begrenzt && (
            <BmfInputRow
              kz=""
              label="Teilbetrag Ausgleichsleistungen"
              value={form.ausgleich_teilbetrag}
              onChange={(v) => set("ausgleich_teilbetrag", v)}
            />
          )}
        </BmfSection>

        <BmfSection
          title="Abschnitt B · EU / EWR / Schweiz (nur wenn Empfänger im Ausland)"
          description="Bei Empfängern mit Wohnsitz in EU/EWR/Schweiz ist der Abzug nur zulässig, wenn die Besteuerung im Ansässigkeitsstaat nachgewiesen wird (§ 10 Abs. 1a Nr. 1 Satz 5 EStG)."
        >
          <CheckboxRow
            label="Empfänger lebt in EU/EWR/Schweiz"
            value={form.eu_empfaenger}
            onChange={(v) => set("eu_empfaenger", v)}
          />
          {form.eu_empfaenger && (
            <>
              <CheckboxRow
                label="Ich bestätige, dass die empfangenen Leistungen in dem Staat besteuert werden"
                value={form.eu_besteuert_bestaetigt}
                onChange={(v) => set("eu_besteuert_bestaetigt", v)}
              />
              <CheckboxRow
                label="Bescheinigung der ausländischen Steuerbehörde liegt bei"
                value={form.eu_bescheinigung_beigefuegt}
                onChange={(v) => set("eu_bescheinigung_beigefuegt", v)}
              />
            </>
          )}
        </BmfSection>

        <BmfSection
          title="Abschnitt B · Hinweis zur Besteuerung beim Empfänger"
          description={`Der Empfänger versteuert die erhaltenen Leistungen als sonstige Einkünfte nach § 22 Nr. 1a EStG — bis zum Höchstbetrag ${euro.format(REALSPLITTING_HOECHST)} (+ Basis-KV/PV), Werbungskostenpauschale 102 €.`}
        >
          <div className="bmf-form__row">
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div
              className="bmf-form__label"
              style={{ fontStyle: "italic", color: "var(--ink-soft)" }}
            >
              Empfänger erklärt die Kenntnisnahme dieser Besteuerungsfolge.
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
        </BmfSection>

        <BmfSection title="Abschnitt B · Unterschrift">
          <CheckboxRow
            label="Die Zustimmung liegt dem Finanzamt bereits vor (aus Vorjahr)"
            value={form.b_zustimmung_bereits_vorhanden}
            onChange={(v) => set("b_zustimmung_bereits_vorhanden", v)}
          />
          {form.b_zustimmung_bereits_vorhanden ? (
            <DateRow
              label="Datum der bereits vorliegenden Zustimmung"
              value={form.b_zustimmung_bereits_datum}
              onChange={(v) => set("b_zustimmung_bereits_datum", v)}
            />
          ) : (
            <DateRow
              label="Datum der Zustimmung"
              value={form.b_datum}
              onChange={(v) => set("b_datum", v)}
            />
          )}
        </BmfSection>

        <BmfSignatures
          left="Unterschrift Antragsteller"
          right="Unterschrift Empfänger"
        />

        <BmfFootnotes>
          <p>
            <strong>Z. 3 auto-Berechnung:</strong> Geld + Sach =
            (Z. 1<sub>Geld</sub> − Z. 2<sub>Kind-Geld</sub>) + (Z. 1<sub>Sach</sub> − Z. 2<sub>Kind-Sach</sub>).
            Der Abzug ist auf Z. 3 und den Höchstbetrag begrenzt.
          </p>
          <p>
            <strong>Höchstbetrag Realsplitting:</strong>{" "}
            {euro.format(REALSPLITTING_HOECHST)} (§ 10 Abs. 1a Nr. 1 EStG),
            zusätzlich vom Antragsteller tatsächlich übernommene Basis-KV- und
            Pflichtversicherungsbeiträge (Z. 5). Ausgleichsleistungen zur
            Vermeidung des Versorgungsausgleichs (Z. 7) sind ohne Höchstbetrag
            absetzbar (§ 10 Abs. 1a Nr. 3 EStG).
          </p>
          <p>
            <strong>Bindung und Rücknahme:</strong> Der Antrag wirkt nur mit
            Zustimmung des Empfängers. Die Zustimmung ist für das laufende
            Kalenderjahr bindend und kann nur bis zur Unanfechtbarkeit des
            Steuerbescheids widerrufen werden (§ 10 Abs. 1a Nr. 1 Satz 4
            EStG).
          </p>
          <p>
            <strong>Keine Kennziffern (Kz):</strong> Die Anlage U wird
            grundsätzlich in Papierform beim Finanzamt des Antragstellers
            eingereicht; die ELSTER-Übermittlung erfolgt über die Anlage
            Sonderausgaben mit Betrag, ohne dass einzelne Zeilen Kennziffern
            tragen.
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Einreichung
            erfolgt auf dem offiziellen BMF-Vordruck mit Originalunterschriften.
          </p>
        </BmfFootnotes>
      </BmfForm>
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

function WideRow({
  label,
  children,
  wide = 280,
}: {
  label: string;
  children: ReactNode;
  wide?: number;
}) {
  return (
    <div
      className="bmf-form__row"
      style={{ gridTemplateColumns: `48px 1fr ${wide}px` }}
    >
      <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
      <label className="bmf-form__label">
        <span>{label}</span>
      </label>
      <div className="bmf-form__amount" style={{ minWidth: 0, padding: "4px 8px" }}>
        {children}
      </div>
    </div>
  );
}

function TextRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <WideRow label={label} wide={280}>
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
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <WideRow label={label} wide={180}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={textInputStyle}
      />
    </WideRow>
  );
}

function CheckboxRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <WideRow label={label} wide={60}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </WideRow>
  );
}
