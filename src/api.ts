import type { ChangeEvent, InputTrackerData, SearchResponse, ServicesResponse } from "./types";
import type { WorkImpactData } from "./features/work-impact/lib/types";
import workImpactSnapshot from "./features/work-impact/lib/data.json";
import { normalizeProject, isOwnedProject } from "./features/work-impact/lib/aliases";

// ── Work Impact transform config ──────────────────────────────────────────────
// VaultWares foundation date. Events before this are dropped from every series.
const WORK_IMPACT_CUTOFF = "2026-03-11";

// Giant single-commit rewrites that skew the commit-size distribution. Kept
// visible in the snapshot's commitOutliers field; this list is only used when
// the API ever starts returning a commitSamples array we can re-aggregate.
const NAMED_COMMIT_OUTLIERS = new Set<string>(["a1d4b42", "486f844", "37dfb53", "0998411"]);
// Auto-flag any future commit above this many clean churn lines.
const AUTO_OUTLIER_THRESHOLD = 15000;

// ── Work Impact helpers ───────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isoWeekFromDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function isoWeekToRange(weekStr: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!m) return weekStr;
  const year = +m[1], week = +m[2];
  // ISO week 1 is the week containing Jan 4; roll Jan 4 back to its Monday.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const sm = start.getUTCMonth(), em = end.getUTCMonth();
  if (sm === em) return `${MONTH_NAMES[sm]} ${start.getUTCDate()}-${end.getUTCDate()}`;
  return `${MONTH_NAMES[sm]} ${start.getUTCDate()} - ${MONTH_NAMES[em]} ${end.getUTCDate()}`;
}

function eachDateBetween(fromStr: string, toStr: string): string[] {
  const out: string[] = [];
  const d = new Date(`${fromStr}T00:00:00Z`);
  const end = new Date(`${toStr}T00:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

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
  const snapshot = workImpactSnapshot as unknown as WorkImpactData;
  
  if (Array.isArray(raw.daySeries)) {
    return {
      ...snapshot,
      ...raw,
      commitStats: raw.commitStats ?? snapshot.commitStats,
      commitBuckets: raw.commitBuckets ?? snapshot.commitBuckets,
      monthBoxes: raw.monthBoxes ?? snapshot.monthBoxes,
      commitOutliers: raw.commitOutliers ?? snapshot.commitOutliers,
      techVolume: raw.techVolume ?? snapshot.techVolume,
      filesTouched: raw.filesTouched ?? snapshot.filesTouched,
      concentration: raw.concentration ?? snapshot.concentration,
      agentData: raw.agentData ?? snapshot.agentData,
      highlights: raw.highlights ?? snapshot.highlights
    } as WorkImpactData;
  }
  const days = Array.isArray(raw.series?.days) ? raw.series.days : [];
  const projects = Array.isArray(raw.series?.projects) ? raw.series.projects : [];
  const kinds = Array.isArray(raw.series?.kinds) ? raw.series.kinds : [];
  const months = Array.isArray(raw.series?.months) ? raw.series.months : [];

  // Drop everything before the VaultWares foundation cutoff.
  const daysAfterCutoff: Array<{ date: string; count: number }> = days
    .map((item: Record<string, any>) => ({
      date: String(item.day ?? item.date ?? ""),
      count: Number(item.entries ?? item.count ?? 0),
    }))
    .filter((d: { date: string }) => d.date >= WORK_IMPACT_CUTOFF)
    .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

  // Zero-fill missing days so the heatmap + streak math see real gaps instead
  // of the API's sparse omit-zero output.
  const lastSeen = daysAfterCutoff[daysAfterCutoff.length - 1]?.date ?? WORK_IMPACT_CUTOFF;
  const dayCounts = new Map<string, number>(daysAfterCutoff.map(d => [d.date, d.count]));
  const daySeries: Array<{ date: string; count: number }> = eachDateBetween(WORK_IMPACT_CUTOFF, lastSeen).map(date => ({
    date,
    count: dayCounts.get(date) ?? 0,
  }));

  const totalEvents = daySeries.reduce((sum, d) => sum + d.count, 0);
  const activeDays = daySeries.filter(d => d.count > 0).length;

  // Re-bucket byProject by canonical name, drop forks, sort desc.
  const projectCounts = new Map<string, number>();
  for (const item of projects) {
    const canonical = normalizeProject(String(item.project ?? ""));
    if (!isOwnedProject(canonical)) continue;
    const n = Number(item.entries ?? item.count ?? 0);
    projectCounts.set(canonical, (projectCounts.get(canonical) ?? 0) + n);
  }
  const byProject = projects.length
    ? [...projectCounts.entries()].sort(([, a], [, b]) => b - a).map(([label, count]) => ({ label, count }))
    : snapshot.byProject;

  // Distinct owned projects after cutoff comes from per-day project lists if
  // present; fall back to byProject length.
  const ownedProjectSet = new Set<string>();
  for (const d of days) {
    if (String(d.day ?? d.date ?? "") < WORK_IMPACT_CUTOFF) continue;
    for (const p of (d.projects ?? [])) {
      const canonical = normalizeProject(String(p));
      if (isOwnedProject(canonical)) ownedProjectSet.add(canonical);
    }
  }
  const totalProjects = ownedProjectSet.size || byProject.length;

  // Streaks over the zero-filled series.
  let streakLongest = 0;
  let current = 0;
  for (const d of daySeries) {
    if (d.count > 0) {
      current += 1;
      if (current > streakLongest) streakLongest = current;
    } else {
      current = 0;
    }
  }
  let streakCurrent = 0;
  for (let i = daySeries.length - 1; i >= 0; i--) {
    if (daySeries[i].count > 0) streakCurrent += 1;
    else break;
  }

  // Busiest day / week.
  const busiestEntry = daySeries.reduce<{ date: string; count: number } | null>(
    (best, d) => (d.count > (best?.count ?? -1) ? d : best),
    null,
  );
  const busiestDay = busiestEntry?.date ?? snapshot.busiestDay;
  const busiestDayCount = busiestEntry?.count ?? snapshot.busiestDayCount;

  const weekTotals = new Map<string, number>();
  for (const d of daySeries) {
    const w = isoWeekFromDate(d.date);
    weekTotals.set(w, (weekTotals.get(w) ?? 0) + d.count);
  }
  let busiestWeekIso = "";
  let busiestWeekCount = 0;
  for (const [w, c] of weekTotals) if (c > busiestWeekCount) { busiestWeekIso = w; busiestWeekCount = c; }
  const busiestWeek = busiestWeekIso ? isoWeekToRange(busiestWeekIso) : snapshot.busiestWeek;

  return {
    ...snapshot,
    generatedAt: String(payload.generated_at ?? raw.generatedAt ?? snapshot.generatedAt),
    rangeStart: WORK_IMPACT_CUTOFF,
    rangeEnd: lastSeen,
    totalEvents: daySeries.length ? totalEvents : Number(raw.totals?.events ?? snapshot.totalEvents),
    activeDays: daySeries.length ? activeDays : Number(raw.totals?.activeDays ?? snapshot.activeDays),
    totalCommits: Number(raw.totals?.uniqueCommitsRecomputed ?? raw.totals?.commits ?? snapshot.totalCommits ?? 0),
    totalProjects,
    streakCurrent: daySeries.length ? streakCurrent : snapshot.streakCurrent,
    streakLongest: daySeries.length ? streakLongest : snapshot.streakLongest,
    busiestDay,
    busiestDayCount,
    busiestWeek,
    busiestWeekCount: busiestWeekCount || snapshot.busiestWeekCount,
    daySeries: daySeries.length ? daySeries : snapshot.daySeries,
    byMonth: months.length
      ? months
          .filter((item: Record<string, any>) => String(item.month ?? "") >= WORK_IMPACT_CUTOFF.slice(0, 7))
          .map((item: Record<string, any>) => ({ label: String(item.month), count: Number(item.count ?? 0) }))
      : snapshot.byMonth,
    byKind: kinds.length ? kinds.map((item: Record<string, any>) => ({ label: String(item.kind), count: Number(item.count ?? 0) })) : snapshot.byKind,
    byProject,
    byHour: Array.isArray(raw.hourSeries) ? raw.hourSeries.map((item: Record<string, any>) => ({ label: String(item.hour).padStart(2, "0"), count: Number(item.count ?? 0) })) : snapshot.byHour,
    byDow: Array.isArray(raw.dowSeries) ? raw.dowSeries.map((item: Record<string, any>) => ({ label: String(item.label), count: Number(item.count ?? 0) })) : snapshot.byDow,
  };
}

// Marker references so the linter doesn't flag the named-outlier constants as
// unused. The values are read by future code that re-aggregates commitSamples.
void NAMED_COMMIT_OUTLIERS;
void AUTO_OUTLIER_THRESHOLD;

export async function getWorkImpact(signal?: AbortSignal): Promise<WorkImpactData> {
  return adaptWorkImpact(await getJson<Record<string, unknown>>("/monitor/work-impact", signal));
}
