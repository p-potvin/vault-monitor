// ── MilestonesCard — Progress bars towards milestone thresholds ───────────────

import { fmtInt } from '../lib/utils'
import type { MilestoneItem } from '../lib/types'

interface MilestonesCardProps {
  milestones?: MilestoneItem[] | string[]
}

export default function MilestonesCard({ milestones }: MilestonesCardProps) {
  if (!milestones || milestones.length === 0) return null

  // If passed as strings (legacy format), parse or display as list
  if (typeof milestones[0] === 'string') {
    return (
      <div className="flex flex-col gap-2">
        <ul className="flex flex-col gap-1.5">
          {(milestones as string[]).map((m, i) => (
            <li key={i} className="text-xs text-vault-slate">
              {m}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const items = milestones as MilestoneItem[]

  return (
    <div className="flex flex-col gap-3 py-1">
      {items.map((m) => {
        const pct = Math.min(100, m.max > 0 ? (m.cur / m.max) * 100 : 100)
        return (
          <div key={m.label} className="grid grid-cols-[130px_1fr_90px] items-center gap-3">
            <span className="text-[12px] font-medium text-vault-fg truncate" title={m.label}>
              {m.label}
            </span>

            {/* Progress Bar Track */}
            <div className="h-2 rounded-full bg-vault-gold/15 overflow-hidden w-full">
              <div
                className="h-full rounded-full bg-vault-gold transition-all duration-500"
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>

            {/* Numeric Label */}
            <span className="text-[12px] font-mono text-vault-muted text-right tabular-nums">
              {fmtInt(m.cur)} / {fmtInt(m.max)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
