import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  Clock,
  Coins,
  FileText,
  Info,
  TrendingUp,
} from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";
import "./RoiCalculatorPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/**
 * Dokumentierte Annahmen (transparente Heuristik, KEIN Marketing-Versprechen):
 *
 *   Zeit-Ersparnis pro Monat
 *     = Rechnungen × 0,5 Std (Ableitung + Buchung bei manueller Erfassung)
 *     + manuelle_Wochenstunden × 4,33 (Wochen/Monat) × 0,7 (70 % Automatisierung)
 *
 *   Kosten-Ersparnis pro Monat
 *     = Stundenkosten × Zeit-Ersparnis
 *     − Software-Kosten (bei uns aktuell €0 für Demo, Plan-Preise siehe Produkt)
 *
 *   Diese Formel ist absichtlich einfach. Sie überschätzt die Ersparnis für
 *   Teams, die schon weitgehend automatisiert sind, und unterschätzt sie für
 *   stark manuelle Prozesse. Für belastbare Business-Cases: eigene Zahlen
 *   prüfen, nicht der Kalkulator unten vertrauen.
 */
const HOURS_PER_INVOICE_MANUAL = 0.5;
const WEEKS_PER_MONTH = 4.33;
const AUTOMATION_FACTOR = 0.7;

function calculate(input: {
  invoicesPerMonth: number;
  hourlyCost: number;
  manualHoursPerWeek: number;
  currentSoftwareMonthly: number;
}) {
  const invoiceHours = input.invoicesPerMonth * HOURS_PER_INVOICE_MANUAL;
  const manualMonthlyHours = input.manualHoursPerWeek * WEEKS_PER_MONTH;
  const savedHoursMonth =
    invoiceHours * AUTOMATION_FACTOR + manualMonthlyHours * AUTOMATION_FACTOR;

  const costSavedLabour = savedHoursMonth * input.hourlyCost;
  // Abzug: eigene Software-Kosten derzeit €0 im Demo; wir nehmen nur
  // die Einsparung gegenüber bisheriger Software an.
  const softwareSaved = input.currentSoftwareMonthly;

  const monthlySavings = costSavedLabour + softwareSaved;
  const annualSavings = monthlySavings * 12;
  const productivityPct =
    manualMonthlyHours + invoiceHours > 0
      ? (savedHoursMonth / (manualMonthlyHours + invoiceHours)) * 100
      : 0;

  // Break-Even: da wir hier €0 Subscription annehmen, ist Break-Even bereits
  // ab dem ersten Monat gegeben, sofern monthlySavings > 0.
  return {
    savedHoursMonth,
    savedHoursYear: savedHoursMonth * 12,
    monthlySavings,
    annualSavings,
    productivityPct,
  };
}

export default function RoiCalculatorPage() {
  const [invoices, setInvoices] = useState(50);
  const [hourlyCost, setHourlyCost] = useState(95);
  const [manualHours, setManualHours] = useState(15);
  const [currentSoftware, setCurrentSoftware] = useState(80);

  const result = useMemo(
    () =>
      calculate({
        invoicesPerMonth: invoices,
        hourlyCost,
        manualHoursPerWeek: manualHours,
        currentSoftwareMonthly: currentSoftware,
      }),
    [invoices, hourlyCost, manualHours, currentSoftware]
  );

  return (
    <PublicShell>
      <div className="container info roi">
        <header className="info__head">
          <span className="info__eyebrow">
            <Calculator size={14} />
            ROI-Rechner
          </span>
          <h1>Was spart Sie harouda-app?</h1>
          <p>
            Transparente Schätzung auf Basis Ihrer Zahlen. Keine versteckte
            Marketing-Formel — die Annahmen stehen am Ende der Seite.
          </p>
        </header>

        <div className="roi__grid">
          <section className="card roi__inputs">
            <h2>Ihre Situation heute</h2>

            <div className="roi__field">
              <div className="roi__field-head">
                <label htmlFor="roi-inv">
                  <FileText size={14} /> Eingehende Rechnungen pro Monat
                </label>
                <strong>{invoices}</strong>
              </div>
              <input
                id="roi-inv"
                type="range"
                min={5}
                max={500}
                step={5}
                value={invoices}
                onChange={(e) => setInvoices(Number(e.target.value))}
              />
              <div className="roi__field-range">
                <span>5</span>
                <span>500</span>
              </div>
            </div>

            <div className="roi__field">
              <div className="roi__field-head">
                <label htmlFor="roi-hc">
                  <Coins size={14} /> Stundenkosten Buchhaltung (€)
                </label>
                <strong>{euro.format(hourlyCost)}</strong>
              </div>
              <input
                id="roi-hc"
                type="range"
                min={40}
                max={200}
                step={5}
                value={hourlyCost}
                onChange={(e) => setHourlyCost(Number(e.target.value))}
              />
              <div className="roi__field-range">
                <span>{euro.format(40)}</span>
                <span>{euro.format(200)}</span>
              </div>
            </div>

            <div className="roi__field">
              <div className="roi__field-head">
                <label htmlFor="roi-mh">
                  <Clock size={14} /> Manuelle Buchhaltungs-Stunden pro Woche
                </label>
                <strong>{manualHours} h</strong>
              </div>
              <input
                id="roi-mh"
                type="range"
                min={0}
                max={40}
                step={1}
                value={manualHours}
                onChange={(e) => setManualHours(Number(e.target.value))}
              />
              <div className="roi__field-range">
                <span>0 h</span>
                <span>40 h</span>
              </div>
            </div>

            <div className="roi__field">
              <div className="roi__field-head">
                <label htmlFor="roi-sw">
                  <TrendingUp size={14} /> Heutige Softwarekosten pro Monat (€)
                </label>
                <strong>{euro.format(currentSoftware)}</strong>
              </div>
              <input
                id="roi-sw"
                type="range"
                min={0}
                max={500}
                step={10}
                value={currentSoftware}
                onChange={(e) => setCurrentSoftware(Number(e.target.value))}
              />
              <div className="roi__field-range">
                <span>{euro.format(0)}</span>
                <span>{euro.format(500)}</span>
              </div>
            </div>
          </section>

          <section className="card roi__results">
            <h2>Geschätzte Ersparnis</h2>

            <div className="roi__result-big">
              <span className="roi__result-label">pro Jahr</span>
              <span className="roi__result-value">
                {euro.format(result.annualSavings)}
              </span>
            </div>

            <div className="roi__result-grid">
              <div>
                <dt>Zeit pro Monat</dt>
                <dd>{result.savedHoursMonth.toFixed(1)} Std.</dd>
              </div>
              <div>
                <dt>Zeit pro Jahr</dt>
                <dd>{result.savedHoursYear.toFixed(0)} Std.</dd>
              </div>
              <div>
                <dt>Monatliche Ersparnis</dt>
                <dd>{euroCents.format(result.monthlySavings)}</dd>
              </div>
              <div>
                <dt>Produktivitätszuwachs</dt>
                <dd>{result.productivityPct.toFixed(0)} %</dd>
              </div>
            </div>

            <div className="roi__cta">
              <Link to="/login" className="btn btn-primary">
                Kostenlos testen <ArrowRight size={16} />
              </Link>
              <Link to="/vergleich" className="btn btn-outline">
                Ehrlicher Vergleich
              </Link>
            </div>
          </section>
        </div>

        <aside className="info__note roi__assumptions">
          <Info size={16} />
          <div>
            <strong>Ehrliche Annahmen im Detail:</strong>
            <ul>
              <li>
                Pro eingehender Rechnung kostet manuelle Erfassung im Schnitt{" "}
                <strong>{HOURS_PER_INVOICE_MANUAL * 60} Minuten</strong>
                {" "}(Extraktion + Belegablage + Buchung + Archivierung).
              </li>
              <li>
                Ein Monat hat {WEEKS_PER_MONTH} Arbeitswochen — grobe Mittelung
                über Monate mit 28–31 Tagen.
              </li>
              <li>
                Automatisierungsgrad:{" "}
                <strong>{AUTOMATION_FACTOR * 100} %</strong>. Das ist eine
                optimistische Annahme für Buchhaltungsteams, die viele
                Standard-Rechnungen bearbeiten; bei hochindividuellen
                Buchungen ist der tatsächliche Wert niedriger.
              </li>
              <li>
                Die bisherigen Software-Kosten werden 1&nbsp;:&nbsp;1 als
                Ersparnis angesetzt — harouda-app selbst ist im Demo-Modus
                kostenlos.
              </li>
              <li>
                Der Rechner <strong>ersetzt keine individuelle
                Wirtschaftlichkeits-Analyse</strong>. Für eine belastbare
                Business-Case-Rechnung bitte eigene Zeiten messen.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}
