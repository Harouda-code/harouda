# TR-02102-Detail-Artefakt — V1.0

**Lock-Aussage:** TR-02102-Detail-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert die in Security-/Krypto-/Key-Custody-Artefakt V1.0 §7 angelegte Krypto-Orientierungs-Boundary auf der Ebene paraphrasierter Mechanismen-Familien-Orientierung, Schlüssellängen-Orientierung, TLS-/Transport-Orientierung und Lebenszyklus-Orientierung. V1.0 erhebt **keinen** Anspruch auf BSI-Konformität, **keinen** Anspruch auf TR-02102-Erfüllung, **keine** Zertifizierung, **kein** Audit-Ergebnis, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe und **keine** rechtliche, steuerfachliche oder DSB-Freigabe. V1.0 autorisiert **keine** Implementierung. Eine externe sicherheitsfachliche Validierung (Krypto-/Sicherheits-Spezialist) sowie eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | TR-02102-Detail-Artefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** BSI-Konformitäts-, TR-02102-Erfüllungs-, Zertifizierungs- oder Audit-Behauptung |
| Zweck | Festlegung der fachlichen Boundary-Aussagen für die paraphrasierte Krypto- und Transport-Orientierung in Harouda auf Basis von BSI TR-02102-1 (Version 2026-01) und BSI TR-02102-2 (Version 2026-01); Konkretisierung der in Security V1.0 §7 angelegten Orientierung auf der Ebene von Mechanismen-Familien, Schlüssellängen-Orientierungen und TLS-/Transport-Familien — durchgehend ohne Konformitätsanspruch und ohne Implementierungsregel |
| Scope | Boundary-Aussagen zu: Mechanismen-Familien-Orientierung gemäß BSI TR-02102-1 Version 2026-01; Schlüssellängen-Orientierung als Quell-Paraphrase; Algorithmen-Lebenszyklus-Orientierung als Quell-Paraphrase; TLS-/Transport-Familien-Orientierung gemäß BSI TR-02102-2 Version 2026-01; Cipher-Suite-Familien-Orientierung als Quell-Paraphrase; Versions-Lock auf 2026-01 konsistent mit Security V1.0, Custody V1.0 und ASVS V1.0; Cross-Boundary-Konsistenz mit Security V1.0, Custody V1.0, ASVS V1.0 und mit gesperrten Harouda-Locks |
| Non-Scope | Konkrete Algorithmen-Auswahl, konkrete Modi, konkrete Cipher Suites, konkrete TLS-Versions-Auswahl, konkrete Schlüssellängen-Werte, konkrete kryptographische Parameter; Implementierung; Datenmodell/Schema; UI/UX; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; APIs; automatische Jobs; Test-Cases, Test-Methodik, CI/CD-Scanner-Setup, Werkzeug-Konfiguration; Custody-Topologie und Schlüsselhierarchie (verbleiben Custody-Modell V1.0); KMS-/HSM-Modellwahl, Schutzdomänen-Architektur, Schlüsselrotations-/Vernichtungs-/Wiederherstellungs-Mechanik (verbleiben KMS-/HSM-/Implementations-Folgeartefakt); Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-/Bibliotheks-Wahl; ASVS-Verifikation und ASVS-Control-Mapping (verbleiben ASVS-Control-Referenz V1.0); DR-/HA-/BCM-Design; Z3-/Datenüberlassungs-Format; Migrations-Implementierung; Incident-Response-Runbook; rechtliche Würdigung von Crypto-Shredding; Endfassung Verfahrensdokumentation Kap. 5; BSI TR-03116; BSI IT-Grundschutz; Rechtsgutachten; Steuerauskunft; DSB-/Sicherheits-/Produktivfreigabe; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Security-/Krypto-/Key-Custody-Artefakt V1.0 §7 (Krypto-Orientierung), §15 (Negativ-Erklärung zu konkreten Algorithmen/Modi/Cipher Suites/TLS-Versionen/Schlüssellängen) und §17 (Auftrag „TR-02102-Detail-Artefakt unter Bezug auf BSI TR-02102-1 / TR-02102-2, Version 2026-01"); Custody-Modell-Boundary-Artefakt V1.0 §3, §10, §15 und §16 (Algorithmik-Defer); ASVS-Control-Referenz-Artefakt V1.0 §6, §8, §10, §14 und §15 (strikte Trennung gegenüber TR-02102-Detail); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit Security V1.0 gilt Security V1.0 für Krypto-/Sicherheits-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Mapping-Schnittstellen. Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle (BSI TR-02102-1 / TR-02102-2 in der jeweils gelockten Version 2026-01) gilt die amtliche Quelle. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Algorithmen-Auswahl, keine Cipher-Suite-Auswahl, keine TLS-Parameter-Auswahl, keine Schlüssellängen-Festlegung, keine Bibliotheks-/Anbieter-Wahl, keine Beschaffung. |

**Wichtiger Hinweis zur Verankerung:** Das TR-02102-Detail-Artefakt ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Es figuriert dort innerhalb des Sortierungsmarker-A-Komplexes „Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze". Die Bindungsgrundlage dieses Artefakts leitet sich ausschließlich ab aus:
- Security-/Krypto-/Key-Custody-Artefakt V1.0 §7 (Krypto- und Transport-Orientierung), §15 (Negativ-Erklärung) und §17 (Downstream-Auftrag „TR-02102-Detail-Artefakt"),
- Custody-Modell-Boundary-Artefakt V1.0 §3 (Source Basis), §10 (Verhältnis zu TR-02102-Detail), §15 (Downstream-Auftrag) und §16 (V1.0 Lock-Profil),
- ASVS-Control-Referenz-Artefakt V1.0 §6 (ASVS-Zielprofil-Cluster Kryptographie-/Transport-Verweisbereiche), §8 (Verhältnis zu TR-02102-Detail), §10 (Mapping-Tabelle Kryptographie-/Transport-Zeilen), §14 (Downstream-Auftrag) und §15 (V1.0 Lock-Profil).

V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht** und behauptet **keine** Register-Verankerung, die nicht existiert.

---

## 2. Zweck und fachliche Rolle

Das TR-02102-Detail-Artefakt definiert die fachlichen Boundary-Grenzen für:

- die paraphrasierte **Mechanismen-Familien-Orientierung** auf Basis BSI TR-02102-1 Version 2026-01,
- die paraphrasierte **Schlüssellängen-Orientierung** auf Basis BSI TR-02102-1 Version 2026-01,
- die paraphrasierte **Algorithmen-Lebenszyklus-Orientierung** (Eignung über Zeit, Migrations-Vorausschau auf Quellebene),
- die paraphrasierte **TLS-/Transport-Familien-Orientierung** auf Basis BSI TR-02102-2 Version 2026-01,
- die paraphrasierte **Cipher-Suite-Familien-Orientierung** auf Basis BSI TR-02102-2 Version 2026-01,
- die **Versions-Lock**-Konsistenz mit Security V1.0, Custody V1.0 und ASVS V1.0 (jeweils 2026-01),
- die **Wahrung** der gesperrten Harouda-Boundaries,
- die **strikte Abgrenzung** gegenüber ASVS-Control-Referenz V1.0, Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt.

Das TR-02102-Detail-Artefakt ist ein **internes Boundary-/Spec-Lock**. Es liefert paraphrasierte Quell-Orientierungs-Aussagen, **trifft jedoch selbst keine** Algorithmen-Auswahl, **keine** Cipher-Suite-Auswahl, **keine** TLS-Parameter-Festlegung, **keine** Schlüssellängen-Festlegung, **keine** Custody-Topologie, **keine** KMS-/HSM-Modellwahl, **keine** Anbieter-/Werkzeug-/Bibliotheks-Wahl und **keine** Implementierungs-Entscheidung.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- konkrete Algorithmen, Modi, Cipher Suites, TLS-Versions-Auswahlen, Schlüssellängen-Werte oder kryptographische Parameter (verbleiben einer separat zu autorisierenden späteren Versions-Pflege dieses Artefakts und/oder dem KMS-/HSM-/Implementations-Folgeartefakt),
- die abschließende sicherheitsfachliche Bewertung im Einzelfall,
- die rechtliche Würdigung von Crypto-Shredding,
- BSI-Konformität, TR-02102-Erfüllung, Zertifizierungs- oder Audit-Aussagen,
- die Endfassung der Verfahrensdokumentation Kap. 5,
- konkrete Custody-Topologie, KMS-/HSM-Modellwahl, Schlüsselhierarchie, Schlüssellebenszyklus-Mechanik,
- Anbieter-/Werkzeug-/Bibliotheks-/Plattform-/Hardware-/Cloud-/Modell-Wahl,
- ASVS-Control-Mapping (verbleibt ASVS-Control-Referenz V1.0).

Eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) sowie eine externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung **erforderlich**.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext aus BSI-Quellen wird **nicht** übernommen. V1.0 dieses Artefakts erzeugt **keine** eigenen externen Quellen über die in Security V1.0 §3 und Custody V1.0 §3 bereits paraphrasierten hinaus.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| BSI TR-02102-1, Version 2026-01 | Empfehlungen zu kryptographischen Verfahren auf Mechanismen-Familien-Ebene, Schlüssellängen-Orientierung, Algorithmen-Lebenszyklus-Orientierung | **Krypto-Orientierung**; **kein** Konformitätsanspruch; konkrete Auswahl-Werte verbleiben downstream |
| BSI TR-02102-2, Version 2026-01 | Empfehlungen zur Verwendung von TLS auf Versions- und Cipher-Suite-Familien-Ebene | **Transport-Boundary-Orientierung**; **kein** Konformitätsanspruch; konkrete Parameter-Werte verbleiben downstream |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | §7 Krypto-/TLS-Orientierungs-Boundary; §15 Negativ-Erklärung; §17 Downstream-Auftrag „TR-02102-Detail-Artefakt"; Versionshinweis Micro-Patch R0.1 (Wortwahl-Schärfung) | **Direkte Lock-Basis** und maßgebende Wortwahl-Vorlage |
| Custody-Modell-Boundary-Artefakt V1.0 | §3 Source Basis; §10 Verhältnis zu TR-02102-Detail; §15 Downstream-Auftrag; §16 V1.0 Lock-Profil; STOP 13.8 (Algorithmik-Defer) | **Direkte Lock-Basis**; bestätigt Trennlinie gegenüber Custody-Topologie |
| ASVS-Control-Referenz-Artefakt V1.0 | §6 (Kryptographie-/Transport-Verweisbereiche); §8 (strikte Trennung gegenüber TR-02102-Detail); §10 Mapping-Tabelle (Verweis-Spalten); §14 Downstream-Auftrag; §15 V1.0 Lock-Profil; STOPs 12.6, 12.7 | **Direkte Lock-Basis**; bestätigt Trennlinie gegenüber ASVS-Control-Mapping |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0, Lösch-/Sperrkonzept-Artefakt V1.0, Dokumentenkategorie-/Retention-Regelmatrix V1.0 | Cross-Boundary-Konsistenz (Aufbewahrungs-/Lösch-/Klassifikations-Boundaries werden durch Krypto-/Transport-Aussagen nicht überschrieben) | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung), F0-D6 (Mandantentrennung), F0-D7 (Plattform-Admin-Grenze), F1-D1/F1-D2 (USt-Wahrheit), F3-D1 (Z3-Export), F3-D2 (DR/Restore), F3-D3 (Migration), F3-Closing | Autoritative Boundary-Quellen; bei Konflikt vorrangig |

V1.0 dieses Artefakts greift **nicht** auf externe Webseiten zu, importiert **keinen** Originaltext aus BSI-Quellen, OWASP, NIST, ENISA oder anderen externen Standards und führt **keine** über die o. g. paraphrasierten Anker hinausgehenden Quellen ein. Insbesondere werden BSI TR-03116 und BSI IT-Grundschutz **nicht** als Lock-Quelle aufgenommen (Security V1.0 §3 und §15 markieren beide explizit als nicht-normativ in V1.0).

---

## 4. Core TR-02102-Detail-Boundaries

Auf Boundary-Ebene gelten:

- **TR-02102-Detail ≠ Implementierung.** V1.0 enthält keine Implementierung, kein Datenmodell, kein Schema, kein UI/UX, keinen Programmcode, keinen Pseudocode, kein Algorithmus-Design, kein SQL und keine API-Definition.
- **TR-02102-Detail ≠ BSI-Konformität.** V1.0 erhebt keinen Konformitätsanspruch gegenüber BSI-Vorgaben. Eine konkrete Konformitäts-Aussage erfordert eine eigene fachliche Prüfung außerhalb dieses Artefakts.
- **TR-02102-Detail ≠ Zertifizierung.** V1.0 behauptet keine BSI-Zertifizierung, keine TR-02102-Erfüllung, keine Audit-Bestätigung; produktbezogene Zertifizierungs- oder Marketing-Behauptungen sind ausgeschlossen.
- **TR-02102-Detail ≠ ASVS-Verifikation.** ASVS-Control-Mapping verbleibt in ASVS-Control-Referenz V1.0; eine Verschmelzung ist auf Boundary-Ebene ausgeschlossen.
- **TR-02102-Detail ≠ Custody-Topologie.** Schlüsselverwaltungs-Topologie, Schlüsselhierarchie, Schutzdomänen-Architektur verbleiben Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt.
- **TR-02102-Detail ≠ KMS-/HSM-Implementierung.** Konkrete Schlüsselverwaltungs-Mechanik, Rotation, Vernichtung, Wiederherstellung verbleiben downstream.
- **TR-02102-Detail ≠ Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Hardware-/Bibliotheks-Wahl.** V1.0 trifft keine solche Wahl.
- **TR-02102-Detail ≠ rechtliche/sicherheitsfachliche/produktbezogene Freigabe.** V1.0 erteilt keine Freigabe; eine externe Validierung bleibt erforderlich.
- **Versions-Lock 2026-01.** Bezugnahmen erfolgen ausschließlich auf BSI TR-02102-1 (Version 2026-01) und BSI TR-02102-2 (Version 2026-01); diese Versionsbezeichnung ist konsistent mit Security V1.0 §3, Custody V1.0 §3 und ASVS V1.0 §16.
- **Cross-Cutting-Boundary-Wahrung.** Jede Aussage muss F0-D4, F0-D6, F0-D7, F1-D1/F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing wahren.
- **§28.11-bet bleibt unverändert/offen.** V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht.

V1.0 trifft **keine** Aussage über konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen-Werte, Werkzeuge, Hersteller, Cloud-Regionen, Hardware-Familien oder Implementierungen.

---

## 5. TR-02102-1 Boundary

Bezug: BSI TR-02102-1, Version 2026-01 — paraphrasiert auf Boundary-Ebene; Originaltext wird nicht übernommen; konkrete Auswahl-Werte sind in V1.0 dieses Artefakts **nicht** festgelegt.

**Auf Boundary-Ebene anerkannt** (ausschließlich als Mechanismen-Familien-Orientierung):

- **Symmetrische Verschlüsselungs-Familie** als Boundary-Topik; konkrete Verfahren, Modi und Schlüssellängen sind Non-Scope.
- **Authentifizierungs-Code-/Integritäts-Code-Familie** als Boundary-Topik; konkrete Verfahren sind Non-Scope.
- **Hash-Funktions-Familie** als Boundary-Topik; konkrete Verfahren sind Non-Scope.
- **Asymmetrische Verfahrens-Familie** (Schlüsseleinigung, Signatur, asymmetrische Verschlüsselung) als Boundary-Topik; konkrete Verfahren, Kurven, Schlüssellängen-Werte sind Non-Scope.
- **Schlüsselableitungs-Familie** als Boundary-Topik; konkrete Verfahren sind Non-Scope.
- **Zufallszahlen-Erzeugungs-Familie** als Boundary-Topik; konkrete Verfahren sind Non-Scope.

**Schlüssellängen-Orientierung** wird in V1.0 dieses Artefakts ausschließlich als **Boundary-Konzept** anerkannt. Konkrete Längen-Werte, Mindest-Längen oder Empfehlungs-Werte je Familie werden in V1.0 **nicht** festgelegt; sie verbleiben einer separat zu autorisierenden späteren Versions-Pflege dieses Artefakts oder dem KMS-/HSM-/Implementations-Folgeartefakt vorbehalten — jeweils unter Bezug auf die dann aktuelle Version BSI TR-02102-1.

**Algorithmen-Lebenszyklus-Orientierung** auf Boundary-Ebene anerkennt:

- die Boundary-Aussage, dass kryptographische Verfahren über Zeit fachlich revidiert werden,
- die Boundary-Aussage, dass eine Migrations-Vorausschau für überholte oder revidierte Verfahren auf Quell-Ebene berücksichtigt wird,
- die Boundary-Trennung: konkrete Migrations-Mechanik ist **kein** Bestandteil dieses Artefakts (verbleibt KMS-/HSM-/Implementations-Folgeartefakt sowie ggf. Migrations-Folgeartefakt).

**Wortwahl-Disziplin (TR-02102-1):** Aussagen erfolgen ausschließlich als Quell-Orientierung („orientiert sich an BSI TR-02102-1, Version 2026-01"). Konformitäts-Schlagwörter, Erfüllungs-Behauptungen, Zertifikats-Behauptungen oder vergleichbare freistehende Aussagen gegenüber BSI- oder TR-02102-Vorgaben sind ausgeschlossen.

---

## 6. TR-02102-2 Boundary

Bezug: BSI TR-02102-2, Version 2026-01 — paraphrasiert auf Boundary-Ebene; Originaltext wird nicht übernommen; konkrete Auswahl-Werte sind in V1.0 dieses Artefakts **nicht** festgelegt.

**Auf Boundary-Ebene anerkannt** (ausschließlich als Familien-Orientierung):

- **TLS-Versions-Familie** als Boundary-Topik; konkrete TLS-Versionen, Mindest-Versionen oder Auswahl-Werte sind Non-Scope.
- **Cipher-Suite-Familie** als Boundary-Topik; konkrete Cipher Suites sind Non-Scope.
- **Transport-Parameter-Familie** als Boundary-Topik; konkrete Parameter-Werte sind Non-Scope.
- **TLS-Authentifikations-Familie** (Server-/Client-/Mutual-Authentifikation auf Boundary-Topik-Ebene) als Konzept; konkrete Konfigurations-Werte sind Non-Scope.

**Protokoll-Lebenszyklus-Orientierung** auf Boundary-Ebene anerkennt:

- die Boundary-Aussage, dass TLS-Versionen und Cipher-Suite-Familien über Zeit fachlich revidiert werden,
- die Boundary-Aussage, dass eine Migrations-Vorausschau auf Quell-Ebene berücksichtigt wird,
- die Boundary-Trennung: konkrete Protokoll-Versions-/Cipher-Suite-Auswahl ist **kein** Bestandteil dieses Artefakts.

**Wortwahl-Disziplin (TR-02102-2):** Aussagen erfolgen ausschließlich als Quell-Orientierung („Transport-Boundary orientiert sich an BSI TR-02102-2, Version 2026-01"). Generische Transport-Sicherheits-Behauptungen, standalone Konformitäts-Schlagwörter, freistehende Erfüllungs-Behauptungen gegenüber BSI- oder TR-02102-Vorgaben oder vergleichbare Aussagen sind ausgeschlossen.

**Geltungsbereich auf Boundary-Ebene:** Anwendung der Transport-Boundary-Orientierung auf Mandanten- und Berufsgeheimnis-relevante Datenflüsse in Harouda gemäß Security V1.0 §6 / §10. Konkrete Transport-Pfade, Gateway-/Lastverteilungs-Aussagen, API-Endpunkt-Spezifikationen sind Non-Scope.

---

## 7. Verhältnis zu Security V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **TR-02102-Detail → Security V1.0** | TR-02102-Detail konkretisiert die in Security V1.0 §7 line 102–106 angelegte Krypto- und Transport-Orientierung auf Mechanismen-Familien-Ebene; es führt **keine** neue externe Quelle ein, die nicht in Security V1.0 §3 paraphrasiert ist. Bei Konflikt gilt Security V1.0. |
| **Wortwahl-Vorlage** | TR-02102-Detail übernimmt die Anti-Konformitäts-/Anti-Erfüllungs-Wortwahl aus Security V1.0 §7 (line 106) und §15 (lines 204, 210) sowie aus Versionshinweis Micro-Patch R0.1 (line 289). |
| **Versions-Lock** | TR-02102-Detail bindet sich auf 2026-01 entsprechend Security V1.0 §3 lines 53–54 und §17 line 253. |
| **Negativ-Erklärung** | TR-02102-Detail entfernt nicht die Non-Scope-Aussagen aus Security V1.0 (insbesondere keine Konformitätsbehauptung, keine Implementierungsregel, kein Werkzeug-/Anbieter-Pick). |

---

## 8. Verhältnis zu Custody V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **TR-02102-Detail → Custody V1.0** | TR-02102-Detail respektiert die in Custody V1.0 §10 line 176 etablierte Trennung („Custody-Modell trifft keine Aussage zu Algorithmen, Modi, Cipher Suites, Schlüssellängen oder TLS-Parametern; diese verbleiben dem TR-02102-Detail-Artefakt"). TR-02102-Detail trifft seinerseits **keine** Custody-Topologie-Aussage. Bei Konflikt gilt Custody V1.0 für Custody-Boundaries. |
| **Schlüsselverwaltungs-Boundary** | Custody V1.0 §6/§7/§8 (Storage-vs-Key-Access, mandantenscharfe Segregation, Lebenszyklus-Topoi) bleiben unberührt. TR-02102-Detail liefert ausschließlich Familien-Orientierung; die Anwendung dieser Familien innerhalb der Custody-Boundary entscheidet das Custody-Modell V1.0 + KMS-/HSM-/Implementations-Folgeartefakt. |
| **Crypto-Shredding** | TR-02102-Detail trifft **keine** Aussage zur rechtlichen Würdigung von Crypto-Shredding (Custody V1.0 §9, Lösch-/Sperrkonzept V1.0 §9, Open-Question-Datei). |

---

## 9. Verhältnis zu ASVS-Control-Referenz V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Strikte Trennung** | ASVS-Control-Referenz und TR-02102-Detail sind in Security V1.0 §17 (Zeile 253 vs. 254), Custody V1.0 §15 (Zeile 291 vs. 292) und ASVS V1.0 §8 lines 141–147 als getrennte Folgeartefakte verankert. Eine Verschmelzung ist auf Boundary-Ebene ausgeschlossen. |
| **Kryptographie-Verweisbereich (ASVS V1.0 §6, §10)** | ASVS V1.0 verweist auf TR-02102-Detail; TR-02102-Detail liefert die Familien-Orientierung, aber **keine** ASVS-Kontroll-Adresse. ASVS-Mapping-Adressen `v5.0.0-X.Y.Z` verbleiben ausschließlich in ASVS-Control-Referenz V1.0. |
| **Kommunikations-/Transport-Verweisbereich (ASVS V1.0 §6, §10)** | TLS-Familien-Orientierung verbleibt in TR-02102-Detail; ASVS-Mapping-Adressen verbleiben in ASVS V1.0. |
| **Anti-Verifikations-/Anti-Zertifizierungs-Konsistenz** | TR-02102-Detail spiegelt die in ASVS V1.0 §1 / §4 / §10 / STOPs 12.1–12.5 etablierte Anti-Verifikations-/Anti-Zertifizierungs-Wortwahl. |

---

## 10. Verhältnis zu KMS-/HSM-/Implementations-Folgeartefakt

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | TR-02102-Detail ≠ KMS-/HSM-/Implementations-Folgeartefakt. TR-02102-Detail liefert paraphrasierte Familien-Orientierung; das KMS-/HSM-/Implementations-Folgeartefakt operationalisiert konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Rotations-/Vernichtungs-/Wiederherstellungs-Mechanik. |
| **Voraussetzungs-Kette** | Custody-Modell V1.0 ist Voraussetzung für das KMS-/HSM-/Implementations-Folgeartefakt; TR-02102-Detail kann als parallele Boundary-Quelle herangezogen werden, ohne KMS-/HSM-Topologie zu präjudizieren. |
| **Werkzeug-/Anbieter-Auswahl** | TR-02102-Detail trifft **keine** Werkzeug-/Anbieter-/Hardware-/Cloud-/Bibliotheks-Wahl; diese verbleibt strikt dem KMS-/HSM-/Implementations-Folgeartefakt nach externer sicherheitsfachlicher Prüfung. |

---

## 11. Verhältnis zu DR-/HA-/BCM

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | TR-02102-Detail ≠ DR-/HA-/BCM. F3-D2 (DR/Restore) bleibt autoritativ. TR-02102-Detail trifft keine RPO/RTO-Aussage und keinen Restore-Mechanismus. |
| **Restore-Schlüssel-Boundary** | Das in F3-D2 und Security V1.0 §10 verankerte Verbot des Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Restore bleibt unberührt; TR-02102-Detail liefert keine Mechanik, die diese Boundary umgehen könnte. |

---

## 12. Verhältnis zu Z3-/Datenüberlassung

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | TR-02102-Detail ≠ Z3-/Datenüberlassungs-Format. F3-D1 bleibt autoritativ. TR-02102-Detail trifft keine Z3-Format-Aussage und keinen Behörden-Auslieferungs-Workflow. |
| **Plaintext-Boundary** | Das in F3-D1 und Security V1.0 §9 verankerte Verbot der Plaintext-Beschaffung durch Plattform-Administration über Z3-Pfade bleibt unberührt. |

---

## 13. Verhältnis zu Migration

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Trennlinie** | TR-02102-Detail ≠ Migrations-Implementierung. F3-D3 bleibt autoritativ. TR-02102-Detail trifft keine Migrations-Mechanik-Aussage. |
| **Algorithmen-Lebenszyklus vs. Daten-Migration** | Die in §5 dieses Artefakts erwähnte Algorithmen-Lebenszyklus-Orientierung betrifft Quell-Orientierung gemäß BSI TR-02102-1; sie ist **nicht** zu verwechseln mit Daten-Migration im Sinne F3-D3. Eine Daten-Migration verbleibt strikt im Migrations-Folgeartefakt. |
| **Plattform-Admin-Boundary** | Das in F3-D3 verankerte Verbot des Schlüssel-/Plaintext-/Mandantendaten-Zugriffs durch Plattform-Administration in Migrations-Pfaden bleibt unberührt. |

---

## 14. Verhältnis zu Crypto-Shredding rechtliche Einordnung

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Keine rechtliche Würdigung** | TR-02102-Detail trifft **keine** rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17 oder Art. 18; diese verbleibt der externen Rechtsfrage gemäß `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (Status 🔴 offen). |
| **Keine Umgehung gesetzlicher Aufbewahrungspflichten** | Krypto-Familien-Orientierung in V1.0 dieses Artefakts darf nicht zur Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 ausgelegt werden (Konsistenz mit Lösch-/Sperrkonzept V1.0 §9 und Custody V1.0 §9). |
| **Downstream-Bedingung** | Eine produktive Anwendung von Crypto-Shredding bleibt downstream-bedingt; TR-02102-Detail ist **keine** Boundary-Voraussetzung für die Rechtsfrage und auch **keine** Lösung der Rechtsfrage. |

---

## 15. Verhältnis zu gesperrten Harouda-Boundaries

Das TR-02102-Detail-Artefakt wahrt strikt:

| Lock | Wahrung in TR-02102-Detail |
|---|---|
| **F0-D4 Festschreibung** | Krypto-/Transport-Orientierung erzeugt, ändert oder entfernt keine Festschreibungs-Tatsache. F0-D4 bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Krypto-/Transport-Orientierung wahrt die Mandantentrennung; mandantenübergreifende Krypto-Aussagen sind ausgeschlossen. F0-D6 bleibt autoritativ. |
| **F0-D7 Plattform-Admin-Grenze** | Krypto-/Transport-Orientierung behandelt Plattform-Administration ausschließlich als rein technische Rolle ohne fachlichen Superuser. F0-D7 bleibt autoritativ. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Krypto-/Transport-Orientierung erzeugt, ändert oder überschreibt keine USt-Werte. F1-D1/F1-D2 bleiben autoritative USt-Wahrheitsquelle. |
| **F3-D1 Z3-/Datenüberlassung** | Krypto-/Transport-Orientierung berührt keinen Z3-Export-Pfad und keine Plaintext-Beschaffung. F3-D1 bleibt autoritativ. |
| **F3-D2 DR/Restore** | Krypto-/Transport-Orientierung berührt kein DR-Backup-Modell und kein Restore-Verfahren. F3-D2 bleibt autoritativ. |
| **F3-D3 Migration** | Krypto-/Transport-Orientierung berührt keine Migrations-Mechanik. F3-D3 bleibt autoritativ. |
| **F3-Closing** | TR-02102-Detail respektiert die F3-Closing-Boundaries: Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail. F3-Closing bleibt autoritativ. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. V1.0 dieses Artefakts wirkt nicht auf den Locked Decisions Register zurück.

---

## 16. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 16.1 | V1.0 dieses Artefakts behauptet BSI-Konformität, TR-02102-Konformität, TR-02102-Erfüllung, BSI-Zertifizierung, ein Audit-Ergebnis oder eine Konformitäts-Bestätigung. |
| 16.2 | V1.0 dieses Artefakts verwendet standalone Konformitäts-Schlagwörter oder freistehende Zertifikats-/Erfüllungs-Behauptungen gegenüber BSI- oder TR-02102-Vorgaben. |
| 16.3 | V1.0 dieses Artefakts verwendet generische Transport-Sicherheits-Behauptungen oder vergleichbare freistehende Sicherheits-Aussagen. |
| 16.4 | V1.0 dieses Artefakts führt BSI TR-03116, BSI IT-Grundschutz oder eine andere nicht in Security V1.0 §3 oder Custody V1.0 §3 paraphrasierte Quelle als Lock-Quelle ein. |
| 16.5 | V1.0 dieses Artefakts trifft eine Anbieter-, Werkzeug-, Bibliotheks-, Plattform-, Produkt-, Cloud-, Region-, Modell- oder Hardware-Wahl. |
| 16.6 | V1.0 dieses Artefakts trifft eine KMS-/HSM-Modell-/Topologie-Wahl, eine Schlüsselhierarchie- oder Schutzdomänen-Architektur-Entscheidung. |
| 16.7 | V1.0 dieses Artefakts entwirft eine Custody-Topologie, DEK/KEK-Hierarchie, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey-Schemata, konkrete Rotations-/Zerstörungs-/Wiederherstellungs-Mechanik oder Grace-Periods. |
| 16.8 | V1.0 dieses Artefakts enthält Implementierung, Datenmodell, Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definition, Test-Cases, Test-Methodik, CI/CD-Scanner-Setup oder konkrete Konfigurations-Werte. |
| 16.9 | V1.0 dieses Artefakts verschmilzt TR-02102-Detail mit ASVS-Control-Referenz, Custody-Modell, KMS-/HSM-/Implementations-Folgeartefakt, DR-/HA-/BCM, Z3-/Datenüberlassung, Migration oder Crypto-Shredding-Rechtsfrage. |
| 16.10 | V1.0 dieses Artefakts trifft eine rechtliche, steuerfachliche, DSB-, Aufsichts-, Sicherheits-, Zertifizierungs-, Audit- oder Produktivfreigabe, die nicht tatsächlich vorliegt. |
| 16.11 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder behauptet eine §6-Sortierungsmarker-Verankerung, die nicht existiert. |
| 16.12 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 16.13 | V1.0 dieses Artefakts schwächt, umdeutet oder umgeht F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 16.14 | V1.0 dieses Artefakts erhöht die Forbidden-Reference-Baseline (BLOCKED ≠ 0 oder BASELINE_ALLOWED ≠ 62; ALLOW_MARKED ≠ 0) oder verletzt die etablierten Terminologie- und Quality-Gate-Vorgaben des Repositorys (verbotene Tool-/Modell-/Anbieter-Begriffe, BOM, Arabisch, obsolete Sortierungsbezeichnung, generische Sicherheits-/Transport-Behauptungen, freistehende Konformitäts-Schlagwörter, Zertifizierungs- oder Marketing-Aussagen). |
| 16.15 | V1.0 dieses Artefakts importiert Originaltext aus BSI TR-02102-1 oder TR-02102-2 wörtlich oder browst externe Webseiten, statt sich auf die in Security V1.0 §3, Custody V1.0 §3 und ASVS V1.0 §3 paraphrasierten Anker zu stützen. |
| 16.16 | V1.0 dieses Artefakts nimmt eine Crypto-Shredding-Rechtswürdigung vor oder schlägt eine Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 vor. |

---

## 17. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Implementierung jeglicher Art,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode, Pseudocode, Algorithmus-Design,
- SQL und Query-Spezifikation,
- API-Definitionen,
- automatische Jobs (Scheduler, Trigger, Pipelines),
- Test-Cases, Test-Methodik, CI/CD-Scanner-Setup, Werkzeug-Konfiguration,
- konkrete Algorithmen-Auswahl, konkrete Modi, konkrete Cipher Suites, konkrete TLS-Versions-Auswahl, konkrete Schlüssellängen-Werte, konkrete kryptographische Parameter,
- Anbieter-, Werkzeug-, Bibliotheks-, Plattform-, Produkt-, Cloud-, Region-, Modell- oder Hardware-Wahl,
- KMS-/HSM-Modellwahl, Schutzdomänen-Architektur, Schlüsselverwaltungs-Topologie,
- Custody-Topologie, Schlüsselhierarchie, DEK/KEK, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey,
- Schlüsselrotations-/Schlüsselzerstörungs-/Schlüsselwiederherstellungs-Mechanik, Grace-Periods, Audit-Log-Schema,
- ASVS-Verifikation, ASVS-Zertifizierung, ASVS-Konformitäts-Behauptung, ASVS-Audit-Ergebnis, ASVS-Stufen-Selbstzuschreibung, ASVS-Control-Mapping,
- BSI-Konformität, TR-02102-Erfüllung, BSI-Zertifizierung, BSI-Audit-Ergebnis, IT-Grundschutz-Bezug, TR-03116-Bezug,
- DR-/HA-/BCM-Design,
- Z3-/Datenüberlassungs-Format,
- Migrations-Implementierung,
- Incident-Response-Runbook,
- rechtliche Würdigung von Crypto-Shredding,
- Endfassung Verfahrensdokumentation Kap. 5,
- Rechtsgutachten, Steuerauskunft, DSB-Freigabe, Sicherheitsfreigabe, Produktivfreigabe,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung und keine BSI-bezogene formale Prüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; keine konkreten kryptographischen Parameter; keine Anbieter-, Werkzeug-, Bibliotheks-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; kein Z3-/Datenüberlassungs-Format; kein Incident-Response-Runbook; keine BSI-Konformitäts-, TR-02102-Erfüllungs-, ASVS-Verifikations-, ASVS-Zertifizierungs-, Audit- oder Sign-off-Aussage; keine Implementierungs-Autorisierung jeglicher Art; keine Rechts- oder Steuerauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 18. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **Spätere Versions-Pflege dieses Artefakts** — Befüllung der Familien-Orientierungs-Tabellen mit konkreteren Quell-Paraphrasen je TR-02102-Stand; separat zu autorisieren; ohne Konformitäts-Anspruch und ohne Implementierungsregel.
- **KMS-/HSM-/Implementations-Folgeartefakt** — konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-/Wiederherstellungs-Mechanik; setzt Custody-Modell-Boundary-Lock und externe sicherheitsfachliche Prüfung voraus.
- **ASVS-Control-Referenz V1.0 — Befüllungs-Pflege der `v5.0.0-X.Y.Z`-Indizes** — separat zu autorisieren; ohne Konformitäts-/Verifikations-Anspruch.
- **DR-/HA-/BCM-Folgeartefakt** — RPO/RTO, Restore-Modi, near-zero Ziele; bleibt strikt von TR-02102-Detail getrennt; respektiert F3-D2.
- **Z3-/Datenüberlassungs-Spezifikations-Artefakt** — Behörden-Auslieferungs-Format; respektiert F3-D1; bleibt strikt von TR-02102-Detail getrennt.
- **Migrations-Folgeartefakt** — Migrations-Mechanik; respektiert F3-D3; bleibt strikt von TR-02102-Detail getrennt.
- **Crypto-Shredding rechtliche Einordnung** — externe Fachanwalts-/DSB-Prüfung der Einordnung unter DSGVO Art. 17 / Art. 18; vorhanden als Open-Question-Datei `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34; nicht Bestandteil dieses Artefakts.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Ransomware-/Forensik-Workflow; nicht Bestandteil dieses Artefakts.
- **Verfahrensdokumentation Kap. 5 (nächste Pflege)** — Aufnahme dieses Artefakts und der vorgelagerten V1.0-Lock-Artefakte (Security, Custody, ASVS) per Verweis als vorgelagerte Spezifikationen.

---

## 19. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für die paraphrasierte Krypto- und Transport-Orientierung in Harouda. Maßgeblich als Eingangsgröße für KMS-/HSM-/Implementations-Folgeartefakt sowie als Trennlinie gegenüber Custody-Modell V1.0 und ASVS-Control-Referenz V1.0. Maßgeblich für die Bezugnahme aus Verfahrensdokumentation Kap. 5 (im Rahmen ihrer nächsten Pflege). |
| **Bindend für** | Alle in §18 genannten Folgeartefakte, soweit sie auf Krypto- oder Transport-Orientierung aufsetzen; Verfahrensdokumentation Kap. 5 (nächste Pflege); alle nachgelagerten Detail-Artefakte zu Krypto-, TLS- und Schlüsselverwaltungs-Themen, soweit sie eine Quell-Orientierung benötigen. |
| **Nicht bindend für** | Konkrete Algorithmen-/Modi-/Cipher-Suite-/TLS-Versions-/Schlüssellängen-Auswahl. Konkrete Custody-Topologie. Konkrete KMS-/HSM-Modellwahl. Anbieter-/Werkzeug-/Bibliotheks-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl. ASVS-Verifikation oder ASVS-Mapping-Adressen. DR-/HA-/BCM-Design. Z3-/Datenüberlassungs-Format. Migrations-Implementierung. Crypto-Shredding-Rechtsfrage. Endfassung Verfahrensdokumentation Kap. 5. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. BSI-Konformitäts-Aussage. |
| **STOP-Bedingungen** | **16** nummerierte STOP-Bedingungen (16.1 bis 16.16) gemäß §16. |
| **Boundaries** | TR-02102-Detail ≠ Implementierung. TR-02102-Detail ≠ BSI-Konformität. TR-02102-Detail ≠ Zertifizierung. TR-02102-Detail ≠ ASVS-Verifikation. TR-02102-Detail ≠ Custody-Topologie. TR-02102-Detail ≠ KMS-/HSM-Implementierung. TR-02102-Detail ≠ Anbieter-/Werkzeug-/Bibliotheks-Wahl. TR-02102-Detail ≠ rechtliche/sicherheitsfachliche/produktbezogene Freigabe. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. Crypto-Shredding bleibt downstream-bedingt; keine eigene rechtliche Würdigung in V1.0. |
| **Quellgrundlage** | BSI TR-02102-1, Version 2026-01 (Krypto-Orientierung; kein Konformitätsanspruch); BSI TR-02102-2, Version 2026-01 (Transport-Boundary-Orientierung; kein Konformitätsanspruch); Security-/Krypto-/Key-Custody-Artefakt V1.0 §3, §7, §15, §17; Custody-Modell-Boundary-Artefakt V1.0 §3, §10, §15, §16; ASVS-Control-Referenz-Artefakt V1.0 §6, §8, §10, §14, §15; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. BSI TR-03116 und BSI IT-Grundschutz sind ausdrücklich **keine** Lock-Quelle (Security V1.0 §3 / §15). |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle (BSI TR-02102-1 / TR-02102-2 Version 2026-01) gilt die amtliche Quelle. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Krypto-/Sicherheits-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. Bei Konflikt mit ASVS V1.0 gilt ASVS V1.0 für ASVS-Mapping-Schnittstellen. |
| **Verankerungs-Hinweis** | Das TR-02102-Detail-Artefakt ist im Locked Decisions Register V1.0 §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Es figuriert dort innerhalb des Sortierungsmarker-A-Komplexes Security/Krypto/Key-Custody. Bindungsgrundlage leitet sich ausschließlich ab aus Security V1.0 §7 / §15 / §17, Custody V1.0 §3 / §10 / §15 / §16 und ASVS V1.0 §6 / §8 / §10 / §14 / §15. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Lock-Aussage** | TR-02102-Detail-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Keine BSI-Konformität, keine TR-02102-Erfüllung, keine Zertifizierung, kein Audit-Ergebnis, keine Sicherheits- oder Produktivfreigabe. Eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) und eine externe rechtliche Prüfung bleiben vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. |

---

## 20. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der Krypto- und Transport-Orientierungs-Anker aus Security V1.0 §7 / §15 / §17, Custody V1.0 §3 / §10 / §15 / §16 und ASVS V1.0 §6 / §8 / §10 / §14 / §15 | in V1.0 enthalten |
| Internal Review Patch | Schärfung der Anti-Konformitäts-/Anti-Erfüllungs-Wortwahl gemäß Security V1.0 Versionshinweis Micro-Patch R0.1; Klarstellung der strikten Trennung gegenüber ASVS-Control-Referenz V1.0 und Custody-Modell V1.0; Klarstellung des Verankerungs-Hinweises gegenüber dem Locked Decisions Register; Ausdrückliche Aufnahme von BSI TR-03116 und BSI IT-Grundschutz in die Negativ-Quellgrundlage | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen — insbesondere die Befüllung der Familien-Orientierung mit konkreteren Quell-Paraphrasen — erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf die dann aktuelle Version BSI TR-02102-1 und BSI TR-02102-2 sowie ohne Einführung neuer externer Quellen über die in Security V1.0 §3, Custody V1.0 §3 und ASVS V1.0 §3 bereits paraphrasierten hinaus. Eine externe sicherheitsfachliche Validierung (Krypto-/Sicherheits-Spezialist) und eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig.
