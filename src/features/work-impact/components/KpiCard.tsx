// ── KpiCard — single-stat display card ───────────────────────────────────────

type KpiVariant = 'default' | 'accent' | 'green' | 'red'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  variant?: KpiVariant
}

const VALUE_CLASSES: Record<KpiVariant, string> = {
  default: 'text-vault-fg',
  accent:  'text-vault-gold',
  green:   'text-vault-green',
  red:     'text-vault-burgundy',
}

export default function KpiCard({ label, value, sub, variant = 'default' }: KpiCardProps) {
  return (
    <div className="bg-vault-surface border border-vault-border rounded-[10px] p-[14px] flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">
        {label}
      </span>
      <span className={`text-[28px] font-bold leading-none tabular-nums ${VALUE_CLASSES[variant]}`}>
        {value}
      </span>
      {sub && (
        <span className="text-[12px] text-vault-muted mt-0.5">{sub}</span>
      )}
    </div>
  )
}
