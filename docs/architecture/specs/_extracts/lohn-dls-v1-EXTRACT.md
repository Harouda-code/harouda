# Extract: lohn-dls-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/lohn-dls-v1.md
- Dateigröße: 53.0 KB
- Zeilenanzahl: 374
- Erstellt am: 2026-05-10T17:48:55+02:00
- Erste H1-Überschrift im Dokument: Lohn-DLS-Folgeartefakt V1.0

## 2. Zweck der Spec (in einem Satz)
Boundary-Lock-Layer-Verankerung des im Locked Decisions Register V1.0 §3.10 (F3-D1) und §6 Sortierungsmarker D wörtlich gesetzten Außerhalb-MVP-Status des Lohn-DLS-Folgeartefakts — ohne Antizipation, Autorisierung, Validierung oder Implementierung jeglicher Lohnsteuer-Außenprüfungs-Mechanik.

## 3. Hauptthemen (max 5 Bullet Points)
- Außerhalb-MVP-Disziplin (Register §3.10 / §6 Marker D); V1.0 hebt den Außerhalb-MVP-Status nicht auf
- Lohn-Tiefe-Topos auf reiner Verweis-Ebene (EStG § 41 / Lohnkonten / lohnsteuerliche Sonderfristen / SV-Aufbewahrungsbezüge)
- App-Code-Layer-Disziplin: existierende Pfade `src/domain/lohn/**`, `src/utils/payroll*`, `src/pages/Lohn*` etc. werden nicht autorisiert, finalisiert, validiert oder modifiziert
- Trennlinien gegenüber Z3 V1.0 (Anlass-Trennung), Migration V1.0 (§22 / STOP 29.24), Z1-/Z2 V1.0 (Marker-D-Geschwister), Retention V1.0 §9
- Spiegelung der F0-D4-/F0-D6-/F0-D7-/F1-D1/F1-D2-Disziplinen über Lohn-DLS-Pfade; Plaintext-Boundary über Custody V1.0 §13 + Security V1.0 §10

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(Non-Scope: „Lohnarten-Schema; Lohnsteuer-Berechnungs-Mechanik; konkrete Lohnkonten-Frist-Tabellen; Aufbewahrungs-Stichtag-Logik; Lohnsteuer-Sonderfristen-Tabellen; Datenbank-/Dateisystem-Schema; Daten-Wörterbücher; konkrete Berechtigungs-/Rollen-Tabellen; konkrete Audit-Schema-Felder".)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(Non-Scope: „ELStAM-Workflow; DEÜV-Workflow; SV-Meldungs-Workflow; Lohn-Reporting-Workflow; Lohn-Buchhaltungs-Workflow; Lohn-Export-Workflow; konkrete Lohnsteuer-Außenprüfungs-Mechanik; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration". Außerhalb-MVP-Disziplin schließt jegliche Workflow-Antizipation aus.)

## 6. Rechtsgrundlagen-Erwähnungen
- "EStG § 41" — Sechsjährige Aufbewahrung der Lohnkonten; ausschließlich als Topos-Verweis über die Paraphrase im Locked Decisions Register §3.10 / §6 Marker D sowie über Retention V1.0 §9; keine eigene Aufbewahrungs-Aussage in dieser V1.0.
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; nur als Topik-Verweis im Plaintext-Boundary-Kontext.
- "DSGVO Art. 33 / 34" — Meldepflichten; verbleibt DSGVO-/Datenpannen-Folgeartefakt; nur als Grenzverweis.
- "DSGVO Art. 17" — Crypto-Shredding-Open-Question; keine rechtliche Würdigung in V1.0.
- "StGB § 203 / StBerG § 62a" — Berufsgeheimnis-Schutz; sinngemäß über Custody V1.0 §13 + Security V1.0 §10 auch über Lohn-DLS-Pfade.

(Ausdrücklich KEINE Lock-Quelle: EStG § 41-Volltext, Lohnsteuer-Richtlinien-Volltext, Sozialgesetzbuch-Volltext, ELStAM-Spezifikation, DEÜV-Spezifikation, SV-Meldeverfahren-Spezifikation, GoBD-/AO-Volltext, IDW PS 880, AWV-Muster-Verfahrensdokumentation, Kammer-Standards, BSI IT-Grundschutz, BSI TR-03116, ISO 27001.)

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-D1", "F3-D2", "F3-D3", "F3-Closing" — Locked-Decisions-Register-Boundary-IDs durchgehend referenziert.
- "Register §3.10 (F3-D1) Kernaussagen" — direkter wörtlicher Anker „DLS Lohnsteuer-Außenprüfung außerhalb MVP".
- "Register §6 Sortierungsmarker D" — direkte Verankerungs-Quelle (geteilt mit Z1-/Z2-Datenzugriffe-Folgeartefakt LIVE).
- "§28.11-bet" — bleibt unverändert/offen.
- STOP-Bedingungen (referenziert auf Boundary-Ebene).

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Außerhalb-MVP-Status: Das Lohn-DLS-Folgeartefakt — insbesondere die Lohnsteuer-Außenprüfungs-Topik — ist gemäß Locked Decisions Register §3.10 (F3-D1 Kernaussagen) und §6 Sortierungsmarker D ausdrücklich außerhalb MVP verankert."
- "Keine Antizipation: V1.0 dieses Folgeartefakts antizipiert keine Lohnsteuer-Außenprüfungs-Mechanik, keine ELStAM-/DEÜV-/SV-/Lohn-Reporting-/Lohn-Buchhaltungs-/Lohn-Export-Workflows und keine konkrete Lohn-Z1-/Z2-/Z3-Audit-Format-Wahl."
- "Keine Aufhebung: V1.0 hebt den Außerhalb-MVP-Status nicht auf, weder implizit noch explizit."
- "EStG § 41 Topos-Verweis: Lohnkonten unterliegen einer eigenständigen sechsjährigen Aufbewahrungslogik. Konkrete Frist-Tabellen, Stichtag-Logik, Sonderfristen-Tabellen sind Non-Scope dieser V1.0."
- "Grenzverweis-Disziplin: Retention V1.0 §9 verzeichnet die Grenze; die fachliche Tiefe wird in einem späteren Lohn-DLS-Detail-Folgeartefakt behandelt."
- "App-Code-Layer ≠ Boundary-Lock-Layer. App-Code-/UI-/Test-/Util-Pfade sind außerhalb des Boundary-Lock-Layer-Scopes dieser V1.0."
- "Keine Autorisierung: V1.0 autorisiert die Existenz oder Anwendung der App-Code-Pfade nicht."
- "Keine Validierung: V1.0 validiert die App-Code-Implementation nicht."
- "Trennlinie Lohn-DLS ≠ Z3-Datenüberlassung. Eine konkrete Lohn-Z3-Audit-Format-Wahl ist Non-Scope und außerhalb MVP."
- "Trennlinie Lohn-DLS ≠ Migrations-Mechanik. Migrations-Boundary verbleibt strikt Migration V1.0 (F3-D3)."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Open Question Crypto-Shredding rechtliche Einordnung" — `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen); Release-Blocker für Produktivanwendung.
- "Open Question Hash-Chain-vs.-Erasure-Entscheidung" — `docs/HASH-CHAIN-VS-ERASURE.md`; nur Verweis.
- "§28.11-bet bleibt unverändert/offen".
- "Endfassung Verfahrensdokumentation Kap. 1–8" — Non-Scope.
- "Externe steuerprüfungs-fachliche Validierung, externe DSB-Validierung sowie ggf. Sicherheits-/Produktivfreigabe bleibt vor produktiver bzw. behördlicher Anwendung erforderlich."
- "Konkrete Lohn-DLS-Endfassung (Tiefe, Mechanik, Workflows, Schemata) verbleibt einem späteren Lohn-DLS-Detail-Folgeartefakt".

## 10. Verweise auf andere Specs
- Locked Decisions Register V1.0 §3.10 (F3-D1) (direkte Lock-Basis; wörtliches „außerhalb MVP")
- Locked Decisions Register V1.0 §6 Sortierungsmarker D (direkte Verankerungs-Quelle; geteilt mit Z1-/Z2)
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §1/§4/§6/§9/§15 (kanonische Trennungs-Vorlage „Lohn — Grenze")
- Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §1/§17 (Anlass-Trennung)
- Migrations-Folgeartefakt V1.0 §1/§22/§29 STOP 29.24 (Trennungs-Pattern-Vorlage)
- Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0 §13 (Marker-D-Geschwister)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Klassifikations-Trennung)
- DSGVO-/Datenpannen-Folgeartefakt V1.0 §17
- Verfahrensdokumentations-Pflege-Pass V1.0 §6/§28
- Security-/Krypto-/Key-Custody-Artefakt V1.0 §10/§13/§17 (Plaintext-Boundary)
- Custody-Modell-Boundary-Artefakt V1.0 §13 (Verbot einseitiger Plaintext-Macht)
- KMS-/HSM-/Implementations-Folgeartefakt V1.0 (Schlüssel-Boundary)
- TR-02102-Detail V1.0, ASVS V1.0, DR-/HA-/BCM V1.0, Cybersecurity-IR V1.0, Lösch-/Sperrkonzept V1.0 (Cross-Boundary-Trennlinien)
- Open Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`
- Open Question `docs/HASH-CHAIN-VS-ERASURE.md`

## 11. Technische Stack-Erwähnungen
- App-Code-Pfade-Referenzen (Non-Scope-Disziplin, NICHT Autorisierung):
  - "`src/domain/lohn/**`"
  - "`src/utils/payroll*`" und "`src/utils/lohn*`"
  - "`src/pages/Lohn*`" und "`src/pages/Payroll*`"
  - "`src/lib/crypto/payrollHash*`"

V1.0 weist diese Pfade ausdrücklich als App-Code-Layer aus, der durch V1.0 „weder autorisiert, noch finalisiert, noch validiert, noch modifiziert" wird. PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.
