import type {
  MonitoredService,
  ServiceFilters,
  ServiceStatus,
  ServiceSummary,
} from "../../types";

export type ServiceSortKey = "name" | "status" | "latencyMs" | "checkedAt";
export type ServiceSortDirection = "asc" | "desc";
export interface ServiceSort {
  key: ServiceSortKey;
  direction: ServiceSortDirection;
}

export interface ServiceHostGroup {
  host: string;
  services: MonitoredService[];
}

const statusRank: Record<ServiceStatus, number> = {
  offline: 0,
  degraded: 1,
  stale: 2,
  unmonitored: 3,
  healthy: 4,
};

export function summarizeServices(items: MonitoredService[]): ServiceSummary {
  return items.reduce<ServiceSummary>(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] += 1;
      return summary;
    },
    {
      total: 0,
      healthy: 0,
      degraded: 0,
      offline: 0,
      stale: 0,
      unmonitored: 0,
    },
  );
}

export function filterServices(
  items: MonitoredService[],
  filters: ServiceFilters,
  query = "",
): MonitoredService[] {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) =>
    (filters.product === "all" || item.product === filters.product) &&
    (filters.type === "all" || item.type === filters.type) &&
    (filters.host === "all" || item.host === filters.host) &&
    (filters.status === "all" || item.status === filters.status) &&
    matchesServiceSearch(item, normalizedQuery),
  );
}

export function sortServices(
  items: MonitoredService[],
  sort: ServiceSort,
): MonitoredService[] {
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const compared = compareServices(a, b, sort.key);
    if (compared !== 0) return compared * direction;
    return a.name.localeCompare(b.name);
  });
}

export function groupServicesByHost(items: MonitoredService[]): ServiceHostGroup[] {
  const groups = new Map<string, MonitoredService[]>();
  items.forEach((item) => {
    const services = groups.get(item.host) ?? [];
    services.push(item);
    groups.set(item.host, services);
  });
  return [...groups.entries()].map(([host, services]) => ({ host, services }));
}

function matchesServiceSearch(item: MonitoredService, query: string): boolean {
  if (!query) return true;
  return [
    item.id,
    item.name,
    item.product,
    item.type,
    item.host,
    item.runtime ?? "",
    item.status,
    ...item.dependencies,
  ].some((value) => value.toLowerCase().includes(query));
}

function compareServices(
  a: MonitoredService,
  b: MonitoredService,
  key: ServiceSortKey,
): number {
  if (key === "status") return statusRank[a.status] - statusRank[b.status];
  if (key === "latencyMs") return nullableNumber(a.latencyMs) - nullableNumber(b.latencyMs);
  if (key === "checkedAt") return nullableDate(a.checkedAt) - nullableDate(b.checkedAt);
  return a.name.localeCompare(b.name);
}

function nullableNumber(value?: number): number {
  return value ?? Number.MAX_SAFE_INTEGER;
}

function nullableDate(value?: string): number {
  return value ? new Date(value).getTime() : 0;
}
