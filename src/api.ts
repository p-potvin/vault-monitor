import type { KiwiStatus, OverviewResponse, SearchResponse, QAResponse } from "./types";

const base = (import.meta.env.VITE_MONITOR_API_BASE ?? "").replace(/\/$/, "");

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
    signal
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function getOverview(signal?: AbortSignal): Promise<OverviewResponse> {
  return getJson<OverviewResponse>("/monitor/overview?kiwi_check=false", signal);
}

export async function checkKiwi(signal?: AbortSignal): Promise<KiwiStatus> {
  const body = await getJson<{ kiwi: KiwiStatus }>("/monitor/logging/kiwi?check=true", signal);
  return body.kiwi;
}

export function searchEvents(params: URLSearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  const query = params.toString();
  return getJson<SearchResponse>(`/monitor/events/search${query ? `?${query}` : ""}`, signal);
}

export async function getQALogs(signal?: AbortSignal): Promise<QAResponse> {
  const url = import.meta.env.VITE_ZIPPER_URL ?? "http://localhost:5171";
  const response = await fetch(`${url}/qa-logs`, { signal });
  if (!response.ok) throw new Error("Failed to fetch QA logs");
  return response.json();
}
