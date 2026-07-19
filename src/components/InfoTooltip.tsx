import { useEffect, useRef, useState } from 'react';
import { IconInfo } from '../icons';

export function InfoTooltip({ text }: { text: string }) {
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const open = hovering || pinned;

  // Tapping/clicking anywhere outside dismisses a tap-opened tooltip. Needed
  // because touch devices don't reliably focus <button> on tap (notably iOS
  // Safari), so the old CSS-only group-focus-within/group-hover never showed.
  useEffect(() => {
    if (!pinned) return;
    const dismiss = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [pinned]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={(e) => { e.stopPropagation(); setPinned((p) => !p); }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
        aria-label={text}
        aria-expanded={open}
      >
        <IconInfo width={11} height={11} />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute right-0 top-5 z-20 w-64 rounded-lg border border-[var(--border)] bg-[var(--vault-console-elevated)] px-3 py-2 text-[11px] leading-4 text-[var(--fg)] shadow-xl ${open ? 'block' : 'hidden'}`}
      >
        {text}
      </span>
    </span>
  );
}
