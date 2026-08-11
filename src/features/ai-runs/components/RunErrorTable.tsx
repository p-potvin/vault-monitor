// ── RunErrorTable — failure classes, most frequent first ────────────────────

import { STATUS_COLORS, type RunErrorRow } from "../types";

function ago(value: string | null): string {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

interface Labels {
  errorClass: string;
  status: string;
  runs: string;
  models: string;
  last: string;
}

interface Props {
  rows: RunErrorRow[];
  labels: Labels;
  emptyLabel: string;
}

export default function RunErrorTable({ rows, labels, emptyLabel }: Props) {
  if (!rows.length) return <div className="text-[13px] text-vault-muted">{emptyLabel}</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="text-vault-muted text-[10px] uppercase tracking-[0.06em]">
            <th className="text-left font-bold py-1.5 pr-3">{labels.errorClass}</th>
            <th className="text-left font-bold py-1.5 px-2">{labels.status}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.runs}</th>
            <th className="text-right font-bold py-1.5 px-2">{labels.models}</th>
            <th className="text-right font-bold py-1.5 pl-2">{labels.last}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.error_class}:${row.status}`} className="border-t border-vault-border/40">
              <td className="py-1.5 pr-3 min-w-0">
                <span
                  className="text-vault-fg overflow-hidden text-ellipsis whitespace-nowrap block"
                  style={{ maxWidth: 260 }}
                  // The last message carries the detail that makes a class
                  // actionable, but it is far too long for a cell.
                  title={row.last_message ?? row.error_class}
                >
                  {row.error_class}
                </span>
                {row.last_model && (
                  <span className="text-[10px] text-vault-muted">{row.last_model}</span>
                )}
              </td>
              <td className="py-1.5 px-2">
                <span className="inline-flex items-center gap-1.5 text-vault-slate">
                  <span
                    className={`inline-block rounded-[2px] ${
                      STATUS_COLORS[row.status] ?? "bg-vault-slate"
                    }`}
                    style={{ width: 8, height: 8 }}
                  />
                  {row.status}
                </span>
              </td>
              <td className="text-right tabular-nums py-1.5 px-2 text-vault-fg">{row.runs}</td>
              <td className="text-right tabular-nums py-1.5 px-2 text-vault-slate">{row.models}</td>
              <td className="text-right tabular-nums py-1.5 pl-2 text-vault-muted">
                {ago(row.latest)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
