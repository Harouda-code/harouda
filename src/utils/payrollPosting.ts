// Automatische Journal-Buchungen aus einem Lohnlauf.
//
// Pro Mitarbeiter werden vier Buchungen als ENTWURF angelegt; die Admin-
// Rolle schreibt sie anschließend manuell fest. Diese Trennung ersetzt eine
// separate "Approval"-Schicht, weil das App-eigene Entwurf/Gebucht-Modell
// die Freigabe abbildet (siehe utils/journalChain.ts, api/journal.ts).
//
// Seit Multi-Tenancy Phase 2 / Schritt 4: ein Lohn-Lauf = ein
// `createEntriesBatch`-Aufruf (atomar). Pro Mitarbeiter-Row werden die
// sub-Entries vollständig vor dem Write gesammelt; fehlt ein Settings-
// Konto, wird die ganze Row verworfen (errors[] festgehalten, Lauf
// läuft mit den übrigen Rows weiter). Der Batch-Call selbst läuft
// alles-oder-nichts: bei Fehler (z. B. Period-Locked, RLS-Fail) wirft
// die Funktion an den Caller durch — kein Partial-Write im Journal.
//
// Kontenzuordnung (SKR03-Defaults; im Settings überschreibbar):
//
//   Soll 4110 Gehälter             Haben 1741 Lohn-/Kirchensteuer-Verb.
//                                      (Summe aus LSt + Soli + KiSt)
//   Soll 4110 Gehälter             Haben 1742 SV-Verbindlichkeit
//                                      (SV-AN-Anteil)
//   Soll 4110 Gehälter             Haben 1755 Netto-Lohn-Verbindlichkeit
//   Soll 4130 Gesetzl. SV-Aufw.    Haben 1742 SV-Verbindlichkeit
//                                      (SV-AG-Anteil)
//
// Summen: 4110 trägt das Brutto (= LSt+Soli+KiSt + SV-AN + Netto),
//         4130 trägt den AG-SV-Aufwand zusätzlich.

import type { Employee } from "../types/db";
import type { Settings } from "../contexts/SettingsContext";
import type { SvResult } from "./sozialversicherung";
import type { Lohnabrechnung } from "../domain/lohn/types";
import { createEntriesBatch, type JournalInput } from "../api/journal";
import { getActiveCompanyId } from "../api/db";
import { Money } from "../lib/money/Money";

export type PayrollPostingRow = {
  employee: Employee;
  brutto: number;
  lohnsteuer: number;
  soli: number;
  kirchensteuer: number;
  netto: number;
  sv: SvResult;
};

export type PayrollPostingOptions = {
  /** Buchungsdatum (ISO). Üblich: letzter Tag des Abrechnungsmonats. */
  datum: string;
  /** Zeitraumslabel, z. B. "Januar 2025". */
  periodLabel: string;
  /** Mandant, dem die Buchungen zugeordnet werden. */
  clientId: string | null;
};

export type PayrollPostingResult = {
  entriesCreated: number;
  /** UUID des geschriebenen Batch (null, wenn keine Rows valide → kein Batch). */
  batchId: string | null;
  totalBrutto: number;
  totalAgSv: number;
  errors: string[];
  /** Rows, die TATSÄCHLICH Entries in den Journal-Batch gespeist haben
   *  (Schritt 5). Übersprungene Rows (brutto≤0, fehlende Settings-Konten)
   *  sind NICHT enthalten — Caller nutzt dies für den sekundären
   *  Archiv-Write, damit Journal + Archiv konsistent bleiben. */
  processedRows: PayrollPostingRow[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function postPayrollAsJournal(
  rows: PayrollPostingRow[],
  settings: Settings,
  opts: PayrollPostingOptions
): Promise<PayrollPostingResult> {
  const entries: JournalInput[] = [];
  const processedRows: PayrollPostingRow[] = [];
  let sumBrutto = 0;
  let sumAgSv = 0;
  const errors: string[] = [];

  for (const r of rows) {
    if (r.brutto <= 0) continue;
    const belegBase = `LOHN-${opts.datum.replace(/-/g, "")}-${r.employee.personalnummer}`;
    const beschreibungBase = `Lohn ${opts.periodLabel} — ${r.employee.vorname} ${r.employee.nachname}`;

    const lstSum = round2(r.lohnsteuer + r.soli + r.kirchensteuer);
    const nettoR = round2(r.netto);
    const svAn = round2(r.sv.arbeitnehmer.gesamt);
    const svAg = round2(r.sv.arbeitgeber.gesamt);

    // Pre-Flight: Welche Settings-Konten braucht diese Row wirklich?
    // Fehlt auch nur eines der benötigten Konten, verwerfen wir die
    // ganze Row — halbfertige Mitarbeiter-Bookings sind die
    // Primär-Falle, die Schritt 4 überhaupt adressiert.
    const missing: string[] = [];
    const needsPersonal = lstSum > 0 || svAn > 0 || nettoR > 0;
    if (needsPersonal && !settings.lohnKontoPersonalkosten)
      missing.push("lohnKontoPersonalkosten");
    if (lstSum > 0 && !settings.lohnKontoLstVerb)
      missing.push("lohnKontoLstVerb");
    if ((svAn > 0 || svAg > 0) && !settings.lohnKontoSvVerb)
      missing.push("lohnKontoSvVerb");
    if (nettoR > 0 && !settings.lohnKontoNettoVerb)
      missing.push("lohnKontoNettoVerb");
    if (svAg > 0 && !settings.lohnKontoSvAgAufwand)
      missing.push("lohnKontoSvAgAufwand");

    if (missing.length > 0) {
      errors.push(
        `${r.employee.personalnummer}: Konto-Einstellung fehlt (${missing.join(", ")}). Row übersprungen.`
      );
      continue;
    }

    // 1) LSt / Soli / KiSt
    if (lstSum > 0) {
      entries.push({
        datum: opts.datum,
        beleg_nr: `${belegBase}-LSt`,
        beschreibung: `${beschreibungBase} — Lohnsteuer/Soli/KiSt`,
        soll_konto: settings.lohnKontoPersonalkosten,
        haben_konto: settings.lohnKontoLstVerb,
        betrag: lstSum,
        ust_satz: null,
        status: "entwurf",
        client_id: opts.clientId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: `Finanzamt (via ${r.employee.vorname} ${r.employee.nachname})`,
        faelligkeit: null,
      });
    }

    // 2) SV-AN
    if (svAn > 0) {
      entries.push({
        datum: opts.datum,
        beleg_nr: `${belegBase}-SV-AN`,
        beschreibung: `${beschreibungBase} — SV Arbeitnehmer-Anteil`,
        soll_konto: settings.lohnKontoPersonalkosten,
        haben_konto: settings.lohnKontoSvVerb,
        betrag: svAn,
        ust_satz: null,
        status: "entwurf",
        client_id: opts.clientId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: `SV-Träger (AN-Anteil ${r.employee.vorname} ${r.employee.nachname})`,
        faelligkeit: null,
      });
    }

    // 3) Netto
    if (nettoR > 0) {
      entries.push({
        datum: opts.datum,
        beleg_nr: `${belegBase}-Netto`,
        beschreibung: `${beschreibungBase} — Netto`,
        soll_konto: settings.lohnKontoPersonalkosten,
        haben_konto: settings.lohnKontoNettoVerb,
        betrag: nettoR,
        ust_satz: null,
        status: "entwurf",
        client_id: opts.clientId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: `${r.employee.vorname} ${r.employee.nachname} (Netto)`,
        faelligkeit: null,
      });
    }

    // 4) SV-AG
    if (svAg > 0) {
      entries.push({
        datum: opts.datum,
        beleg_nr: `${belegBase}-SV-AG`,
        beschreibung: `${beschreibungBase} — SV Arbeitgeber-Anteil`,
        soll_konto: settings.lohnKontoSvAgAufwand,
        haben_konto: settings.lohnKontoSvVerb,
        betrag: svAg,
        ust_satz: null,
        status: "entwurf",
        client_id: opts.clientId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: `SV-Träger (AG-Anteil ${r.employee.vorname} ${r.employee.nachname})`,
        faelligkeit: null,
      });
      sumAgSv += svAg;
    }

    sumBrutto += r.brutto;
    processedRows.push(r);
  }

  if (entries.length === 0) {
    // Keine validen Rows → kein Batch. Kein Audit-Noise.
    return {
      entriesCreated: 0,
      batchId: null,
      totalBrutto: round2(sumBrutto),
      totalAgSv: round2(sumAgSv),
      errors,
      processedRows,
    };
  }

  // companyId aus dem globalen Provider-Scope; im DEMO-Pfad ungenutzt.
  // Der Supabase-Pfad braucht eine echte id; wäre `shouldUseSupabase()`
  // true ohne aktive Firma, bricht bereits `requireCompanyId()` in der
  // nächsten Ebene — hier absichtlich nicht nochmal validieren, damit
  // die Fehlermeldung an der richtigen Stelle entsteht.
  const companyId = getActiveCompanyId() ?? "";

  // Kein try/catch — Batch-Fehler sind katastrophal (Period-Locked,
  // RLS-Fail) und müssen den Caller erreichen. Die PayrollRunPage
  // fängt den Fehler bereits in ihrem try/catch um `handlePostGL()`.
  const result = await createEntriesBatch(entries, {
    companyId,
    clientId: opts.clientId,
    batchLabel: `Lohn-Lauf ${opts.periodLabel}`,
  });

  return {
    entriesCreated: result.created.length,
    batchId: result.batchId,
    totalBrutto: round2(sumBrutto),
    totalAgSv: round2(sumAgSv),
    errors,
    processedRows,
  };
}

/** Hilfs-Konstruktor: baut aus einer `PayrollPostingRow` (zahlen-basiert)
 *  eine minimale `Lohnabrechnung` für den Archiv-Upsert. Voll-Feature-
 *  Abrechnungen (Jahresvergleich, Historie) kommen weiter aus
 *  `LohnabrechnungsEngine`; hier reicht das Aggregat, weil der Archiv-
 *  Upsert die Summen-Felder aus der Row zieht und `abrechnung_json`
 *  nur als Snapshot speichert. */
export function buildArchivAbrechnungFromRow(
  row: PayrollPostingRow,
  abrechnungsmonat: string
): Lohnabrechnung {
  const zero = new Money("0");
  const brutto = new Money(row.brutto.toFixed(2));
  const netto = new Money(row.netto.toFixed(2));
  const lst = new Money(row.lohnsteuer.toFixed(2));
  const soli = new Money(row.soli.toFixed(2));
  const kist = new Money(row.kirchensteuer.toFixed(2));
  const svAnGesamt = new Money(row.sv.arbeitnehmer.gesamt.toFixed(2));
  const gesamtAbzuege = lst.plus(soli).plus(kist).plus(svAnGesamt);
  const svAgGesamt = new Money(row.sv.arbeitgeber.gesamt.toFixed(2));
  return {
    arbeitnehmer_id: row.employee.id,
    abrechnungsmonat,
    laufenderBrutto: brutto,
    sonstigeBezuege: zero,
    gesamtBrutto: brutto,
    svBrutto: brutto,
    abzuege: {
      lohnsteuer: lst,
      solidaritaetszuschlag: soli,
      kirchensteuer: kist,
      kv_an: new Money(row.sv.arbeitnehmer.kv.toFixed(2)),
      kv_zusatz_an: zero,
      pv_an: new Money(row.sv.arbeitnehmer.pv.toFixed(2)),
      rv_an: new Money(row.sv.arbeitnehmer.rv.toFixed(2)),
      av_an: new Money(row.sv.arbeitnehmer.av.toFixed(2)),
      gesamtAbzuege,
    },
    formatted: {
      laufenderBrutto: brutto.toFixed2() + " €",
      sonstigeBezuege: zero.toFixed2() + " €",
      gesamtBrutto: brutto.toFixed2() + " €",
      auszahlungsbetrag: netto.toFixed2() + " €",
      gesamtkostenArbeitgeber: brutto.plus(svAgGesamt).toFixed2() + " €",
    },
    arbeitgeberKosten: {
      kv: new Money(row.sv.arbeitgeber.kv.toFixed(2)),
      kv_zusatz: zero,
      pv: new Money(row.sv.arbeitgeber.pv.toFixed(2)),
      rv: new Money(row.sv.arbeitgeber.rv.toFixed(2)),
      av: new Money(row.sv.arbeitgeber.av.toFixed(2)),
      u1: new Money(row.sv.arbeitgeber.u1.toFixed(2)),
      u2: new Money(row.sv.arbeitgeber.u2.toFixed(2)),
      u3: new Money(row.sv.arbeitgeber.insolvenzgeld.toFixed(2)),
      gesamt: svAgGesamt,
    },
    auszahlungsbetrag: netto,
    gesamtkostenArbeitgeber: brutto.plus(svAgGesamt),
    _meta: {
      lstMethode: "JAHRESBERECHNUNG_§39b_EStG",
      steuerklasseAngewandt: row.employee.steuerklasse as never,
      kvPflichtig: true,
      rvPflichtig: true,
      svBemessungKvPv: row.sv.bemessung_kvpv.toFixed(2),
      svBemessungRvAv: row.sv.bemessung_rvav.toFixed(2),
    },
  } as Lohnabrechnung;
}
