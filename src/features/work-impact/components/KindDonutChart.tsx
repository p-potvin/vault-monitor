// ── KindDonutChart — Donut chart of activity by kind matching Screenshot 2 ────

import { useState } from 'react'
import type { BarItem } from '../lib/types'
import { fmtInt } from '../lib/utils'

interface KindDonutChartProps {
  items: BarItem[]
}

const KIND_COLORS: Record<string, string> = {
  'code-change':   '#b8882e', // warm gold
  'verification':  '#8a62c0', // purple
  'general':       '#4e9954', // green
  'devops':        '#d97736', // orange / devops
  'dev-ops':       '#d97736',
  'plan':          '#a84e5a', // rose / burgundy
  'bug':           '#e05252', // coral red
  'bugfix':        '#e05252',
  'feature':       '#2a9d8f', // teal / cyan
  'brainstorm':    '#80ed99', // bright light green
  'documentation': '#c49840', // yellow amber
  'handoff':       '#9a7428', // muted gold
  'deployment':    '#6a4aa0', // violet
}

const FALLBACK_COLORS = ['#b8882e', '#8a62c0', '#4e9954', '#d97736', '#a84e5a', '#e05252', '#2a9d8f', '#80ed99', '#c49840', '#9a7428']

export default function KindDonutChart({ items }: KindDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (total === 0) {
    return <div className="text-xs text-vault-muted italic py-8 text-center">No kind data available</div>
  }

  // Precompute arcs for donut chart
  // SVG viewBox 0 0 200 200, center at 100, 100, outer radius 80, inner radius 50
  const cx = 100
  const cy = 100
  const rOuter = 82
  const rInner = 52

  let cumulativeAngle = -Math.PI / 2 // Start at top (12 o'clock)

  const slices = items.map((item, idx) => {
    const fraction = item.count / total
    const angle = fraction * 2 * Math.PI
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle

    const x1Outer = cx + rOuter * Math.cos(startAngle)
    const y1Outer = cy + rOuter * Math.sin(startAngle)
    const x2Outer = cx + rOuter * Math.cos(endAngle)
    const y2Outer = cy + rOuter * Math.sin(endAngle)

    const x1Inner = cx + rInner * Math.cos(endAngle)
    const y1Inner = cy + rInner * Math.sin(endAngle)
    const x2Inner = cx + rInner * Math.cos(startAngle)
    const y2Inner = cy + rInner * Math.sin(startAngle)

    const largeArc = angle > Math.PI ? 1 : 0

    const pathData = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ')

    const color = KIND_COLORS[item.label.toLowerCase()] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]

    return {
      ...item,
      pathData,
      color,
      fraction,
      pct: (fraction * 100).toFixed(1),
    }
  })

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Donut SVG */}
      <div className="relative w-[180px] h-[180px]">
        <svg viewBox="0 0 200 200" className="w-full h-full transform transition-transform">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx
            return (
              <path
                key={slice.label}
                d={slice.pathData}
                fill={slice.color}
                stroke="#161320"
                strokeWidth={isHovered ? 3 : 1.5}
                className="transition-all cursor-pointer hover:opacity-90"
                style={{
                  transformOrigin: '100px 100px',
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            )
          })}
        </svg>

        {/* Center Hover Details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {hoveredIdx !== null && slices[hoveredIdx] ? (
            <>
              <span className="text-[11px] font-bold text-vault-fg truncate max-w-[90px]">
                {slices[hoveredIdx].label}
              </span>
              <span className="text-[16px] font-mono font-bold text-vault-gold leading-tight">
                {slices[hoveredIdx].pct}%
              </span>
              <span className="text-[10px] font-mono text-vault-muted">
                {fmtInt(slices[hoveredIdx].count)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] uppercase tracking-wider text-vault-muted font-semibold">
                Total
              </span>
              <span className="text-[16px] font-mono font-bold text-vault-fg leading-tight">
                {fmtInt(total)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-[340px] px-2">
        {slices.map((slice, idx) => (
          <div
            key={slice.label}
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
              hoveredIdx !== null && hoveredIdx !== idx ? 'opacity-40' : 'opacity-100'
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-[2px] shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-[11px] text-vault-slate truncate">
              {slice.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
