# Kapitel 7 — Prüfpfade und Protokollierung

> Status: v0.1 BEFÜLLT | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck dieses Kapitels

Technische und organisatorische Darstellung der Mechanismen, mit
denen das Verfahren die Unveränderbarkeit der Buchführung (§ 146
Abs. 4 AO, GoBD Rz. 107 ff.) und die Prüfbarkeit durch eine
Außenprüfung (§ 147 Abs. 6 AO) sicherstellt. Adressaten sind
Wirtschaftsprüfer:innen nach IDW PS 880 und Betriebsprüfer:innen des
Finanzamts. Die hier beschriebenen Mechanismen sind **implementiert
und im Code verifizierbar** — die für IDW-PS-880-Prüfungen
kritischen Grenzen (insb. Abschnitt 7.3, *tamper-evident* vs.
*tamper-proof*) sind explizit benannt.

---

## 7.1 Protokollierungs-Architektur

### Welche Ereignisse werden protokolliert

Der Audit-Log (`audit_log`, Migration 0002) erfasst jede schreibende
Operation auf den fachlichen Kern-Tabellen. Die zulässigen Werte sind
per `CHECK`-Constraint festgelegt:

- **Entitäten** (`entity`): `journal_entry`, `account`, `client`,
  `document`, `settings`.
- **Aktionen** (`action`): `create`, `update`, `delete`, `import`,
  `export`.

Jeder Eintrag trägt zusätzlich:

- `owner_id` (FK auf `auth.users`) — zwingend, per Default auf
  `auth.uid()` gesetzt.
- `at` (timestamptz) — Serverzeit in UTC.
- `actor` (Text) — symbolischer Name der Person/des Systems.
- `entity_id` (UUID) — Referenz auf den betroffenen Datensatz.
- `summary` (Text) — kurzer Betreff.
- `before`, `after` (jsonb) — Zustand vor und nach der Änderung, soweit
  sinnvoll abbildbar.
- `prev_hash`, `hash` (Text) — Hash-Kette, siehe Abschnitt 7.3.

### Speicherort und Zugriffsbeschränkung

- Speicherort: Tabelle `public.audit_log` in Postgres (Supabase).
- Row-Level-Security ist aktiviert:
  - `SELECT` ist auf die eigene `owner_id` beschränkt.
  - `INSERT` ist ebenfalls auf die eigene `owner_id` beschränkt.
  - `UPDATE` und `DELETE` sind **nicht als Policy vorhanden**; zusätzlich
    sind `UPDATE`/`DELETE`-Rechte für die Rolle `authenticated`
    explizit entzogen (`REVOKE UPDATE, DELETE ... FROM authenticated`
    in Migration 0002).
- Die Tabelle ist damit auf RLS- und Grant-Ebene **append-only** für
  alle App-Zugriffe. Verbleibendes Restrisiko: Direkt-Zugriff mit
  Postgres-Superuser-Rechten; siehe Abschnitt 7.3 zur *tamper-
  evident*-Grenze.

### Rechtlicher Bezug

- **GoBD Rz. 153-154** — Hash-Verfahren zur Sicherung der
  Unveränderbarkeit als anerkannte Methode.
- **GoBD Rz. 99-102** — Nachvollziehbarkeit jeder Buchung
  (Buchungstext, Beleg, Zeitpunkt, Bearbeiter:in).
- **§ 146 Abs. 4 AO** — Verbot der Veränderung, ohne dass der
  ursprüngliche Inhalt feststellbar bleibt.

### Protokollierung auf Anwendungsebene

Schreibzugriffe im UI (Belegerfassung, Journal-Bearbeitung,
Kontenpflege, Mandantenverwaltung, Einstellungen, Festschreibung,
Import- und Export-Vorgänge) rufen nach erfolgreicher Operation den
Audit-Service `src/api/audit.ts` auf. Die Protokollierung ist
synchron und Teil derselben logischen Transaktion — ein
Audit-Log-Schreiben, das fehlschlägt, bricht die Operation ab.

---

## 7.2 Festschreibung (Immutabilität)

### Mechanismus

Die Festschreibung nach GoBD Rz. 64 ist auf drei Ebenen realisiert:

1. **Anwendungsschicht** — `FestschreibungsService`
   (`src/domain/gobd/FestschreibungsService.ts`). Einzige Stelle, die
   den Festschreibungs-Hash berechnet (`computeAbrechnungHash`, siehe
   Abschnitt 7.3) und den Status setzt (`locked`, `locked_at`,
   `lock_hash`, `lock_reason`, `locked_by`). Stichproben-Verifikation
   über `verifyLockIntegrity()`.

2. **Datenbank-Ebene — Journal** (Migrationen 0006, 0009):
   - Zusatz-Spalten `storno_status` (active/reversed/reversal/
     correction), `parent_entry_id`, `locked_at`.
   - Trigger auf `journal_entries` beschränkt `UPDATE` auf ein
     Whitelist-Feldset, sobald `storno_status != 'active'` oder
     `locked_at` gesetzt ist; `DELETE` ist nur für Entwürfe zulässig.
   - Auto-Lock-Fenster (Migration 0009): Buchungen werden nach einem
     konfigurierbaren Zeitraum automatisch festgeschrieben; die
     Voreinstellung wird im UI unter **Einstellungen** geführt.

3. **Datenbank-Ebene — Lohnabrechnung** (Migrationen 0020, 0021):
   - Tabelle `lsta_festschreibungen` hält Per-Run-Festschreibungen
     mit `lock_hash` und `abrechnungs_ids`.
   - `abrechnungen_archiv`-Zeilen sind nach Festschreibung
     unveränderlich.

### Fachliche Wirkung

- Ab Festschreibung ist eine Korrektur nur über eine **Stornobuchung**
  mit `parent_entry_id`-Verknüpfung möglich (GoBD Rz. 64 + § 146 Abs.
  4 AO). Der Original-Datensatz bleibt erhalten.
- Das Entsperren einer Festschreibung ist fachlich ausgeschlossen;
  technisch existiert eine Unlock-Funktion ausschließlich für
  dokumentierte Ausnahmesituationen mit Begründung und Audit-Eintrag
  (`unlock_history` in `LockedRecord`). Die Policy hierfür ist Teil
  des IKS — siehe Kap. 8 Abschnitt 8.4.

### Rechtsgrundlage

- **§ 146 Abs. 4 AO** — Unveränderbarkeit des ursprünglichen Inhalts.
- **GoBD Rz. 58** — Präzision (Umsetzung via `Money`-Wrapper, Details
  in Kap. 3 Abschnitt 3.3).
- **GoBD Rz. 64** — Festschreibung als Realisierung der
  Unveränderbarkeit.

---

## 7.3 Hash-Kette — Status quo und Grenzen

### Implementierungsstand

Die Hash-Kette ist **implementiert und produktiv im Code**. Sie
deckt zwei Tabellen ab:

**Audit-Log** (Migration 0003, `audit_log`):

- Spalten `prev_hash` (Default: 64 × `'0'`, Genesis) und `hash`.
- Hash-Bildung: SHA-256 über `prev_hash || canonical JSON der Zeile
  ohne hash-Feld` (siehe Migration-Header 0003 sowie
  `src/api/audit.ts`).
- Server-Trigger setzt `prev_hash` aus dem letzten vorhandenen
  `hash` derselben `owner_id` beim `INSERT`.
- Verifikation: `verifyAuditChain()` in `src/api/audit.ts`; im UI
  zugänglich über `/einstellungen/audit` und
  `/einstellungen/systemstatus`.

**Journal** (Migration 0010, `journal_entries`):

- Spalten `prev_hash` und `entry_hash`.
- Kanonisches Format (Pipe-separiert, in Migration 0010 Zeilen
  13-15 dokumentiert):
  `prev_hash | datum | beleg_nr | soll_konto | haben_konto |
  betrag (2-Dez) | beschreibung | parent_entry_id`.
- **Client- und Server-Seite berechnen identisch.** Serverseitig:
  `public.journal_entries_compute_hash(...)` (PL/pgSQL, als
  `IMMUTABLE` deklariert). Clientseitig:
  `src/utils/journalChain.ts`. Dieselbe Funktion wird in der
  Erfassung vorausberechnet und im Trigger verifiziert — ein
  Divergenz-Fehler wird beim `INSERT` erkannt.
- `storno_status` ist **bewusst nicht Bestandteil** des Hash-Formats,
  weil dieser Status legitimerweise transitioniert (`active` →
  `reversed`); die Transition wird im Audit-Log erfasst.

### Grenze: tamper-evident, nicht tamper-proof

Die Hash-Kette dieses Verfahrens liefert **Beweiserkennung**, nicht
**Beweisverhinderung**. Diese Unterscheidung ist für IDW PS 880 und
für jede Betriebsprüfung materiell; sie wird hier explizit
dokumentiert, weil die GoBD Rz. 107 ff. Unveränderbarkeit verlangen.

- **Was die Kette leistet:** Jede nachträgliche Veränderung einer
  bereits geschriebenen Zeile bricht entweder den Hash der Zeile
  selbst oder den `prev_hash` aller nachfolgenden Zeilen. Ein Prüfer,
  der die Kette aus dem Genesis-Hash neu rechnet, erkennt die
  Abweichung. Die Migration 0003 benennt dies wörtlich: *"This is
  tamper-EVIDENCE, not tamper-PROOFing."*
- **Was die Kette nicht leistet:** Sie verhindert nicht, dass eine
  Operatorin mit Postgres-Superuser-Rechten die gesamte Kette inkl.
  aller Hashes neu schreibt. In diesem Szenario ist kein interner
  Indikator mehr vorhanden.
- **Schlussfolgerung für GoBD Rz. 107 ff.:** Die Anforderung
  "Unveränderbarkeit" gilt als erfüllt, sofern die Kette durch eine
  externe, unabhängige Absicherung ergänzt wird — entweder WORM-
  Speicher (Write-Once-Read-Many), eine Append-Only-Spiegelung in
  ein externes SIEM oder ein zeitgestempelter, regelmäßiger Export
  der Hash-Werte an einen unabhängigen Verwahrer.

### Abhängigkeit: externe Absicherung vor Produktivgang

- **Maßnahme** (Ops-Arbeit, nicht TypeScript-Arbeit):
  Periodischer Export der `hash`-Spalte aus `audit_log` und
  `journal_entries` an eine unabhängige Stelle, z. B. ein
  qualifiziertes Archivsystem. Verantwortung siehe Kap. 4 Abschnitt
  4.1.
- **Verweis:** Diese Maßnahme ist als Teil der offenen Ops-Arbeit zur
  Datensicherung in [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md)
  dokumentiert; die GoBD-Kompatibilität beim Restore (keine partiellen
  Restores auf hashed Tabellen) ist dort Abschnitt 5.

<!-- TODO(verfahrensdoku): Nach Produktiv-Gang: Protokoll der gewählten WORM-/SIEM-Integration und des Export-Rhythmus (z. B. täglich, mit qualifizierter Zeitstempelung nach eIDAS) hier eintragen. -->

### Offen: DSGVO Art. 17 Erasure auf hashed Felder

Ein spezifisches Restrisiko: Enthält ein hashed Feld personenbezogene
Daten (insb. `journal_entries.beschreibung`, das im Hash-Format
mitläuft), so lässt sich eine DSGVO-Art.-17-Löschung dieser Person
nicht ohne Weiteres umsetzen, ohne die Kette zu brechen. Die
technisch-rechtliche Design-Entscheidung über vier Optionen
(Crypto-Shredding / Tombstone / PII-Split / Merkle-Re-Root) ist in
[`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)
dokumentiert. Acht juristische Fragen (Q1-Q8) dort liegen Fachanwalt
für Steuerrecht und DSB zur Freigabe vor; Implementierung folgt nach
Rückmeldung. Details zum Löschkonzept sind in Kap. 6.

---

## 7.4 Nachvollziehbarkeit einzelner Änderungen

### "Wer hat wann was geändert"

Für jeden `audit_log`-Eintrag steht zur Verfügung:

| Feld | Bedeutung |
|---|---|
| `owner_id` | Postgres-Benutzer-Referenz (`auth.users`), RLS-Grundlage |
| `actor` | Symbolischer Name der handelnden Person (DEMO-Modus: `demo@harouda.local`) |
| `at` | Zeitpunkt, Serverzeit UTC |
| `action` | create / update / delete / import / export |
| `entity` + `entity_id` | Betroffene Tabelle und Zeile |
| `summary` | Kurztext der Änderung |
| `before` / `after` | Zustand vor und nach dem Schreibvorgang als JSONB, soweit sinnvoll |
| `prev_hash` / `hash` | Kettenglieder (Abschnitt 7.3) |

### Strukturen für die Prüferin

Die Admin-Seite `/einstellungen/audit` (verknüpft mit
`src/pages/AuditLogPage.tsx`) zeigt:

- chronologische Liste aller Einträge der eigenen `owner_id`,
- Detail-Ansicht mit `before`/`after`-Diff,
- Verifikations-Button, der `verifyAuditChain()` aufruft und das
  Ergebnis (valide / gebrochen) als Statusmeldung zurückgibt.

### Aufbewahrungsdauer

Die Aufbewahrungsfristen der Audit-Log-Einträge folgen denen der
fachlich betroffenen Objekte (z. B. Buchungsbelege: 8 Jahre nach
§ 147 Abs. 3 AO n.F. seit Wachstumschancengesetz 2025; Bücher und
Jahresabschlüsse: 10 Jahre). Die Einzel-Regeln sind in Kapitel 6
dokumentiert und in `src/data/retention.ts` maschinenlesbar
hinterlegt.

---

## 7.5 Datenexport für die Außenprüfung

### Z3-Datenträgerüberlassung nach § 147 Abs. 6 AO

Das Verfahren stellt einen Z3-kompatiblen Export bereit. Inhalte des
ZIP-Pakets:

- `INDEX.XML` — Beschreibungsstandard des BMF, benennt Tabellen,
  Trennzeichen, Spaltendefinitionen.
- `KONTEN.CSV` — Kontenrahmen im Prüfzeitraum.
- `BUCHUNGEN.CSV` — sämtliche Journal-Einträge im Prüfzeitraum,
  inkl. der `entry_hash`-Werte aus der Hash-Kette.
- `BELEGE.CSV` — Beleg-Metadaten (deduplizierter Index über
  `beleg_nr`).
- `STAMMDATEN.CSV` — Unternehmensstammdaten des Mandanten.
- `LOHN.CSV` — optional, Lohnbuchungen (strukturell verfügbar,
  Befüllung abhängig vom Archiv-Stand).
- `MANIFEST.XML` — SHA-256-Hash je enthaltener Datei, Größe in Bytes,
  Zeilenzahl; ermöglicht der Prüferin eine Integritätsprüfung des
  Pakets nach Empfang.

Format-Konventionen im Export (nach BMF-Vorgabe):

- Zeichensatz ISO-8859-15, Feldtrennzeichen Semikolon, Dezimalkomma,
  Datum DD.MM.YYYY, Zeilenende CRLF.

### Abgrenzung zu anderen Exportformaten

- **DATEV EXTF 510** — CSV-Export zur Übergabe an DATEV, nicht
  DATEV-zertifiziert; siehe Kap. 3 Abschnitt 3.4.
- **Mandanten-Datenexport (DSGVO Art. 20)** — ausdrücklich
  **kein** Datensicherungs-Backup und **kein** Ersatz für den
  Z3-Export. Er dient der Betroffenen-Datenübertragbarkeit; die
  SHA-256-Hashes erkennen unbeabsichtigte Korruption, sind aber
  **nicht kryptographisch signiert** (Details im manifest-eigenen
  `DISCLAIMER.txt` des Exports).

Technische Details der Export-Schnittstellen stehen in Kapitel 3
Abschnitt 3.4.

### Rechtsgrundlage

- **§ 147 Abs. 6 AO** — Datenzugriff: Z1 (unmittelbarer Zugriff),
  Z2 (mittelbarer Zugriff), Z3 (Datenträgerüberlassung). Das
  Verfahren unterstützt **Z3**.
- **BMF-Beschreibungsstandard** für den Daten-Export an die
  Betriebsprüfung, in der jeweils aktuellen Fassung.

### Nicht zertifiziert

Das Z3-Paket ist formatseitig nachgebildet, nicht durch das
IDEA-Testtool oder eine vergleichbare Zertifizierungsstelle geprüft.
Eine Prüfer:in kann das Paket mit Standard-Werkzeugen öffnen; eine
formelle Zertifizierungs-Bestätigung liegt nicht vor. Diese
Einschränkung ist in `CLAUDE.md` §12 Note 8 vermerkt.

---

## 7.6 Datenschutz-Protokollierung

Dieser Abschnitt benennt die Protokolle, die aus datenschutzrecht-
licher Sicht pflichtig sind. Die inhaltliche Ausgestaltung steht in
Kapitel 5 (Datensicherheits- und Datenschutzkonzept).

### Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO)

Das Verzeichnis ist eine Pflicht der verantwortlichen Stelle (der
nutzenden Kanzlei), nicht des Software-Herstellers. Das Verfahren
liefert die Grundlage (Liste der verarbeiteten Datenkategorien je
Prozess, Rechtsgrundlagen, Aufbewahrungsfristen); die Zusammenstellung
und Aktualisierung erfolgt durch die:den Datenschutzbeauftragte:n der
Kanzlei.

<!-- TODO(verfahrensdoku): Template oder Export-Funktion für das Verzeichnis nach Art. 30 DSGVO erarbeiten, sobald der Hash-Chain-vs.-Erasure-Entscheid getroffen ist (das Verzeichnis muss auch die künftige Erasure-Mechanik beschreiben). -->

### Meldepflicht bei Datenpannen (Art. 33, Art. 34 DSGVO)

- Registerführung in der Tabelle `privacy_incidents` (Migration 0023)
  mit Feldern für Entdeckungszeit, Beschreibung, Kategorien
  betroffener Daten, Anzahl Betroffener, Schweregrad, Behörden-
  Meldung, Betroffenen-Meldung, Eindämmungsmaßnahmen,
  Ursachenanalyse, Status.
- Die **72-Stunden-Meldepflicht** an die Aufsichtsbehörde nach Art. 33
  Abs. 1 DSGVO beginnt mit der Kenntnisnahme. Eingabe und Steuerung
  der Fristen erfolgt durch die:den Datenschutzbeauftragte:n; das
  Verfahren hält das Register, der Meldeweg an die Aufsichtsbehörde
  selbst liegt außerhalb.
- Benachrichtigung der betroffenen Personen nach Art. 34 DSGVO, sofern
  ein hohes Risiko besteht.

### Betroffenenanfragen (Art. 15, 17, 20 DSGVO)

- Registerführung in der Tabelle `privacy_requests` (Migration 0023).
- 30-Tage-Antwortfrist nach Art. 12 Abs. 3 DSGVO wird als `deadline`
  pro Anfrage gespeichert.
- Datenübertragbarkeit (Art. 20) ist über `/admin/datenexport`
  technisch umgesetzt; Auskunft (Art. 15 Abs. 3) wird über denselben
  Pfad bedient. Die Behandlung von Löschanfragen (Art. 17) wartet auf
  die in Kap. 6 Abschnitt 6.3 und in
  [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)
  beschriebene Design-Entscheidung.

Cross-Referenzen zu folgenden Kapiteln: Rollen und Berechtigungen →
Kap. 1 Abschnitt 1.4 und Kap. 5 Abschnitt 5.1 · Betriebsaspekte
(Monitoring, Aufbewahrung der Exporte) → Kap. 4 · Internes
Kontrollsystem und Freigabe-Workflows → Kap. 8 · Aufbewahrungsfristen
→ Kap. 6.

---

## Quellen & Referenzen

- **Abgabenordnung (AO):** § 146 Abs. 4 (Unveränderbarkeit); § 147
  Abs. 3 (Aufbewahrungsfristen, Abschnitt 7.4); § 147 Abs. 6
  (Datenzugriff Z1/Z2/Z3, Abschnitt 7.5).
- **BMF-Schreiben zu den GoBD vom 28.11.2019 (IV A 4 - S 0316/19/
  10003 :001)** in der jeweils aktuellen Fassung: Rz. 58 (Präzision
  Geldbeträge), Rz. 64 (Festschreibung, Abschnitt 7.2), Rz. 99-102
  (Buchungstext und Nachvollziehbarkeit, Abschnitt 7.1), Rz. 107 ff.
  (Unveränderbarkeit, Abschnitt 7.3), Rz. 153-154 (Hash-Verfahren
  als Integritätsnachweis).
- **Verordnung (EU) 2016/679 (DSGVO):** Art. 12 Abs. 3 (Antwortfrist);
  Art. 15 Abs. 3 (Kopie der Daten); Art. 17 (Löschung); Art. 20
  (Datenübertragbarkeit); Art. 30 (Verzeichnis von
  Verarbeitungstätigkeiten); Art. 33 (Meldung von Datenpannen an die
  Aufsichtsbehörde); Art. 34 (Benachrichtigung betroffener Personen).
- **BMF-Beschreibungsstandard Z3/GDPdU** (Abschnitt 7.5).
- **Wachstumschancengesetz 2025** — Verkürzung der
  Buchungsbeleg-Aufbewahrung auf 8 Jahre (§ 147 Abs. 3 AO n.F.).

### Interne Projekt-Referenzen

- [`../../supabase/migrations/0002_audit_log.sql`](../../supabase/migrations/0002_audit_log.sql)
  (Audit-Log-Struktur, RLS, `REVOKE UPDATE, DELETE`).
- [`../../supabase/migrations/0003_audit_hash_chain.sql`](../../supabase/migrations/0003_audit_hash_chain.sql)
  (Audit-Hash-Kette, *tamper-evidence*-Grenze im Migration-Kopf
  wörtlich dokumentiert).
- [`../../supabase/migrations/0006_gobd_append_only.sql`](../../supabase/migrations/0006_gobd_append_only.sql)
  (Lebenszyklus-Spalten, UPDATE/DELETE-Trigger auf `journal_entries`).
- [`../../supabase/migrations/0009_journal_autolock.sql`](../../supabase/migrations/0009_journal_autolock.sql)
  (Auto-Lock-Fenster).
- [`../../supabase/migrations/0010_journal_hash_chain.sql`](../../supabase/migrations/0010_journal_hash_chain.sql)
  (Journal-Hash-Kette, Pipe-Format).
- [`../../supabase/migrations/0020_lohn_persistence.sql`](../../supabase/migrations/0020_lohn_persistence.sql) +
  [`0021_gobd_festschreibung.sql`](../../supabase/migrations/0021_gobd_festschreibung.sql)
  (Lohn-Festschreibung).
- [`../../supabase/migrations/0023_dsgvo_compliance.sql`](../../supabase/migrations/0023_dsgvo_compliance.sql)
  (`privacy_requests`, `privacy_incidents`, Abschnitt 7.6).
- [`../../src/domain/gobd/FestschreibungsService.ts`](../../src/domain/gobd/FestschreibungsService.ts).
- [`../../src/utils/journalChain.ts`](../../src/utils/journalChain.ts).
- [`../../src/api/audit.ts`](../../src/api/audit.ts) (`verifyAuditChain`).
- [`../../src/domain/gdpdu/Gdpdu3Exporter.ts`](../../src/domain/gdpdu/Gdpdu3Exporter.ts).
- [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md) —
  Design-Entscheidung zur Art.-17-Erasure auf hashed Feldern.
- [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md) — externe
  Absicherung der Hash-Kette als Teil der offenen Ops-Arbeit.
- [`../../CLAUDE.md`](../../CLAUDE.md) §7 (Compliance-Status), §12
  Note 6 (*tamper-evident, nicht WORM*), §12 Note 8 (Z3 nicht
  IDEA-Testtool-zertifiziert).
