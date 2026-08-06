// ── ToolTimeline — stacked monthly session volume, one band per tool ─────────

import { num, type AiTimelinePoint } from "../types";

// Tailwind v4 exposes the palette as `--color-vault-*` (see @theme in
// styles.css), not `--vault-*`. Using the utility classes keeps this in step
// with BarList and avoids silently painting transparent bars if a token is
// ever renamed — the class names are static literals so they survive purging.
const TOOL_FILL: Record<string, string> = {
  "claude-code": "bg-vault-gold",
  codex: "bg-vault-cyan",
  "copilot-vscode": "bg-vault-green",
  "copilot-cli": "bg-vault-violet",
  "gemini-cli": "bg-vault-burgundy",
  antigravity: "bg-vault-slate",
  "windsurf-cascade": "bg-vault-muted",
  devin: "bg-vault-fg"
};

function fillFor(tool: string): string {
  return TOOL_FILL[tool] ?? "bg-vault-slate";
}

function monthLabel(bucket: string): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket.slice(0, 7);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

interface Props {
  points: AiTimelinePoint[];
  metric?: "sessions" | "messages";
  emptyLabel: string;
}

export default function ToolTimeline({ points, metric = "sessions", emptyLabel }: Props) {
  if (!points.length) return <div className="text-[13px] text-vault-muted">{emptyLabel}</div>;

  // bucket -> tool -> value, preserving chronological bucket order
  const buckets: string[] = [];
  const byBucket = new Map<string, Map<string, number>>();
  const toolTotals = new Map<string, number>();

  for (const p of points) {
    const value = metric === "sessions" ? p.sessions : num(p.messages);
    if (!byBucket.has(p.bucket)) {
      byBucket.set(p.bucket, new Map());
      buckets.push(p.bucket);
    }
    const row = byBucket.get(p.bucket)!;
    row.set(p.tool, (row.get(p.tool) ?? 0) + value);
    toolTotals.set(p.tool, (toolTotals.get(p.tool) ?? 0) + value);
  }

  buckets.sort();
  const tools = [...toolTotals.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const columnTotals = buckets.map((b) =>
    [...(byBucket.get(b)?.values() ?? [])].reduce((sum, v) => sum + v, 0)
  );
  const peak = Math.max(...columnTotals, 1);

  const H = 168;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-end gap-[6px] w-full" style={{ height: H }}>
        {buckets.map((bucket, i) => {
          const row = byBucket.get(bucket)!;
          const total = columnTotals[i];
          const colHeight = Math.round((total / peak) * (H - 22));
          return (
            <div key={bucket} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 group">
              <span className="text-[11px] tabular-nums text-vault-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {total}
              </span>
              <div
                className="w-full flex flex-col-reverse rounded-[4px] overflow-hidden transition-all"
                style={{ height: Math.max(colHeight, total > 0 ? 3 : 0) }}
                title={`${monthLabel(bucket)} — ${total} ${metric}\n${tools
                  .filter((t) => (row.get(t) ?? 0) > 0)
                  .map((t) => `  ${t}: ${row.get(t)}`)
                  .join("\n")}`}
              >
                {tools.map((tool) => {
                  const v = row.get(tool) ?? 0;
                  if (!v) return null;
                  return (
                    <div
                      key={tool}
                      className={fillFor(tool)}
                      style={{ height: `${(v / total) * 100}%` }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-vault-muted whitespace-nowrap">{monthLabel(bucket)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {tools.map((tool) => (
          <span key={tool} className="flex items-center gap-1.5 text-[11px] text-vault-slate">
            <span
              className={`inline-block rounded-[2px] ${fillFor(tool)}`}
              style={{ width: 9, height: 9 }}
            />
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
