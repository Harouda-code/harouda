/**
 * TipTap-Rich-Text-Editor fuer Jahresabschluss-E3a.
 *
 * Scope (bewusst konservativ):
 *  - Bold / Italic / Underline
 *  - Bullet + Ordered Lists
 *  - Simple Tables (2 x 2 Default, Tab/Shift-Tab fuer Zellen-Navigation)
 *  - Keine Color-Picker, keine Font-Family-Wahl, keine Images —
 *    Schwarz-Weiss-Druckqualitaet fuer GoBD-Selectable-Text-Anforderung.
 *
 * Performance-Hinweis: Fuer Anhang-Texte > 5000 Woerter ggf. Lazy-Loading
 * einfuehren (chunked-Doc oder Pagination). Aktuell keine Limitierung.
 */
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Table as TableIcon,
} from "lucide-react";

export type TipTapEditorProps = {
  content: JSONContent | null;
  onChange: (json: JSONContent) => void;
  readOnly?: boolean;
  placeholder?: string;
};

const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

export function TipTapEditor({
  content,
  onChange,
  readOnly = false,
  placeholder,
}: TipTapEditorProps) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content ?? EMPTY_DOC,
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON());
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "data-testid": "tiptap-editable",
        class: "tiptap-editor__content",
      },
    },
    immediatelyRender: false,
  });

  // Switch readOnly zur Laufzeit.
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) {
    return (
      <div
        data-testid="tiptap-loading"
        style={{ minHeight: 300, border: "1px solid var(--border, #c3c8d1)" }}
      />
    );
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 8px",
    border: "1px solid var(--border, #c3c8d1)",
    background: active ? "var(--ivory-200, #eee)" : "var(--bg, #fff)",
    cursor: readOnly ? "not-allowed" : "pointer",
    opacity: readOnly ? 0.55 : 1,
    color: "var(--fg, #111)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
  });

  return (
    <div
      data-testid="tiptap-editor"
      style={{
        border: "1px solid var(--border, #c3c8d1)",
        borderRadius: 4,
        background: "var(--bg, #fff)",
        color: "var(--fg, #111)",
      }}
    >
      <div
        role="toolbar"
        aria-label="Formatierung"
        data-testid="tiptap-toolbar"
        style={{
          display: "flex",
          gap: 4,
          padding: 6,
          borderBottom: "1px solid var(--border, #c3c8d1)",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={btnStyle(editor.isActive("bold"))}
          data-testid="tiptap-btn-bold"
          aria-pressed={editor.isActive("bold")}
          title="Fett (Strg+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={btnStyle(editor.isActive("italic"))}
          data-testid="tiptap-btn-italic"
          aria-pressed={editor.isActive("italic")}
          title="Kursiv (Strg+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={btnStyle(editor.isActive("underline"))}
          data-testid="tiptap-btn-underline"
          aria-pressed={editor.isActive("underline")}
          title="Unterstrichen (Strg+U)"
        >
          <UnderlineIcon size={14} />
        </button>
        <span style={{ width: 8 }} />
        <button
          type="button"
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={btnStyle(editor.isActive("bulletList"))}
          data-testid="tiptap-btn-bullet"
          aria-pressed={editor.isActive("bulletList")}
          title="Aufzählung"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={btnStyle(editor.isActive("orderedList"))}
          data-testid="tiptap-btn-ordered"
          aria-pressed={editor.isActive("orderedList")}
          title="Nummerierte Liste"
        >
          <ListOrdered size={14} />
        </button>
        <span style={{ width: 8 }} />
        <button
          type="button"
          disabled={readOnly}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
              .run()
          }
          style={btnStyle(false)}
          data-testid="tiptap-btn-table"
          title="Tabelle einfügen (2x2)"
        >
          <TableIcon size={14} />
        </button>
      </div>

      <div
        style={{
          minHeight: 300,
          maxHeight: 600,
          overflowY: "auto",
          padding: 12,
          fontSize: "0.92rem",
          lineHeight: 1.5,
        }}
        data-placeholder={placeholder ?? ""}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
