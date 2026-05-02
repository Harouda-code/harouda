// ============================================================================
// documentsCloud · Vitest-Spezifikation
// (Charge 8, PR 2)
//
// Strategie:
//   - Vollstaendiger Mock von `./supabase` (auth, from, storage).
//   - Vollstaendiger Mock von `./db` (requireCompanyId).
//   - Tests pruefen die Cloud-Implementierung isoliert von Storage/DB.
//
// Was BEWUSST nicht getestet wird:
//   - Echte RLS-Wirkung (Future Work, pgTAP-Suite).
//   - Echter Storage-Roundtrip (E2E-Suite).
//   - Wrapper-Routing in `documents.ts` (separater Test-PR moeglich).
// ============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Document } from "../../types/db";

// ---------------------------------------------------------------------------
// Mocks · gehoistet, damit `vi.mock`-Factories sie sehen
//
// `vi.mock` wird zur Compile-Zeit an den Top des Files gezogen. Top-Level-
// Variablen sind dort noch nicht initialisiert — `vi.hoisted()` ist die
// offizielle Loesung dieses Problems.
// ---------------------------------------------------------------------------

const TEST_COMPANY_ID = "company-uuid-1";
const TEST_USER_ID = "user-uuid-1";

const hoisted = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockFromBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  };
  const mockFrom = vi.fn(() => mockFromBuilder);
  const mockStorageBucket = {
    upload: vi.fn(),
    remove: vi.fn(),
    createSignedUrl: vi.fn(),
  };
  const mockStorageFrom = vi.fn(() => mockStorageBucket);
  const mockRequireCompanyId = vi.fn(() => "company-uuid-1");
  return {
    mockGetUser,
    mockFromBuilder,
    mockFrom,
    mockStorageBucket,
    mockStorageFrom,
    mockRequireCompanyId,
  };
});

const { mockGetUser, mockFromBuilder, mockFrom, mockStorageBucket } = hoisted;

vi.mock("../db", () => ({
  requireCompanyId: hoisted.mockRequireCompanyId,
}));

vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: hoisted.mockGetUser },
    from: hoisted.mockFrom,
    storage: { from: hoisted.mockStorageFrom },
  },
  DEMO_MODE: false,
}));

// ---------------------------------------------------------------------------
// Helfer: Query-Builder ist chainable; jede Methode liefert das Builder-Objekt
// zurueck. Terminal-Methoden (`maybeSingle`, `single`, `order`) werden pro
// Test mit `mockResolvedValueOnce` oder `mockReturnValueOnce` befuellt.
// `await query` (ohne terminale Methode) trifft `then` — Promise-Resolution.
// ---------------------------------------------------------------------------

/**
 * Helfer: liefert immer denselben Builder (chainable). Tests, die ein
 * terminales Resultat brauchen, ueberschreiben gezielt mit
 * `mockResolvedValueOnce` auf der jeweiligen End-Methode.
 */
function chainable() {
  return mockFromBuilder;
}

/**
 * Damit `await query` funktioniert, muss der Builder selbst thenable sein
 * (Supabase-Verhalten). Wir ueberschreiben `then` so, dass `await builder`
 * einen Default-Erfolg liefert, der von Tests ueber `mockResolvedValueOnce`
 * auf bestimmten Methoden uebersteuert werden kann.
 */
function makeBuilderThenable(defaultResult: { data?: unknown; error: unknown }) {
  mockFromBuilder.then.mockImplementation((onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(defaultResult).then(onFulfilled)
  );
}

function resetMocks() {
  vi.clearAllMocks();
  mockFromBuilder.select.mockReturnValue(chainable());
  mockFromBuilder.insert.mockReturnValue(chainable());
  mockFromBuilder.update.mockReturnValue(chainable());
  mockFromBuilder.delete.mockReturnValue(chainable());
  mockFromBuilder.eq.mockReturnValue(chainable());
  mockFromBuilder.order.mockReturnValue(chainable());
  // Default: `await builder` resolved erfolgreich; Tests koennen ueberschreiben.
  makeBuilderThenable({ data: [], error: null });
  mockGetUser.mockResolvedValue({
    data: { user: { id: TEST_USER_ID } },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// SUT (System under Test) — erst nach Mock-Setup importieren!
// ---------------------------------------------------------------------------

import {
  fetchDocumentsCloud,
  uploadDocumentCloud,
  getDocumentSignedUrl,
  deleteDocumentCloud,
  updateDocumentOcrCloud,
  downloadDocumentAsFileCloud,
  readPendingDocumentsLocalStorageMigration,
  migrateOneDocumentToCloud,
  markDocumentsLocalStorageMigrationComplete,
} from "../documentsCloud";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("documentsCloud · fetchDocumentsCloud", () => {
  beforeEach(() => resetMocks());

  it("liefert sortierte Liste fuer einen Mandanten", async () => {
    const row = {
      id: "doc-1",
      client_id: "client-1",
      file_name: "rechnung.pdf",
      file_path: `${TEST_COMPANY_ID}/doc-1.pdf`,
      mime_type: "application/pdf",
      size_bytes: 1234,
      beleg_nr: null,
      ocr_text: null,
      journal_entry_id: null,
      uploaded_at: "2025-01-01T00:00:00.000Z",
    };
    makeBuilderThenable({ data: [row], error: null });

    const result = await fetchDocumentsCloud("client-1");

    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(mockFromBuilder.eq).toHaveBeenCalledWith(
      "company_id",
      TEST_COMPANY_ID
    );
    expect(mockFromBuilder.eq).toHaveBeenCalledWith("client_id", "client-1");
    expect(mockFromBuilder.order).toHaveBeenCalledWith("uploaded_at", {
      ascending: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("doc-1");
  });

  it("filtert NICHT nach client_id, wenn null uebergeben wird", async () => {
    makeBuilderThenable({ data: [], error: null });

    await fetchDocumentsCloud(null);

    // Nur ein eq-Aufruf (company_id), nicht zwei.
    const calls = mockFromBuilder.eq.mock.calls;
    const clientIdCalls = calls.filter((c) => c[0] === "client_id");
    expect(clientIdCalls).toHaveLength(0);
  });

  it("wirft bei DB-Fehler", async () => {
    makeBuilderThenable({ data: null, error: { message: "boom" } });

    await expect(fetchDocumentsCloud(null)).rejects.toThrow("boom");
  });
});

describe("documentsCloud · uploadDocumentCloud", () => {
  beforeEach(() => resetMocks());

  function makeFile(
    name = "beleg.pdf",
    type = "application/pdf",
    size = 1024
  ): File {
    const blob = new Blob([new Uint8Array(size)], { type });
    return new File([blob], name, { type });
  }

  it("wirft bei Datei > 10 MB", async () => {
    const big = makeFile("big.pdf", "application/pdf", 11 * 1024 * 1024);
    await expect(uploadDocumentCloud(big, null)).rejects.toThrow(/10 MB/);
  });

  it("nutzt Pfad-Konvention {company_id}/{document_id}.{ext}", async () => {
    mockStorageBucket.upload.mockResolvedValueOnce({ data: {}, error: null });
    mockFromBuilder.single.mockResolvedValueOnce({
      data: {
        id: "ignored",
        client_id: null,
        file_name: "beleg.pdf",
        file_path: "ignored",
        mime_type: "application/pdf",
        size_bytes: 1024,
        beleg_nr: null,
        ocr_text: null,
        journal_entry_id: null,
        uploaded_at: "2025-01-01T00:00:00.000Z",
      },
      error: null,
    });

    await uploadDocumentCloud(makeFile("beleg.pdf"), null);

    const uploadCall = mockStorageBucket.upload.mock.calls[0];
    const path = uploadCall[0] as string;
    expect(path.startsWith(`${TEST_COMPANY_ID}/`)).toBe(true);
    expect(path.endsWith(".pdf")).toBe(true);
  });

  it("rollt Storage-Objekt zurueck bei DB-Insert-Fehler", async () => {
    mockStorageBucket.upload.mockResolvedValueOnce({ data: {}, error: null });
    mockFromBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: "insert failed" },
    });
    mockStorageBucket.remove.mockResolvedValueOnce({ data: {}, error: null });

    await expect(uploadDocumentCloud(makeFile(), null)).rejects.toThrow(
      /insert failed/
    );
    expect(mockStorageBucket.remove).toHaveBeenCalledTimes(1);
  });

  it("wirft bei Storage-Upload-Fehler ohne DB-Insert zu rufen", async () => {
    mockStorageBucket.upload.mockResolvedValueOnce({
      data: null,
      error: { message: "storage down" },
    });

    await expect(uploadDocumentCloud(makeFile(), null)).rejects.toThrow(
      /storage down/
    );
    expect(mockFromBuilder.insert).not.toHaveBeenCalled();
  });

  it("wirft, wenn kein User authentifiziert ist", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(uploadDocumentCloud(makeFile(), null)).rejects.toThrow(
      /authentifiziert/
    );
  });
});

describe("documentsCloud · getDocumentSignedUrl", () => {
  beforeEach(() => resetMocks());

  const baseDoc: Document = {
    id: "doc-1",
    client_id: null,
    file_name: "rechnung.pdf",
    file_path: `${TEST_COMPANY_ID}/doc-1.pdf`,
    mime_type: "application/pdf",
    size_bytes: 1024,
    beleg_nr: null,
    ocr_text: null,
    journal_entry_id: null,
    uploaded_at: "2025-01-01T00:00:00.000Z",
  };

  it("liefert Signed URL mit Default-TTL = 3600", async () => {
    mockStorageBucket.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed/abc" },
      error: null,
    });

    const url = await getDocumentSignedUrl(baseDoc);

    expect(mockStorageBucket.createSignedUrl).toHaveBeenCalledWith(
      baseDoc.file_path,
      3600
    );
    expect(url).toBe("https://signed/abc");
  });

  it("uebernimmt expiresIn-Parameter", async () => {
    mockStorageBucket.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed/xyz" },
      error: null,
    });

    await getDocumentSignedUrl(baseDoc, 60);

    expect(mockStorageBucket.createSignedUrl).toHaveBeenCalledWith(
      baseDoc.file_path,
      60
    );
  });

  it("wirft, wenn file_path fehlt", async () => {
    const docOhnePfad = { ...baseDoc, file_path: null };
    await expect(getDocumentSignedUrl(docOhnePfad)).rejects.toThrow(
      /Storage-Pfad/
    );
  });

  it("wirft bei Storage-Fehler", async () => {
    mockStorageBucket.createSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: "expired" },
    });

    await expect(getDocumentSignedUrl(baseDoc)).rejects.toThrow(/expired/);
  });
});

describe("documentsCloud · deleteDocumentCloud", () => {
  beforeEach(() => resetMocks());

  it("loescht Storage und DB in dieser Reihenfolge", async () => {
    const filePath = `${TEST_COMPANY_ID}/doc-1.pdf`;
    const callOrder: string[] = [];

    mockFromBuilder.maybeSingle.mockResolvedValueOnce({
      data: { file_path: filePath },
      error: null,
    });
    mockStorageBucket.remove.mockImplementationOnce(async () => {
      callOrder.push("storage.remove");
      return { data: {}, error: null };
    });
    // `await deleteQuery` trifft `then` auf dem Builder.
    mockFromBuilder.then.mockImplementationOnce(
      (onFulfilled: (v: unknown) => unknown) => {
        callOrder.push("db.delete");
        return Promise.resolve({ error: null }).then(onFulfilled);
      }
    );

    await deleteDocumentCloud("doc-1", null);

    expect(callOrder).toEqual(["storage.remove", "db.delete"]);
  });

  it("ist idempotent, wenn das Dokument nicht existiert", async () => {
    mockFromBuilder.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(deleteDocumentCloud("missing", null)).resolves.toBeUndefined();
    expect(mockStorageBucket.remove).not.toHaveBeenCalled();
    expect(mockFromBuilder.delete).not.toHaveBeenCalled();
  });
});

describe("documentsCloud · updateDocumentOcrCloud", () => {
  beforeEach(() => resetMocks());

  it("setzt ocr_text fuer das passende Dokument", async () => {
    makeBuilderThenable({ error: null });

    await updateDocumentOcrCloud("doc-1", "OCR-Text", "client-1");

    expect(mockFromBuilder.update).toHaveBeenCalledWith({
      ocr_text: "OCR-Text",
    });
    expect(mockFromBuilder.eq).toHaveBeenCalledWith("id", "doc-1");
    expect(mockFromBuilder.eq).toHaveBeenCalledWith("company_id", TEST_COMPANY_ID);
    expect(mockFromBuilder.eq).toHaveBeenCalledWith("client_id", "client-1");
  });
});

describe("documentsCloud · downloadDocumentAsFileCloud", () => {
  beforeEach(() => {
    resetMocks();
    // globalThis.fetch mocken
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        blob: async () => new Blob(["x"], { type: "application/pdf" }),
      }))
    );
  });

  it("erzeugt File-Objekt aus Signed URL", async () => {
    mockStorageBucket.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed/abc" },
      error: null,
    });

    const doc: Document = {
      id: "doc-1",
      client_id: null,
      file_name: "rechnung.pdf",
      file_path: `${TEST_COMPANY_ID}/doc-1.pdf`,
      mime_type: "application/pdf",
      size_bytes: 1024,
      beleg_nr: null,
      ocr_text: null,
      journal_entry_id: null,
      uploaded_at: "2025-01-01T00:00:00.000Z",
    };

    const file = await downloadDocumentAsFileCloud(doc);

    expect(file.name).toBe("rechnung.pdf");
    expect(file.type).toBe("application/pdf");
    expect(mockStorageBucket.createSignedUrl).toHaveBeenCalledWith(
      doc.file_path,
      60
    );
  });
});

describe("documentsCloud · localStorage-Migrations-Helfer", () => {
  beforeEach(() => {
    resetMocks();
    localStorage.clear();
  });

  it("liefert leeres Array, wenn Migration bereits abgeschlossen ist", () => {
    localStorage.setItem("harouda:documents:migrated", "1");
    localStorage.setItem(
      "harouda:documents",
      JSON.stringify([{ id: "doc-1" }])
    );
    expect(readPendingDocumentsLocalStorageMigration()).toEqual([]);
  });

  it("liefert nur Dokumente mit existierendem Blob", () => {
    const doc1 = {
      id: "doc-1",
      client_id: null,
      file_name: "a.pdf",
      file_path: "local://doc-1",
      mime_type: "application/pdf",
      size_bytes: 1,
      beleg_nr: null,
      ocr_text: null,
      journal_entry_id: null,
      uploaded_at: "2025-01-01T00:00:00.000Z",
    };
    const doc2 = { ...doc1, id: "doc-2", file_path: "local://doc-2" };
    localStorage.setItem("harouda:documents", JSON.stringify([doc1, doc2]));
    localStorage.setItem("harouda:doc:doc-1", "data:application/pdf;base64,AAA");
    // doc-2 hat absichtlich keinen Blob

    const items = readPendingDocumentsLocalStorageMigration();
    expect(items).toHaveLength(1);
    expect(items[0].doc.id).toBe("doc-1");
  });

  it("markLocalStorageMigrationComplete setzt den Flag", () => {
    markDocumentsLocalStorageMigrationComplete();
    expect(localStorage.getItem("harouda:documents:migrated")).toBe("1");
  });

  it("migrateOneDocumentToCloud uploadet und schreibt DB-Zeile", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(["x"], { type: "application/pdf" }),
      }))
    );
    mockStorageBucket.upload.mockResolvedValueOnce({ data: {}, error: null });
    // Insert ohne `.select()` → terminal-Promise direkt am insert-Builder
    mockFromBuilder.insert.mockReturnValueOnce(
      Promise.resolve({ error: null }) as unknown as ReturnType<
        typeof chainable
      >
    );

    const doc: Document = {
      id: "doc-1",
      client_id: null,
      file_name: "x.pdf",
      file_path: "local://doc-1",
      mime_type: "application/pdf",
      size_bytes: 1,
      beleg_nr: null,
      ocr_text: null,
      journal_entry_id: null,
      uploaded_at: "2025-01-01T00:00:00.000Z",
    };

    await migrateOneDocumentToCloud(doc, "data:application/pdf;base64,AAA");

    expect(mockStorageBucket.upload).toHaveBeenCalledTimes(1);
    expect(mockFromBuilder.insert).toHaveBeenCalledTimes(1);
  });
});
