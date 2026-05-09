# DSGVO-/Datenpannen-Folgeartefakt V1.0

**Lock-Aussage:** DSGVO-/Datenpannen-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert die im *Harouda Locked Decisions Register V1.0* §3 Z. 349 sowie §6 Sortierungsmarker C („DSGVO-/Datenpannen-Folgeartefakt — DSGVO Art. 33 / 34") angelegte Datenpannen-Boundary auf der Ebene paraphrasierter DSGVO-Topoi (Art. 33 Meldepflicht-Topos, Art. 34 Betroffenen-Informations-Topos, Art. 39 DSB-Aufgaben-Topos), der strikten Trennung gegenüber dem Cybersecurity-Incident-Response-Folgeartefakt V1.0 trotz geteilter Marker C sowie der Bezugnahme auf den Sperrgrund „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7. V1.0 autorisiert **keine** Implementierung. V1.0 enthält **keine** Meldetext-Vorlagen, **keine** Meldeformulare, **keine** Aufsichtsbehörden-Kontaktliste und **keine** Betroffenen-Anschreiben-Vorlagen. V1.0 trifft **keine** rechtliche Entscheidung im Einzelfall, **keine** Auslegung der Risiko-Topoi, **keine** Auslegung der in DSGVO Art. 33 angelegten Melde-Topik und **keine** rechtliche Würdigung von Crypto-Shredding. V1.0 erteilt **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe und **keine** Produktivfreigabe. V1.0 behauptet **keine** externe Zertifizierung, **kein** Audit-Ergebnis und **keine** Konformität gegenüber externen Normen. §28.11-bet bleibt unverändert/offen. Eine externe rechtliche Validierung sowie eine DSB-Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Status | V1.0 — gesperrt auf Boundary-Ebene; intern accepted |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten oder Aufsichtsbehörden |
| Scope | Boundary-Aussagen zu: Datenschutz-Vorfallsprozess auf Topos-Ebene; Risiko-/Schwellen-Boundary (Topos-Verweis ohne Schwellwert-Festlegung); Aufsichtsbehörden-Melde-Boundary (Topos-Verweis ohne Frist-Zähler-Implementierung); Betroffenen-Informations-Boundary (Topos-Verweis ohne Anschreiben-Wortlaut); DSB-Einbindungs-Boundary (Topos-Verweis ohne Aufgabenkatalog); Dokumentations-/Nachweis-Boundary (Topos-Verweis ohne Schema-Festlegung); strikte Trennung gegenüber Cybersecurity-IR V1.0 trotz geteilter Marker C; Verhältnis zum Sperrgrund „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7; Cross-Boundary-Konsistenz mit Retention V1.0, Regelmatrix V1.0, Custody V1.0, Security V1.0, ASVS V1.0, TR-02102-Detail V1.0, DR-/HA-/BCM V1.0, IR V1.0 und gesperrten Harouda-Locks |
| Non-Scope | Rechtsauskunft im Einzelfall; rechtliche Entscheidung über Meldepflichtigkeit eines konkreten Vorfalls; Auslegung der DSGVO-Risiko-Topoi; konkrete Frist-Zähler-Implementierung für die in DSGVO Art. 33 angelegte Melde-Topik; Meldetext-Vorlagen; Meldeformulare; Aufsichtsbehörden-Kontaktlisten; Betroffenen-Anschreiben; externe Kommunikations-Vorlagen; Runbooks; Schritt-für-Schritt-Anweisungen, Befehlssequenzen, konkrete Eskalations-Trigger-Werte; Detection-Regeln; Beweis-/Log-Schemata; chain-of-custody-Felder; Werkzeug-/SIEM-/SOC-/Forensik-Tool-/Anbieter-/Cloud-/Hardware-/Bibliotheks-/Plattform-Wahl; Auftragsverarbeitungs-Vertrags-Wortlaut; DSFA gemäß DSGVO Art. 35; Vorab-Konsultation gemäß DSGVO Art. 36; Datenbank-/Dateisystem-Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; automatische Jobs; Test-Cases; CI/CD-Konfiguration; Cybersecurity-IR-Workflow (verbleibt IR V1.0); DR-/HA-/BCM-Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0); Lösch-/Sperr-Boundary-Inhalt einschließlich der Sperrgrund-Klasse „Sicherheits-/Forensik-Halt" (verbleibt Lösch-/Sperrkonzept V1.0); operative Steuerung des Sperrgrunds (verbleibt Cybersecurity-IR V1.0); Custody-Topologie / Schlüsselhierarchie / Schlüssel-Wiederherstellungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt); konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter (verbleiben TR-02102-Detail V1.0); ASVS-Verifikation/-Mapping (verbleibt ASVS V1.0); Z3-/Datenüberlassungs-Format (verbleibt Z3-Spezifikations-Folgeartefakt); Migrations-Implementierung (verbleibt Migrations-Folgeartefakt); Retention-Archiv-Speicher-Implementierung (verbleibt Retention V1.0 + nachgelagerte Detail-Artefakte); Lohn-DLS-Tiefe (verbleibt Lohn-DLS-Folgeartefakt); rechtliche Würdigung von Crypto-Shredding (verbleibt eigenständige Open-Question); externe Normen/Zertifizierungen als Lock-Quelle (insbesondere ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116); Garantie-Aussagen jeglicher Art; Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechtsgutachten; Steuerauskunft; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register V1.0 §3 Z. 349 (DSGVO Art. 33 / 34 → Datenpannen-Folgeartefakt offen); Locked Decisions Register V1.0 §6 Sortierungsmarker C (DSGVO-/Datenpannen-Folgeartefakt — DSGVO Art. 33 / 34); Locked Decisions Register V1.0 §6 Sortierungsmarker C (Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow; geteilter Marker, getrennte Folgeartefakte); Cybersecurity-Incident-Response-Folgeartefakt V1.0 §13 (Strikte Trennung); Cybersecurity-IR V1.0 §17 STOP 21.15 (negativer Anker: keine rechtliche Breach-Notification-Entscheidung in IR); Cybersecurity-IR V1.0 §23 (Downstream); Lösch-/Sperrkonzept-Artefakt V1.0 §7 (Sperrgrund „Sicherheits-/Forensik-Halt"), §11 (Verhältnis), §14 (Downstream); Security-/Krypto-/Key-Custody-Artefakt V1.0 §3 (Cross-Ref), §6 (Recht-Tabelle), §17 (Downstream); Custody-Modell-Boundary-Artefakt V1.0 §3 (Cross-Ref), §10 (Verhältnis), §15 (Downstream); Dokumentenkategorie-/Retention-Regelmatrix V1.0 §16 (Downstream); ASVS-Control-Referenz-Artefakt V1.0 §14 (Downstream); TR-02102-Detail-Artefakt V1.0 §18 (Downstream); DR-/HA-/BCM-Folgeartefakt V1.0 §17 (Downstream), §20 (Boundary-Confirmation), §23 (Downstream-Artefakte); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §13 (Recht-Tabelle), §15 (Non-Scope), §17 (Downstream); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit Cybersecurity-IR V1.0 gelten dessen Boundary-Inhalte für Workflow-Boundaries; rechtliche Meldepflichten gemäß DSGVO Art. 33/34 verbleiben hingegen autoritativ in V1.0 dieses Folgeartefakts. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

**Wichtiger Hinweis zur Verankerung:** Das DSGVO-/Datenpannen-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) als **Sortierungsmarker C** enumeriert (Eintrag: „DSGVO-/Datenpannen-Folgeartefakt — DSGVO Art. 33 / 34"). Sortierungsmarker C wird mit dem Cybersecurity-Incident-Response-Folgeartefakt geteilt; beide Folgeartefakte sind als getrennte, eigenständige Folgeartefakte enumeriert. Damit ist die Bindungsgrundlage dieses Artefakts repository-intern eindeutig verankert. V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht**.

## 2. Zweck und fachliche Rolle

V1.0 dieses Artefakts beschreibt ausschließlich auf Boundary-/Spec-Ebene:

- die **Boundary-Topoi des Datenschutz-Vorfallsprozesses** als reine Topoi (Art. 33 Meldepflicht-Topos, Art. 34 Betroffenen-Informations-Topos, Art. 39 DSB-Aufgaben-Topos),
- die **Risiko-/Schwellen-Boundary** als reinen Topik-Verweis ohne jegliche Schwellwert-Festlegung,
- die **Aufsichtsbehörden-Melde-Boundary** als Topik-Verweis ohne Auslegung, Frist-Zähler-Implementierung oder Behörden-Bestimmung im Einzelfall,
- die **Betroffenen-Informations-Boundary** als Topik-Verweis ohne Anschreiben-Wortlaut, Inhaltsfeld-Schema oder Kanal-Wahl,
- die **DSB-Einbindungs-Boundary** als Topik-Verweis auf DSGVO Art. 39 ohne Aufgaben-Katalog oder Freigabe-Workflow,
- die **Dokumentations-/Nachweis-Boundary** als Topik-Verweis ohne konkrete Schema-, Feld- oder Speicherort-Vorgaben,
- die **strikte Trennung gegenüber Cybersecurity-IR V1.0** trotz geteilter Marker C im Locked Decisions Register §6,
- das **Verhältnis zum Sperrgrund „Sicherheits-/Forensik-Halt"** gemäß Lösch-/Sperrkonzept V1.0 §7 (Boundary-Inhalt der Sperrgrund-Klasse verbleibt strikt Lösch-/Sperrkonzept V1.0; ihre operative Steuerung verbleibt strikt Cybersecurity-IR V1.0; V1.0 dieses Artefakts ändert weder noch),
- die **Cross-Boundary-Konsistenz** mit Retention V1.0, Regelmatrix V1.0, Custody V1.0, Security V1.0, ASVS V1.0, TR-02102-Detail V1.0, DR-/HA-/BCM V1.0, IR V1.0 sowie den gesperrten Harouda-Locks,
- die **Wahrung F0-D4, F0-D6, F0-D7, F1-D1/F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing**.

Ausdrücklich nicht Gegenstand:

- Rechtsauskunft im Einzelfall, einschließlich rechtlicher Entscheidung über die Meldepflichtigkeit eines konkreten Vorfalls,
- Auslegung der DSGVO-Risiko-Topoi oder der in DSGVO Art. 33 angelegten Melde-Topik,
- Implementierung oder Operationalisierung,
- DSB-, Aufsichtsbehörden-, Sicherheits- oder Produktivfreigabe,
- externe Konformitäts-, Zertifizierungs-, Audit- oder Garantie-Behauptungen,
- rechtliche Würdigung von Crypto-Shredding,
- Cybersecurity-IR-Workflow,
- DR-/HA-/BCM-Restore-Mechanik,
- Lösch-/Sperrkonzept-Boundary-Inhalt,
- Custody-Topologie / Schlüsselhierarchie,
- konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter,
- ASVS-Verifikation / -Mapping,
- Z3-/Datenüberlassungs-Format,
- Migrations-Implementierung,
- Lohn-DLS-Tiefe,
- Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6,
- Änderung oder Reinterpretation von §28.11-bet,
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 3. Authoritative Source Basis

Repository-interne Lock-Quellen — keine externen Texte, keine externen Normen als Lock-Quelle.

| Quelle | Anker | Beitrag |
|---|---|---|
| Locked Decisions Register V1.0 §3 (Cross-Reference) | Z. 349 — „DSGVO Art. 33 / 34 → Datenpannen-Folgeartefakt offen" | **Direkte Verankerungs-Quelle** für die Datenpannen-Boundary |
| Locked Decisions Register V1.0 §6 Sortierungsmarker C | Z. 390 — „DSGVO-/Datenpannen-Folgeartefakt — DSGVO Art. 33 / 34" | **Direkte Verankerungs-Quelle** im Register (Hinweis: Marker C ist nicht-bindender Priorisierungs-Vorschlag und wird mit dem Cybersecurity-IR-Folgeartefakt geteilt; beide sind eigenständig enumeriert) |
| Locked Decisions Register V1.0 §6 Sortierungsmarker C | Z. 391 — „Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow" | Ko-Enumeration des geteilten Markers; bestätigt Trennung trotz geteilter Marker |
| Cybersecurity-Incident-Response-Folgeartefakt V1.0 §13 | Strikte Trennung — IR ist Workflow-Boundary; rechtliche Meldepflicht-Auslegung verbleibt diesem Folgeartefakt | **Direkte Lock-Basis** für die strikte Trennung |
| Cybersecurity-IR V1.0 §17 STOP 21.15 | Negativ-Anker: IR trifft keine rechtliche Breach-Notification-Entscheidung gemäß DSGVO Art. 33/34 | Negativ-Quellgrundlage |
| Cybersecurity-IR V1.0 §23 Downstream-Artefakte | Verweis auf das DSGVO-/Datenpannen-Folgeartefakt als eigenständiges Downstream-Artefakt | Downstream-Anker |
| Lösch-/Sperrkonzept-Artefakt V1.0 §7 | Sperrgrund „Sicherheits-/Forensik-Halt" — Lösch-/Sperr-Operationen werden bis zur forensischen Freigabe ausgesetzt | **Direkte Lock-Basis** für das Verhältnis zur Sperrgrund-Schnittstelle |
| Lösch-/Sperrkonzept V1.0 §11 / §14 | Verhältnis und Downstream-Verweis: DSGVO-/Datenpannen-Folgeartefakt out of scope; eigenständiges Folgeartefakt | Negativ-Anker |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 §3 / §6 / §17 | Cross-Ref „DSGVO Art. 33/34 — Grenzverweis"; Recht-Tabelle „Out of Scope. Datenschutz-Vorfallsprozess ist eigenständiges Folgeartefakt"; Downstream | Negativ-Anker |
| Custody-Modell-Boundary-Artefakt V1.0 §3 / §10 / §15 | Custody-Modell trifft keine Aussage zu Meldepflichten gemäß DSGVO Art. 33/34 | Negativ-Anker |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 §16 | Downstream-Verweis auf das DSGVO-/Datenpannen-Folgeartefakt | Downstream-Anker |
| ASVS-Control-Referenz-Artefakt V1.0 §14 | Downstream-Verweis: Boundary-Bezug; nicht Bestandteil von ASVS V1.0 | Downstream-Anker |
| TR-02102-Detail-Artefakt V1.0 §18 | Downstream-Verweis: Operationalisierung DSGVO Art. 33/34 als eigenständiges Folgeartefakt | Downstream-Anker |
| DR-/HA-/BCM-Folgeartefakt V1.0 §17 / §20 / §23 | Downstream-Verweis; Boundary-Confirmation; Cross-Boundary-Trennung gegenüber DR | Downstream-Anker |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §13 / §15 / §17 | Recht-Tabelle „Eigenständiger Datenschutz-Vorfallsprozess; nicht Bestandteil"; Non-Scope; Downstream | Negativ-Anker |
| Gesperrte Harouda-Registergrenzen | F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing | Bindende Locks |
| Open-Question „Crypto-Shredding rechtliche Einordnung" | Status 🔴 offen; Release-Blocker für produktive Anwendung | Nur Verweis; **keine** rechtliche Würdigung in V1.0 |

Ausdrücklich **keine** externen Lock-Quellen: ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116, DSK-Kurzpapiere, Aufsichtsbehörden-Leitfäden und EDPB-Leitlinien sind **nicht** Lock-Quelle dieses Artefakts. Nennungen externer Normen erfolgen ausschließlich als Negativ-Hinweis.

## 4. Core DSGVO-Datenpannen-Boundaries

Die folgenden Aussagen sind Boundary-Statements; sie sind **keine** rechtliche Auslegung und **keine** Entscheidung im Einzelfall.

| Boundary | Aussage |
|---|---|
| **Topos-Charakter** | DSGVO Art. 33 (Meldepflicht), Art. 34 (Information betroffener Personen) und Art. 39 (DSB-Aufgaben) werden ausschließlich als Boundary-Topoi referenziert; V1.0 dieses Artefakts trifft keine konkrete Auslegung. |
| **Negativ-Ansatz** | V1.0 dieses Artefakts ist negativ formuliert: es legt fest, was der Datenschutz-Vorfallsprozess **nicht** ist und welche Inhalte explizit Non-Scope sind. |
| **Trennung gegenüber Workflow** | Die operative Workflow-Boundary (Detection, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review, Ransomware-/Forensik-Schnittstelle, Sperrgrund-Steuerung) verbleibt strikt dem Cybersecurity-IR-Folgeartefakt V1.0 — trotz geteilter Marker C. |
| **Trennung gegenüber Restore** | Restore-Mechanik, RPO/RTO-Topoi und Wiederanlauf-Workflows verbleiben strikt DR-/HA-/BCM V1.0. |
| **Trennung gegenüber Sperrgrund** | Boundary-Inhalt der Sperrgrund-Klasse „Sicherheits-/Forensik-Halt" verbleibt strikt Lösch-/Sperrkonzept V1.0 §7; deren operative Steuerung verbleibt strikt Cybersecurity-IR V1.0; V1.0 dieses Artefakts verändert weder den Boundary-Inhalt noch steuert er die Sperrgrund-Klasse operativ. |
| **F0-D4 Festschreibung** | Wird durch Datenpannen-Behandlung **nicht** aufgehoben. Festschreibung bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss im Datenschutz-Vorfallsprozess. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; Plattform-Admin erlangt durch Datenpannen-Behandlung **keine** Schlüssel-/Plaintext-/Mandantendaten-Einsicht. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Datenpannen-Behandlung erzeugt keine USt-Werte und ändert keine festgeschriebenen USt-Aussagen. |
| **F3-D1 Z3-/Datenüberlassung** | Bleibt autoritativ; Datenpannen-Behandlung erzeugt **kein** Z3-/Datenüberlassungs-Format. |
| **F3-D2 DR-Anforderungsmodell** | Bleibt autoritativ; Datenpannen-Behandlung autorisiert **keine** Restore-Operation. |
| **F3-D3 Migration** | Bleibt autoritativ; Datenpannen-Behandlung autorisiert **keine** Migration. |
| **F3-Closing Cross-Boundaries** | Bleibt autoritativ; Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

## 5. Datenschutz-Vorfallsprozess Boundary

Auf Boundary-Topos-Ebene; ohne Implementierung; ohne Runbook.

- **Erkennungs-Schnittstelle:** Erkennungs- und Detektions-Aktivitäten verbleiben strikt im Cybersecurity-IR-Folgeartefakt V1.0. V1.0 dieses Artefakts trifft keine Aussage zu Detection-Regeln, Anomalie-Schwellwerten, Indicator-Listen oder zu konkreter SIEM-/SOC-Konfiguration.
- **Initialer Bewertungs-Topos:** Sobald ein erkanntes sicherheitsrelevantes Ereignis zugleich personenbezogene Daten betreffen kann, entsteht — auf Topos-Ebene — die parallele Behandlung als möglicher Datenschutz-Vorfall. Die konkrete Eingangs-Schwelle ist **Non-Scope** dieses Artefakts.
- **Risiko-Bewertungs-Topos:** Topik-Verweis. Schwellenwerte, Bewertungs-Skalen, Scoring-Verfahren oder Ampel-Modelle sind **Non-Scope**.
- **Meldepflicht-Topos:** Topik-Verweis auf DSGVO Art. 33; konkrete Frist-Zähler-Implementierung ist **Non-Scope**.
- **Information-Topos:** Topik-Verweis auf DSGVO Art. 34; konkrete Ansprache, Anschreiben-Inhalt oder Kanal-Wahl ist **Non-Scope**.
- **DSB-Einbindungs-Topos:** Topik-Verweis auf DSGVO Art. 39; konkreter Aufgaben-Katalog, Freigabe-Workflow oder Eskalations-Pfad ist **Non-Scope**.
- **Nachweis-Topos:** Topik-Verweis auf Dokumentations-Boundary gemäß DSGVO Art. 33 Abs. 5; konkrete Schema-Felder, Speicherort oder Aufbewahrungs-Mechanik sind **Non-Scope**.
- **Abschluss-Topos:** Topik-Verweis auf Verfahrens-Abschluss; konkreter Lessons-Learned-Workflow oder Post-Incident-Review-Prozess verbleibt strikt im Cybersecurity-IR-Folgeartefakt V1.0.
- **Parallel-Behandlung:** Sicherheitsrelevante Vorgänge können — sofern sie zugleich Datenschutzverletzungen darstellen — eine parallele Behandlung in V1.0 dieses Artefakts auslösen. Die parallele Workflow-Steuerung verbleibt im Cybersecurity-IR-Folgeartefakt V1.0; die rechtsbezogene Boundary verbleibt in V1.0 dieses Artefakts. Beide Folgeartefakte sind eigenständig.
- **Forensik-Halt-Bezug:** Solange ein Sicherheits-/Forensik-Halt aktiv ist, sind Lösch-/Sperr-Operationen gemäß Lösch-/Sperrkonzept V1.0 §7 ausgesetzt. V1.0 dieses Artefakts trifft hierzu **keine** Aussage und steuert die Sperrgrund-Klasse **nicht** operativ.

## 6. Risiko-/Schwellen-Boundary

- **Topos-Verweis ohne Auslegung:** „Risiko für Rechte und Freiheiten betroffener Personen" sowie „hohes Risiko" werden ausschließlich als Topoi referenziert. V1.0 dieses Artefakts legt **keine** Schwellwerte, Skalen, Wahrscheinlichkeits-Klassen oder Schwere-Klassen fest.
- **Keine Bewertungs-Methodik:** Bewertungs-Methodiken (Scoring-Modelle, Ampel-Schemata, qualitative Matrizen, quantitative Risiko-Modelle) sind **Non-Scope**.
- **Keine Einzelfall-Entscheidung:** Die rechtliche Entscheidung, ob ein konkreter Vorfall die Risiko-Schwelle erreicht, ist **Non-Scope** und obliegt der Rechts-/DSB-Funktion außerhalb dieses Artefakts.
- **Keine Topos-Abgrenzung:** V1.0 dieses Artefakts trifft keine Aussage zur Abgrenzung der Topoi „Risiko" und „hohes Risiko" gegeneinander.
- **Negative Erklärung:** Tendenz-Aussagen, Beispiel-Kataloge oder Heuristik-Listen sind ausgeschlossen, da sie sonst als Auslegung wirken könnten.

## 7. Aufsichtsbehörden-Melde-Boundary

- **Topos-Verweis ohne Auslegung:** Die in DSGVO Art. 33 angelegte Melde-Topik wird als Topik referenziert.
- **Keine Frist-Implementierung:** Eine konkrete Implementierung einer Melde-Frist-Zähler-Logik, einer Frist-Wiederherstellung nach Erkennungs-Verzögerung, einer technischen Frist-Überwachung oder einer Eskalations-Trigger-Wert-Festlegung ist **Non-Scope**.
- **Keine Behörden-Bestimmung:** Die Festlegung der zuständigen Aufsichtsbehörde im Einzelfall, einer Behörden-Liste je Bundesland oder einer Mehrfachmeldungs-Logik ist **Non-Scope**.
- **Keine Meldetext-Vorlagen:** Meldeformulare, Meldetext-Vorlagen, Pflichtfeld-Schemata, Anlagen-Kataloge oder Behörden-spezifische Adapter sind **Non-Scope**.
- **Keine Aufsichtsbehörden-Freigabe-Behauptung:** V1.0 dieses Artefakts behauptet **keine** Anerkennung, **keine** Vorab-Konsultation und **keine** Freigabe durch eine Aufsichtsbehörde.
- **Keine Vorab-Konsultations-Inhalte:** Inhalte gemäß DSGVO Art. 36 sind **Non-Scope**.

## 8. Betroffenen-Informations-Boundary

- **Topos-Verweis ohne Auslegung:** Die in DSGVO Art. 34 angelegte Informations-Topik wird als Topik referenziert.
- **Keine Anschreiben-Vorlagen:** Anschreiben-Wortlaute, Sprach-Versionen, Inhaltsfeld-Schemata oder Medien-Kanal-Festlegungen sind **Non-Scope**.
- **Keine Adressaten-Kreis-Festlegung:** Die Identifikation und Abgrenzung der zu informierenden betroffenen Personen im Einzelfall ist **Non-Scope**.
- **Keine Ausnahme-Auslegung:** Auslegung der in DSGVO Art. 34 Abs. 3 angelegten Ausnahme-Topik ist **Non-Scope**.
- **Keine Kommunikations-Strategie:** Kommunikations-Strategien, Krisen-Kommunikations-Pläne, Presse-Kommunikation oder externe Kommunikations-Plattform-Wahl sind **Non-Scope**.
- **Keine Kanal-/Werkzeug-Wahl:** E-Mail-, Brief-, Portal-, App-Push- oder sonstige Kanal-Wahl ist **Non-Scope**.

## 9. DSB-Einbindungs-Boundary

- **Topos-Verweis auf Art. 39:** Die in DSGVO Art. 39 angelegten DSB-Aufgaben werden als Topoi referenziert.
- **Kein Aufgaben-Katalog:** V1.0 dieses Artefakts erstellt keinen DSB-Aufgaben-Katalog, keine RACI-Matrix, kein DSB-Eskalations-Schema und kein DSB-Freigabe-Workflow-Modell.
- **Keine DSB-Bestellung:** V1.0 dieses Artefakts trifft keine Aussage zur Pflicht oder Modalität einer DSB-Bestellung.
- **Keine DSB-Freigabe:** V1.0 dieses Artefakts erteilt **keine** DSB-Freigabe und ersetzt **keine** DSB-Funktion.
- **DSB-Validierung als externes Erfordernis:** Eine DSB-Validierung des Datenschutz-Vorfallsprozesses bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0.
- **Berufs-/Beschäftigten-Geheimnis-Topik:** StGB § 203, StBerG § 62a, BDSG § 5 und BDSG § 53 werden als Negativ-Topik referenziert; eine Auslegung im Einzelfall ist **Non-Scope**.

## 10. Dokumentations-/Nachweis-Boundary

- **Topos-Verweis auf DSGVO Art. 33 Abs. 5:** Die Dokumentations-Topik wird als Topik referenziert.
- **Kein Schema:** Schema-Felder, Datenbank-Tabellen, Dokument-Strukturen, Indizes oder Aufbewahrungs-Mechanik sind **Non-Scope**.
- **Keine Speicherort-Wahl:** Konkrete Speicherort-Wahl, Storage-Topologie oder Mandantentrennungs-Mechanik der Vorfallsdokumentation sind **Non-Scope**.
- **Keine Beweis-Schemata:** Beweis-Schemata, chain-of-custody-Felder, Hash-Verfahren-Festlegung und Zeitstempel-Verfahren-Festlegung sind **Non-Scope**; die Beweis-Boundary verbleibt im Cybersecurity-IR-Folgeartefakt V1.0.
- **Trennung Dokumentation vs. Retention-Archiv:** Vorfalls-Dokumentation gemäß DSGVO Art. 33 Abs. 5 ist **nicht** das Aufbewahrungs-/Retention-Archiv gemäß AO § 147 / HGB § 257 / GoBD; die Trennung folgt F3-Closing.
- **Keine Audit-Behauptung:** Eine Auditierbarkeits-Behauptung gegenüber externen Auditoren oder Aufsichtsbehörden wird nicht erhoben.

## 11. Verhältnis zu Cybersecurity-Incident-Response V1.0

| Aspekt | Aussage |
|---|---|
| **Geteilte Marker C, getrennte Folgeartefakte** | Beide Folgeartefakte sind im Locked Decisions Register §6 unter **Sortierungsmarker C** enumeriert. Marker C ist nicht-bindender Priorisierungs-Vorschlag und wird zwischen den beiden Folgeartefakten geteilt. Jedes Folgeartefakt ist eigenständig enumeriert. V1.0 dieses Artefakts hebt die strikte Trennung trotz geteilter Marker **nicht** auf. |
| **Workflow-Boundary vs. rechtsbezogene Boundary** | Cybersecurity-IR V1.0 ist Workflow-Boundary (Incident-Lifecycle-Topoi, Ransomware-/Forensik-Schnittstelle, Sperrgrund-Steuerung, Beweis-Boundary). V1.0 dieses Artefakts ist rechtsbezogene Boundary (DSGVO Art. 33/34/39 als Topoi). Beide treffen sich auf Topos-Ebene, ohne sich gegenseitig zu enthalten. |
| **Operative Steuerung** | Operative Steuerung (Detection-Schnittstelle, Containment, Eradication, Recovery-Schnittstelle, Post-Incident-Review, Ransomware-Vorbedingung, forensische Freigabe, Sperrgrund-Aktivierung/-Aufhebung „Sicherheits-/Forensik-Halt") verbleibt strikt im Cybersecurity-IR-Folgeartefakt. V1.0 dieses Artefakts trifft hierzu **keine** Aussage. |
| **Rechtsbezogene Boundary** | Rechtsbezogene Topoi gemäß DSGVO Art. 33/34/39 verbleiben strikt in V1.0 dieses Artefakts. Cybersecurity-IR V1.0 §13 sowie §17 STOP 21.15 verweisen ausdrücklich auf diese Trennung. |
| **Parallel-Behandlung** | Ein sicherheitsrelevanter Vorgang kann — sofern er zugleich personenbezogene Daten betrifft — eine parallele Behandlung in beiden Folgeartefakten auslösen. V1.0 dieses Artefakts trifft **keine** Aussage zur Workflow-Schnittstelle der Parallel-Behandlung; sie wird durch Cybersecurity-IR V1.0 vorgegeben. |
| **Forensik-Halt** | Aussetzung von Lösch-/Sperr-Operationen gemäß Lösch-/Sperrkonzept V1.0 §7 ist Boundary-Inhalt von Lösch-/Sperrkonzept V1.0; deren operative Steuerung verbleibt im Cybersecurity-IR-Folgeartefakt; V1.0 dieses Artefakts modifiziert weder Inhalt noch Steuerung. |
| **Vorrang-Regel** | Bei Konflikt mit Cybersecurity-IR V1.0 gelten dessen Boundary-Inhalte für Workflow-Boundaries; rechtliche Meldepflichten gemäß DSGVO Art. 33/34 verbleiben hingegen autoritativ in V1.0 dieses Folgeartefakts. |

## 12. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Aspekt | Aussage |
|---|---|
| **Sperrgrund-Inhalt unverändert** | Boundary-Inhalt der Sperrgrund-Klasse „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7 verbleibt strikt unverändert. V1.0 dieses Artefakts ändert den Inhalt **nicht**. |
| **Keine operative Sperrgrund-Steuerung** | V1.0 dieses Artefakts steuert die Sperrgrund-Klasse **nicht** operativ; die operative Steuerung verbleibt im Cybersecurity-IR-Folgeartefakt V1.0. |
| **Aussetzung Lösch-/Sperr-Operationen** | Solange ein Sicherheits-/Forensik-Halt aktiv ist, sind Lösch-/Sperr-Operationen gemäß Lösch-/Sperrkonzept V1.0 ausgesetzt. V1.0 dieses Artefakts trifft hierzu **keine** Aussage. |
| **Rechtsbezogene Trennung** | DSGVO-Art.-18-Topik (Recht auf Einschränkung der Verarbeitung) bleibt eigenständige Topik im Lösch-/Sperrkonzept V1.0; V1.0 dieses Artefakts vermischt sie nicht mit der Datenpannen-Topik. |
| **Vorrang-Regel** | Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. |

## 13. Verhältnis zu DR-/HA-/BCM V1.0

| Aspekt | Aussage |
|---|---|
| **Keine Restore-Mechanik** | Restore-Mechanik, Restore-Modi, RPO/RTO-Topoi, Forensic Restore und Wiederanlauf-Workflows verbleiben strikt DR-/HA-/BCM V1.0. |
| **Keine Verfügbarkeits-Aussage** | V1.0 dieses Artefakts trifft keine Verfügbarkeits-Aussage und keine Wiederanlauf-Aussage. |
| **Datenpannen ≠ DR-Backup** | DR-Backup und sein Restore-Schicksal sind **kein** Datenpannen-Werkzeug. Eine etwaige Datenschutz-Implikation im Backup-Bestand ist Boundary-Topos beider Folgeartefakte; ihre rechtsbezogene Behandlung verbleibt jedoch in V1.0 dieses Artefakts, ihre Restore-Behandlung in DR-/HA-/BCM V1.0. |
| **F3-D2 unverändert** | F3-D2 DR-Anforderungsmodell bleibt autoritativ. RPO/RTO sind Harouda-SLA-/Risk-Targets, **nicht** gesetzlich. |
| **Vorrang-Regel** | Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. |

## 14. Verhältnis zu Custody-Modell V1.0

| Aspekt | Aussage |
|---|---|
| **Custody-Mechanik unverändert** | Konkrete Custody-Topologie, Schlüsselhierarchie, Schlüsselrotation, Schlüsselzerstörung und Schlüssel-Wiederherstellungs-Mechanik verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. |
| **Plaintext-Boundary unverändert** | Plaintext-Restore-Boundary und Plattform-Admin-Plaintext-Boundary verbleiben Custody V1.0 §5 / §9. |
| **Cross-Mandanten-Verbot** | F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss durch Datenpannen-Behandlung. |
| **Vorrang-Regel** | Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |

## 15. Verhältnis zu Retention / Regelmatrix

| Aspekt | Aussage |
|---|---|
| **Retention-Archiv unverändert** | Aufbewahrungs-/Retention-Archiv-Boundary gemäß AO § 147 / HGB § 257 / GoBD verbleibt Retention V1.0. |
| **Trennung Vorfalls-Dokumentation** | Vorfalls-Dokumentation gemäß DSGVO Art. 33 Abs. 5 ist **nicht** Bestandteil des Aufbewahrungs-/Retention-Archivs. Beide Boundaries sind getrennt (Konsistenz mit F3-Closing). |
| **Regelmatrix unverändert** | Dokumentenkategorie-/Retention-Regelmatrix V1.0 bleibt unverändert; V1.0 dieses Artefakts erzeugt **keine** neue Dokumentenkategorie und **keine** neue Retention-Regel. |
| **Lohn-Tiefe Non-Scope** | Lohn-Tiefe gemäß EStG § 41 verbleibt Lohn-DLS-Folgeartefakt; V1.0 dieses Artefakts trifft **keine** lohnspezifische Aussage. |

## 16. Verhältnis zu Security / ASVS / TR-02102-Detail

| Aspekt | Aussage |
|---|---|
| **Sicherheits-Boundary unverändert** | Sicherheits-/Plaintext-Boundary verbleibt Security V1.0. |
| **ASVS unverändert** | ASVS-Verifikation und ASVS-Mapping verbleiben ASVS V1.0; V1.0 dieses Artefakts trifft **keine** ASVS-Konformitäts-Aussage. |
| **TR-02102-Detail unverändert** | Konkrete Krypto-Algorithmen, Cipher Suites und TLS-Parameter verbleiben TR-02102-Detail V1.0; V1.0 dieses Artefakts trifft **keine** Aussage zu konkreten Krypto-Parametern. |
| **Art.-32-Bezug** | DSGVO Art. 32 (Sicherheit der Verarbeitung) wird ausschließlich als Topos-Verweis auf Security V1.0 geführt; eine Auslegung der Art.-32-Anforderungen im Einzelfall ist **Non-Scope**. |
| **Negativ-Erklärung Normen** | ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz und BSI TR-03116 sind ausdrücklich **kein** Lock-Quelle. |

## 17. Verhältnis zu Z3 / Migration / Lohn-DLS

| Aspekt | Aussage |
|---|---|
| **Z3-/Datenüberlassung** | Verbleibt F3-D1 / Z3-Spezifikations-Folgeartefakt. Datenpannen-Behandlung erzeugt **kein** Z3-/Datenüberlassungs-Format. |
| **Migration** | Verbleibt F3-D3 / Migrations-Folgeartefakt. Datenpannen-Behandlung autorisiert **keine** Migration. |
| **Lohn-DLS** | Verbleibt Lohn-DLS-Folgeartefakt. V1.0 dieses Artefakts trifft **keine** lohn-tiefe Aussage. |
| **F3-Closing** | Bleibt autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen. |

## 18. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Aspekt | Aussage |
|---|---|
| **Open-Question-Verweis** | `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen; Release-Blocker für produktive Anwendung). |
| **Keine rechtliche Würdigung** | V1.0 dieses Artefakts nimmt **keine** rechtliche Würdigung von Crypto-Shredding vor und trifft **keine** Aussage zur Frage, ob Crypto-Shredding eine Löschung im Sinne von DSGVO Art. 17 darstellt. |
| **Externe Validierung** | Eine externe rechtliche Validierung der Crypto-Shredding-Frage bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich; sie ist **Non-Scope** dieser V1.0. |
| **Open-Question-Datei unverändert** | V1.0 dieses Artefakts ändert die Open-Question-Datei **nicht**. |

## 19. Verhältnis zu gesperrten Harouda-Boundaries

| Boundary | Aussage |
|---|---|
| **F0-D4 Festschreibung** | Bleibt unberührt; Datenpannen-Behandlung hebt Festschreibung **nicht** auf. |
| **F0-D6 Mandantentrennung** | Bleibt autoritativ; **kein** Cross-Mandanten-Vorfallsbehandlungs-Datenfluss. |
| **F0-D7 Plattform-Admin-Grenze** | Bleibt rein technische Rolle; **keine** Schlüssel-/Plaintext-/Mandantendaten-Einsicht durch Datenpannen-Behandlung. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Bleibt unberührt; Datenpannen-Behandlung erzeugt **keine** USt-Werte. |
| **F3-D1** | Bleibt autoritativ. |
| **F3-D2** | Bleibt autoritativ. |
| **F3-D3** | Bleibt autoritativ. |
| **F3-Closing** | Bleibt autoritativ. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet **nicht**. |

## 20. STOP-Bedingungen

V1.0 dieses Artefakts ist invalid, falls eine der folgenden Bedingungen eintritt:

| Nr. | STOP-Bedingung |
|---|---|
| 20.1 | V1.0 dieses Artefakts verschmilzt die Datenpannen-Boundary mit Cybersecurity-IR, DR-/HA-/BCM, Lösch-/Sperrkonzept, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Security, ASVS, TR-02102-Detail, Retention-Archiv, Regelmatrix, Z3-/Datenüberlassung, Migration, Lohn-DLS oder der Crypto-Shredding-Rechtsfrage. |
| 20.2 | V1.0 dieses Artefakts erteilt Rechtsauskunft, Steuerauskunft oder eine rechtliche Entscheidung im Einzelfall. |
| 20.3 | V1.0 dieses Artefakts trifft eine rechtliche Entscheidung über die Meldepflichtigkeit eines konkreten Vorfalls. |
| 20.4 | V1.0 dieses Artefakts legt Schwellwerte, Skalen oder Bewertungs-Modelle für die in DSGVO Art. 33/34 angelegten Risiko-Topoi fest. |
| 20.5 | V1.0 dieses Artefakts implementiert oder spezifiziert einen konkreten Frist-Zähler für die in DSGVO Art. 33 angelegte Melde-Topik. |
| 20.6 | V1.0 dieses Artefakts erteilt eine DSB-Freigabe, eine Aufsichtsbehörden-Freigabe, eine Sicherheitsfreigabe oder eine Produktivfreigabe. |
| 20.7 | V1.0 dieses Artefakts behauptet eine externe Zertifizierung, ein Audit-Ergebnis oder eine Konformität gegenüber externen Normen. |
| 20.8 | V1.0 dieses Artefakts spricht eine Garantie-Aussage gegenüber Mandanten oder Aufsichtsbehörden aus. |
| 20.9 | V1.0 dieses Artefakts enthält Meldetext-Vorlagen, Meldeformulare, Aufsichtsbehörden-Kontaktlisten, Betroffenen-Anschreiben oder externe Kommunikations-Vorlagen. |
| 20.10 | V1.0 dieses Artefakts enthält Runbooks, Schritt-für-Schritt-Anweisungen, Befehlssequenzen, Detection-Regeln oder konkrete Eskalations-Trigger-Werte. |
| 20.11 | V1.0 dieses Artefakts enthält Datenbank-/Dateisystem-Schemata, Programmcode, Pseudocode, SQL, UI/UX, APIs, automatische Jobs, Test-Cases oder CI/CD-Konfiguration. |
| 20.12 | V1.0 dieses Artefakts enthält Beweis-/Log-Schemata, chain-of-custody-Felder, Hash-Verfahren-Festlegungen oder Zeitstempel-Verfahren-Festlegungen. |
| 20.13 | V1.0 dieses Artefakts wählt Werkzeuge, Anbieter, Cloud-Provider, SIEM-/SOC-Lösungen, Forensik-Tools, Plattformen, Bibliotheken oder Hardware. |
| 20.14 | V1.0 dieses Artefakts importiert externen Normen-Text oder erhebt externe Normen (insbesondere ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116) zur Lock-Quelle. |
| 20.15 | V1.0 dieses Artefakts nimmt eine rechtliche Würdigung von Crypto-Shredding vor. |
| 20.16 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 20.17 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder eine Open-Question-Datei. |
| 20.18 | V1.0 dieses Artefakts erstellt oder finalisiert Inhalte für Verfahrensdokumentation Kap. 5 oder Kap. 6. |
| 20.19 | V1.0 dieses Artefakts hebt die strikte Trennung gegenüber Cybersecurity-IR V1.0 trotz geteilter Marker C auf oder behauptet eine Verschmelzung der beiden Folgeartefakte. |
| 20.20 | V1.0 dieses Artefakts steuert operativ den Sperrgrund „Sicherheits-/Forensik-Halt" oder verändert dessen Boundary-Inhalt. |
| 20.21 | V1.0 dieses Artefakts trifft eine Aussage zur DSFA gemäß DSGVO Art. 35 oder zur Vorab-Konsultation gemäß DSGVO Art. 36 jenseits eines reinen Negativ-Verweises. |
| 20.22 | V1.0 dieses Artefakts trifft eine Aussage zum Auftragsverarbeitungs-Vertrags-Wortlaut gemäß DSGVO Art. 28. |
| 20.23 | V1.0 dieses Artefakts schwächt F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 20.24 | V1.0 dieses Artefakts enthält Inhalte in arabischer Schrift oder beginnt mit einem UTF-8-BOM. |
| 20.25 | V1.0 dieses Artefakts verwendet Konformitäts-, Zertifizierungs-, Audit-, Garantie- oder Freigabe-Behauptungen — auch nicht in Beispielform innerhalb dieser STOP-Klauseln. |

## 21. Explicit Non-Scope

- Rechtsauskunft im Einzelfall; rechtliche Entscheidung über die Meldepflichtigkeit eines konkreten Vorfalls; Auslegung der DSGVO-Risiko-Topoi; Auslegung der in DSGVO Art. 33 angelegten Melde-Topik.
- Implementierung; Operationalisierung; Workflow-Steuerung; Detection; Containment; Eradication; Recovery-Schnittstelle; Post-Incident-Review (verbleiben Cybersecurity-IR V1.0).
- Restore-Mechanik (verbleibt DR-/HA-/BCM V1.0).
- Lösch-/Sperr-Boundary-Inhalt; Sperrgrund-Steuerung „Sicherheits-/Forensik-Halt" (Boundary-Inhalt verbleibt Lösch-/Sperrkonzept V1.0; operative Steuerung verbleibt Cybersecurity-IR V1.0).
- Custody-Topologie / Schlüsselhierarchie / Schlüssel-Wiederherstellungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt).
- Konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter (verbleiben TR-02102-Detail V1.0).
- ASVS-Verifikation / -Mapping (verbleibt ASVS V1.0).
- Z3-/Datenüberlassungs-Format (verbleibt Z3-Spezifikations-Folgeartefakt).
- Migrations-Implementierung (verbleibt Migrations-Folgeartefakt).
- Retention-Archiv-Speicher-Implementierung (verbleibt Retention V1.0 + nachgelagerte Detail-Artefakte).
- Lohn-DLS-Tiefe (verbleibt Lohn-DLS-Folgeartefakt).
- Rechtliche Würdigung von Crypto-Shredding (verbleibt eigenständige Open-Question; Status 🔴 offen).
- DSFA gemäß DSGVO Art. 35; Vorab-Konsultation gemäß DSGVO Art. 36; Auftragsverarbeitungs-Vertrags-Wortlaut gemäß DSGVO Art. 28.
- Meldetext-Vorlagen; Meldeformulare; Aufsichtsbehörden-Kontaktlisten; Betroffenen-Anschreiben; externe Kommunikations-Vorlagen.
- Runbooks; Schritt-für-Schritt-Anweisungen; Befehlssequenzen; konkrete Eskalations-Trigger-Werte; Detection-Regeln; Beweis-/Log-Schemata; chain-of-custody-Felder.
- Werkzeug-/SIEM-/SOC-/Forensik-Tool-/Anbieter-/Cloud-/Hardware-/Bibliotheks-/Plattform-Wahl.
- Externe Normen / Zertifizierungen als Lock-Quelle (insbesondere ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116).
- Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6.
- Rechtsgutachten; Steuerauskunft; DSB-/Aufsichtsbehörden-/Sicherheits-/Produktivfreigabe.
- Konformitäts-, Zertifizierungs-, Audit-, Garantie- oder Freigabe-Behauptungen.
- Änderung oder Reinterpretation von §28.11-bet.
- Änderung des Locked Decisions Register oder einer Open-Question-Datei.

## 22. Downstream Artefakte / Open Detail Decisions

| Folgeartefakt / Schritt | Charakter | Status |
|---|---|---|
| **Cybersecurity-Incident-Response-Folgeartefakt V1.0** | Workflow-Boundary; Sortierungsmarker C (geteilt mit V1.0 dieses Artefakts) | LIVE |
| **Datenschutz-Vorfallsprozess-Detail-Folgeartefakt** | Detail-Boundary für Risiko-Bewertungs-Topik, Frist-Topik, Dokumentations-Topik (jenseits Boundary-Ebene) | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **DSB-Funktions-Folgeartefakt** | Boundary für DSB-Aufgaben-Modell und DSB-Eskalations-Modell | offen; ausdrücklich nicht Bestandteil von V1.0 |
| **Externe rechtliche Validierung** | Externer Validierungs-Schritt vor produktiver bzw. rechtsverbindlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **DSB-Validierung** | Externer DSB-Validierungs-Schritt vor produktiver bzw. rechtsverbindlicher Anwendung | erforderlich; **Non-Scope** dieser V1.0 |
| **Crypto-Shredding rechtliche Einordnung** | Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung) | offen; **keine** Würdigung in V1.0 |
| **Verfahrensdokumentation Kap. 5 / Kap. 6** | Endfassung; Kap. 5 Sicherheit, Kap. 6 Aufbewahrung/Lösch-Sperr | im Rahmen der jeweils nächsten Pflege; **Non-Scope** dieser V1.0 |
| **KMS-/HSM-/Implementations-Folgeartefakt** | Custody-/Schlüssel-Implementations-Boundary | offen; nicht Bestandteil von V1.0 |
| **Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt** | F3-D1-Format-Boundary | offen; nicht Bestandteil von V1.0 |
| **Migrations-Folgeartefakt** | F3-D3-Implementierungs-Boundary | offen; nicht Bestandteil von V1.0 |
| **Lohn-DLS-Folgeartefakt** | EStG § 41 Lohn-Tiefe | offen; nicht Bestandteil von V1.0 |

V1.0 dieses Artefakts erzeugt **keine** Implementierung, **keine** Konfiguration und **keinen** Mechanismus.

## 23. V1.0 Lock-Profil

| Profil-Aspekt | Wert |
|---|---|
| **Status** | V1.0 — gesperrt auf Boundary-Ebene |
| **Charakter** | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Aufsichtsbehörden-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung; **keine** Garantie-Aussage gegenüber Mandanten oder Aufsichtsbehörden |
| **STOP-Bedingungen** | 25 Klauseln (§20.1 — §20.25) |
| **Bindend für** | Alle in Abschnitt 22 genannten Folgeartefakte; Verfahrensdokumentation Kap. 5 und Kap. 6 (im Rahmen ihrer jeweils nächsten Pflege) hinsichtlich der Trennlinien dieses Artefakts; alle nachgelagerten Detail-Artefakte zu Datenpannen-Themen. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen Cybersecurity-IR, DR-/HA-/BCM, Lösch-/Sperrkonzept, Custody-Modell, Security, ASVS, TR-02102-Detail, Retention-Archiv, Regelmatrix, Z3-/Datenüberlassung, Migration, Lohn-DLS sowie die Crypto-Shredding-Rechtsfrage. |
| **Nicht bindend für** | Konkreter Datenschutz-Vorfallsprozess. Rechtsauskunft im Einzelfall. Rechtliche Entscheidung über Meldepflichtigkeit eines konkreten Vorfalls. Schwellwert-Festlegung für die DSGVO-Risiko-Topoi. Konkreter Frist-Zähler für die in DSGVO Art. 33 angelegte Melde-Topik. Werkzeug-/Tool-/SIEM-/SOC-/Forensik-Tool-/Anbieter-/Cloud-/Hardware-/Bibliotheks-Wahl. Konkrete Detection-Regeln, Playbooks, Runbooks. Konkrete Beweis-/Log-Schemata oder chain-of-custody-Felder. Konkrete Custody-Topologie / Schlüsselhierarchie / Schlüssel-Wiederherstellungs-Mechanik. Konkrete Restore-Mechanik. Konkrete Krypto-Algorithmen / Cipher Suites / TLS-Parameter. ASVS-Verifikation/-Mapping. Z3-Format. Migrations-Mechanik. Lohn-Tiefe. Rechtliche Würdigung von Crypto-Shredding. Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. Externe Normen-/Zertifizierungs-Aussage. Garantie-Aussagen jeglicher Art. |
| **Boundaries** | DSGVO-/Datenpannen ≠ Cybersecurity-IR. DSGVO-/Datenpannen ≠ DR-/HA-/BCM. DSGVO-/Datenpannen ≠ Lösch-/Sperrkonzept. DSGVO-/Datenpannen ≠ Custody-Modell. DSGVO-/Datenpannen ≠ Security. DSGVO-/Datenpannen ≠ ASVS-Control-Referenz. DSGVO-/Datenpannen ≠ TR-02102-Detail. DSGVO-/Datenpannen ≠ Retention-Archiv. DSGVO-/Datenpannen ≠ Regelmatrix. DSGVO-/Datenpannen ≠ Z3-/Datenüberlassung. DSGVO-/Datenpannen ≠ Migration. DSGVO-/Datenpannen ≠ Lohn-DLS. DSGVO-/Datenpannen ≠ Crypto-Shredding-Rechtswürdigung. DSGVO-/Datenpannen ≠ KMS-/HSM-/Implementations-Folgeartefakt. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ; **kein** Cross-Mandanten-Datenfluss. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle. F1-D1 / F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit Cybersecurity-IR V1.0 gelten dessen Boundary-Inhalte für Workflow-Boundaries; rechtliche Meldepflichten gemäß DSGVO Art. 33/34 verbleiben hingegen autoritativ in V1.0 dieses Folgeartefakts. Bei Konflikt mit DR-/HA-/BCM V1.0 gilt DR-/HA-/BCM V1.0 für Restore-/Wiederherstellungs-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Sperrgrund-/Lösch-/Sperr-Boundaries. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Sicherheits-/Plaintext-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |
| **Verankerungs-Hinweis** | Das DSGVO-/Datenpannen-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker C** eigenständig enumeriert (Eintrag: „DSGVO-/Datenpannen-Folgeartefakt — DSGVO Art. 33 / 34"). Sortierungsmarker C wird mit dem Cybersecurity-IR-Folgeartefakt geteilt; beide sind als getrennte, eigenständige Folgeartefakte enumeriert. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Externe Validierung** | Vor produktiver bzw. rechtsverbindlicher Anwendung sind eine externe rechtliche Validierung sowie eine DSB-Validierung erforderlich. Beide sind **Non-Scope** von V1.0. |

## 24. Versionshinweis

| Aspekt | Wert |
|---|---|
| Version | V1.0 |
| Status | gesperrt auf Boundary-Ebene; intern accepted; **nicht** Bestandteil eines externen Audit- oder Zertifizierungs-Pfads |
| Vorgängerversion | keine |
| Internal Review Patch | Schärfung der Anti-Garantie-/Anti-Konformitäts-/Anti-Zertifizierungs-Wortwahl; Klarstellung der strikten Trennung gegenüber Cybersecurity-IR trotz geteilter Marker C; ausdrückliche Aufnahme von ISO 27035, NIST SP 800-61, NIST SP 800-86, ENISA, BSI IT-Grundschutz, BSI TR-03116 in die Negativ-Quellgrundlage; Marker-C-Verankerungs-Hinweis als geteilter Marker mit Cybersecurity-IR-Folgeartefakt klargestellt; Crypto-Shredding-Rechtsfrage als ausdrücklicher Open-Question-Verweis ohne Würdigung in V1.0 verankert; in V1.0 enthalten |
| Nächste Review-Runde | Keine weitere Review-Runde auf Boundary-Ebene; Detail-Folgeartefakte werden eigenständig versioniert. Eine externe rechtliche Validierung sowie eine DSB-Validierung bleiben vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. |
