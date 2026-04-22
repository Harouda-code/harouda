// Sprint 15 / Schritt 2 · dsuvTypes-Tests.

import { describe, it, expect } from "vitest";
import {
  BG_VOLL_SV_PFLICHTIG,
  BG_MINIJOB,
  type DEUeVAbgabegrund,
  type Personengruppe,
  type DEUeVMeldung,
} from "../dsuvTypes";

describe("dsuvTypes · Basis-Struktur", () => {
  it("#1 Default-Beitragsgruppen: voll-SV-pflichtig = 1/1/1/1, Minijob = 6/5/0/0", () => {
    expect(BG_VOLL_SV_PFLICHTIG).toEqual({
      kv: "1",
      rv: "1",
      av: "1",
      pv: "1",
    });
    expect(BG_MINIJOB).toEqual({ kv: "6", rv: "5", av: "0", pv: "0" });
  });

  it("#2 DEUeVMeldung-Shape: minimaler gueltiger Record compiled ohne Error", () => {
    const abgabegrund: DEUeVAbgabegrund = "50";
    const personengruppe: Personengruppe = "101";
    const meldung: DEUeVMeldung = {
      abgabegrund,
      meldezeitraum_von: "2025-01-01",
      meldezeitraum_bis: "2025-12-31",
      arbeitnehmer: {
        sv_nummer: "12345678A012",
        nachname: "Mustermann",
        vorname: "Max",
        geburtsdatum: "1990-01-01",
        staatsangehoerigkeit: "DE",
        anschrift: {
          strasse: "Musterweg",
          hausnummer: "1",
          plz: "10115",
          ort: "Berlin",
        },
      },
      arbeitgeber: {
        betriebsnummer: "12345678",
        name: "Muster GmbH",
        anschrift: {
          strasse: "Firmenstr.",
          hausnummer: "99",
          plz: "10117",
          ort: "Berlin",
        },
      },
      beschaeftigung: {
        personengruppe,
        beitragsgruppe: BG_VOLL_SV_PFLICHTIG,
        taetigkeitsschluessel: "123456789",
        mehrfachbeschaeftigung: false,
      },
      entgelt: {
        brutto_rv: 45000,
        brutto_kv: 45000,
        gleitzone_flag: false,
      },
      einzugsstelle_bbnr: "01234567",
    };
    expect(meldung.abgabegrund).toBe("50");
    expect(meldung.arbeitnehmer.sv_nummer).toHaveLength(12);
    expect(meldung.arbeitgeber.betriebsnummer).toHaveLength(8);
    expect(meldung.einzugsstelle_bbnr).toHaveLength(8);
  });

  it("#3 Personengruppe-Union: nur die 5 gueltigen Werte erlaubt", () => {
    const valid: Personengruppe[] = ["101", "109", "110", "190", "900"];
    for (const v of valid) {
      // Der Compiler erlaubt es; Laufzeit-Smoke.
      expect(v).toMatch(/^(101|109|110|190|900)$/);
    }
  });
});
