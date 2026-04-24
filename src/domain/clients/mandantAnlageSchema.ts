/**
 * Zod-Validierungsschema für den Mandanten-Anlage-Wizard.
 *
 * Vier Schemas — eines pro Wizard-Schritt — plus ein Gesamt-Schema
 * für den finalen Submit. Alle Fehlermeldungen sind auf Deutsch und
 * direkt in der UI anzeigbar (keine zusätzliche i18n-Schicht nötig).
 *
 * Rechtsform-Liste entspricht public.clients.rechtsform CHECK-Constraint
 * aus Migration 0030.
 */

import { z } from "zod";

// --- Rechtsform enum ---
const RECHTSFORM_VALUES = [
  "Einzelunternehmen",
  "GbR",
  "PartG",
  "OHG",
  "KG",
  "GmbH",
  "AG",
  "UG",
  "SE",
  "SonstigerRechtsform",
] as const;

export const rechtsformSchema = z.enum(RECHTSFORM_VALUES);

// --- Schritt 1: Grunddaten ---
export const schritt1Schema = z.object({
  mandant_nr: z
    .string()
    .min(1, "Mandanten-Nr. ist erforderlich")
    .max(20, "Mandanten-Nr. darf max. 20 Zeichen haben"),
  name: z
    .string()
    .min(1, "Name / Firma ist erforderlich")
    .max(200, "Name darf max. 200 Zeichen haben"),
  rechtsform: rechtsformSchema,
});

// --- Schritt 2: Anschrift ---
export const schritt2Schema = z.object({
  anschrift_strasse: z.string().max(100).optional().nullable(),
  anschrift_hausnummer: z.string().max(10).optional().nullable(),
  anschrift_plz: z
    .string()
    .regex(/^[0-9]{4,5}$/, "PLZ muss 4 oder 5 Ziffern enthalten")
    .optional()
    .nullable()
    .or(z.literal("")),
  anschrift_ort: z.string().max(100).optional().nullable(),
  anschrift_land: z
    .string()
    .regex(/^[A-Z]{2}$/, "Länderkürzel muss 2 Großbuchstaben sein (z.B. DE)")
    .default("DE"),
});

// --- Schritt 3: Steuer & Bank ---
export const schritt3Schema = z.object({
  steuernummer: z
    .string()
    .regex(
      /^[0-9/]{10,13}$/,
      "Steuernummer muss 10-13 Ziffern enthalten (mit oder ohne Schrägstriche)"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  ust_id: z
    .string()
    .regex(
      /^[A-Z]{2}[A-Z0-9]{2,12}$/,
      "Ungültige USt-IdNr. (z.B. DE123456789)"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  iban: z
    .string()
    .regex(
      /^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/,
      "Ungültige IBAN"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  finanzamt_name: z.string().max(200).optional().nullable(),
  finanzamt_bufa_nr: z
    .string()
    .regex(/^[0-9]{4}$/, "BUFA-Nr. muss genau 4 Ziffern enthalten")
    .optional()
    .nullable()
    .or(z.literal("")),
  versteuerungsart: z.enum(["soll", "ist"]).optional().nullable(),
  kleinunternehmer_regelung: z.boolean().default(false),
  ust_voranmeldung_zeitraum: z
    .enum(["monatlich", "vierteljaehrlich", "jaehrlich", "befreit"])
    .optional()
    .nullable(),
  // Handelsregister (nur bei Kapital-/Personengesellschaften sichtbar)
  hrb_nummer: z.string().max(50).optional().nullable(),
  hrb_gericht: z.string().max(200).optional().nullable(),
  gezeichnetes_kapital: z
    .number()
    .min(0, "Gezeichnetes Kapital darf nicht negativ sein")
    .optional()
    .nullable(),
});

// --- Schritt 4: Buchhaltung & Lohn ---
export const schritt4Schema = z.object({
  kontenrahmen: z.enum(["SKR03", "SKR04"]).default("SKR03"),
  sachkontenlaenge: z
    .number()
    .int()
    .min(4, "Sachkontenlänge muss mindestens 4 sein")
    .max(6, "Sachkontenlänge darf max. 6 sein")
    .default(4),
  gewinnermittlungsart: z.enum(["bilanz", "euer"]).optional().nullable(),
  wirtschaftsjahr_typ: z
    .enum(["kalenderjahr", "abweichend"])
    .default("kalenderjahr"),
  wirtschaftsjahr_beginn: z
    .string()
    .regex(/^\d{2}-\d{2}$/, "Format MM-TT erforderlich (z.B. 01-01)")
    .default("01-01"),
  wirtschaftsjahr_ende: z
    .string()
    .regex(/^\d{2}-\d{2}$/, "Format MM-TT erforderlich (z.B. 12-31)")
    .default("12-31"),
  betriebsnummer: z
    .string()
    .regex(/^[0-9]{8}$/, "Betriebsnummer muss genau 8 Ziffern enthalten")
    .optional()
    .nullable()
    .or(z.literal("")),
  berufsgenossenschaft_name: z.string().max(200).optional().nullable(),
  berufsgenossenschaft_mitgliedsnr: z.string().max(50).optional().nullable(),
  kirchensteuer_erhebungsstelle: z.string().max(200).optional().nullable(),
});

// --- Gesamt-Schema für finalen Submit ---
export const mandantAnlageSchema = schritt1Schema
  .merge(schritt2Schema)
  .merge(schritt3Schema)
  .merge(schritt4Schema);

// --- Inferred Types ---
export type Schritt1Data = z.infer<typeof schritt1Schema>;
export type Schritt2Data = z.infer<typeof schritt2Schema>;
export type Schritt3Data = z.infer<typeof schritt3Schema>;
export type Schritt4Data = z.infer<typeof schritt4Schema>;
export type MandantAnlageData = z.infer<typeof mandantAnlageSchema>;

// --- Helper: welche Rechtsformen erfordern Handelsregister-Felder? ---
export const RECHTSFORMEN_MIT_HR = [
  "GmbH",
  "AG",
  "UG",
  "SE",
  "KG",
  "OHG",
] as const;

export function braucht_handelsregister(rechtsform: string | null | undefined): boolean {
  return !!rechtsform && (RECHTSFORMEN_MIT_HR as readonly string[]).includes(rechtsform);
}

// --- Helper: ist die Rechtsform eine Kapitalgesellschaft? ---
export const KAPITALGESELLSCHAFTEN = ["GmbH", "AG", "UG", "SE"] as const;

export function ist_kapitalgesellschaft(rechtsform: string | null | undefined): boolean {
  return !!rechtsform && (KAPITALGESELLSCHAFTEN as readonly string[]).includes(rechtsform);
}
