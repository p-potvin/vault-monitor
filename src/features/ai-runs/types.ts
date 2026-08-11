// ── Model-run telemetry — API shapes ─────────────────────────────────────────
//
// Served by vaultwares-api /api/telemetry/ai-runs/*, fed by
// vaultwares_adk.telemetry on every host that touches a model.
//
// A *run* is one invocation (a completion, an embedding, a diffusion job); a
// *session* (see ../ai-sessions/types) is a whole conversation. They are
// separate tables and must not be summed together.
//
// As with ai-sessions, Postgres BIGINT and numeric aggregates come back as JSON
// *strings* through asyncpg, so every numeric field is `Num` and must go
// through `num()` before arithmetic.

export type Num = number | string | null;

export interface RunTotals {
  runs: number;
  ok: number;
  errors: number;
  timeouts: number;
  rejected: number;
  cancelled: number;
  models: number;
  providers: number;
  hosts: number;
  input_tokens: Num;
  output_tokens: Num;
  cached_input_tokens: Num;
  reasoning_tokens: Num;
  total_tokens: Num;
  cost_usd: Num;
  compute_seconds: Num;
  avg_ms: Num;
  p50_ms: Num;
  p95_ms: Num;
  p99_ms: Num;
  p50_ttft_ms: Num;
  p95_ttft_ms: Num;
  p50_queue_ms: Num;
  avg_tps: Num;
  peak_vram_mb: Num;
  avg_gpu_util: Num;
  earliest: string | null;
  latest: string | null;
}

/** One row of any `by_*` grouping — same shape whatever the group key is. */
export interface RunGroupRow {
  key: string;
  runs: number;
  failures: number;
  tokens: Num;
  cost_usd: Num;
  p50_ms: Num;
  p95_ms: Num;
  avg_tps: Num;
  latest: string | null;
}

export interface RunSummary {
  totals: RunTotals;
  by_provider: RunGroupRow[];
  by_runtime: RunGroupRow[];
  by_model: RunGroupRow[];
  by_task: RunGroupRow[];
  by_host: RunGroupRow[];
  by_project: RunGroupRow[];
  by_status: RunGroupRow[];
}

export interface RunTimelinePoint {
  bucket: string;
  provider: string;
  runs: number;
  failures: number;
  tokens: Num;
  cost_usd: Num;
  p50_ms: Num;
  p95_ms: Num;
}

export interface LatencyBucket {
  lo: Num;
  hi: Num | null;
  runs: Num;
}

export interface RunErrorRow {
  error_class: string;
  status: string;
  runs: number;
  models: number;
  latest: string | null;
  last_message: string | null;
  last_model: string | null;
}

export interface RunRow {
  run_id: string;
  provider: string;
  runtime: string;
  model: string;
  task: string | null;
  project: string | null;
  host: string | null;
  status: string;
  error_class: string | null;
  started_at: string | null;
  duration_ms: Num;
  ttft_ms: Num;
  queue_ms: Num;
  input_tokens: Num;
  output_tokens: Num;
  total_tokens: Num;
  tokens_per_second: Num;
  cost_usd: Num;
  vram_peak_mb: Num;
  gpu_name: string | null;
}

export interface AiRunsData {
  summary: RunSummary;
  timeline: RunTimelinePoint[];
  timelineBucket: string;
  latency: LatencyBucket[];
  errors: RunErrorRow[];
  recent: RunRow[];
}

/** Coerce an API numeric (which may arrive as a BIGINT/NUMERIC string). */
export function num(value: Num | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Same, but preserves "not measured" so a widget can render an em dash
 *  instead of a misleading zero. */
export function maybeNum(value: Num | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A run stopped by a budget guard or rate limit is a policy outcome, not a
 *  fault — the reliability widgets exclude it from the failure rate. */
export const POLICY_STATUSES = new Set(["rejected", "cancelled"]);

export const STATUS_COLORS: Record<string, string> = {
  ok: "bg-vault-green",
  error: "bg-vault-burgundy",
  timeout: "bg-vault-gold",
  rejected: "bg-vault-violet",
  cancelled: "bg-vault-slate"
};

export const PROVIDER_COLORS: Record<string, string> = {
  huggingface: "bg-vault-gold",
  "nvidia-nim": "bg-vault-green",
  ngc: "bg-vault-green",
  nemo: "bg-vault-cyan",
  ollama: "bg-vault-cyan",
  comfyui: "bg-vault-violet",
  local: "bg-vault-slate",
  openai: "bg-vault-burgundy",
  anthropic: "bg-vault-burgundy"
};

export function providerFill(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "bg-vault-slate";
}

/** Failure rate over runs that actually reached the model. */
export function failureRate(totals: RunTotals): number | null {
  const attempted = totals.runs - totals.rejected - totals.cancelled;
  if (attempted <= 0) return null;
  return (totals.errors + totals.timeouts) / attempted;
}

export function formatMs(value: Num | undefined): string {
  const n = maybeNum(value);
  if (n === null) return "—";
  if (n >= 60000) return `${(n / 60000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}s`;
  return `${Math.round(n)}ms`;
}

export function formatTokens(value: Num | undefined): string {
  const n = num(value);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function formatCost(value: Num | undefined): string {
  const n = maybeNum(value);
  if (n === null) return "—";
  if (n === 0) return "$0";
  if (n < 0.01) return `<$0.01`;
  return `$${n.toFixed(2)}`;
}
