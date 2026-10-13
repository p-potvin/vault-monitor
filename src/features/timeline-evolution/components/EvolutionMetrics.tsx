import React from 'react';
import type { TimelineDay } from '../types';

interface EvolutionMetricsProps {
  currentDay: TimelineDay;
  totalDays: number;
  lang: 'en' | 'qc';
}

const fmtInt = (n: number | undefined) =>
  new Intl.NumberFormat().format(Math.trunc(Number.isFinite(n || 0) ? n || 0 : 0));

export const EvolutionMetrics: React.FC<EvolutionMetricsProps> = ({ currentDay, lang }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Cumulative Events */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
          <span>{lang === 'qc' ? 'ÉVÉNEMENTS CUMULÉS' : 'CUMULATIVE EVENTS'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
        </div>
        <div className="my-1 text-2xl lg:text-3xl font-extrabold font-mono text-[var(--gold)] tracking-tight">
          {fmtInt(currentDay.cumEvents)}
        </div>
        <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-mono">
          <span className="text-[var(--gold)] font-bold">+{currentDay.events}</span>
          <span>{lang === 'qc' ? 'ce jour' : 'this day'}</span>
        </div>
      </div>

      {/* 2. Cumulative Active Projects */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--violet)]">
          <span>{lang === 'qc' ? 'PROJETS TOUCHÉS' : 'PROJECTS TOUCHED'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)]" />
        </div>
        <div className="my-1 text-2xl lg:text-3xl font-extrabold font-mono text-[var(--violet)] tracking-tight">
          {currentDay.cumProjects}
        </div>
        <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-mono">
          <span className="text-[var(--violet)] font-bold">{currentDay.projectCount}</span>
          <span>{lang === 'qc' ? 'actifs ce jour' : 'active today'}</span>
        </div>
      </div>

      {/* 3. Cumulative Active Days */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--green)]">
          <span>{lang === 'qc' ? 'JOURS ACTIFS' : 'ACTIVE DAYS'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
        </div>
        <div className="my-1 text-2xl lg:text-3xl font-extrabold font-mono text-[var(--green)] tracking-tight">
          {currentDay.activeDays}
        </div>
        <div className="text-[11px] text-[var(--muted)] font-mono">
          {Math.round((currentDay.activeDays / (currentDay.index + 1)) * 100)}% {lang === 'qc' ? 'de constance' : 'consistency'}
        </div>
      </div>

      {/* 4. Operator Keystrokes */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--amber)]">
          <span>{lang === 'qc' ? 'FRAPPES CLAVIER' : 'KEYSTROKES'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
        </div>
        <div className="my-1 text-2xl lg:text-3xl font-extrabold font-mono text-[var(--fg)] tracking-tight">
          {fmtInt(currentDay.cumKeystrokes)}
        </div>
        <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-mono">
          <span className="text-[var(--amber)] font-bold">+{fmtInt(currentDay.keystrokes)}</span>
          <span>{lang === 'qc' ? 'spoolées' : 'spooled'}</span>
        </div>
      </div>

      {/* 5. Mouse Travel */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--orange)]">
          <span>{lang === 'qc' ? 'PARCOURS SOURIS' : 'MOUSE TRAVEL'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)]" />
        </div>
        <div className="my-1 text-2xl lg:text-3xl font-extrabold font-mono text-[var(--fg)] tracking-tight">
          {fmtInt(currentDay.cumMouseDistanceM)}
          <span className="text-sm font-normal text-[var(--muted)] ml-1">m</span>
        </div>
        <div className="text-[11px] text-[var(--muted)] font-mono">
          +{currentDay.mouseDistanceM}m {lang === 'qc' ? "aujourd'hui" : 'today'}
        </div>
      </div>

      {/* 6. Spool Minutes Logged */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">
          <span>{lang === 'qc' ? 'MINUTES SPOOLÉES' : 'SPOOL MINUTES'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
        </div>
        <div className="my-1 text-2xl lg:text-3xl font-extrabold font-mono text-[var(--red)] tracking-tight">
          {currentDay.spoolMinutes}
        </div>
        <div className="text-[11px] text-[var(--muted)] font-mono">
          {currentDay.spoolMinutes > 0 ? (lang === 'qc' ? 'Télémétrie active' : 'Telemetry active') : (lang === 'qc' ? 'Pas de spool' : 'No spool recorded')}
        </div>
      </div>
    </div>
  );
};
