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

type JaNein = "ja" | "nein" | "";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// ---------- State ------------------------------------------------------

type AnlageSonderausgaben = {
  zusammenveranlagung: boolean;

  // Section 1: Kirchensteuer
  z4_kist_gezahlt: number; // Kz 103
  z4_kist_erstattet: number; // Kz 104

  // Section 2: Spenden
  z5_spenden_inland_best: number; // Kz 123
  z5_spenden_inland_betriebsfa: number; // Kz 124
  z6_spenden_eu_best: number; // Kz 133
  z6_spenden_eu_betriebsfa: number; // Kz 134
  z7_parteien_best: number; // Kz 127
  z7_parteien_betriebsfa: number; // Kz 128
  z8_waehler_best: number; // Kz 129
  z8_waehler_betriebsfa: number; // Kz 130
  z9_stiftung_inland_a: number; // Kz 208
  z9_stiftung_inland_b: number; // Kz 209
  z10_stiftung_eu_a: number; // Kz 224
  z10_stiftung_eu_b: number; // Kz 225
  z11_berueck_2025_a: number; // Kz 212
  z11_berueck_2025_b: number; // Kz 213
  z12_vortrag_a: number; // Kz 214
  z12_vortrag_b: number; // Kz 215

  // Section 3: Berufsausbildung (Person A/B)
  z13_art_a: string;
  z13_aufw_a: number; // Kz 200
  z13_art_b: string;
  z13_aufw_b: number;
  z14_art_a: string;
  z14_aufw_a: number; // Kz 201
  z14_art_b: string;
  z14_aufw_b: number;

  // Section 4: Versorgungsleistungen Renten
  z15_rechtsgrund: string;
  z15_vertrag_datum: string;
  z15_pct: number; // Kz 102
  z15_gezahlt: number; // Kz 101
  z16_name_geburt: string;
  z17_idnr: string; // Kz 136
  z17_inland: JaNein; // Kz 153
  z18_rechtsgrund: string;
  z18_vertrag_datum: string;
  z18_pct: number; // Kz 138
  z18_gezahlt: number; // Kz 137
  z19_name_geburt: string;
  z20_idnr: string; // Kz 139
  z20_inland: JaNein; // Kz 154
  z21_feststellung_pct: number; // Kz 150
  z21_feststellung_eur: number; // Kz 151

  // Section 5: Dauernde Lasten
  z22_rechtsgrund: string;
  z22_vertrag_datum: string;
  z22_geld: number; // Kz 100
  z23_name_geburt: string;
  z23_sachl: number; // Kz 161
  z24_idnr: string; // Kz 144
  z24_inland: JaNein; // Kz 155
  z25_rechtsgrund: string;
  z25_vertrag_datum: string;
  z25_geld: number; // Kz 145
  z26_name_geburt: string;
  z26_sachl: number; // Kz 162
  z27_idnr: string; // Kz 146
  z27_inland: JaNein; // Kz 156
  z28_feststellung: number; // Kz 152

  // Section 6: Unterhaltsleistungen
  z29_name_geburt: string;
  z29_erbracht: number; // Kz 116
  z30_idnr: string; // Kz 117
  z30_inland: JaNein; // Kz 157
  z31_kvpv: number; // Kz 118
  z32_kv_krankengeld: number; // Kz 119
  z33_name_geburt: string;
  z33_erbracht: number; // Kz 140
  z34_idnr: string; // Kz 141
  z34_inland: JaNein; // Kz 158
  z35_kvpv: number; // Kz 142
  z36_kv_krankengeld: number; // Kz 143

  // Section 7: Versorgungsausgleich
  z37_rechtsgrund: string;
  z37_erstzahlung: string;
  z37_gezahlt: number; // Kz 121
  z38_name_geburt: string;
  z39_idnr: string; // Kz 132
  z39_inland: JaNein; // Kz 159

  // Section 8: Ausgleichsleistungen Anlage U
  z40_name_geburt: string;
  z40_erbracht: number; // Kz 131
  z41_idnr: string; // Kz 135
  z41_inland: JaNein; // Kz 160
};

const DEFAULT: AnlageSonderausgaben = {
  zusammenveranlagung: false,
  z4_kist_gezahlt: 0,
  z4_kist_erstattet: 0,
  z5_spenden_inland_best: 0,
  z5_spenden_inland_betriebsfa: 0,
  z6_spenden_eu_best: 0,
  z6_spenden_eu_betriebsfa: 0,
  z7_parteien_best: 0,
  z7_parteien_betriebsfa: 0,
  z8_waehler_best: 0,
  z8_waehler_betriebsfa: 0,
  z9_stiftung_inland_a: 0,
  z9_stiftung_inland_b: 0,
  z10_stiftung_eu_a: 0,
  z10_stiftung_eu_b: 0,
  z11_berueck_2025_a: 0,
  z11_berueck_2025_b: 0,
  z12_vortrag_a: 0,
  z12_vortrag_b: 0,
  z13_art_a: "",
  z13_aufw_a: 0,
  z13_art_b: "",
  z13_aufw_b: 0,
  z14_art_a: "",
  z14_aufw_a: 0,
  z14_art_b: "",
  z14_aufw_b: 0,
  z15_rechtsgrund: "",
  z15_vertrag_datum: "",
  z15_pct: 0,
  z15_gezahlt: 0,
  z16_name_geburt: "",
  z17_idnr: "",
  z17_inland: "",
  z18_rechtsgrund: "",
  z18_vertrag_datum: "",
  z18_pct: 0,
  z18_gezahlt: 0,
  z19_name_geburt: "",
  z20_idnr: "",
  z20_inland: "",
  z21_feststellung_pct: 0,
  z21_feststellung_eur: 0,
  z22_rechtsgrund: "",
  z22_vertrag_datum: "",
  z22_geld: 0,
  z23_name_geburt: "",
  z23_sachl: 0,
  z24_idnr: "",
  z24_inland: "",
  z25_rechtsgrund: "",
  z25_vertrag_datum: "",
  z25_geld: 0,
  z26_name_geburt: "",
  z26_sachl: 0,
  z27_idnr: "",
  z27_inland: "",
  z28_feststellung: 0,
  z29_name_geburt: "",
  z29_erbracht: 0,
  z30_idnr: "",
  z30_inland: "",
  z31_kvpv: 0,
  z32_kv_krankengeld: 0,
  z33_name_geburt: "",
  z33_erbracht: 0,
  z34_idnr: "",
  z34_inland: "",
  z35_kvpv: 0,
  z36_kv_krankengeld: 0,
  z37_rechtsgrund: "",
  z37_erstzahlung: "",
  z37_gezahlt: 0,
  z38_name_geburt: "",
  z39_idnr: "",
  z39_inland: "",
  z40_name_geburt: "",
  z40_erbracht: 0,
  z41_idnr: "",
  z41_inland: "",
};

const FORM_ID = "anlage-sonder";

function loadForm(
  mandantId: string | null,
  jahr: number
): AnlageSonderausgaben {
  const parsed = readEstForm<Partial<AnlageSonderausgaben>>(
    FORM_ID,
    mandantId,
    jahr
  );
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Main page --------------------------------------------------

export default function AnlageSonderausgabenPage() {
  return (
    <MandantRequiredGuard>
      <AnlageSonderausgabenPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageSonderausgabenPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageSonderausgaben>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageSonderausgaben>(
    key: K,
    value: AnlageSonderausgaben[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Info-Summen
  const kistNetto = form.z4_kist_gezahlt - form.z4_kist_erstattet;
  const spendenGesamt =
    form.z5_spenden_inland_best +
    form.z5_spenden_inland_betriebsfa +
    form.z6_spenden_eu_best +
    form.z6_spenden_eu_betriebsfa;
  const parteienGesamt =
    form.z7_parteien_best +
    form.z7_parteien_betriebsfa +
    form.z8_waehler_best +
    form.z8_waehler_betriebsfa;

  // Renten/dauernde Lasten: abziehbar bei Vertrags-Rente = gezahlt × pct%
  const z15_abziehbar =
    (form.z15_gezahlt * (form.z15_pct || 100)) / 100;
  const z18_abziehbar =
    (form.z18_gezahlt * (form.z18_pct || 100)) / 100;
  const z21_abziehbar =
    (form.z21_feststellung_eur * (form.z21_feststellung_pct || 100)) / 100;
  const rentenAbziehbar = z15_abziehbar + z18_abziehbar + z21_abziehbar;

  const dauerndeLastenGesamt =
    form.z22_geld + form.z23_sachl + form.z25_geld + form.z26_sachl + form.z28_feststellung;

  const unterhaltGesamt = form.z29_erbracht + form.z33_erbracht;

  const gesamtSonderausgaben = useMemo(
    () =>
      Math.max(0, kistNetto) +
      spendenGesamt +
      parteienGesamt +
      rentenAbziehbar +
      dauerndeLastenGesamt +
      unterhaltGesamt +
      form.z37_gezahlt +
      form.z40_erbracht +
      form.z13_aufw_a + form.z13_aufw_b + form.z14_aufw_a + form.z14_aufw_b +
      form.z11_berueck_2025_a + form.z11_berueck_2025_b +
      form.z12_vortrag_a + form.z12_vortrag_b,
    [
      kistNetto,
      spendenGesamt,
      parteienGesamt,
      rentenAbziehbar,
      dauerndeLastenGesamt,
      unterhaltGesamt,
      form.z37_gezahlt,
      form.z40_erbracht,
      form.z13_aufw_a,
      form.z13_aufw_b,
      form.z14_aufw_a,
      form.z14_aufw_b,
      form.z11_berueck_2025_a,
      form.z11_berueck_2025_b,
      form.z12_vortrag_a,
      form.z12_vortrag_b,
    ]
  );

  function validate(): string[] {
    const warns: string[] = [];
    if (form.z4_kist_erstattet > form.z4_kist_gezahlt) {
      warns.push("Z. 4: KiSt-Erstattung > KiSt-Zahlung — Netto-Ansatz ergibt 0.");
    }
    const idCheck = (id: string, field: string) => {
      if (id && !/^\d{11}$/.test(id)) {
        warns.push(`${field}: Identifikationsnummer sollte 11-stellig sein.`);
      }
    };
    idCheck(form.z17_idnr, "Z. 17");
    idCheck(form.z20_idnr, "Z. 20");
    idCheck(form.z24_idnr, "Z. 24");
    idCheck(form.z27_idnr, "Z. 27");
    idCheck(form.z30_idnr, "Z. 30");
    idCheck(form.z34_idnr, "Z. 34");
    idCheck(form.z39_idnr, "Z. 39");
    idCheck(form.z41_idnr, "Z. 41");
    if (form.z32_kv_krankengeld > form.z31_kvpv)
      warns.push("Z. 32 > Z. 31 (Krankengeld-Anteil > KV/PV gesamt)");
    if (form.z36_kv_krankengeld > form.z35_kvpv)
      warns.push("Z. 36 > Z. 35 (Krankengeld-Anteil > KV/PV gesamt)");
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 8000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-sonder"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-sonder",
      summary: `Anlage Sonderausgaben gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-sonder",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        kistNetto,
        spendenGesamt,
        parteienGesamt,
        rentenAbziehbar,
        dauerndeLastenGesamt,
        unterhaltGesamt,
        gesamtSonderausgaben,
        form,
      },
    });
    toast.success("Anlage Sonderausgaben gespeichert.");
  }

  const zus = form.zusammenveranlagung;

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage Sonderausgaben</h1>
          <p>
            Angaben zu Sonderausgaben · § 10 / 10b / 10c EStG · ohne
            Versicherungsaufwendungen und Altersvorsorgebeiträge · VZ{" "}
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
          Anlage Sonderausgaben · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-sonder" />

      <section className="card taxcalc__section no-print">
        <label className="form-field kontenplan__toggle--form">
          <input
            type="checkbox"
            checked={form.zusammenveranlagung}
            onChange={(e) => set("zusammenveranlagung", e.target.checked)}
          />
          <span>Zusammenveranlagung (Person B einblenden)</span>
        </label>
      </section>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Cross-References:</strong> Versicherungsbeiträge gehören auf
          Anlage Vorsorgeaufwand · Unterhalt-Realsplitting auf Anlage U (→
          Anlage SO Empfänger) · Spenden in Stiftungs-Vermögensstock können
          über 10 Jahre verteilt werden (Z. 11/12).
        </div>
      </aside>

      <BmfForm
        title="Anlage Sonderausgaben"
        subtitle={`§ 10/10b/10c EStG · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection
          title="1. Kirchensteuer (Z. 4)"
          description="NICHT erfassen, soweit KiSt als Zuschlag zur Abgeltungsteuer einbehalten wurde (siehe Anlage KAP)."
        >
          <BmfInputRow
            kz="103"
            label="Gezahlte Kirchensteuer 2025"
            hint="Z. 4"
            value={form.z4_kist_gezahlt}
            onChange={(v) => set("z4_kist_gezahlt", v)}
          />
          <BmfInputRow
            kz="104"
            label="Erstattete Kirchensteuer 2025"
            hint="Z. 4 · wird abgezogen"
            value={form.z4_kist_erstattet}
            onChange={(v) => set("z4_kist_erstattet", v)}
          />
          <BmfRow
            kz=""
            label="KiSt netto Z. 103 − Z. 104 (Info)"
            value={Math.max(0, kistNetto)}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Spenden und Mitgliedsbeiträge (Z. 5–12)"
          description="§ 10b EStG · Zuwendungsbestätigung erforderlich (außer Kleinbetrag ≤ 300 €)."
          total={spendenGesamt + parteienGesamt}
        >
          <BmfInputRow
            kz="123"
            label="Spenden Inland — laut Bestätigungen"
            hint="Z. 5"
            value={form.z5_spenden_inland_best}
            onChange={(v) => set("z5_spenden_inland_best", v)}
          />
          <BmfInputRow
            kz="124"
            label="Spenden Inland — laut Betriebsfinanzamt"
            hint="Z. 5"
            value={form.z5_spenden_inland_betriebsfa}
            onChange={(v) => set("z5_spenden_inland_betriebsfa", v)}
          />
          <BmfInputRow
            kz="133"
            label="Spenden EU/EWR — laut Bestätigungen"
            hint="Z. 6"
            value={form.z6_spenden_eu_best}
            onChange={(v) => set("z6_spenden_eu_best", v)}
          />
          <BmfInputRow
            kz="134"
            label="Spenden EU/EWR — laut Betriebsfinanzamt"
            hint="Z. 6"
            value={form.z6_spenden_eu_betriebsfa}
            onChange={(v) => set("z6_spenden_eu_betriebsfa", v)}
          />
          <BmfInputRow
            kz="127"
            label="Spenden an politische Parteien — laut Bestätigungen"
            hint="Z. 7 · §§ 34g, 10b EStG"
            value={form.z7_parteien_best}
            onChange={(v) => set("z7_parteien_best", v)}
          />
          <BmfInputRow
            kz="128"
            label="Politische Parteien — laut Betriebsfinanzamt"
            hint="Z. 7"
            value={form.z7_parteien_betriebsfa}
            onChange={(v) => set("z7_parteien_betriebsfa", v)}
          />
          <BmfInputRow
            kz="129"
            label="Unabhängige Wählervereinigungen — Bestätigungen"
            hint="Z. 8 · § 34g EStG"
            value={form.z8_waehler_best}
            onChange={(v) => set("z8_waehler_best", v)}
          />
          <BmfInputRow
            kz="130"
            label="Wählervereinigungen — Betriebsfinanzamt"
            hint="Z. 8"
            value={form.z8_waehler_betriebsfa}
            onChange={(v) => set("z8_waehler_betriebsfa", v)}
          />

          {/* Stiftung — dual columns */}
          <div
            className="bmf-form__row"
            style={{ background: "#eef1f6", fontStyle: "italic" }}
          >
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div className="bmf-form__label" style={{ color: "#15233d" }}>
              Spenden in den Vermögensstock einer Stiftung (§ 10b Abs. 1a EStG
              · 1 Mio. € / 10 Jahre verteilbar)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <PairedRow
            zeile="9"
            label="Stiftung Inland 2025"
            kzA="208"
            kzB="209"
            valueA={form.z9_stiftung_inland_a}
            valueB={form.z9_stiftung_inland_b}
            onA={(v) => set("z9_stiftung_inland_a", v)}
            onB={(v) => set("z9_stiftung_inland_b", v)}
            zus={zus}
          />
          <PairedRow
            zeile="10"
            label="Stiftung EU/EWR 2025"
            kzA="224"
            kzB="225"
            valueA={form.z10_stiftung_eu_a}
            valueB={form.z10_stiftung_eu_b}
            onA={(v) => set("z10_stiftung_eu_a", v)}
            onB={(v) => set("z10_stiftung_eu_b", v)}
            zus={zus}
          />
          <PairedRow
            zeile="11"
            label="davon 2025 zu berücksichtigen"
            kzA="212"
            kzB="213"
            valueA={form.z11_berueck_2025_a}
            valueB={form.z11_berueck_2025_b}
            onA={(v) => set("z11_berueck_2025_a", v)}
            onB={(v) => set("z11_berueck_2025_b", v)}
            zus={zus}
          />
          <PairedRow
            zeile="12"
            label="Vortrag aus Vorjahren (Stiftungs-Vermögensstock)"
            kzA="214"
            kzB="215"
            valueA={form.z12_vortrag_a}
            valueB={form.z12_vortrag_b}
            onA={(v) => set("z12_vortrag_a", v)}
            onB={(v) => set("z12_vortrag_b", v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection
          title="3. Eigene Berufsausbildung (Z. 13–14)"
          description="§ 10 Abs. 1 Nr. 7 EStG · max. 6.000 €/Jahr und Person (Erstausbildung)."
        >
          <TextRow
            zeile="13"
            label={`Art der Ausbildung / Aufwendungen${zus ? " (Person A)" : ""}`}
            value={form.z13_art_a}
            onChange={(v) => set("z13_art_a", v)}
          />
          <BmfInputRow
            kz="200"
            label={`Aufwendungen${zus ? " (Person A)" : ""}`}
            hint="Z. 13"
            value={form.z13_aufw_a}
            onChange={(v) => set("z13_aufw_a", v)}
          />
          {zus && (
            <>
              <TextRow
                zeile="13"
                label="Art der Ausbildung / Aufwendungen (Person B)"
                value={form.z13_art_b}
                onChange={(v) => set("z13_art_b", v)}
              />
              <BmfInputRow
                kz=""
                label="Aufwendungen (Person B)"
                hint="Z. 13"
                value={form.z13_aufw_b}
                onChange={(v) => set("z13_aufw_b", v)}
              />
            </>
          )}
          <TextRow
            zeile="14"
            label={`Art der Ausbildung / Aufwendungen${zus ? " (Person A)" : ""}`}
            value={form.z14_art_a}
            onChange={(v) => set("z14_art_a", v)}
          />
          <BmfInputRow
            kz="201"
            label={`Aufwendungen${zus ? " (Person A)" : ""}`}
            hint="Z. 14"
            value={form.z14_aufw_a}
            onChange={(v) => set("z14_aufw_a", v)}
          />
          {zus && (
            <>
              <TextRow
                zeile="14"
                label="Art der Ausbildung / Aufwendungen (Person B)"
                value={form.z14_art_b}
                onChange={(v) => set("z14_art_b", v)}
              />
              <BmfInputRow
                kz=""
                label="Aufwendungen (Person B)"
                hint="Z. 14"
                value={form.z14_aufw_b}
                onChange={(v) => set("z14_aufw_b", v)}
              />
            </>
          )}
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection
          title="4. Versorgungsleistungen aus Renten (Z. 15–21)"
          description="Nur für Verträge vor 1.1.2008 oder § 10 Abs. 1a Nr. 2 EStG · 2 empfangsberechtigte Personen + Feststellung."
        >
          <EmpfaengerRentenBlock
            title="1. empfangsberechtigte Person"
            zeilen={{ vertrag: "15", name: "16", idnr: "17" }}
            kz={{ pct: "102", gezahlt: "101", idnr: "136", inland: "153" }}
            rechtsgrund={form.z15_rechtsgrund}
            vertragDatum={form.z15_vertrag_datum}
            pct={form.z15_pct}
            gezahlt={form.z15_gezahlt}
            nameGeburt={form.z16_name_geburt}
            idnr={form.z17_idnr}
            inland={form.z17_inland}
            onRechtsgrund={(v) => set("z15_rechtsgrund", v)}
            onVertragDatum={(v) => set("z15_vertrag_datum", v)}
            onPct={(v) => set("z15_pct", v)}
            onGezahlt={(v) => set("z15_gezahlt", v)}
            onNameGeburt={(v) => set("z16_name_geburt", v)}
            onIdnr={(v) => set("z17_idnr", v)}
            onInland={(v) => set("z17_inland", v)}
          />
          <EmpfaengerRentenBlock
            title="2. empfangsberechtigte Person"
            zeilen={{ vertrag: "18", name: "19", idnr: "20" }}
            kz={{ pct: "138", gezahlt: "137", idnr: "139", inland: "154" }}
            rechtsgrund={form.z18_rechtsgrund}
            vertragDatum={form.z18_vertrag_datum}
            pct={form.z18_pct}
            gezahlt={form.z18_gezahlt}
            nameGeburt={form.z19_name_geburt}
            idnr={form.z20_idnr}
            inland={form.z20_inland}
            onRechtsgrund={(v) => set("z18_rechtsgrund", v)}
            onVertragDatum={(v) => set("z18_vertrag_datum", v)}
            onPct={(v) => set("z18_pct", v)}
            onGezahlt={(v) => set("z18_gezahlt", v)}
            onNameGeburt={(v) => set("z19_name_geburt", v)}
            onIdnr={(v) => set("z20_idnr", v)}
            onInland={(v) => set("z20_inland", v)}
          />
          <PercentRow
            kz="150"
            zeile="21"
            label="Feststellung · abziehbar in %"
            value={form.z21_feststellung_pct}
            onChange={(v) => set("z21_feststellung_pct", v)}
          />
          <BmfInputRow
            kz="151"
            label="Feststellung · tatsächlich gezahlt"
            hint="Z. 21"
            value={form.z21_feststellung_eur}
            onChange={(v) => set("z21_feststellung_eur", v)}
          />
          <BmfRow
            kz=""
            label="Summe abziehbar Versorgungsleistungen (Info · Z.15+18+21 je × %)"
            value={rentenAbziehbar}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection
          title="5. Dauernde Lasten (Z. 22–28)"
          description="2 empfangsberechtigte Personen + Feststellung · Geld- und Sachleistungen getrennt."
        >
          <DauerndeLasteBlock
            title="1. empfangsberechtigte Person"
            zeilen={{ vertrag: "22", nameSach: "23", idnr: "24" }}
            kz={{ geld: "100", sachl: "161", idnr: "144", inland: "155" }}
            rechtsgrund={form.z22_rechtsgrund}
            vertragDatum={form.z22_vertrag_datum}
            geld={form.z22_geld}
            nameGeburt={form.z23_name_geburt}
            sachl={form.z23_sachl}
            idnr={form.z24_idnr}
            inland={form.z24_inland}
            onRechtsgrund={(v) => set("z22_rechtsgrund", v)}
            onVertragDatum={(v) => set("z22_vertrag_datum", v)}
            onGeld={(v) => set("z22_geld", v)}
            onNameGeburt={(v) => set("z23_name_geburt", v)}
            onSachl={(v) => set("z23_sachl", v)}
            onIdnr={(v) => set("z24_idnr", v)}
            onInland={(v) => set("z24_inland", v)}
          />
          <DauerndeLasteBlock
            title="2. empfangsberechtigte Person"
            zeilen={{ vertrag: "25", nameSach: "26", idnr: "27" }}
            kz={{ geld: "145", sachl: "162", idnr: "146", inland: "156" }}
            rechtsgrund={form.z25_rechtsgrund}
            vertragDatum={form.z25_vertrag_datum}
            geld={form.z25_geld}
            nameGeburt={form.z26_name_geburt}
            sachl={form.z26_sachl}
            idnr={form.z27_idnr}
            inland={form.z27_inland}
            onRechtsgrund={(v) => set("z25_rechtsgrund", v)}
            onVertragDatum={(v) => set("z25_vertrag_datum", v)}
            onGeld={(v) => set("z25_geld", v)}
            onNameGeburt={(v) => set("z26_name_geburt", v)}
            onSachl={(v) => set("z26_sachl", v)}
            onIdnr={(v) => set("z27_idnr", v)}
            onInland={(v) => set("z27_inland", v)}
          />
          <BmfInputRow
            kz="152"
            label="Feststellung · Dauernde Lasten gesamt"
            hint="Z. 28"
            value={form.z28_feststellung}
            onChange={(v) => set("z28_feststellung", v)}
          />
          <BmfRow
            kz=""
            label="Summe Dauernde Lasten (Info)"
            value={dauerndeLastenGesamt}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 6 ============ */}
        <BmfSection
          title="6. Unterhaltsleistungen Realsplitting (Z. 29–36)"
          description="Nur Unterhalt an geschiedenen/dauernd getrennt lebenden Ehegatten/LP · Zustimmung erforderlich (Anlage U)."
        >
          <UnterhaltBlock
            title="1. unterstützte Person"
            zeilen={{ name: "29", idnr: "30", kvpv: "31", kg: "32" }}
            kz={{
              erbracht: "116",
              idnr: "117",
              inland: "157",
              kvpv: "118",
              kg: "119",
            }}
            nameGeburt={form.z29_name_geburt}
            erbracht={form.z29_erbracht}
            idnr={form.z30_idnr}
            inland={form.z30_inland}
            kvpv={form.z31_kvpv}
            kv_krankengeld={form.z32_kv_krankengeld}
            onNameGeburt={(v) => set("z29_name_geburt", v)}
            onErbracht={(v) => set("z29_erbracht", v)}
            onIdnr={(v) => set("z30_idnr", v)}
            onInland={(v) => set("z30_inland", v)}
            onKvpv={(v) => set("z31_kvpv", v)}
            onKg={(v) => set("z32_kv_krankengeld", v)}
          />
          <UnterhaltBlock
            title="2. unterstützte Person"
            zeilen={{ name: "33", idnr: "34", kvpv: "35", kg: "36" }}
            kz={{
              erbracht: "140",
              idnr: "141",
              inland: "158",
              kvpv: "142",
              kg: "143",
            }}
            nameGeburt={form.z33_name_geburt}
            erbracht={form.z33_erbracht}
            idnr={form.z34_idnr}
            inland={form.z34_inland}
            kvpv={form.z35_kvpv}
            kv_krankengeld={form.z36_kv_krankengeld}
            onNameGeburt={(v) => set("z33_name_geburt", v)}
            onErbracht={(v) => set("z33_erbracht", v)}
            onIdnr={(v) => set("z34_idnr", v)}
            onInland={(v) => set("z34_inland", v)}
            onKvpv={(v) => set("z35_kvpv", v)}
            onKg={(v) => set("z36_kv_krankengeld", v)}
          />
          <BmfRow
            kz=""
            label="Summe Unterhaltsleistungen (Info)"
            value={unterhaltGesamt}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection
          title="7. Schuldrechtlicher Versorgungsausgleich (Z. 37–39)"
          description="§ 10 Abs. 1a Nr. 4 EStG · Ausgleichszahlungen im Rahmen des schuldrechtlichen Versorgungsausgleichs."
        >
          <TextRow
            zeile="37"
            label="Rechtsgrund"
            value={form.z37_rechtsgrund}
            onChange={(v) => set("z37_rechtsgrund", v)}
          />
          <DateRow
            kz=""
            zeile="37"
            label="Datum der erstmaligen Zahlung"
            value={form.z37_erstzahlung}
            onChange={(v) => set("z37_erstzahlung", v)}
          />
          <BmfInputRow
            kz="121"
            label="Tatsächlich gezahlt"
            hint="Z. 37"
            value={form.z37_gezahlt}
            onChange={(v) => set("z37_gezahlt", v)}
          />
          <TextRow
            zeile="38"
            label="Name, Geburtsdatum empfangsberechtigte Person"
            value={form.z38_name_geburt}
            onChange={(v) => set("z38_name_geburt", v)}
          />
          <TextRow
            zeile="39"
            label="Identifikationsnummer"
            value={form.z39_idnr}
            onChange={(v) => set("z39_idnr", v)}
          />
          <JaNeinRow
            kz="159"
            zeile="39"
            label="Wohnsitz/gewöhnl. Aufenthalt im Inland"
            value={form.z39_inland}
            onChange={(v) => set("z39_inland", v)}
          />
        </BmfSection>

        {/* ============ Section 8 ============ */}
        <BmfSection
          title="8. Ausgleichsleistungen zur Vermeidung des Versorgungsausgleichs (Z. 40–41)"
          description="§ 10 Abs. 1a Nr. 3 EStG · Betrag lt. Anlage U."
        >
          <TextRow
            zeile="40"
            label="Name, Geburtsdatum empfangsberechtigte Person"
            value={form.z40_name_geburt}
            onChange={(v) => set("z40_name_geburt", v)}
          />
          <BmfInputRow
            kz="131"
            label="Tatsächlich erbracht"
            hint="Z. 40"
            value={form.z40_erbracht}
            onChange={(v) => set("z40_erbracht", v)}
          />
          <TextRow
            zeile="41"
            label="Identifikationsnummer"
            value={form.z41_idnr}
            onChange={(v) => set("z41_idnr", v)}
          />
          <JaNeinRow
            kz="160"
            zeile="41"
            label="Wohnsitz/gewöhnl. Aufenthalt im Inland"
            value={form.z41_inland}
            onChange={(v) => set("z41_inland", v)}
          />
        </BmfSection>

        <BmfResult
          label="Summe Sonderausgaben (Info · grobe Addition aller Posten, KEINE § 10b Höchstbetragsprüfung)"
          value={gesamtSonderausgaben}
          variant={gesamtSonderausgaben > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift(en)" />

        <BmfFootnotes>
          <p>
            <strong>Kirchensteuer (Z. 4):</strong> Saldierung KiSt gezahlt −
            erstattet. Der auf Abgeltungsteuer-Kapitalerträge entfallende
            KiSt-Zuschlag gehört NICHT hierher (siehe Anlage KAP Z. 39).
          </p>
          <p>
            <strong>Spenden-Höchstbeträge § 10b EStG:</strong> gemeinnützige
            Zwecke bis zu 20 % des GdE oder 4 ‰ der Summe Umsätze + Löhne ·
            politische Parteien: 1.650 € (3.300 € Zusammen.) als
            Ermäßigung, darüber als Sonderausgabe · Stiftungs-Vermögensstock:
            1 Mio. € auf 10 Jahre verteilbar.
          </p>
          <p>
            <strong>Berufsausbildung (Z. 13/14):</strong> max. 6.000 €/Jahr
            und Person nur für ERSTAUSBILDUNG (§ 10 Abs. 1 Nr. 7). Zweitausbildung
            → Werbungskosten (Anlage N).
          </p>
          <p>
            <strong>Versorgungsleistungen (Z. 15–21):</strong> Nur bei
            Übergabevertrag vor 1.1.2008 (Altvertrag) oder bestimmten
            Betriebsübergaben (§ 10 Abs. 1a Nr. 2 EStG). Bei Renten: abziehbar
            nur der Ertragsanteil (hier als %); bei dauernden Lasten: voll
            abziehbar.
          </p>
          <p>
            <strong>Unterhaltsleistungen (Z. 29–36):</strong> Nur mit
            Zustimmung des Empfängers (Anlage U) · Höchstbetrag
            Realsplitting 13.805 € + Basis-KV/PV (Z. 31/35) · abzüglich
            Krankengeld-Anteil (4 %-Kürzung) in Z. 32/36.
          </p>
          <p>
            <strong>NICHT automatisch berechnet:</strong> § 10b Höchstbetragsprüfung
            (GdE-Abhängig), politische Parteien § 34g-Ermäßigung vs. Abzug,
            Stiftungs-Vermögensstock 10-Jahres-Verteilungsoptimierung,
            Realsplitting-Deckel.
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> Spanne 100–225. Stiftung
            Person-A/B: 208/209, 224/225, 212/213, 214/215.
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

// ---------- Empfänger-Renten block (Section 4) -------------------------

function EmpfaengerRentenBlock(props: {
  title: string;
  zeilen: { vertrag: string; name: string; idnr: string };
  kz: { pct: string; gezahlt: string; idnr: string; inland: string };
  rechtsgrund: string;
  vertragDatum: string;
  pct: number;
  gezahlt: number;
  nameGeburt: string;
  idnr: string;
  inland: JaNein;
  onRechtsgrund: (v: string) => void;
  onVertragDatum: (v: string) => void;
  onPct: (v: number) => void;
  onGezahlt: (v: number) => void;
  onNameGeburt: (v: string) => void;
  onIdnr: (v: string) => void;
  onInland: (v: JaNein) => void;
}) {
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">Angaben zur {props.title}</div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        zeile={props.zeilen.vertrag}
        label="Rechtsgrund · Datum des Vertrags"
        value={`${props.rechtsgrund}${props.vertragDatum ? " · " + props.vertragDatum : ""}`}
        onChange={(v) => {
          const parts = v.split(" · ");
          props.onRechtsgrund(parts[0] ?? "");
          props.onVertragDatum(parts[1] ?? "");
        }}
        placeholder="z. B. Übergabevertrag · TT.MM.JJJJ"
      />
      <PercentRow
        kz={props.kz.pct}
        zeile={props.zeilen.vertrag}
        label="Abziehbar in %"
        value={props.pct}
        onChange={props.onPct}
      />
      <BmfInputRow
        kz={props.kz.gezahlt}
        label="Tatsächlich gezahlt"
        hint={`Z. ${props.zeilen.vertrag}`}
        value={props.gezahlt}
        onChange={props.onGezahlt}
      />
      <TextRow
        zeile={props.zeilen.name}
        label="Name, Geburtsdatum"
        value={props.nameGeburt}
        onChange={props.onNameGeburt}
      />
      <TextRow
        zeile={props.zeilen.idnr}
        label="Identifikationsnummer"
        value={props.idnr}
        onChange={props.onIdnr}
      />
      <JaNeinRow
        kz={props.kz.inland}
        zeile={props.zeilen.idnr}
        label="Wohnsitz/Aufenthalt im Inland"
        value={props.inland}
        onChange={props.onInland}
      />
    </>
  );
}

// ---------- Dauernde-Lasten block (Section 5) --------------------------

function DauerndeLasteBlock(props: {
  title: string;
  zeilen: { vertrag: string; nameSach: string; idnr: string };
  kz: { geld: string; sachl: string; idnr: string; inland: string };
  rechtsgrund: string;
  vertragDatum: string;
  geld: number;
  nameGeburt: string;
  sachl: number;
  idnr: string;
  inland: JaNein;
  onRechtsgrund: (v: string) => void;
  onVertragDatum: (v: string) => void;
  onGeld: (v: number) => void;
  onNameGeburt: (v: string) => void;
  onSachl: (v: number) => void;
  onIdnr: (v: string) => void;
  onInland: (v: JaNein) => void;
}) {
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">Angaben zur {props.title}</div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        zeile={props.zeilen.vertrag}
        label="Rechtsgrund · Datum des Vertrags"
        value={`${props.rechtsgrund}${props.vertragDatum ? " · " + props.vertragDatum : ""}`}
        onChange={(v) => {
          const parts = v.split(" · ");
          props.onRechtsgrund(parts[0] ?? "");
          props.onVertragDatum(parts[1] ?? "");
        }}
      />
      <BmfInputRow
        kz={props.kz.geld}
        label="Tatsächlich gezahlte Geldleistungen"
        hint={`Z. ${props.zeilen.vertrag}`}
        value={props.geld}
        onChange={props.onGeld}
      />
      <TextRow
        zeile={props.zeilen.nameSach}
        label="Name, Geburtsdatum"
        value={props.nameGeburt}
        onChange={props.onNameGeburt}
      />
      <BmfInputRow
        kz={props.kz.sachl}
        label="Tatsächlich erbrachte Sachleistungen"
        hint={`Z. ${props.zeilen.nameSach}`}
        value={props.sachl}
        onChange={props.onSachl}
      />
      <TextRow
        zeile={props.zeilen.idnr}
        label="Identifikationsnummer"
        value={props.idnr}
        onChange={props.onIdnr}
      />
      <JaNeinRow
        kz={props.kz.inland}
        zeile={props.zeilen.idnr}
        label="Wohnsitz/Aufenthalt im Inland"
        value={props.inland}
        onChange={props.onInland}
      />
    </>
  );
}

// ---------- Unterhalt block (Section 6) --------------------------------

function UnterhaltBlock(props: {
  title: string;
  zeilen: { name: string; idnr: string; kvpv: string; kg: string };
  kz: {
    erbracht: string;
    idnr: string;
    inland: string;
    kvpv: string;
    kg: string;
  };
  nameGeburt: string;
  erbracht: number;
  idnr: string;
  inland: JaNein;
  kvpv: number;
  kv_krankengeld: number;
  onNameGeburt: (v: string) => void;
  onErbracht: (v: number) => void;
  onIdnr: (v: string) => void;
  onInland: (v: JaNein) => void;
  onKvpv: (v: number) => void;
  onKg: (v: number) => void;
}) {
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">Angaben zur {props.title}</div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        zeile={props.zeilen.name}
        label="Name, Geburtsdatum"
        value={props.nameGeburt}
        onChange={props.onNameGeburt}
      />
      <BmfInputRow
        kz={props.kz.erbracht}
        label="Tatsächlich erbracht"
        hint={`Z. ${props.zeilen.name}`}
        value={props.erbracht}
        onChange={props.onErbracht}
      />
      <TextRow
        zeile={props.zeilen.idnr}
        label="Identifikationsnummer"
        value={props.idnr}
        onChange={props.onIdnr}
      />
      <JaNeinRow
        kz={props.kz.inland}
        zeile={props.zeilen.idnr}
        label="Wohnsitz/Aufenthalt im Inland"
        value={props.inland}
        onChange={props.onInland}
      />
      <BmfInputRow
        kz={props.kz.kvpv}
        label="davon Basis-KV + gesetzl. PV (abzgl. Erstattungen)"
        hint={`Z. ${props.zeilen.kvpv}`}
        value={props.kvpv}
        onChange={props.onKvpv}
      />
      <BmfInputRow
        kz={props.kz.kg}
        label="davon KV mit Krankengeld-Anspruch"
        hint={`Z. ${props.zeilen.kg} · 4 %-Kürzung wirkt hier`}
        value={props.kv_krankengeld}
        onChange={props.onKg}
      />
    </>
  );
}

// ---------- Paired row -------------------------------------------------

function PairedRow(props: {
  zeile: string;
  label: string;
  kzA: string;
  kzB: string;
  valueA: number;
  valueB: number;
  onA: (v: number) => void;
  onB: (v: number) => void;
  zus: boolean;
}) {
  return (
    <>
      <BmfInputRow
        kz={props.kzA}
        label={props.zus ? `${props.label} (Person A)` : props.label}
        hint={`Z. ${props.zeile}`}
        value={props.valueA}
        onChange={props.onA}
      />
      {props.zus && (
        <BmfInputRow
          kz={props.kzB}
          label={`${props.label} (Person B)`}
          hint={`Z. ${props.zeile}`}
          value={props.valueB}
          onChange={props.onB}
        />
      )}
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
    <WideRow kz={kz} zeile={zeile} label={label} wide={180}>
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
