// Jahresabschluss-E3b / Schritt 2 · TocBuilder-Tests.

import { describe, it, expect } from "vitest";
import { buildToc, buildStaticToc, TOC_ID, type TocEntry } from "../TocBuilder";

const ENTRIES: TocEntry[] = [
  { label: "Bilanz", ebene: 1, seite: 3 },
  { label: "Aktiva", ebene: 2, seite: 3 },
  { label: "Passiva", ebene: 2, seite: 5 },
  { label: "Gewinn- und Verlustrechnung", ebene: 1, seite: 7 },
  { label: "Anhang", ebene: 1, seite: 9 },
];

describe("TocBuilder (pdfmake-native)", () => {
  it("#1 buildToc: liefert TOC-Container mit id + Titel", () => {
    const out = buildToc(ENTRIES);
    expect(out).toHaveLength(1);
    const toc = out[0] as { toc: { id: string; title: { text: string } } };
    expect(toc.toc.id).toBe(TOC_ID);
    expect(toc.toc.title.text).toBe("INHALTSVERZEICHNIS");
  });

  it("#2 buildToc: leere Liste -> TOC-Container ohne Crash", () => {
    const out = buildToc([]);
    expect(out).toHaveLength(1);
    const toc = out[0] as { toc: unknown };
    expect(toc.toc).toBeDefined();
  });
});

describe("TocBuilder (statisch)", () => {
  it("#3 buildStaticToc: 5 Entries -> 1 Titel + 5 Zeilen", () => {
    const out = buildStaticToc(ENTRIES);
    expect(out).toHaveLength(6); // Titel + 5 Zeilen
  });

  it("#4 Level-1 fett, Level-2 eingerückt", () => {
    const out = buildStaticToc(ENTRIES) as Array<{
      text?: unknown;
      margin?: [number, number, number, number];
    }>;
    // out[0] = Titel. out[1] = Bilanz (L1). out[2] = Aktiva (L2).
    const bilanz = out[1] as { margin: [number, number, number, number] };
    expect(bilanz.margin[0]).toBe(0);
    const aktiva = out[2] as { margin: [number, number, number, number] };
    expect(aktiva.margin[0]).toBe(20);
    // Bold-Flag in text[0].
    const bilanzText = (bilanz as unknown as { text: Array<{ bold?: boolean }> })
      .text;
    expect(bilanzText[0].bold).toBe(true);
    const aktivaText = (aktiva as unknown as { text: Array<{ bold?: boolean }> })
      .text;
    expect(aktivaText[0].bold).toBeFalsy();
  });

  it("#5 buildStaticToc: leere Liste -> nur Titel", () => {
    const out = buildStaticToc([]);
    expect(out).toHaveLength(1);
    expect((out[0] as { text: string }).text).toBe("INHALTSVERZEICHNIS");
  });

  it("#6 Seitenzahlen werden als Text in der Zeile angezeigt", () => {
    const out = buildStaticToc(ENTRIES);
    const asJson = JSON.stringify(out);
    expect(asJson).toContain('"3"');
    expect(asJson).toContain('"7"');
  });
});
