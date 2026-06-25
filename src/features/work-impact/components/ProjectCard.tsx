// ── ProjectCard — collapsible <details> project entry ────────────────────────

import KindChip from './KindChip'
import { fmtInt } from '../lib/utils'
import type { ProjectSummary } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface ProjectCardProps {
  project: ProjectSummary
  t: I18nStrings
}

export default function ProjectCard({ project, t }: ProjectCardProps) {
  const { name, entries, first, last, recentSummaries, kinds } = project

  return (
    <details className="group bg-vault-surface border border-vault-border rounded-[10px] overflow-hidden">
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none hover:bg-vault-raised transition-colors list-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[13px] font-bold text-vault-fg truncate">{name}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[12px] text-vault-muted tabular-nums">{fmtInt(entries)} {t.units.events}</span>
          <span className="text-vault-muted text-[11px] font-mono">
            {first} → {last}
          </span>
          {/* Kind chips */}
          <div className="flex gap-1">
            {Object.entries(kinds).slice(0, 3).map(([k]) => (
              <KindChip key={k} kind={k} t={t} />
            ))}
          </div>
          <span className="text-vault-muted group-open:rotate-90 transition-transform inline-block">›</span>
        </div>
      </summary>

      {recentSummaries && recentSummaries.length > 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-vault-border flex flex-col gap-1">
          {recentSummaries.map((s, i) => (
            <p key={i} className="text-[12px] text-vault-slate leading-snug line-clamp-2">
              {s}
            </p>
          ))}
        </div>
      )}
    </details>
  )
}
