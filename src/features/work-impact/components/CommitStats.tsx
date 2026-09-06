import { useState } from 'react'
import KpiCard from './KpiCard'
import HistogramChart from './HistogramChart'
import BoxPlotList from './BoxPlotList'
import type { CommitStatRow, CommitBucket, MonthBox, CommitOutlier } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'
import { fmt1, fmtInt } from '../lib/utils'

interface CommitStatsProps {
  commitStats?: CommitStatRow
  commitBuckets?: CommitBucket[]
  monthBoxes?: MonthBox[]
  commitOutliers?: (CommitOutlier | string)[]
  t: I18nStrings
}

export default function CommitStats({
  commitStats,
  commitBuckets,
  monthBoxes,
  commitOutliers,
  t,
}: CommitStatsProps) {
  const [outliersExpanded, setOutliersExpanded] = useState(false)

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
      {(() => {
        const filteredOutliers = (commitOutliers || []).filter((item) => {
          if (typeof item === 'string') return true;
          const proj = String(item.project || '').toLowerCase();
          const msg = String(item.message || '').toLowerCase();
          if (
            proj.includes('agent-ledger') ||
            msg.includes('json spool') ||
            msg.includes('batch of json') ||
            msg.includes('archive agent-ledger') ||
            msg.includes('agent-ledger events')
          ) {
            return false;
          }
          return (item.cleanChurnLines || 0) >= 40000;
        });

        if (filteredOutliers.length === 0) return null;

        const visibleOutliers = outliersExpanded ? filteredOutliers : filteredOutliers.slice(0, 8);

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
                {t.commitOutliersTitle} (&ge; 40,000 lines)
              </h3>
              <span className="text-[11px] font-mono text-vault-dim">
                {filteredOutliers.length} {filteredOutliers.length === 1 ? 'commit' : 'commits'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {visibleOutliers.map((item, i) => {
              if (typeof item === 'string') {
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vault-surface2 border border-vault-border text-xs font-mono text-vault-slate"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-vault-gold" />
                    <span className="text-vault-gold font-bold">{item}</span>
                  </div>
                )
              }
              const cleanLines = item.cleanChurnLines || 0
              const formattedLines = cleanLines >= 1000
                ? `${fmtInt(cleanLines)} lines`
                : `${cleanLines} lines`

              return (
                <div
                  key={item.sha || i}
                  className="flex flex-col gap-1.5 p-3 rounded-lg bg-vault-surface2 border border-vault-border/80 hover:border-vault-gold/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-vault-gold/15 text-vault-gold border border-vault-gold/30 shrink-0">
                        {item.sha}
                      </span>
                      {item.project && (
                        <span
                          className="text-[11px] font-medium text-vault-fg truncate max-w-[180px]"
                          title={item.project}
                        >
                          {item.project.replace(/^p-potvin\//, '')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.day && (
                        <span className="text-[10px] font-mono text-vault-muted">
                          {item.day}
                        </span>
                      )}
                      <span className="text-[11px] font-mono font-bold text-vault-amber bg-vault-amber/10 px-1.5 py-0.5 rounded border border-vault-amber/20">
                        +{formattedLines}
                      </span>
                    </div>
                  </div>
                  {item.message && (
                    <p
                      className="text-[11px] text-vault-muted line-clamp-1 leading-snug"
                      title={item.message}
                    >
                      {item.message.split('\n')[0]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {filteredOutliers.length > 8 && (
            <button
              type="button"
              onClick={() => setOutliersExpanded(!outliersExpanded)}
              className="mt-1 text-left text-[11px] font-semibold text-vault-gold hover:text-vault-fg transition-colors py-1 cursor-pointer flex items-center gap-1.5 select-none"
            >
              <span>{outliersExpanded ? 'Show less' : `See more (${filteredOutliers.length - 8} more)...`}</span>
              <span className="text-[10px]">{outliersExpanded ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
        )
      })()}
    </div>
  )
}
