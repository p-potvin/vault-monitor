import { useEffect, useState } from "react";
import type { DeployProject, DeploysResponse } from "../../api";
import { getDeploys } from "../../api";

/**
 * Deployments panel — one row per (project, target) across the fleet.
 *
 * Reads /monitor/deploys (documented at
 * vaultwares-docs/docs-content/operations/deploy-status-api.mdx). Each
 * project's deploy script writes /var/lib/vw-deploy/status/<project>.json
 * on completion; this panel just renders that.
 *
 * Same endpoint is polled by the Prom-King admin Marketing tab. If a target
 * shape needs to change, coordinate the two callers.
 */
export function DeploysPanel() {
  const [data, setData] = useState<DeploysResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const tick = async () => {
      try {
        const body = await getDeploys({ logs: false }, controller.signal);
        if (!cancelled) setData(body);
      } catch (reason) {
        const err = reason as Error;
        if (!cancelled && err.name !== "AbortError") setError(err.message);
      }
    };
    void tick();
    const timer = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  if (error) return <div className="error-line">{error}</div>;
  if (!data) return <div className="page-state">Loading deploys...</div>;

  const projects = Object.values(data.projects);
  const rows = projects.flatMap((p) => p.targets.map((t) => ({ project: p, target: t })));

  if (rows.length === 0) {
    return (
      <section className="table-shell">
        <p style={{ padding: "16px 20px", opacity: 0.7 }}>
          No deploys registered yet. Each project's deploy script writes
          <code> /var/lib/vw-deploy/status/&lt;project&gt;.json</code> on
          completion — see the deploy-status-api docs.
        </p>
      </section>
    );
  }

  return (
    <section className="table-shell">
      <table className="services-table">
        <thead>
          <tr>
            <th>Project · target</th>
            <th>Version</th>
            <th>SHA</th>
            <th>systemd</th>
            <th>Last build</th>
            <th>Phase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ project, target }) => (
            <tr key={target.id}>
              <td>
                <strong>{target.id}</strong>
                <span>{project.project}</span>
              </td>
              <td>{target.version ?? "-"}</td>
              <td>
                <code>{(target.sha ?? "").slice(0, 7) || "-"}</code>
              </td>
              <td>{targetSystemd(target)}</td>
              <td>{formatBuildTime(project)}</td>
              <td>
                <span className={`status-label status-${phaseClass(project.last_build.phase)}`}>
                  {project.last_build.phase}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function targetSystemd(t: DeployProject["targets"][number]): string {
  if (!t.systemd) return "-";
  return `${t.systemd.unit} (${t.systemd.active})`;
}

function formatBuildTime(p: DeployProject): string {
  const b = p.last_build;
  const t = b.finished_at ?? b.started_at;
  if (!t) return "-";
  return new Date(t).toLocaleString();
}

function phaseClass(phase: DeployProject["last_build"]["phase"]): string {
  if (phase === "ok") return "healthy";
  if (phase === "failed") return "offline";
  if (phase === "building") return "stale";
  return "unknown";
}
