/** @jsxImportSource react */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DiffViewer } from "../DiffViewer";

describe("DiffViewer", () => {
  it("INSERT: rendert nur Neu-Spalte, keine Alt-Werte", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="INSERT"
        oldData={null}
        newData={{ name: "Max", betrag: "1000.00" }}
      />
    );
    expect(html).toContain('data-testid="diff-insert"');
    expect(html).toContain("Neu (INSERT)");
    expect(html).toContain("Max");
    expect(html).not.toContain("Alt (DELETE)");
  });

  it("DELETE: rendert nur Alt-Spalte", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="DELETE"
        oldData={{ name: "Alt", betrag: "500.00" }}
        newData={null}
      />
    );
    expect(html).toContain('data-testid="diff-delete"');
    expect(html).toContain("Alt (DELETE)");
    expect(html).toContain("Alt");
  });

  it("UPDATE: zeigt geänderte Felder mit changed-marker", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="UPDATE"
        oldData={{ name: "Alt", betrag: "100.00" }}
        newData={{ name: "Alt", betrag: "200.00" }}
      />
    );
    expect(html).toContain('data-testid="diff-update"');
    // name hat sich nicht geändert → kein ● marker
    expect(html).toMatch(/●\s*betrag/);
    expect(html).not.toMatch(/●\s*name/);
  });

  it("Money-Keys werden als € formatiert", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="INSERT"
        oldData={null}
        newData={{ betrag: "1234.56" }}
      />
    );
    // toEuroFormat erzeugt "1.234,56 €" (ggf. narrow no-break space)
    expect(html).toMatch(/1\.234,56/);
    expect(html).toContain("€");
  });

  it("Boolean-Werte werden als ✓/✗ gerendert", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="INSERT"
        oldData={null}
        newData={{ aktiv: true, storno: false }}
      />
    );
    expect(html).toContain("✓");
    expect(html).toContain("✗");
  });

  it("Null-/undefined-Werte werden als ∅ markiert", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="UPDATE"
        oldData={{ feld: null }}
        newData={{ feld: "Wert" }}
      />
    );
    expect(html).toContain("∅");
  });

  it("Keys aus beiden Seiten werden kombiniert (alphabetisch sortiert)", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="UPDATE"
        oldData={{ z: 1, a: 2 }}
        newData={{ a: 2, m: 3 }}
      />
    );
    // Alle drei Keys erscheinen
    expect(html).toContain('data-testid="diff-key-a"');
    expect(html).toContain('data-testid="diff-key-m"');
    expect(html).toContain('data-testid="diff-key-z"');
  });

  it("Nested objects: als JSON-String gerendert", () => {
    const html = renderToStaticMarkup(
      <DiffViewer
        operation="INSERT"
        oldData={null}
        newData={{ adresse: { strasse: "Musterstr. 1", plz: "12345" } }}
      />
    );
    expect(html).toContain("Musterstr");
    expect(html).toContain("12345");
  });
});
