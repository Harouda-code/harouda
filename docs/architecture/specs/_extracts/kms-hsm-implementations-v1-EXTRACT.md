# Extract: kms-hsm-implementations-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/kms-hsm-implementations-v1.md
- Dateigröße: 60.5 KB
- Zeilenanzahl: 409
- Erstellt am: 2026-05-09T16:38:10+02:00
- Erste H1-Überschrift im Dokument: KMS-/HSM-/Implementations-Folgeartefakt V1.0

## 2. Zweck der Spec (in einem Satz)
Konkretisierung der im Custody-Modell-Boundary-Artefakt V1.0 §15 wörtlich verankerten Implementations-Boundary-Definition (konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik) auf Boundary-Lock-Layer-Ebene — als paraphrasierte Vorgängerstufe der Implementations-Domäne, ohne Implementations-Endfassung, Modell-/Anbieter-/Hardware-Wahl oder produktive Schlüssel-Custody-Operation.

## 3. Hauptthemen (max 5 Bullet Points)
- Paraphrasierte Boundary-Topoi gemäß Custody V1.0 §15: Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Schlüssel-Wiederherstellungs-Mechanik
- Plattform-Admin-/Plaintext-Boundary (F0-D7) und Mandantentrennungs-Boundary (F0-D6) im KMS-/HSM-Kontext, einschließlich Restore-/Migrations-/Z3-Schutz
- Trennlinien gegenüber Security V1.0, Custody V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, IR V1.0, DSGVO V1.0, Z3 V1.0, Migration V1.0, Verfahrensdoku V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Retention V1.0
- Voraussetzungs-Disziplin: Custody-Modell-Boundary-Lock + externe sicherheitsfachliche Prüfung (gemäß Custody V1.0 §15)
- Offene Verweise auf Crypto-Shredding- und Hash-Chain-vs.-Erasure-Open-Questions ohne Würdigung; Negativ-Erklärung externer Normen (FIPS, CC, BSI TR-03116, ISO 27001/27018, etc.)

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(§29.7 verbietet „Audit-Log-Schema oder konkrete Audit-Felder für die Schlüsselverwaltung"; §29.8 verbietet „Datenbank-/Dateisystem-Schema, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definitionen, UI/UX, automatische Jobs, Test-Cases oder CI/CD-Konfiguration"; §26 listet all dies als Non-Scope.)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(§29.4 verbietet konkrete Schlüsselrotations-, Schlüsselvernichtungs- und Schlüssel-Wiederherstellungs-Mechaniken inkl. Trigger-Werten, Intervallen, Verfahren und Recovery-Verfahren. §29.6 verbietet konkrete Schutzdomänen-Architektur und Trennungsmechanismen jenseits Topos-Verweis. Die §4 Tabelle nennt zwar die sechs Topoi Schlüsselverwaltungs-Topologie/Schutzdomänen-Architektur/Trennungsmechanismen/Rotations-Mechanik/Vernichtungs-Mechanik/Wiederherstellungs-Mechanik — alle als reine Boundary-Topoi ohne Mechanik.)

## 6. Rechtsgrundlagen-Erwähnungen
- "DSGVO Art. 17" — in §22 als Maßstab referenziert: V1.0 trifft keine Aussage, ob die Schlüsselvernichtungs-Mechanik eine Löschung im Sinne von Art. 17 darstellt; rechtliche Würdigung verbleibt Open-Question.
- "DSGVO Art. 33/34" — in §17 Verhältnis zu DSGVO-/Datenpannen V1.0 als „rechtliche Meldepflichten gemäß DSGVO Art. 33/34" referenziert; verbleibt DSGVO V1.0.

(Negativ erwähnt, ausdrücklich KEINE Lock-Quelle gemäß §2 / §3 / §6 / §13 / §27 / §29.1: FIPS 140-2, FIPS 140-3, Common Criteria, BSI TR-02102 jenseits TR-02102-Detail-V1.0-Verweis, BSI TR-03116, BSI IT-Grundschutz, ISO 27001, ISO 27018, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen, Vendor-Schutzprofile, NIST, ENISA.)

(Hinweis: Die Spec nennt keine deutschen Paragraphen wie AO § 147, HGB § 257, EStG § 41 oder GoBD direkt; sie verweist auf die anderen V1.0-Specs als Träger dieser Anker, ohne sie wörtlich zu zitieren.)

## 7. Rule-ID-Erwähnungen
Keine Rule-IDs erwähnt.

(STOP-Klauseln 29.1 bis 29.29, IR V1.0 §17 STOP 21.1, DR V1.0 §21 STOP 21.9 / 21.11, DSGVO V1.0 §20 STOP 20.1, Lock-Bezeichner F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing und §28.11-bet — entsprechen nicht dem Rule-ID-Muster `RULE-[A-Z]+-\d+`.)

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Die kanonische Scope-Definition ist in Custody V1.0 §15 wörtlich verankert. V1.0 dieses Folgeartefakts paraphrasiert §15 ausschließlich auf Boundary-Lock-Layer-Ebene und trifft keine neue Entscheidung."
- "Das Folgeartefakt ist Detail-Implementations-Boundary unter dem Custody-Modell-Boundary-Lock; V1.0 ist nicht die Implementation selbst."
- "Custody V1.0 §15 verlangt Custody-Modell-Boundary-Lock (LIVE seit `0f95248`) und externe sicherheitsfachliche Prüfung als Voraussetzungen."
- "Plattform-Administration erlangt durch KMS-/HSM-Mechanik keine einseitige Schlüssel-/Plaintext-/Mandantendaten-Einsicht — weder über Restore- noch über Migrations- noch über Z3-Pfade (Spiegelung F0-D7 + Custody V1.0 §13 + Security V1.0 §10)."
- "Verbot einseitiger Plaintext-Macht: kein einzelnes administratives Subjekt — auch nicht innerhalb der KMS-/HSM-Mechanik — darf einseitig auf Mandanten-Klartext zugreifen können."
- "Schlüssel-Wiederherstellungs-Mechanik (KMS-/HSM-Folgeartefakt) ist nicht identisch mit DR-Restore-Mechanik (DR V1.0). DR V1.0 §17/§23 wörtlich verankert."
- "Externe Normen / Zertifizierungs-Pfade (FIPS 140-2/3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz, ISO 27001/27018, Cloud-KMS-/HSM-Vendor-Zertifizierungen) sind ausdrücklich nicht Lock-Quelle."
- "F0-D6 Mandantentrennung bleibt autoritativ; kein Cross-Mandanten-Schlüssel-/Plaintext-Zugriff durch KMS-/HSM-Mechanik."
- "Productive-Readiness-Sprache („HSM-ready", „KMS-ready", „enterprise-grade", „production-grade", „validated", „certified", „compliant", „audit-proof", „prüfungsfest") ist ausgeschlossen."
- "Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt (Konsistenz mit F3-Closing)."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- §24 / §25 / §29.17: „§28.11-bet bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet nicht."
- §22: Open-Question „Crypto-Shredding rechtliche Einordnung" — `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status offen; Release-Blocker für produktive Anwendung); keine Würdigung in V1.0.
- §23: Open-Question „Hash-Chain-vs.-Erasure" — `docs/HASH-CHAIN-VS-ERASURE.md`; keine Endfassungs-Würdigung in V1.0; keine Option gewählt.
- §28 Downstream-Folgeartefakte / offen: KMS-/HSM-Detail-Implementations-Folgeartefakt, Schlüsselverwaltungs-Topologie-Detail, Schutzdomänen-Architektur-Detail, Trennungsmechanismen-Detail, Schlüsselrotations-Detail-Folgeartefakt, Schlüsselvernichtungs-Detail-Folgeartefakt, Schlüssel-Wiederherstellungs-Detail-Folgeartefakt, Externe sicherheitsfachliche Prüfung, Externe Krypto-Validierung, Externe DSB-Validierung, Sicherheits-/Produktivfreigabe, Verfahrensdokumentation Kap. 5 Pflege, TR-02102-Detail-Versions-Pflege, Lösch-/Sperrprozess Operational-Detail-Folgeartefakt.

## 10. Verweise auf andere Specs
- Custody-Modell-Boundary-Artefakt V1.0 (direkte autoritative Lock-Basis; §15 kanonische Scope-Definition, §16 Lock-Profil)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (§17 Downstream-Anker)
- TR-02102-Detail-Artefakt V1.0 (§1 / §15 / §17 / §18; Krypto-Trennlinien)
- ASVS-Control-Referenz-Artefakt V1.0 (§1, §3, §17, §18; wiederholt kanonische Scope-Definition)
- DR-/HA-/BCM-Folgeartefakt V1.0 (§1, §17, §20, §21 STOP 21.9 / 21.11, §23)
- Cybersecurity-Incident-Response-Folgeartefakt V1.0 (§1, §4, §10, §17 STOP 21.1, §22, §23)
- DSGVO-/Datenpannen-Folgeartefakt V1.0 (§1, §14, §20 STOP 20.1, §22, §23, §26)
- Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 (§1, §10, §22, §25)
- Migrations-Folgeartefakt V1.0 (§1, §8, §14, §26, §28)
- Verfahrensdokumentations-Pflege-Pass-Folgeartefakt V1.0 (§6, §14, §28)
- Lösch-/Sperrkonzept-Artefakt V1.0 (Cross-Boundary-Anker)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Cross-Boundary-Anker)
- Aufbewahrungs-/Retention-Archiv V1.0 (Cross-Boundary-Anker)
- Open-Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`
- Open-Question `docs/HASH-CHAIN-VS-ERASURE.md`
- Harouda Locked Decisions Register V1.0 §6 Sortierungsmarker A

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§29.2 verbietet die Wahl eines konkreten KMS-Anbieters, HSM-Herstellers, Cloud-Providers, Region, Hardware-Modells, Vendors, Bibliothek, Werkzeugs oder Tools. §29.8 verbietet „Datenbank-/Dateisystem-Schema, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definitionen, UI/UX, automatische Jobs, Test-Cases oder CI/CD-Konfiguration". §29.19 verbietet Edits am App-Code-Layer (`src/pages/...`, `src/utils/...`) und Demo-Paketen. §29.24 verbietet SQL/Migrationen. PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht als Stack-Wahl erwähnt; sie erscheinen ausschließlich als Negativ-Verweise im Sinne verbotener Festlegungen.)
