import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchEvents } from "../api";
import { buildSearchParams, sortSearchResults } from "../features/search/model";
import { useLangState, type Lang } from "../i18n";
import type { SearchResult } from "../types";

const copy = {
  en: {
    title: "Cross-ledger search",
    subtitle: "Bounded, submit-driven search across Agent Ledger and Health Ledger.",
    query: "Query",
    queryPlaceholder: "project, service, summary",
    source: "Source",
    sourceAll: "All",
    sourceAgentLedger: "Agent Ledger",
    sourceHealthLedger: "Health Ledger",
    date: "Date",
    search: "Search",
    searching: "Searching...",
    noResults: "No results",
    unknownTime: "unknown time",
    event: "event",
    advancedFilters: "Advanced Filters",
    filterLabels: {
      project: "project",
      kind: "kind",
      model: "model",
      tool: "tool",
      mcp_server: "mcp server",
      service: "service",
      run: "run",
      event: "event",
      ok: "ok",
    } as Record<string, string>,
  },
  qc: {
    title: "Recherche multi-registres",
    subtitle: "Recherche bornee et lancee sur demande dans le Registre d agents et le Registre de sante.",
    query: "Requete",
    queryPlaceholder: "projet, service, resume",
    source: "Source",
    sourceAll: "Tous",
    sourceAgentLedger: "Registre d agents",
    sourceHealthLedger: "Registre de sante",
    date: "Date",
    search: "Rechercher",
    searching: "Recherche en cours...",
    noResults: "Aucun resultat",
    unknownTime: "heure inconnue",
    event: "evenement",
    advancedFilters: "Filtres avancés",
    filterLabels: {
      project: "projet",
      kind: "type",
      model: "modele",
      tool: "outil",
      mcp_server: "serveur mcp",
      service: "service",
      run: "execution",
      event: "evenement",
      ok: "ok",
    } as Record<string, string>,
  },
} satisfies Record<Lang, Record<string, unknown>>;

export function SearchPage({ setLoading: setLoadingProp }: { setLoading: (loading: boolean) => void }) {
  const [lang] = useLangState();
  const t = copy[lang];
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const [projects, setProjects] = useState<string[]>([]);

  // Fetch project aliases to populate project dropdown
  useEffect(() => {
    const apiBase = (import.meta.env.VITE_MONITOR_API_BASE ?? "https://api.vaultwares.ca").replace(/\/$/, "");
    fetch(`${apiBase}/projects/aliases`)
      .then(res => res.json())
      .then((data: any[]) => {
        const list = data.map(p => p.canonical).filter(Boolean);
        setProjects([...new Set(list)].sort());
      })
      .catch(() => {
        setProjects(["vaultwares-api", "vault-monitor", "vault-streaming", "shared-tube", "prom-king", "agent-ledger", "clipit"]);
      });
  }, []);

  const defaultDateValue = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  // Redirect/set default parameters on initial visit
  useEffect(() => {
    if (![...params.keys()].length) {
      setParams({
        source: "agent-ledger",
        date: defaultDateValue
      });
    }
  }, [params, setParams, defaultDateValue]);

  useEffect(() => {
    setLoadingProp(loading);
  }, [loading, setLoadingProp]);

  useEffect(() => {
    if (![...params.keys()].length) {
      setLoadingProp(false);
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    searchEvents(params, controller.signal)
      .then((body) => setResults(sortSearchResults(body.items)))
      .catch((reason: Error) => reason.name !== "AbortError" && setError(reason.message))
      .finally(() => activeRequest.current === controller && setLoading(false));
    return () => controller.abort();
  }, [params]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newParams: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      const valStr = String(value).trim();
      if (valStr && valStr !== "all") {
        newParams[key] = valStr;
      }
    }
    setParams(buildSearchParams(newParams));
  }

  return (
    <main className="view-stack">
      {/* Title block matching LedgerPage and ServicesPage */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[var(--border)] mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 mb-2 tracking-tight">
            {t.title}
          </h1>
          <p className="m-0 text-[var(--muted)] text-[13px]">
            {t.subtitle}
          </p>
        </div>
      </div>

      <form className="mb-6 flex flex-col gap-4" onSubmit={submit}>
        {/* First Row: Query, Project, Source, Date, and Search Button */}
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.query}</span>
            <input 
              name="q" 
              defaultValue={params.get("q") ?? ""} 
              placeholder={t.queryPlaceholder}
              className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="w-[180px] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.filterLabels.project}</span>
            <select 
              name="project" 
              defaultValue={params.get("project") ?? "all"}
              className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="all">All</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label className="w-[160px] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.source}</span>
            <select 
              name="source" 
              defaultValue={params.get("source") ?? "agent-ledger"}
              className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="all">{t.sourceAll}</option>
              <option value="agent-ledger">{t.sourceAgentLedger}</option>
              <option value="health-ledger">{t.sourceHealthLedger}</option>
            </select>
          </label>

          <label className="w-[160px] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.date}</span>
            <input 
              type="date" 
              name="date" 
              defaultValue={params.get("date") ?? defaultDateValue}
              className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            />
          </label>

          <button 
            className="bg-[var(--accent)] text-[var(--vault-console-bg)] font-extrabold px-6 py-2 rounded-md text-[13px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all self-end h-[38px] cursor-pointer" 
            type="submit"
          >
            {t.search}
          </button>
        </div>

        {/* Collapsible Advanced Filters Section */}
        <details className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4">
          <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] hover:text-white select-none">
            {t.advancedFilters}
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {/* Kind dropdown */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.filterLabels.kind}</span>
              <select 
                name="kind" 
                defaultValue={params.get("kind") ?? "all"}
                className="bg-[var(--vault-console-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-[13px] text-white cursor-pointer"
              >
                <option value="all">All</option>
                <option value="code-change">code-change</option>
                <option value="plan">plan</option>
                <option value="verification">verification</option>
                <option value="commands">commands</option>
                <option value="handoff">handoff</option>
                <option value="general">general</option>
              </select>
            </label>

            {/* Status (ok) dropdown */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.filterLabels.ok}</span>
              <select 
                name="ok" 
                defaultValue={params.get("ok") ?? "all"}
                className="bg-[var(--vault-console-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-[13px] text-white cursor-pointer"
              >
                <option value="all">All</option>
                <option value="true">True (Success)</option>
                <option value="false">False (Failure)</option>
              </select>
            </label>

            {/* Model dropdown */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.filterLabels.model}</span>
              <select 
                name="model" 
                defaultValue={params.get("model") ?? "all"}
                className="bg-[var(--vault-console-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-[13px] text-white cursor-pointer"
              >
                <option value="all">All</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="claude-3-5-sonnet-v2">claude-3-5-sonnet-v2</option>
              </select>
            </label>

            {/* Text Inputs */}
            {["tool", "mcp_server", "service", "run", "event"].map((field) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.filterLabels[field] ?? field.replace(/_/g, " ")}</span>
                <input 
                  name={field} 
                  defaultValue={params.get(field) ?? ""} 
                  className="bg-[var(--vault-console-bg)] border border-[var(--border)] rounded-md px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </label>
            ))}
          </div>
        </details>
      </form>

      {loading && <div className="page-state">{t.searching}</div>}
      {error && <div className="error-line">{error}</div>}
      {!loading && !error && params.size > 0 && results.length === 0 && <div className="page-state">{t.noResults}</div>}

      <section className="search-results">
        {results.map((result, index) => (
          <details className="result-item" key={`${result.source}-${result.timestamp}-${index}`}>
            <summary>
              <strong>{result.project ?? result.service_name ?? result.service_id ?? result.source}</strong>
              <span>{result.source} · {result.timestamp ? new Date(result.timestamp).toLocaleString() : t.unknownTime}</span>
              <p>{result.summary ?? result.event_type ?? result.kind ?? t.event}</p>
            </summary>
            <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
          </details>
        ))}
      </section>
    </main>
  );
}
