import { IconInfo } from '../icons';

export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
        aria-label={text}
      >
        <IconInfo width={11} height={11} />
      </button>
      <span className="pointer-events-none absolute right-0 top-5 z-20 hidden w-64 rounded-lg border border-[var(--border)] bg-[var(--vault-console-elevated)] px-3 py-2 text-[11px] leading-4 text-[var(--fg)] shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}
