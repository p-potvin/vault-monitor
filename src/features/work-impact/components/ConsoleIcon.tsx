// ── ConsoleIcon — SVG sprite <use> wrapper ────────────────────────────────────

interface ConsoleIconProps {
  id: 'bluesky-icon' | 'discord-icon' | 'documentation-icon' | 'github-icon' | 'social-icon' | 'x-icon'
  size?: number
  className?: string
}

export default function ConsoleIcon({ id, size = 20, className = '' }: ConsoleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <use href={`/icons/vaultwares-console-icons.svg#${id}`} />
    </svg>
  )
}
