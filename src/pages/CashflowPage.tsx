import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import {
  computeCashflowForecast,
  type Confidence,
  type DeadlinePayment,
} from "../utils/cashflow";
import "./ReportView.css";
import "./TaxCalc.css";
import "./CashflowPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  hoch: "hoch",
  mittel: "mittel",
  niedrig: "niedrig",
};

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  hoch: "var(--success)",
  mittel: "var(--gold-700)",
  niedrig: "var(--danger)",
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function CashflowPage() {
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [horizonDays, setHorizonDays] = useState<number>(90);
  const [includeDeadlines, setIncludeDeadlines] = useState<boolean>(false);

  // Minimaler Deadline-Input: Nutzer kann eigene Steuerzahlungen eingeben.
  const [customDeadlines, setCustomDeadlines] = useState<DeadlinePayment[]>([]);

  const opening = Number(openingBalance.replace(",", ".")) || 0;

  const forecast = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return computeCashflowForecast({
      entries: entriesQ.data,
      accounts: accountsQ.data,
      openingBalance: opening,
      horizonDays,
      deadlines: includeDeadlines ? customDeadlines : [],
    });
  }, [
    entriesQ.data,
    accountsQ.data,
    opening,
    horizonDays,
    includeDeadlines,
    customDeadlines,
  ]);

  const chart = useMemo(() => {
    if (!forecast) return null;
    const width = 920;
    const height = 280;
    const padL = 54;
    const padR = 12;
    const padT = 12;
    const padB = 30;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const values = forecast.series.map((p) => p.running);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(0, ...values);
    const range = maxV - minV || 1;
    const n = forecast.series.length;
    const xStep = innerW / Math.max(1, n - 1);
    const yOf = (v: number) =>
      padT + innerH - ((v - minV) / range) * innerH;
    const zeroY = yOf(0);
    const points = forecast.series
      .map((p, i) => `${padL + i * xStep},${yOf(p.running)}`)
      .join(" ");
    const areaPath =
      `M ${padL},${zeroY} ` +
      forecast.series
        .map((p, i) => `L ${padL + i * xStep},${yOf(p.running)}`)
        .join(" ") +
      ` L ${padL + (n - 1) * xStep},${zeroY} Z`;

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => minV + t * range);
    const negativeDays = forecast.series.filter((p) => p.running < 0);

    return {
      width,
      height,
      padL,
      padR,
      padT,
      padB,
      innerW,
      innerH,
      xStep,
      yOf,
      zeroY,
      points,
      areaPath,
      ticks,
      minV,
      maxV,
      negativeDays,
    };
  }, [forecast]);

  const loading = entriesQ.isLoading || accountsQ.isLoading;

  return (
    <div className="report cashflow">
      <header className="report__head">
        <Link to="/opos" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Offene Posten
        </Link>
        <div className="report__head-title">
          <h1>Liquiditätsvorschau</h1>
          <p>
            Heuristische 90-Tage-Projektion aus offenen Posten und historischer
            Zahlungsmoral. <strong>Kein Prognosemodell</strong> — eine
            regelbasierte Hochrechnung mit sichtbaren Annahmen.
          </p>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          <strong>Methodik:</strong> Fälligkeitsdatum + historischer
          Zahlverzug (Median Rechnung → Zahlung) für Forderungen. Fälligkeit
          für Verbindlichkeiten (optimistische Annahme: pünktlich).
          Steuerzahlungen nur, wenn hier selbst eingetragen. Kein ML,
          keine saisonalen Effekte.
        </span>
      </aside>

      <section className="card cashflow__controls">
        <label className="form-field">
          <span>Startsaldo (Bank + Kasse)</span>
          <input
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
          />
        </label>
        <label className="form-field">
          <span>Horizont</span>
          <select
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          >
            <option value={30}>30 Tage</option>
            <option value={60}>60 Tage</option>
            <option value={90}>90 Tage</option>
            <option value={180}>180 Tage</option>
          </select>
        </label>
        <label className="form-field cashflow__checkbox">
          <span>&nbsp;</span>
          <div>
            <input
              type="checkbox"
              checked={includeDeadlines}
              onChange={(e) => setIncludeDeadlines(e.target.checked)}
            />{" "}
            Steuerzahlungen berücksichtigen
          </div>
        </label>
      </section>

      {includeDeadlines && (
        <DeadlineEditor
          deadlines={customDeadlines}
          onChange={setCustomDeadlines}
        />
      )}

      {loading && (
        <section className="card cashflow__empty">
          <p>Daten werden geladen …</p>
        </section>
      )}

      {forecast && (
        <>
          <section className="cashflow__kpis">
            <div className="card cashflow__kpi">
              <div className="cashflow__kpi-head">
                <ArrowUpCircle size={16} />
                Offene Forderungen
              </div>
              <div className="cashflow__kpi-value">
                {euro.format(forecast.meta.openReceivables)}
              </div>
            </div>
            <div className="card cashflow__kpi">
              <div className="cashflow__kpi-head">
                <ArrowDownCircle size={16} />
                Offene Verbindlichkeiten
              </div>
              <div className="cashflow__kpi-value">
                {euro.format(forecast.meta.openPayables)}
              </div>
            </div>
            <div className="card cashflow__kpi">
              <div className="cashflow__kpi-head">
                <TrendingUp size={16} />
                Saldo Ende {forecast.horizonDays}. Tag
              </div>
              <div
                className="cashflow__kpi-value"
                style={{
                  color:
                    forecast.series.at(-1)!.running < 0
                      ? "var(--danger)"
                      : "var(--ink)",
                }}
              >
                {euro.format(forecast.series.at(-1)!.running)}
              </div>
            </div>
            <div className="card cashflow__kpi">
              <div className="cashflow__kpi-head">
                <Info size={16} />
                Konfidenz
              </div>
              <div
                className="cashflow__kpi-value"
                style={{
                  color: CONFIDENCE_COLOR[forecast.meta.confidence],
                }}
              >
                {CONFIDENCE_LABEL[forecast.meta.confidence]}
              </div>
              <div className="cashflow__kpi-sub">
                {forecast.meta.historicSampleSize} bezahlte Belege
                {forecast.meta.historicMedianDaysToPay !== null &&
                  ` · Median ${forecast.meta.historicMedianDaysToPay} Tage`}
              </div>
            </div>
          </section>

          {chart && (
            <section className="card cashflow__chart-wrap">
              <h2>Kumulierter Saldo</h2>
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                className="cashflow__chart"
                preserveAspectRatio="none"
                role="img"
                aria-label={`Liquiditätsverlauf über ${forecast.horizonDays} Tage`}
              >
                {/* Y-Ticks und Gridlines */}
                {chart.ticks.map((v, i) => {
                  const y = chart.yOf(v);
                  return (
                    <g key={i}>
                      <line
                        x1={chart.padL}
                        x2={chart.width - chart.padR}
                        y1={y}
                        y2={y}
                        stroke="var(--border)"
                        strokeDasharray="2 3"
                      />
                      <text
                        x={chart.padL - 6}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="var(--muted)"
                      >
                        {euro.format(v)}
                      </text>
                    </g>
                  );
                })}
                {/* Nulllinie */}
                <line
                  x1={chart.padL}
                  x2={chart.width - chart.padR}
                  y1={chart.zeroY}
                  y2={chart.zeroY}
                  stroke="var(--navy)"
                  strokeWidth={1.4}
                />
                {/* Flächen-Füllung */}
                <path d={chart.areaPath} fill="rgba(245, 158, 11, 0.18)" />
                {/* Linie */}
                <polyline
                  points={chart.points}
                  fill="none"
                  stroke="var(--navy)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {/* X-Achse: monatliche Labels */}
                {forecast.series.map((p, i) => {
                  const d = new Date(p.date);
                  if (d.getDate() !== 1 && i !== 0) return null;
                  return (
                    <g key={p.date}>
                      <line
                        x1={chart.padL + i * chart.xStep}
                        x2={chart.padL + i * chart.xStep}
                        y1={chart.padT}
                        y2={chart.height - chart.padB}
                        stroke="var(--border)"
                        strokeDasharray="2 3"
                      />
                      <text
                        x={chart.padL + i * chart.xStep}
                        y={chart.height - chart.padB + 14}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--muted)"
                      >
                        {formatShortDate(p.date)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {chart.negativeDays.length > 0 && (
                <div className="cashflow__warning">
                  <AlertTriangle size={14} />
                  <span>
                    An {chart.negativeDays.length} Tag
                    {chart.negativeDays.length === 1 ? "" : "en"} geht der
                    Saldo unter 0. Erster kritischer Tag:{" "}
                    <strong>
                      {new Date(chart.negativeDays[0].date).toLocaleDateString(
                        "de-DE"
                      )}
                    </strong>
                    {" "}bei {euroCents.format(chart.negativeDays[0].running)}.
                  </span>
                </div>
              )}
            </section>
          )}

          <section className="card cashflow__events">
            <h2>Ereignisse in den nächsten {forecast.horizonDays} Tagen</h2>
            {forecast.items.length === 0 ? (
              <p className="cashflow__empty-note">
                Keine projizierten Ereignisse — entweder keine offenen Posten
                oder alle fallen außerhalb des Zeitfensters.
              </p>
            ) : (
              <table className="cashflow__events-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Ereignis</th>
                    <th>Quelle</th>
                    <th>Konfidenz</th>
                    <th>Kunde-Zuverlässigkeit</th>
                    <th className="is-num">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.items.map((it, i) => (
                    <tr key={`${it.ref}-${i}`}>
                      <td>
                        {new Date(it.date).toLocaleDateString("de-DE")}
                      </td>
                      <td>
                        {it.label}
                        {it.note && (
                          <span className="cashflow__note">
                            &nbsp;· {it.note}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`cashflow__src cashflow__src--${it.source}`}>
                          {it.source === "receivable"
                            ? "Forderung"
                            : it.source === "payable"
                              ? "Verbindlichkeit"
                              : "Steuerfrist"}
                        </span>
                      </td>
                      <td
                        style={{
                          color: CONFIDENCE_COLOR[it.confidence],
                          fontWeight: 600,
                        }}
                      >
                        {CONFIDENCE_LABEL[it.confidence]}
                      </td>
                      <td>
                        {typeof it.customerLateRatio === "number" ? (
                          <span
                            style={{
                              color:
                                it.customerLateRatio > 0.5
                                  ? "var(--danger)"
                                  : it.customerLateRatio > 0.2
                                    ? "var(--gold-700)"
                                    : "var(--success)",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                            }}
                            title={`${Math.round(
                              it.customerLateRatio * 100
                            )}% der vergangenen Rechnungen wurden verspätet beglichen`}
                          >
                            {it.customerLateRatio === 0
                              ? "pünktlich"
                              : `${Math.round(it.customerLateRatio * 100)}% verspätet`}
                          </span>
                        ) : it.source === "receivable" ? (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: "0.78rem",
                            }}
                          >
                            keine Historie
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className="is-num"
                        style={{
                          color:
                            it.direction === "inflow"
                              ? "var(--success)"
                              : "var(--danger)",
                        }}
                      >
                        {it.direction === "inflow" ? "+" : "−"}
                        {euroCents.format(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card cashflow__methodology">
            <h2>Methoden-Transparenz</h2>
            <ul>
              <li>
                Historische Zahlungsmoral: aus {forecast.meta.historicSampleSize}{" "}
                vollständig bezahlten Forderungen berechnet.{" "}
                {forecast.meta.historicMedianDaysToPay !== null ? (
                  <>
                    Median: {forecast.meta.historicMedianDaysToPay} Tage, Mittel:{" "}
                    {forecast.meta.historicMeanDaysToPay} Tage.
                  </>
                ) : (
                  "Keine Zahlungshistorie vorhanden — Projektion basiert allein auf Fälligkeit."
                )}
              </li>
              <li>
                Forderungen werden auf Fälligkeit + max(0, Median − 14 Tage
                angenommenes Zahlungsziel) projiziert. Bereits überfällige
                Forderungen werden auf heute + geschätzten Rest-Verzug (max.
                45 Tage) verschoben.
              </li>
              <li>
                Verbindlichkeiten werden auf ihrem Fälligkeitstag fällig — wir
                gehen von pünktlicher Zahlung aus.
              </li>
              <li>
                Steuerzahlungen fliessen nur ein, wenn Sie sie oben explizit
                eintragen. Es gibt keine automatische Voranmeldungs-Abschätzung.
              </li>
              <li>
                <strong>Was fehlt bewusst:</strong> saisonale Zyklen, Kunden-
                individuelle Zahlzeiten, Wechselkurseffekte, Dauerverträge,
                nicht-fakturierte Erwartungsumsätze.
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function DeadlineEditor({
  deadlines,
  onChange,
}: {
  deadlines: DeadlinePayment[];
  onChange: (next: DeadlinePayment[]) => void;
}) {
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    label: "UStVA",
    amount: "0",
  });
  function add() {
    if (!draft.date || !draft.label.trim()) return;
    const amt = Number(draft.amount.replace(",", ".")) || 0;
    if (amt <= 0) return;
    onChange([
      ...deadlines,
      {
        id: `dl-${Date.now()}`,
        date: draft.date,
        label: draft.label,
        amount: amt,
      },
    ]);
    setDraft({ date: draft.date, label: "UStVA", amount: "0" });
  }
  function remove(id: string) {
    onChange(deadlines.filter((d) => d.id !== id));
  }
  return (
    <section className="card cashflow__deadlines">
      <h2>Eigene Steuerzahlungen</h2>
      <div className="cashflow__deadline-row">
        <input
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
        />
        <input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="z. B. UStVA März"
        />
        <input
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          placeholder="Betrag"
          inputMode="decimal"
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={add}
        >
          + Hinzufügen
        </button>
      </div>
      {deadlines.length > 0 && (
        <ul className="cashflow__deadline-list">
          {deadlines.map((d) => (
            <li key={d.id}>
              <span>{new Date(d.date).toLocaleDateString("de-DE")}</span>
              <span>{d.label}</span>
              <span>{euroCents.format(d.amount)}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => remove(d.id)}
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
