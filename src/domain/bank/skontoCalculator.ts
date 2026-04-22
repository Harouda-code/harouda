/**
 * Skonto-Automatik für den Bank-Zahlungsabgleich.
 *
 * Sprint 5, Option B (Gap-Closure). Leitet aus einer Bank-Buchung und
 * einem offenen Posten ab, ob der Zahlbetrag dem Skonto-Angebot am Beleg
 * entspricht, und schlägt eine 3-zeilige Buchung (bzw. 2-zeilig bei
 * USt-Satz 0) vor. **Kein Auto-Buchen:** der Aufrufer zeigt den Vorschlag
 * zur Bestätigung an und bucht erst nach explizitem User-OK.
 *
 * SKR03-Konten:
 *   - Forderungsseite (Debitoren):
 *       1200 (Bank) / 1400 (Forderung)
 *       8730 (Gewährte Skonti 19 %) bzw. 8731 (7 %) / 1400
 *       1776 (USt 19 %) bzw. 1771 (USt 7 %) / 1400
 *   - Verbindlichkeitsseite (Kreditoren):
 *       1600 (Verbindlichkeit) / 1200 (Bank)
 *       1600 / 3736 (Erhaltene Skonti 19 %) bzw. 3730 (7 %)
 *       1600 / 1576 (Vorsteuer 19 %) bzw. 1571 (7 %)
 *
 * Wenn kein Skonto-Eintrag am Beleg existiert (skontoPct null/0 oder
 * skontoTage null/0) oder Bank-Datum nach Skonto-Frist liegt oder die
 * Differenz über der Skonto-Schwelle liegt, liefert die Funktion
 * { applicable: false } mit einem Erklärungs-Text.
 */

export type SkontoKind = "forderung" | "verbindlichkeit";

export type SkontoInput = {
  /** Tatsächlich am Bankkonto eingegangener/ausgegangener Betrag. */
  bankBetrag: number;
  /** Buchungs-/Valuta-Datum der Bank-Zahlung (ISO YYYY-MM-DD). */
  bankDatum: string;
  /** Offener Rechnungsbetrag (Brutto). */
  offenBetrag: number;
  /** Datum der Ursprungs-Rechnung (ISO YYYY-MM-DD). */
  rechnungDatum: string;
  /** Skonto-Prozentsatz am Beleg. null oder ≤ 0 → nicht anwendbar. */
  skontoPct: number | null;
  /** Skonto-Frist in Tagen am Beleg. null oder ≤ 0 → nicht anwendbar. */
  skontoTage: number | null;
  /** USt-Satz der Ursprungs-Rechnung (0 / 7 / 19). */
  ustSatz: number;
  /** Forderung (Debitor) oder Verbindlichkeit (Kreditor). */
  kind: SkontoKind;
};

export type SkontoLineRole = "zahlung" | "skonto" | "ust_korrektur";

export type SkontoLine = {
  soll_konto: string;
  haben_konto: string;
  betrag: number;
  beschreibung: string;
  rolle: SkontoLineRole;
};

export type SkontoApplicable = {
  applicable: true;
  skontoBrutto: number;
  skontoNetto: number;
  skontoUst: number;
  innerhalbFrist: true;
  /** Spätester Tag an dem Skonto noch gegolten hätte (ISO). */
  skontoFristBis: string;
  lines: SkontoLine[];
};

export type SkontoNotApplicable = {
  applicable: false;
  reason: string;
};

export type SkontoPlan = SkontoApplicable | SkontoNotApplicable;

// --- Helfer ----------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// SKR03-Kontenableitung. 8731 = gewährte Skonti 7 % (neu in Sprint 5 ergänzt),
// 8730 = gewährte Skonti 19 % (Bestand in skr03.ts). 3730 = erhaltene
// Skonti 7 %, 3736 = erhaltene Skonti 19 %. Siehe SPRINT-5-DECISIONS.md.
function skontoKontoGewaehrt(ustSatz: number): string {
  if (ustSatz === 7) return "8731";
  return "8730"; // 19 % oder Default
}
function skontoKontoErhalten(ustSatz: number): string {
  if (ustSatz === 7) return "3730";
  return "3736"; // 19 % oder Default
}
function umsatzsteuerKonto(ustSatz: number): string {
  if (ustSatz === 7) return "1771";
  return "1776";
}
function vorsteuerKonto(ustSatz: number): string {
  if (ustSatz === 7) return "1571";
  return "1576";
}

// --- Haupt-Funktion --------------------------------------------------------

export function calculateSkontoPlan(input: SkontoInput): SkontoPlan {
  const {
    bankBetrag,
    bankDatum,
    offenBetrag,
    rechnungDatum,
    skontoPct,
    skontoTage,
    ustSatz,
    kind,
  } = input;

  if (skontoPct === null || skontoPct <= 0) {
    return {
      applicable: false,
      reason: "Kein Skonto-Satz am Beleg hinterlegt.",
    };
  }
  if (skontoTage === null || skontoTage <= 0) {
    return {
      applicable: false,
      reason: "Keine Skonto-Frist am Beleg hinterlegt.",
    };
  }

  const skontoBrutto = round2(offenBetrag - bankBetrag);

  if (skontoBrutto <= 0) {
    return {
      applicable: false,
      reason: "Keine Unterzahlung — Skonto nicht anwendbar.",
    };
  }
  if (skontoBrutto < 0.01) {
    return {
      applicable: false,
      reason: "Differenz unterhalb Rundungsschwelle (< 0,01 €).",
    };
  }

  // Skonto-Schwelle: bei OP-Brutto × Skonto-% (kleine Toleranz 0,005 € für
  // Banker-Rundungen).
  const skontoSchwelle = round2(offenBetrag * (skontoPct / 100));
  if (skontoBrutto > skontoSchwelle + 0.005) {
    return {
      applicable: false,
      reason:
        `Differenz ${skontoBrutto.toFixed(2)} € überschreitet ` +
        `Skonto-Schwelle ${skontoSchwelle.toFixed(2)} € ` +
        `(${skontoPct} % von ${offenBetrag.toFixed(2)} €).`,
    };
  }

  const skontoFristBis = addDays(rechnungDatum, skontoTage);
  if (bankDatum > skontoFristBis) {
    return {
      applicable: false,
      reason:
        `Skonto-Frist überschritten ` +
        `(Bankdatum ${bankDatum} > ${skontoFristBis}).`,
    };
  }

  // Netto/USt-Splittung. Bei USt = 0 keine dritte Zeile.
  let skontoNetto = skontoBrutto;
  let skontoUst = 0;
  if (ustSatz > 0) {
    skontoNetto = round2(skontoBrutto / (1 + ustSatz / 100));
    skontoUst = round2(skontoBrutto - skontoNetto);
  }

  const lines: SkontoLine[] = [];

  if (kind === "forderung") {
    lines.push({
      soll_konto: "1200",
      haben_konto: "1400",
      betrag: bankBetrag,
      beschreibung: "Zahlungseingang (Teilbetrag bei Skonto)",
      rolle: "zahlung",
    });
    lines.push({
      soll_konto: skontoKontoGewaehrt(ustSatz),
      haben_konto: "1400",
      betrag: skontoNetto,
      beschreibung: `Gewährter Skonto ${skontoPct} % (netto)`,
      rolle: "skonto",
    });
    if (ustSatz > 0) {
      lines.push({
        soll_konto: umsatzsteuerKonto(ustSatz),
        haben_konto: "1400",
        betrag: skontoUst,
        beschreibung: `USt-Korrektur ${ustSatz} % auf gewährten Skonto`,
        rolle: "ust_korrektur",
      });
    }
  } else {
    lines.push({
      soll_konto: "1600",
      haben_konto: "1200",
      betrag: bankBetrag,
      beschreibung: "Zahlungsausgang (Teilbetrag bei Skonto)",
      rolle: "zahlung",
    });
    lines.push({
      soll_konto: "1600",
      haben_konto: skontoKontoErhalten(ustSatz),
      betrag: skontoNetto,
      beschreibung: `Erhaltener Skonto ${skontoPct} % (netto)`,
      rolle: "skonto",
    });
    if (ustSatz > 0) {
      lines.push({
        soll_konto: "1600",
        haben_konto: vorsteuerKonto(ustSatz),
        betrag: skontoUst,
        beschreibung: `Vorsteuer-Korrektur ${ustSatz} % auf erhaltenen Skonto`,
        rolle: "ust_korrektur",
      });
    }
  }

  return {
    applicable: true,
    skontoBrutto,
    skontoNetto,
    skontoUst,
    innerhalbFrist: true,
    skontoFristBis,
    lines,
  };
}
