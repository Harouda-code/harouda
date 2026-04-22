import type { Account, JournalEntry } from "../types/db";

/**
 * Offene-Posten-Verwaltung (OPOS).
 *
 * An "open item" = a receivable (Forderung) or payable (Verbindlichkeit)
 * that hasn't been fully settled. We derive them by grouping all journal
 * entries whose Soll- oder Haben-Konto in the Forderungen/Verbindlichkeiten
 * range (1400/1600) and netting movements per `beleg_nr`.
 *
 * Sign convention for receivables (1400):
 *   Soll-Buchung auf 1400 = neue Forderung (+)
 *   Haben-Buchung auf 1400 = Zahlungseingang (−)
 * For payables (1600):
 *   Haben-Buchung auf 1600 = neue Verbindlichkeit (+)
 *   Soll-Buchung auf 1600 = Zahlung (−)
 */

export type OpenItemKind = "forderung" | "verbindlichkeit";

export type AgingBucket = "0-30" | "31-60" | "61-90" | "91+";

export type OpenItem = {
  /** beleg_nr — each beleg is one OPOS line */
  beleg_nr: string;
  kind: OpenItemKind;
  gegenseite: string;
  beschreibung: string;
  datum: string;
  faelligkeit: string;
  /** originaler Rechnungsbetrag */
  betrag: number;
  /** bereits verrechnet */
  bezahlt: number;
  /** Offener Rest */
  offen: number;
  /** Alter seit Fälligkeit in Tagen (negativ = noch nicht fällig) */
  ueberfaellig_tage: number;
  bucket: AgingBucket;
  /** Alle beteiligten Journal-IDs (Erst-Buchung + Zahlungseingänge) */
  entry_ids: string[];
  /** optionale Client-ID, wenn alle beteiligten Buchungen denselben Mandanten haben */
  client_id: string | null;
};

function isInRange(konto_nr: string, lo: number, hi: number): boolean {
  const n = Number(konto_nr);
  return Number.isFinite(n) && n >= lo && n <= hi;
}

export function isReceivableAccount(
  account: Account | undefined
): boolean {
  if (!account) return false;
  return isInRange(account.konto_nr, 1400, 1499);
}

export function isPayableAccount(account: Account | undefined): boolean {
  if (!account) return false;
  return isInRange(account.konto_nr, 1600, 1699);
}

function defaultFaelligkeit(datum: string): string {
  const d = new Date(datum);
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function bucketOf(ueberfaelligTage: number): AgingBucket {
  if (ueberfaelligTage <= 30) return "0-30";
  if (ueberfaelligTage <= 60) return "31-60";
  if (ueberfaelligTage <= 90) return "61-90";
  return "91+";
}

type Bucket = {
  kind: OpenItemKind;
  beleg_nr: string;
  firstDatum: string;
  faelligkeit: string | null;
  beschreibung: string;
  gegenseite: string;
  delta: number;
  entry_ids: string[];
  client_id: string | null;
  clientMixed: boolean;
};

export function buildOpenItems(
  entries: JournalEntry[],
  accounts: Account[],
  now: Date = new Date()
): OpenItem[] {
  const byNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const byBeleg = new Map<string, Bucket>();

  function seedBucket(
    beleg_nr: string,
    kind: OpenItemKind,
    e: JournalEntry
  ): Bucket {
    return {
      kind,
      beleg_nr,
      firstDatum: e.datum,
      faelligkeit: e.faelligkeit,
      beschreibung: e.beschreibung,
      gegenseite: e.gegenseite ?? "",
      delta: 0,
      entry_ids: [],
      client_id: e.client_id,
      clientMixed: false,
    };
  }

  function extend(bucket: Bucket, e: JournalEntry) {
    bucket.entry_ids.push(e.id);
    if (bucket.client_id !== e.client_id) bucket.clientMixed = true;
    // Earliest datum wins; latest beschreibung + gegenseite if still empty
    if (e.datum < bucket.firstDatum) bucket.firstDatum = e.datum;
    if (!bucket.gegenseite && e.gegenseite) bucket.gegenseite = e.gegenseite;
    if (!bucket.faelligkeit && e.faelligkeit) bucket.faelligkeit = e.faelligkeit;
  }

  for (const e of entries) {
    const sollAcc = byNr.get(e.soll_konto);
    const habenAcc = byNr.get(e.haben_konto);
    const amt = Number(e.betrag);
    if (!Number.isFinite(amt) || amt === 0) continue;

    if (isReceivableAccount(sollAcc)) {
      // Soll auf 1400 = Forderungsaufbau
      const key = `F:${e.beleg_nr || e.id}`;
      const b = byBeleg.get(key) ?? seedBucket(e.beleg_nr, "forderung", e);
      extend(b, e);
      b.delta += amt;
      byBeleg.set(key, b);
    }
    if (isReceivableAccount(habenAcc)) {
      const key = `F:${e.beleg_nr || e.id}`;
      const b = byBeleg.get(key) ?? seedBucket(e.beleg_nr, "forderung", e);
      extend(b, e);
      b.delta -= amt;
      byBeleg.set(key, b);
    }
    if (isPayableAccount(habenAcc)) {
      const key = `V:${e.beleg_nr || e.id}`;
      const b =
        byBeleg.get(key) ?? seedBucket(e.beleg_nr, "verbindlichkeit", e);
      extend(b, e);
      b.delta += amt;
      byBeleg.set(key, b);
    }
    if (isPayableAccount(sollAcc)) {
      const key = `V:${e.beleg_nr || e.id}`;
      const b =
        byBeleg.get(key) ?? seedBucket(e.beleg_nr, "verbindlichkeit", e);
      extend(b, e);
      b.delta -= amt;
      byBeleg.set(key, b);
    }
  }

  const items: OpenItem[] = [];
  for (const b of byBeleg.values()) {
    if (Math.abs(b.delta) < 0.005) continue; // fully settled
    const faelligkeit = b.faelligkeit ?? defaultFaelligkeit(b.firstDatum);
    const due = new Date(faelligkeit);
    const msDiff = now.getTime() - due.getTime();
    const ueberfaellig_tage = Math.floor(msDiff / (1000 * 60 * 60 * 24));
    const betrag = Math.abs(b.delta);
    items.push({
      beleg_nr: b.beleg_nr || b.entry_ids[0],
      kind: b.kind,
      gegenseite: b.gegenseite || "— ohne Gegenseite —",
      beschreibung: b.beschreibung,
      datum: b.firstDatum,
      faelligkeit,
      betrag: betrag, // we reconstruct below
      bezahlt: 0,
      offen: betrag,
      ueberfaellig_tage,
      bucket: bucketOf(Math.max(0, ueberfaellig_tage)),
      entry_ids: b.entry_ids,
      client_id: b.clientMixed ? null : b.client_id,
    });
  }
  return items.sort((a, b) => b.ueberfaellig_tage - a.ueberfaellig_tage);
}

export type OposSummary = {
  receivables: OpenItem[];
  payables: OpenItem[];
  byBucket: Record<AgingBucket, { forderung: number; verbindlichkeit: number }>;
  totals: {
    forderung_offen: number;
    forderung_ueberfaellig: number;
    verbindlichkeit_offen: number;
    verbindlichkeit_ueberfaellig: number;
  };
};

export function summarizeOpenItems(
  entries: JournalEntry[],
  accounts: Account[],
  now: Date = new Date()
): OposSummary {
  const all = buildOpenItems(entries, accounts, now);
  const receivables = all.filter((i) => i.kind === "forderung");
  const payables = all.filter((i) => i.kind === "verbindlichkeit");

  const byBucket: OposSummary["byBucket"] = {
    "0-30": { forderung: 0, verbindlichkeit: 0 },
    "31-60": { forderung: 0, verbindlichkeit: 0 },
    "61-90": { forderung: 0, verbindlichkeit: 0 },
    "91+": { forderung: 0, verbindlichkeit: 0 },
  };
  for (const i of all) {
    byBucket[i.bucket][i.kind] += i.offen;
  }

  return {
    receivables,
    payables,
    byBucket,
    totals: {
      forderung_offen: receivables.reduce((s, i) => s + i.offen, 0),
      forderung_ueberfaellig: receivables
        .filter((i) => i.ueberfaellig_tage > 0)
        .reduce((s, i) => s + i.offen, 0),
      verbindlichkeit_offen: payables.reduce((s, i) => s + i.offen, 0),
      verbindlichkeit_ueberfaellig: payables
        .filter((i) => i.ueberfaellig_tage > 0)
        .reduce((s, i) => s + i.offen, 0),
    },
  };
}

export async function fetchOpenItems(
  entries: JournalEntry[],
  accounts: Account[]
): Promise<OposSummary> {
  return summarizeOpenItems(entries, accounts);
}
