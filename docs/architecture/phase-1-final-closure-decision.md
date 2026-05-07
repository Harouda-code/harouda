# Phase 1 Final Closure Decision

> **Repo-Pfad:** `docs/architecture/phase-1-final-closure-decision.md`
> **Status:** Verbindliche Closure-Entscheidung
> **Geltung:** Phase 1 → Phase 2/3 Übergang
> **Adressaten:** Engineering, Product, Legal, Datenschutzbeauftragter, Sicherheit

---

## 1. Entscheidung

Phase 1 Wrap-up ist abgeschlossen. Die Phase-1-Architektur, der Source-Layer, die Cross-Cutting-Matrices, das Rule-Record-Fundament und der Closure-Gate-Prozess wurden über die Wrap-up-Items W1 bis W8 vollständig durchlaufen und intern verifiziert.

Auf dieser Grundlage werden folgende Entscheidungen festgehalten:

- **Phase 1 Internal Architecture Closure ist gewährt.**
- **Phase 2 Implementierungs-Planung ist erlaubt**, ausschließlich unter den Bedingungen der PFRD-autoritativen Anforderungen.
- **Phase 3 Regel-Datenbank-Planung und -Implementierung ist erlaubt** auf Grundlage des in W6 definierten Rule-Record-Schemas.
- **Pilot/Beta-Planung ist erlaubt** durch Gate 2.5 unter kontrollierten Pilot-Bedingungen.
- **Market Launch ist nicht gewährt.**
- **Öffentliche Compliance-, Zertifizierungs- oder Behörden-Bestätigungs-Aussagen sind nicht erlaubt.**

> **Verbindliche Closure-Erklärung:**
>
> *„Mit diesem Dokument wird Phase 1 intern architektonisch geschlossen. Die Umsetzung von Phase 2 und Phase 3 darf auf Grundlage der PFRD-autoritativen Anforderungen beginnen. Diese Entscheidung ist keine Marktreife-Freigabe, keine Zertifizierung und kein öffentlicher Compliance-Anspruch.“*

---

## 2. Closure Level

Die folgende Tabelle hält die vier Gates und ihren aktuellen Status fest. Diese Trennung ist verbindlich; sie darf in interner und externer Kommunikation nicht zusammengeführt werden.

| Gate | Bezeichnung | Status |
|------|-------------|--------|
| **Gate 1** | Internal Architecture Closure | **gewährt** |
| **Gate 2** | Implementation Start | **erlaubt, ausschließlich unter PFRD-Bedingungen** |
| **Gate 2.5** | Pilot/Beta | **erlaubt, ausschließlich unter kontrollierten Pilot-Bedingungen** |
| **Gate 3** | Market Launch | **nicht gewährt** |

Architektonische Closure (Gate 1) ist eine interne Meilensteinerklärung. Sie sagt nichts über Marktreife, Vertriebsfreigabe oder Zertifizierungsstatus aus.

---

## 3. Final Quantitative State

Endstand der Phase-1-Architektur und der Wrap-up-Phase:

| Metrik | Endwert |
|--------|---------|
| Domains (1–10 + Domain X) | 11 |
| Acceptance Criteria | 269 |
| Audit Events | 87 |
| Retention Matrix Rows | 59 |
| Export Scope Rows | 70 |
| Permissions | 90 |
| Critical Permissions | 40 |
| Source References (unique, klassifiziert) | 48 |
| Expert Review Clusters | 9 |
| Pending Evidence | 0 |
| Critical Contradictions | 0 |
| Wrap-up Items | 8/8 abgeschlossen |
| Wrap-up Cycles | 26 |

Die Werte „Pending Evidence = 0“ und „Critical Contradictions = 0“ sind harte Voraussetzungen für die hier festgehaltene Closure und wurden in W7.4 verifiziert.

---

## 4. Authoritative Reference Hierarchy

Für jede Phase-2- und Phase-3-Arbeit gilt die PFRD-Sammlung und der zugehörige Supersession Index als verbindliche Referenz. Domain-V0.2-Inhalte bleiben gültig, soweit sie nicht durch eine spätere Korrektur abgelöst wurden.

Reihenfolge der Autorität (von oben nach unten):

1. **PFRD Supersession Index** — verbindliche Korrekturen und Ablösungen aus W5/W6/W7.
2. **W7.3 Final Matrices** — Audit Coverage, Retention Class Mapping, Export Scope, Permission.
3. **W6.2 Rule Record Schema** — Phase-3-Datenbank-Grundlage einschließlich Source-Linkage und Time-Versioning.
4. **Domain V0.2 Dokumente**, soweit nicht durch PFRD-Korrekturen abgelöst.
5. **W1–W4 Cross-Cutting Outputs** — Coverage Matrices, Consistency Decisions, Naming Authority, Domain X V0.2.

> **Konfliktregel:**
>
> *„Bei jedem Konflikt zwischen früheren Domain-V0.2-Referenzen und PFRD-Korrekturen gilt die PFRD-Korrektur.“*

---

## 5. Binding Supersession Rules

Die folgende Tabelle ist eine Auswahl der wichtigsten verbindlichen Ablösungen. Sie ist nicht abschließend; der vollständige Index befindet sich in der PFRD-Sammlung.

| Frühere Referenz | Autoritative Ablösung |
|------------------|------------------------|
| Wachstumschancengesetz als Quelle für 8-Jahre-Aufbewahrung | BEG IV in Verbindung mit Art. 97 § 19a EGAO |
| GoBD Rz. 73/74 für Festschreibung | GoBD Rz. 58–60 + 87–94 + 107–111 |
| StBerG § 64a | gelöscht; § 67 / § 55f nur dort, wo Berufshaftpflicht relevant ist |
| Generischer „secure transport“-Hinweis | DSGVO Art. 32 + BSI TR-02102-2 |
| Generische Krypto-Referenz | DSGVO Art. 32 + exakte BSI-Quelle, insbesondere TR-02102-1 v2026-01 |
| DATEV SKR availability als Redistribution-Recht | lizenzgebunden; keine Redistribution ohne rechtliche Grundlage |
| ZUGFeRD 2.3.x als aktuelle Version | ZUGFeRD 2.4, vom 04.12.2025, produktiv ab 15.01.2026 |
| Fest verdrahtete XRechnung 3.0.1 | XRechnung 3.0.x current productive line, versionsagil |
| BUCH als aktiver Functional Domain Code | BUCHUNG kanonisch; BUCH ausschließlich als Legacy-Alias |
| Undefinierte GoBD-Referenzkonvention | GoBD i.d.F. BMF 28.11.2019, geändert am 11.03.2024 und 14.07.2025 |

---

## 6. Implementation Quality Gate

Implementation darf nur aus PFRD-autoritativen Anforderungen abgeleitet werden. Folgende Bedingungen sind verbindlich:

- Der **PFRD Supersession Index** muss dem Engineering-Team in einer durchsuchbaren Form zur Verfügung stehen, bevor breite Phase-2/3-Arbeit beginnt.
- Ein **Forbidden Reference Linter** muss eingerichtet sein, bevor breite Phase-2/3-Dokumentation und Code-Arbeit anlaufen.
- Der Linter muss folgende Artefakte prüfen: **Code, Dokumentation, Spezifikationen, Migrationen, UI-Texte und Tests.**
- **Pull Requests müssen blockiert werden**, wenn sie verbotene oder abgelöste Referenzen einführen.
- **Jede implementierte Regel muss auf einen Rule Record und mindestens eine intern verifizierte Quelle zurückgeführt werden können** (`source_ids_primary` ist Pflicht).

Dieser Gate gilt für die gesamte Phase-2/3-Phase und bleibt bis zum nächsten formellen Closure-Update aktiv.

---

## 7. Forbidden Reference Linter Baseline

Die folgende Tabelle ist die Mindest-Konfiguration des Linters. Sie darf erweitert, aber nicht reduziert werden.

| Verbotene oder risikoreiche Referenz | Erforderliche Behandlung |
|--------------------------------------|--------------------------|
| Wachstumschancengesetz für Aufbewahrungsfrist | Ersetzen durch BEG IV |
| GoBD Rz. 73/74 für Festschreibung | Ersetzen durch korrigierte Rz.-Bereiche |
| StBerG § 64a | Entfernen oder ersetzen wie oben beschrieben |
| „GoBD-zertifiziert“ | verboten |
| „IDW-geprüft“ / „IDW-audited“ | verboten, sofern keine tatsächliche Prüfung abgeschlossen ist |
| „DATEV-zertifiziert“ | verboten ohne formelle Grundlage |
| „BSI-konform“ alleinstehend | vermeiden; nur „an BSI-Empfehlungen ausgerichtet“ nach rechtlicher Prüfung |
| „ELSTER-zertifiziert“ | verboten |
| Generischer „secure transport“ | Ersetzen durch BSI/TR-Referenz |
| „DATEV SKR enthalten / included“ | verboten ohne Lizenzgrundlage |
| BUCH als aktiver Code | Normalisieren zu BUCHUNG |
| OWASP Top 10 2021 | Aktualisieren auf OWASP Top 10 2025 |

---

## 8. Implementation Start Conditions

Phase-2- und Phase-3-Arbeit darf ausschließlich beginnen, wenn alle folgenden Bedingungen gleichzeitig erfüllt sind:

- Die **PFRD wird als verbindlich** behandelt; jede Implementation referenziert die PFRD-autoritative Form.
- **Keine öffentlichen Compliance- oder Zertifizierungs-Aussagen** werden während Implementierung, Pilot oder Beta verwendet.
- **Expert-review-needed Items bleiben getrackt** und dürfen nicht stillschweigend als gelöst behandelt werden.
- **Provider Access wird nicht aktiviert**, bevor das Schutzrahmenwerk aus StBerG § 62a, § 203 StGB und DSGVO Art. 28 vollständig vorliegt.
- **DATEV-Inhalte werden nicht gebündelt**, bevor eine formelle DATEV-Strategieentscheidung mit Rechtsprüfung getroffen wurde.
- Die **Regel-Datenbank unterstützt Time-Versioning** (`effective_from`, `effective_to`, `supersedes_rule_id`, `superseded_by_rule_id`).
- **Pilot/Beta wird nicht mit Market Launch verwechselt**; Pilot-Mandanten werden schriftlich über Status und Limitierungen aufgeklärt.

---

## 9. Market Launch Boundary

> **Marktreife-Grenze:**
>
> *„Market Launch remains blocked until the required expert review clusters, legal reviews, security reviews, DATEV strategy decision, marketing review, and pilot/beta validation are completed.“*

Vor jedem Market Launch sind die folgenden neun Expert-Review-Cluster abzuschließen; falls ein Cluster featurebedingt nicht einschlägig ist, ist die Nicht-Anwendbarkeit zu dokumentieren:

1. **Provider Access / Berufsgeheimnis** — StBerG § 62a, § 203 StGB, DSGVO Art. 28/32, AO § 102.
2. **Retention / BEG IV / Finanzsektor** — AO § 147, HGB § 257, UStG § 14b, Sektor-Ausnahmen.
3. **Audit append-only vs DSGVO Rechte** — DSGVO Art. 17 Abs. 3 lit. b, Art. 18, BDSG § 35.
4. **UStG operative Steuerlogik** — UStG §§ 14a, 14c, 17, 18; UStVA-Praxis.
5. **E-Rechnung Validation Stack** — EN 16931, KoSIT XRechnung, ZUGFeRD.
6. **BSI Crypto / TLS / Penetration Testing** — BSI TR-02102, TR-03116, IT-Grundschutz, ASVS.
7. **DATEV Licensing und Strategie** — SKR03/SKR04, DTVF, BU-Schlüssel, Lizenzfragen.
8. **Verfahrensdokumentation / AWV / IDW PS 880 Readiness** — Praktiker- und Wirtschaftsprüfer-Review.
9. **Marketing / Legal Claims / UWG** — Wettbewerbsrechts-Review aller externen Aussagen.

Solange diese Cluster nicht in der vorgesehenen Form bearbeitet sind, ist Gate 3 geschlossen.

---

## 10. Immediate Next Actions

Folgende Aktionen sind unmittelbar nach Annahme dieser Closure-Entscheidung einzuleiten. Die Reihenfolge ist empfehlend; mehrere Punkte können parallel laufen.

1. **PFRD-Index-Tooling auswählen** und für das Engineering-Team verfügbar machen.
2. **Forbidden Reference Linter implementieren** und in Pre-Commit, CI/CD und Documentation-Generator integrieren.
3. **Phase-2-Sprint-Breakdown** auf Basis der Implementierungs-Prioritäten P2-01 bis P2-10 vorbereiten.
4. **Phase-3 Regel-Datenbank-Schema implementieren** entsprechend dem in W6.2 finalisierten Rule-Record-Schema.
5. **DATEV-Strategie-Entscheidungsprozess starten** und durch das vorgesehene Expert-Review-Cluster begleiten lassen.
6. **Pre-Launch-Reviewer-Auswahl starten** für die neun Expert-Review-Cluster.
7. **Pilot/Beta-Vereinbarungs-Vorlage vorbereiten**, einschließlich Aufklärung über Status und Limitierungen.
8. **Marketing-Language-Review-Prozess vorbereiten**, der vor jeder externen Veröffentlichung greift.

---

## 11. Final Statement

> *„Phase 1 ist intern architektonisch geschlossen. Die nächste zulässige Arbeitsrichtung ist Phase 2/3 Planung und Umsetzung unter PFRD-Autorität. Markteinführung, Zertifizierungsbehauptungen und öffentliche Compliance-Aussagen bleiben gesperrt, bis die dafür vorgesehenen Gate-3-Prüfungen abgeschlossen sind.“*

---

*Ende des Dokuments.*
