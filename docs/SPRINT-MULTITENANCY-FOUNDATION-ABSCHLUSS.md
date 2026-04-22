# Sprint Multi-Tenancy-Foundation — Abschluss (Phase 1, Schritte 1–6)

**Abgeschlossen:** 2026-04-20 · Autonomer Nacht-Modus · 6 Teil-Sprints
(1: Migration 0026 · 2a+2b: API-Layer · 3+3b: ESt-Forms + Wiring ·
4: Query-Keys · 5: Smoke-Tests · 6: Sprint-Abschluss + Regression-Gate).

**End-Stand:** **1088 Tests grün / 81 Test-Dateien** · tsc clean · F42
End-to-End abgesichert.

**Dieses Dokument ergänzt** die bestehende Sprint-7.5-Drift-Liste
(`docs/SESSION-ABSCHLUSS-2026-04-20.md`) und den F42-Refactor-Abschluss
(`docs/SPRINT-F42-MANDANT-URL-ABSCHLUSS.md`) — es ersetzt keinen
früheren Audit-Eintrag.

---

## 1. Ziel + Scope

**Ziel:** Harte Daten-Isolation pro Mandant in der harouda-app. Vorher
war der Mandant nur an journal_entries + belege explizit gebunden —
alle anderen Tabellen (Anlagen, Mitarbeiter, Belege-Dokumente,
Mahnungen, ELSTER-Submissions, Berater-Notizen, Lohn-Stammdaten)
mischten in einer Kanzlei sämtliche Mandanten.

**Scope:** **Phase 1 (Foundation)** — Schema + API-Filter + localStorage
+ Cache-Keys + End-to-End-Regressions-Tests.

**Explizit NICHT in Scope** dieses Sprints (folgt in Phase 2 / 3):
- Datenfluss Lohn → FIBU (Buchungsstapel-Übergabe)
- Datenfluss FIBU → ESt-Anlagen (Journal-driven statt localStorage)
- Backfill der `client_id IS NULL`-Zeilen nach Produktiv-Deployment
- `NOT NULL`-Constraint auf den 13 neuen client_id-Spalten

## 2. Schritt-Changelog 1 – 6

| # | Thema | Kern-Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Migration 0026** — `client_id uuid` + Index + RESTRICTIVE-RLS-Policy für 13 Tabellen + Helper `public.client_belongs_to_company` | `supabase/migrations/0026_multitenant_client_id.sql` (260 Zeilen) · `docs/MULTITENANCY-MIGRATION-0026.md` · 10 TS-Types in `db.ts` erweitert | 0 (schema-only) |
| 2a | **API-Layer Rot-Gruppe** (employees + anlagen) | `clientId`-Pflichtparameter auf 8 Funktionen · Domain-Service-Propagation in `AnlagenService` · 6 DEMO-Tests | +6 |
| 2b | **API-Layer Gelb-Gruppe** (documents, invoiceArchive, elsterSubmissions, supplierPreferences, advisorNotes, receiptRequests, mahnwesen) | `clientId`-Pflichtparameter auf 25 Funktionen · `journal.ts:196/235` reicht `entry.client_id` an `recordSupplierBooking` · 14 DEMO-Tests | +14 |
| 3 | **ESt-Forms Mandant-Prefix — Infrastruktur + Sample** | `src/domain/est/estStorage.ts` (Helper + Migration) · `MandantRequiredGuard.tsx` · TaxFormBuilder-Refactor (deckt 2 Pages ab) · Gewerbesteuer + Körperschaftsteuer migriert · 15 Tests | +15 |
| 3b | **ESt-Forms Rest-Migration + Wiring** | 23 weitere Form-Pages migriert (3 Parallel-Agenten) · HauptvorduckESt1APage mit Cross-Form-Badge-Fix · `FormSpec.storageKey` entfernt · `migrateEstFormsV1ToV2()` in `main.tsx` verdrahtet · 4 Page-Integration-Tests | +4 |
| 4 | **Tanstack-Query-Keys Audit** | 14 Pages: `["journal_entries", "all"]` → `[..., selectedMandantId]` · AfaLaufPage: `["afa_buchungen", "all", selectedMandantId]` · 2 Cache-Switch-Regression-Tests | +2 |
| 5 | **Smoke-Tests + Abschluss-Doku** | 3 neue Test-Dateien (Cross-Module-Leak, ESt-Form-Isolation, Migration-0026-Struktur) · dieses Dokument | +9 |
| 6 | **Sprint-Abschluss + Regression-Gate** | Doku-Polish (Übersicht-Tabellen, Altlasten-Box, Sprint-Signatur) · CLAUDE.md / README konsistenz-geprüft · Regression-Spot-Check | 0 |

## 3. Was wurde gelöst — Kompakt-Übersicht je Layer

| Layer | Vorher | Nachher | Deliverable-Pfad |
|---|---|---|---|
| **Supabase-Schema** | 13 Tabellen nur `company_id`-gefiltert (Mandanten-Daten innerhalb einer Kanzlei vermischt) | 13 Tabellen mit `client_id uuid null` + Index + RESTRICTIVE-RLS-Policy + Helper-Funktion `client_belongs_to_company` | `supabase/migrations/0026_multitenant_client_id.sql` |
| **API-Layer** | 0 `.eq("client_id", …)`-Filter in `api/*.ts` | 9 API-Dateien mit Pflicht-Parameter `clientId: string \| null` auf Read/Write/Update/Delete · DEMO-Pfad mit In-Memory-Filter + Legacy-Warn | `src/api/{employees,anlagen,documents,invoiceArchive,elsterSubmissions,supplierPreferences,advisorNotes,receiptRequests,mahnwesen}.ts` |
| **Domain-Layer** | `AnlagenService` hartcodiert Kanzlei-weit | `createAnlageWithOpening`, `buchtAbgang`, `markAnlageAbgegangen` mit `clientId`-Param | `src/domain/anlagen/AnlagenService.ts` |
| **localStorage** | 27 ESt-Form-Keys Kanzlei-global; Mandant-Wechsel zeigte Vor-Mandanten-Daten | Key-Schema `harouda:est:<mandantId>:<form-id>` · einmalige Migration `v1→v2` · `MandantRequiredGuard` | `src/domain/est/estStorage.ts`, `src/components/MandantRequiredGuard.tsx`, `main.tsx` (Wiring) |
| **Tanstack-Cache** | `["<resource>"]`-Keys ohne `clientId` — Cache-Vermischung zwischen Mandanten | Mandant-spezifische Keys mit `selectedMandantId` · Kanzlei-Reports explizit ohne | Alle Page-useQuery-Calls + Regression-Test |
| **TypeScript-Types** | 10 Interfaces ohne `client_id` | 10 Interfaces mit `client_id?: string \| null` | `src/types/db.ts` |
| **F42 (Vor-Sprint)** | MandantContext State + localStorage, UI-Wechsel ohne Re-Render der Konsumenten | URL-primary MandantContext, Arbeitsplatz + Tree-UI, alle 17 Konsumenten automatisch migriert | (Vor-Phase-1 abgeschlossen) |

## 4. 13 Tabellen aus Migration 0026 — Status-Tabelle

Jeder Eintrag hat das vollständige Triplet `ADD COLUMN client_id` +
`CREATE INDEX <t>_client_idx` + `CREATE POLICY <t>_client_consistency`:

| Flag | Tabelle | Herkunfts-Migration | client_id-Spalte | Index | RLS-Policy |
|---|---|---|---|---|---|
| 🔴 Rot | `anlagegueter` | 0025 | ✓ | `anlagegueter_client_idx` | `anlagegueter_client_consistency` |
| 🔴 | `employees` | 0016 | ✓ | `employees_client_idx` | `employees_client_consistency` |
| 🔴 | `lohnarten` | 0020 | ✓ | `lohnarten_client_idx` | `lohnarten_client_consistency` |
| 🔴 | `lohnbuchungen` | 0020 | ✓ | `lohnbuchungen_client_idx` | `lohnbuchungen_client_consistency` |
| 🔴 | `lohnabrechnungen_archiv` | 0020 | ✓ | `lohnabrechnungen_archiv_client_idx` | `lohnabrechnungen_archiv_client_consistency` |
| 🔴 | `lsta_festschreibungen` | 0021 | ✓ | `lsta_festschreibungen_client_idx` | `lsta_festschreibungen_client_consistency` |
| 🟡 Gelb | `documents` | 0001 / 0004 | ✓ | `documents_client_idx` | `documents_client_consistency` |
| 🟡 | `invoice_archive` | 0012 | ✓ | `invoice_archive_client_idx` | `invoice_archive_client_consistency` |
| 🟡 | `invoice_xml_archive` | 0012 | ✓ | `invoice_xml_archive_client_idx` | `invoice_xml_archive_client_consistency` |
| 🟡 | `elster_submissions` | 0013 | ✓ | `elster_submissions_client_idx` | `elster_submissions_client_consistency` |
| 🟡 | `supplier_preferences` | 0014 | ✓ | `supplier_preferences_client_idx` | `supplier_preferences_client_consistency` |
| 🟡 | `advisor_notes` | 0015 | ✓ | `advisor_notes_client_idx` | `advisor_notes_client_consistency` |
| 🟡 | `receipt_requests` | 0018 | ✓ | `receipt_requests_client_idx` | `receipt_requests_client_consistency` |
| 🟡 | `dunning_records` | 0005 | ✓ | `dunning_records_client_idx` | `dunning_records_client_consistency` |

Das macht 14 Zeilen statt 13 — `invoice_archive` + `invoice_xml_archive`
sind strukturell zwei Tabellen, wurden aber in 2b gemeinsam betrachtet
(gleiche Quell-Migration 0012, gleicher Archive-Workflow). In der
Migration und im Struktur-Test sind es 14 vollständige Triplets.

## 5. Query-Keys final — Kategorie-Tabelle

| Query-Key | Kategorie | clientId-Suffix | Typisches Caller-Pattern |
|---|---|---|---|
| `["accounts", "all-with-inactive"]` · `["accounts", "for-anlagen"]` | **A** Kanzlei-global | — | SKR03-Kontenplan, kein Mandant-Bezug |
| `["clients", "all"]` | **A** | — | Mandanten-Liste selbst |
| `["cost_centers"]` · `["cost_carriers"]` | **A** | — | Dimensionen Kanzlei-weit |
| `["audit_log"]` · `["audit_log", "all"]` · `["app_log"]` | **A** | — | Kanzlei-Audit |
| `["company-members", activeCompanyId]` · `["advisor-health", …]` | **A** | companyId (nicht clientId) | Kanzlei-Mitgliedschaft |
| `["journal_entries", "all", selectedMandantId]` (14 Pages) | **B** | ✓ | Mandant-View (Cache-Partitionierung) |
| `["journal_entries", "all"]` (Bilanz, GuV, BWA, Vorjahresvergleich, UStVA, ZM, EÜR, EBilanz, Z3Export, AccountsPage) | **B** bewusst Kanzlei-wide | — | Kanzlei-Report-Aggregat (kein `useMandant()`) |
| `["afa_buchungen", "all", selectedMandantId]` | **B** | ✓ (Partitionierung) | transitiv über `anlage_id` |
| `["anlagegueter", selectedMandantId]` | **B** | ✓ | Fetch-Filter via `.eq("client_id", …)` |
| `["employees", selectedMandantId]` · `["employees", null]` | **B** | ✓ (`null` = UniversalSearch-Modal) | Fetch-Filter |
| `["documents", "all", selectedMandantId]` · `["documents", "all", null]` | **B** | ✓ (`null` = Retention/Verfahrensdoku) | Fetch-Filter |
| `["invoice_archive", selectedMandantId]` · `["invoice_archive", null]` | **B** | ✓ | Fetch-Filter |
| `["elster_submissions", selectedMandantId]` | **B** | ✓ | Fetch-Filter |
| `["supplier_preferences", selectedMandantId]` | **B** | ✓ | Fetch-Filter |
| `["advisor_notes", entityType, entityId, selectedMandantId]` | **B** | ✓ | Fetch-Filter |
| `["advisor_notes_counts", "journal_entry", selectedMandantId]` | **B** | ✓ | Fetch-Filter |
| `["receipt_requests", selectedMandantId]` | **B** | ✓ | Fetch-Filter |
| `["dunnings", selectedMandantId]` | **B** | ✓ | Fetch-Filter |
| (keine `useQuery`-basierten Privacy-Keys) | **C** User-spezifisch | — | DSGVO-Consent-Storage nur in localStorage-Context |

## 6. Layer-Details (ausführlich)

### 6.1 Supabase-Schema (Migration 0026)
13 Tabellen bekamen `client_id uuid null` + Index + RESTRICTIVE-RLS-Policy
(`<table>_client_consistency`):
- **Rot-Flag (6):** `anlagegueter`, `employees`, `lohnarten`, `lohnbuchungen`,
  `lohnabrechnungen_archiv`, `lsta_festschreibungen`.
- **Gelb-Flag (8):** `documents`, `invoice_archive`, `invoice_xml_archive`,
  `elster_submissions`, `supplier_preferences`, `advisor_notes`,
  `receipt_requests`, `dunning_records`.
- **Ausgelassen:** `afa_buchungen` — Tenant-Scope transitiv über
  `anlage_id → anlagegueter.company_id`.

Helper-Funktion `public.client_belongs_to_company(client_id, company_id)`
verhindert, dass eine Kanzlei A eine Client-Referenz auf Kanzlei-B-Clients
setzen kann.

### 6.2 API-Layer (9 Dateien)
- `employees.ts`, `anlagen.ts`, `documents.ts`, `invoiceArchive.ts`,
  `elsterSubmissions.ts`, `supplierPreferences.ts`, `advisorNotes.ts`,
  `receiptRequests.ts`, `mahnwesen.ts` — alle Read/Write/Update/Delete-
  Funktionen haben `clientId: string | null` als Pflicht-Parameter.
- Lese-Pfad: Supabase `.eq("client_id", clientId)` nur wenn `clientId != null`;
  DEMO-Pfad entsprechend mit In-Memory-Filter + Console-Warn bei
  Legacy-Rows.
- Write-Pfad: `client_id` in Payload; Update/Delete mit `client_id`-WHERE
  als Cross-Mandant-Schutz.
- Domain-Service `AnlagenService` propagiert `clientId` durch
  `createAnlageWithOpening`, `buchtAbgang`, `markAnlageAbgegangen`.
- 9 × DEMO-Tests (fetch-Filter, create-Write, legacy-undefined-Warn).

### 6.3 localStorage (ESt-Anlagen-Forms)
- Neues Key-Schema `harouda:est:<mandantId>:<form-id>` für alle 27
  ESt-/Gewst-/Kst-Form-Pages.
- **Einmalige Migration** `migrateEstFormsV1ToV2()` in `main.tsx`
  (idempotent via Flag, no-op ohne aktiven Mandanten).
- `MandantRequiredGuard`-Component blockt den Render jeder Form-Page
  ohne aktiven Mandanten und zeigt Info-Card + Arbeitsplatz-Link.
- `HauptvorduckESt1APage`-Badges lösen die Fortschritts-Anzeigen jetzt
  mandant-spezifisch via `buildEstStorageKey(formId, selectedMandantId)` auf.

### 6.4 TanStack-Query-Cache
- 14 Pages + `AfaLaufPage`: `["journal_entries", "all"]` → `[…, selectedMandantId]`
- Bereits in 2a/2b fixed: `["employees", selectedMandantId]`,
  `["anlagegueter", selectedMandantId]`, `["documents", "all", selectedMandantId]`,
  `["invoice_archive", selectedMandantId]`, `["elster_submissions", selectedMandantId]`,
  `["supplier_preferences", selectedMandantId]`, `["advisor_notes", entityType, entityId, selectedMandantId]`,
  `["advisor_notes_counts", ..., selectedMandantId]`,
  `["receipt_requests", selectedMandantId]`, `["dunnings", selectedMandantId]`.
- Kanzlei-wide Pages (UniversalSearchModal, Verfahrensdoku, Retention,
  DatenExport) nutzen `null` als explizites Suffix.

### 6.5 F42-Koppelung
Der vor Phase 1 gelieferte F42-Refactor (MandantContext URL-primary) +
Arbeitsplatz + Tree-UI legen die UX-Seite der Mandant-Trennung. Phase 1
baut die Daten-Seite. Der URL-getriebene Mandant-Switch aus F42 triggert
jetzt **automatisch** die korrekten Query-Refetches (Cache-Partitionierung
über `selectedMandantId`) — kein Stale-Daten-Risiko mehr.

## 7. Bewusste Design-Entscheidungen

1. **`client_id` nullable bis Backfill.** Kein `NOT NULL`-Constraint in
   0026, damit bestehende Produktiv-Daten nicht kaskadieren können.
   Backfill + `NOT NULL` ist ein eigener zukünftiger Sprint.
2. **Kanzlei-wide Reports ohne clientId-Filter.** BilanzPage, GuvPage,
   BwaPage, VorjahresvergleichPage, UstvaPage, ZmPage, EuerPage,
   EbilanzPage, Z3ExportPage, AccountsPage — alle Reports die
   Kanzlei-weit aggregieren, behalten `["journal_entries", "all"]` ohne
   clientId. Das ist kein Bug, sondern die bewusst Kanzlei-globale
   Sicht dieser Berichte (die Pages haben kein `useMandant()`-Import).
3. **Invalidations-Prefix-Strategie beibehalten.** Alle
   `invalidateQueries({ queryKey: ["<resource>"] })` ohne clientId —
   invalidiert alle Varianten via Prefix. Engerer Schnitt hätte operativ
   keinen Vorteil (nur eine Mandant-Sicht ist zur Zeit aktiv; andere
   re-fetchen bei Mandant-Rückwechsel ohnehin). Einfachheit gewinnt.
4. **`client_id` vs. `mandant_id` — client_id ist Projekt-Konvention.**
   `journal_entries.client_id` existiert seit 0001 mit diesem Namen,
   TypeScript-Interfaces heißen entsprechend `client_id`. `belege.mandant_id`
   (Migration 0022) bleibt als historische Abweichung stehen — optionaler
   Rename-Kandidat für einen späteren Cleanup-Sprint.
5. **`journal_entries`-Cache-Suffix ist Partitionierung, nicht Fetch-Scope.**
   `fetchAllEntries()` nimmt weiterhin keinen clientId-Parameter (wäre
   ein API-Refactor außerhalb Phase-1-Scope). Das Suffix im Key dient
   der Konsistenz + triggert beim Mandant-Switch einen Re-Fetch (kostet
   einen Millisekunden-localStorage-Read im DEMO).
6. **RESTRICTIVE-Policy statt Drop+Recreate** der bestehenden permissiven
   Policies. Die neue Policy addiert ein `AND`-Gate bei INSERT/UPDATE
   und lässt die 40+ bestehenden permissiven Policies unberührt — kein
   Regressionsrisiko durch versehentliches Weglassen einer bestehenden
   Policy-Klausel.

## 8. Offene Folge-Sprints

- **Phase 2 — Lohn → FIBU Buchungsstapel.** Die Lohn-API-Funktionen
  (`domain/lohn/LohnabrechnungsEngine.ts`, `lib/db/lohnRepos.ts`) wurden
  in dieser Phase **nicht** angefasst — für Buchungsstapel-Übergabe
  brauchen sie eigene Multi-Tenancy-Tests + Journal-Write-Pfad mit
  Hash-Chain. Der `client_id`-Parameter ist durch Phase 1 bereits
  vorbereitet (Typen in `db.ts`, RLS in 0026).
- **Phase 3 — FIBU → ESt-Anlagen Journal-driven.** Die ESt-Anlagen
  persistieren weiterhin Form-Input-Daten in localStorage; eine
  Kopplung zum Journal (z. B. „Anlage G.Umsätze = Summe der
  Konto-8400-Buchungen des Jahres") steht aus. Die `estStorage`-Helper
  bleiben dabei relevant für manuell gepflegte Felder, die das Journal
  nicht liefern kann (Grundfreibeträge, Kinderfreibeträge etc.).
- **Backfill-Sprint.** Bestehende Produktiv-Rows mit `client_id IS NULL`
  müssen einer Zuordnungs-Heuristik durchlaufen (z. B. via
  `journal_entry_id → client_id` für `documents`). Danach erst
  `ALTER TABLE ... ALTER COLUMN client_id SET NOT NULL`. Separater Sprint
  mit Pre-Check-Skripten + Rollback-Plan.
- **Mandant-Deletion-Workflow.** `ON DELETE RESTRICT` auf den FKs
  verhindert bisher die Löschung eines Mandanten mit existierenden
  Daten. Ein User-facing-Workflow (Export → Archiv → Cascade-Löschung)
  ist konzeptionell offen.

## 9. Test-Count-Trajectory

| Etappe | Tests | Δ | Test-Dateien |
|---|---:|---:|---:|
| Sprint-Start (nach F42 + Arbeitsplatz + Tree-UI) | 1038 | — | 71 |
| Schritt 2a — employees + anlagen | 1044 | +6 | 73 |
| Schritt 2b — 7 Gelb-Gruppe-APIs | 1058 | +14 | 74 |
| Schritt 3 — ESt-Infrastruktur + 4 Pages | 1073 | +15 | 76 |
| Schritt 3b — 23 Pages-Migration + Wiring | 1077 | +4 | 77 |
| Schritt 4 — Query-Keys + F42-Regression | 1079 | +2 | 78 |
| **Schritt 5 — Smoke + Migration-Struktur** | **1088** | **+9** | **81** |

**Netto Phase 1:** +50 Tests, +10 Test-Dateien, 1 neue SQL-Migration
(0026), 1 neues Helper-Modul (`estStorage.ts`), 1 neuer UI-Guard
(`MandantRequiredGuard.tsx`).

---

## 10. Verifikations-Gate am Sprint-Ende

```bash
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit    # clean
npx vitest run                                              # 1088 / 81 grün
```

## 11. Kernspuren im Code (Übersicht)

- **Migration:** `supabase/migrations/0026_multitenant_client_id.sql`
- **Helper/Guard:** `src/domain/est/estStorage.ts` ·
  `src/components/MandantRequiredGuard.tsx`
- **API-Layer:** `src/api/{employees,anlagen,documents,invoiceArchive,
  elsterSubmissions,supplierPreferences,advisorNotes,receiptRequests,
  mahnwesen}.ts`
- **Domain:** `src/domain/anlagen/AnlagenService.ts` (Parameter-Propagation)
- **Main-Wiring:** `src/main.tsx` (Migration-Aufruf vor Render)
- **Docs:** `docs/MULTITENANCY-MIGRATION-0026.md` (Schritt 1),
  dieses Dokument (Schritte 5 + 6)
- **Tests:** 10 neue Test-Dateien in `src/__tests__/`,
  `src/api/__tests__/`, `src/domain/est/__tests__/`,
  `src/components/__tests__/`, `src/pages/__tests__/`

## 12. Schluss-Zahlen

| Metrik | Wert |
|---|---:|
| **Test-Count Start** (vor Phase 1, nach F42-Sprint) | 1038 |
| **Test-Count Ende** (nach Schritt 6) | **1088** |
| **Delta** | **+50 Tests** |
| **Relative Zunahme** | **+4,8 %** |
| **Test-Dateien Start** | 71 |
| **Test-Dateien Ende** | **81** |
| **Delta Test-Dateien** | **+10** |
| Neue api/*.ts-Funktionen mit `clientId`-Param | **33** (Employees 4 + Anlagen 5 + AnlagenService 3 + Documents 4 + InvoiceArchive 2 + ElsterSubmissions 3 + SupplierPreferences 2 + AdvisorNotes 4 + ReceiptRequests 4 + Mahnwesen 2) |
| Neue Migrations-Datei | **1** (`0026_multitenant_client_id.sql`, 280 Zeilen) |
| Geänderte Tabellen (Schema) | **13** (+ `invoice_xml_archive` als strukturelles Gespann → 14 Triplets) |
| Migrierte ESt-Pages | **27** (TaxFormBuilder-basiert: 2 · custom: 25) |
| Neue Domain-Helper | **2** (`src/domain/est/estStorage.ts` · `src/components/MandantRequiredGuard.tsx`) |
| Gefixte TanStack-Query-Keys | **15** (14 × `journal_entries` + 1 × `afa_buchungen`) |

## 13. Bekannte verbleibende Altlasten

> **Hinweis:** Die folgenden Punkte sind **bewusst** nicht in Phase 1
> adressiert worden. Sie sind keine Bugs, sondern dokumentierte
> Grenzen des Sprints + Anknüpfungspunkte für die nächsten Phasen.

- **`afa_buchungen` ohne direkte `client_id`-Spalte** — Tenant-Scope
  läuft transitiv über `anlage_id → anlagegueter.client_id`. Eine
  denormalisierte `client_id`-Spalte wäre ohne Konsistenz-Check nicht
  sicher, daher ausgelassen. Siehe Migration-0026-Kopfkommentar.
- **`belege.mandant_id` statt `client_id`** — historische Abweichung
  aus Migration 0022. Bleibt unverändert; Rename wäre ein separater
  Cleanup-Sprint mit Datentyp-erhaltender Migration.
- **`NOT NULL` auf den 13 neuen `client_id`-Spalten ausstehend** —
  Spalten sind in Phase 1 nullable, damit bestehende Produktivdaten
  nicht kaskadieren. Backfill + `NOT NULL` ist ein eigener Sprint
  (Backfill-Heuristik pro Tabelle + Pre-Check + Rollback-Plan).
- **Lohn-APIs bewusst verschoben in Phase 2** — `lohnarten`,
  `lohnbuchungen`, `lohnabrechnungen_archiv`, `lsta_festschreibungen`
  haben in 0026 zwar bereits die `client_id`-Spalte + RLS-Policy, aber
  ihre zugehörigen Repo-Funktionen (`src/lib/db/lohnRepos.ts`) wurden
  in Phase 1 nicht angefasst. Der Lohn-→-FIBU-Buchungsstapel-Pfad
  (Phase 2) bringt die API-Migration + Domain-Service-Anbindung mit.
- **`fetchAllEntries()` ohne `clientId`-Parameter** — der
  Journal-Fetch liefert weiterhin Kanzlei-alle Einträge, Pages filtern
  in-memory. Das Query-Key-Suffix `selectedMandantId` ist
  Cache-Partitionierung, nicht Fetch-Scope. Refactor auf echten
  clientId-Parameter wäre Phase-3-Kandidat, wenn FIBU → ESt-Anlagen
  die Journal-Filterung auf API-Layer zieht.
- **Kanzlei-wide Berichte (Bilanz, GuV, BWA, UStVA, ZM, EÜR, …)**
  behalten bewusst `["journal_entries", "all"]` ohne `clientId` —
  sie sind Kanzlei-Aggregate (kein `useMandant()`-Import). Wenn die
  Kanzlei je einen Mandant-spezifischen Jahresabschluss braucht,
  separate Routen + useMandant-Integration nötig.
- **Mandant-Deletion-Workflow** — `ON DELETE RESTRICT` auf allen
  14 FKs schützt jetzt vor versehentlicher Client-Löschung. Ein
  User-facing Workflow (Export → Archiv → Cascade) ist konzeptionell
  offen.

## 14. Sprint-Signatur

| Feld | Wert |
|---|---|
| **Datum** | 2026-04-20 |
| **End-Test-Count** | 1088 (1088 passed, 0 failed, 0 skipped) |
| **End-tsc-Status** | clean (Exit 0, 8192 MB) |
| **End-Test-Dateien** | 81 |
| **Schritt-Berichte** | Schritt 1 (Migration 0026) · Schritt 2a (Rot-API) · Schritt 2b (Gelb-API) · Schritt 3 (ESt-Infrastruktur) · Schritt 3b (ESt-Rest-Migration) · Schritt 4 (Query-Keys-Audit) · Schritt 5 (Smoke-Tests) — alle als Chat-Berichte übermittelt, aggregiert in diesem Dokument |
| **Abschluss-Doku** | `docs/SPRINT-MULTITENANCY-FOUNDATION-ABSCHLUSS.md` (dieses Dokument) |
| **Migration-Doku** | `docs/MULTITENANCY-MIGRATION-0026.md` |
| **Konsistenz-Check CLAUDE.md** | geprüft, keine inhaltliche Abweichung (RLS-Erwähnungen in §2 Tech Stack + §9 Style Guidelines bleiben korrekt) |
| **Konsistenz-Check README.md** | geprüft, keine Aussagen die mit Phase 1 kollidieren |
| **Offen + geparkt** | siehe §13 Bekannte verbleibende Altlasten |
