# harouda-app · Migrations-Update Stop-Notice — 2026-05-02

> **Status:** Phase 1 von Charge 14 wurde unterbrochen. `harouda` befindet sich im Mischzustand:
> - Migration `0042_fix_cookie_consent_rls.sql` wurde manuell via Supabase Studio angewendet.
> - Migration `0044_user_settings.sql` schlug mit Schema-Konflikt fehl.
> - Migrations `0046` und `0048` wurden NICHT angewendet.
>
> **Datum:** 2026-05-02
> **Ausfuehrender:** Abdullah
> **Project-Ref:** `harouda` (Supabase, eu-central-1, Free Plan)
> **Letzter `main`-Hash bei Beginn:** `fe2c847`

---

## 1 — Was wurde angewendet

### 1.1 — Migration `0042_fix_cookie_consent_rls.sql`

**Status:** Erfolgreich angewendet.

**Ausgefuehrtes SQL:**

```sql
drop policy if exists cookie_consents_select on public.cookie_consents;
create policy cookie_consents_select on public.cookie_consents
  for select using (user_id = auth.uid());
```

**Verifikation (post-apply):**

Query:

```sql
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.cookie_consents'::regclass
  and polname = 'cookie_consents_select';
```

Ergebnis:

```
polname                  | using_expr
-------------------------+--------------------------
cookie_consents_select   | (user_id = auth.uid())
```

Das vorherige Praedikat `(user_id IS NULL OR user_id = auth.uid())` wurde durch das strikte Eigentuemer-Praedikat ersetzt. Das RLS-Leck der Charge 7 (Aufgabe 1) ist auf Database-Ebene geschlossen.

**Hinweis:** Die Anwendung erfolgte ueber Supabase Studio SQL Editor, NICHT ueber `supabase db push`. Daher wurde KEIN Eintrag in `supabase_migrations.schema_migrations` erzeugt. Der Migrations-Tracker zeigt weiterhin den Stand vor `0042`.

---

## 2 — Was wurde NICHT angewendet — und warum

### 2.1 — Migration `0044_user_settings.sql`

**Status:** Fehlgeschlagen. Nicht angewendet.

**Fehlermeldung:**

```
ERROR: 42703: column "mandant_id" of relation "public.settings" does not exist
```

**Ursachenanalyse:**

Die Migration nutzt `create table if not exists public.settings (...)`. Das `if not exists`-Praedikat ueberspringt die Tabellenerstellung — denn die Tabelle existiert bereits, allerdings mit einer voellig anderen Struktur. Die anschliessende `unique nulls not distinct (user_id, mandant_id)`-Constraint schlaegt fehl, weil die Spalte `mandant_id` in der existierenden Tabelle nicht vorhanden ist.

**Bestehende Tabelle (aus `0001_init.sql`):**

| Spalte | Typ | Nullable |
|--------|-----|----------|
| `owner_id` | uuid | NO |
| `kanzlei_name` | text | NO |
| `kanzlei_strasse` | text | NO |
| `kanzlei_plz` | text | NO |
| `kanzlei_ort` | text | NO |
| `kanzlei_telefon` | text | NO |
| `kanzlei_email` | text | NO |
| `default_steuernummer` | text | NO |
| `elster_berater_nr` | text | NO |
| `updated_at` | timestamptz | NO |
| `company_id` | uuid | YES |

**Erwartete Tabelle (aus `0044_user_settings.sql`):**

| Spalte | Typ | Nullable |
|--------|-----|----------|
| `id` | uuid (PK) | NO |
| `user_id` | uuid | NO |
| `mandant_id` | uuid | YES |
| `payload` | jsonb | NO |
| `updated_at` | timestamptz | NO |

**Befund:** Architektonische Inkonsistenz zwischen `0001_init.sql` (wide-table) und `0044_user_settings.sql` (single-row JSONB). Migration `0044` wurde geschrieben unter der Annahme, dass `public.settings` nicht existiert — diese Annahme war falsch.

**Konsumenten-Verifikation:**

- `src/api/settings.ts` exportiert generischen Typ `SettingsPayload` und arbeitet mit `payload`-basierter API.
- `src/contexts/SettingsContext.tsx` ruft `fetchSettings()` und `saveSettings(payload)` auf, behandelt das Ergebnis als `Partial<Settings>`-JSON-Blob.

Der Client-Code erwartet die JSONB-Struktur — nicht die wide-table. Die existierende Tabelle ist Zombie-Schema: angelegt von `0001_init.sql`, aber von keinem aktuellen Code-Pfad verwendet. `select count(*) from public.settings;` ergab `0`.

### 2.2 — Migration `0046_documents_storage_schema.sql`

**Status:** Nicht angewendet. Reihenfolge-Block durch `0044`.

### 2.3 — Migration `0048_fix_rls_belege_leak.sql`

**Status:** Nicht angewendet. Reihenfolge-Block durch `0044`.

---

## 3 — Aktueller Datenbank-Zustand

| Tabelle / Policy | Stand |
|------------------|-------|
| `cookie_consents.cookie_consents_select` | Aktualisiert auf `USING (user_id = auth.uid())` |
| `public.settings` | Wide-table aus `0001_init.sql`, leer (0 Zeilen), nicht von Code verwendet |
| `public.belege` | Stand `0041` (RLS-Leck aus `0048` weiterhin offen) |
| `public.beleg_positionen` | Stand `0041` (RLS-Leck aus `0048` weiterhin offen) |
| Storage-Bucket `documents` | Nicht vorhanden (`0046` nicht angewendet) |
| `supabase_migrations.schema_migrations` | Nicht aktualisiert (manueller Studio-Workflow) |

---

## 4 — Beschluss

Charge 14 Phase 1 wird unterbrochen. Die manuelle Anwendung weiterer Migrations ist gesperrt, bis der Schema-Konflikt zwischen `0001_init.sql` und `0044_user_settings.sql` aufgeloest ist.

**Begruendung:**

1. Der Konflikt ist nicht durch reine Anwendungsreihenfolge loesbar.
2. Eine ad-hoc-Loesung (`DROP TABLE` im SQL Editor) wuerde Drift zwischen Migrations-Files und Datenbank verursachen.
3. Charge 14 ist explizit auf Manual-DB-Phase beschraenkt; Code- bzw. Migrations-Files-Aenderungen gehoeren in eine eigene Code-Phase.

---

## 5 — Naechste Schritte (Charge 15)

### 5.1 — Neue Schuld registriert

**14-aleph:** Schema-Konflikt zwischen `0001_init.sql` (Zeile 78) und `0044_user_settings.sql`. Aufloesung erfordert eine atomare Migration, die das Legacy-Schema entfernt und die JSONB-Struktur erstellt.

### 5.2 — Vorschlag fuer Charge 15

Eine neue Migration `0050_drop_legacy_settings_and_recreate.sql` erstellen, die:

1. `drop table if exists public.settings cascade;` ausfuehrt.
2. Die JSONB-Struktur aus `0044` neu erstellt (Tabelle, Index, Trigger, RLS-Policies).
3. Idempotent geschrieben ist und unabhaengig von vorherigen Migration-Ergebnissen ausgefuehrt werden kann.

Anschliessend in dokumentierter Reihenfolge anwenden:

1. `0044_user_settings.sql` (wird durch `if not exists` no-op, da `0050` die Tabelle bereits korrekt anlegt — oder `0044` wird durch eine kommentar-only-Variante ersetzt; Entscheidung in Charge 15).
2. `0046_documents_storage_schema.sql`.
3. `0048_fix_rls_belege_leak.sql`.
4. `0050_drop_legacy_settings_and_recreate.sql` (in der korrekten zeitlichen Reihenfolge — siehe Charge 15 Architekturentscheidung).

### 5.3 — Ruecksprachen

- **Datenschutz-Verantwortlicher:** Information ueber den unterbrochenen Stand. RLS-Leck `0042` wurde geschlossen, RLS-Leck `0048` (belege) ist weiterhin offen.
- **StB:** Keine GoBD-relevante Aenderung in Charge 14 erfolgt. `belege`-Tabelle bleibt unveraendert.

---

## 6 — Compliance-Status

| Anforderung | Stand |
|-------------|-------|
| DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung) bzgl. `cookie_consents` | Behoben durch `0042` |
| DSGVO Art. 32 (Sicherheit der Verarbeitung) bzgl. `cookie_consents` | Behoben durch `0042` |
| DSGVO Art. 32 bzgl. `belege`/`beleg_positionen` | Weiterhin offen (`0048` nicht angewendet) |
| GoBD Rz. 100 ff. (Unveraenderbarkeit, Belege in Cloud-Storage) | Weiterhin offen (`0046` nicht angewendet) |
| HGB § 257 (Aufbewahrung) | Weiterhin offen (Belege noch in `localStorage`) |

---

## 7 — Anhang: Verwendete Verifikations-Queries

### 7.1 — Policy-Inspektion

```sql
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.cookie_consents'::regclass
  and polname = 'cookie_consents_select';
```

### 7.2 — Tabellen-Struktur-Inspektion

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'settings'
order by ordinal_position;
```

### 7.3 — Datenbestand-Pruefung

```sql
select count(*) as row_count from public.settings;
```

### 7.4 — Migration-Files-Inspektion (PowerShell)

```powershell
Select-String -Path "supabase/migrations/*.sql" `
  -Pattern "create table.*public\.settings|create table if not exists public\.settings" `
  -CaseSensitive:$false
```

---

**Ende Stop-Notice — 2026-05-02.**

*Verfasser: Abdullah, im Rahmen von Charge 14, Phase 1.*
*Folge-Charge: 15 (Schema-Konflikt-Aufloesung).*


---

# Folge-Update — Charge 15, Phase 1 — 2026-05-02

> **Status:** Schema-Konflikt aufgeloest. Migrations `0050`, `0046`, `0048` manuell auf `harouda` angewendet.
>
> **Datum:** 2026-05-02 (gleicher Tag, separates Update)
> **Ausfuehrender:** Abdullah
> **Project-Ref:** `harouda` (Supabase, eu-central-1, Free Plan)
> **`main`-Hash bei Beginn:** `9e85739` (PR #42 gemerged)

---

## 8 — Was wurde in Charge 15 Phase 1 angewendet

### 8.1 — Migration `0050_drop_legacy_settings_and_recreate.sql`

**Status:** Erfolgreich angewendet.

**Vorbedingung-Verifikation (vor `drop table cascade`):**

| Pruefung | Ergebnis |
|----------|----------|
| `count(*) from public.settings` | `0` |
| Foreign Keys auf `public.settings` | keine |
| Views/Materialized Views auf `public.settings` | keine |

`drop table cascade` war datensicher.

**Verifikation (post-apply):**

Spalten-Struktur:

| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `mandant_id` | `uuid` | YES | — |
| `payload` | `jsonb` | NO | `'{}'::jsonb` |
| `updated_at` | `timestamptz` | NO | `now()` |

RLS-Policies (`select`, `insert`, `update`, `delete`) alle mit Praedikat `user_id = auth.uid()`. RLS aktiviert.

Indizes: `settings_pkey`, `settings_user_idx`, `settings_user_mandant_unique` (mit `nulls not distinct`).

Trigger: `settings_updated_at` (`BEFORE UPDATE`, `EXECUTE FUNCTION settings_set_updated_at()`).

### 8.2 — Migration `0044_user_settings.sql` — Status

**Funktional ersetzt durch `0050`. Datei beibehalten als No-op-Marker.**

Inhalt durch Header-Kommentar ersetzt, der auf `0050` verweist. `db push` fuehrt sie aus, ohne Effekt. Reihenfolge zwischen `0044` und `0050` ist irrelevant, da `0050` den finalen Zustand idempotent herstellt.

### 8.3 — Migration `0046_documents_storage_schema.sql`

**Status:** Erfolgreich angewendet.

**Vorbedingung-Verifikation (vor `add column`):**

| Pruefung | Ergebnis |
|----------|----------|
| `belege.id` (uuid) | vorhanden |
| `documents.file_path` (text) | vorhanden |
| `documents.beleg_id` | NICHT vorhanden (vor Migration) |

**Verifikation (post-apply):**

| Pruefung | Ergebnis |
|----------|----------|
| Storage-Bucket `documents` (`public = false`) | vorhanden |
| Spalte `documents.beleg_id` (`uuid`, nullable) | vorhanden |
| FK `documents_beleg_id_fkey` → `belege.id` | mit `ON DELETE SET NULL` |
| Index `documents_beleg_idx` | vorhanden |

`Storage-Bucket` existierte bereits seit `2026-04-24` (manuelle Anlage in Vorgaenger-Charge). `on conflict (id) do nothing` respektierte den Bestand.

### 8.4 — Migration `0048_fix_rls_belege_leak.sql`

**Status:** Erfolgreich angewendet.

**Vorbedingung-Verifikation:**

| Pruefung | Ergebnis |
|----------|----------|
| `is_company_member()`-Funktion | vorhanden |
| `can_write()`-Funktion | vorhanden |
| `belege.company_id`, `belege.status` | vorhanden |
| `beleg_positionen.beleg_id` | vorhanden |

**Vorher (RLS-Leck aus `0022_belege_persistence.sql`):**

| Tabelle | Policy | Praedikat |
|---------|--------|-----------|
| `belege` | `belege_select` | `using (true)` ⚠️ |
| `belege` | `belege_insert` | `with check (true)` ⚠️ |
| `belege` | `belege_update` | `using (true)` ⚠️ |
| `belege` | `belege_delete` | `using (status = 'ENTWURF')` (kein Mandant) ⚠️ |
| `beleg_positionen` | `beleg_pos_select` | `using (true)` ⚠️ |
| `beleg_positionen` | `beleg_pos_mutate` | `for all using (true) with check (true)` ⚠️ |

**Nachher:**

| Tabelle | Policy | Praedikat |
|---------|--------|-----------|
| `belege` | `belege_select` | `is_company_member(company_id)` |
| `belege` | `belege_insert` | `with check (can_write(company_id))` |
| `belege` | `belege_update` | `can_write(company_id)` (using + with check) |
| `belege` | `belege_delete` | `can_write(company_id) and status = 'ENTWURF'` |
| `beleg_positionen` | `beleg_pos_select` | `EXISTS(belege) and is_company_member(b.company_id)` |
| `beleg_positionen` | `beleg_pos_insert` | `EXISTS(belege) and can_write(b.company_id)` |
| `beleg_positionen` | `beleg_pos_update` | `EXISTS(belege) and can_write(b.company_id)` (using + with check) |
| `beleg_positionen` | `beleg_pos_delete` | `EXISTS(belege) and can_write + status = 'ENTWURF'` |

`beleg_pos_mutate`-Policy entfernt. Vier separate Policies (`select`, `insert`, `update`, `delete`) nun aktiv.

`belege_immutability`-Trigger blieb unveraendert (GoBD Rz. 64).

**Hinweis:** `0048` ist NICHT vollstaendig idempotent — `beleg_pos_insert/update/delete` haben kein `drop policy if exists` davor. Bei erneutem Anwenden (z. B. via `db push` nach Tracker-Reset) wuerden die `create policy`-Statements mit `policy already exists` fehlschlagen. Schuld registrieren als 15-aleph fuer Charge 16+.

---

## 9 — Tracker-Drift

Wie auch `0042`: alle drei Migrations (`0046`, `0048`, `0050`) wurden manuell via Supabase Studio SQL Editor angewendet. **Kein Eintrag** in `supabase_migrations.schema_migrations`.

**Kumulativer Drift-Stand auf `harouda` per 2026-05-02:**

- `0042_fix_cookie_consent_rls.sql` — angewendet, nicht im Tracker.
- `0044_user_settings.sql` — als No-op deaktiviert (siehe Abschnitt 8.2).
- `0046_documents_storage_schema.sql` — angewendet, nicht im Tracker.
- `0048_fix_rls_belege_leak.sql` — angewendet, nicht im Tracker.
- `0050_drop_legacy_settings_and_recreate.sql` — angewendet, nicht im Tracker.

Die Aufloesung des Trackers bleibt mit Schuld 12-gimel verknuepft (separates Staging-Project + funktionierender `db push`).

---

## 10 — Compliance-Stand nach Charge 15 Phase 1

| Anforderung | Stand |
|-------------|-------|
| DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung) bzgl. `cookie_consents` | Behoben (`0042`) |
| DSGVO Art. 32 (Sicherheit der Verarbeitung) bzgl. `cookie_consents` | Behoben (`0042`) |
| DSGVO Art. 32 bzgl. `belege` und `beleg_positionen` | **Behoben (`0048`)** |
| DSGVO Art. 32 bzgl. `settings` | **Behoben (`0050`, RLS strict owner)** |
| § 203 StGB (Berufsgeheimnis StB) bzgl. `belege` | **Behoben (`0048`)** |
| GoBD Rz. 100 ff. (Unveraenderbarkeit, Belege in Cloud-Storage) | Schema vorbereitet (`0046`); Code-Anwendung ausstehend |
| HGB § 257 (Aufbewahrung) | Schema-Vorbereitung (`0046`); Code-Anwendung ausstehend |
| HGB § 238 ff. (Buchfuehrung) | Spec offen (Schuld 14-gimel, Charge 15 Phase 3) |

**Verbleibend fuer `feat/documents-storage-go-live`:**

1. ~~Schema-Konflikt aufloesen~~ — erledigt.
2. 2 Test-Mandanten anlegen.
3. Test-Matrix aus HANDOFF_BATCH_12 Abschnitt 8 durchlaufen.
4. `belege_immutability`-Trigger bestaetigen.
5. Schriftliche Bestaetigung an Datenschutz-Verantwortlichen.
6. StB-Ruecksprache zu Loesch-Policies.
7. Doku in `docs/staging-rls-verifikation-YYYY-MM-DD.md`.

---

## 11 — Neue Schulden (registriert in HANDOFF_BATCH_16)

| Nr | Beschreibung | Prioritaet |
|----|--------------|-----------|
| **15-aleph** | `0048_fix_rls_belege_leak.sql` ist nicht voll idempotent — `beleg_pos_insert/update/delete` haben kein `drop policy if exists`. Bei erneutem Anwenden Fehlschlag. Korrektur in Folge-Migration oder Migration-File-Edit. | niedrig |

---

**Ende Folge-Update — Charge 15 Phase 1.**

*Verfasser: Abdullah.*
*Status der Datenbank: alle Sicherheits-Migrations bis `0050` einschliesslich angewendet. Tracker-Drift dokumentiert.*
*Naechste Phase: Charge 15 Phase 2 (Architecture-Governance) oder Charge 16 (Compliance-Verifikation).*
