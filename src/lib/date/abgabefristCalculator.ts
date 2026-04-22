/**
 * Abgabefrist für Umsatzsteuer-Voranmeldung (§ 18 Abs. 2 UStG).
 *
 * Standard: 10. Tag des Folgemonats nach Voranmeldungszeitraum.
 * Mit Dauerfristverlängerung (§ 18 Abs. 6 UStG + UStDV § 46-48):
 *   + 1 weiterer Monat.
 *
 * Wochenend-Rollover nach § 108 Abs. 3 AO: Fällt die Frist auf Samstag,
 * Sonntag oder einen gesetzlichen Feiertag, verschiebt sich die Frist
 * auf den nächsten Werktag. Für MVP wird nur Wochenende berücksichtigt
 * (länderspezifische Feiertage sind out of scope — gelistet in README).
 */

export type VoranmeldungsArt = "MONAT" | "QUARTAL";

export type Periode = {
  jahr: number;
  art: VoranmeldungsArt;
  /** Pflicht bei MONAT (1-12). */
  monat?: number;
  /** Pflicht bei QUARTAL (1-4). */
  quartal?: 1 | 2 | 3 | 4;
};

/** Letzter Tag des Voranmeldungszeitraums als YYYY-MM-DD. */
export function periodEnd(p: Periode): string {
  if (p.art === "MONAT") {
    if (!p.monat || p.monat < 1 || p.monat > 12) {
      throw new Error(`ungültiger Monat: ${p.monat}`);
    }
    const d = new Date(p.jahr, p.monat, 0); // day 0 = last day of (monat)
    return isoDate(d);
  }
  if (!p.quartal || p.quartal < 1 || p.quartal > 4) {
    throw new Error(`ungültiges Quartal: ${p.quartal}`);
  }
  const lastMonat = p.quartal * 3; // Q1→3, Q2→6, Q3→9, Q4→12
  const d = new Date(p.jahr, lastMonat, 0);
  return isoDate(d);
}

/** Erster Tag des Voranmeldungszeitraums als YYYY-MM-DD. */
export function periodStart(p: Periode): string {
  if (p.art === "MONAT") {
    const mm = String(p.monat!).padStart(2, "0");
    return `${p.jahr}-${mm}-01`;
  }
  const firstMonat = (p.quartal! - 1) * 3 + 1; // Q1→1, Q2→4, Q3→7, Q4→10
  const mm = String(firstMonat).padStart(2, "0");
  return `${p.jahr}-${mm}-01`;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Verschiebt ein Datum auf den nächsten Werktag (Mo-Fr). */
function shiftToNextWeekday(d: Date): Date {
  const out = new Date(d);
  while (out.getDay() === 0 || out.getDay() === 6) {
    out.setDate(out.getDate() + 1);
  }
  return out;
}

/** Berechnet die Abgabefrist nach § 18 UStG. */
export function calculateUstvaAbgabefrist(
  periode: Periode,
  dauerfristverlaengerung: boolean
): Date {
  // 10. Tag des Folgemonats nach Periodenende
  const endIso = periodEnd(periode);
  // endIso ist letzter Tag der Periode. Folgemonat = Monat + 1.
  const endParts = endIso.split("-").map((s) => Number(s));
  // Start: 10. des Folgemonats
  let abgabe = new Date(endParts[0], endParts[1], 10); // endParts[1] ist 1-12; Date-Month 0-indexed → +1 durch 1-12 direkt gepasst
  // Fix: endParts[1] is 1-12 from iso; Date month-param is 0-11.
  // Example: endIso=2025-10-31 → endParts[1]=10 → new Date(2025, 10, 10) = Nov 10, 2025 ✓
  if (dauerfristverlaengerung) {
    abgabe = new Date(
      abgabe.getFullYear(),
      abgabe.getMonth() + 1,
      abgabe.getDate()
    );
  }
  return shiftToNextWeekday(abgabe);
}

/** Formatiert ein Datum als DD.MM.YYYY (DE-Formular-Format). */
export function formatGermanDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

/** Gibt YYYY-MM-DD zurück (ISO). */
export function formatIso(d: Date): string {
  return isoDate(d);
}

/** Anzahl Tage bis Abgabefrist (negativ = überfällig). */
export function daysUntil(abgabe: Date, now = new Date()): number {
  const a = new Date(abgabe);
  a.setHours(0, 0, 0, 0);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - n.getTime()) / (1000 * 60 * 60 * 24));
}

/** Bezeichnung des Zeitraums, z. B. "Oktober 2025" / "Q3 2025". */
export function periodeLabel(p: Periode): string {
  const monate = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  if (p.art === "MONAT") return `${monate[p.monat! - 1]} ${p.jahr}`;
  return `Q${p.quartal} ${p.jahr}`;
}
