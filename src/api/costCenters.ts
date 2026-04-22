import type { CostCenter } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type CostCenterInput = {
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function validate(input: CostCenterInput): void {
  const code = normalizeCode(input.code);
  if (!code) throw new Error("Kostenstellen-Code ist Pflicht.");
  if (code.length > 40)
    throw new Error("Kostenstellen-Code maximal 40 Zeichen.");
  if (!input.name.trim()) throw new Error("Bezeichnung ist Pflicht.");
}

export async function fetchCostCenters(): Promise<CostCenter[]> {
  if (!shouldUseSupabase()) {
    return store
      .getCostCenters()
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("cost_centers")
    .select("*")
    .eq("company_id", companyId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as CostCenter[];
}

export async function createCostCenter(
  input: CostCenterInput
): Promise<CostCenter> {
  validate(input);
  const code = normalizeCode(input.code);
  const now = new Date().toISOString();

  if (!shouldUseSupabase()) {
    const all = store.getCostCenters();
    if (all.some((c) => c.code === code)) {
      throw new Error(`Kostenstelle ${code} existiert bereits.`);
    }
    const next: CostCenter = {
      id: uid(),
      company_id: null,
      code,
      name: input.name.trim(),
      description: input.description ?? null,
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    store.setCostCenters([next, ...all]);
    void log({
      action: "create",
      entity: "settings",
      entity_id: next.id,
      summary: `Kostenstelle ${code} angelegt`,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("cost_centers")
    .insert({
      company_id: companyId,
      code,
      name: input.name.trim(),
      description: input.description ?? null,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = data as CostCenter;
  void log({
    action: "create",
    entity: "settings",
    entity_id: row.id,
    summary: `Kostenstelle ${code} angelegt`,
    after: row,
  });
  return row;
}

export async function updateCostCenter(
  id: string,
  patch: Partial<CostCenterInput>
): Promise<CostCenter> {
  const now = new Date().toISOString();
  const clean: Partial<CostCenter> = {
    ...(patch.code !== undefined ? { code: normalizeCode(patch.code) } : {}),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description ?? null }
      : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    updated_at: now,
  };

  if (!shouldUseSupabase()) {
    const all = store.getCostCenters();
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Kostenstelle nicht gefunden.");
    const before = all[idx];
    const next: CostCenter = { ...before, ...clean };
    const copy = [...all];
    copy[idx] = next;
    store.setCostCenters(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: next.id,
      summary: `Kostenstelle ${next.code} geändert`,
      before,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("cost_centers")
    .update(clean)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as CostCenter;
}

export async function deleteCostCenter(id: string): Promise<void> {
  if (!shouldUseSupabase()) {
    const before = store.getCostCenters().find((c) => c.id === id);
    store.setCostCenters(store.getCostCenters().filter((c) => c.id !== id));
    if (before) {
      void log({
        action: "delete",
        entity: "settings",
        entity_id: id,
        summary: `Kostenstelle ${before.code} entfernt`,
        before,
      });
    }
    return;
  }
  const companyId = requireCompanyId();
  const { error } = await supabase
    .from("cost_centers")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  void log({
    action: "delete",
    entity: "settings",
    entity_id: id,
    summary: `Kostenstelle ${id} entfernt`,
  });
}
