// ── tooltipPosition — viewport-aware placement for fixed-position tooltips ──
//
// Positions a tooltip against an anchor rect, clamped so it never renders
// past the edge of the viewport (or slides under the sidebar). Takes the
// tooltip's own measured size rather than relying on CSS `bottom`/`right`
// auto-resolution, which is unreliable once height/width are content-driven.

export interface AnchorRect {
  left: number
  right: number
  top: number
  bottom: number
  width: number
}

export interface TooltipPos {
  top: number
  left: number
}

const MARGIN = 10

/**
 * The app's left rail is a fixed, always-on-top sidebar — clamping to the
 * bare viewport edge isn't enough, since a tooltip can still land underneath
 * it. Read its live width so collapsed/expanded states are both respected.
 */
function minLeftBound(): number {
  const rail = document.querySelector('.warm-rail')
  const railRight = rail?.getBoundingClientRect().right ?? 0
  return Math.max(MARGIN, railRight + MARGIN)
}

export function computeTooltipPosition(
  anchor: AnchorRect,
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const minLeft = minLeftBound()

  const roomAbove = anchor.top
  const roomBelow = vh - anchor.bottom
  const placeAbove = roomAbove >= tooltipHeight + MARGIN || roomAbove > roomBelow

  let top = placeAbove ? anchor.top - tooltipHeight - MARGIN : anchor.bottom + MARGIN
  top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - tooltipHeight - MARGIN))

  let left = anchor.left + anchor.width / 2 - tooltipWidth / 2
  left = Math.min(Math.max(minLeft, left), Math.max(minLeft, vw - tooltipWidth - MARGIN))

  return { top, left }
}
