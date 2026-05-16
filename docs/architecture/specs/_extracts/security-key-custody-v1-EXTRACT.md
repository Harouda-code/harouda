# Extract: security-key-custody-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/security-key-custody-v1.md
- Dateigröße: 23.5 KB
- Zeilenanzahl: 292
- Erstellt am: 2026-05-08T22:16:22+02:00
- Erste H1-Überschrift im Dokument: Security-/Krypto-/Key-Custody-Artefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der Sicherheits-, Krypto- und Key-Custody-Grenzen für Harouda als internes Boundary-/Spec-Lock — Vertraulichkeit/Integrität/Verfügbarkeit, Berufsgeheimnis-Schutz, Krypto-Orientierung, ASVS-Zielprofil, Plattform-Admin-Grenze und Abgrenzung gegen DR/Migration/Retention sowie Crypto-Shredding als Architektur-Option.

## 3. Hauptthemen (max 5 Bullet Points)
- Core Security Boundaries: Vertraulichkeit, Integrität, Verfügbarkeit, Nachvollziehbarkeit, Mandantentrennung
- DSGVO-Boundary (Art. 28 / 32 / 33-34) und Berufsgeheimnis-Boundary (StGB § 203 / StBerG § 62a)
- BSI-Krypto-Boundary (TR-02102-1/2 Version 2026-01) als Orientierung ohne Konformitätsanspruch
- OWASP ASVS 5.0.0 als Zielprofil im Format `v5.0.0-X.Y.Z` ohne Verifikations-Anspruch
- Plattform-Admin- und Key-Custody-Grenze; Crypto-Shredding als downstream-bedingte Architektur-Option

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(§17 Lock-Profil verbietet Implementierung, Datenmodell, UI/UX, SQL, APIs, automatische Jobs; §1 Non-Scope listet „Konkretes Key-Custody-Modell, Algorithmen, Cipher Suites, TLS-Parameter, Schlüssellängen, Schlüsselrotations-Mechanik, Speichertechnologie, Verschlüsselungs-Implementierung".)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(Schlüssellebenszyklus-Phasen Erzeugung/Verteilung/Nutzung/Rotation/Sperrung/Vernichtung werden in §7 lediglich als Boundary-Topoi anerkannt; konkrete Mechanik verbleibt downstream.)

## 6. Rechtsgrundlagen-Erwähnungen
- "DSGVO Art. 28" — Auftragsverarbeitung; Anforderungen an die Verarbeiter-Beziehung (§3, §5 Boundary-Verweis).
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit, Wiederherstellbarkeit, regelmäßige Überprüfung (§3, §5).
- "DSGVO Art. 33 / 34" — Meldepflichten bei Datenschutzverletzungen; Grenzverweis (out of scope; eigenes Folgeartefakt).
- "DSGVO Art. 17" — Recht auf Löschung; im Zusammenhang Crypto-Shredding-Boundary; V1.0 nimmt keine rechtliche Würdigung vor.
- "StGB § 203" — Verletzung von Privatgeheimnissen; Berufsgeheimnis-Schutz (§3, §6).
- "StBerG § 62a" — Datenschutz im StB-Mandat; Verschwiegenheitspflicht-Schutz im Mandanten-Verhältnis (§3, §6).
- "BSI TR-02102-1, Version 2026-01" — Empfehlungen zu kryptographischen Verfahren und Schlüssellängen; Krypto-Orientierung; kein Konformitätsanspruch (§3, §7).
- "BSI TR-02102-2, Version 2026-01" — Empfehlungen zur Verwendung von TLS; Transport-Boundary-Orientierung; kein Konformitätsanspruch (§3, §7).
- "OWASP ASVS 5.0.0" — Application Security Verification Standard; ASVS-Zielprofil ohne Zertifizierung; Format-Stil `v5.0.0-X.Y.Z` (§3, §8).
- "BDSG § 5" — Spezialgesetzliche Datenschutz-Regelung; Negative Boundary (§3, §14).
- "BDSG § 53" — Spezialgesetzliche Datenschutz-Regelung; Negative Boundary (§3, §14).
- "DSK Kurzpapier Nr. 11" — Aufsichtsbehördliche Auffassung zum Spannungsfeld Löschung/Sperrung vs. Aufbewahrung; offener Auffassungsstand; keine finale Autoritäts-Aussage.

(Ausdrücklich KEINE Lock-Quelle in V1.0: BSI TR-03116, BSI IT-Grundschutz — siehe §3 Nicht-normativer Status.)

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-D1", "F3-D2", "F3-D3", "F3-Closing" — Locked-Decisions-Register-Boundary-IDs durchgehend referenziert.
- "§28.11-bet" — bleibt unverändert/offen (zukünftige Diskussion).
- ASVS-Format `v5.0.0-X.Y.Z` als Kontroll-Adress-Format.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Das Artefakt ist ein internes Boundary-/Spec-Lock und trifft keine technische Entscheidung über Verfahren, Produkte, Anbieter oder Implementierung."
- "Vertraulichkeit: Mandantendaten und Schlüsselmaterial sind gegen unbefugte Einsichtnahme zu schützen."
- "Integrität: Manipulationen an aufbewahrungs- und buchführungsrelevanten Datenbeständen müssen nachvollziehbar bleiben (Bezug zu F0-D4 Festschreibung)."
- "Mandantentrennung: F0-D6 bleibt autoritativ; mandantenübergreifende Vermischung ist auch im Sicherheits- und Schlüsselkontext ausgeschlossen."
- "Plaintext-Zugriff auf Mandantendaten durch nicht zur Berufsverschwiegenheit verpflichtete Subjekte ist auf Boundary-Ebene ausgeschlossen."
- "Schlüsselmaterial darf nicht so verwaltet werden, dass ein nicht zur Berufsverschwiegenheit verpflichtetes Subjekt einseitig Plaintext-Zugriff auf Mandantendaten erlangen kann."
- "V1.0 definiert keine Algorithmen, Modi, Cipher Suites, TLS-Versionen oder konkreten Parameter."
- "V1.0 erhebt keinen Konformitätsanspruch gegenüber BSI-Vorgaben."
- "Als sicherheitsfunktionales Zielprofil für Harouda gilt OWASP ASVS 5.0.0 im Sinne einer „ASVS-Zielprofil"-Referenzierung."
- "BSI TR-03116 und BSI IT-Grundschutz werden in V1.0 nicht als allgemeine Pflicht-Baseline gesetzt."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Crypto-Shredding rechtliche Einordnung unter DSGVO Art. 17" — Release-Blocker für Produktivanwendung; keine Würdigung in V1.0.
- "§28.11-bet bleibt unverändert/offen".
- "Endfassung der Verfahrensdokumentation Kap. 5" — Non-Scope; im Rahmen der nächsten Pflege.
- "Konkrete Algorithmen, Schlüssellängen, Modi, TLS-Parameter" — Downstream in TR-02102-Detail-Folgeartefakt.
- "Custody-Modell-Folgeartefakt" als benannter Downstream-Auftrag (§17).
- "ASVS-Control-Referenz-Artefakt — vollständige Kontroll-Mapping-Tabelle im Format `v5.0.0-X.Y.Z`" als Downstream-Auftrag (§17).
- "Externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) sowie eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich".

## 10. Verweise auf andere Specs
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (Lock-Basis; §1, §4)
- Custody-Modell-Boundary-Artefakt V1.0 (benannter Downstream-Auftrag in §17)
- ASVS-Control-Referenz-Artefakt V1.0 (Downstream-Auftrag in §17)
- TR-02102-Detail-Artefakt V1.0 (Downstream-Auftrag in §17)
- Lösch-/Sperrkonzept-Artefakt V1.0 (Downstream-Auftrag in §17 für Crypto-Shredding-Operationalisierung)
- KMS-/HSM-/Implementations-Folgeartefakt (Downstream)
- DR-/HA-/BCM-Folgeartefakt (Downstream — Verfügbarkeitsziele)
- Cybersecurity-Incident-Response-Folgeartefakt (Downstream-Auftrag)
- DSGVO-/Datenpannen-Folgeartefakt (Out-of-Scope Art. 33/34)
- Z3-/Datenüberlassungs-Spezifikations-Artefakt (Downstream)
- Migrations-Folgeartefakt (Downstream)
- Verfahrensdokumentation Kap. 5 (nächste Pflege per Verweis)

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§1 / §17 Non-Scope: „Speichertechnologie, Verschlüsselungs-Implementierung, Anbieter-/Produkt-/Plattform-/Hardware-Wahl". PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
