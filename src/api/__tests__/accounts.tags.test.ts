// Phase 3 / Schritt 6 · accounts-API mit tags-Durchreichung (DEMO-Pfad).
// Verifiziert: createAccount/updateAccount durchreichen das tags-Feld
// ohne Verlust, Default-Tag-Ableitung via SKR03_SEED-Import ist
// aktiviert (importSkr03Chart schreibt Tags).

import { describe, it, expect, beforeEach } from "vitest";
import {
  createAccount,
  updateAccount,
  fetchAccounts,
  importSkr03Chart,
} from "../accounts";
import { store } from "../store";

beforeEach(() => {
  localStorage.clear();
});

describe("accounts · tags-Durchreichung (DEMO)", () => {
  it("createAccount akzeptiert tags und persistiert sie", async () => {
    const acc = await createAccount({
      konto_nr: "4110",
      bezeichnung: "Gehälter (Custom)",
      kategorie: "aufwand",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: ["anlage-g:personal", "anlage-s:personal"],
    });
    expect(acc.tags).toEqual(["anlage-g:personal", "anlage-s:personal"]);
    const fromStore = store.getAccounts().find((a) => a.id === acc.id);
    expect(fromStore?.tags).toEqual([
      "anlage-g:personal",
      "anlage-s:personal",
    ]);
  });

  it("createAccount ohne tags → undefined in Store (nicht Array)", async () => {
    const acc = await createAccount({
      konto_nr: "1400",
      bezeichnung: "Custom Forderungen",
      kategorie: "aktiva",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
    });
    expect(acc.tags).toBeUndefined();
  });

  it("updateAccount kann tags überschreiben", async () => {
    const acc = await createAccount({
      konto_nr: "4210",
      bezeichnung: "Miete",
      kategorie: "aufwand",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
      tags: ["anlage-g:raum"],
    });
    const updated = await updateAccount(acc.id, {
      tags: ["anlage-g:raum", "anlage-s:raum"],
    });
    expect(updated.tags).toEqual(["anlage-g:raum", "anlage-s:raum"]);
  });

  it("importSkr03Chart seedt Konten mit Default-Tags aus Range-Mapping", async () => {
    const res = await importSkr03Chart();
    expect(res.inserted).toBeGreaterThan(100);
    const all = await fetchAccounts();
    // 4110 ist im SKR03_SEED als "Löhne" — muss nach Seed beide
    // Personal-Tags tragen.
    const konto4110 = all.find((a) => a.konto_nr === "4110");
    expect(konto4110).toBeDefined();
    expect(konto4110?.tags).toEqual(
      expect.arrayContaining(["anlage-g:personal", "anlage-s:personal"])
    );
    // 8400 (Erlöse 19 %) muss G:umsaetze + S:honorare tragen.
    const konto8400 = all.find((a) => a.konto_nr === "8400");
    expect(konto8400?.tags).toEqual(
      expect.arrayContaining(["anlage-g:umsaetze", "anlage-s:honorare"])
    );
    // 1200 (Bank) bekommt keine Tags — existiert im SKR03_SEED, aber
    // kein Range-Mapping passt. Tags-Array also leer ([]).
    const konto1200 = all.find((a) => a.konto_nr === "1200");
    expect(konto1200).toBeDefined();
    expect(konto1200?.tags).toEqual([]);
  });
});
