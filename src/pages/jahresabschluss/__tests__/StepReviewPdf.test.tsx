/** @jsxImportSource react */
// Jahresabschluss-E3b / Schritt 6 · StepReview PDF-Generate-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  StepReview,
  buildPdfInputFromWizardState,
} from "../StepReview";
import { updateStep } from "../../../domain/jahresabschluss/wizardStore";
import type { WizardState } from "../../../domain/jahresabschluss/WizardTypes";
import { HGB267_SCHWELLENWERTE_2025 } from "../../../domain/accounting/HgbSizeClassifier";
import { computeBausteine } from "../../../domain/jahresabschluss/RulesEngine";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-rv-pdf-test";
const JAHR = 2025;

function fullState(): WizardState {
  return {
    sessionId: "sess-pdf",
    mandantId: MANDANT,
    jahr: JAHR,
    currentStep: "review",
    completedSteps: ["validation", "rechtsform", "groessenklasse", "bausteine"],
    data: {
      validation: {
        mandant_id: MANDANT,
        jahr: JAHR,
        stichtag: "2025-12-31",
        findings: [],
        darf_jahresabschluss_erstellen: true,
      },
      rechtsform: {
        rechtsform: "GmbH",
        hrb_nummer: "HRB 99999",
        hrb_gericht: "Berlin",
        gezeichnetes_kapital: 50000,
        geschaeftsfuehrer: [
          { name: "Max Mustermann", funktion: "geschaeftsfuehrer" },
        ],
      },
      groessenklasse: {
        klasse: "mittel",
        erfuellte_kriterien: 3,
        gilt_als_erfuellt: true,
        schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
        begruendung: ["Test"],
      },
      bausteine: computeBausteine({
        rechtsform: "GmbH",
        groessenklasse: "mittel",
      }),
    },
    created_at: "2026-04-23T08:00:00Z",
    updated_at: "2026-04-23T08:00:00Z",
  };
}

function renderStep(opts: {
  state: WizardState;
  downloadImpl?: (doc: TDocumentDefinitions, name: string) => Promise<void>;
  firmenname?: string;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <StepReview
        state={opts.state}
        mandantId={MANDANT}
        jahr={JAHR}
        onAdvance={vi.fn()}
        onRefresh={() => {}}
        downloadImpl={opts.downloadImpl}
        firmenname={opts.firmenname}
      />
    );
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 8) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  updateStep(MANDANT, JAHR, { currentStep: "review" });
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("StepReview · PDF-Generate", () => {
  it("#1 buildPdfInputFromWizardState: liefert valides Input-Objekt fuer GmbH mittel", () => {
    const input = buildPdfInputFromWizardState(fullState(), { entwurf: false });
    expect(input).not.toBeNull();
    expect(input!.cover.rechtsform).toBe("GmbH");
    expect(input!.cover.hrb_nummer).toBe("HRB 99999");
    expect(input!.cover.stichtag).toBe("31.12.2025");
    expect(input!.cover.groessenklasse).toBe("mittel");
    expect(input!.cover.berichtsart).toBe("Jahresabschluss");
    expect(input!.bausteine.anhang).toBe(true);
    expect(input!.bausteine.lagebericht).toBe(true);
  });

  it("#2 buildPdfInputFromWizardState mit entwurf=true -> berichtsart='Entwurf'", () => {
    const input = buildPdfInputFromWizardState(fullState(), { entwurf: true });
    expect(input!.cover.berichtsart).toBe("Entwurf");
  });

  it("#3 buildPdfInputFromWizardState: unvollstaendiger WizardState -> null", () => {
    const state: WizardState = {
      ...fullState(),
      data: {},
    };
    const input = buildPdfInputFromWizardState(state, { entwurf: false });
    expect(input).toBeNull();
  });

  it("#4 PDF-Generate-Button klick: ruft downloadImpl mit korrektem Dateinamen + docDef", async () => {
    const download = vi.fn().mockResolvedValue(undefined);
    const r = renderStep({
      state: fullState(),
      downloadImpl: download,
      firmenname: "Kühn Musterfirma",
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-generate-pdf"]'
    )!;
    expect(btn).not.toBeNull();
    await act(async () => {
      btn.click();
      await flush();
    });
    expect(download).toHaveBeenCalledTimes(1);
    const [docDef, fileName] = download.mock.calls[0] as [
      TDocumentDefinitions,
      string
    ];
    expect(fileName).toContain("Kühn");
    expect(fileName).toContain("2025");
    expect(fileName.endsWith(".pdf")).toBe(true);
    expect(fileName).not.toContain("ENTWURF");
    expect(docDef.pageSize).toBe("A4");
    expect(docDef.watermark).toBeUndefined();
    r.unmount();
  });

  it("#5 Entwurfs-Modus: Dateiname enthält '-ENTWURF' und docDef.watermark gesetzt", async () => {
    const download = vi.fn().mockResolvedValue(undefined);
    const r = renderStep({
      state: fullState(),
      downloadImpl: download,
      firmenname: "TestFirma",
    });
    // Entwurf-Toggle aktivieren.
    act(() =>
      document
        .querySelector<HTMLInputElement>('[data-testid="entwurf-toggle"]')!
        .click()
    );
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-generate-pdf"]'
    )!;
    await act(async () => {
      btn.click();
      await flush();
    });
    expect(download).toHaveBeenCalledTimes(1);
    const [docDef, fileName] = download.mock.calls[0] as [
      TDocumentDefinitions,
      string
    ];
    expect(fileName).toContain("-ENTWURF");
    expect(docDef.watermark).toBeDefined();
  });

  it("#6 Download-Fehler: Fehler-Toast, kein Crash", async () => {
    const download = vi.fn().mockRejectedValue(new Error("fakeFail"));
    const r = renderStep({
      state: fullState(),
      downloadImpl: download,
      firmenname: "TestFirma",
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-generate-pdf"]'
    )!;
    await act(async () => {
      btn.click();
      await flush(12);
    });
    expect(download).toHaveBeenCalled();
    // Nach Fehler: Button wieder enabled.
    expect(btn.disabled).toBe(false);
    r.unmount();
  });
});
