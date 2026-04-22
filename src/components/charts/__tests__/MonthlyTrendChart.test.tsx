/** @jsxImportSource react */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MonthlyTrendChart } from "../MonthlyTrendChart";

describe("MonthlyTrendChart", () => {
  it("Leere Daten → 'Keine Daten'-Placeholder, kein SVG", () => {
    const html = renderToStaticMarkup(<MonthlyTrendChart data={[]} />);
    expect(html).toContain("Keine Daten");
    expect(html).not.toContain("<svg");
  });

  it("Rendert SVG mit 3 Polylines für Umsatz/Ausgaben/Ergebnis", () => {
    const html = renderToStaticMarkup(
      <MonthlyTrendChart
        data={[
          { month: "2025-01", umsatz: 10000, ausgaben: 4000, ergebnis: 6000 },
          { month: "2025-02", umsatz: 12000, ausgaben: 5000, ergebnis: 7000 },
          { month: "2025-03", umsatz: 9000, ausgaben: 3000, ergebnis: 6000 },
        ]}
      />
    );
    expect(html).toContain("<svg");
    // 3 Polylines
    const polylines = html.match(/<polyline/g) ?? [];
    expect(polylines.length).toBe(3);
    // Legend-Text
    expect(html).toContain("Umsatz");
    expect(html).toContain("Ausgaben");
    expect(html).toContain("Ergebnis");
  });

  it("Tooltip-Titel enthält Money-Format mit Euro", () => {
    const html = renderToStaticMarkup(
      <MonthlyTrendChart
        data={[{ month: "2025-01", umsatz: 1500, ausgaben: 500, ergebnis: 1000 }]}
      />
    );
    expect(html).toContain("€");
    // Werte irgendwo als Text
    expect(html).toMatch(/1\.500,00|500,00|1\.000,00/);
  });

  it("Negativer Ergebniswert: Nullline wird gezeichnet", () => {
    const html = renderToStaticMarkup(
      <MonthlyTrendChart
        data={[
          { month: "2025-01", umsatz: 1000, ausgaben: 500, ergebnis: 500 },
          { month: "2025-02", umsatz: 500, ausgaben: 1500, ergebnis: -1000 },
        ]}
      />
    );
    // Stroke color "#15233d" wird für die Null-Linie verwendet
    expect(html).toContain("#15233d");
  });

  it("X-Labels zeigen Monatsteil (MM) des ISO-Datums", () => {
    const html = renderToStaticMarkup(
      <MonthlyTrendChart
        data={[
          { month: "2025-03", umsatz: 100, ausgaben: 50, ergebnis: 50 },
        ]}
      />
    );
    expect(html).toContain(">03<");
  });
});
