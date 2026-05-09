# Lohn-DLS-Folgeartefakt V1.0

**Lock-Aussage:** Lohn-DLS-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im *Harouda Locked Decisions Register V1.0* §6 Sortierungsmarker D wörtlich verankerte Außerhalb-MVP-Boundary für das Lohn-DLS-Folgeartefakt („Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP") sowie die in §3.10 (F3-D1) Kernaussagen verankerte Disziplin „DLS Lohnsteuer-Außenprüfung außerhalb MVP". V1.0 ist **keine** Lohn-DLS-Endfassung; V1.0 antizipiert, autorisiert, finalisiert, validiert oder implementiert **keine** Lohnsteuer-Außenprüfungs-Mechanik; V1.0 hebt den Außerhalb-MVP-Status der Lohnsteuer-Außenprüfungs-Topik **nicht** auf. V1.0 trifft **keine** Aussage über die im Repository bereits angelegten App-Code-/UI-/Test-/Util-Pfade unter `src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`, `src/pages/Payroll*` (oder vergleichbare Pfade) — diese Pfade sind App-Code-Layer und werden durch V1.0 weder autorisiert, noch finalisiert, noch validiert, noch modifiziert. V1.0 modifiziert weder Register §3.10 noch §6 Marker D noch Retention V1.0 §9 noch eine andere V1.0-Spec. V1.0 autorisiert **keine** Implementierung. V1.0 enthält **keine** konkrete Lohnsteuer-Außenprüfungs-Mechanik, **kein** Lohnarten-Schema, **keine** Lohnsteuer-Berechnungs-Mechanik, **keine** Sozialversicherungs-Beitrags-Berechnungs-Mechanik, **keinen** ELStAM-Workflow, **keinen** DEÜV-Workflow, **keinen** SV-Meldungs-Workflow, **keinen** Lohn-Reporting-/Lohn-Buchhaltungs-/Lohn-Export-Workflow, **keine** konkrete Lohn-Z1-/Z2-/Z3-Audit-Format-Wahl, **keine** konkreten Lohnkonten-Frist-Tabellen, **keine** Aufbewahrungs-Stichtag-Logik, **keine** Lohnsteuer-Sonderfristen-Tabellen, **kein** Datenbank-/Dateisystem-Schema, **keinen** Programmcode, **kein** Pseudocode, **kein** Algorithmus-Design, **kein** SQL, **keine** API-/UI-/Job-/Test-/CI-/CD-Konfiguration und **keine** Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-Wahl. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Lohn-/Steuer-/SV-Akzeptanz-Behauptung gegenüber externen Normen oder Prüfungs-Standards. V1.0 nimmt **keine** rechtliche Würdigung von Crypto-Shredding und **keine** rechtliche/technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor; beide bleiben offen. §28.11-bet bleibt unverändert/offen. Eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe bleibt vor produktiver bzw. behördlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted; **außerhalb MVP** gemäß Register §3.10 / §6 Marker D |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Lohn-DLS-Endfassung; **keine** operative Lohnsteuer-Außenprüfungs-Mechanik; **keine** App-Code-Aussage; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Finanzamt-/SV-Träger-Akzeptanz-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Kammern, Finanzämtern oder SV-Trägern |
| Scope | Boundary-Aussagen zu: Marker-D-Operationalisierung auf Boundary-Lock-Layer-Ebene als reine Außerhalb-MVP-Verankerung; Lohn-Tiefe-Topos auf reiner Verweis-Ebene (EStG § 41 / Lohnkonten / lohnsteuerliche Sonderfristen / sozialversicherungsrechtliche Aufbewahrungsbezüge); Außerhalb-MVP-Disziplin als zentrale Boundary-Aussage; App-Code-Layer-Disziplin (existierender App-Code unverändert; V1.0 trifft keine App-Code-Aussage); Trennlinien gegenüber Z3 V1.0 (Anlass-Trennung), Migration V1.0, Z1-/Z2-Datenzugriffe V1.0 (Marker-D-Geschwister), Retention V1.0 (§9 Lohn-Grenze), Regelmatrix V1.0, DSGVO V1.0, Verfahrensdoku V1.0, Custody V1.0, Security V1.0, KMS-/HSM V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, IR V1.0, Lösch-/Sperrkonzept V1.0; Spiegelung der F0-D4-/F0-D6-/F0-D7-/F1-D1/F1-D2-Disziplinen über Lohn-DLS-Pfade; Plaintext-Boundary-Spiegelung gegenüber Custody V1.0 §13 + Security V1.0 §10; Cross-Boundary-Konsistenz mit allen 15 gesperrten V1.0-Specs und gesperrten Harouda-Locks |
| Non-Scope | Konkrete Lohnsteuer-Außenprüfungs-Mechanik (außerhalb MVP gemäß Register §3.10 / §6 Marker D); Lohnarten-Schema; Lohnsteuer-Berechnungs-Mechanik; Sozialversicherungs-Beitrags-Berechnungs-Mechanik; ELStAM-Workflow; DEÜV-Workflow; SV-Meldungs-Workflow; Lohn-Reporting-Workflow; Lohn-Buchhaltungs-Workflow; Lohn-Export-Workflow; konkrete Lohn-Z1-/Z2-/Z3-Audit-Format-Wahl (verbleibt jeweiligen Z1-/Z2 V1.0 + Z3 V1.0 als Anlass-Trennung); konkrete Lohnkonten-Frist-Tabellen; Aufbewahrungs-Stichtag-Logik; Lohnsteuer-Sonderfristen-Tabellen; Datenbank-/Dateisystem-Schema; Daten-Wörterbücher; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration; Speichertechnologie; Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-Wahl; konkrete Berechtigungs-/Rollen-Tabellen; konkrete Audit-Schema-Felder; Edits an existierenden App-Code-Pfaden (`src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`, `src/pages/Payroll*`, oder vergleichbaren Pfaden) sowie deren Validierung, Finalisierung oder Autorisierung; Edits an existierenden V1.0-Specs, Verfahrensdoku-STUB-Dateien, Demo-Paketen; externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere EStG § 41-Volltext, Lohnsteuer-Richtlinien-Volltext, Sozialgesetzbuch-Volltext, ELStAM-Spezifikation, DEÜV-Spezifikation, SV-Meldeverfahren-Spezifikation, GoBD-/AO-/IDW-/AWV-/Kammer-/BSI-/ISO-Volltext); externe-Norm-Volltext-Aufnahme; Garantie-Aussagen jeglicher Art; Productive-Readiness-Behauptungen jeglicher Art; Endfassung Verfahrensdokumentation Kap. 1–8; Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Behörden-Akzeptanz-/Auditor-Akzeptanz-/Finanzamt-/SV-Träger-Akzeptanz-Behauptung; Marketing-Aussagen; rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question); rechtliche/technische Endfassungs-Würdigung der Hash-Chain-vs-Erasure-Open-Question (verbleibt Open-Question); Änderung oder Reinterpretation von §28.11-bet; Änderung des Locked Decisions Register oder einer Open-Question-Datei; Aufhebung des Außerhalb-MVP-Status |
| Lock-Basis | Locked Decisions Register V1.0 §3.10 (F3-D1) Kernaussagen wörtlich: „DLS Lohnsteuer-Außenprüfung außerhalb MVP"; Locked Decisions Register V1.0 §6 Sortierungsmarker D („Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP"; geteilt mit Z1-/Z2-Datenzugriffe-Folgeartefakt LIVE); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §1 Non-Scope („Lohn-Tiefe"), §4 Recht-Tabelle (EStG § 41), §6 Lohnkonten-Tabelle, **§9 „Lohn — Grenze"** (kanonische Trennungs-Vorlage), §15 Lock-Profil; Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §1 / §17 „Verhältnis zu Z3 / Migration / Lohn-DLS" (Anlass-Trennung; Lohn-DLS-Tiefe einschließlich Lohnsteuer-Außenprüfung verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP); Migrations-Folgeartefakt V1.0 §1 / §22 „Verhältnis zu Lohn-DLS-Folgeartefakt" + §29 STOP 29.24; Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0 §13 „Verhältnis zu Lohn-DLS-Folgeartefakt" (Marker-D-Geschwister); Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Lohn-DLS als Non-Scope verankert); DSGVO-/Datenpannen-Folgeartefakt V1.0 §17 (Verhältnis zu Z3 / Migration / Lohn-DLS); Verfahrensdokumentations-Pflege-Pass V1.0 (Pflege-Eingang Kap. 5/6 zukünftig); Security-/Krypto-/Key-Custody V1.0 (Plaintext-Boundary sinngemäß); Custody-Modell V1.0 §13 (Verbot einseitiger Plaintext-Macht; sinngemäß auch über Lohn-DLS-Pfade); KMS-/HSM-/Implementations-Folgeartefakt V1.0 (Schlüssel-Boundary sinngemäß); alle weiteren V1.0-Specs als Trennlinien-/Boundary-Anker; Open-Question-Verweis `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴; nur Verweis); Open-Question-Verweis `docs/HASH-CHAIN-VS-ERASURE.md` (nur Verweis); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §6 Marker D oder §3.10 Boundaries gilt der Register als autoritative Quelle; V1.0 paraphrasiert ausschließlich auf Boundary-Lock-Layer-Ebene und ändert den Register **nicht**. Bei Konflikt mit Retention V1.0 §9 gilt Retention V1.0; V1.0 dieses Folgeartefakts erhebt **keine** Aufbewahrungs-Aussage über die in Retention V1.0 §9 gesetzte Grenze hinaus. Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries (insbesondere F3-D1). Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries (insbesondere F3-D3). Bei Konflikt mit Z1-/Z2-Datenzugriffe V1.0 (Marker-D-Geschwister) gilt jene für Z1-/Z2-Datenzugriffsarten. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. Bei Konflikt mit Security V1.0 / Custody V1.0 / KMS-/HSM V1.0 gilt jeweils diese Quelle für Sicherheits-/Plaintext-/Custody-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt jene für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Cybersecurity-IR V1.0 gilt jene für IR-Workflow-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt jene für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Verfahrensdoku V1.0 bleibt jene als Pflege-Layer-Boundary autoritativ. Bei Konflikt mit Crypto-Shredding-Open-Question oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |

**Wichtiger Hinweis zur Verankerung:** Das Lohn-DLS-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* §6 (Open Folgeartefakte) als **Sortierungsmarker D** verankert (Eintrag: „Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP"). Sortierungsmarker D ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Z1-/Z2-Datenzugriffe-Folgeartefakt geteilt; beide Folgeartefakte sind als getrennte, eigenständige Folgeartefakte enumeriert. V1.0 paraphrasiert Marker D ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert weder Register §6 noch Register §3.10 Boundaries. **Die Außerhalb-MVP-Disziplin gemäß Register §3.10 / §6 Marker D ist die zentrale Lock-Aussage dieses V1.0-Artefakts.**

## 2. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §3.10 (F3-D1) Kernaussagen | „DLS Lohnsteuer-Außenprüfung **außerhalb MVP**" | **Direkter autoritativer Außerhalb-MVP-Anker** |
| Locked Decisions Register V1.0 §6 Sortierungsmarker D | „Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP" | **Direkte Verankerungs-Quelle** im Register (geteilt mit Z1-/Z2-Datenzugriffe-Folgeartefakt LIVE) |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §1 Non-Scope | „Lohn-Tiefe" | Boundary-Anker |
| Retention V1.0 §4 Recht-Tabelle (EStG § 41) | „Sechsjährige Aufbewahrung der Lohnkonten — ausschließlich als Grenzverweis; vertieft im Lohn-DLS-Folgeartefakt" | Grenzverweis-Anker |
| Retention V1.0 §6 Lohnkonten-Tabelle | „6 Jahre · EStG § 41 · Sondernorm; Detail im Lohn-DLS-Folgeartefakt; in diesem Artefakt nur Grenzverweis" | Frist-Topos-Anker |
| **Retention V1.0 §9 „Lohn — Grenze" (eigene Section)** | wörtlich: „Lohnkonten unterliegen einer eigenständigen sechsjährigen Aufbewahrungslogik nach EStG § 41. Lohnspezifische Metadaten, lohnsteuerliche Sonderfristen, sozialversicherungsrechtliche Aufbewahrungsbezüge sowie das Lohn-DLS verbleiben **außerhalb** dieses Artefakts. Das vorliegende Artefakt verzeichnet die Grenze; die fachliche Tiefe wird im Lohn-DLS-Folgeartefakt behandelt." | **Zentrale kanonische Trennungs-Vorlage** |
| Retention V1.0 §15 Lock-Profil „Nicht bindend für" | „Lohn-DLS-Folgeartefakt in seiner fachlichen Tiefe (nur Grenzverweis EStG § 41)" | Lock-Profil-Anker |
| Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §1 / §17 „Verhältnis zu Z3 / Migration / Lohn-DLS" | „Lohn-DLS-Tiefe einschließlich Lohnsteuer-Außenprüfung (verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP gemäß Register §3.10/§6)" | **Trennungs-Pattern-Vorlage** |
| Migrations-Folgeartefakt V1.0 §1 / §22 „Verhältnis zu Lohn-DLS-Folgeartefakt" + §29 STOP 29.24 | „Migration ≠ Lohn-DLS-Tiefe; außerhalb MVP" | **Zweite Trennungs-Pattern-Vorlage** |
| Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0 §13 „Verhältnis zu Lohn-DLS-Folgeartefakt" | „Z1-/Z2-Datenzugriff ≠ Lohn-DLS-Tiefe; geteilter Marker D; außerhalb MVP" | **Dritte Trennungs-Pattern-Vorlage** (Marker-D-Geschwister) |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | Lohn-DLS als ausdrückliche Non-Scope; Klassifikation-Trennung | Negativ-Anker |
| DSGVO-/Datenpannen-Folgeartefakt V1.0 §17 | „Verhältnis zu Z3 / Migration / Lohn-DLS"; Lohn-Tiefe verbleibt Lohn-DLS-Folgeartefakt | Negativ-Anker |
| Verfahrensdokumentations-Pflege-Pass V1.0 §6 / §28 | Pflege-Eingang Kap. 5/6 zukünftig | Pflege-Anker |
| Security V1.0 §10 / §13 / §17 | Plaintext-Boundary; F0-D7-Plattform-Admin-Disziplin (sinngemäß auch über Lohn-DLS-Pfade) | Plaintext-Boundary-Anker (sinngemäß) |
| Custody-Modell V1.0 §13 | „Verbot einseitiger Plaintext-Macht über Restore-, Migrations- oder Z3-Pfade" — sinngemäß auch über Lohn-DLS-Pfade | Plaintext-Boundary-Anker (sinngemäß) |
| KMS-/HSM-/Implementations-Folgeartefakt V1.0 | Schlüssel-Boundary sinngemäß | Schlüssel-Boundary-Anker (sinngemäß) |
| TR-02102-Detail V1.0 / ASVS V1.0 / DR-/HA-/BCM V1.0 / Cybersecurity-IR V1.0 / Lösch-/Sperrkonzept V1.0 | Cross-Boundary-Trennlinien | Cross-Boundary-Anker |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung) | Nur Verweis; **keine** Würdigung |
| Open-Question „Hash-Chain-vs.-Erasure-Entscheidung" | `docs/HASH-CHAIN-VS-ERASURE.md` | Nur Verweis; **keine** Würdigung |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks |

Ausdrücklich **keine** externen Lock-Quellen: EStG § 41-Volltext, Lohnsteuer-Richtlinien-Volltext, Sozialgesetzbuch-Volltext, ELStAM-Spezifikation, DEÜV-Spezifikation, SV-Meldeverfahren-Spezifikation, GoBD-/AO-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001 sind **nicht** Lock-Quelle dieses Artefakts. Bezugnahmen auf EStG § 41 erfolgen ausschließlich über die Paraphrase im Locked Decisions Register §3.10 / §6 Marker D sowie über Retention V1.0 §9.

## 3. Außerhalb-MVP-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus Register §3.10 + §6 Marker D paraphrasiert.

| Aspekt | Aussage |
|---|---|
| **Außerhalb-MVP-Status** | Das Lohn-DLS-Folgeartefakt — insbesondere die Lohnsteuer-Außenprüfungs-Topik — ist gemäß Locked Decisions Register §3.10 (F3-D1 Kernaussagen) und §6 Sortierungsmarker D ausdrücklich **außerhalb MVP** verankert. |
| **Keine Antizipation** | V1.0 dieses Folgeartefakts antizipiert **keine** Lohnsteuer-Außenprüfungs-Mechanik, **keine** ELStAM-/DEÜV-/SV-/Lohn-Reporting-/Lohn-Buchhaltungs-/Lohn-Export-Workflows und **keine** konkrete Lohn-Z1-/Z2-/Z3-Audit-Format-Wahl. |
| **Keine Aufhebung** | V1.0 dieses Folgeartefakts hebt den Außerhalb-MVP-Status **nicht** auf, weder implizit noch explizit. Eine etwaige spätere Verschiebung des Außerhalb-MVP-Status erfolgt außerhalb dieser V1.0 und über eine eigenständige Register-Aktualisierung. |
| **Boundary-Lock-Layer-Charakter trotz Außerhalb-MVP** | V1.0 ist Boundary-Lock-Layer-Artefakt: sie verankert die Trennlinien gegenüber den anderen 15 V1.0-Specs, ohne den Außerhalb-MVP-Inhalt zu antizipieren. |
| **Externe Validierung als Voraussetzung** | Vor produktiver bzw. behördlicher Anwendung sind eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe erforderlich. Alle drei sind **Non-Scope** dieser V1.0. |

## 4. Lohn-Tiefe-Boundary (Topos-Ebene)

Auf Boundary-Topos-Ebene; ausschließlich aus Retention V1.0 §9 paraphrasiert. **Keine** Mechanik, **keine** konkrete Lohn-Tiefe.

| Topos | Aussage |
|---|---|
| **EStG § 41 Topos-Verweis** | Lohnkonten unterliegen einer eigenständigen sechsjährigen Aufbewahrungslogik nach EStG § 41. Konkrete Frist-Tabellen, Stichtag-Logik, Sonderfristen-Tabellen sind **Non-Scope** dieser V1.0 und verbleiben einem späteren Detail-Folgeartefakt vorbehalten. |
| **Lohnspezifische Metadaten** | Lohnspezifische Metadaten (Lohnarten, Lohnsteuer-Klassen, SV-Beiträge, ELStAM-Bezüge, DEÜV-Bezüge) sind als Topos referenziert und außerhalb dieser V1.0. |
| **Lohnsteuerliche Sonderfristen** | Lohnsteuerliche Sonderfristen sind als Topos referenziert und außerhalb dieser V1.0. |
| **Sozialversicherungsrechtliche Aufbewahrungsbezüge** | Sozialversicherungsrechtliche Aufbewahrungsbezüge sind als Topos referenziert und außerhalb dieser V1.0. |
| **Grenzverweis-Disziplin** | Retention V1.0 §9 verzeichnet die Grenze; die fachliche Tiefe wird in einem späteren Lohn-DLS-Detail-Folgeartefakt behandelt. V1.0 dieses Folgeartefakts respektiert diese Grenzverweis-Disziplin und führt sie auf Boundary-Lock-Layer-Ebene weiter. |
| **Keine Frist-Festlegung** | V1.0 trifft **keine** konkreten Frist-Festlegungen jenseits des Topos-Verweises auf die in Retention V1.0 §9 verankerte sechsjährige Topik. |

## 5. App-Code-Layer-Disziplin

Im Repository sind App-Code-/UI-/Test-/Util-Pfade unter den folgenden Bereichen vorhanden (ohne Anspruch auf Vollständigkeit):
- `src/domain/lohn/**`
- `src/utils/payroll*` und `src/utils/lohn*`
- `src/pages/Lohn*` und `src/pages/Payroll*`
- `src/lib/crypto/payrollHash*`
- vergleichbare lohn-/payroll-bezogene App-Code-/Test-Pfade

| Aspekt | Aussage |
|---|---|
| **App-Code-Layer ≠ Boundary-Lock-Layer** | App-Code-/UI-/Test-/Util-Pfade sind App-Code-Layer und damit **außerhalb** des Boundary-Lock-Layer-Scopes dieser V1.0. |
| **Keine Autorisierung** | V1.0 dieses Folgeartefakts autorisiert die Existenz oder Anwendung dieser App-Code-Pfade **nicht**. |
| **Keine Finalisierung** | V1.0 finalisiert die App-Code-Implementation **nicht** und behauptet **keine** Vollständigkeit oder Reife. |
| **Keine Validierung** | V1.0 validiert die App-Code-Implementation **nicht** im Sinne einer fachlichen, rechtlichen, steuerlichen, datenschutzrechtlichen, sicherheitsfachlichen oder produktiven Prüfung. |
| **Keine Modifikation** | V1.0 modifiziert die App-Code-Pfade **nicht**. |
| **Externe Validierungs-Erfordernis** | Eine produktive Verwendung der App-Code-Layer im Lohn-/Payroll-Kontext erfordert eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie eine Sicherheits-/Produktivfreigabe. Diese Validierungen sind **Non-Scope** dieser V1.0 und der V1.0-Boundary-Lock-Layer-Schicht insgesamt. |
| **Trennlinien-Disziplin** | Boundary-Lock-Layer-V1.0 spezifiziert ausschließlich Boundary-Topoi; sie spezifiziert **keine** App-Code-Implementation, **keine** UI-/UX-Interaktion, **keine** Test-Methodik, **keine** API-Definition. Diese verbleiben — soweit anwendbar — späteren Detail-Folgeartefakten oder externen Validierungs-Schritten. |

## 6. Verhältnis zu Aufbewahrungs-/Retention-Archiv V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS-Tiefe ≠ Aufbewahrungs-/Retention-Archiv-Boundary. Aufbewahrungs-/Retention-Archiv-Boundary verbleibt strikt Retention V1.0. |
| **Kanonische Trennungs-Vorlage** | Retention V1.0 §9 „Lohn — Grenze" enthält die wörtliche kanonische Grenzverweis-Disziplin. V1.0 dieses Folgeartefakts paraphrasiert sie ausschließlich auf Boundary-Lock-Layer-Ebene und ändert §9 **nicht**. |
| **EStG § 41 Topos-Verweis** | Sechsjährige Aufbewahrung der Lohnkonten ist Topos-Verweis; konkrete Frist-Tabellen verbleiben einem späteren Lohn-DLS-Detail-Folgeartefakt. |
| **Vorrang-Regel** | Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Retention-Archiv-Boundary. |

## 7. Verhältnis zu Z3-/Datenüberlassung V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Z3-Datenüberlassung. Z3 ist formelle Behörden-Auslieferung gemäß F3-D1; Lohn-DLS ist die Lohnsteuer-Außenprüfungs-spezifische Tiefe und ist außerhalb MVP. |
| **Anlass-Trennung** | Z3 V1.0 §17 etabliert die Anlass-Trennung „Z3-Datenüberlassung ≠ Mandanten-Export ≠ Migrations-Export"; Lohn-DLS-Anlass ist davon getrennt und verbleibt Lohn-DLS-Folgeartefakt. |
| **Lohn-Z3-Format** | Eine konkrete Lohn-Z3-Audit-Format-Wahl ist **Non-Scope** dieser V1.0 und außerhalb MVP. |
| **Vorrang-Regel** | Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. |

## 8. Verhältnis zu Migrations-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Migrations-Mechanik. Migrations-Boundary verbleibt strikt Migration V1.0 (F3-D3). |
| **Pattern-Vorlage** | Migration V1.0 §22 „Verhältnis zu Lohn-DLS-Folgeartefakt" + §29 STOP 29.24 etablieren die zweite kanonische Trennungs-Vorlage. |
| **Lohn-Migrations-Mechanik** | Eine lohnspezifische Migrations-Mechanik ist **Non-Scope** dieser V1.0 und außerhalb MVP. |
| **Vorrang-Regel** | Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries. |

## 9. Verhältnis zu Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Geteilter Marker D, getrennte Folgeartefakte** | Z1-/Z2-Datenzugriffe-Folgeartefakt und Lohn-DLS-Folgeartefakt sind im Register §6 Marker D als getrennte Bullet-Einträge enumeriert. Beide sind eigenständige Folgeartefakte unter demselben Sortierungs-Marker. V1.0 hebt die Trennung **nicht** auf. |
| **Trennlinie** | Lohn-DLS-Tiefe ≠ Z1-/Z2-Datenzugriffsarten. Z1-/Z2 ist die Datenzugriffsart-Boundary für Auditor-Lese-Zugriff; Lohn-DLS ist die Lohnsteuer-Außenprüfungs-spezifische Tiefe. |
| **Lohn-Z1-/Z2-Format** | Eine konkrete Lohn-Z1-/Z2-Audit-Format-Wahl ist **Non-Scope** dieser V1.0 und außerhalb MVP. |
| **Pattern-Vorlage** | Z1-/Z2-V1.0 §13 etabliert die dritte kanonische Trennungs-Vorlage; V1.0 paraphrasiert sie spiegelnd. |
| **Vorrang-Regel** | Bei Konflikt mit Z1-/Z2 V1.0 gilt jenes Folgeartefakt für Z1-/Z2-Datenzugriffsarten. |

## 10. Verhältnis zu DSGVO-/Datenpannen-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Datenschutz-Vorfallsprozess. Datenpannen-Boundary verbleibt strikt DSGVO V1.0. |
| **Personenbezogenheit** | Lohn-Daten sind sinngemäß personenbezogene Daten gemäß DSGVO Art. 32; konkrete Auslegung im Einzelfall verbleibt DSGVO V1.0 + externer rechtlicher / DSB-Validierung. |
| **DSGVO Art. 17/18 Topos** | Wechselwirkung zwischen Lohn-Daten-Aufbewahrung (EStG § 41) und DSGVO-Betroffenenrechten (Art. 17/18) ist **Non-Scope** dieser V1.0 und verbleibt DSGVO V1.0 + externer rechtlicher Validierung. |
| **Vorrang-Regel** | Bei Konflikt mit DSGVO V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

## 11. Verhältnis zu Verfahrensdokumentations-Pflege-Pass V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | V1.0 dieses Folgeartefakts liefert (sobald gesperrt) einen Pflege-Eingang Kap. 5 (Berechtigungs-/Datenschutz-Topiken) und Kap. 6 (Aufbewahrungs-/Lösch-Topiken) für die existierende Verfahrensdokumentations-STUB-Schicht — auf reiner Verweis-Ebene; **kein** Endfassungs-Text. |
| **Existierende STUB-Dateien unverändert** | V1.0 editiert keine der existierenden Verfahrensdokumentations-Dateien. |
| **Vorrang-Regel** | Bei Konflikt mit Verfahrensdoku V1.0 bleibt jene als Pflege-Layer-Boundary autoritativ. |

## 12. Verhältnis zu Security-/Krypto-/Key-Custody V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Sicherheits-/Plaintext-Boundary. Sicherheits-Boundary verbleibt strikt Security V1.0. |
| **Plaintext-Verbot über Lohn-DLS-Pfade** | Plattform-Administration erlangt durch Lohn-DLS-Pfade **keinen** einseitigen Plaintext-/Schlüssel-/Mandantendaten-Zugriff (sinngemäße Spiegelung Security V1.0 §10 + F0-D7). |
| **Vorrang-Regel** | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. |

## 13. Verhältnis zu Custody-Modell V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Custody-Topologie. Custody-Boundary verbleibt strikt Custody V1.0. |
| **Plaintext-Boundary** | Custody V1.0 §13 „Verbot einseitiger Plaintext-Macht über Restore-, Migrations- oder Z3-Pfade" gilt sinngemäß auch über Lohn-DLS-Pfade. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 14. Verhältnis zu KMS-/HSM-/Implementations-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Schlüsselverwaltungs-Topologie. Schlüssel-/HSM-/KMS-Implementations-Boundary verbleibt strikt KMS-/HSM V1.0. |
| **Schlüssel-Boundary** | Lohn-DLS-Pfade dürfen **keinen** Schlüssel-/Custody-Zugriff jenseits der für Lohn-Daten-Verarbeitung üblichen Plaintext-Boundary öffnen. |
| **Vorrang-Regel** | Bei Konflikt mit KMS-/HSM V1.0 gilt KMS-/HSM V1.0 für Schlüssel-/Implementations-Boundaries. |

## 15. Verhältnis zu TR-02102-Detail V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Krypto-/Transport-Parameter-Wahl. Krypto-/Transport-Boundary verbleibt strikt TR-02102-Detail V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. |

## 16. Verhältnis zu ASVS-Control-Referenz V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ ASVS-Verifikation/-Mapping. ASVS-Profil-Boundary verbleibt strikt ASVS V1.0. |
| **Keine Verifikations-Behauptung** | V1.0 trifft **keine** ASVS-Verifikations-, ASVS-Mapping- oder ASVS-Konformitäts-Aussage zur Lohn-DLS-Mechanik. |
| **Vorrang-Regel** | Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Profil-Boundary. |

## 17. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ DR-/HA-/BCM-Restore-Mechanik. Restore-Boundary verbleibt strikt DR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit DR V1.0 gilt DR V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 18. Verhältnis zu Cybersecurity-Incident-Response V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Cybersecurity-IR-Workflow. IR-Workflow-Boundary verbleibt strikt IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit IR V1.0 gilt IR V1.0 für IR-Workflow-Boundaries. |

## 19. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Lösch-/Sperr-Boundary-Inhalt. Lösch-/Sperr-Boundary verbleibt strikt Lösch-/Sperrkonzept V1.0. |
| **Sperrgrund-Bezug** | Sperrgrund-Klassen können sinngemäß auch Lohn-DLS-Operationen aussetzen; konkrete Aussetzungs-Mechanik verbleibt Lösch-/Sperrkonzept V1.0 + Cybersecurity-IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

## 20. Verhältnis zu Dokumentenkategorie-/Retention-Regelmatrix V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Lohn-DLS ≠ Klassifikations-Boundary. Klassifikation verbleibt strikt Regelmatrix V1.0. |
| **Lohn-Kategorien** | Eine konkrete Lohn-Klassifikations-Tabelle ist **Non-Scope** dieser V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Boundaries. |

## 21. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Wechselwirkung zwischen Crypto-Shredding und Lohn-DLS-Topiken. |
| **Open-Question-Datei unverändert** | V1.0 ändert die Open-Question-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 22. Verhältnis zu Hash-Chain-vs.-Erasure

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/HASH-CHAIN-VS-ERASURE.md`. |
| **Keine Endfassungs-Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor und wählt **keine** Option. |
| **Open-Question-Datei unverändert** | V1.0 ändert die Hash-Chain-vs.-Erasure-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung bleibt vor produktiver Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 23. Verhältnis zu §28.11-bet

| Aspekt | Aussage |
|---|---|
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Keine Wechselwirkungs-Aussage** | V1.0 trifft **keine** Aussage zur Wechselwirkung zwischen §28.11-bet und der Lohn-DLS-Boundary. |
| **Externe Klärung** | Eine etwaige Klärung des §28.11-bet-Status bleibt außerhalb dieses Folgeartefakts. |

## 24. Wahrung gesperrter Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; Lohn-DLS hebt Festschreibung **nicht** auf. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Lohn-DLS-Pfade. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; **kein** einseitiger Plaintext-Zugriff durch Plattform-Administration über Lohn-DLS-Pfade. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Lohn-DLS-Topoi erzeugen **keine** USt-Werte. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ; Lohn-DLS ≠ Z3-Mechanik. Lohnsteuer-Außenprüfung außerhalb MVP gemäß Register §3.10 / §6 Marker D. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ. |
| **F3-D3 Migrations-Spezifikation** | Bleibt autoritativ; Lohn-DLS ≠ Migrations-Mechanik. |
| **F3-Closing** | Bleibt autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt ≠ Z1-/Z2-Datenzugriffe-Folgeartefakt ≠ Lohn-DLS-Folgeartefakt. |
| **§28.11-bet** | Bleibt unverändert/offen. |

## 25. Explicit Non-Scope

- Konkrete Lohnsteuer-Außenprüfungs-Mechanik (außerhalb MVP gemäß Register §3.10 / §6 Marker D).
- Lohnarten-Schema; Lohnsteuer-Berechnungs-Mechanik; Sozialversicherungs-Beitrags-Berechnungs-Mechanik.
- ELStAM-Workflow; DEÜV-Workflow; SV-Meldungs-Workflow; Lohn-Reporting-Workflow; Lohn-Buchhaltungs-Workflow; Lohn-Export-Workflow.
- Konkrete Lohn-Z1-/Z2-/Z3-Audit-Format-Wahl.
- Konkrete Lohnkonten-Frist-Tabellen; Aufbewahrungs-Stichtag-Logik; Lohnsteuer-Sonderfristen-Tabellen; Sozialversicherungs-Aufbewahrungs-Tabellen.
- Datenbank-/Dateisystem-Schema; Daten-Wörterbücher; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration.
- Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-Wahl.
- Konkrete Berechtigungs-/Rollen-Tabellen; konkrete Audit-Schema-Felder.
- Edits an existierenden App-Code-Pfaden (`src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`, `src/pages/Payroll*`, `src/lib/crypto/payrollHash*`, oder vergleichbaren Pfaden) sowie deren Validierung, Finalisierung oder Autorisierung.
- Edits an existierenden V1.0-Specs, Verfahrensdoku-STUB-Dateien (`docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/**`), Demo-Paketen (`demo-package/**`).
- Externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere EStG § 41-Volltext, Lohnsteuer-Richtlinien-Volltext, Sozialgesetzbuch-Volltext, ELStAM-Spezifikation, DEÜV-Spezifikation, SV-Meldeverfahren-Spezifikation, GoBD-/AO-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001).
- Externe-Norm-Volltext-Aufnahme.
- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Finanzamt-/SV-Träger-/Kammer-Akzeptanz-Behauptungen jeglicher Art.
- Productive-Readiness-Behauptungen jeglicher Art.
- Garantie-Aussagen gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Kammern, Finanzämtern, SV-Trägern oder externen Validierungs-Stellen.
- Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung.
- DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Marketing-Aussagen.
- Rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question; Status 🔴).
- Rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt Open-Question).
- Endfassung Verfahrensdokumentation Kap. 1–8.
- Aufhebung des Außerhalb-MVP-Status.
- Änderung oder Reinterpretation von §28.11-bet.
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 26. Wortwahl-Disziplin

V1.0 dieses Folgeartefakts hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Finanzamt-/SV-Träger-/Kammer-Akzeptanz-, Garantie- oder Freigabe-Behauptungen sind ausgeschlossen — auch nicht in Beispielform innerhalb dieser V1.0.
- Aussagen über externe Norm-Konformität (insbesondere gegenüber EStG-, Lohnsteuer-Richtlinien-, SGB-, ELStAM-, DEÜV-, SV-, GoBD-, AO-, IDW-, AWV-, Kammer-, BSI-, ISO-Quellen) sind ausgeschlossen; externe Normen erscheinen ausschließlich als Negativ-Hinweis und nicht als Lock-Quelle.
- Productive-Readiness-Sprache („Lohn-DLS-ready", „payroll-ready", „außenprüfungs-fest", „prüfungsfest", „live-payroll", „validated", „certified", „compliant") ist ausgeschlossen.
- Marketing-/Reife-/Vendor-/Cloud-Marketing-Sprache ist ausgeschlossen.
- App-Code-Validierungs-Sprache („Lohn-App-Code validiert", „payroll-engine geprüft", „freigegebene Lohnsteuer-Berechnung") ist ausgeschlossen.
- Behörden-/Auditor-Akzeptanz-Sprache („behördlich akzeptierte Lohnabrechnung", „prüfungsfeste Lohn-DLS-Mechanik") ist ausgeschlossen.
- Aufhebung des Außerhalb-MVP-Status durch Wortwahl ist ausgeschlossen.
- Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen, die wie eine Auslegung wirken könnten, sind ausgeschlossen.
- Aussagen, die Crypto-Shredding rechtlich werten oder die Hash-Chain-vs.-Erasure-Option vorwegnehmen, sind ausgeschlossen.
- Inhalte in arabischer Schrift sind ausgeschlossen; UTF-8-BOM ist ausgeschlossen.
- STOP-Klauseln formulieren generisch und wiederholen sensible Beispiele **nicht** wörtlich.

## 27. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **Lohn-DLS-Detail-Folgeartefakt** | Detail-Mechanik jenseits Boundary-Lock-Layer (Lohnsteuer-Außenprüfungs-Workflow, Lohnarten-Schema, Lohnsteuer-Berechnungs-Mechanik, SV-Beitrags-Berechnungs-Mechanik, ELStAM-/DEÜV-/SV-Workflows, Lohn-Z1-/Z2-/Z3-Audit-Format) | offen; ausdrücklich nicht Bestandteil von V1.0 und außerhalb MVP gemäß Register §3.10 / §6 Marker D |
| **Lohnkonten-Frist-Detail-Folgeartefakt** | Konkrete Frist-Tabellen, Stichtag-Logik, Sonderfristen-Tabellen | offen; nicht Bestandteil von V1.0 |
| **Lohn-Z1-/Z2-Audit-Format-Folgeartefakt** | Konkrete Lohn-Z1-/Z2-Audit-Format-Wahl im Außenprüfungs-Kontext | offen; nicht Bestandteil von V1.0 |
| **Lohn-Z3-Audit-Format-Folgeartefakt** | Konkrete Lohn-Z3-Audit-Format-Wahl im Außenprüfungs-Kontext | offen; nicht Bestandteil von V1.0 |
| **Externe steuerprüfungs-fachliche Validierung** | Externer Validierungs-Schritt durch StB- / WP- / Lohnsteuer-Beratung vor produktiver bzw. behördlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Externe DSB-Validierung** | Externer DSB-Validierungs-Schritt für Lohn-Daten als personenbezogene Daten gemäß DSGVO Art. 32 | erforderlich vor produktiver bzw. rechtsverbindlicher Anwendung; **Non-Scope** dieser V1.0 |
| **Sicherheits-/Produktivfreigabe** | Externer Freigabe-Schritt vor produktiver Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Verfahrensdokumentation Kap. 5 / Kap. 6 Pflege** | Pflege-Eingang (Berechtigungs-/Datenschutz- bzw. Aufbewahrungs-/Lösch-Topiken) | offen; **Non-Scope** dieser V1.0 |
| **Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0** | Marker-D-Geschwister; LIVE | LIVE |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Hash-Chain-vs.-Erasure-Open-Question** | Open-Question | offen; **keine** Würdigung in V1.0 |

V1.0 dieses Folgeartefakts erzeugt **keine** Implementierung, **keine** Konfiguration, **keinen** Mechanismus und **keine** Vendor-/Cloud-/Hardware-Wahl.

## 28. STOP-Bedingungen

V1.0 dieses Folgeartefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 29.1 | V1.0 dieses Folgeartefakts importiert externen EStG-/Lohnsteuer-Richtlinien-/SGB-/ELStAM-/DEÜV-/SV-Meldeverfahren-/GoBD-/AO-/IDW-/AWV-/Kammer-/BSI-/ISO-Volltext oder erhebt eine externe Quelle zur Lock-Quelle. |
| 29.2 | V1.0 dieses Folgeartefakts erstellt eine konkrete Lohnsteuer-Außenprüfungs-Mechanik (außerhalb MVP). |
| 29.3 | V1.0 dieses Folgeartefakts erstellt ein konkretes Lohnarten-Schema, eine Lohnsteuer-Berechnungs-Mechanik, eine Sozialversicherungs-Beitrags-Berechnungs-Mechanik, einen ELStAM-Workflow, einen DEÜV-Workflow, einen SV-Meldungs-Workflow, einen Lohn-Reporting-Workflow, einen Lohn-Buchhaltungs-Workflow oder einen Lohn-Export-Workflow. |
| 29.4 | V1.0 dieses Folgeartefakts trifft eine konkrete Lohn-Z1-/Z2-/Z3-Audit-Format-Wahl. |
| 29.5 | V1.0 dieses Folgeartefakts erstellt konkrete Lohnkonten-Frist-Tabellen, Aufbewahrungs-Stichtag-Logik, Lohnsteuer-Sonderfristen-Tabellen oder Sozialversicherungs-Aufbewahrungs-Tabellen. |
| 29.6 | V1.0 dieses Folgeartefakts enthält Datenbank-/Dateisystem-Schema, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definitionen, UI/UX, automatische Jobs, Test-Cases oder CI/CD-Konfiguration. |
| 29.7 | V1.0 dieses Folgeartefakts wählt Werkzeuge, Anbieter, Cloud-Provider, Plattformen, Bibliotheken, Hardware, Storage-Lösungen, Auth-Provider oder Tool-Konfigurationen. |
| 29.8 | V1.0 dieses Folgeartefakts editiert existierende App-Code-Pfade (`src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`, `src/pages/Payroll*`, `src/lib/crypto/payrollHash*`, oder vergleichbare Pfade) oder autorisiert/finalisiert/validiert deren Implementation. |
| 29.9 | V1.0 dieses Folgeartefakts editiert existierende V1.0-Specs, Verfahrensdokumentations-STUB-Dateien (`docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/**`) oder Demo-Pakete (`demo-package/**`). |
| 29.10 | V1.0 dieses Folgeartefakts modifiziert package-/config-/script-/test-/baseline-Dateien oder führt SQL/Migrationen aus. |
| 29.11 | V1.0 dieses Folgeartefakts erstellt eine Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Finanzamt-/SV-Träger-/Kammer-Akzeptanz- oder produktive Freigabe-Behauptung. |
| 29.12 | V1.0 dieses Folgeartefakts erstellt eine Productive-Readiness-Behauptung („Lohn-DLS-ready", „payroll-ready", „außenprüfungs-fest", „prüfungsfest") oder eine Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Kammern, Finanzämtern, SV-Trägern oder externen Validierungs-Stellen. |
| 29.13 | V1.0 dieses Folgeartefakts hebt den Außerhalb-MVP-Status (Register §3.10 / §6 Marker D) implizit oder explizit auf. |
| 29.14 | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei (insbesondere `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`, `docs/HASH-CHAIN-VS-ERASURE.md`). |
| 29.15 | V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet. |
| 29.16 | V1.0 dieses Folgeartefakts schwächt F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 29.17 | V1.0 dieses Folgeartefakts öffnet einen Plaintext-Beschaffungs-Pfad über Lohn-DLS-Pfade oder schwächt das in F0-D7 + Custody V1.0 §13 + Security V1.0 §10 verankerte Verbot einseitiger Plaintext-Macht. |
| 29.18 | V1.0 dieses Folgeartefakts ermöglicht Cross-Mandanten-Datenfluss durch Lohn-DLS-Pfade (verletzt F0-D6). |
| 29.19 | V1.0 dieses Folgeartefakts erzeugt USt-Werte über Lohn-DLS-Topoi (verletzt F1-D1/F1-D2). |
| 29.20 | V1.0 dieses Folgeartefakts verschmilzt die Lohn-DLS-Boundary mit Z3 V1.0, Migration V1.0, Z1-/Z2-Datenzugriffe V1.0, Aufbewahrungs-/Retention-Archiv V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Custody-Modell V1.0, Security V1.0, ASVS V1.0, TR-02102-Detail V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, KMS-/HSM-/Implementations-Folgeartefakt V1.0 oder Verfahrensdokumentations-Pflege-Pass V1.0, statt diese Specs ausschließlich als Trennlinien-/Boundary-Anker zu referenzieren. |
| 29.21 | V1.0 dieses Folgeartefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 29.22 | V1.0 dieses Folgeartefakts nimmt eine rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor oder wählt eine Option. |
| 29.23 | V1.0 dieses Folgeartefakts erteilt Rechtsauskunft, Steuerauskunft, sicherheitsfachliche Einzelfall-Entscheidung, DSB-Freigabe, Sicherheitsfreigabe oder Produktivfreigabe. |
| 29.24 | V1.0 dieses Folgeartefakts erstellt oder finalisiert Inhalte für Verfahrensdokumentation Kap. 1, Kap. 2, Kap. 3, Kap. 4, Kap. 5, Kap. 6, Kap. 7 oder Kap. 8. |
| 29.25 | V1.0 dieses Folgeartefakts behauptet, die externe steuerprüfungs-fachliche Validierung, die externe DSB-Validierung oder die externe Sicherheits-/Produktivfreigabe vor produktiver Anwendung erübrigen zu können. |
| 29.26 | V1.0 dieses Folgeartefakts erhebt EStG § 41-Volltext, Lohnsteuer-Richtlinien-Volltext, Sozialgesetzbuch-Volltext, ELStAM-Spezifikation, DEÜV-Spezifikation, SV-Meldeverfahren-Spezifikation oder vergleichbare externe Quellen zur Lock-Quelle. |
| 29.27 | Die Forbidden-Reference-Gate-Baseline (BLOCKED, BASELINE_ALLOWED, ALLOW_MARKED) ändert sich durch Aufnahme dieser V1.0 in den Repository-Stand. |
| 29.28 | V1.0 dieses Folgeartefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 29.29 | V1.0 dieses Folgeartefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Finanzamt-/SV-Träger-Akzeptanz- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |
| 29.30 | V1.0 dieses Folgeartefakts trifft eine App-Code-Aussage über Existenz, Vollständigkeit, Reife, Validität oder Akzeptanz der unter `src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`, `src/pages/Payroll*`, `src/lib/crypto/payrollHash*` oder vergleichbaren Pfaden vorhandenen Implementation. |

## 29. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene; intern accepted; **außerhalb MVP** gemäß Register §3.10 / §6 Marker D; **keine** Lohn-DLS-Endfassung; **keine** produktive Freigabe |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Behörden-Akzeptanz-/Auditor-Akzeptanz-/Finanzamt-/SV-Träger-/Kammer-Akzeptanz-Behauptung; **keine** externe Konformitäts-/Zertifizierungs-/Audit-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Kammern, Finanzämtern oder SV-Trägern; **keine** App-Code-Validierungs-Aussage |
| **STOP-Bedingungen** | 30 Klauseln (§29.1 — §29.30) |
| **Bindend für** | Alle in Abschnitt 27 genannten Detail-Folgeartefakte; Verfahrensdokumentation Kap. 5 und Kap. 6 (im Rahmen ihrer jeweils nächsten Pflege außerhalb dieser V1.0) hinsichtlich der Trennlinien dieses Artefakts; alle nachgelagerten Detail-Artefakte zu Lohn-DLS-Themen, sofern und sobald der Außerhalb-MVP-Status durch eine eigenständige Register-Aktualisierung verschoben wird. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen Z3 V1.0, Migration V1.0, Z1-/Z2-Datenzugriffe V1.0, Aufbewahrungs-/Retention-Archiv V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Custody-Modell V1.0, Security V1.0, ASVS V1.0, TR-02102-Detail V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, KMS-/HSM-/Implementations-Folgeartefakt V1.0, Verfahrensdokumentations-Pflege-Pass V1.0 sowie die Crypto-Shredding-Rechtsfrage und die Hash-Chain-vs.-Erasure-Open-Question. |
| **Nicht bindend für** | Konkrete Lohnsteuer-Außenprüfungs-Mechanik. Lohnarten-Schema. Lohnsteuer-Berechnungs-Mechanik. Sozialversicherungs-Beitrags-Berechnungs-Mechanik. ELStAM-Workflow / DEÜV-Workflow / SV-Meldungs-Workflow. Lohn-Reporting-/Lohn-Buchhaltungs-/Lohn-Export-Workflow. Lohn-Z1-/Z2-/Z3-Audit-Format. Konkrete Lohnkonten-Frist-Tabellen oder Stichtag-Logik. Datenmodell/Schema. UI/UX. Programmcode. Pseudocode. Algorithmus-Design. SQL. APIs. Automatische Jobs. Test-Cases. CI/CD-Konfiguration. Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-Wahl. Konkrete Berechtigungs-/Rollen-Tabellen oder Audit-Schema-Felder. Bestehende App-Code-Implementation unter `src/**`. Z3-Format. Migrations-Mechanik. Z1-/Z2-Mechanik. DR-Restore-Mechanik. IR-Workflow. Datenschutz-Vorfallsprozess. Lösch-/Sperr-Boundary-Inhalt. Klassifikation. Aufbewahrungs-/Retention-Archiv-Boundary. ASVS-Verifikation/-Mapping. Konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter. Konkrete Custody-Topologie / Schlüsselhierarchie / KMS-/HSM-Modellwahl. Rechtliche Würdigung von Crypto-Shredding. Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question. Endfassung Verfahrensdokumentation Kap. 1–8. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | Lohn-DLS ≠ Aufbewahrungs-/Retention-Archiv. Lohn-DLS ≠ Z3-/Datenüberlassung. Lohn-DLS ≠ Migration. Lohn-DLS ≠ Z1-/Z2-Datenzugriff. Lohn-DLS ≠ Lösch-/Sperr-Boundary-Inhalt. Lohn-DLS ≠ Klassifikation. Lohn-DLS ≠ Custody-Topologie. Lohn-DLS ≠ Sicherheits-/Plaintext-Boundary. Lohn-DLS ≠ Krypto-/Transport-Parameter-Wahl. Lohn-DLS ≠ ASVS-Verifikation. Lohn-DLS ≠ DR-/HA-/BCM-Restore-Mechanik. Lohn-DLS ≠ Cybersecurity-IR-Workflow. Lohn-DLS ≠ Datenschutz-Vorfallsprozess. Lohn-DLS ≠ KMS-/HSM-Topologie. Lohn-DLS ≠ Verfahrensdokumentations-Endfassung. Lohn-DLS ≠ Crypto-Shredding-Rechtswürdigung. Lohn-DLS ≠ Hash-Chain-vs.-Erasure-Endfassungs-Würdigung. Lohn-DLS ≠ App-Code-Layer (`src/**`). Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt ≠ Z1-/Z2-Datenzugriffe-Folgeartefakt ≠ Lohn-DLS-Folgeartefakt (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; **kein** einseitiger Plaintext-Zugriff. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. **Lohnsteuer-Außenprüfung außerhalb MVP gemäß Register §3.10 / §6 Marker D.** |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §6 Marker D oder §3.10 Boundaries gilt der Register. Bei Konflikt mit Retention V1.0 §9 gilt Retention V1.0. Bei Konflikt mit Z3 V1.0, Migration V1.0, Z1-/Z2-Datenzugriffe V1.0, Security V1.0, Custody V1.0, KMS-/HSM-/Implementations-Folgeartefakt V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, IR V1.0, DSGVO V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0 oder Verfahrensdoku V1.0 gilt jeweils diese Quelle für ihre Boundary-Domäne. Bei Konflikt mit Crypto-Shredding-Open-Question oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |
| **Verankerungs-Hinweis** | Das Lohn-DLS-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker D** verankert (Eintrag: „Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP"). Sortierungsmarker D ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Z1-/Z2-Datenzugriffe-Folgeartefakt geteilt. V1.0 paraphrasiert Marker D ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert weder Register §6 noch Register §3.10 Boundaries. **Die Außerhalb-MVP-Disziplin ist die zentrale Lock-Aussage.** |
| **Externe Validierung** | Vor produktiver bzw. behördlicher Anwendung sind eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe erforderlich. Alle drei sind **Non-Scope** von V1.0. |

## 30. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **außerhalb MVP**; **nicht** Lohn-DLS-Endfassung; **nicht** Bestandteil eines externen Audit-, Zertifizierungs-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Finanzamt-/SV-Träger-Akzeptanz- oder Kammer-Akzeptanz-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Boundary-Lock-Layer-V1.0 für Lohn-DLS unter Marker D; Außerhalb-MVP-Disziplin als zentrale Lock-Aussage gemäß Register §3.10 / §6 Marker D wörtlich verankert; Lohn-Tiefe-Topos auf reiner Verweis-Ebene gemäß Retention V1.0 §9 paraphrasiert; App-Code-Layer-Disziplin (existierende `src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`/`Payroll*`, `src/lib/crypto/payrollHash*` unverändert; V1.0 trifft keine App-Code-Aussage); kanonische Trennungs-Pattern-Vorlage aus Retention V1.0 §9 + Z3 V1.0 §17 + Migration V1.0 §22 + Z1-/Z2 V1.0 §13 wörtlich paraphrasiert; Spiegelung F0-D4-/F0-D6-/F0-D7-/F1-D1/F1-D2-Disziplinen über Lohn-DLS-Pfade; Plaintext-Boundary-Spiegelung gegenüber Custody V1.0 §13 + Security V1.0 §10; ausdrückliche Aufnahme von EStG § 41-Volltext, Lohnsteuer-Richtlinien-Volltext, Sozialgesetzbuch-Volltext, ELStAM-/DEÜV-/SV-Spezifikationen, GoBD-/AO-/IDW-/AWV-/Kammer-/BSI-/ISO-Volltext in die Negativ-Quellgrundlage; Crypto-Shredding-Rechtsfrage und Hash-Chain-vs.-Erasure-Open-Question als ausdrückliche Open-Question-Verweise ohne Würdigung verankert; Schärfung der Anti-Konformitäts-/Anti-Zertifizierungs-/Anti-Audit-/Anti-Behörden-Akzeptanz-/Anti-Auditor-Akzeptanz-/Anti-Finanzamt-/Anti-SV-Akzeptanz-/Anti-Garantie-/Anti-Productive-Readiness-/Anti-App-Code-Validierungs-Wortwahl; STOP-Numbering nutzt §29.x (vermeidet Kollision mit §28.11-bet); in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; Detail-Folgeartefakte (Lohn-DLS-Detail, Lohnkonten-Frist-Detail, Lohn-Z1-/Z2-/Z3-Audit-Format) werden eigenständig versioniert, sofern und sobald der Außerhalb-MVP-Status durch eine eigenständige Register-Aktualisierung verschoben wird. Eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe bleiben vor produktiver bzw. behördlicher Anwendung erforderlich. |
