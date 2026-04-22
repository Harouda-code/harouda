/**
 * DiffViewer: visueller Vergleich von `before` und `after` einer Audit-Änderung.
 *
 * Operations:
 *   - INSERT (create): nur after, grüner Hintergrund.
 *   - DELETE: nur before, roter Hintergrund.
 *   - UPDATE (update/reverse/correct/…): Two-Column-Diff mit Highlight der
 *     geänderten Felder (gelb).
 *
 * Der Renderer ist "best-effort flat": nested Objects werden als JSON
 * ausgegeben; Money-Strings (z. B. "1234.56") werden als deutsches Format
 * dargestellt, wenn das Feld-Label auf einen Geldwert hindeutet.
 */

import { useMemo } from "react";
import { Money } from "../../lib/money/Money";

export type DiffOperation =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "UNKNOWN";

export type DiffViewerProps = {
  oldData: Record<string, unknown> | null | undefined;
  newData: Record<string, unknown> | null | undefined;
  operation: DiffOperation;
};

const MONEY_KEY_REGEX =
  /betrag|sum|brutto|netto|saldo|ust|steuer|wert|kosten/i;

function looksLikeMoneyString(v: unknown): boolean {
  return typeof v === "string" && /^-?\d+\.\d{2}$/.test(v);
}

function formatValue(key: string, v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") return String(v);
  if (looksLikeMoneyString(v) && MONEY_KEY_REGEX.test(key)) {
    try {
      return new Money(v as string).toEuroFormat();
    } catch {
      return String(v);
    }
  }
  if (typeof v === "string") return v;
  // Nested: JSON-string (kompakt)
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function collectKeys(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): string[] {
  const keys = new Set<string>();
  if (a) Object.keys(a).forEach((k) => keys.add(k));
  if (b) Object.keys(b).forEach((k) => keys.add(k));
  return Array.from(keys).sort();
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function DiffViewer(props: DiffViewerProps) {
  const { oldData, newData, operation } = props;

  const keys = useMemo(
    () => collectKeys(oldData, newData),
    [oldData, newData]
  );

  const styles = {
    container: {
      display: "grid",
      gridTemplateColumns: "140px 1fr 1fr",
      gap: 0,
      fontSize: "0.85rem",
      fontFamily: "var(--font-mono, monospace)",
      border: "1px solid #eef1f6",
      borderRadius: 4,
    } as const,
    headerCell: {
      padding: "6px 10px",
      fontWeight: 700,
      background: "#f3f5f8",
      borderBottom: "1px solid #c3c8d1",
    } as const,
    keyCell: {
      padding: "4px 8px",
      background: "#f7f8fa",
      borderBottom: "1px solid #eef1f6",
      color: "var(--ink-soft)",
      whiteSpace: "nowrap",
    } as const,
    valueCell: {
      padding: "4px 8px",
      borderBottom: "1px solid #eef1f6",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    } as const,
  };

  if (operation === "INSERT" || (!oldData && newData)) {
    return (
      <div data-testid="diff-insert" style={styles.container}>
        <div style={styles.headerCell}>Feld</div>
        <div style={styles.headerCell}></div>
        <div
          style={{ ...styles.headerCell, background: "#eaf5ef", color: "#1f7a4d" }}
        >
          Neu (INSERT)
        </div>
        {keys.map((k) => (
          <DiffRow
            key={k}
            label={k}
            left=""
            right={formatValue(k, newData?.[k])}
            rightBg="#eaf5ef"
          />
        ))}
      </div>
    );
  }

  if (operation === "DELETE" || (oldData && !newData)) {
    return (
      <div data-testid="diff-delete" style={styles.container}>
        <div style={styles.headerCell}>Feld</div>
        <div
          style={{ ...styles.headerCell, background: "#fcefea", color: "#8a2c2c" }}
        >
          Alt (DELETE)
        </div>
        <div style={styles.headerCell}></div>
        {keys.map((k) => (
          <DiffRow
            key={k}
            label={k}
            left={formatValue(k, oldData?.[k])}
            leftBg="#fcefea"
            right=""
          />
        ))}
      </div>
    );
  }

  return (
    <div data-testid="diff-update" style={styles.container}>
      <div style={styles.headerCell}>Feld</div>
      <div
        style={{ ...styles.headerCell, background: "#fcefea", color: "#8a2c2c" }}
      >
        Alt
      </div>
      <div
        style={{ ...styles.headerCell, background: "#eaf5ef", color: "#1f7a4d" }}
      >
        Neu
      </div>
      {keys.map((k) => {
        const ov = oldData?.[k];
        const nv = newData?.[k];
        const changed = !isEqual(ov, nv);
        return (
          <DiffRow
            key={k}
            label={k}
            left={formatValue(k, ov)}
            right={formatValue(k, nv)}
            leftBg={changed ? "#fcefea" : undefined}
            rightBg={changed ? "#eaf5ef" : undefined}
            changedMarker={changed}
          />
        );
      })}
    </div>
  );
}

function DiffRow(props: {
  label: string;
  left: string;
  right: string;
  leftBg?: string;
  rightBg?: string;
  changedMarker?: boolean;
}) {
  return (
    <>
      <div
        data-testid={`diff-key-${props.label}`}
        style={{
          padding: "4px 8px",
          background: "#f7f8fa",
          borderBottom: "1px solid #eef1f6",
          color: "var(--ink-soft)",
          whiteSpace: "nowrap",
        }}
      >
        {props.changedMarker ? "● " : ""}
        {props.label}
      </div>
      <div
        data-testid={`diff-old-${props.label}`}
        style={{
          padding: "4px 8px",
          borderBottom: "1px solid #eef1f6",
          background: props.leftBg,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {props.left || <span style={{ color: "#c3c8d1" }}>—</span>}
      </div>
      <div
        data-testid={`diff-new-${props.label}`}
        style={{
          padding: "4px 8px",
          borderBottom: "1px solid #eef1f6",
          background: props.rightBg,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {props.right || <span style={{ color: "#c3c8d1" }}>—</span>}
      </div>
    </>
  );
}
