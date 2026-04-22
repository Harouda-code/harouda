import type { Account, JournalEntry } from "../types/db";
import { SKR03_SEED } from "./skr03";
import { store, uid } from "./store";

export { fetchAccounts } from "./accounts";

export type Kpis = {
  umsatzThisQuarter: number;
  umsatzDeltaPct: number | null;
  ausgabenThisQuarter: number;
  ausgabenDeltaPct: number | null;
  ergebnisThisQuarter: number;
  ergebnisDeltaPct: number | null;
  ustDue: number;
  nextUstDueDate: string;
};

export type UstBreakdown = {
  month: string;
  ust19: number;
  ust7: number;
  vorsteuer: number;
  zahllast: number;
};

export async function fetchRecentEntries(
  limit = 100
): Promise<JournalEntry[]> {
  return store
    .getEntries()
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .slice(0, limit);
}

export async function fetchAllEntries(): Promise<JournalEntry[]> {
  return store.getEntries().sort((a, b) => b.datum.localeCompare(a.datum));
}

function quarterOf(d: Date): { year: number; q: number } {
  return { year: d.getFullYear(), q: Math.floor(d.getMonth() / 3) + 1 };
}

function sameQuarter(isoDate: string, qYear: number, q: number): boolean {
  const d = new Date(isoDate);
  const qd = quarterOf(d);
  return qd.year === qYear && qd.q === q;
}

function prevQuarter(year: number, q: number): { year: number; q: number } {
  if (q === 1) return { year: year - 1, q: 4 };
  return { year, q: q - 1 };
}

function deltaPct(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export function computeKpis(
  entries: JournalEntry[],
  accounts: Account[],
  now: Date = new Date()
): Kpis {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const cur = quarterOf(now);
  const prev = prevQuarter(cur.year, cur.q);

  function sumForQuarter(year: number, q: number) {
    let umsatz = 0;
    let ausgaben = 0;
    for (const e of entries) {
      if (!sameQuarter(e.datum, year, q)) continue;
      const sollKat = byNr.get(e.soll_konto)?.kategorie;
      const habenKat = byNr.get(e.haben_konto)?.kategorie;
      if (habenKat === "ertrag") umsatz += Number(e.betrag);
      if (sollKat === "aufwand") ausgaben += Number(e.betrag);
    }
    return { umsatz, ausgaben };
  }

  const curSums = sumForQuarter(cur.year, cur.q);
  const prevSums = sumForQuarter(prev.year, prev.q);
  const curErgebnis = curSums.umsatz - curSums.ausgaben;
  const prevErgebnis = prevSums.umsatz - prevSums.ausgaben;

  // USt for current month
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  let ust = 0;
  let vorsteuer = 0;
  for (const e of entries) {
    const d = new Date(e.datum);
    if (d.getMonth() !== thisMonth || d.getFullYear() !== thisYear) continue;
    const sollAcc = byNr.get(e.soll_konto);
    const habenAcc = byNr.get(e.haben_konto);
    if (habenAcc?.kategorie === "passiva" && habenAcc.ust_satz) {
      ust += Number(e.betrag) * (habenAcc.ust_satz / (100 + habenAcc.ust_satz));
    }
    if (sollAcc?.kategorie === "aktiva" && sollAcc.ust_satz) {
      vorsteuer +=
        Number(e.betrag) * (sollAcc.ust_satz / (100 + sollAcc.ust_satz));
    }
  }
  const ustDue = Math.max(0, ust - vorsteuer);

  const dueDate = new Date(thisYear, thisMonth + 1, 10);

  return {
    umsatzThisQuarter: curSums.umsatz,
    umsatzDeltaPct: deltaPct(curSums.umsatz, prevSums.umsatz),
    ausgabenThisQuarter: curSums.ausgaben,
    ausgabenDeltaPct: deltaPct(curSums.ausgaben, prevSums.ausgaben),
    ergebnisThisQuarter: curErgebnis,
    ergebnisDeltaPct: deltaPct(curErgebnis, prevErgebnis),
    ustDue,
    nextUstDueDate: dueDate.toLocaleDateString("de-DE"),
  };
}

export function computeUstBreakdown(
  entries: JournalEntry[],
  accounts: Account[],
  now: Date = new Date()
): UstBreakdown {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const month = now.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  let ust19 = 0;
  let ust7 = 0;
  let vorsteuer = 0;

  for (const e of entries) {
    const d = new Date(e.datum);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())
      continue;
    const haben = byNr.get(e.haben_konto);
    const soll = byNr.get(e.soll_konto);
    if (haben?.kategorie === "passiva" && haben.ust_satz === 19) {
      ust19 += Number(e.betrag) * (19 / 119);
    } else if (haben?.kategorie === "passiva" && haben.ust_satz === 7) {
      ust7 += Number(e.betrag) * (7 / 107);
    } else if (haben?.kategorie === "ertrag" && haben.ust_satz === 19) {
      ust19 += Number(e.betrag) * (19 / 119);
    } else if (haben?.kategorie === "ertrag" && haben.ust_satz === 7) {
      ust7 += Number(e.betrag) * (7 / 107);
    }
    if (soll?.kategorie === "aktiva" && soll.ust_satz) {
      vorsteuer +=
        Number(e.betrag) * (soll.ust_satz / (100 + soll.ust_satz));
    } else if (soll?.kategorie === "aufwand" && soll.ust_satz) {
      vorsteuer +=
        Number(e.betrag) * (soll.ust_satz / (100 + soll.ust_satz));
    }
  }

  return {
    month,
    ust19,
    ust7,
    vorsteuer,
    zahllast: ust19 + ust7 - vorsteuer,
  };
}

export async function seedDemoData(): Promise<{
  inserted_accounts: number;
  inserted_entries: number;
}> {
  const existingAccounts = store.getAccounts();
  const byNr = new Set(existingAccounts.map((a) => a.konto_nr));
  const newAccounts: Account[] = [];
  for (const seed of SKR03_SEED) {
    if (byNr.has(seed.konto_nr)) continue;
    newAccounts.push({
      id: uid(),
      created_at: new Date().toISOString(),
      ...seed,
    });
  }
  const accounts = [...existingAccounts, ...newAccounts];
  store.setAccounts(accounts);

  const existingEntries = store.getEntries();
  // Sprint 7.5 (Entscheidung 22 A): Die 15 hardcoded isoDaysAgo-
  // Einträge wurden entfernt. Das Journal wird stattdessen vom
  // Musterfirma-Seed-Pfad in `demoSeed.ts` mit 52 festdatierten
  // 2025-Buchungen geladen (Vite `?raw`-Import + parseJournalCsv).
  // Der Dashboard-Button „Demo-Daten laden" seedet daher jetzt nur
  // noch Konten — für Journal-Einträge genügt ein Neuladen der App
  // (autoSeedDemoIfNeeded läuft automatisch in DEMO_MODE).
  const demo: Omit<
    JournalEntry,
    "id" | "created_at" | "updated_at" | "version" | "skonto_pct" | "skonto_tage"
  >[] = [];
  const nowIso = new Date().toISOString();
  const newEntries: JournalEntry[] = demo.map((d) => ({
    id: uid(),
    created_at: nowIso,
    updated_at: nowIso,
    version: 1,
    skonto_pct: null,
    skonto_tage: null,
    ...d,
  }));
  store.setEntries([...existingEntries, ...newEntries]);

  return {
    inserted_accounts: newAccounts.length,
    inserted_entries: newEntries.length,
  };
}
