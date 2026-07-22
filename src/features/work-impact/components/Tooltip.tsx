// ── Tooltip — hover + tap overlay, clamped to the viewport ───────────────────
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { computeTooltipPosition, type AnchorRect, type TooltipPos } from '../../../lib/tooltipPosition'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [hovering, setHovering] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [anchor, setAnchor] = useState<AnchorRect | null>(null)
  const [pos, setPos] = useState<TooltipPos | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const visible = hovering || pinned

  const captureAnchor = () => {
    // The wrapper below is `display: contents` so it doesn't disturb the
    // parent's flex/grid layout — but that also means it has no box of its
    // own, and getBoundingClientRect() on it always returns a zero rect.
    // Anchor to the actual rendered child instead.
    const el = (wrapRef.current?.firstElementChild ?? wrapRef.current) as HTMLElement | null
    const rect = el?.getBoundingClientRect()
    if (rect) setAnchor(rect)
  }

  // Measure the tooltip's actual rendered size before showing it, so
  // placement (including flipping above/below and clamping to the viewport)
  // is based on real dimensions instead of a guess.
  useLayoutEffect(() => {
    if (!visible || !anchor) { setPos(null); return }
    const rect = tipRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos(computeTooltipPosition(anchor, rect.width, rect.height))
  }, [visible, anchor, content])

  // Tapping/clicking anywhere outside dismisses a pinned (tap-to-open) tooltip.
  useEffect(() => {
    if (!pinned) return
    const dismiss = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node) && tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setPinned(false)
      }
    }
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [pinned])

  return (
    <>
      <div
        ref={wrapRef}
        onMouseEnter={() => { captureAnchor(); setHovering(true) }}
        onMouseLeave={() => setHovering(false)}
        onClick={(e) => {
          e.stopPropagation()
          captureAnchor()
          setPinned(p => !p)
        }}
        className="contents"
      >
        {children}
      </div>
      {visible && anchor && createPortal(
        <div
          ref={tipRef}
          className="fixed z-50 pointer-events-none max-w-[320px] bg-vault-raised border border-vault-border rounded-[8px] px-3 py-2 text-[12px] text-vault-slate shadow-xl"
          style={{
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  )
}
