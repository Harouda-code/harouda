# Kapitel 4 — Betriebsdokumentation

> Status: v0.1 BEFÜLLT | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck dieses Kapitels

Beschreibt den laufenden Betrieb des Verfahrens: Umgebungen,
Einrichtung, Datensicherung, Change-Management, Überwachung,
Notfallkonzept und Release-Prozess. Adressaten sind die
**System-Administrator:in** der nutzenden Kanzlei sowie
**Wirtschaftsprüfer:innen nach IDW PS 880**. Wo Komponenten heute
noch nicht produktiv umgesetzt sind (insb. Abschnitte 4.3 und 4.5),
ist das **explizit markiert** — Ehrlichkeit ist hier prüfrelevant.

---

## 4.1 Betriebsumgebung

### Aktueller Zustand

| Umgebung | Beschreibung |
|---|---|
| **Entwicklung / Demo** | Vite-Dev-Server auf `localhost:5173`. Datenhaltung wahlweise gegen ein Supabase-Projekt oder im Demo-Modus gegen Browser-`localStorage`. |
| **Staging** | Vorgesehen, aber noch nicht provisioniert. Ein Supabase-Staging-Projekt und ein statisches Frontend-Hosting sind in Planung. |
| **Produktion** | Noch nicht in Betrieb. Hosting-Entscheidung offen (siehe Kap. 1 Abschnitt 1.3 und Kap. 3 Abschnitt 3.5). |

### Laufzeitkomponenten

- **Client:** Single-Page-Anwendung (React 19 / TypeScript),
  ausgeliefert als statisches Bundle aus `dist/`. Serverseitige
  Rendering-Komponenten gibt es nicht.
- **Datenbank + Auth + Storage:** Supabase (verwaltetes Postgres).
  Die Migrationen unter `supabase/migrations/` halten das Schema.
- **Optional Fehlerprotokollierung:** Sentry, ausschließlich wenn
  `VITE_SENTRY_DSN` gesetzt ist; ohne DSN ist die Initialisierung ein
  No-Op (siehe `src/lib/monitoring/sentry.ts` und CLAUDE.md §12 Note 12).

<!-- TODO(verfahrensdoku): Nach Produktiv-Entscheidung der Kanzlei ergänzen: tatsächlicher Hosting-Provider, Region (Frankfurt für DSGVO-Drittstaatenfrage nach Art. 44 ff. DSGVO), Domains, TLS-Zertifikatsverwaltung. Dieses TODO ist identisch mit dem in Kap. 1 Abschnitt 1.3 und Kap. 3 Abschnitt 3.5 — gemeinsame Auflösung sinnvoll. -->

### Externe Laufzeit-Abhängigkeiten

- **Supabase** (Postgres, Auth, Storage) — vertraglich als
  Auftragsverarbeiter nach Art. 28 DSGVO einzubinden, bevor der
  Produktivbetrieb startet.
- **Sentry** — optional, opt-in per DSN.
- **Analyse-Dienste (GA4 / Plausible)** — nur wenn durch die Kanzlei
  konfiguriert **und** Nutzer-Einwilligung nach TTDSG § 25 vorliegt
  (Details Kap. 5 Abschnitt 5.6).
- Keine weiteren Laufzeit-Abhängigkeiten Dritter.

---

## 4.2 Installations- und Einrichtungsprozess

### Voraussetzungen

- **Node.js 20.x** (die CI-Pipeline verwendet Node 20; andere Versionen
  werden nicht getestet).
- **npm** für Paket-Installation; `package-lock.json` ist Teil des
  Repositorys.
- **Supabase-Projekt** für Produktivbetrieb (für den Demo-Modus nicht
  erforderlich).
- **Web-Browser** mit WebCrypto-API (Chrome, Firefox, Edge, Safari in
  aktuellen Versionen).

### Erstinstallation

1. Repository bezogen (Git, noch zu initialisieren — siehe
   CLAUDE.md §12 Note 11).
2. Abhängigkeiten installieren: `npm install`.
3. Konfiguration über `.env.local`:
   - `VITE_SUPABASE_URL` — Projekt-URL.
   - `VITE_SUPABASE_ANON_KEY` — anonymer Schlüssel mit RLS-Durchsetzung.
   - `VITE_SENTRY_DSN` — optional, für Fehlerprotokollierung.
4. Supabase-Migrationen einspielen: alle Dateien in `supabase/
   migrations/0001-0023` in aufsteigender Reihenfolge anwenden
   (CLI `supabase db push` oder SQL-Editor der Supabase-Konsole).
5. Erster Build zur Prüfung: `npm run build` erzeugt `dist/`
   (~6,9 MB unkomprimiert, ~2,4 MB gzipped).
6. Lokaler Start zur Abnahme: `npm run dev`, Aufruf auf
   `http://localhost:5173`.

### Initial-Datenimport

- **Kontenrahmen SKR03** kann über `/konten` importiert werden
  (Button *"SKR03-Standard laden"*, ~150 Konten). Alternativ wird
  der Plan pro Mandant manuell gepflegt.
- **Eröffnungsbilanz / Vorperioden-Salden** werden als reguläre
  Journal-Einträge mit Datum zum Stichtag eingegeben und anschließend
  festgeschrieben (siehe Kap. 2 Abschnitt 2.3.2).
- **Stammdaten** (Kanzleistamm, Steuernummer, Kleinunternehmer-Flag,
  optionaler ELSTER-Berater-Nr., Vorsteuer-Konfiguration) werden in
  `/einstellungen` gepflegt.
- **Mitarbeiter-Stammdaten** (für Lohn) werden in
  `/personal/mitarbeiter` angelegt.

### Inbetriebnahme-Prüfung

Vor Freigabe für produktive Nutzung mindestens folgendes durchlaufen:

1. Login mit Kanzlei-Leitungs-Account und Rollen-Zuweisung prüfen
   (siehe Kap. 5 Abschnitt 5.1).
2. Audit-Hash-Kette auf dem Produktiv-System erstmalig verifizieren
   (`/einstellungen/audit` → Button *"Kette prüfen"*).
3. Testweiser Z3-Export und Öffnen des Pakets; Manifest-Hashes
   stichprobenhaft prüfen.
4. Go-Live-Checkliste gemäß [`../GO-LIVE-CHECKLIST.md`](../GO-LIVE-CHECKLIST.md)
   abarbeiten.

---

## 4.3 Datensicherung

**Transparenz-Hinweis:** Eine produktive Server-seitige
Datensicherung ist zum Dokumentationszeitpunkt **NICHT
implementiert**. Sie ist als **P1-Blocker** in CLAUDE.md §10 und
detailliert in [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md)
dokumentiert. Ohne Umsetzung der dort genannten Maßnahmen ist der
Produktivbetrieb weder GoBD- noch DSGVO-konform.

### Rechtlicher Rahmen

- **§ 257 Abs. 3 HGB** — Aufbewahrungsform: Originale oder
  bildliche/inhaltliche Wiedergaben auf Bild- oder Datenträgern,
  sofern diese den Grundsätzen ordnungsmäßiger Buchführung
  entsprechen und jederzeit lesbar sind.
- **§ 147 Abs. 2 AO** — Aufbewahrung darf nicht nur archivieren,
  sondern muss Wiederaufrufbarkeit und lesbare Darstellbarkeit
  sicherstellen.
- **GoBD Rz. 100** (Internes Kontrollsystem, Datensicherung als
  Bestandteil des IKS) und Rz. 103-105 (Zugangs- und Zugriffsschutz,
  Datensicherheit).
- **DSGVO Art. 32 Abs. 1 lit. c** — *"die Fähigkeit, die
  Verfügbarkeit der personenbezogenen Daten und den Zugang zu ihnen
  bei einem physischen oder technischen Zwischenfall rasch
  wiederherzustellen"*.

### Was heute existiert

- **Clientseitiger Mandanten-Datenexport** unter `/admin/datenexport`
  (DSGVO Art. 20). Dieser ist **kein Backup** — siehe DISCLAIMER im
  erzeugten ZIP und Details in Kap. 7 Abschnitt 7.5.
- **Legacy-JSON-Export** für den Demo-Modus (`src/api/backup.ts`):
  nur für Demo-Sitzungen vorgesehen, schreibt beim Restore direkt in
  `localStorage` ohne GoBD-Prüfung — für den Produktivbetrieb **nicht
  zu verwenden** (siehe CLAUDE.md §12 Note 17).

### Was zwingend vor Go-Live umzusetzen ist

Gemäß [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md):

1. **Supabase Point-in-Time Recovery (PITR)** aktivieren, Retention
   mindestens 7 Tage (empfohlen 30 Tage).
2. **Server-seitige `pg_dump`-Jobs** (täglich, wöchentlich, monatlich,
   jährlich) — Umsetzung als Supabase Edge Function mit Cron-Trigger
   oder als separater Backup-Dienst (ggf. zusammen mit dem geplanten
   ELSTER-ERiC-Microservice).
3. **Off-Site-Replikation** nach S3 Frankfurt (DSGVO-Region),
   serverseitig verschlüsselt (SSE-S3 oder SSE-KMS), mit AVV nach
   Art. 28 DSGVO.
4. **Retention-Tier** nach AO-Fristen: täglich 30 Tage / wöchentlich
   90 Tage / monatlich 12 Monate / jährlich 10 Jahre (§ 147 Abs. 3
   AO).
5. **Restore-Runbook** mit Maximum RTO 4 Stunden, RPO 24 Stunden,
   quartalsweiser Testlauf mit schriftlichem Protokoll.
6. **Externe Absicherung der Hash-Kette** (regelmäßiger Export der
   `hash`-Werte aus `audit_log` und `journal_entries` an einen
   unabhängigen Verwahrer) — siehe Kap. 7 Abschnitt 7.3.

<!-- TODO(verfahrensdoku): Nach Umsetzung jeder der sechs Maßnahmen oben hier den Zustand auf „implementiert — siehe … ", mit Verweis auf Runbook-Dokumente und Verantwortliche:n, umschreiben. Dieser TODO wird aktiv gelöst, wenn ein Backup-Ops-Sprint durchgeführt ist. -->

### GoBD-Konformität beim Restore

Ein vollständiger Restore aus PITR oder `pg_dump` stellt den
Gesamt-Zustand wieder her; die Hash-Kette bleibt konsistent. Ein
**partieller** Restore (Überschreiben einzelner Zeilen in hashed
Tabellen) würde die Kette brechen und ist daher auf
Anwendungsebene nicht vorgesehen. Details zur Handhabung bei
DSGVO-Art.-17-Löschanträgen: Kap. 6 Abschnitt 6.3 und
[`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md).

---

## 4.4 Change-Management

### Code-Änderungs-Prozess

Änderungen laufen über Git-Pull-Requests. Für GoBD-relevante Module
(Journal, Audit, Festschreibung, Hash-Kette, Retention, Export) gilt
verschärftes Review — siehe Kap. 8 Abschnitt 8.7. Die CI-Konfiguration
unter `.github/workflows/ci.yml` ist vorhanden, aber bis zur
Initialisierung des Arbeitsverzeichnisses als Git-Repository dormant
(siehe CLAUDE.md §12 Note 10-11). Die Pipeline umfasst:

- TypeScript-Strict-Check (`tsc --noEmit`),
- ESLint (`npm run lint`),
- Tests mit Coverage (`vitest run --coverage`), aktuell
  727 Tests / 51 Dateien,
- `npm audit --audit-level=high` (derzeit advisory),
- Produktions-Build (`vite build`),
- Bundle-Size-Check (Kap. 3 Abschnitt 3.5; Obergrenze 9000 KB
  unkomprimiert),
- Artefakt-Upload (Coverage-Report, Test-Ergebnisse, `dist/`,
  Aufbewahrung 7 Tage).

### Git-Hooks (Husky)

Vor einer Commit- bzw. Push-Operation werden lokal geprüft:

- `pre-commit`: `lint-staged` auf geänderten TypeScript/React-Dateien
  (ESLint mit `--fix`).
- `pre-push`: TypeScript-Check und Vitest-Run.

Die Hooks sind ebenfalls bis zum ersten `git init` + `npm run prepare`
dormant (CLAUDE.md §12 Note 11).

### Abhängigkeits-Management

Dependabot-Konfiguration unter `.github/dependabot.yml`:

- **npm** — wöchentlich, montags, maximal 5 offene PRs; getrennte
  Gruppen für Minor/Patch versus Major; Holds auf Major-Updates für
  React, react-dom, Vite.
- **GitHub-Actions** — monatlich, maximal 3 offene PRs.

### Datenbank-Migrationen

- Migrationen werden als aufsteigend nummerierte SQL-Dateien unter
  `supabase/migrations/` hinzugefügt. **Alte Dateien werden nicht
  verändert** — jede Schema-Änderung ist eine neue Datei (CLAUDE.md
  §13, "Common mistakes").
- Migrations-Freigabe erfolgt in der Staging-Umgebung vor Übernahme
  in Produktion.
- Ein Migration-Rollback ist nicht automatisiert; umgekehrte
  Migrationen werden als weitere vorwärtsgerichtete Migration
  formuliert.

### Versionierung

- **Code-Version** folgt Semver; `package.json` trägt aktuell
  `"version": "0.0.0"`, was den Vor-Produktiv-Status widerspiegelt.
  Mit der ersten Produktivfreigabe wird auf `1.0.0` umgestellt.
- **Schema-Version** ist die höchste Migrations-Nummer (heute `0023`)
  und wird in Export-Manifesten (Z3, Mandanten-Datenexport) als
  Feld `schemaVersion` geführt, damit Altexporte identifizierbar
  bleiben.

---

## 4.5 Monitoring und Überwachung

**Transparenz-Hinweis:** Monitoring ist **partiell**. Die unten
genannten Komponenten sind verfügbar; eine produktionsreife
Alarm- und Dashboard-Infrastruktur ist zum Dokumentationszeitpunkt
**nicht eingerichtet**.

### Was heute existiert

- **Sentry** (`src/lib/monitoring/sentry.ts`) — Client-seitige
  Fehlerprotokollierung, nur aktiv bei gesetzter `VITE_SENTRY_DSN`.
  PII wird vor dem Versand gescrubbed (USt-IdNrn., IBAN,
  Steuernummern); Session-Replay läuft **nur bei Fehlern**, mit
  `maskAllText`, `maskAllInputs`, `blockAllMedia`.
- **Application-Log** (`src/api/appLog.ts`) — strukturierte
  In-App-Ereignisse, persistiert gegen `app_logs` (Migration 0011);
  lesbar unter `/einstellungen/systemlog`.
- **Audit-Log** (`audit_log`, Migration 0002 + 0003) — jede
  schreibende Operation, hash-verkettet (siehe Kap. 7).

### Was fehlt und vor Go-Live umzusetzen ist

- **Zentrale Log-Aggregation** (z. B. über Supabase-Log-Drain zu
  einer externen Sammelstelle, oder ELK/Loki/Datadog) — derzeit nicht
  vorhanden.
- **Alarm-Regeln** — Schwellen für Fehlerraten, Login-Anomalien,
  fehlgeschlagene Migrationen, Backup-Job-Ausfälle; Benachrichtigung
  an die:den System-Administrator:in.
- **Uptime-Monitoring** der Anwendung aus externer Sicht.
- **Datenbank-Metriken** (Connection-Count, Query-Laufzeiten,
  Replication-Lag bei Standby).
- **Periodische automatische Hash-Ketten-Verifikation** (über den
  manuellen UI-Aufruf hinaus) mit Alarm bei Bruch.

<!-- TODO(verfahrensdoku): Nach Einrichtung der Monitoring-Pipeline hier konkret dokumentieren: verwendetes Produkt, Alarm-Regeln, Eskalation, Aufbewahrungsdauer der Log-Daten (datenschutzkonform kurz, aber ausreichend für Incident-Analyse — Abstimmung mit DSB). Dieses TODO wird aktiv gelöst, sobald ein Monitoring-Ops-Sprint durchgeführt ist. -->

### Rechtlicher Rahmen

- **DSGVO Art. 32 Abs. 1 lit. d** — *"Verfahren zur regelmäßigen
  Überprüfung, Bewertung und Evaluierung der Wirksamkeit der
  technischen und organisatorischen Maßnahmen"*.
- **§ 203 StGB** (Verletzung von Privatgeheimnissen) — Logs dürfen
  keine unverschlüsselten Betroffenen-PII enthalten; das
  Sentry-Scrubbing ist eine Maßnahme hierzu, Anwendungs-Logs müssen
  das ebenso beachten.
- **GoBD Rz. 103-105** — Datensicherheits-Anforderungen, zu denen
  Monitoring als Erkennungsmechanismus gehört.

---

## 4.6 Notfall-Konzept

**Transparenz-Hinweis:** Ein vollständiges, getestetes
Notfall-Konzept existiert noch nicht. Die unten genannten Elemente
sind der aktuelle Stand; Ausbau gehört zu den Go-Live-Voraussetzungen.

### Abgedeckte Szenarien (Grobplan)

| Szenario | Erkennung | Erstmaßnahme | Verantwortlich |
|---|---|---|---|
| Supabase-Projekt ausgefallen | Login schlägt fehl; Status-Seite des Anbieters | Supabase-Status beobachten; Nutzer informieren | System-Admin |
| Hosting-Ausfall (Frontend) | Status-Seite des Hosters | Auf ausgewichenen Provider umschalten (Ausbau-Anforderung, siehe Kap. 4.6 TODO) | System-Admin |
| Versehentliche Datenlöschung (Anwendungsebene) | Meldung durch Anwender:in | PITR-Wiederherstellung (nach Aktivierung) auf Zeitpunkt vor der Löschung | System-Admin + Kanzlei-Leitung |
| Sicherheitsvorfall / unautorisierter Zugriff | Audit-Log-Anomalie, Hash-Ketten-Bruch, Sentry-Fehler, Dritteinwirkung-Hinweis | Sofortiger Passwort-Reset für betroffene Accounts, Sperre kompromittierter Accounts; Incident-Register `privacy_incidents` anlegen; 72-Stunden-Meldung nach Art. 33 DSGVO prüfen | System-Admin + DSB + Kanzlei-Leitung |
| Konto-Kompromittierung | Ungewöhnliche Aktivität im Audit-Log | Account-Sperre, Passwort-Reset, Review aller Aktivitäten seit Kompromittierung | System-Admin |
| Hash-Ketten-Bruch | `verifyAuditChain()` meldet Defekt | Erste gebrochene Zeile identifizieren, Audit-Log der Zeile nachvollziehen, Eskalation | System-Admin + Kanzlei-Leitung |

### Rechtlicher Rahmen

- **DSGVO Art. 32 Abs. 1 lit. c** — rasche Wiederherstellbarkeit.
- **DSGVO Art. 33** — 72-Stunden-Meldung bei Datenschutzverletzungen
  (Details Kap. 5 Abschnitt 5.8 bzw. Kap. 7 Abschnitt 7.6).

<!-- TODO(verfahrensdoku): Vor Go-Live aus den Grobszenarien ein schriftliches Runbook machen: pro Szenario Entdeckungsweg, Erstmaßnahme, Kommunikationsplan (intern + Mandant), Zeitziele (RTO/RPO), Verantwortliche mit Kontaktdaten, dokumentierte Vorlagen für Behörden- und Betroffenen-Meldungen. Jährlicher Übungslauf empfohlen. -->

### Business-Continuity in der Entwicklungsphase

Solange das Verfahren nicht produktiv eingesetzt wird, ist die
Business-Continuity-Anforderung minimal: der Code im Repository, die
Migrationen und diese Dokumentation sind die tragenden Artefakte.
Mit Produktivbetrieb ändert sich dieser Rahmen; die dann erforderliche
Planung ist Teil der Go-Live-Vorbereitung
([`../GO-LIVE-CHECKLIST.md`](../GO-LIVE-CHECKLIST.md)).

---

## 4.7 Release-Prozess und Versionsverwaltung

### Release-Definition

Ein **Release** ist ein getaggter Stand des Codes in der
Versionsverwaltung, für den die CI-Pipeline grün abgeschlossen hat
und der als Produktions-Build in `dist/` vorliegt. Die
Versionsnummer folgt Semver (siehe Abschnitt 4.4 oben).

### Ablauf (nach Aktivierung der CI-Pipeline)

1. Pull-Request wird nach Review und grüner CI in den
   `develop`-Branch gemergt.
2. Nach Staging-Abnahme (fachliche Prüfung + Plausi-Läufe, inkl.
   Z3-Export-Dry-Run und Audit-Ketten-Verifikation auf Staging-Daten)
   wird `develop` in `main` gemergt.
3. Tagging auf `main`: `vX.Y.Z`.
4. Der CI-Workflow `deploy-production.yml` triggert den
   Produktions-Deploy nach manueller Freigabe (Umgebungsschutz in
   GitHub).
5. Release-Eintrag im Changelog mit Liste der geschlossenen Issues
   und aller Schema-Migrationen, die mit diesem Release einziehen.

<!-- TODO(verfahrensdoku): Changelog-Konvention festlegen (z. B. Keep-a-Changelog-Format) und im Repository ein CHANGELOG.md pflegen. -->

### Rollback

- **Anwendungs-Rollback:** Re-Deploy des vorherigen `dist/`-Artefakts
  aus dem CI-Artefakt-Archiv (Aufbewahrung 7 Tage, siehe
  `.github/workflows/ci.yml`). Für ältere Stände: Re-Build auf dem
  vorherigen Git-Tag.
- **Schema-Rollback:** Nicht automatisiert. Ein Rückwärts-Migrations-
  Schritt wird als neue, vorwärtsgerichtete Migration formuliert.
  Bei Schema-betreffenden Releases ist ein Pre-Produktions-Snapshot
  (siehe Abschnitt 4.3 nach Umsetzung) erforderlich.
- **Daten-Rollback:** ausschließlich über PITR (nach Aktivierung)
  oder einen gesicherten Snapshot; kein partieller Restore auf
  hashed Tabellen.

### Kommunikation an Anwender:innen

- **Geplante Release-Fenster** werden vorab mit der Kanzlei-Leitung
  abgestimmt.
- **Unterbrechungs-freie Releases** sind bei reinen Frontend-Änderungen
  möglich; bei Schema-Migrationen ist ein kurzes Wartungsfenster
  vorzusehen.
- **Nach dem Release** kurze Release-Notes für Anwender:innen
  (sichtbare Änderungen, neue oder geänderte Pflicht-Workflows, ggf.
  Schulungshinweis).

Verweise: Anwendungs-Workflow-Änderungen → Kap. 2; technische
Details pro Release → Changelog (siehe TODO oben); Freigabe-Rollen
und 4-Augen-Prinzip → Kap. 8 Abschnitt 8.7.

---

## Quellen & Referenzen

- **Handelsgesetzbuch (HGB):** § 257 Abs. 3 (Aufbewahrungsform,
  jederzeit lesbare Wiedergabe).
- **Abgabenordnung (AO):** § 146 Abs. 4 (Unveränderbarkeit, Kontext
  zu Abschnitt 4.3); § 147 Abs. 2 (ordnungsmäßige Aufbewahrung,
  Verfügbarkeit); § 147 Abs. 3 (Aufbewahrungsfristen, Grundlage für
  Retention-Tiers in Abschnitt 4.3).
- **BMF-Schreiben zu den GoBD vom 28.11.2019** in der jeweils
  aktuellen Fassung: Rz. 100 (Internes Kontrollsystem, Kontext zur
  Datensicherung als IKS-Bestandteil); Rz. 103-105 (Datensicherheit,
  Zugangs- und Zugriffsschutz).
- **Verordnung (EU) 2016/679 (DSGVO):** Art. 28 (Auftragsverarbeitung,
  relevant für Supabase- und S3-AVV); Art. 32 Abs. 1 lit. c (rasche
  Wiederherstellbarkeit); Art. 32 Abs. 1 lit. d (regelmäßige
  Überprüfung); Art. 33 (72-Stunden-Meldepflicht); Art. 44 ff.
  (Drittstaatenübermittlung, Kontext Serverstandort).
- **Strafgesetzbuch (StGB):** § 203 (Verletzung von
  Privatgeheimnissen, Kontext Logging-Inhalte in Abschnitt 4.5).
- **Wachstumschancengesetz 2025** — 8-Jahres-Frist für
  Buchungsbelege (§ 147 Abs. 3 AO n.F.).

### Interne Projekt-Referenzen

- [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md) — P1-Ops-Blocker
  und die sechs konkreten Umsetzungs-Maßnahmen für Abschnitt 4.3.
- [`../GO-LIVE-CHECKLIST.md`](../GO-LIVE-CHECKLIST.md) — T-4W → Launch
  → Post-Launch; Abnahmekriterien für die in diesem Kapitel als offen
  markierten Punkte.
- [`../../CLAUDE.md`](../../CLAUDE.md) §10 (Outstanding Blockers,
  insb. P1.3 Backup), §12 (Known Limitations, insb. Note 6
  *tamper-evident/nicht WORM*, Note 10-11 CI/Husky dormant, Note 12
  Sentry opt-in, Note 17 Legacy-Backup nicht extensio-fähig).
- [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml),
  [`deploy-staging.yml`](../../.github/workflows/deploy-staging.yml),
  [`deploy-production.yml`](../../.github/workflows/deploy-production.yml)
  — CI- und Deploy-Pipelines (dormant).
- [`../../.github/dependabot.yml`](../../.github/dependabot.yml) —
  Abhängigkeits-Management-Konfiguration.
- [`../../.husky/pre-commit`](../../.husky/pre-commit),
  [`pre-push`](../../.husky/pre-push) — lokale Git-Hooks.
- [`../../src/lib/monitoring/sentry.ts`](../../src/lib/monitoring/sentry.ts)
  — Fehlerprotokollierung mit PII-Scrub.
- [`../../src/api/appLog.ts`](../../src/api/appLog.ts) — strukturierte
  App-Ereignis-Persistenz (`app_logs`, Migration 0011).
- [`../../supabase/migrations/`](../../supabase/migrations/) —
  Schema-Historie 0001-0023.
- Kap. 1 Abschnitt 1.3 + 1.4 + 1.5; Kap. 3 (Technik, Test-Pipeline);
  Kap. 5 (Datensicherheits-Konzept); Kap. 7 (Audit-Kette,
  Z3-Export); Kap. 8 (IKS, Code-Review-Pflichten).
