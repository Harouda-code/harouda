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
  BmfResult,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

type JaNein = "ja" | "nein" | "";
type ExemptionTyp = "dba" | "ate" | "zue" | "";

// ---------- State ------------------------------------------------------

type AnlageNAUS = {
  // Section 1: allgemein
  z4_staat: string;
  z5_typ: ExemptionTyp;
  z6_ausl_wohnsitz: JaNein;
  z7_adresse_strasse: string;
  z8_adresse_plzort: string;
  z9_adresse_staat: string;
  z10_mittelpunkt: JaNein;

  // Section 2: Arbeitgeber
  z11_ag_name: string;
  z12_ag_strasse: string;
  z13_ag_plzort: string;
  z14_ag_staat: string;
  z15_ag_wirtschaftszweig: string;
  z16_ag_vorhaben: string;

  // Section 3: Auslandstätigkeit
  z17_taetigkeit_art: string;
  z17_von: string;
  z17_bis: string;
  z18_beschreibung: string;
  z19_tage_ausland: number;
  z20_unterbr_grund: string;
  z20_unterbr_von: string;
  z20_unterbr_bis: string;
  z21_unterbr_beschreibung: string;
  z22_werkvertrag: boolean;
  z23_an_ueberlassung: boolean;
  z24_verbundenes: boolean;
  z25_betriebsstaette: boolean;
  z26_ausl_arbeitgeber: boolean;
  z27_weitere: string;

  // Section 4: Aufnehmendes Unternehmen
  z28_aufn_name: string;
  z29_aufn_strasse: string;
  z30_aufn_plzort: string;
  z31_aufn_staat: string;

  // Section 5: Arbeitslohn
  z32_brutto: number;
  z33_brutto_kein_abzug: number;
  z34_brutto_steuerfrei: number;
  z36_ausl_pflichtig_bezeichnung: string;
  z36_ausl_pflichtig: number;
  z37_ausl_frei_bezeichnung: string;
  z37_ausl_frei: number;
  z39_direkt_inland_bezeichnung: string;
  z39_direkt_inland: number;
  z40_direkt_ausland_bezeichnung: string;
  z40_direkt_ausland: number;
  z41_direkt_andere_bezeichnung: string;
  z41_direkt_andere: number;
  z43_tage_arbeit_gesamt: number;
  z44_tage_ausl_besteuerung: number;

  // Section 6: ATE
  z48_tage_arbeit_gesamt: number;
  z49_tage_ausl_besteuerung: number;

  // Section 7: ZÜ
  z53_zue: string;
  z54_organisation: string;
  z55_art_taetigkeit: string;
  z56_arbeitslohn: number;

  // Section 8: Werbungskosten
  z57_wk_direkt: number;
  z58_wk_indirekt: number;

  // Section 9: Fünftel-Regelung
  z60_entschaedigung: number;
  z61_wk_entschaedigung: number;

  // Section 10: Special DBA
  z63_sonderfall: number;
  z64_wk_sonderfall: number;
  z65_staatsangehoerigkeit: string;
};

const DEFAULT: AnlageNAUS = {
  z4_staat: "",
  z5_typ: "",
  z6_ausl_wohnsitz: "",
  z7_adresse_strasse: "",
  z8_adresse_plzort: "",
  z9_adresse_staat: "",
  z10_mittelpunkt: "",
  z11_ag_name: "",
  z12_ag_strasse: "",
  z13_ag_plzort: "",
  z14_ag_staat: "",
  z15_ag_wirtschaftszweig: "",
  z16_ag_vorhaben: "",
  z17_taetigkeit_art: "",
  z17_von: "",
  z17_bis: "",
  z18_beschreibung: "",
  z19_tage_ausland: 0,
  z20_unterbr_grund: "",
  z20_unterbr_von: "",
  z20_unterbr_bis: "",
  z21_unterbr_beschreibung: "",
  z22_werkvertrag: false,
  z23_an_ueberlassung: false,
  z24_verbundenes: false,
  z25_betriebsstaette: false,
  z26_ausl_arbeitgeber: false,
  z27_weitere: "",
  z28_aufn_name: "",
  z29_aufn_strasse: "",
  z30_aufn_plzort: "",
  z31_aufn_staat: "",
  z32_brutto: 0,
  z33_brutto_kein_abzug: 0,
  z34_brutto_steuerfrei: 0,
  z36_ausl_pflichtig_bezeichnung: "",
  z36_ausl_pflichtig: 0,
  z37_ausl_frei_bezeichnung: "",
  z37_ausl_frei: 0,
  z39_direkt_inland_bezeichnung: "",
  z39_direkt_inland: 0,
  z40_direkt_ausland_bezeichnung: "",
  z40_direkt_ausland: 0,
  z41_direkt_andere_bezeichnung: "",
  z41_direkt_andere: 0,
  z43_tage_arbeit_gesamt: 0,
  z44_tage_ausl_besteuerung: 0,
  z48_tage_arbeit_gesamt: 0,
  z49_tage_ausl_besteuerung: 0,
  z53_zue: "",
  z54_organisation: "",
  z55_art_taetigkeit: "",
  z56_arbeitslohn: 0,
  z57_wk_direkt: 0,
  z58_wk_indirekt: 0,
  z60_entschaedigung: 0,
  z61_wk_entschaedigung: 0,
  z63_sonderfall: 0,
  z64_wk_sonderfall: 0,
  z65_staatsangehoerigkeit: "",
};

const FORM_ID = "anlage-n-aus";

function loadForm(mandantId: string | null, jahr: number): AnlageNAUS {
  const parsed = readEstForm<Partial<AnlageNAUS>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Main page --------------------------------------------------

export default function AnlageNAUSPage() {
  return (
    <MandantRequiredGuard>
      <AnlageNAUSPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageNAUSPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageNAUS>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageNAUS>(key: K, value: AnlageNAUS[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-calcs
  const z35 = form.z32_brutto + form.z33_brutto_kein_abzug + form.z34_brutto_steuerfrei;
  const z38 = z35 - form.z36_ausl_pflichtig + form.z37_ausl_frei;
  const z42 =
    z38 - form.z39_direkt_inland - form.z40_direkt_ausland - form.z41_direkt_andere;

  // DBA: Z. 45 = Z. 42 × Z. 44 / Z. 43
  const z45 =
    form.z43_tage_arbeit_gesamt > 0
      ? (z42 * form.z44_tage_ausl_besteuerung) / form.z43_tage_arbeit_gesamt
      : 0;
  const z47 = z45 + form.z40_direkt_ausland;

  // ATE: Z. 50 = Z. 42 × Z. 49 / Z. 48
  const z50 =
    form.z48_tage_arbeit_gesamt > 0
      ? (z42 * form.z49_tage_ausl_besteuerung) / form.z48_tage_arbeit_gesamt
      : 0;
  const z52 = z50 + form.z40_direkt_ausland;

  const z59 = form.z57_wk_direkt + form.z58_wk_indirekt;
  const z62 = form.z60_entschaedigung - form.z61_wk_entschaedigung;

  const steuerfrei_gesamt = useMemo(() => {
    if (form.z5_typ === "dba") return z47;
    if (form.z5_typ === "ate") return z52;
    if (form.z5_typ === "zue") return form.z56_arbeitslohn;
    return 0;
  }, [form.z5_typ, z47, z52, form.z56_arbeitslohn]);

  function validate(): string[] {
    const warns: string[] = [];
    if (!form.z4_staat.trim()) warns.push("Z. 4: Staat fehlt.");
    if (!form.z5_typ) warns.push("Z. 5: Befreiungs-Typ (DBA/ATE/ZÜ) auswählen.");
    if (
      form.z43_tage_arbeit_gesamt > 0 &&
      form.z44_tage_ausl_besteuerung > form.z43_tage_arbeit_gesamt
    ) {
      warns.push("Z. 44 > Z. 43 (Auslandsarbeitstage > Gesamtarbeitstage).");
    }
    if (
      form.z48_tage_arbeit_gesamt > 0 &&
      form.z49_tage_ausl_besteuerung > form.z48_tage_arbeit_gesamt
    ) {
      warns.push("Z. 49 > Z. 48 (ATE Auslandsarbeitstage > Gesamtarbeitstage).");
    }
    if (
      form.z17_von &&
      form.z17_bis &&
      form.z17_von > form.z17_bis
    ) {
      warns.push("Z. 17: Tätigkeit Beginn nach Ende.");
    }
    if (
      form.z20_unterbr_von &&
      form.z20_unterbr_bis &&
      form.z20_unterbr_von > form.z20_unterbr_bis
    ) {
      warns.push("Z. 20: Unterbrechung Beginn nach Ende.");
    }
    if (form.z19_tage_ausland > 366) {
      warns.push("Z. 19: Tage im Ausland > 366 unplausibel.");
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 7000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-n-aus"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-n-aus",
      summary: `Anlage N-AUS gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-n-aus",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        z35,
        z38,
        z42,
        z45,
        z47,
        z50,
        z52,
        z59,
        z62,
        steuerfrei_gesamt,
        form,
      },
    });
    toast.success("Anlage N-AUS gespeichert.");
  }

  const isDBA = form.z5_typ === "dba";
  const isATE = form.z5_typ === "ate";
  const isZUE = form.z5_typ === "zue";

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage N-AUS</h1>
          <p>
            Ausländische Einkünfte aus nichtselbständiger Arbeit · VZ{" "}
            {selectedYear} · Je Staat ein Formular.
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
          Anlage N-AUS · VZ {selectedYear}
          {form.z4_staat ? " · " + form.z4_staat : ""}
        </span>
      </div>

      <FormMetaBadge formId="anlage-n-aus" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Je Staat ein Formular.</strong> Bei mehreren ausländischen
          Einsatzländern: dieses Formular pro Staat ausfüllen, drucken oder
          speichern, und dann Daten zurücksetzen für den nächsten. Die
          Freistellungsart (DBA/ATE/ZÜ · Z. 5) entscheidet, welche
          Berechnungsformel greift — die Anwendbarkeit des jeweiligen
          Abkommens wird hier NICHT geprüft.
        </div>
      </aside>

      <BmfForm
        title="Anlage N-AUS"
        subtitle={`Ausländische Einkünfte nichtselbst. Arbeit · VZ ${selectedYear}${form.z4_staat ? " · " + form.z4_staat : ""}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Allgemeine Angaben (Z. 4–10)">
          <TextRow
            zeile="4"
            label="Staat — Tätigkeitsland (separates Formular je Staat)"
            value={form.z4_staat}
            onChange={(v) => set("z4_staat", v)}
            placeholder="z. B. Frankreich, USA, Schweiz"
          />
          <WideRow kz="" zeile="5" label="Rechtsgrundlage des steuerfreien Arbeitslohns" wide={220}>
            <select
              value={form.z5_typ}
              onChange={(e) => set("z5_typ", e.target.value as ExemptionTyp)}
              style={{ ...selectStyle }}
            >
              <option value="">— bitte wählen —</option>
              <option value="dba">1 · Doppelbesteuerungsabkommen (DBA)</option>
              <option value="ate">2 · Auslandstätigkeitserlass (ATE)</option>
              <option value="zue">3 · Zwischenstaatliches Übereinkommen (ZÜ)</option>
            </select>
          </WideRow>
          <JaNeinRow
            zeile="6"
            label="Wohnsitz im Ausland zusätzlich zum inländischen Wohnsitz?"
            value={form.z6_ausl_wohnsitz}
            onChange={(v) => set("z6_ausl_wohnsitz", v)}
          />
          <TextRow
            zeile="7"
            label="Straße und Hausnummer (Ausland)"
            value={form.z7_adresse_strasse}
            onChange={(v) => set("z7_adresse_strasse", v)}
          />
          <TextRow
            zeile="8"
            label="Postleitzahl, Ort (Ausland)"
            value={form.z8_adresse_plzort}
            onChange={(v) => set("z8_adresse_plzort", v)}
          />
          <TextRow
            zeile="9"
            label="Staat (Wohnsitz-Ausland)"
            value={form.z9_adresse_staat}
            onChange={(v) => set("z9_adresse_staat", v)}
          />
          <JaNeinRow
            zeile="10"
            label="Mittelpunkt der Lebensinteressen in diesem Staat?"
            value={form.z10_mittelpunkt}
            onChange={(v) => set("z10_mittelpunkt", v)}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection title="2. Arbeitgeber (Z. 11–16)">
          <TextRow
            zeile="11"
            label="Name / Bezeichnung des Arbeitgebers"
            value={form.z11_ag_name}
            onChange={(v) => set("z11_ag_name", v)}
          />
          <TextRow
            zeile="12"
            label="Straße und Hausnummer"
            value={form.z12_ag_strasse}
            onChange={(v) => set("z12_ag_strasse", v)}
          />
          <TextRow
            zeile="13"
            label="Postleitzahl, Ort"
            value={form.z13_ag_plzort}
            onChange={(v) => set("z13_ag_plzort", v)}
          />
          <TextRow
            zeile="14"
            label="Staat"
            value={form.z14_ag_staat}
            onChange={(v) => set("z14_ag_staat", v)}
          />
          {isATE && (
            <>
              <TextRow
                zeile="15"
                label="Wirtschaftszweig des Arbeitgebers (nur ATE)"
                value={form.z15_ag_wirtschaftszweig}
                onChange={(v) => set("z15_ag_wirtschaftszweig", v)}
              />
              <TextRow
                zeile="16"
                label="Art des begünstigten Vorhabens (nur ATE)"
                value={form.z16_ag_vorhaben}
                onChange={(v) => set("z16_ag_vorhaben", v)}
              />
            </>
          )}
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection title="3. Auslandstätigkeit (Z. 17–27)">
          <TextRow
            zeile="17"
            label="Art der Auslandstätigkeit"
            value={form.z17_taetigkeit_art}
            onChange={(v) => set("z17_taetigkeit_art", v)}
          />
          <DatePairRow
            zeile="17"
            label="Zeitraum (vom/bis)"
            valueA={form.z17_von}
            valueB={form.z17_bis}
            onA={(v) => set("z17_von", v)}
            onB={(v) => set("z17_bis", v)}
          />
          <TextRow
            zeile="18"
            label="Ergänzende Beschreibung"
            value={form.z18_beschreibung}
            onChange={(v) => set("z18_beschreibung", v)}
          />
          <BmfInputRow
            kz=""
            label="Anzahl Kalendertage im ausländischen Staat"
            hint="Z. 19 · vgl. Anleitung"
            value={form.z19_tage_ausland}
            onChange={(v) => set("z19_tage_ausland", v)}
            step={1}
          />
          <TextRow
            zeile="20"
            label="Unterbrechung der Tätigkeit — Grund"
            value={form.z20_unterbr_grund}
            onChange={(v) => set("z20_unterbr_grund", v)}
          />
          <DatePairRow
            zeile="20"
            label="Unterbrechung (vom/bis)"
            valueA={form.z20_unterbr_von}
            valueB={form.z20_unterbr_bis}
            onA={(v) => set("z20_unterbr_von", v)}
            onB={(v) => set("z20_unterbr_bis", v)}
          />
          <TextRow
            zeile="21"
            label="Ergänzende Beschreibung der Unterbrechung"
            value={form.z21_unterbr_beschreibung}
            onChange={(v) => set("z21_unterbr_beschreibung", v)}
          />

          <CheckboxRow
            zeile="22"
            label="Werkvertrag / Werkleistungsverpflichtung des Arbeitgebers"
            value={form.z22_werkvertrag}
            onChange={(v) => set("z22_werkvertrag", v)}
          />
          <CheckboxRow
            zeile="23"
            label="Gewerbliche Arbeitnehmerüberlassung"
            value={form.z23_an_ueberlassung}
            onChange={(v) => set("z23_an_ueberlassung", v)}
          />
          <CheckboxRow
            zeile="24"
            label="Bei einem mit dem Arbeitgeber verbundenen Unternehmen"
            value={form.z24_verbundenes}
            onChange={(v) => set("z24_verbundenes", v)}
          />
          <CheckboxRow
            zeile="25"
            label="Für eine Betriebsstätte des Arbeitgebers i.S.d. DBA"
            value={form.z25_betriebsstaette}
            onChange={(v) => set("z25_betriebsstaette", v)}
          />
          <CheckboxRow
            zeile="26"
            label="Für einen ausländischen Arbeitgeber (Dienstverhältnis)"
            value={form.z26_ausl_arbeitgeber}
            onChange={(v) => set("z26_ausl_arbeitgeber", v)}
          />
          <TextRow
            zeile="27"
            label="Weitere Angaben"
            value={form.z27_weitere}
            onChange={(v) => set("z27_weitere", v)}
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection title="4. Aufnehmendes Unternehmen (Z. 28–31)">
          <TextRow
            zeile="28"
            label="Name / Bezeichnung"
            value={form.z28_aufn_name}
            onChange={(v) => set("z28_aufn_name", v)}
          />
          <TextRow
            zeile="29"
            label="Straße und Hausnummer"
            value={form.z29_aufn_strasse}
            onChange={(v) => set("z29_aufn_strasse", v)}
          />
          <TextRow
            zeile="30"
            label="Postleitzahl, Ort"
            value={form.z30_aufn_plzort}
            onChange={(v) => set("z30_aufn_plzort", v)}
          />
          <TextRow
            zeile="31"
            label="Staat"
            value={form.z31_aufn_staat}
            onChange={(v) => set("z31_aufn_staat", v)}
          />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection
          title="5. Arbeitslohn (Z. 32–47)"
          description="Aufbereitung des Bruttolohns und Aufteilung In-/Ausland — Grundlage für die DBA-/ATE-Freistellung."
        >
          <BmfInputRow
            kz=""
            label="Bruttoarbeitslohn lt. Nr. 3 der LSt-Bescheinigung"
            hint="Z. 32"
            value={form.z32_brutto}
            onChange={(v) => set("z32_brutto", v)}
          />
          <BmfInputRow
            kz=""
            label="+ Brutto ohne inländischen Steuerabzug"
            hint="Z. 33"
            value={form.z33_brutto_kein_abzug}
            onChange={(v) => set("z33_brutto_kein_abzug", v)}
          />
          <BmfInputRow
            kz=""
            label="+ Steuerfreier Brutto lt. Nr. 16 a/b der LSt-Bescheinigung"
            hint="Z. 34"
            value={form.z34_brutto_steuerfrei}
            onChange={(v) => set("z34_brutto_steuerfrei", v)}
          />
          <BmfRow
            kz=""
            label="Zwischensumme Z. 32 + 33 + 34 (auto)"
            value={z35}
            subtotal
          />
          <TextRow
            zeile="36"
            label="Z. 36 Bezeichnung — ausl. pflichtig / de-frei"
            value={form.z36_ausl_pflichtig_bezeichnung}
            onChange={(v) => set("z36_ausl_pflichtig_bezeichnung", v)}
          />
          <BmfInputRow
            kz=""
            label="− Ausl. pflichtig, de-frei enthalten (Z. 36)"
            hint="Z. 36 · wird abgezogen"
            value={form.z36_ausl_pflichtig}
            onChange={(v) => set("z36_ausl_pflichtig", v)}
          />
          <TextRow
            zeile="37"
            label="Z. 37 Bezeichnung — ausl. frei / de-pflichtig"
            value={form.z37_ausl_frei_bezeichnung}
            onChange={(v) => set("z37_ausl_frei_bezeichnung", v)}
          />
          <BmfInputRow
            kz=""
            label="+ Ausl. frei / de-pflichtig nicht enthalten (Z. 37)"
            hint="Z. 37"
            value={form.z37_ausl_frei}
            onChange={(v) => set("z37_ausl_frei", v)}
          />
          <BmfRow
            kz=""
            label="Summe in- und ausl. Arbeitslohn Z. 35 − Z. 36 + Z. 37 (auto)"
            value={z38}
            subtotal
          />
          <TextRow
            zeile="39"
            label="Z. 39 Bezeichnung — direkt Inland"
            value={form.z39_direkt_inland_bezeichnung}
            onChange={(v) => set("z39_direkt_inland_bezeichnung", v)}
          />
          <BmfInputRow
            kz=""
            label="− Direkt zuzuordnender Arbeitslohn Inland"
            hint="Z. 39"
            value={form.z39_direkt_inland}
            onChange={(v) => set("z39_direkt_inland", v)}
          />
          <TextRow
            zeile="40"
            label={`Z. 40 Bezeichnung — direkt Ausland ${form.z4_staat || "(Staat Z. 4)"}`}
            value={form.z40_direkt_ausland_bezeichnung}
            onChange={(v) => set("z40_direkt_ausland_bezeichnung", v)}
          />
          <BmfInputRow
            kz=""
            label={`− Direkt zuzuordnender Arbeitslohn Ausland (${form.z4_staat || "Z. 4"})`}
            hint="Z. 40 · fließt in Z. 47 / Z. 52 wieder ein"
            value={form.z40_direkt_ausland}
            onChange={(v) => set("z40_direkt_ausland", v)}
          />
          <TextRow
            zeile="41"
            label="Z. 41 Bezeichnung — direkt andere N-AUS-Formulare"
            value={form.z41_direkt_andere_bezeichnung}
            onChange={(v) => set("z41_direkt_andere_bezeichnung", v)}
          />
          <BmfInputRow
            kz=""
            label="− Direkt zuzuordnend laut anderen Anlage(n) N-AUS"
            hint="Z. 41"
            value={form.z41_direkt_andere}
            onChange={(v) => set("z41_direkt_andere", v)}
          />
          <BmfRow
            kz=""
            label="Verbleibender Arbeitslohn Z. 38 − 39 − 40 − 41 (auto)"
            value={z42}
            subtotal
          />

          {isDBA && (
            <>
              <BmfInputRow
                kz=""
                label="Tatsächliche Arbeitstage im Jahr (In- und Ausland)"
                hint="Z. 43"
                value={form.z43_tage_arbeit_gesamt}
                onChange={(v) => set("z43_tage_arbeit_gesamt", v)}
                step={1}
              />
              <BmfInputRow
                kz=""
                label="davon mit ausl. Besteuerungsrecht"
                hint="Z. 44"
                value={form.z44_tage_ausl_besteuerung}
                onChange={(v) => set("z44_tage_ausl_besteuerung", v)}
                step={1}
              />
              <BmfRow
                kz=""
                label="Z. 45 = Z. 42 × Z. 44 / Z. 43 (auto)"
                value={z45}
                subtotal
              />
              <BmfRow
                kz=""
                label="Z. 46 = Z. 40 (direkt Ausland · Referenz)"
                value={form.z40_direkt_ausland}
                subtotal
              />
              <BmfRow
                kz=""
                label="Z. 47 = Z. 45 + Z. 46 · steuerfrei zu stellender ausl. Arbeitslohn (DBA)"
                value={z47}
                subtotal
              />
            </>
          )}
        </BmfSection>

        {/* ============ Section 6 (ATE) ============ */}
        {isATE && (
          <BmfSection
            title="6. ATE-Freistellung (Z. 48–52)"
            description="Parallele Berechnung nach Auslandstätigkeitserlass (BMF-Schreiben)."
          >
            <BmfInputRow
              kz=""
              label="Tatsächliche Arbeitstage im Jahr"
              hint="Z. 48"
              value={form.z48_tage_arbeit_gesamt}
              onChange={(v) => set("z48_tage_arbeit_gesamt", v)}
              step={1}
            />
            <BmfInputRow
              kz=""
              label="davon mit ausl. Besteuerungsrecht"
              hint="Z. 49"
              value={form.z49_tage_ausl_besteuerung}
              onChange={(v) => set("z49_tage_ausl_besteuerung", v)}
              step={1}
            />
            <BmfRow
              kz=""
              label="Z. 50 = Z. 42 × Z. 49 / Z. 48 (auto)"
              value={z50}
              subtotal
            />
            <BmfRow
              kz=""
              label="Z. 51 = Z. 40 (direkt Ausland · Referenz)"
              value={form.z40_direkt_ausland}
              subtotal
            />
            <BmfRow
              kz=""
              label="Z. 52 = Z. 50 + Z. 51 · steuerfrei zu stellender Arbeitslohn (ATE)"
              value={z52}
              subtotal
            />
          </BmfSection>
        )}

        {/* ============ Section 7 (ZÜ) ============ */}
        {isZUE && (
          <BmfSection
            title="7. Zwischenstaatliches Übereinkommen (Z. 53–56)"
            description="z. B. Tätigkeit bei internationalen Organisationen (UN, NATO, OECD, EU-Einrichtungen)."
          >
            <TextRow
              zeile="53"
              label="Welches sonstige zwischenstaatliche Übereinkommen?"
              value={form.z53_zue}
              onChange={(v) => set("z53_zue", v)}
            />
            <TextRow
              zeile="54"
              label="Organisation (genaue Bezeichnung)"
              value={form.z54_organisation}
              onChange={(v) => set("z54_organisation", v)}
            />
            <TextRow
              zeile="55"
              label="Art der ausgeübten Tätigkeit"
              value={form.z55_art_taetigkeit}
              onChange={(v) => set("z55_art_taetigkeit", v)}
            />
            <BmfInputRow
              kz=""
              label="Höhe des Arbeitslohns (ggf. mit Progressionsvorbehalt)"
              hint="Z. 56"
              value={form.z56_arbeitslohn}
              onChange={(v) => set("z56_arbeitslohn", v)}
            />
          </BmfSection>
        )}

        {/* ============ Section 8 ============ */}
        <BmfSection title="8. Werbungskosten zum steuerfreien Arbeitslohn (Z. 57–59)">
          <BmfInputRow
            kz=""
            label="Direkt zugeordnete Werbungskosten"
            hint="Z. 57"
            value={form.z57_wk_direkt}
            onChange={(v) => set("z57_wk_direkt", v)}
          />
          <BmfInputRow
            kz=""
            label="+ Nicht direkt zugeordnete Werbungskosten"
            hint="Z. 58 · anteilig"
            value={form.z58_wk_indirekt}
            onChange={(v) => set("z58_wk_indirekt", v)}
          />
          <BmfRow
            kz=""
            label="Summe Werbungskosten Z. 57 + 58 (auto)"
            value={z59}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 9 ============ */}
        <BmfSection
          title="9. Mehrjährige Vergütungen · Fünftel-Regelung (Z. 60–62)"
          description="§ 34 EStG — ermäßigte Besteuerung für Entschädigungen und Vergütungen für mehrjährige Tätigkeiten."
        >
          <BmfInputRow
            kz=""
            label="Entschädigungen / Vergütungen für mehrjährige Tätigkeiten"
            hint="Z. 60"
            value={form.z60_entschaedigung}
            onChange={(v) => set("z60_entschaedigung", v)}
          />
          <BmfInputRow
            kz=""
            label="− Werbungskosten zu Z. 60"
            hint="Z. 61"
            value={form.z61_wk_entschaedigung}
            onChange={(v) => set("z61_wk_entschaedigung", v)}
          />
          <BmfRow
            kz=""
            label="Verbleibender Betrag Z. 60 − Z. 61 (auto)"
            value={z62}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 10 ============ */}
        <BmfSection
          title="10. Sonderfälle DBA (Z. 63–65)"
          description="z. B. Arbeitslohn aus ausländischen öffentlichen Kassen / Kassenstaatsprinzip."
        >
          <BmfInputRow
            kz=""
            label="Steuerfreier Arbeitslohn in DBA-Sonderfällen"
            hint="Z. 63"
            value={form.z63_sonderfall}
            onChange={(v) => set("z63_sonderfall", v)}
          />
          <BmfInputRow
            kz=""
            label="− Werbungskosten zu Z. 63"
            hint="Z. 64"
            value={form.z64_wk_sonderfall}
            onChange={(v) => set("z64_wk_sonderfall", v)}
          />
          <TextRow
            zeile="65"
            label="Staatsangehörigkeit(en)"
            value={form.z65_staatsangehoerigkeit}
            onChange={(v) => set("z65_staatsangehoerigkeit", v)}
          />
        </BmfSection>

        <BmfResult
          label={
            isDBA
              ? "Steuerfrei zu stellender ausl. Arbeitslohn (DBA · Z. 47)"
              : isATE
                ? "Steuerfrei zu stellender ausl. Arbeitslohn (ATE · Z. 52)"
                : isZUE
                  ? "Steuerfrei zu stellender ausl. Arbeitslohn (ZÜ · Z. 56)"
                  : "Steuerfrei zu stellender ausl. Arbeitslohn · Typ in Z. 5 wählen"
          }
          value={steuerfrei_gesamt}
          variant={steuerfrei_gesamt > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures
          left="Datum, Ort"
          right="Unterschrift Steuerpflichtige:r"
        />

        <BmfFootnotes>
          <p>
            <strong>Auto-Berechnungen:</strong> Z. 35 = 32+33+34 · Z. 38 = 35−36+37 ·
            Z. 42 = 38−39−40−41 · Z. 45 = 42×44/43 (DBA) · Z. 47 = 45+40 (DBA) ·
            Z. 50 = 42×49/48 (ATE) · Z. 52 = 50+40 (ATE) · Z. 59 = 57+58 ·
            Z. 62 = 60−61.
          </p>
          <p>
            <strong>NICHT automatisch:</strong> Anwendbarkeit des DBA/ATE/ZÜ
            (183-Tage-Regel, Kassenstaatsprinzip, Grenzpendlerregeln,
            Rückfallklauseln), Progressionsvorbehalt-Wirkung, Anrechnung
            ausländischer Steuern (§ 34c EStG) — das erfolgt im
            Einkommensteuerbescheid.
          </p>
          <p>
            <strong>Nachweispflichten:</strong> Bei DBA-Freistellung ist die
            Besteuerung im Ausland (oder das Besteuerungsrecht des ausl. Staates)
            vom Steuerpflichtigen nachzuweisen (§ 50d Abs. 8 EStG —
            Rückfallklausel). Bei ATE: vorliegende ATE-Bescheinigung.
          </p>
          <p>
            <strong>Mehrere Auslandsstaaten:</strong> Je Staat ein eigenes
            Formular. Z. 41 erfasst direkt zuzuordnenden Arbeitslohn der
            übrigen Anlage(n) N-AUS und verhindert Doppelberücksichtigung.
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
    <WideRow kz="" zeile={zeile} label={label} wide={140}>
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

function DatePairRow({
  zeile,
  label,
  valueA,
  valueB,
  onA,
  onB,
}: {
  zeile: string;
  label: string;
  valueA: string;
  valueB: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={260}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
        <input
          type="date"
          value={valueA}
          onChange={(e) => onA(e.target.value)}
          style={textInputStyle}
        />
        <input
          type="date"
          value={valueB}
          onChange={(e) => onB(e.target.value)}
          style={textInputStyle}
        />
      </div>
    </WideRow>
  );
}

