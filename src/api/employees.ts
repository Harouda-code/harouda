// Mitarbeiter-Stammdaten (Dual-Mode: localStorage im DEMO, Supabase produktiv).
//
// Keine Tax-/SV-Berechnung hier — das passiert in utils/lohnsteuer.ts und
// utils/sozialversicherung.ts. Diese Schicht macht nur CRUD + Audit.

import type { Employee } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type EmployeeInput = Omit<
  Employee,
  "id" | "company_id" | "created_at" | "updated_at"
>;

function nowIso(): string {
  return new Date().toISOString();
}

function validate(input: EmployeeInput): void {
  if (!input.personalnummer.trim())
    throw new Error("Personalnummer ist Pflicht.");
  if (!input.vorname.trim() || !input.nachname.trim())
    throw new Error("Vor- und Nachname sind Pflicht.");
  if (input.steuer_id && !/^\d{11}$/.test(input.steuer_id)) {
    throw new Error(
      "Steuer-Identifikationsnummer muss genau 11 Ziffern haben."
    );
  }
  if (input.kinderfreibetraege < 0 || input.kinderfreibetraege > 10) {
    throw new Error("Kinderfreibeträge: 0 bis 10.");
  }
  if (
    input.beschaeftigungsart !== "minijob" &&
    !input.bruttogehalt_monat &&
    !input.stundenlohn
  ) {
    throw new Error("Bruttogehalt oder Stundenlohn angeben.");
  }
  if (input.beschaeftigungsart === "minijob" && input.bruttogehalt_monat && input.bruttogehalt_monat > 556) {
    throw new Error(
      "Mini-Job-Grenze 2025 ist € 556 / Monat. Darüber wird die Beschäftigung zum Midi-Job oder regulär."
    );
  }
  if (input.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/i.test(input.iban.replace(/\s+/g, ""))) {
    throw new Error("IBAN-Format ist ungültig.");
  }
}

export async function fetchEmployees(
  clientId: string | null
): Promise<Employee[]> {
  if (!shouldUseSupabase()) {
    const all = store.getEmployees();
    if (clientId === null) {
      return all
        .slice()
        .sort((a, b) => a.nachname.localeCompare(b.nachname));
    }
    const filtered: Employee[] = [];
    let legacyWarned = false;
    for (const e of all) {
      if ((e as Employee).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "employees: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(e);
        continue;
      }
      if (e.client_id === clientId) filtered.push(e);
    }
    return filtered
      .slice()
      .sort((a, b) => a.nachname.localeCompare(b.nachname));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("employees")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("nachname");
  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function createEmployee(
  input: EmployeeInput,
  clientId: string | null
): Promise<Employee> {
  validate(input);

  if (!shouldUseSupabase()) {
    const all = store.getEmployees();
    if (all.some((e) => e.personalnummer === input.personalnummer)) {
      throw new Error(`Personalnummer ${input.personalnummer} existiert bereits.`);
    }
    const now = nowIso();
    const emp: Employee = {
      id: uid(),
      company_id: null,
      client_id: clientId,
      ...input,
      created_at: now,
      updated_at: now,
    };
    store.setEmployees([emp, ...all]);
    void log({
      action: "create",
      entity: "settings",
      entity_id: emp.id,
      summary: `Mitarbeiter angelegt: ${emp.personalnummer} ${emp.vorname} ${emp.nachname}`,
      after: emp,
    });
    return emp;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("employees")
    .insert({ ...input, company_id: companyId, client_id: clientId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const emp = data as Employee;
  void log({
    action: "create",
    entity: "settings",
    entity_id: emp.id,
    summary: `Mitarbeiter angelegt: ${emp.personalnummer} ${emp.vorname} ${emp.nachname}`,
    after: emp,
  });
  return emp;
}

export async function updateEmployee(
  id: string,
  patch: Partial<EmployeeInput>,
  clientId: string | null
): Promise<Employee> {
  if (!shouldUseSupabase()) {
    const all = store.getEmployees();
    const idx = all.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("Mitarbeiter nicht gefunden.");
    if (clientId !== null && all[idx].client_id !== undefined && all[idx].client_id !== clientId) {
      throw new Error("Mitarbeiter gehört nicht zum aktiven Mandanten.");
    }
    const before = all[idx];
    const next: Employee = {
      ...before,
      ...patch,
      updated_at: nowIso(),
    };
    validate({
      personalnummer: next.personalnummer,
      vorname: next.vorname,
      nachname: next.nachname,
      steuer_id: next.steuer_id,
      sv_nummer: next.sv_nummer,
      steuerklasse: next.steuerklasse,
      kinderfreibetraege: next.kinderfreibetraege,
      konfession: next.konfession,
      bundesland: next.bundesland,
      einstellungsdatum: next.einstellungsdatum,
      austrittsdatum: next.austrittsdatum,
      beschaeftigungsart: next.beschaeftigungsart,
      wochenstunden: next.wochenstunden,
      bruttogehalt_monat: next.bruttogehalt_monat,
      stundenlohn: next.stundenlohn,
      krankenkasse: next.krankenkasse,
      zusatzbeitrag_pct: next.zusatzbeitrag_pct,
      privat_versichert: next.privat_versichert,
      pv_kinderlos: next.pv_kinderlos,
      pv_kinder_anzahl: next.pv_kinder_anzahl,
      iban: next.iban,
      bic: next.bic,
      kontoinhaber: next.kontoinhaber,
      notes: next.notes,
      is_active: next.is_active,
    });
    const copy = [...all];
    copy[idx] = next;
    store.setEmployees(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: next.id,
      summary: `Mitarbeiter ${next.personalnummer} geändert`,
      before,
      after: next,
    });
    return next;
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("employees")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  const emp = data as Employee;
  void log({
    action: "update",
    entity: "settings",
    entity_id: emp.id,
    summary: `Mitarbeiter ${emp.personalnummer} geändert`,
    after: emp,
  });
  return emp;
}

export async function deleteEmployee(
  id: string,
  clientId: string | null
): Promise<void> {
  if (!shouldUseSupabase()) {
    const before = store.getEmployees().find((e) => e.id === id);
    if (
      before &&
      clientId !== null &&
      before.client_id !== undefined &&
      before.client_id !== clientId
    ) {
      throw new Error("Mitarbeiter gehört nicht zum aktiven Mandanten.");
    }
    store.setEmployees(store.getEmployees().filter((e) => e.id !== id));
    if (before) {
      void log({
        action: "delete",
        entity: "settings",
        entity_id: id,
        summary: `Mitarbeiter ${before.personalnummer} entfernt`,
        before,
      });
    }
    return;
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { error } = await q;
  if (error) throw new Error(error.message);
  void log({
    action: "delete",
    entity: "settings",
    entity_id: id,
    summary: `Mitarbeiter ${id} entfernt`,
  });
}
