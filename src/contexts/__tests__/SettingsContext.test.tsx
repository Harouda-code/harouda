/** @jsxImportSource react */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

const mocks = vi.hoisted(() => ({
  fetchSettings: vi.fn(),
  saveSettings: vi.fn(),
  readPendingLocalStorageMigration: vi.fn(),
  markLocalStorageMigrationComplete: vi.fn(),
}));

vi.mock("../../api/supabase", () => ({
  DEMO_MODE: false,
  supabase: {},
}));

vi.mock("../../api/settings", () => ({
  fetchSettings: (...args: unknown[]) => mocks.fetchSettings(...args),
  saveSettings: (...args: unknown[]) => mocks.saveSettings(...args),
  readPendingLocalStorageMigration: (...args: unknown[]) =>
    mocks.readPendingLocalStorageMigration(...args),
  markLocalStorageMigrationComplete: (...args: unknown[]) =>
    mocks.markLocalStorageMigrationComplete(...args),
}));

import { SettingsProvider, useSettings } from "../SettingsContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Snapshot = {
  kanzleiName: string;
  rendered: boolean;
};

type SnapshotRef = { current: Snapshot | null };

function Probe({ snapRef }: { snapRef: SnapshotRef }) {
  const ctx = useSettings();
  useEffect(() => {
    snapRef.current = {
      kanzleiName: ctx.settings.kanzleiName,
      rendered: true,
    };
  });
  return null;
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

function renderProvider(): {
  container: HTMLDivElement;
  snapRef: SnapshotRef;
  unmount: () => void;
  loadingTextVisible: () => boolean;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const snapRef: SnapshotRef = { current: null };
  act(() => {
    root.render(
      <SettingsProvider>
        <Probe snapRef={snapRef} />
      </SettingsProvider>
    );
  });
  return {
    container,
    snapRef,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
    loadingTextVisible: () =>
      container.textContent?.includes("Einstellungen werden geladen") ?? false,
  };
}

describe("SettingsContext · Cloud-Mode Loading-Robustheit", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    mocks.fetchSettings.mockReset();
    mocks.saveSettings.mockReset();
    mocks.readPendingLocalStorageMigration.mockReset();
    mocks.markLocalStorageMigrationComplete.mockReset();
    mocks.readPendingLocalStorageMigration.mockReturnValue(null);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("laedt Settings im Cloud-Modus erfolgreich und entsperrt die UI", async () => {
    mocks.fetchSettings.mockResolvedValueOnce({
      kanzleiName: "Geladene Kanzlei",
    });

    const { snapRef, unmount, loadingTextVisible } = renderProvider();

    expect(loadingTextVisible()).toBe(true);
    expect(snapRef.current).toBeNull();

    await flushMicrotasks();

    expect(loadingTextVisible()).toBe(false);
    expect(snapRef.current?.rendered).toBe(true);
    expect(snapRef.current?.kanzleiName).toBe("Geladene Kanzlei");
    expect(mocks.fetchSettings).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("entsperrt die UI nach 5 Sekunden, wenn fetchSettings nicht aufloest", async () => {
    vi.useFakeTimers();
    mocks.fetchSettings.mockReturnValueOnce(new Promise(() => {}));

    const { snapRef, unmount, loadingTextVisible } = renderProvider();

    expect(loadingTextVisible()).toBe(true);
    expect(snapRef.current).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(4999);
    });
    expect(loadingTextVisible()).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(loadingTextVisible()).toBe(false);
    expect(snapRef.current?.rendered).toBe(true);
    expect(snapRef.current?.kanzleiName).toBe("Harouda Steuerberatung");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("did not settle within 5s")
    );
    unmount();
  });

  it("entsperrt die UI auch dann, wenn saveSettings im Migrations-Pfad haengt", async () => {
    vi.useFakeTimers();
    mocks.readPendingLocalStorageMigration.mockReturnValue({
      kanzleiName: "Migrationspayload",
    });
    mocks.saveSettings.mockReturnValueOnce(new Promise(() => {}));
    mocks.fetchSettings.mockReturnValueOnce(new Promise(() => {}));

    const { snapRef, unmount, loadingTextVisible } = renderProvider();

    expect(loadingTextVisible()).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(loadingTextVisible()).toBe(false);
    expect(snapRef.current?.rendered).toBe(true);
    expect(snapRef.current?.kanzleiName).toBe("Harouda Steuerberatung");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("did not settle within 5s")
    );
    unmount();
  });

  it("bei abgelehntem fetchSettings wird auf DEFAULTS zurueckgefallen", async () => {
    mocks.fetchSettings.mockRejectedValueOnce(new Error("network down"));

    const { snapRef, unmount, loadingTextVisible } = renderProvider();

    await flushMicrotasks();

    expect(loadingTextVisible()).toBe(false);
    expect(snapRef.current?.rendered).toBe(true);
    expect(snapRef.current?.kanzleiName).toBe("Harouda Steuerberatung");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[SettingsContext] Initial load failed:",
      expect.any(Error)
    );
    unmount();
  });

  it("loading completion bleibt idempotent, auch wenn Timeout und spaeteres Promise-Settlement auftreten", async () => {
    vi.useFakeTimers();
    let resolveFetch: (value: unknown) => void = () => {};
    mocks.fetchSettings.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { snapRef, unmount, loadingTextVisible } = renderProvider();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(loadingTextVisible()).toBe(false);
    const fallbackName = snapRef.current?.kanzleiName;
    expect(fallbackName).toBe("Harouda Steuerberatung");
    const warnCallsAfterTimeout = consoleWarnSpy.mock.calls.length;

    resolveFetch({ kanzleiName: "Late Arrival" });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(loadingTextVisible()).toBe(false);
    expect(snapRef.current?.kanzleiName).toBe(fallbackName);
    expect(consoleWarnSpy.mock.calls.length).toBe(warnCallsAfterTimeout);
    unmount();
  });

  it("clearTimeout wird beim Unmount ausgefuehrt", async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    mocks.fetchSettings.mockReturnValueOnce(new Promise(() => {}));

    const { unmount } = renderProvider();

    const callsBefore = clearSpy.mock.calls.length;
    unmount();
    const callsAfter = clearSpy.mock.calls.length;

    expect(callsAfter).toBeGreaterThan(callsBefore);

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("did not settle within 5s")
    );

    clearSpy.mockRestore();
  });
});
