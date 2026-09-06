import type { ChangeEvent, InputTrackerData, SearchResponse, ServicesResponse } from "./types";
import type {
  AiProjectRow,
  AiSessionsData,
  AiSummary,
  AiTimelinePoint
} from "./features/ai-sessions/types";
import type {
  AiRunsData,
  LatencyBucket,
  RunErrorRow,
  RunRow,
  RunSummary,
  RunTimelinePoint
} from "./features/ai-runs/types";
import type { WorkImpactData } from "./features/work-impact/lib/types";
import workImpactSnapshot from "./features/work-impact/lib/data.json";
import {
  normalizeProject,
  isOwnedProject,
  initAliases,
  normalizeKind,
  normalizeModel,
  normalizeActor,
  normalizeTool
} from "./features/work-impact/lib/aliases";
import {
  computeCommitStats,
  computeCommitBuckets,
  computeMonthBoxes,
  computeCommitOutliers,
  computeFilesTouchedStats,
  computeTechVolume
} from "./features/work-impact/lib/commitAggregators";

// ── Work Impact transform config ──────────────────────────────────────────────
// VaultWares foundation date. Events before this are dropped from every series.
const WORK_IMPACT_CUTOFF = "2026-03-11";

// Giant single-commit rewrites that skew the commit-size distribution. Kept
// visible in the snapshot's commitOutliers field; this list is only used when
// the API ever starts returning a commitSamples array we can re-aggregate.
const NAMED_COMMIT_OUTLIERS = new Set<string>(["a1d4b42", "486f844", "37dfb53", "0998411"]);
// Auto-flag any future commit above this many clean churn lines (bumped to 40000).
const AUTO_OUTLIER_THRESHOLD = 40000;

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

const base = (import.meta.env.VITE_MONITOR_API_BASE ?? "https://api.vaultwares.ca").replace(/\/$/, "");

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

// ── Deploy status (cross-project) ─────────────────────────────────────────
// Endpoint contract documented at
// vaultwares-docs/docs-content/operations/deploy-status-api.mdx.
// Fed by /var/lib/vw-deploy/status/<project>.json which each deploy script
// writes on completion. Same endpoint powers the Marketing tab in
// shared-tube's admin — do NOT clone this into a second endpoint.
export interface DeployTarget {
  id: string;
  site: string | null;
  version: string | null;
  sha: string | null;
  systemd?: { unit: string; active: string; since: string } | null;
}
export interface DeployProject {
  project: string;
  repo_sha?: string | null;
  shared_version?: string | null;
  api_version?: string | null;
  log_path?: string | null;
  targets: DeployTarget[];
  last_build: {
    phase: "building" | "ok" | "failed" | "unknown";
    sha?: string | null;
    site?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
    duration_s?: number | null;
    ok?: boolean | null;
  };
  log_tail?: string[];
}
export interface DeploysResponse {
  as_of: string;
  projects: Record<string, DeployProject>;
}

export function getDeploys(
  opts: { project?: string; site?: string; logs?: boolean } = {},
  signal?: AbortSignal,
): Promise<DeploysResponse> {
  const params = new URLSearchParams();
  if (opts.project) params.set("project", opts.project);
  if (opts.site) params.set("site", opts.site);
  if (opts.logs) params.set("logs", "true");
  const q = params.toString();
  return getJson<DeploysResponse>(`/monitor/deploys${q ? `?${q}` : ""}`, signal);
}

export async function getChanges(signal?: AbortSignal): Promise<ChangeEvent[]> {
  const body = await getJson<{ events?: ChangeEvent[] } | ChangeEvent[]>("/monitor/changes", signal);
  return Array.isArray(body) ? body : body.events ?? [];
}

export function getInputTracker(signal?: AbortSignal, hours = 168) {
  const query = Number.isFinite(hours) && hours > 0 ? `?hours=${Math.trunc(hours)}` : "";
  return getJson<InputTrackerData>(`/monitor/input-tracker${query}`, signal);
}

export async function adaptWorkImpact(payload: Record<string, unknown>, signal?: AbortSignal): Promise<WorkImpactData> {
  await initAliases(base, signal);
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
  
  // Use today's date for rangeEnd to ensure charts and heatmaps draw until today
  const todayLocal = new Date().toLocaleDateString("en-CA");
  const endRange = todayLocal > lastSeen ? todayLocal : lastSeen;

  const dayCounts = new Map<string, number>(daysAfterCutoff.map(d => [d.date, d.count]));
  const daySeries: Array<{ date: string; count: number }> = eachDateBetween(WORK_IMPACT_CUTOFF, endRange).map(date => ({
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
    rangeEnd: endRange,
    totalEvents: daySeries.length ? totalEvents : Number(raw.totals?.events ?? snapshot.totalEvents),
    activeDays: daySeries.length ? activeDays : Number(raw.totals?.activeDays ?? snapshot.activeDays),
    totalCommits: Array.isArray(raw.commitSamples) ? raw.commitSamples.length : Number(raw.totals?.uniqueCommitsRecomputed ?? raw.totals?.commits ?? snapshot.totalCommits ?? 0),
    totalProjects,
    streakCurrent: daySeries.length ? streakCurrent : snapshot.streakCurrent,
    streakLongest: daySeries.length ? streakLongest : snapshot.streakLongest,
    busiestDay,
    busiestDayCount,
    busiestWeek,
    busiestWeekCount: busiestWeekCount || snapshot.busiestWeekCount,
    daySeries: daySeries.length ? daySeries : snapshot.daySeries,
    // Derive byMonth directly from daySeries to ensure strict match with totalEvents (eliminating pre-cutoff noise)
    byMonth: daySeries.length
      ? (() => {
          const mCounts = new Map<string, number>();
          for (const d of daySeries) {
            if (d.count > 0) {
              const m = d.date.slice(0, 7);
              mCounts.set(m, (mCounts.get(m) ?? 0) + d.count);
            }
          }
          return [...mCounts.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, count]) => ({ label, count }));
        })()
      : snapshot.byMonth,
    // Regroup kinds: minor kinds under deployment (< 8) are merged into parent semantic kinds
    byKind: kinds.length
      ? (() => {
          const kCounts = new Map<string, number>();
          for (const item of kinds) {
            const k = normalizeKind(String(item.kind ?? ""));
            const n = Number(item.entries ?? item.count ?? 0);
            kCounts.set(k, (kCounts.get(k) ?? 0) + n);
          }
          return [...kCounts.entries()]
            .sort(([, a], [, b]) => b - a)
            .map(([label, count]) => ({ label, count }));
        })()
      : snapshot.byKind,
    byProject,
    byHour: Array.isArray(raw.hourSeries) ? raw.hourSeries.map((item: Record<string, any>) => ({ label: String(item.hour).padStart(2, "0"), count: Number(item.count ?? 0) })) : snapshot.byHour,
    byDow: (() => {
      // Calculate byDow from daySeries to ensure full accuracy
      const dowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dowCounts = new Map<string, number>(dowLabels.map(l => [l, 0]));
      for (const d of daySeries) {
        if (d.count > 0) {
          const dt = new Date(`${d.date}T00:00:00Z`);
          const dayIndex = (dt.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
          const label = dowLabels[dayIndex];
          dowCounts.set(label, (dowCounts.get(label) ?? 0) + d.count);
        }
      }
      return dowLabels.map(label => ({ label, count: dowCounts.get(label) ?? 0 }));
    })(),
    // Highlights calculation (Most Consistent Month, Widest Project Spread, Strongest Week, Milestones, Top Projects)
    highlights: (() => {
      // Most consistent month: month with the most active days
      const monthDays = new Map<string, Set<string>>();
      for (const d of daySeries) {
        if (d.count > 0) {
          const m = d.date.slice(0, 7);
          if (!monthDays.has(m)) monthDays.set(m, new Set());
          monthDays.get(m)!.add(d.date);
        }
      }
      let bestMonth = "";
      let bestMonthDays = 0;
      for (const [m, set] of monthDays) {
        if (set.size > bestMonthDays) {
          bestMonth = m;
          bestMonthDays = set.size;
        }
      }

      // Widest project spread day
      let widestDay = "";
      let widestCount = 0;
      for (const d of days) {
        const date = String(d.day ?? d.date ?? "");
        if (date < WORK_IMPACT_CUTOFF) continue;
        const set = new Set<string>();
        for (const p of (d.projects ?? [])) {
          const canonical = normalizeProject(String(p));
          if (isOwnedProject(canonical)) set.add(canonical);
        }
        if (set.size > widestCount) {
          widestDay = date;
          widestCount = set.size;
        }
      }

      const nextTarget = (cur: number, steps: number[]) => steps.find(s => s > cur) || cur;
      const actualCommits = Array.isArray(raw.commitSamples) ? raw.commitSamples.length : Number(raw.totals?.uniqueCommitsRecomputed ?? raw.totals?.commits ?? snapshot.totalCommits ?? 0);

      const milestones = [
        { label: "Work entries", cur: totalEvents, max: nextTarget(totalEvents, [100, 250, 500, 1000, 2000, 5000, 10000]) },
        { label: "Active days", cur: activeDays, max: nextTarget(activeDays, [25, 50, 100, 200, 365]) },
        { label: "Projects touched", cur: totalProjects, max: nextTarget(totalProjects, [10, 25, 50, 100, 150, 200]) },
        { label: "Commits sampled", cur: actualCommits, max: nextTarget(actualCommits, [100, 250, 500, 1000, 2000, 5000, 10000]) },
      ];

      return {
        mostConsistentMonth: bestMonth || "2026-05",
        mostConsistentDays: bestMonthDays,
        widestProjectDay: widestDay || "2026-05-01",
        widestProjectCount: widestCount,
        strongestWeek: busiestWeekIso ? isoWeekToRange(busiestWeekIso) : snapshot.busiestWeek,
        strongestWeekCount: busiestWeekCount,
        milestones,
        topProjects: byProject.slice(0, 5),
      };
    })(),
    // Context switches per day (number of distinct projects touched minus 1, minimum 0)
    contextSwitches: (() => {
      const result: Array<{ date: string; switches: number; projects: string[] }> = [];
      for (const d of days) {
        const date = String(d.day ?? d.date ?? "");
        if (date < WORK_IMPACT_CUTOFF) continue;
        const set = new Set<string>();
        for (const p of (d.projects ?? [])) {
          const canonical = normalizeProject(String(p));
          if (isOwnedProject(canonical)) set.add(canonical);
        }
        result.push({
          date,
          switches: Math.max(0, set.size - 1),
          projects: Array.from(set),
        });
      }
      return result.sort((a, b) => a.date.localeCompare(b.date));
    })(),
    // Top 5 project work concentration share (%)
    concentration: raw.concentration ?? (() => {
      if (!byProject || byProject.length === 0) return [];
      const top5 = byProject.slice(0, 5);
      const total = totalEvents || byProject.reduce((sum, p) => sum + p.count, 0) || 1;
      return top5.map(p => ({
        label: p.label,
        count: Math.round((p.count / total) * 100),
      }));
    })(),
    // Clean up agentData with normalizers
    agentData: (() => {
      const rawAg = raw.agentData || snapshot.agentData;
      if (!rawAg) return snapshot.agentData;

      const mCounts = new Map<string, number>();
      for (const m of (rawAg.models || [])) {
        const norm = normalizeModel(m.name || m.label || "");
        mCounts.set(norm, (mCounts.get(norm) ?? 0) + Number(m.count || 0));
      }
      const topModels = [...mCounts.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({ label, count }));

      const aCounts = new Map<string, number>();
      for (const a of (rawAg.actors || [])) {
        const norm = normalizeActor(a.name || a.label || "");
        aCounts.set(norm, (aCounts.get(norm) ?? 0) + Number(a.count || 0));
      }
      const topActors = [...aCounts.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({ label, count }));

      const tCounts = new Map<string, number>();
      for (const t of (rawAg.tools || [])) {
        const norm = normalizeTool(t.name || t.label || "");
        tCounts.set(norm, (tCounts.get(norm) ?? 0) + Number(t.count || 0));
      }
      const topTools = [...tCounts.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({ label, count }));

      const sCounts = new Map<string, number>();
      for (const s of (rawAg.mcpServers || [])) {
        const rawName = s.name || s.label || "";
        const norm = rawName.replace(/_/g, " ") || "VaultWares MCP";
        sCounts.set(norm, (sCounts.get(norm) ?? 0) + Number(s.count || 0));
      }
      const topMcp = [...sCounts.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({ label, count }));

      return {
        totalEvents: rawAg.totalEvents || totalEvents,
        distinctActors: topActors.length,
        modelsUsed: topModels.length,
        toolsUsed: topTools.length,
        topActors,
        topMcp,
        topTools,
        dayActivity: Array.isArray(rawAg.daySeries)
          ? rawAg.daySeries.map((item: any) => ({ label: String(item.day), count: Number(item.count || 0) }))
          : (snapshot.agentData?.dayActivity || []),
      };
    })(),
    // Dynamically aggregated data from commitSamples
    ...(Array.isArray(raw.commitSamples) && raw.commitSamples.length > 0 ? {
      commitStats: computeCommitStats(raw.commitSamples),
      commitBuckets: computeCommitBuckets(raw.commitSamples),
      monthBoxes: computeMonthBoxes(raw.commitSamples),
      commitOutliers: computeCommitOutliers(raw.commitSamples),
      filesTouched: computeFilesTouchedStats(raw.commitSamples),
      techVolume: computeTechVolume(raw.commitSamples),
    } : {
      commitStats: snapshot.commitStats,
      commitBuckets: snapshot.commitBuckets,
      monthBoxes: snapshot.monthBoxes,
      commitOutliers: snapshot.commitOutliers,
      filesTouched: snapshot.filesTouched,
      techVolume: snapshot.techVolume,
    })
  };
}

// Marker references so the linter doesn't flag the named-outlier constants as
// unused. The values are read by future code that re-aggregates commitSamples.
void NAMED_COMMIT_OUTLIERS;
void AUTO_OUTLIER_THRESHOLD;

export async function getWorkImpact(signal?: AbortSignal): Promise<WorkImpactData> {
  return await adaptWorkImpact(await getJson<Record<string, unknown>>("/monitor/work-impact", signal), signal);
}

// ── AI assistant sessions ─────────────────────────────────────────────────────

export async function getAiSessions(signal?: AbortSignal, months = 12): Promise<AiSessionsData> {
  const days = Math.max(1, Math.trunc(months * 31));
  const [summary, projects, timeline] = await Promise.all([
    getJson<AiSummary>("/api/telemetry/ai-sessions/summary", signal),
    getJson<{ projects: AiProjectRow[] }>(`/api/telemetry/ai-sessions/projects?limit=12`, signal),
    getJson<{ bucket: string; points: AiTimelinePoint[] }>(
      `/api/telemetry/ai-sessions/timeline?bucket=month&days=${days}`,
      signal
    )
  ]);
  return {
    summary,
    projects: projects.projects ?? [],
    timeline: timeline.points ?? [],
    timelineBucket: timeline.bucket ?? "month"
  };
}

// ── Model runs ────────────────────────────────────────────────────────────────

export async function getAiRuns(signal?: AbortSignal, days = 30): Promise<AiRunsData> {
  const window = Math.max(1, Math.trunc(days));
  // An hourly timeline over a long window would return thousands of points for
  // a chart ~60 columns wide, so the bucket widens with the range.
  const bucket = window <= 2 ? "hour" : window <= 90 ? "day" : "week";
  const [summary, timeline, latency, errors, recent] = await Promise.all([
    getJson<RunSummary>(`/api/telemetry/ai-runs/summary?days=${window}`, signal),
    getJson<{ bucket: string; points: RunTimelinePoint[] }>(
      `/api/telemetry/ai-runs/timeline?bucket=${bucket}&days=${window}`,
      signal
    ),
    getJson<{ buckets: LatencyBucket[] }>(`/api/telemetry/ai-runs/latency?days=${window}`, signal),
    getJson<{ errors: RunErrorRow[] }>(`/api/telemetry/ai-runs/errors?days=${window}&limit=12`, signal),
    getJson<{ runs: RunRow[] }>(`/api/telemetry/ai-runs/runs?days=${window}&limit=50`, signal)
  ]);
  return {
    summary,
    timeline: timeline.points ?? [],
    timelineBucket: timeline.bucket ?? bucket,
    latency: latency.buckets ?? [],
    errors: errors.errors ?? [],
    recent: recent.runs ?? []
  };
}

// ── Model Identities & Face Embeddings ───────────────────────────────────────

import type {
  IdentityModel,
  IdentitySummaryStats,
  Embedding3DPoint,
  IdentityTaskLog,
  IdentityCrop
} from "./types";

export async function getIdentitiesSummary(signal?: AbortSignal): Promise<IdentitySummaryStats> {
  return getJson<IdentitySummaryStats>("/api/identities/stats/summary", signal);
}

export async function getIdentitiesList(
  status?: string,
  search?: string,
  signal?: AbortSignal
): Promise<{ identities: IdentityModel[]; count: number }> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  const q = params.toString();
  return getJson<{ identities: IdentityModel[]; count: number }>(`/api/identities${q ? `?${q}` : ""}`, signal);
}

export async function getIdentityDetails(
  name: string,
  signal?: AbortSignal
): Promise<IdentityModel & { crops: IdentityCrop[] }> {
  return getJson<IdentityModel & { crops: IdentityCrop[] }>(`/api/identities/${encodeURIComponent(name)}`, signal);
}

export async function get3dEmbeddings(signal?: AbortSignal): Promise<{ points: Embedding3DPoint[]; count: number }> {
  return getJson<{ points: Embedding3DPoint[]; count: number }>("/api/identities/telemetry/embeddings-3d", signal);
}

export async function getIdentityTasks(limit = 50, signal?: AbortSignal): Promise<{ tasks: IdentityTaskLog[]; count: number }> {
  return getJson<{ tasks: IdentityTaskLog[]; count: number }>(`/api/identities/telemetry/tasks?limit=${limit}`, signal);
}

export async function updateIdentityStatus(
  name: string,
  status: "locked" | "soft" | "invalid",
  threshold?: number,
  notes?: string
): Promise<{ status: string; name: string }> {
  const res = await fetch(`${base}/api/identities/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, threshold, notes })
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
