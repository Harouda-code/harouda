import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Info,
  TrendingDown,
} from "lucide-react";
import { buildOpenItems } from "../api/opos";
import { usePermissions } from "../hooks/usePermissions";
import type { Account, JournalEntry } from "../types/db";
import "./DashboardInsights.css";

export type DashboardInsightsProps = {
  entries: JournalEntry[];
  accounts: Account[];
  /** Ergebnis der Cashflow-Heuristik (falls berechnet). */
  cashflow30?: {
    endBalance: number;
    firstNegativeDay: string | null;
  } | null;
  /** Optional überschreibbare "jetzt"-Referenz (für Tests). */
  now?: Date;
};

type Severity = "good" | "info" | "warn" | "critical";

type Insight = {
  id: string;
  severity: Severity;
  title: string;
  hint: string;
  to?: string;
  actionLabel?: string;
};

const SEV_COLOR: Record<Severity, string> = {
  good: "var(--success)",
  info: "var(--navy)",
  warn: "var(--gold-700)",
  critical: "var(--danger)",
};

function nextUstvaDeadline(now: Date): { date: Date; periodLabel: string } {
  // UStVA ist zum 10. des Folgemonats fällig. Wenn heute ≤ 10., zeigen wir
  // den 10. dieses Monats (für die Periode Vormonat). Sonst den 10. des
  // nächsten Monats (für die Periode diesen Monat).
  const day = now.getDate();
  if (day <= 10) {
    const deadline = new Date(now.getFullYear(), now.getMonth(), 10);
    const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      date: deadline,
      periodLabel: period.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      }),
    };
  }
  const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 10);
  return {
    date: deadline,
    periodLabel: now.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    }),
  };
}

function daysUntil(target: Date, from: Date): number {
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function DashboardInsights({
  entries,
  accounts,
  cashflow30,
  now,
}: DashboardInsightsProps) {
  const perms = usePermissions();
  const today = now ?? new Date();

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];

    // --- 1. Überfällige Forderungen -------------------------------------
    const openItems = buildOpenItems(entries, accounts, today);
    const overdue = openItems.filter(
      (i) => i.kind === "forderung" && i.ueberfaellig_tage > 0
    );
    if (overdue.length > 0) {
      const sum = overdue.reduce((s, i) => s + i.offen, 0);
      out.push({
        id: "overdue",
        severity: "critical",
        title: `${overdue.length} überfällige Forderung${overdue.length === 1 ? "" : "en"}`,
        hint: `Summe ${new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(sum)} — älteste ${overdue[0].ueberfaellig_tage} Tage`,
        to: "/mahnwesen",
        actionLabel: "Zum Mahnwesen",
      });
    }

    // --- 2. Entwurf-Buchungen (nur für Schreibende) ---------------------
    if (perms.canWrite) {
      const drafts = entries.filter((e) => e.status === "entwurf");
      if (drafts.length > 0) {
        out.push({
          id: "drafts",
          severity: drafts.length > 10 ? "warn" : "info",
          title: `${drafts.length} Entwurf-Buchung${drafts.length === 1 ? "" : "en"}`,
          hint:
            drafts.length > 10
              ? "Bitte prüfen und festschreiben — Entwürfe zählen nicht in Reports."
              : "Gehen nicht in Reports ein, bis sie festgeschrieben sind.",
          to: "/journal",
          actionLabel: "Zum Journal",
        });
      }
    }

    // --- 3. Nächste UStVA-Frist -----------------------------------------
    const ustva = nextUstvaDeadline(today);
    const daysToUstva = daysUntil(ustva.date, today);
    if (daysToUstva >= 0 && daysToUstva <= 21) {
      out.push({
        id: "ustva",
        severity:
          daysToUstva <= 3 ? "critical" : daysToUstva <= 7 ? "warn" : "info",
        title: `UStVA ${ustva.periodLabel} fällig in ${daysToUstva} Tag${daysToUstva === 1 ? "" : "en"}`,
        hint: `Abgabefrist: ${ustva.date.toLocaleDateString("de-DE")} · ohne Dauerfristverlängerung`,
        to: "/steuern/elster",
        actionLabel: "Zur ELSTER-Übertragung",
      });
    }

    // --- 4. Kritischer Liquiditäts-Tag ----------------------------------
    if (
      cashflow30 &&
      cashflow30.firstNegativeDay &&
      !perms.isAuditor
    ) {
      const d = new Date(cashflow30.firstNegativeDay);
      const daysOut = daysUntil(d, today);
      out.push({
        id: "cashflow-negative",
        severity: daysOut <= 7 ? "critical" : "warn",
        title: `Liquidität kritisch ab ${d.toLocaleDateString("de-DE")}`,
        hint: `${daysOut === 0 ? "heute" : `in ${daysOut} Tagen`} rutscht der Saldo unter 0 — Projektion auf 30 Tage.`,
        to: "/liquiditaet",
        actionLabel: "Vorschau öffnen",
      });
    }

    // --- 5. Alles gut — positive Rückmeldung wenn nichts zu tun ist -----
    if (out.length === 0) {
      out.push({
        id: "all-clear",
        severity: "good",
        title: "Keine offenen Punkte",
        hint: "Alle erkannten Metriken im grünen Bereich.",
      });
    }

    return out.slice(0, 5);
  }, [entries, accounts, today, perms.canWrite, perms.isAuditor, cashflow30]);

  return (
    <section className="dinsights" aria-label="Dashboard-Hinweise">
      {insights.map((ins) => (
        <InsightCard key={ins.id} insight={ins} />
      ))}
    </section>
  );
}

function InsightCard({ insight: i }: { insight: Insight }) {
  const Icon =
    i.severity === "good"
      ? CheckCircle2
      : i.severity === "critical"
        ? AlertTriangle
        : i.severity === "warn"
          ? TrendingDown
          : i.id === "ustva"
            ? Calendar
            : Info;
  const content = (
    <>
      <Icon
        size={16}
        style={{ color: SEV_COLOR[i.severity], flexShrink: 0 }}
      />
      <div className="dinsights__text">
        <strong>{i.title}</strong>
        <small>{i.hint}</small>
      </div>
      {i.to && i.actionLabel && (
        <span className="dinsights__action">
          {i.actionLabel}
          <ArrowRight size={12} />
        </span>
      )}
    </>
  );
  return i.to ? (
    <Link
      to={i.to}
      className={`dinsights__item is-${i.severity}`}
      style={{ borderLeftColor: SEV_COLOR[i.severity] }}
    >
      {content}
    </Link>
  ) : (
    <div
      className={`dinsights__item is-${i.severity}`}
      style={{ borderLeftColor: SEV_COLOR[i.severity] }}
    >
      {content}
    </div>
  );
}
