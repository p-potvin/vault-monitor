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

      {/* Top projects (if rendered standalone) */}
      {highlights.topProjects.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            {t.labelProjects}
          </h3>
          <div className="flex flex-wrap gap-2">
            {highlights.topProjects.map((p, i) => {
              const label = typeof p === 'string' ? p : p.label
              return (
                <span
                  key={i}
                  className="px-[10px] py-[3px] rounded-[999px] text-[11px] font-bold bg-vault-raised text-vault-violet border border-vault-border"
                >
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Milestones (if rendered standalone) */}
      {highlights.milestones.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            {t.hlMilestones}
          </h3>
          <ul className="flex flex-col gap-[6px]">
            {highlights.milestones.map((m, i) => {
              const text = typeof m === 'string' ? m : `${m.label}: ${m.cur} / ${m.max}`
              return (
                <li key={i} className="flex items-start gap-2 text-[13px] text-vault-slate leading-snug">
                  <span className="mt-[2px] shrink-0 w-[6px] h-[6px] rounded-full bg-vault-gold" />
                  {text}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
