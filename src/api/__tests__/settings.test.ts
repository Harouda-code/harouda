import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("../supabase", () => ({
  DEMO_MODE: false,
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
      getUser: (...args: unknown[]) => mocks.getUser(...args),
    },
  },
}));

import { getCurrentUserId } from "../settings";

describe("settings · getCurrentUserId", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.getUser.mockReset();
  });

  it("verwendet getSession und nicht getUser", async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user-from-session" } } },
      error: null,
    });

    const id = await getCurrentUserId();

    expect(id).toBe("user-from-session");
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("gibt null zurueck, wenn keine Session existiert", async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const id = await getCurrentUserId();

    expect(id).toBeNull();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("gibt null bei getSession-Fehler zurueck", async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "session decode failed" },
    });

    const id = await getCurrentUserId();

    expect(id).toBeNull();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("gibt null zurueck, wenn getSession wirft", async () => {
    mocks.getSession.mockRejectedValueOnce(new Error("network down"));

    const id = await getCurrentUserId();

    expect(id).toBeNull();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
