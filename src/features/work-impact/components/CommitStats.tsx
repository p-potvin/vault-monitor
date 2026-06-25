// ── CommitStats — commit size stats grid + histogram + boxplot ────────────────

import KpiCard from './KpiCard'
import HistogramChart from './HistogramChart'
import BoxPlotList from './BoxPlotList'
import { fmt1 } from '../lib/utils'
import type { CommitStatRow, CommitBucket, MonthBox } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface CommitStatsProps {
  commitStats?: CommitStatRow
  commitBuckets?: CommitBucket[]
  monthBoxes?: MonthBox[]
  commitOutliers?: string[]
  t: I18nStrings
}

export default function CommitStats({
  commitStats,
  commitBuckets,
  monthBoxes,
  commitOutliers,
  t,
}: CommitStatsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      {commitStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label={t.commitStatMean}    value={fmt1(commitStats.mean)}       />
          <KpiCard label={t.commitStatMedian}  value={String(commitStats.median)}   />
          <KpiCard label={t.commitStatMode}    value={String(commitStats.mode)}     />
          <KpiCard label={t.commitStatSamples} value={String(commitStats.samples)} variant="accent" />
        </div>
      )}

      {/* Histogram */}
      {commitBuckets && commitBuckets.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            {t.commitHistTitle}
          </h3>
          <HistogramChart buckets={commitBuckets.map((b, i) => ({
            label: b.edge,
            count: b.count,
            start: i,
            end:   i + 1,
          }))} />
        </div>
      )}

      {/* Monthly boxplot */}
      {monthBoxes && monthBoxes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            {t.commitBoxTitle}
          </h3>
          <BoxPlotList months={monthBoxes} />
        </div>
      )}

      {/* Outliers */}
      {commitOutliers && commitOutliers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
            {t.commitOutliersTitle}
          </h3>
          <div className="flex flex-col gap-1">
            {commitOutliers.map((s, i) => (
              <p key={i} className="text-[12px] font-mono text-vault-slate leading-snug">{s}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
