// ── VaultReactLogo — animated green SVG star/network ─────────────────────────

interface VaultReactLogoProps {
  size?: number
}

export default function VaultReactLogo({ size = 200 }: VaultReactLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4ecc21"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ animation: 'spin 8s linear infinite' }}
    >
      <path d="M12 1v6m0 0 4-4m-4 4L8 3m12 9h-6m0 0 4 4m-4-4-4 4m2 4v-6m0 0-4 4m4-4 4 4" />
    </svg>
  )
}
