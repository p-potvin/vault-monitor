// ── LatencyHistogram — run duration distribution over fixed log-ish buckets ──

import { num, type LatencyBucket } from "../types";

function edgeLabel(ms: number): string {
  if (ms >= 60000) return `${ms / 60000}m`;
  if (ms >= 1000) return `${ms / 1000}s`;
  return `${ms}ms`;
}

function bucketLabel(bucket: LatencyBucket): string {
  const lo = num(bucket.lo);
  const hi = bucket.hi === null || bucket.hi === undefined ? null : num(bucket.hi);
  return hi === null ? `${edgeLabel(lo)}+` : `${edgeLabel(lo)}–${edgeLabel(hi)}`;
}

interface Props {
  buckets: LatencyBucket[];
  emptyLabel: string;
}

export default function LatencyHistogram({ buckets, emptyLabel }: Props) {
  const counts = buckets.map((b) => num(b.runs));
  const total = counts.reduce((sum, v) => sum + v, 0);
  if (!buckets.length || total === 0) {
    return <div className="text-[13px] text-vault-muted">{emptyLabel}</div>;
  }

  const peak = Math.max(...counts, 1);
  const H = 150;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-end gap-[4px] w-full overflow-x-auto" style={{ height: H }}>
        {buckets.map((bucket, i) => {
          const value = counts[i];
          const share = value / total;
          // Square-root scaling: a linear axis lets one dominant bucket flatten
          // every other bar to a hairline, which hides the tail that actually
          // matters when hunting slow runs.
          const height = Math.round(Math.sqrt(value / peak) * (H - 26));
          return (
            <div
              key={`${bucket.lo}`}
              className="flex-1 min-w-[26px] flex flex-col items-center justify-end gap-1 group"
            >
              <span className="text-[10px] tabular-nums text-vault-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {value}
              </span>
              <div
                className="w-full bg-vault-cyan rounded-[3px] transition-all"
                style={{ height: Math.max(height, value > 0 ? 3 : 0) }}
                title={`${bucketLabel(bucket)} — ${value} runs (${(share * 100).toFixed(1)}%)`}
              />
              <span className="text-[9px] text-vault-muted whitespace-nowrap leading-tight">
                {edgeLabel(num(bucket.lo))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
