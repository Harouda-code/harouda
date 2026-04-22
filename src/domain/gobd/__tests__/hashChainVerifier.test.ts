// Sprint 20.B.3 · hashChainVerifier Tests
//
// Strategie: Fixtures werden mit dem Live-sha256Canonical-Helper gebaut
// ("valide-by-construction"). Dadurch verifizieren diese Tests die
// Verifier-LOGIK (Iteration, Reset pro partner_id, Reason-Dispatch,
// Tamper-Detection). Die BYTE-Identität mit der DB wird separat in
// Schritt 20.B.6 (chain.db-client-consistency.test.ts) verifiziert.

import { describe, it, expect } from "vitest";
import {
  verifyBpvChain,
  verifyUvChain,
} from "../hashChainVerifier";
import {
  computeChainHash,
  formatUtcTimestamp,
} from "../../../lib/crypto/sha256Canonical";
import type {
  BusinessPartner,
  BusinessPartnerVersion,
  UstIdVerification,
} from "../../../types/db";

// ---------------------------------------------------------------------------
// Fixture-Builder
// ---------------------------------------------------------------------------

const SNAPSHOT_STUB: BusinessPartner = {
  id: "bp-stub",
  company_id: "co-1",
  client_id: "cl-1",
  partner_type: "debitor",
  debitor_nummer: 10000,
  kreditor_nummer: null,
  name: "Stub GmbH",
  legal_name: null,
  rechtsform: null,
  ust_idnr: null,
  steuernummer: null,
  finanzamt: null,
  hrb: null,
  registergericht: null,
  anschrift_strasse: null,
  anschrift_hausnummer: null,
  anschrift_plz: null,
  anschrift_ort: null,
  anschrift_land_iso: "DE",
  email: null,
  telefon: null,
  iban: null,
  bic: null,
  is_public_authority: false,
  leitweg_id: null,
  preferred_invoice_format: "pdf",
  peppol_id: null,
  verrechnungs_partner_id: null,
  zahlungsziel_tage: null,
  skonto_prozent: null,
  skonto_tage: null,
  standard_erloeskonto: null,
  standard_aufwandskonto: null,
  is_active: true,
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
  created_by: null,
  updated_at: "2026-01-01T00:00:00Z",
  updated_by: null,
};

async function makeBpv(
  overrides: Partial<BusinessPartnerVersion> & {
    version_id: string;
    partner_id: string;
    version_number: number;
    valid_from: string;
  },
  prevHash: string | null
): Promise<BusinessPartnerVersion> {
  const base: BusinessPartnerVersion = {
    version_id: overrides.version_id,
    partner_id: overrides.partner_id,
    company_id: "co-test",
    client_id: "cl-test",
    version_number: overrides.version_number,
    snapshot: { ...SNAPSHOT_STUB, id: overrides.partner_id, name: "v1" },
    aufbewahrungs_kategorie: "ORGANISATIONSUNTERLAGE_10J",
    entstehungsjahr: 2026,
    retention_until: "2036-12-31",
    retention_hold: false,
    retention_hold_reason: null,
    valid_from: overrides.valid_from,
    valid_to: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
  };
  const row: BusinessPartnerVersion = { ...base, ...overrides };
  const payload = {
    aufbewahrungs_kategorie: row.aufbewahrungs_kategorie,
    partner_id: row.partner_id.toLowerCase(),
    snapshot: row.snapshot,
    valid_from: formatUtcTimestamp(new Date(row.valid_from)),
    version_number: row.version_number,
  };
  const version_hash = await computeChainHash(prevHash, payload);
  return { ...row, prev_hash: prevHash, version_hash };
}

async function makeUv(
  overrides: Partial<UstIdVerification> & {
    id: string;
    created_at: string;
    requested_ust_idnr: string;
  },
  prevHash: string | null
): Promise<UstIdVerification> {
  const base: UstIdVerification = {
    id: overrides.id,
    company_id: "co-test",
    client_id: "cl-test",
    partner_id: null,
    requested_ust_idnr: overrides.requested_ust_idnr,
    requester_ust_idnr: null,
    raw_http_response: null,
    raw_http_response_headers: null,
    raw_http_request_url: "demo://test",
    vies_valid: null,
    vies_request_date: null,
    vies_request_identifier: null,
    vies_trader_name: null,
    vies_trader_address: null,
    vies_raw_parsed: null,
    verification_status: "VALID",
    verification_source: "VIES",
    error_message: null,
    entstehungsjahr: 2026,
    retention_until: "2036-12-31",
    retention_hold: false,
    retention_hold_reason: null,
    created_at: overrides.created_at,
    created_by: null,
  };
  const row: UstIdVerification = { ...base, ...overrides };
  const payload = {
    created_at: formatUtcTimestamp(new Date(row.created_at)),
    id: row.id.toLowerCase(),
    partner_id: row.partner_id ? row.partner_id.toLowerCase() : null,
    raw_response_sha256: "",
    requested_ust_idnr: row.requested_ust_idnr,
    verification_source: row.verification_source,
    verification_status: row.verification_status,
  };
  const verification_hash = await computeChainHash(prevHash, payload);
  return { ...row, prev_hash: prevHash, verification_hash };
}

// ---------------------------------------------------------------------------
// BPV Tests
// ---------------------------------------------------------------------------

describe("verifyBpvChain · Grundlagen", () => {
  it("#1 leerer Array → valid:true, count:0", async () => {
    const r = await verifyBpvChain([]);
    expect(r).toEqual({ valid: true, count: 0, brokenAt: null, reason: null });
  });

  it("#2 Single Genesis (prev=null) → valid", async () => {
    const v1 = await makeBpv(
      {
        version_id: "v-1",
        partner_id: "p-a",
        version_number: 1,
        valid_from: "2026-01-01T00:00:00.000Z",
      },
      null
    );
    const r = await verifyBpvChain([v1]);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(1);
  });

  it("#3 3-Ketten-BPV verifiziert sauber", async () => {
    const v1 = await makeBpv(
      { version_id: "v-1", partner_id: "p-a", version_number: 1, valid_from: "2026-01-01T00:00:00.000Z" },
      null
    );
    const v2 = await makeBpv(
      { version_id: "v-2", partner_id: "p-a", version_number: 2, valid_from: "2026-02-01T00:00:00.000Z" },
      v1.version_hash!
    );
    const v3 = await makeBpv(
      { version_id: "v-3", partner_id: "p-a", version_number: 3, valid_from: "2026-03-01T00:00:00.000Z" },
      v2.version_hash!
    );
    const r = await verifyBpvChain([v1, v2, v3]);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(3);
  });

  it("#4 Tampered snapshot in Mitte → brokenAt.index=1, reason=hash_mismatch", async () => {
    const v1 = await makeBpv(
      { version_id: "v-1", partner_id: "p-a", version_number: 1, valid_from: "2026-01-01T00:00:00.000Z" },
      null
    );
    const v2Valid = await makeBpv(
      { version_id: "v-2", partner_id: "p-a", version_number: 2, valid_from: "2026-02-01T00:00:00.000Z" },
      v1.version_hash!
    );
    // Mutate snapshot NACH hash-berechnung
    const v2Tampered: BusinessPartnerVersion = {
      ...v2Valid,
      snapshot: { ...v2Valid.snapshot, name: "Hacked" },
    };
    const r = await verifyBpvChain([v1, v2Tampered]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
    expect(r.brokenAt).toEqual({ index: 1, id: "v-2" });
  });

  it("#5 Falscher prev_hash mid-chain → reason=prev_hash_mismatch", async () => {
    const v1 = await makeBpv(
      { version_id: "v-1", partner_id: "p-a", version_number: 1, valid_from: "2026-01-01T00:00:00.000Z" },
      null
    );
    const v2Valid = await makeBpv(
      { version_id: "v-2", partner_id: "p-a", version_number: 2, valid_from: "2026-02-01T00:00:00.000Z" },
      v1.version_hash!
    );
    const v2Broken: BusinessPartnerVersion = {
      ...v2Valid,
      prev_hash: "f".repeat(64),
    };
    const r = await verifyBpvChain([v1, v2Broken]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("prev_hash_mismatch");
    expect(r.brokenAt?.index).toBe(1);
  });

  it("#6 Genesis mit non-null prev_hash → reason=genesis_non_null_prev", async () => {
    const v1 = await makeBpv(
      { version_id: "v-1", partner_id: "p-a", version_number: 1, valid_from: "2026-01-01T00:00:00.000Z" },
      null
    );
    const v1Broken: BusinessPartnerVersion = {
      ...v1,
      prev_hash: "f".repeat(64),
    };
    const r = await verifyBpvChain([v1Broken]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("genesis_non_null_prev");
    expect(r.brokenAt?.index).toBe(0);
  });

  it("#7 Zwei partner_ids parallel — beide Ketten unabhängig", async () => {
    const a1 = await makeBpv(
      { version_id: "va-1", partner_id: "p-a", version_number: 1, valid_from: "2026-01-01T00:00:00.000Z" },
      null
    );
    const a2 = await makeBpv(
      { version_id: "va-2", partner_id: "p-a", version_number: 2, valid_from: "2026-02-01T00:00:00.000Z" },
      a1.version_hash!
    );
    const b1 = await makeBpv(
      { version_id: "vb-1", partner_id: "p-b", version_number: 1, valid_from: "2026-01-15T00:00:00.000Z" },
      null
    );
    const b2 = await makeBpv(
      { version_id: "vb-2", partner_id: "p-b", version_number: 2, valid_from: "2026-02-15T00:00:00.000Z" },
      b1.version_hash!
    );
    // Sorted by (partner_id, version_number)
    const r = await verifyBpvChain([a1, a2, b1, b2]);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(4);
  });

  it("#8 Snapshot mit Unicode/Umlauten/Emoji → valide", async () => {
    const v1 = await makeBpv(
      {
        version_id: "v-1",
        partner_id: "p-u",
        version_number: 1,
        valid_from: "2026-01-01T00:00:00.000Z",
        snapshot: { ...SNAPSHOT_STUB, name: "Müller 🛡️ & Söhne" },
      },
      null
    );
    const r = await verifyBpvChain([v1]);
    expect(r.valid).toBe(true);
  });

  it("#9 Snapshot mit null-Werten in Nested-Objekten → valide", async () => {
    const v1 = await makeBpv(
      {
        version_id: "v-1",
        partner_id: "p-n",
        version_number: 1,
        valid_from: "2026-01-01T00:00:00.000Z",
        snapshot: { ...SNAPSHOT_STUB, legal_name: null, anschrift_plz: null },
      },
      null
    );
    const r = await verifyBpvChain([v1]);
    expect(r.valid).toBe(true);
  });

  it("#10 Valid Chain bleibt valid trotz nachträglicher server_recorded_at-Mutation", async () => {
    // server_recorded_at ist nicht Teil des Hashes (Spec 20.B.3-Kopf).
    const v1 = await makeBpv(
      { version_id: "v-1", partner_id: "p-a", version_number: 1, valid_from: "2026-01-01T00:00:00.000Z" },
      null
    );
    const v1WithTs: BusinessPartnerVersion = {
      ...v1,
      server_recorded_at: "2099-12-31T23:59:59.999000Z",
    };
    const r = await verifyBpvChain([v1WithTs]);
    expect(r.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UV Tests
// ---------------------------------------------------------------------------

describe("verifyUvChain · Grundlagen", () => {
  it("#11 leerer Array → valid:true, count:0", async () => {
    const r = await verifyUvChain([]);
    expect(r).toEqual({ valid: true, count: 0, brokenAt: null, reason: null });
  });

  it("#12 3-UV-Kette Genesis + 2 Successors → valide", async () => {
    const u1 = await makeUv(
      {
        id: "u-1",
        created_at: "2026-01-01T10:00:00.000Z",
        requested_ust_idnr: "DE111",
      },
      null
    );
    const u2 = await makeUv(
      {
        id: "u-2",
        created_at: "2026-01-01T11:00:00.000Z",
        requested_ust_idnr: "DE222",
      },
      u1.verification_hash!
    );
    const u3 = await makeUv(
      {
        id: "u-3",
        created_at: "2026-01-01T12:00:00.000Z",
        requested_ust_idnr: "DE333",
      },
      u2.verification_hash!
    );
    const r = await verifyUvChain([u1, u2, u3]);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(3);
  });

  it("#13 Tampered verification_status → reason=hash_mismatch", async () => {
    const u1 = await makeUv(
      { id: "u-1", created_at: "2026-01-01T10:00:00.000Z", requested_ust_idnr: "DE1" },
      null
    );
    const u1Tampered: UstIdVerification = { ...u1, verification_status: "INVALID" };
    const r = await verifyUvChain([u1Tampered]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
  });

  it("#14 Tampered verification_source (BZST→VIES) → hash_mismatch (!!! rechtskritisch)", async () => {
    const u1 = await makeUv(
      {
        id: "u-1",
        created_at: "2026-01-01T10:00:00.000Z",
        requested_ust_idnr: "DE1",
        verification_source: "BZST",
      },
      null
    );
    const u1Tampered: UstIdVerification = { ...u1, verification_source: "VIES" };
    const r = await verifyUvChain([u1Tampered]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
  });

  it("#15 Null partner_id im Payload → valide", async () => {
    const u1 = await makeUv(
      {
        id: "u-1",
        created_at: "2026-01-01T10:00:00.000Z",
        requested_ust_idnr: "DE1",
        partner_id: null,
      },
      null
    );
    const r = await verifyUvChain([u1]);
    expect(r.valid).toBe(true);
  });

  it("#16 raw_http_response=null → raw_sha256='' im Payload → valide", async () => {
    const u1 = await makeUv(
      {
        id: "u-1",
        created_at: "2026-01-01T10:00:00.000Z",
        requested_ust_idnr: "DE1",
        raw_http_response: null,
      },
      null
    );
    const r = await verifyUvChain([u1]);
    expect(r.valid).toBe(true);
  });

  it("#17 BZST + VIES gemischt → Chain bleibt valide (Source im Hash)", async () => {
    const u1 = await makeUv(
      {
        id: "u-1",
        created_at: "2026-01-01T10:00:00.000Z",
        requested_ust_idnr: "DE1",
        verification_source: "BZST",
      },
      null
    );
    const u2 = await makeUv(
      {
        id: "u-2",
        created_at: "2026-01-01T11:00:00.000Z",
        requested_ust_idnr: "AT1",
        verification_source: "VIES",
      },
      u1.verification_hash!
    );
    const u3 = await makeUv(
      {
        id: "u-3",
        created_at: "2026-01-01T12:00:00.000Z",
        requested_ust_idnr: "FR1",
        verification_source: "BZST",
      },
      u2.verification_hash!
    );
    const r = await verifyUvChain([u1, u2, u3]);
    expect(r.valid).toBe(true);
  });

  it("#18 Genesis mit non-null prev_hash → reason=genesis_non_null_prev", async () => {
    const u1 = await makeUv(
      { id: "u-1", created_at: "2026-01-01T10:00:00.000Z", requested_ust_idnr: "DE1" },
      null
    );
    const u1Broken: UstIdVerification = { ...u1, prev_hash: "a".repeat(64) };
    const r = await verifyUvChain([u1Broken]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("genesis_non_null_prev");
  });

  it("#19 Falsch verkettetes Mittelglied → prev_hash_mismatch", async () => {
    const u1 = await makeUv(
      { id: "u-1", created_at: "2026-01-01T10:00:00.000Z", requested_ust_idnr: "DE1" },
      null
    );
    const u2 = await makeUv(
      { id: "u-2", created_at: "2026-01-01T11:00:00.000Z", requested_ust_idnr: "DE2" },
      u1.verification_hash!
    );
    const u2Broken: UstIdVerification = { ...u2, prev_hash: "0".repeat(64) };
    const r = await verifyUvChain([u1, u2Broken]);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("prev_hash_mismatch");
    expect(r.brokenAt?.index).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeChainHash Determinismus (Support-Sanity)
// ---------------------------------------------------------------------------

describe("computeChainHash · Determinismus", () => {
  it("#20 identischer Input → 3× identischer Hash", async () => {
    const payload = { a: 1, b: [2, 3], c: null };
    const h1 = await computeChainHash("prev-x", payload);
    const h2 = await computeChainHash("prev-x", payload);
    const h3 = await computeChainHash("prev-x", payload);
    expect(h1).toBe(h2);
    expect(h2).toBe(h3);
  });
});
