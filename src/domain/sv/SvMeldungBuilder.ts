/**
 * SvMeldungBuilder — erzeugt DEUeV-Meldungen aus Employee-Stammdaten
 * + Lohn-Archiv (Sprint 15 / Schritt 3).
 *
 * Rechtsbasis:
 *  - § 28a SGB IV (Meldepflicht Arbeitgeber).
 *  - § 28b SGB IV (Meldeformate).
 *  - Taetigkeitsschluessel: BA-Verzeichnis 2010 (9-stellig).
 *
 * Strategie:
 *  - Stammdaten kommen aus dem Arbeitnehmer-Domain-Record (sv_nummer,
 *    Vor-/Nachname, Geburtsdatum, SV-Pflicht-Flags).
 *  - Felder, die NICHT im aktuellen Arbeitnehmer-Type liegen
 *    (Staatsangehoerigkeit, Geburtsname/-ort, Taetigkeitsschluessel,
 *    Mehrfachbeschaeftigung, Einzugsstelle-BBNR, Anschrift) werden als
 *    expliziter `extraData`-Parameter uebergeben. Die UI fragt sie in
 *    einer Eingabe-Tabelle ab. Persistenz ist Tech-Debt (siehe
 *    SPRINT-15-SV-MELDUNGEN-ABSCHLUSS.md).
 *  - Jahresmeldung summiert brutto_kv / brutto_rv aus allen Monats-
 *    Abrechnungen des Jahres — basierend auf `svBrutto` des
 *    persistierten Lohn-Archivs.
 *
 * Defensive Throws: Builder wirft klar + mit Reparatur-Hint, wenn
 * Pflichtfelder fehlen. KEINE Default-Erfindungen.
 */

import type {
  ArbeitgeberExtraData,
  ArbeitnehmerExtraData,
  Beitragsgruppe,
  DEUeVMeldung,
  Personengruppe,
} from "./dsuvTypes";
import { BG_VOLL_SV_PFLICHTIG, BG_MINIJOB } from "./dsuvTypes";
import type { Arbeitnehmer } from "../lohn/types";
import type { LohnabrechnungArchivRow } from "../lohn/types";
import type { Client, Employee } from "../../types/db";

/**
 * Extrahiert die DEUeV-Zusatzfelder aus einem Employee-DB-Record.
 * Fehlende Felder bleiben undefined — das Merge-Verhalten des
 * Builders entscheidet dann, ob der extraAn-Override sie fuellt.
 */
export function arbeitnehmerExtraFromEmployee(
  e: Employee
): Partial<ArbeitnehmerExtraData> {
  const out: Partial<ArbeitnehmerExtraData> = {};
  if (e.staatsangehoerigkeit) out.staatsangehoerigkeit = e.staatsangehoerigkeit;
  if (e.geburtsname) out.geburtsname = e.geburtsname;
  if (e.geburtsort) out.geburtsort = e.geburtsort;
  if (e.taetigkeitsschluessel) out.taetigkeitsschluessel = e.taetigkeitsschluessel;
  if (typeof e.mehrfachbeschaeftigung === "boolean") {
    out.mehrfachbeschaeftigung = e.mehrfachbeschaeftigung;
  }
  if (e.einzugsstelle_bbnr) out.einzugsstelle_bbnr = e.einzugsstelle_bbnr;
  if (
    e.anschrift_strasse ||
    e.anschrift_hausnummer ||
    e.anschrift_plz ||
    e.anschrift_ort
  ) {
    out.anschrift = {
      strasse: e.anschrift_strasse ?? "",
      hausnummer: e.anschrift_hausnummer ?? "",
      plz: e.anschrift_plz ?? "",
      ort: e.anschrift_ort ?? "",
    };
  }
  return out;
}

export function arbeitgeberFromClient(c: Client): Partial<ArbeitgeberExtraData> {
  const out: Partial<ArbeitgeberExtraData> = { name: c.name };
  if (
    c.anschrift_strasse ||
    c.anschrift_hausnummer ||
    c.anschrift_plz ||
    c.anschrift_ort
  ) {
    out.anschrift = {
      strasse: c.anschrift_strasse ?? "",
      hausnummer: c.anschrift_hausnummer ?? "",
      plz: c.anschrift_plz ?? "",
      ort: c.anschrift_ort ?? "",
    };
  }
  return out;
}

/**
 * Merge-Helper: override (aus UI-Prompt) gewinnt ueber base (aus DB).
 * Nur gesetzte Felder im Override werden uebernommen.
 */
export function mergeArbeitnehmerExtra(
  base: Partial<ArbeitnehmerExtraData>,
  override: Partial<ArbeitnehmerExtraData> | undefined
): Partial<ArbeitnehmerExtraData> {
  if (!override) return { ...base };
  const mergedAnschrift = override.anschrift ?? base.anschrift;
  return {
    staatsangehoerigkeit:
      override.staatsangehoerigkeit ?? base.staatsangehoerigkeit,
    geburtsname: override.geburtsname ?? base.geburtsname,
    geburtsort: override.geburtsort ?? base.geburtsort,
    taetigkeitsschluessel:
      override.taetigkeitsschluessel ?? base.taetigkeitsschluessel,
    mehrfachbeschaeftigung:
      override.mehrfachbeschaeftigung ?? base.mehrfachbeschaeftigung,
    einzugsstelle_bbnr:
      override.einzugsstelle_bbnr ?? base.einzugsstelle_bbnr,
    anschrift: mergedAnschrift,
  };
}

export function hasOverride(
  base: Partial<ArbeitnehmerExtraData>,
  override: Partial<ArbeitnehmerExtraData> | undefined
): boolean {
  if (!override) return false;
  // Mindestens ein Override-Feld unterscheidet sich vom Base-Feld.
  const keys: Array<keyof ArbeitnehmerExtraData> = [
    "staatsangehoerigkeit",
    "geburtsname",
    "geburtsort",
    "taetigkeitsschluessel",
    "mehrfachbeschaeftigung",
    "einzugsstelle_bbnr",
  ];
  for (const k of keys) {
    const ov = override[k];
    if (ov === undefined) continue;
    if (ov !== base[k]) return true;
  }
  return false;
}

export class MissingSvDataError extends Error {
  constructor(
    public readonly feld: string,
    public readonly reparaturHint: string,
    public readonly employeeId?: string
  ) {
    const idHint = employeeId
      ? ` Arbeitnehmer-Stammdaten vervollstaendigen unter /lohn/arbeitnehmer/${employeeId} — Feld: ${feld}.`
      : "";
    super(
      `SV-Meldung nicht erstellbar: Pflichtfeld "${feld}" fehlt. ${reparaturHint}${idHint}`
    );
    this.name = "MissingSvDataError";
  }
}

/** Leitet die Personengruppe aus der Beschaeftigungsart des
 *  Arbeitnehmers ab. */
export function personengruppeFromBeschaeftigung(
  an: Arbeitnehmer
): Personengruppe {
  switch (an.beschaeftigungsart) {
    case "MINIJOB":
      return "109";
    case "KURZFRISTIG":
      return "110";
    // VOLLZEIT, TEILZEIT, MIDIJOB -> SV-pflichtig.
    default:
      return "101";
  }
}

/** Leitet Beitragsgruppe aus den SV-Pflicht-Flags des AN ab. */
export function beitragsgruppeFromFlags(an: Arbeitnehmer): Beitragsgruppe {
  if (an.beschaeftigungsart === "MINIJOB") return BG_MINIJOB;
  // Default: fuer alle sv-pflicht-Flags die Standard-Schluessel. Bei
  // einzelnen Verneinungen wuerde man feiner mappen muessen — wenn
  // unklar, BG_VOLL_SV_PFLICHTIG + Warn-Hint im UI-Layer.
  if (!an.kv_pflicht && !an.rv_pflicht && !an.av_pflicht && !an.pv_pflicht) {
    return { kv: "0", rv: "0", av: "0", pv: "0" };
  }
  return BG_VOLL_SV_PFLICHTIG;
}

function ensureRequired(
  value: string | undefined | null,
  feld: string,
  repairHint: string
): string {
  if (!value || !value.trim()) {
    throw new MissingSvDataError(feld, repairHint);
  }
  return value;
}

type BuildContext = {
  arbeitnehmer: Arbeitnehmer;
  extraAn: ArbeitnehmerExtraData;
  arbeitgeber: ArbeitgeberExtraData;
};

function buildArbeitnehmerDsuv(ctx: BuildContext) {
  const an = ctx.arbeitnehmer;
  ensureRequired(
    an.sv_nummer,
    "sv_nummer",
    "Bitte im Arbeitnehmer-Stammdatensatz (Lohn → Arbeitnehmer) nachtragen."
  );
  return {
    sv_nummer: an.sv_nummer,
    nachname: an.name,
    vorname: an.vorname,
    geburtsdatum: an.geburtsdatum,
    staatsangehoerigkeit: ensureRequired(
      ctx.extraAn.staatsangehoerigkeit,
      "staatsangehoerigkeit",
      "Im SV-Meldungen-Formular pro Arbeitnehmer eingeben (2-stelliger ISO-Code, z. B. DE)."
    ),
    anschrift: {
      strasse: ensureRequired(
        ctx.extraAn.anschrift.strasse,
        "arbeitnehmer.anschrift.strasse",
        "Im SV-Meldungen-Formular pro Arbeitnehmer eingeben."
      ),
      hausnummer: ensureRequired(
        ctx.extraAn.anschrift.hausnummer,
        "arbeitnehmer.anschrift.hausnummer",
        "Im SV-Meldungen-Formular pro Arbeitnehmer eingeben."
      ),
      plz: ensureRequired(
        ctx.extraAn.anschrift.plz,
        "arbeitnehmer.anschrift.plz",
        "Im SV-Meldungen-Formular pro Arbeitnehmer eingeben."
      ),
      ort: ensureRequired(
        ctx.extraAn.anschrift.ort,
        "arbeitnehmer.anschrift.ort",
        "Im SV-Meldungen-Formular pro Arbeitnehmer eingeben."
      ),
    },
    geburtsname: ctx.extraAn.geburtsname,
    geburtsort: ctx.extraAn.geburtsort,
  };
}

function buildArbeitgeberDsuv(ctx: BuildContext) {
  ensureRequired(
    ctx.arbeitgeber.betriebsnummer,
    "arbeitgeber.betriebsnummer",
    "Im SV-Meldungen-Absenderblock eingeben (8-stellige Betriebsnummer der BA)."
  );
  ensureRequired(
    ctx.arbeitgeber.name,
    "arbeitgeber.name",
    "Im SV-Meldungen-Absenderblock eingeben."
  );
  ensureRequired(
    ctx.arbeitgeber.anschrift.strasse,
    "arbeitgeber.anschrift.strasse",
    "Im SV-Meldungen-Absenderblock eingeben."
  );
  ensureRequired(
    ctx.arbeitgeber.anschrift.plz,
    "arbeitgeber.anschrift.plz",
    "Im SV-Meldungen-Absenderblock eingeben."
  );
  ensureRequired(
    ctx.arbeitgeber.anschrift.ort,
    "arbeitgeber.anschrift.ort",
    "Im SV-Meldungen-Absenderblock eingeben."
  );
  return {
    betriebsnummer: ctx.arbeitgeber.betriebsnummer,
    name: ctx.arbeitgeber.name,
    anschrift: ctx.arbeitgeber.anschrift,
  };
}

function buildBeschaeftigung(ctx: BuildContext) {
  ensureRequired(
    ctx.extraAn.taetigkeitsschluessel,
    "taetigkeitsschluessel",
    "9-stellig nach BA-Schluesselverzeichnis 2010. Im Arbeitnehmer-Formular eingeben."
  );
  ensureRequired(
    ctx.extraAn.einzugsstelle_bbnr,
    "einzugsstelle_bbnr",
    "8-stellige BBNR der Krankenkasse. In den Krankenkassen-Stammdaten hinterlegen."
  );
  return {
    personengruppe: personengruppeFromBeschaeftigung(ctx.arbeitnehmer),
    beitragsgruppe: beitragsgruppeFromFlags(ctx.arbeitnehmer),
    taetigkeitsschluessel: ctx.extraAn.taetigkeitsschluessel,
    mehrfachbeschaeftigung: ctx.extraAn.mehrfachbeschaeftigung,
  };
}

export type AnmeldungInput = {
  arbeitnehmer: Arbeitnehmer;
  extraAn: ArbeitnehmerExtraData;
  arbeitgeber: ArbeitgeberExtraData;
  beschaeftigungsbeginn: string; // YYYY-MM-DD
};

export function buildAnmeldung(input: AnmeldungInput): DEUeVMeldung {
  const ctx: BuildContext = {
    arbeitnehmer: input.arbeitnehmer,
    extraAn: input.extraAn,
    arbeitgeber: input.arbeitgeber,
  };
  return {
    abgabegrund: "10",
    meldezeitraum_von: input.beschaeftigungsbeginn,
    meldezeitraum_bis: input.beschaeftigungsbeginn,
    arbeitnehmer: buildArbeitnehmerDsuv(ctx),
    arbeitgeber: buildArbeitgeberDsuv(ctx),
    beschaeftigung: buildBeschaeftigung(ctx),
    einzugsstelle_bbnr: input.extraAn.einzugsstelle_bbnr,
  };
}

export type AbmeldungInput = {
  arbeitnehmer: Arbeitnehmer;
  extraAn: ArbeitnehmerExtraData;
  arbeitgeber: ArbeitgeberExtraData;
  beschaeftigungsende: string;
};

export function buildAbmeldung(input: AbmeldungInput): DEUeVMeldung {
  const ctx: BuildContext = {
    arbeitnehmer: input.arbeitnehmer,
    extraAn: input.extraAn,
    arbeitgeber: input.arbeitgeber,
  };
  return {
    abgabegrund: "30",
    meldezeitraum_von: input.beschaeftigungsende,
    meldezeitraum_bis: input.beschaeftigungsende,
    arbeitnehmer: buildArbeitnehmerDsuv(ctx),
    arbeitgeber: buildArbeitgeberDsuv(ctx),
    beschaeftigung: buildBeschaeftigung(ctx),
    einzugsstelle_bbnr: input.extraAn.einzugsstelle_bbnr,
  };
}

export type JahresmeldungInput = {
  arbeitnehmer: Arbeitnehmer;
  extraAn: ArbeitnehmerExtraData;
  arbeitgeber: ArbeitgeberExtraData;
  jahr: number;
  /** Lohn-Archiv-Rows des Arbeitnehmers fuer alle Monate in `jahr`. */
  archivRows: LohnabrechnungArchivRow[];
};

/** Eine Archiv-Row hat `abrechnung_json.svBrutto` als toFixed2-String. */
function readSvBrutto(row: LohnabrechnungArchivRow): number {
  const json = row.abrechnung_json as
    | { svBrutto?: string | number }
    | undefined;
  if (!json) return 0;
  const raw = json.svBrutto;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function buildJahresmeldung(
  input: JahresmeldungInput
): DEUeVMeldung {
  const ctx: BuildContext = {
    arbeitnehmer: input.arbeitnehmer,
    extraAn: input.extraAn,
    arbeitgeber: input.arbeitgeber,
  };
  const jahrPrefix = String(input.jahr);
  const rows = input.archivRows.filter((r) =>
    r.abrechnungsmonat.startsWith(jahrPrefix)
  );
  const svBruttoSumme = rows.reduce((s, r) => s + readSvBrutto(r), 0);
  // Erst ab Eintritt (kann mitten im Jahr liegen) oder 01.01. des
  // Jahres als Von-Datum; bis 31.12. oder Austritt.
  const ein = input.arbeitnehmer.eintrittsdatum;
  const aus = input.arbeitnehmer.austrittsdatum;
  const von = ein && ein > `${input.jahr}-01-01` ? ein : `${input.jahr}-01-01`;
  const bis = aus && aus < `${input.jahr}-12-31` ? aus : `${input.jahr}-12-31`;
  return {
    abgabegrund: "50",
    meldezeitraum_von: von,
    meldezeitraum_bis: bis,
    arbeitnehmer: buildArbeitnehmerDsuv(ctx),
    arbeitgeber: buildArbeitgeberDsuv(ctx),
    beschaeftigung: buildBeschaeftigung(ctx),
    entgelt: {
      brutto_rv: Math.round(svBruttoSumme * 100) / 100,
      brutto_kv: Math.round(svBruttoSumme * 100) / 100,
      gleitzone_flag: false,
    },
    einzugsstelle_bbnr: input.extraAn.einzugsstelle_bbnr,
  };
}

// ─────────────────────────────────────────────────────────────
// Sprint-18-Adapter: DB-basiert (Employee + Client + Override).
// ─────────────────────────────────────────────────────────────

export type BuildFromDbOptions = {
  /** Override hat Prioritaet ueber DB-Werte (fuer Ad-hoc-Korrektur). */
  extraOverride?: Partial<ArbeitnehmerExtraData>;
  arbeitgeberOverride?: Partial<ArbeitgeberExtraData>;
};

function assertCompleteExtraAn(
  merged: Partial<ArbeitnehmerExtraData>,
  employeeId: string
): ArbeitnehmerExtraData {
  const hint = "Bitte Arbeitnehmer-Stammdaten vervollstaendigen.";
  if (!merged.staatsangehoerigkeit) {
    throw new MissingSvDataError(
      "staatsangehoerigkeit",
      hint,
      employeeId
    );
  }
  if (!merged.taetigkeitsschluessel) {
    throw new MissingSvDataError(
      "taetigkeitsschluessel",
      hint,
      employeeId
    );
  }
  if (!merged.einzugsstelle_bbnr) {
    throw new MissingSvDataError("einzugsstelle_bbnr", hint, employeeId);
  }
  if (
    !merged.anschrift ||
    !merged.anschrift.strasse ||
    !merged.anschrift.hausnummer ||
    !merged.anschrift.plz ||
    !merged.anschrift.ort
  ) {
    throw new MissingSvDataError(
      "anschrift",
      hint + " (Strasse/Hausnummer/PLZ/Ort)",
      employeeId
    );
  }
  return {
    staatsangehoerigkeit: merged.staatsangehoerigkeit,
    taetigkeitsschluessel: merged.taetigkeitsschluessel,
    einzugsstelle_bbnr: merged.einzugsstelle_bbnr,
    anschrift: merged.anschrift,
    geburtsname: merged.geburtsname,
    geburtsort: merged.geburtsort,
    mehrfachbeschaeftigung: merged.mehrfachbeschaeftigung ?? false,
  };
}

function assertCompleteArbeitgeber(
  merged: Partial<ArbeitgeberExtraData>,
  clientId: string
): ArbeitgeberExtraData {
  const hint = `Client-Anschrift vervollstaendigen unter /clients/${clientId}/edit.`;
  if (!merged.betriebsnummer) {
    throw new MissingSvDataError("arbeitgeber.betriebsnummer", hint);
  }
  if (!merged.name) {
    throw new MissingSvDataError("arbeitgeber.name", hint);
  }
  if (
    !merged.anschrift ||
    !merged.anschrift.strasse ||
    !merged.anschrift.plz ||
    !merged.anschrift.ort
  ) {
    throw new MissingSvDataError(
      "arbeitgeber.anschrift",
      hint + " (Strasse/PLZ/Ort)"
    );
  }
  return {
    betriebsnummer: merged.betriebsnummer,
    name: merged.name,
    anschrift: {
      strasse: merged.anschrift.strasse,
      hausnummer: merged.anschrift.hausnummer ?? "",
      plz: merged.anschrift.plz,
      ort: merged.anschrift.ort,
    },
  };
}

/**
 * Convenience fuer die SvMeldungenPage: nimmt Employee+Client aus der
 * DB, merged optional mit Ad-hoc-Override, liefert ein vollstaendiges
 * ArbeitnehmerExtraData + ArbeitgeberExtraData — oder wirft
 * MissingSvDataError mit Link-Hint zum Profil.
 */
export function resolveBuildContext(
  employee: Employee,
  client: Client,
  options: BuildFromDbOptions = {}
): {
  arbeitnehmer: Arbeitnehmer;
  extraAn: ArbeitnehmerExtraData;
  arbeitgeber: ArbeitgeberExtraData;
  overrideUsed: boolean;
} {
  const fromDb = arbeitnehmerExtraFromEmployee(employee);
  const mergedAn = mergeArbeitnehmerExtra(fromDb, options.extraOverride);
  const extraAn = assertCompleteExtraAn(mergedAn, employee.id);

  const fromClient = arbeitgeberFromClient(client);
  const mergedAg = {
    ...fromClient,
    ...(options.arbeitgeberOverride ?? {}),
    anschrift:
      options.arbeitgeberOverride?.anschrift ?? fromClient.anschrift,
  };
  // Betriebsnummer kommt aus Override (SV-Absender-Block), nicht aus
  // Client — der Client hat aktuell keine Betriebsnummer-Spalte.
  const arbeitgeber = assertCompleteArbeitgeber(mergedAg, client.id);

  const overrideUsed = hasOverride(fromDb, options.extraOverride);

  // Minimal-Stub eines lohn.Arbeitnehmer-Records, der fuer die
  // Personengruppe-/Beitragsgruppe-Ableitung ausreicht.
  const stub: Arbeitnehmer = {
    id: employee.id,
    mandant_id: employee.client_id ?? "",
    personalNr: employee.personalnummer,
    name: employee.nachname,
    vorname: employee.vorname,
    geburtsdatum:
      employee.einstellungsdatum ?? new Date().toISOString().slice(0, 10),
    sv_nummer: employee.sv_nummer ?? "",
    steuer_id: employee.steuer_id ?? "",
    steuerklasse: ({
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
    }[employee.steuerklasse] ?? 1) as Arbeitnehmer["steuerklasse"],
    kinderfreibetraege: employee.kinderfreibetraege,
    kirchensteuerpflichtig: !!employee.konfession,
    konfession:
      employee.konfession === "ev"
        ? "EV"
        : employee.konfession === "rk"
        ? "RK"
        : "NONE",
    bundesland: (employee.bundesland ?? "BE") as Arbeitnehmer["bundesland"],
    kv_pflicht: !employee.privat_versichert,
    kv_beitragsart: employee.privat_versichert ? "PRIVAT" : "GESETZLICH",
    kv_zusatzbeitrag: String(employee.zusatzbeitrag_pct ?? 0),
    rv_pflicht: employee.beschaeftigungsart !== "minijob",
    av_pflicht: employee.beschaeftigungsart !== "minijob",
    pv_pflicht: employee.beschaeftigungsart !== "minijob",
    pv_kinderlos_zuschlag: employee.pv_kinderlos,
    pv_anzahl_kinder: employee.pv_kinder_anzahl,
    beschaeftigungsart:
      employee.beschaeftigungsart === "minijob"
        ? "MINIJOB"
        : employee.beschaeftigungsart === "midijob"
        ? "MIDIJOB"
        : employee.beschaeftigungsart === "teilzeit"
        ? "TEILZEIT"
        : employee.beschaeftigungsart === "ausbildung"
        ? "VOLLZEIT"
        : "VOLLZEIT",
    betriebsnummer: arbeitgeber.betriebsnummer,
    eintrittsdatum: employee.einstellungsdatum ?? "2020-01-01",
    ...(employee.austrittsdatum
      ? { austrittsdatum: employee.austrittsdatum }
      : {}),
  };

  return { arbeitnehmer: stub, extraAn, arbeitgeber, overrideUsed };
}
