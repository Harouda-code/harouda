# Extract: loesch-sperrkonzept-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/loesch-sperrkonzept-v1.md
- Dateigröße: 26.6 KB
- Zeilenanzahl: 282
- Erstellt am: 2026-05-08T22:48:41+02:00
- Erste H1-Überschrift im Dokument: Lösch-/Sperrkonzept-Artefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der fachlichen Grenzen für Löschung und Sperrung von Mandanten- und Buchführungsdaten in Harouda nach Ablauf der gesetzlichen Aufbewahrungsfrist und nach Freigabe etwaiger Legal Holds — als internes Boundary-/Spec-Lock vor Kapitel 6 der Verfahrensdokumentation.

## 3. Hauptthemen (max 5 Bullet Points)
- Core Lösch-/Sperr-Boundaries: keine Löschung vor Fristablauf, kein Plattform-Admin-Override (F0-D7), keine Schwächung F0-D4/F0-D6/F1-D1/F1-D2
- Sperrung vs. Löschung (Boundary-Definition ohne technische Mechanik)
- Legal-Hold-Boundary (Außenprüfung, Verfahren, behördliche Anordnung)
- Sperrgrund-Taxonomie auf Boundary-Ebene (8 Boundary-Kategorien inkl. „Sicherheits-/Forensik-Halt"); keine Codes oder Datenbankwerte
- Retention-Clock-Interaktion und Audit-/Nachweis-Boundary; Crypto-Shredding als downstream-bedingte Architektur-Option

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(§1 Non-Scope: „DB-Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL"; §7: „Konkrete Codes, Schlüssel, Bezeichner und Wertebereiche werden in V1.0 dieses Artefakts nicht festgelegt".)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(§1 Non-Scope: „automatische Löschjobs, konkrete Speicher- bzw. Schlüsselverwaltung". §2: „Der konkrete Lösch-/Sperrprozess (Workflows, Rollen, Eskalationen, technische Eingriffe)" verbleibt downstream. §6: „Konkreter Workflow eines Legal Holds wird in V1.0 nicht entworfen".)

## 6. Rechtsgrundlagen-Erwähnungen
- "AO § 147" — Aufbewahrungspflichten und -fristen; insbesondere Nicht-Ablauf der Aufbewahrungsfrist, soweit und solange die Unterlagen für noch nicht festsetzungsverjährte Steuern von Bedeutung sind (§3 Boundary-Verweis über Retention V1.0).
- "HGB § 257" — Handelsrechtliche Aufbewahrungspflichten parallel zur abgabenrechtlichen Systematik (§3).
- "GoBD (in der bereits in Retention V1.0 etablierten konsolidierten Basis)" — Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, Richtigkeit; schriftliches und praktiziertes Löschkonzept als Anforderung (§3).
- "DSGVO Art. 17" — Recht auf Löschung; Abs. 3 lit. b: gesetzliche Aufbewahrungspflicht sperrt vorzeitige Löschung (§3, Crypto-Shredding-Diskussion).
- "DSGVO Art. 18" — Recht auf Einschränkung der Verarbeitung; abgrenzbar von Löschung (§3).
- "DSGVO Art. 20" — Recht auf Datenübertragbarkeit; beendet keine Aufbewahrungspflicht (§3 Grenzverweis).
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit (§3 Grenzverweis über Security V1.0).

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-D1", "F3-D2", "F3-D3", "F3-Closing" — Locked-Decisions-Register-Boundary-IDs durchgehend referenziert.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Keine Löschung vor Ablauf der gesetzlichen Aufbewahrungsfrist. Maßgeblich sind die in Retention V1.0 etablierten Kategorien und Fristen."
- "Keine Löschung, solange ein Legal Hold besteht. Legal Hold überlagert die zeitbasierte Lösch-Erlaubnis."
- "Keine Löschung, solange die steuerliche Bedeutung und/oder die Festsetzungsfrist im Einzelfall nicht abgelaufen ist."
- "Keine Löschung, die F0-D4 Festschreibung verändert."
- "Keine Löschung, die F1-D1 / F1-D2 USt-Wahrheit verändert."
- "Keine Lösch-/Sperr-Operation, die F0-D6 Mandantentrennung schwächt."
- "Kein Plattform-Admin-Override gegenüber Lösch-/Sperrgrenzen unter F0-D7."
- "Sperrung ist die Standardmaßnahme während laufender Aufbewahrungsfrist, laufendem Legal Hold und unaufgelöster Lösch-Voraussetzung."
- "Löschung ist erst zulässig, nachdem alle Aufbewahrungs-, Legal-Hold- und Festsetzungsfrist-Sperren geprüft und freigegeben wurden."
- "Sperrgrund-Taxonomie ist fachliche Sperrgrund-Klassifikation, nicht operative Codes oder Datenbankwerte. Konkrete Codes/Schlüssel/Wertebereiche werden nicht festgelegt."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17" — Release-Blocker für Produktivanwendung; keine Würdigung in V1.0.
- "Operative Mechanik der Löschung oder Sperrung" — Non-Scope; downstream.
- "Konkrete Sperrgrund-Taxonomie auf Implementierungsebene (Codes, Datenbankwerte)" — Non-Scope.
- "Konkreter Lösch-/Sperrprozess (Workflows, Rollen, Eskalationen, technische Eingriffe)" — Non-Scope.
- "Endfassung der Verfahrensdokumentation Kap. 6" — Non-Scope; im Rahmen der nächsten Pflege.
- "Externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) sowie ggf. eine externe sicherheitsfachliche Prüfung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich".

## 10. Verweise auf andere Specs
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (direkte Lock-Basis; Retention-Clock-Quelle)
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (direkte Lock-Basis; Crypto-Shredding-Operationalisierung)
- Custody-Modell-Boundary-Artefakt V1.0 (Custody-Boundary; Voraussetzung Crypto-Shredding)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Klassifikations-Eingangsgröße)
- Cybersecurity-Incident-Response-Folgeartefakt V1.0 (operative Aktivierung des Sperrgrunds „Sicherheits-/Forensik-Halt")
- DSGVO-/Datenpannen-Folgeartefakt V1.0 (Geteilter Marker C; rechtliche Meldepflichten dort)
- DR-/HA-/BCM-Folgeartefakt V1.0 (Cross-Boundary)
- ASVS-Control-Referenz-Artefakt V1.0 (Cross-Boundary)
- TR-02102-Detail-Artefakt V1.0 (Cross-Boundary)
- KMS-/HSM-/Implementations-Folgeartefakt (Downstream)
- Z3-/Datenüberlassungs-Spezifikations-Artefakt (Cross-Boundary)
- Migrations-Folgeartefakt (Cross-Boundary)
- Verfahrensdokumentation Kap. 6 (nächste Pflege)
- Open Question Crypto-Shredding rechtliche Einordnung

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§1 Non-Scope: „DB-Schema, UI/UX, Programmcode, SQL, konkrete Speicher- bzw. Schlüsselverwaltung, Anbieter-/Produkt-/Plattform-/Hardware-Wahl". PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
