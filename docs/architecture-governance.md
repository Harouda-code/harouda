# Architecture Governance — harouda

> **Stand:** 2026-05-02
> **Branch:** `docs/architecture-governance`
> **Bezug:** Schuld 14-bet (Charge 15 Phase 2 / Charge 16)
> **Status:** Atomarer Doku-PR. Kein Code-Change. Keine Migration.

---

## 1 — Zweck

Dieses Dokument haelt die drei nicht-verhandelbaren Architektur-Prinzipien fest, die in der bisherigen Praxis von `harouda` etabliert wurden:

1. Database als Quelle der Wahrheit.
2. Shadow Mode bei Migration-Phasen.
3. UI Shell-Trennung.

Es dient als verbindliche Referenz fuer kuenftige Code-Reviews, neue Features und Architektur-Entscheidungen. Die Prinzipien sind aus konkreten Migrations- und Refactor-Erfahrungen abgeleitet, nicht spekulativ formuliert. Jede Aussage ist mit einem Code- oder Migrations-Verweis aus dem Repo belegt.

---

## 2 — Geltungsbereich

| Bereich | Verbindlich? |
|---------|-------------|
| `src/` (Frontend, Application Layer) | Ja |
| `supabase/migrations/` (Schema, RLS, Triggers) | Ja |
| `supabase/functions/` (Edge Functions) | Ja |
| `src/__tests__/`, `*.test.ts(x)` (Test-Code) | Sections 1 + 3 (nicht 2) |
| `docs/`, `scripts/` (Tooling) | Nein |

Abweichungen erfordern eine schriftliche Begruendung im PR-Body und eine Inline-Anmerkung im Code.

---

## 3 — Section 1: Database als Quelle der Wahrheit

### 3.1 — Prinzip

Sicherheit, Mandantentrennung, Constraints und Audit gehoeren in die Datenbank — als RLS-Policies, Triggers, Foreign Keys und CHECK-Constraints. Frontend-Code darf diese Mechanismen nutzen oder ergaenzen, aber niemals ersetzen.

### 3.2 — Begruendung

- **Defense-in-Depth:** Das Frontend ist keine Trust Boundary. Jeder Client (Browser, mobile App, externes Tool) kann die Frontend-Logik umgehen und direkt mit der Datenbank-API sprechen. Nur DB-seitige Mechanismen sind verlaesslich.
- **Minimal Trust Boundary:** Auch ein kompromittierter JWT muss durch die DB-Policies gefiltert werden. Frontend-Checks sind nur UX-Schutz, keine Sicherheits-Schicht.
- **Compliance:** DSGVO Art. 32 (Sicherheit der Verarbeitung), GoBD Rz. 100 ff. (Datensicherheit), Paragraph 203 StGB (Berufsgeheimnis StB) verlangen technisch durchgesetzte Trennung — nicht nur funktionale.
- **Wartbarkeit:** Eine zentrale Quelle (Migration) ist einfacher zu auditieren als verstreute Frontend-Checks.

### 3.3 — Beispiel A: `cookie_consents` mit Strict Owner Predicate

**Migration:** `supabase/migrations/0042_fix_cookie_consent_rls.sql`

**Kern (Zeile 33):**

```sql
create policy cookie_consents_select_own
  on public.cookie_consents
  for select using (user_id = auth.uid());
```

**Compliance-Bezug:** DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung). Vor `0042` war eine Policy `user_id IS NULL OR user_id = auth.uid()` aktiv, die anonyme Consents global lesbar machte. Das verstiess gegen Datenminimierung. `0042` schliesst das Leck.

**Anti-Pattern, das vermieden wurde:**

```typescript
// FALSCH — Frontend-Filter statt RLS
const { data } = await supabase.from('cookie_consents').select('*');
const own = data.filter(c => c.user_id === currentUserId);
```

Hier sieht der Browser zuerst alle Datensaetze, dann filtert er. Ein Angreifer mit DevTools liest das Netzwerk-Response und sieht fremde Daten.

### 3.4 — Beispiel B: `belege` mit Predicate-Funktionen + Immutability-Trigger

**Migrationen:**

- `supabase/migrations/0048_fix_rls_belege_leak.sql` (RLS via Predicate-Funktionen)
- `supabase/migrations/0022_belege_persistence.sql` (Immutability-Trigger)

**Kern aus `0048`:**

```sql
create policy belege_select_member
  for select using (public.is_company_member(company_id));

create policy belege_insert_can_write
  for insert with check (public.can_write(company_id));

create policy belege_update_can_write
  for update using (public.can_write(company_id))
  with check (public.can_write(company_id));
```

**Kern aus `0022` (Zeilen 156-159):**

```sql
drop trigger if exists belege_immutability on public.belege;
create trigger belege_immutability
  before update or delete on public.belege
  for each row execute function public.prevent_gebucht_beleg_mutation();
```

**Compliance-Bezug:**

- DSGVO Art. 32 (Sicherheit) — RLS via `is_company_member` / `can_write`.
- Paragraph 203 StGB (Berufsgeheimnis StB) — strikte Mandantentrennung.
- GoBD Rz. 64 (Unveraenderbarkeit gebuchter Belege) — Trigger `prevent_gebucht_beleg_mutation`.

**Wichtig:** Der Trigger blockiert nicht jedes UPDATE/DELETE, sondern nur Mutationen an Belegen mit Status `gebucht`. Drafts bleiben editierbar. Das ist GoBD-konform und bewusst so gewaehlt.

**Anti-Pattern, das vermieden wurde:**

```typescript
// FALSCH — Frontend prueft Status
if (beleg.status === 'gebucht') {
  alert('Belege im Status "gebucht" koennen nicht geaendert werden.');
  return;
}
await supabase.from('belege').update(...).eq('id', beleg.id);
```

Ohne Trigger wuerde ein direkter API-Call den Beleg trotzdem aendern. Mit Trigger schlaegt der Update auf DB-Ebene fehl — unabhaengig vom Aufrufer.

### 3.5 — Beispiel C: `settings` mit vier expliziten Policies

**Migration:** `supabase/migrations/0050_drop_legacy_settings_and_recreate.sql`

**Kern (Zeilen 111-125):**

```sql
create policy settings_select_own
  for select using (user_id = auth.uid());

create policy settings_insert_own
  for insert with check (user_id = auth.uid());

create policy settings_update_own
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy settings_delete_own
  for delete using (user_id = auth.uid());
```

**Strukturelle Eigenschaft (Zeile 75):**

```sql
unique nulls not distinct (user_id, mandant_id)
```

Ein einziger JSONB-Eintrag pro `(user_id, mandant_id)`. Das ist die DB-seitige Garantie, dass Settings mandantenfaehig getrennt bleiben — keine Frontend-Logik kann diese Invarianz aufweichen.

**Compliance-Bezug:** DSGVO Art. 32 (Sicherheit). Vier separate Policies (statt einer) erlauben kuenftig differenzierte Berechtigungen (z. B. read-only Service-Accounts), ohne den Owner-Predicate aufzulockern.

### 3.6 — Anti-Pattern: "Frontend prueft die Berechtigung"

| Falsch | Richtig |
|--------|---------|
| `if (user.role === 'admin') { showButton(); }` als alleinige Schutzmassnahme | Frontend zeigt Button per `role`-Check UND Backend setzt RLS/Permission durch |
| `data.filter(d => d.userId === me)` nach `select('*')` | RLS-Policy `user_id = auth.uid()` direkt in der DB |
| `if (status === 'gebucht') return` als Schreib-Schutz | Trigger blockiert Mutation auf DB-Ebene |

Frontend-Checks sind erlaubt und erwuenscht — als UX-Verbesserung. Sie ersetzen niemals DB-seitige Durchsetzung.

### 3.7 — Akzeptanzregeln fuer neue Tabellen

Jede neue Tabelle in `supabase/migrations/` muss in derselben Migration:

1. RLS aktivieren (`alter table ... enable row level security`).
2. Mindestens eine SELECT-Policy definieren — niemals leer lassen.
3. Falls Mandanten-Bezug: Predicate-Funktion (`is_company_member`, `can_write`) oder explizite `auth.uid()`-Bindung verwenden.
4. Falls Audit-relevante Tabelle (Belege, Buchungssaetze, Lohn): Immutability-Trigger mit GoBD-konformem Status-Check.
5. Falls (user_id, mandant_id)-Eindeutigkeit: `unique nulls not distinct` setzen.

Eine Tabelle ohne RLS in `public.` schlaegt im Code-Review zu fehl.

---

## 4 — Section 2: Shadow Mode bei Migration-Phasen

### 4.1 — Begriffsklaerung

Der Begriff "Shadow Mode" wird im `harouda`-Kontext als Oberbegriff fuer **phasenweise Datenmigration mit Feature-Flag** verwendet. Klassischer Dual-Read (parallel aus zwei Quellen lesen, in beide schreiben) ist nicht das primaere Muster — wohl aber Bestandteil einer Phase.

Das tatsaechlich angewandte Muster gliedert sich in drei Phasen:

| Phase | Lesen | Schreiben | Flag |
|-------|-------|-----------|------|
| **P1 — Schema bereit** | Legacy | Legacy | OFF |
| **P2 — Wrapper aktiv** | Wrapper-vermittelt (Flag-gesteuert) | Wrapper-vermittelt | OFF (Default) |
| **P3 — Cutover + Migration** | Beide (waehrend Migration) | Neue Quelle | ON |

### 4.2 — Wann anwenden

- Wenn Daten von einer Speicherform zu einer anderen migriert werden (z. B. `localStorage` → Supabase Storage; wide-table → JSONB).
- Wenn ein Cutover ohne Downtime gefordert ist.
- Wenn Roll-back jederzeit moeglich bleiben muss (Flag = OFF).

### 4.3 — Wann nicht anwenden

- Bei reinem Schema-Refactor ohne Daten-Bewegung (z. B. Spalte umbenennen — `ALTER TABLE ... RENAME`).
- Bei Migrationen mit garantierter Downtime (z. B. Wartungsfenster).
- Bei trivialen, idempotenten Schema-Aenderungen.

### 4.4 — Konkretes Beispiel: `feat/documents-storage-go-live`

**Quelle:** `docs/documents-consumer-audit.md` (Stand 2026-05-02), HANDOFF_BATCH_12 ff.

**Ziel:** Belege von Browser-`localStorage` (`local://{id}`) in den Supabase-Storage-Bucket `documents` migrieren.

**Feature-Flag:** `VITE_USE_SUPABASE_STORAGE` in `.env`.

**Phasen:**

#### P1 — Schema bereit (PR 2: `feat/documents-async-api`)

- Cloud-API ist live (`uploadDocument`, `fetchDocuments`, `getDocumentSignedUrl`, `migrateOneDocumentToCloud`, ...).
- `VITE_USE_SUPABASE_STORAGE = OFF`.
- Konsumenten verwenden weiterhin Legacy-Pfade.
- Migration `0046` legt `documents`-Bucket und FKs an.

**Status:** abgeschlossen.

#### P2 — Wrapper aktiv (PR 4: `refactor/documents-preview-async`)

- Einheitlicher Wrapper `getAnyDocumentUrl(doc): Promise<string | null>`:

```typescript
export async function getAnyDocumentUrl(
  doc: Document
): Promise<string | null> {
  if (import.meta.env.VITE_USE_SUPABASE_STORAGE === "true") {
    return getDocumentSignedUrl(doc, 3600);
  }
  return getDocumentUrlLegacy(doc);
}
```

- Konsumenten kennen das Flag nicht.
- Test-Standard: `vi.mock` + `vi.hoisted()` (etabliert in PR 2).
- `VITE_USE_SUPABASE_STORAGE = OFF` (Default).

**Status:** geplant, nicht ausgefuehrt.

#### P3 — Cutover + Migration (PR N+1: `feat/documents-storage-go-live`)

- Migrations-UI: Banner zeigt verbleibende `localStorage`-Belege.
- `migrateOneDocumentToCloud` pro Beleg.
- Waehrend Migration: Lesen aus `localStorage` UND Cloud (klassischer Dual-Read als Sub-Phase).
- Nach Abschluss: `markDocumentsLocalStorageMigrationComplete`, `VITE_USE_SUPABASE_STORAGE = ON`.

**Voraussetzung:** PR 4 muss gemerged sein.

**Status:** geplant, nicht ausgefuehrt.

### 4.5 — Akzeptanzregeln

Eine Migration nach diesem Muster muss:

1. **Atomare PRs** pro Phase (P1, P2, P3 getrennt; niemals buendeln).
2. **Feature-Flag-Default OFF** in `.env.example` und `.env.production`.
3. **Wrapper-Funktion** als einzige Stelle, die das Flag liest — kein Konsument prueft das Flag direkt.
4. **Resumability** in P3: Browser-Reload waehrend Migration darf keine Daten verlieren.
5. **Rollback-Plan** in der PR-Beschreibung von P3: Was passiert, wenn Migration fehlschlaegt?
6. **Compliance-Verifikation** vor P3 (relevant fuer Belege: DSGVO Art. 32, GoBD Rz. 100, Paragraph 257 HGB) — Ruecksprache mit Datenschutz-Verantwortlichem und StB dokumentieren.

---

## 5 — Section 3: UI Shell-Trennung

### 5.1 — Prinzip

Die UI ist in **Shells** organisiert. Eine Shell ist ein Layout-Container mit eigener Navigation fuer einen funktionalen Bereich (Buchhaltung, Lohn, Steuern, Stammdaten, Banking, Anlagen, Auswertungen, Einstellungen).

- **`BaseShell`** liefert das Layout-Skelett: Sidebar-Container, Topbar, `<Outlet />`.
- **Spezifische Shells** (z. B. `BuchhaltungShell`) erweitern `BaseShell` mit bereichsspezifischer Navigation und Logik.

### 5.2 — `BaseShell` (Layout-Skelett)

**Datei:** `src/components/shell/BaseShell.tsx` (4006 Bytes)
**CSS:** `src/components/shell/BaseShell.css` (1767 Bytes)

**Aufgaben:**

- Sidebar-Container (collapsible).
- Topbar mit Mandanten-Switcher.
- `<Outlet />` fuer Routing.
- Keine Geschaeftslogik. Keine Bereichs-Navigation. Keine Daten-Abfragen.

### 5.3 — `BuchhaltungShell` (Bereichs-Shell)

**Datei:** `src/components/shell/BuchhaltungShell.tsx` (3093 Bytes)
**CSS:** `src/components/shell/BuchhaltungShell.css` (2195 Bytes)

**Tatsaechliche Struktur (Stand `bbd7a68`, 2026-05-02):**

| Sektion | Routes | Inhalt |
|---------|--------|--------|
| **Erfassung** | 4 | `/buchhaltung/journal`, `/buchhaltung/buchungen/erfassung` (Paragraph 14 UStG), `/buchhaltung/buchungen/belege`, `/buchhaltung/konten` |
| **Buchungen pruefen** | 2 | `/buchhaltung/opos`, `/buchhaltung/mahnwesen` |
| **Bank** | 3 | `/buchhaltung/bankimport`, `/buchhaltung/banking/reconciliation`, `/buchhaltung/banking/belegabfragen` |
| **Anlagen** | 2 | `/buchhaltung/anlagen/verzeichnis`, `/buchhaltung/anlagen/afa-lauf` |
| **Auswertung** | 3 | `/buchhaltung/buchfuehrung` (EUR-Hub), `/buchhaltung/euer` (Anlage), `/buchhaltung/liquiditaet` |

**Insgesamt:** 5 Sektionen, 14 Routes.

### 5.4 — Entscheidungskriterien

#### Wann eine neue Shell?

- Eigene Sidebar-Sektionen (mehr als 2-3 Routes mit gemeinsamem Kontext).
- Eigene Topbar-Aktionen oder bereichsspezifische Filter.
- Eigener Mandanten-/Modul-Kontext (z. B. nur in Buchhaltung relevante Period-Picker).
- Voraussichtlich wachsende Route-Anzahl (`>= 5` mittelfristig).

#### Wann KEINE neue Shell?

- 1-2 Routes ohne eigene Navigation → direkt unter `BaseShell` mounten.
- Kein bereichsspezifischer Topbar-Inhalt.
- Kein dedizierter Sidebar-Bereich.

#### Beispiele aus der Praxis

| Bereich | Eigene Shell? | Begruendung |
|---------|--------------|-------------|
| Buchhaltung | Ja (`BuchhaltungShell`) | 5 Sektionen, 14 Routes, eigener Period-Kontext |
| Banking | Nein (Sektion in `BuchhaltungShell`) | Nur 3 Routes, gemeinsamer Buchhaltungs-Kontext |
| Anlagen | Nein (Sektion in `BuchhaltungShell`) | Nur 2 Routes, gemeinsamer Buchhaltungs-Kontext |

### 5.5 — Anti-Pattern

| Falsch | Richtig |
|--------|---------|
| Geschaeftslogik (Mandanten-Fetch, Period-State) in `BaseShell` | Logik in spezifischer Shell oder Page |
| Bereichs-spezifische Sidebar-Items in `BaseShell` hart-codiert | Sidebar-Items in spezifischer Shell deklariert |
| Page mit eigener Sidebar-Navigation ausserhalb einer Shell | Eine eigene Shell anlegen oder in bestehende integrieren |
| `BaseShell` und spezifische Shell rendern beide eine Topbar | Topbar nur an einer Stelle (Komposition statt Verschachtelung) |

### 5.6 — Akzeptanzregeln

1. Neue Pages werden unter `BaseShell` oder einer spezifischen Shell gemountet — niemals freistehend.
2. `BaseShell` enthaelt keine Geschaeftslogik.
3. Spezifische Shells werden bei `>= 5 Routes` mit gemeinsamem Kontext angelegt.
4. Sidebar-Items werden in der jeweiligen Shell deklarativ definiert (siehe `BuchhaltungShell.tsx`).
5. Tests fuer Shells decken Routing und Sidebar-Render ab.

---

## 6 — Beobachtungen aus Charge 16

### 6.1 — Diskrepanz zwischen HANDOFF und Code-Realitaet bei `BuchhaltungShell`

`HANDOFF_BATCH_16.md` (Abschnitt 8.2) beschreibt `BuchhaltungShell` als _"5 Module (Konten, Belege, Buchungssaetze, EUR, Auswertungen)"_.

Die tatsaechliche Implementierung in `src/components/shell/BuchhaltungShell.tsx` (commit `bbd7a68`) zeigt 5 **Sektionen** (Erfassung, Buchungen pruefen, Bank, Anlagen, Auswertung) mit insgesamt 14 Routes.

Dieses Dokument folgt dem Code, nicht der HANDOFF-Zusammenfassung. **Konsequenz fuer die Praxis:** HANDOFF-Aussagen sind Hypothesen, keine Fakten (Lehre aus Charge 14).

Diese Beobachtung erzeugt KEINE neue technische Schuld — beide Beschreibungen sind funktional korrekte Aggregate auf unterschiedlichen Granularitaets-Stufen.

---

## 7 — Querverweise

### Migrationen

| Migration | Bezug |
|-----------|-------|
| `0022_belege_persistence.sql` | Section 1: `belege_immutability`-Trigger, `prevent_gebucht_beleg_mutation` |
| `0042_fix_cookie_consent_rls.sql` | Section 1: Strict Owner Predicate fuer `cookie_consents` |
| `0046_documents_storage.sql` | Section 2: Schema-Vorbereitung Cloud-Storage |
| `0048_fix_rls_belege_leak.sql` | Section 1: `is_company_member`, `can_write`, RLS auf `belege` |
| `0050_drop_legacy_settings_and_recreate.sql` | Section 1: Vier explizite Policies + `unique nulls not distinct` |

### Code-Dateien

| Datei | Bezug |
|-------|-------|
| `src/components/shell/BaseShell.tsx` | Section 3: Layout-Skelett |
| `src/components/shell/BuchhaltungShell.tsx` | Section 3: Bereichs-Shell mit 5 Sektionen |
| `src/api/documents.ts` | Section 2: Wrapper-Pattern (geplant in PR 4) |

### Doku

| Dokument | Bezug |
|----------|-------|
| `docs/documents-consumer-audit.md` | Section 2: Phasen-Plan `feat/documents-storage-go-live` |
| `docs/harouda-migrations-update-2026-05-02.md` | Section 1: Migrations-Stand auf `harouda` |

### Compliance

| Norm | Bezug |
|------|-------|
| DSGVO Art. 5 Abs. 1 lit. c | Datenminimierung — `0042` |
| DSGVO Art. 32 | Sicherheit der Verarbeitung — `0042`, `0048`, `0050` |
| Paragraph 203 StGB | Berufsgeheimnis StB — `0048` (`belege`) |
| Paragraph 257 HGB | Aufbewahrungspflichten — `0046` (Schema-Vorbereitung) |
| GoBD Rz. 64 | Unveraenderbarkeit gebuchter Belege — `0022`-Trigger |
| GoBD Rz. 100 ff. | Datensicherheit, Unveraenderbarkeit — `0046`, `0048` |

---

## 8 — Hinweis zur Aktualisierung

Dieses Dokument ist KEIN lebendes Architektur-Konzept. Es spiegelt etablierte Praxis. Aenderungen erfolgen nur:

- bei strukturellen Aenderungen an einem der drei Prinzipien (z. B. neue Shell-Konvention),
- bei nachweislich falschen Aussagen (Code-Realitaet widerspricht der Doku),
- bei substanziellen neuen Beispielen (z. B. weitere Migrations-Phasen).

Spekulative Erweiterungen (z. B. "Was waere wenn wir Microservices machten?") gehoeren NICHT in dieses Dokument, sondern in eine separate ADR (Architecture Decision Record) unter `docs/architecture/decisions/`.

Bei Unsicherheiten bezueglich Compliance-Aussagen: **Ruecksprache mit Steuerberater oder Fachanwalt fuer IT-Recht.**

---

**Ende `docs/architecture-governance.md`.**

*Erstellt im Branch `docs/architecture-governance` als Teil von Charge 15 Phase 2 zur Schliessung der Schuld 14-bet.*
