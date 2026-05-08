# ASVS-Control-Referenz-Artefakt — V1.0

**Lock-Aussage:** ASVS-Control-Referenz-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene. V1.0 erhebt **keinen** Anspruch auf ASVS-Verifikation, **keinen** Anspruch auf ASVS-Zertifizierung, **keinen** Anspruch auf ASVS-Konformität, **keinen** Anspruch auf ein Audit-Ergebnis und **keinen** Anspruch auf Produktivfreigabe. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe und **keine** Sicherheitsfreigabe. Eine ASVS-bezogene formale Prüfung ist eigenständig zu organisieren. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | ASVS-Control-Referenz-Artefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe; **keine** ASVS-Verifikations-, ASVS-Zertifizierungs- oder ASVS-Konformitäts-Behauptung |
| Zweck | Festlegung der Boundary-Aussagen für die kontrollbasierte Referenzierung von OWASP ASVS 5.0.0 als „ASVS-Zielprofil" für Harouda; Bereitstellung einer Mapping-Tabelle auf Boundary-Ebene zwischen ASVS-Referenzbereichen und gesperrten Harouda-Boundaries; konsistente Wahrung der in Security V1.0 §8 etablierten Format-Vorgabe `v5.0.0-X.Y.Z` und der Anti-Verifikations-/Anti-Zertifizierungs-Wortwahl |
| Scope | Boundary-Aussagen zu: ASVS-Zielprofil-Charakter; kontrollbasierter Referenzierungsformat `v5.0.0-X.Y.Z`; Boundary-Cluster (Authentifizierung/Session, Autorisierung, Mandantentrennung, Plattform-Admin-Grenze, Vertrauliche Datenbehandlung, Kryptographie-Verweisbereich, Kommunikations-/Transport-Verweisbereich, Logging-/Audit-Verweisbereich, Konfigurations-Boundary, Validierungs-/Eingabe-Boundary, Fehler-/Ausnahmebehandlung auf Boundary-Ebene); Trennlinie gegenüber TR-02102-Detail-Folgeartefakt; Cross-Boundary-Konsistenz mit Security V1.0, Custody V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0 und Retention V1.0 sowie mit gesperrten Harouda-Locks |
| Non-Scope | ASVS-Verifikation, ASVS-Zertifizierung, ASVS-Konformitätsbehauptung, ASVS-Audit-Ergebnis, ASVS-Level-Selbstzuschreibung; Penetrations-Tests; Test-Cases; Test-Methodik; CI/CD-Scanner-Setup; Werkzeug-Konfiguration; Implementierung; Datenmodell/Schema; UI/UX; Programmcode; Pseudocode; Algorithmus-Design; SQL und Query-Spezifikation; APIs; konkrete Krypto-Algorithmen, Modi, Cipher Suites, TLS-Parameter und Schlüssellängen (verbleiben TR-02102-Detail-Folgeartefakt); Custody-Topologie und KMS-/HSM-Modellwahl (verbleiben Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt); Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl; Rechtsgutachten; Steuerauskunft; DSB-/Sicherheits-/Produktivfreigabe; Endfassung Verfahrensdokumentation Kap. 5; Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Security-/Krypto-/Key-Custody-Artefakt V1.0 (direkte Quelle: §8 OWASP ASVS Boundary; §17 Auftrag „ASVS-Control-Referenz-Artefakt"); Custody-Modell-Boundary-Artefakt V1.0 (§3 Source Basis; §10 Verhältnis ASVS-Control-Referenz; §15 Downstream Artefakte; §16 V1.0 Lock-Profil); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit Security V1.0 gilt Security V1.0 für ASVS-Zielprofil-/Krypto-/Sicherheits-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Test-Aktivität, keine Verifikations-Aktivität, keine Beschaffung, keine Werkzeug-/Tool-/Anbieter-Wahl. |

**Wichtiger Hinweis zur Verankerung:** Das ASVS-Control-Referenz-Artefakt ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Es figuriert dort innerhalb des Sortierungsmarker-A-Komplexes „Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze". Die Bindungsgrundlage dieses Artefakts leitet sich ausschließlich ab aus:
- Security-/Krypto-/Key-Custody-Artefakt V1.0 §8 (OWASP ASVS Boundary) und §17 (Downstream-Auftrag „ASVS-Control-Referenz-Artefakt"),
- Custody-Modell-Boundary-Artefakt V1.0 §10 (Verhältnis ASVS-Control-Referenz), §15 (Downstream Artefakte) und §16 (V1.0 Lock-Profil).

V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht** und behauptet **keine** Register-Verankerung, die nicht existiert.

---

## 2. Zweck und fachliche Rolle

Das ASVS-Control-Referenz-Artefakt definiert die fachlichen Boundary-Grenzen für:

- die **kontrollbasierte Referenzierung** von OWASP ASVS 5.0.0 im Sinne des in Security V1.0 §8 etablierten „ASVS-Zielprofils",
- die **Format-Vorgabe** `v5.0.0-X.Y.Z` für Kontroll-Adressen (Major-/Minor-/Patch-Indizes gemäß ASVS-Strukturierung),
- die **Mapping-Boundary** zwischen ASVS-Referenzbereichen und Harouda-Boundary-Aussagen aus den gelockten V1.0-Specs,
- die **strikte Trennung** gegenüber TR-02102-Detail-Folgeartefakt (Algorithmik dort),
- die **strikte Trennung** gegenüber Custody-Modell V1.0 (Schlüsselverwaltungs-Topologie dort),
- die **Cross-Cutting-Konsistenz** mit gesperrten Harouda-Locks und mit Security V1.0, Custody V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0 und Retention V1.0.

Das ASVS-Control-Referenz-Artefakt ist ein **internes Boundary-/Spec-Lock**. Es liefert eine Boundary-Mapping-Tabelle, **trifft jedoch selbst keine** Verifikations-, Zertifikats-, Audit-, Konformitäts-, Test-, Werkzeug- oder Implementierungs-Entscheidung.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- die formale ASVS-Verifikation oder ASVS-Stufen-Selbstzuschreibung (L1/L2/L3 erreicht),
- die ASVS-Zertifizierung,
- ein ASVS-Audit-Ergebnis,
- konkrete Test-Cases oder Test-Methodik,
- Penetrations-Tests, Pen-Test-Scope, automatische Scanner-Konfiguration,
- die Endfassung der Verfahrensdokumentation Kap. 5,
- konkrete Krypto-Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen (verbleiben TR-02102-Detail-Folgeartefakt),
- die konkrete Custody-Topologie, KMS-/HSM-Modellwahl, Schlüsselhierarchie (verbleiben Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt),
- die Anbieter-/Werkzeug-/Plattform-/Hardware-/Cloud-/Modell-Wahl.

Eine ASVS-bezogene formale Prüfung ist eigenständig zu organisieren und liegt **außerhalb** dieses Artefakts. Eine externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung **erforderlich**.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext wird nicht übernommen. V1.0 dieses Artefakts erzeugt **keine** eigenen externen Quellen über die in Security V1.0 §3 und Custody V1.0 §3 bereits paraphrasierten hinaus.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| OWASP ASVS 5.0.0 | Application Security Verification Standard; öffentliche, stabile Referenz für sicherheitsfunktionale Kontroll-Adressen | **ASVS-Zielprofil**; **kontrollbasierte Referenzierung**; **keine** Verifikations- oder Zertifizierungs-Behauptung |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | §8 OWASP ASVS Boundary (Zielprofil-Wortwahl, Format `v5.0.0-X.Y.Z`, kein Verifikations-Anspruch); §17 Downstream-Auftrag „ASVS-Control-Referenz-Artefakt — vollständige Kontroll-Mapping-Tabelle im Format `v5.0.0-X.Y.Z`" | **Direkte Lock-Basis** |
| Custody-Modell-Boundary-Artefakt V1.0 | §3 (OWASP ASVS 5.0.0 als ASVS-Zielprofil ohne Verifikations-/Zertifizierungs-Behauptung); §10 Verhältnis ASVS-Control-Referenz; §15 Downstream-Auftrag „ASVS-Control-Referenz-Artefakt — vollständige Kontroll-Mapping-Tabelle im Format `v5.0.0-X.Y.Z` ohne Verifikations-Anspruch" | **Direkte Lock-Basis** |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | Cross-Boundary-Konsistenz für aufbewahrungsbezogene Mapping-Bezüge | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Lösch-/Sperrkonzept-Artefakt V1.0 | Cross-Boundary-Konsistenz für Lösch-/Sperr-bezogene Mapping-Bezüge | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | Cross-Boundary-Konsistenz für Klassifikations-bezogene Mapping-Bezüge | Indirekte Lock-Basis (Cross-Boundary-Wahrung) |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung), F0-D6 (Mandantentrennung), F0-D7 (Plattform-Admin-Grenze), F1-D1/F1-D2 (USt-Wahrheit), F3-D1 (Z3-Export), F3-D2 (DR/Restore), F3-D3 (Migration), F3-Closing | Autoritative Boundary-Quellen; bei Konflikt vorrangig |

V1.0 dieses Artefakts greift **nicht** auf externe Webseiten zu, importiert **keinen** Originaltext aus ASVS, BSI-Quellen oder anderen externen Standards und führt **keine** über die o. g. paraphrasierten Anker hinausgehenden Quellen ein.

---

## 4. Core ASVS-Control-Boundaries

Auf Boundary-Ebene gelten:

- **ASVS-Control-Referenz ≠ Verifikation.** V1.0 trifft **keine** Verifikations-Aussage und ersetzt keine ASVS-bezogene formale Prüfung.
- **ASVS-Control-Referenz ≠ Zertifizierung.** V1.0 behauptet keine ASVS-Zertifizierung und keine Konformitäts-Bestätigung; produktbezogene Zertifizierungs- oder Marketing-Behauptungen sind ausgeschlossen.
- **ASVS-Control-Referenz ≠ Audit-Ergebnis.** V1.0 stellt kein Audit-Ergebnis dar; ein Audit ist eigenständig zu organisieren.
- **ASVS-Control-Referenz ≠ Implementierung.** V1.0 enthält keine Implementierung, kein Datenmodell, kein Schema, kein UI-/UX-Verhalten, keinen Programmcode, keinen Pseudocode, kein Algorithmus-Design, kein SQL und keine API-Definition.
- **ASVS-Control-Referenz ≠ Security-Freigabe.** V1.0 erteilt keine Sicherheitsfreigabe und keine produktbezogene Konformitätsprüfung.
- **ASVS-Control-Referenz ≠ Produktivfreigabe.** V1.0 autorisiert keinen Produktivbetrieb.
- **ASVS-Control-Referenz ≠ TR-02102-Detail.** Konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter und Schlüssellängen verbleiben dem TR-02102-Detail-Folgeartefakt.
- **Format-Lock.** Sämtliche Kontroll-Adressen werden ausschließlich im Format-Stil `v5.0.0-X.Y.Z` (Major-/Minor-/Patch-Indizes gemäß ASVS-Strukturierung) referenziert; ein Abweichen vom Format ist auf Boundary-Ebene **ausgeschlossen**.
- **Keine erfundenen Kontroll-Nummern.** Da V1.0 dieses Artefakts keine externen Quellen importiert, werden keine konkreten Kontroll-Nummern festgelegt; die Mapping-Tabelle (§10) verwendet ausschließlich die Platzhalterform `v5.0.0-X.Y.Z`.
- **Keine ASVS-Stufen-Selbstzuschreibung.** Aussagen wie „Level 1 erreicht", „L2-konform", „L3-zertifiziert" oder vergleichbar sind ausgeschlossen.
- **Cross-Cutting-Boundary-Wahrung.** Jede Mapping-Aussage muss F0-D4, F0-D6, F0-D7, F1-D1/F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing wahren.
- **§28.11-bet bleibt unverändert/offen.** V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht.

V1.0 trifft **keine** Aussage über konkrete Verifikations-, Test- oder Implementierungs-Mechanismen, Werkzeuge, Hersteller, Cloud-Regionen, Hardware-Familien oder Konfigurationswerte.

---

## 5. Kontroll-Mapping-Format

Das Mapping-Format folgt der in Security V1.0 §8 verankerten Vorgabe:

- **Format-Stil:** `v5.0.0-X.Y.Z`
- **Bedeutung:** Kontroll-Adresse mit **Major-/Minor-/Patch-Indizes** gemäß ASVS-Strukturierung.
- **Verwendung in V1.0 dieses Artefakts:** Ausschließlich als **Platzhalter-Form** `v5.0.0-X.Y.Z`. Konkrete Indizes werden in V1.0 dieses Artefakts **nicht** befüllt; sie werden in einer separat zu autorisierenden späteren Detail-Pflege ergänzt, sobald eine Quell-Verifikation gegen OWASP ASVS 5.0.0 (öffentlich, stabil) eigenständig organisiert ist und ohne Einführung neuer Quellen über die bereits in Security V1.0 §3 und Custody V1.0 §3 paraphrasierten hinaus.
- **Format-Disziplin:** Abweichungen vom Format-Stil (z. B. „L1.X.Y", „ASVS-1.2.3", „v5-X-Y-Z", „Anforderung X.Y") sind auf Boundary-Ebene ausgeschlossen.
- **Kontroll-Nummern-Disziplin:** V1.0 dieses Artefakts erfindet keine Kontroll-Nummern und übernimmt keine konkreten Kontroll-Indizes ohne separat-autorisierte Quell-Verifikation.

---

## 6. ASVS-Zielprofil-Cluster

Auf Boundary-Ebene werden folgende **ASVS-Referenzbereiche** als Zielprofil-Cluster anerkannt. Die Cluster sind **fachliche Boundary-Bezüge**, **keine** ASVS-Originaltext-Wiedergaben und **keine** Verifikations-Stand-Aussagen.

- **Authentifizierung / Session-Bezug** — Boundary-Bezug zu F0-D7 (Plattform-Admin-Grenze) und Custody V1.0 §5 (Plattform-Admin-/Plaintext-Boundary).
- **Autorisierung / Zugriffskontrolle** — Boundary-Bezug zu F0-D6 (Mandantentrennung) und F0-D7 sowie zu Custody V1.0 §6/§7.
- **Mandantentrennung** — Boundary-Bezug zu F0-D6 als unverhandelbarer Lock; Cross-Cutting zu Retention V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Custody V1.0.
- **Plattform-Admin-Grenze** — Boundary-Bezug zu F0-D7 als rein technische Rolle; Konsistenz mit Security V1.0 §9 und Custody V1.0 §5.
- **Vertrauliche Datenbehandlung** — Boundary-Bezug zu Custody V1.0 §6 (Storage-vs-Key-Access) und Retention V1.0 §11.
- **Kryptographie-Verweisbereich** — **ausschließlich** als Boundary-Verweis auf TR-02102-Detail-Folgeartefakt; Custody V1.0 §3 für Schlüsselverwaltungs-Boundary; Security V1.0 §7 für Krypto-Orientierung.
- **Kommunikations-/Transport-Verweisbereich** — Boundary-Verweis auf TR-02102-Detail-Folgeartefakt für TLS-Parameter; Security V1.0 §7 für Transport-Boundary-Orientierung.
- **Logging-/Audit-Verweisbereich** — Boundary-Bezug zu Lösch-/Sperrkonzept V1.0 §10, Regelmatrix V1.0 §13, Custody V1.0 §12; konkrete Audit-Schemata sind dort Non-Scope und verbleiben Detail-Folgeartefakten.
- **Konfigurations-Boundary** — Boundary-Bezug auf Verfahrens-Boundaries; konkrete Konfigurationswerte und Vendor-Settings sind Non-Scope.
- **Validierungs-/Eingabe-Boundary** — als reine Boundary-Referenz; ohne Implementierungsregel.
- **Fehler-/Ausnahmebehandlung auf Boundary-Ebene** — als reine Boundary-Referenz; ohne Implementierungsregel und ohne konkrete Fehlerklassen-Festlegung.

V1.0 dieses Artefakts trifft **keine** Aussage über die Mechanik, Reihenfolge oder Vollständigkeit dieser Cluster im Sinne einer ASVS-Verifikations-Aktivität.

---

## 7. Verhältnis zu Security V1.0 und Custody V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **ASVS-Control-Referenz → Security V1.0** | ASVS-Control-Referenz konkretisiert die in Security V1.0 §8 angelegte ASVS-Boundary auf Mapping-Tabellen-Ebene. Es führt **keine** ASVS-bezogene Quelle ein, die nicht in Security V1.0 §3 oder §8 bereits paraphrasiert ist. Bei Konflikt gilt Security V1.0. |
| **ASVS-Control-Referenz → Custody V1.0** | ASVS-Control-Referenz hält die in Custody V1.0 §10 verankerte Trennung („Custody-Modell verweist nur auf ASVS-Zielprofil; konkrete Kontroll-Adressen `v5.0.0-X.Y.Z` verbleiben dem ASVS-Control-Referenz-Artefakt") strikt ein. Bei Konflikt gilt Custody V1.0 für Custody-Boundaries. |
| **ASVS-Control-Referenz ↔ ASVS-Verifikations-Aktivität** | Eine ASVS-Verifikations-Aktivität, ASVS-Stufen-Bewertung, ASVS-Audit oder ASVS-Konformitäts-Bestätigung ist **eigenständig** zu organisieren; V1.0 dieses Artefakts ersetzt sie **nicht** und nimmt sie **nicht** vorweg. |
| **ASVS-Control-Referenz ↔ Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Retention V1.0** | Cross-Boundary-Konsistenz wird gewahrt; ASVS-Mapping-Bezüge zu Aufbewahrungs-, Lösch-/Sperr- oder Klassifikations-Boundaries respektieren die in den jeweiligen V1.0-Specs gelockten Aussagen, **ohne** sie zu überschreiben oder zu erweitern. |

---

## 8. Verhältnis zu TR-02102-Detail

- **Strikte Trennung.** ASVS-Control-Referenz und TR-02102-Detail-Folgeartefakt sind in Security V1.0 §17 (Zeile 253 vs. Zeile 254) und in Custody V1.0 §15 (Zeile 291 vs. Zeile 292) als **getrennte** Folgeartefakte verankert. Eine Verschmelzung ist auf Boundary-Ebene ausgeschlossen.
- **Algorithmik bleibt TR-02102-Detail.** Konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, Schlüssellängen und kryptographische Parameter werden in V1.0 dieses Artefakts **nicht** behandelt.
- **Kryptographie-Verweisbereich (§6).** Innerhalb des ASVS-Zielprofil-Clusters ist Kryptographie ausschließlich als **Boundary-Verweis** auf TR-02102-Detail-Folgeartefakt zulässig.
- **Kommunikations-/Transport-Verweisbereich (§6).** TLS-Parameter und Cipher Suites sind ausschließlich als **Boundary-Verweis** auf TR-02102-Detail-Folgeartefakt zulässig.
- **Konformität.** V1.0 dieses Artefakts erhebt **keinen** Konformitätsanspruch gegenüber TR-02102 oder ASVS und behauptet keine Erfüllung externer Vorgaben.

---

## 9. Verhältnis zu gesperrten Harouda-Boundaries

Das ASVS-Control-Referenz-Artefakt wahrt strikt:

| Lock | Wahrung in der ASVS-Control-Referenz |
|---|---|
| **F0-D4 Festschreibung** | Mapping-Aussagen erzeugen, ändern oder entfernen keine Festschreibungs-Tatsache. F0-D4 bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Mapping-Aussagen erhalten die Mandantentrennung; mandantenübergreifende Kontroll-Aussagen sind ausgeschlossen. F0-D6 bleibt autoritativ. |
| **F0-D7 Plattform-Admin-Grenze** | Mapping-Aussagen behandeln Plattform-Administration ausschließlich als rein technische Rolle ohne fachlichen Superuser. F0-D7 bleibt autoritativ. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Mapping-Aussagen erzeugen, ändern oder überschreiben keine USt-Werte. F1-D1/F1-D2 bleiben autoritative USt-Wahrheitsquelle. |
| **F3-D1 Z3-/Datenüberlassung** | Mapping-Aussagen berühren keinen Z3-Export-Pfad und keine Plaintext-Beschaffung. F3-D1 bleibt autoritativ. |
| **F3-D2 DR/Restore** | Mapping-Aussagen berühren kein DR-Backup-Modell und kein Restore-Verfahren. F3-D2 bleibt autoritativ. |
| **F3-D3 Migration** | Mapping-Aussagen berühren keine Migrations-Mechanik. F3-D3 bleibt autoritativ. |
| **F3-Closing** | ASVS-Mapping respektiert die F3-Closing-Boundaries: Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz. F3-Closing bleibt autoritativ. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. V1.0 dieses Artefakts wirkt nicht auf den Locked Decisions Register zurück.

---

## 10. Mapping-Tabelle auf Boundary-Ebene

Die Tabelle ist **boundary-level** und **deklarativ**. Sie ersetzt **keine** ASVS-Verifikations-Aktivität. Die Spalte `Kontrolladress-Format` verwendet ausschließlich die Platzhalter-Form `v5.0.0-X.Y.Z`; konkrete Indizes werden in V1.0 dieses Artefakts **nicht** befüllt.

| ASVS-Referenzbereich | Kontrolladress-Format | Harouda-Boundary-Bezug | Zulässige Aussage | Nicht zulässig |
|---|---|---|---|---|
| Authentifizierung / Session-Bezug | `v5.0.0-X.Y.Z` | F0-D7 (Plattform-Admin-Grenze); Custody V1.0 §5 | Boundary-Verweis auf Plattform-Admin-/Plaintext-Trennung | Behauptung ASVS-konform; ASVS-Stufen-Selbstzuschreibung; konkrete Authentifizierungs-Mechanik; Tool-/Vendor-Wahl |
| Autorisierung / Zugriffskontrolle | `v5.0.0-X.Y.Z` | F0-D6 (Mandantentrennung); F0-D7; Custody V1.0 §6/§7 | Boundary-Verweis auf mandantenscharfe Zugriffskontrolle | Konkrete Rollenmatrix-Implementierung; Code; SQL; UI-Labels |
| Mandantentrennung | `v5.0.0-X.Y.Z` | F0-D6 (autoritativ); Cross-Cutting Retention/Lösch-/Sperrkonzept/Regelmatrix/Custody | Boundary-Verweis auf F0-D6-Wahrung | Mandantenübergreifende Kontroll-Aussagen; Schwächung F0-D6 |
| Plattform-Admin-Grenze | `v5.0.0-X.Y.Z` | F0-D7 (autoritativ); Security V1.0 §9; Custody V1.0 §5 | Boundary-Verweis auf F0-D7-Wahrung; rein technische Rolle | Behauptung von Verifikation der Trennungsmechanik; konkrete Vier-Augen-/Geheimnis-Aufteilungs-Mechanik |
| Vertrauliche Datenbehandlung | `v5.0.0-X.Y.Z` | Custody V1.0 §6 (Storage-vs-Key-Access); Retention V1.0 §11 | Boundary-Verweis auf Trennung Speicherzugriff vs. Entschlüsselungs-Fähigkeit | Konkrete Verschlüsselungs-Implementierung; KMS-/HSM-Modellwahl |
| Kryptographie-Verweisbereich | `v5.0.0-X.Y.Z` | Verweis auf TR-02102-Detail-Folgeartefakt; Security V1.0 §7; Custody V1.0 §3 | Reiner Boundary-Verweis | Konkrete Algorithmen, Modi, Cipher Suites, Schlüssellängen; Konformitäts-Behauptung; Verifikations-Behauptung |
| Kommunikations-/Transport-Verweisbereich | `v5.0.0-X.Y.Z` | Verweis auf TR-02102-Detail-Folgeartefakt; Security V1.0 §7 | Reiner Boundary-Verweis auf Transport-Boundary-Orientierung | Konkrete TLS-Parameter; standalone Konformitäts-Schlagwörter; generische Transport-Sicherheits-Behauptungen |
| Logging-/Audit-Verweisbereich | `v5.0.0-X.Y.Z` | Lösch-/Sperrkonzept V1.0 §10; Regelmatrix V1.0 §13; Custody V1.0 §12 | Boundary-Verweis auf Audit-/Nachweis-Boundary; getrennte Audit-Spuren | Konkretes Log-Schema; Datenbank-Bezeichner; Datenmodell; UI-Labels |
| Konfigurations-Boundary | `v5.0.0-X.Y.Z` | Verfahrens-Boundaries; F0-D7 | Boundary-Verweis ohne Werte | Konkrete Konfigurationswerte; Vendor-Settings; Tool-Konfiguration; CI/CD-Scanner-Konfiguration |
| Validierungs-/Eingabe-Boundary | `v5.0.0-X.Y.Z` | Boundary-Verweis ohne Implementierung | Reiner Boundary-Verweis | Konkrete Validierungs-Logik; Code; Pseudocode; Algorithmus-Design |
| Fehler-/Ausnahmebehandlung auf Boundary-Ebene | `v5.0.0-X.Y.Z` | Boundary-Verweis ohne Implementierung | Reiner Boundary-Verweis auf nachvollziehbare Fehlerbehandlung als Boundary-Topik | Konkrete Fehlerklassen; Code-Pfade; Datenmodell-Eingriffe |

**Konsistenzregel:** Sämtliche Mapping-Einträge sind reine Boundary-Verweise ohne Verifikations-, Erfüllungs-, Test- oder Audit-Charakter. Eine Befüllung der `v5.0.0-X.Y.Z`-Platzhalter mit konkreten Indizes erfolgt ausschließlich über einen separat zu autorisierenden Versionsschritt, der die Quell-Verifikation gegen OWASP ASVS 5.0.0 dokumentiert und ohne Einführung neuer Quellen über die in Security V1.0 §3 und Custody V1.0 §3 paraphrasierten hinaus.

---

## 11. Audit-/Nachweis-Boundary

Auf Boundary-Ebene gilt:

- **ASVS-Mapping-Aussagen müssen rekonstruktierbar bleiben.** Jede Mapping-Zuordnung muss sich auf eine in Security V1.0, Custody V1.0 oder den anderen drei gelockten V1.0-Specs vorhandene Boundary zurückführen lassen.
- **Keine Vermischung mit Custody-Audit, Klassifikations-Audit, GoBD-Audit oder Sicherheits-Audit.** ASVS-Mapping-Bezüge sind getrennt von operativen Audit-Spuren zu führen; eine Boundary-Verschmelzung ist ausgeschlossen.
- **Kein Verifikations-Nachweis durch ASVS-Mapping.** Eine ASVS-Mapping-Eintragung ist **kein** Erfüllungs- oder Verifikations-Nachweis.
- **Konkrete Log-Schemata, Datenmodelle, Aufbewahrungsorte oder Werkzeuge** sind **Non-Scope** und werden downstream entschieden.
- **Plaintext-Vermeidung.** ASVS-Mapping-Bezüge dürfen keine Mandanten-Plaintext-Daten exponieren oder implizieren.

---

## 12. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 12.1 | V1.0 dieses Artefakts behauptet ASVS-Konformität, ASVS-Erfüllung, ASVS-Sign-off, ASVS-Bestätigung oder eine ASVS-Compliance-Aussage. |
| 12.2 | V1.0 dieses Artefakts behauptet eine ASVS-Verifikation oder nimmt eine Verifikations-Aktivität als abgeschlossen vorweg. |
| 12.3 | V1.0 dieses Artefakts behauptet eine ASVS-Zertifizierung oder eine vergleichbare Zertifikats-Aussage. |
| 12.4 | V1.0 dieses Artefakts behauptet ein ASVS-Audit-Ergebnis oder den Abschluss einer Audit-Aktivität. |
| 12.5 | V1.0 dieses Artefakts behauptet eine ASVS-Stufen-Selbstzuschreibung („Level 1/2/3 erreicht", „L1/L2/L3-konform" oder vergleichbar). |
| 12.6 | V1.0 dieses Artefakts verschmilzt ASVS-Control-Referenz mit dem TR-02102-Detail-Folgeartefakt oder importiert dessen Inhalte. |
| 12.7 | V1.0 dieses Artefakts nennt konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, Schlüssellängen oder kryptographische Parameter. |
| 12.8 | V1.0 dieses Artefakts enthält Implementierung, Datenmodell, Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definition, Test-Cases oder Test-Methodik. |
| 12.9 | V1.0 dieses Artefakts trifft eine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Region-, Modell- oder Hardware-Wahl oder benennt CI/CD-Scanner-Konfiguration. |
| 12.10 | V1.0 dieses Artefakts schwächt, umdeutet oder umgeht F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 12.11 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder behauptet eine §6-Sortierungsmarker-Verankerung, die nicht existiert. |
| 12.12 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 12.13 | V1.0 dieses Artefakts behauptet eine rechtliche, steuerfachliche, DSB-, Aufsichts-, Sicherheits-, Zertifizierungs- oder Produktivfreigabe, die nicht tatsächlich vorliegt. |
| 12.14 | V1.0 dieses Artefakts erhöht die Forbidden-Reference-Baseline (BLOCKED ≠ 0 oder BASELINE_ALLOWED ≠ 62) oder verletzt die etablierten Terminologie- und Quality-Gate-Vorgaben des Repositorys (verbotene Tool-/Modell-/Anbieter-Begriffe, BOM, Arabisch, obsolete Sortierungsbezeichnung, generische Sicherheits-/Transport-Behauptungen, freistehende Konformitäts-Schlagwörter, Zertifizierungs- oder Marketing-Aussagen). |
| 12.15 | V1.0 dieses Artefakts importiert ASVS-Originaltext wörtlich oder browst externe Webseiten, statt sich auf in Security V1.0 §3 und Custody V1.0 §3 bereits paraphrasierte Anker zu stützen. |
| 12.16 | V1.0 dieses Artefakts fügt externe Quellen hinzu, die nicht in Security V1.0 §3 oder Custody V1.0 §3 bereits paraphrasiert sind, oder erfindet konkrete ASVS-Kontroll-Nummern ohne separat-autorisierte Quell-Verifikation. |

---

## 13. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- ASVS-Verifikation,
- ASVS-Zertifizierung,
- ASVS-Konformitäts-Bestätigung,
- ASVS-Audit-Ergebnis,
- ASVS-Level-Selbstzuschreibung (L1/L2/L3),
- Penetrations-Tests / Pen-Test-Scope,
- Test-Cases,
- Test-Methodik,
- CI/CD-Scanner-Setup,
- Werkzeug-/Tool-Konfiguration,
- Implementierung jeglicher Art,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode, Pseudocode, Algorithmus-Design,
- SQL und Query-Spezifikation,
- API-Definitionen,
- automatische Jobs (Scheduler, Trigger, Pipelines),
- konkrete Krypto-Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen (verbleiben TR-02102-Detail-Folgeartefakt),
- konkrete Custody-Topologie und KMS-/HSM-Modellwahl (verbleiben Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt),
- Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl,
- Endfassung Verfahrensdokumentation Kap. 5,
- Rechtsgutachten oder Steuerauskunft im Einzelfall,
- DSB-, Sicherheits- oder Produktivfreigabe,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung und keine ASVS-bezogene formale Prüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; keine konkreten Krypto- oder Schlüssel-Parameter; keine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; kein Z3-/Datenüberlassungs-Format; kein Incident-Response-Runbook; keine ASVS-Verifikations-, ASVS-Zertifizierungs- oder ASVS-Audit-Aussage; keine Implementierungs-Autorisierung jeglicher Art; keine Rechts- oder Steuerauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 14. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **TR-02102-Detail-Artefakt** — konkrete Algorithmen, Modi, Cipher Suites, Schlüssellängen sowie TLS-Parameter; getrennt von ASVS-Control-Referenz.
- **KMS-/HSM-/Implementations-Folgeartefakt** — konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik; setzt Custody-Modell-Boundary-Lock und externe sicherheitsfachliche Prüfung voraus.
- **Separat-zu-autorisierende Befüllungs-Pflege der `v5.0.0-X.Y.Z`-Indizes** — gegen OWASP ASVS 5.0.0 (öffentlich, stabil), ohne Einführung neuer Quellen; eigenständig zu organisieren und vom Owner separat freizugeben.
- **ASVS-Verifikations-Aktivität** — eigenständig zu organisierende formale Prüfung außerhalb dieses Artefakts; nicht Bestandteil eines V1.0-Lock-Artefakts.
- **DR-/HA-/BCM-Folgeartefakt** — Boundary-Bezug; bleibt strikt von ASVS-Control-Referenz getrennt.
- **Migrations-Folgeartefakt** — Boundary-Bezug; bleibt strikt getrennt.
- **Z3-/Datenüberlassungs-Spezifikations-Artefakt** — Boundary-Bezug; bleibt strikt getrennt.
- **DSGVO-/Datenpannen-Folgeartefakt** — Boundary-Bezug; nicht Bestandteil dieses Artefakts.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Boundary-Bezug; nicht Bestandteil dieses Artefakts.
- **Verfahrensdokumentation Kap. 5 (nächste Pflege)** — Aufnahme dieses Artefakts und der vorgelagerten V1.0-Lock-Artefakte (Security, Custody) per Verweis als vorgelagerte Spezifikationen.

---

## 15. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für die kontrollbasierte ASVS-Referenzierung in Harouda. Maßgeblich als Eingangsgröße für eine separat zu autorisierende Befüllung der `v5.0.0-X.Y.Z`-Indizes und für die Bezugnahme aus Verfahrensdokumentation Kap. 5 (im Rahmen ihrer nächsten Pflege). |
| **Bindend für** | Alle in §14 genannten Folgeartefakte, soweit sie auf ASVS-Mapping-Eingaben aufsetzen; Verfahrensdokumentation Kap. 5 (nächste Pflege); alle nachgelagerten Detail-Artefakte zu ASVS-Bezug. |
| **Nicht bindend für** | ASVS-Verifikation. ASVS-Zertifizierung. ASVS-Konformitäts-Bestätigung. ASVS-Audit-Ergebnis. ASVS-Stufen-Selbstzuschreibung. Konkrete Krypto-Algorithmen/Modi/Cipher Suites/TLS-Parameter/Schlüssellängen. Konkrete Custody-Topologie. KMS-/HSM-Modellwahl. Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl. Test-Cases / Test-Methodik / CI/CD-Scanner-Konfiguration. Implementierung. Datenmodell. UI/UX. Programmcode. Pseudocode. SQL. APIs. Endfassung Verfahrensdokumentation Kap. 5. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. |
| **STOP-Bedingungen** | **16** nummerierte STOP-Bedingungen (12.1 bis 12.16) gemäß §12. |
| **Boundaries** | ASVS-Control-Referenz ≠ Verifikation. ASVS-Control-Referenz ≠ Zertifizierung. ASVS-Control-Referenz ≠ Audit-Ergebnis. ASVS-Control-Referenz ≠ Implementierung. ASVS-Control-Referenz ≠ Security-Freigabe. ASVS-Control-Referenz ≠ Produktivfreigabe. ASVS-Control-Referenz ≠ TR-02102-Detail. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz (Konsistenz mit F3-Closing). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Quellgrundlage** | OWASP ASVS 5.0.0 (öffentliche, stabile Referenz; in Security V1.0 §3 und Custody V1.0 §3 paraphrasiert); Security-/Krypto-/Key-Custody-Artefakt V1.0 §8 / §17; Custody-Modell-Boundary-Artefakt V1.0 §3 / §10 / §15 / §16; Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (Cross-Boundary); Lösch-/Sperrkonzept-Artefakt V1.0 (Cross-Boundary); Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Cross-Boundary); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. Bei Konflikt mit Security V1.0 gilt Security V1.0 für ASVS-Zielprofil-/Krypto-/Sicherheits-Boundaries. Bei Konflikt mit Custody V1.0 gilt Custody V1.0 für Custody-Boundaries. |
| **Verankerungs-Hinweis** | Das ASVS-Control-Referenz-Artefakt ist im Locked Decisions Register V1.0 §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Es figuriert dort innerhalb des Sortierungsmarker-A-Komplexes Security/Krypto/Key-Custody. Bindungsgrundlage leitet sich ausschließlich ab aus Security V1.0 §8 / §17 sowie Custody V1.0 §10 / §15 / §16. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Lock-Aussage** | ASVS-Control-Referenz-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Keine ASVS-Verifikation, keine ASVS-Zertifizierung, keine ASVS-Konformitäts-Behauptung, kein Audit-Ergebnis, keine Produktivfreigabe. Eine ASVS-bezogene formale Prüfung ist eigenständig zu organisieren. |

---

## 16. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der ASVS-Anker aus Security V1.0 §8 / §17 und Custody V1.0 §3 / §10 / §15 / §16 | in V1.0 enthalten |
| Review-Iteration | Schärfung des Format-Lock `v5.0.0-X.Y.Z` als Platzhalter; Schärfung der Anti-Verifikations-/Anti-Zertifizierungs-Wortwahl; Klarstellung der Trennung gegenüber TR-02102-Detail-Folgeartefakt; Klarstellung des Verankerungs-Hinweises gegenüber dem Locked Decisions Register | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen — insbesondere die Befüllung der `v5.0.0-X.Y.Z`-Indizes mit konkreten Adressen — erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf OWASP ASVS 5.0.0 (öffentliche, stabile Referenz), das Security-/Krypto-/Key-Custody-Artefakt sowie das Custody-Modell-Boundary-Artefakt und ohne Einführung neuer externer Quellen über die in Security V1.0 §3 und Custody V1.0 §3 bereits paraphrasierten hinaus. Eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) und eine externe sicherheitsfachliche Validierung (Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich, soweit einschlägig.
