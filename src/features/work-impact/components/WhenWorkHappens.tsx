// ── WhenWorkHappens — 7-column Day of Week Activity Visualization ──────────────

import type { BarItem } from '../lib/types'
import { fmtInt } from '../lib/utils'
import Tooltip from './Tooltip'

interface WhenWorkHappensProps {
  byDow?: BarItem[]
}

const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DAY_PALETTE = [
  { bg: 'bg-[#0ea5e9]', hover: 'hover:bg-[#38bdf8]', shadow: 'shadow-[0_2px_8px_rgba(14,165,233,0.25)]' }, // Mon: cyan
  { bg: 'bg-[#a855f7]', hover: 'hover:bg-[#c084fc]', shadow: 'shadow-[0_2px_8px_rgba(168,85,247,0.25)]' }, // Tue: purple
  { bg: 'bg-[#06b6d4]', hover: 'hover:bg-[#22d3ee]', shadow: 'shadow-[0_2px_8px_rgba(6,182,212,0.25)]' }, // Wed: teal
  { bg: 'bg-[#c84b31]', hover: 'hover:bg-[#e0564c]', shadow: 'shadow-[0_2px_8px_rgba(200,75,49,0.25)]' }, // Thu: rust / red
  { bg: 'bg-[#0ea5e9]', hover: 'hover:bg-[#38bdf8]', shadow: 'shadow-[0_2px_8px_rgba(14,165,233,0.25)]' }, // Fri: cyan
  { bg: 'bg-[#a855f7]', hover: 'hover:bg-[#c084fc]', shadow: 'shadow-[0_2px_8px_rgba(168,85,247,0.25)]' }, // Sat: purple
  { bg: 'bg-[#06b6d4]', hover: 'hover:bg-[#22d3ee]', shadow: 'shadow-[0_2px_8px_rgba(6,182,212,0.25)]' }, // Sun: teal
]

export default function WhenWorkHappens({ byDow }: WhenWorkHappensProps) {
  if (!byDow || byDow.length === 0) return null

  const dowMap = new Map(byDow.map(b => [b.label, b.count]))
  const items = ORDER.map(label => ({ label, count: dowMap.get(label) ?? 0 }))
  const peak = Math.max(...items.map(i => i.count), 1)

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 7 columns container */}
      <div className="grid grid-cols-7 gap-2 items-end h-[160px] pt-4 px-1">
        {items.map(({ label, count }, idx) => {
          const heightPct = count > 0 ? Math.max((count / peak) * 100, 10) : 4
          const isPeak = count === peak && count > 0
          const pal = DAY_PALETTE[idx % DAY_PALETTE.length]
          return (
            <div key={label} className="h-full flex flex-col justify-end items-center gap-1.5">
              <span className="text-[10px] font-mono text-vault-muted tabular-nums">
                {count > 0 ? fmtInt(count) : '-'}
              </span>
              <Tooltip content={`${label}: ${fmtInt(count)} entries`}>
                <div
                  className={`w-full rounded-[4px] transition-all cursor-pointer ${
                    isPeak
                      ? 'bg-[#e5a93c] hover:bg-[#fcd34d] shadow-[0_2px_12px_rgba(229,169,60,0.4)] ring-1 ring-[#fcd34d]/40'
                      : `${pal.bg} ${pal.hover} ${pal.shadow}`
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
