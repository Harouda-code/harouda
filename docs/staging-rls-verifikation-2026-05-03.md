# Charge 20 — Compliance-Verifikation Replay (Schuld 10-aleph) — Diagnostic Outcome 11.C

**Status der Dokumentation:** Diagnostic Outcome (11.C). Ausfuehrung hat ACL
Re-Check V5 erreicht und dort gestoppt; Setup, RLS-Szenarien und Cleanup
wurden NICHT ausgefuehrt. Setup/Cleanup/Scenario-SQL bleibt als Replay-Asset
im Dokument erhalten.

**Datum (Ausfuehrung):** 2026-05-03
**Zeit (Beginn):** ACL Re-Check V1-V5 ausgefuehrt; STOP bei V5.
**Tester:** Abdallah Harouda
**Vorgaenger:** docs/staging-rls-verifikation-2026-05-02.md (Charge 18 — Diagnostic Outcome).
**Charge-Branch:** verify/charge-20-compliance-replay
**Branch-Creation-HEAD:** 49af1aa
**Pre-Execution-HEAD:** 49af1aa
**Migration-Baseline:** Migrationen 0001-0055 angewendet (incl. 0052/0053/0054/0055).
**Environment:** staging
**Region:** Central EU (Frankfurt)

---

## 1 — Zusammenfassung

Charge 20 ist als **Diagnostic Outcome 11.C** abgeschlossen. ACL Re-Check V5
(`pg_class.relacl` + `aclexplode()` cross-check, Lehre 58) hat vor Setup eine
strukturelle Privilege-Drift aufgedeckt: das PostgreSQL-17-Privileg `MAINTAIN`
ist auf 41 von 42 oeffentlichen Anwendungstabellen explizit fuer die vier
Rollen `anon`, `authenticated`, `postgres` und `service_role` gesetzt
(`health_check` ist die einzige Ausnahme). `information_schema.role_table_grants`
hat dieses Privileg nicht angezeigt; nur die raw-`pg_class.relacl`-Cross-Check
hat es sichtbar gemacht. Die Drift ist sicherheitsrelevant fuer `anon` und
`authenticated`. Charge 20 wurde sofort gestoppt; weder Setup, RLS-Szenarien,
Cleanup noch korrektive Migrationen wurden ausgefuehrt. Schuld 10-aleph
(DB-seitige Verifikation der Test-Matrix) bleibt OFFEN/PENDING — die Replay-
Verifikation erfolgt in einer spaeteren Charge nach Korrektur der Drift.

**Klassifikation:** 11.C — Diagnostic / Verifikation gescheitert vor Setup
durch ACL-Drift (siehe Sektion 11).
**Schuld 10-aleph Status (DB-seitig):** OFFEN / PENDING.
**Test-Baseline gehalten:** NICHT ANWENDBAR — keine Tests ausgefuehrt, keine
Test-Daten geschrieben, kein Cleanup notwendig.
**Neue Schuld:** **20-aleph (NEU, OFFEN)** — MAINTAIN-Privileg-Drift auf 41
oeffentlichen Anwendungstabellen fuer vier Rollen; Korrektur-Scope pending in
Charge 22.

---

## 2 — Voraussetzungen + Methodik

### 2.1 — Vorgeschichte

Charge 18 (`docs/staging-rls-verifikation-2026-05-02.md`) wurde als
Diagnostic Outcome abgeschlossen — die Verifikation der Test-Matrix war
nicht moeglich, weil zwei strukturelle Compliance-Luecken aufgedeckt
wurden:

- **Schuld 18-bet** (GRANT-Repair): authenticated/service_role hatten keine
  funktionalen CRUD-grants. Geschlossen durch Charge 19 Phase 2 (0052,
  0053, 0054, 0055).
- **Schuld 18-aleph** (BEFORE-DELETE-Trigger): kein DB-Mechanismus blockiert
  DELETE auf GEBUCHT-belege. Bleibt offen — siehe Sektion 5.8b fuer das
  Charge-20-Reframing.

Charge 20 ist die Wiederholung der ausgesetzten Verifikation (Schuld
10-aleph) nach Charge-19-Phase-2-Abschluss.

### 2.2 — Scope

**In-Scope:**
- ACL Re-Check schema-weit (V1-V6) — post-0055-state-Bestaetigung.
- 12-Szenarien-Replay aus HANDOFF_BATCH_12 §8 (inklusive 8b).
- Charge 19 Phase 1 `journal_entries` documentation-only follow-up.

**Out-of-Scope:**
- Datenschutz-Sign-off (separater Prozess, nach Charge 20).
- StB-Ruecksprache zu Loesch-Policies (separater Prozess).
- BEFORE-DELETE-Trigger-Migration (Charge 21).
- Schulden 19-aleph / 19-bet / 19-gimel / 19-he (spaetere Charges).
- Mirror-Tests fuer User B (HANDOFF_BATCH_12 §8 fordert dies nicht).

### 2.3 — Methodik

| Phase                | Verfahren                                            | Tool / Role                       |
|----------------------|------------------------------------------------------|-----------------------------------|
| ACL Re-Check         | 6 read-only Verifikations-Queries (V1-V6)            | Supabase Studio, postgres-Owner   |
| Setup                | 1 transactional Batch (BEGIN/COMMIT)                 | Supabase Studio, postgres-Owner   |
| Setup-Verifikation   | Soll-Werte read-your-own-writes + post-commit        | Supabase Studio                   |
| 12 Szenarien         | begin/rollback per Szenario, JWT-context simulation  | Supabase Studio, role-switch      |
| Cleanup              | 1 transactional Batch (BEGIN/COMMIT)                 | Supabase Studio, postgres-Owner   |
| Cleanup-Verifikation | Residual-Counter read-your-own-writes + post-commit  | Supabase Studio                   |

### 2.4 — Environment

**Project:** harouda
**Region:** Central EU (Frankfurt) — bestaetigt.
**Confirmed environment-class:** staging — bestaetigt.
**Confirmation-Datum:** 2026-05-03.

### 2.5 — Tatsaechliche Ausfuehrung (Charge 20)

| Phase                | Geplant      | Ausgefuehrt                                  |
|----------------------|--------------|----------------------------------------------|
| Pre-existence-Check  | ja           | **NICHT AUSGEFUEHRT** (V5-Stop vor Setup)    |
| ACL Re-Check V1-V4   | ja           | **AUSGEFUEHRT** — alle PASS                  |
| ACL Re-Check V5      | ja           | **AUSGEFUEHRT — STOP/FAIL** (Drift gefunden) |
| ACL Re-Check V6      | ja           | **NICHT AUSGEFUEHRT** (V5-Stop)              |
| Setup                | ja           | **NICHT AUSGEFUEHRT**                        |
| RLS-Szenarien 1-11   | ja           | **NICHT AUSGEFUEHRT**                        |
| Szenario 8b reframe  | ja           | **NICHT EMPIRISCH VERIFIZIERT**              |
| Cleanup              | ja           | **NICHT NOETIG** (Setup nie gelaufen)        |

**Kontext der Ausfuehrung:**
- Environment confirmed: **staging**, Region **Central EU (Frankfurt)**.
- Tester: **Abdallah Harouda**.
- Pre-Execution-HEAD: **49af1aa**.
- Es wurden **nur ACL V1 bis V5** ausgefuehrt.
- V6 sowie Setup, RLS-Szenarien und Cleanup wurden **nicht ausgefuehrt**, weil
  V5 das Charge-20-STOP-Kriterium ausgeloest hat.
- Der Pre-existence-Check fuer Test-IDs wurde **nicht ausgefuehrt**, weil V5
  bereits frueher gestoppt hat.
- Es wurden **keine Test-Daten** in der Datenbank geschrieben.
- Es wurden **keine REVOKE/ALTER**-Statements ausgefuehrt; korrektive Massnahmen
  liegen ausserhalb des Charge-20-Scopes (siehe Sektion 13, Charge 22).

---

## 3 — Test-Setup

> **NICHT AUSGEFUEHRT — Charge 20 stoppte bei ACL V5 vor Setup.**
>
> Die in dieser Sektion enthaltenen Test-IDs, das Setup-SQL, die Soll-Werte
> und die Verifikations-Tabellen werden als **Replay-Asset** fuer eine
> spaetere Charge (nach Korrektur der MAINTAIN-Drift, siehe Sektion 13)
> beibehalten. Es wurden keine Test-Daten in `auth.users`, `public.companies`,
> `public.company_members`, `public.belege` oder `public.beleg_positionen`
> geschrieben. Die Ist-Werte-Tabellen (3.4 / 3.5) bleiben leer-markiert.

### 3.1 — Test-IDs (deterministisch)

| Entitaet           | UUID                                          | Slug / Email                       |
|--------------------|-----------------------------------------------|------------------------------------|
| User A             | `00000000-0000-0000-0000-000000000a01`        | charge20+a@harouda.invalid         |
| User B             | `00000000-0000-0000-0000-000000000b01`        | charge20+b@harouda.invalid         |
| Company A          | `00000000-0000-0000-0000-00000000a100`        | charge20-company-a                 |
| Company B          | `00000000-0000-0000-0000-00000000b100`        | charge20-company-b                 |
| Beleg A1 (ENTWURF) | `00000000-0000-0000-0000-0000000a1001`        | CHARGE20-A1                        |
| Beleg A2 (GEBUCHT) | `00000000-0000-0000-0000-0000000a1002`        | CHARGE20-A2                        |
| Beleg B1 (ENTWURF) | `00000000-0000-0000-0000-0000000b1001`        | CHARGE20-B1                        |

### 3.2 — Setup-SQL

> **Note:** Folgendes SQL ist eine kompaktierte Fassung; das final-file wird
> beim Abschluss den vollstaendigen approved SQL-Block (mit allen Header-
> Kommentaren der Session 1 final draft) eingebettet enthalten.

```sql
-- charge 20 setup-skript (kompaktierte Fassung)

begin;

-- 1) auth.users — User A + User B
insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000a01',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'charge20+a@harouda.invalid',
   crypt('charge20test', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Charge 20 Test User A"}'::jsonb,
   now(), now()),
  ('00000000-0000-0000-0000-000000000b01',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'charge20+b@harouda.invalid',
   crypt('charge20test', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Charge 20 Test User B"}'::jsonb,
   now(), now());

-- 2) public.companies
insert into public.companies (id, name, slug)
values
  ('00000000-0000-0000-0000-00000000a100', 'Charge 20 Test Company A', 'charge20-company-a'),
  ('00000000-0000-0000-0000-00000000b100', 'Charge 20 Test Company B', 'charge20-company-b');

-- 3) public.company_members
insert into public.company_members (company_id, user_id, role)
values
  ('00000000-0000-0000-0000-00000000a100', '00000000-0000-0000-0000-000000000a01', 'owner'),
  ('00000000-0000-0000-0000-00000000b100', '00000000-0000-0000-0000-000000000b01', 'owner');

-- 4) public.belege
insert into public.belege (id, company_id, belegart, belegnummer, belegdatum, buchungsdatum, status)
values
  ('00000000-0000-0000-0000-0000000a1001',
   '00000000-0000-0000-0000-00000000a100',
   'SONSTIGES', 'CHARGE20-A1', date '2026-01-15', date '2026-01-15', 'ENTWURF'),
  ('00000000-0000-0000-0000-0000000a1002',
   '00000000-0000-0000-0000-00000000a100',
   'SONSTIGES', 'CHARGE20-A2', date '2026-01-16', date '2026-01-16', 'GEBUCHT'),
  ('00000000-0000-0000-0000-0000000b1001',
   '00000000-0000-0000-0000-00000000b100',
   'SONSTIGES', 'CHARGE20-B1', date '2026-01-17', date '2026-01-17', 'ENTWURF');

-- 5) public.beleg_positionen
insert into public.beleg_positionen (beleg_id, position, konto, soll_haben, betrag)
values
  ('00000000-0000-0000-0000-0000000a1001', 1, '4980', 'S', 100.00),
  ('00000000-0000-0000-0000-0000000a1001', 2, '1200', 'H', 100.00),
  ('00000000-0000-0000-0000-0000000a1002', 1, '4980', 'S', 200.00),
  ('00000000-0000-0000-0000-0000000a1002', 2, '1200', 'H', 200.00),
  ('00000000-0000-0000-0000-0000000b1001', 1, '4980', 'S', 300.00),
  ('00000000-0000-0000-0000-0000000b1001', 2, '1200', 'H', 300.00);

-- 6) verifikation INNERHALB der transaction
select
  (select count(*) from auth.users where id in
    ('00000000-0000-0000-0000-000000000a01',
     '00000000-0000-0000-0000-000000000b01'))                               as users,
  (select count(*) from public.companies where id in
    ('00000000-0000-0000-0000-00000000a100',
     '00000000-0000-0000-0000-00000000b100'))                               as companies,
  (select count(*) from public.company_members where user_id in
    ('00000000-0000-0000-0000-000000000a01',
     '00000000-0000-0000-0000-000000000b01'))                               as memberships,
  (select count(*) from public.belege where id in
    ('00000000-0000-0000-0000-0000000a1001',
     '00000000-0000-0000-0000-0000000a1002',
     '00000000-0000-0000-0000-0000000b1001'))                               as belege,
  (select count(*) from public.beleg_positionen where beleg_id in
    ('00000000-0000-0000-0000-0000000a1001',
     '00000000-0000-0000-0000-0000000a1002',
     '00000000-0000-0000-0000-0000000b1001'))                               as positionen,
  (select count(*) from public.belege
     where id = '00000000-0000-0000-0000-0000000a1002'
       and status = 'GEBUCHT')                                              as gebucht_check;

commit;
```

### 3.3 — Setup-Soll-Werte (Erwartung)

| Counter      | Soll |
|--------------|------|
| users        | 2    |
| companies    | 2    |
| memberships  | 2    |
| belege       | 3    |
| positionen   | 6    |
| gebucht_check| 1    |

### 3.4 — Setup-Ist-Werte (faktisch, in-tx verification)

| Counter      | Ist                |
|--------------|--------------------|
| users        | n/a — NICHT AUSGEFUEHRT |
| companies    | n/a — NICHT AUSGEFUEHRT |
| memberships  | n/a — NICHT AUSGEFUEHRT |
| belege       | n/a — NICHT AUSGEFUEHRT |
| positionen   | n/a — NICHT AUSGEFUEHRT |
| gebucht_check| n/a — NICHT AUSGEFUEHRT |

### 3.5 — Setup-Ist-Werte (faktisch, post-commit verification)

| Counter      | Ist post-commit         |
|--------------|-------------------------|
| users        | n/a — NICHT AUSGEFUEHRT |
| companies    | n/a — NICHT AUSGEFUEHRT |
| memberships  | n/a — NICHT AUSGEFUEHRT |
| belege       | n/a — NICHT AUSGEFUEHRT |
| positionen   | n/a — NICHT AUSGEFUEHRT |
| gebucht_check| n/a — NICHT AUSGEFUEHRT |

### 3.6 — Setup-Outcome

**Status:** NICHT AUSGEFUEHRT — Charge 20 stoppte bei ACL V5 vor Setup.
**Beginn:** n/a
**Ende:** n/a
**Dauer:** n/a
**Findings:** keine — Setup wurde nicht gestartet.

---

## 4 — RLS-Simulation Pattern

> **Hinweis:** Dieses Pattern wurde in Charge 20 **nicht ausgefuehrt**, da
> Charge 20 bei ACL V5 gestoppt hat. Die Methodik bleibt fuer den Replay
> in einer Folge-Charge gueltig und unveraendert.

Fuer die Szenarien-Ausfuehrung (Sektion 5) ist der folgende JWT-Context-
Simulation-Pattern vorgesehen:

```sql
begin;

select set_config(
  'request.jwt.claims',
  '{"sub":"<USER_UUID>","role":"authenticated","aud":"authenticated"}',
  true   -- true = local zur transaction, wird mit rollback rueckgaengig gemacht
);
set local role authenticated;

-- pre-check
select auth.uid() as authenticated_as_uid;

-- scenario action
<DML/SELECT>;

rollback;
```

**Mechanik:**
- `set_config(...)` schreibt JWT-claims in die Postgres-config-variable, die
  `auth.uid()` ausliest. `true` als drittes Argument macht die Aenderung
  transaktion-lokal.
- `set local role authenticated` wechselt die Session-Rolle von postgres zu
  authenticated -> RLS wird aktiv (`bypassrls=false`).
- `rollback` setzt beide Aenderungen automatisch zurueck — saubere
  Isolation zwischen Szenarien.

**User-Mapping:**

| Verwendete User      | sub-claim                                       |
|----------------------|--------------------------------------------------|
| User A (alle 12 Sz.) | `00000000-0000-0000-0000-000000000a01`           |

User B wurde fuer kein Szenario als Akteur verwendet — sein Zweck ist
ausschliesslich Test-Data-Eigentuemer fuer cross-tenant-isolation-tests
(Szenarien 2, 4, 6, 9, 10, 11).

---

## 5 — Test-Matrix Replay (12 Szenarien)

> **NICHT AUSGEFUEHRT — Charge 20 stoppte bei ACL V5; Szenarien 1-11
> (inklusive 8b) wurden NICHT ausgefuehrt.**
>
> Die Test-Matrix, die Szenario-SQL-Snippets, die Erwartungen und das
> Reframing fuer Szenario 8b bleiben als **Replay-Asset** im Dokument
> erhalten. Insbesondere wurde **das Charge-20-Reframing fuer Szenario 8b
> (DELETE auf GEBUCHT-Beleg unter `authenticated`) NICHT empirisch
> verifiziert** — die Aussagen zu Schuld 18-aleph in Sektion 5.8b und
> Sektion 9.1 bleiben architektonisch begruendet, aber nicht durch eine
> Charge-20-Messung gestuetzt.

### 5.0 — Master-Matrix

| # | Aktion (kurz)                                        | Expected Type    | Faktisch              | Status                  |
|---|------------------------------------------------------|------------------|-----------------------|--------------------------|
| 1 | User A liest eigene belege                           | allowed (2 rows) | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 2 | User A liest belege von Company B                    | 0 rows           | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 3 | User A INSERT belege mit company_id=A                | allowed          | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 4 | User A INSERT belege mit company_id=B                | RLS denied       | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 5 | User A UPDATE eigenes ENTWURF beleg (A1)             | allowed          | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 6 | User A UPDATE beleg von Company B (B1)               | RLS 0 rows       | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 7 | User A DELETE eigenes ENTWURF beleg (A1) + cascade   | allowed          | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
| 8 | User A UPDATE protected field auf GEBUCHT (A2)       | trigger denied   | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
|8b | User A DELETE GEBUCHT beleg (A2)                     | RLS 0 rows       | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT (Reframing nicht empirisch verifiziert) |
| 9 | User A DELETE beleg von Company B (B1)               | RLS 0 rows       | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
|10 | User A liest beleg_positionen von B1                 | 0 rows           | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |
|11 | User A INSERT beleg_positionen mit foreign parent    | RLS denied       | n/a — NICHT AUSGEFUEHRT | NICHT AUSGEFUEHRT        |

### 5.1 — Szenario 1: User A liest eigene belege

**Aktion:** SELECT auf belege ohne explizite WHERE-clause; RLS-USING filtert
Company-B-belege automatisch.

**Erwartung:** 2 rows (A1 + A2).

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
select id, company_id, status, belegnummer
from public.belege
order by belegnummer;
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- Anzahl zurueckgegebene Zeilen: <COUNT>
- Zeilen-IDs: <IST-WERT>
- B1 sichtbar? <YES|NO>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.2 — Szenario 2: User A liest belege von Company B

**Aktion:** SELECT mit WHERE company_id='b100' — RLS-USING filtert Company B
silent aus dem Scope.

**Erwartung:** 0 rows (kein error).

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
select id, company_id, status, belegnummer
from public.belege
where company_id = '00000000-0000-0000-0000-00000000b100';
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- Anzahl zurueckgegebene Zeilen: <COUNT>
- Error? <NO|YES — DETAILS>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.3 — Szenario 3: User A INSERT belege mit company_id=A

**Aktion:** INSERT mit User-A-eigenem company_id; RLS-with_check besteht.

**Erwartung:** 1 row inserted (rolled back).

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
insert into public.belege
  (company_id, belegart, belegnummer, belegdatum, buchungsdatum, status)
values
  ('00000000-0000-0000-0000-00000000a100',
   'SONSTIGES', 'CHARGE20-S3-INS', date '2026-02-01', date '2026-02-01', 'ENTWURF')
returning id, company_id, status, belegnummer;
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- INSERT erfolgreich? <YES|NO>
- RETURNING-row: <IST-WERT>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.4 — Szenario 4: User A INSERT belege mit company_id=B (two-batch)

**Aktion:** INSERT mit Company-B; RLS-with_check schlaegt fehl.

**Erwartung:** ERROR — `new row violates row-level security policy for table "belege"`,
SQLSTATE 42501.

**SQL-Snippet (Batch 4-A):**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
insert into public.belege
  (company_id, belegart, belegnummer, belegdatum, buchungsdatum, status)
values
  ('00000000-0000-0000-0000-00000000b100',
   'SONSTIGES', 'CHARGE20-S4-INS', date '2026-02-01', date '2026-02-01', 'ENTWURF')
returning id;
```

**SQL-Snippet (Batch 4-B, follow-up):**
```sql
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- Error message: `<IST-ERROR-MESSAGE>`
- SQLSTATE: <IST-WERT>
- Match expected pattern? <YES|NO>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.5 — Szenario 5: User A UPDATE eigenes ENTWURF beleg (A1)

**Aktion:** UPDATE auf A1.beschreibung; RLS + Trigger erlauben.

**Erwartung:** 1 row updated (rolled back). Trigger setzt `updated_am` auf
`now()` weil `OLD.status='ENTWURF'` -> trigger-condition fuer feld-vergleich
ist false, nur `NEW.updated_am := now()` greift.

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
update public.belege
set beschreibung = 'Charge 20 Scenario 5 — updated by User A'
where id = '00000000-0000-0000-0000-0000000a1001'
returning id, status, beschreibung, updated_am;
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- UPDATE-row-count: <COUNT>
- RETURNING beschreibung: <IST-WERT>
- RETURNING updated_am vs Setup-erfasst_am: <DIFF — TRIGGER-WIRKUNG?>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.6 — Szenario 6: User A UPDATE beleg von Company B

**Aktion:** UPDATE auf B1.beschreibung; RLS-USING filtert silent.

**Erwartung:** 0 rows updated, kein error.

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
update public.belege
set beschreibung = 'Charge 20 Scenario 6 — hijack attempt by User A'
where id = '00000000-0000-0000-0000-0000000b1001'
returning id;
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- UPDATE-row-count: <COUNT>
- Error? <NO|YES>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.7 — Szenario 7: User A DELETE eigenes ENTWURF beleg (A1) + cascade

**Aktion:** DELETE A1; RLS + status-clause erlauben. CASCADE auf
beleg_positionen (2 zeilen).

**Erwartung:** 1 belege-row deleted + 2 positionen via cascade
(rolled back).

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
delete from public.belege
where id = '00000000-0000-0000-0000-0000000a1001'
returning id, company_id, status, belegnummer;
select count(*) as positionen_for_a1_after_delete
from public.beleg_positionen
where beleg_id = '00000000-0000-0000-0000-0000000a1001';
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- DELETE-row-count: <COUNT>
- RETURNING-row: <IST-WERT>
- positionen_for_a1_after_delete: <COUNT>
- Cascade beobachtet? <YES|NO>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.8 — Szenario 8: User A UPDATE protected field auf GEBUCHT (A2) (two-batch)

**Aktion:** UPDATE A2.netto = 999.00; Trigger `belege_immutability` blockiert.

**Erwartung:** ERROR — `Gebuchter Beleg <id> darf nicht geändert werden
(GoBD Rz. 64). Bitte Stornobuchung erstellen.`, SQLSTATE P0001.

**SQL-Snippet (Batch 8-A):**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
update public.belege
set netto = 999.00
where id = '00000000-0000-0000-0000-0000000a1002'
returning id, status, netto;
```

**SQL-Snippet (Batch 8-B, follow-up):**
```sql
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- Error message: `<IST-ERROR-MESSAGE>`
- SQLSTATE: <IST-WERT>
- Match expected pattern (enthaelt "Gebuchter Beleg" + "GoBD Rz. 64")? <YES|NO>
- SQLSTATE = P0001 (NICHT 42501)? <YES|NO> (P0001 belegt: Trigger blockt, nicht RLS)

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.8b — Szenario 8b: Architektonisches Reframing der Schuld 18-aleph

> **Wichtig:** Das in dieser Sub-Sektion beschriebene Charge-20-Reframing
> wurde in Charge 20 **NICHT empirisch verifiziert**, da die RLS-Szenarien
> nicht ausgefuehrt wurden. Die architektonische Argumentation bleibt
> bestehen, aber Schuld 18-aleph kann auf Basis von Charge 20 weder
> bestaetigt noch widerlegt werden.

**Aktion:** User A versucht DELETE auf GEBUCHT-Beleg A2.

**Erwartung (Charge 18 frueher, vor Charge 20):**
"DELETE auf GEBUCHT-Beleg ist nicht durch DB-Mechanismus blockiert."
(Begruendung damals: belege_immutability ist BEFORE UPDATE, nicht BEFORE DELETE.)

**Erwartung (Charge 20 reframing):**
DELETE auf GEBUCHT-Beleg fuer authenticated wird durch RLS blockiert.
Begruendung: belege RLS DELETE policy enthaelt explizit die Klausel
`status='ENTWURF'`. A2.status='GEBUCHT' -> row aus DELETE-scope gefiltert
silent -> 0 rows affected, kein Error.

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
delete from public.belege
where id = '00000000-0000-0000-0000-0000000a1002'
returning id;
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- DELETE-row-count: <COUNT> (erwartet: 0)
- Error? <NO|YES>
- A2 in DB nach scenario unveraendert? <YES|NO>

**Architektonische Implikation:**

| Bedrohungsmodell                          | Schutzmechanismus                                   | Status                    |
|-------------------------------------------|------------------------------------------------------|---------------------------|
| authenticated-client DELETE auf GEBUCHT   | RLS DELETE policy `status='ENTWURF'`-Klausel         | <BLOCKED\|GAP>            |
| postgres-Owner DELETE                     | (keiner)                                             | defense-in-depth gap      |
| service_role DELETE                       | (keiner — bypassrls=true)                            | defense-in-depth gap      |
| SECURITY DEFINER RPC (zukuenftig)         | (keiner — bypasst RLS)                               | potentielle Luecke        |

**Schuld 18-aleph status-update:**
- **Vor Charge 20:** "open — DELETE-Trigger fehlt, GEBUCHT-Belege loeschbar".
- **Nach Charge 20:** "open as defense-in-depth gap — fuer authenticated
  bereits durch RLS-policy abgedeckt; Charge 21 ergaenzt BEFORE-DELETE-
  Trigger als zweite Verteidigungslinie fuer non-authenticated bypass-paths".

**Status:** <PASS mit Vorbehalt|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.9 — Szenario 9: User A DELETE beleg von Company B (B1)

**Aktion:** DELETE B1; can_write('b100')=false -> RLS-USING filtert.

**Erwartung:** 0 rows deleted, kein error.

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
delete from public.belege
where id = '00000000-0000-0000-0000-0000000b1001'
returning id;
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- DELETE-row-count: <COUNT>
- Error? <NO|YES>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.10 — Szenario 10: User A liest beleg_positionen von Company B (B1)

**Aktion:** SELECT positionen mit beleg_id=B1; chained-RLS via parent-belege
EXISTS filtert silent.

**Erwartung:** 0 rows, kein error.

**SQL-Snippet:**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
select id, beleg_id, position, konto, soll_haben, betrag
from public.beleg_positionen
where beleg_id = '00000000-0000-0000-0000-0000000b1001';
select count(*) as positionen_visible_for_b1
from public.beleg_positionen
where beleg_id = '00000000-0000-0000-0000-0000000b1001';
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- SELECT-row-count: <COUNT>
- positionen_visible_for_b1: <COUNT>
- Error? <NO|YES>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

### 5.11 — Szenario 11: User A INSERT beleg_positionen mit foreign parent (two-batch)

**Aktion:** INSERT positionen mit beleg_id=B1; chained-RLS schlaegt fehl
weil parent-belege fuer User A nicht sichtbar.

**Erwartung:** ERROR — `new row violates row-level security policy for table "beleg_positionen"`,
SQLSTATE 42501.

**SQL-Snippet (Batch 11-A):**
```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated","aud":"authenticated"}',
  true
);
set local role authenticated;
select auth.uid() as authenticated_as_uid;
insert into public.beleg_positionen
  (beleg_id, position, konto, soll_haben, betrag)
values
  ('00000000-0000-0000-0000-0000000b1001', 99, '4980', 'S', 1.00)
returning id, beleg_id, position;
```

**SQL-Snippet (Batch 11-B, follow-up):**
```sql
rollback;
```

**Faktisch:**
- `auth.uid()` = <IST-WERT>
- Error message: `<IST-ERROR-MESSAGE>`
- SQLSTATE: <IST-WERT>
- Match expected pattern? <YES|NO>

**Status:** <PASS|FAIL>
**Datum/Zeit:** <EXECUTION-DATE> <EXECUTION-TIME>

---

## 6 — ACL Re-Check (Schema-weit, post-0055)

### 6.1 — Methodik

6 Verifikations-Queries (V1-V6) auf `information_schema` + `pg_class.relacl`.

**Source-of-Truth:** Migration 0054 (baseline) + 0055 (sequence UPDATE
revoke).
**Ausgefuehrt am:** 2026-05-03 (staging, Central EU / Frankfurt).
**Tester:** Abdallah Harouda.
**Pre-Execution-HEAD:** 49af1aa.
**Role:** postgres (Owner).
**Status der Sektion:** V1-V4 = PASS. V5 = STOP/FAIL (MAINTAIN-Drift gefunden).
V6 = NICHT AUSGEFUEHRT.
**Vollstaendiger V5-base raw-Auszug + Probe-Outputs:** Appendix A.

### 6.2 — V1: authenticated table grants (Erwartet 42 Zeilen)

**SQL-Snippet:**
```sql
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee      = 'authenticated'
group by table_name
order by table_name;
```

**Erwartung:**
- Gruppe A (32 Tabellen): `DELETE, INSERT, SELECT, UPDATE`
- Gruppe B (1 Tabelle: `dunning_records`): `DELETE, INSERT, SELECT`
- Gruppe C (1 Tabelle: `user_profiles`): `INSERT, SELECT, UPDATE`
- Gruppe D (6 Tabellen): `INSERT, SELECT`
- Gruppe E (1 Tabelle: `business_partners_versions`): `SELECT`
- `health_check` (intentional out-of-scope): `SELECT`
- TOTAL: 42 Zeilen.

**Faktisch:**

| Gruppe       | Erwartete Anzahl | Faktische Anzahl | Match? |
|--------------|------------------|------------------|--------|
| A            | 32               | 32               | PASS   |
| B            | 1                | 1                | PASS   |
| C            | 1                | 1                | PASS   |
| D            | 6                | 6                | PASS   |
| E            | 1                | 1                | PASS   |
| health_check | 1                | 1                | PASS   |
| **TOTAL**    | **42**           | **42**           | PASS   |

**Status:** PASS.
**Findings:** Keine Drift in `information_schema.role_table_grants` fuer
`authenticated`. Gruppen A-E + `health_check` wie erwartet.

### 6.3 — V2: authenticated sequence privileges (post-0055)

**SQL-Snippet:**
```sql
select
  c.relname                                                              as sequence_name,
  has_sequence_privilege('authenticated', 'public.' || c.relname, 'USAGE')  as has_usage,
  has_sequence_privilege('authenticated', 'public.' || c.relname, 'SELECT') as has_select,
  has_sequence_privilege('authenticated', 'public.' || c.relname, 'UPDATE') as has_update
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname  = 'public'
  and c.relkind  = 'S'
order by c.relname;
```

**Erwartung:**

| sequence_name                 | has_usage | has_select | has_update |
|-------------------------------|-----------|------------|------------|
| account_report_mapping_id_seq | true      | false      | **false**  |
| report_lines_id_seq           | true      | false      | **false**  |

**Faktisch:**

| sequence_name                 | has_usage | has_select | has_update |
|-------------------------------|-----------|------------|------------|
| account_report_mapping_id_seq | true      | false      | false      |
| report_lines_id_seq           | true      | false      | false      |

**Status:** PASS.
**Kritisches Kriterium (0055-Wirksamkeit):** has_update=false fuer beide
sequences? **YES** — 0055 wirkt.
**Findings:** Keine Abweichung. Schuld 19-zayin (sequence-UPDATE-Drift) ist
durch 0055 geschlossen (vgl. Sektion 9).

### 6.4 — V3: service_role table grants (Erwartet 42 Zeilen × 7 privs)

**SQL-Snippet:**
```sql
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee      = 'service_role'
group by table_name
order by table_name;
```

**Erwartung:** 42 Zeilen, jede mit
`DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`.

**Faktisch:**
- Anzahl Zeilen: 42.
- Alle Zeilen mit identischem 7-priv-string? **YES**.
- Abweichende Zeilen: keine in `information_schema`.

**Status:** PASS.
**Hinweis:** `information_schema.role_table_grants` zeigt das in
PostgreSQL 17 eingefuehrte Privileg `MAINTAIN` nicht an. Die in V5-A4
gefundene MAINTAIN-Drift ist nur ueber `pg_class.relacl + aclexplode()`
sichtbar (Lehre 58).

### 6.5 — V4: service_role sequence privileges

**SQL-Snippet:**
```sql
select
  c.relname                                                              as sequence_name,
  has_sequence_privilege('service_role', 'public.' || c.relname, 'USAGE')  as has_usage,
  has_sequence_privilege('service_role', 'public.' || c.relname, 'SELECT') as has_select,
  has_sequence_privilege('service_role', 'public.' || c.relname, 'UPDATE') as has_update
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname  = 'public'
  and c.relkind  = 'S'
order by c.relname;
```

**Erwartung:** 2 Zeilen, beide mit usage=true, select=true, update=true.

**Faktisch:**

| sequence_name                 | has_usage | has_select | has_update |
|-------------------------------|-----------|------------|------------|
| account_report_mapping_id_seq | true      | true       | true       |
| report_lines_id_seq           | true      | true       | true       |

**Status:** PASS. service_role-Sequence-Privilegien wie erwartet — Schuld
19-zayin durch 0055 fuer `service_role` korrekt erhalten.

### 6.6 — V5: pg_class.relacl Cross-Check (Lehre 58) — **STOP / FAIL**

**Methodik:** Lehre 58 — `information_schema` allein ist nicht autoritativ.
Raw `pg_class.relacl + aclexplode()` ist die endgueltige source.

**Gesamt-Ergebnis V5:** **STOP / FAIL.** A4 und A6 zeigen Drift; Charge 20
wurde unmittelbar nach V5 gestoppt, **vor** Setup, RLS-Szenarien und Cleanup.

**Drift-Zaehler (Assertion-Summary):**

| Assertion | Beschreibung                                                  | Drift-Count |
|-----------|---------------------------------------------------------------|-------------|
| A1        | `anon` table write/admin drift                                | 0           |
| A2        | `authenticated` table TRUNCATE/REFERENCES/TRIGGER drift       | 0           |
| A3        | `anon` + `authenticated` sequence-UPDATE drift                | 0           |
| A4        | `service_role` uniform-7-privs drift                          | **41**      |
| A5        | `service_role` uniform-3-sequence-privs drift                 | 0           |
| A6        | `authenticated` group-mapping drift                           | **42**      |

**V5-base + Probe raw-Auszug:** siehe Appendix A.

#### 6.6.1 — V5-A1: anon clean (no write/admin privs on tables)

**Erwartung:** 0 Zeilen.
**Faktisch:** 0 Zeilen.
**Findings:** keine.
**Status:** PASS.

#### 6.6.2 — V5-A2: authenticated clean from TRUNCATE/REFERENCES/TRIGGER

**Erwartung:** 0 Zeilen.
**Faktisch:** 0 Zeilen.
**Findings:** keine. 0053 wirkt.
**Status:** PASS.

#### 6.6.3 — V5-A3: anon und authenticated kein UPDATE auf sequences (KRITISCH post-0055)

**Erwartung:** 0 Zeilen.
**Faktisch:** 0 Zeilen.
**Findings:** keine. 0055 wirkt fuer `anon` und `authenticated`.
**Status:** PASS.

#### 6.6.4 — V5-A4: service_role uniform 7 privs auf 42 tables — **FAIL**

**Erwartung:** 0 drift-Zeilen (= alle 42 Tabellen haben exakt 7 Privilegien).
**Faktisch:** **41** drift-Zeilen.
**Findings:** Auf 41 oeffentlichen Anwendungstabellen besitzt `service_role`
zusaetzlich zum erwarteten 7-priv-Set das PostgreSQL-17-Privileg `MAINTAIN`.
Lediglich `health_check` ist drift-frei. Diagnostische Probe (siehe
Appendix A) bestaetigt: dieselbe MAINTAIN-Drift existiert auch fuer `anon`,
`authenticated` und `postgres` — d.h. MAINTAIN ist auf den 41 Tabellen
explizit fuer **alle vier** Rollen gesetzt.
**Status:** **FAIL — STOP-Kriterium ausgeloest.**

#### 6.6.5 — V5-A5: service_role uniform 3 privs auf 2 sequences

**Erwartung:** 0 drift-Zeilen.
**Faktisch:** 0 drift-Zeilen.
**Findings:** keine.
**Status:** PASS.

#### 6.6.6 — V5-A6: gruppe-mapping consistency fuer authenticated — **FAIL**

**Erwartung:** 0 drift-Zeilen.
**Faktisch:** **42** drift-Zeilen.
**Findings:** Die Group-Mapping-Konsistenz-Assertion stuetzt sich auf das
exakte Privilege-Set pro Gruppe (A/B/C/D/E + `health_check`). Die
MAINTAIN-Drift auf den 41 Anwendungstabellen verletzt diese Konsistenz fuer
jede der 41 Tabellen plus `health_check` (das selbst zwar MAINTAIN-frei ist,
aber als Cross-Check-Datensatz mitgezaehlt wird) — Summe 42. Die Drift in
A6 ist eine direkte Folge der MAINTAIN-Drift in A4 und stellt keinen
unabhaengigen zweiten Befund dar.
**Status:** **FAIL — Folge der MAINTAIN-Drift.**

#### 6.6.7 — Diagnostische Probe (Lehre 58 empirisch bestaetigt)

Eine ergaenzende Probe ueber `pg_class.relacl + aclexplode()` hat folgendes
gezeigt:

- `MAINTAIN` ist auf 41 oeffentlichen Anwendungstabellen explizit fuer jede
  der vier Rollen `anon`, `authenticated`, `postgres`, `service_role`
  gesetzt — also 41 × 4 = **164 explizite MAINTAIN-Eintraege**.
- `health_check` ist die **einzige** oeffentliche Tabelle ohne MAINTAIN.
- `information_schema.role_table_grants` zeigte **kein** MAINTAIN-Privileg
  an; nur `pg_class.relacl + aclexplode()` hat das Privileg sichtbar
  gemacht.
- Damit ist **Lehre 58 empirisch bestaetigt**: `information_schema` ist
  fuer PG-17-`MAINTAIN`-Audits nicht autoritativ; raw-`relacl`-Cross-Check
  ist erforderlich.

**Sicherheitsrelevanz:** MAINTAIN auf `anon` und `authenticated` ist
sicherheitsrelevant — Anwendungs-Rollen sollten dieses Maintenance-Privileg
nicht besitzen. MAINTAIN auf `postgres` und `service_role` ist
betrieblich-administrativ und der Korrektur-Scope dafuer ist in Charge 22
zu klaeren.

### 6.7 — V6: anon snapshot

> **NICHT AUSGEFUEHRT — Charge 20 stoppte bei V5.** V6 wird im Replay
> nach Korrektur der MAINTAIN-Drift (Charge 22) erneut ausgefuehrt.

**SQL-Snippet (unveraendert als Replay-Asset):**
```sql
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee      = 'anon'
group by table_name
order by table_name;
```

**Erwartung (Replay):** 1 Zeile — `health_check / SELECT`.

**Faktisch:** n/a — NICHT AUSGEFUEHRT.

**Status:** NICHT AUSGEFUEHRT.

### 6.8 — ACL Re-Check Outcome

| Verification | Status                |
|--------------|-----------------------|
| V1           | PASS                  |
| V2           | PASS                  |
| V3           | PASS                  |
| V4           | PASS                  |
| V5-A1        | PASS                  |
| V5-A2        | PASS                  |
| V5-A3        | PASS                  |
| V5-A4        | **FAIL** (drift = 41) |
| V5-A5        | PASS                  |
| V5-A6        | **FAIL** (drift = 42) |
| V6           | NICHT AUSGEFUEHRT     |
| **GESAMT**   | **STOP / FAIL**       |

**Drift-Findings:** PostgreSQL-17-Privileg `MAINTAIN` ist auf 41
oeffentlichen Anwendungstabellen fuer alle vier Rollen (`anon`,
`authenticated`, `postgres`, `service_role`) gesetzt; `health_check` ist
die einzige Ausnahme. `information_schema` zeigte das Privileg nicht;
raw-`relacl`-Cross-Check (Lehre 58) hat es enthuellt. Charge 20 wurde
unmittelbar nach V5 gestoppt — Setup, RLS-Szenarien und Cleanup wurden
nicht ausgefuehrt.

---

## 7 — Cleanup

> **NICHT AUSGEFUEHRT — Setup wurde nie gestartet, daher kein Cleanup
> notwendig.**
>
> Es existieren keine Charge-20-Test-Daten in `auth.users`,
> `public.companies`, `public.company_members`, `public.belege` oder
> `public.beleg_positionen`. Das Cleanup-SQL und die Residual-Counter-
> Tabellen bleiben als **Replay-Asset** im Dokument erhalten.

### 7.1 — Cleanup-SQL

> **Note:** Folgendes SQL ist eine kompaktierte Fassung; das final-file wird
> beim Abschluss den vollstaendigen approved SQL-Block (mit allen Header-
> Kommentaren der Session 1 final draft) eingebettet enthalten.

```sql
-- charge 20 cleanup-skript (kompaktierte Fassung)

begin;

-- 1) defense-in-depth: explizite child-DELETEs
-- 1a) beleg_positionen
delete from public.beleg_positionen
where beleg_id in (
    '00000000-0000-0000-0000-0000000a1001',
    '00000000-0000-0000-0000-0000000a1002',
    '00000000-0000-0000-0000-0000000b1001'
);

-- 1b) belege
delete from public.belege
where id in (
    '00000000-0000-0000-0000-0000000a1001',
    '00000000-0000-0000-0000-0000000a1002',
    '00000000-0000-0000-0000-0000000b1001'
);

-- 1c) company_members
delete from public.company_members
where (company_id, user_id) in (
    ('00000000-0000-0000-0000-00000000a100', '00000000-0000-0000-0000-000000000a01'),
    ('00000000-0000-0000-0000-00000000b100', '00000000-0000-0000-0000-000000000b01')
);

-- 2) public.companies
delete from public.companies
where id in (
    '00000000-0000-0000-0000-00000000a100',
    '00000000-0000-0000-0000-00000000b100'
);

-- 3) auth.users
delete from auth.users
where id in (
    '00000000-0000-0000-0000-000000000a01',
    '00000000-0000-0000-0000-000000000b01'
);

-- 4) verifikation INNERHALB der transaction
select
  (select count(*) from auth.users where id in
    ('00000000-0000-0000-0000-000000000a01',
     '00000000-0000-0000-0000-000000000b01'))                               as users_residual,
  (select count(*) from public.companies where id in
    ('00000000-0000-0000-0000-00000000a100',
     '00000000-0000-0000-0000-00000000b100'))                               as companies_residual,
  (select count(*) from public.company_members where user_id in
    ('00000000-0000-0000-0000-000000000a01',
     '00000000-0000-0000-0000-000000000b01'))                               as memberships_residual,
  (select count(*) from public.belege where id in
    ('00000000-0000-0000-0000-0000000a1001',
     '00000000-0000-0000-0000-0000000a1002',
     '00000000-0000-0000-0000-0000000b1001'))                               as belege_residual,
  (select count(*) from public.beleg_positionen where beleg_id in
    ('00000000-0000-0000-0000-0000000a1001',
     '00000000-0000-0000-0000-0000000a1002',
     '00000000-0000-0000-0000-0000000b1001'))                               as positionen_residual,
  (select count(*) from public.belege
     where id = '00000000-0000-0000-0000-0000000a1002'
       and status = 'GEBUCHT')                                              as gebucht_residual;

commit;
```

### 7.2 — Cleanup-Soll-Werte (Erwartung)

| Counter             | Soll |
|---------------------|------|
| users_residual      | 0    |
| companies_residual  | 0    |
| memberships_residual| 0    |
| belege_residual     | 0    |
| positionen_residual | 0    |
| gebucht_residual    | 0    |

### 7.3 — Cleanup-Ist-Werte (faktisch, in-tx verification)

| Counter             | Ist                     |
|---------------------|-------------------------|
| users_residual      | n/a — NICHT AUSGEFUEHRT |
| companies_residual  | n/a — NICHT AUSGEFUEHRT |
| memberships_residual| n/a — NICHT AUSGEFUEHRT |
| belege_residual     | n/a — NICHT AUSGEFUEHRT |
| positionen_residual | n/a — NICHT AUSGEFUEHRT |
| gebucht_residual    | n/a — NICHT AUSGEFUEHRT |

### 7.4 — Cleanup-Ist-Werte (faktisch, post-commit verification)

| Counter             | Ist post-commit         |
|---------------------|-------------------------|
| users_residual      | n/a — NICHT AUSGEFUEHRT |
| companies_residual  | n/a — NICHT AUSGEFUEHRT |
| memberships_residual| n/a — NICHT AUSGEFUEHRT |
| belege_residual     | n/a — NICHT AUSGEFUEHRT |
| positionen_residual | n/a — NICHT AUSGEFUEHRT |
| gebucht_residual    | n/a — NICHT AUSGEFUEHRT |

### 7.5 — Cleanup-Outcome

**Status:** NICHT AUSGEFUEHRT — kein Cleanup noetig (Setup nie gelaufen).
**Beginn:** n/a
**Ende:** n/a
**Dauer:** n/a
**Findings:** keine.

---

## 8 — `journal_entries`-Beobachtung (Documentation-Only)

**Kontext:** Charge 19 Phase 1 (`docs/journal-entries-inspection-2026-05-02.md`)
hat festgestellt, dass `journal_entries` in der DB existiert, obwohl die
Spec V1 dies nicht voraussetzt. Charge 19 Phase 2 hat `journal_entries` in
die GRANT-Strategie aufgenommen (Gruppe A: voll-CRUD fuer authenticated).

**Charge 20 Beobachtung:** keine neuen scenarios fuer `journal_entries` —
das table ist im scope der RLS- und ACL-Re-Checks (V1 zeigt es als Gruppe-A-
Tabelle). Dies ist documentation-only follow-up; Implementations-
Entscheidung (behalten / entfernen / formalisieren als Spec V2) bleibt
offen — kein Charge-20-scope-creep.

**Folge-Action:** offen, separater architectural decision required.

**Charge-20-Beobachtung post-V5-Stop:** Der V5-Stop betrifft `journal_entries`
nicht spezifisch — die MAINTAIN-Drift trifft alle 41 Anwendungstabellen
gleichermassen, einschliesslich `journal_entries`. Die documentation-only
Folge-Aktion bleibt unveraendert.

---

## 9 — Offene Schulden / Folge-Charges

### 9.1 — Schuld 18-aleph: BEFORE-DELETE-Trigger fuer belege/positionen

**Status nach Charge 20:** **OFFEN als defense-in-depth gap** — das in
Sektion 5.8b skizzierte Charge-20-Reframing wurde **nicht empirisch
verifiziert**, da die RLS-Szenarien wegen V5-Stop nicht ausgefuehrt
wurden.
**Begruendung (architektonisch, nicht empirisch belegt):** authenticated-
client-Schutz wuerde bereits durch RLS-DELETE-policy bestehen; die Luecke
besteht fuer `service_role`, postgres-Owner, und kuenftige
SECURITY DEFINER RPCs.
**Folge-Charge:** Charge 21 — BEFORE-DELETE-Trigger als zweite
Verteidigungslinie. Die empirische Verifikation der RLS-Wirkung erfolgt
gemeinsam mit Schuld 10-aleph in einer Replay-Charge nach Charge 22.

### 9.2 — Schuld 18-bet: GRANT-Repair authenticated/service_role

**Status:** **GESCHLOSSEN** durch Migration 0054 (Charge 19 Phase 2,
Step 3). V1 und V3 in dieser Charge bestaetigen den Soll-Zustand:
authenticated mit Gruppe-A-E-Mapping (42 Zeilen), service_role mit
uniformen 7 Privilegien auf 42 Tabellen.

### 9.3 — Schuld 19-aleph: protect_update Whitelist erweitern

**Status:** open. Nicht im Charge 20 scope.
**Folge-Charge:** spaetere Charge.

### 9.4 — Schuld 19-bet: localStorage Settings -> DB-side

**Status:** open. Frontend/Settings-Migration.
**Folge-Charge:** spaetere Charge.

### 9.5 — Schuld 19-gimel: Helper-Function-EXECUTE-Hardening

**Status:** open. Charge 19 dokumentiert; Hardening fehlt noch.
**Folge-Charge:** spaetere Charge.

### 9.6 — Schuld 19-he: ALTER DEFAULT PRIVILEGES Cleanup

**Status:** open.
**Folge-Charge:** spaetere Charge.

### 9.7 — Schuld 19-zayin: sequence-UPDATE-Drift fuer anon/authenticated

**Status:** **GESCHLOSSEN** durch Migration 0055 (Charge 19 Phase 2,
Step 4). V2 und V4 in dieser Charge bestaetigen den Soll-Zustand:
- `anon` und `authenticated`: USAGE=true, SELECT=false, **UPDATE=false**
  (V2; V5-A3 ohne Drift).
- `service_role`: USAGE=true, SELECT=true, UPDATE=true (V4; V5-A5 ohne
  Drift).

### 9.8 — `journal_entries` Documentation-Only Follow-up

**Status:** offen — siehe Sektion 8.

### 9.9 — Schuld 10-aleph (diese Charge)

**Status nach Charge 20 (DB-seitig):** **OFFEN / PENDING.** Die
DB-seitige Verifikation der Test-Matrix konnte wegen des V5-Stops nicht
durchgefuehrt werden. Replay erfolgt nach Korrektur der MAINTAIN-Drift
(siehe Charge 22 → Charge 23).
**Datenschutz-Sign-off + StB-Ruecksprache:** weiterhin pending — separate
processes nach Replay-Charge, nicht im Charge 20 scope.

### 9.10 — Schuld 20-aleph (NEU — diese Charge)

**Status nach Charge 20:** **NEU, OFFEN.**
**Befund:** PostgreSQL-17-Privileg `MAINTAIN` ist auf 41 oeffentlichen
Anwendungstabellen explizit fuer jede der vier Rollen (`anon`,
`authenticated`, `postgres`, `service_role`) gesetzt; `health_check` ist
die einzige Ausnahme. `information_schema.role_table_grants` zeigt das
Privileg nicht; nur `pg_class.relacl + aclexplode()` enthuellt es.
**Sicherheitsrelevanz:** sicherheitsrelevant fuer `anon` und
`authenticated` — Anwendungs-Rollen sollten kein Wartungs-Privileg
besitzen. Fuer `postgres` und `service_role` ist die Korrektur-Frage
betrieblich-administrativ.
**Quelle:** V5-A4 (drift = 41), V5-A6 (drift = 42, Folge-Drift).
**Korrektur-Scope:** **PENDING** — wird in Charge 22 geklaert. **Charge 20
enthaelt bewusst KEINE korrektive REVOKE-SQL und KEINE Migrations-Details.**
**Folge-Charge:** Charge 22 (Korrektur-Migration) → Charge 23 (Replay
Schuld 10-aleph).

---

## 10 — Akzeptanzkriterien

Die Akzeptanzkriterien sind in zwei Kategorien getrennt, um die DB-seitige
Schliessung von Schuld 10-aleph nicht mit dem Repo-/PR-Prozess zu vermischen:

### 10.A — DB-seitige Kriterien (Schliessung Schuld 10-aleph DB-seitig)

| # | Kriterium                                                                 | Erfuellt              |
|---|---------------------------------------------------------------------------|-----------------------|
| A1| ACL Re-Check V1-V6: alle pass, keine drift                                | **FAIL** (V5-Drift)   |
| A2| Setup-SQL erfolgreich: Soll-Werte 2/2/2/3/6/1 verified                    | NICHT AUSGEFUEHRT     |
| A3| 12 Scenarios alle "bestanden" oder "bestanden mit Vorbehalt"              | NICHT AUSGEFUEHRT     |
| A4| Szenario 8b reframing dokumentiert (Sektion 5.8b)                         | dokumentiert, **nicht empirisch verifiziert** |
| A5| Cleanup-SQL erfolgreich: Residual-Counter alle 0                          | NICHT AUSGEFUEHRT     |
| A6| Test-Baseline gehalten: 204 / 2036 / 1                                    | NICHT ANWENDBAR       |

**Gesamtbewertung 10.A:** **DB-seitige Kriterien NICHT ERFUELLT — Schuld
10-aleph bleibt OFFEN/PENDING.** ACL V5 hat Drift gefunden (FAIL); Setup,
Szenarien und Cleanup wurden nicht ausgefuehrt; das 8b-Reframing bleibt
unverifiziert.

### 10.B — Prozess/Repo-Kriterien (Charge-20-Abschluss vollstaendig)

| # | Kriterium                                                                 | Erfuellt                                                          |
|---|---------------------------------------------------------------------------|-------------------------------------------------------------------|
| B1| Verification doc erstellt mit allen Sektionen 1-13 + Appendix A/B         | IN REVIEW — Diagnostic doc filled; final human review pending.    |
| B2| Tracker §28 atomar appended via PowerShell-script (Lehre 55)              | PENDING — after final doc review.                                 |
| B3| PR erfolgreich gemerged                                                    | PENDING — after Tracker append and commit/PR.                     |

**Gesamtbewertung 10.B:** B1 in review; B2-B3 offen — Charge 20
prozess-seitig noch nicht abgeschlossen.

### 10.C — NICHT-Kriterien (explizit out-of-scope fuer Charge 20)

- Datenschutz-Sign-off (HANDOFF_BATCH_19 §12 — nach Charge 20).
- StB-Ruecksprache (gleiche Begruendung).
- BEFORE-DELETE-Trigger (Charge 21).
- Charge 19 secondary cleanup (19-aleph etc.).

---

## 11 — Klassifikation

**Charge 20 outcome:** **11.C — Verifikation gescheitert / Drift festgestellt
(Diagnostic).**

### Erlaeuterung der Klassifikationsoptionen

- **11.A — Erfolgreiche Verifikation:** alle Akzeptanzkriterien 10.A + 10.B
  erfuellt, alle 12 scenarios, alle 6 ACL verifications pass. Keine drift.
- **11.B — Verifikation mit dokumentierten Findings:** alle Kriterien
  erfuellt, mit "bestanden mit Vorbehalt" fuer Sc. 8b (Schuld 18-aleph
  defense-in-depth gap dokumentiert). **NICHT ERREICHT in Charge 20** — V5
  hat vor Setup gestoppt.
- **11.C — Verifikation gescheitert / Drift festgestellt:** Charge 20 nicht
  geschlossen, finding dokumentiert, korrektur-charge erforderlich.
- **11.D — Diagnostic Outcome:** strukturelle Voraussetzungen nicht
  erfuellt, Charge 20 als Diagnostic dokumentiert.

**Erwartete Klassifikation (vor Ausfuehrung):** 11.B (Sc. 8b ist as-designed
"bestanden mit Vorbehalt").

**Faktische Klassifikation (nach Ausfuehrung):** **11.C.**

### 11.1 — Evidence-basierte Befunde

- **V1-V4: PASS.** Migration 0052/0053/0054/0055 wirken so wie spezifiziert.
- **V5-A1, A2, A3, A5: PASS.** Keine Drift fuer `anon`/`authenticated`
  table writes oder sequence-UPDATE.
- **V5-A4: FAIL — drift = 41.** `service_role` hat zusaetzlich zum
  erwarteten 7-priv-Set das PG-17-Privileg `MAINTAIN` auf 41 oeffentlichen
  Anwendungstabellen.
- **V5-A6: FAIL — drift = 42.** Folge-Drift der MAINTAIN-Verteilung;
  Group-Mapping-Konsistenz verletzt.
- **Diagnostische Probe:** MAINTAIN ist auf den 41 Tabellen explizit fuer
  `anon`, `authenticated`, `postgres`, `service_role` gesetzt — 164
  explizite MAINTAIN-Eintraege gesamt. `health_check` ist die einzige
  Ausnahme.
- **V6 + Setup + 12 Szenarien + Cleanup: NICHT AUSGEFUEHRT.**

### 11.2 — Source-of-Data-Hinweis

Die Befunde stuetzen sich ausschliesslich auf:
- `information_schema.role_table_grants` (V1, V3) — zeigt **kein**
  MAINTAIN-Privileg.
- `pg_class.relacl + aclexplode()` (V5-base + diagnostische Probe) — zeigt
  MAINTAIN.
- `has_sequence_privilege(...)` (V2, V4).

Die Diskrepanz zwischen `information_schema` und `pg_class.relacl`
bestaetigt **Lehre 58** empirisch.

### 11.3 — Vorlaeufige Risiko-Klassifikation

| Rolle           | MAINTAIN-Drift | Sicherheitsrelevanz | Korrektur-Scope        |
|-----------------|----------------|---------------------|------------------------|
| `anon`          | 41 Tabellen    | sicherheitsrelevant | pending (Charge 22)    |
| `authenticated` | 41 Tabellen    | sicherheitsrelevant | pending (Charge 22)    |
| `postgres`      | 41 Tabellen    | betrieblich         | pending (Charge 22)    |
| `service_role`  | 41 Tabellen    | betrieblich         | pending (Charge 22)    |

Die endgueltige Risiko-Klassifikation und der Korrektur-Scope werden in
Charge 22 festgelegt; Charge 20 enthaelt **keine** korrektive REVOKE-SQL.

### 11.4 — Begruendung der 11.C-Klassifikation

Charge 20 ist als Diagnostic abgeschlossen, weil:
1. ACL V5 vor Setup eine strukturelle Privilege-Drift gefunden hat.
2. Setup, 12 Szenarien, Cleanup und V6 wurden bewusst **nicht ausgefuehrt**,
   um Drift-Bewusstsein zu wahren und keine Test-Daten in eine ggf.
   inkonsistente ACL-Umgebung zu schreiben.
3. Die Drift ist ein neuer Befund (Schuld 20-aleph), der in einer
   eigenstaendigen Korrektur-Charge (Charge 22) adressiert werden muss,
   bevor Schuld 10-aleph DB-seitig replay-bar ist (Charge 23).

---

## 12 — Lessons Learned

### 12.1 — Neue Lehren aus Charge 20

- **Lehre 58 empirisch bestaetigt:** `information_schema.role_table_grants`
  hat das PG-17-Privileg `MAINTAIN` **nicht angezeigt**, waehrend
  `pg_class.relacl + aclexplode()` das Privileg auf 164 Eintraegen
  enthuellt hat. ACL-Audits in PG-17-Umgebungen muessen den raw-`relacl`-
  Pfad als autoritative Quelle nutzen; `information_schema` ist nicht
  ausreichend.
- **V5 als Gate hat funktioniert:** der STOP nach V5 hat verhindert, dass
  Charge 20 Test-Daten in eine ACL-inkonsistente Umgebung geschrieben
  haette. Ein "first-pass-must-be-clean"-Gate vor Setup erspart spaeteres
  partielles Cleanup und reduziert Diagnostik-Komplexitaet.
- **PG-17 `MAINTAIN`-Bewusstsein:** das mit PostgreSQL 17 eingefuehrte
  Privileg `MAINTAIN` erfordert PG-version-aware ACL-Checks. Blindes
  `GRANT ALL` (oder Tooling, das `GRANT ALL` produziert) verteilt seit
  PG 17 implizit auch `MAINTAIN` und muss vermieden bzw. durch
  explizite Privilege-Listen ersetzt werden.

### 12.2 — Bestaetigungen bestehender Lehren

- **Lehre 47** (DB-Realitaet ≠ Spec-Annahmen): bestaetigt — V5 hat eine
  Drift gefunden, die in keinem Spec-Dokument antizipiert war.
- **Lehre 50** (Branch-first): bestaetigt — `verify/charge-20-compliance-replay`
  wurde vor Execution erstellt; Pre-Execution-HEAD = 49af1aa.
- **Lehre 54** (one sensitive op per response): bestaetigt — V5-Stop und
  Setup-Verzicht wurden als getrennte, bewusste Entscheidungen behandelt.
- **Lehre 55** (atomic PowerShell append): bestaetigt fuer Tracker §28.
- **Lehre 58** (raw `relacl` via aclexplode): **empirisch bestaetigt** —
  siehe 12.1.

### 12.3 — Neue Workflow-Fallen

- **Fall: PG-17-Privilegien sind in `information_schema` unsichtbar.**
  Wer ACL-Audits ausschliesslich auf `information_schema.role_table_grants`
  oder `has_table_privilege(...)` basiert, kann MAINTAIN-Drift uebersehen.
  Cross-Check via `pg_class.relacl + aclexplode()` ist Pflicht.
- **Fall: GRANT-ALL-Quellen schwer zu identifizieren.** Die Herkunft der
  MAINTAIN-Eintraege ist nicht trivial — sie kann aus Supabase-managed
  GRANTs, ALTER DEFAULT PRIVILEGES, oder migration-internen GRANT-ALL-
  Statements stammen. Charge 22 muss die Herkunft bestimmen, bevor
  REVOKE-Strategie festgelegt wird.

---

## 13 — Naechste Schritte

Charge 20 schliesst als **Diagnostic 11.C**. Die unmittelbar relevanten
Folge-Schritte:

| Prioritaet | Aufgabe                                                                                | Charge          |
|------------|----------------------------------------------------------------------------------------|-----------------|
| 1          | Charge 20 als Diagnostic 11.C abschliessen (Doku, Tracker §28, PR)                     | Charge 20       |
| 2          | BEFORE-DELETE-Trigger fuer belege/positionen (separat — bleibt eigenstaendig)           | Charge 21       |
| 3          | Korrektive Massnahme fuer MAINTAIN-Drift (Schuld 20-aleph) — Scope/Strategie pending    | Charge 22       |
| 4          | Replay Schuld 10-aleph (Setup, 12 Szenarien inkl. 8b, Cleanup, V1-V6) nach Korrektur    | Charge 23       |
| 5          | Datenschutz-Sign-off einholen                                                          | post-Charge-23  |
| 6          | StB-Ruecksprache zu Loesch-Policies                                                    | post-Charge-23  |
| 7          | feat/documents-storage-go-live                                                         | spaeter         |
| 8          | Accounting-Service Implementierung                                                     | spaeter         |
| 9          | Schulden 19-aleph / 19-bet / 19-gimel / 19-he                                          | spaeter         |
| 10         | journal_entries architectural decision                                                 | offen           |

**Hinweis zur Reihenfolge:** Charge 21 (BEFORE-DELETE-Trigger) und Charge 22
(MAINTAIN-Korrektur) sind voneinander unabhaengig. Charge 23 (Replay
Schuld 10-aleph) setzt den Abschluss von Charge 22 voraus, da sonst V5
erneut die Drift findet und der Replay wieder vor Setup stoppt.

---

## Appendix A — V5 Evidence (kompakt)

### A.1 — Assertion-Summary

| Assertion | Erwartung | Ist | Status |
|-----------|-----------|-----|--------|
| A1 — anon table write/admin drift                          | 0 | 0  | PASS |
| A2 — authenticated TRUNCATE/REFERENCES/TRIGGER drift       | 0 | 0  | PASS |
| A3 — anon + authenticated sequence-UPDATE drift            | 0 | 0  | PASS |
| A4 — service_role uniform-7-privs drift                    | 0 | 41 | **FAIL** |
| A5 — service_role uniform-3-sequence-privs drift           | 0 | 0  | PASS |
| A6 — authenticated group-mapping drift                     | 0 | 42 | **FAIL** |

### A.2 — V5-base Snapshot SQL (Replay-Asset)

```sql
select
  n.nspname              as schema_name,
  c.relname              as object_name,
  case c.relkind
    when 'r' then 'table'
    when 'S' then 'sequence'
    else c.relkind::text
  end                    as object_kind,
  acl.grantee::regrole   as grantee,
  acl.privilege_type
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(c.relacl) acl
where n.nspname = 'public'
  and c.relkind in ('r', 'S')
order by object_kind, object_name, grantee, privilege_type;
```

### A.3 — MAINTAIN-Verteilungs-Zusammenfassung

| Eigenschaft                                                        | Wert |
|--------------------------------------------------------------------|------|
| Anwendungstabellen mit MAINTAIN gesetzt                            | 41   |
| Anwendungstabellen ohne MAINTAIN (= `health_check`)                | 1    |
| Rollen pro betroffener Tabelle (anon, authenticated, postgres, service_role) | 4    |
| Explizite MAINTAIN-Eintraege (41 × 4)                              | **164** |
| Rolle, fuer die MAINTAIN sicherheitsrelevant ist                    | anon, authenticated |
| Quelle, die MAINTAIN sichtbar macht                                 | `pg_class.relacl + aclexplode()` |
| Quelle, die MAINTAIN **nicht** sichtbar macht                       | `information_schema.role_table_grants` |

### A.4 — Repraesentative `actual_privs`-Beispiele

**Beispiel 1 — `authenticated` auf einer Gruppe-A-Tabelle (z.B. `belege`):**

```
schema_name | object_name | object_kind | grantee       | actual_privs
------------+-------------+-------------+---------------+----------------------------------------------
public      | belege      | table       | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE
```

Erwartet (Migration 0054 Gruppe A): `DELETE, INSERT, SELECT, UPDATE`
(4 Privilegien). Faktisch: 5 Privilegien — **MAINTAIN als Drift**.

**Beispiel 2 — `service_role` auf derselben Tabelle:**

```
schema_name | object_name | object_kind | grantee      | actual_privs
------------+-------------+-------------+--------------+----------------------------------------------------------------------------
public      | belege      | table       | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
```

Erwartet (Migration 0054 service_role uniform): die 7 Privilegien
`DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`.
Faktisch: 8 Privilegien — **MAINTAIN als Drift** (V5-A4 Befund).

**Beispiel 3 — `health_check` (drift-frei):**

```
schema_name | object_name  | object_kind | grantee       | actual_privs
------------+--------------+-------------+---------------+--------------
public      | health_check | table       | anon          | SELECT
public      | health_check | table       | authenticated | SELECT
```

`health_check` enthaelt **kein** MAINTAIN — die einzige drift-freie
oeffentliche Tabelle. Dies bestaetigt, dass die MAINTAIN-Drift nicht aus
einem PG-System-Default stammt (sonst waere `health_check` ebenfalls
betroffen), sondern aus einer impliziten oder expliziten GRANT-Quelle, die
auf 41 Anwendungstabellen wirkt — die Klaerung erfolgt in Charge 22.

**Bestaetigung:** alle Assertions A1-A6 (Sektion 6.6) wurden gegen den
raw-`relacl`-Cross-Check validiert.

---

## Appendix B — Source-of-Truth References

| Source                                                                  | Relevanz                                                  |
|-------------------------------------------------------------------------|-----------------------------------------------------------|
| `docs/staging-rls-verifikation-2026-05-02.md`                           | Charge 18 Diagnostic Outcome (Vorgaenger)                 |
| `docs/journal-entries-inspection-2026-05-02.md`                         | Charge 19 Phase 1 inspection                              |
| `docs/harouda-migrations-update-2026-05-02.md`                          | Tracker (§27 Charge 19, §27.11 Schuld 19-zayin, §28 Charge 20) |
| `supabase/migrations/0052_revoke_anon_dangerous_grants.sql`             | anon REVOKE (Charge 19 Phase 2 Step 1)                    |
| `supabase/migrations/0053_revoke_authenticated_dangerous_grants.sql`    | authenticated REVOKE (Step 2)                             |
| `supabase/migrations/0054_grant_authenticated_public_tables.sql`        | GRANT-baseline (Step 3) — durch V1/V3 in Charge 20 bestaetigt |
| `supabase/migrations/0055_revoke_anon_authenticated_sequence_update.sql`| sequence UPDATE REVOKE (Step 4) — durch V2/V4/V5-A3 bestaetigt |
| HANDOFF_BATCH_12 §8                                                     | Original Test-Matrix-Quelle                               |
| HANDOFF_BATCH_19 §12 + §13                                              | Charge 20 binding scope + Folge-Charges                   |
| Lehre 58 (interner Lehrenkatalog)                                       | `information_schema` ist nicht autoritativ; raw `pg_class.relacl + aclexplode()` ist Pflicht — in Charge 20 empirisch bestaetigt |
| Tracker §27.11 (interner Verweis)                                        | Schuld 19-zayin (sequence-UPDATE-Drift) — durch 0055 geschlossen, V2/V4 bestaetigen Soll-Zustand |
| PostgreSQL 17 Release Notes — Privilege `MAINTAIN`                      | Referenz fuer das in PG 17 eingefuehrte `MAINTAIN`-Privileg (URL bewusst nicht vermerkt; nachzuschlagen in der offiziellen PG-17-Doku) |
| PostgreSQL 17 GRANT-Dokumentation — Tabellen-Privilegien                | Referenz fuer das vollstaendige PG-17-Privilege-Set inkl. MAINTAIN (URL bewusst nicht vermerkt; nachzuschlagen in der offiziellen PG-17-Doku) |

---

**Ende Charge 20 Verifikations-Doku.**

*Branch: `verify/charge-20-compliance-replay`. Letzte synchrone Quelle vor
PR: 49af1aa. PR-Nummer: <PR-NUMBER>.*
