import { describe, expect, it } from "vitest";

import { compatibilityRedirects, primaryRoutes } from "./routes";

describe("monitor routes", () => {
  it("defines the seven approved tabs in order", () => {
    expect(primaryRoutes.map((route) => route.path)).toEqual([
      "/work-impact",
      "/personal-stats",
      "/ai-stats",
      "/model-runs",
      "/ledger",
      "/search",
      "/services",
    ]);
  });

  it("redirects removed monitor views to the services tab", () => {
    expect(compatibilityRedirects["/"]).toBe("/work-impact");
    expect(compatibilityRedirects["/health"]).toBe("/services");
    expect(compatibilityRedirects["/agents"]).toBe("/ledger");
    expect(compatibilityRedirects["/logs"]).toBe("/services");
  });
});
