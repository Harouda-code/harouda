import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Props<T> = {
  rows: T[];
  /** Feste Zeilenhöhe in Pixeln. Alle Zeilen müssen gleich hoch sein. */
  rowHeight: number;
  /** Maximale sichtbare Höhe; Scroll-Container nutzt diese als max-height. */
  viewportHeight?: number;
  /** Renderer pro Zeile (bekommt Index und Zeile). */
  renderRow: (row: T, index: number) => ReactNode;
  /** Header-Render (optional). Bleibt oben sticky. */
  header?: ReactNode;
  /** Zusatzpuffer-Zeilen oberhalb/unterhalb des Viewports. */
  overscan?: number;
  className?: string;
};

/**
 * Einfacher Virtualizer für Tabellen mit konstanter Zeilenhöhe.
 * Rendert nur die Zeilen im Viewport (±overscan). Für ~10.000 Einträge
 * ausreichend — kein zusätzliches npm-Paket nötig. Erwartet ein
 * <table>-Layout und eine feste rowHeight.
 */
export function VirtualTable<T>({
  rows,
  rowHeight,
  viewportHeight = 560,
  renderRow,
  header,
  overscan = 8,
  className = "",
}: Props<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(viewportHeight);

  const onScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setScrollTop(scrollRef.current.scrollTop);
  }, []);

  useEffect(() => {
    function measure() {
      if (!scrollRef.current) return;
      setContainerHeight(scrollRef.current.clientHeight || viewportHeight);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [viewportHeight]);

  const totalHeight = rows.length * rowHeight;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / rowHeight) - overscan
  );
  const visibleCount =
    Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = Math.max(0, totalHeight - endIndex * rowHeight);

  const visibleRows = rows.slice(startIndex, endIndex);

  const scrollStyle: CSSProperties = {
    maxHeight: viewportHeight,
    overflowY: "auto",
    overflowX: "auto",
    contain: "strict",
    willChange: "transform",
  };

  return (
    <div
      ref={scrollRef}
      className={`vtable ${className}`}
      style={scrollStyle}
      onScroll={onScroll}
    >
      <table className="vtable__table">
        {header}
        <tbody>
          {paddingTop > 0 && (
            <tr
              aria-hidden="true"
              style={{ height: paddingTop }}
              className="vtable__spacer"
            >
              <td />
            </tr>
          )}
          {visibleRows.map((row, i) =>
            renderRow(row, startIndex + i)
          )}
          {paddingBottom > 0 && (
            <tr
              aria-hidden="true"
              style={{ height: paddingBottom }}
              className="vtable__spacer"
            >
              <td />
            </tr>
          )}
        </tbody>
      </table>
      {rows.length > 0 && (
        <div className="vtable__meta" aria-live="polite">
          Zeilen {startIndex + 1}–{endIndex} von {rows.length}
        </div>
      )}
    </div>
  );
}
