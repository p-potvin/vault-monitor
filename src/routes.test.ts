import { describe, expect, it } from "vitest";

import { compatibilityRedirects, primaryRoutes } from "./routes";

describe("monitor routes", () => {
  it("defines the five approved tabs in order", () => {
    expect(primaryRoutes.map((route) => route.path)).toEqual([
      "/work-impact",
      "/personal-stats",
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
