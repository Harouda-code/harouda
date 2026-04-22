/**
 * Service-Layer fuer Inventur-Module (Sprint 17 / Schritt 6).
 *
 * Dual-Mode: DEMO via localStorage, Supabase via Tabellen aus
 * Migration 0034. Session + Anlagen-Checks + Bestaende getrennt.
 */
import type {
  InventurAnlage,
  InventurAnlageStatus,
  InventurBestand,
  InventurSession,
  InventurSessionStatus,
} from "../types/db";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type CreateSessionInput = {
  client_id: string;
  jahr: number;
  stichtag: string;
  notiz?: string;
};

// --- Session --------------------------------------------------------------

export async function listSessions(
  clientId: string
): Promise<InventurSession[]> {
  if (!shouldUseSupabase()) {
    return store
      .getInventurSessions()
      .filter((s) => s.client_id === clientId)
      .slice()
      .sort((a, b) => (b.jahr ?? 0) - (a.jahr ?? 0));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("inventur_sessions")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("jahr", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InventurSession[];
}

export async function getSessionForYear(
  clientId: string,
  jahr: number
): Promise<InventurSession | null> {
  const all = await listSessions(clientId);
  return all.find((s) => s.jahr === jahr) ?? null;
}

export async function createSession(
  input: CreateSessionInput
): Promise<InventurSession> {
  if (!shouldUseSupabase()) {
    const existing = store
      .getInventurSessions()
      .find((s) => s.client_id === input.client_id && s.jahr === input.jahr);
    if (existing) {
      throw new Error(
        `Inventur-Session fuer Jahr ${input.jahr} existiert bereits.`
      );
    }
    const now = new Date().toISOString();
    const row: InventurSession = {
      id: uid(),
      company_id: null,
      client_id: input.client_id,
      stichtag: input.stichtag,
      jahr: input.jahr,
      status: "offen",
      anlagen_inventur_abgeschlossen: false,
      bestands_inventur_abgeschlossen: false,
      notiz: input.notiz ?? null,
      erstellt_von: null,
      erstellt_am: now,
      abgeschlossen_am: null,
      created_at: now,
      updated_at: now,
    };
    store.setInventurSessions([row, ...store.getInventurSessions()]);
    return row;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("inventur_sessions")
    .insert({ ...input, company_id: companyId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as InventurSession;
}

export async function updateSession(
  id: string,
  patch: Partial<
    Pick<
      InventurSession,
      | "status"
      | "anlagen_inventur_abgeschlossen"
      | "bestands_inventur_abgeschlossen"
      | "notiz"
      | "abgeschlossen_am"
    >
  >
): Promise<InventurSession> {
  if (!shouldUseSupabase()) {
    const all = store.getInventurSessions();
    const idx = all.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Session nicht gefunden.");
    const next: InventurSession = {
      ...all[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    const copy = [...all];
    copy[idx] = next;
    store.setInventurSessions(copy);
    return next;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("inventur_sessions")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as InventurSession;
}

// --- Anlagen-Checks -------------------------------------------------------

export async function listAnlagenChecks(
  sessionId: string
): Promise<InventurAnlage[]> {
  if (!shouldUseSupabase()) {
    return store
      .getInventurAnlagen()
      .filter((x) => x.session_id === sessionId);
  }
  const { data, error } = await supabase
    .from("inventur_anlagen")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw new Error(error.message);
  return (data ?? []) as InventurAnlage[];
}

export type UpsertAnlageCheckInput = {
  session_id: string;
  anlage_id: string;
  status: InventurAnlageStatus;
  notiz?: string;
  abgangs_buchung_id?: string;
};

export async function upsertAnlageCheck(
  input: UpsertAnlageCheckInput
): Promise<InventurAnlage> {
  if (!shouldUseSupabase()) {
    const all = store.getInventurAnlagen();
    const idx = all.findIndex(
      (x) =>
        x.session_id === input.session_id && x.anlage_id === input.anlage_id
    );
    const now = new Date().toISOString();
    const existing = idx >= 0 ? all[idx] : null;
    const next: InventurAnlage = {
      id: existing?.id ?? uid(),
      session_id: input.session_id,
      anlage_id: input.anlage_id,
      status: input.status,
      notiz: input.notiz ?? existing?.notiz ?? null,
      abgangs_buchung_id:
        input.abgangs_buchung_id ?? existing?.abgangs_buchung_id ?? null,
      geprueft_am: now,
      geprueft_von: existing?.geprueft_von ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    const copy = all.slice();
    if (idx >= 0) copy[idx] = next;
    else copy.unshift(next);
    store.setInventurAnlagen(copy);
    return next;
  }
  const { data, error } = await supabase
    .from("inventur_anlagen")
    .upsert(
      {
        session_id: input.session_id,
        anlage_id: input.anlage_id,
        status: input.status,
        notiz: input.notiz ?? null,
        abgangs_buchung_id: input.abgangs_buchung_id ?? null,
        geprueft_am: new Date().toISOString(),
      },
      { onConflict: "session_id,anlage_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as InventurAnlage;
}

// --- Bestaende ------------------------------------------------------------

export async function listBestaende(
  sessionId: string
): Promise<InventurBestand[]> {
  if (!shouldUseSupabase()) {
    return store
      .getInventurBestaende()
      .filter((x) => x.session_id === sessionId);
  }
  const { data, error } = await supabase
    .from("inventur_bestaende")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw new Error(error.message);
  return (data ?? []) as InventurBestand[];
}

export type UpsertBestandInput = {
  id?: string;
  session_id: string;
  bezeichnung: string;
  vorrat_konto_nr: string;
  anfangsbestand: number;
  endbestand: number;
  niederstwert_aktiv: boolean;
  niederstwert_begruendung?: string;
  inventurliste_document_id?: string;
  bestandsveraenderungs_buchung_id?: string;
  notiz?: string;
};

export async function upsertBestand(
  input: UpsertBestandInput
): Promise<InventurBestand> {
  if (
    input.niederstwert_aktiv &&
    (!input.niederstwert_begruendung ||
      input.niederstwert_begruendung.trim().length === 0)
  ) {
    throw new Error(
      "Niederstwertprinzip aktiv ohne Begruendung (Pflicht nach § 253 Abs. 4 HGB)."
    );
  }
  if (!shouldUseSupabase()) {
    const all = store.getInventurBestaende();
    const now = new Date().toISOString();
    if (input.id) {
      const idx = all.findIndex((b) => b.id === input.id);
      if (idx < 0) throw new Error("Bestand nicht gefunden.");
      const existing = all[idx];
      const next: InventurBestand = {
        ...existing,
        ...input,
        niederstwert_begruendung:
          input.niederstwert_begruendung ?? existing.niederstwert_begruendung,
        inventurliste_document_id:
          input.inventurliste_document_id ??
          existing.inventurliste_document_id,
        bestandsveraenderungs_buchung_id:
          input.bestandsveraenderungs_buchung_id ??
          existing.bestandsveraenderungs_buchung_id,
        notiz: input.notiz ?? existing.notiz,
        updated_at: now,
      };
      const copy = [...all];
      copy[idx] = next;
      store.setInventurBestaende(copy);
      return next;
    }
    const row: InventurBestand = {
      id: uid(),
      session_id: input.session_id,
      bezeichnung: input.bezeichnung,
      vorrat_konto_nr: input.vorrat_konto_nr,
      anfangsbestand: input.anfangsbestand,
      endbestand: input.endbestand,
      niederstwert_aktiv: input.niederstwert_aktiv,
      niederstwert_begruendung: input.niederstwert_begruendung ?? null,
      inventurliste_document_id: input.inventurliste_document_id ?? null,
      bestandsveraenderungs_buchung_id:
        input.bestandsveraenderungs_buchung_id ?? null,
      notiz: input.notiz ?? null,
      created_at: now,
      updated_at: now,
    };
    store.setInventurBestaende([row, ...all]);
    return row;
  }
  const { data, error } = await supabase
    .from("inventur_bestaende")
    .upsert(
      {
        id: input.id,
        session_id: input.session_id,
        bezeichnung: input.bezeichnung,
        vorrat_konto_nr: input.vorrat_konto_nr,
        anfangsbestand: input.anfangsbestand,
        endbestand: input.endbestand,
        niederstwert_aktiv: input.niederstwert_aktiv,
        niederstwert_begruendung: input.niederstwert_begruendung ?? null,
        inventurliste_document_id: input.inventurliste_document_id ?? null,
        bestandsveraenderungs_buchung_id:
          input.bestandsveraenderungs_buchung_id ?? null,
        notiz: input.notiz ?? null,
      }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as InventurBestand;
}

export async function deleteBestand(id: string): Promise<void> {
  if (!shouldUseSupabase()) {
    const all = store.getInventurBestaende().filter((b) => b.id !== id);
    store.setInventurBestaende(all);
    return;
  }
  const { error } = await supabase
    .from("inventur_bestaende")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export type SessionStatus = InventurSessionStatus;
