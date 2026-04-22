// Sprint 19.A · ustidVerifications-Service-Tests (DEMO-Mode).

import { describe, it, expect, beforeEach } from "vitest";
import {
  getLatestVerification,
  getVerificationsForPartner,
  logVerification,
} from "../ustidVerifications";

const COMPANY = "company-1";
const CLIENT = "client-1";

beforeEach(() => {
  localStorage.clear();
});

type BaseFields = Parameters<typeof logVerification>[0];

function base(over: Partial<BaseFields> = {}): BaseFields {
  return {
    company_id: COMPANY,
    client_id: CLIENT,
    partner_id: null,
    requested_ust_idnr: "DE123456789",
    requester_ust_idnr: null,
    raw_http_response: null,
    raw_http_response_headers: null,
    raw_http_request_url: "https://example.invalid/vies",
    vies_valid: null,
    vies_request_date: null,
    vies_request_identifier: null,
    vies_trader_name: null,
    vies_trader_address: null,
    vies_raw_parsed: null,
    verification_status: "VALID",
    error_message: null,
    retention_hold: false,
    retention_hold_reason: null,
    created_by: null,
    ...over,
  };
}

describe("ustidVerifications · logVerification", () => {
  it("#1 berechnet retention_until = Jahr(created_at)+10-12-31", async () => {
    const v = await logVerification(base());
    const y = new Date(v.created_at).getFullYear();
    expect(v.retention_until).toBe(`${y + 10}-12-31`);
  });

  it("#2 setzt entstehungsjahr = Jahr(created_at)", async () => {
    const v = await logVerification(base());
    expect(v.entstehungsjahr).toBe(new Date(v.created_at).getFullYear());
  });

  it("#3 persistiert verification_status und raw_http_request_url", async () => {
    const v = await logVerification(
      base({
        verification_status: "SERVICE_UNAVAILABLE",
        raw_http_request_url: "https://ec.europa.eu/vies/x",
      })
    );
    expect(v.verification_status).toBe("SERVICE_UNAVAILABLE");
    expect(v.raw_http_request_url).toBe("https://ec.europa.eu/vies/x");
  });

  it("#4 akzeptiert optionales partner_id", async () => {
    const v = await logVerification(base({ partner_id: "partner-42" }));
    expect(v.partner_id).toBe("partner-42");
  });
});

describe("ustidVerifications · Reads", () => {
  it("#5 getVerificationsForPartner filtert nach partner_id", async () => {
    await logVerification(base({ partner_id: "P1" }));
    await logVerification(base({ partner_id: "P2" }));
    await logVerification(base({ partner_id: "P1" }));
    const list = await getVerificationsForPartner("P1");
    expect(list).toHaveLength(2);
  });

  it("#6 getVerificationsForPartner sortiert neueste zuerst", async () => {
    const a = await logVerification(base({ partner_id: "X" }));
    await new Promise((r) => setTimeout(r, 5));
    const b = await logVerification(base({ partner_id: "X" }));
    const list = await getVerificationsForPartner("X");
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });

  it("#7 getLatestVerification findet neueste ueber (client_id, ust_idnr)", async () => {
    await logVerification(
      base({ requested_ust_idnr: "DE111", verification_status: "INVALID" })
    );
    await new Promise((r) => setTimeout(r, 5));
    await logVerification(
      base({ requested_ust_idnr: "DE111", verification_status: "VALID" })
    );
    const latest = await getLatestVerification(CLIENT, "DE111");
    expect(latest).not.toBeNull();
    expect(latest!.verification_status).toBe("VALID");
  });

  it("#8 getLatestVerification liefert null wenn nicht gefunden", async () => {
    const miss = await getLatestVerification(CLIENT, "DE000");
    expect(miss).toBeNull();
  });

  it("#9 getLatestVerification isoliert pro client_id", async () => {
    await logVerification(
      base({ client_id: "client-A", requested_ust_idnr: "DE222" })
    );
    const otherClient = await getLatestVerification("client-B", "DE222");
    expect(otherClient).toBeNull();
  });
});
