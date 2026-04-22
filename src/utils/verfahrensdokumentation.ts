// Generator für eine "Verfahrensdokumentation" gemäß GoBD-Leitfaden.
//
// WICHTIGER HINWEIS: Dieses Skript erzeugt ein VORLAGEN-Dokument auf Basis
// der technischen Angaben aus der laufenden Installation. Es ersetzt keine
// individuell geprüfte Verfahrensdokumentation durch Steuerberater:in oder
// IT-Revision — der produzierte PDF-Inhalt trägt am Anfang eine
// entsprechende Haftungseinschränkung.
//
// Quellen:
//   - Settings (Stammdaten, Mahnwesen-Konfiguration, IBAN etc.)
//   - Store/Supabase (Anzahl Konten, Mandanten, Buchungen — als Metrik,
//     keine personenbezogenen Daten der Buchungen selbst)
//   - CompanyContext (aktive Firma, Mitglieder + Rollen)
//   - Deadlines-Einstellungen
//   - Retention-Konfiguration
//   - Audit-Log-Status (Anzahl Einträge, Verifikationsstatus)

import type { Settings } from "../contexts/SettingsContext";
import type { CompanyMembership, CompanyRole } from "../contexts/CompanyContext";

export type VerfahrensdokuData = {
  generatedAt: string; // ISO
  /** Wird vom Ersteller ausgefüllt (Name, Rolle) */
  erstellerName: string;
  erstellerRolle: string;
  /** Frei formulierte Zweckbindung */
  zweck: string;

  /** 1. Unternehmensinformationen */
  unternehmen: {
    name: string;
    anschrift: string;
    steuernummer: string;
    ustId: string;
    email: string;
    telefon: string;
    iban: string;
    bic: string;
  };

  /** 2. IT-Systemübersicht */
  itSystem: {
    produktName: string;
    produktVersion: string;
    auslieferungsform: "Browser-App (SPA)";
    speicherung:
      | "lokal im Browser (DEMO_MODE)"
      | "Supabase Postgres (Cloud) mit Row Level Security";
    transportverschluesselung: string;
    datenhaltungOrt: string;
    backupPfad: string;
    abhaengigkeiten: string[];
  };

  /** 3. Benutzerrollen und -berechtigungen */
  rollen: {
    role: CompanyRole;
    beschreibung: string;
    anzahl: number;
  }[];
  memberships: CompanyMembership[];

  /** 4. Datenschutz und Sicherheit */
  datenschutz: {
    auftragsverarbeiter: string;
    dsgvoHinweis: string;
    loeschfristen: string;
    authMethoden: string[];
    sitzungsTimeoutMinuten: number;
    hashAlgorithmus: string;
  };

  /** 5. Aufbewahrungsrichtlinien */
  aufbewahrung: {
    pflichtJahre: number;
    retentionQuelle: string;
    belegArchiv: string;
  };

  /** 6. Kennzahlen */
  metriken: {
    anzahlKonten: number;
    anzahlMandanten: number;
    anzahlBuchungen: number;
    anzahlStornos: number;
    anzahlKorrekturen: number;
    anzahlBelege: number;
    anzahlAuditEintraege: number;
    anzahlArchivierteRechnungen: number;
    auditChainStatus: "nicht geprüft" | "ok" | "defekt";
    journalChainStatus: "nicht geprüft" | "ok" | "defekt";
  };

  /** 7. Verfahrensabläufe */
  verfahren: {
    titel: string;
    schritte: string[];
  }[];

  /** 8. Systemprotokollierung */
  systemProtokoll: {
    auditLog: string;
    appLog: string;
    journalChain: string;
    archivChain: string;
  };

  /** 9. Änderungsprotokoll (Diff vs. Vorversion) */
  changelog: {
    version: number;
    previousGeneratedAt: string | null;
    changes: string[];
  };
};

export type DataCollectorInput = {
  settings: Settings;
  memberships: CompanyMembership[];
  activeCompanyId: string | null;
  idleTimeoutMinutes: number;
  erstellerName: string;
  erstellerRolle: string;
  zweck: string;
  produktVersion: string;
  isSupabase: boolean;
  counts: {
    accounts: number;
    clients: number;
    entries: number;
    stornos: number;
    corrections: number;
    documents: number;
    audit: number;
    archivedInvoices: number;
  };
  auditChainStatus: VerfahrensdokuData["metriken"]["auditChainStatus"];
  journalChainStatus: VerfahrensdokuData["metriken"]["journalChainStatus"];
};

const ROLE_DESCRIPTION: Record<CompanyRole, string> = {
  owner:
    "Eigentümer:in: vollständige Rechte inkl. Firmenlöschung und Rollenvergabe.",
  admin:
    "Administrator:in: Nutzerverwaltung, Stammdaten, alle Buchungen. Ohne Eigentümerrechte.",
  member:
    "Sachbearbeiter:in: Buchen, Mahnen, Belegverwaltung. Keine Nutzerverwaltung.",
  readonly:
    "Nur-Lese-Zugriff für interne Kolleg:innen oder laufende Prüfungen.",
  tax_auditor:
    "Externe Betriebsprüfung: Lesezugriff auf Prüfer-Dashboard, GDPdU-Export, Audit-Log.",
};

export function collectVerfahrensdoku(
  input: DataCollectorInput
): VerfahrensdokuData {
  const roleCounts: Record<CompanyRole, number> = {
    owner: 0,
    admin: 0,
    member: 0,
    readonly: 0,
    tax_auditor: 0,
  };
  for (const m of input.memberships) {
    roleCounts[m.role] = (roleCounts[m.role] ?? 0) + 1;
  }

  const rollen = (Object.keys(roleCounts) as CompanyRole[]).map((role) => ({
    role,
    beschreibung: ROLE_DESCRIPTION[role],
    anzahl: roleCounts[role],
  }));

  return {
    generatedAt: new Date().toISOString(),
    erstellerName: input.erstellerName,
    erstellerRolle: input.erstellerRolle,
    zweck: input.zweck,

    unternehmen: {
      name: input.settings.kanzleiName || "—",
      anschrift:
        [
          input.settings.kanzleiStrasse,
          [input.settings.kanzleiPlz, input.settings.kanzleiOrt]
            .filter(Boolean)
            .join(" "),
        ]
          .filter(Boolean)
          .join(", ") || "—",
      steuernummer: input.settings.defaultSteuernummer || "—",
      ustId: "—",
      email: input.settings.kanzleiEmail || "—",
      telefon: input.settings.kanzleiTelefon || "—",
      iban: input.settings.kanzleiIban || "—",
      bic: input.settings.kanzleiBic || "—",
    },

    itSystem: {
      produktName: "harouda-app",
      produktVersion: input.produktVersion,
      auslieferungsform: "Browser-App (SPA)",
      speicherung: input.isSupabase
        ? "Supabase Postgres (Cloud) mit Row Level Security"
        : "lokal im Browser (DEMO_MODE)",
      transportverschluesselung: input.isSupabase
        ? "TLS 1.2+ zum Supabase-Endpunkt, HTTP Strict-Transport-Security"
        : "nicht relevant (keine Datenübertragung)",
      datenhaltungOrt: input.isSupabase
        ? "Supabase-Projekt-Region (konfigurierbar; i. d. R. Frankfurt)"
        : "ausschließlich Browser-LocalStorage auf dem Endgerät",
      backupPfad: input.isSupabase
        ? "Manuelle Backups via Einstellungen/Backup; Supabase-Point-in-Time-Recovery gemäß Projekt-Tarif"
        : "Manuelle JSON-Exports via Einstellungen/Backup",
      abhaengigkeiten: [
        "React 19 (UI)",
        "@supabase/supabase-js (Backend)",
        "@tanstack/react-query (Datencache)",
        "jsPDF + jspdf-autotable (PDF-Erzeugung)",
        "ExcelJS (XLSX-Export)",
        "JSZip (GDPdU/IDEA-Paket)",
      ],
    },

    rollen,
    memberships: input.memberships,

    datenschutz: {
      auftragsverarbeiter: input.isSupabase
        ? "Supabase Inc. als Cloud-Backend (AV-Vertrag gemäß Art. 28 DSGVO mit Supabase abschließen)."
        : "Keine externen Auftragsverarbeiter — Betrieb rein lokal.",
      dsgvoHinweis:
        "Die App speichert personenbezogene Daten von Mandant:innen und Nutzer:innen. Betroffenenrechte (Art. 15–22 DSGVO) sind durch Export- und Löschfunktionen in den Einstellungen umsetzbar.",
      loeschfristen:
        "Handels- und steuerrechtliche Aufbewahrungspflichten gehen DSGVO-Löschansprüchen vor, solange sie laufen.",
      authMethoden: input.isSupabase
        ? ["E-Mail/Passwort", "Passwort-Reset via E-Mail-Link"]
        : ["kein Auth (Demo-Modus, lokaler Browser)"],
      sitzungsTimeoutMinuten: input.idleTimeoutMinutes,
      hashAlgorithmus:
        "SHA-256 für den Audit-Log (Hash-Kette pro Firma, verifizierbar im Audit-Log-Modul).",
    },

    aufbewahrung: {
      pflichtJahre: 10,
      retentionQuelle:
        "§ 147 AO (10 Jahre für Buchungen, Jahresabschlüsse, relevante Unterlagen; 6 Jahre für Geschäftsbriefe und sonstige steuerrelevante Unterlagen).",
      belegArchiv: input.isSupabase
        ? "Belege werden in Supabase Storage abgelegt; Löschung erst nach Ablauf der Aufbewahrungsfrist."
        : "Belege werden als Anhänge im Browser-Storage referenziert; manuelle Sicherung erforderlich.",
    },

    metriken: {
      anzahlKonten: input.counts.accounts,
      anzahlMandanten: input.counts.clients,
      anzahlBuchungen: input.counts.entries,
      anzahlStornos: input.counts.stornos,
      anzahlKorrekturen: input.counts.corrections,
      anzahlBelege: input.counts.documents,
      anzahlAuditEintraege: input.counts.audit,
      anzahlArchivierteRechnungen: input.counts.archivedInvoices,
      auditChainStatus: input.auditChainStatus,
      journalChainStatus: input.journalChainStatus,
    },

    verfahren: [
      {
        titel: "Eingehende E-Rechnung (ZUGFeRD / Factur-X / XRechnung)",
        schritte: [
          "1. Upload durch berechtigte:n Mitarbeiter:in (PDF/A-3 oder XML)",
          "2. Extraktion der eingebetteten CII/UBL-XML mittels PDF-Anhangs-Parser",
          "3. Validierung: USt-Sätze (0/7/19 %), Pflichtfelder (Rechnungsnr., Datum, Summen)",
          "4. Archivierung: Original-Datei + XML + SHA-256-Hash, Retention = Upload + 10 Jahre",
          "5. Optional: Erzeugung einer Buchung (Lieferantenverbindlichkeit) mit Verweis auf Archiv-ID",
          "6. Audit-Log-Eintrag für Upload, Archivierung und ggf. Buchung",
        ],
      },
      {
        titel: "Buchungsworkflow (Journal)",
        schritte: [
          "1. Buchung wird im Entwurf-Status angelegt (status='entwurf')",
          "2. Freigabe durch Mitarbeiter:in — status wechselt auf 'gebucht'",
          "3. Bei Buchung wird ein SHA-256 Hash berechnet und in der Journal-Kette verkettet",
          `4. Nach ${input.idleTimeoutMinutes / 60 > 0 ? "Auto-Festschreibung" : "Sofort-Festschreibung"} (konfigurierbar) ist Änderung nur noch per Storno möglich`,
          "5. Stornobuchung: Gegenbuchung mit vertauschten Konten + Pflicht-Begründung",
          "6. Korrekturbuchung: Storno + neue Buchung in einem Schritt",
        ],
      },
      {
        titel: "Export für Finanzbehörden (GDPdU / IDEA)",
        schritte: [
          "1. Admin/Owner oder tax_auditor startet den Export im Prüfer-Dashboard",
          "2. ZIP mit index.xml, Kontenplan, Journal (inkl. Storno- und Korrekturbuchungen), Audit-Log",
          "3. Export-Ereignis wird im Audit-Log protokolliert (Aktion 'export')",
        ],
      },
      {
        titel: "Benutzer- und Rollenverwaltung",
        schritte: [
          "1. Owner legt weitere Mitglieder an (Rolle: admin, member, readonly oder tax_auditor)",
          "2. Prüfer-Zugänge können zeitlich begrenzt werden (access_valid_until)",
          "3. Rolle wird bei jedem Datenzugriff via Supabase Row Level Security erzwungen",
          "4. Rollenänderungen landen im Audit-Log (Aktion 'update', Entity 'auth')",
        ],
      },
    ],

    systemProtokoll: {
      auditLog:
        "audit_log (WORM): jede buchhalterisch relevante Änderung mit Vorher-/Nachher-Snapshot, Zeitstempel, Nutzer-Kennung und verkettetem SHA-256-Hash. UPDATE/DELETE durch DB-Trigger blockiert.",
      appLog:
        "app_logs: technische Ereignisse (Fehler, Diagnose). Keine Hash-Kette, Admin-Rotation erlaubt. Level: debug/info/warn/error. Enthält KEINE buchhalterischen Änderungen.",
      journalChain:
        "journal_entries.entry_hash: SHA-256 über die unveränderbaren Kernfelder (Datum, Beleg-Nr., Soll/Haben-Konto, Betrag, Beschreibung, parent_entry_id). Server-Trigger + Client-Verifikation.",
      archivChain:
        "invoice_archive.content_sha256 und invoice_xml_archive.xml_sha256: Prüfsummen für Original-Datei und extrahierte XML. Manuelle Integritätsprüfung aus dem Archiv-Viewer.",
    },

    changelog: {
      version: 1,
      previousGeneratedAt: null,
      changes: [],
    },
  };
}

const VDOKU_PREV_KEY = "harouda:verfahrensdoku:previous";

type PreviousSnapshot = {
  generatedAt: string;
  version: number;
  unternehmen: VerfahrensdokuData["unternehmen"];
  itSystem: VerfahrensdokuData["itSystem"];
  rollen: VerfahrensdokuData["rollen"];
  datenschutz: VerfahrensdokuData["datenschutz"];
  aufbewahrung: VerfahrensdokuData["aufbewahrung"];
};

function loadPrevious(): PreviousSnapshot | null {
  try {
    const raw = localStorage.getItem(VDOKU_PREV_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PreviousSnapshot;
  } catch {
    return null;
  }
}

function savePrevious(data: VerfahrensdokuData): void {
  const snap: PreviousSnapshot = {
    generatedAt: data.generatedAt,
    version: data.changelog.version,
    unternehmen: data.unternehmen,
    itSystem: data.itSystem,
    rollen: data.rollen,
    datenschutz: data.datenschutz,
    aufbewahrung: data.aufbewahrung,
  };
  try {
    localStorage.setItem(VDOKU_PREV_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

function diffObjects(
  prev: Record<string, unknown>,
  curr: Record<string, unknown>,
  prefix = ""
): string[] {
  const out: string[] = [];
  const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
  for (const k of keys) {
    const label = prefix ? `${prefix}.${k}` : k;
    const a = prev[k];
    const b = curr[k];
    if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
      out.push(
        ...diffObjects(
          a as Record<string, unknown>,
          b as Record<string, unknown>,
          label
        )
      );
    } else if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push(`${label}: "${String(a ?? "—")}" → "${String(b ?? "—")}"`);
    }
  }
  return out;
}

/** Berechnet das Änderungsprotokoll gegenüber der zuletzt erzeugten Version
 *  (falls vorhanden) und speichert die neue Momentaufnahme für den nächsten
 *  Generierungslauf. */
export function applyChangelog(data: VerfahrensdokuData): VerfahrensdokuData {
  const prev = loadPrevious();
  if (!prev) {
    data.changelog.version = 1;
    data.changelog.previousGeneratedAt = null;
    data.changelog.changes = [];
  } else {
    data.changelog.version = prev.version + 1;
    data.changelog.previousGeneratedAt = prev.generatedAt;
    const changes: string[] = [];
    changes.push(
      ...diffObjects(
        prev.unternehmen as unknown as Record<string, unknown>,
        data.unternehmen as unknown as Record<string, unknown>,
        "Unternehmen"
      )
    );
    changes.push(
      ...diffObjects(
        prev.itSystem as unknown as Record<string, unknown>,
        data.itSystem as unknown as Record<string, unknown>,
        "IT"
      )
    );
    changes.push(
      ...diffObjects(
        prev.datenschutz as unknown as Record<string, unknown>,
        data.datenschutz as unknown as Record<string, unknown>,
        "Datenschutz"
      )
    );
    changes.push(
      ...diffObjects(
        prev.aufbewahrung as unknown as Record<string, unknown>,
        data.aufbewahrung as unknown as Record<string, unknown>,
        "Aufbewahrung"
      )
    );
    const prevRoles = new Map(prev.rollen.map((r) => [r.role, r.anzahl]));
    for (const r of data.rollen) {
      const p = prevRoles.get(r.role);
      if (p !== r.anzahl) {
        changes.push(
          `Rollenanzahl ${r.role}: ${p ?? 0} → ${r.anzahl}`
        );
      }
    }
    data.changelog.changes = changes;
  }
  savePrevious(data);
  return data;
}

export async function buildVerfahrensdokuPdf(
  data: VerfahrensdokuData
): Promise<Uint8Array> {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  function addHeading(text: string, size = 16) {
    if (y > pageH - margin - 60) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e3a8a");
    doc.setFontSize(size);
    doc.text(text, margin, y);
    y += size + 8;
    doc.setDrawColor("#f59e0b");
    doc.setLineWidth(1);
    doc.line(margin, y - 4, pageW - margin, y - 4);
    y += 6;
  }

  function addParagraph(text: string, size = 10) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#1f2937");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    if (y + lines.length * (size + 3) > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * (size + 3) + 6;
  }

  function addKeyValue(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      body: rows,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
        textColor: "#1f2937",
      },
      columnStyles: {
        0: {
          cellWidth: 170,
          fontStyle: "bold",
          textColor: "#475569",
        },
        1: { cellWidth: pageW - margin * 2 - 170 },
      },
      margin: { left: margin, right: margin },
    });
    const after = (doc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable;
    y = (after?.finalY ?? y) + 14;
  }

  // ----- Titelseite -------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#1e3a8a");
  doc.text("Verfahrensdokumentation", margin, y + 30);
  doc.setFontSize(12);
  doc.setTextColor("#6b7280");
  doc.text(
    "gemäß GoBD-Leitfaden (§ 146 AO, GoBD 2020)",
    margin,
    y + 50
  );
  y += 90;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#374151");
  doc.text(
    `Erstellt am: ${new Date(data.generatedAt).toLocaleString("de-DE")}`,
    margin,
    y
  );
  y += 16;
  doc.text(
    `Ersteller:in: ${data.erstellerName} (${data.erstellerRolle})`,
    margin,
    y
  );
  y += 16;
  doc.text(`Unternehmen: ${data.unternehmen.name}`, margin, y);
  y += 30;

  // Haftungseinschränkung
  doc.setFillColor("#fef3c7");
  doc.setDrawColor("#f59e0b");
  const boxY = y;
  const boxH = 78;
  doc.roundedRect(margin, boxY, pageW - margin * 2, boxH, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#92400e");
  doc.setFontSize(10);
  doc.text("Hinweis zur Verbindlichkeit", margin + 12, boxY + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#374151");
  const notice =
    "Dieses Dokument ist eine automatisch generierte VORLAGE auf Basis der " +
    "Konfigurationsdaten der harouda-app-Installation. Es ersetzt keine " +
    "individuell durch Steuerberater:in oder IT-Revision geprüfte " +
    "Verfahrensdokumentation. Ergänzen Sie organisatorische Regelungen, " +
    "Freigabe- und Kontrollprozesse schriftlich, bevor Sie das Dokument " +
    "der Finanzverwaltung vorlegen.";
  const noticeLines = doc.splitTextToSize(notice, pageW - margin * 2 - 24);
  doc.text(noticeLines, margin + 12, boxY + 34);
  y = boxY + boxH + 18;

  addParagraph(`Zweck dieses Dokuments: ${data.zweck || "—"}`);

  // ----- 1. Unternehmensinformationen ------------------------------------
  doc.addPage();
  y = margin;
  addHeading("1. Unternehmensinformationen");
  addKeyValue([
    ["Firmenname", data.unternehmen.name],
    ["Anschrift", data.unternehmen.anschrift],
    ["Steuernummer", data.unternehmen.steuernummer],
    ["USt-IdNr.", data.unternehmen.ustId],
    ["E-Mail", data.unternehmen.email],
    ["Telefon", data.unternehmen.telefon],
    ["IBAN", data.unternehmen.iban],
    ["BIC", data.unternehmen.bic],
  ]);

  // ----- 2. IT-Systemübersicht -------------------------------------------
  addHeading("2. IT-Systemübersicht");
  addKeyValue([
    ["Produkt", data.itSystem.produktName],
    ["Version", data.itSystem.produktVersion],
    ["Auslieferungsform", data.itSystem.auslieferungsform],
    ["Datenspeicherung", data.itSystem.speicherung],
    ["Transportverschlüsselung", data.itSystem.transportverschluesselung],
    ["Datenhaltungs-Ort", data.itSystem.datenhaltungOrt],
    ["Backup-Verfahren", data.itSystem.backupPfad],
  ]);
  addParagraph("Zentrale Bibliotheken:");
  addKeyValue(
    data.itSystem.abhaengigkeiten.map((lib, i) => [
      `Komponente ${i + 1}`,
      lib,
    ])
  );

  // ----- 3. Benutzerrollen und -berechtigungen ---------------------------
  addHeading("3. Benutzerrollen und -berechtigungen");
  addParagraph(
    "Das System verwendet ein Rollenmodell auf Firmenebene. Jede Person ist " +
      "genau einer Firma pro Zugang zugeordnet. Rollen werden zentral vom " +
      "Owner/Admin vergeben."
  );
  autoTable(doc, {
    startY: y,
    head: [["Rolle", "Beschreibung", "Anzahl"]],
    body: data.rollen.map((r) => [r.role, r.beschreibung, String(r.anzahl)]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: "#fcd34d",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: "bold" },
      2: { halign: "right", cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
  });
  y =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y;
  y += 14;

  // ----- 4. Datenschutz und Sicherheit -----------------------------------
  addHeading("4. Datenschutz und Sicherheit");
  addKeyValue([
    ["Auftragsverarbeitung", data.datenschutz.auftragsverarbeiter],
    ["DSGVO-Hinweis", data.datenschutz.dsgvoHinweis],
    ["Lösch- und Aufbewahrungsbalance", data.datenschutz.loeschfristen],
    [
      "Authentisierungsverfahren",
      data.datenschutz.authMethoden.join(", "),
    ],
    [
      "Sitzungs-Timeout (Inaktivität)",
      `${data.datenschutz.sitzungsTimeoutMinuten} Minuten (clientseitig)`,
    ],
    ["Audit-Log-Algorithmus", data.datenschutz.hashAlgorithmus],
  ]);

  // ----- 5. Aufbewahrungsrichtlinien -------------------------------------
  addHeading("5. Aufbewahrungsrichtlinien");
  addKeyValue([
    [
      "Gesetzliche Pflichtdauer",
      `${data.aufbewahrung.pflichtJahre} Jahre (§ 147 AO)`,
    ],
    ["Normenquelle", data.aufbewahrung.retentionQuelle],
    ["Beleg-Archiv", data.aufbewahrung.belegArchiv],
  ]);

  // ----- 6. Änderungsprotokoll & Kennzahlen ------------------------------
  addHeading("6. Änderungsprotokoll und Kennzahlen");
  addParagraph(
    "Kennzahlen zum Zeitpunkt der Erzeugung dieses Dokuments. Das vollständige " +
      "Änderungsprotokoll liegt im Audit-Log-Modul vor und kann dort verifiziert " +
      "(SHA-256-Kette) sowie als CSV/JSON exportiert werden."
  );
  addKeyValue([
    ["Konten im Kontenplan", String(data.metriken.anzahlKonten)],
    ["Mandanten", String(data.metriken.anzahlMandanten)],
    ["Buchungen gesamt", String(data.metriken.anzahlBuchungen)],
    ["davon Stornobuchungen", String(data.metriken.anzahlStornos)],
    ["davon Korrekturbuchungen", String(data.metriken.anzahlKorrekturen)],
    ["Belege im Archiv", String(data.metriken.anzahlBelege)],
    ["E-Rechnungen im Archiv", String(data.metriken.anzahlArchivierteRechnungen)],
    ["Audit-Log-Einträge", String(data.metriken.anzahlAuditEintraege)],
    ["Audit-Ketten-Status", data.metriken.auditChainStatus],
    ["Journal-Ketten-Status", data.metriken.journalChainStatus],
  ]);

  // ----- 7. Verfahrensabläufe --------------------------------------------
  addHeading("7. Verfahrensabläufe");
  addParagraph(
    "Die zentralen Arbeitsprozesse mit technischen und organisatorischen " +
      "Kontrollpunkten. Jeder Prozessschritt erzeugt mindestens einen Audit-Log-Eintrag."
  );
  for (const proc of data.verfahren) {
    if (y > pageH - margin - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#1e3a8a");
    doc.text(proc.titel, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#1f2937");
    for (const schritt of proc.schritte) {
      const lines = doc.splitTextToSize(schritt, pageW - margin * 2 - 12);
      if (y + lines.length * 13 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin + 12, y);
      y += lines.length * 13;
    }
    y += 10;
  }

  // ----- 8. Systemprotokollierung ----------------------------------------
  addHeading("8. Systemprotokollierung");
  addParagraph(
    "Trennung zwischen buchhalterisch relevantem Audit-Log (WORM, Hash-Kette) " +
      "und technischem System-Log (Rotation erlaubt). Ketten sind unabhängig " +
      "voneinander prüfbar."
  );
  addKeyValue([
    ["Audit-Log (WORM)", data.systemProtokoll.auditLog],
    ["App-Log", data.systemProtokoll.appLog],
    ["Journal-Kette", data.systemProtokoll.journalChain],
    ["Archiv-Prüfsummen", data.systemProtokoll.archivChain],
  ]);

  // ----- 9. Änderungsprotokoll -------------------------------------------
  addHeading("9. Änderungsprotokoll");
  addKeyValue([
    ["Version", String(data.changelog.version)],
    [
      "Vorherige Version erzeugt am",
      data.changelog.previousGeneratedAt
        ? new Date(data.changelog.previousGeneratedAt).toLocaleString("de-DE")
        : "— (erste Version)",
    ],
    [
      "Diese Version erzeugt am",
      new Date(data.generatedAt).toLocaleString("de-DE"),
    ],
  ]);
  if (data.changelog.changes.length === 0) {
    addParagraph(
      data.changelog.version === 1
        ? "Erste Generierung — keine Änderungen zum Vergleich."
        : "Keine Änderungen in relevanten Abschnitten seit der letzten Generierung."
    );
  } else {
    addParagraph("Seit der letzten Generierung wurden erfasst:");
    for (const change of data.changelog.changes) {
      const lines = doc.splitTextToSize(
        "• " + change,
        pageW - margin * 2 - 12
      );
      if (y + lines.length * 13 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin + 12, y);
      y += lines.length * 13 + 2;
    }
  }

  // ----- Unterschriftenzeile ---------------------------------------------
  if (y > pageH - margin - 120) {
    doc.addPage();
    y = margin;
  }
  y += 30;
  doc.setDrawColor("#94a3b8");
  doc.line(margin, y, margin + 200, y);
  doc.line(pageW - margin - 200, y, pageW - margin, y);
  doc.setFontSize(9);
  doc.setTextColor("#6b7280");
  doc.text("Ort, Datum", margin, y + 14);
  doc.text("Unterschrift Verantwortliche:r", pageW - margin - 200, y + 14);

  // Footer auf allen Seiten
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor("#94a3b8");
    doc.text(
      `harouda-app · Verfahrensdokumentation (Vorlage) · Seite ${i} / ${pageCount}`,
      margin,
      pageH - 20
    );
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
