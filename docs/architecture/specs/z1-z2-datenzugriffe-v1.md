# Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0

**Lock-Aussage:** Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im *Harouda Locked Decisions Register V1.0* §6 Sortierungsmarker D wörtlich verankerte Pflege-Boundary für Z1- und Z2-Datenzugriffsarten neben Z3 („Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3"). V1.0 ist eine **combined Boundary-Lock-Layer-Spec** für Z1 (unmittelbarer/direkter Datenzugriff) und Z2 (mittelbarer/indirekter Datenzugriff) als gemeinsames Topik im Pattern bewährter Trio-Boundary-Locks (analog `dr-ha-bcm-v1.md`); sie spaltet Z1 und Z2 **nicht** in zwei getrennte Dateien. V1.0 modifiziert weder Register §6 Marker D noch Register §3.10 Boundaries („keine Z1-/Z2-Mechanik" in F3-D1) noch Z3 V1.0 §18 noch Migration V1.0 §21. V1.0 autorisiert **keine** Implementierung. V1.0 enthält **keine** konkrete Z1-Mechanik, **keine** konkrete Z2-Mechanik, **keinen** Auditor-Account-Konfigurations-Workflow, **keine** Read-Only-Rollen-Implementierung, **keine** Sitzungs-Verwaltung, **keine** IP-Restriction, **keinen** Berichts-Definitions-Schema, **keine** Query-Mechanik, **keine** Auswertungs-Logik, **keinen** Beleg-Übergabe-Workflow, **keinen** Auditor-Anfrage-Eingang, **kein** Datenbank-/Dateisystem-Schema, **keinen** Programmcode, **kein** Pseudocode, **kein** Algorithmus-Design, **kein** SQL, **keine** API-/UI-/Job-/Test-/CI-/CD-Konfiguration, **keine** Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-/RLS-Provider-Wahl, **keine** konkreten Berechtigungs-/Rollen-Tabellen, **keine** konkrete Rechte-Matrix, **keine** konkreten Audit-Schema-Felder, **keine** konkreten Sitzungs-Lebensdauern, Auto-Logout-Zeiten, Whitelist-Werte oder Eskalations-Trigger-Werte. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz- oder Auditor-/Kammer-Akzeptanz-Behauptung gegenüber externen Normen oder Prüfungs-Standards. V1.0 nimmt **keine** rechtliche Würdigung von Crypto-Shredding und **keine** rechtliche/technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor; beide bleiben offen. §28.11-bet bleibt unverändert/offen. Eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe bleibt vor produktiver bzw. behördlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Implementations-Endfassung; **keine** operative Z1-/Z2-Mechanik; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Behörden-Akzeptanz-Behauptung; **keine** Auditor-Akzeptanz-Behauptung; **keine** Konformitäts-, Zertifizierungs-, Audit-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen oder Kammern |
| Scope | Boundary-Aussagen zu: Z1- und Z2-Datenzugriffsarten als Topoi neben Z3-Datenüberlassung; Marker-D-Operationalisierung auf Boundary-Lock-Layer-Ebene; combined-Behandlung von Z1 und Z2 (analog Trio-Pattern `dr-ha-bcm-v1.md`); Trennlinien gegenüber Z3 V1.0, Migration V1.0, Lohn-DLS-Folgeartefakt und allen anderen 14 V1.0-Specs; Spiegelung der F0-D4-/F0-D6-/F0-D7-/F1-D1/F1-D2-Disziplinen in Z1-/Z2-Pfade; Plaintext-Boundary-Spiegelung gegenüber Custody V1.0 §13 + Security V1.0 §10; Read-Only-Topos auf Boundary-Ebene; Audit-Spur-Topos auf Boundary-Ebene; Cross-Boundary-Konsistenz mit allen 14 gesperrten V1.0-Specs und gesperrten Harouda-Locks |
| Non-Scope | Konkrete Z1-Mechanik (Auditor-Account-Konfiguration, Read-Only-Rollen-Implementierung, Sitzungs-Verwaltung, Sitzungs-Limits, IP-Restriction, Auto-Logout-Zeiten); konkrete Z2-Mechanik (Berichts-Definitions-Schema, Query-Mechanik, Auswertungs-Logik, Beleg-Übergabe-Workflow, Auditor-Anfrage-Eingang); Datenbank-/Dateisystem-Schema; Daten-Wörterbücher; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration; Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-/RLS-Provider-Wahl; konkrete Berechtigungs-/Rollen-Tabellen; konkrete Rechte-Matrix; konkrete RLS-Konfiguration; konkrete Audit-Schema-Felder oder Audit-Log-Struktur; konkrete Sitzungs-Lebensdauern, Auto-Logout-Zeiten, IP-Whitelist-Werte oder Eskalations-Trigger-Werte; Berichts-/Auswertungs-Schemata oder konkrete Berichts-Vorlagen; Beleg-Übergabe-Format; Datei-Format-Wahl; Übergabe-Plattform-Wahl; Verschlüsselungs-/Transport-Mechanik (verbleibt TR-02102-Detail V1.0 + Security V1.0); Schlüssel-/Custody-Mechanik (verbleibt Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt); Z3-Format / Behörden-Auslieferungs-Mechanik (verbleibt Z3 V1.0); Migrations-Mechanik (verbleibt Migration V1.0); DR-/HA-/BCM-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0); IR-Workflow / Forensik-Werkzeug-Wahl / SIEM-/SOC-/Tool-Wahl (verbleibt IR V1.0); Datenschutz-Vorfallsprozess / Breach-Notification-Inhalte (verbleibt DSGVO-/Datenpannen V1.0); Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0); Klassifikation (verbleibt Regelmatrix V1.0); Aufbewahrungs-/Retention-Archiv-Boundary (verbleibt Retention V1.0); ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0); Lohn-DLS-Tiefe einschließlich Lohnsteuer-Außenprüfung (verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP gemäß Register §3.10/§6); rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question); rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt Open-Question); externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere AO § 147 Abs. 6-Volltext, GoBD-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001, ISO 27018); Garantie-Aussagen jeglicher Art; Productive-Readiness-Behauptungen jeglicher Art; Endfassung Verfahrensdokumentation Kap. 1–8; Edits an existierenden V1.0-Specs, Verfahrensdoku-STUB-Dateien, App-Code-Layer (`src/**`) oder Demo-Paketen (`demo-package/**`); Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Behörden-Akzeptanz-Behauptung; Auditor-Akzeptanz-Behauptung; Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register V1.0 §6 Sortierungsmarker D („Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3"); Locked Decisions Register V1.0 §3.10 (F3-D1) Boundaries (Negativ-Anker: „keine Z1-/Z2-Mechanik" in F3-D1); Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §1 Lock-Aussage / §1 Scope / §1 Non-Scope / §1 Lock-Basis / §2 Authoritative Source Basis / **§18 „Verhältnis zu Z1-/Z2-Folgeartefakten"** (kanonische Trennungs-Vorlage: Trennlinie / Vermischungs-Verbot / Vorrang-Regel) / §22 Explicit Non-Scope / §24 STOP 24.15 / §25 Downstream / §26 Lock-Profil / §27 Versionshinweis; Migrations-Folgeartefakt V1.0 §1 Lock-Aussage / §1 Scope / §1 Non-Scope / **§21 „Verhältnis zu Z1-/Z2-Folgeartefakten"** (zweite kanonische Trennungs-Vorlage) / §26 Explicit Non-Scope / §29 STOP 29.15/29.24 / §30 Lock-Profil / §31 Versionshinweis; Security-/Krypto-/Key-Custody V1.0 (F0-D7-Plaintext-Disziplin); Custody-Modell V1.0 §13 (Verbot einseitiger Plaintext-Macht; sinngemäß auch über Z1-/Z2-Pfade); KMS-/HSM-/Implementations-Folgeartefakt V1.0 (Schlüssel-Boundary); alle weiteren 11 V1.0-Specs als Trennlinien-/Boundary-Anker; Open-Question-Verweis `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴; nur Verweis); Open-Question-Verweis `docs/HASH-CHAIN-VS-ERASURE.md` (nur Verweis); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §6 Marker D oder §3.10 Boundaries gilt der Register als autoritative Quelle; V1.0 paraphrasiert ausschließlich auf Boundary-Lock-Layer-Ebene und ändert den Register **nicht**. Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries (insbesondere F3-D1). Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries (insbesondere F3-D3). Bei Konflikt mit Security V1.0 oder Custody V1.0 oder KMS-/HSM-/Implementations-Folgeartefakt V1.0 gilt jeweils diese Quelle für Sicherheits-/Plaintext-/Custody-Boundaries. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt jene für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Cybersecurity-IR V1.0 gilt jene für IR-Workflow-Boundaries. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jene für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt jene für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Verfahrensdoku V1.0 bleibt jene als Pflege-Layer-Boundary autoritativ. Bei Konflikt mit Crypto-Shredding-Open-Question oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |

**Wichtiger Hinweis zur Verankerung:** Das Z1-/Z2-Datenzugriffe-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* §6 (Open Folgeartefakte) als **Sortierungsmarker D** verankert (Eintrag: „Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3"). Sortierungsmarker D ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Lohn-DLS-Folgeartefakt geteilt; beide Folgeartefakte sind als getrennte, eigenständige Folgeartefakte enumeriert. V1.0 paraphrasiert Marker D ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert den Register **nicht**.

## 2. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §6 Sortierungsmarker D | „Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3" | **Direkte Verankerungs-Quelle** im Register (geteilt mit Lohn-DLS-Folgeartefakt) |
| Locked Decisions Register V1.0 §3.10 (F3-D1) Boundaries | „Boundaries: Keine konkrete XML-/CSV-Struktur, keine Verschlüsselungs-/Transport-Aussage, **keine Z1-/Z2-Mechanik**, keine UI-/Schema-/Implementierungs-Aussage" | **Negativ-Anker**: F3-D1 trifft keine Z1-/Z2-Aussage; Z1/Z2 sind eigenständige Folgeartefakte außerhalb F3-D1 |
| Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §18 „Verhältnis zu Z1-/Z2-Folgeartefakten" | drei Zeilen kanonische Trennungs-Vorlage: **Trennlinie** (Z3 ≠ Z1-/Z2-Mechanik; Z1- und Z2-Datenzugriffsarten als eigenständige Folgeartefakte gemäß Register §6 Marker D); **Vermischungs-Verbot**; **Vorrang-Regel** | **Direkte Trennungs-Pattern-Vorlage** |
| Z3 V1.0 §1 Lock-Aussage / §1 Scope / §1 Non-Scope / §1 Lock-Basis / §2 / §22 / §24 STOP 24.15 / §25 / §26 / §27 | weitere Z1-/Z2-Trennungs-Verweise (Vermischungs-Verbot, Non-Scope, Downstream-Anker, Lock-Profil-Boundary, Versions-Anker) | Verstärkende Trennungs-Anker |
| Migrations-Folgeartefakt V1.0 §21 „Verhältnis zu Z1-/Z2-Folgeartefakten" | drei Zeilen zweite kanonische Trennungs-Vorlage: **Trennlinie** (Migration ≠ Z1-/Z2-Mechanik); **Vermischungs-Verbot**; **Vorrang-Regel** | **Zweite direkte Trennungs-Pattern-Vorlage** |
| Migration V1.0 §1 Lock-Aussage / §1 Scope / §1 Non-Scope / §26 / §29 STOP 29.15 / §29 STOP 29.24 / §30 / §31 | weitere Z1-/Z2-Trennungs-Verweise | Verstärkende Trennungs-Anker |
| Security-/Krypto-/Key-Custody V1.0 §6 / §10 / §13 / §17 | Plaintext-Boundary; F0-D7-Plattform-Admin-Disziplin; sinngemäße Spiegelung über Z1-/Z2-Pfade erforderlich | Plaintext-Boundary-Anker (sinngemäß) |
| Custody-Modell V1.0 §5 / §6 / §10 / §11 / §13 / §15 | „Verbot einseitiger Plaintext-Macht über Restore-, Migrations- oder Z3-Pfade" — sinngemäß auch über Z1-/Z2-Pfade | Plaintext-Boundary-Anker (sinngemäß) |
| KMS-/HSM-/Implementations-Folgeartefakt V1.0 §3 / §10 / §25 | Schlüssel-/Plaintext-Boundary; sinngemäße Wahrung über Z1-/Z2-Pfade | Schlüssel-Boundary-Anker (sinngemäß) |
| Aufbewahrungs-/Retention-Archiv V1.0 / Lösch-/Sperrkonzept V1.0 / Dokumentenkategorie-/Retention-Regelmatrix V1.0 / DR-/HA-/BCM V1.0 / ASVS-Control-Referenz V1.0 / TR-02102-Detail V1.0 / Cybersecurity-IR V1.0 / DSGVO-/Datenpannen V1.0 / Verfahrensdokumentations-Pflege-Pass V1.0 | Cross-Boundary-Trennlinien (alle V1.0-Specs sind eigenständige Boundary-Quellen; Z1/Z2 ≠ jede dieser Quellen) | Cross-Boundary-Anker |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung) | Nur Verweis; **keine** Würdigung |
| Open-Question „Hash-Chain-vs.-Erasure-Entscheidung" | `docs/HASH-CHAIN-VS-ERASURE.md` (Schnittpunkt zur Schlüssel-Wiederherstellungs-/Schlüsselvernichtungs-Topik) | Nur Verweis; **keine** Würdigung |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks |

Ausdrücklich **keine** externen Lock-Quellen: AO § 147 Abs. 6-Volltext, GoBD-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001, ISO 27018 sind **nicht** Lock-Quelle dieses Artefakts. Bezugnahmen auf diese Quellen erfolgen ausschließlich als Negativ-Hinweis; AO-/GoBD-Bezugnahmen erfolgen rein über die Paraphrase im Register §6 Marker D.

## 3. Combined-vs-Separate Begründung

V1.0 ist eine **combined Datei** für Z1 und Z2; sie spaltet die beiden Topiken **nicht** in zwei getrennte Dateien.

| Aspekt | Combined-Begründung |
|---|---|
| **Register-Wortlaut Marker D** | „Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3" — Slash-Schreibweise und einzelner Bullet-Eintrag im Register §6 favorisieren die Bündelung. |
| **Vorgänger-Pattern** | Z3 V1.0 §18 + Migration V1.0 §21 referenzieren Z1 und Z2 stets gepaart als „Z1-/Z2-Mechanik"; alle anderen 14 V1.0-Specs nennen sie ebenfalls gepaart. |
| **Pattern-Vorbild im Lock-Layer** | `dr-ha-bcm-v1.md` lockt drei Topiken (DR + HA + BCM) als Trio-Boundary in einer einzigen Datei; analoge Lock-Trio-Behandlung Z1+Z2 ist pattern-konsistent. |
| **Domänen-Nähe** | Z1 (unmittelbarer/direkter Datenzugriff) und Z2 (mittelbarer/indirekter Datenzugriff) sind beide Datenzugriffsarten der Außenprüfungs-Topik; sie teilen alle Boundary-Topoi auf Boundary-Lock-Layer-Ebene (read-only-Charakter, F0-D7-Plattform-Admin-Disziplin, F0-D6-Mandantentrennung, F0-D4-Festschreibung-Wahrung, Plaintext-Boundary, Auditor-Akzeptanz-Verbot, externe steuerprüfungs-fachliche Validierungs-Voraussetzung). |
| **Differential-Topiken** | Differentialdetails zwischen Z1 (direkter Zugriff am Mandanten-Arbeitsplatz) und Z2 (indirekter Zugriff via Mandanten-Auswertung) sind Workflow-Inhalte, die V1.0 ohnehin **nicht** lockt; sie verbleiben Detail-Folgeartefakten vorbehalten. |
| **Cross-Boundary-Pflege** | Eine combined Datei minimiert Trennlinien-Verweise in nachfolgenden Specs und reduziert das Verschmelzungs-Risiko zwischen Z1- und Z2-Datei selbst. |

Die combined-Entscheidung ist Boundary-Lock-Layer-Ebene; sie nimmt **keine** Workflow-Festlegung vorweg.

## 4. Core Boundaries

Die folgenden Aussagen sind Boundary-Statements; sie sind **keine** Implementations-Aussage, **keine** Workflow-Festlegung und **keine** rechtliche oder steuerliche Auslegung im Einzelfall.

| Boundary | Aussage |
|---|---|
| **Topos-Charakter** | Z1- und Z2-Datenzugriffsarten werden als reine Boundary-Topoi referenziert; V1.0 trifft **keine** konkrete Mechanik-Wahl. |
| **Combined Boundary-Lock** | Z1 und Z2 werden in einer einzigen V1.0-Datei combined behandelt; V1.0 spaltet sie **nicht** in zwei separate Lock-Layer-Specs. |
| **Eigenständigkeit gegenüber Z3** | Z1-/Z2-Datenzugriff ≠ Z3-Datenüberlassung. Z1 und Z2 sind eigenständige Datenzugriffsarten neben Z3 gemäß Register §6 Marker D. |
| **Eigenständigkeit gegenüber Migration** | Z1-/Z2-Datenzugriff ≠ Migrations-Mechanik. Z1 und Z2 sind eigenständige Datenzugriffsarten neben Migrations-Anlässen. |
| **F0-D4 Festschreibungs-Wahrung** | Z1-/Z2-Datenzugriff ist Lese-Topos; **kein** Schreibzugriff durch Auditor; Festschreibung wird durch Z1-/Z2 **nicht** aufgehoben. |
| **F0-D6 Mandantentrennungs-Wahrung** | Z1-/Z2-Datenzugriff bleibt mandantenscharf; **kein** Cross-Mandanten-Zugriff durch Auditor. |
| **F0-D7 Plattform-Admin-Wahrung** | Plattform-Administration erlangt durch Z1-/Z2-Pfade **keinen** Plaintext-/Schlüssel-/Mandantendaten-Zugriff jenseits der für die Außenprüfungs-Topik erforderlichen reinen Lese-Topik; **kein** Plaintext-Beschaffungs-Umweg über Z1-/Z2. |
| **F1-D1 / F1-D2 USt-Wahrheit-Wahrung** | Z1-/Z2-Datenzugriff erzeugt **keine** USt-Werte und ändert **keine** festgeschriebenen USt-Aussagen. |
| **F3-D1 / F3-D2 / F3-D3 / F3-Closing** | Bleiben autoritativ; V1.0 schwächt **keinen** F3-Lock. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Externe-Norm-Disziplin** | Externe Normen / Zertifizierungs-Pfade (AO § 147 Abs. 6-Volltext, GoBD-Volltext, IDW PS 880, AWV-Muster, Kammer-Standards, BSI, ISO) sind ausdrücklich **nicht** Lock-Quelle. |

## 5. Z1-Topoi (unmittelbarer/direkter Datenzugriff) — Boundary-Ebene

Auf Boundary-Topos-Ebene; ausschließlich aus Register §6 Marker D + Z3 V1.0 §18 + Migration V1.0 §21 paraphrasiert. **Keine** Mechanik, **keine** Workflow-Festlegung.

| Topos | Aussage |
|---|---|
| **Charakter** | Z1 ist Boundary-Topos für unmittelbaren/direkten Datenzugriff im Außenprüfungs-Kontext (Auditor-Lese-Zugriff am Mandanten-Arbeitsplatz oder über äquivalenten Lese-Zugang). |
| **Read-Only-Topos** | Z1-Datenzugriff ist auf Lese-Zugriff begrenzt. Konkrete Read-Only-Enforcement-Mechanik ist **Non-Scope**. |
| **Mandantenscharfes-Zugriffs-Topos** | Z1-Datenzugriff bleibt strikt auf den Außenprüfungs-relevanten Mandanten begrenzt. Konkrete Cross-Mandanten-Sperr-Mechanik ist **Non-Scope**. |
| **Audit-Spur-Topos** | Z1-Zugriffe werden in einer Audit-Spur dokumentiert. Konkrete Audit-Schema-Felder, Audit-Log-Struktur, Eskalations-Trigger-Werte sind **Non-Scope**. |
| **Auditor-Identitäts-Topos** | Z1-Datenzugriff erfordert eine eindeutig identifizierte Auditor-Identität. Konkrete Account-Konfiguration, Rolle-Implementierung, Authentifizierungs-Mechanik sind **Non-Scope**. |
| **Sitzungs-Topos** | Z1-Datenzugriff wird in zeitlich begrenzten Sitzungen ausgeführt. Konkrete Sitzungs-Lebensdauern, Auto-Logout-Zeiten, IP-Restrictions, Whitelist-Werte sind **Non-Scope**. |
| **Plaintext-Boundary-Topos** | Z1-Datenzugriff darf **kein** Plaintext-Beschaffungs-Umweg jenseits der reinen Lese-Topik öffnen. F0-D7 + Custody V1.0 §13 + Security V1.0 §10 bleiben autoritativ. |
| **Differential gegenüber Z2** | Z1 ist **direkter** Auditor-Lese-Zugriff (Auditor liest selbst); Z2 ist **indirekter** Zugriff (Mandant erstellt Auswertung im Auftrag des Auditors). Workflow-Differentialdetails sind **Non-Scope**. |

## 6. Z2-Topoi (mittelbarer/indirekter Datenzugriff) — Boundary-Ebene

Auf Boundary-Topos-Ebene; ausschließlich aus Register §6 Marker D + Z3 V1.0 §18 + Migration V1.0 §21 paraphrasiert. **Keine** Mechanik, **keine** Workflow-Festlegung.

| Topos | Aussage |
|---|---|
| **Charakter** | Z2 ist Boundary-Topos für mittelbaren/indirekten Datenzugriff im Außenprüfungs-Kontext (Auditor-Anfrage; Mandant erstellt Auswertung; Übergabe an Auditor). |
| **Auswertungs-Topos** | Z2-Datenzugriff erfolgt durch vom Mandanten erstellte Auswertungen auf Auditor-Anfrage. Konkrete Berichts-Definition, Query-Mechanik, Auswertungs-Logik, Berichts-Schema sind **Non-Scope**. |
| **Anfrage-Topos** | Eine Auditor-Anfrage ist Voraussetzung für eine Z2-Auswertung. Konkrete Anfrage-Format, Eingangs-Workflow, Bearbeitungs-Frist sind **Non-Scope**. |
| **Übergabe-Topos** | Z2-Auswertungen werden in dokumentierter Form an den Auditor übergeben. Konkrete Übergabe-Format, Datei-Format-Wahl, Übergabe-Plattform-Wahl, Beleg-Übergabe-Workflow sind **Non-Scope**. |
| **Mandantenscharfes-Auswertungs-Topos** | Z2-Auswertungen bleiben strikt auf den Außenprüfungs-relevanten Mandanten begrenzt. Konkrete Cross-Mandanten-Sperr-Mechanik ist **Non-Scope**. |
| **Audit-Spur-Topos** | Z2-Anfragen, -Auswertungen und -Übergaben werden in einer Audit-Spur dokumentiert. Konkrete Audit-Schema-Felder sind **Non-Scope**. |
| **Plaintext-Boundary-Topos** | Z2-Datenzugriff darf **kein** Plaintext-Beschaffungs-Umweg jenseits der reinen Auswertungs-Topik öffnen. F0-D7 + Custody V1.0 §13 + Security V1.0 §10 bleiben autoritativ. |
| **Differential gegenüber Z1** | Z2 ist **indirekter** Zugriff über Mandanten-Auswertungen; Z1 ist **direkter** Auditor-Lese-Zugriff. Workflow-Differentialdetails sind **Non-Scope**. |
| **Differential gegenüber Z3** | Z2-Auswertungen ≠ Z3-Datenüberlassung. Eine Z2-Auswertung verlässt nicht zwangsläufig den Mandantenraum als geschlossene Datenträgerüberlassung; Z3 ist die formelle Datenüberlassung. |

## 7. Read-Only-Boundary

Auf Boundary-Topos-Ebene; gemeinsame Disziplin für Z1 und Z2.

- **Topos-Verweis ohne Mechanik:** Z1- und Z2-Datenzugriff sind read-only. Konkrete Read-Only-Enforcement-Mechanismen (Datenbank-Berechtigungen, RLS-Konfiguration, Application-Layer-Checks, Auditor-Account-Restriktionen) sind **Non-Scope**.
- **Schreibzugriffs-Verbot:** Auditor-Schreibzugriff über Z1-/Z2-Pfade ist ausgeschlossen. F0-D4 Festschreibung wird durch Z1-/Z2 **nicht** aufgehoben.
- **Keine Garantie:** V1.0 trifft **keine** Garantie-Aussage zur lückenlosen Read-Only-Erzwingung; sie definiert lediglich die Boundary, dass Z1-/Z2 Lese-Topos sind.
- **Externe Validierung:** die technische Umsetzung der Read-Only-Boundary erfordert externe sicherheitsfachliche Validierung vor produktiver Anwendung; dies ist **Non-Scope** dieser V1.0.

## 8. Audit-Spur-Boundary

Auf Boundary-Topos-Ebene; gemeinsame Disziplin für Z1 und Z2.

- **Topos-Verweis ohne Schema:** Z1-/Z2-Zugriffe und -Auswertungen werden in einer Audit-Spur dokumentiert. Konkrete Audit-Schema-Felder, Audit-Log-Struktur, Aufbewahrungsdauer der Audit-Spur, Korrelations-Mechanik mit anderen Audit-Spuren sind **Non-Scope**.
- **Cross-Spec-Trennung:** Audit-Spuren für Z1-/Z2-Zugriffe sind getrennt von der Aufbewahrungs-/Retention-Archiv-Boundary (Retention V1.0), der Datenschutz-Vorfalls-Dokumentation (DSGVO V1.0 §10 / Art. 33 Abs. 5), den Beweis-Schemata des Cybersecurity-IR (IR V1.0) und den Audit-Verifikations-Aussagen der ASVS-Boundary (ASVS V1.0).
- **Keine Audit-Akzeptanz-Behauptung:** V1.0 behauptet **keine** Akzeptanz der Audit-Spur durch externe Auditoren, Aufsichtsbehörden, Kammern oder Gerichte.

## 9. Plattform-Admin-/Plaintext-Boundary

Auf Boundary-Topos-Ebene; Spiegelung von F0-D7 + Custody V1.0 §13 + Security V1.0 §10.

- **F0-D7 unverändert:** Plattform-Admin-Grenze bleibt rein technische Rolle ohne fachlichen Superuser. Z1-/Z2-Pfade dürfen F0-D7 **nicht** schwächen.
- **Verbot einseitiger Plaintext-Macht über Z1-/Z2-Pfade:** kein Plattform-Admin-Pfad darf einseitigen Klartext-Zugriff auf Mandantendaten unter dem Vorwand eines Auditor-Zugriffs ermöglichen. Diese Disziplin ist Spiegelung der in Custody V1.0 §13 verankerten Topos-Disziplin „Verbot einseitiger Plaintext-Macht über Restore-, Migrations- oder Z3-Pfade" und gilt sinngemäß auch über Z1-/Z2-Pfade.
- **F0-D6 unverändert:** Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Zugriff durch Plattform-Administration unter dem Vorwand eines Auditor-Zugriffs.
- **F0-D4 unverändert:** Z1-/Z2-Datenzugriff ist Lese-Topos; Plattform-Administration erzeugt durch Z1-/Z2-Mechanik **keine** native Festschreibung.
- **F1-D1 / F1-D2 unverändert:** Z1-/Z2-Datenzugriff erzeugt **keine** USt-Werte.

## 10. Anlass-Trennung

Auf Boundary-Topos-Ebene; ausschließlich aus Z3 V1.0 §18 + Migration V1.0 §21 + Register §6 Marker D paraphrasiert.

| Anlass | Trennung |
|---|---|
| **Z3-Datenüberlassung** | Z3 ist formelle Behörden-Auslieferung über Datenträger oder Datenaustauschplattform (Z3 V1.0 §1/§4). **Z1-/Z2 ≠ Z3.** |
| **Mandanten-Export** | Mandanten-Reporting / -Auswertung / -Print für mandanteninterne Zwecke (Z3 V1.0 §4). **Z1-/Z2 ≠ Mandanten-Export.** |
| **Migrations-Export** | Migration zwischen System-Generationen (Migration V1.0 §1). **Z1-/Z2 ≠ Migrations-Export.** |
| **DR-Backup / DR-Restore** | DR-/Wiederherstellungs-Mechanik (DR V1.0). **Z1-/Z2 ≠ DR-Backup; Z1-/Z2 ≠ DR-Restore.** |
| **Aufbewahrungs-/Retention-Archiv** | Aufbewahrung gemäß AO § 147 / HGB § 257 / GoBD (Retention V1.0). **Z1-/Z2 ≠ Aufbewahrungs-Archiv.** |
| **Lohn-DLS-Außenprüfung** | Lohnsteuer-Außenprüfung (Lohn-DLS-Folgeartefakt; außerhalb MVP). **Z1-/Z2 ≠ Lohn-DLS jenseits eines Negativ-Verweises.** |

## 11. Verhältnis zu Z3-/Datenüberlassung V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Z3-Datenüberlassung. Behörden-Auslieferungs-Boundary verbleibt strikt Z3 V1.0 (F3-D1). |
| **Vermischungs-Verbot** | V1.0 dieses Folgeartefakts vermischt Z1-/Z2 **nicht** mit Z3. Konkrete Z1-/Z2-Mechanik ist gemäß Register §3.10 ausdrücklich Non-Scope von F3-D1; spiegelnd ist Z3-Format/Behörden-Auslieferungs-Mechanik Non-Scope dieser V1.0. |
| **Pattern-Vorlage** | Z3 V1.0 §18 etabliert die kanonische Trennungs-Vorlage; V1.0 paraphrasiert sie spiegelnd. |
| **Vorrang-Regel** | Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. |

## 12. Verhältnis zu Migrations-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Migrations-Mechanik. Migrations-Boundary verbleibt strikt Migration V1.0 (F3-D3). |
| **Vermischungs-Verbot** | V1.0 dieses Folgeartefakts vermischt Z1-/Z2 **nicht** mit Migration. Migrations-Implementierung verbleibt Migration V1.0; Z1-/Z2-Mechanik verbleibt diesem Folgeartefakt (auf Boundary-Lock-Layer-Ebene). |
| **Pattern-Vorlage** | Migration V1.0 §21 etabliert die zweite kanonische Trennungs-Vorlage; V1.0 paraphrasiert sie spiegelnd. |
| **Vorrang-Regel** | Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries. |

## 13. Verhältnis zu Lohn-DLS-Folgeartefakt

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Lohn-DLS-Tiefe. Lohn-Tiefe gemäß EStG § 41 verbleibt Lohn-DLS-Folgeartefakt. |
| **Geteilter Marker D** | Z1-/Z2-Folgeartefakte und Lohn-DLS-Folgeartefakt sind im Register §6 Marker D als getrennte Bullet-Einträge enumeriert; sie sind eigenständige Folgeartefakte unter demselben Sortierungs-Marker. V1.0 hebt die Trennung **nicht** auf. |
| **Außerhalb MVP** | DLS Lohnsteuer-Außenprüfung ist gemäß Locked Decisions Register §3.10 sowie §6 Marker D **außerhalb MVP**. V1.0 trifft **keine** lohnspezifische Aussage jenseits dieses Negativ-Verweises. |
| **Vorrang-Regel** | Bei Konflikt mit dem Lohn-DLS-Folgeartefakt gilt jenes für Lohn-DLS-Tiefe. |

## 14. Verhältnis zu Aufbewahrungs-/Retention-Archiv V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Aufbewahrungs-/Retention-Archiv-Boundary. Aufbewahrungs-Boundary verbleibt strikt Retention V1.0. |
| **Lese-Topos** | Z1-/Z2-Datenzugriff kann sinngemäß auf aufbewahrungs-pflichtige Datenbestände lesend zugreifen, aber V1.0 trifft **keine** Aussage zur Aufbewahrungs-Mechanik. |
| **Vorrang-Regel** | Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Retention-Archiv-Boundaries. |

## 15. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Lösch-/Sperr-Boundary-Inhalt. Lösch-/Sperr-Boundary verbleibt strikt Lösch-/Sperrkonzept V1.0. |
| **Sperrgrund-Bezug** | Sperrgrund-Klassen (insbesondere „Sicherheits-/Forensik-Halt") können sinngemäß Z1-/Z2-Datenzugriffs-Operationen aussetzen; konkrete Aussetzungs-Mechanik verbleibt Lösch-/Sperrkonzept V1.0 + Cybersecurity-IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

## 16. Verhältnis zu Dokumentenkategorie-/Retention-Regelmatrix V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Klassifikations-Boundary. Klassifikation verbleibt strikt Regelmatrix V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Boundaries. |

## 17. Verhältnis zu Custody-Modell V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Custody-Topologie. Custody-Mechanik-Boundary verbleibt strikt Custody V1.0. |
| **Plaintext-Boundary** | Custody V1.0 §13 „Verbot einseitiger Plaintext-Macht über Restore-, Migrations- oder Z3-Pfade" gilt sinngemäß auch über Z1-/Z2-Pfade. V1.0 dieses Folgeartefakts spiegelt diese Disziplin. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 18. Verhältnis zu Security-/Krypto-/Key-Custody V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Sicherheits-/Plaintext-Boundary. Sicherheits-/Plaintext-Boundary verbleibt strikt Security V1.0. |
| **Plaintext-Verbot** | Plattform-Administration erlangt durch Z1-/Z2-Pfade **keinen** einseitigen Plaintext-Zugriff (Spiegelung Security V1.0 §10 + F0-D7). |
| **Vorrang-Regel** | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. |

## 19. Verhältnis zu KMS-/HSM-/Implementations-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Schlüsselverwaltungs-Topologie. Schlüssel-/HSM-/KMS-Implementations-Boundary verbleibt strikt KMS-/HSM V1.0. |
| **Schlüssel-Boundary** | Z1-/Z2-Pfade dürfen **keinen** Schlüssel-/Custody-Zugriff durch Auditor öffnen. |
| **Vorrang-Regel** | Bei Konflikt mit KMS-/HSM V1.0 gilt KMS-/HSM V1.0 für Schlüssel-/Implementations-Boundaries. |

## 20. Verhältnis zu ASVS-Control-Referenz V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ ASVS-Verifikation/-Mapping. ASVS-Profil-Boundary verbleibt strikt ASVS V1.0. |
| **Keine Verifikations-Behauptung** | V1.0 trifft **keine** ASVS-Verifikations-, ASVS-Mapping- oder ASVS-Konformitäts-Aussage zur Z1-/Z2-Mechanik. |
| **Vorrang-Regel** | Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Profil-Boundary. |

## 21. Verhältnis zu TR-02102-Detail V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Krypto-/Transport-Parameter-Wahl. Krypto-/Transport-Boundary verbleibt strikt TR-02102-Detail V1.0. |
| **Transport-Topos** | Verschlüsselungs-/Transport-Mechanik für Z1-Sitzungen oder Z2-Auswertungs-Übergabe verbleibt — soweit anwendbar — TR-02102-Detail V1.0; V1.0 dieses Folgeartefakts trifft **keine** Aussage zu konkreten Krypto-Parametern. |
| **Vorrang-Regel** | Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. |

## 22. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ DR-/HA-/BCM-Restore-Mechanik. Restore-Mechanik verbleibt strikt DR V1.0. |
| **Restore-Auswirkung** | Eine DR-Restore-Operation kann Z1-/Z2-Datenzugriffs-Sitzungen sinngemäß unterbrechen oder neu autorisieren; konkrete Mechanik verbleibt DR V1.0 + Cybersecurity-IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit DR V1.0 gilt DR V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 23. Verhältnis zu Cybersecurity-Incident-Response V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Cybersecurity-IR-Workflow. IR-Workflow-Boundary verbleibt strikt IR V1.0. |
| **Sperrgrund-„Sicherheits-/Forensik-Halt"** | IR V1.0 §10/§13 etabliert die Sperrgrund-Klasse „Sicherheits-/Forensik-Halt"; während eines aktiven Halts können Z1-/Z2-Datenzugriffs-Operationen sinngemäß ausgesetzt werden. Konkrete Aussetzungs-Mechanik verbleibt IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit IR V1.0 gilt IR V1.0 für IR-Workflow-Boundaries. |

## 24. Verhältnis zu DSGVO-/Datenpannen V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z1-/Z2-Datenzugriff ≠ Datenschutz-Vorfallsprozess. DSGVO-Boundary verbleibt strikt DSGVO V1.0. |
| **DSGVO Art. 32-Topos** | Auditor-Zugriff auf personenbezogene Daten in Z1-/Z2-Pfaden berührt sinngemäß die in DSGVO Art. 32 angelegte Zugriffsbeschränkungs-Topik. V1.0 dieses Folgeartefakts trifft **keine** Auslegung der Art.-32-Anforderungen im Einzelfall. |
| **Vorrang-Regel** | Bei Konflikt mit DSGVO V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

## 25. Verhältnis zu Verfahrensdokumentations-Pflege-Pass V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | V1.0 dieses Folgeartefakts liefert (sobald gesperrt) einen Pflege-Eingang Kap. 5 (Berechtigungs-/Zugriffsschutz-Topiken) für die existierende Verfahrensdokumentations-STUB-Schicht — auf reiner Verweis-Ebene; **kein** Endfassungs-Text. |
| **Existierende STUB-Dateien unverändert** | V1.0 editiert keine der zehn existierenden Verfahrensdokumentations-Dateien. |
| **Vorrang-Regel** | Bei Konflikt mit Verfahrensdoku V1.0 bleibt jene als Pflege-Layer-Boundary autoritativ. |

## 26. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Wechselwirkung zwischen Crypto-Shredding und Z1-/Z2-Datenzugriffs-Topiken. |
| **Open-Question-Datei unverändert** | V1.0 ändert die Open-Question-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 27. Verhältnis zu Hash-Chain-vs.-Erasure

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/HASH-CHAIN-VS-ERASURE.md` (Schnittpunkt zur Schlüssel-Wiederherstellungs-/Schlüsselvernichtungs-Topik; in Verfahrensdoku V1.0 §23 als Open-Question verankert). |
| **Keine Endfassungs-Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor und wählt **keine** Option. |
| **Open-Question-Datei unverändert** | V1.0 ändert die Hash-Chain-vs.-Erasure-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung bleibt vor produktiver Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 28. Verhältnis zu §28.11-bet

| Aspekt | Aussage |
|---|---|
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Keine Wechselwirkungs-Aussage** | V1.0 trifft **keine** Aussage zur Wechselwirkung zwischen §28.11-bet und der Z1-/Z2-Boundary. |
| **Externe Klärung** | Eine etwaige Klärung des §28.11-bet-Status bleibt außerhalb dieses Folgeartefakts. |

## 29. STOP-Bedingungen

V1.0 dieses Folgeartefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 29.1 | V1.0 dieses Folgeartefakts importiert externen AO-/GoBD-/IDW-/AWV-/Kammer-/BSI-/ISO-Volltext oder erhebt eine externe Quelle (insbesondere AO § 147 Abs. 6-Volltext, GoBD-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001, ISO 27018) zur Lock-Quelle. |
| 29.2 | V1.0 dieses Folgeartefakts erstellt eine konkrete Z1-Mechanik (Auditor-Account-Konfiguration, Read-Only-Rollen-Implementierung, Sitzungs-Verwaltung, Sitzungs-Limits, IP-Restriction, Auto-Logout-Zeiten). |
| 29.3 | V1.0 dieses Folgeartefakts erstellt eine konkrete Z2-Mechanik (Berichts-Definitions-Schema, Query-Mechanik, Auswertungs-Logik, Beleg-Übergabe-Workflow, Auditor-Anfrage-Eingang). |
| 29.4 | V1.0 dieses Folgeartefakts enthält Datenbank-/Dateisystem-Schema, Daten-Wörterbücher, Programmcode, Pseudocode, Algorithmus-Design, SQL und Query-Spezifikation, UI/UX, APIs, automatische Jobs, Test-Cases oder CI/CD-Konfiguration. |
| 29.5 | V1.0 dieses Folgeartefakts wählt Werkzeuge, Anbieter, Cloud-Provider, Plattformen, Bibliotheken, Hardware, Storage-Lösungen, Auth-Provider, RLS-Provider oder Tool-Konfigurationen. |
| 29.6 | V1.0 dieses Folgeartefakts legt konkrete Berechtigungs-/Rollen-Tabellen, konkrete Rechte-Matrix, konkrete RLS-Konfiguration, konkrete Audit-Schema-Felder, konkrete Sitzungs-Lebensdauern, Auto-Logout-Zeiten, IP-Whitelist-Werte oder Eskalations-Trigger-Werte fest. |
| 29.7 | V1.0 dieses Folgeartefakts legt Berichts-/Auswertungs-Schemata, konkrete Berichts-Vorlagen, Datei-Format-Wahl, Übergabe-Plattform-Wahl oder Beleg-Übergabe-Format fest. |
| 29.8 | V1.0 dieses Folgeartefakts trifft eine Verschlüsselungs-/Transport-Aussage oder eine Schlüssel-/Custody-Aussage jenseits eines Topos-Verweises auf TR-02102-Detail V1.0, Security V1.0 und Custody V1.0. |
| 29.9 | V1.0 dieses Folgeartefakts vermischt Z1-/Z2-Boundary mit Z3 V1.0 (verletzt Z3 V1.0 §18 + Register §3.10 Boundaries). |
| 29.10 | V1.0 dieses Folgeartefakts vermischt Z1-/Z2-Boundary mit Migration V1.0 (verletzt Migration V1.0 §21). |
| 29.11 | V1.0 dieses Folgeartefakts vermischt Z1-/Z2-Boundary mit Lohn-DLS jenseits eines reinen Negativ-Verweises (außerhalb MVP gemäß Register §3.10/§6 Marker D). |
| 29.12 | V1.0 dieses Folgeartefakts verschmilzt Z1-/Z2-Boundary mit DR-/HA-/BCM V1.0, Aufbewahrungs-/Retention-Archiv V1.0, Custody-Modell V1.0, Security V1.0, ASVS V1.0, TR-02102-Detail V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, KMS-/HSM-/Implementations-Folgeartefakt V1.0 oder Verfahrensdokumentations-Pflege-Pass V1.0. |
| 29.13 | V1.0 dieses Folgeartefakts erstellt eine Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz- oder produktive Freigabe-Behauptung. |
| 29.14 | V1.0 dieses Folgeartefakts erstellt eine Productive-Readiness-Behauptung („Z1-ready", „Z2-ready", „audit-proof", „prüfungsfest") oder eine Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen oder Kammern. |
| 29.15 | V1.0 dieses Folgeartefakts schwächt F0-D4 (Festschreibung) durch Erlauben eines Auditor-Schreibzugriffs über Z1-/Z2-Pfade. |
| 29.16 | V1.0 dieses Folgeartefakts schwächt F0-D6 (Mandantentrennung) durch Erlauben eines Cross-Mandanten-Zugriffs über Z1-/Z2-Pfade. |
| 29.17 | V1.0 dieses Folgeartefakts schwächt F0-D7 (Plattform-Admin-Grenze) durch Öffnen eines Plaintext-Beschaffungs-Pfads über Z1-/Z2-Mechanik. |
| 29.18 | V1.0 dieses Folgeartefakts erzeugt USt-Werte über Z1-/Z2-Datenzugriff (verletzt F1-D1/F1-D2). |
| 29.19 | V1.0 dieses Folgeartefakts schwächt F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 29.20 | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei (insbesondere `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`, `docs/HASH-CHAIN-VS-ERASURE.md`). |
| 29.21 | V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet. |
| 29.22 | V1.0 dieses Folgeartefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 29.23 | V1.0 dieses Folgeartefakts nimmt eine rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor oder wählt eine Option. |
| 29.24 | V1.0 dieses Folgeartefakts erstellt oder finalisiert Inhalte für Verfahrensdokumentation Kap. 1, Kap. 2, Kap. 3, Kap. 4, Kap. 5, Kap. 6, Kap. 7 oder Kap. 8. |
| 29.25 | V1.0 dieses Folgeartefakts editiert existierende V1.0-Specs, Verfahrensdokumentations-STUB-Dateien (`docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/**`), App-Code-Layer (`src/**`) oder Demo-Pakete (`demo-package/**`). |
| 29.26 | V1.0 dieses Folgeartefakts modifiziert package-/config-/script-/test-/baseline-Dateien oder führt SQL/Migrationen aus. |
| 29.27 | V1.0 dieses Folgeartefakts spaltet Z1 und Z2 in zwei separate Dateien, ohne dass eine substantielle Boundary-Lock-Layer-Trennung zwischen ihnen besteht (Pattern-Konsistenz; Begründung in §3 verankert). |
| 29.28 | V1.0 dieses Folgeartefakts behauptet, die externe steuerprüfungs-fachliche Validierung, die externe DSB-Validierung oder die externe Sicherheits-/Produktivfreigabe vor produktiver Anwendung erübrigen zu können. |
| 29.29 | V1.0 dieses Folgeartefakts erteilt Rechtsauskunft, Steuerauskunft, sicherheitsfachliche Einzelfall-Entscheidung, DSB-Freigabe, Sicherheitsfreigabe oder Produktivfreigabe. |
| 29.30 | Die Forbidden-Reference-Gate-Baseline (BLOCKED, BASELINE_ALLOWED, ALLOW_MARKED) ändert sich durch Aufnahme dieser V1.0 in den Repository-Stand. |
| 29.31 | V1.0 dieses Folgeartefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 29.32 | V1.0 dieses Folgeartefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz-, Auditor-Akzeptanz- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |

## 30. Wahrung gesperrter Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; Z1-/Z2-Datenzugriff hebt Festschreibung **nicht** auf. **Kein** Auditor-Schreibzugriff über Z1-/Z2. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Zugriff durch Auditor über Z1-/Z2. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; **kein** einseitiger Plaintext-Zugriff durch Plattform-Administration über Z1-/Z2. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Z1-/Z2-Datenzugriff erzeugt **keine** USt-Werte. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ; Z1-/Z2 ≠ Z3-Mechanik. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ. |
| **F3-D3 Migrations-Spezifikation** | Bleibt autoritativ; Z1-/Z2 ≠ Migrations-Mechanik. |
| **F3-Closing** | Bleibt autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt ≠ Z1-/Z2-Datenzugriffe-Folgeartefakt. |
| **§28.11-bet** | Bleibt unverändert/offen. |

## 31. Explicit Non-Scope

- Konkrete Z1-Mechanik (Auditor-Account-Konfiguration, Read-Only-Rolle-Implementierung, Sitzungs-Verwaltung, Sitzungs-Limits, IP-Restriction, Auto-Logout-Zeiten).
- Konkrete Z2-Mechanik (Berichts-Definitions-Schema, Query-Mechanik, Auswertungs-Logik, Beleg-Übergabe-Workflow, Auditor-Anfrage-Eingang).
- Datenbank-/Dateisystem-Schema; Daten-Wörterbücher; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration.
- Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-/RLS-Provider-Wahl.
- Konkrete Berechtigungs-/Rollen-Tabellen; konkrete Rechte-Matrix; konkrete RLS-Konfiguration.
- Konkrete Audit-Schema-Felder; konkrete Audit-Log-Struktur; konkrete Audit-Aufbewahrungsdauern.
- Konkrete Sitzungs-Lebensdauern, Auto-Logout-Zeiten, IP-Whitelist-Werte, Eskalations-Trigger-Werte.
- Berichts-/Auswertungs-Schemata; konkrete Berichts-Vorlagen; Datei-Format-Wahl; Übergabe-Plattform-Wahl; Beleg-Übergabe-Format.
- Verschlüsselungs-/Transport-Mechanik (verbleibt TR-02102-Detail V1.0 + Security V1.0).
- Schlüssel-/Custody-Mechanik (verbleibt Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt V1.0).
- Z3-Format / Behörden-Auslieferungs-Mechanik (verbleibt Z3 V1.0).
- Migrations-Mechanik (verbleibt Migration V1.0).
- DR-/HA-/BCM-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0).
- Cybersecurity-IR-Workflow / Forensik-Werkzeug-Wahl (verbleibt IR V1.0).
- Datenschutz-Vorfallsprozess / Breach-Notification-Inhalte (verbleibt DSGVO-/Datenpannen V1.0).
- Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0).
- Klassifikation (verbleibt Regelmatrix V1.0).
- Aufbewahrungs-/Retention-Archiv-Boundary (verbleibt Retention V1.0).
- ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0).
- Lohn-DLS-Tiefe (verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP) jenseits eines reinen Negativ-Verweises.
- Endfassung Verfahrensdokumentation Kap. 1–8.
- Edits an existierenden V1.0-Specs, Verfahrensdoku-STUB-Dateien, App-Code-Layer (`src/**`) oder Demo-Paketen (`demo-package/**`).
- Externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere AO § 147 Abs. 6-Volltext, GoBD-Volltext, IDW PS 880, AWV-Muster, Kammer-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001, ISO 27018).
- Externe-Norm-Volltext-Aufnahme.
- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-Behauptungen jeglicher Art.
- Productive-Readiness-Behauptungen jeglicher Art.
- Garantie-Aussagen gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen, Kammern oder externen Validierungs-Stellen.
- Rechtsgutachten; Steuerauskunft; rechtliche/sicherheitsfachliche Einzelfall-Entscheidung.
- DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Marketing-Aussagen.
- Rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question; Status 🔴).
- Rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt Open-Question).
- Änderung oder Reinterpretation von §28.11-bet.
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 32. Wortwahl-Disziplin

V1.0 dieses Folgeartefakts hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-, Garantie- oder Freigabe-Behauptungen sind ausgeschlossen — auch nicht in Beispielform innerhalb dieser V1.0.
- Aussagen über externe Norm-Konformität (insbesondere gegenüber AO-, GoBD-, IDW-, AWV-, Kammer-, BSI-, ISO-Quellen) sind ausgeschlossen; externe Normen erscheinen ausschließlich als Negativ-Hinweis und nicht als Lock-Quelle.
- Productive-Readiness-Sprache („Z1-ready", „Z2-ready", „audit-proof", „prüfungsfest", „live-ready", „validated", „certified", „compliant") ist ausgeschlossen.
- Marketing-/Reife-/Vendor-/Cloud-Marketing-Sprache ist ausgeschlossen.
- Read-Only-Garantie-Sprache („lückenlos read-only", „Schreibzugriff garantiert ausgeschlossen", „unveränderbare Audit-Spur") ist ausgeschlossen.
- Auditor-Akzeptanz-Sprache („behördlich akzeptierter Datenzugriff", „prüfungsfeste Z1-/Z2-Mechanik") ist ausgeschlossen.
- Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen, die wie eine Auslegung wirken könnten, sind ausgeschlossen.
- Aussagen, die Crypto-Shredding rechtlich werten oder die Hash-Chain-vs.-Erasure-Option vorwegnehmen, sind ausgeschlossen.
- Inhalte in arabischer Schrift sind ausgeschlossen; UTF-8-BOM ist ausgeschlossen.
- STOP-Klauseln formulieren generisch und wiederholen sensible Beispiele **nicht** wörtlich.

## 33. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **Z1-Detail-Folgeartefakt** | Detail-Mechanik jenseits Boundary-Lock-Layer für unmittelbaren/direkten Datenzugriff (Auditor-Account-Konfiguration, Read-Only-Rolle-Implementierung, Sitzungs-Verwaltung, IP-Restriction, Audit-Schema-Felder) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Z2-Detail-Folgeartefakt** | Detail-Mechanik jenseits Boundary-Lock-Layer für mittelbaren/indirekten Datenzugriff (Berichts-Definitions-Schema, Query-Mechanik, Auswertungs-Logik, Beleg-Übergabe-Workflow) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Externe steuerprüfungs-fachliche Validierung** | Externer Validierungs-Schritt durch StB- / WP- / FA-Prüfungs-Beratung vor produktiver bzw. behördlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Externe DSB-Validierung** | Externer DSB-Validierungs-Schritt insbesondere für Z2-Auswertungen mit personenbezogenen Daten (DSGVO Art. 32 Topos-Bezug) | erforderlich vor produktiver bzw. rechtsverbindlicher Anwendung; **Non-Scope** dieser V1.0 |
| **Sicherheits-/Produktivfreigabe** | Externer Freigabe-Schritt (Auditor-Lese-Zugriff erfordert technische Schutzmaßnahmen jenseits Boundary-Lock-Layer) | erforderlich; **Non-Scope** dieser V1.0 |
| **Verfahrensdokumentation Kap. 5 Pflege** | Pflege-Eingang (Berechtigungs-/Zugriffsschutz-Topiken) | offen; **Non-Scope** dieser V1.0 |
| **Verfahrensdokumentation Kap. 7 Pflege** | Pflege-Eingang (Prüfpfade/Protokollierung-Topiken; Audit-Spur-Bezug) | offen; **Non-Scope** dieser V1.0 |
| **Lohn-DLS-Folgeartefakt** | Marker D, geteilt mit Z1-/Z2; außerhalb MVP | offen; nicht Bestandteil von V1.0 |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Hash-Chain-vs.-Erasure-Open-Question** | Open-Question | offen; **keine** Würdigung in V1.0 |
| **KMS-/HSM-Detail-Implementations-Folgeartefakte** | Implementations jenseits KMS-/HSM-V1.0-Boundary | offen; nicht Bestandteil von V1.0 |

V1.0 dieses Folgeartefakts erzeugt **keine** Implementierung, **keine** Konfiguration, **keinen** Mechanismus, **keine** Modell-Wahl und **keine** Vendor-/Cloud-/Hardware-Wahl.

## 34. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene; intern accepted; **keine** Implementations-Endfassung; **keine** produktive Freigabe |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Behörden-Akzeptanz-/Auditor-Akzeptanz-/Kammer-Akzeptanz-Behauptung; **keine** externe Konformitäts-/Zertifizierungs-/Audit-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen oder Kammern |
| **STOP-Bedingungen** | 32 Klauseln (§29.1 — §29.32) |
| **Bindend für** | Alle in Abschnitt 33 genannten Detail-Folgeartefakte; Verfahrensdokumentation Kap. 5 und Kap. 7 (im Rahmen ihrer jeweils nächsten Pflege außerhalb dieser V1.0) hinsichtlich der Trennlinien dieses Artefakts; alle nachgelagerten Detail-Artefakte zu Z1-/Z2-Datenzugriff. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen Z3 V1.0, Migration V1.0, Lohn-DLS-Folgeartefakt, Aufbewahrungs-/Retention-Archiv V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Custody-Modell V1.0, Security V1.0, ASVS V1.0, TR-02102-Detail V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, DSGVO-/Datenpannen V1.0, KMS-/HSM-/Implementations-Folgeartefakt V1.0, Verfahrensdokumentations-Pflege-Pass V1.0 sowie die Crypto-Shredding-Rechtsfrage und die Hash-Chain-vs.-Erasure-Open-Question. |
| **Nicht bindend für** | Konkrete Z1-/Z2-Mechanik. Auditor-Account-Konfiguration. Read-Only-Rolle-Implementierung. Sitzungs-Verwaltung. IP-Restrictions. Auto-Logout-Zeiten. Berichts-Definitions-Schema. Query-Mechanik. Auswertungs-Logik. Beleg-Übergabe-Workflow. Datenmodell/Schema. UI/UX. Programmcode. Pseudocode. Algorithmus-Design. SQL. APIs. Automatische Jobs. Test-Cases. CI/CD-Konfiguration. Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-Provider-/RLS-Provider-Wahl. Konkrete Berechtigungs-/Rollen-Tabellen oder Rechte-Matrix. Konkrete Audit-Schema-Felder. Z3-Format. Migrations-Mechanik. DR-Restore-Mechanik. IR-Workflow. Datenschutz-Vorfallsprozess. Lösch-/Sperr-Boundary-Inhalt. Klassifikation. Aufbewahrungs-/Retention-Archiv-Boundary. ASVS-Verifikation/-Mapping. Konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter / Schlüssellängen. Konkrete Custody-Topologie / Schlüsselhierarchie / KMS-/HSM-Modellwahl. Lohn-Tiefe. Rechtliche Würdigung von Crypto-Shredding. Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question. Endfassung Verfahrensdokumentation Kap. 1–8. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | Z1-/Z2-Datenzugriff ≠ Z3-/Datenüberlassung. Z1-/Z2-Datenzugriff ≠ Migration. Z1-/Z2-Datenzugriff ≠ Lohn-DLS jenseits eines Negativ-Verweises. Z1-/Z2-Datenzugriff ≠ Aufbewahrungs-/Retention-Archiv. Z1-/Z2-Datenzugriff ≠ Lösch-/Sperr-Boundary-Inhalt. Z1-/Z2-Datenzugriff ≠ Klassifikation. Z1-/Z2-Datenzugriff ≠ Custody-Topologie. Z1-/Z2-Datenzugriff ≠ Sicherheits-/Plaintext-Boundary. Z1-/Z2-Datenzugriff ≠ Krypto-/Transport-Parameter-Wahl. Z1-/Z2-Datenzugriff ≠ ASVS-Verifikation. Z1-/Z2-Datenzugriff ≠ DR-/HA-/BCM-Restore-Mechanik. Z1-/Z2-Datenzugriff ≠ Cybersecurity-IR-Workflow. Z1-/Z2-Datenzugriff ≠ Datenschutz-Vorfallsprozess. Z1-/Z2-Datenzugriff ≠ KMS-/HSM-Topologie. Z1-/Z2-Datenzugriff ≠ Verfahrensdokumentations-Endfassung. Z1-/Z2-Datenzugriff ≠ Crypto-Shredding-Rechtswürdigung. Z1-/Z2-Datenzugriff ≠ Hash-Chain-vs.-Erasure-Endfassungs-Würdigung. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass ≠ KMS-/HSM-/Implementations-Folgeartefakt ≠ Z1-/Z2-Datenzugriffe-Folgeartefakt (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Zugriff. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; **kein** einseitiger Plaintext-Zugriff. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §6 Marker D oder §3.10 Boundaries gilt der Register. Bei Konflikt mit Z3 V1.0, Migration V1.0, Security V1.0, Custody V1.0, KMS-/HSM-/Implementations-Folgeartefakt V1.0, TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, IR V1.0, DSGVO V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Retention V1.0 oder Verfahrensdoku V1.0 gilt jeweils diese Quelle für ihre Boundary-Domäne. Bei Konflikt mit Crypto-Shredding-Open-Question oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |
| **Verankerungs-Hinweis** | Das Z1-/Z2-Datenzugriffe-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker D** verankert (Eintrag: „Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3"). Sortierungsmarker D ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Lohn-DLS-Folgeartefakt geteilt; beide sind als getrennte, eigenständige Folgeartefakte enumeriert. V1.0 paraphrasiert Marker D ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert weder Register §6 noch Register §3.10 Boundaries. |
| **Externe Validierung** | Vor produktiver bzw. behördlicher Anwendung sind eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe erforderlich. Alle drei sind **Non-Scope** von V1.0. |

## 35. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **nicht** Implementations-Endfassung; **nicht** Bestandteil eines externen Audit-, Zertifizierungs-, Behörden-Akzeptanz-, Auditor-Akzeptanz- oder Kammer-Akzeptanz-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Combined-V1.0 für Z1 und Z2 als Datenzugriffsarten neben Z3 (analog Trio-Pattern `dr-ha-bcm-v1.md`); kanonische Trennungs-Pattern-Vorlage aus Z3 V1.0 §18 + Migration V1.0 §21 wörtlich paraphrasiert; Spiegelung F0-D4-/F0-D6-/F0-D7-/F1-D1/F1-D2-Disziplinen in Z1-/Z2-Pfade; Plaintext-Boundary-Spiegelung gegenüber Custody V1.0 §13 + Security V1.0 §10 verankert; Read-Only-Topos und Audit-Spur-Topos auf reiner Boundary-Ebene; ausdrückliche Aufnahme von AO § 147 Abs. 6-Volltext, GoBD-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001, ISO 27018 in die Negativ-Quellgrundlage; Differential-Topiken Z1 (direkt) vs. Z2 (indirekt) auf Boundary-Topos-Ebene; Crypto-Shredding-Rechtsfrage und Hash-Chain-vs.-Erasure-Open-Question als ausdrückliche Open-Question-Verweise ohne Würdigung verankert; Schärfung der Anti-Konformitäts-/Anti-Zertifizierungs-/Anti-Audit-/Anti-Behörden-Akzeptanz-/Anti-Auditor-Akzeptanz-/Anti-Garantie-/Anti-Productive-Readiness-Wortwahl; in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; Detail-Folgeartefakte (Z1-Detail, Z2-Detail) werden eigenständig versioniert. Eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe bleiben vor produktiver Anwendung erforderlich. |
