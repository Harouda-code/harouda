import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  besteuerungsanteil,
  STEUERPARAMETER_VERSION,
} from "../data/steuerParameter";
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

// ---------- Kz offsets -------------------------------------------------

type KzSet = {
  z4: string;
  z5: string;
  z6: string;
  z7: string;
  z8: string;
  z9: string;
  z10: string;
  z11: string;
  z12: string;
  z13: string;
  z14: string;
  z15: string;
  z17: string;
  z18: string;
  z19: string;
  z20: string;
  z21: string;
  z23: string;
  z24: string;
};

const KZ_R1: KzSet = {
  z4: "101",
  z5: "102",
  z6: "103",
  z7: "105",
  z8: "106",
  z9: "111",
  z10: "112",
  z11: "113",
  z12: "114",
  z13: "131",
  z14: "132",
  z15: "136",
  z17: "133",
  z18: "134",
  z19: "141",
  z20: "142",
  z21: "146",
  z23: "143",
  z24: "144",
};

const KZ_R2: KzSet = {
  z4: "151",
  z5: "152",
  z6: "153",
  z7: "155",
  z8: "156",
  z9: "161",
  z10: "162",
  z11: "163",
  z12: "164",
  z13: "181",
  z14: "182",
  z15: "186",
  z17: "183",
  z18: "184",
  z19: "191",
  z20: "192",
  z21: "196",
  z23: "193",
  z24: "194",
};

// ---------- State ------------------------------------------------------

type RenteStream = {
  // Section 1 — Gesetzliche RV (Z. 4–12)
  z4_rentenbetrag: number;
  z5_anpassung: number;
  z6_beginn: string;
  z7_vorherige_beginn: string;
  z8_vorherige_ende: string;
  z9_nachzahlung: number;
  z10_oeffnungsklausel_pct: number;
  z11_erlischt: string;
  z12_einmalzahlung: number;

  // Section 2 — Private RV (Z. 13–18)
  z13_rentenbetrag: number;
  z14_beginn: string;
  z15_geburtsdatum_andere: string;
  z16_erlischt_tod_name: string;
  z17_erlischt_spaetestens: string;
  z18_nachzahlung: number;

  // Section 3 — Sonstige Verpflichtung (Z. 19–24)
  z19_rentenbetrag: number;
  z20_beginn: string;
  z21_geburtsdatum_andere: string;
  z22_erlischt_tod_name: string;
  z23_erlischt_spaetestens: string;
  z24_nachzahlung: number;
};

type AnlageR = {
  person_name: string;
  person_idnr: string;
  istErstesFormular: boolean;
  rente2_aktiv: boolean;
  rente1: RenteStream;
  rente2: RenteStream;

  // Section 4 — Werbungskosten (nur erstes Formular)
  z25_wk_art: string;
  z25_wk_euro: number; // Kz 800
  z26_wk_art: string;
  z26_wk_euro: number; // Kz 801

  // Section 5 — Belgien-DBA + Steuerstundung
  z27_belgien: number; // Kz 702
  z28_belgien_wk: number; // Kz 807
  z29_steuerstundung: number;
};

const EMPTY_STREAM: RenteStream = {
  z4_rentenbetrag: 0,
  z5_anpassung: 0,
  z6_beginn: "",
  z7_vorherige_beginn: "",
  z8_vorherige_ende: "",
  z9_nachzahlung: 0,
  z10_oeffnungsklausel_pct: 0,
  z11_erlischt: "",
  z12_einmalzahlung: 0,
  z13_rentenbetrag: 0,
  z14_beginn: "",
  z15_geburtsdatum_andere: "",
  z16_erlischt_tod_name: "",
  z17_erlischt_spaetestens: "",
  z18_nachzahlung: 0,
  z19_rentenbetrag: 0,
  z20_beginn: "",
  z21_geburtsdatum_andere: "",
  z22_erlischt_tod_name: "",
  z23_erlischt_spaetestens: "",
  z24_nachzahlung: 0,
};

const DEFAULT: AnlageR = {
  person_name: "",
  person_idnr: "",
  istErstesFormular: true,
  rente2_aktiv: false,
  rente1: EMPTY_STREAM,
  rente2: EMPTY_STREAM,
  z25_wk_art: "",
  z25_wk_euro: 0,
  z26_wk_art: "",
  z26_wk_euro: 0,
  z27_belgien: 0,
  z28_belgien_wk: 0,
  z29_steuerstundung: 0,
};

const FORM_ID = "anlage-r";

/** Legacy migration: old AnlageRPage stored an array of Rente calculator
 *  entries under { renten: Rente[] }. Map first/second entries to
 *  rente1/rente2 best-effort. */
type LegacyRente = {
  id?: string;
  typ?: string;
  bezeichnung?: string;
  rentenbeginn_jahr?: number;
  jahresbrutto?: number;
  werbungskosten?: number;
};

function migrateLegacyEntry(entry: LegacyRente): RenteStream {
  const brutto = entry.jahresbrutto ?? 0;
  const beginnJahr = entry.rentenbeginn_jahr ?? 0;
  const beginnIso =
    beginnJahr > 0 ? `${String(beginnJahr).padStart(4, "0")}-01-01` : "";
  const isPrivat =
    entry.typ === "private_kapital" || entry.typ === "private_ruerup";
  const isSonstige = entry.typ === "auslaendisch";
  if (isPrivat) {
    return {
      ...EMPTY_STREAM,
      z13_rentenbetrag: brutto,
      z14_beginn: beginnIso,
    };
  }
  if (isSonstige) {
    return {
      ...EMPTY_STREAM,
      z19_rentenbetrag: brutto,
      z20_beginn: beginnIso,
    };
  }
  return {
    ...EMPTY_STREAM,
    z4_rentenbetrag: brutto,
    z6_beginn: beginnIso,
  };
}

function loadForm(mandantId: string | null, jahr: number): AnlageR {
  const parsed = readEstForm<Partial<AnlageR> & { renten?: LegacyRente[] }>(
    FORM_ID,
    mandantId,
    jahr
  );
  if (!parsed) return DEFAULT;
  if (Array.isArray(parsed.renten) && parsed.renten.length > 0) {
    const wkSum = parsed.renten.reduce(
      (s, r) => s + (r.werbungskosten ?? 0),
      0
    );
    return {
      ...DEFAULT,
      rente1: migrateLegacyEntry(parsed.renten[0]),
      rente2_aktiv: parsed.renten.length > 1,
      rente2: parsed.renten[1]
        ? migrateLegacyEntry(parsed.renten[1])
        : EMPTY_STREAM,
      z25_wk_euro: wkSum,
      z25_wk_art:
        wkSum > 0 ? "Summe aus migriertem Rente-Rechner" : "",
    };
  }
  return {
    ...DEFAULT,
    ...parsed,
    rente1: { ...EMPTY_STREAM, ...(parsed.rente1 ?? {}) },
    rente2: { ...EMPTY_STREAM, ...(parsed.rente2 ?? {}) },
  };
}

function yearOfDate(iso: string): number {
  if (!iso) return 0;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : 0;
}

// ---------- Main page --------------------------------------------------

export default function AnlageRPage() {
  return (
    <MandantRequiredGuard>
      <AnlageRPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageRPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageR>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof AnlageR>(key: K, value: AnlageR[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateStream(
    which: "rente1" | "rente2",
    updater: (r: RenteStream) => RenteStream
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  // Besteuerungsanteil je Stream — auf Z. 4 (gesetzl.) basierend auf Z. 6 Jahr
  const derived = useMemo(() => {
    const calcStream = (r: RenteStream) => {
      const jahr = yearOfDate(r.z6_beginn);
      const anteil = jahr > 0 ? besteuerungsanteil(jahr) : 0;
      const stpfl_z4 = Math.round(r.z4_rentenbetrag * anteil);
      return {
        beginnJahr: jahr,
        besteuerungsanteil: anteil,
        stpfl_z4,
      };
    };
    return {
      r1: calcStream(form.rente1),
      r2: calcStream(form.rente2),
    };
  }, [form.rente1, form.rente2]);

  const summeBrutto = useMemo(() => {
    const sumStream = (r: RenteStream) =>
      r.z4_rentenbetrag + r.z13_rentenbetrag + r.z19_rentenbetrag;
    return sumStream(form.rente1) + (form.rente2_aktiv ? sumStream(form.rente2) : 0);
  }, [form.rente1, form.rente2, form.rente2_aktiv]);

  const summeWk = form.istErstesFormular
    ? form.z25_wk_euro + form.z26_wk_euro
    : 0;

  function validate(): string[] {
    const warns: string[] = [];
    const streams: { name: string; r: RenteStream }[] = [
      { name: "1. Rente", r: form.rente1 },
    ];
    if (form.rente2_aktiv) streams.push({ name: "2. Rente", r: form.rente2 });
    for (const { name, r } of streams) {
      if (
        r.z7_vorherige_beginn &&
        r.z8_vorherige_ende &&
        r.z7_vorherige_beginn > r.z8_vorherige_ende
      ) {
        warns.push(`${name}: vorhergehende Rente — Beginn nach Ende.`);
      }
      if (r.z5_anpassung > r.z4_rentenbetrag) {
        warns.push(
          `${name}: Rentenanpassungsbetrag (Z. 5) > Rentenbetrag (Z. 4) unplausibel.`
        );
      }
      if (r.z10_oeffnungsklausel_pct < 0 || r.z10_oeffnungsklausel_pct > 100) {
        warns.push(`${name}: Öffnungsklausel-% (Z. 10) außerhalb 0–100.`);
      }
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 7000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-r"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-r",
      summary: `Anlage R gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-r",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        summeBrutto,
        summeWk,
        derived,
        form,
      },
    });
    toast.success("Anlage R gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>Anlage R</h1>
          <p>
            Renten und andere Leistungen aus dem Inland (§ 22 Nr. 1 Satz 3
            EStG) · VZ {selectedYear} · Pro Person ein Formular.
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
        <span className="print-header__meta">Anlage R · VZ {selectedYear}</span>
      </div>

      <FormMetaBadge formId="anlage-r" />

      <section className="card taxcalc__section no-print">
        <h2>Profil</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: "0.88rem" }}>
          Anlage R erfasst Renten aus <strong>inländischen</strong> Quellen
          (gesetzl. RV, private RV, sonstige Verpflichtungen). Für
          Riester/Rürup/bAV siehe{" "}
          <Link to="/steuer/anlage-rav-bav">Anlage R-AV/bAV</Link>. Pro Person
          ein Formular.
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
            <span>Erstes Formular dieser Person (Werbungskosten Z. 25–26 erscheinen)</span>
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
          <strong>Besteuerungsanteil § 22 Nr. 1 Satz 3 EStG:</strong> Für
          Renten aus gesetzlicher RV, landwirtschaftlicher Alterskasse,
          berufsständischen Versorgungseinrichtungen und Basisrentenverträgen
          (Z. 4) gilt das Kohortenprinzip — der steuerpflichtige Anteil
          richtet sich nach dem Jahr des Rentenbeginns (Z. 6). Info-Anzeige
          unten je Stream; die endgültige Rentenfreibetrag-Berechnung erfolgt
          im Einkommensteuerbescheid.
        </div>
      </aside>

      <BmfForm
        title="Anlage R"
        subtitle={`Renten aus dem Inland · VZ ${selectedYear}${form.person_name ? " · " + form.person_name : ""}`}
      >
        <RenteStreamBlock
          title="1. Rente"
          rente={form.rente1}
          kz={KZ_R1}
          onChange={(updater) => updateStream("rente1", updater)}
          beginnJahr={derived.r1.beginnJahr}
          besteuerungsanteilPct={derived.r1.besteuerungsanteil * 100}
          stpflZ4={derived.r1.stpfl_z4}
        />

        {form.rente2_aktiv && (
          <RenteStreamBlock
            title="2. Rente"
            rente={form.rente2}
            kz={KZ_R2}
            onChange={(updater) => updateStream("rente2", updater)}
            beginnJahr={derived.r2.beginnJahr}
            besteuerungsanteilPct={derived.r2.besteuerungsanteil * 100}
            stpflZ4={derived.r2.stpfl_z4}
          />
        )}

        <BmfRow
          kz=""
          label="Summe Brutto-Rentenbeträge (Z. 4 + 13 + 19 · ggf. × 2 · Info)"
          value={summeBrutto}
          subtotal
        />

        {form.istErstesFormular && (
          <BmfSection
            title="4. Werbungskosten (Z. 25–26 · nur erstes Formular)"
            description="Aufwendungen im Zusammenhang mit Rentenbezügen (z. B. Steuerberatungskosten, Rechtsverfolgung)."
            total={summeWk}
          >
            <WideRow
              kz="800"
              zeile="25"
              label="Werbungskosten zu Z. 4, 13 und 19 — Art der Aufwendungen"
              wide={280}
            >
              <input
                type="text"
                value={form.z25_wk_art}
                onChange={(e) => set("z25_wk_art", e.target.value)}
                style={textInputStyle}
                placeholder="z. B. Steuerberatung für Renteneinkünfte"
              />
            </WideRow>
            <BmfInputRow
              kz=""
              label="Werbungskosten zu Z. 4, 13 und 19 — Betrag"
              hint="Z. 25"
              value={form.z25_wk_euro}
              onChange={(v) => set("z25_wk_euro", v)}
            />
            <WideRow
              kz="801"
              zeile="26"
              label="Werbungskosten zu Nachzahlungen (Z. 9, 18, 24) — Art der Aufwendungen"
              wide={280}
            >
              <input
                type="text"
                value={form.z26_wk_art}
                onChange={(e) => set("z26_wk_art", e.target.value)}
                style={textInputStyle}
              />
            </WideRow>
            <BmfInputRow
              kz=""
              label="Werbungskosten zu Nachzahlungen — Betrag"
              hint="Z. 26"
              value={form.z26_wk_euro}
              onChange={(v) => set("z26_wk_euro", v)}
            />
          </BmfSection>
        )}

        <BmfSection
          title="5. Besondere Tatbestände (Z. 27–29)"
          description="DBA Belgien + Steuerstundungsmodelle (§ 15b EStG)."
        >
          <BmfInputRow
            kz="702"
            label="Renteneinnahmen nach DBA Belgien (in Z. 4 enthalten) — Ansässigkeit Belgien"
            hint="Z. 27"
            value={form.z27_belgien}
            onChange={(v) => set("z27_belgien", v)}
          />
          <BmfInputRow
            kz="807"
            label="Werbungskosten zu Z. 27 (in Z. 25/26 enthalten)"
            hint="Z. 28"
            value={form.z28_belgien_wk}
            onChange={(v) => set("z28_belgien_wk", v)}
          />
          <BmfInputRow
            kz=""
            label="Steuerstundungsmodelle § 15b EStG (laut Aufstellung)"
            hint="Z. 29"
            value={form.z29_steuerstundung}
            onChange={(v) => set("z29_steuerstundung", v)}
          />
        </BmfSection>

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtige:r" />

        <BmfFootnotes>
          <p>
            <strong>Besteuerungsanteil-Info:</strong> Z. 4 × Besteuerungsanteil
            (Kohortenprinzip § 22 Nr. 1 Satz 3 EStG). Für Rentenbeginn 2005 =
            50 %, 2040 = 100 % (linear ansteigend). Der dauerhafte
            Rentenfreibetrag ergibt sich aus der Differenz und bleibt konstant.
          </p>
          <p>
            <strong>Öffnungsklausel (Z. 10):</strong> Wenn zu Beginn der
            Rentenzahlung besonders hohe Einmalbeiträge geleistet wurden,
            gewährt das FA auf Antrag einen geringeren Besteuerungsanteil —
            die Bescheinigung des Versorgungsträgers muss vorliegen.
          </p>
          <p>
            <strong>Nicht automatisch berechnet:</strong> DBA-Prüfung,
            Öffnungsklausel-Anwendung, Garantiezeitrenten-Differenzen,
            Kapitalauszahlungen gegen Rente-Umwandlung, ermäßigte Besteuerung
            § 34 EStG für Nachzahlungen (Z. 9, 18, 24).
          </p>
          <p>
            <strong>Kennziffern (Kz) und Zeilen-Nr. (Z.)</strong>{" "}
            entsprechen dem offiziellen Anlage R 2025. 2. Rente: Kz jeweils
            +50 (z. B. 101 → 151).
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

// ---------- Rente stream block -----------------------------------------

type StreamBlockProps = {
  title: string;
  rente: RenteStream;
  kz: KzSet;
  onChange: (updater: (r: RenteStream) => RenteStream) => void;
  beginnJahr: number;
  besteuerungsanteilPct: number;
  stpflZ4: number;
};

function RenteStreamBlock({
  title,
  rente,
  kz,
  onChange,
  beginnJahr,
  besteuerungsanteilPct,
  stpflZ4,
}: StreamBlockProps) {
  const setF = <K extends keyof RenteStream>(key: K, value: RenteStream[K]) => {
    onChange((r) => ({ ...r, [key]: value }));
  };
  return (
    <>
      <BmfSection
        title={`Abschnitt 1 · ${title} — Gesetzliche RV / Alterskasse / berufsstdg. / Basisrente (Z. 4–12)`}
        description="Leibrenten und Leistungen (ohne Riester/bAV — siehe Anlage R-AV/bAV)."
      >
        <BmfInputRow
          kz={kz.z4}
          label="Rentenbetrag (inkl. Einmalzahlung und Leistungen)"
          hint="Z. 4"
          value={rente.z4_rentenbetrag}
          onChange={(v) => setF("z4_rentenbetrag", v)}
        />
        <BmfInputRow
          kz={kz.z5}
          label="davon Rentenanpassungsbetrag"
          hint="Z. 5 · Teilmenge von Z. 4"
          value={rente.z5_anpassung}
          onChange={(v) => setF("z5_anpassung", v)}
        />
        <DateRow
          kz={kz.z6}
          zeile="6"
          label="Beginn der Rente"
          value={rente.z6_beginn}
          onChange={(v) => setF("z6_beginn", v)}
        />
        <DateRow
          kz={kz.z7}
          zeile="7"
          label="Vorhergehende Rente: Beginn"
          value={rente.z7_vorherige_beginn}
          onChange={(v) => setF("z7_vorherige_beginn", v)}
        />
        <DateRow
          kz={kz.z8}
          zeile="8"
          label="Vorhergehende Rente: Ende"
          value={rente.z8_vorherige_ende}
          onChange={(v) => setF("z8_vorherige_ende", v)}
        />
        <BmfInputRow
          kz={kz.z9}
          label="Nachzahlungen für mehrere vorangegangene Jahre / Kapitalauszahlung"
          hint="Z. 9 · in Z. 4 enthalten · ggf. § 34 EStG"
          value={rente.z9_nachzahlung}
          onChange={(v) => setF("z9_nachzahlung", v)}
        />
        <PercentRow
          kz={kz.z10}
          zeile="10"
          label="Öffnungsklausel: Prozentsatz lt. Bescheinigung"
          value={rente.z10_oeffnungsklausel_pct}
          onChange={(v) => setF("z10_oeffnungsklausel_pct", v)}
        />
        <DateRow
          kz={kz.z11}
          zeile="11"
          label="Rente erlischt / wird umgewandelt spätestens am"
          value={rente.z11_erlischt}
          onChange={(v) => setF("z11_erlischt", v)}
        />
        <BmfInputRow
          kz={kz.z12}
          label="Bei Einmalzahlung: Betrag"
          hint="Z. 12"
          value={rente.z12_einmalzahlung}
          onChange={(v) => setF("z12_einmalzahlung", v)}
        />

        {/* Info: Besteuerungsanteil */}
        {rente.z4_rentenbetrag > 0 && beginnJahr > 0 && (
          <BmfRow
            kz=""
            label={`Steuerpflichtiger Anteil Z. 4 (Info · Kohortenjahr ${beginnJahr} → ${besteuerungsanteilPct.toFixed(1)} %)`}
            value={stpflZ4}
            subtotal
          />
        )}
      </BmfSection>

      <BmfSection
        title={`Abschnitt 2 · ${title} — Private Rentenversicherungen (Z. 13–18)`}
        description="Leibrenten aus privaten RV (Kapital- oder Altverträge) · nicht aus Z. 4–12 · Ertragsanteil-Besteuerung nach Alter bei Rentenbeginn."
      >
        <BmfInputRow
          kz={kz.z13}
          label="Rentenbetrag"
          hint="Z. 13"
          value={rente.z13_rentenbetrag}
          onChange={(v) => setF("z13_rentenbetrag", v)}
        />
        <DateRow
          kz={kz.z14}
          zeile="14"
          label="Beginn der Rente"
          value={rente.z14_beginn}
          onChange={(v) => setF("z14_beginn", v)}
        />
        <DateRow
          kz={kz.z15}
          zeile="15"
          label="Geburtsdatum anderer Person (Laufzeit-Abhängigkeit / Garantierente)"
          value={rente.z15_geburtsdatum_andere}
          onChange={(v) => setF("z15_geburtsdatum_andere", v)}
        />
        <TextRow
          zeile="16"
          label="Die Rente erlischt mit dem Tod von (Name)"
          value={rente.z16_erlischt_tod_name}
          onChange={(v) => setF("z16_erlischt_tod_name", v)}
        />
        <DateRow
          kz={kz.z17}
          zeile="17"
          label="Rente erlischt / wird umgewandelt spätestens am"
          value={rente.z17_erlischt_spaetestens}
          onChange={(v) => setF("z17_erlischt_spaetestens", v)}
        />
        <BmfInputRow
          kz={kz.z18}
          label="Nachzahlungen für mehrere vorangegangene Jahre (in Z. 13)"
          hint="Z. 18"
          value={rente.z18_nachzahlung}
          onChange={(v) => setF("z18_nachzahlung", v)}
        />
      </BmfSection>

      <BmfSection
        title={`Abschnitt 3 · ${title} — Sonstige Verpflichtungsgründe (Z. 19–24)`}
        description="Renten aus Veräußerungsgeschäften, vertraglichen Leistungen etc. · nicht aus Z. 4–18."
      >
        <BmfInputRow
          kz={kz.z19}
          label="Rentenbetrag"
          hint="Z. 19"
          value={rente.z19_rentenbetrag}
          onChange={(v) => setF("z19_rentenbetrag", v)}
        />
        <DateRow
          kz={kz.z20}
          zeile="20"
          label="Beginn der Rente"
          value={rente.z20_beginn}
          onChange={(v) => setF("z20_beginn", v)}
        />
        <DateRow
          kz={kz.z21}
          zeile="21"
          label="Geburtsdatum anderer Person"
          value={rente.z21_geburtsdatum_andere}
          onChange={(v) => setF("z21_geburtsdatum_andere", v)}
        />
        <TextRow
          zeile="22"
          label="Die Rente erlischt mit dem Tod von (Name)"
          value={rente.z22_erlischt_tod_name}
          onChange={(v) => setF("z22_erlischt_tod_name", v)}
        />
        <DateRow
          kz={kz.z23}
          zeile="23"
          label="Rente erlischt / wird umgewandelt spätestens am"
          value={rente.z23_erlischt_spaetestens}
          onChange={(v) => setF("z23_erlischt_spaetestens", v)}
        />
        <BmfInputRow
          kz={kz.z24}
          label="Nachzahlungen für mehrere vorangegangene Jahre (in Z. 19)"
          hint="Z. 24"
          value={rente.z24_nachzahlung}
          onChange={(v) => setF("z24_nachzahlung", v)}
        />
      </BmfSection>
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
    <WideRow kz="" zeile={zeile} label={label} wide={260}>
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

