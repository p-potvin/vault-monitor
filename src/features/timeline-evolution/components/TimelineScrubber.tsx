import React, { useMemo } from 'react';
import type { Keyframe, TimelineDay } from '../types';

interface TimelineScrubberProps {
  days: TimelineDay[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  keyframes: Keyframe[];
  onSelectKeyframe: (keyframe: Keyframe) => void;
  lang: 'en' | 'qc';
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  days,
  currentIndex,
  onSelectIndex,
  keyframes,
  onSelectKeyframe,
  lang,
}) => {
  const maxEvents = useMemo(() => {
    return Math.max(1, ...days.map((d) => d.events));
  }, [days]);

  const keyframeDateMap = useMemo(() => {
    const map = new Map<string, Keyframe>();
    for (const k of keyframes) {
      map.set(k.date, k);
    }
    return map;
  }, [keyframes]);

  return (
    <div className="space-y-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Header info */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-mono text-[11px] font-bold text-[var(--gold)]">
          {days[0]?.date || '2026-03-11'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider">
            {lang === 'qc' ? 'Glissez pour remonter le temps' : 'Drag scrubber to travel time'}
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold text-[var(--fg)]">
          {days[days.length - 1]?.date || '2026-10-12'}
        </span>
      </div>

      {/* Scrubber Container with Sparkline & Keyframes */}
      <div className="relative h-16 w-full rounded-lg bg-[var(--surface2)] border border-[var(--border)] overflow-hidden select-none">
        {/* Background Sparkline Bars */}
        <div className="absolute inset-0 flex items-end gap-[1px] px-1 pointer-events-none opacity-60">
          {days.map((d, i) => {
            const heightPct = Math.max(4, Math.round((d.events / maxEvents) * 100));
            const isSpool = d.spoolMinutes > 0;
            const isPassed = i <= currentIndex;
            return (
              <div
                key={d.date}
                className="flex-1 transition-all rounded-t-[1px]"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isPassed
                    ? isSpool
                      ? 'var(--violet)'
                      : 'var(--gold)'
                    : 'rgba(216, 208, 240, 0.12)',
                }}
              />
            );
          })}
        </div>

        {/* Milestone Marker Pins on Top */}
        <div className="absolute inset-0 pointer-events-none">
          {days.map((d, i) => {
            const kf = keyframeDateMap.get(d.date);
            if (!kf) return null;
            const leftPct = (i / (days.length - 1)) * 100;
            const isActive = i === currentIndex;
            return (
              <button
                key={kf.date}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectKeyframe(kf);
                }}
                title={`${kf.date}: ${kf.title}`}
                className={`pointer-events-auto absolute top-1 -translate-x-1/2 p-1 rounded-full cursor-pointer transition transform hover:scale-125 z-10 ${
                  isActive
                    ? 'bg-[var(--gold)] text-black ring-2 ring-[var(--gold)]'
                    : 'bg-[var(--surface3)] text-[var(--gold)] border border-[var(--gold-glow)]'
                }`}
                style={{ left: `${leftPct}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-current" />
              </button>
            );
          })}
        </div>

        {/* Range Slider Overlay */}
        <input
          type="range"
          min={0}
          max={Math.max(0, days.length - 1)}
          value={currentIndex}
          onChange={(e) => onSelectIndex(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        />

        {/* Playhead indicator bar */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-[var(--gold)] shadow-[0_0_10px_var(--gold)] pointer-events-none z-15 transition-[left] duration-75"
          style={{ left: `${(currentIndex / Math.max(1, days.length - 1)) * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--gold)] rounded-full" />
        </div>
      </div>

      {/* 7-Month Quick Jump Track */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border)] scrollbar-thin">
        <span className="text-[10px] uppercase font-bold text-[var(--muted)] shrink-0 mr-1">
          {lang === 'qc' ? 'Horizon:' : 'Horizon:'}
        </span>
        {[
          { label: "Mar '26", prefix: "2026-03" },
          { label: "Apr '26", prefix: "2026-04" },
          { label: "May '26", prefix: "2026-05" },
          { label: "Jun '26", prefix: "2026-06" },
          { label: "Jul '26", prefix: "2026-07" },
          { label: "Aug '26", prefix: "2026-08" },
          { label: "Sep '26", prefix: "2026-09" },
          { label: "Oct '26", prefix: "2026-10" },
        ].map((m) => {
          const idx = days.findIndex((d) => d.date.startsWith(m.prefix));
          if (idx === -1) return null;
          const isMonthActive = days[currentIndex]?.date.startsWith(m.prefix);
          return (
            <button
              key={m.prefix}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition border ${
                isMonthActive
                  ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--gold)] border-[var(--border)]'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Quick Jump Milestone Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
        <span className="text-[10px] uppercase font-bold text-[var(--muted)] shrink-0 mr-1">
          {lang === 'qc' ? 'Jalons clés:' : 'Key Milestones:'}
        </span>
        {keyframes.map((kf) => {
          const isSelected = days[currentIndex]?.date === kf.date;
          return (
            <button
              key={kf.date}
              onClick={() => onSelectKeyframe(kf)}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition border ${
                isSelected
                  ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--gold)] border-[var(--border)] hover:border-[var(--gold-glow)]'
              }`}
            >
              {kf.date.slice(5)} · {kf.title}
            </button>
          );
        })}
      </div>
    </div>
  );
};
