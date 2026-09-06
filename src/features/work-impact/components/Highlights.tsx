// ── Highlights — notable period highlights ────────────────────────────────────

import KpiCard from './KpiCard'
import type { HighlightData } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface HighlightsProps {
  highlights?: HighlightData
  t: I18nStrings
}

export default function Highlights({ highlights, t }: HighlightsProps) {
  if (!highlights) return null

  return (
    <div className="flex flex-col gap-5">
      {/* 3 headline KPIs matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label={t.hlMostConsistentMonth}
          value={highlights.mostConsistentMonth}
          sub={highlights.mostConsistentDays ? `${highlights.mostConsistentDays} days` : undefined}
          variant="accent"
          tooltip={t.hlMostConsistentMonthTooltip}
        />
        <KpiCard
          label={t.hlWidestProjectDay}
          value={highlights.widestProjectDay}
          sub={highlights.widestProjectCount ? `${highlights.widestProjectCount} projects` : undefined}
          tooltip={t.hlWidestProjectDayTooltip}
        />
        <KpiCard
          label={t.hlStrongestWeek}
          value={highlights.strongestWeek}
          sub={highlights.strongestWeekCount ? `${highlights.strongestWeekCount} entries` : undefined}
          tooltip={t.hlStrongestWeekTooltip}
        />
      </div>
    </div>
  )
}
