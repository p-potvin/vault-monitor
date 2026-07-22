import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconInfo } from '../icons';
import { computeTooltipPosition, type AnchorRect, type TooltipPos } from '../lib/tooltipPosition';

export function InfoTooltip({ text }: { text: string }) {
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const open = hovering || pinned;

  const captureAnchor = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setAnchor(rect);
  };

  // Measure the tooltip's actual rendered size before showing it, so
  // placement (flip above/below, clamp to the viewport) uses real dimensions.
  useLayoutEffect(() => {
    if (!open || !anchor) { setPos(null); return; }
    const rect = tipRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(computeTooltipPosition(anchor, rect.width, rect.height));
  }, [open, anchor, text]);

  // Tapping/clicking anywhere outside dismisses a tap-opened tooltip. Needed
  // because touch devices don't reliably focus <button> on tap (notably iOS
  // Safari), so the old CSS-only group-focus-within/group-hover never showed.
  useEffect(() => {
    if (!pinned) return;
    const dismiss = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [pinned]);

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => { captureAnchor(); setHovering(true); }}
        onMouseLeave={() => setHovering(false)}
        onClick={(e) => { e.stopPropagation(); captureAnchor(); setPinned((p) => !p); }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
        aria-label={text}
        aria-expanded={open}
      >
        <IconInfo width={11} height={11} />
      </button>
      {open && anchor && createPortal(
        <span
          ref={tipRef}
          role="tooltip"
          className="fixed z-50 pointer-events-none max-w-[260px] rounded-lg border border-[var(--border)] bg-[var(--vault-console-elevated)] px-3 py-2 text-[11px] leading-4 text-[var(--fg)] shadow-xl block"
          style={{
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {text}
        </span>,
        document.body,
      )}
    </span>
  );
}
