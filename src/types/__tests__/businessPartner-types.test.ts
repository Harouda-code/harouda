// Sprint 19.A · Type-Shape-Smoke-Test.
//
// Das ist primaer ein Compile-Zeit-Check: die `satisfies`-Klauseln
// erzwingen, dass die Literale exakt zur Typdefinition passen. Die
// Runtime-Assertions sind nur da, damit der Test-Runner einen Eintrag
// sieht (vitest faengt an, "tests without expects" zu warnen).

import { describe, it, expect } from "vitest";
import type {
  AufbewahrungsKategorie,
  BusinessPartner,
  BusinessPartnerType,
  BusinessPartnerVersion,
  PreferredInvoiceFormat,
  UstIdVerification,
  UstIdVerificationStatus,
} from "../db";

const SAMPLE_PARTNER_TYPES: BusinessPartnerType[] = [
  "debitor",
  "kreditor",
  "both",
];

const SAMPLE_FORMATS: PreferredInvoiceFormat[] = [
  "pdf",
  "zugferd",
  "xrechnung",
  "peppol",
];

const SAMPLE_KATEGORIEN: AufbewahrungsKategorie[] = [
  "ORGANISATIONSUNTERLAGE_10J",
  "GESCHAEFTSBRIEF_6J",
  "BUCHUNGSBELEG_8J",
];

const SAMPLE_VERIFICATION_STATUS: UstIdVerificationStatus[] = [
  "VALID",
  "INVALID",
  "PENDING",
  "SERVICE_UNAVAILABLE",
  "ERROR",
];

describe("Sprint 19 Types · Shape-Smoke", () => {
  it("#1 BusinessPartnerType-Union enthaelt alle 3 Varianten", () => {
    expect(SAMPLE_PARTNER_TYPES).toHaveLength(3);
  });

  it("#2 PreferredInvoiceFormat enthaelt alle 4 Varianten", () => {
    expect(SAMPLE_FORMATS).toHaveLength(4);
  });

  it("#3 AufbewahrungsKategorie enthaelt alle 3 Varianten", () => {
    expect(SAMPLE_KATEGORIEN).toHaveLength(3);
  });

  it("#4 UstIdVerificationStatus enthaelt alle 5 Varianten", () => {
    expect(SAMPLE_VERIFICATION_STATUS).toHaveLength(5);
  });

  it("#5 BusinessPartner-Literal ist strukturell valide", () => {
    const p: BusinessPartner = {
      id: "p-1",
      company_id: "c-1",
      client_id: "cl-1",
      partner_type: "both",
      debitor_nummer: 10000,
      kreditor_nummer: 70000,
      name: "Test",
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
    expect(p.partner_type).toBe("both");
  });

  it("#6 BusinessPartnerVersion-Literal nimmt BusinessPartner als snapshot", () => {
    const snapshot: BusinessPartner = {
      id: "p-1",
      company_id: "c-1",
      client_id: "cl-1",
      partner_type: "debitor",
      debitor_nummer: 10000,
      kreditor_nummer: null,
      name: "S",
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
    const v: BusinessPartnerVersion = {
      version_id: "v-1",
      partner_id: "p-1",
      company_id: "c-1",
      client_id: "cl-1",
      version_number: 1,
      snapshot,
      aufbewahrungs_kategorie: "ORGANISATIONSUNTERLAGE_10J",
      entstehungsjahr: 2026,
      retention_until: "2036-12-31",
      retention_hold: false,
      retention_hold_reason: null,
      valid_from: "2026-01-01T00:00:00Z",
      valid_to: null,
      created_at: "2026-01-01T00:00:00Z",
      created_by: null,
    };
    expect(v.snapshot.name).toBe("S");
  });

  it("#7 UstIdVerification erlaubt alle Status-Varianten", () => {
    for (const s of SAMPLE_VERIFICATION_STATUS) {
      const v: UstIdVerification = {
        id: "u-1",
        company_id: "c-1",
        client_id: "cl-1",
        partner_id: null,
        requested_ust_idnr: "DE123456789",
        requester_ust_idnr: null,
        raw_http_response: null,
        raw_http_response_headers: null,
        raw_http_request_url: "https://example.invalid",
        vies_valid: null,
        vies_request_date: null,
        vies_request_identifier: null,
        vies_trader_name: null,
        vies_trader_address: null,
        vies_raw_parsed: null,
        verification_status: s,
        verification_source: "VIES",
        error_message: null,
        entstehungsjahr: 2026,
        retention_until: "2036-12-31",
        retention_hold: false,
        retention_hold_reason: null,
        created_at: "2026-01-01T00:00:00Z",
        created_by: null,
      };
      expect(v.verification_status).toBe(s);
    }
  });
});
