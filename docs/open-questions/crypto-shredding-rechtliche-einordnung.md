# Open Question — Crypto-Shredding: Rechtliche Einordnung

**Dokumenttyp:** Offene Rechtsfrage zur juristischen Gegenprüfung
**Status:** 🔴 offen — Fachanwalts-Freigabe erforderlich **vor Produktivstart**
**Release-Blocker für:** jede produktive Nutzung von Crypto-Shredding in Harouda
**Erstellt:** 2026-04-22
**Quelle:** Fachreview zu `09-dsgvo-compliance.md` Eintrag #6
**Verantwortlich:** Projektleitung Harouda + externer Fachanwalt für IT-Recht / Datenschutzrecht

---

## 1. Zusammenfassung der offenen Frage

Harouda verwendet **Crypto-Shredding** (Vernichtung des Entschlüsselungs-Schlüssels) zur Behandlung der Kollision zwischen:

- **Art. 17 Abs. 1 DSGVO** — Recht auf Löschung, und
- **§ 147 AO / § 257 HGB / GoBD** — 6- bzw. 10-jährige Aufbewahrungspflicht für Buchführungsunterlagen.

Die im Glossar gewählte rechtliche Einordnung lautet:

> Crypto-Shredding ist **technische Umsetzung von Art. 18 Abs. 1 lit. b DSGVO** (Einschränkung der Verarbeitung), die nach **Art. 17 Abs. 3 lit. b DSGVO** anstelle einer Löschung tritt, wenn eine gesetzliche Aufbewahrungspflicht besteht. Crypto-Shredding ist **nicht** Löschung im Sinne von Art. 17 Abs. 1.

**Offene Frage an den Fachanwalt:** Ist diese Einordnung rechtlich belastbar, oder besteht Bedarf für eine Anpassung?

---

## 2. Warum die Einordnung wichtig ist

Die Literatur und einzelne Anbieter bewerben Crypto-Shredding häufig als „Löschung im Sinne von Art. 17 DSGVO". Diese Darstellung ist aus Sicht des Projekts **angreifbar**, weil:

- Die DSGVO verwendet „Löschung" und „Einschränkung" in Art. 17 und Art. 18 als **unterschiedliche** Rechtsfolgen.
- Bei Crypto-Shredding **bleibt der Datensatz physisch vorhanden**. Seine Lesbarkeit ist entzogen; das ist der Regelungsgehalt von Art. 18, nicht von Art. 17.
- Weder der EDPB noch die DSK haben Crypto-Shredding als Art. 17-Umsetzung formell anerkannt (Stand April 2026).
- Eine spätere Behauptung einer Aufsichtsbehörde *„Ihr habt nicht gelöscht"* könnte im schlechten Fall zu einer Zweitstrafe führen (unterlassene Einschränkung + fehlende Löschung).

Die Art. 18-Einordnung ist **defensiver**: sie behauptet nicht, was technisch nicht geschehen ist (Löschung), sondern beansprucht, was tatsächlich geschehen ist (Einschränkung mit faktisch unumkehrbarer Wirkung).

---

## 3. Konkrete Fragen an den Fachanwalt

### Frage 1 — Rechtsgrundlage

Ist die Kaskade

```
Art. 17 Abs. 1 → Ausnahme Art. 17 Abs. 3 lit. b → Pflicht zur Einschränkung Art. 18 Abs. 1 lit. b → technische Umsetzung Crypto-Shredding
```

rechtlich tragfähig für eine Steuerberater-Software mit GoBD-pflichtigen Buchführungsdaten?

### Frage 2 — Formulierung gegenüber Betroffenen und Aufsicht

Ist die folgende Musterformulierung zustimmungsfähig?

> *„Wir schränken die Verarbeitung Ihrer personenbezogenen Daten nach Art. 18 Abs. 1 lit. b DSGVO ein, da eine gesetzliche Aufbewahrungspflicht nach § 147 AO / § 257 HGB besteht (Art. 17 Abs. 3 lit. b DSGVO). Die Einschränkung wird technisch durch Vernichtung des Verschlüsselungs-Schlüssels (Crypto-Shredding) unumkehrbar umgesetzt. Eine Entschlüsselung der Daten ist ab diesem Zeitpunkt ausgeschlossen. Die verschlüsselten Daten verbleiben im System, um die steuer- und handelsrechtlichen Aufbewahrungspflichten zu erfüllen."*

Falls nein: welche Formulierung wäre aus Ihrer Sicht zu wählen?

### Frage 3 — Informationspflicht Art. 18 Abs. 3

Art. 18 Abs. 3 DSGVO verlangt Unterrichtung des Betroffenen **vor Aufhebung** der Einschränkung. In Harouda tritt dies nur ein, wenn eine Aufbewahrungspflicht **vor** Ablauf wegfällt (z. B. Betriebsprüfung abgeschlossen, Frist verkürzt).

- Reicht eine **generische Datenschutzerklärung** als Unterrichtung, oder muss im Einzelfall aktiv informiert werden?
- Wie ist zu verfahren, wenn der Schlüssel bereits vernichtet wurde — d. h. eine „Aufhebung" technisch gar nicht möglich ist?

### Frage 4 — Nicht-personenbezogene Felder

Buchungsdaten, Konten, Beträge sind nach h. M. nicht personenbezogen, wenn sie nicht identifizierend sind. Crypto-Shredding wird daher nur auf personenbezogene Felder (Name, Adresse, USt-IdNr. nat. Person) angewandt.

- Ist diese Abgrenzung tragfähig?
- Unter welchen Bedingungen werden Buchungsdaten selbst personenbezogen (z. B. Einzelunternehmer, Freiberufler, wo Mandanten-Identität und natürliche Person zusammenfallen)?

### Frage 5 — Sub-Processor-Schlüsselhoheit (BYOK)

Harouda setzt **Bring Your Own Key (BYOK)** mit EU-gehostetem HSM ein, damit der Hosting-Anbieter (Supabase auf AWS eu-central-1) zu keinem Zeitpunkt Zugriff auf die entscheidenden Schlüssel hat. Dies mitigiert CLOUD-Act-Exposition (siehe Eintrag #8 Drittlandtransfer).

- Ist BYOK + EU-HSM ein rechtlich anerkannter „zusätzlicher Schutzmaßnahmen"-Baustein im Sinne des EDPB Supplementary-Measures-Katalogs?
- Welche Dokumentationspflichten ergeben sich?

### Frage 6 — Rechtsprechungs-Risiko

Deutsche Obergerichte haben Crypto-Shredding bisher nicht adressiert (Stand April 2026).

- Welche **Risikoklasse** ordnen Sie der Art. 18-Einordnung zu (gering / mittel / hoch)?
- Gibt es aus Ihrer Kanzlei-Praxis Erfahrungsberichte mit Aufsichtsbehörden-Anfragen zu vergleichbaren Konstellationen?

### Frage 7 — Dokumentations-Pflicht (Rechenschaftspflicht Art. 5 Abs. 2)

Welche Dokumente müssen zwingend vorliegen, um die gewählte Einordnung nachweisen zu können? Unser derzeitiger Entwurf:

- schriftliches Löschkonzept mit Art. 18-Rahmung,
- DSFA für das Crypto-Shredding-Verfahren,
- TOMs als Anlage zum AVV,
- Dokumentation jedes Shredding-Ereignisses im Audit-Log (Hash-Chain),
- Verweis auf diese Datei (`crypto-shredding-rechtliche-einordnung.md`) mit Fachanwalts-Freigabe.

Fehlt etwas Wesentliches?

---

## 4. Technische Kurzbeschreibung (für den Fachanwalt)

| Aspekt | Umsetzung |
|---|---|
| Verschlüsselung | AES-256-GCM, ein Key pro betroffener Person (key-per-subject) |
| Schlüsselverwaltung | Key Management System (KMS) mit EU-gehostetem HSM, BYOK |
| Schlüssel-Trennung | Schlüssel und Chiffrat liegen in getrennten Systemen mit unterschiedlichen Zugriffsrollen |
| Vernichtungs-Verfahren | KMS-Befehl `scheduleKeyDeletion` mit 7-Tage-Grace-Period als Sicherheitspuffer |
| Nachweis der Vernichtung | KMS-Protokoll + internes Audit-Event `PersonDataCryptoShredded` in unveränderlicher Hash-Chain |
| Zielgruppe der Maßnahme | nur echte personenbezogene Daten (PII); Buchungssalden, Beträge, Konten-IDs bleiben im Klartext |

---

## 5. Zeitplan und Entscheidungslogik

| Meilenstein | Datum | Status |
|---|---|---|
| Fachreview intern, vier Korrekturen im Glossar | 2026-04-22 | ✅ erledigt |
| Erstellung dieser Frageliste | 2026-04-22 | ✅ erledigt |
| Mandatierung Fachanwalt | offen | 🔴 |
| Antwort + schriftliche Freigabe oder Anpassungsempfehlung | offen | 🔴 |
| Einarbeitung der Rückmeldung in Glossar-Eintrag #6 | offen | 🔴 |
| Freigabe für Produktivstart Crypto-Shredding | offen | 🔴 — Release-Blocker |

**Solange dieses Dokument offen ist, ist kein Produktiv-Einsatz von Crypto-Shredding zulässig.**

---

## 6. Referenzen und weiterführende Dokumente

- Glossar-Eintrag: [`09-dsgvo-compliance.md` § 6 — Löschkonzept / Crypto-Shredding](../glossar/09-dsgvo-compliance.md#6-löschkonzept--crypto-shredding)
- Verwandte Einträge:
  - [`09-dsgvo-compliance.md` § 5 — Betroffenenrechte](../glossar/09-dsgvo-compliance.md#5-betroffenenrechte--art-1223-dsgvo)
  - [`09-dsgvo-compliance.md` § 7 — Pseudonymisierung vs. Anonymisierung](../glossar/09-dsgvo-compliance.md#7-pseudonymisierung-vs-anonymisierung--art-4-nr-5-dsgvo--erwägungsgrund-26)
  - [`09-dsgvo-compliance.md` § 8 — Drittlandtransfer](../glossar/09-dsgvo-compliance.md#8-drittlandtransfer--art-4450-dsgvo)
- Normen: Art. 17, 18, 25, 32, 33, 34 DSGVO; § 147 AO; § 257 HGB; GoBD-Rz. 119–142
- Standards: NIST SP 800-88 Rev. 1 (Cryptographic Erase), BSI TR-02102-1, FIPS 197, ENISA Pseudonymisation techniques 2019

---

## 7. Nach Freigabe — Checkliste

Bei positiver Fachanwalts-Freigabe:

- [ ] Freigabe-Vermerk mit Datum und Kanzlei-Name oben in diesem Dokument ergänzen
- [ ] Status-Header auf ✅ umstellen
- [ ] Glossar-Eintrag #6 um Fußnote „juristisch gegengeprüft am …" ergänzen
- [ ] Produktiv-Freigabe Crypto-Shredding als Ticket im Backlog schließen
- [ ] In `09-dsgvo-compliance.md` Status von 🟡 DRAFT auf ✅ FEST setzen (als Teil der Sprint-1-Schließung)

Bei Anpassungsbedarf:

- [ ] Empfehlungen als Diff im Glossar-Eintrag #6 umsetzen
- [ ] Ggf. TOMs (§ 3) und DSFA (§ 4) anpassen
- [ ] Neue Version zur zweiten Gegenprüfung einreichen
