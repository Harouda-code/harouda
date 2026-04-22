// Beleg-Anforderungen (Receipt Requests)
//
// Ein manueller Tracker — KEIN automatischer E-Mail-Versand. Die App erzeugt
// einen E-Mail-Entwurf (via mailto: oder Copy) und hält die Anforderung fest,
// damit Nutzer:innen nachhalten können, welche Belege noch fehlen.

import type { ReceiptRequest, ReceiptRequestStatus } from "../types/db";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

export type CreateReceiptRequestInput = {
  bank_datum: string;
  bank_betrag: number;
  bank_verwendung?: string | null;
  bank_gegenseite?: string | null;
  bank_iban?: string | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
  notes?: string | null;
};

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** Generiert einen deutschsprachigen E-Mail-Entwurf. Die App versendet nichts —
 *  der Text wird für mailto: oder Copy&Paste zurückgegeben. */
export function buildReceiptRequestDraft(
  req: CreateReceiptRequestInput,
  options?: { kanzleiName?: string; replyEmail?: string; deadlineDays?: number }
): { subject: string; body: string } {
  const kanzlei = options?.kanzleiName?.trim() || "unsere Kanzlei";
  const reply = options?.replyEmail?.trim() || "";
  const deadlineDays = options?.deadlineDays ?? 7;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);

  const datum = new Date(req.bank_datum).toLocaleDateString("de-DE");
  const betragStr = euro.format(req.bank_betrag);

  const subject = `Bitte um Beleg zu Zahlung ${datum} · ${betragStr}`;

  const gegenseite = req.bank_gegenseite?.trim()
    ? `an ${req.bank_gegenseite.trim()}`
    : "";
  const verwendung = req.bank_verwendung?.trim()
    ? `\n  • Verwendungszweck: ${req.bank_verwendung.trim()}`
    : "";
  const iban = req.bank_iban?.trim()
    ? `\n  • Bank-IBAN: ${req.bank_iban.trim()}`
    : "";
  const namensAnrede = req.recipient_name?.trim()
    ? `Sehr geehrte${req.recipient_name.includes(" ") ? "r Herr / Frau" : " Damen und Herren"} ${req.recipient_name.trim()},`
    : "Sehr geehrte Damen und Herren,";

  const body = `${namensAnrede}

für unsere Buchhaltung benötigen wir einen Beleg zu folgender Zahlung:

  • Datum: ${datum}
  • Betrag: ${betragStr}${gegenseite ? `\n  • Zahlung ${gegenseite}` : ""}${verwendung}${iban}

Bitte senden Sie uns den zugehörigen Beleg (Rechnung, Quittung oder
Vertragsunterlagen) bis zum ${deadline.toLocaleDateString("de-DE")} zurück.
Wir benötigen den Beleg für die ordnungsgemäße Verbuchung gemäß § 147 AO.

Vielen Dank für Ihre Unterstützung.

Mit freundlichen Grüßen
${kanzlei}${reply ? `\n${reply}` : ""}
`;
  return { subject, body };
}

/** mailto:-URL aus Betreff + Body bauen. */
export function buildMailtoUrl(
  to: string,
  subject: string,
  body: string
): string {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  // mailto-Parameter müssen %20 statt '+' verwenden
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${encodeURIComponent(to)}?${query}`;
}

export async function fetchReceiptRequests(
  clientId: string | null
): Promise<ReceiptRequest[]> {
  if (!shouldUseSupabase()) {
    const all = store.getReceiptRequests();
    if (clientId === null) {
      return all
        .slice()
        .sort((a, b) => b.requested_at.localeCompare(a.requested_at));
    }
    let legacyWarned = false;
    const filtered: ReceiptRequest[] = [];
    for (const r of all) {
      if ((r as ReceiptRequest).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "receipt_requests: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(r);
        continue;
      }
      if (r.client_id === clientId) filtered.push(r);
    }
    return filtered
      .slice()
      .sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("receipt_requests")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReceiptRequest[];
}

export async function createReceiptRequest(
  input: CreateReceiptRequestInput,
  clientId: string | null
): Promise<ReceiptRequest> {
  if (!shouldUseSupabase()) {
    const now = new Date().toISOString();
    const req: ReceiptRequest = {
      id: uid(),
      company_id: null,
      client_id: clientId,
      requested_by: null,
      requested_at: now,
      bank_datum: input.bank_datum,
      bank_betrag: input.bank_betrag,
      bank_verwendung: input.bank_verwendung ?? null,
      bank_gegenseite: input.bank_gegenseite ?? null,
      bank_iban: input.bank_iban ?? null,
      recipient_email: input.recipient_email ?? null,
      recipient_name: input.recipient_name ?? null,
      notes: input.notes ?? null,
      status: "open",
      received_at: null,
      linked_journal_entry_id: null,
    };
    store.setReceiptRequests([req, ...store.getReceiptRequests()]);
    void log({
      action: "create",
      entity: "settings",
      entity_id: req.id,
      summary: `Beleg angefordert: ${euro.format(req.bank_betrag)} vom ${req.bank_datum}${
        req.bank_gegenseite ? ` · ${req.bank_gegenseite}` : ""
      }`,
    });
    return req;
  }
  const companyId = requireCompanyId();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("receipt_requests")
    .insert({
      company_id: companyId,
      client_id: clientId,
      requested_by: userData.user?.id ?? null,
      bank_datum: input.bank_datum,
      bank_betrag: input.bank_betrag,
      bank_verwendung: input.bank_verwendung ?? null,
      bank_gegenseite: input.bank_gegenseite ?? null,
      bank_iban: input.bank_iban ?? null,
      recipient_email: input.recipient_email ?? null,
      recipient_name: input.recipient_name ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const req = data as ReceiptRequest;
  void log({
    action: "create",
    entity: "settings",
    entity_id: req.id,
    summary: `Beleg angefordert: ${euro.format(req.bank_betrag)} vom ${req.bank_datum}`,
  });
  return req;
}

export async function updateReceiptRequestStatus(
  id: string,
  nextStatus: ReceiptRequestStatus,
  linkedJournalEntryId: string | null,
  clientId: string | null
): Promise<ReceiptRequest> {
  const now = new Date().toISOString();
  const patch: Partial<ReceiptRequest> = {
    status: nextStatus,
    received_at: nextStatus === "received" ? now : null,
    linked_journal_entry_id:
      nextStatus === "received" ? linkedJournalEntryId ?? null : null,
  };

  if (!shouldUseSupabase()) {
    const all = store.getReceiptRequests();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Beleg-Anforderung nicht gefunden.");
    if (
      clientId !== null &&
      all[idx].client_id !== undefined &&
      all[idx].client_id !== clientId
    ) {
      throw new Error("Beleg-Anforderung gehört nicht zum aktiven Mandanten.");
    }
    const before = all[idx];
    const after: ReceiptRequest = { ...before, ...patch };
    const copy = [...all];
    copy[idx] = after;
    store.setReceiptRequests(copy);
    void log({
      action: "update",
      entity: "settings",
      entity_id: id,
      summary: `Beleg-Status ${before.status} → ${nextStatus}`,
      before,
      after,
    });
    return after;
  }

  const companyId = requireCompanyId();
  let uQ = supabase
    .from("receipt_requests")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) uQ = uQ.eq("client_id", clientId);
  const { data, error } = await uQ.select("*").single();
  if (error) throw new Error(error.message);
  return data as ReceiptRequest;
}

export async function deleteReceiptRequest(
  id: string,
  clientId: string | null
): Promise<void> {
  if (!shouldUseSupabase()) {
    const existing = store.getReceiptRequests().find((r) => r.id === id);
    if (
      existing &&
      clientId !== null &&
      existing.client_id !== undefined &&
      existing.client_id !== clientId
    ) {
      throw new Error("Beleg-Anforderung gehört nicht zum aktiven Mandanten.");
    }
    store.setReceiptRequests(
      store.getReceiptRequests().filter((r) => r.id !== id)
    );
    void log({
      action: "delete",
      entity: "settings",
      entity_id: id,
      summary: `Beleg-Anforderung ${id} gelöscht`,
    });
    return;
  }
  const companyId = requireCompanyId();
  let dQ = supabase
    .from("receipt_requests")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) dQ = dQ.eq("client_id", clientId);
  const { error } = await dQ;
  if (error) throw new Error(error.message);
}
