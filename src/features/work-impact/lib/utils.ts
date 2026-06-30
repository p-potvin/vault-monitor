// ── Utility functions mirroring WORK_IMPACT.html JS logic ───────────────────

export function fmtInt(n: number): string {
  return n.toLocaleString()
}

export function fmt1(n: number): string {
  return n.toFixed(1)
}

export function fmt2(n: number): string {
  return n.toFixed(2)
}

export function fmtSigned(n: number): string {
  return n >= 0 ? `+${fmtInt(n)}` : fmtInt(n)
}

export function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

/** Percentile from a sorted array */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const idx = q * (sorted.length - 1)
  const lo  = Math.floor(idx)
  const hi  = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo])
}

/** Histogram bucket edges matching the original JS */
export function histogramBuckets(values: number[]): { edge: string; count: number }[] {
  const edges = [0, 10, 25, 50, 100, 200, 400, 800, 1600, 3200, 6400]
  const labels = edges.map((e, i) =>
    i < edges.length - 1 ? `${e}–${edges[i + 1]}` : `${e}+`
  )
  const buckets = labels.map(label => ({ edge: label, count: 0 }))
  for (const v of values) {
    let bi = edges.length - 1
    for (let i = 0; i < edges.length - 1; i++) {
      if (v >= edges[i] && v < edges[i + 1]) { bi = i; break }
    }
    buckets[bi].count++
  }
  return buckets.filter(b => b.count > 0)
}

export interface StreakResult {
  current: number
  longest: number
}

export interface BusiestResult {
  bday:  { date: string; count: number }
  bweek: { week: string; count: number }
}

/** Compute current + longest streak from a sorted day-series */
export function computeStreaks(daySeries: { date: string; count: number }[]): StreakResult {
  if (!daySeries.length) return { current: 0, longest: 0 }
  const dates = daySeries.filter(d => d.count > 0).map(d => d.date).sort()
  if (!dates.length) return { current: 0, longest: 0 }

  let longest = 1, cur = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      cur++
      if (cur > longest) longest = cur
    } else {
      cur = 1
    }
  }

  // Current streak: walk backward from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateSet = new Set(dates)
  let current = 0
  const check = new Date(today)
  while (true) {
    const key = check.toISOString().slice(0, 10)
    if (!dateSet.has(key)) break
    current++
    check.setDate(check.getDate() - 1)
  }

  return { current, longest }
}

/** Find busiest single day and busiest calendar week */
export function computeBusiest(daySeries: { date: string; count: number }[]): BusiestResult {
  const bday = daySeries.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { date: '', count: 0 }
  )

  // Group by ISO week (YYYY-Www)
  const weekMap: Record<string, number> = {}
  for (const { date, count } of daySeries) {
    const d = new Date(date)
    // Simple ISO week approach
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    const key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
    weekMap[key] = (weekMap[key] ?? 0) + count
  }
  const bweekEntry = Object.entries(weekMap).reduce(
    (best, [week, count]) => (count > best.count ? { week, count } : best),
    { week: '', count: 0 }
  )

  return { bday, bweek: bweekEntry }
}

/** Escape HTML special chars */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Format a YYYY-MM-DD date string to a readable locale string */
export function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Prettify raw strings like 'claude-opus-4-7' to 'Claude Opus 4 7' */
export function humanizeString(str: unknown): string {
  if (typeof str !== 'string' || !str) return String(str || '');
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}
