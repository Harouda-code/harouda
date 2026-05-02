// ============================================================================
// documents · Vitest-Spezifikation für getAnyDocumentUrl
// (Charge 10, PR 4 — refactor/documents-preview-async)
//
// Strategie:
//   - Vollstaendiger Mock von `../documentsCloud` und `../store`.
//   - `vi.stubEnv` + `vi.resetModules` + dynamischer Import,
//     um den Modul-Konstanten USE_SUPABASE_STORAGE pro Test zu setzen.
//
// Was BEWUSST nicht getestet wird:
//   - Andere Wrapper (`fetchDocuments`, `uploadDocument`, ...) —
//     gehoeren in einen separaten Test-PR.
//   - Echtes Routing zur Cloud (E2E, getrennte Suite).
//   - `DocumentPreview.tsx` (Komponenten-Test in eigener Datei).
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Document } from "../../types/db";

// ---------------------------------------------------------------------------
// Hoisted Mocks · damit `vi.mock`-Factories sie sehen koennen.
// ---------------------------------------------------------------------------

const hoisted = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
  mockGetBlob: vi.fn(),
}));

vi.mock("../documentsCloud", () => ({
  getDocumentSignedUrl: hoisted.mockGetSignedUrl,
  // Stubs fuer alle weiteren Exports, die `documents.ts` importiert.
  // Werden in diesen Tests nicht aufgerufen, muessen aber vorhanden sein.
  fetchDocumentsCloud: vi.fn(),
  uploadDocumentCloud: vi.fn(),
  updateDocumentOcrCloud: vi.fn(),
  deleteDocumentCloud: vi.fn(),
  downloadDocumentAsFileCloud: vi.fn(),
  readPendingDocumentsLocalStorageMigration: vi.fn(),
  migrateOneDocumentToCloud: vi.fn(),
  markDocumentsLocalStorageMigrationComplete: vi.fn(),
}));

vi.mock("../store", () => ({
  store: {
    getBlob: hoisted.mockGetBlob,
    // Stubs fuer alle weiteren store-Methoden, die in documents.ts referenziert werden.
    getDocuments: vi.fn(() => []),
    setDocuments: vi.fn(),
    setBlob: vi.fn(),
    deleteBlob: vi.fn(),
  },
  uid: vi.fn(() => "test-id"),
}));

// ---------------------------------------------------------------------------
// Helfer · Modul mit gesetzter Flag-Variante laden.
//
// Vitest cached Module nach dem ersten Import. Da `USE_SUPABASE_STORAGE`
// in `documents.ts` als Modul-Konstante zur Lade-Zeit ausgewertet wird,
// muessen wir vor jedem Lade-Vorgang `resetModules` aufrufen.
// ---------------------------------------------------------------------------

async function loadModule(flagOn: boolean) {
  vi.stubEnv("VITE_USE_SUPABASE_STORAGE", flagOn ? "true" : "false");
  vi.resetModules();
  return await import("../documents");
}

// ---------------------------------------------------------------------------
// Test-Fixtures
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-1",
    client_id: null,
    file_name: "rechnung.pdf",
    file_path: "company-uuid-1/doc-1.pdf",
    mime_type: "application/pdf",
    size_bytes: 12345,
    beleg_nr: null,
    ocr_text: null,
    journal_entry_id: null,
    uploaded_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("documents · getAnyDocumentUrl", () => {
  beforeEach(() => {
    hoisted.mockGetSignedUrl.mockReset();
    hoisted.mockGetBlob.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Legacy-Modus (Flag OFF)", () => {
    it("liefert die Blob-URL aus dem store", async () => {
      hoisted.mockGetBlob.mockReturnValue("blob:abc-123");
      const { getAnyDocumentUrl } = await loadModule(false);

      const url = await getAnyDocumentUrl(makeDoc());

      expect(url).toBe("blob:abc-123");
      expect(hoisted.mockGetBlob).toHaveBeenCalledWith("doc-1");
      expect(hoisted.mockGetSignedUrl).not.toHaveBeenCalled();
    });

    it("liefert null, wenn kein Blob im store existiert", async () => {
      hoisted.mockGetBlob.mockReturnValue(null);
      const { getAnyDocumentUrl } = await loadModule(false);

      const url = await getAnyDocumentUrl(makeDoc());

      expect(url).toBeNull();
      expect(hoisted.mockGetSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe("Cloud-Modus (Flag ON)", () => {
    it("liefert null, wenn doc.file_path fehlt — ohne getDocumentSignedUrl aufzurufen", async () => {
      const { getAnyDocumentUrl } = await loadModule(true);

      const url = await getAnyDocumentUrl(makeDoc({ file_path: null }));

      expect(url).toBeNull();
      expect(hoisted.mockGetSignedUrl).not.toHaveBeenCalled();
      expect(hoisted.mockGetBlob).not.toHaveBeenCalled();
    });

    it("ruft getDocumentSignedUrl auf und liefert dessen URL", async () => {
      hoisted.mockGetSignedUrl.mockResolvedValue(
        "https://supabase.example/signed-url"
      );
      const { getAnyDocumentUrl } = await loadModule(true);

      const doc = makeDoc();
      const url = await getAnyDocumentUrl(doc);

      expect(url).toBe("https://supabase.example/signed-url");
      expect(hoisted.mockGetSignedUrl).toHaveBeenCalledTimes(1);
      expect(hoisted.mockGetSignedUrl).toHaveBeenCalledWith(doc);
      expect(hoisted.mockGetBlob).not.toHaveBeenCalled();
    });

    it("propagiert den Fehler von getDocumentSignedUrl unveraendert", async () => {
      const ioError = new Error(
        "Signed URL konnte nicht erzeugt werden: Storage offline"
      );
      hoisted.mockGetSignedUrl.mockRejectedValue(ioError);
      const { getAnyDocumentUrl } = await loadModule(true);

      await expect(getAnyDocumentUrl(makeDoc())).rejects.toThrow(
        "Signed URL konnte nicht erzeugt werden: Storage offline"
      );
      expect(hoisted.mockGetBlob).not.toHaveBeenCalled();
    });
  });
});
