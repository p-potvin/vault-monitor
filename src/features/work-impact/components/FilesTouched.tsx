// ── FilesTouched — files-per-commit stat cards ────────────────────────────────

import KpiCard from './KpiCard'
import { fmt1 } from '../lib/utils'
import type { I18nStrings } from '../lib/i18n'

interface FilesTouchedProps {
  filesTouched?: { mean: number; median: number; p90: number; max: number }
  t: I18nStrings
}

export default function FilesTouched({ filesTouched, t }: FilesTouchedProps) {
  if (!filesTouched) {
    return <p className="text-[12px] text-vault-muted">{t.fileDataUnavailable}</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard label={t.commitStatMean}   value={fmt1(filesTouched.mean)}   />
      <KpiCard label={t.commitStatMedian} value={fmt1(filesTouched.median)} />
      <KpiCard label={t.commitStatP90}    value={fmt1(filesTouched.p90)}    variant="accent" />
      <KpiCard label={t.commitStatMax}    value={String(filesTouched.max)}  />
    </div>
  )
}
