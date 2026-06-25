// ── BoxPlotList — box-and-whisker rows per month ─────────────────────────────

import type { MonthBox } from '../lib/types'

interface BoxPlotListProps {
  months: MonthBox[]
}

export default function BoxPlotList({ months }: BoxPlotListProps) {
  if (!months.length) return null

  const allMax = Math.max(...months.map(m => m.max), 1)

  return (
    <div className="flex flex-col gap-[8px]">
      {months.map(({ month, q1, median, q3, min, max }) => {
        const toP = (v: number) => `${Math.round((v / allMax) * 100)}%`
        const iqrLeft  = `${Math.round((q1 / allMax) * 100)}%`
        const iqrWidth = `${Math.round(((q3 - q1) / allMax) * 100)}%`
        const medLeft  = `${Math.round((median / allMax) * 100)}%`

        return (
          <div key={month} className="flex items-center gap-2 text-[12px] min-w-0">
            <span className="text-vault-muted shrink-0" style={{ width: 54 }}>{month}</span>
            {/* Plot area */}
            <div className="relative flex-1 h-[16px]">
              {/* Whisker line */}
              <div
                className="absolute top-1/2 h-[1px] bg-vault-muted -translate-y-1/2"
                style={{ left: toP(min), right: `${100 - Math.round((max / allMax) * 100)}%` }}
              />
              {/* IQR box */}
              <div
                className="absolute top-[3px] h-[10px] bg-vault-violet/30 border border-vault-violet rounded-[2px]"
                style={{ left: iqrLeft, width: iqrWidth }}
              />
              {/* Median line */}
              <div
                className="absolute top-[1px] w-[2px] h-[14px] bg-vault-cyan"
                style={{ left: medLeft }}
              />
            </div>
            <span className="text-vault-muted tabular-nums shrink-0 text-right font-mono" style={{ width: 44 }}>
              {median}
            </span>
          </div>
        )
      })}
    </div>
  )
}
