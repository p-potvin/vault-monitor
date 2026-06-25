// ── Tooltip — hover overlay, JS-controlled ───────────────────────────────────
import { useState, useRef } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    setPos({ x: e.clientX + 12, y: e.clientY + 12 })
  }

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onMouseMove={handleMouseMove}
        className="contents"
      >
        {children}
      </div>
      {visible && (
        <div
          className="fixed z-50 pointer-events-none max-w-[380px] bg-vault-raised border border-vault-border rounded-[8px] px-3 py-2 text-[12px] text-vault-slate shadow-xl"
          style={{ left: pos.x, top: pos.y }}
        >
          {content}
        </div>
      )}
    </>
  )
}
