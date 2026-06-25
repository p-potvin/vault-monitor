import { useEffect, useMemo, useState } from "react";
import { getServices } from "../api";
import { filterServices, summarizeServices } from "../features/services/model";
import type { MonitoredService, ServiceFilters } from "../types";

const emptyFilters: ServiceFilters = { product: "all", type: "all", host: "all", status: "all" };

function Filter({ label, value, values, onChange }: {
  label: string; value: string; values: string[]; onChange: (value: string) => void;
}) {
  return <label className="filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="all">All</option>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

export function ServicesPage() {
  const [items, setItems] = useState<MonitoredService[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getServices(controller.signal).then((body) => setItems(body.items)).catch((reason: Error) => {
      if (reason.name !== "AbortError") setError(reason.message);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => filterServices(items, filters), [items, filters]);
  const summary = useMemo(() => summarizeServices(items), [items]);
  const unique = (field: "host" | "product" | "type" | "status") => [...new Set(items.map((item) => item[field]))].sort();

  if (loading) return <div className="page-state">Loading services...</div>;
  return <main className="view-stack">
    <header className="page-heading"><div><h1>Services</h1><p>Read-only inventory and current probe state across VaultWares, Prom-King, and shared infrastructure.</p></div></header>
    {error && <div className="error-line">{error}</div>}
    <section className="service-summary">{Object.entries(summary).map(([label, value]) => <div className={`summary-stat status-${label}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="filter-bar">
      <Filter label="Product" value={filters.product} values={unique("product")} onChange={(product) => setFilters({ ...filters, product: product as ServiceFilters["product"] })} />
      <Filter label="Type" value={filters.type} values={unique("type")} onChange={(type) => setFilters({ ...filters, type: type as ServiceFilters["type"] })} />
      <Filter label="Host" value={filters.host} values={unique("host")} onChange={(host) => setFilters({ ...filters, host })} />
      <Filter label="Status" value={filters.status} values={unique("status")} onChange={(status) => setFilters({ ...filters, status: status as ServiceFilters["status"] })} />
    </section>
    <section className="table-shell"><table className="services-table">
      <thead><tr><th>Service</th><th>Product</th><th>Type</th><th>Host</th><th>Status</th><th>Latency</th><th>Checked</th><th>Dependencies</th></tr></thead>
      <tbody>{visible.map((service) => <tr key={service.id}>
        <td><strong>{service.name}</strong><span>{service.id}{service.runtime ? ` · ${service.runtime}` : ""}</span></td>
        <td>{service.product}</td><td>{service.type}</td><td>{service.host}</td>
        <td><span className={`status-label status-${service.status}`}>{service.status}</span></td>
        <td>{service.latencyMs == null ? "-" : `${service.latencyMs} ms`}</td>
        <td>{service.checkedAt ? new Date(service.checkedAt).toLocaleString() : "-"}</td>
        <td>{service.dependencies.length ? service.dependencies.join(", ") : "-"}</td>
      </tr>)}</tbody>
    </table></section>
  </main>;
}
