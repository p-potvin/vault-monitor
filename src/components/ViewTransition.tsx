// ── ViewTransition — console-mode splash shown between views / time windows ──
//
// Renders a splash overlay whenever `token` changes (a route change or a
// time-window switch). The splash stays visible until `loading` becomes false
// AND at least `minDurationMs` has elapsed, ensuring the broken UI never
// flashes before data is ready.
//
// It portals to document.body on purpose: `.app-shell` carries `zoom: 0.8`,
// and a `position: fixed` element inside a zoomed subtree gets its coordinates
// scaled with it, so it cannot reliably cover the viewport from in there.
// Portalling escapes the zoom the same way the tooltips do.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 8000;

export function ViewTransition({
  token,
  label,
  loading = false,
}: {
  token: string;
  label?: string;
  loading?: boolean;
}) {
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState(label);
  const tokenRef = useRef(token);
  const loadingRef = useRef(loading);
  const minTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const maxTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Track loading state in a ref so the effect closure sees the latest value
  // without re-triggering the effect on every loading change.
  useEffect(() => {
    loadingRef.current = loading;
    // If loading just finished and the minimum time has elapsed, hide splash.
    if (!loading && active) {
      if (minTimer.current === undefined) {
        setActive(false);
      }
    }
  }, [loading, active]);

  useEffect(() => {
    setShown(label);
    tokenRef.current = token;
    setActive(true);
    clearTimeout(minTimer.current);
    clearTimeout(maxTimer.current);

    // Minimum display time — after this, hide only if loading is done.
    minTimer.current = setTimeout(() => {
      minTimer.current = undefined;
      if (!loadingRef.current) {
        setActive(false);
      }
    }, MIN_DURATION_MS);

    // Safety valve — never keep the splash longer than MAX_DURATION_MS.
    maxTimer.current = setTimeout(() => {
      minTimer.current = undefined;
      setActive(false);
    }, MAX_DURATION_MS);

    return () => {
      clearTimeout(minTimer.current);
      clearTimeout(maxTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, label]);

  useEffect(() => () => {
    clearTimeout(minTimer.current);
    clearTimeout(maxTimer.current);
  }, []);

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
