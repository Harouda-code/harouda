// Sprint 20.C.1 · isAdminRole + useRequireAdminRole Tests.

import { describe, it, expect } from "vitest";
import { isAdminRole } from "../requireAdminRole";

describe("isAdminRole", () => {
  it("#1 'owner' → true", () => {
    expect(isAdminRole("owner")).toBe(true);
  });

  it("#2 'admin' → true", () => {
    expect(isAdminRole("admin")).toBe(true);
  });

  it("#3 'tax_auditor' → true", () => {
    expect(isAdminRole("tax_auditor")).toBe(true);
  });

  it("#4 'member' → false", () => {
    expect(isAdminRole("member")).toBe(false);
  });

  it("#5 'readonly' → false", () => {
    expect(isAdminRole("readonly")).toBe(false);
  });

  it("#6 null → false", () => {
    expect(isAdminRole(null)).toBe(false);
  });

  it("#7 undefined → false", () => {
    expect(isAdminRole(undefined)).toBe(false);
  });
});
