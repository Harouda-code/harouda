// Tests für CSV-Parser des Journal-Imports.
//
// Deckt ab: Header-Validierung (7- und 8-Spalten-Varianten), deutsches
// Zahlen- und Datumsformat, Pflichtfelder, ust_satz-Whitelist,
// 60-Zeichen-Warnung (kein Error), BOM, CRLF-Zeilenenden, leere Datei,
// identische Soll/Haben-Konten, Decimal-Präzision, Kostenstelle (mit und
// ohne Spalte), Fiscal-Year-Check (positiv/negativ, kein Kontext).

import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import {
  buildSampleCsv,
  EXPECTED_HEADER,
  EXPECTED_HEADER_WITH_KOSTENSTELLE,
  EXPECTED_HEADER_WITH_KOSTENTRAEGER,
  EXPECTED_HEADER_WITH_SKONTO,
  parseGermanDate,
  parseGermanNumber,
  parseJournalCsv,
} from "../csvImport";

const HEADER_7 = EXPECTED_HEADER.join(";");
const HEADER_8 = EXPECTED_HEADER_WITH_KOSTENSTELLE.join(";");
const HEADER_9 = EXPECTED_HEADER_WITH_KOSTENTRAEGER.join(";");
const HEADER_11 = EXPECTED_HEADER_WITH_SKONTO.join(";");

function makeCsv7(...dataLines: string[]): string {
  return [HEADER_7, ...dataLines].join("\r\n") + "\r\n";
}

function makeCsv8(...dataLines: string[]): string {
  return [HEADER_8, ...dataLines].join("\r\n") + "\r\n";
}

function makeCsv9(...dataLines: string[]): string {
  return [HEADER_9, ...dataLines].join("\r\n") + "\r\n";
}

describe("parseGermanDate", () => {
  it("parst gültiges DD.MM.YYYY in ISO", () => {
    expect(parseGermanDate("02.01.2025")).toBe("2025-01-02");
    expect(parseGermanDate("31.12.2025")).toBe("2025-12-31");
  });

  it("lehnt offensichtlich ungültige Datumsangaben ab", () => {
    expect(parseGermanDate("31.02.2025")).toBeNull(); // Februar hat 31 nicht
    expect(parseGermanDate("00.01.2025")).toBeNull();
    expect(parseGermanDate("32.01.2025")).toBeNull();
    expect(parseGermanDate("01.13.2025")).toBeNull();
    expect(parseGermanDate("2025-01-02")).toBeNull();
    expect(parseGermanDate("nonsense")).toBeNull();
  });
});

describe("parseGermanNumber — Decimal-Rückgabe", () => {
  it("parst Standard-Dezimalkomma als Decimal", () => {
    const d = parseGermanNumber("1234,56");
    expect(d).not.toBeNull();
    expect(d!.toNumber()).toBe(1234.56);
  });

  it("parst Tausenderpunkt plus Dezimalkomma", () => {
    expect(parseGermanNumber("1.234,56")!.toNumber()).toBe(1234.56);
    expect(parseGermanNumber("1.234.567,89")!.toNumber()).toBe(1234567.89);
  });

  it("parst Ganzzahlen ohne Komma", () => {
    expect(parseGermanNumber("42")!.toNumber()).toBe(42);
    expect(parseGermanNumber("1.000")!.toNumber()).toBe(1000);
  });

  it("erhält Präzision jenseits von IEEE-754-Float-Genauigkeit", () => {
    // Klassischer Float-Drift-Test: 0.1 + 0.2 !== 0.3 in number, aber in Decimal.
    const a = parseGermanNumber("0,1");
    const b = parseGermanNumber("0,2");
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    const sum = a!.plus(b!);
    expect(sum.toString()).toBe("0.3");
    // Gegentest mit JS-number zur Dokumentation der Motivation
    expect(0.1 + 0.2).not.toBe(0.3);
  });

  it("lehnt US-Format (Punkt als Dezimaltrenner) ab", () => {
    expect(parseGermanNumber("1234.56")).toBeNull();
  });

  it("lehnt offensichtlich falsche Formate ab", () => {
    expect(parseGermanNumber("")).toBeNull();
    expect(parseGermanNumber("abc")).toBeNull();
    expect(parseGermanNumber("1,2,3")).toBeNull();
  });
});

describe("parseJournalCsv — Happy Path (7-Spalten-Header)", () => {
  it("parst 3 gültige Zeilen, keine Fehler, keine Warnungen", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnungsbilanz BGA;0",
      "15.01.2025;AR-001;1400;8400;1000,00;Rechnung Kunde 10001;19",
      "31.03.2025;LG-Q1;4120;1200;3500,00;Gehalt Q1;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
    expect(res.rows).toHaveLength(3);
    expect(res.rows[0].datum).toBe("2025-01-02");
    expect(res.rows[0].betrag.toNumber()).toBe(20000);
    expect(res.rows[0].ust_satz).toBe(0);
    expect(res.rows[0].kostenstelle).toBeNull();
    expect(res.rows[1].ust_satz).toBe(19);
    expect(res.rows[1].betrag.toNumber()).toBe(1000);
    expect(res.rows[2].beleg_nr).toBe("LG-Q1");
  });

  it("toleriert BOM am Dateianfang", () => {
    const csv = "\uFEFF" + makeCsv7(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
  });

  it("toleriert gemischte LF-/CRLF-Zeilenenden und trailing newlines", () => {
    const csv =
      HEADER_7 + "\n" +
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0\r\n" +
      "15.01.2025;AR-001;1400;8400;1000,00;Rechnung;19\n\n";
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(2);
  });
});

describe("parseJournalCsv — Kostenstelle (8-Spalten-Header)", () => {
  it("parst 8-Spalten-Header mit gefüllter und leerer Kostenstelle", () => {
    const csv = makeCsv8(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0;",
      "15.01.2025;AR-001;1400;8400;1000,00;Rechnung;19;KST-VERTRIEB"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0].kostenstelle).toBeNull();
    expect(res.rows[1].kostenstelle).toBe("KST-VERTRIEB");
  });

  it("ist rückwärtskompatibel: 7-Spalten-Header funktioniert weiter", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].kostenstelle).toBeNull();
  });

  it("lehnt 8-Spalten-Zeile in 7-Spalten-Datei ab", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0;Extra-Spalte"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.rows).toHaveLength(0);
  });
});

describe("parseJournalCsv — Kostenträger (9-Spalten-Header)", () => {
  it("parst 9-Spalten-Header mit KST und KTR unabhängig gesetzt", () => {
    const csv = makeCsv9(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0;;",
      "15.01.2025;AR-001;1400;8400;1000,00;Rechnung;19;KST-VERTRIEB;",
      "10.02.2025;ER-001;3400;1600;500,00;Wareneingang Projekt X;19;;PROJ-X",
      "20.03.2025;AR-002;1400;8400;2000,00;Beide gesetzt;19;KST-VERW;PROJ-INTERN"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(4);
    expect(res.rows[0].kostenstelle).toBeNull();
    expect(res.rows[0].kostentraeger).toBeNull();
    expect(res.rows[1].kostenstelle).toBe("KST-VERTRIEB");
    expect(res.rows[1].kostentraeger).toBeNull();
    expect(res.rows[2].kostenstelle).toBeNull();
    expect(res.rows[2].kostentraeger).toBe("PROJ-X");
    expect(res.rows[3].kostenstelle).toBe("KST-VERW");
    expect(res.rows[3].kostentraeger).toBe("PROJ-INTERN");
  });

  it("ist rückwärtskompatibel: 7- und 8-Spalten-Header liefern kostentraeger=null", () => {
    const csv7 = makeCsv7("02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0");
    const res7 = parseJournalCsv(csv7);
    expect(res7.errors).toHaveLength(0);
    expect(res7.rows[0].kostenstelle).toBeNull();
    expect(res7.rows[0].kostentraeger).toBeNull();

    const csv8 = makeCsv8("15.01.2025;AR-001;1400;8400;1000,00;R;19;KST-A");
    const res8 = parseJournalCsv(csv8);
    expect(res8.errors).toHaveLength(0);
    expect(res8.rows[0].kostenstelle).toBe("KST-A");
    expect(res8.rows[0].kostentraeger).toBeNull();
  });

  it("lehnt 10 Spalten in 9-Spalten-Datei ab", () => {
    const csv = makeCsv9(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0;KST;KTR;Zuviel"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.rows).toHaveLength(0);
  });

  it("EXPECTED_HEADER_WITH_KOSTENTRAEGER endet mit kostentraeger", () => {
    expect(
      EXPECTED_HEADER_WITH_KOSTENTRAEGER[
        EXPECTED_HEADER_WITH_KOSTENTRAEGER.length - 1
      ]
    ).toBe("kostentraeger");
    expect(EXPECTED_HEADER_WITH_KOSTENTRAEGER).toHaveLength(9);
  });
});

describe("parseJournalCsv — Skonto-Spalten (11-Spalten-Header, Sprint 5)", () => {
  function makeCsv11(...dataLines: string[]): string {
    return [HEADER_11, ...dataLines].join("\r\n") + "\r\n";
  }

  it("erkennt 11-Spalten-Header und übernimmt skonto_pct/skonto_tage", () => {
    const csv = makeCsv11(
      "15.01.2025;AR-002;1400;8400;20000,00;Rechnung Skonto;19;KST-VERTRIEB;;2;14"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].skonto_pct).toBe(2);
    expect(res.rows[0].skonto_tage).toBe(14);
    expect(res.rows[0].kostenstelle).toBe("KST-VERTRIEB");
    expect(res.rows[0].kostentraeger).toBeNull();
  });

  it("leere Skonto-Felder → beide null", () => {
    const csv = makeCsv11(
      "15.01.2025;AR-001;1400;8400;1000,00;Ohne Skonto;19;;;;"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows[0].skonto_pct).toBeNull();
    expect(res.rows[0].skonto_tage).toBeNull();
  });

  it("nur skonto_pct gesetzt, skonto_tage leer → Warning + beide null", () => {
    const csv = makeCsv11(
      "15.01.2025;AR-003;1400;8400;1000,00;Inkonsistent;19;;;3;"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0].message).toMatch(/skonto_pct und skonto_tage/);
    expect(res.rows[0].skonto_pct).toBeNull();
    expect(res.rows[0].skonto_tage).toBeNull();
  });

  it("skonto_pct ungültig (Buchstaben) → Fehler", () => {
    const csv = makeCsv11(
      "15.01.2025;AR-004;1400;8400;1000,00;Bad Skonto;19;;;abc;14"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.some((e) => e.field === "skonto_pct")).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("skonto_tage negativ → Fehler", () => {
    const csv = makeCsv11(
      "15.01.2025;AR-005;1400;8400;1000,00;Bad Tage;19;;;2;-5"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.some((e) => e.field === "skonto_tage")).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("EXPECTED_HEADER_WITH_SKONTO hat 11 Spalten und endet mit skonto_tage", () => {
    expect(EXPECTED_HEADER_WITH_SKONTO).toHaveLength(11);
    expect(
      EXPECTED_HEADER_WITH_SKONTO[EXPECTED_HEADER_WITH_SKONTO.length - 1]
    ).toBe("skonto_tage");
  });
});

describe("parseJournalCsv — Fiscal-Year-Check", () => {
  const options = {
    currentFiscalYear: { von: "2025-01-01", bis: "2025-12-31" },
    previousFiscalYear: { von: "2024-01-01", bis: "2024-12-31" },
  };

  it("akzeptiert Datum im aktuellen Geschäftsjahr", () => {
    const csv = makeCsv7(
      "15.06.2025;AR-001;1400;8400;1000,00;Test;19"
    );
    const res = parseJournalCsv(csv, options);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
  });

  it("akzeptiert Datum im vorherigen Geschäftsjahr", () => {
    const csv = makeCsv7(
      "15.06.2024;AR-001;1400;8400;1000,00;Nachtrag Vorperiode;19"
    );
    const res = parseJournalCsv(csv, options);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
  });

  it("lehnt Datum VOR dem zulässigen Zeitraum ab", () => {
    const csv = makeCsv7(
      "15.06.2023;AR-001;1400;8400;1000,00;Zu alt;19"
    );
    const res = parseJournalCsv(csv, options);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].field).toBe("datum");
    expect(res.errors[0].message).toContain("außerhalb des zulässigen Zeitraums");
    expect(res.rows).toHaveLength(0);
  });

  it("lehnt Datum NACH dem zulässigen Zeitraum ab", () => {
    const csv = makeCsv7(
      "15.06.2026;AR-001;1400;8400;1000,00;Zu neu;19"
    );
    const res = parseJournalCsv(csv, options);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].field).toBe("datum");
    expect(res.rows).toHaveLength(0);
  });

  it("ohne Fiscal-Year-Optionen wird keine Zeitraums-Prüfung durchgeführt", () => {
    const csv = makeCsv7(
      "15.06.2015;AR-001;1400;8400;1000,00;Theoretisch alt;19"
    );
    const res = parseJournalCsv(csv); // keine Optionen
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
  });

  it("akzeptiert exakte Grenz-Daten 01.01. und 31.12.", () => {
    const csv = makeCsv7(
      "01.01.2024;A;1400;8400;1,00;Start Vorjahr;19",
      "31.12.2024;B;1400;8400;1,00;Ende Vorjahr;19",
      "01.01.2025;C;1400;8400;1,00;Start Aktuell;19",
      "31.12.2025;D;1400;8400;1,00;Ende Aktuell;19"
    );
    const res = parseJournalCsv(csv, options);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(4);
  });
});

describe("parseJournalCsv — Validierungen", () => {
  it("leere Datei → ein Fehler, keine Zeilen", () => {
    const res = parseJournalCsv("");
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toContain("leer");
    expect(res.rows).toHaveLength(0);
  });

  it("falsche Header-Spalten → Fehler mit Zeilennummer 1", () => {
    const csv =
      "Datum;Beleg;Soll;Haben;Betrag;Text;USt\r\n" +
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0";
    const res = parseJournalCsv(csv);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors.every((e) => e.line === 1)).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("falsche Spaltenanzahl in Datenzeile → Fehler, Rest wird weiter geparst", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;20000,00;Eröffnung;0", // ok
      "15.01.2025;AR-001;1400;8400", // nur 4 Spalten
      "31.03.2025;LG-Q1;4120;1200;3500,00;Gehalt;0" // ok
    );
    const res = parseJournalCsv(csv);
    expect(res.rows).toHaveLength(2);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].line).toBe(3);
  });

  it("ungültiges Datum → rowlevel error, Zeile wird NICHT in rows aufgenommen", () => {
    const csv = makeCsv7(
      "31.02.2025;EB-001;0440;9000;20000,00;Eröffnung;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].field).toBe("datum");
    expect(res.rows).toHaveLength(0);
  });

  it("negativer oder Null-Betrag → Fehler", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;-100,00;Negativ;0",
      "15.01.2025;EB-002;0440;9000;0,00;Null;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
    expect(res.rows).toHaveLength(0);
  });

  it("Betrag mit Punkt statt Komma (US-Format) wird abgelehnt", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;1234.56;Falsches Format;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.some((e) => e.field === "betrag")).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("identische Soll- und Haben-Konten → Fehler", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;1200;1200;100,00;Blödsinn;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.some((e) => e.message.includes("identisch"))).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("ust_satz außerhalb {0,7,19} → Fehler", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;100,00;Test;16"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.some((e) => e.field === "ust_satz")).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("beschreibung > 60 Zeichen → Warning (kein Error), Zeile WIRD importiert", () => {
    const longText =
      "Diese Beschreibung ist absichtlich länger als sechzig Zeichen um die Warnung zu testen";
    expect(longText.length).toBeGreaterThan(60);
    const csv = makeCsv7(
      `02.01.2025;EB-001;0440;9000;100,00;${longText};0`
    );
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0].field).toBe("beschreibung");
    expect(res.rows).toHaveLength(1);
  });

  it("leere beschreibung → Error", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;100,00;;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.errors.some((e) => e.field === "beschreibung")).toBe(true);
    expect(res.rows).toHaveLength(0);
  });

  it("Header nur, keine Datenzeilen → leere rows + informative Warning", () => {
    const csv = HEADER_7 + "\r\n";
    const res = parseJournalCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0].message).toContain("keine Datenzeilen");
  });
});

describe("Präzision und Decimal-Konsistenz", () => {
  it("betrag bleibt ein Decimal-Objekt mit exaktem String", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;0,10;Test;0",
      "02.01.2025;EB-002;0440;9000;0,20;Test;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.rows).toHaveLength(2);
    const sum = res.rows[0].betrag.plus(res.rows[1].betrag);
    expect(sum).toBeInstanceOf(Decimal);
    expect(sum.toString()).toBe("0.3");
  });

  it("grosse Beträge mit Tausenderpunkten bleiben exakt", () => {
    const csv = makeCsv7(
      "02.01.2025;EB-001;0440;9000;1.234.567,89;Grosser Betrag;0"
    );
    const res = parseJournalCsv(csv);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].betrag.toString()).toBe("1234567.89");
  });
});

describe("buildSampleCsv", () => {
  it("erzeugt parsbare Muster-CSV mit 9-Spalten-Header (KST + KTR), 4 Zeilen", () => {
    const sample = buildSampleCsv();
    const res = parseJournalCsv(sample);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(4);
    expect(res.rows[0].beleg_nr).toBe("EB-001");
    expect(res.rows[0].kostenstelle).toBeNull();
    expect(res.rows[0].kostentraeger).toBeNull();
    expect(res.rows[1].ust_satz).toBe(19);
    expect(res.rows[1].kostenstelle).toBe("KST-VERTRIEB");
    expect(res.rows[1].kostentraeger).toBeNull();
    expect(res.rows[2].kostenstelle).toBeNull();
    expect(res.rows[2].kostentraeger).toBe("PROJ-2025-X");
    expect(res.rows[3].kostenstelle).toBe("KST-VERWALTUNG");
    expect(res.rows[3].kostentraeger).toBe("PROJ-INTERN");
  });
});
