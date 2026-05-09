# Architektur-Spec-Inventar — Boundary-/Spec-V1.0-Lock-Layer-Schicht

**Status:** Inventar-/Dokumentations-Datei für `docs/architecture/specs/`. Diese README ist **kein** Boundary-/Spec-Lock-Layer-Artefakt und **kein** V1.0-Lock. Autoritative Quellen bleiben die einzelnen V1.0-Spec-Dateien sowie der *Harouda Locked Decisions Register V1.0* (`docs/architecture/harouda-locked-decisions-register-v1.md`). Diese README zitiert ausschließlich; sie reinterpretiert, ergänzt oder modifiziert keine der dort verankerten Lock-Aussagen.

Stand: Repository nach Aufnahme von `lohn-dls-v1.md` auf `origin/main` (Commit `cda64a7`). Eine spätere Anpassung dieses Inventars erfolgt ausschließlich über eigenständige Pflege-Schritte mit eigener Review.

## 1. Inventar der 16 Boundary-/Spec-V1.0-Lock-Layer-Artefakte

| # | Spec-Datei | Marker / Familie | Kurzrolle (rein deskriptiv) | Status |
|---|---|---|---|---|
| 1 | `retention-aufbewahrungsarchiv-v1.md` | Marker A | Aufbewahrungs-/Retention-Archiv-Boundary (AO § 147 / HGB § 257 / GoBD-Topiken; Lohn-Grenzverweis EStG § 41) | LIVE |
| 2 | `security-key-custody-v1.md` | Marker A | Sicherheits-/Plaintext-Boundary; F0-D7-Plattform-Admin-Plaintext-Disziplin | LIVE |
| 3 | `loesch-sperrkonzept-v1.md` | (Lösch-/Sperr-Boundary) | Lösch-/Sperr-Boundary inkl. Sperrgrund-Klassen | LIVE |
| 4 | `dokumentenkategorie-retention-regelmatrix-v1.md` | (Klassifikations-Boundary) | Klassifikations-Boundary Dokumentenkategorien × Retention-Regeln; F3-D2-Wahrung | LIVE |
| 5 | `custody-modell-v1.md` | (Custody-Mechanik) | Custody-Mechanik-Boundary; Plattform-Admin-/Plaintext-Boundary | LIVE |
| 6 | `asvs-control-referenz-v1.md` | (ASVS-Profil) | Boundary-Referenz auf OWASP ASVS 5.0.0 als Zielprofil | LIVE |
| 7 | `tr-02102-detail-v1.md` | (Krypto-Orientierung) | Krypto-/Transport-Orientierungs-Boundary unter Bezugnahme auf BSI TR-02102-1/-2 Version 2026-01 | LIVE |
| 8 | `dr-ha-bcm-v1.md` | Marker B / F3-D2 | DR-/HA-/BCM-Boundary; F3-D2-Operationalisierung auf Boundary-Lock-Layer-Ebene | LIVE |
| 9 | `cybersecurity-incident-response-v1.md` | Marker C | Cybersecurity-IR-Workflow-Boundary; Sortierungsmarker C (geteilt mit DSGVO-/Datenpannen) | LIVE |
| 10 | `dsgvo-datenpannen-v1.md` | Marker C | Rechtsbezogene Boundary für Datenschutz-Vorfälle (DSGVO Art. 33/34/39 als Topoi); Sortierungsmarker C (geteilt mit IR) | LIVE |
| 11 | `z3-datenueberlassung-v1.md` | Marker A / F3-D1 | Behörden-Auslieferungs-Boundary; F3-D1-Operationalisierung auf Boundary-Lock-Layer-Ebene | LIVE |
| 12 | `migration-v1.md` | F3-D3 (Register §3.12-Bindung; **kein** §6-Marker-Bullet) | Migrations-Boundary; F3-D3-Operationalisierung auf Boundary-Lock-Layer-Ebene | LIVE |
| 13 | `verfahrensdokumentation-v1.md` | Marker B | Verfahrensdokumentations-Pflege-Pass-Boundary für die existierende STUB-Schicht | LIVE |
| 14 | `kms-hsm-implementations-v1.md` | (Custody-V1.0-§15-Bindung; **kein** §6-Marker-Bullet) | KMS-/HSM-/Implementations-Detail-Boundary unter Custody V1.0 §15 | LIVE |
| 15 | `z1-z2-datenzugriffe-v1.md` | Marker D | Z1-/Z2-Datenzugriffsarten neben Z3 (combined V1.0) | LIVE |
| 16 | `lohn-dls-v1.md` | Marker D | Lohn-DLS-Folgeartefakt — Lohnsteuer-Außenprüfungs-Boundary; **außerhalb MVP gemäß Register §3.10 / §6 Marker D** | LIVE (außerhalb MVP) |

## 2. Separat geführte Dateien

`accounting-service-v1.md` ist eine **pre-existing Service-Level-Spec** und ist **nicht** Bestandteil der oben gelisteten 16-Artefakt-Boundary-/Spec-V1.0-Lock-Layer-Schicht. Sie wurde vor der Boundary-/Spec-Lock-Layer-Serie aufgenommen (älterer Introducing-Commit) und ist im Sinne dieser Inventar-Zählung nicht mitzuzählen. Der Locked Decisions Register §6 listet sie nicht als Marker-Folgeartefakt; die Boundary-Lock-Layer-Specs referenzieren sie nicht als gegenseitigen Trennlinien-Anker.

## 3. Marker-Status (Locked Decisions Register §6)

| Marker | Status | Bemerkung |
|---|---|---|
| **A** | **vollständig** (Retention, Security, Z3) | drei Folgeartefakte LIVE |
| **B** | **vollständig** (DR-/HA-/BCM, Verfahrensdokumentation) | zwei Folgeartefakte LIVE |
| **C** | **vollständig** (DSGVO-/Datenpannen, Cybersecurity-IR) | zwei Folgeartefakte LIVE; gemeinsamer Marker C, getrennte Folgeartefakte |
| **D** | **vollständig** (Z1-/Z2-Datenzugriffe, Lohn-DLS) | zwei Folgeartefakte LIVE; gemeinsamer Marker D, getrennte Folgeartefakte; **Lohn-DLS außerhalb MVP** gemäß Register §3.10 / §6 Marker D |
| **E** | offen (Phase-3-Anschluss) | sechs Folgeartefakte: Mahnwesen, Banking, Bewertungs-Artefakt, Bilanz-Vorbereitung, Sondervorauszahlung, Schlusszahlung / Erstattung |
| **F** | offen (Steuer-Scope-Erweiterung) | EU-Sub |

Migrations-Folgeartefakt V1.0 und KMS-/HSM-/Implementations-Folgeartefakt V1.0 sind **nicht** über §6-Marker, sondern über Register §3.12 (F3-D3) bzw. Custody V1.0 §15 als Downstream-Artefakte verankert.

## 4. Offene Verweise (ohne Würdigung)

Diese Verweise sind reine Bezugnahmen ohne rechtliche, technische oder fachliche Wertung in dieser README:

| Verweis | Pfad | Charakter |
|---|---|---|
| Crypto-Shredding rechtliche Einordnung | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` | Open-Question (Status 🔴 offen); Release-/produktive-Anwendung-Blocker — **keine** Würdigung in dieser README |
| Hash-Chain-vs.-Erasure-Open-Question | `docs/HASH-CHAIN-VS-ERASURE.md` | Open-Question; Release-/produktive-Anwendung-Blocker — **keine** Endfassungs-Würdigung in dieser README |
| §28.11-bet | Locked Decisions Register | unverändert/offen — **keine** Reinterpretation in dieser README |

## 5. Wortwahl-Disziplin

Diese README hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Behörden-Akzeptanz-, Auditor-Akzeptanz-, Kammer-Akzeptanz-, Productive-Readiness-, Garantie- oder Freigabe-Behauptungen sind ausgeschlossen.
- Aussagen über externe Norm-Konformität (gegenüber AO-, GoBD-, EStG-, SGB-, ELStAM-, DEÜV-, SV-, BSI-, ISO-, NIST-, ENISA-, IDW-, AWV-, Kammer-Quellen) sind ausgeschlossen; externe Normen werden ausschließlich beschreibend benannt, nicht zur Lock-Quelle erhoben.
- Implementations-, Schema-, UI-, API-, Code-, SQL-, Test-, CI-, Provider-, Vendor-, Cloud-, Tool-, Hardware-Aussagen sind ausgeschlossen.
- Marketing-/Reife-Sprache ist ausgeschlossen.
- Verfahrensdokumentations-Endfassungs-Aussagen für Kap. 1–8 sind ausgeschlossen.
- Eine rechtliche Würdigung von Crypto-Shredding oder eine Endfassungs-Würdigung der Hash-Chain-vs.-Erasure-Open-Question sind ausgeschlossen.
- Eine Reinterpretation oder Aufhebung des Außerhalb-MVP-Status von Lohn-DLS V1.0 ist ausgeschlossen.
- Eine Verschmelzung von `accounting-service-v1.md` in die 16-Artefakt-Lock-Layer-Schicht ist ausgeschlossen.
- Eine Reinterpretation oder Modifikation einer der 16 V1.0-Specs ist ausgeschlossen.
- Eine Änderung oder Reinterpretation von §28.11-bet ist ausgeschlossen.
- Inhalte in arabischer Schrift und UTF-8-BOM sind ausgeschlossen.

## 6. Verhältnis zu anderen Repository-Quellen

- **Locked Decisions Register V1.0** (`docs/architecture/harouda-locked-decisions-register-v1.md`): autoritative Lock-Quelle für F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing sowie für §6-Sortierungsmarker A/B/C/D/E/F. Wird durch diese README **nicht** modifiziert.
- **Phase-1-Closure-Decision** (`docs/architecture/phase-1-final-closure-decision.md`): Phase-1-Schluss-Dokument; wird durch diese README **nicht** modifiziert.
- **Verfahrensdokumentations-STUB-Schicht** (`docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/01-…-08-*.md`, `docs/verfahrensdokumentation/README.md`): bestehende STUB-Dateien; werden durch diese README **nicht** modifiziert; ihre inhaltliche Pflege erfolgt außerhalb der V1.0-Boundary-Lock-Layer-Schicht.
- **App-Code-Layer** (`src/**`) und **Demo-Pakete** (`demo-package/**`): außerhalb des Boundary-Lock-Layer-Scopes; werden durch diese README **nicht** referenziert oder modifiziert.

## 7. Versionshinweis

| Aspekt | Wert |
|---|---|
| Stand | Repository auf `origin/main` Commit `cda64a7` (nach Aufnahme von `lohn-dls-v1.md`) |
| Charakter | Inventar-/Dokumentations-Datei; **kein** V1.0-Boundary-Lock-Layer-Artefakt |
| Autoritative Quellen | die einzelnen V1.0-Spec-Dateien und der Locked Decisions Register V1.0; bei Konflikten gelten jene |
| Pflege | Änderungen an diesem Inventar erfordern eine eigenständige Review und erfolgen außerhalb dieser Datei (z. B. nach Aufnahme weiterer Marker-E-/F-Folgeartefakte oder nach einer eigenständigen Register-Aktualisierung) |
| Externe Validierung | für die einzelnen Lock-Layer-Specs jeweils dort verankert; **nicht** Bestandteil dieser README |
