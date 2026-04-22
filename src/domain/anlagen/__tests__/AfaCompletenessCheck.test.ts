// Jahresabschluss-E1 / Schritt 4 · AfaCompletenessCheck-Tests.

import { describe, it, expect, beforeEach } from "vitest";
import { detectAfaLuecken } from "../AfaCompletenessCheck";
import { createAnlagegut, saveAfaBuchung } from "../../../api/anlagen";
import { store } from "../../../api/store";

const CLIENT = "client-afa-check";

beforeEach(() => {
  localStorage.clear();
});

describe("detectAfaLuecken", () => {
  it("#1 Anlage mit kompletter AfA: keine Lücke", async () => {
    const anlage = await createAnlagegut(
      {
        inventar_nr: "INV-COMPLETE",
        bezeichnung: "Laptop",
        anschaffungsdatum: "2025-01-01",
        anschaffungskosten: 1200,
        nutzungsdauer_jahre: 3,
        afa_methode: "linear",
        konto_anlage: "0420",
        konto_afa: "4830",
      },
      CLIENT
    );
    // Volle Jahres-AfA = 400.
    await saveAfaBuchung({
      anlage_id: anlage.id,
      jahr: 2025,
      afa_betrag: 400,
      restbuchwert: 800,
      journal_entry_id: null,
    });
    const luecken = await detectAfaLuecken(CLIENT, "c-demo", 2025);
    expect(luecken.find((l) => l.anlage_id === anlage.id)).toBeUndefined();
  });

  it("#2 Anlage mit teilweise gebuchter AfA: Lücke mit Differenz", async () => {
    const anlage = await createAnlagegut(
      {
        inventar_nr: "INV-PARTIAL",
        bezeichnung: "Maschine",
        anschaffungsdatum: "2025-01-01",
        anschaffungskosten: 1200,
        nutzungsdauer_jahre: 3,
        afa_methode: "linear",
        konto_anlage: "0420",
        konto_afa: "4830",
      },
      CLIENT
    );
    // Nur Hälfte gebucht: 200 von erwarteten 400.
    await saveAfaBuchung({
      anlage_id: anlage.id,
      jahr: 2025,
      afa_betrag: 200,
      restbuchwert: 1000,
      journal_entry_id: null,
    });
    const luecken = await detectAfaLuecken(CLIENT, "c-demo", 2025);
    const l = luecken.find((x) => x.anlage_id === anlage.id);
    expect(l).toBeDefined();
    expect(l!.erwartete_afa_fuer_jahr).toBe(400);
    expect(l!.gebuchte_afa_fuer_jahr).toBe(200);
    expect(l!.differenz).toBe(200);
    expect(l!.abgeschlossen).toBe(false);
  });

  it("#3 Anlage ohne jede AfA-Buchung: Lücke = volle Jahres-AfA", async () => {
    const anlage = await createAnlagegut(
      {
        inventar_nr: "INV-ZERO",
        bezeichnung: "Nie gebucht",
        anschaffungsdatum: "2025-01-01",
        anschaffungskosten: 3000,
        nutzungsdauer_jahre: 5,
        afa_methode: "linear",
        konto_anlage: "0420",
        konto_afa: "4830",
      },
      CLIENT
    );
    const luecken = await detectAfaLuecken(CLIENT, "c-demo", 2025);
    const l = luecken.find((x) => x.anlage_id === anlage.id);
    expect(l).toBeDefined();
    // 3000 / 5 = 600 pro Jahr.
    expect(l!.erwartete_afa_fuer_jahr).toBe(600);
    expect(l!.gebuchte_afa_fuer_jahr).toBe(0);
    expect(l!.differenz).toBe(600);
  });

  it("#4 Vollständig abgeschriebene Anlage wird ignoriert", async () => {
    // Alte Anlage (5 Jahre alt, 3 Jahre Nutzungsdauer) → vollständig
    // abgeschrieben im Ziel-Jahr 2025. planAfaLauf liefert AfA=0.
    const anlage = await createAnlagegut(
      {
        inventar_nr: "INV-DONE",
        bezeichnung: "Alt-Anlage",
        anschaffungsdatum: "2020-01-01",
        anschaffungskosten: 900,
        nutzungsdauer_jahre: 3,
        afa_methode: "linear",
        konto_anlage: "0420",
        konto_afa: "4830",
      },
      CLIENT
    );
    const luecken = await detectAfaLuecken(CLIENT, "c-demo", 2025);
    expect(luecken.find((l) => l.anlage_id === anlage.id)).toBeUndefined();
  });

  it("#5 Leeres Anlagen-Universum: leeres Lücken-Array", async () => {
    store.setAnlagegueter([]);
    store.setAfaBuchungen([]);
    const luecken = await detectAfaLuecken(CLIENT, "c-demo", 2025);
    expect(luecken).toEqual([]);
  });
});
