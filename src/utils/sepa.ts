// SEPA Credit Transfer (PAIN.001.001.03) für Lohn-Überweisungen.
//
// Das Format folgt ISO 20022 / PAIN.001.001.03, das alle SEPA-Banken in
// Deutschland annehmen. Dieses Modul erzeugt die XML-Datei aus einem Array
// von Überweisungsaufträgen; die eigentliche Übertragung an die Bank
// (FinTS/EBICS/HBCI) ist NICHT Aufgabe dieser App — die Datei wird per
// Online-Banking hochgeladen.
//
// Enthaltene Prüfungen:
//   • IBAN-Prüfsumme (ISO 13616 mod-97 auf 26-Zeichen-Darstellung)
//   • Pflicht-BIC (seit SEPA Release 7 ab 2016 nicht mehr erforderlich für
//     DE-IBANs; wird optional mitgegeben)
//   • Betrag > 0 und 2 Nachkommastellen
//   • Ausführungsdatum liegt nicht auf Samstag/Sonntag oder einem
//     BUNDES-weiten Feiertag (Bundesland-Feiertage werden nicht erkannt)
//
// Nicht-Ziel:
//   • Kein SEPA-Lastschrift-Support (PAIN.008)
//   • Keine EBICS/FinTS-Übertragung
//   • Keine regionalen Feiertage

export type SepaTransfer = {
  /** Fortlaufende Nummer innerhalb der Datei, für EndToEndId. */
  index: number;
  /** Empfänger-Name (max. 70 Zeichen, wird ansonsten abgeschnitten). */
  empfaenger: string;
  /** IBAN des Empfängers. */
  iban: string;
  /** BIC des Empfängers (optional für DE-IBANs, Pflicht bei Nicht-DE). */
  bic?: string;
  /** Betrag in Euro, positiv. */
  betrag: number;
  /** Verwendungszweck (max. 140 Zeichen). */
  verwendungszweck: string;
};

export type SepaInput = {
  /** Absender-Daten (Arbeitgeber). */
  debtor: {
    name: string;
    iban: string;
    bic?: string;
  };
  /** Ausführungsdatum (ISO YYYY-MM-DD). Wird auf nächsten Werktag verschoben
   *  wenn auf Wochenende/Feiertag. */
  requestedExecutionDate: string;
  /** Optional: Message-ID für den Bank-Upload. Wird sonst generiert. */
  msgId?: string;
  transfers: SepaTransfer[];
};

export type SepaValidationIssue = {
  level: "error" | "warn";
  where: string;
  message: string;
};

export type SepaBuildResult = {
  xml: string;
  filename: string;
  nbOfTxs: number;
  ctrlSum: string;
  executionDate: string;
  issues: SepaValidationIssue[];
};

// ---------------------------------------------------------------------------
// IBAN-Prüfung
// ---------------------------------------------------------------------------

export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/** ISO 13616 mod-97 Prüfung. Verschiebt die ersten 4 Zeichen ans Ende und
 *  konvertiert A=10 … Z=35. Rest modulo 97 muss 1 sein. */
export function isValidIban(rawIban: string): boolean {
  const iban = normalizeIban(rawIban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  if (iban.length < 15 || iban.length > 34) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let s = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) s += ch; // digit
    else if (code >= 65 && code <= 90) s += String(code - 55); // A=10..Z=35
    else return false;
  }
  // mod 97 auf großer Zahl: chunkweise
  let rem = 0;
  for (let i = 0; i < s.length; i += 7) {
    const chunk = String(rem) + s.slice(i, i + 7);
    rem = Number(chunk) % 97;
  }
  return rem === 1;
}

export function isValidBic(bic: string): boolean {
  const b = bic.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(b);
}

// ---------------------------------------------------------------------------
// Deutsche Bundes-Feiertage
// ---------------------------------------------------------------------------

/** Osterdatum nach Gauß (gregorianischer Kalender). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Bundesweite Feiertage für das Jahr — Target2-relevant. Ohne regionale
 *  Feiertage (Fronleichnam, Allerheiligen, Reformationstag etc.). */
function federalHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const holidays = new Set<string>();
  holidays.add(`${year}-01-01`); // Neujahr
  holidays.add(dateKey(addDays(easter, -2))); // Karfreitag
  holidays.add(dateKey(addDays(easter, 1))); // Ostermontag
  holidays.add(`${year}-05-01`); // Tag der Arbeit
  holidays.add(dateKey(addDays(easter, 39))); // Christi Himmelfahrt
  holidays.add(dateKey(addDays(easter, 50))); // Pfingstmontag
  holidays.add(`${year}-10-03`); // Tag der Deutschen Einheit
  holidays.add(`${year}-12-25`); // 1. Weihnachtstag
  holidays.add(`${year}-12-26`); // 2. Weihnachtstag
  return holidays;
}

export function nextTargetBusinessDay(iso: string): string {
  let d = new Date(iso + "T00:00:00");
  const year = d.getFullYear();
  const holidays = federalHolidays(year);
  while (true) {
    const dow = d.getDay();
    const key = dateKey(d);
    if (dow !== 0 && dow !== 6 && !holidays.has(key)) return key;
    d = addDays(d, 1);
  }
}

// ---------------------------------------------------------------------------
// XML-Helpers
// ---------------------------------------------------------------------------

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trimToSepa(s: string, max: number): string {
  // SEPA erlaubt nur: a-z A-Z 0-9 / - ? : ( ) . , ' + space
  const clean = s
    .replace(/[^A-Za-z0-9/?:().,' +-]/g, "")
    .trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

function fmtAmount(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function randomId(len = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function buildPain001(input: SepaInput): SepaBuildResult {
  const issues: SepaValidationIssue[] = [];

  // Absender
  if (!input.debtor.name.trim())
    issues.push({ level: "error", where: "Debtor.Name", message: "Name des Auftraggebers fehlt." });
  if (!isValidIban(input.debtor.iban))
    issues.push({
      level: "error",
      where: "Debtor.IBAN",
      message: `IBAN des Auftraggebers ungültig (${input.debtor.iban}).`,
    });
  if (input.debtor.bic && !isValidBic(input.debtor.bic))
    issues.push({
      level: "warn",
      where: "Debtor.BIC",
      message: "BIC-Format unüblich — Prüfung empfohlen.",
    });

  // Ausführungsdatum
  let execDate = input.requestedExecutionDate;
  const adjusted = nextTargetBusinessDay(execDate);
  if (adjusted !== execDate) {
    issues.push({
      level: "warn",
      where: "ReqdExctnDt",
      message: `Datum ${execDate} ist Wochenende/Feiertag, verschoben auf ${adjusted}.`,
    });
    execDate = adjusted;
  }

  // Transactions validieren
  const tx: SepaTransfer[] = [];
  let ctrl = 0;
  for (const t of input.transfers) {
    if (!t.empfaenger.trim()) {
      issues.push({
        level: "error",
        where: `Tx #${t.index}`,
        message: "Empfänger-Name fehlt.",
      });
      continue;
    }
    if (!isValidIban(t.iban)) {
      issues.push({
        level: "error",
        where: `Tx #${t.index}`,
        message: `IBAN ${t.iban} ungültig (Prüfsumme falsch oder Format).`,
      });
      continue;
    }
    if (t.bic && !isValidBic(t.bic)) {
      issues.push({
        level: "warn",
        where: `Tx #${t.index}`,
        message: `BIC ${t.bic} unüblich.`,
      });
    }
    if (!(t.betrag > 0)) {
      issues.push({
        level: "error",
        where: `Tx #${t.index}`,
        message: "Betrag muss > 0 sein.",
      });
      continue;
    }
    tx.push(t);
    ctrl += t.betrag;
  }

  const nbOfTxs = tx.length;
  const ctrlSum = fmtAmount(ctrl);

  const msgId = input.msgId ?? `LOHN-${Date.now()}-${randomId(6)}`;
  const pmtInfId = `PMT-${Date.now()}`;
  const creDtTm = new Date().toISOString().slice(0, 19);

  const debtorIban = normalizeIban(input.debtor.iban);
  const debtorBic = input.debtor.bic ? input.debtor.bic.replace(/\s+/g, "").toUpperCase() : null;

  const txBlocks = tx
    .map((t) => {
      const creditorIban = normalizeIban(t.iban);
      const creditorBic = t.bic ? t.bic.replace(/\s+/g, "").toUpperCase() : null;
      const endToEndId = `LOHN${String(t.index).padStart(4, "0")}-${execDate.replace(/-/g, "")}`;
      return `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${xmlEscape(endToEndId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${fmtAmount(t.betrag)}</InstdAmt>
        </Amt>${
          creditorBic
            ? `
        <CdtrAgt>
          <FinInstnId>
            <BIC>${xmlEscape(creditorBic)}</BIC>
          </FinInstnId>
        </CdtrAgt>`
            : ""
        }
        <Cdtr>
          <Nm>${xmlEscape(trimToSepa(t.empfaenger, 70))}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${xmlEscape(creditorIban)}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${xmlEscape(trimToSepa(t.verwendungszweck, 140))}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Erzeugt von harouda-app. Format PAIN.001.001.03. Upload via Online-Banking. -->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${xmlEscape(msgId)}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${xmlEscape(trimToSepa(input.debtor.name, 70))}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${xmlEscape(pmtInfId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${execDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${xmlEscape(trimToSepa(input.debtor.name, 70))}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${xmlEscape(debtorIban)}</IBAN>
        </Id>
      </DbtrAcct>${
        debtorBic
          ? `
      <DbtrAgt>
        <FinInstnId>
          <BIC>${xmlEscape(debtorBic)}</BIC>
        </FinInstnId>
      </DbtrAgt>`
          : `
      <DbtrAgt>
        <FinInstnId>
          <Othr><Id>NOTPROVIDED</Id></Othr>
        </FinInstnId>
      </DbtrAgt>`
      }
      <ChrgBr>SLEV</ChrgBr>${txBlocks}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`;

  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "");
  const filename = `SEPA_Lohn_${execDate}_${stamp}.xml`;

  return {
    xml,
    filename,
    nbOfTxs,
    ctrlSum,
    executionDate: execDate,
    issues,
  };
}
