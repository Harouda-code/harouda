// Lieferanten-Präferenzen: merken, welche Konten beim letzten Mal für einen
// bestimmten Lieferanten gebucht wurden. Keine ML, nur Memoisierung der
// Entscheidungen des Nutzers.

import type { SupplierPreference } from "../types/db";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

/** Normalisiert den Lieferantennamen für den Storage-Key. */
export function normalizeSupplierKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9äöüß\s&.-]/g, "");
}

export async function fetchSupplierPreferences(
  clientId: string | null
): Promise<SupplierPreference[]> {
  if (!shouldUseSupabase()) {
    const all = store.getSupplierPrefs();
    if (clientId === null) {
      return all
        .slice()
        .sort((a, b) => b.last_used_at.localeCompare(a.last_used_at));
    }
    let legacyWarned = false;
    const filtered: SupplierPreference[] = [];
    for (const p of all) {
      if ((p as SupplierPreference).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "supplier_preferences: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(p);
        continue;
      }
      if (p.client_id === clientId) filtered.push(p);
    }
    return filtered
      .slice()
      .sort((a, b) => b.last_used_at.localeCompare(a.last_used_at));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("supplier_preferences")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("last_used_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SupplierPreference[];
}

export async function recordSupplierBooking(input: {
  supplier: string;
  soll_konto: string | null;
  haben_konto: string | null;
  clientId: string | null;
}): Promise<void> {
  const key = normalizeSupplierKey(input.supplier);
  if (!key || key.length < 2) return; // zu kurz, um sinnvoll zu memoizen
  const now = new Date().toISOString();

  if (!shouldUseSupabase()) {
    const all = store.getSupplierPrefs();
    // Supplier-Preferences sind nach (supplier_key, clientId) einzigartig —
    // unterschiedliche Mandanten können denselben Lieferanten unterschiedlich
    // verbuchen.
    const idx = all.findIndex(
      (p) => p.supplier_key === key && (p.client_id ?? null) === input.clientId
    );
    if (idx >= 0) {
      const prev = all[idx];
      all[idx] = {
        ...prev,
        display_name: input.supplier,
        soll_konto: input.soll_konto ?? prev.soll_konto,
        haben_konto: input.haben_konto ?? prev.haben_konto,
        usage_count: prev.usage_count + 1,
        last_used_at: now,
      };
      store.setSupplierPrefs([...all]);
    } else {
      const next: SupplierPreference = {
        id: uid(),
        company_id: null,
        client_id: input.clientId,
        supplier_key: key,
        display_name: input.supplier,
        soll_konto: input.soll_konto,
        haben_konto: input.haben_konto,
        usage_count: 1,
        first_used_at: now,
        last_used_at: now,
      };
      store.setSupplierPrefs([next, ...all]);
    }
    return;
  }

  const companyId = requireCompanyId();
  // Upsert mit Count-Erhöhung passiert in zwei Schritten (Supabase hat
  // keine "count + 1"-Operation im Upsert).
  let existingQ = supabase
    .from("supplier_preferences")
    .select("*")
    .eq("company_id", companyId)
    .eq("supplier_key", key);
  if (input.clientId !== null) existingQ = existingQ.eq("client_id", input.clientId);
  const { data: existing } = await existingQ.maybeSingle();
  if (existing) {
    const prev = existing as SupplierPreference;
    const { error } = await supabase
      .from("supplier_preferences")
      .update({
        display_name: input.supplier,
        soll_konto: input.soll_konto ?? prev.soll_konto,
        haben_konto: input.haben_konto ?? prev.haben_konto,
        usage_count: prev.usage_count + 1,
        last_used_at: now,
      })
      .eq("id", prev.id)
      .eq("company_id", companyId);
    if (error) console.warn("supplier_preferences update failed:", error.message);
  } else {
    const { error } = await supabase.from("supplier_preferences").insert({
      company_id: companyId,
      client_id: input.clientId,
      supplier_key: key,
      display_name: input.supplier,
      soll_konto: input.soll_konto,
      haben_konto: input.haben_konto,
    });
    if (error) console.warn("supplier_preferences insert failed:", error.message);
  }
}

/** Findet die beste Übereinstimmung für eine Beschreibung oder einen
 *  Gegenseiten-Namen. Priorisiert exakte Schlüssel-Treffer; fällt zurück auf
 *  Substring-Match im Schlüssel. */
export function findSupplierPreference(
  query: string,
  prefs: SupplierPreference[]
): { pref: SupplierPreference; matchKind: "exact" | "substring" } | null {
  const qKey = normalizeSupplierKey(query);
  if (!qKey || qKey.length < 2) return null;

  const exact = prefs.find((p) => p.supplier_key === qKey);
  if (exact) return { pref: exact, matchKind: "exact" };

  // Substring-Match: der gespeicherte Lieferantenname kommt in der Anfrage vor.
  // Wir suchen den längsten solchen Match (um "e.on" vor "n" zu bevorzugen).
  let best: SupplierPreference | null = null;
  let bestLen = 0;
  for (const p of prefs) {
    if (p.supplier_key.length < 3) continue;
    if (qKey.includes(p.supplier_key) && p.supplier_key.length > bestLen) {
      best = p;
      bestLen = p.supplier_key.length;
    }
  }
  if (best) return { pref: best, matchKind: "substring" };
  return null;
}
