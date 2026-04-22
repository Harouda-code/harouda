/** @jsxImportSource react */
// Jahresabschluss-E3a / Schritt 5 · Integration-Smoke Editor → Converter.
//
// Kein PDF-Output in diesem Sprint — das ist E3b. Dieser Smoke stellt
// nur sicher, dass Editor (TipTap) und Converter (tiptapToPdfmake)
// auf einem realen Baustein aus der Bibliothek sauber zusammenarbeiten.

import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TipTapEditor } from "../../../components/jahresabschluss/TipTapEditor";
import { tiptapToPdfmake } from "../tiptapToPdfmake";
import {
  ANHANG_TEXTBAUSTEINE,
  TB_ID_284_METHODEN,
  TB_ID_285_1_LANGFRISTIGE_VERB,
} from "../anhangTextbausteine";
import type { JSONContent } from "@tiptap/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function flush(times = 10) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function mountEditor(initial: JSONContent): {
  latest: () => JSONContent;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latestJson: JSONContent = initial;
  const onChange = vi.fn((j: JSONContent) => {
    latestJson = j;
  });
  act(() => {
    root.render(
      <TipTapEditor content={initial} onChange={onChange} />
    );
  });
  return {
    latest: () => latestJson,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("Editor → Converter (Smoke)", () => {
  it("#1 § 284 Baustein → non-empty pdfmake-Content mit Heading + Paragraph", async () => {
    const baustein = ANHANG_TEXTBAUSTEINE.find(
      (b) => b.id === TB_ID_284_METHODEN
    )!;
    const e = mountEditor(baustein.tiptap_template);
    await act(async () => {
      await flush();
    });
    // Rohe Template-Umwandlung (kein User-Edit) muss bereits funktionieren.
    const pdfOut = tiptapToPdfmake(baustein.tiptap_template);
    expect(pdfOut.length).toBeGreaterThan(0);
    // Erstes Element: H2-Heading.
    expect(pdfOut[0]).toMatchObject({ style: "h2", bold: true });
    // Weiteres Element: Paragraph (mit Text-Array).
    const hasParagraph = pdfOut.some(
      (c) => typeof c === "object" && c !== null && "margin" in c
    );
    expect(hasParagraph).toBe(true);
    e.unmount();
  });

  it("#2 § 285 Nr. 1 Baustein (mit Tabelle) → pdfmake-Table-Struktur", async () => {
    const baustein = ANHANG_TEXTBAUSTEINE.find(
      (b) => b.id === TB_ID_285_1_LANGFRISTIGE_VERB
    )!;
    const e = mountEditor(baustein.tiptap_template);
    await act(async () => {
      await flush();
    });
    const pdfOut = tiptapToPdfmake(baustein.tiptap_template);
    // Eintrag mit `table`-Property finden.
    const tableEntry = pdfOut.find(
      (c) =>
        typeof c === "object" &&
        c !== null &&
        "table" in c &&
        typeof (c as { table: unknown }).table === "object"
    ) as { table: { body: unknown[][]; widths: string[] } } | undefined;
    expect(tableEntry).toBeDefined();
    // 2 Zeilen (Header + Daten) × 3 Spalten.
    expect(tableEntry!.table.body).toHaveLength(2);
    expect(tableEntry!.table.body[0]).toHaveLength(3);
    expect(tableEntry!.table.widths).toEqual(["auto", "auto", "auto"]);
    e.unmount();
  });

  it("#3 Alle 6 Bausteine produzieren non-empty pdfmake-Output", () => {
    for (const b of ANHANG_TEXTBAUSTEINE) {
      const out = tiptapToPdfmake(b.tiptap_template);
      expect(out.length, `Baustein ${b.id} leer`).toBeGreaterThan(0);
    }
  });
});
