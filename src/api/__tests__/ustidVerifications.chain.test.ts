// Sprint 20.B.6 · UV-Chain Integration-Tests (DEMO).

import { describe, it, expect, beforeEach } from "vitest";
import type { UstIdVerification } from "../../types/db";
import {
  logVerification,
  verifyUvChainForClient,
  type LogVerificationInput,
} from "../ustidVerifications";

const COMPANY = "co-chain-uv";
const CLIENT_A = "cl-a";
const CLIENT_B = "cl-b";

function baseInput(over: Partial<LogVerificationInput> = {}): LogVerificationInput {
  return {
    company_id: COMPANY,
    client_id: CLIENT_A,
    partner_id: null,
    requested_ust_idnr: "DE111222333",
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
    retention_hold: false,
    retention_hold_reason: null,
    created_by: null,
    ...over,
  };
}

function readUv(): UstIdVerification[] {
  const raw = localStorage.getItem("harouda-ustid-verifications");
  return raw ? (JSON.parse(raw) as UstIdVerification[]) : [];
}

function writeUv(v: UstIdVerification[]): void {
  localStorage.setItem("harouda-ustid-verifications", JSON.stringify(v));
}

async function sleep(ms = 2): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

beforeEach(() => {
  localStorage.clear();
});

describe("verifyUvChainForClient · DEMO", () => {
  it("#1 3 Verifications → valid + count=3", async () => {
    await logVerification(baseInput());
    await sleep();
    await logVerification(baseInput({ requested_ust_idnr: "DE222" }));
    await sleep();
    await logVerification(baseInput({ requested_ust_idnr: "DE333" }));
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(3);
  });

  it("#2 BZST + VIES gemischt → Kette bleibt valid", async () => {
    await logVerification(baseInput({ verification_source: "BZST" }));
    await sleep();
    await logVerification(
      baseInput({ verification_source: "VIES", requested_ust_idnr: "AT111" })
    );
    await sleep();
    await logVerification(baseInput({ verification_source: "BZST" }));
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(true);
    expect(r.count).toBe(3);
  });

  it("#3 Tamper verification_status → hash_mismatch", async () => {
    await logVerification(baseInput({ verification_status: "VALID" }));
    const rows = readUv();
    rows[0].verification_status = "INVALID";
    writeUv(rows);
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
  });

  it("#4 Tamper verification_source (BZST→VIES) → hash_mismatch (§ 18e UStG!)", async () => {
    await logVerification(baseInput({ verification_source: "BZST" }));
    const rows = readUv();
    rows[0].verification_source = "VIES";
    writeUv(rows);
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
  });

  it("#5 Zwei Clients → unabhängige Ketten, beide valid", async () => {
    await logVerification(baseInput({ client_id: CLIENT_A }));
    await sleep();
    await logVerification(baseInput({ client_id: CLIENT_B }));
    await sleep();
    await logVerification(baseInput({ client_id: CLIENT_A }));
    const a = await verifyUvChainForClient(CLIENT_A);
    const b = await verifyUvChainForClient(CLIENT_B);
    expect(a.valid).toBe(true);
    expect(a.count).toBe(2);
    expect(b.valid).toBe(true);
    expect(b.count).toBe(1);
  });

  it("#6 Genesis-Only → valid, prev_hash=null", async () => {
    await logVerification(baseInput());
    const rows = readUv();
    expect(rows[0].prev_hash).toBeNull();
    expect(rows[0].verification_hash).toMatch(/^[0-9a-f]{64}$/);
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(true);
  });

  it("#7 raw_http_response=null → raw_sha256='' im Payload, Kette valid", async () => {
    await logVerification(baseInput({ raw_http_response: null }));
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(true);
  });

  it("#8 raw_http_response geändert → hash_mismatch", async () => {
    // "AAAA" base64 = bytes [0,0,0]; "BBBB" base64 = bytes [4,16,65]
    await logVerification(baseInput({ raw_http_response: "AAAA" }));
    const rows = readUv();
    rows[0].raw_http_response = "BBBB";
    writeUv(rows);
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("hash_mismatch");
  });

  it("#9 server_recorded_at existiert + ist nicht Hash-relevant", async () => {
    await logVerification(baseInput());
    const rows = readUv();
    expect(rows[0].server_recorded_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Mutation → Kette bleibt valid
    rows[0].server_recorded_at = "2099-12-31T23:59:59.999Z";
    writeUv(rows);
    const r = await verifyUvChainForClient(CLIENT_A);
    expect(r.valid).toBe(true);
  });

  it("#10 Leerer Client → valid, count=0", async () => {
    const r = await verifyUvChainForClient("cl-empty");
    expect(r).toEqual({
      valid: true,
      count: 0,
      brokenAt: null,
      reason: null,
    });
  });
});
