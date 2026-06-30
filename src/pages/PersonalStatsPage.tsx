import { Card } from '../components/Card';
import { Led } from '../components/Led';
import type { ReactNode } from 'react';
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
const fmtValue = (value: unknown) => (typeof value === 'number' ? fmt1(value) : String(value || '-'));
const fmtUnit = (value: unknown, unit: string) => (typeof value === 'number' ? `${fmt1(value)}${unit}` : '-');

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

function MetricCard({ label, value, tooltip, sub }: { label: string; value: string; tooltip: string; sub?: string }) {
  return (
    <Card className="col-span-3 max-lg:col-span-6 max-md:col-span-12">
      <div className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
        <span>{label}</span>
        <InfoTooltip text={tooltip} />
      </div>
      <div className="mt-2 text-[28px] leading-tight font-bold text-[var(--fg)]">{value}</div>
      {sub ? <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div> : null}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,black)] px-3 py-2 min-w-0">
      <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider truncate">{label}</div>
      <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--fg)] truncate">{value}</div>
    </div>
  );
}

function BarRows({
  rows,
  empty,
  formatName = (name) => name,
}: {
  rows?: { name: string; count: number; category?: string }[];
  empty: string;
  formatName?: (name: string, row: { name: string; count: number; category?: string }) => string;
}) {
  const max = Math.max(1, ...(rows || []).map((row) => row.count || 0));
  if (!rows || rows.length === 0) {
    return <div className="text-xs text-[var(--muted)] italic">{empty}</div>;
  }
  return (
    <div className="space-y-2">
      {rows.slice(0, 10).map((row) => (
        <div key={row.name} className="grid grid-cols-[minmax(84px,150px)_1fr_60px] items-center gap-2">
          <div className="text-xs text-[var(--fg)] truncate" title={formatName(row.name, row)}>{formatName(row.name, row)}</div>
          <div className="h-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.max(2, ((row.count || 0) / max) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-right tabular-nums text-[var(--muted)]">{fmtInt(row.count)}</div>
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
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            {dict.input.keysShort}={String(event.metrics?.keystrokes || 0)} {dict.input.clicks.toLowerCase()}={String(event.metrics?.clicks || 0)} {dict.input.focusShort}={String(event.dimensions?.focus_category || 'unknown')} {dict.input.appShort}={String(event.dimensions?.window_name || 'unknown')}
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
  if (col && row) return `${input.hotspotCol} ${col}, ${input.hotspotRow} ${row}`;
  return name;
}

function statusLabel(status: string | undefined, input: typeof I18N.en.input) {
  if (status === 'online') return input.statusOnline;
  if (status === 'stale') return input.statusStale;
  if (status === 'missing') return input.statusMissing;
  return input.statusUnavailable;
}

export function PersonalStatsPage() {
  const { data, loading, error } = useInputTrackerData();
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
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <StatusPill status={data?.status} label={statusLabel(data?.status, input)} source={data?.source || 'vaultwares-api'} tooltip={input.tooltips.status} />
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
        <MetricCard label={input.latest} value={data?.latest_received_at ? new Date(data.latest_received_at).toLocaleTimeString() : '-'} tooltip={input.tooltips.latest} sub={`${data?.window_hours || 24}h ${input.windowSuffix}`} />
        <MetricCard label={input.wpm} value={fmt1(derived.wpm)} tooltip={input.tooltips.wpm} sub={input.keyBursts} />
        <MetricCard label={input.cpm} value={fmt1(derived.cpm)} tooltip={input.tooltips.cpm} sub={`${fmtInt(totals.chars_typed)} ${input.chars}`} />
        <MetricCard label={input.correction} value={fmtPct(derived.correction_ratio)} tooltip={input.tooltips.correction} sub={`${fmtInt(totals.backspaces)} ${input.backspaces.toLowerCase()}`} />
        <MetricCard label={input.clickTravel} value={fmt1(derived.click_to_travel_ratio)} tooltip={input.tooltips.clickTravel} sub={`${fmtInt(totals.clicks)} ${input.clicks.toLowerCase()} / ${fmt1(totals.mouse_distance_m)}m`} />
        <MetricCard label={input.shortcuts} value={fmtInt(totals.shortcut_count)} tooltip={input.tooltips.shortcuts} sub={`${fmtInt(totals.saves)} ${input.saves} / ${fmtInt(totals.undo_redo)} ${input.undoRedo.toLowerCase()}`} />
        <MetricCard label={input.pauses} value={fmtInt(totals.micro_pauses)} tooltip={input.tooltips.pauses} sub={`${fmtInt(totals.rest_blocks)} ${input.restBlocks.toLowerCase()}`} />
        <MetricCard label={input.contextSwitches} value={fmtInt(contextSwitches)} tooltip={input.tooltips.contextSwitches} sub={fmtMinutes(totals.active_seconds)} />
        <MetricCard label={input.flowStability} value={fmt1(flowStability)} tooltip={input.tooltips.flowStability} sub={input.flowMinutes} />
      </section>

      <section className="grid grid-cols-12 gap-3 mt-5">
        <Card className="col-span-4 max-lg:col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconZap width={13} height={13} />} title={input.latency} tooltip={input.tooltips.latency} />
          <BarRows rows={data?.key_latency_buckets} empty={input.noLatency} formatName={(name) => humanLatency(name, input.latencyLabels)} />
        </Card>
        <Card className="col-span-4 max-lg:col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconPieChart width={13} height={13} />} title={input.focus} tooltip={input.tooltips.focus} />
          <BarRows rows={data?.focus_categories} empty={input.noFocus} />
        </Card>
        <Card className="col-span-4 max-lg:col-span-12">
          <WidgetTitle icon={<IconBarChart width={13} height={13} />} title={input.hotspots} tooltip={input.tooltips.hotspots} />
          <BarRows rows={data?.click_hotspots} empty={input.noClickSamples} formatName={(name) => humanHotspot(name, input)} />
        </Card>
        <Card className="col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconPieChart width={13} height={13} />} title={input.focusWindows} tooltip={input.tooltips.focusWindows} />
          <BarRows
            rows={data?.focus_windows}
            empty={input.noFocusWindows}
            formatName={(name, row) => `${row.category || 'unknown'} · ${name}`}
          />
        </Card>
        <Card className="col-span-6 max-md:col-span-12">
          <WidgetTitle icon={<IconBarChart width={13} height={13} />} title={input.kpiSignals} tooltip={input.tooltips.kpiSignals} />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <MiniStat label={input.kpiLabels.contextSwitchesPerHour} value={fmtValue(kpis.focus?.context_switches_per_hour)} />
            <MiniStat label={input.kpiLabels.longestFocusBlock} value={fmtUnit(kpis.focus?.longest_focus_block_minutes, 'm')} />
            <MiniStat label={input.kpiLabels.avgRecovery} value={fmtUnit(kpis.focus?.avg_switch_recovery_seconds, 's')} />
            <MiniStat label={input.kpiLabels.activeRestBalance} value={typeof activeRestBalance === 'number' ? `${fmt1(activeRestBalance)}:1` : '-'} />
            <MiniStat label={input.kpiLabels.otherUnknownShare} value={fmtMaybePct(focusShare(['other', 'unknown']))} />
            <MiniStat label={input.kpiLabels.communicationShare} value={fmtMaybePct(focusShare(['communication']))} />
            <MiniStat label={input.kpiLabels.pasteShare} value={fmtMaybePct(kpis.typing?.paste_share)} />
            <MiniStat label={input.kpiLabels.shortcutDensity} value={fmtValue(kpis.typing?.shortcut_density_per_1000_keys)} />
            <MiniStat label={input.kpiLabels.saveCadence} value={fmtUnit(kpis.typing?.save_cadence_minutes, 'm')} />
            <MiniStat label={input.kpiLabels.undoRedoRate} value={fmtValue(kpis.typing?.undo_redo_per_1000_keys)} />
            <MiniStat label={input.kpiLabels.clicksPerMinute} value={fmtValue(kpis.pointer?.clicks_per_active_minute)} />
            <MiniStat label={input.kpiLabels.scrollsPerMinute} value={fmtValue(kpis.pointer?.scrolls_per_active_minute)} />
            <MiniStat label={input.kpiLabels.hotspotShare} value={fmtMaybePct(kpis.pointer?.hotspot_top_share)} />
            <MiniStat label={input.kpiLabels.bestHour} value={fmtValue(kpis.rhythm?.best_hour_utc)} />
            <MiniStat label={input.kpiLabels.bestDay} value={fmtValue(kpis.rhythm?.best_day)} />
            <MiniStat label={input.kpiLabels.rampUp} value={fmtUnit(kpis.rhythm?.ramp_up_minutes, 'm')} />
            <MiniStat label={input.kpiLabels.weeklyConsistency} value={fmtMaybePct(kpis.rhythm?.weekly_consistency_score)} />
            <MiniStat label={input.kpiLabels.lateNightLoad} value={fmtUnit(kpis.rhythm?.late_night_active_minutes, 'm')} />
            <MiniStat label={input.kpiLabels.coverage} value={fmtPctPoints(kpis.reliability?.data_coverage_percent)} />
            <MiniStat label={input.kpiLabels.batchLag} value={fmtUnit(kpis.reliability?.batch_lag_minutes, 'm')} />
            <MiniStat label={input.kpiLabels.missingMinutes} value={fmtValue(kpis.reliability?.missing_minutes_estimate)} />
            <MiniStat label={input.kpiLabels.spoolBacklog} value={fmtInt(kpis.reliability?.spool_backlog_batches as number | undefined)} />
          </div>
        </Card>
        <Card className="col-span-6 max-md:col-span-12">
          <WidgetTitle title={input.mouse} tooltip={input.tooltips.mouse} />
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
            <MiniStat label={input.clicks} value={fmtInt(totals.clicks)} />
            <MiniStat label={input.scroll} value={fmtInt(totals.scroll_ticks)} />
            <MiniStat label={input.travel} value={`${fmt1(totals.mouse_distance_m)}m`} />
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
