# Extract: verfahrensdokumentation-v1.md

## 1. Metadaten
- Originalpfad: docs/architecture/specs/verfahrensdokumentation-v1.md
- Dateigröße: 50.6 KB
- Zeilenanzahl: 398
- Erstellt am: 2026-05-09T15:59:56+02:00
- Erste H1-Überschrift im Dokument: Verfahrensdokumentations-Pflege-Pass V1.0

## 2. Zweck der Spec (in einem Satz)
V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene und konkretisiert auf Boundary-Lock-Layer-Ebene die im Locked Decisions Register V1.0 §6 Sortierungsmarker B angelegte Pflege-Boundary für die im Repository bereits angelegte Verfahrensdokumentations-STUB-Schicht, ohne diese STUB-Dateien zu verändern.

## 3. Hauptthemen (max 5 Bullet Points)
- Marker-B-Operationalisierung als Boundary-Lock-Layer ohne Verfahrensdokumentations-Endfassung
- Inventar-Verweis auf die zehn existierenden Verfahrensdoku-STUB-Dateien (Top-Level + README + Kap. 01–08) ohne Edit
- Pflege-Eingangs-Matrix der zwölf V1.0-Boundary-Lock-Layer-Specs gegenüber Kap. 5 (Datensicherheit/Datenschutz) und Kap. 6 (Aufbewahrung/Lösch)
- Negativ-Quellgrundlage gegenüber externen Normen (ISO 22301, ISO 27001/27035, NIST, ENISA, BSI IT-Grundschutz, BSI TR-02102, BSI TR-03116, IDW PS 880, AWV-Muster, Kammer-Standards)
- Open-Question-Verweise auf Crypto-Shredding und Hash-Chain-vs.-Erasure ohne Würdigung

## 4. Schema-Vorschläge
Keine Schema-Vorschläge in dieser Spec.

## 5. Workflow-Definitionen
Keine Workflow-Definitionen in dieser Spec.

## 6. Rechtsgrundlagen-Erwähnungen
- "GoBD" — in §1 als Marker-B-Bezeichnung ("Verfahrensdokumentations-Artefakt — GoBD-Verfahrensdokumentation") und in §2/§26/§27 als Negativ-Quellgrundlage (kein Volltext) erwähnt.
- "AO § 147" — in §5, §6, §7, §10 als Topos-Verweis ("AO § 147 / HGB § 257 / GoBD-Topiken") für Kap.-6-Pflege-Boundary erwähnt; keine Auslegung.
- "HGB § 257" — in §5, §6, §7, §10 in derselben Topos-Trias erwähnt; keine Auslegung.
- "DSGVO" — in §2/§12/§26/§27 als Negativ-Quellgrundlage (kein Volltext-Lock); konkrete Artikelverweise durchgehend nur als Topos-Verweis.
- "DSGVO Art. 32" — in §6 als Topos-Verweis für Kap.-5-Datenschutz-Vorfallsprozess-Schnittstelle erwähnt.
- "DSGVO Art. 33" — in §6, §7 als Topos-Verweis (insbesondere Art. 33 Abs. 5 als Dokumentations-Boundary in Kap. 6).
- "DSGVO Art. 33 Abs. 5" — in §7 als Dokumentations-Boundary-Topos für Kap. 6 erwähnt.
- "DSGVO Art. 34" — in §6 als Topos-Verweis für Kap.-5-Schnittstelle erwähnt.
- "DSGVO Art. 39" — in §6 als Topos-Verweis erwähnt.
- "ISO 22301" — in §1/§2/§26/§27/§29.3 als ausdrückliche Negativ-Quelle.
- "ISO 27001/27035" — in §1/§2/§26/§27/§29.3 als ausdrückliche Negativ-Quelle.
- "NIST SP 800-61" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "NIST SP 800-86" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "ENISA" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "BSI IT-Grundschutz" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "BSI TR-02102" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "BSI TR-03116" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "IDW PS 880" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "AWV-Muster-Verfahrensdokumentation" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.
- "Kammer-Verfahrensdokumentations-Standards" — in §1/§2/§26/§29.3 als ausdrückliche Negativ-Quelle.

## 7. Rule-ID-Erwähnungen
- "OWASP-ASVS-Zielprofil-Format `v5.0.0-X.Y.Z`" — in §6 als reine Verweis-Layer (keine Mapping-Befüllung) erwähnt.

## 8. Architektonische Aussagen (max 10 Bullet Points)
- "Pflege-Layer ≠ Endfassung" — V1.0 ist Pflege-Direction-Boundary-Lock; sie ersetzt nicht die Endfassung Kap. 1–8 und finalisiert keine Inhalte (§3).
- "Existierende STUB-Schicht unverändert" — V1.0 berührt die existierenden zehn Verfahrensdoku-Dateien nicht und löscht keinen TODO-Marker (§3, §8).
- "Pflege-Eingangs-Boundary" — Die zwölf V1.0-Boundary-Lock-Layer-Specs liefern Pflege-Eingänge (Topos-Verweise) für Kap. 5 und Kap. 6 (§3, §5).
- "Negativ-Boundary-Disziplin" — V1.0 ist negativ formuliert: sie legt fest, was Pflege nicht ist und welche Inhalte explizit Non-Scope sind (§3).
- "App-Code-Layer unverändert" — `src/pages/VerfahrensdokuPage.tsx`, `src/pages/VerfahrensdokuPage.css`, `src/utils/verfahrensdokumentation.ts` werden weder referenziert noch modifiziert (§4, §8, §26).
- "Demo-Pakete unverändert" — `demo-package/.../docs/verfahrensdokumentation.md` ist keine Lock-Quelle (§4, §8, §26).
- "Locked Decisions Register unverändert" — V1.0 dieses Folgeartefakts modifiziert den Locked Decisions Register nicht (§9).
- "Open-Question-Dateien unverändert" — V1.0 ändert weder `crypto-shredding-rechtliche-einordnung.md` noch `HASH-CHAIN-VS-ERASURE.md` (§22, §23).
- "F0-D4, F0-D6, F0-D7, F1-D1/F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ" — V1.0 schwächt keinen dieser Locks (§3, §25).
- "§28.11-bet bleibt unverändert/offen" — V1.0 ändert oder reinterpretiert §28.11-bet nicht (§3, §24).

## 9. Offene Punkte / TODOs / Lücken in der Spec
- "TODO-Marker und Abhängigkeits-Hinweise unverändert: V1.0 löscht keinen TODO-Marker und ändert keinen Abhängigkeits-Hinweis (insbesondere die Hash-Chain-vs.-Erasure-Abhängigkeit in Kap. 5 §5.4/§5.5 und Kap. 6 §6.3 bleibt unberührt)" (§8).
- "Crypto-Shredding rechtliche Einordnung — Open-Question, Status 🔴 (Release-Blocker für produktive Anwendung)" (§22, §28).
- "Hash-Chain-vs.-Erasure-Open-Question — von Kap. 5 §5.4/§5.5 und Kap. 6 §6.3 ausdrücklich als Abhängigkeit benannt" (§2, §23, §28).
- "§28.11-bet bleibt unverändert/offen" (§3, §24, §30).
- "Externe steuerprüfungs-fachliche Validierung — erforderlich; Non-Scope dieser V1.0" (§28, §30).
- "Externe DSB-Validierung — erforderlich; Non-Scope dieser V1.0" (§28, §30).
- "Sicherheits-/Produktivfreigabe — erforderlich; Non-Scope dieser V1.0" (§28, §30).
- "Forbidden-Reference-Token-Cleanup-Initiative — eigenständige spätere Cleanup-Initiative gegen die grandfathered Risiko-Token in der existierenden Verfahrensdoku-STUB-Schicht; offen; Non-Scope dieser V1.0" (§28).
- "Verfahrensdokumentation Kap. 1–8 Pflege — offen; Non-Scope dieser V1.0" (§28).

## 10. Verweise auf andere Specs
- retention-aufbewahrungsarchiv-v1.md (§5, §10 — Pflege-Eingang Kap. 6)
- security-key-custody-v1.md (§5, §11 — Pflege-Eingang Kap. 5)
- loesch-sperrkonzept-v1.md (§5, §12 — Pflege-Eingang Kap. 6)
- dokumentenkategorie-retention-regelmatrix-v1.md (§5, §13)
- custody-modell-v1.md (§5, §14)
- asvs-control-referenz-v1.md (§5, §15)
- tr-02102-detail-v1.md (§5, §16)
- dr-ha-bcm-v1.md (§5, §17)
- cybersecurity-incident-response-v1.md (§5, §18)
- dsgvo-datenpannen-v1.md (§5, §19)
- z3-datenueberlassung-v1.md (§5, §20)
- migration-v1.md (§5, §21)
- Architektur-/HA-/BCM-Artefakt (§9 — geteilter Marker B)
- KMS-/HSM-/Implementations-Folgeartefakt (§28)
- Z1-/Z2-Folgeartefakte (§28)
- Lohn-DLS-Folgeartefakt (§28)
- Existierende Verfahrensdoku-STUB-Schicht: `docs/verfahrensdokumentation.md`, `docs/verfahrensdokumentation/README.md`, `docs/verfahrensdokumentation/01-08-*.md` (§4)
- Open-Questions: `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`, `docs/HASH-CHAIN-VS-ERASURE.md` (§2, §22, §23)

## 11. Technische Stack-Erwähnungen
- "App-Code: `src/pages/VerfahrensdokuPage.tsx`, `src/pages/VerfahrensdokuPage.css`, `src/utils/verfahrensdokumentation.ts`" — in §4/§8/§26/§29.16 als ausdrücklich nicht zu modifizierender Code-Layer erwähnt; kein Inspektions-Gegenstand.
- "RLS-Provider" — in §1/§26/§29.12 als Werkzeug-Wahl-Topos, der ausdrücklich Non-Scope ist.
- "Auth-/Berechtigungs-/Storage-Provider" — in §1/§26/§29.12 als Werkzeug-Wahl-Topos, ausdrücklich Non-Scope.
- Keine konkrete Erwähnung von PostgreSQL, Supabase, React, TypeScript, Triggers oder Row-Level-Security als positive Architektur-Wahl; diese Begriffe erscheinen nur generisch als "Werkzeug-/Tool-/Anbieter-/Cloud-/Plattform-/Hardware-/Bibliotheks-/Storage-/Auth-/Berechtigungs-/RLS-Provider-Wahl" und sind Non-Scope.
