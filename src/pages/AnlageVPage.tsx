import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { exportTableToPdf, type TableRow } from "../utils/exporters";
import FormMetaBadge from "../components/FormMetaBadge";
import { useMandant } from "../contexts/MandantContext";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import {
  readEstForm,
  writeEstForm,
  migrateEstFormsV2ToV3,
} from "../domain/est/estStorage";
import "./ReportView.css";
import "./TaxCalc.css";
import "../components/TaxFormBuilder.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type Objekt = {
  id: string;
  bezeichnung: string;
  anschrift: string;
  mieteinnahmen: number;
  umlagenRichtig: number; // Umlagen (vereinnahmt)
  sonstige_einnahmen: number;
  schuldzinsen: number;
  grundsteuer: number;
  nebenkosten: number;
  reparaturen: number;
  verwaltung: number;
  afa: number; // Abschreibungen
  sonstige_wk: number;
};

const EMPTY: Objekt = {
  id: "",
  bezeichnung: "",
  anschrift: "",
  mieteinnahmen: 0,
  umlagenRichtig: 0,
  sonstige_einnahmen: 0,
  schuldzinsen: 0,
  grundsteuer: 0,
  nebenkosten: 0,
  reparaturen: 0,
  verwaltung: 0,
  afa: 0,
  sonstige_wk: 0,
};

const FORM_ID = "anlage-v";

function loadForm(mandantId: string | null, jahr: number): Objekt[] {
  const parsed = readEstForm<Objekt[]>(FORM_ID, mandantId, jahr);
  if (!parsed) return [];
  return parsed;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function einnahmenOf(o: Objekt): number {
  return o.mieteinnahmen + o.umlagenRichtig + o.sonstige_einnahmen;
}

function werbungskostenOf(o: Objekt): number {
  return (
    o.schuldzinsen +
    o.grundsteuer +
    o.nebenkosten +
    o.reparaturen +
    o.verwaltung +
    o.afa +
    o.sonstige_wk
  );
}

export default function AnlageVPage() {
  return (
    <MandantRequiredGuard>
      <AnlageVPageInner />
    </MandantRequiredGuard>
  );
}

function AnlageVPageInner() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { selectedYear } = useYear();
  const [objekte, setObjekte] = useState<Objekt[]>(() =>
    loadForm(selectedMandantId, selectedYear)
  );

  useEffect(() => {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, objekte);
  }, [selectedMandantId, selectedYear, objekte]);

  const totals = useMemo(() => {
    const einnahmen = objekte.reduce((s, o) => s + einnahmenOf(o), 0);
    const wk = objekte.reduce((s, o) => s + werbungskostenOf(o), 0);
    return { einnahmen, wk, einkuenfte: einnahmen - wk };
  }, [objekte]);

  function addObjekt() {
    setObjekte((os) => [...os, { ...EMPTY, id: newId() }]);
  }

  function removeObjekt(id: string) {
    if (!confirm("Dieses Objekt wirklich entfernen?")) return;
    setObjekte((os) => os.filter((o) => o.id !== id));
  }

  function update<K extends keyof Objekt>(id: string, key: K, value: Objekt[K]) {
    setObjekte((os) =>
      os.map((o) => (o.id === id ? { ...o, [key]: value } : o))
    );
  }

  function save() {
    migrateEstFormsV2ToV3(FORM_ID, selectedMandantId, selectedYear);
    writeEstForm(FORM_ID, selectedMandantId, selectedYear, objekte);
    toast.success("Anlage V gespeichert.");
  }

  async function handlePdf() {
    const rows: TableRow[] = [];
    objekte.forEach((o, i) => {
      rows.push([`— Objekt ${i + 1}: ${o.bezeichnung || "unbenannt"} —`, "", ""]);
      rows.push(["", "Mieteinnahmen", o.mieteinnahmen]);
      rows.push(["", "Vereinnahmte Umlagen", o.umlagenRichtig]);
      rows.push(["", "Sonstige Einnahmen", o.sonstige_einnahmen]);
      rows.push(["", "Summe Einnahmen", einnahmenOf(o)]);
      rows.push(["", "Schuldzinsen", -o.schuldzinsen]);
      rows.push(["", "Grundsteuer", -o.grundsteuer]);
      rows.push(["", "Nebenkosten", -o.nebenkosten]);
      rows.push(["", "Reparaturen", -o.reparaturen]);
      rows.push(["", "Verwaltung", -o.verwaltung]);
      rows.push(["", "Abschreibungen (AfA)", -o.afa]);
      rows.push(["", "Sonstige Werbungskosten", -o.sonstige_wk]);
      rows.push(["", "Summe Werbungskosten", -werbungskostenOf(o)]);
      rows.push([
        "",
        "Einkünfte aus V & V",
        einnahmenOf(o) - werbungskostenOf(o),
      ]);
    });
    try {
      await exportTableToPdf(
        {
          title: "Anlage V — Einkünfte aus Vermietung und Verpachtung",
          subtitle: `${settings.kanzleiName} · ${new Date().toLocaleDateString("de-DE")}`,
          columns: [
            { header: "", width: 6 },
            { header: "Position", width: 46 },
            { header: "Betrag", width: 18, alignRight: true },
          ],
          rows,
          footer: ["Summe Einkünfte aus V & V", "", totals.einkuenfte] as TableRow,
        },
        `anlage_v_${new Date().toISOString().slice(0, 10)}.pdf`
      );
      toast.success("PDF exportiert.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  return (
    <div className="report taxform">
      <header className="report__head no-print">
        <div className="report__head-title">
          <h1>Anlage V — Einkünfte aus Vermietung und Verpachtung</h1>
          <p>
            § 21 EStG — Eingaben je vermietetem Objekt. Entwürfe werden im
            Browser gespeichert.
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
          <button type="button" className="btn btn-outline" onClick={handlePdf}>
            <FileText size={16} />
            PDF
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            <Save size={16} />
            Entwurf speichern
          </button>
        </div>
      </header>

      <div className="print-header">
        <span className="print-header__brand">{settings.kanzleiName}</span>
        <span className="print-header__meta">Anlage V</span>
      </div>

      <FormMetaBadge formId="anlage-v" />

      {objekte.length === 0 ? (
        <div className="card taxform__section" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>
            Noch keine Mietobjekte erfasst.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={addObjekt}
            style={{ alignSelf: "center", margin: "0 auto" }}
          >
            <Plus size={16} />
            Objekt hinzufügen
          </button>
        </div>
      ) : (
        <>
          {objekte.map((o, i) => (
            <section className="card taxform__section" key={o.id}>
              <header>
                <div>
                  <h2>
                    Objekt {i + 1}: {o.bezeichnung || "unbenannt"}
                  </h2>
                  {o.anschrift && <p>{o.anschrift}</p>}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => removeObjekt(o.id)}
                  aria-label="Objekt entfernen"
                >
                  <Trash2 size={16} />
                </button>
              </header>
              <div className="form-grid">
                <label className="form-field form-field--wide">
                  <span>Bezeichnung</span>
                  <input
                    value={o.bezeichnung}
                    onChange={(e) => update(o.id, "bezeichnung", e.target.value)}
                    placeholder="z. B. ETW Berlin Charlottenburg"
                  />
                </label>
                <label className="form-field form-field--wide">
                  <span>Anschrift</span>
                  <input
                    value={o.anschrift}
                    onChange={(e) => update(o.id, "anschrift", e.target.value)}
                    placeholder="Straße, PLZ Ort"
                  />
                </label>

                <NumField label="Mieteinnahmen (kalt)" value={o.mieteinnahmen} onChange={(v) => update(o.id, "mieteinnahmen", v)} />
                <NumField label="Vereinnahmte Umlagen" value={o.umlagenRichtig} onChange={(v) => update(o.id, "umlagenRichtig", v)} />
                <NumField label="Sonstige Einnahmen" value={o.sonstige_einnahmen} onChange={(v) => update(o.id, "sonstige_einnahmen", v)} />

                <NumField label="Schuldzinsen" value={o.schuldzinsen} onChange={(v) => update(o.id, "schuldzinsen", v)} />
                <NumField label="Grundsteuer" value={o.grundsteuer} onChange={(v) => update(o.id, "grundsteuer", v)} />
                <NumField label="Nebenkosten (nicht umgelegt)" value={o.nebenkosten} onChange={(v) => update(o.id, "nebenkosten", v)} />
                <NumField label="Reparaturen / Instandhaltung" value={o.reparaturen} onChange={(v) => update(o.id, "reparaturen", v)} />
                <NumField label="Verwaltung" value={o.verwaltung} onChange={(v) => update(o.id, "verwaltung", v)} />
                <NumField label="Abschreibungen (AfA)" value={o.afa} onChange={(v) => update(o.id, "afa", v)} />
                <NumField label="Sonstige Werbungskosten" value={o.sonstige_wk} onChange={(v) => update(o.id, "sonstige_wk", v)} />
              </div>

              <dl className="anlage-v__totals">
                <div>
                  <dt>Einnahmen</dt>
                  <dd className="mono">+ {euro.format(einnahmenOf(o))}</dd>
                </div>
                <div>
                  <dt>Werbungskosten</dt>
                  <dd className="mono">− {euro.format(werbungskostenOf(o))}</dd>
                </div>
                <div className="is-total">
                  <dt>Einkünfte aus V &amp; V</dt>
                  <dd className="mono">
                    {euro.format(einnahmenOf(o) - werbungskostenOf(o))}
                  </dd>
                </div>
              </dl>
            </section>
          ))}

          <button
            type="button"
            className="btn btn-outline"
            onClick={addObjekt}
            style={{ alignSelf: "flex-start" }}
          >
            <Plus size={16} />
            Weiteres Objekt hinzufügen
          </button>

          <div className="report__result">
            <span>Summe Einkünfte aus Vermietung und Verpachtung</span>
            <strong>{euro.format(totals.einkuenfte)}</strong>
          </div>
        </>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
