import type { Account, Kategorie, SKR } from "../types/db";
import { SKR03_SEED } from "./skr03";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";
import {
  isValidKontoNr,
  padKontoNr,
} from "../utils/accountNormalization";

export type AccountInput = {
  konto_nr: string;
  bezeichnung: string;
  kategorie: Kategorie;
  ust_satz: number | null;
  skr: SKR;
  is_active: boolean;
  /** Phase 3 / Schritt 6: ESt-Anlagen-Tags für semantisches Mapping.
   *  Format `"<anlage-id>:<feld>"`. Optional — fehlend = unveränderter
   *  DB-Stand bei Updates, leeres Array = "keine Zuordnung" bei Create. */
  tags?: string[];
};

export async function fetchAccounts(): Promise<Account[]> {
  if (!shouldUseSupabase()) {
    return store
      .getAccounts()
      .sort((a, b) => a.konto_nr.localeCompare(b.konto_nr));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("konto_nr");
  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}

function normalizeAccountInput<T extends Partial<AccountInput>>(input: T): T {
  if (!input.konto_nr) return input;
  if (!isValidKontoNr(input.konto_nr)) {
    throw new Error(
      "Kontonummer muss 4–8 Ziffern enthalten (Leerzeichen und Punkte werden entfernt)."
    );
  }
  return { ...input, konto_nr: padKontoNr(input.konto_nr) };
}

export async function createAccount(rawInput: AccountInput): Promise<Account> {
  const input = normalizeAccountInput(rawInput);
  if (!shouldUseSupabase()) {
    const existing = store.getAccounts();
    if (existing.some((a) => a.konto_nr === input.konto_nr)) {
      throw new Error(`Konto ${input.konto_nr} existiert bereits.`);
    }
    const next: Account = {
      id: uid(),
      created_at: new Date().toISOString(),
      ...input,
    };
    store.setAccounts([...existing, next]);
    return next;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("accounts")
    .insert({ ...input, company_id: companyId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Account;
}

export async function updateAccount(
  id: string,
  rawPatch: Partial<AccountInput>
): Promise<Account> {
  const patch = normalizeAccountInput(rawPatch);
  if (!shouldUseSupabase()) {
    const existing = store.getAccounts();
    const idx = existing.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Konto nicht gefunden.");
    const next: Account = { ...existing[idx], ...patch };
    const all = [...existing];
    all[idx] = next;
    store.setAccounts(all);
    return next;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("accounts")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Account;
}

export async function deleteAccount(id: string): Promise<void> {
  if (!shouldUseSupabase()) {
    const existing = store.getAccounts();
    store.setAccounts(existing.filter((a) => a.id !== id));
    return;
  }
  const companyId = requireCompanyId();
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

export async function importSkr03Chart(): Promise<{
  inserted: number;
  total_skr03: number;
}> {
  if (!shouldUseSupabase()) {
    const existing = store.getAccounts();
    const byNr = new Set(existing.map((a) => a.konto_nr));
    const additions: Account[] = [];
    for (const seed of SKR03_SEED) {
      if (byNr.has(seed.konto_nr)) continue;
      additions.push({
        id: uid(),
        created_at: new Date().toISOString(),
        ...seed,
      });
    }
    store.setAccounts([...existing, ...additions]);
    return { inserted: additions.length, total_skr03: SKR03_SEED.length };
  }
  const companyId = requireCompanyId();
  // Bereits vorhandene Konten ermitteln
  const { data: existing, error: exErr } = await supabase
    .from("accounts")
    .select("konto_nr")
    .eq("company_id", companyId);
  if (exErr) throw new Error(exErr.message);
  const existingSet = new Set((existing ?? []).map((a) => a.konto_nr));
  const additions = SKR03_SEED.filter((s) => !existingSet.has(s.konto_nr)).map(
    (s) => ({ ...s, company_id: companyId })
  );
  if (additions.length === 0) {
    return { inserted: 0, total_skr03: SKR03_SEED.length };
  }
  const { error: insErr } = await supabase.from("accounts").insert(additions);
  if (insErr) throw new Error(insErr.message);
  return { inserted: additions.length, total_skr03: SKR03_SEED.length };
}
