import { useMemo, useState } from "react";
import { Calculator, Download, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { calcSv, getSvSet, type SvCalcResult } from "../data/svRates";
import { getSteuerParameter, STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import { FORM_META } from "../data/formMeta";
import { log as auditLog } from "../api/audit";
import FormMetaBadge from "../components/FormMetaBadge";
import { useMandant } from "../contexts/MandantContext";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import { ArchivImportModal } from "../components/ArchivImportModal";
import { getActiveCompanyId } from "../api/db";
import type { AnlageNVorschlag } from "../domain/est/archivEstImport";
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
import "./AnlageN.css";

/** Flat shape aligned to the official 2025 Anlage N Zeilen-/Kennziffer-
 *  Struktur. Older drafts with nested `werbungskosten` are migrated by
 *  loadForm(). */
type AnlageN = {
  // Angaben zum Arbeitslohn (Zeilen 4–10)
  steuerklasse: number; // Z. 4 · Kz 168
  bruttoLohn: number; // Z. 5 · Kz 110/111
  lohnsteuer: number; // Z. 6 · Kz 140/141
  soliZuschlag: number; // Z. 7 · Kz 150/151
  kirchensteuer: number; // Z. 8 · Kz 142/143
  kirchensteuer_ehegatte: number; // Z. 9 · Kz 144/145
  firmenwagen: boolean; // Z. 10 · Kz 197

  // Entfernungspauschale (Zeilen 29–34)
  arbeitsweg_tage: number; // Z. 29 · Kz 110
  arbeitsweg_km: number; // Z. 30 · Kz 111
  arbeitsweg_pkw_km: number; // Z. 31 · Kz 112
  arbeitsweg_sammel_km: number; // Z. 32 · Kz 113
  fahrten_oepnv: number; // Z. 34 · Kz 114

  // Werbungskosten (Zeilen 53–64)
  berufsverbaende: number; // Z. 53 · Kz 310
  arbeitsmittel: number; // Z. 56 · Kz 320
  arbeitszimmer: number; // Z. 57 · Kz 325
  homeoffice_pauschale: number; // Z. 58 · Kz 335
  homeoffice_tage: number; // Z. 59 · Kz 336
  fortbildung: number; // Z. 60 · Kz 330
  weitere_werbungskosten: number; // Z. 64 · Kz 380

  // Reisekosten (Zeilen 69–71)
  reisekosten: number; // Z. 69 · Kz 410
  reisekosten_kraftfahrer: number; // Z. 70 · Kz 411
  reisekosten_erstattung: number; // Z. 71 · Kz 420
};

const FORM_ID = "anlage-n";

const DEFAULT: AnlageN = {
  steuerklasse: 1,
  bruttoLohn: 0,
  lohnsteuer: 0,
  soliZuschlag: 0,
  kirchensteuer: 0,
  kirchensteuer_ehegatte: 0,
  firmenwagen: false,
  arbeitsweg_tage: 0,
  arbeitsweg_km: 0,
  arbeitsweg_pkw_km: 0,
  arbeitsweg_sammel_km: 0,
  fahrten_oepnv: 0,
  berufsverbaende: 0,
  arbeitsmittel: 0,
  arbeitszimmer: 0,
  homeoffice_pauschale: 0,
  homeoffice_tage: 0,
  fortbildung: 0,
  weitere_werbungskosten: 0,
  reisekosten: 0,
  reisekosten_kraftfahrer: 0,
  reisekosten_erstattung: 0,
};

type LegacyAnlageN = Partial<AnlageN> & {
  werbungskosten?: {
    arbeitsmittel?: number;
    fortbildung?: number;
    fahrtkosten?: number;
    arbeitsweg_tage?: number;
    arbeitsweg_km?: number;
    sonstige?: number;
  };
};

function loadForm(mandantId: string | null, jahr: number): AnlageN {
  const parsed = readEstForm<LegacyAnlageN>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  // Migrate from the earlier nested werbungskosten shape.
  if (parsed.werbungskosten && typeof parsed.werbungskosten === "object") {
    const wk = parsed.werbungskosten;
    const { werbungskosten: _drop, ...top } = parsed;
    void _drop;
    return {
      ...DEFAULT,
      ...top,
      arbeitsmittel: wk.arbeitsmittel ?? 0,
      fortbildung: wk.fortbildung ?? 0,
      arbeitsweg_tage: wk.arbeitsweg_tage ?? 0,
      arbeitsweg_km: wk.arbeitsweg_km ?? 0,
      weitere_werbungskosten: wk.sonstige ?? 0,
    };
  }
  return { ...DEFAULT, ...parsed };
}

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function entfernungspauschale(
  tage: number,
  km: number,
  bis20: number,
  ab21: number
): number {
  if (tage <= 0 || km <= 0) return 0;
  const first = Math.min(km, 20) * bis20;
  const rest = Math.max(0, km - 20) * ab21;
  return (first + rest) * tage;
}

export default function AnlageNPage() {
  return (
    <MandantRequiredGuard>
      <AnlageNPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageNPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const params = getSteuerParameter(selectedYear);
  const krankenkassen = getSvSet(selectedYear).krankenkassen;
  const [form, setForm] = useState<AnlageN>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  // Phase 3 / Schritt 10: Archiv-Import-State (nicht persistiert, nur
  // aktuelle Session-Info für Banner).
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState<{
    employeeId: string;
    jahr: number;
    count: number;
  } | null>(null);

  function set<K extends keyof AnlageN>(key: K, value: AnlageN[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleImport(vorschlag: AnlageNVorschlag) {
    // Vier Felder werden tatsächlich gemapt — AnlageN hat keine
    // dedizierten Zielfelder für sv_an_gesamt (gehört in Anlage
    // Vorsorge) oder netto (kein Eintrag in Anlage N).
    setForm((f) => ({
      ...f,
      bruttoLohn: vorschlag.bruttoLohn,
      lohnsteuer: vorschlag.lohnsteuer,
      soliZuschlag: vorschlag.soliZuschlag,
      kirchensteuer: vorschlag.kirchensteuer,
    }));
    setLastImport({
      employeeId: vorschlag.employeeId,
      jahr: vorschlag.jahr,
      count: vorschlag.abrechnungen_gefunden,
    });
  }

  const fahrtkostenAuto = useMemo(
    () =>
      entfernungspauschale(
        form.arbeitsweg_tage,
        form.arbeitsweg_km,
        params.entfernungspauschale_bis20,
        params.entfernungspauschale_ab21
      ),
    [
      form.arbeitsweg_tage,
      form.arbeitsweg_km,
      params.entfernungspauschale_bis20,
      params.entfernungspauschale_ab21,
    ]
  );

  // § 9 Abs. 2 EStG: höhere Aufwendungen für öffentl. Verkehrsmittel können
  // statt der Entfernungspauschale angesetzt werden — nicht zusätzlich.
  const fahrtkostenAnsetzbar = Math.max(fahrtkostenAuto, form.fahrten_oepnv);

  // § 3 Nr. 16 EStG: Erstattungen mindern die absetzbaren Reisekosten.
  const reisekostenNetto = Math.max(
    0,
    form.reisekosten + form.reisekosten_kraftfahrer - form.reisekosten_erstattung
  );

  const werbungskostenSumme = useMemo(
    () =>
      form.berufsverbaende +
      form.arbeitsmittel +
      form.arbeitszimmer +
      form.homeoffice_pauschale +
      form.fortbildung +
      form.weitere_werbungskosten +
      fahrtkostenAnsetzbar +
      reisekostenNetto,
    [
      form.berufsverbaende,
      form.arbeitsmittel,
      form.arbeitszimmer,
      form.homeoffice_pauschale,
      form.fortbildung,
      form.weitere_werbungskosten,
      fahrtkostenAnsetzbar,
      reisekostenNetto,
    ]
  );

  const einkuenfte = useMemo(
    () => Math.max(0, form.bruttoLohn - werbungskostenSumme),
    [form.bruttoLohn, werbungskostenSumme]
  );

  function save() {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-n"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-n",
      summary: `Anlage N gespeichert (FormVersion ${meta.version}, VZ ${meta.veranlagungsjahr}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-n",
        formVersion: meta.version,
        veranlagungsjahr: meta.veranlagungsjahr,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        werbungskostenSumme,
        einkuenfte,
        form,
      },
    });
    toast.success("Anlage N gespeichert.");
  }

  // --- Optionaler SV-Rechner -----------------------------------------
  const [svInput, setSvInput] = useState({
    bruttoMonat: 0,
    krankenkasseIdx: 0,
    kinderlos: false,
    anzahlKinder: 0,
    region: "west" as "west" | "ost",
  });
  const [svResult, setSvResult] = useState<SvCalcResult | null>(null);

  function runSvCalc() {
    if (svInput.bruttoMonat <= 0) {
      toast.error("Bitte Brutto-Monatsgehalt eingeben.");
      return;
    }
    const kk = krankenkassen[Math.min(svInput.krankenkasseIdx, krankenkassen.length - 1)];
    setSvResult(
      calcSv({
        bruttoMonat: svInput.bruttoMonat,
        zusatzbeitragPct: kk.zusatzbeitrag_pct,
        kinderlos: svInput.kinderlos,
        anzahlKinder: svInput.anzahlKinder,
        region: svInput.region,
        jahr: selectedYear,
      })
    );
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage N</h1>
          <p>
            Einkünfte aus nichtselbständiger Arbeit. Erfassung von
            Bruttolohn, Lohnsteuer und Werbungskosten.
          </p>
        </div>
        <div className="period">
          {selectedMandantId !== null && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setImportOpen(true)}
              data-testid="archiv-import-open-btn"
              title="Lohndaten aus Gehaltsabrechnung importieren"
            >
              <Download size={16} />
              Lohndaten importieren
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
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
        <span className="print-header__meta">Anlage N</span>
      </div>

      {lastImport && (
        <div
          className="no-print"
          role="status"
          data-testid="archiv-import-banner"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "8px 12px",
            margin: "8px 0",
            background: "var(--info-bg, #eef4fb)",
            border: "1px solid var(--info, #4c7caf)",
            borderRadius: 6,
            fontSize: "0.85rem",
          }}
        >
          <span style={{ flex: 1 }}>
            Zuletzt importiert: {lastImport.count}{" "}
            {lastImport.count === 1 ? "Abrechnung" : "Abrechnungen"} aus{" "}
            {lastImport.jahr} für Mitarbeiter {lastImport.employeeId}.
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setLastImport(null)}
            aria-label="Hinweis schließen"
            style={{ padding: "2px 8px", fontSize: "0.75rem" }}
          >
            ×
          </button>
        </div>
      )}

      <ArchivImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        clientId={selectedMandantId}
        jahr={selectedYear}
        companyId={getActiveCompanyId() ?? ""}
        onImport={handleImport}
      />

      <FormMetaBadge formId="anlage-n" />

      <BmfForm
        title="Anlage N"
        subtitle={`Einkünfte aus nichtselbständiger Arbeit · Veranlagungszeitraum ${selectedYear}`}
      >
        <BmfSection
          title="Angaben zum Arbeitslohn"
          description="Zeilen 4–10 · Ehegatten-Kennziffern analog (111, 141, 143, 145, 151) bei Zusammenveranlagung."
        >
          {/* Z. 4 · Kz 168 — Steuerklasse */}
          <div className="bmf-form__row">
            <div className="bmf-form__kz-cell">168</div>
            <label className="bmf-form__label">
              <span>
                Steuerklasse
                <span className="bmf-form__label-hint">Z. 4</span>
              </span>
            </label>
            <div className="bmf-form__amount">
              <select
                value={form.steuerklasse}
                onChange={(e) =>
                  set("steuerklasse", Number(e.target.value))
                }
                style={{
                  background: "transparent",
                  border: "none",
                  font: "inherit",
                  width: "100%",
                  textAlign: "right",
                  outline: "none",
                }}
              >
                <option value={1}>I</option>
                <option value={2}>II</option>
                <option value={3}>III</option>
                <option value={4}>IV</option>
                <option value={5}>V</option>
                <option value={6}>VI</option>
              </select>
            </div>
          </div>

          <BmfInputRow
            kz="110"
            label="Bruttoarbeitslohn einschl. Sachbezüge"
            hint="Z. 5 · laut Lohnsteuerbescheinigung, § 19 EStG"
            value={form.bruttoLohn}
            onChange={(v) => set("bruttoLohn", v)}
          />
          <BmfInputRow
            kz="140"
            label="Lohnsteuer"
            hint="Z. 6"
            value={form.lohnsteuer}
            onChange={(v) => set("lohnsteuer", v)}
          />
          <BmfInputRow
            kz="150"
            label="Solidaritätszuschlag"
            hint="Z. 7"
            value={form.soliZuschlag}
            onChange={(v) => set("soliZuschlag", v)}
          />
          <BmfInputRow
            kz="142"
            label="Kirchensteuer des Arbeitnehmers"
            hint="Z. 8"
            value={form.kirchensteuer}
            onChange={(v) => set("kirchensteuer", v)}
          />
          <BmfInputRow
            kz="144"
            label="Kirchensteuer für den Ehegatten / Lebenspartner"
            hint="Z. 9"
            value={form.kirchensteuer_ehegatte}
            onChange={(v) => set("kirchensteuer_ehegatte", v)}
          />

          {/* Z. 10 · Kz 197 — Firmenwagen */}
          <div className="bmf-form__row">
            <div className="bmf-form__kz-cell">197</div>
            <label className="bmf-form__label">
              <span>
                Firmenwagenbesteuerung erklärt
                <span className="bmf-form__label-hint">Z. 10</span>
              </span>
            </label>
            <div className="bmf-form__amount">
              <input
                type="checkbox"
                checked={form.firmenwagen}
                onChange={(e) => set("firmenwagen", e.target.checked)}
              />
            </div>
          </div>
        </BmfSection>

        <BmfSection
          title="Entfernungspauschale (§ 9 Abs. 1 Nr. 4 EStG)"
          description={`Zeilen 29–34 · 0,30 €/km (1.–20.) · 0,38 €/km (ab 21.) · pro Arbeitstag · einfache Entfernung. Aufwendungen für öffentl. Verkehrsmittel werden angesetzt, wenn sie höher als die Pauschale sind (nicht zusätzlich).`}
          total={fahrtkostenAnsetzbar}
        >
          <BmfInputRow
            kz="110"
            label="Erste Tätigkeitsstätte aufgesucht an Tagen"
            hint="Z. 29 · tatsächliche Fahrten (i. d. R. 210–230)"
            value={form.arbeitsweg_tage}
            onChange={(v) => set("arbeitsweg_tage", v)}
            step={1}
          />
          <BmfInputRow
            kz="111"
            label="Einfache Entfernung in Kilometern"
            hint="Z. 30 · kürzeste Straßenverbindung"
            value={form.arbeitsweg_km}
            onChange={(v) => set("arbeitsweg_km", v)}
            step={1}
          />
          <BmfInputRow
            kz="112"
            label="davon mit eigenem/überlassenem PKW (km)"
            hint="Z. 31"
            value={form.arbeitsweg_pkw_km}
            onChange={(v) => set("arbeitsweg_pkw_km", v)}
            step={1}
          />
          <BmfInputRow
            kz="113"
            label="davon mit Sammelbeförderung des Arbeitgebers (km)"
            hint="Z. 32"
            value={form.arbeitsweg_sammel_km}
            onChange={(v) => set("arbeitsweg_sammel_km", v)}
            step={1}
          />
          <BmfInputRow
            kz="114"
            label="Aufwendungen für Fahrten mit öffentlichen Verkehrsmitteln"
            hint="Z. 34 · Jahresbetrag"
            value={form.fahrten_oepnv}
            onChange={(v) => set("fahrten_oepnv", v)}
          />
          <BmfRow
            kz=""
            label="Berechnete Entfernungspauschale (automatisch)"
            value={fahrtkostenAuto}
            subtotal
          />
          <BmfRow
            kz=""
            label="Ansetzbar (höherer Wert aus Pauschale / ÖPNV)"
            value={fahrtkostenAnsetzbar}
            subtotal
          />
        </BmfSection>

        <BmfSection
          title="Werbungskosten"
          description="Zeilen 53–64 · Mindestens der Arbeitnehmer-Pauschbetrag wird vom Finanzamt automatisch berücksichtigt; höhere Werbungskosten nur ansetzen, wenn nachgewiesen."
        >
          <BmfInputRow
            kz="310"
            label="Beiträge zu Berufsverbänden"
            hint="Z. 53"
            value={form.berufsverbaende}
            onChange={(v) => set("berufsverbaende", v)}
          />
          <BmfInputRow
            kz="320"
            label="Summe Arbeitsmittel"
            hint="Z. 56 · Computer, Fachliteratur, Berufskleidung"
            value={form.arbeitsmittel}
            onChange={(v) => set("arbeitsmittel", v)}
          />
          <BmfInputRow
            kz="325"
            label="Häusliches Arbeitszimmer"
            hint="Z. 57 · § 4 Abs. 5 Nr. 6b EStG — Mittelpunkt der Tätigkeit"
            value={form.arbeitszimmer}
            onChange={(v) => set("arbeitszimmer", v)}
          />
          <BmfInputRow
            kz="335"
            label="Tagespauschale Homeoffice"
            hint="Z. 58 · 6 €/Tag · max. 1.260 €/Jahr (210 Tage)"
            value={form.homeoffice_pauschale}
            onChange={(v) => set("homeoffice_pauschale", v)}
          />
          <BmfInputRow
            kz="336"
            label="Anzahl Kalendertage häusliche Wohnung"
            hint="Z. 59 · für Z. 58"
            value={form.homeoffice_tage}
            onChange={(v) => set("homeoffice_tage", v)}
            step={1}
          />
          <BmfInputRow
            kz="330"
            label="Fortbildungskosten"
            hint="Z. 60"
            value={form.fortbildung}
            onChange={(v) => set("fortbildung", v)}
          />
          <BmfInputRow
            kz="380"
            label="Summe der weiteren Werbungskosten"
            hint="Z. 64"
            value={form.weitere_werbungskosten}
            onChange={(v) => set("weitere_werbungskosten", v)}
          />
        </BmfSection>

        <BmfSection
          title="Reisekosten bei beruflich veranlassten Auswärtstätigkeiten"
          description="Zeilen 69–71 · Vom Arbeitgeber steuerfrei erstattete Beträge (§ 3 Nr. 16 EStG) mindern die abziehbaren Reisekosten."
          total={reisekostenNetto}
        >
          <BmfInputRow
            kz="410"
            label="Gesamtsumme der Aufwendungen für Reisekosten"
            hint="Z. 69 · Fahrt-, Übernachtungs-, Verpflegungsmehraufwand"
            value={form.reisekosten}
            onChange={(v) => set("reisekosten", v)}
          />
          <BmfInputRow
            kz="411"
            label="Pauschbeträge für Berufskraftfahrer"
            hint="Z. 70 · 9 €/Tag, § 9 Abs. 1 Nr. 5b EStG"
            value={form.reisekosten_kraftfahrer}
            onChange={(v) => set("reisekosten_kraftfahrer", v)}
          />
          <BmfInputRow
            kz="420"
            label="Vom Arbeitgeber steuerfrei ersetzt"
            hint="Z. 71 · wird abgezogen"
            value={form.reisekosten_erstattung}
            onChange={(v) => set("reisekosten_erstattung", v)}
          />
          <BmfRow
            kz=""
            label="Abziehbar (Z. 69 + Z. 70 − Z. 71)"
            value={reisekostenNetto}
            subtotal
          />
        </BmfSection>

        {/* Summary subtotal */}
        <div className="bmf-form__row" style={{ background: "#eef1f6" }}>
          <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
          <div
            className="bmf-form__label"
            style={{ fontWeight: 700, color: "#15233d" }}
          >
            Summe Werbungskosten gesamt
          </div>
          <div
            className="bmf-form__amount"
            style={{ fontWeight: 700, color: "#15233d" }}
          >
            {euro.format(werbungskostenSumme)}
          </div>
        </div>

        <BmfResult
          label="Einkünfte aus nichtselbständiger Arbeit (Kz 110 − Werbungskosten)"
          value={einkuenfte}
          variant={einkuenfte > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures left="Datum, Ort" right="Unterschrift Steuerpflichtiger" />

        <BmfFootnotes>
          <p>
            <strong>Kennziffern (Kz)</strong> und <strong>Zeilen-Nr. (Z.)</strong>{" "}
            entsprechen dem offiziellen Anlage N 2025. Bei Zusammenveranlagung
            gelten die jeweils um 1 erhöhten Partner-Kennziffern (111, 141,
            143, 145, 151).
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Übermittlung
            erfolgt elektronisch über ELSTER.
          </p>
        </BmfFootnotes>
      </BmfForm>

      <section className="card anlage__section anlage__svrechner no-print">
        <h2>Sozialversicherungs-Rechner {selectedYear} (optional)</h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
          Beitragsrechner für die gesetzliche Kranken-, Pflege-, Renten- und
          Arbeitslosenversicherung. Stand Anfang {selectedYear} — Sätze können
          sich unterjährig ändern.
        </p>

        <div className="form-grid">
          <label className="form-field">
            <span>Brutto-Monat (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={svInput.bruttoMonat}
              onChange={(e) =>
                setSvInput((s) => ({ ...s, bruttoMonat: Number(e.target.value) }))
              }
            />
          </label>

          <label className="form-field">
            <span>Krankenkasse</span>
            <select
              value={svInput.krankenkasseIdx}
              onChange={(e) =>
                setSvInput((s) => ({
                  ...s,
                  krankenkasseIdx: Number(e.target.value),
                }))
              }
            >
              {krankenkassen.map((k, i) => (
                <option key={k.name} value={i}>
                  {k.name} ({k.zusatzbeitrag_pct.toFixed(2)} % Zusatzbeitrag)
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Region</span>
            <select
              value={svInput.region}
              onChange={(e) =>
                setSvInput((s) => ({
                  ...s,
                  region: e.target.value as "west" | "ost",
                }))
              }
            >
              <option value="west">West</option>
              <option value="ost">Ost</option>
            </select>
          </label>

          <label className="form-field">
            <span>Anzahl Kinder</span>
            <input
              type="number"
              min="0"
              max="10"
              value={svInput.anzahlKinder}
              onChange={(e) =>
                setSvInput((s) => ({
                  ...s,
                  anzahlKinder: Number(e.target.value),
                }))
              }
            />
          </label>

          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={svInput.kinderlos}
              onChange={(e) =>
                setSvInput((s) => ({ ...s, kinderlos: e.target.checked }))
              }
            />
            <span>Kinderlos (PV-Zuschlag +0,6 %)</span>
          </label>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={runSvCalc}
          style={{ alignSelf: "flex-start" }}
        >
          <Calculator size={16} />
          Beiträge berechnen
        </button>

        {svResult && (
          <div className="anlage__sv-result">
            <table className="report__table">
              <thead>
                <tr>
                  <th>Versicherung</th>
                  <th className="is-num">Arbeitnehmer</th>
                  <th className="is-num">Arbeitgeber</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Krankenversicherung</td>
                  <td className="is-num mono">{euro.format(svResult.kv_an)}</td>
                  <td className="is-num mono">{euro.format(svResult.kv_ag)}</td>
                </tr>
                <tr>
                  <td>Pflegeversicherung</td>
                  <td className="is-num mono">{euro.format(svResult.pv_an)}</td>
                  <td className="is-num mono">{euro.format(svResult.pv_ag)}</td>
                </tr>
                <tr>
                  <td>Rentenversicherung</td>
                  <td className="is-num mono">{euro.format(svResult.rv_an)}</td>
                  <td className="is-num mono">{euro.format(svResult.rv_ag)}</td>
                </tr>
                <tr>
                  <td>Arbeitslosenversicherung</td>
                  <td className="is-num mono">{euro.format(svResult.av_an)}</td>
                  <td className="is-num mono">{euro.format(svResult.av_ag)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="is-result">
                  <td>
                    <strong>Summe SV-Beiträge</strong>
                  </td>
                  <td className="is-num mono">
                    {euro.format(svResult.summe_an)}
                  </td>
                  <td className="is-num mono">
                    {euro.format(svResult.summe_ag)}
                  </td>
                </tr>
                <tr className="is-result">
                  <td>
                    <strong>Netto vor Lohnsteuer</strong>
                  </td>
                  <td className="is-num mono" colSpan={2}>
                    {euro.format(svResult.netto_vor_steuer)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0 }}>
              Ohne Lohnsteuer/Soli/Kirchensteuer. Bemessungsgrenze KV/PV:{" "}
              {euro.format(svResult.bemessungKv)} · RV/AV:{" "}
              {euro.format(svResult.bemessungRv)}.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
