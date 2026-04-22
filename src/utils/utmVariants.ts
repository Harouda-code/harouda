// UTM-basierte Personalisierung der Landing-Page.
//
// Liest utm_campaign / utm_source aus der URL und wählt eine von wenigen
// festverdrahteten Varianten. Die Zuordnung ist bewusst klein und manuell —
// keine ML-/Segmentation-Engine. Alle Texte auf Deutsch, sachlich formuliert.
//
// Persistenz: sessionStorage (pro Session). Kein Long-term-Tracking.

export type VerticalKey =
  | "default"
  | "ecommerce"
  | "saas"
  | "consulting"
  | "kanzlei"
  | "switcher";

export type LandingVariant = {
  eyebrow: string;
  headlineTop: string;
  headlineEm: string;
  lead: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
};

const VARIANTS: Record<VerticalKey, LandingVariant> = {
  default: {
    eyebrow: "Für die digitale Steuerkanzlei",
    headlineTop: "Kanzlei-Software,",
    headlineEm: "so elegant wie Ihre Mandate.",
    lead:
      "harouda-app vereint Finanzbuchhaltung, Umsatzsteuer und " +
      "Einkommensteuer in einer ruhigen, präzisen Oberfläche — gedacht " +
      "für Steuerberater:innen, die Qualität vor Quantität stellen.",
    primaryCtaLabel: "Demo ausprobieren",
    secondaryCtaLabel: "Funktionen im Detail",
  },
  ecommerce: {
    eyebrow: "Für Online-Shops und Marktplätze",
    headlineTop: "Buchhaltung für",
    headlineEm: "Online-Shops — ohne Chaos.",
    lead:
      "Viele Rechnungen, viele Zahlungsabgleiche, viele Umsatzsteuer-Sätze. " +
      "harouda-app importiert Bank-Dateien (CAMT/MT940), liest ZUGFeRD/XRechnung " +
      "und bereitet die UStVA auf — inklusive ehrlicher Grenzen: kein " +
      "Shop-Connector, keine Plug-and-Play-Steuersätze für OSS.",
    primaryCtaLabel: "Shop-Buchhaltung starten",
    secondaryCtaLabel: "Vergleich ansehen",
  },
  saas: {
    eyebrow: "Für Software- und SaaS-Unternehmen",
    headlineTop: "Buchhaltung für",
    headlineEm: "wiederkehrende Umsätze.",
    lead:
      "Subscription-Abrechnung, Liquiditätsvorschau, Offene-Posten-Verwaltung " +
      "und DATEV-Export — für kleinere SaaS-Teams, die ihre Bücher selbst " +
      "führen oder der Kanzlei sauber übergeben wollen. Keine " +
      "Revenue-Recognition-Automatik; bei ASC 606 / IFRS 15 bleibt die " +
      "Steuerberater:in die primäre Quelle.",
    primaryCtaLabel: "Kostenlos testen",
    secondaryCtaLabel: "Funktionen im Detail",
  },
  consulting: {
    eyebrow: "Für Beratungs- und Dienstleistungsunternehmen",
    headlineTop: "Projektbezogene Buchhaltung —",
    headlineEm: "ohne Excel-Grab.",
    lead:
      "Mandanten-Filter pro Projekt, Kostenstellen-Zuordnung, BWA für jedes " +
      "Engagement separat, Mahnwesen mit Verzugszinsen § 288 BGB. " +
      "Kein CRM, kein Resource-Planner — nur die Buchhaltungs-Seite " +
      "sauber gemacht.",
    primaryCtaLabel: "Demo ausprobieren",
    secondaryCtaLabel: "Vergleich ansehen",
  },
  kanzlei: {
    eyebrow: "Für Steuerberater:innen mit mehreren Mandaten",
    headlineTop: "Mehr-Mandats-Buchhaltung —",
    headlineEm: "ohne DATEV-Schmerz.",
    lead:
      "Berater-Dashboard über alle Firmen, DATEV-EXTF-Export zur Übergabe " +
      "an Ihre Haupt-Software, Audit-Log mit Hash-Kette, Prüfer-Rolle " +
      "zeitlich befristbar. Zertifizierte DATEV-Integration ist NICHT " +
      "enthalten; wir liefern shape-kompatible Dateien für den Import.",
    primaryCtaLabel: "Berater-Demo starten",
    secondaryCtaLabel: "Vergleich ansehen",
  },
  switcher: {
    eyebrow: "Sie wechseln von einer anderen Lösung?",
    headlineTop: "Umstieg ohne Drama.",
    headlineEm: "Ehrlich über Stärken und Lücken.",
    lead:
      "harouda-app ist bewusst kein Rundum-Sorglos-Paket: kein Beleg-OCR " +
      "in Enterprise-Qualität, kein PSD2-Onlinebanking, keine " +
      "Lohnbuchhaltung in voller Tiefe. Dafür: lokaler Demo-Modus, " +
      "transparente Hash-Ketten, offener Quelltext und deutsche UI.",
    primaryCtaLabel: "Jetzt Demo anschauen",
    secondaryCtaLabel: "Ehrlicher Vergleich",
  },
};

const STORAGE_KEY = "harouda:landingVariant";

/** Ermittelt die Variante aus der URL und persistiert sie für die Session. */
export function resolveLandingVariant(href?: string): VerticalKey {
  if (typeof window === "undefined") return "default";

  // 1) Session-Persistenz zuerst — verhindert Flackern beim Client-Routing
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached && cached in VARIANTS) {
      // Wenn neue UTM-Parameter reinkommen, überschreiben wir. Sonst bleibt
      // der Session-Wert stehen.
      const url = new URL(href ?? window.location.href);
      const hasUtm = url.searchParams.has("utm_campaign") || url.searchParams.has("utm_source");
      if (!hasUtm) return cached as VerticalKey;
    }
  } catch {
    /* ignore */
  }

  const url = new URL(href ?? window.location.href);
  const campaign = (url.searchParams.get("utm_campaign") ?? "").toLowerCase();
  const source = (url.searchParams.get("utm_source") ?? "").toLowerCase();

  let pick: VerticalKey = "default";

  // Competitor-Switch
  if (
    ["datev", "sevdesk", "lexoffice", "lexware", "wiso", "taxpool"].some(
      (c) => source.includes(c) || campaign.includes(c)
    )
  ) {
    pick = "switcher";
  } else if (/shop|ecom|wooc|shopify|magento|amazon/.test(campaign + " " + source)) {
    pick = "ecommerce";
  } else if (/saas|software|subscription|api/.test(campaign + " " + source)) {
    pick = "saas";
  } else if (/consult|berat|agentur|freelance/.test(campaign + " " + source)) {
    pick = "consulting";
  } else if (/kanzlei|stb|steuerberat|berater/.test(campaign + " " + source)) {
    pick = "kanzlei";
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, pick);
  } catch {
    /* ignore */
  }
  return pick;
}

export function getLandingVariant(key: VerticalKey): LandingVariant {
  return VARIANTS[key];
}
