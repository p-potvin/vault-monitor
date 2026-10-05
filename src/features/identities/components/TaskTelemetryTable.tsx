import React from "react";
import type { IdentityTaskLog } from "../types";

interface TaskTelemetryTableProps {
  tasks: IdentityTaskLog[];
}

export function TaskTelemetryTable({ tasks }: TaskTelemetryTableProps) {
  return (
    <div className="tasks-tab-container warm-card">
      <div className="card-header">
        <h2>Task Execution Telemetry & Performance Logs</h2>
        <span className="point-count-pill">{tasks.length} Real Task Records</span>
      </div>

      <div className="table-responsive">
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Gallery</th>
              <th>Task Type</th>
              <th>Target Model</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Scanned</th>
              <th>Matched</th>
              <th>Outliers</th>
              <th>Quarantined</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td className="font-mono text-[11px]">
                  {t.created_at ? t.created_at.replace("T", " ").replace("Z", "").slice(0, 19) : "—"}
                </td>
                <td>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]">
                    {t.gallery_name || t.gallery_id || "Local PC"}
                  </span>
                </td>
                <td>
                  <span className={`task-badge ${t.task_type}`}>{t.task_type}</span>
                </td>
                <td>
                  <strong>{t.target_model ?? "—"}</strong>
                </td>
                <td>
                  <span
                    className={`status-led ${t.status === "completed" ? "healthy" : "offline"}`}
                  />
                  <span className="ml-1 capitalize">{t.status}</span>
                </td>
                <td className="font-mono">{t.duration_ms} ms</td>
                <td className="font-mono">{t.images_scanned}</td>
                <td className="font-mono">{t.matched_count}</td>
                <td className="font-mono">{t.outliers_count}</td>
                <td className="font-mono">{t.quarantined_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
