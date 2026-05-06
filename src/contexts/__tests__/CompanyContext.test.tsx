/** @jsxImportSource react */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  demoMode: false,
  user: null as { id: string; email?: string } | null,
  userLoading: false,
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("../../api/supabase", () => ({
  get DEMO_MODE() {
    return mocks.demoMode;
  },
  supabase: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock("../UserContext", () => ({
  useUser: () => ({ user: mocks.user, loading: mocks.userLoading }),
  UserProvider: ({ children }: { children: ReactNode }) => children,
}));

import {
  CompanyProvider,
  useCompany,
  DEMO_COMPANY_ID,
} from "../CompanyContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Snapshot = {
  activeCompanyId: string | null;
  memberships: Array<{ companyId: string; companyName: string; role: string }>;
  loading: boolean;
};

type SnapshotRef = { current: Snapshot | null };

function Probe({ snapRef }: { snapRef: SnapshotRef }) {
  const ctx = useCompany();
  useEffect(() => {
    snapRef.current = {
      activeCompanyId: ctx.activeCompanyId,
      memberships: ctx.memberships,
      loading: ctx.loading,
    };
  });
  return null;
}

function makeFromBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockResolvedValue(result);
  return builder;
}

async function flushAll() {
  for (let i = 0; i < 8; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderProvider(): Promise<{
  snapRef: SnapshotRef;
  unmount: () => void;
}> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const snapRef: SnapshotRef = { current: null };
  await act(async () => {
    root.render(
      <CompanyProvider>
        <Probe snapRef={snapRef} />
      </CompanyProvider>
    );
  });
  await flushAll();
  return {
    snapRef,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("CompanyContext · bootstrap RPC contract", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    mocks.demoMode = false;
    mocks.user = null;
    mocks.userLoading = false;
    mocks.rpc.mockReset();
    mocks.from.mockReset();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    localStorage.clear();
  });

  it("ruft bootstrap_first_company genau einmal auf, ohne p_user_id, und macht die zurueckgegebene Company aktiv", async () => {
    mocks.user = { id: "user-abcdef-1234-5678", email: "alice@example.com" };
    mocks.from.mockReturnValueOnce(makeFromBuilder({ data: [], error: null }));
    mocks.rpc.mockResolvedValueOnce({
      data: [{ id: "co-new-1", name: "alices Kanzlei" }],
      error: null,
    });

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    const [rpcName, rpcArgs] = mocks.rpc.mock.calls[0] as [
      string,
      Record<string, string>,
    ];
    expect(rpcName).toBe("bootstrap_first_company");
    expect(Object.keys(rpcArgs).sort()).toEqual(["p_name", "p_slug"]);
    expect(rpcArgs.p_name).toBe("alices Kanzlei");
    expect(rpcArgs.p_slug).toMatch(/^kanzlei-user-abc-\d+$/);

    expect(snapRef.current?.loading).toBe(false);
    expect(snapRef.current?.activeCompanyId).toBe("co-new-1");
    expect(snapRef.current?.memberships).toEqual([
      { companyId: "co-new-1", companyName: "alices Kanzlei", role: "owner" },
    ]);
    unmount();
  });

  it("bestehender Nutzer mit Mitgliedschaft ruft die RPC nicht auf", async () => {
    mocks.user = { id: "user-existing-1", email: "bob@example.com" };
    mocks.from.mockReturnValueOnce(
      makeFromBuilder({
        data: [
          {
            role: "owner",
            company_id: "co-existing",
            companies: { id: "co-existing", name: "Bobs Kanzlei" },
          },
        ],
        error: null,
      })
    );

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(snapRef.current?.activeCompanyId).toBe("co-existing");
    expect(snapRef.current?.memberships).toEqual([
      { companyId: "co-existing", companyName: "Bobs Kanzlei", role: "owner" },
    ]);
    unmount();
  });

  it("generischer RPC-Fehler wird geloggt und hinterlaesst keine aktive Company", async () => {
    mocks.user = { id: "user-perm-denied", email: "carol@example.com" };
    mocks.from.mockReturnValueOnce(makeFromBuilder({ data: [], error: null }));
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to bootstrap company:",
      expect.objectContaining({ code: "42501" })
    );
    expect(snapRef.current?.activeCompanyId).toBeNull();
    expect(snapRef.current?.memberships).toEqual([]);
    unmount();
  });

  it("P0001 already-has-memberships: laedt Mitgliedschaften erneut und uebernimmt das gefundene Ergebnis", async () => {
    mocks.user = { id: "user-race-1", email: "dave@example.com" };
    mocks.from.mockReturnValueOnce(makeFromBuilder({ data: [], error: null }));
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0001", message: "user already has memberships" },
    });
    mocks.from.mockReturnValueOnce(
      makeFromBuilder({
        data: [
          {
            role: "owner",
            company_id: "co-recovered",
            companies: { id: "co-recovered", name: "Davids Kanzlei" },
          },
        ],
        error: null,
      })
    );

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      "Failed to bootstrap company:",
      expect.anything()
    );
    expect(snapRef.current?.activeCompanyId).toBe("co-recovered");
    expect(snapRef.current?.memberships).toEqual([
      {
        companyId: "co-recovered",
        companyName: "Davids Kanzlei",
        role: "owner",
      },
    ]);
    unmount();
  });

  it("Slug-Unique-Verletzung wird einmal geloggt und nicht erneut versucht", async () => {
    mocks.user = { id: "user-slug-clash", email: "eve@example.com" };
    mocks.from.mockReturnValueOnce(makeFromBuilder({ data: [], error: null }));
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "23505",
        message:
          'duplicate key value violates unique constraint "companies_slug_key"',
      },
    });

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to bootstrap company:",
      expect.objectContaining({ code: "23505" })
    );
    expect(snapRef.current?.memberships).toEqual([]);
    unmount();
  });

  it("DEMO_MODE: ruft weder supabase.from noch supabase.rpc auf", async () => {
    mocks.demoMode = true;
    mocks.user = null;

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(snapRef.current?.activeCompanyId).toBe(DEMO_COMPANY_ID);
    expect(snapRef.current?.memberships).toEqual([
      {
        companyId: DEMO_COMPANY_ID,
        companyName: "Demo-Kanzlei",
        role: "owner",
      },
    ]);
    unmount();
  });

  it("user === null: ruft weder supabase.from noch supabase.rpc auf", async () => {
    mocks.demoMode = false;
    mocks.user = null;

    const { snapRef, unmount } = await renderProvider();

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(snapRef.current?.activeCompanyId).toBeNull();
    expect(snapRef.current?.memberships).toEqual([]);
    unmount();
  });
});
