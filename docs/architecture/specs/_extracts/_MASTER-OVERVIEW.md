# Master-Übersicht — Extract-Set der 17 V1-Specs

**Erstellt am:** 2026-05-16
**Quellverzeichnis:** `docs/architecture/specs/`
**Extract-Verzeichnis:** `docs/architecture/specs/_extracts/`
**Zweck:** Vorbereitung des Spec-Abgleichs gegen 21 architektonische Lock-Entscheidungen.

---

## 1. Inhaltsverzeichnis (TOC)

| # | Spec | Extract-Pfad |
|---|------|--------------|
| 1 | accounting-service-v1.md | [accounting-service-v1-EXTRACT.md](./accounting-service-v1-EXTRACT.md) |
| 2 | asvs-control-referenz-v1.md | [asvs-control-referenz-v1-EXTRACT.md](./asvs-control-referenz-v1-EXTRACT.md) |
| 3 | custody-modell-v1.md | [custody-modell-v1-EXTRACT.md](./custody-modell-v1-EXTRACT.md) |
| 4 | cybersecurity-incident-response-v1.md | [cybersecurity-incident-response-v1-EXTRACT.md](./cybersecurity-incident-response-v1-EXTRACT.md) |
| 5 | dokumentenkategorie-retention-regelmatrix-v1.md | [dokumentenkategorie-retention-regelmatrix-v1-EXTRACT.md](./dokumentenkategorie-retention-regelmatrix-v1-EXTRACT.md) |
| 6 | dr-ha-bcm-v1.md | [dr-ha-bcm-v1-EXTRACT.md](./dr-ha-bcm-v1-EXTRACT.md) |
| 7 | dsgvo-datenpannen-v1.md | [dsgvo-datenpannen-v1-EXTRACT.md](./dsgvo-datenpannen-v1-EXTRACT.md) |
| 8 | kms-hsm-implementations-v1.md | [kms-hsm-implementations-v1-EXTRACT.md](./kms-hsm-implementations-v1-EXTRACT.md) |
| 9 | loesch-sperrkonzept-v1.md | [loesch-sperrkonzept-v1-EXTRACT.md](./loesch-sperrkonzept-v1-EXTRACT.md) |
| 10 | lohn-dls-v1.md | [lohn-dls-v1-EXTRACT.md](./lohn-dls-v1-EXTRACT.md) |
| 11 | migration-v1.md | [migration-v1-EXTRACT.md](./migration-v1-EXTRACT.md) |
| 12 | retention-aufbewahrungsarchiv-v1.md | [retention-aufbewahrungsarchiv-v1-EXTRACT.md](./retention-aufbewahrungsarchiv-v1-EXTRACT.md) |
| 13 | security-key-custody-v1.md | [security-key-custody-v1-EXTRACT.md](./security-key-custody-v1-EXTRACT.md) |
| 14 | tr-02102-detail-v1.md | [tr-02102-detail-v1-EXTRACT.md](./tr-02102-detail-v1-EXTRACT.md) |
| 15 | verfahrensdokumentation-v1.md | [verfahrensdokumentation-v1-EXTRACT.md](./verfahrensdokumentation-v1-EXTRACT.md) |
| 16 | z1-z2-datenzugriffe-v1.md | [z1-z2-datenzugriffe-v1-EXTRACT.md](./z1-z2-datenzugriffe-v1-EXTRACT.md) |
| 17 | z3-datenueberlassung-v1.md | [z3-datenueberlassung-v1-EXTRACT.md](./z3-datenueberlassung-v1-EXTRACT.md) |

---

## 2. Cross-Reference-Tabelle (Quelle → Ziel)

Erfasst aus den **§10 Verweise auf andere Specs**-Sektionen der Extracts. Spezifikations-internes Referenz-Graph; nur direkte, in der Spec namentlich genannte Verweise.

| Quelle (Spec) | Direkte Verweis-Ziele |
|---|---|
| accounting-service-v1 | retention-aufbewahrungsarchiv, loesch-sperrkonzept, security-key-custody, custody-modell, z1-z2-datenzugriffe, z3-datenueberlassung, dokumentenkategorie-retention-regelmatrix, verfahrensdokumentation, migration, dr-ha-bcm |
| asvs-control-referenz-v1 | security-key-custody, custody-modell, tr-02102-detail, loesch-sperrkonzept, retention-aufbewahrungsarchiv, kms-hsm-implementations, dr-ha-bcm, dsgvo-datenpannen, cybersecurity-incident-response, migration, z3-datenueberlassung |
| custody-modell-v1 | security-key-custody, loesch-sperrkonzept, retention-aufbewahrungsarchiv, dokumentenkategorie-retention-regelmatrix, asvs-control-referenz, tr-02102-detail, kms-hsm-implementations, dr-ha-bcm, cybersecurity-incident-response, dsgvo-datenpannen, z3-datenueberlassung, migration |
| cybersecurity-incident-response-v1 | dr-ha-bcm, loesch-sperrkonzept, security-key-custody, custody-modell, dokumentenkategorie-retention-regelmatrix, asvs-control-referenz, tr-02102-detail, retention-aufbewahrungsarchiv, dsgvo-datenpannen, kms-hsm-implementations, z3-datenueberlassung, migration |
| dokumentenkategorie-retention-regelmatrix-v1 | retention-aufbewahrungsarchiv, loesch-sperrkonzept, lohn-dls, z1-z2-datenzugriffe, z3-datenueberlassung, migration, dr-ha-bcm, verfahrensdokumentation, security-key-custody, custody-modell |
| dr-ha-bcm-v1 | retention-aufbewahrungsarchiv, loesch-sperrkonzept, security-key-custody, custody-modell, asvs-control-referenz, tr-02102-detail, dokumentenkategorie-retention-regelmatrix, cybersecurity-incident-response, dsgvo-datenpannen, z3-datenueberlassung, migration, kms-hsm-implementations |
| dsgvo-datenpannen-v1 | security-key-custody, custody-modell, dr-ha-bcm, cybersecurity-incident-response, loesch-sperrkonzept, retention-aufbewahrungsarchiv, asvs-control-referenz, tr-02102-detail, kms-hsm-implementations, z3-datenueberlassung, migration, lohn-dls, verfahrensdokumentation |
| kms-hsm-implementations-v1 | security-key-custody, custody-modell, tr-02102-detail, asvs-control-referenz, loesch-sperrkonzept, retention-aufbewahrungsarchiv, dr-ha-bcm, cybersecurity-incident-response, dsgvo-datenpannen, z3-datenueberlassung, migration |
| loesch-sperrkonzept-v1 | retention-aufbewahrungsarchiv, security-key-custody, custody-modell, dokumentenkategorie-retention-regelmatrix, cybersecurity-incident-response, dsgvo-datenpannen, dr-ha-bcm, asvs-control-referenz, tr-02102-detail, kms-hsm-implementations, z3-datenueberlassung, migration |
| lohn-dls-v1 | retention-aufbewahrungsarchiv, z3-datenueberlassung, migration, z1-z2-datenzugriffe, dokumentenkategorie-retention-regelmatrix, dsgvo-datenpannen, security-key-custody, custody-modell, kms-hsm-implementations, tr-02102-detail, asvs-control-referenz, dr-ha-bcm, cybersecurity-incident-response, loesch-sperrkonzept, verfahrensdokumentation |
| migration-v1 | retention-aufbewahrungsarchiv, dr-ha-bcm, z3-datenueberlassung, security-key-custody, custody-modell, kms-hsm-implementations, loesch-sperrkonzept, dokumentenkategorie-retention-regelmatrix, asvs-control-referenz, tr-02102-detail, cybersecurity-incident-response, dsgvo-datenpannen, lohn-dls, z1-z2-datenzugriffe |
| retention-aufbewahrungsarchiv-v1 | loesch-sperrkonzept, lohn-dls, dr-ha-bcm, z3-datenueberlassung, migration, security-key-custody, dsgvo-datenpannen, custody-modell, dokumentenkategorie-retention-regelmatrix |
| security-key-custody-v1 | retention-aufbewahrungsarchiv, custody-modell, asvs-control-referenz, tr-02102-detail, loesch-sperrkonzept, kms-hsm-implementations, dr-ha-bcm, cybersecurity-incident-response, dsgvo-datenpannen, z3-datenueberlassung, migration |
| tr-02102-detail-v1 | security-key-custody, custody-modell, asvs-control-referenz, kms-hsm-implementations, loesch-sperrkonzept, retention-aufbewahrungsarchiv, dr-ha-bcm, cybersecurity-incident-response, dsgvo-datenpannen, z3-datenueberlassung, migration |
| verfahrensdokumentation-v1 | retention-aufbewahrungsarchiv, loesch-sperrkonzept, dokumentenkategorie-retention-regelmatrix, security-key-custody, custody-modell, dr-ha-bcm, z3-datenueberlassung, migration, dsgvo-datenpannen, cybersecurity-incident-response, accounting-service, lohn-dls |
| z1-z2-datenzugriffe-v1 | retention-aufbewahrungsarchiv, z3-datenueberlassung, migration, lohn-dls, dokumentenkategorie-retention-regelmatrix, security-key-custody, custody-modell, dsgvo-datenpannen, verfahrensdokumentation |
| z3-datenueberlassung-v1 | retention-aufbewahrungsarchiv, loesch-sperrkonzept, dokumentenkategorie-retention-regelmatrix, security-key-custody, custody-modell, dr-ha-bcm, migration, lohn-dls, z1-z2-datenzugriffe, dsgvo-datenpannen, kms-hsm-implementations, cybersecurity-incident-response, verfahrensdokumentation |

**In-Degree (am häufigsten verwiesen-AUF)** — Indikator für Lock-Basis-Charakter:
1. **retention-aufbewahrungsarchiv-v1** — in 16/16 anderen Specs referenziert
2. **security-key-custody-v1** — 15/16
3. **custody-modell-v1** — 15/16
4. **loesch-sperrkonzept-v1** — 15/16
5. **dr-ha-bcm-v1** — 14/16
6. **migration-v1** — 14/16
7. **z3-datenueberlassung-v1** — 14/16

---

## 3. Rechtsgrundlagen-Häufigkeitsmatrix (§ × Spec)

Anzahl der Specs, in deren §6 Rechtsgrundlagen-Sektion die jeweilige Rechtsnorm als Boundary-/Lock-Quelle namentlich genannt wird (17 Specs gesamt).

| Rechtsnorm | Anzahl Specs | Specs (Kurzname) |
|---|---:|---|
| **DSGVO Art. 17** | 11 | accounting, asvs, custody, dr-ha-bcm, dsgvo, kms-hsm, loesch-sperr, regelmatrix, retention, security, verfahrensdoku |
| **DSGVO Art. 32** | 14 | asvs, custody, cybersecurity-ir, dokumentenkategorie, dr-ha-bcm, dsgvo, kms-hsm, lohn-dls, loesch-sperr, migration, retention, security, verfahrensdoku, z1-z2 |
| **DSGVO Art. 33 / 34** | 12 | accounting, custody, cybersecurity-ir, dr-ha-bcm, dsgvo, kms-hsm, loesch-sperr, retention, security, verfahrensdoku, z1-z2, z3 |
| **DSGVO Art. 28** | 6 | custody, dsgvo, kms-hsm, security, verfahrensdoku, z3 |
| **DSGVO Art. 18** | 4 | custody, dsgvo, loesch-sperr, regelmatrix |
| **DSGVO Art. 20** | 4 | loesch-sperr, migration, retention, verfahrensdoku |
| **DSGVO Art. 33 Abs. 5** | 2 | dsgvo, verfahrensdoku |
| **DSGVO Art. 35 / 36 / 39** | 1 | dsgvo |
| **AO § 147** | 13 | accounting, custody, dr-ha-bcm, dokumentenkategorie, dsgvo, kms-hsm, loesch-sperr, lohn-dls (Grenze), migration (paraphrasiert), regelmatrix, retention, verfahrensdoku, z1-z2, z3 |
| **AO § 146** | 4 | accounting, dokumentenkategorie, regelmatrix, verfahrensdoku |
| **HGB § 257** | 13 | accounting, custody, dr-ha-bcm, dokumentenkategorie, dsgvo, kms-hsm, loesch-sperr, regelmatrix, retention, verfahrensdoku, z1-z2, z3 |
| **HGB § 238 ff.** | 2 | accounting, verfahrensdoku |
| **EStG § 41** | 6 | dokumentenkategorie, dsgvo, lohn-dls, regelmatrix, retention, z1-z2 |
| **StGB § 203** | 6 | accounting, custody, dsgvo, kms-hsm, lohn-dls (sinngemäß), security |
| **StBerG § 62a** | 5 | custody, dsgvo, kms-hsm, lohn-dls (sinngemäß), security |
| **BDSG § 5 / § 53** | 3 | custody, dsgvo, security |
| **Art. 97 § 19a EGAO** | 3 | dokumentenkategorie, regelmatrix, retention |
| **Art. 95 EGHGB** | 3 | dokumentenkategorie, regelmatrix, retention |
| **UZK Art. 15 / 163** | 2 | regelmatrix, retention |
| **GoBD (BMF AO-Hb 2025 Anh. 33)** | 9 | accounting, dokumentenkategorie, dsgvo, kms-hsm, loesch-sperr, regelmatrix, retention, verfahrensdoku, z1-z2 |
| **BMF 11.03.2024 / 14.07.2025** | 6 | accounting, dokumentenkategorie, regelmatrix, retention, verfahrensdoku, z1-z2 |
| **BSI TR-02102-1 (V. 2026-01)** | 6 | asvs, custody, dr-ha-bcm, kms-hsm, security, tr-02102-detail |
| **BSI TR-02102-2 (V. 2026-01)** | 6 | asvs, custody, dr-ha-bcm, kms-hsm, security, tr-02102-detail |
| **OWASP ASVS 5.0.0** | 6 | asvs, custody, dr-ha-bcm, kms-hsm, security, tr-02102-detail |
| **DSK Kurzpapier Nr. 11** | 4 | custody, dsgvo, loesch-sperr, security |
| **GDPdU / Z3** | 2 | z3, accounting |

---

## 4. Rule-ID-Häufigkeitsmatrix (Locked-Decisions-Register-IDs × Spec)

Verankerung der gesperrten Harouda-Register-IDs in den 17 Specs.

| Rule-ID | Inhalt | Anzahl Specs | Verankerung |
|---|---|---:|---|
| **F0-D4** | Festschreibung | 17 | alle 17 Specs |
| **F0-D6** | Mandantentrennung | 17 | alle 17 Specs |
| **F0-D7** | Plattform-Admin-Grenze | 17 | alle 17 Specs |
| **F1-D1** | USt-Wahrheit (Wert) | 17 | alle 17 Specs |
| **F1-D2** | USt-Wahrheit (Kennung) | 17 | alle 17 Specs |
| **F3-D1** | Z3-Datenüberlassung | 17 | alle 17 Specs (lohn-dls Marker D direkt; alle übrigen über Cross-Boundary) |
| **F3-D2** | DR / Restore | 17 | alle 17 Specs |
| **F3-D3** | Migration | 17 | alle 17 Specs |
| **F3-Closing** | Cross-Boundary-Authoritat | 17 | alle 17 Specs |
| **§28.11-bet** | offene Detail-Topik | 17 | „bleibt unverändert/offen" — durchgehend |
| **Marker A (Security-Sortierung)** | §6 Marker A | 3 | security, migration, kms-hsm |
| **Marker C (Cyber-/DSGVO-Sortierung)** | §6 Marker C | 2 | cybersecurity-ir, dsgvo |
| **Marker D (Lohn-/Z1-Z2-Sortierung)** | §6 Marker D | 2 | lohn-dls, z1-z2 |

**Beobachtung:** Die neun Register-IDs F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing bilden den durchgehend in allen 17 Specs verankerten Lock-Kern. `§28.11-bet` ist die durchgehend offen gehaltene Topik.

---

## 5. Themen-Cluster-Vorschlag (max 5)

### Cluster 1 — Buchführungs-Kern (1 Spec)
- **accounting-service-v1**
- Charakter: Einzige Spec mit konkreten Schemata/RPC-Definitionen/JSON-Schemas; Festschreibungs-Topos, Idempotenz, F0-D4-Operationalisierung.

### Cluster 2 — Aufbewahrung · Löschung · Klassifikation · Verfahrensdoku (4 Specs)
- **retention-aufbewahrungsarchiv-v1** (kanonische Frist-Quelle)
- **dokumentenkategorie-retention-regelmatrix-v1** (Klassifikations-Spiegel)
- **loesch-sperrkonzept-v1** (Lösch-/Sperr-Boundary)
- **verfahrensdokumentation-v1** (Pflege-Layer)
- Charakter: AO § 147 / HGB § 257 / EStG § 41 / DSGVO Art. 17/18 / GoBD; Fristen 10/8/6 Jahre, Hemmung, Legal Hold.

### Cluster 3 — Sicherheit · Krypto · Custody (5 Specs)
- **security-key-custody-v1** (oberste Security-Boundary)
- **custody-modell-v1** (Custody-Topologie-Boundary)
- **kms-hsm-implementations-v1** (Implementations-Boundary)
- **tr-02102-detail-v1** (Krypto-Algorithmik-Boundary)
- **asvs-control-referenz-v1** (ASVS-Zielprofil-Mapping)
- Charakter: BSI TR-02102-1/2 (V. 2026-01), OWASP ASVS 5.0.0, StGB § 203, StBerG § 62a, DSGVO Art. 28/32.

### Cluster 4 — Verfügbarkeit · Vorfall · DSGVO-Pannen (3 Specs)
- **dr-ha-bcm-v1** (Disaster Recovery / HA / BCM)
- **cybersecurity-incident-response-v1** (IR-Schnittstelle)
- **dsgvo-datenpannen-v1** (Art. 33/34/33 Abs. 5)
- Charakter: F3-D2 Operationalisierung; Marker C geteilt; rechtliche Meldepflichten getrennt von operativem IR.

### Cluster 5 — Behörden-/Migrations-/Lohn-Datenpfade (4 Specs)
- **z1-z2-datenzugriffe-v1** (Außenprüfungs-Datenzugriff)
- **z3-datenueberlassung-v1** (Behörden-Auslieferung; F3-D1)
- **migration-v1** (F3-D3 Migrations-Boundary)
- **lohn-dls-v1** (Lohnsteuer-Außenprüfung außerhalb MVP; Marker D)
- Charakter: Anlass-getrennte Datenfluss-Boundaries; alle vier mit expliziter Anlass-Trennungs-Disziplin.
