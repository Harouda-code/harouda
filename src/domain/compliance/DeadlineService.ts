/**
 * Compliance-Deadline-Service: Berechnet alle relevanten Abgabefristen
 * für ein Mandat (UStVA, LStA, ZM, E-Bilanz, Jahresabschluss) relativ
 * zu einem Stichtag.
 *
 * Grundlagen:
 *   - § 18 UStG (UStVA): 10. des Folgemonats (+1M Dauerfrist)
 *   - § 41a EStG (LStA): 10. des Folgemonats
 *   - § 18a UStG (ZM): 25. des Folgemonats / Quartalsendes
 *   - § 5b EStG (E-Bilanz): bis 5 Monate nach WJ-Ende
 *   - § 325 HGB (Jahresabschluss-Offenlegung): 12 Monate nach WJ-Ende
 *
 * Werktagsverschiebung analog § 108 Abs. 3 AO (nur Wochenende im MVP).
 */

import { calculateUstvaAbgabefrist } from "../../lib/date/abgabefristCalculator";

export type DeadlineType =
  | "USTVA"
  | "LSTA"
  | "ZM"
  | "EBILANZ"
  | "JAHRESABSCHLUSS";

export type DeadlineStatus = "GREEN" | "YELLOW" | "RED";

export type UpcomingDeadline = {
  type: DeadlineType;
  zeitraum: string; // z. B. "10/2025", "Q3/2025", "WJ 2025"
  frist: Date;
  daysRemaining: number; // negativ = überfällig
  status: DeadlineStatus;
  route: string;
  label: string;
  hinweis?: string;
};

const DAY_MS = 86400000;

function daysBetween(later: Date, earlier: Date): number {
  // Midnight-normalized for stable day-count
  const a = new Date(later);
  a.setHours(0, 0, 0, 0);
  const b = new Date(earlier);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

function statusFor(frist: Date, now: Date): DeadlineStatus {
  const days = daysBetween(frist, now);
  if (days < 0) return "RED";
  if (days <= 7) return "YELLOW";
  return "GREEN";
}

function nextMonth(year: number, month0: number): { year: number; month1: number } {
  // month0 = 0-11. Gibt year + 1-based month des Folgemonats.
  const d = new Date(year, month0 + 1, 1);
  return { year: d.getFullYear(), month1: d.getMonth() + 1 };
}

function ustvaDeadlineFor(year: number, month1: number, now: Date): UpcomingDeadline {
  const frist = calculateUstvaAbgabefrist(
    { art: "MONAT", jahr: year, monat: month1 },
    false
  );
  return {
    type: "USTVA",
    zeitraum: `${String(month1).padStart(2, "0")}/${year}`,
    frist,
    daysRemaining: daysBetween(frist, now),
    status: statusFor(frist, now),
    route: "/steuer/ustva",
    label: "UStVA",
  };
}

function lstaDeadlineFor(year: number, month1: number, now: Date): UpcomingDeadline {
  const frist = calculateUstvaAbgabefrist(
    { art: "MONAT", jahr: year, monat: month1 },
    false
  );
  return {
    type: "LSTA",
    zeitraum: `${String(month1).padStart(2, "0")}/${year}`,
    frist,
    daysRemaining: daysBetween(frist, now),
    status: statusFor(frist, now),
    route: "/lohn/lohnsteueranmeldung",
    label: "Lohnsteuer-Anmeldung",
  };
}

/** ZM: 25. Tag des Folgemonats nach Quartals-Ende (§ 18a Abs. 1 UStG). */
function zmDeadlineForQuarter(
  year: number,
  quartal: 1 | 2 | 3 | 4,
  now: Date
): UpcomingDeadline {
  // Quartalsende-Monat: Q1=3, Q2=6, Q3=9, Q4=12
  const endMonat = quartal * 3;
  // 25. des Folgemonats; Folgemonat = endMonat + 1 (bei 12 → nächstes Jahr Januar)
  let followYear = year;
  let followMonth0 = endMonat; // endMonat ist 1-12; Date-Monat 0-11. endMonat als Monat-Index = Folgemonat.
  if (endMonat === 12) {
    followYear = year + 1;
    followMonth0 = 0;
  }
  let frist = new Date(followYear, followMonth0, 25);
  // Wochenend-Rollover
  while (frist.getDay() === 0 || frist.getDay() === 6) {
    frist = new Date(frist.getFullYear(), frist.getMonth(), frist.getDate() + 1);
  }
  return {
    type: "ZM",
    zeitraum: `Q${quartal}/${year}`,
    frist,
    daysRemaining: daysBetween(frist, now),
    status: statusFor(frist, now),
    route: "/steuer/zm",
    label: "Zusammenfassende Meldung",
  };
}

/** E-Bilanz: 5 Monate nach Wirtschaftsjahr-Ende (§ 149 AO i. V. m. § 5b EStG). */
function ebilanzDeadlineFor(wjEndYear: number, now: Date): UpcomingDeadline {
  // WJ-Ende normalerweise 31.12.; Frist = 31.05. des Folgejahres
  const frist = new Date(wjEndYear + 1, 4, 31); // month 4 = Mai
  return {
    type: "EBILANZ",
    zeitraum: `WJ ${wjEndYear}`,
    frist,
    daysRemaining: daysBetween(frist, now),
    status: statusFor(frist, now),
    route: "/steuer/ebilanz",
    label: "E-Bilanz",
    hinweis: "Verlängerung auf bis zu 14 Monate per § 109 AO möglich",
  };
}

/** Jahresabschluss-Offenlegung (§ 325 HGB): 12 Monate nach WJ-Ende. */
function jahresabschlussDeadlineFor(wjEndYear: number, now: Date): UpcomingDeadline {
  const frist = new Date(wjEndYear + 1, 11, 31); // 31.12. Folgejahr
  return {
    type: "JAHRESABSCHLUSS",
    zeitraum: `WJ ${wjEndYear}`,
    frist,
    daysRemaining: daysBetween(frist, now),
    status: statusFor(frist, now),
    route: "/berichte/jahresabschluss",
    label: "Jahresabschluss-Offenlegung",
    hinweis: "Kleinstkapitalgesellschaften verkürzt (§ 326 HGB)",
  };
}

export class DeadlineService {
  /**
   * Berechnet die nächsten anstehenden Fristen. Wir liefern:
   *   - UStVA + LStA für den letzten abgelaufenen Monat UND den aktuellen Monat
   *   - ZM für das letzte abgelaufene Quartal
   *   - E-Bilanz + JA für das letzte abgeschlossene WJ
   * Sortiert aufsteigend nach frist.
   */
  getUpcomingDeadlines(referenceDate: Date = new Date()): UpcomingDeadline[] {
    const result: UpcomingDeadline[] = [];

    const now = referenceDate;
    const thisYear = now.getFullYear();
    const thisMonth0 = now.getMonth();

    // 1) UStVA / LStA für letzten abgelaufenen Monat
    const prev = nextMonth(thisYear, thisMonth0 - 2); // letzter voll abgeschlossener
    result.push(ustvaDeadlineFor(prev.year, prev.month1, now));
    result.push(lstaDeadlineFor(prev.year, prev.month1, now));

    // 2) UStVA / LStA für aktuellen Monat (wenn noch nicht vorbei)
    const cur = nextMonth(thisYear, thisMonth0 - 1);
    result.push(ustvaDeadlineFor(cur.year, cur.month1, now));
    result.push(lstaDeadlineFor(cur.year, cur.month1, now));

    // 3) ZM für letztes abgeschlossenes Quartal
    const currentQ = (Math.floor(thisMonth0 / 3) + 1) as 1 | 2 | 3 | 4;
    const lastQ = currentQ === 1 ? 4 : ((currentQ - 1) as 1 | 2 | 3 | 4);
    const zmYear = currentQ === 1 ? thisYear - 1 : thisYear;
    result.push(zmDeadlineForQuarter(zmYear, lastQ, now));

    // 4) E-Bilanz für letztes abgeschlossenes Kalenderjahr (WJ = Kalenderjahr)
    result.push(ebilanzDeadlineFor(thisYear - 1, now));

    // 5) Jahresabschluss-Offenlegung (Vorjahr)
    result.push(jahresabschlussDeadlineFor(thisYear - 1, now));

    return result.sort((a, b) => a.frist.getTime() - b.frist.getTime());
  }
}
