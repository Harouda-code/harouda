# Sprint 7.5 — Autonome Entscheidungen (Fix-Runde 2026-04-20)

Sprint 7.5 wurde in zwei Läufen bearbeitet: der ursprüngliche
Implementierungs-Sprint (17 vom User freigegebene Design-Entscheidungen
21-37, dokumentiert in `SPRINT-7-5-DECISIONS.md`) und eine nachgelagerte
Fix-Runde, ausgelöst durch den Verifikations-Report
`SPRINT-7-5-VERIFIKATION.md` (7 Bugs B1-B7).

Dieser Ordner fasst **autonome Entscheidungen der Fix-Runde** zusammen,
die der Nacht-Modus ohne User-Rückfrage traf. User-Review beim
Sprint-8-Kickoff empfohlen.

---

## F38: DEMO_MODE-Default in DEV (Bug B1)

**Problem:** Ohne `VITE_DEMO_MODE=1` in `.env.local` läuft die App in
Supabase-Mode; Auto-Seed wird nie ausgeführt. Der Nutzer (Buchhalter,
nicht Entwickler) soll kein .env editieren.

**Optionen:**
- A) `.env.local` mit `VITE_DEMO_MODE=1` ergänzen (persistent, aber
  gitignored und umgehbar).
- B) `src/api/supabase.ts` berechnet DEMO_MODE dynamisch: true wenn
  `VITE_DEMO_MODE !== "0"` UND `import.meta.env.DEV === true`.
- C) Neue `.env.development` (im Git, würde auf jedem Entwickler-
  System gelten).

**Gewählt: B.**

**Begründung:**
- A greift nicht für andere Entwickler/Test-Systeme und hilft dem
  Buchhalter nicht, wenn er die App frisch klont.
- C würde die Produktion belasten, wenn CI `vite build --mode=development`
  nutzt.
- B ist robust: im DEV-Server ist `import.meta.env.DEV === true`
  hartcodiert von Vite → automatischer Demo. Im Production-Build ist
  DEV=false → kein versehentliches Aktivieren. Explicit
  `VITE_DEMO_MODE=1` oder `=0` überschreibt die Heuristik.

**Test:** `DEMO_MODE ist in Dev/Test standardmäßig TRUE` in
`demoSeed.test.ts`.

---

## F39: selectedYear-Sync vs. YearContext-Umbau (Bug B2)

**Problem:** Musterfirma-Daten sind 2025, `YearContext.defaultYear()`
liefert `new Date().getFullYear()` (2026 heute). Buchungen
herausgefiltert.

**Optionen:**
- A) `YearContext.defaultYear()` DEMO-aware machen.
- B) `autoSeedDemoIfNeeded` schreibt `localStorage.selectedYear=2025`
  im Sync-Prefix vor `createRoot().render()`.
- C) Musterfirma-Daten ins Jahr 2026 migrieren (widerspricht
  Entscheidung 29).

**Gewählt: B.**

**Begründung:**
- A bricht die Isolation: YearContext würde DEMO_MODE kennen müssen
  (Abstraction-Leak).
- C widerspricht der Festdaten-Entscheidung und macht Tests
  Date-abhängig.
- B ist lokal, reversibel, überschreibt User-Wahl **nicht** (nur wenn
  der Key leer ist). YearProvider liest `localStorage` auf Init ohne
  Änderung.

**Test:** 2 Tests in `demoSeed.test.ts` (`B2-Fix: selectedYear wird
beim fresh Seed auf 2025 gesetzt`, `B2-Fix: respektiert User-gesetztes
selectedYear`).

---

## F40: Orphan-Erkennungs-Heuristik (Bug B4)

**Problem:** Altbestand ohne FLAG aber mit Entries (z. B. 15
`isoDaysAgo`-Einträge aus pre-7.5-Seed) wurde vom Respekt-Branch
geschützt — Nutzer sieht 15 stale-Buchungen statt 52 Musterfirma-
Buchungen, kein Auto-Cleanup.

**Kriterium für Orphan-Erkennung:**
- A) Datum-Range (alle Entries vor 2025-01-01 = Orphan)
- B) Fehlen des Kühn-Mandanten (mandant_nr === "10100") im
  `store.clients`
- C) Entries ohne client_id

**Gewählt: B.**

**Begründung:**
- A schlägt falsch-positiv an, wenn der User legitime historische
  Buchungen importiert hat.
- C greift falsch, weil der alte Seed keine client_id setzte.
- B ist präzise: wenn der User Kühn selbst angelegt hätte (z. B.
  via UI), wäre er nicht in einem Orphan-State; fehlt Kühn, war der
  User noch nie im Sprint-7.5-Pfad. Blast-Radius auf pre-7.5-Demo-
  Runs beschränkt.

**Risiko:** Ein User, der in einer Pre-7.5-App manuell den Namen
„Kühn Musterfirma GmbH" OHNE die konkrete mandant_nr `10100`
angelegt hat, würde als Orphan klassifiziert. Akzeptabel — der
mandant_nr ist die technische Identität, nicht der Name.

**Test:** `B4-Fix: Orphan-State ohne FLAG und ohne Kühn → Clearing
+ Neu-Seed` in `demoSeed.test.ts`.

---

## F41: fail-loud via re-throw (Bug B6)

**Problem:** `autoSeedDemoIfNeeded().catch` loggte still, widersprach
Entscheidung 37 C („fail-loud").

**Gewählt:** `console.error` + `throw err` im catch-Block.

**Begründung:**
- `main.tsx:52` ruft `void autoSeedDemoIfNeeded()` — eine Promise-
  Rejection wird zu `unhandledrejection`-Event. `installGlobalError
  Handlers` hängt sich dran und schreibt in Sentry bzw. `AppLog`.
- FLAG-v2 bleibt ungesetzt, damit ein Reload den Seed neu versucht.

**Test:** `B6-Fix: fail-loud — Exception wird weitergereicht wenn
Seed scheitert` in `demoSeed.test.ts`.

---

## F42: MandantContext-Staleness (Bug B3) — NICHT gefixt

**Problem:** `setKuehnAsDefaultMandant` setzt `localStorage.
selectedMandantId` nach `await seedKuehnMusterfirma()` — zu diesem
Zeitpunkt hat `MandantProvider` evtl. schon mit leerem Wert
initialisiert. User sieht Kühn erst nach Reload.

**Entscheidung: in dieser Fix-Runde NICHT gefixt.**

**Begründung:**
- Fix würde erfordern, die Kühn-UUID synchron im Sync-Prefix zu
  schreiben — setzt eine ID ohne den eigentlichen Mandanten-Eintrag
  voraus (inkonsistent) oder den `createClient`-Pfad synchron zu
  machen (Architektur-Umbau in `clients.ts`).
- Alternativ: `MandantProvider` via `storage`-Event-Listener ODER
  eine Post-Seed-Hook-Signal (Pub/Sub). Beides nicht-trivial.
- Blast-Radius real: erste Session-Page zeigt evtl. nicht Kühn
  vorselektiert. Der User klickt einmalig um — oder reloadet.
  Ab dem 2. Load ist alles stabil.

**Status:** P2 in Roadmap, Handoff-Note für Sprint 8 Kandidat.

---

## F43: Integration-Test vs. Sync-Prefix-Test (Bug B7)

**Problem:** autoSeed-Tests testen direkt die Funktion, nicht den
`main.tsx`-Gating-Pfad.

**Gewählt:** Unit-Test auf DEMO_MODE-Export + Regressions-Tests auf
autoSeed-Verhalten. **Kein** eigenes `main.integration.test.ts` —
weil das `main.tsx`-Modul beim Import Side-Effects auslöst
(createRoot, Sentry-init etc.), schwer zu mocken.

**Begründung:** Die Integration-Kette ist
`DEMO_MODE → autoSeed → createRoot`. Beide Enden getestet:
- `DEMO_MODE` via `B1-Fix`-Test
- `autoSeed` via existierende + neue Tests
- `createRoot → YearProvider → selectedYear=2025` implizit abgedeckt,
  weil `YearContext` `localStorage` synchron liest — und der Sync-
  Prefix den Key setzt, bevor `createRoot` überhaupt läuft.

**Risiko:** Wenn jemand das `if (DEMO_MODE)` in `main.tsx` entfernt,
bleibt es unbemerkt. Mitigation: Kommentar „// Sprint 7.5 Fix (B1)"
mit Verweis, damit jeder Refactor die Entscheidung dokumentiert sieht.

---

## Zusammenfassung: 6 neue Regressions-Tests

| # | Test | Bug |
|---|------|-----|
| 1 | DEMO_MODE in Dev/Test standardmäßig TRUE | B1 |
| 2 | selectedYear wird beim fresh Seed auf 2025 gesetzt | B2 |
| 3 | respektiert User-gesetztes selectedYear | B2 |
| 4 | Orphan-State ohne FLAG und ohne Kühn → Clearing + Neu-Seed | B4 |
| 5 | canWrite = true für DEMO_MODE-Owner-Rolle | B5 |
| 6 | fail-loud — Exception weitergereicht wenn Seed scheitert | B6 |
| 7 | Idempotenz: zweiter autoSeed produziert keine Duplikate | Idemp. |

+ 1 Test angepasst (der alte „respektiert User-Daten"-Test wurde neu
formuliert: Voraussetzung ist jetzt, dass Kühn bereits im Store ist).

**Test-Stand:** 968 → **975** (+7) / 63 Dateien unverändert.
`tsc --noEmit` clean.
