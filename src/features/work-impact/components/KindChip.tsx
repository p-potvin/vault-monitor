// ── KindChip — coloured kind badge ───────────────────────────────────────────

import type { I18nStrings } from '../lib/i18n'

interface KindChipProps {
  kind: string
  t: I18nStrings
}

const KIND_CLASSES: Record<string, string> = {
  'code-change':  'bg-vault-green/10   text-vault-green   border border-vault-green/25',
  'plan':         'bg-vault-cyan/10    text-vault-cyan    border border-vault-cyan/25',
  'verification': 'bg-vault-gold/10    text-vault-gold    border border-vault-gold/25',
  'commands':     'bg-vault-slate/10   text-vault-slate   border border-vault-slate/25',
  'handoff':      'bg-vault-burgundy/10 text-vault-burgundy border border-vault-burgundy/25',
  'general':      'bg-vault-muted/10   text-vault-muted   border border-vault-muted/25',
}

export default function KindChip({ kind, t }: KindChipProps) {
  const cls = KIND_CLASSES[kind] ?? KIND_CLASSES['general']
  const label = t.kindLabels[kind] ?? kind
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
