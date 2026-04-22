// Parser for CAMT.052 / CAMT.053 bank statements (ISO 20022 XML).
// Reads the common subset used by German banks: <Stmt><Ntry> entries with
// <Amt>, <CdtDbtInd>, <BookgDt>, <ValDt>, <NtryDtls>/<TxDtls> for the
// counterparty IBAN/BIC/name and remittance info.

import type { BankTx, MT940Statement } from "./mt940";

function textContent(root: Element, selector: string): string {
  const el = root.querySelector(selector);
  return el ? (el.textContent ?? "").trim() : "";
}

function textOf(el: Element | null): string {
  return el ? (el.textContent ?? "").trim() : "";
}

export function parseCAMT(xml: string): MT940Statement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("CAMT: XML konnte nicht geparst werden.");
  }

  const stmt =
    doc.querySelector("BkToCstmrStmt > Stmt") ??
    doc.querySelector("BkToCstmrAcctRpt > Rpt") ??
    doc.documentElement;

  const konto_iban = textContent(stmt, "Acct > Id > IBAN") || null;
  const waehrung = textContent(stmt, "Acct > Ccy") || "EUR";

  function firstBalance(code: string): number | null {
    const bals = stmt.querySelectorAll("Bal");
    for (const b of Array.from(bals)) {
      const c = textOf(b.querySelector("Tp > CdOrPrtry > Cd"));
      if (c === code) {
        const amt = Number(textOf(b.querySelector("Amt")));
        const cdtDbt = textOf(b.querySelector("CdtDbtInd"));
        return Number.isFinite(amt) ? amt * (cdtDbt === "DBIT" ? -1 : 1) : null;
      }
    }
    return null;
  }

  const eroeffnung = firstBalance("OPBD") ?? firstBalance("PRCD");
  const abschluss = firstBalance("CLBD") ?? firstBalance("CLAV");

  const transaktionen: BankTx[] = [];
  for (const ntry of Array.from(stmt.querySelectorAll("Ntry"))) {
    const amt = Number(textOf(ntry.querySelector("Amt")));
    const cdtDbt = textOf(ntry.querySelector("CdtDbtInd"));
    const typ: "S" | "H" = cdtDbt === "DBIT" ? "S" : "H";
    const datum = (textOf(ntry.querySelector("BookgDt > Dt")) || "").slice(0, 10);
    const valuta =
      (textOf(ntry.querySelector("ValDt > Dt")) || datum).slice(0, 10);
    const ccy =
      ntry.querySelector("Amt")?.getAttribute("Ccy") ?? waehrung;

    // Counterparty: look in NtryDtls/TxDtls/RltdPties
    const txDtls = ntry.querySelector("NtryDtls > TxDtls");
    const rltd = txDtls?.querySelector("RltdPties");
    const isIncoming = typ === "H";
    const partyNode = isIncoming
      ? rltd?.querySelector("Dbtr")
      : rltd?.querySelector("Cdtr");
    const acctNode = isIncoming
      ? rltd?.querySelector("DbtrAcct")
      : rltd?.querySelector("CdtrAcct");
    const agtNode = isIncoming
      ? txDtls?.querySelector("RltdAgts > DbtrAgt")
      : txDtls?.querySelector("RltdAgts > CdtrAgt");

    const name = textOf(partyNode?.querySelector("Nm") ?? null) || null;
    const iban = textOf(acctNode?.querySelector("Id > IBAN") ?? null) || null;
    const bic = textOf(agtNode?.querySelector("FinInstnId > BICFI") ?? null) || null;

    const svwz =
      textOf(txDtls?.querySelector("RmtInf > Ustrd") ?? null) ||
      Array.from(txDtls?.querySelectorAll("RmtInf > Ustrd") ?? [])
        .map((n) => textOf(n))
        .join(" ") ||
      textOf(ntry.querySelector("AddtlNtryInf") ?? null);

    const eref =
      textOf(txDtls?.querySelector("Refs > EndToEndId") ?? null) || null;
    const kref = textOf(txDtls?.querySelector("Refs > InstrId") ?? null) || null;

    transaktionen.push({
      datum,
      valuta,
      betrag: Math.abs(amt),
      typ,
      waehrung: ccy,
      verwendungszweck: svwz.trim(),
      gegenseite_name: name,
      gegenseite_iban: iban,
      gegenseite_bic: bic,
      raw_86: "",
      reference: eref ?? kref,
    });
  }

  return { konto_iban, waehrung, eroeffnung, abschluss, transaktionen };
}
