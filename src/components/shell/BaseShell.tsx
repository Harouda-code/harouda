// src/components/shell/BaseShell.tsx
//
// Gemeinsamer Rahmen fuer alle Module-Shells.
// Phase 1, Schritt a/1.
//
// Liefert:
//  - Header (sticky, z-30): Brand, Module-Tabs-Platzhalter, Topbar-Actions
//  - Hauptbereich: <Outlet /> fuer den jeweiligen Module-Shell
//
// Mandant-, Year-, User-Daten kommen aus den vorhandenen Contexts.
// Kein eigener Context noetig — F42-Refactor (URL-primary MandantContext)
// bleibt unveraendert.
//
// Strg+K / Strg+/  oeffnet die universelle Suche.
// Module-Tabs werden in Patch 1.7 ergaenzt — der Platzhalter bleibt
// absichtlich leer, damit BaseShell allein lauffaehig ist.

import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useUser } from "../../contexts/UserContext";
import { useMandant } from "../../contexts/MandantContext";
import { useYear } from "../../contexts/YearContext";
import { fetchClients } from "../../api/clients";
import { DEMO_MODE } from "../../api/supabase";
import GuidedTour from "../GuidedTour";
import { UniversalSearchModal } from "../UniversalSearchModal";

import { MandantSwitch } from "./MandantSwitch";
import { YearSwitch } from "./YearSwitch";
import { QuickActions } from "./QuickActions";
import { PrivacyToggle } from "./PrivacyToggle";
import { Notifications } from "./Notifications";
import { UserPill } from "./UserPill";

import "./BaseShell.css";

export default function BaseShell() {
  const { user, signOut } = useUser();
  const { selectedMandantId, setSelectedMandantId } = useMandant();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const navigate = useNavigate();

  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });
  const clients = clientsQ.data ?? [];
  const activeMandant = selectedMandantId
    ? clients.find((c) => c.id === selectedMandantId) ?? null
    : null;

  // Universelle Suche — Strg+K / Strg+/
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "k" || e.key === "K" || e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="base-shell">
      <header className="base-shell__header no-print" role="banner">
        <Link
          to="/arbeitsplatz"
          className="base-shell__brand"
          aria-label="Zum Arbeitsplatz"
        >
          <span className="base-shell__brand-mark">H</span>
          <span className="base-shell__brand-name">harouda</span>
        </Link>

        {/* Module-Tabs werden in Patch 1.7 ergaenzt. */}
        <nav className="base-shell__module-tabs" aria-label="Module">
          {/* Platzhalter — wird in Patch 1.7 mit ModuleTabs gefuellt. */}
        </nav>

        <div className="base-shell__actions">
          <QuickActions />
          <MandantSwitch
            active={activeMandant}
            clients={clients}
            onChange={setSelectedMandantId}
          />
          <YearSwitch
            year={selectedYear}
            years={availableYears}
            onChange={setSelectedYear}
          />
          <PrivacyToggle />
          <Notifications />
          <UserPill user={user} onSignOut={handleSignOut} />
        </div>
      </header>

      <main className="base-shell__main">
        <Outlet />
      </main>

      {DEMO_MODE && <GuidedTour autoStart />}

      <UniversalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
