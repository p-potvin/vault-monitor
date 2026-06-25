// ── ConcentrationBars — top-project work concentration ───────────────────────

import BarList from './BarList'
import type { BarItem } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface ConcentrationBarsProps {
  concentration?: BarItem[]
  t: I18nStrings
}

export default function ConcentrationBars({ concentration, t }: ConcentrationBarsProps) {
  if (!concentration || !concentration.length) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-vault-muted">{t.concentrationHint}</p>
      <BarList items={concentration.slice(0, 10)} color="cyan" />
    </div>
  )
}
