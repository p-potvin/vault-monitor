// ── RunTimeline — run volume per bucket, stacked by provider ────────────────
//
// Mirrors ai-sessions/ToolTimeline, with one addition: a failure ribbon under
// each column. A provider that is busy *and* failing looks identical to a busy
// healthy one on a plain stacked chart, which is the case most worth spotting.

import { num, providerFill, type RunTimelinePoint } from "../types";

function bucketLabel(bucket: string, granularity: string): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket.slice(0, 10);
  if (granularity === "hour") {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", timeZone: "UTC" });
  }
  if (granularity === "month") {
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

interface Props {
  points: RunTimelinePoint[];
  bucket: string;
  emptyLabel: string;
  failuresLabel: string;
}

export default function RunTimeline({ points, bucket, emptyLabel, failuresLabel }: Props) {
  if (!points.length) return <div className="text-[13px] text-vault-muted">{emptyLabel}</div>;

  const buckets: string[] = [];
  const byBucket = new Map<string, Map<string, number>>();
  const failuresByBucket = new Map<string, number>();
  const providerTotals = new Map<string, number>();

  for (const p of points) {
    if (!byBucket.has(p.bucket)) {
      byBucket.set(p.bucket, new Map());
      buckets.push(p.bucket);
    }
    const row = byBucket.get(p.bucket)!;
    row.set(p.provider, (row.get(p.provider) ?? 0) + p.runs);
    providerTotals.set(p.provider, (providerTotals.get(p.provider) ?? 0) + p.runs);
    failuresByBucket.set(p.bucket, (failuresByBucket.get(p.bucket) ?? 0) + num(p.failures));
  }

  buckets.sort();
  const providers = [...providerTotals.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
  const columnTotals = buckets.map((b) =>
    [...(byBucket.get(b)?.values() ?? [])].reduce((sum, v) => sum + v, 0)
  );
  const peak = Math.max(...columnTotals, 1);

  const H = 178;
  const RIBBON = 4;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-end gap-[5px] w-full overflow-x-auto" style={{ height: H }}>
        {buckets.map((b, i) => {
          const row = byBucket.get(b)!;
          const total = columnTotals[i];
          const failures = failuresByBucket.get(b) ?? 0;
          const colHeight = Math.round((total / peak) * (H - 30));
          const tooltip = [
            `${bucketLabel(b, bucket)} — ${total} runs`,
            ...providers
              .filter((p) => (row.get(p) ?? 0) > 0)
              .map((p) => `  ${p}: ${row.get(p)}`),
            failures > 0 ? `  ${failuresLabel}: ${failures}` : ""
          ]
            .filter(Boolean)
            .join("\n");

          return (
            <div
              key={b}
              className="flex-1 min-w-[14px] flex flex-col items-center justify-end gap-1 group"
            >
              <span className="text-[10px] tabular-nums text-vault-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {total}
              </span>
              <div
                className="w-full flex flex-col-reverse rounded-[4px] overflow-hidden transition-all"
                style={{ height: Math.max(colHeight, total > 0 ? 3 : 0) }}
                title={tooltip}
              >
                {providers.map((provider) => {
                  const v = row.get(provider) ?? 0;
                  if (!v) return null;
                  return (
                    <div
                      key={provider}
                      className={providerFill(provider)}
                      style={{ height: `${(v / total) * 100}%` }}
                    />
                  );
                })}
              </div>
              <div
                className="w-full rounded-[2px] bg-vault-burgundy"
                style={{ height: failures > 0 ? RIBBON : 0 }}
                title={failures > 0 ? `${failures} ${failuresLabel}` : undefined}
              />
              <span className="text-[9px] text-vault-muted whitespace-nowrap">
                {bucketLabel(b, bucket)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {providers.map((provider) => (
          <span key={provider} className="flex items-center gap-1.5 text-[11px] text-vault-slate">
            <span
              className={`inline-block rounded-[2px] ${providerFill(provider)}`}
              style={{ width: 9, height: 9 }}
            />
            {provider}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11px] text-vault-slate">
          <span
            className="inline-block rounded-[2px] bg-vault-burgundy"
            style={{ width: 9, height: 9 }}
          />
          {failuresLabel}
        </span>
      </div>
    </div>
  );
}
