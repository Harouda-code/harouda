# Migrations-Folgeartefakt V1.0

**Lock-Aussage:** Migrations-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im *Harouda Locked Decisions Register V1.0* §3.12 („F3-D3 Migrations-Spezifikation V1.0 — locked") sowie §3.13 (F3-Closing) bereits autoritativ angelegte Migrations-Boundary auf der Ebene paraphrasierter Topoi: Migration ausschließlich als Formatumsetzung ohne Inhaltsänderung; importierte Fremdsystem-Festschreibungen bleiben historische Fremdsystem-Tatsachen; importierte Fremdsystem-USt-Werte bleiben historische Fremdsystemwerte; Cutover ist Grenze, kein Beförderungsweg; Mehrmandanten-Lauf ausschließlich mit getrennten Paketen, Manifesten, Audit-Spuren, Freigaben und Roll-back-Pfaden; Roll-back ≠ DR-Restore; Plattform-Admin nur technisch, ohne fachliche Migrationsentscheidung und ohne Inhalts-/Secrets-Zugriff. V1.0 modifiziert F3-D3 **nicht**. V1.0 autorisiert **keine** Implementierung. V1.0 enthält **keine** konkrete Migrations-Mechanik, **keine** Datenmapping-/Feld-Mapping-/ETL-/Reconciliation-/Cleansing-Regeln, **keine** Cutover-Workflow-Schritte, **keine** Roll-back-Skripte, **keine** Migrations-Abbruchs-Mechanik, **keine** Schema-/Daten-Wörterbuch-/Manifest-/UI-/API-/Code-/SQL-Aussage und **keine** Werkzeug-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-Wahl. V1.0 vermischt Migrations-Rollback **nicht** mit DR-Restore und nimmt **keine** Lohn-DLS-/Z1-/Z2-Aussage jenseits eines Negativ-Verweises vor. V1.0 nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** Behörden-Akzeptanz, **keine** externe Zertifizierung, **kein** Audit-Ergebnis und **keine** Konformität gegenüber externen Normen. §28.11-bet bleibt unverändert/offen. Eine externe steuerprüfungs-fachliche Validierung sowie ggf. eine DSB-/Sicherheits-/Produktivfreigabe bleibt vor produktiver Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Behörden-Akzeptanz-Behauptung; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden oder Aufsichtsstellen; **keine** Migrations-Erfolgs- oder Verlustfreiheits-Garantie |
| Scope | Boundary-Aussagen zu: F3-D3-Operationalisierung auf Boundary-Lock-Layer-Ebene als reine Topos-Paraphrase; Migrations-Topoi (Mandanten-Migration, Kanzlei-Vollmigration, Cloud-Provider-Exit, Plattform-Wechsel, Inbound aus Fremdsoftware, Outbound an Zielsoftware, Test-Migration, Parallel-Betrieb, Roll-back / Migrations-Abbruch); Inhaltliche Migrations-Disziplin (Formatumsetzung ohne Inhaltsänderung; Cutover als Grenze, nicht Beförderungsweg); Mehrmandanten-Migrations-Disziplin (getrennte Pakete/Manifeste/Audit-Spuren/Freigaben/Roll-back-Pfade); Test-Migrations-Boundary (DSGVO-Rechtsgrundlage, Zweckbindung, F0-D7-Freigabe, F0-D6-Mandantentrennung, Bereinigungspflicht, Audit-Spur — alles als Topoi); Quellpaket-Boundary (statusgesichert, herkunftsgesichert, integritätsgesichert — als Topoi); Roll-back-Boundary (Roll-back ≠ DR-Restore; fünf Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz — als Topoi); Plattform-Admin-Boundary (rein technische Ausführung; keine fachliche Migrationsentscheidung; kein Inhalts-/Secrets-Zugriff); Trennlinien gegenüber Aufbewahrungs-/Retention-Archiv, DR-/HA-/BCM, Z3-/Datenüberlassung, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, DSGVO-/Datenpannen, Cybersecurity-IR, Lösch-/Sperrkonzept, Regelmatrix, Z1-/Z2, Lohn-DLS; Cross-Boundary-Konsistenz mit allen 11 gesperrten Vorgänger-V1.0-Specs und gesperrten Harouda-Locks |
| Non-Scope | Konkrete Migrations-Mechanik, Cutover-Workflow-Implementierung, Roll-back-Skripte, Migrations-Abbruchs-Mechanik; Datenmapping-Tabellen, Feld-Mappings, Wert-Übersetzungs-Tabellen; ETL-Regeln, Daten-Cleansing-Regeln, Reconciliation-Algorithmen, Datenqualitäts-Schwellwerte; Import-/Export-Schemata, Daten-Wörterbücher, Quell-/Ziel-System-Adapter, Manifest-Strukturen; Datenbank-Migrations-Skripte, DDL, DML, SQL und Query-Spezifikation; Programmcode, Pseudocode, Algorithmus-Design, API-Definitionen, UI/UX, automatische Jobs, Test-Cases, CI/CD-Konfiguration; Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-Wahl; konkrete produktive Migrations-Fenster, Live-Cutover-Pläne, Eskalations-Trigger-Werte; DR-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0); Z3-Format / Behörden-Auslieferungs-Mechanik (verbleibt Z3 V1.0); Retention-Archiv-Speicher-Implementierung (verbleibt Retention V1.0); Custody-Topologie / Schlüsselhierarchie / Plaintext-Beschaffungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt); konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter (verbleiben TR-02102-Detail V1.0); ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0); Datenschutz-Vorfallsprozess / Breach-Notification-Inhalte (verbleiben DSGVO-/Datenpannen V1.0); Cybersecurity-IR-Workflow (verbleibt IR V1.0); Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0); Klassifikation (verbleibt Regelmatrix V1.0); Z1-/Z2-Mechanik (verbleibt Z1-/Z2-Folgeartefakte); Lohn-DLS-Tiefe (verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP); rechtliche Würdigung von Crypto-Shredding (verbleibt Open-Question); externe Normen / Zertifizierungen als Lock-Quelle (insbesondere ISO 22301, ISO 27035, BSI IT-Grundschutz, BSI TR-03116, NIST SP 800-61, NIST SP 800-86, ENISA); GoBD-/AO-/DSGVO-Volltext-Aufnahme jenseits der Paraphrase im Locked Decisions Register §3.12; Garantie-Aussagen jeglicher Art; Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Behörden-Akzeptanz-Behauptung; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register V1.0 §3.12 (F3-D3 Migrations-Spezifikation V1.0 — locked; Kernaussagen, Boundaries, 71 STOP-Kandidaten; bindend für „Migrations-Folgeartefakte und Cutover-Workflow-Folgeartefakte"); Locked Decisions Register V1.0 §3.13 / F3-Closing (DR-Restore ≠ Migration-Roll-back; Z3-Export ≠ Migrations-Export; Migration ≠ native Re-Festschreibung; §4.2 Festschreibungs-Hierarchie F3-D3; §4.3 Mandantentrennungs-Hierarchie F3-D3; §4.4 Plattform-Admin-Grenze F3-D3); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §6.3 (Retention-Archiv vs. Migration), §6.4 (DR-Restore vs. Migrations-Rollback), §15/§17; DR-/HA-/BCM-Folgeartefakt V1.0 §1 (Trennung DR-Backup vs. Aufbewahrung vs. Z3 vs. Migration), §6 („DR-Restore ≠ Migrations-Rollback"), §8 (Vergleichstabelle), §17 („Verhältnis zu Migration" — eigene Section), §20 Boundary-Confirmation, §21 STOP 21.13; Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 §4 (Anlass-Trennung Z3 ≠ Migrations-Export), §9 („Verhältnis zu Migrations-Folgeartefakt" — eigene Section), §22 Non-Scope, §24 STOP 24.1, §25 Downstream; Security-/Krypto-/Key-Custody-Artefakt V1.0 §10 (DR/Backup/Restore-Boundary), §17 (Downstream); Custody-Modell-Boundary-Artefakt V1.0 §3/§10/§11/§13 (Restore-/Migrations-/Z3-Schutz), §15 (Downstream); Lösch-/Sperrkonzept-Artefakt V1.0 §10/§11/§14, STOP 12.7; Dokumentenkategorie-/Retention-Regelmatrix V1.0 §10 (F3-D3-Wahrung), §16 (Downstream), STOP 14.12; ASVS-Control-Referenz-Artefakt V1.0 §11 (F3-D3-Wahrung), §14 (Downstream); TR-02102-Detail-Artefakt V1.0 §15 (F3-D3-Wahrung), §18 (Downstream), STOP 16.9; Cybersecurity-Incident-Response-Folgeartefakt V1.0 §17 STOP 21.1, §19 Boundaries („IR ≠ Migration"), §22 Downstream; DSGVO-/Datenpannen-Folgeartefakt V1.0 §17 (Verhältnis zu Z3 / Migration / Lohn-DLS), §20 STOP 20.1, §22 Non-Scope; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §3.12 / F3-D3 gilt §3.12 als autoritative Quelle; V1.0 dieses Folgeartefakts paraphrasiert §3.12 ausschließlich auf Boundary-Lock-Layer-Ebene und ändert §3.12 **nicht**. Bei Konflikt mit §3.13 / F3-Closing gilt F3-Closing als Cross-Boundary-Authoritat. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für DR-Restore-/Wiederherstellungs-Boundaries (insbesondere DR-Restore ≠ Migrations-Rollback). Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 oder Custody V1.0 gilt jeweils diese Quelle für Sicherheits-/Plaintext-/Custody-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

**Wichtiger Hinweis zur Verankerung:** Das Migrations-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* §3.12 (F3-D3 Migrations-Spezifikation V1.0 — locked) ausdrücklich als Downstream verankert: „Bindend für: Migrations-Folgeartefakte und Cutover-Workflow-Folgeartefakte." Damit ist die Bindungsgrundlage dieses Artefakts repository-intern eindeutig verankert. V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht**.

## 2. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §3.12 | F3-D3 Migrations-Spezifikation V1.0 — locked; Kernaussagen (Mandanten-Migration, Kanzlei-Vollmigration, Cloud-Provider-Exit, Plattform-Wechsel, Inbound, Outbound, Test-Migration, Parallel-Betrieb, Roll-back; Migration nur Formatumsetzung ohne Inhaltsänderung; importierte Fremdsystem-Festschreibungen bleiben historische Fremdsystem-Tatsachen; importierte Fremdsystem-USt-Werte bleiben historische Fremdsystemwerte; Cutover ist Grenze; Mehrmandanten-Lauf nur mit getrennten Paketen/Manifesten/Audit-Spuren/Freigaben/Roll-back-Pfaden; Test-Migration mit Produktivdaten nur unter DSGVO-Rechtsgrundlage, Zweckbindung, F0-D7-Freigabe, F0-D6-Mandantentrennung, Art. 32 DSGVO, Bereinigungspflicht, Audit-Spur; Quellpaket statusgesichert/herkunftsgesichert/integritätsgesichert; Roll-back ≠ DR-Restore; fünf Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz; Plattform-Admin technisch, keine fachliche Entscheidung, kein Inhalts-/Secrets-Zugriff); Boundaries (keine eigene Fachentscheidung, keine Schema-/UI-/Code-/SQL-/Tool-Aussage); Bindend für „Migrations-Folgeartefakte und Cutover-Workflow-Folgeartefakte"; 71 STOP-Kandidaten | **Direkte autoritative Lock-Basis** |
| Locked Decisions Register V1.0 §3.13 / F3-Closing | „DR-Restore ≠ Migration-Roll-back"; „Z3-Export ≠ Migrations-Export"; „Migration ≠ native Re-Festschreibung"; §4.2 F3-D3 (Migration darf Quell-Festschreibung nicht in native F0-D4 umdeuten; Cutover ist Grenze); §4.3 F3-D3 (getrennte Pakete/Manifeste/Audit-Spuren/Freigaben/Roll-back-Pfade); §4.4 F3-D3 (keine fachliche Migrationsentscheidung, kein Inhalts-/Secrets-Zugriff) | **Cross-Boundary-Authoritat** |
| Locked Decisions Register V1.0 §6 Sortierungsmarker A | „Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze" | Indirekter Plattform-Admin-Anker |
| Locked Decisions Register V1.0 §3 Cross-Refs | „GoBD 2024 — Migration (F3-D3, GoBD Rz. 142–144)"; „DSGVO Art. 20 — eng auszulegen im Migrations-Kontext"; „DSGVO Art. 32 — Zugriffsbeschränkung in Test-Migration" | Topos-Verweis |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | §1 Non-Scope „Migration, Migrations-Rollback"; §6.3 Retention-Archiv-vs-Migration-Vergleichstabelle; §6.4 DR-Restore vs. Migrations-Rollback; §15/§17 Non-Scope/Downstream | **Direkter Trennlinien-Anker** Retention vs. Migration |
| DR-/HA-/BCM-Folgeartefakt V1.0 | §1 Scope (Trennung DR-Backup vs. Aufbewahrung vs. Z3 vs. Migration); §1 Non-Scope „Migrations-Rollback-Mechanik (verbleibt Migrations-Folgeartefakt)"; §6 „DR-Restore ≠ Migrations-Rollback"; §8 Vergleichstabelle (DR-Backup, Retention-Archiv, Z3, Migration); §17 „Verhältnis zu Migration" (eigene Section); §20 Boundary-Confirmation; §21 STOP 21.13 (Verschmelzung mit Z3) | **Zentraler Trennlinien-Anker** DR vs. Migration |
| Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0 | §4 Anlass-Trennung (Z3 ≠ Migrations-Export); §9 „Verhältnis zu Migrations-Folgeartefakt" (eigene Section); §22 Non-Scope; §24 STOP 24.1; §25 Downstream („Migrations-Folgeartefakt — F3-D3-Implementierungs-Boundary; offen") | **Direkter Downstream-Verweis** auf das Migrations-Folgeartefakt |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | §1 Non-Scope „Migrations-Implementierung"; §10 DR/Backup/Restore-Boundary („DR-Restore ≠ Migrations-Rollback"); §17 Downstream-Auftrag; §19 Lock-Profil-Boundaries | Plaintext-/Custody-Boundary über Migrations-Pfade |
| Custody-Modell-Boundary-Artefakt V1.0 | §3 Cross-Ref; §10 Verhältnis; §11 F3-D2-Wahrung; §13 Restore-/Migrations-/Z3-Schutz („sinngemäß im Migrations-Kontext, F3-D3"); §15 Downstream | **Plaintext-Boundary-Anker** über Migrations-Pfade |
| Lösch-/Sperrkonzept-Artefakt V1.0 | §10 Cross-Boundary; §11 Verhältnis; §14 Downstream; STOP 12.7 (Lösch-/Sperr-Operation darf F3-Closing nicht berühren) | Negativ-Anker |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | §10 F3-Wahrung; §16 Downstream; STOP 14.12 (kein Z3-/Datenüberlassungs-Format, kein DR-/HA-/BCM-Design, keine Migrations-Implementierung) | Negativ-Anker |
| ASVS-Control-Referenz-Artefakt V1.0 | §11 F3-D3-Wahrung; §14 Downstream | Negativ-Anker |
| TR-02102-Detail-Artefakt V1.0 | §15 F3-D3-Wahrung; §18 Downstream; STOP 16.9 (Verschmelzung mit Migration verboten) | Negativ-Anker |
| Cybersecurity-Incident-Response-Folgeartefakt V1.0 | §17 STOP 21.1 (Verschmelzung mit Migration verboten); §19 Boundaries („IR ≠ Migration"); §22 Downstream | Negativ-Anker |
| DSGVO-/Datenpannen-Folgeartefakt V1.0 | §17 „Verhältnis zu Z3 / Migration / Lohn-DLS"; §20 STOP 20.1 (Verschmelzung mit Migration verboten); §22 Non-Scope | Negativ-Anker |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | Status 🔴 offen; Release-Blocker für produktive Anwendung | Nur Verweis; **keine** rechtliche Würdigung in V1.0 |

Ausdrücklich **keine** externen Lock-Quellen: ISO 22301, ISO 27035, BSI IT-Grundschutz, BSI TR-03116, NIST SP 800-61, NIST SP 800-86, ENISA sowie GoBD-/AO-/DSGVO-Volltext sind **nicht** Lock-Quelle dieses Artefakts. Bezugnahmen auf GoBD-Rz.-142–144 und DSGVO Art. 20/32 erfolgen ausschließlich über die Paraphrase im Locked Decisions Register §3.12.

## 3. Core Boundaries

Die folgenden Aussagen sind Boundary-Statements; sie sind **keine** Implementations-Aussage, **keine** Mechanik-Festlegung und **keine** rechtliche oder steuerliche Auslegung im Einzelfall.

| Boundary | Aussage |
|---|---|
| **Topos-Charakter** | F3-D3 ist im Locked Decisions Register §3.12 bereits autoritativ V1.0-locked. V1.0 dieses Folgeartefakts paraphrasiert §3.12 ausschließlich auf Boundary-Lock-Layer-Ebene und trifft **keine** neue Entscheidung. |
| **Migration als eigenständiges Topik** | Migration ist ein eigenständiges Boundary-/Spec-Topik unter F3-D3 und keine Sub-Topik einer anderen Boundary. |
| **Migration ≠ DR-Restore** | DR-Backup-/DR-Restore-Mechanik verbleibt strikt DR-/HA-/BCM V1.0 (F3-D2). |
| **Migrations-Rollback ≠ DR-Restore** | Roll-back ist die Rückabwicklung einer geplanten Modell-/Systemänderung; DR-Restore ist der Wiederanlauf nach technischer Störung. Beide sind nicht gleichsetzbar (F3-Closing §3.13; Retention V1.0 §6.4; DR V1.0 §17). |
| **Migration ≠ Z3-/Datenüberlassung** | Behörden-Auslieferungs-Boundary verbleibt strikt Z3 V1.0 (F3-D1). Migrations-Export und Z3-Export sind getrennte Anlässe. |
| **Migrations-Export ≠ Z3-Export** | Beide verbleiben getrennt (F3-Closing §3.13; Z3 V1.0 §4/§9). |
| **Migration ≠ Aufbewahrungs-/Retention-Archiv** | Retention-Archiv-Boundary verbleibt strikt Retention V1.0 (Retention V1.0 §6.3). |
| **Migration ≠ Custody / Schlüssel / Plaintext-Umweg** | Migrations-Pfade dürfen **nicht** zur Plaintext-Beschaffung durch Plattform-Administration genutzt werden (Custody V1.0 §13; Security V1.0 §10; F0-D7). |
| **Keine native F0-D4-Re-Festschreibung** | Migration darf Quell-Festschreibung **nicht** in native F0-D4-Festschreibung umdeuten (F3-Closing §3.13 §4.2). |
| **Importierte Fremdsystem-Festschreibungen** | Bleiben historische Fremdsystem-Tatsachen (paraphrasiert §3.12). |
| **Importierte Fremdsystem-USt-Werte** | Bleiben historische Fremdsystemwerte; **keine** nativen F1-D1/F1-D2-Werte (paraphrasiert §3.12; F3-Closing §3.13). |
| **Cutover ist Grenze, kein Beförderungsweg** | Paraphrasiert §3.12; F3-Closing §4.2. |
| **Plattform-Admin nur technisch** | Plattform-Admin führt Migrations-Operationen technisch aus; **keine** fachliche Migrationsentscheidung; **kein** Inhalts-/Secrets-Zugriff (paraphrasiert §3.12; F3-Closing §4.4; F0-D7). |
| **F3-D3 unverändert** | F3-D3 bleibt autoritativ; V1.0 dieses Folgeartefakts schwächt F3-D3 **nicht**. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |

## 4. Migrations-Scope und Topoi

Auf Boundary-Topos-Ebene; ausschließlich aus der Paraphrase des Locked Decisions Register §3.12 abgeleitet; **keine** Mechanik, **keine** Implementierung, **keine** Tool-/Werkzeug-Wahl.

| Topos | Aussage |
|---|---|
| **Mandanten-Migration** | Boundary-Topos für Migrations-Vorgänge auf Mandanten-Ebene. Konkrete Mechanik ist Non-Scope. |
| **Kanzlei-Vollmigration** | Boundary-Topos für Migrations-Vorgänge auf Kanzlei-Ebene; benötigt separates Kanzlei-Paket und strikt getrennte Mandanten-Pakete (paraphrasiert §3.12 + §4.3). |
| **Cloud-Provider-Exit** | Boundary-Topos für Anbieter-/Cloud-Wechsel-Anlässe. Konkrete Anbieter-/Cloud-Wahl ist Non-Scope. |
| **Plattform-Wechsel** | Boundary-Topos für Plattform-/Technologie-Wechsel. Konkrete Plattform-/Technologie-Wahl ist Non-Scope. |
| **Inbound aus Fremdsoftware** | Boundary-Topos für Daten-Übernahmen aus Drittsystemen. Konkrete Quell-System-Adapter sind Non-Scope. |
| **Outbound an Zielsoftware** | Boundary-Topos für Daten-Abgaben an Drittsysteme. Konkrete Ziel-System-Adapter sind Non-Scope. |
| **Test-Migration** | Boundary-Topos für nicht-produktive Migrations-Vorgänge zu Verifikationszwecken. Test-Migrations-Boundary siehe §7. |
| **Parallel-Betrieb** | Boundary-Topos für temporären Mehrsystem-Betrieb. Konkrete Replikations-/Sync-/Reconciliation-Mechanik ist Non-Scope. |
| **Roll-back / Migrations-Abbruch** | Boundary-Topos für Rückabwicklung oder Abbruch eines Migrations-Vorgangs. Roll-back-Boundary siehe §9. |

V1.0 dieses Folgeartefakts trifft **keine** Aussage zur Reihenfolge, Priorisierung oder Eskalation dieser Topoi.

## 5. Inhaltliche Migrations-Disziplin

Auf Boundary-Topos-Ebene; ausschließlich aus §3.12 paraphrasiert.

- **Formatumsetzung ohne Inhaltsänderung:** Migration darf nur Formatumsetzung leisten und **keine** inhaltliche Änderung der zu migrierenden Daten vornehmen. Fachliche Datenänderungen, Korrekturen, Bereinigungen oder Neu-Bewertungen sind **kein** Bestandteil eines Migrations-Vorgangs.
- **Importierte Fremdsystem-Festschreibungen bleiben Fremdsystem-Tatsachen:** Eine importierte Fremdsystem-Festschreibung wird **nicht** in eine native F0-D4-Festschreibung umgedeutet. Sie bleibt eine historische Fremdsystem-Tatsache.
- **Importierte Fremdsystem-USt-Werte bleiben Fremdsystemwerte:** Eine importierte Fremdsystem-USt-Aussage wird **nicht** in einen nativen F1-D1/F1-D2-Wert umgedeutet. Sie bleibt ein historischer Fremdsystemwert.
- **Cutover ist Grenze, kein Beförderungsweg:** Der Cutover-Zeitpunkt trennt Quellsystem-Tatsachen von Zielsystem-Tatsachen. Ein Cutover „befördert" **keine** Quell-Festschreibungen oder Quell-USt-Werte in den nativen F0-D4-/F1-D1-/F1-D2-Status.
- **Konsistenz mit F0-D4 und F1-D1/F1-D2:** F0-D4 Festschreibung bleibt unberührt; Migration erzeugt **keine** native Festschreibung. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt; Migration erzeugt **keine** USt-Werte.
- **Keine inhaltliche Korrektur über Migrations-Pfade:** Migration ist **kein** Korrektur-Vehikel und **kein** Re-Bewertungs-Vehikel.

## 6. Mehrmandanten-Migrations-Disziplin

Auf Boundary-Topos-Ebene; ausschließlich aus §3.12 + §4.3 paraphrasiert.

- **Getrennte Pakete:** Mehrmandanten-Migrations-Lauf ausschließlich mit getrennten Mandanten-Paketen.
- **Getrennte Manifeste:** Jedes Mandanten-Paket erhält ein eigenes Manifest. Konkrete Manifest-Struktur ist Non-Scope.
- **Getrennte Audit-Spuren:** Jeder Mandanten-Migrations-Lauf wird in einer getrennten Audit-Spur dokumentiert. Konkrete Audit-Schema-Felder sind Non-Scope.
- **Getrennte Freigaben:** Jeder Mandanten-Migrations-Lauf erhält eine eigene Freigabe. Konkrete Freigabe-Workflow-Schritte sind Non-Scope.
- **Getrennte Roll-back-Pfade:** Jeder Mandanten-Migrations-Lauf verfügt über einen eigenen Roll-back-Pfad. Konkrete Roll-back-Skripte sind Non-Scope.
- **Kanzlei-Vollmigration:** Benötigt zusätzlich ein separates Kanzlei-Paket; die Mandanten-Pakete bleiben strikt getrennt.
- **F0-D6 Mandantentrennung bleibt autoritativ.** **Kein** Cross-Mandanten-Datenfluss in Migrations-Pfaden, weder beim Quellpaket noch beim Cutover noch beim Roll-back.
- **Konsistenz mit F3-Closing §4.3.**

## 7. Test-Migrations-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus §3.12 paraphrasiert.

- **DSGVO-Rechtsgrundlage:** Test-Migration mit Produktivdaten erfordert eine DSGVO-Rechtsgrundlage. Konkrete rechtliche Auslegung im Einzelfall ist Non-Scope; sie verbleibt der Rechts-/DSB-Funktion außerhalb dieses Folgeartefakts.
- **Zweckbindung:** Test-Migration ist zweckgebunden auf Verifikations-Zwecke; eine Nutzung der Test-Migration für andere Zwecke ist ausgeschlossen.
- **F0-D7-Freigabe:** Test-Migration mit Produktivdaten erfordert eine F0-D7-Plattform-Admin-Freigabe als Topos-Verweis; konkreter Freigabe-Workflow ist Non-Scope.
- **F0-D6-Mandantentrennung:** Bleibt auch in der Test-Migration autoritativ.
- **DSGVO Art. 32 Topos:** Zugriffsbeschränkung in der Test-Migration als Topik-Verweis. Konkrete technische Maßnahmen sind Non-Scope.
- **Bereinigungspflicht:** Nach Abschluss der Test-Migration sind die in der Testumgebung verarbeiteten Produktivdaten zu bereinigen. Konkrete Bereinigungs-Mechanik ist Non-Scope.
- **Audit-Spur:** Test-Migration wird in einer Audit-Spur dokumentiert. Konkrete Audit-Schema-Felder sind Non-Scope.
- **Keine produktiven Konsequenzen:** Eine Test-Migration darf **keine** produktiven F0-D4-/F1-D1-/F1-D2-Konsequenzen erzeugen.

## 8. Quellpaket-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus §3.12 paraphrasiert.

- **Statusgesicherte Quelle:** Das Quellpaket entstammt einer statusgesicherten Quelle; konkrete Status-Kriterien und Status-Verifikations-Mechanik sind Non-Scope.
- **Herkunftsgesicherte Quelle:** Das Quellpaket entstammt einer herkunftsgesicherten Quelle; konkrete Herkunfts-Verifikations-Mechanik ist Non-Scope.
- **Integritätsgesicherte Quelle:** Das Quellpaket entstammt einer integritätsgesicherten Quelle; konkrete Integritäts-Verifikations-Mechanik (Hash-Verfahren, Signatur-Verfahren, Manifest-Felder) ist Non-Scope und verbleibt — soweit anwendbar — TR-02102-Detail V1.0 + Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt.
- **Keine Plaintext-Beschaffung über Quellpakete:** Die Disziplin „Verbot einseitiger Plaintext-Macht" gemäß Custody V1.0 §13 + Security V1.0 §10 + F0-D7 gilt sinngemäß auch für Quellpakete. Migrations-Pfade dürfen **nicht** zur Plaintext-Beschaffung genutzt werden.
- **Keine Quell-Re-Festschreibung:** Das Quellpaket ändert seinen Festschreibungs-Status durch die Übernahme **nicht** in einen nativen F0-D4-Status.

## 9. Roll-back-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus §3.12 paraphrasiert.

- **Roll-back ≠ DR-Restore:** Roll-back ist die Rückabwicklung einer geplanten Modell-/Systemänderung. DR-Restore ist der Wiederanlauf nach technischer Störung. Beide sind nicht gleichsetzbar (Retention V1.0 §6.4; DR V1.0 §17; F3-Closing §3.13).
- **Fünf Pflichtvoraussetzungen-Topos:** Roll-back unterliegt fünf Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz. V1.0 dieses Folgeartefakts trifft **keine** Aussage zur konkreten Ausgestaltung dieser Pflichtvoraussetzungen; ihre konkrete Form verbleibt einem späteren Migrations-Detail-Folgeartefakt vorbehalten.
- **Keine destruktive Überschreibung:** Roll-back darf **keine** F3-D2-Destructive-Overwrite-Schutz-Disziplin schwächen.
- **Mandantentrennung im Roll-back:** F0-D6 bleibt im Roll-back autoritativ; getrennte Roll-back-Pfade pro Mandanten-Paket.
- **Plattform-Admin-Disziplin im Roll-back:** Keine fachliche Roll-back-Entscheidung durch Plattform-Administration; kein Inhalts-/Secrets-Zugriff.
- **Keine produktive Erst-Festschreibung im Roll-back:** Ein Roll-back erzeugt **keine** native F0-D4-Festschreibung und **keine** native F1-D1/F1-D2-USt-Aussage.

## 10. Plattform-Admin-Boundary

Auf Boundary-Topos-Ebene; ausschließlich aus §3.12 + §4.4 + F0-D7 paraphrasiert.

- **Technische Migrations-Ausführung:** Plattform-Admin führt Migrations-Operationen technisch aus.
- **Keine fachliche Migrationsentscheidung:** Plattform-Admin trifft **keine** fachliche Entscheidung über Migrations-Inhalte, -Bewertungen, -Korrekturen oder -Klassifikationen.
- **Kein Inhalts-/Secrets-Zugriff:** Plattform-Admin erlangt durch Migrations-Operationen **keinen** Inhalts-/Secrets-/Schlüssel-/Plaintext-/Mandantendaten-Zugriff.
- **Konsistenz F0-D7:** Die F0-D7-Plattform-Admin-Grenze bleibt autoritativ; Migrations-Pfade dürfen sie **nicht** umgehen.
- **Konsistenz Custody V1.0 §13 / Security V1.0 §10:** Das Verbot einseitiger Plaintext-Macht über Migrations-Pfade bleibt unberührt.

## 11. Verhältnis zu Aufbewahrungs-/Retention-Archiv V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Aufbewahrungs-/Retention-Archiv. Die in Retention V1.0 §6.3 etablierte Vergleichstabelle (Retention-Archiv vs. Migration) bleibt autoritativ. |
| **Roll-back-Trennung** | DR-Restore ≠ Migrations-Rollback gemäß Retention V1.0 §6.4. |
| **Substitutions-Verbot** | Eine Migration ist **kein** Substitut für das Retention-Archiv; ein Retention-Archiv ist **kein** Migrations-Werkzeug. |
| **Vorrang-Regel** | Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Retention-Archiv-Boundaries. |

## 12. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ DR-Backup; Migration ≠ DR-Restore; Migrations-Rollback ≠ DR-Restore. Die in DR V1.0 §8 etablierte Vergleichstabelle bleibt autoritativ. |
| **DR-/HA-/BCM-Mechanik unverändert** | Restore-Mechanik, Restore-Modi (Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic), RPO/RTO-Topoi und Wiederanlauf-Workflows verbleiben strikt DR V1.0. |
| **F3-D2 unverändert** | F3-D2 DR-Anforderungsmodell bleibt autoritativ. |
| **Vorrang-Regel** | Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 13. Verhältnis zu Z3-/Datenüberlassung V1.0

| Aspekt | Aussage |
|---|---|
| **Anlass-Trennung** | Migration ≠ Z3-/Datenüberlassung; Migrations-Export ≠ Z3-Export. Beide bleiben getrennte Anlässe (Z3 V1.0 §4 + §9; F3-Closing §3.13; Register §3.10). |
| **Z3-Mechanik unverändert** | Behörden-Auslieferungs-Format und -Workflow verbleiben strikt Z3 V1.0. |
| **F3-D1 unverändert** | F3-D1 Z3-/Datenüberlassung bleibt autoritativ. |
| **Vorrang-Regel** | Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. |

## 14. Verhältnis zu Custody-Modell V1.0 + KMS-/HSM-/Implementations-Folgeartefakt

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Custody-Topologie; Migration ≠ Schlüssel-Hierarchie; Migration ≠ Schlüsselrotations-/Zerstörungs-/Wiederherstellungs-Mechanik. |
| **Plaintext-Boundary** | Migrations-Pfade dürfen **nicht** zur Plaintext-Beschaffung genutzt werden (Custody V1.0 §13; F0-D7). |
| **Custody-Mechanik unverändert** | Konkrete Custody-Topologie, Schlüssel-Hierarchie und KMS-/HSM-Modellwahl verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. |
| **Cross-Mandanten-Verbot** | F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Migrations-Pfade. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 15. Verhältnis zu Security-/Krypto-/Key-Custody V1.0 + TR-02102-Detail V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Sicherheits-/Plaintext-Boundary; Migration ≠ Krypto-/Transport-Parameter-Wahl. |
| **Plaintext-Boundary** | Das in Security V1.0 §10 + F0-D7 verankerte Verbot der Plaintext-Beschaffung bleibt unberührt; Migrations-Pfade respektieren es vollständig. |
| **Krypto-/Transport-Aussage** | V1.0 trifft **keine** Aussage zu konkreten Algorithmen, Modi, Cipher Suites, TLS-Parametern oder Schlüssellängen. Diese Inhalte verbleiben strikt TR-02102-Detail V1.0. |
| **Verschlüsselungs-/Transport-Mechanik Non-Scope** | Container-Verschlüsselung, Datenträger-Verschlüsselung, Übertragungsprotokoll-Wahl und sonstige Verschlüsselungs-/Transport-Mechanik in Migrations-Kontexten sind **Non-Scope**. |
| **Vorrang-Regel** | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. |

## 16. Verhältnis zu ASVS-Control-Referenz V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ ASVS-Verifikation; Migration ≠ ASVS-Mapping. |
| **ASVS unverändert** | ASVS-Profil-Boundary verbleibt ASVS V1.0. V1.0 dieses Folgeartefakts trifft **keine** ASVS-Konformitäts-Aussage. |
| **F3-D3-Wahrung** | ASVS V1.0 §11 bestätigt die F3-D3-Wahrung; V1.0 dieses Folgeartefakts respektiert sie vollständig. |
| **Vorrang-Regel** | Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Boundary. |

## 17. Verhältnis zu DSGVO-/Datenpannen V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Datenschutz-Vorfallsprozess; Migration ≠ rechtliche Meldepflicht-Auslegung gemäß DSGVO Art. 33/34. |
| **Test-Migrations-Bezug** | Test-Migration mit Produktivdaten berührt DSGVO Art. 20/32 als Topos-Verweis (Register §3); konkrete rechtliche Auslegung verbleibt DSGVO-/Datenpannen V1.0 sowie der externen rechtlichen Validierung. |
| **Cross-Boundary-Konsistenz** | DSGVO V1.0 §17 bestätigt die Trennung; V1.0 dieses Folgeartefakts respektiert sie vollständig. |
| **Vorrang-Regel** | Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

## 18. Verhältnis zu Cybersecurity-Incident-Response V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Cybersecurity-IR-Workflow. |
| **Workflow-Trennung** | Detection, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review verbleiben strikt IR V1.0. Migrations-Pfade dürfen **nicht** als IR-Umweg oder Plaintext-Beschaffungs-Umweg genutzt werden (IR V1.0 §19). |
| **Vorrang-Regel** | Bei Konflikt mit Cybersecurity-IR V1.0 gelten dessen Boundary-Inhalte für IR-Workflow-Boundaries. |

## 19. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Lösch-/Sperr-Boundary-Inhalt. Aufbewahrungs-/Retention-Archiv ≠ Migration bleibt unverändert (Lösch V1.0 §11). |
| **Sperrgrund-Disziplin** | Lösch-/Sperr-Operationen dürfen die F3-Closing-Grenzen — insbesondere F3-D3 — **nicht** berühren oder umgehen (Lösch V1.0 §12 STOP 12.7). |
| **Sperrgrund-„Sicherheits-/Forensik-Halt"** | V1.0 dieses Folgeartefakts trifft **keine** Aussage zur Sperrgrund-Klasse „Sicherheits-/Forensik-Halt"; deren Boundary-Inhalt verbleibt Lösch-/Sperrkonzept V1.0 §7, deren operative Steuerung verbleibt Cybersecurity-IR V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

## 20. Verhältnis zu Dokumentenkategorie-/Retention-Regelmatrix V1.0

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Klassifikation. Klassifikation berührt **keinen** Migrations-Pfad und definiert **keine** Migrations-Mechanik (Regelmatrix V1.0 §10). |
| **Regelmatrix unverändert** | V1.0 dieses Folgeartefakts erzeugt **keine** neue Dokumentenkategorie und **keine** neue Retention-Regel. |
| **Vorrang-Regel** | Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Boundaries. |

## 21. Verhältnis zu Z1-/Z2-Folgeartefakten

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Z1-/Z2-Mechanik. Z1- und Z2-Datenzugriffsarten sind eigenständige Folgeartefakte gemäß Locked Decisions Register §6 Sortierungsmarker D. |
| **Vermischungs-Verbot** | V1.0 dieses Folgeartefakts vermischt Migration **nicht** mit Z1- oder Z2-Mechanik jenseits eines reinen Negativ-Verweises. |
| **Vorrang-Regel** | Bei Konflikt mit den Z1-/Z2-Folgeartefakten gelten jene für Z1-/Z2-Datenzugriffsarten. |

## 22. Verhältnis zu Lohn-DLS-Folgeartefakt

| Aspekt | Aussage |
|---|---|
| **Trennlinie** | Migration ≠ Lohn-DLS-Tiefe. Lohn-Tiefe gemäß EStG § 41 verbleibt Lohn-DLS-Folgeartefakt. |
| **Außerhalb MVP** | DLS Lohnsteuer-Außenprüfung ist gemäß Locked Decisions Register §3.10 sowie §6 Marker D **außerhalb MVP**. V1.0 dieses Folgeartefakts trifft **keine** lohnspezifische Aussage jenseits dieses Negativ-Verweises. |
| **Vorrang-Regel** | Bei Konflikt mit dem Lohn-DLS-Folgeartefakt gilt jenes für Lohn-DLS-Tiefe. |

## 23. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Folgeartefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Wechselwirkung zwischen Crypto-Shredding und der Migrations-Boundary. |
| **Open-Question-Datei unverändert** | V1.0 dieses Folgeartefakts ändert die Open-Question-Datei **nicht**. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage bleibt vor produktiver Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |

## 24. Verhältnis zu §28.11-bet

| Aspekt | Aussage |
|---|---|
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet **nicht**. |
| **Keine Wechselwirkungs-Aussage** | V1.0 trifft **keine** Aussage zur Wechselwirkung zwischen §28.11-bet und der Migrations-Boundary. |
| **Externe Klärung** | Eine etwaige Klärung des §28.11-bet-Status bleibt außerhalb dieses Folgeartefakts. |

## 25. Wahrung gesperrter Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; Migration erzeugt **keine** native F0-D4-Festschreibung. Cutover ist Grenze, kein Beförderungsweg. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Migrations-Pfade. Mehrmandanten-Lauf nur mit getrennten Paketen/Manifesten/Audit-Spuren/Freigaben/Roll-back-Pfaden. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; Plattform-Admin erlangt durch Migrations-Pfade **keine** fachliche Migrationsentscheidung und **keine** Schlüssel-/Plaintext-/Mandantendaten-Einsicht. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Migration erzeugt **keine** USt-Werte. Importierte Fremdsystem-USt-Werte bleiben Fremdsystemwerte. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ; Migrations-Export ≠ Z3-Export. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ; DR-Restore ≠ Migrations-Rollback. |
| **F3-D3 Migrations-Spezifikation** | Bleibt autoritativ; V1.0 dieses Folgeartefakts paraphrasiert §3.12 ausschließlich auf Boundary-Lock-Layer-Ebene. |
| **F3-Closing** | Bleibt autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen ≠ Migration. |
| **§28.11-bet** | Bleibt unverändert/offen. |

## 26. Explicit Non-Scope

- Konkrete Migrations-Mechanik; Cutover-Workflow-Implementierung; Roll-back-Skripte; Migrations-Abbruchs-Mechanik.
- Datenmapping-Tabellen; Feld-Mappings; Wert-Übersetzungs-Tabellen.
- ETL-Regeln; Daten-Cleansing-Regeln; Reconciliation-Algorithmen; Datenqualitäts-Schwellwerte.
- Import-/Export-Schemata; Daten-Wörterbücher; Quell-System-Adapter; Ziel-System-Adapter; Manifest-Strukturen.
- Datenbank-Migrations-Skripte; DDL; DML; SQL und Query-Spezifikation.
- Programmcode; Pseudocode; Algorithmus-Design; API-Definitionen; UI/UX; automatische Jobs; Test-Cases; CI/CD-Konfiguration.
- Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-Wahl; Migrations-Tool-Wahl; ETL-Tool-Wahl; Cutover-Tool-Wahl.
- Konkrete produktive Migrations-Fenster; Live-Cutover-Pläne; Eskalations-Trigger-Werte.
- DR-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0).
- Z3-Format / Behörden-Auslieferungs-Mechanik (verbleibt Z3 V1.0).
- Retention-Archiv-Speicher-Implementierung (verbleibt Retention V1.0).
- Custody-Topologie / Schlüsselhierarchie / Plaintext-Beschaffungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt).
- Konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter (verbleiben TR-02102-Detail V1.0).
- ASVS-Verifikation / -Mapping (verbleibt ASVS V1.0).
- Datenschutz-Vorfallsprozess / Breach-Notification-Workflow / Meldepflicht-Auslegung (verbleibt DSGVO-/Datenpannen V1.0).
- Cybersecurity-IR-Workflow (verbleibt IR V1.0).
- Lösch-/Sperr-Boundary-Inhalt (verbleibt Lösch-/Sperrkonzept V1.0).
- Klassifikation (verbleibt Regelmatrix V1.0).
- Z1-/Z2-Mechanik (verbleibt Z1-/Z2-Folgeartefakte).
- Lohn-DLS-Tiefe (verbleibt Lohn-DLS-Folgeartefakt; außerhalb MVP).
- Rechtliche Würdigung von Crypto-Shredding (verbleibt eigenständige Open-Question; Status 🔴 offen).
- Externe Normen / Zertifizierungen als Lock-Quelle (insbesondere ISO 22301, ISO 27035, BSI IT-Grundschutz, BSI TR-03116, NIST SP 800-61, NIST SP 800-86, ENISA).
- GoBD-/AO-/DSGVO-Volltext-Aufnahme jenseits der Paraphrase im Locked Decisions Register §3.12.
- Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6.
- Rechtsgutachten; Steuerauskunft; rechtliche/steuerliche Einzelfall-Entscheidung.
- DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Behörden-Akzeptanz-Behauptung; Konformitäts-, Zertifizierungs-, Audit-, Garantie- oder Freigabe-Behauptungen.
- Migrations-Erfolgs-Garantie; Verlustfreiheits-Garantie; Cutover-Sicherheits-Garantie; Roll-back-Sicherheits-Garantie.
- Änderung oder Reinterpretation von §28.11-bet.
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 27. Wortwahl-Disziplin

V1.0 dieses Folgeartefakts hält folgende generische Wortwahl-Disziplin ein:

- Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz-, Produktiv- oder Freigabe-Behauptungen sind ausgeschlossen — auch nicht in Beispielform innerhalb dieser V1.0.
- Migrations-Erfolgs-, Verlustfreiheits-, Cutover-Sicherheits- oder Roll-back-Sicherheits-Behauptungen sind ausgeschlossen.
- Aussagen über externe Norm-Konformität (insbesondere gegenüber BSI-, ISO-, NIST-, ENISA-Quellen) sind ausgeschlossen; externe Normen erscheinen ausschließlich als Negativ-Hinweis und nicht als Lock-Quelle.
- Aussagen über GoBD-/AO-/DSGVO-Konformität im Sinne einer Erfüllungs- oder Anerkennungs-Behauptung sind ausgeschlossen; Bezugnahmen erfolgen ausschließlich über die Paraphrase im Locked Decisions Register §3.12.
- Marketing-/Reife-/Enterprise-/„ready"-/„seamless"-/„lossless"-Sprache ist ausgeschlossen.
- Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen, die wie eine Auslegung wirken könnten, sind ausgeschlossen.
- Werkzeug-/Tool-/Anbieter-/Vendor-/Cloud-/Plattform-Marketing-Sprache ist ausgeschlossen.
- Inhalte in arabischer Schrift sind ausgeschlossen; UTF-8-BOM ist ausgeschlossen.
- STOP-Klauseln formulieren generisch und wiederholen sensible Beispiele **nicht** wörtlich.

## 28. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **Migrations-Detail-Folgeartefakt** | Detail-Boundary jenseits Boundary-Lock-Layer (Cutover-Schritte, Roll-back-Pflichtvoraussetzungen, Mehrmandanten-Lauf-Operationalisierung) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Cutover-Workflow-Folgeartefakt** | Workflow-Boundary für Cutover-Operationen (Register §3.12 Bindend-für) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Migration-Rollback-Detail-Folgeartefakt** | Detail-Boundary für Roll-back-Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz | offen; nicht Bestandteil von V1.0 |
| **Test-Migration-Detail-Folgeartefakt** | Detail-Boundary für DSGVO-Rechtsgrundlage-Topik, Bereinigungspflicht, Audit-Spur | offen; nicht Bestandteil von V1.0 |
| **KMS-/HSM-/Implementations-Folgeartefakt** | Custody-/Schlüssel-Implementations-Boundary | offen; nicht Bestandteil von V1.0 |
| **Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0** | F3-D1-Boundary; LIVE | LIVE |
| **DR-/HA-/BCM-Folgeartefakt V1.0** | F3-D2-Boundary; LIVE | LIVE |
| **DSGVO-/Datenpannen-Folgeartefakt V1.0** | DSGVO-Boundary; LIVE | LIVE |
| **Externe steuerprüfungs-fachliche Validierung** | Externer Validierungs-Schritt vor produktiver Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **DSB-Validierung** | Externer DSB-Validierungs-Schritt vor produktiver bzw. rechtsverbindlicher Anwendung (insbesondere für Test-Migration mit Produktivdaten) | erforderlich; **Non-Scope** dieser V1.0 |
| **Sicherheits-/Produktivfreigabe** | Externer Freigabe-Schritt vor produktiver Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Verfahrensdokumentation Kap. 5 / Kap. 6** | Endfassung; Kap. 5 Sicherheit, Kap. 6 Aufbewahrung/Lösch-Sperr | im Rahmen der jeweils nächsten Pflege; **Non-Scope** dieser V1.0 |

V1.0 dieses Folgeartefakts erzeugt **keine** Implementierung, **keine** Konfiguration und **keinen** Mechanismus.

## 29. STOP-Bedingungen

V1.0 dieses Folgeartefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 29.1 | V1.0 dieses Folgeartefakts importiert externen GoBD-/AO-/DSGVO-Volltext oder erhebt externe Normen (insbesondere ISO 22301, ISO 27035, BSI IT-Grundschutz, BSI TR-03116, NIST SP 800-61, NIST SP 800-86, ENISA) zur Lock-Quelle. |
| 29.2 | V1.0 dieses Folgeartefakts erstellt eine konkrete Migrations-Mechanik, einen Cutover-Workflow, ein Roll-back-Skript, eine Migrations-Abbruchs-Mechanik oder eine Datenübernahme-Implementierung. |
| 29.3 | V1.0 dieses Folgeartefakts erstellt Datenmapping-Tabellen, Feld-Mappings, Wert-Übersetzungs-Tabellen, ETL-Regeln, Reconciliation-Algorithmen, Daten-Cleansing-Regeln oder Datenqualitäts-Schwellwerte. |
| 29.4 | V1.0 dieses Folgeartefakts erstellt ein Datenbank-/Dateisystem-Schema, ein Daten-Wörterbuch, Import-/Export-Schemata, Quell-/Ziel-System-Adapter oder Manifest-Strukturen. |
| 29.5 | V1.0 dieses Folgeartefakts enthält Datenbank-Migrations-Skripte, DDL, DML, SQL oder Query-Spezifikation. |
| 29.6 | V1.0 dieses Folgeartefakts enthält Programmcode, Pseudocode, Algorithmus-Design, API-Definitionen, UI/UX, automatische Jobs, Test-Cases oder CI/CD-Konfiguration. |
| 29.7 | V1.0 dieses Folgeartefakts wählt Werkzeuge, Anbieter, Cloud-Provider, Plattformen, Bibliotheken, Hardware, Storage-Lösungen, ETL-Tools, Migrations-Tools oder Cutover-Tools. |
| 29.8 | V1.0 dieses Folgeartefakts erstellt einen produktiven Migrations-Plan, einen Live-Cutover-Plan, ein konkretes Migrations-Fenster oder konkrete Eskalations-Trigger-Werte. |
| 29.9 | V1.0 dieses Folgeartefakts vermischt Migrations-Rollback mit DR-Restore (F3-D2-Schwächung). |
| 29.10 | V1.0 dieses Folgeartefakts deutet importierte Fremdsystem-Festschreibungen in native F0-D4-Festschreibung um. |
| 29.11 | V1.0 dieses Folgeartefakts erzeugt aus importierten Fremdsystem-USt-Werten native F1-D1/F1-D2-Werte. |
| 29.12 | V1.0 dieses Folgeartefakts öffnet einen Plattform-Admin-Pfad zu Schlüssel-, Plaintext- oder Mandantendaten-Einsicht über Migrations-Pfade (verletzt F0-D7 + Custody V1.0 + Security V1.0 + §3.12 + §4.4). |
| 29.13 | V1.0 dieses Folgeartefakts vermischt Mehrmandanten-Migrations-Pakete oder verletzt die Disziplin „getrennte Pakete, Manifeste, Audit-Spuren, Freigaben, Roll-back-Pfade" (verletzt F0-D6 + §4.3). |
| 29.14 | V1.0 dieses Folgeartefakts erlaubt Test-Migration mit Produktivdaten ohne die in §3.12 angelegten Topoi (DSGVO-Rechtsgrundlage, Zweckbindung, F0-D7-Freigabe, F0-D6-Mandantentrennung, DSGVO Art. 32, Bereinigungspflicht, Audit-Spur). |
| 29.15 | V1.0 dieses Folgeartefakts verschmilzt Migration mit DR-/HA-/BCM, Z3-/Datenüberlassung, Retention-Archiv, Lösch-/Sperrkonzept, Regelmatrix, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, IR, DSGVO-/Datenpannen, Lohn-DLS, Z1-/Z2 oder Crypto-Shredding-Rechtsfrage. |
| 29.16 | V1.0 dieses Folgeartefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 29.17 | V1.0 dieses Folgeartefakts ändert oder reinterpretiert §28.11-bet. |
| 29.18 | V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei. |
| 29.19 | V1.0 dieses Folgeartefakts erstellt oder finalisiert Inhalte für Verfahrensdokumentation Kap. 5 oder Kap. 6. |
| 29.20 | V1.0 dieses Folgeartefakts schwächt F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 29.21 | V1.0 dieses Folgeartefakts erteilt Rechtsauskunft, Steuerauskunft oder eine rechtliche/steuerliche Entscheidung im Einzelfall. |
| 29.22 | V1.0 dieses Folgeartefakts behauptet behördliche Akzeptanz, externe Konformität (insbesondere gegenüber GoBD oder DSGVO als Erfüllungs-Behauptung), Zertifizierung, Audit-Ergebnis oder produktive Freigabe. |
| 29.23 | V1.0 dieses Folgeartefakts spricht eine Garantie-Aussage gegenüber Mandanten, Behörden, Aufsichtsstellen oder Migrations-Vendor-Stellen aus — insbesondere zu Migrations-Erfolg, Verlustfreiheit, Cutover-Sicherheit oder Roll-back-Sicherheit. |
| 29.24 | V1.0 dieses Folgeartefakts vermischt Migration mit Z1-/Z2-Mechanik oder Lohn-DLS-Tiefe jenseits eines reinen Negativ-Verweises. |
| 29.25 | V1.0 dieses Folgeartefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 29.26 | V1.0 dieses Folgeartefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie-, Behörden-Akzeptanz- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |
| 29.27 | Die Forbidden-Reference-Gate-Baseline (BLOCKED, BASELINE_ALLOWED, ALLOW_MARKED) ändert sich durch Aufnahme dieser V1.0 in den Repository-Stand. |

## 30. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** Behörden-Akzeptanz-Behauptung; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten, Behörden oder Aufsichtsstellen |
| **STOP-Bedingungen** | 27 Klauseln (§29.1 — §29.27) |
| **Bindend für** | Alle in Abschnitt 28 genannten Folgeartefakte; Verfahrensdokumentation Kap. 5 und Kap. 6 (im Rahmen ihrer jeweils nächsten Pflege) hinsichtlich der Trennlinien dieses Artefakts; alle nachgelagerten Detail-Artefakte zu Migrations-Themen. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen DR-/HA-/BCM, Z3-/Datenüberlassung, Retention-Archiv, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, Lösch-/Sperrkonzept, Regelmatrix, Cybersecurity-IR, DSGVO-/Datenpannen, Lohn-DLS, Z1-/Z2 sowie die Crypto-Shredding-Rechtsfrage. |
| **Nicht bindend für** | Konkrete Migrations-Mechanik. Cutover-Workflow-Implementierung. Roll-back-Skripte. Datenmapping-Tabellen. ETL-Regeln. Reconciliation-Algorithmen. Datenmodell/Schema. UI/UX. Programmcode. Pseudocode. Algorithmus-Design. SQL. APIs. Automatische Jobs. Test-Cases. CI/CD-Konfiguration. Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-Wahl. Konkrete Verschlüsselungs-/Transport-Mechanik. Konkrete Schlüssel-/Custody-Mechanik. Konkrete Restore-Mechanik. Z3-Format. Lohn-Tiefe. Z1-/Z2-Mechanik. Rechtliche Würdigung von Crypto-Shredding. Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | Migration ≠ Aufbewahrungs-/Retention-Archiv. Migration ≠ DR-Backup. Migration ≠ DR-Restore. Migrations-Rollback ≠ DR-Restore. Migration ≠ Z3-/Datenüberlassung. Migrations-Export ≠ Z3-Export. Migration ≠ Custody-Topologie. Migration ≠ Schlüssel-Hierarchie. Migration ≠ Plaintext-Beschaffungs-Pfad. Migration ≠ Krypto-/Transport-Parameter-Wahl. Migration ≠ ASVS-Verifikation. Migration ≠ ASVS-Mapping. Migration ≠ Datenschutz-Vorfallsprozess. Migration ≠ Cybersecurity-IR-Workflow. Migration ≠ Lösch-/Sperr-Boundary-Inhalt. Migration ≠ Klassifikation. Migration ≠ Lohn-DLS-Tiefe. Migration ≠ Z1-/Z2-Mechanik. Migration ≠ Crypto-Shredding-Rechtswürdigung. Migration ≠ KMS-/HSM-/Implementations-Folgeartefakt. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt; Migration erzeugt keine native F0-D4-Festschreibung. F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Migrations-Pfade. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; Plattform-Admin trifft **keine** fachliche Migrationsentscheidung. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt; Migration erzeugt **keine** USt-Werte. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit dem Locked Decisions Register §3.12 / F3-D3 gilt §3.12. Bei Konflikt mit §3.13 / F3-Closing gilt F3-Closing. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Z3 V1.0 gilt Z3 V1.0 für Behörden-Auslieferungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 oder Custody V1.0 gilt jeweils diese Quelle für Sicherheits-/Plaintext-/Custody-Boundaries. Bei Konflikt mit TR-02102-Detail V1.0 gilt TR-02102-Detail V1.0 für Krypto-/Transport-Topoi. Bei Konflikt mit DSGVO-/Datenpannen V1.0 gilt jenes Folgeartefakt für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |
| **Verankerungs-Hinweis** | Das Migrations-Folgeartefakt ist im Locked Decisions Register V1.0 §3.12 (F3-D3 Migrations-Spezifikation V1.0 — locked) ausdrücklich als Downstream verankert: „Bindend für: Migrations-Folgeartefakte und Cutover-Workflow-Folgeartefakte." Damit ist die Bindungsgrundlage repository-intern eindeutig. F3-D3 selbst ist V1.0-locked; V1.0 dieses Folgeartefakts paraphrasiert §3.12 ausschließlich auf Boundary-Lock-Layer-Ebene und modifiziert den Register **nicht**. |
| **Externe Validierung** | Vor produktiver Anwendung sind eine externe steuerprüfungs-fachliche Validierung sowie ggf. eine DSB-/Sicherheits-/Produktivfreigabe erforderlich. Alle drei sind **Non-Scope** von V1.0. |

## 31. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **nicht** Bestandteil eines externen Audit- oder Zertifizierungs-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Schärfung der Anti-Garantie-/Anti-Konformitäts-/Anti-Zertifizierungs-/Anti-Behörden-Akzeptanz-Wortwahl; Klarstellung der Anlass-Trennung gegenüber DR-Restore, Z3-/Datenüberlassung, Migrations-Export und Aufbewahrungs-/Retention-Archiv; ausdrückliche Aufnahme von ISO 22301, ISO 27035, BSI IT-Grundschutz, BSI TR-03116, NIST SP 800-61, NIST SP 800-86, ENISA in die Negativ-Quellgrundlage; Plaintext-Boundary-Spiegelung gegenüber Custody V1.0 + Security V1.0 verankert; F3-D3-Inhalts-Disziplin („Cutover ist Grenze, kein Beförderungsweg"; importierte Fremdsystem-Festschreibungen bleiben Fremdsystem-Tatsachen; importierte Fremdsystem-USt-Werte bleiben Fremdsystemwerte) wörtlich aus §3.12 paraphrasiert; Mehrmandanten-Disziplin (getrennte Pakete/Manifeste/Audit-Spuren/Freigaben/Roll-back-Pfade) verankert; Test-Migrations-Topoi (DSGVO-Rechtsgrundlage, Zweckbindung, F0-D7-Freigabe, F0-D6-Mandantentrennung, DSGVO Art. 32, Bereinigungspflicht, Audit-Spur) als Topos-Verweise verankert; Roll-back-Boundary („Roll-back ≠ DR-Restore"; fünf Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz) als Topos-Verweise verankert; Crypto-Shredding-Rechtsfrage als ausdrücklicher Open-Question-Verweis ohne Würdigung in V1.0 verankert; in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; Detail-Folgeartefakte (Migrations-Detail, Cutover-Workflow, Migration-Rollback-Detail, Test-Migration-Detail, KMS-/HSM-/Implementations-Folgeartefakt, Z1-/Z2-Folgeartefakte, Lohn-DLS-Folgeartefakt) werden eigenständig versioniert. Eine externe steuerprüfungs-fachliche Validierung sowie ggf. eine DSB-/Sicherheits-/Produktivfreigabe bleiben vor produktiver Anwendung erforderlich. |
