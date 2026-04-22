// Lohnsteueranmeldung (Monats-/Quartals-/Jahres-Anmeldung).
//
// Dieses Modul aggregiert die Lohnsteuer-Summen eines Zeitraums aus den
// berechneten Lohnzeilen. Erzeugt CSV + ELSTER-Shape-XML; die eigentliche
// Übertragung erfolgt NICHT aus dem Browser — die XML ist zum Import ins
// ElsterOnline-Portal bzw. in ein zertifiziertes Lohnprogramm gedacht.

import type { Employee } from "../types/db";

export type PayrollRowForAnmeldung = {
  employee: Employee;
  brutto: number;
  lohnsteuer: number;
  soli: number;
  kirchensteuer: number;
};

export type LohnsteueranmeldungTotals = {
  /** Zeitraum: 1-12 Monat oder 1-4 Quartal; Jahr immer gesetzt. */
  year: number;
  month: number;
  /** Anzahl Lohnempfänger in diesem Zeitraum. */
  anzahlArbeitnehmer: number;
  /** Summen in Euro */
  gesamtbrutto: number;
  lohnsteuer: number;
  soli: number;
  /** Kirchensteuer getrennt nach Konfession, soweit bekannt. */
  kirchensteuer_evangelisch: number;
  kirchensteuer_katholisch: number;
  kirchensteuer_sonstige: number;
  /** Gesamtsumme zur Zahlung ans Finanzamt. */
  zahllast: number;
  /** Warnungen (z. B. Inkonsistenzen zwischen Bruttosumme und LSt). */
  warnings: string[];
};

function isEvangelisch(konfession: string | null): boolean {
  if (!konfession) return false;
  const k = konfession.trim().toLowerCase();
  return k === "ev" || k === "evangelisch" || k === "ek";
}
function isKatholisch(konfession: string | null): boolean {
  if (!konfession) return false;
  const k = konfession.trim().toLowerCase();
  return k === "rk" || k === "katholisch" || k === "rk-ka" || k === "kath";
}

export function summarizeLohnsteuer(
  rows: PayrollRowForAnmeldung[],
  year: number,
  month: number
): LohnsteueranmeldungTotals {
  let brutto = 0;
  let lst = 0;
  let soli = 0;
  let kistEv = 0;
  let kistRk = 0;
  let kistOther = 0;
  const warnings: string[] = [];

  for (const r of rows) {
    brutto += r.brutto;
    lst += r.lohnsteuer;
    soli += r.soli;
    const k = r.kirchensteuer;
    if (isEvangelisch(r.employee.konfession)) kistEv += k;
    else if (isKatholisch(r.employee.konfession)) kistRk += k;
    else if (k > 0) kistOther += k;
  }

  if (lst > 0 && brutto === 0) {
    warnings.push("Lohnsteuer ohne Bruttosumme — bitte Datenqualität prüfen.");
  }
  if (kistOther > 0) {
    warnings.push(
      `Kirchensteuer von ${kistOther.toFixed(2)} € konnte keiner Konfession zugeordnet werden. Bitte Konfessionsfeld der betroffenen Mitarbeiter ergänzen.`
    );
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    year,
    month,
    anzahlArbeitnehmer: rows.length,
    gesamtbrutto: round2(brutto),
    lohnsteuer: round2(lst),
    soli: round2(soli),
    kirchensteuer_evangelisch: round2(kistEv),
    kirchensteuer_katholisch: round2(kistRk),
    kirchensteuer_sonstige: round2(kistOther),
    zahllast: round2(lst + soli + kistEv + kistRk + kistOther),
    warnings,
  };
}

export function buildLohnsteueranmeldungCsv(
  t: LohnsteueranmeldungTotals
): string {
  const rows: [string, string][] = [
    ["Anmeldungszeitraum", `${String(t.month).padStart(2, "0")}/${t.year}`],
    ["Anzahl Arbeitnehmer", String(t.anzahlArbeitnehmer)],
    ["Gesamtbruttolohn", t.gesamtbrutto.toFixed(2).replace(".", ",")],
    ["Lohnsteuer", t.lohnsteuer.toFixed(2).replace(".", ",")],
    ["Solidaritätszuschlag", t.soli.toFixed(2).replace(".", ",")],
    [
      "Kirchensteuer (evangelisch)",
      t.kirchensteuer_evangelisch.toFixed(2).replace(".", ","),
    ],
    [
      "Kirchensteuer (katholisch)",
      t.kirchensteuer_katholisch.toFixed(2).replace(".", ","),
    ],
    [
      "Kirchensteuer (sonstige)",
      t.kirchensteuer_sonstige.toFixed(2).replace(".", ","),
    ],
    ["Gesamt-Zahllast", t.zahllast.toFixed(2).replace(".", ",")],
  ];
  const out = ["Merkmal;Wert", ...rows.map((r) => r.join(";"))];
  return "\ufeff" + out.join("\n");
}

export function buildLohnsteueranmeldungXml(
  t: LohnsteueranmeldungTotals,
  meta: { steuernummer: string; kanzleiName: string }
): string {
  const period = `${t.year}-${String(t.month).padStart(2, "0")}`;
  const now = new Date().toISOString();
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const cent = (n: number) => Math.round(n * 100).toString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Erzeugt von harouda-app am ${now} — shape-kompatibel zur ELSTER-LohnStAnm, -->
<!-- nicht zertifiziert. Upload via ElsterOnline-Portal oder Fachclient.       -->
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
  <TransferHeader version="11">
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>LStA</DatenArt>
    <Vorgang>send-Auth</Vorgang>
    <Zeitraum>${esc(period)}</Zeitraum>
    <HerstellerID>harouda-app</HerstellerID>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <NutzdatenHeader version="11">
        <NutzdatenTicket>${Date.now()}</NutzdatenTicket>
        <Empfaenger id="F">9999</Empfaenger>
        <Hersteller>
          <ProduktName>harouda-app</ProduktName>
          <ProduktVersion>1.0.0</ProduktVersion>
        </Hersteller>
      </NutzdatenHeader>
      <Nutzdaten>
        <Anmeldungssteuern art="LStA">
          <Steuernummer>${esc(meta.steuernummer)}</Steuernummer>
          <Erstellungsdatum>${now.slice(0, 10).replace(/-/g, "")}</Erstellungsdatum>
          <Lohnsteueranmeldung>
            <Jahr>${t.year}</Jahr>
            <Zeitraum>${String(t.month).padStart(2, "0")}</Zeitraum>
            <AnzahlAN>${t.anzahlArbeitnehmer}</AnzahlAN>
            <!-- Beträge in Cent -->
            <Bruttolohn>${cent(t.gesamtbrutto)}</Bruttolohn>
            <Lohnsteuer>${cent(t.lohnsteuer)}</Lohnsteuer>
            <Solidaritaetszuschlag>${cent(t.soli)}</Solidaritaetszuschlag>
            <KircheEv>${cent(t.kirchensteuer_evangelisch)}</KircheEv>
            <KircheRk>${cent(t.kirchensteuer_katholisch)}</KircheRk>
            <KircheSonst>${cent(t.kirchensteuer_sonstige)}</KircheSonst>
            <Zahllast>${cent(t.zahllast)}</Zahllast>
          </Lohnsteueranmeldung>
        </Anmeldungssteuern>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>
`;
}
