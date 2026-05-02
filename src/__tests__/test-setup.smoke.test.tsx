/**
 * Smoke-Test fuer die Test-Infrastruktur
 *
 * Verifiziert, dass:
 *   1. @testing-library/react korrekt installiert ist
 *   2. happy-dom als JSDOM-Ersatz funktioniert
 *   3. jest-dom Matcher registriert sind (siehe src/test-setup.ts)
 *   4. React 19 + RTL v16 zusammenarbeiten
 *
 * Dieser Test ist BEWUSST minimal. Er soll NUR die Infrastruktur
 * testen, nicht Geschaeftslogik.
 *
 * Falls dieser Test bricht, ist die gesamte UI-Test-Strategie
 * blockiert — daher als smoke-Test isoliert.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Test-Infrastruktur Smoke-Test", () => {
  it("rendert eine einfache Komponente und findet sie ueber screen", () => {
    function HelloComponent() {
      return <h1>Hallo Harouda</h1>;
    }

    render(<HelloComponent />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Hallo Harouda");
  });

  it("registriert jest-dom Matcher (toBeInTheDocument)", () => {
    function MarkerComponent() {
      return <div data-testid="marker">Vorhanden</div>;
    }

    render(<MarkerComponent />);

    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });
});
