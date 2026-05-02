// ============================================================================
// Settings-API · Dual-Mode-Persistenz
// (Charge 7, Aufgabe 4)
//
// Backend-Wahl:
//   DEMO_MODE oder kein eingeloggter User -> localStorage[harouda:settings]
//   sonst                                 -> Supabase public.settings
//
// Scope dieses PRs:
//   Alle Settings werden mit mandant_id = NULL gespeichert (globale,
//   nutzerbezogene Settings). Mandanten-spezifische Overrides sind
//   Future Work und vom Schema (UNIQUE (user_id, mandant_id)) bereits
//   vorbereitet.
//
// Rechtliche Grundlage:
//   DSGVO Art. 32 (Sicherheit der Verarbeitung).
// ============================================================================

import { supabase, DEMO_MODE } from "./supabase";

const STORAGE_KEY = "harouda:settings";

/**
 * Generischer Settings-Payload. Das konkrete Schema lebt in
 * src/contexts/SettingsContext.tsx (Type Settings) und wird beim
 * Auslesen mit DEFAULTS gemerged. Die API-Schicht bleibt absichtlich
 * agnostisch — so koennen Felder im Settings-Type ergaenzt werden,
 * ohne diese Schicht zu aendern.
 */
export type SettingsPayload = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Backend-Erkennung
// ---------------------------------------------------------------------------

async function getCurrentUserId(): Promise<string | null> {
  if (DEMO_MODE) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

/**
 * Settings sollen nur dann in Supabase landen, wenn:
 *   - DEMO_MODE aus ist
 *   - ein User authentifiziert ist
 *
 * Eine `company_id` (= Kanzlei) ist NICHT erforderlich, da Settings
 * user-scoped sind, nicht kanzlei-scoped.
 */
async function shouldUseSupabaseForSettings(): Promise<{
  useSupabase: boolean;
  userId: string | null;
}> {
  if (DEMO_MODE) return { useSupabase: false, userId: null };
  const userId = await getCurrentUserId();
  return { useSupabase: userId !== null, userId };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Liest den Settings-Payload des aktuellen Users.
 * Liefert `null`, wenn noch keine Settings gespeichert sind (Erstnutzer).
 */
export async function fetchSettings(): Promise<SettingsPayload | null> {
  const { useSupabase, userId } = await shouldUseSupabaseForSettings();

  if (!useSupabase) {
    return readLocalStorage();
  }

  const { data, error } = await supabase
    .from("settings")
    .select("payload")
    .eq("user_id", userId!)
    .is("mandant_id", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return (data.payload ?? null) as SettingsPayload | null;
}

/**
 * Speichert (upsert) den Settings-Payload des aktuellen Users.
 *
 * Hinweis: `user_id` muss explizit gesetzt werden — `auth.uid()` ist
 * eine SQL-Funktion und steht clientseitig nicht zur Verfuegung. Die
 * RLS-Policy `WITH CHECK (user_id = auth.uid())` validiert anschliessend
 * gegen den JWT, sodass Spoofing serverseitig blockiert wird.
 */
export async function saveSettings(
  payload: SettingsPayload
): Promise<void> {
  const { useSupabase, userId } = await shouldUseSupabaseForSettings();

  if (!useSupabase) {
    writeLocalStorage(payload);
    return;
  }

  const { error } = await supabase
    .from("settings")
    .upsert(
      {
        user_id: userId!,
        mandant_id: null,
        payload,
      },
      { onConflict: "user_id,mandant_id" }
    );

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// localStorage-Helfer (Fallback + Demo-Mode)
// ---------------------------------------------------------------------------

function readLocalStorage(): SettingsPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SettingsPayload;
  } catch {
    return null;
  }
}

function writeLocalStorage(payload: SettingsPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota oder Privacy-Mode — leise schlucken, Daten bleiben in-memory.
  }
}

// ---------------------------------------------------------------------------
// Migrations-Helfer (One-Time-Sync localStorage -> Supabase)
// ---------------------------------------------------------------------------

const MIGRATION_FLAG = "harouda:settings:migrated";

/**
 * Liest den (eventuell vorhandenen) localStorage-Payload, wenn der User
 * im Cloud-Modus ist und noch keine Cloud-Settings hat. Zweck: einmaliger
 * Sync nach Login. Gibt den Payload zurueck oder `null`, wenn nichts zu
 * migrieren ist.
 *
 * Diese Funktion FUEHRT die Migration NICHT aus — sie liefert nur die
 * Daten. Der SettingsContext entscheidet, wann gespeichert und wann
 * der Flag gesetzt wird.
 */
export function readPendingLocalStorageMigration(): SettingsPayload | null {
  try {
    if (localStorage.getItem(MIGRATION_FLAG) === "1") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SettingsPayload;
  } catch {
    return null;
  }
}

/**
 * Markiert die localStorage-Migration als abgeschlossen. Idempotent.
 * Der Original-Eintrag bleibt zunaechst bestehen (Sicherheitsnetz fuer
 * 2 Wochen) — Aufraeumen erfolgt in einem Folge-PR.
 */
export function markLocalStorageMigrationComplete(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    // ignore
  }
}
