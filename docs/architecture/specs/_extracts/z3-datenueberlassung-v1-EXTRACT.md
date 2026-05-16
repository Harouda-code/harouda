# Extract: z3-datenueberlassung-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/z3-datenueberlassung-v1.md
- Dateigröße: 44.5 KB
- Zeilenanzahl: 345
- Erstellt am: 2026-05-09T14:51:44+02:00
- Erste H1-Überschrift im Dokument: Z3-/Datenüberlassungs-Spezifikations-Folgeartefakt V1.0

## 2. Zweck der Spec (in einem Satz)
V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im Locked Decisions Register V1.0 §3.10 (F3-D1) und §6 Sortierungsmarker A bereits autoritativ angelegte Z3-Boundary auf der Ebene paraphrasierter Topoi (behördliche Datenüberlassung als eigenständiger Anlass; Anlass-Trennung; Prüfungszeitraum-Primärgranularität; Beschreibungsstandard nur als technische Bereitstellungshilfe).

## 3. Hauptthemen (max 5 Bullet Points)
- Behördliche Datenüberlassung als eigenständiger Anlass auf Topos-Ebene; Anlass-Trennung Z3 ≠ Mandanten-Export ≠ Migrations-Export ≠ DR-Backup/Restore ≠ Retention-Archiv
- Granularitäts-Boundary mit Prüfungszeitraum als Primärgranularität; Wirtschaftsjahr/Kalenderjahr als abgeleitete Größen
- Beschreibungsstandard ausschließlich als technische Bereitstellungshilfe (kein Lock-Quellen-Status; keine Felder-Enumeration)
- Plaintext-Boundary-Wahrung gegenüber F3-D1 und Verbot der Plaintext-Beschaffung über Z3-Pfade
- Strikte Cross-Boundary-Trennlinien gegenüber DR/HA/BCM, Migration, Custody, Security, ASVS, TR-02102-Detail, IR, DSGVO, Lösch-/Sperrkonzept, Regelmatrix, Lohn-DLS, Z1/Z2

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

## 6. Rechtsgrundlagen-Erwähnungen
- "GoBD" — in §1/§2/§22/§23 als Topos-Verweis (Z3-/GDPdU-/GoBD-Export-Vollmodul; Bezugnahmen ausschließlich über Paraphrase in Register §3.10); kein Volltext-Lock.
- "AO" — in §22/§23 als Negativ-Quellgrundlage (kein Volltext-Lock); Bezugnahmen über Register §3.10.
- "GDPdU" — in §1/§2/§22/§23 als Topos-Verweis im Register §3.10; kein Volltext-Lock.
- "DSGVO Art. 33" — in §1/§13/§26 als Verweis auf rechtliche Meldepflichten, die strikt DSGVO-/Datenpannen V1.0 verbleiben.
- "DSGVO Art. 34" — in §1/§13/§26 als Verweis auf rechtliche Meldepflichten, die strikt DSGVO-/Datenpannen V1.0 verbleiben.
- "EStG § 41" — in §17 als Verweis auf Lohn-Tiefe, die im Lohn-DLS-Folgeartefakt verbleibt (außerhalb MVP).
- "BSI IT-Grundschutz" — in §1/§2/§22/§23/§24.2 als ausdrückliche Negativ-Quelle.
- "BSI TR-03116" — in §1/§2/§22/§23/§24.2 als ausdrückliche Negativ-Quelle.
- "ISO 22301" — in §1/§2/§22/§23/§24.2 als ausdrückliche Negativ-Quelle.
- "ISO 27035" — in §1/§2/§22/§23/§24.2 als ausdrückliche Negativ-Quelle.
- "NIST SP 800-61" — in §1/§2/§22/§24.2 als ausdrückliche Negativ-Quelle.
- "NIST SP 800-86" — in §1/§2/§22/§24.2 als ausdrückliche Negativ-Quelle.
- "ENISA" — in §1/§2/§22/§24.2 als ausdrückliche Negativ-Quelle.

## 7. Rule-ID-Erwähnungen
- "F3-D1", "F3-D2", "F3-D3", "F3-Closing", "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2" — Locked-Decisions-Register-Boundary-IDs durchgehend referenziert (entsprechen dem Rule-ID-Pattern für interne Lock-Identifier).
- "STOP 21.13" — Verweis auf DR-/HA-/BCM V1.0 §21 STOP 21.13 (Verschmelzung mit Z3) in §2/§8.
- "STOP 16.9" — Verweis auf TR-02102-Detail V1.0 §16 STOP 16.9 (Verschmelzung Z3) in §2.
- "STOP 12.7" — Verweis auf Lösch-/Sperrkonzept V1.0 §12 STOP 12.7 in §2/§15.
- "STOP 21.1" — Verweis auf Cybersecurity-IR §17 STOP 21.1 in §2.
- "STOP 20.1" — Verweis auf DSGVO-/Datenpannen §20 STOP 20.1 in §2.
- "STOP 14.12" — Verweis auf Dokumentenkategorie-/Retention-Regelmatrix §14 STOP 14.12 in §2.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Topos-Charakter: F3-D1 ist im Locked Decisions Register V1.0 §3.10 bereits autoritativ V1.0-locked; V1.0 dieses Folgeartefakts paraphrasiert §3.10 ausschließlich auf Boundary-Lock-Layer-Ebene und trifft keine neue Entscheidung" (§3).
- "Anlass-Trennung: Behördliche Z3-Datenüberlassung ist ein eigenständiger Anlass; sie ist nicht identisch mit Mandanten-Export, Migrations-Export, DR-Restore oder Retention-Archiv" (§3, §4).
- "Plaintext-Boundary: Plattform-Administration erzeugt keinen Z3-Export; ein Z3-Export-Pfad darf nicht zur Plaintext-Beschaffung genutzt werden" (§3, §10, §11).
- "F3-Closing-Konsistenz: Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell ≠ ASVS-Control-Referenz ≠ TR-02102-Detail ≠ DR-/HA-/BCM ≠ IR ≠ DSGVO-/Datenpannen" (§3, §21).
- "Primärgranularität: Prüfungszeitraum (paraphrasiert aus Register §3.10); Wirtschaftsjahr und Kalenderjahr nur als abgeleitete Größen" (§5).
- "Beschreibungsstandard als technische Bereitstellungshilfe — nicht Lock-Quelle dieses Folgeartefakts; keine Felder-Enumeration; keine Versionsfixierung" (§6).
- "Substitutions-Verbot: Eine Z3-/Datenüberlassung ist kein Substitut für das Retention-Archiv (Retention V1.0 §13)" (§7).
- "DR-Backup-Substitutions-Verbot: Ein DR-Backup darf nicht als Z3-Export ausgegeben werden" (§8).
- "F3-D1 unverändert: F3-D1 bleibt autoritativ; V1.0 dieses Folgeartefakts schwächt F3-D1 nicht" (§3, §21).
- "§28.11-bet bleibt unverändert/offen" — V1.0 ändert oder reinterpretiert §28.11-bet nicht (§3, §20, §21).

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Z3-Detail-Folgeartefakt — Datenkategorien-Enumeration, Datenfeld-Definitionen, Manifest-Topiken; offen; ausdrücklich nicht Bestandteil von V1.0" (§25).
- "Z1-/Z2-Folgeartefakte — eigenständige Folgeartefakte gemäß Register §6 Marker D; offen" (§25).
- "Lohn-DLS-Folgeartefakt — EStG § 41 Lohn-Tiefe; DLS Lohnsteuer-Außenprüfung außerhalb MVP gemäß Register §3.10/§6 Marker D; offen" (§25).
- "Migrations-Folgeartefakt — F3-D3-Implementierungs-Boundary; offen" (§25).
- "DR-/HA-/BCM-Operational-Detail — DR-/HA-/BCM-Boundary jenseits Boundary-Lock-Layer; offen" (§25).
- "KMS-/HSM-/Implementations-Folgeartefakt — Custody-/Schlüssel-Implementations-Boundary; offen" (§25).
- "Externe steuerprüfungs-fachliche Validierung — erforderlich; Non-Scope" (§25).
- "DSB-Validierung — erforderlich; Non-Scope" (§25).
- "Crypto-Shredding rechtliche Einordnung — Open-Question, Status 🔴 (Release-Blocker); keine Würdigung in V1.0" (§19, §25).
- "Verfahrensdokumentation Kap. 5 / Kap. 6 Endfassung — im Rahmen der jeweils nächsten Pflege; Non-Scope dieser V1.0" (§25).
- "§28.11-bet bleibt unverändert/offen" (§3, §20).

## 10. Verweise auf andere Specs
- retention-aufbewahrungsarchiv-v1.md (§2, §7 — §6.2/§13/§15/§17)
- dr-ha-bcm-v1.md (§2, §8 — §8/§16/§20/§21 STOP 21.13)
- security-key-custody-v1.md (§2, §11 — §6/§13/§17/§19)
- custody-modell-v1.md (§2, §10 — §5/§6/§10/§11/§13)
- tr-02102-detail-v1.md (§2, §11 — §12 Verhältnis zu Z3, §13/§15/§17, §16 STOP 16.9)
- asvs-control-referenz-v1.md (§2, §12 — §11/§14/§17)
- dokumentenkategorie-retention-regelmatrix-v1.md (§2, §16 — §12/§14 STOP 14.12/§16)
- loesch-sperrkonzept-v1.md (§2, §15 — §11/§12 STOP 12.7/§14)
- cybersecurity-incident-response-v1.md (§2, §14 — §14/§17 STOP 21.1/§19)
- dsgvo-datenpannen-v1.md (§2, §13 — §17/§20 STOP 20.1/§23)
- migration-v1.md (§9 — Migrations-Folgeartefakt)
- kms-hsm-implementations-v1.md (§10)
- Lohn-DLS-Folgeartefakt (§17, §25)
- Z1-/Z2-Folgeartefakte (§18, §25)
- Open-Question: `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` (§2, §19)
- Verfahrensdokumentation Kap. 5/Kap. 6 (§25)

## 11. Technische Stack-Erwähnungen
- "XML/CSV/Manifest/INDEX/GDPdU/DSFinV-K-Struktur" — durchgehend als Non-Scope-Format-Topoi erwähnt (§1, §6, §22, §24.3); keine konkrete Format-Wahl.
- "Datenbank-/Dateisystem-Schema, Datenmodell, Indizes" — als Non-Scope markiert (§1, §22, §24.12).
- "Übertragungsprotokoll, Container-Verschlüsselung, Datenträger-Verschlüsselung" — als Non-Scope-Verschlüsselungs-/Transport-Mechanik markiert (§11, §22, §24.14).
- "Cloud-/Anbieter-/Werkzeug-/Bibliotheks-/Plattform-/Hardware-/Übergabeplattform-/Storage-Wahl" — durchgehend als Non-Scope (§1, §22, §24.13).
- Keine konkrete positive Erwähnung von PostgreSQL, Supabase, React, TypeScript, RLS, Triggers oder Row-Level-Security; diese Begriffe erscheinen lediglich generisch im Negativ-Sinn als Werkzeug-Wahl-Topoi.
