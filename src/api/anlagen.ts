/**
 * Repository für Anlagenbuchhaltung (Sprint 6 Teil 1).
 *
 * Dual-Mode nach Projekt-Konvention: DEMO schreibt in localStorage via
 * `store`, Supabase-Modus geht direkt gegen die Migration-0025-Tabellen.
 *
 * Stammdaten-Repo: nicht Teil der Journal-Hash-Kette. Die generierten
 * AfA-Buchungen selbst laufen über `createEntry` aus `api/journal.ts`
 * und unterliegen dort der Hash-Kette.
 */

import type { AfaBuchung, AfaMethode, Anlagegut } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type AnlagegutInput = {
  inventar_nr: string;
  bezeichnung: string;
  anschaffungsdatum: string;
  anschaffungskosten: number;
  nutzungsdauer_jahre: number;
  afa_methode: AfaMethode;
  konto_anlage: string;
  konto_afa: string;
  konto_abschreibung_kumuliert?: string | null;
  notizen?: string | null;
};

function normalizeInvNr(raw: string): string {
  return raw.trim().toUpperCase();
}

function validate(input: AnlagegutInput): void {
  const inv = normalizeInvNr(input.inventar_nr);
  if (!inv) throw new Error("Inventar-Nr ist Pflicht.");
  if (inv.length > 20) throw new Error("Inventar-Nr maximal 20 Zeichen.");
  if (!input.bezeichnung.trim()) throw new Error("Bezeichnung ist Pflicht.");
  if (!input.anschaffungsdatum.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error("Anschaffungsdatum muss ISO YYYY-MM-DD sein.");
  }
  if (!(input.anschaffungskosten > 0)) {
    throw new Error("Anschaffungskosten müssen > 0 sein.");
  }
  if (
    !Number.isInteger(input.nutzungsdauer_jahre) ||
    input.nutzungsdauer_jahre < 1 ||
    input.nutzungsdauer_jahre > 50
  ) {
    throw new Error("Nutzungsdauer muss ganzzahlig 1..50 sein.");
  }
  if (
    input.afa_methode !== "linear" &&
    input.afa_methode !== "gwg_sofort" &&
    input.afa_methode !== "sammelposten"
  ) {
    // degressiv ist in Teil 2b noch nicht freigegeben (§ 7 Abs. 2 EStG
    // ist für Neuanschaffungen ab 1.1.2025 ausgelaufen) — siehe
    // SPRINT-6-DECISIONS.md.
    throw new Error(
      `AfA-Methode '${input.afa_methode}' ist noch nicht implementiert.`
    );
  }
  if (
    input.afa_methode === "sammelposten" &&
    (input.anschaffungskosten <= 250 || input.anschaffungskosten > 1000)
  ) {
    throw new Error(
      `Sammelposten-AK muss > 250,00 € und ≤ 1.000,00 € sein (§ 6 Abs. 2a EStG).`
    );
  }
  if (!input.konto_anlage.trim()) throw new Error("Anlage-Konto ist Pflicht.");
  if (!input.konto_afa.trim()) throw new Error("AfA-Aufwand-Konto ist Pflicht.");
}

export async function fetchAnlagegueter(
  clientId: string | null
): Promise<Anlagegut[]> {
  if (!shouldUseSupabase()) {
    const all = store.getAnlagegueter();
    if (clientId === null) {
      return all
        .slice()
        .sort((a, b) => a.inventar_nr.localeCompare(b.inventar_nr));
    }
    const filtered: Anlagegut[] = [];
    let legacyWarned = false;
    for (const a of all) {
      if ((a as Anlagegut).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "anlagegueter: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(a);
        continue;
      }
      if (a.client_id === clientId) filtered.push(a);
    }
    return filtered
      .slice()
      .sort((a, b) => a.inventar_nr.localeCompare(b.inventar_nr));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("anlagegueter")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("inventar_nr");
  if (error) throw new Error(error.message);
  return (data ?? []) as Anlagegut[];
}

export async function createAnlagegut(
  input: AnlagegutInput,
  clientId: string | null
): Promise<Anlagegut> {
  validate(input);
  const inv = normalizeInvNr(input.inventar_nr);
  const now = new Date().toISOString();

  if (!shouldUseSupabase()) {
    const all = store.getAnlagegueter();
    if (all.some((a) => a.inventar_nr === inv)) {
      throw new Error(`Inventar-Nr ${inv} existiert bereits.`);
    }
    const next: Anlagegut = {
      id: uid(),
      company_id: null,
      client_id: clientId,
      inventar_nr: inv,
      bezeichnung: input.bezeichnung.trim(),
      anschaffungsdatum: input.anschaffungsdatum,
      anschaffungskosten: input.anschaffungskosten,
      nutzungsdauer_jahre: input.nutzungsdauer_jahre,
      afa_methode: input.afa_methode,
      konto_anlage: input.konto_anlage.trim(),
      konto_afa: input.konto_afa.trim(),
      konto_abschreibung_kumuliert:
        input.konto_abschreibung_kumuliert?.trim() || null,
      aktiv: true,
      abgangsdatum: null,
      abgangserloes: null,
      notizen: input.notizen ?? null,
      parent_id: null,
      created_at: now,
      updated_at: now,
    };
    store.setAnlagegueter([next, ...all]);
    void log({
      action: "create",
      entity: "settings",
      entity_id: next.id,
      summary: `Anlage ${inv} (${next.bezeichnung}) angelegt`,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("anlagegueter")
    .insert({
      company_id: companyId,
      client_id: clientId,
      inventar_nr: inv,
      bezeichnung: input.bezeichnung.trim(),
      anschaffungsdatum: input.anschaffungsdatum,
      anschaffungskosten: input.anschaffungskosten,
      nutzungsdauer_jahre: input.nutzungsdauer_jahre,
      afa_methode: input.afa_methode,
      konto_anlage: input.konto_anlage.trim(),
      konto_afa: input.konto_afa.trim(),
      konto_abschreibung_kumuliert:
        input.konto_abschreibung_kumuliert?.trim() || null,
      notizen: input.notizen ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Anlagegut;
}

export async function updateAnlagegut(
  id: string,
  patch: Partial<AnlagegutInput>,
  clientId: string | null
): Promise<Anlagegut> {
  const now = new Date().toISOString();
  const clean: Partial<Anlagegut> = {
    ...(patch.inventar_nr !== undefined
      ? { inventar_nr: normalizeInvNr(patch.inventar_nr) }
      : {}),
    ...(patch.bezeichnung !== undefined
      ? { bezeichnung: patch.bezeichnung.trim() }
      : {}),
    ...(patch.anschaffungsdatum !== undefined
      ? { anschaffungsdatum: patch.anschaffungsdatum }
      : {}),
    ...(patch.anschaffungskosten !== undefined
      ? { anschaffungskosten: patch.anschaffungskosten }
      : {}),
    ...(patch.nutzungsdauer_jahre !== undefined
      ? { nutzungsdauer_jahre: patch.nutzungsdauer_jahre }
      : {}),
    ...(patch.konto_anlage !== undefined
      ? { konto_anlage: patch.konto_anlage.trim() }
      : {}),
    ...(patch.konto_afa !== undefined
      ? { konto_afa: patch.konto_afa.trim() }
      : {}),
    ...(patch.konto_abschreibung_kumuliert !== undefined
      ? {
          konto_abschreibung_kumuliert:
            patch.konto_abschreibung_kumuliert?.trim() || null,
        }
      : {}),
    ...(patch.notizen !== undefined ? { notizen: patch.notizen ?? null } : {}),
    updated_at: now,
  };

  if (!shouldUseSupabase()) {
    const all = store.getAnlagegueter();
    const idx = all.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Anlage nicht gefunden.");
    if (
      clientId !== null &&
      all[idx].client_id !== undefined &&
      all[idx].client_id !== clientId
    ) {
      throw new Error("Anlage gehört nicht zum aktiven Mandanten.");
    }
    const before = all[idx];
    const next: Anlagegut = { ...before, ...clean };
    const copy = [...all];
    copy[idx] = next;
    store.setAnlagegueter(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: id,
      summary: `Anlage ${next.inventar_nr} geändert`,
      before,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  let q = supabase
    .from("anlagegueter")
    .update(clean)
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return data as Anlagegut;
}

export async function fetchAfaBuchungen(
  anlage_id?: string
): Promise<AfaBuchung[]> {
  if (!shouldUseSupabase()) {
    const all = store.getAfaBuchungen();
    const filtered = anlage_id
      ? all.filter((b) => b.anlage_id === anlage_id)
      : all;
    return filtered.slice().sort((a, b) => b.jahr - a.jahr);
  }
  const q = supabase.from("afa_buchungen").select("*").order("jahr", {
    ascending: false,
  });
  const { data, error } = anlage_id ? await q.eq("anlage_id", anlage_id) : await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as AfaBuchung[];
}

export async function saveAfaBuchung(
  input: Omit<AfaBuchung, "id" | "created_at">
): Promise<AfaBuchung> {
  const now = new Date().toISOString();
  if (!shouldUseSupabase()) {
    const all = store.getAfaBuchungen();
    const existing = all.find(
      (b) => b.anlage_id === input.anlage_id && b.jahr === input.jahr
    );
    if (existing) {
      const updated: AfaBuchung = {
        ...existing,
        afa_betrag: input.afa_betrag,
        restbuchwert: input.restbuchwert,
        journal_entry_id: input.journal_entry_id,
      };
      const copy = all.map((b) => (b.id === existing.id ? updated : b));
      store.setAfaBuchungen(copy);
      return updated;
    }
    const next: AfaBuchung = {
      id: uid(),
      anlage_id: input.anlage_id,
      jahr: input.jahr,
      afa_betrag: input.afa_betrag,
      restbuchwert: input.restbuchwert,
      journal_entry_id: input.journal_entry_id,
      created_at: now,
    };
    store.setAfaBuchungen([next, ...all]);
    return next;
  }
  const { data, error } = await supabase
    .from("afa_buchungen")
    .upsert(
      {
        anlage_id: input.anlage_id,
        jahr: input.jahr,
        afa_betrag: input.afa_betrag,
        restbuchwert: input.restbuchwert,
        journal_entry_id: input.journal_entry_id,
      },
      { onConflict: "anlage_id,jahr" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as AfaBuchung;
}

/**
 * Roh-Patch für Felder, die `updateAnlagegut` nicht akzeptiert
 * (`aktiv`, `abgangsdatum`, `abgangserloes`). Wird vom Abgangs-
 * Workflow genutzt; normale Edit-UI soll `updateAnlagegut` verwenden.
 */
export async function patchAnlageRaw(
  id: string,
  patch: Partial<Anlagegut>,
  clientId: string | null
): Promise<Anlagegut> {
  const now = new Date().toISOString();
  const allowed: Partial<Anlagegut> = {
    ...(patch.aktiv !== undefined ? { aktiv: patch.aktiv } : {}),
    ...(patch.abgangsdatum !== undefined
      ? { abgangsdatum: patch.abgangsdatum }
      : {}),
    ...(patch.abgangserloes !== undefined
      ? { abgangserloes: patch.abgangserloes }
      : {}),
    ...(patch.parent_id !== undefined ? { parent_id: patch.parent_id } : {}),
    updated_at: now,
  };
  if (!shouldUseSupabase()) {
    const all = store.getAnlagegueter();
    const idx = all.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Anlage nicht gefunden.");
    if (
      clientId !== null &&
      all[idx].client_id !== undefined &&
      all[idx].client_id !== clientId
    ) {
      throw new Error("Anlage gehört nicht zum aktiven Mandanten.");
    }
    const before = all[idx];
    const next: Anlagegut = { ...before, ...allowed };
    const copy = [...all];
    copy[idx] = next;
    store.setAnlagegueter(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: id,
      summary: `Anlage ${next.inventar_nr}: Abgang gebucht`,
      before,
      after: next,
    });
    return next;
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("anlagegueter")
    .update(allowed)
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return data as Anlagegut;
}

export async function deleteAnlagegut(
  id: string,
  clientId: string | null
): Promise<void> {
  if (!shouldUseSupabase()) {
    const before = store.getAnlagegueter().find((a) => a.id === id);
    if (
      before &&
      clientId !== null &&
      before.client_id !== undefined &&
      before.client_id !== clientId
    ) {
      throw new Error("Anlage gehört nicht zum aktiven Mandanten.");
    }
    store.setAnlagegueter(store.getAnlagegueter().filter((a) => a.id !== id));
    store.setAfaBuchungen(
      store.getAfaBuchungen().filter((b) => b.anlage_id !== id)
    );
    if (before) {
      void log({
        action: "delete",
        entity: "settings",
        entity_id: id,
        summary: `Anlage ${before.inventar_nr} gelöscht`,
        before,
      });
    }
    return;
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("anlagegueter")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
