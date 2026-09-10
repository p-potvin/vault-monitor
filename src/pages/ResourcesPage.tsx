import { useEffect, useMemo, useState } from "react";

import { getResources } from "../api";
import { useLangState, type Lang } from "../i18n";
import type { HostResourceSample, ResourceHost } from "../types";

const copy = {
  en: {
    title: "Resource monitor", subtitle: "Live fleet capacity, runtime pressure, and bounded history from the Health Ledger.",
    updated: "Updated", missing: "No resource sample has arrived from this host.", expand: "Show detail", collapse: "Hide detail",
    disk: "Disk", memory: "RAM", cpu: "CPU", bandwidth: "Bandwidth", journal: "Journal", docker: "Docker", media: "Media stack",
    available: "available", used: "used", month: "this month", noHistory: "History will appear after the next sample.",
    current: "Current", history: "30-day history", consumers: "Top consumers", failedUnits: "Failed units", refresh: "Refreshes every minute",
    root: "Root", external: "Mounted storage", caches: "Reclaimable", images: "Images", buildCache: "Build cache",
  },
  qc: {
    title: "Moniteur de ressources", subtitle: "Capacite de la flotte, pression runtime et historique borne du Health Ledger.",
    updated: "Mis a jour", missing: "Aucun echantillon de ressources n est encore arrive de cet hote.", expand: "Afficher le detail", collapse: "Masquer le detail",
    disk: "Disque", memory: "RAM", cpu: "CPU", bandwidth: "Bande passante", journal: "Journal", docker: "Docker", media: "Media stack",
    available: "disponible", used: "utilise", month: "ce mois-ci", noHistory: "L historique apparaitra apres le prochain echantillon.",
    current: "Actuel", history: "Historique de 30 jours", consumers: "Principaux consommateurs", failedUnits: "Unites en echec", refresh: "Actualisation chaque minute",
    root: "Racine", external: "Stockage monte", caches: "Recuperable", images: "Images", buildCache: "Cache de build",
  },
} satisfies Record<Lang, Record<string, string>>;

type Tone = "healthy" | "warning" | "alert" | "neutral";

function bytes(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = value;
  let index = 0;
  while (amount >= 1000 && index < units.length - 1) { amount /= 1000; index += 1; }
  return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
}

function percent(used?: number | null, total?: number | null) {
  return used == null || !total ? null : Math.round((used / total) * 100);
}

function toneFor(value?: number | null, warning = 75, alert = 90): Tone {
  if (value == null) return "neutral";
  if (value >= alert) return "alert";
  if (value >= warning) return "warning";
  return "healthy";
}

function age(timestamp?: string) {
  if (!timestamp) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.round(seconds / 3600)}h`;
}

function resourceMetrics(sample: HostResourceSample, t: Record<string, string>) {
  const root = sample.disks?.find((disk) => disk.target === "/");
  const external = sample.disks?.find((disk) => disk.target === "/mnt/data");
  const memoryUsed = sample.memory ? percent(sample.memory.total_bytes! - sample.memory.free_bytes!, sample.memory.total_bytes) : null;
  const docker = sample.docker || [];
  const dockerUsed = docker.reduce((total, item) => total + (item.size_bytes || 0), 0);
  const dockerReclaimable = docker.reduce((total, item) => total + (item.reclaimable_bytes || 0), 0);
  return [
    { id: "disk", label: t.disk, value: root ? `${root.used_percent}%` : "—", note: root ? `${bytes(root.available_bytes)} ${t.available}` : "—", tone: toneFor(root?.used_percent), history: (item: HostResourceSample) => item.disks?.find((disk) => disk.target === "/")?.used_percent ?? null },
    { id: "memory", label: t.memory, value: memoryUsed == null ? "—" : `${memoryUsed}%`, note: sample.memory ? `${bytes(sample.memory.free_bytes)} ${t.available}` : "—", tone: toneFor(memoryUsed, 80, 92), history: (item: HostResourceSample) => item.memory ? percent(item.memory.total_bytes! - item.memory.free_bytes!, item.memory.total_bytes) : null },
    { id: "cpu", label: t.cpu, value: sample.cpu?.load_percent == null ? "—" : `${sample.cpu.load_percent}%`, note: sample.cpu?.cores ? `${sample.cpu.load_1?.toFixed(2)} / ${sample.cpu.cores} load` : "—", tone: toneFor(sample.cpu?.load_percent, 70, 90), history: (item: HostResourceSample) => item.cpu?.load_percent ?? null },
    { id: "bandwidth", label: t.bandwidth, value: bytes((sample.bandwidth?.month_rx_bytes || 0) + (sample.bandwidth?.month_tx_bytes || 0)), note: t.month, tone: "neutral" as Tone, history: (item: HostResourceSample) => ((item.bandwidth?.month_rx_bytes || 0) + (item.bandwidth?.month_tx_bytes || 0)) / 1e9 },
    { id: "journal", label: t.journal, value: bytes(sample.journal_bytes), note: sample.failed_systemd_units ? `${sample.failed_systemd_units} ${t.failedUnits}` : t.current, tone: toneFor((sample.journal_bytes || 0) / 1e6, 500, 750), history: (item: HostResourceSample) => (item.journal_bytes || 0) / 1e6 },
    { id: "docker", label: t.docker, value: bytes(dockerUsed), note: dockerReclaimable ? `${bytes(dockerReclaimable)} ${t.caches}` : t.current, tone: "neutral" as Tone, history: (item: HostResourceSample) => (item.docker || []).reduce((total, entry) => total + (entry.size_bytes || 0), 0) / 1e9 },
    { id: "media", label: t.media, value: bytes(sample.media_stack_bytes), note: external ? `${external.used_percent}% ${t.used} ${t.external.toLowerCase()}` : t.current, tone: toneFor(external?.used_percent), history: (item: HostResourceSample) => (item.media_stack_bytes || 0) / 1e9 },
  ];
}

function Sparkline({ points, tone }: { points: Array<number | null>; tone: Tone }) {
  const values = points.filter((value): value is number => value != null);
  if (values.length < 2) return <span className="resource-no-history">—</span>;
  const max = Math.max(...values, 1);
  return <span className={`resource-spark tone-${tone}`} aria-hidden="true">{points.slice(-24).map((value, index) => <i key={index} style={{ height: `${Math.max(10, ((value || 0) / max) * 100)}%` }} />)}</span>;
}

function HostCard({ host, expanded, onToggle, t }: { host: ResourceHost; expanded: boolean; onToggle: () => void; t: Record<string, string> }) {
  const sample = host.latest;
  if (!sample) return <section className="resource-host resource-missing"><header><div><span className="status-led stale" /><strong>{host.label}</strong></div><span>{t.updated} —</span></header><p>{t.missing}</p></section>;
  const metrics = resourceMetrics(sample, t);
  const history = host.minute_history.length ? host.minute_history : [sample];
  const root = sample.disks?.find((disk) => disk.target === "/");
  const external = sample.disks?.find((disk) => disk.target === "/mnt/data");
  const docker = sample.docker || [];
  return <section className="resource-host">
    <header className="resource-host-head"><div><span className="status-led healthy" /><strong>{host.label}</strong><span className="resource-host-id">{host.id}</span></div><span>{t.updated} {age(sample.timestamp)} ago</span></header>
    <div className="resource-metric-grid">{metrics.map((metric) => <button className={`resource-metric tone-${metric.tone}`} onClick={onToggle} key={metric.id} aria-expanded={expanded}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small><Sparkline tone={metric.tone} points={history.map(metric.history)} /></button>)}</div>
    <button className="resource-expand" onClick={onToggle} aria-expanded={expanded}>{expanded ? t.collapse : t.expand}</button>
    {expanded && <div className="resource-detail">
      <section><h2>{t.history}</h2><div className="resource-history-grid">{metrics.map((metric) => <div key={metric.id}><span>{metric.label}</span><Sparkline tone={metric.tone} points={(host.daily_history.length ? host.daily_history : history).map(metric.history)} /></div>)}</div></section>
      <section><h2>{t.consumers}</h2><dl className="resource-facts">
        <div><dt>{t.root}</dt><dd>{root ? `${bytes(root.used_bytes)} / ${bytes(root.total_bytes)} · ${root.used_percent}%` : "—"}</dd></div>
        <div><dt>{t.external}</dt><dd>{external ? `${bytes(external.used_bytes)} / ${bytes(external.total_bytes)} · ${external.used_percent}%` : "—"}</dd></div>
        <div><dt>{t.journal}</dt><dd>{bytes(sample.journal_bytes)}</dd></div>
        <div><dt>{t.images}</dt><dd>{bytes(docker.find((item) => item.type === "Images")?.size_bytes)}</dd></div>
        <div><dt>{t.buildCache}</dt><dd>{bytes(docker.find((item) => item.type === "Build Cache")?.size_bytes)}</dd></div>
        <div><dt>{t.media}</dt><dd>{bytes(sample.media_stack_bytes)}</dd></div>
      </dl>
    </section>
  </div>}
  </section>;
}

export function ResourcesPage({ setLoading }: { setLoading: (loading: boolean) => void }) {
  const [lang] = useLangState();
  const t = copy[lang];
  const [hosts, setHosts] = useState<ResourceHost[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLocalLoading] = useState(true);
  const load = () => getResources().then((body) => { setHosts(body.hosts); setError(""); }).catch((reason: Error) => setError(reason.message)).finally(() => { setLocalLoading(false); setLoading(false); });
  useEffect(() => { setLoading(true); load(); const id = window.setInterval(load, 60_000); return () => window.clearInterval(id); }, []);
  if (loading) return null;
  return <main className="view-stack resource-page"><header className="resource-page-head"><div><h1>{t.title}</h1><p>{t.subtitle}</p></div><span className="resource-refresh">{t.refresh}</span></header>{error && <div className="error-line">{error}</div>}<div className="resource-fleet">{hosts.map((host) => <HostCard host={host} t={t} expanded={expanded === host.id} onToggle={() => setExpanded((current) => current === host.id ? null : host.id)} key={host.id} />)}</div></main>;
}
