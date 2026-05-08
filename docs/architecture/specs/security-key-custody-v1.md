# Security-/Krypto-/Key-Custody-Artefakt — V1.0

**Lock-Aussage:** Security-/Krypto-/Key-Custody-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Eine externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | Security-/Krypto-/Key-Custody-Artefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe |
| Zweck | Festlegung der Sicherheits-, Krypto- und Key-Custody-Grenzen für Harouda |
| Scope | Boundary-Aussagen zu Vertraulichkeit, Integrität, Verfügbarkeit, Berufsgeheimnis-Schutz, Krypto-Orientierung, ASVS-Zielprofil, Plattform-Admin-Grenze, Abgrenzungen gegen DR/Migration/Retention sowie Crypto-Shredding als Architektur-Option |
| Non-Scope | Konkretes Key-Custody-Modell, Algorithmen, Cipher Suites, TLS-Parameter, Schlüssellängen, Schlüsselrotations-Mechanik, Speichertechnologie, Verschlüsselungs-Implementierung, Anbieter-/Produkt-/Plattform-/Hardware-Wahl, DR-/HA-/BCM-Design, Z3-/Datenüberlassungs-Format, Migrations-Implementierung, Incident-Response-Runbook, Endfassung Verfahrensdokumentation Kap. 5, Rechtsgutachten, Sicherheitsfreigabe |
| Lock-Basis | Draft V0.1, Patch V0.2, External Boundary Review Package, Micro-Patch R0.1, gesperrte Harouda-Registergrenzen (F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing) sowie das Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Beschaffung, keine Schema-, Speicher- oder Anbieter-Entscheidung. |

---

## 2. Zweck und fachliche Rolle

Das Security-/Krypto-/Key-Custody-Artefakt definiert die fachlichen Sicherheits-, Krypto- und Key-Custody-Grenzen für Harouda. Es ist ein **internes Boundary-/Spec-Lock** und trifft keine technische Entscheidung über Verfahren, Produkte, Anbieter oder Implementierung.

Das Artefakt liegt fachlich vor Kapitel 5 der Verfahrensdokumentation („Datensicherheits- und Datenschutzkonzept") und kann von dieser bei der nächsten Pflege per Verweis konsumiert werden; es ersetzt Kap. 5 nicht.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- das konkrete Key-Custody-Modell,
- die rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17,
- die abschließende straf- bzw. berufsrechtliche Bewertung nach StGB § 203 / StBerG § 62a für konkrete operative Vorgänge,
- konkrete Algorithmen, Schlüssellängen, Modi oder TLS-Parameter,
- die Endfassung der Verfahrensdokumentation Kap. 5.

Eine externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) sowie eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich.

---

## 3. Authoritative Source Basis

Die folgende Tabelle benennt die maßgeblichen Quellen. Es werden ausschließlich kurze, repository-sichere Paraphrasen verwendet; Originaltext wird nicht übernommen.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| DSGVO Art. 28 | Auftragsverarbeitung; Anforderungen an die Verarbeiter-Beziehung | Boundary-Verweis |
| DSGVO Art. 32 | Sicherheit der Verarbeitung; Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit, Wiederherstellbarkeit, regelmäßige Überprüfung | Boundary-Verweis |
| DSGVO Art. 33 / 34 | Meldepflichten bei Datenschutzverletzungen | Grenzverweis (out of scope; eigenes Folgeartefakt) |
| StGB § 203 | Verletzung von Privatgeheimnissen; Berufsgeheimnis-Schutz | Boundary-Verweis |
| StBerG § 62a | Datenschutz im StB-Mandat; Verschwiegenheitspflicht-Schutz im Mandanten-Verhältnis | Boundary-Verweis |
| BSI TR-02102-1, Version 2026-01 | Empfehlungen zu kryptographischen Verfahren und Schlüssellängen | Krypto-Orientierung; **kein** Konformitätsanspruch |
| BSI TR-02102-2, Version 2026-01 | Empfehlungen zur Verwendung von TLS | Transport-Boundary-Orientierung; **kein** Konformitätsanspruch |
| OWASP ASVS 5.0.0 | Application Security Verification Standard | ASVS-Zielprofil; **kontrollbasierte Referenzierung**; **keine** Zertifizierung |
| BDSG § 5 / § 53 | Spezialgesetzliche Datenschutz-Regelungen für bestimmte Konstellationen | **Negative Boundary** — siehe Abschnitt 14 |
| DSK Kurzpapier Nr. 11 | Aufsichtsbehördliche Auffassung zum Spannungsfeld zwischen Löschung/Sperrung und Aufbewahrungspflichten | dynamischer/offener Auffassungsstand für die Crypto-Shredding-Diskussion; **keine** finale Autoritäts-Aussage |

**Nicht-normativer Status in V1.0:** BSI TR-03116 und BSI IT-Grundschutz werden in V1.0 **nicht** als allgemeine Pflicht-Baseline für Harouda als private SaaS-Praxis gesetzt. Sie können in nachgelagerten Detail-Artefakten relevant werden, wenn ein konkreter regulierter Schnittstellen-Kontext dies verlangt; in V1.0 sind sie ausdrücklich Non-Scope.

---

## 4. Core Security Boundaries

Auf Boundary-Ebene gelten:

- **Vertraulichkeit:** Mandantendaten und Schlüsselmaterial sind gegen unbefugte Einsichtnahme zu schützen.
- **Integrität:** Manipulationen an aufbewahrungs- und buchführungsrelevanten Datenbeständen müssen nachvollziehbar bleiben (Bezug zu F0-D4 Festschreibung sowie zum Aufbewahrungs-/Retention-Archiv-Artefakt V1.0).
- **Verfügbarkeit:** Verfügbarkeit ist auf Boundary-Ebene anerkannt; konkrete Verfügbarkeitsziele und Restore-Modi gehören in das DR-/HA-/BCM-Folgeartefakt.
- **Nachvollziehbarkeit / Accountability:** Sicherheitsrelevante Aktionen sind als Audit-Spur zu führen; das konkrete Audit-Modell verbleibt in Architektur-/Audit-Folgeartefakten.
- **Mandantentrennung:** F0-D6 bleibt autoritativ; mandantenübergreifende Vermischung ist auch im Sicherheits- und Schlüsselkontext ausgeschlossen.

V1.0 trifft auf dieser Ebene keine Aussage über konkrete Sicherheitsmechanismen, Werkzeuge, Hersteller oder Implementierungen.

---

## 5. DSGVO Boundary

| Norm | Wirkung an der Sicherheits-/Key-Custody-Grenze |
|---|---|
| Art. 28 (Auftragsverarbeitung) | Pflichten gegenüber Verarbeitern bleiben unberührt; die konkrete Verarbeiter- bzw. Anbieterwahl ist Non-Scope. |
| Art. 32 (Sicherheit der Verarbeitung) | Vertraulichkeit, Integrität, Verfügbarkeit und Belastbarkeit werden auf Boundary-Ebene gestützt; konkrete TOM verbleiben in Verfahrensdokumentation Kap. 5 sowie nachgelagerten Detail-Artefakten. |
| Art. 33 / 34 (Meldepflichten) | **Out of Scope.** Datenschutz-Vorfallsprozess ist eigenständiges Folgeartefakt. |

DSGVO Art. 32 ist **kein Ersatz** für ein DR-/HA-/BCM-Konzept und **kein Ersatz** für ein Aufbewahrungs-Konzept; die in Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 etablierten Abgrenzungen bleiben erhalten.

---

## 6. Berufsgeheimnis Boundary: StGB § 203 / StBerG § 62a

- StGB § 203 (Verletzung von Privatgeheimnissen) und StBerG § 62a (Datenschutz im StB-Mandat) sind in Harouda **maßgeblich** als Schutzrahmen für Mandanten-Verhältnisse.
- Plaintext-Zugriff auf Mandantendaten durch nicht zur Berufsverschwiegenheit verpflichtete Subjekte ist auf Boundary-Ebene **ausgeschlossen**.
- Schlüsselmaterial darf **nicht** so verwaltet werden, dass ein nicht zur Berufsverschwiegenheit verpflichtetes Subjekt einseitig Plaintext-Zugriff auf Mandantendaten erlangen kann.
- Die abschließende straf- bzw. berufsrechtliche Bewertung konkreter operativer Vorgänge (z. B. konkrete Auftragsverarbeiter-Konstellationen, konkrete Custody-Modelle) ist **nicht** Gegenstand von V1.0 und verbleibt downstream.

---

## 7. BSI Cryptography Boundary

Auf Boundary-Ebene gilt:

- Kryptographische Verfahren und Schlüssellängen orientieren sich an **BSI TR-02102-1, Version 2026-01**.
- Die Transport-Sicherheits-Grenze orientiert sich an **BSI TR-02102-2, Version 2026-01**.
- Anforderungen an den **Schlüssellebenszyklus** (Erzeugung, Verteilung, Nutzung, Rotation, Sperrung, Vernichtung) werden auf Boundary-Ebene anerkannt; ihre Konkretisierung erfolgt ausschließlich in nachgelagerten Detail-Artefakten.
- V1.0 definiert **keine** Algorithmen, Modi, Cipher Suites, TLS-Versionen oder konkreten Parameter.
- V1.0 erhebt **keinen** Konformitätsanspruch gegenüber BSI-Vorgaben. Eine konkrete Konformitäts-Aussage erfordert eine eigene fachliche Prüfung außerhalb dieses Artefakts.

---

## 8. OWASP ASVS Boundary

- Als sicherheitsfunktionales Zielprofil für Harouda gilt **OWASP ASVS 5.0.0** im Sinne einer „**ASVS-Zielprofil**"-Referenzierung.
- Die Verbindung zu konkreten Anforderungen erfolgt **kontrollbasiert** in nachgelagerten Detail-Artefakten unter Verwendung des Format-Stils `v5.0.0-X.Y.Z` (Kontroll-Adresse mit Major-/Minor-/Patch-Indizes gemäß ASVS-Strukturierung).
- V1.0 enthält **keine** vollständige Kontroll-Mapping-Tabelle.
- V1.0 erhebt **keinen** Anspruch auf ASVS-Verifikation. Eine ASVS-bezogene formale Prüfung ist eigenständig zu organisieren.

---

## 9. Plattform-Admin / Key-Custody Boundary

Gemäß Patch V0.2:

- **V1.0 sperrt die Key-Custody-Grenze.**
- **V1.0 sperrt nicht das konkrete Custody-Modell.** Die Wahl des Custody-Modells (z. B. zentrale vs. mandantenseitige Schlüsselverwaltung, hardware- vs. softwarebasierte Schutzdomäne, Custody-Schichtung) ist downstream zu entscheiden.
- **Kein einzelnes administratives Subjekt** darf einseitig Plaintext-Zugriff auf Mandantendaten erlangen können.
- **F0-D7** (Plattform-Admin-Grenze) bleibt autoritativ: Plattform-Administration ist **rein technische Rolle**, kein fachlicher Superuser.
- **F3-D1**: Plattform-Admin erzeugt keinen Z3-Export.
- **F3-D2**: Keine Schlüssel-/Plaintext-/Mandantendaten-Einsicht durch Restore.
- **F3-D3**: Keine fachliche Migrationsentscheidung, kein Inhalts-/Secrets-Zugriff.

V1.0 trifft keine Aussage über konkrete Trennungsmechanismen (z. B. Vier-Augen-Verfahren, Geheimnis-Aufteilung, hardwaregestützte Schutzdomänen). Diese sind im Custody-Modell-Folgeartefakt zu spezifizieren.

---

## 10. DR / Backup / Restore Boundary

Auf Boundary-Ebene gilt — konsistent mit F3-D2:

- **Aufbewahrungs-/Retention-Archiv ≠ DR-Backup.**
- DR-Backup dient ausschließlich der technischen Wiederherstellbarkeit; Restore-Vorgänge dürfen **keinen** unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen.
- Ransomware-Restore ist erst nach **Integritätsprüfung** und **forensischer Freigabe** zulässig.
- DR-Restore ist **nicht** mit Migrations-Rollback gleichzusetzen.
- Konkrete RPO/RTO-Werte, Restore-Modi sowie HA-/BCM-Aussagen verbleiben im DR-/HA-/BCM-Folgeartefakt; V1.0 trifft hierzu keine Festlegung.

---

## 11. Migration Boundary

Auf Boundary-Ebene gilt — konsistent mit F3-D3:

- Migrationen leisten ausschließlich Formatumsetzung ohne Inhaltsänderung; sie dürfen **keine** Plaintext-/Secrets-Einsicht ermöglichen.
- Plattform-Administration im Migrations-Kontext ist auf technische Ausführung beschränkt; **keine** fachliche Entscheidung, **kein** Inhalts-/Secrets-Zugriff.
- Test-Migrationen mit Produktivdaten sind nur unter den in F3-D3 etablierten Voraussetzungen (DSGVO-Rechtsgrundlage, Zweckbindung, Bereinigungspflicht, Audit-Spur) zulässig.
- Migrations-Rollback ist **nicht** mit DR-Restore gleichzusetzen.
- Konkrete Migrations-Mechanik verbleibt im Migrations-Folgeartefakt; V1.0 trifft hierzu keine Festlegung.

---

## 12. Retention Archive Boundary

Auf Boundary-Ebene gilt — konsistent mit dem Aufbewahrungs-/Retention-Archiv-Artefakt V1.0:

- **Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration.**
- Sicherheits-, Krypto- und Schlüsselverwaltungs-Aspekte für das Retention-Archiv unterliegen den Boundary-Aussagen dieses Artefakts.
- Konkrete Speichertechnologie, Verschlüsselungsverfahren und Schlüsselverwaltung für das Retention-Archiv verbleiben im Custody-Modell-Folgeartefakt sowie ggf. im DR-/HA-/BCM-Folgeartefakt; sie sind weder in V1.0 dieses Artefakts noch im Retention-Archiv-Artefakt entschieden.
- Das in F3-D2 verankerte Verbot des Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Restore gilt sinngemäß auch im Retention-Kontext.

---

## 13. Crypto-Shredding Boundary

- Crypto-Shredding wird in V1.0 **ausschließlich als Architektur-Option / Boundary-Topik** behandelt.
- V1.0 stellt **nicht** fest, dass Crypto-Shredding rechtlich eine Löschung im Sinne von DSGVO Art. 17 Abs. 1 erfüllt.
- Crypto-Shredding darf **nicht** zur Umgehung gesetzlicher Aufbewahrungspflichten verwendet werden; die Aufbewahrungspflicht überlagert das Recht auf Löschung gemäß DSGVO Art. 17 Abs. 3 lit. b und gemäß Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 Abschnitt 7.
- Die abschließende rechtliche Würdigung von Crypto-Shredding (z. B. Einordnung als Maßnahme nach Art. 17 Abs. 1 oder als Maßnahme nach Art. 18 Abs. 1 lit. b oder als andere Maßnahme) verbleibt **downstream** und erfordert eine externe Prüfung durch Fachanwalt für IT-Recht/Datenschutzrecht und Datenschutzbeauftragten.
- DSK Kurzpapier Nr. 11 ist als dynamischer/offener Auffassungsstand zu betrachten; V1.0 leitet daraus **keine** finale Autoritäts-Aussage ab.
- V1.0 entscheidet **nicht** über die operative Mechanik (Schlüsselhierarchie, Schlüsselzerstörungs-Verfahren, Nachweisführung); diese verbleibt im Custody-Modell- bzw. im Lösch-/Sperrkonzept-Folgeartefakt.

---

## 14. BDSG Negative Boundary

- BDSG § 5 und BDSG § 53 sind als spezialgesetzliche Datenschutz-Regelungen für bestimmte (insbesondere öffentlich-rechtliche bzw. einsatzbezogene) Konstellationen einschlägig. Sie sind **keine primäre normative Grundlage** für Harouda als private SaaS-Praxis.
- Sie werden in V1.0 ausschließlich als **negative Boundary** geführt, um eine Fehl-Allokation öffentlich-rechtlicher Spezialregelungen auf die private Mandantenpraxis auszuschließen.
- Eine produktive Anwendung dieser Normen erfolgt nur dann, wenn ein konkreter, einzelfallbezogener Einsatzkontext sie auslöst; diese Beurteilung ist downstream und außerhalb V1.0.

---

## 15. STOP-Bedingungen

**Zusätzlicher Lock-Gate-Hinweis:**
Eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) und eine externe sicherheitsfachliche Validierung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung **erforderlich**. Dieser Hinweis schafft **keine** zusätzliche nummerierte STOP-Bedingung; er ist eine fachlich-organisatorische Voraussetzung außerhalb der nachfolgend nummerierten Liste.

### 15.1
Kein konkretes Key-Custody-Modell darf in V1.0 dieses Artefakts festgelegt werden. Die Festlegung erfolgt im nachgelagerten Custody-Modell-Folgeartefakt.

**Hinweis zu 15.1:**
Diese STOP-Bedingung verbietet **nicht** die Diskussion möglicher Custody-Topologien in nachgelagerten Detail-Artefakten. Sie verbietet ausschließlich, dass V1.0 dieses Artefakts ein konkretes Modell auswählt, festlegt oder implementiert.

### 15.2
Keine Wahl von Anbietern, Werkzeugen, Plattformen, Produkten, Cloud-Diensten, Hardware-Komponenten oder Software-Bibliotheken in V1.0.

### 15.3
Keine Festlegung konkreter Algorithmen, Modi, Cipher Suites, TLS-Versionen oder Schlüssellängen in V1.0. Solche Konkretisierungen erfolgen ausschließlich in nachgelagerten Detail-Artefakten unter Bezug auf BSI TR-02102-1, Version 2026-01 bzw. BSI TR-02102-2, Version 2026-01.

### 15.4
Keine Aussage über die rechtliche Einordnung von Crypto-Shredding unter DSGVO Art. 17 in V1.0; keine Verwendung von Crypto-Shredding zur Umgehung gesetzlicher Aufbewahrungspflichten.

### 15.5
Keine Aussage über BSI-Konformität, ASVS-Zertifizierung oder vergleichbare Konformitäts- bzw. Zertifikats-Behauptungen in V1.0; keine produktbezogenen Zertifizierungs- oder Marketing-Behauptungen.

### 15.6
Keine Veränderung gesperrter Harouda-Boundaries (insbesondere F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing) durch V1.0 dieses Artefakts; bei Konflikt gilt der jeweils gesperrte Boundary-Lock.

---

## 16. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Implementierung jeglicher Art,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode und Pseudocode,
- Algorithmus-Design,
- SQL und Query-Spezifikation,
- Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud- oder Hardware-Wahl,
- Schlüsselverwaltungs-Produktwahl (KMS-/HSM-Produktwahl),
- Speichertechnologie,
- konkrete Schlüsselhierarchie-Implementierung,
- konkrete Schlüsselrotations-Implementierung,
- konkrete TLS-Parameter-/Cipher-Suite-Auswahl,
- DR-/HA-/BCM-Design,
- Z3-/Datenüberlassungs-Format,
- Migrations-Implementierung,
- Incident-Response-Runbook,
- Rechtsgutachten oder verbindliche Rechtsauskunft,
- Sicherheitsfreigabe oder Produktivfreigabe,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; kein Verschlüsselungsverfahren und keine Schlüsselverwaltung in konkreter Form; keine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; kein Incident-Response-Runbook; keine Implementierungs-Autorisierung jeglicher Art; keine Rechtsauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 17. Downstream Artefakte / Open Detail Decisions

Die folgenden Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **Custody-Modell-Folgeartefakt** — Festlegung des konkreten Schlüsselverwaltungs- und Custody-Modells (Topologie, Trennungsmechanismen, Schutzdomänen-Architektur).
- **TR-02102-Detail-Artefakt** — konkrete Algorithmen, Modi, Cipher Suites, Schlüssellängen sowie TLS-Parameter unter Bezug auf BSI TR-02102-1, Version 2026-01 und BSI TR-02102-2, Version 2026-01.
- **ASVS-Control-Referenz-Artefakt** — vollständige Kontroll-Mapping-Tabelle im Format `v5.0.0-X.Y.Z`.
- **Lösch-/Sperrkonzept-Folgeartefakt** — Mechanik der Löschung bzw. Sperrung nach Fristablauf, einschließlich Crypto-Shredding-Operationalisierung sofern downstream rechtlich freigegeben.
- **Crypto-Shredding rechtliche Einordnung** — externe Fachanwalts-/DSB-Prüfung der Einordnung unter DSGVO Art. 17 / Art. 18.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Ransomware-/Forensik-Workflow.
- **Architektur-/HA-/BCM-Folgeartefakt** — RPO/RTO, Restore-Modi, Hochverfügbarkeit, Geschäftsfortführung.
- **Migrations-Folgeartefakt** — Operationalisierung F3-D3.
- **DR-Folgeartefakte** — Operationalisierung F3-D2.
- **Lohn-DLS-Folgeartefakt** — Berücksichtigung des Berufsgeheimnis-Schutzes im Lohn-/SV-Datenkontext.
- **Verfahrensdokumentation Kap. 5 (nächste Pflege)** — Aufnahme dieses Artefakts per Verweis als vorgelagerte Spezifikation.

---

## 18. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für Sicherheits-, Krypto- und Key-Custody-Grenzen in Harouda. Maßgeblich für die Ableitung der in Abschnitt 17 genannten Folgeartefakte und für die Bezugnahme aus Verfahrensdokumentation Kap. 5. |
| **Bindend für** | Alle in Abschnitt 17 genannten Folgeartefakte; Verfahrensdokumentation Kap. 5 (im Rahmen ihrer nächsten Pflege); alle nachgelagerten Detail-Artefakte zu Krypto-, TLS- und Schlüssellebenszyklus-Themen. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen DR-Backup, Z3-/Datenüberlassung, Migration, Aufbewahrungs-/Retention-Archiv und Datenschutz-Vorfallsprozess. |
| **Nicht bindend für** | Konkretes Key-Custody-Modell. Konkrete Algorithmen/Modi/Cipher Suites/TLS-Parameter. Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Hardware-Wahl. DR-/HA-/BCM-Design. Z3-/Datenüberlassungs-Format. Migrations-Implementierung. Datenschutz-Vorfallsprozess. Endfassung Verfahrensdokumentation Kap. 5. Rechtsauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. |
| **STOP-Bedingungen** | **6** nummerierte STOP-Bedingungen (15.1 bis 15.6) zuzüglich des nicht-nummerierten Lock-Gate-Hinweises sowie des nicht-nummerierten Hinweises zu 15.1 gemäß Abschnitt 15. |
| **Boundaries** | Sicherheits-/Krypto-/Key-Custody-Grenze ≠ Implementierung. Plattform-Admin (F0-D7) bleibt rein technische Rolle ohne fachlichen Superuser. F3-D1 (Z3-/Datenüberlassung), F3-D2 (DR/Restore), F3-D3 (Migration) bleiben autoritativ. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration (Konsistenz mit Aufbewahrungs-Artefakt V1.0). DR-Restore ≠ Migrations-Rollback. Mandantentrennung F0-D6 bleibt autoritativ. F0-D4 Festschreibung bleibt unberührt. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. BDSG § 5 / § 53 ist negative Boundary; keine Pflicht-Baseline für private SaaS-Praxis. BSI TR-03116 und BSI IT-Grundschutz nicht-normativ in V1.0. |
| **Quellgrundlage** | DSGVO Art. 28, 32, 33, 34; StGB § 203; StBerG § 62a; BSI TR-02102-1, Version 2026-01; BSI TR-02102-2, Version 2026-01; OWASP ASVS 5.0.0; BDSG § 5 / § 53 (negative Boundary); DSK Kurzpapier Nr. 11 (offener Auffassungsstand); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing; Aufbewahrungs-/Retention-Archiv-Artefakt V1.0. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| **Lock-Aussage** | Security-/Krypto-/Key-Custody-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. |

---

## 19. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung | abgelöst |
| Patch V0.2 | Konsolidierungs-Patch (u. a. Trennung Custody-Boundary vs. Custody-Modell, ASVS-Zielprofil-Wortwahl) | in V1.0 enthalten |
| External Boundary Review Package | Externe Boundary-Review-Iteration; Anpassung Hinweis zu 15.1; Zusätzlicher Lock-Gate-Hinweis | in V1.0 enthalten |
| Micro-Patch R0.1 | Softening BSI-Wortwahl; Klarstellung BSI TR-02102 als Orientierung statt Konformitäts-Anspruch; BDSG-Negative-Boundary-Schärfung | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf das amtliche Quellpaket, die gesperrten Harouda-Registergrenzen und die in Abschnitt 17 genannten Detail-Artefakte. Eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) und eine externe sicherheitsfachliche Validierung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich.
