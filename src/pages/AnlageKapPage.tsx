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
type Paired = { a: number; b: number };
type PairedBool = { a: JaNein; b: JaNein };

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const SPARER_PAUSCHBETRAG_EINZEL = 1000;
const SPARER_PAUSCHBETRAG_ZUSAMMEN = 2000;

// ---------- State ------------------------------------------------------

type AnlageKAP = {
  zusammenveranlagung: boolean;
  korrigierte_betraege: boolean;

  z4_guenstiger: PairedBool;
  z5_ueberpruefung_einbehalt: PairedBool;
  z6_kirchensteuer_fehlend: PairedBool;

  z7_kapitalertraege: Paired;
  z8_aktiengewinne: Paired;
  z9_termingeschaefte_gewinne: Paired;
  z10_altanteile_invstg: Paired;
  z11_ersatzbemessung: Paired;
  z12_verluste_ohne_aktien: Paired;
  z13_verluste_aktien: Paired;
  z14_verluste_termin: Paired;
  z15_verluste_uneinbringlich: Paired;
  z16_sparer_pauschbetrag_erklaerte: Paired;
  z17_sparer_pauschbetrag_nicht_erklaerte: Paired;

  z18_inland: Paired;
  z19_ausland: Paired;
  z20_aktiengewinne_18_19: Paired;
  z22_verluste_ohne_aktien_18_19: Paired;
  z23_verluste_aktien_18_19: Paired;
  z26_zinsen_fa: Paired;
  z26a_prozess_verzugs: Paired;

  z27_hinzurechnung: Paired;
  z27a_minderung: Paired;
  z28_sonstige_kapitalford: Paired;
  z29_veraeusserung_sonstige: Paired;
  z30_lebensversicherung: Paired;
  z31_tariflich_antrag_32b: PairedBool;
  z32_gesellschaft: string;
  z32a_finanzamt: string;
  z32b_steuernummer: string;
  z32b_betrag: Paired;
  z32c_widerruf: PairedBool;
  z32d_gesellschaft: string;
  z32e_finanzamt: string;
  z32f_steuernummer: string;
  z33_korrespondenz: Paired;
  z34_spezialinvest: PairedBool;
  z35_ermaessigte_265: Paired;
  z36_ermaessigte_279: Paired;

  z37_kest: Paired;
  z38_soli: Paired;
  z39_kist: Paired;
  z40_angerechnete_ausl: Paired;
  z41_anrechenbare_noch_nicht: Paired;
  z42_fiktive_quellensteuer: Paired;
  z43_kest_tariflich: Paired;
  z44_soli_tariflich: Paired;
  z45_kist_tariflich: Paired;
  z46_par36a: PairedBool;
  z47_kuerzung_sondertarif: Paired;
  z48_kuerzung_tariflich: Paired;

  z49_bezeichnung: string;
  z50_finanzamt: string;
  z51_steuernummer: string;
  z52_einkuenfte_sondertarif: Paired;
  z53_anzurechnende_ausl: Paired;
  z54_einkuenfte_tariflich: Paired;

  z55_steuerstundung: Paired;
};

const ZP: Paired = { a: 0, b: 0 };
const ZPB: PairedBool = { a: "", b: "" };

const DEFAULT: AnlageKAP = {
  zusammenveranlagung: false,
  korrigierte_betraege: false,
  z4_guenstiger: ZPB,
  z5_ueberpruefung_einbehalt: ZPB,
  z6_kirchensteuer_fehlend: ZPB,
  z7_kapitalertraege: ZP,
  z8_aktiengewinne: ZP,
  z9_termingeschaefte_gewinne: ZP,
  z10_altanteile_invstg: ZP,
  z11_ersatzbemessung: ZP,
  z12_verluste_ohne_aktien: ZP,
  z13_verluste_aktien: ZP,
  z14_verluste_termin: ZP,
  z15_verluste_uneinbringlich: ZP,
  z16_sparer_pauschbetrag_erklaerte: ZP,
  z17_sparer_pauschbetrag_nicht_erklaerte: ZP,
  z18_inland: ZP,
  z19_ausland: ZP,
  z20_aktiengewinne_18_19: ZP,
  z22_verluste_ohne_aktien_18_19: ZP,
  z23_verluste_aktien_18_19: ZP,
  z26_zinsen_fa: ZP,
  z26a_prozess_verzugs: ZP,
  z27_hinzurechnung: ZP,
  z27a_minderung: ZP,
  z28_sonstige_kapitalford: ZP,
  z29_veraeusserung_sonstige: ZP,
  z30_lebensversicherung: ZP,
  z31_tariflich_antrag_32b: ZPB,
  z32_gesellschaft: "",
  z32a_finanzamt: "",
  z32b_steuernummer: "",
  z32b_betrag: ZP,
  z32c_widerruf: ZPB,
  z32d_gesellschaft: "",
  z32e_finanzamt: "",
  z32f_steuernummer: "",
  z33_korrespondenz: ZP,
  z34_spezialinvest: ZPB,
  z35_ermaessigte_265: ZP,
  z36_ermaessigte_279: ZP,
  z37_kest: ZP,
  z38_soli: ZP,
  z39_kist: ZP,
  z40_angerechnete_ausl: ZP,
  z41_anrechenbare_noch_nicht: ZP,
  z42_fiktive_quellensteuer: ZP,
  z43_kest_tariflich: ZP,
  z44_soli_tariflich: ZP,
  z45_kist_tariflich: ZP,
  z46_par36a: ZPB,
  z47_kuerzung_sondertarif: ZP,
  z48_kuerzung_tariflich: ZP,
  z49_bezeichnung: "",
  z50_finanzamt: "",
  z51_steuernummer: "",
  z52_einkuenfte_sondertarif: ZP,
  z53_anzurechnende_ausl: ZP,
  z54_einkuenfte_tariflich: ZP,
  z55_steuerstundung: ZP,
};

const FORM_ID = "anlage-kap";

function loadForm(mandantId: string | null, jahr: number): AnlageKAP {
  const parsed = readEstForm<Partial<AnlageKAP> & Record<string, unknown>>(
    FORM_ID,
    mandantId,
    jahr
  );
  if (!parsed) return DEFAULT;

  const looksLegacy =
    typeof (parsed as Record<string, unknown>).zinsen === "number" ||
    typeof (parsed as Record<string, unknown>).dividenden === "number";
  if (looksLegacy) {
    const old = parsed as Record<string, number>;
    const sum =
      (old.zinsen ?? 0) +
      (old.dividenden ?? 0) +
      (old.fondsausschuettung ?? 0);
    return {
      ...DEFAULT,
      z7_kapitalertraege: { a: sum, b: 0 },
      z8_aktiengewinne: { a: old.aktienGewinne ?? 0, b: 0 },
      z13_verluste_aktien: { a: old.aktienVerluste ?? 0, b: 0 },
      z12_verluste_ohne_aktien: { a: old.sonstigeVerluste ?? 0, b: 0 },
      z37_kest: { a: old.kest ?? 0, b: 0 },
      z40_angerechnete_ausl: { a: old.auslQuellensteuer ?? 0, b: 0 },
    };
  }

  const mergePaired = (v: unknown): Paired => ({
    ...ZP,
    ...((v ?? {}) as Partial<Paired>),
  });
  const mergePairedBool = (v: unknown): PairedBool => ({
    ...ZPB,
    ...((v ?? {}) as Partial<PairedBool>),
  });

  return {
    ...DEFAULT,
    ...parsed,
    z4_guenstiger: mergePairedBool(parsed.z4_guenstiger),
    z5_ueberpruefung_einbehalt: mergePairedBool(parsed.z5_ueberpruefung_einbehalt),
    z6_kirchensteuer_fehlend: mergePairedBool(parsed.z6_kirchensteuer_fehlend),
    z7_kapitalertraege: mergePaired(parsed.z7_kapitalertraege),
    z8_aktiengewinne: mergePaired(parsed.z8_aktiengewinne),
    z9_termingeschaefte_gewinne: mergePaired(parsed.z9_termingeschaefte_gewinne),
    z10_altanteile_invstg: mergePaired(parsed.z10_altanteile_invstg),
    z11_ersatzbemessung: mergePaired(parsed.z11_ersatzbemessung),
    z12_verluste_ohne_aktien: mergePaired(parsed.z12_verluste_ohne_aktien),
    z13_verluste_aktien: mergePaired(parsed.z13_verluste_aktien),
    z14_verluste_termin: mergePaired(parsed.z14_verluste_termin),
    z15_verluste_uneinbringlich: mergePaired(parsed.z15_verluste_uneinbringlich),
    z16_sparer_pauschbetrag_erklaerte: mergePaired(parsed.z16_sparer_pauschbetrag_erklaerte),
    z17_sparer_pauschbetrag_nicht_erklaerte: mergePaired(parsed.z17_sparer_pauschbetrag_nicht_erklaerte),
    z18_inland: mergePaired(parsed.z18_inland),
    z19_ausland: mergePaired(parsed.z19_ausland),
    z20_aktiengewinne_18_19: mergePaired(parsed.z20_aktiengewinne_18_19),
    z22_verluste_ohne_aktien_18_19: mergePaired(parsed.z22_verluste_ohne_aktien_18_19),
    z23_verluste_aktien_18_19: mergePaired(parsed.z23_verluste_aktien_18_19),
    z26_zinsen_fa: mergePaired(parsed.z26_zinsen_fa),
    z26a_prozess_verzugs: mergePaired(parsed.z26a_prozess_verzugs),
    z27_hinzurechnung: mergePaired(parsed.z27_hinzurechnung),
    z27a_minderung: mergePaired(parsed.z27a_minderung),
    z28_sonstige_kapitalford: mergePaired(parsed.z28_sonstige_kapitalford),
    z29_veraeusserung_sonstige: mergePaired(parsed.z29_veraeusserung_sonstige),
    z30_lebensversicherung: mergePaired(parsed.z30_lebensversicherung),
    z31_tariflich_antrag_32b: mergePairedBool(parsed.z31_tariflich_antrag_32b),
    z32b_betrag: mergePaired(parsed.z32b_betrag),
    z32c_widerruf: mergePairedBool(parsed.z32c_widerruf),
    z33_korrespondenz: mergePaired(parsed.z33_korrespondenz),
    z34_spezialinvest: mergePairedBool(parsed.z34_spezialinvest),
    z35_ermaessigte_265: mergePaired(parsed.z35_ermaessigte_265),
    z36_ermaessigte_279: mergePaired(parsed.z36_ermaessigte_279),
    z37_kest: mergePaired(parsed.z37_kest),
    z38_soli: mergePaired(parsed.z38_soli),
    z39_kist: mergePaired(parsed.z39_kist),
    z40_angerechnete_ausl: mergePaired(parsed.z40_angerechnete_ausl),
    z41_anrechenbare_noch_nicht: mergePaired(parsed.z41_anrechenbare_noch_nicht),
    z42_fiktive_quellensteuer: mergePaired(parsed.z42_fiktive_quellensteuer),
    z43_kest_tariflich: mergePaired(parsed.z43_kest_tariflich),
    z44_soli_tariflich: mergePaired(parsed.z44_soli_tariflich),
    z45_kist_tariflich: mergePaired(parsed.z45_kist_tariflich),
    z46_par36a: mergePairedBool(parsed.z46_par36a),
    z47_kuerzung_sondertarif: mergePaired(parsed.z47_kuerzung_sondertarif),
    z48_kuerzung_tariflich: mergePaired(parsed.z48_kuerzung_tariflich),
    z52_einkuenfte_sondertarif: mergePaired(parsed.z52_einkuenfte_sondertarif),
    z53_anzurechnende_ausl: mergePaired(parsed.z53_anzurechnende_ausl),
    z54_einkuenfte_tariflich: mergePaired(parsed.z54_einkuenfte_tariflich),
    z55_steuerstundung: mergePaired(parsed.z55_steuerstundung),
  };
}

// ---------- Main page --------------------------------------------------

export default function AnlageKapPage() {
  return (
    <MandantRequiredGuard>
      <AnlageKapPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageKapPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageKAP>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageKAP>(key: K, value: AnlageKAP[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPair<K extends keyof AnlageKAP>(
    key: K,
    side: "a" | "b",
    value: number
  ) {
    setForm((f) => {
      const prev = f[key] as unknown as Paired;
      return { ...f, [key]: { ...prev, [side]: value } };
    });
  }

  function setPairBool<K extends keyof AnlageKAP>(
    key: K,
    side: "a" | "b",
    value: JaNein
  ) {
    setForm((f) => {
      const prev = f[key] as unknown as PairedBool;
      return { ...f, [key]: { ...prev, [side]: value } };
    });
  }

  const kapErtraegeGesamt = useMemo(() => {
    const pair = (p: Paired) => p.a + p.b;
    return (
      pair(form.z7_kapitalertraege) +
      pair(form.z18_inland) +
      pair(form.z19_ausland) +
      pair(form.z26_zinsen_fa) +
      pair(form.z26a_prozess_verzugs)
    );
  }, [form]);

  const verlusteOhneAktien = useMemo(
    () =>
      form.z12_verluste_ohne_aktien.a + form.z12_verluste_ohne_aktien.b +
      form.z22_verluste_ohne_aktien_18_19.a + form.z22_verluste_ohne_aktien_18_19.b +
      form.z14_verluste_termin.a + form.z14_verluste_termin.b +
      form.z15_verluste_uneinbringlich.a + form.z15_verluste_uneinbringlich.b,
    [form]
  );

  const verlusteAktien = useMemo(
    () =>
      form.z13_verluste_aktien.a + form.z13_verluste_aktien.b +
      form.z23_verluste_aktien_18_19.a + form.z23_verluste_aktien_18_19.b,
    [form]
  );

  const anzurechnendeSteuern = useMemo(() => {
    const pair = (p: Paired) => p.a + p.b;
    return (
      pair(form.z37_kest) +
      pair(form.z40_angerechnete_ausl) +
      pair(form.z41_anrechenbare_noch_nicht) +
      pair(form.z42_fiktive_quellensteuer) +
      pair(form.z43_kest_tariflich) +
      pair(form.z53_anzurechnende_ausl)
    );
  }, [form]);

  const sparerMax = form.zusammenveranlagung
    ? SPARER_PAUSCHBETRAG_ZUSAMMEN
    : SPARER_PAUSCHBETRAG_EINZEL;

  function validate(): string[] {
    const warns: string[] = [];
    const totalSparer =
      form.z16_sparer_pauschbetrag_erklaerte.a +
      form.z16_sparer_pauschbetrag_erklaerte.b +
      form.z17_sparer_pauschbetrag_nicht_erklaerte.a +
      form.z17_sparer_pauschbetrag_nicht_erklaerte.b;
    if (totalSparer > sparerMax) {
      warns.push(
        `Sparer-Pauschbetrag ${euro.format(totalSparer)} > Maximum ${euro.format(sparerMax)}.`
      );
    }
    const aktienGewinne =
      form.z8_aktiengewinne.a + form.z8_aktiengewinne.b +
      form.z20_aktiengewinne_18_19.a + form.z20_aktiengewinne_18_19.b;
    if (verlusteAktien > aktienGewinne) {
      warns.push(
        `Aktienverluste ${euro.format(verlusteAktien)} > Aktiengewinne ${euro.format(aktienGewinne)} — nur verrechenbar (§ 20 Abs. 6 Satz 4 EStG).`
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 8000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-kap"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-kap",
      summary: `Anlage KAP gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-kap",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        kapErtraegeGesamt,
        verlusteAktien,
        verlusteOhneAktien,
        anzurechnendeSteuern,
        form,
      },
    });
    toast.success("Anlage KAP gespeichert.");
  }

  const zus = form.zusammenveranlagung;
  const korr = form.korrigierte_betraege;

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage KAP</h1>
          <p>
            Einkünfte aus Kapitalvermögen · Anrechnung von Steuern (§ 20 /
            § 32d EStG) · VZ {selectedYear}.
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
          Anlage KAP · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-kap" />

      <section className="card taxcalc__section no-print">
        <h2>Optionen</h2>
        <div className="form-grid">
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.zusammenveranlagung}
              onChange={(e) => set("zusammenveranlagung", e.target.checked)}
            />
            <span>Zusammenveranlagung (Person B · Kz 4XX einblenden)</span>
          </label>
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.korrigierte_betraege}
              onChange={(e) => set("korrigierte_betraege", e.target.checked)}
            />
            <span>
              Korrigierte Beträge (Z. 7–15) — Kz-Labels umstellen
            </span>
          </label>
        </div>
      </section>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Sparer-Pauschbetrag {selectedYear}:</strong>{" "}
          {euro.format(sparerMax)}{" "}
          {form.zusammenveranlagung ? "(Zusammenveranlagung)" : "(Einzelperson)"}
          . <strong>Verlusttöpfe § 20 Abs. 6 EStG:</strong> Aktienverluste
          nur mit Aktiengewinnen, Termingeschäfte nur bis 20.000 €/Jahr gegen
          Termingewinne. Verlustvortrag erfolgt automatisch.
        </div>
      </aside>

      <BmfForm
        title="Anlage KAP"
        subtitle={`Einkünfte aus Kapitalvermögen · VZ ${selectedYear}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Anträge (Z. 4–6)">
          <JaNeinPair
            zeile="4"
            label="Antrag Günstigerprüfung für sämtliche Kapitalerträge"
            kzA="201"
            kzB="401"
            value={form.z4_guenstiger}
            onChange={(s, v) => setPairBool("z4_guenstiger", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="5"
            label="Antrag Überprüfung Steuereinbehalt (bestimmte Erträge)"
            kzA="202"
            kzB="402"
            value={form.z5_ueberpruefung_einbehalt}
            onChange={(s, v) => setPairBool("z5_ueberpruefung_einbehalt", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="6"
            label="KESt einbehalten, aber keine Kirchensteuer einbehalten"
            kzA="203"
            kzB="403"
            value={form.z6_kirchensteuer_fehlend}
            onChange={(s, v) => setPairBool("z6_kirchensteuer_fehlend", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title={`2. Kapitalerträge mit inländischem Steuerabzug (Z. 7–17) · ${korr ? "korrigierte Beträge" : "laut Steuerbescheinigung"}`}
        >
          <PairedRow
            zeile="7"
            label="Kapitalerträge"
            kzA={korr ? "220" : "210"}
            kzB={korr ? "420" : "410"}
            value={form.z7_kapitalertraege}
            onChange={(s, v) => setPair("z7_kapitalertraege", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="8"
            label="davon Aktiengewinne (§ 20 Abs. 2 Nr. 1)"
            kzA={korr ? "222" : "212"}
            kzB={korr ? "422" : "412"}
            value={form.z8_aktiengewinne}
            onChange={(s, v) => setPair("z8_aktiengewinne", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="9"
            label="davon Stillhalterprämien + Termingeschäft-Gewinne"
            kzA={korr ? "621" : "611"}
            kzB={korr ? "821" : "811"}
            value={form.z9_termingeschaefte_gewinne}
            onChange={(s, v) => setPair("z9_termingeschaefte_gewinne", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="10"
            label="davon Gewinne bestandsgesch. Alt-Anteile (§ 56 Abs. 6 InvStG)"
            kzA={korr ? "229" : "219"}
            kzB={korr ? "429" : "419"}
            value={form.z10_altanteile_invstg}
            onChange={(s, v) => setPair("z10_altanteile_invstg", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="11"
            label="davon Ersatzbemessungsgrundlage"
            kzA={korr ? "224" : "214"}
            kzB={korr ? "424" : "414"}
            value={form.z11_ersatzbemessung}
            onChange={(s, v) => setPair("z11_ersatzbemessung", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="12"
            label="Nicht ausgeglichene Verluste (ohne Aktien)"
            kzA={korr ? "225" : "215"}
            kzB={korr ? "425" : "415"}
            value={form.z12_verluste_ohne_aktien}
            onChange={(s, v) => setPair("z12_verluste_ohne_aktien", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="13"
            label="Nicht ausgeglichene Aktien-Verluste"
            kzA={korr ? "226" : "216"}
            kzB={korr ? "426" : "416"}
            value={form.z13_verluste_aktien}
            onChange={(s, v) => setPair("z13_verluste_aktien", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="14"
            label="Verluste Termingeschäfte"
            kzA={korr ? "625" : "615"}
            kzB={korr ? "825" : "815"}
            value={form.z14_verluste_termin}
            onChange={(s, v) => setPair("z14_verluste_termin", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="15"
            label="Verluste aus Uneinbringlichkeit/Ausbuchung"
            kzA={korr ? "626" : "616"}
            kzB={korr ? "826" : "816"}
            value={form.z15_verluste_uneinbringlich}
            onChange={(s, v) => setPair("z15_verluste_uneinbringlich", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="16"
            label="Sparer-Pauschbetrag (erklärte Erträge Z. 7–15, 30, 33)"
            kzA="217"
            kzB="417"
            value={form.z16_sparer_pauschbetrag_erklaerte}
            onChange={(s, v) => setPair("z16_sparer_pauschbetrag_erklaerte", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="17"
            label="Sparer-Pauschbetrag (nicht erklärte Erträge)"
            kzA="218"
            kzB="418"
            value={form.z17_sparer_pauschbetrag_nicht_erklaerte}
            onChange={(s, v) => setPair("z17_sparer_pauschbetrag_nicht_erklaerte", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection title="3. Kapitalerträge ohne inländischen Steuerabzug (Z. 18–26a)">
          <PairedRow
            zeile="18"
            label="Inländische Erträge (ohne Z. 26/26a)"
            kzA="230"
            kzB="430"
            value={form.z18_inland}
            onChange={(s, v) => setPair("z18_inland", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="19"
            label="Ausländische Erträge (ohne Z. 26a/52)"
            kzA="234"
            kzB="434"
            value={form.z19_ausland}
            onChange={(s, v) => setPair("z19_ausland", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="20"
            label="davon Aktiengewinne"
            kzA="232"
            kzB="432"
            value={form.z20_aktiengewinne_18_19}
            onChange={(s, v) => setPair("z20_aktiengewinne_18_19", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="22"
            label="Verluste (ohne Aktien)"
            kzA="235"
            kzB="435"
            value={form.z22_verluste_ohne_aktien_18_19}
            onChange={(s, v) => setPair("z22_verluste_ohne_aktien_18_19", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="23"
            label="Aktienverluste"
            kzA="236"
            kzB="436"
            value={form.z23_verluste_aktien_18_19}
            onChange={(s, v) => setPair("z23_verluste_aktien_18_19", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="26"
            label="Zinsen vom Finanzamt für Steuererstattungen"
            kzA="260"
            kzB="460"
            value={form.z26_zinsen_fa}
            onChange={(s, v) => setPair("z26_zinsen_fa", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="26a"
            label="Prozess- und Verzugszinsen"
            kzA="237"
            kzB="437"
            value={form.z26a_prozess_verzugs}
            onChange={(s, v) => setPair("z26a_prozess_verzugs", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection title="4. Kapitalerträge mit tariflicher ESt (Z. 27–36)">
          <PairedRow
            zeile="27"
            label="Hinzurechnungsbetrag § 10 AStG"
            kzA="275"
            kzB="475"
            value={form.z27_hinzurechnung}
            onChange={(s, v) => setPair("z27_hinzurechnung", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="27a"
            label="Minderung § 10 Abs. 6 AStG"
            kzA="664"
            kzB="864"
            value={form.z27a_minderung}
            onChange={(s, v) => setPair("z27a_minderung", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="28"
            label="Laufende Einkünfte (sonst. Kapitalford., stille Gesellschaft)"
            kzA="270"
            kzB="470"
            value={form.z28_sonstige_kapitalford}
            onChange={(s, v) => setPair("z28_sonstige_kapitalford", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="29"
            label="Gewinn aus Veräußerung/Einlösung (zu Z. 28)"
            kzA="271"
            kzB="471"
            value={form.z29_veraeusserung_sonstige}
            onChange={(s, v) => setPair("z29_veraeusserung_sonstige", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="30"
            label="Lebensversicherungs-Kapitalerträge (§ 20 Abs. 1 Nr. 6 Satz 2)"
            kzA="268"
            kzB="468"
            value={form.z30_lebensversicherung}
            onChange={(s, v) => setPair("z30_lebensversicherung", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="31"
            label="Antrag tarifliche ESt für Z. 32b"
            value={form.z31_tariflich_antrag_32b}
            onChange={(s, v) => setPairBool("z31_tariflich_antrag_32b", s, v)}
            zus={zus}
          />
          <TextRow
            zeile="32"
            label="Gesellschaft (unternehmerische Beteiligung)"
            value={form.z32_gesellschaft}
            onChange={(v) => set("z32_gesellschaft", v)}
          />
          <TextRow
            zeile="32a"
            label="Finanzamt"
            value={form.z32a_finanzamt}
            onChange={(v) => set("z32a_finanzamt", v)}
          />
          <TextRow
            zeile="32b"
            label="Steuernummer"
            value={form.z32b_steuernummer}
            onChange={(v) => set("z32b_steuernummer", v)}
          />
          <PairedRow
            zeile="32b"
            label="Betrag (untern. Beteiligung · tariflich)"
            kzA="272"
            kzB="472"
            value={form.z32b_betrag}
            onChange={(s, v) => setPair("z32b_betrag", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="32c"
            label="Widerruf Antrag tarifliche ESt"
            value={form.z32c_widerruf}
            onChange={(s, v) => setPairBool("z32c_widerruf", s, v)}
            zus={zus}
          />
          <TextRow
            zeile="32d"
            label="Gesellschaft (Widerruf)"
            value={form.z32d_gesellschaft}
            onChange={(v) => set("z32d_gesellschaft", v)}
          />
          <TextRow
            zeile="32e"
            label="Finanzamt (Widerruf)"
            value={form.z32e_finanzamt}
            onChange={(v) => set("z32e_finanzamt", v)}
          />
          <TextRow
            zeile="32f"
            label="Steuernummer (Widerruf)"
            value={form.z32f_steuernummer}
            onChange={(v) => set("z32f_steuernummer", v)}
          />
          <PairedRow
            zeile="33"
            label="Korrespondenzprinzip § 32d Abs. 2 Nr. 4"
            kzA="277"
            kzB="477"
            value={form.z33_korrespondenz}
            onChange={(s, v) => setPair("z33_korrespondenz", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="34"
            label="Spezial-Investmentanteile § 20 Abs. 1 Nr. 3a"
            kzA="209"
            kzB="409"
            value={form.z34_spezialinvest}
            onChange={(s, v) => setPairBool("z34_spezialinvest", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="35"
            label="Ermäßigte Besteuerung § 34 · zu Z. 7/18/19/26/26a/52"
            kzA="265"
            kzB="465"
            value={form.z35_ermaessigte_265}
            onChange={(s, v) => setPair("z35_ermaessigte_265", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="36"
            label="Ermäßigte Besteuerung § 34 · zu Z. 27–30/32b/33/54"
            kzA="279"
            kzB="479"
            value={form.z36_ermaessigte_279}
            onChange={(s, v) => setPair("z36_ermaessigte_279", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection title="5. Steuerabzugsbeträge (Z. 37–48)">
          <div className="bmf-form__row" style={{ background: "#eef1f6" }}>
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div
              className="bmf-form__label"
              style={{ fontStyle: "italic", color: "#15233d" }}
            >
              Zu Erträgen Z. 7–23 (Sondertarif 25 %)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <PairedRow
            zeile="37"
            label="Kapitalertragsteuer"
            kzA="280"
            kzB="480"
            value={form.z37_kest}
            onChange={(s, v) => setPair("z37_kest", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="38"
            label="Solidaritätszuschlag"
            kzA="281"
            kzB="481"
            value={form.z38_soli}
            onChange={(s, v) => setPair("z38_soli", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="39"
            label="Kirchensteuer zur KESt"
            kzA="282"
            kzB="482"
            value={form.z39_kist}
            onChange={(s, v) => setPair("z39_kist", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="40"
            label="Angerechnete ausländische Steuern"
            kzA="283"
            kzB="483"
            value={form.z40_angerechnete_ausl}
            onChange={(s, v) => setPair("z40_angerechnete_ausl", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="41"
            label="Anrechenbare, noch nicht angerechnete ausl. Steuern"
            kzA="284"
            kzB="484"
            value={form.z41_anrechenbare_noch_nicht}
            onChange={(s, v) => setPair("z41_anrechenbare_noch_nicht", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="42"
            label="Fiktive ausländische Quellensteuer"
            kzA="285"
            kzB="485"
            value={form.z42_fiktive_quellensteuer}
            onChange={(s, v) => setPair("z42_fiktive_quellensteuer", s, v)}
            zus={zus}
          />

          <div className="bmf-form__row" style={{ background: "#eef1f6" }}>
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div
              className="bmf-form__label"
              style={{ fontStyle: "italic", color: "#15233d" }}
            >
              Zu Erträgen Z. 28–34 (tariflich)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <PairedRow
            zeile="43"
            label="Kapitalertragsteuer (tariflich)"
            kzA="286"
            kzB="486"
            value={form.z43_kest_tariflich}
            onChange={(s, v) => setPair("z43_kest_tariflich", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="44"
            label="Solidaritätszuschlag (tariflich)"
            kzA="287"
            kzB="487"
            value={form.z44_soli_tariflich}
            onChange={(s, v) => setPair("z44_soli_tariflich", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="45"
            label="Kirchensteuer (tariflich)"
            kzA="288"
            kzB="488"
            value={form.z45_kist_tariflich}
            onChange={(s, v) => setPair("z45_kist_tariflich", s, v)}
            zus={zus}
          />
          <JaNeinPair
            zeile="46"
            label="§ 36a EStG / § 31 Abs. 3 InvStG: keine volle Anrechnung"
            kzA="206"
            kzB="406"
            value={form.z46_par36a}
            onChange={(s, v) => setPairBool("z46_par36a", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="47"
            label="Kürzungsbetrag § 11 AStG · Sondertarif"
            kzA="666"
            kzB="866"
            value={form.z47_kuerzung_sondertarif}
            onChange={(s, v) => setPair("z47_kuerzung_sondertarif", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="48"
            label="Kürzungsbetrag · tariflich"
            kzA="667"
            kzB="867"
            value={form.z48_kuerzung_tariflich}
            onChange={(s, v) => setPair("z48_kuerzung_tariflich", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 6 ============ */}
        <BmfSection title="6. Ausländische Familienstiftungen § 15 AStG (Z. 49–54)">
          <TextRow
            zeile="49"
            label="Bezeichnung der Familienstiftung"
            value={form.z49_bezeichnung}
            onChange={(v) => set("z49_bezeichnung", v)}
          />
          <TextRow
            zeile="50"
            label="Finanzamt"
            value={form.z50_finanzamt}
            onChange={(v) => set("z50_finanzamt", v)}
          />
          <TextRow
            zeile="51"
            label="Steuernummer"
            value={form.z51_steuernummer}
            onChange={(v) => set("z51_steuernummer", v)}
          />
          <PairedRow
            zeile="52"
            label="Einkünfte (Sondertarif)"
            kzA="238"
            kzB="438"
            value={form.z52_einkuenfte_sondertarif}
            onChange={(s, v) => setPair("z52_einkuenfte_sondertarif", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="53"
            label="Anzurechnende ausländische Steuern (zu Z. 52)"
            kzA="208"
            kzB="408"
            value={form.z53_anzurechnende_ausl}
            onChange={(s, v) => setPair("z53_anzurechnende_ausl", s, v)}
            zus={zus}
          />
          <PairedRow
            zeile="54"
            label="Einkünfte (tariflich)"
            kzA="278"
            kzB="478"
            value={form.z54_einkuenfte_tariflich}
            onChange={(s, v) => setPair("z54_einkuenfte_tariflich", s, v)}
            zus={zus}
          />
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection title="7. Steuerstundungsmodelle § 15b EStG (Z. 55)">
          <PairedRow
            zeile="55"
            label="Einkünfte aus § 15b-Modellen"
            value={form.z55_steuerstundung}
            onChange={(s, v) => setPair("z55_steuerstundung", s, v)}
            zus={zus}
          />
        </BmfSection>

        <BmfRow
          kz=""
          label="Summe Kapitalerträge (Z. 7 + 18 + 19 + 26 + 26a · Info)"
          value={kapErtraegeGesamt}
          subtotal
        />
        <BmfRow
          kz=""
          label="Summe Aktienverluste (Z. 13 + 23 · Info)"
          value={verlusteAktien}
          subtotal
        />
        <BmfRow
          kz=""
          label="Summe sonstige Verluste (Z. 12 + 14 + 15 + 22 · Info)"
          value={verlusteOhneAktien}
          subtotal
        />

        <BmfResult
          label="Anrechenbare Steuern gesamt (Z. 37+40+41+42+43+53 · Info)"
          value={anzurechnendeSteuern}
          variant="primary"
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Verlustverrechnung § 20 Abs. 6 EStG:</strong>{" "}
            Aktienverluste nur mit Aktiengewinnen (Z. 13/23 gegen Z. 8/20).
            Termingeschäfte (Z. 14) bis 20.000 €/Jahr gegen Termingewinne.
            Sonstige Verluste (Z. 12/15/22) gegen laufende Kapitalerträge.
            Nicht ausgeglichene Verluste werden vorgetragen.
          </p>
          <p>
            <strong>Sparer-Pauschbetrag:</strong>{" "}
            {euro.format(SPARER_PAUSCHBETRAG_EINZEL)} /{" "}
            {euro.format(SPARER_PAUSCHBETRAG_ZUSAMMEN)}. Z. 16 +
            Z. 17 zusammen dürfen Maximum nicht überschreiten.
          </p>
          <p>
            <strong>Günstigerprüfung (Z. 4):</strong> Finanzamt prüft, ob
            tariflicher Steuersatz niedriger als 25 % — keine automatische
            Berechnung.
          </p>
          <p>
            <strong>NICHT automatisch:</strong> § 36a EStG (45-Tage-Regel
            Dividendenanrechnung), § 32d Abs. 2 Ausnahmen vom Sondertarif,
            § 11 AStG Kürzungsberechnung, Spezial-Investmentanteile-
            Besonderheiten, Teileinkünfteverfahren (40 % frei).
          </p>
          <p>
            <strong>Zugehörige Anlagen:</strong> KAP-BET (Beteiligungen),
            KAP-INV (Investmentanteile), AUS (ausländische Einkünfte).
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> Person B i. d. R. Kz +200
            (200er → 400er) oder +200 (600er → 800er).
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

function PairedRow({
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

function JaNeinPair({
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
  value: PairedBool;
  onChange: (side: "a" | "b", v: JaNein) => void;
  zus: boolean;
}) {
  return (
    <>
      <WideRow
        kz={kzA ?? ""}
        zeile={zeile}
        label={zus ? `${label} (Person A)` : label}
        wide={140}
      >
        <select
          value={value.a}
          onChange={(e) => onChange("a", e.target.value as JaNein)}
          style={selectStyle}
        >
          <option value="">—</option>
          <option value="ja">1 · Ja</option>
          <option value="nein">2 · Nein</option>
        </select>
      </WideRow>
      {zus && (
        <WideRow kz={kzB ?? ""} zeile={zeile} label={`${label} (Person B)`} wide={140}>
          <select
            value={value.b}
            onChange={(e) => onChange("b", e.target.value as JaNein)}
            style={selectStyle}
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
