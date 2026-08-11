import { useEffect, type ReactNode } from "react";
import BarList from "../features/work-impact/components/BarList";
import KpiCard from "../features/work-impact/components/KpiCard";
import LatencyHistogram from "../features/ai-runs/components/LatencyHistogram";
import ModelLeaderboard from "../features/ai-runs/components/ModelLeaderboard";
import RecentRuns from "../features/ai-runs/components/RecentRuns";
import RunErrorTable from "../features/ai-runs/components/RunErrorTable";
import RunTimeline from "../features/ai-runs/components/RunTimeline";
import {
  failureRate,
  formatCost,
  formatMs,
  formatTokens,
  maybeNum,
  num
} from "../features/ai-runs/types";
import { InfoTooltip } from "../components/InfoTooltip";
import { useLangState } from "../i18n";
import { useAiRunsData } from "../useData";

const copy = {
  en: {
    kpiRuns: "Model runs",
    kpiRunsTip:
      "One row per invocation — a completion, an embedding, a diffusion job. Not the same as a conversation: see AI Stats for those.",
    kpiTokens: "Tokens",
    kpiTokensTip:
      "Input + output across every run. Unlike the session tab, this is per-invocation accounting, so it reflects billed usage rather than cumulative context.",
    kpiP95: "p95 latency",
    kpiP95Tip:
      "95th percentile end-to-end duration. Tail latency, not the average — the average hides the runs that make something feel broken.",
    kpiTtft: "p50 TTFT",
    kpiTtftTip:
      "Median time to first token: how long before a streamed response starts moving. Measured only on runs that reported a first token.",
    kpiFailures: "Failure rate",
    kpiFailuresTip:
      "Errors + timeouts over runs that actually reached a model. Budget rejections and cancellations are excluded — those are policy outcomes, not faults.",
    kpiCost: "Spend",
    kpiCostTip: "Sum of reported cost. Runs on local weights report zero, not null.",
    kpiCompute: "Compute time",
    kpiModels: "Distinct models",
    timelineTitle: "Run volume",
    timelineHint:
      "Runs per bucket, stacked by provider. The red ribbon under a column is the failures in that bucket.",
    latencyTitle: "Latency distribution",
    latencyHint:
      "End-to-end duration across fixed buckets. Bars are square-root scaled so the slow tail stays visible next to the bulk.",
    modelsTitle: "Models",
    modelsHint: "Volume, tail latency, decode speed, spend and failure rate per model.",
    providersTitle: "By provider",
    providersHint: "Who served the run — HuggingFace, NVIDIA NIM/NGC, Ollama, ComfyUI, local weights.",
    runtimesTitle: "By runtime",
    runtimesHint: "How it executed: hf-inference, vllm, transformers, diffusers, comfyui, ollama.",
    tasksTitle: "By task",
    tasksHint: "Chat, embedding, image, audio, and the rest.",
    projectsTitle: "By project",
    projectsHint: "Which VaultWares project issued the run.",
    hostsTitle: "By host",
    hostsHint: "Machine the run executed on.",
    errorsTitle: "Failures",
    errorsHint: "Grouped by exception class. Hover a row for the last message seen.",
    recentTitle: "Recent runs",
    recentHint: "The 50 newest invocations. Hover a model for host, GPU and peak VRAM.",
    vramTitle: "Hardware",
    kpiVram: "Peak VRAM",
    kpiVramTip: "Highest per-run peak VRAM observed. Sampled via NVML where a GPU is present.",
    kpiGpuUtil: "Avg GPU util",
    empty: "No data in this window",
    noData:
      "No model-run telemetry yet — instrument a call site with vaultwares_adk.telemetry and drain the run spool.",
    labels: {
      model: "Model", runs: "Runs", p50: "p50", p95: "p95", tps: "tok/s",
      tokens: "Tokens", cost: "Cost", failures: "Fail %",
      errorClass: "Error class", status: "Status", models: "Models", last: "Last",
      time: "Time", provider: "Provider", task: "Task", duration: "Duration", ttft: "TTFT"
    },
    failures: "failures"
  },
  qc: {
    kpiRuns: "Exécutions",
    kpiRunsTip:
      "Une ligne par invocation — une complétion, un plongement, une job de diffusion. Différent d'une conversation : voir Stats IA pour celles-là.",
    kpiTokens: "Jetons",
    kpiTokensTip:
      "Entrée + sortie sur toutes les exécutions. Contrairement à l'onglet conversations, c'est une comptabilité par invocation, donc proche de l'usage facturé.",
    kpiP95: "Latence p95",
    kpiP95Tip:
      "95e centile de la durée totale. La queue de distribution, pas la moyenne — la moyenne cache les exécutions qui donnent l'impression que ça brise.",
    kpiTtft: "TTFT p50",
    kpiTtftTip:
      "Temps médian jusqu'au premier jeton : combien de temps avant qu'une réponse en continu démarre.",
    kpiFailures: "Taux d'échec",
    kpiFailuresTip:
      "Erreurs + délais dépassés sur les exécutions qui ont vraiment atteint un modèle. Les refus de budget et les annulations sont exclus — ce sont des décisions, pas des fautes.",
    kpiCost: "Dépenses",
    kpiCostTip: "Somme des coûts rapportés. Les poids locaux rapportent zéro, pas nul.",
    kpiCompute: "Temps de calcul",
    kpiModels: "Modèles distincts",
    timelineTitle: "Volume d'exécutions",
    timelineHint:
      "Exécutions par intervalle, empilées par fournisseur. Le ruban rouge sous une colonne représente les échecs.",
    latencyTitle: "Distribution des latences",
    latencyHint:
      "Durée totale par tranches fixes. Échelle en racine carrée pour que la queue lente reste visible.",
    modelsTitle: "Modèles",
    modelsHint: "Volume, latence de queue, vitesse de décodage, dépenses et taux d'échec par modèle.",
    providersTitle: "Par fournisseur",
    providersHint: "Qui a servi l'exécution — HuggingFace, NVIDIA NIM/NGC, Ollama, ComfyUI, poids locaux.",
    runtimesTitle: "Par moteur",
    runtimesHint: "Comment ça s'est exécuté : hf-inference, vllm, transformers, diffusers, comfyui, ollama.",
    tasksTitle: "Par tâche",
    tasksHint: "Conversation, plongement, image, audio, et le reste.",
    projectsTitle: "Par projet",
    projectsHint: "Quel projet VaultWares a lancé l'exécution.",
    hostsTitle: "Par poste",
    hostsHint: "Machine où l'exécution a eu lieu.",
    errorsTitle: "Échecs",
    errorsHint: "Groupés par classe d'exception. Survolez une ligne pour le dernier message.",
    recentTitle: "Exécutions récentes",
    recentHint: "Les 50 plus récentes. Survolez un modèle pour le poste, le GPU et la VRAM maximale.",
    vramTitle: "Matériel",
    kpiVram: "VRAM maximale",
    kpiVramTip: "Plus haut pic de VRAM observé par exécution. Échantillonné via NVML lorsqu'un GPU est présent.",
    kpiGpuUtil: "Util. GPU moy.",
    empty: "Aucune donnée dans cette fenêtre",
    noData:
      "Aucune télémétrie d'exécution — instrumentez un point d'appel avec vaultwares_adk.telemetry puis videz le spool.",
    labels: {
      model: "Modèle", runs: "Exéc.", p50: "p50", p95: "p95", tps: "jet/s",
      tokens: "Jetons", cost: "Coût", failures: "% échec",
      errorClass: "Classe d'erreur", status: "État", models: "Modèles", last: "Dernier",
      time: "Heure", provider: "Fournisseur", task: "Tâche", duration: "Durée", ttft: "TTFT"
    },
    failures: "échecs"
  }
};

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

function duration(seconds: number): string {
  if (seconds >= 86400) return `${(seconds / 86400).toFixed(1)}d`;
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`;
  if (seconds >= 60) return `${(seconds / 60).toFixed(0)}m`;
  return `${seconds.toFixed(0)}s`;
}

export function ModelRunsPage({ setLoading }: { setLoading: (loading: boolean) => void }) {
  const [lang] = useLangState();
  const { data, loading, error } = useAiRunsData(30);

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (loading) return null;
  if (error) return <div className="page-state error-line">{error}</div>;

  const t = copy[lang];
  if (!data || !data.summary?.totals?.runs) {
    return <div className="page-state">{t.noData}</div>;
  }

  const { totals, by_provider, by_runtime, by_model, by_task, by_project, by_host } = data.summary;

  const fail = failureRate(totals);
  const gpuUtil = maybeNum(totals.avg_gpu_util);
  const vram = maybeNum(totals.peak_vram_mb);

  const toBars = (rows: typeof by_provider) => rows.map((r) => ({ label: r.key, count: r.runs }));

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label={t.kpiRuns} value={totals.runs} variant="accent" tooltip={t.kpiRunsTip} />
        <KpiCard label={t.kpiTokens} value={formatTokens(totals.total_tokens)} tooltip={t.kpiTokensTip} />
        <KpiCard label={t.kpiP95} value={formatMs(totals.p95_ms)} tooltip={t.kpiP95Tip} />
        <KpiCard label={t.kpiTtft} value={formatMs(totals.p50_ttft_ms)} tooltip={t.kpiTtftTip} />
        <KpiCard
          label={t.kpiFailures}
          value={fail === null ? "—" : `${(fail * 100).toFixed(1)}%`}
          variant={fail !== null && fail >= 0.05 ? "red" : "green"}
          tooltip={t.kpiFailuresTip}
        />
        <KpiCard label={t.kpiCost} value={formatCost(totals.cost_usd)} tooltip={t.kpiCostTip} />
      </div>

      <Section title={t.timelineTitle} hint={t.timelineHint}>
        <RunTimeline
          points={data.timeline}
          bucket={data.timelineBucket}
          emptyLabel={t.empty}
          failuresLabel={t.failures}
        />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title={t.latencyTitle} hint={t.latencyHint}>
          <LatencyHistogram buckets={data.latency} emptyLabel={t.empty} />
        </Section>
        <Section title={t.vramTitle}>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label={t.kpiVram}
              value={vram === null ? "—" : `${(vram / 1024).toFixed(1)} GB`}
              tooltip={t.kpiVramTip}
            />
            <KpiCard
              label={t.kpiGpuUtil}
              value={gpuUtil === null ? "—" : `${gpuUtil.toFixed(0)}%`}
            />
            <KpiCard label={t.kpiCompute} value={duration(num(totals.compute_seconds))} />
            <KpiCard label={t.kpiModels} value={totals.models} />
          </div>
        </Section>
      </div>

      <Section title={t.modelsTitle} hint={t.modelsHint}>
        <ModelLeaderboard rows={by_model} labels={t.labels} emptyLabel={t.empty} />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Section title={t.providersTitle} hint={t.providersHint}>
          <BarList items={toBars(by_provider)} color="gold" />
        </Section>
        <Section title={t.runtimesTitle} hint={t.runtimesHint}>
          <BarList items={toBars(by_runtime)} color="cyan" />
        </Section>
        <Section title={t.tasksTitle} hint={t.tasksHint}>
          <BarList items={toBars(by_task)} color="violet" />
        </Section>
        <Section title={t.hostsTitle} hint={t.hostsHint}>
          <BarList items={toBars(by_host)} color="green" />
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title={t.projectsTitle} hint={t.projectsHint}>
          <BarList items={toBars(by_project)} color="cyan" />
        </Section>
        <Section title={t.errorsTitle} hint={t.errorsHint}>
          <RunErrorTable rows={data.errors} labels={t.labels} emptyLabel={t.empty} />
        </Section>
      </div>

      <Section title={t.recentTitle} hint={t.recentHint}>
        <RecentRuns rows={data.recent} labels={t.labels} emptyLabel={t.empty} />
      </Section>
    </main>
  );
}
