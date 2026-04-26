import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { DEMO_MODE } from "./api/supabase";
import AppShell from "./components/AppShell";
import BaseShell from "./components/shell/BaseShell";
import BuchhaltungShell from "./components/shell/BuchhaltungShell";
import SteuernShell from "./components/shell/SteuernShell";
import DemoBanner from "./components/DemoBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RequireAuth } from "./components/RequireAuth";
import { MandantProvider } from "./contexts/MandantContext";
import LandingPage from "./pages/LandingPage";
import UeberUnsPage from "./pages/UeberUnsPage";
import FunktionenPage from "./pages/FunktionenPage";
import AblaufPage from "./pages/AblaufPage";
import WerkzeugePage from "./pages/WerkzeugePage";
import VergleichPage from "./pages/VergleichPage";
import RoiCalculatorPage from "./pages/RoiCalculatorPage";
import AlternativeDatevPage from "./pages/AlternativeDatevPage";
import AlternativeSevdeskPage from "./pages/AlternativeSevdeskPage";
import AlternativeLexofficePage from "./pages/AlternativeLexofficePage";
import KontaktPage from "./pages/KontaktPage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import LoginPage from "./pages/LoginPage";
import ArbeitsplatzPage from "./pages/ArbeitsplatzPage";
import AccountsPage from "./pages/AccountsPage";
import JournalPage from "./pages/JournalPage";
import JournalCsvImportPage from "./pages/JournalCsvImportPage";
import ClientsPage from "./pages/ClientsPage";
import MandantAnlagePage from "./pages/MandantAnlagePage";
import ReportsPage from "./pages/ReportsPage";
import GuvPage from "./pages/GuvPage";
import BwaPage from "./pages/BwaPage";
import BilanzPage from "./pages/BilanzPage";
import JahresabschlussPage from "./pages/JahresabschlussPage";
import JahresabschlussWizardPage from "./pages/JahresabschlussWizardPage";
import VorjahresvergleichPage from "./pages/VorjahresvergleichPage";
import SuSaPage from "./pages/SuSaPage";
import TaxFormsPage from "./pages/TaxFormsPage";
import UstvaPage from "./pages/UstvaPage";
import ZmPage from "./pages/ZmPage";
import LohnPage from "./pages/LohnPage";
import LohnsteuerAnmeldungPage from "./pages/LohnsteuerAnmeldungPage";
import SvMeldungenPage from "./pages/SvMeldungenPage";
import AbrechnungsArchivPage from "./pages/AbrechnungsArchivPage";
import EbilanzPage from "./pages/EbilanzPage";
import Z3ExportPage from "./pages/Z3ExportPage";
import DatenExportPage from "./pages/DatenExportPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import KanzleiDashboardPage from "./pages/KanzleiDashboardPage";
import BelegerfassungPage from "./pages/BelegerfassungPage";
import AnlageNPage from "./pages/AnlageNPage";
import AnlageSPage from "./pages/AnlageSPage";
import AnlageGPage from "./pages/AnlageGPage";
import AnlageVPage from "./pages/AnlageVPage";
import AnlageSOPage from "./pages/AnlageSOPage";
import AnlageAUSPage from "./pages/AnlageAUSPage";
import AnlageKindPage from "./pages/AnlageKindPage";
import AnlageVorsorgePage from "./pages/AnlageVorsorgePage";
import AnlageRPage from "./pages/AnlageRPage";
import AnlageKapPage from "./pages/AnlageKapPage";
import AnlageMobilitaetspraemiePage from "./pages/AnlageMobilitaetspraemiePage";
import AnlageVSonstigePage from "./pages/AnlageVSonstigePage";
import AnlageVFeWoPage from "./pages/AnlageVFeWoPage";
import AnlageUnterhaltPage from "./pages/AnlageUnterhaltPage";
import AnlageUPage from "./pages/AnlageUPage";
import AnlageRAVbAVPage from "./pages/AnlageRAVbAVPage";
import AnlageNAUSPage from "./pages/AnlageNAUSPage";
import AnlageNDHFPage from "./pages/AnlageNDHFPage";
import AnlageAVPage from "./pages/AnlageAVPage";
import AnlageEnergetischeMassnahmenPage from "./pages/AnlageEnergetischeMassnahmenPage";
import AnlageHaushaltsnaheAufwendungenPage from "./pages/AnlageHaushaltsnaheAufwendungenPage";
import AnlageSonderausgabenPage from "./pages/AnlageSonderausgabenPage";
import AnlageAussergewoehnlicheBelastungenPage from "./pages/AnlageAussergewoehnlicheBelastungenPage";
import HauptvorduckESt1APage from "./pages/HauptvorduckESt1APage";
import HauptvorduckESt1CPage from "./pages/HauptvorduckESt1CPage";
import EuerPage from "./pages/EuerPage";
import BuchfuehrungIndexPage from "./pages/BuchfuehrungIndexPage";
import BuchfuehrungUebersichtPage from "./pages/BuchfuehrungUebersichtPage";
import BuchfuehrungMappingPage from "./pages/BuchfuehrungMappingPage";
import BuchfuehrungPlausiPage from "./pages/BuchfuehrungPlausiPage";
import GewerbesteuerPage from "./pages/GewerbesteuerPage";
import KoerperschaftsteuerPage from "./pages/KoerperschaftsteuerPage";
import DocumentsPage from "./pages/DocumentsPage";
import BankImportPage from "./pages/BankImportPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogPage from "./pages/AuditLogPage";
import MembersPage from "./pages/MembersPage";
import RetentionPage from "./pages/RetentionPage";
import DeadlinesPage from "./pages/DeadlinesPage";
import ZugferdPage from "./pages/ZugferdPage";
import XRechnungErstellenPage from "./pages/XRechnungErstellenPage";
import InvoiceArchivePage from "./pages/InvoiceArchivePage";
import ERechnungPage from "./pages/ERechnungPage";
import BelegeListePage from "./pages/BelegeListePage";
import DatevExportPage from "./pages/DatevExportPage";
import ElsterPage from "./pages/ElsterPage";
import DocumentScannerPage from "./pages/DocumentScannerPage";
import BankReconciliationPage from "./pages/BankReconciliationPage";
import InventurPage from "./pages/InventurPage";
import AdvisorDashboardPage from "./pages/AdvisorDashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import PayrollRunPage from "./pages/PayrollRunPage";
import CostCentersPage from "./pages/CostCentersPage";
import CostCarriersPage from "./pages/CostCarriersPage";
import AnlagenVerzeichnisPage from "./pages/AnlagenVerzeichnisPage";
import AfaLaufPage from "./pages/AfaLaufPage";
import AnlagenspiegelPage from "./pages/AnlagenspiegelPage";
import DimensionReportPage from "./pages/DimensionReportPage";
import ReceiptRequestsPage from "./pages/ReceiptRequestsPage";
import PrueferDashboardPage from "./pages/PrueferDashboardPage";
import VerfahrensdokuPage from "./pages/VerfahrensdokuPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import AppLogPage from "./pages/AppLogPage";
import OposPage from "./pages/OposPage";
import PdfToolsPage from "./pages/PdfToolsPage";
import CashflowPage from "./pages/CashflowPage";
import MahnwesenPage from "./pages/MahnwesenPage";
import DebitorenPage from "./pages/DebitorenPage";
import KreditorenPage from "./pages/KreditorenPage";
import PartnerVersionHistory from "./pages/partners/PartnerVersionHistory";
import IntegrityDashboardPage from "./pages/admin/IntegrityDashboardPage";
import "./App.css";

const Router = DEMO_MODE ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <MandantProvider>
        {DEMO_MODE && <DemoBanner />}
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ueber-uns" element={<UeberUnsPage />} />
        <Route path="/funktionen" element={<FunktionenPage />} />
        <Route path="/ablauf" element={<AblaufPage />} />
        <Route path="/werkzeuge" element={<WerkzeugePage />} />
        <Route path="/vergleich" element={<VergleichPage />} />
        <Route path="/roi" element={<RoiCalculatorPage />} />
        <Route path="/alternative-zu-datev" element={<AlternativeDatevPage />} />
        <Route path="/sevdesk-alternative" element={<AlternativeSevdeskPage />} />
        <Route path="/lexoffice-vs-harouda" element={<AlternativeLexofficePage />} />
        <Route path="/kontakt" element={<KontaktPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/arbeitsplatz"
          element={
            <RequireAuth>
              <ErrorBoundary level="page" context="Arbeitsplatz">
                <ArbeitsplatzPage />
              </ErrorBoundary>
            </RequireAuth>
          }
        />

        {/* Phase 1 Patch 1.7 — Module-Shell BuchhaltungShell. */}
        {/* Routes parallel zu AppShell-Routes; Migration in Patch 1.8/1.9. */}
        <Route
          element={
            <RequireAuth>
              <ErrorBoundary level="page" context="BuchhaltungShell">
                <BaseShell />
              </ErrorBoundary>
            </RequireAuth>
          }
        >
          <Route element={<BuchhaltungShell />}>
            <Route path="/buchhaltung/journal" element={<JournalPage />} />
            <Route path="/buchhaltung/konten" element={<AccountsPage />} />
            <Route path="/buchhaltung/opos" element={<OposPage />} />
            <Route path="/buchhaltung/mahnwesen" element={<MahnwesenPage />} />
            <Route path="/buchhaltung/bankimport" element={<BankImportPage />} />
            <Route path="/buchhaltung/banking/reconciliation" element={<BankReconciliationPage />} />
            <Route path="/buchhaltung/banking/belegabfragen" element={<ReceiptRequestsPage />} />
            <Route path="/buchhaltung/buchfuehrung" element={<BuchfuehrungIndexPage />} />
            <Route path="/buchhaltung/anlagen/verzeichnis" element={<AnlagenVerzeichnisPage />} />
            <Route path="/buchhaltung/anlagen/afa-lauf" element={<AfaLaufPage />} />
            <Route path="/buchhaltung/liquiditaet" element={<CashflowPage />} />
            <Route path="/buchhaltung/buchungen/erfassung" element={<BelegerfassungPage />} />
            <Route path="/buchhaltung/buchungen/belege" element={<BelegeListePage />} />
          </Route>
        </Route>

        {/* Phase 2 Patch 2.1 — Module-Shell SteuernShell. */}
        {/* Erste parallele Steuern-Route; alte /steuer/* bleiben unveraendert. */}
        <Route
          element={
            <RequireAuth>
              <ErrorBoundary level="page" context="SteuernShell">
                <BaseShell />
              </ErrorBoundary>
            </RequireAuth>
          }
        >
          <Route element={<SteuernShell />}>
            <Route path="/steuern/ustva" element={<UstvaPage />} />
            <Route path="/steuern/zm" element={<ZmPage />} />
          </Route>
        </Route>

        {/* ============================================================
            Layout-Route #2 — Legacy Redirects (Phase 1 — Patch 1.9)
            13 alte Pfade leiten auf /buchhaltung/* um.
            Kein Shell-Mount: <Navigate> rendert keine UI.
            Auth + ErrorBoundary bleiben erhalten für Konsistenz.
            Bei vollständiger Entfernung der legacy paths kann dieser
            gesamte Block in einem Patch gelöscht werden.
        ============================================================ */}
        <Route
          element={
            <RequireAuth>
              <ErrorBoundary context="LegacyRedirect" level="page">
                <Outlet />
              </ErrorBoundary>
            </RequireAuth>
          }
        >
          <Route path="/journal" element={<Navigate to="/buchhaltung/journal" replace />} />
          <Route path="/konten" element={<Navigate to="/buchhaltung/konten" replace />} />
          <Route path="/buchfuehrung" element={<Navigate to="/buchhaltung/buchfuehrung" replace />} />
          <Route path="/buchungen/erfassung" element={<Navigate to="/buchhaltung/buchungen/erfassung" replace />} />
          <Route path="/opos" element={<Navigate to="/buchhaltung/opos" replace />} />
          <Route path="/liquiditaet" element={<Navigate to="/buchhaltung/liquiditaet" replace />} />
          <Route path="/mahnwesen" element={<Navigate to="/buchhaltung/mahnwesen" replace />} />
          <Route path="/bankimport" element={<Navigate to="/buchhaltung/bankimport" replace />} />
          <Route path="/buchungen/belege" element={<Navigate to="/buchhaltung/buchungen/belege" replace />} />
          <Route path="/banking/reconciliation" element={<Navigate to="/buchhaltung/banking/reconciliation" replace />} />
          <Route path="/anlagen/verzeichnis" element={<Navigate to="/buchhaltung/anlagen/verzeichnis" replace />} />
          <Route path="/anlagen/afa-lauf" element={<Navigate to="/buchhaltung/anlagen/afa-lauf" replace />} />
          <Route path="/banking/belegabfragen" element={<Navigate to="/buchhaltung/banking/belegabfragen" replace />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <ErrorBoundary level="page" context="AppShell">
                <AppShell />
              </ErrorBoundary>
            </RequireAuth>
          }
        >
          <Route
            path="/dashboard"
            element={<Navigate to="/arbeitsplatz" replace />}
          />
          <Route path="/mandanten" element={<ClientsPage />} />
          <Route path="/mandanten/neu" element={<MandantAnlagePage />} />
          <Route path="/journal/import" element={<JournalCsvImportPage />} />
          <Route path="/buchfuehrung/uebersicht" element={<BuchfuehrungUebersichtPage />} />
          <Route path="/buchfuehrung/zuordnung" element={<BuchfuehrungMappingPage />} />
          <Route path="/buchfuehrung/plausi" element={<BuchfuehrungPlausiPage />} />
          <Route path="/berichte" element={<ReportsPage />} />
          <Route path="/berichte/guv" element={<GuvPage />} />
          <Route path="/berichte/bwa" element={<BwaPage />} />
          <Route path="/berichte/bilanz" element={<BilanzPage />} />
          <Route path="/berichte/jahresabschluss" element={<JahresabschlussPage />} />
          <Route
            path="/jahresabschluss/wizard"
            element={<JahresabschlussWizardPage />}
          />
          <Route path="/berichte/vorjahresvergleich" element={<VorjahresvergleichPage />} />
          <Route path="/berichte/susa" element={<SuSaPage />} />
          <Route path="/steuer" element={<TaxFormsPage />} />
          <Route path="/steuer/ustva" element={<UstvaPage />} />
          <Route path="/steuer/zm" element={<ZmPage />} />
          <Route path="/lohn" element={<LohnPage />} />
          <Route path="/lohn/lohnsteueranmeldung" element={<LohnsteuerAnmeldungPage />} />
          <Route path="/lohn/sv-meldungen" element={<SvMeldungenPage />} />
          <Route path="/lohn/archiv" element={<AbrechnungsArchivPage />} />
          <Route path="/steuer/ebilanz" element={<EbilanzPage />} />
          <Route path="/admin/z3-export" element={<Z3ExportPage />} />
          <Route path="/admin/datenexport" element={<DatenExportPage />} />
          <Route path="/admin/audit" element={<AuditTrailPage />} />
          <Route
            path="/admin/integrity"
            element={<IntegrityDashboardPage />}
          />
          <Route path="/kanzlei-dashboard" element={<KanzleiDashboardPage />} />
          <Route path="/steuer/euer" element={<EuerPage />} />
          <Route path="/steuer/gewerbesteuer" element={<GewerbesteuerPage />} />
          <Route path="/steuer/kst" element={<KoerperschaftsteuerPage />} />
          <Route path="/steuer/anlage-n" element={<AnlageNPage />} />
          <Route path="/steuer/anlage-s" element={<AnlageSPage />} />
          <Route path="/steuer/anlage-g" element={<AnlageGPage />} />
          <Route path="/steuer/anlage-v" element={<AnlageVPage />} />
          <Route path="/steuer/anlage-so" element={<AnlageSOPage />} />
          <Route path="/steuer/anlage-aus" element={<AnlageAUSPage />} />
          <Route path="/steuer/anlage-kind" element={<AnlageKindPage />} />
          <Route path="/steuer/anlage-vorsorge" element={<AnlageVorsorgePage />} />
          <Route path="/steuer/anlage-r" element={<AnlageRPage />} />
          <Route path="/steuer/anlage-kap" element={<AnlageKapPage />} />
          <Route
            path="/steuer/anlage-mobility"
            element={<AnlageMobilitaetspraemiePage />}
          />
          <Route
            path="/steuer/anlage-v-sonstige"
            element={<AnlageVSonstigePage />}
          />
          <Route
            path="/steuer/anlage-v-fewo"
            element={<AnlageVFeWoPage />}
          />
          <Route
            path="/steuer/anlage-unterhalt"
            element={<AnlageUnterhaltPage />}
          />
          <Route path="/steuer/anlage-u" element={<AnlageUPage />} />
          <Route path="/steuer/anlage-rav-bav" element={<AnlageRAVbAVPage />} />
          <Route path="/steuer/anlage-n-aus" element={<AnlageNAUSPage />} />
          <Route path="/steuer/anlage-n-dhf" element={<AnlageNDHFPage />} />
          <Route path="/steuer/anlage-av" element={<AnlageAVPage />} />
          <Route
            path="/steuer/anlage-em"
            element={<AnlageEnergetischeMassnahmenPage />}
          />
          <Route
            path="/steuer/anlage-haa"
            element={<AnlageHaushaltsnaheAufwendungenPage />}
          />
          <Route
            path="/steuer/anlage-sonder"
            element={<AnlageSonderausgabenPage />}
          />
          <Route
            path="/steuer/anlage-agb"
            element={<AnlageAussergewoehnlicheBelastungenPage />}
          />
          <Route path="/steuer/est-1a" element={<HauptvorduckESt1APage />} />
          <Route path="/steuer/est-1c" element={<HauptvorduckESt1CPage />} />
          <Route path="/belege" element={<DocumentsPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="/einstellungen/audit" element={<AuditLogPage />} />
          <Route path="/einstellungen/benutzer" element={<MembersPage />} />
          <Route path="/einstellungen/fristen" element={<DeadlinesPage />} />
          <Route path="/einstellungen/aufbewahrung" element={<RetentionPage />} />
          <Route path="/zugferd" element={<ZugferdPage />} />
          <Route path="/e-rechnung/erstellen" element={<XRechnungErstellenPage />} />
          <Route path="/e-rechnung/archiv" element={<InvoiceArchivePage />} />
          <Route path="/buchungen/e-rechnung" element={<ERechnungPage />} />
          <Route path="/export/datev" element={<DatevExportPage />} />
          <Route path="/steuern/elster" element={<ElsterPage />} />
          <Route path="/ai/scanner" element={<DocumentScannerPage />} />
          <Route path="/inventur" element={<InventurPage />} />
          <Route path="/berater/dashboard" element={<AdvisorDashboardPage />} />
          <Route path="/personal/mitarbeiter" element={<EmployeesPage />} />
          <Route path="/personal/abrechnung" element={<PayrollRunPage />} />
          <Route path="/einstellungen/kostenstellen" element={<CostCentersPage />} />
          <Route path="/einstellungen/kostentraeger" element={<CostCarriersPage />} />
          <Route path="/berichte/anlagenspiegel" element={<AnlagenspiegelPage />} />
          <Route path="/berichte/dimensionen" element={<DimensionReportPage />} />
          <Route path="/pruefer" element={<PrueferDashboardPage />} />
          <Route path="/einstellungen/verfahrensdoku" element={<VerfahrensdokuPage />} />
          <Route path="/einstellungen/systemstatus" element={<SystemStatusPage />} />
          <Route path="/einstellungen/systemlog" element={<AppLogPage />} />
          <Route path="/werkzeuge/pdf" element={<PdfToolsPage />} />
          <Route path="/debitoren" element={<DebitorenPage />} />
          <Route path="/kreditoren" element={<KreditorenPage />} />
          <Route
            path="/partners/:id/history"
            element={<PartnerVersionHistory />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MandantProvider>
    </Router>
  );
}
