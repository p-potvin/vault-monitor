export const primaryRoutes = [
  { path: "/work-impact", label: "workImpact" },
  { path: "/personal-stats", label: "personalStats" },
  { path: "/ledger", label: "ledger" },
  { path: "/search", label: "search" },
  { path: "/services", label: "services" },
] as const;

export const compatibilityRedirects: Record<string, string> = {
  "/": "/work-impact",
  "/health": "/services",
  "/agents": "/ledger",
  "/logs": "/services",
};
