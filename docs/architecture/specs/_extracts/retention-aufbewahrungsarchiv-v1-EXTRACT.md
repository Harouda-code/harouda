# Extract: retention-aufbewahrungsarchiv-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/retention-aufbewahrungsarchiv-v1.md
- Dateigröße: 23.7 KB
- Zeilenanzahl: 300
- Erstellt am: 2026-05-08T20:44:20+02:00
- Erste H1-Überschrift im Dokument: Aufbewahrungs-/Retention-Archiv-Artefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der fachlichen Grenzen, Kategorien, Fristen und Abgrenzungen der gesetzlichen Aufbewahrung in Harouda — als internes Planungs- und Spezifikationsartefakt vor Kapitel 6 der Verfahrensdokumentation, ohne Implementierungs- oder Speicher-Entscheidung.

## 3. Hauptthemen (max 5 Bullet Points)
- Retention-Kategorien und Fristen (10/8/6 Jahre) gemäß AO § 147, HGB § 257, EStG § 41
- Retention-Clock-Logik: Fristbeginn, Hemmung gemäß AO § 147 Abs. 3 Satz 5, Legal Hold, keine automatische Löschung
- Abgrenzung Retention-Archiv vs. DR-Backup, Z3-/Datenüberlassung, Migration und operativer Belegspeicher
- BEG-IV-Übergangsregeln gemäß Art. 97 § 19a EGAO / Art. 95 EGHGB (allgemeine Anwendung + verzögerte Anwendung für KWG-/VAG-/WpIG-Adressaten)
- Lieferschein-Sonderfall + Lösch-/Sperrlogik-Deferral an Lösch-/Sperrkonzept-Artefakt V1.0

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(§1 / Non-Scope listet ausdrücklich „Implementierung, Speichertechnologie, Schema, UI, Code, SQL, Z3-/Datenüberlassungs-Format, DR-/HA-/BCM-Design, Migration, Migrations-Rollback, Endfassung Verfahrensdokumentation Kap. 6, Lohn-Tiefe, Datenschutz-Vorfallsprozess, Rechtsauskunft".)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(Retention-Clock-Logik in §5 ist Boundary-Beschreibung, kein operativer Workflow; konkrete Lösch-/Sperrlogik wird ausdrücklich an Lösch-/Sperrkonzept-Artefakt verschoben.)

## 6. Rechtsgrundlagen-Erwähnungen
- "AO § 147" — Aufbewahrungspflichten und -fristen für steuerlich relevante Unterlagen, einschließlich der ab 01.01.2025 für Buchungsbelege auf 8 Jahre verkürzten Frist (§3, §4).
- "AO § 147 Abs. 1 Nr. 1 / Abs. 3" — 10-Jahres-Klasse für Bücher, Inventare, Jahresabschlüsse, Lageberichte, Eröffnungsbilanzen, Arbeitsanweisungen, Organisationsunterlagen (§4).
- "AO § 147 Abs. 1 Nr. 2, 3, 5 / Abs. 3" — 6-Jahres-Klassen für Handels-/Geschäftsbriefe sowie sonstige für die Besteuerung bedeutsame Unterlagen (§4).
- "AO § 147 Abs. 1 Nr. 4 / Abs. 3" — 8-Jahres-Frist für Buchungsbelege (§4).
- "AO § 147 Abs. 1 Nr. 4a" — Zollrechtlich relevante Unterlagen-Grenzverweis (§4).
- "AO § 147 Abs. 3 Satz 5" — Hemmungsklausel für Aufbewahrungsfristen (§5).
- "AO § 147 Abs. 4" — Fristbeginn-Regelung (§5).
- "HGB § 257" — Handelsrechtliche Aufbewahrungspflichten parallel zur abgabenrechtlichen Systematik (§3, §4).
- "HGB § 257 Abs. 1 Nr. 1–4 / Abs. 4" — handelsrechtliche Klassen (§4).
- "HGB § 257 Abs. 5" — Fristbeginn-Regelung (§5).
- "Art. 97 § 19a EGAO" — Übergangsregel für die Verkürzung von 10 auf 8 Jahre für Buchungsbelege (§3, §4).
- "Art. 97 § 19a Abs. 3 EGAO" — verzögerte Anwendung für KWG-/VAG-/WpIG-Institute (§4).
- "Art. 95 EGHGB" — handelsrechtliche Übergangsregel parallel zu Art. 97 § 19a EGAO (§3, §4).
- "EStG § 41" — Sechsjährige Aufbewahrung der Lohnkonten (§3, §4 Grenzverweis).
- "UZK Art. 15 Abs. 1, Art. 163" — Unionszollrechtliche Mitwirkungs- und Vorlagepflichten; Grenzverweis im Rahmen von AO § 147 Abs. 1 Nr. 4a (§3).
- "DSGVO Art. 17" — Recht auf Löschung; Abs. 3 lit. b: gesetzliche Aufbewahrungspflicht sperrt vorzeitige Löschung; Grenzverweis (§3).
- "DSGVO Art. 20" — Recht auf Datenübertragbarkeit; beendet keine Aufbewahrungspflicht; Grenzverweis (§3).
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; verschmilzt nicht mit DR oder Archiv; Grenzverweis (§3).
- "DSGVO Art. 33 / 34" — Meldepflichten; eigener Datenschutz-Vorfallsprozess (§3).
- "GoBD (konsolidierte Basis gemäß BMF Amtliches AO-Handbuch 2025 Anhang 33), in der Fassung der Änderungs-Schreiben vom 11.03.2024 und 14.07.2025" — Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, Richtigkeit, Ordnung, Zeitgerechtigkeit, Maschinelle Auswertbarkeit (§3).
- "BMF-Schreiben vom 14.07.2025" — GoBD-Konkretisierungen für strukturierte E-Rechnungen (Aufbewahrung des strukturierten Teils, Verhältnis Bild-/Inhaltsidentität) (§3).
- "BMF-Schreiben vom 11.03.2024" — GoBD-Konkretisierungen (§3).
- "GoBD Rz. 58–60, 87–94, 107–111, 113 ff., 142–144" — aus amtlichem BMF AO-Handbuch 2025 Anhang 33 (§3).
- "GoBD Rz. 76, 118, 119" — in der Fassung des BMF-Änderungs-Schreibens vom 14.07.2025 (§3).

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-Closing" — Locked-Decisions-Register-Boundary-IDs (Lock-Basis).

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Es ist ein Planungs- und Spezifikationsartefakt. Es trifft keine technische Entscheidung, beschreibt keine Speicherform und ersetzt keine bestehende Lockfassung."
- "Buchungsbelege: 8 Jahre — Verkürzung von 10 auf 8 Jahre; allgemeine Anwendung gemäß Art. 97 § 19a EGAO und Art. 95 EGHGB."
- "Übergangsregel: Die verkürzte 8-Jahres-Frist für Buchungsbelege ist erstmals auf Unterlagen anzuwenden, deren bisherige zehnjährige Aufbewahrungsfrist am 31.12.2024 noch nicht abgelaufen war."
- "Verzögerte Anwendung KWG/VAG/WpIG: erstmals auf Unterlagen anzuwenden, deren bisherige zehnjährige Frist am 1. Januar 2026 noch nicht abgelaufen ist."
- "Hemmung des Fristablaufs: Die Aufbewahrungsfrist läuft gemäß AO § 147 Abs. 3 Satz 5 nicht ab, soweit und solange die Unterlagen für Steuern von Bedeutung sind, für die die Festsetzungsfrist noch nicht abgelaufen ist."
- "Legal Hold: Solange ein Legal Hold besteht (Außenprüfung, anhängiges Verfahren, sonstiger rechtlicher Sicherungsanlass), darf eine Unterlage trotz formal abgelaufener Frist nicht gelöscht werden."
- "Keine automatische Löschung ohne nachweisbaren Ablauf der gesetzlichen Frist und ohne Prüfung des Legal-Hold-Status und ohne revisionssicheren Nachweis."
- "Lieferschein-Sonderfall: Empfangene/abgesandte Lieferscheine, die keine Buchungsbelege sind, enden in ihrer Aufbewahrungspflicht mit Erhalt/Versand der zugehörigen Rechnung."
- "Retention-Archiv ≠ DR-Backup (Zeitachse mehrjährig vs. operativ Stunden/Wochen)."
- "Mandantenscharfe Aufbewahrung; mandantenübergreifende Vermischung ist ausgeschlossen (F0-D6)."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Konkrete Lösch-/Sperrlogik wird nicht in diesem Artefakt entworfen, sondern in einem separaten Lösch-/Sperrkonzept-Artefakt (siehe Abschnitt 14)."
- "Endfassung der Verfahrensdokumentation Kap. 6" — Non-Scope; im Rahmen der nächsten Pflege.
- "Lohn-Tiefe" — verbleibt Lohn-DLS-Folgeartefakt.
- "Datenschutz-Vorfallsprozess" — eigenes Folgeartefakt.

## 10. Verweise auf andere Specs
- Lösch-/Sperrkonzept-Artefakt V1.0 (§14 — Lösch-/Sperrlogik-Defer)
- Lohn-DLS-Folgeartefakt (Grenzverweis EStG § 41)
- DR-/HA-/BCM-Folgeartefakt (Abgrenzung §6.1)
- Z3-/Datenüberlassung-Folgeartefakt (Abgrenzung §6.2)
- Migrations-Folgeartefakt (Abgrenzung §6.3)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (Cross-Boundary)
- DSGVO-/Datenpannen-Folgeartefakt (Datenschutz-Vorfallsprozess)
- Custody-Modell-Boundary-Artefakt V1.0 (Speicher-/Schlüsselverwaltungs-Defer)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Klassifikations-Spiegel)
- Verfahrensdokumentation Kap. 6 (nächste Pflege per Verweis)

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§1 Non-Scope: „Implementierung, Speichertechnologie, Schema, UI, Code, SQL". PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
