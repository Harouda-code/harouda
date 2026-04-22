# Demo-Seed-Pre-Check — Musterfirma ins DEMO laden

Ziel des Reports: Bestandsaufnahme der aktuellen `demoSeed`-Funktion
gegenüber dem `demo-input/musterfirma-2025/`-Datensatz; Plan für
einen Sprint, der die Musterfirma beim Demo-Login automatisch
einspielt (keine manuelle CSV-/Formular-Eingabe).

Baseline: **951 Tests / 62 Dateien** · Stand 2026-04-20.

**Dieser Lauf ist reiner Plan — kein Code, keine Tests, keine
Seed-Änderung.**

---

## 1. Aktueller demoSeed-Inventar (Ist-Zustand)

Quellen:
- `src/api/demoSeed.ts` — 77 Zeilen · `autoSeedDemoIfNeeded()`
- `src/api/dashboard.ts:174-408` — `seedDemoData()`
- `src/main.tsx:52-54` — ruft `autoSeedDemoIfNeeded()` bei DEMO_MODE
- `src/pages/DashboardPage.tsx:123-130` — „Demo-Daten laden"-Button
  ruft `seedDemoData()` manuell

### 1.1 Was wird heute automatisch geseedet?

| Entity | Menge | Quelle | Auto beim Login? |
|---|---|---|---|
| Kanzlei-Settings | 1 Datensatz „Harouda Steuerberatung" | hardcoded in `demoSeed.ts:48-67` | ✓ (wenn `settingsKey` leer) |
| Mandanten (`clients`) | 3 (Schulz, Meyer, Roth) | hardcoded in `demoSeed.ts:20-38` | ✓ |
| SKR03-Konten | ~160 Konten | `SKR03_SEED` aus `skr03.ts` | ✓ (via `seedDemoData`) |
| Journal-Einträge | **15 Stück** | hardcoded in `dashboard.ts` | nein — nur via Button |
| FLAG-Key | `harouda:demo-seeded` = "1" | `demoSeed.ts:13, 72` | ✓ (Idempotenz) |

### 1.2 Was fehlt im heutigen demoSeed?

| Entity | Im demoSeed? | Implikation |
|---|---|---|
| Mitarbeiter (`employees`) | **nein** | `/personal/mitarbeiter` = leer |
| Kostenstellen (`cost_centers`) | **nein** | `/einstellungen/kostenstellen` = leer |
| Kostenträger (`cost_carriers`) | **nein** | `/einstellungen/kostentraeger` = leer |
| Anlagegüter (`anlagegueter`) | **nein** | `/anlagen/verzeichnis` = leer |
| AfA-Buchungen (`afa_buchungen`) | **nein** | Anlagenspiegel zeigt nichts |
| Lieferanten-Präferenzen | **nein** | `supplier_prefs` = leer (aber: keine eigene Entity für Lieferanten — nur `gegenseite` Freitext) |
| Bank-Transaktionen | **nein** | `/banking/reconciliation` leer — MT940-Import ist manuell |

### 1.3 Trigger-Pfade für den Seed

- **Automatisch beim Laden der App:** `main.tsx` ruft
  `autoSeedDemoIfNeeded()` bei DEMO_MODE; prüft FLAG-Key;
  legt bei leerem Zustand Mandanten + Settings + Konten + die
  15 Journal-Einträge an.
- **Manuell via Dashboard-Button:** „Demo-Daten laden" ruft
  `seedDemoData()` direkt → schreibt Konten + 15 Einträge in den
  Store, auch wenn der Seed schon lief.
- **FLAG-Key-Check:** verhindert **nur** das autoSeed-Paket
  (Mandanten + Settings), nicht das manuelle Re-Running von
  `seedDemoData`.

---

## 2. demo-input/musterfirma-2025/ — Soll-Stand

Datei-Inventar (`ls`-Output + `wc -l` pro Datei):

| Datei | Zeilen | Inhalt |
|---|---:|---|
| `firma.json` | 56 | Kühn Musterfirma GmbH, Osnabrück, Eröffnungsbilanz 2025-01-01 |
| `mitarbeiter.csv` | 4 (3 Daten) | Kühn (GF), Schulz (Sachbearbeiter), Fischer (Teilzeit) |
| `kunden.csv` | 6 (5 Daten) | Gauss, Riemann, Fourier, Euler, Leibniz |
| `lieferanten.csv` | 6 (5 Daten) | Alpha, Beta KG, Gamma, Delta, Epsilon |
| `kostenstellen.csv` | 6 (5 Daten) | VERW, VERTRIEB, EINKAUF, PROD, IT |
| `kostentraeger.csv` | 3 (2 Daten) | Webshop-Relaunch, Kunde-Müller-Auftrag |
| `anlagegueter.csv` | 9 (8 Daten) | Telefonanlage, Büromöbel, PKW, Gabelstapler, Laptop, Server, Bürostuhl (GWG), Monitor (Sammelposten) |
| `buchungen.csv` | 54 (52 Daten, Header + Trailer) | Eröffnungsbilanz (8) + Laufende Buchungen (39) + OPOS/Skonto/RC/IG (5) = **52 Buchungen** |
| `bankauszug.mt940` | 27 | 7 Bank-Transaktionen mit Skonto-Szenarien |
| `README.md` | ~650 | Walkthrough-Anleitung |
| `BEOBACHTUNGEN.md` | — | Leer zum Ausfüllen |

---

## 3. Lücken-Matrix

| Entity | Heute demoSeed | demo-input/ | Gap | Komplexität |
|---|---|---|---|---|
| Firma (Settings) | „Harouda Steuerberatung" | „Kühn Musterfirma GmbH" | **Konflikt-Entscheidung** | niedrig |
| Mandanten (clients) | 3 Beispiel-Mandanten | 5 Debitoren (andere Rolle!) | **semantischer Konflikt** | mittel |
| Kontenplan | SKR03 komplett | — | kein Gap | — |
| Mitarbeiter | 0 | 3 aus CSV | **fehlt vollständig** | niedrig |
| Kostenstellen | 0 | 5 aus CSV | **fehlt vollständig** | niedrig |
| Kostenträger | 0 | 2 aus CSV | **fehlt vollständig** | niedrig |
| Anlagegüter | 0 | 8 aus CSV | **fehlt vollständig** | mittel |
| AfA-Buchungen | 0 | — (indirekt via Lauf) | **fehlt vollständig** | mittel |
| Journal-Einträge | 15 hardcoded | 52 aus CSV | **Konflikt + Erweiterung** | hoch |
| Lieferanten | — | 5 aus CSV | keine Ziel-Entity (Sammelkonten) | **entfällt** |
| Bank-Transaktionen | — | MT940 mit 7 Tx | keine Entity im Store | mittel |
| Eröffnungsbilanz | implizit | explizit in firma.json | fehlt als Buchung | niedrig |

---

## 4. Technische Hürden

### 4.1 Async-Handling — können alle create* sequentiell aufgerufen werden?

Alle betroffenen APIs sind bereits async:
- `createClient` · `createEmployee` · `createCostCenter` ·
  `createCostCarrier` · `createAnlagegut` · `createEntry` ·
  `saveAfaBuchung`

Status: ✅ Alle bereits implementiert und getestet. Sequentieller
`await` über alle 47-52 Journaleinträge funktioniert — 40-80 ms
localStorage-Writes in Summe.

### 4.2 Hash-Kette bei N × createEntry

`createEntry` in `api/journal.ts:174-220` nutzt `lastChainHash()` +
`computeEntryHash()`. **Sequentieller await ist kritisch** —
parallele Aufrufe (Promise.all) würden die Kette zerstören, weil
mehrere Einträge denselben `prev_hash` bekämen.

Im Seed muss die Schleife strikt seriell laufen:
```ts
for (const entry of entries) {
  await createEntry(entry); // sequentiell, kein Promise.all
}
```

Status: ✅ Umsetzbar, kein architektonisches Problem.

### 4.3 AfA-Lauf aus dem Seed heraus

`AnlagenService.planAfaLauf(jahr, gueter)` ist synchron pure.
`commitAfaLauf(plan)` iteriert und ruft `createEntry` + `saveAfaBuchung`
— async, sequenziell. Das funktioniert aus einem Seed-Kontext.

**Design-Frage:** Soll der AfA-Lauf bereits gebucht oder nur
vorbereitet sein? Wenn gebucht: Anlagenspiegel zeigt Werte sofort,
aber User kann den AfA-Lauf nicht mehr „entdecken". Wenn nicht
gebucht: /anlagen/afa-lauf zeigt offenen Plan für 2025. Siehe
Entscheidungs-Matrix Frage 25.

Status: ✅ technisch umsetzbar; Fachfrage offen.

### 4.4 CSV-Parser-Reuse im Seed?

`parseJournalCsv(text, options)` ist eine reine Funktion. Die
CSV-Datei müsste in den Seed-Kontext geladen werden (fetch/import).

**Optionen:**
- A) `fetch('/demo-input/musterfirma-2025/buchungen.csv')` zur
  Runtime → funktioniert nur wenn die Datei im `public/`-Ordner
  liegt (aktuell nicht der Fall — `demo-input/` ist außerhalb
  `public/`).
- B) **Hardcodieren als TypeScript-Array** im Seed-Code → keine
  Fetch-Abhängigkeit, deterministisch, aber Daten sind redundant
  zur CSV.
- C) Build-Time-Import via Vite `import buchungenCsv from
  '../../demo-input/musterfirma-2025/buchungen.csv?raw'` → Vite
  serialisiert den CSV-Inhalt zur Build-Zeit in den Bundle.

Status: **Entscheidungs-Frage (siehe Matrix, Frage 23).**

### 4.5 MT940-Bank-Transaktionen — gibt es eine Store-Entity?

Grep-Ergebnis: `parseBankFile` wird nur in `BankReconciliationPage`
verwendet. Es gibt **keine Store-Entity** für Bank-Transaktionen —
`BankTx` wird als flüchtige `useState<Row[]>` in der Page
gehalten.

Daher: **MT940-Bankauszug kann nicht geseedet werden**, weil kein
Zielspeicher existiert. Der User muss `bankauszug.mt940` manuell
hochladen, wenn er den Abgleich-Workflow testen will.

Status: **nicht automatisch seedbar** — der Bankauszug verbleibt
als Demo-Download-Artefakt, UI-Workflow bleibt manuell.

---

## 5. Risiko-Analyse für die 951 Tests

### 5.1 Grep-Ergebnisse

- `grep "inserted_entries.*[0-9]" src/**/*.test.ts` → **0 Treffer**.
  Kein Test asserted die konkrete Anzahl der Demo-Einträge.
- `grep "seedDemoData|autoSeedDemoIfNeeded" src/**/*.test.ts` →
  **0 Treffer**. Der Seed-Pfad ist test-frei.
- `grep "harouda:demo-seeded"` → nur in `demoSeed.ts` + docs. Kein
  Test-Assert.

### 5.2 Potenziell betroffene Tests

- **Happy-dom + localStorage:** `main.tsx` ruft `autoSeedDemoIfNeeded`
  beim App-Start. Tests, die `main.tsx` rendern (sollten es nicht,
  i.d.R. werden Einzel-Komponenten gerendert), könnten den Seed
  triggern. Kein solcher Test bekannt.
- **DashboardPage-Tests:** nicht vorhanden — keine
  `pages/DashboardPage.test.tsx`.
- **KPIs-Tests:** `buildKpis` ist pure über entries + accounts, kein
  Seed-Abhängigkeit.

### 5.3 Erwartete Regression

**Niedrig.** Bei sorgfältigem Idempotenz-Check
(FLAG-Key analog heute) besteht kein Risiko für bestehende Tests.

Empfehlung: nach der Umsetzung `npx vitest run` ausführen und
Regression prüfen; kein Test muss präventiv angepasst werden.

---

## 6. Umfang-Schätzung pro Sub-Aufgabe

Alle Angaben in **neuen LOC** (Zeilen Code im Seed-Modul;
bestehende Dateien unverändert):

| Sub-Aufgabe | Geschätzter Scope | Risiko |
|---|---:|---|
| Firma-Settings umstellen (Kühn Musterfirma) | ~40 | niedrig |
| Bestehende Mandanten-Seeds ersetzen / erweitern | ~60 | mittel (UI-Integration) |
| Mitarbeiter-Seed (3 via createEmployee) | ~60 | niedrig |
| Kostenstellen-Seed (5 via createCostCenter) | ~50 | niedrig |
| Kostenträger-Seed (2 via createCostCarrier) | ~30 | niedrig |
| Anlagen-Seed (8 via createAnlagegut) | ~120 | mittel |
| AfA-Lauf Trigger (optional) | ~30 | mittel (Design-Frage 25) |
| Journal-Bulk-Seed 52 Einträge | ~130 | hoch (Hash-Kette, CSV-Reuse-Entscheidung) |
| Eröffnungsbilanz-Splits | im Journal-Bulk | — |
| Bank-MT940 | — (nicht seedbar) | entfällt |
| Integration in `autoSeedDemoIfNeeded` | ~30 | niedrig |
| Dokumentations-Update (CLAUDE.md, README-Hinweise) | ~40 | niedrig |
| **Summe neue LOC** | **~590** | **mittel** |
| **Summe modifizierte Bestandszeilen** | ~30 in `demoSeed.ts` + `dashboard.ts` | niedrig |

---

## 7. Phasen-Vorschlag

Abhängigkeiten beachten — **Reihenfolge ist nicht beliebig**:

1. **Phase 1 — Firma + Settings + Mandanten neu aufsetzen.** Klärt
   die Identitäts-Frage (21) vorab; liefert kanzleiName/Address-
   Defaults, falls Kühn als Kanzlei gewählt wird.
2. **Phase 2 — Stammdaten-Seed (Mitarbeiter, KST, KTR).** Unabhängig
   voneinander, parallel lauffähig; blockiert aber Phase 4/5, weil
   KST/KTR-Codes in Journal-Buchungen referenziert werden.
3. **Phase 3 — Anlagegüter-Seed.** Abhängig von Phase 1 (Firma) +
   SKR03-Konten. Nach diesem Punkt ist
   `/anlagen/verzeichnis` befüllt.
4. **Phase 4 — Journal-Bulk-Seed** (52 Einträge). Abhängig von KST/
   KTR-Codes aus Phase 2. Triggert implizit OPOS-Derived-View.
5. **Phase 5 — AfA-Lauf 2025 (optional) + Anlagenspiegel.** Nur
   sinnvoll nach Phase 3. Design-Frage 25 entscheidet, ob gebucht
   oder nur vorbereitet.
6. **Phase 6 — Integration in `autoSeedDemoIfNeeded`** +
   Idempotenz-Check. Neuer FLAG-Key-Wert oder bestehender FLAG
   weiter verwenden.
7. **Phase 7 — Test-Lauf + Regression-Verifikation + Doku.**

---

## 8. Design-Fragen (NICHT autonom — Entscheidungs-Matrix)

Vorschläge sind nicht verbindlich; jede muss vom User bestätigt
werden bevor Phase 1 startet.

| Nr. | Frage | Optionen | Vorschlag | Reversibilität |
|---:|---|---|---|---|
| 21 | Firma-Identität: Kühn Musterfirma als **Kanzlei** oder als **Mandant der Kanzlei Harouda**? | A Kühn = Kanzlei (ersetzt Harouda-Settings); B Harouda bleibt Kanzlei + Kühn als ausgewählter Mandant mit eigenen Buchungen | **B** — näher am fachlichen Muster (Steuerberater bucht für Mandant); Einträge bekommen `client_id = Kühn-Mandanten-ID` | mittel |
| 22 | Bestehende 15 Journal-Hardcoded-Einträge: **ersetzen** durch Musterfirma-47, **koexistieren**, oder **behalten**? | A ersetzen; B koexistieren; C nur Musterfirma wenn kein Bestand | **A ersetzen** — die 15 isoDaysAgo-Einträge sind für einen anderen Mandanten (Harouda-Kanzlei); Doppel-Daten verwirren | leicht |
| 23 | CSV-Parser-Reuse oder hardcoded TS-Array? | A runtime fetch + parseJournalCsv; B hardcoded TS-Array; C Vite `?raw`-Import zur Build-Zeit | **C** — deterministisch, keine Fetch-Abhängigkeit, Single Source of Truth mit der Demo-CSV, Build-stabil | mittel |
| 24 | MT940-Bankauszug: **auto-seeden** (neue Store-Entity) oder **Download-Artefakt**? | A Store-Entity für Bank-Tx einführen und seed; B manueller Download + Upload-Workflow bleibt | **B** — kein Scope-Creep; Bank-Tx hat heute keine Persistenz-Entity, einführen wäre eigener Sprint | leicht |
| 25 | AfA-Lauf 2025 im Seed **bereits buchen** oder **offen lassen**? | A buchen (Anlagenspiegel sofort populiert); B offen (User trigger manuell über /anlagen/afa-lauf); C halber Lauf (nur einige Jahre) | **B** — User entdeckt den AfA-Lauf-Workflow selbst; Anlagen-Verzeichnis zeigt Live-Vorschau, /anlagen/afa-lauf hat den Commit-Button | leicht |
| 26 | Idempotenz: FLAG-Key-Strategie bei mehrfachem Seed-Call? | A bestehender FLAG „harouda:demo-seeded"; B neuer FLAG mit Version; C Voll-Clear und Neu-Seed | **B** — neuer FLAG „harouda:demo-seeded-v2" weil Daten-Umfang sich ändert; alte FLAG-User sehen den Musterfirma-Seed beim nächsten Browser-Refresh | leicht |
| 27 | Lieferanten aus CSV: **eigene Entity** oder nur **Freitext `gegenseite`**? | A SupplierPreference-Seed (existierende Entity); B nur als `gegenseite`-Strings in Buchungen | **B** — Sammelkonten-Modell wie bisher, SupplierPreference ist für Bank-Abgleich-Optimierung, nicht Stammdaten | leicht |
| 28 | Neue npm-Dependency nötig? | A nein; B ja | **A nein** — `parseJournalCsv`, `parseMT940`, `createAnlagegut`, `createEmployee` sind alle bereits im Projekt | — |
| 29 | Buchungsdaten der 47 Einträge **2025 fest** lassen (wie CSV) oder **relativ zu heute** verschieben? | A fest (historische Daten 2025); B relativ (`isoDaysAgo` wie heutige 15 Einträge) | **A fest** — Musterfirma ist explizit Geschäftsjahr 2025, Vorjahres- und Stichtagsberichte werden so aussagekräftig | leicht |
| 30 | Sprint-Scope-Grenze: Demo-Seed-Sprint **vor** Sprint 8 oder **statt** eines Sprint-8-Kandidaten? | A als eigener Mini-Sprint 7.5; B als Teil eines der Sprint-8-Kandidaten | **A** — eigener kleiner Sprint, ~2-3 Stunden, produkt-demo-relevant | — |

---

## 9. Empfehlung

**Empfehlung: vollständige Implementierung als Mini-Sprint** (Sprint-
7.5 oder ähnlich) **vor** Sprint 8.

**Gründe:**

1. Keine fachliche Lücke vorhanden — alle Create-APIs existieren,
   CSV-Parser funktioniert, Hash-Kette ist robust.
2. Umfang überschaubar (~590 neue LOC, sequentielle
   Implementierung, minimales Regressions-Risiko).
3. **Produkt-Wert ist hoch:** der „Demo-Login zeigt sofort
   repräsentative Zahlen"-Use-Case ist der Kern-UX-Pfad für
   Interessenten und Prüfer.
4. Keine offenen Rechtsfragen — alle Daten-Szenarien sind in
   Sprints 1-7 abgedeckt, inklusive GoBD/HGB/UStG-Szenarien.

**STOPP-Bedingungen nicht erfüllt:** kein > 90 %-Pfad (aktuell
~0 % der Musterfirma-Daten im demoSeed, nur SKR03-Konten sind
gemeinsam).

**Voraussetzung:** Antwort zu den 10 Design-Fragen (21-30). Ohne
die Entscheidung zu Frage 21 (Kanzlei-Identität) kann Phase 1
nicht starten.

---

## 10. Nicht in Scope dieses Mini-Sprints

- Bank-Transaktion-Entity (Frage 24, Option A)
- Lieferanten-Stammdatenentität (Frage 27, Option A)
- ERiC-Anbindung / P1-Blocker
- Personenkonten-Architektur (Sprint 8 Kandidat e)
- Kombiniertes Jahresabschluss-PDF (Sprint 8 Kandidat f)

---

## 11. Plan zur Freigabe bereit

**Status:** Pre-Check abgeschlossen. 10 Design-Fragen warten auf
User-Entscheidung. Nach Freigabe kann der detaillierte Umsetzungs-
Plan (analog `SPRINT-6-TEIL-2B-PLAN.md` /
`SPRINT-7-PLAN-DETAIL.md`) erstellt werden.

**Nicht angetastet:** Code, Tests, Seeds, Migrations, andere
Dokumente. Baseline bleibt **951 Tests / 62 Dateien grün**.
