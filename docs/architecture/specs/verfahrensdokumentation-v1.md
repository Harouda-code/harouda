# Verfahrensdokumentations-Pflege-Pass V1.0

**Lock-Aussage:** Verfahrensdokumentations-Pflege-Pass V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im *Harouda Locked Decisions Register V1.0* §6 Sortierungsmarker B („Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation") angelegte Pflege-Boundary für die im Repository bereits angelegte Verfahrensdokumentations-STUB-Schicht (`docs/verfahrensdokumentation.md` und `docs/verfahrensdokumentation/01–08-*.md` — alle eigene Selbstdeklaration „Status: STUB \| Version: 0.1"). V1.0 ist **keine** Verfahrensdokumentations-Endfassung; V1.0 ist **keine** Finalisierung der Kap. 1–8; V1.0 lässt die existierenden STUB-Dateien **unberührt**. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz- oder Auditor-Akzeptanz-Aussage gegenüber externen Normen oder Prüfungs-Standards. V1.0 autorisiert **keine** Implementierung, **keine** Schema-/UI-/API-/Code-/SQL-/Test-/CI-CD-Aussage und **keine** Werkzeug-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-Wahl. V1.0 trifft **keine** rechtliche Würdigung von Crypto-Shredding und **keine** rechtliche/technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question; beide bleiben offen. §28.11-bet bleibt unverändert/offen. Eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe bleiben vor produktiver bzw. produktiver Verfahrensdokumentations-Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Verfahrensdokumentations-Endfassung; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz- oder Auditor-Akzeptanz-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen oder Kammern |
| Scope | Boundary-Aussagen zu: Marker-B-Operationalisierung auf Boundary-Lock-Layer-Ebene; Pflege-Boundary für die existierende Verfahrensdokumentations-STUB-Schicht; Inventar-Verweis auf die zehn existierenden Verfahrensdoku-Dateien; Pflege-Eingangs-Matrix der zwölf V1.0-Boundary-Lock-Layer-Specs gegenüber Kap. 5 (Datensicherheit/Datenschutz) und Kap. 6 (Aufbewahrung/Lösch); Trennlinien gegenüber Endfassung Kap. 1–8; Negativ-Quellgrundlage gegenüber externen Normen/Zertifizierungen; Open-Question-Verweise auf Crypto-Shredding und Hash-Chain-vs.-Erasure ohne Würdigung; Cross-Boundary-Konsistenz mit allen 12 gesperrten V1.0-Specs und gesperrten Harouda-Locks |
| Non-Scope | Endfassung Kap. 1–8 der Verfahrensdokumentation; Inhalts-Pflege der existierenden Verfahrensdoku-STUB-Dateien; Edit von `docs/verfahrensdokumentation.md` oder `docs/verfahrensdokumentation/*.md`; Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-, Standard-Konformitäts-Behauptungen jeglicher Art; Externe-Norm-Volltext-Aufnahme; Implementierung; Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration; Speichertechnologie; Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-/Berechtigungs-/RLS-Provider-Wahl; rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question); rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt Open-Question); Endfassungs-Inhalte der zwölf V1.0-Vorgänger-Specs (verbleiben jeweils dort); externe Normen / Zertifizierungs-Pfade als Lock-Quelle (insbesondere ISO 22301, ISO 27001/27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-02102, BSI TR-03116, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards); GoBD-/AO-/HGB-/DSGVO-Volltext-Aufnahme; Garantie-Aussagen jeglicher Art; Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register V1.0 §6 Sortierungsmarker B („Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation"); alle 12 gesperrten V1.0-Boundary-Lock-Layer-Specs (Verfahrensdoku-Pflege-Anker durchgängig § 17 / § 22 / § 28); existierende Verfahrensdokumentations-STUB-Schicht (`docs/verfahrensdokumentation.md`; `docs/verfahrensdokumentation/README.md`; `docs/verfahrensdokumentation/01-allgemeine-beschreibung.md`; `docs/verfahrensdokumentation/02-anwenderdokumentation.md`; `docs/verfahrensdokumentation/03-technische-systemdokumentation.md`; `docs/verfahrensdokumentation/04-betriebsdokumentation.md`; `docs/verfahrensdokumentation/05-datensicherheits-und-datenschutzkonzept.md`; `docs/verfahrensdokumentation/06-aufbewahrungs-und-loeschkonzept.md`; `docs/verfahrensdokumentation/07-pruefpfade-und-protokollierung.md`; `docs/verfahrensdokumentation/08-internes-kontrollsystem.md`); Open-Question-Verweis `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴); Open-Question-Verweis `docs/HASH-CHAIN-VS-ERASURE.md`; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §6 Marker B gilt der Register als autoritative Quelle; V1.0 paraphrasiert Marker B ausschließlich auf Boundary-Lock-Layer-Ebene und ändert den Register **nicht**. Bei Konflikt mit einer der 12 gesperrten V1.0-Specs gilt die jeweilige V1.0-Spec für ihre Boundary-Domäne; V1.0 dieses Folgeartefakts darf keine Inhalte aus jenen Specs reinterpretieren. Bei Konflikt mit existierenden Verfahrensdoku-STUB-Dateien werden diese Dateien **nicht** verändert; ihre Pflege bleibt der zukünftigen Pflege außerhalb dieser V1.0 vorbehalten. Bei Konflikt mit Crypto-Shredding- oder Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen; V1.0 nimmt **keine** Würdigung vor. |

**Wichtiger Hinweis zur Verankerung:** Das Verfahrensdokumentations-Pflege-Pass-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* §6 (Open Folgeartefakte) als **Sortierungsmarker B** enumeriert (Eintrag: „Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation"). Sortierungsmarker B ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Architektur-/HA-/BCM-Artefakt geteilt. V1.0 dieses Folgeartefakts paraphrasiert Marker B ausschließlich auf Boundary-Lock-Layer-Ebene, modifiziert den Register **nicht** und ist **keine** GoBD-Verfahrensdokumentations-Endfassung.

## 2. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §6 Sortierungsmarker B | „Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation" | **Direkte Verankerungs-Quelle** (geteilt mit Architektur-/HA-/BCM-Artefakt) |
| Existierende Verfahrensdokumentations-STUB-Schicht | zehn Dateien (Top-Level + README + Kap. 01–08), eigene Selbstdeklaration „Status: STUB \| Version: 0.1" | Inventar-Anker; **keine** Edit-Berührung |
| Aufbewahrungs-/Retention-Archiv V1.0 | §17 Downstream-Verweis auf Verfahrensdokumentation Kap. 6 | Pflege-Eingang Kap. 6 |
| Security-/Krypto-/Key-Custody V1.0 | §17 Downstream-Verweis auf Verfahrensdokumentation Kap. 5 | Pflege-Eingang Kap. 5 |
| Lösch-/Sperrkonzept V1.0 | §14 Downstream-Verweis auf Verfahrensdokumentation Kap. 6 | Pflege-Eingang Kap. 6 |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | §16 Downstream-Verweis auf Verfahrensdokumentation Kap. 6 | Pflege-Eingang Kap. 6 |
| Custody-Modell V1.0 | §15 Downstream-Verweis auf Verfahrensdokumentation Kap. 5 | Pflege-Eingang Kap. 5 |
| ASVS-Control-Referenz V1.0 | §14 Downstream-Verweis auf Verfahrensdokumentation Kap. 5 | Pflege-Eingang Kap. 5 |
| TR-02102-Detail V1.0 | §18 Downstream-Verweis auf Verfahrensdokumentation Kap. 5 | Pflege-Eingang Kap. 5 |
| DR-/HA-/BCM V1.0 | §17/§20 Downstream-Verweise auf Verfahrensdokumentation Kap. 5 + Kap. 6 | Pflege-Eingang Kap. 5 + Kap. 6 |
| Cybersecurity-IR V1.0 | §17/§22 Downstream-Verweise auf Verfahrensdokumentation Kap. 5 + Kap. 6 | Pflege-Eingang Kap. 5 + Kap. 6 |
| DSGVO-/Datenpannen V1.0 | §22/§23 Downstream-Verweise auf Verfahrensdokumentation Kap. 5 + Kap. 6 | Pflege-Eingang Kap. 5 + Kap. 6 |
| Z3-/Datenüberlassung V1.0 | §22/§25 Downstream-Verweise auf Verfahrensdokumentation Kap. 5 + Kap. 6 | Pflege-Eingang Kap. 5 + Kap. 6 |
| Migrations-Folgeartefakt V1.0 | §28 Downstream-Verweise auf Verfahrensdokumentation Kap. 5 + Kap. 6 | Pflege-Eingang Kap. 5 + Kap. 6 |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker) | Nur Verweis; **keine** Würdigung |
| Open-Question „Hash-Chain-vs.-Erasure-Entscheidung" | `docs/HASH-CHAIN-VS-ERASURE.md` (von Kap. 5 §5.4/§5.5 und Kap. 6 §6.3 ausdrücklich als Abhängigkeit benannt) | Nur Verweis; **keine** Würdigung |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks |

Ausdrücklich **keine** externen Lock-Quellen: ISO 22301, ISO 27001/27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-02102, BSI TR-03116, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards sowie GoBD-/AO-/HGB-/DSGVO-Volltext sind **nicht** Lock-Quelle dieses Artefakts. Bezugnahmen auf Norm-Topiken erfolgen ausschließlich auf Topos-Verweis-Ebene über die zwölf V1.0-Vorgänger-Specs.

## 3. Core Boundaries

Die folgenden Aussagen sind Boundary-Statements; sie sind **keine** Verfahrensdokumentations-Endfassung, **keine** Konformitäts-Behauptung und **keine** rechtliche oder steuerliche Auslegung im Einzelfall.

| Boundary | Aussage |
|---|---|
| **Topos-Charakter** | Marker B ist im Locked Decisions Register §6 als nicht-bindender Priorisierungs-Vorschlag enumeriert; V1.0 dieses Folgeartefakts paraphrasiert Marker B ausschließlich auf Boundary-Lock-Layer-Ebene und trifft **keine** neue Entscheidung. |
| **Pflege-Layer ≠ Endfassung** | V1.0 ist Pflege-Direction-Boundary-Lock; sie ersetzt **nicht** die Endfassung Kap. 1–8 und finalisiert **keine** Inhalte. |
| **Existierende STUB-Schicht unverändert** | V1.0 berührt die existierenden zehn Verfahrensdoku-Dateien **nicht** und löscht **keinen** TODO-Marker. |
| **Pflege-Eingangs-Boundary** | Die zwölf V1.0-Boundary-Lock-Layer-Specs liefern **Pflege-Eingänge** (Topos-Verweise) für Kap. 5 und Kap. 6; konkrete Endfassungs-Texte verbleiben künftiger Pflege außerhalb dieser V1.0 vorbehalten. |
| **Negativ-Boundary-Disziplin** | V1.0 ist negativ formuliert: sie legt fest, was Pflege **nicht** ist und welche Inhalte explizit Non-Scope sind. |
| **F0-D4 Festschreibung** | Bleibt unberührt; Verfahrensdokumentation hebt Festschreibung **nicht** auf. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Verfahrensdokumentations-Pflege. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; Verfahrensdokumentations-Pflege erlangt durch sich selbst **keine** Schlüssel-/Plaintext-/Mandantendaten-Einsicht. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Verfahrensdokumentations-Pflege erzeugt **keine** USt-Werte. |
| **F3-D1 / F3-D2 / F3-D3 / F3-Closing** | Bleiben autoritativ; V1.0 dieses Folgeartefakts schwächt **keinen** F3-Lock. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |

## 4. Existing Verfahrensdokumentation Inventory

Bestandsaufnahme der zum Zeitpunkt von V1.0 im Repository vorhandenen Verfahrensdoku-Dateien. **V1.0 dieses Folgeartefakts editiert keine dieser Dateien.**

| Pfad | Kapitel / Rolle | Beobachteter Status (eigene Selbstdeklaration) | Edit durch V1.0? | Pflege-Richtung (zukünftig, jenseits V1.0) |
|---|---|---|---|---|
| `docs/verfahrensdokumentation.md` | älteres Single-File-Template | „Vorlage", Stand-Platzhalter, Version 1.0 | **NEIN** | nicht jetzt; ggf. zukünftige Konsolidierungs-Entscheidung außerhalb dieser V1.0 |
| `docs/verfahrensdokumentation/README.md` | Strukturgerüst-Index | „Status: STUB \| Version: 0.1" | **NEIN** | nicht jetzt |
| `docs/verfahrensdokumentation/01-allgemeine-beschreibung.md` | Kap. 1 Allgemeine Beschreibung | „Status: STUB \| Version: 0.1" | **NEIN** | generisch; nicht jetzt |
| `docs/verfahrensdokumentation/02-anwenderdokumentation.md` | Kap. 2 Anwenderdokumentation | „Status: STUB \| Version: 0.1" | **NEIN** | generisch; nicht jetzt |
| `docs/verfahrensdokumentation/03-technische-systemdokumentation.md` | Kap. 3 Technische Systemdokumentation | „Status: STUB \| Version: 0.1" | **NEIN** | generisch; nicht jetzt |
| `docs/verfahrensdokumentation/04-betriebsdokumentation.md` | Kap. 4 Betriebsdokumentation | „Status: STUB \| Version: 0.1" | **NEIN** | generisch; nicht jetzt |
| `docs/verfahrensdokumentation/05-datensicherheits-und-datenschutzkonzept.md` | **Kap. 5** Datensicherheit/Datenschutz | „Status: STUB \| Version: 0.1" | **NEIN** | **Kap. 5** — direkter Pflege-Eingang aus Security/Custody/ASVS/TR-02102-Detail/IR/DSGVO/Z3/Migration/DR-V1.0 |
| `docs/verfahrensdokumentation/06-aufbewahrungs-und-loeschkonzept.md` | **Kap. 6** Aufbewahrung/Lösch | „Status: STUB \| Version: 0.1" | **NEIN** | **Kap. 6** — direkter Pflege-Eingang aus Retention/Lösch-Sperrkonzept/Regelmatrix/DR/IR/DSGVO/Z3/Migration-V1.0 |
| `docs/verfahrensdokumentation/07-pruefpfade-und-protokollierung.md` | Kap. 7 Prüfpfade/Protokollierung | „Status: STUB \| Version: 0.1" | **NEIN** | generisch; nicht jetzt |
| `docs/verfahrensdokumentation/08-internes-kontrollsystem.md` | Kap. 8 Internes Kontrollsystem | „Status: STUB \| Version: 0.1" | **NEIN** | generisch; nicht jetzt |

Hinweis: App-Code-Dateien (`src/pages/VerfahrensdokuPage.tsx`, `src/pages/VerfahrensdokuPage.css`, `src/utils/verfahrensdokumentation.ts`) sind **kein** Inspektions-Gegenstand dieser V1.0; sie verbleiben strikt im Code-Layer und werden durch V1.0 weder referenziert noch modifiziert. Demo-Pakete unter `demo-package/` sind **kein** Lock-Quelle.

## 5. Twelve-Spec Downstream Reference Matrix

Aggregierte Pflege-Eingangs-Matrix der 12 V1.0-Boundary-Lock-Layer-Specs. Alle Bezugnahmen sind reine Pflege-Verweise; **keine** Endfassungs-Inhalte werden durch V1.0 erzeugt.

| # | Source-Spec | Kap. 5 Bezug | Kap. 6 Bezug | Generischer Verfahrensdoku-Verweis | Was muss zukünftige Pflege reflektieren? | Was muss Non-Scope bleiben? |
|---|---|---|---|---|---|---|
| 1 | retention-aufbewahrungsarchiv-v1.md | — | §17 Downstream | ja | Aufbewahrungs-/Retention-Archiv-Boundary; Trennung Retention ≠ DR-Backup ≠ Z3 ≠ Migration; AO § 147 / HGB § 257 / GoBD-Topoi | konkrete Frist-Tabellen; Schema; Anbieter-Wahl |
| 2 | security-key-custody-v1.md | §17 Downstream | — | ja | Sicherheits-/Plaintext-Boundary; F0-D7-Plaintext-Disziplin; Custody-Sammelboundary | konkrete Custody-Topologie; Algorithmen; Anbieter-Wahl |
| 3 | loesch-sperrkonzept-v1.md | — | §14 Downstream | ja | Lösch-/Sperr-Boundary; Sperrgrund-Klassen einschließlich „Sicherheits-/Forensik-Halt" | konkrete Lösch-/Sperrlogik; Werkzeug-Wahl |
| 4 | dokumentenkategorie-retention-regelmatrix-v1.md | — | §16 Downstream | ja | Klassifikations-Boundary | konkrete Regel-Tabellen; Frist-Werte |
| 5 | custody-modell-v1.md | §15 Downstream | — | ja | Custody-Mechanik-Boundary; Plattform-Admin-Plaintext-Boundary | konkrete Schlüsselhierarchie; KMS-/HSM-Modellwahl |
| 6 | asvs-control-referenz-v1.md | §14 Downstream | — | ja | ASVS-Profil-Boundary (Zielprofil-Topos `v5.0.0-X.Y.Z`) | ASVS-Mapping-Indizes-Befüllung |
| 7 | tr-02102-detail-v1.md | §18 Downstream | — | ja | Krypto-/Transport-Orientierungs-Boundary | konkrete Algorithmen; Cipher Suites; TLS-Parameter |
| 8 | dr-ha-bcm-v1.md | §17 Downstream | §17 Downstream | ja | DR-/HA-/BCM-Boundary; Restore-Modi-Topoi | konkrete Restore-Mechanik; RPO/RTO-Garantien |
| 9 | cybersecurity-incident-response-v1.md | §17/§22 Downstream | §17/§22 Downstream | ja | IR-Workflow-Boundary; Ransomware-/Forensik-Schnittstelle | IR-Runbook; Werkzeug-/SIEM-/SOC-Wahl |
| 10 | dsgvo-datenpannen-v1.md | §22/§23 Downstream | §22/§23 Downstream | ja | Topos-Charakter Art. 33/34/39; strikte Trennung zur IR-Workflow-Boundary | Rechts-Einzelfall-Entscheidung; Schwellenwerte; Frist-Zähler |
| 11 | z3-datenueberlassung-v1.md | §22/§25 Downstream | §22/§25 Downstream | ja | Behörden-Auslieferungs-Boundary; Anlass-Trennung Z3 ≠ Mandanten-Export ≠ Migrations-Export | konkretes Z3-Format; 15-Daten-Kategorien-Enumeration |
| 12 | migration-v1.md | §28 Downstream | §28 Downstream | ja | Migrations-Boundary; Cutover-/Roll-back-Topoi; Mehrmandanten-Disziplin | konkrete Migrations-Mechanik; ETL/Reconciliation/Cleansing |

**Befund:** Alle zwölf V1.0-Specs benennen Verfahrensdokumentation Kap. 5 und/oder Kap. 6 als ausdrücklichen Pflege-Anker — durchgängig als „im Rahmen der jeweils nächsten Pflege" und als **Non-Scope** der jeweiligen V1.0. V1.0 dieses Pflege-Pass-Folgeartefakts spiegelt diese Pflege-Eingänge auf Boundary-Lock-Layer-Ebene zurück, ohne Endfassungs-Inhalte zu erzeugen.

## 6. Kap. 5 Pflege-Boundary

Pflege-Eingangs-Boundary für `docs/verfahrensdokumentation/05-datensicherheits-und-datenschutzkonzept.md` — auf reiner Verweis-Ebene; **kein** Kap.-5-Endfassungs-Text.

| Pflege-Eingang | Boundary-Quelle (V1.0) | Was Pflege reflektieren darf | Was Pflege **nicht** darf |
|---|---|---|---|
| **Sicherheits-/Plaintext-Boundary** | Security V1.0 §17/§19 | Topos-Verweis auf F0-D7 / Plattform-Admin-Plaintext-Disziplin / Custody-Sammelboundary | konkrete Custody-Topologie; Anbieter-Wahl |
| **Custody-Mechanik-Boundary** | Custody V1.0 §15 | Topos-Verweis auf Plaintext-Restore-Boundary; F3-D1-Plaintext-über-Z3-Verbot; F3-D3-Plaintext-über-Migration-Verbot | konkrete Schlüsselhierarchie; Schlüsselrotations-/Zerstörungs-/Wiederherstellungs-Mechanik |
| **ASVS-Profil-Boundary** | ASVS V1.0 §14 | Topos-Verweis auf OWASP-ASVS-Zielprofil-Format `v5.0.0-X.Y.Z` als reine Verweis-Layer | ASVS-Mapping-Indizes-Befüllung; Verifikations-Ergebnisse; Konformitäts-/Zertifizierungs-/Audit-Behauptung |
| **Krypto-/Transport-Orientierung** | TR-02102-Detail V1.0 §18 | Topos-Verweis auf BSI-TR-02102-1/-2-Versionsfixierung-Topos; Negativ-Erklärung gegenüber BSI TR-03116 / IT-Grundschutz | konkrete Algorithmen; Modi; Cipher Suites; TLS-Parameter; Schlüssellängen |
| **IR-Workflow-Schnittstelle** | Cybersecurity-IR V1.0 §17/§22 | Topos-Verweis auf Incident-Lifecycle-Topoi; Sperrgrund-„Sicherheits-/Forensik-Halt"-Steuerung | IR-Runbook; Forensik-Werkzeug-Wahl; Detection-Regeln; Beweis-/Log-Schemata |
| **Datenschutz-Vorfallsprozess-Schnittstelle** | DSGVO-/Datenpannen V1.0 §22/§23 | Topos-Verweis auf DSGVO Art. 32 / 33 / 34 / 39; Aufsichtsbehörden-Melde-/Betroffenen-Informations-/DSB-Einbindungs-/Dokumentations-Boundary | Rechts-Einzelfall-Entscheidung; Schwellenwerte; Frist-Zähler; Meldetext-Vorlagen |
| **Z3-Plaintext-Boundary** | Z3-/Datenüberlassung V1.0 §22/§25 | Topos-Verweis auf Plaintext-Verbot über Z3-Pfade | konkretes Z3-Format; 15-Daten-Kategorien-Enumeration |
| **Migrations-Plaintext-Boundary** | Migrations-Folgeartefakt V1.0 §28 | Topos-Verweis auf Plaintext-Verbot über Migrations-Pfade; Test-Migrations-Topoi (DSGVO Art. 32 Topos-Verweis) | konkrete Migrations-Mechanik; ETL/Reconciliation/Cleansing |
| **DR-/HA-/BCM-Sicherheits-Schnittstelle** | DR-/HA-/BCM V1.0 §17/§20 | Topos-Verweis auf Custody-/Plaintext-Restore-Boundary; Mandantentrennung im Restore | konkrete Restore-Mechanik; RPO/RTO-Garantien |

Pflege-Disziplin Kap. 5: **rein Verweis-Ebene**; alle Endfassungs-Inhalte verbleiben den existierenden Kap.-5-TODO-Markern und der späteren Pflege außerhalb dieser V1.0. **Keine** Konformitäts-/Zertifizierungs-/Audit-/Behörden-Akzeptanz-Behauptung.

## 7. Kap. 6 Pflege-Boundary

Pflege-Eingangs-Boundary für `docs/verfahrensdokumentation/06-aufbewahrungs-und-loeschkonzept.md` — auf reiner Verweis-Ebene; **kein** Kap.-6-Endfassungs-Text.

| Pflege-Eingang | Boundary-Quelle (V1.0) | Was Pflege reflektieren darf | Was Pflege **nicht** darf |
|---|---|---|---|
| **Aufbewahrungs-/Retention-Archiv-Boundary** | Retention V1.0 §17 | Topos-Verweis auf AO § 147 / HGB § 257 / GoBD-Topiken; Retention-Archiv ≠ DR-Backup ≠ Z3 ≠ Migration; F3-Closing-Konsistenz; §6.2/§6.3/§6.4 Trennungs-Tabellen | konkrete Frist-Tabellen; Speichertechnologie; Anbieter-Wahl |
| **Lösch-/Sperr-Boundary** | Lösch-/Sperrkonzept V1.0 §14 | Topos-Verweis auf Sperrgrund-Klassen einschließlich „Sicherheits-/Forensik-Halt"; STOP 12.7 (kein Bruch der F3-Closing-Boundaries) | konkrete Lösch-/Sperrlogik; Werkzeug-/Tool-Wahl |
| **Klassifikations-Boundary** | Regelmatrix V1.0 §16 | Topos-Verweis auf Dokumentenkategorien × Retention-Regeln-Boundary | konkrete Regel-Tabellen; Frist-Werte |
| **DR-Backup-/Restore-Trennung** | DR-/HA-/BCM V1.0 §17/§20 | Topos-Verweis auf DR-Restore ≠ Migrations-Rollback; F3-D2-DR-Anforderungsmodell-Topoi | konkrete Restore-Mechanik; RPO/RTO-Garantien |
| **IR-Sperrgrund-Schnittstelle** | Cybersecurity-IR V1.0 §17/§22 | Topos-Verweis auf Aussetzung Lösch-/Sperr-Operationen während Sperrgrund-„Sicherheits-/Forensik-Halt"; Ransomware-Restore-Vorbedingung | IR-Runbook; Forensik-Werkzeug-Wahl |
| **DSGVO-Dokumentations-Boundary** | DSGVO-/Datenpannen V1.0 §22/§23 | Topos-Verweis auf DSGVO Art. 33 Abs. 5 (Dokumentations-Boundary); Aufbewahrungs-Trennung gegenüber DSGVO-Vorfalls-Dokumentation | Rechts-Einzelfall-Entscheidung; Frist-Zähler |
| **Z3-Aufbewahrungs-Trennung** | Z3-/Datenüberlassung V1.0 §22/§25 | Topos-Verweis auf Z3 ≠ Aufbewahrungs-/Retention-Archiv (Substitutions-Verbot); Anlass-Trennung Z3 ≠ Mandanten-Export ≠ Migrations-Export | konkretes Z3-Format |
| **Migrations-Aufbewahrungs-Trennung** | Migrations-Folgeartefakt V1.0 §28 | Topos-Verweis auf Migration ≠ Aufbewahrungs-/Retention-Archiv; Cutover-Grenze; importierte Fremdsystem-Festschreibungen bleiben Fremdsystem-Tatsachen; importierte Fremdsystem-USt-Werte bleiben Fremdsystemwerte | konkrete Migrations-Mechanik; ETL/Cutover-Implementierung |

Pflege-Disziplin Kap. 6: **rein Verweis-Ebene**; alle Endfassungs-Inhalte verbleiben den existierenden Kap.-6-TODO-Markern und der späteren Pflege außerhalb dieser V1.0. **Keine** Konformitäts-/Zertifizierungs-/Audit-/Behörden-Akzeptanz-Behauptung.

## 8. Verhältnis zur existierenden Verfahrensdokumentations-STUB-Schicht

| Aspekt | Aussage |
|---|---|
| **Existierende STUB-Dateien unverändert** | V1.0 dieses Folgeartefakts editiert keine der zehn existierenden Verfahrensdoku-Dateien (`docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/README.md`, `docs/verfahrensdokumentation/01–08-*.md`). |
| **TODO-Marker und Abhängigkeits-Hinweise unverändert** | V1.0 löscht **keinen** TODO-Marker und ändert **keinen** Abhängigkeits-Hinweis (insbesondere die Hash-Chain-vs.-Erasure-Abhängigkeit in Kap. 5 §5.4/§5.5 und Kap. 6 §6.3 bleibt unberührt). |
| **STUB-Status unverändert** | Die Selbstdeklaration „Status: STUB \| Version: 0.1" der Kap.-1–8-Dateien bleibt durch V1.0 unverändert. |
| **App-Code unverändert** | `src/pages/VerfahrensdokuPage.tsx`, `src/pages/VerfahrensdokuPage.css` und `src/utils/verfahrensdokumentation.ts` werden durch V1.0 weder referenziert noch modifiziert. |
| **Demo-Pakete unverändert** | `demo-package/.../docs/verfahrensdokumentation.md` ist kein Lock-Quelle und bleibt unverändert. |
| **Pflege-Verantwortung außerhalb V1.0** | Die inhaltliche Pflege der STUB-Dateien obliegt Kanzlei-Leitung, Steuerberater-Funktion und Datenschutzbeauftragten-Funktion außerhalb dieser V1.0; sie wird durch V1.0 weder vorweggenommen noch ersetzt. |

## 9. Verhältnis zu Locked Decisions Register V1.0 / Marker B

| Aspekt | Aussage |
|---|---|
| **Marker B** | „Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation" gemäß Locked Decisions Register §6 Sortierungsmarker B; nicht-bindender Priorisierungs-Vorschlag, geteilt mit dem Architektur-/HA-/BCM-Artefakt. |
| **Register unverändert** | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register **nicht**. |
| **Keine Marker-Reinterpretation** | V1.0 reinterpretiert Marker B **nicht** und erzeugt **keine** neue Marker-Bindung. |
| **Vorrang-Regel** | Bei Konflikt mit dem Register gilt der Register; V1.0 paraphrasiert Marker B ausschließlich auf Boundary-Lock-Layer-Ebene. |

## 10. Verhältnis zu Aufbewahrungs-/Retention-Archiv V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Retention V1.0 liefert Pflege-Eingang für Kap. 6 (Aufbewahrungs-/Lösch-Boundary; AO § 147 / HGB § 257 / GoBD-Topiken). |
| **Endfassungs-Boundary** | Konkrete Frist-Tabellen, Schema, Speichertechnologie und Anbieter-Wahl verbleiben Retention V1.0 + nachgelagerten Detail-Artefakten; **nicht** in Kap.-6-Endfassung dieser V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Retention-Archiv-Boundaries. |

## 11. Verhältnis zu Security-/Krypto-/Key-Custody V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Security V1.0 liefert Pflege-Eingang für Kap. 5 (Sicherheits-/Plaintext-Boundary; F0-D7-Plaintext-Disziplin). |
| **Endfassungs-Boundary** | Konkrete Custody-Topologie, Algorithmen, TLS-Parameter, Anbieter-Wahl verbleiben Security V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. |
| **Vorrang-Regel** | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. |

## 12. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Lösch-/Sperrkonzept V1.0 liefert Pflege-Eingang für Kap. 6 (Sperrgrund-Klassen einschließlich „Sicherheits-/Forensik-Halt"). |
| **Endfassungs-Boundary** | Konkrete Lösch-/Sperrlogik, Werkzeug-/Tool-Wahl verbleiben Lösch-/Sperrkonzept V1.0 + nachgelagerten Detail-Artefakten. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

## 13. Verhältnis zu Dokumentenkategorie-/Retention-Regelmatrix V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Regelmatrix V1.0 liefert Pflege-Eingang für Kap. 6 (Klassifikations-Boundary). |
| **Endfassungs-Boundary** | Konkrete Regel-Tabellen, Frist-Werte verbleiben Regelmatrix V1.0 + nachgelagerten Detail-Artefakten. |
| **Vorrang-Regel** | Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Boundaries. |

## 14. Verhältnis zu Custody-Modell V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Custody-Modell V1.0 liefert Pflege-Eingang für Kap. 5 (Custody-Mechanik-Boundary; Plattform-Admin-Plaintext-Boundary). |
| **Endfassungs-Boundary** | Konkrete Custody-Topologie, Schlüsselhierarchie, KMS-/HSM-Modellwahl verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 15. Verhältnis zu ASVS-Control-Referenz V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | ASVS V1.0 liefert Pflege-Eingang für Kap. 5 (ASVS-Profil-Boundary auf Topos-Verweis-Ebene). |
| **Endfassungs-Boundary** | ASVS-Mapping-Indizes-Befüllung und Verifikations-Ergebnisse verbleiben ASVS V1.0 + nachgelagerter Versionierungs-Pflege. **Keine** Konformitäts-/Zertifizierungs-/Audit-Aussage. |
| **Vorrang-Regel** | Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Boundary. |

## 16. Verhältnis zu TR-02102-Detail V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | TR-02102-Detail V1.0 liefert Pflege-Eingang für Kap. 5 (Krypto-/Transport-Orientierung). |
| **Endfassungs-Boundary** | Konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen verbleiben TR-02102-Detail V1.0 + nachgelagerter Versionierungs-Pflege. **Keine** Konformitäts-Behauptung gegenüber BSI- oder anderen externen Krypto-Standards. |
| **Vorrang-Regel** | Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. |

## 17. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | DR-/HA-/BCM V1.0 liefert Pflege-Eingang für Kap. 5 (Custody-/Plaintext-Restore-Boundary) und Kap. 6 (DR-Backup-/Retention-/Z3-/Migration-Trennung). |
| **Endfassungs-Boundary** | Konkrete Restore-Mechanik, RPO/RTO-Garantien, Backup-Werkzeug-/Cloud-/Hardware-Wahl verbleiben DR V1.0 + nachgelagerten Detail-Artefakten. |
| **Vorrang-Regel** | Bei Konflikt mit DR V1.0 gilt DR V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 18. Verhältnis zu Cybersecurity-Incident-Response V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Cybersecurity-IR V1.0 liefert Pflege-Eingang für Kap. 5 (Incident-Lifecycle-Topoi) und Kap. 6 (Sperrgrund-„Sicherheits-/Forensik-Halt"-Aussetzung von Lösch-/Sperr-Operationen). |
| **Endfassungs-Boundary** | IR-Runbook, Forensik-Werkzeug-Wahl, SIEM-/SOC-/Tool-/Anbieter-/Cloud-Wahl, Detection-Regeln, Beweis-/Log-Schemata verbleiben IR V1.0 + nachgelagerten Detail-Artefakten. |
| **Vorrang-Regel** | Bei Konflikt mit IR V1.0 gilt IR V1.0 für IR-Workflow-Boundaries. |

## 19. Verhältnis zu DSGVO-/Datenpannen V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | DSGVO-/Datenpannen V1.0 liefert Pflege-Eingang für Kap. 5 (DSGVO Art. 32 / 39 Topoi) und Kap. 6 (DSGVO Art. 33 Abs. 5 Dokumentations-Boundary). |
| **Endfassungs-Boundary** | Rechts-Einzelfall-Entscheidung, Schwellenwerte „Risiko"/„hohes Risiko", Frist-Zähler, Meldetext-Vorlagen verbleiben DSGVO V1.0 + nachgelagerten Detail-Artefakten + externer rechtlicher Validierung. |
| **Vorrang-Regel** | Bei Konflikt mit DSGVO V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

## 20. Verhältnis zu Z3-/Datenüberlassung V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Z3 V1.0 liefert Pflege-Eingang für Kap. 5 (Plaintext-Verbot über Z3-Pfade) und Kap. 6 (Z3 ≠ Aufbewahrungs-/Retention-Archiv-Trennung; Anlass-Trennung). |
| **Endfassungs-Boundary** | Konkretes Z3-Format, 15-Daten-Kategorien-Enumeration, Beschreibungsstandard-Felder verbleiben Z3 V1.0 + nachgelagerten Detail-Artefakten. **Keine** Behörden-Akzeptanz-Behauptung. |
| **Vorrang-Regel** | Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. |

## 21. Verhältnis zu Migrations-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Pflege-Eingang** | Migration V1.0 liefert Pflege-Eingang für Kap. 5 (Test-Migrations-DSGVO-Art.-32-Topos; Plaintext-Verbot über Migrations-Pfade) und Kap. 6 (Migration ≠ Aufbewahrungs-/Retention-Archiv; Cutover-Grenze; Mehrmandanten-Disziplin). |
| **Endfassungs-Boundary** | Konkrete Migrations-Mechanik, Cutover-Workflow-Implementierung, Roll-back-Skripte, Datenmapping-Tabellen, ETL-Regeln, Reconciliation-Algorithmen verbleiben Migration V1.0 + nachgelagerten Detail-Artefakten. |
| **Vorrang-Regel** | Bei Konflikt mit Migration V1.0 gilt Migration V1.0 für Migrations-/Migrations-Rollback-Boundaries. |

## 22. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Wechselwirkung zwischen Crypto-Shredding und der Verfahrensdokumentations-Pflege. |
| **Open-Question-Datei unverändert** | V1.0 dieses Folgeartefakts ändert die Open-Question-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage bleibt vor produktiver bzw. produktiver Verfahrensdokumentations-Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 23. Verhältnis zu Hash-Chain-vs.-Erasure-Open-Question

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/HASH-CHAIN-VS-ERASURE.md` — von der existierenden Verfahrensdoku-STUB-Schicht in Kap. 5 §5.4/§5.5 sowie Kap. 6 §6.3 ausdrücklich als Abhängigkeit benannt. |
| **Keine rechtliche/technische Endfassungs-Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor und trifft **keine** Aussage zur Wahl einer Option oder zum Verhältnis dieser Open-Question gegenüber Crypto-Shredding-Boundary. |
| **Open-Question-Datei unverändert** | V1.0 dieses Folgeartefakts ändert die Hash-Chain-vs.-Erasure-Datei **nicht** und löscht **keinen** Abhängigkeits-Hinweis aus den existierenden Kap.-5-/-6-STUBS. |
| **Externe Validierung** | Eine externe rechtliche Validierung (Fachanwalt + DSB gemäß Selbstdeklaration der existierenden STUB-Schicht) bleibt vor produktiver bzw. produktiver Verfahrensdokumentations-Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 24. Verhältnis zu §28.11-bet

| Aspekt | Aussage |
|---|---|
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Keine Wechselwirkungs-Aussage** | V1.0 trifft **keine** Aussage zur Wechselwirkung zwischen §28.11-bet und der Verfahrensdokumentations-Pflege. |
| **Externe Klärung** | Eine etwaige Klärung des §28.11-bet-Status bleibt außerhalb dieses Folgeartefakts. |

## 25. Wahrung gesperrter Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; Verfahrensdokumentations-Pflege hebt Festschreibung **nicht** auf. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Verfahrensdokumentations-Pflege. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ. |
| **F3-D3 Migrations-Spezifikation** | Bleibt autoritativ. |
| **F3-Closing** | Bleibt autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass. |
| **§28.11-bet** | Bleibt unverändert/offen. |

## 26. Explicit Non-Scope

- Endfassung Kap. 1–8 der Verfahrensdokumentation; Endfassungs-Texte für `docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/01–08-*.md` oder `docs/verfahrensdokumentation/README.md`.
- Edits / Änderungen an existierenden Verfahrensdoku-Dateien jeglicher Art.
- Edits / Änderungen an App-Code-Dateien (`src/pages/VerfahrensdokuPage.tsx`, `src/pages/VerfahrensdokuPage.css`, `src/utils/verfahrensdokumentation.ts`).
- Edits / Änderungen an Demo-Paketen (`demo-package/.../docs/verfahrensdokumentation.md`).
- Edits / Änderungen am Locked Decisions Register oder einer Open-Question-Datei (insbesondere `crypto-shredding-rechtliche-einordnung.md`, `HASH-CHAIN-VS-ERASURE.md`).
- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-, Standard-Konformitäts-Behauptungen jeglicher Art (insbesondere gegenüber GoBD, AO, HGB, DSGVO, BSI, IDW, Kammern, Auditoren).
- Externe-Norm-Volltext-Aufnahme oder -Erhebung zur Lock-Quelle (insbesondere ISO 22301, ISO 27001/27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-02102, BSI TR-03116, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards).
- Implementierung; Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration.
- Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-/Berechtigungs-/RLS-Provider-Wahl; konkrete Tool-Konfiguration.
- Rechtliche Würdigung von Crypto-Shredding (verbleibt eigenständige Open-Question; Status 🔴 offen).
- Rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question (verbleibt eigenständige Open-Question).
- Endfassungs-Inhalte oder Reinterpretationen der zwölf V1.0-Vorgänger-Specs.
- Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung.
- DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Garantie-Aussagen jeglicher Art.
- Marketing-Aussagen.
- Änderung oder Reinterpretation von §28.11-bet.

## 27. Wortwahl-Disziplin

V1.0 dieses Folgeartefakts hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-, Garantie- oder Freigabe-Behauptungen sind ausgeschlossen — auch nicht in Beispielform innerhalb dieser V1.0.
- Aussagen über externe Norm-Konformität (insbesondere gegenüber GoBD-, AO-, HGB-, DSGVO-, BSI-, ISO-, NIST-, ENISA-, IDW-, AWV-, Kammer-Quellen) sind ausgeschlossen; externe Normen erscheinen ausschließlich als Negativ-Hinweis und nicht als Lock-Quelle.
- Endfassungs-Sprache („final", „freigegeben", „produktiv-bereit", „prüfungsfest", „audit-ready", „prüfbar bestätigt") ist ausgeschlossen; V1.0 ist Boundary-Lock-Layer ohne Endfassungs-Anspruch.
- Marketing-/Reife-/Enterprise-/„ready"-Sprache ist ausgeschlossen.
- Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen, die wie eine Auslegung wirken könnten, sind ausgeschlossen.
- Werkzeug-/Tool-/Anbieter-/Vendor-/Cloud-/Plattform-Marketing-Sprache ist ausgeschlossen.
- Inhalte in arabischer Schrift sind ausgeschlossen; UTF-8-BOM ist ausgeschlossen.
- STOP-Klauseln formulieren generisch und wiederholen sensible Beispiele **nicht** wörtlich.

## 28. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **Verfahrensdokumentation Kap. 5 Pflege** | Inhaltliche Pflege der existierenden Kap.-5-STUB-Datei durch Kanzlei-Leitung / Steuerberater-Funktion / Datenschutzbeauftragten-Funktion außerhalb V1.0 | offen; **Non-Scope** dieser V1.0 |
| **Verfahrensdokumentation Kap. 6 Pflege** | Inhaltliche Pflege der existierenden Kap.-6-STUB-Datei durch Kanzlei-Leitung / Steuerberater-Funktion / Datenschutzbeauftragten-Funktion außerhalb V1.0 | offen; **Non-Scope** dieser V1.0 |
| **Verfahrensdokumentation Kap. 1–4 / 7–8 Pflege** | Inhaltliche Pflege der weiteren Kap.-STUB-Dateien | offen; **Non-Scope** dieser V1.0 |
| **Externe steuerprüfungs-fachliche Validierung** | Externer Validierungs-Schritt vor produktiver bzw. produktiver Verfahrensdokumentations-Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Externe DSB-Validierung** | Externer DSB-Validierungs-Schritt vor produktiver bzw. rechtsverbindlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Sicherheits-/Produktivfreigabe** | Externer Freigabe-Schritt vor produktiver Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Forbidden-Reference-Token-Cleanup-Initiative** | Eigenständige spätere Cleanup-Initiative gegen die grandfathered Risiko-Token in der existierenden Verfahrensdoku-STUB-Schicht; **kein** unmittelbarer Edit der STUB-Dateien durch V1.0 | offen; **Non-Scope** dieser V1.0; ausdrücklich getrennt |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Hash-Chain-vs.-Erasure-Open-Question** | Open-Question; von Kap. 5/6-STUBS als Abhängigkeit benannt | offen; **keine** Würdigung in V1.0 |
| **Architektur-/HA-/BCM-Detail-Folgeartefakte** | Geteilter Marker B; jenseits Boundary-Layer | offen; nicht Bestandteil von V1.0 |
| **KMS-/HSM-/Implementations-Folgeartefakt** | Custody-/Schlüssel-Implementations-Boundary | offen; nicht Bestandteil von V1.0 |
| **Z1-/Z2-Folgeartefakte** | Datenzugriffsarten neben Z3 | offen; nicht Bestandteil von V1.0 |
| **Lohn-DLS-Folgeartefakt** | Lohnsteuer-Außenprüfung außerhalb MVP | offen; nicht Bestandteil von V1.0 |

V1.0 dieses Folgeartefakts erzeugt **keine** Implementierung, **keine** Konfiguration, **keinen** Mechanismus und **keine** Endfassung.

## 29. STOP-Bedingungen

V1.0 dieses Folgeartefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 29.1 | V1.0 dieses Folgeartefakts editiert eine existierende Verfahrensdokumentations-Datei (insbesondere `docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/README.md`, `docs/verfahrensdokumentation/01-allgemeine-beschreibung.md` … `docs/verfahrensdokumentation/08-internes-kontrollsystem.md`). |
| 29.2 | V1.0 dieses Folgeartefakts erstellt oder finalisiert Endfassungs-Inhalte für Verfahrensdokumentation Kap. 1, Kap. 2, Kap. 3, Kap. 4, Kap. 5, Kap. 6, Kap. 7 oder Kap. 8. |
| 29.3 | V1.0 dieses Folgeartefakts importiert externen Norm-Volltext oder erhebt eine externe Quelle (insbesondere GoBD-/AO-/HGB-/DSGVO-Volltext, ISO 22301, ISO 27001/27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-02102, BSI TR-03116, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards) zur Lock-Quelle. |
| 29.4 | V1.0 dieses Folgeartefakts behauptet eine Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-, Standard-Konformitäts- oder produktive Freigabe-Aussage. |
| 29.5 | V1.0 dieses Folgeartefakts spricht eine Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen oder Kammern aus. |
| 29.6 | V1.0 dieses Folgeartefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 29.7 | V1.0 dieses Folgeartefakts nimmt eine rechtliche oder technische Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question vor oder wählt eine Option. |
| 29.8 | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei (insbesondere `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`, `docs/HASH-CHAIN-VS-ERASURE.md`). |
| 29.9 | V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet. |
| 29.10 | V1.0 dieses Folgeartefakts schwächt F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 29.11 | V1.0 dieses Folgeartefakts enthält Implementation, Schema, UI, API, Code, SQL, Pseudocode, Test-Cases oder CI/CD-Konfiguration. |
| 29.12 | V1.0 dieses Folgeartefakts wählt Werkzeuge, Anbieter, Cloud-Provider, Plattformen, Bibliotheken, Hardware, Storage-Lösungen, Auth-Provider, Berechtigungs-/RLS-Provider oder Tool-Konfigurationen. |
| 29.13 | V1.0 dieses Folgeartefakts verschmilzt die Verfahrensdokumentations-Pflege-Boundary mit Inhalten einer der zwölf V1.0-Vorgänger-Specs (Retention, Security, Lösch-/Sperrkonzept, Regelmatrix, Custody, ASVS, TR-02102-Detail, DR-/HA-/BCM, Cybersecurity-IR, DSGVO-/Datenpannen, Z3, Migration), statt diese Specs ausschließlich als Pflege-Eingang zu referenzieren. |
| 29.14 | V1.0 dieses Folgeartefakts erteilt Rechtsauskunft, Steuerauskunft oder eine rechtliche/steuerliche Entscheidung im Einzelfall. |
| 29.15 | V1.0 dieses Folgeartefakts erteilt eine DSB-Freigabe, eine Aufsichtsbehörden-Freigabe, eine Sicherheitsfreigabe, eine Produktivfreigabe oder ersetzt eine externe Validierung. |
| 29.16 | V1.0 dieses Folgeartefakts editiert App-Code-Dateien (`src/pages/VerfahrensdokuPage.tsx`, `src/pages/VerfahrensdokuPage.css`, `src/utils/verfahrensdokumentation.ts`) oder Demo-Pakete. |
| 29.17 | V1.0 dieses Folgeartefakts modifiziert package-/config-/script-/test-/baseline-Dateien. |
| 29.18 | V1.0 dieses Folgeartefakts unternimmt einen unmittelbaren Cleanup der grandfathered Risiko-Token in der existierenden Verfahrensdoku-STUB-Schicht; ein solcher Cleanup wäre eine eigenständige spätere Initiative außerhalb V1.0. |
| 29.19 | V1.0 dieses Folgeartefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 29.20 | V1.0 dieses Folgeartefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |
| 29.21 | Die Forbidden-Reference-Gate-Baseline (BLOCKED, BASELINE_ALLOWED, ALLOW_MARKED) ändert sich durch Aufnahme dieser V1.0 in den Repository-Stand. |
| 29.22 | V1.0 dieses Folgeartefakts reinterpretiert Marker B im Locked Decisions Register oder erzeugt eine neue Marker-Bindung. |
| 29.23 | V1.0 dieses Folgeartefakts behauptet, eine Verfahrensdokumentations-Endfassung zu ersetzen oder die externe Validierung vor produktiver Anwendung erübrigen zu können. |

## 30. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene; intern accepted; **keine** Verfahrensdokumentations-Endfassung; **keine** produktive Freigabe |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** externe Konformitäts-/Zertifizierungs-/Audit-/Behörden-Akzeptanz-/Auditor-Akzeptanz-/Kammer-Akzeptanz-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden, Auditoren, Aufsichtsstellen oder Kammern |
| **STOP-Bedingungen** | 23 Klauseln (§29.1 — §29.23) |
| **Bindend für** | Zukünftige Pflege-Direction der existierenden Verfahrensdokumentations-STUB-Schicht hinsichtlich der Trennlinien dieses Artefakts; alle Pflege-Eingangs-Verweise aus den zwölf V1.0-Vorgänger-Specs hinsichtlich ihrer Boundary-Layer-Wahrung. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen Endfassung Kap. 1–8, externe Konformitäts-/Zertifizierungs-/Audit-/Behörden-Akzeptanz-Behauptungen sowie externe-Norm-Erhebung zur Lock-Quelle. |
| **Nicht bindend für** | Konkrete Verfahrensdokumentations-Inhalte für Kap. 1, Kap. 2, Kap. 3, Kap. 4, Kap. 5, Kap. 6, Kap. 7 oder Kap. 8. Inhaltliche Pflege existierender Verfahrensdoku-Dateien. App-Code-Layer. Demo-Pakete. Konkrete Frist-Tabellen, Berechtigungs-Tabellen, Krypto-Parameter, Restore-Mechanik, Klassifikations-Tabellen. Werkzeug-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-Wahl. Rechtliche Würdigung von Crypto-Shredding. Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question. Endfassung Verfahrensdokumentation Kap. 1–8. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | Verfahrensdokumentations-Pflege-Pass ≠ Verfahrensdokumentations-Endfassung. Verfahrensdokumentations-Pflege-Pass ≠ Inhalts-Edit existierender Verfahrensdoku-Dateien. Verfahrensdokumentations-Pflege-Pass ≠ Konformitäts-/Zertifizierungs-/Audit-Behauptung. Verfahrensdokumentations-Pflege-Pass ≠ App-Code-Layer. Verfahrensdokumentations-Pflege-Pass ≠ Demo-Pakete. Verfahrensdokumentations-Pflege-Pass ≠ Crypto-Shredding-Rechtswürdigung. Verfahrensdokumentations-Pflege-Pass ≠ Hash-Chain-vs.-Erasure-Endfassungs-Würdigung. Verfahrensdokumentations-Pflege-Pass ≠ Locked-Decisions-Register-Modifikation. Verfahrensdokumentations-Pflege-Pass ≠ Open-Question-Modifikation. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Verfahrensdokumentations-Pflege-Pass (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §6 Marker B gilt der Register. Bei Konflikt mit einer der zwölf V1.0-Vorgänger-Specs gilt die jeweilige V1.0-Spec für ihre Boundary-Domäne; V1.0 dieses Folgeartefakts darf keine Inhalte aus jenen Specs reinterpretieren. Bei Konflikt mit der existierenden Verfahrensdokumentations-STUB-Schicht werden jene Dateien **nicht** verändert. Bei Konflikt mit der Crypto-Shredding-Open-Question oder der Hash-Chain-vs.-Erasure-Open-Question bleiben jene als Open-Question offen. |
| **Verankerungs-Hinweis** | Das Verfahrensdokumentations-Pflege-Pass-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker B** verankert (Eintrag: „Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation"). Sortierungsmarker B ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Architektur-/HA-/BCM-Artefakt geteilt. V1.0 paraphrasiert Marker B ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert den Register **nicht**. |
| **Externe Validierung** | Vor produktiver bzw. produktiver Verfahrensdokumentations-Anwendung sind eine externe steuerprüfungs-fachliche Validierung, eine externe DSB-Validierung sowie ggf. eine Sicherheits-/Produktivfreigabe erforderlich. Alle drei sind **Non-Scope** von V1.0. |

## 31. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **nicht** Verfahrensdokumentations-Endfassung; **nicht** Bestandteil eines externen Audit-, Zertifizierungs-, Behörden-Akzeptanz- oder Kammer-Akzeptanz-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Schärfung der Anti-Endfassungs-/Anti-Konformitäts-/Anti-Zertifizierungs-/Anti-Audit-/Anti-Behörden-Akzeptanz-/Anti-Auditor-Akzeptanz-/Anti-Kammer-Akzeptanz-Wortwahl; ausdrückliche Aufnahme von ISO 22301, ISO 27001/27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-02102, BSI TR-03116, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Verfahrensdokumentations-Standards in die Negativ-Quellgrundlage; klare Trennung von Boundary-Lock-Layer (V1.0) und Verfahrensdokumentations-Endfassung (außerhalb V1.0); ausdrücklicher Schutz der existierenden zehn STUB-Dateien vor Edit; ausdrücklicher Schutz der App-Code-Layer und Demo-Pakete; Crypto-Shredding-Rechtsfrage und Hash-Chain-vs.-Erasure-Open-Question als ausdrückliche Open-Question-Verweise ohne Würdigung verankert; in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; die inhaltliche Pflege der STUB-Dateien sowie die externen Validierungs-Schritte erfolgen außerhalb dieser V1.0. |
