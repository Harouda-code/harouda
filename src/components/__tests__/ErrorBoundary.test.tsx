/** @jsxImportSource react */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ErrorBoundary } from "../ErrorBoundary";
import { scrubSensitiveData } from "../../lib/monitoring/sentry";

/** Render helper using a real DOM container (happy-dom). */
function renderToContainer(ui: React.ReactElement): {
  container: HTMLDivElement;
  root: Root;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

function BoomOnMount(): never {
  throw new Error("kaboom: DE123456789 @ DE89370400440532013000");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Silence the noise React emits when an error bubbles through.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rendert Kinder, wenn kein Fehler auftritt", () => {
    const { container } = renderToContainer(
      <ErrorBoundary level="component">
        <span data-testid="ok">Alles gut</span>
      </ErrorBoundary>
    );
    expect(container.querySelector('[data-testid="ok"]')?.textContent).toBe(
      "Alles gut"
    );
  });

  it("zeigt Standard-Fallback, wenn ein Kind wirft", () => {
    const { container } = renderToContainer(
      <ErrorBoundary level="page" context="TestPage">
        <BoomOnMount />
      </ErrorBoundary>
    );
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).toContain("Ein Fehler ist aufgetreten");
  });

  it("rendert benutzerdefiniertes Fallback statt Standard-UI", () => {
    const { container } = renderToContainer(
      <ErrorBoundary
        level="component"
        fallback={<div data-testid="custom">custom fallback</div>}
      >
        <BoomOnMount />
      </ErrorBoundary>
    );
    expect(
      container.querySelector('[data-testid="custom"]')?.textContent
    ).toBe("custom fallback");
  });

  it("'Erneut versuchen' ruft onReset auf und versucht neu zu rendern", () => {
    const onReset = vi.fn();
    const { container } = renderToContainer(
      <ErrorBoundary level="section" onReset={onReset}>
        <BoomOnMount />
      </ErrorBoundary>
    );
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    act(() => {
      button!.click();
    });
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("Level 'page' erzeugt console.error mit Kontext", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderToContainer(
      <ErrorBoundary level="page" context="ReportPage">
        <BoomOnMount />
      </ErrorBoundary>
    );
    const msgs = spy.mock.calls.map((c) => String(c[0] ?? ""));
    expect(msgs.some((m) => m.includes("ReportPage"))).toBe(true);
  });

  it("Sentry scrubSensitiveData redigiert USt-IdNr und IBAN", () => {
    const scrubbed = scrubSensitiveData({
      message: "Error for DE123456789 with IBAN DE89 3704 0044 0532 0130 00",
      exception: {
        values: [
          {
            type: "Error",
            value: "kaboom: DE123456789 @ DE89370400440532013000",
          },
        ],
      },
    } as never);
    expect(scrubbed.message).not.toContain("DE123456789");
    expect(scrubbed.message).toContain("[REDACTED]");
    const exVal = scrubbed.exception?.values?.[0]?.value ?? "";
    expect(exVal).not.toContain("DE123456789");
    expect(exVal).not.toContain("DE89370400440532013000");
  });
});
