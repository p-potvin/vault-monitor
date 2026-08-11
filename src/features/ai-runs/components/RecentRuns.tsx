// ── RecentRuns — the newest invocations, newest first ───────────────────────

import { STATUS_COLORS, formatMs, formatTokens, maybeNum, type RunRow } from "../types";

function clock(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
}

interface Labels {
  time: string;
  model: string;
  provider: string;
  task: string;
  duration: string;
  ttft: string;
  tokens: string;
  status: string;
}

interface Props {
  rows: RunRow[];
  labels: Labels;
  emptyLabel: string;
}

export default function RecentRuns({ rows, labels, emptyLabel }: Props) {
  if (!rows.length) return <div className="text-[13px] text-vault-muted">{emptyLabel}</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="text-vault-muted text-[10px] uppercase tracking-[0.06em]">
            <th className="text-left font-bold py-1.5 pr-3">{labels.time}</th>
            <th className="text-left font-bold py-1.5 px-2">{labels.model}</th>
            <th className="text-left font-bold py-1.5 px-2">{labels.provider}</th>
            <th className="text-left font-bold py-1.5 px-2">{labels.task}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.duration}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.ttft}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.tokens}</th>
            <th className="text-left font-bold py-1.5 pl-2">{labels.status}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const vram = maybeNum(row.vram_peak_mb);
            return (
              <tr key={row.run_id} className="border-t border-vault-border/40">
                <td className="py-1.5 pr-3 text-vault-muted whitespace-nowrap tabular-nums">
                  {clock(row.started_at)}
                </td>
                <td className="py-1.5 px-2 min-w-0">
                  <span
                    className="text-vault-fg overflow-hidden text-ellipsis whitespace-nowrap block"
                    style={{ maxWidth: 220 }}
                    title={
                      [row.model, row.host, row.gpu_name, vram !== null ? `${vram.toFixed(0)} MB VRAM` : null]
                        .filter(Boolean)
                        .join(" · ")
                    }
                  >
                    {row.model}
                  </span>
                  {row.project && (
                    <span className="text-[10px] text-vault-muted">{row.project}</span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-vault-slate whitespace-nowrap">{row.provider}</td>
                <td className="py-1.5 px-2 text-vault-slate whitespace-nowrap">{row.task ?? "—"}</td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">
                  {formatMs(row.duration_ms)}
                </td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">
                  {formatMs(row.ttft_ms)}
                </td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">
                  {formatTokens(row.total_tokens)}
                </td>
                <td className="py-1.5 pl-2 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-vault-slate">
                    <span
                      className={`inline-block rounded-[2px] ${
                        STATUS_COLORS[row.status] ?? "bg-vault-slate"
                      }`}
                      style={{ width: 8, height: 8 }}
                    />
                    {row.error_class ?? row.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
