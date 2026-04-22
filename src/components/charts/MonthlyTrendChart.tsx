/**
 * Monatsverlaufs-Diagramm (Line-Chart), reines SVG — kein recharts-Bundle.
 *
 * Zeigt 3 Serien (Umsatz grün, Ausgaben rot, Ergebnis blau) über die
 * übergebenen Monatspunkte.
 */

import { useMemo } from "react";
import { Money } from "../../lib/money/Money";

export type MonthlyTrendPoint = {
  month: string; // "2025-01"
  umsatz: number;
  ausgaben: number;
  ergebnis: number;
};

export type MonthlyTrendChartProps = {
  data: MonthlyTrendPoint[];
  width?: number;
  height?: number;
};

type Series = { name: string; color: string; key: keyof MonthlyTrendPoint };

const SERIES: Series[] = [
  { name: "Umsatz", color: "#1f7a4d", key: "umsatz" },
  { name: "Ausgaben", color: "#8a2c2c", key: "ausgaben" },
  { name: "Ergebnis", color: "#2a5ab4", key: "ergebnis" },
];

export function MonthlyTrendChart({
  data,
  width = 600,
  height = 240,
}: MonthlyTrendChartProps) {
  const { minY, maxY, points, xStep } = useMemo(() => {
    if (data.length === 0) {
      return { minY: 0, maxY: 0, points: {}, xStep: 0 };
    }
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of data) {
      for (const s of SERIES) {
        const v = p[s.key] as number;
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
    }
    // symmetrisch: Ergebnis kann negativ sein
    if (minY > 0) minY = 0;
    if (maxY === minY) maxY = minY + 1;

    const padLeft = 50;
    const padRight = 10;
    const padTop = 10;
    const padBottom = 30;
    const xStep = (width - padLeft - padRight) / Math.max(1, data.length - 1);
    const yScale = (v: number) =>
      padTop + ((maxY - v) * (height - padTop - padBottom)) / (maxY - minY);

    const pts: Record<string, string> = {};
    for (const s of SERIES) {
      pts[s.key] = data
        .map((p, i) => `${padLeft + i * xStep},${yScale(p[s.key] as number)}`)
        .join(" ");
    }
    return { minY, maxY, points: pts, xStep };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-soft)",
          fontSize: "0.85rem",
          border: "1px dashed #c3c8d1",
          borderRadius: 4,
        }}
      >
        Keine Daten
      </div>
    );
  }

  const padLeft = 50;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 30;

  // Y-Achsen-Ticks (3 Stufen)
  const yTicks = [maxY, (maxY + minY) / 2, minY];
  const yPos = (v: number) =>
    padTop + ((maxY - v) * (height - padTop - padBottom)) / (maxY - minY);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height, maxWidth: width }}
      role="img"
      aria-label="Monatsverlauf"
    >
      {/* Axes */}
      <line
        x1={padLeft}
        y1={padTop}
        x2={padLeft}
        y2={height - padBottom}
        stroke="#c3c8d1"
      />
      <line
        x1={padLeft}
        y1={height - padBottom}
        x2={width - padRight}
        y2={height - padBottom}
        stroke="#c3c8d1"
      />

      {/* Y-Ticks + Grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            y1={yPos(t)}
            x2={width - padRight}
            y2={yPos(t)}
            stroke="#eef1f6"
            strokeDasharray="2 3"
          />
          <text
            x={padLeft - 5}
            y={yPos(t) + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-soft, #98a0ad)"
          >
            {new Money(String(Math.round(t))).toEuroFormat()}
          </text>
        </g>
      ))}

      {/* Null-Linie wenn minY < 0 */}
      {minY < 0 && maxY > 0 && (
        <line
          x1={padLeft}
          y1={yPos(0)}
          x2={width - padRight}
          y2={yPos(0)}
          stroke="#15233d"
          strokeWidth={0.5}
        />
      )}

      {/* Series polylines */}
      {SERIES.map((s) => (
        <g key={s.key}>
          <polyline
            points={points[s.key]}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
          />
          {data.map((p, i) => (
            <circle
              key={`${s.key}-${i}`}
              cx={padLeft + i * xStep}
              cy={yPos(p[s.key] as number)}
              r={2.5}
              fill={s.color}
            >
              <title>{`${p.month} ${s.name}: ${new Money(String(p[s.key] as number)).toEuroFormat()}`}</title>
            </circle>
          ))}
        </g>
      ))}

      {/* X-Labels */}
      {data.map((p, i) => (
        <text
          key={p.month}
          x={padLeft + i * xStep}
          y={height - padBottom + 14}
          textAnchor="middle"
          fontSize="9"
          fill="var(--ink-soft, #98a0ad)"
        >
          {p.month.slice(5)}
        </text>
      ))}

      {/* Legend */}
      {SERIES.map((s, i) => (
        <g key={`leg-${s.key}`}>
          <line
            x1={padLeft + i * 80}
            y1={height - 6}
            x2={padLeft + i * 80 + 12}
            y2={height - 6}
            stroke={s.color}
            strokeWidth={2}
          />
          <text
            x={padLeft + i * 80 + 16}
            y={height - 3}
            fontSize="10"
            fill="var(--ink, #15233d)"
          >
            {s.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
