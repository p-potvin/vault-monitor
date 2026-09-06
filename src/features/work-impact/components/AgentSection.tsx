// ── AgentSection — AI agent KPIs + 3-column expandable bar lists ───────────────

import { useState } from 'react'
import KpiCard from './KpiCard'
import BarList from './BarList'
import LedDot from './LedDot'
import { fmtInt, humanizeString } from '../lib/utils'
import type { AgentData } from '../lib/types'
import type { I18nStrings } from '../lib/i18n'

interface AgentSectionProps {
  agent: AgentData | undefined
  t: I18nStrings
}

interface AgentColumnProps {
  title: string
  items: { label: string; count: number }[]
  color: 'cyan' | 'violet' | 'gold'
  ledVariant: 'cyan' | 'violet' | 'gold'
}

function AgentColumn({ title, items, color, ledVariant }: AgentColumnProps) {
  const [expanded, setExpanded] = useState(false)
  const displayedItems = expanded ? items : items.slice(0, 10)
  const hasMore = items.length > 10

  return (
    <div className="bg-vault-surface2/60 border border-vault-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LedDot variant={ledVariant} size={7} />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{title}</h3>
        </div>
        <span className="text-[10px] font-mono text-vault-dim">
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="flex-1">
        <BarList items={displayedItems} color={color} />
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-left text-[11px] font-semibold text-vault-gold hover:text-vault-fg transition-colors py-1 cursor-pointer flex items-center gap-1.5 select-none"
        >
          <span>{expanded ? 'Show less' : `See more (${items.length - 10} more)...`}</span>
          <span className="text-[9px]">{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>
  )
}

function groupItems(items: { label: string; count: number }[] = []) {
  const map = new Map<string, number>()
  for (const item of items) {
    const raw = item.label || ''
    // If it contains slashes or spaces, preserve casing; otherwise humanize
    const label = raw.includes('/') || raw.includes(' ') ? raw : humanizeString(raw)
    map.set(label, (map.get(label) ?? 0) + item.count)
  }
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({ label, count }))
}

export default function AgentSection({ agent, t }: AgentSectionProps) {
  if (!agent || !agent.totalEvents) {
    return (
      <p className="text-[12px] italic text-vault-muted">{t.noMcpData}</p>
    )
  }

  const actors = groupItems(agent.topActors)
  const mcps = groupItems(agent.topMcp)
  const tools = groupItems(agent.topTools)

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t.agentEventsLabel} value={fmtInt(agent.totalEvents)}    variant="accent" />
        <KpiCard label={t.distinctActors}   value={fmtInt(agent.distinctActors)} />
        <KpiCard label={t.modelsUsed}       value={fmtInt(agent.modelsUsed)}     />
        <KpiCard label={t.toolsUsed}        value={fmtInt(agent.toolsUsed)}      />
      </div>

      {/* 3 Columns separated like Monthly Activity, Activity by Kind, Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actors.length > 0 && (
          <AgentColumn
            title={t.distinctActors}
            items={actors}
            color="cyan"
            ledVariant="cyan"
          />
        )}

        {mcps.length > 0 && (
          <AgentColumn
            title={t.modelsUsed}
            items={mcps}
            color="violet"
            ledVariant="violet"
          />
        )}

        {tools.length > 0 && (
          <AgentColumn
            title={t.toolsUsed}
            items={tools}
            color="gold"
            ledVariant="gold"
          />
        )}
      </div>
    </div>
  )
}
