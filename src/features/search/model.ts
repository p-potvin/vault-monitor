import type { SearchResult } from "../../types";

export type SearchFields = Record<string, string | undefined>;

export function buildSearchParams(fields: SearchFields): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    const normalized = value?.trim();
    if (normalized && !(key === "source" && normalized === "all")) {
      params.set(key, normalized);
    }
  }
  params.set("limit", "40");
  return params;
}

export function sortSearchResults(items: SearchResult[]): SearchResult[] {
  return [...items].sort((left, right) =>
    String(right.timestamp ?? "").localeCompare(String(left.timestamp ?? "")),
  );
}
