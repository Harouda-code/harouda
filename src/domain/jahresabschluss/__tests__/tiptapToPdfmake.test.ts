// Jahresabschluss-E3a / Schritt 3 · tiptapToPdfmake-Tests.

import { describe, it, expect, vi, afterEach } from "vitest";
import { tiptapToPdfmake } from "../tiptapToPdfmake";
import type { JSONContent } from "@tiptap/react";

afterEach(() => {
  vi.restoreAllMocks();
});

function doc(...nodes: JSONContent[]): JSONContent {
  return { type: "doc", content: nodes };
}
function p(...inline: JSONContent[]): JSONContent {
  return { type: "paragraph", content: inline };
}
function t(
  text: string,
  marks?: Array<"bold" | "italic" | "underline">
): JSONContent {
  return {
    type: "text",
    text,
    ...(marks && marks.length > 0
      ? { marks: marks.map((m) => ({ type: m })) }
      : {}),
  };
}

describe("tiptapToPdfmake", () => {
  it("#1 Plain paragraph", () => {
    const out = tiptapToPdfmake(doc(p(t("Hallo Welt"))));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      text: ["Hallo Welt"],
      margin: [0, 0, 0, 8],
    });
  });

  it("#2 Bold + italic + underline Marks", () => {
    const out = tiptapToPdfmake(
      doc(
        p(
          t("Fett", ["bold"]),
          t(" kursiv", ["italic"]),
          t(" unterstrichen", ["underline"])
        )
      )
    );
    const first = out[0] as { text: unknown[] };
    expect(first.text[0]).toMatchObject({ text: "Fett", bold: true });
    expect(first.text[1]).toMatchObject({ text: " kursiv", italics: true });
    expect(first.text[2]).toMatchObject({
      text: " unterstrichen",
      decoration: "underline",
    });
  });

  it("#3 Bold+Italic-Kombi an einem Text-Knoten", () => {
    const out = tiptapToPdfmake(
      doc(p(t("Beides", ["bold", "italic"])))
    ) as Array<{ text: unknown[] }>;
    expect(out[0].text[0]).toMatchObject({
      text: "Beides",
      bold: true,
      italics: true,
    });
  });

  it("#4 Heading H1 / H2 / H3 mit bold + margin", () => {
    const out = tiptapToPdfmake(
      doc(
        { type: "heading", attrs: { level: 1 }, content: [t("Titel")] },
        { type: "heading", attrs: { level: 2 }, content: [t("Unterabschnitt")] },
        { type: "heading", attrs: { level: 3 }, content: [t("Detail")] }
      )
    );
    expect(out[0]).toMatchObject({
      style: "h1",
      fontSize: 16,
      bold: true,
      margin: [0, 12, 0, 8],
    });
    expect(out[1]).toMatchObject({
      style: "h2",
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 6],
    });
    expect(out[2]).toMatchObject({
      style: "h3",
      fontSize: 12,
      bold: true,
      margin: [0, 8, 0, 4],
    });
  });

  it("#5 Bullet list -> ul", () => {
    const out = tiptapToPdfmake(
      doc({
        type: "bulletList",
        content: [
          { type: "listItem", content: [p(t("Erster"))] },
          { type: "listItem", content: [p(t("Zweiter"))] },
        ],
      })
    );
    expect(out[0]).toMatchObject({ ul: expect.any(Array) });
    const ul = (out[0] as { ul: Array<{ text: unknown[] }> }).ul;
    expect(ul).toHaveLength(2);
    expect(ul[0].text[0]).toBe("Erster");
  });

  it("#6 Ordered list -> ol", () => {
    const out = tiptapToPdfmake(
      doc({
        type: "orderedList",
        content: [
          { type: "listItem", content: [p(t("A"))] },
          { type: "listItem", content: [p(t("B"))] },
        ],
      })
    );
    expect(out[0]).toMatchObject({ ol: expect.any(Array) });
    const ol = (out[0] as { ol: Array<{ text: unknown[] }> }).ol;
    expect(ol).toHaveLength(2);
  });

  it("#7 Simple 2x2 Tabelle", () => {
    const out = tiptapToPdfmake(
      doc({
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableHeader", content: [p(t("Spalte A"))] },
              { type: "tableHeader", content: [p(t("Spalte B"))] },
            ],
          },
          {
            type: "tableRow",
            content: [
              { type: "tableCell", content: [p(t("1"))] },
              { type: "tableCell", content: [p(t("2"))] },
            ],
          },
        ],
      })
    );
    const tbl = out[0] as {
      table: { body: unknown[][]; widths: string[] };
    };
    expect(tbl.table.body).toHaveLength(2);
    expect(tbl.table.body[0]).toHaveLength(2);
    expect(tbl.table.widths).toEqual(["auto", "auto"]);
  });

  it("#8 Verschachtelte Liste (bulletList in listItem)", () => {
    const out = tiptapToPdfmake(
      doc({
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              p(t("Haupt")),
              {
                type: "bulletList",
                content: [
                  { type: "listItem", content: [p(t("Sub-1"))] },
                  { type: "listItem", content: [p(t("Sub-2"))] },
                ],
              },
            ],
          },
        ],
      })
    );
    const ul = out[0] as { ul: unknown[] };
    expect(ul.ul).toHaveLength(1);
    // Das eine Item ist ein stack mit [Paragraph, Nested-ul].
    const item = ul.ul[0] as { stack: unknown[] };
    expect(Array.isArray(item.stack)).toBe(true);
    expect((item.stack[1] as { ul: unknown[] }).ul).toHaveLength(2);
  });

  it("#9 Unbekannter Node-Type -> console.warn + Fallback auf Plain-Text", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = tiptapToPdfmake(
      doc({
        type: "customWeirdNode",
        content: [t("Fallback-Text")],
      })
    );
    expect(warn).toHaveBeenCalled();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ text: "Fallback-Text" });
  });

  it("#10 Empty doc -> []", () => {
    expect(tiptapToPdfmake(doc())).toEqual([]);
    expect(tiptapToPdfmake(null)).toEqual([]);
    expect(tiptapToPdfmake(undefined)).toEqual([]);
  });

  it("#11 Leere Tabellen-Zeile -> uebersprungen mit Warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = tiptapToPdfmake(
      doc({
        type: "table",
        content: [
          { type: "tableRow", content: [] },
          {
            type: "tableRow",
            content: [{ type: "tableCell", content: [p(t("x"))] }],
          },
        ],
      })
    );
    expect(warn).toHaveBeenCalled();
    const tbl = out[0] as { table: { body: unknown[][] } };
    expect(tbl.table.body).toHaveLength(1);
  });

  it("#12 HardBreak innerhalb Paragraph wird zu newline-Marker", () => {
    const out = tiptapToPdfmake(
      doc(p(t("Vor"), { type: "hardBreak" }, t("Nach")))
    );
    const para = out[0] as { text: unknown[] };
    expect(para.text).toContain("\n");
  });
});
