import { useEffect, useMemo, useState } from "react";
import { getServices } from "../api";
import { DeploysPanel } from "../features/deploys/DeploysPanel";
import {
  filterServices,
  groupServicesByHost,
  sortServices,
  summarizeServices,
  type ServiceSort,
  type ServiceSortKey,
} from "../features/services/model";
import { useLangState, type Lang } from "../i18n";
import type { MonitoredService, ServiceFilters } from "../types";

const emptyFilters: ServiceFilters = { product: "all", type: "all", host: "all", status: "all" };
const defaultSort: ServiceSort = { key: "status", direction: "asc" };

const copy = {
  en: {
    title: "Services Monitor",
    subtitle: "Probe state by host across VaultWares, Prom-King, shared infrastructure, and the media stack.",
    search: "Search",
    searchPlaceholder: "Service, host, runtime, dependency...",
    all: "All",
    product: "Product",
    type: "Type",
    host: "Host",
    status: "Status",
    showing: "showing",
    services: "services",
    deployments: "Deployments",
    deploymentsHint: "Build and release state is kept visible here, even when no target has reported yet.",
    sort: "Sort",
    name: "Name",
    latency: "Latency",
    checked: "Checked",
    details: "Details",
    close: "Close",
    runtime: "Runtime",
    dependencies: "Dependencies",
    lastSuccess: "Last success",
    lastFailure: "Last failure",
    none: "None",
    noServices: "No services match the current filters.",
    loading: "Loading services...",
  },
  qc: {
    title: "Moniteur des services",
    subtitle: "Etat des probes par hote pour VaultWares, Prom-King, l infrastructure partagee et le media stack.",
    search: "Recherche",
    searchPlaceholder: "Service, hote, runtime, dependance...",
    all: "Tous",
    product: "Produit",
    type: "Type",
    host: "Hote",
    status: "Etat",
    showing: "affiches",
    services: "services",
    deployments: "Deploiements",
    deploymentsHint: "L etat build et release reste visible ici, meme quand aucune cible n a encore rapporte.",
    sort: "Tri",
    name: "Nom",
    latency: "Latence",
    checked: "Verifie",
    details: "Details",
    close: "Fermer",
    runtime: "Runtime",
    dependencies: "Dependances",
    lastSuccess: "Dernier succes",
    lastFailure: "Dernier echec",
    none: "Aucun",
    noServices: "Aucun service ne correspond aux filtres.",
    loading: "Chargement des services...",
  },
} satisfies Record<Lang, Record<string, string>>;

function Filter({ label, value, values, allLabel, onChange }: {
  label: string; value: string; values: string[]; allLabel: string; onChange: (value: string) => void;
}) {
  return <label className="filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="all">{allLabel}</option>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

export function ServicesPage({ setLoading: setLoadingProp }: { setLoading: (loading: boolean) => void }) {
  const [lang] = useLangState();
  const t = copy[lang];
  const [items, setItems] = useState<MonitoredService[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>(emptyFilters);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ServiceSort>(defaultSort);
  const [selected, setSelected] = useState<MonitoredService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingProp(loading);
  }, [loading, setLoadingProp]);

  useEffect(() => {
    const controller = new AbortController();
    getServices(controller.signal).then((body) => setItems(body.items)).catch((reason: Error) => {
      if (reason.name !== "AbortError") setError(reason.message);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => sortServices(filterServices(items, filters, query), sort), [items, filters, query, sort]);
  const hostGroups = useMemo(() => groupServicesByHost(visible), [visible]);
  const summary = useMemo(() => summarizeServices(items), [items]);
  const unique = (field: "host" | "product" | "type" | "status") => [...new Set(items.map((item) => item[field]))].sort();
  const setSortKey = (key: ServiceSortKey) => setSort((current) => ({
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  }));

  if (loading) {
    return null;
  }

  return <main className="view-stack">
    <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[var(--border)] mb-6">
      <div>
        <h1 className="text-[28px] font-extrabold m-0 mb-2 tracking-tight">
          {t.title}
        </h1>
        <p className="m-0 text-[var(--muted)] text-[13px]">
          {t.subtitle}
        </p>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="service-search">
          <span>{t.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
        </label>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--card)] px-3 py-1.5 border border-[var(--border)] rounded-md">
          {visible.length} / {summary.total} {t.showing}
        </div>
      </div>
    </div>
    {error && <div className="error-line">{error}</div>}
    <section className="service-summary">{Object.entries(summary).map(([label, value]) => <div className={`summary-stat status-${label}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="service-controls">
      <div className="service-filter-grid">
        <Filter label={t.product} value={filters.product} values={unique("product")} allLabel={t.all} onChange={(product) => setFilters({ ...filters, product: product as ServiceFilters["product"] })} />
        <Filter label={t.type} value={filters.type} values={unique("type")} allLabel={t.all} onChange={(type) => setFilters({ ...filters, type: type as ServiceFilters["type"] })} />
        <Filter label={t.host} value={filters.host} values={unique("host")} allLabel={t.all} onChange={(host) => setFilters({ ...filters, host })} />
        <Filter label={t.status} value={filters.status} values={unique("status")} allLabel={t.all} onChange={(status) => setFilters({ ...filters, status: status as ServiceFilters["status"] })} />
      </div>
      <div className="service-sortbar" aria-label={t.sort}>
        {[["status", t.status], ["name", t.name], ["latencyMs", t.latency], ["checkedAt", t.checked]].map(([key, label]) => (
          <button key={key} className={sort.key === key ? "active" : ""} onClick={() => setSortKey(key as ServiceSortKey)} aria-pressed={sort.key === key}>
            {label}{sort.key === key ? ` ${sort.direction.toUpperCase()}` : ""}
          </button>
        ))}
      </div>
    </section>

    {/* Hide deployments section for now
    <section className="deployments-focus">
      <header>
        <div>
          <h2>{t.deployments}</h2>
          <p>{t.deploymentsHint}</p>
        </div>
      </header>
      <DeploysPanel />
    </section>
    */}

    {hostGroups.length === 0 ? <div className="empty-state">{t.noServices}</div> : <section className="service-board" aria-label={t.services}>
      {hostGroups.map((group) => (
        <section className="service-column" key={group.host}>
          <header>
            <div>
              <strong>{group.host}</strong>
              <span>{group.services.length} {t.services}</span>
            </div>
            <button onClick={() => setSortKey(sort.key)} title={t.sort}>{sort.direction.toUpperCase()}</button>
          </header>
          <div className="service-card-list">
            {group.services.map((service) => (
              <article className="service-card" key={service.id}>
                <div className="service-card-head">
                  <span className={`status-led ${service.status}`} />
                  <div>
                    <h3>{service.name}</h3>
                    <p>{service.id}{service.runtime ? ` · ${service.runtime}` : ""}</p>
                  </div>
                  <span className={`status-label status-${service.status}`}>{service.status}</span>
                </div>
                <dl className="service-card-facts">
                  <div><dt>{t.type}</dt><dd>{service.product} · {service.type}</dd></div>
                  <div><dt>{t.latency}</dt><dd>{formatLatency(service.latencyMs)}</dd></div>
                  <div><dt>{t.checked}</dt><dd>{formatTimestamp(service.checkedAt)}</dd></div>
                </dl>
                <button className="service-detail-button" onClick={() => setSelected(service)}>{t.details}</button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>}

    {selected && <ServiceModal service={selected} copy={t} onClose={() => setSelected(null)} />}
  </main>;
}

function ServiceModal({ service, copy: t, onClose }: { service: MonitoredService; copy: Record<string, string>; onClose: () => void }) {
  return <div className="service-modal-backdrop" role="presentation" onClick={onClose}>
    <section className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title" onClick={(event) => event.stopPropagation()}>
      <header>
        <div>
          <span className={`status-label status-${service.status}`}>{service.status}</span>
          <h2 id="service-modal-title">{service.name}</h2>
          <p>{service.id}</p>
        </div>
        <button onClick={onClose} aria-label={t.close}>{t.close}</button>
      </header>
      <dl className="service-detail-grid">
        <Detail label={t.product} value={service.product} />
        <Detail label={t.type} value={service.type} />
        <Detail label={t.host} value={service.host} />
        <Detail label={t.runtime} value={service.runtime ?? "-"} />
        <Detail label={t.latency} value={formatLatency(service.latencyMs)} />
        <Detail label={t.checked} value={formatTimestamp(service.checkedAt)} />
        <Detail label={t.lastSuccess} value={formatTimestamp(service.lastSuccessAt)} />
        <Detail label={t.lastFailure} value={formatTimestamp(service.lastFailureAt)} />
      </dl>
      <div className="service-dependencies">
        <strong>{t.dependencies}</strong>
        <p>{service.dependencies.length ? service.dependencies.join(", ") : t.none}</p>
      </div>
    </section>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function formatLatency(value?: number): string {
  return value == null ? "-" : `${value} ms`;
}

function formatTimestamp(value?: string): string {
  return value ? new Date(value).toLocaleString() : "-";
}
