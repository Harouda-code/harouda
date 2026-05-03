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

## §27 — Charge 19 Phase 2 Step 4: Migration 0055 (Schuld 19-zayin geschlossen)

### §27.1 Identifikation

| Item | Wert |
|------|------|
| Charge | 19 |
| Phase | 2 |
| Step | 4 (letzter Step von Phase 2) |
| Migration | `supabase/migrations/0055_revoke_anon_authenticated_sequence_update.sql` |
| Vorgänger-Migration | `0054_grant_authenticated_public_tables.sql` |
| Geschlossene Schuld | 19-zayin (`anon`/`authenticated` UPDATE auf public-Sequenzen) |
| Apply-Datum | 2026-05-03 |
| Apply-Methode | Supabase Studio SQL Editor, manuell, einmalig |
| Apply-Ergebnis | `Success. No rows returned.` (keine Warnung, keine Fehler) |
| Branch | `fix/charge-19-phase-2-0055` |
| HANDOFF-Referenz | HANDOFF nach Charge 19 Phase 2 Step 3, §3.2 / §4 / §5 |

### §27.2 Pre-Check via `pg_class.relacl + aclexplode()` (Lehre 53 + Lehre 58)

Vor dem Schreiben von 0055 wurde die ACL-Diagnostik primär ausgeführt. `information_schema.role_usage_grants` allein genügt nicht (Lehre 58, registriert in §26.3).

**Bestätigt vor Apply:**

- `anon` hat `UPDATE` auf:
  - `public.account_report_mapping_id_seq`
  - `public.report_lines_id_seq`
- `authenticated` hat `UPDATE` auf beide Sequenzen.
- `authenticated` hat `USAGE` auf beide Sequenzen (intendiert per 0054, nicht zu entfernen).
- `service_role` hat `SELECT`, `UPDATE`, `USAGE` auf beide Sequenzen (intendiert per 0054, nicht zu entfernen).
- `postgres` hat `SELECT`, `UPDATE`, `USAGE` auf beide Sequenzen (Plattform-Default).
- `is_grantable = false` für jede Zeile.
- Keine unerwarteten Grantees, keine unerwarteten public-Sequenzen.

Pre-Check-Ergebnis stimmt mit HANDOFF §4.2 überein — architektonisch freigegeben.

### §27.3 Scope

**In-Scope (genau eine aktive SQL-Anweisung):**

```sql
revoke update on all sequences in schema public from anon, authenticated;
```

**Out-of-Scope (explizit nicht berührt):**

- `USAGE` für `authenticated` auf Sequenzen (bleibt, intendiert per 0054).
- `ALL` für `service_role` auf Sequenzen (bleibt, intendiert per 0054).
- Tabellen-GRANTs jeglicher Art.
- RLS-Policy-Änderungen.
- Helper-Function-`EXECUTE`-Hardening (Schuld 19-gimel, separate Charge).
- `ALTER DEFAULT PRIVILEGES`-Cleanup (Schuld 19-he, separate Charge).
- Storage-Schema-/Bucket-Privilegien.
- Triggers.

### §27.4 Datei-Verifikation (numerisch, Lehre 48)

| Eigenschaft | Wert |
|-------------|------|
| Pfad | `supabase/migrations/0055_revoke_anon_authenticated_sequence_update.sql` |
| SHA256 | `2e54516b99df9c67f73b357d38ca621de8aec9fa2044b098eee8470c423abad8` |
| Bytes | 4146 |
| Zeilen | 81 (LF-Count = 81, Datei endet mit LF) |
| Encoding | reines ASCII (keine Umlaute, kein BOM) |
| Line-Endings | LF (CR-Count = 0) |
| Aktive `REVOKE`-Statements | 1 (Zeile 47) |
| Aktive `GRANT`-Statements | 0 |
| Aktive `ALTER`-Statements | 0 |
| Aktive `CREATE`-Statements | 0 |
| Aktive `DROP`-Statements | 0 |
| Cross-Verifikation | SHA256 in Sandbox = SHA256 auf lokaler Disk (`Get-FileHash`) |

### §27.5 Apply (Supabase Studio, manuell)

**Vorgehen:**

1. Datei-Inhalt aus lokaler Disk in die Zwischenablage geladen (`Get-Content -Raw -Path … | Set-Clipboard`).
2. SQL Editor in Supabase Dashboard geöffnet, neuer leerer Query-Tab.
3. Visueller Pre-Run-Check vor dem Klick auf Run:
   - Erste Zeile = `-- migration: 0055_revoke_anon_authenticated_sequence_update.sql`
   - Aktive Zeile = `revoke update on all sequences in schema public from anon, authenticated;` (ohne sichtbare Verfälschung)
   - Letzte Zeile = `-- ende migration 0055`
4. Run einmalig ausgelöst.

**Ergebnis:**

- Statusmeldung: `Success. No rows returned.`
- Mehrfach-Run vermieden (Lehre 54).
- Keine Warnungen, keine Fehlermeldungen.
- Idempotenz-Garantie: REVOKE auf nicht-existierende Privilegien wäre no-op, hier aber waren UPDATE-Privilegien aktiv und wurden tatsächlich entfernt.

### §27.6 Post-Apply Verifikation V1–V4

Combined query mit `has_sequence_privilege()` — eine Zeile, zwölf Spalten:

| Check | Spalte | Ergebnis | Erwartet |
|-------|--------|----------|----------|
| V1 | `v1_auth_arm_usage` | `true` | `true` |
| V1 | `v1_auth_rl_usage` | `true` | `true` |
| V2 | `v2_auth_arm_update` | `false` | `false` |
| V2 | `v2_auth_rl_update` | `false` | `false` |
| V3 | `v3_anon_arm_update` | `false` | `false` |
| V3 | `v3_anon_rl_update` | `false` | `false` |
| V4 | `v4_sr_arm_usage` | `true` | `true` |
| V4 | `v4_sr_arm_select` | `true` | `true` |
| V4 | `v4_sr_arm_update` | `true` | `true` |
| V4 | `v4_sr_rl_usage` | `true` | `true` |
| V4 | `v4_sr_rl_select` | `true` | `true` |
| V4 | `v4_sr_rl_update` | `true` | `true` |

**Bilanz: 12/12 bestanden.** Keine Abweichung, kein STOP-Trigger ausgelöst.

### §27.7 V5 (ACL-Cross-Check via `aclexplode`) — übersprungen

V5 war im ursprünglichen Migration-Entwurf als optionaler Verifikations-Kommentar enthalten und wurde in Option B entfernt. Nach erfolgreichen V1–V4 wurde architektonisch entschieden, V5 für diese Charge zu überspringen.

**Begründung:**

- Lehre 58 fordert zwei Datenquellen primär *vor* einem Eingriff (Pre-Check). Für 0055 wurde dies in §27.2 mit `pg_class.relacl + aclexplode()` erfüllt.
- `has_sequence_privilege()` in V1–V4 ist für boolesche Privileg-Existenzfragen ausreichend. Lehre 58 zielt auf die Entdeckung *unerwarteter* Privilegien — nicht auf die Verifikation einer gezielten Entzugs-Operation, deren erwartete Wirkung präzise definiert ist.
- V5 bleibt als optionale Compliance-Replay-Komponente verfügbar und ist in Charge 20 (Schuld 10-aleph) ohnehin Teil des umfassenden ACL-Re-Check über das gesamte Schema.

### §27.8 Operative Lage nach 0055

| Rolle | Privilegien auf public-Sequenzen | Quelle |
|-------|----------------------------------|--------|
| `anon` | (keine) | 0055 (UPDATE entzogen; keine Sequenz-Privilegien verbleibend) |
| `authenticated` | `USAGE` | 0054 (`USAGE`-GRANT), 0055 (`UPDATE`-REVOKE) |
| `service_role` | `SELECT`, `UPDATE`, `USAGE` | 0054 (unverändert durch 0055) |
| `postgres` | `SELECT`, `UPDATE`, `USAGE` | Plattform (unverändert) |

### §27.9 Repo-Zustand vor Tracker-Append

| Item | Wert |
|------|------|
| Branch | `fix/charge-19-phase-2-0055` |
| Branch-Basis | `1a908e2` (= `origin/main` vor Branch-Erstellung) |
| Migration-Datei | `supabase/migrations/0055_revoke_anon_authenticated_sequence_update.sql` — untracked |
| Existierende lokale Append-Payloads | `docs/append-charge19-phase2-005{2,3,4}.md` — untracked, unberührt |
| Diese neue Append-Payload | `docs/append-charge19-phase2-0055.md` — lokales Artefakt, untracked, nicht zu committen |
| Modifizierte tracked Dateien | keine |
| Staged Dateien | keine |
| Tracker-Doku | `docs/harouda-migrations-update-2026-05-02.md` — bisher unverändert (Append folgt nach dieser Payload-Erstellung) |

### §27.10 Lehren-Bestätigung durch Charge 19 Phase 2 Step 4

| # | Lehre | Bestätigt durch 0055 |
|---|-------|----------------------|
| 45 | Verifikation > Bestätigen | V1–V4 als experimentelle DB-Bestätigung, nicht logische Ableitung |
| 47 | DB-Realität kann Spec-Annahmen widersprechen | Pre-existing UPDATE für `anon`/`authenticated` war in keiner Schema-Spec dokumentiert |
| 48 | Werte numerisch verifizieren, nicht visuell | SHA256 + Byte/Line-Count vor und nach Datei-Transfer Sandbox→Disk |
| 50 | Branch-first vor jedem Commit | `fix/charge-19-phase-2-0055` vor jeder Datei-Operation erstellt |
| 53 | Pre-existing-Grants vor jeder GRANT/REVOKE-Migration prüfen | §27.2 Pre-Check |
| 54 | Ein sensibler Schritt pro Antwort | strikt eingehalten über die Einzelschritte dieser 0055-Session (Pre-Check, Git-Setup, Draft-Reduktion, Datei-Erstellung, Apply, V1–V4, Tracker-Payload-Draft) |
| 55 | VS Code für Tracker-Append, nicht PowerShell `Add-Content` | für anstehende Append-Operation auf §27 anzuwenden |
| 56 | CRLF-Conversion erwartbar bei Notepad-Append | trifft auf .md-Tracker-Doku zu (akzeptabel); nicht auf SQL-Migration (LF wurde erzwungen, SHA256-verifiziert) |
| 58 | Sequenz-Privilegien-Inspektion: zwei Datenquellen | `pg_class.relacl + aclexplode()` als Pre-Check primär eingesetzt (§27.2) |

### §27.11 Schulden-Statusupdate

| Schuld | Beschreibung | Status nach 0055 |
|--------|--------------|-------------------|
| **19-zayin** | `anon`/`authenticated` UPDATE auf public-Sequenzen | **geschlossen DB-seitig** durch 0055 (Apply + V1–V4 12/12) |
| ~~19-dalet~~ | ~~`anon` TRUNCATE/TRIGGER/REFERENCES~~ | geschlossen durch 0052 |
| ~~19-vav~~ | ~~`authenticated` TRUNCATE/TRIGGER/REFERENCES~~ | geschlossen durch 0053 |
| ~~18-bet~~ | ~~GRANT-Repair `authenticated` + `service_role`~~ | geschlossen durch 0054 |
| 19-aleph | `protect_update`-Whitelist erweitern | offen, spätere Charge |
| 19-bet | `localStorage`-Settings → DB-Side | offen, spätere Charge |
| 19-gimel | Helper-Function-EXECUTE-Hardening | offen, spätere Charge |
| 19-he | `ALTER DEFAULT PRIVILEGES`-Cleanup | offen, spätere Charge |
| 18-aleph | BEFORE-DELETE-Trigger für `belege`/`beleg_positionen` | offen, Charge 21 |
| 10-aleph | Compliance-Verifikation Replay | offen, Charge 20 (empfohlen als nächste Charge) |

### §27.12 Charge 19 Phase 2 — Abschluss

Mit erfolgreichem Apply von 0055 ist Charge 19 Phase 2 vollständig abgeschlossen. Vier Steps, vier geschlossene Schulden, alle V-Checks bestanden:

| Step | Migration | Schuld | V-Checks | Status |
|------|-----------|--------|----------|--------|
| Step 1 | `0052_revoke_anon_dangerous_grants.sql` | 19-dalet | bestanden | geschlossen |
| Step 2 | `0053_revoke_authenticated_dangerous_grants.sql` | 19-vav | bestanden | geschlossen |
| Step 3 | `0054_grant_authenticated_public_tables.sql` | 18-bet | bestanden + V2-Befund (19-zayin entdeckt) | geschlossen |
| Step 4 | `0055_revoke_anon_authenticated_sequence_update.sql` | 19-zayin | 12/12 bestanden | geschlossen |

**Test-Baseline:** Referenz-Test-Baseline bleibt: 204 Files / 2036 passed / 1 todo. Für 0055 wurde keine neue Testausführung benötigt oder dokumentiert, da die Migration ausschließlich DB-ACL betrifft und keinen Code-Pfad ändert.

**Nächster architektonischer Entscheidungspunkt:** Charge 20 (Compliance-Verifikation Replay, Schuld 10-aleph) oder Charge 21 (BEFORE-DELETE-Trigger, Schuld 18-aleph). HANDOFF §8 empfiehlt Charge 20 als nächste Charge, da 19-zayin nun geschlossen ist und Compliance-Replay ohne diesen Befund sauberer ausgeführt werden kann.

---

**Ende §27 — Charge 19 Phase 2 Step 4 dokumentiert.**

*Quelle: Apply 2026-05-03, V1–V4 12/12 bestanden, SHA256 `2e54516b…3abad8` cross-verifiziert.*

*Naechste Schritte: Append der Sektionen 23–26 plus dieses Footer-Updates
in `docs/harouda-migrations-update-2026-05-02.md`, numerische Verifikation
der gesamten Datei (Lehre 48), atomarer Commit + Push + PR auf Branch
`fix/charge-19-phase-2-0054`. Anschliessend Charge 20
(Compliance-Verifikation replay, Schuld 10-aleph) und in eigener Charge
Migration `0055` zur Schliessung der Schuld 19-zayin.*


## §28 — Charge 20: Compliance-Verifikation Replay (Schuld 10-aleph) — 11.C Diagnostic Outcome

**Status:** ABGESCHLOSSEN als 11.C Diagnostic / verification suspended at V5 due to ACL drift before Setup.
**Datum:** Drafting 2026-05-03 · Diagnostic Execution 2026-05-03.
**Charge-Typ:** Compliance-Verifikation / Replay (keine Migration-Apply, keine Schema-Aenderung, keine GRANT-Aenderung). Outcome: Diagnostic Stop vor Setup.

### §28.1 Identifikation

- **Charge:** 20
- **Branch:** `verify/charge-20-compliance-replay`
- **Branch-Creation-HEAD:** `49af1aa` (`fix(db): revoke sequence update from anon authenticated (#51)`)
- **Pre-Execution-HEAD:** `49af1aa` (kein commit auf branch erfolgt; Charge endet als 11.C ohne DB-write)
- **Verification-Doc:** `docs/staging-rls-verifikation-2026-05-03.md` (untracked, lokal persistiert mit 11.C-Outcome; nicht staged/committed). Reviewed filesystem-rename via `Rename-Item` vom urspruenglichen draft-Filename auf den Final-Filename ist erfolgt.
- **Environment:** staging
- **Region:** Central EU (Frankfurt)
- **Tester:** Abdallah Harouda
- **Master-HANDOFF:** `HANDOFF_BATCH_19.md` §12 (Charge-20 binding).

### §28.2 Vorgeschichte / Binding

- **Charge 18 (Diagnostic):** Verifikations-Voraussetzungen nicht erfuellt (GRANT-Luecken) — Verifikation ausgesetzt, Schuld 10-aleph open.
- **Charge 19 Phase 1:** `journal_entries` inspection (PR #44).
- **Charge 19 Phase 2:** GRANT-Repair via Migrationen 0052 / 0053 / 0054 / 0055 (PRs #46–#51) — schloss strukturelle GRANT-Luecken aus Charge 18.
- **Charge 20:** wiederholt Schuld 10-aleph auf Basis der durch Charge 19 Phase 2 reparierten ACL-Baseline. **Outcome: 11.C** — V5 deckt einen neuen, in Charge 18/19 nicht sichtbaren Drift auf (MAINTAIN-Privileg, PG17).

### §28.3 Scope

**Geplanter Scope (in-scope):**
1. ACL Re-Check V1–V6 (read-only, pre-Setup).
2. Setup test data (transactional one-batch).
3. 12 RLS-Szenarien (HANDOFF_BATCH_12 §8 + Sc. 8b).
4. Cleanup (transactional one-batch).
5. Verification-Doc-Fertigstellung + reviewed filesystem-rename auf Final-Filename.
6. `journal_entries` documentation-only follow-up.

**Tatsaechlich ausgefuehrter Scope:**
- ACL V1–V5: ausgefuehrt (V5 mit STOP).
- V6, Setup, Pre-Existence-Check, RLS-Szenarien, Cleanup: **NICHT ausgefuehrt** wegen V5-Stop.
- Verification-Doc-Fertigstellung + filesystem-rename auf Final-Filename: erfolgt.

**Out-of-Scope (unveraendert):**
- Datenschutz-Sign-off (post-Charge-20).
- StB-Ruecksprache zu Loesch-Policies (post-Charge-20).
- BEFORE-DELETE-Trigger fuer `belege` / `beleg_positionen` (Charge 21).
- Schulden 19-aleph / 19-bet / 19-gimel / 19-he (spaetere Charges).
- Mirror-Tests fuer User B.

### §28.4 Drafting-Status

- Setup-SQL, Cleanup-SQL, 12 Scenario-SQLs, ACL V1–V6 SQL: **gedrafted und genehmigt** (Sessions 1–3, pre-execution).
- Verification-Doc-Skeleton: erstellt, strukturell reviewed (R-1 bis R-9), keine Blocker.
- Drafts bleiben als Replay-Asset fuer Charge 23 erhalten — keine Loeschung wegen 11.C-Outcome.

### §28.5 Verlauf

Phase A — Replay-Execution (gestoppt nach V5):

| Schritt | Aktion | Modus | Outcome |
|--------|--------|-------|---------|
| A.1 | ACL V1 (authenticated table grants, information_schema) | read-only | PASS — 42 rows (Gruppen A–E + health_check) |
| A.2 | ACL V2 (authenticated sequence privileges) | read-only | PASS — usage=true, select=false, update=false (post-0055 verified) |
| A.3 | ACL V3 (service_role table grants, information_schema) | read-only | PASS — 42 rows × 7 privs |
| A.4 | ACL V4 (service_role sequence privileges) | read-only | PASS — alle drei privs true |
| A.5 | ACL V5 (pg_class.relacl + aclexplode, Lehre 58) | read-only | **STOP** — A1=0, A2=0, A3=0, A4=41, A5=0, A6=42 (drift in A4 + A6) |
| A.6 | Diagnostic-Probe (post-V5, read-only) | read-only | MAINTAIN-Privileg auf 41 public application tables fuer anon, authenticated, postgres, service_role; `health_check` einzige Ausnahme |
| A.7 | V6, Pre-Existence, Setup, Setup-Verif, 12 Szenarien, Cleanup, Cleanup-Verif | — | **NICHT AUSGEFUEHRT** — Replay-Execution gestoppt nach V5 |

Phase B — Dokumentations-/Repo-Abschluss nach Diagnostic Outcome (NICHT Fortsetzung der Replay-Execution):

| Schritt | Aktion | Modus | Hinweis |
|--------|--------|-------|---------|
| B.1 | Verification-Doc auf 11.C umstellen (Section 6, 9, 11, 12, 13, Appendix A/B) | file-write | erfolgt; lokal persistiert; nicht staged/committed |
| B.2 | Reviewed filesystem-rename via `Rename-Item` auf `staging-rls-verifikation-2026-05-03.md`. Kein `git mv`, weil das File untracked ist; File bleibt nach rename untracked unter dem neuen Namen. | filesystem-rename | erfolgt |
| B.3 | Tracker-§28-Append (Lehre 55, atomic PowerShell-script). Tracker (`docs/harouda-migrations-update-2026-05-02.md`) ist tracked und erscheint nach diesem Schritt als `M ` in `git status`. | repo-write | dieser Eintrag |
| B.4 | Selective `git add` (NICHT `git add -A`): umbenanntes Verification-Doc unter Final-Filename + modifizierter Tracker. Charge-19 Append-Payloads bleiben unstaged. → `git commit` → `git push` (`--no-verify` falls Husky pre-push OOM, wie in Charge 19) | repo-write | nach Tracker-Append |
| B.5 | PR erstellen, CI gruen, squash-merge | GitHub | finaler Schritt |

**Hinweis:** Phase B ist Dokumentations-/Repo-Abschluss eines Diagnostic Outcomes, **keine** Fortsetzung der Replay-Execution. Setup, RLS-Szenarien und Cleanup wurden bewusst nicht ausgefuehrt. V5-Stop ist ein praeventives Gate, das DB-state-Pollution und Charge-18-Wiederholung verhindert hat. Der eigentliche Replay (urspruenglich geplante Schritte nach V5/V6) erfolgt erst in Charge 23 nach Charge-22-Korrektur.

### §28.6 Findings (Diagnostic Outcome)

- **F1 (V5-A4):** 41 service_role-table-rows zeigen `actual_privs = 8` statt expected `7`. Differenz: zusaetzliches Privileg `MAINTAIN`.
- **F2 (V5-A6):** 42 authenticated-table-rows zeigen Gruppen-Mapping-Drift; Ursache: unerwartetes `MAINTAIN` in actual_privs gegenueber Gruppen-Definition (A 4 privs, B 3, C 3, D 2, E 1, health_check 1).
- **F3 (Diagnostic-Probe):** `MAINTAIN` ist explizit in `pg_class.relacl` fuer 4 Rollen × 41 public application tables (anon, authenticated, postgres, service_role). 164 MAINTAIN-grants gesamt. `health_check` als einzige public application table ohne MAINTAIN.
- **F4 (Source-of-data):** `information_schema.table_privileges` (V1/V3) listet `MAINTAIN` nicht — V1/V3 erschienen als PASS. `pg_class.relacl + aclexplode()` (V5) deckt MAINTAIN auf. **Lehre 58 in Charge 20 empirisch validiert.**

Detail-Output: siehe Verification-Doc Section 11 + Appendix A.

### §28.7 Klassifikation

- **Outcome:** 11.C — Diagnostic / verification suspended at V5 due to ACL drift before Setup.
- **11.B (Replay erfolgreich):** NOT REACHED.
- **11.D (Prerequisite-Failure anderen Typs):** not used; 11.C deckt diesen Fall ab.

### §28.8 Repo-Zustand

**Aktueller Zustand (vor Tracker-Append B.3):**

```
?? docs/append-charge19-phase2-0052.md
?? docs/append-charge19-phase2-0053.md
?? docs/append-charge19-phase2-0054.md
?? docs/append-charge19-phase2-0055.md
?? docs/staging-rls-verifikation-2026-05-03.md
```

5 untracked Eintraege. Kein `M ` (modified-tracked). Keine staged Eintraege. Verification-Doc ist lokal persistiert mit 11.C-Inhalt unter dem Final-Filename, aber als untracked file — nicht staged/committed.

**Erwarteter Zustand nach Tracker-Append (B.3), vor `git add` (B.4):**

```
?? docs/append-charge19-phase2-0052.md
?? docs/append-charge19-phase2-0053.md
?? docs/append-charge19-phase2-0054.md
?? docs/append-charge19-phase2-0055.md
?? docs/staging-rls-verifikation-2026-05-03.md
 M docs/harouda-migrations-update-2026-05-02.md
```

Hinweise:
- Verification-Doc bleibt unter `staging-rls-verifikation-2026-05-03.md` untracked, bis es durch selective `git add` in B.4 staged wird.
- Der Tracker (`docs/harouda-migrations-update-2026-05-02.md`) ist tracked und erscheint nach Tracker-Append als `M ` (modified-tracked).
- Keine staged Eintraege bis zum expliziten `git add` in B.4.

**Nicht im Repo (bewusst):**
- HANDOFF (`HANDOFF_charge20_current_state.md`) liegt ausserhalb des Repos und wird nicht versioniert.
- Charge-19 Append-Payloads (`docs/append-charge19-phase2-005{2,3,4,5}.md`) bleiben untracked — nicht beruehren, nicht committen.

### §28.9 Lehren-Bezug

| Lehre / Falle | Anwendung in Charge 20 |
|---------------|------------------------|
| Lehre 47 | DB-Realitaet via Probes verifiziert (Schemas, RLS-Policies, Triggers — bereits in Drafting-Phase). |
| Lehre 48 | Numerische Verifikation (V5-A1..A6 als integer drift-counts), nicht visuell. |
| Lehre 50 | Branch-first: `verify/charge-20-compliance-replay` vor jedem write erstellt. |
| Lehre 52 | Sequenz-USAGE-GRANTs separat (V2/V4 PASS bestaetigt). |
| Lehre 54 | Ein sensitive op pro Response/Step waehrend drafting + execution. |
| Lehre 55 | Tracker-Append via atomic PowerShell-script. |
| **Lehre 58** | **Empirisch validiert in Charge 20**: aclexplode hat MAINTAIN-Drift aufgedeckt, den information_schema nicht zeigte. V5-Pattern verbindlich fuer alle kuenftigen ACL-Verifikationen. |
| Falle 3.2 #12 | Pfade via Tab-completion, nie copy-paste. |
| Falle 3.2 #13 | PowerShell-code manuell tippen, nie copy-paste. |

**Neue Lessons aus Charge 20** (Detail in Verification-Doc Section 12):
- C20-1: Lehre 58 nicht nur theoretisch — MAINTAIN-Privileg (PG17) ist konkretes Drift-Beispiel.
- C20-2: V5-Gate-Wirksamkeit — Pre-Setup-ACL-Re-Check verhinderte Charge-18-Wiederholung.
- C20-3: PG-Version-Awareness — `GRANT ALL` expandiert in PG17 inkl. MAINTAIN; Konvention: explizite Privilege-Listen statt `GRANT ALL`.

### §28.10 Schulden-Statusupdate

| Schuld | Status nach Charge 20 | Begruendung |
|--------|------------------------|-------------|
| **10-aleph** | **OPEN / PENDING** (unchanged) | Verifikation in Charge 20 nicht abgeschlossen wegen V5-Stop. Erwartete closure: nach Charge 22 (corrective) und Charge 23 (replay). |
| **18-aleph** | OPEN — defense-in-depth gap (reframed) | Reframing-Annahme aus Drafting-Phase **empirisch unverifiziert in Charge 20** (Sc. 8b nicht ausgefuehrt). Empirische Bestaetigung erfolgt in Charge 23. Charge 21 ergaenzt BEFORE-DELETE-Trigger. |
| **18-bet** | CLOSED (durch Charge 19 Phase 2, GRANT-Repair via 0054) | Unveraendert. |
| **19-zayin** | CLOSED (durch 0055; siehe §27.11) | Unveraendert. V2/V4 PASS bestaetigen 0055-Wirksamkeit empirisch. |
| **20-aleph (NEU)** | **OPEN** | Titel: "MAINTAIN privilege drift on 41 public application tables for anon/authenticated/postgres/service_role." Evidence: V5-A4, V5-A6, Diagnostic-Probe (siehe Verification-Doc Section 11 + Appendix A). Korrektur-Scope: PENDING CLARIFICATION in Charge 22. Risk-Profile (preliminary): anon=HIGH, authenticated=MEDIUM-HIGH, postgres=NONE, service_role=LOW. |
| 19-aleph / 19-bet / 19-gimel / 19-he | OPEN — spaetere Charges | Nicht im Charge-20-Scope. |

### §28.11 Folge-Charges

| Charge | Zweck | Reihenfolge-Abhaengigkeit |
|--------|-------|---------------------------|
| **Charge 21** | BEFORE-DELETE-Trigger fuer `belege` / `beleg_positionen` (Schuld 18-aleph defense-in-depth-Closure) | unabhaengig — kann parallel zu 22/23 oder davor/danach laufen |
| **Charge 22 (corrective)** | REVOKE MAINTAIN auf public application tables (Schuld 20-aleph). **Korrektur-Scope (anon/authenticated narrow vs. full inkl. postgres/service_role): pending clarification im Charge-22-Drafting.** Pre-Migration: erneute V5-A4/A6-Probe als Pre-Check (Lehre 53/55-Pattern). | folgt Charge 20 |
| **Charge 23 (replay)** | Wiederholter Replay von Schuld 10-aleph. Verwendet die in Charge 20 gedrafteten Setup/Cleanup/12-Szenarien-SQLs unveraendert + V6. Erwartetes Outcome: 11.B, sofern Charge 22 erfolgreich. | folgt Charge 22 |

### §28.12 Cross-References

- **Verification-Doc:** `docs/staging-rls-verifikation-2026-05-03.md` (untracked, lokal persistiert mit 11.C-Outcome).
- **Master-HANDOFF:** `HANDOFF_BATCH_19.md` §12.
- **Vorgaenger-Tracker-Eintraege:** §27 (Charge 19 Phase 2, inkl. §27.11 zu Schuld 19-zayin / 0055), §26 (Charge 19 Phase 1) — finale §-Nummerierung beim Append-Tag verifizieren.
- **Charge-19-Migrations:** `supabase/migrations/0052_revoke_anon_dangerous_grants.sql`, `0053_revoke_authenticated_dangerous_grants.sql`, `0054_grant_authenticated_public_tables.sql`, `0055_revoke_anon_authenticated_sequence_update.sql`.
- **Folge-Charges:** Charge 21 (BEFORE-DELETE), Charge 22 (corrective MAINTAIN-REVOKE), Charge 23 (replay 10-aleph).
- **External reference:** PostgreSQL 17 release notes / `GRANT` documentation — `MAINTAIN` privilege scope (VACUUM, ANALYZE, CLUSTER, REFRESH MATERIALIZED VIEW, REINDEX, LOCK TABLE).

