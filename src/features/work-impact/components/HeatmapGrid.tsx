// ── HeatmapGrid — 7-row activity calendar heat map ───────────────────────────

import Tooltip from './Tooltip'
import type { DayEntry } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface HeatmapGridProps {
  daySeries: DayEntry[]
  t: I18nStrings
}

function levelClass(count: number): string {
  if (count === 0) return 'bg-vault-good0'
  if (count <= 3)  return 'bg-vault-good1'
  if (count <= 8)  return 'bg-vault-good2'
  if (count <= 15) return 'bg-vault-good3'
  return 'bg-vault-good4'
}

function buildWeekGrid(daySeries: DayEntry[]): DayEntry[][] {
  if (!daySeries.length) return []
  const map: Record<string, number> = {}
  for (const { date, count } of daySeries) map[date] = count

  const first = new Date(daySeries[0].date + 'T00:00:00')
  const last  = new Date(daySeries[daySeries.length - 1].date + 'T00:00:00')

  // Align to Sunday start of first week
  const start = new Date(first)
  start.setDate(start.getDate() - start.getDay())

  // Align to Saturday end of last week
  const end = new Date(last)
  end.setDate(end.getDate() + (6 - end.getDay()))

  // Build columns (weeks), each week = 7 days Sun-Sat
  const weeks: DayEntry[][] = []
  const cur = new Date(start)
  while (cur <= end) {
    const week: DayEntry[] = []
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().slice(0, 10)
      week.push({ date: iso, count: map[iso] ?? 0 })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export default function HeatmapGrid({ daySeries, t }: HeatmapGridProps) {
  const weeks = buildWeekGrid(daySeries)
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (!weeks.length) return (
    <p className="text-[12px] italic text-vault-muted">{t.noAgentDays}</p>
  )

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {/* DOW labels */}
        <div className="flex flex-col gap-[3px] shrink-0">
          {DOW.map(d => (
            <span key={d} className="text-[10px] text-vault-muted w-6 h-[13px] flex items-center">
              {d[0]}
            </span>
          ))}
        </div>
        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] shrink-0">
            {week.map(({ date, count }) => (
              <Tooltip key={date} content={`${date}: ${count} event${count !== 1 ? 's' : ''}`}>
                <div
                  className={`w-[13px] h-[13px] rounded-[2px] cursor-default transition-opacity hover:opacity-80 ${levelClass(count)}`}
                  aria-label={`${date}: ${count}`}
                />
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-[11px] text-vault-muted">
        <span>{t.less}</span>
        {['bg-vault-good0','bg-vault-good1','bg-vault-good2','bg-vault-good3','bg-vault-good4'].map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
        ))}
        <span>{t.more}</span>
      </div>
    </div>
  )
}
