/**
 * Vitest Test-Setup
 *
 * Wird vor jedem Test-Run einmal ausgefuehrt.
 * Konfiguriert in vitest.config.ts unter test.setupFiles.
 *
 * Verantwortlichkeiten:
 *   - Globale jest-dom Matcher registrieren (toBeInTheDocument,
 *     toHaveTextContent, toBeVisible, etc.)
 *   - happy-dom Cleanup zwischen Tests via @testing-library/react
 *     erfolgt automatisch (RTL v16+).
 *
 * Erweiterungen (zukuenftig):
 *   - MSW Server-Setup (falls API-Mocks benoetigt)
 *   - Globale Test-Utilities
 *   - i18n Test-Konfiguration
 */
import "@testing-library/jest-dom";
