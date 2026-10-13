import React from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  currentDate: string;
  dayIndex: number;
  totalDays: number;
  lang: 'en' | 'qc';
}

const SPEED_OPTIONS = [0.5, 1, 2, 5, 20, 60];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onJumpStart,
  onJumpEnd,
  playbackSpeed,
  onSpeedChange,
  currentDate,
  dayIndex,
  totalDays,
  lang,
}) => {
  const percent = Math.round(((dayIndex + 1) / totalDays) * 100);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] shadow-xl">
      {/* Date & Day Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
            {lang === 'qc' ? 'JOUR RECORDÉ' : 'RECORDED DATE'}
          </div>
          <div className="text-xl font-extrabold text-[var(--fg)] tracking-tight font-mono">
            {currentDate}
          </div>
        </div>
        <div className="hidden sm:flex flex-col border-l border-[var(--border)] pl-3">
          <span className="text-[10px] uppercase font-bold text-[var(--muted)]">
            {lang === 'qc' ? 'Progression' : 'Horizon'}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--fg)]">
            {dayIndex + 1} / {totalDays} ({percent}%)
          </span>
        </div>
      </div>

      {/* Main Transport Buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onJumpStart}
          title={lang === 'qc' ? 'Sauter au début (11 mars)' : 'Jump to Beginning (March 11)'}
          className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        <button
          onClick={onStepBack}
          title={lang === 'qc' ? 'Jour précédent' : 'Step Back 1 Day'}
          className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="15 18 9 12 15 6 15 18" />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? (lang === 'qc' ? 'Pause (Espace)' : 'Pause (Space)') : (lang === 'qc' ? 'Lecture (Espace)' : 'Play (Space)')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 border transition ${
            isPlaying
              ? 'bg-[var(--gold)] text-black border-[var(--gold)] shadow-[0_0_15px_rgba(184,136,46,0.4)]'
              : 'bg-[var(--gold-dim)] text-[var(--gold)] border-[var(--gold-glow)] hover:bg-[var(--gold)] hover:text-black'
          }`}
        >
          {isPlaying ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              <span className="text-xs tracking-wider uppercase font-mono">{lang === 'qc' ? 'PAUSE' : 'PAUSE'}</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span className="text-xs tracking-wider uppercase font-mono">{lang === 'qc' ? 'LIRE' : 'PLAY'}</span>
            </>
          )}
        </button>

        <button
          onClick={onStepForward}
          title={lang === 'qc' ? 'Jour suivant' : 'Step Forward 1 Day'}
          className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="9 18 15 12 9 6 9 18" />
          </svg>
        </button>

        <button
          onClick={onJumpEnd}
          title={lang === 'qc' ? "Sauter à aujourd'hui" : 'Jump to Today'}
          className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>

      {/* Speed Multiplier Pill Selector */}
      <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
        <span className="text-[10px] font-bold uppercase text-[var(--muted)] px-1.5 hidden md:inline">
          {lang === 'qc' ? 'Vitesse' : 'Speed'}
        </span>
        {SPEED_OPTIONS.map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-2 py-1 text-[11px] font-mono rounded font-bold transition ${
              playbackSpeed === speed
                ? 'bg-[var(--gold)] text-black'
                : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface2)]'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
};
