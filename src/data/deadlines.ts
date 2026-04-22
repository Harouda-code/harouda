// Laufende Steuerfristen in Deutschland.
//
// Die Generierung ist rein kalendarisch; Wochenend-Verschiebung nach
// § 108 Abs. 3 AO wird angewandt. Feiertage (je Bundesland unterschiedlich)
// werden bewusst NICHT berücksichtigt — prüfen Sie kurzfristige Termine
// stets gegen den echten Fristenkalender Ihrer zuständigen Finanzbehörde.

export type DeadlineKind =
  | "ustva"
  | "ustva-quartal"
  | "est-voraus"
  | "kst-voraus"
  | "gewst-voraus"
  | "est-erklaerung"
  | "gewst-erklaerung"
  | "kst-erklaerung"
  | "zm";

export type Deadline = {
  id: string;
  kind: DeadlineKind;
  titel: string;
  detail: string;
  faellig: Date;
  period: string;
};

const LABEL: Record<DeadlineKind, { titel: string; detail: string }> = {
  ustva: {
    titel: "UStVA",
    detail: "Umsatzsteuer-Voranmeldung (monatlich, 10. Folgemonat)",
  },
  "ustva-quartal": {
    titel: "UStVA (Quartal)",
    detail: "Umsatzsteuer-Voranmeldung (quartalsweise, 10. Folgemonat)",
  },
  "est-voraus": {
    titel: "ESt-Vorauszahlung",
    detail: "Einkommensteuer-Vorauszahlung",
  },
  "kst-voraus": {
    titel: "KSt-Vorauszahlung",
    detail: "Körperschaftsteuer-Vorauszahlung",
  },
  "gewst-voraus": {
    titel: "GewSt-Vorauszahlung",
    detail: "Gewerbesteuer-Vorauszahlung",
  },
  "est-erklaerung": {
    titel: "ESt-Erklärung",
    detail: "Einkommensteuer-Erklärung (31.07. des Folgejahres, mit StB: Ende Feb. + 2 Jahre)",
  },
  "gewst-erklaerung": {
    titel: "GewSt-Erklärung",
    detail: "Gewerbesteuererklärung (31.07.)",
  },
  "kst-erklaerung": {
    titel: "KSt-Erklärung",
    detail: "Körperschaftsteuererklärung (31.07.)",
  },
  zm: {
    titel: "Zusammenfassende Meldung",
    detail: "ZM (monatlich/quartalsweise, 25. Folgemonat)",
  },
};

function shiftWeekend(d: Date): Date {
  const day = d.getDay();
  if (day === 6) {
    // Samstag → Montag
    const next = new Date(d);
    next.setDate(d.getDate() + 2);
    return next;
  }
  if (day === 0) {
    // Sonntag → Montag
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    return next;
  }
  return d;
}

function mkId(kind: DeadlineKind, period: string): string {
  return `${kind}:${period}`;
}

function monthLabel(year: number, monthIdx0: number): string {
  return new Date(year, monthIdx0, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

export type DeadlineOptions = {
  /** Dauerfristverlängerung für UStVA (+1 Monat) */
  dauerfristverlaengerung: boolean;
  /** Monatlich oder quartalsweise UStVA */
  ustVaRhythmus: "monat" | "quartal";
  /** Mandant ist Körperschaft (GmbH/UG/AG) */
  istKoerperschaft: boolean;
  /** Für Gewerbetreibende: GewSt-Vorauszahlungen */
  hatGewerbe: boolean;
  /** Für Selbständige: ESt-Vorauszahlungen */
  hatEstVoraus: boolean;
};

export const DEFAULT_DEADLINE_OPTIONS: DeadlineOptions = {
  dauerfristverlaengerung: false,
  ustVaRhythmus: "monat",
  istKoerperschaft: false,
  hatGewerbe: true,
  hatEstVoraus: true,
};

/**
 * Generiert alle Fristen in einem Fenster [from, to].
 */
export function generateDeadlines(
  from: Date,
  to: Date,
  opts: DeadlineOptions
): Deadline[] {
  const out: Deadline[] = [];
  const startYear = from.getFullYear();
  const endYear = to.getFullYear();

  for (let y = startYear - 1; y <= endYear + 1; y++) {
    // UStVA — monatlich
    if (opts.ustVaRhythmus === "monat") {
      for (let m = 0; m < 12; m++) {
        const due = shiftWeekend(
          new Date(y, m + 1 + (opts.dauerfristverlaengerung ? 1 : 0), 10)
        );
        const period = `${y}-${String(m + 1).padStart(2, "0")}`;
        out.push({
          id: mkId("ustva", period),
          kind: "ustva",
          titel: `UStVA ${monthLabel(y, m)}`,
          detail:
            LABEL.ustva.detail +
            (opts.dauerfristverlaengerung
              ? " · Dauerfristverlängerung aktiv"
              : ""),
          faellig: due,
          period,
        });
      }
    } else {
      // Quartalsweise: 10. des dem Quartal folgenden Monats
      for (let q = 1; q <= 4; q++) {
        const quarterEndMonth = q * 3; // März, Juni, Sept, Dez
        const dueMonth =
          quarterEndMonth + (opts.dauerfristverlaengerung ? 1 : 0); // Monat nach Quartal (+1 mit Dauerfrist)
        const due = shiftWeekend(new Date(y, dueMonth, 10));
        const period = `${y}-Q${q}`;
        out.push({
          id: mkId("ustva-quartal", period),
          kind: "ustva-quartal",
          titel: `UStVA ${q}. Quartal ${y}`,
          detail: LABEL["ustva-quartal"].detail,
          faellig: due,
          period,
        });
      }
    }

    // Zusammenfassende Meldung (ZM): 25. des Folgemonats (monatlich)
    for (let m = 0; m < 12; m++) {
      const due = shiftWeekend(new Date(y, m + 1, 25));
      out.push({
        id: mkId("zm", `${y}-${String(m + 1).padStart(2, "0")}`),
        kind: "zm",
        titel: `Zusammenfassende Meldung ${monthLabel(y, m)}`,
        detail: LABEL.zm.detail,
        faellig: due,
        period: `${y}-${String(m + 1).padStart(2, "0")}`,
      });
    }

    // Gewerbesteuer-Vorauszahlungen 15.02 / 15.05 / 15.08 / 15.11
    if (opts.hatGewerbe) {
      for (const m of [1, 4, 7, 10]) {
        const due = shiftWeekend(new Date(y, m, 15));
        out.push({
          id: mkId("gewst-voraus", `${y}-${String(m + 1).padStart(2, "0")}`),
          kind: "gewst-voraus",
          titel: `GewSt-Vorauszahlung ${monthLabel(y, m)}`,
          detail: LABEL["gewst-voraus"].detail,
          faellig: due,
          period: `${y}-${String(m + 1).padStart(2, "0")}`,
        });
      }
    }

    // ESt-Vorauszahlungen 10.03 / 10.06 / 10.09 / 10.12
    if (opts.hatEstVoraus) {
      for (const m of [2, 5, 8, 11]) {
        const due = shiftWeekend(new Date(y, m, 10));
        out.push({
          id: mkId("est-voraus", `${y}-${String(m + 1).padStart(2, "0")}`),
          kind: "est-voraus",
          titel: `ESt-Vorauszahlung ${monthLabel(y, m)}`,
          detail: LABEL["est-voraus"].detail,
          faellig: due,
          period: `${y}-${String(m + 1).padStart(2, "0")}`,
        });
      }
    }

    // KSt-Vorauszahlungen (wie ESt) — nur bei Körperschaften
    if (opts.istKoerperschaft) {
      for (const m of [2, 5, 8, 11]) {
        const due = shiftWeekend(new Date(y, m, 10));
        out.push({
          id: mkId("kst-voraus", `${y}-${String(m + 1).padStart(2, "0")}`),
          kind: "kst-voraus",
          titel: `KSt-Vorauszahlung ${monthLabel(y, m)}`,
          detail: LABEL["kst-voraus"].detail,
          faellig: due,
          period: `${y}-${String(m + 1).padStart(2, "0")}`,
        });
      }
    }

    // Jährliche Erklärungen: Abgabe am 31.07. des Folgejahres
    const annualDue = shiftWeekend(new Date(y + 1, 6, 31)); // Juli
    out.push({
      id: mkId("est-erklaerung", String(y)),
      kind: "est-erklaerung",
      titel: `ESt-Erklärung ${y}`,
      detail: LABEL["est-erklaerung"].detail,
      faellig: annualDue,
      period: String(y),
    });
    if (opts.hatGewerbe) {
      out.push({
        id: mkId("gewst-erklaerung", String(y)),
        kind: "gewst-erklaerung",
        titel: `GewSt-Erklärung ${y}`,
        detail: LABEL["gewst-erklaerung"].detail,
        faellig: annualDue,
        period: String(y),
      });
    }
    if (opts.istKoerperschaft) {
      out.push({
        id: mkId("kst-erklaerung", String(y)),
        kind: "kst-erklaerung",
        titel: `KSt-Erklärung ${y}`,
        detail: LABEL["kst-erklaerung"].detail,
        faellig: annualDue,
        period: String(y),
      });
    }
  }

  return out
    .filter((d) => d.faellig >= from && d.faellig <= to)
    .sort((a, b) => a.faellig.getTime() - b.faellig.getTime());
}

// --- "Erledigt"-Markierung per localStorage ----------------------------------

const DONE_KEY = "harouda:deadlines-done";

export function loadDoneIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setDone(id: string, done: boolean) {
  const set = loadDoneIds();
  if (done) set.add(id);
  else set.delete(id);
  localStorage.setItem(DONE_KEY, JSON.stringify([...set]));
}
