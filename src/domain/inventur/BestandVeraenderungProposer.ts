/**
 * BestandVeraenderungProposer (Sprint 17 / Schritt 4).
 *
 * Erzeugt einen Buchungs-Vorschlag fuer die Delta-Buchung einer
 * Bestands-Inventur-Position. Die konkrete Konto-Auswahl muss durch
 * den Buchhalter erfolgen — der Proposer liefert nur die RICHTUNG
 * (Soll/Haben), das VORRAT-Konto (aus der Bestandsposition) und
 * OPTIONAL das Veraenderungs-Konto (wenn vom User im Dropdown
 * vorausgewaehlt).
 *
 * Kein hart codiertes Konto: `veraenderungs_konto_nr` ist Input-
 * Parameter. Wenn nicht gesetzt, bleibt das entsprechende Feld im
 * Proposal `null` — die UI fordert den User auf, via Dropdown zu
 * waehlen bevor die Buchung persistiert wird.
 *
 * Rechtsbasis:
 *  - § 252 Abs. 1 Nr. 3 HGB — Einzelbewertung.
 *  - § 253 Abs. 4 HGB — Strenges Niederstwertprinzip.
 *  - § 256 HGB — Bewertungsverfahren.
 *  - GoBD Rz. 50-52 — Archivierung + Nachvollziehbarkeit.
 */

export type BestandRichtung = "mehrung" | "minderung" | "unveraendert";

export type BestandDeltaProposal = {
  delta: number;
  richtung: BestandRichtung;
  soll_konto_nr: string | null;
  haben_konto_nr: string | null;
  betrag: number;
  buchungstext: string;
  begruendung: string[];
  warnings: string[];
};

export type BestandProposerInput = {
  anfangsbestand: number;
  endbestand: number;
  bezeichnung: string;
  stichtag: string; // YYYY-MM-DD
  vorrat_konto_nr: string;
  /** Vom User im Dropdown ausgewaehltes Veraenderungs-Konto
   *  (SKR03/SKR04, z. B. 4800 oder 3960). Falls nicht gesetzt,
   *  bleibt die entsprechende Seite im Proposal `null`. */
  veraenderungs_konto_nr?: string;
  niederstwert_aktiv?: boolean;
  niederstwert_begruendung?: string;
};

function fmtGerman(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function proposeBestandDelta(
  input: BestandProposerInput
): BestandDeltaProposal {
  const delta = round2(input.endbestand - input.anfangsbestand);
  const begruendung: string[] = [];
  const warnings: string[] = [];

  let richtung: BestandRichtung = "unveraendert";
  let soll_konto_nr: string | null = null;
  let haben_konto_nr: string | null = null;

  if (delta > 0) {
    // Bestandsmehrung: Vorrat (Aktiva) wird aufgestockt, Gegenbuchung
    // im Bestandsveraenderungs-Ertrag.
    //   Soll: Vorrat-Konto
    //   Haben: Bestandsveraenderung-Konto
    richtung = "mehrung";
    soll_konto_nr = input.vorrat_konto_nr;
    haben_konto_nr = input.veraenderungs_konto_nr ?? null;
    begruendung.push(
      `Bestandsmehrung ${delta.toFixed(2)} € → Soll ${input.vorrat_konto_nr}, Haben Bestandsveraenderung.`
    );
  } else if (delta < 0) {
    // Bestandsminderung: Vorrat wird reduziert, Gegenbuchung als
    // Aufwand (Bestandsveraenderungs-Konto).
    //   Soll: Bestandsveraenderung-Konto
    //   Haben: Vorrat-Konto
    richtung = "minderung";
    soll_konto_nr = input.veraenderungs_konto_nr ?? null;
    haben_konto_nr = input.vorrat_konto_nr;
    begruendung.push(
      `Bestandsminderung ${Math.abs(delta).toFixed(2)} € → Soll Bestandsveraenderung, Haben ${input.vorrat_konto_nr}.`
    );
  } else {
    // Unveraendert — keine Buchung noetig.
    richtung = "unveraendert";
    begruendung.push(
      "Delta = 0: keine Bestandsveraenderungs-Buchung erforderlich."
    );
  }

  // Niederstwert-Plausibilitaet (§ 253 Abs. 4 HGB).
  if (input.niederstwert_aktiv) {
    if (delta >= 0) {
      warnings.push(
        "Niederstwertprinzip ist aktiv, aber Delta >= 0 — Wertminderung typischerweise mit Bestandsminderung verbunden."
      );
    }
    if (
      !input.niederstwert_begruendung ||
      input.niederstwert_begruendung.trim().length === 0
    ) {
      warnings.push(
        "Niederstwertprinzip aktiv ohne Begruendung — Pflicht nach § 253 Abs. 4 HGB. Bitte Begruendung erfassen."
      );
    } else {
      begruendung.push(
        `Wertminderung nach § 253 Abs. 4 HGB aktiv: ${input.niederstwert_begruendung}`
      );
    }
  }

  // User muss das Veraenderungs-Konto waehlen, wenn delta != 0.
  if (
    richtung !== "unveraendert" &&
    !input.veraenderungs_konto_nr
  ) {
    warnings.push(
      "Veraenderungs-Konto nicht gesetzt — bitte im Dropdown auswaehlen, bevor die Buchung erstellt wird."
    );
  }

  const buchungstext = `Bestandsveraenderung ${input.bezeichnung} ${fmtGerman(input.stichtag)}`;

  return {
    delta,
    richtung,
    soll_konto_nr,
    haben_konto_nr,
    betrag: Math.abs(delta),
    buchungstext,
    begruendung,
    warnings,
  };
}
