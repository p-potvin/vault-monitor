import React from 'react';
import type { Keyframe } from '../types';

interface KeyframeBannerProps {
  keyframe: Keyframe;
  onClose?: () => void;
  lang: 'en' | 'qc';
}

export const KeyframeBanner: React.FC<KeyframeBannerProps> = ({ keyframe, onClose, lang }) => {
  return (
    <div className="relative p-4 rounded-xl border border-[var(--gold-glow)] bg-[color-mix(in_srgb,var(--surface2)_90%,var(--gold))] shadow-lg flex items-start gap-4">
      {/* Category Indicator Dot */}
      <div className="w-10 h-10 rounded-xl bg-[var(--gold-dim)] border border-[var(--gold-glow)] text-[var(--gold)] flex items-center justify-center shrink-0 text-lg font-bold">
        ★
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--gold)] text-black uppercase">
            {keyframe.date}
          </span>
          <span className="text-[10px] uppercase font-bold text-[var(--gold)] tracking-wider">
            {keyframe.category}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-[var(--fg)] tracking-tight m-0">
          {keyframe.title}
        </h3>
        <p className="text-xs text-[var(--fg)] opacity-90 leading-relaxed m-0">
          {keyframe.summary}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-[var(--muted)] hover:text-[var(--fg)] p-1 text-xs"
          title="Dismiss banner"
        >
          ✕
        </button>
      )}
    </div>
  );
};
