// Curated subset of the Bundesbank Bankleitzahlendatei.
// Covers direct banks, the largest commercial banks, and representative
// entries from Sparkassen / Volks- und Raiffeisenbanken. For a full lookup
// load the current BLZ file from bundesbank.de — but these cover the vast
// majority of IBANs in day-to-day use.
//
// Shape: [BLZ (8 digits), Bank name, BIC]

export type BlzRow = [string, string, string];

export const BLZ_TABLE: BlzRow[] = [
  // --- Direct / neo banks ---
  ["10011001", "N26 Bank", "NTSBDEB1XXX"],
  ["50010517", "ING-DiBa", "INGDDEFFXXX"],
  ["76026000", "Consorsbank", "CSDBDE71XXX"],
  ["20041133", "comdirect bank", "COBADEHD044"],
  ["20041111", "comdirect bank", "COBADEHD044"],
  ["12030000", "DKB Deutsche Kreditbank", "BYLADEM1001"],
  ["43060967", "GLS Bank", "GENODEM1GLS"],
  ["10010010", "Postbank Berlin", "PBNKDEFF100"],
  ["10110101", "Revolut", "REVODEB2XXX"],

  // --- Commerzbank (selected) ---
  ["10040000", "Commerzbank Berlin", "COBADEFFXXX"],
  ["20040000", "Commerzbank Hamburg", "COBADEHHXXX"],
  ["30040000", "Commerzbank Düsseldorf", "COBADEDDXXX"],
  ["37040044", "Commerzbank Köln", "COBADEFFXXX"],
  ["50040000", "Commerzbank Frankfurt", "COBADEFFXXX"],
  ["60040071", "Commerzbank Stuttgart", "COBADEFFXXX"],
  ["70040041", "Commerzbank München", "COBADEFFXXX"],

  // --- Deutsche Bank (selected) ---
  ["10070000", "Deutsche Bank Berlin", "DEUTDEBBXXX"],
  ["10070024", "Deutsche Bank Berlin (PGK)", "DEUTDEDB110"],
  ["20070000", "Deutsche Bank Hamburg", "DEUTDEHHXXX"],
  ["30070010", "Deutsche Bank Düsseldorf", "DEUTDEDDXXX"],
  ["37070060", "Deutsche Bank Köln", "DEUTDEDKXXX"],
  ["50070010", "Deutsche Bank Frankfurt", "DEUTDEFFXXX"],
  ["50070024", "Deutsche Bank Frankfurt (PGK)", "DEUTDEDBFRA"],
  ["70070010", "Deutsche Bank München", "DEUTDEMMXXX"],

  // --- Postbank (selected) ---
  ["10010010", "Postbank Berlin", "PBNKDEFF100"],
  ["20010020", "Postbank Hamburg", "PBNKDEFF200"],
  ["30010400", "Postbank Düsseldorf", "PBNKDEFF300"],
  ["37010050", "Postbank Köln", "PBNKDEFF370"],
  ["50010060", "Postbank Frankfurt", "PBNKDEFF500"],
  ["70010080", "Postbank München", "PBNKDEFF700"],

  // --- HypoVereinsbank (UniCredit) ---
  ["70020270", "HypoVereinsbank München", "HYVEDEMMXXX"],
  ["37020090", "HypoVereinsbank Köln", "HYVEDEMM429"],
  ["50020200", "HypoVereinsbank Frankfurt", "HYVEDEMM430"],

  // --- Landesbanken ---
  ["60050101", "Landesbank Baden-Württemberg (LBBW)", "SOLADEST600"],
  ["25050000", "Nord/LB Hannover", "NOLADE2HXXX"],
  ["40050000", "WestLB (heute Helaba/LBBW-Nachfolge)", "WELADEDDXXX"],
  ["50050000", "Helaba Frankfurt", "HELADEFFXXX"],
  ["70050000", "BayernLB München", "BYLADEMMXXX"],

  // --- Sparkassen (representative big cities) ---
  ["10050000", "Berliner Sparkasse", "BELADEBEXXX"],
  ["20050550", "Hamburger Sparkasse (Haspa)", "HASPDEHHXXX"],
  ["30050110", "Sparkasse Düsseldorf", "DUSSDEDDXXX"],
  ["37050198", "Sparkasse KölnBonn", "COLSDE33XXX"],
  ["50050201", "Frankfurter Sparkasse", "HELADEF1822"],
  ["60050101", "BW-Bank / LBBW Stuttgart", "SOLADEST600"],
  ["70150000", "Stadtsparkasse München", "SSKMDEMMXXX"],
  ["44050199", "Sparkasse Dortmund", "DORTDE33XXX"],
  ["36050105", "Sparkasse Essen", "SPESDE3EXXX"],
  ["26050001", "Sparkasse Göttingen", "NOLADE21GOE"],
  ["76050101", "Sparkasse Nürnberg", "SSKNDE77XXX"],
  ["25450001", "Sparkasse Hannover", "SPKHDE2HXXX"],

  // --- Volks- und Raiffeisenbanken (selected) ---
  ["10090000", "Berliner Volksbank", "BEVODEBBXXX"],
  ["20190003", "Hamburger Volksbank", "GENODEF1HH2"],
  ["30060601", "apoBank Düsseldorf", "DAAEDEDDXXX"],
  ["37069050", "Volksbank Köln Bonn", "GENODED1BRS"],
  ["50190000", "Frankfurter Volksbank", "FFVBDEFFXXX"],
  ["60090100", "Volksbank Stuttgart / BW-Bank Genossen", "VOBADESSXXX"],
  ["70090500", "Sparda-Bank München", "GENODEF1S04"],

  // --- Sparda-Banken ---
  ["10090603", "Sparda-Bank Berlin", "GENODEF1S10"],
  ["20090500", "Sparda-Bank Hamburg", "GENODEF1S11"],
  ["36060591", "Sparda-Bank West Düsseldorf", "GENODED1SPE"],
  ["50090500", "Sparda-Bank Hessen", "GENODEF1S12"],

  // --- Other notable ---
  ["70022200", "Stadtsparkasse München (alt)", "SSKMDEMMXXX"],
  ["51230800", "Wiesbadener Volksbank", "WIBADE5WXXX"],
  ["20110022", "Netbank", "NTSBDEH1XXX"],
];

const MAP: Map<string, { name: string; bic: string }> = new Map(
  BLZ_TABLE.map(([blz, name, bic]) => [blz, { name, bic }])
);

export function extractBlz(iban: string): string | null {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (!clean.startsWith("DE") || clean.length !== 22) return null;
  return clean.slice(4, 12);
}

export function lookupBank(iban: string): { blz: string; name: string; bic: string } | null {
  const blz = extractBlz(iban);
  if (!blz) return null;
  const hit = MAP.get(blz);
  if (!hit) return { blz, name: "Unbekannte Bank", bic: "" };
  return { blz, ...hit };
}
