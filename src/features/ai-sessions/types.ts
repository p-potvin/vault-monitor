// ── AI assistant session telemetry — API shapes ──────────────────────────────
//
// Served by vaultwares-api /api/telemetry/ai-sessions/*, fed daily by
// `vw collect-ai-history` on each host.
//
// Postgres BIGINT columns (tokens, bytes) come back as JSON *strings* via
// asyncpg, so every numeric field here is typed `number | string` and must be
// funnelled through `num()` before arithmetic.

export type Num = number | string | null;

export interface AiTotals {
  sessions: number;
  messages: Num;
  tokens: Num;
  bytes: Num;
  metadata_only: number;
  earliest: string | null;
  latest: string | null;
}

export interface AiToolRow {
  tool: string;
  sessions: number;
  messages: Num;
  tokens: Num;
  metadata_only: number;
  latest: string | null;
}

export interface AiSummary {
  totals: AiTotals;
  by_tool: AiToolRow[];
  by_host: { host: string; sessions: number }[];
  by_model: { model: string; sessions: number }[];
}

export interface AiProjectRow {
  project: string;
  sessions: number;
  tools: number;
  messages: Num;
  tokens: Num;
  latest: string | null;
}

export interface AiTimelinePoint {
  bucket: string;
  tool: string;
  sessions: number;
  messages: Num;
  tokens: Num;
}

export interface AiSessionsData {
  summary: AiSummary;
  projects: AiProjectRow[];
  timeline: AiTimelinePoint[];
  timelineBucket: string;
}

/** Coerce an API numeric (which may arrive as a BIGINT string) to a number. */
export function num(value: Num | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Tools whose conversation stores are encrypted at rest, so their records are
 * `parser = "metadata-only"`: session counts are real, message and token
 * counts are absent (NULL, not zero). Charting those series alongside
 * fully-parsed tools reads as "no activity" rather than "not measurable".
 */
export const METADATA_ONLY_TOOLS = new Set(["antigravity", "windsurf-cascade"]);
