// ── Tooltip — hover + tap overlay ─────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [hovering, setHovering] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number; above: boolean }>({ x: 0, y: 0, above: true })
  const ref = useRef<HTMLDivElement>(null)

  const visible = hovering || pinned

  const updatePos = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const above = rect.top > 72
    setPos({ x: rect.left + rect.width / 2, y: above ? rect.top - 8 : rect.bottom + 8, above })
  }

  // Tapping/clicking anywhere outside dismisses a pinned (tap-to-open) tooltip.
  useEffect(() => {
    if (!pinned) return
    const dismiss = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false)
    }
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', dismiss, true)
    }
  }, [pinned])

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={() => { updatePos(); setHovering(true) }}
        onMouseLeave={() => setHovering(false)}
        onClick={(e) => {
          e.stopPropagation()
          updatePos()
          setPinned(p => !p)
        }}
        className="contents"
      >
        {children}
      </div>
      {visible && (
        <div
          className="fixed z-50 pointer-events-none max-w-[380px] -translate-x-1/2 bg-vault-raised border border-vault-border rounded-[8px] px-3 py-2 text-[12px] text-vault-slate shadow-xl"
          style={{ left: pos.x, top: pos.y, transform: `translate(-50%, ${pos.above ? '-100%' : '0'})` }}
        >
          {content}
        </div>
      )}
    </>
  )
}
