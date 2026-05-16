# Extract: z1-z2-datenzugriffe-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/z1-z2-datenzugriffe-v1.md
- Dateigröße: 56.9 KB
- Zeilenanzahl: 437
- Erstellt am: 2026-05-09T17:14:55+02:00
- Erste H1-Überschrift im Dokument: Z1-/Z2-Datenzugriffe-Folgeartefakt V1.0

## 2. Zweck der Spec (in einem Satz)
V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im Locked Decisions Register V1.0 §6 Sortierungsmarker D verankerte Pflege-Boundary für Z1- (unmittelbarer/direkter) und Z2-Datenzugriffsarten (mittelbarer/indirekter) als combined Boundary-Lock-Layer-Spec neben Z3, ohne konkrete Mechanik festzulegen.

## 3. Hauptthemen (max 5 Bullet Points)
- Z1- (direkter Auditor-Lese-Zugriff) und Z2-Topoi (Mandanten-Auswertung auf Auditor-Anfrage) als combined Boundary-Lock-Layer-Spec analog Trio-Pattern `dr-ha-bcm-v1.md`
- Read-Only-Boundary und Audit-Spur-Boundary als gemeinsame Disziplinen für Z1 und Z2 ohne konkrete Mechanik
- Plattform-Admin-/Plaintext-Boundary-Spiegelung gegenüber F0-D7 + Custody V1.0 §13 + Security V1.0 §10
- Anlass-Trennung Z1/Z2 ≠ Z3 ≠ Migration ≠ Mandanten-Export ≠ DR-Backup ≠ Retention-Archiv ≠ Lohn-DLS
- Strikte Cross-Boundary-Trennlinien gegenüber allen 14 weiteren V1.0-Specs und Lohn-DLS-Folgeartefakt

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

## 6. Rechtsgrundlagen-Erwähnungen
- "AO § 147 Abs. 6" — in §2/§4/§29.1/§31 als ausdrückliche Negativ-Quelle (kein Volltext-Lock); paraphrasiert nur über Register §6 Marker D.
- "GoBD" — in §2/§4/§29.1/§31/§32 als Negativ-Quellgrundlage; Bezugnahme rein über Register §6 Marker D.
- "EStG § 41" — in §13 als Verweis auf Lohn-Tiefe, die im Lohn-DLS-Folgeartefakt verbleibt (außerhalb MVP).
- "DSGVO Art. 32" — in §24 als Topos-Verweis für Auditor-Zugriff auf personenbezogene Daten in Z1-/Z2-Pfaden; keine Auslegung.
- "DSGVO Art. 33" — in §24 als Verweis auf rechtliche Meldepflichten gemäß DSGVO V1.0.
- "DSGVO Art. 34" — in §24 als Verweis auf rechtliche Meldepflichten gemäß DSGVO V1.0.
- "IDW PS 880" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.
- "AWV-Muster-Verfahrensdokumentation" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.
- "Kammer-Verfahrensdokumentations-Standards" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.
- "BSI IT-Grundschutz" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.
- "BSI TR-03116" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.
- "ISO 27001" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.
- "ISO 27018" — in §2/§4/§29.1/§31/§32 als ausdrückliche Negativ-Quelle.

## 7. Rule-ID-Erwähnungen
- "F0-D4", "F0-D6", "F0-D7", "F1-D1", "F1-D2", "F3-D1", "F3-D2", "F3-D3", "F3-Closing" — als Locked-Decisions-Register-Boundary-IDs durchgehend referenziert (entsprechen dem Rule-ID-Pattern für interne Lock-Identifier).
- "STOP 24.15" — Verweis auf Z3 V1.0 §24.15 (Vermischungs-Verbot Z3 mit Z1/Z2) in §2.
- "STOP 29.15", "STOP 29.24" — Verweise auf Migration V1.0 STOP-Klauseln in §2.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Combined Boundary-Lock" — Z1 und Z2 werden in einer einzigen V1.0-Datei combined behandelt; V1.0 spaltet sie nicht in zwei separate Lock-Layer-Specs (§4, §3).
- "Z1-/Z2-Datenzugriff ≠ Z3-Datenüberlassung" — Z1 und Z2 sind eigenständige Datenzugriffsarten neben Z3 gemäß Register §6 Marker D (§4, §11).
- "Z1-/Z2-Datenzugriff ≠ Migrations-Mechanik" — Z1 und Z2 sind eigenständige Datenzugriffsarten neben Migrations-Anlässen (§4, §12).
- "F0-D4 Festschreibungs-Wahrung: Z1-/Z2-Datenzugriff ist Lese-Topos; kein Schreibzugriff durch Auditor" (§4, §7, §30).
- "F0-D6 Mandantentrennungs-Wahrung: Z1-/Z2-Datenzugriff bleibt mandantenscharf" (§4, §30).
- "F0-D7 Plattform-Admin-Wahrung: Plattform-Administration erlangt durch Z1-/Z2-Pfade keinen Plaintext-/Schlüssel-/Mandantendaten-Zugriff jenseits der für die Außenprüfungs-Topik erforderlichen reinen Lese-Topik" (§4, §9).
- "Read-Only-Topos auf Boundary-Ebene; konkrete Read-Only-Enforcement-Mechanismen sind Non-Scope" (§7).
- "Audit-Spur-Topos auf Boundary-Ebene; konkrete Audit-Schema-Felder sind Non-Scope" (§8).
- "Verbot einseitiger Plaintext-Macht über Z1-/Z2-Pfade — Spiegelung Custody V1.0 §13 + Security V1.0 §10" (§9, §17, §18).
- "§28.11-bet bleibt unverändert/offen" — V1.0 ändert oder reinterpretiert §28.11-bet nicht (§4, §28).

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "Z1-Detail-Folgeartefakt — Detail-Mechanik jenseits Boundary-Lock-Layer; offen; ausdrücklich nicht Bestandteil von V1.0" (§33).
- "Z2-Detail-Folgeartefakt — Detail-Mechanik jenseits Boundary-Lock-Layer; offen" (§33).
- "Externe steuerprüfungs-fachliche Validierung — erforderlich; Non-Scope dieser V1.0" (§33).
- "Externe DSB-Validierung — erforderlich vor produktiver bzw. rechtsverbindlicher Anwendung; Non-Scope dieser V1.0" (§33).
- "Sicherheits-/Produktivfreigabe — erforderlich; Non-Scope dieser V1.0" (§33).
- "Verfahrensdokumentation Kap. 5 Pflege — offen; Non-Scope dieser V1.0" (§33).
- "Verfahrensdokumentation Kap. 7 Pflege — offen; Non-Scope dieser V1.0" (§33).
- "Lohn-DLS-Folgeartefakt — Marker D, geteilt mit Z1-/Z2; außerhalb MVP; offen" (§33).
- "Crypto-Shredding rechtliche Einordnung — Open-Question, Status 🔴 (Release-Blocker); keine Würdigung in V1.0" (§26, §33).
- "Hash-Chain-vs.-Erasure-Open-Question — offen; keine Würdigung in V1.0" (§27, §33).
- "KMS-/HSM-Detail-Implementations-Folgeartefakte — offen" (§33).
- "§28.11-bet bleibt unverändert/offen" (§4, §28).

## 10. Verweise auf andere Specs
- z3-datenueberlassung-v1.md (§2, §11, §18 — kanonische Trennungs-Pattern-Vorlage aus Z3 V1.0 §18)
- migration-v1.md (§2, §12, §21 — zweite kanonische Trennungs-Pattern-Vorlage aus Migration V1.0 §21)
- security-key-custody-v1.md (§2, §18 — Plaintext-Boundary-Anker §6/§10/§13/§17)
- custody-modell-v1.md (§2, §17 — §5/§6/§10/§11/§13/§15 Plaintext-Boundary-Anker)
- kms-hsm-implementations-v1.md (§2, §19)
- retention-aufbewahrungsarchiv-v1.md (§14)
- loesch-sperrkonzept-v1.md (§15)
- dokumentenkategorie-retention-regelmatrix-v1.md (§16)
- asvs-control-referenz-v1.md (§20)
- tr-02102-detail-v1.md (§21)
- dr-ha-bcm-v1.md (§22 — Pattern-Vorbild für combined-Lock im Trio-Pattern)
- cybersecurity-incident-response-v1.md (§23)
- dsgvo-datenpannen-v1.md (§24)
- verfahrensdokumentation-v1.md (§25)
- Lohn-DLS-Folgeartefakt (§13, §33)
- Open-Questions: `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`, `docs/HASH-CHAIN-VS-ERASURE.md` (§2, §26, §27)

## 11. Technische Stack-Erwähnungen
- "RLS-Provider" — in §1/§2/§29.5 als Werkzeug-Wahl-Topos, ausdrücklich Non-Scope.
- "RLS-Konfiguration" — in §1/§7/§29.6/§31 als konkrete Konfiguration, ausdrücklich Non-Scope.
- "Auth-Provider" — in §1/§29.5/§31 als Werkzeug-Wahl-Topos, ausdrücklich Non-Scope.
- "Storage-/Cloud-/Plattform-/Hardware-/Bibliotheks-Wahl" — durchgehend als Non-Scope markiert (§1, §29.5, §31).
- "App-Code-Layer (`src/**`) und Demo-Pakete (`demo-package/**`)" — als nicht-editierbar markiert (§29.25, §31).
- Keine konkrete positive Erwähnung von PostgreSQL, Supabase, React, TypeScript, Triggers oder Row-Level-Security als architektonische Wahl; diese erscheinen nur generisch als Non-Scope-Topiken.
