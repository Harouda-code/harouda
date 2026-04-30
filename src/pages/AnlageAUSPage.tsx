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

// ---------- State ------------------------------------------------------

type StaatEinkunft = {
  staat: string;
  z7_einkuenfte: number;
  z8_teilfreistellung_40: number;
  z9_teilfreistellung_invstg: number;
  z10_abgezogen_34c2: number;
  z11_abgezogen_34c3: number;
  z12_anrechenbare: number;
  z13_fiktive_dba: number;
};

const EMPTY_STAAT: StaatEinkunft = {
  staat: "",
  z7_einkuenfte: 0,
  z8_teilfreistellung_40: 0,
  z9_teilfreistellung_invstg: 0,
  z10_abgezogen_34c2: 0,
  z11_abgezogen_34c3: 0,
  z12_anrechenbare: 0,
  z13_fiktive_dba: 0,
};

type NondbaRow = {
  staat: string;
  par2a_nr: string;
  noch_nicht_verrechnet: number;
  nicht_ausgleichsfaehig: number;
  anlage_zeile: string;
  positive_einkuenfte: number;
  anlage_zeile_pos: string;
};

const EMPTY_NONDBA: NondbaRow = {
  staat: "",
  par2a_nr: "",
  noch_nicht_verrechnet: 0,
  nicht_ausgleichsfaehig: 0,
  anlage_zeile: "",
  positive_einkuenfte: 0,
  anlage_zeile_pos: "",
};

type DbaSteuerfreiRow = {
  staat: string;
  einkunftsquelle: string;
  einkunftsart: string;
  einkuenfte: number;
};

const EMPTY_DBA_POS: DbaSteuerfreiRow = {
  staat: "",
  einkunftsquelle: "",
  einkunftsart: "",
  einkuenfte: 0,
};

type DbaNegativeRow = {
  staat: string;
  par2a_nr: string;
  noch_nicht_verrechnet: number;
  nicht_ausgleichsfaehig: number;
  positive_einkuenfte: number;
  anlage_zeile: string;
};

const EMPTY_DBA_NEG: DbaNegativeRow = {
  staat: "",
  par2a_nr: "",
  noch_nicht_verrechnet: 0,
  nicht_ausgleichsfaehig: 0,
  positive_einkuenfte: 0,
  anlage_zeile: "",
};

type AnlageAUS = {
  istErstesFormular: boolean;

  // Section 1: main income — 3 countries
  z5_einkunftsquellen: string;
  z6_anlage_zeile: string;
  staat_a: StaatEinkunft; // Kz 107/108/115/113/109
  staat_b: StaatEinkunft; // Kz 127/128/135/133/129
  staat_c: StaatEinkunft; // Kz 147/148/155/153/149

  // Section 2
  z14_pauschal: number; // Kz 800

  // Section 3 § 50d
  z15_par50d7: number; // Kz 827
  z16_par50d7_steuer: number; // Kz 828
  z17_par50d10: number; // Kz 824
  z18_par50d10_steuer: number; // Kz 825

  // Section 4 §§ 7-13 AStG
  z19_finanzamt: string;
  z20_steuernummer: string;
  z21_staat: string;
  z22_hinzurechnung: number; // Kz 801
  z23_par12_1: number; // Kz 802
  z24_par12_2: number; // Kz 803

  // Section 5 § 15 AStG
  z25_bezeichnung: string;
  z26_finanzamt: string;
  z27_steuernummer: string;
  z28_einkuenfte_tariflich: number; // Kz 818
  z29_par15_5_1: number; // Kz 819
  z30_par15_11_2: number; // Kz 820

  // Section 6 — 5 rows
  nondba_rows: [NondbaRow, NondbaRow, NondbaRow, NondbaRow, NondbaRow];

  // Section 7 — 5 countries (Kz 810–814 je Zeile)
  dba_pos: [
    DbaSteuerfreiRow,
    DbaSteuerfreiRow,
    DbaSteuerfreiRow,
    DbaSteuerfreiRow,
    DbaSteuerfreiRow,
  ];
  z41_ausl_kapital: number; // Kz 817
  z42_gewerbl_betriebsstaette: number; // Kz 815
  z43_ausserordentliche: number; // Kz 816
  z44_steuerstundung_zeile: string;

  // Section 8
  z45_staat: string;
  z45_einkunftsquelle: string;
  z45_einkuenfte: number; // Kz 826

  // Section 9
  z46_verbleibende_festgestellt: boolean;
  z47_verzicht_verlustruecktrag: JaNein;

  // Section 10 — 5 rows DBA negative
  dba_neg_rows: [
    DbaNegativeRow,
    DbaNegativeRow,
    DbaNegativeRow,
    DbaNegativeRow,
    DbaNegativeRow,
  ];
};

function fill5<T>(empty: T): [T, T, T, T, T] {
  return [empty, empty, empty, empty, empty];
}

const DEFAULT: AnlageAUS = {
  istErstesFormular: true,
  z5_einkunftsquellen: "",
  z6_anlage_zeile: "",
  staat_a: EMPTY_STAAT,
  staat_b: EMPTY_STAAT,
  staat_c: EMPTY_STAAT,
  z14_pauschal: 0,
  z15_par50d7: 0,
  z16_par50d7_steuer: 0,
  z17_par50d10: 0,
  z18_par50d10_steuer: 0,
  z19_finanzamt: "",
  z20_steuernummer: "",
  z21_staat: "",
  z22_hinzurechnung: 0,
  z23_par12_1: 0,
  z24_par12_2: 0,
  z25_bezeichnung: "",
  z26_finanzamt: "",
  z27_steuernummer: "",
  z28_einkuenfte_tariflich: 0,
  z29_par15_5_1: 0,
  z30_par15_11_2: 0,
  nondba_rows: fill5(EMPTY_NONDBA),
  dba_pos: fill5(EMPTY_DBA_POS),
  z41_ausl_kapital: 0,
  z42_gewerbl_betriebsstaette: 0,
  z43_ausserordentliche: 0,
  z44_steuerstundung_zeile: "",
  z45_staat: "",
  z45_einkunftsquelle: "",
  z45_einkuenfte: 0,
  z46_verbleibende_festgestellt: false,
  z47_verzicht_verlustruecktrag: "",
  dba_neg_rows: fill5(EMPTY_DBA_NEG),
};

const FORM_ID = "anlage-aus";

function mergeStaat(s: Partial<StaatEinkunft> | undefined): StaatEinkunft {
  return { ...EMPTY_STAAT, ...(s ?? {}) };
}

function loadForm(mandantId: string | null, jahr: number): AnlageAUS {
  const parsed = readEstForm<Partial<AnlageAUS> & Record<string, unknown>>(
    FORM_ID,
    mandantId,
    jahr
  );
  if (!parsed) return DEFAULT;

  // Legacy TaxFormBuilder migration
  const looksLegacy =
    typeof (parsed as Record<string, unknown>).auslEinkuenfte === "number" ||
    typeof (parsed as Record<string, unknown>).auslQuellensteuer === "number";
  if (looksLegacy) {
    const old = parsed as Record<string, number>;
    return {
      ...DEFAULT,
      staat_a: {
        ...EMPTY_STAAT,
        staat: "Legacy",
        z7_einkuenfte: old.auslEinkuenfte ?? 0,
        z12_anrechenbare: old.auslQuellensteuer ?? 0,
      },
    };
  }

  return {
    ...DEFAULT,
    ...parsed,
    staat_a: mergeStaat(parsed.staat_a),
    staat_b: mergeStaat(parsed.staat_b),
    staat_c: mergeStaat(parsed.staat_c),
    nondba_rows:
      Array.isArray(parsed.nondba_rows) && parsed.nondba_rows.length === 5
        ? (parsed.nondba_rows.map((r) => ({
            ...EMPTY_NONDBA,
            ...(r ?? {}),
          })) as AnlageAUS["nondba_rows"])
        : DEFAULT.nondba_rows,
    dba_pos:
      Array.isArray(parsed.dba_pos) && parsed.dba_pos.length === 5
        ? (parsed.dba_pos.map((r) => ({
            ...EMPTY_DBA_POS,
            ...(r ?? {}),
          })) as AnlageAUS["dba_pos"])
        : DEFAULT.dba_pos,
    dba_neg_rows:
      Array.isArray(parsed.dba_neg_rows) && parsed.dba_neg_rows.length === 5
        ? (parsed.dba_neg_rows.map((r) => ({
            ...EMPTY_DBA_NEG,
            ...(r ?? {}),
          })) as AnlageAUS["dba_neg_rows"])
        : DEFAULT.dba_neg_rows,
  };
}

// Kz-sets for the three countries in Section 1
type SxKz = {
  z7: string;
  z8: string;
  z9: string;
  z10: string;
  z12: string;
};

const KZ_STAAT_A: SxKz = { z7: "107", z8: "108", z9: "115", z10: "113", z12: "109" };
const KZ_STAAT_B: SxKz = { z7: "127", z8: "128", z9: "135", z10: "133", z12: "129" };
const KZ_STAAT_C: SxKz = { z7: "147", z8: "148", z9: "155", z10: "153", z12: "149" };

// ---------- Main page --------------------------------------------------

export default function AnlageAUSPage() {
  return (
    <MandantRequiredGuard>
      <AnlageAUSPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageAUSPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageAUS>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageAUS>(key: K, value: AnlageAUS[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateStaat(
    which: "staat_a" | "staat_b" | "staat_c",
    updater: (s: StaatEinkunft) => StaatEinkunft
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  function updateNondbaRow(
    idx: 0 | 1 | 2 | 3 | 4,
    updater: (r: NondbaRow) => NondbaRow
  ) {
    setForm((f) => {
      const rows = [...f.nondba_rows] as AnlageAUS["nondba_rows"];
      rows[idx] = updater(rows[idx]);
      return { ...f, nondba_rows: rows };
    });
  }

  function updateDbaPos(
    idx: 0 | 1 | 2 | 3 | 4,
    updater: (r: DbaSteuerfreiRow) => DbaSteuerfreiRow
  ) {
    setForm((f) => {
      const rows = [...f.dba_pos] as AnlageAUS["dba_pos"];
      rows[idx] = updater(rows[idx]);
      return { ...f, dba_pos: rows };
    });
  }

  function updateDbaNegRow(
    idx: 0 | 1 | 2 | 3 | 4,
    updater: (r: DbaNegativeRow) => DbaNegativeRow
  ) {
    setForm((f) => {
      const rows = [...f.dba_neg_rows] as AnlageAUS["dba_neg_rows"];
      rows[idx] = updater(rows[idx]);
      return { ...f, dba_neg_rows: rows };
    });
  }

  const summeEinkuenfteSec1 = useMemo(() => {
    return (
      form.staat_a.z7_einkuenfte +
      form.staat_b.z7_einkuenfte +
      form.staat_c.z7_einkuenfte
    );
  }, [form.staat_a, form.staat_b, form.staat_c]);

  const summeAnrechenbar = useMemo(() => {
    return (
      form.staat_a.z12_anrechenbare +
      form.staat_b.z12_anrechenbare +
      form.staat_c.z12_anrechenbare
    );
  }, [form.staat_a, form.staat_b, form.staat_c]);

  function validate(): string[] {
    const warns: string[] = [];
    const zus = [form.staat_a, form.staat_b, form.staat_c];
    zus.forEach((s, i) => {
      if (s.staat.trim() || s.z7_einkuenfte !== 0) {
        if (s.z8_teilfreistellung_40 > s.z7_einkuenfte) {
          warns.push(
            `${i + 1}. Staat: Z. 8 > Z. 7 (teilfreigestellt > Gesamteinkünfte).`
          );
        }
        if (s.z10_abgezogen_34c2 > 0 && s.z12_anrechenbare > 0) {
          warns.push(
            `${i + 1}. Staat: § 34c Abs. 2 EStG (Abzug · Z. 10) UND Anrechnung (Z. 12) schließen sich aus — bitte nur eine Methode wählen.`
          );
        }
      }
    });
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 8000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-aus"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-aus",
      summary: `Anlage AUS gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-aus",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        summeEinkuenfteSec1,
        summeAnrechenbar,
        form,
      },
    });
    toast.success("Anlage AUS gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage AUS</h1>
          <p>
            Ausländische Einkünfte und Steuern (§§ 32b, 34c, 34d EStG) · VZ{" "}
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
          Anlage AUS · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-aus" />

      <section className="card taxcalc__section no-print">
        <h2>Profil</h2>
        <label className="form-field kontenplan__toggle--form">
          <input
            type="checkbox"
            checked={form.istErstesFormular}
            onChange={(e) => set("istErstesFormular", e.target.checked)}
          />
          <span>Erstes Formular (Z. 14–30 nur hier einblenden)</span>
        </label>
      </section>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Erhöhte Mitwirkungspflicht § 90 Abs. 2 AO:</strong> Bei
          Auslandssachverhalten müssen Sie Belege (Steuerbescheinigungen, DBA-
          Nachweise, Feststellungsbescheide) der Steuererklärung in Kopie
          beifügen. Die endgültige Anrechnung/Abzug-Entscheidung trifft das
          Finanzamt im Bescheid.
        </div>
      </aside>

      <BmfForm
        title="Anlage AUS"
        subtitle={`Ausländische Einkünfte & Steuern · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection
          title="1. Ausländische Einkünfte je Staat (Z. 4–13)"
          description="Bis zu 3 Staaten/Spezial-Investmentfonds je Formular. Bei mehr als 3: weiteres Formular."
        >
          <TextRow
            zeile="5"
            label="Einkunftsquellen (bei mehreren: Aufstellung beifügen)"
            value={form.z5_einkunftsquellen}
            onChange={(v) => set("z5_einkunftsquellen", v)}
          />
          <TextRow
            zeile="6"
            label="Enthalten in Anlage(n) und Zeile(n)"
            value={form.z6_anlage_zeile}
            onChange={(v) => set("z6_anlage_zeile", v)}
          />
        </BmfSection>

        <StaatBlock
          title="1. Staat / Spezial-Investmentfonds"
          staat={form.staat_a}
          kz={KZ_STAAT_A}
          onChange={(u) => updateStaat("staat_a", u)}
        />
        <StaatBlock
          title="2. Staat / Spezial-Investmentfonds"
          staat={form.staat_b}
          kz={KZ_STAAT_B}
          onChange={(u) => updateStaat("staat_b", u)}
        />
        <StaatBlock
          title="3. Staat / Spezial-Investmentfonds"
          staat={form.staat_c}
          kz={KZ_STAAT_C}
          onChange={(u) => updateStaat("staat_c", u)}
        />

        <BmfRow
          kz=""
          label="Summe Einkünfte Z. 7 (alle Staaten · Info)"
          value={summeEinkuenfteSec1}
          subtotal
        />
        <BmfRow
          kz=""
          label="Summe anrechenbare Steuern Z. 12 (alle Staaten · Info)"
          value={summeAnrechenbar}
          subtotal
        />

        {/* ============ Sections 2–5 (only in first form) ============ */}
        {form.istErstesFormular && (
          <>
            <BmfSection
              title="2. Pauschalierung § 34c Abs. 5 EStG (Z. 14)"
              description="Nur ausfüllen, wenn Pauschalbesteuerung beantragt wird."
            >
              <BmfInputRow
                kz="800"
                label="Pauschal zu besteuernde Einkünfte (nicht in Z. 7 enthalten)"
                hint="Z. 14"
                value={form.z14_pauschal}
                onChange={(v) => set("z14_pauschal", v)}
              />
            </BmfSection>

            <BmfSection
              title="3. Anrechnung § 50d Abs. 7/10 EStG (Z. 15–18)"
              description="Sonder-Anrechnungstatbestände bei beschränkter Steuerpflicht."
            >
              <BmfInputRow
                kz="827"
                label="Einkünfte i.S.d. § 50d Abs. 7 EStG"
                hint="Z. 15"
                value={form.z15_par50d7}
                onChange={(v) => set("z15_par50d7", v)}
              />
              <BmfInputRow
                kz="828"
                label="Anrechenbare ausl. Steuer § 50d Abs. 7 Satz 2"
                hint="Z. 16"
                value={form.z16_par50d7_steuer}
                onChange={(v) => set("z16_par50d7_steuer", v)}
              />
              <BmfInputRow
                kz="824"
                label="Inländische Einkünfte i.S.d. § 50d Abs. 10 EStG"
                hint="Z. 17"
                value={form.z17_par50d10}
                onChange={(v) => set("z17_par50d10", v)}
              />
              <BmfInputRow
                kz="825"
                label="Anrechenbare ausl. Steuer § 50d Abs. 10 Satz 5"
                hint="Z. 18"
                value={form.z18_par50d10_steuer}
                onChange={(v) => set("z18_par50d10_steuer", v)}
              />
            </BmfSection>

            <BmfSection
              title="4. Hinzurechnungsbesteuerung §§ 7–13 AStG (Z. 19–24)"
              description="Controlled Foreign Company (CFC) · laut Feststellungsbescheid des Finanzamts."
            >
              <TextRow
                zeile="19"
                label="Finanzamt"
                value={form.z19_finanzamt}
                onChange={(v) => set("z19_finanzamt", v)}
              />
              <TextRow
                zeile="20"
                label="Steuernummer"
                value={form.z20_steuernummer}
                onChange={(v) => set("z20_steuernummer", v)}
              />
              <TextRow
                zeile="21"
                label="Staat"
                value={form.z21_staat}
                onChange={(v) => set("z21_staat", v)}
              />
              <BmfInputRow
                kz="801"
                label="Hinzurechnungsbetrag lt. Feststellung"
                hint="Z. 22 · inkl. anzurech. Steuern aus Z. 23 (soweit mindernd)"
                value={form.z22_hinzurechnung}
                onChange={(v) => set("z22_hinzurechnung", v)}
              />
              <BmfInputRow
                kz="802"
                label="Anzurechnende Steuern § 12 Abs. 1 AStG"
                hint="Z. 23"
                value={form.z23_par12_1}
                onChange={(v) => set("z23_par12_1", v)}
              />
              <BmfInputRow
                kz="803"
                label="Auf Antrag anrechenbar § 12 Abs. 2 AStG"
                hint="Z. 24"
                value={form.z24_par12_2}
                onChange={(v) => set("z24_par12_2", v)}
              />
            </BmfSection>

            <BmfSection
              title="5. Ausländische Familienstiftungen § 15 AStG (Z. 25–30)"
              description="Laut Feststellungsbescheid der Familienstiftung."
            >
              <TextRow
                zeile="25"
                label="Bezeichnung"
                value={form.z25_bezeichnung}
                onChange={(v) => set("z25_bezeichnung", v)}
              />
              <TextRow
                zeile="26"
                label="Finanzamt"
                value={form.z26_finanzamt}
                onChange={(v) => set("z26_finanzamt", v)}
              />
              <TextRow
                zeile="27"
                label="Steuernummer"
                value={form.z27_steuernummer}
                onChange={(v) => set("z27_steuernummer", v)}
              />
              <BmfInputRow
                kz="818"
                label="Einkünfte — tariflich (in G, KAP[Z.54], L, S, V enthalten)"
                hint="Z. 28"
                value={form.z28_einkuenfte_tariflich}
                onChange={(v) => set("z28_einkuenfte_tariflich", v)}
              />
              <BmfInputRow
                kz="819"
                label="Anzurechnende ausl. Steuern § 15 Abs. 5 Satz 1 AStG"
                hint="Z. 29"
                value={form.z29_par15_5_1}
                onChange={(v) => set("z29_par15_5_1", v)}
              />
              <BmfInputRow
                kz="820"
                label="Auf Antrag anrechenbar § 15 Abs. 11 Satz 2 AStG (Zuwendungen)"
                hint="Z. 30"
                value={form.z30_par15_11_2}
                onChange={(v) => set("z30_par15_11_2", v)}
              />
            </BmfSection>
          </>
        )}

        {/* ============ Section 6: Non-DBA negative ============ */}
        <BmfSection
          title="6. Nicht DBA-steuerfreie negative Einkünfte § 2a Abs. 1 EStG (Z. 31–35)"
          description="5 Einkunftsquellen · Verlustvortrag 1985–2024 + laufendes Jahr."
        >
          {form.nondba_rows.map((row, i) => (
            <NondbaRowBlock
              key={i}
              idx={(i + 31).toString()}
              row={row}
              onChange={(u) => updateNondbaRow(i as 0 | 1 | 2 | 3 | 4, u)}
            />
          ))}
        </BmfSection>

        {/* ============ Section 7: DBA tax-free ============ */}
        <BmfSection
          title="7. Nach DBA steuerfreie Einkünfte mit Progressionsvorbehalt (Z. 36–44)"
          description="Werden dem deutschen Steuersatz zugrunde gelegt (§ 32b EStG) — nicht besteuert, aber erhöhen den Tarif auf die übrigen Einkünfte."
        >
          {form.dba_pos.map((row, i) => (
            <DbaPosRowBlock
              key={i}
              zeile={(i + 36).toString()}
              kz={(810 + i).toString()}
              row={row}
              onChange={(u) => updateDbaPos(i as 0 | 1 | 2 | 3 | 4, u)}
            />
          ))}
          <BmfInputRow
            kz="817"
            label="Summe ausl. Kapitalerträge (im Inland Sondertarif § 32d Abs. 1)"
            hint="Z. 41"
            value={form.z41_ausl_kapital}
            onChange={(v) => set("z41_ausl_kapital", v)}
          />
          <BmfInputRow
            kz="815"
            label="Gewinne gewerbliche Betriebsstätte (§ 2a Abs. 3/4 EStG, § 2 AuslInvG)"
            hint="Z. 42"
            value={form.z42_gewerbl_betriebsstaette}
            onChange={(v) => set("z42_gewerbl_betriebsstaette", v)}
          />
          <BmfInputRow
            kz="816"
            label="Außerordentliche Einkünfte §§ 34, 34b EStG (nicht in Z. 42)"
            hint="Z. 43"
            value={form.z43_ausserordentliche}
            onChange={(v) => set("z43_ausserordentliche", v)}
          />
          <TextRow
            zeile="44"
            label="Steuerstundungsmodell § 15b · betrifft Zeile Nr."
            value={form.z44_steuerstundung_zeile}
            onChange={(v) => set("z44_steuerstundung_zeile", v)}
          />
        </BmfSection>

        {/* ============ Section 8 ============ */}
        <BmfSection
          title="8. Private Veräußerungsgeschäfte § 32b + § 23 EStG (Z. 45)"
          description="Nach DBA steuerfrei aber mit Progressionsvorbehalt."
        >
          <TextRow
            zeile="45"
            label="Staat"
            value={form.z45_staat}
            onChange={(v) => set("z45_staat", v)}
          />
          <TextRow
            zeile="45"
            label="Einkunftsquelle"
            value={form.z45_einkunftsquelle}
            onChange={(v) => set("z45_einkunftsquelle", v)}
          />
          <BmfInputRow
            kz="826"
            label="Einkünfte"
            hint="Z. 45"
            value={form.z45_einkuenfte}
            onChange={(v) => set("z45_einkuenfte", v)}
          />
        </BmfSection>

        {/* ============ Section 9 ============ */}
        <BmfSection title="9. Verlustvortrag (Z. 46–47)">
          <CheckboxRow
            zeile="46"
            label="Zum 31.12.2024 wurden verbleibende negative Einkünfte nach § 10d EStG festgestellt"
            value={form.z46_verbleibende_festgestellt}
            onChange={(v) => set("z46_verbleibende_festgestellt", v)}
          />
          <JaNeinRow
            zeile="47"
            label="Antrag: Verzicht auf Verlustrücktrag § 10d EStG ins Jahr 2024"
            value={form.z47_verzicht_verlustruecktrag}
            onChange={(v) => set("z47_verzicht_verlustruecktrag", v)}
          />
        </BmfSection>

        {/* ============ Section 10: DBA negative ============ */}
        <BmfSection
          title="10. Nach DBA steuerfreie negative Einkünfte § 2a Abs. 1 EStG (Z. 48–52)"
          description="5 Einkunftsquellen · wirken ggf. auf Progressionsvorbehalt mindernd."
        >
          {form.dba_neg_rows.map((row, i) => (
            <DbaNegRowBlock
              key={i}
              idx={(i + 48).toString()}
              row={row}
              onChange={(u) => updateDbaNegRow(i as 0 | 1 | 2 | 3 | 4, u)}
            />
          ))}
        </BmfSection>

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Anrechnung vs. Abzug (§ 34c EStG):</strong> Abs. 1 =
            Anrechnung (Standard), Abs. 2 = Abzug statt Anrechnung (Antrag),
            Abs. 3 = Abzug wenn keine Identität besteht, Abs. 5 =
            Pauschalierung auf Antrag. Pro Einkunftsquelle nur eine Methode.
          </p>
          <p>
            <strong>§ 2a EStG Verlustausgleichsbeschränkung:</strong>{" "}
            Bestimmte ausländische negative Einkünfte sind nur mit positiven
            Einkünften aus demselben Staat und derselben Einkunftsart
            verrechenbar (Sektionen 6 und 10).
          </p>
          <p>
            <strong>DBA-Freistellung mit Progressionsvorbehalt (§ 32b):</strong>{" "}
            Steuerfreie Einkünfte erhöhen den Steuersatz auf die übrigen
            Einkünfte — der erhöhte Satz wird nur auf das Inlandseinkommen
            angewendet.
          </p>
          <p>
            <strong>NICHT automatisch berechnet:</strong> Progressionsvorbehalt-
            Satz, Anrechnungshöchstbetrag je Staat (per country limitation,
            § 34c Abs. 1 Satz 2), Aufteilung Einkunftsarten bei CFC, § 2a
            Einkunftsquellen-Zuordnung, Günstigerprüfung Pauschalierung vs.
            Anrechnung.
          </p>
          <p>
            <strong>Erhöhte Mitwirkungspflicht § 90 Abs. 2 AO:</strong>{" "}
            Belege in Kopie der Steuererklärung beifügen. Bei Steuerabzug:
            ausländische Steuerbescheinigungen beilegen. Übersetzungspflicht
            für nicht deutschsprachige Belege.
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> 1. Staat 107/108/115/113/109 ·
            2. Staat 127/128/135/133/129 · 3. Staat 147/148/155/153/149 ·
            CFC 801/802/803 · Familienstiftung 818/819/820 · § 32b 810–814 ·
            § 50d 824/825/827/828.
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

// ---------- Staat block (Section 1) ------------------------------------

function StaatBlock({
  title,
  staat,
  kz,
  onChange,
}: {
  title: string;
  staat: StaatEinkunft;
  kz: SxKz;
  onChange: (updater: (s: StaatEinkunft) => StaatEinkunft) => void;
}) {
  const setF = <K extends keyof StaatEinkunft>(k: K, v: StaatEinkunft[K]) =>
    onChange((s) => ({ ...s, [k]: v }));
  return (
    <BmfSection
      title={`${title} (Z. 4 / Z. 7–13)`}
      description={staat.staat ? `Staat: ${staat.staat}` : "Bitte Staat eintragen."}
    >
      <TextRow
        zeile="4"
        label="Staat / Spezial-Investmentfonds"
        value={staat.staat}
        onChange={(v) => setF("staat", v)}
      />
      <BmfInputRow
        kz={kz.z7}
        label="Einkünfte (inkl. § 3 Nr. 40 / § 3c Abs. 2 EStG + §§ 20, 21 InvStG)"
        hint="Z. 7"
        value={staat.z7_einkuenfte}
        onChange={(v) => setF("z7_einkuenfte", v)}
      />
      <BmfInputRow
        kz={kz.z8}
        label="davon § 3 Nr. 40 / § 3c Abs. 2 EStG (Teileinkünfte)"
        hint="Z. 8"
        value={staat.z8_teilfreistellung_40}
        onChange={(v) => setF("z8_teilfreistellung_40", v)}
      />
      <BmfInputRow
        kz={kz.z9}
        label="davon Teilfreistellungsbeträge §§ 20, 21 InvStG"
        hint="Z. 9"
        value={staat.z9_teilfreistellung_invstg}
        onChange={(v) => setF("z9_teilfreistellung_invstg", v)}
      />
      <BmfInputRow
        kz={kz.z10}
        label="Abgezogene ausl. Steuern § 34c Abs. 2 EStG"
        hint="Z. 10 · Abzug statt Anrechnung"
        value={staat.z10_abgezogen_34c2}
        onChange={(v) => setF("z10_abgezogen_34c2", v)}
      />
      <BmfInputRow
        kz=""
        label="Abgezogene ausl. Steuern § 34c Abs. 3 EStG"
        hint="Z. 11"
        value={staat.z11_abgezogen_34c3}
        onChange={(v) => setF("z11_abgezogen_34c3", v)}
      />
      <BmfInputRow
        kz={kz.z12}
        label="Anzurechnende ausl. Steuern (§ 34c Abs. 1 EStG)"
        hint="Z. 12"
        value={staat.z12_anrechenbare}
        onChange={(v) => setF("z12_anrechenbare", v)}
      />
      <BmfInputRow
        kz=""
        label="davon fiktive ausländische Steuern nach DBA"
        hint="Z. 13 · in Z. 12 enthalten"
        value={staat.z13_fiktive_dba}
        onChange={(v) => setF("z13_fiktive_dba", v)}
      />
    </BmfSection>
  );
}

// ---------- Non-DBA row (Section 6) ------------------------------------

function NondbaRowBlock({
  idx,
  row,
  onChange,
}: {
  idx: string;
  row: NondbaRow;
  onChange: (updater: (r: NondbaRow) => NondbaRow) => void;
}) {
  const sum = row.noch_nicht_verrechnet + row.nicht_ausgleichsfaehig + row.positive_einkuenfte;
  const setF = <K extends keyof NondbaRow>(k: K, v: NondbaRow[K]) =>
    onChange((r) => ({ ...r, [k]: v }));
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">Zeile {idx} · Einkunftsquelle {Number(idx) - 30}</div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        zeile={idx}
        label="Staat"
        value={row.staat}
        onChange={(v) => setF("staat", v)}
      />
      <TextRow
        zeile={idx}
        label="§ 2a Abs. 1 Satz 1 Nr."
        value={row.par2a_nr}
        onChange={(v) => setF("par2a_nr", v)}
      />
      <BmfInputRow
        kz=""
        label="Noch nicht verrechnete Verluste 1985–2024"
        hint={`Z. ${idx}`}
        value={row.noch_nicht_verrechnet}
        onChange={(v) => setF("noch_nicht_verrechnet", v)}
      />
      <BmfInputRow
        kz=""
        label="Nicht ausgleichsfähige Verluste 2025"
        hint={`Z. ${idx}`}
        value={row.nicht_ausgleichsfaehig}
        onChange={(v) => setF("nicht_ausgleichsfaehig", v)}
      />
      <TextRow
        zeile={idx}
        label="Enthalten in Anlage / Zeile (Verluste)"
        value={row.anlage_zeile}
        onChange={(v) => setF("anlage_zeile", v)}
      />
      <BmfInputRow
        kz=""
        label="Positive Einkünfte 2025"
        hint={`Z. ${idx}`}
        value={row.positive_einkuenfte}
        onChange={(v) => setF("positive_einkuenfte", v)}
      />
      <TextRow
        zeile={idx}
        label="Enthalten in Anlage / Zeile (pos. Einkünfte)"
        value={row.anlage_zeile_pos}
        onChange={(v) => setF("anlage_zeile_pos", v)}
      />
      <BmfRow
        kz=""
        label={`Summe Z. ${idx} (Sp. 3 + 4 + 6 · auto)`}
        value={sum}
        subtotal
      />
    </>
  );
}

// ---------- DBA positive row (Section 7) -------------------------------

function DbaPosRowBlock({
  zeile,
  kz,
  row,
  onChange,
}: {
  zeile: string;
  kz: string;
  row: DbaSteuerfreiRow;
  onChange: (updater: (r: DbaSteuerfreiRow) => DbaSteuerfreiRow) => void;
}) {
  const setF = <K extends keyof DbaSteuerfreiRow>(k: K, v: DbaSteuerfreiRow[K]) =>
    onChange((r) => ({ ...r, [k]: v }));
  return (
    <>
      <TextRow
        zeile={zeile}
        label="Staat"
        value={row.staat}
        onChange={(v) => setF("staat", v)}
      />
      <TextRow
        zeile={zeile}
        label="Einkunftsquelle"
        value={row.einkunftsquelle}
        onChange={(v) => setF("einkunftsquelle", v)}
      />
      <TextRow
        zeile={zeile}
        label="Einkunftsart"
        value={row.einkunftsart}
        onChange={(v) => setF("einkunftsart", v)}
      />
      <BmfInputRow
        kz={kz}
        label="Einkünfte (DBA-steuerfrei mit Progressionsvorbehalt)"
        hint={`Z. ${zeile}`}
        value={row.einkuenfte}
        onChange={(v) => setF("einkuenfte", v)}
      />
    </>
  );
}

// ---------- DBA negative row (Section 10) ------------------------------

function DbaNegRowBlock({
  idx,
  row,
  onChange,
}: {
  idx: string;
  row: DbaNegativeRow;
  onChange: (updater: (r: DbaNegativeRow) => DbaNegativeRow) => void;
}) {
  const sum = row.noch_nicht_verrechnet + row.nicht_ausgleichsfaehig + row.positive_einkuenfte;
  const setF = <K extends keyof DbaNegativeRow>(k: K, v: DbaNegativeRow[K]) =>
    onChange((r) => ({ ...r, [k]: v }));
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">Zeile {idx} · Einkunftsquelle {Number(idx) - 47}</div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        zeile={idx}
        label="Staat"
        value={row.staat}
        onChange={(v) => setF("staat", v)}
      />
      <TextRow
        zeile={idx}
        label="§ 2a Abs. 1 Satz 1 Nr."
        value={row.par2a_nr}
        onChange={(v) => setF("par2a_nr", v)}
      />
      <BmfInputRow
        kz=""
        label="Noch nicht verrechnete Verluste 1985–2024"
        hint={`Z. ${idx}`}
        value={row.noch_nicht_verrechnet}
        onChange={(v) => setF("noch_nicht_verrechnet", v)}
      />
      <BmfInputRow
        kz=""
        label="Nicht ausgleichsfähige Verluste 2025"
        hint={`Z. ${idx}`}
        value={row.nicht_ausgleichsfaehig}
        onChange={(v) => setF("nicht_ausgleichsfaehig", v)}
      />
      <BmfInputRow
        kz=""
        label="Positive Einkünfte 2025"
        hint={`Z. ${idx}`}
        value={row.positive_einkuenfte}
        onChange={(v) => setF("positive_einkuenfte", v)}
      />
      <TextRow
        zeile={idx}
        label="Positive Summe enthalten in Anlage / Zeile"
        value={row.anlage_zeile}
        onChange={(v) => setF("anlage_zeile", v)}
      />
      <BmfRow
        kz=""
        label={`Summe Z. ${idx} (Sp. 3 + 4 + 5 · auto)`}
        value={sum}
        subtotal
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
}: {
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={280}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

