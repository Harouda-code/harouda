// Plausibilitätsprüfungen für USt-Voranmeldungen, die VOR dem ELSTER-XML-Export
// laufen sollten. Keine ERiC-Integration (das bräuchte native Bibliotheken und
// Lizenzvertrag mit der Finanzverwaltung). Das sind regelbasierte Checks gegen
// den Journal-Auszug und die Settings.

import type { JournalEntry } from "../types/db";
import type { UstvaReport } from "../api/reports";

export type PlausiSeverity = "error" | "warn" | "info";

export type PlausiIssue = {
  severity: PlausiSeverity;
  code: string;
  message: string;
  hint?: string;
};

export type PlausiContext = {
  year: number;
  month: number; // 1..12
  period: { start: string; end: string };
  entries: JournalEntry[];
  report: UstvaReport;
  settings: {
    steuernummer: string;
    beraterNr: string;
    kanzleiName: string;
    kleinunternehmer: boolean;
  };
};

// ---------------------------------------------------------------------------
// Utility: ungefähre Verhältnisprüfung, ohne bei leeren Monaten zu alarmieren
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function between(n: number, lo: number, hi: number): boolean {
  return n >= lo && n <= hi;
}

// ---------------------------------------------------------------------------
// Einzelprüfungen
// ---------------------------------------------------------------------------

function checkStammdaten(ctx: PlausiContext): PlausiIssue[] {
  const issues: PlausiIssue[] = [];
  if (!ctx.settings.steuernummer.trim()) {
    issues.push({
      severity: "error",
      code: "STAMM_STEUERNUMMER",
      message: "Steuernummer fehlt in den Kanzlei-Stammdaten.",
      hint: "Unter Einstellungen → Steuer- & ELSTER-Kennungen eintragen.",
    });
  }
  if (!ctx.settings.kanzleiName.trim()) {
    issues.push({
      severity: "warn",
      code: "STAMM_KANZLEI_NAME",
      message: "Kein Kanzlei-/Firmenname gesetzt — das ELSTER-XML enthält leere Angaben.",
    });
  }
  return issues;
}

function checkPeriod(ctx: PlausiContext): PlausiIssue[] {
  const issues: PlausiIssue[] = [];
  const now = new Date();
  const periodEnd = new Date(ctx.period.end);

  if (ctx.month < 1 || ctx.month > 12) {
    issues.push({
      severity: "error",
      code: "PERIOD_MONTH",
      message: `Ungültiger Monat: ${ctx.month}.`,
    });
  }

  if (periodEnd > now) {
    issues.push({
      severity: "warn",
      code: "PERIOD_FUTURE",
      message: `Der gewählte Zeitraum endet in der Zukunft (${ctx.period.end}).`,
      hint: "UStVA wird frühestens am Periodenende abgegeben (monatlich 10. Folgemonat).",
    });
  }

  // UStVA-Abgabefrist: 10. Folgemonat
  const deadline = new Date(ctx.year, ctx.month, 10);
  if (deadline < now) {
    const daysLate = Math.floor(
      (now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLate > 0) {
      issues.push({
        severity: "warn",
        code: "PERIOD_OVERDUE",
        message: `Abgabefrist war der ${deadline.toLocaleDateString("de-DE")} — ${daysLate} Tage überfällig.`,
        hint: "Dauerfristverlängerung? Säumniszuschläge nach § 152 AO möglich.",
      });
    }
  }

  return issues;
}

function checkEntries(ctx: PlausiContext): PlausiIssue[] {
  const issues: PlausiIssue[] = [];
  const drafts = ctx.entries.filter((e) => e.status === "entwurf");
  if (drafts.length > 0) {
    issues.push({
      severity: "error",
      code: "JOURNAL_DRAFTS",
      message: `${drafts.length} Entwurf-Buchungen im Zeitraum — bitte zuerst festschreiben.`,
      hint: "Entwürfe werden nicht in die UStVA aufgenommen.",
    });
  }

  const unreconciled = ctx.entries.filter((e) => !e.ust_satz && Number(e.betrag) > 0);
  if (unreconciled.length > 5) {
    issues.push({
      severity: "info",
      code: "JOURNAL_NO_UST",
      message: `${unreconciled.length} Buchungen ohne USt-Satz im Zeitraum.`,
      hint: "Nicht jede Buchung braucht USt — aber bitte prüfen, ob versehentlich fehlt.",
    });
  }

  return issues;
}

function checkAmountsReasonable(ctx: PlausiContext): PlausiIssue[] {
  const issues: PlausiIssue[] = [];
  const { report } = ctx;

  // Alles leer?
  if (
    report.kz81 === 0 &&
    report.kz86 === 0 &&
    report.kz48 === 0 &&
    report.kz66 === 0
  ) {
    if (ctx.settings.kleinunternehmer) {
      issues.push({
        severity: "info",
        code: "KLEIN_NULL",
        message: "Kein Umsatz und keine Vorsteuer — für Kleinunternehmer regulär.",
      });
    } else {
      issues.push({
        severity: "warn",
        code: "NULL_UMSATZ",
        message: "Keine Umsätze und keine Vorsteuer im Zeitraum.",
        hint: "Nullmeldung ist zulässig, aber prüfen Sie, ob Buchungen für den Zeitraum fehlen.",
      });
    }
    return issues;
  }

  // USt-Plausibilität: USt19 = Kz81 * 0,19 (±1 €)
  const expectedUst19 = round2(report.kz81 * 0.19);
  if (Math.abs(report.ust19 - expectedUst19) > 1) {
    issues.push({
      severity: "warn",
      code: "UST19_MISMATCH",
      message: `Umsatzsteuer 19 % (${report.ust19.toFixed(
        2
      )} €) weicht vom erwarteten Wert ${expectedUst19.toFixed(2)} € ab.`,
      hint: "Differenz kann durch Rundungen entstehen; bei großer Abweichung Konten-Zuordnung prüfen.",
    });
  }
  const expectedUst7 = round2(report.kz86 * 0.07);
  if (Math.abs(report.ust7 - expectedUst7) > 1) {
    issues.push({
      severity: "warn",
      code: "UST7_MISMATCH",
      message: `Umsatzsteuer 7 % (${report.ust7.toFixed(
        2
      )} €) weicht vom erwarteten Wert ${expectedUst7.toFixed(2)} € ab.`,
    });
  }

  // Vorsteuer-Überhang: wenn Vorsteuer > 2x USt, Auffälligkeit
  const totalUst = report.ust19 + report.ust7;
  if (report.kz66 > totalUst * 2 && totalUst > 0) {
    issues.push({
      severity: "info",
      code: "VORSTEUER_OVERHANG",
      message: `Vorsteuer (${report.kz66.toFixed(
        2
      )} €) übersteigt die Umsatzsteuer (${totalUst.toFixed(2)} €) um mehr als das Doppelte.`,
      hint: "Investitionsperiode? Andernfalls Konten prüfen.",
    });
  }

  // Unplausibel hohe Einzelwerte
  const ranges: [keyof UstvaReport, number, number, string][] = [
    ["kz81", -1, 10_000_000, "Umsätze 19 %"],
    ["kz86", -1, 10_000_000, "Umsätze 7 %"],
    ["kz66", -1, 5_000_000, "Vorsteuer"],
  ];
  for (const [key, lo, hi, label] of ranges) {
    const v = report[key];
    if (!between(v, lo, hi)) {
      issues.push({
        severity: "warn",
        code: `RANGE_${key.toUpperCase()}`,
        message: `${label}: ${v.toFixed(2)} € liegt außerhalb des plausiblen Bereichs.`,
      });
    }
  }

  // Kleinunternehmer mit Umsatzsteuer ausgewiesen = Widerspruch
  if (ctx.settings.kleinunternehmer && (report.ust19 > 0 || report.ust7 > 0)) {
    issues.push({
      severity: "error",
      code: "KLEIN_UST_WIDERSPRUCH",
      message:
        "Kleinunternehmer-Regelung (§ 19 UStG) ist aktiv, aber es wurde Umsatzsteuer ausgewiesen.",
      hint:
        "Entweder Kleinunternehmer-Flag in den Einstellungen entfernen oder Buchungen überprüfen.",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type PlausiResult = {
  ok: boolean;
  blockers: number;
  warnings: number;
  infos: number;
  issues: PlausiIssue[];
};

export function checkUstvaPlausi(ctx: PlausiContext): PlausiResult {
  const issues: PlausiIssue[] = [
    ...checkStammdaten(ctx),
    ...checkPeriod(ctx),
    ...checkEntries(ctx),
    ...checkAmountsReasonable(ctx),
  ];
  const blockers = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warn").length;
  const infos = issues.filter((i) => i.severity === "info").length;
  return { ok: blockers === 0, blockers, warnings, infos, issues };
}
