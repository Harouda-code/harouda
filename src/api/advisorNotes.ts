// Beraternotizen: append-only Kommentare an beliebige Entitäten.
//
// Keine Verschlüsselung über das hinaus, was Supabase von Haus aus bietet
// (TLS + at-rest). Wer echtes E2E will, bräuchte eine Client-Side-Schlüssel-
// infrastruktur, die es in dieser App nicht gibt.

import type { AdvisorNote } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { DEMO_MODE, supabase } from "./supabase";

export async function fetchNotesFor(
  entityType: string,
  entityId: string,
  clientId: string | null
): Promise<AdvisorNote[]> {
  if (!shouldUseSupabase()) {
    const all = store
      .getAdvisorNotes()
      .filter((n) => n.entity_type === entityType && n.entity_id === entityId);
    if (clientId === null) {
      return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    let legacyWarned = false;
    const filtered: AdvisorNote[] = [];
    for (const n of all) {
      if ((n as AdvisorNote).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "advisor_notes: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(n);
        continue;
      }
      if (n.client_id === clientId) filtered.push(n);
    }
    return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("advisor_notes")
    .select("*")
    .eq("company_id", companyId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdvisorNote[];
}

/** Gibt die Anzahl der Notizen pro entity_id (für ein bestimmtes entity_type)
 *  zurück — nützlich, um in Listen einen Badge zu zeigen. */
export async function fetchNoteCountsByEntity(
  entityType: string,
  clientId: string | null
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!shouldUseSupabase()) {
    let legacyWarned = false;
    for (const n of store.getAdvisorNotes()) {
      if (n.entity_type !== entityType) continue;
      if (clientId !== null) {
        if ((n as AdvisorNote).client_id === undefined) {
          if (!legacyWarned) {
            console.warn(
              "advisor_notes: legacy-row without client_id, returned unfiltered."
            );
            legacyWarned = true;
          }
        } else if (n.client_id !== clientId) {
          continue;
        }
      }
      map.set(n.entity_id, (map.get(n.entity_id) ?? 0) + 1);
    }
    return map;
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("advisor_notes")
    .select("entity_id")
    .eq("company_id", companyId)
    .eq("entity_type", entityType);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as { entity_id: string }[]) {
    map.set(row.entity_id, (map.get(row.entity_id) ?? 0) + 1);
  }
  return map;
}

export async function addNote(input: {
  entityType: string;
  entityId: string;
  body: string;
  clientId: string | null;
}): Promise<AdvisorNote> {
  const body = input.body.trim();
  if (body.length === 0) throw new Error("Notiz darf nicht leer sein.");
  if (body.length > 4000)
    throw new Error("Notiz ist zu lang (max. 4000 Zeichen).");

  if (!shouldUseSupabase()) {
    const now = new Date().toISOString();
    const note: AdvisorNote = {
      id: uid(),
      company_id: null,
      client_id: input.clientId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      author_user_id: null,
      author_email: DEMO_MODE ? "demo@harouda.local" : null,
      body,
      created_at: now,
    };
    store.setAdvisorNotes([note, ...store.getAdvisorNotes()]);
    void log({
      action: "create",
      entity: "settings",
      entity_id: note.id,
      summary: `Beraternotiz zu ${input.entityType} ${input.entityId}`,
    });
    return note;
  }

  const companyId = requireCompanyId();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("advisor_notes")
    .insert({
      company_id: companyId,
      client_id: input.clientId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      author_user_id: userData.user?.id ?? null,
      author_email: userData.user?.email ?? null,
      body,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const note = data as AdvisorNote;
  void log({
    action: "create",
    entity: "settings",
    entity_id: note.id,
    summary: `Beraternotiz zu ${input.entityType} ${input.entityId}`,
  });
  return note;
}

export async function deleteNote(
  id: string,
  clientId: string | null
): Promise<void> {
  if (!shouldUseSupabase()) {
    const before = store.getAdvisorNotes().find((n) => n.id === id);
    if (
      before &&
      clientId !== null &&
      before.client_id !== undefined &&
      before.client_id !== clientId
    ) {
      throw new Error("Notiz gehört nicht zum aktiven Mandanten.");
    }
    store.setAdvisorNotes(store.getAdvisorNotes().filter((n) => n.id !== id));
    if (before) {
      void log({
        action: "delete",
        entity: "settings",
        entity_id: id,
        summary: `Beraternotiz gelöscht (${before.entity_type} ${before.entity_id})`,
      });
    }
    return;
  }
  const companyId = requireCompanyId();
  const { data: before } = await supabase
    .from("advisor_notes")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  let delQ = supabase
    .from("advisor_notes")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) delQ = delQ.eq("client_id", clientId);
  const { error } = await delQ;
  if (error) throw new Error(error.message);
  void log({
    action: "delete",
    entity: "settings",
    entity_id: id,
    summary: before
      ? `Beraternotiz gelöscht (${(before as AdvisorNote).entity_type} ${
          (before as AdvisorNote).entity_id
        })`
      : `Beraternotiz ${id} gelöscht`,
  });
}
