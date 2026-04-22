# Sprint Arbeitsplatz — Abschluss (7 Schritte)

**Abgeschlossen:** 2026-04-20 · Autonomer Nacht-Modus, 7 Einzel-Schritte.
**End-Stand:** 1018 Tests grün / 67 Dateien · tsc clean · Demo-Flow End-to-End verifiziert.

---

## 1. Ziel

Ein neuer Post-Login-Einstieg unter `/arbeitsplatz`: eine Fullscreen-Seite
außerhalb der AppShell, die Kanzlei und Mandantenarbeit in **drei
kontextuellen Spalten** organisiert. Alte `/dashboard`-Route bleibt als
Weiterleitung auf `/arbeitsplatz` bestehen, `LoginPage` navigiert per
Default dorthin.

## 2. Route + Layout-Entscheidungen

- Route-Registrierung: `/arbeitsplatz` **parallel** zur AppShell-Outlet-
  Gruppe in `src/App.tsx` — eigenes `RequireAuth` + `ErrorBoundary
  level="page" context="Arbeitsplatz"`, **kein** `<AppShell/>`-Wrap.
  Damit entfällt die Kopfleiste/Sidebar in diesem Einstieg, und
  die 3-Spalten-Shell rechnet direkt auf `100vh`.
- Fullscreen-Grid 20 % / 50 % / 30 % mit eigenständigem Vertikal-Scroll
  je Spalte (Seite selbst scrollt nicht, `overflow: hidden` am Root).
- Unter 1024 px: Grid behält 3 Spalten, Container scrollt horizontal
  (fixe Mindestbreiten 240 + 520 + 320 = 1080 px > 1024 px). Mobile-
  Optimierung war bewusst **nicht** Sprint-Ziel.
- URL-Binding: **URL-Query `?mandantId=<id>` ist die einzige Wahrheit**
  für den aktiven Mandanten innerhalb der Arbeitsplatz-Seite
  (`useSearchParams` aus `react-router-dom` v7). **MandantContext wurde
  bewusst nicht angefasst** — separater Folge-Sprint (siehe §5).
- Design-Entscheidung für `setSearchParams({replace: true})`:
  Mandanten-Auswahl ist semantisch Filter-State, nicht Navigation
  → Back-Button kehrt zur Vorher-Seite zurück, nicht durch jede
  einzelne Zeilen-Auswahl rückwärts.

## 3. 7-Schritte-Changelog (knapp)

| # | Thema | Delta | Dateien |
|---|---|-------|---------|
| 1 | Route-Gerüst + Redirects (`/arbeitsplatz`, `/dashboard → /arbeitsplatz`, LoginPage-Default) | +2 Tests | `App.tsx`, `LoginPage.tsx`, `AppShell.tsx`, `ArbeitsplatzPage.tsx` (neu), Test (neu) |
| 2 | 3-Column-Grid-Shell + Scroll-Strategie + `DashboardPage`-Cleanup | +3 | `ArbeitsplatzPage.tsx/css`, Test erweitert; `DashboardPage.{tsx,css}` gelöscht; Brand-Link im AppShell auf `/arbeitsplatz` |
| 3 | Linke Spalte: Kanzleiorganisation (Einstellungen + Mitarbeiterverwaltung, statisch) | +2 | `ArbeitsplatzPage.tsx/css` |
| 4 | Mittlere Spalte: Header (h2 + Plus-Icon), Suche, Mandantentabelle, URL-Binding via Row-Click | +6 | `ArbeitsplatzPage.tsx/css`, Test: `QueryClientProvider`-Setup, `UrlProbe`, `IS_REACT_ACT_ENVIRONMENT`, `vi.waitFor` |
| 5 | Rechte Spalte: Empty-State + Active-Launcher (Mandant-Card + 3 Kategorien × 5 Links mit `?mandantId=…`) | +5 | `ArbeitsplatzPage.tsx/css` |
| 6 | `MandantAnlageModal` aus ClientsPage extrahiert, wiederverwendbar; Plus-Button öffnet Modal; onCreated → setSearchParams + close | +3 | `components/MandantAnlageModal.tsx` (neu), `ClientsPage.tsx` entschlackt, `ArbeitsplatzPage.tsx` integriert |
| 7 | Smoke-Test, Tab-Order-Test, CSS-Polish (Design-Tokens), Docs | +2 | `ArbeitsplatzPage.smoke.test.tsx` (neu), `ArbeitsplatzPage.test.tsx` +1, CSS konsolidiert, dieses Dokument |

Details je Schritt: in den entsprechenden Bericht-Antworten der
Arbeitsplatz-Sprint-Session 2026-04-20.

## 4. Test-Count-Trajectory

| Schritt | Datei-Anzahl | Tests | Δ |
|--------:|-------------:|------:|---:|
| Baseline (Session-Start) | 65 | 995 | — |
| 1 — Route + Redirects | 66 | 997 | +2 |
| 2 — Grid-Shell + Cleanup | 66 | 1000 | +3 |
| 3 — Linke Spalte (Kanzlei) | 66 | 1002 | +2 |
| 4 — Mittlere Spalte (Mandantentabelle) | 66 | 1008 | +6 |
| 5 — Rechte Spalte (Launcher) | 66 | 1013 | +5 |
| 6 — MandantAnlage-Modal + Plus-Integration | 66 | 1016 | +3 |
| **7 — Smoke, Tab-Order, Polish** | **67** | **1018** | **+2** |

**Netto Sprint Arbeitsplatz:** +23 Tests, +2 Dateien
(`ArbeitsplatzPage.test.tsx` erweitert von 0 → 22 Tests;
`ArbeitsplatzPage.smoke.test.tsx` neu, 1 End-to-End-Test;
`MandantAnlageModal.tsx` wiederverwendbar extrahiert).

## 5. Bekannte Limitierungen (bewusst nicht im Sprint adressiert)

### 5.1 F42 — MandantContext-URL-Refactor offen

Die Seite liest `?mandantId=` aus der URL, schreibt aber **nicht** in
`MandantContext`. D. h. wenn die Kanzlei-Mitarbeiter:in von der
Arbeitsplatz-Zeile in ein AppShell-Modul wechselt, zeigt der
AppShell-Topbar-Mandant-Switcher weiter den zuvor gewählten
`selectedMandantId`. Das ist identisch zum F42-Staleness-Bug aus
Sprint 7.5 und wurde bewusst **aus dem Scope ausgeschlossen**, weil
der Refactor auf 23 Konsumenten von `useMandant()`/`selectedMandantId`
wirkt (`MandantContext.tsx`, `AppShell.tsx`, 20 Seiten, 2 API-Module +
Tests) und deutlich mehr als ein 7-Schritte-Sprint ist.

### 5.2 `?mandantId=`-Konsum durch Ziel-Routen

Die 5 Launcher-Links bauen ihre `href`s korrekt als
`/buchfuehrung?mandantId=<id>`, `/anlagen/verzeichnis?mandantId=<id>`,
`/steuer/euer?mandantId=<id>`, `/steuer/ustva?mandantId=<id>`,
`/lohn?mandantId=<id>` — **die Zielrouten lesen den Query-Parameter
heute aber nicht**. Der Parameter ist deklarativ, verbraucht nichts.
Vollständige Wirksamkeit hängt am MandantContext-Refactor (§5.1).

### 5.3 ClientsPage-Test-Coverage fehlt weiter

Eine Grep-Suche in `src/**/*.test.*` ergibt weiterhin 0 ClientsPage-
Tests. Die Extraktion von `MandantAnlageModal` in Schritt 6 ist
ungetestet auf der ClientsPage-Seite (im Arbeitsplatz getestet). Die
Legacy-Logik („Mandanten-Nr. und Name sind Pflichtfelder.", Toast-
Meldungen, Invalidation, Formular-Reset beim Re-Open) wurde 1:1
übernommen — Regressions-Risiko entsprechend gering, aber Coverage
wäre im Sinne künftiger ClientsPage-Änderungen wünschenswert.

### 5.4 Route-Abweichungen gegenüber Sprint-Spec

Schritt 5 verwendet für den Launcher die tatsächlich registrierten
Routen, nicht die vorgeschlagenen — `/buchfuehrung`, **`/anlagen/verzeichnis`**
(nicht `/anlagen`), **`/steuer/euer`** (nicht `/einkommensteuer`),
**`/steuer/ustva`** (nicht `/umsatzsteuer/ustva`), **`/lohn`** (nicht
`/personal/lohn`). Keine neuen Routes angelegt. Falls die Kanzlei
eine semantische Umbenennung wünscht (`/einkommensteuer` als Alias
o. ä.), ist das ein eigenständiges Vorhaben.

### 5.5 MandantAnlageModal-Fokus-Trap

Die `components/ui/Modal`-Primitive hat Esc + Backdrop-Click +
Body-Scroll-Lock, **aber keinen Fokus-Trap**. Tab-Navigation kann
aus dem Modal herausspringen. Für den Arbeitsplatz-Sprint war das
nicht in scope; falls Schärfung gewünscht ist, würde das die Modal-
Primitive projektweit aufwerten.

### 5.6 Test-Umgebung — `IS_REACT_ACT_ENVIRONMENT`

Für die Tab-Order-, URL-Binding- und Modal-Tests mussten wir
`globalThis.IS_REACT_ACT_ENVIRONMENT = true` in beide Arbeitsplatz-
Test-Dateien setzen (React 19 + happy-dom flusht State-Updates
sonst nicht innerhalb `act()`). Kein globales Setup-File im
`vitest.config.ts` angelegt, um andere Test-Suites nicht zu
beeinflussen. Falls weitere Page-Test-Suites mit React-19-State-
Interaktion dazukommen, ist ein gemeinsames `setupFiles`-Eintrag
ein Folge-Cleanup.

## 6. Nächste Schritte

### 6.1 MandantContext-URL-Refactor (Folge-Sprint)

Der logische nächste Schritt ist, `MandantContext` an die URL zu
koppeln — entweder:

- **Variante A:** MandantProvider liest/schreibt `?mandantId=` via
  `useSearchParams`, localStorage wird redundant → Schichtung über
  alle 23 Konsumenten prüfen.
- **Variante B:** Arbeitsplatz setzt beim Zeilen-Klick **zusätzlich**
  `setSelectedMandantId(id)` (einfachster Fix, aber zwei Wahrheits-
  quellen bleiben nebeneinander).

Variante A ist die saubere Lösung, hat aber Blast-Radius auf sämtliche
AppShell-Konsumenten und vermutlich 1-2 Tage Arbeit inkl. Regression.

### 6.2 Zielrouten lesen `?mandantId=`

Nach dem Context-Refactor: `BuchfuehrungIndexPage`, `AnlagenVerzeichnisPage`,
`EuerPage`, `UstvaPage`, `LohnPage` jeweils mit einem Pattern wie
`useSyncMandantFromUrl()` versorgen — zentraler Hook, der beim Mount
den Query-Parameter in den Context kopiert (falls gesetzt).

### 6.3 Sprint-8 wie gehabt

Die Post-Bugfix-Follow-Ups aus `docs/NEXT-CLAUDE-HANDOFF.md` (AfA-
Doppelung, UStVA-Drift, README-Sollwerte) sind vom Arbeitsplatz-
Sprint unberührt und stehen weiterhin an.

---

## 7. Verifikations-Gate am Sprint-Ende

```bash
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit   # clean (Exit 0)
npx vitest run                                             # 1018 / 67 grün
```

## 8. Kernspuren im Code

- `src/pages/ArbeitsplatzPage.tsx` (~340 Zeilen, inkl. Empty/Active-
  Launcher, URL-Binding, Plus-Modal-Trigger)
- `src/pages/ArbeitsplatzPage.css` (tokenisierte BEM-Blöcke)
- `src/pages/__tests__/ArbeitsplatzPage.test.tsx` (22 Unit-Tests)
- `src/pages/__tests__/ArbeitsplatzPage.smoke.test.tsx` (1 End-to-End)
- `src/components/MandantAnlageModal.tsx` (extrahiert aus ClientsPage)
- `src/App.tsx` (Route `/arbeitsplatz` parallel, `/dashboard → Navigate`)
- `src/components/AppShell.tsx` (Sidebar-Nav „Dashboard" → „Arbeitsplatz",
  Brand-Link)
- `src/pages/LoginPage.tsx` (Default-Redirect `"/arbeitsplatz"`)
- gelöscht: `src/pages/DashboardPage.tsx` + `.css` (orphaned)
