/**
 * Anlage EÜR 2025 — Builder.
 *
 * Liest Journal-Buchungen eines Wirtschaftsjahres und füllt die Kennzahlen
 * der BMF-Anlage EÜR 2025 nach § 4 Abs. 3 EStG.
 *
 * Spezialfälle:
 *   - Bewirtung (splitPercent=70): 70 % zu Kz 175 (abziehbar), 30 % zu
 *     Kz 228 (nicht abziehbar, § 4 Abs. 5 Nr. 2 EStG)
 *   - Geschenke: getrennt über SKR03-Konten (≤50 € → 4630-4635 → Kz 170,
 *     >50 € → 4636-4639 → Kz 228) — kein Runtime-Split nötig
 *   - Kleinunternehmer (§ 19 UStG): Netto-Einnahmen auf Kz 112 werden
 *     nach Kz 111 verschoben; vereinnahmte USt (Kz 140) entfällt
 *   - § 7g IAB: Antrag (Kz 270), Hinzurechnung (Kz 206) und Auflösung
 *     (Kz 210) werden vom Anwender als Parameter übergeben
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import {
  EUER_STRUCTURE_2025,
  EUER_BY_KZ,
  type EuerPosition,
  type EuerSection,
} from "./euerStructure";
import { findEuerRule, type EuerSource } from "./skr03EuerMapping";

export type EuerOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  wirtschaftsjahr: { von: string; bis: string };
  istKleinunternehmer: boolean;
  /** IAB § 7g Abs. 1 im aktuellen Jahr beantragt. */
  iabBeantragt?: Money;
  /** IAB-Hinzurechnung (§ 7g Abs. 2): 50 % der Anschaffungskosten im Investitionsjahr. */
  iabHinzurechnung?: Money;
  /** IAB-Auflösung (§ 7g Abs. 3) bei Nichtinvestition. */
  iabAufloesung?: Money;
};

export type EuerLineView = {
  kz: string;
  zeile: number;
  name: string;
  type: EuerPosition["type"];
  section: EuerSection;
  wert: string;
  wertRaw: Money;
  isSubtotal: boolean;
  isFinalResult: boolean;
  computation?: string;
  hgb?: string;
};

export type EuerReport = {
  wirtschaftsjahr: { von: string; bis: string };
  istKleinunternehmer: boolean;

  positionen: EuerLineView[];

  summen: {
    betriebseinnahmen: string;
    betriebsausgaben: string;
    vorlaeufigerGewinn: string;
    hinzurechnungen: string;
    nichtAbzugsfaehig: string;
    steuerlicherGewinn: string;
  };

  bewirtung: {
    gesamt: string;
    abzugsfaehig: string;
    nichtAbzugsfaehig: string;
  };

  geschenke: {
    bisGrenze: string;
    ueberGrenze: string;
  };

  investitionsabzug?: {
    beantragt: string;
    hinzugerechnet: string;
    aufgeloest: string;
  };

  unmappedAccounts: {
    kontoNr: string;
    bezeichnung: string;
    saldo: string;
    vorschlag?: string;
  }[];

  _internal: {
    betriebseinnahmen: Money;
    betriebsausgaben: Money;
    steuerlicherGewinn: Money;
    byKz: Map<string, Money>;
  };

  metadata: {
    generatedAt: string;
    formular: "BMF Anlage EÜR 2025 (nachgebildet)";
  };
};

function accountSaldo(
  kontoNr: string,
  entries: JournalEntry[]
): { soll: Money; haben: Money } {
  let soll = Money.zero();
  let haben = Money.zero();
  for (const e of entries) {
    const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
    if (e.soll_konto === kontoNr) soll = soll.plus(betrag);
    if (e.haben_konto === kontoNr) haben = haben.plus(betrag);
  }
  return { soll, haben };
}

function valueForSource(
  source: EuerSource,
  saldo: { soll: Money; haben: Money }
): Money {
  switch (source) {
    case "EINNAHME":
    case "UST":
      return saldo.haben.minus(saldo.soll);
    case "AUSGABE":
    case "VORSTEUER":
      return saldo.soll.minus(saldo.haben);
  }
}

export function buildEuer(options: EuerOptions): EuerReport {
  const { wirtschaftsjahr, istKleinunternehmer } = options;

  const entriesInYear = options.entries.filter(
    (e) =>
      e.status === "gebucht" &&
      e.datum >= wirtschaftsjahr.von &&
      e.datum <= wirtschaftsjahr.bis
  );

  // 1) Leaf-Buckets pro Kz
  const byKz = new Map<string, Money>();
  for (const def of EUER_STRUCTURE_2025) byKz.set(def.kz, Money.zero());

  // Bewirtung-Tracking für Panel
  let bewirtungGesamt = Money.zero();

  const unmappedAccounts: EuerReport["unmappedAccounts"] = [];

  // 2) Journal-Aggregation via Mapping
  for (const acc of options.accounts) {
    if (!acc.is_active) continue;
    const rule = findEuerRule(acc.konto_nr);
    if (!rule) continue;
    const saldo = accountSaldo(acc.konto_nr, entriesInYear);
    const wert = valueForSource(rule.source, saldo);
    if (wert.isZero()) continue;

    // Kleinunternehmer: Einnahmen auf Kz 112 → Kz 111 umlabeln
    let targetKz = rule.kz;
    if (istKleinunternehmer && targetKz === "112") {
      targetKz = "111";
    }

    if (rule.splitPercent != null && rule.overflowKz) {
      // BMF-Konvention (Brutto-Buchung): Kz 175 erhält den VOLLEN Betrag;
      // Kz 228 nur den nicht abziehbaren (100 − splitPercent)%-Anteil als
      // Add-back in Kz 219 = Kz 200 + Kz 228. Das verhindert Doppelzählung.
      const nichtAbzShare = wert
        .times(100 - rule.splitPercent)
        .div(100);
      byKz.set(
        targetKz,
        (byKz.get(targetKz) ?? Money.zero()).plus(wert)
      );
      byKz.set(
        rule.overflowKz,
        (byKz.get(rule.overflowKz) ?? Money.zero()).plus(nichtAbzShare)
      );
      if (rule.tag === "BEWIRTUNG") bewirtungGesamt = bewirtungGesamt.plus(wert);
      continue;
    }

    const posDef = EUER_BY_KZ.get(targetKz);
    if (!posDef) {
      unmappedAccounts.push({
        kontoNr: acc.konto_nr,
        bezeichnung: acc.bezeichnung,
        saldo: wert.toFixed2(),
        vorschlag: `Kennzahl ${targetKz} in EUER_STRUCTURE_2025 fehlt`,
      });
      continue;
    }
    byKz.set(
      targetKz,
      (byKz.get(targetKz) ?? Money.zero()).plus(wert)
    );
  }

  // Kleinunternehmer: Kz 140 (vereinnahmte USt) wird 0 — die Einnahme
  // enthält bereits den Bruttobetrag, USt ist nicht vereinnahmt.
  if (istKleinunternehmer) {
    byKz.set("140", Money.zero());
  }

  // 3) IAB § 7g (vom Anwender eingegeben, nicht aus Journal abgeleitet)
  if (options.iabBeantragt) byKz.set("270", options.iabBeantragt);
  if (options.iabHinzurechnung) byKz.set("206", options.iabHinzurechnung);
  if (options.iabAufloesung) byKz.set("210", options.iabAufloesung);

  // 4) SUBTOTAL Kz 109 (Summe Einnahmen)
  const einnahmenDef = EUER_BY_KZ.get("109")!;
  let einnahmenSum = Money.zero();
  for (const c of einnahmenDef.components ?? []) {
    einnahmenSum = einnahmenSum.plus(byKz.get(c) ?? Money.zero());
  }
  byKz.set("109", einnahmenSum);

  // 5) SUBTOTAL Kz 199 (Summe Ausgaben)
  const ausgabenDef = EUER_BY_KZ.get("199")!;
  let ausgabenSum = Money.zero();
  for (const c of ausgabenDef.components ?? []) {
    ausgabenSum = ausgabenSum.plus(byKz.get(c) ?? Money.zero());
  }
  byKz.set("199", ausgabenSum);

  // 6) Vorläufiger Gewinn Kz 200 = 109 − 199
  const vorlaeufigerGewinn = einnahmenSum.minus(ausgabenSum);
  byKz.set("200", vorlaeufigerGewinn);

  // 7) Steuerlicher Gewinn Kz 219 = 200 + 206 + 210 + 228
  const hinzu = byKz.get("206") ?? Money.zero();
  const aufl = byKz.get("210") ?? Money.zero();
  const nichtAbz = byKz.get("228") ?? Money.zero();
  const steuerlicherGewinn = vorlaeufigerGewinn
    .plus(hinzu)
    .plus(aufl)
    .plus(nichtAbz);
  byKz.set("219", steuerlicherGewinn);

  // 8) Bewirtung-Panel (aufgeschlüsselt):
  //    abzugsfähig = 70 % der gebuchten Summe; nicht abzugsfähig = 30 %.
  //    Kz 175 enthält den Brutto-Betrag (Full-Buchung), deshalb hier separat.
  const bewirtungAbzug = bewirtungGesamt.times(70).div(100);
  const bewirtungNichtAbz = bewirtungGesamt.minus(bewirtungAbzug);

  // 9) Geschenke-Panel
  const geschenkeBis = byKz.get("170") ?? Money.zero();
  // Nicht-abz. Geschenke sind in Kz 228 enthalten — wir tracken separat
  // über die Konten 4636-4639 direkt:
  let geschenkeUeber = Money.zero();
  for (const acc of options.accounts) {
    if (!acc.is_active) continue;
    const n = Number(acc.konto_nr);
    if (!Number.isFinite(n) || n < 4636 || n > 4639) continue;
    const s = accountSaldo(acc.konto_nr, entriesInYear);
    geschenkeUeber = geschenkeUeber.plus(s.soll.minus(s.haben));
  }

  // 10) Flache Positionen für UI
  const positionen: EuerLineView[] = EUER_STRUCTURE_2025.map((def) => {
    const raw = byKz.get(def.kz) ?? Money.zero();
    return {
      kz: def.kz,
      zeile: def.zeile,
      name: def.name,
      type: def.type,
      section: def.section,
      wert: raw.toFixed2(),
      wertRaw: raw,
      isSubtotal: def.type === "SUBTOTAL",
      isFinalResult: def.is_final_result === true,
      computation: def.computation,
      hgb: def.hgb_ref,
    };
  });

  const report: EuerReport = {
    wirtschaftsjahr,
    istKleinunternehmer,
    positionen,
    summen: {
      betriebseinnahmen: einnahmenSum.toFixed2(),
      betriebsausgaben: ausgabenSum.toFixed2(),
      vorlaeufigerGewinn: vorlaeufigerGewinn.toFixed2(),
      hinzurechnungen: hinzu.plus(aufl).toFixed2(),
      nichtAbzugsfaehig: nichtAbz.toFixed2(),
      steuerlicherGewinn: steuerlicherGewinn.toFixed2(),
    },
    bewirtung: {
      gesamt: bewirtungGesamt.toFixed2(),
      abzugsfaehig: bewirtungAbzug.toFixed2(),
      nichtAbzugsfaehig: bewirtungNichtAbz.toFixed2(),
    },
    geschenke: {
      bisGrenze: geschenkeBis.toFixed2(),
      ueberGrenze: geschenkeUeber.toFixed2(),
    },
    investitionsabzug:
      options.iabBeantragt || options.iabHinzurechnung || options.iabAufloesung
        ? {
            beantragt: (options.iabBeantragt ?? Money.zero()).toFixed2(),
            hinzugerechnet: (options.iabHinzurechnung ?? Money.zero()).toFixed2(),
            aufgeloest: (options.iabAufloesung ?? Money.zero()).toFixed2(),
          }
        : undefined,
    unmappedAccounts,
    _internal: {
      betriebseinnahmen: einnahmenSum,
      betriebsausgaben: ausgabenSum,
      steuerlicherGewinn,
      byKz,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      formular: "BMF Anlage EÜR 2025 (nachgebildet)",
    },
  };

  return report;
}
