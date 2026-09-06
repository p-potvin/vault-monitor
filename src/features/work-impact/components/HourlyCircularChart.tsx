// ── HourlyCircularChart — Circular 24-hour radial bar chart ───────────────────

import { useState } from 'react'
import type { BarItem } from '../lib/types'
import { fmtInt } from '../lib/utils'

interface HourlyCircularChartProps {
  byHour?: BarItem[]
}

export default function HourlyCircularChart({ byHour }: HourlyCircularChartProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  if (!byHour || byHour.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-xs text-vault-muted italic">
        No hourly data available
      </div>
    )
  }

  // Ensure 24 hours (0..23)
  const hourMap = new Map<number, number>()
  for (const item of byHour) {
    const h = parseInt(item.label, 10)
    if (!isNaN(h) && h >= 0 && h < 24) {
      hourMap.set(h, item.count)
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourMap.get(i) ?? 0,
    label: `${String(i).padStart(2, '0')}:00`,
  }))

  const peak = Math.max(...hours.map(h => h.count), 1)
  const peakItem = hours.reduce((best, cur) => cur.count > best.count ? cur : best, hours[0])

  // Center & radii
  const cx = 130
  const cy = 130
  const rInner = 44
  const rOuterMax = 104
  const totalSlots = 24
  const slotAngle = (2 * Math.PI) / totalSlots
  const padAngle = 0.04 // radians gap between bars

  const active = hoveredHour !== null ? hours[hoveredHour] : peakItem

  return (
    <div className="flex flex-col items-center justify-center select-none py-1">
      <div className="relative w-[260px] h-[260px] flex items-center justify-center">
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full overflow-visible"
        >
          {/* Subtle concentric guide rings */}
          <circle cx={cx} cy={cy} r={rInner} fill="#161320" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={rInner + (rOuterMax - rInner) * 0.5} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="2 3" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={rOuterMax} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

          {/* 24 Radial bars */}
          {hours.map(({ hour, count }) => {
            const startA = hour * slotAngle - Math.PI / 2 + padAngle / 2
            const endA = (hour + 1) * slotAngle - Math.PI / 2 - padAngle / 2

            const isHovered = hoveredHour === hour
            const isPeak = count === peak && count > 0

            const barLength = count > 0
              ? rInner + Math.max(6, (count / peak) * (rOuterMax - rInner))
              : rInner + 3

            // Arc coordinates
            const x1Inner = cx + rInner * Math.cos(startA)
            const y1Inner = cy + rInner * Math.sin(startA)
            const x2Inner = cx + rInner * Math.cos(endA)
            const y2Inner = cy + rInner * Math.sin(endA)

            const x1Outer = cx + barLength * Math.cos(startA)
            const y1Outer = cy + barLength * Math.sin(startA)
            const x2Outer = cx + barLength * Math.cos(endA)
            const y2Outer = cy + barLength * Math.sin(endA)

            const pathData = [
              `M ${x1Inner} ${y1Inner}`,
              `L ${x1Outer} ${y1Outer}`,
              `A ${barLength} ${barLength} 0 0 1 ${x2Outer} ${y2Outer}`,
              `L ${x2Inner} ${y2Inner}`,
              `A ${rInner} ${rInner} 0 0 0 ${x1Inner} ${y1Inner}`,
              'Z'
            ].join(' ')

            let fill = '#b8882e'
            let opacity = 0.78

            if (count === 0) {
              fill = '#2a2438'
              opacity = 0.4
            } else if (isHovered) {
              fill = '#fcd34d'
              opacity = 1
            } else if (isPeak) {
              fill = '#e5a93c'
              opacity = 0.95
            } else {
              opacity = 0.55 + (count / peak) * 0.4
            }

            return (
              <path
                key={hour}
                d={pathData}
                fill={fill}
                fillOpacity={opacity}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <title>{`${String(hour).padStart(2, '0')}:00 – ${fmtInt(count)} entries`}</title>
              </path>
            )
          })}

          {/* Cardinal hour labels */}
          <text x={cx} y={cy - rOuterMax - 6} textAnchor="middle" fill="rgba(216,208,240,0.4)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">00h</text>
          <text x={cx + rOuterMax + 14} y={cy + 3} textAnchor="middle" fill="rgba(216,208,240,0.4)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">06h</text>
          <text x={cx} y={cy + rOuterMax + 14} textAnchor="middle" fill="rgba(216,208,240,0.4)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">12h</text>
          <text x={cx - rOuterMax - 14} y={cy + 3} textAnchor="middle" fill="rgba(216,208,240,0.4)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">18h</text>
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-vault-muted">
            {hoveredHour !== null ? 'Hour' : 'Peak Hour'}
          </span>
          <span className="text-[15px] font-mono font-bold text-vault-gold leading-tight">
            {active.label}
          </span>
          <span className="text-[11px] font-mono text-vault-slate">
            {fmtInt(active.count)} <span className="text-[9px] text-vault-muted">entries</span>
          </span>
        </div>
      </div>
      <p className="text-[10px] text-vault-muted tracking-wide mt-1">
        24h dial &bull; hover to inspect hourly volume
      </p>
    </div>
  )
}
