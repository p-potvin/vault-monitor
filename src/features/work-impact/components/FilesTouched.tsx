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
      <KpiCard label="Mean"   value={fmt1(filesTouched.mean)}   />
      <KpiCard label="Median" value={fmt1(filesTouched.median)} />
      <KpiCard label="p90"    value={fmt1(filesTouched.p90)}    variant="accent" />
      <KpiCard label="Max"    value={String(filesTouched.max)}  />
    </div>
  )
}
