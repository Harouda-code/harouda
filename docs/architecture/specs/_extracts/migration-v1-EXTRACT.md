# Extract: migration-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/migration-v1.md
- Dateigröße: 55.0 KB
- Zeilenanzahl: 412
- Erstellt am: 2026-05-10T13:37:35+02:00
- Erste H1-Überschrift im Dokument: Migrations-Folgeartefakt V1.0

## 2. Zweck der Spec (in einem Satz)
Boundary-Lock-Layer-Paraphrase des im Locked Decisions Register V1.0 §3.12 (F3-D3) und §3.13 (F3-Closing) bereits autoritativ gesetzten Migrations-Boundary — Migration ausschließlich als Formatumsetzung ohne Inhaltsänderung, Cutover als Grenze, Roll-back ≠ DR-Restore, Plattform-Admin technisch ohne Inhalts-/Secrets-Zugriff.

## 3. Hauptthemen (max 5 Bullet Points)
- Migrations-Topoi (Mandanten-Migration, Kanzlei-Vollmigration, Cloud-Provider-Exit, Plattform-Wechsel, Inbound, Outbound, Test-Migration, Parallel-Betrieb, Roll-back / Migrations-Abbruch)
- Inhaltliche Migrations-Disziplin: Formatumsetzung ohne Inhaltsänderung; importierte Fremdsystem-Festschreibungen/USt-Werte bleiben historische Fremdsystemwerte; Cutover ist Grenze, kein Beförderungsweg; keine native F0-D4-Re-Festschreibung
- Mehrmandanten-Migrations-Disziplin: getrennte Pakete/Manifeste/Audit-Spuren/Freigaben/Roll-back-Pfade
- Test-Migrations-Boundary: DSGVO-Rechtsgrundlage, Zweckbindung, F0-D7-Freigabe, F0-D6-Mandantentrennung, Bereinigungspflicht, Audit-Spur (alles als Topoi)
- Roll-back-Boundary mit fünf Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz; Roll-back ≠ DR-Restore

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(Non-Scope: „Datenmapping-Tabellen, Feld-Mappings, Wert-Übersetzungs-Tabellen; ETL-Regeln, Daten-Cleansing-Regeln, Reconciliation-Algorithmen, Datenqualitäts-Schwellwerte; Import-/Export-Schemata, Daten-Wörterbücher, Quell-/Ziel-System-Adapter, Manifest-Strukturen; Datenbank-Migrations-Skripte, DDL, DML, SQL und Query-Spezifikation"; konkrete Manifest-Struktur ist Non-Scope; konkrete Audit-Schema-Felder sind Non-Scope.)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(Non-Scope: „Konkrete Migrations-Mechanik, Cutover-Workflow-Implementierung, Roll-back-Skripte, Migrations-Abbruchs-Mechanik; konkrete produktive Migrations-Fenster, Live-Cutover-Pläne, Eskalations-Trigger-Werte; konkreter Freigabe-Workflow; konkrete Bereinigungs-Mechanik". Migrations-Topoi sind reine Boundary-Topos-Verweise ohne Mechanik.)

## 6. Rechtsgrundlagen-Erwähnungen
- "GoBD Rz. 142–144" — Migration (F3-D3); ausschließlich über die Paraphrase im Locked Decisions Register §3.12 (Cross-Ref).
- "DSGVO Art. 20" — Recht auf Datenübertragbarkeit; „eng auszulegen im Migrations-Kontext"; Topos-Verweis ausschließlich über die Paraphrase im Register §3.12; keine Würdigung in V1.0.
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; „Zugriffsbeschränkung in Test-Migration"; Topos-Verweis ausschließlich über die Paraphrase im Register §3.12.
- "DSGVO-Rechtsgrundlage" — generischer Topos-Verweis im Kontext Test-Migration mit Produktivdaten; konkrete rechtliche Auslegung im Einzelfall ist Non-Scope; verbleibt der Rechts-/DSB-Funktion außerhalb dieses Folgeartefakts.

(Ausdrücklich KEINE Lock-Quelle: ISO 22301, ISO 27035, BSI IT-Grundschutz, BSI TR-03116, NIST SP 800-61, NIST SP 800-86, ENISA sowie GoBD-/AO-/DSGVO-Volltext.)

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-D1", "F3-D2", "F3-D3", "F3-Closing" — Locked-Decisions-Register-Boundary-IDs durchgehend referenziert.
- "Register §3.12 F3-D3 Migrations-Spezifikation V1.0 — locked" — direkte autoritative Lock-Basis; 71 STOP-Kandidaten.
- "Register §3.13 / F3-Closing" — Cross-Boundary-Authoritat („DR-Restore ≠ Migration-Roll-back"; „Z3-Export ≠ Migrations-Export"; „Migration ≠ native Re-Festschreibung"; §4.2/§4.3/§4.4 F3-D3).
- "STOP 29.24" — Lohn-DLS-Trennung.
- "STOP 21.13" (DR V1.0), "STOP 14.12" (Regelmatrix V1.0), "STOP 16.9" (TR-02102 V1.0), "STOP 21.1" (IR V1.0), "STOP 20.1" (DSGVO V1.0), "STOP 12.7" (Lösch-/Sperrkonzept V1.0), "STOP 24.1" (Z3 V1.0).
- "§28.11-bet" — bleibt unverändert/offen.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Migration als eigenständiges Topik unter F3-D3 und keine Sub-Topik einer anderen Boundary."
- "Migration ≠ DR-Restore. DR-Backup-/DR-Restore-Mechanik verbleibt strikt DR-/HA-/BCM V1.0 (F3-D2)."
- "Migrations-Rollback ≠ DR-Restore. Roll-back ist die Rückabwicklung einer geplanten Modell-/Systemänderung; DR-Restore ist der Wiederanlauf nach technischer Störung."
- "Migration ≠ Z3-/Datenüberlassung. Migrations-Export und Z3-Export sind getrennte Anlässe (F3-Closing §3.13; Z3 V1.0 §4/§9)."
- "Migration ≠ Aufbewahrungs-/Retention-Archiv. Retention-Archiv-Boundary verbleibt strikt Retention V1.0."
- "Migration ≠ Custody / Schlüssel / Plaintext-Umweg. Migrations-Pfade dürfen nicht zur Plaintext-Beschaffung durch Plattform-Administration genutzt werden."
- "Formatumsetzung ohne Inhaltsänderung: Migration darf nur Formatumsetzung leisten und keine inhaltliche Änderung der zu migrierenden Daten vornehmen."
- "Importierte Fremdsystem-Festschreibungen bleiben historische Fremdsystem-Tatsachen — keine native F0-D4-Festschreibung."
- "Importierte Fremdsystem-USt-Werte bleiben historische Fremdsystemwerte — keine nativen F1-D1/F1-D2-Werte."
- "Cutover ist Grenze, kein Beförderungsweg. Plattform-Admin nur technisch; keine fachliche Migrationsentscheidung; kein Inhalts-/Secrets-Zugriff (F0-D7)."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Open Question Crypto-Shredding rechtliche Einordnung" — Release-Blocker für produktive Anwendung; keine rechtliche Würdigung in V1.0.
- "§28.11-bet bleibt unverändert/offen".
- "Konkrete Migrations-Mechanik, Cutover-Workflow-Implementierung, Roll-back-Skripte" — Non-Scope; downstream.
- "Datenmapping, Feld-Mapping, ETL, Reconciliation, Cleansing" — Non-Scope; downstream.
- "Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6" — Non-Scope; nächste Pflege.
- "Externe steuerprüfungs-fachliche Validierung sowie ggf. DSB-/Sicherheits-/Produktivfreigabe bleibt vor produktiver Anwendung erforderlich".

## 10. Verweise auf andere Specs
- Locked Decisions Register V1.0 §3.12 (F3-D3) (direkte autoritative Lock-Basis; bindend für Migrations-Folgeartefakte und Cutover-Workflow-Folgeartefakte)
- Locked Decisions Register V1.0 §3.13 / F3-Closing (Cross-Boundary-Authoritat)
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §6.3/§6.4/§15/§17 (Trennlinien-Anker Retention vs. Migration)
- DR-/HA-/BCM-Folgeartefakt V1.0 §1/§6/§8/§17/§20/§21 STOP 21.13 (zentraler Trennlinien-Anker DR vs. Migration)
- Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §4/§9/§22/§24/§25 (direkter Downstream-Verweis)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 §1/§10/§17/§19 (Plaintext-/Custody-Boundary)
- Custody-Modell-Boundary-Artefakt V1.0 §3/§10/§11/§13/§15 (Plaintext-Boundary über Migrations-Pfade)
- KMS-/HSM-/Implementations-Folgeartefakt V1.0 (Schlüssel-Boundary)
- Lösch-/Sperrkonzept-Artefakt V1.0 §10/§11/§14 STOP 12.7
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 §10/§16 STOP 14.12
- ASVS-Control-Referenz-Artefakt V1.0 §11/§14
- TR-02102-Detail-Artefakt V1.0 §15/§18 STOP 16.9
- Cybersecurity-Incident-Response-Folgeartefakt V1.0 §17 STOP 21.1, §19, §22
- DSGVO-/Datenpannen-Folgeartefakt V1.0 §17/§20 STOP 20.1/§22
- Lohn-DLS-Folgeartefakt V1.0 (Verhältnis-Section §22; STOP 29.24)
- Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0
- Verfahrensdokumentation Kap. 5 / Kap. 6 (nächste Pflege)
- Open Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(Non-Scope: „Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-Wahl". PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
