import { useEffect, type ReactNode } from "react";
import BarList from "../features/work-impact/components/BarList";
import KpiCard from "../features/work-impact/components/KpiCard";
import ToolTimeline from "../features/ai-sessions/components/ToolTimeline";
import { METADATA_ONLY_TOOLS, num } from "../features/ai-sessions/types";
import { InfoTooltip } from "../components/InfoTooltip";
import { useLangState } from "../i18n";
import { useAiSessionsData } from "../useData";

const copy = {
  en: {
    kpiSessions: "Conversations",
    kpiSessionsTip:
      "Distinct conversations across every assistant and host. Deduplicated on (host, tool, session id) — Antigravity keeps the same conversation under two directories.",
    kpiMessages: "Messages",
    kpiMessagesTip:
      "User + assistant turns, counted only for tools whose transcripts can be parsed. Encrypted stores contribute conversations but no message count.",
    kpiTokens: "Tokens processed",
    kpiTokensTip:
      "Codex is the only assistant that reports token accounting locally. This is cumulative context, so it is dominated by cached input re-sent every turn — not billed usage.",
    kpiHosts: "Hosts",
    kpiTools: "Assistants",
    kpiSpan: "History span",
    kpiArchive: "Archive size",
    kpiArchiveTip: "On-disk size of the transcripts backing these stats, mirrored to D:\\AiHistory.",
    toolsTitle: "Conversations by assistant",
    toolsHint: "Distinct conversations per tool, across all hosts.",
    messagesTitle: "Messages by assistant",
    messagesHint:
      "Only tools with parseable transcripts appear here. Encrypted stores are excluded rather than shown as zero.",
    timelineTitle: "Monthly volume",
    timelineHint: "Conversations started per month, stacked by assistant. Hover a column for the split.",
    projectsTitle: "Busiest projects",
    projectsHint: "Working directory of each conversation, folded case-insensitively.",
    modelsTitle: "Models",
    modelsHint: "Model reported by the assistant, where it records one.",
    hostsTitle: "By host",
    hostsHint: "Which machine the conversation happened on.",
    coverageTitle: "Coverage",
    coverageBody: (n: number, tools: string) =>
      `${n} conversations come from encrypted stores (${tools}). Their conversation counts are real, but message and token counts are not recoverable until those stores can be decoded — they are omitted rather than counted as zero.`,
    empty: "No timeline data yet",
    noData: "No AI session data yet — run `vw collect-ai-history` and drain the spool.",
    unknown: "unknown"
  },
  qc: {
    kpiSessions: "Conversations",
    kpiSessionsTip:
      "Conversations distinctes, tous assistants et postes confondus. Dédoublonnées sur (poste, outil, id) — Antigravity garde la même conversation dans deux dossiers.",
    kpiMessages: "Messages",
    kpiMessagesTip:
      "Tours utilisateur + assistant, comptés seulement pour les outils dont les transcriptions sont lisibles.",
    kpiTokens: "Jetons traités",
    kpiTokensTip:
      "Seul Codex tient une comptabilité locale des jetons. C'est du contexte cumulatif, dominé par l'entrée en cache renvoyée à chaque tour — pas la consommation facturée.",
    kpiHosts: "Postes",
    kpiTools: "Assistants",
    kpiSpan: "Période couverte",
    kpiArchive: "Taille de l'archive",
    kpiArchiveTip: "Taille sur disque des transcriptions, copiées vers D:\\AiHistory.",
    toolsTitle: "Conversations par assistant",
    toolsHint: "Conversations distinctes par outil, tous postes confondus.",
    messagesTitle: "Messages par assistant",
    messagesHint:
      "Seuls les outils aux transcriptions lisibles apparaissent. Les stockages chiffrés sont exclus plutôt qu'affichés à zéro.",
    timelineTitle: "Volume mensuel",
    timelineHint: "Conversations démarrées par mois, empilées par assistant. Survolez une colonne pour le détail.",
    projectsTitle: "Projets les plus actifs",
    projectsHint: "Répertoire de travail de chaque conversation, insensible à la casse.",
    modelsTitle: "Modèles",
    modelsHint: "Modèle rapporté par l'assistant, lorsqu'il en note un.",
    hostsTitle: "Par poste",
    hostsHint: "Machine où la conversation a eu lieu.",
    coverageTitle: "Couverture",
    coverageBody: (n: number, tools: string) =>
      `${n} conversations proviennent de stockages chiffrés (${tools}). Le nombre de conversations est exact, mais les messages et jetons ne sont pas récupérables tant que ces stockages ne sont pas décodés — ils sont omis plutôt que comptés à zéro.`,
    empty: "Pas encore de données",
    noData: "Aucune donnée — lancez `vw collect-ai-history` puis videz le spool.",
    unknown: "inconnu"
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

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

function bytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(0)} MB`;
  return `${(n / 1024).toFixed(0)} KB`;
}

function shortDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

export function AiStatsPage({ setLoading }: { setLoading: (loading: boolean) => void }) {
  const [lang] = useLangState();
  const { data, loading, error } = useAiSessionsData();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (loading) return null;
  if (error) return <div className="page-state error-line">{error}</div>;

  const t = copy[lang];
  if (!data || !data.summary?.totals?.sessions) {
    return <div className="page-state">{t.noData}</div>;
  }

  const { totals, by_tool, by_host, by_model } = data.summary;

  // Message counts are only meaningful for tools we can actually parse; the
  // encrypted ones would otherwise render as a row of zeroes.
  const parsedTools = by_tool.filter((r) => !METADATA_ONLY_TOOLS.has(r.tool) && num(r.messages) > 0);

  const toolBars = by_tool.map((r) => ({ label: r.tool, count: r.sessions }));
  const messageBars = parsedTools
    .map((r) => ({ label: r.tool, count: num(r.messages) }))
    .sort((a, b) => b.count - a.count);
  const projectBars = data.projects.map((p) => ({ label: p.project || t.unknown, count: p.sessions }));
  const modelBars = by_model.slice(0, 10).map((m) => ({ label: m.model || t.unknown, count: m.sessions }));
  const hostBars = by_host.map((h) => ({ label: h.host, count: h.sessions }));

  const encryptedTools = by_tool.filter((r) => METADATA_ONLY_TOOLS.has(r.tool)).map((r) => r.tool);

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label={t.kpiSessions} value={totals.sessions} variant="accent" tooltip={t.kpiSessionsTip} />
        <KpiCard label={t.kpiMessages} value={compact(num(totals.messages))} tooltip={t.kpiMessagesTip} />
        <KpiCard label={t.kpiTokens} value={compact(num(totals.tokens))} variant="green" tooltip={t.kpiTokensTip} />
        <KpiCard label={t.kpiTools} value={by_tool.length} />
        <KpiCard label={t.kpiHosts} value={by_host.length} />
        <KpiCard
          label={t.kpiSpan}
          value={shortDate(totals.earliest)}
          sub={`→ ${shortDate(totals.latest)}`}
        />
      </div>

      <Section title={t.timelineTitle} hint={t.timelineHint}>
        <ToolTimeline points={data.timeline} emptyLabel={t.empty} />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t.toolsTitle} hint={t.toolsHint}>
          <BarList items={toolBars} color="gold" />
        </Section>
        <Section title={t.messagesTitle} hint={t.messagesHint}>
          <BarList items={messageBars} color="cyan" logScale />
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Section title={t.projectsTitle} hint={t.projectsHint}>
          <BarList items={projectBars} color="violet" />
        </Section>
        <Section title={t.modelsTitle} hint={t.modelsHint}>
          <BarList items={modelBars} color="green" />
        </Section>
        <div className="flex flex-col gap-4">
          <Section title={t.hostsTitle} hint={t.hostsHint}>
            <BarList items={hostBars} color="cyan" />
          </Section>
          <Section title={t.kpiArchive}>
            <KpiCard label={t.kpiArchive} value={bytes(num(totals.bytes))} tooltip={t.kpiArchiveTip} />
          </Section>
        </div>
      </div>

      {totals.metadata_only > 0 && (
        <Section title={t.coverageTitle}>
          <p className="text-[13px] leading-relaxed text-vault-slate">
            {t.coverageBody(totals.metadata_only, encryptedTools.join(", "))}
          </p>
        </Section>
      )}
    </main>
  );
}
