import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { OcrPage } from "../utils/ocr";
import "./OcrOverlay.css";

type OcrOverlayProps = {
  pages: OcrPage[];
  /** Schwelle für "hoch" (Default 90) und "mittel" (Default 70). */
  thresholds?: { high: number; medium: number };
};

export function OcrOverlay({ pages, thresholds }: OcrOverlayProps) {
  const t = thresholds ?? { high: 90, medium: 70 };
  const [showOverlay, setShowOverlay] = useState(true);
  const [pageIdx, setPageIdx] = useState(0);

  const page = pages[pageIdx];
  const stats = useMemo(() => {
    if (!page) return { total: 0, high: 0, medium: 0, low: 0 };
    let high = 0,
      medium = 0,
      low = 0;
    for (const w of page.words) {
      if (w.confidence >= t.high) high++;
      else if (w.confidence >= t.medium) medium++;
      else low++;
    }
    return { total: page.words.length, high, medium, low };
  }, [page, t.high, t.medium]);

  if (pages.length === 0) return null;

  return (
    <div className="ocrov">
      <header className="ocrov__head">
        <div className="ocrov__tabs">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`ocrov__tab ${i === pageIdx ? "is-active" : ""}`}
              onClick={() => setPageIdx(i)}
            >
              Seite {i + 1}
            </button>
          ))}
        </div>

        <div className="ocrov__legend">
          <span className="ocrov__legend-item is-high">
            {stats.high} hoch
          </span>
          <span className="ocrov__legend-item is-medium">
            {stats.medium} mittel
          </span>
          <span className="ocrov__legend-item is-low">
            {stats.low} niedrig
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setShowOverlay((v) => !v)}
          aria-pressed={showOverlay}
        >
          {showOverlay ? <EyeOff size={12} /> : <Eye size={12} />}
          {showOverlay ? "Overlay aus" : "Overlay an"}
        </button>
      </header>

      {page && (
        <div
          className="ocrov__viewport"
          style={{
            // Seitenverhältnis halten
            aspectRatio: `${page.width} / ${page.height}`,
          }}
        >
          <img
            src={page.imageDataUrl}
            alt={`Seite ${pageIdx + 1}`}
            className="ocrov__img"
          />
          {showOverlay && (
            <svg
              className="ocrov__svg"
              viewBox={`0 0 ${page.width} ${page.height}`}
              preserveAspectRatio="none"
            >
              {page.words.map((w, i) => {
                const c = w.confidence;
                const cls =
                  c >= t.high
                    ? "is-high"
                    : c >= t.medium
                      ? "is-medium"
                      : "is-low";
                return (
                  <g key={i} className={`ocrov__word ${cls}`}>
                    <rect
                      x={w.bbox.x0}
                      y={w.bbox.y0}
                      width={Math.max(1, w.bbox.x1 - w.bbox.x0)}
                      height={Math.max(1, w.bbox.y1 - w.bbox.y0)}
                    />
                    <title>
                      „{w.text}" · Konfidenz {Math.round(c)} %
                    </title>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      )}

      <footer className="ocrov__foot">
        <small>
          Farben zeigen die ROH-Konfidenz von Tesseract.js pro Wort.
          <strong> Ehrlich:</strong> die Boxen sind NICHT mit den extrahierten
          Feldern verknüpft — Tesseract liefert nur die Wort-Ebene.
        </small>
      </footer>
    </div>
  );
}
