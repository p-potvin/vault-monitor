import React, { useState, useEffect } from 'react';
import type { MinuteRollup, TimelineDay } from '../types';
import { NaturalPathCanvas } from './NaturalPathCanvas';

interface MinuteSpoolInspectorProps {
  currentDay: TimelineDay;
  spoolsForDay: MinuteRollup[];
  onJumpToSpoolDay: (date: string) => void;
  lang: 'en' | 'qc';
}

export const MinuteSpoolInspector: React.FC<MinuteSpoolInspectorProps> = ({
  currentDay,
  spoolsForDay,
  onJumpToSpoolDay,
  lang,
}) => {
  const [selectedMinuteIdx, setSelectedMinuteIdx] = useState<number>(0);

  // Reset selected minute when day changes
  useEffect(() => {
    setSelectedMinuteIdx(0);
  }, [currentDay.date]);

  const hasSpools = spoolsForDay && spoolsForDay.length > 0;
  const currentSpool = hasSpools ? spoolsForDay[Math.min(selectedMinuteIdx, spoolsForDay.length - 1)] : null;

  useEffect(() => {
    const el = document.getElementById(`spool-pill-${selectedMinuteIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedMinuteIdx]);

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)] m-0">
              {lang === 'qc' ? 'INSPECTEUR DE SPOOL À LA MINUTE PRÈS' : 'EXACT MINUTE SPOOL INSPECTOR'}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--chip)] text-[var(--gold)] border border-[var(--gold-dim)]">
              1 spool = 1 minute
            </span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            {lang === 'qc'
              ? 'Télémétrie brute saisie par le traqueur de frappes, fenêtres actives et trajectoires'
              : 'Hardware-level telemetry: keystrokes, active window context, and mouse travel'}
          </div>
        </div>

        {hasSpools ? (
          <div className="text-xs font-mono text-[var(--muted)]">
            <span className="text-[var(--gold)] font-bold">{spoolsForDay.length}</span> {lang === 'qc' ? 'minutes capturées ce jour' : 'minutes spooled today'}
          </div>
        ) : (
          <button
            onClick={() => onJumpToSpoolDay('2026-10-12')}
            className="px-3 py-1.5 rounded-lg bg-[var(--surface2)] hover:bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-glow)] text-xs font-mono font-bold transition flex items-center gap-1.5"
          >
            <span>▶</span>
            <span>{lang === 'qc' ? "Sauter au 12 Octobre (187 spools)" : "Jump to Oct 12 (187 spools)"}</span>
          </button>
        )}
      </div>

      {!hasSpools ? (
        <div className="p-6 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-center space-y-2">
          <div className="text-sm font-semibold text-[var(--muted)]">
            {lang === 'qc'
              ? `Aucun fichier spool de télémétrie locale archivé pour le ${currentDay.date}.`
              : `No input tracker minute spool archived for ${currentDay.date}.`}
          </div>
          <div className="text-xs text-[var(--dim)] max-w-md mx-auto">
            {lang === 'qc'
              ? 'Le traqueur de spool a été initialisé fin mai 2026. Les jours d’octobre, septembre, août et juillet contiennent des spools détaillés.'
              : 'Input spools were deployed late May 2026. October, September, August and July contain detailed minute-by-minute rollups.'}
          </div>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => onJumpToSpoolDay('2026-10-12')}
              className="px-3 py-1 rounded bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-glow)] text-xs font-mono font-bold"
            >
              2026-10-12 (Today)
            </button>
            <button
              onClick={() => onJumpToSpoolDay('2026-07-29')}
              className="px-3 py-1 rounded bg-[var(--surface3)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] text-xs font-mono font-bold"
            >
              2026-07-29 (2.7 MB spool)
            </button>
            <button
              onClick={() => onJumpToSpoolDay('2026-07-11')}
              className="px-3 py-1 rounded bg-[var(--surface3)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] text-xs font-mono font-bold"
            >
              2026-07-11 (2.8 MB spool)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Minute Scrubber Range */}
          <div className="space-y-2 bg-[var(--surface2)] p-3 rounded-lg border border-[var(--border)]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMinuteIdx((prev) => Math.max(0, prev - 1))}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--fg)] border border-[var(--border)] text-[11px] font-mono font-bold"
                  title="Previous Minute"
                >
                  ◀ -1m
                </button>
                <span className="text-[var(--gold)] font-bold text-sm">
                  {currentSpool?.time} UTC · Minute #{selectedMinuteIdx + 1} / {spoolsForDay.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMinuteIdx((prev) => Math.min(spoolsForDay.length - 1, prev + 1))}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--fg)] border border-[var(--border)] text-[11px] font-mono font-bold"
                  title="Next Minute"
                >
                  +1m ▶
                </button>
              </div>
              <span className="hidden sm:inline text-[11px]">
                {spoolsForDay[0]?.time} UTC → {spoolsForDay[spoolsForDay.length - 1]?.time} UTC
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={spoolsForDay.length - 1}
              value={selectedMinuteIdx}
              onChange={(e) => setSelectedMinuteIdx(Number(e.target.value))}
              className="w-full accent-[var(--gold)] cursor-pointer"
            />
          </div>

          {/* Minute Rollup Spotlight Card */}
          {currentSpool && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Telemetry metrics & active window */}
              <div className="md:col-span-7 space-y-3 p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--chip)] text-[var(--gold)] border border-[var(--gold-dim)]">
                      {currentSpool.focus}
                    </span>
                    <span className="text-sm font-bold text-[var(--fg)] font-mono truncate" title={currentSpool.window}>
                      {currentSpool.window}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--muted)] shrink-0">
                    {currentSpool.activeSec}s active
                  </span>
                </div>

                {/* Metric grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Frappes' : 'Keys'}</div>
                    <div className="text-lg font-mono font-bold text-[var(--gold)]">{currentSpool.keys}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Caractères' : 'Chars'}</div>
                    <div className="text-lg font-mono font-bold text-[var(--fg)]">{currentSpool.chars}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Clics' : 'Clicks'}</div>
                    <div className="text-lg font-mono font-bold text-[var(--violet)]">{currentSpool.clicks}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Souris' : 'Mouse'}</div>
                    <div className="text-lg font-mono font-bold text-[var(--orange)]">{currentSpool.mouseM}m</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Défilement' : 'Scrolls'}</div>
                    <div className="text-sm font-mono font-bold text-[var(--muted)]">{currentSpool.scrolls}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">{lang === 'qc' ? 'Bascule' : 'Switches'}</div>
                    <div className="text-sm font-mono font-bold text-[var(--muted)]">{currentSpool.switches}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Saves</div>
                    <div className="text-sm font-mono font-bold text-[var(--muted)]">{currentSpool.saves}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Copies/Pastes</div>
                    <div className="text-sm font-mono font-bold text-[var(--muted)]">{currentSpool.copies}/{currentSpool.pastes}</div>
                  </div>
                </div>

                <div className="text-[10px] text-[var(--muted)] font-mono flex items-center justify-between">
                  <span>ID: {currentSpool.id || 'rollup-auto'}</span>
                  <span>{currentSpool.timestamp}</span>
                </div>
              </div>

              {/* Natural Mouse Trajectory Path */}
              <div className="md:col-span-5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
                  <span>{lang === 'qc' ? 'REPLAY DE TRAJECTOIRE SOURIS 2D' : '2D NATURAL MOUSE PATH REPLAY'}</span>
                  <span className="text-[10px] text-[var(--gold)] font-mono">
                    {currentDay.naturalPathSample ? 'telemetry sample' : 'no path capture'}
                  </span>
                </div>

                {currentDay.naturalPathSample ? (
                  <NaturalPathCanvas points={currentDay.naturalPathSample} lang={lang} />
                ) : (
                  <div className="h-40 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-xs text-[var(--muted)] italic">
                      {lang === 'qc'
                        ? 'Trajectoire vectorielle non-enregistrée pour cette minute exacte.'
                        : 'Vector mouse path unrecorded for this exact slice.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick horizontal minute scroller */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {spoolsForDay.map((s, idx) => {
              const isSel = idx === selectedMinuteIdx;
              return (
                <button
                  key={`${s.time}-${idx}`}
                  id={`spool-pill-${idx}`}
                  onClick={() => setSelectedMinuteIdx(idx)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-left transition font-mono ${
                    isSel
                      ? 'bg-[var(--gold)] text-black border-[var(--gold)] shadow-md'
                      : 'bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--fg)] border-[var(--border)]'
                  }`}
                >
                  <div className="text-xs font-bold">{s.time}</div>
                  <div className="text-[10px] opacity-80 truncate max-w-[90px]">{s.window}</div>
                  <div className="text-[10px] flex items-center gap-1">
                    <span>{s.keys}k</span>
                    <span>·</span>
                    <span>{s.mouseM}m</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
