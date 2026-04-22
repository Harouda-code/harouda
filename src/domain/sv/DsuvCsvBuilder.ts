/**
 * DSuV-CSV-Builder fuer Beitragsnachweise (Sprint 15 / Schritt 5).
 *
 * Das SV-Meldeportal akzeptiert monatliche Beitragsnachweise auch als
 * CSV-Upload (separat von den DEUeV-Meldungen). Dieses Modul liefert
 * die Aggregations-CSV pro Monat + Krankenkasse + Beitragsgruppe.
 *
 * Hinweis: Das ist KEIN regulaerer ITSG-Beitragsnachweis-Datensatz im
 * DFUE-Schema. Die CSV ist fuer die manuelle Import-Schnittstelle
 * gedacht, die einige Krankenkassen-Portale bieten. Fuer die strikte
 * DSuV-Beitragsnachweis-XML-Struktur ist ein eigener Sprint noetig
 * (siehe Sprint-15-Abschluss §5).
 */

import type { Beitragsgruppe } from "./dsuvTypes";

export type BeitragsgruppeSumme = {
  einzugsstelle_bbnr: string;
  bg_kv: Beitragsgruppe["kv"];
  bg_rv: Beitragsgruppe["rv"];
  bg_av: Beitragsgruppe["av"];
  bg_pv: Beitragsgruppe["pv"];
  beitragspflichtiges_entgelt: number;
  kv_betrag: number; // AG + AN
  rv_betrag: number;
  av_betrag: number;
  pv_betrag: number;
};

export type BeitragsnachweisCsvInput = {
  companyId: string;
  mandantId: string;
  monat: number; // 1-12
  jahr: number;
  beitragsgruppen: BeitragsgruppeSumme[];
};

export type BeitragsnachweisCsvResult = {
  csv: string;
  warnings: string[];
  zeilen_count: number;
  gesamt_betraege: {
    kv: number;
    rv: number;
    av: number;
    pv: number;
  };
};

const CSV_HEADER = [
  "Monat",
  "Jahr",
  "MandantId",
  "EinzugsstelleBBNR",
  "BG-KV",
  "BG-RV",
  "BG-AV",
  "BG-PV",
  "BeitragspflichtigesEntgelt",
  "KV-Betrag",
  "RV-Betrag",
  "AV-Betrag",
  "PV-Betrag",
];

function csvEscape(s: string): string {
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function num(n: number): string {
  // Deutsch: Komma als Dezimaltrenner fuer Krankenkassen-Portale.
  return n.toFixed(2).replace(".", ",");
}

export function buildBeitragsnachweisCsv(
  input: BeitragsnachweisCsvInput
): BeitragsnachweisCsvResult {
  const warnings: string[] = [];
  if (input.monat < 1 || input.monat > 12) {
    warnings.push(`Monat ${input.monat} ausserhalb 1-12 — ignoriert.`);
  }

  const mm = String(input.monat).padStart(2, "0");
  const lines: string[] = [CSV_HEADER.join(";")];
  const totals = { kv: 0, rv: 0, av: 0, pv: 0 };

  for (const bg of input.beitragsgruppen) {
    if (
      !bg.einzugsstelle_bbnr ||
      bg.einzugsstelle_bbnr.length !== 8
    ) {
      warnings.push(
        `Einzugsstelle-BBNR "${bg.einzugsstelle_bbnr}" ist nicht 8-stellig — Zeile trotzdem exportiert.`
      );
    }
    lines.push(
      [
        mm,
        String(input.jahr),
        csvEscape(input.mandantId),
        csvEscape(bg.einzugsstelle_bbnr),
        bg.bg_kv,
        bg.bg_rv,
        bg.bg_av,
        bg.bg_pv,
        num(bg.beitragspflichtiges_entgelt),
        num(bg.kv_betrag),
        num(bg.rv_betrag),
        num(bg.av_betrag),
        num(bg.pv_betrag),
      ].join(";")
    );
    totals.kv += bg.kv_betrag;
    totals.rv += bg.rv_betrag;
    totals.av += bg.av_betrag;
    totals.pv += bg.pv_betrag;
  }

  if (input.beitragsgruppen.length === 0) {
    warnings.push("Keine Beitragsgruppen — CSV enthaelt nur Header.");
  }

  return {
    csv: lines.join("\r\n"),
    warnings,
    zeilen_count: input.beitragsgruppen.length,
    gesamt_betraege: {
      kv: Math.round(totals.kv * 100) / 100,
      rv: Math.round(totals.rv * 100) / 100,
      av: Math.round(totals.av * 100) / 100,
      pv: Math.round(totals.pv * 100) / 100,
    },
  };
}
