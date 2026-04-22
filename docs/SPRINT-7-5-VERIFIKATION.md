# Sprint 7.5 — Verifikations-Report

**Datum:** 2026-04-20
**Kontext:** Nutzer sieht nach App-Start 15 Buchungen in
Geschäftsjahr **2026** statt der 52 Musterfirma-Buchungen in 2025 +
UI ist im Nur-Lesen-Modus.
**Analyse-Modus:** Keine Code-Änderungen — nur Diagnose.

---

## 0. TL;DR — Kern-Befund

**Die Sprint-7.5-Auto-Seed-Logik läuft im aktuellen Nutzer-
Environment gar nicht.** `.env.local` setzt `VITE_DEMO_MODE` nicht,
daher ist `DEMO_MODE === false`. `main.tsx` Zeile 52-54 gated
`autoSeedDemoIfNeeded()` hinter `if (DEMO_MODE)`. Ergebnis:

- Kein Musterfirma-Seed wird ausgeführt
- Die App läuft im **Supabase-Mode** gegen die konfigurierte
  Cloud-DB
- Die Demo-Login-Taste `admin@harouda.de / password123` macht
  einen echten Supabase-Auth-Call, keine DEMO_MODE-Simulation
- Read-Only-Banner erscheint, weil der Supabase-User keine
  `company_members`-Zeile hat → `activeRole = null` → `canWrite = false`
- Die 15 sichtbaren 2026er-Buchungen liegen in der Supabase-DB
  (nicht aus der App vor Sprint 7.5; Migration 0022 enthält keinen
  Journal-Seed)

Sprint 7.5 wurde mit Tests verifiziert (968 grün), aber die Tests
laufen unter Vitest, wo `VITE_DEMO_MODE` irrelevant ist — `store`
ist direkt in-memory. Der Integrations-Pfad „dev-Server-Start +
Browser-Session" wurde nicht manuell verifiziert.

---

## 1. Default-Geschäftsjahr

**Quelle:** `src/contexts/YearContext.tsx`

```ts
function defaultYear(): number {
  return new Date().getFullYear();  // 2026 heute
}
```

- Dynamisch aus Tages-Datum → heute (2026-04-20) liefert **2026**
- `inYear(iso)` matched nur Einträge, deren ISO-String mit `2026`
  beginnt. Die 52 Musterfirma-Buchungen sind alle in 2025 →
  würden herausgefiltert, **selbst wenn der Seed lief**.
- Persistenz: `localStorage["harouda:selectedYear"]` überschreibt
  den Default, falls vorhanden.

**Impact auf Sprint 7.5:** Selbst bei korrekt ausgeführtem
autoSeed wäre die Journal-Liste unter Default-Einstellungen leer
(oder nur 2026-Einträge sichtbar). Die Musterfirma ist per Design
festdatiert 2025 (Entscheidung 29) → **der Seed muss den
selectedYear auf 2025 erzwingen**, sonst wirkt er unsichtbar.

**Aktuell: NICHT gelöst.** `autoSeedDemoIfNeeded()` setzt
`harouda:selectedMandantId`, aber nicht `harouda:selectedYear`.

---

## 2. Nur-Lesen-Modus

**Quellen:**
- `src/components/ReadonlyBanner.tsx` — prüft `canWrite`
- `src/hooks/usePermissions.ts` — leitet aus
  `useCompany().activeRole` ab
- `src/contexts/CompanyContext.tsx` Zeile 195-200 — `activeRole =
  memberships.find(m => m.companyId === activeCompanyId)?.role ?? null`
- `src/pages/JournalPage.tsx:106` — `const { canWrite } =
  usePermissions()`; Z. 585 Tooltip
  „Nur-Lesen-Zugriff — keine neuen Buchungen möglich"

**DEMO_MODE-Pfad:** `loadMemberships()` (Z. 71-79) liefert
hartkodiert `[{companyId: DEMO_COMPANY_ID, role: "owner"}]` →
`canWrite = true`.

**Supabase-Pfad:** `loadMemberships()` queried
`from("company_members").select(...).eq("user_id", user.id)`.
Wenn der eingeloggte Supabase-User keine Zeile in
`company_members` hat → `list = []` → `activeRole = null` →
`canWrite = false` → Banner erscheint.

**Warum der Nutzer ReadOnly sieht:** Sein Supabase-User
`admin@harouda.de` hat keine `company_members`-Zeile (oder die
Zeile gehört zu einer anderen `company_id` als die aus
`localStorage["harouda:activeCompanyId"]`).

**Fix-Pfad ohne Code-Änderung:**
1. `VITE_DEMO_MODE=1` in `.env.local` setzen → DEMO_MODE aktiv →
   Membership hart = "owner" → Banner verschwindet.
2. Oder in Supabase manuell eine `company_members`-Zeile für den
   Demo-User mit `role='owner'` anlegen und `activeCompanyId` auf
   die passende Firma setzen.

---

## 3. FLAG-v2 Migration

**autoSeed-Aufruf in `main.tsx`:**

```ts
if (DEMO_MODE) {
  void autoSeedDemoIfNeeded();
}
```

Weil `DEMO_MODE === false` **wird die Funktion nie aufgerufen**.
Weder Kühn-Seed noch FLAG-v2-Setzen noch v1-Legacy-Migration
laufen.

**Folgen für den localStorage:**
- `harouda:demo-seeded-v2` wird nicht gesetzt
- `harouda:demo-seeded` (v1) ist evtl. aus einer früheren
  Session gesetzt, wird aber nie gelesen (weil autoSeed gated)
- `harouda:selectedMandantId` wird nicht auf Kühn gesetzt

**Szenario „v2 bereits auf 1 von Test":** Theoretisch möglich,
wenn der User zuvor `VITE_DEMO_MODE=1` hatte oder Tests im Browser
liefen. Heilung: `localStorage.removeItem("harouda:demo-seeded-v2")`
+ Reload — **greift aber nur, wenn DEMO_MODE wieder true ist.**

**Status:** Kein FLAG-v2-Bug. Die Funktion ist schlicht nicht
erreicht.

---

## 4. Woher die 15 Buchungen?

**`src/api/dashboard.ts:200-214`** verifiziert:
```ts
const demo: Omit<JournalEntry, ...>[] = [];  // LEER
```
Der Array ist seit Sprint 7.5 Phase 4 (Entscheidung 22 A) leer.
`seedDemoData()` fügt nur noch Konten, keine Journal-Einträge
mehr hinzu. **Nicht die Quelle der 15 Einträge.**

**Mögliche Quellen der 15 Einträge:**
1. **Supabase-DB** — die 15 Einträge liegen in
   `journal_entries` in der Cloud-DB
   `btvakzahbkhvprzjxlxz.supabase.co`. Migrationen 0001-0025
   enthalten **keinen** Journal-Seed (Grep verifiziert), aber
   frühere App-Sessions haben Buchungen manuell angelegt (z. B.
   Belegerfassungs-Demo Sprint 1 + 2, oder prior
   DEMO_MODE-Läufe, die seedDemoData mit dem 15er-isoDaysAgo-
   Array schrieben, bevor es entfernt wurde).
2. **localStorage-Fallback** — wenn `shouldUseSupabase() ===
   false` (kein `activeCompanyId`), liest `fetchEntries()` aus
   `store`. 15 Einträge könnten aus einem v1-DEMO-Seed mit
   `isoDaysAgo(…)` übrig sein, deren Datumsstempel nachträglich
   ins Jahr 2026 gerutscht sind (weil `isoDaysAgo` zur
   Erstellungszeit `new Date()` nutzt — wer die Daten in
   Januar 2026 seedete, hat 2026-datierte Einträge).

Das Datum **2026** der sichtbaren Buchungen ist ein starkes
Indiz für Option 2 (alte `isoDaysAgo`-Einträge vor dem
Sprint-7.5-Delete, gespeichert in localStorage oder in Supabase
als frühe User-Anlage).

---

## 5. Reproduktions-Diagnose für den Nutzer

### Browser-DevTools checken (F12 → Application → Local Storage):

```
# harouda-relevante Keys prüfen:
harouda:demo-seeded         → leer oder "1"?
harouda:demo-seeded-v2      → leer oder "1"?
harouda:selectedYear        → leer oder "2026"?
harouda:selectedMandantId   → leer oder Kühn-UUID?
harouda:activeCompanyId     → leer oder UUID?
```

### DevTools Console:
```js
// Ist DEMO_MODE gerade aktiv?
import.meta.env.VITE_DEMO_MODE
// erwartet: "1" → DEMO. undefined/"" → Supabase-Mode.
```

### Supabase-DB-Inhalt prüfen (wenn Zugriff):
```sql
-- Wie viele Einträge liegen in der Cloud-DB?
select count(*) from journal_entries;

-- Welches Datumsbereich?
select min(datum), max(datum) from journal_entries;

-- Welche User/Company-Zuordnungen?
select u.email, cm.role, c.name
from auth.users u
join company_members cm on cm.user_id = u.id
join companies c on c.id = cm.company_id;
```

### Saubere Reproduktion der Sprint-7.5-Erwartung:

**Variante A — DEMO_MODE einschalten (empfohlen für Demo-UX):**
1. `.env.local` ergänzen: `VITE_DEMO_MODE=1`
2. Dev-Server neu starten (`npm run dev`)
3. Browser-localStorage für `localhost:5173` komplett leeren
   (DevTools → Application → Storage → „Clear site data")
4. Seite neu laden → autoSeed läuft, 4 Mandanten + Kühn-Default
5. Jahresumschalter auf **2025** stellen (oben rechts im
   AppShell-Header) → 52 Buchungen sichtbar

**Variante B — Supabase-Mode mit Musterfirma:**
1. Supabase-DB-Reset mit `VITE_DEMO_MODE=1` seeden (gleicher
   Ablauf wie A)
2. Daten anschließend per SQL-Dump in die Cloud-DB migrieren
3. `company_members`-Zeile für den Demo-User mit `role='owner'`
   anlegen
4. Diese Variante ist **außerhalb Sprint-7.5-Scope** — der Sprint
   deckt explizit nur DEMO_MODE (demoSeed.ts Kommentar-Header
   Z. 1).

---

## 6. Liste potentieller Bugs + Priorität

| # | Bug | Priorität | Fix-Skizze |
|---|-----|-----------|-----------|
| **B1** | `autoSeedDemoIfNeeded` ist hinter `if (DEMO_MODE)` gated; ohne `VITE_DEMO_MODE=1` im Environment wird der Seed nie ausgeführt. Kein Hinweis in der UI. | **P1** | Dokumentation in `CLAUDE.md` §13.3 + Quick-Start-README präziser: „autoSeed setzt `VITE_DEMO_MODE=1` voraus". Kein Code-Fix nötig, aber klare User-Anleitung. |
| **B2** | Default `selectedYear = new Date().getFullYear()` → 2026. Musterfirma-Daten sind hart 2025 (Entscheidung 29). Seed bleibt unsichtbar selbst wenn er läuft. | **P1** | `autoSeedDemoIfNeeded()` schreibt nach erfolgreichem Seed `localStorage.setItem("harouda:selectedYear", "2025")` — analog zum Kühn-Default-Mandanten-Setzen (Entscheidung 36). |
| **B3** | `setKuehnAsDefaultMandant` setzt `harouda:selectedMandantId`. Der Mandanten-Umschalter liest diesen Key erst bei Browser-Reload, weil `MandantContext` ihn im Init-State ausliest. Wenn autoSeed asynchron nach Context-Init läuft, wird der Default erst beim 2. Reload aktiv. | **P2** | `MandantContext` auf Key-Change lauschen (`storage`-Event oder Re-Read nach Seed-Promise-Resolve). Nicht in Sprint-7.5-Test-Abdeckung. |
| **B4** | 15 vermutlich 2026-datierte Einträge in localStorage oder Supabase aus prior-Sprint-Runs. `clearLegacyDemoData()` läuft nur, wenn FLAG-v1 gesetzt ist — bei „Altbestand ohne FLAG" bleiben die Einträge. | **P2** | Erweitern: wenn der User mit FLAG-v2=undefined + Entries im Store startet und Einträge vor einem Cutoff-Datum liegen, Opt-in-Dialog statt silent skip. Oder Doku-Hinweis für DevTools-Clear. |
| **B5** | Read-Only-Banner in Supabase-Mode ohne `company_members`-Zeile. Erste DEMO-Session ohne Firma-Bootstrap ist für neue Supabase-Tester irreführend. | **P2** | `bootstrapFirstCompany()` läuft in `reload()` nur wenn `list.length === 0` UND `!DEMO_MODE` UND `user !== null`. Bei eingeloggtem Demo-User ohne Zeile sollte bootstrap greifen — aktueller Code tut das bereits. Evtl. greift er nicht, weil der User zwar authentifiziert ist, die Demo-E-Mail aber in einer anderen DB angelegt wurde. Diagnose über `gh`/`supabase dashboard`. |
| **B6** | `autoSeedDemoIfNeeded()` nutzt im catch-Block `console.error` (Z. 586) — „fail-loud" laut Entscheidung 37 war „ErrorBoundary + Sentry". Aktuelle Implementierung swallowed den Fehler still nach Log. Widerspruch zum DECISIONS-Dok. | **P3** | Re-throw nach `console.error` oder `Sentry.captureException`. Test-Impact: Mock prüfen. |
| **B7** | Vitest-Tests laufen ohne `VITE_DEMO_MODE` — sie testen `autoSeed` direkt, nie über `main.tsx`-Gate. Integration „main.tsx ruft autoSeed bei DEMO_MODE" ist ungetestet. | **P3** | Neuer Smoke-Test in `src/__tests__/main.integration.test.ts` oder explizite Anmerkung in DECISIONS: „autoSeed wird nur in DEMO_MODE ausgeführt; Supabase-Pfad braucht eigenen Seed-Weg". |

---

## 7. Offene Fragen für den Nutzer

1. **Welche Variante (A/B aus §5) soll gelten?** Wenn A: B2
   (selectedYear=2025 setzen) ist ein kleiner Code-Fix, der die
   Sprint-7.5-Erwartung tatsächlich sichtbar macht.
2. **Sollen die 15 Altbestand-Einträge (lokal oder in Supabase)
   gelöscht werden?** Vor dem Sprint-Fix: Screenshot des
   localStorage + ein `select * from journal_entries` der Cloud-DB
   bestätigen die Quelle.
3. **Ist die CLAUDE.md-Anleitung für Demo-Login korrekt?** Sie
   erwähnt autoSeed beim ersten DEMO-Login — impliziert aber nicht,
   dass `VITE_DEMO_MODE=1` Voraussetzung ist. Soll der Satz
   ergänzt werden?

---

## 8. Nicht-Befunde (explizit geprüft, in Ordnung)

- `src/api/dashboard.ts`: 15 hardcoded Einträge sind **tatsächlich
  entfernt** (Array ist `[]`), keine versteckte Seed-Quelle in
  dieser Datei.
- `src/api/demoSeed.ts`: FLAG-v2-Logik ist korrekt implementiert
  und mit 3 Tests abgedeckt. Sie wird nur nicht *erreicht*.
- SKR03-Erweiterung (`9000`, `0860`) ist in `skr03.ts` vorhanden.
- Journal-Seed-Tests (17) laufen grün — die Funktions-Logik ist
  intakt.

---

## STOPP

Keine Code-Änderung in diesem Lauf. Warte auf Nutzer-Entscheidung
zu §6 (Bug-Priorisierung) und §7 (offene Fragen) bevor Code-Fix
startet.
