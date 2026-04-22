/**
 * GoBD Festschreibungs-Service (§ 146 AO, GoBD Rz. 64).
 *
 * Nach Festschreibung einer Lohnabrechnung oder Lohnsteuer-Anmeldung
 * dürfen die Daten nicht mehr geändert werden. Korrektur erfolgt
 * AUSSCHLIESSLICH über Stornobuchungen und Neu-Anlage (Audit-Trail).
 *
 * Arbeitsweise:
 *   1. lockAbrechnung: berechnet SHA-256-Hash, setzt locked=true,
 *      locked_at, lock_hash, lock_reason.
 *   2. verifyLockIntegrity: berechnet Hash neu, vergleicht mit gespeichertem.
 *      Bei Abweichung → Integrität verletzt (Manipulationsverdacht).
 *   3. unlock: nur für Korrekturszenarien, erzeugt Audit-Eintrag mit
 *      Justification, speichert Historie der Unlock-Events.
 *
 * Abstraktion: Service arbeitet gegen einen "Store"-Contract — in Tests
 * kann ein In-Memory-Store genutzt werden, produktiv das AbrechnungArchivRepo.
 */

import { computeAbrechnungHash, verifyAbrechnungHash } from "../../lib/crypto/payrollHash";
import type { Lohnabrechnung } from "../lohn/types";

export type LockedRecord = {
  id: string;
  abrechnung: Lohnabrechnung;
  locked: boolean;
  locked_at: string | null;
  lock_hash: string | null;
  lock_reason: string | null;
  locked_by: string | null;
  unlock_history: Array<{
    at: string;
    by: string;
    justification: string;
  }>;
};

/** Minimaler Store-Contract — in Tests mit Map-Stub ersetzbar. */
export interface FestschreibungsStore {
  get(id: string): Promise<LockedRecord | null>;
  update(id: string, patch: Partial<LockedRecord>): Promise<LockedRecord>;
}

export type IntegrityCheckResult = {
  valid: boolean;
  expectedHash: string;
  actualHash: string;
  lockedAt: string | null;
  reason?: string;
};

export class FestschreibungsService {
  constructor(private store: FestschreibungsStore) {}

  /** Schreibt eine Lohnabrechnung fest. Wirft, wenn schon gesperrt. */
  async lockAbrechnung(
    abrechnungId: string,
    lockedBy: string,
    reason: string
  ): Promise<LockedRecord> {
    const rec = await this.store.get(abrechnungId);
    if (!rec) {
      throw new Error(`Abrechnung ${abrechnungId} nicht gefunden.`);
    }
    if (rec.locked) {
      throw new Error(
        `Abrechnung ${abrechnungId} ist bereits festgeschrieben (GoBD Rz. 64).`
      );
    }
    const hash = await computeAbrechnungHash(rec.abrechnung);
    return await this.store.update(abrechnungId, {
      locked: true,
      locked_at: new Date().toISOString(),
      lock_hash: hash,
      lock_reason: reason,
      locked_by: lockedBy,
    });
  }

  /** Prüft, ob der gespeicherte Hash noch zu den Daten passt. */
  async verifyLockIntegrity(
    abrechnungId: string
  ): Promise<IntegrityCheckResult> {
    const rec = await this.store.get(abrechnungId);
    if (!rec) {
      throw new Error(`Abrechnung ${abrechnungId} nicht gefunden.`);
    }
    if (!rec.locked || !rec.lock_hash) {
      return {
        valid: false,
        expectedHash: "",
        actualHash: "",
        lockedAt: null,
        reason: "Abrechnung ist nicht festgeschrieben (kein Hash vorhanden).",
      };
    }
    const actualHash = await computeAbrechnungHash(rec.abrechnung);
    const valid = await verifyAbrechnungHash(rec.abrechnung, rec.lock_hash);
    return {
      valid,
      expectedHash: rec.lock_hash,
      actualHash,
      lockedAt: rec.locked_at,
      reason: valid
        ? undefined
        : "Hash-Abweichung: Daten wurden nach Festschreibung verändert (Manipulationsverdacht).",
    };
  }

  /**
   * Entsperrt eine Abrechnung (nur für Korrekturszenarien, GoBD Rz. 66).
   * Die Entsperrung selbst wird in unlock_history dokumentiert — damit
   * bleibt die Änderung nachvollziehbar.
   */
  async unlock(
    abrechnungId: string,
    unlockedBy: string,
    justification: string
  ): Promise<LockedRecord> {
    if (!justification.trim()) {
      throw new Error(
        "Begründung (justification) erforderlich (GoBD Rz. 66)."
      );
    }
    const rec = await this.store.get(abrechnungId);
    if (!rec) {
      throw new Error(`Abrechnung ${abrechnungId} nicht gefunden.`);
    }
    if (!rec.locked) {
      throw new Error(
        `Abrechnung ${abrechnungId} ist nicht festgeschrieben — nichts zu entsperren.`
      );
    }
    const newHistory = [
      ...rec.unlock_history,
      {
        at: new Date().toISOString(),
        by: unlockedBy,
        justification,
      },
    ];
    return await this.store.update(abrechnungId, {
      locked: false,
      locked_at: null,
      lock_hash: null,
      lock_reason: null,
      locked_by: null,
      unlock_history: newHistory,
    });
  }
}

/** In-Memory-Store — für Tests und Demo-Modus. */
export class InMemoryFestschreibungsStore implements FestschreibungsStore {
  private records = new Map<string, LockedRecord>();

  seed(id: string, abrechnung: Lohnabrechnung): void {
    this.records.set(id, {
      id,
      abrechnung,
      locked: false,
      locked_at: null,
      lock_hash: null,
      lock_reason: null,
      locked_by: null,
      unlock_history: [],
    });
  }

  async get(id: string): Promise<LockedRecord | null> {
    return this.records.get(id) ?? null;
  }

  async update(
    id: string,
    patch: Partial<LockedRecord>
  ): Promise<LockedRecord> {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Record ${id} nicht gefunden.`);
    const updated = { ...existing, ...patch };
    this.records.set(id, updated);
    return updated;
  }

  // Test-Hilfe: direkten Datenzugriff für Manipulations-Simulation
  tamper(id: string, mutator: (abr: Lohnabrechnung) => Lohnabrechnung): void {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Record ${id} nicht gefunden.`);
    existing.abrechnung = mutator(existing.abrechnung);
  }
}
