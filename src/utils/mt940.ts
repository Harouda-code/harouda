// Parser for SWIFT MT940 bank statements as emitted by most German banks.
// Reference: Deutsche Kreditwirtschaft "MT 940 - Kundenauszug im S.W.I.F.T.
// Format". Handles the common German :86: extension with sub-fields
// separated by `?NN` tags (e.g. ?00 = Geschäftsvorfall, ?20..?29 = SVWZ,
// ?32..?33 = Name, ?30 = BLZ, ?31 = Account).

export type BankTx = {
  /** Booking date, ISO YYYY-MM-DD */
  datum: string;
  /** Valuta, ISO YYYY-MM-DD */
  valuta: string;
  /** Positive amount; `typ` carries sign direction */
  betrag: number;
  /** "S" = soll / outgoing, "H" = haben / incoming */
  typ: "S" | "H";
  /** Currency, typically EUR */
  waehrung: string;
  /** Purpose of use, free text */
  verwendungszweck: string;
  /** Counterparty name (if extractable) */
  gegenseite_name: string | null;
  /** Counterparty IBAN or account */
  gegenseite_iban: string | null;
  /** Counterparty BIC or BLZ */
  gegenseite_bic: string | null;
  /** Raw :86: block, for debugging */
  raw_86: string;
  /** End-to-end or customer reference (EREF/KREF) if present */
  reference: string | null;
};

export type MT940Statement = {
  konto_iban: string | null;
  waehrung: string;
  eroeffnung: number | null;
  abschluss: number | null;
  transaktionen: BankTx[];
};

const TAG = /^:(\d{2}[A-Z]?):/;

function sliceDate(yymmdd: string): string {
  // YYMMDD → 20YY-MM-DD (MT940 uses 2-digit years)
  if (yymmdd.length !== 6) return "";
  const y = Number(yymmdd.slice(0, 2));
  const year = y <= 69 ? 2000 + y : 1900 + y;
  return `${year}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
}

function parseAmount(s: string): number {
  // German format: "1234,56"
  const clean = s.replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function groupBlocks(text: string): { tag: string; body: string }[] {
  // MT940 is line-based. A field starts with ":NN[A]:" and continues until
  // the next tag. Lines may be joined with CRLF; blocks within a message
  // are separated by a `-` on its own line between statements.
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const out: { tag: string; body: string }[] = [];
  let cur: { tag: string; body: string } | null = null;
  for (const line of lines) {
    const m = TAG.exec(line);
    if (m) {
      if (cur) out.push(cur);
      cur = { tag: m[1], body: line.slice(m[0].length) };
    } else if (cur) {
      cur.body += "\n" + line;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function parse86(body: string): {
  verwendungszweck: string;
  name: string | null;
  iban: string | null;
  bic: string | null;
  reference: string | null;
} {
  // :86: starts with 3-digit Geschäftsvorfall (e.g. "166"), then sub-fields
  // prefixed by ?NN. Join multi-line.
  const flat = body.replace(/\n/g, "");
  const parts = flat.split(/\?(\d{2})/);
  // parts[0] is the GVC code; then alternating [code, payload, code, payload, ...]
  const buckets: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const code = parts[i];
    const payload = parts[i + 1] ?? "";
    buckets[code] = (buckets[code] ?? "") + payload;
  }
  const svwz = ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"]
    .map((c) => buckets[c] ?? "")
    .join("")
    .trim();

  const name = [buckets["32"], buckets["33"]].filter(Boolean).join("").trim() || null;
  const iban = (buckets["31"] || "").trim() || null;
  const bic = (buckets["30"] || "").trim() || null;
  const reference =
    /EREF\+([A-Z0-9\-/]+)/i.exec(svwz)?.[1] ??
    /KREF\+([A-Z0-9\-/]+)/i.exec(svwz)?.[1] ??
    null;

  return { verwendungszweck: svwz, name, iban, bic, reference };
}

function parse61(body: string): {
  datum: string;
  valuta: string;
  typ: "S" | "H";
  betrag: number;
  waehrung: string;
} {
  // Layout: YYMMDD (booking) [MMDD (valuta short)]? [RC|D|C|RD] (sign)
  // Then amount with "," decimal, then currency, then rest.
  // Simplified regex-based parse:
  //   1:  YYMMDD   booking date
  //   2:  MMDD?    optional short valuta
  //   3:  C/D/RC/RD  sign
  //   4:  amount
  const clean = body.replace(/\n/g, "");
  const m =
    /^(\d{6})(\d{4})?([CDR]+)(\d+(?:,\d+)?)/.exec(clean) ??
    /^(\d{6})(\d{4})?(C|D|RC|RD)(\d+(?:[.,]\d+)?)/.exec(clean);
  if (!m) {
    return {
      datum: "",
      valuta: "",
      typ: "S",
      betrag: 0,
      waehrung: "EUR",
    };
  }
  const datum = sliceDate(m[1]);
  const valutaShort = m[2];
  const valuta = valutaShort
    ? `${datum.slice(0, 4)}-${valutaShort.slice(0, 2)}-${valutaShort.slice(2, 4)}`
    : datum;
  const typ: "S" | "H" =
    m[3] === "D" || m[3] === "RC" ? "S" : m[3] === "C" || m[3] === "RD" ? "H" : "S";
  return {
    datum,
    valuta,
    typ,
    betrag: parseAmount(m[4]),
    waehrung: "EUR",
  };
}

export function parseMT940(text: string): MT940Statement {
  const blocks = groupBlocks(text);
  const stmt: MT940Statement = {
    konto_iban: null,
    waehrung: "EUR",
    eroeffnung: null,
    abschluss: null,
    transaktionen: [],
  };
  let pending: BankTx | null = null;

  for (const b of blocks) {
    switch (b.tag) {
      case "25": {
        // Konto-ID: BLZ/Kontonummer or IBAN
        stmt.konto_iban = b.body.trim();
        break;
      }
      case "60F":
      case "60M": {
        const m = /^([CD])\d{6}([A-Z]{3})(\d+(?:,\d+)?)/.exec(b.body.replace(/\n/g, ""));
        if (m) {
          stmt.waehrung = m[2];
          stmt.eroeffnung = parseAmount(m[3]) * (m[1] === "D" ? -1 : 1);
        }
        break;
      }
      case "62F":
      case "62M": {
        const m = /^([CD])\d{6}([A-Z]{3})(\d+(?:,\d+)?)/.exec(b.body.replace(/\n/g, ""));
        if (m) {
          stmt.abschluss = parseAmount(m[3]) * (m[1] === "D" ? -1 : 1);
        }
        break;
      }
      case "61": {
        if (pending) stmt.transaktionen.push(pending);
        const p = parse61(b.body);
        pending = {
          datum: p.datum,
          valuta: p.valuta,
          betrag: p.betrag,
          typ: p.typ,
          waehrung: p.waehrung,
          verwendungszweck: "",
          gegenseite_name: null,
          gegenseite_iban: null,
          gegenseite_bic: null,
          raw_86: "",
          reference: null,
        };
        break;
      }
      case "86": {
        if (!pending) break;
        const ext = parse86(b.body);
        pending.verwendungszweck = ext.verwendungszweck;
        pending.gegenseite_name = ext.name;
        pending.gegenseite_iban = ext.iban;
        pending.gegenseite_bic = ext.bic;
        pending.reference = ext.reference;
        pending.raw_86 = b.body;
        break;
      }
      default:
        break;
    }
  }
  if (pending) stmt.transaktionen.push(pending);
  return stmt;
}
