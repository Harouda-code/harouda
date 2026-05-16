# Extraction-Statusbericht

**Erstellt am:** 2026-05-16
**Eingangs-Inventar:** `../_extraction-inventory.md`
**Quellverzeichnis:** `docs/architecture/specs/`
**Extract-Verzeichnis:** `docs/architecture/specs/_extracts/`

---

## 1. Erfolgs-Statistik

| Kennzahl | Wert |
|---|---:|
| Specs im Quellverzeichnis (V1) | 17 |
| Erfolgreich extrahiert | **17** |
| Parse-Probleme (STOP-Bedingung ausgelöst) | 0 |
| Übersprungene Specs | 0 |
| UTF-8-Codierung valide | 17/17 |
| Datei > 1 KB | 17/17 (kleinste: 19.0 KB / accounting-service-v1) |
| Erste H1 erkennbar | 17/17 |

**Fazit:** Keine strukturellen Anomalien. Alle 17 V1-Specs wurden vollständig extrahiert.

---

## 2. Kompressions-Ratio (Extract-KB vs. Original-KB)

| Spec | Original (Bytes) | Extract (Bytes) | Verhältnis |
|---|---:|---:|---:|
| accounting-service-v1 | 19 006 | 7 768 | 40.9 % |
| asvs-control-referenz-v1 | 35 594 | 6 246 | 17.5 % |
| custody-modell-v1 | 38 811 | 8 370 | 21.6 % |
| cybersecurity-incident-response-v1 | 52 245 | 7 210 | 13.8 % |
| dokumentenkategorie-retention-regelmatrix-v1 | 33 593 | 7 904 | 23.5 % |
| dr-ha-bcm-v1 | 52 778 | 7 785 | 14.7 % |
| dsgvo-datenpannen-v1 | 46 992 | 9 459 | 20.1 % |
| kms-hsm-implementations-v1 | 62 002 | 9 282 | 15.0 % |
| loesch-sperrkonzept-v1 | 27 242 | 6 451 | 23.7 % |
| lohn-dls-v1 | 53 597 | 7 764 | 14.5 % |
| migration-v1 | 55 795 | 7 958 | 14.3 % |
| retention-aufbewahrungsarchiv-v1 | 24 278 | 7 796 | 32.1 % |
| security-key-custody-v1 | 24 107 | 7 238 | 30.0 % |
| tr-02102-detail-v1 | 40 492 | 6 546 | 16.2 % |
| verfahrensdokumentation-v1 | 51 840 | 8 282 | 16.0 % |
| z1-z2-datenzugriffe-v1 | 58 221 | 7 645 | 13.1 % |
| z3-datenueberlassung-v1 | 45 558 | 8 607 | 18.9 % |
| **Gesamt** | **722 151** | **132 311** | **18.3 %** |

- **Original-Gesamtgröße:** 722 151 Bytes ≈ **705.2 KB**
- **Extract-Gesamtgröße:** 132 311 Bytes ≈ **129.2 KB**
- **Globale Kompressions-Ratio:** **18.3 %** (≈ 81.7 % Reduktion)

**Beobachtung:** Der einzige Ausreißer nach oben ist `accounting-service-v1` (40.9 %), weil dort als einziger Spec konkrete JSON-Schemata, RPC-Contracts und Idempotenz-Tabellen-Strukturen erfasst werden mussten. Die übrigen Boundary-Lock-Layer-Specs komprimieren konsistent auf 13–32 %.

---

## 3. Review-Prioritäten (Top 5 nach Dringlichkeits-Beurteilung)

Beurteilungsgrundlage: dichte konkreter Schema-/Frist-/Mechanik-Aussagen, Anzahl externer Lock-Referenzen, In-Degree im Cross-Reference-Graph, ungelöste Open Questions.

### Priorität 1 — `accounting-service-v1`
- **Begründung:** Einziger Spec mit echten Schemata (Journal-Entry-JSON-Schema, `journal_idempotency`), RPC-Verträgen, konkretem GoBD-Rz.-Mapping (Rz. 24/64/100). Direkte Anbindung an F0-D4 / F1-D1 / F1-D2. Jede Implementations-Abweichung berührt die Festschreibungs-Hierarchie.
- **Erwartete Konflikt-Punkte:** Idempotenz-Schema vs. aktuelle DB-Migrationen `0006_*`; RPC-Naming-Konsistenz; Mandantentrennung im Schema-Layer.

### Priorität 2 — `retention-aufbewahrungsarchiv-v1`
- **Begründung:** Kanonische Quelle für 10/8/6-Jahres-Fristen, Hemmung gemäß AO § 147 Abs. 3 Satz 5, Übergangsregeln Art. 97 § 19a EGAO + Art. 95 EGHGB (allgemein 2025 / verzögert 2026 für KWG/VAG/WpIG), Lieferschein-Sonderfall, §9 „Lohn — Grenze". Höchster In-Degree (16/16); ungelöste Crypto-Shredding-Frage.
- **Erwartete Konflikt-Punkte:** Übergangs-Stichtage; Hemmungs-Mechanik; Schnittstelle zum Fristen-Registry-Modul (Migrationen 0060–0071).

### Priorität 3 — `migration-v1`
- **Begründung:** Register §3.12 (F3-D3) ist bereits autoritativ V1-locked und enthält 71 STOP-Kandidaten. Migration-Boundary verbietet Inhaltsänderung, native F0-D4-Re-Festschreibung und USt-Werte-Übernahme. Direkter Trennlinien-Anker zu DR-Restore und Z3-Export.
- **Erwartete Konflikt-Punkte:** Cutover-Disziplin in App-Migrations-Pfaden; Roll-back-Semantik; Mehrmandanten-Paket-Trennung.

### Priorität 4 — `dokumentenkategorie-retention-regelmatrix-v1`
- **Begründung:** Klassifikations-Spiegel zur Retention-Spec mit AO § 147 Abs. 1 Nr. 1–5 + Abs. 3; konkretes Kategorisierungs-Raster, das jede Dokument-Entität im Code referenzieren muss. Hoher In-Degree.
- **Erwartete Konflikt-Punkte:** Klassifikations-Codes vs. tatsächliche Dokument-Tabellen; Lieferschein-/Lohnkonten-Sonderfälle.

### Priorität 5 — `lohn-dls-v1`
- **Begründung:** Verbleibt zwar außerhalb MVP gemäß Register §3.10 / §6 Marker D, **aber** im Repository existieren bereits App-Code-/UI-/Test-/Util-Pfade (`src/domain/lohn/**`, `src/utils/payroll*`, `src/utils/lohn*`, `src/pages/Lohn*`, `src/pages/Payroll*`, `src/lib/crypto/payrollHash*`). Die Spec autorisiert diese explizit **nicht**. Außerhalb-MVP-Disziplin muss mit existierendem App-Code abgeglichen werden.
- **Erwartete Konflikt-Punkte:** App-Code-Layer-Disziplin (Status der existierenden Lohn-/Payroll-Pfade); Marker-D-Geschwister-Verhältnis zu `z1-z2-datenzugriffe`.

---

## 4. Hinweise zur Methodik

- **Keine Originalspec geändert.** Sämtliche Schreiboperationen erfolgten ausschließlich in `_extracts/`.
- **Keine Interpretation.** Wo die Specs etwas wörtlich sagen, wurde wörtlich zitiert; wo sie etwas nicht sagen, wurde dies als „Keine … in dieser Spec" markiert.
- **Sicherheitskritische Aussagen vollständig erfasst.** Aufbewahrungsfristen (10/8/6 Jahre), Hemmung gemäß AO § 147 Abs. 3 Satz 5, Übergangsregeln (Art. 97 § 19a EGAO, Art. 95 EGHGB), Berufsgeheimnis (StGB § 203 / StBerG § 62a), BSI-TR-Versionen (TR-02102-1/2 V. 2026-01), ASVS-Version (5.0.0) wurden in jedem betroffenen Extract verbatim erhalten.
- **Sprache:** Deutsch, konsistent über alle 17 Extracts.
- **Keine Commits, kein Push, kein `git add`.** Nur Datei-Erstellung im Working Directory.
