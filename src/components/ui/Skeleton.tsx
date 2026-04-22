import type { CSSProperties } from "react";
import "./Skeleton.css";

type Variant = "line" | "block" | "circle";

type SkeletonProps = {
  variant?: Variant;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Pulsierendes Platzhalter-Element während Daten geladen werden.
 * Typische Anwendung: Listen mit noch unbekannter Anzahl Zeilen, Cards,
 * Avatare. Ersetzt den bisher ad-hoc verwendeten Loader2-Spinner.
 */
export function Skeleton({
  variant = "line",
  width,
  height,
  className = "",
  style = {},
}: SkeletonProps) {
  return (
    <span
      className={`skeleton skeleton--${variant} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      aria-busy="true"
      aria-live="polite"
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          width={i === lines - 1 ? "60%" : "100%"}
          height={12}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="skeleton-table" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table__row">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              variant="line"
              height={14}
              width={c === 0 ? "25%" : c === columns - 1 ? "15%" : "30%"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
