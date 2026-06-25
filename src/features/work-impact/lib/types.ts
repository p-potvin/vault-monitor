// ── Data shape types for WorkImpact data ────────────────────────────────────

export interface DayEntry {
  date: string       // YYYY-MM-DD
  count: number
}

export interface BarItem {
  label: string
  count: number
}

export interface CommitStatRow {
  mean:    number
  median:  number
  mode:    number
  samples: number
}

export interface CommitBucket {
  edge:  string
  count: number
}

export interface MonthBox {
  month:  string
  min:    number
  q1:     number
  median: number
  q3:     number
  max:    number
}

export interface TechRow {
  label:      string
  insertions: number
  deletions:  number
  files:      number
  churn:      number
  net:        number
}

export interface TechVolumeData {
  raw:      TechRow
  clean:    TechRow
  excluded: TechRow
}

export interface AgentData {
  totalEvents:   number
  distinctActors: number
  modelsUsed:    number
  toolsUsed:     number
  topTools:      BarItem[]
  topMcp:        BarItem[]
  topActors:     BarItem[]
  dayActivity:   BarItem[]
}

export interface ProjectSummary {
  name:       string
  aliases:    string[]
  entries:    number
  first:      string
  last:       string
  kinds:      Record<string, number>
  recentSummaries: string[]
}

export interface HighlightData {
  mostConsistentMonth: string
  widestProjectDay:    string
  strongestWeek:       string
  milestones:          string[]
  topProjects:         string[]
}

export interface WorkImpactData {
  generatedAt:     string
  rangeStart:      string
  rangeEnd:        string
  lang:            'en' | 'qc'

  // KPI row
  totalEvents:     number
  activeDays:      number
  totalProjects:   number
  streakCurrent:   number
  streakLongest:   number
  busiestDay:      string
  busiestDayCount: number
  busiestWeek:     string
  busiestWeekCount:number
  totalCommits:    number

  // Timeline
  daySeries:       DayEntry[]

  // Activity
  byMonth:         BarItem[]
  byKind:          BarItem[]
  byProject:       BarItem[]

  // Commits
  commitStats?:    CommitStatRow
  commitBuckets?:  CommitBucket[]
  monthBoxes?:     MonthBox[]
  commitOutliers?: string[]

  // Lines
  techVolume?:     TechVolumeData
  filesTouched?:   { mean: number; median: number; p90: number; max: number }

  // Concentration
  concentration?:  BarItem[]

  // Highlights
  highlights?:     HighlightData

  // Activity patterns
  byHour?:         BarItem[]  // 0-23 hour labels
  byDow?:          BarItem[]  // Mon-Sun

  // Agents
  agentData?:      AgentData

  // Projects detailed
  projects?:       ProjectSummary[]
}
