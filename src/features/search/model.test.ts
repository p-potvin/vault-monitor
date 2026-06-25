import { describe, expect, it } from "vitest";

import { buildSearchParams, sortSearchResults } from "./model";

describe("search model", () => {
  it("keeps only populated filters and enforces the bounded limit", () => {
    expect(
      buildSearchParams({
        q: " gateway ",
        source: "health-ledger",
        project: "",
        service: " gateway ",
      }).toString(),
    ).toBe("q=gateway&source=health-ledger&service=gateway&limit=40");
  });

  it("sorts mixed ledger results newest first", () => {
    const sorted = sortSearchResults([
      { source: "health-ledger", timestamp: "2026-06-25T03:20:00Z" },
      { source: "agent-ledger", timestamp: "2026-06-25T03:30:00Z" },
    ]);
    expect(sorted.map((item) => item.source)).toEqual([
      "agent-ledger",
      "health-ledger",
    ]);
  });
});
