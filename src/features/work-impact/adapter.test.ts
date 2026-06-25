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
});
