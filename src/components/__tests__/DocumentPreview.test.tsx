/**
 * Tests fuer DocumentPreview - die vier Zustaende plus PDF-Branch.
 *
 * Bezug: AC7-Gap aus PR 4 (refactor/documents-preview-async).
 * Schliesst die Schuld, die in Charge 10 wegen fehlender RTL deferriert wurde.
 *
 * Strategie:
 *   - getAnyDocumentUrl wird gemockt mit kontrollierbaren Promises,
 *     um den loading-Zustand DETERMINISTISCH zu testen.
 *   - formatFileSize wird simpel gemockt (kein Fokus dieses Tests).
 *   - Die fuenf Tests decken: loading, loaded(image), loaded(pdf),
 *     notAvailable, error.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import DocumentPreview from "../DocumentPreview";
import { getAnyDocumentUrl } from "../../api/documents";
import type { Document } from "../../types/db";

// ── Mock der API-Schicht ────────────────────────────────────────────────────
vi.mock("../../api/documents", () => ({
  getAnyDocumentUrl: vi.fn(),
  formatFileSize: vi.fn((bytes: number) => `${bytes} B`),
}));

// ── Test-Fixture ────────────────────────────────────────────────────────────
function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-1",
    client_id: "client-1",
    file_name: "rechnung.pdf",
    file_path: "client-1/rechnung.pdf",
    mime_type: "application/pdf",
    size_bytes: 1024,
    beleg_nr: null,
    ocr_text: null,
    journal_entry_id: null,
    uploaded_at: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

const baseProps = {
  entries: [],
  siblings: [],
  onClose: vi.fn(),
  onNavigate: vi.fn(),
};

// ── Hilfsfunktion: kontrollierbares Promise ─────────────────────────────────
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe("DocumentPreview - asynchrone Zustaende", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("zeigt loading-Spinner waehrend getAnyDocumentUrl noch laeuft", () => {
    const { promise } = deferred<string | null>();
    vi.mocked(getAnyDocumentUrl).mockReturnValue(promise);

    render(<DocumentPreview doc={makeDoc()} {...baseProps} />);

    expect(screen.getByText(/wird geladen/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("zeigt <img> wenn URL aufgeloest und mime_type ein Bild ist", async () => {
    vi.mocked(getAnyDocumentUrl).mockResolvedValue(
      "https://example.com/bild.png"
    );

    render(
      <DocumentPreview
        doc={makeDoc({ mime_type: "image/png", file_name: "bild.png" })}
        {...baseProps}
      />
    );

    const img = await screen.findByRole("img", { name: "bild.png" });
    expect(img).toHaveAttribute("src", "https://example.com/bild.png");
  });

  it("zeigt <iframe> wenn URL aufgeloest und mime_type PDF ist", async () => {
    vi.mocked(getAnyDocumentUrl).mockResolvedValue(
      "https://example.com/rechnung.pdf"
    );

    render(<DocumentPreview doc={makeDoc()} {...baseProps} />);

    await waitFor(() => {
      const iframe = screen.getByTitle("rechnung.pdf");
      expect(iframe).toHaveAttribute(
        "src",
        "https://example.com/rechnung.pdf"
      );
    });
  });

  it("zeigt 'nicht verfuegbar' wenn getAnyDocumentUrl null zurueckgibt", async () => {
    vi.mocked(getAnyDocumentUrl).mockResolvedValue(null);

    render(<DocumentPreview doc={makeDoc()} {...baseProps} />);

    expect(
      await screen.findByText(/Vorschau nicht verfügbar/i)
    ).toBeInTheDocument();
  });

  it("zeigt error-State mit Nachricht wenn getAnyDocumentUrl wirft", async () => {
    vi.mocked(getAnyDocumentUrl).mockRejectedValue(
      new Error("Storage-Timeout nach 30s")
    );

    render(<DocumentPreview doc={makeDoc()} {...baseProps} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/konnte nicht geladen werden/i);
    expect(alert).toHaveTextContent("Storage-Timeout nach 30s");
  });
});
