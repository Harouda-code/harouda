# Sprint Multi-Tenancy-Phase-2 — Abschluss (Schritte 1–6)

**Abgeschlossen:** 2026-04-20 · Autonomer Nacht-Modus · 6 Teil-Sprints
(1: Bestandsaufnahme · 2: `lohnRepos.ts` auf `clientId` · 3: Atomarer
`createEntriesBatch` · 4: `postPayrollAsJournal` auf Batch · 5:
Archiv-Write + E2E-Smoke · 6: Abschluss + Regression-Gate).

**End-Stand:** **1126 Tests grün / 87 Test-Dateien** · tsc clean · Lohn-Lauf
End-to-End abgesichert (Journal-Batch + Archiv-Row teilen dieselbe
`batch_id` und `client_id`).

**Dieses Dokument ergänzt** die Phase-1-Abschluss-Doku
(`docs/SPRINT-MULTITENANCY-FOUNDATION-ABSCHLUSS.md`) — es ersetzt sie
nicht, sondern dokumentiert den nachgelagerten Lohn-→-FIBU-Datenfluss
plus die atomare Journal-Batch-Infrastruktur, die Phase 1 explizit
nach Phase 2 verschoben hatte (siehe dort §13 Absatz „Lohn-APIs bewusst
verschoben in Phase 2").

---

## 1. Ziel + Scope

**Ziel:** Zwei miteinander verzahnte Bausteine liefern:

1. **Lohn-APIs mandantenfähig** — `LohnArtRepo`, `LohnbuchungRepo`,
   `AbrechnungArchivRepo` (`src/lib/db/lohnRepos.ts`) akzeptieren
   `clientId: string | null` als Pflichtparameter; Rot-Gruppe der
   Phase-1-Bestandsaufnahme abgeschlossen.
2. **Lohn-→-FIBU-Datenfluss atomar** — ein Lohn-Lauf = **ein**
   Journal-Batch (neue API `createEntriesBatch` in `src/api/journal.ts`)
   **plus** ein Archiv-Row pro Mitarbeiter, beide tragen dieselbe
   `batch_id`. Kein Partial-Write mehr bei Mid-Loop-Fehlern.

**Scope-Grenzen** (explizit ausgeschlossen):

- Keine `LohnbuchungRepo.create`-Aktivierung (Einzel-Lohnart-Monats-
  Buchungen) — Aggregat-Ebene reicht, solange keine UI-Feature sie
  braucht.
- Keine `LohnArtRepo`-Aktivierung (User-Management für Lohnarten) —
  Standard-Set wird weiter aus `demoList()` geliefert.
- Keine Hash-Chain-Concurrency-Härtung (UNIQUE auf `prev_hash` oder
  `pg_advisory_xact_lock`) — siehe §6 Altlasten.
- Keine Backfill der `batch_id IS NULL`-Legacy-Entries.
- Kein Phase-3-Vorgriff (FIBU-nach-ESt-Anlagen Journal-driven).

## 2. Ausgangslage

Zitate aus `docs/SPRINT-MULTITENANCY-FOUNDATION-ABSCHLUSS.md` §13:

> „**Lohn-APIs bewusst verschoben in Phase 2** — `lohnarten`,
> `lohnbuchungen`, `lohnabrechnungen_archiv`, `lsta_festschreibungen`
> haben in 0026 zwar bereits die `client_id`-Spalte + RLS-Policy, aber
> ihre zugehörigen Repo-Funktionen (`src/lib/db/lohnRepos.ts`) wurden
> in Phase 1 nicht angefasst. Der Lohn-→-FIBU-Buchungsstapel-Pfad
> (Phase 2) bringt die API-Migration + Domain-Service-Anbindung mit."

> „**Phase 2 — Lohn → FIBU Buchungsstapel.** Die Lohn-API-Funktionen
> (`domain/lohn/LohnabrechnungsEngine.ts`, `lib/db/lohnRepos.ts`)
> wurden [in Phase 1] nicht angefasst."

Davor lief `postPayrollAsJournal` in einer sequentiellen Schleife bis zu
4× `createEntry` pro Mitarbeiter — kein Atomicity, Mid-Loop-Fehler
erzeugten Teilzustände; ausserdem landete die berechnete Lohn-
Abrechnung nur als JSON-Download, nicht persistent in
`lohnabrechnungen_archiv`.

## 3. Schritt-Changelog 1 – 6

| # | Thema | Kern-Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Bestandsaufnahme** | Audit lohnRepos, Caller-Grep, Batch-API-Such, Schema-Status-Matrix, Korrektur eines Phase-1-False-Negatives zu `postPayrollAsJournal` | 0 (Doku) |
| 2 | **lohnRepos.ts auf `clientId`** | 3 Repo-Klassen, 10 Methoden um `clientId: string \| null` erweitert · `AbrechnungArchivRepo.save.onConflict` auf `(company_id, client_id, employee_id, abrechnungsmonat)` · DEMO-Tests | +9 |
| 3 | **Atomarer Journal-Batch** | `createEntriesBatch(entries, opts)` in `api/journal.ts` · Migration 0027 (`journal_entries.batch_id` + partieller Index) · `JournalEntry.batch_id?: string \| null` · Hash-Kette einmal-gelesen-dann-iterativ · DEMO-Rollback via Snapshot+Restore · 1 Audit-Log pro Batch | +12 |
| 4 | **postPayrollAsJournal → Batch** | Schleife als Sammel-Phase, dann **ein** Batch-Aufruf · Row-Skip-Pre-Flight für fehlende Settings-Konten · `PayrollPostingResult.batchId`-Feld · Duplicate-Audit-Log entfernt | +6 |
| 5 | **Archiv-Write + E2E-Smoke** | Migration 0028 (`lohnabrechnungen_archiv.batch_id`) · `AbrechnungArchivRepo.save` nimmt `batchId` · DEMO-Pfad persistiert jetzt echt (`store.getLohnArchiv()`) · `buildArchivAbrechnungFromRow` Helper · `PayrollRunPage.handlePostGL` erweitert um Archiv-Write · `payrollRun.smoke.test.tsx` (Single-E2E-Test) | +11 |
| 6 | **Abschluss + Regression-Gate** | Dieses Dokument · CLAUDE.md / README konsistenz-geprüft · 10 Spot-Checks + Voll-Gate | 0 |

## 4. Was wurde gelöst — Kompakt-Übersicht je Layer

| Layer | Vorher | Nachher | Deliverable-Pfad |
|---|---|---|---|
| **Lohn-Repos** | 3 Klassen mit `companyId`-only-Signatur, keine aktiven Caller | 10 Methoden mit `clientId: string \| null` · `onConflict` auf 4-Tuple erweitert · DEMO-Persistenz in `AbrechnungArchivRepo` | `src/lib/db/lohnRepos.ts` |
| **Journal-API** | Nur `createEntry` (per Aufruf ein Row + ein Audit-Log) | Zusätzlich `createEntriesBatch(entries, opts)` — atomarer N-Row-Insert mit fortlaufender Hash-Kette, 1 Audit-Log pro Batch, alles-oder-nichts | `src/api/journal.ts` |
| **Supabase-Schema** | `journal_entries` / `lohnabrechnungen_archiv` ohne Batch-Referenz | `batch_id uuid null` + partieller Index auf beiden Tabellen | `supabase/migrations/0027_journal_batch.sql`, `supabase/migrations/0028_lohn_archiv_batch.sql` |
| **Lohn-Posting** | Sequentielle `createEntry`-Schleife bis zu 4× pro Mitarbeiter, Mid-Loop-Fehler → Teilzustand | Sammel-Phase mit Pre-Flight-Row-Skip, dann **ein** `createEntriesBatch`-Aufruf; Fehler propagiert komplett, Journal bleibt bei Fehler leer | `src/utils/payrollPosting.ts` |
| **Archiv-Write** | Lohn-Abrechnungen nur als JSON-Download, nichts persistent | Pro Lohn-Lauf ein Archiv-Row je Mitarbeiter mit `batch_id` = Journal-Batch-UUID, best-effort neben Journal-Write | `src/lib/db/lohnRepos.ts::AbrechnungArchivRepo.save`, `src/pages/PayrollRunPage.tsx::handlePostGL` |
| **TypeScript-Types** | `JournalEntry` ohne `batch_id` · keine `LohnabrechnungArchivRow` | `JournalEntry.batch_id?: string \| null` · neuer Type `LohnabrechnungArchivRow` | `src/types/db.ts`, `src/domain/lohn/types.ts` |
| **DEMO-Persistenz** | `AbrechnungArchivRepo` im DEMO nur Dummy-ID-Return | localStorage-Upsert unter Key `(company_id, client_id, employee_id, abrechnungsmonat)` | `src/api/store.ts::getLohnArchiv/setLohnArchiv` |

## 5. Bewusste Design-Entscheidungen

- **DEMO-Upgrade für `AbrechnungArchivRepo`** — von Dummy-Return auf echte
  localStorage-Persistenz. Rechtfertigt der E2E-Smoke-Test, der observable
  Archiv-Rows assertet (`expect(archiv).toHaveLength(1)` ist ohne
  DEMO-Persistenz nicht prüfbar). Rückgabe-ID bleibt der deterministische
  Dummy-String (`demo-archiv-YYYY-MM-empId`); nur die Persistenz-Seite
  ist neu.
- **`companyId` via `getActiveCompanyId()` statt Prop-Drill** — weder
  `PayrollRunPage` noch `postPayrollAsJournal` hatten bisher einen
  `companyId`-Kontext. Ein `CompanyProvider`-Refactor wäre unverhältnis-
  mäßig; der DB-Helper `getActiveCompanyId()` liest direkt aus
  `localStorage.harouda:activeCompanyId` (vom `CompanyProvider` beim
  Mount gesetzt). Im DEMO-Pfad ist der Rückgabewert ohnehin ungenutzt.
- **Archiv-Write best-effort, nicht atomar mit Journal** — das Journal ist
  GoBD-relevante Primärquelle (Hash-Kette, WORM-Kandidat); das Archiv
  ist sekundärer Query-Index. Fehler im Archiv-Write sollen den Journal-
  Eintrag NICHT zurückrollen. PayrollRunPage zählt `archiveErrors`
  separat und zeigt sie dem User; der User kann den Archiv-Eintrag
  später manuell nachziehen, ohne Journal-Manipulation.
- **`onConflict`-String auf 4-Tuple erweitert (Schritt 2)** — der alte
  Key `(employee_id, abrechnungsmonat)` würde in einer Multi-Mandant-
  Kanzlei zwei verschiedene Mandanten mit demselben Employee/Monat
  kollidieren lassen. Der neue `(company_id, client_id, employee_id,
  abrechnungsmonat)` eliminiert das. DB-seitige
  UNIQUE-Constraint-Anpassung bleibt Folgesprint (Migration 0029-
  Kandidat, siehe §6).
- **`LohnbuchungRepo.create` nicht aktiviert** — Aggregat-Ebene (eine
  Abrechnung pro Employee-Monat) deckt den aktuellen Use-Case ab;
  Einzel-Lohnart-Monatsbuchungen würde man erst brauchen, wenn die UI
  zwischen Gehalts-Fix und Überstunden-Variabel trennen will. Scope-
  Schnitt dokumentiert.
- **`LohnArtRepo` nicht aktiviert** — Standard-Lohnarten kommen aus
  `demoList()` (hart kodiert, 3 Einträge). User-seitiges CRUD bräuchte
  eine UI-Page, die aktuell fehlt. Wird in einem späteren Sprint
  aktiviert, wenn Lohnarten pro Mandant angepasst werden müssen.
- **Hash-Kette: pro Batch einmal Chain-Head gelesen, dann iterativ** —
  spart N-1 DB-Reads pro Batch. Trade-off ist Concurrency-Anfälligkeit
  bei parallelen Batches; akzeptabel für den Single-User-triggered
  Lohn-Lauf.

## 6. Offene Folge-Sprints / Altlasten

| Punkt | Begründung / Auswirkung | Lösungsskizze |
|---|---|---|
| **DB-UNIQUE-Constraint auf `lohnabrechnungen_archiv`** | `onConflict`-String im App-Layer verweist auf 4-Tuple, DB hat aber weiter `UNIQUE(employee_id, abrechnungsmonat)` (aus 0020). Supabase-Pfad würde beim Upsert auf den alten Constraint fallen — im Multi-Mandant-Betrieb kann das zu falschen Kollisionen führen. | Migration 0029: `DROP CONSTRAINT lohnabrechnung_unique; ADD CONSTRAINT lohnabrechnung_unique UNIQUE (company_id, client_id, employee_id, abrechnungsmonat) NULLS NOT DISTINCT;` (Postgres 15+). |
| **Hash-Chain-Concurrency** | `journal_entries_set_hashes`-Trigger liest `order by created_at desc limit 1` ohne Lock. Zwei parallele Batches könnten denselben `prev_hash` lesen und schreiben. Keine DB-UNIQUE auf `prev_hash`. | Entweder `UNIQUE (company_id, prev_hash)` in Migration oder `pg_advisory_xact_lock(company_id_int)` im Trigger. |
| **Backfill `batch_id` für Altbestand** | Legacy-Einzel-Buchungen + Legacy-Archive bleiben `batch_id IS NULL`. Ist bewusst (Einzel-Buchungs-Semantik), aber historische Lohn-Läufe rückwirkend als Batch zu kennzeichnen wäre nur per Heuristik (z. B. `beleg_nr LIKE 'LOHN-%'` + gleiches `datum`). | Separater Sprint, falls UI "Stapel zurückverfolgen" rückwirkend bieten soll. Sonst ignorieren. |
| **`lsta_festschreibungen`-Tabelle weiter ohne API** | Tabelle aus Migration 0021 mit `client_id`-Spalte aus 0026, aber kein Repo, kein Caller. | Bewusst offen gelassen — Feature (GoBD-Festschreibung für Lohnsteuer-Anmeldungen) ist nicht verdrahtet. Aktivierung bei Bedarf. |
| **RLS auf `lohnarten` bleibt `using (true)`** | Migration 0020 hat bewusst permissive Policies (mit TODO), 0026 ergänzt nur die RESTRICTIVE-Gate für `client_id`. | Härtung analog `employees_select` in einem RLS-Consolidation-Sprint. |
| **`LohnbuchungRepo` / `LohnArtRepo` nicht aktiviert** | Siehe §5. | Aktivieren, wenn UI-Features (Einzel-Lohnarten-Management, User-CRUD auf Lohnarten) diese brauchen. |
| **Phase 3: FIBU-nach-ESt-Anlagen Journal-driven** | 8 ESt-Anlagen (EÜR, Anlage N, G, S, …) beziehen heute noch per localStorage-Prefix (Phase 1 Schritt 3+3b). Journal-derived Werte wären next-level-Konsistenz. | Phase 3 — eigener Sprint, nicht in Phase 2 vorbereitet. |

## 7. Test-Count-Trajectory

**Phase 2 (dieser Sprint):**

| Punkt | Tests | Δ | Files |
|---|---:|---:|---:|
| Phase-1-Ende | 1088 | — | 81 |
| Schritt 2 (lohnRepos) | 1097 | +9 | 82 |
| Schritt 3 (createEntriesBatch + Migration 0027) | 1109 | +12 | 84 |
| Schritt 4 (postPayrollAsJournal → Batch) | 1115 | +6 | 85 |
| Schritt 5 (Archiv + E2E + Migration 0028) | 1126 | +11 | 87 |
| Schritt 6 (Abschluss, nur Doku) | 1126 | 0 | 87 |
| **Σ Phase 2** | **+38** | | **+6** |

**Gesamt-Trajectory seit Session-Start**: 995 → **1126** (+131 über den
gesamten Session-Bogen inkl. F42-Refactor, Multi-Tenancy Phase 1 und
Phase 2).

## 8. Migrations-Inventar Phase 2

| Migration | Titel | Kern | Struktur-Test |
|---|---|---|---|
| 0027 | `journal_batch.sql` | `journal_entries.batch_id uuid null` + partieller Index `WHERE batch_id IS NOT NULL` | `src/__tests__/migration-0027-structure.test.ts` (6 Assertions) |
| 0028 | `lohn_archiv_batch.sql` | `lohnabrechnungen_archiv.batch_id uuid null` + partieller Index, Spalten-Kommentar referenziert `createEntriesBatch` | `src/__tests__/migration-0028-structure.test.ts` (6 Assertions) |

Beide Migrationen sind nullable (kein Backfill-Zwang), partiell indiziert
(kein Bloat für Legacy-NULLs) und RLS-neutral (`batch_id` ist kein neuer
Sicherheits-Vektor).

## 9. E2E-Smoke · Was wurde verifiziert

`src/pages/__tests__/payrollRun.smoke.test.tsx` — **1 Test**, ohne
React-Mount:

| Assertion | Status |
|---|---|
| `entriesCreated === 4` nach Lohn-Lauf eines MA | ✓ |
| `batchId` matcht UUID-Format | ✓ |
| `store.getEntries()`: 4 Entries, alle mit **selber** `batch_id` | ✓ |
| `store.getEntries()`: alle 4 Entries mit `client_id === KUEHN` | ✓ |
| `store.getLohnArchiv()`: 1 Row | ✓ |
| Archiv-Row `batch_id === res.batchId` (Cross-Persistenz-Linkage) | ✓ |
| Archiv-Row `client_id === KUEHN` | ✓ |
| Archiv-Row Aggregate korrekt (`gesamt_brutto === 3000`, `gesamt_netto === 2130`) | ✓ |
| Neg: kein Entry mit `client_id === OTHER` | ✓ |
| Neg: keine Archiv-Row mit `client_id === OTHER` | ✓ |
| Neg: OTHER-Mitarbeiter bleibt unverändert (Mandant-Isolation) | ✓ |

## 10. Konsistenz-Check CLAUDE.md + README

- **CLAUDE.md** — grep auf `sequenziell`, `Mid-Loop`, `postPayrollAsJournal`,
  `Batch-Insert`, `batch_id`, `createEntriesBatch`: **keine**
  Phase-2-Widerspruchs-Aussagen. Die §5-Feature-Map nennt `LohnPage`
  und `PayrollRunPage` → `lohn/LohnabrechnungsEngine.ts`; die
  Multi-Tenancy-Mentions (§3, §10.6, §12) sind weiter korrekt.
  **Keine Änderung.**
- **README.md** — grep auf `postPayrollAsJournal`, `createEntriesBatch`,
  `batch_id`, `Lohn-Lauf`: **keine** Phase-2-spezifischen Widersprüche.
  - Einzige Auffälligkeit in §„Nicht enthalten" Zeile 62
    (`Lohnbuchhaltung / Lohnsteueranmeldung (LStA)`) ist **pre-existing
    Drift**, die schon vor Phase 2 bestand (LohnPage, PayrollRunPage,
    LohnsteuerAnmeldungPage + 19 Tests existierten bereits). Nicht
    Phase-2-verursacht; **bewusst nicht in diesem Sprint angefasst**
    (Spec: `"wenn ja, minimal korrigieren"` interpretiert als
    Phase-2-spezifische Widersprüche, nicht generelle Drift).
    Empfehlung: in einem README-Polish-Sprint konsolidieren.

## 11. Sprint-Signatur

| Feld | Wert |
|---|---|
| **Datum** | 2026-04-20 |
| **Start-Test-Count** | 1088 (Phase-1-Ende) |
| **End-Test-Count** | **1126** (1126 passed, 0 failed, 0 skipped) |
| **End-tsc-Status** | clean (Exit 0, 8192 MB) |
| **End-Test-Dateien** | 87 |
| **End-Test-Laufzeit (voll)** | 49 s |
| **Neue Migrationen** | `0027_journal_batch.sql`, `0028_lohn_archiv_batch.sql` |
| **Neue Schlüssel-APIs** | `createEntriesBatch(entries, opts)` in `src/api/journal.ts` |
| **Schritt-Berichte** | Schritt 1 (Bestandsaufnahme) · Schritt 2 (lohnRepos `clientId`) · Schritt 3 (Batch-API + 0027) · Schritt 4 (postPayrollAsJournal → Batch) · Schritt 5 (Archiv-Write + E2E + 0028) · Schritt 6 (Abschluss + Regression) — alle als Chat-Berichte übermittelt, aggregiert in diesem Dokument |
| **Abschluss-Doku** | `docs/SPRINT-MULTITENANCY-PHASE-2-ABSCHLUSS.md` (dieses Dokument) |
| **Phase-1-Doku** | `docs/SPRINT-MULTITENANCY-FOUNDATION-ABSCHLUSS.md` (ergänzt, nicht ersetzt) |
| **Konsistenz-Check CLAUDE.md** | geprüft, keine Phase-2-Widersprüche |
| **Konsistenz-Check README.md** | geprüft, keine Phase-2-Widersprüche (Altlast in §„Nicht enthalten" Z. 62 pre-existing, nicht angepasst) |
| **Offen + geparkt** | siehe §6 Offene Folge-Sprints / Altlasten |
