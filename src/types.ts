export type SignalStatus = "ok" | "online" | "unchecked" | "missing" | "offline" | "failed" | "stale" | string;

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
}

export interface SearchResponse {
  query: string;
  count: number;
  items: SearchResult[];
}
