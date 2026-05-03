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
