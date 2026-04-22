/**
 * Detektion nicht-gebuchter Lohnmonate pro Mandant + Jahr.
 *
 * Jahresabschluss-E1 / Schritt 5. Iteriert pro Monat über die aktiven
 * Mitarbeiter des Mandanten und prüft, ob für jeden eine Abrechnung im
 * Archiv liegt.
 *
 * Rechtsbasis: GoBD — vollständige Lohn-Dokumentation. Der Check ist
 * ein Warnung-Level-Signal (nicht blockierend für Jahresabschluss),
 * aber wichtige Compliance-Erinnerung.
 */

import { fetchEmployees } from "../../api/employees";
import { AbrechnungArchivRepo } from "../../lib/db/lohnRepos";

export type LohnMonatsluecke = {
  jahr: number;
  /** 1 = Januar ... 12 = Dezember. */
  monat: number;
  employees_mit_vertrag: number;
  employees_mit_abrechnung: number;
  fehlende_abrechnungen_fuer_employee_ids: string[];
};

function overlapsMonth(
  einstellungsdatum: string | null,
  austrittsdatum: string | null,
  jahr: number,
  monat: number
): boolean {
  const monatStart = `${jahr}-${String(monat).padStart(2, "0")}-01`;
  const monatEnde = `${jahr}-${String(monat).padStart(2, "0")}-${String(
    new Date(jahr, monat, 0).getDate()
  ).padStart(2, "0")}`;
  const e = einstellungsdatum ?? "0000-01-01";
  const a = austrittsdatum ?? "9999-12-31";
  // Überlappt, wenn Einstellung ≤ Monatsende UND Austritt ≥ Monatsanfang.
  return e <= monatEnde && a >= monatStart;
}

export async function detectLohnLuecken(
  mandantId: string | null,
  _companyId: string,
  jahr: number
): Promise<LohnMonatsluecke[]> {
  const employees = await fetchEmployees(mandantId);
  const archivRepo = new AbrechnungArchivRepo();

  const now = new Date();
  const currentYear = now.getFullYear();
  const lastRelevantMonth =
    jahr < currentYear ? 12 : jahr === currentYear ? now.getMonth() + 1 : 0;

  const luecken: LohnMonatsluecke[] = [];

  for (let monat = 1; monat <= lastRelevantMonth; monat++) {
    const monatKey = `${jahr}-${String(monat).padStart(2, "0")}`;
    const employeesMitVertrag = employees.filter(
      (e) =>
        e.is_active !== false &&
        overlapsMonth(e.einstellungsdatum, e.austrittsdatum, jahr, monat)
    );
    if (employeesMitVertrag.length === 0) continue;

    const fehlende: string[] = [];
    for (const emp of employeesMitVertrag) {
      const rows = await archivRepo.getForEmployee(emp.id, mandantId);
      const hasAbrechnung = rows.some((r) => r.abrechnungsmonat === monatKey);
      if (!hasAbrechnung) fehlende.push(emp.id);
    }

    if (fehlende.length > 0) {
      luecken.push({
        jahr,
        monat,
        employees_mit_vertrag: employeesMitVertrag.length,
        employees_mit_abrechnung: employeesMitVertrag.length - fehlende.length,
        fehlende_abrechnungen_fuer_employee_ids: fehlende,
      });
    }
  }
  return luecken;
}
