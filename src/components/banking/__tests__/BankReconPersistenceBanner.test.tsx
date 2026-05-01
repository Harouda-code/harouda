/** @jsxImportSource react */
// Sprint 16 / Schritt 5 · BankReconPersistenceBanner-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BankReconPersistenceBanner } from "../BankReconPersistenceBanner";
import { listMatches, upsertMatch } from "../../../api/bankReconciliationMatches";
import { waitForCondition } from "../../../test/waitForCondition";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MANDANT = "c-banner-test";

async function flush(times = 10) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

function mount(props: {
  mandantId: string | null;
  bankTx?: Parameters<typeof BankReconPersistenceBanner>[0]["bankTx"];
  journalEntries?: Parameters<typeof BankReconPersistenceBanner>[0]["journalEntries"];
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <BankReconPersistenceBanner
        mandantId={props.mandantId}
        bankTx={props.bankTx ?? []}
        journalEntries={props.journalEntries ?? []}
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

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("BankReconPersistenceBanner", () => {
  it("#1 Ohne mandantId: disabled-Hinweis + kein Fetch", async () => {
    const r = mount({ mandantId: null });
    await act(async () => {
      await flush();
    });
    const b = document.querySelector(
      '[data-testid="bank-recon-persistence-banner"]'
    )!;
    expect(b.textContent).toContain("Kein Mandant");
    r.unmount();
  });

  it("#2 Leere Match-Liste: Total=0, Coverage=0%", async () => {
    const r = mount({ mandantId: MANDANT });
    await act(async () => {
      await flush();
    });
    const total = document.querySelector(
      '[data-testid="bank-recon-stat-total"]'
    );
    const coverage = document.querySelector(
      '[data-testid="bank-recon-stat-coverage"]'
    );
    expect(total!.textContent).toContain("0");
    expect(coverage!.textContent).toContain("0%");
    r.unmount();
  });

  it("#3 Vorhandene Matches: Stats-Zahlen korrekt", async () => {
    await upsertMatch({
      client_id: MANDANT,
      bank_transaction_id: "tx-1",
      bank_transaction_fingerprint: "fp-1",
      journal_entry_id: "je-1",
      match_status: "matched",
    });
    await upsertMatch({
      client_id: MANDANT,
      bank_transaction_id: "tx-2",
      bank_transaction_fingerprint: "fp-2",
      journal_entry_id: null,
      match_status: "pending_review",
    });
    const r = mount({ mandantId: MANDANT });
    await act(async () => {
      await flush();
    });
    const matched = document.querySelector(
      '[data-testid="bank-recon-stat-matched"]'
    );
    const pending = document.querySelector(
      '[data-testid="bank-recon-stat-pending"]'
    );
    expect(matched!.textContent).toContain("1");
    expect(pending!.textContent).toContain("1");
    r.unmount();
  });

  it("#4 'Offene Zeilen als pending_review'-Button persistiert neue Records", async () => {
    const bankTx = [
      {
        id: "reconc-row-0",
        datum: "2025-06-15",
        betrag: 100.0,
        vwz: "Test-Buchung",
      },
    ];
    const r = mount({ mandantId: MANDANT, bankTx });
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bank-recon-mark-pending"]'
    )!;
    await act(async () => {
      btn.click();
    });
    // mark-pending laeuft async ueber upsertMatch -> Storage.
    // State-basiert auf der oeffentlichen API listMatches warten,
    // statt auf Storage-Keys (Implementation-Detail).
    await waitForCondition(
      async () => (await listMatches(MANDANT)).length > 0,
      { timeoutMs: 2000, label: "Match in listMatches sichtbar" }
    );
    const matches = await listMatches(MANDANT);
    expect(matches).toHaveLength(1);
    expect(matches[0].match_status).toBe("pending_review");
    expect(matches[0].bank_transaction_fingerprint).toMatch(/^[0-9a-f]{64}$/);
    r.unmount();
  });

  it("#5 Auto-Match-Button zeigt Kandidaten-Count; Accept-Button persistiert auto_matched", async () => {
    const bankTx = [
      {
        id: "reconc-row-0",
        datum: "2025-06-15",
        betrag: 100.0,
        vwz: "Test",
      },
    ];
    const journalEntries = [
      {
        id: "je-1",
        datum: "2025-06-15",
        betrag: 100.0,
        buchungstext: "Test-Buchung",
      },
    ];
    const r = mount({ mandantId: MANDANT, bankTx, journalEntries });
    await act(async () => {
      await flush();
    });
    const runBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bank-recon-run-automatch"]'
    )!;
    await act(async () => {
      runBtn.click();
    });
    // Auto-Match laeuft async; auf Count-Label im DOM warten.
    await waitForCondition(
      () =>
        document.querySelector(
          '[data-testid="bank-recon-automatch-count"]'
        ) !== null,
      { timeoutMs: 2000, label: "automatch-count erscheint" }
    );
    const countEl = document.querySelector(
      '[data-testid="bank-recon-automatch-count"]'
    );
    expect(countEl).not.toBeNull();
    const acceptBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bank-recon-accept-090"]'
    )!;
    expect(acceptBtn).not.toBeNull();
    await act(async () => {
      acceptBtn.click();
    });
    // Accept-Click persistiert async; auf auto_matched-Status
    // ueber die oeffentliche API warten.
    await waitForCondition(
      async () => {
        const m = await listMatches(MANDANT);
        return m.length > 0 && m[0].match_status === "auto_matched";
      },
      { timeoutMs: 2000, label: "match_status=auto_matched" }
    );
    const matches = await listMatches(MANDANT);
    expect(matches).toHaveLength(1);
    expect(matches[0].match_status).toBe("auto_matched");
    expect(matches[0].journal_entry_id).toBe("je-1");
    expect(matches[0].notiz).toContain("Auto-Matcher");
    r.unmount();
  });

  it("#6 Button-Disabled-Gates: keine bankTx → mark-pending disabled; keine journalEntries → automatch disabled", async () => {
    const r = mount({ mandantId: MANDANT });
    await act(async () => {
      await flush();
    });
    const markBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bank-recon-mark-pending"]'
    )!;
    expect(markBtn.disabled).toBe(true);
    const autoBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bank-recon-run-automatch"]'
    )!;
    expect(autoBtn.disabled).toBe(true);
    r.unmount();
  });
});
