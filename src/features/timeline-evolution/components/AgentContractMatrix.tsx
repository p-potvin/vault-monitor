import React, { useState } from 'react';
import type { AgentModelSummary, ContractPrinciple, SoloDevComparison } from '../types';

interface AgentContractMatrixProps {
  models: AgentModelSummary[];
  principles: ContractPrinciple[];
  soloComparison: SoloDevComparison;
  lang: 'en' | 'qc';
}

export const AgentContractMatrix: React.FC<AgentContractMatrixProps> = ({
  models,
  principles,
  soloComparison,
  lang,
}) => {
  // Customizable budget / economics simulator state (Initialized from actual 7-month CAD data)
  const [modelBudget, setModelBudget] = useState<number>(() => soloComparison.actualSpendCAD?.modelSubscriptions ?? 2847); // CAD (4 subs x 7 mo + AI Studio)
  const [infraBudget, setInfraBudget] = useState<number>(() => soloComparison.actualSpendCAD?.infrastructure ?? 335);       // CAD (OVH + Greencloud + Domains + GPUs)
  const [subBudget, setSubBudget] = useState<number>(() => soloComparison.actualSpendCAD?.toolsAndUtilities ?? 1040);       // CAD (Debrid/Usenet + Huggingface + GitHub + Essential utilities)
  const [engineerRate, setEngineerRate] = useState<number>(95); // CAD/hour standard senior dev benchmark

  const totalSpend = modelBudget + infraBudget + subBudget;
  const hoursSaved = soloComparison.estimatedHoursSaved;
  const equivalentMarketValue = hoursSaved * engineerRate;
  const roiMultiplier = Math.round(equivalentMarketValue / Math.max(1, totalSpend));

  return (
    <div className="space-y-6 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Title & Introduction */}
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
          <h2 className="text-base font-extrabold uppercase tracking-wider text-[var(--fg)] m-0">
            {lang === 'qc'
              ? "PARADIGME DE COLLABORATION & CONTRATS DE TRAVAIL"
              : "HUMAN-AGENT COLLABORATION & WORK CONTRACT MATRIX"}
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-glow)]">
            Architect + Agents
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1.5 max-w-3xl leading-relaxed">
          {lang === 'qc'
            ? "Depuis le 11 mars 2026, l'opérateur humain a transcendé le modèle du développeur solitaire. Grâce aux contrats de travail ('work contracts') stricts, l'humain agit comme directeur technique et garant architectural, tandis que les agents IA exécutent la mise en œuvre, les vérifications et les déploiements continus sur plus de 40 dépôts."
            : "Since March 11, 2026, the human operator has operated as an executive systems architect. Through formal work contracts, the human dictates high-level direction and quality gates, while autonomous agents execute implementation, test coverage, and continuous deployments across 40+ repositories."}
        </p>
      </div>

      {/* 1. The 4 Foundation Contract Principles */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-2">
          <span>{lang === 'qc' ? '1. LES 4 PILIERS DU CONTRAT DE TRAVAIL' : '1. THE 4 FOUNDATION CONTRACT DIRECTIVES'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {principles.map((p, idx) => (
            <div
              key={p.title}
              className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--gold-dim)] border border-[var(--gold-glow)] text-[var(--gold)] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-[var(--fg)]">{p.title}</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed m-0">{p.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Agent Roster & Contract Roles */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--violet)] flex items-center gap-2">
          <span>{lang === 'qc' ? '2. RÉPARTITION DES RÔLES PAR MODÈLE IA' : '2. SPECIALIZED AGENT MODEL ROSTER'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((m) => (
            <div
              key={m.name}
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[var(--gold)]">{m.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--chip)] text-[var(--muted)]">
                  ~{m.events} ev
                </span>
              </div>
              <div className="text-[11px] font-semibold text-[var(--fg)]">{m.role}</div>
              <div className="text-[10px] text-[var(--muted)] leading-tight">{m.specialty}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Comparative Benchmark: Solo Developer vs. VaultWares Paradigm */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg)] flex items-center gap-2">
            <span>{lang === 'qc' ? '3. BENCHMARK : DÉVELOPPEUR SOLITAIRE VS COLLABORATION AGENTS' : '3. BENCHMARK: SOLO DEVELOPER VS. AGENT COLLABORATION'}</span>
          </h3>
          <span className="text-xs font-mono font-bold text-[var(--gold)]">
            Productivity Acceleration: {soloComparison.productivityMultiple}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface2)] text-[var(--muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="p-3">{lang === 'qc' ? 'Dimension' : 'Dimension'}</th>
                <th className="p-3">{lang === 'qc' ? 'Développeur Solo Typique' : 'Standard Solo Developer'}</th>
                <th className="p-3 text-[var(--gold)]">{lang === 'qc' ? 'Écosystème VaultWares' : 'VaultWares Agentic Engine'}</th>
                <th className="p-3 text-right">{lang === 'qc' ? 'Multiplicateur' : 'Multiple'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {soloComparison.metric.map((row) => (
                <tr key={row.name} className="hover:bg-[var(--surface2)] transition">
                  <td className="p-3 font-semibold text-[var(--fg)]">{row.name}</td>
                  <td className="p-3 text-[var(--muted)]">{row.soloDev}</td>
                  <td className="p-3 font-mono text-[var(--gold)] font-medium">{row.vaultwares}</td>
                  <td className="p-3 text-right font-mono font-bold text-[var(--green)]">{row.factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Financial & Labor Resource Economics Engine (Customizable) */}
      <div className="p-4 rounded-xl border border-[var(--gold-glow)] bg-[var(--surface2)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] m-0">
              {lang === 'qc' ? 'ÉCONOMIE DU PROJET & RETOUR SUR INVESTISSEMENT' : 'RESOURCE ECONOMICS & ESTIMATED ROI'}
            </h3>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">
              {lang === 'qc'
                ? 'Ajustez les curseurs ci-dessous avec vos dépenses réelles pour recalculer en temps réel.'
                : 'Adjust the sliders below with your actual budget and rates to recalculate in real time.'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold font-mono text-[var(--green)]">
              {roiMultiplier}x ROI
            </span>
          </div>
        </div>

        {/* Sliders for customizable budget parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted)] font-medium">Model Tokens ($ CAD)</span>
              <span className="font-mono font-bold text-[var(--gold)]">${modelBudget}</span>
            </div>
            <input
              type="range"
              min={200}
              max={10000}
              step={50}
              value={modelBudget}
              onChange={(e) => setModelBudget(Number(e.target.value))}
              className="w-full accent-[var(--gold)] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted)] font-medium">Infra / VPS ($ CAD)</span>
              <span className="font-mono font-bold text-[var(--gold)]">${infraBudget}</span>
            </div>
            <input
              type="range"
              min={50}
              max={5000}
              step={25}
              value={infraBudget}
              onChange={(e) => setInfraBudget(Number(e.target.value))}
              className="w-full accent-[var(--gold)] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted)] font-medium">Tools & Utilities ($ CAD)</span>
              <span className="font-mono font-bold text-[var(--gold)]">${subBudget}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3000}
              step={25}
              value={subBudget}
              onChange={(e) => setSubBudget(Number(e.target.value))}
              className="w-full accent-[var(--gold)] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted)] font-medium">Senior Dev Benchmark ($ CAD/h)</span>
              <span className="font-mono font-bold text-[var(--gold)]">${engineerRate}/h</span>
            </div>
            <input
              type="range"
              min={40}
              max={250}
              step={5}
              value={engineerRate}
              onChange={(e) => setEngineerRate(Number(e.target.value))}
              className="w-full accent-[var(--gold)] cursor-pointer"
            />
          </div>
        </div>

        {/* Economic Outcome Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Dépenses Totales' : 'Total Direct Cost'}</div>
            <div className="text-xl font-bold font-mono text-[var(--fg)] mt-1">${totalSpend.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">Tokens + VPS + Tools</div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Heures de Travail Sauvegardées' : 'Labor Hours Saved'}</div>
            <div className="text-xl font-bold font-mono text-[var(--violet)] mt-1">~{hoursSaved.toLocaleString()}h</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">{soloComparison.equivalentTeamSize}</div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Valeur Ingénierie Équivalente' : 'Equivalent Engineering Value'}</div>
            <div className="text-xl font-bold font-mono text-[var(--green)] mt-1">${equivalentMarketValue.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">Market contract rate</div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Économie Nette Estimée' : 'Net Value Creation'}</div>
            <div className="text-xl font-bold font-mono text-[var(--gold)] mt-1">${(equivalentMarketValue - totalSpend).toLocaleString()}</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">Direct value capture</div>
          </div>
        </div>
      </div>
    </div>
  );
};
