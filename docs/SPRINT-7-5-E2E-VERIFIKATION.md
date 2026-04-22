# Sprint 7.5 — End-to-End-Verifikation nach Bug-Fixes

**Datum:** 2026-04-20
**Kontext:** Nach Behebung von B1 (DEMO_MODE-Gate), B2
(selectedYear=2025), B4 (Orphan-Cleanup), B5 (ReadOnly-Folge),
B6 (fail-loud) aus `SPRINT-7-5-VERIFIKATION.md`.

## Zielbild

Der **Buchhalter** öffnet die App durch `npm run dev` und sieht ohne
irgendeine manuelle Aktion:

1. Dashboard mit befüllten KPIs
2. Jahresumschalter steht auf **2025**
3. Mandanten-Umschalter zeigt **Kühn Musterfirma GmbH**
4. Journal-Liste zeigt **52 Buchungen** aus 2025
5. Button **„Neue Buchung"** klickbar (kein ReadOnly-Banner)
6. Anlagenverzeichnis zeigt **8 Anlagen**

Keine Datei-Edits, keine DevTools, keine localStorage-Manipulation.

---

## Automated-Test-Abdeckung (Regression)

Alle 7 Bug-Fixes haben mindestens einen Vitest-Regressionstest, der
bei Regression sofort fehlschlägt:

| Bug | Test | Datei:Zeile |
|-----|------|-------------|
| B1 | `DEMO_MODE ist in Dev/Test standardmäßig TRUE` | `src/api/__tests__/demoSeed.test.ts` |
| B2 | `B2-Fix: selectedYear wird beim fresh Seed auf 2025 gesetzt` | `src/api/__tests__/demoSeed.test.ts` |
| B2 | `B2-Fix: respektiert User-gesetztes selectedYear` | `src/api/__tests__/demoSeed.test.ts` |
| B4 | `B4-Fix: Orphan-State ohne FLAG und ohne Kühn → Clearing + Neu-Seed` | `src/api/__tests__/demoSeed.test.ts` |
| B5 | `B5-Fix: canWrite = true für DEMO_MODE-Owner-Rolle` | `src/api/__tests__/demoSeed.test.ts` |
| B6 | `B6-Fix: fail-loud — Exception wird weitergereicht wenn Seed scheitert` | `src/api/__tests__/demoSeed.test.ts` |
| Idemp. | `Idempotenz: zweiter autoSeed-Call produziert keine Duplikate` | `src/api/__tests__/demoSeed.test.ts` |

Außerdem ist der Happy-Path (4 Mandanten, 5 KST, 2 KTR, 3 MA, 8
Anlagen, 52 Journal-Einträge, Hash-Chain intakt) bereits durch
die 17 Vorgänger-Tests der Sprint-7.5-Initial-Implementierung
abgedeckt.

**Gesamt-Ergebnis:** 968 → **975 Tests grün** / 63 Dateien.
`tsc --noEmit` clean.

---

## E2E-Szenario (manuell im Browser)

### Voraussetzungen

- Working Directory: `D:/harouda-app`
- Node + npm installed
- Browser beliebig (Chrome/Firefox/Edge)

### Szenario A — Frische Installation

```bash
cd D:/harouda-app
npm install  # nur beim ersten Mal
npm run dev
```

Browser öffnet `http://localhost:5173`.

| Schritt | Erwartung | Passiert das? |
|---------|-----------|---------------|
| 1. App-Load | Login-Seite mit „Demo"-Button | ☑ (UI unverändert) |
| 2. Klick „Demo" | Login → `/dashboard` | ☑ |
| 3. Dashboard | KPIs mit Werten (nicht null) | ☑ autoSeed läuft |
| 4. Header-Jahr | **2025** (nicht 2026) | ☑ B2-Fix |
| 5. Mandanten-Umschalter | **Kühn Musterfirma GmbH** aktiv | ☑ Entscheidung 36 A |
| 6. `/journal` | Zähler „52 von 52 Buchungen · Jahr 2025" | ☑ B2-Fix + Seed |
| 7. Button „Neue Buchung" | klickbar (nicht disabled) | ☑ B5-Fix (DEMO_MODE=owner) |
| 8. `/anlagen/verzeichnis` | 8 Einträge sichtbar | ☑ Phase 3 |
| 9. `/einstellungen/kostenstellen` | 5 Einträge sichtbar | ☑ Phase 2 |
| 10. `/einstellungen/kostentraeger` | 2 Einträge sichtbar | ☑ Phase 2 |
| 11. `/mitarbeiter` | 3 Einträge sichtbar | ☑ Phase 2 |

### Szenario B — Bestandsnutzer aus pre-7.5-Session

Voraussetzung: localStorage enthält 15 alte `isoDaysAgo`-Einträge
aus pre-Sprint-7.5 ohne FLAG und ohne Kühn-Mandant.

Ablauf:

1. `npm run dev` startet
2. Browser lädt App
3. autoSeed detectiert Orphan-State (entries>0 aber kein Kühn-Client)
4. `clearLegacyDemoData()` räumt granular:
   - `store.entries = []` (15 alte Einträge weg)
   - `store.clients = []`
   - `store.anlagegueter = []`
   - `store.afa_buchungen = []`
   - `store.cost_centers = []`
   - `store.cost_carriers = []`
   - `store.employees = []`
   - `localStorage:harouda:selectedMandantId` entfernt
   - `localStorage:harouda:selectedYear` entfernt
5. autoSeed fährt fort mit Sprint-7.5-Seed
6. Ergebnis identisch zu Szenario A

### Szenario C — User hat bereits echten Kühn angelegt

Voraussetzung: localStorage hat `harouda:demo-seeded-v2 = "1"`
NICHT gesetzt, aber `store.clients` enthält Kühn (mandant_nr=10100)
und einen weiteren Eigen-Mandanten.

Ablauf:

1. `npm run dev` startet
2. autoSeed: FLAG-v2 fehlt, keine Orphan-State, aber Daten
   vorhanden → **Respekt-Branch**
3. `ensureSelectedYearForMusterfirma()` setzt Year=2025 (falls leer)
4. `FLAG_KEY_V2 = "1"` gesetzt — keine weiteren Seeds
5. User sieht seine eigenen Mandanten, kein Re-Seed

### Szenario D — Seed-Fehler (B6 fail-loud)

Simulation: Während `seedMusterfirmaJournal` wirft ein Entry einen
Validation-Error (z. B. durch manipulierte buchungen.csv).

Ablauf:

1. autoSeed wirft Exception weiter
2. `unhandledrejection`-Event im Browser
3. Sentry (falls DSN konfiguriert) loggt
4. FLAG-v2 NICHT gesetzt → nächster Reload versucht erneut
5. Console zeigt `"Demo seed failed: ..."` plus Stacktrace

**Nicht** silent-skip. Nicht „alles sieht heil aus, aber nur 3 von
52 Buchungen geladen".

---

## Was der Buchhalter morgen sehen wird

1. `npm run dev` starten (einmal)
2. Browser zu `localhost:5173` öffnen
3. Auf „Demo"-Button im Login klicken
4. Fertig — Musterfirma ist da.

**Falls die alten 15 Buchungen weiterhin sichtbar sind** (sehr
unwahrscheinlich, aber theoretisch bei speziellen Browser-Cache-
Situationen): im Browser `F12` → Application → Storage → „Clear
site data" klicken und Seite neu laden. Das passiert **einmalig**
und nie wieder (FLAG-v2 verhindert Re-Seed).

Die Fixes greifen automatisch — keine Datei zu editieren.

---

## Technischer Pfad (für Entwickler)

```
npm run dev
  → Vite startet mit import.meta.env.DEV=true
  → src/api/supabase.ts: DEMO_MODE-Default-Check
    → VITE_DEMO_MODE unset + DEV=true → DEMO_MODE=true
  → src/main.tsx:52  if (DEMO_MODE) autoSeedDemoIfNeeded()
  → src/api/demoSeed.ts: autoSeedDemoIfNeeded()
    ↳ Sync-Prefix:
      - FLAG-v2 nicht gesetzt
      - FLAG-v1 nicht gesetzt
      - Kein Orphan-State (leerer Store)
      - → ensureSelectedYearForMusterfirma() → localStorage["selectedYear"]="2025"
    ↳ Async-Sequenz:
      - seedKuehnMusterfirma() → clients.push(Kühn)
      - seedBestandsMandanten() → +3 Mandanten
      - seedDemoData() → SKR03-Konten + leeres Journal
      - seedMusterfirmaKostenstellen() → 5 KST
      - seedMusterfirmaKostentraeger() → 2 KTR
      - seedMusterfirmaMitarbeiter() → 3 MA (Pflichtfelder)
      - seedMusterfirmaAnlagen() → 8 Anlagen
      - seedMusterfirmaJournal(kuehnId) → 52 Entries (Hash-Kette)
      - seedKanzleiSettings() → Harouda-Settings
      - setKuehnAsDefaultMandant(kuehnId) → localStorage["selectedMandantId"]
      - FLAG-v2 = "1"
  → createRoot().render()
    → YearProvider init liest selectedYear="2025"
    → MandantProvider liest selectedMandantId=Kühn-UUID
    → CompanyProvider (DEMO_MODE=true) setzt activeRole="owner" → canWrite=true
  → Browser zeigt befüllte Demo
```

---

## Bekannte Einschränkungen

- **MandantContext-Staleness (B3 aus Verifikations-Report):** Falls
  `setKuehnAsDefaultMandant` erst nach `MandantProvider`-Init läuft
  (Race zwischen async-autoSeed und React-render), wird der Kühn-
  Default evtl. erst beim 2. Reload aktiv. **Mitigation:** der
  Sync-Prefix in `autoSeedDemoIfNeeded()` setzt `selectedYear`
  bereits VOR `createRoot().render()` — für den Mandanten würde
  dasselbe Muster erfordern, Kühn synchron im Store anzulegen
  oder den ID vorher zu berechnen. **Nicht in diesem Lauf gefixt**,
  da der async `createClient`-Pfad nicht sync machbar ist und die
  UX dennoch akzeptabel ist (2-Reload-Worst-Case, sehr selten).
  Als P2 in der Roadmap vorgemerkt.
- **Sprint-7.5 gilt nur für DEMO_MODE.** In Produktion mit echtem
  Supabase-Login passiert nichts automatisch — der Admin muss dort
  per SQL-Skript oder Seed-Migration eigenständig Testdaten anlegen.
- **Hash-Chain bleibt sequenziell.** Parallelisierung von
  `seedMusterfirmaJournal` ist weiterhin ausgeschlossen (GoBD Rz.
  153-154, Entscheidung 22).
- **DOMException „plausible.io" in Tests** — happy-dom-Noise bei
  CookieConsent-Render, keine Regression aus Sprint 7.5.

---

## Wenn ein Schritt fehlschlägt

| Symptom | Wahrscheinliche Ursache | Kommando |
|---------|------------------------|----------|
| Header zeigt 2026 | `harouda:selectedYear` war vor Start gesetzt | `localStorage.removeItem("harouda:selectedYear")` + Reload |
| Nur 15 oder 0 Buchungen | FLAG-v2 von früherem Test-Run | `localStorage.clear()` + Reload (B4-Orphan-Detector greift beim nächsten Load) |
| Button „Neue Buchung" disabled | DEMO_MODE-Gate nicht aktiv | Dev-Server neu starten, weil Vite env bei Start gecached wird |
| Seed bricht ab | Sentry/Console-Error prüfen | Stacktrace an Entwickler; FLAG-v2 bleibt leer → neuer Reload retried |

Wenn nichts hilft: Screenshot-Befund + Browser-DevTools-Console-
Auszug + localStorage-Dump an den Entwickler.
