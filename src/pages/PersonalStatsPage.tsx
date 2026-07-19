import { Card } from '../components/Card';
import { Led } from '../components/Led';
import { useMemo, useState, type ReactNode } from 'react';
import { useInputTrackerData } from '../useData';
import { I18N, useLangState, type Lang } from '../i18n';
import { IconActivity, IconBarChart, IconClock, IconDatabase, IconInfo, IconPieChart, IconZap } from '../icons';

const fmtInt = (n: number | undefined) =>
  new Intl.NumberFormat().format(Math.trunc(Number.isFinite(n || 0) ? n || 0 : 0));
const fmt1 = (n: number | undefined) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Number.isFinite(n || 0) ? n || 0 : 0);
const fmtPct = (n: number | undefined) =>
  new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(Number.isFinite(n || 0) ? n || 0 : 0);
const fmtMaybePct = (n: unknown) =>
  typeof n === 'number' ? new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(n) : '-';
const fmtPctPoints = (n: unknown) => (typeof n === 'number' ? `${fmt1(n)}%` : '-');
const fmtMinutes = (seconds: number | undefined) => `${fmt1((seconds || 0) / 60)}m`;
const fmtMinutesValue = (seconds: number | undefined) => fmt1((seconds || 0) / 60);
const fmtValue = (value: unknown) => (typeof value === 'number' ? fmt1(value) : String(value || '-'));
const fmtUnit = (value: unknown, unit: string) => (typeof value === 'number' ? `${fmt1(value)}${unit}` : '-');
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

const INPUT_RANGES = [
  { id: 'today', hours: 24, labelKey: 'rangeToday', hintKey: 'rangeTodayHint' },
  { id: 'week', hours: 168, labelKey: 'rangeWeek', hintKey: 'rangeWeekHint' },
  { id: 'month', hours: 720, labelKey: 'rangeMonth', hintKey: 'rangeMonthHint' },
  { id: 'all', hours: 24 * 365 * 20, labelKey: 'rangeAll', hintKey: 'rangeAllHint' },
] as const;

type InputRangeId = (typeof INPUT_RANGES)[number]['id'];

import { InfoTooltip } from '../components/InfoTooltip';
function WidgetTitle({ icon, title, tooltip }: { icon?: ReactNode; title: string; tooltip: string }) {
  return (
    <h2 className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider m-0 mb-3 flex items-center gap-1.5">
      {icon}
      <span>{title}</span>
      <InfoTooltip text={tooltip} />
    </h2>
  );
}

function MetricCard({ label, value, tooltip, sub, className = "col-span-3 max-lg:col-span-6 max-md:col-span-12" }: { label: string; value: string; tooltip: string; sub?: string; className?: string }) {
  return (
    <Card className={className}>
      <div className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
        <span>{label}</span>
        <InfoTooltip text={tooltip} />
      </div>
      <div className="mt-2 text-[28px] leading-tight font-bold text-[var(--fg)]">{value}</div>
      {sub ? <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div> : null}
    </Card>
  );
}

function MiniStat({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,black)] px-3 py-2 min-w-0">
      <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider truncate flex items-center gap-1.5">
        <span className="truncate">{label}</span>
        {tooltip ? <InfoTooltip text={tooltip} /> : null}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--fg)] truncate">{value}</div>
    </div>
  );
}

function BarRows({
  rows,
  empty,
  formatName = (name) => name,
  formatValue = (row) => fmtInt(row.count),
  valueHeader,
}: {
  rows?: { name: string; count: number; category?: string }[];
  empty: string;
  formatName?: (name: string, row: { name: string; count: number; category?: string }) => string;
  formatValue?: (row: { name: string; count: number; category?: string }) => string;
  valueHeader?: string;
}) {
  const max = Math.max(1, ...(rows || []).map((row) => row.count || 0));
  if (!rows || rows.length === 0) {
    return <div className="text-xs text-[var(--muted)] italic">{empty}</div>;
  }
  return (
    <div className="space-y-2">
      {valueHeader ? (
        <div className="grid grid-cols-[minmax(84px,150px)_1fr_72px] items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          <span />
          <span />
          <span className="text-right">{valueHeader}</span>
        </div>
      ) : null}
      {rows.slice(0, 10).map((row) => (
        <div key={row.name} className="grid grid-cols-[minmax(84px,150px)_1fr_72px] items-center gap-2">
          <div className="text-xs text-[var(--fg)] truncate" title={formatName(row.name, row)}>{formatName(row.name, row)}</div>
          <div className="h-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.max(2, ((row.count || 0) / max) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-right tabular-nums text-[var(--muted)]">{formatValue(row)}</div>
        </div>
      ))}
    </div>
  );
}

function statusTone(status?: string): 'online' | 'warning' | 'alert' {
  if (status === 'online') return 'online';
  if (status === 'stale') return 'warning';
  return 'alert';
}

function StatusPill({ status, label, source, tooltip }: { status?: string; label: string; source?: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5">
      <Led status={statusTone(status)} size={7} className="vw-status-led" />
      <div className="leading-tight">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg)]">{label}</div>
        {source ? <div className="text-[10px] text-[var(--muted)]">{source}</div> : null}
      </div>
      <InfoTooltip text={tooltip} />
    </div>
  );
}

function RecentEvents({ events, lang }: { events: NonNullable<ReturnType<typeof useInputTrackerData>['data']>['events']; lang: Lang }) {
  const dict = I18N[lang];
  if (!events || events.length === 0) {
    return <div className="text-xs text-[var(--muted)] italic">{dict.noEvents}</div>;
  }
  return (
    <div className="space-y-2">
      {events.slice(0, 8).map((event) => (
        <div key={event.event_id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <IconClock width={13} height={13} className="text-[var(--muted)]" />
            <span className="text-[var(--fg)]">{event.timestamp || '-'}</span>
            <span className="ml-auto text-[var(--muted)]">{event.event_type}</span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1 max-sm:grid-cols-2">
            <MiniStat label={dict.input.activeTime} value={`${fmt1(num(event.metrics?.active_seconds) || 0)}s`} />
            <MiniStat label={dict.input.keysShort} value={fmtInt(num(event.metrics?.keystrokes))} />
            <MiniStat label={dict.input.clicks} value={fmtInt(num(event.metrics?.clicks))} />
            <MiniStat label={dict.input.scroll} value={fmtInt(num(event.metrics?.scroll_ticks))} />
            <MiniStat label={dict.input.contextSwitches} value={fmtInt(num(event.metrics?.context_switches))} />
          </div>
          <div className="mt-2 text-[11px] text-[var(--muted)] truncate" title={`${String(event.dimensions?.focus_category || 'unknown')} - ${String(event.dimensions?.window_name || 'unknown')}`}>
            {dict.input.focusShort}: {String(event.dimensions?.focus_category || 'unknown')} / {dict.input.appShort}: {String(event.dimensions?.window_name || 'unknown')}
          </div>
        </div>
      ))}
    </div>
  );
}

function humanLatency(name: string, labels: Record<string, string>) {
  return labels[name] || name.replace(/_/g, ' ');
}

function humanHotspot(name: string, input: typeof I18N.en.input) {
  const [col, row] = name.split(':');
  const c = Number(col);
  const r = Number(row);
  if (Number.isFinite(c) && Number.isFinite(r)) {
    const vertical = r === 0 ? 'top' : r >= 8 ? 'bottom' : r <= 2 ? 'upper' : r >= 6 ? 'lower' : 'middle';
    const horizontal = c === 0 ? 'left edge' : c >= 11 ? 'right edge' : c <= 2 ? 'left side' : c >= 9 ? 'right side' : 'center';
    if (r >= 8 && c === 0) return `Start/taskbar area (${input.hotspotRaw} ${name})`;
    if (r >= 8 && c >= 11) return `Clock/show desktop area (${input.hotspotRaw} ${name})`;
    if (r === 0 && c >= 10) return `Window controls area (${input.hotspotRaw} ${name})`;
    if (r === 0 && c === 0) return `Top-left app controls (${input.hotspotRaw} ${name})`;
    return `${vertical} ${horizontal} (${input.hotspotRaw} ${name})`;
  }
  return name;
}

function countFrom(totals: Record<string, number>, keys: string[]) {
  for (const key of keys) {
    const value = totals[key];
    if (typeof value === 'number') return value;
  }
  return 0;
}

function KpiStat({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return <MiniStat label={label} value={value} tooltip={tooltip} />;
}

type PathPoint = { x: number; y: number; tMs?: number };
type MousePath = { id: string; trigger: string; endedReason: string; durationMs: number; distancePx: number; points: PathPoint[] };

const signalColors = ['var(--vault-signal-online)', 'var(--vault-signal-relay)', 'var(--vault-signal-sync)', 'var(--vault-signal-warning)', 'var(--vault-signal-alert)'];

function extractMousePaths(events: NonNullable<ReturnType<typeof useInputTrackerData>['data']>['events']): MousePath[] {
  if (!events) return [];
  return events.flatMap((event, index) => {
    if (event.event_type !== 'natural_path') return [];
    const metrics = event.metrics || {};
    const raw = metrics.mouse_path;
    const points: PathPoint[] = Array.isArray(raw)
      ? (raw as Record<string, unknown>[]).map((point) => {
          const x = num(point.x);
          const y = num(point.y);
          if (typeof x !== 'number' || typeof y !== 'number') return null;
          const tMs = num(point.t_ms);
          return { x, y, ...(typeof tMs === 'number' ? { tMs } : {}) } as PathPoint;
        }).filter((p): p is PathPoint => p !== null)
      : [];
    if (points.length < 2) return [];
    return [{
      id: String(metrics.path_id || event.event_id || `path-${index}`),
      trigger: String(metrics.trigger || 'activity'),
      endedReason: String((raw as { ended_reason?: string } | undefined)?.ended_reason || 'completed'),
      durationMs: num(metrics.duration_ms) || 0,
      distancePx: num(metrics.mouse_distance_px) || num((raw as { stats?: { distance_px?: number } } | undefined)?.stats?.distance_px) || 0,
      points,
    }];
  });
}

function pathDetails(path: MousePath) {
  const first = path.points[0];
  const last = path.points[path.points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'rightward' : 'leftward') : (dy >= 0 ? 'downward' : 'upward');
  return { direction, headline: `${direction} ${path.trigger} path` };
}

function MousePathCanvas({ paths, selectedId, hoveredId, onSelect, onHover, input }: { paths: MousePath[]; selectedId?: string; hoveredId?: string; onSelect: (id: string) => void; onHover: (id?: string) => void; input: typeof I18N.en.input }) {
  const points = paths.flatMap((path) => path.points);
  const minX = Math.min(...points.map((point) => point.x), 0);
  const maxX = Math.max(...points.map((point) => point.x), 1);
  const minY = Math.min(...points.map((point) => point.y), 0);
  const maxY = Math.max(...points.map((point) => point.y), 1);
  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);
  const toCanvas = (point: PathPoint) => ({ x: 34 + ((point.x - minX) / rangeX) * 932, y: 28 + ((point.y - minY) / rangeY) * 424 });
  const active = paths.find((path) => path.id === (hoveredId || selectedId));

  if (paths.length === 0) return <div className="mouse-path-empty">{input.mousePathEmpty}</div>;

  return (
    <div className="mouse-path-stage">
      <svg className="mouse-path-canvas" viewBox="0 0 1000 480" role="img" aria-label="Layered natural mouse paths">
        <defs>
          <filter id="mouse-path-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="mouse-path-grid" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="var(--vault-signal-sync)" stopOpacity=".16" /><stop offset="1" stopColor="var(--vault-signal-relay)" stopOpacity=".02" /></linearGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="480" rx="18" fill="url(#mouse-path-grid)" />
        <path d="M34 400H966 M34 300H966 M34 200H966 M34 100H966 M200 28V452 M400 28V452 M600 28V452 M800 28V452" stroke="var(--vault-console-border-subtle)" strokeDasharray="3 12" />
        {paths.map((path, index) => {
          const d = path.points.map((point, pointIndex) => { const mapped = toCanvas(point); return `${pointIndex === 0 ? 'M' : 'L'}${mapped.x.toFixed(1)} ${mapped.y.toFixed(1)}`; }).join(' ');
          const activePath = path.id === (hoveredId || selectedId);
          return <path key={path.id} d={d} fill="none" stroke={signalColors[index % signalColors.length]} strokeWidth={activePath ? 4 : 1.7} strokeLinecap="round" strokeLinejoin="round" opacity={activePath ? 1 : 0.27} filter={activePath ? 'url(#mouse-path-glow)' : undefined} className={path.id === selectedId ? 'mouse-path-preview' : undefined} tabIndex={0} role="button" aria-label={`Preview ${pathDetails(path).headline}`} onMouseEnter={() => onHover(path.id)} onMouseLeave={() => onHover(undefined)} onFocus={() => onHover(path.id)} onBlur={() => onHover(undefined)} onClick={() => onSelect(path.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(path.id); } }} />;
        })}
      </svg>
      {active ? <div className="mouse-path-tooltip"><strong>{pathDetails(active).headline}</strong><span>{active.points.length} points · {fmt1(active.distancePx)} px · {fmt1(active.durationMs / 1000)}s</span><small>{active.endedReason} · {input.mousePathClickHint}</small></div> : null}
    </div>
  );
}

function MousePathWidget({ paths, input }: { paths: MousePath[]; input: typeof I18N.en.input }) {
  const [selectedId, setSelectedId] = useState<string>();
  const [hoveredId, setHoveredId] = useState<string>();
  const totalPoints = paths.reduce((sum, path) => sum + path.points.length, 0);
  const selected = paths.find((path) => path.id === selectedId);
  return <Card className="col-span-12">
    <WidgetTitle icon={<IconActivity width={13} height={13} />} title={input.mousePathTitle} tooltip={input.mousePathTooltip} />
    <div className="mouse-path-header"><div><strong>{paths.length ? `${fmtInt(paths.length)} ${input.mousePathsInField}` : input.mousePathNone}</strong><span>{fmtInt(totalPoints)} {input.mousePathPointsSuffix} · {input.mousePathDensityView}</span></div>{selected ? <div className="mouse-path-selection"><b>{input.mousePathPreviewing}</b><span>{pathDetails(selected).headline}</span></div> : <div className="mouse-path-selection"><b>{input.activeWindowLabel}</b><span>{input.mousePathHoverHint}</span></div>}</div>
    <MousePathCanvas paths={paths} selectedId={selectedId} hoveredId={hoveredId} onSelect={setSelectedId} onHover={setHoveredId} input={input} />
  </Card>;
}

function HotspotMonitor({ rows, input }: { rows?: { name: string; count: number }[]; input: typeof I18N.en.input }) {
  const [hovered, setHovered] = useState<string>();
  const [tapped, setTapped] = useState<string>();
  const values = new Map((rows || []).map((row) => [row.name, row.count || 0]));
  const max = Math.max(1, ...(rows || []).map((row) => row.count || 0));
  const total = (rows || []).reduce((sum, row) => sum + (row.count || 0), 0);
  const cells = Array.from({ length: 9 }, (_, row) => Array.from({ length: 12 }, (_, col) => `${col}:${row}`));
  const activeName = hovered ?? tapped;
  const active = activeName ? { name: activeName, count: values.get(activeName) || 0 } : undefined;
  return <div className="hotspot-monitor-wrap">
    <div className="hotspot-monitor" role="img" aria-label="Click hotspot screen map">
      <div className="hotspot-monitor-top"><span /> <i /> <i /> <i /></div>
      <div className="hotspot-screen">{cells.flat().map((name) => { const count = values.get(name) || 0; const intensity = count / max; return <span key={name} className="hotspot-cell" style={{ '--hotspot-intensity': intensity } as React.CSSProperties} onMouseEnter={() => setHovered(name)} onMouseLeave={() => setHovered(undefined)} onClick={() => setTapped(name)} title={`${humanHotspot(name, input)}: ${fmtInt(count)} ${input.clicksUnit}`} />; })}</div>
      <div className="hotspot-taskbar"><span /><span /><span /><b /></div>
    </div>
    <div className="hotspot-tooltip">{active ? <><strong>{humanHotspot(active.name, input)}</strong><span>{fmtInt(active.count)} {input.clicksUnit} · {total ? fmtPct(active.count / total) : '0%'} {input.hotspotOfSampledClicks}</span><small>{input.hotspotRaw} {active.name}</small></> : <><strong>{input.hotspotHoverPrompt}</strong><span>{input.hotspotHoverHint}</span><small>{fmtInt(total)} {input.hotspotTotalSuffix}</small></>}</div>
  </div>;
}

function PauseBreakdown({ totals, input }: { totals: Record<string, number>; input: typeof I18N.en.input }) {
  const pause = countFrom(totals, ['pause_blocks', 'pauses_5m_20m', 'pause_count']);
  const healthy = countFrom(totals, ['healthy_pause_blocks', 'pauses_20m_60m', 'healthy_pause_count']);
  const timeOff = countFrom(totals, ['time_off_blocks', 'pauses_1h_plus', 'time_off_count']);
  const hasSplit = pause > 0 || healthy > 0 || timeOff > 0;
  return (
    <Card className="col-span-4 max-lg:col-span-6 max-md:col-span-12">
      <WidgetTitle title={input.pauseBreakdown} tooltip={input.tooltips.pauses} />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label={input.microPause} value={fmtInt(totals.micro_pauses)} tooltip={input.pauseMicroRange} />
        <MiniStat label={input.pause} value={fmtInt(pause)} tooltip={input.pauseRange} />
        <MiniStat label={input.healthyPause} value={fmtInt(healthy)} tooltip={input.healthyPauseRange} />
        <MiniStat label={input.timeOff} value={fmtInt(timeOff)} tooltip={input.timeOffRange} />
      </div>
      {!hasSplit && totals.rest_blocks ? (
        <div className="mt-2 text-[11px] leading-4 text-[var(--muted)]">
          {input.legacyPauseNote} {input.legacyRestBlocks}: {fmtInt(totals.rest_blocks)}.
        </div>
      ) : null}
    </Card>
  );
}

function statusLabel(status: string | undefined, input: typeof I18N.en.input) {
  if (status === 'online') return input.statusOnline;
  if (status === 'stale') return input.statusStale;
  if (status === 'missing') return input.statusMissing;
  return input.statusUnavailable;
}

export function PersonalStatsPage() {
  const [rangeId, setRangeId] = useState<InputRangeId>('week');
  const activeRange = INPUT_RANGES.find((range) => range.id === rangeId) || INPUT_RANGES[1];
  const { data, loading, error } = useInputTrackerData(activeRange.hours);
  const mousePaths = useMemo(() => extractMousePaths(data?.events), [data?.events]);
  const [lang] = useLangState();
  const dict = I18N[lang];
  const input = dict.input;
  const totals = data?.totals || {};
  const derived = data?.derived || {};
  const stale = !data || data.status !== 'online';
  const activeMinutes = (totals.active_seconds || 0) / 60;
  const contextSwitches = totals.context_switches || 0;
  const flowStability = activeMinutes / Math.max(1, contextSwitches);
  const kpis = data?.kpis || {};
  const focusRows = data?.focus_categories || [];
  const focusTotal = focusRows.reduce((sum, row) => sum + (row.count || 0), 0);
  const focusShare = (names: string[]) => {
    const count = focusRows
      .filter((row) => names.includes(row.name))
      .reduce((sum, row) => sum + (row.count || 0), 0);
    return focusTotal > 0 ? count / focusTotal : undefined;
  };
  const restMinutes = (totals.rest_gap_seconds_total || 0) / 60;
  const activeRestBalance = restMinutes > 0 ? activeMinutes / restMinutes : undefined;
  const selectedWindowLabel = `${input[activeRange.labelKey]} - ${input[activeRange.hintKey]}`;
  const activeHours = activeRange.hours || data?.window_hours || 0;
  const activeDays = activeHours > 0 ? Math.max(1, activeHours / 24) : undefined;
  const extraKpis = {
    keysPerSwitch: contextSwitches > 0 ? (totals.keystrokes || 0) / contextSwitches : undefined,
    charsPerSwitch: contextSwitches > 0 ? (totals.chars_typed || 0) / contextSwitches : undefined,
    savesPerHour: activeMinutes > 0 ? (totals.saves || 0) / (activeMinutes / 60) : undefined,
    correctionsPer1kChars: (totals.chars_typed || 0) > 0 ? (((totals.backspaces || 0) + (totals.deletes || 0)) / totals.chars_typed) * 1000 : undefined,
    pasteToTypeRatio: (totals.chars_typed || 0) > 0 ? (totals.chars_pasted || 0) / totals.chars_typed : undefined,
    shortcutShare: (totals.keystrokes || 0) > 0 ? (totals.shortcut_count || 0) / totals.keystrokes : undefined,
    pointerMetersPerHour: activeMinutes > 0 ? (totals.mouse_distance_m || 0) / (activeMinutes / 60) : undefined,
    activeMinutesPerDay: activeDays ? activeMinutes / activeDays : undefined,
    avgRestGap: num(kpis.rhythm?.avg_rest_gap_minutes),
    longestRestGap: num(kpis.rhythm?.longest_rest_gap_minutes) ?? ((totals.rest_gap_seconds_max || 0) / 60 || undefined),
  };

  if (loading) {
    return <div className="text-center py-20 text-[var(--muted)]">{dict.errors.loading}</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[var(--border)] mb-1">
        <div>
          <h1 className="text-xl font-bold m-0 flex items-center gap-2">
            <IconActivity width={18} height={18} className="text-[var(--accent)]" />
            {dict.inputTrackerTitle}
          </h1>
          <p className="m-0 mt-1 text-[var(--muted)] text-[13px]">{dict.inputTrackerSubtitle}</p>
          <p className="m-0 mt-2 text-[12px] text-[var(--accent)] font-semibold">
            {rangeId === 'week' ? input.windowLastWeekNotice : `${input.activeWindowLabel}: ${selectedWindowLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{input.timeWindow}</span>
          <div className="rounded-full border border-[var(--border)] bg-[var(--card)] p-1 flex items-center gap-1" aria-label={input.timeWindow}>
            {INPUT_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setRangeId(range.id)}
                className={`min-h-8 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${rangeId === range.id ? 'bg-[var(--accent)] text-[var(--vault-console-bg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}
                title={input[range.hintKey]}
              >
                {input[range.labelKey]}
              </button>
            ))}
            <InfoTooltip text={input.tooltips.timeWindow} />
          </div>
          <StatusPill status={data?.status} label={statusLabel(data?.status, input)} tooltip={input.tooltips.status} />
        </div>
      </div>

      {error ? (
        <Card className="mt-5 border-[color-mix(in_srgb,var(--v-burgundy)_60%,var(--border))]">
          <div className="flex items-center gap-2 text-[var(--v-burgundy)] font-semibold">
            <Led status="alert" size={8} />
            {dict.errors.failedToLoad}: {error}
          </div>
        </Card>
      ) : null}

      {stale ? (
        <Card className="mt-5">
          <div className="flex items-center gap-2 text-sm">
            <Led status={statusTone(data?.status)} size={8} />
            <strong>{input.offline}</strong>
            <span className="text-[var(--muted)]">{data?.message}</span>
          </div>
        </Card>
      ) : null}

      <section className="grid grid-cols-12 gap-3 mt-5">
        <MetricCard label={input.latest} value={data?.latest_received_at ? new Date(data.latest_received_at).toLocaleTimeString() : '-'} tooltip={input.tooltips.latest} sub={`${selectedWindowLabel} / ${data?.window_hours || activeRange.hours || '-'}h ${input.windowSuffix}`} />
        <MetricCard label={input.wpm} value={fmt1(derived.wpm)} tooltip={input.tooltips.wpm} sub={input.keyBursts} />
        <MetricCard label={input.cpm} value={fmt1(derived.cpm)} tooltip={input.tooltips.cpm} sub={`${fmtInt(totals.chars_typed)} ${input.chars}`} />
        <MetricCard label={input.correction} value={fmtPct(derived.correction_ratio)} tooltip={input.tooltips.correction} sub={`${fmtInt(totals.backspaces)} ${input.backspaces.toLowerCase()}`} />
        <MetricCard label={input.clickTravel} value={fmt1(derived.click_to_travel_ratio)} tooltip={input.tooltips.clickTravel} sub={`${fmtInt(totals.clicks)} ${input.clicks.toLowerCase()} / ${fmt1(totals.mouse_distance_m)}m`} />
        <MetricCard label={input.shortcuts} value={fmtInt(totals.shortcut_count)} tooltip={input.tooltips.shortcuts} sub={`${fmtInt(totals.saves)} ${input.saves} / ${fmtInt(totals.undo_redo)} ${input.undoRedo.toLowerCase()}`} />
        <MetricCard label={input.pauses} value={fmtInt(totals.micro_pauses)} tooltip={input.tooltips.pauses} sub={`${fmtInt(totals.rest_blocks)} ${input.restBlocks.toLowerCase()}`} />
        <MetricCard label={input.contextSwitches} value={fmtInt(contextSwitches)} tooltip={input.tooltips.contextSwitches} sub={`${fmtMinutesValue(totals.active_seconds)} ${input.contextSwitchActiveSub}`} />
        <MetricCard className="col-span-4 max-lg:col-span-6 max-md:col-span-12" label={input.flowStability} value={fmt1(flowStability)} tooltip={input.tooltips.flowStability} sub={input.flowMinutes} />
        <PauseBreakdown totals={totals} input={input} />
        <Card className="col-span-4 max-lg:col-span-12">
          <WidgetTitle title={input.mouse} tooltip={input.tooltips.mouse} />
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
            <MiniStat label={input.clicks} value={fmtInt(totals.clicks)} />
            <MiniStat label={input.scroll} value={fmtInt(totals.scroll_ticks)} />
            <MiniStat label={input.travel} value={`${fmt1(totals.mouse_distance_m)}m`} />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-12 gap-3 mt-5">
        <MousePathWidget paths={mousePaths} input={input} />
      </section>

      <section className="grid grid-cols-12 gap-3 mt-5">
        <Card className="col-span-4 max-lg:col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconZap width={13} height={13} />} title={input.latency} tooltip={input.tooltips.latency} />
          <BarRows
            rows={data?.key_latency_buckets}
            empty={input.noLatency}
            formatName={(name) => humanLatency(name, input.latencyLabels)}
            formatValue={(row) => `${fmtInt(row.count)} ${input.keySamplesUnit}`}
            valueHeader={input.latencyValueHeader}
          />
        </Card>
        <Card className="col-span-4 max-lg:col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconPieChart width={13} height={13} />} title={input.focus} tooltip={input.tooltips.focus} />
          <BarRows
            rows={data?.focus_categories}
            empty={input.noFocus}
            formatValue={(row) => `${fmtMinutesValue(row.count)} ${input.activeMinutesUnit}`}
            valueHeader={input.focusValueHeader}
          />
        </Card>
        <Card className="col-span-4 max-lg:col-span-12">
          <WidgetTitle icon={<IconBarChart width={13} height={13} />} title={input.hotspots} tooltip={input.tooltips.hotspots} />
          <div className="mb-3 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_74%,black)] px-3 py-2 text-[11px] leading-4 text-[var(--muted)]">
            <strong className="block text-[var(--fg)]">{input.hotspotLegendTitle}</strong>
            {input.hotspotLegend}
          </div>
          <HotspotMonitor rows={data?.click_hotspots} input={input} />
        </Card>
        <Card className="col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconPieChart width={13} height={13} />} title={input.focusWindows} tooltip={input.tooltips.focusWindows} />
          <BarRows
            rows={data?.focus_windows}
            empty={input.noFocusWindows}
            formatName={(name, row) => `${row.category || 'unknown'} · ${name}`}
            formatValue={(row) => `${fmtMinutesValue(row.count)} ${input.activeMinutesUnit}`}
            valueHeader={input.focusValueHeader}
          />
        </Card>
        <Card className="col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconBarChart width={13} height={13} />} title={input.kpiSignals} tooltip={input.tooltips.kpiSignals} />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <KpiStat label={input.kpiLabels.contextSwitchesPerHour} value={fmtValue(kpis.focus?.context_switches_per_hour)} tooltip={input.kpiTooltips.contextSwitchesPerHour} />
            <KpiStat label={input.kpiLabels.longestFocusBlock} value={fmtUnit(kpis.focus?.longest_focus_block_minutes, 'm')} tooltip={input.kpiTooltips.longestFocusBlock} />
            <KpiStat label={input.kpiLabels.avgRecovery} value={fmtUnit(kpis.focus?.avg_switch_recovery_seconds, 's')} tooltip={input.kpiTooltips.avgRecovery} />
            <KpiStat label={input.kpiLabels.activeRestBalance} value={typeof activeRestBalance === 'number' ? `${fmt1(activeRestBalance)}:1` : '-'} tooltip={input.kpiTooltips.activeRestBalance} />
            <KpiStat label={input.kpiLabels.otherUnknownShare} value={fmtMaybePct(focusShare(['other', 'unknown']))} tooltip={input.kpiTooltips.otherUnknownShare} />
            <KpiStat label={input.kpiLabels.communicationShare} value={fmtMaybePct(focusShare(['communication']))} tooltip={input.kpiTooltips.communicationShare} />
            <KpiStat label={input.kpiLabels.keysPerSwitch} value={fmtValue(extraKpis.keysPerSwitch)} tooltip={input.kpiTooltips.keysPerSwitch} />
            <KpiStat label={input.kpiLabels.charsPerSwitch} value={fmtValue(extraKpis.charsPerSwitch)} tooltip={input.kpiTooltips.charsPerSwitch} />
            <KpiStat label={input.kpiLabels.pasteShare} value={fmtMaybePct(kpis.typing?.paste_share)} tooltip={input.kpiTooltips.pasteShare} />
            <KpiStat label={input.kpiLabels.shortcutDensity} value={fmtValue(kpis.typing?.shortcut_density_per_1000_keys)} tooltip={input.kpiTooltips.shortcutDensity} />
            <KpiStat label={input.kpiLabels.saveCadence} value={fmtUnit(kpis.typing?.save_cadence_minutes, 'm')} tooltip={input.kpiTooltips.saveCadence} />
            <KpiStat label={input.kpiLabels.savesPerHour} value={fmtValue(extraKpis.savesPerHour)} tooltip={input.kpiTooltips.savesPerHour} />
            <KpiStat label={input.kpiLabels.undoRedoRate} value={fmtValue(kpis.typing?.undo_redo_per_1000_keys)} tooltip={input.kpiTooltips.undoRedoRate} />
            <KpiStat label={input.kpiLabels.correctionsPer1kChars} value={fmtValue(extraKpis.correctionsPer1kChars)} tooltip={input.kpiTooltips.correctionsPer1kChars} />
            <KpiStat label={input.kpiLabels.pasteToTypeRatio} value={fmtValue(extraKpis.pasteToTypeRatio)} tooltip={input.kpiTooltips.pasteToTypeRatio} />
            <KpiStat label={input.kpiLabels.shortcutShare} value={fmtMaybePct(extraKpis.shortcutShare)} tooltip={input.kpiTooltips.shortcutShare} />
            <KpiStat label={input.kpiLabels.clicksPerMinute} value={fmtValue(kpis.pointer?.clicks_per_active_minute)} tooltip={input.kpiTooltips.clicksPerMinute} />
            <KpiStat label={input.kpiLabels.scrollsPerMinute} value={fmtValue(kpis.pointer?.scrolls_per_active_minute)} tooltip={input.kpiTooltips.scrollsPerMinute} />
            <KpiStat label={input.kpiLabels.pointerMetersPerHour} value={fmtValue(extraKpis.pointerMetersPerHour)} tooltip={input.kpiTooltips.pointerMetersPerHour} />
            <KpiStat label={input.kpiLabels.hotspotShare} value={fmtMaybePct(kpis.pointer?.hotspot_top_share)} tooltip={input.kpiTooltips.hotspotShare} />
            <KpiStat label={input.kpiLabels.bestHour} value={fmtValue(kpis.rhythm?.best_hour_utc)} tooltip={input.kpiTooltips.bestHour} />
            <KpiStat label={input.kpiLabels.bestDay} value={fmtValue(kpis.rhythm?.best_day)} tooltip={input.kpiTooltips.bestDay} />
            <KpiStat label={input.kpiLabels.activeMinutesPerDay} value={fmtValue(extraKpis.activeMinutesPerDay)} tooltip={input.kpiTooltips.activeMinutesPerDay} />
            <KpiStat label={input.kpiLabels.avgRestGap} value={fmtUnit(extraKpis.avgRestGap, 'm')} tooltip={input.kpiTooltips.avgRestGap} />
            <KpiStat label={input.kpiLabels.longestRestGap} value={fmtUnit(extraKpis.longestRestGap, 'm')} tooltip={input.kpiTooltips.longestRestGap} />
            <KpiStat label={input.kpiLabels.rampUp} value={fmtUnit(kpis.rhythm?.ramp_up_minutes, 'm')} tooltip={input.kpiTooltips.rampUp} />
            <KpiStat label={input.kpiLabels.weeklyConsistency} value={fmtMaybePct(kpis.rhythm?.weekly_consistency_score)} tooltip={input.kpiTooltips.weeklyConsistency} />
            <KpiStat label={input.kpiLabels.lateNightLoad} value={fmtUnit(kpis.rhythm?.late_night_active_minutes, 'm')} tooltip={input.kpiTooltips.lateNightLoad} />
            <KpiStat label={input.kpiLabels.coverage} value={fmtPctPoints(kpis.reliability?.data_coverage_percent)} tooltip={input.kpiTooltips.coverage} />
            <KpiStat label={input.kpiLabels.batchLag} value={fmtUnit(kpis.reliability?.batch_lag_minutes, 'm')} tooltip={input.kpiTooltips.batchLag} />
            <KpiStat label={input.kpiLabels.missingMinutes} value={fmtValue(kpis.reliability?.missing_minutes_estimate)} tooltip={input.kpiTooltips.missingMinutes} />
            <KpiStat label={input.kpiLabels.spoolBacklog} value={fmtInt(kpis.reliability?.spool_backlog_batches as number | undefined)} tooltip={input.kpiTooltips.spoolBacklog} />
          </div>
        </Card>
        <Card className="col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconDatabase width={13} height={13} />} title={input.cadence} tooltip={input.tooltips.cadence} />
          <RecentEvents events={data?.events} lang={lang} />
        </Card>
        <Card className="col-span-12">
          <WidgetTitle title={input.hiddenStats} tooltip={input.tooltips.hiddenStats} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <MiniStat label={input.keystrokes} value={fmtInt(totals.keystrokes)} />
            <MiniStat label={input.charsTyped} value={fmtInt(totals.chars_typed)} />
            <MiniStat label={input.copies} value={fmtInt(totals.copies)} />
            <MiniStat label={input.pastes} value={fmtInt(totals.pastes)} />
            <MiniStat label={input.charsPasted} value={fmtInt(totals.chars_pasted)} />
            <MiniStat label={input.deletes} value={fmtInt(totals.deletes)} />
            <MiniStat label={input.backspaces} value={fmtInt(totals.backspaces)} />
            <MiniStat label={input.undoRedo} value={fmtInt(totals.undo_redo)} />
            <MiniStat label={input.activeTime} value={fmtMinutes(totals.active_seconds)} />
            <MiniStat label={input.contextSwitches} value={fmtInt(totals.context_switches)} />
            <MiniStat label={input.pauses} value={fmtInt(totals.micro_pauses)} />
            <MiniStat label={input.restBlocks} value={fmtInt(totals.rest_blocks)} />
          </div>
        </Card>
      </section>

      <p className="mt-5 text-xs text-[var(--muted)]">{input.privacy}</p>
    </>
  );
}
