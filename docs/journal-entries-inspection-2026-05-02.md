# Inspektion `public.journal_entries` — 2026-05-02

> **Zweck dieser Datei:** Output von Charge 19 Phase 1 (PR A). Reine Doku, kein Schema-Change, keine Migration. Erstellt im Rahmen der Inspektion vor der GRANT-Migration `0052` (Charge 19 Phase 2 / Schuld 18-bet).

---

## 1 — Zweck und Scope

`public.journal_entries` wurde in HANDOFF_BATCH_17 (Spec V1) als nicht in der DB existent angenommen. In Charge 18 zeigte `pg_tables`, dass die Tabelle existiert. Charge 19 Phase 1 hat den Auftrag, den realen Zustand der Tabelle zu erfassen — Origin, Schema, Triggers, RLS, Code-Verwendung, Compensating Controls — bevor in Phase 2 die GRANT-Migration entworfen wird.

**Out-of-Scope dieser Datei:**

- Vergleich mit Spec V1 (Charge 17). Wird in einer nachgelagerten Charge (Charge 22+) erfolgen, wenn die Implementierung der Spec V1 begonnen wird.
- Fix-Vorschläge. Diese Datei beschreibt den Ist-Zustand, nicht den Soll-Zustand.
- GRANT-Design (Phase 2).
- Verifikation der RLS-Konfiguration im Sinne von Schuld 10-aleph (Charge 20).

**Datenquellen:**

- DB-Probe via Supabase Studio gegen Project `harouda` (Stand 2026-05-02).
- Code-Lese gegen `main` @ `40d0feb`.
- Migrations-Suche via `Select-String -Path "supabase/migrations/*.sql" -Pattern "journal_entries" -List`.

---

## 2 — Origin und Evolution

`journal_entries` existiert seit der ersten Migration des Projekts.

| Migration | Rolle bezüglich `journal_entries` |
|-----------|-----------------------------------|
| `0001_init.sql` | Tabelle angelegt (Zeile 41). |
| `0006_gobd_append_only.sql` | UPDATE-Schutz (`protect_update`). |
| `0009_journal_autolock.sql` | Auto-Lock-Trigger und Funktion `journal_entries_autolock()`. |
| `0010_journal_hash_chain.sql` | Hash-Kette: Spalten `prev_hash`, `entry_hash`, Trigger `set_hashes`, Verify-Funktion `verify_journal_chain`, Compute-Funktion `journal_entries_compute_hash`. |
| `0012_invoice_archive.sql` | FK-Verweis aus `invoice_archive.journal_entry_id`. |
| `0017_cost_centers.sql` | `ALTER TABLE` für `kostenstelle`, `kostentraeger`. |
| `0018_receipt_requests.sql` | FK-Verweis aus `receipt_requests.linked_journal_entry_id`. |
| `0026_multitenant_client_id.sql` | `client_id` ergänzt (Multi-Tenancy Phase 2). |
| `0027_journal_batch.sql` | `batch_id` ergänzt. |
| `0034_inventur_tables.sql` | FK-Verweis aus `inventur_buchungen.abgangs_buchung_id`. |

Sieben weitere Migrations enthalten reine Kommentare/Erwähnungen ohne Schema-Change: `0004`, `0007`, `0008`, `0015`, `0022`, `0024`, `0025`, `0028`, `0031`.

**Beobachtung:** Die Tabelle ist seit der Initial-Migration vorhanden. Die Spec-V1-Annahme aus Charge 17, dass sie nicht existiert, war faktisch falsch und reflektiert Lehre 47 (DB-Realität kann Spec-Annahmen widersprechen).

---

## 3 — Schema

29 Spalten, gruppiert nach Funktion.

### 3.1 Identifikation und Audit

| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `owner_id` | `uuid` | YES | `auth.uid()` |
| `created_by` | `uuid` | YES | — |
| `updated_by` | `uuid` | YES | — |
| `created_at` | `timestamptz` | NO | `now()` |
| `updated_at` | `timestamptz` | NO | `now()` |

### 3.2 Multi-Tenancy

| Spalte | Typ | Nullable |
|--------|-----|----------|
| `company_id` | `uuid` | YES |
| `client_id` | `uuid` | YES |

### 3.3 Buchungs-Kern

| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| `datum` | `date` | NO | — |
| `beleg_nr` | `text` | NO | — |
| `beschreibung` | `text` | NO | — |
| `soll_konto` | `text` | NO | — |
| `haben_konto` | `text` | NO | — |
| `betrag` | `numeric` | NO | — |
| `ust_satz` | `numeric` | YES | — |

### 3.4 Status, Storno, Lock

| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| `status` | `text` | NO | `'gebucht'` |
| `storno_status` | `text` | NO | `'active'` |
| `parent_entry_id` | `uuid` | YES | — |
| `version` | `integer` | NO | `1` |
| `locked_at` | `timestamptz` | YES | — |

### 3.5 Hash-Kette

| Spalte | Typ | Nullable |
|--------|-----|----------|
| `prev_hash` | `text` | YES |
| `entry_hash` | `text` | YES |

### 3.6 OPOS

| Spalte | Typ | Nullable |
|--------|-----|----------|
| `gegenseite` | `text` | YES |
| `faelligkeit` | `date` | YES |
| `skonto_pct` | `numeric` | YES |
| `skonto_tage` | `integer` | YES |

### 3.7 Kostenrechnung und Batch

| Spalte | Typ | Nullable |
|--------|-----|----------|
| `kostenstelle` | `text` | YES |
| `kostentraeger` | `text` | YES |
| `batch_id` | `uuid` | YES |

### 3.8 Strukturelle Beobachtungen

**Flaches Modell — Design Choice.** Das Modell ist `single-line journal entry`: jede Zeile ist eine vollständige Buchung mit `soll_konto`, `haben_konto`, `betrag`. Es existiert kein `journal_lines`-Begleittisch (verifiziert via `pg_tables` mit Filter `tablename like 'journal%'` — nur `journal_entries` zurückgegeben). Sammelbuchungen werden semantisch über `batch_id` gruppiert, nicht strukturell.

**`betrag` ohne `precision/scale`-Constraint.** PostgreSQL erlaubt arbitrary precision. Es existiert kein sichtbarer `CHECK`-Constraint auf `betrag != 0` in `pg_tables`. Anwendungs-seitig prüft `createEntry` jedoch `betrag > 0`.

**`beleg_nr` als `text` ohne FK.** Kein referentieller Zusammenhang zu `belege` (eingeführt erst in Migration 0022). Logische Folge der Migrations-Chronologie. Eine FK-Erweiterung wurde in keiner späteren Migration ergänzt.

---

## 4 — Triggers

Fünf BEFORE-Triggers, keine AFTER-Triggers.

| Trigger | Timing | Event | Funktion |
|---------|--------|-------|----------|
| `set_updated_at` | BEFORE | UPDATE | `tg_set_updated_at()` |
| `trg_journal_autolock` | BEFORE | INSERT | `journal_entries_autolock()` |
| `trg_journal_set_hashes` | BEFORE | INSERT | `journal_entries_set_hashes()` |
| `trg_journal_protect_update` | BEFORE | UPDATE | `journal_entries_protect_update()` |
| `trg_journal_protect_delete` | BEFORE | DELETE | `journal_entries_protect_delete()` |

### 4.1 `journal_entries_autolock()`

```plpgsql
if NEW.status = 'gebucht' and NEW.locked_at is null then
  NEW.locked_at := now() + interval '24 hours';
end if;
return NEW;
```

**Verhalten:** DB setzt `locked_at` nur, wenn der Client `NULL` liefert. Bei einem nicht-NULL-Wert vom Client wird dieser akzeptiert.

### 4.2 `journal_entries_set_hashes()`

```plpgsql
if NEW.prev_hash is null then
  -- aus DB ermitteln, sonst Genesis
end if;
if NEW.entry_hash is null then
  NEW.entry_hash := public.journal_entries_compute_hash(...);
end if;
return NEW;
```

**Verhalten:** DB setzt Hashes nur, wenn der Client `NULL` liefert. Vom Client gelieferte Hash-Werte werden ungeprüft akzeptiert. Der Trigger ist Fallback für Direct-SQL-Inserts, kein DB-seitiger Schutz der Kette.

### 4.3 `journal_entries_protect_update()`

Whitelist-basiert:

```plpgsql
if OLD.status = 'gebucht' and OLD.storno_status = 'active' then
  if NEW.storno_status = 'reversed' and
     NEW.datum = OLD.datum and
     NEW.beleg_nr = OLD.beleg_nr and
     NEW.beschreibung = OLD.beschreibung and
     NEW.soll_konto = OLD.soll_konto and
     NEW.haben_konto = OLD.haben_konto and
     NEW.betrag = OLD.betrag then
    return NEW;
  end if;
  raise exception ...;
end if;

if OLD.storno_status in ('reversed','reversal','correction') then
  raise exception ... schreibgeschützt ...;
end if;

if OLD.locked_at is not null then
  raise exception ... festgeschrieben ...;
end if;

return NEW;
```

**Verhalten:** Erlaubt Übergang `storno_status: active → reversed`, prüft dabei sieben Felder auf Unveränderlichkeit. Andere Spalten (`entry_hash`, `prev_hash`, `version`, `parent_entry_id`, `ust_satz`, `client_id`, `company_id`, `created_by`, `updated_by`, `kostenstelle`, `kostentraeger`, `batch_id`, `gegenseite`, `faelligkeit`, `skonto_pct`, `skonto_tage`, `locked_at`, `owner_id`) werden nicht in die Whitelist-Prüfung einbezogen. Der `locked_at`-Branch prüft `IS NOT NULL`, nicht den Wert.

### 4.4 `journal_entries_protect_delete()`

```plpgsql
if OLD.status = 'gebucht' then
  raise exception ... GoBD ... Storno erstellen ...;
end if;
if OLD.storno_status <> 'active' then
  raise exception ... Storno- oder Korrekturbuchungen ...;
end if;
return OLD;
```

**Verhalten:** Blockiert DELETE für alle festgeschriebenen oder bereits abgeschlossenen Buchungen. Entwürfe (`status='entwurf'`, `storno_status='active'`) bleiben löschbar. `locked_at` wird hier nicht geprüft.

### 4.5 Beobachtung: Defense-in-Depth-Schichtung

Triggers + RLS-Policies wirken orthogonal. RLS isoliert Mandanten, Triggers fixieren GoBD-Eigenschaften nach Festschreibung. Updates an festgeschriebenen Buchungen werden vom Trigger geblockt, auch wenn die RLS-Policy `update` zulassen würde.

---

## 5 — RLS-Policies

Fünf Policies. RLS aktiviert.

| Policy | cmd | permissive | qual | with_check |
|--------|-----|------------|------|------------|
| `journal_entries_select` | SELECT | PERMISSIVE | `is_company_member(company_id)` | — |
| `journal_entries_insert` | INSERT | PERMISSIVE | — | `can_write(company_id)` |
| `journal_entries_update` | UPDATE | PERMISSIVE | `can_write(company_id)` | `can_write(company_id)` |
| `journal_entries_delete` | DELETE | PERMISSIVE | `can_write(company_id)` | — |
| `journal_entries_auditor_expiry` | ALL | RESTRICTIVE | `NOT EXISTS (cm.role='tax_auditor' AND cm.access_valid_until < now())` | — |

### 5.1 Tenancy-Discriminator

`company_id` ist die alleinige Tenancy-Spalte in den Policies. `client_id`, `owner_id`, `created_by` werden in keiner Policy referenziert. Helper-Funktionen: `is_company_member(uuid)` für Lese-Zugriff, `can_write(uuid)` für Schreib-Zugriff.

### 5.2 RESTRICTIVE-Policy für ablaufende Auditor-Zugänge

PostgreSQL kombiniert die Policies als:

```
Zugriff = (OR aller PERMISSIVE) AND (AND aller RESTRICTIVE)
```

Die `auditor_expiry`-Policy entzieht einem `tax_auditor`-Member den Zugriff, sobald `access_valid_until < now()`. Der Mechanismus arbeitet wie beabsichtigt — wäre die Policy als `PERMISSIVE` definiert, bliebe sie wirkungslos, weil `journal_entries_select` per OR alleine ausgereicht hätte.

### 5.3 NULL-Semantik in `auditor_expiry`

Die Bedingung enthält explizit `cm.access_valid_until IS NOT NULL AND cm.access_valid_until < now()`. Ein `tax_auditor`-Member mit `access_valid_until = NULL` durchläuft die EXISTS-Bedingung nicht, der Zugriff bleibt erlaubt. Ob dies beabsichtigt ist (offenes Mandat ohne Endedatum) oder ob `NULL` als ungültiger Daten-Stand abgelehnt werden sollte, ist nicht aus dem Code ableitbar. Siehe Abschnitt 10.

---

## 6 — Code-Verwendung

`Get-ChildItem -Path "src" -Recurse -File | Select-String -Pattern "journal_entries" -List` liefert 53 Treffer, verteilt auf folgende Schichten:

| Schicht | Anzahl | Kommentar |
|---------|--------|-----------|
| `types/` | 1 | `database.types.ts` (Schema-Typen, generiert) |
| `api/` | 4 | inkl. `journal.ts` (Hauptboundary) und `journalStorno.test.ts` |
| `domain/` | 3 | u. a. `ClosingValidation.ts`, `BankReconciliationGaps.ts` |
| `utils/` | 1 | `verfahrensdokumentation.ts` |
| `components/` | 1 | `UniversalSearchModal.tsx` |
| `pages/` | ca. 40 | Bilanz, GuV, BWA, USt-VA, EÜR, OPOS, Mahnwesen, BankImport, Z3-Export, Journal, Anlagenverzeichnis, AfA, Lohn, Closing-Wizard u. a. |
| `__tests__/` | 2 | `migration-0027-structure.test.ts`, `multitenancy-query-cache.test.ts` |

Die Tabelle wird in nahezu jeder buchhalterischen Funktion gelesen. Hinsichtlich Bedeutung im Code-Bestand handelt es sich um eine zentrale Tabelle.

---

## 7 — Schreibpfade in `src/api/journal.ts`

Acht exportierte Funktionen plus interne Helfer. Jede Operation existiert in zwei Zweigen: ein `localStorage`-Pfad (Demo-Modus) und ein Supabase-Pfad. Die folgenden Beobachtungen beziehen sich auf den Supabase-Pfad.

### 7.1 SELECT

`fetchEntries`, `fetchEntriesForAccountsInRange`, intern `lastChainHash`. Alle direkt via `supabase.from("journal_entries").select(...)`. Filter immer `eq("company_id", companyId)`.

### 7.2 INSERT — `createEntry`, `createEntriesBatch`

Direkter Insert via `supabase.from("journal_entries").insert(...)`. Client-seitige Pre-Validierung:

- `soll_konto !== haben_konto`
- `betrag > 0`
- `assertPeriodNotClosed(datum)` (Lese-Quelle: `localStorage`)
- In `createEntriesBatch` zusätzlich `client_id`-Konsistenz pro Entry

Hash-Werte werden im Client berechnet (`computeEntryHash`) und mit dem Insert mitgesendet. Der DB-Trigger `set_hashes` greift nur, wenn der Client `NULL` liefert (siehe Abschnitt 4.2).

`createEntriesBatch` weist allen Entries eine gemeinsame `batch_id` zu und nutzt PostgREST-Array-Insert für Atomarität in einer einzigen Transaktion. Code-interner Kommentar weist auf eine bekannte Race-Condition bei `lastChainHash` hin (kein UNIQUE-Constraint auf `prev_hash`).

### 7.3 UPDATE — `updateEntry`

Read-before-write, `assertMutable(before)` als Client-Guard, dann `supabase.from(...).update(...)`. `assertMutable` blockiert wenn `status='gebucht'`, `storno_status !== 'active'` oder `locked_at <= now()`.

### 7.4 DELETE — `deleteEntry`

Read-before-write, `assertMutable`, dann `supabase.from(...).delete()`.

### 7.5 Storno — `reverseEntry`

Drei sequentielle DB-Calls ohne gemeinsamen Transaktions-Rahmen:

1. SELECT Original.
2. INSERT Reversal (vertauschte Konten, `storno_status='reversal'`, `parent_entry_id=Original.id`).
3. UPDATE Original (`storno_status: active → reversed`).

### 7.6 Korrektur — `correctEntry`

Ruft `reverseEntry` (3 Calls), dann `createEntry` (1 Call mit `storno_status='correction'`), dann ein Audit-Log. Insgesamt mindestens fünf voneinander unabhängige DB-Operationen ohne explizite Transaktion.

### 7.7 Settings-Quelle: `localStorage`

`readLockHours()` und `readPeriodClosedBefore()` lesen aus `localStorage`-Key `harouda:settings`. Beide Werte sind browser-lokal, nicht in der DB gespiegelt, nicht mandantenspezifisch, nicht serverseitig durchsetzbar.

### 7.8 Kein RPC-Layer für Schreibvorgänge

In `src/api/journal.ts` existieren keine Aufrufe von `supabase.rpc(...)`. Sämtliche Schreibvorgänge erfolgen direkt gegen die Tabelle. Validierung verteilt sich auf TypeScript-Layer und DB-Triggers; eine PostgreSQL-Function-Schicht zwischen Client und Tabelle ist nicht vorhanden.

---

## 8 — `SECURITY DEFINER`-Funktionen

Eine Funktion mit Bezug zu `journal_entries`:

| Funktion | Rückgabe | Argumente | Schreibend? |
|----------|----------|-----------|-------------|
| `verify_journal_chain` | TABLE (boolean, bigint, bigint, uuid, text) | `p_company_id` | nein (read-only) |

### 8.1 Logik

Iteriert alle Entries der Firma sortiert nach `(created_at, id)`. Für jeden Entry: vergleicht `prev_hash` mit erwartetem Wert (Genesis oder vorheriger `entry_hash`), berechnet `entry_hash` neu via `journal_entries_compute_hash` und vergleicht mit gespeichertem Wert. Bei Abweichung Rückgabe `(false, ..., Fehlermeldung)`. Bei vollständiger Verifikation Rückgabe `(true, count, null, null, 'Alle ... verifiziert')`.

### 8.2 Beobachtungen

**Eventual verification, kein Enforcement.** Die Funktion ist read-only. Sie wird nicht von einem Trigger automatisch aufgerufen. Eine Kettenverletzung zwischen zwei Aufrufen bleibt bis zum nächsten Aufruf unentdeckt.

**Aufrufer der DB-Funktion nicht verifiziert.** In `ClosingValidation.ts` wird `verifyJournalChain` aus `utils/journalChain.ts` (Frontend-Code) aufgerufen, nicht die DB-RPC `verify_journal_chain`. Ob die DB-RPC an anderer Stelle aufgerufen wird, ist nicht im Rahmen dieser Charge geprüft worden — siehe Abschnitt 10.

**`SECURITY DEFINER` und Mandantenfilter.** Die Funktion läuft mit Owner-Privilegien (umgeht RLS) und filtert ausschließlich über das Argument `p_company_id`. Welche Rollen `EXECUTE`-Recht haben, ist nicht im Rahmen dieser Charge geprüft worden — siehe Abschnitt 10.

---

## 9 — Compensating Controls

Mehrere DB- und Trigger-seitige Lücken werden durch Anwendungs-seitige Validierungen kompensiert. Der zentrale Mechanismus ist `validateYearEnd` in `src/domain/accounting/ClosingValidation.ts`.

### 9.1 `validateYearEnd` als Pre-Closing-Gate

`validateYearEnd` aggregiert acht Teil-Checks in einen `ClosingValidationReport` mit Severity-Klassifikation `error | warning | info`. Das Ergebnis-Flag `darf_jahresabschluss_erstellen` ist `false`, sobald mindestens ein `error`-Finding existiert.

| Teil-Check | Severity | Code |
|------------|----------|------|
| Rechtsform gesetzt | error | `CLOSING_RECHTSFORM_MISSING` |
| Hash-Kette intakt (via `verifyJournalChain` Frontend) | error | `CLOSING_HASH_CHAIN_BROKEN` |
| Trial-Balance ausgeglichen (`SUM(Soll) == SUM(Haben)` über die Periode) | error | `CLOSING_TRIAL_BALANCE_UNBALANCED` |
| Entwurf-Buchungen offen | warning | `CLOSING_DRAFTS_OPEN` |
| AfA-Lücken | warning | `CLOSING_AFA_MISSING` |
| Lohn-Lücken | warning | `CLOSING_PAYROLL_MISSING` |
| Bank-Reconciliation-Gaps und Pending-Quote (Threshold 5%) | warning/error | `CLOSING_BANK_RECON_*` |
| Bilanz↔GuV-Cross-Check | error | `CLOSING_BILANZ_GUV_MISMATCH` |
| Inventur-Status (§ 240 HGB) | warning/error/info | `CLOSING_INVENTUR_*` |

### 9.2 Welche Lücken werden kompensiert

| Beobachtete Lücke | Kompensiert durch | Zeitpunkt | Vollständigkeit |
|-------------------|-------------------|-----------|-----------------|
| Hash-Chain-Trigger akzeptiert beliebige Client-Hashes | `validateYearEnd → verifyJournalChain` (Frontend) | Pre-Closing | Erkennt strukturelle Brüche, erkennt aber keine Manipulation, die intern konsistent neu berechnet wurde. |
| Storno/Korrektur ohne Transaktion | Hash-Chain-Verifikation würde durchbrochene Ketten aufdecken | Pre-Closing | Erkennt nur Inkonsistenzen, die die Hash-Kette betreffen. Reine Status-Inkonsistenzen ohne Hash-Effekt können unentdeckt bleiben. |
| Sammelbuchungs-Balance auf Batch-Niveau nicht erzwungen | Trial-Balance auf Perioden-Niveau (`computeTrialBalance`) | Pre-Closing | Erkennt Aggregat-Imbalancen. Erkennt keine batch-internen Imbalancen, die sich gegenseitig aufheben. |
| Hash-Chain-Race (Code-dokumentiert) | `verifyJournalChain` | Pre-Closing | Erkennt Kettenbrüche post hoc. |
| Period-Closed-Sperre nur in `localStorage` | keine direkte Kompensation; nur indirekt durch Trial-Balance-Gate | Pre-Closing | Wirkungsschwach gegen vorsätzliche Umgehung. |

### 9.3 Architektur-Einordnung

`validateYearEnd` ist ein **eventually-consistent**, vom User getriggerter Pre-Closing-Check. Es ist keine transaktional bindende Garantie pro Buchung. Lücken auf Trigger- oder Schreibpfad-Ebene werden zwischen Pre-Closing-Aufrufen typischerweise nicht erkannt; eine Erkennung erfolgt spätestens beim Abschluss-Versuch.

---

## 10 — Beobachtungen, Schuld-Kandidaten, Open Questions

Strikte Trennung nach den vom User in Charge 19 vorgegebenen Klassen.

### 10.1 Facts (beobachtetes Verhalten)

| Fact | Quelle |
|------|--------|
| Tabelle existiert seit Migration `0001_init.sql`. | Abschnitt 2 |
| 29 Spalten, drei Tenancy-relevante (`company_id`, `client_id`, `owner_id`). | Abschnitt 3 |
| 5 BEFORE-Triggers, keine AFTER-Triggers. | Abschnitt 4 |
| 5 RLS-Policies, davon 1 RESTRICTIVE. | Abschnitt 5 |
| 53 Code-Treffer in `src`, ca. 40 Pages. | Abschnitt 6 |
| Schreibpfade ausschließlich direkt gegen die Tabelle, kein RPC-Wrapper. | Abschnitt 7.8 |
| Genau eine `SECURITY DEFINER`-Funktion mit Bezug: `verify_journal_chain` (read-only). | Abschnitt 8 |

### 10.2 Design Choices (intentional)

| Design Choice | Begründung soweit ableitbar |
|---------------|------------------------------|
| Flaches `single-line journal entry`-Modell, kein Header/Lines-Split. | Konsistent mit Schema seit `0001_init.sql`. Sammelbuchungen über `batch_id` semantisch gruppiert. |
| Hash-Kette wird im Frontend berechnet, DB-Trigger nur als Fallback für Direct-SQL. | Code-Kommentar in `journal_entries_set_hashes`: "Die App berechnet Hashes clientseitig." |
| `beleg_nr` als `text` ohne FK auf `belege`. | `belege` wurde erst in Migration 0022 eingeführt; eine nachträgliche FK-Erweiterung wurde bewusst oder unbewusst nicht vollzogen. |
| Defense-in-Depth über RLS + Triggers. | Migrations 0006/0009/0010 ergänzen Triggers über die Multi-Tenancy-Migrationen hinaus. |
| Pre-Closing-Validator (`validateYearEnd`) als zentraler Compensating-Control. | Architekturstil "Pre-Closing-Gate", siehe Abschnitt 9. |

### 10.3 Weaknesses (ohne Schuld-Eigenschaft)

Diese Beobachtungen beschreiben Verhalten, das schwächer ist als möglich, aber entweder durch Compensating Controls abgefedert wird oder keinen Kern-Invariant verletzt.

| Weakness | Kompensation |
|----------|--------------|
| `set_hashes` akzeptiert Client-Hashes ungeprüft. | `validateYearEnd → verifyJournalChain` (Pre-Closing). |
| `autolock` akzeptiert Client-Wert für `locked_at`. | `protect_update` prüft `locked_at IS NOT NULL`, nicht den Wert — jeder nicht-NULL-Wert wirkt sperrend, auch ein in der Vergangenheit liegender. Effekt: Manipulation des Wertes führt eher zu zu strenger Sperre als zu zu laxer. |
| Storno/Korrektur ohne Transaktions-Klammer. | Hash-Kette würde halb-fertige Sequenzen als Bruch sichtbar machen; durch `validateYearEnd` erfasst. |
| Sammelbuchungs-Balance auf `batch_id`-Niveau nicht geprüft. | Trial-Balance auf Perioden-Niveau (`validateYearEnd` Teil-Check 3). Lückenfall: gegenseitig kompensierende Imbalancen über zwei Batches im selben Zeitraum. |
| Hash-Chain-Race bei parallelen Writes. | Code-Kommentar dokumentiert Use-Case (Single-User-Klick); `verifyJournalChain` würde resultierende Brüche erkennen. |
| `betrag` ohne DB-`CHECK > 0`. | `createEntry` und `createEntriesBatch` prüfen Client-seitig. |
| `protect_delete` prüft nicht `locked_at` für Entwürfe. | Entwürfe sind designgemäß löschbar; `locked_at` auf Entwurf wäre untypisch. Geringfügige Beobachtung. |
| Kein RPC-Layer für Schreibvorgänge. | Architektur-Beobachtung; kein Invariant-Bruch per se. |

### 10.4 Schuld-Kandidaten (unkompensierte Invariant-Verletzungen)

**Kriterium:** verletzt einen Kern-Invariant (Integrität, Mandanten-Isolation, Auditierbarkeit) **und** ist nicht durch eine andere Schicht abgedeckt.

#### 10.4.1 Kandidat: `protect_update`-Whitelist deckt nicht alle sicherheitskritischen Spalten ab

**Beobachtung.** Die Whitelist erlaubt den Übergang `active → reversed` und prüft Unveränderlichkeit nur für sieben Spalten: `storno_status`, `datum`, `beleg_nr`, `beschreibung`, `soll_konto`, `haben_konto`, `betrag`. Andere Spalten — insbesondere `entry_hash`, `prev_hash`, `company_id`, `client_id`, `owner_id`, `created_by`, `version`, `parent_entry_id`, `kostenstelle`, `kostentraeger`, `batch_id` — werden im Reverse-Branch nicht gegen Veränderung geprüft.

**Verletzter Invariant.** Audit-Integrität (`entry_hash`, `prev_hash`, `created_by`) und Mandanten-Isolation (`company_id`).

**Kompensation?** `validateYearEnd → verifyJournalChain` würde eine Hash-Manipulation erkennen, die die Kette bricht. Eine Manipulation, die intern konsistent bleibt (z. B. Änderung von `company_id` ohne Hash-Effekt, da `company_id` nicht in `journal_entries_compute_hash` einfließt), wird nicht erkannt. Mandanten-Isolation hat keinen Pre-Closing-Check.

**Status:** unkompensiert. **Schuld-Kandidat.** Vorgemerkt für separate Charge nach Phase 2.

#### 10.4.2 Kandidat: Period-Closed- und Lock-Hours-Settings nur in `localStorage`

**Beobachtung.** `readPeriodClosedBefore` und `readLockHours` lesen aus `localStorage`-Key `harouda:settings`. Der Wert existiert pro Browser-Profil, nicht pro Mandant. Ein anderer Browser, ein anderer User oder ein direkter SQL-Zugriff umgeht die Sperre vollständig.

**Verletzter Invariant.** `§ 146 AO` (Ordnungsmäßigkeit, gesperrte Perioden) und Mandanten-Isolation (Setting eines Users wirkt nicht auf andere User des Mandanten).

**Kompensation?** Trial-Balance im Pre-Closing erfasst nur Aggregat-Imbalancen, nicht Buchungen mit unzulässigem Datum innerhalb einer ausgeglichenen Periode. Keine direkte Kompensation.

**Status:** unkompensiert. **Schuld-Kandidat.** Vorgemerkt für separate Charge nach Phase 2.

### 10.5 Open Questions

Punkte, deren Klärung über den Scope dieser Charge hinausgeht und die in einer späteren Charge oder durch Rücksprache mit StB / Datenschutz behandelt werden sollten.

| Frage | Adressat |
|-------|----------|
| `auditor_expiry`: ist `access_valid_until = NULL` als unbefristeter Zugang beabsichtigt oder soll `NULL` als ungültiger Daten-Stand abgelehnt werden? | Rücksprache mit StB / Datenschutz. |
| `verify_journal_chain` (DB-RPC): wird die Funktion irgendwo aufgerufen, oder ist sie aktuell nur als Werkzeug für SQL-Direkt-Aufruf gedacht? | Code-Suche (eigene Charge) auf `supabase.rpc("verify_journal_chain"`. |
| `verify_journal_chain` (DB-RPC): welche Rollen haben `EXECUTE`-Recht? Kann ein Member einer anderen Firma die Funktion mit fremder `company_id` aufrufen? | DB-Probe `pg_proc.proacl` in eigener Charge. |
| `dead columns` (`owner_id`, `client_id`, `created_by` in RLS-Sicht): aktive Design-Entscheidung, halb-migrierte Spalten oder Legacy aus früherem Tenancy-Modell? | Architektur-Review (eigene Charge). |
| `betrag = 0`: soll DB-seitig per `CHECK`-Constraint ausgeschlossen werden? | Klärung im Rahmen einer Datenintegritäts-Charge. |
| `client_id`-Wert `NULL` versus konkrete UUID: wie wird ein Buchungs-Eintrag ohne Mandanten-Zuordnung behandelt (Eigenbuchung der Kanzlei)? | Architektur-Review. |
| Workflow-Falle 3.2 Manifestationen #8 (Studio-Output `pg_policies`), #9 (Studio-Output `pg_proc`), #10 (Studio-Output `routine_definition`): jetzt als zehnfach-direktional registriert. | Wird in HANDOFF_BATCH_20 aktualisiert. |
| HANDOFF_BATCH_19 §8.3 Schritt 6: `Select-String -Path "src" -Pattern "..." -Recurse` ist syntaktisch ungültig (`-Recurse` ist Parameter von `Get-ChildItem`). | Korrektur in HANDOFF_BATCH_20. |

---

## 11 — Klassifikation der Tabelle

Auf Basis der erfassten Evidenz:

`journal_entries` ist **produktiv und reif**.

- Architektonisch zentrale Tabelle (Abschnitt 6).
- Schema-Niveau: vollständig, mehrfach erweitert, GoBD-relevante Spalten vorhanden (Abschnitt 3).
- DELETE-Schutz auf Trigger-Niveau vollständig (Abschnitt 4.4).
- UPDATE-Schutz auf Trigger-Niveau Whitelist-basiert mit Lücken in der Whitelist (Abschnitt 4.3, 10.4.1).
- Hash-Kette strukturell vorhanden, im DB-Trigger nicht erzwungen, im Frontend berechnet, im Pre-Closing-Validator verifiziert (Abschnitte 4.2, 9.2).
- RLS-Design konsistent, fortgeschritten (Abschnitt 5).
- Schreibpfade Frontend-orchestriert ohne Transaktions-Klammer für Storno/Korrektur (Abschnitte 7.5, 7.6).
- Compensating Controls auf Pre-Closing-Niveau zentral, nicht per-write (Abschnitt 9).

Die Tabelle ist **kein Überbleibsel**. Sie ist Teil der V1-Implementierung im weitesten Sinne und durch die Migrations- und Code-Geschichte als zentrales Artefakt dokumentiert.

Eine darüber hinausgehende Aussage zu Spec V1 unterbleibt in dieser Datei (siehe Scope, Abschnitt 1).

---

## 12 — Konsequenzen für Phase 2 (GRANT-Design)

Diese Datei trifft keine GRANT-Entscheidung. Die folgenden Faktoren sind aber für Phase 2 relevant und werden beim Design der Migration `0052` berücksichtigt:

- `journal_entries` muss in der GRANT-Migration enthalten sein.
- RLS-Policies referenzieren `authenticated` (über `auth.uid()` in `is_company_member`/`can_write`). Dies erfordert `GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated`.
- `anon` hat keine Policy — kein GRANT.
- `service_role` benötigt GRANT für Backend-Operationen, da `bypassrls` nicht GRANTs umgeht (Lehre 44).

Die Schuld-Kandidaten aus Abschnitt 10.4 werden **nicht** in Phase 2 mitbehandelt, da sie unabhängig von der GRANT-Migration sind.

---

*Ende Inspektions-Doku. Nächster Schritt: Charge 19 Phase 2 — GRANT-Migration `0052`.*
