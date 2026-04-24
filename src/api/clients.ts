import type {
  Client,
  Geschaeftsfuehrer,
  UstIdStatus,
} from "../types/db";
import type { Rechtsform } from "../domain/ebilanz/hgbTaxonomie68";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type ClientInput = {
  mandant_nr: string;
  name: string;
  steuernummer?: string | null;
  ust_id?: string | null;
  iban?: string | null;
  // Jahresabschluss-E1 (Migration 0030):
  rechtsform?: Rechtsform | null;
  hrb_nummer?: string | null;
  hrb_gericht?: string | null;
  gezeichnetes_kapital?: number | null;
  geschaeftsfuehrer?: Geschaeftsfuehrer[] | null;
  wirtschaftsjahr_beginn?: string;
  wirtschaftsjahr_ende?: string;
  // Migration 0033 — Anschrift
  anschrift_strasse?: string | null;
  anschrift_hausnummer?: string | null;
  anschrift_plz?: string | null;
  anschrift_ort?: string | null;
  anschrift_land?: string | null;
  // Migration 0041 — DATEV Stammdaten
  kontenrahmen?: "SKR03" | "SKR04";
  sachkontenlaenge?: number;
  gewinnermittlungsart?: "bilanz" | "euer" | null;
  wirtschaftsjahr_typ?: "kalenderjahr" | "abweichend";
  finanzamt_name?: string | null;
  finanzamt_bufa_nr?: string | null;
  versteuerungsart?: "soll" | "ist" | null;
  kleinunternehmer_regelung?: boolean;
  ust_voranmeldung_zeitraum?: "monatlich" | "vierteljaehrlich" | "jaehrlich" | "befreit" | null;
  betriebsnummer?: string | null;
  berufsgenossenschaft_name?: string | null;
  berufsgenossenschaft_mitgliedsnr?: string | null;
  kirchensteuer_erhebungsstelle?: string | null;
  status?: "in_gruendung" | "aktiv" | "archiviert";
};

export async function fetchClients(): Promise<Client[]> {
  if (!shouldUseSupabase()) {
    return store
      .getClients()
      .sort((a, b) => a.mandant_nr.localeCompare(b.mandant_nr));
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .order("mandant_nr");
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function createClient(input: ClientInput): Promise<Client> {
  if (!shouldUseSupabase()) {
    const existing = store.getClients();
    const next: Client = {
      id: uid(),
      mandant_nr: input.mandant_nr,
      name: input.name,
      steuernummer: input.steuernummer ?? null,
      ust_id: input.ust_id ?? null,
      iban: input.iban ?? null,
      ust_id_status: "unchecked",
      ust_id_checked_at: null,
      last_daten_holen_at: null,
      created_at: new Date().toISOString(),
      rechtsform: input.rechtsform ?? null,
      hrb_nummer: input.hrb_nummer ?? null,
      hrb_gericht: input.hrb_gericht ?? null,
      gezeichnetes_kapital: input.gezeichnetes_kapital ?? null,
      geschaeftsfuehrer: input.geschaeftsfuehrer ?? null,
      wirtschaftsjahr_beginn: input.wirtschaftsjahr_beginn ?? "01-01",
      wirtschaftsjahr_ende: input.wirtschaftsjahr_ende ?? "12-31",
    };
    store.setClients([...existing, next]);
    return next;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      mandant_nr: input.mandant_nr,
      name: input.name,
      steuernummer: input.steuernummer ?? null,
      ust_id: input.ust_id ?? null,
      iban: input.iban ?? null,
      ust_id_status: "unchecked",
      company_id: companyId,
      rechtsform: input.rechtsform ?? null,
      hrb_nummer: input.hrb_nummer ?? null,
      hrb_gericht: input.hrb_gericht ?? null,
      gezeichnetes_kapital: input.gezeichnetes_kapital ?? null,
      geschaeftsfuehrer: input.geschaeftsfuehrer ?? [],
      wirtschaftsjahr_beginn: input.wirtschaftsjahr_beginn ?? "01-01",
      wirtschaftsjahr_ende: input.wirtschaftsjahr_ende ?? "12-31",
      // Migration 0033 — Anschrift (undefined → DB default / NULL)
      anschrift_strasse: input?.anschrift_strasse,
      anschrift_hausnummer: input?.anschrift_hausnummer,
      anschrift_plz: input?.anschrift_plz,
      anschrift_ort: input?.anschrift_ort,
      anschrift_land: input?.anschrift_land,
      // Migration 0041 — DATEV Stammdaten (undefined → DB default)
      kontenrahmen: input?.kontenrahmen,
      sachkontenlaenge: input?.sachkontenlaenge,
      gewinnermittlungsart: input?.gewinnermittlungsart,
      wirtschaftsjahr_typ: input?.wirtschaftsjahr_typ,
      finanzamt_name: input?.finanzamt_name,
      finanzamt_bufa_nr: input?.finanzamt_bufa_nr,
      versteuerungsart: input?.versteuerungsart,
      kleinunternehmer_regelung: input?.kleinunternehmer_regelung,
      ust_voranmeldung_zeitraum: input?.ust_voranmeldung_zeitraum,
      betriebsnummer: input?.betriebsnummer,
      berufsgenossenschaft_name: input?.berufsgenossenschaft_name,
      berufsgenossenschaft_mitgliedsnr: input?.berufsgenossenschaft_mitgliedsnr,
      kirchensteuer_erhebungsstelle: input?.kirchensteuer_erhebungsstelle,
      status: input?.status,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Client;
}

export async function updateClient(
  id: string,
  patch: Partial<Client>
): Promise<Client> {
  if (!shouldUseSupabase()) {
    const all = store.getClients();
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Mandant nicht gefunden.");
    const next: Client = { ...all[idx], ...patch };
    const copy = [...all];
    copy[idx] = next;
    store.setClients(copy);
    return next;
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Client;
}

export async function setUstIdResult(
  id: string,
  status: UstIdStatus
): Promise<Client> {
  return updateClient(id, {
    ust_id_status: status,
    ust_id_checked_at: new Date().toISOString(),
  });
}
