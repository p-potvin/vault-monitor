import { describe, it, expect } from "vitest";

describe("Live Monitor AI Runs Gateway", () => {
  it.skipIf(!process.env.RUN_LIVE_TESTS)("queries https://monitor.vaultwares.ca/api/telemetry/ai-runs/summary and receives live JSON", async () => {
    const res = await fetch("https://monitor.vaultwares.ca/api/telemetry/ai-runs/summary?days=30");
    expect(res.ok).toBe(true);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/json");

    const data = await res.json();
    expect(data.totals).toBeDefined();
    expect(data.totals.runs).toBeGreaterThanOrEqual(1000);
    expect(data.totals.models).toBeGreaterThanOrEqual(30);
    expect(data.totals.cost_usd).toBeGreaterThan(0);
  });
});
