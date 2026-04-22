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

type JaNein = "ja" | "nein" | "";
type Paired = { a: number; b: number };

// ---------- State shape ------------------------------------------------

type AnlageSO = {
  zusammenveranlagung: boolean;

  // --- Section 1: Wiederkehrende Bezüge (Z. 4–13) ---
  z4_bezeichnung_a: string; // Kz 158
  z4_bezeichnung_b: string; // Kz 159
  z5_unterhalt: Paired; // Kz 146/147
  z6_kvpv: Paired; // Kz 148/149
  z7_kv_mit_krankengeld: Paired; // Kz 150/151
  z8_versorgung: Paired; // Kz 140/141
  z9_ausgleich_vermeidung: Paired; // Kz 144/145
  z10_ausgleichszahlungen: Paired; // Kz 142/143
  z11_werbungskosten: Paired; // Kz 160/161
  z12_bezuege_teileinkuenfte: Paired; // Kz 180/181
  z13_wk_teileinkuenfte: Paired; // Kz 182/183

  // --- Section 2: Kryptowerte und weitere Leistungen (Z. 14–22) ---
  z14_hat_krypto_a: JaNein;
  z14_hat_krypto_b: JaNein;
  z15_bezeichnung: string;
  z15_betrag: Paired;
  z16_bezeichnung: string;
  z16_betrag: Paired;
  z17_bezeichnung: string;
  z17_betrag: Paired;
  z19_werbungskosten: Paired; // Kz 176/177
  z21_wirtschaftsId_a: string;
  z21_wirtschaftsId_b: string;
  z22_verlustruecktrag_verzicht_a: JaNein;
  z22_verlustruecktrag_verzicht_b: JaNein;

  // --- Section 3: Abgeordnetenbezüge (Z. 23–32) ---
  z23_einnahmen: Paired; // Kz 200/201
  z24_versorgung_enthalten: Paired; // Kz 202/203
  z25_bemessung: Paired; // Kz 204/205
  z26_jahr_versorgungsbeginn_a: number;
  z26_jahr_versorgungsbeginn_b: number;
  z27_erster_monat_a: number;
  z27_erster_monat_b: number;
  z27_letzter_monat_a: number;
  z27_letzter_monat_b: number;
  z28_sterbegeld: Paired; // Kz 210/211
  z29_mehrjahr: Paired; // Kz 212/213
  z30_mehrjahr_versorgung: Paired; // Kz 214/215
  z31_abg_werbungskosten: Paired; // Kz 218/219
  z32_anwartschaft_a: JaNein;
  z32_anwartschaft_b: JaNein;

  // --- Section 4: Steuerstundungsmodelle (Z. 33) ---
  z33_steuerstundung: Paired;

  // --- Section 5A: Private Veräußerungsgeschäfte — Grundstücke ---
  z34_bezeichnung: string;
  z35_anschaffung: string;
  z35_veraeusserung: string;
  z36_wohnung_von: string;
  z36_wohnung_bis: string;
  z36_wohnung_qm: number;
  z37_andere_von: string;
  z37_andere_bis: string;
  z37_andere_qm: number;
  z38_verausserungspreis: number;
  z39_anschaffungskosten: number;
  z40_afa: number;
  z41_werbungskosten: number;
  z43_zurechnung: Paired; // Kz 110/111
  z44_weitere: Paired; // Kz 112/113

  // --- Section 5B: Kryptowerte ---
  z45_hat_krypto_a: JaNein;
  z45_hat_krypto_b: JaNein;
  z46_bezeichnung: string;
  z47_anschaffung: string;
  z47_veraeusserung: string;
  z47_plattform: string;
  z48_verausserungspreis: number;
  z49_anschaffungskosten: number;
  z50_werbungskosten: number;

  // --- Section 5C: Andere Wirtschaftsgüter ---
  z52_art: string;
  z53_anschaffung: string;
  z53_veraeusserung: string;
  z54_verausserungspreis: number;
  z55_anschaffungskosten: number;
  z56_werbungskosten: number;
  z58_zurechnung: Paired; // Kz 114/115
  z59_weitere: Paired; // Kz 116/117

  // --- Section 5D: Anteile ---
  z60_bezeichnung_a: string;
  z61_finanzamt_a: string;
  z61_steuernummer_a: string;
  z62_anteil_a: number; // Kz 134
  z63_bezeichnung_b: string;
  z64_finanzamt_b: string;
  z64_steuernummer_b: string;
  z65_anteil_b: number; // Kz 135
  z66_verlustruecktrag_verzicht_a: JaNein;
  z66_verlustruecktrag_verzicht_b: JaNein;
};

const ZERO_PAIR: Paired = { a: 0, b: 0 };

const DEFAULT: AnlageSO = {
  zusammenveranlagung: false,
  z4_bezeichnung_a: "",
  z4_bezeichnung_b: "",
  z5_unterhalt: ZERO_PAIR,
  z6_kvpv: ZERO_PAIR,
  z7_kv_mit_krankengeld: ZERO_PAIR,
  z8_versorgung: ZERO_PAIR,
  z9_ausgleich_vermeidung: ZERO_PAIR,
  z10_ausgleichszahlungen: ZERO_PAIR,
  z11_werbungskosten: ZERO_PAIR,
  z12_bezuege_teileinkuenfte: ZERO_PAIR,
  z13_wk_teileinkuenfte: ZERO_PAIR,
  z14_hat_krypto_a: "",
  z14_hat_krypto_b: "",
  z15_bezeichnung: "",
  z15_betrag: ZERO_PAIR,
  z16_bezeichnung: "",
  z16_betrag: ZERO_PAIR,
  z17_bezeichnung: "",
  z17_betrag: ZERO_PAIR,
  z19_werbungskosten: ZERO_PAIR,
  z21_wirtschaftsId_a: "",
  z21_wirtschaftsId_b: "",
  z22_verlustruecktrag_verzicht_a: "",
  z22_verlustruecktrag_verzicht_b: "",
  z23_einnahmen: ZERO_PAIR,
  z24_versorgung_enthalten: ZERO_PAIR,
  z25_bemessung: ZERO_PAIR,
  z26_jahr_versorgungsbeginn_a: 0,
  z26_jahr_versorgungsbeginn_b: 0,
  z27_erster_monat_a: 0,
  z27_erster_monat_b: 0,
  z27_letzter_monat_a: 0,
  z27_letzter_monat_b: 0,
  z28_sterbegeld: ZERO_PAIR,
  z29_mehrjahr: ZERO_PAIR,
  z30_mehrjahr_versorgung: ZERO_PAIR,
  z31_abg_werbungskosten: ZERO_PAIR,
  z32_anwartschaft_a: "",
  z32_anwartschaft_b: "",
  z33_steuerstundung: ZERO_PAIR,
  z34_bezeichnung: "",
  z35_anschaffung: "",
  z35_veraeusserung: "",
  z36_wohnung_von: "",
  z36_wohnung_bis: "",
  z36_wohnung_qm: 0,
  z37_andere_von: "",
  z37_andere_bis: "",
  z37_andere_qm: 0,
  z38_verausserungspreis: 0,
  z39_anschaffungskosten: 0,
  z40_afa: 0,
  z41_werbungskosten: 0,
  z43_zurechnung: ZERO_PAIR,
  z44_weitere: ZERO_PAIR,
  z45_hat_krypto_a: "",
  z45_hat_krypto_b: "",
  z46_bezeichnung: "",
  z47_anschaffung: "",
  z47_veraeusserung: "",
  z47_plattform: "",
  z48_verausserungspreis: 0,
  z49_anschaffungskosten: 0,
  z50_werbungskosten: 0,
  z52_art: "",
  z53_anschaffung: "",
  z53_veraeusserung: "",
  z54_verausserungspreis: 0,
  z55_anschaffungskosten: 0,
  z56_werbungskosten: 0,
  z58_zurechnung: ZERO_PAIR,
  z59_weitere: ZERO_PAIR,
  z60_bezeichnung_a: "",
  z61_finanzamt_a: "",
  z61_steuernummer_a: "",
  z62_anteil_a: 0,
  z63_bezeichnung_b: "",
  z64_finanzamt_b: "",
  z64_steuernummer_b: "",
  z65_anteil_b: 0,
  z66_verlustruecktrag_verzicht_a: "",
  z66_verlustruecktrag_verzicht_b: "",
};

const FORM_ID = "anlage-so";

function loadForm(mandantId: string | null, jahr: number): AnlageSO {
  const parsed = readEstForm<Partial<AnlageSO> & Record<string, unknown>>(
    FORM_ID,
    mandantId,
    jahr
  );
  if (!parsed) return DEFAULT;
  try {
    // Migrate old TaxFormBuilder shape: Record<string,number> with
    // keys {renten, unterhalt, wiederkehrend, leistungen, …}
    if (
      !("zusammenveranlagung" in parsed) &&
      (typeof (parsed as Record<string, unknown>).renten === "number" ||
        typeof (parsed as Record<string, unknown>).unterhalt === "number" ||
        typeof (parsed as Record<string, unknown>).leistungen === "number")
    ) {
      const old = parsed as Record<string, number>;
      return {
        ...DEFAULT,
        z8_versorgung: { a: Number(old.renten) || 0, b: 0 },
        z5_unterhalt: { a: Number(old.unterhalt) || 0, b: 0 },
        z4_bezeichnung_a: old.wiederkehrend
          ? `Wiederkehrende Bezüge (${euro.format(Number(old.wiederkehrend) || 0)})`
          : "",
        z17_betrag: { a: Number(old.leistungen) || 0, b: 0 },
        z17_bezeichnung: old.leistungen ? "Leistungen §22 Nr. 3" : "",
        z11_werbungskosten: { a: Number(old.wk_renten) || 0, b: 0 },
        z41_werbungskosten: Number(old.ak_veraeusserung) || 0,
        z38_verausserungspreis: Number(old.veraeusserung_gewinn) || 0,
      };
    }
    return {
      ...DEFAULT,
      ...parsed,
      z5_unterhalt: { ...ZERO_PAIR, ...(parsed.z5_unterhalt ?? {}) },
      z6_kvpv: { ...ZERO_PAIR, ...(parsed.z6_kvpv ?? {}) },
      z7_kv_mit_krankengeld: {
        ...ZERO_PAIR,
        ...(parsed.z7_kv_mit_krankengeld ?? {}),
      },
      z8_versorgung: { ...ZERO_PAIR, ...(parsed.z8_versorgung ?? {}) },
      z9_ausgleich_vermeidung: {
        ...ZERO_PAIR,
        ...(parsed.z9_ausgleich_vermeidung ?? {}),
      },
      z10_ausgleichszahlungen: {
        ...ZERO_PAIR,
        ...(parsed.z10_ausgleichszahlungen ?? {}),
      },
      z11_werbungskosten: {
        ...ZERO_PAIR,
        ...(parsed.z11_werbungskosten ?? {}),
      },
      z12_bezuege_teileinkuenfte: {
        ...ZERO_PAIR,
        ...(parsed.z12_bezuege_teileinkuenfte ?? {}),
      },
      z13_wk_teileinkuenfte: {
        ...ZERO_PAIR,
        ...(parsed.z13_wk_teileinkuenfte ?? {}),
      },
      z15_betrag: { ...ZERO_PAIR, ...(parsed.z15_betrag ?? {}) },
      z16_betrag: { ...ZERO_PAIR, ...(parsed.z16_betrag ?? {}) },
      z17_betrag: { ...ZERO_PAIR, ...(parsed.z17_betrag ?? {}) },
      z19_werbungskosten: { ...ZERO_PAIR, ...(parsed.z19_werbungskosten ?? {}) },
      z23_einnahmen: { ...ZERO_PAIR, ...(parsed.z23_einnahmen ?? {}) },
      z24_versorgung_enthalten: {
        ...ZERO_PAIR,
        ...(parsed.z24_versorgung_enthalten ?? {}),
      },
      z25_bemessung: { ...ZERO_PAIR, ...(parsed.z25_bemessung ?? {}) },
      z28_sterbegeld: { ...ZERO_PAIR, ...(parsed.z28_sterbegeld ?? {}) },
      z29_mehrjahr: { ...ZERO_PAIR, ...(parsed.z29_mehrjahr ?? {}) },
      z30_mehrjahr_versorgung: {
        ...ZERO_PAIR,
        ...(parsed.z30_mehrjahr_versorgung ?? {}),
      },
      z31_abg_werbungskosten: {
        ...ZERO_PAIR,
        ...(parsed.z31_abg_werbungskosten ?? {}),
      },
      z33_steuerstundung: {
        ...ZERO_PAIR,
        ...(parsed.z33_steuerstundung ?? {}),
      },
      z43_zurechnung: { ...ZERO_PAIR, ...(parsed.z43_zurechnung ?? {}) },
      z44_weitere: { ...ZERO_PAIR, ...(parsed.z44_weitere ?? {}) },
      z58_zurechnung: { ...ZERO_PAIR, ...(parsed.z58_zurechnung ?? {}) },
      z59_weitere: { ...ZERO_PAIR, ...(parsed.z59_weitere ?? {}) },
    };
  } catch {
    return DEFAULT;
  }
}

// ---------- Main page --------------------------------------------------

export default function AnlageSOPage() {
  return (
    <MandantRequiredGuard>
      <AnlageSOPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageSOPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageSO>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageSO>(key: K, value: AnlageSO[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPair<K extends keyof AnlageSO>(
    key: K,
    side: "a" | "b",
    value: number
  ) {
    setForm((f) => {
      const prev = f[key] as unknown as Paired;
      return { ...f, [key]: { ...prev, [side]: value } };
    });
  }

  // --- Calcs ----------------------------------------------------------
  const z18 = useMemo(
    () => ({
      a: form.z15_betrag.a + form.z16_betrag.a + form.z17_betrag.a,
      b: form.z15_betrag.b + form.z16_betrag.b + form.z17_betrag.b,
    }),
    [form.z15_betrag, form.z16_betrag, form.z17_betrag]
  );

  const z20 = useMemo(
    () => ({
      a: z18.a - form.z19_werbungskosten.a,
      b: z18.b - form.z19_werbungskosten.b,
    }),
    [z18, form.z19_werbungskosten]
  );

  const z42 =
    form.z38_verausserungspreis -
    form.z39_anschaffungskosten +
    form.z40_afa -
    form.z41_werbungskosten;

  const z51 =
    form.z48_verausserungspreis -
    form.z49_anschaffungskosten -
    form.z50_werbungskosten;

  const z57 =
    form.z54_verausserungspreis -
    form.z55_anschaffungskosten -
    form.z56_werbungskosten;

  // § 23 EStG Freigrenze 1.000 € — honest note, not auto-enforced
  const freigrenze23 = 1000;
  const sumPrivat = z42 + z51 + z57;

  const sonstigeGesamt =
    (z20.a + z20.b) +
    // Abgeordnete: Einnahmen − WK
    (form.z23_einnahmen.a +
      form.z23_einnahmen.b +
      form.z29_mehrjahr.a +
      form.z29_mehrjahr.b -
      form.z31_abg_werbungskosten.a -
      form.z31_abg_werbungskosten.b) +
    sumPrivat;

  function validate(): string[] {
    const warns: string[] = [];
    if (form.z6_kvpv.a > form.z5_unterhalt.a)
      warns.push("Z. 6 > Z. 5 (Person A): KV/PV nicht größer als Unterhalt.");
    if (form.z6_kvpv.b > form.z5_unterhalt.b)
      warns.push("Z. 6 > Z. 5 (Person B): KV/PV nicht größer als Unterhalt.");
    if (form.z7_kv_mit_krankengeld.a > form.z6_kvpv.a)
      warns.push("Z. 7 > Z. 6 (Person A): Krankengeld-Anteil > KV/PV.");
    if (form.z7_kv_mit_krankengeld.b > form.z6_kvpv.b)
      warns.push("Z. 7 > Z. 6 (Person B): Krankengeld-Anteil > KV/PV.");
    if (form.z35_anschaffung && form.z35_veraeusserung) {
      if (form.z35_anschaffung > form.z35_veraeusserung) {
        warns.push(
          "Grundstück: Anschaffungsdatum liegt nach Veräußerungsdatum."
        );
      }
      const diff =
        (new Date(form.z35_veraeusserung).getTime() -
          new Date(form.z35_anschaffung).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      if (diff >= 10 && Math.abs(z42) > 0) {
        warns.push(
          `Grundstück: Haltedauer ≥ 10 Jahre — Veräußerung grundsätzlich steuerfrei (§ 23 Abs. 1 Nr. 1 EStG).`
        );
      }
    }
    if (form.z47_anschaffung && form.z47_veraeusserung) {
      const diff =
        (new Date(form.z47_veraeusserung).getTime() -
          new Date(form.z47_anschaffung).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      if (diff >= 1 && Math.abs(z51) > 0) {
        warns.push(
          "Kryptowerte: Haltedauer ≥ 1 Jahr — Veräußerung grundsätzlich steuerfrei (§ 23 Abs. 1 Nr. 2 EStG)."
        );
      }
    }
    if (Math.abs(sumPrivat) > 0 && Math.abs(sumPrivat) < freigrenze23) {
      warns.push(
        `Private Veräußerungsgewinne < ${euro.format(freigrenze23)} (Freigrenze § 23 Abs. 3 Satz 5 EStG) — bei Überschreiten GESAMT steuerpflichtig.`
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) {
      toast.warning(warns.join(" · "), { duration: 8000 });
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-so"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-so",
      summary: `Anlage SO gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-so",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        z18,
        z20,
        z42,
        z51,
        z57,
        sumPrivat,
        sonstigeGesamt,
        form,
      },
    });
    toast.success("Anlage SO gespeichert.");
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
          <h1>Anlage SO</h1>
          <p>
            Sonstige Einkünfte (§ 22 EStG) · wiederkehrende Bezüge,
            Kryptoeinnahmen, Abgeordnetenbezüge, private Veräußerungsgeschäfte
            (§ 23 EStG) · VZ {selectedYear}.
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
          Anlage SO · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-so" />

      <section className="card taxcalc__section no-print">
        <label className="form-field kontenplan__toggle--form">
          <input
            type="checkbox"
            checked={form.zusammenveranlagung}
            onChange={(e) => set("zusammenveranlagung", e.target.checked)}
          />
          <span>Zusammenveranlagung (Person B erfassen)</span>
        </label>
        <aside className="taxcalc__hint" style={{ marginTop: 8 }}>
          <Info size={14} />
          <span>
            § 23 Abs. 3 Satz 5 EStG: Private Veräußerungsgewinne sind steuerfrei,
            wenn der Gesamtgewinn unter {euro.format(freigrenze23)} bleibt —
            sonst in voller Höhe steuerpflichtig. Spekulationsfristen: 10 Jahre
            für Grundstücke, 1 Jahr für Kryptowerte/andere Wirtschaftsgüter.
            Haltedauer wird vom Gesetz auf Tagesbasis berechnet — diese Seite
            warnt bei Überschreiten.
          </span>
        </aside>
      </section>

      <BmfForm
        title="Anlage SO"
        subtitle={`Sonstige Einkünfte · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection
          title="1. Wiederkehrende Bezüge, Unterhalt, Versorgungsleistungen (Z. 4–13)"
          description="Renten (außer gesetzl. RV), Unterhalt aus Realsplitting (§ 10 Abs. 1a), Versorgungs- und Ausgleichsleistungen."
        >
          <TextPair
            zeile="4"
            label="Bezeichnung der Einnahmen aus wiederkehrenden Bezügen"
            kzA="158"
            kzB="159"
            valueA={form.z4_bezeichnung_a}
            valueB={form.z4_bezeichnung_b}
            onA={(v) => set("z4_bezeichnung_a", v)}
            onB={(v) => set("z4_bezeichnung_b", v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="5"
            label="Unterhaltsleistungen (soweit Realsplitting)"
            kzA="146"
            kzB="147"
            value={form.z5_unterhalt}
            onChange={(s, v) => setPair("z5_unterhalt", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="6"
            label="davon Basis-KV/PV"
            kzA="148"
            kzB="149"
            value={form.z6_kvpv}
            onChange={(s, v) => setPair("z6_kvpv", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="7"
            label="davon KV mit Krankengeld-Anspruch"
            kzA="150"
            kzB="151"
            value={form.z7_kv_mit_krankengeld}
            onChange={(s, v) => setPair("z7_kv_mit_krankengeld", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="8"
            label="Versorgungsleistungen (besondere Verpflichtungsgründe)"
            kzA="140"
            kzB="141"
            value={form.z8_versorgung}
            onChange={(s, v) => setPair("z8_versorgung", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="9"
            label="Ausgleichsleistungen zur Vermeidung Versorgungsausgleich"
            kzA="144"
            kzB="145"
            value={form.z9_ausgleich_vermeidung}
            onChange={(s, v) => setPair("z9_ausgleich_vermeidung", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="10"
            label="Ausgleichszahlungen im Rahmen Versorgungsausgleich"
            kzA="142"
            kzB="143"
            value={form.z10_ausgleichszahlungen}
            onChange={(s, v) => setPair("z10_ausgleichszahlungen", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="11"
            label="Werbungskosten zu Z. 4–10"
            kzA="160"
            kzB="161"
            value={form.z11_werbungskosten}
            onChange={(s, v) => setPair("z11_werbungskosten", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="12"
            label="Bezüge § 22 Nr. 1 Satz 2 EStG (Teileinkünfteverfahren)"
            kzA="180"
            kzB="181"
            value={form.z12_bezuege_teileinkuenfte}
            onChange={(s, v) => setPair("z12_bezuege_teileinkuenfte", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="13"
            label="Werbungskosten zu Z. 12"
            kzA="182"
            kzB="183"
            value={form.z13_wk_teileinkuenfte}
            onChange={(s, v) => setPair("z13_wk_teileinkuenfte", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Kryptowerte und weitere Leistungen (Z. 14–22)"
          description="Laufende Einnahmen aus Staking, Lending, Airdrops etc. — NICHT Veräußerungsgewinne (die stehen in Abschnitt 5)."
        >
          <JaNeinPair
            zeile="14"
            label="Einkünfte aus Mining / Forging / Staking / Lending / Airdrops?"
            kzA="162"
            kzB="163"
            valueA={form.z14_hat_krypto_a}
            valueB={form.z14_hat_krypto_b}
            onA={(v) => set("z14_hat_krypto_a", v)}
            onB={(v) => set("z14_hat_krypto_b", v)}
            zus={zus}
          />
          <TextSingleRow
            zeile="15"
            label="Einnahmen-Bezeichnung (Kryptowerte)"
            value={form.z15_bezeichnung}
            onChange={(v) => set("z15_bezeichnung", v)}
            placeholder="z. B. Staking Rewards ETH"
          />
          <PairedAmountRow
            zeile="15"
            label="Einnahmen Kryptowerte"
            value={form.z15_betrag}
            onChange={(s, v) => setPair("z15_betrag", s, v)}
            zus={zus}
          />
          <TextSingleRow
            zeile="16"
            label="Bezeichnung (weitere Einnahmen 1)"
            value={form.z16_bezeichnung}
            onChange={(v) => set("z16_bezeichnung", v)}
          />
          <PairedAmountRow
            zeile="16"
            label="Einnahmen (weitere 1)"
            value={form.z16_betrag}
            onChange={(s, v) => setPair("z16_betrag", s, v)}
            zus={zus}
          />
          <TextSingleRow
            zeile="17"
            label="Bezeichnung (weitere Einnahmen 2)"
            value={form.z17_bezeichnung}
            onChange={(v) => set("z17_bezeichnung", v)}
          />
          <PairedAmountRow
            zeile="17"
            label="Einnahmen (weitere 2)"
            value={form.z17_betrag}
            onChange={(s, v) => setPair("z17_betrag", s, v)}
            zus={zus}
          />
          <ComputedPairRow
            zeile="18"
            label="Summe Z. 15 + 16 + 17 (auto)"
            kzA="164"
            kzB="165"
            value={z18}
            zus={zus}
          />
          <PairedAmountRow
            zeile="19"
            label="Werbungskosten zu Z. 15–17"
            kzA="176"
            kzB="177"
            value={form.z19_werbungskosten}
            onChange={(s, v) => setPair("z19_werbungskosten", s, v)}
            zus={zus}
          />
          <ComputedPairRow
            zeile="20"
            label="Einkünfte aus Kryptowerten = Z. 18 − Z. 19 (auto)"
            value={z20}
            zus={zus}
            emphasize
          />
          <TextPair
            zeile="21"
            label="Wirtschafts-ID (DE-…)"
            valueA={form.z21_wirtschaftsId_a}
            valueB={form.z21_wirtschaftsId_b}
            onA={(v) => set("z21_wirtschaftsId_a", v)}
            onB={(v) => set("z21_wirtschaftsId_b", v)}
            zus={zus}
            placeholder="DE-XXXXXXXXX"
          />
          <JaNeinPair
            zeile="22"
            label="Antrag: Verzicht auf Verlustrücktrag § 10d EStG ins Jahr 2024"
            kzA="804"
            kzB="805"
            valueA={form.z22_verlustruecktrag_verzicht_a}
            valueB={form.z22_verlustruecktrag_verzicht_b}
            onA={(v) => set("z22_verlustruecktrag_verzicht_a", v)}
            onB={(v) => set("z22_verlustruecktrag_verzicht_b", v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection
          title="3. Abgeordnetenbezüge (Z. 23–32)"
          description="Steuerpflichtige Bezüge von Bundes-/Landtagsabgeordneten und vergleichbaren Mandatsträgern (§ 22 Nr. 4 EStG)."
        >
          <PairedAmountRow
            zeile="23"
            label="Steuerpflichtige Einnahmen (ohne Mehrjahresvergütung)"
            kzA="200"
            kzB="201"
            value={form.z23_einnahmen}
            onChange={(s, v) => setPair("z23_einnahmen", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="24"
            label="davon Versorgungsbezüge"
            kzA="202"
            kzB="203"
            value={form.z24_versorgung_enthalten}
            onChange={(s, v) => setPair("z24_versorgung_enthalten", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="25"
            label="Bemessungsgrundlage Versorgungsfreibetrag"
            kzA="204"
            kzB="205"
            value={form.z25_bemessung}
            onChange={(s, v) => setPair("z25_bemessung", s, v)}
            zus={zus}
          />
          <PairedIntegerRow
            zeile="26"
            label="Maßgebendes Kalenderjahr des Versorgungsbeginns"
            kzA="216"
            kzB="217"
            valueA={form.z26_jahr_versorgungsbeginn_a}
            valueB={form.z26_jahr_versorgungsbeginn_b}
            onA={(v) => set("z26_jahr_versorgungsbeginn_a", v)}
            onB={(v) => set("z26_jahr_versorgungsbeginn_b", v)}
            zus={zus}
            placeholder="JJJJ"
            min={1900}
            max={2099}
          />
          <PairedMonthRangeRow
            zeile="27"
            label="Unterjährige Zahlung — erster · letzter Monat"
            valueA={{
              first: form.z27_erster_monat_a,
              last: form.z27_letzter_monat_a,
            }}
            valueB={{
              first: form.z27_erster_monat_b,
              last: form.z27_letzter_monat_b,
            }}
            onA={(first, last) => {
              set("z27_erster_monat_a", first);
              set("z27_letzter_monat_a", last);
            }}
            onB={(first, last) => {
              set("z27_erster_monat_b", first);
              set("z27_letzter_monat_b", last);
            }}
            zus={zus}
          />
          <PairedAmountRow
            zeile="28"
            label="Sterbegeld, Kapitalauszahlungen/Abfindungen, Nachzahlungen"
            kzA="210"
            kzB="211"
            value={form.z28_sterbegeld}
            onChange={(s, v) => setPair("z28_sterbegeld", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="29"
            label="Nicht in Z. 23 enthaltene Vergütungen für mehrere Jahre"
            kzA="212"
            kzB="213"
            value={form.z29_mehrjahr}
            onChange={(s, v) => setPair("z29_mehrjahr", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="30"
            label="davon Versorgungsbezüge"
            kzA="214"
            kzB="215"
            value={form.z30_mehrjahr_versorgung}
            onChange={(s, v) => setPair("z30_mehrjahr_versorgung", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="31"
            label="Werbungskosten (Abgeordnetenbezüge)"
            kzA="218"
            kzB="219"
            value={form.z31_abg_werbungskosten}
            onChange={(s, v) => setPair("z31_abg_werbungskosten", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="32"
            label="Tätigkeit als Abgeordnete:r: Anwartschaft auf Altersversorgung"
            kzA="242"
            kzB="243"
            valueA={form.z32_anwartschaft_a}
            valueB={form.z32_anwartschaft_b}
            onA={(v) => set("z32_anwartschaft_a", v)}
            onB={(v) => set("z32_anwartschaft_b", v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection
          title="4. Steuerstundungsmodelle (Z. 33)"
          description="§ 15b EStG · Verluste beschränkt verrechenbar; nur mit Gewinnen aus derselben Einkunftsquelle."
        >
          <PairedAmountRow
            zeile="33"
            label="Einkünfte aus § 15b EStG-Modellen"
            value={form.z33_steuerstundung}
            onChange={(s, v) => setPair("z33_steuerstundung", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 5A: Grundstücke ============ */}
        <BmfSection
          title="5A. Private Veräußerungsgeschäfte · Grundstücke (Z. 34–44)"
          description="§ 23 Abs. 1 Nr. 1 EStG — Spekulationsfrist 10 Jahre. Selbstnutzung kann Steuerfreiheit auslösen (§ 23 Abs. 1 Nr. 1 Satz 3)."
        >
          <TextSingleRow
            zeile="34"
            label="Bezeichnung des Grundstücks / Rechts (Lage)"
            value={form.z34_bezeichnung}
            onChange={(v) => set("z34_bezeichnung", v)}
          />
          <DateDateRow
            zeile="35"
            label="Anschaffung · Veräußerung"
            valueA={form.z35_anschaffung}
            valueB={form.z35_veraeusserung}
            onA={(v) => set("z35_anschaffung", v)}
            onB={(v) => set("z35_veraeusserung", v)}
            placeholderA="Anschaffung"
            placeholderB="Veräußerung"
          />
          <PeriodAndNumberRow
            zeile="36"
            label="Eigennutzung (vom/bis · m²)"
            von={form.z36_wohnung_von}
            bis={form.z36_wohnung_bis}
            num={form.z36_wohnung_qm}
            onVon={(v) => set("z36_wohnung_von", v)}
            onBis={(v) => set("z36_wohnung_bis", v)}
            onNum={(v) => set("z36_wohnung_qm", v)}
            numPlaceholder="m²"
          />
          <PeriodAndNumberRow
            zeile="37"
            label="Andere Nutzung (z. B. Vermietung) · m²"
            von={form.z37_andere_von}
            bis={form.z37_andere_bis}
            num={form.z37_andere_qm}
            onVon={(v) => set("z37_andere_von", v)}
            onBis={(v) => set("z37_andere_bis", v)}
            onNum={(v) => set("z37_andere_qm", v)}
            numPlaceholder="m²"
          />
          <BmfInputRow
            kz=""
            label="Veräußerungspreis"
            hint="Z. 38"
            value={form.z38_verausserungspreis}
            onChange={(v) => set("z38_verausserungspreis", v)}
          />
          <BmfInputRow
            kz=""
            label="− Anschaffungs-/Herstellungskosten"
            hint="Z. 39"
            value={form.z39_anschaffungskosten}
            onChange={(v) => set("z39_anschaffungskosten", v)}
          />
          <BmfInputRow
            kz=""
            label="+ AfA/erhöhte Abschreibungen/Sonderabschreibungen"
            hint="Z. 40 · erhöht den Gewinn (bereits geltend gemacht)"
            value={form.z40_afa}
            onChange={(v) => set("z40_afa", v)}
          />
          <BmfInputRow
            kz=""
            label="− Werbungskosten zum Veräußerungsgeschäft"
            hint="Z. 41"
            value={form.z41_werbungskosten}
            onChange={(v) => set("z41_werbungskosten", v)}
          />
          <BmfRow
            kz=""
            label="Gewinn / Verlust (auto · Z. 38 − 39 + 40 − 41)"
            value={z42}
            subtotal
          />
          <PairedAmountRow
            zeile="43"
            label="Zurechnung des Betrags aus Z. 42"
            kzA="110"
            kzB="111"
            value={form.z43_zurechnung}
            onChange={(s, v) => setPair("z43_zurechnung", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="44"
            label="Gewinne / Verluste aus weiteren Grundstücks-Veräußerungen"
            kzA="112"
            kzB="113"
            value={form.z44_weitere}
            onChange={(s, v) => setPair("z44_weitere", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 5B: Kryptowerte ============ */}
        <BmfSection
          title="5B. Private Veräußerungsgeschäfte · Kryptowerte (Z. 45–51)"
          description="§ 23 Abs. 1 Nr. 2 EStG — Spekulationsfrist 1 Jahr. Pro Transaktion je ein Formular; bei vielen Transaktionen Zusammenstellung als separate Anlage."
        >
          <JaNeinPair
            zeile="45"
            label="Einkünfte aus Veräußerung von Kryptowerten erzielt?"
            kzA="108"
            kzB="109"
            valueA={form.z45_hat_krypto_a}
            valueB={form.z45_hat_krypto_b}
            onA={(v) => set("z45_hat_krypto_a", v)}
            onB={(v) => set("z45_hat_krypto_b", v)}
            zus={zus}
          />
          <TextSingleRow
            zeile="46"
            label="Bezeichnung (z. B. BTC, ETH)"
            value={form.z46_bezeichnung}
            onChange={(v) => set("z46_bezeichnung", v)}
          />
          <DateDatePlatformRow
            zeile="47"
            label="Anschaffung · Veräußerung · Handelsplattform"
            anschaffung={form.z47_anschaffung}
            veraeusserung={form.z47_veraeusserung}
            plattform={form.z47_plattform}
            onAnschaffung={(v) => set("z47_anschaffung", v)}
            onVeraeusserung={(v) => set("z47_veraeusserung", v)}
            onPlattform={(v) => set("z47_plattform", v)}
          />
          <BmfInputRow
            kz=""
            label="Veräußerungspreis"
            hint="Z. 48"
            value={form.z48_verausserungspreis}
            onChange={(v) => set("z48_verausserungspreis", v)}
          />
          <BmfInputRow
            kz=""
            label="− Anschaffungskosten"
            hint="Z. 49"
            value={form.z49_anschaffungskosten}
            onChange={(v) => set("z49_anschaffungskosten", v)}
          />
          <BmfInputRow
            kz=""
            label="− Werbungskosten"
            hint="Z. 50"
            value={form.z50_werbungskosten}
            onChange={(v) => set("z50_werbungskosten", v)}
          />
          <BmfRow
            kz=""
            label="Gewinn / Verlust (auto · Z. 48 − 49 − 50)"
            value={z51}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 5C: Andere Wirtschaftsgüter ============ */}
        <BmfSection
          title="5C. Private Veräußerungsgeschäfte · Andere Wirtschaftsgüter (Z. 52–59)"
          description="§ 23 Abs. 1 Nr. 2 EStG — Spekulationsfrist 1 Jahr (bei Einkünfte erzielenden Wirtschaftsgütern 10 Jahre)."
        >
          <TextSingleRow
            zeile="52"
            label="Art des Wirtschaftsguts"
            value={form.z52_art}
            onChange={(v) => set("z52_art", v)}
            placeholder="z. B. Goldbarren, Oldtimer"
          />
          <DateDateRow
            zeile="53"
            label="Anschaffung · Veräußerung"
            valueA={form.z53_anschaffung}
            valueB={form.z53_veraeusserung}
            onA={(v) => set("z53_anschaffung", v)}
            onB={(v) => set("z53_veraeusserung", v)}
          />
          <BmfInputRow
            kz=""
            label="Veräußerungspreis"
            hint="Z. 54"
            value={form.z54_verausserungspreis}
            onChange={(v) => set("z54_verausserungspreis", v)}
          />
          <BmfInputRow
            kz=""
            label="− Anschaffungskosten"
            hint="Z. 55"
            value={form.z55_anschaffungskosten}
            onChange={(v) => set("z55_anschaffungskosten", v)}
          />
          <BmfInputRow
            kz=""
            label="− Werbungskosten"
            hint="Z. 56"
            value={form.z56_werbungskosten}
            onChange={(v) => set("z56_werbungskosten", v)}
          />
          <BmfRow
            kz=""
            label="Gewinn / Verlust (auto · Z. 54 − 55 − 56)"
            value={z57}
            subtotal
          />
          <PairedAmountRow
            zeile="58"
            label="Zurechnung Z. 51 + Z. 57"
            kzA="114"
            kzB="115"
            value={form.z58_zurechnung}
            onChange={(s, v) => setPair("z58_zurechnung", s, v)}
            zus={zus}
          />
          <PairedAmountRow
            zeile="59"
            label="Gewinne / Verluste aus weiteren Veräußerungen"
            kzA="116"
            kzB="117"
            value={form.z59_weitere}
            onChange={(s, v) => setPair("z59_weitere", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 5D: Anteile ============ */}
        <BmfSection
          title="5D. Anteile an Einkünften aus privaten Veräußerungsgeschäften (Z. 60–66)"
          description="Über Gemeinschaften/Gesellschaften erzielte Gewinne/Verluste — per Feststellungsbescheid."
        >
          <TextSingleRow
            zeile="60"
            label="Person A · Bezeichnung der Gemeinschaft/Gesellschaft"
            value={form.z60_bezeichnung_a}
            onChange={(v) => set("z60_bezeichnung_a", v)}
          />
          <TextSingleRow
            zeile="61"
            label="Person A · Finanzamt"
            value={form.z61_finanzamt_a}
            onChange={(v) => set("z61_finanzamt_a", v)}
          />
          <TextSingleRow
            zeile="61"
            label="Person A · Steuernummer"
            value={form.z61_steuernummer_a}
            onChange={(v) => set("z61_steuernummer_a", v)}
          />
          <BmfInputRow
            kz="134"
            label="Person A · Anteil am Gewinn/Verlust"
            hint="Z. 62"
            value={form.z62_anteil_a}
            onChange={(v) => set("z62_anteil_a", v)}
          />
          {zus && (
            <>
              <TextSingleRow
                zeile="63"
                label="Person B · Bezeichnung der Gemeinschaft/Gesellschaft"
                value={form.z63_bezeichnung_b}
                onChange={(v) => set("z63_bezeichnung_b", v)}
              />
              <TextSingleRow
                zeile="64"
                label="Person B · Finanzamt"
                value={form.z64_finanzamt_b}
                onChange={(v) => set("z64_finanzamt_b", v)}
              />
              <TextSingleRow
                zeile="64"
                label="Person B · Steuernummer"
                value={form.z64_steuernummer_b}
                onChange={(v) => set("z64_steuernummer_b", v)}
              />
              <BmfInputRow
                kz="135"
                label="Person B · Anteil am Gewinn/Verlust"
                hint="Z. 65"
                value={form.z65_anteil_b}
                onChange={(v) => set("z65_anteil_b", v)}
              />
            </>
          )}
          <JaNeinPair
            zeile="66"
            label="Antrag: Verzicht auf Verlustrücktrag § 10d ins Jahr 2024"
            kzA="806"
            kzB="807"
            valueA={form.z66_verlustruecktrag_verzicht_a}
            valueB={form.z66_verlustruecktrag_verzicht_b}
            onA={(v) => set("z66_verlustruecktrag_verzicht_a", v)}
            onB={(v) => set("z66_verlustruecktrag_verzicht_b", v)}
            zus={zus}
          />
        </BmfSection>

        <BmfRow
          kz=""
          label="Summe private Veräußerungsgewinne/-verluste (Z. 42 + 51 + 57 · Info)"
          value={sumPrivat}
          subtotal
        />

        <BmfResult
          label="Sonstige Einkünfte gesamt (Info · Kombination aller Sektionen)"
          value={sonstigeGesamt}
          variant={sonstigeGesamt > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Auto-Berechnungen:</strong> Z. 18 = Z. 15 + 16 + 17 ·
            Z. 20 = Z. 18 − Z. 19 · Z. 42 = Z. 38 − 39 + 40 − 41 · Z. 51 =
            Z. 48 − 49 − 50 · Z. 57 = Z. 54 − 55 − 56.
          </p>
          <p>
            <strong>§ 23 EStG — Spekulationsfristen:</strong> Grundstücke 10
            Jahre · Kryptowerte / andere Wirtschaftsgüter 1 Jahr (10 Jahre
            bei Einkünfteerzielung). Freigrenze {euro.format(freigrenze23)}{" "}
            pro Jahr (§ 23 Abs. 3 Satz 5 EStG) — bei Überschreiten voll
            steuerpflichtig. Die Seite warnt bei Fristüberschreitung, prüft
            aber keine Umgehungstatbestände (Einlage, Mischnutzung, Rückgängigmachung).
          </p>
          <p>
            <strong>Kryptowerte:</strong> Mining/Staking/Lending/Airdrops sind
            laufende Einkünfte (Abschnitt 2). Verkauf ist private Veräußerung
            (Abschnitt 5B). FIFO-Zuordnung bei mehreren Käufen/Verkäufen ist
            NICHT automatisiert — bei vielen Transaktionen externe Tools
            (CoinTracking, Blockpit etc.) nutzen.
          </p>
          <p>
            <strong>Kennziffern (Kz) und Zeilen-Nr. (Z.)</strong>{" "}
            entsprechen dem offiziellen Anlage SO 2025 nach Ihrer Angabe.
            Partner-Kz (Person B) automatisch +1 gesetzt.
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

function TextSingleRow({
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
    <WideRow kz="" zeile={zeile} label={label} wide={260}>
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

function PairedAmountRow({
  zeile,
  label,
  kzA,
  kzB,
  value,
  onChange,
  zus,
}: {
  zeile: string;
  label: string;
  kzA?: string;
  kzB?: string;
  value: Paired;
  onChange: (side: "a" | "b", v: number) => void;
  zus: boolean;
}) {
  return (
    <>
      <BmfInputRow
        kz={kzA ?? ""}
        label={zus ? `${label} (Person A)` : label}
        hint={`Z. ${zeile}`}
        value={value.a}
        onChange={(v) => onChange("a", v)}
      />
      {zus && (
        <BmfInputRow
          kz={kzB ?? ""}
          label={`${label} (Person B)`}
          hint={`Z. ${zeile}`}
          value={value.b}
          onChange={(v) => onChange("b", v)}
        />
      )}
    </>
  );
}

function ComputedPairRow({
  zeile,
  label,
  kzA,
  kzB,
  value,
  zus,
  emphasize,
}: {
  zeile: string;
  label: string;
  kzA?: string;
  kzB?: string;
  value: Paired;
  zus: boolean;
  emphasize?: boolean;
}) {
  return (
    <>
      <BmfRow
        kz={kzA ?? ""}
        label={zus ? `${label} (Person A) · Z. ${zeile}` : `${label} · Z. ${zeile}`}
        value={value.a}
        subtotal={!emphasize}
      />
      {zus && (
        <BmfRow
          kz={kzB ?? ""}
          label={`${label} (Person B) · Z. ${zeile}`}
          value={value.b}
          subtotal={!emphasize}
        />
      )}
    </>
  );
}

function TextPair({
  zeile,
  label,
  kzA,
  kzB,
  valueA,
  valueB,
  onA,
  onB,
  zus,
  placeholder,
}: {
  zeile: string;
  label: string;
  kzA?: string;
  kzB?: string;
  valueA: string;
  valueB: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
  zus: boolean;
  placeholder?: string;
}) {
  return (
    <>
      <WideRow
        kz={kzA ?? ""}
        zeile={zeile}
        label={zus ? `${label} (Person A)` : label}
        wide={260}
      >
        <input
          type="text"
          value={valueA}
          onChange={(e) => onA(e.target.value)}
          placeholder={placeholder}
          style={textInputStyle}
        />
      </WideRow>
      {zus && (
        <WideRow kz={kzB ?? ""} zeile={zeile} label={`${label} (Person B)`} wide={260}>
          <input
            type="text"
            value={valueB}
            onChange={(e) => onB(e.target.value)}
            placeholder={placeholder}
            style={textInputStyle}
          />
        </WideRow>
      )}
    </>
  );
}

function JaNeinPair({
  zeile,
  label,
  kzA,
  kzB,
  valueA,
  valueB,
  onA,
  onB,
  zus,
}: {
  zeile: string;
  label: string;
  kzA?: string;
  kzB?: string;
  valueA: JaNein;
  valueB: JaNein;
  onA: (v: JaNein) => void;
  onB: (v: JaNein) => void;
  zus: boolean;
}) {
  return (
    <>
      <WideRow
        kz={kzA ?? ""}
        zeile={zeile}
        label={zus ? `${label} (Person A)` : label}
        wide={120}
      >
        <select
          value={valueA}
          onChange={(e) => onA(e.target.value as JaNein)}
          style={{ ...textInputStyle, textAlign: "left" }}
        >
          <option value="">—</option>
          <option value="ja">1 · Ja</option>
          <option value="nein">2 · Nein</option>
        </select>
      </WideRow>
      {zus && (
        <WideRow kz={kzB ?? ""} zeile={zeile} label={`${label} (Person B)`} wide={120}>
          <select
            value={valueB}
            onChange={(e) => onB(e.target.value as JaNein)}
            style={{ ...textInputStyle, textAlign: "left" }}
          >
            <option value="">—</option>
            <option value="ja">1 · Ja</option>
            <option value="nein">2 · Nein</option>
          </select>
        </WideRow>
      )}
    </>
  );
}

function PairedIntegerRow({
  zeile,
  label,
  kzA,
  kzB,
  valueA,
  valueB,
  onA,
  onB,
  zus,
  placeholder,
  min,
  max,
}: {
  zeile: string;
  label: string;
  kzA?: string;
  kzB?: string;
  valueA: number;
  valueB: number;
  onA: (v: number) => void;
  onB: (v: number) => void;
  zus: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <>
      <WideRow
        kz={kzA ?? ""}
        zeile={zeile}
        label={zus ? `${label} (Person A)` : label}
        wide={120}
      >
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={valueA === 0 ? "" : valueA}
          onChange={(e) => onA(Number(e.target.value) || 0)}
          placeholder={placeholder}
          style={monoInputStyle}
        />
      </WideRow>
      {zus && (
        <WideRow kz={kzB ?? ""} zeile={zeile} label={`${label} (Person B)`} wide={120}>
          <input
            type="number"
            min={min}
            max={max}
            step={1}
            value={valueB === 0 ? "" : valueB}
            onChange={(e) => onB(Number(e.target.value) || 0)}
            placeholder={placeholder}
            style={monoInputStyle}
          />
        </WideRow>
      )}
    </>
  );
}

function PairedMonthRangeRow({
  zeile,
  label,
  valueA,
  valueB,
  onA,
  onB,
  zus,
}: {
  zeile: string;
  label: string;
  valueA: { first: number; last: number };
  valueB: { first: number; last: number };
  onA: (first: number, last: number) => void;
  onB: (first: number, last: number) => void;
  zus: boolean;
}) {
  const box = (val: { first: number; last: number }, on: typeof onA) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
      <input
        type="number"
        min={1}
        max={12}
        step={1}
        value={val.first === 0 ? "" : val.first}
        onChange={(e) => on(Number(e.target.value) || 0, val.last)}
        placeholder="1. Monat"
        style={monoInputStyle}
      />
      <input
        type="number"
        min={1}
        max={12}
        step={1}
        value={val.last === 0 ? "" : val.last}
        onChange={(e) => on(val.first, Number(e.target.value) || 0)}
        placeholder="letzter Monat"
        style={monoInputStyle}
      />
    </div>
  );
  return (
    <>
      <WideRow
        kz=""
        zeile={zeile}
        label={zus ? `${label} (Person A)` : label}
        wide={200}
      >
        {box(valueA, onA)}
      </WideRow>
      {zus && (
        <WideRow kz="" zeile={zeile} label={`${label} (Person B)`} wide={200}>
          {box(valueB, onB)}
        </WideRow>
      )}
    </>
  );
}

function DateDateRow({
  zeile,
  label,
  valueA,
  valueB,
  onA,
  onB,
  placeholderA,
  placeholderB,
}: {
  zeile: string;
  label: string;
  valueA: string;
  valueB: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
  placeholderA?: string;
  placeholderB?: string;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={260}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
        <input
          type="date"
          value={valueA}
          onChange={(e) => onA(e.target.value)}
          placeholder={placeholderA}
          style={textInputStyle}
        />
        <input
          type="date"
          value={valueB}
          onChange={(e) => onB(e.target.value)}
          placeholder={placeholderB}
          style={textInputStyle}
        />
      </div>
    </WideRow>
  );
}

function PeriodAndNumberRow({
  zeile,
  label,
  von,
  bis,
  num,
  onVon,
  onBis,
  onNum,
  numPlaceholder,
}: {
  zeile: string;
  label: string;
  von: string;
  bis: string;
  num: number;
  onVon: (v: string) => void;
  onBis: (v: string) => void;
  onNum: (v: number) => void;
  numPlaceholder?: string;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={360}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 4, width: "100%" }}
      >
        <input
          type="date"
          value={von}
          onChange={(e) => onVon(e.target.value)}
          style={textInputStyle}
        />
        <input
          type="date"
          value={bis}
          onChange={(e) => onBis(e.target.value)}
          style={textInputStyle}
        />
        <input
          type="number"
          min="0"
          step={0.01}
          value={num === 0 ? "" : num}
          onChange={(e) => onNum(Number(e.target.value) || 0)}
          placeholder={numPlaceholder}
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function DateDatePlatformRow({
  zeile,
  label,
  anschaffung,
  veraeusserung,
  plattform,
  onAnschaffung,
  onVeraeusserung,
  onPlattform,
}: {
  zeile: string;
  label: string;
  anschaffung: string;
  veraeusserung: string;
  plattform: string;
  onAnschaffung: (v: string) => void;
  onVeraeusserung: (v: string) => void;
  onPlattform: (v: string) => void;
}) {
  return (
    <WideRow kz="" zeile={zeile} label={label} wide={400}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, width: "100%" }}
      >
        <input
          type="date"
          value={anschaffung}
          onChange={(e) => onAnschaffung(e.target.value)}
          style={textInputStyle}
        />
        <input
          type="date"
          value={veraeusserung}
          onChange={(e) => onVeraeusserung(e.target.value)}
          style={textInputStyle}
        />
        <input
          type="text"
          value={plattform}
          onChange={(e) => onPlattform(e.target.value)}
          placeholder="Plattform"
          style={textInputStyle}
        />
      </div>
    </WideRow>
  );
}
