# Lösch-/Sperrkonzept-Artefakt — V1.0

**Lock-Aussage:** Lösch-/Sperrkonzept-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Eine externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | Lösch-/Sperrkonzept-Artefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe, **keine** DSB-Freigabe |
| Zweck | Festlegung der fachlichen Grenzen für Löschung und Sperrung von Mandanten- und Buchführungsdaten in Harouda — nach Ablauf der gesetzlichen Aufbewahrungsfrist und nach Freigabe etwaiger Legal Holds |
| Scope | Boundary-Aussagen zu: zulässigen Löschungs- und Sperrungsanlässen; Sperrgrund-Taxonomie auf Boundary-Ebene; Legal-Hold-Boundary; Retention-Clock-Interaktion; Audit-/Nachweis-Boundary; Abgrenzung gegen DR/Migration/Z3/Custody/Verfahrensdokumentation; Crypto-Shredding als Architektur-Option ohne rechtliche Würdigung |
| Non-Scope | Implementierung, automatische Löschjobs, DB-Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, konkrete Speicher- bzw. Schlüsselverwaltung, Anbieter-/Produkt-/Plattform-/Hardware-Wahl, Z3-/Datenüberlassungs-Format, DR-/HA-/BCM-Design, Migrations-Implementierung, Incident-Response-Runbook, Endfassung Verfahrensdokumentation Kap. 6, Rechtsgutachten, Sicherheits-/Produktivfreigabe |
| Lock-Basis | Aufbewahrungs-/Retention-Archiv-Artefakt V1.0; Security-/Krypto-/Key-Custody-Artefakt V1.0; gesperrte Harouda-Registergrenzen (F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing); offene Rechtsfrage zur Crypto-Shredding-Einordnung als bekannter Release-Blocker für Produktivanwendung |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. Bei Konflikt mit dem Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 gilt das Aufbewahrungs-Artefakt. Bei Konflikt mit dem Security-/Krypto-/Key-Custody-Artefakt V1.0 gilt das Security-Artefakt für Sicherheits-/Schlüssel-Boundaries. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Beschaffung, keine Schema-, Speicher- oder Anbieter-Entscheidung, keinen Lösch- oder Sperrjob, keine API. |

---

## 2. Zweck und fachliche Rolle

Das Lösch-/Sperrkonzept-Artefakt definiert die fachlichen Grenzen für:

- **Löschung** nach Ablauf der gesetzlichen Aufbewahrungsfrist;
- **Sperrung** der Verarbeitung bzw. des Zugriffs, solange Aufbewahrung oder Legal Hold die Löschung sperren;
- **Legal-Hold-Behandlung** ausschließlich auf Boundary-Ebene;
- **Nachweis-/Audit-Grenze** für Lösch- und Sperrentscheidungen;
- **Verhältnis** zum Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 und zum Security-/Krypto-/Key-Custody-Artefakt V1.0.

Es ist ein **internes Boundary-/Spec-Lock**. Es trifft keine technische Entscheidung über Verfahren, Produkte, Anbieter oder Implementierung und entwirft keine konkrete Lösch-/Sperrlogik.

Das Artefakt liegt fachlich vor Kapitel 6 der Verfahrensdokumentation („Aufbewahrung, Archivierung, Datensicherung, Datenschutz, Auslagerung") und kann von dieser bei der nächsten Pflege per Verweis konsumiert werden; es ersetzt Kap. 6 nicht.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- die rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17,
- die operative Mechanik der Löschung oder Sperrung,
- die konkrete Sperrgrund-Taxonomie auf Implementierungsebene (z. B. Codes, Datenbankwerte),
- den konkreten Lösch-/Sperrprozess (Workflows, Rollen, Eskalationen, technische Eingriffe),
- die Endfassung der Verfahrensdokumentation Kap. 6.

Eine externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) sowie ggf. eine externe sicherheitsfachliche Prüfung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext wird nicht übernommen.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| AO § 147 | Aufbewahrungspflichten und -fristen; insbesondere Nicht-Ablauf der Aufbewahrungsfrist, soweit und solange die Unterlagen für noch nicht festsetzungsverjährte Steuern von Bedeutung sind | Boundary-Verweis (über Retention V1.0) |
| HGB § 257 | Handelsrechtliche Aufbewahrungspflichten parallel zur abgabenrechtlichen Systematik | Boundary-Verweis (über Retention V1.0) |
| GoBD (in der bereits in Retention V1.0 etablierten konsolidierten Basis) | Grundsätze zu Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, Richtigkeit; schriftliches und praktiziertes Löschkonzept als Anforderung | Boundary-Verweis |
| DSGVO Art. 17 | Recht auf Löschung; Abs. 3 lit. b: gesetzliche Aufbewahrungspflicht sperrt vorzeitige Löschung | Boundary-Verweis |
| DSGVO Art. 18 | Recht auf Einschränkung der Verarbeitung; abgrenzbar von Löschung | Boundary-Verweis |
| DSGVO Art. 20 | Recht auf Datenübertragbarkeit; beendet keine Aufbewahrungspflicht | Grenzverweis |
| DSGVO Art. 32 | Sicherheit der Verarbeitung; Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit | Grenzverweis (über Security V1.0) |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | Fachliche Grenzen der Aufbewahrung; Fristbeginn, Hemmung, Legal Hold, Unveränderbarkeit; explizite Deferral der Lösch-/Sperrlogik an dieses Artefakt | **Direkte Lock-Basis** |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | Fachliche Sicherheits-, Krypto- und Key-Custody-Grenzen; Crypto-Shredding-Boundary; Plattform-Admin-Grenze; explizite Deferral der Crypto-Shredding-Operationalisierung an dieses Artefakt | **Direkte Lock-Basis** |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung), F0-D6 (Mandantentrennung), F0-D7 (Plattform-Admin-Grenze), F1-D1/F1-D2 (USt-Wahrheit), F3-D1 (Z3-Export), F3-D2 (DR/Restore), F3-D3 (Migration), F3-Closing | autoritative Boundary-Quellen; bei Konflikt vorrangig |

V1.0 erzeugt keine eigenen rechtlichen Auslegungen über die in Retention V1.0 und Security V1.0 bereits paraphrasierten Quellen hinaus. Eine konkrete rechtliche Würdigung erfolgt downstream.

---

## 4. Core Lösch-/Sperr-Boundaries

Auf Boundary-Ebene gelten:

- **Keine Löschung vor Ablauf der gesetzlichen Aufbewahrungsfrist.** Maßgeblich sind die in Retention V1.0 etablierten Kategorien und Fristen.
- **Keine Löschung, solange ein Legal Hold besteht.** Legal Hold überlagert die zeitbasierte Lösch-Erlaubnis.
- **Keine Löschung, solange die steuerliche Bedeutung und/oder die Festsetzungsfrist im Einzelfall nicht abgelaufen ist** (Hemmungsklausel gemäß Retention V1.0 Abschnitt 5).
- **Keine Löschung, die F0-D4 Festschreibung verändert.** Festschreibung bleibt autoritativ; Lösch-Operationen dürfen die Festschreibungs-Tatsache nicht entfernen oder verfälschen.
- **Keine Löschung, die F1-D1 / F1-D2 USt-Wahrheit verändert.** USt-Werte bleiben autoritative Wahrheitsquelle; Lösch-Operationen dürfen sie nicht überschreiben oder rückwirkend ändern.
- **Keine Lösch-/Sperr-Operation, die F0-D6 Mandantentrennung schwächt.** Mandantenübergreifende Lösch-/Sperrwirkungen sind ausgeschlossen.
- **Kein Plattform-Admin-Override gegenüber Lösch-/Sperrgrenzen unter F0-D7.** Plattform-Administration ist rein technische Rolle; sie kann keine fachliche Lösch- oder Sperrentscheidung treffen.
- **Lösch- und Sperrentscheidungen müssen auf Boundary-Ebene auditierbar und zurechenbar sein** (siehe Abschnitt 12).

V1.0 trifft keine Aussage über konkrete Lösch- oder Sperrmechanismen, Werkzeuge oder Hersteller.

---

## 5. Sperrung vs. Löschung

| Begriff | Boundary-Inhalt |
|---|---|
| **Sperrung** | Einschränkung der Verarbeitung bzw. des Zugriffs, während die Daten erhalten bleiben müssen. Sperrung ist die Standardmaßnahme während laufender Aufbewahrungsfrist, laufendem Legal Hold und unaufgelöster Lösch-Voraussetzung. |
| **Löschung** | Entfernung oder unwiderrufliche Unzugänglichmachung der Daten. Löschung ist erst zulässig, **nachdem** alle Aufbewahrungs-, Legal-Hold- und Festsetzungsfrist-Sperren geprüft und freigegeben wurden. |

Diese Unterscheidung ist boundary-relevant; konkrete technische Mechanismen (z. B. konkrete Sperr-/Löschverfahren auf Datenbank-, Speicher- oder Schlüsselebene) verbleiben downstream.

V1.0 trifft **keine** Aussage über die technische Realisierung von Sperrung oder Löschung. Insbesondere wird **nicht** entschieden, ob Sperrung als logischer Zustandsmarker, als Zugriffs-Policy, als Verschlüsselungs-Scoping oder anderweitig umgesetzt wird.

---

## 6. Legal Hold Boundary

- Ein Legal Hold ist ein **eigenständiger Sperrgrund** und überlagert die zeitbasierte Lösch-Erlaubnis.
- Anlässe können sein (nicht abschließend): Außenprüfung, anhängiges Einspruchs-/Klageverfahren, Steuerstraf- oder Bußgeldverfahren mit Bezug zur Unterlage, unterlagenbezogene behördliche Anordnung, anhängige Rechtsstreitigkeit, sonstiger rechtlicher Sicherungsanlass.
- **Erstellung, Fortbestand und Aufhebung** eines Legal Holds müssen dokumentiert sein; die Boundary verlangt Nachvollziehbarkeit, jedoch keinen konkreten Workflow.
- **Aufhebung** eines Legal Holds setzt voraus, dass der zugrundeliegende Anlass nachweislich entfallen ist.
- **Wirkung:** Solange ein Legal Hold besteht, ist eine Löschung der betroffenen Unterlage trotz formal abgelaufener Aufbewahrungsfrist **ausgeschlossen**.
- Der **konkrete Workflow** (Eskalationspfade, Rollen, Freigaben, Aufhebungs-Mechanik, technische Markierung) wird in V1.0 dieses Artefakts **nicht** entworfen und verbleibt downstream.

---

## 7. Sperrgrund-Taxonomie (Boundary)

Die nachfolgenden Boundary-Kategorien sind **fachliche Sperrgrund-Klassen**. Sie sind weder operative Codes noch Datenbankwerte. Konkrete Codes, Schlüssel, Bezeichner und Wertebereiche werden in V1.0 dieses Artefakts **nicht** festgelegt.

| Boundary-Kategorie | Inhalt (Kurzform) |
|---|---|
| **Aufbewahrungspflicht aktiv** | Gesetzliche Aufbewahrungsfrist gemäß Retention V1.0 ist nicht abgelaufen. |
| **Festsetzungsfrist / steuerliche Bedeutung nicht abgelaufen** | Die Unterlagen sind weiterhin steuerlich von Bedeutung; Hemmungsklausel gemäß Retention V1.0 Abschnitt 5 greift im Einzelfall. |
| **Außenprüfung oder anderes Verfahren laufend** | Ein steuerliches, straf-/bußgeldrechtliches oder ähnliches Verfahren mit Bezug zur Unterlage ist anhängig. |
| **Rechtsstreit / Anspruchssicherung** | Ein zivil-, straf- oder verwaltungsrechtlicher Anspruch mit Bezug zur Unterlage ist offen. |
| **DSGVO-Einschränkung der Verarbeitung (Art. 18)** | Die betroffene Person hat eine Einschränkung der Verarbeitung verlangt; technische Sperrwirkung ohne Löschwirkung. |
| **Unaufgelöste Klassifizierung** | Die Dokumentenkategorie-/Retention-Regelmatrix-Zuordnung ist offen oder zweifelhaft (z. B. Lieferschein-Klassifizierung gemäß Retention V1.0 Abschnitt 4). |
| **Technischer Integritätshalt** | Integritätsindikatoren (z. B. Hash-Kette, Festschreibungs-Tatsache, Verifikations-Status) sind im Konflikt; eine Lösch-/Sperr-Operation darf nicht stattfinden, bevor die Integrität geklärt ist. |
| **Sicherheits-/Forensik-Halt** | Verdacht oder bestätigte sicherheitsrelevante Vorgänge (z. B. Ransomware-Restore-Kontext gemäß F3-D2) erfordern eine forensische Prüfung; Lösch-/Sperr-Operationen werden bis zur forensischen Freigabe ausgesetzt. |

Die genaue Operationalisierung dieser Boundary-Kategorien (Codes, Datenmodelle, Workflows, UI-Statusse, Logging-Felder) ist **downstream** und wird in V1.0 dieses Artefakts **nicht** entschieden.

---

## 8. Retention-Clock-Interaktion

Konsistent mit Retention V1.0:

- **Fristbeginn:** Die Aufbewahrungsfrist beginnt mit Ablauf des Kalenderjahres, in dem die letzte fristauslösende Handlung erfolgt ist.
- **Fristdauer:** 6, 8 oder 10 Jahre je Kategorie gemäß Retention V1.0 Abschnitt 4.
- **Hemmung:** Die Frist läuft nicht ab, soweit und solange die Unterlagen für Steuern von Bedeutung sind, für die die Festsetzungsfrist noch nicht abgelaufen ist.
- **Fristablauf ≠ Lösch-Erlaubnis:** Der Ablauf der gesetzlichen Aufbewahrungsfrist allein berechtigt nicht zur Löschung. Es ist zusätzlich zu prüfen:
  1. ob ein Legal Hold besteht;
  2. ob ein Sperrgrund gemäß Abschnitt 7 besteht;
  3. ob die Festsetzungsfrist / steuerliche Bedeutung im Einzelfall fortbesteht;
  4. ob die Klassifizierung der Unterlage final ist.
- **Keine automatische Löschung:** Eine automatische Löschung ohne nachweisbaren Ablauf der gesetzlichen Frist **und** ohne Prüfung sämtlicher Sperrgründe **und** ohne revisionssicheren Nachweis ist auf Boundary-Ebene **ausgeschlossen**.

Konkrete Lösch-Job-Frequenzen, Trigger-Punkte, Vier-Augen-Verfahren oder Freigabe-Stellen werden in V1.0 dieses Artefakts **nicht** festgelegt.

---

## 9. Crypto-Shredding Boundary

- Crypto-Shredding wird in V1.0 **ausschließlich als Architektur-Option** geführt; dieselbe Behandlung wie im Security-/Krypto-/Key-Custody-Artefakt V1.0 Abschnitt 13.
- V1.0 stellt **nicht** fest, dass Crypto-Shredding rechtlich eine Löschung im Sinne von DSGVO Art. 17 Abs. 1 erfüllt.
- Crypto-Shredding bleibt **downstream-bedingt**: nur dann verwendbar, wenn die rechtliche Einordnung nachweislich extern freigegeben **und** die technische Operationalisierung (Schlüsselhierarchie, Schlüsselzerstörungs-Verfahren, Nachweisführung) im Custody-Modell-Folgeartefakt sowie ggf. in einem operativen Lösch-/Sperrprozess-Detail freigegeben ist.
- Crypto-Shredding **darf nicht** zur Umgehung gesetzlicher Aufbewahrungspflichten nach AO § 147 / HGB § 257 verwendet werden.
- V1.0 entscheidet **nicht** über die operative Mechanik von Crypto-Shredding.
- V1.0 trifft **keine** Aussage über Schlüsselhierarchie, Schlüsselrotation, Schlüsselzerstörungs-Mechanik, Algorithmen, Modi, Anbieter-/Werkzeug-/Plattform-/Hardware-/Cloud-Wahl oder Schlüsselverwaltungs-Produktwahl. Diese Entscheidungen bleiben dem Custody-Modell-Folgeartefakt vorbehalten.

---

## 10. Audit / Nachweis Boundary

Auf Boundary-Ebene gilt:

- **Lösch- und Sperrentscheidungen müssen rekonstruktierbar bleiben.**
- Der **Nachweis** je Entscheidung muss auf fachlicher Ebene mindestens enthalten:
  - Dokumenten-/Vorgangskategorie (Boundary-Klasse gemäß Retention V1.0);
  - Rechtsgrundlage und konkrete Aufbewahrungs-Regel;
  - Fristberechnung (Fristbeginn, Frist, Ablaufdatum, Hemmungsstatus, Festsetzungsfrist-Status im Einzelfall);
  - Ergebnis der Sperrgrund-Prüfung gemäß Abschnitt 7 (einschließlich Legal-Hold-Prüfung);
  - Auslösendes Subjekt bzw. Rolle und zugehörige Autorisierungs-Grundlage;
  - Zeitpunkt der Entscheidung und Zeitpunkt der ausgeführten Lösch- bzw. Sperr-Operation;
  - Operatives Ergebnis (Sperrung gesetzt/aufgehoben, Löschung durchgeführt, oder Vorgang abgelehnt mit Grund).
- **Sicherheits-Audit und buchführungs-/GoBD-Audit dürfen nicht vermischt werden.** Die jeweiligen Audit-Spuren bleiben fachlich getrennt; eine Boundary-Verschmelzung ist ausgeschlossen.
- **Konkrete Log-Schemata, Datenmodelle, Aufbewahrungsorte oder Werkzeuge** für die Nachweisführung sind **Non-Scope** und werden downstream entschieden.

---

## 11. Verhältnis zu benachbarten Artefakten

| Benachbartes Artefakt | Beziehung |
|---|---|
| **Aufbewahrungs-/Retention-Archiv-Artefakt V1.0** | Liefert die Aufbewahrungs-Boundaries (Kategorien, Fristen, Fristbeginn, Hemmung). Lösch-/Sperrkonzept setzt darauf auf, ohne diese zu ändern. |
| **Security-/Krypto-/Key-Custody-Artefakt V1.0** | Liefert die Sicherheits-/Krypto-/Key-Custody-Boundaries (Plattform-Admin-Grenze, Crypto-Shredding-Boundary, Schlüssellebenszyklus-Boundary). Lösch-/Sperrkonzept respektiert diese Boundaries und greift nicht in Schlüsselverwaltung ein. |
| **Custody-Modell-Folgeartefakt** | Konkretes Schlüsselverwaltungs- und Custody-Modell. Erst nach dessen Lock kann eine Crypto-Shredding-basierte Löschung operationalisiert werden. **Out of Scope** in diesem Artefakt. |
| **Dokumentenkategorie-/Retention-Regelmatrix** | Klassifizierungs-Kriterien je Dokumenten-/Vorgangstyp. Liefert die Eingangsgröße für die Sperrgrund-Klasse „unaufgelöste Klassifizierung". **Out of Scope** in diesem Artefakt. |
| **Verfahrensdokumentation Kap. 6** | Beschreibt das im Unternehmen tatsächlich praktizierte Aufbewahrungs- und Löschkonzept. Wird in der nächsten Pflege auf dieses Artefakt sowie auf Retention V1.0 verweisen. **Wird in V1.0 dieses Artefakts nicht finalisiert.** |
| **DSGVO-/Datenpannen-Folgeartefakt** | Behandelt DSGVO Art. 33/34. **Out of Scope** in diesem Artefakt; Grenzverweis. |
| **Cybersecurity-Incident-Response-Folgeartefakt** | Ransomware-/Forensik-Workflow. Steuert den Sperrgrund „Sicherheits-/Forensik-Halt" operativ. **Out of Scope** in diesem Artefakt. |
| **DR-/HA-/BCM-Folgeartefakt** | RPO/RTO, Restore-Modi. **Aufbewahrungs-/Retention-Archiv ≠ DR-Backup**, wie in Retention V1.0 etabliert. **Out of Scope.** |
| **Z3-/Datenüberlassungs-Spezifikations-Artefakt** | Externe Datenüberlassung an Behörden. **Aufbewahrungs-/Retention-Archiv ≠ Z3-Export**, wie in Retention V1.0 etabliert. **Out of Scope.** |
| **Migrations-Folgeartefakt** | Migrations-Mechanik. **Migration ≠ Löschung**; Migrations-Rollback ≠ DR-Restore. **Out of Scope.** |

---

## 12. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 12.1 | Eine Löschung wird vor nachgewiesenem Ablauf der gesetzlichen Aufbewahrungsfrist gemäß Retention V1.0 vorgenommen oder vorgesehen. |
| 12.2 | Eine Löschung wird durchgeführt oder vorgesehen, solange ein Legal Hold besteht. |
| 12.3 | Eine Löschung wird durchgeführt oder vorgesehen, solange im Einzelfall die steuerliche Bedeutung und/oder die Festsetzungsfrist nicht abgelaufen ist (Hemmung gemäß Retention V1.0 Abschnitt 5). |
| 12.4 | Eine Lösch- oder Sperr-Operation würde die F0-D4 Festschreibung verändern oder die F1-D1 / F1-D2 USt-Wahrheit überschreiben. |
| 12.5 | Eine Lösch- oder Sperr-Operation würde F0-D6 Mandantentrennung schwächen oder mandantenübergreifend wirken. |
| 12.6 | Eine Lösch- oder Sperr-Operation würde unter Berufung auf die Plattform-Admin-Rolle gegen F0-D7 verstoßen (Plattform-Admin trifft keine fachliche Lösch- oder Sperrentscheidung). |
| 12.7 | Eine Lösch- oder Sperr-Operation würde die F3-Closing-Grenzen (insbesondere F3-D1 Z3-Export, F3-D2 DR/Restore, F3-D3 Migration) berühren oder umgehen. |
| 12.8 | V1.0 dieses Artefakts oder ein darauf gestütztes Folgeartefakt behauptet, dass Crypto-Shredding rechtlich eine Löschung im Sinne von DSGVO Art. 17 erfüllt, ohne dass eine externe rechtliche Prüfung diese Einordnung downstream bestätigt. |
| 12.9 | V1.0 dieses Artefakts trifft eine Implementierungs-, Schema-, UI-, Code-, SQL-, Pseudocode-, Algorithmus-, Speicher-, Schlüssel-, Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud- oder Hardware-Entscheidung. |
| 12.10 | V1.0 dieses Artefakts behauptet eine rechtliche, sicherheitsfachliche, DSB-, Aufsichts-, Zertifizierungs-, Produktivfreigabe- oder vergleichbare externe Freigabe, die nicht tatsächlich vorliegt. |
| 12.11 | V1.0 dieses Artefakts ändert oder weicht den Status von §28.11-bet auf. §28.11-bet bleibt unverändert/offen. |
| 12.12 | Eine Lösch- oder Sperrlogik wird ohne revisionssicheren Nachweis gemäß Abschnitt 10 ausgeführt oder spezifiziert. |
| 12.13 | Eine vorgesehene automatische Löschung erfolgt ohne vorgeschaltete Sperrgrund-Prüfung gemäß Abschnitt 7. |

---

## 13. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Implementierung jeglicher Art,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode und Pseudocode,
- Algorithmus-Design,
- SQL und Query-Spezifikation,
- automatische Lösch- oder Sperrjobs (Scheduler, Trigger, Pipelines),
- Speicher-Design (Objektspeicher, Dateisystem, Datenbank-Strukturen),
- Schlüsselverwaltungs-Design (Hierarchie, Rotation, Zerstörung, Wiederherstellung),
- Schlüsselverwaltungs-Produktwahl,
- Hardware-basierte Schutzdomänen-Produktwahl,
- Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud- oder Hardware-Wahl,
- Incident-Response-Runbook,
- Endfassung der Verfahrensdokumentation Kap. 6,
- Rechtsgutachten oder verbindliche Rechtsauskunft,
- Sicherheitsfreigabe oder Produktivfreigabe,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; kein Verschlüsselungsverfahren und keine Schlüsselverwaltung in konkreter Form; keine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; kein Incident-Response-Runbook; keine Implementierungs-Autorisierung jeglicher Art; keine Rechtsauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 14. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **Dokumentenkategorie-/Retention-Regelmatrix** — fachliche Klassifizierungs-Kriterien je Dokumenten-/Vorgangstyp; Eingangsgröße für die Sperrgrund-Klasse „unaufgelöste Klassifizierung".
- **Custody-Modell-Folgeartefakt** — konkrete Schlüsselverwaltung; Voraussetzung für jegliche operative Anwendung von Crypto-Shredding.
- **Crypto-Shredding rechtliche Einordnung** — externe Fachanwalts-/DSB-Prüfung der Einordnung unter DSGVO Art. 17 / Art. 18; Release-Blocker für Produktivanwendung.
- **Lösch-/Sperrprozess Operational-Detail-Folgeartefakt** — operative Mechanik (Workflows, Rollen, Eskalationen, technische Markierung), sofern als eigenständiges Artefakt geführt; alternativ Aufnahme in Verfahrensdokumentation Kap. 6.
- **Verfahrensdokumentation Kap. 6 (nächste Pflege)** — Aufnahme dieses Artefakts und des Aufbewahrungs-/Retention-Archiv-Artefakts V1.0 per Verweis als vorgelagerte Spezifikation.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34; nicht Teil dieses Artefakts.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Ransomware-/Forensik-Workflow; steuert den Sperrgrund „Sicherheits-/Forensik-Halt" operativ.
- **DR-/HA-/BCM-Folgeartefakt** — Verfügbarkeits- und Wiederherstellungsziele; bleibt strikt von Aufbewahrung/Löschung getrennt.

---

## 15. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für Lösch- und Sperrgrenzen in Harouda. Maßgeblich für die Ableitung der in Abschnitt 14 genannten Folgeartefakte und für die Bezugnahme aus Verfahrensdokumentation Kap. 6. |
| **Bindend für** | Alle in Abschnitt 14 genannten Folgeartefakte; Verfahrensdokumentation Kap. 6 (im Rahmen ihrer nächsten Pflege); alle nachgelagerten Detail-Artefakte zu Lösch-/Sperr-Themen. Bindend hinsichtlich der Boundary-Statements und der Abgrenzungen gegen DR-Backup, Z3-/Datenüberlassung, Migration, Custody-Modell, Datenschutz-Vorfallsprozess sowie Cybersecurity-Incident-Response. |
| **Nicht bindend für** | Konkrete Lösch- oder Sperrlogik. Operative Codes oder Datenbankwerte. Konkretes Custody-Modell. Konkrete Algorithmen/Modi/Cipher Suites/TLS-Parameter. Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Hardware-Wahl. DR-/HA-/BCM-Design. Z3-/Datenüberlassungs-Format. Migrations-Implementierung. Datenschutz-Vorfallsprozess. Endfassung Verfahrensdokumentation Kap. 6. Rechtsauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. |
| **STOP-Bedingungen** | **13** nummerierte STOP-Bedingungen (12.1 bis 12.13) gemäß Abschnitt 12. |
| **Boundaries** | Lösch-/Sperrkonzept ≠ Implementierung. Sperrung ≠ Löschung. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept (Konsistenz mit Retention V1.0). Plattform-Admin (F0-D7) bleibt rein technische Rolle ohne fachlichen Superuser; trifft keine Lösch-/Sperr-Entscheidung. F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3 bleiben autoritativ. Crypto-Shredding bleibt downstream-bedingt; keine eigene rechtliche Würdigung in V1.0. |
| **Quellgrundlage** | AO § 147; HGB § 257; GoBD (in der bereits in Retention V1.0 etablierten konsolidierten Basis); DSGVO Art. 17, 18, 20, 32; Aufbewahrungs-/Retention-Archiv-Artefakt V1.0; Security-/Krypto-/Key-Custody-Artefakt V1.0; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. Bei Konflikt mit Retention V1.0 gilt das Aufbewahrungs-Artefakt; bei Konflikt mit Security V1.0 gilt das Security-Artefakt für Sicherheits-/Schlüssel-Boundaries. |
| **Lock-Aussage** | Lösch-/Sperrkonzept-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. |

---

## 16. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der Deferrals aus Retention V1.0 und Security V1.0 | in V1.0 enthalten |
| Review-Iteration | Konsolidierung der Sperrgrund-Taxonomie auf Boundary-Ebene; Schärfung der Audit-/Nachweis-Boundary; Klarstellung Crypto-Shredding-Downstream-Bedingung | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf das amtliche Quellpaket, die gesperrten Harouda-Registergrenzen, das Aufbewahrungs-/Retention-Archiv-Artefakt sowie das Security-/Krypto-/Key-Custody-Artefakt. Eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich.
