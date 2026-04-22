import { describe, it, expect } from "vitest";
import { PdfReportBase } from "../PdfBase";
import { Money } from "../../money/Money";

describe("PdfReportBase", () => {
  it("erzeugt ein Blob mit application/pdf", () => {
    const p = new PdfReportBase();
    p.addHeader({
      title: "Test",
      mandantName: "Kanzlei Test",
    });
    p.addSection("Abschnitt");
    p.addKeyValue("Summe", p.formatMoney("1234.56"));
    p.addFooter({ title: "Test", mandantName: "Kanzlei Test" });
    const blob = p.toBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toMatch(/^application\/pdf/);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("Money-Formatter liefert deutsches € Format", () => {
    const p = new PdfReportBase();
    const formatted = p.formatMoney("1234.56");
    expect(formatted).toMatch(/1\.234,56/);
    expect(formatted).toContain("€");
  });

  it("Money-Formatter akzeptiert Money-Instanz", () => {
    const p = new PdfReportBase();
    const formatted = p.formatMoney(new Money("1000"));
    expect(formatted).toMatch(/1\.000,00/);
  });

  it("Landscape-Orientierung möglich", () => {
    const p = new PdfReportBase({ orientation: "landscape" });
    p.addHeader({ title: "Quer", mandantName: "Test" });
    const blob = p.toBlob();
    expect(blob.size).toBeGreaterThan(0);
  });

  it("Mehrere Sections + Table produzieren gültiges PDF", () => {
    const p = new PdfReportBase();
    p.addHeader({ title: "Report", mandantName: "Test" });
    p.addSection("Teil 1");
    p.addTable(
      ["A", "B", "C"],
      [
        ["1", "2", "3"],
        ["4", "5", "6"],
      ]
    );
    p.addSection("Teil 2");
    p.addKeyValue("Summe", "100,00 €", { bold: true });
    p.addFooter({ title: "x", mandantName: "y" });
    const blob = p.toBlob();
    expect(blob.size).toBeGreaterThan(500);
  });

  it("Table mit highlightRows + rightAlign rendert ohne Fehler", () => {
    const p = new PdfReportBase();
    p.addHeader({ title: "T", mandantName: "M" });
    p.addTable(
      ["Pos", "Text", "Betrag"],
      [
        ["1", "Ware", "100,00"],
        ["2", "Miete", "200,00"],
        ["Σ", "Summe", "300,00"],
      ],
      {
        highlightRows: [2],
        rightAlignColumns: [2],
      }
    );
    expect(p.toBlob().size).toBeGreaterThan(0);
  });
});
