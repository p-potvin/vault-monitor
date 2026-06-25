import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchEvents } from "../api";
import { buildSearchParams, sortSearchResults } from "../features/search/model";
import type { SearchResult } from "../types";

const filters = ["project", "kind", "model", "tool", "mcp_server", "service", "run", "event", "ok"] as const;

export function SearchPage() {
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
    <header className="page-heading"><div><h1>Cross-ledger search</h1><p>Bounded, submit-driven search across Agent Ledger and Health Ledger.</p></div></header>
    <form className="search-form search-form-expanded" onSubmit={submit}>
      <label><span>Query</span><input name="q" defaultValue={params.get("q") ?? ""} placeholder="project, service, summary" /></label>
      <label><span>Source</span><select name="source" defaultValue={params.get("source") ?? "all"}><option value="all">All</option><option value="agent-ledger">Agent Ledger</option><option value="health-ledger">Health Ledger</option></select></label>
      <label><span>Date</span><input type="date" name="date" defaultValue={params.get("date") ?? ""} /></label>
      {filters.map((field) => <label key={field}><span>{field.replace(/_/g, " ")}</span><input name={field} defaultValue={params.get(field) ?? ""} /></label>)}
      <button className="command-button" type="submit">Search</button>
    </form>
    {loading && <div className="page-state">Searching...</div>}
    {error && <div className="error-line">{error}</div>}
    {!loading && !error && params.size > 0 && results.length === 0 && <div className="page-state">No results</div>}
    <section className="search-results">{results.map((result, index) => <details className="result-item" key={`${result.source}-${result.timestamp}-${index}`}>
      <summary><strong>{result.project ?? result.service_name ?? result.service_id ?? result.source}</strong><span>{result.source} · {result.timestamp ? new Date(result.timestamp).toLocaleString() : "unknown time"}</span><p>{result.summary ?? result.event_type ?? result.kind ?? "event"}</p></summary>
      <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
    </details>)}</section>
  </main>;
}
