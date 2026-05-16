# Extract: dokumentenkategorie-retention-regelmatrix-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/dokumentenkategorie-retention-regelmatrix-v1.md
- Dateigröße: 32.8 KB
- Zeilenanzahl: 321
- Erstellt am: 2026-05-08T23:17:36+02:00
- Erste H1-Überschrift im Dokument: Dokumentenkategorie-/Retention-Regelmatrix — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der fachlichen Klassifikations-Boundary je Dokumenten-/Vorgangstyp als Eingangsgröße für das Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 und das Lösch-/Sperrkonzept-Artefakt V1.0.

## 3. Hauptthemen (max 5 Bullet Points)
- Fachliche Klassifikations-Boundary je Dokumenten-/Vorgangstyp (Kategorie-/Frist-Matrix)
- Lieferschein-Klassifizierung (Sub-Klassen-Boundary)
- Buchungsbeleg-Abgrenzung sowie Handels-/Geschäftsbrief- und sonstige-Unterlagen-Abgrenzung
- Lohnkonten-Grenzverweis (EStG § 41) und „Unaufgelöste Klassifizierung"-Boundary
- Schnittstelle zu Lösch-/Sperrkonzept V1.0 und Wahrung gesperrter Harouda-Boundaries (F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing)

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(Die Spec stellt explizit fest, dass „Implementierung, Datenmodell, Schema, Enum-/Status-Werte, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL" Non-Scope sind; §14.3, §14.4 und §15 verbieten ausdrücklich Schemas, Enum-Werte und Datenbank-Bezeichner.)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(Die Spec stellt explizit fest, dass „die operative Klassifikations-Mechanik (Workflows, Rollen, Eskalationen, technische Markierung)" durch V1.0 nicht gesperrt wird; §10 weist die Auflösung der „Unaufgelösten Klassifizierung" ausdrücklich downstream.)

## 6. Rechtsgrundlagen-Erwähnungen
- "AO § 147" — Aufbewahrungspflichten und -fristen für steuerlich relevante Unterlagen, einschließlich der ab 01.01.2025 für Buchungsbelege auf 8 Jahre verkürzten Frist.
- "AO § 147 Abs. 1 Nr. 1 / Abs. 3" — 10-Jahres-Klasse für Bücher, Aufzeichnungen, Inventare, Bilanzen, Jahresabschlüsse, Lageberichte, Eröffnungsbilanzen, Arbeitsanweisungen und sonstige Organisationsunterlagen.
- "AO § 147 Abs. 1 Nr. 2 / Abs. 3" — 6-Jahres-Klasse für empfangene Handels- und Geschäftsbriefe.
- "AO § 147 Abs. 1 Nr. 3 / Abs. 3" — 6-Jahres-Klasse für Wiedergaben abgesandter Handels- und Geschäftsbriefe.
- "AO § 147 Abs. 1 Nr. 4" — Definition Buchungsbeleg; 8-Jahres-Frist gemäß §5 / §7 dieses Artefakts.
- "AO § 147 Abs. 1 Nr. 5 / Abs. 3" — 6-Jahres-Klasse für sonstige für die Besteuerung bedeutsame Unterlagen (Auffangkategorie).
- "AO § 147 Abs. 3 Satz 5" — Hemmungsklausel für Aufbewahrungsfristen.
- "HGB § 257" — Handelsrechtliche Aufbewahrungspflichten parallel zur abgabenrechtlichen Systematik.
- "HGB § 257 Abs. 1 Nr. 1 / Abs. 4" — handelsrechtliche 10-Jahres-Klasse.
- "HGB § 257 Abs. 1 Nr. 2 / Abs. 4" — handelsrechtliche 6-Jahres-Klasse für empfangene Briefe.
- "HGB § 257 Abs. 1 Nr. 3 / Abs. 4" — handelsrechtliche 6-Jahres-Klasse für Wiedergaben abgesandter Briefe.
- "HGB § 257 Abs. 1 Nr. 4 / Abs. 4" — handelsrechtliche Buchungsbeleg-Frist.
- "Art. 97 § 19a EGAO" — Übergangsregel für die Verkürzung von 10 auf 8 Jahre für Buchungsbelege.
- "Art. 97 § 19a Abs. 3 EGAO" — verzögerte Anwendung für KWG-/VAG-/WpIG-Institute.
- "Art. 95 EGHGB" — handelsrechtliche Übergangsregel parallel zu Art. 97 § 19a EGAO.
- "EStG § 41" — sechsjährige Aufbewahrung der Lohnkonten (Grenzverweis; Detail im Lohn-DLS-Folgeartefakt).
- "DSGVO Art. 17" — Recht auf Löschung; Abs. 3 lit. b sperrt vorzeitige Löschung bei gesetzlicher Aufbewahrungspflicht (Grenzverweis).
- "DSGVO Art. 17 Abs. 1" — wird in STOP-Bedingung §14.13 als Maßstab für rechtliche Würdigung von Crypto-Shredding referenziert (selbst keine Würdigung in V1.0).
- "DSGVO Art. 18" — Recht auf Einschränkung der Verarbeitung; abgrenzbar von Löschung (Grenzverweis).
- "GoBD" — Grundsätze zu Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, Richtigkeit (Boundary-Verweis in der bereits in Retention V1.0 etablierten konsolidierten Basis).

## 7. Rule-ID-Erwähnungen
Keine Rule-IDs erwähnt.

(Die Spec verwendet Lock-Bezeichner wie „F0-D4", „F0-D6", „F0-D7", „F1-D1", „F1-D2", „F3-D1", „F3-D2", „F3-D3", „F3-Closing" sowie „§28.11-bet" als Register-Marker; diese entsprechen nicht dem Rule-ID-Muster `RULE-[A-Z]+-\d+`.)

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Klassifikation ist eine fachliche Dokumentenkategorie-Entscheidung, keine Implementierungs- oder Datenmodellregel."
- "Jede Klassifikation muss konsistent mit Retention V1.0 §4 (Kategorien und Fristen) und Retention V1.0 §5 (Fristbeginn, Hemmung) sein."
- "Klassifikation entscheidet nicht über Löschung oder Sperrung. Diese Entscheidung verbleibt im Lösch-/Sperrkonzept V1.0."
- "Plattform-Administration trifft keine Klassifikations-Entscheidung. Plattform-Admin ist rein technische Rolle gemäß F0-D7."
- "Klassifikation ist mandantenscharf. Mandantenübergreifende Klassifikations-Aussagen sind ausgeschlossen (F0-D6)."
- "Klassifikation darf F0-D4 Festschreibung nicht verändern. Festschreibungs-Tatsachen werden durch Klassifikation weder erzeugt noch entfernt noch verfälscht."
- "Die Matrix ist eine boundary-level Spiegelung und führt keine eigene Frist ein, die nicht in Retention V1.0 verankert ist."
- "Fristablauf ≠ Lösch-Erlaubnis" — der Ablauf der gesetzlichen Aufbewahrungsfrist allein berechtigt nicht zur Löschung.
- "Keine automatische Löschung" — V1.0 erlaubt keine automatische Löschung allein auf Basis einer Klassifikation.
- "Regelmatrix ≠ Implementierung. Regelmatrix ≠ Lösch-/Sperrentscheidung. Regelmatrix ≠ Retention V1.0 (sondern Spiegel- und Eingangsgröße)."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- §1 / §17: „§28.11-bet bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht."
- §10: „Unaufgelöste Klassifizierung" als Boundary-Zustand mit „offen" oder „zweifelhaft" — bewusste Boundary-Lücke; Auflösung verbleibt downstream.
- §16: Offene Detail-Entscheidungen / Folgeartefakte: „Lösch-/Sperrprozess Operational-Detail-Folgeartefakt", „Lohn-DLS-Folgeartefakt", „Verfahrensdokumentation Kap. 6 (nächste Pflege)", „Custody-Modell-Folgeartefakt", „DSGVO-/Datenpannen-Folgeartefakt", „Cybersecurity-Incident-Response-Folgeartefakt", „Z3-/Datenüberlassungs-Spezifikations-Artefakt", „DR-/HA-/BCM-Folgeartefakt".

## 10. Verweise auf andere Specs
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (direkte Lock-Basis, §14)
- Lösch-/Sperrkonzept-Artefakt V1.0 (direkte Lock-Basis / Schnittstelle, §7, §11, §14)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (indirekte Lock-Basis für Boundary-Wahrung)
- Lohn-DLS-Folgeartefakt (Grenzverweis für EStG § 41)
- DSGVO-/Datenpannen-Folgeartefakt (Operationalisierung DSGVO Art. 33/34; nicht Bestandteil)
- Cybersecurity-Incident-Response-Folgeartefakt (Ransomware-/Forensik-Workflow; nicht Bestandteil)
- Z3-/Datenüberlassungs-Spezifikations-Artefakt (Behörden-Auslieferungs-Format; getrennt)
- DR-/HA-/BCM-Folgeartefakt (Verfügbarkeits-/Wiederherstellungsziele; getrennt)
- Custody-Modell-Folgeartefakt (Schlüsselverwaltung; indirekt)
- Verfahrensdokumentation Kap. 6 (nächste Pflege)
- Harouda Locked Decisions Register V1.0 (§6 Open Folgeartefakte)

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(Die Spec verbietet ausdrücklich Datenbank-/Dateisystem-Schema, SQL, Programmcode, Pseudocode, APIs, UI/UX, Enum-Werte sowie jede Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl (§14.3–§14.6, §15). PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
