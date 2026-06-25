import { describe, expect, it } from "vitest";

import { filterServices, summarizeServices } from "./model";
import type { MonitoredService } from "../../types";

const items: MonitoredService[] = [
  {
    id: "monitor",
    name: "Vault Monitor",
    product: "vaultwares",
    type: "site",
    host: "greencloud-vps",
    status: "healthy",
    dependencies: ["vaultwares-api"],
  },
  {
    id: "postgres",
    name: "Shared PostgreSQL",
    product: "shared",
    type: "database",
    host: "vps-ovhcloud",
    status: "unmonitored",
    dependencies: [],
  },
];

describe("services model", () => {
  it("summarizes every normalized status", () => {
    expect(summarizeServices(items)).toEqual({
      total: 2,
      healthy: 1,
      degraded: 0,
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
});
