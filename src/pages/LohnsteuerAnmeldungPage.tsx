import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { LohnabrechnungsEngine } from "../domain/lohn/LohnabrechnungsEngine";
import {
  buildLohnsteuerAnmeldung,
  type LStAZeitraum,
} from "../domain/lohn/LohnsteuerAnmeldungBuilder";
import type {
  Arbeitnehmer,
  Bundesland,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
} from "../domain/lohn/types";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import { buildLstAnmeldungXml } from "../domain/elster/LstAnmeldungXmlBuilder";
import { useSettings } from "../contexts/SettingsContext";
import "./ReportView.css";

function fmt(s: string): string {
  return new Money(s).toEuroFormat();
}

type DemoAn = {
  id: string;
  name: string;
  steuerklasse: Steuerklasse;
  brutto: string;
  kirchensteuer: boolean;
  konfession: "EV" | "RK" | "NONE";
  bundesland: Bundesland;
  minijob: boolean;
};

const LAS = new Map<string, LohnArt>([
  [
    "la-gehalt",
    {
      id: "la-gehalt",
      bezeichnung: "Gehalt",
      typ: "LAUFENDER_BEZUG",
      steuerpflichtig: true,
      svpflichtig: true,
      lst_meldung_feld: "3",
    },
  ],
]);

function toArbeitnehmer(d: DemoAn): Arbeitnehmer {
  return {
    id: d.id,
    mandant_id: "demo",
    personalNr: d.id.slice(0, 6),
    name: d.name,
    vorname: "Demo",
    geburtsdatum: "1990-01-01",
    sv_nummer: "12345678901A",
    steuer_id: "12345678901",
    steuerklasse: d.steuerklasse,
    kinderfreibetraege: 0,
    kirchensteuerpflichtig: d.kirchensteuer,
    konfession: d.konfession,
    bundesland: d.bundesland,
    kv_pflicht: !d.minijob,
    kv_beitragsart: "GESETZLICH",
    kv_zusatzbeitrag: "2.5",
    rv_pflicht: !d.minijob,
    av_pflicht: !d.minijob,
    pv_pflicht: !d.minijob,
    pv_kinderlos_zuschlag: true,
    pv_anzahl_kinder: 0,
    beschaeftigungsart: d.minijob ? "MINIJOB" : "VOLLZEIT",
    betriebsnummer: "12345678",
    eintrittsdatum: "2020-01-01",
  };
}

export default function LohnsteuerAnmeldungPage() {
  const { settings } = useSettings();
  const [zeitraum, setZeitraum] = useState<LStAZeitraum>("MONAT");
  const [monat, setMonat] = useState<number>(new Date().getMonth() + 1);
  const [quartal, setQuartal] = useState<1 | 2 | 3 | 4>(1);
  const [jahr, setJahr] = useState<number>(new Date().getFullYear());
  const [betriebsnummer, setBetriebsnummer] = useState("12345678");

  const [demoAns, setDemoAns] = useState<DemoAn[]>([
    {
      id: "an-1",
      name: "Mustermann",
      steuerklasse: 1,
      brutto: "3000",
      kirchensteuer: false,
      konfession: "NONE",
      bundesland: "NW",
      minijob: false,
    },
    {
      id: "an-2",
      name: "Musterfrau",
      steuerklasse: 3,
      brutto: "5000",
      kirchensteuer: true,
      konfession: "EV",
      bundesland: "NW",
      minijob: false,
    },
  ]);

  const report = useMemo(() => {
    const engine = new LohnabrechnungsEngine();
    const arbeitnehmer = demoAns.map(toArbeitnehmer);

    // Berechne Abrechnungen für alle relevanten Monate im Zeitraum
    const monate: string[] = [];
    if (zeitraum === "MONAT") {
      monate.push(`${jahr}-${String(monat).padStart(2, "0")}`);
    } else if (zeitraum === "QUARTAL") {
      const start = (quartal - 1) * 3 + 1;
      for (let i = 0; i < 3; i++) {
        monate.push(`${jahr}-${String(start + i).padStart(2, "0")}`);
      }
    } else {
      for (let m = 1; m <= 12; m++)
        monate.push(`${jahr}-${String(m).padStart(2, "0")}`);
    }

    const abrechnungen = [];
    for (const an of arbeitnehmer) {
      const demo = demoAns.find((d) => d.id === an.id)!;
      for (const m of monate) {
        let bruttoVal: Money;
        try {
          bruttoVal = new Money(demo.brutto.replace(",", "."));
        } catch {
          bruttoVal = Money.zero();
        }
        const buchung: Lohnbuchung = {
          id: `b-${an.id}-${m}`,
          arbeitnehmer_id: an.id,
          abrechnungsmonat: m,
          lohnart_id: "la-gehalt",
          betrag: bruttoVal,
          buchungsdatum: `${m}-15`,
        };
        abrechnungen.push(
          engine.berechneAbrechnung({
            arbeitnehmer: an,
            lohnarten: LAS,
            buchungen: [buchung],
            abrechnungsmonat: m,
          })
        );
      }
    }

    return buildLohnsteuerAnmeldung({
      arbeitnehmer,
      abrechnungen,
      zeitraum,
      monat: zeitraum === "MONAT" ? monat : undefined,
      quartal: zeitraum === "QUARTAL" ? quartal : undefined,
      jahr,
      betriebsnummer,
    });
  }, [demoAns, zeitraum, monat, quartal, jahr, betriebsnummer]);

  function addAn() {
    setDemoAns([
      ...demoAns,
      {
        id: `an-${demoAns.length + 1}`,
        name: "Neu",
        steuerklasse: 1,
        brutto: "2500",
        kirchensteuer: false,
        konfession: "NONE",
        bundesland: "NW",
        minijob: false,
      },
    ]);
  }
  function removeAn(i: number) {
    setDemoAns(demoAns.filter((_, idx) => idx !== i));
  }
  function updateAn(i: number, field: keyof DemoAn, value: string | boolean | number) {
    setDemoAns(
      demoAns.map((a, idx) =>
        idx === i ? { ...a, [field]: value as never } : a
      )
    );
  }

  function handleCsv() {
    const rows = [
      ["Kz", "Bezeichnung", "Wert"],
      ...Object.entries(report.kennzahlen).map(([kz, wert]) => [
        kz,
        kennzahlName(kz),
        wert,
      ]),
      ["SUMME", "Zahllast", report.summeZahllast],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `lsta_${jahr}_${zeitraum === "MONAT" ? String(monat).padStart(2, "0") : zeitraum === "QUARTAL" ? "Q" + quartal : "JAHR"}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("LStA-CSV exportiert.");
  }
  function handleElsterXml() {
    const steuernummer = prompt(
      "Steuernummer (Finanzamt-Format, z. B. 143/456/78901):"
    );
    if (!steuernummer) return;
    const result = buildLstAnmeldungXml(report, { steuernummer });
    const periodSlug =
      zeitraum === "MONAT"
        ? String(monat).padStart(2, "0")
        : zeitraum === "QUARTAL"
        ? "Q" + quartal
        : "JAHR";
    downloadText(
      result.xml,
      `lsta-elster_${jahr}_${periodSlug}.xml`,
      "application/xml;charset=utf-8"
    );
    const warnSuffix = result.warnings.length
      ? ` — Warnungen: ${result.warnings.length}`
      : "";
    toast.success(
      `ELSTER-XML-Preview exportiert (Schema-Stand ${result.schema_version}${warnSuffix}).`
    );
  }

  function handleJson() {
    downloadText(
      JSON.stringify(
        {
          meta: { ...report.metadata, kanzlei: settings.kanzleiName },
          zeitraum: report.zeitraum,
          betriebsnummer: report.betriebsnummer,
          kennzahlen: report.kennzahlen,
          summeZahllast: report.summeZahllast,
          abgabefrist: report.abgabefrist,
        },
        null,
        2
      ),
      `lsta_${jahr}.json`,
      "application/json"
    );
    toast.success("LStA-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/lohn" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Lohn
        </Link>
        <div className="report__head-title">
          <h1>Lohnsteuer-Anmeldung (§ 41a EStG)</h1>
          <p>
            Monats-/Quartals-/Jahresmeldung an das Finanzamt · 14 Kennzahlen
            laut BMF-Formular 2025 · Abgabefrist 10. Folgemonat.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Zeitraum</span>
            <select
              value={zeitraum}
              onChange={(e) => setZeitraum(e.target.value as LStAZeitraum)}
            >
              <option value="MONAT">Monat</option>
              <option value="QUARTAL">Quartal</option>
              <option value="JAHR">Jahr</option>
            </select>
          </label>
          {zeitraum === "MONAT" && (
            <label>
              <span>Monat</span>
              <input
                type="number"
                min={1}
                max={12}
                value={monat}
                onChange={(e) => setMonat(Number(e.target.value))}
              />
            </label>
          )}
          {zeitraum === "QUARTAL" && (
            <label>
              <span>Quartal</span>
              <select
                value={quartal}
                onChange={(e) =>
                  setQuartal(Number(e.target.value) as 1 | 2 | 3 | 4)
                }
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            </label>
          )}
          <label>
            <span>Jahr</span>
            <input
              type="number"
              value={jahr}
              onChange={(e) => setJahr(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Betriebsnummer</span>
            <input
              type="text"
              value={betriebsnummer}
              onChange={(e) => setBetriebsnummer(e.target.value)}
            />
          </label>
          <button className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button
            className="btn btn-outline"
            onClick={handleElsterXml}
            data-testid="btn-lsta-elster-xml"
            title="ELSTER-Schema-XML-Preview — bereit für ELSTER-Upload (nicht für direkte ERiC-Übermittlung)"
          >
            <Download size={16} /> ELSTER-XML
          </button>
          <button className="btn btn-outline" onClick={handleJson}>
            <Download size={16} /> JSON
          </button>
        </div>
      </header>

      <aside
        className="ustva__disclaimer no-print"
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "rgba(210,120,70,0.08)",
          border: "1px solid rgba(210,120,70,0.3)",
          borderLeft: "4px solid #c76b3f",
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          fontSize: "0.88rem",
        }}
      >
        <AlertTriangle size={16} color="#c76b3f" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Demo-Modus.</strong> AN-Stammdaten + Brutto werden unten
          interaktiv erfasst; für produktive Anmeldung AN-Datenbank und
          persistente Lohnabrechnungs-Läufe einbinden. LSt-Aufteilung laufend
          vs. sonstige Bezüge erfolgt approximativ nach Brutto-Verhältnis.
        </div>
      </aside>

      <section
        className="card"
        style={{ padding: 12, marginBottom: 12, background: "#eaf5ef", borderLeft: "4px solid #1f7a4d" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={20} />
          <strong>Abgabefrist: {report.abgabefrist}</strong>
          <span style={{ color: "var(--ink-soft)" }}>
            (§ 41a Abs. 1 EStG, 10. des Folgemonats mit Werktagsverschiebung)
          </span>
        </div>
      </section>

      {/* AN Editor */}
      <section className="card no-print" style={{ padding: 14, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
            Arbeitnehmer ({demoAns.length})
          </h3>
          <button className="btn btn-outline btn-sm" onClick={addAn}>
            <Plus size={14} /> AN hinzufügen
          </button>
        </div>
        <table style={{ width: "100%", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
              <th style={{ textAlign: "left" }}>Name</th>
              <th>StKl</th>
              <th>Brutto</th>
              <th>KiSt</th>
              <th>Konfession</th>
              <th>Land</th>
              <th>Minijob</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {demoAns.map((a, i) => (
              <tr key={a.id}>
                <td>
                  <input value={a.name} onChange={(e) => updateAn(i, "name", e.target.value)} />
                </td>
                <td>
                  <select
                    value={a.steuerklasse}
                    onChange={(e) => updateAn(i, "steuerklasse", Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    value={a.brutto}
                    onChange={(e) => updateAn(i, "brutto", e.target.value)}
                    style={{ width: 90 }}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={a.kirchensteuer}
                    onChange={(e) => updateAn(i, "kirchensteuer", e.target.checked)}
                  />
                </td>
                <td>
                  <select
                    value={a.konfession}
                    onChange={(e) => updateAn(i, "konfession", e.target.value)}
                  >
                    <option value="NONE">—</option>
                    <option value="EV">EV</option>
                    <option value="RK">RK</option>
                  </select>
                </td>
                <td>
                  <input
                    value={a.bundesland}
                    onChange={(e) => updateAn(i, "bundesland", e.target.value)}
                    style={{ width: 50 }}
                    maxLength={2}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={a.minijob}
                    onChange={(e) => updateAn(i, "minijob", e.target.checked)}
                  />
                </td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => removeAn(i)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* LStA Kennzahlen */}
      <section className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>
          LStA-Kennzahlen · {report.zeitraum.bezeichnung}
        </h3>
        <table style={{ width: "100%", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
              <th style={{ textAlign: "left", width: 60 }}>Kz</th>
              <th style={{ textAlign: "left" }}>Bezeichnung</th>
              <th style={{ textAlign: "right", width: 140 }}>Wert</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(report.kennzahlen).map(([kz, wert]) => (
              <tr key={kz} style={{ borderBottom: "1px solid #eef1f6" }}>
                <td
                  style={{
                    padding: "4px 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                    color: "var(--ink-soft)",
                  }}
                >
                  {kz}
                </td>
                <td style={{ padding: "4px 0" }}>{kennzahlName(kz)}</td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {kz === "10" ? wert : fmt(wert)}
                </td>
              </tr>
            ))}
            <tr
              style={{
                borderTop: "3px double #15233d",
                background: "#eef6f0",
                fontWeight: 700,
              }}
            >
              <td style={{ padding: "6px 0" }}>Σ</td>
              <td>Zahllast an Finanzamt</td>
              <td
                style={{
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "#8a2c2c",
                }}
              >
                {fmt(report.summeZahllast)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function kennzahlName(kz: string): string {
  const names: Record<string, string> = {
    "10": "Zahl der Arbeitnehmer",
    "41": "Laufender Arbeitslohn (steuerpflichtig)",
    "42": "Einbehaltene Lohnsteuer — laufend",
    "43": "Einbehaltene Lohnsteuer — sonstige Bezüge",
    "44": "Lohnsteuer bei mehrjähriger Tätigkeit (§ 34 EStG)",
    "47": "Pauschale Lohnsteuer (Minijob 2 %)",
    "48": "Pauschalsteuer 25 % (kurzfristige Beschäftigung)",
    "49": "Pauschalsteuer 20 % (Aushilfskräfte Land-/Forstwirtschaft)",
    "61": "Solidaritätszuschlag (laufend + sonstige)",
    "62": "Solidaritätszuschlag pauschal",
    "71": "Kirchensteuer evangelisch",
    "72": "Kirchensteuer römisch-katholisch",
    "73": "Kirchensteuer pauschal EV",
    "74": "Kirchensteuer pauschal RK",
  };
  return names[kz] ?? kz;
}
