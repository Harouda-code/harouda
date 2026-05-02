# Staging-RLS-Verifikation — 2026-05-02

**Charge:** 18 — Compliance-Verifikation (Schuld 10-aleph)
**Tester:** Abdullah
**Datum:** 2026-05-02
**Test-Umgebung:** Supabase-Project `harouda` (eu-central-1, Free Plan, NANO-Compute)
**Branch:** `docs/staging-rls-verifikation-2026-05-02`
**Klassifikation:** **Diagnostic Outcome — Verifikation prerequisites not met**

---

## 1 — Zusammenfassung (TL;DR)

Charge 18 sollte die manuelle RLS-Verifikation gemaess Test-Matrix aus `HANDOFF_BATCH_12.md` § 8 (11 Szenarien) durchfuehren. Beim ersten Test (`Mandant A liest eigene belege`) wurde der Versuch durch einen `42501: permission denied`-Fehler abgebrochen.

Die anschliessende systematische Diagnose ergab, dass **keiner** der drei Anwendungs-Rollen (`authenticated`, `anon`, `service_role`) auf irgendeine der 41 Tabellen im `public`-Schema zugreifen kann. Der Grund: `GRANT`-Statements fehlen flaechendeckend.

**Konsequenz:** Die Test-Matrix konnte nicht durchgefuehrt werden, weil sie eine Voraussetzung nicht erfuellt: dass Anwendungs-Rollen die Tabellen ueberhaupt erreichen koennen. Das Problem liegt eine Ebene unter RLS und blockiert die Verifikation vollstaendig.

Die RLS-Policies sind syntaktisch korrekt definiert, aber **operativ nicht testbar**, solange die `GRANT`-Schicht fehlt. Charge 18 wird daher als reines Diagnose-Ergebnis abgeschlossen. Die Behebung erfolgt in Charge 19, die Wiederholung der Verifikation in Charge 20.

---

## 2 — Test-Matrix (Soll-Zustand)

Quelle: `HANDOFF_BATCH_12.md` § 8.

| # | Aktion | Erwartet | Ist |
|---|--------|----------|-----|
| 1 | Mandant A liest eigene `belege` | erlaubt, alle Eintraege sichtbar | **BLOCKED** (GRANT fehlt) |
| 2 | Mandant A liest `belege` von B | 0 rows | **BLOCKED** (GRANT fehlt) |
| 3 | Mandant A `INSERT` mit `company_id = a` | erlaubt | **BLOCKED** (GRANT fehlt) |
| 4 | Mandant A `INSERT` mit `company_id = b` | blockiert | **BLOCKED** (GRANT fehlt) |
| 5 | Mandant A `UPDATE` von eigenen `belege` (nicht freigegeben) | erlaubt | **BLOCKED** (GRANT fehlt) |
| 6 | Mandant A `UPDATE` von `belege` von B | blockiert | **BLOCKED** (GRANT fehlt) |
| 7 | Mandant A `DELETE` eigenes `belege` (nicht freigegeben) | erlaubt | **BLOCKED** (GRANT fehlt) |
| 8 | Mandant A `UPDATE` auf geschuetztes Feld eines `GEBUCHT`-Beleg | blockiert (Trigger) | **BLOCKED** (GRANT fehlt) |
| 8b | Mandant A `DELETE` eines `GEBUCHT`-Beleg | erwartet: blockiert; faktisch: nicht durch DB-Mechanismus blockiert | **BLOCKED** (GRANT fehlt) |
| 9 | Mandant A `DELETE` von `belege` von B | blockiert | **BLOCKED** (GRANT fehlt) |
| 10 | Cross-Tabellen: `beleg_positionen` von B via SELECT | 0 rows | **BLOCKED** (GRANT fehlt) |
| 11 | Cross-Tabellen: `beleg_positionen` mit `belege.company_id = a`, eigentlich zu B | blockiert | **BLOCKED** (GRANT fehlt) |

**Hinweis zum Szenario 8/8b:** Vor Beginn der Tests wurde durch Schema-Analyse erkannt, dass der `belege_immutability`-Trigger nur `BEFORE UPDATE` ist. `DELETE` auf `GEBUCHT`-Beleg ist nicht durch DB-Mechanismus blockiert. Das ist eine eigenstaendige Compliance-Luecke (Schuld `18-aleph`), unabhaengig vom GRANT-Problem.

---

## 3 — Setup (vor dem Abbruch durchgefuehrt)

### 3.1 Test-IDs (deterministisch)

| Entitaet | UUID |
|----------|------|
| User A | `00000000-0000-0000-0000-000000000a01` |
| User B | `00000000-0000-0000-0000-000000000b01` |
| Company A | `00000000-0000-0000-0000-00000000a100` |
| Company B | `00000000-0000-0000-0000-00000000b100` |
| Beleg A1 (nicht gebucht) | `00000000-0000-0000-0000-0000000a1001` |
| Beleg A2 (`status = 'GEBUCHT'`) | `00000000-0000-0000-0000-0000000a1002` |
| Beleg B1 | `00000000-0000-0000-0000-0000000b1001` |

### 3.2 Setup-Verifikation (Soll)

| `users` | `companies` | `memberships` | `belege` | `positionen` | `gebucht_check` |
|---------|-------------|---------------|----------|--------------|-----------------|
| 2 | 2 | 2 | 3 | 6 | 1 |

**Ist-Ergebnis:** alle Werte wie erwartet. Setup erfolgreich (durchgefuehrt mit `postgres`-Owner-Privileg via Supabase Studio).

---

## 4 — Vorgesehene RLS-Simulation

```sql
begin;
select set_config(
  'request.jwt.claims',
  '{"sub":"<user_uuid>","role":"authenticated"}'::text,
  true
);
set local role authenticated;
-- Test-Query
rollback;
```

Diese Methode ist Standard fuer RLS-Tests in Supabase. Service-Role-Bypass wurde explizit nicht verwendet.

---

## 5 — Diagnose-Ergebnisse

### 5.1 Erste Anomalie (Test 1)

```
ERROR: 42501: permission denied for table belege
HINT:  Grant the required privileges to the current role with:
       GRANT SELECT ON public.belege TO authenticated;
```

Der Fehler-Code `42501` (PostgreSQL: `insufficient_privilege`) wird **vor** RLS-Auswertung geworfen. Das heisst: die Anfrage erreicht nicht einmal die RLS-Policy-Pruefung — sie scheitert bereits an der Table-Privilege-Schicht.

### 5.2 RLS-Aktivierungs-Status (alle relevanten Tabellen)

| Tabelle | RLS aktiviert |
|---------|---------------|
| `belege` | ja |
| `beleg_positionen` | ja |
| `companies` | ja |
| `company_members` | ja |
| `cookie_consents` | ja |
| `settings` | ja |

(Verifikation per `pg_tables.rowsecurity`.)

### 5.3 GRANT-Matrix (alle 41 Tabellen im `public`-Schema)

Verifiziert via `information_schema.role_table_grants` mit Aggregation pro Tabelle und Rolle.

| Tabelle | `auth_sel` | `auth_ins` | `auth_upd` | `auth_del` | `svc_sel` | `anon_sel` |
|---------|------------|------------|------------|------------|-----------|------------|
| `account_report_mapping` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `accounts` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `advisor_notes` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `afa_buchungen` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `anlagegueter` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `app_logs` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `audit_log` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `bank_reconciliation_matches` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `beleg_positionen` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `belege` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `business_partners` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `business_partners_versions` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `clients` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `companies` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `company_members` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `cookie_consents` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `cost_carriers` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `cost_centers` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `documents` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `dunning_records` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `elster_submissions` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `employees` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `inventur_anlagen` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `inventur_bestaende` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `inventur_sessions` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `invoice_archive` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `invoice_xml_archive` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `journal_entries` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `lohnabrechnungen_archiv` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `lohnarten` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `lohnbuchungen` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `lsta_festschreibungen` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `privacy_incidents` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `privacy_requests` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `receipt_requests` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `report_line_closure` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `report_lines` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `settings` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `supplier_preferences` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `user_profiles` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |
| `ustid_verifications` | NEIN | NEIN | NEIN | NEIN | NEIN | NEIN |

**Aggregation:** 41 von 41 Tabellen. 0 Grants fuer `authenticated`, `anon`, `service_role`. Lediglich `postgres` (Owner) hat Vollzugriff via Ownership.

### 5.4 Rollen-Konfiguration

| `rolname` | `rolsuper` | `rolbypassrls` | `rolinherit` |
|-----------|------------|----------------|--------------|
| `supabase_admin` | true | true | true |
| `postgres` | false | true | true |
| `service_role` | false | true | true |
| `authenticator` | false | false | false |
| `authenticated` | false | false | true |
| `anon` | false | false | true |

**Wichtige Klarstellung:** `rolbypassrls = true` bedeutet, dass die Rolle RLS-Policies umgeht. Es bedeutet NICHT, dass sie fehlende `GRANT`-Privilegien umgeht. Das wurde durch direkten Test bestaetigt:

```
ERROR: 42501: permission denied for table belege
HINT:  Grant the required privileges to the current role with:
       GRANT SELECT ON public.belege TO service_role;
```

`postgres` funktioniert nur, weil es **Owner** der Tabellen ist (nicht weil `bypassrls = true`).

### 5.5 SECURITY DEFINER-Funktionen

| `routine_name` | `security_type` |
|----------------|-----------------|
| `tg_bp_snapshot_before_update` | DEFINER |
| `verify_bpv_chain` | DEFINER |
| `verify_journal_chain` | DEFINER |
| `verify_uv_chain` | DEFINER |

Es existieren keine `SECURITY DEFINER`-RPCs fuer den CRUD-Zugriff auf `belege`, `beleg_positionen` oder andere Anwendungs-Tabellen. Das schliesst den moeglichen Workaround "Zugriff ueber RPCs statt direkt" als aktuell genutzten Mechanismus aus.

---

## 6 — Aussage zur Operabilitaet

**Das System ist aktuell nicht ueber den Supabase JavaScript Client (`@supabase/supabase-js`) operabel** — weder mit `anon`-Key noch mit `authenticated`-JWT noch mit `service_role`-Key. Jede CRUD-Operation auf `public`-Tabellen scheitert mit `42501: permission denied`.

Die einzige funktionierende Zugriffsmethode ist Supabase Studio SQL Editor, welcher als `postgres`-Owner ausgefuehrt wird. Diese Methode ist nicht fuer Anwendungs-Logik vorgesehen.

**Implikation fuer offene Plan-Punkte:**

| Plan-Punkt | Status |
|------------|--------|
| `feat/documents-storage-go-live` (Charge 19+) | **Blockiert** — funktioniert nicht ohne Grants |
| Implementierung der RPCs aus Spec V1 (`post_journal_entry`, ...) | **Blockiert** — die RPCs koennten zwar als `SECURITY DEFINER` deklariert werden und damit das Problem umgehen, aber jede direkte Tabellen-Operation aus dem Frontend scheitert |
| Production-Launch | **Blockiert** |

---

## 7 — Beobachtung: `journal_entries` existiert in DB

Bei der Auflistung aller Tabellen in `public` wurde festgestellt, dass `journal_entries` als Tabelle existiert. Das widerspricht der Annahme, die in `Spec V1` Section 6 (Charge 17) festgehalten wurde:

> "Implementierung der RPCs und unterliegender Tabellen ist Charge 18+, nicht Teil dieser Spec."

und Section 6.1 (Out-of-Scope), die `journal_entries` als nicht-existent voraussetzte.

**Dieses Detail wird in Charge 19 untersucht.** Moegliche Erklaerungen: bestehende Tabelle aus einer aelteren Migration, die im Migrations-Tracker nicht erfasst wurde; Ueberbleibsel aus einem frueheren Architektur-Versuch; oder existierende Funktionalitaet, die in keinem HANDOFF dokumentiert ist. Eine Inspektion der Tabellen-Struktur und der referenzierenden Migrations ist die erste Aufgabe in Charge 19.

Klassifikation: **Aufzunehmen als Erkenntnis in `HANDOFF_BATCH_19`**, nicht als eigenstaendige Schuld.

---

## 8 — Identifizierte Compliance-Luecken

### 8.1 Schuld `18-aleph` — Fehlender BEFORE-DELETE-Trigger auf `belege`

**Beschreibung:** Der Trigger `belege_immutability` ist ausschliesslich auf `BEFORE UPDATE` gebunden. Ein `DELETE` eines Beleg mit `status = 'GEBUCHT'` ist DB-seitig nicht blockiert. Das verletzt das Prinzip der Unveraenderbarkeit nach GoBD Rz. 64.

**Quellen:**
- Code: `supabase/migrations/0022_belege_persistence.sql` Zeilen 130–161 (`prevent_gebucht_beleg_mutation`-Funktion und Trigger-Bindung).
- Verifikation: `information_schema.triggers` zeigt nur `event_manipulation = 'UPDATE'` fuer `belege_immutability`.

**Auch der UPDATE-Trigger schuetzt nicht alle Felder:** Er prueft nur Aenderungen an `belegnummer`, `belegdatum`, `buchungsdatum`, `netto`, `steuerbetrag`, `brutto`, `journal_entry_ids`. Aenderungen an z. B. `beschreibung` oder `partner_name` werden nicht blockiert. Das kann beabsichtigt sein (nur die buchhalterisch relevanten Felder sind unveraenderbar), sollte aber explizit dokumentiert sein.

**Compliance-Bezug:** GoBD Rz. 64 (Unveraenderbarkeit gebuchter Belege).

**Prioritaet:** Hoch.

**Loesung (Charge 21+):** Migration mit zusaetzlichem `BEFORE DELETE`-Trigger auf `belege`, der `status = 'GEBUCHT'`-Eintraege schuetzt. Klarstellung des UPDATE-Schutz-Umfangs in der Trigger-Funktion und/oder Doku.

### 8.2 Schuld `18-bet` — Fehlende GRANT-Konfiguration im `public`-Schema

**Beschreibung:** Auf 41 von 41 Tabellen im `public`-Schema sind keine `GRANT`-Statements fuer die Anwendungs-Rollen `authenticated`, `anon` und `service_role` vorhanden. RLS-Policies sind aktiviert, aber operativ wirkungslos, weil sie nie zur Auswertung kommen — die Anfrage scheitert bereits an der vorgelagerten Privilege-Pruefung.

**Quellen:**
- Verifikation per `information_schema.role_table_grants` (Section 5.3).
- Direkter Test mit `SET LOCAL ROLE authenticated` und `service_role`: beide produzieren `42501: permission denied`.

**Operative Konsequenz:** Der gesamte `@supabase/supabase-js`-basierte Zugriff aus dem Frontend ist nicht funktionsfaehig. Auch RPC-basierte Workarounds setzen voraus, dass die RPC-Funktion als `SECURITY DEFINER` deklariert ist — von 4 vorhandenen `SECURITY DEFINER`-Funktionen ist keine fuer CRUD auf Anwendungs-Tabellen zustaendig.

**Compliance-Bezug:**
- DSGVO Art. 32 (Sicherheit der Verarbeitung): nicht-testbar bedeutet nicht-verifiziert bedeutet keine belastbare Compliance-Aussage.
- GoBD Rz. 100 ff. (Datensicherheit, Unveraenderbarkeit): die geplanten Schutz-Mechanismen (RLS) sind aktiv, aber von der Anwendung nicht erreichbar — die Schutz-Wirkung ist daher nicht praktisch verifizierbar.

**Prioritaet:** Hoch (blockiert alle weiteren Schritte).

**Loesung (Charge 19):** Migration `0052_grant_authenticated_public_tables.sql` mit gezielten `GRANT`-Statements pro Tabelle, abgestimmt auf die jeweiligen RLS-Policies. Anschliessend Wiederholung der gesamten Test-Matrix in Charge 20.

---

## 9 — Cleanup

Cleanup-Skript erfolgreich ausgefuehrt. Alle Test-Daten entfernt:

| Counter | Soll | Ist |
|---------|------|-----|
| `users_residual` | 0 | 0 |
| `companies_residual` | 0 | 0 |
| `memberships_residual` | 0 | 0 |
| `belege_residual` | 0 | 0 |
| `positionen_residual` | 0 | 0 |

DB-Stand wieder identisch mit dem Stand vor Charge 18.

---

## 10 — Akzeptanzkriterien

- [x] Test-Matrix definiert (12 Szenarien inkl. 8b).
- [x] Setup-Skript erstellt und ausgefuehrt.
- [x] Erster Test ausgefuehrt; Fehler dokumentiert.
- [x] Diagnose ausgeweitet; Ursache identifiziert.
- [x] Vollstaendige GRANT-Matrix erfasst (Section 5.3).
- [x] Schuld `18-aleph` (DELETE-Trigger-Luecke) registriert.
- [x] Schuld `18-bet` (fehlende GRANTs) registriert.
- [x] `journal_entries`-Beobachtung dokumentiert.
- [x] Cleanup ausgefuehrt und verifiziert.
- [ ] Test-Matrix-Szenarien 1–11 mit erwartetem Ergebnis bestanden — **NICHT durchgefuehrt; vorausgesetzte Voraussetzung (GRANTs) fehlt**.
- [ ] Datenschutz-Sign-off — **TODO: nach Charge 20 separat einholen**.
- [ ] StB-Ruecksprache zu Loesch-Policies — **TODO: nach Charge 20 separat protokollieren**.

---

## 11 — Klassifikation

**Charge 18 abgeschlossen als: Diagnostic Outcome — Verifikation prerequisites not met.**

Die geplante Compliance-Verifikation (`Schuld 10-aleph`) bleibt **offen**. Sie wird in Charge 20 wiederholt, nachdem Charge 19 die GRANT-Konfiguration repariert hat.

---

## 12 — Naechste Schritte

| Charge | Aufgabe | Voraussetzung |
|--------|---------|---------------|
| Charge 19 | Migration `0052_grant_authenticated_public_tables.sql` — gezielte GRANT-Statements abgestimmt auf bestehende RLS-Policies | Charge 18 abgeschlossen ✓ |
| Charge 19 (parallel) | Inspektion `journal_entries`-Tabelle und referenzierender Migrations | Charge 18 abgeschlossen ✓ |
| Charge 20 | Wiederholung Test-Matrix (Charge 18 replay) | Charge 19 abgeschlossen |
| Charge 21+ | Migration mit `BEFORE DELETE`-Trigger fuer `belege` (`18-aleph`) | Charge 20 abgeschlossen |
| Charge 22+ | `feat/documents-storage-go-live` (Code-Anwendung) | Charge 20 abgeschlossen, GRANTs verifiziert |

---

## 13 — Lessons Learned

1. **GRANT und RLS sind orthogonale Schichten.** Eine vollstaendige RLS-Policy-Konfiguration garantiert keine Operabilitaet. Beide Schichten muessen explizit zusammenspielen. Diese Trennung ist in der Supabase-Doku enthalten, aber leicht zu uebersehen.

2. **Die Verifikation bringt mehr Wert als das Bestaetigen.** Charge 18 sollte 11 erwartete Ergebnisse bestaetigen. Stattdessen hat sie zwei strukturelle Luecken aufgedeckt (`18-aleph`, `18-bet`), die ohne diese Charge unentdeckt geblieben waeren — bis sie Production-relevant geworden waeren.

3. **`rolbypassrls != bypass GRANTs`.** Eine in PostgreSQL haeufige Quelle von Verwirrung. `service_role` umgeht RLS, scheitert aber an fehlenden Privilegien. Per direktem Test bestaetigt.

4. **Spec-Dokumente sind Hypothesen ueber DB-Realitaet.** Spec V1 (Charge 17) nahm an, dass `journal_entries` nicht existiert. DB-Realitaet zeigt: doch. Lehre 39 (HANDOFF_BATCH_17) wird verstaerkt: vor jeder Spec-Aussage Code- oder DB-Verifikation.

---

**Ende des Berichts.**
