// ── ViewTransition — console-mode splash shown between views / time windows ──
//
// Renders a short, self-cancelling overlay whenever `token` changes (a route
// change or a time-window switch).
//
// It portals to document.body on purpose: `.app-shell` carries `zoom: 0.8`,
// and a `position: fixed` element inside a zoomed subtree gets its coordinates
// scaled with it, so it cannot reliably cover the viewport from in there.
// Portalling escapes the zoom the same way the tooltips do.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DURATION_MS = 700;

export function ViewTransition({ token, label }: { token: string; label?: string }) {
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState(label);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Don't flash on first paint — only on an actual switch.
    if (first.current) {
      first.current = false;
      setShown(label);
      return;
    }
    setShown(label);
    setActive(false);
    // Re-arm on the next frame so a switch mid-animation restarts the sweep
    // cleanly instead of continuing the previous one.
    const raf = requestAnimationFrame(() => setActive(true));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), DURATION_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer.current);
    };
  }, [token, label]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!active) return null;

  return createPortal(
    <div className="vw-splash" aria-hidden="true">
      <div className="vw-splash-wash" />
      <div className="vw-splash-grid" />
      <div className="vw-splash-sweep" />
      <div className="vw-splash-core">
        <span className="vw-splash-ring" />
        <span className="vw-splash-ring vw-splash-ring-2" />
        <span className="vw-splash-ring vw-splash-ring-3" />
        {shown ? <span className="vw-splash-label">{shown}</span> : null}
      </div>
    </div>,
    document.body,
  );
}
