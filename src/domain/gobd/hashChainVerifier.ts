/**
 * Sprint 20.B.3 · Client-seitiger Chain-Verifier für
 *   (a) business_partners_versions  — pro partner_id, sortiert version_number ASC
 *   (b) ustid_verifications          — pro client_id, sortiert created_at ASC, id ASC
 *
 * Der Payload-Kontrakt ist BYTE-IDENTISCH mit Migration 0039:
 *
 *   BPV: {
 *     aufbewahrungs_kategorie, partner_id, snapshot,
 *     valid_from, version_number
 *   }
 *   UV:  {
 *     created_at, id, partner_id, raw_response_sha256,
 *     requested_ust_idnr, verification_source, verification_status
 *   }
 *
 * Jedes Feld ist alphabetisch sortiert, Whitespace wird nicht erzeugt,
 * UUIDs sind lowercase, Timestamps YYYY-MM-DDTHH:MM:SS.ffffffZ.
 *
 * Input-Annahmen:
 *   - Rows sind VOR-SORTIERT (der Aufrufer muss das sicherstellen).
 *   - Rows tragen `prev_hash` + `version_hash` bzw. `verification_hash`.
 *     (DEMO-Store schreibt die Felder ab Sprint 20.B.5; DB-Trigger 0039
 *     macht das Supabase-seitig automatisch.)
 *
 * Verifier-Semantik:
 *   - Erste Bruchstelle pro Chain wird zurückgemeldet, Verifier stoppt
 *     dort (kein vollständiger Error-Dump).
 *   - Reasons: 'prev_hash_mismatch' | 'hash_mismatch' | 'genesis_non_null_prev'.
 */

import type {
  BusinessPartnerVersion,
  UstIdVerification,
} from "../../types/db";
import {
  computeChainHash,
  formatUtcTimestamp,
} from "../../lib/crypto/sha256Canonical";

export type ChainBreakReason =
  | "prev_hash_mismatch"
  | "hash_mismatch"
  | "genesis_non_null_prev";

export type ChainVerificationResult = {
  valid: boolean;
  count: number;
  brokenAt: { index: number; id: string } | null;
  reason: ChainBreakReason | null;
};

// ---------------------------------------------------------------------------
// Payload-Builder (must mirror DB-Funktionen canonical_json_bpv / canonical_json_uv)
// ---------------------------------------------------------------------------

export type BpvPayload = {
  aufbewahrungs_kategorie: BusinessPartnerVersion["aufbewahrungs_kategorie"];
  partner_id: string;
  snapshot: BusinessPartnerVersion["snapshot"];
  valid_from: string;
  version_number: number;
};

export type BpvPayloadInput = Pick<
  BusinessPartnerVersion,
  | "aufbewahrungs_kategorie"
  | "partner_id"
  | "snapshot"
  | "valid_from"
  | "version_number"
>;

export function buildBpvPayload(row: BpvPayloadInput): BpvPayload {
  return {
    aufbewahrungs_kategorie: row.aufbewahrungs_kategorie,
    partner_id: row.partner_id.toLowerCase(),
    snapshot: row.snapshot,
    valid_from: formatUtcTimestamp(new Date(row.valid_from)),
    version_number: row.version_number,
  };
}

export type UvPayload = {
  created_at: string;
  id: string;
  partner_id: string | null;
  raw_response_sha256: string;
  requested_ust_idnr: string;
  verification_source: UstIdVerification["verification_source"];
  verification_status: UstIdVerification["verification_status"];
};

export type UvPayloadInput = Pick<
  UstIdVerification,
  | "id"
  | "partner_id"
  | "raw_http_response"
  | "requested_ust_idnr"
  | "verification_source"
  | "verification_status"
  | "created_at"
>;

/**
 * SHA-256 einer Base64-kodierten Byte-Sequenz. Entspricht DB-seitig
 * `encode(digest(bytea_field, 'sha256'), 'hex')`. Für `raw_http_response`
 * im Supabase-Modell — DEMO setzt das Feld null und liefert ''.
 */
export async function sha256HexOfBase64(b64: string): Promise<string> {
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  const subtle = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto
    ?.subtle;
  if (!subtle) {
    throw new Error(
      "crypto.subtle nicht verfügbar — Raw-Response-Hashing nicht möglich."
    );
  }
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildUvPayload(row: UvPayloadInput): Promise<UvPayload> {
  const rawSha =
    row.raw_http_response === null ||
    row.raw_http_response === undefined ||
    row.raw_http_response === ""
      ? ""
      : await sha256HexOfBase64(row.raw_http_response);
  return {
    created_at: formatUtcTimestamp(new Date(row.created_at)),
    id: row.id.toLowerCase(),
    partner_id: row.partner_id ? row.partner_id.toLowerCase() : null,
    raw_response_sha256: rawSha,
    requested_ust_idnr: row.requested_ust_idnr,
    verification_source: row.verification_source,
    verification_status: row.verification_status,
  };
}

// ---------------------------------------------------------------------------
// BPV-Chain (per partner_id, unabhängige Ketten innerhalb des Inputs)
// ---------------------------------------------------------------------------

export async function verifyBpvChain(
  versions: BusinessPartnerVersion[]
): Promise<ChainVerificationResult> {
  if (versions.length === 0) {
    return { valid: true, count: 0, brokenAt: null, reason: null };
  }

  let expectedPrev: string | null = null;
  let currentPartnerId: string | null = null;

  for (let i = 0; i < versions.length; i++) {
    const row = versions[i];

    // Neue Partner-Kette → Genesis-Reset
    if (row.partner_id !== currentPartnerId) {
      currentPartnerId = row.partner_id;
      expectedPrev = null;
    }

    const storedPrev = row.prev_hash ?? null;

    // Genesis-Check: erste Version pro Partner MUSS prev_hash=null haben
    if (expectedPrev === null && storedPrev !== null) {
      return {
        valid: false,
        count: versions.length,
        brokenAt: { index: i, id: row.version_id },
        reason: "genesis_non_null_prev",
      };
    }

    // Mid-Chain prev_hash muss zum letzten version_hash dieser Partner-Gruppe passen
    if (expectedPrev !== null && storedPrev !== expectedPrev) {
      return {
        valid: false,
        count: versions.length,
        brokenAt: { index: i, id: row.version_id },
        reason: "prev_hash_mismatch",
      };
    }

    const expectedHash = await computeChainHash(
      storedPrev,
      buildBpvPayload(row)
    );
    if (expectedHash !== row.version_hash) {
      return {
        valid: false,
        count: versions.length,
        brokenAt: { index: i, id: row.version_id },
        reason: "hash_mismatch",
      };
    }

    expectedPrev = row.version_hash ?? null;
  }

  return {
    valid: true,
    count: versions.length,
    brokenAt: null,
    reason: null,
  };
}

// ---------------------------------------------------------------------------
// UV-Chain (eine Kette pro client_id)
// ---------------------------------------------------------------------------

export async function verifyUvChain(
  verifications: UstIdVerification[]
): Promise<ChainVerificationResult> {
  if (verifications.length === 0) {
    return { valid: true, count: 0, brokenAt: null, reason: null };
  }

  let expectedPrev: string | null = null;

  for (let i = 0; i < verifications.length; i++) {
    const row = verifications[i];
    const storedPrev = row.prev_hash ?? null;

    // Genesis-Check: erste Row MUSS prev_hash=null haben
    if (expectedPrev === null && i === 0 && storedPrev !== null) {
      return {
        valid: false,
        count: verifications.length,
        brokenAt: { index: i, id: row.id },
        reason: "genesis_non_null_prev",
      };
    }

    if (storedPrev !== expectedPrev) {
      return {
        valid: false,
        count: verifications.length,
        brokenAt: { index: i, id: row.id },
        reason: "prev_hash_mismatch",
      };
    }

    const expectedHash = await computeChainHash(
      storedPrev,
      await buildUvPayload(row)
    );
    if (expectedHash !== row.verification_hash) {
      return {
        valid: false,
        count: verifications.length,
        brokenAt: { index: i, id: row.id },
        reason: "hash_mismatch",
      };
    }

    expectedPrev = row.verification_hash ?? null;
  }

  return {
    valid: true,
    count: verifications.length,
    brokenAt: null,
    reason: null,
  };
}
