# Backup-Strategie für harouda-app

**Status: NICHT implementiert (P1 Blocker offen).**

Diese App hat KEIN produktionsreifes Backup-System. Vor Produktivbetrieb MÜSSEN
die unten genannten Schritte umgesetzt werden. Die vorhandenen clientseitigen
Werkzeuge (siehe "Was JETZT existiert") sind KEIN Ersatz.

Rechtlicher Rahmen:
- **DSGVO Art. 32 Abs. 1 lit. c** — "Fähigkeit zur raschen Wiederherstellung"
- **AO § 147** — 10-Jahres-Aufbewahrungspflicht für steuerrelevante Daten
- **GoBD Rz. 103-105** — Zuverlässigkeit des IT-Systems
- **GoBD Rz. 58** — Unveränderbarkeit; Backup-Kopie darf die Originalität nicht brechen

---

## Erforderliche Maßnahmen (vor Go-Live)

### 1. Supabase Point-in-Time Recovery (PITR)

- Paid-Tier aktivieren
- Retention: **mind. 7 Tage**, empfohlen 30 Tage
- Testweise Wiederherstellung einmalig vor Go-Live dokumentieren
- Owner: TODO

### 2. Server-seitige `pg_dump`-Jobs

Dies ist die Kern-Arbeit und gehört **nicht** in den Browser. Zwei Optionen:

- **Supabase Edge Function mit Cron-Trigger** (leichtgewichtig)
- **Separater Backup-Dienst**, möglicherweise zusammen mit dem geplanten
  ELSTER-ERiC-Microservice (siehe ROADMAP P1 #1)

Zeitplan:

| Frequenz     | Zeitpunkt             | Retention       |
|--------------|-----------------------|-----------------|
| Täglich      | 02:00 Uhr Europe/Berlin | 30 Tage         |
| Wöchentlich  | Sonntag                 | 90 Tage         |
| Monatlich    | 1. des Monats           | 12 Monate       |
| Jährlich     | 31.12.                  | 10 Jahre (§ 147 AO) |

### 3. Off-Site-Replikation

- S3-Bucket in der Frankfurt-Region (DSGVO-Compliance)
- Server-seitige AES-256-Verschlüsselung (SSE-S3 oder SSE-KMS)
- AVV mit AWS Frankfurt oder alternativem EU-Anbieter (Hetzner, Scaleway, etc.)
- Zugriffstrennung: Backup-Bucket ist schreib-only für die Anwendung, lese-only für Admins

### 4. Restore-Runbook

Schriftliche Dokumentation mit:

- Maximum RTO: **4 Stunden**
- Maximum RPO: **24 Stunden**
- Schritt-für-Schritt-Anleitung zur Wiederherstellung
- Mindestens 1× pro Quartal getestet — Protokoll aufbewahren
- Abgelegt im Verfahrensdokumentations-Ordner

### 5. GoBD-Kompatibilität beim Restore

Das harouda-Journal (`journal_entries`) hat eine Hash-Kette
(`prev_hash` / `entry_hash`). Ein Restore aus PITR oder `pg_dump` ist zulässig,
weil er den Gesamt-Zustand wiederherstellt (Hash-Kette bleibt konsistent).

NICHT zulässig wäre ein **partieller** Restore, bei dem einzelne Journal-Zeilen
überschrieben werden — das würde die Hash-Kette brechen. Darum gibt es in
diesem System bewusst keinen "partial restore" auf Anwendungsebene.

---

## Was JETZT existiert (und was es NICHT leistet)

### `/admin/datenexport` (Sprint-3, Option A)

- Clientseitiger Export der per Row-Level-Security sichtbaren Daten als ZIP
- SHA-256 pro Tabelle + Manifest — erkennt Korruption, NICHT Manipulation
- Zweck: **DSGVO Art. 20** (Datenübertragbarkeit) / **Art. 15 Abs. 3** (Kopie)
- **Kein Restore**. Keine Automatisierung. Kein Off-Site.
- Prominentes Warnbanner in der UI; Disclaimer im Manifest und in `DISCLAIMER.txt`

### `src/api/backup.ts` (legacy)

- Ältere JSON-Export-Funktion, nur DEMO-Modus (localStorage → JSON-Datei)
- Restore schreibt direkt in localStorage, **umgeht** jede GoBD-Prüfung
- Wird in `SettingsPage.tsx` unter "Backup herunterladen/Restore" angeboten
- **Empfehlung**: für neue Arbeit `/admin/datenexport` nutzen; Legacy-Pfad
  mittelfristig deprecaten, sobald die Kanzlei-interne Migration auf Supabase
  abgeschlossen ist.

---

## Verantwortlichkeiten (zu definieren)

- Wer aktiviert PITR auf dem Supabase-Projekt? → TODO
- Wer baut + wartet die `pg_dump`-Edge-Function? → TODO
- Wer verwaltet den S3-Bucket und die AWS-Kosten? → TODO
- Wer testet den Restore quartalsweise? → TODO
- Wer ist Datenschutzbeauftragte:r für Backup-Prozesse? → TODO

---

## Warum das nicht im Browser gelöst wurde

Kurz: weil es dort nicht gelöst werden kann.

- Der Browser sieht nur Daten, die der aktuellen Anmeldung per RLS
  zugänglich sind — ein Kanzlei-Admin, der einloggt, sieht zwar alle
  Mandanten, aber nicht das `auth`-Schema und nicht Metadaten wie
  `pg_catalog`.
- Der Browser kann nicht auf Off-Site-Speicher schreiben (S3 direkt aus dem
  Frontend ist eine Sicherheitslücke, weil die Secrets dann im Client-Code
  liegen).
- Der Browser läuft nur, wenn der Tab offen ist. "Tägliche Backups" in der
  Browser-Zeitzone bedeuten "wenn jemand zufällig eingeloggt ist".
- Browser-Storage (localStorage, IndexedDB) ist flüchtig: Nutzer:innen
  löschen Browser-Daten, Administratoren setzen Geräte neu auf, Browser
  laufen in Incognito-Modi.

Für echte Wiederherstellbarkeit nach Incident-Szenarien (Supabase-Projekt
gelöscht, Account gesperrt, Rechenzentrum ausgefallen) braucht es eine
server-seitige, automatisierte, off-site gespeicherte Lösung. Das ist keine
TypeScript-Arbeit — es ist Ops-Arbeit.
