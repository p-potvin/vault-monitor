import { describe, expect, it } from "vitest";

import {
  filterServices,
  groupServicesByHost,
  sortServices,
  summarizeServices,
} from "./model";
import type { MonitoredService } from "../../types";

const items: MonitoredService[] = [
  {
    id: "monitor",
    name: "Vault Monitor",
    product: "vaultwares",
    type: "site",
    host: "greencloud-vps",
    runtime: "nginx",
    status: "healthy",
    dependencies: ["vaultwares-api"],
  },
  {
    id: "postgres",
    name: "Shared PostgreSQL",
    product: "shared",
    type: "database",
    host: "vps-ovhcloud",
    runtime: "postgres",
    status: "unmonitored",
    dependencies: [],
  },
  {
    id: "webhook-dispatcher",
    name: "GitHub Webhook Dispatcher",
    product: "shared",
    type: "service",
    host: "greencloud-vps",
    status: "degraded",
    latencyMs: 300,
    checkedAt: "2026-07-05T04:00:00Z",
    dependencies: ["tailnet-webhook"],
  },
];

describe("services model", () => {
  it("summarizes every normalized status", () => {
    expect(summarizeServices(items)).toEqual({
      total: 3,
      healthy: 1,
      degraded: 1,
      offline: 0,
      stale: 0,
      unmonitored: 1,
    });
  });

  it("filters by product, type, host, and status together", () => {
    expect(
      filterServices(items, {
        product: "shared",
        type: "database",
        host: "vps-ovhcloud",
        status: "unmonitored",
      }),
    ).toEqual([items[1]]);
  });

  it("searches across service identity, runtime, host, and dependencies", () => {
    expect(filterServices(items, { product: "all", type: "all", host: "all", status: "all" }, "TAILNET"))
      .toEqual([items[2]]);
    expect(filterServices(items, { product: "all", type: "all", host: "all", status: "all" }, "postgres"))
      .toEqual([items[1]]);
  });

  it("sorts by severity and reverses direction", () => {
    expect(sortServices(items, { key: "status", direction: "asc" }).map((item) => item.id))
      .toEqual(["webhook-dispatcher", "postgres", "monitor"]);
    expect(sortServices(items, { key: "status", direction: "desc" }).map((item) => item.id))
      .toEqual(["monitor", "postgres", "webhook-dispatcher"]);
  });

  it("groups filtered rows by host without changing row order", () => {
    expect(groupServicesByHost(items)).toEqual([
      { host: "greencloud-vps", services: [items[0], items[2]] },
      { host: "vps-ovhcloud", services: [items[1]] },
    ]);
  });
});
