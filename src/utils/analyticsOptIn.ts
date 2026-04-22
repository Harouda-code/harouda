// Opt-In-Analytics: Admins dürfen ein Analytics-Tool ihrer Wahl einbinden.
//
// Wir emittieren KEINE Events selbst. Wir injizieren nur das Script, das der
// Admin konfiguriert hat — so landet keine Telemetrie in einer Drittpartei,
// die der Admin nicht kennt. Datenschutz bleibt Verantwortung des
// Betreibers (Cookie-Banner, DSGVO-Einwilligung usw.).
//
// Unterstützt:
//   • Google Analytics 4  — Messung-ID der Form "G-XXXXXXXXXX"
//   • Plausible           — Domain-Name, ohne Protokoll
//
// Wird einmalig beim App-Start aus main.tsx aufgerufen.

function injectScript(src: string, attrs: Record<string, string> = {}): void {
  if (typeof document === "undefined") return;
  // Duplikate vermeiden
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
}

function injectInline(code: string, marker: string): void {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(`script[data-harouda="${marker}"]`);
  if (existing) return;
  const s = document.createElement("script");
  s.setAttribute("data-harouda", marker);
  s.text = code;
  document.head.appendChild(s);
}

export function enableGa4(measurementId: string): void {
  if (!/^G-[A-Z0-9]{5,}$/i.test(measurementId.trim())) return;
  const id = measurementId.trim();
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
  injectInline(
    `window.dataLayer = window.dataLayer || [];` +
      `function gtag(){dataLayer.push(arguments);}` +
      `gtag('js', new Date());` +
      `gtag('config', '${id}', { anonymize_ip: true });`,
    "ga4-init"
  );
}

export function enablePlausible(domain: string): void {
  const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*/, "");
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(clean)) return;
  injectScript("https://plausible.io/js/script.js", {
    defer: "true",
    "data-domain": clean,
  });
}

export type AnalyticsSettings = {
  ga4MeasurementId?: string;
  plausibleDomain?: string;
};

export function initAnalytics(settings: AnalyticsSettings): void {
  if (settings.ga4MeasurementId) enableGa4(settings.ga4MeasurementId);
  if (settings.plausibleDomain) enablePlausible(settings.plausibleDomain);
}
