// ── BarList — horizontal bar-list with label / track / fill / count ──────────

import { fmtInt } from '../lib/utils'

type BarColor = 'gold' | 'cyan' | 'green' | 'violet' | 'burgundy'

interface BarListProps {
  items: { label: string; count: number }[]
  max?: number
  color?: BarColor
  logScale?: boolean
  unit?: string
  alternateColors?: boolean
}

const FILL_CLASSES: Record<BarColor, string> = {
  gold:     'bg-vault-gold',
  cyan:     'bg-vault-cyan',
  green:    'bg-vault-green',
  violet:   'bg-vault-violet',
  burgundy: 'bg-vault-burgundy',
}

const CYCLE_COLORS: BarColor[] = ['cyan', 'violet', 'green', 'gold', 'burgundy']

export default function BarList({ items, max, color = 'gold', logScale = false, unit, alternateColors = false }: BarListProps) {
  const peak = max ?? Math.max(...items.map(i => i.count), 1)

  if (!items.length) return null

  return (
    <div className="flex flex-col gap-[5px] w-full">
      {items.map(({ label, count }, idx) => {
        let pct = 0
        if (peak > 0) {
          if (logScale) {
            pct = Math.round((Math.log(count + 1) / Math.log(peak + 1)) * 100)
          } else {
            pct = Math.round((count / peak) * 100)
          }
        }
            const fill = alternateColors
              ? FILL_CLASSES[CYCLE_COLORS[idx % CYCLE_COLORS.length]]
              : FILL_CLASSES[color]

            return (
              <div key={`${label}-${idx}`} className="flex items-center gap-2 min-w-0 text-[13px]">
                <span
                  className="text-vault-slate shrink-0 text-right overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ width: 195 }}
                  title={label}
                >
                  {label}
                </span>
                <div className="flex-1 min-w-0 bg-vault-raised rounded-full h-[8px] overflow-hidden">
                  <div
                    className={`h-full ${fill} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-vault-muted tabular-nums shrink-0" style={{ width: 68, textAlign: 'right' }}>
                  {fmtInt(count)}{unit ? ` ${unit}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
