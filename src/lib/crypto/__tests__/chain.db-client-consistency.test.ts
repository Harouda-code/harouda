// Sprint 20.B.6 · Client-Seitige Chain-Consistency-Fixtures.
//
// Zweck:
//   Byte-genauer Freeze-Test des Payload-Contracts, der in Migration 0039
//   (canonical_json_bpv / canonical_json_uv) und in hashChainVerifier.ts
//   (buildBpvPayload / buildUvPayload) identisch sein MUSS.
//
//   Jedes Fixture prüft:
//     1. `canonicalJson(input)` liefert byte-genau den erwarteten String.
//     2. `computeChainHash(prev, input)` liefert den aus dem erwarteten
//        String abgeleiteten SHA-256-Hex.
//
//   Wenn ein Test fehlschlägt, ist entweder canonicalJson oder
//   sha256Hex auf der Client-Seite driftet. In beiden Fällen die
//   Chain-Infrastruktur NICHT produktiv einsetzen.
//
// --- DB-Seitige Verifikation (manuell auf Staging-DB auszuführen) ---
//
//   Die folgenden SQL-Snippets MÜSSEN byte-identische Outputs zu den
//   EXPECTED_CANONICAL_*-Konstanten unten erzeugen. Ein Outputs-Drift
//   bedeutet, dass Client- und DB-Canonicalization aus dem Sync gelaufen
//   sind. Vor erstem Production-Deploy von Sprint 20.B DEPLOY BLOCKEN,
//   bis die SQL-Outputs exakt mit den Fixture-Strings übereinstimmen.
//
//   -- Fixture 1: BPV Genesis
//   SELECT public.canonical_json_bpv(
//     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
//     1,
//     '{"k":"v"}'::jsonb,
//     '2025-01-01T00:00:00Z'::timestamptz,
//     'ORGANISATIONSUNTERLAGE_10J'
//   );
//
//   -- Fixture 2: BPV with prev
//   SELECT public.compute_bpv_hash(
//     '1111111111111111111111111111111111111111111111111111111111111111',
//     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
//     2,
//     '{"name":"Müller"}'::jsonb,
//     '2025-06-01T12:00:00Z'::timestamptz,
//     'ORGANISATIONSUNTERLAGE_10J'
//   );
//
//   -- Fixture 3: BPV Unicode
//   SELECT public.canonical_json_bpv(
//     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
//     1,
//     '{"name":"Müller & Söhne 🛡️","plz":null}'::jsonb,
//     '2026-04-22T10:15:30Z'::timestamptz,
//     'GESCHAEFTSBRIEF_6J'
//   );
//
//   -- Fixture 4: UV null partner
//   SELECT public.canonical_json_uv(
//     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
//     NULL,
//     'DE123456789',
//     '',
//     'VALID',
//     'BZST',
//     '2026-01-01T10:15:30Z'::timestamptz
//   );
//
//   -- Fixture 5: UV with raw (sha256 von [0x00,0x00,0x00] vorher lokal
//   -- berechnen; dann als p_raw_response_sha256 einsetzen).

import { describe, it, expect, beforeAll } from "vitest";
import {
  GENESIS_HASH,
  canonicalJson,
  computeChainHash,
  sha256Hex,
} from "../sha256Canonical";
import { sha256HexOfBase64 } from "../../../domain/gobd/hashChainVerifier";

/**
 * Ground-Truth-Hash aus der erwarteten canonical-String ableiten.
 * Kein Rückgriff auf computeChainHash selbst — hier wird sha256Hex
 * direkt mit dem hardcoded canonical-String gefüttert, sodass die
 * beiden Seiten (canonical-Build, Hash-Kette) unabhängig prüfbar sind.
 */
async function expectedChainHash(
  prev: string | null,
  canonical: string
): Promise<string> {
  const prevPart = prev ?? GENESIS_HASH;
  return sha256Hex(prevPart + "|" + canonical);
}

// ---------------------------------------------------------------------------
// Fixture 1 — BPV Genesis, simpler snapshot
// ---------------------------------------------------------------------------

const FIXTURE_1_CANONICAL =
  '{"aufbewahrungs_kategorie":"ORGANISATIONSUNTERLAGE_10J",' +
  '"partner_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",' +
  '"snapshot":{"k":"v"},' +
  '"valid_from":"2025-01-01T00:00:00.000000Z",' +
  '"version_number":1}';

// ---------------------------------------------------------------------------
// Fixture 2 — BPV mit prev_hash (version 2)
// ---------------------------------------------------------------------------

const FIXTURE_2_PREV = "1".repeat(64);
const FIXTURE_2_CANONICAL =
  '{"aufbewahrungs_kategorie":"ORGANISATIONSUNTERLAGE_10J",' +
  '"partner_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",' +
  '"snapshot":{"name":"Müller"},' +
  '"valid_from":"2025-06-01T12:00:00.000000Z",' +
  '"version_number":2}';

// ---------------------------------------------------------------------------
// Fixture 3 — BPV Unicode (Umlaute + Emoji + null-Feld in Nested)
// ---------------------------------------------------------------------------

const FIXTURE_3_CANONICAL =
  '{"aufbewahrungs_kategorie":"GESCHAEFTSBRIEF_6J",' +
  '"partner_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",' +
  '"snapshot":{"name":"Müller & Söhne 🛡️","plz":null},' +
  '"valid_from":"2026-04-22T10:15:30.000000Z",' +
  '"version_number":1}';

// ---------------------------------------------------------------------------
// Fixture 4 — UV mit null partner_id, ohne raw_http_response
// ---------------------------------------------------------------------------

const FIXTURE_4_CANONICAL =
  '{"created_at":"2026-01-01T10:15:30.000000Z",' +
  '"id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",' +
  '"partner_id":null,' +
  '"raw_response_sha256":"",' +
  '"requested_ust_idnr":"DE123456789",' +
  '"verification_source":"BZST",' +
  '"verification_status":"VALID"}';

// ---------------------------------------------------------------------------
// Fixture 5 — UV BZST mit raw_http_response
// ---------------------------------------------------------------------------
//
// raw_http_response = "AAAA" (Base64) = Bytes [0x00, 0x00, 0x00].
// raw_response_sha256 = SHA-256([0x00, 0x00, 0x00]) — per sha256HexOfBase64
// beim Test-Setup berechnet und in den erwarteten canonical-String
// eingesetzt. Damit ist das Fixture unabhängig davon, dass der Wert der
// SHA-256 von drei Nullbytes konstant ist (er ist es, aber das müssen wir
// nicht im Test-Literal hardcoden).
//
// Ground-Truth-Teil: SHA-256 der drei Nullbytes ist laut NIST
// 709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c.

let FIXTURE_5_CANONICAL = "";
let FIXTURE_5_RAW_SHA = "";

beforeAll(async () => {
  FIXTURE_5_RAW_SHA = await sha256HexOfBase64("AAAA");
  FIXTURE_5_CANONICAL =
    '{"created_at":"2026-02-14T08:30:45.000000Z",' +
    '"id":"cccccccc-cccc-cccc-cccc-cccccccccccc",' +
    '"partner_id":"dddddddd-dddd-dddd-dddd-dddddddddddd",' +
    '"raw_response_sha256":"' +
    FIXTURE_5_RAW_SHA +
    '",' +
    '"requested_ust_idnr":"ATU12345678",' +
    '"verification_source":"VIES",' +
    '"verification_status":"VALID"}';
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Chain Consistency · Fixed Fixtures (Client-Side-Freeze)", () => {
  it("#1 Fixture 1 (BPV Genesis) — canonicalJson + Hash konsistent", async () => {
    const input = {
      aufbewahrungs_kategorie: "ORGANISATIONSUNTERLAGE_10J",
      partner_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      snapshot: { k: "v" },
      valid_from: "2025-01-01T00:00:00.000000Z",
      version_number: 1,
    };
    expect(canonicalJson(input)).toBe(FIXTURE_1_CANONICAL);
    const expectedHash = await expectedChainHash(null, FIXTURE_1_CANONICAL);
    const actualHash = await computeChainHash(null, input);
    expect(actualHash).toBe(expectedHash);
  });

  it("#2 Fixture 2 (BPV mit prev_hash) — Chain Kontinuität", async () => {
    const input = {
      aufbewahrungs_kategorie: "ORGANISATIONSUNTERLAGE_10J",
      partner_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      snapshot: { name: "Müller" },
      valid_from: "2025-06-01T12:00:00.000000Z",
      version_number: 2,
    };
    expect(canonicalJson(input)).toBe(FIXTURE_2_CANONICAL);
    const expectedHash = await expectedChainHash(
      FIXTURE_2_PREV,
      FIXTURE_2_CANONICAL
    );
    const actualHash = await computeChainHash(FIXTURE_2_PREV, input);
    expect(actualHash).toBe(expectedHash);
  });

  it("#3 Fixture 3 (Unicode snapshot + null-Nested) — canonicalJson korrekt", async () => {
    const input = {
      aufbewahrungs_kategorie: "GESCHAEFTSBRIEF_6J",
      partner_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      snapshot: { name: "Müller & Söhne 🛡️", plz: null },
      valid_from: "2026-04-22T10:15:30.000000Z",
      version_number: 1,
    };
    expect(canonicalJson(input)).toBe(FIXTURE_3_CANONICAL);
    const expectedHash = await expectedChainHash(null, FIXTURE_3_CANONICAL);
    const actualHash = await computeChainHash(null, input);
    expect(actualHash).toBe(expectedHash);
  });

  it("#4 Fixture 4 (UV mit null partner_id, leere raw) — canonical korrekt", async () => {
    const input = {
      created_at: "2026-01-01T10:15:30.000000Z",
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      partner_id: null,
      raw_response_sha256: "",
      requested_ust_idnr: "DE123456789",
      verification_source: "BZST",
      verification_status: "VALID",
    };
    expect(canonicalJson(input)).toBe(FIXTURE_4_CANONICAL);
    const expectedHash = await expectedChainHash(null, FIXTURE_4_CANONICAL);
    const actualHash = await computeChainHash(null, input);
    expect(actualHash).toBe(expectedHash);
  });

  it("#5 Fixture 5 (UV mit raw_http_response) — sha256 von Base64-Bytes korrekt", async () => {
    // raw_response_sha256 wird aus den drei Null-Bytes (atob('AAAA')) abgeleitet.
    // Ground Truth SHA-256 von [0x00,0x00,0x00] = 709e80c884...
    expect(FIXTURE_5_RAW_SHA).toBe(
      "709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c"
    );
    const input = {
      created_at: "2026-02-14T08:30:45.000000Z",
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      partner_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      raw_response_sha256: FIXTURE_5_RAW_SHA,
      requested_ust_idnr: "ATU12345678",
      verification_source: "VIES",
      verification_status: "VALID",
    };
    expect(canonicalJson(input)).toBe(FIXTURE_5_CANONICAL);
    const expectedHash = await expectedChainHash(null, FIXTURE_5_CANONICAL);
    const actualHash = await computeChainHash(null, input);
    expect(actualHash).toBe(expectedHash);
  });
});
