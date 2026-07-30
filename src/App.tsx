import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ViewTransition } from "./components/ViewTransition";
import { getServices } from "./api";
import { LangProvider, useLangState } from "./i18n";
import { IconActivity, IconBarChart, IconDatabase, IconSearch, IconServer, IconZap } from "./icons";
import { LedgerPage } from "./pages/LedgerPage";
import { PersonalStatsPage } from "./pages/PersonalStatsPage";
import { SearchPage } from "./pages/SearchPage";
import { ServicesPage } from "./pages/ServicesPage";
import { UptimePage } from "./pages/UptimePage";
import { WorkImpactPage } from "./pages/WorkImpactPage";

const copy = {
  en: { workImpact: "Work Impact", personalStats: "Personal Stats", ledger: "The Ledger", search: "Search", services: "Services", uptime: "Uptime Kuma", status: "System status", online: "API online", degraded: "API degraded", language: "Language" },
  qc: { workImpact: "Impact du travail", personalStats: "Stats personnelles", ledger: "Le Registre", search: "Recherche", services: "Services", uptime: "Disponibilité", status: "Etat du systeme", online: "API en ligne", degraded: "API degradee", language: "Langue" },
};
const nav: Array<{ to: string; label: keyof typeof copy.en; icon: ReactNode }> = [
  { to: "/work-impact", label: "workImpact", icon: <IconBarChart /> },
  { to: "/personal-stats", label: "personalStats", icon: <IconActivity /> },
  { to: "/uptime", label: "uptime", icon: <IconZap /> },
  { to: "/ledger", label: "ledger", icon: <IconDatabase /> },
  { to: "/search", label: "search", icon: <IconSearch /> },
  { to: "/services", label: "services", icon: <IconServer /> },
];

function Logo() {
  return <img src="/vault-monitor.svg" alt="VAULT Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />;
}

function Shell() {
  const [lang, setLang] = useLangState();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("vault-monitor-sidebar-collapsed") === "1");
  const [pageLoading, setPageLoading] = useState(true);
  const t = copy[lang];
  const location = useLocation();
  const navLabel = t[nav.find((item) => item.to === location.pathname)?.label ?? "workImpact"];
  useEffect(() => {
    const controller = new AbortController();
    getServices(controller.signal).then(() => setApiOnline(true)).catch((reason: Error) => reason.name !== "AbortError" && setApiOnline(false));
    return () => controller.abort();
  }, []);
  useEffect(() => {
    localStorage.setItem("vault-monitor-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);
  useEffect(() => {
    setPageLoading(true);
  }, [location.pathname]);
  return <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
    <aside className="warm-rail">
      <div className="brand-block">
        <div className="brand-mark"><Logo /></div>
        <div className="brand-text" title="VaultWares' Advanced Unified Ledger Telemetry Monitor"><strong>V.A.U.L.T</strong><span>Monitor</span></div>
        <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle Sidebar" title="Toggle Sidebar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}/></svg>
        </button>
      </div>

      <div className="rail-header">    
        <div className="rail-label">Command deck</div>    
        <div className="rail-status" title={apiOnline === false ? t.degraded : t.online}>
          <div className="rail-status-line">
            <span className={`status-led ${apiOnline === true ? "healthy" : apiOnline === false ? "offline" : "stale"}`} />
            <strong>{apiOnline === false ? t.degraded : t.online}</strong>
          </div>
        </div>
      </div>
      
      <nav className="nav-list" aria-label="Main navigation">{nav.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : ""} title={t[item.label]}><span>{item.icon}</span><span>{t[item.label]}</span></NavLink>)}</nav>      
      <div className="locale-toggle" aria-label={t.language}><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "qc" ? "active" : ""} onClick={() => setLang("qc")}>QC</button></div>
    </aside>
    <section className="monitor-stage">
      <ViewTransition token={location.pathname} label={navLabel} loading={pageLoading} />
      <Routes>
        <Route path="/work-impact" element={<WorkImpactPage setLoading={setPageLoading} />} />
        <Route path="/personal-stats" element={<PersonalStatsPage setLoading={setPageLoading} />} />
        <Route path="/uptime" element={<UptimePage setLoading={setPageLoading} />} />
        <Route path="/ledger" element={<LedgerPage setLoading={setPageLoading} />} />
        <Route path="/search" element={<SearchPage setLoading={setPageLoading} />} />
        <Route path="/services" element={<ServicesPage setLoading={setPageLoading} />} />
        <Route path="/" element={<Navigate replace to="/work-impact" />} />
        <Route path="/health" element={<Navigate replace to="/services" />} />
        <Route path="/agents" element={<Navigate replace to="/ledger" />} />
        <Route path="/logs" element={<Navigate replace to="/services" />} />
        <Route path="*" element={<Navigate replace to="/work-impact" />} />
      </Routes>
    </section>
  </div>;
}

export default function App() {
  return <LangProvider><Shell /></LangProvider>;
}
