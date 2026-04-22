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
type Pflegegrad = 0 | 2 | 3 | 4;

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// § 33b Abs. 3 EStG — Behinderten-Pauschbeträge nach GdB (ab 2021)
const BEHINDERTEN_PAUSCHBETRAG: Record<number, number> = {
  20: 384,
  30: 620,
  40: 860,
  50: 1140,
  60: 1440,
  70: 1780,
  80: 2120,
  90: 2460,
  100: 2840,
};
const HILFLOS_BL_PAUSCH = 7400; // "H"/"Bl"/"TBl" oder Pflegegrad 4/5
const HINTERBLIEBENEN_PAUSCH = 370;

// § 33 Abs. 2a EStG — Behinderungsbed. Fahrtkosten-Pauschale
const FAHRT_PAUSCH_STANDARD = 900; // GdB ≥ 80 oder GdB ≥ 70 + "G"
const FAHRT_PAUSCH_ERHOEHT = 4500; // "aG"/"Bl"/"TBl"/"H" oder Pflegegrad 4/5

// § 33b Abs. 6 EStG — Pflege-Pauschbeträge (Pflegegrad)
const PFLEGE_PAUSCH: Record<number, number> = {
  2: 600,
  3: 1100,
  4: 1800, // = auch 5 und "H"
};

function behindertenPauschbetrag(gdb: number, hilflosBl: boolean): number {
  if (hilflosBl) return HILFLOS_BL_PAUSCH;
  // auf nächste Stufe abrunden (10er)
  const rounded = Math.floor(gdb / 10) * 10;
  return BEHINDERTEN_PAUSCHBETRAG[rounded] ?? 0;
}

// ---------- State ------------------------------------------------------

type AnlageAGB = {
  zusammenveranlagung: boolean;

  // Section 1
  a_ausweis: string;
  a_gueltig_von: string;
  a_gueltig_bis: string;
  a_unbefristet: JaNein;
  a_gdb: number;
  a_merkzeichen_g_aG: JaNein;
  a_hilflos_bl: JaNein;

  b_ausweis: string;
  b_gueltig_von: string;
  b_gueltig_bis: string;
  b_unbefristet: JaNein;
  b_gdb: number;
  b_merkzeichen_g_aG: JaNein;
  b_hilflos_bl: JaNein;

  // Section 2
  z10_hinterbliebenen_a: JaNein;
  z10_hinterbliebenen_b: JaNein;

  // Section 3
  z11_person_info: string;
  z13_pflegebed_idnr: string;
  z14_pflegebed_inland: JaNein;
  z15_pflegegrad: Pflegegrad;
  z16_pflegebed_merkzeichen_h: JaNein;
  z17_pflegende: 0 | 1 | 2 | 3; // 0 = keiner gewählt, 1 = A, 2 = B, 3 = beide
  z18_anzahl_weitere: number;
  z19_weitere_personen: string;

  // Section 4
  z21_ge_70_80_mit_g_a: JaNein;
  z21_ge_70_80_mit_g_b: JaNein;
  z22_aG_bl_tbl_h_a: JaNein;
  z22_aG_bl_tbl_h_b: JaNein;

  // Section 5
  z23_krank_art: string;
  z24_krank_aufw: number;
  z25_krank_erstattung: number;

  // Section 6
  z26_pflege_art: string;
  z27_pflege_aufw: number;
  z28_pflege_erstattung: number;

  // Section 7
  z29_behinderung_art: string;
  z30_behinderung_aufw: number;
  z31_behinderung_erstattung: number;

  // Section 8
  z32_bestattung_art: string;
  z33_bestattung_aufw: number;
  z34_bestattung_erstattung: number;
  z35_nachlass: number;

  // Section 9
  z36_sonstige_art: string;
  z37_sonstige_aufw: number;
  z38_sonstige_erstattung: number;

  // Section 10
  z39_minijob: number;
  z40_haushaltsnah: number;
  z41_handwerker: number;
};

const DEFAULT: AnlageAGB = {
  zusammenveranlagung: false,
  a_ausweis: "",
  a_gueltig_von: "",
  a_gueltig_bis: "",
  a_unbefristet: "",
  a_gdb: 0,
  a_merkzeichen_g_aG: "",
  a_hilflos_bl: "",
  b_ausweis: "",
  b_gueltig_von: "",
  b_gueltig_bis: "",
  b_unbefristet: "",
  b_gdb: 0,
  b_merkzeichen_g_aG: "",
  b_hilflos_bl: "",
  z10_hinterbliebenen_a: "",
  z10_hinterbliebenen_b: "",
  z11_person_info: "",
  z13_pflegebed_idnr: "",
  z14_pflegebed_inland: "",
  z15_pflegegrad: 0,
  z16_pflegebed_merkzeichen_h: "",
  z17_pflegende: 0,
  z18_anzahl_weitere: 0,
  z19_weitere_personen: "",
  z21_ge_70_80_mit_g_a: "",
  z21_ge_70_80_mit_g_b: "",
  z22_aG_bl_tbl_h_a: "",
  z22_aG_bl_tbl_h_b: "",
  z23_krank_art: "",
  z24_krank_aufw: 0,
  z25_krank_erstattung: 0,
  z26_pflege_art: "",
  z27_pflege_aufw: 0,
  z28_pflege_erstattung: 0,
  z29_behinderung_art: "",
  z30_behinderung_aufw: 0,
  z31_behinderung_erstattung: 0,
  z32_bestattung_art: "",
  z33_bestattung_aufw: 0,
  z34_bestattung_erstattung: 0,
  z35_nachlass: 0,
  z36_sonstige_art: "",
  z37_sonstige_aufw: 0,
  z38_sonstige_erstattung: 0,
  z39_minijob: 0,
  z40_haushaltsnah: 0,
  z41_handwerker: 0,
};

const FORM_ID = "anlage-agb";

function loadForm(mandantId: string | null, jahr: number): AnlageAGB {
  const parsed = readEstForm<Partial<AnlageAGB>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Main page --------------------------------------------------

export default function AnlageAussergewoehnlicheBelastungenPage() {
  return (
    <MandantRequiredGuard>
      <AnlageAussergewoehnlicheBelastungenPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageAussergewoehnlicheBelastungenPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageAGB>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageAGB>(key: K, value: AnlageAGB[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // --- Auto-calcs ---------------------------------------------------
  const behindPauschA = behindertenPauschbetrag(
    form.a_gdb,
    form.a_hilflos_bl === "ja"
  );
  const behindPauschB = form.zusammenveranlagung
    ? behindertenPauschbetrag(form.b_gdb, form.b_hilflos_bl === "ja")
    : 0;

  const hinterbliebenenA =
    form.z10_hinterbliebenen_a === "ja" ? HINTERBLIEBENEN_PAUSCH : 0;
  const hinterbliebenenB =
    form.zusammenveranlagung && form.z10_hinterbliebenen_b === "ja"
      ? HINTERBLIEBENEN_PAUSCH
      : 0;

  // Pflege-Pauschbetrag: basiert auf Pflegegrad und Merkzeichen H der pflegeb. Person
  // Wenn "H" gesetzt → 1.800 €; sonst nach Pflegegrad
  const pflegePauschGrundbetrag = useMemo(() => {
    if (form.z16_pflegebed_merkzeichen_h === "ja") return PFLEGE_PAUSCH[4];
    if (form.z15_pflegegrad === 0) return 0;
    return PFLEGE_PAUSCH[form.z15_pflegegrad] ?? 0;
  }, [form.z15_pflegegrad, form.z16_pflegebed_merkzeichen_h]);

  // Aufteilung auf Anzahl pflegender Personen (§ 33b Abs. 6 Satz 8 EStG)
  const pflegendeGesamt =
    (form.z17_pflegende === 3 ? 2 : form.z17_pflegende > 0 ? 1 : 0) +
    form.z18_anzahl_weitere;
  const pflegePauschJePerson =
    pflegendeGesamt > 0 ? pflegePauschGrundbetrag / pflegendeGesamt : 0;
  // Anteil für eigene Ehegatten
  const pflegePauschEigen =
    form.z17_pflegende === 3
      ? pflegePauschJePerson * 2
      : form.z17_pflegende > 0
        ? pflegePauschJePerson
        : 0;

  // Fahrtkosten-Pauschale (§ 33 Abs. 2a)
  function fahrtPausch(
    ge70_80_g: JaNein,
    aG_bl_tbl: JaNein,
    pflegegradHilflos: boolean
  ): number {
    if (aG_bl_tbl === "ja" || pflegegradHilflos) return FAHRT_PAUSCH_ERHOEHT;
    if (ge70_80_g === "ja") return FAHRT_PAUSCH_STANDARD;
    return 0;
  }
  const fahrtA = fahrtPausch(
    form.z21_ge_70_80_mit_g_a,
    form.z22_aG_bl_tbl_h_a,
    form.a_hilflos_bl === "ja"
  );
  const fahrtB = form.zusammenveranlagung
    ? fahrtPausch(
        form.z21_ge_70_80_mit_g_b,
        form.z22_aG_bl_tbl_h_b,
        form.b_hilflos_bl === "ja"
      )
    : 0;

  // Netto-Aufwendungen (abzgl. Erstattungen)
  const netto_krank = Math.max(0, form.z24_krank_aufw - form.z25_krank_erstattung);
  const netto_pflege = Math.max(
    0,
    form.z27_pflege_aufw - form.z28_pflege_erstattung
  );
  const netto_behinderung = Math.max(
    0,
    form.z30_behinderung_aufw - form.z31_behinderung_erstattung
  );
  const netto_bestattung = Math.max(
    0,
    form.z33_bestattung_aufw - form.z34_bestattung_erstattung - form.z35_nachlass
  );
  const netto_sonstige = Math.max(
    0,
    form.z37_sonstige_aufw - form.z38_sonstige_erstattung
  );

  const gesamt33 =
    netto_krank + netto_pflege + netto_behinderung + netto_bestattung + netto_sonstige;

  const pauschbetraegeSumme =
    behindPauschA +
    behindPauschB +
    hinterbliebenenA +
    hinterbliebenenB +
    pflegePauschEigen +
    fahrtA +
    fahrtB;

  function validate(): string[] {
    const warns: string[] = [];
    const idCheck = (id: string, field: string) => {
      if (id && !/^\d{11}$/.test(id)) {
        warns.push(`${field}: IdNr sollte 11-stellig sein.`);
      }
    };
    idCheck(form.z13_pflegebed_idnr, "Z. 13");

    if (form.a_gdb > 0 && form.a_gdb < 20) {
      warns.push("Z. 4: GdB < 20 führt nicht zum Behinderten-Pauschbetrag.");
    }
    if (form.a_gdb > 100) {
      warns.push("Z. 4: GdB > 100 unmöglich.");
    }
    if (form.b_gdb > 100) {
      warns.push("Z. 7: GdB > 100 unmöglich.");
    }
    if (
      form.z25_krank_erstattung > form.z24_krank_aufw &&
      form.z24_krank_aufw > 0
    ) {
      warns.push(
        "Z. 25 > Z. 24: Erstattungen übersteigen Krankheitskosten (Netto = 0)."
      );
    }
    if (
      form.z34_bestattung_erstattung + form.z35_nachlass > form.z33_bestattung_aufw &&
      form.z33_bestattung_aufw > 0
    ) {
      warns.push(
        "Z. 34+35 > Z. 33: Nachlass/Erstattung übersteigt Bestattungskosten (Netto = 0)."
      );
    }
    if (form.z17_pflegende === 0 && form.z15_pflegegrad > 0) {
      warns.push(
        "Z. 17: Pflegende Person wählen, um Pflege-Pauschbetrag zu erhalten."
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 9000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-agb"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-agb",
      summary: `Anlage aGB gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-agb",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        behindPauschA,
        behindPauschB,
        hinterbliebenenA,
        hinterbliebenenB,
        pflegePauschEigen,
        fahrtA,
        fahrtB,
        pauschbetraegeSumme,
        netto_krank,
        netto_pflege,
        netto_behinderung,
        netto_bestattung,
        netto_sonstige,
        gesamt33,
        form,
      },
    });
    toast.success("Anlage aGB gespeichert.");
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
          <h1>Anlage Außergewöhnliche Belastungen</h1>
          <p>
            §§ 33, 33a, 33b EStG · Behinderten-/Hinterbliebenen-/Pflege-
            Pauschbeträge + konkrete Belastungen · VZ {selectedYear}.
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
          Anlage aGB · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-agb" />

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
          <strong>Pauschbeträge 2025:</strong> Behinderten-P. gestaffelt nach
          GdB ({euro.format(384)}–{euro.format(2840)}) · Hilflos/Blind/TBl{" "}
          {euro.format(HILFLOS_BL_PAUSCH)} · Hinterbliebenen-P.{" "}
          {euro.format(HINTERBLIEBENEN_PAUSCH)} · Pflege-P. je nach Pflegegrad
          (600/1.100/1.800 €) · Fahrt-P. 900 / 4.500 €. Die zumutbare Belastung
          (§ 33 Abs. 3) wird im Bescheid vom Gesamtbetrag abgezogen — NICHT hier.
        </div>
      </aside>

      <BmfForm
        title="Anlage Außergewöhnliche Belastungen"
        subtitle={`§§ 33, 33a, 33b EStG · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Behinderten-Pauschbetrag (Z. 4–9)">
          <BehinderungsBlock
            title="Person A / Ehemann"
            zeilen={{ ausweis: "4", gehen: "5", hilflos: "6" }}
            kz={{
              ausweis: "100",
              gueltig: "101",
              unbefristet: "102",
              gdb: "105",
              g_aG: "104",
              hilflos: "103",
            }}
            data={{
              ausweis: form.a_ausweis,
              gueltig_von: form.a_gueltig_von,
              gueltig_bis: form.a_gueltig_bis,
              unbefristet: form.a_unbefristet,
              gdb: form.a_gdb,
              g_aG: form.a_merkzeichen_g_aG,
              hilflos: form.a_hilflos_bl,
            }}
            on={{
              ausweis: (v) => set("a_ausweis", v),
              gueltig_von: (v) => set("a_gueltig_von", v),
              gueltig_bis: (v) => set("a_gueltig_bis", v),
              unbefristet: (v) => set("a_unbefristet", v),
              gdb: (v) => set("a_gdb", v),
              g_aG: (v) => set("a_merkzeichen_g_aG", v),
              hilflos: (v) => set("a_hilflos_bl", v),
            }}
          />
          <BmfRow
            kz=""
            label={`Behinderten-Pauschbetrag Person A (Info · GdB ${form.a_gdb}${form.a_hilflos_bl === "ja" ? " + Hilflos/Bl" : ""})`}
            value={behindPauschA}
            subtotal
          />

          {zus && (
            <>
              <BehinderungsBlock
                title="Person B / Ehefrau"
                zeilen={{ ausweis: "7", gehen: "8", hilflos: "9" }}
                kz={{
                  ausweis: "150",
                  gueltig: "151",
                  unbefristet: "152",
                  gdb: "155",
                  g_aG: "154",
                  hilflos: "153",
                }}
                data={{
                  ausweis: form.b_ausweis,
                  gueltig_von: form.b_gueltig_von,
                  gueltig_bis: form.b_gueltig_bis,
                  unbefristet: form.b_unbefristet,
                  gdb: form.b_gdb,
                  g_aG: form.b_merkzeichen_g_aG,
                  hilflos: form.b_hilflos_bl,
                }}
                on={{
                  ausweis: (v) => set("b_ausweis", v),
                  gueltig_von: (v) => set("b_gueltig_von", v),
                  gueltig_bis: (v) => set("b_gueltig_bis", v),
                  unbefristet: (v) => set("b_unbefristet", v),
                  gdb: (v) => set("b_gdb", v),
                  g_aG: (v) => set("b_merkzeichen_g_aG", v),
                  hilflos: (v) => set("b_hilflos_bl", v),
                }}
              />
              <BmfRow
                kz=""
                label={`Behinderten-Pauschbetrag Person B (Info · GdB ${form.b_gdb}${form.b_hilflos_bl === "ja" ? " + Hilflos/Bl" : ""})`}
                value={behindPauschB}
                subtotal
              />
            </>
          )}
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Hinterbliebenen-Pauschbetrag (Z. 10)"
          description="370 € für Hinterbliebenenbezüge nach § 33b Abs. 4 EStG. Alleinige Witwen-/Witwerrente reicht NICHT."
        >
          <JaNeinRow
            kz="380"
            zeile="10"
            label={zus ? "Antrag Person A" : "Antrag"}
            value={form.z10_hinterbliebenen_a}
            onChange={(v) => set("z10_hinterbliebenen_a", v)}
          />
          {zus && (
            <JaNeinRow
              kz="381"
              zeile="10"
              label="Antrag Person B"
              value={form.z10_hinterbliebenen_b}
              onChange={(v) => set("z10_hinterbliebenen_b", v)}
            />
          )}
          <BmfRow
            kz=""
            label="Hinterbliebenen-Pauschbetrag (Info)"
            value={hinterbliebenenA + hinterbliebenenB}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection
          title="3. Pflege-Pauschbetrag (Z. 11–20)"
          description={`§ 33b Abs. 6 EStG · Pflegegrad 2 = 600 €, 3 = 1.100 €, 4/5 oder \u201EH\u201C = 1.800 €. Bei mehreren Pflegepersonen anteilig aufgeteilt.`}
        >
          <TextRow
            zeile="11"
            label="Name, Anschrift, Geburtsdatum, Verwandtschaft der pflegebedürftigen Person"
            value={form.z11_person_info}
            onChange={(v) => set("z11_person_info", v)}
          />
          <TextRow
            zeile="13"
            label="Identifikationsnummer"
            value={form.z13_pflegebed_idnr}
            onChange={(v) => set("z13_pflegebed_idnr", v)}
            placeholder="11-stellig"
            kz="202"
          />
          <JaNeinRow
            kz="204"
            zeile="14"
            label="Wohnsitz/gewöhnl. Aufenthalt im Inland (oder EU/EWR)"
            value={form.z14_pflegebed_inland}
            onChange={(v) => set("z14_pflegebed_inland", v)}
          />
          <PflegegradSelect
            zeile="15"
            label="Festgestellter Pflegegrad"
            value={form.z15_pflegegrad}
            onChange={(v) => set("z15_pflegegrad", v)}
          />
          <JaNeinRow
            kz="205"
            zeile="16"
            label={"Merkzeichen \u201EH\u201C festgestellt"}
            value={form.z16_pflegebed_merkzeichen_h}
            onChange={(v) => set("z16_pflegebed_merkzeichen_h", v)}
          />
          <WideRow kz="200" zeile="17" label="Pflege erfolgte durch" wide={220}>
            <select
              value={form.z17_pflegende}
              onChange={(e) =>
                set("z17_pflegende", Number(e.target.value) as 0 | 1 | 2 | 3)
              }
              style={selectStyle}
            >
              <option value={0}>—</option>
              <option value={1}>1 · Person A</option>
              <option value={2}>2 · Person B</option>
              <option value={3}>3 · Beide Ehegatten</option>
            </select>
          </WideRow>
          <BmfInputRow
            kz="201"
            label="Anzahl weiterer an der Pflege beteiligter Personen"
            hint="Z. 18 · bei keinen weiteren: 0"
            value={form.z18_anzahl_weitere}
            onChange={(v) => set("z18_anzahl_weitere", v)}
            step={1}
          />
          <TextRow
            zeile="19"
            label="Name / Anschrift / Geburtsdatum / Verwandtschaft weitere Pflegepersonen"
            value={form.z19_weitere_personen}
            onChange={(v) => set("z19_weitere_personen", v)}
          />
          <BmfRow
            kz=""
            label={`Pflege-Pauschbetrag Grundbetrag (Info · PG ${form.z15_pflegegrad || "–"}${form.z16_pflegebed_merkzeichen_h === "ja" ? " + H" : ""})`}
            value={pflegePauschGrundbetrag}
            subtotal
          />
          <BmfRow
            kz=""
            label={`davon für eigene Ehegatten (Info · bei ${pflegendeGesamt} Personen geteilt)`}
            value={pflegePauschEigen}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection
          title="4. Behinderungsbedingte Fahrtkostenpauschale (Z. 21–22)"
          description="§ 33 Abs. 2a EStG · GdB ≥ 80 oder 70 + G: 900 € · aG/Bl/TBl/H oder Pflegegrad 4/5: 4.500 €."
        >
          <JaNeinRow
            kz="250"
            zeile="21"
            label={zus ? "Person A: GdB ≥ 80 oder ≥ 70 + 'G'" : "GdB ≥ 80 oder ≥ 70 + 'G'"}
            value={form.z21_ge_70_80_mit_g_a}
            onChange={(v) => set("z21_ge_70_80_mit_g_a", v)}
          />
          {zus && (
            <JaNeinRow
              kz="251"
              zeile="21"
              label="Person B: GdB ≥ 80 oder ≥ 70 + 'G'"
              value={form.z21_ge_70_80_mit_g_b}
              onChange={(v) => set("z21_ge_70_80_mit_g_b", v)}
            />
          )}
          <JaNeinRow
            kz="252"
            zeile="22"
            label={zus ? "Person A: aG/Bl/TBl/H oder Pflegegrad 4/5" : "aG/Bl/TBl/H oder Pflegegrad 4/5"}
            value={form.z22_aG_bl_tbl_h_a}
            onChange={(v) => set("z22_aG_bl_tbl_h_a", v)}
          />
          {zus && (
            <JaNeinRow
              kz="253"
              zeile="22"
              label="Person B: aG/Bl/TBl/H oder Pflegegrad 4/5"
              value={form.z22_aG_bl_tbl_h_b}
              onChange={(v) => set("z22_aG_bl_tbl_h_b", v)}
            />
          )}
          <BmfRow
            kz=""
            label="Fahrtkostenpauschale gesamt (Info)"
            value={fahrtA + fahrtB}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection title="5. Krankheitskosten (Z. 23–25)">
          <TextRow
            zeile="23"
            label="Art der Aufwendungen"
            value={form.z23_krank_art}
            onChange={(v) => set("z23_krank_art", v)}
            placeholder="z. B. Zahnersatz, Sehhilfen, Medikamente, Kur"
          />
          <BmfInputRow
            kz="302"
            label="Summe der Aufwendungen"
            hint="Z. 24"
            value={form.z24_krank_aufw}
            onChange={(v) => set("z24_krank_aufw", v)}
          />
          <BmfInputRow
            kz="303"
            label="− Versicherungsleistungen / Beihilfen / Erstattungen"
            hint="Z. 25"
            value={form.z25_krank_erstattung}
            onChange={(v) => set("z25_krank_erstattung", v)}
          />
          <BmfRow
            kz=""
            label="Netto-Krankheitskosten (auto)"
            value={netto_krank}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 6 ============ */}
        <BmfSection
          title="6. Pflegekosten (Z. 26–28)"
          description="Inkl. Heimunterbringungskosten. Haushaltsersparnis wird gegengerechnet."
        >
          <TextRow
            zeile="26"
            label="Art der Aufwendungen"
            value={form.z26_pflege_art}
            onChange={(v) => set("z26_pflege_art", v)}
          />
          <BmfInputRow
            kz="304"
            label="Summe der Aufwendungen"
            hint="Z. 27"
            value={form.z27_pflege_aufw}
            onChange={(v) => set("z27_pflege_aufw", v)}
          />
          <BmfInputRow
            kz="305"
            label="− Haushaltsersparnis + Versicherungsleistungen / Beihilfen"
            hint="Z. 28"
            value={form.z28_pflege_erstattung}
            onChange={(v) => set("z28_pflege_erstattung", v)}
          />
          <BmfRow
            kz=""
            label="Netto-Pflegekosten (auto)"
            value={netto_pflege}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection title="7. Behinderungsbedingte Aufwendungen (Z. 29–31)">
          <TextRow
            zeile="29"
            label="Art der Aufwendungen"
            value={form.z29_behinderung_art}
            onChange={(v) => set("z29_behinderung_art", v)}
            placeholder="z. B. Umbau, Rollstuhl, Hörgerät, spezielle Hilfsmittel"
          />
          <BmfInputRow
            kz="306"
            label="Summe der Aufwendungen"
            hint="Z. 30"
            value={form.z30_behinderung_aufw}
            onChange={(v) => set("z30_behinderung_aufw", v)}
          />
          <BmfInputRow
            kz="307"
            label="− Versicherungsleistungen / Beihilfen"
            hint="Z. 31"
            value={form.z31_behinderung_erstattung}
            onChange={(v) => set("z31_behinderung_erstattung", v)}
          />
          <BmfRow
            kz=""
            label="Netto-behinderungsbedingt (auto)"
            value={netto_behinderung}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 8 ============ */}
        <BmfSection
          title="8. Bestattungskosten (Z. 32–35)"
          description="Absetzbar nur insoweit die Kosten den Nachlasswert übersteigen."
        >
          <TextRow
            zeile="32"
            label="Art der Aufwendungen"
            value={form.z32_bestattung_art}
            onChange={(v) => set("z32_bestattung_art", v)}
          />
          <BmfInputRow
            kz="310"
            label="Summe der Aufwendungen"
            hint="Z. 33"
            value={form.z33_bestattung_aufw}
            onChange={(v) => set("z33_bestattung_aufw", v)}
          />
          <BmfInputRow
            kz="311"
            label="− Versicherungsleistungen / Sterbegeld / Beihilfen"
            hint="Z. 34"
            value={form.z34_bestattung_erstattung}
            onChange={(v) => set("z34_bestattung_erstattung", v)}
          />
          <BmfInputRow
            kz="314"
            label="− Gesamtwert Nachlass"
            hint="Z. 35 · Bargeld, Grundstücke, Wertpapiere, LV"
            value={form.z35_nachlass}
            onChange={(v) => set("z35_nachlass", v)}
          />
          <BmfRow
            kz=""
            label="Netto-Bestattungskosten (auto)"
            value={netto_bestattung}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 9 ============ */}
        <BmfSection title="9. Sonstige außergewöhnliche Belastungen (Z. 36–38)">
          <TextRow
            zeile="36"
            label="Art der Aufwendungen"
            value={form.z36_sonstige_art}
            onChange={(v) => set("z36_sonstige_art", v)}
            placeholder="z. B. Ehescheidungskosten, Katastrophenschaden, Prozesskosten"
          />
          <BmfInputRow
            kz="312"
            label="Summe der Aufwendungen"
            hint="Z. 37"
            value={form.z37_sonstige_aufw}
            onChange={(v) => set("z37_sonstige_aufw", v)}
          />
          <BmfInputRow
            kz="313"
            label="− Versicherungsleistungen / Beihilfen"
            hint="Z. 38"
            value={form.z38_sonstige_erstattung}
            onChange={(v) => set("z38_sonstige_erstattung", v)}
          />
          <BmfRow
            kz=""
            label="Netto-sonstige aGB (auto)"
            value={netto_sonstige}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 10 ============ */}
        <BmfSection
          title="10. Haushaltsnah / Handwerker — Anteile aus Z. 27/30/37 (Z. 39–41)"
          description="Für diese Beträge wird § 35a-Ermäßigung beantragt, soweit sie aGB-seitig durch die zumutbare Belastung nicht absetzbar sind. NICHT zusätzlich auf Anlage Haushaltsnahe Aufwendungen eintragen."
        >
          <BmfInputRow
            kz="370"
            label="In Z. 27 enthaltene Minijob-Pflegeleistungen"
            hint="Z. 39"
            value={form.z39_minijob}
            onChange={(v) => set("z39_minijob", v)}
          />
          <BmfInputRow
            kz="371"
            label="In Z. 27 enthaltene übrige haushaltsnahe Pflegeleistungen (inkl. Heim)"
            hint="Z. 40"
            value={form.z40_haushaltsnah}
            onChange={(v) => set("z40_haushaltsnah", v)}
          />
          <BmfInputRow
            kz="372"
            label="In Z. 27/30/37 enthaltene Handwerker-Arbeitskosten"
            hint="Z. 41"
            value={form.z41_handwerker}
            onChange={(v) => set("z41_handwerker", v)}
          />
        </BmfSection>

        {/* ============ Summary ============ */}
        <BmfRow
          kz=""
          label="Summe Pauschbeträge (Info)"
          value={pauschbetraegeSumme}
          subtotal
        />
        <BmfRow
          kz=""
          label="Summe konkrete aGB § 33 EStG (Info · vor zumutbarer Belastung)"
          value={gesamt33}
          subtotal
        />

        <BmfResult
          label="Summe aGB + Pauschbeträge (Info · ohne Abzug zumutbare Belastung)"
          value={pauschbetraegeSumme + gesamt33}
          variant={pauschbetraegeSumme + gesamt33 > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift(en)" />

        <BmfFootnotes>
          <p>
            <strong>Behinderten-Pauschbetrag (§ 33b Abs. 3 EStG):</strong>{" "}
            gestaffelt nach GdB ab 20 (384 €) bis 100 (2.840 €). Hilflos ("H"),
            blind ("Bl"), taubblind ("TBl") oder Pflegegrad 4/5 → erhöhter
            Pauschbetrag 7.400 €.
          </p>
          <p>
            <strong>Pflege-Pauschbetrag (§ 33b Abs. 6):</strong> PG 2 = 600 €,
            PG 3 = 1.100 €, PG 4/5 oder "H" = 1.800 €. Voraussetzungen:
            Unentgeltliche persönliche Pflege in Wohnung des Pflegebedürftigen
            oder eigener Wohnung (Inland oder EU/EWR). Bei mehreren Pflegepersonen
            wird der Pauschbetrag aufgeteilt (§ 33b Abs. 6 Satz 8).
          </p>
          <p>
            <strong>Fahrtkostenpauschale (§ 33 Abs. 2a):</strong> seit 2021
            pauschal 900 € (GdB ≥ 80 oder 70+G) bzw. 4.500 € (aG/Bl/TBl/H oder
            PG 4/5). Einzelnachweis daneben nicht möglich.
          </p>
          <p>
            <strong>Konkrete aGB § 33 EStG:</strong> Krankheitskosten,
            Pflegekosten, behinderungsbedingte Aufwendungen, Bestattungskosten,
            sonstige — jeweils <em>nach</em> Abzug von Erstattungen. Die
            <strong> zumutbare Belastung</strong> (1–7 % des GdE je nach Familienstand
            und Einkommen) wird im Bescheid automatisch abgezogen — hier wird
            der Brutto-Betrag angegeben.
          </p>
          <p>
            <strong>Bestattungskosten:</strong> nur insoweit absetzbar, wie die
            Kosten den Nachlasswert (Z. 35) übersteigen.
          </p>
          <p>
            <strong>Querbezug zu § 35a:</strong> Z. 39–41 erfassen Pflege- und
            Handwerkeranteile, die über § 35a (Anlage Haushaltsnahe Aufwendungen)
            angesetzt werden sollen, soweit sie durch die zumutbare Belastung
            nicht als aGB absetzbar sind. Günstigerprüfung durch das Finanzamt.
          </p>
          <p>
            <strong>NICHT automatisch berechnet:</strong> zumutbare Belastung
            (hängt von GdE + Familienstand + Kinderzahl ab), § 35a-Deckel-
            Prüfung, Zeit-Korrekturen bei unterjähriger Schwerbehinderung,
            Pauschbetrag-Übertragung vom Kind auf Eltern (§ 33b Abs. 5 — in
            Anlage Kind).
          </p>
          <p>
            <strong>Nachweispflichten:</strong> Schwerbehindertenausweis bzw.
            Bescheid + Pflegegrad-Bescheid (bei Erstantrag/Änderung in Kopie).
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> Person A 100–105, Person B 150–155 ·
            Hinterbliebenen 380/381 · Pflege 200–205 · Fahrt 250–253 · aGB
            302/303/304/305/306/307/310/311/312/313/314 · Haushaltsnahe 370/371/372.
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

// ---------- Behinderungs-Block -----------------------------------------

type BehindData = {
  ausweis: string;
  gueltig_von: string;
  gueltig_bis: string;
  unbefristet: JaNein;
  gdb: number;
  g_aG: JaNein;
  hilflos: JaNein;
};

function BehinderungsBlock({
  title,
  zeilen,
  kz,
  data,
  on,
}: {
  title: string;
  zeilen: { ausweis: string; gehen: string; hilflos: string };
  kz: {
    ausweis: string;
    gueltig: string;
    unbefristet: string;
    gdb: string;
    g_aG: string;
    hilflos: string;
  };
  data: BehindData;
  on: {
    ausweis: (v: string) => void;
    gueltig_von: (v: string) => void;
    gueltig_bis: (v: string) => void;
    unbefristet: (v: JaNein) => void;
    gdb: (v: number) => void;
    g_aG: (v: JaNein) => void;
    hilflos: (v: JaNein) => void;
  };
}) {
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">{title}</div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        zeile={zeilen.ausweis}
        label="Ausweis / (Renten-)Bescheid / Bescheinigung"
        value={data.ausweis}
        onChange={on.ausweis}
        kz={kz.ausweis}
      />
      <DateRow
        kz={kz.gueltig}
        zeile={zeilen.ausweis}
        label="Gültig von"
        value={data.gueltig_von}
        onChange={on.gueltig_von}
      />
      <TextRow
        zeile={zeilen.ausweis}
        label="Gültig bis (oder unbefristet in nächster Zeile)"
        value={data.gueltig_bis}
        onChange={on.gueltig_bis}
      />
      <JaNeinRow
        kz={kz.unbefristet}
        zeile={zeilen.ausweis}
        label="Unbefristet gültig"
        value={data.unbefristet}
        onChange={on.unbefristet}
      />
      <BmfInputRow
        kz={kz.gdb}
        label="Grad der Behinderung (GdB)"
        hint={`Z. ${zeilen.ausweis} · 20–100 in 10er-Schritten`}
        value={data.gdb}
        onChange={on.gdb}
        step={10}
      />
      <JaNeinRow
        kz={kz.g_aG}
        zeile={zeilen.gehen}
        label={"Merkzeichen \u201EG\u201C oder \u201EaG\u201C"}
        value={data.g_aG}
        onChange={on.g_aG}
      />
      <JaNeinRow
        kz={kz.hilflos}
        zeile={zeilen.hilflos}
        label={"Blind / Taubblind / Hilflos (\u201EBl\u201C/\u201ETBl\u201C/\u201EH\u201C) oder Pflegegrad 4/5"}
        value={data.hilflos}
        onChange={on.hilflos}
      />
    </>
  );
}

function PflegegradSelect({
  zeile,
  label,
  value,
  onChange,
}: {
  zeile: string;
  label: string;
  value: Pflegegrad;
  onChange: (v: Pflegegrad) => void;
}) {
  return (
    <WideRow kz="203" zeile={zeile} label={label} wide={220}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as Pflegegrad)}
        style={selectStyle}
      >
        <option value={0}>— kein Pflegegrad erfasst —</option>
        <option value={2}>Pflegegrad 2</option>
        <option value={3}>Pflegegrad 3</option>
        <option value={4}>Pflegegrad 4 oder 5</option>
      </select>
    </WideRow>
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
    <WideRow kz={kz ?? ""} zeile={zeile} label={label} wide={280}>
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
