# Extract: accounting-service-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/accounting-service-v1.md
- Dateigröße: 18.6 KB
- Zeilenanzahl: 429
- Erstellt am: 2026-05-02T17:12:56+02:00
- Erste H1-Überschrift im Dokument: Accounting Service Specification v1.0

## 2. Zweck der Spec (in einem Satz)
Definiert den Vertrag (Contract) für den Accounting-Service der Harouda-Plattform als Grundlage für die spätere Implementierung der RPC-Funktionen in Supabase und der UI-Konsumenten.

## 3. Hauptthemen (max 5 Bullet Points)
- Doppelte Buchführung gemäß HGB § 238 ff. mit verpflichtender Bilanz-Identität Soll=Haben
- JSON-Schema-Vertrag für `Journal Entry` (Pflichtfelder, Validierungsregeln, Server-set Felder)
- Idempotency-Key-Mechanismus zur Vermeidung von Doppelbuchungen
- Drei Supabase-RPC-Contracts: `post_journal_entry`, `validate_journal_entry`, `get_journal_entry`
- Compliance-Mapping HGB/AO/GoBD/StGB plus explizite V1-Scope-Begrenzungen

## 4. Schema-Vorschläge
- Tabellenname: `journal_idempotency`
- Hauptzweck: Persistiert Idempotency-Keys pro Journal-Entry, verhindert Doppelbuchungen bei Retries.
- Schlüsselfelder: `key` (uuid PK), `company_id` (uuid NOT NULL, FK companies), `journal_entry_id` (uuid NOT NULL, FK journal_entries), `created_at` (timestamptz NOT NULL DEFAULT now())
- Constraints/Trigger erwähnt: ja — UNIQUE `(company_id, key)`; RLS-Policies SELECT via `is_company_member`, INSERT via `can_write`, kein UPDATE/DELETE (immutable).

Implizit referenziert (nicht in dieser Spec neu definiert): `journal_entries` mit `lines`, `direction`, `amount` (`numeric(15,2)`), `period` (Format `YYYY-MM`), `belege` als FK-Array, `created_by`, `created_at`.

## 5. Workflow-Definitionen
- Name: `post_journal_entry(payload jsonb) returns jsonb`
- Auslöser: Client-RPC-Call mit Idempotency-Key + Journal-Entry-Payload
- Hauptschritte:
  - JSON-Schema-Validierung gegen Section 2
  - Bilanz-Identität prüfen (Soll=Haben)
  - `is_company_member` + `can_write` gegen `payload.company_id`
  - Idempotency-Check; bei Hit Response `status: duplicate`
  - Atomare Insertion (Entry + Lines + Idempotency-Record), bei Fehler ROLLBACK
- Beteiligte Module/Domänen: Accounting (`journal_entries`), Idempotency (`journal_idempotency`), Multitenancy (`is_company_member`/`can_write`)

- Name: `validate_journal_entry(payload jsonb) returns jsonb`
- Auslöser: Live-UI-Validation vor dem eigentlichen `post_journal_entry`
- Hauptschritte:
  - Schema-Validierung (Pflichtfelder, Regex, Enum-Werte)
  - Bilanz-Identitäts-Check
  - `is_company_member`-Check (verhindert Mandanten-Aufklärung)
  - Keine Insertion, keine Idempotency-Prüfung, kein DB-Schreibzugriff
  - Response: `valid: true` oder `valid: false` mit `errors[]`
- Beteiligte Module/Domänen: Accounting, Multitenancy

- Name: `get_journal_entry(entry_id uuid) returns jsonb`
- Auslöser: Lese-RPC-Call mit Entry-ID
- Hauptschritte:
  - RLS-Filter über `is_company_member(company_id)`
  - Vollständiges Entry inkl. aller `lines` liefern
  - Bei "nicht gefunden" ODER "kein Zugriff": einheitliche `not_found_or_no_access`-Response
- Beteiligte Module/Domänen: Accounting, Multitenancy

## 6. Rechtsgrundlagen-Erwähnungen
- "HGB Paragraph 238 ff." — Buchführungspflicht; Doppelte Buchführung als nicht-verhandelbare Regel, Bilanz-Identität Soll=Haben verpflichtend (Section 1.1, Section 5).
- "HGB Paragraph 257" — Aufbewahrungspflicht 10 Jahre; im Compliance-Mapping (Section 5) als "Datenbestand-Erhalt"-Anker, plus Spannungsfeld zu DSGVO Art. 17 als TODO.
- "AO Paragraph 146" — Ordnungsmäßigkeit; "Zeitnah, vollständig, geordnet" — implementiert via `created_at` server-set, Idempotency-Key, Period-Index.
- "AO Paragraph 147" — Aufbewahrungspflicht; "10 Jahre digitalisiert" über DB + Backup-Strategie.
- "GoBD Rz. 24 ff." — Vollständigkeit; mehrfach zitiert als Grundlage für Idempotency-Mechanismus.
- "GoBD Rz. 64" — Unveränderbarkeit gebuchter Belege; durchgesetzt durch `prevent_gebucht_beleg_mutation`-Trigger aus 0022.
- "GoBD Rz. 100 ff." — Datensicherheit; RLS und Audit-Log über `is_company_member` und `can_write`.
- "Paragraph 203 StGB" — Berufsgeheimnis StB; strikte Mandantentrennung über `company_id`, kein mandantenübergreifender Zugriff möglich.
- "DSGVO Art. 17" — Recht auf Vergessenwerden; im TODO als Spannungsfeld zur 10-Jahres-Aufbewahrung.

## 7. Rule-ID-Erwähnungen
Keine Rule-IDs erwähnt.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Doppelte Buchfuehrung gemaess HGB Paragraph 238 ff. fuer deutsche Steuerberatungs-Mandanten."
- "Die Bilanz-Identitaet ist verpflichtend: sum(amount where direction = 'S') == sum(amount where direction = 'H')."
- "Keine Uebersetzungs-Schicht zu 'soll'/'haben'-Strings, um konsistente Werte zwischen Schema und Service-Layer zu gewaehrleisten."
- "Default und einziger erlaubter Wert in V1: EUR."
- "Geldbetraege ausschliesslich `numeric(15, 2)`. Niemals `float` oder `double`."
- "DB: UTC (`timestamptz` fuer Zeitstempel). UI: Europe/Berlin."
- "Die Trennung erfolgt ausschliesslich ueber `company_id` und die RLS-Funktionen `is_company_member(cid uuid)` und `can_write(cid uuid)`."
- "Idempotency-Records sind permanent zur Nachvollziehbarkeit. Cleanup nur bei DSGVO-Loeschanfragen."
- "Bewusst keine Unterscheidung zwischen 'existiert nicht' und 'kein Zugriff' — verhindert Mandanten-Aufklaerung ueber UUID-Probing."
- "Eine `chart_of_accounts`-Tabelle existiert in V1 nicht. `account_code` wird ausschliesslich ueber das Regex-Pattern `^\\d{4,10}$` formal-validiert."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "TODO bei Implementierung — Ruecksprache mit StB / Fachanwalt erforderlich:" (Section 5)
- "Konkrete Loesch-Policy nach Ablauf der 10-Jahres-Frist (HGB Paragraph 257 vs. DSGVO Art. 17 — Spannungsfeld zwischen Aufbewahrungspflicht und Recht auf Vergessenwerden)."
- "Konkrete Audit-Log-Anforderungen fuer `post_journal_entry`-Aufrufe (separate Tabelle `journal_audit_log` vs. Postgres-Logs vs. Supabase Realtime)."
- "Pruefung, ob `journal_idempotency`-Records ebenfalls 10 Jahre aufbewahrungspflichtig sind oder nur die `journal_entries` selbst."
- "Verfolgt als Schuld `17-aleph` (mittel-hoch, hoch)" — für `chart_of_accounts`-Lookup-Tabelle.
- "UUIDv7-Migration siehe Schuld `aleph` (architektonisch)" — als spätere Erweiterung.

## 10. Verweise auf andere Specs
- "`docs/architecture-governance.md` (Charge 16)" — übergeordnete Architektur-Konventionen.
- "`docs/harouda-migrations-update-2026-05-02.md` (Charge 15)" — Stand der angewendeten Migrations.
- "`docs/architecture/specs/elster-ustva-v1.md` (zukuenftig)" — UStVA-Generierung als geplante zukünftige Spec.
- Weitere zukünftige Specs erwähnt (E-Bilanz/XBRL, DATEV-Export, EUER, ELSTER-Schnittstelle, Stornierungen V2, Periodischer Abschluss V2, Multi-Currency V2, Audit-Log V2) — alle als zu schreibende Folge-Specs ohne konkrete Dateinamen.

## 11. Technische Stack-Erwähnungen
- PostgreSQL: `numeric(15, 2)`, `timestamptz`, `date`, `gen_random_uuid()`, `now()` — als Schema-Bausteine genannt.
- Supabase: RPC-Funktionen als zentrale API-Schicht (`post_journal_entry`, `validate_journal_entry`, `get_journal_entry`); Supabase Realtime als Optionsverweis im Audit-Log-TODO.
- RLS / Row-Level-Security: explizit über `is_company_member`/`can_write` aus 0004_multitenant.sql, durchgesetzt mit Pattern aus 0048_fix_rls_belege_leak.sql.
- Trigger: `prevent_gebucht_beleg_mutation` aus 0022_belege_persistence.sql wird zitiert als Mechanismus gegen Mutation nach Status `gebucht`.
- JSON Schema draft 2020-12: für den `Journal Entry`-Vertrag (`$schema: https://json-schema.org/draft/2020-12/schema`).
- Keine React/TypeScript-Erwähnung.
