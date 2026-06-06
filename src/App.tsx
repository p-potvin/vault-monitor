import { FormEvent, useEffect, useMemo, useState } from "react";
import { checkKiwi, getOverview, searchEvents } from "./api";
import type { AgentEvent, KiwiStatus, OverviewResponse, SearchResult, UsageItem } from "./types";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/health", label: "Health" },
  { to: "/agents", label: "Agents" },
  { to: "/logs", label: "Logs" },
  { to: "/search", label: "Search" }
];

function statusClass(status?: string) {
  const normalized = (status ?? "missing").toLowerCase();
  if (["ok", "online", "healthy"].includes(normalized)) return "online";
  if (["unchecked", "stale", "missing"].includes(normalized)) return "warning";
  if (["failed", "offline", "alert"].includes(normalized)) return "alert";
  return "sync";
}

function Led({ status, label }: { status?: string; label?: string }) {
  return (
    <span className={`led led-${statusClass(status)}`} aria-label={label ?? status ?? "status"}>
      <span />
    </span>
  );
}

function ShellState({
  overview,
  loading,
  error
}: {
  overview: OverviewResponse | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="shell-state" aria-live="polite">
      <div className="state-line">
        <Led status={error ? "failed" : loading ? "stale" : overview ? "ok" : "missing"} />
        <span>{error ? "API degraded" : loading ? "Syncing" : overview ? "API synced" : "No snapshot"}</span>
      </div>
      {overview?.generated_at && <time>{formatTime(overview.generated_at)}</time>}
    </div>
  );
}

function formatTime(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function numberLabel(value: number | undefined) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function Empty({ label }: { label: string }) {
  return <div className="empty">{label}</div>;
}

function Stat({ label, value, tone = "sync" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Overview({ overview }: { overview: OverviewResponse | null }) {
  if (!overview) return <Empty label="Waiting for monitor API" />;
  const failures = overview.health.recent_failures.slice(0, 4);
  const agentEvents = overview.agents.recent.slice(0, 5);
  return (
    <main className="view-grid">
      <section className="console-panel summary-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Vault Authenticated Unified Ledger Telemetry Monitor</p>
            <h1>V.A.U.L.T Monitor</h1>
          </div>
          <div className="status-pill">
            <Led status={overview.health.status} />
            <span>{overview.api_owner}</span>
          </div>
        </div>
        <div className="stat-grid">
          <Stat label="Services" value={numberLabel(overview.health.totals.total)} tone="relay" />
          <Stat label="Failures" value={numberLabel(overview.health.totals.failed)} tone={overview.health.totals.failed ? "alert" : "online"} />
          <Stat label="Agent Events" value={numberLabel(overview.agents.usage.total_events)} tone="sync" />
          <Stat label="Incidents" value={numberLabel(overview.health.active_incident_count)} tone={overview.health.active_incident_count ? "warning" : "online"} />
        </div>
      </section>

      <section className="console-panel">
        <div className="panel-heading">
          <h2>Source State</h2>
        </div>
        <div className="source-list">
          <SourceRow label="Health Ledger" status={overview.health.status} detail={overview.health.run_id ?? "No run"} />
          <SourceRow label="Agent Ledger" status={overview.agents.status} detail={`${overview.agents.recent.length} recent`} />
          <SourceRow label="Kiwi Logging" status={overview.logging.kiwi.status} detail={overview.logging.kiwi.url} />
        </div>
      </section>

      <section className="console-panel">
        <div className="panel-heading">
          <h2>Latest Failures</h2>
        </div>
        {failures.length ? (
          <div className="event-list">
            {failures.map((failure, index) => (
              <EventLine
                key={`${String(failure.service_id)}-${index}`}
                tone="alert"
                title={String(failure.service_name ?? failure.service_id ?? "Probe failure")}
                meta={String(failure.failure_class ?? failure.event_type ?? "failure")}
              />
            ))}
          </div>
        ) : (
          <Empty label="No recent probe failures" />
        )}
      </section>

      <section className="console-panel">
        <div className="panel-heading">
          <h2>Recent Work</h2>
        </div>
        <AgentList events={agentEvents} compact />
      </section>
    </main>
  );
}

function SourceRow({ label, status, detail }: { label: string; status?: string; detail: string }) {
  return (
    <div className="source-row">
      <Led status={status} />
      <span>{label}</span>
      <code>{detail}</code>
    </div>
  );
}

function EventLine({ title, meta, tone = "sync" }: { title: string; meta?: string; tone?: string }) {
  return (
    <div className="event-line">
      <Led status={tone} />
      <div>
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}

function HealthView({ overview }: { overview: OverviewResponse | null }) {
  if (!overview) return <Empty label="Waiting for health API" />;
  const services = overview.health.services;
  const ollama = overview.health.resource_samples[0];
  return (
    <main className="view-stack">
      <section className="console-panel">
        <div className="panel-heading">
          <h1>Health</h1>
          <span>{overview.health.probe_location ?? "Unknown probe"}</span>
        </div>
        <div className="stat-grid">
          <Stat label="OK" value={numberLabel(overview.health.totals.ok)} tone="online" />
          <Stat label="Failed" value={numberLabel(overview.health.totals.failed)} tone={overview.health.totals.failed ? "alert" : "online"} />
          <Stat label="Skipped" value={numberLabel(overview.health.totals.skipped)} tone="warning" />
          <Stat label="Incidents" value={numberLabel(overview.health.active_incident_count)} tone="warning" />
        </div>
      </section>

      <section className="data-band">
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Env</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Repo</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const firstPath = service.paths?.[0];
                return (
                  <tr key={service.service_id}>
                    <td>
                      <strong>{service.service_name ?? service.service_id}</strong>
                      <span>{service.service_id}</span>
                    </td>
                    <td>{service.environment ?? "n/a"}</td>
                    <td>
                      <span className="inline-status">
                        <Led status={service.status} /> {service.status ?? "unknown"}
                      </span>
                    </td>
                    <td>{firstPath?.duration_ms != null ? `${firstPath.duration_ms}ms` : "n/a"}</td>
                    <td>{service.repo ?? "n/a"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="console-panel">
        <div className="panel-heading">
          <h2>Ollama / CI Joker</h2>
        </div>
        <pre className="json-block">{JSON.stringify(ollama ?? { status: "no resource sample" }, null, 2)}</pre>
      </section>
    </main>
  );
}

function AgentsView({ overview }: { overview: OverviewResponse | null }) {
  if (!overview) return <Empty label="Waiting for agent API" />;
  return (
    <main className="view-grid agents-grid">
      <section className="console-panel">
        <div className="panel-heading">
          <h1>Agents</h1>
          <span>{numberLabel(overview.agents.usage.total_events)} events</span>
        </div>
        <UsageBars title="Models" items={overview.agents.usage.models} />
        <UsageBars title="Tools" items={overview.agents.usage.tools} />
        <UsageBars title="MCP" items={overview.agents.usage.mcp_servers} />
      </section>
      <section className="console-panel recent-work-panel">
        <div className="panel-heading">
          <h2>Recent Work</h2>
        </div>
        <AgentList events={overview.agents.recent} />
      </section>
    </main>
  );
}

function UsageBars({ title, items }: { title: string; items: UsageItem[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className="usage-block">
      <h3>{title}</h3>
      {items.length ? (
        items.map((item) => (
          <div className="usage-row" key={`${title}-${item.name}`}>
            <span>{item.name}</span>
            <div className="usage-track">
              <i style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
            </div>
            <strong>{item.count}</strong>
          </div>
        ))
      ) : (
        <Empty label="No aggregate" />
      )}
    </div>
  );
}

function AgentList({ events, compact = false }: { events: AgentEvent[]; compact?: boolean }) {
  if (!events.length) return <Empty label="No recent work" />;
  return (
    <div className={`agent-list ${compact ? "agent-list-compact" : ""}`}>
      {events.map((event) => (
        <article className="agent-event" key={event.id}>
          <div className="event-head">
            <strong>{event.project}</strong>
            <span>{event.kind}</span>
          </div>
          <p>{event.summary}</p>
          <div className="event-meta">
            <time>{formatTime(event.timestamp)}</time>
            {event.model && <code>{event.model}</code>}
          </div>
        </article>
      ))}
    </div>
  );
}

function LogsView({ kiwi, onCheck }: { kiwi: KiwiStatus | null; onCheck: () => void }) {
  const kiwiUrl = kiwi?.url ?? import.meta.env.VITE_KIWI_URL ?? "https://localhost:5959/home";
  return (
    <main className="view-stack">
      <section className="console-panel">
        <div className="panel-heading">
          <h1>Logs</h1>
          <span className="inline-status">
            <Led status={kiwi?.status} /> {kiwi?.status ?? "unchecked"}
          </span>
        </div>
        <div className="log-actions">
          <a className="command-button" href={kiwiUrl} target="_blank" rel="noreferrer">
            Open Kiwi
          </a>
          <button className="command-button secondary" type="button" onClick={onCheck}>
            Check Status
          </button>
        </div>
        <div className="kiwi-status">
          <Stat label="Status Code" value={kiwi?.status_code ?? "n/a"} tone={statusClass(kiwi?.status)} />
          <Stat label="Latency" value={kiwi?.duration_ms != null ? `${kiwi.duration_ms}ms` : "n/a"} tone="relay" />
          <Stat label="Checked" value={formatTime(kiwi?.checked_at)} tone="sync" />
        </div>
      </section>
    </main>
  );
}

function SearchView() {
  const [params, setParamsState] = useState(() => new URLSearchParams(window.location.search));
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const initialQuery = params.get("q") ?? "";

  function setParams(next: URLSearchParams) {
    const url = `${window.location.pathname}${next.toString() ? `?${next.toString()}` : ""}`;
    window.history.replaceState({}, "", url);
    setParamsState(next);
  }

  useEffect(() => {
    if (!params.toString()) return;
    const controller = new AbortController();
    searchEvents(params, controller.signal)
      .then((body) => {
        setResults(body.items);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
    return () => controller.abort();
  }, [params]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const text = String(value).trim();
      if (text) next.set(key, text);
    }
    next.set("limit", "40");
    setParams(next);
  }

  return (
    <main className="view-stack">
      <section className="console-panel">
        <div className="panel-heading">
          <h1>Search</h1>
          <span>{results.length} results</span>
        </div>
        <form className="search-form" onSubmit={submit}>
          <input name="q" defaultValue={initialQuery} placeholder="gateway, Probe Joker, vault-monitor" />
          <input name="project" defaultValue={params.get("project") ?? ""} placeholder="project" />
          <input name="service" defaultValue={params.get("service") ?? ""} placeholder="service" />
          <input name="kind" defaultValue={params.get("kind") ?? ""} placeholder="kind" />
          <button className="command-button" type="submit">
            Search
          </button>
        </form>
        {error && <div className="error-line">{error}</div>}
      </section>
      <section className="search-results">
        {results.length ? results.map((result, index) => <ResultItem key={`${result.source}-${index}`} result={result} />) : <Empty label="No query results" />}
      </section>
    </main>
  );
}

function ResultItem({ result }: { result: SearchResult }) {
  const title = result.project ?? result.service_name ?? result.service_id ?? result.source;
  const meta = result.kind ?? result.event_type ?? result.failure_class ?? result.model ?? "event";
  return (
    <article className="result-item">
      <div className="event-head">
        <strong>{title}</strong>
        <span>{result.source}</span>
      </div>
      <p>{result.summary ?? `${meta}${result.ok === false ? " failed" : ""}`}</p>
      <div className="event-meta">
        <time>{formatTime(result.timestamp)}</time>
        <code>{meta}</code>
      </div>
    </article>
  );
}

export default function App() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [kiwi, setKiwi] = useState<KiwiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const controller = new AbortController();
    getOverview(controller.signal)
      .then((body) => {
        setOverview(body);
        setKiwi(body.logging.kiwi);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const kiwiState = useMemo(() => kiwi ?? overview?.logging.kiwi ?? null, [kiwi, overview]);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function refreshKiwi() {
    checkKiwi()
      .then((state) => {
        setKiwi(state);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }

  function navigate(to: string) {
    window.history.pushState({}, "", to);
    setPath(to);
  }

  let view = <Overview overview={overview} />;
  if (path === "/health") view = <HealthView overview={overview} />;
  if (path === "/agents") view = <AgentsView overview={overview} />;
  if (path === "/logs") view = <LogsView kiwi={kiwiState} onCheck={refreshKiwi} />;
  if (path === "/search") view = <SearchView />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">V</div>
          <div>
            <strong>V.A.U.L.T</strong>
            <span>Monitor</span>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.to}
              type="button"
              className={path === item.to ? "active" : ""}
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <ShellState overview={overview} loading={loading} error={error} />
      </aside>
      <div className="content-shell">
        {view}
      </div>
    </div>
  );
}
