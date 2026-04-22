import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { buildEuer } from "../api/euer";
import { mapKontoToEuerZeile } from "../data/euerMapping";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import "./ReportView.css";
import "./TaxCalc.css";
import "./BuchfuehrungPlausiPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type Severity = "ok" | "info" | "warn" | "error";
type Check = {
  id: string;
  title: string;
  severity: Severity;
  message: string;
  detail?: string[];
};

const SEV_LABEL: Record<Severity, string> = {
  ok: "OK",
  info: "Hinweis",
  warn: "Warnung",
  error: "Fehler",
};

const SEV_CLASS: Record<Severity, string> = {
  ok: "is-ok",
  info: "is-info",
  warn: "is-warn",
  error: "is-error",
};

export default function BuchfuehrungPlausiPage() {
  const { selectedMandantId } = useMandant();
  const { selectedYear, yearStart, yearEnd } = useYear();

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const checks = useMemo<Check[]>(() => {
    const entries = entriesQ.data ?? [];
    const accounts = accountsQ.data ?? [];
    if (entries.length === 0 || accounts.length === 0) return [];

    const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
    const inYear = entries.filter(
      (e) =>
        e.datum.slice(0, 4) === String(selectedYear) &&
        (!selectedMandantId || e.client_id === selectedMandantId)
    );
    const list: Check[] = [];

    // --- Check 1: nicht zugeordnete Erfolgskonten mit Bewegung ---
    const unmapped = new Set<string>();
    for (const e of inYear) {
      for (const k of [e.soll_konto, e.haben_konto]) {
        const acc = byNr.get(k);
        if (!acc) continue;
        if (acc.kategorie !== "aufwand" && acc.kategorie !== "ertrag") continue;
        if (mapKontoToEuerZeile(k) === null) unmapped.add(k);
      }
    }
    if (unmapped.size === 0) {
      list.push({
        id: "unmapped",
        title: "Alle bewegten Erfolgskonten sind einer Zeile zugeordnet",
        severity: "ok",
        message: "Keine offenen Zuordnungen.",
      });
    } else {
      list.push({
        id: "unmapped",
        title: "Konten ohne EÜR-Zuordnung",
        severity: "warn",
        message: `${unmapped.size} Konto/Konten ohne Default-Mapping. Überschreibung in „Konten zuordnen" setzen.`,
        detail: Array.from(unmapped)
          .sort()
          .map((k) => {
            const a = byNr.get(k);
            return `${k} ${a?.bezeichnung ?? ""}`;
          }),
      });
    }

    // --- Check 2: Privatentnahmen / Privatkonten (2000-2199) mit Bewegung ---
    const privat = new Set<string>();
    for (const e of inYear) {
      for (const k of [e.soll_konto, e.haben_konto]) {
        const n = Number(k);
        if (Number.isFinite(n) && n >= 2000 && n <= 2199) privat.add(k);
      }
    }
    if (privat.size === 0) {
      list.push({
        id: "privat",
        title: "Keine Privatkonten (2000–2199) bewegt",
        severity: "ok",
        message: "Sauber getrennt.",
      });
    } else {
      list.push({
        id: "privat",
        title: "Privatkonten bewegt",
        severity: "info",
        message:
          `${privat.size} Privatkonto/en wurde(n) im Jahr ${selectedYear} bebucht. ` +
          "Privatentnahmen/-einlagen fließen NICHT in die EÜR — nur prüfen, ob die Buchungen korrekt sind.",
        detail: Array.from(privat)
          .sort()
          .map((k) => `${k} ${byNr.get(k)?.bezeichnung ?? ""}`),
      });
    }

    // --- Check 3: EÜR-Summen plausibel? ---
    const report = buildEuer(
      entries,
      accounts,
      { start: yearStart, end: yearEnd },
      selectedMandantId
    );

    if (report.summeEinnahmen <= 0) {
      list.push({
        id: "einnahmen-zero",
        title: "Keine Einnahmen in der EÜR",
        severity: "warn",
        message:
          "Summe der Einnahmen ist 0 € oder negativ. Ist das tatsächlich so, oder fehlen Ertragsbuchungen?",
      });
    } else {
      list.push({
        id: "einnahmen-zero",
        title: "Einnahmen vorhanden",
        severity: "ok",
        message: `Summe Einnahmen: ${euro.format(report.summeEinnahmen)}`,
      });
    }

    if (report.summeAusgaben < 0) {
      list.push({
        id: "ausgaben-neg",
        title: "Negative Ausgabensumme",
        severity: "error",
        message:
          "Die Summe der Ausgaben ist negativ. Das ist normalerweise nicht plausibel — prüfen Sie einzelne Buchungen.",
      });
    }

    // --- Check 4: USt-Plausibilität: Umsätze 19% ↔ vereinnahmte USt ---
    const umsaetze19 =
      report.lines.find((l) => l.zeile === 12)?.betrag ?? 0;
    const ustAusEinnahmen =
      report.lines.find((l) => l.zeile === 14)?.betrag ?? 0;

    const erwarteteUst = umsaetze19 * (19 / 100);
    const abweichung =
      erwarteteUst > 0
        ? Math.abs(ustAusEinnahmen - erwarteteUst) / erwarteteUst
        : 0;

    if (umsaetze19 > 0 && ustAusEinnahmen === 0) {
      list.push({
        id: "ust-missing",
        title: "Umsätze vorhanden, aber keine vereinnahmte USt",
        severity: "warn",
        message:
          `Zeile 12 = ${euro.format(umsaetze19)} (netto), Zeile 14 = 0 €. ` +
          "Möglicherweise fehlt der USt-Satz auf den Erlöskonten.",
      });
    } else if (umsaetze19 > 0 && abweichung > 0.15) {
      list.push({
        id: "ust-mismatch",
        title: "USt-Anteil weicht stark von 19 % ab",
        severity: "info",
        message:
          `Umsätze Zeile 12: ${euro.format(umsaetze19)}, vereinnahmte USt Zeile 14: ${euro.format(
            ustAusEinnahmen
          )}. Erwartet wären ca. ${euro.format(erwarteteUst)} (Abweichung ${(
            abweichung * 100
          ).toFixed(0)} %). Mix aus 7 %/19 %/steuerfrei möglich.`,
      });
    } else if (umsaetze19 > 0) {
      list.push({
        id: "ust-ok",
        title: "USt-Anteil plausibel zu den Umsätzen",
        severity: "ok",
        message: `Zeile 12 / Zeile 14 stimmen überein (±15 %).`,
      });
    }

    // --- Check 5: Bewirtung Konto 4650 voll in Zeile 36 (Hinweis: nur 70 %) ---
    const bewirtung = report.lines
      .find((l) => l.zeile === 36)
      ?.quellen.reduce((s, q) => s + q.betrag, 0) ?? 0;
    if (bewirtung > 0) {
      list.push({
        id: "bewirtung",
        title: "Bewirtungskosten zu 100 % gebucht",
        severity: "info",
        message:
          `Zeile 36 = ${euro.format(
            bewirtung
          )}. Die Anlage EÜR akzeptiert hier 100 %, steuerlich abzugsfähig sind jedoch nur 70 %. ` +
          "Die 30 % nicht abzugsfähigen Kosten müssen ggf. separat erfasst werden (z. B. SKR03-Konto 4654).",
      });
    }

    return list;
  }, [
    entriesQ.data,
    accountsQ.data,
    selectedYear,
    selectedMandantId,
    yearStart,
    yearEnd,
  ]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;
  const counts = useMemo(() => {
    const c = { ok: 0, info: 0, warn: 0, error: 0 };
    for (const x of checks) c[x.severity] += 1;
    return c;
  }, [checks]);

  return (
    <div className="report taxcalc">
      <header className="report__head no-print">
        <Link to="/buchfuehrung" className="report__back">
          <ArrowLeft size={16} />
          Zurück zur Buchführung
        </Link>
        <div className="report__head-title">
          <h1>
            <ShieldCheck
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Plausibilitätsprüfung EÜR
          </h1>
          <p>
            Automatische Prüfungen vor dem Export. Warnungen sind kein Beleg,
            dass die Buchführung falsch ist — sie markieren Stellen, die eine
            fachliche Prüfung verdienen.
          </p>
        </div>
      </header>

      <section className="dash__kpis">
        <article className="card dash__kpi">
          <span className="dash__kpi-label">Erfolgreich</span>
          <strong style={{ color: "var(--success)" }}>{counts.ok}</strong>
        </article>
        <article className="card dash__kpi">
          <span className="dash__kpi-label">Hinweise</span>
          <strong style={{ color: "var(--info)" }}>{counts.info}</strong>
        </article>
        <article className="card dash__kpi">
          <span className="dash__kpi-label">Warnungen</span>
          <strong style={{ color: "var(--warning)" }}>{counts.warn}</strong>
        </article>
        <article className="card dash__kpi">
          <span className="dash__kpi-label">Fehler</span>
          <strong style={{ color: "var(--danger)" }}>{counts.error}</strong>
        </article>
      </section>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Prüfe Daten …</p>
        </div>
      ) : checks.length === 0 ? (
        <div className="card taxcalc__section">
          <p style={{ color: "var(--muted)" }}>
            Keine Buchungen oder Konten zum Prüfen vorhanden.
          </p>
        </div>
      ) : (
        <ul className="plausi__list">
          {checks.map((c) => (
            <li key={c.id} className={`card plausi__item ${SEV_CLASS[c.severity]}`}>
              <div className="plausi__head">
                <span className="plausi__icon">
                  {c.severity === "ok" ? (
                    <CheckCircle2 size={18} />
                  ) : c.severity === "info" ? (
                    <Info size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </span>
                <div className="plausi__body">
                  <strong>{c.title}</strong>
                  <span className={`plausi__sev ${SEV_CLASS[c.severity]}`}>
                    {SEV_LABEL[c.severity]}
                  </span>
                  <p>{c.message}</p>
                  {c.detail && c.detail.length > 0 && (
                    <details className="plausi__detail">
                      <summary>{c.detail.length} betroffene Konten</summary>
                      <ul>
                        {c.detail.map((d) => (
                          <li key={d} className="mono">
                            {d}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
