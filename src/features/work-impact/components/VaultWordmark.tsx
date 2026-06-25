// ── VaultWordmark — V glyph + hexagon + text SVG ────────────────────────────

interface VaultWordmarkProps {
  height?: number
}

export default function VaultWordmark({ height = 40 }: VaultWordmarkProps) {
  const ratio = 620 / 120
  const w = height * ratio

  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 620 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="VaultWares"
    >
      {/* V chevron */}
      <path
        d="M10 20 L34 20 L60 86 L86 20 L110 20 L70 110 L50 110 Z"
        fill="#CC9B21"
      />
      {/* Hexagon socket */}
      <polygon
        points="60,46 73,53.5 73,68.5 60,76 47,68.5 47,53.5"
        fill="none"
        stroke="#21B8CC"
        strokeWidth="3"
      />
      {/* Centre dot */}
      <circle cx="60" cy="61" r="3.5" fill="#21B8CC" />
      {/* Wordmark text */}
      <text
        x="124"
        y="86"
        fontSize="68"
        fontWeight="300"
        fontFamily="Inter, Segoe UI, system-ui, sans-serif"
        fill="#FDF6E3"
        letterSpacing="-1"
      >
        aultWares
      </text>
    </svg>
  )
}
