import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Info, Printer, Save } from "lucide-react";
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
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

type JaNein = "ja" | "nein" | "";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// Kinderfreibetrag + BEA 2025 (je Elternteil hälftig): 3.336 + 1.464 = 4.800 €
// Zusammenveranlagung ganzer Betrag: 6.672 + 2.928 = 9.600 €
const KINDERFREIBETRAG_JE_ELTERNTEIL = 3336;
const BEA_FREIBETRAG_JE_ELTERNTEIL = 1464;
const KINDERGELD_MONAT = 250;
// Entlastungsbetrag Alleinerziehende 4.260 € + 240 € pro weiterem Kind
const ENTLASTUNGSBETRAG_ALLEIN = 4260;

// ---------- State ------------------------------------------------------

type AnlageKind = {
  // Section 1
  z4_idnr: string;
  z5_name: string;
  z6_geburt: string;
  z7_familienkasse: string;
  z8_inland_von: string;
  z8_inland_bis: string;
  z8_adresse_abw: string;
  z9_ausl_von: string;
  z9_ausl_bis: string;
  z9_ausl_adresse: string;
  z9_ausl_staat: string;
  z10_kind_a: 0 | 1 | 2 | 3;
  z10_kind_b: 0 | 1 | 2 | 3;
  z11_andere_name: string;
  z11_andere_geburt: string;
  z12_dauer_von: string;
  z12_dauer_bis: string;
  z12_letzte_adresse: string;
  z12_art: 0 | 1 | 2;
  z13_elternteil_ausl_von: string;
  z13_elternteil_ausl_bis: string;
  z14_tod_datum: string;
  z15_vater_unbekannt: JaNein;

  // Section 2
  z16_zeitraum1_von: string;
  z16_zeitraum1_bis: string;
  z17_erl1: string;
  z18_zeitraum2_von: string;
  z18_zeitraum2_bis: string;
  z19_erl2: string;
  z20_arbeitsuchend_von: string;
  z20_arbeitsuchend_bis: string;
  z21_behinderung_von: string;
  z21_behinderung_bis: string;
  z22_erstausbildung_abgeschlossen: JaNein;
  z23_erwerbstaetig: JaNein;
  z24_minijob: JaNein;
  z24_mj_von: string;
  z24_mj_bis: string;
  z24_mj_wochenstunden: number;
  z25_andere_erwerb: JaNein;
  z25_erwerb_von: string;
  z25_erwerb_bis: string;
  z25_erwerb_stunden: number;

  // Section 3
  z26_kinderzulage: 0 | 1 | 2 | 3 | 4;

  // Section 4
  z27_vn_kv: number;
  z28_vn_pv: number;
  z29_vn_erstattet: number;
  z30_vn_zusatz: number;
  z31_kind_kv: number;
  z32_kind_kv_mit_krankengeld: number;
  z33_kind_pv: number;
  z34_kind_erstattet: number;
  z35_kind_erst_mit_kg: number;
  z36_kind_zuschuss: number;
  z37_ausl_kv_pv: number;
  z38_ausl_mit_kg: number;

  // Section 5
  z39_voller_kifb: JaNein;
  z40_unterhaltsvorschuss_von: string;
  z40_unterhaltsvorschuss_bis: string;
  z41_voller_bea: JaNein;
  z41_von: string;
  z41_bis: string;
  z42_uebertragung_stief_gross: JaNein;
  z42_von: string;
  z42_bis: string;
  z43_zustimmung: 0 | 1 | 2;
  z44_uebertragung_an_stief: JaNein;

  // Section 6
  z45_gemeldet_von: string;
  z45_gemeldet_bis: string;
  z46_kindergeld_von: string;
  z46_kindergeld_bis: string;
  z47_weitere_volljaehrig: JaNein;
  z47_zeitraum_von: string;
  z47_zeitraum_bis: string;
  z48_haushaltsgemeinschaft: JaNein;
  z48_zeitraum_von: string;
  z48_zeitraum_bis: string;
  z49_person_name: string;
  z50_verwandtschaft_taetigkeit: string;
  z51_alleinerziehend_fuer: 0 | 1 | 2;

  // Section 7
  z52_auswaert1_von: string;
  z52_auswaert1_bis: string;
  z52_auswaert2_von: string;
  z52_auswaert2_bis: string;
  z53_anschrift: string;
  z54_ausland: JaNein;
  z55_anteil_pct: number;

  // Section 8
  z56_schule: string;
  z56_gesamt: number;
  z57_eigener_anteil: number;
  z58_anteil_pct: number;

  // Section 9
  z59_ausweis: string;
  z59_gueltig_von: string;
  z59_gueltig_bis: string;
  z59_unbefristet: JaNein;
  z59_gdb: number;
  z60_merkzeichen_g_aG: JaNein;
  z61_hilflos_bl: JaNein;
  z62_hinterbliebenen: JaNein;
  z63_pauschbetrag_anteil: number;
  z64_fahrt_70_80_g: JaNein;
  z65_fahrt_aG_bl_h: JaNein;
  z66_fahrt_anteil: number;

  // Section 10
  z67_dienstleister: string;
  z67_von: string;
  z67_bis: string;
  z67_gesamt: number;
  z68_ersatz_von: string;
  z68_ersatz_bis: string;
  z68_betrag: number;
  z69_unser_haushalt_von: string;
  z69_unser_haushalt_bis: string;
  z70_mein_haushalt_von: string;
  z70_mein_haushalt_bis: string;
  z71_andere_von: string;
  z71_andere_bis: string;
  z71_kein_gemeinsamer_von: string;
  z71_kein_gemeinsamer_bis: string;
  z72_eigene_von: string;
  z72_eigene_bis: string;
  z72_eigene_betrag: number;
  z73_anteil_pct: number;
};

const DEFAULT: AnlageKind = {
  z4_idnr: "",
  z5_name: "",
  z6_geburt: "",
  z7_familienkasse: "",
  z8_inland_von: "",
  z8_inland_bis: "",
  z8_adresse_abw: "",
  z9_ausl_von: "",
  z9_ausl_bis: "",
  z9_ausl_adresse: "",
  z9_ausl_staat: "",
  z10_kind_a: 0,
  z10_kind_b: 0,
  z11_andere_name: "",
  z11_andere_geburt: "",
  z12_dauer_von: "",
  z12_dauer_bis: "",
  z12_letzte_adresse: "",
  z12_art: 0,
  z13_elternteil_ausl_von: "",
  z13_elternteil_ausl_bis: "",
  z14_tod_datum: "",
  z15_vater_unbekannt: "",
  z16_zeitraum1_von: "",
  z16_zeitraum1_bis: "",
  z17_erl1: "",
  z18_zeitraum2_von: "",
  z18_zeitraum2_bis: "",
  z19_erl2: "",
  z20_arbeitsuchend_von: "",
  z20_arbeitsuchend_bis: "",
  z21_behinderung_von: "",
  z21_behinderung_bis: "",
  z22_erstausbildung_abgeschlossen: "",
  z23_erwerbstaetig: "",
  z24_minijob: "",
  z24_mj_von: "",
  z24_mj_bis: "",
  z24_mj_wochenstunden: 0,
  z25_andere_erwerb: "",
  z25_erwerb_von: "",
  z25_erwerb_bis: "",
  z25_erwerb_stunden: 0,
  z26_kinderzulage: 0,
  z27_vn_kv: 0,
  z28_vn_pv: 0,
  z29_vn_erstattet: 0,
  z30_vn_zusatz: 0,
  z31_kind_kv: 0,
  z32_kind_kv_mit_krankengeld: 0,
  z33_kind_pv: 0,
  z34_kind_erstattet: 0,
  z35_kind_erst_mit_kg: 0,
  z36_kind_zuschuss: 0,
  z37_ausl_kv_pv: 0,
  z38_ausl_mit_kg: 0,
  z39_voller_kifb: "",
  z40_unterhaltsvorschuss_von: "",
  z40_unterhaltsvorschuss_bis: "",
  z41_voller_bea: "",
  z41_von: "",
  z41_bis: "",
  z42_uebertragung_stief_gross: "",
  z42_von: "",
  z42_bis: "",
  z43_zustimmung: 0,
  z44_uebertragung_an_stief: "",
  z45_gemeldet_von: "",
  z45_gemeldet_bis: "",
  z46_kindergeld_von: "",
  z46_kindergeld_bis: "",
  z47_weitere_volljaehrig: "",
  z47_zeitraum_von: "",
  z47_zeitraum_bis: "",
  z48_haushaltsgemeinschaft: "",
  z48_zeitraum_von: "",
  z48_zeitraum_bis: "",
  z49_person_name: "",
  z50_verwandtschaft_taetigkeit: "",
  z51_alleinerziehend_fuer: 0,
  z52_auswaert1_von: "",
  z52_auswaert1_bis: "",
  z52_auswaert2_von: "",
  z52_auswaert2_bis: "",
  z53_anschrift: "",
  z54_ausland: "",
  z55_anteil_pct: 0,
  z56_schule: "",
  z56_gesamt: 0,
  z57_eigener_anteil: 0,
  z58_anteil_pct: 0,
  z59_ausweis: "",
  z59_gueltig_von: "",
  z59_gueltig_bis: "",
  z59_unbefristet: "",
  z59_gdb: 0,
  z60_merkzeichen_g_aG: "",
  z61_hilflos_bl: "",
  z62_hinterbliebenen: "",
  z63_pauschbetrag_anteil: 0,
  z64_fahrt_70_80_g: "",
  z65_fahrt_aG_bl_h: "",
  z66_fahrt_anteil: 0,
  z67_dienstleister: "",
  z67_von: "",
  z67_bis: "",
  z67_gesamt: 0,
  z68_ersatz_von: "",
  z68_ersatz_bis: "",
  z68_betrag: 0,
  z69_unser_haushalt_von: "",
  z69_unser_haushalt_bis: "",
  z70_mein_haushalt_von: "",
  z70_mein_haushalt_bis: "",
  z71_andere_von: "",
  z71_andere_bis: "",
  z71_kein_gemeinsamer_von: "",
  z71_kein_gemeinsamer_bis: "",
  z72_eigene_von: "",
  z72_eigene_bis: "",
  z72_eigene_betrag: 0,
  z73_anteil_pct: 0,
};

const FORM_ID = "anlage-kind";

function loadForm(mandantId: string | null, jahr: number): AnlageKind {
  const parsed = readEstForm<Partial<AnlageKind>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Main page --------------------------------------------------

export default function AnlageKindPage() {
  return (
    <MandantRequiredGuard>
      <AnlageKindPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageKindPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageKind>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageKind>(key: K, value: AnlageKind[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // --- Auto-infos ---------------------------------------------------
  const kindAlter = useMemo(() => {
    if (!form.z6_geburt) return 0;
    const birth = new Date(form.z6_geburt);
    const ref = new Date(`${selectedYear}-12-31`);
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
    return age;
  }, [form.z6_geburt, selectedYear]);

  const istVolljaehrig = kindAlter >= 18;

  const kifbInfo = useMemo(() => {
    const halb = KINDERFREIBETRAG_JE_ELTERNTEIL + BEA_FREIBETRAG_JE_ELTERNTEIL;
    const voll = halb * 2;
    return {
      halbJeElternteil: halb,
      voll,
      kindergeldJahr: KINDERGELD_MONAT * 12,
    };
  }, []);

  const kvpvKindNetto = useMemo(
    () =>
      Math.max(
        0,
        form.z27_vn_kv + form.z28_vn_pv - form.z29_vn_erstattet
      ) +
      Math.max(
        0,
        form.z31_kind_kv + form.z33_kind_pv - form.z34_kind_erstattet - form.z36_kind_zuschuss
      ) +
      form.z37_ausl_kv_pv,
    [form]
  );

  function validate(): string[] {
    const warns: string[] = [];
    if (form.z4_idnr && !/^\d{11}$/.test(form.z4_idnr)) {
      warns.push("Z. 4: IdNr sollte 11-stellig sein.");
    }
    if (form.z24_mj_wochenstunden > 20 && form.z24_minijob === "ja") {
      warns.push(
        "Z. 24: Minijob > 20h/Woche führt i. d. R. zum Verlust Kindergeldanspruch (§ 32 Abs. 4 Satz 3 EStG)."
      );
    }
    if (form.z25_erwerb_stunden > 20 && form.z25_andere_erwerb === "ja") {
      warns.push(
        "Z. 25: Erwerbstätigkeit > 20h/Woche führt i. d. R. zum Verlust Kindergeldanspruch (§ 32 Abs. 4 Satz 3 EStG)."
      );
    }
    if (form.z59_gdb > 0 && form.z59_gdb < 20) {
      warns.push("Z. 59: GdB < 20 führt nicht zum Behinderten-Pauschbetrag.");
    }
    if (form.z32_kind_kv_mit_krankengeld > form.z31_kind_kv) {
      warns.push("Z. 32 > Z. 31 (Krankengeld-Anteil > KV-Gesamt).");
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 9000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-kind"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-kind",
      summary: `Anlage Kind gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-kind",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        kindAlter,
        istVolljaehrig,
        kvpvKindNetto,
        form,
      },
    });
    toast.success("Anlage Kind gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage Kind</h1>
          <p>
            Kinderfreibeträge, Kinderbetreuungskosten, Schulgeld, Sonderbedarf
            u. a. (§ 32 / § 33b / § 33a Abs. 2 EStG) · VZ {selectedYear} · Pro
            Kind ein Formular.
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
          Anlage Kind · VZ {selectedYear}
          {form.z5_name ? " · " + form.z5_name : ""}
        </span>
      </div>

      <FormMetaBadge formId="anlage-kind" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Pro Kind ein Formular</strong> (bei mehreren Kindern
          entsprechend mehrere Anlagen). Günstigerprüfung Kindergeld{" "}
          ({euro.format(kifbInfo.kindergeldJahr)}) vs. Kinderfreibetrag (
          {euro.format(kifbInfo.halbJeElternteil)} je Elternteil /{" "}
          {euro.format(kifbInfo.voll)} Zusammenveranlagung) erfolgt
          automatisch im Bescheid. Alter des Kindes am 31.12.{selectedYear}:{" "}
          <strong>{kindAlter || "—"} Jahre</strong>
          {istVolljaehrig ? " (volljährig — Abschnitt 2 ausfüllen)" : ""}.
        </div>
      </aside>

      <BmfForm
        title="Anlage Kind"
        subtitle={`§ 32 EStG · VZ ${selectedYear}${form.z5_name ? " · " + form.z5_name : ""}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Angaben zum Kind (Z. 4–15)">
          <TextRow
            kz="01"
            zeile="4"
            label="Identifikationsnummer"
            value={form.z4_idnr}
            onChange={(v) => set("z4_idnr", v)}
            placeholder="11-stellig"
          />
          <TextRow
            zeile="5"
            label="Vorname / ggf. abweichender Familienname"
            value={form.z5_name}
            onChange={(v) => set("z5_name", v)}
          />
          <DateRow
            zeile="6"
            label="Geburtsdatum"
            value={form.z6_geburt}
            onChange={(v) => set("z6_geburt", v)}
          />
          <TextRow
            zeile="7"
            label="Zuständige Familienkasse"
            value={form.z7_familienkasse}
            onChange={(v) => set("z7_familienkasse", v)}
          />

          <DatePairRow
            kz="00"
            zeile="8"
            label="Wohnsitz Inland (vom/bis)"
            valueA={form.z8_inland_von}
            valueB={form.z8_inland_bis}
            onA={(v) => set("z8_inland_von", v)}
            onB={(v) => set("z8_inland_bis", v)}
          />
          <TextRow
            zeile="8"
            label="ggf. abweichende Adresse (Inland)"
            value={form.z8_adresse_abw}
            onChange={(v) => set("z8_adresse_abw", v)}
          />
          <DatePairRow
            kz="07"
            zeile="9"
            label="Wohnsitz Ausland (vom/bis)"
            valueA={form.z9_ausl_von}
            valueB={form.z9_ausl_bis}
            onA={(v) => set("z9_ausl_von", v)}
            onB={(v) => set("z9_ausl_bis", v)}
          />
          <TextRow
            zeile="9"
            label="Adresse Ausland"
            value={form.z9_ausl_adresse}
            onChange={(v) => set("z9_ausl_adresse", v)}
          />
          <TextRow
            kz="14"
            zeile="9"
            label="Staat"
            value={form.z9_ausl_staat}
            onChange={(v) => set("z9_ausl_staat", v)}
          />

          <SelectRow
            kz="02"
            zeile="10"
            label="Kindschaftsverhältnis zur Person A"
            value={form.z10_kind_a}
            onChange={(v) => set("z10_kind_a", v as 0 | 1 | 2 | 3)}
            options={[
              { v: 0, l: "—" },
              { v: 1, l: "1 · Leibliches Kind / Adoptivkind" },
              { v: 2, l: "2 · Pflegekind" },
              { v: 3, l: "3 · Enkel-/Stiefkind" },
            ]}
          />
          <SelectRow
            kz="03"
            zeile="10"
            label="Kindschaftsverhältnis zur Person B"
            value={form.z10_kind_b}
            onChange={(v) => set("z10_kind_b", v as 0 | 1 | 2 | 3)}
            options={[
              { v: 0, l: "—" },
              { v: 1, l: "1 · Leibliches Kind / Adoptivkind" },
              { v: 2, l: "2 · Pflegekind" },
              { v: 3, l: "3 · Enkel-/Stiefkind" },
            ]}
          />

          <TextRow
            zeile="11"
            label="Andere Person (Name, Geburtsdatum)"
            value={`${form.z11_andere_name}${form.z11_andere_geburt ? " · " + form.z11_andere_geburt : ""}`}
            onChange={(v) => {
              const parts = v.split(" · ");
              set("z11_andere_name", parts[0] ?? "");
              set("z11_andere_geburt", parts[1] ?? "");
            }}
            kz="04"
          />
          <DatePairRow
            zeile="12"
            label="Dauer Kindschaftsverhältnis (vom/bis)"
            valueA={form.z12_dauer_von}
            valueB={form.z12_dauer_bis}
            onA={(v) => set("z12_dauer_von", v)}
            onB={(v) => set("z12_dauer_bis", v)}
          />
          <TextRow
            zeile="12"
            label="Letzte bekannte Adresse"
            value={form.z12_letzte_adresse}
            onChange={(v) => set("z12_letzte_adresse", v)}
          />
          <SelectRow
            zeile="12"
            label="Art Kindschaftsverhältnis"
            value={form.z12_art}
            onChange={(v) => set("z12_art", v as 0 | 1 | 2)}
            options={[
              { v: 0, l: "—" },
              { v: 1, l: "1 · Leibliches/Adoptivkind" },
              { v: 2, l: "2 · Pflegekind" },
            ]}
          />
          <DatePairRow
            kz="37"
            zeile="13"
            label="Anderer Elternteil im Ausland (vom/bis)"
            valueA={form.z13_elternteil_ausl_von}
            valueB={form.z13_elternteil_ausl_bis}
            onA={(v) => set("z13_elternteil_ausl_von", v)}
            onB={(v) => set("z13_elternteil_ausl_bis", v)}
          />
          <DateRow
            kz="06"
            zeile="14"
            label="Tod des anderen Elternteils am"
            value={form.z14_tod_datum}
            onChange={(v) => set("z14_tod_datum", v)}
          />
          <JaNeinRow
            kz="05"
            zeile="15"
            label="Vater/anderer Elternteil amtlich nicht feststellbar"
            value={form.z15_vater_unbekannt}
            onChange={(v) => set("z15_vater_unbekannt", v)}
          />
        </BmfSection>

        {/* ============ Section 2 (conditional) ============ */}
        {istVolljaehrig && (
          <BmfSection
            title="2. Angaben für volljähriges Kind (Z. 16–25)"
            description="Kindergeldanspruch über 18 nur bei Ausbildung/Übergangszeit/Arbeitssuche/Behinderung · Erwerbstätigkeit > 20h/Woche nach Erstausbildung kann Anspruch ausschließen."
          >
            <DatePairRow
              kz="80"
              zeile="16"
              label="1. Berücksichtigungszeitraum (vom/bis)"
              valueA={form.z16_zeitraum1_von}
              valueB={form.z16_zeitraum1_bis}
              onA={(v) => set("z16_zeitraum1_von", v)}
              onB={(v) => set("z16_zeitraum1_bis", v)}
            />
            <TextRow
              zeile="17"
              label="Erläuterungen zum 1. Zeitraum"
              value={form.z17_erl1}
              onChange={(v) => set("z17_erl1", v)}
              placeholder="z. B. Studium BWL, Ausbildung Bäcker"
            />
            <DatePairRow
              kz="81"
              zeile="18"
              label="2. Berücksichtigungszeitraum (vom/bis)"
              valueA={form.z18_zeitraum2_von}
              valueB={form.z18_zeitraum2_bis}
              onA={(v) => set("z18_zeitraum2_von", v)}
              onB={(v) => set("z18_zeitraum2_bis", v)}
            />
            <TextRow
              zeile="19"
              label="Erläuterungen zum 2. Zeitraum"
              value={form.z19_erl2}
              onChange={(v) => set("z19_erl2", v)}
            />
            <DatePairRow
              kz="82"
              zeile="20"
              label="Arbeitsuchend gemeldet (vom/bis)"
              valueA={form.z20_arbeitsuchend_von}
              valueB={form.z20_arbeitsuchend_bis}
              onA={(v) => set("z20_arbeitsuchend_von", v)}
              onB={(v) => set("z20_arbeitsuchend_bis", v)}
            />
            <DatePairRow
              kz="83"
              zeile="21"
              label="Behinderung vor 25. Lj. (vom/bis)"
              valueA={form.z21_behinderung_von}
              valueB={form.z21_behinderung_bis}
              onA={(v) => set("z21_behinderung_von", v)}
              onB={(v) => set("z21_behinderung_bis", v)}
            />
            <JaNeinRow
              zeile="22"
              label="Erstausbildung/Erststudium bereits abgeschlossen"
              value={form.z22_erstausbildung_abgeschlossen}
              onChange={(v) => set("z22_erstausbildung_abgeschlossen", v)}
            />
            <JaNeinRow
              zeile="23"
              label="Falls Z. 22 Ja: Kind war erwerbstätig"
              value={form.z23_erwerbstaetig}
              onChange={(v) => set("z23_erwerbstaetig", v)}
            />
            <JaNeinRow
              kz="84"
              zeile="24"
              label="Minijob (§§ 8, 8a SGB IV)"
              value={form.z24_minijob}
              onChange={(v) => set("z24_minijob", v)}
            />
            <DatePairRow
              zeile="24"
              label="Minijob Zeitraum"
              valueA={form.z24_mj_von}
              valueB={form.z24_mj_bis}
              onA={(v) => set("z24_mj_von", v)}
              onB={(v) => set("z24_mj_bis", v)}
            />
            <BmfInputRow
              kz=""
              label="Minijob wöchentliche Stunden"
              hint="Z. 24 · > 20h/Woche kritisch"
              value={form.z24_mj_wochenstunden}
              onChange={(v) => set("z24_mj_wochenstunden", v)}
              step={0.5}
            />
            <JaNeinRow
              zeile="25"
              label="Andere Erwerbstätigkeit"
              value={form.z25_andere_erwerb}
              onChange={(v) => set("z25_andere_erwerb", v)}
            />
            <DatePairRow
              zeile="25"
              label="Erwerbstätigkeit Zeitraum"
              valueA={form.z25_erwerb_von}
              valueB={form.z25_erwerb_bis}
              onA={(v) => set("z25_erwerb_von", v)}
              onB={(v) => set("z25_erwerb_bis", v)}
            />
            <BmfInputRow
              kz=""
              label="Wöchentliche Stunden"
              hint="Z. 25 · > 20h/Woche kritisch"
              value={form.z25_erwerb_stunden}
              onChange={(v) => set("z25_erwerb_stunden", v)}
              step={0.5}
            />
          </BmfSection>
        )}

        {/* ============ Section 3 ============ */}
        <BmfSection title="3. Riester-Kinderzulage (Z. 26)">
          <SelectRow
            kz="501"
            zeile="26"
            label="Anspruch auf Kinderzulage"
            value={form.z26_kinderzulage}
            onChange={(v) => set("z26_kinderzulage", v as 0 | 1 | 2 | 3 | 4)}
            options={[
              { v: 0, l: "—" },
              { v: 1, l: "1 · Person A" },
              { v: 2, l: "2 · Person B" },
              { v: 3, l: "3 · andere Person" },
              { v: 4, l: "4 · keine Person" },
            ]}
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection
          title="4. KV/PV des Kindes (Z. 27–38)"
          description="Als Sonderausgaben absetzbar, wenn Eltern sie wirtschaftlich getragen haben (Unterhaltspflicht)."
        >
          <div
            className="bmf-form__row"
            style={{ background: "#eef1f6", fontStyle: "italic" }}
          >
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div className="bmf-form__label" style={{ color: "#15233d" }}>
              Aufwendungen von mir/uns als Versicherungsnehmer (Z. 27–30)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <BmfInputRow
            kz="66"
            label="KV Basisabsicherung Kind"
            hint="Z. 27"
            value={form.z27_vn_kv}
            onChange={(v) => set("z27_vn_kv", v)}
          />
          <BmfInputRow
            kz="67"
            label="PV sozial/privat Pflicht"
            hint="Z. 28"
            value={form.z28_vn_pv}
            onChange={(v) => set("z28_vn_pv", v)}
          />
          <BmfInputRow
            kz="68"
            label="Erstattete Beiträge (Z. 27/28)"
            hint="Z. 29"
            value={form.z29_vn_erstattet}
            onChange={(v) => set("z29_vn_erstattet", v)}
          />
          <BmfInputRow
            kz="69"
            label="Wahlleistungen / Zusatz"
            hint="Z. 30 · abzgl. Erstattungen"
            value={form.z30_vn_zusatz}
            onChange={(v) => set("z30_vn_zusatz", v)}
          />

          <div
            className="bmf-form__row"
            style={{ background: "#eef1f6", fontStyle: "italic" }}
          >
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div className="bmf-form__label" style={{ color: "#15233d" }}>
              Aufwendungen vom Kind als Versicherungsnehmer (Z. 31–36)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <BmfInputRow
            kz="70"
            label="KV Basisabsicherung"
            hint="Z. 31"
            value={form.z31_kind_kv}
            onChange={(v) => set("z31_kind_kv", v)}
          />
          <BmfInputRow
            kz="71"
            label="davon mit Krankengeld-Anspruch"
            hint="Z. 32"
            value={form.z32_kind_kv_mit_krankengeld}
            onChange={(v) => set("z32_kind_kv_mit_krankengeld", v)}
          />
          <BmfInputRow
            kz="72"
            label="PV sozial/privat Pflicht"
            hint="Z. 33"
            value={form.z33_kind_pv}
            onChange={(v) => set("z33_kind_pv", v)}
          />
          <BmfInputRow
            kz="73"
            label="Erstattete Beiträge"
            hint="Z. 34"
            value={form.z34_kind_erstattet}
            onChange={(v) => set("z34_kind_erstattet", v)}
          />
          <BmfInputRow
            kz="74"
            label="davon mit Krankengeld-Anspruch"
            hint="Z. 35"
            value={form.z35_kind_erst_mit_kg}
            onChange={(v) => set("z35_kind_erst_mit_kg", v)}
          />
          <BmfInputRow
            kz="75"
            label="Zuschuss Dritter (z. B. § 13a BAföG)"
            hint="Z. 36"
            value={form.z36_kind_zuschuss}
            onChange={(v) => set("z36_kind_zuschuss", v)}
          />

          <div
            className="bmf-form__row"
            style={{ background: "#eef1f6", fontStyle: "italic" }}
          >
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div className="bmf-form__label" style={{ color: "#15233d" }}>
              Ausländische KV/PV (Z. 37–38)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <BmfInputRow
            kz="89"
            label="Ausländische KV/PV vergleichbar (Basis)"
            hint="Z. 37 · abzgl. Zuschüsse/Erstattungen"
            value={form.z37_ausl_kv_pv}
            onChange={(v) => set("z37_ausl_kv_pv", v)}
          />
          <BmfInputRow
            kz="90"
            label="davon mit Krankengeld-Anspruch"
            hint="Z. 38"
            value={form.z38_ausl_mit_kg}
            onChange={(v) => set("z38_ausl_mit_kg", v)}
          />
          <BmfRow
            kz=""
            label="KV/PV-Netto Kind gesamt (Info · grobe Addition)"
            value={kvpvKindNetto}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection
          title="5. Kinderfreibetrag-Übertragung (Z. 39–44)"
          description={`Kinderfreibetrag 2025: ${euro.format(kifbInfo.halbJeElternteil)} je Elternteil (voll ${euro.format(kifbInfo.voll)}). Voll beanspruchbar bei Unterhaltspflichtverletzung des anderen Elternteils (< 75 %).`}
        >
          <JaNeinRow
            kz="36"
            zeile="39"
            label="Voller Kinderfreibetrag beantragt (anderer Elternteil < 75 % Unterhalt)"
            value={form.z39_voller_kifb}
            onChange={(v) => set("z39_voller_kifb", v)}
          />
          <DatePairRow
            kz="38"
            zeile="40"
            label="Unterhaltsvorschussgesetz-Leistungen gezahlt"
            valueA={form.z40_unterhaltsvorschuss_von}
            valueB={form.z40_unterhaltsvorschuss_bis}
            onA={(v) => set("z40_unterhaltsvorschuss_von", v)}
            onB={(v) => set("z40_unterhaltsvorschuss_bis", v)}
          />
          <JaNeinRow
            kz="39"
            zeile="41"
            label="Voller BEA-Freibetrag (Kind bei anderem Elternteil nicht gemeldet)"
            value={form.z41_voller_bea}
            onChange={(v) => set("z41_voller_bea", v)}
          />
          <DatePairRow
            kz="43"
            zeile="41"
            label="Zeitraum"
            valueA={form.z41_von}
            valueB={form.z41_bis}
            onA={(v) => set("z41_von", v)}
            onB={(v) => set("z41_bis", v)}
          />
          <JaNeinRow
            kz="76"
            zeile="42"
            label="Übertragung auf Stief-/Großelternteil (Haushaltsaufnahme)"
            value={form.z42_uebertragung_stief_gross}
            onChange={(v) => set("z42_uebertragung_stief_gross", v)}
          />
          <DatePairRow
            kz="77"
            zeile="42"
            label="Zeitraum Haushalt/Unterhalt"
            valueA={form.z42_von}
            valueB={form.z42_bis}
            onA={(v) => set("z42_von", v)}
            onB={(v) => set("z42_bis", v)}
          />
          <SelectRow
            kz="41"
            zeile="43"
            label="Zustimmung zur Übertragung"
            value={form.z43_zustimmung}
            onChange={(v) => set("z43_zustimmung", v as 0 | 1 | 2)}
            options={[
              { v: 0, l: "—" },
              { v: 1, l: "1 · Zustimmung eines Elternteils" },
              { v: 2, l: "2 · Zustimmung beider Elternteile" },
            ]}
          />
          <JaNeinRow
            kz="40"
            zeile="44"
            label="Übertragung laut Anlage K an Stief-/Großelternteil"
            value={form.z44_uebertragung_an_stief}
            onChange={(v) => set("z44_uebertragung_an_stief", v)}
          />
        </BmfSection>

        {/* ============ Section 6 ============ */}
        <BmfSection
          title="6. Entlastungsbetrag Alleinerziehende (Z. 45–51)"
          description={`§ 24b EStG: ${euro.format(ENTLASTUNGSBETRAG_ALLEIN)} +  240 € pro weiterem Kind. Setzt voraus: Kind im Haushalt gemeldet, Kindergeld, keine weitere volljährige Person im Haushalt.`}
        >
          <DatePairRow
            kz="42"
            zeile="45"
            label="Kind in gemeinsamer Wohnung gemeldet (vom/bis)"
            valueA={form.z45_gemeldet_von}
            valueB={form.z45_gemeldet_bis}
            onA={(v) => set("z45_gemeldet_von", v)}
            onB={(v) => set("z45_gemeldet_bis", v)}
          />
          <DatePairRow
            kz="44"
            zeile="46"
            label="Kindergeld ausgezahlt (vom/bis)"
            valueA={form.z46_kindergeld_von}
            valueB={form.z46_kindergeld_bis}
            onA={(v) => set("z46_kindergeld_von", v)}
            onB={(v) => set("z46_kindergeld_bis", v)}
          />
          <JaNeinRow
            kz="46"
            zeile="47"
            label="Weitere volljährige Person im Haushalt gemeldet (ohne KG)"
            value={form.z47_weitere_volljaehrig}
            onChange={(v) => set("z47_weitere_volljaehrig", v)}
          />
          <DatePairRow
            kz="47"
            zeile="47"
            label="Zeitraum"
            valueA={form.z47_zeitraum_von}
            valueB={form.z47_zeitraum_bis}
            onA={(v) => set("z47_zeitraum_von", v)}
            onB={(v) => set("z47_zeitraum_bis", v)}
          />
          <JaNeinRow
            kz="49"
            zeile="48"
            label="Haushaltsgemeinschaft mit weiterer volljähriger Person"
            value={form.z48_haushaltsgemeinschaft}
            onChange={(v) => set("z48_haushaltsgemeinschaft", v)}
          />
          <DatePairRow
            kz="50"
            zeile="48"
            label="Zeitraum"
            valueA={form.z48_zeitraum_von}
            valueB={form.z48_zeitraum_bis}
            onA={(v) => set("z48_zeitraum_von", v)}
            onB={(v) => set("z48_zeitraum_bis", v)}
          />
          <TextRow
            zeile="49"
            label="Name, Vorname der weiteren Person(en)"
            value={form.z49_person_name}
            onChange={(v) => set("z49_person_name", v)}
          />
          <TextRow
            zeile="50"
            label="Verwandtschaft / Beschäftigung / Tätigkeit"
            value={form.z50_verwandtschaft_taetigkeit}
            onChange={(v) => set("z50_verwandtschaft_taetigkeit", v)}
          />
          <SelectRow
            zeile="51"
            label="Antrag Entlastungsbetrag (im Jahr Eheschließung/Trennung/Tod)"
            value={form.z51_alleinerziehend_fuer}
            onChange={(v) => set("z51_alleinerziehend_fuer", v as 0 | 1 | 2)}
            options={[
              { v: 0, l: "—" },
              { v: 1, l: "1 · Person A" },
              { v: 2, l: "2 · Person B" },
            ]}
          />
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection
          title="7. Sonderbedarf bei auswärtiger Unterbringung (Z. 52–55)"
          description="§ 33a Abs. 2 EStG: 1.200 €/Jahr (ab 2023) Freibetrag für volljähriges Kind in Berufsausbildung mit auswärtiger Unterbringung."
        >
          <DatePairRow
            kz="85"
            zeile="52"
            label="1. Auswärtiger Zeitraum"
            valueA={form.z52_auswaert1_von}
            valueB={form.z52_auswaert1_bis}
            onA={(v) => set("z52_auswaert1_von", v)}
            onB={(v) => set("z52_auswaert1_bis", v)}
          />
          <DatePairRow
            kz="86"
            zeile="52"
            label="2. Auswärtiger Zeitraum"
            valueA={form.z52_auswaert2_von}
            valueB={form.z52_auswaert2_bis}
            onA={(v) => set("z52_auswaert2_von", v)}
            onB={(v) => set("z52_auswaert2_bis", v)}
          />
          <TextRow
            zeile="53"
            label="Anschrift(en) · ggf. Staat(en)"
            value={form.z53_anschrift}
            onChange={(v) => set("z53_anschrift", v)}
          />
          <JaNeinRow
            kz="87"
            zeile="54"
            label="Auswärtige Unterbringung im Ausland"
            value={form.z54_ausland}
            onChange={(v) => set("z54_ausland", v)}
          />
          <PercentRow
            kz="88"
            zeile="55"
            label="Anteil bei nicht zusammen veranlagten Eltern (%)"
            value={form.z55_anteil_pct}
            onChange={(v) => set("z55_anteil_pct", v)}
          />
        </BmfSection>

        {/* ============ Section 8 ============ */}
        <BmfSection
          title="8. Schulgeld (Z. 56–58)"
          description="§ 10 Abs. 1 Nr. 9 EStG: 30 % des Schulgelds, max. 5.000 €/Kind/Jahr · nur ohne Verpflegungs-/Unterbringungskosten."
        >
          <TextRow
            kz="24"
            zeile="56"
            label="Schule / Träger"
            value={form.z56_schule}
            onChange={(v) => set("z56_schule", v)}
          />
          <BmfInputRow
            kz=""
            label="Berücksichtigungsfähige Gesamtaufwendungen der Eltern"
            hint="Z. 56"
            value={form.z56_gesamt}
            onChange={(v) => set("z56_gesamt", v)}
          />
          <BmfInputRow
            kz="56"
            label="Eigener Anteil (nicht zusammen veranlagt)"
            hint="Z. 57"
            value={form.z57_eigener_anteil}
            onChange={(v) => set("z57_eigener_anteil", v)}
          />
          <PercentRow
            kz="57"
            zeile="58"
            label="Abweichender Anteil (%)"
            value={form.z58_anteil_pct}
            onChange={(v) => set("z58_anteil_pct", v)}
          />
          <BmfRow
            kz=""
            label={`Info · 30 % × ${euro.format(form.z56_gesamt)} = ${euro.format(form.z56_gesamt * 0.3)} (gedeckelt 5.000 €)`}
            value={Math.min(form.z56_gesamt * 0.3, 5000)}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 9 ============ */}
        <BmfSection
          title="9. Behinderten-/Hinterbliebenen-Pauschbetrag des Kindes (Z. 59–66)"
          description="Pauschbeträge können von den Eltern übernommen werden, wenn das Kind sie nicht selbst in Anspruch nimmt (§ 33b Abs. 5 EStG)."
        >
          <TextRow
            kz="25"
            zeile="59"
            label="Ausweis / Bescheid / Bescheinigung"
            value={form.z59_ausweis}
            onChange={(v) => set("z59_ausweis", v)}
          />
          <DatePairRow
            zeile="59"
            label="Gültig von/bis"
            valueA={form.z59_gueltig_von}
            valueB={form.z59_gueltig_bis}
            onA={(v) => set("z59_gueltig_von", v)}
            onB={(v) => set("z59_gueltig_bis", v)}
          />
          <JaNeinRow
            zeile="59"
            label="Unbefristet gültig"
            value={form.z59_unbefristet}
            onChange={(v) => set("z59_unbefristet", v)}
          />
          <BmfInputRow
            kz=""
            label="Grad der Behinderung (GdB)"
            hint="Z. 59"
            value={form.z59_gdb}
            onChange={(v) => set("z59_gdb", v)}
            step={10}
          />
          <JaNeinRow
            zeile="60"
            label={`Merkzeichen "G" oder "aG"`}
            value={form.z60_merkzeichen_g_aG}
            onChange={(v) => set("z60_merkzeichen_g_aG", v)}
          />
          <JaNeinRow
            kz="55"
            zeile="61"
            label={`Hilflos/Blind/TBl/"H" oder PG 4/5`}
            value={form.z61_hilflos_bl}
            onChange={(v) => set("z61_hilflos_bl", v)}
          />
          <JaNeinRow
            kz="26"
            zeile="62"
            label="Übertragung Hinterbliebenen-Pauschbetrag beantragt"
            value={form.z62_hinterbliebenen}
            onChange={(v) => set("z62_hinterbliebenen", v)}
          />
          <PercentRow
            kz="28"
            zeile="63"
            label="Anteil Pauschbetrag bei nicht zusammen veranlagten Eltern (%)"
            value={form.z63_pauschbetrag_anteil}
            onChange={(v) => set("z63_pauschbetrag_anteil", v)}
          />
          <JaNeinRow
            kz="91"
            zeile="64"
            label={`Fahrt-P. 900 €: GdB ≥ 80 oder ≥ 70 + "G"`}
            value={form.z64_fahrt_70_80_g}
            onChange={(v) => set("z64_fahrt_70_80_g", v)}
          />
          <JaNeinRow
            kz="92"
            zeile="65"
            label={`Fahrt-P. 4.500 €: "aG"/"Bl"/"TBl"/"H" oder PG 4/5`}
            value={form.z65_fahrt_aG_bl_h}
            onChange={(v) => set("z65_fahrt_aG_bl_h", v)}
          />
          <PercentRow
            kz="45"
            zeile="66"
            label="Anteil Fahrtkostenpauschale (%)"
            value={form.z66_fahrt_anteil}
            onChange={(v) => set("z66_fahrt_anteil", v)}
          />
        </BmfSection>

        {/* ============ Section 10 ============ */}
        <BmfSection
          title="10. Kinderbetreuungskosten (Z. 67–73)"
          description="§ 10 Abs. 1 Nr. 5 EStG: 2/3 der Aufwendungen, max. 4.000 €/Kind/Jahr · nur für Kinder unter 14 Jahren (bzw. ohne Altersgrenze bei Behinderung)."
        >
          <TextRow
            kz="51"
            zeile="67"
            label="Art der Dienstleistung / Name / Anschrift des Dienstleisters"
            value={form.z67_dienstleister}
            onChange={(v) => set("z67_dienstleister", v)}
          />
          <DatePairRow
            zeile="67"
            label="Leistungszeitraum"
            valueA={form.z67_von}
            valueB={form.z67_bis}
            onA={(v) => set("z67_von", v)}
            onB={(v) => set("z67_bis", v)}
          />
          <BmfInputRow
            kz=""
            label="Berücksichtigungsfähige Gesamtaufwendungen"
            hint="Z. 67"
            value={form.z67_gesamt}
            onChange={(v) => set("z67_gesamt", v)}
          />
          <DatePairRow
            kz="79"
            zeile="68"
            label="Steuerfreier Ersatz / Erstattungen Zeitraum"
            valueA={form.z68_ersatz_von}
            valueB={form.z68_ersatz_bis}
            onA={(v) => set("z68_ersatz_von", v)}
            onB={(v) => set("z68_ersatz_bis", v)}
          />
          <BmfInputRow
            kz=""
            label="Betrag Ersatz/Erstattungen"
            hint="Z. 68"
            value={form.z68_betrag}
            onChange={(v) => set("z68_betrag", v)}
          />
          <DatePairRow
            zeile="69"
            label="Kind in unserem Haushalt"
            valueA={form.z69_unser_haushalt_von}
            valueB={form.z69_unser_haushalt_bis}
            onA={(v) => set("z69_unser_haushalt_von", v)}
            onB={(v) => set("z69_unser_haushalt_bis", v)}
          />
          <DatePairRow
            zeile="70"
            label="Kind in meinem Haushalt"
            valueA={form.z70_mein_haushalt_von}
            valueB={form.z70_mein_haushalt_bis}
            onA={(v) => set("z70_mein_haushalt_von", v)}
            onB={(v) => set("z70_mein_haushalt_bis", v)}
          />
          <DatePairRow
            zeile="71"
            label="Kind im Haushalt des anderen Elternteils"
            valueA={form.z71_andere_von}
            valueB={form.z71_andere_bis}
            onA={(v) => set("z71_andere_von", v)}
            onB={(v) => set("z71_andere_bis", v)}
          />
          <DatePairRow
            zeile="71"
            label="Kein gemeinsamer Haushalt der Eltern"
            valueA={form.z71_kein_gemeinsamer_von}
            valueB={form.z71_kein_gemeinsamer_bis}
            onA={(v) => set("z71_kein_gemeinsamer_von", v)}
            onB={(v) => set("z71_kein_gemeinsamer_bis", v)}
          />
          <DatePairRow
            zeile="72"
            label="Eigene KBK Zeitraum (nicht zus. veranlagt)"
            valueA={form.z72_eigene_von}
            valueB={form.z72_eigene_bis}
            onA={(v) => set("z72_eigene_von", v)}
            onB={(v) => set("z72_eigene_bis", v)}
          />
          <BmfInputRow
            kz=""
            label="Eigene KBK Betrag"
            hint="Z. 72"
            value={form.z72_eigene_betrag}
            onChange={(v) => set("z72_eigene_betrag", v)}
          />
          <PercentRow
            zeile="73"
            label="Abweichender Anteil KBK-Höchstbetrag (%)"
            value={form.z73_anteil_pct}
            onChange={(v) => set("z73_anteil_pct", v)}
          />
          <BmfRow
            kz=""
            label={`Info · 2/3 von ${euro.format(form.z67_gesamt - form.z68_betrag)} = ${euro.format(Math.max(0, (form.z67_gesamt - form.z68_betrag) * 2 / 3))} (gedeckelt 4.000 €)`}
            value={Math.min(
              Math.max(0, (form.z67_gesamt - form.z68_betrag) * (2 / 3)),
              4000
            )}
            subtotal
          />
        </BmfSection>

        <BmfSignatures left="Datum, Ort" right="Unterschrift(en)" />

        <BmfFootnotes>
          <p>
            <strong>Günstigerprüfung:</strong> Das Finanzamt vergleicht
            Kindergeld (250 €/Monat × 12 = {euro.format(3000)}) mit dem
            Steuervorteil aus Kinderfreibetrag + BEA ({" "}
            {euro.format(kifbInfo.voll)} voll) und gewährt den höheren Betrag.
            Bei Einzelveranlagung je Elternteil {euro.format(kifbInfo.halbJeElternteil)}.
          </p>
          <p>
            <strong>Volljähriges Kind:</strong> Kindergeld ab 18 nur bei
            Ausbildung, Übergangszeit {"≤"} 4 Monate, Arbeitslosigkeit oder
            Behinderung · nach Erstausbildung: Erwerbstätigkeit ≤ 20h/Woche ·
            bis max. 25. Lj. (außer Behinderung).
          </p>
          <p>
            <strong>Kinderbetreuungskosten § 10 Abs. 1 Nr. 5:</strong> 2/3
            absetzbar, max. 4.000 €/Kind/Jahr · nur unbare Zahlung + Rechnung
            · nur bis 14. Lj. (außer Behinderung).
          </p>
          <p>
            <strong>Schulgeld § 10 Abs. 1 Nr. 9:</strong> 30 % (max. 5.000 €/
            Kind/Jahr) der Kosten einer anerkannten Privatschule · ohne
            Kost/Logis/Betreuung.
          </p>
          <p>
            <strong>Sonderbedarf § 33a Abs. 2:</strong> 1.200 €/Jahr (ab 2023)
            pro volljährigem Kind in Berufsausbildung mit auswärtiger Unterbringung.
          </p>
          <p>
            <strong>Entlastungsbetrag § 24b:</strong> {euro.format(ENTLASTUNGSBETRAG_ALLEIN)} + 240 €
            pro weiterem Kind · setzt voraus: Kind im Haushalt, Kindergeld, KEINE weitere volljährige Person
            im Haushalt (Ausnahme: KG-berechtigtes Kind).
          </p>
          <p>
            <strong>NICHT automatisch berechnet:</strong> Günstigerprüfung
            KiFb/BEA vs. Kindergeld, Unterhaltspflicht-Quote (75 %-Grenze),
            Behinderten-Pauschbetrag-Übertragung mit Quote, Schulgeld-Deckel
            bei Anteilsaufteilung, zeitanteilige Freibeträge bei unterjähriger
            Kindereigenschaft, Mindestunterhalt-Berechnung.
          </p>
          <p>
            <strong>Cross-Refs:</strong> Riester Kinderzulage Z. 26 → Anlage AV
            · Pauschbetrag-Übertragung → Anlage aGB · Unterhalt volljährig ≥
            25 Lj → Anlage Unterhalt.
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Übermittlung
            erfolgt elektronisch über ELSTER. Pro Kind ein eigenes Formular.
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
  kz?: string;
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={260}>
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
  kz?: string;
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={180}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={textInputStyle}
      />
    </WideRow>
  );
}

function DatePairRow({
  kz,
  zeile,
  label,
  valueA,
  valueB,
  onA,
  onB,
}: {
  kz?: string;
  zeile: string;
  label: string;
  valueA: string;
  valueB: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
}) {
  return (
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={280}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}
      >
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

function SelectRow({
  kz,
  zeile,
  label,
  value,
  onChange,
  options,
}: {
  kz?: string;
  zeile: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { v: number; l: string }[];
}) {
  return (
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={220}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={selectStyle}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
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
  kz?: string;
  zeile: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={140}>
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
