import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { checkKiwi, getOverview, searchEvents } from "./api";
import type { AgentEvent, KiwiStatus, OverviewResponse, SearchResult, UsageItem } from "./types";
import {
  IconActivity,
  IconAlertTriangle,
  IconBarChart,
  IconClock,
  IconInfo,
  IconTrendUp,
  IconZap
} from "../vaultwares-themes/vaultwares-revisited/icons/monitoring";
import {
  IconBell,
  IconDashboard,
  IconSearch,
  IconSettings,
  IconUsers
} from "../vaultwares-themes/vaultwares-revisited/icons/navigation";

type Locale = "en" | "qc";
type Tone = "online" | "relay" | "sync" | "warning" | "alert";
type ViewPath = "/" | "/health" | "/agents" | "/logs" | "/search";

const text = {
  en: {
    nav: {
      overview: "Overview",
      health: "Health",
      agents: "Agents",
      logs: "Logs",
      search: "Search"
    },
    chrome: {
      product: "V.A.U.L.T",
      monitor: "Monitor",
      internal: "Vault Authenticated Unified Ledger Telemetry Monitor",
      system: "Unified ledger telemetry",
      shellStatus: "Shell status",
      synced: "API synced",
      syncing: "Syncing",
      degraded: "API degraded",
      noSnapshot: "No snapshot",
      language: "Language",
      english: "EN",
      french: "QC",
      lastSync: "Last sync",
      commandDeck: "Command deck",
      apiOwner: "API owner"
    },
    overview: {
      title: "Operational Overview",
      subtitle: "Health Ledger, Agent Ledger, and Kiwi logging from one read-only monitor surface.",
      services: "Services",
      failures: "Failures",
      agentEvents: "Agent events",
      incidents: "Incidents",
      sourceState: "Source state",
      latestFailures: "Latest failures",
      recentWork: "Recent work",
      healthLedger: "Health Ledger",
      agentLedger: "Agent Ledger",
      kiwiLogging: "Kiwi logging",
      noFailures: "No recent probe failures",
      noRecentWork: "No recent work",
      storage: "Storage transition",
      dataFreshness: "Data freshness",
      servicePosture: "Service posture",
      daySeries: "Agent activity",
      workImpact: "Work impact",
      unresolved: "Unresolved incidents"
    },
    health: {
      title: "Health Ledger",
      subtitle: "Service probes, incidents, latency, Ollama samples, Probe Joker, CI Joker, and Alarm Joker state.",
      probe: "Probe",
      ok: "OK",
      failed: "Failed",
      skipped: "Skipped",
      activeIncidents: "Active incidents",
      services: "Services",
      service: "Service",
      environment: "Env",
      status: "Status",
      latency: "Latency",
      repo: "Repo",
      serviceMap: "Service map",
      runtime: "Runtime sample",
      noSample: "No resource sample",
      noServices: "No services reported"
    },
    agents: {
      title: "Agent Ledger",
      subtitle: "Recent work, project activity, verification signals, models, tools, and MCP usage.",
      events: "Events",
      models: "Models",
      tools: "Tools",
      mcp: "MCP servers",
      recent: "Recent work",
      commands: "Commands",
      files: "Files",
      noAggregate: "No aggregate",
      noEvents: "No agent events"
    },
    logs: {
      title: "Kiwi Logs",
      subtitle: "Safe reachability check and deep link only. Rich log search belongs behind the API/DB contract.",
      open: "Open Kiwi",
      check: "Check status",
      statusCode: "Status code",
      latency: "Latency",
      checked: "Checked",
      message: "Message",
      contract: "Log contract",
      safeMode: "No iframe, scraping, raw log rendering, or aggressive polling."
    },
    search: {
      title: "Cross-Ledger Search",
      subtitle: "Find recent work, project history, probe failures, and health events through normalized monitor APIs.",
      query: "gateway, Probe Joker, vault-monitor",
      project: "project",
      service: "service",
      kind: "kind",
      submit: "Search",
      results: "results",
      noResults: "No query results",
      filters: "Lookup filters"
    },
    states: {
      waitingApi: "Waiting for monitor API",
      waitingHealth: "Waiting for health API",
      waitingAgent: "Waiting for agent API",
      never: "Never",
      unknown: "unknown",
      unchecked: "unchecked",
      unavailable: "n/a"
    }
  },
  qc: {
    nav: {
      overview: "Aperçu",
      health: "Santé",
      agents: "Agents",
      logs: "Journaux",
      search: "Recherche"
    },
    chrome: {
      product: "V.A.U.L.T",
      monitor: "Moniteur",
      internal: "Moniteur de télémétrie unifiée et authentifiée des registres Vault",
      system: "Télémétrie unifiée des registres",
      shellStatus: "État du poste",
      synced: "API synchronisée",
      syncing: "Synchronisation",
      degraded: "API dégradée",
      noSnapshot: "Aucun instantané",
      language: "Langue",
      english: "EN",
      french: "QC",
      lastSync: "Dernière synchro",
      commandDeck: "Pupitre de commande",
      apiOwner: "API responsable"
    },
    overview: {
      title: "Aperçu opérationnel",
      subtitle: "Health Ledger, Agent Ledger et Kiwi depuis une surface de monitorage en lecture seule.",
      services: "Services",
      failures: "Échecs",
      agentEvents: "Événements agent",
      incidents: "Incidents",
      sourceState: "État des sources",
      latestFailures: "Échecs récents",
      recentWork: "Travail récent",
      healthLedger: "Health Ledger",
      agentLedger: "Agent Ledger",
      kiwiLogging: "Journaux Kiwi",
      noFailures: "Aucun échec de sonde récent",
      noRecentWork: "Aucun travail récent",
      storage: "Transition stockage",
      dataFreshness: "Fraîcheur des données",
      servicePosture: "Posture des services",
      daySeries: "Activité agent",
      workImpact: "Impact du travail",
      unresolved: "Incidents ouverts"
    },
    health: {
      title: "Health Ledger",
      subtitle: "Sondes de service, incidents, latence, échantillons Ollama, Probe Joker, CI Joker et Alarm Joker.",
      probe: "Sonde",
      ok: "OK",
      failed: "Échec",
      skipped: "Ignoré",
      activeIncidents: "Incidents actifs",
      services: "Services",
      service: "Service",
      environment: "Env.",
      status: "État",
      latency: "Latence",
      repo: "Dépôt",
      serviceMap: "Carte des services",
      runtime: "Échantillon runtime",
      noSample: "Aucun échantillon de ressource",
      noServices: "Aucun service rapporté"
    },
    agents: {
      title: "Agent Ledger",
      subtitle: "Travail récent, activité par projet, vérifications, modèles, outils et usage MCP.",
      events: "Événements",
      models: "Modèles",
      tools: "Outils",
      mcp: "Serveurs MCP",
      recent: "Travail récent",
      commands: "Commandes",
      files: "Fichiers",
      noAggregate: "Aucun agrégat",
      noEvents: "Aucun événement agent"
    },
    logs: {
      title: "Journaux Kiwi",
      subtitle: "Vérification de disponibilité et lien profond seulement. La recherche riche passe par l'API/DB.",
      open: "Ouvrir Kiwi",
      check: "Vérifier l'état",
      statusCode: "Code statut",
      latency: "Latence",
      checked: "Vérifié",
      message: "Message",
      contract: "Contrat journaux",
      safeMode: "Aucun iframe, scraping, rendu brut de logs ou polling agressif."
    },
    search: {
      title: "Recherche inter-registres",
      subtitle: "Retrouver travail récent, historique projet, échecs de sondes et santé via les APIs normalisées.",
      query: "gateway, Probe Joker, vault-monitor",
      project: "projet",
      service: "service",
      kind: "type",
      submit: "Chercher",
      results: "résultats",
      noResults: "Aucun résultat",
      filters: "Filtres de recherche"
    },
    states: {
      waitingApi: "En attente de l'API monitor",
      waitingHealth: "En attente de l'API santé",
      waitingAgent: "En attente de l'API agent",
      never: "Jamais",
      unknown: "inconnu",
      unchecked: "non vérifié",
      unavailable: "s.o."
    }
  }
} as const;

const navItems: Array<{ to: ViewPath; label: keyof typeof text.en.nav; icon: ReactNode }> = [
  { to: "/", label: "overview", icon: <IconDashboard /> },
  { to: "/health", label: "health", icon: <IconActivity /> },
  { to: "/agents", label: "agents", icon: <IconUsers /> },
  { to: "/logs", label: "logs", icon: <IconBell /> },
  { to: "/search", label: "search", icon: <IconSearch /> }
];

function toneFromStatus(status?: string): Tone {
  const normalized = (status ?? "missing").toLowerCase();
  if (["ok", "online", "healthy"].includes(normalized)) return "online";
  if (["unchecked", "stale", "missing", "skipped"].includes(normalized)) return "warning";
  if (["failed", "offline", "alert", "error"].includes(normalized)) return "alert";
  if (["relay", "info", "processing"].includes(normalized)) return "relay";
  return "sync";
}

function formatTime(value: string | null | undefined, locale: Locale) {
  if (!value) return text[locale].states.never;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const browserLocale = locale === "qc" ? "fr-CA" : undefined;
  return date.toLocaleString(browserLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function numberLabel(value: number | undefined, locale: Locale) {
  return new Intl.NumberFormat(locale === "qc" ? "fr-CA" : undefined).format(value ?? 0);
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function safeText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function Led({ tone = "sync", pulse = true, label }: { tone?: Tone; pulse?: boolean; label?: string }) {
  return (
    <span className={`led led-${tone} ${pulse ? "vw-led" : ""}`} aria-label={label ?? tone}>
      <span />
    </span>
  );
}

function Empty({ label, icon = <IconInfo /> }: { label: string; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Badge({ children, tone = "sync" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`badge badge-${tone}`}>
      <Led tone={tone} pulse={false} />
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "sync",
  meta,
  icon
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  meta?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-label">
        {icon && <span aria-hidden="true">{icon}</span>}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {meta && <small>{meta}</small>}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
  action
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function Panel({ title, children, meta, className = "" }: { title?: string; children: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || meta) && (
        <div className="panel-heading">
          {title && <h2>{title}</h2>}
          {meta}
        </div>
      )}
      {children}
    </section>
  );
}

function ShellState({
  overview,
  loading,
  error,
  locale
}: {
  overview: OverviewResponse | null;
  loading: boolean;
  error: string | null;
  locale: Locale;
}) {
  const t = text[locale];
  const tone = error ? "alert" : loading ? "sync" : overview ? "online" : "warning";
  const label = error ? t.chrome.degraded : loading ? t.chrome.syncing : overview ? t.chrome.synced : t.chrome.noSnapshot;

  return (
    <div className="rail-status" aria-live="polite">
      <p>{t.chrome.shellStatus}</p>
      <div className="rail-status-line">
        <Led tone={tone} />
        <strong>{label}</strong>
      </div>
      <time>{formatTime(overview?.generated_at, locale)}</time>
      {error && <span className="rail-error">{error}</span>}
    </div>
  );
}

function SourceRow({ label, status, detail }: { label: string; status?: string; detail: string }) {
  const tone = toneFromStatus(status);
  return (
    <div className="source-row">
      <Led tone={tone} />
      <strong>{label}</strong>
      <code>{detail}</code>
      <Badge tone={tone}>{status ?? "unknown"}</Badge>
    </div>
  );
}

function EventLine({ title, meta, tone = "sync" }: { title: string; meta?: string; tone?: Tone }) {
  return (
    <div className="event-line">
      <Led tone={tone} />
      <div>
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}

function DaySeries({ items, locale }: { items: Array<{ day: string; count: number }>; locale: Locale }) {
  const series = items.slice(-10);
  const max = Math.max(...series.map((item) => item.count), 1);
  if (!series.length) return <Empty label={text[locale].agents.noAggregate} icon={<IconBarChart />} />;
  return (
    <div className="day-series" role="img" aria-label={text[locale].overview.daySeries}>
      {series.map((item) => (
        <div className="day-bar" key={item.day}>
          <i style={{ height: `${Math.max(12, (item.count / max) * 100)}%` }} />
          <span>{item.day.slice(5)}</span>
          <strong>{numberLabel(item.count, locale)}</strong>
        </div>
      ))}
    </div>
  );
}

function HealthStrip({ overview, locale }: { overview: OverviewResponse; locale: Locale }) {
  const totals = overview.health.totals;
  const total = Math.max(totals.total, 1);
  return (
    <div className="posture-strip" aria-label={text[locale].overview.servicePosture}>
      <i className="posture-online" style={{ width: `${percent(totals.ok, total)}%` }} />
      <i className="posture-alert" style={{ width: `${percent(totals.failed, total)}%` }} />
      <i className="posture-warning" style={{ width: `${percent(totals.skipped, total)}%` }} />
    </div>
  );
}

function Overview({ overview, locale }: { overview: OverviewResponse | null; locale: Locale }) {
  const t = text[locale];
  if (!overview) return <Empty label={t.states.waitingApi} />;

  const failures = overview.health.recent_failures.slice(0, 5);
  const agentEvents = overview.agents.recent.slice(0, 5);
  const totals = overview.health.totals;

  return (
    <main className="view-stack">
      <section className="hero-panel">
        <SectionHeader
          kicker={t.chrome.internal}
          title={t.overview.title}
          subtitle={t.overview.subtitle}
          action={<Badge tone={toneFromStatus(overview.health.status)}>{overview.api_owner}</Badge>}
        />
        <div className="hero-metrics">
          <Stat label={t.overview.services} value={numberLabel(totals.total, locale)} tone="relay" icon={<IconDashboard />} />
          <Stat label={t.overview.failures} value={numberLabel(totals.failed, locale)} tone={totals.failed ? "alert" : "online"} icon={<IconAlertTriangle />} />
          <Stat label={t.overview.agentEvents} value={numberLabel(overview.agents.usage.total_events, locale)} tone="sync" icon={<IconUsers />} />
          <Stat label={t.overview.incidents} value={numberLabel(overview.health.active_incident_count, locale)} tone={overview.health.active_incident_count ? "warning" : "online"} icon={<IconBell />} />
        </div>
        <HealthStrip overview={overview} locale={locale} />
      </section>

      <div className="overview-grid">
        <Panel title={t.overview.sourceState} meta={<Badge tone={toneFromStatus(overview.health.status)}>{t.chrome.lastSync}</Badge>}>
          <div className="source-list">
            <SourceRow label={t.overview.healthLedger} status={overview.health.status} detail={overview.health.run_id ?? t.states.unknown} />
            <SourceRow label={t.overview.agentLedger} status={overview.agents.status} detail={`${overview.agents.recent.length} ${t.overview.recentWork.toLowerCase()}`} />
            <SourceRow label={t.overview.kiwiLogging} status={overview.logging.kiwi.status} detail={overview.logging.kiwi.url} />
          </div>
        </Panel>

        <Panel title={t.overview.dataFreshness} meta={<IconClock aria-hidden="true" />}>
          <div className="freshness-grid">
            <Freshness label={t.overview.healthLedger} value={overview.health.generated_at} locale={locale} />
            <Freshness label={t.overview.agentLedger} value={overview.generated_at} locale={locale} />
            <Freshness label={t.overview.kiwiLogging} value={overview.logging.kiwi.checked_at} locale={locale} />
          </div>
        </Panel>

        <Panel title={t.overview.latestFailures} className="span-tall">
          {failures.length ? (
            <div className="event-list">
              {failures.map((failure, index) => (
                <EventLine
                  key={`${safeText(failure.service_id, "failure")}-${index}`}
                  tone="alert"
                  title={safeText(failure.service_name ?? failure.service_id, "Probe failure")}
                  meta={safeText(failure.failure_class ?? failure.event_type, "failure")}
                />
              ))}
            </div>
          ) : (
            <Empty label={t.overview.noFailures} icon={<IconTrendUp />} />
          )}
        </Panel>

        <Panel title={t.overview.daySeries}>
          <DaySeries items={overview.agents.usage.day_series} locale={locale} />
        </Panel>

        <Panel title={t.overview.recentWork} className="recent-panel">
          <AgentList events={agentEvents} compact locale={locale} />
        </Panel>

        <Panel title={t.overview.storage} meta={<IconInfo aria-hidden="true" />}>
          <p className="note-copy">{overview.storage_note}</p>
        </Panel>
      </div>
    </main>
  );
}

function Freshness({ label, value, locale }: { label: string; value?: string | null; locale: Locale }) {
  return (
    <div className="freshness-item">
      <span>{label}</span>
      <time>{formatTime(value, locale)}</time>
    </div>
  );
}

function HealthView({ overview, locale }: { overview: OverviewResponse | null; locale: Locale }) {
  const t = text[locale];
  if (!overview) return <Empty label={t.states.waitingHealth} />;

  const services = overview.health.services;
  const totals = overview.health.totals;
  const ollama = overview.health.resource_samples[0];

  return (
    <main className="view-stack">
      <section className="hero-panel compact-hero">
        <SectionHeader
          kicker={`${t.health.probe}: ${overview.health.probe_location ?? t.states.unknown}`}
          title={t.health.title}
          subtitle={t.health.subtitle}
          action={<Badge tone={toneFromStatus(overview.health.status)}>{overview.health.status}</Badge>}
        />
        <div className="hero-metrics">
          <Stat label={t.health.ok} value={numberLabel(totals.ok, locale)} tone="online" />
          <Stat label={t.health.failed} value={numberLabel(totals.failed, locale)} tone={totals.failed ? "alert" : "online"} />
          <Stat label={t.health.skipped} value={numberLabel(totals.skipped, locale)} tone="warning" />
          <Stat label={t.health.activeIncidents} value={numberLabel(overview.health.active_incident_count, locale)} tone={overview.health.active_incident_count ? "warning" : "online"} />
        </div>
      </section>

      <Panel title={t.health.serviceMap} meta={<Badge tone="relay">{numberLabel(services.length, locale)} {t.health.services}</Badge>}>
        {services.length ? (
          <div className="service-matrix">
            {services.map((service) => {
              const firstPath = service.paths?.[0];
              const tone = toneFromStatus(service.status);
              return (
                <article className={`service-tile service-${tone}`} key={service.service_id}>
                  <div className="service-head">
                    <Led tone={tone} />
                    <strong>{service.service_name ?? service.service_id}</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>{t.health.status}</dt>
                      <dd>{service.status ?? t.states.unknown}</dd>
                    </div>
                    <div>
                      <dt>{t.health.latency}</dt>
                      <dd>{firstPath?.duration_ms != null ? `${firstPath.duration_ms}ms` : t.states.unavailable}</dd>
                    </div>
                    <div>
                      <dt>{t.health.repo}</dt>
                      <dd>{service.repo ?? t.states.unavailable}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty label={t.health.noServices} />
        )}
      </Panel>

      <Panel title={t.health.services}>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>{t.health.service}</th>
                <th>{t.health.environment}</th>
                <th>{t.health.status}</th>
                <th>{t.health.latency}</th>
                <th>{t.health.repo}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const firstPath = service.paths?.[0];
                const tone = toneFromStatus(service.status);
                return (
                  <tr key={service.service_id}>
                    <td>
                      <strong>{service.service_name ?? service.service_id}</strong>
                      <span>{service.service_id}</span>
                    </td>
                    <td>{service.environment ?? t.states.unavailable}</td>
                    <td><Badge tone={tone}>{service.status ?? t.states.unknown}</Badge></td>
                    <td>{firstPath?.duration_ms != null ? `${firstPath.duration_ms}ms` : t.states.unavailable}</td>
                    <td>{service.repo ?? t.states.unavailable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={t.health.runtime} meta={<IconZap aria-hidden="true" />}>
        <pre className="json-block">{JSON.stringify(ollama ?? { status: t.health.noSample }, null, 2)}</pre>
      </Panel>
    </main>
  );
}

function AgentsView({ overview, locale }: { overview: OverviewResponse | null; locale: Locale }) {
  const t = text[locale];
  if (!overview) return <Empty label={t.states.waitingAgent} />;

  return (
    <main className="view-stack">
      <section className="hero-panel compact-hero">
        <SectionHeader
          kicker={t.overview.workImpact}
          title={t.agents.title}
          subtitle={t.agents.subtitle}
          action={<Badge tone={toneFromStatus(overview.agents.status)}>{numberLabel(overview.agents.usage.total_events, locale)} {t.agents.events}</Badge>}
        />
      </section>

      <div className="agents-layout">
        <Panel title={t.agents.models}>
          <UsageBars title={t.agents.models} items={overview.agents.usage.models} locale={locale} />
        </Panel>
        <Panel title={t.agents.tools}>
          <UsageBars title={t.agents.tools} items={overview.agents.usage.tools} locale={locale} />
        </Panel>
        <Panel title={t.agents.mcp}>
          <UsageBars title={t.agents.mcp} items={overview.agents.usage.mcp_servers} locale={locale} />
        </Panel>
        <Panel title={t.agents.recent} className="agent-feed-panel">
          <AgentList events={overview.agents.recent} locale={locale} />
        </Panel>
      </div>
    </main>
  );
}

function UsageBars({ items, locale }: { title: string; items: UsageItem[]; locale: Locale }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  if (!items.length) return <Empty label={text[locale].agents.noAggregate} icon={<IconBarChart />} />;

  return (
    <div className="usage-block">
      {items.slice(0, 8).map((item) => (
        <div className="usage-row" key={item.name}>
          <span>{item.name}</span>
          <div className="usage-track" aria-hidden="true">
            <i style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }} />
          </div>
          <strong>{numberLabel(item.count, locale)}</strong>
        </div>
      ))}
    </div>
  );
}

function AgentList({ events, compact = false, locale }: { events: AgentEvent[]; compact?: boolean; locale: Locale }) {
  const t = text[locale];
  if (!events.length) return <Empty label={t.agents.noEvents} icon={<IconUsers />} />;
  return (
    <div className={`agent-list ${compact ? "agent-list-compact" : ""}`}>
      {events.map((event) => (
        <article className="agent-event" key={event.id}>
          <div className="event-head">
            <strong>{event.project || t.states.unknown}</strong>
            <Badge tone="sync">{event.kind || "event"}</Badge>
          </div>
          <p>{event.summary || event.id}</p>
          <div className="event-meta">
            <time>{formatTime(event.timestamp, locale)}</time>
            <span>{event.commands?.length ?? 0} {t.agents.commands}</span>
            <span>{event.files?.length ?? 0} {t.agents.files}</span>
            {event.model && <code>{event.model}</code>}
          </div>
        </article>
      ))}
    </div>
  );
}

function LogsView({ kiwi, onCheck, locale }: { kiwi: KiwiStatus | null; onCheck: () => void; locale: Locale }) {
  const t = text[locale];
  const kiwiUrl = kiwi?.url ?? import.meta.env.VITE_KIWI_URL ?? "https://localhost:5959/home";
  const tone = toneFromStatus(kiwi?.status);

  return (
    <main className="view-stack">
      <section className="hero-panel compact-hero">
        <SectionHeader
          kicker={t.logs.contract}
          title={t.logs.title}
          subtitle={t.logs.subtitle}
          action={<Badge tone={tone}>{kiwi?.status ?? t.states.unchecked}</Badge>}
        />
        <div className="command-row">
          <a className="command-button" href={kiwiUrl} target="_blank" rel="noreferrer">
            <IconDashboard aria-hidden="true" />
            {t.logs.open}
          </a>
          <button className="command-button secondary" type="button" onClick={onCheck}>
            <IconActivity aria-hidden="true" />
            {t.logs.check}
          </button>
        </div>
      </section>

      <div className="log-grid">
        <Stat label={t.logs.statusCode} value={kiwi?.status_code ?? t.states.unavailable} tone={tone} />
        <Stat label={t.logs.latency} value={kiwi?.duration_ms != null ? `${kiwi.duration_ms}ms` : t.states.unavailable} tone="relay" />
        <Stat label={t.logs.checked} value={formatTime(kiwi?.checked_at, locale)} tone="sync" />
      </div>

      <Panel title={t.logs.message} meta={<IconInfo aria-hidden="true" />}>
        <p className="note-copy">{kiwi?.message ?? t.logs.safeMode}</p>
      </Panel>
    </main>
  );
}

function SearchView({ locale }: { locale: Locale }) {
  const t = text[locale];
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
      const fieldValue = String(value).trim();
      if (fieldValue) next.set(key, fieldValue);
    }
    next.set("limit", "40");
    setParams(next);
  }

  return (
    <main className="view-stack">
      <section className="hero-panel compact-hero">
        <SectionHeader
          kicker={t.search.filters}
          title={t.search.title}
          subtitle={t.search.subtitle}
          action={<Badge tone="relay">{numberLabel(results.length, locale)} {t.search.results}</Badge>}
        />
        <form className="search-form" onSubmit={submit}>
          <label>
            <span>{t.nav.search}</span>
            <input name="q" defaultValue={initialQuery} placeholder={t.search.query} />
          </label>
          <label>
            <span>{t.search.project}</span>
            <input name="project" defaultValue={params.get("project") ?? ""} placeholder={t.search.project} />
          </label>
          <label>
            <span>{t.search.service}</span>
            <input name="service" defaultValue={params.get("service") ?? ""} placeholder={t.search.service} />
          </label>
          <label>
            <span>{t.search.kind}</span>
            <input name="kind" defaultValue={params.get("kind") ?? ""} placeholder={t.search.kind} />
          </label>
          <button className="command-button" type="submit">
            <IconSearch aria-hidden="true" />
            {t.search.submit}
          </button>
        </form>
        {error && <div className="error-line">{error}</div>}
      </section>

      <section className="search-results">
        {results.length ? results.map((result, index) => <ResultItem key={`${result.source}-${index}`} result={result} locale={locale} />) : <Empty label={t.search.noResults} icon={<IconSearch />} />}
      </section>
    </main>
  );
}

function ResultItem({ result, locale }: { result: SearchResult; locale: Locale }) {
  const title = result.project ?? result.service_name ?? result.service_id ?? result.source;
  const meta = result.kind ?? result.event_type ?? result.failure_class ?? result.model ?? "event";
  const tone = result.ok === false ? "alert" : result.failure_class ? "warning" : "sync";

  return (
    <article className="result-item">
      <div className="event-head">
        <strong>{title}</strong>
        <Badge tone={tone}>{result.source}</Badge>
      </div>
      <p>{result.summary ?? `${meta}${result.ok === false ? " failed" : ""}`}</p>
      <div className="event-meta">
        <time>{formatTime(result.timestamp, locale)}</time>
        <code>{meta}</code>
      </div>
    </article>
  );
}

function pathToView(path: string): ViewPath {
  if (path === "/health" || path === "/agents" || path === "/logs" || path === "/search") return path;
  return "/";
}

export default function App() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [kiwi, setKiwi] = useState<KiwiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<ViewPath>(() => pathToView(window.location.pathname));
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem("vault-monitor-locale") === "qc" ? "qc" : "en"));
  const t = text[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "qc" ? "fr-CA" : "en";
    localStorage.setItem("vault-monitor-locale", locale);
  }, [locale]);

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
    const onPop = () => setPath(pathToView(window.location.pathname));
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

  function navigate(to: ViewPath) {
    window.history.pushState({}, "", to);
    setPath(to);
  }

  // VaultWares Logo component using the official logo from vaultwares-themes
  function VaultWaresLogo(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
      >
        <title>VaultWares</title>
        <path d="M20 15 L38 15 L60 82 L82 15 L100 15 L67 108 L53 108 Z" fill="currentColor"/>
        <ellipse cx="60" cy="58" rx="12" ry="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>
        <circle cx="60" cy="58" r="4" fill="currentColor"/>
      </svg>
    );
  }

  let view = <Overview overview={overview} locale={locale} />;
  if (path === "/health") view = <HealthView overview={overview} locale={locale} />;
  if (path === "/agents") view = <AgentsView overview={overview} locale={locale} />;
  if (path === "/logs") view = <LogsView kiwi={kiwiState} onCheck={refreshKiwi} locale={locale} />;
  if (path === "/search") view = <SearchView locale={locale} />;

  return (
    <div className="app-shell vw-warm-shell">
      <aside className="warm-rail">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><VaultWaresLogo /></div>
          <div>
            <strong>{t.chrome.product}</strong>
            <span>{t.chrome.monitor}</span>
          </div>
        </div>

        <div className="rail-label">{t.chrome.commandDeck}</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.to}
              type="button"
              className={path === item.to ? "active" : ""}
              aria-current={path === item.to ? "page" : undefined}
              onClick={() => navigate(item.to)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{t.nav[item.label]}</span>
            </button>
          ))}
        </nav>

        <div className="locale-toggle" aria-label={t.chrome.language}>
          <button className={locale === "en" ? "active" : ""} type="button" onClick={() => setLocale("en")}>{t.chrome.english}</button>
          <button className={locale === "qc" ? "active" : ""} type="button" onClick={() => setLocale("qc")}>{t.chrome.french}</button>
        </div>

        <ShellState overview={overview} loading={loading} error={error} locale={locale} />
      </aside>

      <div className="monitor-stage vw-console-shell">
        <header className="topbar">
          <div>
            <span>{t.chrome.system}</span>
            <strong>{overview?.name ?? "V.A.U.L.T Monitor"}</strong>
          </div>
          <div className="topbar-cluster">
            <Badge tone={toneFromStatus(error ? "failed" : loading ? "sync" : overview?.health.status)}>{error ? t.chrome.degraded : loading ? t.chrome.syncing : t.chrome.synced}</Badge>
            <span className="api-chip"><IconSettings aria-hidden="true" /> {overview?.api_owner ?? t.chrome.apiOwner}</span>
          </div>
        </header>
        {view}
      </div>
    </div>
  );
}
