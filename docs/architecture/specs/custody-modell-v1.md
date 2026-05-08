# Custody-Modell-Boundary-Artefakt — V1.0

**Lock-Aussage:** Custody-Modell-Boundary-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. V1.0 sperrt ausschließlich die Boundary-/Spec-Ebene; sie wählt **keine** konkrete Custody-Topologie, **keine** Schlüsselverwaltungs-Modellklasse, **keine** Schlüsselhierarchie, **keine** Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Modell-/Hardware-Lösung, **keine** Algorithmen, **keine** Cipher Suites, **keine** TLS-Parameter und **keine** Schlüssellängen. V1.0 erteilt **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe und **keine** Produktivfreigabe. Eine externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. Keine weitere Review-Runde auf Boundary-Ebene.

---

## 1. Dokumentstatus

| Feld | Wert |
|---|---|
| Artefakt | Custody-Modell-Boundary-Artefakt |
| Version | V1.0 |
| Status | Locked auf Boundary-/Spec-Ebene |
| Charakter | Internes Architektur-/Spezifikationsartefakt; **keine** Rechtsauskunft, **keine** Steuerauskunft, **keine** DSB-Freigabe, **keine** Sicherheitsfreigabe, **keine** Produktivfreigabe |
| Zweck | Festlegung der fachlichen Custody-Boundaries für die Verwaltung kryptographischen Schlüsselmaterials in Harouda; Trennung von Plattform-Administration und Plaintext-Hoheit; mandantenscharfe Schlüssel-Segregation; Schlüssel-Lebenszyklus-Boundary; Crypto-Shredding ausschließlich als Architektur-Option ohne rechtliche Würdigung |
| Scope | Boundary-Aussagen zu: Plattform-Admin-/Plaintext-Trennung; Storage-/Chiffrat-Zugriff vs. Entschlüsselungs-Fähigkeit; mandantenspezifischer Schlüssel-Segregation; Schlüssel-Lebenszyklus-Phasen als Boundary-Topoi; Crypto-Shredding als downstream-bedingte Option; Cross-Boundary-Konsistenz mit gesperrten Harouda-Locks und mit Security V1.0 / Lösch-/Sperrkonzept V1.0 / Regelmatrix V1.0 / Retention V1.0 |
| Non-Scope | Konkrete Custody-Topologie, konkrete Schlüsselverwaltungs-Modellklasse, DEK/KEK-Hierarchie, Envelope-Encryption, Per-Artifact-Key-Modell, Per-Subject-Key-Modell, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey-Schemata, KMS-/HSM-Modellwahl, Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl, Algorithmen, Modi, Cipher Suites, TLS-Versionen, Schlüssellängen, kryptographische Parameter, Schlüsselrotations-Mechanik, Schlüsselzerstörungs-Mechanik, Schlüsselwiederherstellungs-Mechanik, Grace-Periods, Audit-Log-Schema, Implementierung, Datenmodell/Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, APIs, automatische Jobs, Incident-Response-Runbook, DR-/HA-/BCM-Design, Z3-/Datenüberlassungs-Format, Migrations-Implementierung, rechtliche Würdigung von Crypto-Shredding, Endfassung Verfahrensdokumentation Kap. 5, Rechtsgutachten, Steuerauskunft, DSB-/Sicherheits-/Produktivfreigabe, Zertifizierungs- oder Marketing-Aussagen |
| Lock-Basis | Security-/Krypto-/Key-Custody-Artefakt V1.0 (direkte Quelle der Custody-Boundary; §17 / Lock-Profil als Auftrag); Lösch-/Sperrkonzept-Artefakt V1.0 §11 / §14 (Voraussetzung für jegliche operative Anwendung von Crypto-Shredding); Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 (Schutz der aufbewahrungspflichtigen Inhalte); Dokumentenkategorie-/Retention-Regelmatrix V1.0 (Schutz der Klassifikations-Audit-Nachweise); gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing |
| Vorrang-Regel | Bei Konflikt mit Security V1.0 gilt Security V1.0. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0. Bei Konflikt mit Retention V1.0 gilt Retention V1.0. Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Schnittstellen. Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. |
| Implementierungs-Autorisierung | Keine. Dieses Artefakt autorisiert keine technische Umsetzung, keine Schema-/Topologie-/Anbieter-/Produkt-Wahl, keinen Schlüsselverwaltungs-Job, keine API, keine Beschaffung. |

**Wichtiger Hinweis zur Verankerung:** Die Custody-Modell-Boundary ist im *Harouda Locked Decisions Register V1.0* in §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Sie figuriert dort innerhalb des Sortierungsmarker-A-Komplexes „Security-/Krypto-/Key-Custody-Artefakt — Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze". Die Bindungsgrundlage dieses Artefakts leitet sich ausschließlich ab aus:
- Security-/Krypto-/Key-Custody-Artefakt V1.0 §17 / Lock-Profil (Custody-Modell als benannter Downstream-Auftrag),
- Lösch-/Sperrkonzept-Artefakt V1.0 §11 (Verhältnis zu benachbarten Artefakten) und §14 (Downstream Artefakte),
- Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 §11 (Speicher-/Schlüsselverwaltungs-Defer),
- Dokumentenkategorie-/Retention-Regelmatrix V1.0 §16 (indirekte Relevanz für Klassifikations-Audit-Nachweise).

V1.0 dieses Artefakts modifiziert den Locked Decisions Register **nicht** und behauptet **keine** Register-Verankerung, die nicht existiert.

---

## 2. Zweck und fachliche Rolle

Das Custody-Modell-Boundary-Artefakt definiert die fachlichen Grenzen für:

- die **Trennung** von Plattform-Administration und Plaintext-Hoheit,
- die **Trennung** des Speicher-/Chiffrat-Zugriffs von der Entschlüsselungs-Fähigkeit,
- die **Verhinderung** einseitiger Plaintext-Macht durch ein einzelnes administratives Subjekt,
- die **mandantenspezifische** Schlüssel-Segregation auf Boundary-Ebene,
- die **Schlüssel-Lebenszyklus-Phasen** als reine Boundary-Topoi,
- die **Behandlung** von Crypto-Shredding ausschließlich als downstream-bedingte Architektur-Option,
- die **Wahrung** der gesperrten Harouda-Boundaries bei jeder Custody-Aussage,
- die **Konsistenz** mit Security V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0 und Retention V1.0.

Die Custody-Modell-Boundary ist ein **internes Boundary-/Spec-Lock**. Sie liefert Boundary-Eingaben für nachgelagerte technische und operative Detail-Artefakte, **trifft jedoch selbst keine** Topologie-, Mechanik-, Anbieter- oder Implementierungs-Entscheidung.

V1.0 sperrt ausschließlich die Boundary-Ebene. V1.0 sperrt **nicht**:

- die rechtliche Würdigung von Crypto-Shredding unter DSGVO Art. 17 oder Art. 18,
- die abschließende straf- bzw. berufsrechtliche Bewertung nach StGB § 203 / StBerG § 62a für konkrete operative Vorgänge,
- konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, Schlüssellängen oder kryptographische Parameter,
- die konkrete Custody-Topologie, Schlüsselhierarchie-Wahl, Schlüssellebenszyklus-Mechanik,
- die Anbieter-/Produkt-/Plattform-/Hardware-/Cloud-/Modell-Wahl,
- die Endfassung der Verfahrensdokumentation Kap. 5,
- die Endfassung des Lösch-/Sperrprozesses,
- die operationelle Umsetzung des Crypto-Shredding-Verfahrens.

Eine externe rechtliche Prüfung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) sowie eine externe sicherheitsfachliche Prüfung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung **erforderlich**.

---

## 3. Authoritative Source Basis

Ausschließlich kurze, repository-sichere Paraphrasen; Originaltext wird nicht übernommen. V1.0 dieses Artefakts erzeugt **keine** eigenen rechtlichen Auslegungen über die in Security V1.0, Lösch-/Sperrkonzept V1.0, Retention V1.0 und Regelmatrix V1.0 bereits paraphrasierten Quellen hinaus.

| Quelle | Inhalt (Kurzform, paraphrasiert) | Rolle in V1.0 |
|---|---|---|
| DSGVO Art. 28 | Auftragsverarbeitung; Anforderungen an die Verarbeiter-Beziehung; Weisungsbindung; Sub-Verarbeiter-Konstellationen | Boundary-Verweis |
| DSGVO Art. 32 | Sicherheit der Verarbeitung; Vertraulichkeit, Integrität, Verfügbarkeit, Belastbarkeit; angemessene technische und organisatorische Maßnahmen | Boundary-Verweis |
| DSGVO Art. 33 / 34 | Meldepflichten bei Datenschutzverletzungen; abgrenzbar von Custody-Mechanik | Grenzverweis (Vorfallsprozess ist eigenes Folgeartefakt) |
| StGB § 203 | Verletzung von Privatgeheimnissen; Berufsgeheimnis-Schutz | Boundary-Verweis ohne abschließende Einzelfall-Bewertung |
| StBerG § 62a | Datenschutz im StB-Mandat; Verschwiegenheitspflicht-Schutz im Mandanten-Verhältnis | Boundary-Verweis ohne abschließende Einzelfall-Bewertung |
| BSI TR-02102-1, Version 2026-01 | Empfehlungen zu kryptographischen Verfahren und Schlüssellängen | Krypto-Orientierung; **kein** Konformitätsanspruch; konkrete Algorithmik im TR-02102-Detail-Artefakt |
| BSI TR-02102-2, Version 2026-01 | Empfehlungen zur Verwendung von TLS | Transport-Boundary-Orientierung; **kein** Konformitätsanspruch; konkrete Parameter im TR-02102-Detail-Artefakt |
| OWASP ASVS 5.0.0 | Application Security Verification Standard | ASVS-Zielprofil im Sinne der Security-V1.0-Boundary; **keine** Verifikations- oder Zertifizierungs-Behauptung |
| DSK Kurzpapier Nr. 11 | Aufsichtsbehördliche Auffassung zum Spannungsfeld zwischen Löschung/Sperrung und Aufbewahrungspflichten | dynamischer/offener Auffassungsstand für die Crypto-Shredding-Diskussion; **keine** finale Autoritäts-Aussage |
| Security-/Krypto-/Key-Custody-Artefakt V1.0 | Sicherheits-, Krypto- und Key-Custody-Boundaries; Plattform-Admin-Grenze; Crypto-Shredding-Boundary; Auftrag „Custody-Modell-Folgeartefakt" | **Direkte Lock-Basis** |
| Lösch-/Sperrkonzept-Artefakt V1.0 | Sperrgrund-Taxonomie; Crypto-Shredding-Boundary; Custody-Modell als Voraussetzung für jegliche operative Anwendung von Crypto-Shredding | **Direkte Lock-Basis** |
| Aufbewahrungs-/Retention-Archiv-Artefakt V1.0 | Schutz der aufbewahrungspflichtigen Inhalte über die gesetzliche Frist; Speicher-/Schlüsselverwaltungs-Defer an Custody-Modell | **Direkte Lock-Basis** |
| Dokumentenkategorie-/Retention-Regelmatrix V1.0 | Klassifikations-Audit-Nachweise; nur indirekt relevant für Custody-Modell | Indirekte Lock-Basis |
| Gesperrte Harouda-Registergrenzen | F0-D4 (Festschreibung), F0-D6 (Mandantentrennung), F0-D7 (Plattform-Admin-Grenze), F1-D1/F1-D2 (USt-Wahrheit), F3-D1 (Z3-Export), F3-D2 (DR/Restore), F3-D3 (Migration), F3-Closing | Autoritative Boundary-Quellen; bei Konflikt vorrangig |
| Open Question — Crypto-Shredding rechtliche Einordnung | Status 🔴 offen; externe Fachanwalts-Freigabe vor Produktivstart erforderlich | Release-Blocker für Produktivanwendung; **nicht** Boundary-Blocker |

---

## 4. Core Custody-Boundaries

Auf Boundary-Ebene gelten:

- **Custody-Modell ≠ Implementierung.** Dieses Artefakt benennt fachliche Trennungs-Boundaries und Lebenszyklus-Topoi; es entwirft **keine** Schlüsselverwaltungs-Mechanik.
- **Trennung Plattform-Administration vs. Plaintext-Hoheit.** Plattform-Administration ist gemäß F0-D7 rein technische Rolle; sie darf **keine einseitige** Plaintext-Macht über Mandantendaten besitzen.
- **Trennung Storage-/Chiffrat-Zugriff vs. Entschlüsselungs-Fähigkeit.** Wer Speicher- bzw. Chiffrat-Lesezugriff hat, darf **nicht** zugleich allein die Entschlüsselungs-Fähigkeit halten. Die konkrete Trennungs-Mechanik ist downstream zu spezifizieren.
- **Verbot einseitiger Plaintext-Macht.** Kein einzelnes administratives Subjekt darf einseitig auf Mandanten-Klartext zugreifen können. Insbesondere darf Plattform-Administration **keine** Schlüssel-/Plaintext-/Mandantendaten-Einsicht über Restore-, Migrations- oder Z3-Pfade erlangen (Konsistenz F3-D2 / F3-D3 / F3-D1).
- **Mandantenscharfe Schlüssel-Segregation auf Boundary-Ebene.** F0-D6 bleibt autoritativ; mandantenübergreifende Schlüsselvermischung ist auf Boundary-Ebene **ausgeschlossen**.
- **Berufsgeheimnis-Schutz.** Schlüsselmaterial darf nicht so verwaltet werden, dass ein nicht zur Berufsverschwiegenheit verpflichtetes Subjekt einseitig Plaintext-Zugriff auf Mandantendaten erlangen kann (Konsistenz Security V1.0 §6 zu StGB § 203 / StBerG § 62a). Die abschließende straf- bzw. berufsrechtliche Bewertung im Einzelfall verbleibt **außerhalb** dieses Artefakts.
- **Schlüssel-Lebenszyklus ausschließlich als Boundary-Topoi.** Erzeugung, Verteilung/Bereitstellung, Nutzung, Rotation, Sperrung/Revokation, Vernichtung, Wiederherstellung werden als fachliche Phasen anerkannt, jedoch **ohne Mechanik**, **ohne Frequenzen**, **ohne Trigger** und **ohne Algorithmik**.
- **Crypto-Shredding ausschließlich als downstream-bedingte Architektur-Option.** Keine rechtliche Würdigung in V1.0; keine Umgehung gesetzlicher Aufbewahrungspflichten.
- **Klassifikations-Audit-Schutz.** Klassifikations-Audit-Nachweise gemäß Regelmatrix V1.0 §13 sind durch die Custody-Boundary mit zu schützen, ohne dass V1.0 dieses Artefakts deren Schema oder Transport festlegt.
- **F0-D4-Wahrung.** Festschreibungs-Tatsachen werden durch Schlüsselverwaltungs-Operationen weder erzeugt, geändert noch entfernt.
- **F1-D1/F1-D2-Wahrung.** USt-Werte werden durch Schlüsselverwaltungs-Operationen weder erzeugt, geändert noch überschrieben.

V1.0 trifft keine Aussage über konkrete Custody-Mechanismen, Werkzeuge, Hersteller, Cloud-Regionen, Hardware-Familien oder Implementierungen.

---

## 5. Plattform-Admin / Plaintext Boundary

- **F0-D7 bleibt autoritativ.** Plattform-Administration ist rein technische Rolle, kein fachlicher Superuser.
- **Verbot einseitiger Plaintext-Macht.** Kein Plattform-Admin-Pfad darf einseitigen Klartext-Zugriff auf Mandantendaten ermöglichen — weder durch Schlüsselverwaltungs-Befehl, noch durch Speicher-/Chiffrat-Zugriff in Kombination mit Entschlüsselungs-Fähigkeit, noch durch Restore-, Migrations- oder Z3-Pfade.
- **Konsistenz mit F3-D1.** Plattform-Admin erzeugt keinen Z3-Export; ein Z3-Export-Pfad darf nicht zur Plaintext-Beschaffung genutzt werden.
- **Konsistenz mit F3-D2.** Restore-Vorgänge dürfen keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen; Plattform-Admin im Restore-Kontext bleibt rein technische Ausführung.
- **Konsistenz mit F3-D3.** Migrations-Pfade dürfen keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen; Plattform-Admin im Migrations-Kontext bleibt rein technische Ausführung.
- **Konkrete Trennungsmechanismen** (z. B. Vier-Augen-Verfahren, Geheimnis-Aufteilung, hardwaregestützte Schutzdomänen, Rollenmatrizen, Aufgabentrennung) sind **Non-Scope** und verbleiben downstream.

---

## 6. Storage-vs-Key-Access Boundary

- **Trennung auf Boundary-Ebene.** Speicher-/Chiffrat-Lesezugriff und Entschlüsselungs-Fähigkeit dürfen nicht in einem einzigen administrativen Subjekt zusammenfallen.
- **Wirkung.** Wer Chiffrat lesen kann, darf nicht zugleich allein über die Schlüssel verfügen, die zu seiner Entschlüsselung erforderlich sind. Eine konkrete Realisierung (Schlüsselhierarchie, Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur) ist **Non-Scope**.
- **Restore-/Migrations-/Z3-Schutz.** Diese Trennung gilt sinngemäß auch im Restore-Kontext (F3-D2), Migrations-Kontext (F3-D3) und Z3-/Datenüberlassungs-Kontext (F3-D1).
- **Audit-Wirkung.** Operationen, die diese Trennung berühren, müssen rekonstruktierbar bleiben; Boundary-Niveau gemäß §12 dieses Artefakts. Konkretes Schema, Transport, Aufbewahrungsort der Audit-Spuren ist **Non-Scope**.
- **Negativ-Boundary.** V1.0 dieses Artefakts entscheidet **nicht** zwischen logischer Trennung, prozessualer Trennung, hardwaregestützter Trennung oder kombinierten Modellen.

---

## 7. Mandantenspezifische Schlüssel-Segregation

- **F0-D6 bleibt autoritativ.** Mandantentrennung ist auch im Schlüsselkontext unverhandelbar.
- **Boundary-Aussage.** Schlüsselmaterial pro Mandant ist auf Boundary-Ebene zu segregieren; mandantenübergreifende Schlüsselvermischung ist ausgeschlossen.
- **Wirkung.** Eine Schlüssel-/Plaintext-Operation gegenüber einem Mandanten darf keine Schlüssel-/Plaintext-Wirkung gegenüber einem anderen Mandanten entfalten.
- **Konkrete Segregations-Mechanik** (z. B. Schlüsselraum-Topologien, Mandanten-Tenanting-Schichten, Multi-Tenancy-Schlüsselmodelle) ist **Non-Scope** und verbleibt downstream.
- **Kanzlei-/Mandanten-Beziehung.** Eine Kanzlei-Vollsicht (im Sinne F0-D6 der Foundation) bleibt eine fachliche Sichtbarkeitsfrage; sie hebt die Mandantentrennung im Custody-Kontext nicht auf.

---

## 8. Schlüssel-Lebenszyklus-Boundary

Schlüssel-Lebenszyklus-Phasen werden in V1.0 dieses Artefakts ausschließlich als **Boundary-Topoi** anerkannt — ohne Mechanik, ohne Frequenz, ohne Trigger, ohne Algorithmik:

| Phase | Boundary-Inhalt |
|---|---|
| **Erzeugung** | Schlüssel werden in einer Weise erzeugt, die mandantenscharfe Segregation und Trennung von Plattform-Admin-Pfaden wahrt. Konkretes Erzeugungs-Verfahren ist Non-Scope. |
| **Verteilung / Bereitstellung** | Schlüsselmaterial wird ausschließlich an autorisierte Verarbeitungs-Subjekte bereitgestellt; Plattform-Administration bleibt von Plaintext-Zugriff ausgeschlossen. Konkrete Bereitstellungs-Mechanik ist Non-Scope. |
| **Nutzung** | Schlüssel werden ausschließlich für die fachlich benannten Zwecke genutzt; eine Zweckentfremdung gegen Mandantentrennung, Berufsgeheimnis oder F0-D7 ist ausgeschlossen. Konkrete Nutzungs-Bindungen sind Non-Scope. |
| **Rotation** | Rotation ist als fachliche Phase anerkannt. V1.0 trifft **keine** Aussage über Rotations-Frequenz, Rotations-Trigger, Rotations-Mechanik oder Rotations-Verifikation. |
| **Sperrung / Revokation** | Sperrung bzw. Revokation ist als fachliche Phase anerkannt; sie unterscheidet sich auf Boundary-Ebene von Vernichtung. Konkrete Mechanik ist Non-Scope. |
| **Vernichtung** | Vernichtung ist als fachliche Phase anerkannt. V1.0 trifft **keine** Aussage über Vernichtungs-Mechanik, Grace-Periods, Wiederherstellungs-Fenster oder Nachweis-Schemata. |
| **Wiederherstellung** | Wiederherstellung ist nur als Boundary anerkannt; sie unterliegt strikten Trennungs- und Audit-Boundaries und darf F0-D7, F3-D2 und F3-D3 nicht schwächen. Konkrete Wiederherstellungs-Mechanik ist Non-Scope. |

V1.0 dieses Artefakts entwirft **keine** Lebenszyklus-Mechanik, **keine** Workflow-Spezifikation, **keine** Trigger-Logik, **keine** Audit-Schemata.

---

## 9. Crypto-Shredding Boundary

- Crypto-Shredding wird in V1.0 **ausschließlich als Architektur-Option / Boundary-Topik** behandelt; dieselbe Behandlung wie im Security-/Krypto-/Key-Custody-Artefakt V1.0 §13 und im Lösch-/Sperrkonzept-Artefakt V1.0 §9.
- V1.0 stellt **nicht** fest, dass Crypto-Shredding rechtlich eine Löschung im Sinne von DSGVO Art. 17 Abs. 1 erfüllt.
- V1.0 stellt **nicht** fest, dass Crypto-Shredding eine Maßnahme nach DSGVO Art. 18 Abs. 1 lit. b ist; die rechtliche Einordnung verbleibt **downstream** und erfordert eine externe Prüfung durch Fachanwalt für IT-Recht/Datenschutzrecht und Datenschutzbeauftragten.
- Crypto-Shredding **darf nicht** zur Umgehung gesetzlicher Aufbewahrungspflichten nach AO § 147 / HGB § 257 verwendet werden; die Aufbewahrungspflicht überlagert das Recht auf Löschung gemäß DSGVO Art. 17 Abs. 3 lit. b.
- **Downstream-Bedingung.** Eine produktive Anwendung von Crypto-Shredding setzt voraus: (a) die in `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` festgehaltene externe Rechtsfrage ist nachweislich freigegeben; (b) ein nachgelagertes KMS/HSM-/Implementations-Folgeartefakt ist gelockt; (c) ein operatives Lösch-/Sperrprozess-Detail ist gelockt.
- **V1.0 entscheidet nicht** über Schlüsselhierarchie, Schlüsselzerstörungs-Verfahren, Nachweisführung, Algorithmen, Modi, Anbieter-/Werkzeug-/Plattform-/Hardware-/Cloud-Wahl oder Schlüsselverwaltungs-Produktwahl.
- **Boundary-Wirkung.** Solange die rechtliche Einordnung extern offen ist, darf kein Custody-Pfad operativ Crypto-Shredding als Erfüllung von Art. 17 Abs. 1 ausweisen.

---

## 10. Verhältnis zu Security V1.0, Lösch-/Sperrkonzept V1.0, Regelmatrix V1.0, Retention V1.0

| Verhältnis | Boundary-Inhalt |
|---|---|
| **Custody-Modell → Security V1.0** | Custody-Modell konkretisiert die in Security V1.0 §9 / §13 / §17 angelegte Custody-Boundary auf Boundary-Ebene. Es führt **keine** Sicherheits- oder Krypto-Quelle ein, die nicht in Security V1.0 paraphrasiert ist. Bei Konflikt gilt Security V1.0. |
| **Custody-Modell → Lösch-/Sperrkonzept V1.0** | Custody-Modell ist Voraussetzung für jegliche operative Anwendung von Crypto-Shredding (Lösch-/Sperrkonzept V1.0 §11 / §14). Custody-Modell entscheidet **nicht** über Lösch-/Sperrlogik; diese verbleibt im Lösch-/Sperrkonzept V1.0. Bei Konflikt gilt Lösch-/Sperrkonzept V1.0 für Lösch-/Sperr-Boundaries. |
| **Custody-Modell → Regelmatrix V1.0** | Custody-Modell ist nur indirekt relevant, soweit Klassifikations-Audit-Nachweise verschlüsselungs-/integritätsrelevante Eigenschaften tragen (Regelmatrix V1.0 §16). Bei Konflikt gilt Regelmatrix V1.0 für Klassifikations-Schnittstellen. |
| **Custody-Modell → Retention V1.0** | Custody-Modell schützt aufbewahrungspflichtige Inhalte über die gesetzliche Frist. Custody-Modell ändert weder Fristen, Kategorien, Fristbeginn noch Hemmungsklausel. Bei Konflikt gilt Retention V1.0 für Aufbewahrungs-Boundaries. |
| **Custody-Modell ↔ Crypto-Shredding-Rechtsfrage** | Solange `docs/open-questions/crypto-shredding-rechtliche-einordnung.md` offen ist, bleibt Crypto-Shredding produktiv blockiert. Die Custody-Boundary auf V1.0-Niveau ist von dieser Rechtsfrage **nicht** abhängig; die Boundary darf gelockt werden, ohne die Rechtsfrage zu präjudizieren. |
| **Custody-Modell ↔ TR-02102-Detail-Artefakt** | Custody-Modell trifft **keine** Aussage zu Algorithmen, Modi, Cipher Suites, Schlüssellängen oder TLS-Parametern; diese verbleiben dem TR-02102-Detail-Artefakt. |
| **Custody-Modell ↔ ASVS-Control-Referenz-Artefakt** | Custody-Modell verweist nur auf ASVS-Zielprofil; konkrete Kontroll-Adressen `v5.0.0-X.Y.Z` verbleiben dem ASVS-Control-Referenz-Artefakt. |
| **Custody-Modell ↔ DR-/HA-/BCM-Folgeartefakt** | Custody-Modell respektiert F3-D2 und das in Security V1.0 §10 etablierte Restore-Verbot des Schlüssel-/Plaintext-Zugriffs. |
| **Custody-Modell ↔ Migrations-Folgeartefakt** | Custody-Modell respektiert F3-D3 und das in Security V1.0 §11 etablierte Migrations-Verbot des Schlüssel-/Plaintext-Zugriffs. |
| **Custody-Modell ↔ Z3-/Datenüberlassungs-Spezifikations-Artefakt** | Custody-Modell respektiert F3-D1; ein Z3-Export-Pfad darf nicht zur Plaintext-Beschaffung genutzt werden. |
| **Custody-Modell ↔ DSGVO-/Datenpannen-Folgeartefakt** | Custody-Modell trifft keine Aussage zu Meldepflichten gemäß DSGVO Art. 33/34; diese verbleiben dem Datenpannen-Folgeartefakt. |

---

## 11. Verhältnis zu gesperrten Harouda-Boundaries

Die Custody-Modell-Boundary wahrt strikt:

| Lock | Wahrung in der Custody-Boundary |
|---|---|
| **F0-D4 Festschreibung** | Schlüsselverwaltungs-Operationen erzeugen, ändern oder entfernen keine Festschreibungs-Tatsache. F0-D4 bleibt autoritativ. |
| **F0-D6 Mandantentrennung** | Schlüsselmaterial ist mandantenscharf segregiert; mandantenübergreifende Schlüssel-/Plaintext-Wirkung ist ausgeschlossen. F0-D6 bleibt autoritativ. |
| **F0-D7 Plattform-Admin-Grenze** | Plattform-Administration ist rein technische Rolle ohne fachlichen Superuser; kein einseitiger Plaintext-Pfad. F0-D7 bleibt autoritativ. |
| **F1-D1 / F1-D2 USt-Wahrheit** | Schlüsselverwaltungs-Operationen erzeugen, ändern oder überschreiben keine USt-Werte. F1-D1/F1-D2 bleiben autoritative USt-Wahrheitsquelle. |
| **F3-D1 Z3-/Datenüberlassung** | Z3-Export-Pfade dürfen nicht zur Plaintext-Beschaffung durch Plattform-Administration genutzt werden. F3-D1 bleibt autoritativ. |
| **F3-D2 DR/Restore** | Restore-Vorgänge dürfen keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen. F3-D2 bleibt autoritativ. |
| **F3-D3 Migration** | Migrations-Pfade dürfen keinen unbefugten Schlüssel-/Plaintext-/Mandantendaten-Zugriff ermöglichen. F3-D3 bleibt autoritativ. |
| **F3-Closing** | Custody respektiert die F3-Closing-Boundaries: Z3-Export ≠ DR-Backup ≠ Migrations-Export ≠ Aufbewahrungs-/Retention-Archiv ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell. F3-Closing bleibt autoritativ. |
| **§28.11-bet** | Bleibt unverändert/offen. V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet nicht. |

Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. V1.0 dieses Artefakts wirkt nicht auf den Locked Decisions Register zurück.

---

## 12. Audit-/Nachweis-Boundary

Auf Boundary-Ebene gilt:

- **Custody-bezogene Operationen müssen rekonstruktierbar bleiben.** Hierzu zählen insbesondere: Erzeugung, Bereitstellung, Rotation, Sperrung/Revokation, Vernichtung, Wiederherstellung sowie Plattform-Admin-Aktionen mit Berührung der Custody-Schicht.
- **Der Nachweis** je Operation muss auf fachlicher Ebene mindestens enthalten:
  - die betroffene Lebenszyklus-Phase gemäß §8;
  - das auslösende Subjekt bzw. die Rolle und die zugehörige Autorisierungs-Grundlage;
  - den Zeitpunkt;
  - das fachliche Ergebnis (z. B. Erzeugt / Rotiert / Gesperrt / Vernichtet / Wiederhergestellt / Abgelehnt mit Grund);
  - sofern relevant: den mandantenscharfen Bezug (F0-D6).
- **Custody-Audit ist getrennt** von Sicherheits-Audit, buchführungs-/GoBD-Audit und Klassifikations-Audit zu führen; eine Boundary-Verschmelzung ist ausgeschlossen.
- **Plaintext-Vermeidung im Audit.** Audit-Spuren dürfen Plaintext-Mandantendaten nicht über die Custody-Audit-Schicht exponieren.
- **Konkrete Log-Schemata, Datenmodelle, Aufbewahrungsorte oder Werkzeuge** für die Nachweisführung sind **Non-Scope** und werden downstream entschieden.

---

## 13. STOP-Bedingungen

| # | STOP if |
|---:|---|
| 13.1 | Eine Custody-Konstellation ermöglicht der Plattform-Administration einseitigen Plaintext-Zugriff auf Mandantendaten — direkt oder über Restore-, Migrations- oder Z3-Pfade. |
| 13.2 | Eine Custody-Konstellation lässt Speicher-/Chiffrat-Zugriff und Entschlüsselungs-Fähigkeit in einem einzigen administrativen Subjekt zusammenfallen. |
| 13.3 | Eine Custody-Konstellation hebt die mandantenscharfe Schlüssel-Segregation auf oder ermöglicht mandantenübergreifende Schlüssel-/Plaintext-Wirkung. |
| 13.4 | V1.0 dieses Artefakts behauptet, dass Crypto-Shredding rechtlich eine Löschung im Sinne von DSGVO Art. 17 Abs. 1 erfüllt, oder ordnet Crypto-Shredding rechtlich abschließend unter Art. 17 / Art. 18 ein. |
| 13.5 | Eine Custody-Konstellation oder ein darauf gestütztes Folgeartefakt verwendet Crypto-Shredding zur Umgehung gesetzlicher Aufbewahrungspflichten nach AO § 147 / HGB § 257. |
| 13.6 | V1.0 dieses Artefakts trifft eine konkrete KMS-/HSM-Modell-, Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Region-, Modell- oder Hardware-Entscheidung. |
| 13.7 | V1.0 dieses Artefakts trifft eine Topologie-Entscheidung (z. B. DEK/KEK-Hierarchie, Envelope-Encryption, Per-Artifact-Key, Per-Subject-Key, Split-Key, Threshold-Key, BYOK/HYOK/CMK/MyOwnKey). |
| 13.8 | V1.0 dieses Artefakts nennt konkrete Algorithmen, Modi, Cipher Suites, TLS-Versionen, Schlüssellängen oder kryptographische Parameter. |
| 13.9 | V1.0 dieses Artefakts entwirft konkrete Schlüsselrotations-, Schlüsselzerstörungs- oder Schlüsselwiederherstellungs-Mechanik (einschließlich Grace-Periods und Wiederherstellungs-Fenster). |
| 13.10 | V1.0 dieses Artefakts enthält Implementierung, Datenmodell, Schema, UI/UX, Programmcode, Pseudocode, Algorithmus-Design, SQL, API-Definition oder automatische Jobs. |
| 13.11 | V1.0 dieses Artefakts schwächt, umdeutet oder umgeht F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3 oder F3-Closing. |
| 13.12 | V1.0 dieses Artefakts ändert oder reinterpretiert §28.11-bet. |
| 13.13 | V1.0 dieses Artefakts modifiziert den Locked Decisions Register oder behauptet eine Register-Verankerung in §6, die nicht existiert. |
| 13.14 | V1.0 dieses Artefakts behauptet eine rechtliche, steuerfachliche, DSB-, Aufsichts-, Sicherheits-, Zertifizierungs- oder Produktivfreigabe, die nicht tatsächlich vorliegt. |
| 13.15 | V1.0 dieses Artefakts erhöht die Forbidden-Reference-Baseline (BLOCKED ≠ 0 oder BASELINE_ALLOWED ≠ 62) oder verletzt die etablierten Terminologie- und Quality-Gate-Vorgaben des Repositorys (verbotene Tool-/Modell-/Anbieter-Begriffe, BOM, Arabisch, obsolete Sortierungsbezeichnung, generische Sicherheits-/Transport-Behauptungen, freistehende Konformitäts-Schlagwörter, Zertifizierungs- oder Marketing-Aussagen). |

---

## 14. Explicit Non-Scope

Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben:

- Implementierung jeglicher Art,
- Datenbank- oder Dateisystem-Schema,
- Benutzeroberfläche und UX-Verhalten,
- Programmcode, Pseudocode und Algorithmus-Design,
- SQL und Query-Spezifikation,
- API-Definitionen,
- automatische Schlüsselverwaltungs-, Lösch- oder Sperrjobs (Scheduler, Trigger, Pipelines),
- Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen,
- konkrete kryptographische Primitive,
- DEK/KEK-Hierarchie,
- Envelope-Encryption,
- Per-Artifact-Key-Modell,
- Per-Subject-Key-Modell,
- Split-Key / Threshold-Key,
- KMS-/HSM-Modell,
- BYOK-/HYOK-/CMK-/MyOwnKey-Schemata,
- Schlüsselrotations-Mechanik,
- Schlüsselzerstörungs-Mechanik,
- Schlüsselwiederherstellungs-Mechanik,
- Grace-Periods,
- Audit-Log-Schema,
- Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Region-, Modell- oder Hardware-Wahl,
- Incident-Response-Runbook,
- DR-/HA-/BCM-Design,
- Z3-/Datenüberlassungs-Format,
- Migrations-Implementierung,
- Endfassung der Verfahrensdokumentation Kap. 5,
- Rechtsgutachten oder Steuerauskunft im Einzelfall,
- DSB-, Sicherheits- oder Produktivfreigabe,
- Zertifizierungs- oder Marketing-Aussagen.

**Klarstellung K-1:** Dieses Artefakt ist ein internes Boundary-/Spec-Lock. Es ersetzt keine Rechtsauskunft, keine Steuerauskunft, keine sicherheitsfachliche Prüfung, keine produktbezogene Konformitätsprüfung.

**Negativ-Erklärung zum Lock-Umfang:**
Mit V1.0 dieses Artefakts werden **nicht** festgelegt, **nicht** autorisiert und **nicht** freigegeben: kein Datenbank- oder Dateisystem-Schema; keine Benutzeroberfläche und kein UX-Verhalten; kein Programmcode, kein Pseudocode, kein Algorithmus-Design; kein SQL und keine Query-Spezifikation; keine Speichertechnologie; kein Verschlüsselungsverfahren in konkreter Form; keine Schlüsselverwaltung in konkreter Form; keine Anbieter-, Werkzeug-, Plattform-, Produkt-, Cloud-, Modell- oder Hardware-Wahl; kein DR-/HA-/BCM-Design; kein Migrations- oder Migrations-Rollback-Konzept; kein Z3-/Datenüberlassungs-Format; kein Incident-Response-Runbook; keine Implementierungs-Autorisierung jeglicher Art; keine Rechts- oder Steuerauskunft; keine Sicherheits- oder Produktivfreigabe.

---

## 15. Downstream Artefakte / Open Detail Decisions

Folgende Folgeartefakte bzw. offenen Detail-Entscheidungen werden vorgesehen, jedoch durch V1.0 dieses Artefakts **nicht** autorisiert oder spezifiziert:

- **KMS-/HSM-/Implementations-Folgeartefakt** — konkrete Schlüsselverwaltungs-Topologie, Schutzdomänen-Architektur, Trennungsmechanismen, Rotations-/Vernichtungs-Mechanik, Wiederherstellungs-Mechanik. Setzt Lock dieses Custody-Modell-Boundary-Artefakts und externe sicherheitsfachliche Prüfung voraus.
- **TR-02102-Detail-Artefakt** — konkrete Algorithmen, Modi, Cipher Suites, Schlüssellängen sowie TLS-Parameter unter Bezug auf BSI TR-02102-1 und TR-02102-2 in der jeweils gelockten Version (Version 2026-01 gemäß Security V1.0).
- **ASVS-Control-Referenz-Artefakt** — vollständige Kontroll-Mapping-Tabelle im Format `v5.0.0-X.Y.Z` ohne Verifikations-Anspruch.
- **Crypto-Shredding rechtliche Einordnung** — externe Fachanwalts-/DSB-Prüfung der Einordnung unter DSGVO Art. 17 / Art. 18; Release-Blocker für Produktivanwendung; vorhanden als Open-Question-Datei `docs/open-questions/crypto-shredding-rechtliche-einordnung.md`.
- **Lösch-/Sperrprozess Operational-Detail-Folgeartefakt** — operative Mechanik der Löschung bzw. Sperrung, einschließlich Crypto-Shredding-Operationalisierung sofern downstream rechtlich freigegeben.
- **DR-/HA-/BCM-Folgeartefakt** — RPO/RTO, Restore-Modi, Near-Zero-Ziele; bleibt strikt von Custody getrennt; respektiert F3-D2.
- **Migrations-Folgeartefakt** — Migrations-Mechanik; respektiert F3-D3 und das Verbot des Schlüssel-/Plaintext-Zugriffs.
- **Z3-/Datenüberlassungs-Spezifikations-Artefakt** — Behörden-Auslieferungs-Format; respektiert F3-D1 und das Verbot der Plaintext-Beschaffung.
- **DSGVO-/Datenpannen-Folgeartefakt** — Operationalisierung DSGVO Art. 33/34; nicht Bestandteil dieses Artefakts.
- **Cybersecurity-Incident-Response-Folgeartefakt** — Ransomware-/Forensik-Workflow.
- **Verfahrensdokumentation Kap. 5 (nächste Pflege)** — Aufnahme dieses Artefakts und der vorgelagerten V1.0-Lock-Artefakte (Security, Lösch-/Sperrkonzept, Retention, Regelmatrix) per Verweis als vorgelagerte Spezifikationen.

---

## 16. V1.0 Lock-Profil

| Attribut | Festlegung |
|---|---|
| **Geltung** | Internes Boundary-/Spec-Lock für die fachlichen Custody-Boundaries in Harouda. Maßgeblich als Eingangsgröße für KMS-/HSM-/Implementations-Folgeartefakt, Lösch-/Sperrprozess Operational-Detail-Folgeartefakt und für jede operative Anwendung von Crypto-Shredding. Maßgeblich für die Bezugnahme aus Verfahrensdokumentation Kap. 5 (im Rahmen ihrer nächsten Pflege). |
| **Bindend für** | Alle in §15 genannten Folgeartefakte, soweit sie auf Custody-Boundary-Eingaben aufsetzen; Verfahrensdokumentation Kap. 5 (nächste Pflege); alle nachgelagerten Detail-Artefakte zu Schlüsselverwaltungs-, Krypto- und Custody-Themen. |
| **Nicht bindend für** | Konkrete Custody-Topologie. Konkrete Schlüsselhierarchie. Konkrete Algorithmen, Modi, Cipher Suites, TLS-Parameter, Schlüssellängen. Anbieter-/Werkzeug-/Plattform-/Produkt-/Cloud-/Region-/Modell-/Hardware-Wahl. Konkrete Schlüsselrotations-, Schlüsselzerstörungs-, Schlüsselwiederherstellungs-Mechanik. Konkrete Audit-Schemata. DR-/HA-/BCM-Design. Migrations-Implementierung. Z3-/Datenüberlassungs-Format. Datenschutz-Vorfallsprozess. Endfassung Verfahrensdokumentation Kap. 5. Rechts- oder Steuerauskunft im Einzelfall. Sicherheits- oder Produktivfreigabe. |
| **STOP-Bedingungen** | **15** nummerierte STOP-Bedingungen (13.1 bis 13.15) gemäß §13. |
| **Boundaries** | Custody-Modell ≠ Implementierung. Custody-Modell ≠ Algorithmik (TR-02102-Detail). Custody-Modell ≠ Lösch-/Sperrlogik (Lösch-/Sperrkonzept V1.0). Custody-Modell ≠ Klassifikation (Regelmatrix V1.0). Custody-Modell ≠ Aufbewahrung (Retention V1.0). Aufbewahrungs-/Retention-Archiv ≠ DR-Backup ≠ Z3-/Datenüberlassung ≠ Migration ≠ Lösch-/Sperrkonzept ≠ Regelmatrix ≠ Custody-Modell (Konsistenz mit F3-Closing und Retention V1.0). F0-D4 Festschreibung bleibt unberührt. F0-D6 Mandantentrennung bleibt autoritativ. F0-D7 Plattform-Admin-Grenze bleibt rein technische Rolle ohne fachlichen Superuser. F1-D1/F1-D2 USt-Wahrheit bleibt unberührt. F3-D1, F3-D2, F3-D3, F3-Closing bleiben autoritativ. §28.11-bet bleibt unverändert/offen. Crypto-Shredding bleibt downstream-bedingt; keine eigene rechtliche Würdigung in V1.0. |
| **Quellgrundlage** | DSGVO Art. 28, 32, 33, 34; StGB § 203; StBerG § 62a; BSI TR-02102-1, Version 2026-01; BSI TR-02102-2, Version 2026-01; OWASP ASVS 5.0.0; DSK Kurzpapier Nr. 11 (offener Auffassungsstand); Security-/Krypto-/Key-Custody-Artefakt V1.0; Lösch-/Sperrkonzept-Artefakt V1.0; Aufbewahrungs-/Retention-Archiv-Artefakt V1.0; Dokumentenkategorie-/Retention-Regelmatrix V1.0; Open Question Crypto-Shredding rechtliche Einordnung; gesperrte Harouda-Registergrenzen F0-D4, F0-D6, F0-D7, F1-D1, F1-D2, F3-D1, F3-D2, F3-D3, F3-Closing. |
| **Vorrang-Regel** | Bei Konflikt mit gesperrten Harouda-Locks gelten die gesperrten Locks. Bei Konflikt mit der amtlichen Quelle gilt die amtliche Quelle. Bei Konflikt mit Security V1.0 gilt Security V1.0 für Krypto-/Sicherheits-Boundaries. Bei Konflikt mit Lösch-/Sperrkonzept V1.0 gilt Lösch-/Sperrkonzept V1.0 für Lösch-/Sperr-Boundaries. Bei Konflikt mit Retention V1.0 gilt Retention V1.0 für Aufbewahrungs-Boundaries. Bei Konflikt mit Regelmatrix V1.0 gilt Regelmatrix V1.0 für Klassifikations-Schnittstellen. |
| **Verankerungs-Hinweis** | Die Custody-Modell-Boundary ist im Locked Decisions Register V1.0 §6 (Open Folgeartefakte) **nicht** als eigenständiger Sortierungsmarker-Eintrag enumeriert. Sie figuriert dort innerhalb des Sortierungsmarker-A-Komplexes Security/Krypto/Key-Custody. Bindungsgrundlage leitet sich ausschließlich ab aus Security V1.0 §17 / Lock-Profil, Lösch-/Sperrkonzept V1.0 §11 / §14, Retention V1.0 §11 und Regelmatrix V1.0 §16. V1.0 dieses Artefakts modifiziert den Register **nicht**. |
| **Lock-Aussage** | Custody-Modell-Boundary-Artefakt V1.0 — accepted als internes Boundary-/Spec-Lock. Status: gesperrt auf Boundary-Ebene. Keine weitere Review-Runde auf Boundary-Ebene. Externe rechtliche und sicherheitsfachliche Validierung bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich. |

---

## 17. Versionshinweis

| Version | Charakter | Status |
|---|---|---|
| Draft V0.1 | Erstentwurf zur fachlichen Prüfung; Konsolidierung der Custody-Anker aus Security V1.0 §9 / §13 / §17 und Lösch-/Sperrkonzept V1.0 §9 / §11 / §14 | in V1.0 enthalten |
| Review-Iteration | Schärfung der Plattform-Admin-/Plaintext-Trennung; Schärfung der Storage-vs-Key-Access-Boundary; Schärfung des Schlüssel-Lebenszyklus als reine Boundary-Topoi; Klarstellung des Verankerungs-Hinweises gegenüber dem Locked Decisions Register; explizite Trennung gegenüber TR-02102-Detail- und ASVS-Control-Referenz-Folgeartefakten | in V1.0 enthalten |
| V1.0 | Konsolidierte Lockfassung auf Boundary-Ebene | **locked** |

Eine weitere Review-Runde auf Boundary-Ebene ist für V1.0 nicht vorgesehen. Erforderliche spätere Änderungen erfolgen ausschließlich über einen ausdrücklich neu zu eröffnenden Versionsschritt unter Bezug auf das amtliche Quellpaket, die gesperrten Harouda-Registergrenzen, das Security-/Krypto-/Key-Custody-Artefakt, das Lösch-/Sperrkonzept-Artefakt, das Aufbewahrungs-/Retention-Archiv-Artefakt sowie die Dokumentenkategorie-/Retention-Regelmatrix. Eine externe rechtliche Validierung (Fachanwalt für IT-Recht/Datenschutzrecht, Datenschutzbeauftragter) und eine externe sicherheitsfachliche Validierung (Krypto-/Sicherheits-Spezialist) bleibt vor produktiver bzw. rechtsverbindlicher Anwendung erforderlich.
