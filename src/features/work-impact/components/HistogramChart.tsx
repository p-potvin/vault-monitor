// ── HistogramChart — commit-size histogram rows ───────────────────────────────

import { fmtInt } from '../lib/utils'

interface HistBucket {
  label: string
  count: number
  start: number
  end: number
}

interface HistogramChartProps {
  buckets: HistBucket[]
}

export default function HistogramChart({ buckets }: HistogramChartProps) {
  if (!buckets.length) return null
  const peak = Math.max(...buckets.map(b => b.count), 1)

  return (
    <div className="flex flex-col gap-[6px]">
      {buckets.map(({ label, count }) => {
        const pct = Math.round((count / peak) * 100)
        return (
          <div key={label} className="flex items-center gap-2 text-[12px] min-w-0">
            <span className="text-vault-muted shrink-0 text-right" style={{ width: 80 }}>
              {label}
            </span>
            <div className="flex-1 bg-vault-raised rounded-full h-[10px] overflow-hidden">
              <div
                className="h-full bg-vault-violet rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-vault-muted tabular-nums shrink-0" style={{ width: 52, textAlign: 'right' }}>
              {fmtInt(count)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
