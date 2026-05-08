# Dokumentenkategorie-/Retention-Regelmatrix — V1.0

**Lock-Aussage:** Dokumentenkategorie-/Retention-Regelmatrix V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene; sie schafft keine Implementierungsregeln, erteilt keine Rechtsauskunft und autorisiert keinen Produktivbetrieb. Eine externe rechtliche bzw. steuerfachliche Validierung bleibt vor produktiver oder rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | Dokumentenkategorie-/Retention-Regelmatrix |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe |
| Zweck | Festlegung der fachlichen Klassifikations-Boundary je Dokumenten-/Vorgangstyp als Eingangsgröße für das Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 und das Lösch-/Sperrkonzept-Artefakt V1.0 |
| Scope | Boundary-Aussagen zu: fachlichen Dokumentenkategorie-Klassen; Frist-Mapping je Kategorie als Spiegel zu Retention V1.0; Lieferschein-Klassifikations-Boundary; Buchungsbeleg-Abgrenzung; Handels-/Geschäftsbrief- und „sonstige Unterlagen"-Abgrenzung; Lohnkonten-Grenzverweis; „Unaufgelöste Klassifizierung"-Boundary; Schnittstelle zu Lösch-/Sperrkonzept V1.0; Cross-Boundary-Konsistenz mit gesperrten Harouda-Locks |
| Non-Scope | Implementierung, Datenmodell, Schema, Enum-/Status-Werte, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, automatische Klassifikations- oder Lösch-/Sperrjobs, APIs, Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Modell-/Hardware-Wahl, Lohn-DLS-Detail, Z3-/Datenüberlassungs-Format, DR-/HA-/BCM-Design, Migrations-Implementierung, rechtliche Würdigung von Crypto-Shredding, Endfassung Verfahrensdokumentation Kap. 6, Rechtsgutachten, Sicherheitsfreigabe, Produktivfreigabe |
| Lock-Basis | Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (direkte Quelle); Lösch-/Sperrkonzept-Artefakt V1.0 (Schnittstelle für „Unaufgelöste Klassifizierung"); Security-/Krypto-/Key-Custody-Artefakt V1.0 (ausschließlich für indirekte Boundary-Wahrung); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit Retention V1.0 gilt Retention V1.0. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0. Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Schema-Entscheidung, keine Job-Spezifikation, keine API, keine Beschaffung. |

**Wichtiger Hinweis zur Verankerung:** Die Dokumentenkategorie-/Retention-Regelmatrix ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Die Bindungsgrundlage dieses Artefakts leitet sich ausschließlich ab aus:
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §14 (Downstream Artefakte / Open Detail Decisions), und
- Lösch-/Sperrkonzept-Artefakt V1.0 §11 (Verhältnis zu benachbarten Artefakten) und §14 (Downstream Artefakte / Open Detail Decisions).

V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht** und behauptet **keine** Register-Verankerung, die nicht existiert.

---

## 2. Zweck und fachliche Rolle

Die Dokumentenkategorie-/Retention-Regelmatrix definiert die fachlichen Grenzen für:

- die **Klassifikation** je Dokumenten-/Vorgangstyp auf Boundary-Ebene;
- das **Frist-Mapping** je fachlicher Klasse als Spiegel zu Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §4;
- die **Abgrenzung** von Buchungsbeleg, Handels-/Geschäftsbrief, sonstiger steuerlich bedeutsamer Unterlage und Lieferschein-Sonderfall auf Boundary-Ebene;
- die **Schnittstelle** zur Sperrgrund-Klasse „Unaufgelöste Klassifizierung" gemäß Lösch-/Sperrkonzept-Artefakt V1.0 §7;
- die **Wahrung** der gesperrten Harouda-Boundaries bei jeder Klassifikations-Aussage.

Die Regelmatrix ist ein **internes Boundary-/Spec-Lock**. Sie liefert Eingangsgrößen für nachgelagerte Entscheidungen, **trifft jedoch selbst keine** technischen, legalistischen oder operativen Festlegungen. Die fachliche Anwendung im Einzelfall sowie die rechtliche Bewertung im Streitfall bleiben außerhalb dieses Artefakts.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- die operative Klassifikations-Mechanik (Workflows, Rollen, Eskalationen, technische Markierung),
- die rechtliche Auslegung im Einzelfall,
- die konkrete Datenmodellierung (Codes, Status, Datenbankwerte, Enum-Werte),
- die UI-/UX-Darstellung,
- die Endfassung der Verfahrensdokumentation Kap. 6.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext wird nicht übernommen. V1.0 dieses Artefakts erzeugt **keine** eigenen rechtlichen Auslegungen über die in Retention V1.0 und Lösch-/Sperrkonzept V1.0 bereits paraphrasierten Quellen hinaus.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| AO § 147 | Aufbewahrungspflichten und -fristen für steuerlich relevante Unterlagen, einschließlich der ab 01.01.2025 für Buchungsbelege auf 8 Jahre verkürzten Frist; Hemmungsklausel gemäß AO § 147 Abs. 3 Satz 5 | Boundary-Verweis (über Retention V1.0) |
| HGB § 257 | Handelsrechtliche Aufbewahrungspflichten und -fristen, parallel zur abgabenrechtlichen Systematik | Boundary-Verweis (über Retention V1.0) |
| Art. 97 § 19a EGAO / Art. 95 EGHGB | Übergangsregel für die Verkürzung von 10 auf 8 Jahre für Buchungsbelege; verzögerte Anwendung für KWG-/VAG-/WpIG-Institute | Boundary-Verweis (über Retention V1.0) |
| EStG § 41 | Sechsjährige Aufbewahrung der Lohnkonten | Grenzverweis; vertieft im Lohn-DLS-Folgeartefakt |
| GoBD (in der bereits in Retention V1.0 etablierten konsolidierten Basis) | Grundsätze zu Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, Richtigkeit | Boundary-Verweis |
| DSGVO Art. 17 | Recht auf Löschung; Abs. 3 lit. b: gesetzliche Aufbewahrungspflicht sperrt vorzeitige Löschung | Grenzverweis |
| DSGVO Art. 18 | Recht auf Einschränkung der Verarbeitung; abgrenzbar von Löschung | Grenzverweis |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | Fachliche Aufbewahrungs-Boundaries (Kategorien, Fristen, Fristbeginn, Hemmung, Lieferschein-Sonderfall, Legal Hold) | **Direkte Lock-Basis** |
| Lösch-/Sperrkonzept-Artefakt V1.0 | Sperrgrund-Taxonomie (insbesondere „Unaufgelöste Klassifizierung"), Legal-Hold-Boundary, Lösch-/Sperr-Boundaries | **Direkte Lock-Basis** (Schnittstelle) |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | Plattform-Admin-Grenze, Crypto-Shredding-Boundary, Schlüssellebenszyklus-Boundary | Indirekte Lock-Basis (Boundary-Wahrung) |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung), F0-D6 (Mandantentrennung), F0-D7 (Plattform-Admin-Grenze), F1-D1/F1-D2 (USt-Wahrheit), F3-D1 (Z3-Export), F3-D2 (DR/Restore), F3-D3 (Migration), F3-Closing | Autoritative Boundary-Quellen; bei Konflikt vorrangig |

---

## 4. Core Dokumentenkategorie-Boundaries

Auf Boundary-Ebene gelten:

- **Klassifikation ist eine fachliche Dokumentenkategorie-Entscheidung**, keine Implementierungs- oder Datenmodellregel.
- **Jede Klassifikation muss konsistent** mit Retention V1.0 §4 (Kategorien und Fristen) und Retention V1.0 §5 (Fristbeginn, Hemmung) sein.
- **Jede Klassifikation muss die gesperrten Harouda-Boundaries** F0-D4 (Festschreibung), F0-D6 (Mandantentrennung), F0-D7 (Plattform-Admin-Grenze) und F1-D1/F1-D2 (USt-Wahrheit) wahren.
- **Klassifikation berührt F3-Boundaries nicht.** Sie trifft keine Aussage zu Z3-Export (F3-D1), DR/Restore (F3-D2) oder Migration (F3-D3).
- **Klassifikation entscheidet nicht über Löschung oder Sperrung.** Diese Entscheidung verbleibt im Lösch-/Sperrkonzept V1.0.
- **Plattform-Administration trifft keine Klassifikations-Entscheidung.** Plattform-Admin ist rein technische Rolle gemäß F0-D7.
- **Klassifikation ist mandantenscharf.** Mandantenübergreifende Klassifikations-Aussagen sind ausgeschlossen (F0-D6).
- **Klassifikation darf F0-D4 Festschreibung nicht verändern.** Festschreibungs-Tatsachen werden durch Klassifikation weder erzeugt noch entfernt noch verfälscht.

V1.0 dieses Artefakts trifft keine Aussage über konkrete Klassifikations-Mechanismen, Werkzeuge, Anbieter oder Implementierungen.

---

## 5. Kategorie-/Frist-Matrix

Spiegel zu Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §4. Die Matrix ist **boundary-level** und **deklarativ**; sie ersetzt nicht die rechtliche Prüfung im Einzelfall. Bei Abweichung gilt Retention V1.0.

| Fachliche Klasse | Frist (Boundary) | Quelle (paraphrasiert) | Anmerkung |
|---|---|---|---|
| Bücher und Aufzeichnungen, Inventare, Bilanzen, Jahresabschlüsse, Lageberichte, Eröffnungsbilanzen, zur Verständlichkeit erforderliche Arbeitsanweisungen und sonstige Organisationsunterlagen | 10 Jahre | AO § 147 Abs. 1 Nr. 1 / Abs. 3; HGB § 257 Abs. 1 Nr. 1 / Abs. 4 (Spiegel zu Retention V1.0 §4) | Authoritative 10-Jahres-Klasse |
| Zollrechtlich relevante Unterlagen, soweit einschlägig | 10 Jahre | Grenzverweis (Spiegel zu Retention V1.0) | **Ausschließlich Grenzverweis**; vertieft nicht in V1.0 dieses Artefakts |
| Buchungsbelege | 8 Jahre | AO § 147 Abs. 1 Nr. 4 / Abs. 3; HGB § 257 Abs. 1 Nr. 4 / Abs. 4; allgemeine Anwendung gemäß Art. 97 § 19a EGAO und Art. 95 EGHGB (Spiegel zu Retention V1.0 §4) | Verkürzung von 10 auf 8 Jahre; Übergangsregel und KWG-/VAG-/WpIG-verzögerte Anwendung wie in Retention V1.0 dokumentiert |
| Empfangene Handels- und Geschäftsbriefe | 6 Jahre | AO § 147 Abs. 1 Nr. 2 / Abs. 3; HGB § 257 Abs. 1 Nr. 2 / Abs. 4 (Spiegel zu Retention V1.0 §4) | |
| Wiedergaben abgesandter Handels- und Geschäftsbriefe | 6 Jahre | AO § 147 Abs. 1 Nr. 3 / Abs. 3; HGB § 257 Abs. 1 Nr. 3 / Abs. 4 (Spiegel zu Retention V1.0 §4) | |
| Sonstige für die Besteuerung bedeutsame Unterlagen | 6 Jahre | AO § 147 Abs. 1 Nr. 5 / Abs. 3 (Spiegel zu Retention V1.0 §4) | Auffangkategorie; Klassifikation im Einzelfall fachlich |
| Lohnkonten | 6 Jahre | EStG § 41 (Grenzverweis; Spiegel zu Retention V1.0 §4 / §11) | **Ausschließlich Grenzverweis**; Detail im Lohn-DLS-Folgeartefakt |

**Konsistenzregel:** Die Matrix ist eine boundary-level Spiegelung und führt **keine** eigene Frist ein, die nicht in Retention V1.0 verankert ist. Bei einer späteren Änderung an Retention V1.0 ist diese Matrix in einem ausdrücklich neu zu eröffnenden Versionsschritt nachzuziehen.

**Fristbeginn und Hemmung** richten sich strikt nach Retention V1.0 §5 (Fristbeginn mit Ablauf des Kalenderjahres der letzten fristauslösenden Handlung; Hemmungsklausel gemäß AO § 147 Abs. 3 Satz 5). V1.0 dieses Artefakts trifft hierzu keine eigene Aussage.

---

## 6. Lieferschein-Klassifizierung

Boundary-level Spiegelung von Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §4 Lieferschein-Sonderfall. V1.0 dieses Artefakts fügt **keine** neue Auslegung hinzu.

| Sub-Klasse | Boundary-Aussage | Quelle (paraphrasiert) |
|---|---|---|
| Empfangener Lieferschein, der **kein** Buchungsbeleg im Sinne von AO § 147 Abs. 1 Nr. 4 ist | Aufbewahrungspflicht endet mit Erhalt der zugehörigen Rechnung. | Spiegel zu Retention V1.0 §4 Lieferschein-Sonderfall |
| Abgesandter Lieferschein, der **kein** Buchungsbeleg im Sinne von AO § 147 Abs. 1 Nr. 4 ist | Aufbewahrungspflicht endet mit Versand der zugehörigen Rechnung. | Spiegel zu Retention V1.0 §4 Lieferschein-Sonderfall |
| Lieferschein, der **selbst Buchungsbeleg** ist **oder** steuerlich eigenständige Bedeutung behält | Verkürzte Sonderbehandlung gilt **nicht**; es greifen die regulären Fristen aus §5 dieses Artefakts (8 Jahre als Buchungsbeleg bzw. 6 Jahre als „sonstige für die Besteuerung bedeutsame Unterlage", je nach fachlicher Zuordnung). | Spiegel zu Retention V1.0 §4 Lieferschein-Sonderfall |

**Wesensaussage:** Die Zuordnung eines Lieferscheins zur jeweiligen Sub-Klasse ist eine **fachliche Dokumentenkategorie-Entscheidung** und **keine Implementierungsregel**. V1.0 dieses Artefakts entscheidet weder im Einzelfall noch automatisiert; sie nennt ausschließlich die Boundary-Klassen.

Solange die Zuordnung im Einzelfall offen oder zweifelhaft ist, greift der Boundary-Status „Unaufgelöste Klassifizierung" gemäß §10 dieses Artefakts und die zugehörige Sperrgrund-Klasse aus Lösch-/Sperrkonzept V1.0 §7.

---

## 7. Buchungsbeleg-Abgrenzung

Auf Boundary-Ebene:

- Ein **Buchungsbeleg** im Sinne von AO § 147 Abs. 1 Nr. 4 ist eine Unterlage, deren fachliche Funktion die Verbuchung eines Geschäftsvorfalls belegt oder unmittelbar trägt. Die rechtliche Würdigung im Einzelfall verbleibt **außerhalb** dieses Artefakts.
- **Frist:** 8 Jahre, gemäß §5 (Tabelle), unter Anwendung von Art. 97 § 19a EGAO und Art. 95 EGHGB wie in Retention V1.0 dokumentiert.
- **F0-D4-Wahrung:** Die Klassifikation als Buchungsbeleg darf die Festschreibungs-Tatsache nach F0-D4 weder erzeugen, ändern noch entfernen. Festschreibung bleibt autoritativ in F0-D4.
- **F1-D1/F1-D2-Wahrung:** Die Klassifikation als Buchungsbeleg darf USt-Werte nach F1-D1/F1-D2 weder erzeugen, ändern noch überschreiben. USt-Wahrheit bleibt autoritativ in F1-D1/F1-D2.
- **Übergangs-Boundary:** Die verkürzte 8-Jahres-Frist gilt erstmals für Unterlagen, deren bisherige zehnjährige Frist am 31.12.2024 noch nicht abgelaufen war (Spiegel zu Retention V1.0). Für vor diesem Stichtag bereits abgelaufene Fristen tritt durch die Verkürzung keine Reaktivierung ein.
- **KWG-/VAG-/WpIG-Boundary:** Verzögerte Anwendung gemäß Art. 97 § 19a Abs. 3 EGAO bzw. Art. 95 EGHGB; Spiegel zu Retention V1.0 §4. V1.0 dieses Artefakts trifft hierzu keine eigene Aussage.
- **Lieferschein-Schnittstelle:** Die Klasse „Buchungsbeleg" überlagert den Lieferschein-Sonderfall, wenn der Lieferschein selbst Buchungsbeleg ist (siehe §6 Sub-Klasse 3).

V1.0 dieses Artefakts entwirft **keine** operative Buchungsbeleg-Erkennungslogik, **keine** Klassifikations-Heuristik, **keine** API und **keinen** Schwellenwert.

---

## 8. Handels-/Geschäftsbrief- und sonstige-Unterlagen-Abgrenzung

Auf Boundary-Ebene:

- **Empfangene Handels-/Geschäftsbriefe** und **Wiedergaben abgesandter Handels-/Geschäftsbriefe** sind Unterlagen, die die fachliche Funktion eines Handels- oder Geschäftsbriefes erfüllen. Die fachliche Zuordnung im Einzelfall verbleibt **außerhalb** dieses Artefakts.
- **Frist:** 6 Jahre, gemäß §5 (Tabelle).
- **„Sonstige für die Besteuerung bedeutsame Unterlagen"** sind die Auffangklasse für steuerlich bedeutsame Unterlagen, die weder Buch/Aufzeichnung/Inventar/Bilanz/Lagebericht/Eröffnungsbilanz/Organisationsunterlage noch Buchungsbeleg noch Handels-/Geschäftsbrief sind.
- **Frist:** 6 Jahre, gemäß §5 (Tabelle).
- **Boundary zu Buchungsbelegen:** Eine Unterlage darf nicht gleichzeitig als Handels-/Geschäftsbrief **und** als Buchungsbeleg klassifiziert werden, wenn sie fachlich Buchungsbeleg-Charakter trägt; es gilt dann die Buchungsbeleg-Klasse mit 8 Jahren.
- **Boundary zu „sonstige Unterlagen":** Die Auffangklasse darf nicht zur Umgehung höherer Fristen verwendet werden. Liegt im Einzelfall Buchungsbeleg-Charakter, Handels-/Geschäftsbrief-Charakter oder eine 10-jährige Klasse vor, gilt die jeweilige spezifische Klasse.
- **F0-D4 / F1-D1 / F1-D2-Wahrung:** Diese Klassifikationen dürfen Festschreibungs-Tatsachen und USt-Werte weder erzeugen, ändern noch überschreiben.

V1.0 dieses Artefakts entwirft **keine** operative Erkennungslogik und **keine** Auffang-Heuristik.

---

## 9. Lohnkonten-Grenze

Auf Boundary-Ebene:

- Lohnkonten unterliegen einer **eigenständigen sechsjährigen** Aufbewahrungslogik nach EStG § 41.
- V1.0 dieses Artefakts behandelt Lohnkonten **ausschließlich als Grenzverweis**.
- Die fachliche Detailbehandlung (Lohnkonten-spezifische Pflicht- und Inhaltsmerkmale, Lohnsteuer-Außenprüfung, DLS) verbleibt im **Lohn-DLS-Folgeartefakt**; V1.0 dieses Artefakts entwirft hierzu nichts.
- F3-D1 ist insoweit berührt, als die Lohnsteuer-Außenprüfung außerhalb des MVP liegt und im Lohn-DLS-Folgeartefakt vertieft wird; V1.0 dieses Artefakts schwächt F3-D1 nicht.
- Die Lohnkonten-Klasse darf **nicht** zur Verkürzung anderer einschlägiger Aufbewahrungspflichten verwendet werden, soweit Unterlagen parallel als Buchungsbelege, Handels-/Geschäftsbriefe oder „sonstige für die Besteuerung bedeutsame Unterlagen" einschlägig wären; in solchen Konstellationen gelten zusätzlich oder vorrangig die jeweiligen Klassen aus §5.

---

## 10. Unaufgelöste Klassifizierung

Auf Boundary-Ebene:

- **Definition:** „Unaufgelöste Klassifizierung" ist der fachliche Boundary-Zustand einer Unterlage, deren Zuordnung zu einer der Klassen aus §5 / §6 / §7 / §8 / §9 **offen** oder **zweifelhaft** ist. Eingeschlossen sind insbesondere offene Lieferschein-Sub-Klassen-Zuordnungen sowie offene Buchungsbeleg-Charakter-Beurteilungen.
- **Wirkung:** Solange dieser Zustand besteht, ist die Eingangsgröße für die Sperrgrund-Klasse „Unaufgelöste Klassifizierung" gemäß Lösch-/Sperrkonzept-Artefakt V1.0 §7 erfüllt. Eine Löschung der betroffenen Unterlage ist auf Boundary-Ebene **ausgeschlossen**, bis die Klassifikation aufgelöst ist.
- **Auflösung:** Die Auflösung des Zustands ist eine **fachliche Dokumentenkategorie-Entscheidung** im Einzelfall. V1.0 dieses Artefakts entwirft **keinen** Workflow, **keine** Eskalationspfade, **keine** Rollen, **keine** UI-Statusse und **keine** Datenmodell-Markierung.
- **Negativ-Boundary:** „Unaufgelöste Klassifizierung" ist auf Boundary-Ebene **kein** Datenbankwert, **kein** Enum, **kein** Status-Code, **kein** UI-Label und **keine** Job-Trigger-Bedingung. Diese Entscheidungen verbleiben downstream.
- **Konsistenzregel:** Eine Klassifikation darf nicht in „Unaufgelöste Klassifizierung" verbleiben, um eine Lösch-/Sperr-Entscheidung dauerhaft zu vermeiden, wenn die fachliche Zuordnung im Einzelfall objektiv möglich ist; ein dauerhaftes Schwebenlassen ist auf Boundary-Ebene unzulässig.

---

## 11. Verhältnis zu Retention V1.0 und Lösch-/Sperrkonzept V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Regelmatrix → Retention V1.0** | Die Regelmatrix spiegelt die Kategorien und Fristen aus Retention V1.0 §4. Sie führt keine eigene Frist ein. Bei Abweichung gilt Retention V1.0. |
| **Regelmatrix → Lösch-/Sperrkonzept V1.0** | Die Regelmatrix liefert die fachliche Klassifikation als **Eingangsgröße** für Lösch-/Sperrentscheidungen gemäß Lösch-/Sperrkonzept V1.0 §4 / §7 / §8 / §10. Die Regelmatrix entscheidet **nicht selbst** über Löschung oder Sperrung. |
| **Regelmatrix ↔ Sperrgrund-Taxonomie** | Die Klasse „Unaufgelöste Klassifizierung" gemäß §10 dieses Artefakts ist die Boundary-Eingangsgröße zur gleichnamigen Sperrgrund-Klasse aus Lösch-/Sperrkonzept V1.0 §7. |
| **Regelmatrix ↔ Legal Hold / Festsetzungsfrist / steuerliche Bedeutung** | Die Regelmatrix erkennt diese Boundaries an, ändert sie aber nicht. Solange Legal Hold besteht oder die Festsetzungsfrist / steuerliche Bedeutung im Einzelfall fortbesteht, ist eine Löschung trotz formal abgelaufener Frist gemäß Lösch-/Sperrkonzept V1.0 §6 / §7 / §8 / §12 ausgeschlossen. |
| **Fristablauf ≠ Lösch-Erlaubnis** | Die Klassifikation und das daraus abgeleitete Frist-Mapping legen ausschließlich die Untergrenze der Aufbewahrungspflicht fest. Der Ablauf der gesetzlichen Aufbewahrungsfrist allein berechtigt nicht zur Löschung. Es ist zusätzlich zu prüfen: Legal Hold, Sperrgrund gemäß Lösch-/Sperrkonzept V1.0 §7, fortbestehende steuerliche Bedeutung / Festsetzungsfrist im Einzelfall, finale Klassifikation. |
| **Keine automatische Löschung** | V1.0 dieses Artefakts erlaubt keine automatische Löschung allein auf Basis einer Klassifikation. Die Lösch-/Sperrentscheidung verbleibt im Lösch-/Sperrkonzept V1.0. |

---

## 12. Verhältnis zu gesperrten Harouda-Boundaries

Die Regelmatrix wahrt strikt:

| Lock | Wahrung in der Regelmatrix |
|---|---|
| **F0-D4 Festschreibung** | Klassifikation erzeugt, ändert oder entfernt keine Festschreibungs-Tatsache. F0-D4 bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Klassifikation ist mandantenscharf; mandantenübergreifende Aussagen sind ausgeschlossen. |
| **F0-D7 Plattform-Admin-Grenze** | Plattform-Administration ist rein technische Rolle; sie trifft keine Klassifikations-Entscheidung. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Klassifikation erzeugt, ändert oder überschreibt keine USt-Werte. F1-D1/F1-D2 bleiben autoritative USt-Wahrheitsquelle. |
| **F3-D1 Z3-/Datenüberlassung** | Klassifikation berührt keinen Z3-Export; sie definiert kein Z3-Format und keinen Behörden-Auslieferungs-Workflow. |
| **F3-D2 DR/Restore** | Klassifikation berührt kein DR-Backup-Modell, keine RPO/RTO und keinen Restore-Modus. Aufbewahrungs-/Retention-Archiv ≠ DR-Backup bleibt erhalten. |
| **F3-D3 Migration** | Klassifikation berührt keine Migrations-Mechanik; sie ändert weder Cutover-Boundary noch Quellpaket-Logik. Migration ≠ native Re-Festschreibung bleibt erhalten. |
| **F3-Closing** | Klassifikation respektiert die F3-Closing-Boundaries: Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. V1.0 dieses Artefakts wirkt nicht auf den Locked Decisions Register zurück.

---

## 13. Audit-/Nachweis-Boundary

Auf Boundary-Ebene gilt:

- **Klassifikations-Entscheidungen müssen rekonstruktierbar bleiben.**
- Der **Nachweis** je Entscheidung muss auf fachlicher Ebene mindestens enthalten:
  - die zugeordnete fachliche Klasse gemäß §5 / §6 / §7 / §8 / §9;
  - die zugehörige Frist und Quelle gemäß §5 (Tabelle);
  - im Lieferschein-Fall die zugeordnete Sub-Klasse gemäß §6;
  - die Begründung der Klassifikation auf Boundary-Ebene (z. B. „Buchungsbeleg-Charakter im Sinne von AO § 147 Abs. 1 Nr. 4 erfüllt" / „Handels-/Geschäftsbrief-Charakter erfüllt" / „Auffangklasse: sonstige für die Besteuerung bedeutsame Unterlage" / „Lohnkonto: Grenzverweis EStG § 41");
  - den Zeitpunkt der Klassifikations-Entscheidung;
  - das auslösende Subjekt bzw. die Rolle und die zugehörige Autorisierungs-Grundlage.
- **Die Klassifikations-Audit-Spur ist getrennt** von Sicherheits-Audit-Spuren und buchführungs-/GoBD-Audit-Spuren zu führen; eine Boundary-Verschmelzung ist ausgeschlossen.
- **Konkrete Log-Schemata, Datenmodelle, Aufbewahrungsorte oder Werkzeuge** für die Nachweisführung sind **Non-Scope** und werden downstream entschieden.

---

## 14. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 14.1 | Eine Löschung wird auf Basis einer **unaufgelösten Klassifizierung** vorgenommen oder vorgesehen. |
| 14.2 | V1.0 dieses Artefakts trifft eine eigenständige rechtliche oder steuerfachliche Auslegung, die über die in Retention V1.0 / Lösch-/Sperrkonzept V1.0 paraphrasierten Quellen hinausgeht. |
| 14.3 | V1.0 dieses Artefakts enthält Implementierung, Schema, Datenmodell, Programmcode, Pseudocode, Algorithmus-Design, SQL, Query-Spezifikation oder API-Definition. |
| 14.4 | V1.0 dieses Artefakts enthält Enum-Werte, Status-Codes, Datenbank-Bezeichner oder UI-Labels. |
| 14.5 | V1.0 dieses Artefakts entwirft eine automatische Klassifikations-, Lösch- oder Sperrlogik (Scheduler, Trigger, Pipelines, Jobs). |
| 14.6 | V1.0 dieses Artefakts trifft eine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl. |
| 14.7 | V1.0 dieses Artefakts behauptet eine rechtliche, steuerfachliche, DSB-, Aufsichts-, Sicherheits-, Zertifizierungs- oder Produktivfreigabe, die nicht tatsächlich vorliegt. |
| 14.8 | V1.0 dieses Artefakts schwächt, umdeutet oder umgeht F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 14.9 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 14.10 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder behauptet eine Register-Verankerung in §6, die nicht existiert. |
| 14.11 | V1.0 dieses Artefakts ersetzt das Lösch-/Sperrkonzept-Artefakt V1.0 oder entwirft eigene Lösch-/Sperrlogik. |
| 14.12 | V1.0 dieses Artefakts entwirft Lohnkonten-Detail über den Grenzverweis hinaus, Z3-/Datenüberlassungs-Format, DR-/HA-/BCM-Design oder Migrations-Implementierung. |
| 14.13 | V1.0 dieses Artefakts trifft eine rechtliche Würdigung von Crypto-Shredding oder eine Einordnung als Löschung im Sinne DSGVO Art. 17 Abs. 1. |
| 14.14 | V1.0 dieses Artefakts erhöht die Forbidden-Reference-Baseline (BLOCKED ≠ 0 oder BASELINE_ALLOWED ≠ 62) oder verletzt die etablierten Terminologie- und Quality-Gate-Vorgaben des Repositorys (verbotene Tool-/Modell-/Anbieter-Begriffe, BOM, Arabisch, obsolete Sortierungsbezeichnung, generische Sicherheits-/Transport-Behauptungen, freistehende Konformitäts-Schlagwörter, Zertifizierungs- oder Marketing-Aussagen). |

---

## 15. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Implementierung jeglicher Art,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode, Pseudocode und Algorithmus-Design,
- SQL und Query-Spezifikation,
- automatische Klassifikations-, Lösch- oder Sperrjobs (Scheduler, Trigger, Pipelines),
- APIs und Schnittstellen-Verträge,
- Enum-Werte, Status-Codes, Datenbank-Bezeichner, UI-Labels,
- Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl,
- Rechtsgutachten oder Steuerauskunft im Einzelfall,
- DSB-, Sicherheits- oder Produktivfreigabe,
- Lohn-DLS-Detail (Lohnkonten verbleiben Grenzverweis),
- Z3-/Datenüberlassungs-Format,
- DR-/HA-/BCM-Design,
- Migrations-Implementierung,
- rechtliche Würdigung von Crypto-Shredding,
- Endfassung der Verfahrensdokumentation Kap. 6,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine Steuerauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; keine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; kein Z3-/Datenüberlassungs-Format; kein Incident-Response-Runbook; keine Implementierungs-Autorisierung jeglicher Art; keine Rechts- oder Steuerauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 16. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **Lösch-/Sperrprozess Operational-Detail-Folgeartefakt** — operative Mechanik (Workflows, Rollen, Eskalationen, technische Markierung der Klassifikations-Status), sofern als eigenständiges Artefakt geführt; alternativ Aufnahme in Verfahrensdokumentation Kap. 6.
- **Lohn-DLS-Folgeartefakt** — Detailbehandlung der Lohnkonten und Lohnsteuer-Außenprüfung; Voraussetzung für jede operative Detail-Aussage zu Lohnkonten.
- **Verfahrensdokumentation Kap. 6 (nächste Pflege)** — Aufnahme dieses Artefakts und der vorgelagerten V1.0-Lock-Artefakte (Retention, Lösch-/Sperrkonzept) per Verweis als vorgelagerte Spezifikationen.
- **Custody-Modell-Folgeartefakt** — konkrete Schlüsselverwaltung; nur indirekt relevant, soweit Klassifikations-Audit-Nachweise verschlüsselungs-/integritätsrelevante Eigenschaften tragen. Nicht Bestandteil dieses Artefakts.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34; nicht Bestandteil dieses Artefakts.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Ransomware-/Forensik-Workflow; nur indirekt relevant, soweit Klassifikations-Daten in Forensik-Kontexten zu schützen sind. Nicht Bestandteil dieses Artefakts.
- **Z3-/Datenüberlassungs-Spezifikations-Artefakt** — Behörden-Auslieferungs-Format; bleibt strikt von Klassifikation getrennt.
- **DR-/HA-/BCM-Folgeartefakt** — Verfügbarkeits- und Wiederherstellungsziele; bleibt strikt von Klassifikation und Aufbewahrung getrennt.

---

## 17. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für die fachliche Dokumentenkategorie- und Frist-Klassifikation in Harouda. Maßgeblich als Eingangsgröße für Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 und Lösch-/Sperrkonzept-Artefakt V1.0; maßgeblich für die Bezugnahme aus Verfahrensdokumentation Kap. 6 (im Rahmen ihrer nächsten Pflege). |
| **Bindend für** | Alle in §16 genannten Folgeartefakte, soweit sie auf Klassifikations-Eingaben aufsetzen; Verfahrensdokumentation Kap. 6 (nächste Pflege); alle nachgelagerten Detail-Artefakte zu Lösch-/Sperr- oder Aufbewahrungs-Themen. |
| **Nicht bindend für** | Konkrete Klassifikations-Logik. Operative Status-Codes oder Datenbankwerte. UI-/UX-Darstellung. Konkrete Lohn-DLS-Behandlung. Konkrete Lösch-/Sperrlogik. Z3-/Datenüberlassungs-Format. DR-/HA-/BCM-Design. Migrations-Implementierung. Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Modell-/Hardware-Wahl. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. |
| **STOP-Bedingungen** | **14** nummerierte STOP-Bedingungen (14.1 bis 14.14) gemäß §14. |
| **Boundaries** | Regelmatrix ≠ Implementierung. Regelmatrix ≠ Lösch-/Sperrentscheidung. Regelmatrix ≠ Retention V1.0 (sondern Spiegel- und Eingangsgröße). Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix (Konsistenz mit F3-Closing und Retention V1.0). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. |
| **Quellgrundlage** | AO § 147; HGB § 257; Art. 97 § 19a EGAO / Art. 95 EGHGB; EStG § 41 (Grenzverweis); GoBD (in der bereits in Retention V1.0 etablierten konsolidierten Basis); DSGVO Art. 17, 18 (Grenzverweise); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0; Lösch-/Sperrkonzept-Artefakt V1.0; Security-/Krypto-/Key-Custody-Artefakt V1.0 (indirekt); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. Bei Konflikt mit Retention V1.0 gilt Retention V1.0. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0. |
| **Verankerungs-Hinweis** | Die Dokumentenkategorie-/Retention-Regelmatrix ist im Locked Decisions Register V1.0 §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Bindungsgrundlage leitet sich ausschließlich ab aus Retention V1.0 §14 und Lösch-/Sperrkonzept V1.0 §11 / §14. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Lock-Aussage** | Dokumentenkategorie-/Retention-Regelmatrix V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Externe rechtliche bzw. steuerfachliche Validierung bleibt vor produktiver oder rechtsverbindlicher Anwendung erforderlich, soweit einschlägig. |

---

## 18. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der Klassifikations-Anker aus Retention V1.0 §4 und Lösch-/Sperrkonzept V1.0 §7 | in V1.0 enthalten |
| Review-Iteration | Schärfung der Buchungsbeleg-Abgrenzung, der Lieferschein-Sub-Klassen und der „Unaufgelöste Klassifizierung"-Boundary; Klarstellung des Verankerungs-Hinweises gegenüber dem Locked Decisions Register | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf das amtliche Quellpaket, die gesperrten Harouda-Registergrenzen, das Aufbewahrungs-/Retention-Archiv-Artefakt sowie das Lösch-/Sperrkonzept-Artefakt. Eine externe rechtliche bzw. steuerfachliche Validierung (Fachanwalt für Steuerrecht / Steuerberater / Datenschutzbeauftragter) bleibt vor produktiver oder rechtsverbindlicher Anwendung erforderlich, soweit einschlägig.
