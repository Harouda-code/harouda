import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { LohnabrechnungsEngine } from "../domain/lohn/LohnabrechnungsEngine";
import type {
  Arbeitnehmer,
  Bundesland,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
} from "../domain/lohn/types";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import { useSettings } from "../contexts/SettingsContext";
import "./ReportView.css";

function fmt(s: string): string {
  return new Money(s).toEuroFormat();
}

const BUNDESLAENDER: Bundesland[] = [
  "BW",
  "BY",
  "BE",
  "BB",
  "HB",
  "HH",
  "HE",
  "MV",
  "NI",
  "NW",
  "RP",
  "SL",
  "SN",
  "ST",
  "SH",
  "TH",
];

const DEFAULT_LOHNART_GEHALT: LohnArt = {
  id: "la-gehalt",
  bezeichnung: "Gehalt",
  typ: "LAUFENDER_BEZUG",
  steuerpflichtig: true,
  svpflichtig: true,
  lst_meldung_feld: "3",
};

export default function LohnPage() {
  const { settings } = useSettings();
  const [steuerklasse, setSteuerklasse] = useState<Steuerklasse>(1);
  const [brutto, setBrutto] = useState("3000");
  const [bundesland, setBundesland] = useState<Bundesland>("NW");
  const [kirchensteuerpflichtig, setKist] = useState(false);
  const [kinder, setKinder] = useState("0");
  const [kinderlos, setKinderlos] = useState(true);
  const [pvKinder, setPvKinder] = useState("0");
  const [kvZusatz, setKvZusatz] = useState("2.5");
  const [abrMonat, setAbrMonat] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [minijob, setMinijob] = useState(false);

  const { abrechnung } = useMemo(() => {
    const an: Arbeitnehmer = {
      id: "demo-1",
      mandant_id: "demo",
      personalNr: "001",
      name: "Mustermann",
      vorname: "Max",
      geburtsdatum: "1990-01-01",
      sv_nummer: "12345678901A",
      steuer_id: "12345678901",
      steuerklasse,
      kinderfreibetraege: Number(kinder) || 0,
      kirchensteuerpflichtig,
      konfession: kirchensteuerpflichtig ? "EV" : "NONE",
      bundesland,
      kv_pflicht: !minijob,
      kv_beitragsart: "GESETZLICH",
      kv_zusatzbeitrag: kvZusatz,
      rv_pflicht: !minijob,
      av_pflicht: !minijob,
      pv_pflicht: !minijob,
      pv_kinderlos_zuschlag: kinderlos,
      pv_anzahl_kinder: Number(pvKinder) || 0,
      beschaeftigungsart: minijob ? "MINIJOB" : "VOLLZEIT",
      betriebsnummer: "12345678",
      eintrittsdatum: "2020-01-01",
    };
    let safeBrutto: Money;
    try {
      safeBrutto = new Money(brutto.replace(",", "."));
    } catch {
      safeBrutto = Money.zero();
    }
    const buchung: Lohnbuchung = {
      id: "b-demo",
      arbeitnehmer_id: an.id,
      abrechnungsmonat: abrMonat,
      lohnart_id: DEFAULT_LOHNART_GEHALT.id,
      betrag: safeBrutto,
      buchungsdatum: `${abrMonat}-15`,
    };
    const engine = new LohnabrechnungsEngine();
    const ab = engine.berechneAbrechnung({
      arbeitnehmer: an,
      lohnarten: new Map([[DEFAULT_LOHNART_GEHALT.id, DEFAULT_LOHNART_GEHALT]]),
      buchungen: [buchung],
      abrechnungsmonat: abrMonat,
    });
    return { abrechnung: ab };
  }, [
    steuerklasse,
    brutto,
    bundesland,
    kirchensteuerpflichtig,
    kinder,
    kinderlos,
    pvKinder,
    kvZusatz,
    abrMonat,
    minijob,
  ]);

  function handleJson() {
    const payload = {
      meta: { kanzlei: settings.kanzleiName, generatedAt: new Date().toISOString() },
      eingaben: {
        steuerklasse,
        brutto,
        bundesland,
        kirchensteuerpflichtig,
        kinderfreibetraege: kinder,
        pv_kinderlos_zuschlag: kinderlos,
        pv_anzahl_kinder: pvKinder,
        kv_zusatzbeitrag: kvZusatz,
        abrechnungsmonat: abrMonat,
        minijob,
      },
      abrechnung: {
        laufenderBrutto: abrechnung.formatted.laufenderBrutto,
        gesamtBrutto: abrechnung.formatted.gesamtBrutto,
        svBrutto: abrechnung.svBrutto.toFixed2(),
        abzuege: {
          lohnsteuer: abrechnung.abzuege.lohnsteuer.toFixed2(),
          solidaritaetszuschlag: abrechnung.abzuege.solidaritaetszuschlag.toFixed2(),
          kirchensteuer: abrechnung.abzuege.kirchensteuer.toFixed2(),
          kv_an: abrechnung.abzuege.kv_an.toFixed2(),
          kv_zusatz_an: abrechnung.abzuege.kv_zusatz_an.toFixed2(),
          pv_an: abrechnung.abzuege.pv_an.toFixed2(),
          rv_an: abrechnung.abzuege.rv_an.toFixed2(),
          av_an: abrechnung.abzuege.av_an.toFixed2(),
          gesamtAbzuege: abrechnung.abzuege.gesamtAbzuege.toFixed2(),
        },
        arbeitgeberKosten: {
          kv: abrechnung.arbeitgeberKosten.kv.toFixed2(),
          kv_zusatz: abrechnung.arbeitgeberKosten.kv_zusatz.toFixed2(),
          pv: abrechnung.arbeitgeberKosten.pv.toFixed2(),
          rv: abrechnung.arbeitgeberKosten.rv.toFixed2(),
          av: abrechnung.arbeitgeberKosten.av.toFixed2(),
          u1: abrechnung.arbeitgeberKosten.u1.toFixed2(),
          u2: abrechnung.arbeitgeberKosten.u2.toFixed2(),
          u3: abrechnung.arbeitgeberKosten.u3.toFixed2(),
          gesamt: abrechnung.arbeitgeberKosten.gesamt.toFixed2(),
        },
        auszahlungsbetrag: abrechnung.formatted.auszahlungsbetrag,
        gesamtkostenArbeitgeber: abrechnung.formatted.gesamtkostenArbeitgeber,
        _meta: abrechnung._meta,
      },
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `lohnabrechnung_demo_${abrMonat}.json`,
      "application/json"
    );
    toast.success("Lohnabrechnung-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>Lohn & Gehalt — Kalkulator (§ 38 EStG + SGB IV)</h1>
          <p>
            Live-Berechnung einer Monatsabrechnung · Lohnsteuer + SV + Soli +
            Kirchensteuer · Minijob-Spezialbehandlung · Kinderlos-Zuschlag PV.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Abrechnungsmonat</span>
            <input
              type="month"
              value={abrMonat}
              onChange={(e) => setAbrMonat(e.target.value)}
            />
          </label>
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
          <strong>Kalkulator-Modus · Demo.</strong> Keine Datenpersistenz —
          Eingaben leben nur im Browser. Vorsorgepauschale § 39b Abs. 4 EStG
          ist vereinfacht implementiert (voller RV-Anteil + AN-Anteile KV/PV);
          Abweichung zur BMF-Lohnsteuertabelle typ. 5-10 %. Für produktive
          Abrechnungen AN-Stammdaten, bAV, Pfändungen, Aufrollungen und exakte
          ProgrammAblaufpläne einbinden.
        </div>
      </aside>

      <section className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>Eingaben</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <label>
            <span>Brutto (monatlich)</span>
            <input
              type="text"
              value={brutto}
              onChange={(e) => setBrutto(e.target.value)}
            />
          </label>
          <label>
            <span>Steuerklasse</span>
            <select
              value={steuerklasse}
              onChange={(e) =>
                setSteuerklasse(Number(e.target.value) as Steuerklasse)
              }
            >
              <option value={1}>I — Alleinstehend</option>
              <option value={2}>II — Alleinerziehend</option>
              <option value={3}>III — Verheiratet (Ehegatte V)</option>
              <option value={4}>IV — Verheiratet gleich</option>
              <option value={5}>V — Verheiratet (Ehegatte III)</option>
              <option value={6}>VI — Nebenjob</option>
            </select>
          </label>
          <label>
            <span>Bundesland</span>
            <select
              value={bundesland}
              onChange={(e) => setBundesland(e.target.value as Bundesland)}
            >
              {BUNDESLAENDER.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>KV-Zusatzbeitrag (%)</span>
            <input
              type="text"
              value={kvZusatz}
              onChange={(e) => setKvZusatz(e.target.value)}
            />
          </label>
          <label>
            <span>Kinderfreibeträge</span>
            <input
              type="text"
              value={kinder}
              onChange={(e) => setKinder(e.target.value)}
            />
          </label>
          <label>
            <span>PV Anzahl Kinder</span>
            <input
              type="text"
              value={pvKinder}
              onChange={(e) => setPvKinder(e.target.value)}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={kirchensteuerpflichtig}
              onChange={(e) => setKist(e.target.checked)}
            />
            Kirchensteuerpflichtig
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={kinderlos}
              onChange={(e) => setKinderlos(e.target.checked)}
            />
            PV Kinderlos-Zuschlag
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={minijob}
              onChange={(e) => setMinijob(e.target.checked)}
            />
            Minijob
          </label>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Kpi
          label="Auszahlungsbetrag (Netto)"
          value={fmt(abrechnung.formatted.auszahlungsbetrag)}
          color="#1f7a4d"
          emphasis
        />
        <Kpi label="Gesamtbrutto" value={fmt(abrechnung.formatted.gesamtBrutto)} />
        <Kpi label="Lohnsteuer" value={fmt(abrechnung.abzuege.lohnsteuer.toFixed2())} />
        <Kpi
          label="Gesamtkosten Arbeitgeber"
          value={fmt(abrechnung.formatted.gesamtkostenArbeitgeber)}
          color="#8a2c2c"
        />
      </div>

      <section className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
          <Calculator size={16} /> Arbeitnehmer-Abzüge
        </h3>
        <table style={{ width: "100%", fontSize: "0.88rem" }}>
          <tbody>
            <Row label="Lohnsteuer" value={abrechnung.abzuege.lohnsteuer.toFixed2()} />
            <Row
              label="Solidaritätszuschlag"
              value={abrechnung.abzuege.solidaritaetszuschlag.toFixed2()}
            />
            <Row
              label="Kirchensteuer"
              value={abrechnung.abzuege.kirchensteuer.toFixed2()}
            />
            <Row
              label="KV-Beitrag (7,3 %)"
              value={abrechnung.abzuege.kv_an.toFixed2()}
            />
            <Row
              label="KV-Zusatzbeitrag (hälftig)"
              value={abrechnung.abzuege.kv_zusatz_an.toFixed2()}
            />
            <Row
              label="Pflegeversicherung"
              value={abrechnung.abzuege.pv_an.toFixed2()}
            />
            <Row
              label="Rentenversicherung (9,3 %)"
              value={abrechnung.abzuege.rv_an.toFixed2()}
            />
            <Row
              label="Arbeitslosenversicherung (1,3 %)"
              value={abrechnung.abzuege.av_an.toFixed2()}
            />
            <Row
              label="Summe Abzüge"
              value={abrechnung.abzuege.gesamtAbzuege.toFixed2()}
              bold
            />
          </tbody>
        </table>
      </section>

      <section className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
          Arbeitgeber-Kosten (§ 249 SGB V + Umlagen)
        </h3>
        <table style={{ width: "100%", fontSize: "0.88rem" }}>
          <tbody>
            <Row label="KV-AG (7,3 %)" value={abrechnung.arbeitgeberKosten.kv.toFixed2()} />
            <Row
              label="KV-Zusatz-AG"
              value={abrechnung.arbeitgeberKosten.kv_zusatz.toFixed2()}
            />
            <Row label="PV-AG" value={abrechnung.arbeitgeberKosten.pv.toFixed2()} />
            <Row label="RV-AG (9,3 %)" value={abrechnung.arbeitgeberKosten.rv.toFixed2()} />
            <Row label="AV-AG (1,3 %)" value={abrechnung.arbeitgeberKosten.av.toFixed2()} />
            <Row label="U1 (1,1 %)" value={abrechnung.arbeitgeberKosten.u1.toFixed2()} />
            <Row label="U2 (0,24 %)" value={abrechnung.arbeitgeberKosten.u2.toFixed2()} />
            <Row label="U3 Insolvenz (0,06 %)" value={abrechnung.arbeitgeberKosten.u3.toFixed2()} />
            <Row
              label="Summe AG-Kosten"
              value={abrechnung.arbeitgeberKosten.gesamt.toFixed2()}
              bold
            />
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  emphasis,
}: {
  label: string;
  value: string;
  color?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="card" style={{ padding: 12, borderLeft: color ? `4px solid ${color}` : undefined }}>
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: emphasis ? "1.3rem" : "1rem",
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr style={{ borderBottom: "1px dashed #eef1f6", fontWeight: bold ? 700 : 400 }}>
      <td style={{ padding: "3px 0" }}>{label}</td>
      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "3px 0" }}>
        {fmt(value)}
      </td>
    </tr>
  );
}
