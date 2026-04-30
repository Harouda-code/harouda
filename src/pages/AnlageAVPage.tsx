import { useEffect, useState, type ReactNode } from "react";
import { Info, Plus, Printer, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../components/ui/Modal";
import {
  addAvVertrag,
  loadAvVertraege,
  removeAvVertrag,
  type AvVertragStammdaten,
  type AvVertragsTyp,
  type NewAvVertragInput,
} from "../domain/est/avVertraegeStore";
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
  BmfSignatures,
  BmfFootnotes,
} from "../components/BmfForm";
import "./ReportView.css";

type JaNein = "ja" | "nein" | "";

type Vertrag = {
  anbieterNr: string;
  zertifizierungsNr: string;
  vertragsNr: string;
};

type PersonData = {
  unmittelbar: JaNein; // Kz 106/306
  mittelbar: JaNein;
  // Berechnungsgrundlagen — 2024er Werte (außer Z. 11 = 2023)
  z5_beitragsEinnahmen: number; // Kz 100/300
  z6_besoldung: number; // Kz 101/301
  z7_entgeltersatz: number; // Kz 104/304
  z8_tatsaechlichesEntgelt: number; // Kz 102/302
  z9_renteErwerbsminderung: number; // Kz 109/309
  z10_versorgungsbezuege_du: number; // Kz 113/313
  z11_landwirt: number; // Kz 103/303 (2023!)
  z12_renteAlterssichLandw: number; // Kz 111/311
  z13_auslRv: number; // Kz 114/314
  z15_mitgliedsNr: string; // Kz 112/312

  // Opt-out aus Sonderausgabenabzug
  optout: JaNein; // Kz 200/400
  optout_v1: Vertrag;
  optout_v2: Vertrag;

  // Widerruf des Verzichts
  widerruf: JaNein; // Kz 204/404
  widerruf_v: Vertrag;
};

const EMPTY_VERTRAG: Vertrag = {
  anbieterNr: "",
  zertifizierungsNr: "",
  vertragsNr: "",
};

const EMPTY_PERSON: PersonData = {
  unmittelbar: "",
  mittelbar: "",
  z5_beitragsEinnahmen: 0,
  z6_besoldung: 0,
  z7_entgeltersatz: 0,
  z8_tatsaechlichesEntgelt: 0,
  z9_renteErwerbsminderung: 0,
  z10_versorgungsbezuege_du: 0,
  z11_landwirt: 0,
  z12_renteAlterssichLandw: 0,
  z13_auslRv: 0,
  z15_mitgliedsNr: "",
  optout: "",
  optout_v1: EMPTY_VERTRAG,
  optout_v2: EMPTY_VERTRAG,
  widerruf: "",
  widerruf_v: EMPTY_VERTRAG,
};

type AnlageAV = {
  zusammenveranlagung: boolean;
  person_a: PersonData;
  person_b: PersonData;
};

const DEFAULT: AnlageAV = {
  zusammenveranlagung: false,
  person_a: EMPTY_PERSON,
  person_b: EMPTY_PERSON,
};

const FORM_ID = "anlage-av";

function mergeVertrag(v: Partial<Vertrag> | undefined): Vertrag {
  return { ...EMPTY_VERTRAG, ...(v ?? {}) };
}

function mergePerson(p: Partial<PersonData> | undefined): PersonData {
  return {
    ...EMPTY_PERSON,
    ...(p ?? {}),
    optout_v1: mergeVertrag(p?.optout_v1),
    optout_v2: mergeVertrag(p?.optout_v2),
    widerruf_v: mergeVertrag(p?.widerruf_v),
  };
}

function loadForm(mandantId: string | null, jahr: number): AnlageAV {
  const parsed = readEstForm<Partial<AnlageAV>>(FORM_ID, mandantId, jahr);
  if (!parsed) return DEFAULT;
  return {
    ...DEFAULT,
    ...parsed,
    person_a: mergePerson(parsed.person_a),
    person_b: mergePerson(parsed.person_b),
  };
}

// Kz sets per Person
type KzSet = {
  z4: string; // begünstigt-Kz
  z5: string;
  z6: string;
  z7: string;
  z8: string;
  z9: string;
  z10: string;
  z11: string;
  z12: string;
  z13: string;
  z15: string;
  optout: string;
  widerruf: string;
};

const KZ_A: KzSet = {
  z4: "106",
  z5: "100",
  z6: "101",
  z7: "104",
  z8: "102",
  z9: "109",
  z10: "113",
  z11: "103",
  z12: "111",
  z13: "114",
  z15: "112",
  optout: "200",
  widerruf: "204",
};

const VERTRAGSTYP_LABEL: Record<AvVertragsTyp, string> = {
  riester: "Riester",
  ruerup: "Rürup",
  "sonstige-av": "Sonstige AV",
};

const KZ_B: KzSet = {
  z4: "306",
  z5: "300",
  z6: "301",
  z7: "304",
  z8: "302",
  z9: "309",
  z10: "313",
  z11: "303",
  z12: "311",
  z13: "314",
  z15: "312",
  optout: "400",
  widerruf: "404",
};

// ---------- Main page --------------------------------------------------

export default function AnlageAVPage() {
  return (
    <MandantRequiredGuard>
      <AnlageAVPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageAVPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();

  const [form, setForm] = useState<AnlageAV>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  // Nacht-Modus (2026-04-21) · Schritt 1: Stammdaten-Store (jahr-
  // unabhaengig). Koexistiert mit den inline-Vertragsnummern in
  // PersonData (BMF-Kz-gebunden) — die Liste hier ist die "persönliche
  // Vertrags-Akte" des Mandanten über Jahre.
  const [stammdaten, setStammdaten] = useState<AvVertragStammdaten[]>(() =>
    selectedMandantId ? loadAvVertraege(selectedMandantId) : []
  );
  const [addOpen, setAddOpen] = useState(false);
  const [newVertrag, setNewVertrag] = useState<NewAvVertragInput>({
    anbieter: "",
    vertragsnummer: "",
    vertragstyp: "riester",
    ehepartner_referenz: false,
  });

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
  }, [selectedMandantId, selectedYear, form]);

  function handleAddVertrag() {
    if (!selectedMandantId) return;
    if (!newVertrag.anbieter.trim() || !newVertrag.vertragsnummer.trim()) {
      toast.error("Anbieter und Vertragsnummer sind Pflicht.");
      return;
    }
    const neu = addAvVertrag(selectedMandantId, newVertrag);
    setStammdaten((prev) => [...prev, neu]);
    setNewVertrag({
      anbieter: "",
      vertragsnummer: "",
      vertragstyp: "riester",
      ehepartner_referenz: false,
    });
    setAddOpen(false);
    toast.success("Vertrag hinzugefügt.");
  }

  function handleRemoveVertrag(id: string) {
    if (!selectedMandantId) return;
    if (!confirm("Vertrag wirklich aus der Stammdaten-Liste entfernen?")) return;
    removeAvVertrag(selectedMandantId, id);
    setStammdaten((prev) => prev.filter((v) => v.id !== id));
  }

  function updatePerson(
    which: "person_a" | "person_b",
    updater: (p: PersonData) => PersonData
  ) {
    setForm((f) => ({ ...f, [which]: updater(f[which]) }));
  }

  function setZus(v: boolean) {
    setForm((f) => ({ ...f, zusammenveranlagung: v }));
  }

  function validate(): string[] {
    const warns: string[] = [];
    if (
      form.person_a.unmittelbar === "ja" &&
      form.person_a.mittelbar === "ja"
    ) {
      warns.push(
        "Person A: unmittelbar UND mittelbar begünstigt nicht möglich — bitte nur eine Option wählen."
      );
    }
    if (
      form.zusammenveranlagung &&
      form.person_b.unmittelbar === "ja" &&
      form.person_b.mittelbar === "ja"
    ) {
      warns.push(
        "Person B: unmittelbar UND mittelbar begünstigt nicht möglich."
      );
    }
    // Mittelbar nur wenn der andere Ehegatte unmittelbar ist
    if (
      form.person_a.mittelbar === "ja" &&
      (!form.zusammenveranlagung || form.person_b.unmittelbar !== "ja")
    ) {
      warns.push(
        "Person A mittelbar begünstigt setzt voraus, dass Person B unmittelbar begünstigt ist (§ 79 Satz 2 EStG)."
      );
    }
    if (
      form.zusammenveranlagung &&
      form.person_b.mittelbar === "ja" &&
      form.person_a.unmittelbar !== "ja"
    ) {
      warns.push(
        "Person B mittelbar begünstigt setzt voraus, dass Person A unmittelbar begünstigt ist."
      );
    }
    return warns;
  }

  function save() {
    const warns = validate();
    if (warns.length > 0) toast.warning(warns.join(" · "), { duration: 8000 });
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, form);
    const meta = FORM_META["anlage-av"];
    void auditLog({
      action: "update",
      entity: "settings",
      entity_id: "anlage-av",
      summary: `Anlage AV gespeichert (FormVersion ${meta.version}, VZ ${selectedYear}, Parameter ${STEUERPARAMETER_VERSION})`,
      after: {
        formId: "anlage-av",
        formVersion: meta.version,
        veranlagungsjahr: selectedYear,
        steuerparameterVersion: STEUERPARAMETER_VERSION,
        form,
      },
    });
    toast.success("Anlage AV gespeichert.");
  }

  return (
    <div className="report anlage">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage AV</h1>
          <p>
            Altersvorsorgebeiträge (Riester-Verträge) · Zusätzlicher
            Sonderausgabenabzug nach § 10a EStG · VZ {selectedYear}.
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
          Anlage AV · VZ {selectedYear}
        </span>
      </div>

      <FormMetaBadge formId="anlage-av" />

      <section className="card taxcalc__section no-print">
        <h2>Optionen</h2>
        <label className="form-field kontenplan__toggle--form">
          <input
            type="checkbox"
            checked={form.zusammenveranlagung}
            onChange={(e) => setZus(e.target.checked)}
          />
          <span>Zusammenveranlagung — Person B einblenden</span>
        </label>
      </section>

      <section
        className="card no-print"
        data-testid="av-stammdaten-section"
        style={{ padding: "10px 14px", marginBottom: 12 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem" }}>
            AV-Vertraege (Stammdaten)
          </h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setAddOpen(true)}
            data-testid="av-add-open"
          >
            <Plus size={14} /> Vertrag hinzufügen
          </button>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0 0 8px" }}>
          Jahr-unabhängige Liste. Beiträge werden weiter unten im Formular
          pro Person (Kz-basiert) erfasst.
        </p>
        {stammdaten.length === 0 ? (
          <p
            data-testid="av-stammdaten-empty"
            style={{ fontStyle: "italic", color: "var(--muted)" }}
          >
            Keine Verträge erfasst. Klicken Sie auf „Vertrag hinzufügen".
          </p>
        ) : (
          <ul
            data-testid="av-stammdaten-list"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {stammdaten.map((v) => (
              <li
                key={v.id}
                data-testid={`av-vertrag-${v.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  borderBottom: "1px solid var(--border-soft, #eef1f6)",
                  fontSize: "0.85rem",
                }}
              >
                <span>
                  <strong>{v.anbieter}</strong> · {v.vertragsnummer} ·{" "}
                  <em>{VERTRAGSTYP_LABEL[v.vertragstyp]}</em>
                  {v.ehepartner_referenz && (
                    <span style={{ color: "var(--muted)" }}> · Ehepartner</span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleRemoveVertrag(v.id)}
                  aria-label="Vertrag entfernen"
                  data-testid={`av-remove-${v.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Vertrag hinzufügen"
        description="Stammdaten eines AV-Vertrags (Riester / Rürup / sonstige). Betragswerte werden im Formular unten pro Jahr erfasst."
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setAddOpen(false)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddVertrag}
              data-testid="av-add-submit"
            >
              Hinzufügen
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            <span style={{ fontSize: "0.78rem" }}>Anbieter *</span>
            <input
              value={newVertrag.anbieter}
              onChange={(e) =>
                setNewVertrag((v) => ({ ...v, anbieter: e.target.value }))
              }
              placeholder="z. B. Allianz Lebensversicherung AG"
              data-testid="av-input-anbieter"
            />
          </label>
          <label>
            <span style={{ fontSize: "0.78rem" }}>Vertragsnummer *</span>
            <input
              value={newVertrag.vertragsnummer}
              onChange={(e) =>
                setNewVertrag((v) => ({
                  ...v,
                  vertragsnummer: e.target.value,
                }))
              }
              placeholder="wie in der Bescheinigung"
              data-testid="av-input-nummer"
            />
          </label>
          <label>
            <span style={{ fontSize: "0.78rem" }}>Vertragstyp</span>
            <select
              value={newVertrag.vertragstyp}
              onChange={(e) =>
                setNewVertrag((v) => ({
                  ...v,
                  vertragstyp: e.target.value as AvVertragsTyp,
                }))
              }
              data-testid="av-input-typ"
            >
              <option value="riester">Riester-Rente (§ 10a EStG)</option>
              <option value="ruerup">Rürup/Basisrente (§ 10 Abs. 1 Nr. 2b)</option>
              <option value="sonstige-av">Sonstige Altersvorsorge</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={newVertrag.ehepartner_referenz}
              onChange={(e) =>
                setNewVertrag((v) => ({
                  ...v,
                  ehepartner_referenz: e.target.checked,
                }))
              }
              data-testid="av-input-ehepartner"
            />
            <span style={{ fontSize: "0.85rem" }}>
              Vertrag gehört zum Ehepartner (Zusammenveranlagung)
            </span>
          </label>
        </div>
      </Modal>

      <aside
        className="ustva__disclaimer ustva__disclaimer--info no-print"
        style={{ marginBottom: 10 }}
      >
        <Info size={16} />
        <div>
          <strong>Anbieter-Datentransfer:</strong> Die tatsächlich geleisteten
          Altersvorsorgebeiträge meldet der Vertragsanbieter direkt an die
          Zentrale Zulagenstelle (ZfA). Diese Anlage dient nur zur Prüfung,
          ob der zusätzliche Sonderausgabenabzug nach § 10a EStG günstiger
          ist als die Zulage (Günstigerprüfung durch das Finanzamt).
          <br />
          <strong>Unmittelbar begünstigt:</strong> gesetzl. rentenversicherte
          AN, Beamte, Mandatsträger. <strong>Mittelbar:</strong> Ehegatte
          eines unmittelbar Begünstigten (Mindestbeitrag 60 € p.a.).
        </div>
      </aside>

      <BmfForm
        title="Anlage AV"
        subtitle={`Riester · VZ ${selectedYear}`}
      >
        <PersonBlock
          title="Person A / Ehemann"
          person={form.person_a}
          kz={KZ_A}
          onUpdate={(u) => updatePerson("person_a", u)}
        />

        {form.zusammenveranlagung && (
          <PersonBlock
            title="Person B / Ehefrau / Lebenspartner:in"
            person={form.person_b}
            kz={KZ_B}
            onUpdate={(u) => updatePerson("person_b", u)}
          />
        )}

        <BmfSignatures left="Datum, Ort" right="Unterschrift(en)" />

        <BmfFootnotes>
          <p>
            <strong>Kinderzulage:</strong> Für jedes zulageberechtigte Kind
            wird die Kinderzulage gesondert auf Anlage Kind Z. 26 erfasst
            (nicht hier).
          </p>
          <p>
            <strong>Günstigerprüfung:</strong> Das Finanzamt vergleicht den
            Steuervorteil aus dem Sonderausgabenabzug mit dem Anspruch auf
            Zulage und gewährt den höheren Betrag (§ 10a Abs. 2 EStG).
            Diese Seite berechnet die Prüfung NICHT.
          </p>
          <p>
            <strong>Opt-out (Z. 16–25):</strong> Nur ausfüllen, wenn Sie für
            bestimmte Verträge ausdrücklich KEINEN zusätzlichen
            Sonderausgabenabzug möchten (z. B. um Zulage+Auszahlung ohne
            Steuerpflicht zu optimieren).
          </p>
          <p>
            <strong>Widerruf des Verzichts (Z. 26–31):</strong> Wirkt nur für
            das aktuelle und zukünftige Beitragsjahre — nicht rückwirkend.
          </p>
          <p>
            <strong>NICHT automatisch:</strong> Prüfung der Beitragshöhe
            (4 % beitragspflichtige Einnahmen, max. 2.100 €), Kinderzulage-
            Berechnung (300 €/Kind, 185 € bei vor 2008), Günstigerprüfung
            Zulage vs. Sonderausgabenabzug, Mindestbeitrag mittelbar
            Begünstigte (60 €).
          </p>
          <p>
            <strong>Kennziffern (Kz):</strong> Person A in 100er-Bereich,
            Person B in 300er-Bereich. Opt-out 200/400, Widerruf 204/404.
          </p>
          <p>
            <strong>Nachgebildete Darstellung</strong> nach BMF-Struktur —
            NICHT zur amtlichen Einreichung geeignet. Amtliche Übermittlung
            erfolgt elektronisch über ELSTER; die Riester-Beiträge meldet
            der Anbieter direkt an die ZfA.
          </p>
        </BmfFootnotes>
      </BmfForm>
    </div>
  );
}

// ---------- Person block -----------------------------------------------

type PersonBlockProps = {
  title: string;
  person: PersonData;
  kz: KzSet;
  onUpdate: (updater: (p: PersonData) => PersonData) => void;
};

function PersonBlock({ title, person, kz, onUpdate }: PersonBlockProps) {
  const setF = <K extends keyof PersonData>(k: K, v: PersonData[K]) => {
    onUpdate((p) => ({ ...p, [k]: v }));
  };
  const setVertrag = (
    field: "optout_v1" | "optout_v2" | "widerruf_v",
    key: keyof Vertrag,
    val: string
  ) => {
    onUpdate((p) => ({ ...p, [field]: { ...p[field], [key]: val } }));
  };

  return (
    <>
      <BmfSection
        title={`${title} · 1. Berechnungsgrundlagen (Z. 4–15)`}
        description="Werte 2024 (für VZ 2025) — außer Z. 11 Landwirtschaft = Werte 2023."
      >
        <JaNeinRow
          kz={kz.z4}
          zeile="4"
          label="Ich bin unmittelbar begünstigt (Z. 5–13 ausfüllen)"
          value={person.unmittelbar}
          onChange={(v) => setF("unmittelbar", v)}
        />
        {person.unmittelbar === "ja" && (
          <>
            <BmfInputRow
              kz={kz.z5}
              label="Beitragspflichtige Einnahmen gesetzl. RV 2024"
              hint="Z. 5"
              value={person.z5_beitragsEinnahmen}
              onChange={(v) => setF("z5_beitragsEinnahmen", v)}
            />
            <BmfInputRow
              kz={kz.z6}
              label="Inländ. Besoldung / Amtsbezüge 2024 (nur mit Einwilligung)"
              hint="Z. 6"
              value={person.z6_besoldung}
              onChange={(v) => setF("z6_besoldung", v)}
            />
            <BmfInputRow
              kz={kz.z7}
              label="Entgeltersatzleistungen 2024"
              hint="Z. 7 · ALG I etc."
              value={person.z7_entgeltersatz}
              onChange={(v) => setF("z7_entgeltersatz", v)}
            />
            <BmfInputRow
              kz={kz.z8}
              label="Tatsächliches Entgelt 2024"
              hint="Z. 8"
              value={person.z8_tatsaechlichesEntgelt}
              onChange={(v) => setF("z8_tatsaechlichesEntgelt", v)}
            />
            <BmfInputRow
              kz={kz.z9}
              label="Jahresbrutto Erwerbsminderungsrente gesetzl. RV 2024"
              hint="Z. 9"
              value={person.z9_renteErwerbsminderung}
              onChange={(v) => setF("z9_renteErwerbsminderung", v)}
            />
            <BmfInputRow
              kz={kz.z10}
              label="Versorgungsbezüge wegen Dienstunfähigkeit 2024"
              hint="Z. 10 · nur mit Einwilligung"
              value={person.z10_versorgungsbezuege_du}
              onChange={(v) => setF("z10_versorgungsbezuege_du", v)}
            />
            <BmfInputRow
              kz={kz.z11}
              label="Einkünfte aus Land- und Forstwirtschaft 2023"
              hint="Z. 11 · Vorjahr (Bezugsjahr 2023)"
              value={person.z11_landwirt}
              onChange={(v) => setF("z11_landwirt", v)}
            />
            <BmfInputRow
              kz={kz.z12}
              label="Rente Alterssicherung Landwirte 2024 (Erwerbsmind.)"
              hint="Z. 12"
              value={person.z12_renteAlterssichLandw}
              onChange={(v) => setF("z12_renteAlterssichLandw", v)}
            />
            <BmfInputRow
              kz={kz.z13}
              label="Einnahmen ausländische gesetzl. RV 2024"
              hint="Z. 13"
              value={person.z13_auslRv}
              onChange={(v) => setF("z13_auslRv", v)}
            />
          </>
        )}
        <JaNeinRow
          kz={kz.z4}
          zeile="14"
          label="Ich bin mittelbar begünstigt (Ehegatten/LP)"
          value={person.mittelbar}
          onChange={(v) => setF("mittelbar", v)}
        />
        <TextRow
          kz={kz.z15}
          zeile="15"
          label="Mitgliedsnummer landwirtschaftliche Alterskasse"
          value={person.z15_mitgliedsNr}
          onChange={(v) => setF("z15_mitgliedsNr", v)}
        />
      </BmfSection>

      <BmfSection
        title={`${title} · 2. Verträge ohne zus. Sonderausgabenabzug (Z. 16–25)`}
        description="Nur ausfüllen, wenn für bestimmte Verträge KEIN zusätzlicher Sonderausgabenabzug gewünscht ist."
      >
        <JaNeinRow
          kz={kz.optout}
          zeile="16"
          label="Ich möchte für nachfolgende Verträge KEINEN zusätzlichen Sonderausgabenabzug"
          value={person.optout}
          onChange={(v) => setF("optout", v)}
        />
        {person.optout === "ja" && (
          <>
            <VertragBlock
              title="1. Vertrag"
              zeilen={{ anbieter: "17", vertrag: "18" }}
              vertrag={person.optout_v1}
              onChange={(k, v) => setVertrag("optout_v1", k, v)}
            />
            <VertragBlock
              title="2. Vertrag"
              zeilen={{ anbieter: "19", vertrag: "20" }}
              vertrag={person.optout_v2}
              onChange={(k, v) => setVertrag("optout_v2", k, v)}
            />
          </>
        )}
      </BmfSection>

      <BmfSection
        title={`${title} · 3. Widerruf Verzicht auf Sonderausgabenabzug (Z. 26–31)`}
        description="Wirkt ab aktuellem Beitragsjahr für die Zukunft — nicht rückwirkend."
      >
        <JaNeinRow
          kz={kz.widerruf}
          zeile={title.includes("A") ? "26" : "29"}
          label="Ich widerrufe den bisherigen Verzicht auf Sonderausgabenabzug"
          value={person.widerruf}
          onChange={(v) => setF("widerruf", v)}
        />
        {person.widerruf === "ja" && (
          <VertragBlock
            title="Betroffener Vertrag"
            zeilen={{
              anbieter: title.includes("A") ? "27" : "30",
              vertrag: title.includes("A") ? "28" : "31",
            }}
            vertrag={person.widerruf_v}
            onChange={(k, v) => setVertrag("widerruf_v", k, v)}
          />
        )}
      </BmfSection>
    </>
  );
}

// ---------- Vertrag block ----------------------------------------------

function VertragBlock({
  title,
  zeilen,
  vertrag,
  onChange,
}: {
  title: string;
  zeilen: { anbieter: string; vertrag: string };
  vertrag: Vertrag;
  onChange: (key: keyof Vertrag, value: string) => void;
}) {
  return (
    <>
      <div className="bmf-form__row" style={{ background: "#f7f9fc" }}>
        <div className="bmf-form__kz-cell bmf-form__kz-cell--empty"></div>
        <div
          className="bmf-form__label"
          style={{ fontWeight: 600, color: "#15233d" }}
        >
          {title}
        </div>
        <div className="bmf-form__amount">—</div>
      </div>
      <WideRow
        kz=""
        zeile={zeilen.anbieter}
        label="Anbieternummer · Zertifizierungsnummer"
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
            type="text"
            value={vertrag.anbieterNr}
            onChange={(e) => onChange("anbieterNr", e.target.value)}
            placeholder="Anbieter-Nr."
            style={textInputStyle}
          />
          <input
            type="text"
            value={vertrag.zertifizierungsNr}
            onChange={(e) => onChange("zertifizierungsNr", e.target.value)}
            placeholder="Zertifizierungs-Nr."
            style={textInputStyle}
          />
        </div>
      </WideRow>
      <WideRow kz="" zeile={zeilen.vertrag} label="Vertragsnummer" wide={260}>
        <input
          type="text"
          value={vertrag.vertragsNr}
          onChange={(e) => onChange("vertragsNr", e.target.value)}
          style={textInputStyle}
        />
      </WideRow>
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
    <WideRow kz={kz} zeile={zeile} label={label} wide={240}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={textInputStyle}
      />
    </WideRow>
  );
}
