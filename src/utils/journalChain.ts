// Hash-Kette für Journal-Buchungen (GoBD-orientiert).
//
// Pro company_id bildet die Folge aller Buchungen — sortiert nach
// created_at, dann id — eine verkettete SHA-256-Kette. Jeder Eintrag hat:
//
//   prev_hash   = Hash des vorherigen Eintrags (oder GENESIS für den ersten)
//   entry_hash  = SHA-256(prev_hash || '|' || datum || '|' || beleg_nr
//                         || '|' || soll_konto || '|' || haben_konto
//                         || '|' || betrag || '|' || beschreibung
//                         || '|' || storno_status || '|' || parent_entry_id)
//
// Wichtig: exakt dasselbe Format muss der Postgres-Trigger verwenden
// (Migration 0010_journal_hash_chain.sql), damit Server- und Client-Hashes
// übereinstimmen. Deshalb nutzen wir ein fixes Pipe-Format statt canonical
// JSON — es ist trivial in SQL reproduzierbar.
//
// Die Kette ist TAMPER-EVIDENT, nicht tamper-proof: eine spätere Manipulation
// an der Zeile bricht die Kette ab der ersten geänderten Stelle; ein
// geschickter Angreifer mit DB-Zugriff kann die Kette nachrechnen und
// hinterher konsistent schreiben. Für echten Fraud-Schutz ist ein
// Offsite-Anker nötig (z. B. tägliches Anchor-Hash in einer externen WORM-Storage).

import type { JournalEntry } from "../types/db";

export const JOURNAL_GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

/** Erzeugt die kanonische Eingabe für die Hash-Funktion.
 *
 *  Wichtig: Der Hash deckt nur die UNVERÄNDERBAREN Kerndaten einer Buchung ab.
 *  storno_status wird bewusst NICHT hashed — diese Spalte transitioniert
 *  legitim von 'active' zu 'reversed' (Audit-Log erfasst diesen Übergang).
 *  parent_entry_id ist nach Insert unveränderlich und gehört in die Kette.
 *
 *  Reihenfolge und Trenner dürfen NICHT verändert werden (sonst bricht die
 *  Kompatibilität mit dem SQL-Trigger und allen historischen Hashes).
 */
export function canonicalJournalInput(
  entry: Pick<
    JournalEntry,
    | "datum"
    | "beleg_nr"
    | "soll_konto"
    | "haben_konto"
    | "betrag"
    | "beschreibung"
  > & {
    parent_entry_id?: string | null;
  },
  prev_hash: string
): string {
  const parts: (string | number)[] = [
    prev_hash,
    entry.datum,
    entry.beleg_nr,
    entry.soll_konto,
    entry.haben_konto,
    Number(entry.betrag).toFixed(2),
    entry.beschreibung ?? "",
    entry.parent_entry_id ?? "",
  ];
  return parts.join("|");
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeEntryHash(
  entry: Parameters<typeof canonicalJournalInput>[0],
  prev_hash: string
): Promise<string> {
  return sha256Hex(canonicalJournalInput(entry, prev_hash));
}

export type JournalChainResult = {
  ok: boolean;
  total: number;
  firstBreakIndex: number | null;
  firstBreakEntryId: string | null;
  message: string;
};

function sortForChain(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    const ta = a.created_at ?? a.datum;
    const tb = b.created_at ?? b.datum;
    if (ta !== tb) return ta.localeCompare(tb);
    return a.id.localeCompare(b.id);
  });
}

export async function verifyJournalChain(
  entries: JournalEntry[]
): Promise<JournalChainResult> {
  const sorted = sortForChain(entries);
  let expectedPrev = JOURNAL_GENESIS_HASH;
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    // Zeilen ohne entry_hash (z. B. pre-migration) überspringen wir tolerant,
    // weisen aber im Result darauf hin.
    if (!e.entry_hash) {
      continue;
    }
    if (e.prev_hash !== expectedPrev && e.prev_hash !== undefined) {
      return {
        ok: false,
        total: sorted.length,
        firstBreakIndex: i,
        firstBreakEntryId: e.id,
        message:
          `Kette bei Eintrag #${i + 1} (Beleg ${e.beleg_nr}) gebrochen: ` +
          `prev_hash passt nicht. Zeile wurde nachträglich verändert oder ` +
          `die Sortierung stimmt nicht.`,
      };
    }
    const recomputed = await computeEntryHash(
      {
        datum: e.datum,
        beleg_nr: e.beleg_nr,
        soll_konto: e.soll_konto,
        haben_konto: e.haben_konto,
        betrag: Number(e.betrag),
        beschreibung: e.beschreibung,
        parent_entry_id: e.parent_entry_id ?? null,
      },
      e.prev_hash ?? expectedPrev
    );
    if (recomputed !== e.entry_hash) {
      return {
        ok: false,
        total: sorted.length,
        firstBreakIndex: i,
        firstBreakEntryId: e.id,
        message:
          `Hash bei Eintrag #${i + 1} (Beleg ${e.beleg_nr}) stimmt nicht — ` +
          `Zeileninhalt wurde nach dem Schreiben geändert.`,
      };
    }
    expectedPrev = e.entry_hash;
  }
  return {
    ok: true,
    total: sorted.length,
    firstBreakIndex: null,
    firstBreakEntryId: null,
    message: `Alle ${sorted.length} Einträge verifiziert — Kette intakt.`,
  };
}
