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

---

# Folge-Update — Charge 19 Phase 2 (Migration 0052) — 2026-05-02

> **Status:** Migration `0052_revoke_anon_dangerous_grants.sql` wurde manuell via Supabase Studio angewendet.
>
> **Datum:** 2026-05-02
> **Ausfuehrender:** Abdullah
> **Project-Ref:** `harouda` (Supabase, eu-central-1, Free Plan)
> **Letzter `main`-Hash bei Beginn:** `6a9d2de`
> **Vorgaenger-Update:** Charge 15 Phase 1 (Migrations 0046, 0048, 0050)

---

## 12 — Was wurde in Charge 19 Phase 2 (Migration 0052) angewendet

### 12.1 — Migration `0052_revoke_anon_dangerous_grants.sql`

**Status:** Erfolgreich angewendet.

**Hintergrund:** Bei der Vorbereitung der GRANT-Migration fuer Schuld 18-bet wurde entdeckt, dass die Rolle `anon` auf 41 von 42 Tabellen in `public` die Privilegien `TRUNCATE`, `TRIGGER` und `REFERENCES` besitzt. `TRUNCATE` umgeht BEFORE-DELETE-Trigger (z. B. `journal_entries_protect_delete`) und RLS-Policies vollstaendig. Ein nicht-authentifizierter Aufruf koennte theoretisch alle Buchungs-Daten entfernen.

Diese Migration entzieht die nicht-beabsichtigten Privilegien. `SELECT` auf `health_check` fuer `anon` bleibt unveraendert (intentionaler Health-Probe-Zugriff).

**Ausgefuehrtes SQL:**

```sql
revoke truncate, trigger, references on all tables in schema public from anon;
```

**Pre-Apply-Verifikation (am 2026-05-02):**

```sql
select
  has_schema_privilege('anon', 'public', 'USAGE') as anon_public_usage,
  has_table_privilege('anon', 'public.health_check', 'SELECT') as anon_health_check_select;
```

Ergebnis vor Apply: `(true, true)` — Voraussetzungen erfuellt.

**Post-Apply-Verifikation:**

```sql
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
group by table_name
order by table_name;
```

Ergebnis nach Apply: genau eine Zeile.

| table_name   | privs  |
|--------------|--------|
| health_check | SELECT |

→ REVOKE vollstaendig angewendet. Schuld 19-dalet auf DB-Niveau geschlossen.

---

## 13 — Tracker-Drift nach 0052

| Migration | Status auf DB | Status im git-Repo (`main` @ Zeitpunkt der Anwendung) |
|-----------|---------------|---------------------------------------------------------|
| 0042 | applied (manuell, Charge 14) | applied (commit) |
| 0046 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0048 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0050 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| **0052** | **applied (manuell, Charge 19 Phase 2)** | **NOCH NICHT committed (Tracker-Drift)** |
| 0053 | nicht angewendet | noch nicht committed (geplant, Folge-PR) |

**Drift-Begruendung:** Wie in Charge 15 Phase 1 dokumentiert: `harouda` hat keinen automatischen Migrations-Tracker fuer manuell via Studio angewendete Files. `db push` ist lokal nicht moeglich (Docker fehlt). Die Drift wird durch diesen Eintrag dokumentiert, der zusammen mit dem Migration-File in einem atomaren PR committed wird.

**Auswirkung:** Bis der PR mit `0052` gemerged ist, weicht der DB-Zustand vom `main`-Stand ab. Nach dem Merge ist die Drift wieder geschlossen (DB und git in Sync auf `0052`).

---

## 14 — Compliance-Stand nach 0052

| Anforderung | Stand vor 0052 | Stand nach 0052 |
|-------------|----------------|------------------|
| GoBD Rz. 58, 59, 64 (Unveraenderbarkeit gebuchter Belege) | Trigger-Niveau gegeben; durch `anon TRUNCATE` umgehbar. | Trigger-Niveau gegeben; `anon TRUNCATE` entzogen. |
| § 257 HGB (Aufbewahrung) | gefaehrdet durch `anon TRUNCATE`. | strukturell gesichert auf REVOKE-Niveau. |
| § 146 AO (Ordnungsmaessigkeit) | gefaehrdet durch `anon TRUNCATE`. | strukturell gesichert. |
| Art. 32 DSGVO (Sicherheit der Verarbeitung) | gefaehrdet durch `anon TRUNCATE`. | konkret verbessert. |
| Least-Privilege-Prinzip fuer `anon` | verletzt (3 ueberfluessige Privs auf 41 Tabellen). | erfuellt — `anon` hat nur den intendierten `SELECT` auf `health_check`. |

**Hinweis:** Die Massnahme schliesst Schuld 19-dalet auf der Privilegien-Ebene. Die operationale Korrektheit (RLS-Konfiguration, Mandanten-Isolation) bleibt durch andere Schichten geschuetzt; `0052` adressiert ausschliesslich die direkte `anon`-Eskalations-Lücke.

---

## 15 — Neue Schulden registriert in Charge 19 Phase 2

| Schuld | Quelle | Beschreibung |
|--------|--------|--------------|
| **19-dalet** | Phase 2 Schritt 4 (Vorbereitung GRANT-Migration) | `anon TRUNCATE/TRIGGER/REFERENCES` auf 41 Tabellen — **durch dieses Update geschlossen.** |
| **19-gimel** | Phase 2 Schritt 3 (Helper-Funktionen-Inspektion) | Function-EXECUTE-Hardening: `REVOKE EXECUTE FROM PUBLIC` + explicit GRANTs fuer `is_company_member`, `can_write`, `is_company_admin`, `client_belongs_to_company`. Eigene Charge. |
| **19-he** | Phase 2 Schritt 4 (nach Analyse anon-Grants) | `ALTER DEFAULT PRIVILEGES`-cleanup: verhindern, dass kuenftige Tabellen automatisch `anon TRUNCATE/TRIGGER/REFERENCES` erhalten. Eigene Charge. |

Schulden aus Phase 1 (`19-aleph`, `19-bet`) bleiben unveraendert offen — siehe Doku-File aus Charge 19 Phase 1.

---

## 16 — Naechste Schritte (Migration 0053 — Charge 19 Phase 2 Fortsetzung)

Nach Merge des `0052`-PRs:

1. Migration `0053_grant_authenticated_public_tables.sql` als separater PR.
2. Anwendung der GRANTs fuer `authenticated` (per Gruppe A–E aus dem Inventar).
3. `service_role` erhaelt `ALL ON ALL TABLES IN SCHEMA public`.
4. Sequenz-GRANTs fuer `account_report_mapping_id_seq` und `report_lines_id_seq`:
   - `GRANT USAGE ON SEQUENCE ... TO authenticated`.
   - Erforderlich, da beide Tabellen `nextval(...)`-Defaults haben und ohne den Grant der INSERT-Pfad scheitert.
5. Tracker-Drift-Eintrag fuer `0053` in dieser Datei (Abschnitt 17+).

Schulden 19-aleph, 19-bet, 19-gimel, 19-he werden NICHT in der `0053`-Migration mit-bearbeitet.

---

**Ende Folge-Update — Charge 19 Phase 2 (0052).**

*Verfasser: Abdullah.*
*Status der Datenbank: alle Sicherheits-Migrations bis `0052` einschliesslich angewendet. Tracker-Drift dokumentiert. `anon`-Privileg-Eskalation auf REVOKE-Niveau geschlossen.*
*Naechste Phase: Migration `0053_grant_authenticated_public_tables.sql` (separater PR).*

---

# Folge-Update — Charge 19 Phase 2 Step 2 (Migration 0053) — 2026-05-02

> **Status:** Migration `0053_revoke_authenticated_dangerous_grants.sql` wurde manuell via Supabase Studio angewendet.
>
> **Datum:** 2026-05-02
> **Ausfuehrender:** Abdullah
> **Project-Ref:** `harouda` (Supabase, eu-central-1, Free Plan)
> **Letzter `main`-Hash bei Beginn:** `48fabda`
> **Vorgaenger-Update:** Charge 19 Phase 2 Step 1 (Migration 0052)

---

## 17 — Was wurde in Charge 19 Phase 2 Step 2 (Migration 0053) angewendet

### 17.1 — Migration `0053_revoke_authenticated_dangerous_grants.sql`

**Status:** Erfolgreich angewendet.

**Hintergrund:** Bei der Pre-existing-Grants-Pruefung vor Schreiben der GRANT-Migration `0054` (Schuld 18-bet) wurde entdeckt, dass die Rolle `authenticated` auf 42 Tabellen im Schema `public` die Privilegien `TRUNCATE`, `TRIGGER` und `REFERENCES` besitzt. Die Ursache liegt vermutlich in `ALTER DEFAULT PRIVILEGES` aus frueheren Migrations (siehe Schuld 19-he).

`TRUNCATE` durch eine authentifizierte Rolle umgeht:

- RLS-Policies vollstaendig (PostgreSQL-Eigenheit, vgl. Lehre 44).
- BEFORE-DELETE-Trigger wie `journal_entries_protect_delete` (Migration `0022`).
- Mandanten-Isolation — entfernt Zeilen aller Mandanten gleichzeitig.

Diese Befund war nicht in HANDOFF nach Charge 19 Phase 2 Step 1 §3.1 dokumentiert. HANDOFF nahm implizit eine `authenticated`-Tabelle ohne Privilegien an. Die tatsaechliche DB-Realitaet zeigte 84 Zeilen in `information_schema.role_table_grants` fuer die beiden Rollen `authenticated` und `service_role`. Die Diskrepanz wird in Sektion 21 dokumentiert.

`SELECT` auf `health_check` fuer `authenticated` bleibt unveraendert (intentionaler Health-Probe-Zugriff, gleiche Begruendung wie bei `0052` fuer `anon`).

**Ausgefuehrtes SQL:**

```sql
revoke truncate, trigger, references
  on all tables in schema public
  from authenticated;
```

**Pre-Apply-Snapshot (am 2026-05-02):**

```sql
select count(*) as authenticated_table_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated';
```

Ergebnis vor Apply: `127`.

Erlaeuterung der Zahl: 41 Tabellen mit je 3 Privilegien (`REFERENCES`, `TRIGGER`, `TRUNCATE`) = 123, plus `health_check` mit 4 Privilegien (`REFERENCES`, `SELECT`, `TRIGGER`, `TRUNCATE`) = 127.

**Pre-Apply-Verifikation `health_check`:**

```sql
select privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
  and table_name = 'health_check'
order by privilege_type;
```

Ergebnis: 4 Zeilen — `REFERENCES`, `SELECT`, `TRIGGER`, `TRUNCATE`. Der `SELECT`-Eintrag ist intentional und darf nach Apply NICHT entfernt sein.

**Post-Apply-Verifikation:**

```sql
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
group by table_name
order by table_name;
```

Ergebnis nach Apply: genau eine Zeile.

| table_name   | privs  |
|--------------|--------|
| health_check | SELECT |

**Cross-Check:**

```sql
select count(*) as remaining_count
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated';
```

Ergebnis: `1`. Differenz zum Pre-Apply-Snapshot: 127 − 1 = 126 entfernte Privilegien. Erwartung: 41 × 3 (gewoehnliche Tabellen) + 3 (`health_check` ohne `SELECT`) = 126. Tatsache und Erwartung stimmen ueberein.

REVOKE vollstaendig angewendet. Schuld 19-vav auf DB-Niveau geschlossen.

---

## 18 — Tracker-Drift nach 0053

| Migration | Status auf DB | Status im git-Repo (`main` @ Zeitpunkt der Anwendung) |
|-----------|---------------|---------------------------------------------------------|
| 0042 | applied (manuell, Charge 14) | applied (commit) |
| 0046 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0048 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0050 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0052 | applied (manuell, Charge 19 Phase 2 Step 1) | applied (commit) |
| **0053** | **applied (manuell, Charge 19 Phase 2 Step 2)** | **NOCH NICHT committed (Tracker-Drift)** |
| 0054 | nicht angewendet | noch nicht committed (geplant, Folge-PR) |

**Drift-Begruendung:** Wie in Charge 15 Phase 1 und 19 Phase 2 Step 1 dokumentiert: `harouda` hat keinen automatischen Migrations-Tracker fuer manuell via Studio angewendete Files. `db push` ist lokal nicht moeglich (Docker fehlt). Die Drift wird durch diesen Eintrag dokumentiert, der zusammen mit dem Migration-File in einem atomaren PR committed wird.

**Auswirkung:** Bis der PR mit `0053` gemerged ist, weicht der DB-Zustand vom `main`-Stand ab. Nach dem Merge ist die Drift wieder geschlossen (DB und git in Sync auf `0053`).

---

## 19 — Compliance-Stand nach 0053

| Anforderung | Stand vor 0053 | Stand nach 0053 |
|-------------|----------------|------------------|
| GoBD Rz. 58, 59, 64 (Unveraenderbarkeit gebuchter Belege) | Trigger-Niveau gegeben; durch `authenticated TRUNCATE` umgehbar. | Trigger-Niveau gegeben; `authenticated TRUNCATE` entzogen. |
| Paragraph 257 HGB (Aufbewahrung) | gefaehrdet durch `authenticated TRUNCATE`. | strukturell gesichert auf REVOKE-Niveau. |
| Paragraph 146 AO (Ordnungsmaessigkeit) | gefaehrdet durch `authenticated TRUNCATE`. | strukturell gesichert. |
| Art. 32 DSGVO (Sicherheit der Verarbeitung) | gefaehrdet durch `authenticated TRUNCATE`. | konkret verbessert. |
| Mandanten-Isolation | gefaehrdet — `TRUNCATE` umgeht RLS und entfernt alle Mandanten-Zeilen. | strukturell gesichert auf REVOKE-Niveau. |
| Least-Privilege-Prinzip fuer `authenticated` | verletzt (3 ueberfluessige Privs auf 42 Tabellen). | erfuellt — `authenticated` hat nur den intendierten `SELECT` auf `health_check`. |

**Hinweis:** Die Massnahme schliesst Schuld 19-vav auf der Privilegien-Ebene. Die Operabilitaet der Anwendung ueber `@supabase/supabase-js` ist nach `0053` weiterhin nicht gegeben — `authenticated` besitzt nun ueberhaupt keine SELECT/INSERT/UPDATE/DELETE-Grants. Diese werden in Migration `0054` (Schuld 18-bet) systematisch nach RLS-Policy-Inventar ergaenzt.

**Zwischenstand der Operabilitaet:** Anwendung ist auf REVOKE-Niveau sicher, aber operativ tot (kein `authenticated` Zugriff auf Tabellen ausser `health_check / SELECT`). Dieser Zwischenstand ist beabsichtigt und temporaer bis `0054` angewendet ist.

---

## 20 — Neue Schuld registriert in Charge 19 Phase 2 Step 2

| Schuld | Quelle | Beschreibung | Status |
|--------|--------|--------------|--------|
| **19-vav** | Phase 2 Step 2 (Pre-existing-Grants-Check vor `0054`-Vorbereitung) | `authenticated TRUNCATE/TRIGGER/REFERENCES` auf 42 Tabellen — durch `0053` geschlossen. | GESCHLOSSEN |

Die Schulden 18-bet (GRANT-Repair Operabilitaet), 19-aleph, 19-bet, 19-gimel, 19-he bleiben unveraendert offen. 18-bet wird in Migration `0054` adressiert.

---

## 21 — Diskrepanz mit HANDOFF nach Charge 19 Phase 2 Step 1, plus Falle 3.2 Manifestation #12

### 21.1 — HANDOFF-Diskrepanz

HANDOFF §3.1 implizierte, dass `authenticated` keine vorhandenen Privilegien auf `public`-Tabellen besitzt. Diese Annahme war ein Folgefehler aus Charge 18 §5: dort wurde durch RLS-Test mit `42501`-Fehler geschlossen, dass GRANTs fehlen — was korrekt war fuer `SELECT/INSERT/UPDATE/DELETE`, aber NICHT fuer `TRUNCATE/TRIGGER/REFERENCES`. Diese drei wurden waehrend Charge 18 nicht getestet, weil `42501` auf `SELECT` auftrat und die Diagnose dort endete.

In Charge 19 Phase 2 Step 2 wurde die Diskrepanz durch den expliziten `role_table_grants`-Check entdeckt. Lehre 53 (Pre-existing-Grants-Check vor jeder GRANT-Migration) erwies sich damit als unmittelbar wertvoll — ohne diesen Schritt waere die Privileg-Eskalation auch nach `0054` weiterhin offen geblieben.

**Praxis-Konsequenz:** Bei kuenftigen GRANT-Migrationen oder wenn `42501` als Diagnose-Endpunkt auftritt: die Privileg-Liste fuer ALLE `privilege_type`-Werte (nicht nur `SELECT/INSERT/UPDATE/DELETE`) zu pruefen, nicht aus dem Symptom auf den Vollumfang schliessen.

### 21.2 — Falle 3.2 Manifestation #12

Beim Pre-Patch-Baseline-Check fuer Tracker-Doku (Sektion 22 dieser Datei) wurde der Befehl

```powershell
(Get-Content "docs/harouda-migrations-update-2026-05-02.md").Count
```

aus dem Chat in PowerShell kopiert. Die Chat-Anzeige hatte den Dateinamen automatisch in einen Markdown-Link umgewandelt:

```
docs/[harouda-migrations-update-2026-05-02.md](http://harouda-migrations-update-2026-05-02.md)
```

PowerShell akzeptierte den Befehl ohne Fehler und lieferte korrekte Werte zurueck. Ursache: PowerShell interpretiert `[...]` als Wildcard-Pattern (Falle 3.9). Das Pattern `[harouda-...md]` matchte zufaellig genau eine Datei in `docs/`, und der `(http://...)`-Suffix wurde von `Get-Content`/`Get-Item` als trailing-text ignoriert.

**Risiko:** Der Befehl funktionierte zufaellig korrekt. Bei mehreren matching files oder Sonderzeichen-Konflikten wuerde derselbe Befehl stillschweigend falsche Werte liefern.

**Verifikation per `Get-ChildItem -Path docs -Filter *.md | Select-Object Name, Length`:** Datei existiert mit Namen `harouda-migrations-update-2026-05-02.md` (ohne `[`/`]`/URLs) und `Length = 22528`. Die zufaellig korrekten Pre-Patch-Werte (525 Zeilen, 22528 Bytes) sind damit numerisch bestaetigt.

**Eintrag fuer Falle-3.2-Liste:** Diese Manifestation #12 ist die zwoelfte beobachtete Wirkung von Falle 3.2 (zuvor: SEPTUPLE-DIRECTIONAL bis Charge 17, danach Manifestation #11 in Phase 2 Step 1 fuer File-System-Output). Falle 3.2 ist damit weiterhin aktiv beim Kopieren von Pfaden aus dem Chat in PowerShell.

**Praxis-Konsequenz:** Pfade aus dem Chat NIEMALS in PowerShell einfuegen. Stattdessen entweder

- per Tab-Completion in PowerShell ergaenzen,
- oder den Pfad per Hand abtippen.

Die HANDOFF-Schreibanweisung "Bei jedem Datei-Test: numerische Verifikation" (Lehre 48) wird damit verstaerkt: zusaetzlich zur numerischen Verifikation muss auch die Eingabe des Pfades selbst gegen Falle 3.2 abgesichert werden.

---

## 22 — Naechste Schritte (Migration 0054 — GRANT-Repair, Schuld 18-bet)

Nach Merge des `0053`-PRs:

1. Migration `0054_grant_authenticated_public_tables.sql` als separater PR.
2. Anwendung der GRANTs fuer `authenticated` (per Gruppe A–E aus dem Inventar von Charge 19 Phase 2 Step 1).
3. `service_role` erhaelt `GRANT ALL ON ALL TABLES IN SCHEMA public` plus `GRANT ALL ON ALL SEQUENCES IN SCHEMA public`.
4. Sequenz-GRANTs fuer `account_report_mapping_id_seq` und `report_lines_id_seq`:
   - `GRANT USAGE ON SEQUENCE ... TO authenticated`.
   - Erforderlich, da beide Tabellen `nextval(...)`-Defaults haben und ohne den Grant der INSERT-Pfad scheitert (Lehre 52).
5. Tracker-Drift-Eintrag fuer `0054` in dieser Datei (Abschnitt 23+).

Die Migration-Nummer fuer die GRANT-Repair-Migration verschiebt sich damit von urspruenglich geplant `0053` auf `0054`. Der HANDOFF-Eintrag und die Migration-Mapping aus Phase 2 Step 1 bleiben inhaltlich gueltig — nur die Datei-Nummer aendert sich. Diese Verschiebung ist eine direkte Folge der Schuld 19-vav-Entdeckung.

Schulden 19-aleph, 19-bet, 19-gimel, 19-he werden NICHT in der `0054`-Migration mit-bearbeitet.

---

**Ende Folge-Update — Charge 19 Phase 2 Step 2 (0053).**

*Verfasser: Abdullah.*
*Status der Datenbank: alle Sicherheits-Migrations bis `0053` einschliesslich angewendet. Tracker-Drift dokumentiert. `authenticated`-Privileg-Eskalation auf REVOKE-Niveau geschlossen.*
*Naechste Phase: Migration `0054_grant_authenticated_public_tables.sql` (separater PR, Schuld 18-bet).*


---

## 23 — Charge 19 Phase 2 Step 3: Migration 0054 GRANT-Repair

> **Status:** Migration `0054_grant_authenticated_public_tables.sql` wurde manuell via Supabase Studio angewendet.
>
> **Datum:** 2026-05-03
> **Ausfuehrender:** Abdullah
> **Project-Ref:** `harouda` (Supabase, eu-central-1, Free Plan)
> **Letzter `main`-Hash bei Beginn:** `12e35c0`
> **Vorgaenger-Update:** Charge 19 Phase 2 Step 2 (Migration 0053)

---

### 23.1 — Ziel

Schliessung der Schuld 18-bet (GRANT-Repair). Nach den restriktiven Migrations
`0052` (REVOKE anon dangerous) und `0053` (REVOKE authenticated dangerous)
besass die Rolle `authenticated` keine SELECT/INSERT/UPDATE/DELETE-Grants mehr,
und `service_role` besass keine CRUD-Privilegien — nur REFERENCES, TRIGGER,
TRUNCATE. Das Backend war operativ unfaehig.

`0054` stellt die Operabilitaet fuer beide Rollen wieder her, und zwar nach
dem Least-Privilege-Prinzip pro Tabelle in fuenf Gruppen (A–E), abgeleitet
aus dem RLS-Policy-Inventar.

---

### 23.2 — Source-of-Truth Korrektur

**Diskrepanz entdeckt:** Der HANDOFF-Eintrag fuer Charge 19 Phase 2 Step 3
(§3.1) verwies auf "Sektion 16" dieser Doku als Quelle des Gruppe A–E
Mappings. Sektion 16 enthaelt jedoch nur die geplanten naechsten Schritte
nach `0052` (Stand vor der Schuld 19-vav-Entdeckung) — kein detailliertes
Tabellen-Mapping mit expliziten Tabellen-Namen.

**Korrektur:** Das Gruppe-Mapping wurde nach der in HANDOFF_BATCH_19 §8.4
spezifizierten Methodik neu aufgebaut. Der Master schreibt explizit vor:

1. RLS-Policy-Inventar via `pg_policies`-Abfrage erstellen (Z. 518–527).
2. Pro Tabelle die `cmd`-Werte aggregieren (Z. 528).
3. GRANT-Mapping aus den `cmd`-Werten ableiten (Z. 529–532).

Diese Methodik wurde am 2026-05-03 als Pre-Check Phase 6/N ausgefuehrt
(siehe §23.5). Das Resultat ergab das Gruppe-Mapping deterministisch und
nachvollziehbar aus dem DB-Zustand selbst — und nicht aus einer fixen
Tabellenliste in einer Vorgaenger-Doku, die nicht existierte.

**Konsequenz fuer kuenftige HANDOFFs:** Verweise auf "Sektion X enthaelt das
Mapping" muessen vor Verwendung verifiziert werden. Schreibanweisung Nr. 39
aus HANDOFF_BATCH_19 ("HANDOFF-Status-Behauptungen sind Hypothesen, keine
Fakten") wurde in dieser Charge erneut bestaetigt.

---

### 23.3 — Migration-Zusammenfassung

**Datei:** `supabase/migrations/0054_grant_authenticated_public_tables.sql`
**Groesse:** 13475 Bytes (LF), 214 Zeilen, 45 GRANT-Statements
**Encoding:** Pure ASCII (keine Umlaute, keine UTF-8-Spezialzeichen).

**Inhalt nach RLS-Policy-Inventar (134 Policies auf 41 Tabellen):**

| Gruppe | Anzahl Tabellen | GRANT fuer `authenticated` |
|--------|------------------|------------------------------|
| A — Voll-CRUD | 32 | `SELECT, INSERT, UPDATE, DELETE` |
| B — S/I/D | 1 (`dunning_records`) | `SELECT, INSERT, DELETE` |
| C — S/I/U | 1 (`user_profiles`) | `SELECT, INSERT, UPDATE` |
| D — Append-Only | 6 (`app_logs`, `audit_log`, `cookie_consents`, `privacy_incidents`, `privacy_requests`, `ustid_verifications`) | `SELECT, INSERT` |
| E — Read-Only | 1 (`business_partners_versions`) | `SELECT` |
| **Summe authenticated** | **41** | — |

**Sequenz-GRANTs fuer `authenticated` (Lehre 52):**

- `GRANT USAGE ON SEQUENCE public.account_report_mapping_id_seq TO authenticated`
- `GRANT USAGE ON SEQUENCE public.report_lines_id_seq           TO authenticated`

**`service_role`-GRANTs (Bulk):**

- `GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role`
- `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role`

**Out-of-Scope (explizit):** Schulden 19-aleph, 19-bet, 19-gimel, 19-he,
18-aleph (BEFORE-DELETE-Trigger fuer `belege`/`beleg_positionen`, Charge 21),
sowie Storage-Schema-Privilegien.

**Tabelle `health_check`:** out-of-scope. Hat keine RLS-Policies und behaelt
SELECT-only fuer `authenticated` aus frueherer Konfiguration (intentional
fuer Frontend-Health-Probe). Inkrementell fuegt `0054` ihr keine Privilegien
hinzu — sie ist die 42. Tabelle im schema, die nicht ueber das RLS-Inventar
laeuft.

---

### 23.4 — Apply-Ergebnis

**Methode:** Manuelle Anwendung via Supabase Studio SQL Editor (konsistent
mit `0042`, `0046`, `0048`, `0050`, `0052`, `0053` — `db push` lokal nicht
moeglich, Falle 3.12).

**Studio-Output (zweiter Versuch, erfolgreich):**

```
Success. No rows returned
```

Keine `ERROR`. Keine `WARNING`. Keine `NOTICE`.

**Inzident beim ersten Apply-Versuch:** Statt der Migration-SQL wurde
versehentlich der Result-Template-Text in den SQL-Editor eingefuegt. Studio
meldete `ERROR: 42601 syntax error at or near "==="`. Recovery: Editor
geleert, Clipboard aus der lokalen Migration-Datei neu geladen,
Clipboard-Praefix und -Length (13475) verifiziert, dann erneut ausgefuehrt.
Erneute Bestaetigung von Falle 3.2 im Chat-Copy-Paste-Pfad.

---

### 23.5 — Pre-Apply Verifikation (sechs Phasen)

| Phase | Inhalt | Ergebnis |
|-------|--------|----------|
| 1/N | `git status`, branch, commit | `main` @ `12e35c0`, working tree clean |
| 2/N | Tabellen-GRANTs `authenticated` + `service_role` | 43 Zeilen, exakt wie erwartet (1 fuer `authenticated/health_check`, 42 fuer `service_role` mit `REFERENCES, TRIGGER, TRUNCATE`) |
| 3/N | Sequenz-GRANTs via `information_schema.role_usage_grants` | 0 Zeilen — wirkte sauber, war aber unvollstaendig (siehe §23.7) |
| 4/N | Sequenz-Inventar | 2 Sequenzen, beide bigint: `account_report_mapping_id_seq`, `report_lines_id_seq` |
| 5/N | RLS-Policy-Anzahl | 134 Policies (= HANDOFF §3.1 Erwartung) |
| 6/N | RLS-Policy-Inventar via `pg_policies` (Master §8.4) | 134 Zeilen / 41 Tabellen, Aggregation pro Tabelle ergab Gruppe A–E exakt nach HANDOFF §3.1 |

Anschliessend: `git pull origin main` (`Already up to date.`), Branch-Erstellung
`fix/charge-19-phase-2-0054` (Lehre 50), Datei-Erstellung, manueller Transfer
ins Repo, numerische Verifikation auf Datei-System (Length=13475, Lines=214,
GRANT-Count=45, Lehre 48), dann Apply.

---

### 23.6 — Post-Apply Verifikation (V1–V4)

**(V1) `authenticated` — Tabellen-GRANTs**

42 Zeilen — exaktes Match mit Erwartung:

- 32 × `DELETE, INSERT, SELECT, UPDATE` (Gruppe A)
- `dunning_records` = `DELETE, INSERT, SELECT` (Gruppe B)
- `user_profiles` = `INSERT, SELECT, UPDATE` (Gruppe C)
- 6 × `INSERT, SELECT` (Gruppe D)
- `business_partners_versions` = `SELECT` (Gruppe E)
- `health_check` = `SELECT` (intentional, unveraendert)

**(V2) `authenticated` — Sequenz-Privilegien (`has_sequence_privilege()`)**

```
sequence_name                 | has_usage | has_select | has_update
account_report_mapping_id_seq | true      | false      | true
report_lines_id_seq           | true      | false      | true
```

Bewertung pro Privileg fuer den Scope von `0054`:

- **`has_usage = true`** ist das Erfolgskriterium von `0054` (Lehre 52).
  Beide Sequenzen erhielten `USAGE` durch die Migration. Dieses Kriterium
  ist erfuellt.
- **`has_select = false`** wie erwartet — `0054` granted `SELECT` nicht und
  kein anderer Mechanismus tut es ebenfalls.
- **`has_update = true`** war unerwartet. Diagnostische Folge-Abfrage via
  `pg_class.relacl + aclexplode()` ergab: das `UPDATE`-Privileg ist ein
  direkter ACL-Eintrag fuer `authenticated` auf beiden Sequenzen. Die
  ACL-Diagnostik zeigte zudem: dasselbe `UPDATE`-Privileg existiert
  ebenfalls fuer `anon`. Beide Eintraege bestanden bereits vor `0054` —
  der Migration-Text enthaelt nur `grant usage on sequence ... to
  authenticated` und keine `UPDATE`-Grants. Quelle der pre-existing
  Eintraege noch zu klaeren; vermutlich aus frueheren Default-Privileges.
  Pre-existing und out-of-scope fuer `0054`.

V2 wird daher als bestanden fuer den Scope von `0054` gewertet. Das
gemeinsame Befund-Paar `anon/UPDATE` und `authenticated/UPDATE` auf
Sequenzen wird als forward-reference fuer eine kuenftige Schuld
festgehalten (siehe §23.8).

**(V3) `service_role` — Tabellen-GRANTs**

42 Zeilen, jede mit 7 Privilegien:
`DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`

Vor `0054`: 3 Privilegien (`REFERENCES, TRIGGER, TRUNCATE`).
Nach `0054`: 7 Privilegien (`+DELETE, +INSERT, +SELECT, +UPDATE`).
`grant all on all tables in schema public to service_role` wurde lueckenlos
auf alle 42 Tabellen angewendet. Vollstaendige Operabilitaet von
`service_role` hergestellt.

**(V4) `service_role` — Sequenz-Privilegien (`has_sequence_privilege()`)**

```
sequence_name                 | has_usage | has_select | has_update
account_report_mapping_id_seq | true      | true       | true
report_lines_id_seq           | true      | true       | true
```

Alle drei Privilegien (USAGE, SELECT, UPDATE) gesetzt — exakt wie
beabsichtigt durch `grant all on all sequences in schema public to
service_role`. V4 bestanden.

---

### 23.7 — Methodische Anmerkung zu Pre-Check Phase 3/N

Pre-Check Phase 3/N nutzte `information_schema.role_usage_grants` und gab
0 Zeilen zurueck — was den Eindruck erweckte, es bestehe kein Sequenz-Grant
fuer `authenticated` oder `service_role`. V2 zeigte jedoch (verifiziert
ueber ACL-Diagnostik), dass auf den Sequenzen bereits `UPDATE`-Privilegien
fuer `anon` und `authenticated` existierten.

`information_schema.role_usage_grants` deckt nur das SQL-Standard-Privileg
`USAGE` ab. Die PostgreSQL-spezifischen Sequenz-Privilegien `SELECT` und
`UPDATE` werden dort nicht aufgefuehrt. Pre-Check 3/N war damit
unvollstaendig — die pre-existing `UPDATE`-Eintraege wurden nicht erkannt.

Eine vollstaendige Sequenz-Privilegien-Inspektion erfordert zwei Quellen:

- `information_schema.role_usage_grants` fuer `USAGE`.
- `pg_class.relacl` via `aclexplode()` fuer `SELECT` und `UPDATE`.

Diese Erkenntnis wird als forward-reference fuer eine spaetere Lehre
festgehalten (siehe §23.8).

---

### 23.8 — Schluss-Status und Forward-References

**Schuld 18-bet (GRANT-Repair fuer `authenticated` + `service_role`):**
durch `0054` geschlossen. Beide Rollen sind operativ in Bezug auf alle
41 RLS-Policy-Tabellen sowie die 2 Sequenzen. RLS-Policy-Schicht (134
Policies) bleibt unveraendert wirksam und stellt die eigentliche
Mandanten-Isolation sicher.

**Forward-References (Detail in spaeterer Sektion):**

- **Schuld 19-zayin (kuenftig)** — `anon` und `authenticated` besitzen ein
  pre-existing `UPDATE`-Privileg auf den Sequenzen
  `account_report_mapping_id_seq` und `report_lines_id_seq` (per
  ACL-Diagnostik in V2 nachgewiesen). Das erlaubt einen direkten
  `setval()`-Aufruf und damit einen DoS-Vektor durch Sequenz-Counter-Reset
  oder ID-Space-Exhaustion. Quelle der pre-existing Eintraege noch zu
  klaeren; vermutlich aus frueheren Default-Privileges. Durch `0054`
  weder verursacht noch behoben. Eigene REVOKE-Migration in spaeterer
  Charge.

- **Lehre 58 (kuenftig)** — Pre-Check fuer Sequenz-Privilegien benoetigt
  zwei Datenquellen (`information_schema.role_usage_grants` plus
  `pg_class.relacl` via `aclexplode()`); siehe §23.7.

- **Lehre 57 (kuenftig)** — HANDOFF-Verweise auf externe Dokument-Sektionen
  muessen vor Verwendung faktisch verifiziert werden; siehe §23.2.

---

## 24 — Tracker-Drift nach Migration 0054

| Migration | Status auf DB | Status im git-Repo (`main` @ Zeitpunkt der Anwendung) |
|-----------|---------------|---------------------------------------------------------|
| 0042 | applied (manuell, Charge 14) | applied (commit) |
| 0046 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0048 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0050 | applied (manuell, Charge 15 Phase 1) | applied (commit) |
| 0052 | applied (manuell, Charge 19 Phase 2 Step 1) | applied (commit) |
| 0053 | applied (manuell, Charge 19 Phase 2 Step 2) | applied (commit, `12e35c0`) |
| **0054** | **applied (manuell, Charge 19 Phase 2 Step 3, 2026-05-03)** | **NOCH NICHT committed (Tracker-Drift)** |

**Lokaler Zustand:**

- Migration-Datei existiert lokal:
  `supabase/migrations/0054_grant_authenticated_public_tables.sql`
  (13475 Bytes, 214 Zeilen, 45 GRANT-Statements).
- Branch: `fix/charge-19-phase-2-0054`, abgeleitet von `main` @ `12e35c0`.
- `git status --short` meldet die Datei als untracked (`??`).

**Drift-Begruendung:** Wie in Charge 15 Phase 1 dokumentiert: `harouda` hat
keinen automatischen Migrations-Tracker fuer manuell via Studio angewendete
Files. `db push` ist lokal nicht moeglich (Docker fehlt, Falle 3.12). Die
Drift wird durch diesen Eintrag dokumentiert und durch einen atomaren PR
geschlossen, der die Migration-Datei zusammen mit der vorliegenden
Doku-Sektion (23–26 plus Footer) in `main` ueberfuehrt.

**Auswirkung:** Bis der PR mit `0054` und dieser Doku gemerged ist, weicht
der DB-Zustand vom `main`-Stand ab. Nach dem Merge ist die Drift wieder
geschlossen (DB und git in Sync auf `0054`).

**Naechste Schritte zur Drift-Schliessung (Reihenfolge):**

1. `git add supabase/migrations/0054_grant_authenticated_public_tables.sql`
   plus diese Doku-Datei.
2. Numerische Verifikation der gesamten Doku-Datei (Lehre 48: Length und
   Zeilenzahl mit Tool ermitteln, nicht von Hand).
3. `git commit` mit aussagekraeftiger Message
   (z. B. "feat(db): 0054 GRANT-Repair authenticated + service_role").
4. **Vor `git push`:** Claude Code (Desktop-App) schliessen
   (HANDOFF §7 Punkt 11).
5. `git push -u origin fix/charge-19-phase-2-0054`.
6. PR oeffnen mit Verweis auf Schuld 18-bet und auf §23–§26 dieser Doku.

---

## 25 — Compliance-Stand nach Charge 19 Phase 2 Step 3

**Sicherheits-Schichten der Charge 19 Phase 2 (drei Steps, drei Migrations):**

| Schuld | Migration | Step | Status |
|--------|-----------|------|--------|
| 19-dalet (`anon TRUNCATE/TRIGGER/REFERENCES`) | `0052` | 1 | geschlossen |
| 19-vav (`authenticated TRUNCATE/TRIGGER/REFERENCES`) | `0053` | 2 | geschlossen |
| 18-bet (GRANT-Repair `authenticated` + `service_role`) | `0054` | 3 | geschlossen |

**Operative Lage nach `0054`:**

| Rolle | Vor `0052` | Nach `0053` | Nach `0054` |
|-------|-----------|--------------|---------------|
| `anon` | TRUNCATE/TRIGGER/REFERENCES auf public tables + intentionaler `SELECT` auf `health_check` | nur `SELECT` auf `health_check` (intentional) | unveraendert |
| `authenticated` | volle CRUD-Operabilitaet auf Studio-Default-Niveau | nur `SELECT` auf `health_check` (intentional, sonst keine CRUD-Privilegien) | CRUD nach Gruppe A–E auf 41 RLS-Policy-Tabellen + `USAGE` auf 2 Sequenzen |
| `service_role` | Default-Niveau ohne CRUD | unveraendert (REFERENCES/TRIGGER/TRUNCATE) | `ALL` auf alle 42 Tabellen + `ALL` auf 2 Sequenzen |

**RLS-Schicht:** unveraendert. 134 Policies auf 41 Tabellen wirksam (Stand
vor `0054` und nach `0054` identisch). Mandanten-Isolation und
GoBD-relevante Restriktionen (`*_client_consistency`,
`journal_entries_auditor_expiry`, `*_no_delete`, `*_no_update`) bleiben in
Kraft. Die GRANT-Schicht ist nun konsistent mit der RLS-Schicht — Lehre 44
(GRANT und RLS sind orthogonale Schichten) operativ umgesetzt.

| Anforderung | Stand vor 0054 | Stand nach 0054 |
|-------------|----------------|------------------|
| GoBD Rz. 58, 59, 64 (Unveraenderbarkeit gebuchter Belege) | RLS- und Trigger-Niveau gegeben; durch fehlende GRANTs operativ unbestaetigt. | RLS- und Trigger-Niveau gegeben; durch GRANT-Schicht jetzt operativ pruefbar. |
| § 257 HGB (Aufbewahrung) | strukturell gesichert (REVOKE-Niveau aus 0052/0053). | unveraendert strukturell gesichert; Operabilitaet wiederhergestellt. |
| § 146 AO (Ordnungsmaessigkeit der Buchfuehrung) | strukturell gesichert. | unveraendert strukturell gesichert. |
| Art. 32 DSGVO (Sicherheit der Verarbeitung) | gehaertet auf REVOKE-Niveau. | gehaertet plus operativ pruefbar. |
| Least-Privilege-Prinzip fuer `authenticated` | `authenticated` operativ tot — kein verifizierter Zugriff. | erfuellt — pro Tabelle exakt die Privilegien, die durch RLS-Policies abgedeckt sind. |
| Operabilitaet `service_role` | nicht gegeben (REFERENCES/TRIGGER/TRUNCATE only). | hergestellt (Voll-Zugriff). |

**Hinweis:** Die Massnahme schliesst Schuld 18-bet auf der Privilegien-Ebene
fuer den Scope von 41 RLS-Policy-Tabellen plus 2 Sequenzen. Die operationale
Korrektheit (RLS-Konfiguration, Mandanten-Isolation, Trigger-Wirksamkeit)
wird in der Charge 20 Compliance-Verifikation replay erneut systematisch
gegen DB-Realitaet abgeglichen. Charge 20 bleibt damit der naechste
verifikatorische Meilenstein nach Drift-Schliessung von `0054`.

---

## 26 — Neue Erkenntnisse: Schuld 19-zayin, Lehre 57, Lehre 58

### 26.1 — Schuld 19-zayin (registriert)

| Feld | Wert |
|------|------|
| **Name** | `19-zayin` (siebter hebraeischer Buchstabe; konsistent mit der Reihe `19-aleph`, `19-bet`, `19-gimel`, `19-dalet`, `19-he`, `19-vav`) |
| **Quelle** | Charge 19 Phase 2 Step 3, Post-Apply V2 plus ACL-Diagnostik via `aclexplode(c.relacl)` |
| **Beschreibung** | `anon` und `authenticated` besitzen ein direktes `UPDATE`-Privileg auf den Sequenzen `public.account_report_mapping_id_seq` und `public.report_lines_id_seq`. Pre-existing — durch `0054` weder verursacht noch behoben. Quelle der Eintraege noch zu klaeren; vermutlich aus frueheren Default-Privileges. |
| **Risiko** | DB-seitig waere `setval()` fuer diese Rollen erlaubt; konkrete Ausnutzbarkeit haengt vom verfuegbaren SQL/RPC-Ausfuehrungspfad ab. Das Privileg ist dennoch least-privilege-widrig und als DoS-Risiko zu behandeln. Zwei theoretische Angriffspfade bei vorhandener Ausfuehrungsmoeglichkeit: (a) Counter-Reset (`setval(seq, 1)`), wodurch nachfolgende INSERTs mit `duplicate key violation` fehlschlagen koennten; (b) Counter-Sprung in die Naehe des `bigint`-Maximums mit nachfolgender ID-Space-Erschoepfung. |
| **Compliance-Bezug** | GoBD Rz. 58/59/64 (Unveraenderbarkeit der Buchungs-Reihenfolge) und Art. 32 DSGVO (Sicherheit der Verarbeitung) potenziell betroffen, sobald Reporting-Daten aus `report_lines` hervorgehen. |
| **Geplante Migration** | `0055_revoke_anon_authenticated_sequence_update.sql` — REVOKE `UPDATE ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated`. Idempotenz wie ueblich. |
| **Earliest Charge** | nach Drift-Schliessung `0054` (Merge des `0054`-PRs), als separater PR. Nicht in `0054` integrierbar (Atomaritaets-Beschluss aus HANDOFF_BATCH_19 §1). |
| **Out-of-Scope fuer 0055** | `service_role` (intendiert `ALL` per `0054`); `USAGE` fuer `authenticated` (intendiert per `0054`); `setval()` aus Application-Layer (separates Thema, falls dort genutzt — laut aktueller Recherche nicht vorgesehen). |

### 26.2 — Lehre 57 (registriert)

> **HANDOFF-Verweise auf externe Dokument-Sektionen sind Hypothesen, keine
> Fakten — vor Verwendung als Source-of-Truth zwingend zu verifizieren.**
>
> Wenn ein HANDOFF-Eintrag den Wortlaut "siehe Sektion X von Doku Y" als
> Mapping-Quelle fuer eine sicherheitsrelevante Migration nennt, ist die
> tatsaechliche Existenz des Mappings in dieser Sektion vor jedem
> Migrations-Schritt zu pruefen. Liegt das versprochene Mapping dort nicht
> vor, ist die Source-of-Truth aus den primaeren Master-Quellen
> (HANDOFF_BATCH_*, DB-Inventar) neu aufzubauen, nicht stillschweigend
> aus dem DB-Zustand zu erraten.
>
> Verstaerkt Schreibanweisung Nr. 39 ("HANDOFF-Status-Behauptungen sind
> Hypothesen, keine Fakten") aus HANDOFF_BATCH_19 §1.
>
> Praktischer Beleg: Charge 19 Phase 2 Step 3 — HANDOFF §3.1 verwies auf
> Sektion 16 dieser Doku als Quelle des Gruppe A–E Mappings; Sektion 16
> enthielt jedoch nur Plan-Text ohne Tabellen-Mapping. Das Mapping wurde
> nach HANDOFF_BATCH_19 §8.4 plus Pre-Check Phase 6/N (`pg_policies`)
> rekonstruiert.

### 26.3 — Lehre 58 (registriert)

> **Pre-Check fuer Sequenz-Privilegien benoetigt zwei Datenquellen.**
>
> `information_schema.role_usage_grants` deckt nur das SQL-Standard-Privileg
> `USAGE` ab. Die PostgreSQL-spezifischen Sequenz-Privilegien `SELECT` und
> `UPDATE` werden dort nicht aufgefuehrt. Eine Pre-Check-Abfrage, die nur
> `role_usage_grants` konsultiert, kann pre-existing `SELECT`- und
> `UPDATE`-Eintraege fuer beliebige Rollen uebersehen.
>
> Vollstaendige Inspektion erfordert:
>
> - `information_schema.role_usage_grants` fuer `USAGE`.
> - `pg_class.relacl` via `aclexplode()` fuer `SELECT` und `UPDATE`,
>   einschliesslich Aufloesung von OID 0 als `PUBLIC` und OIDs >0 via
>   `pg_roles.rolname`.
>
> Verstaerkt Lehre 53 (Pre-existing-Grants vor jeder GRANT-Migration
> pruefen) durch Erweiterung des Quellbereichs um die ACL-Direktinspektion.
>
> Praktischer Beleg: Charge 19 Phase 2 Step 3 — Pre-Check Phase 3/N gab
> 0 Zeilen zurueck und liess den Eindruck eines sauberen Sequenz-Zustands
> entstehen; ACL-Diagnostik nach Apply zeigte pre-existing
> `UPDATE`-Eintraege fuer `anon` und `authenticated` (siehe Schuld
> 19-zayin in §26.1).

---

**Ende Folge-Update — Charge 19 Phase 2 Step 3 (0054).**

*Verfasser: Abdullah.*
*Status der Datenbank: alle Sicherheits-Migrations bis `0054` einschliesslich
angewendet. `authenticated` und `service_role` operativ wiederhergestellt
nach Least-Privilege-Mapping. Tracker-Drift dokumentiert (siehe §24).*
*Status des Repos: Branch `fix/charge-19-phase-2-0054`, abgeleitet von
`main` @ `12e35c0`. Migration-Datei und Doku-Sektionen 23–26 lokal
vorhanden, noch nicht committed.*
*Naechste Schritte: Append der Sektionen 23–26 plus dieses Footer-Updates
in `docs/harouda-migrations-update-2026-05-02.md`, numerische Verifikation
der gesamten Datei (Lehre 48), atomarer Commit + Push + PR auf Branch
`fix/charge-19-phase-2-0054`. Anschliessend Charge 20
(Compliance-Verifikation replay, Schuld 10-aleph) und in eigener Charge
Migration `0055` zur Schliessung der Schuld 19-zayin.*
