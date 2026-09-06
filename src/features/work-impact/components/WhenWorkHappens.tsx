// ── WhenWorkHappens — 7-column Day of Week Activity Visualization ──────────────

import type { BarItem } from '../lib/types'
import { fmtInt } from '../lib/utils'
import Tooltip from './Tooltip'

interface WhenWorkHappensProps {
  byDow?: BarItem[]
}

const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WhenWorkHappens({ byDow }: WhenWorkHappensProps) {
  if (!byDow || byDow.length === 0) return null

  const dowMap = new Map(byDow.map(b => [b.label, b.count]))
  const items = ORDER.map(label => ({ label, count: dowMap.get(label) ?? 0 }))
  const peak = Math.max(...items.map(i => i.count), 1)

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 7 columns container */}
      <div className="grid grid-cols-7 gap-2 items-end h-[160px] pt-4 px-1">
        {items.map(({ label, count }) => {
          const heightPct = count > 0 ? Math.max((count / peak) * 100, 10) : 4
          const isPeak = count === peak && count > 0
          return (
            <div key={label} className="h-full flex flex-col justify-end items-center gap-1.5">
              <span className="text-[10px] font-mono text-vault-muted tabular-nums">
                {count > 0 ? fmtInt(count) : '-'}
              </span>
              <Tooltip content={`${label}: ${fmtInt(count)} entries`}>
                <div
                  className={`w-full rounded-[4px] transition-all cursor-pointer ${
                    isPeak
                      ? 'bg-[#e5a93c] hover:bg-[#fcd34d] shadow-[0_2px_12px_rgba(229,169,60,0.35)]'
                      : 'bg-[#b8882e] hover:bg-[#c9983e] shadow-[0_2px_8px_rgba(184,136,46,0.2)]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </Tooltip>
            </div>
          )
        })}
      </div>

      {/* Day labels row */}
      <div className="grid grid-cols-7 gap-2 px-1 border-t border-vault-border/40 pt-2">
        {items.map(({ label, count }) => (
          <div key={label} className="text-center text-[11px] font-medium text-vault-slate select-none">
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
