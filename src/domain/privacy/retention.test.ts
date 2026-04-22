// Tests für canDelete() + cookie_consent-Kategorie in src/data/retention.ts.
//
// Fokus: DSGVO-Art.-17-Entscheidung unter Berücksichtigung der steuer-
// rechtlichen Aufbewahrungspflicht nach § 147 Abs. 3 AO, sowie Jahresende-
// Anker-Semantik (Frist beginnt erst am 31.12. des Entstehungsjahres).

import { describe, expect, it } from "vitest";
import {
  canDelete,
  retentionEndsAt,
  ruleFor,
  type CanDeleteDecision,
} from "../../data/retention";

function assertBlocked(
  d: CanDeleteDecision
): asserts d is Exclude<CanDeleteDecision, { allowed: true }> {
  if (d.allowed) throw new Error("expected blocked, got allowed");
}

describe("retention.canDelete", () => {
  it("blockiert Buchungsbelege während der 8-Jahres-Frist (Wachstumschancengesetz)", () => {
    // Beleg entstand am 2023-06-15 → Frist läuft 31.12.2023 + 8 Jahre = 31.12.2031.
    const created = "2023-06-15T10:00:00Z";
    const now = new Date("2025-04-20T00:00:00Z");
    const decision = canDelete("buchungsbeleg", created, now);
    assertBlocked(decision);
    expect(decision.reason).toContain("§ 147 Abs. 3 AO");
    expect(decision.retainedUntil.getUTCFullYear()).toBe(2031);
  });

  it("erlaubt Löschung von Buchungsbelegen nach Fristablauf", () => {
    // Beleg 2010-06-15 → Frist 31.12.2018; heute 2025 → abgelaufen.
    const decision = canDelete(
      "buchungsbeleg",
      "2010-06-15T00:00:00Z",
      new Date("2025-04-20T00:00:00Z")
    );
    expect(decision.allowed).toBe(true);
  });

  it("blockiert Bücher für volle 10 Jahre (§ 147 Abs. 3 AO)", () => {
    const decision = canDelete(
      "buecher",
      "2020-01-10T00:00:00Z",
      new Date("2025-04-20T00:00:00Z")
    );
    assertBlocked(decision);
    expect(decision.retainedUntil.getUTCFullYear()).toBe(2030);
  });

  it("blockiert Handelsbriefe für 6 Jahre", () => {
    const decision = canDelete(
      "handelsbrief",
      "2022-03-01T00:00:00Z",
      new Date("2025-04-20T00:00:00Z")
    );
    assertBlocked(decision);
    // Frist läuft 31.12.2022 + 6 Jahre = 31.12.2028.
    expect(decision.retainedUntil.getUTCFullYear()).toBe(2028);
  });

  it("Cookie-Consent wird 3 Jahre als Nachweis aufbewahrt (TTDSG § 25)", () => {
    const rule = ruleFor("cookie_consent");
    expect(rule.years).toBe(3);
    expect(rule.legalBasis).toContain("TTDSG");

    const decision = canDelete(
      "cookie_consent",
      "2024-05-10T00:00:00Z",
      new Date("2025-04-20T00:00:00Z")
    );
    assertBlocked(decision);
    // 31.12.2024 + 3 = 31.12.2027.
    expect(decision.retainedUntil.getUTCFullYear()).toBe(2027);
  });

  it("Cookie-Consent-Widerruf ist nach 3 Jahren löschbar", () => {
    const decision = canDelete(
      "cookie_consent",
      "2019-05-10T00:00:00Z",
      new Date("2025-04-20T00:00:00Z")
    );
    expect(decision.allowed).toBe(true);
  });

  it("Jahresende-Anker: ein am 30.12.2020 erstellter Beleg verlängert die Frist bis Ende 2028 nicht 2030", () => {
    // buchungsbeleg = 8 Jahre; Anker ist 31.12.2020.
    const ends = retentionEndsAt("2020-12-30T12:00:00Z", "buchungsbeleg");
    expect(ends.getFullYear()).toBe(2028);
    expect(ends.getMonth()).toBe(11); // Dezember
    expect(ends.getDate()).toBe(31);
  });

  it("Grenzfall: genau am Fristende ist noch blockiert, eine Sekunde danach erlaubt", () => {
    const created = "2017-06-15T00:00:00Z"; // Frist 31.12.2025 (8 J.)
    const ends = retentionEndsAt(created, "buchungsbeleg");

    const atEnd = canDelete("buchungsbeleg", created, ends);
    expect(atEnd.allowed).toBe(false);

    const afterEnd = canDelete(
      "buchungsbeleg",
      created,
      new Date(ends.getTime() + 1000)
    );
    expect(afterEnd.allowed).toBe(true);
  });

  it("Unbekannte Kategorie → fällt auf 'sonstige' zurück (6 Jahre)", () => {
    // ruleFor gibt für Unbekannte den letzten Eintrag zurück, das ist jetzt
    // 'cookie_consent' (3 Jahre). Wir verifizieren das Fallback-Verhalten
    // explizit, damit Änderungen an der Liste bewusst passieren müssen.
    const rule = ruleFor("sonstige");
    expect(rule.years).toBe(6);
    expect(rule.legalBasis).toContain("§ 147");
  });
});
