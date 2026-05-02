# Accounting Service Specification v1.0

**Stand:** 2026-05-02
**Schuld:** 14-gimel (Charge 17)
**Status:** Spec — keine Implementierung in dieser Charge

Dieses Dokument definiert den Vertrag (Contract) fuer den Accounting-Service der Harouda-Plattform. Es dient als Grundlage fuer die spaetere Implementierung der RPC-Funktionen in Supabase und der UI-Konsumenten.

**Geltungsbereich:** Doppelte Buchfuehrung gemaess HGB Paragraph 238 ff. fuer deutsche Steuerberatungs-Mandanten. Implementierung der RPCs und unterliegender Tabellen ist Charge 18+, nicht Teil dieser Spec.

**Verwandte Doku:** `docs/architecture-governance.md` (Charge 16), `docs/harouda-migrations-update-2026-05-02.md` (Charge 15).

---

## Section 1 — Scope & Conventions

### 1.1 Doppelte Buchfuehrung

Jeder `Journal Entry` enthaelt mindestens eine Soll- und eine Haben-Zeile. Die Bilanz-Identitaet ist verpflichtend:

```
sum(amount where direction = 'S') == sum(amount where direction = 'H')
```

Diese Regel ist nicht-verhandelbar und wird sowohl client-seitig (`validate_journal_entry`) als auch server-seitig (`post_journal_entry`) erzwungen.

### 1.2 Soll/Haben-Konvention

`direction` wird als `S` (Soll) oder `H` (Haben) kodiert — analog zum bestehenden DB-Schema in `supabase/migrations/0022_belege_persistence.sql` Zeile 90:

```
soll_haben varchar(1) not null check (soll_haben in ('S','H'))
```

Keine Uebersetzungs-Schicht zu `'soll'`/`'haben'`-Strings, um konsistente Werte zwischen Schema und Service-Layer zu gewaehrleisten.

### 1.3 Currency

ISO 4217. Default und einziger erlaubter Wert in V1: `EUR`. Multi-Currency siehe Section 6.1 (Out-of-Scope).

### 1.4 Decimal-Praezision

Geldbetraege ausschliesslich `numeric(15, 2)`. Niemals `float` oder `double`.

**Begruendung:** IEEE-754-Rundungsfehler verletzen Vollstaendigkeit (GoBD Rz. 24 ff.) und produzieren bei Aggregation systematisch falsche Salden. In JSON werden Betraege als String mit Pattern `^\d+\.\d{2}$` uebertragen, um implizite Float-Konversion am Client zu vermeiden.

### 1.5 Zeit-Konvention

- DB: UTC (`timestamptz` fuer Zeitstempel).
- UI: Europe/Berlin.
- `booking_date`, `posting_date`: `date` (kein `timestamp`), da nur das Kalender-Datum buchhalterisch relevant ist.

### 1.6 SKR-Referenz

`SKR03` und `SKR04` werden unterstuetzt. Die Zuordnung pro Mandant erfolgt ueber die Spalte `clients.kontenrahmen`, eingefuehrt in `supabase/migrations/0041_clients_full_stammdaten_expand.sql` Zeile 7:

```
add column if not exists kontenrahmen text not null default 'SKR03'
```

### 1.7 Account Code

`account_code` ist eine 4- bis 10-stellige Ziffernkette (`^\d{4,10}$`), passend zu `beleg_positionen.konto varchar(10)` aus `0022_belege_persistence.sql` Zeile 89. Die groessere Laenge ist notwendig fuer Debitoren- und Kreditoren-Sub-Konten (z. B. `10000`–`69999` in `SKR03` als Personenkonten-Bereich).

### 1.8 Mandantentrennung

Die Trennung erfolgt ausschliesslich ueber `company_id` und die RLS-Funktionen `is_company_member(cid uuid)` und `can_write(cid uuid)` aus `supabase/migrations/0004_multitenant.sql` (Zeilen 64 bzw. 72). Die optionale Spalte `mandant_id` aus `0022_belege_persistence.sql` Zeile 25 ist NICHT der RLS-Schluessel — sie dient ausschliesslich der mandantenseitigen Sub-Klassifikation.

**Compliance-Bezug:** HGB Paragraph 238 ff. (Buchfuehrungspflicht), AO Paragraph 146 (Ordnungsmaessigkeit), GoBD Rz. 24 ff. (Vollstaendigkeit), Paragraph 203 StGB (Berufsgeheimnis StB).

---

## Section 2 — JSON Schema fuer `Journal Entry`

### 2.1 Validierungs-Regeln (server-seitig erzwungen)

1. `lines.length >= 2`.
2. `sum(amount where direction = 'S') == sum(amount where direction = 'H')` (Bilanz-Identitaet).
3. `company_id` muss zum aktuellen `auth.uid()` gehoeren — geprueft via `is_company_member(company_id)` aus `0004_multitenant.sql`.
4. Schreib-Berechtigung wird zusaetzlich ueber `can_write(company_id)` aus `0004_multitenant.sql` geprueft.
5. `account_code` Format-Validierung via Regex `^\d{4,10}$`. **Semantische** Validierung gegen Kontenrahmen-Lookup ist NICHT in V1 enthalten — siehe Section 6.4.

### 2.2 Server-set Felder (readOnly)

Folgende Felder werden vom Server gesetzt und erscheinen ausschliesslich in der Response, **nicht im Input-Payload**:

- `id` — UUID, server-generated via `gen_random_uuid()`. UUIDv7-Migration siehe Schuld `aleph` (architektonisch).
- `created_by` — UUID, gesetzt aus `auth.uid()`.
- `created_at` — `timestamptz`, server-set via `now()` (UTC).

Diese Felder sind im Schema unten als `"readOnly": true` markiert.

### 2.3 Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "harouda://specs/accounting/journal-entry-v1",
  "type": "object",
  "required": ["idempotency_key", "company_id", "booking_date", "lines"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "readOnly": true,
      "description": "Server-generated. UUIDv4 in V1."
    },
    "idempotency_key": {
      "type": "string",
      "format": "uuid",
      "description": "Client-supplied. Siehe Section 3."
    },
    "company_id": {
      "type": "string",
      "format": "uuid",
      "description": "FK auf companies(id). RLS-Schluessel via is_company_member."
    },
    "mandant_id": {
      "type": ["string", "null"],
      "format": "uuid",
      "description": "Optional. Sub-Klassifikation, NICHT RLS-Schluessel. Siehe 0022_belege_persistence.sql Zeile 25."
    },
    "booking_date": {
      "type": "string",
      "format": "date"
    },
    "posting_date": {
      "type": "string",
      "format": "date",
      "description": "Default = booking_date wenn nicht angegeben."
    },
    "period": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}$",
      "description": "Format YYYY-MM. Server-abgeleitet aus booking_date, aber explizit fuer Indexierung gespeichert."
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "lines": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "required": ["account_code", "direction", "amount"],
        "properties": {
          "account_code": {
            "type": "string",
            "pattern": "^\\d{4,10}$"
          },
          "direction": {
            "enum": ["S", "H"]
          },
          "amount": {
            "type": "string",
            "pattern": "^\\d+\\.\\d{2}$",
            "description": "Strikt positiv. Vorzeichen wird durch direction kodiert. String-Repraesentation zur Vermeidung von Float-Konversion."
          },
          "tax_code": {
            "type": "string",
            "description": "Optional. Mappt auf interne Steuer-Klassifikation."
          },
          "description": {
            "type": "string"
          }
        }
      }
    },
    "status": {
      "enum": ["draft", "gebucht", "storniert"],
      "default": "draft"
    },
    "belege": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "description": "Optional. FK auf belege.id (siehe 0022_belege_persistence.sql)."
    },
    "created_by": {
      "type": "string",
      "format": "uuid",
      "readOnly": true,
      "description": "Server-set aus auth.uid()."
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "readOnly": true,
      "description": "Server-set via now() bei Insertion. UTC."
    }
  }
}
```

---

## Section 3 — Idempotency Key

### 3.1 Zweck

Verhindert Doppel-Buchungen bei Netzwerk-Retries oder Client-Reconnects. Eine doppelte Buchung verletzt Vollstaendigkeit (GoBD Rz. 24 ff.) und kann nach Statuswechsel zu `gebucht` nicht mehr rueckgaengig gemacht werden — der Trigger `prevent_gebucht_beleg_mutation` aus `supabase/migrations/0022_belege_persistence.sql` (Funktion in Zeile 134, Trigger-Bindung in Zeile 159) verhindert nachtraegliche Korrekturen. Das unterstreicht die Wichtigkeit eines vorgeschalteten Idempotency-Mechanismus.

### 3.2 Generierung

- Client erzeugt `UUIDv4` (V1).
- Migration zu `UUIDv7` siehe Schuld `aleph` (architektonisch). Bessere Sortierbarkeit und Zeit-Korrelation, kein Funktions-Bruch erwartet.

### 3.3 Persistenz

Tabelle `journal_idempotency` (Migration in Charge 18+ — Schema-Vorschlag):

| Spalte | Typ | Constraint |
|--------|-----|------------|
| `key` | `uuid` | Primary Key |
| `company_id` | `uuid` | NOT NULL, FK auf `companies(id)` |
| `journal_entry_id` | `uuid` | NOT NULL, FK auf `journal_entries(id)` |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

Zusaetzlicher Unique-Constraint: `(company_id, key)`.

RLS-Policies analog zum Pattern aus `supabase/migrations/0048_fix_rls_belege_leak.sql`:

- SELECT: `is_company_member(company_id)`.
- INSERT: `can_write(company_id)`.
- UPDATE/DELETE: nicht erlaubt (Idempotency-Records sind immutable).

### 3.4 Verhalten bei API-Aufruf

| Szenario | Response-Body | HTTP-Status |
|----------|---------------|-------------|
| Erster Aufruf mit Key K | `{ "journal_entry_id": "...", "status": "created" }` | `200 OK` |
| Wiederholter Aufruf mit Key K, identischem Body | `{ "journal_entry_id": "...", "status": "duplicate" }` | `200 OK` |
| Aufruf mit Key K, **abweichendem** Body | `{ "error": "idempotency_conflict", "details": "..." }` | `409 Conflict` |

### 3.5 TTL

Keine. Idempotency-Records sind permanent zur Nachvollziehbarkeit. Cleanup nur bei DSGVO-Loeschanfragen ueber das zentrale Loesch-Verfahren — Detail-Spec in Charge 18+ bzw. Spec V2.

**Compliance-Bezug:** GoBD Rz. 24 ff. (Vollstaendigkeit), GoBD Rz. 64 (Unveraenderbarkeit gebuchter Belege — durchgesetzt durch `prevent_gebucht_beleg_mutation` seit `0022_belege_persistence.sql`).

---

## Section 4 — RPC Contracts

Drei Supabase-RPCs werden spezifiziert. Implementierung erfolgt in Charge 18+.

**Begruendung fuer RPC-Layer statt direkten Table-Access:**

1. Atomare Validierung + Insertion innerhalb einer Transaktion.
2. Server-seitige Idempotency-Logik (kann nicht client-seitig zuverlaessig erzwungen werden).
3. Single Source of Truth fuer Validierungs-Regeln.
4. Vermeidet zusaetzliche Round-Trips fuer Vorab-Queries.
5. Konsistent mit dem bestehenden RLS-Pattern aus `0048_fix_rls_belege_leak.sql` (`is_company_member` / `can_write`).

### 4.1 `post_journal_entry(payload jsonb) returns jsonb`

**Wirkung:** Atomare Validierung, Idempotency-Check und Insertion (Entry + Lines + Idempotency-Record).

**RLS-Pruefung:** Funktion verifiziert `is_company_member((payload->>'company_id')::uuid)` und `can_write((payload->>'company_id')::uuid)` aus `supabase/migrations/0004_multitenant.sql`.

**Response (Success — Created):**

```json
{
  "journal_entry_id": "<uuid>",
  "status": "created"
}
```

**Response (Success — Idempotency Hit):**

```json
{
  "journal_entry_id": "<uuid>",
  "status": "duplicate"
}
```

**Response (Error):**

```json
{
  "error": "<code>",
  "details": "..."
}
```

**Error-Codes:**

| Code | Bedeutung | HTTP-Status |
|------|-----------|-------------|
| `validation_failed` | Schema-Validierung fehlgeschlagen (Pflichtfeld fehlt, Regex verletzt, etc.). | `400` |
| `imbalance` | Summe Soll != Summe Haben. | `400` |
| `idempotency_conflict` | Idempotency-Key bereits verwendet, aber mit abweichendem Body. | `409` |
| `company_access_denied` | `is_company_member((payload->>'company_id')::uuid)` lieferte `false`. | `403` |

**Transaktional:** Ja. Bei Fehlschlag in `lines`-Insertion oder `journal_idempotency`-Insertion wird der gesamte Entry zurueckgerollt (`ROLLBACK`).

**Begruendung fuer Weglassen von `unknown_account`:** Eine `chart_of_accounts`-Lookup-Tabelle existiert in V1 nicht (siehe Section 6.4). Die Validierung beschraenkt sich auf Format-Regex `^\d{4,10}$`. Wuerde der Code `unknown_account` zurueckgegeben, ohne dass eine semantische Pruefung moeglich ist, waere er irrefuehrend.

### 4.2 `validate_journal_entry(payload jsonb) returns jsonb`

**Wirkung:** READ-ONLY. Prueft Payload gegen das Schema aus Section 2 und die Soll/Haben-Bilanz-Regel. Keine Insertion, keine Idempotency-Pruefung. Verwendet fuer Live-Validation in der UI vor dem Senden.

**Implementierungs-Hinweis:** Wiederverwendet die intern gleiche Validierungs-Logik wie `post_journal_entry`, aber ohne Insertion und ohne Datenbank-Schreibzugriff. `is_company_member((payload->>'company_id')::uuid)` aus `0004_multitenant.sql` wird WEITERHIN geprueft, damit der Validation-Endpoint nicht zur Mandanten-Aufklaerung missbraucht werden kann (z. B. "existiert diese `company_id`?").

**Response (Valid):**

```json
{ "valid": true }
```

**Response (Invalid):**

```json
{
  "valid": false,
  "errors": [
    { "path": "lines[1].amount", "code": "pattern_mismatch", "message": "..." },
    { "path": "lines", "code": "imbalance", "message": "Soll 100.00 != Haben 95.00" }
  ]
}
```

### 4.3 `get_journal_entry(entry_id uuid) returns jsonb`

**Wirkung:** Liefert vollstaendigen Entry inkl. aller `lines`.

**RLS:** Filtert ueber `is_company_member(company_id)` aus `0004_multitenant.sql` analog zum Pattern fuer `belege` in `supabase/migrations/0048_fix_rls_belege_leak.sql`.

**Response (gefunden):** Vollstaendiges Entry-Objekt gemaess Schema in Section 2 (inkl. `id`, `created_by`, `created_at`).

**Response (nicht gefunden ODER kein Zugriff):**

```json
{ "error": "not_found_or_no_access" }
```

**Bewusst keine Unterscheidung** zwischen "existiert nicht" und "kein Zugriff" — verhindert Mandanten-Aufklaerung ueber UUID-Probing.

---

## Section 5 — Compliance-Mapping

| Norm | Bezug | Mechanismus |
|------|-------|-------------|
| HGB Paragraph 238 ff. (Buchfuehrungspflicht) | Doppelte Buchfuehrung, Vollstaendigkeit | JSON-Schema-Validierung (Section 2) + Soll=Haben-Check in `post_journal_entry` |
| HGB Paragraph 257 (Aufbewahrung 10 Jahre) | Datenbestand-Erhalt | DB-Persistenz + Backup-Strategie + GoBD-konformer Storage-Schema (`supabase/migrations/0046_documents_storage_schema.sql`) |
| AO Paragraph 146 (Ordnungsmaessigkeit) | Zeitnah, vollstaendig, geordnet | `created_at` server-set, Idempotency-Key (Section 3), Period-Index |
| AO Paragraph 147 (Aufbewahrungspflicht) | 10 Jahre digitalisiert | DB + Backup-Strategie |
| GoBD Rz. 24 ff. (Vollstaendigkeit) | Keine Lueckenhaftigkeit | Idempotency (Section 3), atomare Transaktion in `post_journal_entry` (Section 4.1) |
| GoBD Rz. 64 (Unveraenderbarkeit gebuchter Belege) | Keine Mutation nach `gebucht`-Status | `prevent_gebucht_beleg_mutation`-Trigger aus `0022_belege_persistence.sql` (Funktion Zeile 134, Trigger Zeile 159) |
| GoBD Rz. 100 ff. (Datensicherheit) | RLS, Audit-Log | `is_company_member` und `can_write` aus `0004_multitenant.sql`, durchgesetzt fuer `belege` in `0048_fix_rls_belege_leak.sql` |
| Paragraph 203 StGB (Berufsgeheimnis StB) | Strikte Mandantentrennung | RLS ueber `company_id` — kein mandantenuebergreifender Zugriff moeglich |

**TODO bei Implementierung — Ruecksprache mit StB / Fachanwalt erforderlich:**

- Konkrete Loesch-Policy nach Ablauf der 10-Jahres-Frist (HGB Paragraph 257 vs. DSGVO Art. 17 — Spannungsfeld zwischen Aufbewahrungspflicht und Recht auf Vergessenwerden).
- Konkrete Audit-Log-Anforderungen fuer `post_journal_entry`-Aufrufe (separate Tabelle `journal_audit_log` vs. Postgres-Logs vs. Supabase Realtime).
- Pruefung, ob `journal_idempotency`-Records ebenfalls 10 Jahre aufbewahrungspflichtig sind oder nur die `journal_entries` selbst.

---

## Section 6 — Out-of-Scope fuer V1

Die folgenden Features sind konzeptionell vorgesehen, aber nicht Teil der V1-Implementierung. Jeder Punkt erhaelt im Lauf der weiteren Architektur-Phasen ein eigenes Spec-Dokument bzw. eine eigene Schuld.

### 6.1 Multi-Currency

Keine Fremdwaehrungs-Buchungen. Nur `EUR`. Bei spaeterer Erweiterung: zusaetzliche Spalten `currency`, `exchange_rate`, `amount_eur` in `journal_lines`. Spec V2.

### 6.2 Stornierungen

Konzeptionell vorgesehen via `status = 'storniert'`, aber Stornierungs-Buchung als separate `Journal Entry` mit `reverses`-FK auf Original ist in V1 nicht spezifiziert. Spec V2.

### 6.3 Periodischer Abschluss

Monats-/Jahres-Abschluss-Logik (Saldenvortraege, GuV-Verrechnung, Bilanz-Erzeugung) nicht spezifiziert. Spec V2.

### 6.4 Kontenrahmen-Lookup-Validierung

**Eine `chart_of_accounts`-Tabelle existiert in V1 nicht.** `account_code` wird ausschliesslich ueber das Regex-Pattern `^\d{4,10}$` formal-validiert. Eine semantische Validierung gegen den jeweiligen `SKR03`- oder `SKR04`-Kontenplan setzt das Anlegen einer Lookup-Tabelle voraus (mit Spalten `account_code`, `kontenrahmen`, `bezeichnung`, `kontenart`).

Verfolgt als Schuld `17-aleph` (mittel-hoch, hoch). Bis dahin liegt die Verantwortung fuer die semantische Korrektheit der `account_code`-Werte beim Client.

### 6.5 UStVA-Generierung

ELSTER-konforme Umsatzsteuer-Voranmeldung. Eigenes Spec-Dokument: `docs/architecture/specs/elster-ustva-v1.md` (zukuenftig).

### 6.6 ELSTER-Schnittstelle

Allgemeine ELSTER-Integration (UStVA, EUER, ESt, E-Bilanz). Eigenes Spec-Dokument.

### 6.7 DATEV-Export (Buchungsstapel)

DATEV-konformer Buchungsstapel-Export gemaess DATEV-Schnittstellenbeschreibung. Eigenes Spec-Dokument.

### 6.8 E-Bilanz / XBRL

Taxonomie 6.x. Eigenes Spec-Dokument.

### 6.9 EUER (Anlage)

Einnahmen-Ueberschuss-Rechnung — separate Logik, KEINE doppelte Buchfuehrung. Eigenes Spec-Dokument.

### 6.10 Audit-Log fuer RPC-Aufrufe

Ein dediziertes Audit-Log (welcher Nutzer hat wann welchen Entry erstellt/gelesen) ist in V1 nicht spezifiziert. `created_by` und `created_at` auf `journal_entries` sind das Minimum. Vollstaendiger Audit-Trail ist Spec V2 — siehe TODO in Section 5.

---

## Anhang A — Verwandte Dateien im Repo

| Datei | Bezug |
|-------|-------|
| `supabase/migrations/0004_multitenant.sql` | Definition `is_company_member` (Zeile 64), `can_write` (Zeile 72) |
| `supabase/migrations/0022_belege_persistence.sql` | `belege`, `beleg_positionen`, `prevent_gebucht_beleg_mutation` (Funktion Zeile 134, Trigger Zeile 159) |
| `supabase/migrations/0041_clients_full_stammdaten_expand.sql` | Spalte `clients.kontenrahmen` (Zeile 7) |
| `supabase/migrations/0046_documents_storage_schema.sql` | Storage-Schema fuer Belege (GoBD-konform) |
| `supabase/migrations/0048_fix_rls_belege_leak.sql` | RLS-Pattern-Referenz fuer `belege`/`beleg_positionen` |
| `docs/architecture-governance.md` | Uebergeordnete Architektur-Konventionen (Charge 16) |
| `docs/harouda-migrations-update-2026-05-02.md` | Stand der angewendeten Migrations (Charge 15) |

---

**Ende der Spec v1.0.**
