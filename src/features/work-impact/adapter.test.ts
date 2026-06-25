import { describe, expect, it } from "vitest";
import { adaptWorkImpact } from "../../api";

describe("adaptWorkImpact", () => {
  it("maps live ledger series while retaining enriched snapshot metrics", () => {
    const result = adaptWorkImpact({
      generated_at: "2026-06-25T08:00:00Z",
      data: {
        totals: { events: 12, activeDays: 2, projects: 1 },
        series: {
          days: [{ day: "2026-06-24", entries: 5 }, { day: "2026-06-25", entries: 7 }],
          projects: [{ project: "vault-monitor", entries: 12 }],
          kinds: [{ kind: "code-change", count: 12 }],
          months: [{ month: "2026-06", count: 12 }],
        },
      },
    });

    expect(result.totalEvents).toBe(12);
    expect(result.daySeries[result.daySeries.length - 1]).toEqual({ date: "2026-06-25", count: 7 });
    expect(result.byProject[0]).toEqual({ label: "vault-monitor", count: 12 });
    expect(result.commitStats).toBeDefined();
  });

  it("normalizes aliased project names and drops forks", () => {
    const result = adaptWorkImpact({
      generated_at: "2026-06-25T08:00:00Z",
      data: {
        totals: { events: 100, activeDays: 1, projects: 5 },
        series: {
          days: [{ day: "2026-06-25", entries: 100, projects: ["vaultwares-pipelines", "vault-video-enhancer", "realtime-stt", "OneTrainer", "video-depth-anything"] }],
          projects: [
            { project: "vaultwares-pipelines",   entries: 40 },
            { project: "vault-video-enhancer",   entries: 30 },
            { project: "realtime-stt",           entries: 20 },
            { project: "OneTrainer",             entries: 7  },
            { project: "video-depth-anything",   entries: 3  },
          ],
          kinds: [], months: [],
        },
      },
    });
    const labels = result.byProject.map(p => p.label);
    expect(labels).toContain("vaultwares-api");
    expect(labels).toContain("vaultwares-media-processing");
    expect(labels).toContain("vaultwares-realtime");
    expect(labels).not.toContain("OneTrainer");
    expect(labels).not.toContain("video-depth-anything");
    expect(result.totalProjects).toBe(3);
  });

  it("drops events before the VaultWares foundation cutoff (2026-03-11)", () => {
    const result = adaptWorkImpact({
      generated_at: "2026-06-25T08:00:00Z",
      data: {
        totals: { events: 1000, activeDays: 99, projects: 10 },
        series: {
          days: [
            { day: "2026-01-15", entries: 5,   projects: ["legacy-thing"] },
            { day: "2026-03-10", entries: 8,   projects: ["legacy-thing"] },
            { day: "2026-03-11", entries: 20,  projects: ["vault-explorer"] },
            { day: "2026-06-25", entries: 12,  projects: ["vault-explorer"] },
          ],
          projects: [{ project: "vault-explorer", entries: 32 }, { project: "legacy-thing", entries: 13 }],
          kinds: [], months: [],
        },
      },
    });
    expect(result.rangeStart).toBe("2026-03-11");
    expect(result.totalEvents).toBe(32);
    expect(result.daySeries[0].date).toBe("2026-03-11");
  });

  it("renders busiestWeek as a human date range, not an ISO week label", () => {
    const result = adaptWorkImpact({
      generated_at: "2026-04-26T08:00:00Z",
      data: {
        totals: { events: 100, activeDays: 1, projects: 1 },
        series: {
          days: [{ day: "2026-04-24", entries: 100 }],
          projects: [{ project: "vault-flows", entries: 100 }],
          kinds: [], months: [],
        },
      },
    });
    expect(result.busiestWeek).toMatch(/^[A-Z][a-z]{2} \d{1,2}/);
    expect(result.busiestWeek).not.toMatch(/W\d{2}/);
  });
});
