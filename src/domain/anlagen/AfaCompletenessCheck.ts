/**
 * Detektion nicht-gebuchter AfA pro Anlagegut für ein Ziel-Jahr.
 *
 * Jahresabschluss-E1 / Schritt 4. Vergleicht den via
 * `planAfaLauf` berechneten Erwartungswert mit den tatsächlich
 * gebuchten `afa_buchungen`-Einträgen desselben Jahres.
 *
 * Rechtsbasis: § 7 EStG (Abschreibungen). GoBD-Relevanz: fehlende
 * AfA-Buchungen führen zu einer unvollständigen Abbildung des
 * tatsächlichen Wertverzehrs → Closing-Validator warnt vor
 * Steuererklärung.
 */

import type { AfaMethode } from "../../types/db";
import { fetchAnlagegueter, fetchAfaBuchungen } from "../../api/anlagen";
import { planAfaLauf } from "./AnlagenService";

export type AfaLuecke = {
  anlage_id: string;
  inventar_nr: string;
  bezeichnung: string;
  afa_methode: AfaMethode;
  /** Laut `planAfaLauf` erwarteter AfA-Betrag für das Jahr. */
  erwartete_afa_fuer_jahr: number;
  /** Tatsächlich gebuchter Betrag aus `afa_buchungen` für das Jahr. */
  gebuchte_afa_fuer_jahr: number;
  /** `erwartete_afa - gebuchte_afa`. Positiv = Lücke, 0 = komplett. */
  differenz: number;
  /** `true`, wenn die Anlage schon komplett abgeschrieben ist
   *  (Restbuchwert ≤ 0) — solche Anlagen sind keine Lücke. */
  abgeschlossen: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function detectAfaLuecken(
  mandantId: string | null,
  _companyId: string,
  jahr: number
): Promise<AfaLuecke[]> {
  const [gueter, buchungen] = await Promise.all([
    fetchAnlagegueter(mandantId),
    fetchAfaBuchungen(),
  ]);

  // Plan für das Jahr: liefert pro Anlage den erwarteten AfA-Betrag +
  // Restbuchwert nach dem Jahr. `planAfaLauf` überspringt inaktive
  // Anlagen selbst — wir iterieren die Plan-Lines.
  const plan = planAfaLauf(jahr, gueter);
  const byAnlage = new Map<string, { afa: number; rbw: number }>();
  for (const line of plan.lines) {
    byAnlage.set(line.anlage.id, {
      afa: line.afa_betrag,
      rbw: line.restbuchwert,
    });
  }

  const gebuchtProAnlage = new Map<string, number>();
  for (const b of buchungen) {
    if (b.jahr !== jahr) continue;
    gebuchtProAnlage.set(
      b.anlage_id,
      (gebuchtProAnlage.get(b.anlage_id) ?? 0) + Number(b.afa_betrag)
    );
  }

  const luecken: AfaLuecke[] = [];
  for (const anlage of gueter) {
    const planLine = byAnlage.get(anlage.id);
    if (!planLine) continue; // inaktive/abgegangene Anlage — nicht im Plan
    // Abgeschriebene Anlage (Restbuchwert = 0, AfA = 0): keine Lücke.
    const abgeschlossen =
      planLine.afa === 0 && planLine.rbw <= 0;
    const gebucht = round2(gebuchtProAnlage.get(anlage.id) ?? 0);
    const differenz = round2(planLine.afa - gebucht);
    if (Math.abs(differenz) < 0.01 || abgeschlossen) continue;
    luecken.push({
      anlage_id: anlage.id,
      inventar_nr: anlage.inventar_nr,
      bezeichnung: anlage.bezeichnung,
      afa_methode: anlage.afa_methode,
      erwartete_afa_fuer_jahr: round2(planLine.afa),
      gebuchte_afa_fuer_jahr: gebucht,
      differenz,
      abgeschlossen,
    });
  }
  return luecken;
}
