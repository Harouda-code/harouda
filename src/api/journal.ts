import type { JournalEntry, JournalStornoStatus } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";
import {
  JOURNAL_GENESIS_HASH,
  computeEntryHash,
} from "../utils/journalChain";
import { recordSupplierBooking } from "./supplierPreferences";

export type JournalInput = Omit<
  JournalEntry,
  | "id"
  | "created_at"
  | "updated_at"
  | "version"
  | "storno_status"
  | "parent_entry_id"
  | "locked_at"
>;

function nowIso(): string {
  return new Date().toISOString();
}

/** Liest die Auto-Lock-Dauer für gebuchte Einträge aus den Settings.
 *  Nicht als React-Hook — funktioniert im sync/async API-Layer. */
function readLockHours(): number {
  try {
    const raw = localStorage.getItem("harouda:settings");
    if (!raw) return 24;
    const parsed = JSON.parse(raw) as { gebuchtLockAfterHours?: number };
    const h = Number(parsed.gebuchtLockAfterHours);
    return Number.isFinite(h) && h >= 0 && h <= 24 * 365 ? h : 24;
  } catch {
    return 24;
  }
}

function computeLockedAt(status: string): string | null {
  if (status !== "gebucht") return null;
  const hours = readLockHours();
  if (hours <= 0) return nowIso();
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

/** Jahresabschluss-Sperre: liest periodClosedBefore aus den Settings.
 *  Buchungen mit datum ≤ diesem Wert müssen abgelehnt werden. */
function readPeriodClosedBefore(): string | null {
  try {
    const raw = localStorage.getItem("harouda:settings");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { periodClosedBefore?: string };
    const v = parsed.periodClosedBefore?.trim();
    if (!v) return null;
    // Validierung: ISO YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    return v;
  } catch {
    return null;
  }
}

function assertPeriodNotClosed(datum: string): void {
  const locked = readPeriodClosedBefore();
  if (!locked) return;
  if (datum <= locked) {
    throw new Error(
      `Periode ist abgeschlossen: Buchungen mit Datum ≤ ${locked} sind gesperrt. ` +
        `Bitte neue Periode wählen oder die Sperre in den Einstellungen aufheben.`
    );
  }
}

/** Holt den letzten entry_hash der Kette für die aktuelle Firma (Supabase)
 *  bzw. das lokale Store (Demo). Fällt auf Genesis zurück, wenn die Kette
 *  noch leer ist. */
async function lastChainHash(): Promise<string> {
  if (!shouldUseSupabase()) {
    const all = store.getEntries();
    // store gibt nach datum sortiert zurück (neueste zuerst); wir brauchen
    // den zuletzt geschriebenen, also created_at-desc.
    const sorted = [...all].sort((a, b) => {
      const ta = a.created_at ?? a.datum;
      const tb = b.created_at ?? b.datum;
      return tb.localeCompare(ta);
    });
    return sorted[0]?.entry_hash ?? JOURNAL_GENESIS_HASH;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("entry_hash")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return JOURNAL_GENESIS_HASH;
  return (data[0] as { entry_hash: string | null }).entry_hash ?? JOURNAL_GENESIS_HASH;
}

/**
 * GoBD-Grundsatz: festgeschriebene Buchungen dürfen nicht mehr
 * geändert oder gelöscht werden. Änderungen erfolgen ausschließlich
 * über Stornobuchungen bzw. Korrekturbuchungen.
 */
function assertMutable(entry: JournalEntry): void {
  if (entry.status === "gebucht") {
    throw new Error(
      "Festgeschriebene Buchungen dürfen nicht geändert werden. Bitte eine Stornobuchung erstellen."
    );
  }
  if (entry.storno_status && entry.storno_status !== "active") {
    throw new Error(
      "Diese Buchung wurde bereits storniert oder korrigiert und ist gesperrt."
    );
  }
  if (entry.locked_at) {
    const lockedDate = new Date(entry.locked_at);
    if (Number.isFinite(lockedDate.getTime()) && lockedDate <= new Date()) {
      throw new Error(
        `Die Buchung ist seit ${lockedDate.toLocaleString("de-DE")} auto-festgeschrieben und darf nicht mehr geändert werden.`
      );
    }
  }
}

/**
 * Phase 3 / Schritt 8 — Liefert festgeschriebene Journal-Entries im
 * Zeitraum `[von, bis]`, bei denen Soll- oder Haben-Konto in
 * `kontoNummern` enthalten ist. Optional per `clientId` gefiltert.
 *
 * Supabase-Pfad: eine Query mit PostgREST-`or()`-Filter auf
 * `soll_konto.in.(…)` OR `haben_konto.in.(…)` — atomar, kein Merge.
 * DEMO-Pfad: In-Memory-Filter.
 *
 * Leeres `kontoNummern`-Array → sofortiger Early-Return mit `[]`,
 * damit PostgREST nicht einen leeren `in ()`-Ausdruck bekommt.
 */
export async function fetchEntriesForAccountsInRange(
  kontoNummern: string[],
  von: string,
  bis: string,
  clientId: string | null
): Promise<JournalEntry[]> {
  if (kontoNummern.length === 0) return [];
  if (!shouldUseSupabase()) {
    const set = new Set(kontoNummern);
    return store
      .getEntries()
      .filter(
        (e) =>
          e.status === "gebucht" &&
          e.datum >= von &&
          e.datum <= bis &&
          (clientId === null || e.client_id === clientId) &&
          (set.has(e.soll_konto) || set.has(e.haben_konto))
      )
      .sort((a, b) => a.datum.localeCompare(b.datum));
  }
  const companyId = requireCompanyId();
  const list = kontoNummern.map((k) => `"${k}"`).join(",");
  let q = supabase
    .from("journal_entries")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "gebucht")
    .gte("datum", von)
    .lte("datum", bis)
    .or(`soll_konto.in.(${list}),haben_konto.in.(${list})`);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("datum", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as JournalEntry[];
}

export async function fetchEntries(): Promise<JournalEntry[]> {
  if (!shouldUseSupabase()) {
    return store.getEntries().sort((a, b) => b.datum.localeCompare(a.datum));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("company_id", companyId)
    .order("datum", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as JournalEntry[];
}

/** Zusätzliche Lifecycle-Angaben, mit denen interne Aufrufer (correctEntry)
 *  die Storno-/Korrektur-Markierung direkt beim Insert mitgeben — so bleibt
 *  die Hash-Kette konsistent (kein nachträgliches UPDATE nötig). */
type CreateEntryOptions = {
  storno_status?: JournalStornoStatus;
  parent_entry_id?: string | null;
};

export async function createEntry(
  input: JournalInput,
  options: CreateEntryOptions = {}
): Promise<JournalEntry> {
  const storno_status: JournalStornoStatus = options.storno_status ?? "active";
  const parent_entry_id = options.parent_entry_id ?? null;

  if (input.soll_konto === input.haben_konto) {
    throw new Error("Soll- und Haben-Konto dürfen nicht identisch sein.");
  }
  if (!(input.betrag > 0)) {
    throw new Error("Betrag muss größer als 0 sein.");
  }
  // Storno-/Korrekturbuchungen dürfen auch in gesperrte Perioden fallen,
  // wenn sie vom Jetzt-Datum aus erzeugt werden — aber Direkt-Buchungen
  // mit altem Datum sind gesperrt.
  if (storno_status === "active") {
    assertPeriodNotClosed(input.datum);
  }

  if (!shouldUseSupabase()) {
    const now = nowIso();
    const prev_hash = await lastChainHash();
    const base = {
      id: uid(),
      created_at: now,
      updated_at: now,
      version: 1,
      storno_status,
      parent_entry_id,
      locked_at: computeLockedAt(input.status),
      ...input,
    };
    const entry_hash = await computeEntryHash(base, prev_hash);
    const entry: JournalEntry = { ...base, prev_hash, entry_hash };
    store.setEntries([entry, ...store.getEntries()]);
    void log({
      action: "create",
      entity: "journal_entry",
      entity_id: entry.id,
      summary: `Buchung ${entry.beleg_nr} · ${entry.beschreibung} · ${entry.betrag.toFixed(2)} €`,
      after: entry,
    });
    if (entry.gegenseite) {
      void recordSupplierBooking({
        supplier: entry.gegenseite,
        soll_konto: entry.soll_konto,
        haben_konto: entry.haben_konto,
        clientId: entry.client_id ?? null,
      });
    }
    return entry;
  }

  const companyId = requireCompanyId();
  const prev_hash = await lastChainHash();
  const entry_hash = await computeEntryHash(
    { ...input, parent_entry_id },
    prev_hash
  );
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      ...input,
      version: 1,
      storno_status,
      parent_entry_id,
      locked_at: computeLockedAt(input.status),
      prev_hash,
      entry_hash,
      company_id: companyId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const entry = data as JournalEntry;
  void log({
    action: "create",
    entity: "journal_entry",
    entity_id: entry.id,
    summary: `Buchung ${entry.beleg_nr} · ${entry.beschreibung} · ${Number(entry.betrag).toFixed(2)} €`,
    after: entry,
  });
  if (entry.gegenseite) {
    void recordSupplierBooking({
      supplier: entry.gegenseite,
      soll_konto: entry.soll_konto,
      haben_konto: entry.haben_konto,
      clientId: entry.client_id ?? null,
    });
  }
  return entry;
}

/**
 * Multi-Tenancy Phase 2 / Schritt 3 — atomarer Journal-Batch-Insert.
 *
 * Schreibt eine Gruppe von Buchungen als logischen Stapel:
 *   • Reihenfolge bleibt exakt die des Caller-Arrays.
 *   • Hash-Kette einmalig von `lastChainHash()` weitergezogen; pro Eintrag
 *     wird der neu berechnete entry_hash zum prev_hash des nächsten.
 *   • Alles-oder-nichts: Pre-Validierung vor dem ersten Write; im
 *     Supabase-Pfad ein einziges `insert([...])` (PostgREST fährt ein
 *     INSERT mit N Rows in einer Transaction — RLS-/Constraint-Fehler
 *     rollt alle Rows zurück); im DEMO-Pfad try/catch mit Snapshot-
 *     Restore vor dem Re-Throw.
 *   • Jeder Entry erhält dieselbe `batch_id`, plus **ein** Audit-Log-
 *     Eintrag pro Batch (nicht pro Entry — spart Noise bei Lohn-Läufen).
 *
 * Concurrency-Limit: `lastChainHash()` liest ohne Lock. Bei echten
 * parallelen Writes (Mehrfach-User-Trigger) könnten zwei Batches
 * denselben `prev_hash` lesen — es existiert keine UNIQUE-Constraint
 * auf `journal_entries.prev_hash` (siehe Migration 0010). Für den
 * intendierten Use-Case (Lohn-Lauf via single-user Button-Klick) ist
 * das akzeptabel; ein späterer Advisory-Lock / `UNIQUE(prev_hash)`-
 * Constraint wäre die saubere Lösung.
 */
export type JournalBatchOptions = {
  companyId: string;
  clientId: string | null;
  batchLabel?: string;
};

export type JournalBatchResult = {
  created: JournalEntry[];
  batchId: string;
};

export async function createEntriesBatch(
  entries: JournalInput[],
  opts: JournalBatchOptions
): Promise<JournalBatchResult> {
  const batchId = uid();

  if (entries.length === 0) {
    return { created: [], batchId };
  }

  // 1) Pre-Validierung — alles-oder-nichts, vor JEDEM Write.
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.soll_konto === e.haben_konto) {
      throw new Error(
        `Batch-Entry #${i + 1} (${e.beleg_nr}): Soll- und Haben-Konto identisch.`
      );
    }
    if (!(e.betrag > 0)) {
      throw new Error(
        `Batch-Entry #${i + 1} (${e.beleg_nr}): Betrag muss > 0 sein.`
      );
    }
    if (e.client_id !== opts.clientId) {
      throw new Error(
        `Batch-Entry #${i + 1} (${e.beleg_nr}): client_id-Mismatch — Entry hat ${
          e.client_id === null ? "null" : `"${e.client_id}"`
        }, opts.clientId ist ${
          opts.clientId === null ? "null" : `"${opts.clientId}"`
        }.`
      );
    }
    assertPeriodNotClosed(e.datum);
  }

  // 2) Hash-Kette vorab rechnen — prev_hash initial von Chain-Head,
  //    dann iterativ vom jeweils neuen entry_hash weitergezogen.
  const startPrev = await lastChainHash();
  const now = nowIso();
  type Prepared = {
    input: JournalInput;
    id: string;
    prev_hash: string;
    entry_hash: string;
    locked_at: string | null;
  };
  const prepared: Prepared[] = [];
  let currentPrev = startPrev;
  for (const input of entries) {
    const entry_hash = await computeEntryHash(
      { ...input, parent_entry_id: null },
      currentPrev
    );
    prepared.push({
      input,
      id: uid(),
      prev_hash: currentPrev,
      entry_hash,
      locked_at: computeLockedAt(input.status),
    });
    currentPrev = entry_hash;
  }

  // 3) DEMO-Pfad — atomic via Snapshot+Restore.
  if (!shouldUseSupabase()) {
    const snapshot = store.getEntries();
    // `sortForChain` in verifyJournalChain tiebricht bei identischem
    // created_at über `id.localeCompare` — UUIDs sind aber NICHT in
    // Reihenfolge. Damit die gespeicherte Hash-Kette-Reihenfolge mit der
    // Verifikation-Sortierung übereinstimmt, vergeben wir pro Batch-
    // Zeile ein deterministisch monoton wachsendes created_at (+i ms).
    const baseMs = Date.parse(now);
    const rows: JournalEntry[] = prepared.map((p, i) => ({
      ...p.input,
      id: p.id,
      created_at: new Date(baseMs + i).toISOString(),
      updated_at: new Date(baseMs + i).toISOString(),
      version: 1,
      storno_status: "active",
      parent_entry_id: null,
      locked_at: p.locked_at,
      batch_id: batchId,
      prev_hash: p.prev_hash,
      entry_hash: p.entry_hash,
    }));
    try {
      // Neueste zuerst in der Anzeige → Batch-Rows in Reverse vor Snapshot.
      store.setEntries([...rows.slice().reverse(), ...snapshot]);
    } catch (err) {
      // Snapshot restaurieren. Wenn der Restore selbst wirft, bleibt der
      // localStorage dennoch unverändert (setItem ist atomar) — wir
      // schlucken den Restore-Fehler und werfen den Original-Fehler.
      try {
        store.setEntries(snapshot);
      } catch {
        /* rollback secondary failure — original data still intact */
      }
      throw err;
    }
    void log({
      action: "create",
      entity: "journal_entry",
      entity_id: batchId,
      summary: `Buchungs-Stapel ${opts.batchLabel ?? "(unnamed)"} · ${rows.length} Einträge`,
      after: {
        batchId,
        entryCount: rows.length,
        batchLabel: opts.batchLabel ?? null,
      },
    });
    return { created: rows, batchId };
  }

  // 4) Supabase-Pfad — ein INSERT mit Array-Payload ⇒ single transaction.
  const payload = prepared.map((p) => ({
    ...p.input,
    id: p.id,
    version: 1,
    storno_status: "active",
    parent_entry_id: null,
    locked_at: p.locked_at,
    batch_id: batchId,
    prev_hash: p.prev_hash,
    entry_hash: p.entry_hash,
    company_id: opts.companyId,
  }));
  const { data, error } = await supabase
    .from("journal_entries")
    .insert(payload)
    .select("*");
  if (error) throw new Error(error.message);
  const created = (data ?? []) as JournalEntry[];
  void log({
    action: "create",
    entity: "journal_entry",
    entity_id: batchId,
    summary: `Buchungs-Stapel ${opts.batchLabel ?? "(unnamed)"} · ${created.length} Einträge`,
    after: {
      batchId,
      entryCount: created.length,
      batchLabel: opts.batchLabel ?? null,
    },
  });
  return { created, batchId };
}

export async function updateEntry(
  id: string,
  patch: Partial<JournalInput>
): Promise<JournalEntry> {
  if (!shouldUseSupabase()) {
    const all = store.getEntries();
    const idx = all.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("Buchung nicht gefunden.");
    const prev = all[idx];
    assertMutable(prev);
    const next: JournalEntry = {
      ...prev,
      ...patch,
      updated_at: nowIso(),
      version: (prev.version ?? 1) + 1,
    };
    if (next.soll_konto === next.haben_konto) {
      throw new Error("Soll- und Haben-Konto dürfen nicht identisch sein.");
    }
    const copy = [...all];
    copy[idx] = next;
    store.setEntries(copy);
    void log({
      action: "update",
      entity: "journal_entry",
      entity_id: next.id,
      summary: `Buchung ${next.beleg_nr} geändert (v${next.version})`,
      before: prev,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  const { data: beforeRow, error: readErr } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  if (readErr) throw new Error(readErr.message);
  const before = beforeRow as JournalEntry;
  assertMutable(before);
  const nextVersion = (before.version ?? 1) + 1;
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ ...patch, version: nextVersion })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const next = data as JournalEntry;
  void log({
    action: "update",
    entity: "journal_entry",
    entity_id: next.id,
    summary: `Buchung ${next.beleg_nr} geändert (v${next.version})`,
    before,
    after: next,
  });
  return next;
}

export async function deleteEntry(id: string): Promise<void> {
  if (!shouldUseSupabase()) {
    const prev = store.getEntries().find((e) => e.id === id) ?? null;
    if (!prev) throw new Error("Buchung nicht gefunden.");
    assertMutable(prev);
    store.setEntries(store.getEntries().filter((e) => e.id !== id));
    void log({
      action: "delete",
      entity: "journal_entry",
      entity_id: id,
      summary: `Entwurf ${prev.beleg_nr} gelöscht`,
      before: prev,
    });
    return;
  }
  const companyId = requireCompanyId();
  const { data: prev } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!prev) throw new Error("Buchung nicht gefunden.");
  assertMutable(prev as JournalEntry);
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  void log({
    action: "delete",
    entity: "journal_entry",
    entity_id: id,
    summary: `Entwurf ${(prev as JournalEntry).beleg_nr} gelöscht`,
    before: prev,
  });
}

/**
 * Stornobuchung anlegen: Erzeugt eine Gegenbuchung mit vertauschten Soll-/
 * Haben-Konten und markiert die Ursprungsbuchung als "reversed". Die
 * Gegenbuchung selbst erhält storno_status="reversal" und verweist per
 * parent_entry_id auf das Original. Die Audit-Kette protokolliert beide
 * Ereignisse.
 */
export async function reverseEntry(
  id: string,
  reason: string
): Promise<JournalEntry> {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    throw new Error("Stornogrund ist Pflicht (mindestens 3 Zeichen).");
  }

  if (!shouldUseSupabase()) {
    const all = store.getEntries();
    const original = all.find((e) => e.id === id);
    if (!original) throw new Error("Buchung nicht gefunden.");
    if (original.storno_status && original.storno_status !== "active") {
      throw new Error(
        "Diese Buchung kann nicht storniert werden (bereits storniert/korrigiert)."
      );
    }
    const now = nowIso();
    const prev_hash = await lastChainHash();
    const reversalBase = {
      id: uid(),
      datum: new Date().toISOString().slice(0, 10),
      beleg_nr: `STORNO-${original.beleg_nr}`,
      beschreibung: `Storno zu ${original.beleg_nr}: ${trimmed}`,
      soll_konto: original.haben_konto,
      haben_konto: original.soll_konto,
      betrag: original.betrag,
      ust_satz: original.ust_satz,
      status: "gebucht" as const,
      client_id: original.client_id,
      skonto_pct: null,
      skonto_tage: null,
      gegenseite: original.gegenseite,
      faelligkeit: null,
      version: 1,
      created_at: now,
      updated_at: now,
      storno_status: "reversal" as JournalStornoStatus,
      parent_entry_id: original.id,
      locked_at: computeLockedAt("gebucht"),
    };
    const entry_hash = await computeEntryHash(reversalBase, prev_hash);
    const reversal: JournalEntry = { ...reversalBase, prev_hash, entry_hash };
    const updatedOriginal: JournalEntry = {
      ...original,
      storno_status: "reversed",
      updated_at: now,
    };
    const copy = all.map((e) => (e.id === original.id ? updatedOriginal : e));
    store.setEntries([reversal, ...copy]);
    void log({
      action: "reverse",
      entity: "journal_entry",
      entity_id: original.id,
      summary: `Storno zu ${original.beleg_nr}: ${trimmed}`,
      before: original,
      after: updatedOriginal,
    });
    void log({
      action: "create",
      entity: "journal_entry",
      entity_id: reversal.id,
      summary: `Stornobuchung ${reversal.beleg_nr} · ${reversal.betrag.toFixed(2)} €`,
      after: reversal,
    });
    return reversal;
  }

  const companyId = requireCompanyId();
  const { data: originalRow, error: readErr } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  if (readErr) throw new Error(readErr.message);
  const original = originalRow as JournalEntry;
  if (original.storno_status && original.storno_status !== "active") {
    throw new Error(
      "Diese Buchung kann nicht storniert werden (bereits storniert/korrigiert)."
    );
  }

  const prev_hash = await lastChainHash();
  const reversalCanon = {
    datum: new Date().toISOString().slice(0, 10),
    beleg_nr: `STORNO-${original.beleg_nr}`,
    beschreibung: `Storno zu ${original.beleg_nr}: ${trimmed}`,
    soll_konto: original.haben_konto,
    haben_konto: original.soll_konto,
    betrag: Number(original.betrag),
    parent_entry_id: original.id,
  };
  const entry_hash = await computeEntryHash(reversalCanon, prev_hash);
  const reversalInput = {
    ...reversalCanon,
    ust_satz: original.ust_satz,
    status: "gebucht",
    storno_status: "reversal" as JournalStornoStatus,
    client_id: original.client_id,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: original.gegenseite,
    faelligkeit: null,
    version: 1,
    locked_at: computeLockedAt("gebucht"),
    prev_hash,
    entry_hash,
    company_id: companyId,
  };
  const { data: reversalRow, error: insertErr } = await supabase
    .from("journal_entries")
    .insert(reversalInput)
    .select("*")
    .single();
  if (insertErr) throw new Error(insertErr.message);
  const reversal = reversalRow as JournalEntry;

  const { data: updatedRow, error: updateErr } = await supabase
    .from("journal_entries")
    .update({ storno_status: "reversed" })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (updateErr) throw new Error(updateErr.message);
  const updatedOriginal = updatedRow as JournalEntry;

  void log({
    action: "reverse",
    entity: "journal_entry",
    entity_id: original.id,
    summary: `Storno zu ${original.beleg_nr}: ${trimmed}`,
    before: original,
    after: updatedOriginal,
  });
  void log({
    action: "create",
    entity: "journal_entry",
    entity_id: reversal.id,
    summary: `Stornobuchung ${reversal.beleg_nr} · ${Number(reversal.betrag).toFixed(2)} €`,
    after: reversal,
  });
  return reversal;
}

/**
 * Korrekturbuchung: Stornobuchung + Neu-Buchung in einem Schritt. Die
 * Neu-Buchung erhält storno_status="correction" und parent_entry_id.
 * Die Ursprungsbuchung bleibt als "reversed" sichtbar (Audit-Trail).
 */
export async function correctEntry(
  id: string,
  newInput: JournalInput,
  reason: string
): Promise<{ reversal: JournalEntry; correction: JournalEntry }> {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    throw new Error("Korrekturgrund ist Pflicht (mindestens 3 Zeichen).");
  }
  if (newInput.soll_konto === newInput.haben_konto) {
    throw new Error("Soll- und Haben-Konto dürfen nicht identisch sein.");
  }
  if (!(newInput.betrag > 0)) {
    throw new Error("Betrag muss größer als 0 sein.");
  }

  const reversal = await reverseEntry(id, `Korrektur: ${trimmed}`);

  // Korrektur-Buchung direkt mit finalem Lifecycle-Marker anlegen, damit der
  // Hash von Anfang an korrekt ist (kein nachträgliches UPDATE nötig).
  const correction = await createEntry(newInput, {
    storno_status: "correction",
    parent_entry_id: id,
  });
  void log({
    action: "correct",
    entity: "journal_entry",
    entity_id: correction.id,
    summary: `Korrekturbuchung zu ${id}: ${trimmed}`,
    after: correction,
  });
  return { reversal, correction };
}
