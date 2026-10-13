import React, { useState, useEffect, useRef, useCallback } from 'react';
import timelineDataRaw from '../features/timeline-evolution/timelineData.json';
import type { TimelineData, Keyframe } from '../features/timeline-evolution/types';
import { PlaybackControls } from '../features/timeline-evolution/components/PlaybackControls';
import { TimelineScrubber } from '../features/timeline-evolution/components/TimelineScrubber';
import { EvolutionMetrics } from '../features/timeline-evolution/components/EvolutionMetrics';
import { ProjectRaceChart } from '../features/timeline-evolution/components/ProjectRaceChart';
import { MinuteSpoolInspector } from '../features/timeline-evolution/components/MinuteSpoolInspector';
import { AgentContractMatrix } from '../features/timeline-evolution/components/AgentContractMatrix';
import { KeyframeBanner } from '../features/timeline-evolution/components/KeyframeBanner';
import { useLangState } from '../i18n';

interface TimelineEvolutionPageProps {
  setLoading?: (loading: boolean) => void;
}

const data = timelineDataRaw as unknown as TimelineData;

export const TimelineEvolutionPage: React.FC<TimelineEvolutionPageProps> = ({ setLoading }) => {
  const [lang] = useLangState();
  const [currentIndex, setCurrentIndex] = useState<number>(() => data.days.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
  const [activeKeyframe, setActiveKeyframe] = useState<Keyframe | null>(null);

  // Notify parent loading done
  useEffect(() => {
    if (setLoading) setLoading(false);
  }, [setLoading]);

  const currentDay = data.days[currentIndex] || data.days[data.days.length - 1];
  const spoolsForDay = data.spoolDetailsByDate[currentDay.date] || [];

  // Playback timer loop
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Interval derived from speed: speed 1x = 1000ms/day, 5x = 200ms/day, 20x = 50ms/day, 60x = 16ms/day
    const intervalMs = Math.max(16, Math.round(1000 / playbackSpeed));

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= data.days.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Update keyframe banner when moving through dates
  useEffect(() => {
    if (currentDay.keyframe) {
      setActiveKeyframe(currentDay.keyframe);
    }
  }, [currentDay.keyframe]);

  // Navigation handlers
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      // If at end and hitting play, start from beginning
      if (!prev && currentIndex >= data.days.length - 1) {
        setCurrentIndex(0);
      }
      return !prev;
    });
  }, [currentIndex]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(data.days.length - 1, prev + 1));
  }, []);

  const handleJumpStart = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const handleJumpEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(data.days.length - 1);
  }, []);

  const handleSelectKeyframe = useCallback((kf: Keyframe) => {
    setIsPlaying(false);
    const idx = data.days.findIndex((d) => d.date === kf.date);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setActiveKeyframe(kf);
    }
  }, []);

  const handleJumpToSpoolDay = useCallback((targetDate: string) => {
    setIsPlaying(false);
    const idx = data.days.findIndex((d) => d.date === targetDate);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  }, []);

  // Global Keyboard shortcuts (Space = Play/Pause, Left/Right = Step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBack();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'Home') {
        e.preventDefault();
        handleJumpStart();
      } else if (e.code === 'End') {
        e.preventDefault();
        handleJumpEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleStepBack, handleStepForward, handleJumpStart, handleJumpEnd]);

  return (
    <div className="space-y-6 pb-16 max-w-[1400px] mx-auto px-2 sm:px-4">
      {/* Top Page Header & Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--fg)] m-0">
              VaultWares <span className="text-[var(--gold)]">Chronos</span> — 7-Month Evolution Time Machine
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            {lang === 'qc'
              ? 'Rétrospective temporelle continue : comment VaultWares et 40+ dépôts ont évolué depuis le 11 mars 2026'
              : 'Continuous temporal playback: how VaultWares and 40+ repositories evolved over the past 7 months'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Link to Standalone Fullscreen HTML version */}
          <a
            href="/time-machine.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[var(--surface2)] hover:bg-[var(--surface3)] text-[var(--fg)] border border-[var(--border)] text-xs font-mono font-bold transition flex items-center gap-1.5"
            title="Open dedicated standalone HTML player"
          >
            <span>↗</span>
            <span>{lang === 'qc' ? 'Page HTML autonome' : 'Standalone Fullscreen App'}</span>
          </a>
        </div>
      </div>

      {/* 1. Playback Transport Bar */}
      <PlaybackControls
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onJumpStart={handleJumpStart}
        onJumpEnd={handleJumpEnd}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        currentDate={currentDay.date}
        dayIndex={currentIndex}
        totalDays={data.days.length}
        lang={lang}
      />

      {/* 2. Interactive Timeline Scrubber with Sparkline & Keyframe pins */}
      <TimelineScrubber
        days={data.days}
        currentIndex={currentIndex}
        onSelectIndex={(idx) => {
          setIsPlaying(false);
          setCurrentIndex(idx);
        }}
        keyframes={data.keyframes}
        onSelectKeyframe={handleSelectKeyframe}
        lang={lang}
      />

      {/* 3. Milestone Keyframe Banner (if present for current slice) */}
      {activeKeyframe && (
        <KeyframeBanner
          keyframe={activeKeyframe}
          onClose={() => setActiveKeyframe(null)}
          lang={lang}
        />
      )}

      {/* 4. Live Cumulative KPI Metrics (Dynamic state as of this date) */}
      <EvolutionMetrics
        currentDay={currentDay}
        totalDays={data.days.length}
        lang={lang}
      />

      {/* 5. Project Evolution Bar Race & Work Types today */}
      <ProjectRaceChart
        currentDay={currentDay}
        lang={lang}
      />

      {/* 6. Exact Minute Spool Telemetry Inspector */}
      <MinuteSpoolInspector
        currentDay={currentDay}
        spoolsForDay={spoolsForDay}
        onJumpToSpoolDay={handleJumpToSpoolDay}
        lang={lang}
      />

      {/* 7. Daily Recorded Events & Changes Spotlight */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <span>{lang === 'qc' ? 'ÉVÉNEMENTS ENREGISTRÉS CE JOUR' : 'EVENTS RECORDED ON THIS DATE'}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--chip)] text-[var(--gold)]">
              {currentDay.totalEventsOnDay} {lang === 'qc' ? 'entrées' : 'ledger entries'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--muted)]">{currentDay.date}</span>
        </div>

        {currentDay.eventsSample.length === 0 ? (
          <div className="text-xs text-[var(--muted)] italic py-4 text-center">
            {lang === 'qc'
              ? 'Aucun détail de commit explicite dans le registre pour ce jour (commits synthétisés dans les séries d’impact).'
              : 'No detailed change block in CHANGES.md for this date (commits captured via historical backfill series).'}
          </div>
        ) : (
          <div className="space-y-2">
            {currentDay.eventsSample.map((ev, idx) => (
              <div
                key={`${ev.datetime}-${idx}`}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--gold-dim)] transition space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[var(--gold)] font-bold">{ev.time}</span>
                    <span className="font-bold text-[var(--fg)] font-mono">{ev.project}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--surface3)] text-[var(--muted)] border border-[var(--border)]">
                      {ev.kind}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted)]">
                    <span className="text-[var(--violet)] font-semibold">{ev.model}</span>
                    <span>·</span>
                    <span>{ev.actor}</span>
                    {ev.head && <span className="bg-[var(--chip)] px-1 rounded">sha:{ev.head}</span>}
                  </div>
                </div>
                <p className="text-xs text-[var(--fg)] opacity-90 leading-relaxed m-0 font-sans">
                  {ev.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. Human-Agent Work Contract Paradigm & Solo Dev Benchmark */}
      <AgentContractMatrix
        models={data.agentCollaboration.models}
        principles={data.agentCollaboration.principles}
        soloComparison={data.agentCollaboration.soloComparison}
        lang={lang}
      />
    </div>
  );
};
