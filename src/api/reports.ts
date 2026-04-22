import type { Account, JournalEntry, Kategorie } from "../types/db";

export type PeriodFilter = {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (inclusive)
};

export function defaultPeriodYtd(): PeriodFilter {
  const now = new Date();
  return {
    start: `${now.getFullYear()}-01-01`,
    end: now.toISOString().slice(0, 10),
  };
}

export function filterByPeriod(
  entries: JournalEntry[],
  p: PeriodFilter,
  clientId: string | null
): JournalEntry[] {
  return entries.filter((e) => {
    if (clientId && e.client_id !== clientId) return false;
    if (e.datum < p.start) return false;
    if (e.datum > p.end) return false;
    return true;
  });
}

export type GuvRow = {
  konto_nr: string;
  bezeichnung: string;
  kategorie: Kategorie;
  total: number;
};

export type GuvSection = {
  title: string;
  kategorien: Kategorie[];
  rows: GuvRow[];
  total: number;
};

export type GuvReport = {
  ertrag: GuvSection;
  aufwand: GuvSection;
  jahresergebnis: number;
};

export function buildGuv(
  entries: JournalEntry[],
  accounts: Account[]
): GuvReport {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const ertrag = new Map<string, number>();
  const aufwand = new Map<string, number>();

  for (const e of entries) {
    const sollAcc = byNr.get(e.soll_konto);
    const habenAcc = byNr.get(e.haben_konto);
    // Net amount: for simplicity use gross. True net would strip USt.
    const net = Number(e.betrag);
    if (habenAcc?.kategorie === "ertrag") {
      ertrag.set(e.haben_konto, (ertrag.get(e.haben_konto) ?? 0) + net);
    }
    if (sollAcc?.kategorie === "aufwand") {
      aufwand.set(e.soll_konto, (aufwand.get(e.soll_konto) ?? 0) + net);
    }
  }

  function toRows(m: Map<string, number>, kat: Kategorie): GuvRow[] {
    const rows: GuvRow[] = [];
    for (const [nr, total] of m) {
      const acc = byNr.get(nr);
      rows.push({
        konto_nr: nr,
        bezeichnung: acc?.bezeichnung ?? "(unbekannt)",
        kategorie: kat,
        total,
      });
    }
    return rows.sort((a, b) => a.konto_nr.localeCompare(b.konto_nr));
  }

  const ertragRows = toRows(ertrag, "ertrag");
  const aufwandRows = toRows(aufwand, "aufwand");
  const ertragTotal = ertragRows.reduce((s, r) => s + r.total, 0);
  const aufwandTotal = aufwandRows.reduce((s, r) => s + r.total, 0);

  return {
    ertrag: {
      title: "Erträge",
      kategorien: ["ertrag"],
      rows: ertragRows,
      total: ertragTotal,
    },
    aufwand: {
      title: "Aufwendungen",
      kategorien: ["aufwand"],
      rows: aufwandRows,
      total: aufwandTotal,
    },
    jahresergebnis: ertragTotal - aufwandTotal,
  };
}

export type BwaColumn = "monat" | "vormonat" | "ytd";

export type BwaRow = {
  label: string;
  monat: number;
  vormonat: number;
  ytd: number;
  kind: "ertrag" | "aufwand" | "ergebnis";
};

export function buildBwa(
  allEntries: JournalEntry[],
  accounts: Account[],
  now = new Date()
): BwaRow[] {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));

  function sum(
    predicate: (d: Date) => boolean
  ): { ertrag: number; aufwand: number } {
    let ertrag = 0;
    let aufwand = 0;
    for (const e of allEntries) {
      const d = new Date(e.datum);
      if (!predicate(d)) continue;
      const habenAcc = byNr.get(e.haben_konto);
      const sollAcc = byNr.get(e.soll_konto);
      if (habenAcc?.kategorie === "ertrag") ertrag += Number(e.betrag);
      if (sollAcc?.kategorie === "aufwand") aufwand += Number(e.betrag);
    }
    return { ertrag, aufwand };
  }

  const y = now.getFullYear();
  const m = now.getMonth();
  const mStart = new Date(y, m, 1);
  const mEnd = new Date(y, m + 1, 0, 23, 59, 59);
  const prevStart = new Date(y, m - 1, 1);
  const prevEnd = new Date(y, m, 0, 23, 59, 59);
  const ytdStart = new Date(y, 0, 1);
  const ytdEnd = now;

  const month = sum((d) => d >= mStart && d <= mEnd);
  const prev = sum((d) => d >= prevStart && d <= prevEnd);
  const ytd = sum((d) => d >= ytdStart && d <= ytdEnd);

  return [
    {
      label: "Erträge",
      monat: month.ertrag,
      vormonat: prev.ertrag,
      ytd: ytd.ertrag,
      kind: "ertrag",
    },
    {
      label: "Aufwendungen",
      monat: month.aufwand,
      vormonat: prev.aufwand,
      ytd: ytd.aufwand,
      kind: "aufwand",
    },
    {
      label: "Ergebnis",
      monat: month.ertrag - month.aufwand,
      vormonat: prev.ertrag - prev.aufwand,
      ytd: ytd.ertrag - ytd.aufwand,
      kind: "ergebnis",
    },
  ];
}

export type SuSaRow = {
  konto_nr: string;
  bezeichnung: string;
  kategorie: Kategorie;
  soll: number;
  haben: number;
  saldo: number;
};

export function buildSuSa(
  entries: JournalEntry[],
  accounts: Account[]
): {
  rows: SuSaRow[];
  sollTotal: number;
  habenTotal: number;
} {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const soll = new Map<string, number>();
  const haben = new Map<string, number>();
  const touched = new Set<string>();

  for (const e of entries) {
    const amt = Number(e.betrag);
    soll.set(e.soll_konto, (soll.get(e.soll_konto) ?? 0) + amt);
    haben.set(e.haben_konto, (haben.get(e.haben_konto) ?? 0) + amt);
    touched.add(e.soll_konto);
    touched.add(e.haben_konto);
  }

  const rows: SuSaRow[] = [];
  for (const nr of touched) {
    const acc = byNr.get(nr);
    const s = soll.get(nr) ?? 0;
    const h = haben.get(nr) ?? 0;
    rows.push({
      konto_nr: nr,
      bezeichnung: acc?.bezeichnung ?? "(unbekannt)",
      kategorie: acc?.kategorie ?? "aufwand",
      soll: s,
      haben: h,
      saldo: s - h,
    });
  }
  rows.sort((a, b) => a.konto_nr.localeCompare(b.konto_nr));
  const sollTotal = rows.reduce((s, r) => s + r.soll, 0);
  const habenTotal = rows.reduce((s, r) => s + r.haben, 0);
  return { rows, sollTotal, habenTotal };
}

export type UstvaReport = {
  // Steuerpflichtige Umsätze (Kennzahlen)
  kz81: number; // Umsätze 19 %
  kz86: number; // Umsätze 7 %
  kz41: number; // Steuerfreie innergem. Lieferungen
  kz43: number; // Steuerfreie Umsätze mit Vorsteuerabzug
  kz48: number; // Steuerfreie Umsätze ohne Vorsteuerabzug
  // USt-Beträge
  ust19: number;
  ust7: number;
  // Vorsteuer
  kz66: number; // Vorsteuer aus Rechnungen von anderen Unternehmern
  // Zahllast/Erstattung
  zahllast: number;
};

export function buildUstva(
  entries: JournalEntry[],
  accounts: Account[]
): UstvaReport {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  let netto19 = 0;
  let netto7 = 0;
  let steuerfrei = 0;
  let ust19 = 0;
  let ust7 = 0;
  let vorsteuer = 0;

  for (const e of entries) {
    const haben = byNr.get(e.haben_konto);
    const soll = byNr.get(e.soll_konto);
    const gross = Number(e.betrag);

    if (haben?.kategorie === "ertrag") {
      if (haben.ust_satz === 19) {
        const net = gross / 1.19;
        netto19 += net;
        ust19 += gross - net;
      } else if (haben.ust_satz === 7) {
        const net = gross / 1.07;
        netto7 += net;
        ust7 += gross - net;
      } else if (haben.ust_satz === 0) {
        steuerfrei += gross;
      }
    }
    if (soll?.kategorie === "aufwand" && soll.ust_satz) {
      const rate = soll.ust_satz / 100;
      vorsteuer += gross - gross / (1 + rate);
    }
    if (soll?.kategorie === "aktiva" && soll.ust_satz) {
      const rate = soll.ust_satz / 100;
      vorsteuer += gross - gross / (1 + rate);
    }
  }

  return {
    kz81: Math.round(netto19),
    kz86: Math.round(netto7),
    kz41: 0,
    kz43: 0,
    kz48: Math.round(steuerfrei),
    ust19,
    ust7,
    kz66: vorsteuer,
    zahllast: ust19 + ust7 - vorsteuer,
  };
}
