import { parseCAMT } from "./camt";
import { parseMT940, type BankTx, type MT940Statement } from "./mt940";

export type { BankTx, MT940Statement } from "./mt940";

export async function parseBankFile(
  file: File
): Promise<MT940Statement> {
  const text = await file.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
    return parseCAMT(text);
  }
  return parseMT940(text);
}

/**
 * Heuristic account mapping: looks at verwendungszweck keywords to suggest
 * an SKR03 account. This is intentionally conservative — the user confirms
 * every suggestion before it becomes a posted entry.
 */
export function suggestKonto(tx: BankTx): { soll?: string; haben?: string } {
  const v = `${tx.verwendungszweck} ${tx.gegenseite_name ?? ""}`.toLowerCase();

  // Incoming (haben_konto = 8400 Erlöse 19%, soll_konto = 1200 Bank)
  if (tx.typ === "H") {
    if (/(gehalt|lohn)/i.test(v))
      return { soll: "1200", haben: "8400" }; // maybe 8500 incoming salary
    return { soll: "1200", haben: "8400" };
  }

  // Outgoing (soll_konto = aufwand; haben_konto = 1200 Bank)
  if (/(miete|pacht)/.test(v)) return { soll: "4210", haben: "1200" };
  if (/(telekom|internet|dsl)/.test(v))
    return { soll: "4920", haben: "1200" };
  if (/(strom|stadtwerke|gas|wasser|energie)/.test(v))
    return { soll: "4240", haben: "1200" };
  if (/(porto|deutsche post)/.test(v))
    return { soll: "4910", haben: "1200" };
  if (/(amazon|staples|bürobedarf|office)/.test(v))
    return { soll: "4930", haben: "1200" };
  if (/(versicherung)/.test(v))
    return { soll: "4360", haben: "1200" };
  if (/(fahrzeug|tankstelle|kfz|shell|aral|esso)/.test(v))
    return { soll: "4530", haben: "1200" };
  if (/(finanzamt|steuer)/.test(v))
    return { soll: "1780", haben: "1200" };
  if (/(lohn|gehalt|payroll)/.test(v))
    return { soll: "4110", haben: "1200" };
  return { soll: "", haben: "1200" };
}
