# DR-/HA-/BCM-Folgeartefakt — V1.0

**Lock-Aussage:** DR-/HA-/BCM-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert die in F3-D2 V1.0 (Disaster-Recovery-Anforderungsmodell) und im Locked Decisions Register §6 Sortierungsmarker B („Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2") angelegte Verfügbarkeits- und Wiederherstellungs-Boundary auf der Ebene paraphrasierter DR-/HA-/BCM-Topoi, RPO-/RTO-Boundary, Restore-Modi-Boundary, Custody-/Plaintext-Restore-Boundary, Mandantentrennung im Restore und Ransomware-Restore-Boundary. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe und **keine** Produktivfreigabe. V1.0 erhebt **keinen** Anspruch auf externe Zertifizierung, **kein** Audit-Ergebnis und **keine** Konformitäts-Behauptung gegenüber externen Normen. V1.0 autorisiert **keine** Implementierung. V1.0 spricht **keine** RPO-/RTO-Garantie aus und behauptet **keine** Verlust- oder Verfügbarkeits-Garantie. Eine externe sicherheitsfachliche Validierung sowie eine externe rechtliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | DR-/HA-/BCM-Folgeartefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** RPO-/RTO-Garantie; **keine** externe Zertifizierungs-/Audit-/Konformitäts-Behauptung |
| Zweck | Festlegung der fachlichen Boundary-Aussagen für DR (Disaster-Recovery), HA (Hochverfügbarkeit) und BCM (Business Continuity Management / Geschäftsfortführung) in Harouda; Konkretisierung der in F3-D2 angelegten Verfügbarkeits-/Wiederherstellungs-Boundary auf Topik-Ebene und Hinzufügung der in Register §6 Sortierungsmarker B benannten Near-zero-Topoi außerhalb F3-D2 — durchgehend ohne Garantie- oder Konformitäts-Anspruch und ohne Implementierungsregel |
| Scope | Boundary-Aussagen zu: DR-/HA-/BCM-Trio-Terminologie; RPO-/RTO-Boundary mit F3-D2-Default als Produktpolitik; Near-zero-RPO/RTO als Boundary-Topik außerhalb F3-D2; Restore-Modi auf Topik-Ebene (Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic); Trennung DR-Backup vs. Aufbewahrungs-/Retention-Archiv vs. Z3-/Datenüberlassung vs. Migration; Custody-/Plaintext-Restore-Boundary; Mandantentrennung im Restore (F0-D6); Berechtigungen-/Identity-Boundary bei Restore; Ransomware-Restore-Boundary; Cross-Boundary-Konsistenz mit Retention V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Custody V1.0, ASVS V1.0, TR-02102-Detail V1.0 und gesperrten Harouda-Locks |
| Non-Scope | Konkrete Infrastruktur-Architektur, Cluster-Topologie, Replikations-Topologie, Datenbank-Cluster-Modelle; Cloud-/Anbieter-/Werkzeug-/Vendor-/Hardware-/Bibliotheks-Wahl; konkrete Backup-Tooling, Snapshot-Werkzeuge, Restore-Skripte; operative Runbooks; Schema; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; UI/UX; APIs; KMS-/HSM-Topologie und Schlüssel-Wiederherstellungs-Mechanik (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt); Incident-Response-Runbook und Forensik-Workflow-Detail (verbleibt Cybersecurity-Incident-Response-Folgeartefakt); Z3-/Datenüberlassungs-Format (verbleibt Z3-Spezifikations-Folgeartefakt); Migrations-Rollback-Mechanik (verbleibt Migrations-Folgeartefakt); Retention-Archiv-Speicher-Implementierung (verbleibt Retention V1.0 + nachgelagerte Detail-Artefakte); externe Normen/Zertifizierungen als Lock-Quelle (insbesondere ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116, NIST-, ENISA-Quellen); RPO-/RTO-Garantien; Verlust- oder Verfügbarkeits-Garantie-Aussagen; rechtliche Würdigung von Crypto-Shredding; Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechtsgutachten; Steuerauskunft; DSB-/Sicherheits-/Produktivfreigabe; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Locked Decisions Register §3.11 / F3-D2 V1.0 (Disaster-Recovery — Authoritatives DR-Anforderungsmodell); Locked Decisions Register §6 Sortierungsmarker B (Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §6.1 (Retention-Archiv vs. DR-Backup) und §6.4 (DR-Restore vs. Migrations-Rollback); Security-/Krypto-/Key-Custody-Artefakt V1.0 §10 (DR / Backup / Restore Boundary) und §17 (Downstream-Auftrag); Lösch-/Sperrkonzept-Artefakt V1.0 §7 (Sperrgrund „Sicherheits-/Forensik-Halt"), §11 (Verhältnis), §14 (Downstream); Dokumentenkategorie-/Retention-Regelmatrix V1.0 §12 (F3-D2-Wahrung) und §16 (Downstream); Custody-Modell-Boundary-Artefakt V1.0 §5 (Plattform-Admin-/Plaintext-Boundary), §6 (Storage-vs-Key-Access), §10 (Verhältnis), §11 (F3-D2-Wahrung), §15 (Downstream); ASVS-Control-Referenz-Artefakt V1.0 §9 / §14; TR-02102-Detail-Artefakt V1.0 §11 / §15 / §18; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit F3-D2 V1.0 gilt F3-D2 für DR-/Restore-Boundary-Aussagen. Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Trennungs-Boundaries. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Restore-/Plaintext-/Krypto-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Anbieter-/Werkzeug-/Tool-Wahl, keine Konfigurations-Werte, keine Beschaffung. |

**Wichtiger Hinweis zur Verankerung:** Das DR-/HA-/BCM-Folgeartefakt ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) als **Sortierungsmarker B** explizit eigenständig enumeriert (Eintrag: „Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2"). Damit ist die Bindungsgrundlage dieses Artefakts repository-intern eindeutig verankert. V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht**.

---

## 2. Zweck und fachliche Rolle

Das DR-/HA-/BCM-Folgeartefakt definiert die fachlichen Boundary-Grenzen für:

- die paraphrasierte **DR-Boundary** (Disaster-Recovery / Wiederanlauf nach technischer Störung) auf Basis F3-D2 V1.0 und Security V1.0 §10,
- die paraphrasierte **HA-Boundary** (Hochverfügbarkeit) als Boundary-Topik für laufende Verfügbarkeit ohne erforderlichen Wiederanlauf,
- die paraphrasierte **BCM-Boundary** (Business Continuity Management / Geschäftsfortführung) als organisatorisch-fachlicher Rahmen,
- die **RPO-/RTO-Boundary** mit F3-D2-Default (RPO 24 h / RTO 48 h) als Produktpolitik und Near-zero-RPO/RTO als Boundary-Topik außerhalb F3-D2,
- die **Restore-Modi-Boundary** auf Topik-Ebene (Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic),
- die **Trennlinie** gegenüber Aufbewahrungs-/Retention-Archiv, Z3-/Datenüberlassung und Migration,
- die **Custody-/Plaintext-Restore-Boundary** zur Wahrung von F3-D2 + Security V1.0 §10 + Custody V1.0 §5/§11,
- die **Mandantentrennung im Restore** zur Wahrung von F0-D6,
- die **Berechtigungen-/Identity-Boundary** bei Restore zur Wahrung von F0-D7,
- die **Ransomware-Restore-Boundary** als Schnittstelle zur forensischen Freigabe und zum Sperrgrund „Sicherheits-/Forensik-Halt" gemäß Lösch-/Sperrkonzept V1.0 §7,
- die **Cross-Cutting-Konsistenz** mit gesperrten Harouda-Locks und mit den sieben gelockten V1.0-Specs.

Das DR-/HA-/BCM-Folgeartefakt ist ein **internes Boundary-/Spec-Lock**. Es liefert paraphrasierte Quell-Orientierungs-Aussagen, **trifft jedoch selbst keine** RPO-/RTO-Garantie, **keine** Restore-Mechanik-Festlegung, **keine** Cluster-/Replikations-Topologie-Wahl, **keine** Anbieter-/Werkzeug-/Bibliotheks-Wahl und **keine** Implementierungs-Entscheidung.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- konkrete RPO-/RTO-Werte über die F3-D2-Defaults hinaus,
- konkrete Near-Zero-Werte,
- konkrete Backup-/Snapshot-/Replikations-Mechanik,
- konkrete Restore-Skripte oder Runbooks,
- die Endfassung der Verfahrensdokumentation Kap. 5 oder Kap. 6,
- die Anbieter-/Werkzeug-/Cloud-/Hardware-/Bibliotheks-Wahl,
- die KMS-/HSM-Topologie (verbleibt Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt),
- den Forensik-Workflow im Detail (verbleibt Cybersecurity-Incident-Response-Folgeartefakt),
- das Z3-/Datenüberlassungs-Format,
- die Migrations-Rollback-Mechanik,
- die rechtliche Würdigung von Crypto-Shredding,
- ASVS-Verifikations-/Zertifizierungs-Aussagen,
- BSI-Konformitäts-/TR-02102-Erfüllungs-Aussagen,
- externe Normen/Zertifizierungen als Lock-Quelle.

Eine externe sicherheitsfachliche Prüfung sowie eine externe rechtliche Prüfung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung **erforderlich**.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext aus externen Quellen wird **nicht** übernommen. V1.0 dieses Artefakts erzeugt **keine** eigenen externen Quellen. Insbesondere werden **keine** ISO-22301-, **keine** BSI-Hochverfügbarkeitskompendium-, **keine** BSI-IT-Grundschutz-, **keine** BSI-TR-03116-, **keine** NIST- und **keine** ENISA-Quellen als Lock-Grundlage aufgenommen.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| Locked Decisions Register §3.11 / F3-D2 V1.0 | Authoritatives DR-Anforderungsmodell: DR-Backup ≠ Aufbewahrungs-/Retention-Archiv ≠ Z3-Export; RPO/RTO als Harouda-SLA-/Risk-Targets, **nicht gesetzlich**; Default RPO 24 h / RTO 48 h **als Produktpolitik**; Near-zero-RPO/RTO gehört zu HA-/BCM-Folgeartefakt; Restore-Modi-Topoi: Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic; Berechtigungen historisch wiederhergestellt, produktiver Zugriff revalidiert; Plattform-Admin: nur technisch, kein Schlüssel-/Plaintext-/Mandantendaten-Zugriff; Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe | **Direkte Lock-Basis** und maßgebende Inhalts-Quelle |
| Locked Decisions Register §6 Sortierungsmarker B | „Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2" | **Direkte Verankerungs-Quelle** im Register |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | §6.1 (Tabelle Retention-Archiv vs. DR-Backup mit Zweck/Zeitachse/Inhalt/Unveränderbarkeit/Recovery-Modell/Gleichsetzung-ausgeschlossen); §6.4 (DR-Restore vs. Migrations-Rollback); §15 Lock-Profil-Boundaries (Aufbewahrungs-/Retention-Archiv ≠ DR-Backup) | **Direkte Lock-Basis** für Trennungs-Tabelle und Verschmelzungs-Verbote |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | §10 DR / Backup / Restore Boundary (Aufbewahrungs-/Retention-Archiv ≠ DR-Backup; Restore darf keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen; Ransomware-Restore nur nach Integritätsprüfung + forensischer Freigabe; DR-Restore ≠ Migrations-Rollback; konkrete RPO/RTO-Werte und HA-/BCM-Aussagen verbleiben im DR-/HA-/BCM-Folgeartefakt); §17 Downstream-Auftrag (Architektur-/HA-/BCM-Folgeartefakt — RPO/RTO, Restore-Modi, Hochverfügbarkeit, Geschäftsfortführung; DR-Folgeartefakte — Operationalisierung F3-D2) | **Direkte Lock-Basis** und Wortwahl-Vorlage |
| Lösch-/Sperrkonzept-Artefakt V1.0 | §7 Sperrgrund „Sicherheits-/Forensik-Halt" (Ransomware-Restore-Kontext gemäß F3-D2 erfordert forensische Prüfung); §11 Verhältnis (DR-/HA-/BCM out of scope); §14 Downstream (DR-/HA-/BCM-Folgeartefakt — Verfügbarkeits- und Wiederherstellungsziele) | **Direkte Lock-Basis** für Sperrgrund-Schnittstelle und Cross-Boundary-Konsistenz |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | §12 (F3-D2 DR/Restore: Klassifikation berührt kein DR-Backup-Modell, keine RPO/RTO, keinen Restore-Modus); §16 Downstream | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Custody-Modell-Boundary-Artefakt V1.0 | §5 Plattform-Admin-/Plaintext-Boundary (kein Plattform-Admin-Pfad darf einseitigen Klartext-Zugriff erlangen — auch nicht über Restore-Pfade); §6 Storage-vs-Key-Access-Trennung gilt sinngemäß auch im Restore-Kontext; §10 Verhältnis zu DR-/HA-/BCM (respektiert F3-D2); §11 F3-D2-Wahrung; §15 Downstream | **Direkte Lock-Basis** für Custody-/Plaintext-Restore-Boundary |
| ASVS-Control-Referenz-Artefakt V1.0 | §9 (F3-D2: Mapping-Aussagen berühren kein DR-Backup-Modell und kein Restore-Verfahren); §14 Downstream | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| TR-02102-Detail-Artefakt V1.0 | §11 Verhältnis zu DR-/HA-/BCM (TR-02102-Detail ≠ DR-/HA-/BCM; F3-D2 bleibt autoritativ; Restore-Schlüssel-Boundary unberührt); §15 F3-D2-Wahrung; §18 Downstream | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung — Recovery hebt Festschreibung nicht auf); F0-D6 (Mandantentrennung — kein Cross-Mandanten-Restore); F0-D7 (Plattform-Admin-Grenze); F1-D1/F1-D2 (USt-Wahrheit — Recovery erzeugt keine USt-Werte); F3-D1 (Z3-Export — DR-Backup ≠ Z3); F3-D2 (DR/Restore — autoritative Quelle); F3-D3 (Migration — DR-Restore ≠ Migrations-Rollback); F3-Closing | Autoritative Boundary-Quellen; bei Konflikt vorrangig |

V1.0 dieses Artefakts greift **nicht** auf externe Webseiten zu, importiert **keinen** Originaltext aus externen Normen und führt **keine** über die o. g. paraphrasierten Anker hinausgehenden Quellen ein.

---

## 4. Core DR-/HA-/BCM Boundaries

Auf Boundary-Ebene gelten:

- **DR-/HA-/BCM ≠ Implementierung.** V1.0 enthält keine Implementierung, kein Datenmodell, kein Schema, kein UI/UX, keinen Programmcode, keinen Pseudocode, kein Algorithmus-Design, kein SQL und keine API-Definition.
- **DR-/HA-/BCM ≠ Garantie.** V1.0 erteilt keine RPO-/RTO-Garantie, keine Verlust-Garantie, keine Verfügbarkeits-Garantie, keine Wiederanlauf-Garantie. RPO/RTO sind Harouda-SLA-/Risk-Targets, **nicht gesetzlich**; Default-Werte sind Produktpolitik gemäß F3-D2.
- **DR-/HA-/BCM ≠ Zertifizierung.** V1.0 behauptet keine externe Zertifizierung (insbesondere keine ISO-22301-, keine BSI-Hochverfügbarkeit-, keine BSI-IT-Grundschutz-, keine BSI-TR-03116-Konformität); produktbezogene Zertifizierungs- oder Marketing-Behauptungen sind ausgeschlossen.
- **DR-/HA-/BCM ≠ Audit-Ergebnis.** V1.0 stellt kein Audit-Ergebnis dar; ein Audit ist eigenständig zu organisieren.
- **DR-/HA-/BCM ≠ Custody-Modell.** Schlüsselverwaltungs-Topologie, Schlüsselhierarchie, Schutzdomänen-Architektur verbleiben Custody V1.0 und KMS-/HSM-/Implementations-Folgeartefakt.
- **DR-/HA-/BCM ≠ KMS-/HSM-/Implementations-Folgeartefakt.** Konkrete Schlüssel-Wiederherstellungs-Mechanik verbleibt downstream.
- **DR-/HA-/BCM ≠ ASVS-Control-Referenz.** ASVS-Mapping-Adressen verbleiben in ASVS V1.0; eine Verschmelzung ist auf Boundary-Ebene ausgeschlossen.
- **DR-/HA-/BCM ≠ TR-02102-Detail.** Krypto- und Transport-Familien-Orientierung verbleibt TR-02102-Detail V1.0.
- **DR-/HA-/BCM ≠ Cybersecurity-Incident-Response.** Forensik-Workflow im Detail verbleibt Cybersecurity-Incident-Response-Folgeartefakt; DR-/HA-/BCM trifft ausschließlich die Schnittstelle.
- **DR-Backup ≠ Aufbewahrungs-/Retention-Archiv** (Konsistenz Retention V1.0 §6.1).
- **DR-Backup ≠ Z3-/Datenüberlassung** (Konsistenz F3-Closing).
- **DR-Restore ≠ Migrations-Rollback** (Konsistenz F3-D2 / Retention V1.0 §6.4 / Security V1.0 §10/§11).
- **Recovery hebt Festschreibung nicht auf** (Konsistenz F0-D4 / Register §4).
- **Restore darf keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen** (Konsistenz F3-D2 / Security V1.0 §10 / Custody V1.0 §5/§11).
- **Plattform-Administration im Restore-Kontext bleibt rein technische Ausführung** (Konsistenz F0-D7 / F3-D2 / Custody V1.0 §5).
- **Kein Cross-Mandanten-Restore** (Konsistenz F0-D6 / Register §4).
- **§28.11-bet bleibt unverändert/offen.** V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht.

V1.0 trifft **keine** Aussage über konkrete Cluster-/Replikations-Topologie, Werkzeuge, Hersteller, Cloud-Regionen, Hardware-Familien, Bibliotheken oder Implementierungs-Konfigurationen.

---

## 5. DR vs. HA vs. BCM Terminologie-Boundary

Auf Boundary-Ebene werden drei nebeneinander stehende, sich nicht ersetzende fachliche Topoi anerkannt:

- **DR (Disaster-Recovery)** — Wiederanlauf nach technischer Störung oder Ausfall; Boundary-Topik gemäß F3-D2 und Security V1.0 §10. Charakter: korrigierend, nach Eintritt eines Ereignisses; Fokus auf Wiederherstellbarkeit eines Zielzustands.
- **HA (Hochverfügbarkeit)** — laufende Verfügbarkeit ohne erforderlichen Wiederanlauf; Boundary-Topik außerhalb F3-D2 gemäß Locked Decisions Register §6 Sortierungsmarker B. Charakter: präventiv, kontinuierlich; Fokus auf Vermeidung von Ausfall.
- **BCM (Business Continuity Management / Geschäftsfortführung)** — organisatorisch-fachlicher Rahmen für Fortführung kritischer Geschäftsfunktionen; Boundary-Topik gemäß Security V1.0 §17 Downstream-Auftrag. Charakter: organisatorisch, übergreifend; Fokus auf Geschäftsprozess-Kontinuität und Fortführungsfähigkeit.

**Trio-Trennung (Boundary):**
- DR ≠ HA ≠ BCM. Die drei Topoi sind komplementär und werden in V1.0 dieses Artefakts nebeneinander geführt; sie ersetzen einander nicht.
- DR allein ist **keine** Garantie für HA. HA allein ist **keine** Garantie für BCM. BCM allein ist **keine** Garantie für technische Wiederherstellung.
- Konkrete Mechanik je Topik (Cluster-Architektur, Replikations-Modell, Geschäftsprozess-Plan-Entwurf) ist **Non-Scope**.
- V1.0 dieses Artefakts trifft **keine** Aussage zur Reihenfolge, Priorisierung oder Tiefe der drei Topoi im konkreten Harouda-Betrieb.

---

## 6. RPO-/RTO-Boundary

Auf Boundary-Ebene gelten:

- **RPO/RTO sind Harouda-SLA-/Risk-Targets, nicht gesetzlich** (gemäß F3-D2). Sie sind **kein** Garantieversprechen und **keine** rechtlich bindende Aussage gegenüber Mandanten oder Aufsichtsbehörden.
- **F3-D2-Default als Produktpolitik:** RPO 24 h / RTO 48 h. Diese Werte sind Produktpolitik gemäß F3-D2; sie sind **kein** Garantieversprechen und **keine** zugeschriebene Eigenschaft Haroudas.
- **Near-zero-RPO/RTO** ist ein **Boundary-Topik** dieses Artefakts gemäß Register §6 Sortierungsmarker B („Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2"). Es ist **kein** Garantieversprechen und **kein** zugeschriebener Wert; es bezeichnet ausschließlich die fachliche Boundary-Topik-Kategorie für Aussagen, die über die F3-D2-Default-Produktpolitik hinausgehen würden.
- **Konkrete RPO-/RTO-Werte über die F3-D2-Defaults hinaus werden in V1.0 dieses Artefakts nicht festgelegt.** Sie verbleiben einer separat zu autorisierenden späteren Versions-Pflege oder einer operativen Detail-Entscheidung.
- **Konkrete Near-Zero-Werte** (z. B. spezifische Sekunden-/Minuten-/Stunden-Angaben) werden in V1.0 dieses Artefakts **nicht** festgelegt; das Topik wird ausschließlich als Boundary-Klasse anerkannt.
- **Ableitungs-Disziplin:** Jede künftige Konkretisierung von RPO/RTO bleibt als Produktpolitik formuliert, **ohne** Garantie-Charakter, **ohne** Zertifizierungs-Anspruch und **ohne** externe Norm-Konformitäts-Behauptung.
- **Wortwahl-Disziplin:** Garantie-Aussagen zu RPO/RTO, Wiederanlauf, Verfügbarkeits-Anteil, Uptime-Werten oder Datenverlust-Vermeidung sind ausgeschlossen. Konkrete Verfügbarkeits-Anteile, Uptime-Quoten oder Verlust-Garantien gegenüber Mandanten oder Aufsichtsbehörden sind ausgeschlossen.

---

## 7. Restore-Modi-Boundary

Auf Boundary-Ebene werden — gemäß F3-D2 — fünf Restore-Modi als reine **fachliche Klassen** anerkannt; konkrete Mechanik, Werkzeug-Wahl, Skript-Inhalte und Konfigurations-Werte sind Non-Scope:

- **Full-System Restore** — Wiederherstellung des Gesamt-Systemzustands. Boundary-Topik; konkreter Wiederherstellungs-Pfad ist Non-Scope.
- **Mandantenspezifischer Restore** — Wiederherstellung des Datenbestands eines einzelnen Mandanten ohne Berührung anderer Mandanten. Wahrt F0-D6 strikt; konkrete Selektions-Mechanik ist Non-Scope.
- **Point-in-Time Restore** — Wiederherstellung bis zu einem definierten zeitlichen Recovery-Punkt. Boundary-Topik; konkrete Granularität ist Non-Scope.
- **Test Restore** — Restore in eine separate Test-Umgebung zur Verifikation der Wiederherstellbarkeit, ohne produktiven Zugriff zu erzeugen. Boundary-Topik; konkrete Test-Methodik und Werkzeug-Wahl sind Non-Scope.
- **Forensic Restore** — Restore unter forensischen Anforderungen (Beweissicherung, Integritätsprüfung) im Vorfeld einer Ransomware- oder Sicherheits-/Forensik-Halt-Situation. Boundary-Topik; Schnittstelle zum Cybersecurity-Incident-Response-Folgeartefakt; konkrete Forensik-Werkzeug-Wahl ist Non-Scope.

**Konsistenzregel:** Sämtliche Restore-Modi sind reine Boundary-Topoi ohne Verifikations-, Erfüllungs-, Test-Resultat- oder Audit-Charakter. Eine Befüllung mit konkreten Werten, Werkzeugen, Sequenzen oder Sequenz-Diagrammen erfolgt ausschließlich über einen separat zu autorisierenden späteren Versionsschritt oder im KMS-/HSM-/Implementations- bzw. Cybersecurity-Incident-Response-Folgeartefakt.

---

## 8. Backup vs. Retention Archive vs. Z3 vs. Migration

Spiegel zu Retention V1.0 §6.1, §6.2 und §6.4 sowie zu Register §3.13 (F3-Closing). V1.0 dieses Artefakts fügt **keine** neue Auslegung hinzu.

| Dimension | DR-Backup | Aufbewahrungs-/Retention-Archiv | Z3-/Datenüberlassung | Migration |
|---|---|---|---|---|
| **Zweck** | Wiederanlauf nach Störung/Ausfall | Erfüllung gesetzlicher Aufbewahrungspflicht | Bereitstellung für Außenprüfung | Überführung in neues System/Modell |
| **Auslöser** | Technischer Vorfall | Gesetzliche Frist | Anforderung der Finanzbehörde | Geplante Modell-/Systemänderung |
| **Zeitachse** | Operativ (Stunden bis wenige Wochen, je nach RPO/RTO) | Mehrjährig (6/8/10 Jahre + Hemmung) | Bereitstellungs-Lebenszyklus | Einmalig aktiv |
| **Recovery-Modell** | Wiederherstellung bis Recovery-Punkt | Lesezugriff über gesamte Frist | Übergabe und Dokumentation | Cutover als Grenze |
| **Rollback** | Restore zu Recovery-Punkt | Nicht vorgesehen | n/a | Migrations-Rollback ≠ DR-Restore |
| **Authoritative Quelle** | F3-D2 + dieses Artefakt | Retention V1.0 + AO § 147 / HGB § 257 / GoBD | F3-D1 + GoBD | F3-D3 + GoBD Rz. 142–144 |
| **Gleichsetzung** | n/a | **ausgeschlossen** | **ausgeschlossen** | **ausgeschlossen** |

**Verschmelzungs-Verbote:**
- DR-Backup ≠ Aufbewahrungs-/Retention-Archiv. Ein DR-Backup ist **kein** Substitut für das Retention-Archiv (Retention V1.0 §15 STOP).
- DR-Backup ≠ Z3-/Datenüberlassung. Ein DR-Backup ist **kein** Z3-Format.
- DR-Restore ≠ Migrations-Rollback. DR-Restore betrifft den Wiederanlauf nach technischer Störung; Migrations-Rollback betrifft die Rückabwicklung einer geplanten Modell-/Systemänderung.

---

## 9. Custody-/Plaintext-Restore-Boundary

Auf Boundary-Ebene gilt — konsistent mit F3-D2, Security V1.0 §10 und Custody V1.0 §5/§6/§11:

- **Restore darf keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen.** Diese Boundary gilt ausnahmslos für alle Restore-Modi gemäß §7.
- **Plattform-Administration im Restore-Kontext bleibt rein technische Ausführung.** Plattform-Admin (F0-D7) ist während Restore-Operationen ausschließlich technische Rolle; sie erlangt **keine** fachliche Schlüssel-/Plaintext-/Mandantendaten-Einsicht.
- **Storage-vs-Key-Access-Trennung gilt sinngemäß im Restore-Kontext** (Custody V1.0 §6 line 121). Wer Speicher- bzw. Chiffrat-Zugriff im Restore-Pfad hat, darf nicht zugleich allein die Entschlüsselungs-Fähigkeit halten.
- **Schlüssel-Wiederherstellung ist Non-Scope dieses Artefakts.** Die konkrete Wiederherstellungs-Mechanik kryptographischen Schlüsselmaterials verbleibt Custody V1.0 §8 (als Boundary-Topik) und dem KMS-/HSM-/Implementations-Folgeartefakt (als operative Mechanik).
- **Audit-Spur:** Restore-Operationen, die die Custody-Schicht berühren, müssen rekonstruktierbar bleiben (Boundary-Bezug zu Custody V1.0 §12).

---

## 10. Mandantentrennung im Restore

Auf Boundary-Ebene gilt — konsistent mit F0-D6 und Register §4:

- **Kein Cross-Mandanten-Restore.** Eine Restore-Operation gegenüber einem Mandanten darf **keine** Schlüssel-/Plaintext-/Daten-Wirkung gegenüber einem anderen Mandanten entfalten.
- **Mandantenspezifischer Restore-Modus** gemäß F3-D2 wahrt F0-D6 strikt; er ist die fachliche Form für Restore-Anforderungen, die nur einen einzelnen Mandanten betreffen.
- **Full-System Restore** wahrt F0-D6 dadurch, dass sämtliche Mandanten-Boundaries innerhalb des wiederhergestellten Gesamt-Systemzustands erhalten bleiben; eine implizite Cross-Mandanten-Vermischung ist ausgeschlossen.
- **Konkrete Selektions-/Filter-/Isolations-Mechanik** ist **Non-Scope** und verbleibt downstream.

---

## 11. Berechtigungen / Identity bei Restore

Auf Boundary-Ebene gilt — konsistent mit F3-D2 (Register §3.11) und F0-D7:

- **Berechtigungen werden als Audit-Spur historisch wiederhergestellt.** Die Berechtigungsstrukturen zum Recovery-Zeitpunkt werden im Restore-Pfad nicht überschrieben; sie bleiben als historische Audit-Spur erhalten.
- **Produktiver Zugriff wird gegen aktuellen Identity-/Security-State revalidiert.** Eine wiederhergestellte Berechtigungsstruktur erzeugt **keinen** automatischen produktiven Zugriff; jeder produktive Zugriffsversuch unterliegt der aktuellen Identity-/Security-Validierung.
- **F0-D7 Plattform-Admin-Grenze bleibt unberührt.** Plattform-Admin im Restore-Kontext erlangt keinen fachlichen Superuser-Status.
- **Konkrete Identity-/Authentication-/Authorization-Mechanik** ist **Non-Scope** und verbleibt downstream (Security V1.0 §6/§9 etabliert die Boundary; Operationalisierung in nachgelagerten Detail-Artefakten).

---

## 12. Ransomware-Restore Boundary

Auf Boundary-Ebene gilt — konsistent mit F3-D2, Security V1.0 §10 und Lösch-/Sperrkonzept V1.0 §7:

- **Ransomware-Restore ist erst nach Integritätsprüfung und forensischer Freigabe zulässig.**
- **Keine voreilige produktive Wiederherstellung.** Vor einer produktiven Restore-Operation in einem potenziell ransomware-betroffenen Umfeld ist die Integrität der Quell-Daten zu verifizieren.
- **Schnittstelle zum Sperrgrund „Sicherheits-/Forensik-Halt"** gemäß Lösch-/Sperrkonzept V1.0 §7: Solange ein Sicherheits-/Forensik-Halt aktiv ist, sind Lösch-/Sperr-Operationen ausgesetzt; Restore-Operationen unterliegen ebenfalls der forensischen Freigabe.
- **Forensic-Restore-Modus** gemäß §7 dient der Beweissicherung und Integritätsprüfung; er erzeugt **keinen** produktiven Zugriff.
- **Übergabe an Cybersecurity-Incident-Response-Folgeartefakt:** Der konkrete Forensik-Workflow, Detection-Mechanismen, Eskalationspfade und Wiederfreigabe-Prozeduren verbleiben dem Cybersecurity-Incident-Response-Folgeartefakt (Register §6 Sortierungsmarker C). V1.0 dieses Artefakts spezifiziert ausschließlich die Schnittstelle, **keinen** IR-Workflow.

---

## 13. Verhältnis zu Retention V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ Retention V1.0** | Retention V1.0 §6.1 etabliert die Tabelle Retention-Archiv vs. DR-Backup; V1.0 dieses Artefakts spiegelt die Trennlinie und ergänzt sie **nicht**. Retention V1.0 §6.4 etabliert DR-Restore ≠ Migrations-Rollback. Bei Konflikt gilt Retention V1.0 für Aufbewahrungs-Boundaries. |
| **Aufbewahrungs-Substitut-Verbot** | DR-Backup darf **nicht** als Substitut für das Retention-Archiv dienen (Konsistenz Retention V1.0 §15 STOP). |
| **Recovery hebt Aufbewahrungs-Pflicht nicht auf** | Eine Restore-Operation berührt die in Retention V1.0 etablierten Fristen, Hemmungen, Legal-Hold-Boundaries nicht. |

---

## 14. Verhältnis zu Lösch-/Sperrkonzept V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ Lösch-/Sperrkonzept V1.0** | Lösch-/Sperrkonzept V1.0 §7 etabliert den Sperrgrund „Sicherheits-/Forensik-Halt" als Schnittstelle zu Ransomware-Restore-Situationen. V1.0 dieses Artefakts respektiert diese Schnittstelle und entwirft sie nicht neu. Bei Konflikt gilt Lösch-/Sperrkonzept V1.0 für Lösch-/Sperr-Boundaries. |
| **Restore ≠ Lösch-/Sperr-Operation** | Eine Restore-Operation ist **keine** Lösch-/Sperr-Operation. Lösch-/Sperr-Boundaries verbleiben strikt im Lösch-/Sperrkonzept V1.0. |
| **Festsetzungsfrist / Legal Hold** | Restore-Operationen ändern keine Festsetzungsfrist, keinen Legal-Hold-Status und keine Klassifikations-Boundary gemäß Regelmatrix V1.0. |

---

## 15. Verhältnis zu Custody V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ Custody V1.0** | Custody V1.0 §5/§6/§11 etabliert die Plaintext-Restore-Boundary; V1.0 dieses Artefakts spiegelt die Boundary und schwächt sie nicht. Bei Konflikt gilt Custody V1.0 für Custody-Boundaries. |
| **Schlüsselverwaltung** | Schlüssel-Wiederherstellungs-Mechanik verbleibt Custody V1.0 §8 (als Boundary-Topik) und KMS-/HSM-/Implementations-Folgeartefakt (als operative Mechanik). V1.0 dieses Artefakts trifft keine Schlüssel-Wiederherstellungs-Aussage. |
| **Storage-vs-Key-Access** | Die in Custody V1.0 §6 etablierte Trennung gilt sinngemäß im Restore-Kontext und bleibt unverändert. |

---

## 16. Verhältnis zu Z3-/Datenüberlassung

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ Z3-/Datenüberlassung (F3-D1)** | F3-D1 bleibt autoritativ für Behörden-Auslieferungs-Format. V1.0 dieses Artefakts trifft **keine** Aussage zum Z3-Format und **keinen** Behörden-Auslieferungs-Workflow. |
| **DR-Backup ≠ Z3-Export** | Konsistenz mit F3-Closing (Register §3.13). DR-Backups dürfen **nicht** als Z3-Export ausgegeben werden. |
| **Plaintext-Boundary** | Das in F3-D1 verankerte Verbot der Plaintext-Beschaffung durch Plattform-Administration über Z3-Pfade bleibt unberührt; Restore-Pfade dürfen **nicht** als Plaintext-Beschaffungs-Umweg über die Z3-Boundary genutzt werden. |

---

## 17. Verhältnis zu Migration

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ Migration (F3-D3)** | F3-D3 bleibt autoritativ für Migrations-Mechanik. V1.0 dieses Artefakts trifft **keine** Aussage zur Migrations-Implementierung, **keinen** Cutover-Workflow und **kein** Migrations-Rollback-Konzept. |
| **DR-Restore ≠ Migrations-Rollback** | Konsistenz Register §3.12 / Retention V1.0 §6.4 / Security V1.0 §10/§11. DR-Restore betrifft technischen Wiederanlauf; Migrations-Rollback betrifft geplante Modell-/Systemänderungs-Rückabwicklung. Beide sind nicht gleichsetzbar. |
| **Plattform-Admin-Boundary** | Das in F3-D3 verankerte Verbot des Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Plattform-Administration in Migrations-Pfaden bleibt unberührt; Restore-Pfade dürfen **nicht** zur Umgehung dieser Boundary genutzt werden. |

---

## 18. Verhältnis zu ASVS-Control-Referenz V1.0 und TR-02102-Detail V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ ASVS-Control-Referenz V1.0** | ASVS V1.0 §9 / §14 etabliert, dass ASVS-Mapping-Aussagen kein DR-Backup-Modell und kein Restore-Verfahren berühren. V1.0 dieses Artefakts trifft **keine** ASVS-Mapping-Aussage und **keine** ASVS-Verifikations-/Zertifizierungs-/Konformitäts-Behauptung. Bei Konflikt gilt ASVS V1.0 für ASVS-Mapping-Schnittstellen. |
| **DR-/HA-/BCM ↔ TR-02102-Detail V1.0** | TR-02102-Detail V1.0 §11 / §15 / §18 etabliert die Trennlinie. V1.0 dieses Artefakts trifft **keine** Krypto- oder Transport-Familien-Aussage und **keine** BSI-Konformitäts-/TR-02102-Erfüllungs-Behauptung. Bei Konflikt gilt TR-02102-Detail V1.0 für Krypto-/Transport-Boundaries. |
| **Anti-Konformitäts-Konsistenz** | Die in ASVS V1.0 und TR-02102-Detail V1.0 etablierten Anti-Verifikations-/Anti-Zertifizierungs-/Anti-Konformitäts-Wortwahl-Vorgaben werden in V1.0 dieses Artefakts sinngemäß angewendet. |

---

## 19. Verhältnis zu Cybersecurity-Incident-Response

| Verhältnis | Boundary-Inhalt |
|---|---|
| **DR-/HA-/BCM ↔ Cybersecurity-Incident-Response-Folgeartefakt** | Das Cybersecurity-Incident-Response-Folgeartefakt ist im Locked Decisions Register §6 als Sortierungsmarker C eigenständig enumeriert („Cybersecurity-Incident-Response-Artefakt — Ransomware / Forensik-Workflow"). V1.0 dieses Artefakts und das künftige IR-Folgeartefakt sind getrennte Boundary-/Spec-Locks. |
| **Schnittstelle Ransomware-Restore** | V1.0 dieses Artefakts trifft die Boundary „Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe" (gemäß §12). Der konkrete Forensik-Workflow, Detection-Mechanismen, Eskalationspfade, Wiederfreigabe-Prozeduren, Forensik-Werkzeug-Wahl verbleiben **strikt** dem Cybersecurity-Incident-Response-Folgeartefakt. V1.0 dieses Artefakts entwirft hierzu nichts. |
| **Forensic-Restore-Modus** | Der in §7 anerkannte Forensic-Restore-Modus ist eine fachliche Klasse; konkrete Forensik-Methodik, Werkzeug-Konfiguration und Beweissicherungs-Workflow verbleiben dem IR-Folgeartefakt. |
| **Verschmelzungs-Verbot** | Eine Verschmelzung DR-/HA-/BCM ↔ Cybersecurity-Incident-Response ist auf Boundary-Ebene ausgeschlossen. |

---

## 20. Verhältnis zu gesperrten Harouda-Boundaries

Das DR-/HA-/BCM-Folgeartefakt wahrt strikt:

| Lock | Wahrung in DR-/HA-/BCM |
|---|---|
| **F0-D4 Festschreibung** | Recovery hebt Festschreibung nicht auf (Register §4 line 296). F0-D4 bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Kein Cross-Mandanten-Restore (Register §4 line 305). Mandantenspezifischer Restore-Modus wahrt F0-D6 strikt. F0-D6 bleibt autoritativ. |
| **F0-D7 Plattform-Admin-Grenze** | Plattform-Administration im Restore-Kontext bleibt rein technische Ausführung; keine Schlüssel-/Plaintext-/Mandantendaten-Einsicht durch Restore (Register §4 line 314). F0-D7 bleibt autoritativ. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Recovery erzeugt keine USt-Werte (Register §4: „Recovery | F3-D2 | Keine USt-Wertquelle"). F1-D1/F1-D2 bleiben autoritative USt-Wahrheitsquelle. |
| **F3-D1 Z3-/Datenüberlassung** | DR-Backup ≠ Z3-Export. F3-D1 bleibt autoritativ. Restore-Pfade dürfen Z3-Boundary nicht umgehen. |
| **F3-D2 DR/Restore** | F3-D2 ist die direkte authoritative Lock-Quelle dieses Artefakts. V1.0 dieses Artefakts respektiert F3-D2 vollständig und konkretisiert ausschließlich auf Boundary-Topik-Ebene. |
| **F3-D3 Migration** | DR-Restore ≠ Migrations-Rollback. F3-D3 bleibt autoritativ. |
| **F3-Closing** | DR-/HA-/BCM respektiert die F3-Closing-Boundaries: Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM. F3-Closing bleibt autoritativ. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. V1.0 dieses Artefakts wirkt nicht auf den Locked Decisions Register zurück.

---

## 21. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 21.1 | V1.0 dieses Artefakts behauptet eine RPO-/RTO-Garantie, eine Verlust-Garantie, einen garantierten Wiederanlauf, eine garantierte Verfügbarkeit, konkrete Uptime-Anteile oder vergleichbare Garantie-/Verfügbarkeits-Aussagen. |
| 21.2 | V1.0 dieses Artefakts behauptet eine BCM-bezogene Zertifizierung, eine Konformität gegenüber externen Normen (insbesondere ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116), eine externe Audit-Bestätigung, einen Audit-Status als zugeschriebene Eigenschaft oder produktbezogene Zertifizierungs-/Marketing-Aussagen. |
| 21.3 | V1.0 dieses Artefakts verwendet standalone Konformitäts-Schlagwörter oder freistehende Zertifikats-/Erfüllungs-Behauptungen gegenüber externen Normen. |
| 21.4 | V1.0 dieses Artefakts verwendet Marketing-Wortwahl als zugeschriebene Eigenschaft Haroudas oder als Produkt-Behauptung — insbesondere freistehende Schlagwörter zu Katastrophen-Resistenz, dauerhafter Ausfall-Vermeidung, Datenverlust-Unmöglichkeit, Produktiv-Reife, externer Zertifikats-Eigenschaft oder externer Konformitäts-Eigenschaft. |
| 21.5 | V1.0 dieses Artefakts führt ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116, NIST-, ENISA- oder eine andere nicht in Security V1.0 §3 oder Retention V1.0 §3 paraphrasierte externe Quelle als Lock-Quelle ein. |
| 21.6 | V1.0 dieses Artefakts trifft eine konkrete Cloud-, Anbieter-, Werkzeug-, Backup-Tool-, Replikations-Werkzeug-, Storage-Anbieter-, Plattform-, Produkt-, Hardware- oder Bibliotheks-Wahl. |
| 21.7 | V1.0 dieses Artefakts entwirft konkrete Cluster-Topologie, Replikations-Topologie, Datenbank-Cluster-Modelle, Backup-Skripte, Restore-Skripte, Snapshot-Werkzeuge oder operative Runbooks. |
| 21.8 | V1.0 dieses Artefakts enthält Implementierung, Datenmodell, Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definition, Test-Cases, Test-Methodik, CI/CD-Konfiguration oder konkrete Konfigurations-Werte. |
| 21.9 | V1.0 dieses Artefakts entwirft eine Schlüssel-Wiederherstellungs-Mechanik, Custody-Topologie, KMS-/HSM-Modellwahl oder Schutzdomänen-Architektur (verbleiben Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt). |
| 21.10 | V1.0 dieses Artefakts enthält einen Incident-Response-Runbook, Forensik-Workflow im Detail, Detection-Mechanik oder Wiederfreigabe-Prozeduren (verbleiben Cybersecurity-Incident-Response-Folgeartefakt). |
| 21.11 | V1.0 dieses Artefakts verschmilzt DR-/HA-/BCM mit Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, Z3-/Datenüberlassungs-Spezifikation, Migrations-Folgeartefakt, Retention-Archiv, Lösch-/Sperrkonzept, Regelmatrix, ASVS-Control-Referenz, TR-02102-Detail oder Cybersecurity-Incident-Response. |
| 21.12 | V1.0 dieses Artefakts verschmilzt DR-Backup mit Aufbewahrungs-/Retention-Archiv (Verstoß gegen Retention V1.0 §6.1 + Register §3.13). |
| 21.13 | V1.0 dieses Artefakts verschmilzt DR-Backup mit Z3-/Datenüberlassung (Verstoß gegen Register §3.13 / F3-Closing). |
| 21.14 | V1.0 dieses Artefakts verschmilzt DR-Restore mit Migrations-Rollback (Verstoß gegen Register §3.12 + Retention V1.0 §6.4 + Security V1.0 §10/§11). |
| 21.15 | V1.0 dieses Artefakts erlaubt einen Cross-Mandanten-Restore (Verstoß gegen F0-D6 + Register §4). |
| 21.16 | V1.0 dieses Artefakts schwächt das in F3-D2 + Security V1.0 §10 + Custody V1.0 §5/§11 etablierte Verbot des Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Restore. |
| 21.17 | V1.0 dieses Artefakts hebt die Festschreibung gemäß F0-D4 auf oder schwächt sie. |
| 21.18 | V1.0 dieses Artefakts schwächt, umdeutet oder umgeht F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 21.19 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder behauptet eine §6-Sortierungsmarker-Verankerung, die nicht existiert (Sortierungsmarker B existiert für dieses Artefakt; eine andere Verankerungs-Behauptung wäre falsch). |
| 21.20 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 21.21 | V1.0 dieses Artefakts trifft eine rechtliche, steuerfachliche, DSB-, Aufsichts-, Sicherheits-, Zertifizierungs-, Audit- oder Produktivfreigabe, die nicht tatsächlich vorliegt. |
| 21.22 | V1.0 dieses Artefakts konkretisiert RPO-/RTO-Werte über die in F3-D2 etablierten Defaults (24 h / 48 h) hinaus oder definiert konkrete Near-Zero-Werte als gelockte Boundary (Werte verbleiben downstream). |
| 21.23 | V1.0 dieses Artefakts nimmt eine Crypto-Shredding-Rechtswürdigung vor oder schlägt eine Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 vor. |
| 21.24 | V1.0 dieses Artefakts nimmt die Endfassung der Verfahrensdokumentation Kap. 5 oder Kap. 6 vorweg oder ersetzt diese. |
| 21.25 | V1.0 dieses Artefakts browst externe Webseiten oder importiert Originaltext aus externen Normen wörtlich. |
| 21.26 | V1.0 dieses Artefakts erhöht die Forbidden-Reference-Baseline (BLOCKED ≠ 0 oder BASELINE_ALLOWED ≠ 62 oder ALLOW_MARKED ≠ 0) oder verletzt die etablierten Terminologie- und Quality-Gate-Vorgaben des Repositorys (verbotene Tool-/Modell-/Anbieter-Begriffe, BOM, Arabisch, obsolete Sortierungsbezeichnung, generische Sicherheits-/Transport-/Verfügbarkeits-Behauptungen, freistehende Konformitäts-Schlagwörter, Zertifizierungs- oder Marketing-Aussagen). |

---

## 22. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Konkrete Infrastruktur-Architektur jeglicher Art,
- Cluster-Topologie, Replikations-Topologie, Datenbank-Cluster-Modelle,
- Cloud-, Anbieter-, Werkzeug-, Vendor-, Hardware-, Bibliotheks-Wahl,
- konkrete Backup-Tooling, Snapshot-Werkzeuge, Restore-Skripte,
- operative Runbooks,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode, Pseudocode, Algorithmus-Design,
- SQL und Query-Spezifikation,
- API-Definitionen,
- automatische Jobs (Scheduler, Trigger, Pipelines),
- Test-Cases, Test-Methodik, CI/CD-Konfiguration,
- KMS-/HSM-Topologie, Schutzdomänen-Architektur,
- Schlüssel-Wiederherstellungs-Mechanik (verbleibt Custody V1.0 + KMS-/HSM-/Implementations-Folgeartefakt),
- Incident-Response-Runbook,
- Forensik-Workflow im Detail (verbleibt Cybersecurity-Incident-Response-Folgeartefakt),
- Z3-/Datenüberlassungs-Format (verbleibt Z3-Spezifikations-Folgeartefakt),
- Migrations-Rollback-Mechanik (verbleibt Migrations-Folgeartefakt),
- Retention-Archiv-Speicher-Implementierung,
- externe Normen/Zertifizierungen als Lock-Quelle (insbesondere ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116, NIST-, ENISA-Quellen),
- RPO-/RTO-Garantien jeglicher Art,
- Verlust- oder Verfügbarkeits-Garantie-Aussagen,
- Marketing-Aussagen zu Disaster-Resistenz, Katastrophensicherheit oder Audit-Sicherheit,
- rechtliche Würdigung von Crypto-Shredding,
- Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6,
- Rechtsgutachten oder Steuerauskunft im Einzelfall,
- DSB-, Sicherheits- oder Produktivfreigabe,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung und keine BCM-/DR-/HA-bezogene formale Prüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; keine konkreten kryptographischen Parameter; keine Anbieter-, Werkzeug-, Bibliotheks-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; keine konkrete Cluster-/Replikations-/Snapshot-/Backup-/Restore-Mechanik; kein Migrations- oder Migrations-Rollback-Konzept; kein Z3-/Datenüberlassungs-Format; kein Incident-Response-Runbook; keine externe Normen-/Zertifizierungs-Aussage; keine RPO-/RTO-Garantie; keine Verlust- oder Verfügbarkeits-Garantie; keine ASVS-Verifikations-/Zertifizierungs-/Audit-Aussage; keine BSI-Konformitäts-/TR-02102-Erfüllungs-Aussage; keine Implementierungs-Autorisierung jeglicher Art; keine Rechts- oder Steuerauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 23. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **Spätere Versions-Pflege dieses Artefakts** — Befüllung der RPO-/RTO-Boundary mit konkreteren Werten oder Ableitung aus produktpolitischen Entscheidungen; separat zu autorisieren; ohne Garantie- oder Konformitäts-Anspruch.
- **Operative DR-Detail-Folgeartefakte** — konkrete Backup-/Restore-Werkzeuge, Cluster-Topologie, Replikations-Schemata, Snapshot-Mechanik; setzt externe sicherheitsfachliche Prüfung voraus.
- **Architektur-/HA-Detail-Folgeartefakt** — konkrete Hochverfügbarkeits-Architektur, Lastverteilung, Failover-Mechanik; separat zu autorisieren.
- **BCM-Detail-Folgeartefakt** — Geschäftsfortführungs-Plan, kritische Geschäftsprozess-Identifikation, BCM-Tests; separat zu autorisieren; nicht im V1.0-Lock-Charakter, sondern als organisatorisches Folgeartefakt.
- **KMS-/HSM-/Implementations-Folgeartefakt** — Schlüssel-Wiederherstellungs-Mechanik; setzt Custody-Modell-Boundary-Lock und externe sicherheitsfachliche Prüfung voraus.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Forensik-Workflow im Detail, Detection-Mechanismen, Wiederfreigabe-Prozeduren; im Locked Decisions Register §6 als Sortierungsmarker C eigenständig enumeriert.
- **Z3-/Datenüberlassungs-Spezifikations-Artefakt** — Behörden-Auslieferungs-Format; respektiert F3-D1; bleibt strikt von DR-/HA-/BCM getrennt.
- **Migrations-Folgeartefakt** — Migrations-Mechanik; respektiert F3-D3; bleibt strikt von DR-/HA-/BCM getrennt.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34; nicht Bestandteil dieses Artefakts.
- **Verfahrensdokumentation Kap. 5 (nächste Pflege)** — Aufnahme dieses Artefakts und der vorgelagerten V1.0-Lock-Artefakte (Security, Custody, ASVS, TR-02102-Detail) per Verweis als vorgelagerte Spezifikationen.
- **Verfahrensdokumentation Kap. 6 (nächste Pflege)** — Aufnahme dieses Artefakts in Bezug auf Datensicherung-Kapitel; nicht im V1.0 Boundary-Charakter, sondern als spätere Pflege.

---

## 24. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für die fachlichen DR-/HA-/BCM-Boundaries in Harouda. Maßgeblich als Boundary-Quelle für nachgelagerte operative DR-/HA-/BCM-Detail-Folgeartefakte und für die Bezugnahme aus Verfahrensdokumentation Kap. 5 und Kap. 6 (im Rahmen ihrer nächsten Pflege). |
| **Bindend für** | Alle in §23 genannten Folgeartefakte, soweit sie auf DR-/HA-/BCM-Boundary-Eingaben aufsetzen; Verfahrensdokumentation Kap. 5 und Kap. 6 (nächste Pflege); alle nachgelagerten Detail-Artefakte zu DR-/HA-/BCM-Themen, soweit sie eine Boundary-Quelle benötigen. |
| **Nicht bindend für** | Konkrete RPO-/RTO-Werte über F3-D2-Defaults hinaus; konkrete Near-Zero-Werte; konkrete Cluster-/Replikations-/Snapshot-/Backup-/Restore-Mechanik; Anbieter-/Werkzeug-/Bibliotheks-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl; KMS-/HSM-Topologie; Custody-Topologie; Schlüssel-Wiederherstellungs-Mechanik; Forensik-Workflow im Detail; Z3-Format; Migrations-Mechanik; Endfassung Verfahrensdokumentation Kap. 5 oder Kap. 6; Rechts- oder Steuerauskunft im Einzelfall; Sicherheits- oder Produktivfreigabe; externe Normen-/Zertifizierungs-Aussage. |
| **STOP-Bedingungen** | **26** nummerierte STOP-Bedingungen (21.1 bis 21.26) gemäß §21. |
| **Boundaries** | DR-/HA-/BCM ≠ Implementierung. DR-/HA-/BCM ≠ Garantie. DR-/HA-/BCM ≠ Zertifizierung. DR-/HA-/BCM ≠ Audit-Ergebnis. DR-/HA-/BCM ≠ Custody-Modell. DR-/HA-/BCM ≠ KMS-/HSM-/Implementations-Folgeartefakt. DR-/HA-/BCM ≠ ASVS-Control-Referenz. DR-/HA-/BCM ≠ TR-02102-Detail. DR-/HA-/BCM ≠ Cybersecurity-Incident-Response. DR-Backup ≠ Aufbewahrungs-/Retention-Archiv. DR-Backup ≠ Z3-/Datenüberlassung. DR-Restore ≠ Migrations-Rollback. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt; Recovery hebt Festschreibung nicht auf. F0-D6 Mandantentrennung bleibt autoritativ; kein Cross-Mandanten-Restore. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle; keine Schlüssel-/Plaintext-/Mandantendaten-Einsicht durch Restore. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt; Recovery erzeugt keine USt-Werte. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Quellgrundlage** | Locked Decisions Register §3.11 / F3-D2 V1.0 (Disaster-Recovery — Authoritatives DR-Anforderungsmodell); Locked Decisions Register §6 Sortierungsmarker B; Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §6.1 / §6.4; Security-/Krypto-/Key-Custody-Artefakt V1.0 §10 / §17; Lösch-/Sperrkonzept-Artefakt V1.0 §7 / §11 / §14; Dokumentenkategorie-/Retention-Regelmatrix V1.0 §12 / §16; Custody-Modell-Boundary-Artefakt V1.0 §5 / §6 / §10 / §11 / §15; ASVS-Control-Referenz-Artefakt V1.0 §9 / §14; TR-02102-Detail-Artefakt V1.0 §11 / §15 / §18; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116, NIST-, ENISA-Quellen sind ausdrücklich **keine** Lock-Quelle. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit F3-D2 V1.0 gilt F3-D2 für DR-/Restore-Boundary-Aussagen. Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-/Trennungs-Boundaries. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Restore-/Plaintext-/Krypto-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |
| **Verankerungs-Hinweis** | Das DR-/HA-/BCM-Folgeartefakt ist im Locked Decisions Register V1.0 §6 als **Sortierungsmarker B** eigenständig enumeriert (Eintrag: „Architektur-/HA-/BCM-Artefakt — Near-zero-RPO/RTO außerhalb F3-D2"). Damit ist die Bindungsgrundlage repository-intern eindeutig verankert. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Lock-Aussage** | DR-/HA-/BCM-Folgeartefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Keine RPO-/RTO-Garantie, keine Verlust- oder Verfügbarkeits-Garantie, keine externe Zertifizierung, kein Audit-Ergebnis, keine Sicherheits- oder Produktivfreigabe. Eine externe sicherheitsfachliche und rechtliche Prüfung bleiben vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. |

---

## 25. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der DR-/HA-/BCM-Anker aus F3-D2 V1.0, Locked Decisions Register §6 Sortierungsmarker B, Retention V1.0 §6.1/§6.4, Security V1.0 §10/§17, Lösch-/Sperrkonzept V1.0 §7/§11/§14, Regelmatrix V1.0 §12/§16, Custody V1.0 §5/§6/§10/§11/§15, ASVS V1.0 §9/§14 und TR-02102-Detail V1.0 §11/§15/§18 | in V1.0 enthalten |
| Internal Review Patch | Schärfung der Anti-Garantie-/Anti-Konformitäts-/Anti-Zertifizierungs-Wortwahl; Klarstellung der RPO-/RTO-Boundary mit F3-D2-Default als Produktpolitik und Near-zero-RPO/RTO als Boundary-Topik (außerhalb F3-D2); Klarstellung der strikten Trennung gegenüber Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, ASVS-Control-Referenz, TR-02102-Detail und Cybersecurity-Incident-Response; ausdrückliche Aufnahme von ISO 22301, BSI Hochverfügbarkeitskompendium, BSI IT-Grundschutz, BSI TR-03116, NIST-, ENISA-Quellen in die Negativ-Quellgrundlage | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen — insbesondere die Befüllung der RPO-/RTO-Boundary mit konkreteren produktpolitischen Werten oder Ableitungen, die Konkretisierung der Restore-Modi-Topoi mit operativer Mechanik oder die Aufnahme externer Normen-/Zertifizierungs-Aussagen — erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf F3-D2 sowie ohne Einführung neuer externer Quellen über die in Security V1.0 §3, Retention V1.0 §3 und Custody V1.0 §3 bereits paraphrasierten hinaus. Eine externe sicherheitsfachliche Validierung und eine externe rechtliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig.
