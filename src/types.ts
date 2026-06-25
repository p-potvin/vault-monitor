export type SignalStatus = "ok" | "online" | "unchecked" | "missing" | "offline" | "failed" | "stale" | string;

const knownKinds = new Set(["code-change", "plan", "verification", "commands", "handoff", "general"]);

export function parseKinds(kind?: string): string[] {
  return kind ? kind.split(/[,+|]/).map((part) => part.trim()).filter(Boolean) : ["general"];
}

export function isKnownKind(kind: string) {
  return knownKinds.has(kind);
}

export interface HealthTotals {
  total: number;
  ok: number;
  failed: number;
  skipped: number;
  resource_samples?: number;
}

export interface HealthServicePath {
  path_id?: string | number;
  ok?: boolean;
  status_code?: number;
  duration_ms?: number;
  failure_class?: string | null;
  skipped_reason?: string | null;
}

export interface HealthService {
  service_id: string;
  service_name?: string;
  repo?: string;
  environment?: string;
  status?: SignalStatus;
  ok?: number;
  failed?: number;
  skipped?: number;
  paths?: HealthServicePath[];
}

export interface HealthLedger {
  status: SignalStatus;
  generated_at?: string;
  run_id?: string;
  probe_location?: string;
  totals: HealthTotals;
  services: HealthService[];
  recent_failures: Record<string, unknown>[];
  resource_samples: Record<string, unknown>[];
  active_incidents: Record<string, unknown>[];
  active_incident_count: number;
}

export interface UsageItem {
  name: string;
  count: number;
}

export interface AgentEvent {
  id: string;
  timestamp?: string;
  project: string;
  kind: string;
  summary: string;
  commands?: string[];
  files?: string[];
  model?: string;
  tool?: string;
  mcp_servers?: string[];
}

export interface AgentLedger {
  status: SignalStatus;
  recent: AgentEvent[];
  usage: {
    total_events: number;
    models: UsageItem[];
    tools: UsageItem[];
    mcp_servers: UsageItem[];
    day_series: Array<{ day: string; count: number }>;
  };
}

export interface KiwiStatus {
  status: SignalStatus;
  url: string;
  checked_at?: string | null;
  status_code?: number;
  duration_ms?: number;
  message?: string;
}

export interface UploadFailure {
  timestamp: string;
  path: string;
  reason: string;
}

export interface UploadRun {
  timestamp: string;
  ok: number;
  fail: number;
  skip: number;
}

export interface UploadOtherError {
  timestamp: string | null;
  message: string;
}

export interface UploadRow {
  id: number;
  local_path: string;
  remote_path: string;
  drive_link: string | null;
  size_bytes: number;
  media_type: string;
  uploaded_at: string;
  unmonitored: number;
  linkvertise_link: string | null;
  linkvertise_id: string | null;
}

export interface UploadsSummary {
  source: string;
  status: SignalStatus;
  generated_at: string;
  paths: { db: string; log: string };
  totals_24h: { ok: number; fail: number; skip: number; runs: number };
  totals_overall: { ok: number; fail: number; skip: number; runs: number };
  recent_failures: UploadFailure[];
  recent_runs: UploadRun[];
  other_errors: UploadOtherError[];
  recent_uploads: UploadRow[];
}

export interface OverviewResponse {
  name: string;
  internal_name: string;
  generated_at: string;
  api_owner: string;
  storage_note: string;
  health: HealthLedger;
  agents: AgentLedger;
  logging: {
    kiwi: KiwiStatus;
  };
  uploads?: UploadsSummary;
}

export interface SearchResult {
  source: "agent-ledger" | "health-ledger" | string;
  timestamp?: string;
  project?: string;
  kind?: string;
  summary?: string;
  service_id?: string;
  service_name?: string;
  event_type?: string;
  ok?: boolean;
  failure_class?: string;
  model?: string;
  tool?: string;
  mcp_server?: string;
  run_id?: string;
  diagnostics?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  count: number;
  items: SearchResult[];
}

export type ServiceProduct = "vaultwares" | "prom-king" | "shared";
export type ServiceType =
  | "site"
  | "app"
  | "api"
  | "database"
  | "container"
  | "service"
  | "timer"
  | "scheduled-task"
  | "runner"
  | "joker";
export type ServiceStatus =
  | "healthy"
  | "degraded"
  | "offline"
  | "stale"
  | "unmonitored";

export interface MonitoredService {
  id: string;
  name: string;
  product: ServiceProduct;
  type: ServiceType;
  host: string;
  runtime?: string;
  status: ServiceStatus;
  checkedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  latencyMs?: number;
  dependencies: string[];
}

export interface ServicesResponse {
  source: "health-ledger";
  generatedAt: string;
  count: number;
  items: MonitoredService[];
}

export interface ServiceFilters {
  product: ServiceProduct | "all";
  type: ServiceType | "all";
  host: string | "all";
  status: ServiceStatus | "all";
}

export interface ServiceSummary {
  total: number;
  healthy: number;
  degraded: number;
  offline: number;
  stale: number;
  unmonitored: number;
}

export interface ChangeEvent {
  createdAt?: string;
  createdAtLocal?: string;
  project?: string;
  kind?: string;
  summary?: string;
  actor?: string;
  agentHeader?: string;
  commands?: string[];
  files?: string[];
  planPath?: string;
  git?: { repo?: string; branch?: string; head?: string };
  telemetry?: { flags?: Record<string, unknown>; metrics?: Record<string, unknown> };
}

export interface InputTrackerData {
  source?: string;
  status?: string;
  generated_at?: string;
  latest_received_at?: string | null;
  window_hours?: number;
  totals?: Record<string, number>;
  derived?: { wpm?: number; cpm?: number; correction_ratio?: number; click_to_travel_ratio?: number };
  kpis?: {
    focus?: Record<string, number | string | null>;
    typing?: Record<string, number | string | null>;
    pointer?: Record<string, number | string | null>;
    rhythm?: Record<string, number | string | null>;
    reliability?: Record<string, number | string | null>;
  };
  key_latency_buckets?: { name: string; count: number }[];
  click_hotspots?: { name: string; count: number }[];
  focus_categories?: { name: string; count: number }[];
  focus_windows?: { name: string; category?: string; count: number }[];
  events?: Array<{
    event_id?: string; event_type?: string; timestamp?: string;
    metrics?: Record<string, unknown>; dimensions?: Record<string, unknown>;
  }>;
  message?: string;
}

export interface QALogEntry {
  node: string;
  site: string;
  script: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  timestamp: number;
}

export interface QAResponse {
  status: string;
  logs: QALogEntry[];
}
