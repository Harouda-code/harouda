# Extract: custody-modell-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/custody-modell-v1.md
- Dateigröße: 37.9 KB
- Zeilenanzahl: 328
- Erstellt am: 2026-05-09T00:16:28+02:00
- Erste H1-Überschrift im Dokument: Custody-Modell-Boundary-Artefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der fachlichen Custody-Boundaries für die Verwaltung kryptographischen Schlüsselmaterials in Harouda — Trennung von Plattform-Administration und Plaintext-Hoheit, mandantenscharfe Schlüssel-Segregation, Schlüssel-Lebenszyklus-Boundary, Crypto-Shredding ausschließlich als Architektur-Option ohne rechtliche Würdigung.

## 3. Hauptthemen (max 5 Bullet Points)
- Trennung Plattform-Administration vs. Plaintext-Hoheit (F0-D7-Spiegelung)
- Storage-vs-Key-Access-Boundary (Chiffrat-Lesezugriff ≠ Entschlüsselungs-Fähigkeit)
- Mandantenscharfe Schlüssel-Segregation auf Boundary-Ebene (F0-D6)
- Schlüssel-Lebenszyklus-Phasen als reine Boundary-Topoi (Erzeugung/Verteilung/Nutzung/Rotation/Sperrung/Vernichtung/Wiederherstellung)
- Crypto-Shredding ausschließlich als downstream-bedingte Architektur-Option ohne rechtliche Würdigung

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

(Non-Scope §17: „Datenmodell/Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, APIs, automatische Jobs"; auch „Audit-Log-Schema" explizit Non-Scope.)

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

(§17 verbietet explizit „Schlüsselrotations-Mechanik, Schlüsselzerstörungs-Mechanik, Schlüsselwiederherstellungs-Mechanik, Grace-Periods, Incident-Response-Runbook"; Lebenszyklus-Phasen in §4/§7 sind reine Boundary-Topoi „ohne Mechanik, ohne Frequenzen, ohne Trigger und ohne Algorithmik".)

## 6. Rechtsgrundlagen-Erwähnungen
- "DSGVO Art. 28" — Auftragsverarbeitung; Anforderungen an die Verarbeiter-Beziehung; Weisungsbindung; Sub-Verarbeiter-Konstellationen (§3 Boundary-Verweis).
- "DSGVO Art. 32" — Sicherheit der Verarbeitung; Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit; angemessene technische und organisatorische Maßnahmen (§3 Boundary-Verweis).
- "DSGVO Art. 33 / 34" — Meldepflichten bei Datenschutzverletzungen; abgrenzbar von Custody-Mechanik; Grenzverweis (Vorfallsprozess ist eigenes Folgeartefakt).
- "DSGVO Art. 17" — Recht auf Löschung; im Zusammenhang Crypto-Shredding-Boundary; V1.0 trifft keine rechtliche Würdigung.
- "DSGVO Art. 18" — Recht auf Einschränkung der Verarbeitung; im Zusammenhang Crypto-Shredding-Boundary; V1.0 trifft keine rechtliche Würdigung.
- "StGB § 203" — Verletzung von Privatgeheimnissen; Berufsgeheimnis-Schutz; Boundary-Verweis ohne abschließende Einzelfall-Bewertung (§3, §4).
- "StBerG § 62a" — Datenschutz im StB-Mandat; Verschwiegenheitspflicht-Schutz im Mandanten-Verhältnis; Boundary-Verweis ohne abschließende Einzelfall-Bewertung (§3, §4).
- "BSI TR-02102-1, Version 2026-01" — Empfehlungen zu kryptographischen Verfahren und Schlüssellängen; Krypto-Orientierung; kein Konformitätsanspruch; konkrete Algorithmik im TR-02102-Detail-Artefakt.
- "BSI TR-02102-2, Version 2026-01" — Empfehlungen zur Verwendung von TLS; Transport-Boundary-Orientierung; kein Konformitätsanspruch.
- "OWASP ASVS 5.0.0" — Application Security Verification Standard; ASVS-Zielprofil im Sinne der Security-V1.0-Boundary; keine Verifikations- oder Zertifizierungs-Behauptung.
- "DSK Kurzpapier Nr. 11" — Aufsichtsbehördliche Auffassung zum Spannungsfeld zwischen Löschung/Sperrung und Aufbewahrungspflichten; dynamischer/offener Auffassungsstand für die Crypto-Shredding-Diskussion.

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-D1", "F3-D2", "F3-D3", "F3-Closing" — Locked-Decisions-Register-Boundary-IDs durchgehend referenziert.
- "§28.11-bet" — bleibt unverändert/offen; V1.0 ändert oder reinterpretiert §28.11-bet nicht.
- STOP-Bedingungen 12.1 bis 12.16 (numerische STOP-Identifier).

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Custody-Modell ≠ Implementierung." Boundary-Aussagen ohne Schlüsselverwaltungs-Mechanik.
- "Trennung Plattform-Administration vs. Plaintext-Hoheit. Plattform-Administration ist gemäß F0-D7 rein technische Rolle; sie darf keine einseitige Plaintext-Macht über Mandantendaten besitzen."
- "Trennung Storage-/Chiffrat-Zugriff vs. Entschlüsselungs-Fähigkeit. Wer Speicher- bzw. Chiffrat-Lesezugriff hat, darf nicht zugleich allein die Entschlüsselungs-Fähigkeit halten."
- "Verbot einseitiger Plaintext-Macht. Kein einzelnes administratives Subjekt darf einseitig auf Mandanten-Klartext zugreifen können."
- "Mandantenscharfe Schlüssel-Segregation auf Boundary-Ebene. F0-D6 bleibt autoritativ; mandantenübergreifende Schlüsselvermischung ist auf Boundary-Ebene ausgeschlossen."
- "Berufsgeheimnis-Schutz. Schlüsselmaterial darf nicht so verwaltet werden, dass ein nicht zur Berufsverschwiegenheit verpflichtetes Subjekt einseitig Plaintext-Zugriff auf Mandantendaten erlangen kann (StGB § 203 / StBerG § 62a)."
- "Schlüssel-Lebenszyklus ausschließlich als Boundary-Topoi. Erzeugung, Verteilung/Bereitstellung, Nutzung, Rotation, Sperrung/Revokation, Vernichtung, Wiederherstellung werden als fachliche Phasen anerkannt, jedoch ohne Mechanik, ohne Frequenzen, ohne Trigger und ohne Algorithmik."
- "Crypto-Shredding ausschließlich als downstream-bedingte Architektur-Option. Keine rechtliche Würdigung in V1.0; keine Umgehung gesetzlicher Aufbewahrungspflichten."
- "F0-D4-Wahrung. Festschreibungs-Tatsachen werden durch Schlüsselverwaltungs-Operationen weder erzeugt, geändert noch entfernt."
- "F1-D1/F1-D2-Wahrung. USt-Werte werden durch Schlüsselverwaltungs-Operationen weder erzeugt, geändert noch überschrieben."

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Open Question — Crypto-Shredding rechtliche Einordnung, Status 🔴 offen; externe Fachanwalts-Freigabe vor Produktivstart erforderlich; Release-Blocker für Produktivanwendung; nicht Boundary-Blocker" (§3).
- "§28.11-bet bleibt unverändert/offen" (mehrfach).
- "Konkrete Custody-Topologie, Schlüsselhierarchie-Wahl, Schlüssellebenszyklus-Mechanik" — bleiben downstream.
- "Endfassung Verfahrensdokumentation Kap. 5" — Non-Scope, im Rahmen der nächsten Pflege.
- "Endfassung des Lösch-/Sperrprozesses" — Non-Scope.
- "Operationelle Umsetzung des Crypto-Shredding-Verfahrens" — Non-Scope.
- "Eine externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) sowie eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich" (§2).

## 10. Verweise auf andere Specs
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (§17 Lock-Profil als direkter Auftrag; direkte Lock-Basis)
- Lösch-/Sperrkonzept-Artefakt V1.0 (§11, §14 — Voraussetzung für jegliche operative Anwendung von Crypto-Shredding; direkte Lock-Basis)
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (§11 — Speicher-/Schlüsselverwaltungs-Defer; direkte Lock-Basis)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (§16 — indirekt für Klassifikations-Audit-Nachweise)
- ASVS-Control-Referenz-Artefakt V1.0 (§10 — Verhältnis ASVS-Control-Referenz; §15 Downstream; §16 Lock-Profil)
- TR-02102-Detail-Artefakt V1.0 (konkrete Algorithmik dort; Trennlinie)
- KMS-/HSM-/Implementations-Folgeartefakt (Detail-Implementations-Boundary; Downstream)
- DR-/HA-/BCM-Folgeartefakt (Restore-Schutz; getrennt)
- Cybersecurity-Incident-Response-Folgeartefakt (getrennt)
- DSGVO-/Datenpannen-Folgeartefakt (getrennt)
- Z3-/Datenüberlassungs-Spezifikations-Artefakt (Plaintext-Beschaffung verboten)
- Migrations-Folgeartefakt (Schlüssel-/Plaintext-Schutz)
- Verfahrensdokumentation Kap. 5 (nächste Pflege)
- Open Question `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`

## 11. Technische Stack-Erwähnungen
Keine technischen Stack-Erwähnungen.

(§17 verbietet explizit „Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl, Algorithmen, Modi, Cipher Suites, TLS-Versionen, Schlüssellängen, kryptographische Parameter, BYOK/HYOK/CMK/MyOwnKey-Schemata, KMS-/HSM-Modellwahl". PostgreSQL, Supabase, React, TypeScript, RLS oder Trigger werden nicht erwähnt.)
