import { afterEach, describe, expect, it, vi } from "vitest";
import { getInputTracker } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

const expectedBase = (import.meta.env.VITE_MONITOR_API_BASE ?? "https://api.vaultwares.ca").replace(/\/$/, "");

describe("getInputTracker", () => {
  it("requests the selected rolling hour window", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "online", window_hours: 24 }),
    } as Response);

    await getInputTracker(undefined, 24);

    expect(fetchMock).toHaveBeenCalledWith(`${expectedBase}/monitor/input-tracker?hours=24`, expect.any(Object));
  });

  it("omits non-positive hour values", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "online" }),
    } as Response);

    await getInputTracker(undefined, 0);

    expect(fetchMock).toHaveBeenCalledWith(`${expectedBase}/monitor/input-tracker`, expect.any(Object));
  });
});
