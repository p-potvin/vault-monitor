import React from 'react';
import type { TimelineDay } from '../types';

interface ProjectRaceChartProps {
  currentDay: TimelineDay;
  lang: 'en' | 'qc';
}

export const ProjectRaceChart: React.FC<ProjectRaceChartProps> = ({ currentDay, lang }) => {
  const topProjects = currentDay.topCumProjects || [];
  const maxCount = Math.max(1, ...(topProjects.map((p) => p.count) || [1]));

  const kinds = Object.entries(currentDay.kinds || {}).sort(([, a], [, b]) => b - a);
  const models = Object.entries(currentDay.models || {}).sort(([, a], [, b]) => b - a);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Cumulative Project Dominance Bar Race */}
      <div className="lg:col-span-7 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <span>{lang === 'qc' ? 'ÉVOLUTION DES PROJETS (TOP CUMULATIF)' : 'PROJECT EVOLUTION (CUMULATIVE LEADERS)'}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--gold)]">
            {lang === 'qc' ? 'Au' : 'As of'} {currentDay.date}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {topProjects.length === 0 ? (
            <div className="text-xs text-[var(--muted)] italic py-4 text-center">
              {lang === 'qc' ? 'Aucune donnée de projet à cette date' : 'No project data at this date'}
            </div>
          ) : (
            topProjects.map((p, idx) => {
              const widthPct = Math.max(5, Math.round((p.count / maxCount) * 100));
              const isTodayActive = currentDay.projects.includes(p.name);
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium truncate flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--muted)] w-4 font-bold">#{idx + 1}</span>
                      <span className={isTodayActive ? 'text-[var(--gold)] font-bold' : 'text-[var(--fg)]'}>
                        {p.name}
                      </span>
                      {isTodayActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-[var(--gold-dim)] text-[var(--gold)] font-bold">
                          {lang === 'qc' ? 'actif aujourd’hui' : 'active today'}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[var(--muted)] text-[11px] tabular-nums">
                      {p.count} {lang === 'qc' ? 'entrées' : 'entries'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--violet)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Activity Breakdown this day: Kinds & Models */}
      <div className="lg:col-span-5 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-4">
        {/* Work Kinds on this day */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
            {lang === 'qc' ? 'NATURE DU TRAVAIL CE JOUR' : 'WORK TYPE BREAKDOWN TODAY'}
          </div>
          {kinds.length === 0 ? (
            <div className="text-xs text-[var(--muted)] italic py-2">
              {lang === 'qc' ? 'Aucun type de travail recensé' : 'No work logged'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {kinds.map(([k, count]) => (
                <div
                  key={k}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-xs font-mono flex items-center gap-1.5"
                >
                  <span className="text-[var(--fg)]">{k}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[var(--chip)] text-[var(--gold)] font-bold text-[10px]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Models active on this day */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center justify-between">
            <span>{lang === 'qc' ? 'MODÈLES IA ACTIFS' : 'AI MODELS IN USE'}</span>
            <span className="text-[10px] text-[var(--violet)] font-mono font-bold">
              {models.length} {lang === 'qc' ? 'collaborateur(s)' : 'agent(s)'}
            </span>
          </div>
          {models.length === 0 ? (
            <div className="text-xs text-[var(--muted)] italic py-2">
              {lang === 'qc' ? 'Télémétrie de modèle non-enregistrée' : 'No explicit model tag today'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {models.map(([m, c]) => (
                <div
                  key={m}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)] shrink-0" />
                    <span className="truncate text-[var(--fg)]">{m}</span>
                  </div>
                  <span className="text-[var(--violet)] font-bold shrink-0">{c} ev</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
