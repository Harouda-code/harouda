# Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0

**Lock-Aussage:** Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im *Harouda Locked Decisions Register V1.0* §3.10 („F3-D1 Z3-/GDPdU-/GoBD-Export-Vollmodul V1.0 — locked") und §6 Sortierungsmarker A („Z3-Export-Spezifikations-Artefakt — Technische Konkretisierung von F3-D1") bereits autoritativ angelegte Z3-Boundary auf der Ebene paraphrasierter Topoi: behördliche Datenüberlassung als eigenständiger Anlass; Anlass-Trennung Z3-Datenüberlassung ≠ Mandanten-Export ≠ Migrations-Export; Prüfungszeitraum als Primärgranularität (WJ/Kalenderjahr abgeleitet); Beschreibungsstandard für die Datenträgerüberlassung ausschließlich als technische Bereitstellungshilfe, **nicht** als Lock-Quelle. V1.0 modifiziert F3-D1 **nicht**. V1.0 autorisiert **keine** Implementierung. V1.0 enthält **keine** konkrete XML-/CSV-/Manifest-Struktur, **keine** Enumeration der Daten-Kategorien, **keine** Schema-/Daten-Wörterbuch-/UI-/API-/Code-Aussage, **keine** Verschlüsselungs-/Transport-Aussage und **keine** Schlüssel-/Custody-Mechanik. V1.0 vermischt Z3 **nicht** mit Z1-/Z2-Mechanik und nimmt **keine** Lohn-DLS-Aussage jenseits eines Negativ-Verweises vor. V1.0 nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** behördliche Akzeptanz, **keine** externe Zertifizierung, **kein** Audit-Ergebnis und **keine** Konformität gegenüber externen Normen. §28.11-bet bleibt unverändert/offen. Eine externe steuerprüfungs-fachliche Validierung sowie ggf. eine DSB-/Sicherheits-/Produktivfreigabe bleibt vor produktiver bzw. behördlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** behördliche Akzeptanz-Behauptung; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden oder Aufsichtsstellen |
| Scope | Boundary-Aussagen zu: behördlicher Datenüberlassung als eigenständiger Anlass auf Topos-Ebene; Anlass-Trennung Z3-Datenüberlassung ≠ Mandanten-Export ≠ Migrations-Export; Granularitäts-Topos (Prüfungszeitraum als Primärgranularität, WJ/Kalenderjahr abgeleitet); Beschreibungsstandard-Negativ-Quellgrundlage; Trennlinien gegenüber Aufbewahrungs-/Retention-Archiv, DR-/HA-/BCM, Migration, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, DSGVO-/Datenpannen, Cybersecurity-IR, Lösch-/Sperrkonzept, Regelmatrix, Lohn-DLS, Z1-/Z2; Plaintext-Boundary-Wahrung gegenüber F3-D1; Cross-Boundary-Konsistenz mit allen 10 gesperrten Vorgänger-V1.0-Specs und gesperrten Harouda-Locks |
| Non-Scope | Konkrete Z3-Format-Wahl (XML-/CSV-/Manifest-/INDEX-/GDPdU-/DSFinV-K-Struktur, Beschreibungsstandard-Felder, Daten-Wörterbuch); Enumeration der Daten-Kategorien; Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration; Speichertechnologie; Übergabeplattform-Wahl; Datenträger-Hardware-Wahl; Verschlüsselungs-/Transport-Mechanik; Schlüssel-/Custody-Mechanik; Plaintext-Beschaffungs-Mechanik; Werkzeug-/Tool-/Anbieter-/Cloud-/Hardware-/Bibliotheks-/Plattform-Wahl; DR-/HA-/BCM-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0); Migrations-Implementierung (verbleibt Migrations-Folgeartefakt); Cybersecurity-IR-Workflow (verbleibt IR V1.0); Datenschutz-Vorfallsprozess (verbleibt DSGVO-/Datenpannen V1.0); Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0); Klassifikation (verbleibt Regelmatrix V1.0); Aufbewahrungs-/Retention-Archiv-Boundary (verbleibt Retention V1.0); ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0); konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter (verbleiben TR-02102-Detail V1.0); Custody-Topologie / Schlüsselhierarchie (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt); Z1-/Z2-Mechanik (verbleibt Z1-/Z2-Folgeartefakte); Lohn-DLS-Tiefe einschließlich Lohnsteuer-Außenprüfung (verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP gemäß Register §3.10/§6); rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question); externe Normen / Zertifizierungen als Lock-Quelle (insbesondere BSI IT-Grundschutz, BSI TR-03116, ISO 22301, ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA); Garantie-Aussagen jeglicher Art; Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Behörden-Akzeptanz-Behauptung; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register V1.0 §3.10 (F3-D1 Z3-/GDPdU-/GoBD-Export-Vollmodul V1.0 — locked; Kernaussagen, Boundaries, 23 STOP-Bedingungen, Anlass-Trennung, Granularitäts-Topos, Beschreibungsstandard-Negativ-Quelle); Locked Decisions Register V1.0 §6 Sortierungsmarker A („Z3-Export-Spezifikations-Artefakt — Technische Konkretisierung von F3-D1"); Locked Decisions Register V1.0 §6 Sortierungsmarker D („Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP" sowie „Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3"); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §6.2 (Retention-Archiv ≠ Z3-/Datenüberlassung); DR-/HA-/BCM-Folgeartefakt V1.0 §8 (Backup vs. Retention Archive vs. Z3 vs. Migration), §16 (Verhältnis zu Z3-/Datenüberlassung), §20, §21 STOP 21.13; Security-/Krypto-/Key-Custody-Artefakt V1.0 §6 (Plaintext-Boundary über Z3-Pfade), §13 (F3-D1 Plattform-Admin), §17; Custody-Modell-Boundary-Artefakt V1.0 §5/§6/§10/§11/§13 (Verbot einseitiger Plaintext-Macht über Z3-Pfade), §15; Dokumentenkategorie-/Retention-Regelmatrix V1.0 §12 (F3-D1-Wahrung), §16 (Downstream); ASVS-Control-Referenz-Artefakt V1.0 §11 (F3-D1-Wahrung), §14 (Downstream); TR-02102-Detail-Artefakt V1.0 §12 (Verhältnis zu Z3-/Datenüberlassung), §13/§15/§17, §16 STOP 16.9; Lösch-/Sperrkonzept-Artefakt V1.0 §11 (Verhältnis), §12 STOP 12.7, §14 (Downstream); Cybersecurity-Incident-Response-Folgeartefakt V1.0 §14 (Verhältnis zu Z3-/Datenüberlassung), §17 STOP 21.1, §19 Boundaries; DSGVO-/Datenpannen-Folgeartefakt V1.0 §17 (Verhältnis zu Z3 / Migration / Lohn-DLS), §20 STOP 20.1; F3-Closing als Cross-Boundary-Authoritat; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §3.10 / F3-D1 gilt §3.10 als autoritative Quelle; V1.0 dieses Folgeartefakts paraphrasiert §3.10 ausschließlich auf Boundary-Lock-Layer-Ebene und ändert §3.10 **nicht**. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 oder Custody V1.0 gilt jeweils diese Quelle für Sicherheits-/Plaintext-/Custody-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

**Wichtiger Hinweis zur Verankerung:** Das Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) als **Sortierungsmarker A** enumeriert (Eintrag: „Z3-Export-Spezifikations-Artefakt — Technische Konkretisierung von F3-D1"). Sortierungsmarker A ist nicht-bindender Priorisierungs-Vorschlag. Damit ist die Bindungsgrundlage dieses Artefakts repository-intern eindeutig verankert. V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht**.

## 2. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §3.10 | F3-D1 Z3-/GDPdU-/GoBD-Export-Vollmodul V1.0 — locked; Kernaussagen (fachliches Export-Modell, behördliche Z3-Datenüberlassung über Datenträger oder Datenaustauschplattform, Anzahl-/Verknüpfungs-Topos, Beschreibungsstandard-Negativ-Quelle, Prüfungszeitraum-Granularität, Anlass-Trennung); Boundaries (keine konkrete XML-/CSV-Struktur, keine Verschlüsselungs-/Transport-Aussage, keine Z1-/Z2-Mechanik, keine UI-/Schema-/Implementierungs-Aussage); Bindend für „Z3-Spezifikations-Folgeartefakt"; nicht bindend für DR-Backup, Aufbewahrungs-/Retention-Archiv, Migration; 23 STOP-Bedingungen | **Direkte autoritative Lock-Basis** |
| Locked Decisions Register V1.0 §6 Sortierungsmarker A | „Z3-Export-Spezifikations-Artefakt — Technische Konkretisierung von F3-D1" | **Direkte Verankerungs-Quelle** im Register |
| Locked Decisions Register V1.0 §6 Sortierungsmarker D | „Z1-/Z2-Folgeartefakte — Datenzugriffsarten neben Z3"; „Lohn-DLS-Folgeartefakt — F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP" | Negativ-Anker (Z1-/Z2- und Lohn-DLS-Trennung) |
| Aufbewahrungs-/Retention-Archiv V1.0 | §6.2 Retention-Archiv-vs-Z3-Vergleichstabelle (Zweck, Format, Aufbewahrung); §15/§17 Non-Scope und Downstream | **Zentraler Trennlinien-Anker** Retention vs. Z3 |
| DR-/HA-/BCM V1.0 | §8 (Backup vs. Retention Archive vs. Z3 vs. Migration); §16 Verhältnis zu Z3; §20 Boundary-Confirmation; §21 STOP 21.13 (Verschmelzung mit Z3) | **Zentraler Trennlinien-Anker** DR vs. Z3 |
| Security-/Krypto-/Key-Custody V1.0 | §6 (F3-D1: Plattform-Admin erzeugt keinen Z3-Export); §13/§17 Plaintext-/Custody-Disziplin; §19 Boundaries | **Plaintext-Boundary-Anker** über Z3-Pfade |
| Custody-Modell V1.0 | §5/§6/§10/§11/§13 (Verbot einseitiger Plaintext-Macht über Z3-Pfade; Plattform-Admin erzeugt keinen Z3-Export; Custody-Modell respektiert F3-D1); §15 Downstream | **Plaintext-Boundary-Anker** über Z3-Pfade |
| TR-02102-Detail V1.0 | §12 (eigene Section „Verhältnis zu Z3-/Datenüberlassung"); §13/§15/§17; §16 STOP 16.9 (Verschmelzung Z3) | **Krypto-Trennlinien-Anker** |
| ASVS-Control-Referenz V1.0 | §11 F3-D1-Wahrung; §14 Downstream; §17 Boundaries | Negativ-Anker |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | §12 F3-D1-Wahrung; §16 Downstream; §14 STOP 14.12 | Negativ-Anker |
| Lösch-/Sperrkonzept V1.0 | §11 Verhältnis; §12 STOP 12.7 (Lösch-/Sperr-Operation darf F3-Closing nicht berühren); §14 Downstream | Negativ-Anker |
| Cybersecurity-Incident-Response V1.0 | §14 (eigene Section „Verhältnis zu Z3-/Datenüberlassung"); §17 STOP 21.1; §19 Boundaries | Negativ-Anker; IR-Z3-Plaintext-Schutz |
| DSGVO-/Datenpannen V1.0 | §17 (Verhältnis zu Z3 / Migration / Lohn-DLS); §20 STOP 20.1; §23 Boundaries | Negativ-Anker |
| F3-Closing | Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen | Cross-Boundary-Authoritat |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | Status 🔴 offen; Release-Blocker für produktive Anwendung | Nur Verweis; **keine** rechtliche Würdigung in V1.0 |

Ausdrücklich **keine** externen Lock-Quellen: BSI IT-Grundschutz, BSI TR-03116, ISO 22301, ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA sowie GoBD-/AO-/GDPdU-Volltext sind **nicht** Lock-Quelle dieses Artefakts. Nennungen externer Normen erfolgen ausschließlich als Negativ-Hinweis. Bezugnahmen auf GoBD/AO/GDPdU-Topiken erfolgen ausschließlich über die Paraphrase im Locked Decisions Register §3.10.

## 3. Core Boundaries

Die folgenden Aussagen sind Boundary-Statements; sie sind **keine** Implementations-Aussage, **keine** Format-Festlegung und **keine** rechtliche oder steuerliche Auslegung im Einzelfall.

| Boundary | Aussage |
|---|---|
| **Topos-Charakter** | F3-D1 ist im Locked Decisions Register V1.0 §3.10 bereits autoritativ V1.0-locked. V1.0 dieses Folgeartefakts paraphrasiert §3.10 ausschließlich auf Boundary-Lock-Layer-Ebene und trifft **keine** neue Entscheidung. |
| **Anlass-Trennung** | Behördliche Z3-Datenüberlassung ist ein eigenständiger Anlass; sie ist **nicht** identisch mit Mandanten-Export, **nicht** identisch mit Migrations-Export und **nicht** identisch mit DR-Restore. |
| **Negativ-Boundary-Disziplin** | V1.0 ist negativ formuliert: sie legt fest, was Z3 **nicht** ist und welche Inhalte explizit Non-Scope sind. |
| **Plaintext-Boundary** | Plattform-Administration erzeugt **keinen** Z3-Export; ein Z3-Export-Pfad darf **nicht** zur Plaintext-Beschaffung genutzt werden. Diese Disziplin verbleibt autoritativ in Custody V1.0 §5/§13 und Security V1.0 §6/§13. |
| **F3-D1 unverändert** | F3-D1 bleibt autoritativ; V1.0 dieses Folgeartefakts schwächt F3-D1 **nicht**. |
| **F3-Closing-Konsistenz** | Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet **nicht**. |

## 4. Z3-Scope und Anlass-Trennung

Auf Boundary-Topos-Ebene; ausschließlich aus der Paraphrase des Locked Decisions Register §3.10 abgeleitet.

| Aspekt | Aussage |
|---|---|
| **Behördliche Datenüberlassung** | Z3 bezeichnet einen Behörden-Auslieferungs-Anlass im Außenprüfungs-Kontext. V1.0 dieses Folgeartefakts trifft **keine** Aussage über die rechtliche Einordnung dieses Anlasses; sie ist **keine** Steuer- oder Rechtsauskunft. |
| **Anlass-Trennung — Mandanten-Export** | Mandanten-Export (etwa Mandanten-Reporting, Mandanten-Datenexport, Mandanten-Print, Mandanten-Auswertung) ist **kein** Z3-Anlass und **nicht** Bestandteil dieses Folgeartefakts. |
| **Anlass-Trennung — Migrations-Export** | Migrations-Export (etwa System-Migration, Vendor-Migration, Daten-Übernahme aus Drittsystem) ist **kein** Z3-Anlass und verbleibt strikt im Migrations-Folgeartefakt. |
| **Anlass-Trennung — DR-Backup / DR-Restore** | DR-Backup und DR-Restore sind **kein** Z3-Anlass und verbleiben strikt in DR-/HA-/BCM V1.0. Ein DR-Backup darf **nicht** als Z3-Export ausgegeben werden. |
| **Anlass-Trennung — Aufbewahrungs-/Retention-Archiv** | Aufbewahrungs-/Retention-Archiv-Boundary verbleibt strikt Retention V1.0; eine Z3-/Datenüberlassung ist **kein** Substitut für das Retention-Archiv (Retention V1.0 §6.2). |
| **Anlass-Trennung — Datenschutz-Vorfallsprozess** | Datenschutz-Vorfallsprozess gemäß DSGVO Art. 33/34 ist **kein** Z3-Anlass und verbleibt strikt DSGVO-/Datenpannen V1.0. |
| **Anlass-Trennung — Cybersecurity-IR** | Cybersecurity-IR-Workflow (Detection, Containment, Eradication, Recovery, Post-Incident-Review) ist **kein** Z3-Anlass; IR-Pfade dürfen **nicht** als Plaintext-Beschaffungs-Umweg über die Z3-Boundary genutzt werden (IR V1.0 §14). |
| **Lieferweg-Topos** | Datenträger-basierte Auslieferung sowie Datenaustauschplattform-basierte Auslieferung werden ausschließlich als Topoi referenziert. V1.0 dieses Folgeartefakts trifft **keine** Auswahl, **keine** technische Festlegung und **keine** Anbieter-/Plattform-/Datenträger-/Hardware-Wahl. |

## 5. Granularitäts-Boundary

Auf reiner Topos-Ebene.

- **Primärgranularität:** Prüfungszeitraum (paraphrasiert aus Register §3.10). V1.0 dieses Folgeartefakts trifft **keine** Aussage über konkrete Zeitfenster-Berechnung, Frist-Implementierung oder Abgleichs-Logik mit Drittsystemen.
- **Abgeleitete Größen:** Wirtschaftsjahr und Kalenderjahr werden ausschließlich als abgeleitete Größen referenziert. V1.0 dieses Folgeartefakts trifft **keine** Aussage zur Ableitungs-Mechanik.
- **Keine Schwellwerte:** V1.0 trifft **keine** Aussage zu Schwellwerten, Mindestumfang, Höchstumfang, Volumen-Klassen oder Zugriffs-Granularitäts-Klassen. Diese Inhalte verbleiben einem späteren Detail-Folgeartefakt vorbehalten.
- **Keine Periodisierungs-Mechanik:** Konkrete Periodisierung, Stichtag-Logik, Cut-off-Regeln oder Abgrenzungs-Mechaniken sind **Non-Scope**.

## 6. Beschreibungsstandard-Negativ-Quellgrundlage

Auf reiner Topos-Ebene.

- **Beschreibungsstandard als technische Bereitstellungshilfe:** Der Beschreibungsstandard für die Datenträgerüberlassung wird ausschließlich als technische Bereitstellungshilfe referenziert (paraphrasiert aus Register §3.10). Er ist **nicht** Lock-Quelle dieses Folgeartefakts.
- **Keine Felder-Enumeration:** V1.0 dieses Folgeartefakts enumeriert **keine** Beschreibungsstandard-Felder, **keine** Pflicht-/Optional-Felder, **keine** XML-/CSV-/INDEX-/Manifest-Strukturen.
- **Keine Versionsfixierung:** V1.0 trifft **keine** Aussage zu konkreten Versions-Bezeichnungen, Versions-Übergängen oder Pflege-Zyklen des Beschreibungsstandards.
- **Negativ-Erklärung:** Bezugnahmen auf den Beschreibungsstandard erfolgen ausschließlich als Negativ-Hinweis; eine Erhebung zur Lock-Quelle wäre ein STOP-Verstoß.

## 7. Verhältnis zu Aufbewahrungs-/Retention-Archiv V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Aufbewahrungs-/Retention-Archiv (Retention V1.0 §6.2). Die in Retention V1.0 §6.2 etablierte Vergleichs-Tabelle (Zweck, Format, Aufbewahrung) bleibt autoritativ. |
| **Substitutions-Verbot** | Eine Z3-/Datenüberlassung ist **kein** Substitut für das Retention-Archiv (Retention V1.0 §13). |
| **Format-Trennung** | Aufbewahrungs-Formate gemäß Retention V1.0 sind **nicht** identisch mit dem Behörden-Auslieferungs-Topos. V1.0 dieses Folgeartefakts trifft **keine** Format-Festlegung für die Z3-Seite. |
| **Vorrang-Regel** | Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Retention-Archiv-Boundary. |

## 8. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ DR-Backup; Z3-/Datenüberlassung ≠ DR-Restore. Die in DR-/HA-/BCM V1.0 §8 (Vergleichstabelle) und §16 etablierten Trennlinien bleiben autoritativ. |
| **Restore-Mechanik unverändert** | Restore-Mechanik, Restore-Modi (Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic), RPO/RTO-Topoi und Wiederanlauf-Workflows verbleiben strikt DR-/HA-/BCM V1.0. |
| **DR-Backup-Substitutions-Verbot** | Ein DR-Backup darf **nicht** als Z3-Export ausgegeben werden. Restore-Pfade dürfen die Z3-Boundary **nicht** umgehen (DR §16, §21 STOP 21.13). |
| **F3-D2 unverändert** | F3-D2 DR-Anforderungsmodell bleibt autoritativ. RPO/RTO sind Harouda-SLA-/Risk-Targets, **nicht** gesetzlich. |
| **Vorrang-Regel** | Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 9. Verhältnis zu Migrations-Folgeartefakt

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Migration; Z3-/Datenüberlassung ≠ Migrations-Rollback; Z3-/Datenüberlassung ≠ Migrations-Export. Die Anlass-Trennung gemäß Register §3.10 bleibt autoritativ. |
| **Migrations-Mechanik Non-Scope** | Migrations-Mechanik, Migrations-Rollback-Mechanik, Daten-Übernahme-Mechanik und Vendor-Migrations-Workflows verbleiben strikt dem Migrations-Folgeartefakt. |
| **F3-D3 unverändert** | F3-D3 Migration bleibt autoritativ. |
| **Vorrang-Regel** | Bei Konflikt mit dem Migrations-Folgeartefakt gilt jenes für Migrations-/Migrations-Rollback-Boundaries. |

## 10. Verhältnis zu Custody-Modell V1.0 + KMS-/HSM-/Implementations-Folgeartefakt

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Custody-Topologie; Z3-/Datenüberlassung ≠ Schlüssel-Hierarchie; Z3-/Datenüberlassung ≠ Schlüsselrotations-/Zerstörungs-/Wiederherstellungs-Mechanik. |
| **Plaintext-Boundary** | Plattform-Administration erzeugt **keinen** Z3-Export. Ein Z3-Export-Pfad darf **nicht** zur Plaintext-Beschaffung genutzt werden (Custody V1.0 §5/§6/§13/§17; F3-D1). |
| **Custody-Mechanik unverändert** | Konkrete Custody-Topologie, Schlüssel-Hierarchie und KMS-/HSM-Modellwahl verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. |
| **Cross-Mandanten-Verbot** | F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Z3-Pfade. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 11. Verhältnis zu Security-/Krypto-/Key-Custody V1.0 und TR-02102-Detail V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Sicherheits-/Plaintext-Boundary; Z3-/Datenüberlassung ≠ Krypto-/Transport-Parameter-Wahl. |
| **Plaintext-Boundary** | Das in F3-D1 sowie Security V1.0 §6/§13 verankerte Verbot der Plaintext-Beschaffung über Z3-Pfade bleibt unberührt; V1.0 dieses Folgeartefakts respektiert es vollständig. |
| **Krypto-/Transport-Aussage** | V1.0 trifft **keine** Aussage zu konkreten Algorithmen, Modi, Cipher Suites, TLS-Parametern oder Schlüssellängen. Diese Inhalte verbleiben strikt TR-02102-Detail V1.0 (siehe TR-02102-Detail V1.0 §12). |
| **Verschlüsselungs-/Transport-Mechanik Non-Scope** | Container-Verschlüsselung, Datenträger-Verschlüsselung, Übertragungsprotokoll-Wahl und sonstige Verschlüsselungs-/Transport-Mechanik sind **Non-Scope** dieser V1.0. Sie folgen — soweit anwendbar — TR-02102-Detail V1.0 und Security V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. |

## 12. Verhältnis zu ASVS-Control-Referenz V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ ASVS-Verifikation; Z3-/Datenüberlassung ≠ ASVS-Mapping. |
| **ASVS unverändert** | ASVS-Profil-Boundary verbleibt ASVS V1.0. V1.0 dieses Folgeartefakts trifft **keine** ASVS-Konformitäts-Aussage und **keine** ASVS-Verifikations-Aussage. |
| **F3-D1-Wahrung** | ASVS V1.0 §11 bestätigt die F3-D1-Wahrung; V1.0 dieses Folgeartefakts respektiert sie vollständig. |
| **Vorrang-Regel** | Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Boundary. |

## 13. Verhältnis zu DSGVO-/Datenpannen-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Datenschutz-Vorfallsprozess; Z3-/Datenüberlassung ≠ rechtliche Meldepflicht-Auslegung gemäß DSGVO Art. 33/34. |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts trifft **keine** rechtliche Würdigung über die personenbezogene Tragweite einer Z3-/Datenüberlassung. Diese verbleibt strikt DSGVO-/Datenpannen V1.0 sowie der externen rechtlichen Validierung. |
| **Cross-Boundary-Konsistenz** | DSGVO-/Datenpannen V1.0 §17 bestätigt die Trennung; V1.0 dieses Folgeartefakts respektiert sie vollständig. |
| **Vorrang-Regel** | Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

## 14. Verhältnis zu Cybersecurity-Incident-Response-Folgeartefakt V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Cybersecurity-IR-Workflow. |
| **Plaintext-Boundary** | IR-Pfade dürfen **nicht** als Plaintext-Beschaffungs-Umweg über die Z3-Boundary genutzt werden (IR V1.0 §14). V1.0 dieses Folgeartefakts spiegelt diese Disziplin von der Z3-Seite. |
| **Workflow-Trennung** | Detection, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review verbleiben strikt Cybersecurity-IR V1.0; Z3-Anlass ist eigenständig und unabhängig vom IR-Workflow. |
| **Vorrang-Regel** | Bei Konflikt mit Cybersecurity-IR V1.0 gelten dessen Boundary-Inhalte für IR-Workflow-Boundaries. |

## 15. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Lösch-/Sperr-Boundary-Inhalt. Aufbewahrungs-/Retention-Archiv ≠ Z3-Export bleibt unverändert (Lösch-/Sperrkonzept V1.0 §11). |
| **Sperrgrund-Disziplin** | Lösch-/Sperr-Operationen dürfen die F3-Closing-Grenzen — insbesondere F3-D1 — **nicht** berühren oder umgehen (Lösch V1.0 §12 STOP 12.7). |
| **Sperrgrund-„Sicherheits-/Forensik-Halt"** | V1.0 dieses Folgeartefakts trifft **keine** Aussage zur Sperrgrund-Klasse „Sicherheits-/Forensik-Halt"; deren Boundary-Inhalt verbleibt Lösch-/Sperrkonzept V1.0 §7, deren operative Steuerung verbleibt Cybersecurity-IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

## 16. Verhältnis zu Dokumentenkategorie-/Retention-Regelmatrix V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Klassifikation. Klassifikation berührt **keinen** Z3-Export-Pfad und definiert **kein** Z3-Format (Regelmatrix V1.0 §12). |
| **Regelmatrix unverändert** | V1.0 dieses Folgeartefakts erzeugt **keine** neue Dokumentenkategorie und **keine** neue Retention-Regel. |
| **Vorrang-Regel** | Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Boundaries. |

## 17. Verhältnis zu Lohn-DLS-Folgeartefakt

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Lohn-DLS-Tiefe. Lohn-Tiefe gemäß EStG § 41 verbleibt Lohn-DLS-Folgeartefakt. |
| **Lohnsteuer-Außenprüfung außerhalb MVP** | DLS Lohnsteuer-Außenprüfung ist gemäß Locked Decisions Register §3.10 sowie §6 Marker D **außerhalb MVP**. V1.0 dieses Folgeartefakts trifft **keine** lohnspezifische Aussage jenseits dieses Negativ-Verweises. |
| **Vorrang-Regel** | Bei Konflikt mit dem Lohn-DLS-Folgeartefakt gilt jenes für Lohn-DLS-Tiefe. |

## 18. Verhältnis zu Z1-/Z2-Folgeartefakten

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Z3-/Datenüberlassung ≠ Z1-/Z2-Mechanik. Z1- und Z2-Datenzugriffsarten sind eigenständige Folgeartefakte gemäß Locked Decisions Register §6 Sortierungsmarker D. |
| **Vermischungs-Verbot** | V1.0 dieses Folgeartefakts vermischt Z3 **nicht** mit Z1- oder Z2-Mechanik. Eine konkrete Z1-/Z2-Mechanik ist gemäß Register §3.10 ausdrücklich Non-Scope von F3-D1. |
| **Vorrang-Regel** | Bei Konflikt mit den Z1-/Z2-Folgeartefakten gelten jene für Z1-/Z2-Datenzugriffsarten. |

## 19. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Wechselwirkung zwischen Crypto-Shredding und der Z3-Boundary. |
| **Open-Question-Datei unverändert** | V1.0 dieses Folgeartefakts ändert die Open-Question-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage bleibt vor produktiver bzw. behördlicher Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 20. Verhältnis zu §28.11-bet

| Aspekt | Aussage |
|---|---|
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Keine Wechselwirkungs-Aussage** | V1.0 trifft **keine** Aussage zur Wechselwirkung zwischen §28.11-bet und der Z3-Boundary. |
| **Externe Klärung** | Eine etwaige Klärung des §28.11-bet-Status bleibt außerhalb dieses Folgeartefakts. |

## 21. Wahrung gesperrter Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; Z3-/Datenüberlassung hebt Festschreibung **nicht** auf. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Z3-Pfade. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; Plattform-Admin erzeugt **keinen** Z3-Export und erlangt durch Z3-Pfade **keine** Schlüssel-/Plaintext-/Mandantendaten-Einsicht. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Z3-/Datenüberlassung erzeugt **keine** USt-Werte und ändert **keine** festgeschriebenen USt-Aussagen. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ; V1.0 dieses Folgeartefakts paraphrasiert §3.10 ausschließlich auf Boundary-Lock-Layer-Ebene. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ. |
| **F3-D3 Migration** | Bleibt autoritativ. |
| **F3-Closing** | Bleibt autoritativ. Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen. |
| **§28.11-bet** | Bleibt unverändert/offen. |

## 22. Explicit Non-Scope

- Konkrete Z3-Format-Wahl (XML-/CSV-/INDEX-/Manifest-/DSFinV-K-Struktur, Daten-Wörterbuch, Pflicht-/Optional-Felder).
- Enumeration der Daten-Kategorien (verbleibt Z3-Detail-Folgeartefakt).
- Beschreibungsstandard-Felder oder -Versionsfixierung.
- Datenbank-/Dateisystem-Schema; Daten-Modell; Indizes.
- Programmcode; Pseudocode; Algorithmus-Design.
- SQL und Query-Spezifikation.
- API-Definitionen; UI/UX; automatische Jobs; Test-Cases; CI/CD-Konfiguration.
- Speichertechnologie; Datenträger-Hardware-Wahl; Übergabeplattform-Wahl; Cloud-/Anbieter-/Werkzeug-/Bibliotheks-/Plattform-/Hardware-Wahl.
- Verschlüsselungs-/Transport-Mechanik (Container-Verschlüsselung, Datenträger-Verschlüsselung, Übertragungsprotokoll).
- Schlüssel-/Custody-Mechanik; Plaintext-Beschaffungs-Pfad jeglicher Art.
- DR-/Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0).
- Migrations-/Migrations-Rollback-Mechanik (verbleibt Migrations-Folgeartefakt).
- Datenschutz-Vorfallsprozess; Breach-Notification-Inhalte (verbleiben DSGVO-/Datenpannen V1.0).
- Cybersecurity-IR-Workflow (verbleibt IR V1.0).
- Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0).
- Klassifikation (verbleibt Regelmatrix V1.0).
- Aufbewahrungs-/Retention-Archiv-Boundary (verbleibt Retention V1.0).
- ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0).
- Konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter / Schlüssellängen (verbleiben TR-02102-Detail V1.0).
- Custody-Topologie / Schlüssel-Hierarchie (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt).
- Z1-/Z2-Mechanik (verbleibt Z1-/Z2-Folgeartefakte).
- Lohn-DLS-Tiefe; DLS Lohnsteuer-Außenprüfung (außerhalb MVP gemäß Register §3.10/§6).
- Rechtliche Würdigung von Crypto-Shredding (verbleibt eigenständige Open-Question; Status 🔴 offen).
- Externe Normen / Zertifizierungen als Lock-Quelle (insbesondere BSI IT-Grundschutz, BSI TR-03116, ISO 22301, ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA).
- GoBD-/AO-/GDPdU-Volltext-Aufnahme jenseits der Paraphrase im Locked Decisions Register §3.10.
- Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6.
- Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung.
- DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Behörden-Akzeptanz-Behauptung; Konformitäts-, Zertifizierungs-, Audit-, Garantie- oder Freigabe-Behauptungen.
- Änderung oder Reinterpretation von §28.11-bet.
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 23. Wortwahl-Disziplin

V1.0 dieses Folgeartefakts hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz-, Produktiv- oder Freigabe-Behauptungen sind ausgeschlossen — auch nicht in Beispielform innerhalb dieser V1.0.
- Aussagen über externe Norm-Konformität (insbesondere gegenüber BSI-, ISO-, NIST-, ENISA-Quellen) sind ausgeschlossen; externe Normen erscheinen ausschließlich als Negativ-Hinweis und nicht als Lock-Quelle.
- Aussagen über GoBD-/AO-/GDPdU-Konformität im Sinne einer Erfüllungs- oder Anerkennungs-Behauptung sind ausgeschlossen; Bezugnahmen erfolgen ausschließlich über die Paraphrase im Locked Decisions Register §3.10.
- Marketing-/Reife-/Enterprise-/„ready"-Sprache ist ausgeschlossen.
- Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen, die wie eine Auslegung wirken könnten, sind ausgeschlossen.
- Inhalte in arabischer Schrift sind ausgeschlossen; UTF-8-BOM ist ausgeschlossen.
- STOP-Klauseln formulieren generisch und wiederholen sensible Beispiele **nicht** wörtlich.

## 24. STOP-Bedingungen

V1.0 dieses Folgeartefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 24.1 | V1.0 dieses Folgeartefakts verschmilzt die Z3-Boundary mit DR-/HA-/BCM, Migration, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, Retention-Archiv, Regelmatrix, Lösch-/Sperrkonzept, Cybersecurity-IR, DSGVO-/Datenpannen, Lohn-DLS oder der Crypto-Shredding-Rechtsfrage. |
| 24.2 | V1.0 dieses Folgeartefakts importiert externen Norm-/GoBD-/AO-/GDPdU-Volltext oder erhebt eine externe Quelle (insbesondere BSI IT-Grundschutz, BSI TR-03116, ISO 22301, ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA) zur Lock-Quelle. |
| 24.3 | V1.0 dieses Folgeartefakts erstellt eine konkrete Z3-Format-Festlegung (Datenstruktur, Datenfeld-Definitionen, Manifest-Schema, Pflicht-/Optional-Felder, Daten-Wörterbuch). |
| 24.4 | V1.0 dieses Folgeartefakts enumeriert die Daten-Kategorien jenseits eines reinen Topos-Verweises auf Register §3.10. |
| 24.5 | V1.0 dieses Folgeartefakts erhebt den Beschreibungsstandard für die Datenträgerüberlassung zur Lock-Quelle oder enumeriert dessen Felder. |
| 24.6 | V1.0 dieses Folgeartefakts erteilt Rechtsauskunft, Steuerauskunft oder eine rechtliche/steuerliche Entscheidung im Einzelfall. |
| 24.7 | V1.0 dieses Folgeartefakts behauptet behördliche Akzeptanz, externe Konformität, eine Zertifizierung, ein Audit-Ergebnis oder eine produktive Freigabe. |
| 24.8 | V1.0 dieses Folgeartefakts spricht eine Garantie-Aussage gegenüber Mandanten, Behörden oder Aufsichtsstellen aus. |
| 24.9 | V1.0 dieses Folgeartefakts schwächt F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 24.10 | V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet. |
| 24.11 | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei. |
| 24.12 | V1.0 dieses Folgeartefakts enthält Datenbank-/Dateisystem-Schemata, Daten-Modelle, Programmcode, Pseudocode, Algorithmus-Design, SQL, Query-Spezifikation, UI/UX, APIs, automatische Jobs, Test-Cases oder CI/CD-Konfiguration. |
| 24.13 | V1.0 dieses Folgeartefakts wählt Werkzeuge, Anbieter, Cloud-Provider, Plattformen, Bibliotheken, Hardware, Datenträger-Typen, Übergabeplattformen oder Storage-Lösungen. |
| 24.14 | V1.0 dieses Folgeartefakts trifft eine Verschlüsselungs-/Transport-Aussage oder eine Schlüssel-/Custody-Aussage jenseits eines Topos-Verweises auf TR-02102-Detail V1.0, Security V1.0 und Custody V1.0. |
| 24.15 | V1.0 dieses Folgeartefakts vermischt Z3 mit Z1- oder Z2-Mechanik. |
| 24.16 | V1.0 dieses Folgeartefakts trifft eine Lohn-DLS-/Lohnsteuer-Außenprüfungs-Aussage jenseits eines reinen Negativ-Verweises. |
| 24.17 | V1.0 dieses Folgeartefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 24.18 | V1.0 dieses Folgeartefakts öffnet einen Plaintext-Beschaffungs-Umweg über Z3-Pfade oder schwächt das in F3-D1 verankerte Plaintext-Beschaffungs-Verbot. |
| 24.19 | V1.0 dieses Folgeartefakts erstellt oder finalisiert Inhalte für Verfahrensdokumentation Kap. 5 oder Kap. 6. |
| 24.20 | V1.0 dieses Folgeartefakts trifft eine Workflow-Aussage zu Datenschutz-Vorfallsprozess-Inhalten oder Breach-Notification-Inhalten jenseits eines Topos-Verweises auf DSGVO-/Datenpannen V1.0. |
| 24.21 | V1.0 dieses Folgeartefakts trifft eine Workflow-Aussage zu Cybersecurity-IR-Workflow-Inhalten jenseits eines Topos-Verweises auf IR V1.0. |
| 24.22 | V1.0 dieses Folgeartefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 24.23 | V1.0 dieses Folgeartefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |
| 24.24 | Die Forbidden-Reference-Gate-Baseline (BLOCKED, BASELINE_ALLOWED, ALLOW_MARKED) ändert sich durch Aufnahme dieser V1.0 in den Repository-Stand. |

## 25. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **Z3-Detail-Folgeartefakt** | Detail-Boundary jenseits Boundary-Lock-Layer (Datenkategorien-Enumeration, Datenfeld-Definitionen, Manifest-Topiken) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Z1-/Z2-Folgeartefakte** | Eigenständige Folgeartefakte gemäß Register §6 Marker D — Datenzugriffsarten neben Z3 | offen; nicht Bestandteil von V1.0 |
| **Lohn-DLS-Folgeartefakt** | EStG § 41 Lohn-Tiefe; DLS Lohnsteuer-Außenprüfung außerhalb MVP gemäß Register §3.10 / §6 Marker D | offen; nicht Bestandteil von V1.0 |
| **Migrations-Folgeartefakt** | F3-D3-Implementierungs-Boundary | offen; nicht Bestandteil von V1.0 |
| **DR-/HA-/BCM-Operational-Detail** | DR-/HA-/BCM-Boundary jenseits Boundary-Lock-Layer | offen; nicht Bestandteil von V1.0 |
| **KMS-/HSM-/Implementations-Folgeartefakt** | Custody-/Schlüssel-Implementations-Boundary | offen; nicht Bestandteil von V1.0 |
| **Externe steuerprüfungs-fachliche Validierung** | Externer Validierungs-Schritt vor produktiver bzw. behördlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **DSB-Validierung** | Externer DSB-Validierungs-Schritt vor produktiver bzw. rechtsverbindlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Verfahrensdokumentation Kap. 5 / Kap. 6** | Endfassung; Kap. 5 Sicherheit, Kap. 6 Aufbewahrung/Lösch-Sperr | im Rahmen der jeweils nächsten Pflege; **Non-Scope** dieser V1.0 |

V1.0 dieses Folgeartefakts erzeugt **keine** Implementierung, **keine** Konfiguration und **keinen** Mechanismus.

## 26. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Behörden-Akzeptanz-Behauptung; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden oder Aufsichtsstellen |
| **STOP-Bedingungen** | 24 Klauseln (§24.1 — §24.24) |
| **Bindend für** | Alle in Abschnitt 25 genannten Folgeartefakte; Verfahrensdokumentation Kap. 5 und Kap. 6 (im Rahmen ihrer jeweils nächsten Pflege) hinsichtlich der Trennlinien dieses Artefakts; alle nachgelagerten Detail-Artefakte zu Z3-Themen. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen DR-/HA-/BCM, Migration, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, Retention-Archiv, Regelmatrix, Lösch-/Sperrkonzept, Cybersecurity-IR, DSGVO-/Datenpannen, Lohn-DLS, Z1-/Z2 sowie die Crypto-Shredding-Rechtsfrage. |
| **Nicht bindend für** | Konkretes Z3-Format. Datenkategorien-Enumeration. Beschreibungsstandard-Felder oder -Versionsfixierung. Datenmodell/Schema. UI/UX. Programmcode. Pseudocode. Algorithmus-Design. SQL. APIs. Automatische Jobs. Test-Cases. CI/CD-Konfiguration. Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Übergabeplattform-/Storage-Wahl. Konkrete Verschlüsselungs-/Transport-Mechanik. Konkrete Schlüssel-/Custody-Mechanik. Konkrete Restore-Mechanik. Migrations-Mechanik. Lohn-Tiefe. Z1-/Z2-Mechanik. Rechtliche Würdigung von Crypto-Shredding. Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | Z3-/Datenüberlassung ≠ Aufbewahrungs-/Retention-Archiv. Z3-/Datenüberlassung ≠ DR-Backup. Z3-/Datenüberlassung ≠ DR-Restore. Z3-/Datenüberlassung ≠ Migration. Z3-/Datenüberlassung ≠ Migrations-Rollback. Z3-/Datenüberlassung ≠ Migrations-Export. Z3-/Datenüberlassung ≠ Custody-Topologie. Z3-/Datenüberlassung ≠ Schlüssel-Hierarchie. Z3-/Datenüberlassung ≠ Plaintext-Beschaffungs-Pfad. Z3-/Datenüberlassung ≠ Krypto-/Transport-Parameter-Wahl. Z3-/Datenüberlassung ≠ ASVS-Verifikation. Z3-/Datenüberlassung ≠ ASVS-Mapping. Z3-/Datenüberlassung ≠ Datenschutz-Vorfallsprozess. Z3-/Datenüberlassung ≠ Cybersecurity-IR-Workflow. Z3-/Datenüberlassung ≠ Lösch-/Sperr-Boundary-Inhalt. Z3-/Datenüberlassung ≠ Klassifikation. Z3-/Datenüberlassung ≠ Lohn-DLS-Tiefe. Z3-/Datenüberlassung ≠ Z1-/Z2-Mechanik. Z3-/Datenüberlassung ≠ Crypto-Shredding-Rechtswürdigung. Z3-/Datenüberlassung ≠ KMS-/HSM-/Implementations-Folgeartefakt. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Z3-Pfade. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; Plattform-Admin erzeugt **keinen** Z3-Export. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §3.10 / F3-D1 gilt §3.10. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 oder Custody V1.0 gilt jeweils diese Quelle für Sicherheits-/Plaintext-/Custody-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |
| **Verankerungs-Hinweis** | Das Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker A** eigenständig enumeriert (Eintrag: „Z3-Export-Spezifikations-Artefakt — Technische Konkretisierung von F3-D1"). Sortierungsmarker A ist nicht-bindender Priorisierungs-Vorschlag. F3-D1 selbst ist im Register §3.10 V1.0-locked; V1.0 dieses Folgeartefakts paraphrasiert §3.10 ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert den Register **nicht**. |
| **Externe Validierung** | Vor produktiver bzw. behördlicher Anwendung sind eine externe steuerprüfungs-fachliche Validierung sowie ggf. eine DSB-/Sicherheits-/Produktivfreigabe erforderlich. Beide sind **Non-Scope** von V1.0. |

## 27. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **nicht** Bestandteil eines externen Audit- oder Zertifizierungs-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Schärfung der Anti-Garantie-/Anti-Konformitäts-/Anti-Zertifizierungs-/Anti-Behörden-Akzeptanz-Wortwahl; Klarstellung der Anlass-Trennung gegenüber Mandanten-Export, Migrations-Export, DR-Backup und Aufbewahrungs-/Retention-Archiv; ausdrückliche Aufnahme von BSI IT-Grundschutz, BSI TR-03116, ISO 22301, ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA in die Negativ-Quellgrundlage; Marker-A-Verankerungs-Hinweis im Register §6 klargestellt; Plaintext-Boundary-Spiegelung gegenüber Custody V1.0 + Security V1.0 verankert; Beschreibungsstandard ausschließlich als technische Bereitstellungshilfe und **nicht** als Lock-Quelle verankert; Crypto-Shredding-Rechtsfrage als ausdrücklicher Open-Question-Verweis ohne Würdigung in V1.0 verankert; in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; Detail-Folgeartefakte (Z3-Detail, Z1-/Z2, Lohn-DLS, Migrations-Folgeartefakt, KMS-/HSM-/Implementations-Folgeartefakt) werden eigenständig versioniert. Eine externe steuerprüfungs-fachliche Validierung sowie ggf. eine DSB-/Sicherheits-/Produktivfreigabe bleiben vor produktiver bzw. behördlicher Anwendung erforderlich. |
