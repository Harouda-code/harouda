// App-Log: getrennt vom finanziell relevanten Audit-Log.
//
// Zweck: technische Ereignisse (Fehler, Performance, Feature-Nutzung) so
// protokollieren, dass sie NICHT in der WORM-Audit-Kette landen und nicht
// deren Hash-Integrität belasten. GoBD-relevante Änderungen laufen weiterhin
// über api/audit.ts.
//
// Hinweis: Ein client-seitiges "Verschlüsseln" des App-Logs ist in einem
// Browser-SPA ohne Server-KMS weitgehend Placebo — der Schlüssel müsste
// mitgeliefert werden. Wir verzichten bewusst und empfehlen stattdessen
// TLS + serverseitige Row Level Security.

import type { AppLogEntry, AppLogLevel } from "../types/db";
import { store, uid } from "./store";
import { getActiveCompanyId, shouldUseSupabase } from "./db";
import { DEMO_MODE, supabase } from "./supabase";

let cachedUserId: string | null | undefined;

async function currentUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  if (DEMO_MODE) {
    cachedUserId = "00000000-0000-0000-0000-000000000001";
    return cachedUserId;
  }
  try {
    const { data } = await supabase.auth.getUser();
    cachedUserId = data.user?.id ?? null;
  } catch {
    cachedUserId = null;
  }
  return cachedUserId;
}

export function resetAppLogUserCache() {
  cachedUserId = undefined;
}

function sanitizeContext(
  context: unknown
): Record<string, unknown> | null {
  if (!context) return null;
  if (typeof context !== "object") {
    return { value: String(context) };
  }
  try {
    // Stellt sicher, dass das Objekt JSON-serialisierbar ist.
    return JSON.parse(JSON.stringify(context)) as Record<string, unknown>;
  } catch {
    return { note: "context not serializable" };
  }
}

/** Schreibt einen technischen Log-Eintrag. Nicht blockierend; Fehler werden
 *  auf die Konsole geworfen, aber nie weiter eskaliert. */
export async function logApp(
  level: AppLogLevel,
  message: string,
  context?: unknown
): Promise<void> {
  const userId = await currentUserId();
  const entry: AppLogEntry = {
    id: uid(),
    at: new Date().toISOString(),
    level,
    message: message.slice(0, 1000),
    context: sanitizeContext(context),
    user_id: userId,
    company_id: getActiveCompanyId(),
  };

  if (!shouldUseSupabase()) {
    store.appendAppLog(entry);
    return;
  }

  const { error } = await supabase.from("app_logs").insert({
    at: entry.at,
    level: entry.level,
    message: entry.message,
    context: entry.context,
    user_id: entry.user_id,
    company_id: entry.company_id,
  });
  if (error) {
    // Fallback: lokal ablegen, damit im Fehlerfall nichts verlorengeht.
    store.appendAppLog(entry);
    console.warn("app_logs insert failed, stored locally:", error.message);
  }
}

export async function fetchAppLog(): Promise<AppLogEntry[]> {
  if (!shouldUseSupabase()) {
    return store.getAppLog();
  }
  const companyId = getActiveCompanyId();
  let q = supabase
    .from("app_logs")
    .select("*")
    .order("at", { ascending: false })
    .limit(500);
  if (companyId) q = q.eq("company_id", companyId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as AppLogEntry[];
}

/** Installiert globale Fehler-Handler einmalig pro Seitenladung. */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __haroudaErrorHandlersInstalled?: boolean };
  if (w.__haroudaErrorHandlersInstalled) return;
  w.__haroudaErrorHandlersInstalled = true;

  window.addEventListener("error", (event) => {
    void logApp("error", event.message || "window.onerror", {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
      url: typeof location !== "undefined" ? location.pathname : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";
    void logApp("error", message, {
      stack: reason instanceof Error ? reason.stack : undefined,
      url: typeof location !== "undefined" ? location.pathname : undefined,
    });
  });
}
