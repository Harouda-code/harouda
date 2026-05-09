# Cybersecurity-Incident-Response-Folgeartefakt — V1.0

**Lock-Aussage:** Cybersecurity-Incident-Response-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert die im Locked Decisions Register §6 Sortierungsmarker C („Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow") angelegte Workflow-Boundary auf der Ebene paraphrasierter Incident-Lifecycle-Topoi, der Ransomware-/Forensik-Schnittstelle gegenüber DR-/HA-/BCM V1.0 §12 sowie der operativen Schnittstelle zum Sperrgrund „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7. V1.0 autorisiert **keine** Implementierung. V1.0 enthält **keinen** Incident-Response-Runbook, **keine** Forensik-Werkzeug-Wahl, **keine** SIEM-/SOC-/Tool-/Anbieter-/Cloud-/Vendor-Wahl, **keine** Detection-Regeln, **keine** Playbooks mit operativen Befehlen und **kein** Beweis-/Log-Schema. V1.0 trifft **keine** rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34 (diese verbleibt strikt dem DSGVO-/Datenpannen-Folgeartefakt). V1.0 erteilt **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und behauptet **keine** externe Zertifizierung, **kein** Audit-Ergebnis und **keine** Konformitäts-Behauptung gegenüber externen Normen. V1.0 spricht **keine** RPO-/RTO-/MTTD-/MTTR-/Containment-/Recovery-/Vorfall-Vermeidungs-/Ransomware-Vermeidungs-/Forensik-Garantie aus und behauptet **keine** Verfügbarkeits-Garantie. V1.0 nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor. §28.11-bet bleibt unverändert/offen. Eine externe sicherheitsfachliche Validierung sowie eine externe rechtliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | Cybersecurity-Incident-Response-Folgeartefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten oder Aufsichtsbehörden |
| Zweck | Festlegung der fachlichen Boundary-Aussagen für Cybersecurity-Incident-Response in Harouda; Konkretisierung der in F3-D2 V1.0 + Security V1.0 §10 + DR-/HA-/BCM V1.0 §12 + Lösch-/Sperrkonzept V1.0 §7 angelegten Schnittstellen-Boundary auf Workflow-Topik-Ebene; Bereitstellung der Ransomware-/Forensik-Schnittstelle gegenüber DR-/HA-/BCM-Restore-Operationen ohne eigene Restore-Mechanik |
| Scope | Boundary-Aussagen zu: Incident-Lifecycle-Topoi (Detection, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review) als reine Boundary-Topoi; Ransomware-/Forensik-Schnittstelle (Integritätsprüfung als Vorbedingung; forensische Freigabe als Vorbedingung; Beweissicherungs-Boundary); Schnittstelle zu DR-/HA-/BCM V1.0 §12 (IR-Workflow vor produktivem Restore); Schnittstelle zu Lösch-/Sperrkonzept V1.0 §7 (operative Aktivierung/Aufhebung des Sperrgrunds „Sicherheits-/Forensik-Halt"); Custody-/Plaintext-/Schlüssel-Boundary im Incident-Kontext; Mandantentrennung im Incident-Kontext (F0-D6); Berechtigungen-/Identity-Boundary (F0-D7); Audit-/Beweis-Boundary auf Topik-Ebene; Cross-Boundary-Konsistenz mit Retention V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Custody V1.0, ASVS V1.0, TR-02102-Detail V1.0, DR-/HA-/BCM V1.0 und gesperrten Harouda-Locks |
| Non-Scope | Incident-Response-Runbooks; Schritt-für-Schritt-Anweisungen, Befehlssequenzen, konkrete Eskalations-Trigger-Werte; Forensik-Werkzeug-Wahl; SIEM-/SOC-/Tool-/Anbieter-/Cloud-/Vendor-/Hardware-/Bibliotheks-Wahl; Detection-Regeln, Signaturen, Yara-Regeln, Sigma-Regeln, IOCs, Anomalie-Schwellwerte; Playbooks mit operativen Befehlen; Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases, Test-Methodik, CI/CD-Konfiguration, Werkzeug-Konfiguration; Beweis-/Log-Schema oder konkrete chain-of-custody-Felder; rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34 (verbleibt DSGVO-/Datenpannen-Folgeartefakt); Custody-Topologie/Schlüsselhierarchie/Schlüssel-Wiederherstellungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt); konkrete Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0 + DR-Detail-Folgeartefakte); konkrete Krypto-Algorithmen/Cipher Suites/TLS-Parameter (verbleiben TR-02102-Detail V1.0); ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0); Z3-/Datenüberlassungs-Format (verbleibt Z3-Spezifikations-Folgeartefakt); Migrations-Implementierung (verbleibt Migrations-Folgeartefakt); Retention-Archiv-Speicher-Implementierung (verbleibt Retention V1.0 + nachgelagerte Detail-Artefakte); rechtliche Würdigung von Crypto-Shredding; externe Normen/Zertifizierungen als Lock-Quelle (insbesondere ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116); Garantie-Aussagen jeglicher Art (RPO/RTO, MTTD/MTTR, Containment, Recovery, Vorfall-Vermeidung, Ransomware-Vermeidung, Forensik); Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechtsgutachten; Steuerauskunft; DSB-/Sicherheits-/Produktivfreigabe; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register §6 Sortierungsmarker C (Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow); Locked Decisions Register §3.11 / F3-D2 V1.0 (Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe); DR-/HA-/BCM-Folgeartefakt V1.0 §7 (Forensic Restore), §12 (Ransomware-Restore Boundary), §19 (Verhältnis zu Cybersecurity-Incident-Response), §23 (Downstream Artefakte); Lösch-/Sperrkonzept-Artefakt V1.0 §7 (Sperrgrund „Sicherheits-/Forensik-Halt"), §11 (Verhältnis), §14 (Downstream); Security-/Krypto-/Key-Custody-Artefakt V1.0 §10 (DR / Backup / Restore Boundary), §15 (Negativ-Erklärung), §17 (Downstream-Auftrag); Custody-Modell-Boundary-Artefakt V1.0 §5 (Plattform-Admin-/Plaintext-Boundary), §9 (Custody-/Plaintext-Restore-Boundary), §11 (F3-D2-Wahrung), §15 (Downstream); Dokumentenkategorie-/Retention-Regelmatrix V1.0 §16 (Downstream — indirekte Relevanz für Klassifikations-Daten in Forensik-Kontexten); ASVS-Control-Referenz-Artefakt V1.0 §14 (Downstream); TR-02102-Detail-Artefakt V1.0 §18 (Downstream); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. Bei Konflikt mit dem DSGVO-/Datenpannen-Folgeartefakt gilt jenes für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Werkzeug-/Tool-/Anbieter-Wahl, keine Konfigurations-Werte, keine Beschaffung. |

**Wichtiger Hinweis zur Verankerung:** Das Cybersecurity-Incident-Response-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) als **Sortierungsmarker C** enumeriert (Eintrag: „Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow"). Sortierungsmarker C wird mit dem DSGVO-/Datenpannen-Folgeartefakt geteilt; beide sind als getrennte, eigenständige Folgeartefakte enumeriert. Damit ist die Bindungsgrundlage dieses Artefakts repository-intern eindeutig verankert. V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht**.

---

## 2. Zweck und fachliche Rolle

Das Cybersecurity-Incident-Response-Folgeartefakt definiert die fachlichen Boundary-Grenzen für:

- die paraphrasierten **Incident-Lifecycle-Topoi** (Detection, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review) als reine Boundary-Konzepte,
- die **Ransomware-/Forensik-Schnittstelle** gegenüber DR-/HA-/BCM V1.0 §12 (Integritätsprüfung als Vorbedingung; forensische Freigabe als Vorbedingung für produktiven Restore),
- die **operative Schnittstelle zum Sperrgrund „Sicherheits-/Forensik-Halt"** gemäß Lösch-/Sperrkonzept V1.0 §7 (Aktivierung/Aufhebung der Sperrgrund-Klasse, ohne deren Boundary-Inhalt zu verändern),
- die **Custody-/Plaintext-/Schlüssel-Boundary** im Incident-Kontext (Konsistenz Custody V1.0 §5/§9/§11 + DR-/HA-/BCM V1.0 §9),
- die **Mandantentrennung im Incident-Kontext** (F0-D6),
- die **Berechtigungen-/Identity-Boundary** (F0-D7),
- die **Audit-/Beweis-Boundary** auf Topik-Ebene,
- die **Wahrung** der gesperrten Harouda-Boundaries.

Das Cybersecurity-Incident-Response-Folgeartefakt ist ein **internes Boundary-/Spec-Lock**. Es liefert paraphrasierte Schnittstellen- und Workflow-Topik-Aussagen, **trifft jedoch selbst keine** Werkzeug-Wahl, **keinen** Runbook, **keine** Detection-Regel, **kein** Playbook, **kein** Beweis-/Log-Schema und **keine** Implementierungs-Entscheidung.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- konkrete Forensik-Werkzeuge, SIEM-/SOC-Tools, Detection-Regeln, Playbooks oder Runbooks,
- die Endfassung der Verfahrensdokumentation Kap. 5 oder Kap. 6,
- die Anbieter-/Werkzeug-/Cloud-/Hardware-/Bibliotheks-Wahl,
- die KMS-/HSM-Topologie oder Schlüssel-Wiederherstellungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt),
- die konkrete Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0 + DR-Detail-Folgeartefakte),
- die rechtliche Würdigung von Crypto-Shredding,
- DSGVO Art. 33/34 Meldepflicht-Auslegung (verbleibt DSGVO-/Datenpannen-Folgeartefakt),
- ASVS-Verifikations-/Zertifizierungs-Aussagen,
- BSI-Konformitäts-/TR-02102-Erfüllungs-Aussagen,
- externe Normen/Zertifizierungen als Lock-Quelle.

Eine externe sicherheitsfachliche Prüfung sowie eine externe rechtliche Prüfung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung **erforderlich**.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext aus externen Quellen wird **nicht** übernommen. V1.0 dieses Artefakts erzeugt **keine** eigenen externen Quellen. Insbesondere werden **keine** ISO-27035-, **keine** NIST-SP-800-61-, **keine** NIST-SP-800-86-, **keine** ENISA-, **keine** BSI-IT-Grundschutz- und **keine** BSI-TR-03116-Quellen als Lock-Grundlage aufgenommen.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| Locked Decisions Register §6 Sortierungsmarker C | „Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow" | **Direkte Verankerungs-Quelle** im Register (Hinweis: Marker C ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem DSGVO-/Datenpannen-Folgeartefakt geteilt; beide sind eigenständig enumeriert) |
| Locked Decisions Register §3.11 / F3-D2 V1.0 | Authoritatives DR-Anforderungsmodell; insbesondere: „Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe" | **Direkte Lock-Basis** für die Vorbedingungs-Boundary |
| DR-/HA-/BCM-Folgeartefakt V1.0 | §7 (Forensic Restore als fachliche Klasse mit Schnittstelle zum IR-Folgeartefakt); §12 (Ransomware-Restore Boundary mit Integritätsprüfung + forensischer Freigabe als Vorbedingungen; ausdrücklicher Verweis „V1.0 dieses Artefakts spezifiziert ausschließlich die Schnittstelle, **keinen** IR-Workflow"); §19 (Verhältnis zu Cybersecurity-Incident-Response — getrennte Boundary-/Spec-Locks; Verschmelzungs-Verbot); §23 (Downstream Artefakte) | **Direkte Lock-Basis** und maßgebende Schnittstellen-Quelle |
| Lösch-/Sperrkonzept-Artefakt V1.0 | §7 Sperrgrund-Klasse „Sicherheits-/Forensik-Halt" (Verdacht oder bestätigte sicherheitsrelevante Vorgänge — z. B. Ransomware-Restore-Kontext gemäß F3-D2 — erfordern eine forensische Prüfung; Lösch-/Sperr-Operationen werden bis zur forensischen Freigabe ausgesetzt); §11 Verhältnis (IR steuert Sperrgrund operativ); §14 Downstream (IR-Folgeartefakt steuert Sperrgrund „Sicherheits-/Forensik-Halt" operativ) | **Direkte Lock-Basis** für die Sperrgrund-Schnittstelle |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | §10 DR / Backup / Restore Boundary (Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe; Restore darf keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen); §15 Negativ-Erklärung (kein Incident-Response-Runbook); §17 Downstream-Auftrag „Cybersecurity-Incident-Response-Folgeartefakt — Ransomware-/Forensik-Workflow" | **Direkte Lock-Basis** für Custody-/Plaintext-Boundary im IR-Kontext |
| Custody-Modell-Boundary-Artefakt V1.0 | §5 Plattform-Admin-/Plaintext-Boundary (kein einseitiger Klartext-Zugriff über Restore-/Forensik-Pfade); §9 Custody-/Plaintext-Restore-Boundary; §11 F3-D2-Wahrung; §15 Downstream („Cybersecurity-Incident-Response-Folgeartefakt — Ransomware-/Forensik-Workflow") | **Direkte Lock-Basis** für Custody-Boundary im IR-Kontext |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | §16 Downstream („nur indirekt relevant, soweit Klassifikations-Daten in Forensik-Kontexten zu schützen sind") | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| ASVS-Control-Referenz-Artefakt V1.0 | §14 Downstream („Boundary-Bezug; nicht Bestandteil dieses Artefakts") | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| TR-02102-Detail-Artefakt V1.0 | §18 Downstream („Ransomware-/Forensik-Workflow; nicht Bestandteil dieses Artefakts") | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | §15 Non-Scope („Datenschutz-Vorfallsprozess (DSGVO Art. 33/34)") — Trennverweis auf das DSGVO-/Datenpannen-Folgeartefakt | Indirekte Lock-Basis (Cross-Boundary-Wahrung; Trennlinie IR ≠ DSGVO-Datenpannen) |
| DSGVO-/Datenpannen-Folgeartefakt (offen, eigenes Folgeartefakt) | DSGVO Art. 33/34 Meldepflicht-Auslegung als ausschließlicher Auftrag jenes Folgeartefakts | Negativ-Quellgrundlage; **keine** Aufnahme in IR V1.0 |
| Open Question Crypto-Shredding rechtliche Einordnung | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen) | Negativ-Quellgrundlage; **keine** rechtliche Würdigung in IR V1.0 |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung); F0-D6 (Mandantentrennung); F0-D7 (Plattform-Admin-Grenze); F1-D1/F1-D2 (USt-Wahrheit); F3-D1 (Z3-Export); F3-D2 (DR/Restore); F3-D3 (Migration); F3-Closing | Autoritative Boundary-Quellen; bei Konflikt vorrangig |

V1.0 dieses Artefakts greift **nicht** auf externe Webseiten zu, importiert **keinen** Originaltext aus externen Normen und führt **keine** über die o. g. paraphrasierten Anker hinausgehenden Quellen ein.

---

## 4. Core Cybersecurity-Incident-Response Boundaries

Auf Boundary-Ebene gelten:

- **IR ≠ Implementierung.** V1.0 enthält keine Implementierung, keinen Runbook, kein Playbook, keine Detection-Regel, kein Beweis-/Log-Schema, kein Datenmodell, kein UI/UX, keinen Programmcode, keinen Pseudocode, kein Algorithmus-Design, kein SQL und keine API-Definition.
- **IR ≠ Garantie.** V1.0 erteilt keine Garantie-Aussagen — weder zu RPO/RTO noch zu MTTD/MTTR, Containment, Recovery, Vorfall-Vermeidung, Ransomware-Vermeidung oder Forensik-Reife. Boundary-Topoi sind **keine** zugeschriebenen Eigenschaften Haroudas.
- **IR ≠ externe Zertifizierung / Konformität.** V1.0 behauptet keine externe Zertifizierung (insbesondere keine ISO-27035-, keine NIST-SP-800-61-, keine NIST-SP-800-86-, keine ENISA-, keine BSI-IT-Grundschutz-, keine BSI-TR-03116-Konformität); produktbezogene Zertifizierungs- oder Marketing-Behauptungen sind ausgeschlossen.
- **IR ≠ Audit-Ergebnis.** V1.0 stellt kein Audit-Ergebnis dar.
- **IR ≠ DR-/HA-/BCM-Restore-Mechanik.** Konkrete Restore-Mechanik verbleibt DR-/HA-/BCM V1.0; IR trifft ausschließlich die Schnittstelle (Vorbedingungen Integritätsprüfung + forensische Freigabe).
- **IR ≠ Lösch-/Sperrkonzept-Boundary.** Boundary-Inhalt der Sperrgrund-Klasse „Sicherheits-/Forensik-Halt" verbleibt Lösch-/Sperrkonzept V1.0 §7; IR aktiviert/hebt sie operativ auf, **ohne** den Boundary-Inhalt zu verändern.
- **IR ≠ Custody-Modell.** Schlüsselverwaltungs-Topologie/-Hierarchie verbleibt Custody V1.0; IR respektiert sie, ohne sie zu erweitern.
- **IR ≠ KMS-/HSM-/Implementations-Folgeartefakt.** Schlüssel-Wiederherstellungs-Mechanik verbleibt downstream.
- **IR ≠ DSGVO-/Datenpannen-Folgeartefakt.** Rechtliche Breach-Notification-Entscheidungen unter DSGVO Art. 33/34 verbleiben strikt jenem Folgeartefakt; IR trifft hierzu **keine** Aussage.
- **IR ≠ ASVS-Control-Referenz.** ASVS-Mapping verbleibt ASVS V1.0.
- **IR ≠ TR-02102-Detail.** Krypto-Familien-Orientierung verbleibt TR-02102-Detail V1.0.
- **IR ≠ Z3-/Datenüberlassung.** F3-D1 ist eigenständige Quelle.
- **IR ≠ Migration.** F3-D3 ist eigenständige Quelle.
- **IR ≠ Retention-Archiv.** Retention V1.0 trifft Aufbewahrungs-Boundary; IR berührt sie nicht.
- **IR ≠ Crypto-Shredding-Rechtswürdigung.** Verbleibt der externen Rechtsfrage.
- **Recovery hebt Festschreibung nicht auf.** F0-D4 bleibt unberührt — gilt auch im IR-Kontext.
- **Restore-/Forensik-Operationen dürfen keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen** (Konsistenz F3-D2 + Security V1.0 §10 + Custody V1.0 §5/§9/§11 + DR-/HA-/BCM V1.0 §9).
- **Plattform-Administration im IR-Kontext bleibt rein technische Ausführung.** F0-D7 bleibt unberührt.
- **Kein Cross-Mandanten-Forensik-Zugriff / Kein Cross-Mandanten-Restore.** F0-D6 bleibt unberührt.
- **§28.11-bet bleibt unverändert/offen.** V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht.

V1.0 trifft **keine** Aussage über konkrete Forensik-Werkzeuge, SIEM-/SOC-Tools, Detection-Regeln, Playbooks, Runbooks, Beweis-Schemata, Hersteller, Cloud-Regionen, Hardware-Familien, Bibliotheken oder Implementierungs-Konfigurationen.

---

## 5. Incident-Lifecycle-Boundary

Auf Boundary-Ebene werden fünf nebeneinander stehende, sich nicht ersetzende fachliche Lifecycle-Topoi anerkannt — **ausschließlich als Boundary-Konzepte**, ohne Mechanik, ohne Werkzeug-Wahl, ohne Schritt-für-Schritt-Anweisung, ohne konkrete Eskalations-Trigger-Werte:

- **Detection (Erkennung)** — Boundary-Topik für die fachliche Phase der Erkennung sicherheitsrelevanter Vorgänge. Konkrete Detection-Regeln, Signaturen, IOCs, Anomalie-Schwellwerte, SIEM-/SOC-Werkzeug-Wahl und Detection-Mechanik sind **Non-Scope**.
- **Containment (Eindämmung)** — Boundary-Topik für die fachliche Phase der Eindämmung eines erkannten sicherheitsrelevanten Vorgangs. Konkrete Eindämmungs-Befehle, Isolations-Werkzeuge und operative Schritte sind **Non-Scope**.
- **Eradication (Beseitigung)** — Boundary-Topik für die fachliche Phase der Beseitigung der Vorfall-Ursache. Konkrete Bereinigungs-Skripte, Werkzeug-Wahl und operative Schritte sind **Non-Scope**.
- **Recovery-Schnittstelle** — Boundary-Topik für die fachliche Übergabe an DR-/HA-/BCM V1.0 §12. Konkrete Restore-Mechanik verbleibt strikt DR-/HA-/BCM-Folgeartefakt; IR liefert ausschließlich die Vorbedingungen (Integritätsprüfung + forensische Freigabe).
- **Post-Incident-Review** — Boundary-Topik für die fachliche Phase der Lessons-Learned-Aufarbeitung und Beweis-Aufbereitung. Konkrete Review-Schemata, Berichts-Vorlagen, Aufbewahrungs-Werte für Forensik-Spuren und Schulungs-Vorgaben sind **Non-Scope**.

**Konsistenzregel:** Sämtliche Lifecycle-Topoi sind reine Boundary-Klassen ohne Verifikations-, Erfüllungs- oder Audit-Charakter. Eine Befüllung mit konkreten Werkzeugen, Sequenzen, Regeln oder Konfigurations-Werten erfolgt ausschließlich über einen separat zu autorisierenden späteren Versionsschritt oder in Detail-Folgeartefakten unterhalb dieses Boundary-Locks.

**Wortwahl-Disziplin:** Aussagen wie zugeschriebene Vorfall-Resistenz oder Forensik-Reife als Eigenschaft Haroudas sind ausgeschlossen.

---

## 6. Ransomware-/Forensik-Schnittstelle

Auf Boundary-Ebene gilt — konsistent mit F3-D2, Security V1.0 §10, DR-/HA-/BCM V1.0 §12 und Lösch-/Sperrkonzept V1.0 §7:

- **Integritätsprüfung als Vorbedingung.** Vor einer produktiven Restore-Operation in einem ransomware-betroffenen oder verdächtigen Umfeld ist die Integrität der Quell-Daten zu verifizieren. IR liefert die Vorbedingung; die konkrete Prüf-Mechanik verbleibt downstream.
- **Forensische Freigabe als Vorbedingung.** Vor einer produktiven Restore-Operation ist eine forensische Freigabe erforderlich. IR liefert die Vorbedingung; der konkrete Freigabe-Workflow verbleibt downstream.
- **Beweissicherungs-Boundary.** IR-Operationen müssen eine fachliche chain-of-custody-Boundary wahren. Konkrete Beweis-Schemata, Aufbewahrungs-Werte für Forensik-Spuren, Beweissicherungs-Werkzeuge und Beweis-Übergabe-Formate sind **Non-Scope**.
- **Forensic-Restore-Modus als Schnittstelle, nicht als Implementierung.** Der in DR-/HA-/BCM V1.0 §7 anerkannte Forensic-Restore-Modus ist die fachliche Klasse, in der Beweissicherung erfolgt; er erzeugt **keinen** produktiven Zugriff. IR-Operationen in diesem Modus erfolgen ausschließlich zur Beweissicherung und Integritätsprüfung; die konkrete Forensik-Methodik verbleibt downstream.
- **Übergabe an DR-/HA-/BCM-Restore.** Erst nach Integritätsprüfung **und** forensischer Freigabe kann die DR-/HA-/BCM-Boundary einen produktiven Restore freigeben. IR und DR-/HA-/BCM bleiben getrennte Boundary-/Spec-Locks; die Schnittstelle ist die Übergabe der beiden Vorbedingungen.

---

## 7. Verhältnis zu DR-/HA-/BCM V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | DR-/HA-/BCM V1.0 §19 etabliert das Verschmelzungs-Verbot. V1.0 dieses Artefakts und DR-/HA-/BCM V1.0 sind getrennte Boundary-/Spec-Locks. |
| **Schnittstelle Ransomware-Restore** | DR-/HA-/BCM V1.0 §12 etabliert die Vorbedingung „Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe". V1.0 dieses Artefakts liefert die Vorbedingungen; DR-/HA-/BCM V1.0 trägt die Restore-Mechanik. |
| **Forensic-Restore-Modus** | Der in DR-/HA-/BCM V1.0 §7 anerkannte Forensic-Restore-Modus ist die fachliche Klasse, in der IR-Beweissicherung erfolgt. V1.0 dieses Artefakts respektiert den Modus, ohne ihn zu erweitern. |
| **Custody-/Plaintext-Boundary** | Das in DR-/HA-/BCM V1.0 §9 verankerte Verbot des unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Restore- oder Forensik-Operationen bleibt unberührt. |
| **Mandantentrennung im Restore** | Das in DR-/HA-/BCM V1.0 §10 verankerte Verbot des Cross-Mandanten-Restore bleibt unberührt; sinngemäß gilt es auch für Cross-Mandanten-Forensik-Zugriff. |
| **Recovery-Schnittstelle** | V1.0 dieses Artefakts bezeichnet die fachliche Übergabe an DR-/HA-/BCM-Restore-Operationen; konkrete Restore-Mechanik bleibt strikt DR-/HA-/BCM. |
| **Vorrang-Regel** | Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. |

---

## 8. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Sperrgrund-Schnittstelle** | Lösch-/Sperrkonzept V1.0 §7 etabliert die Sperrgrund-Klasse „Sicherheits-/Forensik-Halt". V1.0 dieses Artefakts steuert diese Sperrgrund-Klasse **operativ** (Aktivierung/Aufhebung); der Boundary-Inhalt der Klasse bleibt strikt unverändert. |
| **Aussetzung Lösch-/Sperr-Operationen** | Solange ein Sicherheits-/Forensik-Halt aktiv ist, sind Lösch-/Sperr-Operationen gemäß Lösch-/Sperrkonzept V1.0 ausgesetzt. V1.0 dieses Artefakts trifft keine Lösch-/Sperr-Entscheidung. |
| **Aufhebungs-Voraussetzung** | Eine Aufhebung des Sicherheits-/Forensik-Halts ist Boundary-Topik dieses Artefakts; konkrete Aufhebungs-Workflow-Schritte und Eskalations-Trigger-Werte sind **Non-Scope**. |
| **Verschmelzungs-Verbot** | IR ≠ Lösch-/Sperrkonzept. Eine Verschmelzung ist auf Boundary-Ebene ausgeschlossen. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

---

## 9. Custody-/Plaintext-/Schlüssel-Boundary im Incident-Kontext

Auf Boundary-Ebene gilt — konsistent mit F3-D2, Security V1.0 §10, Custody V1.0 §5/§9/§11 und DR-/HA-/BCM V1.0 §9:

- **Forensik-Operationen dürfen keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen.** Diese Boundary gilt ausnahmslos für alle Lifecycle-Phasen gemäß §5.
- **Plattform-Administration im IR-Kontext bleibt rein technische Ausführung.** Plattform-Admin (F0-D7) erlangt während IR-Operationen **keine** fachliche Schlüssel-/Plaintext-/Mandantendaten-Einsicht.
- **Storage-vs-Key-Access-Trennung gilt sinngemäß im IR-Kontext** (Custody V1.0 §6). Wer im IR-Kontext Speicher-/Chiffrat-Lesezugriff hat, darf nicht zugleich allein die Entschlüsselungs-Fähigkeit halten.
- **Schlüssel-Wiederherstellung im IR-Kontext ist Non-Scope.** Konkrete Wiederherstellungs-Mechanik kryptographischen Schlüsselmaterials verbleibt Custody V1.0 §8 (als Boundary-Topik) und KMS-/HSM-/Implementations-Folgeartefakt (als operative Mechanik).
- **Audit-Spur:** IR-Operationen, die die Custody-Schicht berühren, müssen rekonstruktierbar bleiben (Boundary-Bezug zu Custody V1.0 §12); konkrete Audit-Schemata sind **Non-Scope**.

---

## 10. Mandantentrennung im Incident-Kontext

Auf Boundary-Ebene gilt — konsistent mit F0-D6:

- **Kein Cross-Mandanten-Forensik-Zugriff.** Eine IR-Operation gegenüber einem Mandanten darf **keine** Schlüssel-/Plaintext-/Daten-Wirkung gegenüber einem anderen Mandanten entfalten.
- **Mandantenscharfe Beweissicherung.** Beweissicherungs-Operationen erfolgen mandantenscharf; konkrete Selektions-/Filter-/Isolations-Mechanik ist **Non-Scope** und verbleibt downstream.
- **Mandantentrennung in der Recovery-Schnittstelle.** Die Übergabe an DR-/HA-/BCM-Restore-Operationen wahrt F0-D6 strikt; mandantenspezifischer Restore-Modus gemäß DR-/HA-/BCM V1.0 §7 ist die fachliche Form für mandantenscharfe Wiederherstellungen.

---

## 11. Berechtigungen-/Identity-Boundary

Auf Boundary-Ebene gilt — konsistent mit F0-D7 und DR-/HA-/BCM V1.0 §11:

- **F0-D7 Plattform-Admin-Grenze bleibt unberührt.** Plattform-Admin im IR-Kontext erlangt keinen fachlichen Superuser-Status.
- **Wiederfreigabe-Topik.** Die Wiederfreigabe nach einem Incident ist Boundary-Topik dieses Artefakts; konkrete Wiederfreigabe-Schritte, Genehmigungs-Workflows und Identity-Validierungs-Mechanik sind **Non-Scope**.
- **Identity-Revalidierung.** Produktiver Zugriff nach IR-Operationen wird gegen aktuellen Identity-/Security-State revalidiert (Konsistenz DR-/HA-/BCM V1.0 §11). Konkrete Identity-/Authentication-/Authorization-Mechanik ist **Non-Scope**.

---

## 12. Audit-/Beweis-Boundary

Auf Boundary-Ebene gilt:

- **IR-Operationen müssen rekonstruktierbar bleiben.** Die fachliche chain-of-custody-Boundary umfasst alle Lifecycle-Phasen gemäß §5.
- **Trennung von Audit-Spuren.** Audit-Spuren von IR-Operationen sind getrennt von Custody-Audit, Klassifikations-Audit, GoBD-Audit und Sicherheits-Audit zu führen; eine Boundary-Verschmelzung ist ausgeschlossen.
- **Plaintext-Vermeidung im IR-Audit.** Audit-Spuren von IR-Operationen dürfen Plaintext-Mandantendaten nicht über die IR-Audit-Schicht exponieren.
- **Konkretes Schema, Aufbewahrungsorte, Werkzeug-Wahl, chain-of-custody-Felder, Beweis-Übergabe-Formate** sind **Non-Scope** und werden downstream entschieden.

---

## 13. Verhältnis zu DSGVO-/Datenpannen-Folgeartefakt

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Strikte Trennung** | Beide Folgeartefakte teilen sich Sortierungsmarker C im Locked Decisions Register §6, sind jedoch als getrennte Folgeartefakte enumeriert. V1.0 dieses Artefakts ist Workflow-Boundary; das DSGVO-/Datenpannen-Folgeartefakt operationalisiert DSGVO Art. 33/34. |
| **Keine rechtliche Breach-Notification-Entscheidung** | V1.0 dieses Artefakts trifft **keine** rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34, **keine** Auslegung von Meldefristen, **keine** Aussage über Aufsichtsbehörden-Mitteilung oder Betroffenen-Information. Diese verbleiben strikt dem DSGVO-/Datenpannen-Folgeartefakt. |
| **Schnittstelle** | Sicherheitsrelevante Vorgänge können — sofern sie zugleich Datenschutzverletzungen darstellen — eine parallele Behandlung im DSGVO-/Datenpannen-Folgeartefakt auslösen. V1.0 dieses Artefakts trifft hierzu **keine** Aussage; die parallele Behandlung wird im DSGVO-/Datenpannen-Folgeartefakt geregelt. |
| **Vorrang-Regel** | Bei Konflikt mit dem DSGVO-/Datenpannen-Folgeartefakt gilt jenes für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |

---

## 14. Verhältnis zu Z3-/Datenüberlassung

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | F3-D1 ist eigenständige authoritative Quelle für Z3-/Datenüberlassung. V1.0 dieses Artefakts trifft **keine** Aussage zum Z3-Format, **keinen** Behörden-Auslieferungs-Workflow und **keine** Z3-Mechanik. |
| **Plaintext-Boundary** | Das in F3-D1 verankerte Verbot der Plaintext-Beschaffung durch Plattform-Administration über Z3-Pfade bleibt unberührt; IR-Pfade dürfen **nicht** als Plaintext-Beschaffungs-Umweg über die Z3-Boundary genutzt werden. |

---

## 15. Verhältnis zu Migration

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | F3-D3 ist eigenständige authoritative Quelle für Migrations-Mechanik. V1.0 dieses Artefakts trifft **keine** Aussage zur Migrations-Implementierung, **keinen** Cutover-Workflow und **kein** Migrations-Rollback-Konzept. |
| **DR-Restore ≠ Migrations-Rollback** | Konsistenz Register §3.12 / Retention V1.0 §6.4 / Security V1.0 §10/§11 / DR-/HA-/BCM V1.0 §17. Die Recovery-Schnittstelle aus §6 dieses Artefakts berührt die Migrations-Mechanik **nicht**. |
| **Plattform-Admin-Boundary** | Das in F3-D3 verankerte Verbot des Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Plattform-Administration in Migrations-Pfaden bleibt unberührt; IR-Pfade dürfen **nicht** zur Umgehung dieser Boundary genutzt werden. |

---

## 16. Verhältnis zu ASVS-Control-Referenz V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | ASVS V1.0 §14 etabliert „Boundary-Bezug; nicht Bestandteil dieses Artefakts". V1.0 dieses Artefakts trifft **keine** ASVS-Mapping-Aussage, **keine** ASVS-Verifikations-/Zertifizierungs-/Konformitäts-Behauptung. |
| **Anti-Verifikations-/Anti-Zertifizierungs-Konsistenz** | Die in ASVS V1.0 etablierte Anti-Verifikations-/Anti-Zertifizierungs-Wortwahl wird in V1.0 dieses Artefakts sinngemäß angewendet. |

---

## 17. Verhältnis zu TR-02102-Detail V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | TR-02102-Detail V1.0 §18 etabliert „Ransomware-/Forensik-Workflow; nicht Bestandteil dieses Artefakts". V1.0 dieses Artefakts trifft **keine** Krypto- oder Transport-Familien-Aussage und **keine** BSI-Konformitäts-/TR-02102-Erfüllungs-Behauptung. |
| **Anti-Konformitäts-Konsistenz** | Die in TR-02102-Detail V1.0 etablierte Anti-Konformitäts-Wortwahl wird in V1.0 dieses Artefakts sinngemäß angewendet. |

---

## 18. Verhältnis zu Retention-/Aufbewahrungsarchiv V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | Retention V1.0 §15 listet „Datenschutz-Vorfallsprozess (DSGVO Art. 33/34)" als Out-of-Scope von Retention; analog ist der Cybersecurity-IR-Workflow von Retention getrennt. |
| **Aufbewahrungs-Substitut-Verbot** | IR-Operationen dürfen **nicht** als Substitut für das Retention-Archiv dienen; Retention V1.0 §15 STOP gilt sinngemäß. |
| **Klassifikations-Audit-Schutz** | Klassifikations-Audit-Daten gemäß Regelmatrix V1.0 §13, die im Forensik-Kontext zu schützen sind, werden in IR-Operationen sinngemäß als Schutz-Bezug behandelt; konkrete Schutz-Mechanik ist **Non-Scope**. |

---

## 19. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Keine rechtliche Würdigung** | V1.0 dieses Artefakts trifft **keine** rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17 oder Art. 18; diese verbleibt der externen Rechtsfrage gemäß `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen). |
| **Keine Umgehung gesetzlicher Aufbewahrungspflichten** | IR-Operationen dürfen **nicht** zur Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 ausgelegt werden (Konsistenz mit Lösch-/Sperrkonzept V1.0 §9 und Custody V1.0 §9). |
| **Downstream-Bedingung** | Eine produktive Anwendung von Crypto-Shredding bleibt downstream-bedingt; IR ist **keine** Boundary-Voraussetzung für die Rechtsfrage und auch **keine** Lösung der Rechtsfrage. |

---

## 20. Verhältnis zu gesperrten Harouda-Boundaries

Das Cybersecurity-Incident-Response-Folgeartefakt wahrt strikt:

| Lock | Wahrung in IR |
|---|---|
| **F0-D4 Festschreibung** | Recovery hebt Festschreibung nicht auf; IR-Operationen erzeugen, ändern oder entfernen keine Festschreibungs-Tatsache. F0-D4 bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Kein Cross-Mandanten-Forensik-Zugriff; mandantenscharfe Beweissicherung. F0-D6 bleibt autoritativ. |
| **F0-D7 Plattform-Admin-Grenze** | Plattform-Administration im IR-Kontext bleibt rein technische Ausführung. F0-D7 bleibt autoritativ. |
| **F1-D1 / F1-D2 USt-Wahrheit** | IR-Operationen erzeugen keine USt-Werte. F1-D1/F1-D2 bleiben autoritative USt-Wahrheitsquelle. |
| **F3-D1 Z3-/Datenüberlassung** | IR-Pfade dürfen Z3-Boundary nicht umgehen. F3-D1 bleibt autoritativ. |
| **F3-D2 DR/Restore** | F3-D2 bleibt autoritative Quelle für Restore-Boundary; IR liefert ausschließlich die Vorbedingungen, nicht die Restore-Mechanik. |
| **F3-D3 Migration** | DR-Restore ≠ Migrations-Rollback; IR berührt die Migrations-Mechanik nicht. F3-D3 bleibt autoritativ. |
| **F3-Closing** | IR respektiert die F3-Closing-Boundaries. F3-Closing bleibt autoritativ. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. V1.0 dieses Artefakts wirkt nicht auf den Locked Decisions Register zurück.

---

## 21. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 21.1 | V1.0 dieses Artefakts verschmilzt IR mit DR-/HA-/BCM, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, DSGVO-/Datenpannen-Folgeartefakt, Lösch-/Sperrkonzept, Z3-/Datenüberlassungs-Spezifikation, Migrations-Folgeartefakt, ASVS-Control-Referenz, TR-02102-Detail, Retention-Archiv oder Crypto-Shredding-Rechtsfrage. |
| 21.2 | V1.0 dieses Artefakts schwächt die in DR-/HA-/BCM V1.0 §12 etablierte Ransomware-Restore-Schnittstelle (Integritätsprüfung + forensische Freigabe als Vorbedingung). |
| 21.3 | V1.0 dieses Artefakts schwächt die in Lösch-/Sperrkonzept V1.0 §7 etablierte Sperrgrund-Klasse „Sicherheits-/Forensik-Halt"; IR darf die Sperrgrund-Klasse nur operativ aktivieren/aufheben, nicht ihren Boundary-Inhalt verändern. |
| 21.4 | V1.0 dieses Artefakts schwächt das in F3-D2 + Security V1.0 §10 + Custody V1.0 §5/§9/§11 + DR-/HA-/BCM V1.0 §9 etablierte Verbot des unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Forensik- oder Restore-Operationen. |
| 21.5 | V1.0 dieses Artefakts erlaubt einen Cross-Mandanten-Forensik-Zugriff oder einen Cross-Mandanten-Restore (Verstoß gegen F0-D6). |
| 21.6 | V1.0 dieses Artefakts schwächt, umdeutet oder umgeht F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 21.7 | V1.0 dieses Artefakts behauptet eine Garantie-Aussage gegenüber Mandanten oder Aufsichtsbehörden — insbesondere zu RPO/RTO, MTTD/MTTR, Containment, Recovery, Vorfall-Vermeidung, Ransomware-Vermeidung, Forensik-Reife oder Verfügbarkeit. |
| 21.8 | V1.0 dieses Artefakts behauptet eine externe Zertifizierung, eine Konformität gegenüber externen Normen, eine externe Audit-Bestätigung, einen Audit-Status als zugeschriebene Eigenschaft oder produktbezogene Zertifizierungs-/Marketing-Aussagen. |
| 21.9 | V1.0 dieses Artefakts verwendet standalone Konformitäts-Schlagwörter, freistehende Zertifikats-/Erfüllungs-Behauptungen oder Marketing-Wortwahl als zugeschriebene Eigenschaft Haroudas. |
| 21.10 | V1.0 dieses Artefakts führt ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116 oder eine andere nicht in Security V1.0 §3 oder Retention V1.0 §3 paraphrasierte externe Quelle als Lock-Quelle ein. |
| 21.11 | V1.0 dieses Artefakts trifft eine konkrete SIEM-/SOC-/Forensik-Tool-/Cloud-/Anbieter-/Werkzeug-/Plattform-/Produkt-/Hardware-/Bibliotheks-Wahl. |
| 21.12 | V1.0 dieses Artefakts enthält Incident-Response-Runbooks, Schritt-für-Schritt-Anweisungen, Befehls-Sequenzen, Detection-Regeln (Signaturen, Yara-Regeln, Sigma-Regeln, IOCs, Anomalie-Schwellwerte), Playbooks mit operativen Befehlen oder konkrete Eskalations-Trigger-Werte. |
| 21.13 | V1.0 dieses Artefakts enthält Implementierung, Datenmodell, Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definition, Test-Cases, Test-Methodik, CI/CD-Konfiguration oder konkrete Konfigurations-Werte. |
| 21.14 | V1.0 dieses Artefakts entwirft konkrete Beweis-/Log-Schemata, konkrete chain-of-custody-Felder, konkrete Beweis-Übergabe-Formate oder konkrete Aufbewahrungs-Werte für Forensik-Spuren. |
| 21.15 | V1.0 dieses Artefakts trifft eine rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34, eine Auslegung von Meldefristen, eine Aussage zur Aufsichtsbehörden-Mitteilung oder zur Betroffenen-Information; diese verbleiben strikt dem DSGVO-/Datenpannen-Folgeartefakt. |
| 21.16 | V1.0 dieses Artefakts nimmt eine Crypto-Shredding-Rechtswürdigung vor oder schlägt eine Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 vor. |
| 21.17 | V1.0 dieses Artefakts behauptet eine rechtliche, steuerfachliche, DSB-, Aufsichts-, Sicherheits-, Zertifizierungs-, Audit- oder Produktivfreigabe, die nicht tatsächlich vorliegt. |
| 21.18 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder behauptet eine §6-Sortierungsmarker-Verankerung anders als „Sortierungsmarker C — Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow". |
| 21.19 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 21.20 | V1.0 dieses Artefakts nimmt die Endfassung der Verfahrensdokumentation Kap. 5 oder Kap. 6 vorweg oder ersetzt diese. |
| 21.21 | V1.0 dieses Artefakts browst externe Webseiten oder importiert Originaltext aus externen Normen wörtlich. |
| 21.22 | V1.0 dieses Artefakts erhöht die Forbidden-Reference-Baseline (BLOCKED ≠ 0 oder BASELINE_ALLOWED ≠ 62 oder ALLOW_MARKED ≠ 0) oder verletzt die etablierten Terminologie- und Quality-Gate-Vorgaben des Repositorys (verbotene Tool-/Modell-/Anbieter-Begriffe, BOM, Arabisch, obsolete Sortierungsbezeichnung, generische Sicherheits-/Verfügbarkeits-/Resistenz-Behauptungen, freistehende Konformitäts-Schlagwörter, Zertifizierungs- oder Marketing-Aussagen). |

---

## 22. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Incident-Response-Runbooks jeglicher Art,
- Schritt-für-Schritt-Anweisungen, Befehls-Sequenzen, konkrete Eskalations-Trigger-Werte,
- Forensik-Werkzeug-Wahl,
- SIEM-/SOC-/Tool-/Anbieter-/Cloud-/Vendor-/Hardware-/Bibliotheks-Wahl,
- Detection-Regeln, Signaturen, Yara-Regeln, Sigma-Regeln, IOCs, Anomalie-Schwellwerte,
- Playbooks mit operativen Befehlen,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode, Pseudocode, Algorithmus-Design,
- SQL und Query-Spezifikation,
- API-Definitionen,
- automatische Jobs (Scheduler, Trigger, Pipelines),
- Test-Cases, Test-Methodik, CI/CD-Konfiguration, Werkzeug-Konfiguration,
- Beweis-/Log-Schema oder konkrete chain-of-custody-Felder,
- konkrete Beweis-Übergabe-Formate, konkrete Aufbewahrungs-Werte für Forensik-Spuren,
- rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34 (verbleibt DSGVO-/Datenpannen-Folgeartefakt),
- DSB-, Sicherheits- oder Produktivfreigabe,
- Garantie-Aussagen jeglicher Art (RPO/RTO, MTTD/MTTR, Containment, Recovery, Vorfall-Vermeidung, Ransomware-Vermeidung, Forensik, Verfügbarkeit),
- Schwächung der DR-/HA-/BCM V1.0 §12 Ransomware-Restore-Schnittstelle,
- Schwächung der Lösch-/Sperrkonzept V1.0 §7 Sperrgrund-Klasse,
- Schwächung der Custody V1.0 Boundary,
- Custody-Topologie / Schlüsselhierarchie / Schlüssel-Wiederherstellungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt),
- Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0 + DR-Detail-Folgeartefakte),
- konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter (verbleiben TR-02102-Detail V1.0),
- ASVS-Verifikation / -Mapping (verbleibt ASVS V1.0),
- Z3-/Datenüberlassungs-Format,
- Migrations-Implementierung,
- Retention-Archiv-Speicher-Implementierung,
- rechtliche Würdigung von Crypto-Shredding,
- externe Normen / Zertifizierungen als Lock-Quelle (insbesondere ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116),
- Marketing-Aussagen zu Vorfall-Resistenz, Forensik-Reife, SOC-Reife, Threat-Intelligence-Reife oder vergleichbaren Eigenschaften,
- Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6,
- Rechtsgutachten oder Steuerauskunft im Einzelfall,
- Modifikation des Locked Decisions Register,
- Änderung oder Reinterpretation von §28.11-bet.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung und keine IR-bezogene formale Prüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: keine Implementierung; kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; keine konkreten kryptographischen Parameter; keine Anbieter-, Werkzeug-, Bibliotheks-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; keine konkrete Cluster-/Replikations-/Snapshot-/Backup-/Restore-Mechanik; kein Migrations- oder Migrations-Rollback-Konzept; kein Z3-/Datenüberlassungs-Format; kein Incident-Response-Runbook; keine externe Normen-/Zertifizierungs-Aussage; keine Garantie-Aussage; keine Implementierungs-Autorisierung jeglicher Art; keine Rechts- oder Steuerauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 23. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **Spätere Versions-Pflege dieses Artefakts** — Befüllung der Lifecycle-Topoi mit konkreteren Schnittstellen-Aussagen oder Boundary-Schärfungen; separat zu autorisieren; ohne Garantie-, Konformitäts- oder Werkzeug-Aussagen.
- **Operative IR-Detail-Folgeartefakte** — konkrete Detection-/Containment-/Eradication-/Recovery-/Post-Incident-Workflows, Werkzeug-Konfigurationen, Beweis-Schemata; setzt externe sicherheitsfachliche Prüfung voraus.
- **Forensik-Detail-Folgeartefakt** — konkrete Forensik-Methodik, Werkzeug-Wahl, Beweissicherungs-Workflow, chain-of-custody-Schemata; separat zu autorisieren; setzt externe sicherheitsfachliche Prüfung voraus.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34 (rechtliche Breach-Notification, Meldefristen, Aufsichtsbehörden-Mitteilung, Betroffenen-Information); im Locked Decisions Register §6 als Sortierungsmarker C eigenständig enumeriert; **nicht** Bestandteil dieses Artefakts.
- **DR-/HA-/BCM-Folgeartefakt V1.0** (bereits gelockt) — bleibt strikt von IR getrennt; trägt die Restore-Mechanik.
- **Custody-Modell V1.0 + KMS-/HSM-/Implementations-Folgeartefakt** — bleibt strikt von IR getrennt; trägt die Schlüsselverwaltungs-Topologie und -Mechanik.
- **Verfahrensdokumentation Kap. 5 (nächste Pflege)** — Aufnahme dieses Artefakts und der vorgelagerten V1.0-Lock-Artefakte (Security, Custody, ASVS, TR-02102-Detail, DR-/HA-/BCM) per Verweis als vorgelagerte Spezifikationen.
- **Verfahrensdokumentation Kap. 6 (nächste Pflege)** — Aufnahme dieses Artefakts in Bezug auf Datensicherung-/Datenschutz-Kapitel; nicht im V1.0 Boundary-Charakter, sondern als spätere Pflege.

---

## 24. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für die fachlichen Cybersecurity-Incident-Response-Boundaries in Harouda. Maßgeblich als Boundary-Quelle für nachgelagerte operative IR-Detail-Folgeartefakte und für die Bezugnahme aus Verfahrensdokumentation Kap. 5 und Kap. 6 (im Rahmen ihrer nächsten Pflege). |
| **Bindend für** | Alle in §23 genannten Folgeartefakte, soweit sie auf IR-Boundary-Eingaben aufsetzen; Verfahrensdokumentation Kap. 5 und Kap. 6 (nächste Pflege); alle nachgelagerten Detail-Artefakte zu IR-/Forensik-Themen, soweit sie eine Boundary-Quelle benötigen. |
| **Nicht bindend für** | Konkrete Werkzeug-/Tool-/SIEM-/SOC-/Anbieter-/Cloud-/Hardware-/Bibliotheks-Wahl; konkrete Detection-Regeln, Playbooks, Runbooks; konkrete Beweis-/Log-Schemata oder chain-of-custody-Felder; konkrete Custody-Topologie / Schlüsselhierarchie / Schlüssel-Wiederherstellungs-Mechanik; konkrete Restore-Mechanik; konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter; ASVS-Verifikation/-Mapping; Z3-Format; Migrations-Mechanik; rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34; rechtliche Würdigung von Crypto-Shredding; Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechts- oder Steuerauskunft im Einzelfall; Sicherheits- oder Produktivfreigabe; externe Normen-/Zertifizierungs-Aussage; Garantie-Aussagen jeglicher Art. |
| **STOP-Bedingungen** | **22** nummerierte STOP-Bedingungen (21.1 bis 21.22) gemäß §21. |
| **Boundaries** | IR ≠ Implementierung. IR ≠ Garantie. IR ≠ externe Zertifizierung / Konformität / Audit-Ergebnis. IR ≠ DR-/HA-/BCM-Restore-Mechanik. IR ≠ Lösch-/Sperrkonzept-Boundary. IR ≠ Custody-Modell. IR ≠ KMS-/HSM-/Implementations-Folgeartefakt. IR ≠ DSGVO-/Datenpannen-Folgeartefakt. IR ≠ ASVS-Control-Referenz. IR ≠ TR-02102-Detail. IR ≠ Z3-/Datenüberlassung. IR ≠ Migration. IR ≠ Retention-Archiv. IR ≠ Crypto-Shredding-Rechtswürdigung. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt; Recovery hebt Festschreibung nicht auf. F0-D6 Mandantentrennung bleibt autoritativ; kein Cross-Mandanten-Forensik-Zugriff. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; keine Schlüssel-/Plaintext-/Mandantendaten-Einsicht durch Forensik- oder Restore-Operationen. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Quellgrundlage** | Locked Decisions Register §6 Sortierungsmarker C (Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow); Locked Decisions Register §3.11 / F3-D2 V1.0; DR-/HA-/BCM-Folgeartefakt V1.0 §7 / §12 / §19 / §23; Lösch-/Sperrkonzept-Artefakt V1.0 §7 / §11 / §14; Security-/Krypto-/Key-Custody-Artefakt V1.0 §10 / §15 / §17; Custody-Modell-Boundary-Artefakt V1.0 §5 / §9 / §11 / §15; Dokumentenkategorie-/Retention-Regelmatrix V1.0 §16; ASVS-Control-Referenz-Artefakt V1.0 §14; TR-02102-Detail-Artefakt V1.0 §18; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116 sind ausdrücklich **keine** Lock-Quelle. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. Bei Konflikt mit dem DSGVO-/Datenpannen-Folgeartefakt gilt jenes für rechtliche Meldepflichten gemäß DSGVO Art. 33/34. |
| **Verankerungs-Hinweis** | Das Cybersecurity-Incident-Response-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker C** eigenständig enumeriert (Eintrag: „Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow"). Sortierungsmarker C wird mit dem DSGVO-/Datenpannen-Folgeartefakt geteilt; beide sind als getrennte, eigenständige Folgeartefakte enumeriert. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Lock-Aussage** | Cybersecurity-Incident-Response-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Keine Garantie-Aussage, keine externe Zertifizierung, kein Audit-Ergebnis, keine Sicherheits- oder Produktivfreigabe, keine rechtliche Breach-Notification-Entscheidung. Eine externe sicherheitsfachliche und rechtliche Prüfung bleiben vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. |

---

## 25. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der IR-Anker aus Locked Decisions Register §6 Sortierungsmarker C, F3-D2 V1.0, DR-/HA-/BCM V1.0 §7/§12/§19/§23, Lösch-/Sperrkonzept V1.0 §7/§11/§14, Security V1.0 §10/§15/§17, Custody V1.0 §5/§9/§11/§15, Regelmatrix V1.0 §16, ASVS V1.0 §14 und TR-02102-Detail V1.0 §18 | in V1.0 enthalten |
| Internal Review Patch | Schärfung der Anti-Garantie-/Anti-Konformitäts-/Anti-Zertifizierungs-Wortwahl; Klarstellung der strikten Trennung gegenüber DR-/HA-/BCM, Lösch-/Sperrkonzept, Custody, KMS-/HSM-/Implementations-Folgeartefakt, ASVS-Control-Referenz, TR-02102-Detail und DSGVO-/Datenpannen-Folgeartefakt; ausdrückliche Aufnahme von ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116 in die Negativ-Quellgrundlage; Marker-C-Verankerungs-Hinweis als geteilter Marker mit DSGVO-/Datenpannen-Folgeartefakt klargestellt | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen — insbesondere die Konkretisierung der Lifecycle-Topoi mit operativer Mechanik, die Befüllung mit Werkzeug-/Konfigurations-Aussagen oder die Aufnahme externer Normen-/Zertifizierungs-Aussagen — erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf die in §3 paraphrasierten Lock-Quellen sowie ohne Einführung neuer externer Quellen über die in Security V1.0 §3, Retention V1.0 §3, Custody V1.0 §3 und DR-/HA-/BCM V1.0 §3 bereits paraphrasierten hinaus. Eine externe sicherheitsfachliche Validierung und eine externe rechtliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig.
