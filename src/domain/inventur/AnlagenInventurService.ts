/**
 * AnlagenInventurService (Sprint 17 / Schritt 5).
 *
 * Bereitet Anlagen-Inventur-Liste vor und erzeugt einen Abgangs-
 * Buchungsvorschlag bei Verlust/Schaden — KEINE direkte Buchung.
 * Die UI laesst den Buchhalter das Aufwandskonto aus einer
 * gefilterten Dropdown waehlen (siehe `filterAusserordentlicherAufwandAccounts`
 * in kontoKategorien.ts).
 *
 * Rechtsbasis:
 *  - § 253 Abs. 3 HGB — ausserplanmaessige AfA bei dauerhafter
 *    Wertminderung.
 *  - § 253 Abs. 3 S. 5 HGB — Ansatz zum niedrigeren beizulegenden
 *    Wert bei Verlust/Schaden ist moeglich (hier: komplettes Ausbuchen
 *    zum Restbuchwert als konservativer Default).
 */

import type { Anlagegut, InventurAnlageStatus } from "../../types/db";
import { planAfaLauf } from "../anlagen/AnlagenService";

export type AnlageInventurCheck = {
  anlage_id: string;
  bezeichnung: string;
  inventar_nr: string;
  konto_anlage: string;
  buchwert_stichtag: number;
  letzter_status: InventurAnlageStatus | null;
};

export type PrepareAnlagenInventurInput = {
  anlagen: Anlagegut[];
  stichtag: string; // YYYY-MM-DD
  /** Bereits persistierte Inventur-Anlagen-Records (session-scoped).
   *  Liefert `letzter_status` pro anlage_id. */
  existingChecks?: Array<{
    anlage_id: string;
    status: InventurAnlageStatus;
  }>;
};

/** Extrahiert das Jahr aus ISO-Datum "YYYY-MM-DD". */
function jahrAusStichtag(stichtag: string): number {
  const m = /^(\d{4})/.exec(stichtag);
  return m ? Number(m[1]) : new Date().getFullYear();
}

/**
 * Berechnet pro aktiver Anlage den Restbuchwert zum Stichtag und
 * liefert die Liste fuer die UI-Inventur-Tabelle.
 */
export function prepareAnlagenInventur(
  input: PrepareAnlagenInventurInput
): AnlageInventurCheck[] {
  const jahr = jahrAusStichtag(input.stichtag);
  const activeAnlagen = input.anlagen.filter((a) => a.aktiv);
  const plan = planAfaLauf(jahr, activeAnlagen);
  const byAnlageId = new Map<string, number>();
  for (const line of plan.lines) {
    byAnlageId.set(line.anlage.id, line.restbuchwert);
  }
  const statusByAnlageId = new Map<string, InventurAnlageStatus>();
  for (const c of input.existingChecks ?? []) {
    statusByAnlageId.set(c.anlage_id, c.status);
  }

  return activeAnlagen.map((a) => ({
    anlage_id: a.id,
    bezeichnung: a.bezeichnung,
    inventar_nr: a.inventar_nr,
    konto_anlage: a.konto_anlage,
    buchwert_stichtag:
      byAnlageId.get(a.id) ?? Number(a.anschaffungskosten),
    letzter_status: statusByAnlageId.get(a.id) ?? null,
  }));
}

// --- Abgangs-Buchungsvorschlag bei Verlust/Schaden -------------------------

export type AbgangsGrund = "verlust" | "schaden";

export type AnlagenAbgangProposal = {
  /** NULL — der Buchhalter waehlt das konkrete Aufwandskonto aus der
   *  gefilterten Dropdown. */
  soll_konto_nr: string | null;
  haben_konto_nr: string;
  betrag: number;
  buchungstext: string;
  begruendung: string[];
  warnings: string[];
};

export type ProposeAbgangsBuchungInput = {
  anlage: Anlagegut;
  buchwert_stichtag: number;
  grund: AbgangsGrund;
  stichtag: string;
  /** Optional vom User vorausgewaehltes Aufwands-Konto
   *  (z. B. 2400 SKR03 / 6500 SKR04). Bleibt `null` wenn nicht
   *  gesetzt — die UI muss dann eine Dropdown-Auswahl erzwingen. */
  aufwand_konto_nr?: string;
};

export function proposeAbgangsBuchung(
  input: ProposeAbgangsBuchungInput
): AnlagenAbgangProposal {
  const warnings: string[] = [];
  const begruendung: string[] = [];
  const betrag = Math.round(input.buchwert_stichtag * 100) / 100;

  if (betrag <= 0) {
    warnings.push(
      "Restbuchwert ist 0 oder negativ — keine Abgangs-Buchung erforderlich."
    );
  }
  if (!input.aufwand_konto_nr) {
    warnings.push(
      "Aufwands-Konto nicht gesetzt — bitte aus Dropdown waehlen, bevor die Buchung erstellt wird."
    );
  }

  const grundLabel =
    input.grund === "verlust" ? "Verlust" : "Schaden";
  begruendung.push(
    `Anlagenabgang wegen ${grundLabel} — Restbuchwert ${betrag.toFixed(2)} € ` +
      `als ausserplanmaessige AfA (§ 253 Abs. 3 HGB).`
  );
  begruendung.push(
    `Haben-Konto ${input.anlage.konto_anlage} (Anlage-Konto) wird ausgebucht.`
  );

  const buchungstext =
    `Abgang ${input.anlage.inventar_nr} ${input.anlage.bezeichnung} ` +
    `(${grundLabel} zum ${input.stichtag})`;

  return {
    soll_konto_nr: input.aufwand_konto_nr ?? null,
    haben_konto_nr: input.anlage.konto_anlage,
    betrag,
    buchungstext,
    begruendung,
    warnings,
  };
}
