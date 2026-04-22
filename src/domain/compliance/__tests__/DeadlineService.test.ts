import { describe, it, expect } from "vitest";
import { DeadlineService } from "../DeadlineService";

describe("DeadlineService", () => {
  const service = new DeadlineService();

  describe("UStVA-Frist", () => {
    it("Oktober 2025 → 10.11.2025 (Montag, kein Wochenende)", () => {
      const now = new Date(2025, 10, 1); // 1.11.2025
      const ds = service.getUpcomingDeadlines(now);
      const ustva = ds.find(
        (d) => d.type === "USTVA" && d.zeitraum === "10/2025"
      );
      expect(ustva).toBeDefined();
      expect(ustva!.frist.getDate()).toBe(10);
      expect(ustva!.frist.getMonth()).toBe(10); // 0-indexed Nov
    });

    it("Juli 2025: Frist 10.08. fällt auf So → Mo 11.08.", () => {
      const now = new Date(2025, 7, 1); // 1.8.2025
      const ds = service.getUpcomingDeadlines(now);
      const ustva = ds.find(
        (d) => d.type === "USTVA" && d.zeitraum === "07/2025"
      );
      expect(ustva!.frist.getDate()).toBe(11);
      expect(ustva!.frist.getMonth()).toBe(7); // August
    });
  });

  describe("LStA-Frist", () => {
    it("Oktober 2025 → analog UStVA = 10.11.2025", () => {
      const now = new Date(2025, 10, 1);
      const ds = service.getUpcomingDeadlines(now);
      const lsta = ds.find(
        (d) => d.type === "LSTA" && d.zeitraum === "10/2025"
      );
      expect(lsta).toBeDefined();
      expect(lsta!.frist.getDate()).toBe(10);
    });
  });

  describe("ZM-Frist", () => {
    it("Q3 2025 (Juli-Sep) → 25.10.2025 (Sa → Mo 27.10.)", () => {
      const now = new Date(2025, 9, 15); // 15.10.2025
      const ds = service.getUpcomingDeadlines(now);
      const zm = ds.find((d) => d.type === "ZM" && d.zeitraum === "Q3/2025");
      expect(zm).toBeDefined();
      // 25.10.2025 = Samstag → Montag 27.10.2025
      expect(zm!.frist.getDate()).toBe(27);
      expect(zm!.frist.getMonth()).toBe(9); // Oct
    });

    it("Q4 → Folgejahr Januar", () => {
      const now = new Date(2026, 0, 5); // 5.1.2026
      const ds = service.getUpcomingDeadlines(now);
      const zm = ds.find((d) => d.type === "ZM" && d.zeitraum === "Q4/2025");
      expect(zm).toBeDefined();
      expect(zm!.frist.getFullYear()).toBe(2026);
      expect(zm!.frist.getMonth()).toBe(0); // Jan
      expect(zm!.frist.getDate()).toBe(26); // 25.01.2026 = So → Mo 26.01.
    });
  });

  describe("E-Bilanz-Frist", () => {
    it("WJ 2024 → 31.05.2025", () => {
      const now = new Date(2025, 2, 1); // 1.3.2025
      const ds = service.getUpcomingDeadlines(now);
      const eb = ds.find((d) => d.type === "EBILANZ");
      expect(eb).toBeDefined();
      expect(eb!.zeitraum).toBe("WJ 2024");
      expect(eb!.frist.getFullYear()).toBe(2025);
      expect(eb!.frist.getMonth()).toBe(4); // Mai
      expect(eb!.frist.getDate()).toBe(31);
      expect(eb!.hinweis).toMatch(/§ 109/);
    });
  });

  describe("Jahresabschluss-Offenlegung", () => {
    it("WJ 2024 → 31.12.2025", () => {
      const now = new Date(2025, 5, 1);
      const ds = service.getUpcomingDeadlines(now);
      const ja = ds.find((d) => d.type === "JAHRESABSCHLUSS");
      expect(ja).toBeDefined();
      expect(ja!.frist.getFullYear()).toBe(2025);
      expect(ja!.frist.getMonth()).toBe(11); // Dec
    });
  });

  describe("Status-Berechnung", () => {
    it("überfällig → RED", () => {
      const now = new Date(2025, 11, 20); // 20.12.2025
      const ds = service.getUpcomingDeadlines(now);
      // UStVA 11/2025 war 10.12.2025 → überfällig am 20.12.
      const overdue = ds.find(
        (d) => d.type === "USTVA" && d.zeitraum === "11/2025"
      );
      expect(overdue!.daysRemaining).toBeLessThan(0);
      expect(overdue!.status).toBe("RED");
    });

    it("< 7 Tage → YELLOW", () => {
      const now = new Date(2025, 10, 5); // 5.11.2025 (5 Tage vor 10.11.)
      const ds = service.getUpcomingDeadlines(now);
      const yel = ds.find(
        (d) => d.type === "USTVA" && d.zeitraum === "10/2025"
      );
      expect(yel!.status).toBe("YELLOW");
    });

    it("> 7 Tage → GREEN", () => {
      const now = new Date(2025, 9, 20); // 20.10.2025 (21 Tage vor 10.11.)
      const ds = service.getUpcomingDeadlines(now);
      const grn = ds.find(
        (d) => d.type === "USTVA" && d.zeitraum === "10/2025"
      );
      expect(grn!.status).toBe("GREEN");
    });
  });

  describe("Sortierung", () => {
    it("Fristen aufsteigend sortiert", () => {
      const now = new Date(2025, 9, 15);
      const ds = service.getUpcomingDeadlines(now);
      for (let i = 1; i < ds.length; i++) {
        expect(ds[i].frist.getTime()).toBeGreaterThanOrEqual(
          ds[i - 1].frist.getTime()
        );
      }
    });
  });

  describe("Route + Label", () => {
    it("Jede Deadline hat route + label gesetzt", () => {
      const now = new Date(2025, 9, 15);
      const ds = service.getUpcomingDeadlines(now);
      for (const d of ds) {
        expect(d.route).toMatch(/^\//);
        expect(d.label.length).toBeGreaterThan(0);
      }
    });
    it("UStVA → /steuer/ustva, ZM → /steuer/zm, E-Bilanz → /steuer/ebilanz", () => {
      const now = new Date(2025, 9, 15);
      const ds = service.getUpcomingDeadlines(now);
      const ustva = ds.find((d) => d.type === "USTVA");
      const zm = ds.find((d) => d.type === "ZM");
      const eb = ds.find((d) => d.type === "EBILANZ");
      expect(ustva!.route).toBe("/steuer/ustva");
      expect(zm!.route).toBe("/steuer/zm");
      expect(eb!.route).toBe("/steuer/ebilanz");
    });
  });

  describe("Deadline-Typen-Abdeckung", () => {
    it("Enthält alle 5 Typen", () => {
      const now = new Date(2025, 9, 15);
      const ds = service.getUpcomingDeadlines(now);
      const types = new Set(ds.map((d) => d.type));
      expect(types.has("USTVA")).toBe(true);
      expect(types.has("LSTA")).toBe(true);
      expect(types.has("ZM")).toBe(true);
      expect(types.has("EBILANZ")).toBe(true);
      expect(types.has("JAHRESABSCHLUSS")).toBe(true);
    });
  });
});
