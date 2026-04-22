/**
 * Adapter: bestehende `Employee`-Stammdaten (Tabelle `public.employees`,
 * Migration 0016) → Lohn-domain-Typ `Arbeitnehmer`.
 *
 * Die Employee-Tabelle nutzt:
 *   - steuerklasse als Roman-Numeral-String ("I"…"VI")
 *   - nachname getrennt vom name-Feld
 *   - privat_versichert boolean (→ kv_beitragsart)
 *   - zusatzbeitrag_pct als numeric
 *
 * Diese Übersetzung macht das Domain-Modell unabhängig vom DB-Schema.
 */

import type { Employee, Steuerklasse as DbStkl } from "../../types/db";
import type {
  Arbeitnehmer,
  Bundesland,
  KvBeitragsart,
  Konfession,
  Beschaeftigungsart,
  Steuerklasse,
} from "../../domain/lohn/types";

const STKL_MAP: Record<DbStkl, Steuerklasse> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
};

const STKL_REVERSE: Record<Steuerklasse, DbStkl> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
};

const BESCH_MAP: Record<Employee["beschaeftigungsart"], Beschaeftigungsart> = {
  vollzeit: "VOLLZEIT",
  teilzeit: "TEILZEIT",
  minijob: "MINIJOB",
  midijob: "MIDIJOB",
  ausbildung: "VOLLZEIT", // Ausbildung als Vollzeit einstufen (vereinfacht)
};

const BESCH_REVERSE: Partial<Record<Beschaeftigungsart, Employee["beschaeftigungsart"]>> = {
  VOLLZEIT: "vollzeit",
  TEILZEIT: "teilzeit",
  MINIJOB: "minijob",
  MIDIJOB: "midijob",
  // KURZFRISTIG wird auf vollzeit gemappt (DB kennt das nicht)
  KURZFRISTIG: "vollzeit",
};

function toKonfession(s: string | null | undefined): Konfession {
  if (s === "EV" || s === "ev") return "EV";
  if (s === "RK" || s === "rk") return "RK";
  return "NONE";
}

/** DB-Row → Domain-Modell. */
export function employeeToArbeitnehmer(e: Employee): Arbeitnehmer {
  return {
    id: e.id,
    mandant_id: e.company_id ?? "",
    personalNr: e.personalnummer,
    name: e.nachname,
    vorname: e.vorname,
    geburtsdatum: "1990-01-01", // Employee hat kein Geburtsdatum; Default-Platzhalter
    sv_nummer: e.sv_nummer ?? "",
    steuer_id: e.steuer_id ?? "",
    steuerklasse: STKL_MAP[e.steuerklasse],
    kinderfreibetraege: e.kinderfreibetraege,
    kirchensteuerpflichtig: e.konfession != null && e.konfession !== "NONE",
    konfession: toKonfession(e.konfession),
    bundesland: (e.bundesland ?? "NW") as Bundesland,
    kv_pflicht: !e.privat_versichert && e.beschaeftigungsart !== "minijob",
    kv_beitragsart: (e.privat_versichert ? "PRIVAT" : "GESETZLICH") as KvBeitragsart,
    kv_zusatzbeitrag: e.zusatzbeitrag_pct != null ? String(e.zusatzbeitrag_pct) : "2.5",
    rv_pflicht: e.beschaeftigungsart !== "minijob",
    av_pflicht: e.beschaeftigungsart !== "minijob",
    pv_pflicht: !e.privat_versichert && e.beschaeftigungsart !== "minijob",
    pv_kinderlos_zuschlag: e.pv_kinderlos,
    pv_anzahl_kinder: e.pv_kinder_anzahl,
    beschaeftigungsart: BESCH_MAP[e.beschaeftigungsart] ?? "VOLLZEIT",
    betriebsnummer: "00000000", // Employee hat kein Betriebsnummer-Feld
    eintrittsdatum: e.einstellungsdatum ?? e.created_at.slice(0, 10),
    austrittsdatum: e.austrittsdatum ?? undefined,
  };
}

/** Domain-Modell → DB-Row-Input (für Create/Update). */
export function arbeitnehmerToEmployeeInput(
  a: Omit<Arbeitnehmer, "id" | "mandant_id">
): Omit<Employee, "id" | "company_id" | "created_at" | "updated_at"> {
  return {
    personalnummer: a.personalNr,
    vorname: a.vorname,
    nachname: a.name,
    steuer_id: a.steuer_id || null,
    sv_nummer: a.sv_nummer || null,
    steuerklasse: STKL_REVERSE[a.steuerklasse],
    kinderfreibetraege: a.kinderfreibetraege,
    konfession: a.konfession === "NONE" ? null : a.konfession,
    bundesland: a.bundesland,
    einstellungsdatum: a.eintrittsdatum,
    austrittsdatum: a.austrittsdatum ?? null,
    beschaeftigungsart: BESCH_REVERSE[a.beschaeftigungsart] ?? "vollzeit",
    wochenstunden: null,
    bruttogehalt_monat: null,
    stundenlohn: null,
    krankenkasse: null,
    zusatzbeitrag_pct:
      a.kv_zusatzbeitrag.trim() !== "" ? Number(a.kv_zusatzbeitrag) : null,
    privat_versichert: a.kv_beitragsart === "PRIVAT",
    pv_kinderlos: a.pv_kinderlos_zuschlag,
    pv_kinder_anzahl: a.pv_anzahl_kinder,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
  };
}
