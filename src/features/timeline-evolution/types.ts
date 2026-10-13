export interface Keyframe {
  date: string;
  title: string;
  category: 'milestone' | 'architecture' | 'peak' | 'performance' | 'telemetry' | 'design' | 'infrastructure' | 'features' | 'security';
  summary: string;
  icon: string;
}

export interface DayEvent {
  date: string;
  time: string;
  datetime: string;
  project: string;
  kind: string;
  actor: string;
  model: string;
  summary: string;
  filesCount: number;
  head?: string | null;
}

export interface MinuteRollup {
  id?: string;
  date: string;
  time: string;
  timestamp: string;
  window: string;
  focus: string;
  keys: number;
  chars: number;
  clicks: number;
  scrolls: number;
  switches: number;
  mouseM: number;
  activeSec: number;
  saves: number;
  copies: number;
  pastes: number;
}

export interface MousePathPoint {
  t_ms: number;
  x: number;
  y: number;
}

export interface ProjectCumItem {
  name: string;
  count: number;
}

export interface TimelineDay {
  date: string;
  index: number;
  events: number;
  cumEvents: number;
  activeDays: number;
  projects: string[];
  projectCount: number;
  cumProjects: number;
  kinds: Record<string, number>;
  spoolMinutes: number;
  keystrokes: number;
  cumKeystrokes: number;
  mouseDistanceM: number;
  cumMouseDistanceM: number;
  charsTyped: number;
  cumCharsTyped: number;
  clicks: number;
  contextSwitches: number;
  topWindows: string[];
  models: Record<string, number>;
  keyframe?: Keyframe | null;
  eventsSample: DayEvent[];
  totalEventsOnDay: number;
  topCumProjects: ProjectCumItem[];
  hasNaturalPath: boolean;
  naturalPathSample?: MousePathPoint[];
}

export interface AgentModelSummary {
  name: string;
  role: string;
  events: number;
  specialty: string;
}

export interface ContractPrinciple {
  title: string;
  summary: string;
}

export interface SoloDevComparisonItem {
  name: string;
  soloDev: string;
  vaultwares: string;
  factor: string;
  desc: string;
}

export interface SoloDevComparison {
  metric: SoloDevComparisonItem[];
  estimatedHoursSaved: number;
  equivalentTeamSize: string;
  productivityMultiple: string;
  actualSpendCAD?: {
    modelSubscriptions: number;
    infrastructure: number;
    toolsAndUtilities: number;
    total: number;
  };
}

export interface TimelineData {
  meta: {
    generatedAt: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    activeDays: number;
    totalEvents: number;
    totalProjects: number;
    totalMinuteSpools: number;
    totalKeystrokes: number;
    totalMouseDistanceM: number;
  };
  keyframes: Keyframe[];
  days: TimelineDay[];
  spoolDetailsByDate: Record<string, MinuteRollup[]>;
  agentCollaboration: {
    models: AgentModelSummary[];
    principles: ContractPrinciple[];
    soloComparison: SoloDevComparison;
  };
}
