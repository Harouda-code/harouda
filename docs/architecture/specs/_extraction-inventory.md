# Spec-Inventar · docs/architecture/specs/

Erfassungs-Tag: 2026-05-16
Anzahl V1-Specs: 17 (alle mit Suffix `-v1.md`)
Quelle für Zeilenzahl: `wc -l`
Quelle für Dateigröße: `ls -la` (Bytes; Anzeige in KB mit einer Nachkommastelle)
Quelle für „Erstellt am": Git-Log erstes-Add (`git log --format="%aI" --diff-filter=A -- <file>`)
Quelle für „Letzte Änderung": Filesystem-mtime aus `ls -la`

| # | Dateiname | KB | Zeilen | Erstellt am (ISO) | Letzte Änderung (mtime) |
|---|---|---:|---:|---|---|
| 1 | accounting-service-v1.md | 18.6 | 429 | 2026-05-02T17:12:56+02:00 | May 2 17:14 |
| 2 | asvs-control-referenz-v1.md | 34.8 | 305 | 2026-05-09T00:49:56+02:00 | May 9 00:45 |
| 3 | custody-modell-v1.md | 37.9 | 328 | 2026-05-09T00:16:28+02:00 | May 9 00:11 |
| 4 | cybersecurity-incident-response-v1.md | 51.0 | 411 | 2026-05-09T13:24:03+02:00 | May 9 13:17 |
| 5 | dokumentenkategorie-retention-regelmatrix-v1.md | 32.8 | 321 | 2026-05-08T23:17:36+02:00 | May 8 23:13 |
| 6 | dr-ha-bcm-v1.md | 51.5 | 429 | 2026-05-09T02:26:45+02:00 | May 9 02:22 |
| 7 | dsgvo-datenpannen-v1.md | 45.9 | 349 | 2026-05-09T14:17:52+02:00 | May 9 14:12 |
| 8 | kms-hsm-implementations-v1.md | 60.5 | 409 | 2026-05-09T16:38:10+02:00 | May 9 16:33 |
| 9 | loesch-sperrkonzept-v1.md | 26.6 | 282 | 2026-05-08T22:48:41+02:00 | May 8 22:42 |
| 10 | lohn-dls-v1.md | 52.3 | 374 | 2026-05-09T17:43:13+02:00 | May 9 17:40 |
| 11 | migration-v1.md | 54.5 | 412 | 2026-05-09T15:26:29+02:00 | May 9 15:21 |
| 12 | retention-aufbewahrungsarchiv-v1.md | 23.7 | 300 | 2026-05-08T20:44:20+02:00 | May 8 20:38 |
| 13 | security-key-custody-v1.md | 23.5 | 292 | 2026-05-08T22:16:22+02:00 | May 8 22:07 |
| 14 | tr-02102-detail-v1.md | 39.5 | 346 | 2026-05-09T01:48:53+02:00 | May 9 01:43 |
| 15 | verfahrensdokumentation-v1.md | 50.6 | 398 | 2026-05-09T15:59:56+02:00 | May 9 15:56 |
| 16 | z1-z2-datenzugriffe-v1.md | 56.9 | 437 | 2026-05-09T17:14:55+02:00 | May 9 17:11 |
| 17 | z3-datenueberlassung-v1.md | 44.5 | 345 | 2026-05-09T14:51:44+02:00 | May 9 14:47 |

**Summen**: 17 Specs · Σ 705.1 KB · Σ 6167 Zeilen.

**Erste H1-Titel**:

| # | Datei | H1-Titel |
|---|---|---|
| 1 | accounting-service-v1.md | Accounting Service Specification v1.0 |
| 2 | asvs-control-referenz-v1.md | ASVS-Control-Referenz-Artefakt — V1.0 |
| 3 | custody-modell-v1.md | Custody-Modell-Boundary-Artefakt — V1.0 |
| 4 | cybersecurity-incident-response-v1.md | Cybersecurity-Incident-Response-Folgeartefakt — V1.0 |
| 5 | dokumentenkategorie-retention-regelmatrix-v1.md | Dokumentenkategorie-/Retention-Regelmatrix — V1.0 |
| 6 | dr-ha-bcm-v1.md | DR-/HA-/BCM-Folgeartefakt — V1.0 |
| 7 | dsgvo-datenpannen-v1.md | DSGVO-/Datenpannen-Folgeartefakt V1.0 |
| 8 | kms-hsm-implementations-v1.md | KMS-/HSM-/Implementations-Folgeartefakt V1.0 |
| 9 | loesch-sperrkonzept-v1.md | Lösch-/Sperrkonzept-Artefakt — V1.0 |
| 10 | lohn-dls-v1.md | Lohn-DLS-Folgeartefakt V1.0 |
| 11 | migration-v1.md | Migrations-Folgeartefakt V1.0 |
| 12 | retention-aufbewahrungsarchiv-v1.md | Aufbewahrungs-/Retention-Archiv-Artefakt — V1.0 |
| 13 | security-key-custody-v1.md | Security-/Krypto-/Key-Custody-Artefakt — V1.0 |
| 14 | tr-02102-detail-v1.md | TR-02102-Detail-Artefakt — V1.0 |
| 15 | verfahrensdokumentation-v1.md | Verfahrensdokumentations-Pflege-Pass V1.0 |
| 16 | z1-z2-datenzugriffe-v1.md | Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0 |
| 17 | z3-datenueberlassung-v1.md | Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 |

**Prüfungen**:
- Alle 17 Dateien tragen das Suffix `-v1.md`. ✓
- Alle 17 Dateien haben eine erkennbare H1-Überschrift in Zeile 1. ✓
- Alle 17 Dateien sind ≥ 23 KB (keine Datei unter 1 KB). ✓
- Anzahl `*.md`-Dateien im Verzeichnis: 18 (17 Specs + `README.md`). Die README ist im Inventar **nicht** enthalten, weil sie keine Spec-Datei ist.
- Keine strukturellen Anomalien festgestellt.
