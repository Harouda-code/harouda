import type { CostCarrier } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type CostCarrierInput = {
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function validate(input: CostCarrierInput): void {
  const code = normalizeCode(input.code);
  if (!code) throw new Error("Kostenträger-Code ist Pflicht.");
  if (code.length > 40)
    throw new Error("Kostenträger-Code maximal 40 Zeichen.");
  if (!input.name.trim()) throw new Error("Bezeichnung ist Pflicht.");
}

export async function fetchCostCarriers(): Promise<CostCarrier[]> {
  if (!shouldUseSupabase()) {
    return store
      .getCostCarriers()
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("cost_carriers")
    .select("*")
    .eq("company_id", companyId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as CostCarrier[];
}

export async function createCostCarrier(
  input: CostCarrierInput
): Promise<CostCarrier> {
  validate(input);
  const code = normalizeCode(input.code);
  const now = new Date().toISOString();

  if (!shouldUseSupabase()) {
    const all = store.getCostCarriers();
    if (all.some((c) => c.code === code)) {
      throw new Error(`Kostenträger ${code} existiert bereits.`);
    }
    const next: CostCarrier = {
      id: uid(),
      company_id: null,
      code,
      name: input.name.trim(),
      description: input.description ?? null,
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    store.setCostCarriers([next, ...all]);
    void log({
      action: "create",
      entity: "settings",
      entity_id: next.id,
      summary: `Kostenträger ${code} angelegt`,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("cost_carriers")
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
  const row = data as CostCarrier;
  void log({
    action: "create",
    entity: "settings",
    entity_id: row.id,
    summary: `Kostenträger ${code} angelegt`,
    after: row,
  });
  return row;
}

export async function updateCostCarrier(
  id: string,
  patch: Partial<CostCarrierInput>
): Promise<CostCarrier> {
  const now = new Date().toISOString();
  const clean: Partial<CostCarrier> = {
    ...(patch.code !== undefined ? { code: normalizeCode(patch.code) } : {}),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description ?? null }
      : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    updated_at: now,
  };

  if (!shouldUseSupabase()) {
    const all = store.getCostCarriers();
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Kostenträger nicht gefunden.");
    const before = all[idx];
    const next: CostCarrier = { ...before, ...clean };
    const copy = [...all];
    copy[idx] = next;
    store.setCostCarriers(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: next.id,
      summary: `Kostenträger ${next.code} geändert`,
      before,
      after: next,
    });
    return next;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("cost_carriers")
    .update(clean)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as CostCarrier;
}

export async function deleteCostCarrier(id: string): Promise<void> {
  if (!shouldUseSupabase()) {
    const before = store.getCostCarriers().find((c) => c.id === id);
    store.setCostCarriers(store.getCostCarriers().filter((c) => c.id !== id));
    if (before) {
      void log({
        action: "delete",
        entity: "settings",
        entity_id: id,
        summary: `Kostenträger ${before.code} entfernt`,
        before,
      });
    }
    return;
  }
  const companyId = requireCompanyId();
  const { error } = await supabase
    .from("cost_carriers")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
  void log({
    action: "delete",
    entity: "settings",
    entity_id: id,
    summary: `Kostenträger ${id} entfernt`,
  });
}
