// Sprint 19.B · duplicateCheck-Tests.

import { describe, it, expect } from "vitest";
import type { BusinessPartner } from "../../../types/db";
import {
  checkDuplicates,
  levenshtein,
} from "../duplicateCheck";

function partner(
  over: Partial<BusinessPartner> & { id: string; name: string }
): BusinessPartner {
  const defaults: BusinessPartner = {
    id: over.id,
    company_id: "c",
    client_id: "cl",
    partner_type: "debitor",
    debitor_nummer: 10000,
    kreditor_nummer: null,
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
    anschrift_land_iso: null,
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
  return { ...defaults, ...over };
}

describe("levenshtein", () => {
  it("#1 identische Strings → 0", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("#2 leere Strings → Laenge", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("#3 einzelne Substitution → 1", () => {
    expect(levenshtein("kitten", "sitten")).toBe(1);
  });

  it("#4 klassisches Beispiel kitten→sitting = 3", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("checkDuplicates · Hard-Blocks", () => {
  it("#5 ust_idnr exact match → hardBlock", () => {
    const existing = [partner({ id: "A", name: "Alpha", ust_idnr: "DE111222333" })];
    const r = checkDuplicates(
      { client_id: "cl", name: "Neu", ust_idnr: "DE111222333" },
      existing
    );
    expect(r.hardBlocks).toHaveLength(1);
    expect(r.hardBlocks[0].field).toBe("ust_idnr");
    expect(r.hardBlocks[0].existingPartnerId).toBe("A");
  });

  it("#6 ust_idnr case-insensitive + Whitespace-tolerant", () => {
    const existing = [partner({ id: "A", name: "Alpha", ust_idnr: "DE111222333" })];
    const r = checkDuplicates(
      { client_id: "cl", name: "Neu", ust_idnr: " de 111 222 333 " },
      existing
    );
    expect(r.hardBlocks).toHaveLength(1);
  });

  it("#7 steuernummer+finanzamt kombiniert, nicht alleine", () => {
    const existing = [
      partner({
        id: "A",
        name: "A",
        steuernummer: "123/456/789",
        finanzamt: "München",
      }),
    ];
    // Nur Steuernummer ohne Finanzamt → kein Block.
    const r1 = checkDuplicates(
      { client_id: "cl", name: "N", steuernummer: "123/456/789" },
      existing
    );
    expect(r1.hardBlocks).toHaveLength(0);
    // Beides → Block.
    const r2 = checkDuplicates(
      {
        client_id: "cl",
        name: "N",
        steuernummer: "123/456/789",
        finanzamt: "München",
      },
      existing
    );
    expect(r2.hardBlocks).toHaveLength(1);
    expect(r2.hardBlocks[0].field).toBe("steuernummer_finanzamt");
  });

  it("#8 hrb+registergericht kombiniert", () => {
    const existing = [
      partner({
        id: "A",
        name: "A",
        hrb: "HRB 12345",
        registergericht: "Amtsgericht Hamburg",
      }),
    ];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "N",
        hrb: "HRB 12345",
        registergericht: "Amtsgericht Hamburg",
      },
      existing
    );
    expect(r.hardBlocks).toHaveLength(1);
    expect(r.hardBlocks[0].field).toBe("hrb_registergericht");
  });

  it("#9 debitor_nummer exact match", () => {
    const existing = [partner({ id: "A", name: "A", debitor_nummer: 42000 })];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "N",
        partner_type: "debitor",
        debitor_nummer: 42000,
      },
      existing
    );
    expect(r.hardBlocks.some((b) => b.field === "debitor_nummer")).toBe(true);
  });

  it("#10 kreditor_nummer exact match", () => {
    const existing = [
      partner({
        id: "A",
        name: "A",
        partner_type: "kreditor",
        debitor_nummer: null,
        kreditor_nummer: 70500,
      }),
    ];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "N",
        partner_type: "kreditor",
        kreditor_nummer: 70500,
      },
      existing
    );
    expect(r.hardBlocks.some((b) => b.field === "kreditor_nummer")).toBe(true);
  });
});

describe("checkDuplicates · excludePartnerId + Mandantenisolation", () => {
  it("#11 excludePartnerId verhindert Selbst-Kollision (UPDATE)", () => {
    const existing = [
      partner({ id: "A", name: "A", ust_idnr: "DE111222333" }),
    ];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "A",
        ust_idnr: "DE111222333",
        excludePartnerId: "A",
      },
      existing
    );
    expect(r.hardBlocks).toHaveLength(0);
  });

  it("#12 Client-Isolation: kein Hit wenn client_id unterschiedlich", () => {
    const existing = [
      partner({
        id: "A",
        name: "A",
        client_id: "client-OTHER",
        ust_idnr: "DE111222333",
      }),
    ];
    const r = checkDuplicates(
      { client_id: "cl", name: "N", ust_idnr: "DE111222333" },
      existing
    );
    expect(r.hardBlocks).toHaveLength(0);
  });
});

describe("checkDuplicates · Soft-Warnings", () => {
  it("#13 Levenshtein ≤ 3 + gleiche PLZ → softWarning", () => {
    const existing = [
      partner({ id: "A", name: "Mustermann GmbH", anschrift_plz: "10115" }),
    ];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "Musterman GmbH", // distance = 1
        anschrift_plz: "10115",
      },
      existing
    );
    expect(r.softWarnings).toHaveLength(1);
    expect(r.softWarnings[0].field).toBe("name_plz");
    expect(r.softWarnings[0].distance).toBe(1);
  });

  it("#14 Levenshtein > 3 → kein softWarning", () => {
    const existing = [
      partner({ id: "A", name: "Mustermann GmbH", anschrift_plz: "10115" }),
    ];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "Completely Different Inc",
        anschrift_plz: "10115",
      },
      existing
    );
    expect(r.softWarnings).toHaveLength(0);
  });

  it("#15 Ähnlicher Name aber andere PLZ → kein Warning", () => {
    const existing = [
      partner({ id: "A", name: "Mustermann GmbH", anschrift_plz: "10115" }),
    ];
    const r = checkDuplicates(
      {
        client_id: "cl",
        name: "Musterman GmbH",
        anschrift_plz: "99999",
      },
      existing
    );
    expect(r.softWarnings).toHaveLength(0);
  });
});
