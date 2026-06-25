// ── TechVolumeTable — line-change breakdown by scope ─────────────────────────

import { fmtInt, fmtSigned } from '../lib/utils'
import type { TechVolumeData } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface TechVolumeTableProps {
  techVolume?: TechVolumeData
  t: I18nStrings
}

export default function TechVolumeTable({ techVolume, t }: TechVolumeTableProps) {
  if (!techVolume) {
    return (
      <p className="text-[12px] text-vault-muted">{t.lineStatsUnavailable}</p>
    )
  }

  const rows = [
    { key: 'raw',      label: t.labelRaw,      row: techVolume.raw      },
    { key: 'clean',    label: t.labelClean,    row: techVolume.clean    },
    { key: 'excluded', label: t.labelExcluded, row: techVolume.excluded },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-vault-border">
            <th className="text-left font-bold uppercase tracking-[0.06em] text-vault-muted pb-2 pr-4 w-[90px]">
              {t.statType}
            </th>
            <th className="text-right font-bold uppercase tracking-[0.06em] text-vault-muted pb-2 px-3">
              {t.statAdds}
            </th>
            <th className="text-right font-bold uppercase tracking-[0.06em] text-vault-muted pb-2 px-3">
              {t.statDels}
            </th>
            <th className="text-right font-bold uppercase tracking-[0.06em] text-vault-muted pb-2 px-3">
              {t.statFiles}
            </th>
            <th className="text-right font-bold uppercase tracking-[0.06em] text-vault-muted pb-2 px-3">
              {t.statNet}
            </th>
            <th className="text-right font-bold uppercase tracking-[0.06em] text-vault-muted pb-2 pl-3">
              {t.statChurn}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, row }) => (
            <tr key={key} className="border-b border-vault-border last:border-0">
              <td className="py-[6px] pr-4 font-mono text-vault-muted">{label}</td>
              <td className="py-[6px] px-3 text-right text-vault-green font-mono tabular-nums">
                +{fmtInt(row.insertions)}
              </td>
              <td className="py-[6px] px-3 text-right text-vault-burgundy font-mono tabular-nums">
                -{fmtInt(row.deletions)}
              </td>
              <td className="py-[6px] px-3 text-right text-vault-slate font-mono tabular-nums">
                {fmtInt(row.files)}
              </td>
              <td className="py-[6px] px-3 text-right text-vault-fg font-mono tabular-nums">
                {fmtSigned(row.net)}
              </td>
              <td className="py-[6px] pl-3 text-right text-vault-gold font-mono tabular-nums">
                {fmtInt(row.churn)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
