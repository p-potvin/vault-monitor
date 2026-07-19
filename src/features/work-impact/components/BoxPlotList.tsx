// ── BoxPlotList — box-and-whisker rows per month ─────────────────────────────

import { fmtInt } from '../lib/utils'
import type { MonthBox } from '../lib/types'
import Tooltip from './Tooltip'

interface BoxPlotListProps {
  months: MonthBox[]
}

export default function BoxPlotList({ months }: BoxPlotListProps) {
  if (!months.length) return null

  // Standard Tukey whiskers: extend to the furthest sample within 1.5x IQR of
  // the box, not the raw min/max. A handful of giant-rewrite commits (already
  // called out separately as outliers) otherwise dominate a linear scale and
  // squash every box down to an invisible sliver.
  const rows = months.map(m => {
    const iqr = Math.max(0, m.q3 - m.q1)
    const fenceHigh = m.q3 + 1.5 * iqr
    const fenceLow = Math.max(0, m.q1 - 1.5 * iqr)
    const whiskerMax = Math.min(m.max, fenceHigh)
    const whiskerMin = Math.max(m.min, fenceLow)
    return { ...m, whiskerMin, whiskerMax, hasHighOutlier: m.max > whiskerMax }
  })

  const scaleMax = Math.max(...rows.map(r => r.whiskerMax), 1)
  const toPct = (v: number) => Math.min(100, (v / scaleMax) * 100)
  const MIN_BOX_PCT = 1.5

  return (
    <div className="flex flex-col gap-[8px]">
      {rows.map((row) => {
        const { month, q1, median, q3, min, max, whiskerMin, whiskerMax, hasHighOutlier } = row
        const whiskerLeft = toPct(whiskerMin)
        const whiskerWidth = Math.max(0, toPct(whiskerMax) - whiskerLeft)
        const iqrLeft = toPct(q1)
        const iqrWidth = Math.max(q3 > q1 ? MIN_BOX_PCT : 0, Math.min(100 - iqrLeft, toPct(q3) - iqrLeft))
        const medLeft = toPct(median)

        return (
          <Tooltip
            key={month}
            content={`${month} — min ${fmtInt(min)} · Q1 ${fmtInt(q1)} · median ${fmtInt(median)} · Q3 ${fmtInt(q3)} · max ${fmtInt(max)}`}
          >
            <div className="flex items-center gap-2 text-[12px] min-w-0 cursor-pointer">
              <span className="text-vault-muted shrink-0" style={{ width: 54 }}>{month}</span>
              {/* Plot area */}
              <div className="relative flex-1 h-[16px]">
                {/* Whisker line */}
                <div
                  className="absolute top-1/2 h-[1px] bg-vault-muted -translate-y-1/2"
                  style={{ left: `${whiskerLeft}%`, width: `${whiskerWidth}%` }}
                />
                {/* IQR box */}
                <div
                  className="absolute top-[3px] h-[10px] bg-vault-violet/30 border border-vault-violet rounded-[2px]"
                  style={{ left: `${iqrLeft}%`, width: `${iqrWidth}%` }}
                />
                {/* Median line */}
                <div
                  className="absolute top-[1px] w-[2px] h-[14px] bg-vault-cyan"
                  style={{ left: `${medLeft}%` }}
                />
                {/* Outlier marker beyond the whisker fence */}
                {hasHighOutlier && (
                  <div
                    className="absolute top-1/2 w-[4px] h-[4px] -translate-y-1/2 rounded-full bg-vault-burgundy"
                    style={{ left: `calc(${toPct(whiskerMax)}% + 3px)` }}
                  />
                )}
              </div>
              <span className="text-vault-muted tabular-nums shrink-0 text-right font-mono" style={{ width: 44 }}>
                {median}
              </span>
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}
