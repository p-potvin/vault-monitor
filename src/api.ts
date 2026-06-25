import type { ChangeEvent, InputTrackerData, SearchResponse, ServicesResponse } from "./types";
import type { WorkImpactData } from "./features/work-impact/lib/types";
import workImpactSnapshot from "./features/work-impact/lib/data.json";

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

export function searchEvents(params: URLSearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  const query = params.toString();
  return getJson<SearchResponse>(`/monitor/events/search${query ? `?${query}` : ""}`, signal);
}

export function getServices(signal?: AbortSignal) {
  return getJson<ServicesResponse>("/monitor/services", signal);
}

export async function getChanges(signal?: AbortSignal): Promise<ChangeEvent[]> {
  const body = await getJson<{ events?: ChangeEvent[] } | ChangeEvent[]>("/monitor/changes", signal);
  return Array.isArray(body) ? body : body.events ?? [];
}

export function getInputTracker(signal?: AbortSignal) {
  return getJson<InputTrackerData>("/monitor/input-tracker?hours=168", signal);
}

export function adaptWorkImpact(payload: Record<string, unknown>): WorkImpactData {
  const raw = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, any>;
  if (Array.isArray(raw.daySeries)) return raw as WorkImpactData;

  const snapshot = workImpactSnapshot as WorkImpactData;
  const days = Array.isArray(raw.series?.days) ? raw.series.days : [];
  const projects = Array.isArray(raw.series?.projects) ? raw.series.projects : [];
  const kinds = Array.isArray(raw.series?.kinds) ? raw.series.kinds : [];
  const months = Array.isArray(raw.series?.months) ? raw.series.months : [];
  const daySeries: Array<{ date: string; count: number }> = days.map((item: Record<string, any>) => ({
    date: String(item.day ?? item.date ?? ""),
    count: Number(item.entries ?? item.count ?? 0),
  }));

  return {
    ...snapshot,
    generatedAt: String(payload.generated_at ?? raw.generatedAt ?? snapshot.generatedAt),
    rangeStart: daySeries[0]?.date ?? snapshot.rangeStart,
    rangeEnd: daySeries[daySeries.length - 1]?.date ?? snapshot.rangeEnd,
    totalEvents: Number(raw.totals?.events ?? daySeries.reduce((sum: number, item) => sum + item.count, 0)),
    activeDays: Number(raw.totals?.activeDays ?? daySeries.filter((item: { count: number }) => item.count > 0).length),
    totalProjects: Number(raw.totals?.projects ?? projects.length),
    daySeries: daySeries.length ? daySeries : snapshot.daySeries,
    byMonth: months.length ? months.map((item: Record<string, any>) => ({ label: String(item.month), count: Number(item.count ?? 0) })) : snapshot.byMonth,
    byKind: kinds.length ? kinds.map((item: Record<string, any>) => ({ label: String(item.kind), count: Number(item.count ?? 0) })) : snapshot.byKind,
    byProject: projects.length ? projects.map((item: Record<string, any>) => ({ label: String(item.project), count: Number(item.entries ?? item.count ?? 0) })).sort((a: { count: number }, b: { count: number }) => b.count - a.count) : snapshot.byProject,
    byHour: Array.isArray(raw.hourSeries) ? raw.hourSeries.map((item: Record<string, any>) => ({ label: String(item.hour).padStart(2, "0"), count: Number(item.count ?? 0) })) : snapshot.byHour,
    byDow: Array.isArray(raw.dowSeries) ? raw.dowSeries.map((item: Record<string, any>) => ({ label: String(item.label), count: Number(item.count ?? 0) })) : snapshot.byDow,
  };
}

export async function getWorkImpact(signal?: AbortSignal): Promise<WorkImpactData> {
  return adaptWorkImpact(await getJson<Record<string, unknown>>("/monitor/work-impact", signal));
}
