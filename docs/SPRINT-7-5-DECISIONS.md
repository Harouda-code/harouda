# Sprint 7.5 — Entscheidungsprotokoll (Musterfirma Auto-Seed)

Freigabe-Basis: `docs/SPRINT-DEMO-PRE-CHECK.md` (Pre-Check Ist-Zustand)
+ `docs/SPRINT-7-5-PLAN-DETAIL.md` (Phasen-Plan mit 10 Design-Fragen
21-30 + 7 Sub-Fragen 31-37).

Baseline: 951 Tests. Ziel: +17 Tests im Zielbereich 965-975.
**Erreicht:** 968 Tests / 63 Dateien (+17).

---

## Kontext

Das Demo-Paket unter `demo-input/musterfirma-2025/` (Firma Kühn
GmbH) war bis Sprint 7 nur manuell importierbar: User musste sich
einloggen, zum Journal-CSV-Importer navigieren, `buchungen.csv`
hochladen, anschließend Anlagen, KST, KTR, Mitarbeiter separat
anlegen. Sprint 7.5 löst diesen Reibungspunkt — beim ersten
DEMO-Login lädt die App den vollständigen Mandanten-Datenbestand
automatisch. Keine neuen npm-Dependencies; Vite-eigener `?raw`-Import
für Build-Time-CSV-Serialisierung.

---

## Freigegebene Kern-Entscheidungen (Runde 1 — 21-30)

### Entscheidung 21: Firma-Identität aus firma.json

**Gewählt:** Kühn Musterfirma GmbH wird 1:1 aus
`demo-input/musterfirma-2025/firma.json` in die
`clients`-Tabelle übernommen (Name, Mandanten-Nr `10100`,
Rechtsform, Anschrift, USt-ID, Steuernummer, FA-Kurzbezeichnung).

**Begründung:** Single Source of Truth. Wenn User die JSON-Datei
ändert, ändert sich der Seed mit. Keine Datenreplikation in TS-Code.

**Umsetzungs-Detail:** `seedKuehnMusterfirma()` importiert
`firma.json` statisch und ruft `createClient` nur, wenn
`mandanten_nr === "10100"` noch nicht existiert (idempotent).

---

### Entscheidung 22: Journal-Seed aus buchungen.csv (Option A)

**Gewählt: A.** Die 15 hardcoded `isoDaysAgo`-Einträge aus
`src/api/dashboard.ts::seedDemoData` werden ersatzlos entfernt.
Journal-Einträge kommen ausschließlich aus dem neuen autoSeed-Pfad,
der die 52 festdatierten 2025-Buchungen aus `buchungen.csv` lädt.

**Begründung:** Deterministische Testdaten, keine Date-Drift, keine
Doppelbuchungen beim Re-Seed. Der Dashboard-Button „Demo-Daten
laden" bleibt erhalten, seedet aber nur noch Konten (sichtbarer
Abgrenzungspunkt zur automatischen Befüllung).

---

### Entscheidung 23: Vite `?raw`-Import statt fetch()

**Gewählt:** `import buchungenCsv from "../../demo-input/.../buchungen.csv?raw"`
— Vite inlined den CSV-Inhalt zur Build-Zeit als String.

**Begründung:** Kein Netzwerkzugriff im DEMO-Mode nötig; funktioniert
auch nach `vite build` als statisches Bundle. `fetch("/demo-input/...")`
würde Dev-Server-Pfade erfordern, die in Produktion brechen.
`src/vite-env.d.ts` mit `/// <reference types="vite/client" />`
wurde neu angelegt (erste `?raw`-Nutzung im Projekt).

---

### Entscheidung 24: MT940-Bankimport bleibt manuell

**Gewählt:** `bankauszug.mt940` wird **nicht** automatisch geseedet.
User importiert weiterhin manuell über `/bank-abgleich`.

**Begründung:** Bank-Reconciliation-Workflow (Skonto-Splitting,
Fuzzy-Match) ist didaktisch wertvoll als interaktive Demo — Automatik
würde den Lern-Effekt wegnehmen. MT940-Parser bleibt unverändert.

---

### Entscheidung 25: AfA-Buchungen bleiben offen

**Gewählt:** 8 Anlagegüter werden geseedet, aber `afa_buchungen`
bleibt leer. User muss `/anlagen/afa-lauf` manuell triggern, um
AfA-Buchungen zu generieren.

**Begründung:** Analog Entscheidung 24 — AfA-Lauf ist didaktisch
wertvoll als interaktiver Workflow (Plan-Vorschau, Confirm-Dialog,
Idempotenz-Demonstration).

---

### Entscheidung 26: FLAG-Key Versioning (v1 → v2)

**Gewählt:** Neuer localStorage-Key `harouda:demo-seeded-v2`.
Alter Key `harouda:demo-seeded` (v1) wird bei Vorhandensein als
„Legacy-Marker" interpretiert: granulares Clearing + v2-Seed +
v1-Key-Entfernung.

**Begründung:** Saubere Migration für User, die v1 (15 Demo-Buchungen)
schon im localStorage haben. Ohne FLAG-Versioning würden v1-Daten
und v2-Seed koexistieren → Doppelbuchungen, Hash-Chain-Drift.

**Umsetzungs-Detail:** `FLAG_KEY_V2 = "harouda:demo-seeded-v2"`,
`FLAG_KEY_V1_LEGACY = "harouda:demo-seeded"`. Logik in
`autoSeedDemoIfNeeded()`: v2 gesetzt → return. v1 gesetzt → clear +
seed + set v2 + remove v1. Weder v1 noch v2 + leere Stores →
clean seed. v1/v2 gesetzt mit User-Daten → kein Seed, nur v2 setzen
(Respekt vor User-Arbeit).

---

### Entscheidung 27: Lieferanten als Freitext

**Gewählt:** Im Journal-Seed werden Lieferanten-Namen als
Freitext-Buchungstext übernommen (z. B. `buchungstext = "ER-2025-0042
Lieferung BüroWelt GmbH"`). Keine separate `suppliers`-Tabelle.

**Begründung:** Sprint 4 OPOS-Modell arbeitet derived — Personenkonten
sind als Sammelkonten-Satelliten geparkt (Kandidat e in Sprint 8
offen). Eine Lieferanten-Tabelle einzuziehen wäre Sprint-8-Scope.

---

### Entscheidung 28: Keine neuen npm-Dependencies

**Gewählt:** CSV-Parsing nutzt vorhandenen `parseJournalCsv`
(Sprint 5). Datums-Konvertierung nutzt vorhandenen `parseGermanDate`.
Kein `papaparse`, kein `date-fns` etc.

**Begründung:** Bundle-Size-Disziplin + CLAUDE.md §9 „No premature
abstractions". Der existierende Parser deckt den 11-Spalten-Skonto-
Header + Kostenstelle/Kostenträger ab.

---

### Entscheidung 29: Feste 2025-Daten

**Gewählt:** Buchungsdaten bleiben hart auf 2025 (z. B.
`datum = "2025-03-15"`). Kein dynamisches „relativ zu today".

**Begründung:** Reproduzierbare Tests (Snapshot-fähig),
Fiscal-Year-Validierung greift, USt-Perioden stabil (UStVA Q1/Q2/…
zeigt immer dieselben Zahlen).

---

### Entscheidung 30: Mini-Sprint-Umfang

**Gewählt:** Sprint 7.5 ist ein bewusst kleiner Zwischensprint
zwischen Sprint 7 und Sprint 8 — kein Scope-Creep. Nur: Auto-Seed
von Firma + Mandanten + KST + KTR + Mitarbeiter + Anlagen + Journal.
Keine neuen Features, keine neuen Konten, keine neuen Validatoren.

**Begründung:** Klare Abgrenzung. Der Sprint ist „Infrastruktur für
Demo-UX", nicht Feature-Entwicklung.

---

## Freigegebene Sub-Entscheidungen (Runde 2 — 31-37)

### Entscheidung 31: Bestand-Mandanten bleiben

**Gewählt:** Die 3 vorhandenen Demo-Mandanten (Schulz, Meyer, Roth)
aus der ursprünglichen Seed-Basis bleiben erhalten. Kühn wird als
**4. Mandant** hinzugefügt, nicht als Ersatz.

**Begründung:** Multi-Mandanten-UI (Mandanten-Umschalter) braucht
mehrere Einträge, um überhaupt sichtbar zu sein. Reduktion auf
Kühn allein würde UX verarmen.

---

### Entscheidung 32: Nur Pflichtfelder bei Mitarbeitern

**Gewählt:** Mitarbeiter-Seed deckt nur die HGB/SV-Pflichtfelder ab
(Name, Geburtsdatum, SV-Nummer, Eintrittsdatum, Brutto, StKl).
Optional-Felder (IBAN, Telefon, Kinderfreibeträge, etc.) bleiben `null`.

**Begründung:** Didaktischer Fokus: User sieht, welche Felder
Lohnabrechnung mindestens braucht. Overhead-Felder kann der User
nachtragen, wenn er ein spezifisches Szenario testen will.

---

### Entscheidung 33: Granulares Clearing (nicht localStorage.clear)

**Gewählt:** `clearLegacyDemoData()` räumt einzelne Store-Slices
per `store.setEntries([])`, `store.setClients([])`, etc. —
**nicht** `localStorage.clear()`.

**Begründung:** `localStorage.clear()` würde auch
Cookie-Consent-State, Sentry-Session-IDs, Feature-Flags löschen.
Granulares Clearing verhindert Kollateralschäden.

---

### Entscheidung 34: 9000 Eröffnungsbilanzkonto als `passiva`

**Gewählt:** Neues SKR03-Konto `9000 Eröffnungsbilanzkonto
(Saldenvortrag)` wird als Kategorie `passiva` kategorisiert.
Ebenso neu: `0860 Gewinnvortrag vor Verwendung` (passiva).

**Begründung:** EB-Konto ist bilanztechnisch ein Hilfskonto, das
die Bilanzsumme auf der Passivseite abschließt (bei Eröffnung).
`passiva` ist die pragmatischste Einordnung für das bestehende
BalanceSheetBuilder-Mapping. Bei einem späteren EB-Split-Feature
(Sprint 8+) kann die Kategorie präziser werden.

---

### Entscheidung 35: parseGermanDate wiederverwenden (Option B)

**Gewählt: B.** `deDatumZuIso("15.03.2025")` in `demoSeed.ts`
wickelt intern `parseGermanDate` aus `src/domain/journal/csvImport.ts`
ab. Kein neuer Parser.

**Begründung:** Existierender Parser hat robuste Validierung
(Schaltjahr, ungültige Monate, leading zeros). Neu-Implementieren
wäre Duplikation.

---

### Entscheidung 36: Kühn als Default-Mandant

**Gewählt:** Nach erfolgreichem Seed wird `localStorage`-Key
`harouda:selectedMandantId` auf die Kühn-Client-ID gesetzt, damit
der Mandanten-Umschalter direkt Kühn zeigt.

**Begründung:** Erster UI-Eindruck nach DEMO-Login ist der
vollständig befüllte Mandant, nicht ein leerer Schulz/Meyer/Roth.

---

### Entscheidung 37: Fail-loud bei Seed-Fehlern

**Gewählt:** Wenn `autoSeedDemoIfNeeded()` während eines Seed-Schritts
einen Fehler wirft (z. B. CSV-Parse-Error, Hash-Chain-Konflikt),
wird die Exception **nicht** stumm geschluckt. Stattdessen:
`console.error` + Re-throw → React-ErrorBoundary fängt ab → User
sieht die Error-Page mit Sentry-Trace.

**Begründung:** Silent Failure wäre für eine DEMO-Onboarding-UX
katastrophal (User sieht leere App, weiß nicht warum). Fail-loud
macht Regressionen sofort sichtbar. Der FLAG-v2 wird bei
Exception **nicht** gesetzt → beim nächsten Reload wiederholt der
Seed den Versuch.

---

## Deliverables

**Code:**
- `src/api/demoSeed.ts` — komplette Neu-Implementierung (~400 Zeilen):
  `seedKuehnMusterfirma`, `seedBestandsMandanten`, `seedKanzleiSettings`,
  `setKuehnAsDefaultMandant`, `seedMusterfirmaKostenstellen`,
  `seedMusterfirmaKostentraeger`, `seedMusterfirmaMitarbeiter`,
  `seedMusterfirmaAnlagen`, `seedMusterfirmaJournal`,
  `clearLegacyDemoData`, `autoSeedDemoIfNeeded`.
- `src/api/skr03.ts` — +2 Konten (`0860`, `9000`).
- `src/api/dashboard.ts` — `seedDemoData` nur noch Konten (Kommentar
  verweist auf Sprint 7.5 + Entscheidung 22 A).
- `src/vite-env.d.ts` — NEU (`/// <reference types="vite/client" />`).

**Tests:** `src/api/__tests__/demoSeed.test.ts` (17 Tests / neu).
Deckt SKR03-Erweiterung, Mandanten-Seed (Kühn + 3 Bestand +
Default-Selected), 5 KST / 2 KTR, 3 Mitarbeiter mit Pflichtfeld-
Minimum, 8 Anlagen mit DE→ISO-Konversion, 52 Journal-Einträge mit
Hash-Chain, Skonto-Felder auf Sprint-5-Belegen, RC/IG-Sprint-7-
Szenarien, FLAG-v2-Setzen, v1→v2-Legacy-Migration, Respekt vor
User-Daten.

**Dokumentation:** dieses Dokument, `CLAUDE.md` Quick-Start §13.3
erweitert um autoSeed-Beschreibung + FLAG-v2-Hinweis.

**Test-Stand:** 951 → **968** (+17) / 62 → 63 Dateien.

---

## Autonome Neben-Entscheidungen

### Initial-Lauf

Keine. Alle 17 Design-Fragen wurden vor Nacht-Modus-Start vom User
freigegeben.

### Fix-Runde 2026-04-20 (6 autonome Entscheidungen F38-F43)

Nach dem Verifikations-Report `SPRINT-7-5-VERIFIKATION.md` wurden 7
Bugs B1-B7 identifiziert. 6 davon im Nacht-Modus ohne User-Rückfrage
gefixt; die dabei getroffenen 6 autonomen Entscheidungen sind in
`SPRINT-7-5-FRAGEN.md` zusammengefasst:

- **F38 / B1** — `DEMO_MODE` defaultet auf `import.meta.env.DEV === true`
  wenn `VITE_DEMO_MODE` unset ist. Opt-out via `VITE_DEMO_MODE=0`.
- **F39 / B2** — `autoSeedDemoIfNeeded` setzt `localStorage.selectedYear
  = "2025"` synchron vor `createRoot().render()`, wenn Key leer ist.
- **F40 / B4** — Orphan-State-Heuristik: Entries/Clients vorhanden, aber
  kein Kühn-Mandant (`mandant_nr === "10100"`) → als v1-Legacy
  behandelt, `clearLegacyDemoData()` + Neu-Seed.
- **F41 / B6** — catch-Block wirft die Exception nach `console.error`
  weiter (`throw err`), damit `unhandledrejection` Sentry erreicht.
- **F42 / B3** — **NICHT gefixt**. MandantContext-Staleness akzeptiert
  (Sync-Fix würde Architektur-Umbau im `createClient`-Pfad erfordern,
  UX-Impact gering: evtl. 2. Reload für Default-Mandant).
- **F43 / B7** — Integration via Unit-Tests auf DEMO_MODE-Export +
  autoSeed-Regression; kein eigenes `main.integration.test.ts` (main-
  Modul-Import hat Side-Effects).

**Fix-Deliverables:**
- `src/api/supabase.ts` — DEMO_MODE-Default-Heuristik (DEV → true).
- `src/api/demoSeed.ts` — Sync-Prefix mit `ensureSelectedYearForMusterfirma`,
  `detectOrphanLegacyState`, fail-loud re-throw. `clearLegacyDemoData`
  räumt jetzt auch `SELECTED_YEAR_KEY`.
- `src/api/__tests__/demoSeed.test.ts` — 6 neue + 1 angepasster Test.

**Test-Stand nach Fix-Runde:** 968 → **975** (+7) / 63 Dateien.

**User-Review empfohlen:** F42 (unfixed B3) — Soll MandantContext-
Storage-Event-Listener in Sprint 8 umgesetzt werden?

---

## Grenzen des Sprints

Explizit **nicht** in Sprint 7.5:
- Kein Supabase-Pfad für autoSeed (DEMO_MODE only, Supabase-Seeds
  laufen über Migrationen + separates Admin-Script).
- Keine AfA-Buchungen (manueller `/anlagen/afa-lauf` bleibt Demo-
  Workflow, Entscheidung 25).
- Kein automatischer MT940-Import (manuell via `/bank-abgleich`,
  Entscheidung 24).
- Kein Personenkonten-Seed (Sammelkonten-Modell bleibt, Sprint 8
  Kandidat e).
- Keine Seed-Tests für Supabase-Branch (DEMO_MODE greift überall).

Bekannter Scope-Cut: `firma.json`-Änderungen erfordern App-Reload,
weil `?raw`-Import zur Build-Zeit aufgelöst wird. Für Demo-UX kein
Problem; für ein hypothetisches „Live-Reload-Demo" müsste man auf
`fetch` umstellen.
