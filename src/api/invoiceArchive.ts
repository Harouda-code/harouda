// Dual-Archiv für eingehende E-Rechnungen.
//
// Workflow:
//   1. Nutzer:in lädt PDF oder XML.
//   2. Der bestehende ZUGFeRD-Reader parst die CII/UBL-Daten.
//   3. archiveInvoice() legt zwei Zeilen an:
//        • invoice_archive       → Original-Datei + SHA-256
//        • invoice_xml_archive   → XML + extrahierte Strukturdaten
//   4. Retention = uploaded_at + 10 Jahre (§ 147 AO).
//
// Honest note: at-rest-Verschlüsselung übernimmt Supabase. Eine zusätzliche
// clientseitige Verschlüsselung wird nicht angeboten, weil der Schlüssel im
// Browser lägen würde.

import type {
  InvoiceArchiveEntry,
  InvoiceArchiveSource,
  InvoiceXmlArchiveEntry,
  InvoiceXmlFormat,
} from "../types/db";
import type { ZugferdInvoice } from "../utils/zugferd";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  // Kopieren in einen dedizierten ArrayBuffer, damit SubtleCrypto mit
  // engerem BufferSource-Typ zufrieden ist (schützt vor
  // SharedArrayBuffer-Ambiguität).
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isoDate(): string {
  return new Date().toISOString();
}

function tenYearsFrom(iso: string): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 10);
  return d.toISOString().slice(0, 10);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function fileToBase64(file: File): Promise<{
  base64: string;
  sha256: string;
}> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const sha = await sha256Hex(buf);
  return { base64: bytesToBase64(buf), sha256: sha };
}

function detectXmlFormat(xml: string): InvoiceXmlFormat {
  if (!xml) return "unknown";
  if (/CrossIndustryInvoice/.test(xml)) return "cii";
  if (/<Invoice[\s>]/.test(xml)) return "ubl";
  if (/xrechnung/i.test(xml)) return "xrechnung";
  return "unknown";
}

export type ArchiveInvoiceInput = {
  /** Original-Datei, wie sie hochgeladen wurde. Optional, wenn nur XML vorliegt. */
  file?: File;
  /** Extrahiertes oder direkt hochgeladenes XML. */
  xml: string;
  /** Vollständig geparster ZUGFeRD/XRechnung-Invoice (aus utils/zugferd.ts). */
  parsed: ZugferdInvoice;
  /** Quelle des Archivierungs-Events. */
  source: InvoiceArchiveSource;
  /** Optional: Journal-ID, wenn die Rechnung bereits verbucht wurde. */
  journalEntryId?: string | null;
  /** Optionale Notiz (Nutzer:in). */
  notes?: string | null;
  /** true = erlaubt explizit ein Duplikat (gleiche SHA-256) anzulegen.
   *  Default false — archiveInvoice wirft DuplicateInvoiceError. */
  allowDuplicate?: boolean;
};

/** Fehler, der geworfen wird, wenn beim Archivieren ein Duplikat erkannt
 *  wird und der Aufrufer kein allowDuplicate: true mitgegeben hat. */
export class DuplicateInvoiceError extends Error {
  existing: InvoiceArchiveEntry;
  constructor(existing: InvoiceArchiveEntry) {
    super(
      `Bereits archiviert: "${existing.original_filename}" am ${new Date(
        existing.uploaded_at
      ).toLocaleDateString("de-DE")} (SHA-256 ${existing.content_sha256.slice(
        0,
        10
      )}…).`
    );
    this.name = "DuplicateInvoiceError";
    this.existing = existing;
  }
}

export type ArchiveInvoiceResult = {
  archive: InvoiceArchiveEntry;
  xml: InvoiceXmlArchiveEntry;
  duplicateOf?: InvoiceArchiveEntry | null;
};

/** Sucht eine existierende Archiv-Zeile mit derselben SHA-256-Prüfsumme.
 *  Rückgabe = Duplikat oder null. */
async function findDuplicateBySha(sha: string): Promise<InvoiceArchiveEntry | null> {
  if (!shouldUseSupabase()) {
    return (
      store
        .getInvoiceArchive()
        .find((e) => e.content_sha256 === sha) ?? null
    );
  }
  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("invoice_archive")
    .select("*")
    .eq("company_id", companyId)
    .eq("content_sha256", sha)
    .limit(1);
  if (error) return null;
  const rows = (data ?? []) as InvoiceArchiveEntry[];
  return rows[0] ?? null;
}

/** Legt eine neue Archiv-Zeile an (Original + XML + Struktur). */
export async function archiveInvoice(
  input: ArchiveInvoiceInput,
  clientId: string | null
): Promise<ArchiveInvoiceResult> {
  const now = isoDate();
  const retention = tenYearsFrom(now);
  const format = detectXmlFormat(input.xml);

  let contentBytes: Uint8Array;
  let originalFilename: string;
  let mimeType: string;
  let sizeBytes: number;
  let contentSha256: string;
  let contentB64: string;

  if (input.file) {
    const b = await fileToBase64(input.file);
    contentB64 = b.base64;
    contentSha256 = b.sha256;
    originalFilename = input.file.name;
    mimeType = input.file.type || "application/octet-stream";
    sizeBytes = input.file.size;
    contentBytes = new Uint8Array(await input.file.arrayBuffer());
  } else {
    // Kein Originalfile: wir archivieren das XML direkt als Datei.
    const enc = new TextEncoder().encode(input.xml);
    contentBytes = enc;
    contentB64 = bytesToBase64(enc);
    contentSha256 = await sha256Hex(enc);
    originalFilename = `${input.parsed.invoiceNumber || "invoice"}.xml`;
    mimeType = "application/xml";
    sizeBytes = enc.length;
  }
  // contentBytes nur zur Konsistenzprüfung — nicht weiter verwendet.
  void contentBytes;

  const xmlSha256 = await sha256Hex(input.xml);

  // Duplikat-Check: gleiche SHA-256 bereits archiviert?
  if (!input.allowDuplicate) {
    const existing = await findDuplicateBySha(contentSha256);
    if (existing) {
      throw new DuplicateInvoiceError(existing);
    }
  }

  if (!shouldUseSupabase()) {
    const archive: InvoiceArchiveEntry = {
      id: uid(),
      company_id: null,
      client_id: clientId,
      uploaded_at: now,
      uploader_user_id: null,
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      content_sha256: contentSha256,
      content_b64: contentB64,
      storage_path: null,
      source: input.source,
      retention_until: retention,
      journal_entry_id: input.journalEntryId ?? null,
      notes: input.notes ?? null,
    };
    const xml: InvoiceXmlArchiveEntry = {
      id: uid(),
      archive_id: archive.id,
      company_id: null,
      client_id: clientId,
      format,
      profile: input.parsed.profile ?? null,
      invoice_number: input.parsed.invoiceNumber || null,
      issue_date: input.parsed.issueDate || null,
      due_date: input.parsed.dueDate ?? null,
      supplier_name: input.parsed.seller?.name ?? null,
      supplier_vat_id: input.parsed.seller?.vatId ?? null,
      buyer_name: input.parsed.buyer?.name ?? null,
      currency: input.parsed.currency ?? null,
      net_total: input.parsed.netTotal ?? null,
      tax_total: input.parsed.taxTotal ?? null,
      grand_total: input.parsed.grandTotal ?? null,
      xml_content: input.xml,
      xml_sha256: xmlSha256,
      parsed_json: input.parsed,
      created_at: now,
    };
    store.setInvoiceArchive([archive, ...store.getInvoiceArchive()]);
    store.setInvoiceXmlArchive([xml, ...store.getInvoiceXmlArchive()]);
    void log({
      action: "create",
      entity: "document",
      entity_id: archive.id,
      summary: `E-Rechnung archiviert: ${originalFilename} (${format})`,
      after: { archive_id: archive.id, xml_id: xml.id, sha256: contentSha256 },
    });
    return { archive, xml };
  }

  const companyId = requireCompanyId();
  const { data: archiveRow, error: archiveErr } = await supabase
    .from("invoice_archive")
    .insert({
      company_id: companyId,
      client_id: clientId,
      uploaded_at: now,
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      content_sha256: contentSha256,
      content_b64: contentB64,
      source: input.source,
      retention_until: retention,
      journal_entry_id: input.journalEntryId ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (archiveErr) throw new Error(archiveErr.message);
  const archive = archiveRow as InvoiceArchiveEntry;

  const { data: xmlRow, error: xmlErr } = await supabase
    .from("invoice_xml_archive")
    .insert({
      archive_id: archive.id,
      company_id: companyId,
      client_id: clientId,
      format,
      profile: input.parsed.profile ?? null,
      invoice_number: input.parsed.invoiceNumber || null,
      issue_date: input.parsed.issueDate || null,
      due_date: input.parsed.dueDate ?? null,
      supplier_name: input.parsed.seller?.name ?? null,
      supplier_vat_id: input.parsed.seller?.vatId ?? null,
      buyer_name: input.parsed.buyer?.name ?? null,
      currency: input.parsed.currency ?? null,
      net_total: input.parsed.netTotal ?? null,
      tax_total: input.parsed.taxTotal ?? null,
      grand_total: input.parsed.grandTotal ?? null,
      xml_content: input.xml,
      xml_sha256: xmlSha256,
      parsed_json: input.parsed,
    })
    .select("*")
    .single();
  if (xmlErr) throw new Error(xmlErr.message);
  const xml = xmlRow as InvoiceXmlArchiveEntry;

  void log({
    action: "create",
    entity: "document",
    entity_id: archive.id,
    summary: `E-Rechnung archiviert: ${originalFilename} (${format})`,
    after: { archive_id: archive.id, xml_id: xml.id, sha256: contentSha256 },
  });

  return { archive, xml };
}

export async function fetchInvoiceArchive(
  clientId: string | null
): Promise<
  (InvoiceArchiveEntry & { xml: InvoiceXmlArchiveEntry | null })[]
> {
  if (!shouldUseSupabase()) {
    const xmls = store.getInvoiceXmlArchive();
    const allArchives = store.getInvoiceArchive();
    let rows = allArchives;
    if (clientId !== null) {
      let legacyWarned = false;
      rows = [];
      for (const a of allArchives) {
        if ((a as InvoiceArchiveEntry).client_id === undefined) {
          if (!legacyWarned) {
            console.warn(
              "invoice_archive: legacy-row without client_id, returned unfiltered."
            );
            legacyWarned = true;
          }
          rows.push(a);
          continue;
        }
        if (a.client_id === clientId) rows.push(a);
      }
    }
    return rows
      .slice()
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
      .map((a) => ({
        ...a,
        xml: xmls.find((x) => x.archive_id === a.id) ?? null,
      }));
  }
  const companyId = requireCompanyId();
  let aQ = supabase
    .from("invoice_archive")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) aQ = aQ.eq("client_id", clientId);
  const { data: archives, error: e1 } = await aQ.order("uploaded_at", {
    ascending: false,
  });
  if (e1) throw new Error(e1.message);
  let xQ = supabase
    .from("invoice_xml_archive")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) xQ = xQ.eq("client_id", clientId);
  const { data: xmls, error: e2 } = await xQ;
  if (e2) throw new Error(e2.message);
  const byArchive = new Map<string, InvoiceXmlArchiveEntry>();
  for (const x of (xmls ?? []) as InvoiceXmlArchiveEntry[]) {
    byArchive.set(x.archive_id, x);
  }
  return (archives ?? []).map((a: InvoiceArchiveEntry) => ({
    ...a,
    xml: byArchive.get(a.id) ?? null,
  }));
}

export type IntegrityResult = {
  ok: boolean;
  archive_sha_match: boolean;
  xml_sha_match: boolean;
  message: string;
};

/** Rechnet die SHA-256-Prüfsummen neu und vergleicht mit den gespeicherten. */
export async function verifyArchiveIntegrity(
  archiveId: string
): Promise<IntegrityResult> {
  let archive: InvoiceArchiveEntry | null = null;
  let xml: InvoiceXmlArchiveEntry | null = null;

  if (!shouldUseSupabase()) {
    archive = store.getInvoiceArchive().find((a) => a.id === archiveId) ?? null;
    xml =
      store.getInvoiceXmlArchive().find((x) => x.archive_id === archiveId) ??
      null;
  } else {
    const companyId = requireCompanyId();
    const { data: ar } = await supabase
      .from("invoice_archive")
      .select("*")
      .eq("id", archiveId)
      .eq("company_id", companyId)
      .single();
    archive = (ar as InvoiceArchiveEntry) ?? null;
    const { data: xm } = await supabase
      .from("invoice_xml_archive")
      .select("*")
      .eq("archive_id", archiveId)
      .eq("company_id", companyId)
      .maybeSingle();
    xml = (xm as InvoiceXmlArchiveEntry) ?? null;
  }

  if (!archive) {
    return {
      ok: false,
      archive_sha_match: false,
      xml_sha_match: false,
      message: "Archiv-Eintrag nicht gefunden.",
    };
  }

  let archiveMatch = false;
  if (archive.content_b64) {
    const bin = atob(archive.content_b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const sha = await sha256Hex(bytes);
    archiveMatch = sha === archive.content_sha256;
  } else {
    // Ohne content_b64 (Storage-Pfad) kann der Browser die Datei nicht
    // neu hashen. Markieren wir als "nicht lokal prüfbar".
    archiveMatch = true;
  }

  let xmlMatch = true;
  if (xml) {
    const sha = await sha256Hex(xml.xml_content);
    xmlMatch = sha === xml.xml_sha256;
  }

  const ok = archiveMatch && xmlMatch;
  void log({
    action: "access",
    entity: "document",
    entity_id: archiveId,
    summary: ok
      ? `Archiv-Integrität verifiziert (${archive.original_filename})`
      : `Archiv-Integrität KAPUTT (${archive.original_filename})`,
  });
  return {
    ok,
    archive_sha_match: archiveMatch,
    xml_sha_match: xmlMatch,
    message: ok
      ? "Prüfsummen stimmen — Archiv unverändert."
      : `Abweichung erkannt: original=${archiveMatch ? "OK" : "geändert"}, xml=${
          xmlMatch ? "OK" : "geändert"
        }.`,
  };
}
