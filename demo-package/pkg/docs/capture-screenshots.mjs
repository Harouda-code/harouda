// Optional: Automatische Screenshot-Aufnahme mit Playwright.
//
// Voraussetzung:  npm i -D playwright  &&  npx playwright install chromium
// Vorher:         Demo-Build auf http://localhost:8080 starten
// Aufruf:         node capture-screenshots.mjs
//
// Das Script navigiert zu jedem Screen der Präsentationsliste und speichert
// einen PNG-Screenshot in ./screenshots/. Timeouts sind großzügig gewählt,
// weil tesseract-WASM beim ersten Aufruf mehrere Sekunden braucht.

import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.DEMO_URL ?? "http://localhost:8080";
const OUTDIR = "screenshots";

fs.mkdirSync(OUTDIR, { recursive: true });

const SHOTS = [
  { id: "01-dashboard",        path: "/dashboard" },
  { id: "02-journal",          path: "/journal" },
  { id: "03-konten",           path: "/konten" },
  { id: "04-mandanten",        path: "/mandanten" },
  { id: "05-opos",             path: "/opos" },
  { id: "06-mahnwesen",        path: "/mahnwesen" },
  { id: "07-berichte",         path: "/berichte" },
  { id: "08-guv",              path: "/berichte/guv" },
  { id: "09-bwa",              path: "/berichte/bwa" },
  { id: "10-susa",             path: "/berichte/susa" },
  { id: "11-steuer-index",     path: "/steuer" },
  { id: "12-ustva",            path: "/steuer/ustva" },
  { id: "13-euer",             path: "/steuer/euer" },
  { id: "14-anlage-n",         path: "/steuer/anlage-n" },
  { id: "15-buchfuehrung",     path: "/buchfuehrung" },
  { id: "16-plausi",           path: "/buchfuehrung/plausi" },
  { id: "17-zuordnung",        path: "/buchfuehrung/zuordnung" },
  { id: "18-audit",            path: "/einstellungen/audit" },
  { id: "19-fristen",          path: "/einstellungen/fristen" },
  { id: "20-zugferd",          path: "/zugferd" },
];

function hashUrl(path) {
  // Demo-Build nutzt HashRouter, darum #/… statt /…
  return `${BASE}/#${path}`;
}

async function loginIfNeeded(page) {
  await page.goto(`${BASE}/`);
  // Landing page — click to login
  const loginLink = page.locator('a[href*="login"], a[href*="#/login"]').first();
  if (await loginLink.count()) {
    await loginLink.click().catch(() => {});
  } else {
    await page.goto(hashUrl("/login"));
  }
  // Click "Als Demo anmelden" button
  const demoBtn = page.getByRole("button", { name: /Als Demo anmelden/ });
  await demoBtn.waitFor({ timeout: 10_000 });
  await demoBtn.click();
  await page.waitForURL(/dashboard/i, { timeout: 10_000 });
}

async function closeTourIfOpen(page) {
  const skip = page.getByRole("button", { name: /Überspringen/ });
  if (await skip.count()) {
    await skip.click().catch(() => {});
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "de-DE",
  });
  const page = await context.newPage();

  try {
    await loginIfNeeded(page);
    await closeTourIfOpen(page);

    for (const shot of SHOTS) {
      await page.goto(hashUrl(shot.path));
      await page.waitForLoadState("networkidle").catch(() => {});
      await closeTourIfOpen(page);
      // Kurze Wartezeit, damit React-Query-Caches / Animationen abklingen
      await page.waitForTimeout(800);
      const out = `${OUTDIR}/${shot.id}.png`;
      await page.screenshot({ path: out, fullPage: false });
      console.log(`✓ ${out}`);
    }
  } finally {
    await browser.close();
  }
})();
