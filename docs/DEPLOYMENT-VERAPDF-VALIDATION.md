# Deployment · veraPDF-Validierung fuer PDF/A-3-Archiv-Dokumente

**Erfasst:** 2026-04-23 · Jahresabschluss-E4 / Schritt 3.
**Gilt fuer:** alle PDF-Artefakte, die per „PDF/A-3"-Checkbox in
`StepReview` erzeugt werden (siehe
`src/domain/jahresabschluss/pdf/PdfA3Converter.ts`).

---

## Warum externe Validierung

`PdfA3Converter.convertToPdfA3()` setzt die Dinge, die pdf-lib API-
seitig leisten kann: Metadata, XBRL-Attachment mit `/AF`-Relationship,
ICC-Profil als embedded File, `useObjectStreams: false` fuer
PDF/A-3-kompatible Objektstruktur. Es gibt aber Eigenschaften, die
pdf-lib nicht oder nur begrenzt kann:

- Vollstaendiges XMP-Metadatenpaket nach PDF/A-3 Spec.
- Exakte `/OutputIntent`-Eintragung im Catalog.
- `pdfaid:part=3` + `pdfaid:conformance=B` Attribute im XMP.
- Font-Subsetting-Policy.

Deshalb gilt: **Jedes rechtssicher archivierte Dokument muss vor der
Uebergabe ans Archiv extern gegen veraPDF validiert werden.**

## Was ist veraPDF

veraPDF ist der Open-Source Referenz-Validator fuer PDF/A-Konformitaet.
- Projekt: https://verapdf.org
- Lizenz: MPL-2.0 / GPL-3.0 (dual).
- Sprachen: Java (CLI + GUI + REST-API).
- Unterstuetzt PDF/A-1, 2, 3 (inkl. Conformance-Level A/B/U).

## Lokales Setup (Entwickler-Workstation)

1. **Download** (Latest Release):
   https://verapdf.org/software/
   Auswahl: "veraPDF Greenfield" (aktuelle Version).
   Windows: ZIP mit eingebettetem Java-Runtime.
2. **Entpacken** nach z.B. `C:\Tools\verapdf`.
3. **Im Terminal aufrufen**:
   ```
   C:\Tools\verapdf\verapdf.bat -f 3b <datei>.pdf
   ```
   `-f 3b` = PDF/A-3 Conformance-Level B (Basic).
4. **Report** kommt als XML auf stdout. `exitcode=0` → passed,
   `exitcode=1` → failed mit Liste der Verstoesse.

## Alternativer Weg: Docker

```
docker run --rm -v "$PWD:/work" verapdf/verapdf-rest \
  verapdf -f 3b /work/Jahresabschluss-Musterfirma-2025-pdfa.pdf
```

## CI-Integration (Folge-Sprint-Kandidat)

Noch nicht eingebunden. Vorschlag fuer einen CI-Schritt in
`.github/workflows/ci.yml` (siehe §12 CLAUDE.md, aktuell noch
dormant bis das Projekt ein echtes Git-Repo ist):

```yaml
- name: Validate PDF/A-3 Artifacts
  run: |
    docker run --rm -v "$PWD:/work" verapdf/verapdf-rest \
      verapdf -f 3b -r /work/artifacts/*.pdf
```

Trigger: ein E2E-Test erzeugt ein PDF/A-3-Dokument, CI laeuft es
durch veraPDF, bricht bei Verstoessen ab.

## Manuelle Checkliste vor Archiv-Uebergabe

- [ ] Datei laeuft durch `verapdf -f 3b`.
- [ ] Keine Warnungen zu fehlendem OutputIntent.
- [ ] Keine Warnungen zu fehlenden XMP-Pflichtfeldern.
- [ ] XBRL-Attachment ist via `/AF` mit AFRelationship=Source korrekt
      angebunden.
- [ ] Producer + CreationDate korrekt gesetzt.
- [ ] Dokument oeffnet sich in Adobe Acrobat ohne Warn-Banner.

## Bekannte Probleme + geplante Upgrades

- **ICC-Profil ist derzeit als Attachment beigelegt**, nicht als
  `/OutputIntent`-Catalog-Eintrag. Das wird veraPDF als "Fehlender
  OutputIntent" markieren. Mitigation: eigener pdf-lib-Low-Level-Patch
  oder Wechsel auf pdfkit/tcpdf (spaeter).
- **XMP fehlt `pdfaid`-Namespace-Eintraege**. pdf-lib-Metadata deckt
  Basis-XMP ab, aber nicht die PDF/A-Spezifika.
- **Keine Font-Embedding-Policy**. Roboto (pdfmake-Default) ist
  embeddet, aber Subsetting-Verhalten nicht gesteuert.

Jede der drei Positionen ist ein eigener Mini-Sprint. Aktuell bewusst
verschoben, weil sie fuer die reine Funktion (Archiv-fertige-Form) nicht
blocker sind — veraPDF-CLI-Lauf als Deploy-Gate deckt sie ab.

## Kontakt

Bei Bedarf an einem veraPDF-fachlich-informierten Review:
- Siehe veraPDF-Community: https://verapdf.atlassian.net/wiki/
- Erfahrungswerte im internen Wiki (falls vorhanden) pflegen.
