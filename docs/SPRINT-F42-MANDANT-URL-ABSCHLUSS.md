# Sprint F42 — MandantContext URL-primary · Abschluss

**Abgeschlossen:** 2026-04-20 · Autonomer Nacht-Modus.
**End-Stand:** 1030 Tests grün / 71 Dateien · tsc clean · F42-Smoke verifiziert.

---

## 1. Ausgangslage — der F42-Bug

Seit Sprint 7.5 (Musterfirma-Auto-Seed) bekannt, dokumentiert in
`docs/NEXT-CLAUDE-HANDOFF.md` als **„F42 P2 — MandantContext-Staleness"**:

- Der Arbeitsplatz (`/arbeitsplatz`, eingeführt im Arbeitsplatz-Sprint)
  setzte den aktiven Mandanten per `?mandantId=<id>` in die URL.
- Der AppShell-Topbar-Switcher und 16 weitere Read-only-Konsumenten
  lasen `selectedMandantId` aber **aus einem separaten React-State**,
  der nur über `setSelectedMandantId` + localStorage synchronisiert
  wurde.
- Folge: Wer auf dem Arbeitsplatz Kühn auswählt und anschließend in
  ein AppShell-Modul (`/journal`, `/berichte/bilanz`, …) wechselt,
  sah dort **den alten oder keinen Mandanten**. Zwei Reloads waren
  nötig, bis `localStorage` wieder durchschlug.
- Der Bug-Impact war so groß, dass Sprint 7.5 Fix-Runde ihn
  bewusst **nicht gepatched** hat (Blast-Radius auf 23 Konsumenten
  → eigener Sprint nötig).

## 2. Lösung — URL-primary MandantContext (API-kompatibel)

Neue Context-Semantik, Public-API **identisch**:

```ts
useMandant() // → { selectedMandantId, setSelectedMandantId }
```

- `selectedMandantId` wird pro Render **aus der URL-Query**
  `?mandantId=` abgeleitet (`useSearchParams`).
- **Fallback:** `localStorage["harouda:selectedMandantId"]` —
  dient für den ersten Render nach Login (vor erster Router-
  Interaktion), Demo-Seed (`api/demoSeed.ts`) und `api/backup.ts`.
- **Konsistenz-Regel:** URL gewinnt beim Lesen. localStorage
  wird erst beim nächsten Write synchronisiert — kein proaktiver
  Sync im Render, vermeidet Render-Side-Effects.
- **No-op:** `setSelectedMandantId(currentId)` ist stummer Return
  — kein URL-Write, kein localStorage-Write.
- **Kein `useState` mehr** im Context — abgeleitete Werte, Re-Render
  erfolgt ausschließlich über den `useSearchParams`-Subscription-
  Mechanismus von React Router.

## 3. Provider-Platzierungs-Migration

`useSearchParams` setzt den Router-Context voraus. Das zwang eine
einmalige Verschiebung:

- **Vorher (main.tsx):** `<MandantProvider>` wrappte `<App/>`
  komplett — also **außerhalb** des in `App.tsx` erzeugten
  `<BrowserRouter>` / `<HashRouter>`. Ein naiver Rewrite hätte
  beim ersten Render geworfen.
- **Nachher:** `<MandantProvider>` in `App.tsx` **innerhalb**
  `<Router>` als direkte Provider-Schicht um die `<Routes>`
  gemountet. Andere Provider (Query, User, Company, Year,
  Settings, Privacy, CookieConsent) bleiben in `main.tsx` unverändert.
- Geschwister der `<App/>` in `main.tsx` (`<CookieConsent/>`,
  `<Toaster/>`) bleiben bewusst außerhalb von MandantProvider —
  keiner nutzt `useMandant` (Grep verifiziert).

## 4. Changelog

### Schritt 1 — Bestandsaufnahme (kein Code-Change)

- 17 Seiten-Konsumenten klassifiziert (16 Read-only, 1 Read+Write
  in `ClientsPage`).
- `UstVoranmeldungPage.tsx` als orphaned identifiziert (nicht in
  `App.tsx` registriert).
- AppShell-MandantSwitch-Trigger-Pfad dokumentiert (onChange →
  `setSelectedMandantId`, **kein** navigate).
- 0 `useEffect([], …)`-Risk-Points — sämtliche Konsumenten lesen
  reaktiv über `useMemo`-Deps oder Render-Body.
- 1 Test mit direkter localStorage-Assertion identifiziert
  (`demoSeed.test.ts:69`).

### Schritt 2 — Core-Rewrite

- `src/contexts/MandantContext.tsx` komplett neu: URL-primary +
  localStorage-Fallback, API unverändert.
- `src/main.tsx` + `src/App.tsx`: Provider-Migration unter Router.
- `src/contexts/__tests__/MandantContext.test.tsx`: 7 neue Tests
  (URL-Priorität, Fallback, null-Leerfall, Write-Sync, null-Write,
  No-op, Integrations-Kanarie).

### Compressed Closeout (Schritte 3–6 gebündelt)

1. **Orphan-Cleanup:** `src/pages/UstVoranmeldungPage.tsx` gelöscht.
   Grep vorher bestätigt: einzige Referenz war der eigene `export default`.
2. **AppShell-MandantSwitch-Integrations-Test** (neu):
   `src/components/__tests__/AppShell.test.tsx` — 2 Tests
   (Dropdown-Auswahl setzt `?mandantId=` auf aktuellem Pfad ohne
   `navigate`; „Alle Mandanten"-Leer-Wahl räumt Query + localStorage).
3. **ClientsPage-Integrations-Test** (neu):
   `src/pages/__tests__/ClientsPage.test.tsx` — 2 Tests
   („Als aktiv wählen"-Button setzt URL + localStorage; `?mandantId=`
   aus URL aktiviert `is-active`-Klasse auf der Karte).
4. **F42-Szenario-Smoke-Test** (neu):
   `src/__tests__/f42-mandant-url.smoke.test.tsx` — 1 End-to-End-Test.
   Ziel-Page war bewusst eine **Probe-Component** statt
   `BuchfuehrungIndexPage` (die kein `useMandant`-Konsument ist —
   pure Card-Grid). Die Probe bildet den F42-Fix-Kontrakt präzise
   auf Hook-Ebene ab.
5. **ArbeitsplatzPage:** bewusst **nicht umgebaut**. Die Seite
   nutzt weiter `useSearchParams` direkt (mit lokaler Validierung
   URL-ID vs. geladene Clients + console.warn). Eine Migration auf
   `useMandant()` wäre funktional äquivalent, aber nicht Sprint-
   Scope.

## 5. Test-Count-Trajectory

| Etappe | Dateien | Tests | Δ |
|---|---:|---:|---:|
| Baseline (vor F42) | 67 | 1018 | — |
| Schritt 2: MandantContext-Rewrite + Tests | 68 | 1025 | +7 |
| Compressed Closeout: AppShell-Test | 69 | 1027 | +2 |
| Compressed Closeout: ClientsPage-Test | 70 | 1029 | +2 |
| Compressed Closeout: F42-Smoke | 71 | **1030** | +1 |

**Netto F42-Sprint:** +12 Tests, +4 Test-Dateien, −1 Datei (Orphan).

## 6. Automatisch gelöste Konsumenten

Durch den **API-kompatiblen Rewrite** wurden alle folgenden
Konsumenten ohne Code-Änderung korrekt migriert:

**Pages (17 — alle über `useMandant()`):**
JournalPage · BuchfuehrungUebersichtPage · BuchfuehrungPlausiPage ·
BankReconciliationPage · BankImportPage · SuSaPage · DocumentsPage ·
DatenExportPage · ClientsPage · GewerbesteuerPage · ElsterPage ·
OposPage · MahnwesenPage · PayrollRunPage · KoerperschaftsteuerPage ·
ZugferdPage · **(UstVoranmeldungPage gelöscht)**.

**Layouts:**
AppShell (Topbar-MandantSwitch).

**Verifikation:** der bestehende `demoSeed.test.ts:69`-Assert auf
`localStorage.getItem("harouda:selectedMandantId")` bleibt grün —
`api/demoSeed.ts` schreibt weiterhin direkt in den Fallback-Kanal,
das neue Context-Read zieht ihn bei leerer URL (Fallback-Semantik).

## 7. Bewusst offen

- **`api/demoSeed.ts`** schreibt weiter direkt in
  `localStorage["harouda:selectedMandantId"]`. Das ist **korrekt**:
  der Seed läuft in `main.tsx` als sync-Prefix **vor** React-Mount
  und damit vor Router-Initialisierung — `useSearchParams` wäre dort
  nicht verfügbar. Der localStorage-Fallback-Kanal erfüllt genau
  diesen Bootstrap-Zweck.
- **`api/backup.ts`** listet den Key weiter in `BACKUP_KEYS`.
  Restore über Browser-Backup schreibt wieder in localStorage —
  Fallback greift automatisch.
- **ArbeitsplatzPage** nutzt weiter eigenen `useSearchParams`-Pfad
  (mit strikter URL-ID-Validierung gegen geladene Clients +
  `console.warn` bei unbekannter ID). Migration auf `useMandant()`
  wäre funktional redundant — beide Pfade schreiben identisch
  `{replace:true}`. Lass-so-Entscheidung.
- **Kein `storage`-Event-Listener** für Cross-Tab-Sync. Fallback-
  Semantik ist „last-known", nicht reaktiver Cross-Tab-State.
  Folge-Kandidat, falls Kanzlei-User zwei Tabs parallel nutzen.

## 8. Verifikations-Gate am Sprint-Ende

```bash
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit   # clean (Exit 0)
npx vitest run                                             # 1030 / 71 grün
```

## 9. Kernspuren im Code

- `src/contexts/MandantContext.tsx` (~90 Zeilen, URL-primary)
- `src/contexts/__tests__/MandantContext.test.tsx` (7 Unit-Tests)
- `src/components/__tests__/AppShell.test.tsx` (2 Integrations-Tests)
- `src/pages/__tests__/ClientsPage.test.tsx` (2 Integrations-Tests)
- `src/__tests__/f42-mandant-url.smoke.test.tsx` (1 End-to-End-Smoke)
- `src/App.tsx` (MandantProvider-Wrap unter `<Router>`)
- `src/main.tsx` (MandantProvider-Import + Wrap entfernt)
- gelöscht: `src/pages/UstVoranmeldungPage.tsx`
