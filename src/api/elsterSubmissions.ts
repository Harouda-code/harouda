// Dual-Mode-Verzeichnis der ELSTER-Abgaben (manuell).
//
// Die eigentliche Übertragung läuft außerhalb der App über ElsterOnline-Portal
// oder ein zertifiziertes Desktop-Programm. Dieses Modul hält lediglich Buch
// darüber, wann welche Periode exportiert und extern eingereicht wurde.

import type {
  ElsterSubmission,
  ElsterFormType,
  ElsterSubmissionStatus,
} from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type CreateSubmissionInput = {
  form_type: ElsterFormType | string;
  year: number;
  period: number | null;
  label: string;
  file_sha256?: string | null;
  file_bytes?: number | null;
  notes?: string | null;
  /** Wenn das XML bereits heruntergeladen wurde, direkt auf 'exported'. */
  initialStatus?: ElsterSubmissionStatus;
};

export async function fetchSubmissions(
  clientId: string | null
): Promise<ElsterSubmission[]> {
  if (!shouldUseSupabase()) {
    const all = store.getElsterSubmissions();
    if (clientId === null) {
      return all
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    let legacyWarned = false;
    const filtered: ElsterSubmission[] = [];
    for (const s of all) {
      if ((s as ElsterSubmission).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "elster_submissions: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(s);
        continue;
      }
      if (s.client_id === clientId) filtered.push(s);
    }
    return filtered
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("elster_submissions")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q
    .order("year", { ascending: false })
    .order("period", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ElsterSubmission[];
}

export async function upsertSubmission(
  input: CreateSubmissionInput,
  clientId: string | null
): Promise<ElsterSubmission> {
  const label = input.label.trim() || `${input.form_type} ${input.year}`;
  const status: ElsterSubmissionStatus = input.initialStatus ?? "exported";

  if (!shouldUseSupabase()) {
    const all = store.getElsterSubmissions();
    // Upsert per (form_type, year, period)
    // Upsert-Schlüssel jetzt (clientId, form_type, year, period) — dieselbe
    // UStVA-Periode kann theoretisch mehrere Mandanten haben.
    const idx = all.findIndex(
      (s) =>
        (s.client_id ?? null) === clientId &&
        s.form_type === input.form_type &&
        s.year === input.year &&
        (s.period ?? null) === (input.period ?? null)
    );
    const now = new Date().toISOString();
    const base: ElsterSubmission =
      idx >= 0
        ? {
            ...all[idx],
            label,
            file_sha256: input.file_sha256 ?? all[idx].file_sha256,
            file_bytes: input.file_bytes ?? all[idx].file_bytes,
            notes: input.notes ?? all[idx].notes,
            status,
          }
        : {
            id: uid(),
            company_id: null,
            client_id: clientId,
            created_by: null,
            created_at: now,
            form_type: input.form_type,
            year: input.year,
            period: input.period,
            label,
            file_sha256: input.file_sha256 ?? null,
            file_bytes: input.file_bytes ?? null,
            status,
            transfer_ticket: null,
            notes: input.notes ?? null,
            transmitted_at: null,
            acknowledged_at: null,
          };
    const next = idx >= 0 ? [...all] : [base, ...all];
    if (idx >= 0) next[idx] = base;
    store.setElsterSubmissions(next);
    void log({
      action: idx >= 0 ? "update" : "create",
      entity: "settings",
      entity_id: base.id,
      summary: `ELSTER-Submission ${label} gespeichert (Status: ${status})`,
      after: base,
    });
    return base;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("elster_submissions")
    .upsert(
      {
        company_id: companyId,
        client_id: clientId,
        form_type: input.form_type,
        year: input.year,
        period: input.period,
        label,
        file_sha256: input.file_sha256 ?? null,
        file_bytes: input.file_bytes ?? null,
        status,
        notes: input.notes ?? null,
      },
      { onConflict: "company_id,form_type,year,period" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = data as ElsterSubmission;
  void log({
    action: "create",
    entity: "settings",
    entity_id: row.id,
    summary: `ELSTER-Submission ${label} gespeichert (Status: ${status})`,
    after: row,
  });
  return row;
}

export type StatusTransitionInput = {
  id: string;
  status: ElsterSubmissionStatus;
  transfer_ticket?: string | null;
  notes?: string | null;
};

export async function setSubmissionStatus(
  input: StatusTransitionInput,
  clientId: string | null
): Promise<ElsterSubmission> {
  const now = new Date().toISOString();
  const patch: Partial<ElsterSubmission> = {
    status: input.status,
    transfer_ticket: input.transfer_ticket ?? null,
    notes: input.notes ?? null,
  };
  if (input.status === "transmitted-manually") patch.transmitted_at = now;
  if (input.status === "acknowledged") patch.acknowledged_at = now;

  if (!shouldUseSupabase()) {
    const all = store.getElsterSubmissions();
    const idx = all.findIndex((s) => s.id === input.id);
    if (idx < 0) throw new Error("Submission nicht gefunden.");
    if (
      clientId !== null &&
      all[idx].client_id !== undefined &&
      all[idx].client_id !== clientId
    ) {
      throw new Error("Submission gehört nicht zum aktiven Mandanten.");
    }
    const before = all[idx];
    const after: ElsterSubmission = { ...before, ...patch };
    const copy = [...all];
    copy[idx] = after;
    store.setElsterSubmissions(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: after.id,
      summary: `ELSTER-Submission ${after.label}: ${before.status} → ${after.status}`,
      before,
      after,
    });
    return after;
  }

  const companyId = requireCompanyId();
  const { data: beforeRow } = await supabase
    .from("elster_submissions")
    .select("*")
    .eq("id", input.id)
    .eq("company_id", companyId)
    .single();
  let uQ = supabase
    .from("elster_submissions")
    .update(patch)
    .eq("id", input.id)
    .eq("company_id", companyId);
  if (clientId !== null) uQ = uQ.eq("client_id", clientId);
  const { data, error } = await uQ.select("*").single();
  if (error) throw new Error(error.message);
  const row = data as ElsterSubmission;
  void log({
    action: "update",
    entity: "settings",
    entity_id: row.id,
    summary: `ELSTER-Submission ${row.label}: ${
      (beforeRow as ElsterSubmission | null)?.status ?? "?"
    } → ${row.status}`,
    before: beforeRow,
    after: row,
  });
  return row;
}
