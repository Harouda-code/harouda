// Jahresabschluss-E1 / Schritt 1 · clients-API mit Stammdaten-Erweiterung.

import { describe, it, expect, beforeEach } from "vitest";
import { createClient, updateClient, fetchClients } from "../clients";
import type { Geschaeftsfuehrer } from "../../types/db";

beforeEach(() => {
  localStorage.clear();
});

describe("clients · Rechtsform + HGB-Stammdaten (DEMO)", () => {
  it("createClient mit rechtsform=NULL (Bestands-Default): Roundtrip OK", async () => {
    const c = await createClient({
      mandant_nr: "10100",
      name: "Test GmbH",
    });
    expect(c.rechtsform).toBeNull();
    expect(c.hrb_nummer).toBeNull();
    expect(c.hrb_gericht).toBeNull();
    expect(c.gezeichnetes_kapital).toBeNull();
    expect(c.geschaeftsfuehrer).toBeNull();
    expect(c.wirtschaftsjahr_beginn).toBe("01-01");
    expect(c.wirtschaftsjahr_ende).toBe("12-31");
  });

  it("createClient GmbH: alle neuen Stammdaten-Felder persistieren", async () => {
    const gfs: Geschaeftsfuehrer[] = [
      { name: "Dr. Max Kühn", funktion: "geschaeftsfuehrer", bestellt_am: "2020-05-01" },
      { name: "Anna Schmidt", funktion: "prokurist" },
    ];
    const c = await createClient({
      mandant_nr: "10200",
      name: "Kühn GmbH",
      rechtsform: "GmbH",
      hrb_nummer: "HRB 12345",
      hrb_gericht: "Amtsgericht München",
      gezeichnetes_kapital: 25000,
      geschaeftsfuehrer: gfs,
      wirtschaftsjahr_beginn: "07-01",
      wirtschaftsjahr_ende: "06-30",
    });
    expect(c.rechtsform).toBe("GmbH");
    expect(c.hrb_nummer).toBe("HRB 12345");
    expect(c.hrb_gericht).toBe("Amtsgericht München");
    expect(c.gezeichnetes_kapital).toBe(25000);
    expect(c.geschaeftsfuehrer).toEqual(gfs);
    expect(c.wirtschaftsjahr_beginn).toBe("07-01");
    expect(c.wirtschaftsjahr_ende).toBe("06-30");
  });

  it("createClient Einzelunternehmen: rechtsform gesetzt, HRB/Kapital bleiben NULL", async () => {
    const c = await createClient({
      mandant_nr: "20100",
      name: "Einzelkaufmann",
      rechtsform: "Einzelunternehmen",
    });
    expect(c.rechtsform).toBe("Einzelunternehmen");
    expect(c.hrb_nummer).toBeNull();
    expect(c.gezeichnetes_kapital).toBeNull();
  });

  it("updateClient kann rechtsform nachträglich setzen", async () => {
    const c = await createClient({
      mandant_nr: "30100",
      name: "Bestandsmandant",
    });
    expect(c.rechtsform).toBeNull();
    const updated = await updateClient(c.id, {
      rechtsform: "UG",
      gezeichnetes_kapital: 1,
    });
    expect(updated.rechtsform).toBe("UG");
    expect(updated.gezeichnetes_kapital).toBe(1);
    // Persistenz im Store.
    const list = await fetchClients();
    expect(list.find((x) => x.id === c.id)?.rechtsform).toBe("UG");
  });

  it("updateClient mit geschaeftsfuehrer-Array überschreibt komplett", async () => {
    const c = await createClient({
      mandant_nr: "40100",
      name: "GF-Test",
      rechtsform: "GmbH",
      geschaeftsfuehrer: [{ name: "Alt-GF", funktion: "geschaeftsfuehrer" }],
    });
    const updated = await updateClient(c.id, {
      geschaeftsfuehrer: [
        { name: "Neu-GF 1", funktion: "geschaeftsfuehrer" },
        { name: "Neu-GF 2", funktion: "vorstand" },
      ],
    });
    expect(updated.geschaeftsfuehrer).toHaveLength(2);
    expect(updated.geschaeftsfuehrer?.[0].name).toBe("Neu-GF 1");
  });

  it("Wirtschaftsjahr-Defaults greifen, wenn Caller sie nicht angibt", async () => {
    const c = await createClient({
      mandant_nr: "50100",
      name: "Default-WJ",
      rechtsform: "GmbH",
    });
    expect(c.wirtschaftsjahr_beginn).toBe("01-01");
    expect(c.wirtschaftsjahr_ende).toBe("12-31");
  });
});
