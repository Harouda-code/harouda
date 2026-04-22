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
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

/** Kz-Offsets: 1. Rente in 500er-Bereich, 2. Rente in 550er-Bereich
 *  (z. B. Z. 4 = Kz 500 bzw. 550). */
type KzSet = {
  z4: string;
  z5: string;
  z6: string;
  z7: string;
  z8a: string;
  z8b: string;
  z9: string;
  z10: string;
  z11: string;
  z12: string;
  z13: string;
  z14: string;
  z15: string;
  z16: string;
  z17: string;
  z18: string;
  z19: string;
  z20: string;
  z21: string;
  z22: string;
  z23: string;
  z24: string;
  z25: string;
  z26: string;
};

const KZ_RENTE1: KzSet = {
  z4: "500",
  z5: "501",
  z6: "502",
  z7: "524",
  z8a: "522",
  z8b: "523",
  z9: "525",
  z10: "505",
  z11: "526",
  z12: "506",
  z13: "518",
  z14: "519",
  z15: "507",
  z16: "508",
  z17: "530",
  z18: "509",
  z19: "510",
  z20: "511",
  z21: "512",
  z22: "535",
  z23: "536",
  z24: "537",
  z25: "538",
  z26: "516",
};

const KZ_RENTE2: KzSet = {
  z4: "550",
  z5: "551",
  z6: "552",
  z7: "574",
  z8a: "572",
  z8b: "573",
  z9: "575",
  z10: "555",
  z11: "576",
  z12: "556",
  z13: "568",
  z14: "569",
  z15: "557",
  z16: "558",
  z17: "580",
  z18: "559",
  z19: "560",
  z20: "561",
  z21: "562",
  z22: "585",
  z23: "586",
  z24: "587",
  z25: "588",
  z26: "566",
};

// ---------- State types ------------------------------------------------

type RenteStream = {
  // Z. 4–8 Basis-Leistungen
  z4_versicherung: number;
  z5_pensionsfonds: number;
  z6_bemessung: number;
  z7_versorgungsbeginn_jahr: number;
  z8_erster_monat: number;
  z8_letzter_monat: number;

  // Z. 9–14 Spezialleistungen
  z9_kleinbetragsrente: number;
  z10_bav: number;
  z11_rentenanpassung: number;
  z12_beginn_leistung: string;
  z13_beginn_vorherige: string;
  z14_ende_vorherige: string;

  // Z. 15–17 Leibrente
  z15_leibrente: number;
  z16_beginn_rente: string;
  z17_geburtsdatum_andere: string;

  // Z. 18–20 Abgekürzte Leibrente
  z18_abgekuerzte: number;
  z19_beginn: string;
  z20_erlischt: string;

  // Z. 21–26 Andere Leistungen / Auflösung
  z21_andere: number;
  z22_aufloesung_einmal: number;
  z23_aufloesung_nach: number;
  z24_beginn_auszahlung: string;
  z25_aufgabe: string;
  z26_nachzahlung: number;
};

type Werbungskosten = {
  // Z. 27–33 nur im ersten Formular je Person
  z27_art: string; // Kz 802
  z27_euro: number;
  z28_art: string; // Kz 803
  z28_euro: number;
  z29_art: string; // Kz 806
  z29_euro: number;
  z30_art: string; // Kz 808
  z30_euro: number;
  z31_art: string; // Kz 809
  z31_euro: number;
  z32_art: string; // Kz 805
  z32_euro: number;
  z33_art: string; // Kz 811
  z33_euro: number;
};

type AnlageRAVbAV = {
  person_name: string;
  person_idnr: string;
  istErstesFormular: boolean;
  rente2_aktiv: boolean;
  rente1: RenteStream;
  rente2: RenteStream;
  wk: Werbungskosten;
};

const EMPTY_STREAM: RenteStream = {
  z4_versicherung: 0,
  z5_pensionsfonds: 0,
  z6_bemessung: 0,
  z7_versorgungsbeginn_jahr: 0,
  z8_erster_monat: 0,
  z8_letzter_monat: 0,
  z9_kleinbetragsrente: 0,
  z10_bav: 0,
  z11_rentenanpassung: 0,
  z12_beginn_leistung: "",
  z13_beginn_vorherige: "",
  z14_ende_vorherige: "",
  z15_leibrente: 0,
  z16_beginn_rente: "",
  z17_geburtsdatum_andere: "",
  z18_abgekuerzte: 0,
  z19_beginn: "",
  z20_erlischt: "",
  z21_andere: 0,
  z22_aufloesung_einmal: 0,
  z23_aufloesung_nach: 0,
  z24_beginn_auszahlung: "",
  z25_aufgabe: "",
  z26_nachzahlung: 0,
};

const EMPTY_WK: Werbungskosten = {
  z27_art: "",
  z27_euro: 0,
  z28_art: "",
  z28_euro: 0,
  z29_art: "",
  z29_euro: 0,
  z30_art: "",
  z30_euro: 0,
  z31_art: "",
  z31_euro: 0,
  z32_art: "",
  z32_euro: 0,
  z33_art: "",
  z33_euro: 0,
};

const DEFAULT: AnlageRAVbAV = {
  person_name: "",
  person_idnr: "",
  istErstesFormular: true,
  rente2_aktiv: false,
  rente1: EMPTY_STREAM,
  rente2: EMPTY_STREAM,
  wk: EMPTY_WK,
};

const FORM_ID = "anlage-rav-bav";

function loadForm(mandantId: string | null, jahr: number): AnlageRAVbAV {
  const parsed = readEstForm<Partial<AnlageRAVbAV>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    rente1: { ...EMPTY_STREAM, ...(parsed.rente1 ?? {}) },
    rente2: { ...EMPTY_STREAM, ...(parsed.rente2 ?? {}) },
    wk: { ...EMPTY_WK, ...(parsed.wk ?? {}) },
  };
}

// ---------- Main page --------------------------------------------------

export default function AnlageRAVbAVPage() {
  return (
    <MandantRequiredGuard>
      <AnlageRAVbAVPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageRAVbAVPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageRAVbAV>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageRAVbAV>(key: K, value: AnlageRAVbAV[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateRente(
    which: "rente1" | "rente2",
    updater: (r: RenteStream) => RenteStream
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  function setWk<K extends keyof Werbungskosten>(
    key: K,
    value: Werbungskosten[K]
  ) {
    setForm((f) => ({ ...f, wk: { ...f.wk, [key]: value } }));
  }

  const summeBrutto = useMemo(() => {
    const sumStream = (r: RenteStream) =>
      r.z4_versicherung +
      r.z5_pensionsfonds +
      r.z9_kleinbetragsrente +
      r.z10_bav +
      r.z15_leibrente +
      r.z18_abgekuerzte +
      r.z21_andere +
      r.z22_aufloesung_einmal +
      r.z23_aufloesung_nach +
      r.z26_nachzahlung;
    return sumStream(form.rente1) + (form.rente2_aktiv ? sumStream(form.rente2) : 0);
  }, [form.rente1, form.rente2, form.rente2_aktiv]);

  const summeWk = useMemo(() => {
    if (!form.istErstesFormular) return 0;
    const wk = form.wk;
    return (
      wk.z27_euro +
      wk.z28_euro +
      wk.z29_euro +
      wk.z30_euro +
      wk.z31_euro +
      wk.z32_euro +
      wk.z33_euro
    );
  }, [form.wk, form.istErstesFormular]);

  function validate(): string[] {
    const warns: string[] = [];
    const streams: { name: string; r: RenteStream }[] = [
      { name: "1. Rente", r: form.rente1 },
    ];
    if (form.rente2_aktiv) {
      streams.push({ name: "2. Rente", r: form.rente2 });
    }
    for (const { name, r } of streams) {
      if (
        r.z8_erster_monat > 0 &&
        r.z8_letzter_monat > 0 &&
        r.z8_erster_monat > r.z8_letzter_monat
      ) {
        warns.push(`${name}: erster Monat liegt nach letztem Monat.`);
      }
      if (r.z8_erster_monat < 0 || r.z8_erster_monat > 12)
        warns.push(`${name}: erster Monat muss 1–12 sein.`);
      if (r.z8_letzter_monat < 0 || r.z8_letzter_monat > 12)
        warns.push(`${name}: letzter Monat muss 1–12 sein.`);
      if (r.z11_rentenanpassung > r.z10_bav)
        warns.push(
          `${name}: Rentenanpassungsbetrag (Z. 11) > Bezug (Z. 10) unplausibel.`
        );
      if (
        r.z13_beginn_vorherige &&
        r.z14_ende_vorherige &&
        r.z13_beginn_vorherige > r.z14_ende_vorherige
      ) {
        warns.push(`${name}: vorherige Leistung — Beginn nach Ende.`);
      }
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) {
      toast.warning(warns.join(" · "), { duration: 7000 });
    }
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-rav-bav"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-rav-bav",
      summary: `Anlage R-AV/bAV gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-rav-bav",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        summeBrutto,
        summeWk,
        form,
      },
    });
    toast.success("Anlage R-AV/bAV gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage R-AV / bAV</h1>
          <p>
            Einkünfte aus zertifizierten Altersvorsorgeverträgen
            (Riester, Rürup) und betrieblicher Altersversorgung · VZ{" "}
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
          Anlage R-AV/bAV · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-rav-bav" />

      <section className="card taxcalc__section no-print">
        <h2>Profil</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: "0.88rem" }}>
          <strong>Pro Person ein Formular</strong> — bei Zusammenveranlagung
          jeweils ein eigenes Formular für jeden Ehegatten/Lebenspartner.
        </p>
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
              placeholder="11-stellig"
            />
          </label>
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.istErstesFormular}
              onChange={(e) => set("istErstesFormular", e.target.checked)}
            />
            <span>
              Erstes Formular dieser Person (Werbungskosten Z. 27–33 erscheinen)
            </span>
          </label>
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.rente2_aktiv}
              onChange={(e) => set("rente2_aktiv", e.target.checked)}
            />
            <span>2. Rente erfassen</span>
          </label>
        </div>
      </section>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Versorgungsfreibetrag § 19 Abs. 2 EStG:</strong> Für
          Versorgungsbezüge (Z. 10, Pensionsfonds etc.) gilt ein
          Kohortenfreibetrag, der sich nach dem Kalenderjahr des
          Versorgungsbeginns (Z. 7) richtet. Der Freibetrag wird hier NICHT
          automatisch berechnet — der Stufenplan läuft bis 2058 aus und
          erfordert die Bemessungsgrundlage aus Z. 6.
        </div>
      </aside>

      <BmfForm
        title="Anlage R-AV / bAV"
        subtitle={`Riester/Rürup/bAV · VZ ${selectedYear}${form.person_name ? " · " + form.person_name : ""}`}
      >
        <RenteStreamBlock
          title="Abschnitt 1 · 1. Rente — Leistungen (Z. 4–26)"
          rente={form.rente1}
          kz={KZ_RENTE1}
          onChange={(updater) => updateRente("rente1", updater)}
        />

        {form.rente2_aktiv && (
          <RenteStreamBlock
            title="Abschnitt 1 · 2. Rente — Leistungen (Z. 4–26)"
            rente={form.rente2}
            kz={KZ_RENTE2}
            onChange={(updater) => updateRente("rente2", updater)}
          />
        )}

        <BmfRow
          kz=""
          label="Summe Brutto-Leistungen (1. + 2. Rente · Info)"
          value={summeBrutto}
          subtotal
        />

        {form.istErstesFormular && (
          <BmfSection
            title="Abschnitt 2 · Werbungskosten (Z. 27–33 · nur erstes Formular)"
            description="Aufwendungen mit Bezug auf die jeweiligen Zeilen der Leistungsmitteilung. Bezeichnung + Betrag je Rubrik."
            total={summeWk}
          >
            <WkPair
              kz="802"
              zeile="27"
              label="Werbungskosten zu Z. 4 und Z. 21"
              art={form.wk.z27_art}
              euroVal={form.wk.z27_euro}
              onArt={(v) => setWk("z27_art", v)}
              onEuro={(v) => setWk("z27_euro", v)}
            />
            <WkPair
              kz="803"
              zeile="28"
              label="Werbungskosten zu Z. 5"
              art={form.wk.z28_art}
              euroVal={form.wk.z28_euro}
              onArt={(v) => setWk("z28_art", v)}
              onEuro={(v) => setWk("z28_euro", v)}
            />
            <WkPair
              kz="806"
              zeile="29"
              label="Werbungskosten zu Z. 10, Z. 15 und Z. 18"
              art={form.wk.z29_art}
              euroVal={form.wk.z29_euro}
              onArt={(v) => setWk("z29_art", v)}
              onEuro={(v) => setWk("z29_euro", v)}
            />
            <WkPair
              kz="808"
              zeile="30"
              label="Werbungskosten zu Z. 22"
              art={form.wk.z30_art}
              euroVal={form.wk.z30_euro}
              onArt={(v) => setWk("z30_art", v)}
              onEuro={(v) => setWk("z30_euro", v)}
            />
            <WkPair
              kz="809"
              zeile="31"
              label="Werbungskosten zu Z. 23"
              art={form.wk.z31_art}
              euroVal={form.wk.z31_euro}
              onArt={(v) => setWk("z31_art", v)}
              onEuro={(v) => setWk("z31_euro", v)}
            />
            <WkPair
              kz="805"
              zeile="32"
              label="Werbungskosten zu Z. 9 und zu Nachzahlungen (Z. 26) in Z. 4 enthalten"
              art={form.wk.z32_art}
              euroVal={form.wk.z32_euro}
              onArt={(v) => setWk("z32_art", v)}
              onEuro={(v) => setWk("z32_euro", v)}
            />
            <WkPair
              kz="811"
              zeile="33"
              label="Werbungskosten zu Nachzahlungen (Z. 26) in Z. 5, Z. 10, Z. 15, Z. 18 enthalten"
              art={form.wk.z33_art}
              euroVal={form.wk.z33_euro}
              onArt={(v) => setWk("z33_art", v)}
              onEuro={(v) => setWk("z33_euro", v)}
            />
          </BmfSection>
        )}

        <BmfSignatures
          left="Datum, Ort"
          right="Unterschrift Steuerpflichtige:r"
        />

        <BmfFootnotes>
          <p>
            <strong>Schädliche Verwendung:</strong> Bei Rückabwicklung eines
            Riester- oder bAV-Vertrags (Nummer 9a–9d der Leistungsmitteilung)
            werden die gezahlten Zulagen und steuerlichen Vorteile in Z. 15 /
            Z. 18 / Z. 21 erfasst. Die steuerliche Rückabwicklung erfolgt über
            das Finanzamt und die Zentrale Zulagenstelle für Altersvermögen
            (ZfA).
          </p>
          <p>
            <strong>Wohnförderkonto (Riester-Eigenheim):</strong> Z. 22–25
            betreffen den Auflösungsbetrag bei Einmalbesteuerung oder
            Aufgabe der Selbstnutzung. Die ZfA stellt hierzu einen gesonderten
            Bescheid aus.
          </p>
          <p>
            <strong>Keine automatische Versorgungsfreibetrag-Berechnung:</strong>{" "}
            Der Kohortensatz (Prozentwert + Höchstbetrag + Zuschlag) nach
            § 19 Abs. 2 EStG hängt vom Jahr des Versorgungsbeginns (Z. 7)
            ab und wird vom Finanzamt ermittelt.
          </p>
          <p>
            <strong>Kennziffern (Kz) und Zeilen-Nr. (Z.)</strong>{" "}
            entsprechen dem offiziellen Anlage R-AV/bAV 2025. Kz der 2. Rente
            automatisch +50 gesetzt (z. B. 500 → 550).
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

// ---------- Rente stream block ----------------------------------------

type RenteStreamBlockProps = {
  title: string;
  rente: RenteStream;
  kz: KzSet;
  onChange: (updater: (r: RenteStream) => RenteStream) => void;
};

function RenteStreamBlock({ title, rente, kz, onChange }: RenteStreamBlockProps) {
  const setF = <K extends keyof RenteStream>(key: K, value: RenteStream[K]) => {
    onChange((r) => ({ ...r, [key]: value }));
  };

  return (
    <BmfSection title={title}>
      {/* Z. 4–8 Basis */}
      <BmfInputRow
        kz={kz.z4}
        label="Leistungen aus Altersvorsorgevertrag / Pensionsfonds / Pensionskasse / Direktversicherung (Nr. 1 LM)"
        hint="Z. 4"
        value={rente.z4_versicherung}
        onChange={(v) => setF("z4_versicherung", v)}
      />
      <BmfInputRow
        kz={kz.z5}
        label="Leistungen aus einem Pensionsfonds (Nr. 2 LM)"
        hint="Z. 5"
        value={rente.z5_pensionsfonds}
        onChange={(v) => setF("z5_pensionsfonds", v)}
      />
      <BmfInputRow
        kz={kz.z6}
        label="Bemessungsgrundlage für den Versorgungsfreibetrag"
        hint="Z. 6 · Grundlage für § 19 Abs. 2 EStG (Kohortensatz)"
        value={rente.z6_bemessung}
        onChange={(v) => setF("z6_bemessung", v)}
      />
      <IntegerRow
        kz={kz.z7}
        zeile="7"
        label="Maßgebendes Kalenderjahr des Versorgungsbeginns"
        value={rente.z7_versorgungsbeginn_jahr}
        onChange={(v) => setF("z7_versorgungsbeginn_jahr", v)}
        placeholder="JJJJ"
        min={1900}
        max={2099}
      />
      <MonthRangeRow
        kzA={kz.z8a}
        kzB={kz.z8b}
        zeile="8"
        label="Bei unterjähriger Zahlung: 1. · letzter Monat"
        first={rente.z8_erster_monat}
        last={rente.z8_letzter_monat}
        onFirst={(v) => setF("z8_erster_monat", v)}
        onLast={(v) => setF("z8_letzter_monat", v)}
      />

      {/* Z. 9–14 Spezial */}
      <BmfInputRow
        kz={kz.z9}
        label="Leistungen zur Abfindung einer Kleinbetragsrente (Nr. 3 LM)"
        hint="Z. 9"
        value={rente.z9_kleinbetragsrente}
        onChange={(v) => setF("z9_kleinbetragsrente", v)}
      />
      <BmfInputRow
        kz={kz.z10}
        label="Leistungen aus betrieblicher Altersversorgung (Nr. 4 LM)"
        hint="Z. 10"
        value={rente.z10_bav}
        onChange={(v) => setF("z10_bav", v)}
      />
      <BmfInputRow
        kz={kz.z11}
        label="davon Rentenanpassungsbetrag"
        hint="Z. 11 · Teilmenge von Z. 10"
        value={rente.z11_rentenanpassung}
        onChange={(v) => setF("z11_rentenanpassung", v)}
      />
      <DateRow
        kz={kz.z12}
        zeile="12"
        label="Beginn der Leistung"
        value={rente.z12_beginn_leistung}
        onChange={(v) => setF("z12_beginn_leistung", v)}
      />
      <DateRow
        kz={kz.z13}
        zeile="13"
        label="Beginn der vorhergehenden Leistung"
        value={rente.z13_beginn_vorherige}
        onChange={(v) => setF("z13_beginn_vorherige", v)}
      />
      <DateRow
        kz={kz.z14}
        zeile="14"
        label="Ende der vorhergehenden Leistung"
        value={rente.z14_ende_vorherige}
        onChange={(v) => setF("z14_ende_vorherige", v)}
      />

      {/* Z. 15–17 Leibrente */}
      <BmfInputRow
        kz={kz.z15}
        label="Leibrente aus Altersvorsorgevertrag / bAV (Nr. 5 oder 9a LM)"
        hint="Z. 15"
        value={rente.z15_leibrente}
        onChange={(v) => setF("z15_leibrente", v)}
      />
      <DateRow
        kz={kz.z16}
        zeile="16"
        label="Beginn der Rente"
        value={rente.z16_beginn_rente}
        onChange={(v) => setF("z16_beginn_rente", v)}
      />
      <DateRow
        kz={kz.z17}
        zeile="17"
        label="Geburtsdatum anderer Person (Laufzeitabhängigkeit / Garantierente)"
        value={rente.z17_geburtsdatum_andere}
        onChange={(v) => setF("z17_geburtsdatum_andere", v)}
      />

      {/* Z. 18–20 Abgekürzte Leibrente */}
      <BmfInputRow
        kz={kz.z18}
        label="Abgekürzte Leibrente (Nr. 6 oder 9b LM)"
        hint="Z. 18"
        value={rente.z18_abgekuerzte}
        onChange={(v) => setF("z18_abgekuerzte", v)}
      />
      <DateRow
        kz={kz.z19}
        zeile="19"
        label="Beginn der Rente (abgekürzt)"
        value={rente.z19_beginn}
        onChange={(v) => setF("z19_beginn", v)}
      />
      <DateRow
        kz={kz.z20}
        zeile="20"
        label="Erlischt / wird umgewandelt spätestens am"
        value={rente.z20_erlischt}
        onChange={(v) => setF("z20_erlischt", v)}
      />

      {/* Z. 21–26 Andere + Auflösung */}
      <BmfInputRow
        kz={kz.z21}
        label="Andere Leistungen (Nr. 7/8/10 oder schädl. Verwendung 9c/9d / Auflösungsbetrag ZfA)"
        hint="Z. 21"
        value={rente.z21_andere}
        onChange={(v) => setF("z21_andere", v)}
      />
      <BmfInputRow
        kz={kz.z22}
        label="Auflösungsbetrag bei Einmalbesteuerung Wohnförderkonto (ZfA-Bescheid)"
        hint="Z. 22"
        value={rente.z22_aufloesung_einmal}
        onChange={(v) => setF("z22_aufloesung_einmal", v)}
      />
      <BmfInputRow
        kz={kz.z23}
        label="Auflösungsbetrag bei Aufgabe Selbstnutzung nach Beginn Auszahlung (ZfA)"
        hint="Z. 23"
        value={rente.z23_aufloesung_nach}
        onChange={(v) => setF("z23_aufloesung_nach", v)}
      />
      <DateRow
        kz={kz.z24}
        zeile="24"
        label="Beginn der Auszahlungsphase"
        value={rente.z24_beginn_auszahlung}
        onChange={(v) => setF("z24_beginn_auszahlung", v)}
      />
      <DateRow
        kz={kz.z25}
        zeile="25"
        label="Zeitpunkt der Aufgabe Selbstnutzung / Reinvestitionsabsicht"
        value={rente.z25_aufgabe}
        onChange={(v) => setF("z25_aufgabe", v)}
      />
      <BmfInputRow
        kz={kz.z26}
        label="Nachzahlungen für mehrere vorangegangene Jahre (Nr. 11 LM)"
        hint="Z. 26 · ggf. mit ermäßigter Besteuerung § 34 EStG"
        value={rente.z26_nachzahlung}
        onChange={(v) => setF("z26_nachzahlung", v)}
      />
    </BmfSection>
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

function IntegerRow({
  kz,
  zeile,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  kz: string;
  zeile: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <WideRow kz={kz} zeile={zeile} label={label} wide={140}>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        style={monoInputStyle}
      />
    </WideRow>
  );
}

function MonthRangeRow({
  kzA,
  kzB,
  zeile,
  label,
  first,
  last,
  onFirst,
  onLast,
}: {
  kzA: string;
  kzB: string;
  zeile: string;
  label: string;
  first: number;
  last: number;
  onFirst: (v: number) => void;
  onLast: (v: number) => void;
}) {
  return (
    <WideRow kz={`${kzA}/${kzB}`} zeile={zeile} label={label} wide={200}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
        <input
          type="number"
          min={1}
          max={12}
          step={1}
          value={first === 0 ? "" : first}
          onChange={(e) => onFirst(Number(e.target.value) || 0)}
          placeholder="1. Monat"
          style={monoInputStyle}
        />
        <input
          type="number"
          min={1}
          max={12}
          step={1}
          value={last === 0 ? "" : last}
          onChange={(e) => onLast(Number(e.target.value) || 0)}
          placeholder="letzter Monat"
          style={monoInputStyle}
        />
      </div>
    </WideRow>
  );
}

function WkPair({
  kz,
  zeile,
  label,
  art,
  euroVal,
  onArt,
  onEuro,
}: {
  kz: string;
  zeile: string;
  label: string;
  art: string;
  euroVal: number;
  onArt: (v: string) => void;
  onEuro: (v: number) => void;
}) {
  return (
    <>
      <WideRow kz={kz} zeile={zeile} label={`${label} — Art der Aufwendungen`} wide={280}>
        <input
          type="text"
          value={art}
          onChange={(e) => onArt(e.target.value)}
          placeholder="z. B. Steuerberatungskosten, Kontoführungsgebühren"
          style={textInputStyle}
        />
      </WideRow>
      <BmfInputRow
        kz=""
        label={`${label} — Betrag`}
        hint={`Z. ${zeile}`}
        value={euroVal}
        onChange={onEuro}
      />
    </>
  );
}
