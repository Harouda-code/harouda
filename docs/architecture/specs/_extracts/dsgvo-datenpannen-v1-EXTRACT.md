# Extract: dsgvo-datenpannen-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/dsgvo-datenpannen-v1.md
- Dateigröße: 45.9 KB
- Zeilenanzahl: 349
- Erstellt am: 2026-05-09T14:17:52+02:00
- Erste H1-Überschrift im Dokument: DSGVO-/Datenpannen-Folgeartefakt V1.0

## 2. Zweck der Spec (in einem Satz)
Konkretisierung der im Harouda Locked Decisions Register V1.0 §3 Z. 349 sowie §6 Sortierungsmarker C angelegten Datenpannen-Boundary auf der Ebene paraphrasierter DSGVO-Topoi (Art. 33 Meldepflicht-Topos, Art. 34 Betroffenen-Informations-Topos, Art. 39 DSB-Aufgaben-Topos), inklusive strikter Trennung gegenüber dem Cybersecurity-Incident-Response-Folgeartefakt V1.0 trotz geteilter Marker C und Bezugnahme auf den Sperrgrund „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7.

## 3. Hauptthemen (max 5 Bullet Points)
- DSGVO Art. 33 Meldepflicht-Topos, Art. 34 Betroffenen-Informations-Topos, Art. 39 DSB-Aufgaben-Topos (jeweils Topos-Verweise ohne Auslegung)
- Risiko-/Schwellen-Boundary und Aufsichtsbehörden-Melde-Boundary ohne Frist-Zähler-Implementierung
- Strikte Trennung gegenüber Cybersecurity-IR V1.0 trotz geteilter Marker C im Locked Decisions Register §6
- Verhältnis zum Sperrgrund „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7
- Cross-Boundary-Konsistenz mit Retention, Regelmatrix, Custody, Security, ASVS, TR-02102-Detail, DR-/HA-/BCM, IR und gesperrten Harouda-Locks

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(§10: „Kein Schema: Schema-Felder, Datenbank-Tabellen, Dokument-Strukturen, Indizes oder Aufbewahrungs-Mechanik sind Non-Scope." §20.11: STOP bei „Datenbank-/Dateisystem-Schemata, Programmcode, Pseudocode, SQL, UI/UX, APIs, automatische Jobs, Test-Cases oder CI/CD-Konfiguration". §20.12: STOP bei „Beweis-/Log-Schemata, chain-of-custody-Felder, Hash-Verfahren-Festlegungen oder Zeitstempel-Verfahren-Festlegungen".)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(§20.10: STOP bei „Runbooks, Schritt-für-Schritt-Anweisungen, Befehlssequenzen, Detection-Regeln oder konkrete Eskalations-Trigger-Werte". §5 Datenschutz-Vorfallsprozess Boundary nennt zwar Topoi wie „Initialer Bewertungs-Topos", „Risiko-Bewertungs-Topos", „Meldepflicht-Topos", „Information-Topos", „DSB-Einbindungs-Topos", „Nachweis-Topos", „Abschluss-Topos" — alle sind reine Topik-Verweise ohne Workflow-Mechanik; die operative Workflow-Steuerung verbleibt strikt Cybersecurity-IR V1.0.)

## 6. Rechtsgrundlagen-Erwähnungen
- "DSGVO Art. 17" — wird in §18 als Maßstab referenziert: Crypto-Shredding-Rechtsfrage, ob es Löschung im Sinne von Art. 17 darstellt — V1.0 trifft keine Würdigung.
- "DSGVO Art. 18" — Recht auf Einschränkung der Verarbeitung; in §12 als „eigenständige Topik im Lösch-/Sperrkonzept V1.0" referenziert (nicht vermischt mit Datenpannen-Topik).
- "DSGVO Art. 28" — Auftragsverarbeitungs-Vertrags-Wortlaut (STOP-Bedingung §20.22; Non-Scope).
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; in §16 ausschließlich als Topos-Verweis auf Security V1.0; Auslegung Non-Scope.
- "DSGVO Art. 33" — Meldepflicht gegenüber der Aufsichtsbehörde; in §1/§5/§7 als Topik referenziert ohne konkrete Frist-Zähler-Implementierung.
- "DSGVO Art. 33 Abs. 5" — Dokumentations-Topik der Vorfalls-Dokumentation (§5 Nachweis-Topos, §10 Dokumentations-/Nachweis-Boundary).
- "DSGVO Art. 34" — Information betroffener Personen; in §1/§5/§8 als Informations-Topik referenziert.
- "DSGVO Art. 34 Abs. 3" — Ausnahme-Topik der Betroffenen-Information; Auslegung Non-Scope (§8).
- "DSGVO Art. 35" — DSFA; STOP-Bedingung §20.21 verbietet Aussagen jenseits reinen Negativ-Verweises.
- "DSGVO Art. 36" — Vorab-Konsultation; STOP §20.21; Non-Scope.
- "DSGVO Art. 39" — DSB-Aufgaben-Topos (§1/§5/§9).
- "AO § 147" — referenziert in §10 / §15 als Maßstab des Aufbewahrungs-/Retention-Archivs (Trennung Vorfalls-Dokumentation gemäß DSGVO Art. 33 Abs. 5 vs. Aufbewahrungs-/Retention-Archiv gemäß AO § 147 / HGB § 257 / GoBD).
- "HGB § 257" — siehe oben (§10 / §15).
- "GoBD" — siehe oben (§10 / §15).
- "EStG § 41" — Lohn-Tiefe; verbleibt Lohn-DLS-Folgeartefakt (§15, §17, §21).
- "StGB § 203" — Berufsgeheimnis (§9 als Negativ-Topik referenziert).
- "StBerG § 62a" — Steuerberater-Geheimnis (§9 Negativ-Topik).
- "BDSG § 5" — Beschäftigten-Geheimnis (§9 Negativ-Topik).
- "BDSG § 53" — Beschäftigten-Geheimnis (§9 Negativ-Topik).

(Negativ erwähnt, ausdrücklich KEINE Lock-Quelle gemäß §3 / §16 / §20.14 / §21: ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116, DSK-Kurzpapiere, Aufsichtsbehörden-Leitfäden, EDPB-Leitlinien.)

## 7. Rule-ID-Erwähnungen
Keine Rule-IDs erwähnt.

(STOP-Klauseln 20.1 bis 20.25, Cybersecurity-IR V1.0 §17 STOP 21.15 als Negativ-Anker, Lock-Bezeichner F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing und §28.11-bet — entsprechen nicht dem Rule-ID-Muster `RULE-[A-Z]+-\d+`.)

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "DSGVO Art. 33 (Meldepflicht), Art. 34 (Information betroffener Personen) und Art. 39 (DSB-Aufgaben) werden ausschließlich als Boundary-Topoi referenziert; V1.0 dieses Artefakts trifft keine konkrete Auslegung."
- "V1.0 dieses Artefakts ist negativ formuliert: es legt fest, was der Datenschutz-Vorfallsprozess nicht ist und welche Inhalte explizit Non-Scope sind."
- "Die operative Workflow-Boundary (Detection, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review, Ransomware-/Forensik-Schnittstelle, Sperrgrund-Steuerung) verbleibt strikt dem Cybersecurity-IR-Folgeartefakt V1.0 — trotz geteilter Marker C."
- "Rechtsbezogene Topoi gemäß DSGVO Art. 33/34/39 verbleiben strikt in V1.0 dieses Artefakts."
- "Boundary-Inhalt der Sperrgrund-Klasse „Sicherheits-/Forensik-Halt" verbleibt strikt Lösch-/Sperrkonzept V1.0 §7; deren operative Steuerung verbleibt strikt Cybersecurity-IR V1.0; V1.0 dieses Artefakts ändert weder noch."
- "F0-D6 Mandantentrennung bleibt autoritativ; kein Cross-Mandanten-Datenfluss im Datenschutz-Vorfallsprozess."
- "F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; Plattform-Admin erlangt durch Datenpannen-Behandlung keine Schlüssel-/Plaintext-/Mandantendaten-Einsicht."
- "Vorfalls-Dokumentation gemäß DSGVO Art. 33 Abs. 5 ist nicht das Aufbewahrungs-/Retention-Archiv gemäß AO § 147 / HGB § 257 / GoBD; die Trennung folgt F3-Closing."
- "DSGVO-/Datenpannen ≠ Cybersecurity-IR ≠ DR-/HA-/BCM ≠ Lösch-/Sperrkonzept ≠ Custody-Modell ≠ Security ≠ ASVS ≠ TR-02102-Detail ≠ Retention-Archiv ≠ Regelmatrix ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lohn-DLS ≠ Crypto-Shredding-Rechtswürdigung ≠ KMS-/HSM-/Implementations-Folgeartefakt."
- "V1.0 dieses Artefakts nimmt keine rechtliche Würdigung von Crypto-Shredding vor und trifft keine Aussage zur Frage, ob Crypto-Shredding eine Löschung im Sinne von DSGVO Art. 17 darstellt."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- §1 / §19 / §20.16: „§28.11-bet bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht."
- §18: Open-Question „Crypto-Shredding rechtliche Einordnung" — `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status offen; Release-Blocker für produktive Anwendung).
- §22 Downstream — als offen markiert: Datenschutz-Vorfallsprozess-Detail-Folgeartefakt, DSB-Funktions-Folgeartefakt, KMS-/HSM-/Implementations-Folgeartefakt, Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt, Migrations-Folgeartefakt, Lohn-DLS-Folgeartefakt.
- §22 / §23: „Externe rechtliche Validierung" und „DSB-Validierung" — erforderlich; Non-Scope dieser V1.0.
- §22: „Verfahrensdokumentation Kap. 5 / Kap. 6" Endfassung — im Rahmen der jeweils nächsten Pflege; Non-Scope.

## 10. Verweise auf andere Specs
- Cybersecurity-Incident-Response-Folgeartefakt V1.0 (Sortierungsmarker C; geteilter Marker; §13, §17 STOP 21.15, §23)
- Lösch-/Sperrkonzept-Artefakt V1.0 (Sperrgrund „Sicherheits-/Forensik-Halt"; §7, §11, §14)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (§3, §6, §17)
- Custody-Modell-Boundary-Artefakt V1.0 (§3, §10, §15)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (§16)
- ASVS-Control-Referenz-Artefakt V1.0 (§14)
- TR-02102-Detail-Artefakt V1.0 (§18)
- DR-/HA-/BCM-Folgeartefakt V1.0 (§17, §20, §23)
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (§13, §15, §17)
- KMS-/HSM-/Implementations-Folgeartefakt (offen)
- Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt (offen)
- Migrations-Folgeartefakt (offen)
- Lohn-DLS-Folgeartefakt (offen)
- Verfahrensdokumentation Kap. 5 / Kap. 6 (nächste Pflege)
- Open-Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`
- Harouda Locked Decisions Register V1.0 §3 Z. 349 / §6 Sortierungsmarker C

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§20.11 verbietet „Datenbank-/Dateisystem-Schemata, Programmcode, Pseudocode, SQL, UI/UX, APIs, automatische Jobs, Test-Cases oder CI/CD-Konfiguration"; §20.13 verbietet die Wahl von „Werkzeugen, Anbietern, Cloud-Providern, SIEM-/SOC-Lösungen, Forensik-Tools, Plattformen, Bibliotheken oder Hardware". PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
