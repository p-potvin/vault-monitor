import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { getServices } from "./api";
import { LangProvider, useLangState } from "./i18n";
import { LedgerPage } from "./pages/LedgerPage";
import { PersonalStatsPage } from "./pages/PersonalStatsPage";
import { SearchPage } from "./pages/SearchPage";
import { ServicesPage } from "./pages/ServicesPage";
import { WorkImpactPage } from "./pages/WorkImpactPage";
import { IconActivity, IconBarChart, IconDatabase, IconSearch, IconServer } from "./icons";

const copy = {
  en: { workImpact: "Work Impact", personalStats: "Personal Stats", ledger: "The Ledger", search: "Search", services: "Services", status: "System status", online: "API online", degraded: "API degraded", language: "Language" },
  qc: { workImpact: "Impact du travail", personalStats: "Stats personnelles", ledger: "Le Registre", search: "Recherche", services: "Services", status: "Etat du systeme", online: "API en ligne", degraded: "API degradee", language: "Langue" },
};
const nav: Array<{ to: string; label: keyof typeof copy.en; icon: ReactNode }> = [
  { to: "/work-impact", label: "workImpact", icon: <IconBarChart /> },
  { to: "/personal-stats", label: "personalStats", icon: <IconActivity /> },
  { to: "/ledger", label: "ledger", icon: <IconDatabase /> },
  { to: "/search", label: "search", icon: <IconSearch /> },
  { to: "/services", label: "services", icon: <IconServer /> },
];

function Logo() {
  return <svg viewBox="0 0 120 120" aria-hidden="true"><path d="M20 15h18l22 67 22-67h18l-33 93H53z" fill="currentColor" /><circle cx="60" cy="58" r="10" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="60" cy="58" r="4" fill="currentColor" /></svg>;
}

function Shell() {
  const [lang, setLang] = useLangState();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const t = copy[lang];
  useEffect(() => {
    const controller = new AbortController();
    getServices(controller.signal).then(() => setApiOnline(true)).catch((reason: Error) => reason.name !== "AbortError" && setApiOnline(false));
    return () => controller.abort();
  }, []);
  return <div className="app-shell">
    <aside className="warm-rail">
      <div className="brand-block"><div className="brand-mark"><Logo /></div><div><strong>V.A.U.L.T</strong><span>Monitor</span></div></div>
      <div className="rail-label">Command deck</div>
      <nav className="nav-list" aria-label="Main navigation">{nav.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : ""}><span>{item.icon}</span><span>{t[item.label]}</span></NavLink>)}</nav>
      <div className="locale-toggle" aria-label={t.language}><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "qc" ? "active" : ""} onClick={() => setLang("qc")}>QC</button></div>
      <div className="rail-status"><p>{t.status}</p><div className="rail-status-line"><span className={`status-led ${apiOnline === true ? "healthy" : apiOnline === false ? "offline" : "stale"}`} /><strong>{apiOnline === false ? t.degraded : t.online}</strong></div></div>
    </aside>
    <section className="monitor-stage">
      <Routes>
        <Route path="/work-impact" element={<WorkImpactPage />} />
        <Route path="/personal-stats" element={<PersonalStatsPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/services" element={<ServicesPage />} />
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
