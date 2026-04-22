// Jahresabschluss-E2 / Schritt 2 · RulesEngine-Tests.

import { describe, it, expect } from "vitest";
import { computeBausteine } from "../RulesEngine";

describe("computeBausteine · Rules-Engine (HGB 2025)", () => {
  it("GmbH klein: anhang=true, lagebericht=false", () => {
    const r = computeBausteine({ rechtsform: "GmbH", groessenklasse: "klein" });
    expect(r.bilanz).toBe(true);
    expect(r.guv).toBe(true);
    expect(r.anhang).toBe(true);
    expect(r.lagebericht).toBe(false);
    expect(r.euer).toBe(false);
    expect(r.begruendungen.some((b) => /§ 264/.test(b))).toBe(true);
    expect(r.begruendungen.some((b) => /Befreiung.*§ 264 Abs. 1 Satz 5/.test(b))).toBe(true);
  });

  it("GmbH mittel: anhang=true, lagebericht=true", () => {
    const r = computeBausteine({ rechtsform: "GmbH", groessenklasse: "mittel" });
    expect(r.anhang).toBe(true);
    expect(r.lagebericht).toBe(true);
    expect(r.begruendungen.some((b) => /§ 289/.test(b))).toBe(true);
  });

  it("GmbH gross: anhang=true, lagebericht=true", () => {
    const r = computeBausteine({ rechtsform: "GmbH", groessenklasse: "gross" });
    expect(r.lagebericht).toBe(true);
  });

  it("UG kleinst: anhang=true, lagebericht=false", () => {
    const r = computeBausteine({ rechtsform: "UG", groessenklasse: "kleinst" });
    expect(r.bilanz).toBe(true);
    expect(r.anhang).toBe(true);
    expect(r.lagebericht).toBe(false);
  });

  it("AG gross: Kapitalgesellschaft mit Lagebericht", () => {
    const r = computeBausteine({ rechtsform: "AG", groessenklasse: "gross" });
    expect(r.anhang).toBe(true);
    expect(r.lagebericht).toBe(true);
  });

  it("GbR klein: anhang=false, lagebericht=false", () => {
    const r = computeBausteine({ rechtsform: "GbR", groessenklasse: "klein" });
    expect(r.bilanz).toBe(true);
    expect(r.guv).toBe(true);
    expect(r.anhang).toBe(false);
    expect(r.lagebericht).toBe(false);
    expect(r.begruendungen.some((b) => /Personengesellschaft/.test(b))).toBe(true);
    expect(
      r.begruendungen.some((b) => /Publizitäts-KGaA|§ 264a/.test(b))
    ).toBe(true);
  });

  it("OHG mittel: wie GbR (Personengesellschaft)", () => {
    const r = computeBausteine({ rechtsform: "OHG", groessenklasse: "mittel" });
    expect(r.anhang).toBe(false);
    expect(r.lagebericht).toBe(false);
  });

  it("Einzelunternehmen klein: euer=true, bilanz/guv=false", () => {
    const r = computeBausteine({
      rechtsform: "Einzelunternehmen",
      groessenklasse: "klein",
    });
    expect(r.euer).toBe(true);
    expect(r.bilanz).toBe(false);
    expect(r.guv).toBe(false);
    expect(r.anlagenspiegel).toBe(true);
    expect(r.anhang).toBe(false);
    expect(r.lagebericht).toBe(false);
    expect(r.begruendungen.some((b) => /§ 4 Abs. 3 EStG/.test(b))).toBe(true);
    expect(r.begruendungen.some((b) => /§ 241a/.test(b))).toBe(true);
  });

  it("SonstigerRechtsform mittel: konservativer Fallback + manuelle-Prüfung-Hinweis", () => {
    const r = computeBausteine({
      rechtsform: "SonstigerRechtsform",
      groessenklasse: "mittel",
    });
    expect(r.bilanz).toBe(true);
    expect(r.anhang).toBe(true);
    expect(r.lagebericht).toBe(true);
    expect(
      r.begruendungen.some((b) => /[Mm]anuelle Prüfung/.test(b))
    ).toBe(true);
  });

  it("Pflicht-Bausteine deckblatt/inhaltsverzeichnis/bescheinigung immer aktiv", () => {
    const r = computeBausteine({ rechtsform: "GmbH", groessenklasse: "klein" });
    expect(r.deckblatt).toBe(true);
    expect(r.inhaltsverzeichnis).toBe(true);
    expect(r.bescheinigung).toBe(true);
  });
});
