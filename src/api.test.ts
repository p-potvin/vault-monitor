import { afterEach, describe, expect, it, vi } from "vitest";
import { getAiRuns, getInputTracker } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

const expectedBase = (import.meta.env.VITE_MONITOR_API_BASE ?? "https://api.vaultwares.ca").replace(/\/$/, "");

describe("getInputTracker", () => {
  it("requests the selected rolling hour window", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ status: "online", window_hours: 24 }),
    } as Response);

    await getInputTracker(undefined, 24);

    expect(fetchMock).toHaveBeenCalledWith(`${expectedBase}/monitor/input-tracker?hours=24`, expect.any(Object));
  });

  it("omits non-positive hour values", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ status: "online" }),
    } as Response);

    await getInputTracker(undefined, 0);

    expect(fetchMock).toHaveBeenCalledWith(`${expectedBase}/monitor/input-tracker`, expect.any(Object));
  });
});

describe("getAiRuns content-type & error resilience", () => {
  it("rejects non-JSON HTML responses with a descriptive error instead of crashing JSON.parse", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
      text: async () => "<!doctype html><html><body>SPA fallback</body></html>",
      json: async () => {
        throw new SyntaxError("Unexpected token '<'");
      }
    } as unknown as Response);

    await expect(getAiRuns(undefined, 30)).rejects.toThrow(/Expected JSON response/);
  });

  it("successfully parses valid telemetry JSON responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        totals: { runs: 1023, cost_usd: 43.64, models: 37 },
        bucket: "day",
        points: [],
        buckets: [],
        errors: [],
        runs: []
      })
    } as unknown as Response);

    const data = await getAiRuns(undefined, 30);
    expect(data.summary?.totals?.runs).toBe(1023);
    expect(data.summary?.totals?.cost_usd).toBe(43.64);
  });
});
