// Sprint 17 / Schritt 3 · kontoKategorien-Tests.

import { describe, it, expect } from "vitest";
import {
  BESTANDSVERAENDERUNG_KONTO_RANGES,
  detectDominantKontenrahmen,
  filterAusserordentlicherAufwandAccounts,
  filterBestandsveraenderungAccounts,
  filterVorratAccounts,
  VORRAT_KONTO_RANGES,
} from "../kontoKategorien";
import type { Account } from "../../../types/db";

function acc(
  konto_nr: string,
  skr: Account["skr"] = "SKR03",
  is_active = true
): Account {
  return {
    id: `a-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie: "aktiva",
    ust_satz: null,
    skr,
    is_active,
  };
}

describe("kontoKategorien · Ranges", () => {
  it("#1 VORRAT_KONTO_RANGES hat SKR03 + SKR04 mit mind. 2 Ranges", () => {
    expect(VORRAT_KONTO_RANGES.SKR03.length).toBeGreaterThanOrEqual(2);
    expect(VORRAT_KONTO_RANGES.SKR04.length).toBeGreaterThanOrEqual(2);
  });

  it("#2 BESTANDSVERAENDERUNG_KONTO_RANGES hat beide SKRs", () => {
    expect(BESTANDSVERAENDERUNG_KONTO_RANGES.SKR03.length).toBeGreaterThan(0);
    expect(BESTANDSVERAENDERUNG_KONTO_RANGES.SKR04.length).toBeGreaterThan(0);
  });
});

describe("kontoKategorien · filterVorratAccounts", () => {
  it("#3 SKR04 1080 Fertigerzeugnisse → in Vorrat-Liste", () => {
    const r = filterVorratAccounts(
      [acc("1080", "SKR04"), acc("4800", "SKR04")],
      "SKR04"
    );
    expect(r).toHaveLength(1);
    expect(r[0].konto_nr).toBe("1080");
  });

  it("#4 SKR03 0980 Vorraete → in Vorrat-Liste", () => {
    const r = filterVorratAccounts(
      [acc("0980"), acc("3960"), acc("3200")],
      "SKR03"
    );
    const konten = r.map((a) => a.konto_nr).sort();
    expect(konten).toContain("0980");
    expect(konten).toContain("3200"); // in 3000-3999-Range
  });

  it("#5 Account aus anderem SKR wird gefiltert aus", () => {
    const r = filterVorratAccounts(
      [acc("1080", "SKR04"), acc("3960", "SKR03")],
      "SKR04"
    );
    expect(r.map((a) => a.konto_nr)).toEqual(["1080"]);
  });

  it("#6 Inaktiver Account wird gefiltert aus", () => {
    const r = filterVorratAccounts(
      [acc("1080", "SKR04", false), acc("1090", "SKR04", true)],
      "SKR04"
    );
    expect(r.map((a) => a.konto_nr)).toEqual(["1090"]);
  });
});

describe("kontoKategorien · filterBestandsveraenderungAccounts", () => {
  it("#7 SKR04 4800 → in Bestandsveraenderungs-Liste", () => {
    const r = filterBestandsveraenderungAccounts(
      [acc("4800", "SKR04"), acc("1080", "SKR04")],
      "SKR04"
    );
    expect(r.map((a) => a.konto_nr)).toEqual(["4800"]);
  });

  it("#8 SKR03 3960 → in Bestandsveraenderungs-Liste", () => {
    const r = filterBestandsveraenderungAccounts(
      [acc("3960"), acc("8990"), acc("0980")],
      "SKR03"
    );
    const ks = r.map((a) => a.konto_nr).sort();
    expect(ks).toContain("3960");
    expect(ks).toContain("8990");
    expect(ks).not.toContain("0980");
  });
});

describe("kontoKategorien · filterAusserordentlicherAufwandAccounts", () => {
  it("#9 SKR04 6900 → in Aufwand-Liste (fuer Anlagen-Abgang)", () => {
    const r = filterAusserordentlicherAufwandAccounts(
      [acc("6900", "SKR04"), acc("1080", "SKR04")],
      "SKR04"
    );
    expect(r.map((a) => a.konto_nr)).toEqual(["6900"]);
  });

  it("#10 SKR03 2400 → in Aufwand-Liste", () => {
    const r = filterAusserordentlicherAufwandAccounts(
      [acc("2400"), acc("4980")],
      "SKR03"
    );
    expect(r.map((a) => a.konto_nr).sort()).toEqual(["2400", "4980"]);
  });
});

describe("kontoKategorien · detectDominantKontenrahmen", () => {
  it("#11 Nur SKR03-Konten → kontenrahmen=SKR03", () => {
    const r = detectDominantKontenrahmen([acc("1000"), acc("2000")]);
    expect(r.kontenrahmen).toBe("SKR03");
    expect(r.warning).toBeUndefined();
  });

  it("#12 Nur SKR04-Konten → kontenrahmen=SKR04", () => {
    const r = detectDominantKontenrahmen([
      acc("1000", "SKR04"),
      acc("2000", "SKR04"),
    ]);
    expect(r.kontenrahmen).toBe("SKR04");
  });

  it("#13 Leere Liste → SKR03-Default + warning", () => {
    const r = detectDominantKontenrahmen([]);
    expect(r.kontenrahmen).toBe("SKR03");
    expect(r.warning).toBeDefined();
  });
});
