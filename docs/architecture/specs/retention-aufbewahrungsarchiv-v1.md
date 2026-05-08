# Aufbewahrungs-/Retention-Archiv-Artefakt — V1.0

**Lock-Aussage:** Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 — accepted. Status: locked. No further review round.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | Aufbewahrungs-/Retention-Archiv-Artefakt |
| Version | V1.0 |
| Status | Locked (gemäß V1.0-Lock-Review) |
| Charakter | Internes Planungs- und Spezifikationsartefakt (Architektur-/Spezifikationsebene) |
| Zweck | Festlegung der fachlichen Grenzen, Kategorien, Fristen und Abgrenzungen der gesetzlichen Aufbewahrung in Harouda |
| Scope | Fachliche Definition der Retention-Kategorien, Fristen, Fristlogik, Unveränderbarkeit und Abgrenzungen gegen benachbarte Systeme |
| Non-Scope | Implementierung, Speichertechnologie, Schema, UI, Code, SQL, Z3-/Datenüberlassungs-Format, DR-/HA-/BCM-Design, Migration, Migrations-Rollback, Endfassung Verfahrensdokumentation Kap. 6, Lohn-Tiefe, Datenschutz-Vorfallsprozess, Rechtsauskunft |
| Lock-Basis | Draft V0.1, Patch V0.2, V1.0-Lock-Review, amtliches Quellpaket sowie die gesperrten Harouda-Registergrenzen (F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-Closing) |
| Vorrang-Regel | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Beschaffung, keine Schema- oder Speicherentscheidung. |

---

## 2. Zweck und fachliche Rolle

Das Aufbewahrungs-/Retention-Archiv-Artefakt definiert die fachlichen Grenzen und Anforderungen an die gesetzlich vorgeschriebene Aufbewahrung steuer- und handelsrechtlich relevanter Unterlagen innerhalb von Harouda.

Es ist ein **Planungs- und Spezifikationsartefakt**. Es trifft keine technische Entscheidung, beschreibt keine Speicherform und ersetzt keine bestehende Lockfassung.

Das Artefakt liegt fachlich **vor** Kapitel 6 der Verfahrensdokumentation („Aufbewahrung, Archivierung, Datensicherung, Datenschutz, Auslagerung"), ersetzt dieses jedoch nicht. Kapitel 6 der Verfahrensdokumentation kann dieses Artefakt später per Verweis konsumieren; bis dahin bleibt es eigenständige Spezifikationsgrundlage.

Das Artefakt grenzt **Aufbewahrung** klar ab gegen:

- DR-/HA-/BCM-Funktionen (Wiederanlauf, Datensicherung, Notfallbetrieb),
- Z3-/Datenüberlassung (Außenprüfung, GDPdU/Z3),
- Migration und Migrations-Rollback,
- operativen Belegspeicher / Dokumentenablage im Tagesbetrieb.

---

## 3. Authoritative Source Basis

Die folgende Tabelle benennt die maßgeblichen Quellen. Es werden ausschließlich kurze, repository-sichere Zusammenfassungen verwendet; Originaltext wird nicht übernommen.

| Quelle | Inhalt (Kurzform, paraphrasiert) |
|---|---|
| AO § 147 | Aufbewahrungspflichten und -fristen für steuerlich relevante Unterlagen, einschließlich der ab 01.01.2025 für Buchungsbelege auf 8 Jahre verkürzten Frist |
| HGB § 257 | Handelsrechtliche Aufbewahrungspflichten und -fristen, parallel zur abgabenrechtlichen Systematik |
| Art. 97 § 19a EGAO | Anwendungs- und Übergangsregeln zur verkürzten Aufbewahrungsfrist; insbesondere Abs. 3 zur verzögerten Anwendung für Institute nach KWG, VAG und WpIG |
| Art. 95 EGHGB | Korrespondierende handelsrechtliche Übergangsregelung zur verkürzten Aufbewahrungsfrist und zur verzögerten Anwendung für KWG-/VAG-/WpIG-Adressaten |
| GoBD (konsolidierte Basis gemäß BMF Amtliches AO-Handbuch 2025 Anhang 33), in der Fassung der Änderungs-Schreiben vom 11.03.2024 und 14.07.2025 | Grundsätze zur Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, Richtigkeit, Ordnung, Zeitgerechtigkeit, Maschinellen Auswertbarkeit; Verfahrensdokumentation; Belegfunktion und IKS |
| BMF-Schreiben vom 14.07.2025 | GoBD-Konkretisierungen für strukturierte E-Rechnungen (insb. Aufbewahrung des strukturierten Teils, Verhältnis Bild-/Inhaltsidentität) |
| EStG § 41 | Sechsjährige Aufbewahrung der Lohnkonten — ausschließlich als Grenzverweis; vertieft im Lohn-DLS-Folgeartefakt |
| UZK Art. 15 Abs. 1, Art. 163 | Unionszollrechtliche Mitwirkungs- und Vorlagepflichten — Grenzverweis im Rahmen von AO § 147 Abs. 1 Nr. 4a |
| DSGVO Art. 17 | Recht auf Löschung; Abs. 3 lit. b: gesetzliche Aufbewahrungspflicht sperrt vorzeitige Löschung — Grenzverweis |
| DSGVO Art. 20 | Recht auf Datenübertragbarkeit — Grenzverweis; beendet keine Aufbewahrungspflicht |
| DSGVO Art. 32 | Sicherheit der Verarbeitung (Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit) — Grenzverweis; verschmilzt nicht mit DR oder Archiv |
| DSGVO Art. 33 / 34 | Meldepflichten bei Datenschutzverletzungen — Grenzverweis; eigener Datenschutz-Vorfallsprozess |

GoBD-Randziffern, die in diesem Artefakt referenziert werden, stützen sich ausschließlich auf:

- Rz. 58–60, 87–94, 107–111, 113 ff., 142–144 — aus dem amtlichen BMF AO-Handbuch 2025 Anhang 33 (konsolidierte Basis).
- Rz. 76, 118, 119 — in der Fassung des BMF-Änderungs-Schreibens vom 14.07.2025.

Weitere Randziffern werden in V1.0 nicht zitiert.

---

## 4. Retention-Kategorien und Fristen

| Kategorie | Frist | Rechtsgrundlage (Kurz) | Anmerkung |
|---|---|---|---|
| Bücher und Aufzeichnungen, Inventare, Jahresabschlüsse, Lageberichte, Eröffnungsbilanzen sowie zu deren Verständnis erforderliche Arbeitsanweisungen und sonstige Organisationsunterlagen; handelsrechtlich zusätzlich Konzernabschlüsse/-lageberichte, soweit einschlägig | 10 Jahre | AO § 147 Abs. 1 Nr. 1 / Abs. 3; HGB § 257 Abs. 1 Nr. 1 / Abs. 4 | Frist beginnt mit Schluss des Kalenderjahres, in dem die letzte Eintragung erfolgt bzw. der Abschluss aufgestellt ist |
| Zollrechtlich relevante Unterlagen, soweit einschlägig | 10 Jahre | Unterlagen nach Art. 15 Abs. 1 und Art. 163 Unionszollkodex, soweit unter AO § 147 Abs. 1 Nr. 4a fallend | Grenzverweis; keine zollrechtliche Architektur in diesem Artefakt |
| Buchungsbelege | 8 Jahre | AO § 147 Abs. 1 Nr. 4 / Abs. 3; HGB § 257 Abs. 1 Nr. 4 / Abs. 4 | Verkürzung von 10 auf 8 Jahre; allgemeine Anwendung gemäß Art. 97 § 19a EGAO und Art. 95 EGHGB |
| Empfangene und Wiedergaben abgesandter Handels- und Geschäftsbriefe sowie sonstige für die Besteuerung bedeutsame Unterlagen | 6 Jahre | AO § 147 Abs. 1 Nr. 2, 3, 5 / Abs. 3; HGB § 257 Abs. 1 Nr. 2, 3 / Abs. 4 | |
| Lohnkonten | 6 Jahre | EStG § 41 | Sondernorm; Detail im Lohn-DLS-Folgeartefakt; in diesem Artefakt nur Grenzverweis |

**Übergangsregel (allgemein):**
Die verkürzte 8-Jahres-Frist für Buchungsbelege ist erstmals auf Unterlagen anzuwenden, deren bisherige zehnjährige Aufbewahrungsfrist am 31.12.2024 noch nicht abgelaufen war (Art. 97 § 19a EGAO; Art. 95 EGHGB). Für vor diesem Stichtag bereits abgelaufene Fristen tritt durch die Verkürzung keine Reaktivierung ein.

**Übergangsregel (KWG, VAG, WpIG — verzögerte Anwendung):**
Für Institute nach KWG, VAG und WpIG gilt die auf acht Jahre verkürzte Aufbewahrungsfrist für Buchungsbelege verzögert; sie ist gemäß Art. 97 § 19a Abs. 3 EGAO und Art. 95 EGHGB erstmals auf Unterlagen anzuwenden, deren bisherige zehnjährige Frist am 1. Januar 2026 noch nicht abgelaufen ist. Es handelt sich um eine **verzögerte Anwendung**, **nicht** um eine dauerhafte Ausnahme.

**Lieferschein-Sonderfall:**

- Empfangene Lieferscheine, die keine Buchungsbelege im Sinne von AO § 147 Abs. 1 Nr. 4 sind, enden in ihrer Aufbewahrungspflicht mit Erhalt der zugehörigen Rechnung.
- Abgesandte Lieferscheine, die keine Buchungsbelege im Sinne von AO § 147 Abs. 1 Nr. 4 sind, enden in ihrer Aufbewahrungspflicht mit Versand der zugehörigen Rechnung.
- Soweit ein Lieferschein selbst Buchungsbeleg ist oder steuerlich eigenständige Bedeutung behält, gilt diese verkürzte Sonderbehandlung **nicht**; es greifen die regulären Fristen nach dieser Tabelle.
- Die Zuordnung eines Lieferscheins zur jeweiligen Kategorie ist eine **fachliche Dokumentenkategorie-Entscheidung** und keine Implementierungsregel.

---

## 5. Retention-Clock und Ablauf-Logik

**Fristbeginn.**
Die Aufbewahrungsfrist beginnt mit Ablauf des Kalenderjahres, in dem die letzte Eintragung in das Buch gemacht, das Inventar/der Abschluss/der Lagebericht aufgestellt, der Handels- oder Geschäftsbrief empfangen oder abgesandt oder der Buchungsbeleg entstanden ist (AO § 147 Abs. 4; HGB § 257 Abs. 5).

**Hemmung des Fristablaufs.**
Die Aufbewahrungsfrist läuft gemäß AO § 147 Abs. 3 Satz 5 nicht ab, soweit und solange die Unterlagen für Steuern von Bedeutung sind, für die die Festsetzungsfrist noch nicht abgelaufen ist. Maßgeblich ist die fortbestehende steuerliche Bedeutung der Unterlagen und/oder das Fortbestehen der Festsetzungsfrist im Einzelfall.

Tatbestände wie laufende Außenprüfungen, anhängige Einspruchs- oder Klageverfahren, Steuerstraf- oder Bußgeldverfahren mit Bezug zur Unterlage oder unterlagenbezogene behördliche Anordnungen können den Ablauf der Aufbewahrungsfrist hemmen — jedoch ausschließlich **soweit dadurch die steuerliche Bedeutung der Unterlagen und/oder die Festsetzungsfrist fortbesteht**. Ein pauschaler Hemmungsautomatismus, etwa allein aufgrund einer vorläufigen Steuerfestsetzung, wird in diesem Artefakt nicht unterstellt.

**Legal Hold.**
Solange ein Legal Hold besteht (Außenprüfung, anhängiges Verfahren, sonstiger rechtlicher Sicherungsanlass), darf eine Unterlage trotz formal abgelaufener Frist nicht gelöscht werden. Der Legal Hold ist als eigenständiger fachlicher Sperrgrund zu führen.

**Keine automatische Löschung.**
Eine automatische Löschung ohne nachweisbaren Ablauf der gesetzlichen Frist **und** ohne Prüfung des Legal-Hold-Status **und** ohne revisionssicheren Nachweis ist ausgeschlossen. Die konkrete Lösch-/Sperrlogik wird nicht in diesem Artefakt entworfen, sondern in einem separaten Lösch-/Sperrkonzept-Artefakt (siehe Abschnitt 14).

---

## 6. Archiv vs. benachbarte Systeme

### 6.1 Retention-Archiv vs. DR-Backup

| Dimension | Retention-Archiv | DR-Backup |
|---|---|---|
| Zweck | Erfüllung gesetzlicher Aufbewahrungspflicht | Wiederanlauf nach Störung/Ausfall |
| Zeitachse | Mehrjährig (6/8/10 Jahre + Hemmung) | Operativ (Stunden bis wenige Wochen, je nach RPO/RTO) |
| Inhalt | Aufbewahrungspflichtige Unterlagen in maschineller Auswertbarkeit | Betriebszustände, Datenbanken, Konfigurationen |
| Unveränderbarkeit | Pflicht (AO § 146 Abs. 4; HGB § 239 Abs. 3; GoBD) | Sicherungstechnisch konsistent, jedoch nicht im Sinne der GoBD-Unveränderbarkeit |
| Recovery-Modell | Lesezugriff über gesamte Frist | Wiederherstellung bis Recovery-Punkt |
| Gleichsetzung | **ausgeschlossen** | **ausgeschlossen** |

### 6.2 Retention-Archiv vs. Z3-/Datenüberlassung

| Dimension | Retention-Archiv | Z3-/Datenüberlassung |
|---|---|---|
| Zweck | Aufbewahrung | Bereitstellung für Außenprüfung |
| Auslöser | Gesetzliche Frist | Anforderung der Finanzbehörde |
| Format | Aufbewahrungsformate gemäß GoBD | Definiertes Z3-Format (außerhalb dieses Artefakts) |
| Lebenszyklus | Dauerhaft über Frist | Erstellt, übergeben, dokumentiert |
| Gleichsetzung | **ausgeschlossen** |  |

### 6.3 Retention-Archiv vs. Migration

| Dimension | Retention-Archiv | Migration |
|---|---|---|
| Zweck | Aufbewahrung | Überführung in neues System/Modell |
| Charakter | Dauerhaft passiv | Einmalig aktiv |
| Rollback | Nicht vorgesehen (keine Aufhebung der Frist) | Migrations-Rollback ist eigenes Konzept |
| Gleichsetzung | **ausgeschlossen** |  |

### 6.4 DR-Restore vs. Migrations-Rollback

DR-Restore und Migrations-Rollback sind **nicht** gleichzusetzen. DR-Restore betrifft den Wiederanlauf nach technischer Störung; Migrations-Rollback betrifft die Rückabwicklung einer geplanten Modell-/Systemänderung. Beide sind nicht Gegenstand dieses Artefakts.

### 6.5 Retention-Archiv vs. Verfahrensdokumentation

Die Verfahrensdokumentation (insb. Kap. 6) beschreibt die im Unternehmen tatsächlich angewendeten Verfahren. Das Retention-Archiv-Artefakt liefert die fachliche Vorgabe, an der sich Kap. 6 ausrichtet. Es ersetzt Kap. 6 nicht.

### 6.6 Retention-Archiv vs. operative Dokumentenablage

Die operative Dokumentenablage dient dem Tagesbetrieb (Bearbeitung, Wiederauffindbarkeit, Mandantenkommunikation). Sie ist keine retention-konforme Aufbewahrung im Sinne dieses Artefakts, solange nicht alle Anforderungen aus Abschnitt 7 nachweislich eingehalten sind.

### 6.7 Bezug zu gesperrten Harouda-Registergrenzen

| Gesperrte Grenze | Wirkung im Retention-Artefakt |
|---|---|
| F0-D4 Festschreibung | Retention verändert keine Festschreibung; Festschreibung bleibt autoritativ. |
| F0-D6 Mandantentrennung | Retention erhält Mandantentrennung; mandantenübergreifende Vermischung im Archiv ist ausgeschlossen. |
| F0-D7 Plattform-Admin-Grenze | Plattform-Administration ist ausschließlich technische Rolle; ein fachlicher Superuser im Retention-Archiv ist ausgeschlossen. |
| F1-D1 / F1-D2 USt-Wahrheit | Retention erzeugt keine USt-Werte; F1-D1/F1-D2 bleiben autoritative Quelle der USt-Wahrheit. |
| F3-Closing | Retention berührt die F3-Closing-Grenzen nicht; Closing-Logik bleibt autoritativ. |

---

## 7. Unveränderbarkeit, Nachvollziehbarkeit und Löschgrenze

**Unveränderbarkeit.**
Buchungen, Aufzeichnungen und Belege dürfen nach AO § 146 Abs. 4 und HGB § 239 Abs. 3 nicht in einer Weise verändert werden, dass der ursprüngliche Inhalt nicht mehr feststellbar ist. Die GoBD konkretisieren dies (insb. Rz. 58–60, 107–111).

**Protokollierung und Nachvollziehbarkeit.**
Änderungen müssen als solche kenntlich, mit Zeitpunkt, Verursacher und ursprünglichem Inhalt nachvollziehbar bleiben. Das Protokoll ist Teil der retention-pflichtigen Dokumentation, soweit es zur Nachvollziehbarkeit der aufzubewahrenden Unterlage erforderlich ist.

**Maschinelle Auswertbarkeit.**
Aufbewahrungspflichtige Unterlagen müssen während der gesamten Aufbewahrungsfrist maschinell auswertbar bleiben (GoBD, einschlägige Rz. aus Anhang 33). Eine reine Bildaufbewahrung ohne strukturierten Anteil ist bei strukturierter Ursprungsform unzureichend.

**Löschgrenze nach DSGVO.**
DSGVO Art. 17 Abs. 3 lit. b sperrt die vorzeitige Löschung, soweit eine gesetzliche Aufbewahrungspflicht besteht. Erst nach Ablauf der Aufbewahrungsfrist und Wegfall etwaiger Legal Holds ist eine Löschung oder Sperrung zulässig; das konkrete Löschverfahren wird in einem separaten Lösch-/Sperrkonzept geregelt.

**Keine Speichertechnologie-Festlegung.**
Speichertechnologie, Verschlüsselungsverfahren, Schlüsselverwaltung und Speicherort werden in diesem Artefakt **nicht** festgelegt.

---

## 8. E-Rechnung und strukturierte Daten — Grenze

Auf Basis des BMF-Schreibens vom 14.07.2025 und der dort angepassten GoBD-Randziffern (insb. Rz. 76, 118, 119):

- Bei strukturierten E-Rechnungen ist **inhaltliche Identität** zur Originalrechnung maßgeblich; eine bildliche (visuelle) Identität ist nicht zwingend erforderlich, soweit die maschinell auswertbaren Inhalte vollständig erhalten bleiben.
- Der **strukturierte Teil** der E-Rechnung ist aufzubewahren.
- Eine zusätzliche menschenlesbare Repräsentation ist nur dann aufzubewahren, wenn sie steuerlich relevante Zusatzinformationen enthält, die im strukturierten Teil nicht abgebildet sind.
- Die Aufbewahrung muss die Unveränderbarkeit, Vollständigkeit, Richtigkeit und maschinelle Auswertbarkeit durchgängig sicherstellen.

Dieses Artefakt definiert **nicht** das Verhalten eines Parsers, einer Validierung oder einer konkreten Format-Pipeline für strukturierte Rechnungen.

---

## 9. Lohn — Grenze

- Lohnkonten unterliegen einer **eigenständigen sechsjährigen** Aufbewahrungslogik nach EStG § 41.
- Lohnspezifische Metadaten, lohnsteuerliche Sonderfristen, sozialversicherungsrechtliche Aufbewahrungsbezüge sowie das Lohn-DLS verbleiben **außerhalb** dieses Artefakts.
- Das vorliegende Artefakt verzeichnet die Grenze; die fachliche Tiefe wird im Lohn-DLS-Folgeartefakt behandelt.

---

## 10. DSGVO — Grenze

| Norm | Wirkung an der Retention-Grenze |
|---|---|
| Art. 17 (Recht auf Löschung) | Wird durch gesetzliche Aufbewahrungspflicht gesperrt (Art. 17 Abs. 3 lit. b). Löschung erst nach Fristablauf und ohne Legal Hold. |
| Art. 20 (Datenübertragbarkeit) | Übertragung an Betroffene/andere Verantwortliche beendet die Aufbewahrungspflicht **nicht**. |
| Art. 32 (Sicherheit der Verarbeitung) | Stützt Vertraulichkeit, Integrität, Verfügbarkeit und Belastbarkeit der retention-pflichtigen Unterlagen, ist jedoch **kein** Ersatz für DR; DR und Archiv werden nicht verschmolzen. |
| Art. 33 / 34 (Meldepflichten bei Verletzung) | Eigenständiger Datenschutz-Vorfallsprozess; **nicht** Bestandteil dieses Artefakts. |

---

## 11. STOP-Bedingungen

Verbindliche Verbote auf Basis des Quellpakets und der gesperrten Harouda-Registergrenzen:

1. Kein DR-Backup als Substitut für das Retention-Archiv.
2. Keine Z3-/Datenüberlassung als Substitut für das Retention-Archiv.
3. Keine Retention-Löschung vor nachgewiesenem Ablauf der gesetzlichen Frist und vor abgeschlossener Legal-Hold-Prüfung.
4. Keine Verwendung veralteter rechtlicher Kurzformen anstelle der quellengebundenen Wortlaute (Art. 97 § 19a EGAO; Art. 95 EGHGB).
5. Keine Formulierung einer „dauerhaften 10-Jahres-Ausnahme" für KWG/VAG/WpIG; ausschließlich verzögerte Anwendung gemäß Art. 97 § 19a Abs. 3 EGAO und Art. 95 EGHGB.
6. Kein Archivverhalten, das die Festschreibung (F0-D4) verändert oder die USt-Wahrheit (F1-D1/F1-D2) berührt.
7. Keine mandantenübergreifende Vermischung im Archiv; F0-D6 bleibt autoritativ.
8. Kein fachlicher Superuser im Archiv; F0-D7 bleibt autoritativ (Plattform-Admin ist ausschließlich technisch).
9. Keine lohnspezifische Architektur in diesem Artefakt; Detail im Lohn-DLS-Folgeartefakt.
10. Keine Schema-, UI-, Code-, SQL-, Speicher-, Verschlüsselungs- oder Anbieterentscheidung in diesem Artefakt.
11. Keine GoBD-Randziffern-Zitate ohne Deckung in der konsolidierten Basis (BMF AO-Handbuch 2025 Anhang 33) bzw. im BMF-Schreiben vom 14.07.2025.
12. Keine Verwendung der überholten Sortier-Terminologie; ausschließlich „Sortierungsmarker" bzw. „Buchstabenmarker A–F", soweit benötigt.
13. Keine Zertifizierungs-, Marketing- oder Produktpositionierungs-Aussage.

---

## 12. Explizites Non-Scope

Dieses Artefakt enthält **nicht** und beabsichtigt **nicht**:

- Implementierung,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche,
- Programmcode,
- SQL,
- Speichertechnologie (Objektspeicher, WORM, Tape, sonstige),
- Verschlüsselungs- und Schlüsselverwaltungs-Design,
- Anbieter-, Werkzeug-, Plattform- oder Service-Wahl,
- Z3-/Datenüberlassungs-Format,
- DR-/HA-/BCM-Design,
- Migrations- oder Migrations-Rollback-Konzept,
- Endfassung der Verfahrensdokumentation Kap. 6,
- Datenschutz-Vorfallsprozess (DSGVO Art. 33/34),
- Rechtsgutachten oder verbindliche Rechtsauskunft.

**Klarstellung K-1:**
Dieses Artefakt ist ein internes Planungs- und Spezifikationsartefakt. Es ersetzt keine Rechtsauskunft. Eine produktive bzw. rechtsverbindliche operative Anwendung in rechtskritischen Punkten setzt eine fachliche Prüfung durch Steuerberater, Fachanwalt für Steuerrecht und/oder Datenschutzbeauftragten voraus.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; kein Verschlüsselungsverfahren und keine Schlüsselverwaltung; keine Anbieter-, Werkzeug-, Plattform-, Modell- oder Service-Wahl; kein Z3-/Datenüberlassungs-Format; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; keine Implementierungs-Autorisierung jeglicher Art; keine Rechtsauskunft.

---

## 13. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Planungs- und Spezifikationsartefakt für die fachlichen Grenzen der gesetzlichen Aufbewahrung in Harouda. Maßgeblich für die Ableitung nachgelagerter Folgeartefakte und für die Bezugnahme aus der Verfahrensdokumentation Kap. 6. |
| **Bindend für** | Alle nachgelagerten Folgeartefakte zu Aufbewahrung/Retention, das künftige Lösch-/Sperrkonzept-Artefakt, die künftige Dokumentenkategorie-/Retention-Regelmatrix sowie die Bezugnahme aus Verfahrensdokumentation Kap. 6 (im Rahmen ihrer nächsten Pflege). Bindend hinsichtlich der Abgrenzungen gegen DR-Backup, Z3-/Datenüberlassung, Migration, Migrations-Rollback und operative Dokumentenablage. |
| **Nicht bindend für** | Lohn-DLS-Folgeartefakt in seiner fachlichen Tiefe (nur Grenzverweis EStG § 41). DR-/HA-/BCM-Konzepte. Z3-/Datenüberlassungs-Format. Migrations-/Migrations-Rollback-Konzepte. Datenschutz-Vorfallsprozess (DSGVO Art. 33/34). Endfassung Verfahrensdokumentation Kap. 6. Branchenspezifische Sonderaufbewahrungen außerhalb der in Abschnitt 4 referenzierten Quellen. Rechtsauskunft im Einzelfall. |
| **STOP-Bedingungen** | **13** verbindliche STOP-Bedingungen gemäß Abschnitt 11. |
| **Boundaries** | Aufbewahrungs-/Retention-Archiv ≠ DR-Backup. Aufbewahrungs-/Retention-Archiv ≠ Z3-/Datenüberlassung. Aufbewahrungs-/Retention-Archiv ≠ Migration. DR-Restore ≠ Migrations-Rollback. Retention erzeugt keine USt-Werte (F1-D1/F1-D2 bleibt autoritativ). Retention verändert keine Festschreibung (F0-D4 bleibt autoritativ). Retention erhält Mandantentrennung (F0-D6 bleibt autoritativ). Plattform-Admin bleibt rein technische Rolle ohne fachlichen Superuser (F0-D7 bleibt autoritativ). F3-Closing-Grenzen bleiben unberührt. Lohn-Tiefe verbleibt im Lohn-DLS-Folgeartefakt. |
| **Quellgrundlage** | AO § 146, § 147 (insb. Abs. 1 Nr. 1, 2, 3, 4, 4a, 5; Abs. 3, 4); HGB § 238, § 239 Abs. 3, § 257; Art. 97 § 19a EGAO (insb. Abs. 3); Art. 95 EGHGB; GoBD (konsolidierte Basis gemäß BMF Amtliches AO-Handbuch 2025 Anhang 33), in der Fassung der Änderungs-Schreiben vom 11.03.2024 und 14.07.2025 (insb. Rz. 58–60, 76, 87–94, 107–111, 113 ff., 118, 119, 142–144); EStG § 41 (Grenzverweis); UZK Art. 15 Abs. 1, Art. 163 (Grenzverweis); DSGVO Art. 17, 20, 32, 33, 34 (Grenzverweise). |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks (F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-Closing) gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| **Lock-Aussage** | Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 — accepted. Status: locked. No further review round. |

---

## 14. Folgeartefakte

Folgende Folgeartefakte werden vorgesehen, jedoch durch diesen Lock **nicht** autorisiert oder spezifiziert:

- **Lohn-DLS-Folgeartefakt** — fachliche Tiefe der lohnsteuerlichen Aufbewahrung gemäß EStG § 41 sowie sozialversicherungsrechtliche Bezüge.
- **Lösch-/Sperrkonzept-Artefakt** — Mechanik der Löschung bzw. Sperrung nach Fristablauf, einschließlich Legal-Hold-Aufhebung und revisionssicherem Nachweis.
- **Dokumentenkategorie-/Retention-Regelmatrix** — fachliche Klassifizierungs-Kriterien (u. a. Lieferschein-Klassifizierung: wann Buchungsbeleg im Sinne von AO § 147 Abs. 1 Nr. 4 bzw. wann eigenständige steuerliche Bedeutung).
- **Verfahrensdokumentation Kap. 6 (nächste Pflege)** — Aufnahme dieses Artefakts per Verweis als vorgelagerte Spezifikation.

---

## 15. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung | abgelöst |
| Patch V0.2 | Konsolidierungs-Patch (Titel-Render, Datenüberlassung, Lieferschein-Sonderfall, Hemmungsklausel, Sortierungsmarker-Streichung, Zollverweis, Reviewfrage Nr. 6) | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung | **locked** |

Eine weitere Review-Runde ist für V1.0 nicht vorgesehen. Änderungen an den fachlichen Aussagen dieses Artefakts erfolgen nicht post-lock innerhalb dieser Fassung. Erforderliche spätere Änderungen sind ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf das amtliche Quellpaket und die gesperrten Harouda-Registergrenzen zulässig.
