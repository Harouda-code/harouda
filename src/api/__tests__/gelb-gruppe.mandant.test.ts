// Multi-Tenancy Phase 1 / Schritt 2b · Gelb-Gruppe (7 APIs).
//
// Pro API-Datei mindestens 2 Tests (fetch-Filter + create-Write) — DEMO-Pfad.
// Supabase-Pfad ist strukturell identisch (dasselbe .eq("client_id", …)-Muster)
// und wird nicht gemockt (Aufwand vs. Nutzen).

import { describe, it, expect, beforeEach, vi } from "vitest";
import { store } from "../store";

// --- documents.ts --------------------------------------------------------

import { fetchDocuments, uploadDocument } from "../documents";

describe("documents · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchDocuments(clientId='X') filtert nach Row.client_id (DEMO)", async () => {
    // Zwei Dokumente für verschiedene Mandanten.
    await uploadDocument(
      new File(["content-A"], "a.txt", { type: "text/plain" }),
      "client-A"
    );
    await uploadDocument(
      new File(["content-B"], "b.txt", { type: "text/plain" }),
      "client-B"
    );

    const onlyA = await fetchDocuments("client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].client_id).toBe("client-A");
    expect(onlyA[0].file_name).toBe("a.txt");

    const all = await fetchDocuments(null);
    expect(all).toHaveLength(2);
  });

  it("uploadDocument(file, clientId='X') schreibt client_id='X' (DEMO)", async () => {
    const doc = await uploadDocument(
      new File(["hello"], "h.txt", { type: "text/plain" }),
      "client-kuehn"
    );
    expect(doc.client_id).toBe("client-kuehn");
  });
});

// --- supplierPreferences.ts ----------------------------------------------

import {
  fetchSupplierPreferences,
  recordSupplierBooking,
} from "../supplierPreferences";

describe("supplier_preferences · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchSupplierPreferences(clientId='X') filtert nach client_id (DEMO)", async () => {
    await recordSupplierBooking({
      supplier: "Lieferant-A",
      soll_konto: "4000",
      haben_konto: "1200",
      clientId: "client-A",
    });
    await recordSupplierBooking({
      supplier: "Lieferant-B",
      soll_konto: "4000",
      haben_konto: "1200",
      clientId: "client-B",
    });

    const onlyA = await fetchSupplierPreferences("client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].display_name).toBe("Lieferant-A");

    const all = await fetchSupplierPreferences(null);
    expect(all).toHaveLength(2);
  });

  it("recordSupplierBooking schreibt client_id in neue Row (DEMO)", async () => {
    await recordSupplierBooking({
      supplier: "Neu-Lieferant",
      soll_konto: "4500",
      haben_konto: "1200",
      clientId: "client-kuehn",
    });
    const rows = store.getSupplierPrefs();
    expect(rows).toHaveLength(1);
    expect(rows[0].client_id).toBe("client-kuehn");
  });
});

// --- advisorNotes.ts ------------------------------------------------------

import { addNote, fetchNotesFor } from "../advisorNotes";

describe("advisor_notes · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchNotesFor filtert nach client_id (DEMO)", async () => {
    await addNote({
      entityType: "journal_entry",
      entityId: "e-1",
      body: "Notiz A",
      clientId: "client-A",
    });
    await addNote({
      entityType: "journal_entry",
      entityId: "e-1",
      body: "Notiz B",
      clientId: "client-B",
    });

    const onlyA = await fetchNotesFor("journal_entry", "e-1", "client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].body).toBe("Notiz A");

    const all = await fetchNotesFor("journal_entry", "e-1", null);
    expect(all).toHaveLength(2);
  });

  it("addNote schreibt client_id in neue Notiz (DEMO)", async () => {
    const note = await addNote({
      entityType: "client",
      entityId: "c-1",
      body: "Test",
      clientId: "client-kuehn",
    });
    expect(note.client_id).toBe("client-kuehn");
  });
});

// --- receiptRequests.ts ---------------------------------------------------

import {
  createReceiptRequest,
  fetchReceiptRequests,
} from "../receiptRequests";

describe("receipt_requests · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchReceiptRequests filtert nach client_id (DEMO)", async () => {
    await createReceiptRequest(
      { bank_datum: "2025-03-01", bank_betrag: 100 },
      "client-A"
    );
    await createReceiptRequest(
      { bank_datum: "2025-03-02", bank_betrag: 200 },
      "client-B"
    );

    const onlyA = await fetchReceiptRequests("client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].bank_betrag).toBe(100);

    const all = await fetchReceiptRequests(null);
    expect(all).toHaveLength(2);
  });

  it("createReceiptRequest schreibt client_id in neue Row (DEMO)", async () => {
    const req = await createReceiptRequest(
      { bank_datum: "2025-03-15", bank_betrag: 333 },
      "client-kuehn"
    );
    expect(req.client_id).toBe("client-kuehn");
  });
});

// --- mahnwesen.ts ---------------------------------------------------------

import { createDunning, fetchDunningRecords } from "../mahnwesen";
import type { OpenItem } from "../opos";
import type { Settings } from "../../contexts/SettingsContext";

const DUMMY_SETTINGS: Settings = {
  kanzleiName: "",
  kanzleiStrasse: "",
  kanzleiPlz: "",
  kanzleiOrt: "",
  kanzleiTelefon: "",
  kanzleiEmail: "",
  kanzleiIban: "",
  kanzleiBic: "",
  defaultSteuernummer: "",
  elsterBeraterNr: "",
  kleinunternehmer: false,
  basiszinssatzPct: 0,
  verzugszinsenB2B: false,
  mahngebuehrStufe1: 5,
  mahngebuehrStufe2: 10,
  mahngebuehrStufe3: 15,
  stufe1AbTagen: 10,
  stufe2AbTagen: 20,
  stufe3AbTagen: 30,
  gebuchtLockAfterHours: 24,
  lohnKontoPersonalkosten: "4100",
  lohnKontoSvAgAufwand: "4130",
} as Settings;

function dummyItem(beleg_nr: string): OpenItem {
  return {
    beleg_nr,
    kind: "forderung",
    datum: "2024-11-01",
    faelligkeit: "2024-11-15",
    ueberfaellig_tage: 60,
    offen: 1000,
    gegenseite: "Kunde",
    mwst_satz: 19,
    client_id: null,
    beschreibung: "test",
    betrag: 1000,
    bezahlt: 0,
    bucket: "overdue",
    entry_ids: [],
  } as unknown as OpenItem;
}

describe("dunning_records · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchDunningRecords filtert nach client_id (DEMO)", async () => {
    await createDunning(
      { item: dummyItem("R-A"), stage: 1, settings: DUMMY_SETTINGS },
      "client-A"
    );
    await createDunning(
      { item: dummyItem("R-B"), stage: 1, settings: DUMMY_SETTINGS },
      "client-B"
    );

    const onlyA = await fetchDunningRecords("client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].beleg_nr).toBe("R-A");

    const all = await fetchDunningRecords(null);
    expect(all).toHaveLength(2);
  });

  it("createDunning schreibt client_id in neue Mahnung (DEMO)", async () => {
    const rec = await createDunning(
      { item: dummyItem("R-99"), stage: 1, settings: DUMMY_SETTINGS },
      "client-kuehn"
    );
    expect(rec.client_id).toBe("client-kuehn");
  });
});

// --- elsterSubmissions.ts --------------------------------------------------

import {
  fetchSubmissions,
  upsertSubmission,
} from "../elsterSubmissions";

describe("elster_submissions · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchSubmissions filtert nach client_id (DEMO)", async () => {
    await upsertSubmission(
      {
        form_type: "ustva",
        year: 2025,
        period: 1,
        label: "UStVA Jan A",
      },
      "client-A"
    );
    await upsertSubmission(
      {
        form_type: "ustva",
        year: 2025,
        period: 1,
        label: "UStVA Jan B",
      },
      "client-B"
    );

    const onlyA = await fetchSubmissions("client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].label).toBe("UStVA Jan A");

    const all = await fetchSubmissions(null);
    expect(all).toHaveLength(2);
  });

  it("upsertSubmission schreibt client_id in neue Row (DEMO)", async () => {
    const s = await upsertSubmission(
      {
        form_type: "ustva",
        year: 2025,
        period: 2,
        label: "UStVA Feb",
      },
      "client-kuehn"
    );
    expect(s.client_id).toBe("client-kuehn");
  });
});

// --- invoiceArchive.ts -----------------------------------------------------

import { archiveInvoice, fetchInvoiceArchive } from "../invoiceArchive";

type MinimalZugferdInvoice = {
  invoiceNumber: string;
  issueDate: string | null;
  dueDate: string | null;
  seller: { name: string | null; vatId: string | null } | null;
  buyer: { name: string | null } | null;
  currency: string | null;
  netTotal: number | null;
  taxTotal: number | null;
  grandTotal: number | null;
  profile?: string | null;
  rawXml?: string | null;
};

function invoice(no: string): MinimalZugferdInvoice {
  return {
    invoiceNumber: no,
    issueDate: "2025-03-01",
    dueDate: null,
    seller: { name: "Seller", vatId: null },
    buyer: { name: "Buyer" },
    currency: "EUR",
    netTotal: 100,
    taxTotal: 19,
    grandTotal: 119,
    profile: null,
  };
}

describe("invoice_archive · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("fetchInvoiceArchive filtert nach client_id (DEMO)", async () => {
    await archiveInvoice(
      {
        xml: `<Invoice><Num>A</Num></Invoice>`,
        parsed: invoice("A") as never,
        source: "upload",
      },
      "client-A"
    );
    await archiveInvoice(
      {
        xml: `<Invoice><Num>B</Num></Invoice>`,
        parsed: invoice("B") as never,
        source: "upload",
      },
      "client-B"
    );

    const onlyA = await fetchInvoiceArchive("client-A");
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].client_id).toBe("client-A");

    const all = await fetchInvoiceArchive(null);
    expect(all).toHaveLength(2);
  });

  it("archiveInvoice schreibt client_id in archive + xml-Row (DEMO)", async () => {
    const res = await archiveInvoice(
      {
        xml: `<Invoice><Num>C</Num></Invoice>`,
        parsed: invoice("C") as never,
        source: "upload",
      },
      "client-kuehn"
    );
    expect(res.archive.client_id).toBe("client-kuehn");
    expect(res.xml.client_id).toBe("client-kuehn");
  });
});
