# Extract: dr-ha-bcm-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/dr-ha-bcm-v1.md
- Dateigröße: 51.5 KB
- Zeilenanzahl: 429
- Erstellt am: 2026-05-09T02:26:45+02:00
- Erste H1-Überschrift im Dokument: DR-/HA-/BCM-Folgeartefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der fachlichen Boundary-Aussagen für DR (Disaster-Recovery), HA (Hochverfügbarkeit) und BCM (Business Continuity Management / Geschäftsfortführung) in Harouda; Konkretisierung der in F3-D2 angelegten Verfügbarkeits-/Wiederherstellungs-Boundary auf Topik-Ebene und Hinzufügung der in Register §6 Sortierungsmarker B benannten Near-zero-Topoi außerhalb F3-D2 — durchgehend ohne Garantie- oder Konformitäts-Anspruch und ohne Implementierungsregel.

## 3. Hauptthemen (max 5 Bullet Points)
- DR-/HA-/BCM-Trio-Terminologie-Boundary (komplementäre, nicht-substituierende Topoi)
- RPO-/RTO-Boundary mit F3-D2-Default (RPO 24 h / RTO 48 h) als Produktpolitik; Near-zero-RPO/RTO als Boundary-Topik außerhalb F3-D2
- Fünf Restore-Modi auf Topik-Ebene (Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic)
- Custody-/Plaintext-Restore-Boundary, Mandantentrennung im Restore (F0-D6), Berechtigungen-/Identity-Boundary (F0-D7), Ransomware-Restore-Boundary
- Trennlinien gegenüber Retention-Archiv, Z3-/Datenüberlassung, Migration, Custody, ASVS, TR-02102-Detail, Cybersecurity-IR

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(§21.8 verbietet ausdrücklich „Implementierung, Datenmodell, Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definition, Test-Cases, Test-Methodik, CI/CD-Konfiguration oder konkrete Konfigurations-Werte"; §22 listet Schema, Programmcode, APIs als Non-Scope.)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(§21.7 verbietet „konkrete Cluster-Topologie, Replikations-Topologie, Datenbank-Cluster-Modelle, Backup-Skripte, Restore-Skripte, Snapshot-Werkzeuge oder operative Runbooks"; §21.10 verbietet IR-Runbook/Forensik-Workflow im Detail. Die fünf Restore-Modi in §7 sind reine fachliche Klassen ohne konkrete Mechanik.)

## 6. Rechtsgrundlagen-Erwähnungen
- "AO § 147" — wird im Tabellen-Eintrag „Authoritative Quelle" der §8-Trennungstabelle als Quelle für das Aufbewahrungs-/Retention-Archiv referenziert (Retention V1.0 + AO § 147 / HGB § 257 / GoBD); in §21.23 wird eine Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 als STOP-Bedingung verboten.
- "HGB § 257" — Quelle für das Aufbewahrungs-/Retention-Archiv neben AO § 147 / GoBD (§8); §21.23 verbietet Umgehungs-Vorschläge.
- "GoBD" — Quelle für Aufbewahrungs-/Retention-Archiv (§8); „GoBD Rz. 142–144" als authoritative Quelle für Migration (§8-Tabelle).
- "DSGVO Art. 33/34" — wird als Operationalisierungs-Gegenstand des DSGVO-/Datenpannen-Folgeartefakts in §23 Downstream genannt; in V1.0 selbst keine Würdigung.
- "Locked Decisions Register §3.11" — Authoritatives DR-Anforderungsmodell F3-D2 V1.0 (DR-Backup ≠ Aufbewahrungs-/Retention-Archiv ≠ Z3-Export; RPO/RTO als Harouda-SLA-/Risk-Targets, nicht gesetzlich).
- "Locked Decisions Register §6 Sortierungsmarker B" — direkte Verankerungs-Quelle „Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2".
- "Locked Decisions Register §6 Sortierungsmarker C" — Cybersecurity-Incident-Response-Artefakt eigenständig enumeriert (§19).

(Negativ erwähnt, ausdrücklich KEINE Lock-Quelle: ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116, NIST, ENISA — gemäß §3, §21.2, §21.5.)

## 7. Rule-ID-Erwähnungen
Keine Rule-IDs erwähnt.

(Die Spec verwendet STOP-Klauseln (21.1 bis 21.26), Lock-Bezeichner F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing sowie §28.11-bet als Register-Marker; diese entsprechen nicht dem Rule-ID-Muster `RULE-[A-Z]+-\d+`.)

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "DR-/HA-/BCM ≠ Implementierung." V1.0 enthält keine Implementierung, kein Datenmodell, kein Schema, kein UI/UX, keinen Programmcode, keinen Pseudocode, kein Algorithmus-Design, kein SQL und keine API-Definition.
- "DR-/HA-/BCM ≠ Garantie." Keine RPO-/RTO-Garantie, keine Verlust-Garantie, keine Verfügbarkeits-Garantie, keine Wiederanlauf-Garantie; „RPO/RTO sind Harouda-SLA-/Risk-Targets, nicht gesetzlich".
- "F3-D2-Default als Produktpolitik: RPO 24 h / RTO 48 h."
- "DR-Backup ≠ Aufbewahrungs-/Retention-Archiv" (Konsistenz Retention V1.0 §6.1).
- "DR-Backup ≠ Z3-/Datenüberlassung" (Konsistenz F3-Closing).
- "DR-Restore ≠ Migrations-Rollback" (Konsistenz F3-D2 / Retention V1.0 §6.4 / Security V1.0 §10/§11).
- "Recovery hebt Festschreibung nicht auf" (Konsistenz F0-D4).
- "Restore darf keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen" (Konsistenz F3-D2 / Security V1.0 §10 / Custody V1.0 §5/§11).
- "Kein Cross-Mandanten-Restore" (Konsistenz F0-D6); mandantenspezifischer Restore-Modus wahrt F0-D6 strikt.
- "Ransomware-Restore ist erst nach Integritätsprüfung und forensischer Freigabe zulässig" (Konsistenz F3-D2, Security V1.0 §10, Lösch-/Sperrkonzept V1.0 §7 „Sicherheits-/Forensik-Halt").

## 9. Offene Punkte / TODOs / Lücken in der Spec
- §1 / §20 / §21.20: „§28.11-bet bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht."
- §6: „Konkrete RPO-/RTO-Werte über die F3-D2-Defaults hinaus werden in V1.0 dieses Artefakts nicht festgelegt." (offen für separat zu autorisierende spätere Versions-Pflege)
- §6: „Konkrete Near-Zero-Werte (z. B. spezifische Sekunden-/Minuten-/Stunden-Angaben) werden in V1.0 dieses Artefakts nicht festgelegt."
- §23 Downstream — offene Detail-Folgeartefakte: spätere Versions-Pflege RPO/RTO, Operative DR-Detail-Folgeartefakte, Architektur-/HA-Detail-Folgeartefakt, BCM-Detail-Folgeartefakt, KMS-/HSM-/Implementations-Folgeartefakt, Cybersecurity-Incident-Response-Folgeartefakt, Z3-/Datenüberlassungs-Spezifikations-Artefakt, Migrations-Folgeartefakt, DSGVO-/Datenpannen-Folgeartefakt, Verfahrensdokumentation Kap. 5 und Kap. 6 (nächste Pflege).
- §21.23: rechtliche Würdigung von Crypto-Shredding bleibt offen (STOP-Bedingung).

## 10. Verweise auf andere Specs
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (direkte Lock-Basis; §6.1, §6.4, §15)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (direkte Lock-Basis; §10, §17)
- Lösch-/Sperrkonzept-Artefakt V1.0 (direkte Lock-Basis; §7, §11, §14)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (indirekt; §12, §16)
- Custody-Modell-Boundary-Artefakt V1.0 (direkte Lock-Basis; §5, §6, §10, §11, §15)
- ASVS-Control-Referenz-Artefakt V1.0 (indirekt; §9, §14)
- TR-02102-Detail-Artefakt V1.0 (indirekt; §11, §15, §18)
- Cybersecurity-Incident-Response-Folgeartefakt (Sortierungsmarker C; getrennt)
- KMS-/HSM-/Implementations-Folgeartefakt (Schlüssel-Wiederherstellungs-Mechanik downstream)
- Z3-/Datenüberlassungs-Spezifikations-Artefakt
- Migrations-Folgeartefakt
- DSGVO-/Datenpannen-Folgeartefakt
- Verfahrensdokumentation Kap. 5 / Kap. 6 (nächste Pflege)
- Locked Decisions Register V1.0 §3.11 / F3-D2 V1.0 / §6 Sortierungsmarker B

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§21.6 verbietet „eine konkrete Cloud-, Anbieter-, Werkzeug-, Backup-Tool-, Replikations-Werkzeug-, Storage-Anbieter-, Plattform-, Produkt-, Hardware- oder Bibliotheks-Wahl". §22 listet Cloud-/Anbieter-/Werkzeug-/Vendor-/Hardware-/Bibliotheks-Wahl, Datenbank-/Dateisystem-Schema, APIs, SQL, automatische Jobs, CI/CD-Konfiguration als Non-Scope. PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
