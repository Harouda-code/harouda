/**
 * Mapping-Layer: TipTap-JSON → pdfmake-Content.
 *
 * Jahresabschluss-E3a / Schritt 3. Wird in E3b von der
 * Document-Merge-Routine verwendet, um editierte Textbausteine als
 * Teil des Gesamt-Dokuments zu serialisieren.
 *
 * Design-Regel: defensiv — unbekannte Node-Types werfen NICHT,
 * sondern werden als Plain-Text extrahiert (fallback) mit einem
 * Console-Warn. Das verhindert, dass ein veraltetes TipTap-Schema
 * (z. B. aus einer persistierten Session) den PDF-Export komplett
 * brechen kann.
 */
import type { JSONContent } from "@tiptap/react";
import type { Content } from "pdfmake/interfaces";

type Mark = { type: string; attrs?: Record<string, unknown> };

/** Innere Knoten (text/inline) werden zu pdfmake-Text-Objekten.
 *  Runtime-Shape ist mit pdfmake kompatibel; strikte Typung ist hier
 *  bewusst locker, da pdfmake interne Disjunktion (ContentText vs.
 *  ContentImage…) mit ForbidOtherElementProperties nutzt. */
type InlineOut = string | { text: string; [k: string]: unknown };

function extractPlainText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (!Array.isArray(node.content)) return "";
  return node.content.map(extractPlainText).join("");
}

function mapTextNode(node: JSONContent): InlineOut {
  const text = node.text ?? "";
  const marks: Mark[] = (node.marks as Mark[]) ?? [];
  if (marks.length === 0) return text;
  const out: { text: string; [k: string]: unknown } = { text };
  for (const m of marks) {
    if (m.type === "bold") out.bold = true;
    else if (m.type === "italic") out.italics = true;
    else if (m.type === "underline") out.decoration = "underline";
    // Unbekannte Marks werden stillschweigend verworfen.
  }
  return out;
}

function mapInlineArray(nodes: JSONContent[] | undefined): InlineOut[] {
  if (!nodes || nodes.length === 0) return [""];
  const out: InlineOut[] = [];
  for (const n of nodes) {
    if (n.type === "text") out.push(mapTextNode(n));
    else if (n.type === "hardBreak") out.push("\n");
    else {
      // Andere Inline-Nodes: auf Plain-Text degradieren.
      const t = extractPlainText(n);
      if (t) out.push(t);
    }
  }
  return out.length === 0 ? [""] : out;
}

function mapParagraph(node: JSONContent): Content {
  return {
    text: mapInlineArray(node.content) as unknown as Content,
    margin: [0, 0, 0, 8],
  };
}

function mapHeading(node: JSONContent): Content {
  const level = (node.attrs as { level?: number } | undefined)?.level ?? 1;
  const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12;
  const margin: [number, number, number, number] =
    level === 1 ? [0, 12, 0, 8] : level === 2 ? [0, 10, 0, 6] : [0, 8, 0, 4];
  return {
    text: mapInlineArray(node.content) as unknown as Content,
    style: `h${level}`,
    fontSize,
    bold: true,
    margin,
  };
}

function mapListItem(node: JSONContent): Content {
  if (!Array.isArray(node.content) || node.content.length === 0) return "";
  // Typischer Fall: listItem enthält genau eine paragraph — wir
  // collapsen das auf die Inline-Kinder, damit pdfmake keine
  // doppelten Zeilen zeichnet.
  if (node.content.length === 1 && node.content[0].type === "paragraph") {
    return {
      text: mapInlineArray(node.content[0].content) as unknown as Content,
    };
  }
  // Verschachtelte Listen / mehrere Blöcke: komplette Node-Abbildung.
  const inner = mapChildren(node.content);
  return inner.length === 1 ? inner[0] : { stack: inner };
}

function mapBulletList(node: JSONContent): Content {
  const items = (node.content ?? []).map(mapListItem).filter((x) => x !== "");
  return { ul: items as Content[] };
}

function mapOrderedList(node: JSONContent): Content {
  const items = (node.content ?? []).map(mapListItem).filter((x) => x !== "");
  return { ol: items as Content[] };
}

function mapTableCell(node: JSONContent): Content {
  const inner = mapChildren(node.content ?? []);
  if (inner.length === 0) return "";
  if (inner.length === 1) return inner[0];
  return { stack: inner };
}

function mapTableRow(node: JSONContent): Content[] {
  return (node.content ?? []).map(mapTableCell);
}

function mapTable(node: JSONContent): Content | null {
  const rows = (node.content ?? [])
    .map((r) => mapTableRow(r))
    .filter((row) => {
      if (row.length === 0) {
         
        console.warn("[tiptapToPdfmake] Leere Tabellen-Zeile übersprungen.");
        return false;
      }
      return true;
    });
  if (rows.length === 0) return null;
  return {
    table: {
      body: rows,
      widths: rows[0].map(() => "auto" as const),
    },
  };
}

function mapNode(node: JSONContent): Content | Content[] | null {
  switch (node.type) {
    case "paragraph":
      return mapParagraph(node);
    case "heading":
      return mapHeading(node);
    case "bulletList":
      return mapBulletList(node);
    case "orderedList":
      return mapOrderedList(node);
    case "table":
      return mapTable(node);
    case "text":
      return {
        text: [mapTextNode(node)] as unknown as Content,
      };
    case "hardBreak":
      return "\n";
    default: {
       
      console.warn(
        `[tiptapToPdfmake] Unbekannter Node-Type "${node.type}" — Fallback auf Plain-Text.`
      );
      const t = extractPlainText(node);
      return t ? { text: t, margin: [0, 0, 0, 8] as [number, number, number, number] } : null;
    }
  }
}

function mapChildren(nodes: JSONContent[]): Content[] {
  const out: Content[] = [];
  for (const n of nodes) {
    const c = mapNode(n);
    if (c === null) continue;
    if (Array.isArray(c)) out.push(...c);
    else out.push(c);
  }
  return out;
}

/**
 * Haupt-Export: TipTap-Doc → pdfmake-Content-Array.
 * Leerer oder null-Input → leeres Array.
 */
export function tiptapToPdfmake(
  tiptapJson: JSONContent | null | undefined
): Content[] {
  if (!tiptapJson) return [];
  if (tiptapJson.type === "doc") {
    return mapChildren(tiptapJson.content ?? []);
  }
  // Input ist bereits ein einzelner Node (z. B. direkt ein Paragraph).
  const out = mapNode(tiptapJson);
  if (out === null) return [];
  return Array.isArray(out) ? out : [out];
}
