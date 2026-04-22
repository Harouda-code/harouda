// Natürliche-Sprache-Query-Parser für deutsche Finanz-Suchbegriffe.
//
// Ehrlicher Scope: REIN REGELBASIERT. Kein NLP, keine Tokenisierung über
// Wortformen, keine Embedding-Ähnlichkeit. Reguläre Ausdrücke + kleines
// Wörterbuch. Erkennt die gängigsten Muster im deutschen Buchhaltungs-Alltag.
//
// Rückgabe:
//   {
//     filters: { amountMin?, amountMax?, dateFrom?, dateTo?,
//                status?, gegenseite?, residual? },
//     translation: "Lesbare Zusammenfassung, die das UI anzeigen kann."
//   }
//
// "residual" ist der Teil der Query, der NACH allem Parsing übrig blieb —
// typischerweise der Freitext-Suchbegriff, der dann in der linearen Suche
// über die Entitäten verwendet werden sollte.

export type NlFilters = {
  amountMin?: number;
  amountMax?: number;
  dateFrom?: string; // ISO YYYY-MM-DD
  dateTo?: string; // ISO YYYY-MM-DD
  status?: "entwurf" | "gebucht" | "offen" | "ueberfaellig";
  gegenseite?: string;
  residual: string;
};

export type NlParseResult = {
  filters: NlFilters;
  translation: string;
};

function parseGermanNumber(s: string): number | null {
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Mo=0 … So=6
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return x;
}

// ---------------------------------------------------------------------------
// Einzelne Erkenner. Jeder nimmt den aktuellen Query-String, zieht Treffer
// heraus und gibt das zurück, was übrig blieb, plus die extrahierte Info.
// ---------------------------------------------------------------------------

function pickAmount(query: string): {
  remaining: string;
  min?: number;
  max?: number;
  note?: string;
} {
  // "über 1000", "mehr als 500", ">1000", "größer 500"
  const overRe = /\b(?:über|ueber|mehr\s+als|größer\s+als?|groesser\s+als?|>\s*)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i;
  const underRe = /\b(?:unter|weniger\s+als|kleiner\s+als?|<\s*)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i;
  const betweenRe = /\bzwischen\s+(\d+(?:,\d{1,2})?)\s+und\s+(\d+(?:,\d{1,2})?)/i;

  let remaining = query;
  let min: number | undefined;
  let max: number | undefined;
  let note: string | undefined;

  const bm = betweenRe.exec(remaining);
  if (bm) {
    const a = parseGermanNumber(bm[1]);
    const b = parseGermanNumber(bm[2]);
    if (a !== null && b !== null) {
      min = Math.min(a, b);
      max = Math.max(a, b);
      note = `${min.toFixed(2)} € – ${max.toFixed(2)} €`;
    }
    remaining = remaining.replace(betweenRe, " ").trim();
  } else {
    const om = overRe.exec(remaining);
    if (om) {
      const n = parseGermanNumber(om[1]);
      if (n !== null) {
        min = n;
        note = `> ${n.toFixed(2)} €`;
      }
      remaining = remaining.replace(overRe, " ").trim();
    }
    const um = underRe.exec(remaining);
    if (um) {
      const n = parseGermanNumber(um[1]);
      if (n !== null) {
        max = n;
        note = note ? `${note}, < ${n.toFixed(2)} €` : `< ${n.toFixed(2)} €`;
      }
      remaining = remaining.replace(underRe, " ").trim();
    }
  }

  return { remaining, min, max, note };
}

function pickDate(
  query: string,
  now: Date = new Date()
): {
  remaining: string;
  from?: string;
  to?: string;
  note?: string;
} {
  let remaining = query;
  let from: string | undefined;
  let to: string | undefined;
  let note: string | undefined;

  const relatives: { re: RegExp; setup: () => { from: Date; to: Date; label: string } }[] = [
    {
      re: /\bheute\b/i,
      setup: () => ({ from: startOfDay(now), to: endOfDay(now), label: "heute" }),
    },
    {
      re: /\bgestern\b/i,
      setup: () => {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return { from: startOfDay(y), to: endOfDay(y), label: "gestern" };
      },
    },
    {
      re: /\bdiese\s+Woche\b/i,
      setup: () => ({
        from: startOfWeek(now),
        to: endOfDay(now),
        label: "diese Woche",
      }),
    },
    {
      re: /\bletzte[rn]?\s+Woche\b/i,
      setup: () => {
        const lw = startOfWeek(now);
        lw.setDate(lw.getDate() - 7);
        const end = new Date(lw);
        end.setDate(end.getDate() + 6);
        return { from: lw, to: endOfDay(end), label: "letzte Woche" };
      },
    },
    {
      re: /\bdiese[rnm]?\s+Monat\b/i,
      setup: () => ({
        from: startOfMonth(now),
        to: endOfDay(now),
        label: "diesen Monat",
      }),
    },
    {
      re: /\bletzte[rn]?\s+Monat\b/i,
      setup: () => {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          from: startOfMonth(lm),
          to: endOfMonth(lm),
          label: "letzten Monat",
        };
      },
    },
    {
      re: /\bdieses\s+Jahr\b/i,
      setup: () => {
        const s = new Date(now.getFullYear(), 0, 1);
        return { from: s, to: endOfDay(now), label: "dieses Jahr" };
      },
    },
  ];

  for (const { re, setup } of relatives) {
    if (re.test(remaining)) {
      const s = setup();
      from = iso(s.from);
      to = iso(s.to);
      note = s.label;
      remaining = remaining.replace(re, " ").trim();
      return { remaining, from, to, note };
    }
  }

  // "Q1 2026", "Q1", "Quartal 2 2025"
  const qRe = /\b(?:Q|Quartal\s*)\s*([1-4])(?:\s*(\d{4}))?\b/i;
  const qm = qRe.exec(remaining);
  if (qm) {
    const quarter = Number(qm[1]);
    const year = qm[2] ? Number(qm[2]) : now.getFullYear();
    const startMonth = (quarter - 1) * 3;
    const s = new Date(year, startMonth, 1);
    const e = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    from = iso(s);
    to = iso(e);
    note = `Q${quarter} ${year}`;
    remaining = remaining.replace(qRe, " ").trim();
    return { remaining, from, to, note };
  }

  // "März 2025", "März", "2024"
  const monthNames = [
    "januar",
    "februar",
    "märz",
    "maerz",
    "april",
    "mai",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "dezember",
  ];
  const monthToIdx: Record<string, number> = {
    januar: 0,
    februar: 1,
    märz: 2,
    maerz: 2,
    april: 3,
    mai: 4,
    juni: 5,
    juli: 6,
    august: 7,
    september: 8,
    oktober: 9,
    november: 10,
    dezember: 11,
  };
  const monthRe = new RegExp(
    `\\b(${monthNames.join("|")})(?:\\s+(\\d{4}))?\\b`,
    "i"
  );
  const mm = monthRe.exec(remaining);
  if (mm) {
    const idx = monthToIdx[mm[1].toLowerCase()];
    const year = mm[2] ? Number(mm[2]) : now.getFullYear();
    if (idx !== undefined) {
      const s = new Date(year, idx, 1);
      const e = new Date(year, idx + 1, 0, 23, 59, 59, 999);
      from = iso(s);
      to = iso(e);
      note = `${mm[1]} ${year}`;
      remaining = remaining.replace(monthRe, " ").trim();
      return { remaining, from, to, note };
    }
  }

  // Reine Jahreszahl 20XX
  const yearRe = /\b(20\d{2})\b/;
  const ym = yearRe.exec(remaining);
  if (ym) {
    const y = Number(ym[1]);
    from = `${y}-01-01`;
    to = `${y}-12-31`;
    note = String(y);
    remaining = remaining.replace(yearRe, " ").trim();
    return { remaining, from, to, note };
  }

  return { remaining };
}

function pickStatus(query: string): {
  remaining: string;
  status?: NlFilters["status"];
  note?: string;
} {
  let remaining = query;
  let status: NlFilters["status"] | undefined;
  let note: string | undefined;
  if (/\b(überfällig|ueberfaellig|überfaellig)\b/i.test(remaining)) {
    status = "ueberfaellig";
    note = "überfällig";
    remaining = remaining.replace(/\b(überfällig|ueberfaellig|überfaellig)\b/i, " ").trim();
  } else if (/\b(unbezahlt|offen|offene)\b/i.test(remaining)) {
    status = "offen";
    note = "offen/unbezahlt";
    remaining = remaining.replace(/\b(unbezahlt|offen|offene)\b/i, " ").trim();
  } else if (/\bentwurf|entwürfe|drafts?\b/i.test(remaining)) {
    status = "entwurf";
    note = "Entwurf";
    remaining = remaining.replace(/\bentwurf|entwürfe|drafts?\b/i, " ").trim();
  } else if (/\b(gebucht|festgeschrieben)\b/i.test(remaining)) {
    status = "gebucht";
    note = "gebucht";
    remaining = remaining.replace(/\b(gebucht|festgeschrieben)\b/i, " ").trim();
  }
  return { remaining, status, note };
}

function pickCounterparty(query: string): {
  remaining: string;
  gegenseite?: string;
  note?: string;
} {
  // Matches "von X", "an X", "bei X" where X is the remainder of the string
  const re = /\b(von|an|bei|für|an\s+die|von\s+der)\s+(.+)$/i;
  const m = re.exec(query);
  if (!m) return { remaining: query };
  const name = m[2].trim();
  if (!name) return { remaining: query };
  return {
    remaining: query.replace(re, "").trim(),
    gegenseite: name,
    note: `Gegenseite „${name}"`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseNlQuery(
  raw: string,
  now: Date = new Date()
): NlParseResult {
  let q = raw.trim();
  if (!q) {
    return {
      filters: { residual: "" },
      translation: "",
    };
  }

  const notes: string[] = [];

  const a = pickAmount(q);
  q = a.remaining;
  if (a.note) notes.push(`Betrag ${a.note}`);

  const d = pickDate(q, now);
  q = d.remaining;
  if (d.note) notes.push(`Zeitraum: ${d.note}`);

  const s = pickStatus(q);
  q = s.remaining;
  if (s.note) notes.push(`Status: ${s.note}`);

  // Gegenseite am Schluss, damit "letzte Woche von Meyer" erst die
  // Datums-Phrase frisst.
  const g = pickCounterparty(q);
  q = g.remaining;
  if (g.note) notes.push(g.note);

  const residual = q.replace(/\s+/g, " ").trim();

  return {
    filters: {
      amountMin: a.min,
      amountMax: a.max,
      dateFrom: d.from,
      dateTo: d.to,
      status: s.status,
      gegenseite: g.gegenseite,
      residual,
    },
    translation:
      notes.length > 0
        ? notes.join(" · ") + (residual ? ` · Freitext „${residual}"` : "")
        : "",
  };
}

// Hilfe für Suggestion-Dropdowns — eine kleine Liste gut lesbarer Beispiele.
export const NL_EXAMPLES: string[] = [
  "unbezahlt von Meyer",
  "Ausgaben letzte Woche",
  "über 1000 Euro diesen Monat",
  "überfällig",
  "Q1 2026",
  "Entwürfe",
  "März 2025",
];
