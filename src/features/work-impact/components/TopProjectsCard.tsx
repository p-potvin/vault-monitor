// ── TopProjectsCard — Top Projects progress bars matching Screenshot 1 ─────────

import type { BarItem } from '../lib/types'
import { fmtInt } from '../lib/utils'

interface TopProjectsCardProps {
  projects?: BarItem[] | string[]
}

export default function TopProjectsCard({ projects }: TopProjectsCardProps) {
  if (!projects || projects.length === 0) return null

  const items: BarItem[] = typeof projects[0] === 'string'
    ? (projects as string[]).map(p => ({ label: p, count: 0 }))
    : (projects as BarItem[])

  const top = items.slice(0, 5)
  const max = Math.max(1, ...top.map(p => p.count))

  return (
    <div className="flex flex-col gap-3 py-1">
      {top.map((p) => {
        const pct = max > 0 ? (p.count / max) * 100 : 0
        return (
          <div key={p.label} className="grid grid-cols-[140px_1fr_50px] items-center gap-3">
            <span className="text-[12px] font-medium text-vault-fg truncate" title={p.label}>
              {p.label}
            </span>

            {/* Progress Bar Track */}
            <div className="h-2 rounded-full bg-vault-gold/15 overflow-hidden w-full">
              <div
                className="h-full rounded-full bg-vault-gold transition-all duration-500"
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>

            {/* Numeric count */}
            <span className="text-[12px] font-mono text-vault-muted text-right tabular-nums">
              {fmtInt(p.count)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
