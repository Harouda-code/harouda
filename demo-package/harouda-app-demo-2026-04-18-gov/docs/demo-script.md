# Demo-Script — Live-Demonstration

**Ziel**: strukturierte 15-Minuten-Demo für Entscheider:innen und Fach-
prüfer:innen. Jeder Abschnitt nennt die Dauer, die zu zeigenden Screens,
Kern-Aussagen und häufige Rückfragen.

**Voraussetzungen vor der Demo**:
- Demo-Build läuft (dist-Build, per Server oder direkter index.html-Open)
- Browser auf Vollbild / Präsentations-Zoom (Strg+= zweimal auf Chromium)
- Demo-Daten sind auto-seeded (prüfen: Dashboard zeigt ~3.000 €
  Quartalsumsatz und „Beratungshonorar Meyer" in letzten Buchungen)
- Rundgang wurde noch nicht abgeschlossen — falls doch, im Demo-Banner auf
  „Rundgang starten" klicken zum Reset

---

## 0. Vor der Live-Schaltung (30 s)

Öffnen Sie die App auf dem Dashboard. Der **Demo-Banner oben** bleibt
während der gesamten Demo sichtbar. Sagen Sie ausdrücklich am Anfang:

> „Was Sie heute sehen, ist eine Kapazitäts-Demonstration. Alle Daten
> liegen lokal im Browser. Die App spricht nicht mit der Finanzverwaltung,
> nicht mit Banken, nicht mit DATEV. Dass wir das jetzt zeigen können
> bedeutet nicht, dass wir diese Anbindungen heute besitzen — dazu kommen
> wir am Ende der Demo."

---

## 1. Dashboard (2 min)

**Screen**: `/dashboard`

**Zeigen**:
- KPI-Tiles (Umsatz, Ausgaben, Ergebnis, USt-Schuld)
- Geschäftsjahr-Schalter oben rechts — auf 2024 stellen, Zahlen ändern sich
- Mandanten-Switcher oben links — auf „Schulz GmbH" filtern, dann
  wieder auf „Alle Mandanten"

**Aussage**:
> „Die Zahlen rechnen sich aus den Buchungsjournal-Einträgen. Nichts ist
> hart kodiert. Das Jahr und der Mandant sind globale Filter, die auf
> alle folgenden Ansichten wirken."

---

## 2. Buchungsjournal (2 min)

**Screen**: `/journal`

**Zeigen**:
- Liste mit 15 Buchungen
- „Neue Buchung" anklicken, Formular:
  - Soll-/Haben-Konto als Dropdown aus SKR03
  - USt-Satz, Skonto, Gegenseite, Fälligkeit
- „Beleg-Nr." → DATEV-CSV-Export demonstrieren (Datei lädt herunter,
  in Notepad öffnen: Standard-Buchungsstapel-Format sichtbar)

**Aussage**:
> „Doppelte Buchführung mit Soll/Haben, USt-Automatik und Skonto. Der
> CSV-Export folgt dem öffentlich dokumentierten DATEV EXTF-v700-Layout.
> Eine echte, DATEV-zertifizierte Integration müssen wir beim DATEV
> Partner-Programm beantragen — siehe Compliance-Roadmap Abschnitt 3."

---

## 3. Offene Posten → Mahnwesen (2,5 min)

**Screen**: `/opos`

**Zeigen**:
- Aging-Buckets, drei Mahnfälle sichtbar (Bauer 14 T., Krüger 46 T.,
  Roth 74 T.)
- Wechsel auf `/mahnwesen`
- Mahnvorschläge: Zahlungserinnerung, 1. Mahnung, 2. Mahnung je nach
  Überfälligkeit
- „Mahnung erstellen" für Roth GmbH anklicken → PDF wird erzeugt
  und heruntergeladen
- PDF öffnen, zeigen: Kanzlei-Header, Adressblock, Mahngebühr,
  Verzugszinsen nach § 288 BGB, Bankverbindung, Schlussformel

**Aussage**:
> „Das Mahnwesen arbeitet mit echten gesetzlichen Regeln: Verzugszinsen
> nach § 288 BGB mit Basiszinssatz plus 5 oder 9 Prozentpunkten. Die
> Schwellenwerte sind in den Einstellungen konfigurierbar."

---

## 4. Buchführung-Modul → EÜR (2,5 min)

**Screen**: `/buchfuehrung`

**Zeigen**:
- Vier Kacheln im Hub
- Klick auf „EÜR vorbereiten" → `/steuer/euer`
- EÜR mit allen Zeilen (12, 23–47), pro Zeile aufklappbar zu den
  Quell-Konten
- Zurück zu `/buchfuehrung/zuordnung` — ein Konto umhängen, Toast
  „Überschreibung gespeichert"
- Zurück zu `/buchfuehrung/plausi` — Checks zeigen grüne OKs und
  gelbe Hinweise

**Aussage**:
> „Der Weg vom Journal in die EÜR ist dokumentiert und auditierbar:
> jeder Betrag lässt sich auf seine Quellkonten zurückverfolgen. Das
> Mapping ist konfigurierbar, die Plausibilitätsprüfung warnt vor
> typischen Fehlern wie Privatkonten in der EÜR oder USt-Inkonsistenzen.
> **Was hier als ELSTER-XML exportiert wird, ist kein ERiC-Abgabe-Dokument**,
> sondern für den Import in das ELSTER Online Portal oder einen
> zertifizierten Fachclient."

---

## 5. Steuerformulare (2 min)

**Screen**: `/steuer`

**Zeigen**:
- 10 Formular-Kacheln: UStVA, EÜR, GewSt, KSt, Anlagen N/S/G/V/SO/AUS/
  Kind/Vorsorge/R/KAP
- Ein Formular öffnen (z. B. Anlage N) — **FormMetaBadge oben** zeigen:
  Version, Veranlagungsjahr, „intern bestätigt", Link zu elster.de
- Kurze Interaktion: SV-Rechner mit Bruttolohn 5.000 €, Krankenkasse TK
  → Beiträge rechnen live

**Aussage**:
> „Jedes Formular trägt einen eigenen Versions-Badge mit Zuordnung zum
> Veranlagungsjahr und zum geprüften Parameter-Set. Was hier an Quellen
> verlinkt ist, sind die offiziellen Stellen — BMF, BZSt, ELSTER-Portal.
> Die Tax-Parameter leben in versionierten Jahrgängen unter
> `src/data/steuerParameter/`, und wir haben ein Changelog für jede
> Änderung."

---

## 6. Transparenz-Screens (2 min)

**Screen**: `/einstellungen/audit`

**Zeigen**:
- Audit-Log mit Einträgen
- „Kette prüfen" → grüne Bestätigung: „Alle N Einträge verifiziert"
- Eine Zeile aufklappen — Before/After sichtbar

**Wechsel zu**: `/einstellungen/aufbewahrung`
- Kurze Ansicht: Fristen nach § 147 AO, 8 Jahre Buchungsbelege ab 2025

**Wechsel zu**: `/einstellungen/fristen`
- Fristenkalender mit überfälligen / anstehenden Terminen

**Aussage**:
> „Für eine GoBD-Prüfung brauchen wir Nachvollziehbarkeit. Der Audit-Log
> ist SHA-256-verkettet: jede Zeile enthält den Hash der vorherigen.
> Eine nachträgliche Änderung bricht die Kette und wird vom Verifier
> erkannt. **Das ist Tamper-Evidence, kein WORM-Storage.** Echte
> GoBD-Konformität erfordert zusätzlich ein IDW PS 880-Testat — Pfad
> und Kosten stehen in der Compliance-Roadmap."

---

## 7. Grenzen und Roadmap (2 min)

**Screen**: Demo-Banner oben, `docs/compliance-roadmap.md` optional auf
zweitem Bildschirm

**Aussage** (wörtlich so empfohlen):
> „Zusammengefasst: was Sie gesehen haben ist ein funktionsfähiger
> Demonstrator. Was für eine produktive Verwendung in einer Steuer-
> beratungspraxis oder im Behördenkontext ergänzt werden muss, haben
> wir in sechs Punkten aufgelistet:
>
> 1. GoBD-Testat nach IDW PS 880 — externer Prüfer, 6–12 Monate, ca.
>    15–50 k€.
> 2. ERiC-Integration für direkte ELSTER-Abgabe — lizenzfrei von BZSt,
>    aber 3–6 Monate Entwicklungsaufwand, 30–80 k€.
> 3. DATEV-Partnerschaft für echte Konnektoren — 3–6 Monate.
> 4. Banking-Aggregator oder eigene AISP-Lizenz bei der BaFin.
> 5. DSGVO-Vervollständigung, 1–3 Monate.
> 6. Optional ISO 27001 oder BSI C5 für Behördenkontexte.
>
> Der vollständige Plan mit Zeit- und Kostenangaben steht im
> Compliance-Roadmap-Dokument, das Ihnen mit diesem Paket vorliegt."

---

## Häufige Rückfragen

**„Ist das zertifiziert?"**
> Aktuell nicht. Das Paket listet genau auf, welche Zertifizierungen für
> einen Produktiveinsatz erworben würden.

**„Warum nicht einfach DATEV kaufen?"**
> Diese App ist kein DATEV-Ersatz. Sie demonstriert einen Kanzlei-Workflow
> mit schlankerer Oberfläche, DATEV-kompatiblem Export und direkter
> Integration typischer Nebenaufgaben (OCR, E-Rechnung, MT940). Zielgruppe
> sind Kanzleien, die DATEV parallel nutzen oder eine Alternative suchen.

**„Wer haftet für Fehler?"**
> Im Demo-Stand niemand — daher die expliziten Haftungsausschlüsse. Ein
> produktives Produkt würde eine Berufshaftpflichtversicherung und klare
> Endnutzervertragsbedingungen erfordern.

**„Wie lang würde eine Produktivversion brauchen?"**
> Abhängig vom Umfang. Minimalkurs (DSGVO + GoBD-Testat, kein ERiC,
> kein Banking) etwa 4–6 Monate. Vollbild (alle sechs Bereiche)
> realistisch 12–18 Monate inkl. Zertifizierungsrunden.

**„Wo liegen die Daten?"**
> Im Demo-Build vollständig im Browser. In einer Produktivversion
> vorgesehen: Supabase Postgres (EU-Region, DSGVO-konform) mit Row
> Level Security je Kanzlei.

**„Kann ich das selbst betreiben?"**
> Source wäre vertraglich zu regeln. Die Architektur (Supabase + React)
> erlaubt self-hosting; operativer Betrieb verlagert dann GoBD-/ISO-
> Verantwortung auf Sie.

---

## Zeitbudget-Kompression (falls nur 10 min verfügbar)

- Abschnitt 0 streichen
- Abschnitt 1 + 2 zusammenfassen (3 min)
- Abschnitt 6 auf 1 min verkürzen (nur Audit-Log + Kettenprüfung)
- Abschnitt 7 auf 2 min belassen — **dieser Abschnitt ist nicht verhandelbar**
  in einer Lizenzierungsdiskussion.
