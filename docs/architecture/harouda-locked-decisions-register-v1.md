# Harouda Locked Decisions Register — F0 bis F3-Artefaktgruppe

> **Vorgeschlagener Repository-Pfad:** `docs/architecture/harouda-locked-decisions-register-v1.md`
>
> **Dateityp:** Projekt-Dokumentationsdatei / Locked Decisions Register
>
> **Kein:** Handoff, Fachartefakt, Implementierungsplan, Architektur-Spezifikation, Roadmap.

---

## 1. Dokumentstatus

### 1.1 Zweck

Dieses Dokument hält den konsolidierten, gelockten Entscheidungsstand der Harouda-Fachartefakte über die Phasen 1 bis einschließlich der F3-Artefaktgruppe innerhalb Phase 4 fest. Es dient ausschließlich als Nachweis- und Referenzdokument im Repository.

### 1.2 Charakter

Dokumentationsdatei / Locked Decisions Register. Kein Handoff, kein neues Fachartefakt, keine Implementierungs-Spezifikation, keine Quellen-Spezifikation der zugrunde liegenden Locks.

### 1.3 Wirkung

- Macht den gelockten Stand im Repository nachvollziehbar.
- Verweist auf die jeweiligen authoritativen V1.0-Artefakte als Quelle.
- Stellt Boundary-Beziehungen zwischen den Artefakten sichtbar dar.

### 1.4 Nicht-Wirkung

- Kein Lock wird durch dieses Dokument erzeugt, geändert oder aufgehoben.
- Kein Artefakt wird durch dieses Dokument re-geöffnet.
- Keine neue Fachentscheidung wird getroffen.
- Keine Implementierungsfreigabe wird erteilt.
- Keine Markteinführungs-, Pilot- oder Produktions-Freigabe wird erteilt.
- Keine STOP-Gesamtsumme wird neu berechnet.

### 1.5 Vorrang-Regel

Bei jeder Abweichung zwischen diesem Register und den jeweiligen V1.0-Artefakten gelten ausschließlich die V1.0-Lock-Aussagen der Quell-Artefakte. V1.0-Lock-Aussagen haben Vorrang vor Draft-, Patch-, Micro-Patch- und Handoff-Formulierungen sowie vor diesem Register.

### 1.6 Quellenbasis

| Quelle | Charakter |
|---|---|
| F0 Foundation Matrix D1–D7 + F0-Closing V1.0 | Authoritative Foundation |
| F1 USt-Trilogie D1/D2/D3 + F1-Closing V1.0 | Authoritative USt-Wahrheit + Konsolidierung |
| F2-D1 OPOS-Vollmodul V1.0 | Authoritative OPOS-Fachmodell |
| F2-D2 Periodenabgrenzung V1.0 | Authoritative Periodenabgrenzungs-Fachmodell |
| F2-D3 Jahreserklärung §18 Abs. 3 UStG V1.0 | Lesender USt-Jahreserklärungs-Konsument |
| F2-Closing V1.0 | Phase-3-Konsolidierung |
| F3-D1 Z3-/GDPdU-/GoBD-Export-Vollmodul V1.0 | Authoritatives Export-Fachmodell |
| F3-D2 Disaster-Recovery V1.0 | Authoritatives DR-Anforderungsmodell |
| F3-D3 Migrations-Spezifikation V1.0 | Authoritatives Migrations-Anforderungsmodell |
| F3-Closing — Summary der F3-Artefaktgruppe innerhalb Phase 4 V1.0 | Konsolidierungs- und Boundary-Referenz |
| HAROUDA_APPROVED_DECISIONS_GESAMT_HANDOFF | Konsolidierter Handoff-Bericht |

### 1.7 Scope

- Dokumentation des gelockten Stands der oben genannten Artefakte.
- Sichtbarmachung der zwischen den Artefakten bereits gelockten Boundaries.
- Verweis auf STOP-Stände, soweit explizit bekannt.
- Verweis auf offene Folgeartefakte, soweit nicht-bindend bekannt.

### 1.8 Non-Scope

- Kein Schema, keine UI, kein Code, kein SQL.
- Keine Tool-, Vendor-, Provider-, Framework- oder Library-Wahl.
- Keine ERiC-, Storage-, Encryption- oder Datenbank-Implementierung.
- Keine Implementierungskommandos.
- Keine neue Fachentscheidung.
- Keine Erfindung fehlender STOP-Zahlen.
- Keine neue phasenübergreifende STOP-Gesamtsumme.
- Keine rechtliche Neuauslegung von GoBD, AO, HGB oder DSGVO.

---

## 2. Gesamtstatus der gelockten Artefakte

| Phase / Gruppe | Artefakt | Status | Rolle im Gesamtmodell | Authoritativ / konsolidierend / lesend / Folgeartefakt-offen |
|---|---|---|---|---|
| Phase 1 / F0 | Foundation Matrix D1–D7 + F0-Closing | V1.0 — locked | Foundation | Authoritativ |
| Phase 2 / F1-D1 | USt-Engine-Kern (Schichten 1–4) | V1.0 — locked | USt-Wahrheit Teil 1 | Authoritativ |
| Phase 2 / F1-D2 | USt-Berichtigungs-Engine (Schicht 5) | V1.0 — locked | USt-Wahrheit Teil 2 | Authoritativ |
| Phase 2 / F1-D3 | UStVA-Mapping & ELSTER-Übermittlungs-Boundary (Schicht 6) | V1.0 — locked | UStVA-Konsumschicht | Lesend |
| Phase 2 / F1-Closing | USt-Trilogie Summary | V1.0 — locked | Phase-2-Konsolidierung | Konsolidierend |
| Phase 3 / F2-D1 | OPOS-Vollmodul | V1.0 — locked | OPOS-Fachmodell | Authoritativ (operative Bridge, keine USt-Wertquelle) |
| Phase 3 / F2-D2 | Periodenabgrenzung | V1.0 — locked | HGB-Periodenabgrenzung | Authoritativ (operative Bridge, keine USt-Wertquelle) |
| Phase 3 / F2-D3 | Jahreserklärung §18 Abs. 3 UStG (Schicht 7) | V1.0 — locked | USt-Jahreserklärungs-Konsumschicht | Lesend |
| Phase 3 / F2-Closing | Phase-3 Summary | V1.0 — locked | Phase-3-Konsolidierung | Konsolidierend |
| Phase 4 / F3-D1 | Z3-/GDPdU-/GoBD-Export-Vollmodul | V1.0 — locked | Behördliches Export-Fachmodell | Authoritativ |
| Phase 4 / F3-D2 | Disaster-Recovery | V1.0 — locked | DR-Anforderungsmodell | Authoritativ |
| Phase 4 / F3-D3 | Migrations-Spezifikation | V1.0 — locked | Migrations-Anforderungsmodell | Authoritativ (keine USt-Wertquelle, keine native Re-Festschreibung) |
| Phase 4 / F3-Closing | Summary der F3-Artefaktgruppe innerhalb Phase 4 | V1.0 — locked | F3-Konsolidierung und Boundary-Referenz | Konsolidierend |
| Phase 4 / Anschlussartefakte | siehe Abschnitt 6 | offen | nicht entschieden | Folgeartefakt-offen / nicht-bindend |

**Hinweis:** F3-Closing schließt ausschließlich die F3-Artefaktgruppe innerhalb Phase 4 ab. Phase 4 als Ganzes ist nicht abgeschlossen. Weitere Phase-4-Anschlussartefakte sind nicht-bindend in Abschnitt 6 dokumentiert.

---

## 3. Lock-Übersicht nach Artefakt

### 3.1 F0 Foundation Matrix / F0-Closing

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | siehe F0-D1 bis F0-D7 V1.0 + F0-Closing V1.0 |
| Kernaussagen | Foundation für Buchhaltungskern; F0-D4 ist authoritative Quelle für Festschreibung; F0-D6 ist authoritative Quelle für Mandantentrennung; F0-D7 ist authoritative Quelle für Rollen-/Berechtigungsmodell und Plattform-Admin-Grenze. |
| Boundaries | Keine USt-Wahrheit, keine UStVA-Mapping-Aussage, keine Migrations-Aussage, keine DR-Aussage, keine Z3-Aussage. |
| Bindend für | Sämtliche nachfolgenden Artefakte F1, F2, F3. |
| Nicht bindend für | Folgeartefakte, die noch nicht gelockt sind. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 60 konsolidierte F0-STOP-Bedingungen referenziert (F0-Closing) |

### 3.2 F1-D1 USt-Engine-Kern

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | siehe F1-D1 V1.0 |
| Kernaussagen | USt-Engine-Kern für Schichten 1–4: USt-Validierung, Berechnung, Periodisierung, Aggregation. Gemeinsam mit F1-D2 authoritative USt-Wahrheitsquelle. |
| Boundaries | Keine konkrete UStVA-Feldzuordnung, keine ELSTER-Mechanik, keine §13b-/EU-/Drittlandsmechanik, keine UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | F1-D2, F1-D3, F2-D3, F3-D3 als USt-Wahrheits-Referenz. |
| Nicht bindend für | Bilanz-, Bewertungs- und Abschluss-Themen. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 24 STOP-Bedingungen referenziert |

### 3.3 F1-D2 USt-Berichtigungs-Engine

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | siehe F1-D2 V1.0 |
| Kernaussagen | USt-Berichtigungs-Engine für Schicht 5: §17-, §14c-, Storno-, Berichtigungslogik. F1-D2 bleibt USt-Wahrheitsquelle. §14c-Berichtigungsperiode ist die Periode, in der die berichtigte Rechnung dem Empfänger zugeht. |
| Boundaries | Keine UStVA-Kennzahlen, keine ELSTER-Mechanik, keine konkrete UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | F1-D3, F2-D3, F2-D1 (Forderungsausfall- und Skonto-Bridge), F3-D3 als USt-Wahrheits-Referenz. |
| Nicht bindend für | Bilanz-, Bewertungs- und Abschluss-Themen. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 24 STOP-Bedingungen referenziert |

### 3.4 F1-D3 UStVA-Mapping & ELSTER-Übermittlungs-Boundary

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | siehe F1-D3 V1.0 (inklusive Micro-Patch 9) |
| Kernaussagen | Lesende UStVA-Konsumtionsschicht (Schicht 6). Konsumiert F1-D1/F1-D2-Aggregationen lesend. Verändert keine USt-Werte. Dauerfristverlängerung mit Status „Beantragt / wirksam bis Ablehnung oder Widerruf". Korrigierte UStVA = Steueranmeldungs-Korrektur, keine Festschreibungs-Aufhebung. Abstrakte ELSTER-Erfolgsdefinition. |
| Boundaries | Keine konkrete ERiC-/ELSTER-Bibliothekswahl, keine konkreten Formularfelder, keine UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | UStVA-Übermittlungs-Logik in Folgeartefakten. |
| Nicht bindend für | Jahreserklärungs-Mapping (das übernimmt F2-D3). |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 21 STOP-Bedingungen nach Micro-Patch 9 referenziert |

### 3.5 F1-Closing

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | F1-D1 V1.0 + F1-D2 V1.0 + F1-D3 V1.0 |
| Kernaussagen | Phase 2 / USt-Trilogie ist abgeschlossen. USt-Hierarchie: F1-D1/F1-D2 = USt-Wahrheit; F1-D3 = lesender Konsument. |
| Boundaries | Kein F1-D4. Keine Re-Öffnung. Keine Implementierung. |
| Bindend für | Alle USt-bezogenen Folgeartefakte. |
| Nicht bindend für | Steuer-Scope-Erweiterungen (offen). |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 64 konsolidierte Phase-2-STOP-Bedingungen referenziert |

### 3.6 F2-D1 OPOS-Vollmodul

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.2 + Micro-Patch 8 |
| Kernaussagen | OPOS-Fachmodell mit 12 OP-Lifecycle-Status. OP-Status und Klärfall-State bleiben getrennt. BGB §366 für Zahlungszuordnung; §367 nur als Boundary. Forderungsausfall und Skonto sind Bridge zu F1-D2, nicht eigene USt-Wahrheit. |
| Boundaries | Kein Schema, keine UI, keine Implementierung, kein vollständiges Mahnwesen als Kernmodul, keine eigenständige USt-Wertquelle. |
| Bindend für | OPOS-bezogene Folgeartefakte (z. B. Mahnwesen, Banking). |
| Nicht bindend für | USt-Wahrheit (F1-D1/F1-D2 bleibt authoritativ). |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 31 STOP-Bedingungen referenziert |

### 3.7 F2-D2 Periodenabgrenzung

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.1 + Patch V0.2 + Micro-Patch 8 |
| Kernaussagen | HGB-Periodenabgrenzung erzeugt keine direkte USt-Wirkung. ARA/PRA gemäß HGB §250. Einfache kurzfristige sonstige Rückstellungen nur unter MVP-Bedingungen. Anzahlungs-Periodisierung nur als Brücke ohne Bilanzposten-Klassifikation. WZD (Wirtschaftliches Zuordnungsdatum) als Periodentreiber; keine rückwirkende Änderung nach Festschreibung. |
| Boundaries | Kein Bilanzmodul, kein Bewertungsmodul, kein Abschlussmodul, kein USt-Mapping-Layer, keine UI-/Schema-/Implementierungs-Aussage. F2-D3 konsumiert F1-D1/F1-D2/F1-D3, nicht F2-D2 als USt-Wertquelle. |
| Bindend für | Periodenabgrenzungs-bezogene Folgeartefakte. |
| Nicht bindend für | USt-Wahrheit. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 23 STOP-Bedingungen referenziert |

### 3.8 F2-D3 Jahreserklärung §18 Abs. 3 UStG

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.1 + Patch V0.2 + Micro-Patch 9 |
| Kernaussagen | Lesende USt-Jahreserklärungs-Konsumtionsschicht (Schicht 7). Mapping auf den maßgeblichen USt-Besteuerungszeitraum: Kalenderjahr im Regelfall; kürzerer Besteuerungszeitraum nur bei gesetzlicher Einschlägigkeit. Abweichendes HGB-Wirtschaftsjahr ist nie USt-Mapping-Zeitraum. Schlusszahlung / Erstattung gemäß §18 Abs. 4 gegen Vorauszahlungssoll, nicht gegen tatsächlichen Zahlungsstand. AO §168-Zustimmungsdifferenzierung bei Herabsetzung / Erstattung. |
| Boundaries | Keine konkreten Jahreserklärungs-Formularfelder, keine ELSTER-Jahreserklärungs-Implementierung, keine HGB-Wirtschaftsjahr-Verwechslung. |
| Bindend für | Jahreserklärungs-bezogene Folgeartefakte. |
| Nicht bindend für | UStVA-Mechanik (F1-D3) und USt-Wahrheit (F1-D1/F1-D2). |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 26 STOP-Bedingungen referenziert |

### 3.9 F2-Closing

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | F2-D1 V1.0 + F2-D2 V1.0 + F2-D3 V1.0 + Micro-Patch 1 |
| Kernaussagen | Phase 3 ist abgeschlossen. Bei Abweichungen haben F2-D1 / F2-D2 / F2-D3 Vorrang. F2-Closing nimmt keine eigene STOP-Deduplikation vor. |
| Boundaries | Kein F2-D4. Keine Re-Öffnung. Keine UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | Phase-3-Anschlussarbeiten als Konsolidierungs-Referenz. |
| Nicht bindend für | Phase-4-Themen. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 80 F2-STOPs referenziert vor Überlappungsbereinigung |

### 3.10 F3-D1 Z3-/GDPdU-/GoBD-Export-Vollmodul

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.1 + Patch V0.2 |
| Kernaussagen | Fachliches Export-Modell für Z3-/GDPdU-/GoBD-Export. Z3-Datenüberlassung nach GoBD 2024 über Datenträger oder Datenaustauschplattform. Scope: 15 Daten-Kategorien plus phasenübergreifende fachliche Verknüpfungen. Beschreibungsstandard ist technische Bereitstellungshilfe, nicht Scope-Quelle. Prüfungszeitraum als Primärgranularität; WJ/Kalenderjahr nur abgeleitet. Anlass-Trennung: behördliche Z3-Datenüberlassung ≠ Mandanten-Export ≠ Migrations-Export. DLS Lohnsteuer-Außenprüfung außerhalb MVP. |
| Boundaries | Keine konkrete XML-/CSV-Struktur, keine Verschlüsselungs-/Transport-Aussage, keine Z1-/Z2-Mechanik, keine UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | Z3-Spezifikations-Folgeartefakt. |
| Nicht bindend für | DR-Backup, Aufbewahrungs-/Retention-Archiv, Migration. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 23 STOP-Bedingungen |

### 3.11 F3-D2 Disaster-Recovery

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.1 + Patch V0.2 + Micro-Patch 13 |
| Kernaussagen | Fachliches DR-Anforderungsmodell. DR-Backup ≠ Aufbewahrungs-/Retention-Archiv ≠ Z3-Export. RPO/RTO sind Harouda-SLA-/Risk-Targets, nicht gesetzlich. Default: RPO 24 h / RTO 48 h als Produktpolitik. Near-zero-RPO/RTO gehört zu HA-/BCM-Folgeartefakt. Restore-Modi: Full-System, mandantenspezifisch, Point-in-Time, Test, Forensic. Berechtigungen werden als Audit-Spur historisch wiederhergestellt; produktiver Zugriff wird gegen aktuellen Identity-/Security-State revalidiert. Plattform-Admin: nur technische Ausführung, kein Schlüssel-/Plaintext-/Mandantendaten-Zugriff. Ransomware-Restore nur nach Integritätsprüfung und forensischer Freigabe. |
| Boundaries | Kein Archivmodell, kein Z3-Modell, keine HA-/BCM-Spezifikation, kein Cybersecurity-Incident-Response-Modell, keine UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | DR-Folgeartefakte und Architektur-/HA-/BCM-Folgeartefakt als Boundary-Quelle. |
| Nicht bindend für | Aufbewahrung, Z3-Export, Migration. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 29 STOP-Bedingungen |

### 3.12 F3-D3 Migrations-Spezifikation

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.1 + Patch V0.2 + Micro-Patch 1 |
| Kernaussagen | Fachliches Migrations-Anforderungsmodell. Umfang: Mandanten-Migration, Kanzlei-Vollmigration, Cloud-Provider-Exit, Plattform-Wechsel, Inbound aus Fremdsoftware, Outbound an Zielsoftware, Test-Migration, Parallel-Betrieb, Roll-back / Migrations-Abbruch. Zentrale GoBD-Basis: Rz. 142–144. Migration darf nur Formatumsetzung ohne Inhaltsänderung leisten. Importierte Fremdsystem-Festschreibungen bleiben historische Fremdsystem-Tatsachen; keine native F0-D4-Re-Festschreibung. Importierte Fremdsystem-USt-Werte bleiben historische Fremdsystemwerte; keine nativen F1-D1/F1-D2-Werte. Cutover ist Grenze, kein Beförderungsweg. Mehrmandanten-Lauf nur mit getrennten Paketen, Manifesten, Audit-Spuren, Freigaben, Roll-back-Pfaden. Test-Migration mit Produktivdaten nur unter DSGVO-Rechtsgrundlage, Zweckbindung, F0-D7-Freigabe, F0-D6-Mandantentrennung, Art. 32 DSGVO, Bereinigungspflicht, Audit-Spur. Quellpaket nur aus statusgesicherter, herkunftsgesicherter, integritätsgesicherter Quelle. Roll-back ≠ DR-Restore; fünf Pflichtvoraussetzungen analog F3-D2 Destructive-Overwrite-Schutz. Plattform-Admin: technische Migrations-Ausführung; keine fachliche Entscheidung; kein Inhalts-/Secrets-Zugriff. |
| Boundaries | Kein Z3-Ersatz, kein DR-Backup-/Restore-Modell, kein Aufbewahrungs-/Retention-Archiv, keine USt-Wertequelle, keine UI-/Schema-/Implementierungs-Aussage. |
| Bindend für | Migrations-Folgeartefakte und Cutover-Workflow-Folgeartefakte. |
| Nicht bindend für | Z3-Export, DR-Backup, Aufbewahrung. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | 71 STOP-Kandidaten vor Deduplikation |

### 3.13 F3-Closing — Summary der F3-Artefaktgruppe innerhalb Phase 4

| Feld | Inhalt |
|---|---|
| Status | V1.0 — locked |
| Lock-Basis | Draft V0.1 + Patch V0.2 + Micro-Patch 1 + finale Terminologie-Bereinigung „Sortierungsmarker" |
| Kernaussagen | Konsolidiert F3-D1 / F3-D2 / F3-D3 V1.0; öffnet keinen bestehenden Lock; erzeugt keine neue Fachentscheidung und kein neues Fachmodul. Schließt ausschließlich die F3-Artefaktgruppe innerhalb Phase 4 ab — kein Phase-4-Gesamtabschluss. Stellt Cross-Cutting-Boundaries explizit dar: Z3-Export ≠ DR-Backup; Z3-Export ≠ Migrations-Export; DR-Restore ≠ Migration-Roll-back; Migration ≠ native Re-Festschreibung; Retention ≠ DR-Backup. Enthält kompakte Boundary-Matrix gegen F0-D4, F0-D6, F0-D7, F1-D1/F1-D2. |
| Boundaries | Keine eigene Fachentscheidung, kein Schema, keine UI, kein Code, keine SQL-Aussage, keine Tool-/Provider-Wahl, keine Implementierungsentscheidung, keine neue STOP-Gesamtsumme, keine eigene STOP-Deduplikation. |
| Bindend für | Querschnitt-Referenz für die F3-Artefaktgruppe. |
| Nicht bindend für | Quell-Aussagen — diese bleiben in F3-D1 / F3-D2 / F3-D3 V1.0 authoritativ. F3-Closing ist Konsolidierungs-, nicht Quell-Artefakt. |
| Schema-frei / UI-frei / implementierungsfrei | ja / ja / ja |
| STOP-Stand | Keine eigene STOP-Gesamtsumme; referenziert ausschließlich F3-D1- / F3-D2- / F3-D3-STOP-Listen. |

---

## 4. Locked Invarianten

Diese Invarianten sind bereits in den jeweiligen V1.0-Artefakten gelockt. Dieses Register zitiert sie referenziell und erzeugt sie nicht neu.

### 4.1 USt-Wahrheits-Hierarchie

| Ebene | Artefakte | Rolle |
|---|---|---|
| USt-Wahrheit | F1-D1 / F1-D2 | Authoritative Quelle |
| USt-Konsumenten | F1-D3 / F2-D3 | Lesend |
| Operative Bridges | F2-D1 / F2-D2 | Können USt-relevante Vorgänge auslösen, sind aber keine USt-Wertquelle |
| Migration | F3-D3 | Keine USt-Wertquelle; Fremdsystemwerte bleiben Fremdsystemwerte |
| Recovery | F3-D2 | Keine USt-Wertquelle |
| Behördlicher Export | F3-D1 | Lesender Konsument |

**Konsequenz:** Kein Artefakt nach F1-D2 darf eigene USt-Werte als Wahrheit erzeugen. UStVA, Jahreserklärung, OPOS, Periodenabgrenzung, Z3-Export, DR und Migration konsumieren oder dokumentieren — sie ersetzen F1-D1 / F1-D2 nicht.

### 4.2 Festschreibungs-Hierarchie

| Ebene | Regel |
|---|---|
| F0-D4 | Authoritative Quelle für native Harouda-Festschreibung. |
| F1-D3 | Korrigierte UStVA ist Steueranmeldungs-Korrektur, keine Festschreibungs-Aufhebung. |
| F2-D3 | Jahreserklärung berücksichtigt AO §168-Zustimmungsdifferenzierung. |
| F3-D2 | Recovery hebt Festschreibung nicht auf. |
| F3-D3 | Migration darf Quell-Festschreibung nicht in native F0-D4-Festschreibung umdeuten. Cutover ist Grenze, kein Beförderungsweg. |

### 4.3 Mandantentrennung

| Ebene | Regel |
|---|---|
| F0-D6 | Mandantentrennung ist unverhandelbar. |
| F3-D1 | Kein Z3-Export über Mandantengrenzen. |
| F3-D2 | Kein Cross-Mandanten-Restore. |
| F3-D3 | Mehrmandanten-Migrationslauf nur mit getrennten Paketen, Manifesten, Audit-Spuren, Freigaben und Roll-back-Pfaden. Kanzlei-Vollmigration benötigt separates Kanzlei-Paket und strikt getrennte Mandanten-Pakete. |

### 4.4 Plattform-Admin-Grenze

| Ebene | Regel |
|---|---|
| F0-D7 | Plattform-Admin ist technische Rolle, kein fachlicher Superuser. |
| F3-D1 | Plattform-Admin erzeugt keinen Z3-Export. |
| F3-D2 | Keine Schlüssel-/Plaintext-/Mandantendaten-Einsicht durch Restore. |
| F3-D3 | Keine fachliche Migrationsentscheidung, kein Inhalts-/Secrets-Zugriff. |

### 4.5 Audit-Spur-Pflicht

Audit-Spur ist Pflicht für:

- fachliche Entscheidungen,
- Reviewer-/Berufsträger-Aktionen,
- Klärfälle,
- Status-Wechsel,
- Override-Entscheidungen,
- UStVA-/Jahreserklärungs-Übermittlung,
- Z3-Export,
- DR-Restore,
- Break-Glass,
- Migration und Roll-back,
- Quellpaket-Status,
- Mandanten-Kommunikationsentscheidungen.

### 4.6 GoBD / AO / HGB / DSGVO Boundaries (High-Level)

| Norm | Bezugspunkt im Modell |
|---|---|
| GoBD 2024 | Z3-Datenüberlassung (F3-D1); Migration (F3-D3, GoBD Rz. 142–144); Verfahrensdokumentation (Folgeartefakt). |
| AO §147 | Aufbewahrungspflichten (Folgeartefakt: Retention-/Aufbewahrungsartefakt). |
| AO §168 | Zustimmungsdifferenzierung Jahreserklärung (F2-D3). |
| HGB §250 | ARA/PRA-Periodenabgrenzung (F2-D2). |
| HGB §257 | Aufbewahrungspflichten (Folgeartefakt). |
| UStG §14c | Berichtigungsperiode beim Empfänger (F1-D2). |
| UStG §17 | Berichtigungslogik (F1-D2). |
| UStG §18 Abs. 3 / Abs. 4 | Jahreserklärung und Schlusszahlung / Erstattung (F2-D3). |
| BGB §366 / §367 | Zahlungszuordnung in OPOS (F2-D1; §367 nur als Boundary). |
| DSGVO Art. 20 | Eng auszulegen im Migrations-Kontext (F3-D3). |
| DSGVO Art. 32 | Zugriffsbeschränkung in Test-Migration (F3-D3). |
| DSGVO Art. 33 / 34 | Datenpannen-Folgeartefakt (offen). |

Dieses Register erzeugt keine neue rechtliche Auslegung. Konkrete Einzelfragen sind im jeweiligen V1.0-Artefakt oder in einem eigenen Folgeartefakt zu klären; rechtskritische Festlegungen erfordern Rücksprache mit Fach-StB / Rechtsanwalt.

---

## 5. STOP-Übersicht

| Artefakt | STOP-Stand | Authoritative Liste |
|---|---|---|
| F0-Closing | 60 konsolidierte F0-STOP-Bedingungen referenziert | F0-Closing V1.0 |
| F1-D1 | 24 STOP-Bedingungen referenziert | F1-D1 V1.0 |
| F1-D2 | 24 STOP-Bedingungen referenziert | F1-D2 V1.0 |
| F1-D3 | 21 STOP-Bedingungen nach Micro-Patch 9 referenziert | F1-D3 V1.0 |
| F1-Closing | 64 konsolidierte Phase-2-STOP-Bedingungen referenziert | F1-Closing V1.0 |
| F2-D1 | 31 STOP-Bedingungen referenziert | F2-D1 V1.0 |
| F2-D2 | 23 STOP-Bedingungen referenziert | F2-D2 V1.0 |
| F2-D3 | 26 STOP-Bedingungen referenziert | F2-D3 V1.0 |
| F2-Closing | 80 F2-STOPs referenziert vor Überlappungsbereinigung | F2-Closing V1.0 |
| F3-D1 | 23 STOP-Bedingungen | F3-D1 V1.0 |
| F3-D2 | 29 STOP-Bedingungen | F3-D2 V1.0 |
| F3-D3 | 71 STOP-Kandidaten vor Deduplikation | F3-D3 V1.0 |
| F3-Closing | Keine eigene STOP-Gesamtsumme; referenziert ausschließlich F3-D1- / F3-D2- / F3-D3-STOP-Listen | F3-Closing V1.0 |

**Methodik-Hinweis:**

Diese Datei berechnet **keine neue phasenübergreifende STOP-Gesamtsumme**. Unterschiedliche Artefakte verwenden unterschiedliche Zählweisen (konsolidiert, vor Deduplikation, nach Micro-Patches). Die authoritativen STOP-Listen verbleiben in den jeweiligen V1.0-Artefakten. Eine konsolidierte Gesamtsumme würde fachlich uneinheitlich sein und ist daher ausdrücklich nicht Teil dieses Registers.

---

## 6. Open Folgeartefakte

Die folgenden Folgeartefakte sind offen und nicht-bindend. Reihenfolge und Sortierung sind ein Priorisierungsvorschlag, keine Freigabe zur Umsetzung.

| Sortierungsmarker | Mögliches Folgeartefakt | Bezugskontext |
|---|---|---|
| A | Aufbewahrungs-/Retention-Archiv-Artefakt | AO §147, HGB §257, GoBD; konkrete Fristen, Formate, Zugriffspflichten und Modalitäten werden im gesonderten Retention-/Aufbewahrungsartefakt entschieden |
| A | Security-/Krypto-/Key-Custody-Artefakt | Voraussetzung für F3-D1 / F3-D2 / F3-D3 Plattform-Admin-Grenze |
| A | Z3-Export-Spezifikations-Artefakt | Technische Konkretisierung von F3-D1 |
| B | Architektur-/HA-/BCM-Artefakt | Near-zero-RPO/RTO außerhalb F3-D2 |
| B | Verfahrensdokumentations-Artefakt | GoBD-Verfahrensdokumentation |
| C | DSGVO-/Datenpannen-Folgeartefakt | DSGVO Art. 33 / 34 |
| C | Cybersecurity-Incident-Response-Artefakt | Ransomware / Forensik-Workflow |
| D | Lohn-DLS-Folgeartefakt | F3-D1 — Lohnsteuer-Außenprüfung außerhalb MVP |
| D | Z1-/Z2-Folgeartefakte | Datenzugriffsarten neben Z3 |
| E | Mahnwesen | Phase-3-Anschluss |
| E | Banking | Phase-3-Anschluss |
| E | Bewertungs-Artefakt | Phase-3-Anschluss |
| E | Bilanz-Vorbereitung | Phase-3-Anschluss |
| E | Sondervorauszahlung | Phase-3-Anschluss |
| E | Schlusszahlung / Erstattung | Phase-3-Anschluss |
| F | EU-Sub | Steuer-Scope-Erweiterung |
| F | §13b-Sub | Steuer-Scope-Erweiterung |
| F | Drittland | Steuer-Scope-Erweiterung |
| F | OSS | Steuer-Scope-Erweiterung |
| F | Differenzbesteuerung | Steuer-Scope-Erweiterung |
| F | Bauleistungen | Steuer-Scope-Erweiterung |

**Klarstellung:** Die Buchstabenmarker A–F sind ein nicht-bindender Priorisierungsvorschlag und keine Freigabe zur Umsetzung. Sie dienen ausschließlich der Übersichtlichkeit innerhalb der Folgeartefakte-Liste und begründen weder rechtliche noch methodische Verbindlichkeit, weder Reihenfolgepflicht noch Implementierungsauftrag. Jedes Folgeartefakt benötigt einen eigenen Draft-, Review- und V1.0-Lock-Prozess.

---

## 7. Explicit Non-Scope

Dieses Register leistet ausdrücklich nicht:

- Keine Implementierung.
- Kein Schema.
- Keine UI.
- Kein Code.
- Kein SQL.
- Keine Tool-, Vendor-, Provider-, Framework- oder Library-Wahl.
- Keine ERiC-, Storage-, Encryption- oder Datenbank-Implementierung.
- Keine Re-Öffnung gelockter Artefakte.
- Keine neue Fachentscheidung.
- Keine Marketing-, Markteinführungs-, Pilot- oder Produktionsfreigabe.
- Keine Repository-Ausführung allein durch dieses Dokument.
- Keine neue STOP-Gesamtsumme, keine eigene STOP-Deduplikation.
- Keine rechtliche Neuauslegung von GoBD, AO, HGB oder DSGVO.

---

## 8. Review / Commit Gate

Für die Aufnahme in das Repository gelten die folgenden Regeln:

1. **Review vor Commit:** Diese Datei darf nur nach inhaltlichem Review committed werden. Reviewer prüfen, ob ausschließlich gelockte Entscheidungen referenziert werden und keine neue Fachentscheidung enthalten ist.
2. **Documentation-only Pull Request:** Die Datei wird über einen reinen Dokumentations-PR aufgenommen. Der PR darf ausschließlich Markdown-/Dokumentationsdateien ändern. Ausgeschlossen sind insbesondere: Feature-Implementierung, Schema-Änderungen, Migrations-Skripte, Code-Änderungen, SQL-/DDL-Änderungen, CI/CD-Pipeline-Änderungen, Konfigurations- und Secrets-Änderungen, Deployment-Manifeste sowie Tool-/Provider-/Vendor-Konfigurationen. Bei Verstoß ist der PR zu trennen.
3. **Forbidden-Reference / Terminology Quality Gate:** Die Datei wird gegen das bestehende Forbidden-Reference- und Terminologie-Quality-Gate geprüft. Die in der finalen Terminologie-Bereinigung obsolet gewordene Sortierungsbezeichnung (siehe F3-Closing V1.0 Lock-Basis) darf in operativer Verwendung nicht enthalten sein; ausschließlich „Sortierungsmarker" oder „Buchstabenmarker A–F" sind zulässig.
4. **Versionierte Dokumentations-Reviews:** Aktualisierungen erfolgen ausschließlich durch versionierten Dokumentations-Review. Inhaltliche Änderungen, die über reine Referenz-Aktualisierungen hinausgehen, sind unzulässig — sie würden eine Re-Öffnung gelockter Artefakte erfordern und sind daher außerhalb des Scope dieses Registers.
5. **Keine Folgewirkung:** Der Merge dieses Dokuments löst keine Implementierungs-, Bereitstellungs-, Migrations- oder Produktionsentscheidung aus.
6. **Konsistenzprüfung:** Bei jeder Aktualisierung wird gegen die jeweils authoritativen V1.0-Artefakte und die Vorrang-Regel geprüft. Bei Abweichung sind die V1.0-Lock-Aussagen führend; das Register wird nachgezogen.

---

## 9. Quality Check Table

| Prüfkriterium | Status |
|---|---|
| Nur gelockte Entscheidungen aufgenommen | ✅ |
| Keine neuen Fachentscheidungen erzeugt | ✅ |
| Kein Schema, keine UI, kein Code, kein SQL | ✅ |
| Keine Tool-/Vendor-/Provider-Wahl | ✅ |
| Keine neue phasenübergreifende STOP-Gesamtsumme | ✅ |
| Keine eigene STOP-Deduplikation | ✅ |
| Offene Folgeartefakte als nicht-bindend markiert | ✅ |
| Buchstabenmarker A–F ausschließlich als nicht-bindender Priorisierungsvorschlag | ✅ |
| Obsolete Sortierungsbezeichnung gemäß F3-Closing V1.0 nicht in operativer Verwendung | ✅ |
| V1.0-Lock-Aussagen bleiben authoritativ | ✅ |
| F3-Closing ausschließlich als Konsolidierungs-/Boundary-Referenz dargestellt, nicht als Quell-Artefakt | ✅ |
| Vorrang-Regel ausdrücklich in Abschnitt 1.5 verankert | ✅ |
| GoBD / AO / HGB / DSGVO nur referenziell, keine Neuauslegung | ✅ |
| USt-Wahrheits-Hierarchie F1-D1 / F1-D2 unverändert authoritativ | ✅ |
| Festschreibungs-Hierarchie F0-D4 unverändert authoritativ | ✅ |
| Mandantentrennung F0-D6 unverhandelbar | ✅ |
| Plattform-Admin-Grenze F0-D7 unverändert | ✅ |
| Audit-Spur-Pflicht referenziell aufgeführt | ✅ |
| Keine Implementierungsfreigabe, keine Pilot-/Produktionsfreigabe | ✅ |

---

## Versionshinweis

| Feld | Inhalt |
|---|---|
| Dateiversion | v1 |
| Charakter | Locked Decisions Register (Dokumentation) |
| Aktualisierung | Nur durch versionierten Dokumentations-Review |
| Geltungsbereich | Stand nach F3-Closing V1.0 — locked |
