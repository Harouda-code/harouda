import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Info, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { ArchivImportModal } from "../components/ArchivImportModal";
import { getActiveCompanyId } from "../api/db";
import type { AnlageVorsorgeVorschlag } from "../domain/est/archivEstImport";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  getSteuerParameter,
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
  BmfResult,
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";
import "./TaxCalc.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Flat 2025 Anlage Vorsorgeaufwand shape.
 *  Field comments: Z. (Zeile) und (Kz Stpfl / Kz Ehegatte). */
type VorsorgeState = {
  // Profil
  status: "arbeitnehmer" | "selbstaendig" | "beamter";
  zusammenveranlagung: boolean;

  // Section 1 — Altersvorsorge (Z. 4–10)
  z4_an_anteil: number; // Kz 300/400
  z5_landw_berufsst: number; // Kz 301/401
  z6_gesetzl_rv: number; // Kz 302/402
  z7_erstattungen: number; // Kz 309/409
  z8_ruerup: number; // Kz 303/403
  z9_ag_anteil: number; // Kz 304/404
  z10_minijob_ag: number; // Kz 306/406

  // Section 2 — KV/PV gesetzlich (Z. 11–22)
  z11_kv_an: number; // Kz 320/420
  z12_kv_an_ohne_kg: number; // Kz 322/422
  z13_pv_an: number; // Kz 323/423
  z14_kv_pv_erstattet: number; // Kz 324/424
  z15_kv_erst_anteil: number; // Kz 325/425
  z16_kv_sonst: number; // Kz 326/426
  z17_kv_sonst_mit_kg: number; // Kz 328/428
  z18_pv_sonst: number; // Kz 329/429
  z19_kv_pv_sonst_erstattet: number; // Kz 330/430
  z20_kv_sonst_erst_mit_kg: number; // Kz 331/431
  z21_zuschuss_kv_pv: number; // Kz 332/432
  z22_kv_ueber_basis: number; // Kz 338/438

  // Section 3 — PKV (Z. 23–27)
  z23_pkv_basis: number; // Kz 350/450
  z24_pkv_pv: number; // Kz 351/451
  z25_pkv_erstattet: number; // Kz 352/452
  z26_pkv_zuschuss: number; // Kz 353/453
  z27_pkv_ueber_basis: number; // Kz 354/454

  // Section 4 — Ausländische Versicherung (Z. 28–33)
  z28_ausl_kv: number; // Kz 333/433
  z29_ausl_kv_ohne_kg: number; // Kz 334/434
  z30_ausl_pv: number; // Kz 335/435
  z31_ausl_erstattet: number; // Kz 336/436
  z32_ausl_erst_ohne_kg: number; // Kz 337/437
  z33_ausl_ueber_basis: number; // Kz 339/439

  // Section 5 — Steuerfreie AG-Zuschüsse (Z. 34–36)
  z34_ag_zuschuss_gkv: number; // Kz 360/460
  z35_ag_zuschuss_pkv: number; // Kz 361/461
  z36_ag_zuschuss_pv: number; // Kz 362/462

  // Section 6 — Mitversicherte Person (Z. 37–42)
  z37_idnr: string; // Kz 600
  z38_person: string;
  z39_pkv_mit_basis: number; // Kz 601
  z40_pkv_mit_pv: number; // Kz 602
  z41_pkv_mit_erstattet: number; // Kz 603
  z42_pkv_mit_ueber: number; // Kz 604

  // Section 7 — Weitere Vorsorgeaufwendungen (Z. 43–48)
  z43_av_an: number; // Kz 370/470
  z44_av_privat: number; // Kz 500
  z45_bu: number; // Kz 501
  z46_unfall_haftpflicht: number; // Kz 502
  z47_lv_alt_kapital: number; // Kz 503
  z48_lv_alt_ohne_kapital: number; // Kz 504

  // Section 8 — Ergänzende Angaben (Z. 49–55)
  z49_steuerfreie_zuschuesse: boolean; // Kz 307/407
  z50_beamter: boolean; // Kz 380/480
  z51_vorstand: boolean; // Kz 381/481
  z52_praktikant: boolean; // Kz 382/482
  z53_taetigkeit: string;
  z54_anwartschaft: boolean; // Kz 383/483
  z55_nicht_aktiv: boolean; // Kz 385/485
};

const DEFAULT: VorsorgeState = {
  status: "arbeitnehmer",
  zusammenveranlagung: false,
  z4_an_anteil: 0,
  z5_landw_berufsst: 0,
  z6_gesetzl_rv: 0,
  z7_erstattungen: 0,
  z8_ruerup: 0,
  z9_ag_anteil: 0,
  z10_minijob_ag: 0,
  z11_kv_an: 0,
  z12_kv_an_ohne_kg: 0,
  z13_pv_an: 0,
  z14_kv_pv_erstattet: 0,
  z15_kv_erst_anteil: 0,
  z16_kv_sonst: 0,
  z17_kv_sonst_mit_kg: 0,
  z18_pv_sonst: 0,
  z19_kv_pv_sonst_erstattet: 0,
  z20_kv_sonst_erst_mit_kg: 0,
  z21_zuschuss_kv_pv: 0,
  z22_kv_ueber_basis: 0,
  z23_pkv_basis: 0,
  z24_pkv_pv: 0,
  z25_pkv_erstattet: 0,
  z26_pkv_zuschuss: 0,
  z27_pkv_ueber_basis: 0,
  z28_ausl_kv: 0,
  z29_ausl_kv_ohne_kg: 0,
  z30_ausl_pv: 0,
  z31_ausl_erstattet: 0,
  z32_ausl_erst_ohne_kg: 0,
  z33_ausl_ueber_basis: 0,
  z34_ag_zuschuss_gkv: 0,
  z35_ag_zuschuss_pkv: 0,
  z36_ag_zuschuss_pv: 0,
  z37_idnr: "",
  z38_person: "",
  z39_pkv_mit_basis: 0,
  z40_pkv_mit_pv: 0,
  z41_pkv_mit_erstattet: 0,
  z42_pkv_mit_ueber: 0,
  z43_av_an: 0,
  z44_av_privat: 0,
  z45_bu: 0,
  z46_unfall_haftpflicht: 0,
  z47_lv_alt_kapital: 0,
  z48_lv_alt_ohne_kapital: 0,
  z49_steuerfreie_zuschuesse: false,
  z50_beamter: false,
  z51_vorstand: false,
  z52_praktikant: false,
  z53_taetigkeit: "",
  z54_anwartschaft: false,
  z55_nicht_aktiv: false,
};

const FORM_ID = "anlage-vorsorge";

type LegacyVorsorge = Partial<VorsorgeState> & {
  // old nested/flat shape from the previous schema
  rv_an_anteil?: number;
  rv_ag_anteil?: number;
  ruerup_beitrag?: number;
  knappschaft?: number;
  berufsstaendisch?: number;
  kv_beitrag?: number;
  kv_basisabsicherung?: number;
  pv_beitrag?: number;
  av_beitrag?: number;
  unfallversicherung?: number;
  haftpflicht?: number;
  lebensversicherung_alt?: number;
  ehegatte?: boolean;
};

function loadForm(mandantId: string | null, jahr: number): VorsorgeState {
  const parsed = readEstForm<LegacyVorsorge>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  // Migrate old shape: map its short keys onto the new Z.* fields.
  const migrated: VorsorgeState = {
    ...DEFAULT,
    ...parsed,
    // Status and ehegatte migration
    zusammenveranlagung:
      parsed.zusammenveranlagung ?? parsed.ehegatte ?? DEFAULT.zusammenveranlagung,
    // Altersvorsorge
    z4_an_anteil:
      parsed.z4_an_anteil ?? parsed.rv_an_anteil ?? 0,
    z5_landw_berufsst:
      parsed.z5_landw_berufsst ?? parsed.berufsstaendisch ?? 0,
    z6_gesetzl_rv: parsed.z6_gesetzl_rv ?? parsed.knappschaft ?? 0,
    z8_ruerup: parsed.z8_ruerup ?? parsed.ruerup_beitrag ?? 0,
    z9_ag_anteil: parsed.z9_ag_anteil ?? parsed.rv_ag_anteil ?? 0,
    // KV/PV (AN): best-effort mapping
    z11_kv_an: parsed.z11_kv_an ?? parsed.kv_basisabsicherung ?? 0,
    z13_pv_an: parsed.z13_pv_an ?? parsed.pv_beitrag ?? 0,
    z22_kv_ueber_basis:
      parsed.z22_kv_ueber_basis ?? parsed.kv_beitrag ?? 0,
    // Weitere
    z43_av_an: parsed.z43_av_an ?? parsed.av_beitrag ?? 0,
    z46_unfall_haftpflicht:
      parsed.z46_unfall_haftpflicht ??
      (parsed.unfallversicherung ?? 0) + (parsed.haftpflicht ?? 0),
    z48_lv_alt_ohne_kapital:
      parsed.z48_lv_alt_ohne_kapital ?? parsed.lebensversicherung_alt ?? 0,
  };
  return migrated;
}

export default function AnlageVorsorgePage() {
  return (
    <MandantRequiredGuard>
      <AnlageVorsorgePageInner />
    </MandantRequiredGuard>
  );
}

function AnlageVorsorgePageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const params = getSteuerParameter(selectedYear);

  const [form, setForm] = useState<VorsorgeState>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  // Nacht-Modus (2026-04-21) · Schritt 2: Archiv-Import-State.
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState<{
    employeeId: string;
    jahr: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function set<K extends keyof VorsorgeState>(
    key: K,
    value: VorsorgeState[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleVorsorgeImport(vorschlag: AnlageVorsorgeVorschlag) {
    // Mapping-Entscheidung (dokumentiert im Schritt-2-Bericht):
    //   kv_an_basis + kv_an_zusatz   → z11_kv_an (AN-Beitrag inkl. Zusatz)
    //   pv_an                        → z13_pv_an
    //   rv_an                        → z4_an_anteil
    //   av_an                        → z43_av_an
    setForm((f) => ({
      ...f,
      z11_kv_an: vorschlag.kv_an_basis + vorschlag.kv_an_zusatz,
      z13_pv_an: vorschlag.pv_an,
      z4_an_anteil: vorschlag.rv_an,
      z43_av_an: vorschlag.av_an,
    }));
    setLastImport({
      employeeId: vorschlag.employeeId,
      jahr: vorschlag.jahr,
      count: vorschlag.abrechnungen_gefunden,
    });
  }

  const calc = useMemo(() => {
    // --- Section 1 · Altersvorsorge -----------------------------------
    const basisBeitragStpfl =
      form.z4_an_anteil +
      form.z5_landw_berufsst +
      form.z6_gesetzl_rv +
      form.z8_ruerup;
    const basisBeitragNetto = Math.max(
      0,
      basisBeitragStpfl - form.z7_erstattungen
    );
    const agAnteil = form.z9_ag_anteil + form.z10_minijob_ag;
    const ruerupHoechst =
      params.ruerup_hoechstbetrag_euro * (form.zusammenveranlagung ? 2 : 1);
    const basisKombiniert = basisBeitragNetto + agAnteil;
    const basisGedeckelt = Math.min(basisKombiniert, ruerupHoechst);
    const basisAbzug = Math.max(
      0,
      basisGedeckelt - (form.status === "arbeitnehmer" ? agAnteil : 0)
    );

    // --- Section 2–4 · KV/PV Basis (ungedeckelt) ----------------------
    // § 10 Abs. 1 Nr. 3 Satz 4 EStG: Beiträge MIT Krankengeld-Anspruch
    // zu 96 % ansetzbar; Beiträge OHNE Krankengeld-Anspruch voll.
    const z11_mit_kg = Math.max(0, form.z11_kv_an - form.z12_kv_an_ohne_kg);
    const z11_absetzbar = z11_mit_kg * 0.96 + form.z12_kv_an_ohne_kg;
    const kv_an_basis = Math.max(
      0,
      z11_absetzbar - form.z14_kv_pv_erstattet + form.z15_kv_erst_anteil
    );

    const z16_ohne_kg = Math.max(
      0,
      form.z16_kv_sonst - form.z17_kv_sonst_mit_kg
    );
    const z16_absetzbar = form.z17_kv_sonst_mit_kg * 0.96 + z16_ohne_kg;
    const kv_sonst_basis = Math.max(
      0,
      z16_absetzbar -
        form.z19_kv_pv_sonst_erstattet -
        form.z21_zuschuss_kv_pv
    );

    const pv_an_basis = form.z13_pv_an + form.z18_pv_sonst;

    const pkv_basis = Math.max(
      0,
      form.z23_pkv_basis +
        form.z24_pkv_pv -
        form.z25_pkv_erstattet -
        form.z26_pkv_zuschuss
    );

    const z28_mit_kg = Math.max(
      0,
      form.z28_ausl_kv - form.z29_ausl_kv_ohne_kg
    );
    const z28_absetzbar = z28_mit_kg * 0.96 + form.z29_ausl_kv_ohne_kg;
    const ausl_basis = Math.max(
      0,
      z28_absetzbar + form.z30_ausl_pv - form.z31_ausl_erstattet
    );

    const pkv_mit_basis = Math.max(
      0,
      form.z39_pkv_mit_basis + form.z40_pkv_mit_pv - form.z41_pkv_mit_erstattet
    );

    const basisKvPvGesamt =
      kv_an_basis +
      pv_an_basis +
      kv_sonst_basis +
      pkv_basis +
      ausl_basis +
      pkv_mit_basis;

    // --- Section 7 · Sonstige Vorsorge (gedeckelt) --------------------
    const sonstigeMax =
      (form.status === "arbeitnehmer" || form.status === "beamter"
        ? params.sonstige_vorsorge_max_an_euro
        : params.sonstige_vorsorge_max_selbst_euro) *
      (form.zusammenveranlagung ? 2 : 1);

    const sonstigeBrutto =
      form.z22_kv_ueber_basis +
      form.z27_pkv_ueber_basis +
      form.z33_ausl_ueber_basis +
      form.z42_pkv_mit_ueber +
      form.z43_av_an +
      form.z44_av_privat +
      form.z45_bu +
      form.z46_unfall_haftpflicht +
      form.z47_lv_alt_kapital * 0.88 + // Altvertrag 88 %
      form.z48_lv_alt_ohne_kapital;

    const sonstigeMitCap = Math.min(sonstigeBrutto, sonstigeMax);

    // Günstigerprüfung: max aus gedeckelter Sonstige und ungedeckelter
    // Basis-KV/PV (§ 10 Abs. 4 Satz 4 EStG).
    const sonstigeAbzug = Math.max(basisKvPvGesamt, sonstigeMitCap);

    const gesamtAbzug = basisAbzug + sonstigeAbzug;

    return {
      basisBeitragStpfl: round2(basisBeitragStpfl),
      basisBeitragNetto: round2(basisBeitragNetto),
      agAnteil: round2(agAnteil),
      ruerupHoechst,
      basisAbzug: round2(basisAbzug),
      basisKvPvGesamt: round2(basisKvPvGesamt),
      sonstigeMax,
      sonstigeBrutto: round2(sonstigeBrutto),
      sonstigeMitCap: round2(sonstigeMitCap),
      sonstigeAbzug: round2(sonstigeAbzug),
      gesamtAbzug: round2(gesamtAbzug),
    };
  }, [form, params]);

  function save() {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-vorsorge"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-vorsorge",
      summary: `Anlage Vorsorgeaufwand gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-vorsorge",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        calc,
        form,
      },
    });
    toast.success("Anlage Vorsorgeaufwand gespeichert.");
  }

  return (
    <div className="report taxform">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage Vorsorgeaufwand</h1>
          <p>
            Sonderausgabenabzug (§ 10 Abs. 1 Nr. 2, 3, 3a EStG) · VZ{" "}
            {selectedYear}
          </p>
        </div>
        <div className="period">
          {selectedMandantId !== null && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setImportOpen(true)}
              data-testid="vorsorge-import-open-btn"
              title="Sozialversicherungsbeiträge aus Gehaltsabrechnung importieren"
            >
              <Download size={16} />
              SV-Beiträge importieren
            </button>
          )}
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
            Entwurf speichern
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">
          Anlage Vorsorgeaufwand · VZ {selectedYear}
        </span>
      </div>

      {lastImport && (
        <div
          className="no-print"
          role="status"
          data-testid="vorsorge-import-banner"
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
        variant="anlage-vorsorge"
        onImport={handleVorsorgeImport}
      />

      <FormMetaBadge formId="anlage-vorsorge" />

      <section className="card taxcalc__section no-print">
        <h2>Profil</h2>
        <div className="form-grid">
          <label className="form-field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as VorsorgeState["status"])
              }
            >
              <option value="arbeitnehmer">Arbeitnehmer:in</option>
              <option value="beamter">Beamter / Beamtin</option>
              <option value="selbstaendig">Selbständig</option>
            </select>
          </label>
          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.zusammenveranlagung}
              onChange={(e) => set("zusammenveranlagung", e.target.checked)}
            />
            <span>
              Zusammenveranlagung mit Ehegatte:in (Höchstbeträge verdoppeln)
            </span>
          </label>
        </div>

        <aside className="taxcalc__hint">
          <Info size={14} />
          <span>
            Höchstbeträge {selectedYear}: Basisvorsorge{" "}
            <strong>{euro.format(calc.ruerupHoechst)}</strong>, sonstige
            Vorsorge <strong>{euro.format(calc.sonstigeMax)}</strong>.
            Kranken-Basisabsicherung und Pflege sind ungedeckelt absetzbar (§
            10 Abs. 4 Satz 4 EStG).
          </span>
        </aside>
      </section>

      <BmfForm
        title="Anlage Vorsorgeaufwand"
        subtitle={`Sonderausgabenabzug (§ 10 Abs. 1 Nr. 2, 3, 3a EStG) · VZ ${selectedYear}`}
      >
        {/* ---------- Section 1 ---------- */}
        <BmfSection
          title="1. Beiträge zur Altersvorsorge (Z. 4–10)"
          description={`Höchstbetrag ${selectedYear}: ${euro.format(calc.ruerupHoechst)}. Bei Arbeitnehmer:innen wird der AG-Anteil (Z. 9 + Z. 10) vom gedeckelten Betrag abgezogen.`}
          total={calc.basisAbzug}
        >
          <BmfInputRow
            kz="300"
            label="Arbeitnehmeranteil laut Nr. 23 a/b LStB"
            hint="Z. 4 · Lohnsteuerbescheinigung"
            value={form.z4_an_anteil}
            onChange={(v) => set("z4_an_anteil", v)}
          />
          <BmfInputRow
            kz="301"
            label="Beiträge zur landwirtschaftlichen Alterskasse / berufsständischen Versorgung"
            hint="Z. 5"
            value={form.z5_landw_berufsst}
            onChange={(v) => set("z5_landw_berufsst", v)}
          />
          <BmfInputRow
            kz="302"
            label="Beiträge zu gesetzlichen Rentenversicherungen"
            hint="Z. 6 · freiwillig/Pflichtbeiträge Selbstzahler"
            value={form.z6_gesetzl_rv}
            onChange={(v) => set("z6_gesetzl_rv", v)}
          />
          <BmfInputRow
            kz="309"
            label="Erstattete Beiträge / steuerfreie Zuschüsse zu Z. 4–6"
            hint="Z. 7 · wird abgezogen"
            value={form.z7_erstattungen}
            onChange={(v) => set("z7_erstattungen", v)}
          />
          <BmfInputRow
            kz="303"
            label="Beiträge zu zertifizierten Basisrentenverträgen (Rürup)"
            hint="Z. 8 · § 10 Abs. 1 Nr. 2 b EStG"
            value={form.z8_ruerup}
            onChange={(v) => set("z8_ruerup", v)}
          />
          <BmfInputRow
            kz="304"
            label="Arbeitgeberanteil/-zuschuss laut Nr. 22 a/b LStB"
            hint="Z. 9 · wird beim Abzug gegengerechnet (Arbeitnehmer)"
            value={form.z9_ag_anteil}
            onChange={(v) => set("z9_ag_anteil", v)}
          />
          <BmfInputRow
            kz="306"
            label="AG-Anteil zur gesetzl. RV bei geringfügiger Beschäftigung"
            hint="Z. 10 · Minijob-Pauschale"
            value={form.z10_minijob_ag}
            onChange={(v) => set("z10_minijob_ag", v)}
          />
          <BmfRow
            kz=""
            label="Summe Basisbeiträge (netto · nach Erstattungen)"
            value={calc.basisBeitragNetto}
            subtotal
          />
          <BmfRow
            kz=""
            label="Davon abziehbar nach Höchstbetrag + AG-Anrechnung"
            value={calc.basisAbzug}
            subtotal
          />
        </BmfSection>

        {/* ---------- Section 2 ---------- */}
        <BmfSection
          title="2. Kranken- und Pflegeversicherung (Z. 11–22)"
          description="Basisabsicherung ist ungedeckelt absetzbar. Beiträge mit Krankengeld-Anspruch werden zu 96 % angesetzt (§ 10 Abs. 1 Nr. 3 Satz 4 EStG)."
        >
          <BmfInputRow
            kz="320"
            label="Arbeitnehmerbeiträge zur KV laut Nr. 25 LStB"
            hint="Z. 11 · gesetzl. KV, Pflichtversicherung"
            value={form.z11_kv_an}
            onChange={(v) => set("z11_kv_an", v)}
          />
          <BmfInputRow
            kz="322"
            label="davon Beiträge ohne Krankengeld-Anspruch"
            hint="Z. 12 · voll absetzbar (kein 4 %-Abzug)"
            value={form.z12_kv_an_ohne_kg}
            onChange={(v) => set("z12_kv_an_ohne_kg", v)}
          />
          <BmfInputRow
            kz="323"
            label="Arbeitnehmerbeiträge zur sozialen PV laut Nr. 26 LStB"
            hint="Z. 13"
            value={form.z13_pv_an}
            onChange={(v) => set("z13_pv_an", v)}
          />
          <BmfInputRow
            kz="324"
            label="Von KV/PV erstattete Beiträge"
            hint="Z. 14 · wird abgezogen"
            value={form.z14_kv_pv_erstattet}
            onChange={(v) => set("z14_kv_pv_erstattet", v)}
          />
          <BmfInputRow
            kz="325"
            label="davon Erstattungen zur Krankenversicherung"
            hint="Z. 15"
            value={form.z15_kv_erst_anteil}
            onChange={(v) => set("z15_kv_erst_anteil", v)}
          />
          <BmfInputRow
            kz="326"
            label="Sonstige Beiträge zu Krankenversicherungen (freiwillig)"
            hint="Z. 16 · z. B. freiwillige gesetzliche KV"
            value={form.z16_kv_sonst}
            onChange={(v) => set("z16_kv_sonst", v)}
          />
          <BmfInputRow
            kz="328"
            label="davon mit Krankengeld-Anspruch"
            hint="Z. 17 · 4 %-Abzug"
            value={form.z17_kv_sonst_mit_kg}
            onChange={(v) => set("z17_kv_sonst_mit_kg", v)}
          />
          <BmfInputRow
            kz="329"
            label="Sonstige Beiträge zur sozialen Pflegeversicherung"
            hint="Z. 18"
            value={form.z18_pv_sonst}
            onChange={(v) => set("z18_pv_sonst", v)}
          />
          <BmfInputRow
            kz="330"
            label="Von KV/PV erstattete Beiträge (zu Z. 16/18)"
            hint="Z. 19 · wird abgezogen"
            value={form.z19_kv_pv_sonst_erstattet}
            onChange={(v) => set("z19_kv_pv_sonst_erstattet", v)}
          />
          <BmfInputRow
            kz="331"
            label="davon Erstattungen mit Krankengeld-Anspruch"
            hint="Z. 20"
            value={form.z20_kv_sonst_erst_mit_kg}
            onChange={(v) => set("z20_kv_sonst_erst_mit_kg", v)}
          />
          <BmfInputRow
            kz="332"
            label="Zuschuss zu Beiträgen Z. 16 / Z. 18"
            hint="Z. 21 · wird abgezogen"
            value={form.z21_zuschuss_kv_pv}
            onChange={(v) => set("z21_zuschuss_kv_pv", v)}
          />
          <BmfInputRow
            kz="338"
            label="Über die Basisabsicherung hinausgehende KV-Beiträge"
            hint="Z. 22 · Wahltarife, Chefarzt, Einbettzimmer etc."
            value={form.z22_kv_ueber_basis}
            onChange={(v) => set("z22_kv_ueber_basis", v)}
          />
        </BmfSection>

        {/* ---------- Section 3 ---------- */}
        <BmfSection
          title="3. Private Kranken-/Pflege-Pflichtversicherung (Z. 23–27)"
          description="Basisabsicherung ungedeckelt absetzbar; Wahlleistungen zählen zu den sonstigen Vorsorgeaufwendungen."
        >
          <BmfInputRow
            kz="350"
            label="Beiträge zu privater KV (nur Basisabsicherung)"
            hint="Z. 23"
            value={form.z23_pkv_basis}
            onChange={(v) => set("z23_pkv_basis", v)}
          />
          <BmfInputRow
            kz="351"
            label="Beiträge zur Pflege-Pflichtversicherung"
            hint="Z. 24"
            value={form.z24_pkv_pv}
            onChange={(v) => set("z24_pkv_pv", v)}
          />
          <BmfInputRow
            kz="352"
            label="Von der PKV erstattete Beiträge"
            hint="Z. 25 · wird abgezogen"
            value={form.z25_pkv_erstattet}
            onChange={(v) => set("z25_pkv_erstattet", v)}
          />
          <BmfInputRow
            kz="353"
            label="Zuschuss von dritter Seite"
            hint="Z. 26 · wird abgezogen"
            value={form.z26_pkv_zuschuss}
            onChange={(v) => set("z26_pkv_zuschuss", v)}
          />
          <BmfInputRow
            kz="354"
            label="Über die Basisabsicherung hinausgehende PKV-Beiträge"
            hint="Z. 27"
            value={form.z27_pkv_ueber_basis}
            onChange={(v) => set("z27_pkv_ueber_basis", v)}
          />
        </BmfSection>

        {/* ---------- Section 4 ---------- */}
        <BmfSection
          title="4. Ausländische Kranken-/Pflegeversicherung (Z. 28–33)"
          description="Nur mit inländischer Versicherung vergleichbare Beiträge."
        >
          <BmfInputRow
            kz="333"
            label="Beiträge zur vergleichbaren ausländischen KV"
            hint="Z. 28"
            value={form.z28_ausl_kv}
            onChange={(v) => set("z28_ausl_kv", v)}
          />
          <BmfInputRow
            kz="334"
            label="davon ohne Krankengeld-Anspruch"
            hint="Z. 29 · voll absetzbar"
            value={form.z29_ausl_kv_ohne_kg}
            onChange={(v) => set("z29_ausl_kv_ohne_kg", v)}
          />
          <BmfInputRow
            kz="335"
            label="Beiträge zur ausl. sozialen Pflegeversicherung"
            hint="Z. 30"
            value={form.z30_ausl_pv}
            onChange={(v) => set("z30_ausl_pv", v)}
          />
          <BmfInputRow
            kz="336"
            label="Von ausl. KV/PV erstattete Beiträge"
            hint="Z. 31"
            value={form.z31_ausl_erstattet}
            onChange={(v) => set("z31_ausl_erstattet", v)}
          />
          <BmfInputRow
            kz="337"
            label="davon Erstattungen ohne Krankengeld-Anspruch"
            hint="Z. 32"
            value={form.z32_ausl_erst_ohne_kg}
            onChange={(v) => set("z32_ausl_erst_ohne_kg", v)}
          />
          <BmfInputRow
            kz="339"
            label="Über die Basisabsicherung hinausgehende ausl. Beiträge"
            hint="Z. 33"
            value={form.z33_ausl_ueber_basis}
            onChange={(v) => set("z33_ausl_ueber_basis", v)}
          />
        </BmfSection>

        <BmfRow
          kz=""
          label="Summe Basis-KV / Pflege (ungedeckelt absetzbar)"
          value={calc.basisKvPvGesamt}
          subtotal
        />

        {/* ---------- Section 5 ---------- */}
        <BmfSection
          title="5. Steuerfreie AG-Zuschüsse (Info · Z. 34–36)"
          description="Aus Nr. 24 a–c der Lohnsteuerbescheinigung. Diese Zuschüsse sind steuerfrei und mindern nicht den Abzug — nur zur Plausibilitätskontrolle."
        >
          <BmfInputRow
            kz="360"
            label="Zuschuss zur gesetzl. Krankenversicherung (Nr. 24 a)"
            hint="Z. 34"
            value={form.z34_ag_zuschuss_gkv}
            onChange={(v) => set("z34_ag_zuschuss_gkv", v)}
          />
          <BmfInputRow
            kz="361"
            label="Zuschuss zur privaten Krankenversicherung (Nr. 24 b)"
            hint="Z. 35"
            value={form.z35_ag_zuschuss_pkv}
            onChange={(v) => set("z35_ag_zuschuss_pkv", v)}
          />
          <BmfInputRow
            kz="362"
            label="Zuschuss zur gesetzl. Pflegeversicherung (Nr. 24 c)"
            hint="Z. 36"
            value={form.z36_ag_zuschuss_pv}
            onChange={(v) => set("z36_ag_zuschuss_pv", v)}
          />
        </BmfSection>

        {/* ---------- Section 6 ---------- */}
        <BmfSection
          title="6. Versicherungen für andere Personen (Z. 37–42)"
          description="Mitversicherte Personen (z. B. Kind, für das kein Anspruch auf Kindergeld besteht)."
        >
          <RowShell kz="600" zeile="37" label="Identifikationsnummer der mitversicherten Person">
            <input
              type="text"
              value={form.z37_idnr}
              onChange={(e) => set("z37_idnr", e.target.value)}
              placeholder="11 Ziffern"
              maxLength={11}
              style={textInputStyle}
            />
          </RowShell>
          <RowShell kz="" zeile="38" label="Name, Vorname, Geburtsdatum">
            <input
              type="text"
              value={form.z38_person}
              onChange={(e) => set("z38_person", e.target.value)}
              placeholder="Nachname, Vorname, TT.MM.JJJJ"
              style={textInputStyle}
            />
          </RowShell>
          <BmfInputRow
            kz="601"
            label="Beiträge zu privater KV (nur Basisabsicherung)"
            hint="Z. 39"
            value={form.z39_pkv_mit_basis}
            onChange={(v) => set("z39_pkv_mit_basis", v)}
          />
          <BmfInputRow
            kz="602"
            label="Beiträge zur Pflege-Pflichtversicherung"
            hint="Z. 40"
            value={form.z40_pkv_mit_pv}
            onChange={(v) => set("z40_pkv_mit_pv", v)}
          />
          <BmfInputRow
            kz="603"
            label="Von der PKV/PV erstattete Beiträge"
            hint="Z. 41 · wird abgezogen"
            value={form.z41_pkv_mit_erstattet}
            onChange={(v) => set("z41_pkv_mit_erstattet", v)}
          />
          <BmfInputRow
            kz="604"
            label="Beiträge über die Basisabsicherung hinaus"
            hint="Z. 42"
            value={form.z42_pkv_mit_ueber}
            onChange={(v) => set("z42_pkv_mit_ueber", v)}
          />
        </BmfSection>

        {/* ---------- Section 7 ---------- */}
        <BmfSection
          title="7. Weitere Vorsorgeaufwendungen (Z. 43–48)"
          description={`Gedeckelt auf ${euro.format(calc.sonstigeMax)}${form.zusammenveranlagung ? " (Zusammenveranlagung)" : ""}. Günstigerprüfung: abziehbar ist der höhere Betrag aus Basis-KV/PV und gedeckelter Sonstige-Summe (§ 10 Abs. 4 Satz 4 EStG).`}
          total={calc.sonstigeBrutto}
        >
          <BmfInputRow
            kz="370"
            label="Arbeitnehmerbeiträge zur Arbeitslosenversicherung"
            hint="Z. 43 · Nr. 27 LStB"
            value={form.z43_av_an}
            onChange={(v) => set("z43_av_an", v)}
          />
          <BmfInputRow
            kz="500"
            label="Private Versicherungen gegen Arbeitslosigkeit"
            hint="Z. 44"
            value={form.z44_av_privat}
            onChange={(v) => set("z44_av_privat", v)}
          />
          <BmfInputRow
            kz="501"
            label="Freiwillige Erwerbs- / Berufsunfähigkeitsversicherungen"
            hint="Z. 45"
            value={form.z45_bu}
            onChange={(v) => set("z45_bu", v)}
          />
          <BmfInputRow
            kz="502"
            label="Unfall-, Haftpflicht- und Risikoversicherungen"
            hint="Z. 46"
            value={form.z46_unfall_haftpflicht}
            onChange={(v) => set("z46_unfall_haftpflicht", v)}
          />
          <BmfInputRow
            kz="503"
            label="Rentenversicherungen MIT Kapitalwahlrecht vor 1.1.2005"
            hint="Z. 47 · nur zu 88 % ansetzbar"
            value={form.z47_lv_alt_kapital}
            onChange={(v) => set("z47_lv_alt_kapital", v)}
          />
          <BmfInputRow
            kz="504"
            label="Rentenversicherungen OHNE Kapitalwahlrecht vor 1.1.2005"
            hint="Z. 48"
            value={form.z48_lv_alt_ohne_kapital}
            onChange={(v) => set("z48_lv_alt_ohne_kapital", v)}
          />
          <BmfRow
            kz=""
            label={`Gedeckelt auf Höchstbetrag (${euro.format(calc.sonstigeMax)})`}
            value={calc.sonstigeMitCap}
            subtotal
          />
        </BmfSection>

        {/* ---------- Section 8 ---------- */}
        <BmfSection
          title="8. Ergänzende Angaben (Z. 49–55)"
          description="Rentenversicherungspflicht und weitere Statusangaben."
        >
          <CheckboxRow
            kz="307"
            zeile="49"
            label="Anspruch auf steuerfreie Zuschüsse zur KV"
            value={form.z49_steuerfreie_zuschuesse}
            onChange={(v) => set("z49_steuerfreie_zuschuesse", v)}
          />
          <CheckboxRow
            kz="380"
            zeile="50"
            label={`Keine gesetzl. RV-Pflicht ${selectedYear} — als Beamte:r`}
            value={form.z50_beamter}
            onChange={(v) => set("z50_beamter", v)}
          />
          <CheckboxRow
            kz="381"
            zeile="51"
            label="… als Vorstand / GmbH-Gesellschafter-Geschäftsführer:in"
            value={form.z51_vorstand}
            onChange={(v) => set("z51_vorstand", v)}
          />
          <CheckboxRow
            kz="382"
            zeile="52"
            label="… als z. B. Praktikant:in / Student:in im Praktikum"
            value={form.z52_praktikant}
            onChange={(v) => set("z52_praktikant", v)}
          />
          <RowShell kz="" zeile="53" label="Tätigkeitsbezeichnung zu Z. 52">
            <input
              type="text"
              value={form.z53_taetigkeit}
              onChange={(e) => set("z53_taetigkeit", e.target.value)}
              placeholder="z. B. Werkstudent Softwareentwicklung"
              style={textInputStyle}
            />
          </RowShell>
          <CheckboxRow
            kz="383"
            zeile="54"
            label="Dienstverhältnis: Anwartschaft auf Altersversorgung bestand"
            value={form.z54_anwartschaft}
            onChange={(v) => set("z54_anwartschaft", v)}
          />
          <CheckboxRow
            kz="385"
            zeile="55"
            label="Arbeitslohn aus nicht aktivem Dienstverhältnis bezogen"
            value={form.z55_nicht_aktiv}
            onChange={(v) => set("z55_nicht_aktiv", v)}
          />
        </BmfSection>

        <BmfResult
          label="Sonderausgabenabzug gesamt (Basis + Günstigerprüfung)"
          value={calc.gesamtAbzug}
          variant={calc.gesamtAbzug > 0 ? "gewinn" : "primary"}
        />

        <BmfSignatures
          left="Datum, Ort"
          right="Unterschrift Steuerpflichtige:r"
        />

        <BmfFootnotes>
          <p>
            <strong>Simplifizierte Berechnung:</strong> Die Basisvorsorge-
            Deckelung (§ 10 Abs. 3) und die Günstigerprüfung Basis-KV/PV vs.
            gedeckelte Sonstige (§ 10 Abs. 4 Satz 4) sind umgesetzt. Der
            4 %-Abzug für Beiträge mit Krankengeld-Anspruch wird
            pauschal auf Z. 11/Z. 12 und Z. 16/Z. 17 sowie Z. 28/Z. 29
            angewendet.
          </p>
          <p>
            <strong>NICHT automatisch berücksichtigt:</strong> die Günstiger-
            prüfung Altregelung nach § 10 Abs. 4a EStG, die exakte
            Behandlung ausländischer Versicherungen nach DBA, sowie die
            Prüfung der Angemessenheit der Basisabsicherung (z. B.
            Komfortleistungen in GKV-Wahltarifen). Bei zweifelhaften Fällen
            ELSTER oder Steuerberatung einbeziehen.
          </p>
          <p>
            <strong>Kennziffern (Kz) und Zeilen-Nr. (Z.)</strong>{" "}
            entsprechen dem offiziellen Anlage Vorsorgeaufwand 2025. Bei
            Zusammenveranlagung gelten die jeweils um 100 erhöhten
            Partner-Kennziffern (z. B. Kz 400 statt 300).
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

// --- Reusable row helpers (inline; duplicated from AnlageMobilität) ----
// If more pages need these, hoist into components/BmfForm.tsx.

const textInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #dee2ea",
  font: "inherit",
  padding: "1px 4px",
  outline: "none",
  width: "100%",
  textAlign: "right",
};

function RowShell({
  kz,
  zeile,
  label,
  children,
}: {
  kz: string;
  zeile: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bmf-form__row">
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
      <div className="bmf-form__amount" style={{ minWidth: 0 }}>
        {children}
      </div>
    </div>
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
    <RowShell kz={kz} zeile={zeile} label={label}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </RowShell>
  );
}
