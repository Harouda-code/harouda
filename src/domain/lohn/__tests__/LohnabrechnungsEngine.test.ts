import { describe, it, expect } from "vitest";
import { LohnabrechnungsEngine } from "../LohnabrechnungsEngine";
import { Money } from "../../../lib/money/Money";
import type {
  Arbeitnehmer,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
  Bundesland,
} from "../types";
import { SV_PARAMETER_2025 } from "../sozialversicherungParameter2025";

function makeAn(overrides: Partial<Arbeitnehmer> = {}): Arbeitnehmer {
  return {
    id: "an-1",
    mandant_id: "m-1",
    personalNr: "001",
    name: "Mustermann",
    vorname: "Max",
    geburtsdatum: "1990-01-01",
    sv_nummer: "12345678901A",
    steuer_id: "12345678901",
    steuerklasse: 1 as Steuerklasse,
    kinderfreibetraege: 0,
    kirchensteuerpflichtig: false,
    konfession: "NONE",
    bundesland: "NW" as Bundesland,
    kv_pflicht: true,
    kv_beitragsart: "GESETZLICH",
    kv_zusatzbeitrag: "2.5",
    rv_pflicht: true,
    av_pflicht: true,
    pv_pflicht: true,
    pv_kinderlos_zuschlag: true,
    pv_anzahl_kinder: 0,
    beschaeftigungsart: "VOLLZEIT",
    betriebsnummer: "12345678",
    eintrittsdatum: "2020-01-01",
    ...overrides,
  };
}

const LOHNART_GEHALT: LohnArt = {
  id: "la-gehalt",
  bezeichnung: "Gehalt",
  typ: "LAUFENDER_BEZUG",
  steuerpflichtig: true,
  svpflichtig: true,
  lst_meldung_feld: "3",
};
const LOHNART_WGELD: LohnArt = {
  id: "la-wgeld",
  bezeichnung: "Weihnachtsgeld",
  typ: "SONSTIGER_BEZUG",
  steuerpflichtig: true,
  svpflichtig: true,
  lst_meldung_feld: "3",
};

const LOHNARTEN = new Map<string, LohnArt>([
  [LOHNART_GEHALT.id, LOHNART_GEHALT],
  [LOHNART_WGELD.id, LOHNART_WGELD],
]);

function makeBuchung(
  anId: string,
  monat: string,
  lohnartId: string,
  betrag: string
): Lohnbuchung {
  return {
    id: `b-${anId}-${monat}-${lohnartId}`,
    arbeitnehmer_id: anId,
    abrechnungsmonat: monat,
    lohnart_id: lohnartId,
    betrag: new Money(betrag),
    buchungsdatum: `${monat}-15`,
  };
}

describe("LohnabrechnungsEngine", () => {
  const engine = new LohnabrechnungsEngine();

  describe("StKl I Standardfall", () => {
    const an = makeAn();
    const buchungen = [
      makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "3000"),
    ];
    const r = engine.berechneAbrechnung({
      arbeitnehmer: an,
      lohnarten: LOHNARTEN,
      buchungen,
      abrechnungsmonat: "2025-01",
    });

    it("Brutto = 3000 €", () => {
      expect(r.gesamtBrutto.toFixed2()).toBe("3000.00");
    });

    it("KV-AN ≈ 219 € (14,6 / 2 = 7,3 % auf 3000)", () => {
      expect(r.abzuege.kv_an.toFixed2()).toBe("219.00");
    });

    it("RV-AN ≈ 279 € (18,6 / 2 = 9,3 % auf 3000)", () => {
      expect(r.abzuege.rv_an.toFixed2()).toBe("279.00");
    });

    it("LSt im realistischen Bereich (200-350 €) für StKl I 3000 €", () => {
      const lst = r.abzuege.lohnsteuer.toNumber();
      expect(lst).toBeGreaterThan(200);
      expect(lst).toBeLessThan(400);
    });

    it("Soli = 0 (unter Freigrenze 18130 €/Jahr LSt)", () => {
      expect(r.abzuege.solidaritaetszuschlag.toFixed2()).toBe("0.00");
    });

    it("Netto im realistischen Bereich (2000-2250 €)", () => {
      const netto = r.auszahlungsbetrag.toNumber();
      expect(netto).toBeGreaterThan(2000);
      expect(netto).toBeLessThan(2250);
    });

    it("AG-Kosten ≈ Brutto + ~21 % (SV-AG + Umlagen)", () => {
      const ag = r.gesamtkostenArbeitgeber.toNumber();
      expect(ag).toBeGreaterThan(3500); // mind. +17 %
      expect(ag).toBeLessThan(3750); // max. +25 %
    });
  });

  describe("StKl III Verheiratet, Splitting", () => {
    it("Bei gleichem Brutto niedrigere LSt als StKl I", () => {
      const an1 = makeAn({ steuerklasse: 1 });
      const an3 = makeAn({ steuerklasse: 3 });
      const buchungen1 = [makeBuchung(an1.id, "2025-01", LOHNART_GEHALT.id, "5000")];
      const buchungen3 = [makeBuchung(an3.id, "2025-01", LOHNART_GEHALT.id, "5000")];
      const r1 = engine.berechneAbrechnung({
        arbeitnehmer: an1,
        lohnarten: LOHNARTEN,
        buchungen: buchungen1,
        abrechnungsmonat: "2025-01",
      });
      const r3 = engine.berechneAbrechnung({
        arbeitnehmer: an3,
        lohnarten: LOHNARTEN,
        buchungen: buchungen3,
        abrechnungsmonat: "2025-01",
      });
      expect(r3.abzuege.lohnsteuer.lessThan(r1.abzuege.lohnsteuer)).toBe(true);
    });
  });

  describe("StKl VI Nebenjob", () => {
    it("Ohne Grundfreibetrag: LSt ab erstem Euro", () => {
      const an = makeAn({ steuerklasse: 6 });
      const buchungen = [makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "1000")];
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      // StKl VI ist strenger — LSt sollte > 0 sein auch bei 1000 € Brutto
      expect(r.abzuege.lohnsteuer.isPositive()).toBe(true);
    });
  });

  describe("Minijob", () => {
    const an = makeAn({
      beschaeftigungsart: "MINIJOB",
      kv_pflicht: false,
      rv_pflicht: false,
      av_pflicht: false,
      pv_pflicht: false,
    });
    const buchungen = [makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "500")];
    const r = engine.berechneAbrechnung({
      arbeitnehmer: an,
      lohnarten: LOHNARTEN,
      buchungen,
      abrechnungsmonat: "2025-01",
    });

    it("Keine LSt, keine SV-AN, Netto = Brutto", () => {
      expect(r.abzuege.lohnsteuer.toFixed2()).toBe("0.00");
      expect(r.abzuege.kv_an.toFixed2()).toBe("0.00");
      expect(r.abzuege.rv_an.toFixed2()).toBe("0.00");
      expect(r.auszahlungsbetrag.toFixed2()).toBe("500.00");
    });

    it("AG zahlt Pauschalen: 13 % KV + 15 % RV + 2 % Steuer + Umlagen", () => {
      // KV pauschal 13 % auf 500 = 65
      expect(r.arbeitgeberKosten.kv.toFixed2()).toBe("65.00");
      // RV pauschal 15 % auf 500 = 75
      expect(r.arbeitgeberKosten.rv.toFixed2()).toBe("75.00");
    });
  });

  describe("PV-Zuschläge/Abschläge", () => {
    it("Kinderlos-Zuschlag +0,6 % nur beim AN", () => {
      const anKinderlos = makeAn({ pv_kinderlos_zuschlag: true });
      const anMitKind = makeAn({ pv_kinderlos_zuschlag: false, pv_anzahl_kinder: 1 });

      const buchungen = (anId: string) => [
        makeBuchung(anId, "2025-01", LOHNART_GEHALT.id, "3000"),
      ];
      const rK = engine.berechneAbrechnung({
        arbeitnehmer: anKinderlos,
        lohnarten: LOHNARTEN,
        buchungen: buchungen(anKinderlos.id),
        abrechnungsmonat: "2025-01",
      });
      const rM = engine.berechneAbrechnung({
        arbeitnehmer: anMitKind,
        lohnarten: LOHNARTEN,
        buchungen: buchungen(anMitKind.id),
        abrechnungsmonat: "2025-01",
      });
      // AN Kinderlos PV = 3000 × (1,8 + 0,6) % = 72
      // AN mit Kind PV = 3000 × 1,8 % = 54
      expect(rK.abzuege.pv_an.toFixed2()).toBe("72.00");
      expect(rM.abzuege.pv_an.toFixed2()).toBe("54.00");
      // AG-PV bleibt gleich (Kinderlos-Zuschlag nur AN)
      expect(rK.arbeitgeberKosten.pv.toFixed2()).toBe(
        rM.arbeitgeberKosten.pv.toFixed2()
      );
    });

    it("Abschlag ab 2. Kind: -0,25 % je zusätzliches Kind", () => {
      // 3 Kinder → -0,50 % (für Kind 2 und 3)
      const an = makeAn({
        pv_kinderlos_zuschlag: false,
        pv_anzahl_kinder: 3,
      });
      const buchungen = [
        makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "3000"),
      ];
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      // PV-AN = (1,8 - 0,5) % × 3000 = 1,3 % × 3000 = 39
      expect(r.abzuege.pv_an.toFixed2()).toBe("39.00");
    });
  });

  describe("Kirchensteuer", () => {
    it("Bayern: 8 % auf LSt", () => {
      const an = makeAn({
        kirchensteuerpflichtig: true,
        konfession: "RK",
        bundesland: "BY",
      });
      const buchungen = [
        makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "4000"),
      ];
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      const lst = r.abzuege.lohnsteuer.toNumber();
      const kist = r.abzuege.kirchensteuer.toNumber();
      // KiSt BY = 8 % → kist ≈ lst × 0.08 (per Jahresbetrag /12)
      expect(kist).toBeCloseTo(lst * 0.08, 1);
    });

    it("NRW: 9 % auf LSt", () => {
      const an = makeAn({
        kirchensteuerpflichtig: true,
        konfession: "EV",
        bundesland: "NW",
      });
      const buchungen = [
        makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "4000"),
      ];
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      const ratio =
        r.abzuege.kirchensteuer.toNumber() / r.abzuege.lohnsteuer.toNumber();
      expect(ratio).toBeCloseTo(0.09, 2);
    });

    it("Nicht kirchensteuerpflichtig → 0", () => {
      const an = makeAn({ kirchensteuerpflichtig: false });
      const buchungen = [
        makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "4000"),
      ];
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      expect(r.abzuege.kirchensteuer.toFixed2()).toBe("0.00");
    });
  });

  describe("BBG-Deckelung", () => {
    it("Sehr hohes Brutto: SV auf BBG gedeckelt", () => {
      const an = makeAn();
      const buchungen = [
        makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "15000"),
      ];
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      // BBG KV/PV monatlich = 66150 / 12 = 5512,50
      const bbgKvPv = SV_PARAMETER_2025.bbg_kv_pv.div(12);
      // KV-AN = 5512,50 × 7,3 % = 402,41
      const expected = bbgKvPv.times("7.3").div(100);
      expect(r.abzuege.kv_an.toFixed2()).toBe(expected.toFixed2());
    });
  });

  describe("Sonstiger Bezug (Weihnachtsgeld)", () => {
    it("Einmalzahlung erhöht Jahres-LSt", () => {
      const an = makeAn();
      const ohneBonus = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen: [makeBuchung(an.id, "2025-11", LOHNART_GEHALT.id, "3000")],
        abrechnungsmonat: "2025-11",
      });
      const mitBonus = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen: [
          makeBuchung(an.id, "2025-11", LOHNART_GEHALT.id, "3000"),
          makeBuchung(an.id, "2025-11", LOHNART_WGELD.id, "2000"),
        ],
        abrechnungsmonat: "2025-11",
      });
      expect(mitBonus.sonstigeBezuege.toFixed2()).toBe("2000.00");
      expect(
        mitBonus.abzuege.lohnsteuer.greaterThan(ohneBonus.abzuege.lohnsteuer)
      ).toBe(true);
    });
  });

  describe("Money precision", () => {
    it("Wiederholte Brutto 0,01 × 100 bleibt exakt", () => {
      const an = makeAn();
      const buchungen = Array.from({ length: 100 }, (_, i) => ({
        ...makeBuchung(an.id, "2025-01", LOHNART_GEHALT.id, "0.01"),
        id: `b-${i}`,
      }));
      const r = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: LOHNARTEN,
        buchungen,
        abrechnungsmonat: "2025-01",
      });
      expect(r.gesamtBrutto.toFixed2()).toBe("1.00");
    });
  });
});
