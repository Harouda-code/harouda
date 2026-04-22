# OPEN-QUESTION: Sprint 20.C.0 — DB-SQL-Verifikation nicht lokal ausführbar

**Erstellt:** 2026-04-22
**Status:** **DEFERRED bis Pre-Production-Deploy** (Project-Owner-Entscheidung 2026-04-22)
**Ursprung:** Sprint-20.C-Spec Schritt 20.C.0
**Gate:** Aktuelles Sprint-20-Gate ist **nicht** blockiert. Wiederaktivierung siehe unten.

## Kontext

Sprint 20.C.0 verlangt, dass die DB-seitigen `canonical_json_bpv()` /
`canonical_json_uv()`-Funktionen (Migration 0039) **byte-identische**
Outputs zu den Client-Fixtures in
`src/lib/crypto/__tests__/chain.db-client-consistency.test.ts`
liefern. Ohne diese Verifikation wird die Hash-Chain-Infrastruktur
aus Sprint 20.B nicht produktiv eingesetzt.

## Blocker

In der aktuellen Entwicklungsumgebung sind **weder `psql` noch
`docker` noch Docker-Desktop** verfügbar (`which psql` / `which docker`
liefern beide „not found"). Die Supabase-CLI ist zwar installiert
(v2.90.0), `supabase db start` scheitert jedoch an fehlendem
Docker-Daemon.

**Konsequenz:** Die Verifikation muss **manuell vom Project-Owner**
gegen eine echte Postgres- oder Supabase-Instanz laufen. Bis die
Outputs zurückgemeldet und geprüft sind, bleibt Gate 20.C.0 rot.
Schritt 20.C.1 (UI-Bau) darf laut Spec nicht begonnen werden.

## Manuelle Validierungs-Anleitung

### Voraussetzungen

- Postgres ≥ 13 mit aktivierter `pgcrypto`-Extension.
- Migration 0039 (sowie alle vorherigen 0001–0038) eingespielt.
- Zugriff per `psql` oder Supabase SQL Editor.

### Alternative: lokale Docker-Postgres

```bash
# Einmaliges Setup (falls Docker nachträglich installiert):
docker run -d --name harouda-verify-pg \
  -e POSTGRES_PASSWORD=verify -p 5432:5432 postgres:16

# Migrationen 0001 .. 0039 einspielen
for f in supabase/migrations/*.sql; do
  psql -h localhost -U postgres -d postgres -f "$f"
done
```

### SQL-Queries (alle 5 Fixtures)

Jedes der fünf Snippets muss byte-genau einen vorgegebenen canonical-
String liefern. Die Expected-Strings stehen als String-Literale im
Test-File `src/lib/crypto/__tests__/chain.db-client-consistency.test.ts`
unter den Konstanten `FIXTURE_1_CANONICAL` … `FIXTURE_5_CANONICAL`.

```sql
-- =========================================================================
-- FIXTURE 1 — BPV Genesis, simpler snapshot
-- =========================================================================
SELECT public.canonical_json_bpv(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  1,
  '{"k":"v"}'::jsonb,
  '2025-01-01T00:00:00Z'::timestamptz,
  'ORGANISATIONSUNTERLAGE_10J'
) AS canonical;

-- Erwartet (byte-genau):
-- {"aufbewahrungs_kategorie":"ORGANISATIONSUNTERLAGE_10J","partner_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","snapshot":{"k":"v"},"valid_from":"2025-01-01T00:00:00.000000Z","version_number":1}

SELECT public.compute_bpv_hash(
  NULL,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  1,
  '{"k":"v"}'::jsonb,
  '2025-01-01T00:00:00Z'::timestamptz,
  'ORGANISATIONSUNTERLAGE_10J'
) AS hash;
-- Der Hash muss identisch sein zu:
--   sha256hex('0'*64 || '|' || <FIXTURE_1_CANONICAL>)
-- Client-seitig in Test #1 via expectedChainHash(null, FIXTURE_1_CANONICAL)
-- berechnet und dort gegen computeChainHash(null, input) gegenüber-geprüft.


-- =========================================================================
-- FIXTURE 2 — BPV version 2 mit prev_hash
-- =========================================================================
SELECT public.canonical_json_bpv(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  2,
  '{"name":"Müller"}'::jsonb,
  '2025-06-01T12:00:00Z'::timestamptz,
  'ORGANISATIONSUNTERLAGE_10J'
) AS canonical;

-- Erwartet:
-- {"aufbewahrungs_kategorie":"ORGANISATIONSUNTERLAGE_10J","partner_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","snapshot":{"name":"Müller"},"valid_from":"2025-06-01T12:00:00.000000Z","version_number":2}

SELECT public.compute_bpv_hash(
  repeat('1', 64),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  2,
  '{"name":"Müller"}'::jsonb,
  '2025-06-01T12:00:00Z'::timestamptz,
  'ORGANISATIONSUNTERLAGE_10J'
) AS hash;


-- =========================================================================
-- FIXTURE 3 — BPV Unicode (Umlaute + Emoji + null-Feld)
-- =========================================================================
SELECT public.canonical_json_bpv(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  1,
  '{"name":"Müller & Söhne 🛡️","plz":null}'::jsonb,
  '2026-04-22T10:15:30Z'::timestamptz,
  'GESCHAEFTSBRIEF_6J'
) AS canonical;

-- Erwartet:
-- {"aufbewahrungs_kategorie":"GESCHAEFTSBRIEF_6J","partner_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","snapshot":{"name":"Müller & Söhne 🛡️","plz":null},"valid_from":"2026-04-22T10:15:30.000000Z","version_number":1}


-- =========================================================================
-- FIXTURE 4 — UV mit null partner_id, ohne raw_response
-- =========================================================================
SELECT public.canonical_json_uv(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  NULL,
  'DE123456789',
  '',
  'VALID',
  'BZST',
  '2026-01-01T10:15:30Z'::timestamptz
) AS canonical;

-- Erwartet:
-- {"created_at":"2026-01-01T10:15:30.000000Z","id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","partner_id":null,"raw_response_sha256":"","requested_ust_idnr":"DE123456789","verification_source":"BZST","verification_status":"VALID"}


-- =========================================================================
-- FIXTURE 5 — UV VIES mit raw_http_response (Base64 "AAAA" = [0,0,0])
-- =========================================================================
-- Sub-Hash: SHA-256 der drei Null-Bytes.
SELECT encode(digest(decode('AAAA', 'base64'), 'sha256'), 'hex') AS raw_sha;
-- Erwartet (NIST-Referenz):
-- 709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c

SELECT public.canonical_json_uv(
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  'ATU12345678',
  '709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c',
  'VALID',
  'VIES',
  '2026-02-14T08:30:45Z'::timestamptz
) AS canonical;

-- Erwartet:
-- {"created_at":"2026-02-14T08:30:45.000000Z","id":"cccccccc-cccc-cccc-cccc-cccccccccccc","partner_id":"dddddddd-dddd-dddd-dddd-dddddddddddd","raw_response_sha256":"709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c","requested_ust_idnr":"ATU12345678","verification_source":"VIES","verification_status":"VALID"}


-- =========================================================================
-- ZUSÄTZLICHER END-TO-END-TEST
-- =========================================================================
-- Einen BPV-Row über die Trigger einfügen und prüfen, dass
-- version_hash + prev_hash gesetzt werden.
-- (Braucht einen existierenden business_partners-Record — aus
--  Sprint-18/19-Seed).
--
-- INSERT INTO public.business_partners_versions (
--   partner_id, company_id, client_id, version_number,
--   snapshot, valid_from
-- ) VALUES (
--   '<existing-partner-uuid>',
--   '<company-uuid>',
--   '<client-uuid>',
--   1,
--   '{"k":"v"}'::jsonb,
--   '2025-01-01T00:00:00Z'::timestamptz
-- ) RETURNING version_id, prev_hash, version_hash, server_recorded_at;
--
-- Erwartung: prev_hash IS NULL (Genesis), version_hash = 64-hex,
-- server_recorded_at = now().
```

## Erforderliches Rückmelde-Format

Damit ich Gate 20.C.0 grün setzen und mit 20.C.1 fortfahren kann,
bitte eines der folgenden Formate zurückgeben:

### Option A: SQL-Outputs als Text

Ergebnisse aller 5 Fixtures + des END-TO-END-Tests als wörtliche
Strings. Ich prüfe byte-genau gegen die Expected-Werte.

### Option B: Kurze PASS/FAIL-Meldung

```
Fixture 1: PASS
Fixture 2: PASS
Fixture 3: PASS
Fixture 4: PASS
Fixture 5: PASS
E2E-Insert: PASS (version_hash gesetzt, prev_hash=NULL)
```

### Option C: Fail-Analyse

Falls ein Fixture fehlschlägt — welche Bytes weichen ab? Diff-Hexdump
oder explizites Nebeneinander actual/expected.

## Alternative Eskalation

Falls Docker nachträglich installiert wird, kann ich die Verifikation
selbst fahren — entsprechende Freigabe („Docker ist jetzt verfügbar,
fahre 20.C.0 selbst") reicht dann aus.

---

## Gate-Entscheidung (Project-Owner)

- **Datum:** 2026-04-22
- **Entscheidung:** DEFERRED bis Pre-Production-Deploy.
- **Grund:** Das Projekt läuft aktuell ausschließlich im DEMO-Mode
  (localStorage). Es existiert keine aktive Supabase-Staging-Instanz,
  gegen die die SQL-Verifikation laufen könnte. Das ist explizit
  **kein Blocker für Sprint 20**, sondern ein
  **Pre-Production-Deploy-Blocker**.
- **Bedingung für Reaktivierung:** Vor dem **ersten Supabase-Deploy**
  mit echtem Mandanten-Traffic muss die SQL-Verifikation zwingend
  durchgeführt werden. Ohne 5/5 PASS kein Production-Traffic — die
  Hash-Chain-Infrastruktur wäre sonst nicht byte-identisch zwischen
  Client und DB, was die tamper-evidence-Garantie bricht.
- **Verantwortlich:** Project-Owner beim Deploy (mit Steuerberater-
  Sign-off gekoppelt).
- **Nachverfolgung:** offenes Ticket
  [`docs/tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md`](./tech-debt/TECH-DEBT-SPRINT-20-DB-VERIFIKATION-PRE-DEPLOY.md)
  mit Priorität HIGH.
- **Sprint-20-Status:** Sprint 20 schließt ohne DB-Verifikation —
  Gate 20.C wird ohne 20.C.0 evaluiert (Spec-Abweichung bewusst vom
  Project-Owner freigegeben).

## Checkliste vor Production-Deploy

- [ ] Docker Desktop oder Remote-Supabase-Zugang verfügbar (siehe
  „Manuelle Validierungs-Anleitung" oben).
- [ ] Migration 0039 auf der Ziel-Postgres eingespielt (gemeinsam mit
  0001–0038 + 0040+, falls bis dahin weitere Sprints Migrationen
  hinzugefügt haben).
- [ ] 5 SQL-Queries aus diesem Dokument auf der Ziel-DB ausgeführt.
- [ ] Alle 5 Outputs **byte-identisch** mit den
  `FIXTURE_*_CANONICAL`-Konstanten aus
  `src/lib/crypto/__tests__/chain.db-client-consistency.test.ts`
  verglichen.
- [ ] End-to-End-Trigger-Test gelaufen (BPV-Row-Insert → Trigger setzt
  `prev_hash`, `version_hash`, `server_recorded_at`).
- [ ] Report-Datei `docs/SPRINT-20-C-DB-VERIFIKATION-REPORT.md`
  erstellt, Outputs wörtlich dokumentiert, Steuerberater-Sign-off
  darunter gezeichnet.

**Bis zu diesem Punkt:** Sprint 20 läuft im DEMO-Modus; 20.C-UI + Chain-Infra
sind geplant und getestet, aber der Supabase-Branch der Chain-Hash-
Erzeugung wurde nur per Spec verifiziert, nicht per DB-Lauf.
