# KMS-/HSM-/Implementations-Folgeartefakt V1.0

**Lock-Aussage:** KMS-/HSM-/Implementations-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im Custody-Modell-Boundary-Artefakt V1.0 §15 wörtlich verankerte Implementations-Boundary-Definition: „**KMS-/HSM-/Implementations-Folgeartefakt** — konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik. Setzt Lock dieses Custody-Modell-Boundary-Artefakts und externe sicherheitsfachliche Prüfung voraus." V1.0 ist die paraphrasierte Boundary-Layer-Vorgängerstufe dieser Implementations-Domäne; V1.0 ist **nicht** die Implementations-Endfassung, **nicht** die operative Schlüsselverwaltungs-Mechanik und **nicht** die produktive Schlüssel-Custody-Operation. V1.0 modifiziert Custody V1.0 §15 **nicht**. V1.0 autorisiert **keine** Implementierung. V1.0 wählt **keinen** KMS-/HSM-Anbieter, **keinen** Cloud-Provider, **keine** Hardware-/Modell-/Region-/Vendor-/Bibliotheks-/Werkzeug-/Tool-Wahl. V1.0 legt **keine** konkrete Schlüsselhierarchie (DEK/KEK, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK), **keine** konkrete Schlüsselrotations-/Vernichtungs-/Wiederherstellungs-Mechanik, **keine** Grace-Periods, **keine** Backup-Mechanik fest. V1.0 trifft **keine** Aussage zu konkreten Algorithmen, Modi, Cipher Suites, TLS-Parametern oder Schlüssellängen (verbleiben TR-02102-Detail V1.0). V1.0 enthält **kein** Audit-Log-Schema, **kein** Datenbank-/Dateisystem-Schema, **keinen** Programmcode, **keinen** Pseudocode, **kein** Algorithmus-Design, **kein** SQL, **keine** API-/UI-/Job-/Test-/CI-/CD-Konfiguration. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz- oder Auditor-Akzeptanz-Aussage gegenüber externen Normen oder Prüfungs-Standards (insbesondere FIPS 140-2/3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz, ISO 27001, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen). V1.0 nimmt **keine** rechtliche Würdigung von Crypto-Shredding und **keine** rechtliche/technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor; beide bleiben offen. §28.11-bet bleibt unverändert/offen. Eine externe sicherheitsfachliche Prüfung (gemäß ausdrücklicher Voraussetzung in Custody V1.0 §15) sowie ggf. eine externe Krypto-/Hardware-Validierung, eine DSB-Validierung und eine Sicherheits-/Produktivfreigabe bleibt vor produktiver bzw. produktiver Schlüsselverwaltungs-Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Implementations-Endfassung; **keine** operative Schlüsselverwaltungs-Mechanik; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz- oder Auditor-Akzeptanz-Behauptung gegenüber externen Normen, Prüfungs-Standards, Hardware-Sicherheitsstandards oder Vendor-Zertifizierungs-Pfaden; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Hardware-/HSM-Lieferanten oder Cloud-/KMS-Anbietern |
| Scope | Boundary-Aussagen zu: Implementations-Boundary-Operationalisierung der in Custody V1.0 §15 angelegten Detail-Boundary auf Boundary-Lock-Layer-Ebene; Boundary-Topoi zu Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Schlüssel-Wiederherstellungs-Mechanik (jeweils auf reiner Topos-Verweis-Ebene; **keine** konkrete Wahl); Plattform-Admin-/Plaintext-Boundary-Spiegelung gegenüber F0-D7 und Custody V1.0 §13; Trennlinien gegenüber Security V1.0, Custody V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, Z3 V1.0, Migration V1.0, Verfahrensdokumentations-Pflege-Pass V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Retention V1.0; Cross-Boundary-Konsistenz mit allen 13 gesperrten Vorgänger-V1.0-Specs und gesperrten Harouda-Locks |
| Non-Scope | Konkrete KMS-/HSM-Modell-Wahl; konkrete Anbieter-/Vendor-/Hersteller-/Cloud-/Region-/Hardware-/Bibliotheks-/Werkzeug-/Tool-Wahl; konkrete Schlüsselhierarchie (DEK/KEK, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey-Schemata); konkrete Schlüsselrotations-Mechanik (Rotations-Trigger-Werte, Rotations-Intervalle, Rotations-Verfahren); konkrete Schlüsselvernichtungs-Mechanik (Vernichtungs-Verfahren, Bestätigungs-Mechanik, Vernichtungs-Audit); konkrete Schlüssel-Wiederherstellungs-Mechanik (Recovery-Verfahren, Backup-Mechanik, Grace-Periods, Wiederherstellungs-Trigger); konkrete Schutzdomänen-Architektur jenseits Topos-Verweis; konkrete Trennungsmechanismen (Hardware-Trennung, Software-Trennung, Logical-Boundary-Implementation); konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, TLS-Parameter, Schlüssellängen, kryptographische Parameter (verbleiben TR-02102-Detail V1.0); Audit-Log-Schema oder konkrete Audit-Felder für die Schlüsselverwaltung; Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration; Speichertechnologie; konkrete Cluster-/Replikations-/Snapshot-/Backup-/Restore-Mechanik (verbleiben DR-/HA-/BCM V1.0 + nachgelagerte Detail-Artefakte); ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0); IR-Workflow / Forensik-Werkzeug-Wahl (verbleibt IR V1.0); Datenschutz-Vorfallsprozess / Breach-Notification-Inhalte (verbleibt DSGVO-/Datenpannen V1.0); Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0); Klassifikation (verbleibt Regelmatrix V1.0); Z3-Format / Behörden-Auslieferungs-Mechanik (verbleibt Z3 V1.0); Migrations-Mechanik (verbleibt Migration V1.0); Endfassung Verfahrensdokumentation Kap. 1–8; rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question); rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt Open-Question); externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere FIPS 140-2 / FIPS 140-3, Common Criteria, BSI TR-02102 jenseits TR-02102-Detail-V1.0-Verweis, BSI TR-03116, BSI IT-Grundschutz, ISO 27001, ISO 27018, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen, Vendor-Schutzprofile); Garantie-Aussagen jeglicher Art; Productive-Readiness-Behauptungen jeglicher Art; Rechtsgutachten; Steuerauskunft; rechtliche/sicherheitsfachliche Einzelfall-Entscheidung; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register V1.0 §6 Sortierungsmarker A („Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze"; indirekter Anker — Marker-A-Voraussetzungs-Kette ist Grundlage der Detail-Implementations-Boundary); Custody-Modell-Boundary-Artefakt V1.0 §15 (kanonische Scope-Definition: „**KMS-/HSM-/Implementations-Folgeartefakt** — konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik. Setzt Lock dieses Custody-Modell-Boundary-Artefakts und externe sicherheitsfachliche Prüfung voraus."); Custody-Modell V1.0 §16 Lock-Profil („Maßgeblich als Eingangsgröße für KMS-/HSM-/Implementations-Folgeartefakt"); Security-/Krypto-/Key-Custody-Artefakt V1.0 §17 (Custody-Modell-Folgeartefakt als Vorgänger-Anker); TR-02102-Detail-Artefakt V1.0 §1 / §15 / §17 / §18 (Krypto-Trennlinien); ASVS-Control-Referenz-Artefakt V1.0 §1 / §3 / §17 / §18 (Verifikations-Profil-Trennung; wiederholte kanonische Scope-Definition); DR-/HA-/BCM-Folgeartefakt V1.0 §1 / §17 / §20 / §21 STOP 21.9 / 21.11 / §23 (DR-Trennlinien; Schlüssel-Wiederherstellungs-Topos); Cybersecurity-Incident-Response-Folgeartefakt V1.0 §1 / §4 / §10 / §17 STOP 21.1 / §22 / §23 (IR-Trennlinien; Plaintext-Boundary-Bezug); DSGVO-/Datenpannen-Folgeartefakt V1.0 §1 / §14 / §20 STOP 20.1 / §22 / §23 / §26 (Datenpannen-Trennlinien); Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §1 / §10 / §22 / §25 (Z3-Trennlinien; Plaintext-über-Z3-Verbot-Bezug); Migrations-Folgeartefakt V1.0 §1 / §8 / §14 / §26 / §28 (Migrations-Trennlinien; Quellpaket-Bezug); Verfahrensdokumentations-Pflege-Pass-Folgeartefakt V1.0 §6 / §14 / §28 (Pflege-Eingang Kap. 5); Lösch-/Sperrkonzept V1.0 / Dokumentenkategorie-/Retention-Regelmatrix V1.0 / Aufbewahrungs-/Retention-Archiv V1.0 (Cross-Boundary-Anker); Open-Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴; nur Verweis); Open-Question `docs/HASH-CHAIN-VS-ERASURE.md` (nur Verweis); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit Custody-Modell V1.0 §15 / §16 gilt Custody V1.0 als autoritative Quelle; V1.0 dieses Folgeartefakts paraphrasiert §15 ausschließlich auf Boundary-Lock-Layer-Ebene und ändert §15 **nicht**. Bei Konflikt mit Security-/Krypto-/Key-Custody V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi (insbesondere Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen). Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Profil-Boundary. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries (insbesondere Restore-Mechanik). Bei Konflikt mit IR V1.0 gilt IR V1.0 für IR-Workflow-Boundaries. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries. Bei Konflikt mit Verfahrensdoku V1.0 bleibt jene als Pflege-Layer-Boundary autoritativ. Bei Konflikt mit Crypto-Shredding-Open-Question oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |

**Wichtiger Hinweis zur Verankerung:** Das KMS-/HSM-/Implementations-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* nicht durch eine eigene §6-Marker-Eintragung, sondern indirekt über Sortierungsmarker A („Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze") sowie direkt über Custody-Modell V1.0 §15 als Detail-Implementations-Boundary verankert. Custody V1.0 §15 etabliert die kanonische Scope-Definition wörtlich; ASVS V1.0 §18 und DR-/HA-/BCM V1.0 §23 wiederholen sie identisch; insgesamt **11 von 13** V1.0-Vorgänger-Specs nennen das Folgeartefakt namens-identisch. V1.0 dieses Artefakts paraphrasiert die kanonische Scope-Definition ausschließlich auf Boundary-Lock-Layer-Ebene, modifiziert weder den Locked Decisions Register noch Custody V1.0 §15.

## 2. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §6 Sortierungsmarker A | „Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze" | Indirekter Anker (Marker-A-Voraussetzungs-Kette) |
| Custody-Modell-Boundary-Artefakt V1.0 §15 | Kanonische Scope-Definition: „KMS-/HSM-/Implementations-Folgeartefakt — konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik. Setzt Lock dieses Custody-Modell-Boundary-Artefakts und externe sicherheitsfachliche Prüfung voraus." | **Direkte autoritative Lock-Basis** — kanonische Scope-Definition |
| Custody-Modell V1.0 §16 Lock-Profil | „Maßgeblich als Eingangsgröße für KMS-/HSM-/Implementations-Folgeartefakt" | Eingangsgrößen-Anker |
| Security-/Krypto-/Key-Custody V1.0 §17 Downstream | Vorgänger-Formulierung „Custody-Modell-Folgeartefakt — Festlegung des konkreten Schlüsselverwaltungs- und Custody-Modells (Topologie, Trennungsmechanismen, Schutzdomänen-Architektur)" | Vorgänger-Anker; bestätigt Trennung von Boundary (Security/Custody) und Implementation (KMS-/HSM-Folgeartefakt) |
| TR-02102-Detail-Artefakt V1.0 §1 Non-Scope; §15 / §17; §18 Downstream | „KMS-/HSM-Modellwahl, Schutzdomänen-Architektur, Schlüsselrotations-/Vernichtungs-/Wiederherstellungs-Mechanik (verbleiben KMS-/HSM-/Implementations-Folgeartefakt)" | **Krypto-Trennlinien-Anker** |
| ASVS-Control-Referenz-Artefakt V1.0 §1 / §3 (line 52) / §17 (line 250) / §18 Downstream (line 269) | Wiederholte kanonische Scope-Definition (identisch zu Custody V1.0 §15) | **Wiederholungs-Anker** |
| DR-/HA-/BCM-Folgeartefakt V1.0 §1 / §17 / §20 / §21 STOP 21.9 / 21.11 / §23 Downstream | „Schlüssel-Wiederherstellungs-Mechanik … verbleibt downstream"; STOP 21.9 verbietet KMS-/HSM-Modellwahl in DR; STOP 21.11 verbietet Verschmelzung mit KMS-/HSM-Folgeartefakt; §23 wiederholt kanonische Scope-Definition | DR-Trennlinien-Anker |
| Cybersecurity-Incident-Response V1.0 §1 / §4 (line 46) / §10 (line 172) / §17 STOP 21.1 / §22 (line 381) / §23 (line 395) | „IR ≠ KMS-/HSM-/Implementations-Folgeartefakt. Schlüssel-Wiederherstellungs-Mechanik verbleibt downstream"; STOP 21.1 verbietet IR-Verschmelzung | IR-Trennlinien-Anker |
| DSGVO-/Datenpannen V1.0 §1 / §14 (line 196) / §20 STOP 20.1 / §22 / §23 / §26 | „DSGVO-/Datenpannen ≠ KMS-/HSM-/Implementations-Folgeartefakt"; Custody-Mechanik unverändert | Datenpannen-Trennlinien-Anker |
| Z3-/Datenüberlassung V1.0 §1 / §10 / §22 / §25 | Plaintext-über-Z3-Verbot delegiert KMS-/HSM-Mechanik downstream | Z3-Trennlinien-Anker |
| Migrations-Folgeartefakt V1.0 §1 / §8 (line 127) / §14 (line 179) / §26 (line 302) / §28 (line 344) | Quellpaket-Integritäts-Verifikations-Mechanik verbleibt KMS-/HSM-Folgeartefakt; eigene §14-Section zu Custody + KMS-/HSM | Migrations-Trennlinien-Anker |
| Verfahrensdokumentations-Pflege-Pass V1.0 §6 Kap. 5 Pflege-Boundary; §14 Verhältnis; §28 Downstream | KMS-/HSM-Folgeartefakt liefert Pflege-Eingang Kap. 5 | Verfahrensdoku-Pflege-Anker |
| Lösch-/Sperrkonzept-Artefakt V1.0 / Dokumentenkategorie-/Retention-Regelmatrix V1.0 / Aufbewahrungs-/Retention-Archiv V1.0 | Custody-/Krypto-/Schlüssel-Topiken als Cross-Boundary-Trennlinien | Cross-Boundary-Anker |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung) | Nur Verweis; **keine** Würdigung |
| Open-Question „Hash-Chain-vs.-Erasure-Entscheidung" | `docs/HASH-CHAIN-VS-ERASURE.md` (Schnittpunkt zur Schlüssel-Wiederherstellungs-Topik) | Nur Verweis; **keine** Würdigung |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks; insbesondere **F0-D7 Plattform-Admin-Plaintext-Disziplin** |

Ausdrücklich **keine** externen Lock-Quellen: FIPS 140-2 / FIPS 140-3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz, BSI TR-02102 (jenseits TR-02102-Detail-V1.0-Verweis), ISO 27001, ISO 27018, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen, Vendor-Schutzprofile sind **nicht** Lock-Quelle dieses Artefakts. Bezugnahmen erfolgen ausschließlich als Negativ-Hinweis.

## 3. Core Boundaries

Die folgenden Aussagen sind Boundary-Statements; sie sind **keine** Implementations-Aussage, **keine** Modell-/Anbieter-/Hardware-Wahl und **keine** sicherheitsfachliche Auslegung im Einzelfall.

| Boundary | Aussage |
|---|---|
| **Topos-Charakter** | Die kanonische Scope-Definition ist in Custody V1.0 §15 wörtlich verankert. V1.0 dieses Folgeartefakts paraphrasiert §15 ausschließlich auf Boundary-Lock-Layer-Ebene und trifft **keine** neue Entscheidung. |
| **Detail-Implementations-Boundary** | Das Folgeartefakt ist Detail-Implementations-**Boundary** unter dem Custody-Modell-Boundary-Lock; V1.0 ist **nicht** die Implementation selbst. |
| **Voraussetzungs-Disziplin** | Custody V1.0 §15 verlangt Custody-Modell-Boundary-Lock (✓ LIVE seit `0f95248`) und externe sicherheitsfachliche Prüfung als Voraussetzungen. V1.0 dieses Folgeartefakts respektiert beide; die externe sicherheitsfachliche Prüfung ist **Non-Scope** und vor produktiver Anwendung erforderlich. |
| **Plaintext-Boundary** | Plattform-Administration erlangt durch KMS-/HSM-Mechanik **keine** einseitige Schlüssel-/Plaintext-/Mandantendaten-Einsicht — weder über Restore- noch über Migrations- noch über Z3-Pfade (Spiegelung F0-D7 + Custody V1.0 §13 + Security V1.0 §10). |
| **F0-D7-Wahrung** | Plattform-Admin-Grenze bleibt rein technische Rolle ohne fachlichen Superuser; KMS-/HSM-Mechanik darf F0-D7 **nicht** schwächen. |
| **F0-D6-Wahrung** | Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Schlüssel-/Plaintext-Zugriff durch KMS-/HSM-Mechanik. |
| **F0-D4-Wahrung** | Festschreibung bleibt unberührt; KMS-/HSM-Mechanik hebt Festschreibung **nicht** auf. |
| **F1-D1 / F1-D2-Wahrung** | USt-Wahrheit bleibt unberührt; KMS-/HSM-Mechanik erzeugt **keine** USt-Werte. |
| **F3-D1 / F3-D2 / F3-D3 / F3-Closing** | Bleiben autoritativ; V1.0 dieses Folgeartefakts schwächt **keinen** F3-Lock. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Externe Norm-Disziplin** | Externe Normen / Zertifizierungs-Pfade (FIPS 140-2/3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz, ISO 27001/27018, Cloud-KMS-/HSM-Vendor-Zertifizierungen) sind ausdrücklich **nicht** Lock-Quelle. |

## 4. KMS-/HSM-/Implementations-Scope

Auf Boundary-Topos-Ebene; ausschließlich aus Custody V1.0 §15 paraphrasiert. **Keine** Implementations-Mechanik, **keine** Modell-Wahl.

| Topos | Aussage |
|---|---|
| **Schlüsselverwaltungs-Topologie** | Boundary-Topos für die organisatorische und technische Anordnung von Schlüssel-Verwaltungs-Komponenten. Konkrete Topologie-Wahl (z. B. zentralisiert/dezentralisiert/hybrid; On-Prem/Cloud/Hybrid) ist **Non-Scope**. |
| **Schutzdomänen-Architektur** | Boundary-Topos für die Aufteilung in Schutzdomänen mit verschiedenen Vertrauensgraden. Konkrete Domänen-Implementierung (Hardware-Trennung, Software-Trennung, Network-Segmentation) ist **Non-Scope**. |
| **Trennungsmechanismen** | Boundary-Topos für die Mechanismen, die Schutzdomänen voneinander trennen. Konkrete Mechanismen-Implementierung (Hardware-/Software-/Network-Trennung) ist **Non-Scope**. |
| **Rotations-Mechanik** | Boundary-Topos für die periodische Erneuerung kryptographischen Schlüsselmaterials. Konkrete Rotations-Trigger-Werte, Rotations-Verfahren, Grace-Periods sind **Non-Scope**. |
| **Vernichtungs-Mechanik** | Boundary-Topos für die kontrollierte Vernichtung kryptographischen Schlüsselmaterials. Konkrete Vernichtungs-Verfahren, Bestätigungs-Mechanik, Vernichtungs-Audit-Schemata sind **Non-Scope**. |
| **Schlüssel-Wiederherstellungs-Mechanik** | Boundary-Topos für die Wiederherstellung kryptographischen Schlüsselmaterials nach Verlust oder Schaden. Konkrete Recovery-Verfahren, Backup-Mechanik, Wiederherstellungs-Trigger-Werte sind **Non-Scope**. |

V1.0 dieses Folgeartefakts trifft **keine** Aussage zur Reihenfolge, Priorisierung, Eskalation, technischen Implementierung oder Vendor-/Hardware-Wahl dieser Topoi.

## 5. Schlüsselverwaltungs-Topologie-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus Custody V1.0 §15 paraphrasiert.

- **Topologie-Topos:** Schlüsselverwaltungs-Topologie wird als Topos referenziert. V1.0 trifft **keine** Aussage zur konkreten Anordnung der Schlüssel-Verwaltungs-Komponenten.
- **Keine Topologie-Wahl:** zentralisiert vs. dezentralisiert; On-Prem vs. Cloud-KMS vs. hybrid; Single-Tenant vs. Multi-Tenant-KMS; Region-Wahl; Hochverfügbarkeits-Topologie sind **Non-Scope**.
- **Keine Provider-/Vendor-Wahl:** konkrete KMS-Anbieter, HSM-Hersteller, Cloud-KMS-Provider, On-Prem-HSM-Modell sind **Non-Scope**.
- **Mandantentrennungs-Topos** (Spiegelung F0-D6): die Topologie muss Mandantentrennung wahren; **kein** Cross-Mandanten-Schlüssel-Zugriff. Konkrete Mandantentrennungs-Implementierung ist **Non-Scope**.
- **Plattform-Admin-Topos** (Spiegelung F0-D7): die Topologie darf Plattform-Administration **keinen** einseitigen Schlüssel-/Plaintext-Zugriff ermöglichen. Konkrete Trennungs-Implementierung ist **Non-Scope**.

## 6. Schutzdomänen-Architektur-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus Custody V1.0 §15 paraphrasiert.

- **Schutzdomänen-Topos:** die Aufteilung in Schutzdomänen wird als Topos referenziert. V1.0 trifft **keine** Aussage zur konkreten Domänen-Architektur.
- **Keine Implementierungs-Wahl:** Hardware-Schutzdomäne (HSM-Boundary, FIPS-Boundary, Common-Criteria-Schutzprofil-Wahl), Software-Schutzdomäne (Process-Boundary, Container-Boundary, VM-Boundary), Netzwerk-Schutzdomäne (Network-Segmentation, VPC-Boundary, Air-Gap) sind **Non-Scope**.
- **Keine externe-Norm-Erhebung:** FIPS 140-2/3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz und vergleichbare Schutzprofil-/Zertifizierungs-Pfade sind **nicht** Lock-Quelle und werden ausschließlich als Negativ-Hinweis referenziert.
- **Plaintext-Schutz-Topos:** Schutzdomänen müssen die Plaintext-Boundary gemäß Custody V1.0 §13 + Security V1.0 §10 + F0-D7 wahren. Konkrete Trennungs-Implementierung ist **Non-Scope**.

## 7. Trennungsmechanismen-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus Custody V1.0 §15 paraphrasiert.

- **Trennungs-Topos:** Trennungsmechanismen zwischen Schutzdomänen werden als Topos referenziert. V1.0 trifft **keine** Aussage zur konkreten Mechanik.
- **Keine Mechanismen-Wahl:** Hardware-Trennung (HSM, dedizierte Hardware, Air-Gap), Software-Trennung (Process-Isolation, Container-Isolation, Sandbox), Logical-Trennung (RBAC, ABAC, Capability-Based Access), Crypto-Trennung (Schlüssel-Hierarchie-Trennung, Per-Tenant-Key-Material) sind **Non-Scope**.
- **Verbot einseitiger Plaintext-Macht** (Spiegelung Custody V1.0 §13): die Trennungsmechanismen müssen verhindern, dass eine einzelne administrative Rolle einseitig auf Mandanten-Klartext zugreifen kann. Konkrete Vier-/Mehr-Augen-Mechanik, Split-Key-Implementierung, Threshold-Cryptography sind **Non-Scope**.
- **F0-D6 / F0-D7 Disziplin** bleibt autoritativ.

## 8. Rotations-/Vernichtungs-Mechanik-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus Custody V1.0 §15 paraphrasiert.

- **Rotations-Topos:** periodische Schlüssel-Erneuerung wird als Topos referenziert. Konkrete Rotations-Trigger-Werte, Rotations-Intervalle, Rotations-Verfahren, Grace-Periods, Übergangs-Mechaniken sind **Non-Scope**.
- **Vernichtungs-Topos:** kontrollierte Schlüssel-Vernichtung wird als Topos referenziert. Konkrete Vernichtungs-Verfahren, Bestätigungs-Mechaniken, Vernichtungs-Audit-Schemata sind **Non-Scope**.
- **Crypto-Shredding-Trennung:** V1.0 dieses Folgeartefakts trifft **keine** Aussage zur rechtlichen Wirkung der Schlüssel-Vernichtung als Löschung im Sinne von DSGVO Art. 17. Diese Frage verbleibt der Open-Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen) und externer rechtlicher Validierung.
- **Keine Vendor-Mechanik-Aussage:** konkrete KMS-/HSM-Vendor-Rotations-/Vernichtungs-Mechaniken (z. B. Cloud-KMS-Schedule-Deletion, HSM-Zeroization, Hardware-Destruction) sind **Non-Scope**.

## 9. Schlüssel-Wiederherstellungs-Mechanik-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus Custody V1.0 §15 paraphrasiert; Cross-Boundary-Wahrung mit DR-/HA-/BCM V1.0 + Cybersecurity-IR V1.0.

- **Wiederherstellungs-Topos:** Wiederherstellung kryptographischen Schlüsselmaterials wird als Topos referenziert. Konkrete Recovery-Verfahren, Backup-Mechanik, Wiederherstellungs-Trigger-Werte, Recovery-Time-Objectives für Schlüsselmaterial sind **Non-Scope**.
- **Trennung gegenüber DR-/HA-/BCM-Restore:** Schlüssel-Wiederherstellungs-Mechanik ≠ DR-Restore-Mechanik. DR-Restore-Mechanik verbleibt strikt DR-/HA-/BCM V1.0; Schlüssel-Wiederherstellungs-Mechanik verbleibt diesem KMS-/HSM-Folgeartefakt (DR V1.0 §17 und §23 wörtlich verankert).
- **Trennung gegenüber IR-Workflow:** Schlüssel-Wiederherstellung im IR-Kontext ist Non-Scope; konkrete Wiederherstellungs-Mechanik kryptographischen Schlüsselmaterials verbleibt diesem Folgeartefakt (IR V1.0 §10 wörtlich verankert).
- **Hash-Chain-vs.-Erasure-Open-Question-Verweis:** die in `docs/HASH-CHAIN-VS-ERASURE.md` benannte Open-Question berührt sinngemäß die Schlüssel-Wiederherstellungs-Topik; V1.0 dieses Folgeartefakts trifft **keine** Endfassungs-Würdigung dieser Open-Question.
- **Keine Vendor-Wiederherstellungs-Mechanik-Aussage:** konkrete KMS-/HSM-Vendor-Recovery-Mechaniken sind **Non-Scope**.

## 10. Plattform-Admin-/Plaintext-Boundary

Auf Boundary-Topos-Ebene; Spiegelung von F0-D7 + Custody V1.0 §13 + Security V1.0 §10.

- **F0-D7 unverändert:** Plattform-Admin-Grenze bleibt rein technische Rolle ohne fachlichen Superuser. KMS-/HSM-Mechanik darf F0-D7 **nicht** schwächen.
- **Verbot einseitiger Plaintext-Macht:** kein einzelnes administratives Subjekt — auch nicht innerhalb der KMS-/HSM-Mechanik — darf einseitig auf Mandanten-Klartext zugreifen können.
- **Restore-/Migrations-/Z3-Schutz:** diese Disziplin gilt sinngemäß auch für Restore-Pfade (F3-D2 / DR V1.0), Migrations-Pfade (F3-D3 / Migration V1.0) und Behörden-Auslieferungs-Pfade (F3-D1 / Z3 V1.0). KMS-/HSM-Mechanik darf **keinen** Plaintext-Beschaffungs-Umweg über diese Pfade öffnen.
- **F0-D6 unverändert:** Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Schlüssel-/Plaintext-Zugriff durch KMS-/HSM-Mechanik.
- **Konkrete Anti-Bypass-Mechanik Non-Scope:** Multi-Party-Computation, Threshold-Cryptography, Split-Key, Vier-/Mehr-Augen-Mechaniken sind als Boundary-Topoi referenzierbar; ihre konkrete Wahl und Implementation ist **Non-Scope**.

## 11. Verhältnis zu Security-/Krypto-/Key-Custody V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Security-/Krypto-/Key-Custody V1.0. Sicherheits-/Plaintext-Boundary verbleibt strikt Security V1.0. |
| **Boundary-Sammelboundary unverändert** | Security V1.0 ist die Sicherheits-Sammelboundary; KMS-/HSM-Folgeartefakt ist Detail-Implementations-Boundary downstream. |
| **F0-D7 Bezug** | F0-D7-Plaintext-Disziplin bleibt durch Security V1.0 verankert; KMS-/HSM-Mechanik wahrt sie. |
| **Vorrang-Regel** | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. |

## 12. Verhältnis zu Custody-Modell V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Custody-Modell V1.0. Custody-Boundary-Topiken verbleiben strikt Custody V1.0. |
| **Kanonische Scope-Definition** | Custody V1.0 §15 enthält die wörtliche kanonische Scope-Definition dieses Folgeartefakts. V1.0 paraphrasiert ausschließlich auf Boundary-Lock-Layer-Ebene und ändert §15 **nicht**. |
| **Voraussetzungs-Disziplin** | Custody-Modell-Boundary-Lock (Custody V1.0, LIVE) ist Voraussetzung; externe sicherheitsfachliche Prüfung ist Voraussetzung vor produktiver Anwendung. |
| **Plaintext-Boundary** | Custody V1.0 §13 „Verbot einseitiger Plaintext-Macht" wird durch KMS-/HSM-Mechanik gewahrt. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 13. Verhältnis zu TR-02102-Detail V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ TR-02102-Detail V1.0. Konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen verbleiben strikt TR-02102-Detail V1.0. |
| **Krypto-Parameter unverändert** | V1.0 dieses Folgeartefakts trifft **keine** Aussage zu konkreten kryptographischen Parametern; alle Parameter-Topoi werden auf TR-02102-Detail V1.0 verwiesen. |
| **Versionierungs-Pflege** | TR-02102-Detail-Versions-Pflege (BSI TR-02102-1/-2-Folge-Versionen) verbleibt TR-02102-Detail V1.0 + nachgelagerter Versionierungs-Pflege. |
| **Negativ-Erklärung** | V1.0 dieses Folgeartefakts erhebt BSI TR-02102 (jenseits TR-02102-Detail-V1.0-Verweis), BSI TR-03116 oder BSI IT-Grundschutz **nicht** zur Lock-Quelle. |
| **Vorrang-Regel** | Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. |

## 14. Verhältnis zu ASVS-Control-Referenz V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ ASVS-Control-Referenz V1.0. ASVS-Profil-Boundary verbleibt strikt ASVS V1.0. |
| **Wiederholte kanonische Scope-Definition** | ASVS V1.0 §18 enthält die kanonische Scope-Definition wörtlich identisch zu Custody V1.0 §15; V1.0 dieses Folgeartefakts paraphrasiert sie konsistent. |
| **Verifikations-/Konformitäts-Verbot** | V1.0 dieses Folgeartefakts trifft **keine** ASVS-Verifikations-, ASVS-Mapping- oder ASVS-Konformitäts-Aussage. |
| **Vorrang-Regel** | Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Profil-Boundary. |

## 15. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ DR-/HA-/BCM V1.0. Restore-Mechanik verbleibt strikt DR V1.0. |
| **Schlüssel-Wiederherstellung ≠ DR-Restore** | Schlüssel-Wiederherstellungs-Mechanik (KMS-/HSM-Folgeartefakt) ist nicht identisch mit DR-Restore-Mechanik (DR V1.0). DR V1.0 §17/§23 wörtlich verankert. |
| **STOP 21.9 / 21.11 Bezug** | DR V1.0 verbietet KMS-/HSM-Modellwahl in DR; V1.0 dieses Folgeartefakts respektiert diese Trennung in der Gegenrichtung (kein DR-Design im KMS-/HSM-Folgeartefakt). |
| **Plaintext-Boundary** | DR-Restore darf **keinen** Plaintext-Beschaffungs-Umweg über KMS-/HSM-Pfade öffnen; KMS-/HSM-Mechanik wahrt diese Disziplin. |
| **Vorrang-Regel** | Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 16. Verhältnis zu Cybersecurity-Incident-Response V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Cybersecurity-IR V1.0. IR-Workflow-Boundary verbleibt strikt IR V1.0. |
| **Schlüssel-Wiederherstellung im IR-Kontext** | Konkrete Wiederherstellungs-Mechanik kryptographischen Schlüsselmaterials verbleibt diesem KMS-/HSM-Folgeartefakt (IR V1.0 §10 wörtlich); IR-Workflow trifft hierzu **keine** operative Aussage. |
| **Forensik-Werkzeug-Wahl** | Forensik-Werkzeug-Wahl, SIEM-/SOC-/Tool-Wahl verbleiben IR V1.0 + Cybersecurity-IR-Operational-Detail-Folgeartefakt; **keine** im KMS-/HSM-Folgeartefakt. |
| **Plaintext-Boundary im IR-Kontext** | IR-Pfade dürfen **nicht** als Plaintext-Beschaffungs-Umweg über KMS-/HSM-Pfade genutzt werden. |
| **Vorrang-Regel** | Bei Konflikt mit IR V1.0 gelten dessen Boundary-Inhalte für IR-Workflow-Boundaries. |

## 17. Verhältnis zu DSGVO-/Datenpannen V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ DSGVO-/Datenpannen V1.0. Datenpannen-Boundary verbleibt strikt DSGVO V1.0. |
| **Custody-Mechanik unverändert** | DSGVO V1.0 §14 verankert wörtlich, dass „konkrete Custody-Topologie, Schlüsselhierarchie, Schlüsselrotation, Schlüsselzerstörung und Schlüssel-Wiederherstellungs-Mechanik" im KMS-/HSM-Folgeartefakt verbleiben. |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts trifft **keine** rechtliche Würdigung über die Datenschutz-Wirkung der Schlüsselverwaltungs-Mechanik im Einzelfall. Diese Würdigung verbleibt DSGVO V1.0 + externer rechtlicher / DSB-Validierung. |
| **Vorrang-Regel** | Bei Konflikt mit DSGVO V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

## 18. Verhältnis zu Z3-/Datenüberlassung V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Z3-/Datenüberlassung V1.0. Behörden-Auslieferungs-Boundary verbleibt strikt Z3 V1.0. |
| **Plaintext-Verbot über Z3-Pfade** | Z3 V1.0 §10 verankert Plaintext-Verbot über Z3-Pfade; KMS-/HSM-Mechanik darf diese Disziplin **nicht** schwächen. |
| **Keine Z3-Format-Aussage** | V1.0 dieses Folgeartefakts trifft **keine** Aussage zum Z3-Format oder zum Behörden-Auslieferungs-Workflow. |
| **Vorrang-Regel** | Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. |

## 19. Verhältnis zu Migrations-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Migrations-Folgeartefakt V1.0. Migrations-Boundary verbleibt strikt Migration V1.0. |
| **Plaintext-Verbot über Migrations-Pfade** | Migration V1.0 §14 / §26 verankert Plaintext-Verbot über Migrations-Pfade; KMS-/HSM-Mechanik darf diese Disziplin **nicht** schwächen. |
| **Quellpaket-Integritäts-Verifikation** | Migration V1.0 §8 verweist Hash-Verfahren / Signatur-Verfahren / Manifest-Felder als Topos auf TR-02102-Detail V1.0 + Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. V1.0 dieses Folgeartefakts trifft **keine** konkrete Hash-/Signatur-Mechanik-Wahl. |
| **Vorrang-Regel** | Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries. |

## 20. Verhältnis zu Verfahrensdokumentations-Pflege-Pass V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | KMS-/HSM-/Implementations-Folgeartefakt liefert (sobald gesperrt) einen Pflege-Eingang Kap. 5 für die existierende Verfahrensdokumentations-STUB-Schicht — auf reiner Verweis-Ebene; **kein** Endfassungs-Text. |
| **Verfahrensdoku-Pflege-Layer unverändert** | Verfahrensdoku V1.0 §6 / §14 / §28 nennt das KMS-/HSM-Folgeartefakt als Pflege-Eingang; V1.0 dieses Folgeartefakts erkennt diese Verweis-Beziehung an, ohne Verfahrensdoku-Inhalte zu finalisieren. |
| **Existierende STUB-Dateien unverändert** | V1.0 dieses Folgeartefakts editiert keine der zehn existierenden Verfahrensdokumentations-Dateien. |
| **Vorrang-Regel** | Bei Konflikt mit Verfahrensdoku V1.0 bleibt jene als Pflege-Layer-Boundary autoritativ. |

## 21. Verhältnis zu Lösch-/Sperrkonzept / Regelmatrix / Retention

| Aspekt | Aussage |
|---|---|
| **Trennlinie zu Lösch-/Sperrkonzept V1.0** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Lösch-/Sperrkonzept V1.0. Lösch-/Sperr-Boundary-Inhalt verbleibt strikt Lösch-/Sperrkonzept V1.0; KMS-/HSM-Mechanik berührt nicht die Sperrgrund-Klassen. |
| **Trennlinie zu Regelmatrix V1.0** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Regelmatrix V1.0. Klassifikations-Boundary verbleibt strikt Regelmatrix V1.0. |
| **Trennlinie zu Retention V1.0** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Aufbewahrungs-/Retention-Archiv V1.0. Aufbewahrungs-Boundary verbleibt strikt Retention V1.0. |
| **Crypto-Shredding-Bezug** | Lösch-/Sperrprozess Operational-Detail-Folgeartefakt (offen) ist potenzielle Konsumstelle der Schlüsselvernichtungs-Mechanik gemäß Custody V1.0 §15; V1.0 dieses Folgeartefakts trifft **keine** rechtliche Würdigung der Crypto-Shredding-Operationalisierung. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 / Regelmatrix V1.0 / Retention V1.0 gelten jene jeweiligen Quellen für ihre Boundary-Domäne. |

## 22. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Frage, ob die Schlüsselvernichtungs-Mechanik eine Löschung im Sinne von DSGVO Art. 17 darstellt. |
| **Open-Question-Datei unverändert** | V1.0 dieses Folgeartefakts ändert die Open-Question-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage (Fachanwalt + DSB) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 23. Verhältnis zu Hash-Chain-vs.-Erasure

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/HASH-CHAIN-VS-ERASURE.md` (Schnittpunkt zur Schlüssel-Wiederherstellungs-/Schlüsselvernichtungs-Topik; in Verfahrensdoku V1.0 §23 als Open-Question verankert). |
| **Keine Endfassungs-Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor und wählt **keine** Option. |
| **Open-Question-Datei unverändert** | V1.0 dieses Folgeartefakts ändert die Hash-Chain-vs.-Erasure-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung (Fachanwalt + DSB) bleibt vor Endfassung der betroffenen Verfahrensdoku-Abschnitte und vor produktiver Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 24. Verhältnis zu §28.11-bet

| Aspekt | Aussage |
|---|---|
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Keine Wechselwirkungs-Aussage** | V1.0 trifft **keine** Aussage zur Wechselwirkung zwischen §28.11-bet und der KMS-/HSM-/Implementations-Boundary. |
| **Externe Klärung** | Eine etwaige Klärung des §28.11-bet-Status bleibt außerhalb dieses Folgeartefakts. |

## 25. Wahrung gesperrter Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; KMS-/HSM-Mechanik hebt Festschreibung **nicht** auf. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Schlüssel-/Plaintext-Zugriff durch KMS-/HSM-Mechanik. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; KMS-/HSM-Mechanik darf F0-D7 **nicht** schwächen; **kein** einseitiger Plaintext-Zugriff durch Plattform-Administration. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; KMS-/HSM-Mechanik erzeugt **keine** USt-Werte. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ; KMS-/HSM-Mechanik darf Plaintext-über-Z3-Verbot **nicht** schwächen. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ; Schlüssel-Wiederherstellungs-Mechanik ≠ DR-Restore. |
| **F3-D3 Migrations-Spezifikation** | Bleibt autoritativ; KMS-/HSM-Mechanik darf Plaintext-über-Migrations-Verbot **nicht** schwächen. |
| **F3-Closing** | Bleibt autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt. |
| **§28.11-bet** | Bleibt unverändert/offen. |

## 26. Explicit Non-Scope

- Konkrete KMS-/HSM-Modellwahl; Anbieter-/Vendor-/Hersteller-/Cloud-/Region-/Hardware-/Bibliotheks-/Werkzeug-/Tool-Wahl.
- Konkrete Schlüsselhierarchie (DEK/KEK, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey-Schemata).
- Konkrete Schlüsselrotations-Mechanik; Rotations-Trigger-Werte; Rotations-Intervalle; Rotations-Verfahren; Grace-Periods; Übergangs-Mechaniken.
- Konkrete Schlüsselvernichtungs-Mechanik; Vernichtungs-Verfahren; Bestätigungs-Mechanik; Vernichtungs-Audit-Schemata.
- Konkrete Schlüssel-Wiederherstellungs-Mechanik; Recovery-Verfahren; Backup-Mechanik; Wiederherstellungs-Trigger-Werte; Recovery-Time-Objectives für Schlüsselmaterial.
- Konkrete Schutzdomänen-Architektur jenseits Topos-Verweis; Hardware-/Software-/Network-Trennungs-Implementierung.
- Konkrete Trennungsmechanismen jenseits Topos-Verweis; Logical-Boundary-Implementation; RBAC-/ABAC-/Capability-Based-Access-Implementation; Multi-Party-Computation-Konfiguration; Threshold-Cryptography-Konfiguration.
- Konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, TLS-Parameter, Schlüssellängen, kryptographische Parameter (verbleiben TR-02102-Detail V1.0).
- Audit-Log-Schema oder konkrete Audit-Felder für die Schlüsselverwaltung.
- Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration.
- Konkrete Cluster-/Replikations-/Snapshot-/Backup-/Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0).
- ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0).
- IR-Workflow / Forensik-Werkzeug-Wahl / SIEM-/SOC-/Tool-Wahl (verbleibt IR V1.0).
- Datenschutz-Vorfallsprozess / Breach-Notification-Workflow (verbleibt DSGVO V1.0).
- Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0).
- Klassifikation (verbleibt Regelmatrix V1.0).
- Aufbewahrungs-/Retention-Archiv-Boundary (verbleibt Retention V1.0).
- Z3-Format / Behörden-Auslieferungs-Mechanik (verbleibt Z3 V1.0).
- Migrations-Mechanik (verbleibt Migration V1.0).
- Endfassung Verfahrensdokumentation Kap. 1–8.
- Edits an existierenden Verfahrensdokumentations-Dateien.
- Edits an App-Code-Layer (`src/pages/...`, `src/utils/...`).
- Edits an Demo-Paketen.
- Rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question; Status 🔴).
- Rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt Open-Question).
- Externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere FIPS 140-2 / FIPS 140-3, Common Criteria, BSI TR-02102 jenseits TR-02102-Detail-V1.0-Verweis, BSI TR-03116, BSI IT-Grundschutz, ISO 27001, ISO 27018, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen, Vendor-Schutzprofile).
- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Hardware-Vendor-Akzeptanz-, Cloud-Vendor-Akzeptanz-Behauptungen jeglicher Art.
- Productive-Readiness-Behauptungen jeglicher Art.
- Garantie-Aussagen gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Hardware-/HSM-Lieferanten, Cloud-/KMS-Anbietern oder externen Sicherheits-Validierungs-Stellen.
- Rechtsgutachten; Steuerauskunft; rechtliche/sicherheitsfachliche Einzelfall-Entscheidung.
- DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Marketing-Aussagen.
- Änderung oder Reinterpretation von §28.11-bet.
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 27. Wortwahl-Disziplin

V1.0 dieses Folgeartefakts hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Hardware-Vendor-Akzeptanz-, Cloud-Vendor-Akzeptanz-, Garantie- oder Freigabe-Behauptungen sind ausgeschlossen — auch nicht in Beispielform innerhalb dieser V1.0.
- Aussagen über externe Norm-Konformität (insbesondere gegenüber FIPS-, Common-Criteria-, BSI-, ISO-, NIST-, ENISA-, Cloud-KMS-Anbieter-, HSM-Hersteller-Quellen) sind ausgeschlossen; externe Normen erscheinen ausschließlich als Negativ-Hinweis und nicht als Lock-Quelle.
- Productive-Readiness-Sprache („HSM-ready", „KMS-ready", „enterprise-grade", „production-grade", „validated", „certified", „compliant", „audit-proof", „prüfungsfest") ist ausgeschlossen.
- Marketing-/Reife-/Vendor-/Cloud-Marketing-Sprache ist ausgeschlossen.
- Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen, die wie eine Vendor-/Hardware-/Cloud-Empfehlung wirken könnten, sind ausgeschlossen.
- Schlüssel-Sicherheits-Garantie-Sprache („lückenloser Schlüsselschutz", „unverlierbares Schlüsselmaterial", „Plaintext-frei garantiert") ist ausgeschlossen.
- Aussagen, die Crypto-Shredding rechtlich werten oder die Hash-Chain-vs.-Erasure-Option vorwegnehmen, sind ausgeschlossen.
- Inhalte in arabischer Schrift sind ausgeschlossen; UTF-8-BOM ist ausgeschlossen.
- STOP-Klauseln formulieren generisch und wiederholen sensible Beispiele **nicht** wörtlich.

## 28. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **KMS-/HSM-Detail-Implementations-Folgeartefakt** | Detail-Implementations jenseits Boundary-Lock-Layer (konkrete Modell-Wahl, Hardware-/Cloud-Wahl, Schlüsselhierarchie-Wahl, Rotations-/Vernichtungs-/Wiederherstellungs-Verfahren) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Schlüsselverwaltungs-Topologie-Detail** | konkrete Topologie-Wahl jenseits Boundary | offen; nicht Bestandteil von V1.0 |
| **Schutzdomänen-Architektur-Detail** | konkrete Domänen-Implementierung jenseits Boundary | offen; nicht Bestandteil von V1.0 |
| **Trennungsmechanismen-Detail** | konkrete Mechanik-Wahl jenseits Boundary | offen; nicht Bestandteil von V1.0 |
| **Schlüsselrotations-Detail-Folgeartefakt** | konkrete Rotations-Trigger-Werte und -Verfahren | offen; nicht Bestandteil von V1.0 |
| **Schlüsselvernichtungs-Detail-Folgeartefakt** | konkrete Vernichtungs-Verfahren | offen; nicht Bestandteil von V1.0 |
| **Schlüssel-Wiederherstellungs-Detail-Folgeartefakt** | konkrete Recovery-Mechanik | offen; nicht Bestandteil von V1.0 |
| **Externe sicherheitsfachliche Prüfung** | Externer Validierungs-Schritt (Hardware-/HSM-/KMS-Sicherheits-Expertise) — wörtlich in Custody V1.0 §15 als Voraussetzung benannt | erforderlich vor produktiver Anwendung; **Non-Scope** dieser V1.0 |
| **Externe Krypto-Validierung** | Externer Validierungs-Schritt für Algorithmen-/Parameter-Wahl analog TR-02102-Detail-Versions-Pflege | erforderlich vor produktiver Anwendung; **Non-Scope** dieser V1.0 |
| **Externe DSB-Validierung** | Externer DSB-Validierungs-Schritt für die Datenschutz-Wirkung der Schlüsselverwaltungs-Mechanik | erforderlich vor produktiver bzw. rechtsverbindlicher Anwendung; **Non-Scope** dieser V1.0 |
| **Sicherheits-/Produktivfreigabe** | Externer Freigabe-Schritt vor produktiver Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Hash-Chain-vs.-Erasure-Open-Question** | Open-Question; Schnittpunkt zur Schlüssel-Wiederherstellungs-/Schlüsselvernichtungs-Topik | offen; **keine** Würdigung in V1.0 |
| **Verfahrensdokumentation Kap. 5 Pflege** | Pflege-Eingang (Sicherheits-Topiken) | offen; **Non-Scope** dieser V1.0 |
| **TR-02102-Detail-Versions-Pflege** | Versionierungs-Pflege für Krypto-Parameter | offen; **Non-Scope** dieser V1.0 |
| **Lösch-/Sperrprozess Operational-Detail-Folgeartefakt** | mögliche Konsumstelle der Schlüsselvernichtungs-Mechanik (Crypto-Shredding-Operationalisierung sofern downstream rechtlich freigegeben) | offen; **Non-Scope** dieser V1.0 |

V1.0 dieses Folgeartefakts erzeugt **keine** Implementierung, **keine** Konfiguration, **keinen** Mechanismus, **keine** Modell-Wahl und **keine** Vendor-/Cloud-/Hardware-Wahl.

## 29. STOP-Bedingungen

V1.0 dieses Folgeartefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 29.1 | V1.0 dieses Folgeartefakts importiert externen Norm-/Zertifizierungs-Pfad-Volltext oder erhebt eine externe Quelle (insbesondere FIPS 140-2/3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz, BSI TR-02102 jenseits TR-02102-Detail-V1.0-Verweis, ISO 27001, ISO 27018, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen, Vendor-Schutzprofile) zur Lock-Quelle. |
| 29.2 | V1.0 dieses Folgeartefakts wählt einen konkreten KMS-Anbieter, HSM-Hersteller, Cloud-Provider, Region, Hardware-Modell, Vendor, Bibliothek, Werkzeug oder Tool. |
| 29.3 | V1.0 dieses Folgeartefakts legt eine konkrete Schlüsselhierarchie fest (DEK/KEK, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey-Schemata). |
| 29.4 | V1.0 dieses Folgeartefakts legt konkrete Schlüsselrotations-Mechanik (Trigger-Werte, Intervalle, Verfahren, Grace-Periods), Schlüsselvernichtungs-Mechanik (Verfahren, Bestätigungs-Mechanik, Audit-Schema) oder Schlüssel-Wiederherstellungs-Mechanik (Recovery-Verfahren, Backup-Mechanik, Wiederherstellungs-Trigger) fest. |
| 29.5 | V1.0 dieses Folgeartefakts legt konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, TLS-Parameter oder Schlüssellängen fest (verbleiben TR-02102-Detail V1.0). |
| 29.6 | V1.0 dieses Folgeartefakts legt eine konkrete Schutzdomänen-Architektur, konkrete Trennungsmechanismen oder konkrete Mandantentrennungs-Implementierung jenseits Topos-Verweis fest. |
| 29.7 | V1.0 dieses Folgeartefakts legt ein Audit-Log-Schema oder konkrete Audit-Felder für die Schlüsselverwaltung fest. |
| 29.8 | V1.0 dieses Folgeartefakts enthält Datenbank-/Dateisystem-Schema, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definitionen, UI/UX, automatische Jobs, Test-Cases oder CI/CD-Konfiguration. |
| 29.9 | V1.0 dieses Folgeartefakts erstellt eine Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Hardware-Vendor-Akzeptanz-, Cloud-Vendor-Akzeptanz-, Sicherheits- oder Produktivfreigabe-Behauptung. |
| 29.10 | V1.0 dieses Folgeartefakts erstellt eine Productive-Readiness-Behauptung oder eine Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Hardware-/HSM-Lieferanten, Cloud-/KMS-Anbietern oder externen Sicherheits-Validierungs-Stellen. |
| 29.11 | V1.0 dieses Folgeartefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 29.12 | V1.0 dieses Folgeartefakts nimmt eine rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor oder wählt eine Option. |
| 29.13 | V1.0 dieses Folgeartefakts öffnet einen Plaintext-Beschaffungs-Pfad über KMS-/HSM-Mechanik oder schwächt das in F0-D7 + Custody V1.0 §13 + Security V1.0 §10 verankerte Verbot einseitiger Plaintext-Macht. |
| 29.14 | V1.0 dieses Folgeartefakts ermöglicht Cross-Mandanten-Schlüssel-/Plaintext-Zugriff durch KMS-/HSM-Mechanik (verletzt F0-D6). |
| 29.15 | V1.0 dieses Folgeartefakts schwächt F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 29.16 | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei (insbesondere `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`, `docs/HASH-CHAIN-VS-ERASURE.md`). |
| 29.17 | V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet. |
| 29.18 | V1.0 dieses Folgeartefakts erstellt oder finalisiert Inhalte für Verfahrensdokumentation Kap. 1, Kap. 2, Kap. 3, Kap. 4, Kap. 5, Kap. 6, Kap. 7 oder Kap. 8. |
| 29.19 | V1.0 dieses Folgeartefakts editiert existierende V1.0-Specs, Verfahrensdokumentations-STUB-Dateien, App-Code-Layer (`src/pages/...`, `src/utils/...`) oder Demo-Pakete. |
| 29.20 | V1.0 dieses Folgeartefakts verschmilzt die KMS-/HSM-Boundary mit Security V1.0, Custody V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, Z3 V1.0, Migration V1.0, Verfahrensdokumentations-Pflege-Pass V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0 oder Retention V1.0, statt diese Specs ausschließlich als Verhältnis-/Trennlinien-Anker zu referenzieren. |
| 29.21 | V1.0 dieses Folgeartefakts reinterpretiert die kanonische Scope-Definition aus Custody V1.0 §15 oder erzeugt eine neue Implementations-Boundary jenseits jener Definition. |
| 29.22 | V1.0 dieses Folgeartefakts behauptet, die externe sicherheitsfachliche Prüfung gemäß Custody V1.0 §15 oder die externe Krypto-/DSB-/Sicherheits-/Produktivfreigabe vor produktiver Anwendung erübrigen zu können. |
| 29.23 | V1.0 dieses Folgeartefakts erteilt Rechtsauskunft, Steuerauskunft, sicherheitsfachliche Einzelfall-Entscheidung, DSB-Freigabe, Sicherheitsfreigabe oder Produktivfreigabe. |
| 29.24 | V1.0 dieses Folgeartefakts modifiziert package-/config-/script-/test-/baseline-Dateien oder führt SQL/Migrationen aus. |
| 29.25 | V1.0 dieses Folgeartefakts vermischt Krypto-Algorithmen/-Parameter (verbleiben TR-02102-Detail V1.0) mit KMS-/HSM-Mechanik in dieser V1.0 oder umgekehrt. |
| 29.26 | V1.0 dieses Folgeartefakts vermischt DR-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0) mit Schlüssel-Wiederherstellungs-Mechanik in dieser V1.0 oder umgekehrt. |
| 29.27 | Die Forbidden-Reference-Gate-Baseline (BLOCKED, BASELINE_ALLOWED, ALLOW_MARKED) ändert sich durch Aufnahme dieser V1.0 in den Repository-Stand. |
| 29.28 | V1.0 dieses Folgeartefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 29.29 | V1.0 dieses Folgeartefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Vendor-Akzeptanz- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |

## 30. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene; intern accepted; **keine** Implementations-Endfassung; **keine** Modell-/Anbieter-/Hardware-Wahl; **keine** produktive Freigabe |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Hardware-Vendor-/Cloud-Vendor-Akzeptanz-Behauptung; **keine** externe Konformitäts-/Zertifizierungs-/Audit-/Behörden-Akzeptanz-/Auditor-Akzeptanz-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Hardware-/HSM-Lieferanten, Cloud-/KMS-Anbietern oder externen Sicherheits-Validierungs-Stellen |
| **STOP-Bedingungen** | 29 Klauseln (§29.1 — §29.29) |
| **Bindend für** | Alle in Abschnitt 28 genannten Detail-Implementations-Folgeartefakte; Verfahrensdokumentation Kap. 5 (im Rahmen ihrer jeweils nächsten Pflege außerhalb dieser V1.0) hinsichtlich der Trennlinien dieses Artefakts; alle nachgelagerten Detail-Artefakte zu Schlüsselverwaltungs-, Krypto- und Custody-Implementations-Themen. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen Security V1.0, Custody V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, Z3 V1.0, Migration V1.0, Verfahrensdokumentations-Pflege-Pass V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0 und Retention V1.0. |
| **Nicht bindend für** | Konkretes KMS-/HSM-Modell. Konkrete Anbieter-/Vendor-/Hersteller-/Cloud-/Region-/Hardware-/Bibliotheks-/Werkzeug-/Tool-Wahl. Konkrete Schlüsselhierarchie. Konkrete Schlüsselrotations-/Vernichtungs-/Wiederherstellungs-Mechanik. Konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen. Konkrete Schutzdomänen-Architektur. Konkrete Trennungsmechanismen jenseits Topos-Verweis. Audit-Log-Schema. Datenmodell/Schema. UI/UX. Programmcode. Pseudocode. Algorithmus-Design. SQL. APIs. Automatische Jobs. Test-Cases. CI/CD-Konfiguration. Konkrete Cluster-/Replikations-/Restore-Mechanik. ASVS-Verifikation/-Mapping. IR-Workflow. Datenschutz-Vorfallsprozess. Lösch-/Sperr-Boundary-Inhalt. Klassifikation. Aufbewahrungs-/Retention-Archiv-Boundary. Z3-Format. Migrations-Mechanik. Endfassung Verfahrensdokumentation Kap. 1–8. Rechtliche Würdigung von Crypto-Shredding. Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | KMS-/HSM-/Implementations-Folgeartefakt ≠ Security-/Krypto-/Key-Custody V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Custody-Modell V1.0 (V1.0 paraphrasiert §15 ohne Reinterpretation). KMS-/HSM-/Implementations-Folgeartefakt ≠ TR-02102-Detail V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ ASVS-Control-Referenz V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ DR-/HA-/BCM V1.0 (Schlüssel-Wiederherstellung ≠ DR-Restore). KMS-/HSM-/Implementations-Folgeartefakt ≠ Cybersecurity-IR V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ DSGVO-/Datenpannen V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Z3-/Datenüberlassung V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Migrations-Folgeartefakt V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Verfahrensdokumentations-Pflege-Pass V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Lösch-/Sperrkonzept V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Regelmatrix V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Aufbewahrungs-/Retention-Archiv V1.0. KMS-/HSM-/Implementations-Folgeartefakt ≠ Crypto-Shredding-Rechtswürdigung. KMS-/HSM-/Implementations-Folgeartefakt ≠ Hash-Chain-vs.-Erasure-Endfassungs-Würdigung. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Schlüssel-/Plaintext-Zugriff. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; **kein** einseitiger Plaintext-Zugriff. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit Custody V1.0 §15 / §16 gilt Custody V1.0. Bei Konflikt mit Security V1.0 oder TR-02102-Detail V1.0 oder ASVS V1.0 oder DR-/HA-/BCM V1.0 oder IR V1.0 oder DSGVO V1.0 oder Z3 V1.0 oder Migration V1.0 oder Verfahrensdoku V1.0 oder Lösch-/Sperrkonzept V1.0 oder Regelmatrix V1.0 oder Retention V1.0 gilt jeweils diese Quelle für ihre Boundary-Domäne. Bei Konflikt mit Crypto-Shredding-Open-Question oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |
| **Verankerungs-Hinweis** | Das KMS-/HSM-/Implementations-Folgeartefakt ist im Locked Decisions Register V1.0 nicht durch eine eigene §6-Marker-Eintragung, sondern indirekt über Sortierungsmarker A („Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze") sowie direkt über Custody-Modell V1.0 §15 als Detail-Implementations-Boundary verankert. V1.0 paraphrasiert die kanonische Scope-Definition ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert weder Custody V1.0 §15 noch den Locked Decisions Register. |
| **Externe Validierung** | Vor produktiver bzw. produktiver Schlüsselverwaltungs-Anwendung sind eine externe sicherheitsfachliche Prüfung (Custody V1.0 §15 wörtliche Voraussetzung), eine externe Krypto-Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe erforderlich. Alle diese Validierungen sind **Non-Scope** von V1.0. |

## 31. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **nicht** Implementations-Endfassung; **nicht** Bestandteil eines externen Audit-, Zertifizierungs-, Hardware-Vendor-Akzeptanz-, Cloud-Vendor-Akzeptanz- oder Sicherheitsstandards-Konformitäts-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Schärfung der Anti-Implementations-/Anti-Modell-/Anti-Vendor-/Anti-Cloud-/Anti-Hardware-/Anti-Konformitäts-/Anti-Zertifizierungs-/Anti-Audit-/Anti-Garantie-/Anti-Productive-Readiness-Wortwahl; ausdrückliche Aufnahme von FIPS 140-2 / FIPS 140-3, Common Criteria, BSI TR-03116, BSI IT-Grundschutz, BSI TR-02102 (jenseits TR-02102-Detail-V1.0-Verweis), ISO 27001, ISO 27018, Cloud-KMS-Anbieter-Zertifizierungen, HSM-Hersteller-Zertifizierungen, Vendor-Schutzprofile in die Negativ-Quellgrundlage; klare Trennung von Boundary-Lock-Layer (V1.0) und Implementations-Endfassung (außerhalb V1.0); ausdrücklicher Schutz der existierenden 13 V1.0-Vorgänger-Specs vor Reinterpretation; Plaintext-Boundary-Spiegelung gegenüber F0-D7 + Custody V1.0 §13 + Security V1.0 §10 verankert; F0-D6-Mandantentrennungs-Spiegelung verankert; kanonische Scope-Definition aus Custody V1.0 §15 wörtlich paraphrasiert (Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik); Voraussetzungs-Disziplin (Custody-Modell-Boundary-Lock + externe sicherheitsfachliche Prüfung) gemäß Custody V1.0 §15 verankert; Crypto-Shredding-Rechtsfrage und Hash-Chain-vs.-Erasure-Open-Question als ausdrückliche Open-Question-Verweise ohne Würdigung verankert; in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; Detail-Implementations-Folgeartefakte (KMS-/HSM-Detail-Implementations, Schlüsselverwaltungs-Topologie-Detail, Schutzdomänen-Architektur-Detail, Trennungsmechanismen-Detail, Schlüsselrotations-/Vernichtungs-/Wiederherstellungs-Detail-Folgeartefakte) werden eigenständig versioniert. Eine externe sicherheitsfachliche Prüfung (Custody V1.0 §15), eine externe Krypto-Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe bleiben vor produktiver Anwendung erforderlich. |
