# TECH-DEBT: DB-SQL-Verifikation der Hash-Chain-Canonicalization (Pre-Deploy-Blocker)

- **Priorität:** **HIGH** · Pre-Production-Deploy-Blocker
- **Ursprung:** Sprint 20.C.0 (2026-04-22)
- **Status:** offen · DEFERRED bis erster Supabase-Deploy mit echtem Mandanten-Traffic
- **Cross-Link:** [`docs/OPEN-QUESTIONS-SPRINT-20-C-DB-VERIFIKATION.md`](../OPEN-QUESTIONS-SPRINT-20-C-DB-VERIFIKATION.md)

## Problem

Migration 0039 (Sprint 20.B.2) und die Client-seitige
`sha256Canonical.ts` (20.B.1) implementieren den Canonical-JSON-
und Hash-Chain-Kontrakt unabhängig voneinander: einmal in PL/pgSQL
(`canonical_jsonb`, `canonical_json_bpv`, `canonical_json_uv`,
`compute_bpv_hash`, `compute_uv_hash`) und einmal in TypeScript
(`canonicalJson`, `computeChainHash`, `formatUtcTimestamp`).

Die Byte-Identität ist die rechtliche Grundlage für GoBD §146 AO
Tamper-Evidence. Client-seitig wird sie durch die 5 Fixtures in
`src/lib/crypto/__tests__/chain.db-client-consistency.test.ts`
abgesichert (Freeze-Test).

Die **DB-Seite** wurde bis heute nicht gegen eine echte Postgres-
Instanz verifiziert, weil lokal weder Docker Desktop noch eine
Remote-Supabase verfügbar war.

## Aktuelle Situation

- DEMO-Mode (localStorage) läuft ausschließlich über den Client-Pfad.
  Die DB-Funktionen aus 0039 werden im aktuellen Betrieb **nicht**
  ausgeführt.
- Sprint 20 schließt ohne DB-Verifikation ab (Project-Owner-
  Entscheidung 2026-04-22).
- Risiko: Wenn später ein Supabase-Branch aktiv wird und die
  DB-Canonicalization byte-abweichend arbeitet, bleibt der Drift
  **lautlos** — Trigger schreiben dann Hashes, die von
  `verifyBpvChainForClient` / `verifyUvChainForClient` als
  „hash_mismatch" gemeldet werden. Das würde vollständig erkannt
  werden, aber die tamper-evidence-Garantie wäre gebrochen,
  weil jede legitime Insert-Aktion als Drift erscheint.

## Akzeptanz-Kriterium

Ticket schließt, wenn **alle folgenden Punkte** erfüllt sind:

- [ ] Ziel-Postgres verfügbar (lokal via Docker ODER Staging-Supabase
      ODER Production-Supabase mit schreibendem Zugriff auf
      Service-Role).
- [ ] Alle Migrationen 0001 bis zur aktuellen Nummer eingespielt.
- [ ] 5 SQL-Queries aus `OPEN-QUESTIONS-SPRINT-20-C-DB-VERIFIKATION.md`
      ausgeführt, Outputs wörtlich erfasst.
- [ ] Byte-genauer Vergleich gegen die `FIXTURE_*_CANONICAL`-Konstanten
      in `src/lib/crypto/__tests__/chain.db-client-consistency.test.ts`.
      **5/5 PASS erforderlich.**
- [ ] Zusätzlicher End-to-End-Insert-Test (BPV-Row per INSERT ohne
      Client-Hash → Trigger `tg_bpv_set_hash` setzt `prev_hash` +
      `version_hash` + `server_recorded_at` korrekt).
- [ ] Report in `docs/SPRINT-20-C-DB-VERIFIKATION-REPORT.md`
      dokumentiert (Environment, Outputs, Pass/Fail, Steuerberater-
      Sign-off).

## Nicht im Scope dieses Tickets

- Kein Refactor der Canonicalization-Logik (weder Client noch DB) —
  das Ticket verifiziert, nicht ändert.
- Keine Re-Execution der in 20.B.6 bestehenden Client-Tests.

## Eskalation bei Fehl-Ergebnis

Sollten 1 oder mehrere Fixtures **nicht** matchen, ist der Drift
zwingend zu analysieren:

1. Welches Byte weicht ab? (Diff-Hexdump)
2. Liegt der Fehler in der PL/pgSQL-Seite (z. B. `jsonb_typeof`-
   Spezialfall, Unicode-Escaping, Timestamp-Format) oder in der
   JS-Seite (z. B. `canonicalJson` mit edge-case-Input)?
3. Fix gezielt in der Seite, die vom Kontrakt abweicht — die andere
   Seite bleibt als Referenz stabil.
4. Nach Fix: alle Client-Tests erneut grün + alle 5 Fixtures PASS.

## Blocker für Produktion?

**Ja, HIGH.** Vor dem ersten Schreibzugriff auf eine Supabase-Instanz
mit Mandanten-Daten muss dieses Ticket geschlossen sein.
