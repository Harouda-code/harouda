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

// § 35c EStG: 3-Jahres-Verteilung 7 % / 7 % / 6 %, Deckel 40.000 € pro Objekt
const MAX_BEGUENSTIGT_PRO_JAHR_1_2 = 14000; // 7 % × 200.000
const MAX_BEGUENSTIGT_JAHR_3 = 12000;

type Miteigentuemer = {
  name: string;
  geburtsdatum: string;
  adresse: string;
  steuernummer: string;
};

const EMPTY_MITEIG: Miteigentuemer = {
  name: "",
  geburtsdatum: "",
  adresse: "",
  steuernummer: "",
};

type Feststellung = {
  gemeinschaft: string;
  finanzamt: string;
  steuernummer: string;
  aktenzeichen: string;
  anteil_pct: number;
  aufw_2025: number;
  aufw_energieberater_2025: number;
  aufw_2024: number;
  aufw_2023: number;
};

const EMPTY_FESTSTELLUNG: Feststellung = {
  gemeinschaft: "",
  finanzamt: "",
  steuernummer: "",
  aktenzeichen: "",
  anteil_pct: 0,
  aufw_2025: 0,
  aufw_energieberater_2025: 0,
  aufw_2024: 0,
  aufw_2023: 0,
};

type AnlageEM = {
  // Section 1
  z4_strasse: string;
  z5_plzort: string;
  z6_herstellungsbeginn: string;
  z7_aktenzeichen: string;
  z8_gesamtflaeche: number;
  z8_wohnflaeche: number;
  z9_vorher_steuerermaessigung: JaNein;

  // Section 2
  z10_foerderung_beantragt: JaNein;
  z11_baubeginn: string;
  z12_waerme_waende: number;
  z13_waerme_dach: number;
  z14_waerme_decken: number;
  z15_fenster: number;
  z16_sommer_waerme: number;
  z17_lueftung: number;
  z18_heizung: number;
  z19_digital: number;
  z20_heizung_optim: number;
  z21_bescheinigung: number;
  z23_energieberater: number;
  z24_hybrid: number;
  z25_hybrid_nachweis: JaNein;

  // Section 3
  z26_in_z21_ag: number;
  z27_in_z22_ag: number;

  // Section 4
  z28_anerkannt_2024: number;
  z29_anerkannt_2023: number;

  // Section 5
  miteigentuemer_aktiv: boolean;
  z30_anteil_a: number;
  z30_anteil_b: number;
  miteig: [Miteigentuemer, Miteigentuemer, Miteigentuemer, Miteigentuemer];

  // Section 6
  feststellung_a_aktiv: boolean;
  feststellung_a: Feststellung;
  // Section 7
  feststellung_b_aktiv: boolean;
  feststellung_b: Feststellung;
};

function fill4<T>(v: T): [T, T, T, T] {
  return [v, v, v, v];
}

const DEFAULT: AnlageEM = {
  z4_strasse: "",
  z5_plzort: "",
  z6_herstellungsbeginn: "",
  z7_aktenzeichen: "",
  z8_gesamtflaeche: 0,
  z8_wohnflaeche: 0,
  z9_vorher_steuerermaessigung: "",
  z10_foerderung_beantragt: "",
  z11_baubeginn: "",
  z12_waerme_waende: 0,
  z13_waerme_dach: 0,
  z14_waerme_decken: 0,
  z15_fenster: 0,
  z16_sommer_waerme: 0,
  z17_lueftung: 0,
  z18_heizung: 0,
  z19_digital: 0,
  z20_heizung_optim: 0,
  z21_bescheinigung: 0,
  z23_energieberater: 0,
  z24_hybrid: 0,
  z25_hybrid_nachweis: "",
  z26_in_z21_ag: 0,
  z27_in_z22_ag: 0,
  z28_anerkannt_2024: 0,
  z29_anerkannt_2023: 0,
  miteigentuemer_aktiv: false,
  z30_anteil_a: 100,
  z30_anteil_b: 0,
  miteig: fill4(EMPTY_MITEIG),
  feststellung_a_aktiv: false,
  feststellung_a: EMPTY_FESTSTELLUNG,
  feststellung_b_aktiv: false,
  feststellung_b: EMPTY_FESTSTELLUNG,
};

const FORM_ID = "anlage-em";

function loadForm(mandantId: string | null, jahr: number): AnlageEM {
  const parsed = readEstForm<Partial<AnlageEM>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    miteig:
      Array.isArray(parsed.miteig) && parsed.miteig.length === 4
        ? (parsed.miteig.map((m) => ({
            ...EMPTY_MITEIG,
            ...(m ?? {}),
          })) as AnlageEM["miteig"])
        : DEFAULT.miteig,
    feststellung_a: {
      ...EMPTY_FESTSTELLUNG,
      ...(parsed.feststellung_a ?? {}),
    },
    feststellung_b: {
      ...EMPTY_FESTSTELLUNG,
      ...(parsed.feststellung_b ?? {}),
    },
  };
}

// ---------- Main page --------------------------------------------------

export default function AnlageEnergetischeMassnahmenPage() {
  return (
    <MandantRequiredGuard>
      <AnlageEnergetischeMassnahmenPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageEnergetischeMassnahmenPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageEM>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageEM>(key: K, value: AnlageEM[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateFeststellung(
    which: "feststellung_a" | "feststellung_b",
    updater: (f: Feststellung) => Feststellung
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  function updateMiteig(
    idx: 0 | 1 | 2 | 3,
    updater: (m: Miteigentuemer) => Miteigentuemer
  ) {
    setForm((f) => {
      const next = [...f.miteig] as AnlageEM["miteig"];
      next[idx] = updater(next[idx]);
      return { ...f, miteig: next };
    });
  }

  // Z. 22 = sum of Z. 12–21
  const z22 = useMemo(
    () =>
      form.z12_waerme_waende +
      form.z13_waerme_dach +
      form.z14_waerme_decken +
      form.z15_fenster +
      form.z16_sommer_waerme +
      form.z17_lueftung +
      form.z18_heizung +
      form.z19_digital +
      form.z20_heizung_optim +
      form.z21_bescheinigung,
    [
      form.z12_waerme_waende,
      form.z13_waerme_dach,
      form.z14_waerme_decken,
      form.z15_fenster,
      form.z16_sommer_waerme,
      form.z17_lueftung,
      form.z18_heizung,
      form.z19_digital,
      form.z20_heizung_optim,
      form.z21_bescheinigung,
    ]
  );

  // § 35c Steuerermäßigung (Jahr 1) — 7 % der Aufwendungen, max. 14.000 €
  // Plus 50 % der Energieberater-Kosten (nicht auf 40.000 €-Deckel anrechenbar)
  const jahr1Ermaessigung = useMemo(() => {
    const massnahmen7pct = z22 * 0.07;
    const kappungJahr1 = Math.min(massnahmen7pct, MAX_BEGUENSTIGT_PRO_JAHR_1_2);
    const energieberater50 = form.z23_energieberater * 0.5;
    return {
      massnahmen7pct: Math.round(massnahmen7pct * 100) / 100,
      kappungJahr1: Math.round(kappungJahr1 * 100) / 100,
      energieberater50: Math.round(energieberater50 * 100) / 100,
      gesamt: Math.round((kappungJahr1 + energieberater50) * 100) / 100,
    };
  }, [z22, form.z23_energieberater]);

  function validate(): string[] {
    const warns: string[] = [];
    if (form.z8_wohnflaeche > form.z8_gesamtflaeche) {
      warns.push("Z. 8: Wohnfläche > Gesamtfläche.");
    }
    if (form.z9_vorher_steuerermaessigung === "ja") {
      warns.push(
        "Z. 9: Wurde bereits § 35c für dieses Objekt in Anspruch genommen — max. einmal je Objekt zulässig (§ 35c Abs. 5 EStG)."
      );
    }
    if (form.z10_foerderung_beantragt === "ja") {
      warns.push(
        "Z. 10: KfW/BAFA/§ 35a-Förderung beantragt — dieselben Aufwendungen nicht zusätzlich nach § 35c absetzbar."
      );
    }
    if (form.z6_herstellungsbeginn) {
      const baujahr = Number(form.z6_herstellungsbeginn.slice(0, 4));
      const aktuellesJahr = selectedYear;
      if (baujahr > 0 && aktuellesJahr - baujahr < 10) {
        warns.push(
          `Gebäude-Alter < 10 Jahre (${aktuellesJahr - baujahr} Jahre) — § 35c Abs. 1 Satz 2 EStG: nicht begünstigt.`
        );
      }
    }
    if (form.z24_hybrid > 0 && form.z25_hybrid_nachweis !== "ja") {
      warns.push(
        "Z. 24/25: Hybridisierungs-Betrag erfasst aber kein Nachweis (Z. 25 = Ja)."
      );
    }
    const pctSum =
      form.z30_anteil_a +
      form.z30_anteil_b +
      form.miteig.reduce((s, _m) => s + 0, 0); // Miteigentümer % wird nicht einzeln erfasst
    if (form.miteigentuemer_aktiv && Math.abs(pctSum - 100) > 0.01) {
      warns.push(
        `Miteigentumsanteile (Person A ${form.z30_anteil_a} % + Person B ${form.z30_anteil_b} %) = ${pctSum} % — sollte ohne weitere Miteigentümer 100 % ergeben.`
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 9000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-em"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-em",
      summary: `Anlage Energetische Maßnahmen gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-em",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        z22,
        jahr1Ermaessigung,
        form,
      },
    });
    toast.success("Anlage Energetische Maßnahmen gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage Energetische Maßnahmen</h1>
          <p>
            Steuerermäßigung für energetische Gebäudesanierung (§ 35c EStG) ·
            VZ {selectedYear}.
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
          Anlage EM · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-em" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>§ 35c EStG — 3-Jahres-Verteilung:</strong> Jahr 1: 7 % (max{" "}
          {euro.format(MAX_BEGUENSTIGT_PRO_JAHR_1_2)}) · Jahr 2: 7 % (max{" "}
          {euro.format(MAX_BEGUENSTIGT_PRO_JAHR_1_2)}) · Jahr 3: 6 % (max{" "}
          {euro.format(MAX_BEGUENSTIGT_JAHR_3)}). Energieberater (Z. 23): 50 %
          sofort, ohne Deckel-Anrechnung. Voraussetzung: Gebäude ≥ 10 Jahre
          alt, eigene Wohnzwecke, Fachunternehmer- oder § 88 GEG-Bescheinigung.
        </div>
      </aside>

      <BmfForm
        title="Anlage Energetische Maßnahmen"
        subtitle={`§ 35c EStG · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Begünstigtes Objekt (Z. 4–9)">
          <TextRow
            kz="301"
            zeile="4"
            label="Straße, Hausnummer"
            value={form.z4_strasse}
            onChange={(v) => set("z4_strasse", v)}
          />
          <TextRow
            kz=""
            zeile="5"
            label="PLZ, Ort (ggf. ausländischer Staat)"
            value={form.z5_plzort}
            onChange={(v) => set("z5_plzort", v)}
          />
          <DateRow
            kz="300"
            zeile="6"
            label="Herstellungsbeginn des Gebäudes"
            value={form.z6_herstellungsbeginn}
            onChange={(v) => set("z6_herstellungsbeginn", v)}
          />
          <TextRow
            kz=""
            zeile="7"
            label="Aktenzeichen Grundsteuermess (ohne Sonderzeichen)"
            value={form.z7_aktenzeichen}
            onChange={(v) => set("z7_aktenzeichen", v)}
          />
          <BmfInputRow
            kz="303"
            label="Gesamtfläche (m²)"
            hint="Z. 8"
            value={form.z8_gesamtflaeche}
            onChange={(v) => set("z8_gesamtflaeche", v)}
          />
          <BmfInputRow
            kz="304"
            label="davon eigene Wohnzwecke / unentgeltliche Überlassung (m²)"
            hint="Z. 8"
            value={form.z8_wohnflaeche}
            onChange={(v) => set("z8_wohnflaeche", v)}
          />
          <JaNeinRow
            kz="308"
            zeile="9"
            label="In der Vergangenheit bereits Steuerermäßigung § 35c in Anspruch genommen?"
            value={form.z9_vorher_steuerermaessigung}
            onChange={(v) => set("z9_vorher_steuerermaessigung", v)}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Energetische Maßnahmen 2025 (Z. 10–25)"
          description="Nur Aufwendungen, für die KEINE andere Förderung (KfW/BAFA/§ 35a) beantragt oder in Anspruch genommen wurde."
          total={z22}
        >
          <JaNeinRow
            kz="309"
            zeile="10"
            label="Andere Förderung (KfW / BAFA / Sanierungsgebiet / § 35a) beantragt/erhalten?"
            value={form.z10_foerderung_beantragt}
            onChange={(v) => set("z10_foerderung_beantragt", v)}
          />
          <DateRow
            kz="305"
            zeile="11"
            label="Baubeginn der energetischen Maßnahme"
            value={form.z11_baubeginn}
            onChange={(v) => set("z11_baubeginn", v)}
          />
          <BmfInputRow
            kz=""
            label="Wärmedämmung Wände"
            hint="Z. 12"
            value={form.z12_waerme_waende}
            onChange={(v) => set("z12_waerme_waende", v)}
          />
          <BmfInputRow
            kz=""
            label="Wärmedämmung Dachflächen"
            hint="Z. 13"
            value={form.z13_waerme_dach}
            onChange={(v) => set("z13_waerme_dach", v)}
          />
          <BmfInputRow
            kz=""
            label="Wärmedämmung Geschossdecken"
            hint="Z. 14"
            value={form.z14_waerme_decken}
            onChange={(v) => set("z14_waerme_decken", v)}
          />
          <BmfInputRow
            kz=""
            label="Erneuerung Fenster / Außentüren"
            hint="Z. 15"
            value={form.z15_fenster}
            onChange={(v) => set("z15_fenster", v)}
          />
          <BmfInputRow
            kz=""
            label="Sommerlicher Wärmeschutz (Ersatz / erstmaliger Einbau)"
            hint="Z. 16"
            value={form.z16_sommer_waerme}
            onChange={(v) => set("z16_sommer_waerme", v)}
          />
          <BmfInputRow
            kz=""
            label="Lüftungsanlage (Erneuerung / Einbau)"
            hint="Z. 17"
            value={form.z17_lueftung}
            onChange={(v) => set("z17_lueftung", v)}
          />
          <BmfInputRow
            kz=""
            label="Erneuerung Heizungsanlage"
            hint="Z. 18 · siehe Z. 24/25 Hybrid"
            value={form.z18_heizung}
            onChange={(v) => set("z18_heizung", v)}
          />
          <BmfInputRow
            kz=""
            label="Digitale Systeme zur energetischen Optimierung"
            hint="Z. 19"
            value={form.z19_digital}
            onChange={(v) => set("z19_digital", v)}
          />
          <BmfInputRow
            kz=""
            label="Optimierung bestehender Heizung (Anlage > 2 Jahre)"
            hint="Z. 20"
            value={form.z20_heizung_optim}
            onChange={(v) => set("z20_heizung_optim", v)}
          />
          <BmfInputRow
            kz=""
            label="Bescheinigung § 88 GEG (Aussteller-Kosten)"
            hint="Z. 21"
            value={form.z21_bescheinigung}
            onChange={(v) => set("z21_bescheinigung", v)}
          />
          <BmfRow
            kz="310"
            label="Summe Aufwendungen energetische Maßnahmen Z. 22 (auto = Z. 12–21)"
            value={z22}
            subtotal
          />
          <BmfInputRow
            kz="311"
            label="Energieberater — planerische Begleitung / Beaufsichtigung"
            hint="Z. 23 · 50 % sofort absetzbar, eigener Deckel"
            value={form.z23_energieberater}
            onChange={(v) => set("z23_energieberater", v)}
          />
          <BmfInputRow
            kz="312"
            label="davon Gasbrennwert mit Hybridisierungs-Vorbereitung (in Z. 17)"
            hint="Z. 24"
            value={form.z24_hybrid}
            onChange={(v) => set("z24_hybrid", v)}
          />
          <JaNeinRow
            kz="313"
            zeile="25"
            label="Nachweis zur Hybridisierung liegt vor und wird in Kopie eingereicht"
            value={form.z25_hybrid_nachweis}
            onChange={(v) => set("z25_hybrid_nachweis", v)}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection
          title="3. Außergewöhnliche Belastungen (Z. 26–27)"
          description="Nur ausfüllen, wenn in Z. 21/22 enthaltene Aufwendungen stattdessen als außergewöhnliche Belastung nach § 33 EStG abgezogen werden sollen."
        >
          <BmfInputRow
            kz="314"
            label="In Z. 21 enthalten — Abzug als außergew. Belastung"
            hint="Z. 26"
            value={form.z26_in_z21_ag}
            onChange={(v) => set("z26_in_z21_ag", v)}
          />
          <BmfInputRow
            kz="315"
            label="In Z. 22 enthalten — Abzug als außergew. Belastung"
            hint="Z. 27"
            value={form.z27_in_z22_ag}
            onChange={(v) => set("z27_in_z22_ag", v)}
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection
          title="4. Anerkannte Aufwendungen der Vorjahre (Z. 28–29)"
          description="Aus den Erläuterungen des ESt-Bescheids 2024 bzw. 2023 — Basis für die 2. und 3. Tranche der 3-Jahres-Verteilung."
        >
          <BmfInputRow
            kz="317"
            label="Anerkannte Aufwendungen 2024"
            hint="Z. 28"
            value={form.z28_anerkannt_2024}
            onChange={(v) => set("z28_anerkannt_2024", v)}
          />
          <BmfInputRow
            kz="318"
            label="Anerkannte Aufwendungen 2023"
            hint="Z. 29"
            value={form.z29_anerkannt_2023}
            onChange={(v) => set("z29_anerkannt_2023", v)}
          />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection
          title="5. Miteigentumsanteile (Z. 30–38)"
          description="Nur ausfüllen, wenn das Objekt mehreren Personen gehört UND der Anteil an der Steuerermäßigung NICHT gesondert und einheitlich festgestellt wird."
        >
          <label
            className="form-field kontenplan__toggle--form no-print"
            style={{ padding: "8px 10px" }}
          >
            <input
              type="checkbox"
              checked={form.miteigentuemer_aktiv}
              onChange={(e) => set("miteigentuemer_aktiv", e.target.checked)}
            />
            <span>Miteigentumsanteile erfassen</span>
          </label>

          {form.miteigentuemer_aktiv && (
            <>
              <PercentRow
                kz="306"
                zeile="30"
                label="Miteigentumsanteil Person A (%)"
                value={form.z30_anteil_a}
                onChange={(v) => set("z30_anteil_a", v)}
              />
              <PercentRow
                kz="307"
                zeile="30"
                label="Miteigentumsanteil Person B (%)"
                value={form.z30_anteil_b}
                onChange={(v) => set("z30_anteil_b", v)}
              />
              {[0, 1, 2, 3].map((i) => (
                <MiteigentuemerBlock
                  key={i}
                  nummer={i + 1}
                  zeilen={{
                    identity: String(31 + i * 2),
                    adresse: String(32 + i * 2),
                  }}
                  miteig={form.miteig[i]}
                  onChange={(u) => updateMiteig(i as 0 | 1 | 2 | 3, u)}
                />
              ))}
            </>
          )}
        </BmfSection>

        {/* ============ Section 6 ============ */}
        <BmfSection
          title="6. Gesonderte und einheitliche Feststellung — Person A (Z. 39–47)"
          description="Nur ausfüllen, wenn die Steuerermäßigung über eine Gemeinschaft/Gesellschaft festgestellt wird."
        >
          <label
            className="form-field kontenplan__toggle--form no-print"
            style={{ padding: "8px 10px" }}
          >
            <input
              type="checkbox"
              checked={form.feststellung_a_aktiv}
              onChange={(e) => set("feststellung_a_aktiv", e.target.checked)}
            />
            <span>Gesonderte Feststellung Person A erfassen</span>
          </label>

          {form.feststellung_a_aktiv && (
            <FeststellungBlock
              zeilenBasis={39}
              kzAktenzeichen="400"
              kzAnteil="401"
              kzAufw2025="402"
              kzEnergieberater="403"
              kzAufw2024="404"
              kzAufw2023="405"
              data={form.feststellung_a}
              onChange={(u) => updateFeststellung("feststellung_a", u)}
            />
          )}
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection
          title="7. Gesonderte und einheitliche Feststellung — Person B (Z. 48–56)"
          description="Analoger Block für Person B bei Zusammenveranlagung."
        >
          <label
            className="form-field kontenplan__toggle--form no-print"
            style={{ padding: "8px 10px" }}
          >
            <input
              type="checkbox"
              checked={form.feststellung_b_aktiv}
              onChange={(e) => set("feststellung_b_aktiv", e.target.checked)}
            />
            <span>Gesonderte Feststellung Person B erfassen</span>
          </label>

          {form.feststellung_b_aktiv && (
            <FeststellungBlock
              zeilenBasis={48}
              kzAktenzeichen="410"
              kzAnteil="411"
              kzAufw2025="412"
              kzEnergieberater="413"
              kzAufw2024="414"
              kzAufw2023="415"
              data={form.feststellung_b}
              onChange={(u) => updateFeststellung("feststellung_b", u)}
            />
          )}
        </BmfSection>

        {/* Info-Ergebnis */}
        <BmfRow
          kz=""
          label={`Info · 7 % von Z. 22 (Maßnahmen) = ${euro.format(jahr1Ermaessigung.massnahmen7pct)}`}
          value={jahr1Ermaessigung.kappungJahr1}
          subtotal
        />
        <BmfRow
          kz=""
          label={`Info · 50 % Energieberater (Z. 23) = ${euro.format(jahr1Ermaessigung.energieberater50)}`}
          value={jahr1Ermaessigung.energieberater50}
          subtotal
        />
        <BmfResult
          label="Info · Steuerermäßigung Jahr 1 gesamt (ohne Feststellungs-Anteile)"
          value={jahr1Ermaessigung.gesamt}
          variant={jahr1Ermaessigung.gesamt > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift(en)" />

        <BmfFootnotes>
          <p>
            <strong>§ 35c EStG — Berechnungsschema:</strong> Jahr 1 = 7 % ×
            Aufwendungen (Deckel {euro.format(MAX_BEGUENSTIGT_PRO_JAHR_1_2)}) ·
            Jahr 2 = 7 % (gleicher Deckel) · Jahr 3 = 6 % (Deckel{" "}
            {euro.format(MAX_BEGUENSTIGT_JAHR_3)}). Zusätzlich 50 % der
            Energieberater-Kosten bereits im Jahr der Zahlung, ohne
            Anrechnung auf den 40.000 €-Objekt-Deckel.
          </p>
          <p>
            <strong>Voraussetzungen:</strong> Gebäude ≥ 10 Jahre alt bei
            Baubeginn der Maßnahme · Nutzung zu eigenen Wohnzwecken oder
            unentgeltliche Überlassung · Fachunternehmer-Bescheinigung oder
            Bescheinigung § 88 GEG · Ausschluss bei KfW/BAFA/§ 35a-Förderung
            derselben Aufwendungen.
          </p>
          <p>
            <strong>Hybridisierung (Z. 24/25):</strong> Gasbrennwerttechnik
            ist begünstigt, wenn sie für spätere erneuerbare-Energien-
            Einbindung vorbereitet ist. Nachweis-Kopie beifügen.
          </p>
          <p>
            <strong>Z. 22 Auto-Summe:</strong> aus Z. 12–21. Z. 23
            Energieberater zählt getrennt.
          </p>
          <p>
            <strong>NICHT automatisch berechnet:</strong> 3-Jahres-
            Steuerermäßigungsfortschreibung über 2026/2027, Anrechnung der
            im Vorjahr bereits berücksichtigten Aufwendungen, Aufteilung der
            Steuerermäßigung bei Miteigentum, Günstigerprüfung § 35c vs.
            außergew. Belastung (§ 33), Deckel-Sharing bei Miteigentum.
          </p>
          <p>
            <strong>Erforderliche Unterlagen (in Kopie beifügen):</strong>{" "}
            Bescheinigung des ausführenden Fachunternehmens oder § 88 GEG-
            Bescheinigung · Rechnungen · Zahlungsnachweise · bei Hybrid:
            Nachweis der EE-Vorbereitung.
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> Objekt 300/301/303/304/308 ·
            Maßnahmen 305/309/310/311/312/313 · außergew. Belastung 314/315 ·
            Vorjahre 317/318 · Miteig. 306/307 · Feststellung A 400–405 ·
            Feststellung B 410–415.
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

// ---------- Miteigentümer block ----------------------------------------

function MiteigentuemerBlock({
  nummer,
  zeilen,
  miteig,
  onChange,
}: {
  nummer: number;
  zeilen: { identity: string; adresse: string };
  miteig: Miteigentuemer;
  onChange: (updater: (m: Miteigentuemer) => Miteigentuemer) => void;
}) {
  const setF = <K extends keyof Miteigentuemer>(
    k: K,
    v: Miteigentuemer[K]
  ) => onChange((m) => ({ ...m, [k]: v }));
  return (
    <>
      <div
        className="bmf-form__row"
        style={{ background: "#eef1f6", fontWeight: 600 }}
      >
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div className="bmf-form__label">
          Weiterer Miteigentümer Nr. {nummer}
        </div>
        <div className="bmf-form__amount">—</div>
      </div>
      <TextRow
        kz=""
        zeile={zeilen.identity}
        label="Name, Vorname · Geburtsdatum"
        value={
          miteig.name || miteig.geburtsdatum
            ? `${miteig.name} · ${miteig.geburtsdatum}`.replace(/^ · $/, "")
            : ""
        }
        onChange={(v) => {
          const parts = v.split(" · ");
          setF("name", parts[0] ?? "");
          setF("geburtsdatum", parts[1] ?? "");
        }}
      />
      <TextRow
        kz=""
        zeile={zeilen.adresse}
        label="Adresse · Steuernummer"
        value={
          miteig.adresse || miteig.steuernummer
            ? `${miteig.adresse} · ${miteig.steuernummer}`.replace(/^ · $/, "")
            : ""
        }
        onChange={(v) => {
          const parts = v.split(" · ");
          setF("adresse", parts[0] ?? "");
          setF("steuernummer", parts[1] ?? "");
        }}
      />
    </>
  );
}

// ---------- Feststellung block ----------------------------------------

function FeststellungBlock({
  zeilenBasis,
  kzAktenzeichen,
  kzAnteil,
  kzAufw2025,
  kzEnergieberater,
  kzAufw2024,
  kzAufw2023,
  data,
  onChange,
}: {
  zeilenBasis: number;
  kzAktenzeichen: string;
  kzAnteil: string;
  kzAufw2025: string;
  kzEnergieberater: string;
  kzAufw2024: string;
  kzAufw2023: string;
  data: Feststellung;
  onChange: (updater: (f: Feststellung) => Feststellung) => void;
}) {
  const setF = <K extends keyof Feststellung>(k: K, v: Feststellung[K]) =>
    onChange((f) => ({ ...f, [k]: v }));
  return (
    <>
      <TextRow
        kz=""
        zeile={String(zeilenBasis)}
        label="Gemeinschaft / Gesellschaft"
        value={data.gemeinschaft}
        onChange={(v) => setF("gemeinschaft", v)}
      />
      <TextRow
        kz=""
        zeile={String(zeilenBasis + 1)}
        label="Finanzamt"
        value={data.finanzamt}
        onChange={(v) => setF("finanzamt", v)}
      />
      <TextRow
        kz=""
        zeile={String(zeilenBasis + 2)}
        label="Steuernummer"
        value={data.steuernummer}
        onChange={(v) => setF("steuernummer", v)}
      />
      <TextRow
        kz={kzAktenzeichen}
        zeile={String(zeilenBasis + 3)}
        label="Aktenzeichen Grundsteuermess"
        value={data.aktenzeichen}
        onChange={(v) => setF("aktenzeichen", v)}
      />
      <PercentRow
        kz={kzAnteil}
        zeile={String(zeilenBasis + 4)}
        label="Festgestellter Anteil an der Steuerermäßigung (%)"
        value={data.anteil_pct}
        onChange={(v) => setF("anteil_pct", v)}
      />
      <BmfInputRow
        kz={kzAufw2025}
        label="Festgestellte Aufwendungen energetisch 2025"
        hint={`Z. ${zeilenBasis + 5}`}
        value={data.aufw_2025}
        onChange={(v) => setF("aufw_2025", v)}
      />
      <BmfInputRow
        kz={kzEnergieberater}
        label="Festgestellte Aufwendungen Energieberater 2025"
        hint={`Z. ${zeilenBasis + 6}`}
        value={data.aufw_energieberater_2025}
        onChange={(v) => setF("aufw_energieberater_2025", v)}
      />
      <BmfInputRow
        kz={kzAufw2024}
        label="Festgestellte Aufwendungen energetisch 2024"
        hint={`Z. ${zeilenBasis + 7}`}
        value={data.aufw_2024}
        onChange={(v) => setF("aufw_2024", v)}
      />
      <BmfInputRow
        kz={kzAufw2023}
        label="Festgestellte Aufwendungen energetisch 2023"
        hint={`Z. ${zeilenBasis + 8}`}
        value={data.aufw_2023}
        onChange={(v) => setF("aufw_2023", v)}
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
}: {
  kz: string;
  zeile: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <WideRow kz={kz} zeile={zeile} label={label} wide={280}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
