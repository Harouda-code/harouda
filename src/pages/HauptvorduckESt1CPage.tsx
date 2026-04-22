import { useEffect, useState, type ReactNode } from "react";
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
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

type JaNein = "ja" | "nein" | "";

// ---------- State ------------------------------------------------------

type ESt1C = {
  // Section 1
  ist_einkommensteuer: boolean;
  ist_sparzulage: boolean;
  ist_verlustvortrag: boolean;
  ist_mobilitaetspraemie: boolean;
  ist_beschraenkt: boolean;

  // Section 2
  steuernummer: string;
  finanzamt: string;
  oder_bzst: string;

  // Section 3
  idnr: string;
  geburt: string;
  sterbe: string;
  name: string;
  vorname: string;
  titel: string;
  beruf: string;
  strasse: string;
  hausnr: string;
  hausnr_zusatz: string;
  adresse_ergaenzung: string;
  plz: string;
  wohnort: string;
  wohnsitzstaat: string;
  geburtsort: string;
  geburtsland: string;
  staatsangehoerigkeit: string;
  wohnsitz_2025: string;
  weitere_staaten: string;

  // Section 4
  iban_inland: string;
  iban_ausland: string;
  bic_ausland: string;
  abweichender_kontoinhaber: string;

  // Section 5
  z25_par50d10: number;
  z25_par50d10_steuer: number;
  z26_beschaeftigung_ort: string;
  z26_beschaeftigung_von: string;
  z26_beschaeftigung_bis: string;
  z27_arbeitslohn_ohne_abzug: number;
  z27_werbungskosten: number;
  z28_par50d7: number;
  z28_par50d7_steuer: number;
  z29_kap_erklaert: number;
  z30_guenstiger: JaNein;
  z31_kap_tariflich: number;
  z32_kap_versicherung: number;
  z33_kest: number;
  z33_par50a: number;
  z34_soli: number;
  z35_par50a7: number;
  z35_soli_50a7: number;
  z36_par36a: JaNein;
  z37_an_pflicht: JaNein;
  z38_eu_ewr_an: JaNein;
  z39_drittstaat_ausserord: JaNein;
  z40_oeff_kasse_antrag: JaNein;
  z41_progression_angabe: string;
  z42_par50a_einkuenfte: number;
  z43_nicht_dt_est: number;
  z44_ausserordentliche: number;
  z45_einkommensersatz_inland: number;
  z46_einkommensersatz_eu: number;
  z47_par50a_eu: JaNein;
  z48_anlagen_zeile48: string;

  // Section 6
  z49_sparzulage: JaNein;
  z50_arbeitgeber: string;

  // Section 7
  z51_rente_rechtsgrund: string;
  z51_rente_pct: number;
  z51_rente_gezahlt: number;
  z52_rente_empfaenger: string;
  z53_rente_idnr: string;
  z53_rente_inland: JaNein;
  z54_fest_pct: number;
  z54_fest_eur: number;
  z55_last_rechtsgrund: string;
  z55_last_geld: number;
  z56_last_empfaenger: string;
  z56_last_sach: number;
  z57_last_idnr: string;
  z57_last_inland: JaNein;
  z58_last_fest: number;
  z59_spenden_inland_best: number;
  z59_spenden_inland_fa: number;
  z60_spenden_eu_best: number;
  z60_spenden_eu_fa: number;
  z61_parteien_best: number;
  z61_parteien_fa: number;
  z62_waehler_best: number;
  z62_waehler_fa: number;
  z63_stiftung_inland: number;
  z64_stiftung_eu: number;
  z65_berueck_2025: number;
  z66_vortrag: number;

  // Section 8
  z67_registriernummer: string;
  z68_offenlegungsnr: string;
  z69_ohne_nr: JaNein;

  // Section 9
  z70_war_unbeschraenkt: JaNein;
  z71_endete_nach_2014: JaNein;
  z72_ende_datum: string;
  z72_bisheriges_fa: string;
  z72_bisherige_stnr: string;
  z73_5_jahre_unbeschraenkt: JaNein;
  z74_von: string;
  z74_bis: string;
  z75_niedrig_besteuert: JaNein;
  z76_par17_beteiligung: JaNein;
  z77_erl_par17: string;
  z78_personengesellschaft: JaNein;
  z79_erl_personen: string;
  z80_par7_astg: JaNein;
  z81_erl_par7: string;

  // Section 10
  z82_bevollmaechtigter: string;
  z83_empfangsbevollmaechtigter: string;
  z84_bev_name: string;
  z85_bev_vorname: string;
  z86_bev_strasse: string;
  z87_bev_hausnr: string;
  z87_bev_zusatz: string;
  z88_bev_postfach: string;
  z89_bev_plz_ort: string;

  // Section 11
  z90_ergaenzende: 0 | 1 | 2 | 3 | 4;

  // Section 12
  z91_unterschrift_art: "" | "steuerpflichtig" | "bevollmaechtigt";
  z92_unterschrift_datum: string;
  z93_mitwirkung: JaNein;
  z94_mitwirkender: string;
};

const DEFAULT: ESt1C = {
  ist_einkommensteuer: true,
  ist_sparzulage: false,
  ist_verlustvortrag: false,
  ist_mobilitaetspraemie: false,
  ist_beschraenkt: true,
  steuernummer: "",
  finanzamt: "",
  oder_bzst: "",
  idnr: "",
  geburt: "",
  sterbe: "",
  name: "",
  vorname: "",
  titel: "",
  beruf: "",
  strasse: "",
  hausnr: "",
  hausnr_zusatz: "",
  adresse_ergaenzung: "",
  plz: "",
  wohnort: "",
  wohnsitzstaat: "",
  geburtsort: "",
  geburtsland: "",
  staatsangehoerigkeit: "",
  wohnsitz_2025: "",
  weitere_staaten: "",
  iban_inland: "",
  iban_ausland: "",
  bic_ausland: "",
  abweichender_kontoinhaber: "",
  z25_par50d10: 0,
  z25_par50d10_steuer: 0,
  z26_beschaeftigung_ort: "",
  z26_beschaeftigung_von: "",
  z26_beschaeftigung_bis: "",
  z27_arbeitslohn_ohne_abzug: 0,
  z27_werbungskosten: 0,
  z28_par50d7: 0,
  z28_par50d7_steuer: 0,
  z29_kap_erklaert: 0,
  z30_guenstiger: "",
  z31_kap_tariflich: 0,
  z32_kap_versicherung: 0,
  z33_kest: 0,
  z33_par50a: 0,
  z34_soli: 0,
  z35_par50a7: 0,
  z35_soli_50a7: 0,
  z36_par36a: "",
  z37_an_pflicht: "",
  z38_eu_ewr_an: "",
  z39_drittstaat_ausserord: "",
  z40_oeff_kasse_antrag: "",
  z41_progression_angabe: "",
  z42_par50a_einkuenfte: 0,
  z43_nicht_dt_est: 0,
  z44_ausserordentliche: 0,
  z45_einkommensersatz_inland: 0,
  z46_einkommensersatz_eu: 0,
  z47_par50a_eu: "",
  z48_anlagen_zeile48: "",
  z49_sparzulage: "",
  z50_arbeitgeber: "",
  z51_rente_rechtsgrund: "",
  z51_rente_pct: 0,
  z51_rente_gezahlt: 0,
  z52_rente_empfaenger: "",
  z53_rente_idnr: "",
  z53_rente_inland: "",
  z54_fest_pct: 0,
  z54_fest_eur: 0,
  z55_last_rechtsgrund: "",
  z55_last_geld: 0,
  z56_last_empfaenger: "",
  z56_last_sach: 0,
  z57_last_idnr: "",
  z57_last_inland: "",
  z58_last_fest: 0,
  z59_spenden_inland_best: 0,
  z59_spenden_inland_fa: 0,
  z60_spenden_eu_best: 0,
  z60_spenden_eu_fa: 0,
  z61_parteien_best: 0,
  z61_parteien_fa: 0,
  z62_waehler_best: 0,
  z62_waehler_fa: 0,
  z63_stiftung_inland: 0,
  z64_stiftung_eu: 0,
  z65_berueck_2025: 0,
  z66_vortrag: 0,
  z67_registriernummer: "",
  z68_offenlegungsnr: "",
  z69_ohne_nr: "",
  z70_war_unbeschraenkt: "",
  z71_endete_nach_2014: "",
  z72_ende_datum: "",
  z72_bisheriges_fa: "",
  z72_bisherige_stnr: "",
  z73_5_jahre_unbeschraenkt: "",
  z74_von: "",
  z74_bis: "",
  z75_niedrig_besteuert: "",
  z76_par17_beteiligung: "",
  z77_erl_par17: "",
  z78_personengesellschaft: "",
  z79_erl_personen: "",
  z80_par7_astg: "",
  z81_erl_par7: "",
  z82_bevollmaechtigter: "",
  z83_empfangsbevollmaechtigter: "",
  z84_bev_name: "",
  z85_bev_vorname: "",
  z86_bev_strasse: "",
  z87_bev_hausnr: "",
  z87_bev_zusatz: "",
  z88_bev_postfach: "",
  z89_bev_plz_ort: "",
  z90_ergaenzende: 0,
  z91_unterschrift_art: "",
  z92_unterschrift_datum: "",
  z93_mitwirkung: "",
  z94_mitwirkender: "",
};

const FORM_ID = "est-1c";

function loadForm(mandantId: string | null, jahr: number): ESt1C {
  const parsed = readEstForm<Partial<ESt1C>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return { ...DEFAULT, ...parsed };
}

// ---------- Main page --------------------------------------------------

export default function HauptvorduckESt1CPage() {
  return (
    <MandantRequiredGuard>
      <HauptvorduckESt1CPageInner />
    </MandantRequiredGuard>
  );
}

function HauptvorduckESt1CPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const [form, setForm] = useState<ESt1C>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof ESt1C>(key: K, value: ESt1C[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string[] {
    const warns: string[] = [];
    if (form.idnr && !/^\d{11}$/.test(form.idnr)) {
      warns.push("Z. 6: IdNr sollte 11-stellig sein.");
    }
    if (
      form.iban_inland &&
      !/^DE\d{2}[\dA-Z]{18}$/.test(form.iban_inland.replace(/\s/g, ""))
    ) {
      warns.push("Z. 21: Inl. IBAN sollte DE + 22 Zeichen sein.");
    }
    if (form.iban_ausland && form.iban_inland) {
      warns.push("Z. 21/22: Nur eine IBAN eintragen.");
    }
    if (
      form.z71_endete_nach_2014 === "ja" &&
      !form.z72_ende_datum
    ) {
      warns.push("Z. 72: Datum der Beendigung der unbeschränkten StPflicht fehlt.");
    }
    if (form.z69_ohne_nr === "ja" && !form.z67_registriernummer) {
      warns.push(
        "Z. 67/69: Bei DAC6-Meldepflicht ohne Registriernummer — bitte Nachholung beachten."
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 9000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["est-1c"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "est-1c",
      summary: `Hauptvordruck ESt 1 C gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "est-1c",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        form,
      },
    });
    toast.success("Hauptvordruck ESt 1 C gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Hauptvordruck ESt 1 C</h1>
          <p>
            Einkommensteuererklärung für beschränkt steuerpflichtige
            Personen · VZ {selectedYear}.
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
          ESt 1 C · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="est-1c" />

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Beschränkte Steuerpflicht § 1 Abs. 4 EStG:</strong> Nur für
          Personen OHNE inländischen Wohnsitz/gewöhnlichen Aufenthalt, die
          deutsche Einkünfte nach § 49 EStG erzielen. Antragsveranlagung
          § 50 Abs. 2 EStG meist nur für EU/EWR/CH-Ansässige. Alternative
          Formulare: ESt 1 A (unbeschränkt) bzw. ESt 1 B (vereinfacht).
        </div>
      </aside>

      <BmfForm
        title="Einkommensteuererklärung 2025 (ESt 1 C)"
        subtitle={`Beschränkt steuerpflichtige Person · VZ ${selectedYear}${form.name ? " · " + form.name : ""}`}
      >
        {/* ============ Section 1 ============ */}
        <BmfSection title="1. Art der Erklärung (Z. 1–2)">
          <CheckboxRow
            zeile="1"
            label="Einkommensteuererklärung"
            value={form.ist_einkommensteuer}
            onChange={(v) => set("ist_einkommensteuer", v)}
          />
          <CheckboxRow
            zeile="1"
            label="Festsetzung der Arbeitnehmer-Sparzulage"
            value={form.ist_sparzulage}
            onChange={(v) => set("ist_sparzulage", v)}
          />
          <CheckboxRow
            zeile="2"
            label="Erklärung zur Feststellung des verbleibenden Verlustvortrags"
            value={form.ist_verlustvortrag}
            onChange={(v) => set("ist_verlustvortrag", v)}
          />
          <CheckboxRow
            zeile="2"
            label="Festsetzung der Mobilitätsprämie"
            value={form.ist_mobilitaetspraemie}
            onChange={(v) => set("ist_mobilitaetspraemie", v)}
          />
          <CheckboxRow
            zeile="2"
            label="Für beschränkt steuerpflichtige Personen"
            value={form.ist_beschraenkt}
            onChange={(v) => set("ist_beschraenkt", v)}
          />
        </BmfSection>

        {/* ============ Section 2 ============ */}
        <BmfSection title="2. Finanzamt (Z. 3–5)">
          <TextRow
            zeile="3"
            label="Steuernummer"
            value={form.steuernummer}
            onChange={(v) => set("steuernummer", v)}
          />
          <TextRow
            zeile="4"
            label="An das Finanzamt"
            value={form.finanzamt}
            onChange={(v) => set("finanzamt", v)}
          />
          <TextRow
            zeile="5"
            label="oder an das Bundeszentralamt für Steuern"
            value={form.oder_bzst}
            onChange={(v) => set("oder_bzst", v)}
          />
        </BmfSection>

        {/* ============ Section 3 ============ */}
        <BmfSection title="3. Persönliche Angaben (Z. 6–20)">
          <TextRow
            zeile="6"
            label="Identifikationsnummer (falls erhalten)"
            value={form.idnr}
            onChange={(v) => set("idnr", v)}
            placeholder="11-stellig"
          />
          <DateRow
            zeile="6"
            label="Geburtsdatum"
            value={form.geburt}
            onChange={(v) => set("geburt", v)}
          />
          <DateRow
            zeile="6"
            label="Sterbedatum (falls verstorben)"
            value={form.sterbe}
            onChange={(v) => set("sterbe", v)}
          />
          <TextRow zeile="7" label="Name" value={form.name} onChange={(v) => set("name", v)} />
          <TextRow zeile="8" label="Vorname" value={form.vorname} onChange={(v) => set("vorname", v)} />
          <TextRow zeile="9" label="Titel, akad. Grad" value={form.titel} onChange={(v) => set("titel", v)} />
          <TextRow zeile="10" label="Ausgeübter Beruf" value={form.beruf} onChange={(v) => set("beruf", v)} />
          <TextRow zeile="11" label="Straße (derzeitige Adresse)" value={form.strasse} onChange={(v) => set("strasse", v)} />
          <TextRow
            zeile="12"
            label="Hausnummer · Zusatz · Adressergänzung"
            value={[form.hausnr, form.hausnr_zusatz, form.adresse_ergaenzung].filter(Boolean).join(" · ")}
            onChange={(v) => {
              const p = v.split(" · ");
              set("hausnr", p[0] ?? "");
              set("hausnr_zusatz", p[1] ?? "");
              set("adresse_ergaenzung", p[2] ?? "");
            }}
          />
          <TextRow zeile="13" label="Postleitzahl" value={form.plz} onChange={(v) => set("plz", v)} />
          <TextRow zeile="14" label="Wohnort" value={form.wohnort} onChange={(v) => set("wohnort", v)} />
          <TextRow zeile="15" label="Aktueller Wohnsitzstaat" value={form.wohnsitzstaat} onChange={(v) => set("wohnsitzstaat", v)} />
          <TextRow zeile="16" label="Geburtsort" value={form.geburtsort} onChange={(v) => set("geburtsort", v)} />
          <TextRow zeile="17" label="Geburtsland" value={form.geburtsland} onChange={(v) => set("geburtsland", v)} />
          <TextRow zeile="18" label="Staatsangehörigkeit" value={form.staatsangehoerigkeit} onChange={(v) => set("staatsangehoerigkeit", v)} />
          <TextRow zeile="19" label={`Wohnsitzstaat ${selectedYear} (falls abweichend)`} value={form.wohnsitz_2025} onChange={(v) => set("wohnsitz_2025", v)} />
          <TextRow zeile="20" label={`Ggf. weitere Wohnsitzstaaten ${selectedYear}`} value={form.weitere_staaten} onChange={(v) => set("weitere_staaten", v)} />
        </BmfSection>

        {/* ============ Section 4 ============ */}
        <BmfSection title="4. Bankverbindung (Z. 21–24)">
          <TextRow zeile="21" label="IBAN inland (DE)" value={form.iban_inland} onChange={(v) => set("iban_inland", v)} placeholder="DE00..." />
          <TextRow zeile="22" label="IBAN ausland" value={form.iban_ausland} onChange={(v) => set("iban_ausland", v)} />
          <TextRow zeile="23" label="BIC (bei ausl. IBAN)" value={form.bic_ausland} onChange={(v) => set("bic_ausland", v)} />
          <TextRow zeile="24" label="Abweichender Kontoinhaber (Name)" value={form.abweichender_kontoinhaber} onChange={(v) => set("abweichender_kontoinhaber", v)} />
        </BmfSection>

        {/* ============ Section 5 ============ */}
        <BmfSection
          title="5. Inländische Einkünfte 2025 (Z. 25–48)"
          description="Nur Einkünfte nach § 49 EStG, die der deutschen beschränkten Steuerpflicht unterliegen."
        >
          <BmfInputRow kz="824" label="§ 50d Abs. 10 EStG Einkünfte" hint="Z. 25" value={form.z25_par50d10} onChange={(v) => set("z25_par50d10", v)} />
          <BmfInputRow kz="825" label="§ 50d Abs. 10 Satz 5: anrechenbare ausl. Steuer" hint="Z. 25" value={form.z25_par50d10_steuer} onChange={(v) => set("z25_par50d10_steuer", v)} />

          <TextRow zeile="26" label="Beschäftigung in" value={form.z26_beschaeftigung_ort} onChange={(v) => set("z26_beschaeftigung_ort", v)} kz="109" />
          <DatePairRow zeile="26" label="Beschäftigung vom/bis" valueA={form.z26_beschaeftigung_von} valueB={form.z26_beschaeftigung_bis} onA={(v) => set("z26_beschaeftigung_von", v)} onB={(v) => set("z26_beschaeftigung_bis", v)} />
          <BmfInputRow kz="110" label="Arbeitslohn ohne inl. Steuerabzug" hint="Z. 27" value={form.z27_arbeitslohn_ohne_abzug} onChange={(v) => set("z27_arbeitslohn_ohne_abzug", v)} />
          <BmfInputRow kz="111" label="Werbungskosten dazu" hint="Z. 27" value={form.z27_werbungskosten} onChange={(v) => set("z27_werbungskosten", v)} />
          <BmfInputRow kz="827" label="§ 50d Abs. 7 EStG Einkünfte" hint="Z. 28" value={form.z28_par50d7} onChange={(v) => set("z28_par50d7", v)} />
          <BmfInputRow kz="828" label="§ 50d Abs. 7 Satz 2: anrechenbare ausl. Steuer" hint="Z. 28" value={form.z28_par50d7_steuer} onChange={(v) => set("z28_par50d7_steuer", v)} />

          <BmfInputRow kz="132" label="Kapitalerträge § 49 Abs. 1 Nr. 5 EStG (ohne Z. 31/32)" hint="Z. 29" value={form.z29_kap_erklaert} onChange={(v) => set("z29_kap_erklaert", v)} />
          <JaNeinRow zeile="30" label="Antrag Günstigerprüfung für Z. 29" value={form.z30_guenstiger} onChange={(v) => set("z30_guenstiger", v)} />
          <BmfInputRow kz="115" label="Kapitalerträge tariflich (§ 49 Abs. 1 Nr. 5)" hint="Z. 31" value={form.z31_kap_tariflich} onChange={(v) => set("z31_kap_tariflich", v)} />
          <BmfInputRow kz="134" label="Kapitalerträge aus Versicherungsverträgen" hint="Z. 32" value={form.z32_kap_versicherung} onChange={(v) => set("z32_kap_versicherung", v)} />

          <BmfInputRow kz="147" label="Kapitalertragsteuer" hint="Z. 33" value={form.z33_kest} onChange={(v) => set("z33_kest", v)} />
          <BmfInputRow kz="154" label="Steuerabzug § 50a EStG" hint="Z. 33" value={form.z33_par50a} onChange={(v) => set("z33_par50a", v)} />
          <BmfInputRow kz="152" label="Solidaritätszuschlag zu Z. 33" hint="Z. 34" value={form.z34_soli} onChange={(v) => set("z34_soli", v)} />
          <BmfInputRow kz="105" label="§ 50a Abs. 7 lt. Rentenmitteilung" hint="Z. 35" value={form.z35_par50a7} onChange={(v) => set("z35_par50a7", v)} />
          <BmfInputRow kz="106" label="Soli zu § 50a Abs. 7" hint="Z. 35" value={form.z35_soli_50a7} onChange={(v) => set("z35_soli_50a7", v)} />
          <JaNeinRow kz="138" zeile="36" label="§ 36a EStG: keine volle Anrechnung erfüllt" value={form.z36_par36a} onChange={(v) => set("z36_par36a", v)} />

          <JaNeinRow kz="178" zeile="37" label="Arbeitnehmer, Pflicht zur ESt-Erklärung" value={form.z37_an_pflicht} onChange={(v) => set("z37_an_pflicht", v)} />
          <JaNeinRow kz="179" zeile="38" label="Arbeitnehmer aus EU/EWR/CH beantragt Veranlagung" value={form.z38_eu_ewr_an} onChange={(v) => set("z38_eu_ewr_an", v)} />
          <JaNeinRow kz="157" zeile="39" label="Drittstaat · außerordentliche Einkünfte § 34 Abs. 1/2 Nr. 2, 4 · Antrag Veranlagung" value={form.z39_drittstaat_ausserord} onChange={(v) => set("z39_drittstaat_ausserord", v)} />
          <JaNeinRow zeile="40" label="Arbeitslohn aus inl. öffentl. Kasse · Antrag Veranlagung" value={form.z40_oeff_kasse_antrag} onChange={(v) => set("z40_oeff_kasse_antrag", v)} />
          <TextRow zeile="41" label="Angaben zum Progressionsvorbehalt (falls Z. 37–40 = Ja)" value={form.z41_progression_angabe} onChange={(v) => set("z41_progression_angabe", v)} />

          <BmfInputRow kz="123" label="Einkünfte mit Steuerabzug § 50a" hint="Z. 42" value={form.z42_par50a_einkuenfte} onChange={(v) => set("z42_par50a_einkuenfte", v)} />
          <BmfInputRow kz="124" label="Summe nicht der dt. ESt unterliegender Einkünfte (ohne Kap.)" hint="Z. 43" value={form.z43_nicht_dt_est} onChange={(v) => set("z43_nicht_dt_est", v)} />
          <BmfInputRow kz="177" label="Davon außerordentliche §§ 34, 34b" hint="Z. 44" value={form.z44_ausserordentliche} onChange={(v) => set("z44_ausserordentliche", v)} />
          <BmfInputRow kz="120" label="Einkommensersatzleistungen Inland" hint="Z. 45" value={form.z45_einkommensersatz_inland} onChange={(v) => set("z45_einkommensersatz_inland", v)} />
          <BmfInputRow kz="136" label="Einkommensersatzleistungen EU/EWR (vergleichbar)" hint="Z. 46" value={form.z46_einkommensersatz_eu} onChange={(v) => set("z46_einkommensersatz_eu", v)} />
          <JaNeinRow kz="180" zeile="47" label="EU/EWR-Staatsangehöriger · § 50a Abs. 1 Nr. 1/2/4 · Antrag Veranlagung" value={form.z47_par50a_eu} onChange={(v) => set("z47_par50a_eu", v)} />
          <TextRow zeile="48" label="Einkünfte laut Anlage(n) (bei Z. 47 = Ja)" value={form.z48_anlagen_zeile48} onChange={(v) => set("z48_anlagen_zeile48", v)} />
        </BmfSection>

        {/* ============ Section 6 ============ */}
        <BmfSection title="6. Arbeitnehmer-Sparzulage (Z. 49–50)">
          <JaNeinRow kz="17" zeile="49" label="Festsetzung Sparzulage beantragt" value={form.z49_sparzulage} onChange={(v) => set("z49_sparzulage", v)} />
          <TextRow zeile="50" label="Name, Adresse Arbeitgeber" value={form.z50_arbeitgeber} onChange={(v) => set("z50_arbeitgeber", v)} />
        </BmfSection>

        {/* ============ Section 7 ============ */}
        <BmfSection
          title="7. Sonderausgaben (Z. 51–66)"
          description="Eingeschränkt absetzbar bei beschränkter Steuerpflicht — meist nur Spenden und Versorgungsleistungen aus inl. Quellen."
        >
          <TextRow zeile="51" label="Rechtsgrund · Datum Vertrag (Rente)" value={form.z51_rente_rechtsgrund} onChange={(v) => set("z51_rente_rechtsgrund", v)} />
          <PercentRow kz="102" zeile="51" label="Abziehbar (%)" value={form.z51_rente_pct} onChange={(v) => set("z51_rente_pct", v)} />
          <BmfInputRow kz="101" label="Tatsächlich gezahlt" hint="Z. 51" value={form.z51_rente_gezahlt} onChange={(v) => set("z51_rente_gezahlt", v)} />
          <TextRow zeile="52" label="Name, Geburtsdatum Empfänger" value={form.z52_rente_empfaenger} onChange={(v) => set("z52_rente_empfaenger", v)} />
          <TextRow kz="136" zeile="53" label="IdNr Empfänger" value={form.z53_rente_idnr} onChange={(v) => set("z53_rente_idnr", v)} />
          <JaNeinRow kz="153" zeile="53" label="Empfänger Wohnsitz im Inland" value={form.z53_rente_inland} onChange={(v) => set("z53_rente_inland", v)} />
          <PercentRow kz="150" zeile="54" label="Feststellung · %" value={form.z54_fest_pct} onChange={(v) => set("z54_fest_pct", v)} />
          <BmfInputRow kz="151" label="Feststellung · Betrag" hint="Z. 54" value={form.z54_fest_eur} onChange={(v) => set("z54_fest_eur", v)} />

          <TextRow zeile="55" label="Dauernde Last · Rechtsgrund · Datum Vertrag" value={form.z55_last_rechtsgrund} onChange={(v) => set("z55_last_rechtsgrund", v)} />
          <BmfInputRow kz="100" label="Gezahlte Geldleistungen" hint="Z. 55" value={form.z55_last_geld} onChange={(v) => set("z55_last_geld", v)} />
          <TextRow zeile="56" label="Name, Geburtsdatum Empfänger" value={form.z56_last_empfaenger} onChange={(v) => set("z56_last_empfaenger", v)} />
          <BmfInputRow kz="161" label="Erbrachte Sachleistungen" hint="Z. 56" value={form.z56_last_sach} onChange={(v) => set("z56_last_sach", v)} />
          <TextRow kz="144" zeile="57" label="IdNr Empfänger" value={form.z57_last_idnr} onChange={(v) => set("z57_last_idnr", v)} />
          <JaNeinRow kz="155" zeile="57" label="Empfänger Wohnsitz im Inland" value={form.z57_last_inland} onChange={(v) => set("z57_last_inland", v)} />
          <BmfInputRow kz="152" label="Feststellung Dauernde Last" hint="Z. 58" value={form.z58_last_fest} onChange={(v) => set("z58_last_fest", v)} />

          <BmfInputRow kz="123" label="Spenden Inland (Bestätigungen)" hint="Z. 59" value={form.z59_spenden_inland_best} onChange={(v) => set("z59_spenden_inland_best", v)} />
          <BmfInputRow kz="124" label="Spenden Inland (Betriebsfinanzamt)" hint="Z. 59" value={form.z59_spenden_inland_fa} onChange={(v) => set("z59_spenden_inland_fa", v)} />
          <BmfInputRow kz="133" label="Spenden EU/EWR (Bestätigungen)" hint="Z. 60" value={form.z60_spenden_eu_best} onChange={(v) => set("z60_spenden_eu_best", v)} />
          <BmfInputRow kz="134" label="Spenden EU/EWR (Betriebsfinanzamt)" hint="Z. 60" value={form.z60_spenden_eu_fa} onChange={(v) => set("z60_spenden_eu_fa", v)} />
          <BmfInputRow kz="127" label="Parteien (Bestätigungen)" hint="Z. 61" value={form.z61_parteien_best} onChange={(v) => set("z61_parteien_best", v)} />
          <BmfInputRow kz="128" label="Parteien (Betriebsfinanzamt)" hint="Z. 61" value={form.z61_parteien_fa} onChange={(v) => set("z61_parteien_fa", v)} />
          <BmfInputRow kz="129" label="Wählervereinigungen (Bestätigungen)" hint="Z. 62" value={form.z62_waehler_best} onChange={(v) => set("z62_waehler_best", v)} />
          <BmfInputRow kz="130" label="Wählervereinigungen (Betriebsfinanzamt)" hint="Z. 62" value={form.z62_waehler_fa} onChange={(v) => set("z62_waehler_fa", v)} />
          <BmfInputRow kz="220" label="Stiftung Inland 2025" hint="Z. 63" value={form.z63_stiftung_inland} onChange={(v) => set("z63_stiftung_inland", v)} />
          <BmfInputRow kz="226" label="Stiftung EU/EWR 2025" hint="Z. 64" value={form.z64_stiftung_eu} onChange={(v) => set("z64_stiftung_eu", v)} />
          <BmfInputRow kz="212" label="davon 2025 zu berücksichtigen" hint="Z. 65" value={form.z65_berueck_2025} onChange={(v) => set("z65_berueck_2025", v)} />
          <BmfInputRow kz="214" label="Vortrag aus Vorjahren" hint="Z. 66" value={form.z66_vortrag} onChange={(v) => set("z66_vortrag", v)} />
        </BmfSection>

        {/* ============ Section 8 ============ */}
        <BmfSection
          title="8. Grenzüberschreitende Steuergestaltungen / DAC6 (Z. 67–69)"
          description="§ 138d AO · Meldepflicht für grenzüberschreitende Steuergestaltungen."
        >
          <TextRow kz="195" zeile="67" label="Registriernummer" value={form.z67_registriernummer} onChange={(v) => set("z67_registriernummer", v)} />
          <TextRow kz="196" zeile="68" label="Offenlegungsnummer" value={form.z68_offenlegungsnr} onChange={(v) => set("z68_offenlegungsnr", v)} />
          <JaNeinRow kz="197" zeile="69" label="Im Jahr 2025 meldepflichtige Gestaltung ohne vorliegende Nr." value={form.z69_ohne_nr} onChange={(v) => set("z69_ohne_nr", v)} />
        </BmfSection>

        {/* ============ Section 9 ============ */}
        <BmfSection
          title="9. Frühere unbeschränkte Steuerpflicht / AStG (Z. 70–81)"
          description="Für §§ 2, 5, 7 AStG (erweiterte beschränkte Steuerpflicht, Hinzurechnungsbesteuerung)."
        >
          <JaNeinRow zeile="70" label="Ich war vor Begründung der beschränkten StPflicht unbeschränkt stpfl." value={form.z70_war_unbeschraenkt} onChange={(v) => set("z70_war_unbeschraenkt", v)} />
          {form.z70_war_unbeschraenkt === "ja" && (
            <>
              <JaNeinRow zeile="71" label="Unbeschränkte StPflicht endete nach dem 31.12.2014" value={form.z71_endete_nach_2014} onChange={(v) => set("z71_endete_nach_2014", v)} />
              {form.z71_endete_nach_2014 === "ja" && (
                <>
                  <DateRow zeile="72" label="Datum der Beendigung der unbeschr. StPflicht" value={form.z72_ende_datum} onChange={(v) => set("z72_ende_datum", v)} />
                  <TextRow zeile="72" label="Bisher zuständiges Finanzamt" value={form.z72_bisheriges_fa} onChange={(v) => set("z72_bisheriges_fa", v)} />
                  <TextRow zeile="72" label="Bisherige Steuernummer" value={form.z72_bisherige_stnr} onChange={(v) => set("z72_bisherige_stnr", v)} />
                  <JaNeinRow zeile="73" label="Als Deutscher ≥ 5 Jahre unbeschr. stpfl. in letzten 10 Jahren" value={form.z73_5_jahre_unbeschraenkt} onChange={(v) => set("z73_5_jahre_unbeschraenkt", v)} />
                  {form.z73_5_jahre_unbeschraenkt === "ja" && (
                    <>
                      <DatePairRow zeile="74" label="Zeitraum unbeschränkte StPflicht (vom/bis)" valueA={form.z74_von} valueB={form.z74_bis} onA={(v) => set("z74_von", v)} onB={(v) => set("z74_bis", v)} />
                      <JaNeinRow zeile="75" label="Wohnsitz zeitweise in niedrig besteuerndem Gebiet (§ 2 AStG)" value={form.z75_niedrig_besteuert} onChange={(v) => set("z75_niedrig_besteuert", v)} />
                    </>
                  )}
                </>
              )}
            </>
          )}
          <JaNeinRow zeile="76" label="Am 1.1.2025 Beteiligung § 17 EStG an inl. Kap.-Gesellschaft/Genossenschaft" value={form.z76_par17_beteiligung} onChange={(v) => set("z76_par17_beteiligung", v)} />
          <TextRow zeile="77" label="Erläuterungen zu Z. 76 (Name, Sitz, FA, Art)" value={form.z77_erl_par17} onChange={(v) => set("z77_erl_par17", v)} />
          <JaNeinRow zeile="78" label="Am 1.1.2025 an ausl. Personengesellschaft beteiligt (§ 2 AStG)" value={form.z78_personengesellschaft} onChange={(v) => set("z78_personengesellschaft", v)} />
          <TextRow zeile="79" label="Erläuterungen zu Z. 78" value={form.z79_erl_personen} onChange={(v) => set("z79_erl_personen", v)} />
          <JaNeinRow zeile="80" label="In 2025 an ausl. Gesellschaft § 7 AStG beteiligt" value={form.z80_par7_astg} onChange={(v) => set("z80_par7_astg", v)} />
          <TextRow zeile="81" label="Erläuterungen zu Z. 80" value={form.z81_erl_par7} onChange={(v) => set("z81_erl_par7", v)} />
        </BmfSection>

        {/* ============ Section 10 ============ */}
        <BmfSection
          title="10. Bevollmächtigte (Z. 82–89)"
          description="§ 80 AO Bevollmächtigter · § 123 AO inl. Empfangsbevollmächtigter."
        >
          <TextRow zeile="82" label="Bevollmächtigter (§ 80 AO)" value={form.z82_bevollmaechtigter} onChange={(v) => set("z82_bevollmaechtigter", v)} />
          <TextRow zeile="83" label="Empfangsbevollmächtigter (§ 123 AO)" value={form.z83_empfangsbevollmaechtigter} onChange={(v) => set("z83_empfangsbevollmaechtigter", v)} />
          <TextRow zeile="84" label="Name / Firmenname Bev." value={form.z84_bev_name} onChange={(v) => set("z84_bev_name", v)} />
          <TextRow zeile="85" label="Vorname Bev." value={form.z85_bev_vorname} onChange={(v) => set("z85_bev_vorname", v)} />
          <TextRow zeile="86" label="Straße Bev." value={form.z86_bev_strasse} onChange={(v) => set("z86_bev_strasse", v)} />
          <TextRow
            zeile="87"
            label="Hausnr · Zusatz · Ergänzung Bev."
            value={[form.z87_bev_hausnr, form.z87_bev_zusatz].filter(Boolean).join(" · ")}
            onChange={(v) => {
              const p = v.split(" · ");
              set("z87_bev_hausnr", p[0] ?? "");
              set("z87_bev_zusatz", p[1] ?? "");
            }}
          />
          <TextRow zeile="88" label="Postfach Bev." value={form.z88_bev_postfach} onChange={(v) => set("z88_bev_postfach", v)} />
          <TextRow zeile="89" label="PLZ, (Wohn-)Ort Bev." value={form.z89_bev_plz_ort} onChange={(v) => set("z89_bev_plz_ort", v)} />
        </BmfSection>

        {/* ============ Section 11 ============ */}
        <BmfSection title="11. Ergänzende Angaben (Z. 90)">
          <WideRow kz="500" zeile="90" label="In dieser Steuererklärung" wide={420}>
            <select
              value={form.z90_ergaenzende}
              onChange={(e) => set("z90_ergaenzende", Number(e.target.value) as 0 | 1 | 2 | 3 | 4)}
              style={selectStyle}
            >
              <option value={0}>—</option>
              <option value={1}>1 · Steuererhebliche Sachverhalte nicht erklärt</option>
              <option value={2}>2 · Bewusst abweichende Rechtsauffassung</option>
              <option value={3}>3 · Personelle vertiefte Prüfung gewünscht</option>
              <option value={4}>4 · Mehrere der vorgenannten Gründe</option>
            </select>
          </WideRow>
        </BmfSection>

        {/* ============ Section 12 ============ */}
        <BmfSection title="12. Unterschrift und Mitwirkung (Z. 91–94)">
          <WideRow kz="" zeile="91" label="Unterschrift als" wide={220}>
            <select
              value={form.z91_unterschrift_art}
              onChange={(e) => set("z91_unterschrift_art", e.target.value as ESt1C["z91_unterschrift_art"])}
              style={selectStyle}
            >
              <option value="">—</option>
              <option value="steuerpflichtig">1 · Steuerpflichtige Person</option>
              <option value="bevollmaechtigt">2 · Bevollmächtigter</option>
            </select>
          </WideRow>
          <DateRow zeile="92" label="Datum der Unterschrift" value={form.z92_unterschrift_datum} onChange={(v) => set("z92_unterschrift_datum", v)} />
          <JaNeinRow zeile="93" label="Mitwirkung Steuerberater / zur Hilfe Befugten" value={form.z93_mitwirkung} onChange={(v) => set("z93_mitwirkung", v)} />
          <TextRow zeile="94" label="Name / Kanzlei des Mitwirkenden" value={form.z94_mitwirkender} onChange={(v) => set("z94_mitwirkender", v)} />
        </BmfSection>

        <BmfSignatures left={`Unterschrift ${form.name || "Stpfl."}`} right="Inl. Empfangsbevollmächtigter" />

        <BmfFootnotes>
          <p>
            <strong>§ 50 Abs. 2 EStG Antragsveranlagung:</strong> Nur EU/EWR/CH-
            Ansässige (Z. 38) oder bestimmte Drittstaat-Fälle (Z. 39 außerordentl.
            Einkünfte; Z. 40 öffentl. Kasse; Z. 47 § 50a-Einkünfte) können die
            Veranlagung beantragen — sonst ist der Steuerabzug (KESt / § 50a
            Abgeltungssteuer) i. d. R. abgeltend.
          </p>
          <p>
            <strong>§ 50d EStG Sonderfälle:</strong> Abs. 7 (Flugpersonal) und
            Abs. 10 (Sondervergütungen an Mitunternehmer) mit gesonderter
            Anrechnungsmechanik.
          </p>
          <p>
            <strong>AStG-Fragen (Z. 70–81):</strong> Erweiterte beschränkte
            Steuerpflicht § 2 AStG (Niedrigsteuergebiet + 5/10 Jahre-Regel),
            § 17-Beteiligung an inl. Kapitalgesellschaften, § 7 AStG
            Hinzurechnungsbesteuerung ausl. Gesellschaften (CFC). Die
            Folgewirkungen sind in Anlage AUS bzw. KAP zu erklären.
          </p>
          <p>
            <strong>DAC6-Meldepflicht (Z. 67–69):</strong> Grenzüberschreitende
            Steuergestaltungen müssen nach § 138d AO binnen 30 Tagen beim BZSt
            gemeldet werden; hier wird die vergebene Registrier-/Offenlegungs-
            nummer referenziert.
          </p>
          <p>
            <strong>Inl. Empfangsbevollmächtigter:</strong> Bei Wohnsitz im
            Ausland ohne inl. Empfangsvollmacht können Bescheide per
            öffentlicher Zustellung wirksam werden — Benennung eines
            Empfangsbevollmächtigten (§ 123 AO) dringend empfohlen.
          </p>
          <p>
            <strong>Sonderausgaben eingeschränkt:</strong> Bei beschränkter
            StPflicht sind die meisten Sonderausgaben nicht absetzbar
            (§ 50 Abs. 1 Satz 4 EStG) — Ausnahmen: bestimmte
            Versorgungsleistungen und Spenden. Anlagen Vorsorgeaufwand / aGB /
            Kind / Sonderausgaben i. d. R. nicht anwendbar.
          </p>
          <p>
            <strong>NICHT implementiert / NICHT berechnet:</strong>{" "}
            Progressionsvorbehalt-Satz bei Antragsveranlagung, § 36a-
            Anrechnungsbeschränkung, AStG-Folgeberechnungen,
            Steuerabzug-Abgeltungswirkung-Prüfung, Ehegatten-Mitveranlagung
            (meist nicht möglich bei beschr. StPflicht).
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Übermittlung
            erfolgt elektronisch über ELSTER oder per Post direkt an das
            zuständige Finanzamt / BZSt.
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
        <input type="date" value={valueA} onChange={(e) => onA(e.target.value)} style={textInputStyle} />
        <input type="date" value={valueB} onChange={(e) => onB(e.target.value)} style={textInputStyle} />
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
