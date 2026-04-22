// Sprint 20.A.2 · ustIdRouter-Tests (DEMO-Mode, Routing-Entscheidung + Persistenz).

import { describe, it, expect, beforeEach } from "vitest";
import type { BusinessPartner } from "../../types/db";
import { decideRoute, routedVerifyUstIdnr } from "../ustIdRouter";
import { createBusinessPartner } from "../businessPartners";
import { getLatestVerification } from "../ustidVerifications";

const COMPANY = "co-router";
const CLIENT = "cl-router";

beforeEach(() => {
  localStorage.clear();
});

async function seedDebitor(
  name: string,
  ustIdnr: string
): Promise<BusinessPartner> {
  return await createBusinessPartner({
    company_id: COMPANY,
    client_id: CLIENT,
    partner_type: "debitor",
    name,
    legal_name: null,
    rechtsform: null,
    ust_idnr: ustIdnr,
    steuernummer: null,
    finanzamt: null,
    hrb: null,
    registergericht: null,
    anschrift_strasse: "Str. 1",
    anschrift_hausnummer: null,
    anschrift_plz: "10115",
    anschrift_ort: "Berlin",
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
  });
}

describe("decideRoute · Entscheidungstabelle", () => {
  it("#1 Kein Requester → VIES-Fallback", () => {
    const r = decideRoute("DE123456789", null);
    expect(r.route).toBe("VIES");
    expect(r.reason).toMatch(/Keine Requester/);
  });

  it("#2 Leerer Requester-String → VIES", () => {
    const r = decideRoute("DE123456789", "");
    expect(r.route).toBe("VIES");
  });

  it("#3 DE-Requester + DE-Target → BZST", () => {
    const r = decideRoute("DE987654321", "DE123456789");
    expect(r.route).toBe("BZST");
  });

  it("#4 DE-Requester + AT-Target → BZST (qualifizierte intra-EU)", () => {
    const r = decideRoute("ATU12345678", "DE123456789");
    expect(r.route).toBe("BZST");
    expect(r.reason).toMatch(/BZSt/);
  });

  it("#5 DE-Requester + FR-Target → BZST", () => {
    const r = decideRoute("FRXX123456789", "DE123456789");
    expect(r.route).toBe("BZST");
  });

  it("#6 AT-Requester + DE-Target → VIES (Requester nicht DE)", () => {
    const r = decideRoute("DE123456789", "ATU12345678");
    expect(r.route).toBe("VIES");
  });

  it("#7 Invalid Requester-Format → VIES (country unknown)", () => {
    const r = decideRoute("DE123456789", "not-a-valid-ustid");
    expect(r.route).toBe("VIES");
  });
});

describe("routedVerifyUstIdnr · DEMO Persistenz", () => {
  it("#8 DE→DE: Log mit verification_source='BZST'", async () => {
    const partner = await seedDebitor("German Customer", "DE123456789");
    const v = await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.verification_source).toBe("BZST");
    expect(v.verification_status).toBe("VALID");
    // localStorage-Eintrag enthält source=BZST
    const latest = await getLatestVerification(CLIENT, "DE123456789");
    expect(latest?.verification_source).toBe("BZST");
    expect(latest?.raw_http_request_url).toContain("bzst");
  });

  it("#9 AT→DE: Log mit verification_source='VIES'", async () => {
    const partner = await seedDebitor("DE Customer", "DE123456789");
    const v = await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "ATU12345678",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.verification_source).toBe("VIES");
    expect(v.raw_http_request_url).toContain("vies");
  });

  it("#10 Kein Requester: Log mit VIES-Fallback", async () => {
    const partner = await seedDebitor("X", "DE123456789");
    const v = await routedVerifyUstIdnr(partner, {
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.verification_source).toBe("VIES");
  });

  it("#11 DE→DE mit ungültigem Format → INVALID + source=BZST", async () => {
    const partner = await seedDebitor("Bad", "DE12");
    const v = await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.verification_status).toBe("INVALID");
    expect(v.verification_source).toBe("BZST");
  });

  it("#12 Partner ohne USt-IdNr → throw", async () => {
    const partner = await seedDebitor("NoId", "");
    // Patch: seedDebitor hat fixen UstIdnr, clear via direct mutate
    partner.ust_idnr = null;
    await expect(
      routedVerifyUstIdnr(partner, {
        clientId: CLIENT,
        companyId: COMPANY,
      })
    ).rejects.toThrow(/keine USt-IdNr/);
  });

  it("#13 Mehrere Calls erzeugen mehrere Log-Rows (keine Deduplizierung)", async () => {
    const partner = await seedDebitor("X", "DE123456789");
    await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    const raw = JSON.parse(
      localStorage.getItem("harouda-ustid-verifications") ?? "[]"
    );
    expect(raw.length).toBe(2);
  });

  it("#14 retention_until = Jahr(created_at)+10-12-31", async () => {
    const partner = await seedDebitor("X", "DE123456789");
    const v = await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    const y = new Date(v.created_at).getFullYear();
    expect(v.retention_until).toBe(`${y + 10}-12-31`);
  });

  it("#15 BZST-Mock setzt vies_valid=null (BZSt-Daten landen in vies_raw_parsed)", async () => {
    const partner = await seedDebitor("X", "DE123456789");
    const v = await routedVerifyUstIdnr(partner, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.vies_valid).toBeNull();
    expect(v.vies_raw_parsed).toMatchObject({ demo: true, source: "BZST" });
  });
});
