// Jahresabschluss-E3b / Schritt 1 · CoverPageBuilder-Tests.

import { describe, it, expect } from "vitest";
import { buildCoverPage, type CoverPageInput } from "../CoverPageBuilder";

function base(): CoverPageInput {
  return {
    firmenname: "Kühn Musterfirma",
    rechtsform: "GmbH",
    hrb_nummer: "HRB 12345",
    hrb_gericht: "München",
    steuernummer: "143/456/78901",
    geschaeftsjahr_von: "01.01.2025",
    geschaeftsjahr_bis: "31.12.2025",
    stichtag: "31.12.2025",
    groessenklasse: "klein",
    berichtsart: "Jahresabschluss",
    erstellt_am: "23.04.2026",
  };
}

describe("CoverPageBuilder", () => {
  it("#1 GmbH mit allen Feldern: Titel + Firmenname + HRB + Steuernummer im Output", () => {
    const out = buildCoverPage(base());
    const asJson = JSON.stringify(out);
    expect(asJson).toContain("JAHRESABSCHLUSS");
    expect(asJson).toContain("zum 31.12.2025");
    expect(asJson).toContain("Kühn Musterfirma GmbH");
    expect(asJson).toContain("HRB 12345");
    expect(asJson).toContain("München");
    expect(asJson).toContain("143/456/78901");
  });

  it("#2 Geschäftsjahr + Größenklasse + Erstellungs-Datum im unteren Block", () => {
    const out = buildCoverPage(base());
    const asJson = JSON.stringify(out);
    expect(asJson).toContain("01.01.2025");
    expect(asJson).toContain("31.12.2025");
    expect(asJson).toContain("Größenklasse: klein");
    expect(asJson).toContain("§ 267 HGB");
    expect(asJson).toContain("Erstellt am: 23.04.2026");
  });

  it("#3 Einzelunternehmen ohne HRB/Steuernummer: diese Zeilen entfallen", () => {
    const input: CoverPageInput = {
      ...base(),
      rechtsform: "Einzelunternehmen",
      hrb_nummer: null,
      hrb_gericht: null,
      steuernummer: null,
    };
    const out = buildCoverPage(input);
    const asJson = JSON.stringify(out);
    expect(asJson).toContain("Einzelunternehmen");
    expect(asJson).not.toContain("HRB");
    expect(asJson).not.toContain("Steuernummer:");
  });

  it("#4 Berichtsart=Entwurf: Entwurfs-Hinweis im Deckblatt-Text", () => {
    const out = buildCoverPage({ ...base(), berichtsart: "Entwurf" });
    const asJson = JSON.stringify(out);
    expect(asJson).toContain("[ENTWURF]");
    expect(asJson).toContain("Nicht zur Veroeffentlichung");
  });

  it("#5 Berichtsart=Jahresabschluss: KEIN Entwurfs-Hinweis", () => {
    const out = buildCoverPage(base());
    const asJson = JSON.stringify(out);
    expect(asJson).not.toContain("[ENTWURF]");
  });

  it("#6 Optionaler Kanzlei-Name: wenn gesetzt im Meta-Block, sonst fehlend", () => {
    const mit = buildCoverPage({ ...base(), kanzlei_name: "Kanzlei Mustermann" });
    expect(JSON.stringify(mit)).toContain("Kanzlei: Kanzlei Mustermann");
    const ohne = buildCoverPage(base());
    expect(JSON.stringify(ohne)).not.toContain("Kanzlei:");
  });

  it("#7 HRB ohne Gericht: nur Nummer ohne Klammer-Zusatz", () => {
    const out = buildCoverPage({ ...base(), hrb_gericht: null });
    const asJson = JSON.stringify(out);
    expect(asJson).toContain("HRB 12345");
    // Es darf keine leere Klammer dahinter erscheinen.
    expect(asJson).not.toContain("HRB 12345 ()");
  });

  it("#8 Trennstrich (Canvas-Line) vorhanden", () => {
    const out = buildCoverPage(base());
    const hasCanvas = out.some(
      (c) => typeof c === "object" && c !== null && "canvas" in c
    );
    expect(hasCanvas).toBe(true);
  });
});
