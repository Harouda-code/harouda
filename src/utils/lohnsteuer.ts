// Lohnsteuer 2025 — PLANUNGSGRADIG, NICHT amtliche Berechnung.
//
// Die Funktionen in diesem Modul setzen den Einkommensteuertarif
// nach § 32a EStG für das Veranlagungsjahr 2025 um (nach öffentlicher
// BMF-Schreiben). Sie ersetzen NICHT den amtlichen
// "Programmablaufplan für die maschinelle Berechnung der Lohnsteuer"
// (BMF PAP). Abweichungen zum PAP sind zu erwarten und in folgenden
// Punkten bewusst in Kauf genommen:
//
//   • Steuerklasse III/V: Splitting-Tarif wird vereinfacht als
//     "2 × Tarif(zvE/2)" angewendet; der Klasse-V-Zuschlag entspricht NICHT
//     den PAP-Formeln.
//   • Kinderfreibeträge wirken sich auf die Lohnsteuer NICHT aus (nur auf
//     Soli/KiSt, und auch dort vereinfacht).
//   • Tarifliche Rundungsregeln des PAP sind näherungsweise abgebildet.
//   • Gleitzonen-Sonderformel für Midi-Jobs ist NICHT enthalten (siehe
//     utils/sozialversicherung.ts, dort jedoch nur SV — die Lohnsteuer-
//     Reduktion in der Gleitzone ist unterschiedlich).
//
// Quellen (Stand Anfang 2025):
//   • § 32a EStG — Einkommensteuertarif 2025
//   • Grundfreibetrag 2025: € 12.096 (für 2024: € 11.784)
//   • Tarifeckwerte 2025 nach Inflationsausgleichsgesetz
//
// Bitte vor jeder produktiven Nutzung im Bundesanzeiger verifizieren und
// ggf. eine zertifizierte Lohnprogramm-Engine anbinden.

import type { Steuerklasse } from "../types/db";

export type TaxInput = {
  /** Jahres-Brutto in Euro. */
  zvEJahr: number;
  steuerklasse: Steuerklasse;
  kirchensteuerpflichtig: boolean;
  /** Bundesland für KiSt-Satz. */
  bundesland: string | null;
  /** Kinderfreibeträge (0, 0.5, 1, 1.5, ...) — beeinflusst nur Soli/KiSt. */
  kinderfreibetraege: number;
};

export type TaxResult = {
  /** Jährliche Lohnsteuer (€). */
  lohnsteuer: number;
  /** Jährlicher Solidaritätszuschlag (€). */
  soli: number;
  /** Jährliche Kirchensteuer (€). */
  kirchensteuer: number;
  /** Summe aus Lohnsteuer, Soli und KiSt. */
  gesamt: number;
  /** Effektiver Steuersatz auf das Jahres-zvE. */
  durchschnittssatz: number;
  /** Debug: angewendete Tarifzone. */
  zone: 1 | 2 | 3 | 4 | 5;
  /** Maschinelle Disclaimer-Kennzeichnung. */
  method:
    | "eskt_grund"
    | "eskt_splitting"
    | "klasse_v_approx"
    | "klasse_vi_proportional"
    | "null";
};

// 2025er Eckwerte §32a EStG
const GRUNDFREIBETRAG_2025 = 12_096;
const ZONE2_END = 17_443;
const ZONE3_END = 68_480;
const ZONE4_END = 277_825;

// Soli 2025 — vereinfachte Freigrenze auf Jahres-Lohnsteuer.
const SOLI_FREIGRENZE_SINGLE = 19_950;
const SOLI_MILDERUNGSFAKTOR = 0.119;
const SOLI_SATZ = 0.055;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Einkommensteuer nach § 32a EStG 2025 (Grundtabelle, d. h. ohne Splitting).
 * Eingabe: zu versteuerndes Einkommen als Jahresbetrag (€).
 */
export function est2025(zvE: number): {
  steuer: number;
  zone: 1 | 2 | 3 | 4 | 5;
} {
  if (zvE <= GRUNDFREIBETRAG_2025) {
    return { steuer: 0, zone: 1 };
  }
  if (zvE <= ZONE2_END) {
    const y = (zvE - GRUNDFREIBETRAG_2025) / 10_000;
    const steuer = (932.3 * y + 1_400) * y;
    return { steuer: Math.max(0, round2(steuer)), zone: 2 };
  }
  if (zvE <= ZONE3_END) {
    const z = (zvE - ZONE2_END) / 10_000;
    const steuer = (176.64 * z + 2_397) * z + 1_015.13;
    return { steuer: round2(steuer), zone: 3 };
  }
  if (zvE <= ZONE4_END) {
    const steuer = 0.42 * zvE - 10_911.92;
    return { steuer: round2(steuer), zone: 4 };
  }
  const steuer = 0.45 * zvE - 19_246.67;
  return { steuer: round2(steuer), zone: 5 };
}

/** Solidaritätszuschlag mit Freigrenze + Milderungszone, vereinfacht. */
function soliVonLSt(lst: number, splittingFaktor = 1): number {
  const freigrenze = SOLI_FREIGRENZE_SINGLE * splittingFaktor;
  if (lst <= freigrenze) return 0;
  const diffZurFreigrenze = lst - freigrenze;
  // Milderungszone — Anstieg bis zum vollen 5,5 %-Satz
  const milderung = diffZurFreigrenze * SOLI_MILDERUNGSFAKTOR;
  const voll = lst * SOLI_SATZ;
  return round2(Math.min(milderung, voll));
}

/** Kirchensteuer-Satz je Bundesland: 8 % in BY/BW, 9 % sonst. */
function kistSatz(bundesland: string | null): number {
  if (!bundesland) return 0.09;
  const norm = bundesland.trim().toLowerCase();
  if (norm === "bayern" || norm === "by" || norm === "baden-württemberg" || norm === "bw")
    return 0.08;
  return 0.09;
}

/**
 * Vereinfachte Lohnsteuer-Berechnung basierend auf Jahres-zvE und Steuerklasse.
 *
 * - Klasse I, II, IV: §32a-Grundtabelle auf zvE (Grundfreibetrag wirkt direkt)
 * - Klasse III: Splitting-Tarif (2 × Tarif(zvE/2)) — reale PAP weicht ab
 * - Klasse V: näherungsweise ohne Grundfreibetrag, + Aufschlag; ACHTUNG:
 *   in der Realität nutzt PAP eine komplexere Formel. Disclaimer im Ergebnis.
 * - Klasse VI: keine Grundfreibeträge, Tarif auf Gesamtbetrag.
 */
export function berechneLohnsteuer(input: TaxInput): TaxResult {
  const zvE = Math.max(0, input.zvEJahr);
  if (zvE === 0) {
    return {
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      gesamt: 0,
      durchschnittssatz: 0,
      zone: 1,
      method: "null",
    };
  }

  let lst = 0;
  let zone: 1 | 2 | 3 | 4 | 5 = 1;
  let method: TaxResult["method"] = "eskt_grund";
  let splittingFaktor = 1;

  switch (input.steuerklasse) {
    case "I":
    case "II":
    case "IV": {
      // Klasse II nutzt zusätzlich den Entlastungsbetrag für Alleinerziehende;
      // wir reduzieren das zvE vereinfacht um € 4.260 (2025).
      const zvEAdj =
        input.steuerklasse === "II" ? Math.max(0, zvE - 4_260) : zvE;
      const r = est2025(zvEAdj);
      lst = r.steuer;
      zone = r.zone;
      break;
    }
    case "III": {
      // Splitting: Jahres-zvE halbieren, Tarif anwenden, verdoppeln.
      const r = est2025(zvE / 2);
      lst = round2(r.steuer * 2);
      zone = r.zone;
      method = "eskt_splitting";
      splittingFaktor = 2;
      break;
    }
    case "V": {
      // Sehr vereinfachte Approximation: Grundtarif OHNE Grundfreibetrag
      // plus 10 % Zuschlag, gedeckelt bei Reichensteuersatz.
      const ohneFreibetrag = est2025(zvE + GRUNDFREIBETRAG_2025);
      lst = round2(Math.min(zvE * 0.45, ohneFreibetrag.steuer * 1.1));
      zone = ohneFreibetrag.zone;
      method = "klasse_v_approx";
      break;
    }
    case "VI": {
      // Kein Grundfreibetrag, voller Tarif aufs Brutto.
      // Simuliert durch: est2025(zvE + Grundfreibetrag).
      const r = est2025(zvE + GRUNDFREIBETRAG_2025);
      lst = r.steuer;
      zone = r.zone;
      method = "klasse_vi_proportional";
      break;
    }
  }

  const soli = soliVonLSt(lst, splittingFaktor);

  let kirchensteuer = 0;
  if (input.kirchensteuerpflichtig) {
    // Vereinfachung: KiSt auf Lohnsteuer. Kinderfreibeträge wirken über
    // eine fiktive LSt-Minderung — wir nehmen 2 × (Grundfreibetrag pro Kind)
    // als Näherung (8.388 € × Kinder / 2 Eltern = 4.194 € pro Kinderfreibetrag).
    const kfbReduktion = input.kinderfreibetraege * 4_194;
    const zvEKist = Math.max(0, zvE - kfbReduktion);
    let lstKist = lst;
    if (kfbReduktion > 0) {
      lstKist = est2025(zvEKist).steuer;
    }
    kirchensteuer = round2(lstKist * kistSatz(input.bundesland));
  }

  const gesamt = round2(lst + soli + kirchensteuer);
  const durchschnittssatz = zvE > 0 ? gesamt / zvE : 0;
  return {
    lohnsteuer: lst,
    soli,
    kirchensteuer,
    gesamt,
    durchschnittssatz,
    zone,
    method,
  };
}

/**
 * Berechnet die monatliche Lohnsteuer aus einem Monats-Brutto, indem das
 * Brutto annualisiert wird, die Jahressteuer berechnet wird und dann durch
 * 12 geteilt wird.
 */
export function monatsLohnsteuer(
  brutto_monat: number,
  opts: Omit<TaxInput, "zvEJahr">
): TaxResult & { brutto_jahr: number } {
  const brutto_jahr = round2(brutto_monat * 12);
  const t = berechneLohnsteuer({ ...opts, zvEJahr: brutto_jahr });
  return {
    ...t,
    lohnsteuer: round2(t.lohnsteuer / 12),
    soli: round2(t.soli / 12),
    kirchensteuer: round2(t.kirchensteuer / 12),
    gesamt: round2(t.gesamt / 12),
    brutto_jahr,
  };
}
