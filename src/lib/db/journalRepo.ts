/**
 * Belegerfassungs-Persistenz (Supabase + localStorage dual-mode).
 *
 * Ein Beleg → N Journal-Einträge (Soll/Haben-Paare). Die Journal-Einträge
 * selbst werden über `createEntry` aus `api/journal.ts` erzeugt, damit die
 * GoBD-Hash-Kette konsistent bleibt. Der Beleg trägt anschließend die IDs
 * der erzeugten Zeilen in `journal_entry_ids`.
 *
 * Tabellen (siehe supabase/migrations/0022_belege_persistence.sql):
 *   - public.belege
 *   - public.beleg_positionen
 */

import { supabase, DEMO_MODE } from "../../api/supabase";
import { shouldUseSupabase, requireCompanyId } from "../../api/db";
import { createEntry, reverseEntry } from "../../api/journal";
import { log } from "../../api/audit";
import { uid } from "../../api/store";
import { Money } from "../money/Money";
import type {
  BelegEntry,
  BelegPosition,
} from "../../domain/belege/types";
import type { JournalEntry } from "../../types/db";
import { getBusinessPartner } from "../../api/businessPartners";

/** Status eines persistierten Belegs. */
export type BelegStatus = "ENTWURF" | "GEBUCHT" | "STORNIERT";

/** Persistierter Beleg (DB-Schicht). Betragsfelder als strings, weil wir
 *  Money-Instanzen nicht 1:1 in JSON/Postgres ablegen. */
export type BelegRecord = {
  id: string;
  company_id: string | null;
  mandant_id: string | null;
  belegart: BelegEntry["belegart"];
  belegnummer: string;
  belegdatum: string;
  buchungsdatum: string;
  leistungsdatum: string | null;
  beschreibung: string;

  partner_name: string;
  partner_konto_nr: string | null;
  partner_ustid: string | null;
  partner_land: string | null;
  partner_adresse: string | null;

  netto: string | null;
  steuerbetrag: string | null;
  brutto: string | null;
  waehrung: string;

  ist_ig_lieferung: boolean;
  ist_reverse_charge: boolean;

  zahlungsart: string | null;
  zahlungsdatum: string | null;
  zahlungsbetrag: string | null;
  skonto_prozent: number | null;

  belegdatei_path: string | null;

  status: BelegStatus;
  journal_entry_ids: string[];

  /** Sprint 19.A Expand: optionaler Verweis auf business_partners. Legacy-Belege: null. */
  business_partner_id?: string | null;
  /** Sprint 19.A Expand: Snapshot-Version zum Buchungszeitpunkt (GoBD Rz. 64). */
  business_partner_version_id?: string | null;

  positionen: {
    position: number;
    konto: string;
    soll_haben: "S" | "H";
    betrag: string;
    text: string | null;
    ust_satz: number | null;
  }[];

  erfasst_von: string | null;
  erfasst_am: string;
  updated_am: string;
  storno_grund: string | null;
  storniert_am: string | null;
};

export type BelegFilters = {
  von?: string;
  bis?: string;
  belegart?: BelegEntry["belegart"];
  status?: BelegStatus;
  partner?: string;
  limit?: number;
  offset?: number;
};

export type CreateJournalOptions = {
  /** "ENTWURF" speichert nur den Beleg; "GEBUCHT" erzeugt zusätzlich
   *  die Journal-Einträge mit Hash-Kette. */
  status?: BelegStatus;
  /** Journal-Status pro erzeugter Buchung. Default: dieselbe Wahl wie
   *  der Beleg-Status ("GEBUCHT" → "gebucht", sonst "entwurf"). */
  journalStatus?: "gebucht" | "entwurf";
  /** Sprint 19.C: optionaler FK auf business_partners. Wenn gesetzt
   *  und business_partner_version_id fehlt, wird der aktuelle Stand
   *  als Version-Snapshot referenziert (vom Service-Layer aufgeloest). */
  business_partner_id?: string | null;
  business_partner_version_id?: string | null;
};

// ---------------------------------------------------------------------------
// localStorage-Persistenz für DEMO_MODE
// ---------------------------------------------------------------------------

const K_BELEGE = "harouda:belege";

function readBelege(): BelegRecord[] {
  try {
    const raw = localStorage.getItem(K_BELEGE);
    return raw ? (JSON.parse(raw) as BelegRecord[]) : [];
  } catch {
    return [];
  }
}

function writeBelege(list: BelegRecord[]): void {
  localStorage.setItem(K_BELEGE, JSON.stringify(list));
}

// ---------------------------------------------------------------------------
// Position → Journal mapping
// ---------------------------------------------------------------------------

type JournalPair = {
  soll_konto: string;
  haben_konto: string;
  betrag: Money;
  text: string;
  ust_satz: number | null;
};

/** Wandelt die Beleg-Positionen in Soll/Haben-Paare um.
 *  Regeln:
 *   - 1 SOLL + N HABEN  → N Einträge (gleiches Soll-Konto)
 *   - N SOLL + 1 HABEN  → N Einträge (gleiches Haben-Konto)
 *   - N SOLL + N HABEN  → nach Index gepaart
 *   - sonst             → Fehler */
export function positionsToJournalPairs(
  positions: BelegPosition[]
): JournalPair[] {
  const soll = positions.filter((p) => p.side === "SOLL");
  const haben = positions.filter((p) => p.side === "HABEN");

  if (soll.length === 0 || haben.length === 0) {
    throw new Error(
      "Beleg braucht mindestens eine Soll- und eine Haben-Position."
    );
  }

  if (soll.length === 1 && haben.length >= 1) {
    const s = soll[0];
    return haben.map((h) => ({
      soll_konto: s.konto,
      haben_konto: h.konto,
      betrag: h.betrag,
      text: h.text ?? s.text ?? "",
      ust_satz: h.ustSatz ?? s.ustSatz ?? null,
    }));
  }

  if (haben.length === 1 && soll.length >= 1) {
    const h = haben[0];
    return soll.map((s) => ({
      soll_konto: s.konto,
      haben_konto: h.konto,
      betrag: s.betrag,
      text: s.text ?? h.text ?? "",
      ust_satz: s.ustSatz ?? h.ustSatz ?? null,
    }));
  }

  if (soll.length === haben.length) {
    return soll.map((s, i) => {
      const h = haben[i];
      if (!s.betrag.equals(h.betrag)) {
        throw new Error(
          `Beleg-Position ${i + 1}: Soll (${s.betrag.toFixed2()}) und Haben (${h.betrag.toFixed2()}) müssen übereinstimmen.`
        );
      }
      return {
        soll_konto: s.konto,
        haben_konto: h.konto,
        betrag: s.betrag,
        text: s.text ?? h.text ?? "",
        ust_satz: s.ustSatz ?? h.ustSatz ?? null,
      };
    });
  }

  throw new Error(
    `Beleg-Positionen nicht eindeutig paarbar: ${soll.length} SOLL vs. ${haben.length} HABEN. ` +
      `Erlaubt sind 1:N, N:1 oder N:N (Index-Paarung).`
  );
}

// ---------------------------------------------------------------------------
// Repo
// ---------------------------------------------------------------------------

function belegToRecord(
  beleg: BelegEntry,
  id: string,
  status: BelegStatus,
  journalIds: string[],
  companyId: string | null,
  partnerLink: {
    business_partner_id: string | null;
    business_partner_version_id: string | null;
  } = { business_partner_id: null, business_partner_version_id: null }
): BelegRecord {
  const now = new Date().toISOString();
  return {
    id,
    company_id: companyId,
    mandant_id: null,
    belegart: beleg.belegart,
    belegnummer: beleg.belegnummer,
    belegdatum: beleg.belegdatum,
    buchungsdatum: beleg.buchungsdatum,
    leistungsdatum: beleg.leistungsdatum ?? null,
    beschreibung: beleg.beschreibung,
    partner_name: beleg.partner.name,
    partner_konto_nr: beleg.partner.kontoNr ?? null,
    partner_ustid: beleg.partner.ustId ?? null,
    partner_land: beleg.partner.land ?? null,
    partner_adresse: beleg.partner.adresse ?? null,
    netto: beleg.netto?.toFixed2() ?? null,
    steuerbetrag: beleg.steuerbetrag?.toFixed2() ?? null,
    brutto: beleg.brutto?.toFixed2() ?? null,
    waehrung: "EUR",
    ist_ig_lieferung: beleg.istIgLieferung ?? false,
    ist_reverse_charge: beleg.istReverseCharge ?? false,
    zahlungsart: beleg.zahlung?.art ?? null,
    zahlungsdatum: beleg.zahlung?.datum ?? null,
    zahlungsbetrag: beleg.zahlung?.betrag?.toFixed2() ?? null,
    skonto_prozent: beleg.zahlung?.skonto_prozent ?? null,
    belegdatei_path: null,
    status,
    journal_entry_ids: journalIds,
    business_partner_id: partnerLink.business_partner_id,
    business_partner_version_id: partnerLink.business_partner_version_id,
    positionen: beleg.positionen.map((p, i) => ({
      position: i + 1,
      konto: p.konto,
      soll_haben: p.side === "SOLL" ? "S" : "H",
      betrag: p.betrag.toFixed2(),
      text: p.text ?? null,
      ust_satz: p.ustSatz ?? null,
    })),
    erfasst_von: null,
    erfasst_am: now,
    updated_am: now,
    storno_grund: null,
    storniert_am: null,
  };
}

export class JournalRepo {
  /** Persistiert einen Beleg. Bei Status='GEBUCHT' erzeugt er zusätzlich
   *  die zugehörigen Journal-Einträge (inkl. Hash-Kette) und verknüpft sie.
   *  Gibt den persistierten Beleg inkl. journal_entry_ids zurück. */
  async createJournalFromBeleg(
    beleg: BelegEntry,
    options: CreateJournalOptions = {}
  ): Promise<{ beleg: BelegRecord; journalEntries: JournalEntry[] }> {
    const status = options.status ?? "GEBUCHT";
    const jStatus =
      options.journalStatus ?? (status === "GEBUCHT" ? "gebucht" : "entwurf");
    const companyId = DEMO_MODE ? null : shouldUseSupabase() ? requireCompanyId() : null;

    // Sprint 19.C VEREINFACHUNG: business_partner_version_id wird NICHT
    // aus der Historie aufgeloest. Die Versions-Tabelle haelt nur
    // Pre-Update-Snapshots (via trg_bp_snapshot). Ein Auto-Resolve auf
    // versions[0] wuerde fälschlich einen HISTORISCHEN Snapshot als
    // "aktuellen Stand" referenzieren. Ein stabiler Pointer auf den
    // aktuellen Zustand ist Sprint 20+ (current_version_pointer).
    // Bis dahin: nur explizit uebergebene version_id wird durchgereicht.
    const partnerLinkId = options.business_partner_id ?? null;
    const partnerVersionId = options.business_partner_version_id ?? null;
    // Sanity-Warnung: partner_name drift vs. Stammdaten.
    if (partnerLinkId) {
      try {
        const partner = await getBusinessPartner(partnerLinkId);
        if (
          partner &&
          beleg.partner.name &&
          beleg.partner.name.trim() !== partner.name.trim()
        ) {
           
          console.warn(
            `[belege] partner_name-Drift: Beleg "${beleg.partner.name}" vs. Stammdaten "${partner.name}" (partner_id=${partnerLinkId})`
          );
        }
      } catch {
        /* best-effort */
      }
    }

    const journalEntries: JournalEntry[] = [];
    if (status === "GEBUCHT") {
      const pairs = positionsToJournalPairs(beleg.positionen);
      for (const p of pairs) {
        const entry = await createEntry({
          datum: beleg.buchungsdatum,
          beleg_nr: beleg.belegnummer,
          beschreibung: p.text || beleg.beschreibung || beleg.belegnummer,
          soll_konto: p.soll_konto,
          haben_konto: p.haben_konto,
          betrag: Number(p.betrag.toFixed2()),
          ust_satz: p.ust_satz,
          status: jStatus,
          client_id: null,
          skonto_pct: beleg.zahlung?.skonto_prozent ?? null,
          skonto_tage: null,
          gegenseite: beleg.partner.name || null,
          faelligkeit: null,
        });
        journalEntries.push(entry);
      }
    }

    const id = uid();
    const record = belegToRecord(
      beleg,
      id,
      status,
      journalEntries.map((e) => e.id),
      companyId,
      {
        business_partner_id: partnerLinkId,
        business_partner_version_id: partnerVersionId,
      }
    );

    if (!shouldUseSupabase()) {
      writeBelege([record, ...readBelege()]);
      void log({
        action: "create",
        entity: "beleg",
        entity_id: id,
        summary: `Beleg ${record.belegnummer} · ${record.partner_name} · ${record.brutto ?? "—"} € [${status}]`,
        after: record,
      });
      return { beleg: record, journalEntries };
    }

    // Supabase: header + positionen
    const { positionen, ...header } = record;
    const { data, error } = await supabase
      .from("belege")
      .insert(header)
      .select("*")
      .single();
    if (error) throw new Error(`Beleg-Erfassung fehlgeschlagen: ${error.message}`);

    if (positionen.length > 0) {
      const posRows = positionen.map((p) => ({ ...p, beleg_id: id }));
      const { error: posErr } = await supabase
        .from("beleg_positionen")
        .insert(posRows);
      if (posErr)
        throw new Error(`Positionen fehlgeschlagen: ${posErr.message}`);
    }

    void log({
      action: "create",
      entity: "beleg",
      entity_id: id,
      summary: `Beleg ${record.belegnummer} · ${record.partner_name} · ${record.brutto ?? "—"} € [${status}]`,
      after: data,
    });
    return { beleg: record, journalEntries };
  }

  async getBelege(
    filters: BelegFilters = {}
  ): Promise<{ belege: BelegRecord[]; total: number }> {
    if (!shouldUseSupabase()) {
      let list = readBelege();
      if (filters.von) list = list.filter((b) => b.belegdatum >= filters.von!);
      if (filters.bis) list = list.filter((b) => b.belegdatum <= filters.bis!);
      if (filters.belegart)
        list = list.filter((b) => b.belegart === filters.belegart);
      if (filters.status)
        list = list.filter((b) => b.status === filters.status);
      if (filters.partner) {
        const p = filters.partner.toLowerCase();
        list = list.filter((b) =>
          b.partner_name.toLowerCase().includes(p)
        );
      }
      const total = list.length;
      const offset = filters.offset ?? 0;
      const limit = filters.limit ?? list.length;
      return { belege: list.slice(offset, offset + limit), total };
    }

    const companyId = requireCompanyId();
    let q = supabase
      .from("belege")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .order("belegdatum", { ascending: false });
    if (filters.von) q = q.gte("belegdatum", filters.von);
    if (filters.bis) q = q.lte("belegdatum", filters.bis);
    if (filters.belegart) q = q.eq("belegart", filters.belegart);
    if (filters.status) q = q.eq("status", filters.status);
    if (filters.partner) q = q.ilike("partner_name", `%${filters.partner}%`);
    if (filters.limit)
      q = q.range(
        filters.offset ?? 0,
        (filters.offset ?? 0) + filters.limit - 1
      );

    const { data, count, error } = await q;
    if (error) throw new Error(error.message);
    return {
      belege: (data ?? []).map((r) => ({
        ...(r as BelegRecord),
        positionen: [],
      })),
      total: count ?? 0,
    };
  }

  async getBeleg(id: string): Promise<BelegRecord | null> {
    if (!shouldUseSupabase()) {
      return readBelege().find((b) => b.id === id) ?? null;
    }
    const [{ data: header }, { data: positionen }] = await Promise.all([
      supabase.from("belege").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("beleg_positionen")
        .select("*")
        .eq("beleg_id", id)
        .order("position"),
    ]);
    if (!header) return null;
    return {
      ...(header as Omit<BelegRecord, "positionen">),
      positionen: (positionen as BelegRecord["positionen"]) ?? [],
    };
  }

  async updateBeleg(
    id: string,
    updates: Partial<
      Pick<BelegRecord, "beschreibung" | "partner_name" | "partner_ustid">
    >
  ): Promise<void> {
    if (!shouldUseSupabase()) {
      const list = readBelege();
      const idx = list.findIndex((b) => b.id === id);
      if (idx < 0) throw new Error("Beleg nicht gefunden.");
      const cur = list[idx];
      if (cur.status === "GEBUCHT") {
        throw new Error(
          "Gebuchter Beleg darf nicht mehr geändert werden — bitte Stornobuchung erstellen."
        );
      }
      list[idx] = {
        ...cur,
        ...updates,
        updated_am: new Date().toISOString(),
      };
      writeBelege(list);
      void log({
        action: "update",
        entity: "beleg",
        entity_id: id,
        summary: `Beleg ${cur.belegnummer} aktualisiert`,
        before: cur,
        after: list[idx],
      });
      return;
    }
    // Audit 2026-04-20 P0-02: Analog DEMO-Pfad (Z. 418-421) —
    // GoBD Rz. 64 verlangt Unveränderbarkeit festgeschriebener Belege.
    // Kein alleiniges Vertrauen auf DB-Trigger: App-Layer-Guard ist
    // zweite Verifikationslinie.
    const { data: cur, error: readErr } = await supabase
      .from("belege")
      .select("status")
      .eq("id", id)
      .single();
    if (readErr) throw new Error(readErr.message);
    if (!cur) throw new Error("Beleg nicht gefunden.");
    if (cur.status === "GEBUCHT") {
      throw new Error(
        "Gebuchter Beleg darf nicht mehr geändert werden — bitte Stornobuchung erstellen."
      );
    }
    const { error } = await supabase
      .from("belege")
      .update({ ...updates, updated_am: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Storniert einen gebuchten Beleg: erzeugt Journal-Gegenbuchungen und
   *  setzt den Beleg-Status auf STORNIERT mit `storno_grund`. */
  async stornoBeleg(id: string, reason: string): Promise<void> {
    if (!reason || reason.trim().length < 3) {
      throw new Error("Stornogrund ist Pflicht (mindestens 3 Zeichen).");
    }

    const beleg = await this.getBeleg(id);
    if (!beleg) throw new Error("Beleg nicht gefunden.");
    if (beleg.status === "STORNIERT") {
      throw new Error("Beleg ist bereits storniert.");
    }

    // Journal-Gegenbuchungen: reverseEntry pro bereits gebuchter Zeile.
    for (const jid of beleg.journal_entry_ids) {
      await reverseEntry(jid, reason);
    }

    const now = new Date().toISOString();
    if (!shouldUseSupabase()) {
      const list = readBelege();
      const idx = list.findIndex((b) => b.id === id);
      if (idx < 0) return;
      list[idx] = {
        ...list[idx],
        status: "STORNIERT",
        storno_grund: reason,
        storniert_am: now,
        updated_am: now,
      };
      writeBelege(list);
      void log({
        action: "update",
        entity: "beleg",
        entity_id: id,
        summary: `Beleg ${beleg.belegnummer} storniert: ${reason}`,
        before: beleg,
        after: list[idx],
      });
      return;
    }
    const { error } = await supabase
      .from("belege")
      .update({
        status: "STORNIERT",
        storno_grund: reason,
        storniert_am: now,
        updated_am: now,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const journalRepo = new JournalRepo();
