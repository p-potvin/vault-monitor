import type {
  MonitoredService,
  ServiceFilters,
  ServiceSummary,
} from "../../types";

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
): MonitoredService[] {
  return items.filter((item) =>
    (filters.product === "all" || item.product === filters.product) &&
    (filters.type === "all" || item.type === filters.type) &&
    (filters.host === "all" || item.host === filters.host) &&
    (filters.status === "all" || item.status === filters.status),
  );
}
