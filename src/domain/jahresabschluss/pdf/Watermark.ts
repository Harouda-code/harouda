/**
 * Watermark-Infrastruktur fuer den Jahresabschluss-PDF-Export
 * (Sprint E3b / Schritt 5).
 *
 * Verwendung: bei `berichtsart === "Entwurf"` setzt die Document-
 * Merge-Pipeline docDefinition.watermark auf das Resultat von
 * buildWatermark(). pdfmake rendert den diagonalen Text dann
 * automatisch auf JEDER Seite des Dokuments — keine seitenweise
 * Wiederholung im Code noetig.
 */
import type { Watermark } from "pdfmake/interfaces";

export type WatermarkConfig = {
  text: string;
  color?: string;
  opacity?: number;
  angle?: number;
  fontSize?: number;
};

/**
 * Baut die pdfmake-Watermark-Definition.
 *
 * Defaults:
 *  - color   = "#999"  (dezentes Grau, bleibt bei S/W-Druck lesbar).
 *  - opacity = 0.2     (deutlich sichtbar, stoert den Fließtext nicht).
 *  - angle   = -45     (klassisches „Draft"-Wasserzeichen, diagonal
 *                      von unten-links nach oben-rechts).
 *  - fontSize = 72     (füllt bei A4 den mittleren Bereich).
 *  - bold    = true    (nicht konfigurierbar, Warn-Konvention).
 */
export function buildWatermark(config: WatermarkConfig): Watermark {
  return {
    text: config.text,
    color: config.color ?? "#999",
    opacity: config.opacity ?? 0.2,
    angle: config.angle ?? -45,
    fontSize: config.fontSize ?? 72,
    bold: true,
  };
}
