import { describe, it, expect, beforeEach } from "vitest";
import {
  FestschreibungsService,
  InMemoryFestschreibungsStore,
} from "../FestschreibungsService";
import { Money } from "../../../lib/money/Money";
import type { Lohnabrechnung } from "../../lohn/types";

function makeAbr(id: string, brutto = "3000"): Lohnabrechnung {
  return {
    arbeitnehmer_id: id,
    abrechnungsmonat: "2025-01",
    laufenderBrutto: new Money(brutto),
    sonstigeBezuege: Money.zero(),
    gesamtBrutto: new Money(brutto),
    svBrutto: new Money(brutto),
    abzuege: {
      lohnsteuer: new Money("280"),
      solidaritaetszuschlag: Money.zero(),
      kirchensteuer: Money.zero(),
      kv_an: new Money("219"),
      kv_zusatz_an: new Money("37.50"),
      pv_an: new Money("72"),
      rv_an: new Money("279"),
      av_an: new Money("39"),
      gesamtAbzuege: new Money("926.50"),
    },
    arbeitgeberKosten: {
      kv: new Money("219"),
      kv_zusatz: new Money("37.50"),
      pv: new Money("54"),
      rv: new Money("279"),
      av: new Money("39"),
      u1: new Money("33"),
      u2: new Money("7.20"),
      u3: new Money("1.80"),
      gesamt: new Money("670.50"),
    },
    auszahlungsbetrag: new Money("2073.50"),
    gesamtkostenArbeitgeber: new Money("3670.50"),
    formatted: {
      laufenderBrutto: "3000.00",
      sonstigeBezuege: "0.00",
      gesamtBrutto: "3000.00",
      auszahlungsbetrag: "2073.50",
      gesamtkostenArbeitgeber: "3670.50",
    },
    _meta: {
      lstMethode: "JAHRESBERECHNUNG_§39b_EStG",
      steuerklasseAngewandt: 1,
      kvPflichtig: true,
      rvPflichtig: true,
      svBemessungKvPv: "3000.00",
      svBemessungRvAv: "3000.00",
    },
  };
}

describe("FestschreibungsService", () => {
  let store: InMemoryFestschreibungsStore;
  let service: FestschreibungsService;

  beforeEach(() => {
    store = new InMemoryFestschreibungsStore();
    service = new FestschreibungsService(store);
  });

  describe("lockAbrechnung", () => {
    it("setzt locked=true, locked_at und lock_hash", async () => {
      store.seed("a-1", makeAbr("an-1"));
      const rec = await service.lockAbrechnung("a-1", "user-1", "Monatsabschluss Januar 2025");
      expect(rec.locked).toBe(true);
      expect(rec.locked_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(rec.lock_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(rec.lock_reason).toBe("Monatsabschluss Januar 2025");
      expect(rec.locked_by).toBe("user-1");
    });

    it("wirft bei doppelter Festschreibung", async () => {
      store.seed("a-2", makeAbr("an-1"));
      await service.lockAbrechnung("a-2", "user-1", "erster Lock");
      await expect(
        service.lockAbrechnung("a-2", "user-1", "zweiter Lock")
      ).rejects.toThrow(/bereits festgeschrieben/);
    });

    it("wirft bei unbekannter Abrechnung", async () => {
      await expect(
        service.lockAbrechnung("nicht-existent", "user-1", "x")
      ).rejects.toThrow(/nicht gefunden/);
    });
  });

  describe("verifyLockIntegrity", () => {
    it("valid=true bei unveränderter Festschreibung", async () => {
      store.seed("a-3", makeAbr("an-1"));
      await service.lockAbrechnung("a-3", "user-1", "r");
      const check = await service.verifyLockIntegrity("a-3");
      expect(check.valid).toBe(true);
      expect(check.expectedHash).toBe(check.actualHash);
      expect(check.lockedAt).toBeTruthy();
    });

    it("valid=false wenn Daten nach Lock manipuliert wurden", async () => {
      store.seed("a-4", makeAbr("an-1", "3000"));
      await service.lockAbrechnung("a-4", "user-1", "r");
      // Simuliere Manipulation (würde bei echtem SQL-Trigger verhindert)
      store.tamper("a-4", (abr) => ({
        ...abr,
        gesamtBrutto: new Money("9999"), // manipuliert!
      }));
      const check = await service.verifyLockIntegrity("a-4");
      expect(check.valid).toBe(false);
      expect(check.reason).toMatch(/Manipulation/);
      expect(check.expectedHash).not.toBe(check.actualHash);
    });

    it("valid=false für nicht-festgeschriebene Abrechnung", async () => {
      store.seed("a-5", makeAbr("an-1"));
      const check = await service.verifyLockIntegrity("a-5");
      expect(check.valid).toBe(false);
      expect(check.reason).toMatch(/nicht festgeschrieben/);
    });
  });

  describe("unlock (für Korrekturszenarien)", () => {
    it("entsperrt und dokumentiert Event in unlock_history", async () => {
      store.seed("a-6", makeAbr("an-1"));
      await service.lockAbrechnung("a-6", "user-1", "lock");
      const rec = await service.unlock(
        "a-6",
        "user-2",
        "Korrektur: Mehrarbeit vergessen zu buchen"
      );
      expect(rec.locked).toBe(false);
      expect(rec.lock_hash).toBeNull();
      expect(rec.unlock_history).toHaveLength(1);
      expect(rec.unlock_history[0].by).toBe("user-2");
      expect(rec.unlock_history[0].justification).toMatch(/Mehrarbeit/);
      expect(rec.unlock_history[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("wirft ohne Justification (GoBD Rz. 66)", async () => {
      store.seed("a-7", makeAbr("an-1"));
      await service.lockAbrechnung("a-7", "user-1", "lock");
      await expect(service.unlock("a-7", "user-2", "")).rejects.toThrow(
        /Begründung/
      );
    });

    it("wirft bei nicht festgeschriebener Abrechnung", async () => {
      store.seed("a-8", makeAbr("an-1"));
      await expect(
        service.unlock("a-8", "user-2", "Begründung")
      ).rejects.toThrow(/nicht festgeschrieben/);
    });

    it("mehrfach lock/unlock: unlock_history wächst", async () => {
      store.seed("a-9", makeAbr("an-1"));
      await service.lockAbrechnung("a-9", "u1", "l1");
      await service.unlock("a-9", "u2", "j1");
      await service.lockAbrechnung("a-9", "u3", "l2");
      const rec = await service.unlock("a-9", "u4", "j2");
      expect(rec.unlock_history).toHaveLength(2);
      expect(rec.unlock_history[0].justification).toBe("j1");
      expect(rec.unlock_history[1].justification).toBe("j2");
    });
  });

  describe("Hash-Reproduzierbarkeit", () => {
    it("zwei Locks derselben Abrechnung erzeugen identische Hashes", async () => {
      store.seed("a-10", makeAbr("an-1"));
      const rec1 = await service.lockAbrechnung("a-10", "u", "r1");
      await service.unlock("a-10", "u", "justification");
      const rec2 = await service.lockAbrechnung("a-10", "u", "r2");
      expect(rec1.lock_hash).toBe(rec2.lock_hash);
    });
  });
});
