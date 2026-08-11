// ── ModelLeaderboard — per-model cost of service ────────────────────────────
//
// The one table that answers "which model should we keep using": volume,
// tail latency, decode speed, spend, and how often it fails.

import { formatCost, formatMs, formatTokens, maybeNum, type RunGroupRow } from "../types";

interface Labels {
  model: string;
  runs: string;
  p50: string;
  p95: string;
  tps: string;
  tokens: string;
  cost: string;
  failures: string;
}

interface Props {
  rows: RunGroupRow[];
  labels: Labels;
  emptyLabel: string;
}

function failurePct(row: RunGroupRow): number | null {
  if (!row.runs) return null;
  return (row.failures / row.runs) * 100;
}

export default function ModelLeaderboard({ rows, labels, emptyLabel }: Props) {
  if (!rows.length) return <div className="text-[13px] text-vault-muted">{emptyLabel}</div>;

  const peak = Math.max(...rows.map((r) => r.runs), 1);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="text-vault-muted text-[10px] uppercase tracking-[0.06em]">
            <th className="text-left font-bold py-1.5 pr-3">{labels.model}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.runs}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.p50}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.p95}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.tps}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.tokens}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.cost}</th>
            <th className="text-right font-bold py-1.5 pl-2">{labels.failures}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const fail = failurePct(row);
            const tps = maybeNum(row.avg_tps);
            return (
              <tr key={row.key} className="border-t border-vault-border/40">
                <td className="py-1.5 pr-3 min-w-0">
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-vault-fg overflow-hidden text-ellipsis whitespace-nowrap block"
                      style={{ maxWidth: 280 }}
                      title={row.key}
                    >
                      {row.key}
                    </span>
                    <div className="bg-vault-raised rounded-full h-[3px] overflow-hidden" style={{ maxWidth: 280 }}>
                      <div
                        className="h-full bg-vault-gold rounded-full"
                        style={{ width: `${Math.round((row.runs / peak) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-fg">{row.runs}</td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">{formatMs(row.p50_ms)}</td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">{formatMs(row.p95_ms)}</td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">
                  {tps === null ? "—" : tps.toFixed(1)}
                </td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">
                  {formatTokens(row.tokens)}
                </td>
                <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">
                  {formatCost(row.cost_usd)}
                </td>
                <td
                  className={`text-right tabular-nums py-1.5 pl-2 ${
                    fail !== null && fail >= 5 ? "text-vault-burgundy" : "text-vault-muted"
                  }`}
                >
                  {fail === null ? "—" : `${fail.toFixed(1)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
