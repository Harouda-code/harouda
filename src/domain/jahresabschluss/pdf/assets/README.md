# PDF/A-3-Assets

**Kontext:** Jahresabschluss-E4 · PDF/A-3-Post-Processing.

## sRGB2014.icc

Die Datei `sRGB2014.icc` ist **nicht** in diesem Verzeichnis enthalten.
PDF/A-3 verlangt ein eingebettetes ICC-Color-Profil als OutputIntent.

### Download

Offizieller Download (ICC, freigegeben fuer freie Nutzung):
https://www.color.org/srgbprofiles.xalter

Datei: `sRGB2014.icc` (klein, ca. 600 Byte).

### Lizenz

ICC veroeffentlicht sRGB2014.icc unter einer Lizenz, die kostenlose
Einbettung in Software + PDF-Dokumente erlaubt
(https://www.color.org/iccprofile.xalter). Bitte vor dem Release-Build
einmal geprueft und im Projekt-Release-Notes dokumentiert.

### Platzierung

Nach Download: `sRGB2014.icc` in dieses Verzeichnis legen. Die Datei
wird zur Build-Zeit von Vite als Asset eingelesen und von
`PdfA3Converter.convertToPdfA3()` als OutputIntent injiziert.

### Ohne ICC-Profil

`convertToPdfA3()` wirft mit Fehlermeldung: "PDF/A-3-Konvertierung
benoetigt ICC-Profil — siehe `src/domain/jahresabschluss/pdf/assets/
README.md`". Das ist bewusst — ohne Profil keine PDF/A-3-Konformitaet.

### veraPDF-Validierung

PDF/A-3-Konformitaet kann nur extern via veraPDF geprueft werden.
Siehe `docs/DEPLOYMENT-VERAPDF-VALIDATION.md` fuer Setup + CLI-Nutzung.
