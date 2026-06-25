// ── LedDot — animated LED status indicator ───────────────────────────────────

export type LedVariant = 'green' | 'cyan' | 'violet' | 'gold' | 'alert' | 'off'

interface LedDotProps {
  variant?: LedVariant
  size?: number
  className?: string
}

const VARIANT_STYLES: Record<LedVariant, string> = {
  green:  'bg-vault-green  shadow-[0_0_6px_var(--color-vault-green)]  [animation:led-pulse-green_2s_ease-in-out_infinite]',
  cyan:   'bg-vault-cyan   shadow-[0_0_6px_var(--color-vault-cyan)]   [animation:led-pulse-cyan_2s_ease-in-out_infinite]',
  violet: 'bg-vault-violet shadow-[0_0_6px_var(--color-vault-violet)] [animation:led-pulse-violet_2.4s_ease-in-out_infinite]',
  gold:   'bg-vault-gold   shadow-[0_0_6px_var(--color-vault-gold)]   [animation:led-pulse-gold_2.2s_ease-in-out_infinite]',
  alert:  'bg-vault-burgundy shadow-[0_0_6px_var(--color-vault-burgundy)] [animation:led-pulse-alert_1.2s_ease-in-out_infinite]',
  off:    'bg-vault-muted',
}

export default function LedDot({ variant = 'green', size = 8, className = '' }: LedDotProps) {
  return (
    <span
      className={`inline-block rounded-full ${VARIANT_STYLES[variant]} ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden="true"
    />
  )
}
