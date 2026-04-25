// src/components/shell/Notifications.tsx
//
// Benachrichtigungs-Glocke im AppShell-Topbar.
// Aus AppShell.tsx extrahiert (Phase 1, Schritt b/4).
//
// Zeigt offene Hinweise (aus deriveNotifications() abgeleitet)
// als Glocken-Badge mit Anzahl. Beim Aufklappen erscheinen die
// aktiven Hinweise; bereits gelesene Hinweise koennen separat
// eingeblendet werden. Der "gelesen"-Status persistiert in
// localStorage unter "harouda:notifications:dismissed".
//
// Click-Outside schliesst das Dropdown automatisch.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Clock } from "lucide-react";
import { deriveNotifications } from "../../api/notifications";

const DISMISS_STORAGE_KEY = "harouda:notifications:dismissed";

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>): void {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage full or blocked */
  }
}

export function Notifications() {
  const [open, setOpen] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allItems = useMemo(
    () => (open ? deriveNotifications() : []),
    [open]
  );
  const active = useMemo(
    () => allItems.filter((n) => !dismissed.has(n.id)),
    [allItems, dismissed]
  );
  const dismissedItems = useMemo(
    () => allItems.filter((n) => dismissed.has(n.id)),
    [allItems, dismissed]
  );

  const count = useMemo(() => {
    try {
      const live = deriveNotifications();
      return live.filter((n) => !dismissed.has(n.id)).length;
    } catch {
      return 0;
    }
  }, [dismissed]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  function handleItemClick(to: string) {
    setOpen(false);
    navigate(to);
  }

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  }

  function restore(id: string) {
    const next = new Set(dismissed);
    next.delete(id);
    setDismissed(next);
    saveDismissed(next);
  }

  function clearDismissed() {
    setDismissed(new Set());
    saveDismissed(new Set());
  }

  return (
    <div className="shell__dd" ref={ref}>
      <button
        type="button"
        className="shell__dd-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Benachrichtigungen"
        aria-label={`Benachrichtigungen (${count})`}
      >
        <Bell size={16} />
        {count > 0 && <span className="shell__dd-badge">{count}</span>}
      </button>
      {open && (
        <div className="shell__dd-menu shell__dd-menu--wide">
          <header className="shell__dd-head">
            <strong>Benachrichtigungen</strong>
            <small>Aus Live-Daten abgeleitet</small>
          </header>
          {active.length === 0 ? (
            <div className="shell__dd-empty">
              <Clock size={18} />
              <p>Keine offenen Hinweise — Ihre Unterlagen sind im grünen Bereich.</p>
            </div>
          ) : (
            active.map((n) => (
              <div
                key={n.id}
                className={`shell__dd-item shell__dd-notif is-${n.severity}`}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(n.to)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  <strong>{n.title}</strong>
                  <small style={{ display: "block" }}>{n.detail}</small>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(n.id);
                  }}
                  title="Als gelesen markieren"
                  aria-label="Als gelesen markieren"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "var(--muted)",
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}

          {dismissedItems.length > 0 && (
            <div className="shell__dd-section">
              <button
                type="button"
                onClick={() => setShowDismissed((v) => !v)}
                className="shell__dd-section-toggle"
              >
                {showDismissed ? "▾" : "▸"} Gelesene Hinweise (
                {dismissedItems.length})
              </button>
              {showDismissed && (
                <>
                  {dismissedItems.map((n) => (
                    <div
                      key={n.id}
                      className="shell__dd-item shell__dd-notif"
                      style={{ opacity: 0.55 }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{n.title}</strong>
                        <small style={{ display: "block" }}>{n.detail}</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => restore(n.id)}
                        title="Wieder anzeigen"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--navy)",
                          fontSize: "0.76rem",
                        }}
                      >
                        wiederherstellen
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={clearDismissed}
                    className="shell__dd-section-clear"
                  >
                    Alle als ungelesen markieren
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
