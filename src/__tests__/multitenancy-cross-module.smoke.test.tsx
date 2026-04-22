/** @jsxImportSource react */
//
// Multi-Tenancy-Foundation · Schritt 5 · Cross-Module-Leak-Smoke.
//
// End-to-End-Verifikation: für 5 Ressourcen (Employees, Anlagen,
// Documents, Receipt-Requests, Advisor-Notes) wird sichergestellt, dass
// Daten von Mandant A niemals im Kontext von Mandant B auftauchen —
// unabhängig davon, in welcher Reihenfolge die Fetches laufen.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  createEmployee,
  fetchEmployees,
} from "../api/employees";
import {
  createAnlagegut,
  fetchAnlagegueter,
} from "../api/anlagen";
import {
  fetchDocuments,
  uploadDocument,
} from "../api/documents";
import {
  createReceiptRequest,
  fetchReceiptRequests,
} from "../api/receiptRequests";
import { addNote, fetchNotesFor } from "../api/advisorNotes";

const A = "c-mandant-A";
const B = "c-mandant-B";

function empInput(personalnummer: string, nachname: string) {
  return {
    personalnummer,
    vorname: "Test",
    nachname,
    steuer_id: null,
    sv_nummer: null,
    steuerklasse: "I" as const,
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: null,
    einstellungsdatum: "2025-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit" as const,
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 1.7,
    privat_versichert: false,
    pv_kinderlos: false,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
  };
}

function anlageInput(inventar_nr: string, bezeichnung: string) {
  return {
    inventar_nr,
    bezeichnung,
    anschaffungsdatum: "2025-01-15",
    anschaffungskosten: 1500,
    nutzungsdauer_jahre: 5,
    afa_methode: "linear" as const,
    konto_anlage: "0440",
    konto_afa: "4830",
  };
}

describe("Multi-Tenancy · Cross-Module-Leak-Smoke (5 Ressourcen × 2 Mandanten)", () => {
  beforeEach(() => {
    localStorage.clear();
    // Audit-Log-Spam im Test unterdrücken.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it(
    "Employees / Anlagen / Documents / ReceiptRequests / AdvisorNotes — keine Kontamination",
    async () => {
      // --- Seed: 1× A, 1× B pro Ressource ---------------------------------
      await createEmployee(empInput("P-A-001", "Koch"), A);
      await createEmployee(empInput("P-B-001", "Schulz"), B);

      await createAnlagegut(anlageInput("INV-A-001", "Server A"), A);
      await createAnlagegut(anlageInput("INV-B-001", "Gabelstapler B"), B);

      await uploadDocument(
        new File(["doc-A-content"], "rechnung-A.pdf", {
          type: "application/pdf",
        }),
        A
      );
      await uploadDocument(
        new File(["doc-B-content"], "rechnung-B.pdf", {
          type: "application/pdf",
        }),
        B
      );

      await createReceiptRequest(
        { bank_datum: "2025-02-01", bank_betrag: 111 },
        A
      );
      await createReceiptRequest(
        { bank_datum: "2025-02-02", bank_betrag: 222 },
        B
      );

      await addNote({
        entityType: "journal_entry",
        entityId: "j-1",
        body: "Notiz zu A",
        clientId: A,
      });
      await addNote({
        entityType: "journal_entry",
        entityId: "j-1",
        body: "Notiz zu B",
        clientId: B,
      });

      // --- 1) fetch clientId=A → genau A-Daten ---------------------------
      const empsA = await fetchEmployees(A);
      expect(empsA).toHaveLength(1);
      expect(empsA[0].personalnummer).toBe("P-A-001");
      expect(empsA[0].nachname).toBe("Koch");
      expect(empsA[0].client_id).toBe(A);

      const anlA = await fetchAnlagegueter(A);
      expect(anlA).toHaveLength(1);
      expect(anlA[0].bezeichnung).toBe("Server A");
      expect(anlA[0].client_id).toBe(A);

      const docsA = await fetchDocuments(A);
      expect(docsA).toHaveLength(1);
      expect(docsA[0].file_name).toBe("rechnung-A.pdf");
      expect(docsA[0].client_id).toBe(A);

      const rrA = await fetchReceiptRequests(A);
      expect(rrA).toHaveLength(1);
      expect(rrA[0].bank_betrag).toBe(111);
      expect(rrA[0].client_id).toBe(A);

      const notesA = await fetchNotesFor("journal_entry", "j-1", A);
      expect(notesA).toHaveLength(1);
      expect(notesA[0].body).toBe("Notiz zu A");
      expect(notesA[0].client_id).toBe(A);

      // --- 2) fetch clientId=B → genau B-Daten ---------------------------
      const empsB = await fetchEmployees(B);
      expect(empsB).toHaveLength(1);
      expect(empsB[0].personalnummer).toBe("P-B-001");
      expect(empsB[0].client_id).toBe(B);

      const anlB = await fetchAnlagegueter(B);
      expect(anlB).toHaveLength(1);
      expect(anlB[0].bezeichnung).toBe("Gabelstapler B");
      expect(anlB[0].client_id).toBe(B);

      const docsB = await fetchDocuments(B);
      expect(docsB).toHaveLength(1);
      expect(docsB[0].file_name).toBe("rechnung-B.pdf");

      const rrB = await fetchReceiptRequests(B);
      expect(rrB).toHaveLength(1);
      expect(rrB[0].bank_betrag).toBe(222);

      const notesB = await fetchNotesFor("journal_entry", "j-1", B);
      expect(notesB).toHaveLength(1);
      expect(notesB[0].body).toBe("Notiz zu B");

      // --- 3) fetch clientId=null → beide Mandanten ----------------------
      expect(await fetchEmployees(null)).toHaveLength(2);
      expect(await fetchAnlagegueter(null)).toHaveLength(2);
      expect(await fetchDocuments(null)).toHaveLength(2);
      expect(await fetchReceiptRequests(null)).toHaveLength(2);
      expect(await fetchNotesFor("journal_entry", "j-1", null)).toHaveLength(2);

      // --- 4) Sequentielle Fetches A dann B — keine In-Memory-Kontamination
      const seq1 = await fetchEmployees(A);
      const seq2 = await fetchEmployees(B);
      expect(seq1).not.toBe(seq2);
      expect(seq1[0].client_id).toBe(A);
      expect(seq2[0].client_id).toBe(B);
      // Keine Referenz-Sharing-Bugs: Mutation von seq1 darf seq2 nicht
      // beeinflussen (jeder Fetch liefert eigenes Array).
      seq1.push(seq2[0]);
      const seq3 = await fetchEmployees(B);
      expect(seq3).toHaveLength(1);
      expect(seq3[0].personalnummer).toBe("P-B-001");
    },
    15_000
  );
});
