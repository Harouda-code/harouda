// Sprint 17 / Schritt 4 · BestandVeraenderungProposer-Tests.

import { describe, it, expect } from "vitest";
import { proposeBestandDelta } from "../BestandVeraenderungProposer";

describe("proposeBestandDelta", () => {
  it("#1 Mehrung (Endbestand > Anfangsbestand): Soll=Vorrat, Haben=Veraenderung", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 10_000,
      endbestand: 12_500,
      bezeichnung: "Rohstoffe",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1000",
      veraenderungs_konto_nr: "5100",
    });
    expect(r.richtung).toBe("mehrung");
    expect(r.delta).toBe(2500);
    expect(r.betrag).toBe(2500);
    expect(r.soll_konto_nr).toBe("1000");
    expect(r.haben_konto_nr).toBe("5100");
    expect(r.buchungstext).toContain("Rohstoffe");
    expect(r.buchungstext).toContain("31.12.2025");
  });

  it("#2 Minderung (Endbestand < Anfangsbestand): Soll=Veraenderung, Haben=Vorrat", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 10_000,
      endbestand: 7_500,
      bezeichnung: "Handelswaren",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1100",
      veraenderungs_konto_nr: "4800",
    });
    expect(r.richtung).toBe("minderung");
    expect(r.delta).toBe(-2500);
    expect(r.betrag).toBe(2500);
    expect(r.soll_konto_nr).toBe("4800");
    expect(r.haben_konto_nr).toBe("1100");
  });

  it("#3 Unveraendert (delta=0): richtung='unveraendert', beide null", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 5_000,
      endbestand: 5_000,
      bezeichnung: "Lager",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1000",
    });
    expect(r.richtung).toBe("unveraendert");
    expect(r.delta).toBe(0);
    expect(r.soll_konto_nr).toBeNull();
    expect(r.haben_konto_nr).toBeNull();
    expect(r.warnings).toEqual([]);
  });

  it("#4 Mehrung ohne veraenderungs_konto_nr → Haben=null + Warnung", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 1000,
      endbestand: 1500,
      bezeichnung: "Waren",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1080",
      // veraenderungs_konto_nr bewusst leer
    });
    expect(r.richtung).toBe("mehrung");
    expect(r.haben_konto_nr).toBeNull();
    expect(r.warnings.join("|")).toContain("Veraenderungs-Konto");
  });

  it("#5 Niederstwert-Flag + Begruendung bei Minderung: keine Warnung, Begruendung im Output", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 10_000,
      endbestand: 6_000,
      bezeichnung: "Rohstoffe",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1000",
      veraenderungs_konto_nr: "5100",
      niederstwert_aktiv: true,
      niederstwert_begruendung: "Marktpreis unter AK um 40%",
    });
    expect(r.warnings).toEqual([]);
    expect(r.begruendung.join("|")).toContain("§ 253 Abs. 4 HGB");
    expect(r.begruendung.join("|")).toContain("Marktpreis");
  });

  it("#6 Niederstwert-Flag ohne Begruendung → Warnung", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 10_000,
      endbestand: 6_000,
      bezeichnung: "Rohstoffe",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1000",
      veraenderungs_konto_nr: "5100",
      niederstwert_aktiv: true,
    });
    expect(r.warnings.join("|")).toContain("Begruendung");
  });

  it("#7 Niederstwert-Flag + Mehrung: Warnung 'typischerweise Minderung'", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 10_000,
      endbestand: 12_000,
      bezeichnung: "Waren",
      stichtag: "2025-12-31",
      vorrat_konto_nr: "1100",
      veraenderungs_konto_nr: "4800",
      niederstwert_aktiv: true,
      niederstwert_begruendung: "Test",
    });
    expect(r.warnings.join("|")).toMatch(/Wertminderung.*Bestandsminderung/);
  });

  it("#8 Buchungstext enthaelt Bezeichnung + Stichtag in DE-Format", () => {
    const r = proposeBestandDelta({
      anfangsbestand: 0,
      endbestand: 500,
      bezeichnung: "Fertigerzeugnisse",
      stichtag: "2025-06-30",
      vorrat_konto_nr: "1080",
      veraenderungs_konto_nr: "4800",
    });
    expect(r.buchungstext).toBe(
      "Bestandsveraenderung Fertigerzeugnisse 30.06.2025"
    );
  });
});
