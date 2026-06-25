// ── AgentSection — AI agent KPIs + bar lists ─────────────────────────────────

import KpiCard from './KpiCard'
import BarList from './BarList'
import LedDot from './LedDot'
import { fmtInt } from '../lib/utils'
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
        {agent.topActors?.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LedDot variant="cyan" size={7} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{t.distinctActors}</h3>
            </div>
            <BarList items={agent.topActors} color="cyan" />
          </div>
        )}

        {agent.topMcp?.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LedDot variant="violet" size={7} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{t.modelsUsed}</h3>
            </div>
            <BarList items={agent.topMcp} color="violet" />
          </div>
        )}

        {agent.topTools?.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LedDot variant="gold" size={7} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-vault-muted">{t.toolsUsed}</h3>
            </div>
            <BarList items={agent.topTools} color="gold" />
          </div>
        )}
      </div>
    </div>
  )
}
