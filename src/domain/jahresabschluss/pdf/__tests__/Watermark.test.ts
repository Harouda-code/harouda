// Jahresabschluss-E3b / Schritt 5 · Watermark-Tests.

import { describe, it, expect } from "vitest";
import { buildWatermark } from "../Watermark";

describe("buildWatermark", () => {
  it("#1 Minimaler Input -> Text + Defaults", () => {
    const w = buildWatermark({ text: "ENTWURF" });
    expect(w.text).toBe("ENTWURF");
    expect(w.color).toBe("#999");
    expect(w.opacity).toBe(0.2);
    expect(w.angle).toBe(-45);
    expect(w.fontSize).toBe(72);
    expect(w.bold).toBe(true);
  });

  it("#2 Override einzelner Werte wirkt, andere bleiben Default", () => {
    const w = buildWatermark({
      text: "DRAFT",
      color: "#e00",
      opacity: 0.5,
    });
    expect(w.text).toBe("DRAFT");
    expect(w.color).toBe("#e00");
    expect(w.opacity).toBe(0.5);
    expect(w.angle).toBe(-45);
    expect(w.fontSize).toBe(72);
  });

  it("#3 Volle Konfiguration durchgereicht", () => {
    const w = buildWatermark({
      text: "KOPIE",
      color: "#444",
      opacity: 0.3,
      angle: 30,
      fontSize: 48,
    });
    expect(w).toEqual({
      text: "KOPIE",
      color: "#444",
      opacity: 0.3,
      angle: 30,
      fontSize: 48,
      bold: true,
    });
  });
});
