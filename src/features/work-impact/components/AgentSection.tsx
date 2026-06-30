// ── AgentSection — AI agent KPIs + bar lists ─────────────────────────────────

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

export default function AgentSection({ agent, t }: AgentSectionProps) {
  if (!agent || !agent.totalEvents) {
    return (
      <p className="text-[12px] italic text-vault-muted">{t.noMcpData}</p>
    )
  }

  const actors = agent.topActors?.map(a => ({ ...a, label: humanizeString(a.label) })) || [];
  const mcps = agent.topMcp?.map(a => ({ ...a, label: humanizeString(a.label) })) || [];
  const tools = agent.topTools?.map(a => ({ ...a, label: humanizeString(a.label) })) || [];

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t.agentEventsLabel} value={fmtInt(agent.totalEvents)}    variant="accent" />
        <KpiCard label={t.distinctActors}   value={fmtInt(agent.distinctActors)} />
        <KpiCard label={t.modelsUsed}       value={fmtInt(agent.modelsUsed)}     />
        <KpiCard label={t.toolsUsed}        value={fmtInt(agent.toolsUsed)}      />
      </div>

      {/* Bar lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {actors.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LedDot variant="cyan" size={7} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{t.distinctActors}</h3>
            </div>
            <BarList items={actors} color="cyan" />
          </div>
        )}

        {mcps.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LedDot variant="violet" size={7} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{t.modelsUsed}</h3>
            </div>
            <BarList items={mcps} color="violet" />
          </div>
        )}

        {tools.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LedDot variant="gold" size={7} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{t.toolsUsed}</h3>
            </div>
            <BarList items={tools} color="gold" />
          </div>
        )}
      </div>
    </div>
  )
}
