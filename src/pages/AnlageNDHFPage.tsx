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
type FirmenwagenWahl = "ja_ganz" | "nein" | "ja_teilweise" | "";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// ---------- Unterkunftskosten-Höchstbetrag § 9 Abs. 1 Nr. 5 Satz 4 EStG
// 1.000 € pro Monat im Inland; im Ausland kein solcher Höchstbetrag (statt-
// dessen Angemessenheit nach BFH-Rechtsprechung). Auto-Hinweis.
const UNTERKUNFT_MAX_MONAT_INLAND = 1000;

// ---------- State ------------------------------------------------------

type AnlageNDHF = {
  person_name: string;
  person_idnr: string;

  // Section 1
  z4_begruendet_am: string;
  z5_grund: string;
  z6_bestand_bis: string;
  z7_beschaeftigungsort: string;
  z8_ausland: boolean;
  z9_hausstand_vorhanden: JaNein;
  z9_ausl_staat: string;
  z10_plz_ort: string;
  z10_seit: string;
  z11_auswaertstaetigkeit_vorausgegangen: boolean;
  z12_statt_mehrfachheimfahrt: boolean;

  // Section 2 · Fahrtkosten
  z13_firmenwagen: FirmenwagenWahl;
  z14_pkw_km: number;
  z14_pkw_satz: number;
  z15_motorrad_km: number;
  z15_motorrad_satz: number;
  z16_oepnv: number;
  z17_entfernung_km: number;
  z17_anzahl: number;
  z18_oepnv_kosten: number;

  // Behinderung
  z19_einfache_entfernung: number;
  z19_pkw_km: number;
  z19_anzahl: number;
  z20_satz: number;
  z21_oepnv: number;
  z22_faehr_flug: number;

  // Section 3
  z23_unterkunft: number;
  z24_groesse_qm: number;

  // Section 4 · Verpflegung
  // Inland
  z25_an_abreise_tage: number;
  z26_ganztag_tage: number;
  z27_kuerzung: number;
  // Ausland
  z28_an_abreise_tage: number;
  z28_pauschbetrag: number;
  z29_ganztag_tage: number;
  z29_pauschbetrag: number;
  z30_kuerzung: number;

  // Section 5
  z32_sonstige: number;
  z33_weitere_dhf: number;
  z34_ag_erstattung: number;
};

const DEFAULT: AnlageNDHF = {
  person_name: "",
  person_idnr: "",
  z4_begruendet_am: "",
  z5_grund: "",
  z6_bestand_bis: "",
  z7_beschaeftigungsort: "",
  z8_ausland: false,
  z9_hausstand_vorhanden: "",
  z9_ausl_staat: "",
  z10_plz_ort: "",
  z10_seit: "",
  z11_auswaertstaetigkeit_vorausgegangen: false,
  z12_statt_mehrfachheimfahrt: false,
  z13_firmenwagen: "",
  z14_pkw_km: 0,
  z14_pkw_satz: 0.3,
  z15_motorrad_km: 0,
  z15_motorrad_satz: 0.2,
  z16_oepnv: 0,
  z17_entfernung_km: 0,
  z17_anzahl: 0,
  z18_oepnv_kosten: 0,
  z19_einfache_entfernung: 0,
  z19_pkw_km: 0,
  z19_anzahl: 0,
  z20_satz: 0,
  z21_oepnv: 0,
  z22_faehr_flug: 0,
  z23_unterkunft: 0,
  z24_groesse_qm: 0,
  z25_an_abreise_tage: 0,
  z26_ganztag_tage: 0,
  z27_kuerzung: 0,
  z28_an_abreise_tage: 0,
  z28_pauschbetrag: 0,
  z29_ganztag_tage: 0,
  z29_pauschbetrag: 0,
  z30_kuerzung: 0,
  z32_sonstige: 0,
  z33_weitere_dhf: 0,
  z34_ag_erstattung: 0,
};

const FORM_ID = "anlage-n-dhf";

function loadForm(mandantId: string | null, jahr: number): AnlageNDHF {
  const parsed = readEstForm<Partial<AnlageNDHF>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Main page --------------------------------------------------

export default function AnlageNDHFPage() {
  return (
    <MandantRequiredGuard>
      <AnlageNDHFPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageNDHFPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageNDHF>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageNDHF>(key: K, value: AnlageNDHF[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // --- Fahrtkosten-Summe (Info) -------------------------------------
  const fahrtkostenSumme = useMemo(() => {
    const ersteLetzte =
      form.z14_pkw_km * form.z14_pkw_satz +
      form.z15_motorrad_km * form.z15_motorrad_satz +
      form.z16_oepnv;
    // Wöchentliche Familienheimfahrten · 0,30 €/km × anzahl (vereinfacht)
    // Tatsächlich gilt 0,30 €/km für erste 20 km, 0,38 €/km ab km 21 — hier
    // vereinfacht als generische Pauschale, da die genaue Regelung für DHF
    // dem § 9 Abs. 1 Nr. 5 Satz 5 EStG in Verbindung mit § 9 Abs. 1 Nr. 4
    // folgt.
    const wochenfahrten = form.z17_entfernung_km * form.z17_anzahl * 0.3;
    const oepnv_familienheim = form.z18_oepnv_kosten;
    // Behinderung · vereinfacht 0,30 €/km (Hin- und Rückfahrt anrechenbar)
    const behindert =
      form.z19_pkw_km * (form.z20_satz || 0.3) * form.z19_anzahl +
      form.z21_oepnv +
      form.z22_faehr_flug;
    return ersteLetzte + wochenfahrten + oepnv_familienheim + behindert;
  }, [form]);

  // --- Verpflegung Inland (ohne auto-rate — user füllt Z. 27) -------
  const verpflegungInland = useMemo(() => {
    // 2025: An-/Abreise 14 €, ganztägig 28 €
    const berechnung = form.z25_an_abreise_tage * 14 + form.z26_ganztag_tage * 28;
    return Math.max(0, berechnung - form.z27_kuerzung);
  }, [form.z25_an_abreise_tage, form.z26_ganztag_tage, form.z27_kuerzung]);

  // --- Verpflegung Ausland (user gibt Pauschbetrag selbst an) -------
  const z28_euro = form.z28_an_abreise_tage * form.z28_pauschbetrag;
  const z29_euro = form.z29_ganztag_tage * form.z29_pauschbetrag;
  const z31_ausland = Math.max(0, z28_euro + z29_euro - form.z30_kuerzung);

  // --- Unterkunftskosten: Inlands-Höchstbetrag 1.000 €/Monat --------
  // Wir zeigen einen Hinweis, ob Z.23 den 12-Monats-Höchstbetrag übersteigt.
  const inlandsCap12Monate = UNTERKUNFT_MAX_MONAT_INLAND * 12;
  const unterkunftUeberschreitet =
    !form.z8_ausland && form.z23_unterkunft > inlandsCap12Monate;

  // --- Gesamt (Info) -----------------------------------------------
  const gesamtAufwand = useMemo(() => {
    const verpflegung = form.z8_ausland ? z31_ausland : verpflegungInland;
    return (
      fahrtkostenSumme +
      form.z23_unterkunft +
      verpflegung +
      form.z32_sonstige +
      form.z33_weitere_dhf -
      form.z34_ag_erstattung
    );
  }, [
    form.z8_ausland,
    form.z23_unterkunft,
    form.z32_sonstige,
    form.z33_weitere_dhf,
    form.z34_ag_erstattung,
    fahrtkostenSumme,
    verpflegungInland,
    z31_ausland,
  ]);

  function validate(): string[] {
    const warns: string[] = [];
    if (
      form.z4_begruendet_am &&
      form.z6_bestand_bis &&
      form.z4_begruendet_am > form.z6_bestand_bis
    ) {
      warns.push("Z. 4 / Z. 6: Begründung liegt nach Ende.");
    }
    if (
      form.z10_seit &&
      form.z4_begruendet_am &&
      form.z10_seit > form.z4_begruendet_am
    ) {
      warns.push(
        "Z. 10 'seit': eigener Hausstand muss vor Begründung DHF bestanden haben."
      );
    }
    if (unterkunftUeberschreitet) {
      warns.push(
        `Z. 23 Unterkunftskosten > ${euro.format(inlandsCap12Monate)} (Höchstbetrag § 9 Abs. 1 Nr. 5 Satz 4 — 1.000 €/Monat × 12). Überschreitung nicht absetzbar.`
      );
    }
    if (
      form.z25_an_abreise_tage + form.z26_ganztag_tage > 90 ||
      form.z28_an_abreise_tage + form.z29_ganztag_tage > 90
    ) {
      warns.push(
        "3-Monats-Frist (§ 9 Abs. 4a Satz 6 EStG): Verpflegungsmehraufwand ist auf 3 Monate beschränkt — bei Überschreiten kein weiterer Abzug."
      );
    }
    if (
      form.z9_hausstand_vorhanden === "nein" &&
      (form.z23_unterkunft > 0 || form.z25_an_abreise_tage > 0)
    ) {
      warns.push(
        "Z. 9: Ohne eigenen Hausstand am Lebensmittelpunkt ist keine doppelte Haushaltsführung abzugsfähig."
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 8000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-n-dhf"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-n-dhf",
      summary: `Anlage N-DHF gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-n-dhf",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        fahrtkostenSumme,
        verpflegungInland,
        z31_ausland,
        gesamtAufwand,
        form,
      },
    });
    toast.success("Anlage N-DHF gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage N-DHF</h1>
          <p>
            Doppelte Haushaltsführung · Mehraufwendungen nach § 9 Abs. 1 Nr. 5
            EStG · VZ {selectedYear} · Pro Person ein Formular.
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
          Anlage N-DHF · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-n-dhf" />

      <section className="card taxcalc__section no-print">
        <h2>Profil</h2>
        <div className="form-grid">
          <label className="form-field">
            <span>Name, Vorname</span>
            <input
              type="text"
              value={form.person_name}
              onChange={(e) => set("person_name", e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Identifikationsnummer</span>
            <input
              type="text"
              value={form.person_idnr}
              onChange={(e) => set("person_idnr", e.target.value)}
              maxLength={11}
            />
          </label>
        </div>
      </section>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Voraussetzungen doppelte Haushaltsführung:</strong>{" "}
          (1) eigener Hausstand am Lebensmittelpunkt, (2) beruflich
          veranlasste Zweitwohnung am Tätigkeitsort, (3) finanzielle
          Beteiligung am Hauptwohnsitz ({">"} 10 %). Die 3-Monats-Frist
          begrenzt Verpflegungsmehraufwand. Unterkunftskosten Inland
          max. {euro.format(UNTERKUNFT_MAX_MONAT_INLAND)} /Monat.
        </div>
      </aside>

      <BmfForm
        title="Anlage N-DHF"
        subtitle={`Doppelte Haushaltsführung · VZ ${selectedYear}${form.person_name ? " · " + form.person_name : ""}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Allgemeine Angaben (Z. 4–12)">
          <DateRow
            kz="501"
            zeile="4"
            label="Der doppelte Haushalt wurde aus beruflichem Anlass begründet am"
            value={form.z4_begruendet_am}
            onChange={(v) => set("z4_begruendet_am", v)}
          />
          <TextRow
            zeile="5"
            label="Grund"
            value={form.z5_grund}
            onChange={(v) => set("z5_grund", v)}
            placeholder="z. B. neue Stelle, Versetzung"
          />
          <DateRow
            kz="502"
            zeile="6"
            label="Hat ununterbrochen bestanden bis"
            value={form.z6_bestand_bis}
            onChange={(v) => set("z6_bestand_bis", v)}
          />
          <TextRow
            zeile="7"
            label="Beschäftigungsort (PLZ, Ort; bei Ausland Staat)"
            value={form.z7_beschaeftigungsort}
            onChange={(v) => set("z7_beschaeftigungsort", v)}
          />
          <CheckboxRow
            kz="507"
            zeile="8"
            label="Der doppelte Haushalt liegt im Ausland"
            value={form.z8_ausland}
            onChange={(v) => set("z8_ausland", v)}
          />
          <JaNeinRow
            kz="503"
            zeile="9"
            label="Eigener Hausstand am Lebensmittelpunkt vorhanden"
            value={form.z9_hausstand_vorhanden}
            onChange={(v) => set("z9_hausstand_vorhanden", v)}
          />
          {form.z8_ausland && (
            <TextRow
              zeile="9"
              label="Ausländischer Staat des doppelten Haushalts"
              value={form.z9_ausl_staat}
              onChange={(v) => set("z9_ausl_staat", v)}
            />
          )}
          <TextRow
            zeile="10"
            label="PLZ, Ort des eigenen Hausstandes"
            value={form.z10_plz_ort}
            onChange={(v) => set("z10_plz_ort", v)}
          />
          <DateRow
            kz="504"
            zeile="10"
            label="… seit"
            value={form.z10_seit}
            onChange={(v) => set("z10_seit", v)}
          />
          <CheckboxRow
            kz="505"
            zeile="11"
            label="Der Begründung ging eine Auswärtstätigkeit am selben Ort unmittelbar voraus"
            value={form.z11_auswaertstaetigkeit_vorausgegangen}
            onChange={(v) => set("z11_auswaertstaetigkeit_vorausgegangen", v)}
          />
          <CheckboxRow
            kz="506"
            zeile="12"
            label="Statt DHF-Mehraufwand werden in Anlage N (Z. 27–50) Fahrtkosten für mehr als eine Heimfahrt/Woche geltend gemacht"
            value={form.z12_statt_mehrfachheimfahrt}
            onChange={(v) => set("z12_statt_mehrfachheimfahrt", v)}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection
          title="2. Fahrtkosten (Z. 13–22)"
          description="Erste/letzte Fahrt + wöchentliche Familienheimfahrten. Bei Grad der Behinderung ≥ 70 oder ≥ 50 mit Merkzeichen 'G': Section 19–22 zusätzlich."
          total={fahrtkostenSumme}
        >
          <WideRow kz="510" zeile="13" label="Firmenwagen / unentgeltliche Sammelbeförderung" wide={220}>
            <select
              value={form.z13_firmenwagen}
              onChange={(e) =>
                set("z13_firmenwagen", e.target.value as FirmenwagenWahl)
              }
              style={selectStyle}
            >
              <option value="">—</option>
              <option value="ja_ganz">1 · Ja insgesamt</option>
              <option value="nein">2 · Nein</option>
              <option value="ja_teilweise">3 · Ja teilweise</option>
            </select>
          </WideRow>

          <KmRateRow
            kzKm="511"
            kzSatz="512"
            zeile="14"
            label="Erste/letzte Fahrt · privates Kfz"
            km={form.z14_pkw_km}
            satz={form.z14_pkw_satz}
            onKm={(v) => set("z14_pkw_km", v)}
            onSatz={(v) => set("z14_pkw_satz", v)}
          />
          <KmRateRow
            kzKm="522"
            kzSatz="523"
            zeile="15"
            label="Erste/letzte Fahrt · privates Motorrad/Motorroller"
            km={form.z15_motorrad_km}
            satz={form.z15_motorrad_satz}
            onKm={(v) => set("z15_motorrad_km", v)}
            onSatz={(v) => set("z15_motorrad_satz", v)}
          />
          <BmfInputRow
            kz="513"
            label="Erste/letzte Fahrt · öffentl. Verkehrsmittel / Sammelbeförderung"
            hint="Z. 16"
            value={form.z16_oepnv}
            onChange={(v) => set("z16_oepnv", v)}
          />

          <WideRow
            kz="514/515"
            zeile="17"
            label="Wöchentliche Familienheimfahrten · einfache Entfernung · Anzahl"
            wide={260}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
                width: "100%",
              }}
            >
              <input
                type="number"
                min={0}
                step={1}
                value={form.z17_entfernung_km === 0 ? "" : form.z17_entfernung_km}
                onChange={(e) =>
                  set("z17_entfernung_km", Number(e.target.value) || 0)
                }
                placeholder="km"
                style={monoInputStyle}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={form.z17_anzahl === 0 ? "" : form.z17_anzahl}
                onChange={(e) =>
                  set("z17_anzahl", Number(e.target.value) || 0)
                }
                placeholder="Anzahl"
                style={monoInputStyle}
              />
            </div>
          </WideRow>
          <BmfInputRow
            kz="516"
            label="Wöchentliche Heimfahrten · öffentl. Verkehrsmittel"
            hint="Z. 18"
            value={form.z18_oepnv_kosten}
            onChange={(v) => set("z18_oepnv_kosten", v)}
          />

          {/* Behinderung */}
          <div
            className="bmf-form__row"
            style={{ background: "#eef1f6", fontStyle: "italic" }}
          >
            <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
            <div className="bmf-form__label" style={{ fontWeight: 600, color: "#15233d" }}>
              Nur bei Grad der Behinderung ≥ 70 oder ≥ 50 mit Merkzeichen "G" (Z. 19–22)
            </div>
            <div className="bmf-form__amount">—</div>
          </div>
          <WideRow
            kz="524/517/518"
            zeile="19"
            label="Einfache Entfernung · davon mit PKW · Anzahl Heimfahrten"
            wide={300}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 4,
                width: "100%",
              }}
            >
              <input
                type="number"
                min={0}
                step={1}
                value={form.z19_einfache_entfernung === 0 ? "" : form.z19_einfache_entfernung}
                onChange={(e) =>
                  set("z19_einfache_entfernung", Number(e.target.value) || 0)
                }
                placeholder="km"
                style={monoInputStyle}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={form.z19_pkw_km === 0 ? "" : form.z19_pkw_km}
                onChange={(e) => set("z19_pkw_km", Number(e.target.value) || 0)}
                placeholder="PKW km"
                style={monoInputStyle}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={form.z19_anzahl === 0 ? "" : form.z19_anzahl}
                onChange={(e) => set("z19_anzahl", Number(e.target.value) || 0)}
                placeholder="Anzahl"
                style={monoInputStyle}
              />
            </div>
          </WideRow>
          <BmfInputRow
            kz="519"
            label="Kilometersatz bei Einzelnachweis (€/km)"
            hint="Z. 20"
            value={form.z20_satz}
            onChange={(v) => set("z20_satz", v)}
            step={0.01}
          />
          <BmfInputRow
            kz="520"
            label="Kosten öffentl. Verkehrsmittel"
            hint="Z. 21"
            value={form.z21_oepnv}
            onChange={(v) => set("z21_oepnv", v)}
          />
          <BmfInputRow
            kz="521"
            label="Fähr- und Flugkosten / entgeltliche Sammelbeförderung"
            hint="Z. 22"
            value={form.z22_faehr_flug}
            onChange={(v) => set("z22_faehr_flug", v)}
          />

          <BmfRow
            kz=""
            label="Summe Fahrtkosten (vereinfachter Info-Wert)"
            value={fahrtkostenSumme}
            subtotal
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection
          title="3. Kosten der Unterkunft (Z. 23–24)"
          description={`Im Inland max. ${euro.format(UNTERKUNFT_MAX_MONAT_INLAND)}/Monat = ${euro.format(inlandsCap12Monate)}/Jahr (§ 9 Abs. 1 Nr. 5 Satz 4). Im Ausland: Angemessenheit nach BFH.`}
        >
          <BmfInputRow
            kz="530"
            label="Aufwendungen (Miete, Stellplatz, Nebenkosten)"
            hint="Z. 23"
            value={form.z23_unterkunft}
            onChange={(v) => set("z23_unterkunft", v)}
          />
          {form.z8_ausland && (
            <BmfInputRow
              kz="531"
              label="Größe Zweitwohnung (m²) · nur Ausland"
              hint="Z. 24"
              value={form.z24_groesse_qm}
              onChange={(v) => set("z24_groesse_qm", v)}
            />
          )}
          {unterkunftUeberschreitet && (
            <BmfRow
              kz=""
              label={`⚠ Überschreitung Höchstbetrag ${euro.format(inlandsCap12Monate)}`}
              value={form.z23_unterkunft - inlandsCap12Monate}
              subtotal
            />
          )}
        </BmfSection>

        {/* ============ Section 4 Inland ============ */}
        {!form.z8_ausland && (
          <BmfSection
            title="4. Verpflegungsmehraufwand Inland (Z. 25–27)"
            description="Pauschbeträge 2025: An-/Abreise 14 € · 24h-Abwesenheit 28 €. 3-Monats-Frist pro DHF."
            total={verpflegungInland}
          >
            <BmfInputRow
              kz="541"
              label="Anzahl An- und Abreisetage"
              hint="Z. 25 · 14 €/Tag"
              value={form.z25_an_abreise_tage}
              onChange={(v) => set("z25_an_abreise_tage", v)}
              step={1}
            />
            <BmfInputRow
              kz="542"
              label="Tage mit Abwesenheit ≥ 24 Stunden"
              hint="Z. 26 · 28 €/Tag"
              value={form.z26_ganztag_tage}
              onChange={(v) => set("z26_ganztag_tage", v)}
              step={1}
            />
            <BmfInputRow
              kz="544"
              label="Kürzungsbetrag wegen Mahlzeitengestellung"
              hint="Z. 27 · wird abgezogen"
              value={form.z27_kuerzung}
              onChange={(v) => set("z27_kuerzung", v)}
            />
            <BmfRow
              kz=""
              label="Verpflegungsmehraufwand Inland (auto · 14 € × Z. 25 + 28 € × Z. 26 − Z. 27)"
              value={verpflegungInland}
              subtotal
            />
          </BmfSection>
        )}

        {/* ============ Section 4 Ausland ============ */}
        {form.z8_ausland && (
          <BmfSection
            title="4. Verpflegungsmehraufwand Ausland (Z. 28–31)"
            description="Länderspezifische Pauschbeträge aus BMF-Schreiben einsetzen. 3-Monats-Frist gilt auch im Ausland."
            total={z31_ausland}
          >
            <BmfInputRow
              kz=""
              label="An- und Abreisetage"
              hint="Z. 28 · Anzahl"
              value={form.z28_an_abreise_tage}
              onChange={(v) => set("z28_an_abreise_tage", v)}
              step={1}
            />
            <BmfInputRow
              kz=""
              label="Pauschbetrag für An- und Abreisetage"
              hint="Z. 28 · €/Tag (aus BMF-Schreiben)"
              value={form.z28_pauschbetrag}
              onChange={(v) => set("z28_pauschbetrag", v)}
            />
            <BmfRow
              kz=""
              label="Z. 28 auto = Tage × Pauschbetrag"
              value={z28_euro}
              subtotal
            />
            <BmfInputRow
              kz=""
              label="Tage mit Abwesenheit ≥ 24 Stunden"
              hint="Z. 29 · Anzahl"
              value={form.z29_ganztag_tage}
              onChange={(v) => set("z29_ganztag_tage", v)}
              step={1}
            />
            <BmfInputRow
              kz=""
              label="Pauschbetrag 24h-Abwesenheit"
              hint="Z. 29 · €/Tag"
              value={form.z29_pauschbetrag}
              onChange={(v) => set("z29_pauschbetrag", v)}
            />
            <BmfRow
              kz=""
              label="Z. 29 auto = Tage × Pauschbetrag"
              value={z29_euro}
              subtotal
            />
            <BmfInputRow
              kz=""
              label="Kürzungsbetrag Mahlzeitengestellung (abzgl. Zuzahlungen)"
              hint="Z. 30"
              value={form.z30_kuerzung}
              onChange={(v) => set("z30_kuerzung", v)}
            />
            <BmfRow
              kz="543"
              label="Summe Verpflegungsmehraufwand Ausland (Z. 31 = 28 + 29 − 30)"
              value={z31_ausland}
              subtotal
            />
          </BmfSection>
        )}

        {/* ============ Section 5 ============ */}
        <BmfSection
          title="5. Sonstige Aufwendungen + AG-Erstattungen (Z. 32–34)"
          description="Umzug, Einrichtung, Hausrat — ohne Unterkunftskosten (Z. 23)."
        >
          <BmfInputRow
            kz="550"
            label="Sonstige Aufwendungen (Umzug, Einrichtung, Hausrat)"
            hint="Z. 32"
            value={form.z32_sonstige}
            onChange={(v) => set("z32_sonstige", v)}
          />
          <BmfInputRow
            kz="551"
            label="Weitere DHF-Aufwendungen (laut Aufstellung)"
            hint="Z. 33"
            value={form.z33_weitere_dhf}
            onChange={(v) => set("z33_weitere_dhf", v)}
          />
          <BmfInputRow
            kz="590"
            label="Steuerfrei erstattete AG-Leistungen / Zuschüsse"
            hint="Z. 34 · wird abgezogen"
            value={form.z34_ag_erstattung}
            onChange={(v) => set("z34_ag_erstattung", v)}
          />
        </BmfSection>

        <BmfResult
          label="Abziehbarer Gesamtaufwand (Info · Fahrt + Unterkunft + Verpflegung + Sonstige − AG-Erstattung)"
          value={gesamtAufwand}
          variant={gesamtAufwand > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Auto-Berechnungen:</strong> Fahrtkosten-Summe · Inland-
            Verpflegung (14 € × Z. 25 + 28 € × Z. 26 − Z. 27) · Ausland Z. 28/29
            als Tage × Pauschbetrag · Z. 31 = Z. 28 + Z. 29 − Z. 30 · Gesamt =
            Fahrtkosten + Z. 23 + Verpflegung + Z. 32 + Z. 33 − Z. 34.
          </p>
          <p>
            <strong>Wichtige gesetzliche Grenzen:</strong> Unterkunft Inland
            max. {euro.format(UNTERKUNFT_MAX_MONAT_INLAND)}/Monat (§ 9 Abs. 1
            Nr. 5 Satz 4) · 3-Monats-Frist für Verpflegungsmehraufwand (§ 9
            Abs. 4a Satz 6) · bei Grad der Behinderung ≥ 70 oder ≥ 50+G
            zusätzliche Kfz-Nutzung absetzbar.
          </p>
          <p>
            <strong>NICHT automatisch:</strong> Prüfung des eigenen Hausstandes
            (finanzielle Beteiligung {">"} 10 %), 3-Monats-Frist-Anwendung pro
            DHF-Fall, Auslands-Pauschbeträge länderspezifisch (BMF-Schreiben),
            Mahlzeitenkürzung (20 % / 40 % / 40 % der Pauschale je Mahlzeit),
            Zweitwohnungssteuer als Werbungskosten.
          </p>
          <p>
            <strong>Fahrtkosten-Berechnung:</strong> Die Summe Z. 14–22 wird
            hier vereinfacht mit 0,30 €/km summiert. Die genaue Staffelung
            (0,30 € für km 1–20, 0,38 € ab km 21) nach § 9 Abs. 1 Nr. 4 EStG
            greift formal nur für Entfernungspauschale, nicht für DHF-
            Heimfahrten — fachliche Abstimmung.
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

function CheckboxRow({
  kz,
  zeile,
  label,
  value,
  onChange,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <WideRow kz={kz} zeile={zeile} label={label} wide={60}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </WideRow>
  );
}

function KmRateRow({
  kzKm,
  kzSatz,
  zeile,
  label,
  km,
  satz,
  onKm,
  onSatz,
}: {
  kzKm: string;
  kzSatz: string;
  zeile: string;
  label: string;
  km: number;
  satz: number;
  onKm: (v: number) => void;
  onSatz: (v: number) => void;
}) {
  return (
    <WideRow kz={`${kzKm}/${kzSatz}`} zeile={zeile} label={`${label} · km · Satz €/km`} wide={240}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 4, width: "100%" }}>
        <input
          type="number"
          min={0}
          step={1}
          value={km === 0 ? "" : km}
          onChange={(e) => onKm(Number(e.target.value) || 0)}
          placeholder="km"
          style={monoInputStyle}
        />
        <input
          type="number"
          min={0}
          step={0.01}
          value={satz === 0 ? "" : satz}
          onChange={(e) => onSatz(Number(e.target.value) || 0)}
          placeholder="€/km"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}
