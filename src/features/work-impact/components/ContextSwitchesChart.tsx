// ── ContextSwitchesChart — Bar chart of context switches per day matching Screenshot 2 ──

import { useMemo, useState } from 'react'
import type { ContextSwitchPoint } from '../lib/types'
import Tooltip from './Tooltip'

interface ContextSwitchesChartProps {
  items?: ContextSwitchPoint[]
  daysBack?: number
}

export default function ContextSwitchesChart({ items = [], daysBack = 30 }: ContextSwitchesChartProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Filter to last N days
  const recent = useMemo(() => {
    if (!items || items.length === 0) return []
    return items.slice(-daysBack)
  }, [items, daysBack])

  if (recent.length === 0) {
    return <div className="text-xs text-vault-muted italic py-8 text-center">No context switch data available</div>
  }

  // Find max value, ceiling to at least 10 (matching Screenshot 2 Y-axis)
  const maxVal = Math.max(10, Math.ceil((Math.max(...recent.map(r => r.switches), 1) + 1) / 2) * 2)
  const yTicks = [10, 8, 6, 4, 2, 0]

  return (
    <div className="flex flex-col gap-2 w-full pt-1">
      {/* Scope badge / info strip */}
      <div className="flex items-center justify-between text-[11px] font-mono text-vault-muted px-1 mb-1">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-vault-raised text-vault-slate border border-vault-border/60 text-[10px] font-bold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-vault-cyan" />
          Last 30 Days
        </span>
        <span className="text-[10px] text-vault-dim">
          Day of month (01–31)
        </span>
      </div>

      <div className="relative flex items-stretch h-[170px] w-full">
        {/* Y Axis Labels */}
        <div className="flex flex-col justify-between items-end pr-2 text-[10px] font-mono text-vault-muted select-none pb-[24px]">
          {yTicks.map(tick => (
            <span key={tick} className="leading-none">{tick}</span>
          ))}
        </div>

        {/* Chart Area */}
        <div className="relative flex-1 flex flex-col justify-between">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[24px]">
            {yTicks.map(tick => (
              <div key={tick} className="w-full border-b border-white/[0.04]" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex-1 flex items-end justify-between gap-1 z-10 pb-[24px] px-1">
            {recent.map((pt) => {
              const heightPct = Math.min(100, Math.max((pt.switches / maxVal) * 100, pt.switches > 0 ? 5 : 0))
              const isHovered = hoveredDate === pt.date
              const tipContent = `${pt.date}: ${pt.switches} switches\nProjects (${pt.projects.length}):\n${pt.projects.join(', ')}`

              const isHigh = pt.switches >= 4
              const barColor = isHigh
                ? 'bg-[#e5a93c] hover:bg-[#fcd34d]'
                : 'bg-[#8b5cf6] hover:bg-[#a78bfa]'

              return (
                <div key={pt.date} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                  <Tooltip content={tipContent}>
                    <div
                      className={`w-full max-w-[12px] ${barColor} rounded-t-[2px] transition-all cursor-pointer ${
                        isHovered ? 'opacity-100 ring-1 ring-white/60 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'opacity-85'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      onMouseEnter={() => setHoveredDate(pt.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                    />
                  </Tooltip>
                </div>
              )
            })}
          </div>

          {/* X Axis Labels: Day of month only (no year or month) */}
          <div className="absolute bottom-0 left-0 right-0 h-[22px] flex items-center justify-between text-[10px] font-mono text-vault-muted px-1 pointer-events-none">
            {recent.map((pt, idx) => {
              const showLabel = idx % 2 === 0 || idx === recent.length - 1
              const dayNum = pt.date.slice(8)
              return (
                <div key={pt.date} className="flex-1 flex justify-center">
                  {showLabel ? (
                    <span className="select-none font-medium tabular-nums text-vault-slate">
                      {dayNum}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
