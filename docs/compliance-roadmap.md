# Compliance- und Lizenzierungs-Roadmap

**Zweck**: Gesprächsgrundlage für Lizenzierungs- und Zertifizierungsdiskussion
mit Behörden, DATEV und Zertifizierungsstellen. Ordnet pro Thema ein: wo die
Demo heute steht, was für einen produktiven Einsatz erforderlich wäre und
welche Lizenz- / Zertifizierungspfade dafür vorgesehen sind.

**Wichtige Vorbemerkung**: Kostenangaben sind als Orientierungswerte zu
verstehen, basierend auf öffentlichen Veröffentlichungen und marktüblichen
Sätzen (Stand 2025). Verbindliche Angebote holt jede:r Antragsteller:in
selbst bei den Zertifizierungsstellen ein.

---

## Überblick

| # | Bereich                        | Demo-Stand          | Lizenz/Zertifikat erforderlich?  | Pfad vorhanden | Zeit bis Prod. | Indikative Kosten initial |
|---|--------------------------------|---------------------|----------------------------------|---------------|----------------|---------------------------|
| 1 | GoBD-Konformität (IDW PS 880)  | Teilaspekte         | Ja, wenn Kanzlei-produktiv        | Ja            | 6–12 Monate    | 15–50 k€                  |
| 2 | ELSTER-Abgabe via ERiC         | XML-Export only     | Ja, wenn Direktabgabe gewünscht   | Ja (BZSt)     | 3–6 Monate     | Lizenz frei, IT-Aufwand 30–80 k€ |
| 3 | DATEV-Kompatibilität           | Export-shape only   | Partnerschaft für echte Konnektoren| Ja (DATEV)    | 3–6 Monate     | 5–20 k€ Onboarding        |
| 4 | Banking / PSD2                 | Nur Datei-Import    | Ja, für Open Banking              | 2 Varianten   | 1–12 Monate    | 500 €/Mon – 50 k€         |
| 5 | DSGVO / Datenschutz            | Strukturell vorb.   | Verfahrensverzeichnis + DSB       | Standardpfad  | 1–3 Monate     | 3–15 k€                   |
| 6 | ISO 27001 / BSI C5             | Nicht abgedeckt     | Ja, für Behörden-SaaS             | Ja (TÜV, DNV) | 6–12 Monate    | 30–100 k€                 |

---

## 1. GoBD / IDW PS 880

**Gesetzliche Grundlage**: BMF-Schreiben vom 28.11.2019 (GoBD),
Prüfungsstandard IDW PS 880 (Software-Bescheinigung).

**Was in der Demo vorhanden ist**:
- Hash-verkettetes Audit-Log mit SHA-256 (tamper-evidence). Änderungen sind
  durch die integrierte Kettenprüfung erkennbar.
- Versionsfeld pro Buchung (`version`) und `updated_at`-Stempel.
- Verfahrensdokumentations-Vorlage (`docs/verfahrensdokumentation.md`) mit
  allen Kapiteln, die IDW PS 880 erwartet: Systemdokumentation,
  Berechtigungskonzept, Datensicherung, Datenzugriff Z1/Z2/Z3,
  Aufbewahrung, Löschkonzept.
- GDPdU/IDEA-Export für Betriebsprüfung.

**Was fehlt für produktiven Einsatz**:
- **WORM-Speicher**: Das Audit-Log muss zusätzlich auf einen unveränderbaren
  Speicher gespiegelt werden (S3 Object Lock, Azure Immutable Blob oder
  zertifizierte Storage-Appliance).
- **Ausgefüllte Verfahrensdokumentation**: aktuelle Vorlage ist Scaffold —
  die konkreten Prozesse der Kanzlei müssen dokumentiert werden.
- **Externes Testat nach IDW PS 880**: Wirtschaftsprüfer:in oder
  zertifizierte Prüfgesellschaft attestiert Ordnungsmäßigkeit.

**Pfad**:
- Anbieter: Wirtschaftsprüfergesellschaften mit IT-Prüfungsspezialisierung
  (z. B. BDO, Ebner Stolz, KPMG IT Advisory, Rödl & Partner, Mittelstandsprüfer).
- Ablauf: Dokumentations-Review → Walkthrough-Test → Systemtests →
  Mängelbericht → Korrekturen → Testat.

**Zeit**: 6–12 Monate ab Beginn der Dokumentationsvervollständigung.
**Kosten initial**: 15–50 k€. Jährliche Follow-up-Audits typisch 5–15 k€.

---

## 2. ELSTER-Abgabe via ERiC

**Gesetzliche Grundlage**: § 87a AO, ELSTER-Verfahren,
Nutzungsvereinbarung BZSt.

**Was in der Demo vorhanden ist**:
- XML-Dateien im ELSTER-schema-nahen Layout für UStVA und EÜR.
- Produkt- und Formular-Versions-Pinning im XML-Header.
- Klarer Hinweis in jedem Dokument: „eigener Aufbau, keine zertifizierte
  ERiC-Abgabe".
- USt-ID-Prüfung via BZSt evatr über Supabase Edge Function.

**Was fehlt für echte Direktabgabe**:
- **ERiC-Bibliothek** (C++, vom BZSt bereitgestellt) muss integriert werden.
- **Nutzungsvereinbarung** mit BZSt (lizenzfrei, aber formell).
- **Verifizierungsverfahren**: Test-Einreichungen gegen die BZSt-Test-
  Infrastruktur, bis eine produktive Freischaltung erteilt wird.
- **Zertifikat**: Hersteller-Software-Zertifikat nötig für Anbindung.

**Pfad**:
- ERiC wird nicht im Browser laufen. Realistisch sind zwei Varianten:
  (a) **Desktop-Companion-App**: installierte Komponente auf dem Arbeitsplatz,
      die ERiC einbindet. App kommuniziert per lokalem HTTP/IPC mit dem
      Browser-Client.
  (b) **Serverseitiger ERiC-Wrapper**: Eigene Backend-Komponente ruft ERiC
      via JNI / Native Bridge auf. Höhere Anforderungen an IT-Sicherheit
      (HSM für Schlüssel, ggf. C5-Zertifikat für Cloud-Betrieb).

**Zeit**: 3–6 Monate für Integration + Verifizierungsverfahren.
**Kosten initial**: Lizenz frei; Entwicklungsaufwand 30–80 k€ je Variante.

---

## 3. DATEV-Kompatibilität

**Was in der Demo vorhanden ist**:
- DATEV-Standard-Buchungsstapel-CSV (EXTF v700) nach öffentlicher
  Spezifikation.
- ATCH-ähnliche Beleg-ZIP (`document.xml` + Dateien mit GUID).

**Was zertifiziert wäre**:
- **DATEVconnect online**: API-Zugang zu DATEV-Cloud für Mandantenaustausch.
- **DATEVasp**: ASP-Integration.
- **DATEV-Schlüsselfertige Integration**: DATEV-Partnerprogramm.

**Pfad**:
- Antrag beim **DATEV Softwarepartner**-Programm (www.datev.de/partner).
- Technische Abnahme durch DATEV.
- Vertragliche Bindung (Lizenzgebühren, ggf. Umsatzbeteiligung je nach
  Modell).

**Zeit**: 3–6 Monate für Partner-Onboarding + technische Integration.
**Kosten initial**: 5–20 k€ Onboarding. Laufende Gebühren modellabhängig.

**Hinweis**: DATEV ist nicht gesetzlich vorgeschrieben. Die Zielgruppe
(Steuerberater:innen) erwartet in der Praxis DATEV-Kompatibilität, daher
relevant für Marktzugang — aber kein Compliance-Thema im engeren Sinne.

---

## 4. Banking / PSD2 / Open Banking

**Gesetzliche Grundlage**: Zahlungsdiensteaufsichtsgesetz (ZAG), Zweite
EU-Zahlungsdiensterichtlinie (PSD2), BaFin-Merkblätter zu TPP.

**Was in der Demo vorhanden ist**:
- MT940- und CAMT.053-Datei-Import. Nutzer:innen laden den Kontoauszug
  manuell aus dem Online-Banking und spielen ihn in die App ein.
- IBAN-Validierung mod-97.
- BLZ→Bank-Lookup aus einer Bundesbank-Teilmenge.

**Was fehlt für echte Bank-Anbindung**:
- **Kontoinformationsdienst (AISP-Lizenz)** oder Vertrag mit einem
  lizenzierten Aggregator.
- **Authentifizierungs-Redirect-Flows** pro Bank (Strong Customer
  Authentication).
- **API-Keys**, SLA, Incident-Reaktion.

**Pfad A — eigene BaFin-Registrierung als AISP**:
- Antrag bei BaFin, Eigenmittelanforderungen, IT-Sicherheitskonzept
  (EBA-Leitlinien), Prüfbericht.
- Dauer: 6–12 Monate.
- Kosten: einmalig ~10 k€ für BaFin, 40–100 k€ für Anwaltsgebühren und
  IT-Sicherheitsgutachten. Laufende Aufsichtskosten.

**Pfad B — Aggregator-Partnerschaft (realistischer)**:
- Vertrag mit einem lizenzierten Anbieter:
  - **finAPI** (Schwäbisch Hall)
  - **Klarna Kosma** (ehem. Sofort)
  - **Tink** (Visa-Tochter)
  - **FinTecSystems / FinApi**
- Monatspauschale ab ~500 € für Entwicklungs-Sandbox, produktiv 2–10 k€
  pro Monat je nach Anfragen-Volumen.
- Dauer: 1–2 Monate Integration.

**Empfehlung**: Pfad B. Eigene AISP-Lizenz lohnt nur bei sehr hohem
Volumen und strategischer Bank-Positionierung.

---

## 5. DSGVO / Datenschutz

**Gesetzliche Grundlage**: DSGVO (EU) 2016/679, BDSG 2018.

**Was in der Demo vorhanden ist (strukturell)**:
- Daten pro Nutzer:in isoliert (RLS bei Supabase, localStorage im Demo-Build).
- Audit-Log dokumentiert Zugriffe.
- Keine Tracker, keine Analytics, keine Werbe-Pixels.
- Verfahrensdokumentations-Vorlage listet die erforderlichen Abschnitte.

**Was für Produktivbetrieb konkret getan werden muss**:
- **Verfahrensverzeichnis** nach Art. 30 DSGVO.
- **Auftragsverarbeitungsvertrag (AVV)** mit Supabase (Standard verfügbar).
- **TOMs** (technische und organisatorische Maßnahmen) konkret dokumentieren.
- **Datenschutzerklärung** auf der öffentlichen Website und in der App.
- **Datenschutzbeauftragte:r** benennen, falls Mitarbeiterzahl oder
  Verarbeitungsumfang es erfordert.
- **Data Processing Agreements** mit allen Unterauftragnehmern (BZSt-Edge-
  Function → evatr ist ein Datenabfluss zu einer Bundesbehörde; das ist
  datenschutzrechtlich unkritisch, aber zu dokumentieren).

**Pfad**:
- Externe:r Datenschutzbeauftragte:r (DSB) oder Kanzlei-interne Lösung.
- Anbieter: GINDAT, datenschutzexperte.de, Intersoft, lokale Rechtsanwält:innen.

**Zeit**: 1–3 Monate.
**Kosten**: 3–15 k€ initial. DSB laufend 100–500 €/Mon. je nach Modell.

---

## 6. ISO 27001 / BSI C5 (optional, für Behörden-SaaS)

**Relevanz**: Falls die Software an öffentliche Auftraggeber verkauft wird
(z. B. Finanzverwaltungen als Verfahrensbeteiligte), fordern Beschaffungs-
stellen häufig ein Informationssicherheits-Managementsystem.

**Was in der Demo vorhanden ist**:
- Nichts Zertifiziertes. Verfahrensdokumentations-Vorlage deckt
  organisatorische Kapitel bereits ab (Datensicherung, Zugangskontrolle,
  Protokollierung).

**Optionen**:
- **ISO 27001 (international)**: TÜV, DNV, DEKRA. Gilt 3 Jahre, jährliche
  Überwachungsaudits. 30–100 k€ initial.
- **BSI IT-Grundschutz**: vergleichbar. Zertifikat nach Basisschutz bis
  Kern-/Standard-Absicherung gestuft. Ähnliche Kostendimension.
- **BSI C5**: spezifisch für Cloud-Dienste an Bundesbehörden. Attestierung
  nach Typ 1 (Design) bzw. Typ 2 (operativ).

**Zeit**: 6–12 Monate ab Beginn ISMS-Aufbau.
**Kosten**: 30–100 k€ initial, 10–30 k€ jährlich für
Überwachungsaudit.

---

## Gesamteinschätzung

Bei produktiver Vermarktung an Kanzleien (ohne Behördenverkauf):
- **Muss**: GoBD-Testat (#1), DSGVO (#5). DATEV-Anbindung (#3) oder
  ELSTER-Direktabgabe (#2) je nach Positionierung.
- **Kann**: ISO 27001 (#6) als Vertrauenssignal. Banking (#4) als
  Produktivitäts-Feature.

Bei Verkauf an Behörden oder behördennahe Empfänger:
- **Muss**: alles in der ersten Gruppe, plus ISO 27001 oder BSI C5 (#6).

Realistischer Gesamt-Erstaufwand bis Produktionsreife:
**~120–300 k€ externe Audits + Partnerschaften**, plus interner
Entwicklungsaufwand für ERiC-Integration.

---

## Reihenfolge-Empfehlung

1. **DSGVO-Basis** abschließen (Verfahrensverzeichnis, AVV, TOMs).
   Schnell, günstig, Grundvoraussetzung für alles andere.
2. **Verfahrensdokumentation** ausfüllen und intern reviewen.
3. **GoBD-Vor-Review** durch eine:n Wirtschaftsprüfer:in. Klärt, welche
   technischen Nachrüstungen vor dem PS 880-Testat nötig sind (z. B.
   WORM-Speicher, Rollenmodell).
4. Parallel **DATEV-Partnerantrag** stellen (lange Vorlaufzeit).
5. Nach GoBD-Vor-Review: technische Nachrüstungen umsetzen, dann Testat.
6. **Banking-Aggregator-Auswahl**, Integration parallel zu (5).
7. **ERiC-Integration** nach GoBD-Testat.
8. **ISO 27001 / C5** falls Behörden-Vertrieb geplant — nach allem anderen.

Dieser Pfad minimiert Blockaden: jede Phase liefert einen vermarktbaren
Zwischenstand.
