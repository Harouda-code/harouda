// Gemeinsame Helfer für die Dual-Mode-Persistenz.
//
// Regel:
//   DEMO_MODE=1          → localStorage (store.ts) als Backend
//   ansonsten            → Supabase mit RLS über company_id
//
// Die API-Module (accounts.ts, clients.ts, journal.ts, …) entscheiden pro
// Funktion, welches Backend genutzt wird. Dieser Ansatz ist bewusst explizit:
// keine Polymorphie-Zauberei, leicht zu prüfen und zu debuggen.

import { DEMO_MODE } from "./supabase";

// Sprint 20.A.1: Re-Export der kanonischen DEMO-Company-ID, damit
// Service-Layer + UI denselben Fallback nutzen wie CompanyContext.
export { DEMO_COMPANY_ID } from "../contexts/CompanyContext";

const COMPANY_STORAGE_KEY = "harouda:activeCompanyId";

/** Gibt die aktive company_id zurück (aus localStorage, gesetzt vom CompanyProvider). */
export function getActiveCompanyId(): string | null {
  try {
    return localStorage.getItem(COMPANY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Supabase-Modus aktiv? (nicht DEMO und company_id vorhanden) */
export function shouldUseSupabase(): boolean {
  if (DEMO_MODE) return false;
  return getActiveCompanyId() !== null;
}

/**
 * Wird von API-Methoden aufgerufen, wenn sie eine company_id brauchen,
 * aber noch keine gesetzt ist. Wirft einen sprechenden Fehler.
 */
export function requireCompanyId(): string {
  const id = getActiveCompanyId();
  if (!id) {
    throw new Error(
      "Keine aktive Firma ausgewählt. Bitte unter Einstellungen eine Firma aktivieren oder anlegen."
    );
  }
  return id;
}
