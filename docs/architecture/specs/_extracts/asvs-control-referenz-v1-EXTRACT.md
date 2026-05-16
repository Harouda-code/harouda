# Extract: asvs-control-referenz-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/asvs-control-referenz-v1.md
- Dateigröße: 34.8 KB
- Zeilenanzahl: 305
- Erstellt am: 2026-05-09T00:49:56+02:00
- Erste H1-Überschrift im Dokument: ASVS-Control-Referenz-Artefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der Boundary-Aussagen für die kontrollbasierte Referenzierung von OWASP ASVS 5.0.0 als „ASVS-Zielprofil" für Harouda inklusive Mapping-Tabelle auf Boundary-Ebene, ohne Verifikations-, Zertifikats- oder Konformitäts-Anspruch.

## 3. Hauptthemen (max 5 Bullet Points)
- Format-Lock `v5.0.0-X.Y.Z` für ASVS-Kontroll-Adressen (Major-/Minor-/Patch-Indizes), in V1.0 ausschließlich als Platzhalter
- 11 ASVS-Zielprofil-Cluster (Auth/Session, Autorisierung, Mandantentrennung, Plattform-Admin-Grenze, Vertrauliche Datenbehandlung, Kryptographie-Verweisbereich, Kommunikations-/Transport-Verweisbereich, Logging-/Audit, Konfigurations-Boundary, Validierungs-/Eingabe-Boundary, Fehler-/Ausnahmebehandlung)
- Strikte Trennung gegenüber TR-02102-Detail-Folgeartefakt (Algorithmik dort) und Custody-Modell V1.0 (KMS-/HSM dort)
- Cross-Boundary-Konsistenz mit Security V1.0, Custody V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Retention V1.0
- 16 STOP-Bedingungen (§12.1-§12.16) gegen ASVS-Verifikations-/Zertifizierungs-/Audit-Aussagen, Algorithmus-Nennung, Vendor-/Tool-Wahl, Register-Modifikation

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

## 6. Rechtsgrundlagen-Erwähnungen
- "OWASP ASVS 5.0.0" — als öffentliche, stabile Referenz für sicherheitsfunktionale Kontroll-Adressen; ASVS-Zielprofil ohne Verifikations-/Zertifizierungs-Behauptung.
- "TR-02102" — als externes Standard-Pendant, das in einem getrennten Folgeartefakt behandelt wird; V1.0 dieses Artefakts erhebt keinen Konformitätsanspruch gegenüber TR-02102.
- Keine direkten §-Paragraphen aus AO/HGB/StBerG/StGB erwähnt; alle Rechtsbezüge laufen ausschließlich über Cross-Boundary-Verweise auf Security V1.0 und Custody V1.0 sowie auf die Harouda-Registergrenzen.

## 7. Rule-ID-Erwähnungen
- "§28.11-bet" — bleibt unverändert/offen; V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht.
- "F0-D4" — Festschreibung (Lock-Bezug); "F0-D6" — Mandantentrennung; "F0-D7" — Plattform-Admin-Grenze; "F1-D1" / "F1-D2" — USt-Wahrheit; "F3-D1" — Z3-Export; "F3-D2" — DR/Restore; "F3-D3" — Migration; "F3-Closing" — als autoritative Harouda-Registergrenzen.
- STOP-Bedingungen 12.1 bis 12.16 (Format: numerische STOP-Identifier, keine `RULE-`-Präfixe).
- Klarstellung "K-1" (Klarstellungs-Identifier).

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "V1.0 sperrt ausschließlich die Boundary-Ebene."
- "ASVS-Control-Referenz ≠ Verifikation."
- "ASVS-Control-Referenz ≠ Zertifizierung."
- "ASVS-Control-Referenz ≠ TR-02102-Detail. Konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter und Schlüssellängen verbleiben dem TR-02102-Detail-Folgeartefakt."
- "Sämtliche Kontroll-Adressen werden ausschließlich im Format-Stil `v5.0.0-X.Y.Z` referenziert; ein Abweichen vom Format ist auf Boundary-Ebene ausgeschlossen."
- "Keine erfundenen Kontroll-Nummern. Die Mapping-Tabelle (§10) verwendet ausschließlich die Platzhalterform `v5.0.0-X.Y.Z`."
- "Keine ASVS-Stufen-Selbstzuschreibung. Aussagen wie „Level 1 erreicht", „L2-konform", „L3-zertifiziert" oder vergleichbar sind ausgeschlossen."
- "Bei Konflikt mit Security V1.0 gilt Security V1.0 für ASVS-Zielprofil-/Krypto-/Sicherheits-Boundaries."
- "Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks."
- "Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz (Konsistenz mit F3-Closing)."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "§28.11-bet bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht." (mehrfach)
- "Konkrete Indizes werden in V1.0 dieses Artefakts nicht befüllt; sie werden in einer separat zu autorisierenden späteren Detail-Pflege ergänzt."
- "Separat-zu-autorisierende Befüllungs-Pflege der `v5.0.0-X.Y.Z`-Indizes — gegen OWASP ASVS 5.0.0 (öffentlich, stabil), ohne Einführung neuer Quellen; eigenständig zu organisieren und vom Owner separat freizugeben."
- "ASVS-Verifikations-Aktivität — eigenständig zu organisierende formale Prüfung außerhalb dieses Artefakts; nicht Bestandteil eines V1.0-Lock-Artefakts."
- "Endfassung Verfahrensdokumentation Kap. 5" — als Non-Scope und Folge-Pflege markiert.
- "Eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) und eine externe sicherheitsfachliche Validierung (Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich."

## 10. Verweise auf andere Specs
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (§3, §7, §8, §9, §17) — direkte Lock-Basis
- Custody-Modell-Boundary-Artefakt V1.0 (§3, §5, §6, §7, §10, §12, §15, §16) — direkte Lock-Basis
- TR-02102-Detail-Folgeartefakt — getrennt; Algorithmik dort
- KMS-/HSM-/Implementations-Folgeartefakt — Custody-Topologie und Modellwahl dort
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (Cross-Boundary)
- Lösch-/Sperrkonzept-Artefakt V1.0 (§10, Cross-Boundary)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (§13, Cross-Boundary)
- DR-/HA-/BCM-Folgeartefakt — Boundary-Bezug
- Migrations-Folgeartefakt — Boundary-Bezug
- Z3-/Datenüberlassungs-Spezifikations-Artefakt — Boundary-Bezug
- DSGVO-/Datenpannen-Folgeartefakt — Boundary-Bezug
- Cybersecurity-Incident-Response-Folgeartefakt — Boundary-Bezug
- Verfahrensdokumentation Kap. 5 — nächste Pflege

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen. V1.0 enthält ausdrücklich keinen Programmcode, kein Datenmodell, kein Schema, kein SQL, keine API-Definition, kein UI/UX und keine konkreten Algorithmen/Modi/Cipher Suites/TLS-Parameter. Aussagen sind ausschließlich auf Boundary-Ebene formuliert.
