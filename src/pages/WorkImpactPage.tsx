import type { ReactNode } from "react";
import ActivityPatterns from "../features/work-impact/components/ActivityPatterns";
import AgentSection from "../features/work-impact/components/AgentSection";
import BarList from "../features/work-impact/components/BarList";
import CommitStats from "../features/work-impact/components/CommitStats";
import ConcentrationBars from "../features/work-impact/components/ConcentrationBars";
import FilesTouched from "../features/work-impact/components/FilesTouched";
import HeatmapGrid from "../features/work-impact/components/HeatmapGrid";
import Highlights from "../features/work-impact/components/Highlights";
import KpiCard from "../features/work-impact/components/KpiCard";
import ProjectCard from "../features/work-impact/components/ProjectCard";
import TechVolumeTable from "../features/work-impact/components/TechVolumeTable";
import { getI18n } from "../features/work-impact/lib/i18n";
import { useLangState } from "../i18n";
import { useWorkImpactData } from "../useData";

import { InfoTooltip } from "../components/InfoTooltip";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-vault-surface border border-vault-border rounded-[10px] p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-vault-fg flex items-center gap-2">
          {title}
          {hint && <InfoTooltip text={hint} />}
        </h2>
      </div>
      {children}
    </section>
  );
}

import { useEffect } from "react";

export function WorkImpactPage({ setLoading }: { setLoading: (loading: boolean) => void }) {
  const [lang] = useLangState();
  const { data, loading, error } = useWorkImpactData();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (loading) return null;
  if (error || !data) return <div className="page-state error-line">{error || "No work impact data"}</div>;
  const t = getI18n(lang);
  const d = data;
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label={t.metricEvents} value={d.totalEvents} variant="accent" tooltip={t.metricEventsTooltip} />
        <KpiCard label={t.metricDays} value={d.activeDays} tooltip={t.metricDaysTooltip} />
        <KpiCard label={t.metricProjects} value={d.totalProjects} tooltip={t.metricProjectsTooltip} />
        <KpiCard label={t.metricStreak} value={d.streakCurrent} variant="green" sub={t.streakMax(d.streakLongest)} tooltip={t.metricStreakTooltip} />
        <KpiCard label={t.metricCommits} value={d.totalCommits} tooltip={t.metricCommitsTooltip} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KpiCard label={t.metricBusiestDay} value={`${d.busiestDay} (${d.busiestDayCount})`} tooltip={t.metricBusiestDayTooltip} />
        <KpiCard label={t.metricBusiestWeek} value={`${d.busiestWeek} (${d.busiestWeekCount})`} tooltip={t.metricBusiestWeekTooltip} />
      </div>
      <Section title={t.calendarTitle} hint={t.calendarHint}><HeatmapGrid daySeries={d.daySeries} t={t} /></Section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Section title={t.monthlyTitle} hint={t.monthlyHint}><BarList items={d.byMonth} color="cyan" /></Section>
        <Section title={t.kindsTitle} hint={t.kindsHint}><BarList items={d.byKind} color="violet" logScale /></Section>
        <Section title={t.projectsTitle} hint={t.projectsNote}><BarList items={d.byProject.slice(0, 8)} color="gold" /></Section>
      </div>
      <Section title={t.commitSizeTitle} hint={t.commitSizeHint}><CommitStats commitStats={d.commitStats} commitBuckets={d.commitBuckets} monthBoxes={d.monthBoxes} commitOutliers={d.commitOutliers} t={t} /></Section>
      <Section title={t.techTitle} hint={t.techHint}><TechVolumeTable techVolume={d.techVolume} t={t} /></Section>
      <Section title={t.filesTouchedTitle} hint={t.filesTouchedHint}><FilesTouched filesTouched={d.filesTouched} t={t} /></Section>
      <Section title={t.concentrationTitle} hint={t.concentrationHint}><ConcentrationBars concentration={d.concentration} t={t} /></Section>
      <Section title={t.activityTitle} hint={t.activityHint}><ActivityPatterns byHour={d.byHour} byDow={d.byDow} t={t} /></Section>
      {d.projects?.length ? <Section title={t.evidenceTitle} hint={t.evidenceHint}><div className="flex flex-col gap-[3px]">{d.projects.map((project) => <ProjectCard key={project.name} project={project} t={t} />)}</div></Section> : null}
      <Section title={t.agentTitle} hint={t.agentHint}><AgentSection agent={d.agentData} t={t} /></Section>
      {d.highlights ? <Section title={t.highlightsTitle} hint={t.highlightsHint}><Highlights highlights={d.highlights} t={t} /></Section> : null}
    </main>
  );
}
