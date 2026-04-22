// Sprint 20.A.2 · validate-ustid Persistenz (DEMO-Mode-Mock).
//
// Die reale Edge Function ist in Deno-Runtime geschrieben und im
// vitest-Harness nicht ausfuehrbar. Dieser Test verifiziert den
// DEMO-Pfad via ustIdRouter: DE-Requester → BZST → log-Row mit
// verification_source='BZST', korrektem URL, retention_until.

import { describe, it, expect, beforeEach } from "vitest";
import { routedVerifyUstIdnr } from "../ustIdRouter";
import { createBusinessPartner } from "../businessPartners";
import { getVerificationsForPartner } from "../ustidVerifications";

const COMPANY = "co-v";
const CLIENT = "cl-v";

beforeEach(() => {
  localStorage.clear();
});

async function seed(name: string, ustIdnr: string) {
  return createBusinessPartner({
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
  });
}

describe("validate-ustid · DEMO-Mock-Persistenz", () => {
  it("#1 DE→DE erzeugt Row mit verification_source='BZST'", async () => {
    const p = await seed("Kunde DE", "DE123456789");
    const v = await routedVerifyUstIdnr(p, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.verification_source).toBe("BZST");
  });

  it("#2 BZST-Row wird auch über getVerificationsForPartner gefunden", async () => {
    const p = await seed("Kunde DE", "DE123456789");
    await routedVerifyUstIdnr(p, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    const logs = await getVerificationsForPartner(p.id);
    expect(logs).toHaveLength(1);
    expect(logs[0].verification_source).toBe("BZST");
  });

  it("#3 raw_http_request_url reflektiert BZST-Demo-URL", async () => {
    const p = await seed("X", "DE123456789");
    const v = await routedVerifyUstIdnr(p, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(v.raw_http_request_url).toMatch(/bzst/i);
  });

  it("#4 retention_until = Jahr(created_at) + 10 Jahre, 12-31", async () => {
    const p = await seed("R", "DE123456789");
    const v = await routedVerifyUstIdnr(p, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    const y = new Date(v.created_at).getFullYear();
    expect(v.retention_until).toBe(`${y + 10}-12-31`);
  });

  it("#5 BZST- und VIES-Calls in derselben Partner-Historie koexistieren", async () => {
    const p = await seed("Bilateral", "DE123456789");
    // BZST-Call
    await routedVerifyUstIdnr(p, {
      requesterUstIdnr: "DE987654321",
      clientId: CLIENT,
      companyId: COMPANY,
    });
    // VIES-Call (kein requesterUstIdnr → Fallback VIES)
    await routedVerifyUstIdnr(p, {
      clientId: CLIENT,
      companyId: COMPANY,
    });
    const logs = await getVerificationsForPartner(p.id);
    expect(logs).toHaveLength(2);
    const sources = logs.map((l) => l.verification_source).sort();
    expect(sources).toEqual(["BZST", "VIES"]);
  });
});
