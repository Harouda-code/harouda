// Sprint 19.B · Service-Tests fuer Duplicate-Block + VIES-DEMO-Branch.

import { describe, it, expect, beforeEach } from "vitest";
import type { BusinessPartner } from "../../types/db";
import {
  checkDuplicatesForInput,
  createBusinessPartner,
  DuplicatePartnerError,
  verifyUstIdnrForPartner,
} from "../businessPartners";
import { getLatestVerification } from "../ustidVerifications";

const COMPANY = "company-1";
const CLIENT = "client-A";

function baseInput(
  over: Partial<BusinessPartner> & { name: string }
): Parameters<typeof createBusinessPartner>[0] {
  const defaults: Parameters<typeof createBusinessPartner>[0] = {
    company_id: COMPANY,
    client_id: CLIENT,
    partner_type: "debitor",
    name: over.name,
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
  };
  return { ...defaults, ...over };
}

beforeEach(() => {
  localStorage.clear();
});

describe("createBusinessPartner · Duplicate-Hard-Block", () => {
  it("#1 Duplicate USt-IdNr wirft DuplicatePartnerError", async () => {
    await createBusinessPartner(
      baseInput({ name: "Alpha", ust_idnr: "DE111222333" })
    );
    await expect(
      createBusinessPartner(
        baseInput({ name: "Beta", ust_idnr: "DE111222333" })
      )
    ).rejects.toBeInstanceOf(DuplicatePartnerError);
  });

  it("#2 Fehler enthaelt hardBlocks mit existingPartnerId", async () => {
    const first = await createBusinessPartner(
      baseInput({ name: "Alpha", ust_idnr: "DE111222333" })
    );
    try {
      await createBusinessPartner(
        baseInput({ name: "Beta", ust_idnr: "DE111222333" })
      );
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicatePartnerError);
      const dup = err as DuplicatePartnerError;
      expect(dup.result.hardBlocks).toHaveLength(1);
      expect(dup.result.hardBlocks[0].existingPartnerId).toBe(first.id);
    }
  });

  it("#3 Duplicate debitor_nummer wirft (gleicher Client)", async () => {
    await createBusinessPartner(
      baseInput({ name: "X", debitor_nummer: 42000 })
    );
    await expect(
      createBusinessPartner(baseInput({ name: "Y", debitor_nummer: 42000 }))
    ).rejects.toBeInstanceOf(DuplicatePartnerError);
  });

  it("#4 Verschiedene Clients teilen keinen Duplicate-Block", async () => {
    await createBusinessPartner(
      baseInput({ name: "A", ust_idnr: "DE111222333", client_id: "c-a" })
    );
    await expect(
      createBusinessPartner(
        baseInput({ name: "B", ust_idnr: "DE111222333", client_id: "c-b" })
      )
    ).resolves.toBeDefined();
  });
});

describe("checkDuplicatesForInput · Soft-Warning", () => {
  it("#5 Liefert softWarnings ohne zu werfen", async () => {
    await createBusinessPartner(
      baseInput({ name: "Mustermann GmbH", anschrift_plz: "10115" })
    );
    const r = await checkDuplicatesForInput(
      baseInput({ name: "Musterman GmbH", anschrift_plz: "10115" })
    );
    expect(r.hardBlocks).toHaveLength(0);
    expect(r.softWarnings).toHaveLength(1);
    expect(r.softWarnings[0].field).toBe("name_plz");
  });
});

describe("verifyUstIdnrForPartner · DEMO-Branch", () => {
  it("#6 Valides Format → VALID + Log persistiert", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "VIES-Test", ust_idnr: "DE123456789" })
    );
    const v = await verifyUstIdnrForPartner(p.id);
    expect(v.verification_status).toBe("VALID");
    expect(v.vies_valid).toBe(true);
    const latest = await getLatestVerification(CLIENT, "DE123456789");
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(v.id);
  });

  it("#7 Invalides Format → INVALID + Log persistiert", async () => {
    const p = await createBusinessPartner(
      baseInput({ name: "Broken", ust_idnr: "DE12345" })
    );
    const v = await verifyUstIdnrForPartner(p.id);
    expect(v.verification_status).toBe("INVALID");
    expect(v.error_message).toMatch(/Format|Länder/);
  });

  it("#8 Partner ohne USt-IdNr → Fehler", async () => {
    const p = await createBusinessPartner(baseInput({ name: "NoId" }));
    await expect(verifyUstIdnrForPartner(p.id)).rejects.toThrow(
      /keine USt-IdNr/
    );
  });

  it("#9 Unbekannter partnerId → Fehler", async () => {
    await expect(verifyUstIdnrForPartner("no-such")).rejects.toThrow(
      /nicht gefunden/
    );
  });
});
