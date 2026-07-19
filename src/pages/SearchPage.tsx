import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchEvents } from "../api";
import { buildSearchParams, sortSearchResults } from "../features/search/model";
import { useLangState, type Lang } from "../i18n";
import type { SearchResult } from "../types";

const filters = ["project", "kind", "model", "tool", "mcp_server", "service", "run", "event", "ok"] as const;

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

export function SearchPage() {
  const [lang] = useLangState();
  const t = copy[lang];
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (![...params.keys()].length) return;
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
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setParams(buildSearchParams(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]))));
  }

  return <main className="view-stack">
    <header className="page-heading"><div><h1>{t.title}</h1><p>{t.subtitle}</p></div></header>
    <form className="search-form search-form-expanded" onSubmit={submit}>
      <label><span>{t.query}</span><input name="q" defaultValue={params.get("q") ?? ""} placeholder={t.queryPlaceholder} /></label>
      <label><span>{t.source}</span><select name="source" defaultValue={params.get("source") ?? "all"}><option value="all">{t.sourceAll}</option><option value="agent-ledger">{t.sourceAgentLedger}</option><option value="health-ledger">{t.sourceHealthLedger}</option></select></label>
      <label><span>{t.date}</span><input type="date" name="date" defaultValue={params.get("date") ?? ""} /></label>
      {filters.map((field) => <label key={field}><span>{t.filterLabels[field] ?? field.replace(/_/g, " ")}</span><input name={field} defaultValue={params.get(field) ?? ""} /></label>)}
      <button className="command-button" type="submit">{t.search}</button>
    </form>
    {loading && <div className="page-state">{t.searching}</div>}
    {error && <div className="error-line">{error}</div>}
    {!loading && !error && params.size > 0 && results.length === 0 && <div className="page-state">{t.noResults}</div>}
    <section className="search-results">{results.map((result, index) => <details className="result-item" key={`${result.source}-${result.timestamp}-${index}`}>
      <summary><strong>{result.project ?? result.service_name ?? result.service_id ?? result.source}</strong><span>{result.source} · {result.timestamp ? new Date(result.timestamp).toLocaleString() : t.unknownTime}</span><p>{result.summary ?? result.event_type ?? result.kind ?? t.event}</p></summary>
      <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
    </details>)}</section>
  </main>;
}
