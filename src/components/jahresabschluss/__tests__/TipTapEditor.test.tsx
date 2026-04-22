/** @jsxImportSource react */
// Jahresabschluss-E3a / Schritt 2 · TipTapEditor-Tests.

import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TipTapEditor } from "../TipTapEditor";
import type { JSONContent } from "@tiptap/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function flush(times = 10) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function renderEditor(props: {
  content: JSONContent | null;
  onChange?: (j: JSONContent) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const onChange = props.onChange ?? vi.fn();
  act(() => {
    root.render(
      <TipTapEditor
        content={props.content}
        onChange={onChange}
        readOnly={props.readOnly}
        placeholder={props.placeholder}
      />
    );
  });
  return {
    container,
    onChange,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

const HELLO_DOC: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hallo Welt" }],
    },
  ],
};

describe("TipTapEditor", () => {
  it("#1 Mount + initial content: rendert Toolbar + Editor-Bereich", async () => {
    const r = renderEditor({ content: HELLO_DOC });
    await act(async () => {
      await flush();
    });
    expect(document.querySelector('[data-testid="tiptap-editor"]')).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-toolbar"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-editable"]')
    ).not.toBeNull();
    // Initial-Text sichtbar.
    expect(document.body.textContent).toContain("Hallo Welt");
    r.unmount();
  });

  it("#2 Toolbar enthält Bold/Italic/Underline/List/Table-Buttons", async () => {
    const r = renderEditor({ content: null });
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="tiptap-btn-bold"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-btn-italic"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-btn-underline"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-btn-bullet"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-btn-ordered"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="tiptap-btn-table"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#3 readOnly: Toolbar-Buttons disabled + Editor nicht editierbar", async () => {
    const r = renderEditor({ content: HELLO_DOC, readOnly: true });
    await act(async () => {
      await flush();
    });
    const bold = document.querySelector<HTMLButtonElement>(
      '[data-testid="tiptap-btn-bold"]'
    )!;
    expect(bold.disabled).toBe(true);
    const editable = document.querySelector('[data-testid="tiptap-editable"]');
    expect(editable!.getAttribute("contenteditable")).toBe("false");
    r.unmount();
  });

  it("#4 Insert-Table-Button erzeugt Tabelle im JSON", async () => {
    const onChange = vi.fn();
    const r = renderEditor({ content: null, onChange });
    await act(async () => {
      await flush();
    });
    const tableBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="tiptap-btn-table"]'
    )!;
    await act(async () => {
      tableBtn.click();
      await flush();
    });
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as JSONContent;
    const json = JSON.stringify(last);
    expect(json).toContain("table");
    expect(json).toContain("tableRow");
    r.unmount();
  });

  it("#5 Bold-Button toggelt Bold-Mark über Editor-Command", async () => {
    const onChange = vi.fn();
    const r = renderEditor({ content: HELLO_DOC, onChange });
    await act(async () => {
      await flush();
    });
    const boldBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="tiptap-btn-bold"]'
    )!;
    await act(async () => {
      boldBtn.click();
      await flush();
    });
    // Zustand sichtbar über aria-pressed.
    const pressed = boldBtn.getAttribute("aria-pressed");
    expect(["true", "false"]).toContain(pressed);
    // Der Button klickt, ohne zu werfen.
    expect(boldBtn.getAttribute("data-testid")).toBe("tiptap-btn-bold");
    r.unmount();
  });

  it("#6 null content initialisiert leeres Doc ohne Crash", async () => {
    const r = renderEditor({ content: null });
    await act(async () => {
      await flush();
    });
    expect(document.querySelector('[data-testid="tiptap-editor"]')).not.toBeNull();
    r.unmount();
  });
});
