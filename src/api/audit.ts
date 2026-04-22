import type { AuditAction, AuditLogEntry } from "../types/db";
import { store, uid } from "./store";
import { DEMO_MODE, supabase } from "./supabase";
import { shouldUseSupabase, requireCompanyId } from "./db";

const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

let cachedActor: string | null | undefined = undefined;

async function currentActor(): Promise<string | null> {
  if (cachedActor !== undefined) return cachedActor;
  if (DEMO_MODE) {
    cachedActor = "demo@harouda.local";
    return cachedActor;
  }
  try {
    const { data } = await supabase.auth.getUser();
    cachedActor = data.user?.email ?? null;
  } catch {
    cachedActor = null;
  }
  return cachedActor ?? null;
}

export function resetAuditActorCache() {
  cachedActor = undefined;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJSON).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalJSON(obj[k]))
      .join(",") +
    "}"
  );
}

export type LogInput = {
  action: AuditAction;
  entity: AuditLogEntry["entity"];
  entity_id: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  /** Wenn false, wird der User-Agent bewusst NICHT mitgeschrieben (z. B. Login-Events
   *  bei Privacy-sensitiven Installationen). Default: true. */
  captureUserAgent?: boolean;
};

function readUserAgent(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (!ua) return null;
  // Kürzen, damit der Audit-Log nicht zu lang wird.
  return ua.length > 240 ? ua.slice(0, 240) : ua;
}

export async function log(entry: LogInput): Promise<void> {
  const capture = entry.captureUserAgent !== false;
  const user_agent = capture ? readUserAgent() : null;

  if (!shouldUseSupabase()) {
    const existing = store.getAudit();
    const prev_hash = existing[0]?.hash ?? GENESIS_HASH;
    const base = {
      id: uid(),
      at: new Date().toISOString(),
      actor: await currentActor(),
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id,
      summary: entry.summary,
      before: entry.before ?? null,
      after: entry.after ?? null,
      user_agent,
      prev_hash,
    };
    const hash = await sha256Hex(prev_hash + canonicalJSON(base));
    const row: AuditLogEntry = { ...base, hash };
    store.appendAudit(row);
    return;
  }

  const companyId = requireCompanyId();
  const { data: prevRows, error: prevErr } = await supabase
    .from("audit_log")
    .select("hash")
    .eq("company_id", companyId)
    .order("at", { ascending: false })
    .limit(1);
  if (prevErr) {
    console.error("Audit prev-hash fetch failed:", prevErr);
    return;
  }
  const prev_hash = prevRows?.[0]?.hash ?? GENESIS_HASH;
  const base = {
    at: new Date().toISOString(),
    actor: await currentActor(),
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entity_id,
    summary: entry.summary,
    before: entry.before ?? null,
    after: entry.after ?? null,
    user_agent,
    prev_hash,
  };
  const hash = await sha256Hex(
    prev_hash + canonicalJSON({ ...base, id: "" })
  );
  const { error } = await supabase.from("audit_log").insert({
    ...base,
    hash,
    company_id: companyId,
  });
  if (error) console.error("Audit insert failed:", error);
}

export async function fetchAuditLog(): Promise<AuditLogEntry[]> {
  if (!shouldUseSupabase()) return store.getAudit();
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("company_id", companyId)
    .order("at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLogEntry[];
}

export type VerifyResult = {
  ok: boolean;
  total: number;
  firstBreakAt: number | null;
  message: string;
};

export async function verifyAuditChain(): Promise<VerifyResult> {
  const rows = [...(await fetchAuditLog())].reverse();
  let expectedPrev = GENESIS_HASH;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.prev_hash !== expectedPrev) {
      return {
        ok: false,
        total: rows.length,
        firstBreakAt: i,
        message: `Chain bei Eintrag #${i + 1} (${new Date(r.at).toLocaleString(
          "de-DE"
        )}) gebrochen: prev_hash stimmt nicht mit dem vorherigen hash überein.`,
      };
    }
    const base = {
      id: r.id,
      at: r.at,
      actor: r.actor,
      action: r.action,
      entity: r.entity,
      entity_id: r.entity_id,
      summary: r.summary,
      before: r.before,
      after: r.after,
      user_agent: r.user_agent ?? null,
      prev_hash: r.prev_hash,
    };
    // Ältere Einträge ohne user_agent-Feld müssen ohne diesen Key
    // rekonstruiert werden, damit die Kette intakt bleibt.
    const legacyBase: Record<string, unknown> = { ...base };
    delete legacyBase.user_agent;
    const recomputed = await sha256Hex(r.prev_hash + canonicalJSON(base));
    const recomputedNoId = await sha256Hex(
      r.prev_hash + canonicalJSON({ ...base, id: "" })
    );
    const recomputedLegacy = await sha256Hex(
      r.prev_hash + canonicalJSON(legacyBase)
    );
    const recomputedLegacyNoId = await sha256Hex(
      r.prev_hash + canonicalJSON({ ...legacyBase, id: "" })
    );
    if (
      recomputed !== r.hash &&
      recomputedNoId !== r.hash &&
      recomputedLegacy !== r.hash &&
      recomputedLegacyNoId !== r.hash
    ) {
      return {
        ok: false,
        total: rows.length,
        firstBreakAt: i,
        message: `Hash bei Eintrag #${i + 1} stimmt nicht — die Zeile wurde nachträglich verändert.`,
      };
    }
    expectedPrev = r.hash;
  }
  return {
    ok: true,
    total: rows.length,
    firstBreakAt: null,
    message: `Alle ${rows.length} Einträge verifiziert — Kette intakt.`,
  };
}
