/**
 * Lohn-Persistenz-Repos (Supabase + localStorage dual-mode).
 *
 * Stand: Schema-ready, minimale CRUD-Implementation — Wiring in UIs
 * (LohnPage/LohnsteuerAnmeldungPage) erfolgt in einer Folgeiteration.
 * Die Repos kompilieren, sind typisiert, und kapseln die Supabase-Anbindung
 * sauber — so dass UI-Komponenten sie ohne Umstrukturierung einbinden können.
 *
 * Tabellen (siehe supabase/migrations/0020_lohn_persistence.sql):
 *   - public.lohnarten
 *   - public.lohnbuchungen
 *   - public.lohnabrechnungen_archiv
 *
 * Arbeitnehmer-Stammdaten werden über die bestehende employees-Tabelle
 * (Migration 0016) + `lohnAdapter.ts` bezogen.
 */

import { supabase, DEMO_MODE } from "../../api/supabase";
import { store } from "../../api/store";
import type {
  Arbeitnehmer,
  LohnArt,
  LohnArtTyp,
  Lohnbuchung,
  Lohnabrechnung,
  LohnabrechnungArchivRow,
} from "../../domain/lohn/types";
import { Money } from "../money/Money";

/** Datenbankzeile → Domain (Money-Konvertierung). */
function dbRowToLohnArt(row: Record<string, unknown>): LohnArt {
  return {
    id: row.id as string,
    bezeichnung: row.bezeichnung as string,
    typ: row.typ as LohnArtTyp,
    steuerpflichtig: row.steuerpflichtig as boolean,
    svpflichtig: row.svpflichtig as boolean,
    steuerfrei_grund: (row.steuerfrei_grund as string | null) ?? undefined,
    sv_frei_grund: (row.sv_frei_grund as string | null) ?? undefined,
    lst_meldung_feld: row.lst_meldung_feld as string,
  };
}

function dbRowToLohnbuchung(row: Record<string, unknown>): Lohnbuchung {
  return {
    id: row.id as string,
    arbeitnehmer_id: row.employee_id as string,
    abrechnungsmonat: row.abrechnungsmonat as string,
    lohnart_id: row.lohnart_id as string,
    betrag: new Money((row.betrag as number).toString()),
    stunden: (row.stunden as number | null) ?? undefined,
    menge: (row.menge as number | null) ?? undefined,
    beleg: (row.beleg as string | null) ?? undefined,
    buchungsdatum: row.buchungsdatum as string,
  };
}

// ---------------- LohnArtRepo ------------------------------------------------

export class LohnArtRepo {
  async getAll(companyId: string, clientId: string | null): Promise<LohnArt[]> {
    if (DEMO_MODE) return this.demoList();
    let q = supabase
      .from("lohnarten")
      .select("*")
      .eq("company_id", companyId)
      .eq("aktiv", true);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { data, error } = await q.order("code");
    if (error) throw error;
    return (data ?? []).map(dbRowToLohnArt);
  }

  async getById(id: string, clientId: string | null): Promise<LohnArt | null> {
    if (DEMO_MODE) return this.demoList().find((l) => l.id === id) ?? null;
    let q = supabase.from("lohnarten").select("*").eq("id", id);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? dbRowToLohnArt(data as Record<string, unknown>) : null;
  }

  async create(
    companyId: string,
    clientId: string | null,
    code: string,
    input: Omit<LohnArt, "id">
  ): Promise<LohnArt> {
    if (DEMO_MODE) {
      const la: LohnArt = { id: `demo-la-${code}`, ...input };
      return la;
    }
    const { data, error } = await supabase
      .from("lohnarten")
      .insert({
        company_id: companyId,
        client_id: clientId,
        code,
        bezeichnung: input.bezeichnung,
        typ: input.typ,
        steuerpflichtig: input.steuerpflichtig,
        svpflichtig: input.svpflichtig,
        steuerfrei_grund: input.steuerfrei_grund ?? null,
        sv_frei_grund: input.sv_frei_grund ?? null,
        lst_meldung_feld: input.lst_meldung_feld,
      })
      .select()
      .single();
    if (error) throw error;
    return dbRowToLohnArt(data as Record<string, unknown>);
  }

  async remove(id: string, clientId: string | null): Promise<void> {
    if (DEMO_MODE) return;
    let q = supabase.from("lohnarten").delete().eq("id", id);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { error } = await q;
    if (error) throw error;
  }

  /** Standard-Lohnarten für Demo-Modus / erste Nutzung. */
  demoList(): LohnArt[] {
    return [
      {
        id: "la-gehalt",
        bezeichnung: "Gehalt",
        typ: "LAUFENDER_BEZUG",
        steuerpflichtig: true,
        svpflichtig: true,
        lst_meldung_feld: "3",
      },
      {
        id: "la-weihnacht",
        bezeichnung: "Weihnachtsgeld",
        typ: "SONSTIGER_BEZUG",
        steuerpflichtig: true,
        svpflichtig: true,
        lst_meldung_feld: "3",
      },
      {
        id: "la-ueberst",
        bezeichnung: "Überstundenvergütung",
        typ: "LAUFENDER_BEZUG",
        steuerpflichtig: true,
        svpflichtig: true,
        lst_meldung_feld: "3",
      },
    ];
  }
}

// ---------------- LohnbuchungRepo -------------------------------------------

export class LohnbuchungRepo {
  async getForAn(
    arbeitnehmerId: string,
    monat: string,
    clientId: string | null
  ): Promise<Lohnbuchung[]> {
    if (DEMO_MODE) return [];
    let q = supabase
      .from("lohnbuchungen")
      .select("*")
      .eq("employee_id", arbeitnehmerId)
      .eq("abrechnungsmonat", monat);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { data, error } = await q.order("buchungsdatum");
    if (error) throw error;
    return (data ?? []).map(dbRowToLohnbuchung);
  }

  async create(
    companyId: string,
    clientId: string | null,
    input: Omit<Lohnbuchung, "id">
  ): Promise<Lohnbuchung> {
    if (DEMO_MODE) {
      return { id: `demo-lb-${Date.now()}`, ...input };
    }
    const { data, error } = await supabase
      .from("lohnbuchungen")
      .insert({
        company_id: companyId,
        client_id: clientId,
        employee_id: input.arbeitnehmer_id,
        abrechnungsmonat: input.abrechnungsmonat,
        lohnart_id: input.lohnart_id,
        betrag: input.betrag.toNumber(),
        stunden: input.stunden ?? null,
        menge: input.menge ?? null,
        beleg: input.beleg ?? null,
        buchungsdatum: input.buchungsdatum,
      })
      .select()
      .single();
    if (error) throw error;
    return dbRowToLohnbuchung(data as Record<string, unknown>);
  }

  async remove(id: string, clientId: string | null): Promise<void> {
    if (DEMO_MODE) return;
    let q = supabase.from("lohnbuchungen").delete().eq("id", id);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { error } = await q;
    if (error) throw error;
  }
}

// ---------------- AbrechnungArchivRepo ---------------------------------------

export type AbrechnungArchivInput = {
  arbeitnehmer: Arbeitnehmer;
  abrechnungsmonat: string;
  abrechnung: Lohnabrechnung;
  /** Journal-Batch-Referenz (Phase 2 / Schritt 5, Migration 0028). Null für
   *  manuell erstellte Archiv-Einträge ohne Journal-Lauf. */
  batchId?: string | null;
};

export class AbrechnungArchivRepo {
  async save(
    companyId: string,
    clientId: string | null,
    input: AbrechnungArchivInput
  ): Promise<string> {
    const { abrechnung, arbeitnehmer, abrechnungsmonat } = input;
    const batchId = input.batchId ?? null;
    if (DEMO_MODE) {
      // Persistiert in localStorage (harouda:lohnArchiv). Upsert-Semantik:
      // Eintrag pro (company_id, client_id, employee_id, abrechnungsmonat)
      // wird ersetzt, sonst angehängt. Damit sind E2E-Smoke-Tests und UI-
      // Views (AbrechnungsArchivPage) beobachtbar, ohne Supabase.
      const all = store.getLohnArchiv();
      const key = (r: LohnabrechnungArchivRow) =>
        `${r.company_id ?? ""}|${r.client_id ?? ""}|${r.employee_id}|${r.abrechnungsmonat}`;
      const current: LohnabrechnungArchivRow = {
        id: `demo-archiv-${abrechnungsmonat}-${arbeitnehmer.id}`,
        company_id: companyId || null,
        client_id: clientId,
        employee_id: arbeitnehmer.id,
        abrechnungsmonat,
        gesamt_brutto: abrechnung.gesamtBrutto.toNumber(),
        gesamt_netto: abrechnung.auszahlungsbetrag.toNumber(),
        gesamt_abzuege: abrechnung.abzuege.gesamtAbzuege.toNumber(),
        gesamt_ag_kosten: abrechnung.arbeitgeberKosten.gesamt.toNumber(),
        batch_id: batchId,
        locked: false,
        created_at: new Date().toISOString(),
        abrechnung_json: serializeAbrechnung(abrechnung),
      };
      const next = all.filter((r) => key(r) !== key(current));
      next.unshift(current);
      store.setLohnArchiv(next);
      return current.id;
    }
    const { data, error } = await supabase
      .from("lohnabrechnungen_archiv")
      .upsert(
        {
          company_id: companyId,
          client_id: clientId,
          employee_id: arbeitnehmer.id,
          abrechnungsmonat,
          abrechnung_json: serializeAbrechnung(abrechnung),
          gesamt_brutto: abrechnung.gesamtBrutto.toNumber(),
          gesamt_netto: abrechnung.auszahlungsbetrag.toNumber(),
          gesamt_abzuege: abrechnung.abzuege.gesamtAbzuege.toNumber(),
          gesamt_ag_kosten: abrechnung.arbeitgeberKosten.gesamt.toNumber(),
          batch_id: batchId,
          locked: false,
        },
        // Future-ready: der onConflict-Key erweitert (employee_id, abrechnungsmonat)
        // um (company_id, client_id). Ein entsprechender UNIQUE-Constraint in der
        // Datenbank fehlt aktuell (siehe Bericht: offener Migration-Bedarf). Bis
        // dahin greift App-Layer-Defense-in-Depth via .eq("client_id", …) +
        // RESTRICTIVE-RLS-Policy (Migration 0026).
        { onConflict: "company_id,client_id,employee_id,abrechnungsmonat" }
      )
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async lock(id: string, clientId: string | null): Promise<void> {
    if (DEMO_MODE) return;
    let q = supabase
      .from("lohnabrechnungen_archiv")
      .update({ locked: true, locked_at: new Date().toISOString() })
      .eq("id", id);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { error } = await q;
    if (error) throw error;
  }

  /**
   * Liefert alle Archiv-Rows eines Arbeitnehmers (chronologisch absteigend).
   * Phase 3 / Schritt 5b: Rückgabe-Shape erweitert auf
   * `LohnabrechnungArchivRow[]` (inkl. `abrechnung_json`, `batch_id`,
   * `company_id`), damit `archivEstImport.ts` den Abzüge-Breakdown lesen
   * kann. DEMO-Pfad liest jetzt aus dem `store.getLohnArchiv()`-
   * Persistenz-Kanal (Phase 2 Schritt 5 — vorher returnte er `[]`).
   * Rückwärts-kompatibel: Phase-2-Tests ohne Seed sehen weiter `[]`.
   */
  async getForEmployee(
    arbeitnehmerId: string,
    clientId: string | null
  ): Promise<LohnabrechnungArchivRow[]> {
    if (DEMO_MODE) {
      return store.getLohnArchiv().filter((r) => {
        if (r.employee_id !== arbeitnehmerId) return false;
        if (clientId !== null && r.client_id !== clientId) return false;
        return true;
      });
    }
    let q = supabase
      .from("lohnabrechnungen_archiv")
      .select("*")
      .eq("employee_id", arbeitnehmerId);
    if (clientId !== null) q = q.eq("client_id", clientId);
    const { data, error } = await q.order("abrechnungsmonat", {
      ascending: false,
    });
    if (error) throw error;
    return (data ?? []) as unknown as LohnabrechnungArchivRow[];
  }
}

function serializeAbrechnung(ab: Lohnabrechnung): Record<string, unknown> {
  return {
    arbeitnehmer_id: ab.arbeitnehmer_id,
    abrechnungsmonat: ab.abrechnungsmonat,
    laufenderBrutto: ab.laufenderBrutto.toFixed2(),
    sonstigeBezuege: ab.sonstigeBezuege.toFixed2(),
    gesamtBrutto: ab.gesamtBrutto.toFixed2(),
    svBrutto: ab.svBrutto.toFixed2(),
    abzuege: {
      lohnsteuer: ab.abzuege.lohnsteuer.toFixed2(),
      solidaritaetszuschlag: ab.abzuege.solidaritaetszuschlag.toFixed2(),
      kirchensteuer: ab.abzuege.kirchensteuer.toFixed2(),
      kv_an: ab.abzuege.kv_an.toFixed2(),
      kv_zusatz_an: ab.abzuege.kv_zusatz_an.toFixed2(),
      pv_an: ab.abzuege.pv_an.toFixed2(),
      rv_an: ab.abzuege.rv_an.toFixed2(),
      av_an: ab.abzuege.av_an.toFixed2(),
      gesamtAbzuege: ab.abzuege.gesamtAbzuege.toFixed2(),
    },
    arbeitgeberKosten: {
      kv: ab.arbeitgeberKosten.kv.toFixed2(),
      kv_zusatz: ab.arbeitgeberKosten.kv_zusatz.toFixed2(),
      pv: ab.arbeitgeberKosten.pv.toFixed2(),
      rv: ab.arbeitgeberKosten.rv.toFixed2(),
      av: ab.arbeitgeberKosten.av.toFixed2(),
      u1: ab.arbeitgeberKosten.u1.toFixed2(),
      u2: ab.arbeitgeberKosten.u2.toFixed2(),
      u3: ab.arbeitgeberKosten.u3.toFixed2(),
      gesamt: ab.arbeitgeberKosten.gesamt.toFixed2(),
    },
    auszahlungsbetrag: ab.auszahlungsbetrag.toFixed2(),
    gesamtkostenArbeitgeber: ab.gesamtkostenArbeitgeber.toFixed2(),
    _meta: ab._meta,
  };
}
