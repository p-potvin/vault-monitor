// ── MicroBarChart — vertical micro bars, 56px tall ───────────────────────────

import { fmtInt } from '../lib/utils'

interface MicroBarItem {
  label: string
  value: number
}

interface MicroBarChartProps {
  items: MicroBarItem[]
  color?: 'gold' | 'cyan' | 'green' | 'violet'
}

const BAR_CLASSES = {
  gold:   'bg-vault-gold',
  cyan:   'bg-vault-cyan',
  green:  'bg-vault-green',
  violet: 'bg-vault-violet',
}

export default function MicroBarChart({ items, color = 'cyan' }: MicroBarChartProps) {
  if (!items.length) return null
  const peak = Math.max(...items.map(i => i.value), 1)
  const fill = BAR_CLASSES[color]

  return (
    <div className="flex items-end gap-[4px] overflow-x-auto">
      {items.map(({ label, value }) => {
        const pct = Math.max((value / peak) * 100, value > 0 ? 3 : 0)
        return (
          <div key={label} className="flex flex-col items-center gap-[3px] shrink-0">
            <div className="flex items-end" style={{ height: 56 }}>
              <Tooltip label={label} value={value}>
                <div
                  className={`${fill} rounded-t-[2px] w-[18px] min-h-[2px] transition-all`}
                  style={{ height: `${pct}%` }}
                />
              </Tooltip>
            </div>
            <span className="text-[9px] font-mono text-vault-muted">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* local title tooltip — simpler than importing full Tooltip component tree */
function Tooltip({ label, value, children }: { label: string; value: number; children: React.ReactNode }) {
  return (
    <div title={`${label}: ${fmtInt(value)}`} className="flex items-end h-full">
      {children}
    </div>
  )
}
