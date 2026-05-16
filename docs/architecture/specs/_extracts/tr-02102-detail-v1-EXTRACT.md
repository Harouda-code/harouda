# Extract: tr-02102-detail-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/tr-02102-detail-v1.md
- Dateigröße: 39.5 KB
- Zeilenanzahl: 346
- Erstellt am: 2026-05-09T01:48:53+02:00
- Erste H1-Überschrift im Dokument: TR-02102-Detail-Artefakt — V1.0

## 2. Zweck der Spec (in einem Satz)
Festlegung der fachlichen Boundary-Aussagen für die paraphrasierte Krypto- und Transport-Orientierung in Harouda auf Basis von BSI TR-02102-1 (Version 2026-01) und BSI TR-02102-2 (Version 2026-01); Konkretisierung der in Security V1.0 §7 angelegten Orientierung auf der Ebene von Mechanismen-Familien, Schlüssellängen-Orientierungen und TLS-/Transport-Familien — durchgehend ohne Konformitätsanspruch und ohne Implementierungsregel.

## 3. Hauptthemen (max 5 Bullet Points)
- Paraphrasierte Mechanismen-Familien-Orientierung gemäß BSI TR-02102-1 (Version 2026-01) auf Boundary-Ebene
- Paraphrasierte TLS-/Cipher-Suite-/Transport-Familien-Orientierung gemäß BSI TR-02102-2 (Version 2026-01)
- Schlüssellängen-Orientierung und Algorithmen-Lebenszyklus-Orientierung als Boundary-Konzept ohne konkrete Werte
- Strikte Abgrenzung gegenüber ASVS-Control-Referenz V1.0, Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt
- Negativ-Erklärung: keine BSI-Konformität, keine TR-02102-Erfüllung, keine Zertifizierung, keine Implementierung

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

## 6. Rechtsgrundlagen-Erwähnungen
- "BSI TR-02102-1, Version 2026-01" — Quelle für paraphrasierte Mechanismen-Familien-/Schlüssellängen-/Algorithmen-Lebenszyklus-Orientierung; ausschließlich Boundary-Topos, kein Konformitätsanspruch.
- "BSI TR-02102-2, Version 2026-01" — Quelle für paraphrasierte TLS-/Cipher-Suite-/Transport-Familien-Orientierung; ausschließlich Boundary-Topos, kein Konformitätsanspruch.
- "BSI TR-03116" — wird in §3 ausdrücklich nicht als Lock-Quelle aufgenommen (Security V1.0 §3/§15 markiert sie als nicht-normativ).
- "BSI IT-Grundschutz" — wird in §3 ausdrücklich nicht als Lock-Quelle aufgenommen.
- "DSGVO Art. 17" — in §14 erwähnt im Kontext, dass V1.0 keine rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17 oder Art. 18 trifft.
- "DSGVO Art. 18" — in §14 erwähnt im Kontext der nicht erfolgenden Crypto-Shredding-Rechtswürdigung.
- "AO § 147" — in §14/§16.16 erwähnt: Krypto-Familien-Orientierung darf nicht zur Umgehung gesetzlicher Aufbewahrungspflichten gemäß AO § 147 / HGB § 257 ausgelegt werden.
- "HGB § 257" — in §14/§16.16 erwähnt im Kontext gesetzlicher Aufbewahrungspflichten, die nicht umgangen werden dürfen.

## 7. Rule-ID-Erwähnungen
- "ASVS-Mapping-Adressen `v5.0.0-X.Y.Z`" — in §9 erwähnt als Verweis-Adressen, die ausschließlich in ASVS-Control-Referenz V1.0 verbleiben.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "TR-02102-Detail ≠ Implementierung" — keine Implementierung, kein Datenmodell, kein Schema, kein UI/UX, kein Programmcode, kein Pseudocode, kein SQL.
- "TR-02102-Detail ≠ BSI-Konformität" — keinen Konformitätsanspruch gegenüber BSI-Vorgaben.
- "TR-02102-Detail ≠ Zertifizierung" — keine BSI-Zertifizierung, keine TR-02102-Erfüllung, keine Audit-Bestätigung.
- "TR-02102-Detail ≠ ASVS-Verifikation" — ASVS-Control-Mapping verbleibt in ASVS-Control-Referenz V1.0.
- "TR-02102-Detail ≠ Custody-Topologie" — Schlüsselverwaltungs-Topologie, Schlüsselhierarchie, Schutzdomänen-Architektur verbleiben Custody-Modell V1.0 und KMS-/HSM-/Implementations-Folgeartefakt.
- "TR-02102-Detail ≠ KMS-/HSM-Implementierung" — konkrete Schlüsselverwaltungs-Mechanik, Rotation, Vernichtung, Wiederherstellung verbleiben downstream.
- "TR-02102-Detail ≠ Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Hardware-/Bibliotheks-Wahl" — V1.0 trifft keine solche Wahl.
- "Versions-Lock 2026-01" — Bezugnahmen erfolgen ausschließlich auf BSI TR-02102-1/-2 Version 2026-01; konsistent mit Security V1.0 §3, Custody V1.0 §3 und ASVS V1.0 §16.
- "§28.11-bet bleibt unverändert/offen" — V1.0 ändert oder reinterpretiert §28.11-bet nicht.
- "F0-D4, F0-D6, F0-D7, F1-D1/F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ" — V1.0 schwächt keinen dieser Locks.

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Crypto-Shredding rechtliche Einordnung — externe Fachanwalts-/DSB-Prüfung der Einordnung unter DSGVO Art. 17 / Art. 18; vorhanden als Open-Question-Datei `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`" (§18).
- "§28.11-bet bleibt unverändert/offen" (§4, §15, §19).
- "Spätere Versions-Pflege dieses Artefakts — Befüllung der Familien-Orientierungs-Tabellen mit konkreteren Quell-Paraphrasen je TR-02102-Stand; separat zu autorisieren" (§18).
- "Eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) sowie eine externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich" (§2).

## 10. Verweise auf andere Specs
- Security-/Krypto-/Key-Custody-Artefakt V1.0 (§3, §7, §15, §17 — direkte Lock-Basis)
- Custody-Modell-Boundary-Artefakt V1.0 (§3, §10, §15, §16 — direkte Lock-Basis)
- ASVS-Control-Referenz-Artefakt V1.0 (§6, §8, §10, §14, §15 — direkte Lock-Basis)
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (Cross-Boundary-Konsistenz)
- Lösch-/Sperrkonzept-Artefakt V1.0 (Cross-Boundary-Konsistenz)
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Cross-Boundary-Konsistenz)
- KMS-/HSM-/Implementations-Folgeartefakt (Downstream)
- DR-/HA-/BCM-Folgeartefakt (Trennlinie §11)
- Z3-/Datenüberlassungs-Spezifikations-Artefakt (Trennlinie §12)
- Migrations-Folgeartefakt (Trennlinie §13)
- DSGVO-/Datenpannen-Folgeartefakt (Downstream §18)
- Cybersecurity-Incident-Response-Folgeartefakt (Downstream §18)
- Verfahrensdokumentation Kap. 5 (Downstream §18)

## 11. Technische Stack-Erwähnungen
- "TLS" — durchgehend erwähnt als Transport-Boundary-Topos (§5, §6, §17); konkrete TLS-Versionen, Cipher Suites und Parameter sind ausdrücklich Non-Scope.
- "KMS/HSM" — als Downstream-Folgeartefakt erwähnt (§10, §18); konkrete Modellwahl ist Non-Scope.
- "Cloud-/Region-/Hardware-/Bibliotheks-Wahl" — durchgehend als Non-Scope markiert (§4, §17).
- Keine Erwähnung von PostgreSQL, Supabase, React, TypeScript, RLS, Triggers oder Row-Level-Security.
