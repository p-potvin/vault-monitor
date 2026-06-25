// ── ActivityPatterns — hour-of-day + day-of-week distributions ────────────────

import MicroBarChart from './MicroBarChart'
import type { BarItem } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface ActivityPatternsProps {
  byHour?: BarItem[]
  byDow?: BarItem[]
  t: I18nStrings
}

export default function ActivityPatterns({ byHour, byDow }: ActivityPatternsProps) {
  const hasHour = byHour && byHour.length > 0
  const hasDow  = byDow  && byDow.length  > 0
  if (!hasHour && !hasDow) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {hasHour && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            Hour of Day
          </h3>
          <MicroBarChart
            items={byHour.map(b => ({ label: b.label, value: b.count }))}
            color="cyan"
          />
        </div>
      )}
      {hasDow && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            Day of Week
          </h3>
          <MicroBarChart
            items={byDow.map(b => ({ label: b.label, value: b.count }))}
            color="violet"
          />
        </div>
      )}
    </div>
  )
}
